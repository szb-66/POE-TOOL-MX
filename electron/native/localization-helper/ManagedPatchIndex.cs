using System.Buffers.Binary;
using System.Text;
using System.Text.RegularExpressions;
using LibBundle3;
using BundleIndex = LibBundle3.Index;

namespace LocalizationHelper;

/// <summary>Removes only verified managed file redirects from a copy of the current index.</summary>
internal static class ManagedPatchIndex {
    private sealed record BundleInfo(string Path, int Size);
    private readonly record struct FileInfo(ulong Hash, int Bundle, int Offset, int Size, int Position);
    private sealed record IndexData(byte[] Envelope, byte[] Body, BundleInfo[] Bundles, int FilesStart, int FileCount);
    private static bool Managed(string path) => path.StartsWith("PoEHelper/", StringComparison.OrdinalIgnoreCase) || path.StartsWith("LibGGPK3/", StringComparison.OrdinalIgnoreCase);

    internal static bool HasManagedReferences(BundleIndex index) {
        foreach (var bundle in index.Bundles.Span) if (Managed(bundle.Path) && bundle.Files.Count > 0) return true;
        return false;
    }

    internal static bool HasManagedReferences(string game, string indexPath) {
        var data = Read(indexPath);
        foreach (var file in Files(data)) if (Managed(data.Bundles[file.Bundle].Path)) return true;
        return false;
    }

