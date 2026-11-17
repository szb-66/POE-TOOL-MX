using System.Buffers.Binary;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace LocalizationHelper;

/// <summary>Resolves only byte-identical critical routines from a previously validated ABI family.</summary>
internal static class MarketCompatibility {
    internal const string Abi = "poe1-market-json16-msvc-string32-v1";
    private static readonly string[] Methods = ["lookup", "searchBuilder", "stringCtor", "stringDtor", "itemsReader", "statsReader", "filtersReader"];
    private sealed record Section(string Name, uint Rva, int Raw, int Size, uint Flags);
    private sealed record Function(uint Start, uint End);
    private sealed record Range(uint Start, uint End);
    private static UserError Invalid(string reason) => new("市集结构无法确认兼容，已停止翻译：" + reason + "；请等待组件适配");
    private static void Require(bool valid, string reason) { if (!valid) throw Invalid(reason); }
    private static uint Address(JsonNode? value) {
        string? text = value?.GetValue<string>();
        Require(text != null && Regex.IsMatch(text, "^0x[0-9a-fA-F]{1,8}$"), "兼容资料地址无效");
        return Convert.ToUInt32(text![2..], 16);
    }
    private static byte[] Hex(JsonNode? value) {
        string? text = value?.GetValue<string>();
        Require(text != null && text.Length is > 0 and <= 262144 && Regex.IsMatch(text, "^(?:[0-9a-fA-F]{2})+$"), "兼容资料指纹无效");
        return Convert.FromHexString(text!);
    }
    private static string Hash(ReadOnlySpan<byte> bytes) => Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
    private static string Rva(uint value) => "0x" + value.ToString("x");

