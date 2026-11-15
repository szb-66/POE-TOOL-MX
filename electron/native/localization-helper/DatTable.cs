using System.Buffers.Binary;
using System.Collections.ObjectModel;
using System.Globalization;
using System.Text;
using System.Text.Json.Nodes;

namespace LocalizationHelper;

public sealed record DatColumn(string Name, int Offset, int Size, string Type, bool Localized, bool IsArray, bool Unique);

/// <summary>Schema-checked DAT64 text access. Unknown layouts are rejected rather than inferred.</summary>
public sealed class DatTable {
    private readonly MemoryStream data;
    private readonly Encoding encoding;
    private readonly int codeUnitSize;
    private readonly Dictionary<string, DatColumn> columns;
    private readonly Dictionary<string, int> rowsById;
    public int RowCount { get; }
    public int RowSize { get; }
    public int PoolOffset { get; }
    public string IdField { get; }
    public IReadOnlyList<DatColumn> Columns { get; }
    public IReadOnlyDictionary<string, int> RowsById { get; }
    public IReadOnlyList<string> LocalizedFields { get; }

    public DatTable(byte[] bytes, JsonObject schema, bool unicode = true) : this(bytes,schema,unicode ? 2 : 1) { }
    public DatTable(byte[] bytes, JsonObject schema, int codeUnitSize) {
        if (bytes.Length < 12) throw new InvalidDataException("DAT header is truncated");
        this.codeUnitSize=codeUnitSize;
        encoding = codeUnitSize switch {
            1 => new UTF8Encoding(false,true), 2 => new UnicodeEncoding(false,false,true),
            4 => new UTF32Encoding(false,false,true), _ => throw new InvalidDataException("Unsupported DAT string code unit size")
        };
        uint count = BinaryPrimitives.ReadUInt32LittleEndian(bytes);
        if (count > 10_000_000) throw new InvalidDataException("DAT row count exceeds limit");
        RowCount = (int)count;
        var definitions = schema["columns"] as JsonArray ?? throw new InvalidDataException("Missing DAT schema columns");
        var list = new List<DatColumn>();
        int offset = 0;
        foreach (var node in definitions) {
            var column = node?.AsObject() ?? throw new InvalidDataException("Invalid DAT schema column");
            string type = column["type"]?.GetValue<string>() ?? throw new InvalidDataException("Missing DAT column type");
            bool array = column["array"]?.GetValue<bool>() == true || type == "array";
            int size = array ? 16 : type switch {
                "bool" => 1, "i16" or "u16" => 2,
                "i32" or "u32" or "f32" or "enumrow" => 4,
                "string" or "row" => 8, "foreignrow" => 16,
                _ => throw new InvalidDataException("Unsupported DAT column type")
            };
            if (column["interval"]?.GetValue<bool>() == true) size = checked(size * 2);
            string name = column["name"]?.GetValue<string>() ?? $"$unknown:{list.Count}";
            list.Add(new DatColumn(name, offset, size, type, column["localized"]?.GetValue<bool>() == true, array, column["unique"]?.GetValue<bool>() == true));
            offset = checked(offset + size);
        }
        RowSize = offset;
        long pool = 4L + (long)RowCount * RowSize;
        if (pool > bytes.Length - 8 || RowSize <= 0) throw new InvalidDataException("DAT schema row size does not match file");
        PoolOffset = (int)pool;
        if (!bytes.AsSpan(PoolOffset, 8).SequenceEqual(new byte[] { 0xbb,0xbb,0xbb,0xbb,0xbb,0xbb,0xbb,0xbb })) throw new InvalidDataException("DAT schema marker mismatch");
        Columns = list.AsReadOnly();
        columns = new Dictionary<string, DatColumn>(StringComparer.Ordinal);
        foreach (var column in list) if (!columns.TryAdd(column.Name, column)) throw new InvalidDataException("Duplicate DAT schema field");
        LocalizedFields = list.Where(column => column.Localized && column.Type == "string" && !column.IsArray && column.Size == 8).Select(column => column.Name).ToArray();
        data = new MemoryStream(bytes.Length + 256);
        data.Write(bytes);
        var candidates = list.Where(column => column.Name == "Id" && !column.IsArray && !column.Localized && column.Type is "string" or "i32" or "u32")
            .Concat(list.Where(column => column.Name == "HASH32" && !column.IsArray && column.Type == "u32"))
            .Concat(list.Where(column => column.Unique && !column.Localized && !column.IsArray && column.Type == "string" && column.Name is not "Text" and not "Name"));
        Dictionary<string, int>? map = null;
        string? idField = null;
        foreach (var candidate in candidates.Distinct()) {
            var attempt = new Dictionary<string, int>(StringComparer.Ordinal);
            bool valid = true;
            for (int row = 0; row < RowCount; row++) {
                string key = ReadKey(row, candidate);
                if (key.Length == 0 || !attempt.TryAdd(key, row)) { valid = false; break; }
            }
            if (valid) { map = attempt; idField = candidate.Name; break; }
        }
        if (map == null || idField == null) throw new InvalidDataException("DAT table has no verified unique stable ID");
        IdField = idField; rowsById = map; RowsById = new ReadOnlyDictionary<string,int>(rowsById);
    }