    internal static bool ReferencesAnyGeneration(string indexPath, IEnumerable<string> generations) {
        var data = Read(indexPath);
        var prefixes = generations.Select(generation => "PoEHelper/" + generation + "/").ToArray();
        var bundles = data.Bundles.Select(bundle => prefixes.Any(prefix => bundle.Path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))).ToArray();
        return bundles.Contains(true) && Files(data).Any(file => bundles[file.Bundle]);
    }

    internal static byte[] Rebase(string game, string currentIndexPath, string originalIndexPath, string recordedIndexPath,
        string generation, IReadOnlyDictionary<string, string>? originalHashes) {
        if (!Regex.IsMatch(generation, @"^[A-Za-z0-9_-]{1,80}$")) throw new UserError("旧汉化代际标识无效，未迁移游戏资源");
        var current = Read(currentIndexPath);
        var original = Read(originalIndexPath);
        var recorded = Read(recordedIndexPath);
        var prefix = "PoEHelper/" + generation + "/";
        var selected = new Dictionary<ulong, FileInfo>();
        foreach (var file in Files(current)) {
            var path = current.Bundles[file.Bundle].Path;
            if (!Managed(path)) continue;
            if (!path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) throw new UserError("游戏仍引用无法确认来源的其他补丁，未迁移游戏资源");
            selected.Add(file.Hash, file);
        }
        var oldFiles = Find(recorded, selected);
        var originals = Find(original, selected);
        Dictionary<ulong, string>? legacyPaths = null;
        if (originalHashes == null) {
            legacyPaths = new Dictionary<ulong, string>();
            using var paths = Program.Open(game, indexPath: originalIndexPath);
            foreach (var hash in selected.Keys) {
                if (!paths.Files.TryGetValue(hash, out var file) || string.IsNullOrEmpty(file.Path))
                    throw new UserError("旧汉化缺少可核验的原始资源路径，未迁移游戏资源");
                legacyPaths.Add(hash, file.Path);
            }
        }
        var currentBundles = current.Bundles.Select((bundle, index) => (bundle, index))
            .ToDictionary(item => item.bundle.Path, item => item.index, StringComparer.OrdinalIgnoreCase);
        var replacements = new List<(FileInfo Current, FileInfo Original, int Bundle)>();
        foreach (var file in selected.Values) {
            if (!oldFiles.TryGetValue(file.Hash, out var old) || old.Offset != file.Offset || old.Size != file.Size ||
                !string.Equals(recorded.Bundles[old.Bundle].Path, current.Bundles[file.Bundle].Path, StringComparison.OrdinalIgnoreCase) ||
                recorded.Bundles[old.Bundle].Size != current.Bundles[file.Bundle].Size)
                throw new UserError("游戏中的旧补丁引用与受管记录不同，未迁移游戏资源");
            if (!originals.TryGetValue(file.Hash, out var source) || Managed(original.Bundles[source.Bundle].Path))
                throw new UserError("找不到旧补丁对应的可靠原始资源，未迁移游戏资源");
            var sourceBundle = original.Bundles[source.Bundle];
            if (!currentBundles.TryGetValue(sourceBundle.Path, out var destination) || current.Bundles[destination].Size != sourceBundle.Size)
                throw new UserError("原始资源包已被游戏更新替换，无法安全迁移旧补丁；请先修复游戏文件");
            replacements.Add((file, source, destination));
        }
        if (legacyPaths != null) {
            var sources = new Dictionary<ulong, byte[]>();
            foreach (var group in replacements.GroupBy(item => item.Bundle)) {
                var expected = current.Bundles[group.Key];
                using var stream = NativeBundleValidation.OpenRead(NativeBundleValidation.Resolve(Path.Combine(game, "Bundles2"), expected.Path + ".bundle.bin"));
                using var bundle = new Bundle(stream, true);
                if (bundle.UncompressedSize != expected.Size) throw new UserError("原始资源包实际大小与备份不同，未迁移游戏资源");
                foreach (var item in group) sources.Add(item.Current.Hash, bundle.ReadWithoutCache(item.Original.Offset, item.Original.Size).ToArray());
            }
            foreach (var group in replacements.GroupBy(item => oldFiles[item.Current.Hash].Bundle)) {
                var expected = recorded.Bundles[group.Key];
                using var stream = NativeBundleValidation.OpenRead(NativeBundleValidation.Resolve(Path.Combine(game, "Bundles2"), expected.Path + ".bundle.bin"));
                using var bundle = new Bundle(stream, true);
                if (bundle.UncompressedSize != expected.Size) throw new UserError("旧补丁资源包实际大小与记录不同，未迁移游戏资源");
                foreach (var item in group) {
                    var old = oldFiles[item.Current.Hash];
                    LegacyPatchValidation.RequireOriginal(legacyPaths[item.Current.Hash], sources[item.Current.Hash], bundle.ReadWithoutCache(old.Offset, old.Size).ToArray());
                    sources.Remove(item.Current.Hash);
                }
            }
        }
        // Validate source bytes before changing any row; the caller guards legacy snapshots without hashes.
        foreach (var group in replacements.GroupBy(item => item.Bundle)) {
            var expected = current.Bundles[group.Key];
            var path = NativeBundleValidation.Resolve(Path.Combine(game, "Bundles2"), expected.Path + ".bundle.bin");
            using var stream = NativeBundleValidation.OpenRead(path);
            using var bundle = new Bundle(stream, true);
            if (bundle.UncompressedSize != expected.Size) throw new UserError("原始资源包实际大小与备份不同，未迁移游戏资源");
            foreach (var item in group) {
                var source = item.Original;
                if (source.Offset < 0 || source.Size < 0 || (long)source.Offset + source.Size > bundle.UncompressedSize)
                    throw new UserError("原始资源范围无效，未迁移游戏资源");
                var bytes = bundle.ReadWithoutCache(source.Offset, source.Size);
                if (originalHashes != null) {
                    if (!originalHashes.TryGetValue(source.Hash.ToString("x16"), out var hash) ||
                        !Regex.IsMatch(hash, "^[a-f0-9]{64}$") || Program.Hash(bytes.AsSpan()) != hash)
                        throw new UserError("原始资源内容已改变或缺少核验记录，未迁移游戏资源；请先修复游戏文件");
                }
            }
        }
        foreach (var item in replacements) {
            var row = current.Body.AsSpan(item.Current.Position + 8, 12);
            BinaryPrimitives.WriteInt32LittleEndian(row, item.Bundle);
            BinaryPrimitives.WriteInt32LittleEndian(row[4..], item.Original.Offset);
            BinaryPrimitives.WriteInt32LittleEndian(row[8..], item.Original.Size);
        }
        NativeBundleValidation.ValidateIndex(current.Body);
        using var output = new MemoryStream();
        output.Write(current.Envelope); output.Position = 0;
        using (var bundle = new Bundle(output, true)) bundle.Save(current.Body);
        var result = output.ToArray();
        NativeBundleValidation.ValidateCompressedIndex(result);
        return result;
    }

    private static IndexData Read(string path) {
        var envelope = NativeBundleValidation.ReadIndex(path);
        using var stream = new MemoryStream(envelope, false);
        using var bundle = new Bundle(stream, true);
        var body = bundle.ReadWithoutCache();
        int position = 0;
        int Next() { var value = BinaryPrimitives.ReadInt32LittleEndian(body.AsSpan(position, 4)); position += 4; return value; }
        var bundles = new BundleInfo[Next()];
        for (int index = 0; index < bundles.Length; index++) {
            var length = Next(); var name = Encoding.UTF8.GetString(body, position, length); position += length;
            bundles[index] = new(name, Next());
        }
        int count = Next(), start = position;
        var hashes = new HashSet<ulong>();
        for (int file = 0; file < count; file++)
            if (!hashes.Add(BinaryPrimitives.ReadUInt64LittleEndian(body.AsSpan(start + file * 20, 8))))
                throw new InvalidDataException("Duplicate index resource hash");
        return new(envelope, body, bundles, start, count);
    }

    private static IEnumerable<FileInfo> Files(IndexData data) {
        for (int file = 0; file < data.FileCount; file++) {
            int position = data.FilesStart + file * 20;
            yield return new(BinaryPrimitives.ReadUInt64LittleEndian(data.Body.AsSpan(position, 8)),
                BinaryPrimitives.ReadInt32LittleEndian(data.Body.AsSpan(position + 8, 4)),
                BinaryPrimitives.ReadInt32LittleEndian(data.Body.AsSpan(position + 12, 4)),
                BinaryPrimitives.ReadInt32LittleEndian(data.Body.AsSpan(position + 16, 4)), position);
        }
    }

    private static Dictionary<ulong, FileInfo> Find(IndexData data, Dictionary<ulong, FileInfo> selected) {
        var result = new Dictionary<ulong, FileInfo>();
        foreach (var file in Files(data)) if (selected.ContainsKey(file.Hash)) result.Add(file.Hash, file);
        return result;
    }
}
