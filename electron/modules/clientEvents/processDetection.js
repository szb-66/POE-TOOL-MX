import { execFile } from 'node:child_process'

// No window/focus inference: tasklist checks whether the known client PID exists.
export function detectClientProcesses({ platform = process.platform, execFileImpl = execFile } = {}) {
  if (platform !== 'win32') return Promise.resolve(null)
  return new Promise(resolve => {
    execFileImpl('tasklist.exe', ['/FO', 'CSV', '/NH', '/FI', 'IMAGENAME eq PathOfExile*'], { windowsHide: true, timeout: 3000 }, (error, output) => {
      if (error) return resolve(null)
      const ids = []
      for (const line of String(output).split(/\r?\n/)) {
        const match = line.match(/^"(PathOfExile(?:_x64)?(?:Steam|EGS)?\.exe)","(\d+)"/i)
        if (match) ids.push(Number(match[2]))
      }
      resolve(ids)
    })
  })
}

// Creation time prevents recycled PIDs from identifying an older game session.
export function detectClientProcessSessions({ platform = process.platform, execFileImpl = execFile } = {}) {
  if (platform !== 'win32') return Promise.resolve(null)
  const command = `[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); @(Get-Process -Name 'PathOfExile*' -ErrorAction SilentlyContinue | ForEach-Object { try { @{ id = $_.Id; startedAt = $_.StartTime.ToUniversalTime().ToString('o') } } catch {} }) | ConvertTo-Json -Compress`
  return new Promise(resolve => {
    execFileImpl('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { windowsHide: true, timeout: 3000 }, (error, output) => {
      if (error) return resolve(null)
      try {
        const value = JSON.parse(String(output || '[]'))
        resolve((Array.isArray(value) ? value : [value]).filter(item => Number.isInteger(item?.id) && Number.isFinite(Date.parse(item.startedAt))))
      } catch { resolve(null) }
    })
  })
}
