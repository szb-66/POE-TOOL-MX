using System.Diagnostics;
using System.Buffers.Binary;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace LocalizationHelper;

/// <summary>Owns only the Steam index, PoEHelper bundles and the language setting.</summary>
public sealed class GameTransaction {
    public sealed record BaselineStatus(bool Ready, string Reason);
    public sealed record Snapshot(string BuildId, string GameVersion, string IndexHash, BaselineStatus Baseline,
        bool Applied, string? ReleaseId, bool RecoveryNeeded, string? Mode = null);
    private sealed record Baseline(int Version, string BuildId, string GameVersion, string IndexHash, string IndexFile,
        DateTime VerificationCompleted, string VerificationLogHash, string? OriginalLanguage);
    private sealed record Active(int Version, string BuildId, string OutputHash, string ReleaseId, string Generation, string Mode = "simplified");
    private sealed record Journal(int Version, string Operation, string BuildId, string BeforeHash, string AfterHash,
        string BeforeIndex, string? BeforeLanguage, string? Generation, Active? BeforeActive, Active? AfterActive);
    private static readonly JsonSerializerOptions Json = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private readonly string game, storage, config, steamapps, manifest, index, baselineFile, activeFile, journalFile;
    private readonly Func<bool> gameStopped;

    internal static string ValidateMode(string? mode) => mode is "simplified" or "traditional" ? mode : throw new UserError("汉化模式无效，请选择简体或繁体");

