using System.Buffers.Binary;
using System.Diagnostics;
using System.IO.Pipes;
using System.Runtime.InteropServices;
using System.Runtime.Versioning;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.Win32.SafeHandles;

namespace LocalizationHelper;

/// <summary>A separate, explicit opt-in process mode; the resource transaction protocol stays unchanged.</summary>
internal sealed partial class MarketHost : IDisposable {
    private const string SupportedBuild = "26673341";
    private const string SupportedHash = "c86e4b153a93e573e7d800dcdf01a79b3392a52f73e29ca48d2bd8297ad28031";
    private const int MaxPacket = 16 * 1024 * 1024;
    private static readonly UTF8Encoding Utf8 = new(false, true);
    private static readonly JsonSerializerOptions Json = new() { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.Create(System.Text.Unicode.UnicodeRanges.All) };
    private readonly CancellationTokenSource lifetime = new();
    private readonly SemaphoreSlim commands = new(1, 1);
    private NamedPipeServerStream? pipe;
    private Process? gameProcess;
    private Process? parentProcess;
    private string state = "disabled", reason = "", mode = "", gameDirectory = "", storageRoot = "";
    private string rulesHash = "", managedIdentity = "";
    private int gamePid;
    private JsonObject? nativeState;

    public static int Run() {
        Console.InputEncoding = Utf8;
        Console.OutputEncoding = Utf8;
        using var host = new MarketHost();
        try { return host.RunAsync().GetAwaiter().GetResult(); }
        catch (Exception error) {
            WriteResult(false, host.Snapshot(), ErrorCode(error), PublicMessage(error));
            return 1;
        }
    }

    private async Task<int> RunAsync() {
        parentProcess = FindParent();
        var monitor = MonitorAsync();
        try {
            while (!lifetime.IsCancellationRequested) {
                string? line;
                try { line = await Console.In.ReadLineAsync(lifetime.Token); }
                catch (OperationCanceledException) { break; }
                if (line == null) break;
                await commands.WaitAsync(lifetime.Token);
                try {
                    if (line.Length > MaxPacket || Utf8.GetByteCount(line) > MaxPacket) throw new UserError("市集组件请求过大");
                    var request = JsonNode.Parse(line)?.AsObject() ?? throw new UserError("市集组件请求无效");
                    if (request["marketProtocolVersion"]?.GetValue<int>() != 1) throw new UserError("市集组件协议版本不兼容");
                    string operation = RequiredString(request, "operation", 32);
                    if (operation == "self-test") {
                        var result = JsonSerializer.SerializeToNode(SelfTest())!.AsObject();
                        if (request.ContainsKey("rules")) result["validatedRules"] = ValidateRules(request["rules"]).Count;
                        WriteResult(true, result); continue;
                    }
                    if (!OperatingSystem.IsWindows() || RuntimeInformation.ProcessArchitecture != Architecture.X64) throw new UserError("市集翻译仅支持 Windows x64");
                    switch (operation) {
                        case "enable": await EnableAsync(request); break;
                        case "resume": await EnableAsync(request, resumeOnly: true); break;
                        case "disable": await StopAsync(); break;
                        case "status": await RefreshAsync(); break;
                        default: throw new UserError("未知的市集组件操作");
                    }
                    WriteResult(true, Snapshot());
                } catch (Exception error) {
                    await StopAsync();
                    state = "error"; reason = PublicMessage(error);
                    WriteResult(false, Snapshot(), ErrorCode(error), reason);
                } finally { commands.Release(); }
            }
        } finally {
            lifetime.Cancel();
            await monitor;
            await commands.WaitAsync();
            try { await StopAsync(); } finally { commands.Release(); }
        }
        return 0;
    }

    private async Task MonitorAsync() {
        long checkedAt = Stopwatch.GetTimestamp();
        try {
            while (!lifetime.IsCancellationRequested) {
                await Task.Delay(500, lifetime.Token);
                if (parentProcess is { HasExited: true }) { lifetime.Cancel(); break; }
                if (gameProcess == null) continue;
                await commands.WaitAsync(lifetime.Token);
                try {
                    if (gameProcess == null) continue;
                    if (gameProcess.HasExited) { await StopAsync(); reason = "游戏已退出"; }
                    else if (Stopwatch.GetElapsedTime(checkedAt) >= TimeSpan.FromSeconds(2)) {
                        checkedAt = Stopwatch.GetTimestamp();
                        try { CheckManagedIdentity(); }
                        catch (Exception error) {
                            await StopAsync(); state = "error"; reason = PublicMessage(error);
                        }
                    }
                }
                finally { commands.Release(); }
            }
        } catch (OperationCanceledException) { }
        catch { lifetime.Cancel(); }
    }

