using System.Buffers.Binary;
using System.Text;
using System.Text.Json.Nodes;

namespace LocalizationHelper;

public static class LocalizationDataSelfTest {
    private static void Require(bool condition,string message) { if (!condition) throw new InvalidDataException("Data self-test failed: "+message); }
    private static void Reject(Action action,string message) { try { action(); } catch (InvalidDataException) { return; } throw new InvalidDataException("Data self-test accepted invalid input: "+message); }
    public static int Run() {
        int cases=0;
        var schema=JsonNode.Parse("""{"columns":[{"name":"Id","type":"string","unique":true},{"name":"Name","type":"string","localized":true},{"name":"MechanicValue","type":"i32"}]}""")!.AsObject();
        foreach (int codeUnitSize in new[]{1,2,4}) {
            byte[] baseline=TableFixture(codeUnitSize,["B","A"],["繁體乙","繁體甲"]);
            var table=new DatTable(baseline,schema,codeUnitSize);
            Require(table.RowSize==20 && table.PoolOffset==44,"schema layout");
            Require(table.RowsById["A"]==1 && table.ReadText("A","Name")=="繁體甲","ID mapping survives row reorder");
            table.SetText("A","Name","简体甲🙂");
            byte[] written=table.ToArray();
            var reread=new DatTable(written,schema,codeUnitSize);
            Require(reread.ReadText("A","Name")=="简体甲🙂" && reread.ReadText("B","Name")=="繁體乙","localized replacement");
            for(int index=0;index<baseline.Length;index++) if(index<32 || index>=40) Require(baseline[index]==written[index],"non-text bytes or original pool changed");
            Reject(()=>table.SetText("A","Id","changed"),"identity write");
            Reject(()=>table.SetText("A","Name","embedded\0null"),"embedded terminator");
            byte[] badMarker=(byte[])baseline.Clone(); badMarker[44]=0;
            Reject(()=>new DatTable(badMarker,schema,codeUnitSize),"schema mismatch");
            byte[] badPointer=(byte[])baseline.Clone(); badPointer.AsSpan(4,8).Fill(0xff);
            Reject(()=>new DatTable(badPointer,schema,codeUnitSize),"out of range pointer");
            Reject(()=>new DatTable(TableFixture(codeUnitSize,["A","A"],["甲","乙"]),schema,codeUnitSize),"duplicate IDs");
            cases+=7;
        }
        const string fixture="""
include "Metadata/StatDescriptions/other.txt"
description
    1 damage_+%
    2
        1|# "{0}% increased Damage"
        #|-1 "{0}% reduced Damage" negate 1
    lang "Traditional Chinese"
    2
        1|# "增加 {0}% 傷害"
        #|-1 "減少 {0}% 傷害" negate 1
    lang "Simplified Chinese"
    2
        1|# "伤害提高 {0}%"
        #|-1 "伤害降低 {0}%" negate 1

description named_block
    1 new_stat
    1
        # "New effect {0}"
    lang "Traditional Chinese"
    1
        # "新效果 {0}"
""";
        byte[] statBytes=[0xff,0xfe,..Encoding.Unicode.GetBytes(fixture.Replace("\n","\r\n"))];
        var stats=new StatDescriptions(statBytes);
        var entries=stats.ExportEntries("metadata/statdescriptions/test.txt");
        Require(stats.Count==2 && entries.Count==3,"legacy/named description and # variants");
        Require(entries[0]!["cn"]!.GetValue<string>()=="伤害提高 {0}%" && entries[2]!["cn"]==null,"per-entry CN fallback");
        byte[] applied=stats.ApplyEntries(entries);
        string result=Encoding.Unicode.GetString(applied.AsSpan(2));
        string expected=fixture.Replace("\n","\r\n").Replace("增加 {0}% 傷害","伤害提高 {0}%").Replace("減少 {0}% 傷害","伤害降低 {0}%");
        Require(result==expected && stats.LastAppliedCount==2,"only target display templates change");
        var unsafeEntries=(JsonArray)entries.DeepClone(); unsafeEntries[0]!["cn"]="lost placeholders";
        string unsafeOutput=Encoding.Unicode.GetString(stats.ApplyEntries(unsafeEntries).AsSpan(2));
        Require(stats.LastSkippedCount==3 && stats.LastAppliedCount==0 && stats.LastTraditionalCount==3 && stats.LastEnglishCount==0 && unsafeOutput.Contains("減少 {0}% 傷害",StringComparison.Ordinal),"placeholder mismatch falls back for the entire description");
        var unsafeQuote=(JsonArray)entries.DeepClone(); unsafeQuote[0]!["cn"]="{0}% \"injected\"";
        stats.ApplyEntries(unsafeQuote); Require(stats.LastSkippedCount==3,"quote injection rejected for the entire description");
        var untranslated=(JsonArray)entries.DeepClone(); untranslated[0]!["cn"]=untranslated[0]!["en"]!.GetValue<string>();
        string fallback=Encoding.Unicode.GetString(stats.ApplyEntries(untranslated).AsSpan(2));
        Require(fallback.Contains("增加 {0}% 傷害",StringComparison.Ordinal) && stats.LastSkippedCount==3,"untranslated English CN falls back to TW for the entire description");
        var changedSource=new StatDescriptions(Encoding.Unicode.GetBytes(fixture.Replace("{0}% increased Damage","New {0}% increased Damage")));
        Require(stats.ExportEntries("metadata/statdescriptions/test.txt",changedSource)[0]!["cn"]!.GetValue<string>()=="伤害提高 {0}%","stale external CN does not erase current native CN");
        var noNative=new StatDescriptions(Encoding.Unicode.GetBytes(fixture.Replace("lang \"Simplified Chinese\"","lang \"Unused Chinese\"")));
        Require(noNative.ExportEntries("metadata/statdescriptions/test.txt",changedSource).All(entry=>entry!["cn"]==null),"CN from different English version rejected");
        var external=new StatDescriptions(Encoding.Unicode.GetBytes(fixture.Replace("伤害提高","外部提升")));
        Require(stats.ExportEntries("metadata/statdescriptions/test.txt",external)[0]!["cn"]!.GetValue<string>()=="伤害提高 {0}%","native CN takes priority over equivalent external CN");
        Require(noNative.ExportEntries("metadata/statdescriptions/test.txt",external)[0]!["cn"]!.GetValue<string>()=="外部提升 {0}%","equivalent external CN fills missing native CN");
        var mismatched=JsonNode.Parse("""{"columns":[{"name":"Id","type":"string","unique":true},{"name":"Name","type":"string","localized":true},{"name":"MechanicValue","type":"foreignrow"}]}""")!.AsObject();
        Reject(()=>new DatTable(TableFixture(false,["A","B"],["甲","乙"]),mismatched,false),"schema row width changed");
        var ambiguous=new StatDescriptions(Encoding.Unicode.GetBytes(fixture+"\ndescription\n 1 damage_+%\n 1\n # \"Duplicate\"\n"));
        Require(ambiguous.Count==1 && ambiguous.SkippedDescriptionCount==2,"all ambiguous descriptions skipped without discarding independent block");
        var malformed=new StatDescriptions(Encoding.Unicode.GetBytes("description\n 1 broken\n 1\n invalid syntax\n"+fixture));
        Require(malformed.Count==2 && malformed.SkippedDescriptionCount==1,"malformed block does not discard independent blocks");
        string longFixture="description\n 2 "+new string('x',300)+" "+new string('y',300)+"\n 1\n # # \"Long {0} {1}\"\n";
        var longId=new StatDescriptions(Encoding.Unicode.GetBytes(longFixture)).ExportEntries("metadata/statdescriptions/long.csd");
        Require(longId.Count==1 && longId[0]!["id"]!.GetValue<string>().StartsWith("stats:",StringComparison.Ordinal) && longId[0]!["id"]!.GetValue<string>().Length==70 && longId[0]!["stats"]!["ids"]!.AsArray().Count==2,"long stable ID hashed without losing stat identity");
        var hidden=new StatDescriptions(Encoding.Unicode.GetBytes(fixture.Replace("{0}% increased Damage",""))).ExportEntries("metadata/statdescriptions/hidden.csd");
        Require(hidden.Count==1 && hidden[0]!["id"]!.GetValue<string>()=="new_stat","hidden empty-English description excluded as a complete group");
        var untranslatedTw=new StatDescriptions(Encoding.Unicode.GetBytes(fixture.Replace("新效果 {0}","New effect {0}")));
        untranslatedTw.ApplyEntries(entries);
        Require(untranslatedTw.LastTraditionalCount==0 && untranslatedTw.LastEnglishCount==1 && untranslatedTw.LastAppliedCount==2,"English copy in TW is counted as English fallback");
        return cases+16;
    }
    private static byte[] TableFixture(bool unicode,string[] ids,string[] names) => TableFixture(unicode ? 2 : 1,ids,names);
    private static byte[] TableFixture(int codeUnitSize,string[] ids,string[] names) {
        // Independent concrete layout: two 20-byte rows, then marker and referenced string pool.
        Encoding encoding=codeUnitSize switch { 1=>new UTF8Encoding(false), 2=>Encoding.Unicode, 4=>Encoding.UTF32, _=>throw new InvalidDataException() };
        using var stream=new MemoryStream();
        stream.Write(new byte[52]);
        stream.GetBuffer().AsSpan(44,8).Fill(0xbb);
        BinaryPrimitives.WriteUInt32LittleEndian(stream.GetBuffer(),2);
        for(int row=0;row<2;row++) {
            foreach(var item in new[]{(Offset:4+row*20,Text:ids[row]),(Offset:12+row*20,Text:names[row])}) {
                ulong pointer=(ulong)(stream.Length-44);
                stream.Position=stream.Length; stream.Write(encoding.GetBytes(item.Text)); stream.Write(encoding.GetBytes("\0"));
                BinaryPrimitives.WriteUInt64LittleEndian(stream.GetBuffer().AsSpan(item.Offset,8),pointer);
            }
            BinaryPrimitives.WriteInt32LittleEndian(stream.GetBuffer().AsSpan(20+row*20,4),12345+row);
        }
        return stream.ToArray();
    }
}