    public GameTransaction(string gameDirectory, string storageRoot, string? configPath = null)
        : this(gameDirectory, storageRoot, configPath ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            "My Games", "Path of Exile", "production_Config.ini"), AreGameProcessesStopped) { }

    private GameTransaction(string gameDirectory, string storageRoot, string configPath, Func<bool> stopped) {
        game = Path.GetFullPath(gameDirectory).TrimEnd(Path.DirectorySeparatorChar);
        storage = Path.GetFullPath(storageRoot).TrimEnd(Path.DirectorySeparatorChar);
        config = Path.GetFullPath(configPath);
        steamapps = Directory.GetParent(game)?.Parent?.FullName ?? throw new UserError("请选择 Steam 游戏安装目录");
        manifest = Path.Combine(steamapps, "appmanifest_238960.acf");
        index = Path.Combine(game, "Bundles2", "_.index.bin");
        baselineFile = Path.Combine(storage, "baseline.json"); activeFile = Path.Combine(storage, "transaction-active.json");
        journalFile = Path.Combine(storage, "transaction.json");
        gameStopped = stopped;
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
        bool applied = active is { Version: 1, Mode: "simplified" or "traditional" } && active.BuildId == build && active.OutputHash == hash;
        bool ready = ValidBaseline(baseline, build) && (hash == baseline!.IndexHash || applied);
        return new(build, GameVersion(), hash, new(ready, ready ? "" : "应用汉化时将自动检查并备份游戏资源"),
            applied, applied ? active!.ReleaseId : null, File.Exists(journalFile), applied ? active!.Mode : null);
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
        var previousBaseline = Read<Baseline>(baselineFile); var previousActive = Read<Active>(activeFile);
        if (previousBaseline?.BuildId == snapshot.BuildId)
            throw new UserError("游戏索引或应用前备份已发生外部变化，未覆盖原备份；请恢复修改或修复游戏文件后重试");
        using (var current = Program.Open(game, paths: false)) foreach (var bundle in current.Bundles.Span) {
            if (bundle.Path.StartsWith("PoEHelper/", StringComparison.OrdinalIgnoreCase) || bundle.Path.StartsWith("LibGGPK3/", StringComparison.OrdinalIgnoreCase))
                throw new UserError("游戏资源仍引用旧补丁，无法建立应用前备份；请先恢复游戏文件");
        }
        var relative = Path.Combine("baselines", snapshot.BuildId, snapshot.IndexHash + ".index.bin");
        DurableWrite(Stored(relative), File.ReadAllBytes(index));
        RequireWritable();
        if (Value(Manifest(), "buildid") != snapshot.BuildId || Hash(index) != snapshot.IndexHash || Hash(Stored(relative)) != snapshot.IndexHash)
            throw new UserError("建立备份时游戏版本或索引发生变化，未建立备份");
        var originalLanguage = previousActive != null && previousBaseline != null && Language() == "fr" ? previousBaseline.OriginalLanguage : Language();
        // Keep legacy metadata fields readable; automatic checks do not claim a Steam log verification.
        Save(baselineFile, new Baseline(1, snapshot.BuildId, snapshot.GameVersion, snapshot.IndexHash, relative, DateTime.UtcNow, "", originalLanguage));
        if (File.Exists(activeFile)) File.Delete(activeFile);
        return Inspect();
    }

    public Snapshot EnsureAppliedLanguage(string releaseId, string mode = "simplified") {
        ValidateMode(mode);
        using var guard = Lock(); RequireWritable();
        if (File.Exists(journalFile)) throw new UserError("存在未完成汉化事务，请先恢复事务");
        var snapshot = Inspect();
        if (!snapshot.Baseline.Ready || !snapshot.Applied || snapshot.ReleaseId != releaseId || snapshot.Mode != mode)
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

    public Snapshot Commit(string candidateIndexPath, string candidateBundleRoot, string releaseId, string generation, string mode = "simplified") {
        ValidateMode(mode);
        using var guard = Lock(); RequireWritable();
        var staging = Path.Combine(storage, "staging"); var candidate = Path.GetFullPath(candidateIndexPath); var bundles = Path.GetFullPath(candidateBundleRoot);
        if (!Within(staging, candidate) || !Within(staging, bundles) || !File.Exists(candidate) || !Directory.Exists(bundles)) throw new UserError("补丁候选不属于受管暂存目录");
        if (!Regex.IsMatch(generation, @"^[A-Za-z0-9_-]{1,80}$") || !Regex.IsMatch(releaseId, @"^[A-Za-z0-9._-]{1,120}$")) throw new UserError("补丁版本或事务标识无效");
        RequireOrdinaryPath(candidate); RequireOrdinaryPath(bundles);
        if (File.Exists(journalFile)) throw new UserError("存在未完成汉化事务，请先恢复事务");
        var snapshot = Inspect(); if (!snapshot.Baseline.Ready) throw new UserError("缺少当前游戏版本的有效应用前备份，未替换游戏文件");
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
        var after = new Active(1, snapshot.BuildId, outputHash, releaseId, generation, mode);
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
        var targetIndex = Path.Combine(game, "Bundles2", "_.index.bin");
        var original = FixtureIndex(); File.WriteAllBytes(targetIndex, original);
        File.WriteAllText(ini, "[LANGUAGE]\r\nlanguage=en\r\nchat_language=en\r\n[OTHER]\r\nkeep=true\r\n");
        var tx = new GameTransaction(game, store, ini, () => true);
        if (!tx.EstablishBaseline().Baseline.Ready) throw new InvalidDataException("Automatic baseline without Steam logs failed");
        var savedBaseline = File.ReadAllBytes(tx.baselineFile);
        File.WriteAllBytes(targetIndex, FixtureIndex("external"));
        bool blocked = false; try { tx.EstablishBaseline(); } catch (UserError) { blocked = true; }
        if (!blocked || !savedBaseline.AsSpan().SequenceEqual(File.ReadAllBytes(tx.baselineFile))) throw new InvalidDataException("External index change overwrote original backup");
        File.WriteAllBytes(targetIndex, original);
        var originalBackup = tx.BaselineIndexPath;
        File.WriteAllText(originalBackup, "damaged backup");
        blocked = false; try { tx.EstablishBaseline(); } catch (UserError) { blocked = true; }
        if (!blocked || File.ReadAllText(originalBackup) != "damaged backup") throw new InvalidDataException("Corrupt backup silently replaced");
        File.WriteAllBytes(originalBackup, original);
        var corruptStore = Path.Combine(root, "corrupt-cache");
        File.WriteAllText(targetIndex, "invalid index");
        var corrupt = new GameTransaction(game, corruptStore, ini, () => true);
        blocked = false; try { corrupt.EstablishBaseline(); } catch (InvalidDataException) { blocked = true; }
        if (!blocked || File.Exists(corrupt.baselineFile)) throw new InvalidDataException("Invalid index accepted as automatic baseline");
        File.WriteAllBytes(targetIndex, FixtureIndex("PoEHelper/orphan/0"));
        var orphaned = new GameTransaction(game, Path.Combine(root, "orphan-cache"), ini, () => true);
        blocked = false; try { orphaned.EstablishBaseline(); } catch (UserError) { blocked = true; }
        if (!blocked || File.Exists(orphaned.baselineFile)) throw new InvalidDataException("Untracked managed patch accepted as baseline");
        File.WriteAllBytes(targetIndex, original);
        var stage = Path.Combine(store, "staging", "g1"); Directory.CreateDirectory(stage);
        var candidate = Path.Combine(stage, "candidate.index.bin"); File.WriteAllText(candidate, "patched");
        var bundle = Path.Combine(stage, "bundles"); Directory.CreateDirectory(bundle); File.WriteAllText(Path.Combine(bundle, "0.bundle.bin"), "bundle");
        tx.Commit(candidate, bundle, "fixture-v1", "fixture1");
        if (!tx.Inspect().Applied || !File.ReadAllText(ini).Contains("language=fr")) throw new InvalidDataException("Commit not visible");
        tx.Restore();
        if (!File.ReadAllBytes(targetIndex).AsSpan().SequenceEqual(original) || !File.ReadAllText(ini).Contains("language=en") || !File.ReadAllText(ini).Contains("keep=true")) throw new InvalidDataException("Restore failed");
        tx.Commit(candidate, bundle, "fixture-v1", "fixture2");
        File.WriteAllText(acf, File.ReadAllText(acf).Replace("\"123\"", "\"124\""));
        blocked = false; try { tx.Restore(); } catch (UserError) { blocked = true; }
        if (!blocked || File.ReadAllText(targetIndex) != "patched") throw new InvalidDataException("Cross-version restore accepted");
        File.WriteAllText(acf, File.ReadAllText(acf).Replace("\"124\"", "\"123\""));
        var baseline = tx.Read<Baseline>(tx.baselineFile)!;
        tx.SaveTestInterruptedApply(baseline);
        tx.Recover();
        if (!File.ReadAllBytes(targetIndex).AsSpan().SequenceEqual(original) || tx.Inspect().Applied || tx.Inspect().RecoveryNeeded) throw new InvalidDataException("Crash rollback failed");
        File.WriteAllText(ini, "[LANGUAGE]");
        tx.Commit(candidate, bundle, "fixture-v1", "fixture3");
        if (!File.ReadAllText(ini).Contains("[LANGUAGE]\r\nlanguage=fr")) throw new InvalidDataException("Missing config newline");
        File.WriteAllBytes(targetIndex, original); // Steam validation restored our index outside the helper.
        tx.Restore();
        if (tx.Inspect().Applied || !File.ReadAllText(ini).Contains("language=en")) throw new InvalidDataException("Steam-restored index left managed language active");
        File.WriteAllText(ini, "[LANGUAGE]\nlanguage=en\nlanguage=ko-KR\n");
        blocked = false; try { tx.Commit(candidate, bundle, "fixture-v1", "fixture4"); } catch (UserError) { blocked = true; }
        if (!blocked || !File.ReadAllBytes(targetIndex).AsSpan().SequenceEqual(original) || tx.Inspect().RecoveryNeeded) throw new InvalidDataException("Duplicate language keys accepted");
        File.WriteAllText(ini, "[LANGUAGE]\nlanguage=en\n");
        foreach (var probe in new Func<bool>[] { () => false, () => throw new IOException("unknown process state") }) {
            var gated = new GameTransaction(game, store, ini, probe);
            blocked = false; try { gated.RequireWritable(); } catch (UserError) { blocked = true; }
            if (!blocked) throw new InvalidDataException("Unsafe process state accepted");
        }
        string oldBackup = tx.BaselineIndexPath;
        File.WriteAllText(acf, File.ReadAllText(acf).Replace("\"123\"", "\"125\""));
        File.WriteAllBytes(targetIndex, FixtureIndex("newbuild"));
        if (!tx.EstablishBaseline().Baseline.Ready || !File.ReadAllBytes(oldBackup).AsSpan().SequenceEqual(original)) throw new InvalidDataException("New build did not preserve previous backup");
        Directory.CreateDirectory(Path.Combine(root, "library", "steamapps", "downloading", "238960"));
        blocked = false; try { tx.RequireWritable(); } catch (UserError) { blocked = true; }
        if (!blocked) throw new InvalidDataException("Steam update stage accepted");
        return new { passed = true, cases = 18 + WorkflowSelfTest(Path.Combine(root, "workflow")) };
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
        var resources = new[] { (Path: "data/languages.dat", Bytes: languageBytes),
            (Path: "data/clientstrings.datc64", Bytes: FixtureClientStrings("Spark")),
            (Path: "data/traditional chinese/clientstrings.datc64", Bytes: FixtureClientStrings("電球")) };
        byte[] resourceBytes = resources.SelectMany(resource=>resource.Bytes).ToArray();
        File.WriteAllBytes(Path.Combine(game, "Bundles2", "fixture.bundle.bin"), FixtureEnvelope(resourceBytes));
        using var paths = new MemoryStream();
        using (var writer = new BinaryWriter(paths, Encoding.UTF8, true)) foreach(var resource in resources) { writer.Write(1); writer.Write(Encoding.UTF8.GetBytes(resource.Path)); writer.Write((byte)0); }
        using var body = new MemoryStream();
        using (var writer = new BinaryWriter(body, Encoding.UTF8, true)) {
            writer.Write(1); writer.Write(7); writer.Write(Encoding.UTF8.GetBytes("fixture")); writer.Write(resourceBytes.Length);
            writer.Write(resources.Length); int offset=0;
            foreach(var resource in resources) {
                ulong hash = 0xCBF29CE484222325ul;
                foreach (byte value in Encoding.UTF8.GetBytes(resource.Path)) hash = unchecked((hash ^ value) * 0x100000001B3ul);
                hash = unchecked((((hash ^ '+') * 0x100000001B3ul) ^ '+') * 0x100000001B3ul);
                writer.Write(hash); writer.Write(0); writer.Write(offset); writer.Write(resource.Bytes.Length); offset+=resource.Bytes.Length;
            }
            writer.Write(1); writer.Write(0x07E47507B4A92E53ul); writer.Write(0); writer.Write((int)paths.Length); writer.Write((int)paths.Length);
            writer.Write(FixtureEnvelope(paths.ToArray()));
        }
        var index = Path.Combine(game, "Bundles2", "_.index.bin");
        File.WriteAllBytes(index, FixtureEnvelope(body.ToArray()));
        var tx = new GameTransaction(game, store, ini, () => true);
        var request = new System.Text.Json.Nodes.JsonObject { ["gameDirectory"] = game, ["storageRoot"] = store, ["configPath"] = ini,
            ["manifest"] = new System.Text.Json.Nodes.JsonObject { ["releaseId"] = "workflow-v1" },
            ["entries"] = new System.Text.Json.Nodes.JsonArray(new System.Text.Json.Nodes.JsonObject { ["kind"]="dat",["table"]="clientstrings",["id"]="ModeFixture",["field"]="Text",["en"]="Spark",["cn"]="电球",["sourceHash"]=Program.Hash(Encoding.UTF8.GetBytes("Spark")) }) };
        var simplifiedEntries=request["entries"]!.DeepClone();
        var clientStringsSchema=System.Text.Json.Nodes.JsonNode.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory,"schema.json")))!["tables"]!.AsArray().First(table=>table?["name"]?.GetValue<string>()=="ClientStrings")!.AsObject();
        string DisplayText() { using var current=Program.Open(game); if(!current.TryGetFile("data/traditional chinese/clientstrings.datc64",out var file))throw new InvalidDataException("Fixture text missing");return new DatTable(file.Read().ToArray(),clientStringsSchema,2).ReadText("ModeFixture","Text"); }
        Program.Apply(request, tx);
        var appliedHash = Hash(index);
        var errors = new List<string>();
        if(tx.Inspect().Mode!="simplified" || DisplayText()!="电球") errors.Add("Simplified mode did not apply CN display text");
        var originalBaseline=File.ReadAllBytes(tx.baselineFile);
        var legacyActive=System.Text.Json.Nodes.JsonNode.Parse(File.ReadAllText(tx.activeFile))!.AsObject(); legacyActive.Remove("mode");
        File.WriteAllText(tx.activeFile,legacyActive.ToJsonString(Json));
        if(tx.Inspect().Mode!="simplified") errors.Add("Legacy active record without mode lost simplified compatibility");
        bool exportBlocked=false;
        try { new ResourceEngine().Export(game,null); }
        catch(UserError error) { exportBlocked=error.Message.Contains("应用前备份",StringComparison.Ordinal); }
        if(!exportBlocked) errors.Add("Managed translations were accepted as an original export source");
        using(var originalSource=Program.Open(game,indexPath:tx.BaselineIndexPath)) ResourceEngine.RequireOriginalExportSource(originalSource);
        File.WriteAllText(ini, originalConfig);
        bool blocked = false; try { tx.EnsureAppliedLanguage("other-release"); } catch (UserError) { blocked = true; }
        if (!blocked || File.ReadAllText(ini) != originalConfig) errors.Add("Mismatched release changed the language");
        var running = new GameTransaction(game, store, ini, () => false);
        blocked = false; try { running.EnsureAppliedLanguage("workflow-v1"); } catch (UserError) { blocked = true; }
        if (!blocked || File.ReadAllText(ini) != originalConfig) errors.Add("Repeated apply ignored a running game");
        var repeated = JsonSerializer.SerializeToNode(Program.Apply(request, tx), Json)!;
        if (repeated["unchanged"]?.GetValue<bool>() != true || !File.ReadAllText(ini).Contains("language=fr") || Hash(index) != appliedHash)
            errors.Add("Repeated apply did not restore the managed language without rewriting the index");
        request["mode"]="traditional"; request["entries"]=new System.Text.Json.Nodes.JsonArray(System.Text.Json.Nodes.JsonValue.Create("must not be read"));
        var traditional=JsonSerializer.SerializeToNode(Program.Apply(request,tx),Json)!;
        if(traditional["unchanged"]?.GetValue<bool>()==true || tx.Inspect().Mode!="traditional" || tx.Inspect().ReleaseId!="workflow-v1" || DisplayText()!="電球")
            errors.Add("Same-release switch to traditional reused simplified output or read server entries");
        var traditionalHash=Hash(index); File.WriteAllText(ini,originalConfig);
        var repeatedTraditional=JsonSerializer.SerializeToNode(Program.Apply(request,tx),Json)!;
        if(repeatedTraditional["unchanged"]?.GetValue<bool>()!=true || Hash(index)!=traditionalHash || !File.ReadAllText(ini).Contains("language=fr"))
            errors.Add("Repeated traditional apply rewrote the index or failed to restore language");
        request["mode"]="simplified"; request["entries"]=simplifiedEntries.DeepClone();
        Program.Apply(request,tx);
        if(tx.Inspect().Mode!="simplified" || DisplayText()!="电球") errors.Add("Same-release switch back to simplified reused traditional output");
        foreach(var invalidMode in new System.Text.Json.Nodes.JsonNode?[]{System.Text.Json.Nodes.JsonValue.Create("unknown"),System.Text.Json.Nodes.JsonValue.Create(7),null}) {
            var beforeIndex=Hash(index);var beforeActive=File.ReadAllBytes(tx.activeFile);var beforeLanguage=File.ReadAllText(ini);
            request["mode"]=invalidMode; bool modeBlocked=false;try { Program.Apply(request,tx); } catch(UserError) { modeBlocked=true; }
            if(!modeBlocked || Hash(index)!=beforeIndex || !beforeActive.AsSpan().SequenceEqual(File.ReadAllBytes(tx.activeFile)) || File.ReadAllText(ini)!=beforeLanguage)
                errors.Add("Invalid mode changed game state before rejection");
        }
        request["mode"]="traditional"; request.Remove("manifest");request["entries"]=new System.Text.Json.Nodes.JsonArray();
        Program.Apply(request,tx);
        if(tx.Inspect().Mode!="traditional" || tx.Inspect().ReleaseId!="native-tw" || DisplayText()!="電球")errors.Add("Traditional mode without a server manifest failed");
        if(!originalBaseline.AsSpan().SequenceEqual(File.ReadAllBytes(tx.baselineFile))) errors.Add("Mode switches replaced the original baseline");
        tx.Restore();
        if (File.ReadAllText(ini) != originalConfig || DisplayText()!="電球" || tx.Inspect().Mode!=null) errors.Add("Mode restore overwrote original language or text");
        if (errors.Count > 0) throw new InvalidDataException(string.Join("; ", errors));
        return 17;
    }

    private static byte[] FixtureClientStrings(string text) {
        // One current-schema 52-byte row: only Id/Text pointers and a fixed mechanic hash are populated.
        using var stream=new MemoryStream();stream.Write(new byte[64]);
        BinaryPrimitives.WriteUInt32LittleEndian(stream.GetBuffer(),1);stream.GetBuffer().AsSpan(56,8).Fill(0xbb);
        BinaryPrimitives.WriteUInt32LittleEndian(stream.GetBuffer().AsSpan(36,4),0x12345678);
        foreach(var item in new[]{(Offset:4,Text:"ModeFixture"),(Offset:12,Text:text)}) {
            ulong pointer=(ulong)(stream.Length-56);stream.Position=stream.Length;stream.Write(Encoding.Unicode.GetBytes(item.Text+"\0"));
            BinaryPrimitives.WriteUInt64LittleEndian(stream.GetBuffer().AsSpan(item.Offset,8),pointer);
        }
        return stream.ToArray();
    }

    private static byte[] FixtureIndex(string? bundle = null) {
        using var body = new MemoryStream();
        using (var writer = new BinaryWriter(body, Encoding.UTF8, true)) {
            writer.Write(bundle == null ? 0 : 1);
            if (bundle != null) { var name = Encoding.UTF8.GetBytes(bundle); writer.Write(name.Length); writer.Write(name); writer.Write(0); }
            writer.Write(0); writer.Write(0); writer.Write(FixtureEnvelope([]));
        }
        return FixtureEnvelope(body.ToArray());
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
