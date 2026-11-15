using System.Buffers.Binary;
using System.IO.Pipes;
using System.Runtime.InteropServices;
using System.Runtime.Versioning;
using System.Security.AccessControl;
using System.Security.Principal;
using Microsoft.Win32.SafeHandles;

namespace LocalizationHelper;

/// <summary>A same-account pipe whose explicit medium label also permits a non-elevated game.</summary>
[SupportedOSPlatform("windows")]
internal static partial class MarketPipe {
    private const uint OwnerSecurityInformation = 0x1, DaclSecurityInformation = 0x4, LabelSecurityInformation = 0x10;
    private const uint KernelObject = 6;

    internal static NamedPipeServerStream Create(string name) {
        const string prefix = "PoEHelper.Market.";
        if (!name.StartsWith(prefix, StringComparison.Ordinal)) throw new UserError("市集控制通道名称无效");
        string suffix = name[prefix.Length..];
        bool processName = suffix.Length is > 0 and <= 10 && suffix.All(char.IsAsciiDigit) && uint.TryParse(suffix, out uint pid) && pid != 0;
        bool testName = suffix.StartsWith("SelfTest.", StringComparison.Ordinal) && Guid.TryParseExact(suffix[9..], "N", out _);
        if (!processName && !testName) throw new UserError("市集控制通道名称无效");
        using var identity = WindowsIdentity.GetCurrent();
        var user = identity.User ?? throw new UserError("无法确认市集控制通道所属账号");
        // Keep the descriptor native: PipeSecurity/CommonAcl drops the mandatory-label ACE.
        string sddl = $"O:{user.Value}D:P(A;;GA;;;{user.Value})S:(ML;;NW;;;ME)";
        if (!ConvertStringSecurityDescriptorToSecurityDescriptorW(sddl, 1, out IntPtr descriptor, out _))
            throw NativeError("无法创建市集控制通道权限", Marshal.GetLastPInvokeError());
        try {
            var attributes = new SecurityAttributes { Length = (uint)Marshal.SizeOf<SecurityAttributes>(), Descriptor = descriptor };
            var handle = CreateNamedPipeW(@"\\.\pipe\" + name, 0x40080003, 0x8, 1, 65536, 65536, 0, ref attributes);
            int error = Marshal.GetLastPInvokeError();
            if (handle.IsInvalid) { handle.Dispose(); throw NativeError("无法创建市集控制通道", error); }
            NamedPipeServerStream? server = null;
            try {
                server = new NamedPipeServerStream(PipeDirection.InOut, true, false, handle);
                AssertSecurity(server);
                return server;
            } catch { if (server != null) server.Dispose(); else handle.Dispose(); throw; }
        } finally { LocalFree(descriptor); }
    }

    internal static void AssertSecurity(NamedPipeServerStream server) {
        using var identity = WindowsIdentity.GetCurrent();
        var user = identity.User ?? throw new UserError("无法确认市集控制通道所属账号");
        IntPtr descriptor = IntPtr.Zero;
        try {
            uint error = GetSecurityInfo(server.SafePipeHandle, KernelObject,
                OwnerSecurityInformation | DaclSecurityInformation | LabelSecurityInformation,
                out _, out _, out _, out _, out descriptor);
            if (error != 0) throw new UserError($"无法核实市集控制通道权限（{error}）");
            if (descriptor == IntPtr.Zero) throw new UserError("市集控制通道权限描述符无效");
            uint length = GetSecurityDescriptorLength(descriptor);
            if (length is < 20 or > 65536) throw new UserError("市集控制通道权限描述符无效");
            byte[] bytes = new byte[(int)length];
            Marshal.Copy(descriptor, bytes, 0, bytes.Length);
            var security = new RawSecurityDescriptor(bytes, 0);
            if (security.Owner is not SecurityIdentifier owner || !user.Equals(owner) || !security.ControlFlags.HasFlag(ControlFlags.DiscretionaryAclProtected)
                || security.DiscretionaryAcl is not { Count: 1 } dacl || dacl[0] is not CommonAce ace
                || ace.AceQualifier != AceQualifier.AccessAllowed || ace.IsCallback || ace.AceFlags != AceFlags.None
                || !user.Equals(ace.SecurityIdentifier)
                || (ace.AccessMask & 0x10000000) == 0 && (ace.AccessMask & 0x1f019f) != 0x1f019f)
                throw new UserError("市集控制通道必须仅允许当前账号访问");
            // RawSecurityDescriptor preserves the mandatory-label ACE that CommonAcl/PipeSecurity drops.
            if (security.SystemAcl is not { Count: 1 } sacl || (byte)sacl[0].AceType != 0x11 || sacl[0].AceFlags != AceFlags.None)
                throw new UserError("市集控制通道缺少明确的中完整性安全标签");
            byte[] label = new byte[sacl[0].BinaryLength];
            sacl[0].GetBinaryForm(label, 0);
            if (label.Length < 20 || BinaryPrimitives.ReadUInt32LittleEndian(label.AsSpan(4, 4)) != 1
                || !new SecurityIdentifier(label, 8).Equals(new SecurityIdentifier("S-1-16-8192")))
                throw new UserError("市集控制通道完整性标签不是 Medium／NoWriteUp");
        } finally { if (descriptor != IntPtr.Zero) LocalFree(descriptor); }
    }

    internal static unsafe int SelfTest() {
        int cases = 0;
        void Require(bool condition) { if (!condition) throw new InvalidDataException("Market pipe security self-test failed"); cases++; }
        string name = "PoEHelper.Market.SelfTest." + Guid.NewGuid().ToString("N");
        using var server = Create(name);
        AssertSecurity(server); cases++;
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(3));
        Task connection = server.WaitForConnectionAsync(timeout.Token);
        using var client = CreateFileW(@"\\.\pipe\" + name, 0xc0000000, 0, IntPtr.Zero, 3, 0, IntPtr.Zero);
        Require(!client.IsInvalid);
        connection.GetAwaiter().GetResult();
        Require(GetNamedPipeClientProcessId(server.SafePipeHandle, out uint clientPid) && clientPid == Environment.ProcessId);
        server.WriteAsync(new byte[] { 0x19, 0x27, 0x35 }, timeout.Token).AsTask().GetAwaiter().GetResult();
        byte* incoming = stackalloc byte[3];
        Require(ReadFile(client, incoming, 3, out uint got, IntPtr.Zero) && got == 3 && incoming[0] == 0x19 && incoming[1] == 0x27 && incoming[2] == 0x35);
        byte* outgoing = stackalloc byte[4] { 0x42, 0x53, 0x64, 0x75 };
        Require(WriteFile(client, outgoing, 4, out uint sent, IntPtr.Zero) && sent == 4);
        byte[] response = new byte[4];
        server.ReadExactlyAsync(response, timeout.Token).AsTask().GetAwaiter().GetResult();
        Require(response.AsSpan().SequenceEqual(new byte[] { 0x42, 0x53, 0x64, 0x75 }));
        bool duplicateRejected = false;
        try { using var duplicate = Create(name); }
        catch (UserError error) when (error.Data["NativeError"] is 5 or 231) { duplicateRejected = true; }
        Require(duplicateRejected);
        bool pathRejected = false;
        try { using var invalid = Create(@"PoEHelper.Market.1\outside"); }
        catch (UserError) { pathRejected = true; }
        Require(pathRejected);
        return cases;
    }

    private static UserError NativeError(string message, int code) {
        var error = new UserError($"{message}（{code}）"); error.Data["NativeError"] = code; return error;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct SecurityAttributes { public uint Length; public IntPtr Descriptor; public int InheritHandle; }

    [LibraryImport("advapi32.dll", EntryPoint = "ConvertStringSecurityDescriptorToSecurityDescriptorW", StringMarshalling = StringMarshalling.Utf16, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool ConvertStringSecurityDescriptorToSecurityDescriptorW(string text, uint revision, out IntPtr descriptor, out uint size);
    [LibraryImport("kernel32.dll", EntryPoint = "CreateNamedPipeW", StringMarshalling = StringMarshalling.Utf16, SetLastError = true)]
    private static partial SafePipeHandle CreateNamedPipeW(string name, uint openMode, uint pipeMode, uint maxInstances, uint outBufferSize,
        uint inBufferSize, uint defaultTimeout, ref SecurityAttributes attributes);
    [LibraryImport("kernel32.dll", EntryPoint = "CreateFileW", StringMarshalling = StringMarshalling.Utf16, SetLastError = true)]
    private static partial SafePipeHandle CreateFileW(string name, uint access, uint share, IntPtr attributes, uint disposition, uint flags, IntPtr template);
    [LibraryImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static unsafe partial bool ReadFile(SafePipeHandle handle, byte* buffer, uint count, out uint read, IntPtr overlapped);
    [LibraryImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static unsafe partial bool WriteFile(SafePipeHandle handle, byte* buffer, uint count, out uint written, IntPtr overlapped);
    [LibraryImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool GetNamedPipeClientProcessId(SafePipeHandle handle, out uint processId);

    [LibraryImport("advapi32.dll", SetLastError = true)]
    private static partial uint GetSecurityInfo(SafePipeHandle handle, uint objectType, uint securityInfo,
        out IntPtr owner, out IntPtr group, out IntPtr dacl, out IntPtr sacl, out IntPtr securityDescriptor);
    [LibraryImport("advapi32.dll", SetLastError = true)]
    private static partial uint GetSecurityDescriptorLength(IntPtr securityDescriptor);
    [LibraryImport("kernel32.dll")]
    private static partial IntPtr LocalFree(IntPtr memory);
}
