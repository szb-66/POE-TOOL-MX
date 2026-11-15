using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using LibBundle3;
using BundleIndex = LibBundle3.Index;

namespace LocalizationHelper;

internal sealed class ResourceEngine {
    private readonly JsonArray schemas;
    public ResourceEngine() { schemas = JsonNode.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory,"schema.json")))!["tables"]!.AsArray(); }
    private static readonly Regex Tokens = new(@"\{\d+(?::[^}]+)?\}|(?<!\w)#(?!\w)|%",RegexOptions.CultureInvariant);
    private static bool SameTokens(string a,string b) => Tokens.Matches(a).Select(m=>m.Value).Order(StringComparer.Ordinal).SequenceEqual(Tokens.Matches(b).Select(m=>m.Value).Order(StringComparer.Ordinal));
    private static string Text(JsonObject e,string key) => e[key]?.GetValue<string>() ?? "";
    private static DatTable? ReadTable(BundleIndex index,string path,JsonObject schema,bool unicode) {
        if (!index.TryGetFile(path,out var file)) return null;
        // PoE1 current compiled DAT resources use UTF-16 code units on Windows and UTF-32 in the long variant.
        return new DatTable(file.Read().ToArray(),schema,path.EndsWith(".datcl64",StringComparison.OrdinalIgnoreCase) ? 4 : 2);
    }
    private static string? Read(DatTable? table,string id,string field) {
        if(table==null || !table.RowsById.ContainsKey(id) || !table.Columns.Any(c=>c.Name==field && c.Type=="string" && !c.IsArray)) return null;
        try { return table.ReadText(id,field); }
        catch(Exception error) when(error is InvalidDataException or DecoderFallbackException) { return null; }
    }
    internal JsonObject Export(string game,string? cnGame) {
        using var index = Program.Open(game);
        using var cnIndex = cnGame == null ? null : Program.Open(cnGame);
        var entries = new JsonArray(); var skipped = new List<string>(); var skippedReasons=new JsonArray();
        int completed = 0;
        foreach (var node in schemas) {
            var schema = node!.AsObject(); string name = schema["name"]!.GetValue<string>().ToLowerInvariant();
            if (!schema["columns"]!.AsArray().Any(c=>c?["localized"]?.GetValue<bool>() == true && c?["type"]?.GetValue<string>() == "string")) continue;
            try {
                var en = ReadTable(index,$"data/{name}.datc64",schema,false);
                if (en == null || en.LocalizedFields.Count == 0) continue;
                var tw = ReadTable(index,$"data/traditional chinese/{name}.datc64",schema,false);
                DatTable? cn = null, cnEn = null;
                if (cnIndex != null) { try { cn = ReadTable(cnIndex,$"data/simplified chinese/{name}.datc64",schema,false); cnEn = ReadTable(cnIndex,$"data/{name}.datc64",schema,false); } catch (Exception error) when(error is InvalidDataException or DecoderFallbackException) { /* Old CN structure is not guessed. */ } }
                foreach (var id in en.RowsById.Keys) foreach (string field in en.LocalizedFields) {
                    string? original = Read(en,id,field); if (string.IsNullOrWhiteSpace(original)) continue;
                    string? traditional = Read(tw,id,field), simplified = Read(cn,id,field);
                    // A matching key is insufficient when the original source changed.
                    if (Read(cnEn,id,field) != original || simplified == null || simplified == original || !SameTokens(original,simplified)) simplified = null;
                    var entry = new JsonObject { ["table"]=name,["id"]=id,["field"]=field,["en"]=original,["kind"]="dat",["sourceHash"]=Program.Hash(Encoding.UTF8.GetBytes(original)) };
                    if (!string.IsNullOrEmpty(traditional)) entry["tw"] = traditional;
                    if (!string.IsNullOrEmpty(simplified)) entry["cn"] = simplified;
                    entries.Add(entry);
                }
            } catch (Exception e) when (e is InvalidDataException or DecoderFallbackException) { skipped.Add(name);skippedReasons.Add(new JsonObject{["table"]=name,["reason"]=e.Message}); }
            if (++completed % 20 == 0) Program.Progress("extract-tables",completed,schemas.Count);
        }
        var statFiles = index.Files.Values.Where(f=>f.Path != null && f.Path.StartsWith("metadata/statdescriptions/",StringComparison.OrdinalIgnoreCase) && (f.Path.EndsWith(".csd",StringComparison.OrdinalIgnoreCase) || f.Path.EndsWith(".txt",StringComparison.OrdinalIgnoreCase))).ToArray();
        foreach (var file in statFiles) {
            try {
                var descriptions = new StatDescriptions(file.Read().ToArray()); StatDescriptions? cn = null;
                if (cnIndex?.TryGetFile(file.Path,out var cnFile) == true) { try { cn = new StatDescriptions(cnFile.Read().ToArray()); } catch (InvalidDataException) { } }
                foreach (var entry in descriptions.ExportEntries(file.Path.ToLowerInvariant(),cn)) entries.Add(entry!.DeepClone());
            } catch (InvalidDataException) { skipped.Add(file.Path); }
        }
        if (entries.Count == 0) throw new UserError("没有可校验的语言条目，未生成资源包");
        return new JsonObject { ["protocolVersion"]=1,["engineVersion"]=1,["gameVersion"]=Program.GameVersion(game),["cnGameVersion"]=cnGame == null ? null : Program.GameVersion(cnGame),["entries"]=entries,
            ["report"]=new JsonObject { ["entries"]=entries.Count,["simplified"]=entries.Count(e=>e?["cn"] != null),["traditional"]=entries.Count(e=>e?["tw"] != null),["skippedTables"]=new JsonArray(skipped.Select(s=>(JsonNode?)JsonValue.Create(s)).ToArray()),["skippedReasons"]=skippedReasons } };
    }
    internal Dictionary<string,byte[]> Build(BundleIndex index,JsonArray entries,out object counts) {
        var outputs = new Dictionary<string,byte[]>(StringComparer.OrdinalIgnoreCase);
        int simplified=0,traditional=0,english=0,skipped=0;
        var grouped = entries.Select(e=>e!.AsObject()).GroupBy(e=>Text(e,"table"),StringComparer.OrdinalIgnoreCase).ToDictionary(g=>g.Key,g=>g.ToArray(),StringComparer.OrdinalIgnoreCase);
        foreach (var node in schemas) {
            var schema = node!.AsObject(); string name=schema["name"]!.GetValue<string>().ToLowerInvariant();
            if (!grouped.TryGetValue(name,out var changes)) continue;
            foreach (string ext in new[]{"datc64","datcl64"}) {
                int previousSimplified=simplified,previousTraditional=traditional,previousEnglish=english,previousSkipped=skipped;
                try {
                    var en=ReadTable(index,$"data/{name}.{ext}",schema,ext=="datcl64");
                    string target=$"data/traditional chinese/{name}.{ext}";
                    var tw=ReadTable(index,target,schema,ext=="datcl64");
                    if(en==null || tw==null) { skipped+=ext=="datc64" ? changes.Length:0; continue; }
                    bool changed=false;
                    foreach(var change in changes) {
                        string id=Text(change,"id"),field=Text(change,"field");
                        if(!tw.LocalizedFields.Contains(field) || Read(en,id,field) is not string source || Read(tw,id,field) is not string original) { if(ext=="datc64") skipped++; continue; }
                        string? selected=null; string cn=Text(change,"cn");
                        if(Text(change,"en")==source && Text(change,"sourceHash")==Program.Hash(Encoding.UTF8.GetBytes(source)) && !string.IsNullOrEmpty(cn) && cn!=source && SameTokens(source,cn)) selected=cn;
                        string value=selected ?? (!string.IsNullOrEmpty(original) ? original:source);
                        if(value!=original) {tw.SetText(id,field,value);changed=true;}
                        if(ext=="datc64") { if(selected!=null) simplified++; else if(!string.IsNullOrEmpty(original) && original!=source) traditional++; else english++; }
                    }
                    if(!changed)continue;byte[] result=tw.ToArray();
                    // Parse the generated table before allowing it into the candidate bundle.
                    _=new DatTable(result,schema,ext=="datcl64" ? 4 : 2); outputs[target]=result;
                } catch(Exception error) when(error is InvalidDataException or DecoderFallbackException) { simplified=previousSimplified;traditional=previousTraditional;english=previousEnglish;skipped=previousSkipped+(ext=="datc64" ? changes.Length:0); }
            }
        }
        foreach(var group in grouped.Where(g=>g.Key.StartsWith("metadata/statdescriptions/",StringComparison.OrdinalIgnoreCase))) {
            if(!index.TryGetFile(group.Key,out var file)) { skipped+=group.Value.Length; continue; }
            try { var original=file.Read().ToArray(); var stat=new StatDescriptions(original); var data=new JsonArray(group.Value.Select(e=>(JsonNode?)e.DeepClone()).ToArray()); var result=stat.ApplyEntries(data); _=new StatDescriptions(result); if(!original.AsSpan().SequenceEqual(result))outputs[group.Key]=result; simplified+=stat.LastAppliedCount; traditional+=stat.LastTraditionalCount;english+=stat.LastEnglishCount; }
            catch(InvalidDataException) { skipped+=group.Value.Length; }
        }
        if(!index.TryGetFile("data/languages.dat",out var language)) throw new UserError("找不到语言入口，未生成补丁");
        outputs["data/languages.dat"]=EnableTraditional(language.Read().ToArray());
        counts=new { simplified,traditional,english,skipped }; return outputs;
    }
    internal static byte[] EnableTraditional(byte[] bytes) {
        using var input=new MemoryStream(bytes); using var reader=new BinaryReader(input,Encoding.Unicode);
        int count=reader.ReadInt32(); if(count<2 || count>64) throw new InvalidDataException("Unsupported Languages.dat");
        var rows=new List<(int index,string[] names,byte[] flags)>();
        string ReadString() { var text=new StringBuilder(); for(int i=0;i<4096;i++){ ushort c=reader.ReadUInt16(); if(c==0)return text.ToString(); text.Append((char)c); } throw new InvalidDataException("Language string exceeds limit"); }
        for(int i=0;i<count;i++) rows.Add((reader.ReadInt32(),Enumerable.Range(0,4).Select(_=>ReadString()).ToArray(),reader.ReadBytes(12)));
        if(input.Position!=bytes.Length || rows.Any(r=>r.flags.Length!=12)) throw new InvalidDataException("Languages.dat layout mismatch");
        int fr=rows.FindIndex(r=>r.names[0]=="French"),tw=rows.FindIndex(r=>r.names[0]=="Traditional Chinese");
        if(fr<0 || tw<0) throw new UserError("当前客户端没有可验证的繁体语言入口");
        // A pristine French slot has tag 'fr'; both names are swapped, never tags/flags.
        if(rows[fr].names[2]!="fr" || rows[tw].names[2]!="zh-TW") throw new UserError("检测到已修改的语言表，请先恢复原版");
        for(int field=0;field<2;field++) (rows[fr].names[field],rows[tw].names[field])=(rows[tw].names[field],rows[fr].names[field]);
        using var output=new MemoryStream(); using var writer=new BinaryWriter(output,Encoding.Unicode,true); writer.Write(count);
        foreach(var row in rows){writer.Write(row.index);foreach(string value in row.names){writer.Write(Encoding.Unicode.GetBytes(value));writer.Write((ushort)0);}writer.Write(row.flags);} return output.ToArray();
    }
}
