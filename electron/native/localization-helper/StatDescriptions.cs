using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace LocalizationHelper;

/// <summary>Reads description blocks and replaces only quoted Traditional Chinese display text.</summary>
public sealed class StatDescriptions {
    private sealed record Line(string Text, int Offset);
    private sealed record Variant(string Condition, string Text, string Handlers, int TextOffset, int TextLength);
    private sealed record Description(string Id, string[] Ids, Dictionary<string,List<Variant>> Languages);
    private readonly string text;
    private readonly bool bom;
    private readonly List<Description> descriptions = [];
    private readonly Dictionary<string,Description> byId = new(StringComparer.Ordinal);
    private readonly HashSet<string> ambiguousIds = new(StringComparer.Ordinal);
    private static readonly Regex DescriptionHeader = new(@"^description(?:\s+\S+)?\s*$",RegexOptions.CultureInvariant);
    private static readonly Regex LanguageHeader = new("^lang\\s+\"([^\"]+)\"\\s*$",RegexOptions.CultureInvariant);
    private static readonly Regex QuotedLine = new("^\\s*(?<condition>[^\"]*?)\"(?<text>(?:\\\\.|[^\"\\\\])*)\"(?<handlers>.*)$",RegexOptions.CultureInvariant);
    private static readonly Regex Tokens = new(@"\{\d+(?::[^}]+)?\}|(?<!\w)#(?!\w)|%",RegexOptions.CultureInvariant);
    private static readonly Regex DisplayLink = new(@"\[[^\[\]|]+\|([^\[\]]*)\]",RegexOptions.CultureInvariant);
    private static readonly Regex DisplayReminder = new(@"(?<!\S)reminderstring\s+[A-Za-z_][A-Za-z0-9_]*(?!\S)",RegexOptions.CultureInvariant);
    public int Count => descriptions.Count;
    public int SkippedDescriptionCount { get; private set; }
    public int LastAppliedCount { get; private set; }
    public int LastSkippedCount { get; private set; }
    public int LastTraditionalCount { get; private set; }
    public int LastEnglishCount { get; private set; }