    private ReadOnlySpan<byte> Bytes => data.GetBuffer().AsSpan(0, checked((int)data.Length));
    private int Cell(int row, DatColumn column) {
        if (row < 0 || row >= RowCount) throw new InvalidDataException("DAT row is out of range");
        return checked(4 + row * RowSize + column.Offset);
    }
    private string ReadKey(int row, DatColumn column) => column.Type switch {
        "string" => ReadTextByRow(row, column.Name),
        "u32" => column.Name == "HASH32" ? "hash:" + BinaryPrimitives.ReadUInt32LittleEndian(Bytes.Slice(Cell(row,column),4)).ToString("x8",CultureInfo.InvariantCulture) : BinaryPrimitives.ReadUInt32LittleEndian(Bytes.Slice(Cell(row,column),4)).ToString(CultureInfo.InvariantCulture),
        "i32" => BinaryPrimitives.ReadInt32LittleEndian(Bytes.Slice(Cell(row,column),4)).ToString(CultureInfo.InvariantCulture),
        _ => throw new InvalidDataException("Unsupported DAT ID")
    };
    private DatColumn TextColumn(string field) {
        if (!columns.TryGetValue(field, out var column) || column.Type != "string" || column.IsArray || column.Size != 8) throw new InvalidDataException("DAT field is not a scalar string");
        return column;
    }
    public string ReadText(string id, string field) {
        if (!rowsById.TryGetValue(id, out int row)) throw new InvalidDataException("DAT stable ID is missing");
        return ReadTextByRow(row, field);
    }
    public string ReadTextByRow(int row, string field) {
        var column = TextColumn(field);
        ulong pointer = BinaryPrimitives.ReadUInt64LittleEndian(Bytes.Slice(Cell(row,column),8));
        if (pointer < 8 || pointer > (ulong)(data.Length - PoolOffset - 1)) throw new InvalidDataException("DAT string pointer is out of range");
        int start = checked(PoolOffset + (int)pointer);
        int width = codeUnitSize;
        int end = start;
        while (end <= data.Length - width) {
            bool terminated=true;
            for(int index=0;index<width;index++) if(Bytes[end+index]!=0) { terminated=false; break; }
            if (terminated) return encoding.GetString(Bytes.Slice(start,end-start));
            end += width;
        }
        throw new InvalidDataException("DAT string is not terminated");
    }
    public byte[] WriteText(string id, string field, string text) {
        SetText(id,field,text);
        return ToArray();
    }
    /// <summary>Apply many replacements without repeatedly copying the whole table.</summary>
    public void SetText(string id, string field, string text) {
        if (!rowsById.TryGetValue(id,out int row)) throw new InvalidDataException("DAT stable ID is missing");
        var column = TextColumn(field);
        if (!column.Localized) throw new InvalidDataException("Refusing to overwrite a nonlocalized DAT field");
        if (text.Length > 65536 || text.Contains('\0')) throw new InvalidDataException("DAT replacement text is invalid");
        if (ReadTextByRow(row,field) == text) return;
        byte[] replacement = encoding.GetBytes(text);
        ulong pointer = checked((ulong)(data.Length - PoolOffset));
        data.Position = data.Length; data.Write(replacement);
        for(int index=0;index<codeUnitSize;index++)data.WriteByte(0);
        BinaryPrimitives.WriteUInt64LittleEndian(data.GetBuffer().AsSpan(Cell(row,column),8),pointer);
    }
    public byte[] ToArray() => data.ToArray();
}
