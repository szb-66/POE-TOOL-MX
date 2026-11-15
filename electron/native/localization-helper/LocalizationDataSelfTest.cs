using System.Buffers.Binary;
using System.Text;
using System.Text.Json.Nodes;

namespace LocalizationHelper;

public static class LocalizationDataSelfTest {
    private static void Require(bool condition,string message) { if (!condition) throw new InvalidDataException("Data self-test failed: "+message); }
    private static void Reject(Action action,string message) { try { action(); } catch (InvalidDataException) { return; } throw new InvalidDataException("Data self-test accepted invalid input: "+message); }
    public static int Run() {
        int cases=0;
        Require(Program.VersionFromLog("release/tags/3.30.0b")=="3.30.0b" && Program.VersionFromLog("poe1_production2_tc/tags/3.29.3b")=="3.29.3b","Steam and CN release version evidence");
        Require(Program.VersionFromLog("unrelated/tags/99.99")=="unverified","unrelated log paths cannot supply game versions");
        cases+=2;
        Require(ResourceEngine.SelectSimplified("Fireball",null,"Fireball","火球")=="火球","CN source matches stable ID and English text");
        Require(ResourceEngine.SelectSimplified("Fireball",null,"Old Fireball","旧火球")==null,"changed source text cannot reuse CN translation");
        Require(ResourceEngine.SelectSimplified("Damage {0}",null,"Damage {0}","伤害")==null,"CN source preserves placeholders");
        Require(ResourceEngine.SelectSimplified("Fireball","原生火球","Fireball","外部火球")=="原生火球","valid native CN takes priority over external CN");
        Require(ResourceEngine.SelectSimplified("Damage {0}","伤害","Damage {0}","伤害 {0}")=="伤害 {0}","invalid native CN falls back to checked external CN");
        cases+=5;
        var sanctumSchemas=JsonNode.Parse("""[{"name":"SanctumPersistentEffects","columns":[{"name":"Id","type":"string"},{"name":"Name","type":"string"},{"name":"BoonDesc","type":"string"},{"name":"CurseDesc","type":"string"},{"name":"Icon","type":"string"},{"name":"Stats","type":"foreignrow"}]},{"name":"Unrelated","columns":[{"name":"Name","type":"string"}]}]""")!.AsArray();
        ResourceEngine.EnableDisplayTextFields(sanctumSchemas);
        var editable=sanctumSchemas[0]!["columns"]!.AsArray().Where(c=>c?["localized"]?.GetValue<bool>()==true).Select(c=>c!["name"]!.GetValue<string>()).ToArray();
        Require(editable.SequenceEqual(new[]{"Name","BoonDesc","CurseDesc"}),"Sanctum text allowlist excludes ID, stats and icon paths");
        Require(sanctumSchemas[1]!["columns"]![0]!["localized"]==null,"Sanctum text allowlist does not affect other tables");
        cases+=2;
        var displaySchemas=JsonNode.Parse("""[{"name":"ActiveSkills","columns":[{"name":"Id","type":"string"},{"name":"DisplayedName","type":"string"},{"name":"Description","type":"string","array":true},{"name":"AIFile","type":"string"},{"name":"GrantedEffect","type":"string"},{"name":"WebsiteDescription","type":"string"}]},{"name":"Words","columns":[{"name":"HASH32","type":"u32"},{"name":"Text","type":"string","interval":true},{"name":"Text2","type":"i32"}]}]""")!.AsArray();
        ResourceEngine.EnableDisplayTextFields(displaySchemas);
        var displayEditable=displaySchemas.SelectMany(t=>t!["columns"]!.AsArray()).Where(c=>c?["localized"]?.GetValue<bool>()==true).Select(c=>c!["name"]!.GetValue<string>()).ToArray();
        Require(displayEditable.SequenceEqual(new[]{"DisplayedName"}),"display allowlist excludes identifiers, metadata, websites, arrays, intervals and nonstrings");
        var actualSchemas=JsonNode.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory,"schema.json")))!["tables"]!.AsArray();
        ResourceEngine.EnableDisplayTextFields(actualSchemas);
        JsonObject ActualField(string table,string field) => actualSchemas.First(t=>t?["name"]?.GetValue<string>()==table)!["columns"]!.AsArray().First(c=>c?["name"]?.GetValue<string>()==field)!.AsObject();
        foreach(var (table,field) in new[]{("ActiveSkills","DisplayedName"),("ActiveSkills","Description"),("GrantedEffects","SupportName"),("GrantedEffects","SupportDescription"),("GemEffects","Name"),("GemEffects","SupportText"),("GemEffects","SupportName"),("PassiveSkills","Name"),("PassiveSkills","FlavourText"),("PassiveSkills","NameHardmode"),("Words","Text"),("Words","Text2"),("ItemClasses","Name"),("Mods","Name"),("WorldAreas","Name"),("NPCs","Name")})
            Require(ActualField(table,field)["localized"]?.GetValue<bool>()==true,"actual display field enabled: "+table+"."+field);
        foreach(var (table,field) in new[]{("ActiveSkills","Id"),("ActiveSkills","GrantedEffect"),("ActiveSkills","Icon_DDSFile"),("ActiveSkills","AIFile"),("ActiveSkills","WebsiteDescription"),("Words","Inflection"),("Mods","MonsterMetadata"),("Tags","Name"),("Ascendancy","RGBFlavourTextColour"),("KeywordPopupModReference","StatDescription")})
            Require(ActualField(table,field)["localized"]?.GetValue<bool>()!=true,"actual mechanism field protected: "+table+"."+field);
        var skillSchema=JsonNode.Parse("""{"name":"ActiveSkills","columns":[{"name":"Id","type":"string","unique":true},{"name":"DisplayedName","type":"string"},{"name":"MechanicValue","type":"i32"}]}""")!.AsObject();
        ResourceEngine.EnableDisplayTextFields(new JsonArray(skillSchema));
        byte[] skillBytes=TableFixture(2,["SkillB","SkillA"],["繁體技能乙","繁體技能甲"]);
        var skillTable=new DatTable(skillBytes,skillSchema,2);
        skillTable.SetText("SkillA","DisplayedName","简体技能甲");
        var skillReadback=new DatTable(skillTable.ToArray(),skillSchema,2);
        Require(skillReadback.ReadText("SkillA","DisplayedName")=="简体技能甲" && skillReadback.ReadText("SkillB","DisplayedName")=="繁體技能乙","new display fields write and read by stable ID");
        Reject(()=>skillTable.SetText("SkillA","Id","TranslatedId"),"new display fields preserve identity write protection");
        for(int row=0;row<2;row++) Require(skillBytes.AsSpan(20+row*20,4).SequenceEqual(skillTable.ToArray().AsSpan(20+row*20,4)),"new display fields preserve mechanic values");
        cases+=6;
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
        const string linkedEnglish="Trigger Level {0} [TriggeredConsecrate::{0}|Consecrate] when you deal a Critical Strike";
        const string linkedCn="暴击时触发 {0} 级的奉献", linkedTw="當你暴擊時觸發等級 {0} 的奉獻";
        string linkedFixture=$"description\n 1 local_display_cast_level_X_consecrate_on_crit\n 1\n # \"{linkedEnglish}\"\nlang \"Simplified Chinese\"\n 1\n # \"{linkedCn}\"\nlang \"Traditional Chinese\"\n 1\n # \"{linkedTw}\"\n";
        var linkedStats=new StatDescriptions(Encoding.Unicode.GetBytes(linkedFixture));
        var linkedEntries=linkedStats.ExportEntries("metadata/statdescriptions/test.csd");
        Require(linkedEntries.Count==1 && linkedEntries[0]!["cn"]!.GetValue<string>()==linkedCn && linkedEntries[0]!["tw"]!.GetValue<string>()==linkedTw,"hidden skill-link parameter does not discard visible translations");
        Require(linkedEntries[0]!["en"]!.GetValue<string>()==linkedEnglish && linkedEntries[0]!["sourceHash"]!.GetValue<string>()==Program.Hash(Encoding.UTF8.GetBytes(linkedEnglish)),"skill-link export preserves exact raw source and hash");
        Require(linkedEntries[0]!["stats"]!["variants"]![0]!["placeholders"]!.AsArray().Count==1,"visible skill-link parameter is counted once");
        string linkedOutput=Encoding.Unicode.GetString(linkedStats.ApplyEntries(linkedEntries));
        Require(linkedStats.LastAppliedCount==1 && linkedOutput==linkedFixture.Replace(linkedTw,linkedCn),"skill-link translation applies only to the target language text");
        var extraParameter=(JsonArray)linkedEntries.DeepClone(); extraParameter[0]!["cn"]=linkedCn+" {1}";
        Require(Encoding.Unicode.GetString(linkedStats.ApplyEntries(extraParameter))==linkedFixture && linkedStats.LastAppliedCount==0 && linkedStats.LastSkippedCount==1,"genuinely added display parameter still rejected");
        var nestedLinks=new StatDescriptions(Encoding.Unicode.GetBytes(linkedFixture.Replace("[TriggeredConsecrate::{0}|Consecrate]","[Outer::{1}|[TriggeredConsecrate::{0}|Consecrate]]")));
        Require(nestedLinks.ExportEntries("metadata/statdescriptions/test.csd")[0]!["tw"]!.GetValue<string>()==linkedTw,"nested link targets remain hidden from display parameter comparison");
        const string reminderFixture="description\n 1 map_monsters_chance_to_blind_on_hit_%\n 2\n 1|99 \"Monsters have {0}% chance to [Blind] on Hit\"\n 100|# \"Monsters [Blind] on Hit\"\nlang \"Simplified Chinese\"\n 2\n 1|99 \"怪物有 {0}% 的几率在击中时致盲\" reminderstring ReminderTextBlind\n 100|# \"怪物击中时致盲\" reminderstring ReminderTextBlind\nlang \"Traditional Chinese\"\n 2\n 1|99 \"怪物擊中時有 {0}% 機率致盲\" reminderstring ReminderTextBlind\n 100|# \"怪物擊中時致盲\" reminderstring ReminderTextBlind\n";
        var reminderStats=new StatDescriptions(Encoding.Unicode.GetBytes(reminderFixture));
        var reminderEntries=reminderStats.ExportEntries("metadata/statdescriptions/test.csd");
        Require(reminderEntries.Count==2 && reminderEntries.All(entry=>entry!["cn"]!=null && entry["tw"]!=null),"display-only reminder differences preserve every stat variant translation");
        string reminderOutput=Encoding.Unicode.GetString(reminderStats.ApplyEntries(reminderEntries));
        Require(reminderStats.LastAppliedCount==2 && reminderOutput==reminderFixture.Replace("怪物擊中時有 {0}% 機率致盲","怪物有 {0}% 的几率在击中时致盲").Replace("怪物擊中時致盲","怪物击中时致盲"),"reminder-compatible apply keeps handlers intact and replaces only display text");
        Require(reminderEntries[0]!["stats"]!["variants"]![0]!["handlers"]!.GetValue<string>()=="","reminder comparison preserves exact source handler metadata");
        var numericHandler=new StatDescriptions(Encoding.Unicode.GetBytes(reminderFixture.Replace("reminderstring ReminderTextBlind","reminderstring ReminderTextBlind negate 1")));
        Require(numericHandler.ExportEntries("metadata/statdescriptions/test.csd").All(entry=>entry!["cn"]==null && entry["tw"]==null),"numeric handler differences remain rejected");
        numericHandler.ApplyEntries(reminderEntries);
        Require(numericHandler.LastAppliedCount==0 && numericHandler.LastSkippedCount==2,"apply rejects differing numeric handlers too");
        var malformedReminder=new StatDescriptions(Encoding.Unicode.GetBytes(reminderFixture.Replace("reminderstring ReminderTextBlind","reminderstring {0}")));
        Require(malformedReminder.ExportEntries("metadata/statdescriptions/test.csd").All(entry=>entry!["cn"]==null && entry["tw"]==null),"parameterized or unrecognized reminder syntax remains rejected");
        var reminderCondition=new StatDescriptions(Encoding.Unicode.GetBytes(reminderFixture.Replace("1|99 \"怪物","1|98 \"怪物")));
        Require(reminderCondition.ExportEntries("metadata/statdescriptions/test.csd").All(entry=>entry!["cn"]==null && entry["tw"]==null),"reminder compatibility never relaxes variant conditions");
        var reminderParameter=new StatDescriptions(Encoding.Unicode.GetBytes(reminderFixture.Replace("{0}% 的几率","{1}% 的几率").Replace("{0}% 機率","{1}% 機率")));
        Require(reminderParameter.ExportEntries("metadata/statdescriptions/test.csd").All(entry=>entry!["cn"]==null && entry["tw"]==null),"reminder compatibility never relaxes visible parameter identity");
        return cases+30;
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