    public StatDescriptions(byte[] bytes) {
        if (bytes.Length % 2 != 0 || bytes.Length >= 2 && bytes[0] == 0xfe && bytes[1] == 0xff) throw new InvalidDataException("Unsupported stat description encoding");
        bom = bytes.Length >= 2 && bytes[0] == 0xff && bytes[1] == 0xfe;
        text = new UnicodeEncoding(false,false,true).GetString(bytes,bom ? 2 : 0,bytes.Length - (bom ? 2 : 0));
        var lines = new List<Line>();
        int offset = 0;
        foreach (string part in text.Split('\n')) {
            lines.Add(new Line(part.EndsWith('\r') ? part[..^1] : part,offset));
            offset += part.Length + 1;
        }
        for (int position = 0; position < lines.Count; position++) {
            if (!DescriptionHeader.IsMatch(lines[position].Text.Trim())) continue;
            try {
            int cursor = Next(lines,position+1);
            if (cursor >= lines.Count) throw new InvalidDataException("Missing stat IDs");
            string[] identifiers = Split(lines[cursor++].Text);
            if (identifiers.Length < 2 || !int.TryParse(identifiers[0],NumberStyles.None,CultureInfo.InvariantCulture,out int count) || count < 1 || count > 64 || identifiers.Length != count + 1 || identifiers.Skip(1).Any(id=>id.Length>512)) throw new InvalidDataException("Invalid stat description IDs");
            string[] ids = identifiers[1..];
            var languages = new Dictionary<string,List<Variant>>(StringComparer.Ordinal);
            languages.Add("English",ReadVariants(lines,ref cursor));
            cursor = Next(lines,cursor);
            while (cursor < lines.Count) {
                var language = LanguageHeader.Match(lines[cursor].Text.Trim());
                if (!language.Success) break;
                cursor++;
                string name = language.Groups[1].Value;
                if (!languages.TryAdd(name,ReadVariants(lines,ref cursor))) throw new InvalidDataException("Duplicate stat language block");
                cursor = Next(lines,cursor);
            }
            string joined = string.Join(' ',ids);
            string id = joined.Length > 512 ? "stats:"+Hash(joined) : joined;
            var description = new Description(id,ids,languages);
            if (ambiguousIds.Contains(id)) SkippedDescriptionCount++;
            else if (!byId.TryAdd(id,description)) {
                descriptions.Remove(byId[id]); byId.Remove(id); ambiguousIds.Add(id); SkippedDescriptionCount+=2;
            } else descriptions.Add(description);
            position = cursor - 1;
            } catch (InvalidDataException) {
                // A malformed/unsupported block is not a reason to discard independent descriptions in the same file.
                SkippedDescriptionCount++;
                while (position+1<lines.Count && !DescriptionHeader.IsMatch(lines[position+1].Text.Trim())) position++;
            }
        }
    }
    private static string[] Split(string value) => value.Split((char[]?)null,StringSplitOptions.RemoveEmptyEntries);
    private static string Normalize(string value) => string.Join(' ',Split(value));
    private static int Next(List<Line> lines,int cursor) { while (cursor < lines.Count && (string.IsNullOrWhiteSpace(lines[cursor].Text) || lines[cursor].Text.TrimStart().StartsWith("//",StringComparison.Ordinal))) cursor++; return cursor; }
    private static List<Variant> ReadVariants(List<Line> lines,ref int cursor) {
        cursor = Next(lines,cursor);
        if (cursor >= lines.Count || !int.TryParse(lines[cursor++].Text.Trim(),NumberStyles.None,CultureInfo.InvariantCulture,out int count) || count < 0 || count > 512) throw new InvalidDataException("Invalid stat variant count");
        var result = new List<Variant>();
        for (int i=0;i<count;i++) {
            cursor = Next(lines,cursor);
            if (cursor >= lines.Count) throw new InvalidDataException("Truncated stat variants");
            var line = lines[cursor++]; var match = QuotedLine.Match(line.Text);
            if (!match.Success || line.Text.Length>131072) throw new InvalidDataException("Invalid stat variant syntax at line "+cursor);
            var content = match.Groups["text"];
            result.Add(new Variant(Normalize(match.Groups["condition"].Value),content.Value,Normalize(match.Groups["handlers"].Value),line.Offset + content.Index,content.Length));
        }
        return result;
    }
    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
    private static string[] Placeholders(string value) {
        // Link destinations can repeat a parameter that appears only once on screen.
        string previous;
        do { previous=value; value=DisplayLink.Replace(value,"$1"); } while(value!=previous);
        return Tokens.Matches(value).Select(match=>match.Value).Order(StringComparer.Ordinal).ToArray();
    }
    // Some languages use a reminder tooltip where English uses a link in the display text.
    private static string NumericHandlers(string value) => Normalize(DisplayReminder.Replace(value,""));
    private static bool SameShape(List<Variant> first,List<Variant>? second) => second != null && first.Count == second.Count && first.Zip(second).All(pair => pair.First.Condition == pair.Second.Condition && NumericHandlers(pair.First.Handlers) == NumericHandlers(pair.Second.Handlers) && Placeholders(pair.First.Text).SequenceEqual(Placeholders(pair.Second.Text)));
    internal bool MatchesLegacySource(StatDescriptions source) {
        if (bom != source.bom || descriptions.Count != source.descriptions.Count || SkippedDescriptionCount != source.SkippedDescriptionCount) return false;
        var currentText = new List<Variant>();
        var originalText = new List<Variant>();
        for (int index = 0; index < descriptions.Count; index++) {
            var current = descriptions[index]; var original = source.descriptions[index];
            if (current.Id != original.Id || !current.Ids.SequenceEqual(original.Ids) ||
                !current.Languages.Keys.SequenceEqual(original.Languages.Keys)) return false;
            foreach (var language in current.Languages) {
                if (!SameShape(language.Value, original.Languages[language.Key])) return false;
                if (language.Key == "Traditional Chinese") { currentText.AddRange(language.Value); originalText.AddRange(original.Languages[language.Key]); }
            }
        }
        // The writer replaces only these quoted text spans; all language structure and other bytes survive.
        static string Mask(string value, List<Variant> variants) {
            var result = new StringBuilder(value.Length); int position = 0;
            foreach (var variant in variants.OrderBy(item => item.TextOffset)) {
                if (variant.TextOffset < position) throw new InvalidDataException("Overlapping legacy stat text");
                result.Append(value, position, variant.TextOffset - position);
                position = variant.TextOffset + variant.TextLength;
            }
            return result.Append(value, position, value.Length - position).ToString();
        }
        return Mask(text, currentText) == Mask(source.text, originalText);
    }
    private static JsonObject Shape(Description description) => new() {
        ["ids"] = new JsonArray(description.Ids.Select(id=>(JsonNode?)JsonValue.Create(id)).ToArray()),
        ["variants"] = new JsonArray(description.Languages["English"].Select(variant=>(JsonNode?)new JsonObject {
            ["condition"]=variant.Condition,["handlers"]=variant.Handlers,
            ["placeholders"]=new JsonArray(Placeholders(variant.Text).Select(token=>(JsonNode?)JsonValue.Create(token)).ToArray())
        }).ToArray())
    };
    public JsonArray ExportEntries(string table,StatDescriptions? simplifiedSource = null) {
        var result = new JsonArray();
        foreach (var description in descriptions) {
            var english = description.Languages["English"];
            if (english.Any(variant=>string.IsNullOrWhiteSpace(variant.Text) || variant.Text.Length>65536 || variant.Condition.Length>4096 || variant.Handlers.Length>4096 || Placeholders(variant.Text).Length>64)) continue;
            description.Languages.TryGetValue("Traditional Chinese",out var traditional);
            description.Languages.TryGetValue("Simplified Chinese",out var nativeSimplified);
            List<Variant>? externalSimplified=null;
            if (simplifiedSource != null) {
                if (simplifiedSource.byId.TryGetValue(description.Id,out var source) && SameShape(english,source.Languages["English"]) && english.Select(v=>v.Text).SequenceEqual(source.Languages["English"].Select(v=>v.Text))) {
                    source.Languages.TryGetValue("Simplified Chinese",out externalSimplified);
                }
            }
            bool usableTraditional = SameShape(english,traditional);
            bool usableNative = SameShape(english,nativeSimplified);
            bool usableExternal = SameShape(english,externalSimplified);
            for (int index=0;index<english.Count;index++) {
                var entry = new JsonObject { ["table"]=table,["id"]=description.Id,["field"]=$"variant:{index}",["en"]=english[index].Text,["kind"]="stat",["sourceHash"]=Hash(english[index].Text),["stats"]=Shape(description) };
                if (usableTraditional && !string.IsNullOrEmpty(traditional![index].Text) && traditional[index].Text.Length<=65536) entry["tw"]=traditional[index].Text;
                string? selected = usableNative && IsTranslation(nativeSimplified![index].Text,english[index].Text) ? nativeSimplified[index].Text :
                    usableExternal && IsTranslation(externalSimplified![index].Text,english[index].Text) ? externalSimplified[index].Text : null;
                if (selected != null) entry["cn"]=selected;
                result.Add(entry);
            }
        }
        return result;
    }
    private static bool IsTranslation(string value,string source) => !string.IsNullOrWhiteSpace(value) && value.Length<=65536 && value!=source;
    public byte[] ApplyEntries(JsonArray entries) {
        LastAppliedCount=0; LastSkippedCount=0; LastTraditionalCount=0; LastEnglishCount=0;
        var replacements = new List<(int Offset,int Length,string Text)>();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var group in entries.GroupBy(node=>node?["id"]?.GetValue<string>() ?? "",StringComparer.Ordinal)) {
            var changes=group.ToArray();
            if (!byId.TryGetValue(group.Key,out var description)) { LastSkippedCount+=changes.Length; LastEnglishCount+=changes.Length; continue; }
            var english=description.Languages["English"];
            description.Languages.TryGetValue("Traditional Chinese",out var traditional);
            bool valid=changes.Length==english.Count && SameShape(english,traditional);
            var candidate=new List<(int Offset,int Length,string Text)>();
            foreach (var node in changes) {
                var entry=node as JsonObject;
                string? field=entry?["field"]?.GetValue<string>(),translated=entry?["cn"]?.GetValue<string>();
                if (field != null && !seen.Add(group.Key+"\0"+field)) throw new InvalidDataException("Duplicate stat translation entry");
                if (entry==null || field==null || translated==null || !field.StartsWith("variant:",StringComparison.Ordinal) || !int.TryParse(field[8..],NumberStyles.None,CultureInfo.InvariantCulture,out int index) || index<0 || index>=english.Count) { valid=false; continue; }
                if (translated==english[index].Text || entry["en"]?.GetValue<string>()!=english[index].Text || entry["sourceHash"]?.GetValue<string>()!=Hash(english[index].Text) || !JsonNode.DeepEquals(entry["stats"],Shape(description)) || !Placeholders(translated).SequenceEqual(Placeholders(english[index].Text)) || !ValidTemplate(translated)) { valid=false; continue; }
                if (traditional != null && index<traditional.Count) { var destination=traditional[index]; if(translated!=destination.Text)candidate.Add((destination.TextOffset,destination.TextLength,translated)); }
            }
            if (!valid) {
                LastSkippedCount+=changes.Length;
                bool reliableTraditional=SameShape(english,traditional) && traditional!.All(variant=>!string.IsNullOrWhiteSpace(variant.Text));
                foreach(var change in changes) {
                    string? field=change?["field"]?.GetValue<string>();
                    if(reliableTraditional && field!=null && field.StartsWith("variant:",StringComparison.Ordinal) && int.TryParse(field[8..],NumberStyles.None,CultureInfo.InvariantCulture,out int index) && index>=0 && index<english.Count && traditional![index].Text!=english[index].Text) LastTraditionalCount++;
                    else LastEnglishCount++;
                }
                continue;
            }
            replacements.AddRange(candidate); LastAppliedCount+=changes.Length;
        }
        var output=new StringBuilder(text.Length);
        int cursor=0;
        foreach (var replacement in replacements.OrderBy(value=>value.Offset)) {
            if (replacement.Offset<cursor) throw new InvalidDataException("Overlapping stat replacements");
            output.Append(text,cursor,replacement.Offset-cursor).Append(replacement.Text);
            cursor=replacement.Offset+replacement.Length;
        }
        output.Append(text,cursor,text.Length-cursor);
        byte[] body=Encoding.Unicode.GetBytes(output.ToString());
        return bom ? [0xff,0xfe,..body] : body;
    }
    private static bool ValidTemplate(string value) {
        if (value.Length>65536 || value.IndexOfAny(['\r','\n','\0'])>=0) return false;
        bool escaped=false;
        foreach (char character in value) {
            if (escaped) { escaped=false; continue; }
            if (character=='\\') escaped=true;
            else if (character=='"') return false;
        }
        return !escaped;
    }
}
