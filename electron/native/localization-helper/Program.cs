using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using LibBundle3;
using BundleIndex = LibBundle3.Index;

namespace LocalizationHelper;

public static class Program {
    internal static readonly JsonSerializerOptions Json = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.Create(System.Text.Unicode.UnicodeRanges.All) };
    public static int Main(string[] args) {
        if (args.Length == 1 && args[0] == "--market-host") return MarketHost.Run();
        Console.InputEncoding = new UTF8Encoding(false); Console.OutputEncoding = new UTF8Encoding(false);
        try {
            string line = Console.ReadLine() ?? throw new InvalidDataException("Missing request");
            if (line.Length > 128 * 1024 * 1024) throw new InvalidDataException("Request too large");
            var request = JsonNode.Parse(line)!.AsObject();
            if (request["protocolVersion"]?.GetValue<int>() != 1) throw new InvalidDataException("Unsupported protocol");
            object data = request["operation"]?.GetValue<string>() switch {
                "scan" => Scan(request),
                "self-test" => SelfTest(),
                "export" => Export(request),
                "apply" => Apply(request),
                "restore" => Restore(request),
                _ => throw new InvalidDataException("Unsupported operation")
            };
            Console.WriteLine(JsonSerializer.Serialize(new { protocolVersion = 1, type = "result", success = true, data }, Json)); return 0;
        } catch (Exception error) {
            // Exceptions may contain complete local paths; expose only stable messages.
            var code = error is DllNotFoundException ? "CODEC_UNAVAILABLE" : "LOCALIZATION_FAILED";
            var message = error is UserError user ? user.Message : "游戏资源读取或格式校验失败，请查看本机诊断并验证游戏文件";
            Console.Error.WriteLine(error.GetType().Name + ": " + error.Message);
            Console.WriteLine(JsonSerializer.Serialize(new { protocolVersion = 1, type = "result", success = false, error = new { code, message } }, Json)); return 1;
        }
    }
    internal static string Hash(ReadOnlySpan<byte> bytes) => Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
    internal static string HashFile(string file) { using var stream = File.OpenRead(file); return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant(); }
    internal static BundleIndex Open(string game, bool paths = true, string? indexPath = null) {
        string bundles = Path.Combine(game, "Bundles2");
        return new BundleIndex(new MemoryStream(NativeBundleValidation.ReadIndex(indexPath ?? Path.Combine(bundles, "_.index.bin"))), false, paths, new ReadOnlyFactory(bundles));
    }
    internal static object Scan(JsonObject request) {
        var game = Path.GetFullPath(request["gameDirectory"]!.GetValue<string>());
        using var index = Open(game);
        var names = index.Files.Values.Where(f => f.Path != null).Select(f => f.Path).ToArray();
        var langs = names.Where(p => p.Contains("languages.dat", StringComparison.OrdinalIgnoreCase)).ToArray();
        var tw = names.Where(p => p.StartsWith("data/traditional chinese/", StringComparison.OrdinalIgnoreCase)).ToArray();
        var cn = names.Count(p => p.StartsWith("data/simplified chinese/", StringComparison.OrdinalIgnoreCase));
        var samples = new List<object>();
        foreach (var path in langs.Concat(tw.Where(p => p.Contains("clientstrings", StringComparison.OrdinalIgnoreCase))).Take(5)) {
            index.TryGetFile(path, out var record); var bytes = record!.Read().ToArray();
            samples.Add(new { resource = path, bytes = bytes.Length, sha256 = Hash(bytes), header = Convert.ToHexString(bytes.AsSpan(0, Math.Min(32, bytes.Length))) });
        }
        int parsed=0; var schema=JsonNode.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory,"schema.json")))!["tables"]!.AsArray().First(s=>s?["name"]?.GetValue<string>()=="ClientStrings")!.AsObject();
        var encodingChecks=new List<object>();
        foreach(var ext in new[]{"datc64","datcl64"}) if(index.TryGetFile("data/clientstrings."+ext,out var file)) {
            var data=file.Read().ToArray();int unit=ext=="datcl64" ? 4:2;var table=new DatTable(data,schema,unit);
            if(!table.ToArray().AsSpan().SequenceEqual(data) || table.IdField!="Id" || table.ReadText("GameName","Text")!="Path of Exile")throw new InvalidDataException("DAT full-string probe mismatch");
            table.SetText("GameName","Text","Path of Exile [memory-only check]");var changed=table.ToArray();var reread=new DatTable(changed,schema,unit);
            if(reread.ReadText("GameName","Text")!="Path of Exile [memory-only check]")throw new InvalidDataException("DAT replacement readback mismatch");
            parsed+=table.RowCount;encodingChecks.Add(new {resource=file.Path,codeUnitSize=unit,stableIdField=table.IdField,originalTitle="Path of Exile",readbackVerified=true});
        }
        JsonObject result=JsonSerializer.SerializeToNode(new { gameVersion = GameVersion(game), indexHash = HashFile(Path.Combine(game,"Bundles2","_.index.bin")), resourceCount = names.Length, traditionalTables = tw.Length, simplifiedTables = cn, samples, codec = "ooz-0503806-raw-frame", parsedRows=parsed,encodingChecks, counts = new { simplified = 0, traditional = 0, english = 0, skipped = 0 } },Json)!.AsObject();
        if(request["storageRoot"] is JsonValue storage) {
            var snapshot=new GameTransaction(game,storage.GetValue<string>(),request["configPath"]?.GetValue<string>()).Inspect();
            foreach(var pair in JsonSerializer.SerializeToNode(snapshot,Json)!.AsObject()) result[pair.Key]=pair.Value?.DeepClone();
            result["resourceVersion"]=snapshot.ReleaseId;
            var coverage=Path.Combine(storage.GetValue<string>(),"applied-coverage.json");
            if(snapshot.Applied && File.Exists(coverage)) { var summary=JsonNode.Parse(File.ReadAllText(coverage));if(summary?["indexHash"]?.GetValue<string>()==snapshot.IndexHash)result["counts"]=summary["counts"]?.DeepClone(); }
        } else result["baseline"]=new JsonObject{["ready"]=false,["reason"]="应用汉化时将自动检查并备份游戏资源"};
        return result;
    }
    internal static object SelfTest() {
        Oodle.Initialize(new Oodle.Settings());
        foreach (int size in new[] { 0, 1, 65536, 262144, 262145, 524288 }) {
            var data = new byte[size]; RandomNumberGenerator.Fill(data); var compressed = new byte[Oodle.GetCompressedBufferSize(size)];
            int length = Oodle.Compress(data, compressed); var result = new byte[size];
            if (Oodle.Decompress(compressed.AsSpan(0,length), result) != size || !data.AsSpan().SequenceEqual(result)) throw new InvalidDataException("Codec roundtrip failed");
        }
        return new { passed = true, codecCases = 6, dataCases = LocalizationDataSelfTest.Run(), bundleCases=NativeBundleValidation.SelfTest(Path.Combine(Path.GetTempPath(),"poe-localization-selftest")), transaction = GameTransaction.SelfTest(Path.Combine(Path.GetTempPath(),"poe-localization-selftest")) };
    }
    internal static void Progress(string phase,int completed,int total) => Console.WriteLine(JsonSerializer.Serialize(new{protocolVersion=1,type="progress",phase,completed,total},Json));
    internal static string GameVersion(string game) {
        string file=Path.Combine(game,"logs","LatestClient.txt"); if(!File.Exists(file))file=Path.Combine(game,"logs","Client.txt");
        if(File.Exists(file)) return VersionFromLog(File.ReadAllText(file));
        return "unverified";
    }
    internal static string VersionFromLog(string log) {
        var matches=Regex.Matches(log,@"(?:release|poe1_production2_tc)/tags/([a-zA-Z0-9._-]+)");
        return matches.Count>0 ? matches[^1].Groups[1].Value : "unverified";
    }
    private static GameTransaction Transaction(JsonObject request) => new(request["gameDirectory"]!.GetValue<string>(),request["storageRoot"]!.GetValue<string>(),request["configPath"]?.GetValue<string>());
    private static object Export(JsonObject request) {
        string? sourceIndex=request["storageRoot"] == null ? null : Transaction(request).BaselineIndexPath;
        var result=new ResourceEngine().Export(request["gameDirectory"]!.GetValue<string>(),request["cnGameDirectory"]?.GetValue<string>(),sourceIndex);
        string file=Path.GetFullPath(request["outputPath"]!.GetValue<string>()); Directory.CreateDirectory(Path.GetDirectoryName(file)!);
        File.WriteAllText(file, result.ToJsonString(Json),new UTF8Encoding(false));return result["report"]!;
    }
    internal static object Apply(JsonObject request, GameTransaction? transaction = null) {
        string? requestedMode = !request.ContainsKey("mode") ? "simplified" : request["mode"] is JsonValue value && value.TryGetValue<string>(out var text) ? text : null;
        string mode=GameTransaction.ValidateMode(requestedMode);
        transaction ??= Transaction(request); transaction.RequireWritable(); transaction.Recover();
        var snapshot=transaction.EstablishBaseline();
        string game=request["gameDirectory"]!.GetValue<string>(),storage=request["storageRoot"]!.GetValue<string>();
        string release=request["manifest"]?["releaseId"]?.GetValue<string>() ?? "native-tw";
        if(snapshot.Applied && snapshot.ReleaseId==release && snapshot.Mode==mode) { var unchanged=JsonSerializer.SerializeToNode(transaction.EnsureAppliedLanguage(release,mode),Json)!.AsObject();unchanged["resourceVersion"]=release;unchanged["unchanged"]=true;return unchanged; }
        string generation="g-"+Guid.NewGuid().ToString("N"),stage=Path.Combine(storage,"staging",generation);
        Directory.CreateDirectory(stage);
        var baseline=transaction.BaselineIndexPath;
        Dictionary<string,byte[]> outputs; object counts;
        // Always rebuild from the same-version pre-apply backup, never stack patches.
        var prefix=typeof(BundleIndex).GetField("CUSTOM_BUNDLE_BASE_PATH",System.Reflection.BindingFlags.Static|System.Reflection.BindingFlags.Public) ?? throw new UserError("原生组件未包含受管bundle路径支持");
        prefix.SetValue(null,"PoEHelper/"+generation+"/");
        var factory=new StageFactory(Path.Combine(game,"Bundles2"),stage,"PoEHelper/"+generation+"/");
        string candidate=Path.Combine(stage,"_.index.bin");
        var candidateMemory=new MemoryStream();candidateMemory.Write(NativeBundleValidation.ReadIndex(baseline));candidateMemory.Position=0;
        using(var index=new BundleIndex(candidateMemory,false,false,factory)) {
            outputs=new ResourceEngine().Build(index,mode=="traditional" ? new JsonArray() : request["entries"]?.AsArray() ?? new JsonArray(),out counts);
            int done=0;foreach(var output in outputs){ if(!index.TryGetFile(output.Key,out var record))throw new UserError("目标语言资源消失，请重新验证游戏");record.Write(output.Value);Progress("write-candidate",++done,outputs.Count); }
            index.Save();
            // Serialize completed index into a candidate file without touching original.
            var streamField=typeof(BundleIndex).GetField("baseBundle",System.Reflection.BindingFlags.Instance|System.Reflection.BindingFlags.NonPublic)!;
            var bundle=(Bundle)streamField.GetValue(index)!;
            var backing=typeof(Bundle).GetField("baseStream",System.Reflection.BindingFlags.Instance|System.Reflection.BindingFlags.NonPublic)!;
            File.WriteAllBytes(candidate,((MemoryStream)backing.GetValue(bundle)!).ToArray());
        }
        using(var check=new BundleIndex(new MemoryStream(NativeBundleValidation.ReadIndex(candidate)),false,false,factory)) foreach(var output in outputs) if(!check.TryGetFile(output.Key,out var record)||!record.Read().Span.SequenceEqual(output.Value)) throw new InvalidDataException("Candidate readback mismatch");
        File.WriteAllText(Path.Combine(storage,"applied-coverage.json"),JsonSerializer.Serialize(new {indexHash=HashFile(candidate),counts},Json));
        var final=transaction.Commit(candidate,Path.Combine(stage,"PoEHelper",generation),release,generation,mode);
        var result=JsonSerializer.SerializeToNode(final,Json)!.AsObject();result["resourceVersion"]=final.ReleaseId;result["counts"]=JsonSerializer.SerializeToNode(counts,Json);return result;
    }
    private static object Restore(JsonObject request) { var snapshot=Transaction(request).Restore();var result=JsonSerializer.SerializeToNode(snapshot,Json)!.AsObject();result["restored"]=true;result["resourceVersion"]=snapshot.ReleaseId;return result; }
}
public sealed class UserError(string message) : Exception(message);
internal class ReadOnlyFactory(string root) : DriveBundleFactory(root) {
    public override Bundle GetBundle(LibBundle3.Records.BundleRecord record) => new(NativeBundleValidation.OpenRead(NativeBundleValidation.Resolve(BaseDirectory,record.Path)), false, record);
    public override Stream CreateBundle(string path) => throw new InvalidOperationException("Read-only scan");
    public override bool DeleteBundle(string path) => throw new InvalidOperationException("Read-only scan");
}
internal class StageFactory(string root,string stage,string prefix) : DriveBundleFactory(root) {
    private string Safe(string relative){if(!relative.StartsWith(prefix,StringComparison.Ordinal)||relative.Contains("..")||relative.Contains('\\'))throw new InvalidDataException("Invalid managed bundle path");return Path.Combine(stage,relative.Replace('/',Path.DirectorySeparatorChar));}
    public override Bundle GetBundle(LibBundle3.Records.BundleRecord record) => record.Path.StartsWith(prefix,StringComparison.Ordinal) ? new(NativeBundleValidation.OpenRead(Safe(record.Path)),false,record) : new(NativeBundleValidation.OpenRead(NativeBundleValidation.Resolve(BaseDirectory,record.Path)),false,record);
    public override Stream CreateBundle(string path){string target=Safe(path);Directory.CreateDirectory(Path.GetDirectoryName(target)!);return File.Create(target);}
    public override bool DeleteBundle(string path)=>throw new InvalidOperationException("Candidate bundle deletion disabled");
}