    [SupportedOSPlatform("windows")]
    private async Task EnableAsync(JsonObject request, bool resumeOnly = false) {
        string requestedMode = ValidateMode(RequiredString(request, "mode", 32));
        string requestedGame = AbsoluteDirectory(request, "gameDirectory");
        string requestedStorage = AbsoluteDirectory(request, "storageRoot");
        var rules = ValidateRules(request["rules"]);
        string requestedRulesHash = RulesHash(rules);
        string requestedIdentity = ReadManagedIdentity(requestedGame, requestedStorage);
        ValidateManagedGame(requestedGame, requestedStorage, requestedMode);
        if (ReadManagedIdentity(requestedGame, requestedStorage) != requestedIdentity) throw new UserError("核对期间游戏或汉化状态发生变化");
        using var candidate = FindUniqueGame(requestedGame);
        var modules = ReadModules(candidate);
        RejectConflictingHooks(modules);
        string dllPath = Path.Combine(AppContext.BaseDirectory, "MarketLocalizationHook.dll");
        OrdinaryPath(dllPath);
        RequireX64Image(dllPath);
        var ownModule = modules.FirstOrDefault(module => string.Equals(Path.GetFileName(module.FileName), "MarketLocalizationHook.dll", StringComparison.OrdinalIgnoreCase));
        bool inject = ShouldInject(resumeOnly, ownModule?.FileName, dllPath);

        if (pipe?.IsConnected == true && gamePid == candidate.Id && mode == requestedMode &&
            SamePath(gameDirectory, requestedGame) && SamePath(storageRoot, requestedStorage) && managedIdentity == requestedIdentity) {
            if (resumeOnly) ValidateResumeState(await ExchangeAsync(new JsonObject { ["operation"] = "status" }), requestedMode);
            if (rulesHash == requestedRulesHash) {
                nativeState = await ExchangeAsync(new JsonObject { ["operation"] = "status" });
                if (nativeState["state"]?.GetValue<string>() == "active") { state = "active"; reason = ""; return; }
            }
            nativeState = await ExchangeAsync(new JsonObject { ["operation"] = "configure", ["mode"] = requestedMode, ["rules"] = rules });
            rulesHash = requestedRulesHash;
            if (ReadManagedIdentity(gameDirectory, storageRoot) != requestedIdentity) throw new UserError("启用期间游戏或汉化状态发生变化");
            managedIdentity = requestedIdentity;
            state = "active"; reason = "";
            return;
        }
        await StopAsync();
        var server = MarketPipe.Create($"PoEHelper.Market.{candidate.Id}");
        pipe = server;
        gameProcess = Process.GetProcessById(candidate.Id);
        gamePid = candidate.Id; mode = requestedMode; gameDirectory = requestedGame; storageRoot = requestedStorage;
        state = "connecting";
        using var connectTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        Task connection = server.WaitForConnectionAsync(connectTimeout.Token);
        try {
            if (inject) Inject(candidate, dllPath);
            await connection;
            if (!GetNamedPipeClientProcessId(server.SafePipeHandle, out uint clientPid) || clientPid != candidate.Id)
                throw new UserError("市集组件管道连接身份不匹配");
            // Recheck disk state after injection/connection, before enabling any replacement.
            ValidateManagedGame(gameDirectory, storageRoot, mode);
            if (resumeOnly) ValidateResumeState(await ExchangeAsync(new JsonObject { ["operation"] = "status" }), mode);
            // The loaded DLL rejects configure when its retained language or canonical rules differ.
            nativeState = await ExchangeAsync(new JsonObject { ["operation"] = "configure", ["mode"] = mode, ["rules"] = rules });
            rulesHash = requestedRulesHash;
            if (ReadManagedIdentity(gameDirectory, storageRoot) != requestedIdentity) throw new UserError("启用期间游戏或汉化状态发生变化");
            managedIdentity = requestedIdentity;
            state = "active"; reason = "";
        } catch {
            connectTimeout.Cancel();
            try { await connection; } catch { }
            throw;
        }
    }

    private sealed class ResumeUnavailable(string message) : Exception(message);
    private static bool ShouldInject(bool resumeOnly, string? loadedPath, string dllPath) {
        if (loadedPath != null && !SamePath(loadedPath, dllPath)) throw new UserError("游戏已加载其他位置的市集组件，请重启游戏后重试");
        if (resumeOnly && loadedPath == null) throw new ResumeUnavailable("当前游戏尚未加载市集翻译，重启游戏后生效");
        return loadedPath == null;
    }
    private static void ValidateResumeState(JsonObject snapshot, string requestedMode) {
        string? retainedMode = snapshot["mode"] is JsonValue modeValue && modeValue.TryGetValue<string>(out var text) ? text : null;
        string? retainedState = snapshot["state"] is JsonValue stateValue && stateValue.TryGetValue<string>(out var stateText) ? stateText : null;
        if (retainedMode is not ("simplified" or "traditional") || retainedState is not ("active" or "disabled") || snapshot["hits"] is not JsonObject)
            throw new ResumeUnavailable("游戏中没有可接续的市集翻译状态，请重启游戏后重试");
        if (retainedMode != requestedMode) throw new UserError("当前游戏缓存的市集语言与助手不一致，请重启游戏后重试");
    }

    private async Task RefreshAsync() {
        if (pipe == null || gameProcess == null) return;
        if (gameProcess.HasExited) { await StopAsync(); reason = "游戏已退出"; return; }
        CheckManagedIdentity();
        nativeState = await ExchangeAsync(new JsonObject { ["operation"] = "status" });
        state = nativeState["state"]?.GetValue<string>() ?? state;
    }

    private async Task StopAsync() {
        try {
            if (pipe?.IsConnected == true && gameProcess is { HasExited: false })
                await ExchangeAsync(new JsonObject { ["operation"] = "disable" }, TimeSpan.FromSeconds(2));
        } catch { /* Closing the control pipe also asks the DLL to return to passthrough. */ }
        finally {
            pipe?.Dispose(); pipe = null;
            gameProcess?.Dispose(); gameProcess = null;
            gamePid = 0; mode = ""; gameDirectory = ""; storageRoot = ""; nativeState = null;
            rulesHash = ""; managedIdentity = "";
            state = "disabled"; reason = "";
        }
    }