    private sealed class Image {
        internal readonly byte[] Bytes;
        internal readonly List<Section> Sections = [];
        internal readonly Section Text;
        internal readonly Dictionary<uint, Function> Functions = [];
        internal readonly uint Timestamp, Size;
        internal readonly ulong Base;
        internal readonly uint Relocations;
        internal readonly int RelocationSize;
        internal int Offset(uint rva, int length, bool code = false, bool constant = false) {
            Require(length >= 0, "资源长度无效");
            Section? found = null;
            foreach (var section in Sections) {
                if (rva < section.Rva || (ulong)rva + (uint)length > (ulong)section.Rva + (uint)section.Size) continue;
                Require(found == null, "PE节范围重叠"); found = section;
            }
            Require(found != null && (found.Flags & 0x40000000) != 0, "资源地址不在可读PE节内");
            Require(!code || (found!.Name == ".text" && (found.Flags & 0x20000000) != 0), "函数不在可执行代码节内");
            Require(!constant || (found!.Flags & (0x80000000u | 0x20000000u)) == 0, "字段键不在只读数据节内");
            return checked(found!.Raw + (int)(rva - found.Rva));
        }
        private void Bounds(int offset, int size) => Require(offset >= 0 && size >= 0 && offset <= Bytes.Length - size, "PE文件边界无效");
        private ushort U16(int offset) { Bounds(offset, 2); return BinaryPrimitives.ReadUInt16LittleEndian(Bytes.AsSpan(offset, 2)); }
        private uint U32(int offset) { Bounds(offset, 4); return BinaryPrimitives.ReadUInt32LittleEndian(Bytes.AsSpan(offset, 4)); }
        internal Image(byte[] bytes) {
            Bytes = bytes;
            Require(bytes.Length is >= 256 and <= 268435456, "可执行文件大小不受支持");
            Require(U16(0) == 0x5a4d, "DOS文件头无效");
            uint peValue = U32(0x3c); Require(peValue <= int.MaxValue - 256, "PE文件头地址无效");
            int pe = (int)peValue; Bounds(pe, 24);
            Require(U32(pe) == 0x4550 && U16(pe + 4) == 0x8664, "不是Windows x64客户端");
            int count = U16(pe + 6), optionalSize = U16(pe + 20), optional = pe + 24;
            Require(count is >= 1 and <= 96 && optionalSize >= 160, "PE节或数据目录不完整");
            Bounds(optional, optionalSize + count * 40);
            Require(U16(optional) == 0x20b && U32(optional + 108) >= 6, "不是完整PE32+映像");
            Timestamp = U32(pe + 8); Size = U32(optional + 56);
            Base = BinaryPrimitives.ReadUInt64LittleEndian(bytes.AsSpan(optional + 24, 8));
            Require(Size is > 0 and <= 536870912 && Base > 0, "PE映像范围无效");
            for (int index = 0; index < count; index++) {
                int at = optional + optionalSize + index * 40;
                string name = Encoding.ASCII.GetString(bytes, at, 8).TrimEnd('\0');
                uint rva = U32(at + 12), rawSize = U32(at + 16), raw = U32(at + 20);
                Require(rawSize <= int.MaxValue && raw <= int.MaxValue && (ulong)rva + rawSize <= Size, "PE节范围无效");
                Bounds((int)raw, (int)rawSize);
                var section = new Section(name, rva, (int)raw, (int)rawSize, U32(at + 36));
                foreach (var prior in Sections) {
                    Require(rawSize == 0 || prior.Size == 0 || (ulong)rva + rawSize <= prior.Rva || (ulong)prior.Rva + (uint)prior.Size <= rva, "PE虚拟节重叠");
                    Require(rawSize == 0 || prior.Size == 0 || (ulong)raw + rawSize <= (uint)prior.Raw || (ulong)(uint)prior.Raw + (uint)prior.Size <= raw, "PE文件节重叠");
                }
                Sections.Add(section);
            }
            var code = Sections.Where(section => section.Name == ".text").ToArray();
            Require(code.Length == 1 && (code[0].Flags & 0xe0000000) == 0x60000000, "缺少唯一只读可执行代码节"); Text = code[0];
            uint exception = U32(optional + 136), exceptionBytes = U32(optional + 140);
            Require(exception != 0 && exceptionBytes is > 0 and <= 12000000 && exceptionBytes % 12 == 0, "缺少可靠函数边界目录");
            int exceptionOffset = Offset(exception, (int)exceptionBytes);
            for (int position = 0; position < exceptionBytes; position += 12) {
                uint start = U32(exceptionOffset + position), end = U32(exceptionOffset + position + 4);
                Require(start < end && end <= Size && Functions.TryAdd(start, new(start, end)), "函数边界目录无效或重复");
            }
            Relocations = U32(optional + 152); uint relocationBytes = U32(optional + 156);
            Require(relocationBytes <= 16777216 && (relocationBytes == 0 || Relocations != 0), "重定位目录无效");
            RelocationSize = (int)relocationBytes;
        }
        internal uint Unique(byte[] pattern) {
            var code = Bytes.AsSpan(Text.Raw, Text.Size); int offset = code.IndexOf(pattern);
            Require(offset >= 0, "关键指令不存在");
            Require(code[(offset + 1)..].IndexOf(pattern) < 0, "关键指令存在多个候选");
            return checked(Text.Rva + (uint)offset);
        }
        internal int CheckRelocations(List<Range> ranges) {
            if (RelocationSize == 0) return 0;
            int start = Offset(Relocations, RelocationSize), end = start + RelocationSize, checkedCount = 0;
            for (int position = start; position < end;) {
                Require(position <= end - 8, "重定位块被截断");
                uint page = U32(position), size = U32(position + 4);
                Require(size >= 8 && size % 2 == 0 && size <= end - position, "重定位块大小无效");
                for (int entry = position + 8; entry < position + size; entry += 2) {
                    ushort value = U16(entry); int kind = value >> 12;
                    if (kind == 0) continue;
                    Require(kind is 3 or 10, "重定位类型不受支持");
                    ulong target = (ulong)page + (uint)(value & 0xfff), width = kind == 10 ? 8UL : 4UL;
                    Require(target + width <= Size, "重定位地址越界");
                    Require(!ranges.Any(range => target < range.End && target + width > range.Start), "关键函数或字段包含ASLR重定位");
                    checkedCount++;
                }
                position += (int)size;
            }
            return checkedCount;
        }
    }

