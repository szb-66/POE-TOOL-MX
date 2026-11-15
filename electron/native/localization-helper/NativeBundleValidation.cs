using System.Buffers.Binary;
using System.Text;
using LibBundle3;

namespace LocalizationHelper;

/// <summary>Checks all size/path boundaries before LibBundle3's unsafe readers see a bundle.</summary>
public static class NativeBundleValidation {
    private const int MaxRawBytes = 512 * 1024 * 1024;
    private const int MaxChunkBytes = 16 * 1024 * 1024;
    private const int MaxPathBytes = 4096;
    private static readonly UTF8Encoding Utf8 = new(false, true);

    public static string Resolve(string root, string relative) {
        root = Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar);
        ValidateRelative(relative);
        string target = Path.GetFullPath(Path.Combine(root, relative.Replace('/', Path.DirectorySeparatorChar)));
        var comparison = OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
        if (!target.StartsWith(root + Path.DirectorySeparatorChar, comparison)) throw new InvalidDataException("Bundle path leaves its root");
        NoLinks(target);
        return target;
    }
    private static void ValidateRelative(string relative) {
        if (string.IsNullOrEmpty(relative) || relative.Length > MaxPathBytes || Path.IsPathRooted(relative) || relative.Contains('\\') ||
            relative.Any(character => character < 32 || character == ':' || character == '\0') ||
            relative.Split('/').Any(part => part.Length == 0 || part is "." or ".." || part.EndsWith(' ') || part.EndsWith('.'))) throw new InvalidDataException("Invalid relative bundle path");
    }
    private static void NoLinks(string path) {
        for (FileSystemInfo? current = File.Exists(path) ? new FileInfo(path) : new DirectoryInfo(path); current != null;
            current = current is FileInfo file ? file.Directory : ((DirectoryInfo)current).Parent) {
            if (current.Exists && (current.Attributes & FileAttributes.ReparsePoint) != 0) throw new InvalidDataException("Linked bundle path is unsupported");
        }
    }
    public static FileStream OpenRead(string path) {
        NoLinks(Path.GetFullPath(path));
        var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read);
        try { ValidateEnvelope(stream); stream.Position = 0; return stream; }
        catch { stream.Dispose(); throw; }
    }
    public static byte[] ReadIndex(string path) {
        using var stream = OpenRead(path);
        if (stream.Length > MaxRawBytes) throw new InvalidDataException("Compressed index exceeds supported size");
        var bytes = new byte[checked((int)stream.Length)]; stream.ReadExactly(bytes);
        ValidateCompressedIndex(bytes); return bytes;
    }
    public static void ValidateCompressedIndex(byte[] bytes) {
        using var stream = new MemoryStream(bytes, false);
        ValidateEnvelope(stream, MaxRawBytes); stream.Position = 0;
        using var bundle = new Bundle(stream, true);
        ValidateIndex(bundle.ReadWithoutCache());
    }

    private static int Int(ReadOnlySpan<byte> bytes, int offset) => BinaryPrimitives.ReadInt32LittleEndian(bytes.Slice(offset, 4));
    private static void Require(bool condition, string reason) { if (!condition) throw new InvalidDataException(reason); }
    private static void ValidateEnvelope(Stream stream, int maximumDecodedBytes = int.MaxValue) {
        Require(stream.CanSeek && stream.Length >= 60, "Truncated bundle header");
        stream.Position = 0;
        Span<byte> header = stackalloc byte[60]; stream.ReadExactly(header);
        int raw = Int(header, 0), compressed = Int(header, 4), head = Int(header, 8), compressor = Int(header, 12);
        int count = Int(header, 36), chunk = Int(header, 40);
        Require(raw >= 0 && raw <= maximumDecodedBytes && compressed >= 0 && compressor >= 0 && compressor < 14, "Invalid bundle size or codec");
        Require(chunk > 0 && chunk <= MaxChunkBytes && count >= 0 && count <= 1_000_000, "Invalid bundle chunk geometry");
        Require(count == ((long)raw + chunk - 1) / chunk && head == 48L + (long)count * 4, "Bundle chunk count or header size mismatch");
        Require(BinaryPrimitives.ReadInt64LittleEndian(header.Slice(20, 8)) == raw &&
            BinaryPrimitives.ReadInt64LittleEndian(header.Slice(28, 8)) == compressed, "Bundle 32/64-bit sizes disagree");
        Require(60L + (long)count * 4 + compressed <= stream.Length, "Bundle payload is truncated");
        long total = 0;
        // CodecBridge allocates this many bytes for one full chunk, including frame overhead.
        long maximumCompressedChunk = chunk + 2L * (((long)chunk + 262143) / 262144) + 64;
        Span<byte> size = stackalloc byte[4];
        for (int index = 0; index < count; index++) {
            stream.ReadExactly(size); int length = Int(size, 0);
            Require(length > 0 && length <= maximumCompressedChunk, "Compressed bundle chunk exceeds decoder buffer");
            total += length;
        }
        Require(total == compressed && (count > 0 || compressed == 0), "Compressed bundle chunk sizes do not add up");
    }

    /// <param name="bytes">The decompressed index body, not the _.index.bin envelope.</param>
    public static void ValidateIndex(byte[] bytes) {
        Require(bytes.Length >= 12 && bytes.Length <= MaxRawBytes, "Index body has unsupported size");
        int position = 0;
        int ReadInt() { Require(position <= bytes.Length - 4, "Truncated index integer"); int value = Int(bytes, position); position += 4; return value; }
        int bundleCount = ReadInt();
        Require(bundleCount >= 0 && bundleCount <= 1_000_000 && bundleCount <= (bytes.Length - position) / 9, "Invalid index bundle count");
        var bundleSizes = new int[bundleCount];
        var bundlePaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        for (int index = 0; index < bundleCount; index++) {
            int length = ReadInt(); Require(length > 0 && length <= MaxPathBytes && length <= bytes.Length - position - 4, "Invalid index bundle path length");
            string path = Utf8.GetString(bytes, position, length); position += length;
            ValidateRelative(path); Require(bundlePaths.Add(path), "Duplicate bundle path");
            // Indexed game bundles can exceed 512 MiB; FileRecord reads only requested chunks.
            // Keep the bounded whole-decode limit on the index/path bundles, not these declarations.
            int size = ReadInt(); Require(size >= 0, "Invalid index bundle uncompressed size"); bundleSizes[index] = size;
        }
        int files = ReadInt();
        Require(files >= 0 && files <= 10_000_000 && files <= (bytes.Length - position) / 20, "Invalid index file count");
        for (int file = 0; file < files; file++) {
            position += 8; // uint64 resource hash; managed dictionary insertion detects duplicates later.
            int bundle = ReadInt(), offset = ReadInt(), size = ReadInt();
            Require(bundle >= 0 && bundle < bundleCount && offset >= 0 && size >= 0 && (long)offset + size <= bundleSizes[bundle], "Index file points beyond its bundle");
        }
        int directories = ReadInt();
        Require(directories >= 0 && directories <= 1_000_000 && directories <= (bytes.Length - position) / 20, "Invalid index directory count");
        var ranges = new (int Offset, int Size)[directories];
        long budget = 0;
        for (int directory = 0; directory < directories; directory++) {
            position += 8;
            int offset = ReadInt(), size = ReadInt(), recursiveSize = ReadInt();
            Require(offset >= 0 && size >= 0 && recursiveSize >= 0, "Negative index directory range");
            ranges[directory] = (offset, size); budget += size;
        }
        Require(bytes.Length - position >= 60, "Missing index path bundle");
        using var stream = new MemoryStream(bytes, position, bytes.Length - position, false);
        // MemoryStream's offset-origin constructor presents a zero-based Position/Length to consumers.
        ValidateEnvelope(stream, MaxRawBytes); stream.Position = 0;
        using var pathBundle = new Bundle(stream, true);
        var paths = pathBundle.ReadWithoutCache();
        Require(budget <= (long)paths.Length * 8 + 1024 * 1024, "Index directory validation budget exceeded");
        foreach (var range in ranges) ValidateDirectory(paths, range.Offset, range.Size);
    }

    private static void ValidateDirectory(byte[] bytes, int offset, int size) {
        Require(offset >= 0 && size >= 0 && (long)offset + size <= bytes.Length, "Directory path range exceeds decoded bundle");
        int position = offset, end = offset + size;
        var prefixes = new List<(int Length, int Depth)>(); bool inBase = false;
        while (position <= end - 4) {
            int reference = Int(bytes, position); position += 4;
            Require(reference >= 0, "Negative path prefix reference");
            if (reference == 0) { inBase = !inBase; if (inBase) prefixes.Clear(); continue; }
            int start = position;
            while (position < end && bytes[position] != 0) position++;
            Require(position < end, "Directory path lacks a bounded terminator");
            int length = position - start;
            Require(length <= MaxPathBytes, "Directory path fragment exceeds supported length");
            // Prefix compression operates on bytes and may split a UTF-8 code point between fragments.
            int prefix = reference - 1;
            var parent = prefix < prefixes.Count ? prefixes[prefix] : (Length: 0, Depth: 0);
            int combined = parent.Length + length, depth = parent.Depth + 1;
            Require(combined <= MaxPathBytes && depth <= MaxPathBytes, "Reconstructed directory path exceeds supported limits");
            if (inBase) prefixes.Add((combined, depth));
            position++;
        }
    }

    public static int SelfTest(string directory) {
        var root = Path.Combine(Path.GetFullPath(directory), "bundle-validation-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        void Reject(Action action) { try { action(); } catch (InvalidDataException) { return; } throw new InvalidDataException("Bundle boundary self-test accepted invalid input"); }
        byte[] Envelope(byte[] payload) {
            // One syntactically raw Kraken frame (or zero chunks for empty content).
            int count = payload.Length == 0 ? 0 : 1; var output = new byte[60 + count * 4 + (count == 0 ? 0 : payload.Length + 2)];
            BinaryPrimitives.WriteInt32LittleEndian(output, payload.Length);
            BinaryPrimitives.WriteInt32LittleEndian(output.AsSpan(4), count == 0 ? 0 : payload.Length + 2);
            BinaryPrimitives.WriteInt32LittleEndian(output.AsSpan(8), 48 + 4 * count);
            BinaryPrimitives.WriteInt32LittleEndian(output.AsSpan(12), 8);
            BinaryPrimitives.WriteInt32LittleEndian(output.AsSpan(16), 1);
            BinaryPrimitives.WriteInt64LittleEndian(output.AsSpan(20), payload.Length);
            BinaryPrimitives.WriteInt64LittleEndian(output.AsSpan(28), count == 0 ? 0 : payload.Length + 2);
            BinaryPrimitives.WriteInt32LittleEndian(output.AsSpan(36), count);
            BinaryPrimitives.WriteInt32LittleEndian(output.AsSpan(40), 262144);
            if (count == 1) { BinaryPrimitives.WriteInt32LittleEndian(output.AsSpan(60), payload.Length + 2); output[64] = 0xcc; output[65] = 6; payload.CopyTo(output, 66); }
            return output;
        }
        void EnvelopeCase(Action<byte[]> mutate) { byte[] bytes = Envelope([1, 2, 3]); mutate(bytes); using var stream = new MemoryStream(bytes); ValidateEnvelope(stream); }
        byte[] FileIndex(int bundle, int offset, int size) {
            using var body = new MemoryStream(); using var writer = new BinaryWriter(body, Encoding.UTF8, true);
            writer.Write(1); writer.Write(7); writer.Write(Encoding.UTF8.GetBytes("fixture")); writer.Write(1_000_000_000);
            writer.Write(1); writer.Write(42UL); writer.Write(bundle); writer.Write(offset); writer.Write(size);
            writer.Write(0); writer.Write(Envelope([])); writer.Flush(); return body.ToArray();
        }
        try {
            var file = Path.Combine(root, "valid.bundle.bin"); File.WriteAllBytes(file, Envelope([1, 2, 3]));
            using (var stream = OpenRead(file)) Require(stream.Position == 0, "Validated stream must be rewound");
            Reject(() => EnvelopeCase(bytes => BinaryPrimitives.WriteInt32LittleEndian(bytes.AsSpan(60), 1_000_000)));
            Reject(() => EnvelopeCase(bytes => BinaryPrimitives.WriteInt32LittleEndian(bytes.AsSpan(36), int.MaxValue)));
            Reject(() => EnvelopeCase(bytes => BinaryPrimitives.WriteInt64LittleEndian(bytes.AsSpan(20), 99)));
            Reject(() => EnvelopeCase(bytes => BinaryPrimitives.WriteInt32LittleEndian(bytes.AsSpan(8), 48)));
            Reject(() => EnvelopeCase(bytes => BinaryPrimitives.WriteInt32LittleEndian(bytes.AsSpan(40), 0)));
            Reject(() => Resolve(root, "../outside.bundle.bin"));
            Reject(() => Resolve(root, "C:/outside.bundle.bin"));
            Reject(() => Resolve(root, "path\\outside.bundle.bin"));
            Reject(() => Resolve(root, ".. /outside.bundle.bin"));
            Require(Resolve(root, "managed/0.bundle.bin").StartsWith(root), "Valid relative path rejected");
            byte[] empty = new byte[12 + 60]; Envelope([]).CopyTo(empty, 12); ValidateIndex(empty);
            using (var large = new MemoryStream()) {
                using var writer = new BinaryWriter(large, Encoding.UTF8, true);
                writer.Write(1); writer.Write(7); writer.Write(Encoding.UTF8.GetBytes("fixture")); writer.Write(1_000_000_000);
                writer.Write(0); writer.Write(0); writer.Write(Envelope([])); writer.Flush();
                ValidateIndex(large.ToArray()); // Large game bundle declarations are not whole-decoded.
            }
            Reject(() => ValidateIndex([0, 0, 0, 127]));
            var invalid = (byte[])empty.Clone(); BinaryPrimitives.WriteInt32LittleEndian(invalid.AsSpan(4), int.MaxValue); Reject(() => ValidateIndex(invalid));
            invalid = (byte[])empty.Clone(); BinaryPrimitives.WriteInt32LittleEndian(invalid.AsSpan(8), int.MaxValue); Reject(() => ValidateIndex(invalid));
            ValidateIndex(FileIndex(0, 0, 10));
            Reject(() => ValidateIndex(FileIndex(1, 0, 10)));
            Reject(() => ValidateIndex(FileIndex(0, -1, 10)));
            Reject(() => ValidateIndex(FileIndex(0, 0, -1)));
            Reject(() => ValidateIndex(FileIndex(0, 999_999_999, 2)));
            using (var range = new MemoryStream()) {
                using var writer = new BinaryWriter(range, Encoding.UTF8, true);
                writer.Write(0); writer.Write(0); writer.Write(1); writer.Write(42UL); writer.Write(1); writer.Write(4); writer.Write(4);
                writer.Write(Envelope([])); writer.Flush(); Reject(() => ValidateIndex(range.ToArray()));
            }
            Reject(() => ValidateDirectory([1, 0, 0, 0, 65], 0, 5));
            Reject(() => ValidateDirectory([255, 255, 255, 255], 0, 4));
            Reject(() => ValidateDirectory([], 0, 1));
            byte[] splitUtf8 = [0,0,0,0, 1,0,0,0, 0xe4,0, 0,0,0,0, 1,0,0,0, 0xb8,0xad,0];
            ValidateDirectory(splitUtf8, 0, splitUtf8.Length);
            return 26;
        } finally {
            if (Directory.Exists(root) && Path.GetFileName(root).StartsWith("bundle-validation-", StringComparison.Ordinal)) {
                if (OperatingSystem.IsWindows()) Microsoft.VisualBasic.FileIO.FileSystem.DeleteDirectory(root, Microsoft.VisualBasic.FileIO.UIOption.OnlyErrorDialogs, Microsoft.VisualBasic.FileIO.RecycleOption.SendToRecycleBin);
                else Directory.Delete(root, true);
            }
        }
    }
}