    private async Task<JsonObject> ExchangeAsync(JsonObject request, TimeSpan? timeout = null) {
        if (pipe?.IsConnected != true) throw new UserError("市集组件连接已中断");
        using var deadline = new CancellationTokenSource(timeout ?? TimeSpan.FromSeconds(5));
        await WritePacketAsync(pipe, request, deadline.Token);
        var response = await ReadPacketAsync(pipe, deadline.Token);
        if (response["success"]?.GetValue<bool>() != true) {
            string message = response["reason"]?.GetValue<string>() ?? "市集组件未能完成操作";
            if (message == "restart game before changing market language or dictionary") message = "当前游戏缓存的市集语言或词库与助手不一致，请重启游戏后重试";
            throw new UserError(message);
        }
        return response;
    }

    private JsonObject Snapshot() => new() {
        ["state"] = state, ["mode"] = string.IsNullOrEmpty(mode) ? null : mode,
        ["pid"] = gamePid == 0 ? null : gamePid, ["reason"] = reason, ["native"] = nativeState?.DeepClone()
    };

    private static void WriteResult(bool success, object data, string? code = null, string? message = null) => Console.WriteLine(JsonSerializer.Serialize(new {
        marketProtocolVersion = 1, type = "result", success, data,
        error = success ? null : new { code, message }
    }, Json));
    private static string ErrorCode(Exception error) => error is ResumeUnavailable ? "MARKET_RESUME_UNAVAILABLE" : error is OperationCanceledException or TimeoutException ? "MARKET_TIMEOUT" : "MARKET_UNAVAILABLE";
    private static string PublicMessage(Exception error) => error is UserError or ResumeUnavailable ? error.Message : error is OperationCanceledException or TimeoutException
        ? "市集组件连接或操作超时，已停止本次会话" : "市集组件校验或通信失败，已停止本次会话";

    private static string RequiredString(JsonObject obj, string name, int max) {
        if (obj[name] is not JsonValue value || !value.TryGetValue<string>(out var result) || string.IsNullOrWhiteSpace(result)
            || result.Length > max || result.Contains('\0')) throw new UserError($"市集组件参数 {name} 无效");
        return result;
    }
    private static string ValidateMode(string value) => value is "simplified" or "traditional" ? value : throw new UserError("市集翻译模式无效");
    private static string RulesHash(JsonArray rules) {
        using var bytes = new MemoryStream();
        using (var writer = new Utf8JsonWriter(bytes, new JsonWriterOptions { Encoder = Json.Encoder })) {
            WriteCanonical(writer, rules);
        }
        return Convert.ToHexString(SHA256.HashData(bytes.ToArray())).ToLowerInvariant();
    }
    private static void WriteCanonical(Utf8JsonWriter writer, JsonNode? node) {
        switch (node) {
            case JsonObject obj:
                writer.WriteStartObject();
                foreach (var pair in obj.OrderBy(pair => pair.Key, StringComparer.Ordinal)) {
                    writer.WritePropertyName(pair.Key); WriteCanonical(writer, pair.Value);
                }
                writer.WriteEndObject(); break;
            case JsonArray array:
                writer.WriteStartArray(); foreach (var item in array) WriteCanonical(writer, item); writer.WriteEndArray(); break;
            case JsonValue value when value.TryGetValue<string>(out string? text): writer.WriteStringValue(text); break;
            case null: writer.WriteNullValue(); break;
            default: node.WriteTo(writer); break;
        }
    }