    internal static JsonObject Resolve(byte[] executable, JsonObject trustedProfile) {
        try { return ResolveCore(executable, trustedProfile); }
        catch (UserError) { throw; }
        catch (Exception error) when (error is InvalidOperationException or FormatException or OverflowException or ArgumentException or KeyNotFoundException) {
            throw Invalid("兼容资料或可执行文件结构无效");
        }
    }
    private static JsonObject ResolveCore(byte[] executable, JsonObject trustedProfile) {
        Require(trustedProfile["schemaVersion"]?.GetValue<int>() == 1 && trustedProfile["structureVersion"]?.GetValue<int>() == 1 &&
            trustedProfile["game"]?.GetValue<string>() == "poe1" && trustedProfile["abi"]?.GetValue<string>() == Abi &&
            trustedProfile["validatedInGame"]?.GetValue<bool>() == true, "缺少已验证的结构基准");
        var image = new Image(executable);
        var resolved = trustedProfile.DeepClone().AsObject();
        var methods = new Dictionary<string, (uint Rva, int Size)>();
        var ranges = new List<Range>();
        foreach (string name in Methods) {
            var method = trustedProfile[name]?.AsObject() ?? throw Invalid("关键函数基准不完整");
            var prologue = Hex(method["prologue"]); int size = method["bodySize"]?.GetValue<int>() ?? 0;
            string hash = method["bodySha256"]?.GetValue<string>() ?? "";
            Require(prologue.Length is >= 64 and <= 128 && size >= prologue.Length && size <= 262144 && Regex.IsMatch(hash, "^[a-f0-9]{64}$"), "完整函数指纹无效");
            uint rva = image.Unique(prologue);
            Require(image.Functions.TryGetValue(rva, out var function) && function.End - function.Start == size, "关键函数边界已改变");
            int offset = image.Offset(rva, size, code: true);
            Require(Hash(executable.AsSpan(offset, size)) == hash, "关键函数完整内容已改变");
            uint end = checked(rva + (uint)size);
            Require(!ranges.Any(range => rva < range.End && end > range.Start), "关键函数范围重叠");
            ranges.Add(new(rva, end)); methods.Add(name, (rva, size));
            resolved[name]!["rva"] = Rva(rva);
        }
        Require(trustedProfile["sites"] is JsonArray { Count: 12 }, "目录调用点基准不完整");
        var sites = trustedProfile["sites"]!.AsArray(); var currentSites = resolved["sites"]!.AsArray();
        var seen = new HashSet<uint>(); var sectionCounts = new Dictionary<string, int>();
        for (int index = 0; index < sites.Count; index++) {
            var site = sites[index]?.AsObject() ?? throw Invalid("调用点基准无效");
            string section = site["section"]?.GetValue<string>() ?? "", field = site["field"]?.GetValue<string>() ?? "";
            Require(section is "items" or "stats" or "filters" && field is "label" or "type" or "text" or "name" or "title" or "placeholder", "调用点字段无效");
            Require(site["fieldKey"]?.GetValue<string>() == field, "调用点缺少可靠字段键");
            string reader = section + "Reader"; uint oldReader = Address(trustedProfile[reader]?["rva"]);
            uint oldContext = Address(site["contextRva"]), oldCall = Address(site["callRva"]), oldReturn = Address(site["returnRva"]);
            byte[] context = Hex(site["contextBytes"]), callBytes = Hex(site["callBytes"]);
            Require(oldContext >= oldReader && oldCall >= oldContext && oldReturn == (ulong)oldCall + 5 &&
                (ulong)oldReturn < (ulong)oldContext + (uint)context.Length && context.Length is >= 20 and <= 128 &&
                (ulong)(oldContext - oldReader) + (uint)context.Length <= (uint)methods[reader].Size, "调用点相对函数边界无效");
            uint contextRva = checked(methods[reader].Rva + oldContext - oldReader), callRva = checked(contextRva + oldCall - oldContext), returnRva = checked(callRva + 5);
            Require(seen.Add(callRva) && image.Unique(context) == contextRva, "调用点位置或唯一性已改变");
            int contextOffset = image.Offset(contextRva, context.Length, code: true), callOffset = image.Offset(callRva, 5, code: true);
            Require(callBytes.Length == 5 && callBytes.AsSpan().SequenceEqual(executable.AsSpan(callOffset, 5)) && executable[callOffset] == 0xe8 &&
                (long)returnRva + BinaryPrimitives.ReadInt32LittleEndian(executable.AsSpan(callOffset + 1, 4)) == methods["lookup"].Rva, "调用点不再指向目录读取函数");
            Require(context[0] == 0x48 && context[1] == 0x8d && context[2] == 0x15, "字段键寻址方式已改变");
            long keyAddress = (long)contextRva + 7 + BinaryPrimitives.ReadInt32LittleEndian(executable.AsSpan(contextOffset + 3, 4));
            Require(keyAddress >= 0 && keyAddress <= uint.MaxValue, "字段键地址越界");
            byte[] expectedKey = Encoding.UTF8.GetBytes(field + "\0"); uint keyRva = (uint)keyAddress;
            int keyOffset = image.Offset(keyRva, expectedKey.Length, constant: true);
            Require(expectedKey.AsSpan().SequenceEqual(executable.AsSpan(keyOffset, expectedKey.Length)), "目录字段键已改变");
            ranges.Add(new(keyRva, checked(keyRva + (uint)expectedKey.Length)));
            var current = currentSites[index]!.AsObject();
            current["contextRva"] = Rva(contextRva); current["callRva"] = Rva(callRva); current["returnRva"] = Rva(returnRva);
            sectionCounts[section] = sectionCounts.GetValueOrDefault(section) + 1;
        }
        Require(sectionCounts.Count == 3 && sectionCounts.Values.All(count => count == 4), "目录调用分组不完整");
        int relocations = image.CheckRelocations(ranges);
        resolved["referenceBuildId"] = trustedProfile["buildId"]?.DeepClone();
        resolved["referenceSha256"] = trustedProfile["sha256"]?.DeepClone();
        resolved["sha256"] = Hash(executable);
        resolved["referenceValidatedInGame"] = true;
        resolved["structurallyCompatible"] = true;
        resolved["validatedInGame"] = resolved["sha256"]!.GetValue<string>() == trustedProfile["sha256"]?.GetValue<string>();
        resolved["image"] = new JsonObject { ["imageBase"] = "0x" + image.Base.ToString("x"), ["sizeOfImage"] = Rva(image.Size), ["timeDateStamp"] = Rva(image.Timestamp) };
        resolved["checkedRelocations"] = relocations;
        return resolved;
    }

