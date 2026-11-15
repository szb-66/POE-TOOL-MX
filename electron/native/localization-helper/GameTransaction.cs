using System.Diagnostics;
using System.Buffers.Binary;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Win32;

namespace LocalizationHelper;

/// <summary>Owns only the Steam index, PoEHelper bundles and the language setting.</summary>
public sealed class GameTransaction {
    public sealed record BaselineStatus(bool Ready, string Reason);
    public sealed record Snapshot(string BuildId, string GameVersion, string IndexHash, BaselineStatus Baseline,
        bool Applied, string? ReleaseId, bool RecoveryNeeded);
    private sealed record Baseline(int Version, string BuildId, string GameVersion, string IndexHash, string IndexFile,
        DateTime VerificationCompleted, string VerificationLogHash, string? OriginalLanguage);
    private sealed record Active(int Version, string BuildId, string OutputHash, string ReleaseId, string Generation);
    private sealed record Journal(int Version, string Operation, string BuildId, string BeforeHash, string AfterHash,
        string BeforeIndex, string? BeforeLanguage, string? Generation, Active? BeforeActive, Active? AfterActive);
    private static readonly JsonSerializerOptions Json = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private static readonly Regex Timestamp = new(@"^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]", RegexOptions.CultureInvariant);
    private readonly string game, storage, config, steamapps, manifest, index, baselineFile, activeFile, journalFile;
    private readonly Func<bool> gameStopped;
    private readonly Func<string> contentLog;