    private void CheckManagedIdentity() {
        if (ReadManagedIdentity(gameDirectory, storageRoot) == managedIdentity) return;
        // Hash large game files only after a cheap file-identity change, then stop the old dictionary even if the new state is valid.
        ValidateManagedGame(gameDirectory, storageRoot, mode);
        throw new UserError("游戏或汉化状态已变化，旧市集翻译已停用，请重新启用");
    }
    private static string ReadManagedIdentity(string game, string storage) {
        string manifest = Path.Combine(Directory.GetParent(game)!.Parent!.FullName, "appmanifest_238960.acf");
        string journal = Path.Combine(storage, "transaction.json");
        return string.Join('|', new[] {
            FileIdentity(Path.Combine(storage, "transaction-active.json")), FileIdentity(manifest),
            FileIdentity(Path.Combine(game, "Bundles2", "_.index.bin")), FileIdentity(Path.Combine(game, "PathOfExileSteam.exe")),
            File.Exists(journal) ? FileIdentity(journal) : "no-journal"
        });
    }
    private static string FileIdentity(string path) {
        OrdinaryPath(path);
        using var file = File.OpenHandle(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
        if (!GetFileInformationByHandle(file, out var info)) throw new UserError("无法核实市集所需文件的身份");
        return $"{info.VolumeSerialNumber:x8}:{info.FileIndexHigh:x8}{info.FileIndexLow:x8}:{info.FileSizeHigh:x8}{info.FileSizeLow:x8}:"
            + $"{info.CreationTime.High:x8}{info.CreationTime.Low:x8}:{info.LastWriteTime.High:x8}{info.LastWriteTime.Low:x8}:{info.Attributes:x8}";
    }
    private static string AbsoluteDirectory(JsonObject request, string key) {
        string value = RequiredString(request, key, 32767);
        if (!Path.IsPathFullyQualified(value)) throw new UserError("市集组件目录必须为绝对路径");
        string result = Path.GetFullPath(value).TrimEnd(Path.DirectorySeparatorChar);
        if (!Directory.Exists(result)) throw new UserError("市集组件目录不存在");
        OrdinaryPath(result); return result;
    }
    private static JsonArray ValidateRules(JsonNode? value) {
        if (value is not JsonArray rules || rules.Count is < 1 or > 100000) throw new UserError("市集翻译词库无效");
        foreach (var node in rules) {
            if (node is not JsonObject rule) throw new UserError("市集翻译条目无效");
            string section = RequiredString(rule, "section", 16), displayField = RequiredString(rule, "field", 32);
            if (section is not ("filters" or "stats" or "items")) throw new UserError("市集翻译条目分类无效");
            if (displayField is not ("title" or "text" or "type" or "name" or "label" or "placeholder")) throw new UserError("市集翻译字段无效");
            bool identity = false, translation = false;
            if (rule.ContainsKey("scope") || rule.ContainsKey("defaultOption")) {
                string scope = RequiredString(rule, "scope", 512);
                if (section != "filters" || displayField != "text" || scope.Contains('\r') || scope.Contains('\n')
                    || rule.ContainsKey("source") || rule.ContainsKey("reverse")) throw new UserError("市集选项范围规则无效");
                if (rule.ContainsKey("defaultOption")) {
                    if (rule["defaultOption"] is not JsonValue marker || !marker.TryGetValue<bool>(out bool isDefault) || !isDefault || rule.ContainsKey("id"))
                        throw new UserError("市集默认选项范围规则无效");
                    identity = true;
                } else RequiredString(rule, "id", 4096);
            }
            foreach (string key in new[] { "id", "source", "cn", "tw" }) {
                if (!rule.ContainsKey(key)) continue;
                string text = RequiredString(rule, key, key == "id" ? 4096 : 65536);
                if (key is "id" or "source") identity = true; else translation = true;
            }
            if (!identity || !translation) throw new UserError("市集翻译条目缺少身份或译文");
            if (rule.ContainsKey("reverse")) {
                if (rule["reverse"] is not JsonArray reverse || reverse.Count > 3) throw new UserError("市集搜索映射无效");
                var fields = new HashSet<string>(StringComparer.Ordinal);
                foreach (var field in reverse) {
                    if (field is not JsonValue text || !text.TryGetValue<string>(out var name) || name is not ("type" or "term" or "name") || !fields.Add(name))
                        throw new UserError("市集搜索映射字段无效");
                }
            }
        }
        var copy = (JsonArray)rules.DeepClone();
        if (Utf8.GetByteCount(copy.ToJsonString()) > MaxPacket - 4096) throw new UserError("市集翻译词库过大");
        return copy;
    }

    private static void ValidateManagedGame(string game, string storage, string expectedMode) {
        string steamapps = Directory.GetParent(game)?.Parent?.FullName ?? "";
        if (Directory.GetParent(game)?.Name != "common" || Path.GetFileName(steamapps) != "steamapps") throw new UserError("仅支持 Steam 国际服游戏目录");
        if (SamePath(game, storage) || storage.StartsWith(game + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)) throw new UserError("汉化缓存不能位于游戏目录内");
        string manifest = Path.Combine(steamapps, "appmanifest_238960.acf"), executable = Path.Combine(game, "PathOfExileSteam.exe");
        OrdinaryPath(manifest); OrdinaryPath(executable);
        string manifestText = ReadSmallText(manifest, 1024 * 1024);
        ValidateManifest(manifestText, Path.GetFileName(game));
        RequireX64Image(executable);
        if (HashFile(executable) != SupportedHash) throw new UserError("市集翻译尚不支持当前游戏可执行文件版本");
        string journal = Path.Combine(storage, "transaction.json"), activeFile = Path.Combine(storage, "transaction-active.json"), index = Path.Combine(game, "Bundles2", "_.index.bin");
        if (File.Exists(journal)) throw new UserError("汉化事务尚未完成，不能启用市集翻译");
        OrdinaryPath(activeFile); OrdinaryPath(index);
        string activeText = ReadSmallText(activeFile, 1024 * 1024);
        var active = JsonNode.Parse(activeText)?.AsObject() ?? throw new UserError("受管汉化状态无效");
        string activeMode = active.ContainsKey("mode") ? RequiredString(active, "mode", 32) : "simplified";
        if (active["version"]?.GetValue<int>() != 1 || active["buildId"]?.GetValue<string>() != SupportedBuild || activeMode != expectedMode
            || !Regex.IsMatch(active["releaseId"]?.GetValue<string>() ?? "", "^[a-zA-Z0-9._-]{1,120}$")) throw new UserError("请先完成对应简繁模式的受管汉化");
        string expectedHash = RequiredString(active, "outputHash", 64);
        if (!Regex.IsMatch(expectedHash, "^[a-f0-9]{64}$") || HashFile(index) != expectedHash) throw new UserError("游戏资源与受管汉化状态不符，请重新切换语言");
        if (File.Exists(journal) || ReadSmallText(activeFile, 1024 * 1024) != activeText || ReadSmallText(manifest, 1024 * 1024) != manifestText)
            throw new UserError("核对期间游戏或汉化状态发生变化");
    }
    private static void ValidateManifest(string text, string directoryName) {
        static string Read(string text, string key) => Regex.Match(text, "\"" + Regex.Escape(key) + "\"\\s+\"([^\"]*)\"", RegexOptions.CultureInvariant).Groups[1].Value;
        if (Read(text, "appid") != "238960" || Read(text, "installdir") != directoryName || Read(text, "buildid") != SupportedBuild || Read(text, "StateFlags") != "4")
            throw new UserError("市集翻译仅支持已验证的 Steam Build 26673341，请等待对应版本适配");
    }
    private static string ReadSmallText(string path, int maximum) {
        using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read);
        if (stream.Length > maximum) throw new UserError("市集组件校验文件过大");
        using var reader = new StreamReader(stream, Utf8, true); return reader.ReadToEnd();
    }
    private static string HashFile(string path) {
        using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
    }
    private static bool SamePath(string a, string b) => string.Equals(Path.GetFullPath(a), Path.GetFullPath(b), StringComparison.OrdinalIgnoreCase);
    private static void OrdinaryPath(string filename) {
        if (!File.Exists(filename) && !Directory.Exists(filename)) throw new UserError("市集组件所需文件不存在");
        for (FileSystemInfo? current = File.Exists(filename) ? new FileInfo(filename) : new DirectoryInfo(filename); current != null;
             current = current is FileInfo file ? file.Directory : ((DirectoryInfo)current).Parent)
            if ((current.Attributes & FileAttributes.ReparsePoint) != 0) throw new UserError("市集组件不支持目录链接或重解析路径");
    }
    private static void RequireX64Image(string path) {
        using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read);
        using var reader = new BinaryReader(stream);
        if (reader.ReadUInt16() != 0x5a4d || stream.Length < 64) throw new UserError("市集组件或游戏的 PE 格式无效");
        stream.Position = 0x3c; int header = reader.ReadInt32();
        if (header < 64 || header > stream.Length - 26) throw new UserError("市集组件或游戏的 PE 边界无效");
        stream.Position = header;
        if (reader.ReadUInt32() != 0x4550 || reader.ReadUInt16() != 0x8664) throw new UserError("市集翻译仅支持 x64 游戏与组件");
        stream.Position = header + 24;
        if (reader.ReadUInt16() != 0x20b) throw new UserError("市集组件或游戏不是 PE32+ 格式");
    }
    private static Process FindUniqueGame(string directory) {
        var candidates = Process.GetProcessesByName("PathOfExileSteam");
        Process? selected = null;
        try {
            foreach (var candidate in candidates) {
                if (candidate.HasExited) continue;
                string path;
                try { path = candidate.MainModule?.FileName ?? ""; }
                catch { throw new UserError("无法核实游戏进程路径，请使用相同权限启动助手与游戏"); }
                if (!SamePath(path, Path.Combine(directory, "PathOfExileSteam.exe"))) continue;
                if (selected != null) throw new UserError("检测到多个目标游戏进程，请只保留一个");
                selected = candidate;
            }
            if (selected == null) throw new UserError("请先启动已选择目录中的 Steam 国际服游戏");
            if (!IsWow64Process2(selected.SafeHandle, out ushort processMachine, out ushort nativeMachine) || processMachine != 0 || nativeMachine != 0x8664)
                throw new UserError("无法确认游戏进程为原生 x64");
            return selected;
        } catch { selected = null; throw; }
        finally { foreach (var candidate in candidates) if (!ReferenceEquals(candidate, selected)) candidate.Dispose(); }
    }
    private static List<ProcessModule> ReadModules(Process process) {
        try { process.Refresh(); return process.Modules.Cast<ProcessModule>().ToList(); }
        catch { throw new UserError("无法核实游戏已加载组件，请使用相同权限启动助手与游戏"); }
    }
    private static void RejectConflictingHooks(IEnumerable<ProcessModule> modules) {
        if (modules.Any(module => Regex.IsMatch(module.ModuleName, "poe[12]_trade|trade_translat|market_replace", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)))
            throw new UserError("检测到其他市集翻译组件，请关闭该程序并重启游戏后重试");
    }

    private static unsafe void Inject(Process process, string dllPath) {
        using var handle = OpenProcess(0x00100000 | 0x0400 | 0x0002 | 0x0008 | 0x0010 | 0x0020, false, (uint)process.Id);
        if (handle.IsInvalid) throw new UserError("无法打开游戏进程，请使用相同权限启动助手与游戏");
        char* imagePath = stackalloc char[32768]; uint imagePathLength = 32768;
        if (!QueryFullProcessImageNameW(handle, 0, imagePath, ref imagePathLength) || imagePathLength > 32768
            || !SamePath(new string(imagePath, 0, (int)imagePathLength), process.MainModule?.FileName ?? "")
            || !IsWow64Process2(handle, out ushort processMachine, out ushort nativeMachine) || processMachine != 0 || nativeMachine != 0x8664)
            throw new UserError("游戏进程身份已变化，未加载市集组件");
        byte[] path = Encoding.Unicode.GetBytes(dllPath + '\0');
        IntPtr memory = VirtualAllocEx(handle, IntPtr.Zero, (UIntPtr)path.Length, 0x3000, 0x04);
        if (memory == IntPtr.Zero) throw new UserError("无法为市集组件准备进程内加载参数");
        bool safeToRelease = true;
        try {
            fixed (byte* pathBytes = path) {
                if (!WriteProcessMemory(handle, memory, pathBytes, (UIntPtr)path.Length, out var written) || written.ToUInt64() != (ulong)path.Length)
                    throw new UserError("市集组件加载参数写入失败");
            }
            IntPtr loadLibrary = GetProcAddress(GetModuleHandleW("kernel32.dll"), "LoadLibraryW");
            if (loadLibrary == IntPtr.Zero) throw new UserError("找不到系统组件加载入口");
            using var self = Process.GetCurrentProcess();
            var owner = self.Modules.Cast<ProcessModule>().FirstOrDefault(module => loadLibrary.ToInt64() >= module.BaseAddress.ToInt64()
                && loadLibrary.ToInt64() < module.BaseAddress.ToInt64() + module.ModuleMemorySize) ?? throw new UserError("无法核实系统加载函数所属模块");
            var targetModule = ReadModules(process).FirstOrDefault(module => string.Equals(module.ModuleName, owner.ModuleName, StringComparison.OrdinalIgnoreCase))
                ?? throw new UserError("游戏进程没有对应的系统加载模块");
            IntPtr remoteLoadLibrary = new(targetModule.BaseAddress.ToInt64() + loadLibrary.ToInt64() - owner.BaseAddress.ToInt64());
            using var thread = CreateRemoteThread(handle, IntPtr.Zero, UIntPtr.Zero, remoteLoadLibrary, memory, 0, out _);
            if (thread.IsInvalid) throw new UserError("无法启动市集组件加载线程");
            uint wait = WaitForSingleObject(thread, 10000);
            if (wait != 0) {
                // The remote thread may still read its argument. Leave this tiny allocation until game exit.
                safeToRelease = false;
                throw new UserError("市集组件加载超时，未启用翻译；请重启游戏后重试");
            }
            if (!GetExitCodeThread(thread, out uint result) || result == 0) throw new UserError("游戏未能加载市集组件");
        } finally { if (safeToRelease) VirtualFreeEx(handle, memory, UIntPtr.Zero, 0x8000); }
    }

    internal static async Task WritePacketAsync(Stream stream, JsonObject value, CancellationToken token) {
        byte[] bytes = Utf8.GetBytes(value.ToJsonString(Json));
        if (bytes.Length is < 2 or > MaxPacket) throw new UserError("市集组件数据包长度无效");
        byte[] prefix = new byte[4]; BinaryPrimitives.WriteUInt32LittleEndian(prefix, (uint)bytes.Length);
        await stream.WriteAsync(prefix, token); await stream.WriteAsync(bytes, token); await stream.FlushAsync(token);
    }
    internal static async Task<JsonObject> ReadPacketAsync(Stream stream, CancellationToken token) {
        byte[] prefix = new byte[4]; await stream.ReadExactlyAsync(prefix, token);
        uint length = BinaryPrimitives.ReadUInt32LittleEndian(prefix);
        if (length is < 2 or > MaxPacket) throw new UserError("市集组件数据包长度无效");
        byte[] bytes = new byte[(int)length]; await stream.ReadExactlyAsync(bytes, token);
        return JsonNode.Parse(Utf8.GetString(bytes))?.AsObject() ?? throw new UserError("市集组件响应不是对象");
    }

    internal static object SelfTest() {
        int cases = 0;
        int pipeSecurityCases = 0;
        int resumeCases = 0;
        static void Require(bool condition) { if (!condition) throw new InvalidDataException("Market host self-test failed"); }
        void Reject(Action action) { try { action(); } catch (Exception error) when (error is UserError or ResumeUnavailable or JsonException or InvalidOperationException or DecoderFallbackException or EndOfStreamException) { cases++; return; } throw new InvalidDataException("Market host accepted unsafe fixture"); }
        Require(ValidateMode("simplified") == "simplified" && ValidateMode("traditional") == "traditional"); cases++;
        Reject(() => ValidateMode("fr"));
        var rule = JsonNode.Parse("""[{"section":"items","field":"type","id":"Metadata/Items/Rings/Ring1","source":"Anneau en fer","cn":"锻铁戒指","tw":"鍛鐵戒指","reverse":["type","term"]}]""")!;
        Require(ValidateRules(rule).Count == 1); cases++;
        var reordered = JsonNode.Parse("""[{"reverse":["type","term"],"tw":"鍛鐵戒指","cn":"锻铁戒指","source":"Anneau en fer","id":"Metadata/Items/Rings/Ring1","field":"type","section":"items"}]""")!.AsArray();
        Require(RulesHash(rule.AsArray()) == RulesHash(reordered)); cases++;
        reordered[0]!["cn"] = "另一个译名";
        Require(RulesHash(rule.AsArray()) != RulesHash(reordered)); cases++;
        Require(RulesHash(JsonNode.Parse("""[{"source":"\u00e9","nested":{"b":2,"a":1}}]""")!.AsArray())
            == RulesHash(JsonNode.Parse("""[{"nested":{"a":1,"b":2},"source":"é"}]""")!.AsArray())); cases++;
        Reject(() => ValidateRules(new JsonArray()));
        Reject(() => ValidateRules(JsonNode.Parse("""[{"section":"other","field":"text","source":"x","cn":"中"}]""")));
        Reject(() => ValidateRules(JsonNode.Parse("""[{"section":"items","field":"id","source":"x","cn":"中"}]""")));
        Reject(() => ValidateRules(JsonNode.Parse("""[{"section":"items","field":"text","cn":"中"}]""")));
        Reject(() => ValidateRules(JsonNode.Parse("""[{"section":"items","field":"text","source":"x","cn":"中","reverse":["price"]}]""")));
        Reject(() => ValidateRules(JsonNode.Parse("""[{"section":"items","field":"text","source":"x","cn":"中","reverse":["type","type"]}]""")));
        Require(ValidateRules(JsonNode.Parse("""[{"section":"filters","field":"text","scope":"indexed","defaultOption":true,"cn":"任何时间","tw":"任何時間"}]""")).Count == 1); cases++;
        Require(ValidateRules(JsonNode.Parse("""[{"section":"filters","field":"text","scope":"foil_variation","id":"0","cn":"非闪耀","tw":"非閃耀"}]""")).Count == 1); cases++;
        Reject(() => ValidateRules(JsonNode.Parse("""[{"section":"filters","field":"text","defaultOption":true,"cn":"中"}]""")));
        Reject(() => ValidateRules(JsonNode.Parse("""[{"section":"stats","field":"text","scope":"indexed","defaultOption":true,"cn":"中"}]""")));
        Reject(() => ValidateRules(JsonNode.Parse("""[{"section":"filters","field":"title","scope":"indexed","defaultOption":true,"cn":"中"}]""")));
        Reject(() => ValidateRules(JsonNode.Parse("""[{"section":"filters","field":"text","scope":"indexed","defaultOption":true,"id":"true","cn":"中"}]""")));
        Reject(() => ValidateRules(JsonNode.Parse("""[{"section":"filters","field":"text","scope":"indexed","defaultOption":true,"source":"Any","cn":"中"}]""")));
        Reject(() => ValidateRules(JsonNode.Parse("""[{"section":"filters","field":"text","scope":"indexed","defaultOption":false,"cn":"中"}]""")));
        Reject(() => ValidateRules(JsonNode.Parse("""[{"section":"filters","field":"text","scope":"indexed","cn":"中"}]""")));
        Reject(() => ValidateRules(JsonNode.Parse("""[{"section":"filters","field":"text","scope":"foil_variation","id":0,"cn":"中"}]""")));
        int beforeResume = cases;
        string ownDll = Path.Combine(Path.GetTempPath(), "market-resume", "MarketLocalizationHook.dll");
        Require(ShouldInject(false, null, ownDll)); cases++;
        Require(!ShouldInject(true, ownDll, ownDll)); cases++;
        Reject(() => ShouldInject(true, null, ownDll));
        Reject(() => ShouldInject(true, Path.Combine(Path.GetTempPath(), "other-market", "MarketLocalizationHook.dll"), ownDll));
        var retained = new JsonObject { ["state"] = "disabled", ["mode"] = "simplified", ["hits"] = new JsonObject() };
        ValidateResumeState(retained, "simplified"); cases++;
        retained["state"] = "active"; ValidateResumeState(retained, "simplified"); cases++;
        Reject(() => ValidateResumeState(retained, "traditional"));
        Reject(() => ValidateResumeState(new JsonObject { ["state"] = "disabled", ["mode"] = "" }, "simplified"));
        Reject(() => ValidateResumeState(new JsonObject { ["state"] = "unknown", ["mode"] = "simplified", ["hits"] = new JsonObject() }, "simplified"));
        Reject(() => ValidateResumeState(new JsonObject { ["state"] = "disabled", ["mode"] = "simplified" }, "simplified"));
        resumeCases = cases - beforeResume;
        const string manifest = "\"appid\" \"238960\" \"installdir\" \"Path of Exile\" \"buildid\" \"26673341\" \"StateFlags\" \"4\"";
        ValidateManifest(manifest, "Path of Exile"); cases++;
        Reject(() => ValidateManifest(manifest.Replace("26673341", "26673342"), "Path of Exile"));
        Reject(() => ValidateManifest(manifest.Replace("\"4\"", "\"6\""), "Path of Exile"));
        using var packet = new MemoryStream();
        WritePacketAsync(packet, new JsonObject { ["operation"] = "configure", ["rules"] = rule.DeepClone() }, CancellationToken.None).GetAwaiter().GetResult();
        packet.Position = 0;
        Require(ReadPacketAsync(packet, CancellationToken.None).GetAwaiter().GetResult()["rules"] is JsonArray { Count: 1 }); cases++;
        Reject(() => ReadPacketAsync(new MemoryStream(new byte[] { 0xff, 0xff, 0xff, 0xff }), CancellationToken.None).GetAwaiter().GetResult());
        Reject(() => ReadPacketAsync(new MemoryStream(new byte[] { 3, 0, 0, 0, (byte)'{', (byte)'}' }), CancellationToken.None).GetAwaiter().GetResult());
        Reject(() => ReadPacketAsync(new MemoryStream(new byte[] { 2, 0, 0, 0, 0xff, 0xff }), CancellationToken.None).GetAwaiter().GetResult());
        if (OperatingSystem.IsWindows()) {
            using var parent = FindParent();
            Require(parent != null && parent.Id != Environment.ProcessId); cases++;
            Require(CheckLocalNativeApi()); cases++;
            Require(FileIdentity(Environment.ProcessPath!) == FileIdentity(Environment.ProcessPath!)); cases++;
            string pipeName = "PoEHelper.Market.SelfTest." + Guid.NewGuid().ToString("N");
            using var server = MarketPipe.Create(pipeName);
            MarketPipe.AssertSecurity(server);
            using var client = new NamedPipeClientStream(".", pipeName, PipeDirection.InOut, PipeOptions.Asynchronous);
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(3));
            Task connect = server.WaitForConnectionAsync(timeout.Token);
            client.ConnectAsync(timeout.Token).GetAwaiter().GetResult(); connect.GetAwaiter().GetResult();
            Require(GetNamedPipeClientProcessId(server.SafePipeHandle, out uint clientPid) && clientPid == Environment.ProcessId); cases++;
            pipeSecurityCases = MarketPipe.SelfTest();
            cases += pipeSecurityCases;
        }
        return new { passed = true, cases, pipeSecurityCases, resumeCases, buildId = SupportedBuild, executableSha256 = SupportedHash };
    }

    private static unsafe bool CheckLocalNativeApi() {
        using var process = Process.GetCurrentProcess();
        char* path = stackalloc char[32768]; uint size = 32768;
        return GetProcAddress(GetModuleHandleW("kernel32.dll"), "LoadLibraryW") != IntPtr.Zero
            && IsWow64Process2(process.SafeHandle, out _, out _)
            && QueryFullProcessImageNameW(process.SafeHandle, 0, path, ref size) && size is > 0 and <= 32768;
    }

    private static Process? FindParent() {
        if (!OperatingSystem.IsWindows()) return null;
        using var snapshot = CreateToolhelp32Snapshot(2, 0);
        if (snapshot.IsInvalid) return null;
        var entry = new ProcessEntry { Size = (uint)Marshal.SizeOf<ProcessEntry>() };
        if (!Process32FirstW(snapshot, ref entry)) return null;
        do {
            if (entry.ProcessId != Environment.ProcessId) continue;
            try { return Process.GetProcessById((int)entry.ParentProcessId); } catch { return null; }
        } while (Process32NextW(snapshot, ref entry));
        return null;
    }

    public void Dispose() { lifetime.Cancel(); pipe?.Dispose(); gameProcess?.Dispose(); parentProcess?.Dispose(); commands.Dispose(); lifetime.Dispose(); }

    [StructLayout(LayoutKind.Sequential)]
    private unsafe struct ProcessEntry {
        public uint Size, Usage, ProcessId;
        public UIntPtr DefaultHeapId;
        public uint ModuleId, Threads, ParentProcessId;
        public int BasePriority;
        public uint Flags;
        public fixed char ExeFile[260];
    }
    [StructLayout(LayoutKind.Sequential)] private struct NativeFileTime { public uint Low, High; }
    [StructLayout(LayoutKind.Sequential)] private struct FileInformation {
        public uint Attributes;
        public NativeFileTime CreationTime, LastAccessTime, LastWriteTime;
        public uint VolumeSerialNumber, FileSizeHigh, FileSizeLow, NumberOfLinks, FileIndexHigh, FileIndexLow;
    }
    [LibraryImport("kernel32.dll", SetLastError = true)] private static partial SafeFileHandle CreateToolhelp32Snapshot(uint flags, uint processId);
    [LibraryImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] private static partial bool Process32FirstW(SafeFileHandle snapshot, ref ProcessEntry entry);
    [LibraryImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] private static partial bool Process32NextW(SafeFileHandle snapshot, ref ProcessEntry entry);
    [LibraryImport("kernel32.dll", SetLastError = true)] private static partial SafeProcessHandle OpenProcess(uint access, [MarshalAs(UnmanagedType.Bool)] bool inherit, uint processId);
    [LibraryImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] private static partial bool IsWow64Process2(SafeProcessHandle process, out ushort processMachine, out ushort nativeMachine);
    [LibraryImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] private static unsafe partial bool QueryFullProcessImageNameW(SafeProcessHandle process, uint flags, char* path, ref uint size);
    [LibraryImport("kernel32.dll", SetLastError = true)] private static partial IntPtr VirtualAllocEx(SafeProcessHandle process, IntPtr address, UIntPtr size, uint allocation, uint protection);
    [LibraryImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] private static partial bool VirtualFreeEx(SafeProcessHandle process, IntPtr address, UIntPtr size, uint freeType);
    [LibraryImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] private static unsafe partial bool WriteProcessMemory(SafeProcessHandle process, IntPtr address, byte* buffer, UIntPtr size, out UIntPtr written);
    [LibraryImport("kernel32.dll", StringMarshalling = StringMarshalling.Utf16)] private static partial IntPtr GetModuleHandleW(string name);
    [LibraryImport("kernel32.dll", StringMarshalling = StringMarshalling.Utf8)] private static partial IntPtr GetProcAddress(IntPtr module, string name);
    [LibraryImport("kernel32.dll", SetLastError = true)] private static partial SafeWaitHandle CreateRemoteThread(SafeProcessHandle process, IntPtr attributes, UIntPtr stackSize, IntPtr start, IntPtr parameter, uint flags, out uint threadId);
    [LibraryImport("kernel32.dll", SetLastError = true)] private static partial uint WaitForSingleObject(SafeWaitHandle handle, uint milliseconds);
    [LibraryImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] private static partial bool GetExitCodeThread(SafeWaitHandle thread, out uint exitCode);
    [LibraryImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] private static partial bool GetNamedPipeClientProcessId(SafePipeHandle pipe, out uint processId);
    [LibraryImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)] private static partial bool GetFileInformationByHandle(SafeFileHandle file, out FileInformation info);
}
