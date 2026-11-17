using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using LibBundle3;
using BundleIndex = LibBundle3.Index;

namespace LocalizationHelper;

internal sealed class ResourceEngine {
    private readonly JsonArray schemas;
    private JsonArray? sourceSchemas;
    public ResourceEngine() {
        schemas = JsonNode.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory,"schema.json")))!["tables"]!.AsArray();
        EnableDisplayTextFields(schemas);
    }
    internal static void EnableDisplayTextFields(JsonArray tables) {
        // Upstream localized flags omit many display strings. Keep an explicit
        // allowlist so identifiers, mechanics and resource paths remain immutable.
        var fields = new Dictionary<string,string[]>(StringComparer.OrdinalIgnoreCase) {
            ["ActiveSkills"]=["DisplayedName","Description"],
            ["GrantedEffects"]=["SupportName","SupportDescription"],
            ["GemEffects"]=["Name","SupportText","SupportName"],
            ["SkillGemInfo"]=["Description"],
            ["PassiveSkills"]=["Name","FlavourText","NameHardmode"],
            ["AlternatePassiveSkills"]=["Name","FlavourText"],
            ["PassiveSkillOverrides"]=["Name"],
            ["PassiveOverrideLimits"]=["Description"],
            ["PassiveSkillFilterCatagories"]=["Name"],
            ["PassiveSkillFilterOptions"]=["Name"],
            ["PassiveSkillStatCategories"]=["Name"],
            ["PassiveSkillTreeTutorial"]=["ChoiceA_Description","ChoiceB_Description"],
            ["PassiveSkillTattooTargetSets"]=["Name"],
            ["AtlasPassiveSkillSubTrees"]=["Description"],
            ["AtlasTrees"]=["Name"],
            ["AlternateTreeVersions"]=["Name"],
            ["Ascendancy"]=["Name","FlavourText","LeagueName","LeagueFlavourText"],
            ["Descendancy"]=["Name","FlavourText"],
            ["Archetypes"]=["AscendancyClassName","Description"],
            ["ItemClasses"]=["Name"],
            ["ItemClassCategories"]=["Text"],
            ["Words"]=["Text","Text2"],
            ["Mods"]=["Name"],
            ["FlavourText"]=["Text"],
            ["MonsterVarieties"]=["Name"],
            ["NPCs"]=["Name","ShortName"],
            ["NPCTextAudio"]=["Text"],
            ["CharacterTextAudio"]=["Text"],
            ["WorldAreas"]=["Name"],
            ["Chests"]=["Name"],
            ["BuffDefinitions"]=["Name","Description"],
            ["BuffVisuals"]=["BuffName","BuffDescription"],
            ["LabyrinthCraftOptions"]=["Text"],
            ["LabyrinthSecrets"]=["Name"],
            ["PantheonPanelLayout"]=["GodName1","GodName2","GodName3","GodName4"],
            ["ElderGuardians"]=["Name"],
            ["BestiaryFamilies"]=["Name","FlavourText"],
            ["BestiaryGenus"]=["Name","Name2"],
            ["BestiaryGroups"]=["Name","Description"],
            ["BestiaryRecipes"]=["Description"],
            ["BestiaryRecipeCategories"]=["Text"],
            ["IncursionRooms"]=["Name","FlavourText","Description"],
            ["DelveBiomes"]=["Name"],
            ["DelveCraftingModifierDescriptions"]=["Description"],
            ["DelveFeatures"]=["Name","Description"],
            ["BetrayalChoices"]=["Text"],
            ["BetrayalJobs"]=["Text"],
            ["BetrayalRanks"]=["Text"],
            ["BetrayalRelationshipState"]=["Text"],
            ["BetrayalTargets"]=["FullName","ShortName"],
            ["BetrayalUpgrades"]=["Name","Description"],
            ["BYOCrafting"]=["Description","DescriptionRuthless"],
            ["SafehouseCraftingSpreeType"]=["ItemClassText"],
            ["SynthesisAreas"]=["Name"],
            ["SynthesisRewardTypes"]=["Description"],
            ["BlightTowers"]=["Name","Description"],
            ["AtlasExiles"]=["CitadelName"],
            ["AlternateQualityTypes"]=["Description"],
            ["AfflictionRewardTypeVisuals"]=["Name"],
            ["HarvestCraftOptions"]=["Text","Description"],
            ["HarvestCraftFilters"]=["Name"],
            ["HeistChestRewardTypes"]=["RewardTypeName","RewardRoomName2"],
            ["HeistJobs"]=["Name","Description"],
            ["RitualRuneTypes"]=["Description"],
            ["UltimatumEncounters"]=["Description"],
            ["UltimatumEncounterTypes"]=["Name","ProgressBarText"],
            ["UltimatumItemisedRewards"]=["RewardText","SacrificeText"],
            ["UltimatumModifiers"]=["Name","Description"],
            ["ExpeditionFactions"]=["Name"],
            ["ExpeditionRelics"]=["Name"],
            ["DroneTypes"]=["DeployText","SocketableText","NotPoweredText"],
            ["SanctumDefenceIcons"]=["Description"],
            ["SanctumFloors"]=["Description"],
            ["SanctumPersistentEffects"]=["Name","BoonDesc","CurseDesc"],
            ["SanctumPersistentEffectCategories"]=["Name"],
            ["SanctumRoomTypes"]=["Description"],
            ["AncestralTrialFieldItems"]=["Description"],
            ["AncestralTrialItems"]=["Name","FlavorText"],
            ["AncestralTrialPositionType"]=["Name"],
            ["AncestralTrialTribes"]=["TribeName","Name"],
            ["AncestralTrialUnits"]=["Name","Description"],
            ["AzmeriWoodsDustType"]=["Text"],
            ["NecropolisCraftBases"]=["Name"],
            ["NecropolisCraftItemTypes"]=["Name"],
            ["NecropolisPackImplicits"]=["Text"],
            ["NecropolisPackModTiers"]=["Name"],
            ["NecropolisPacks"]=["Name","Description"],
            ["CurrencyExchangeCategories"]=["Name"],
            ["VillageExports"]=["Name","Name2"],
            ["VillageJobTypes"]=["StateText"],
            ["VillageShippingFailures"]=["Text","SubText"],
            ["VillageShippingPorts"]=["Name"],
            ["VillageTownLayout"]=["Name"],
            ["VillageUpgradeCategories"]=["Name","Text"],
            ["MercenaryAttributes"]=["Name"],
            ["MercenaryBuilds"]=["Name"],
            ["MercenaryBuildStatsCategories"]=["Name"],
            ["MercenaryClasses"]=["HouseName"],
            ["MercenaryFlavourText"]=["Description"],
            ["MercenarySupports"]=["Name"],
            ["BrequelEncounterSkills"]=["Description"],
            ["BrequelFruitRewardTypes"]=["Name","Description"],
            ["BrequelLockerLayout"]=["Name"],
            ["FaridunWishes"]=["Description"],
            ["DeepwaterRooms"]=["Name"],
            ["AuguryCards"]=["Name"],
            ["AuguryFactions"]=["Name"],
            ["AuguryPinnacleCards"]=["Name"],
            ["AuguryRewardOutcomes"]=["Description"],
            ["Achievements"]=["Description"],
            ["AchievementItems"]=["Name"],
            ["AchievementSetRewards"]=["HideoutName"],
            ["AdvancedSkillsTutorial"]=["Description"],
            ["AwardDisplay"]=["Text"],
            ["BackendErrors"]=["Text"],
            ["BindableVirtualKeys"]=["Name"],
            ["BreachStashTabSubStashGroup"]=["Name"],
            ["BuiltInItemFilters"]=["Name"],
            ["CharacterPanelStats"]=["Text"],
            ["CharacterPanelTabs"]=["Text"],
            ["CharacterStartStates"]=["Description","InfoText"],
            ["Commands"]=["Description"],
            ["CostTypes"]=["FormatText"],
            ["CraftingBenchUnlockCategories"]=["ObtainingDescription"],
            ["CraftingItemClassCategories"]=["Text"],
            ["DynamicCraftingBenchTypes"]=["Name","Description"],
            ["HideoutRarity"]=["Text"],
            ["MapPins"]=["Name","FlavourText"],
            ["MapSeries"]=["Name"],
            ["MapStashSpecialSubStashGroup"]=["Name"],
            ["MicrotransactionCategory"]=["Name"],
            ["Music"]=["Name"],
            ["MusicCategories"]=["Name"],
            ["PackSizes"]=["Description"],
            ["Realms"]=["Name","ShortName"],
            ["SocketNotches"]=["Description"],
            ["Tips"]=["Text","TextXBox"],
            ["UITalkText"]=["Text"],
            ["VoteState"]=["Text"],
            ["VoteType"]=["Text","AcceptText","RejectText"],
            ["BattlePassRewards"]=["RewardDescription"],
            ["BattlePassTracks"]=["Description"],
            ["CountdownTimers"]=["Text"],
            ["MapStashSubstashGroup"]=["Description"],
            ["MinionDoublingStatTypes"]=["Name"],
            ["RelicItemEffectVariations"]=["Description"],
            ["TypeTags"]=["Name"]
        };
        foreach (var node in tables) {
            if (!fields.TryGetValue(node?["name"]?.GetValue<string>() ?? "",out var names)) continue;
            foreach (var column in node!["columns"]!.AsArray())
                if (names.Contains(column?["name"]?.GetValue<string>(),StringComparer.Ordinal)
                    && column?["type"]?.GetValue<string>() == "string" && column?["array"]?.GetValue<bool>() != true
                    && column?["interval"]?.GetValue<bool>() != true && column?["file"] == null && column?["files"] == null)
                    column!["localized"] = true;
        }
    }
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
    private (DatTable? Table,string? Reason) ReadSourceTable(BundleIndex index,string path,JsonObject schema) {
        try { return (ReadTable(index,path,schema,false),null); }
        catch(Exception error) when(error is InvalidDataException or DecoderFallbackException) {
            string file=Path.Combine(AppContext.BaseDirectory,"source-schema-cn.json");
            if (!File.Exists(file)) return (null,error.Message);
            if(sourceSchemas==null) {
                sourceSchemas=JsonNode.Parse(File.ReadAllText(file))!["tables"]!.AsArray();
                EnableDisplayTextFields(sourceSchemas);
            }
            var sourceSchema=sourceSchemas.FirstOrDefault(node=>node?["name"]?.GetValue<string>()==schema["name"]?.GetValue<string>())?.AsObject();
            if (sourceSchema==null) return (null,error.Message);
            try { return (ReadTable(index,path,sourceSchema,false),null); }
            catch(Exception sourceError) when(sourceError is InvalidDataException or DecoderFallbackException) { return (null,sourceError.Message); }
        }
    }
    internal static string? SelectSimplified(string original,string? native,string? sourceEnglish,string? external) {
        if (!string.IsNullOrWhiteSpace(native) && native!=original && SameTokens(original,native)) return native;
        if (sourceEnglish==original && !string.IsNullOrWhiteSpace(external) && external!=original && SameTokens(original,external)) return external;
        return null;
    }
    internal static void RequireOriginalExportSource(BundleIndex index) {
        if(ManagedPatchIndex.HasManagedReferences(index))
            throw new UserError("当前游戏已应用汉化，请指定同版本应用前备份作为导出来源");
    }
    internal JsonObject Export(string game,string? cnGame,string? sourceIndex=null) {
        using var index = Program.Open(game,indexPath:sourceIndex);
        RequireOriginalExportSource(index);
        using var cnIndex = cnGame == null ? null : Program.Open(cnGame);
        var entries = new JsonArray(); var skipped = new List<string>(); var skippedReasons=new JsonArray(); var tableReports=new JsonArray();
        int completed = 0;
        foreach (var node in schemas) {
            var schema = node!.AsObject(); string name = schema["name"]!.GetValue<string>().ToLowerInvariant();
            if (!schema["columns"]!.AsArray().Any(c=>c?["localized"]?.GetValue<bool>() == true && c?["type"]?.GetValue<string>() == "string")) continue;
            try {
                var en = ReadTable(index,$"data/{name}.datc64",schema,false);
                if (en == null || en.LocalizedFields.Count == 0) continue;
                var tw = ReadTable(index,$"data/traditional chinese/{name}.datc64",schema,false);
                DatTable? nativeCn=null;
                try { nativeCn=ReadTable(index,$"data/simplified chinese/{name}.datc64",schema,false); }
                catch(Exception error) when(error is InvalidDataException or DecoderFallbackException) { /* Invalid native text falls back to the independently checked CN source. */ }
                DatTable? cn = null, cnEn = null;
                string? cnReason=null;
                if (cnIndex != null) {
                    var simplifiedSource=ReadSourceTable(cnIndex,$"data/simplified chinese/{name}.datc64",schema);
                    var englishSource=ReadSourceTable(cnIndex,$"data/{name}.datc64",schema);
                    cn=simplifiedSource.Table; cnEn=englishSource.Table; cnReason=simplifiedSource.Reason ?? englishSource.Reason;
                }
                int tableEntries=0,tableSimplified=0;
                foreach (var id in en.RowsById.Keys) foreach (string field in en.LocalizedFields) {
                    string? original = Read(en,id,field); if (string.IsNullOrWhiteSpace(original)) continue;
                    string? traditional = Read(tw,id,field), simplified = SelectSimplified(original,Read(nativeCn,id,field),Read(cnEn,id,field),Read(cn,id,field));
                    var entry = new JsonObject { ["table"]=name,["id"]=id,["field"]=field,["en"]=original,["kind"]="dat",["sourceHash"]=Program.Hash(Encoding.UTF8.GetBytes(original)) };
                    if (!string.IsNullOrEmpty(traditional)) entry["tw"] = traditional;
                    if (!string.IsNullOrEmpty(simplified)) entry["cn"] = simplified;
                    entries.Add(entry);
                    tableEntries++; if(simplified!=null)tableSimplified++;
                }
                tableReports.Add(new JsonObject{["table"]=name,["entries"]=tableEntries,["simplified"]=tableSimplified,["fallback"]=tableEntries-tableSimplified,["cnReadError"]=cnReason});
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
            ["report"]=new JsonObject { ["entries"]=entries.Count,["simplified"]=entries.Count(e=>e?["cn"] != null),["traditional"]=entries.Count(e=>e?["tw"] != null),["tables"]=tableReports,["skippedTables"]=new JsonArray(skipped.Select(s=>(JsonNode?)JsonValue.Create(s)).ToArray()),["skippedReasons"]=skippedReasons } };
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