    public GameTransaction(string gameDirectory, string storageRoot, string? configPath = null)
        : this(gameDirectory, storageRoot, configPath ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            "My Games", "Path of Exile", "production_Config.ini"), AreGameProcessesStopped, SteamContentLog) { }

    private GameTransaction(string gameDirectory, string storageRoot, string configPath, Func<bool> stopped, Func<string> log) {
        game = Path.GetFullPath(gameDirectory).TrimEnd(Path.DirectorySeparatorChar);
        storage = Path.GetFullPath(storageRoot).TrimEnd(Path.DirectorySeparatorChar);
        config = Path.GetFullPath(configPath);
        steamapps = Directory.GetParent(game)?.Parent?.FullName ?? throw new UserError("请选择 Steam 游戏安装目录");
        manifest = Path.Combine(steamapps, "appmanifest_238960.acf");
        index = Path.Combine(game, "Bundles2", "_.index.bin");
        baselineFile = Path.Combine(storage, "baseline.json"); activeFile = Path.Combine(storage, "transaction-active.json");
        journalFile = Path.Combine(storage, "transaction.json");
        gameStopped = stopped; contentLog = log;
        if (Path.GetFileName(config) != "production_Config.ini" || Directory.GetParent(config)?.Name != "Path of Exile" ||
            Directory.GetParent(config)?.Parent?.Name != "My Games") throw new UserError("游戏语言配置路径无效");
        if (string.Equals(game, storage, StringComparison.OrdinalIgnoreCase) || Within(game, storage) || Within(storage, game)) throw new UserError("汉化缓存必须与游戏安装目录分离");
    }

    private static string Hash(string file) { using var stream = File.OpenRead(file); return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant(); }
    private static bool Within(string root, string value) => Path.GetFullPath(value).StartsWith(root.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar,
        OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal);
    private static void RequireOrdinaryPath(string path) {
        for (FileSystemInfo? info = File.Exists(path) ? new FileInfo(path) : new DirectoryInfo(path); info != null; info = info is FileInfo f ? f.Directory : ((DirectoryInfo)info).Parent) {
            if (info.Exists && (info.Attributes & FileAttributes.ReparsePoint) != 0) throw new UserError("游戏或缓存路径含目录链接，无法安全替换");
        }
    }
    private static string Value(string text, string key) {
        var match = Regex.Match(text, "\"" + Regex.Escape(key) + "\"\\s+\"([^\"]*)\"", RegexOptions.CultureInvariant);
        return match.Success ? match.Groups[1].Value : "";
    }
    private string Manifest() {
        if (Directory.GetParent(game)?.Name != "common" || Path.GetFileName(steamapps) != "steamapps" || !File.Exists(manifest) || !File.Exists(index) ||
            !(File.Exists(Path.Combine(game, "PathOfExileSteam.exe")) || File.Exists(Path.Combine(game, "PathOfExile_x64Steam.exe")) ))
            throw new UserError("目录不是有效的 Steam 国际服流放之路");
        RequireOrdinaryPath(game); RequireOrdinaryPath(manifest); RequireOrdinaryPath(index);
        var text = File.ReadAllText(manifest);
        if (Value(text, "appid") != "238960" || Value(text, "installdir") != Path.GetFileName(game) || !Regex.IsMatch(Value(text, "buildid"), @"^\d{1,20}$"))
            throw new UserError("Steam 游戏清单与所选目录不一致");
        return text;
    }
    private string GameVersion() {
        var log = Path.Combine(game, "logs", "LatestClient.txt");
        if (!File.Exists(log)) return "unknown";
        var file = new FileInfo(log); if (file.Length > 16 * 1024 * 1024) return "unknown";
        var matches = Regex.Matches(File.ReadAllText(log), @"\[HTTP2\].*?release/tags/([0-9][A-Za-z0-9.\-_]*)", RegexOptions.CultureInvariant);
        return matches.Count == 0 ? "unknown" : matches[^1].Groups[1].Value;
    }
    private T? Read<T>(string file) where T : class {
        if (!File.Exists(file)) return null;
        RequireOrdinaryPath(file);
        if (new FileInfo(file).Length > 1024 * 1024) throw new UserError("本机汉化事务记录损坏，请保留诊断并修复");
        try { return JsonSerializer.Deserialize<T>(File.ReadAllBytes(file), Json) ?? throw new JsonException(); }
        catch (JsonException) { throw new UserError("本机汉化事务记录损坏，请保留诊断并修复"); }
    }
    private static void DurableWrite(string destination, ReadOnlySpan<byte> bytes) {
        Directory.CreateDirectory(Path.GetDirectoryName(destination)!); RequireOrdinaryPath(destination);
        var temporary = destination + ".next-" + Guid.NewGuid().ToString("N");
        using (var stream = new FileStream(temporary, FileMode.CreateNew, FileAccess.Write, FileShare.None, 65536, FileOptions.WriteThrough)) {
            stream.Write(bytes); stream.Flush(true);
        }
        File.Move(temporary, destination, true);
    }
    private static void Save<T>(string file, T value) => DurableWrite(file, JsonSerializer.SerializeToUtf8Bytes(value, Json));
    private string Stored(string relative) {
        if (Path.IsPathRooted(relative)) throw new UserError("汉化备份路径无效");
        var full = Path.GetFullPath(Path.Combine(storage, relative));
        if (!Within(storage, full)) throw new UserError("汉化备份路径越界");
        RequireOrdinaryPath(full); return full;
    }
    private bool ValidBaseline(Baseline? baseline, string build) => baseline is { Version: 1 } && baseline.BuildId == build &&
        Regex.IsMatch(baseline.IndexHash, "^[a-f0-9]{64}$") && File.Exists(Stored(baseline.IndexFile)) && Hash(Stored(baseline.IndexFile)) == baseline.IndexHash;
    public string BaselineIndexPath {
        get {
            var snapshot = Inspect(); var baseline = Read<Baseline>(baselineFile);
            if (!snapshot.Baseline.Ready || !ValidBaseline(baseline, snapshot.BuildId)) throw new UserError("缺少当前版本的可靠原版基线");
            return Stored(baseline!.IndexFile);
        }
    }

    public Snapshot Inspect() {
        var build = Value(Manifest(), "buildid"); var hash = Hash(index);
        var baseline = Read<Baseline>(baselineFile); var active = Read<Active>(activeFile);
        bool applied = active is { Version: 1 } && active.BuildId == build && active.OutputHash == hash;
        bool ready = ValidBaseline(baseline, build) && (hash == baseline!.IndexHash || applied);
        return new(build, GameVersion(), hash, new(ready, ready ? "" : "首次应用或游戏更新后，请先在 Steam 验证游戏文件完整性"),
            applied, applied ? active!.ReleaseId : null, File.Exists(journalFile));
    }

    public void RequireWritable() {
        var text = Manifest();
        if (Value(text, "StateFlags") != "4" || (Value(text, "UpdateResult") is var result && result.Length > 0 && result != "0"))
            throw new UserError("Steam 正在运行游戏、更新或校验，暂不能替换游戏资源");
        foreach (var stage in new[] { "downloading", "temp" }) if (Directory.Exists(Path.Combine(steamapps, stage, "238960")))
            throw new UserError("检测到 Steam 更新暂存目录，等待更新完成后再操作");
        foreach (var pair in new[] { ("BytesToDownload", "BytesDownloaded"), ("BytesToStage", "BytesStaged") }) {
            var needed = Value(text, pair.Item1); var finished = Value(text, pair.Item2);
            if (needed.Length > 0 && finished.Length > 0 && needed != finished) throw new UserError("Steam 更新尚未完成，暂不能替换游戏资源");
        }
        bool stopped;
        try { stopped = gameStopped(); } catch { throw new UserError("无法确认游戏进程状态，未替换任何游戏文件"); }
        if (!stopped) throw new UserError("请先退出流放之路，再应用或恢复汉化");
        RequireOrdinaryPath(storage); RequireOrdinaryPath(config);
    }
    private FileStream Lock() {
        Directory.CreateDirectory(storage); RequireOrdinaryPath(storage);
        try { return new FileStream(Path.Combine(storage, "transaction.lock"), FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None); }
        catch (IOException) { throw new UserError("已有游戏汉化事务运行，请等待完成"); }
    }
    private static bool AreGameProcessesStopped() {
        foreach (var process in Process.GetProcesses()) {
            using (process) if (process.ProcessName.StartsWith("PathOfExile", StringComparison.OrdinalIgnoreCase)) return false;
        }
        return true;
    }
    private static string SteamContentLog() {
        if (!OperatingSystem.IsWindows()) throw new UserError("仅支持 Windows Steam 客户端");
        var root = Registry.GetValue(@"HKEY_CURRENT_USER\Software\Valve\Steam", "SteamPath", null) as string;
        if (string.IsNullOrWhiteSpace(root)) throw new UserError("无法定位 Steam 完整性校验日志");
        return Path.Combine(root, "logs", "content_log.txt");
    }
    private (DateTime Completed, string LogHash) VerificationEvidence(string build) {
        var log = contentLog(); RequireOrdinaryPath(log);
        if (!File.Exists(log) || new FileInfo(log).Length > 128 * 1024 * 1024) throw new UserError("未找到 Steam 完整性校验完成证据，请在 Steam 验证后重试");
        // Steam keeps its log open for writing. Read a bounded snapshot with the
        // same sharing semantics; hash that snapshot rather than reopening it.
        byte[] logBytes;
        using (var input = new FileStream(log, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete)) {
            int length = checked((int)Math.Min(input.Length, 64L * 1024 * 1024));
            input.Position = input.Length - length; logBytes = new byte[length]; input.ReadExactly(logBytes);
        }
        var lines = Encoding.UTF8.GetString(logBytes).Split('\n'); DateTime? validating = null, finished = null, complete = null;
        foreach (var line in lines) {
            var stamp = Timestamp.Match(line);
            if (!stamp.Success || !DateTime.TryParseExact(stamp.Groups[1].Value, "yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture, DateTimeStyles.None, out var time)) continue;
            var start = Regex.Match(line, @"\bStart validating appID 238960 on BuildID (\d+)\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
            if (start.Success) {
                validating = start.Groups[1].Value == build ? time : null;
                finished = complete = null;
                continue;
            }
            if (!line.Contains("AppID 238960 ", StringComparison.Ordinal)) continue;
            // "Verifying Installed" also appears in ordinary updates and is insufficient evidence.
            if (Regex.IsMatch(line, @"\bValidating\b", RegexOptions.CultureInvariant)) { validating = time; finished = complete = null; }
            if (validating != null && line.Contains("finished update", StringComparison.Ordinal)) {
                if (line.Contains("(BuildID " + build + ")", StringComparison.Ordinal)) finished = time;
                else validating = finished = null;
            }
            if (line.Contains("scheduler finished", StringComparison.Ordinal)) {
                if (finished != null && line.Contains("result No Error", StringComparison.Ordinal)) complete = time;
                validating = finished = null;
            }
        }
        if (complete == null || complete > DateTime.Now.AddMinutes(5) || complete < DateTime.Now.AddDays(-1) ||
            File.GetLastWriteTime(index) > complete.Value.AddSeconds(2))
            throw new UserError("未找到当前游戏版本的 Steam 完整性校验成功记录，请验证游戏完整性后重试");
        return (complete.Value, Convert.ToHexString(SHA256.HashData(logBytes)).ToLowerInvariant());
    }
    private string? Language() {
        if (!File.Exists(config)) return null;
        var matches = Regex.Matches(File.ReadAllText(config), @"^[ \t]*language[ \t]*=[ \t]*([^\r\n]*)", RegexOptions.Multiline | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);
        if (matches.Count > 1) throw new UserError("游戏配置存在重复语言项，请修复后重试");
        return matches.Count == 1 ? matches[0].Groups[1].Value : null;
    }
    private void SetLanguage(string? language) {
        RequireOrdinaryPath(config);
        var text = File.Exists(config) ? File.ReadAllText(config) : "";
        var regex = new Regex(@"^[ \t]*language[ \t]*=[^\r\n]*(?:\r?\n)?", RegexOptions.Multiline | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);
        if (regex.Matches(text).Count > 1) throw new UserError("游戏配置存在重复语言项，请修复后重试");
        if (regex.IsMatch(text)) text = regex.Replace(text, language == null ? "" : "language=" + language + "\r\n", 1);
        else if (language != null) {
            var section = Regex.Match(text, @"^\[LANGUAGE\][^\r\n]*(?:\r?\n|$)", RegexOptions.Multiline | RegexOptions.CultureInvariant);
            text = section.Success ? text.Insert(section.Index + section.Length, (section.Value.EndsWith('\n') ? "" : "\r\n") + "language=" + language + "\r\n")
                : text.TrimEnd('\r', '\n') + "\r\n[LANGUAGE]\r\nlanguage=" + language + "\r\n";
        }
        DurableWrite(config, new UTF8Encoding(false).GetBytes(text));
    }

    public Snapshot EstablishBaseline() {
        using var guard = Lock(); RequireWritable();
        if (File.Exists(journalFile)) throw new UserError("存在未完成汉化事务，请先恢复事务");
        var snapshot = Inspect(); if (snapshot.Baseline.Ready) return snapshot;
        var evidence = VerificationEvidence(snapshot.BuildId);
        var relative = Path.Combine("baselines", snapshot.BuildId, snapshot.IndexHash + ".index.bin");
        DurableWrite(Stored(relative), File.ReadAllBytes(index));
        if (Hash(index) != snapshot.IndexHash || Hash(Stored(relative)) != snapshot.IndexHash) throw new UserError("建立备份时游戏索引发生变化，未建立基线");
        var previousBaseline = Read<Baseline>(baselineFile); var previousActive = Read<Active>(activeFile);
        var originalLanguage = previousActive != null && previousBaseline != null && Language() == "fr" ? previousBaseline.OriginalLanguage : Language();
        Save(baselineFile, new Baseline(1, snapshot.BuildId, snapshot.GameVersion, snapshot.IndexHash, relative, evidence.Completed, evidence.LogHash, originalLanguage));
        if (File.Exists(activeFile)) File.Delete(activeFile);
        return Inspect();
    }

    public Snapshot EnsureAppliedLanguage(string releaseId) {
        using var guard = Lock(); RequireWritable();
        if (File.Exists(journalFile)) throw new UserError("存在未完成汉化事务，请先恢复事务");
        var snapshot = Inspect();
        if (!snapshot.Baseline.Ready || !snapshot.Applied || snapshot.ReleaseId != releaseId)
            throw new UserError("已应用汉化状态发生变化，请重新扫描后再试");
        // Only one atomic config replacement is needed; keep the original-language baseline intact.
        if (Language() != "fr") SetLanguage("fr");
        return Inspect();
    }

    private static void AtomicIndex(string source, string destination, string expectedCurrentHash) {
        if (Hash(destination) != expectedCurrentHash) throw new UserError("游戏索引已变化，未执行替换");
        var temporary = destination + ".poehelper-next";
        if (File.Exists(temporary)) throw new UserError("存在未完成的索引暂存文件，请先恢复事务");
        using (var input = File.OpenRead(source)) using (var output = new FileStream(temporary, FileMode.CreateNew, FileAccess.Write, FileShare.None, 65536, FileOptions.WriteThrough)) {
            input.CopyTo(output); output.Flush(true);
        }
        if (Hash(destination) != expectedCurrentHash) { File.Delete(temporary); throw new UserError("Steam 在提交前更改了索引，未执行替换"); }
        File.Replace(temporary, destination, null);
    }

    private static IEnumerable<string> CandidateFiles(string root) {
        var pending = new Stack<string>(); pending.Push(root);
        while (pending.TryPop(out var directory)) foreach (var child in Directory.EnumerateFileSystemEntries(directory)) {
            RequireOrdinaryPath(child);
            if (Directory.Exists(child)) pending.Push(child); else yield return child;
        }
    }

    public Snapshot Commit(string candidateIndexPath, string candidateBundleRoot, string releaseId, string generation) {
        using var guard = Lock(); RequireWritable();
        var staging = Path.Combine(storage, "staging"); var candidate = Path.GetFullPath(candidateIndexPath); var bundles = Path.GetFullPath(candidateBundleRoot);
        if (!Within(staging, candidate) || !Within(staging, bundles) || !File.Exists(candidate) || !Directory.Exists(bundles)) throw new UserError("补丁候选不属于受管暂存目录");
        if (!Regex.IsMatch(generation, @"^[A-Za-z0-9_-]{1,80}$") || !Regex.IsMatch(releaseId, @"^[A-Za-z0-9._-]{1,120}$")) throw new UserError("补丁版本或事务标识无效");
        RequireOrdinaryPath(candidate); RequireOrdinaryPath(bundles);
        if (File.Exists(journalFile)) throw new UserError("存在未完成汉化事务，请先恢复事务");
        var snapshot = Inspect(); if (!snapshot.Baseline.Ready) throw new UserError("缺少当前游戏原版基线，请先在 Steam 验证游戏完整性");
        var baseline = Read<Baseline>(baselineFile)!;
        var allFiles = CandidateFiles(bundles).ToArray();
        if (allFiles.Length == 0 || allFiles.Any(file => !file.EndsWith(".bundle.bin", StringComparison.OrdinalIgnoreCase))) throw new UserError("补丁候选包含无效资源文件");
        long required = new FileInfo(candidate).Length + new FileInfo(index).Length;
        foreach (var file in allFiles) { RequireOrdinaryPath(file); required = checked(required + new FileInfo(file).Length); }
        if (new DriveInfo(Path.GetPathRoot(index)!).AvailableFreeSpace < required + 8 * 1024 * 1024) throw new UserError("游戏所在磁盘空间不足，未替换任何文件");
        var destination = Path.Combine(game, "Bundles2", "PoEHelper", generation);
        if (Directory.Exists(destination)) throw new UserError("补丁事务标识已存在，请重新生成候选");
        RequireOrdinaryPath(destination);
        var outputHash = Hash(candidate); var before = Path.Combine("transactions", Guid.NewGuid().ToString("N") + ".index.bin");
        DurableWrite(Stored(before), File.ReadAllBytes(index));
        var after = new Active(1, snapshot.BuildId, outputHash, releaseId, generation);
        var journal = new Journal(1, "apply", snapshot.BuildId, snapshot.IndexHash, outputHash, before, Language(), generation, Read<Active>(activeFile), after);
        Save(journalFile, journal);
        try {
            Directory.CreateDirectory(destination);
            foreach (var file in allFiles) {
                var relative = Path.GetRelativePath(bundles, file); var target = Path.GetFullPath(Path.Combine(destination, relative));
                if (!Within(destination, target)) throw new UserError("补丁候选路径越界");
                DurableWrite(target, File.ReadAllBytes(file));
                if (Hash(file) != Hash(target)) throw new UserError("补丁资源复制校验失败");
            }
            RequireWritable();
            if (Value(Manifest(), "buildid") != snapshot.BuildId || Hash(index) != snapshot.IndexHash || Hash(candidate) != outputHash) throw new UserError("生成补丁期间游戏资源发生变化，未提交索引");
            AtomicIndex(candidate, index, snapshot.IndexHash);
            SetLanguage("fr"); Save(activeFile, after); File.Delete(journalFile);
            return Inspect();
        } catch { RecoverInternal(); throw; }
    }

    public Snapshot Restore() {
        using var guard = Lock(); RequireWritable();
        if (File.Exists(journalFile)) RecoverInternal();
        var snapshot = Inspect(); var baseline = Read<Baseline>(baselineFile);
        if (!ValidBaseline(baseline, snapshot.BuildId)) throw new UserError("备份与当前 Steam 版本不同，禁止恢复旧版完整索引");
        if (!snapshot.Baseline.Ready) throw new UserError("游戏索引与受管状态不一致，禁止覆盖第三方修改");
        if (!snapshot.Applied) {
            // Steam validation may already have restored the index; undo our remaining language setting too.
            var previous = Read<Active>(activeFile);
            if (previous?.BuildId == snapshot.BuildId && snapshot.IndexHash == baseline!.IndexHash) {
                if (Language() == "fr") SetLanguage(baseline.OriginalLanguage);
                File.Delete(activeFile);
            }
            return Inspect();
        }
        var before = Path.Combine("transactions", Guid.NewGuid().ToString("N") + ".index.bin");
        DurableWrite(Stored(before), File.ReadAllBytes(index));
        Save(journalFile, new Journal(1, "restore", snapshot.BuildId, snapshot.IndexHash, baseline!.IndexHash, before, Language(), null, Read<Active>(activeFile), null));
        try {
            RequireWritable(); AtomicIndex(Stored(baseline.IndexFile), index, snapshot.IndexHash);
            SetLanguage(baseline.OriginalLanguage); File.Delete(activeFile); File.Delete(journalFile);
            return Inspect();
        } catch { RecoverInternal(); throw; }
    }

    public Snapshot Recover() { using var guard = Lock(); RequireWritable(); RecoverInternal(); return Inspect(); }
    private void RecoverInternal() {
        var journal = Read<Journal>(journalFile); if (journal == null) return;
        RequireWritable();
        var build = Value(Manifest(), "buildid");
        if (journal.Version != 1 || journal.BuildId != build) throw new UserError("未完成事务属于其他游戏版本，禁止恢复旧版索引");
        var before = Stored(journal.BeforeIndex);
        if (!File.Exists(before) || Hash(before) != journal.BeforeHash) throw new UserError("事务备份损坏，未覆盖游戏资源");
        var current = Hash(index);
        if (current != journal.BeforeHash && current != journal.AfterHash) throw new UserError("游戏索引已被其他程序更改，请先验证 Steam 完整性");
        var temporary = index + ".poehelper-next";
        if (File.Exists(temporary)) { RequireOrdinaryPath(temporary); File.Delete(temporary); }
        if (current == journal.AfterHash) AtomicIndex(before, index, current);
        SetLanguage(journal.BeforeLanguage);
        if (journal.BeforeActive != null) Save(activeFile, journal.BeforeActive); else if (File.Exists(activeFile)) File.Delete(activeFile);
        // An interrupted generation is no longer referenced; leave it for explicit managed cache cleanup.
        File.Delete(journalFile);
    }

    public static object SelfTest(string directory) {
        var root = Path.Combine(Path.GetFullPath(directory), "transaction-fixture-" + Guid.NewGuid().ToString("N"));
        try {
        var game = Path.Combine(root, "library", "steamapps", "common", "Path of Exile");
        var store = Path.Combine(root, "cache"); var ini = Path.Combine(root, "Documents", "My Games", "Path of Exile", "production_Config.ini");
        Directory.CreateDirectory(Path.Combine(game, "Bundles2")); Directory.CreateDirectory(Path.GetDirectoryName(ini)!);
        var acf = Path.Combine(root, "library", "steamapps", "appmanifest_238960.acf");
        File.WriteAllText(acf, "\"AppState\" { \"appid\" \"238960\" \"installdir\" \"Path of Exile\" \"buildid\" \"123\" \"StateFlags\" \"4\" }");
        File.WriteAllBytes(Path.Combine(game, "PathOfExileSteam.exe"), []);
        var targetIndex = Path.Combine(game, "Bundles2", "_.index.bin"); File.WriteAllText(targetIndex, "original");
        File.WriteAllText(ini, "[LANGUAGE]\r\nlanguage=en\r\nchat_language=en\r\n[OTHER]\r\nkeep=true\r\n");
        var steamLog = Path.Combine(root, "content_log.txt");
        string Stamp() => DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);
        File.WriteAllText(steamLog, $"[{Stamp()}] AppID 238960 App update changed : Running Update,Verifying Installed,\n[{Stamp()}] AppID 238960 finished update, 2 mounted depots (BuildID 123)\n[{Stamp()}] AppID 238960 scheduler finished : removed from schedule (result No Error, state 0xc)\n");
        var tx = new GameTransaction(game, store, ini, () => true, () => steamLog);
        bool blocked = false; try { tx.EstablishBaseline(); } catch (UserError) { blocked = true; }
        if (!blocked) throw new InvalidDataException("Ordinary update accepted as verification");
        File.WriteAllText(steamLog, File.ReadAllText(steamLog).Replace("Verifying Installed", "Validating"));
        using (var steamWriter = new FileStream(steamLog, FileMode.Open, FileAccess.ReadWrite, FileShare.ReadWrite | FileShare.Delete)) tx.EstablishBaseline();
        File.WriteAllText(steamLog, $"[{Stamp()}] Start validating appID 238960 on BuildID 123\n[{Stamp()}] AppID 238960 App update changed : Running Update,Verifying Installed,\n[{Stamp()}] AppID 238960 finished update, 2 mounted depots (BuildID 123)\n[{Stamp()}] AppID 238960 scheduler finished : removed from schedule (result No Error, state 0xc)\n");
        var explicitStart = new GameTransaction(game, Path.Combine(root, "explicit-start-cache"), ini, () => true, () => steamLog);
        if (!explicitStart.EstablishBaseline().Baseline.Ready) throw new InvalidDataException("Explicit Steam validation start not accepted");
        File.WriteAllText(steamLog, File.ReadAllText(steamLog).Replace("on BuildID 123", "on BuildID 124"));
        var wrongStart = new GameTransaction(game, Path.Combine(root, "wrong-start-cache"), ini, () => true, () => steamLog);
        blocked = false; try { wrongStart.EstablishBaseline(); } catch (UserError) { blocked = true; }
        if (!blocked) throw new InvalidDataException("Wrong-build Steam validation start accepted");
        var stage = Path.Combine(store, "staging", "g1"); Directory.CreateDirectory(stage);
        var candidate = Path.Combine(stage, "candidate.index.bin"); File.WriteAllText(candidate, "patched");
        var bundle = Path.Combine(stage, "bundles"); Directory.CreateDirectory(bundle); File.WriteAllText(Path.Combine(bundle, "0.bundle.bin"), "bundle");
        tx.Commit(candidate, bundle, "fixture-v1", "fixture1");
        if (!tx.Inspect().Applied || !File.ReadAllText(ini).Contains("language=fr")) throw new InvalidDataException("Commit not visible");
        tx.Restore();
        if (File.ReadAllText(targetIndex) != "original" || !File.ReadAllText(ini).Contains("language=en") || !File.ReadAllText(ini).Contains("keep=true")) throw new InvalidDataException("Restore failed");
        tx.Commit(candidate, bundle, "fixture-v1", "fixture2");
        File.WriteAllText(acf, File.ReadAllText(acf).Replace("\"123\"", "\"124\""));
        blocked = false; try { tx.Restore(); } catch (UserError) { blocked = true; }
        if (!blocked || File.ReadAllText(targetIndex) != "patched") throw new InvalidDataException("Cross-version restore accepted");
        File.WriteAllText(acf, File.ReadAllText(acf).Replace("\"124\"", "\"123\""));
        var baseline = tx.Read<Baseline>(tx.baselineFile)!;
        tx.SaveTestInterruptedApply(baseline);
        tx.Recover();
        if (File.ReadAllText(targetIndex) != "original" || tx.Inspect().Applied || tx.Inspect().RecoveryNeeded) throw new InvalidDataException("Crash rollback failed");
        File.WriteAllText(ini, "[LANGUAGE]");
        tx.Commit(candidate, bundle, "fixture-v1", "fixture3");
        if (!File.ReadAllText(ini).Contains("[LANGUAGE]\r\nlanguage=fr")) throw new InvalidDataException("Missing config newline");
        File.WriteAllText(targetIndex, "original"); // Steam validation restored our index outside the helper.
        tx.Restore();
        if (tx.Inspect().Applied || !File.ReadAllText(ini).Contains("language=en")) throw new InvalidDataException("Steam-restored index left managed language active");
        File.WriteAllText(ini, "[LANGUAGE]\nlanguage=en\nlanguage=ko-KR\n");
        blocked = false; try { tx.Commit(candidate, bundle, "fixture-v1", "fixture4"); } catch (UserError) { blocked = true; }
        if (!blocked || File.ReadAllText(targetIndex) != "original" || tx.Inspect().RecoveryNeeded) throw new InvalidDataException("Duplicate language keys accepted");
        File.WriteAllText(ini, "[LANGUAGE]\nlanguage=en\n");
        foreach (var probe in new Func<bool>[] { () => false, () => throw new IOException("unknown process state") }) {
            var gated = new GameTransaction(game, store, ini, probe, () => steamLog);
            blocked = false; try { gated.RequireWritable(); } catch (UserError) { blocked = true; }
            if (!blocked) throw new InvalidDataException("Unsafe process state accepted");
        }
        Directory.CreateDirectory(Path.Combine(root, "library", "steamapps", "downloading", "238960"));
        blocked = false; try { tx.RequireWritable(); } catch (UserError) { blocked = true; }
        if (!blocked) throw new InvalidDataException("Steam update stage accepted");
        return new { passed = true, cases = 14 + WorkflowSelfTest(Path.Combine(root, "workflow")) };
        } finally {
            if (Directory.Exists(root) && Within(Path.GetFullPath(directory), root) && Path.GetFileName(root).StartsWith("transaction-fixture-", StringComparison.Ordinal)) {
                if (OperatingSystem.IsWindows()) Microsoft.VisualBasic.FileIO.FileSystem.DeleteDirectory(root, Microsoft.VisualBasic.FileIO.UIOption.OnlyErrorDialogs, Microsoft.VisualBasic.FileIO.RecycleOption.SendToRecycleBin);
                else Directory.Delete(root, true);
            }
        }
    }

    private void SaveTestInterruptedApply(Baseline baseline) {
        var current = Inspect();
        Save(journalFile, new Journal(1, "apply", current.BuildId, baseline.IndexHash, current.IndexHash,
            baseline.IndexFile, "en", "fixture2", null, Read<Active>(activeFile)));
    }

    private static int WorkflowSelfTest(string root) {
        var game = Path.Combine(root, "steamapps", "common", "Path of Exile");
        var store = Path.Combine(root, "cache");
        var ini = Path.Combine(root, "Documents", "My Games", "Path of Exile", "production_Config.ini");
        Directory.CreateDirectory(Path.Combine(game, "Bundles2")); Directory.CreateDirectory(Path.GetDirectoryName(ini)!);
        var manifest = Path.Combine(root, "steamapps", "appmanifest_238960.acf");
        File.WriteAllText(manifest, "\"AppState\" { \"appid\" \"238960\" \"installdir\" \"Path of Exile\" \"buildid\" \"456\" \"StateFlags\" \"4\" }");
        File.WriteAllBytes(Path.Combine(game, "PathOfExileSteam.exe"), []);
        const string originalConfig = "[LANGUAGE]\r\nlanguage=en\r\nchat_language=en\r\n[OTHER]\r\nkeep=true\r\n";
        File.WriteAllText(ini, originalConfig);
        using var language = new MemoryStream();
        using (var writer = new BinaryWriter(language, Encoding.Unicode, true)) {
            writer.Write(3);
            int id = 0;
            foreach (var (name, tag) in new[] { ("English", "en"), ("French", "fr"), ("Traditional Chinese", "zh-TW") }) {
                writer.Write(id++);
                foreach (string text in new[] { name, name, tag, tag }) { writer.Write(Encoding.Unicode.GetBytes(text)); writer.Write((ushort)0); }
                writer.Write(new byte[12]);
            }
        }
        byte[] languageBytes = language.ToArray();
        File.WriteAllBytes(Path.Combine(game, "Bundles2", "fixture.bundle.bin"), FixtureEnvelope(languageBytes));
        byte[] pathBytes = Encoding.UTF8.GetBytes("data/languages.dat");
        using var paths = new MemoryStream();
        using (var writer = new BinaryWriter(paths, Encoding.UTF8, true)) { writer.Write(1); writer.Write(pathBytes); writer.Write((byte)0); }
        using var body = new MemoryStream();
        using (var writer = new BinaryWriter(body, Encoding.UTF8, true)) {
            writer.Write(1); writer.Write(7); writer.Write(Encoding.UTF8.GetBytes("fixture")); writer.Write(languageBytes.Length);
            ulong hash = 0xCBF29CE484222325ul;
            foreach (byte value in pathBytes) hash = unchecked((hash ^ value) * 0x100000001B3ul);
            hash = unchecked((((hash ^ '+') * 0x100000001B3ul) ^ '+') * 0x100000001B3ul);
            writer.Write(1); writer.Write(hash); writer.Write(0); writer.Write(0); writer.Write(languageBytes.Length);
            writer.Write(1); writer.Write(0x07E47507B4A92E53ul); writer.Write(0); writer.Write((int)paths.Length); writer.Write((int)paths.Length);
            writer.Write(FixtureEnvelope(paths.ToArray()));
        }
        var index = Path.Combine(game, "Bundles2", "_.index.bin");
        File.WriteAllBytes(index, FixtureEnvelope(body.ToArray()));
        var steamLog = Path.Combine(root, "content_log.txt");
        string stamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);
        File.WriteAllText(steamLog, $"[{stamp}] Start validating appID 238960 on BuildID 456\n[{stamp}] AppID 238960 finished update, 2 mounted depots (BuildID 456)\n[{stamp}] AppID 238960 scheduler finished : removed from schedule (result No Error, state 0xc)\n");
        var tx = new GameTransaction(game, store, ini, () => true, () => steamLog);
        tx.EstablishBaseline();
        var request = new System.Text.Json.Nodes.JsonObject { ["gameDirectory"] = game, ["storageRoot"] = store, ["configPath"] = ini,
            ["manifest"] = new System.Text.Json.Nodes.JsonObject { ["releaseId"] = "workflow-v1" }, ["entries"] = new System.Text.Json.Nodes.JsonArray() };
        var initialPreview = JsonSerializer.SerializeToNode(Program.Preview(request, tx), Json)!;
        Program.Apply(request, tx);
        var appliedHash = Hash(index);
        var errors = new List<string>();
        try {
            var preview = JsonSerializer.SerializeToNode(Program.Preview(request, tx), Json)!;
            if (!System.Text.Json.Nodes.JsonNode.DeepEquals(initialPreview["counts"], preview["counts"]) || Hash(index) != appliedHash)
                errors.Add("Preview changed applied resources or coverage");
        } catch (Exception error) { errors.Add("Preview after apply failed: " + error.Message); }
        File.WriteAllText(ini, originalConfig);
        bool blocked = false; try { tx.EnsureAppliedLanguage("other-release"); } catch (UserError) { blocked = true; }
        if (!blocked || File.ReadAllText(ini) != originalConfig) errors.Add("Mismatched release changed the language");
        var running = new GameTransaction(game, store, ini, () => false, () => steamLog);
        blocked = false; try { running.EnsureAppliedLanguage("workflow-v1"); } catch (UserError) { blocked = true; }
        if (!blocked || File.ReadAllText(ini) != originalConfig) errors.Add("Repeated apply ignored a running game");
        var repeated = JsonSerializer.SerializeToNode(Program.Apply(request, tx), Json)!;
        if (repeated["unchanged"]?.GetValue<bool>() != true || !File.ReadAllText(ini).Contains("language=fr") || Hash(index) != appliedHash)
            errors.Add("Repeated apply did not restore the managed language without rewriting the index");
        tx.Restore();
        if (File.ReadAllText(ini) != originalConfig) errors.Add("Repeated apply overwrote the original language backup");
        if (errors.Count > 0) throw new InvalidDataException(string.Join("; ", errors));
        return 5;
    }

    private static byte[] FixtureEnvelope(byte[] payload) {
        int count = payload.Length == 0 ? 0 : 1, packed = count == 0 ? 0 : payload.Length + 2;
        byte[] output = new byte[60 + count * 4 + packed];
        BinaryPrimitives.WriteInt32LittleEndian(output, payload.Length);
        BinaryPrimitives.WriteInt32LittleEndian(output.AsSpan(4), packed);
        BinaryPrimitives.WriteInt32LittleEndian(output.AsSpan(8), 48 + 4 * count);
        BinaryPrimitives.WriteInt32LittleEndian(output.AsSpan(12), 8);
        BinaryPrimitives.WriteInt32LittleEndian(output.AsSpan(16), 1);
        BinaryPrimitives.WriteInt64LittleEndian(output.AsSpan(20), payload.Length);
        BinaryPrimitives.WriteInt64LittleEndian(output.AsSpan(28), packed);
        BinaryPrimitives.WriteInt32LittleEndian(output.AsSpan(36), count);
        BinaryPrimitives.WriteInt32LittleEndian(output.AsSpan(40), 262144);
        if (count != 0) { BinaryPrimitives.WriteInt32LittleEndian(output.AsSpan(60), packed); output[64] = 0xcc; output[65] = 6; payload.CopyTo(output, 66); }
        return output;
    }
}