    internal static int SelfTest() {
        int cases = 0;
        void Check(bool condition) { if (!condition) throw new InvalidDataException("Market structure self-test failed"); cases++; }
        void Reject(Action action) { try { action(); } catch (UserError) { cases++; return; } throw new InvalidDataException("Incompatible market structure accepted"); }
        var (bytes, profile) = Fixture();
        Check(Resolve(bytes, profile)["sha256"]!.GetValue<string>() == Hash(bytes));
        byte[] metadata = bytes.ToArray(); BinaryPrimitives.WriteUInt32LittleEndian(metadata.AsSpan(0x88, 4), 0xabcdef01); metadata[0x1b80] ^= 1;
        var metadataResolved = Resolve(metadata, profile);
        Check(metadataResolved["sha256"]!.GetValue<string>() != profile["sha256"]!.GetValue<string>() &&
            metadataResolved["validatedInGame"]!.GetValue<bool>() == false && metadataResolved["referenceValidatedInGame"]!.GetValue<bool>() &&
            metadataResolved["structurallyCompatible"]!.GetValue<bool>());
        var moved = MoveFixture(bytes, 0x10000);
        Check(Resolve(moved, profile)["lookup"]!["rva"]!.GetValue<string>() == "0x11000");
        byte[] changed = bytes.ToArray(); changed[0x450] ^= 1; Reject(() => Resolve(changed, profile));
        byte[] duplicate = bytes.ToArray(); bytes.AsSpan(0x400, 64).CopyTo(duplicate.AsSpan(0x1700, 64)); Reject(() => Resolve(duplicate, profile));
        var wrongCall = profile.DeepClone().AsObject(); byte[] call = bytes.ToArray(); call[0x400 + 0x500 + 80 + 11] ^= 1;
        var context = wrongCall["sites"]![0]!.AsObject(); context["contextBytes"] = Convert.ToHexString(call.AsSpan(0x400 + 0x500 + 80, 25)).ToLowerInvariant(); context["callBytes"] = Convert.ToHexString(call.AsSpan(0x400 + 0x500 + 90, 5)).ToLowerInvariant();
        wrongCall["itemsReader"]!["bodySha256"] = Hash(call.AsSpan(0x400 + 0x500, 384)); Reject(() => Resolve(call, wrongCall));
        byte[] key = bytes.ToArray(); key[0x1a00] ^= 1; Reject(() => Resolve(key, profile));
        byte[] writableCode = bytes.ToArray(); BinaryPrimitives.WriteUInt32LittleEndian(writableCode.AsSpan(0x98 + 0xf0 + 36, 4), 0xe0000020); Reject(() => Resolve(writableCode, profile));
        byte[] reloc = bytes.ToArray(); BinaryPrimitives.WriteUInt32LittleEndian(reloc.AsSpan(0x1e00, 4), 0x1000); BinaryPrimitives.WriteUInt16LittleEndian(reloc.AsSpan(0x1e08, 2), 0xa010); Reject(() => Resolve(reloc, profile));
        byte[] bound = bytes.ToArray(); BinaryPrimitives.WriteUInt32LittleEndian(bound.AsSpan(0x1c04, 4), 0x2000); Reject(() => Resolve(bound, profile));
        byte[] truncated = bytes[..0x1c40]; Reject(() => Resolve(truncated, profile));
        var badAbi = profile.DeepClone().AsObject(); badAbi["abi"] = "unknown"; Reject(() => Resolve(bytes, badAbi));
        var incomplete = profile.DeepClone().AsObject(); incomplete["sites"]!.AsArray().RemoveAt(0); Reject(() => Resolve(bytes, incomplete));
        var unvalidated = profile.DeepClone().AsObject(); unvalidated["validatedInGame"] = false; Reject(() => Resolve(bytes, unvalidated));
        return cases;
    }

