import { execFile } from 'node:child_process'
import { deriveClientLogPath } from './settingsRepository.js'

const COMMAND = String.raw`
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$names = @('PathOfExile.exe','PathOfExile_x64.exe','PathOfExileSteam.exe','PathOfExile_x64Steam.exe','PathOfExileEGS.exe','PathOfExile_x64EGS.exe')
$game = Get-CimInstance Win32_Process | Where-Object { $names -contains $_.Name } | Select-Object -First 1
if (-not $game) { exit 0 }
$executablePath = [string]$game.ExecutablePath
if ([string]::IsNullOrWhiteSpace($executablePath)) {
  $nativeSource = @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class PoeProcessPath {
  [DllImport("kernel32.dll", SetLastError = true)]
  private static extern IntPtr OpenProcess(uint access, bool inheritHandle, int processId);
  [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
  private static extern bool QueryFullProcessImageName(IntPtr process, uint flags, StringBuilder path, ref uint size);
  [DllImport("kernel32.dll", SetLastError = true)]
  private static extern bool CloseHandle(IntPtr process);
  public static string Read(int processId) {
    IntPtr process = OpenProcess(0x1000, false, processId);
    if (process == IntPtr.Zero) return "";
    try {
      StringBuilder path = new StringBuilder(32768);
      uint size = (uint)path.Capacity;
      return QueryFullProcessImageName(process, 0, path, ref size) ? path.ToString() : "";
    } finally {
      CloseHandle(process);
    }
  }
}
'@
  try {
    Add-Type -TypeDefinition $nativeSource -ErrorAction Stop
    $executablePath = [PoeProcessPath]::Read([int]$game.ProcessId)
  } catch {
    $executablePath = ''
  }
}
if (-not [string]::IsNullOrWhiteSpace($executablePath)) { [Console]::Out.Write($executablePath) }
`

export function detectRunningClientLogPath({ platform = process.platform, execFileImpl = execFile } = {}) {
  if (platform !== 'win32') return Promise.resolve('')
  return new Promise((resolve) => {
    execFileImpl('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', COMMAND], { windowsHide: true, timeout: 3000 }, (error, stdout) => {
      resolve(error ? '' : deriveClientLogPath(String(stdout || '').trim()))
    })
  })
}
