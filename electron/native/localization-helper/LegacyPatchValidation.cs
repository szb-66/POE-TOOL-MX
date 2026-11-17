using System.Buffers.Binary;
using System.Text.Json.Nodes;

namespace LocalizationHelper;

/// <summary>Recovers pre-hash generations only when the old patch still proves their source bytes.</summary>
internal static class LegacyPatchValidation {
    private static readonly Lazy<JsonArray> Schemas = new(() => {
        var tables = JsonNode.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "schema.json")))!["tables"]!.AsArray();
        ResourceEngine.EnableDisplayTextFields(tables);
        return tables;
    });

    internal static void RequireOriginal(string path, byte[] source, byte[] patched) {
        bool valid;
        try {
            if (string.Equals(path, "data/languages.dat", StringComparison.OrdinalIgnoreCase))
                valid = ResourceEngine.EnableTraditional(source).AsSpan().SequenceEqual(patched);
            else if (path.StartsWith("data/traditional chinese/", StringComparison.OrdinalIgnoreCase) &&
                (path.EndsWith(".datc64", StringComparison.OrdinalIgnoreCase) || path.EndsWith(".datcl64", StringComparison.OrdinalIgnoreCase)))
                valid = MatchesDat(path, source, patched);
            else if (path.StartsWith("metadata/statdescriptions/", StringComparison.OrdinalIgnoreCase) && path.EndsWith(".csd", StringComparison.OrdinalIgnoreCase))
                valid = new StatDescriptions(patched).MatchesLegacySource(new StatDescriptions(source));
            else valid = false;
        } catch (Exception error) when (error is InvalidDataException or System.Text.DecoderFallbackException or OverflowException) {
            valid = false;
        }
        if (!valid) throw new UserError("旧汉化的原始资源内容无法可靠核验，未迁移游戏资源；请先使用 Steam 验证游戏文件完整性");
    }

    private static bool MatchesDat(string path, byte[] source, byte[] patched) {
        var name = Path.GetFileNameWithoutExtension(path);
        var schema = Schemas.Value.FirstOrDefault(table => string.Equals(table?["name"]?.GetValue<string>(), name, StringComparison.OrdinalIgnoreCase))?.AsObject();
        if (schema == null || source.Length > patched.Length) return false;
        int width = path.EndsWith(".datcl64", StringComparison.OrdinalIgnoreCase) ? 4 : 2;
        var original = new DatTable(source, schema, width);
        var result = new DatTable(patched, schema, width);
        if (original.RowCount != result.RowCount || original.RowSize != result.RowSize || original.PoolOffset != result.PoolOffset ||
            !source.AsSpan(0, 4).SequenceEqual(patched.AsSpan(0, 4)) ||
            !source.AsSpan(original.PoolOffset).SequenceEqual(patched.AsSpan(result.PoolOffset, source.Length - original.PoolOffset))) return false;
        var localized = original.LocalizedFields.ToHashSet(StringComparer.Ordinal);
        for (int row = 0; row < original.RowCount; row++) foreach (var column in original.Columns) {
            int position = checked(4 + row * original.RowSize + column.Offset);
            if (source.AsSpan(position, column.Size).SequenceEqual(patched.AsSpan(position, column.Size))) continue;
            if (!localized.Contains(column.Name)) return false;
            ulong pointer = BinaryPrimitives.ReadUInt64LittleEndian(patched.AsSpan(position, 8));
            if (pointer < (ulong)(source.Length - original.PoolOffset)) return false;
            // Both pointers must decode; only newly appended strings may replace display pointers.
            _ = original.ReadTextByRow(row, column.Name);
            _ = result.ReadTextByRow(row, column.Name);
        }
        return true;
    }
}