    private static (byte[] Bytes, JsonObject Profile) Fixture() {
        byte[] bytes = new byte[0x2200];
        void U16(int position, ushort value) => BinaryPrimitives.WriteUInt16LittleEndian(bytes.AsSpan(position, 2), value);
        void U32(int position, uint value) => BinaryPrimitives.WriteUInt32LittleEndian(bytes.AsSpan(position, 4), value);
        int pe = 0x80, optional = pe + 24, sectionTable = optional + 0xf0;
        U16(0, 0x5a4d); U32(0x3c, (uint)pe); U32(pe, 0x4550); U16(pe + 4, 0x8664); U16(pe + 6, 4); U32(pe + 8, 0x12345678); U16(pe + 20, 0xf0);
        U16(optional, 0x20b); BinaryPrimitives.WriteUInt64LittleEndian(bytes.AsSpan(optional + 24, 8), 0x140000000); U32(optional + 56, 0x7000); U32(optional + 108, 16);
        U32(optional + 136, 0x5000); U32(optional + 140, 7 * 12); U32(optional + 152, 0x6000); U32(optional + 156, 12);
        var sections = new[] { (".text", 0x1000u, 0x400u, 0x1600u, 0x60000020u), (".rdata", 0x4000u, 0x1a00u, 0x200u, 0x40000040u), (".pdata", 0x5000u, 0x1c00u, 0x200u, 0x40000040u), (".reloc", 0x6000u, 0x1e00u, 0x200u, 0x40000040u) };
        for (int i = 0; i < sections.Length; i++) { var (name, rva, raw, size, flags) = sections[i]; int at = sectionTable + i * 40; Encoding.ASCII.GetBytes(name).CopyTo(bytes, at); U32(at + 8, size); U32(at + 12, rva); U32(at + 16, size); U32(at + 20, raw); U32(at + 36, flags); }
        bytes.AsSpan(0x400, 0x1600).Fill(0xcc);
        int[] offsets = [0, 0x100, 0x200, 0x300, 0x500, 0x800, 0xb00];
        var profile = new JsonObject { ["schemaVersion"] = 1, ["structureVersion"] = 1, ["game"] = "poe1", ["abi"] = Abi, ["validatedInGame"] = true, ["buildId"] = "fixture", ["sites"] = new JsonArray(), ["image"] = new JsonObject { ["imageBase"] = "0x140000000", ["sizeOfImage"] = "0x7000", ["timeDateStamp"] = "0x12345678" } };
        for (int i = 0; i < Methods.Length; i++) {
            int start = 0x400 + offsets[i], size = i < 4 ? 96 : 384;
            bytes.AsSpan(start, size).Fill((byte)(0x90 + i)); for (int n = 0; n < 64; n++) bytes[start + n] = (byte)((i * 29 + n) % 251);
            U32(0x1c00 + i * 12, (uint)(0x1000 + offsets[i])); U32(0x1c04 + i * 12, (uint)(0x1000 + offsets[i] + size)); U32(0x1c08 + i * 12, 0x4100);
            profile[Methods[i]] = new JsonObject { ["rva"] = Rva((uint)(0x1000 + offsets[i])), ["prologue"] = Convert.ToHexString(bytes.AsSpan(start, 64)).ToLowerInvariant(), ["bodySize"] = size };
        }
        string[][] fields = [["label", "type", "text", "name"], ["label", "text", "type", "text"], ["title", "text", "text", "placeholder"]]; string[] groups = ["items", "stats", "filters"];
        int keyPosition = 0;
        for (int group = 0; group < 3; group++) for (int site = 0; site < 4; site++) {
            uint contextRva = (uint)(0x1000 + offsets[4 + group] + 80 + site * 64), callRva = contextRva + 10, returnRva = callRva + 5;
            int at = (int)contextRva - 0x1000 + 0x400; byte[] context = Convert.FromHexString("488d1500000000488bcbe800000000488bd00fb7480e0fb7c1");
            BinaryPrimitives.WriteInt32LittleEndian(context.AsSpan(3, 4), (int)(0x4000 + keyPosition - contextRva - 7)); BinaryPrimitives.WriteInt32LittleEndian(context.AsSpan(11, 4), (int)(0x1000 - returnRva)); context.CopyTo(bytes, at);
            byte[] field = Encoding.ASCII.GetBytes(fields[group][site] + "\0"); field.CopyTo(bytes, 0x1a00 + keyPosition); keyPosition += field.Length;
            profile["sites"]!.AsArray().Add(new JsonObject { ["section"] = groups[group], ["field"] = fields[group][site], ["fieldKey"] = fields[group][site], ["contextRva"] = Rva(contextRva), ["callRva"] = Rva(callRva), ["returnRva"] = Rva(returnRva), ["contextBytes"] = Convert.ToHexString(context).ToLowerInvariant(), ["callBytes"] = Convert.ToHexString(context.AsSpan(10, 5)).ToLowerInvariant() });
        }
        for (int i = 0; i < Methods.Length; i++) profile[Methods[i]]!["bodySha256"] = Hash(bytes.AsSpan(0x400 + offsets[i], i < 4 ? 96 : 384));
        U32(0x1e00, 0x4000); U32(0x1e04, 12); U16(0x1e08, 0xa180);
        profile["sha256"] = Hash(bytes); return (bytes, profile);
    }
    private static byte[] MoveFixture(byte[] original, uint delta) {
        byte[] bytes = original.ToArray(); int optional = 0x98, sectionTable = optional + 0xf0;
        void Add(int offset) => BinaryPrimitives.WriteUInt32LittleEndian(bytes.AsSpan(offset, 4), checked(BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(offset, 4)) + delta));
        Add(optional + 56); Add(optional + 136); Add(optional + 152);
        for (int i = 0; i < 4; i++) Add(sectionTable + i * 40 + 12);
        for (int i = 0; i < 7; i++) { Add(0x1c00 + i * 12); Add(0x1c04 + i * 12); Add(0x1c08 + i * 12); }
        Add(0x1e00); return bytes;
    }
}
