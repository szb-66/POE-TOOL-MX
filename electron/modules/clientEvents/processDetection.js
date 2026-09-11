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
  const command = `[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); $probeErrors = @(); $clients = @(Get-Process -Name 'PathOfExile*' -ErrorAction SilentlyContinue -ErrorVariable probeErrors); if ($probeErrors.Count) { exit 1 }; $sessions = @($clients | ForEach-Object { $created = $null; try { $created = $_.StartTime.ToUniversalTime().ToString('o') } catch {}; @{ id = $_.Id; startedAt = $created } }); ConvertTo-Json -InputObject $sessions -Compress`
  return new Promise(resolve => {
    execFileImpl('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { windowsHide: true, timeout: 3000 }, (error, output) => {
      if (error) return resolve(null)
      try {
        const value = JSON.parse(String(output))
        const entries = Array.isArray(value) ? value : [value]
        if (entries.some(item => !Number.isInteger(item?.id) || item.id <= 0)) return resolve(null)
        resolve(entries.map(item => ({ id: item.id, startedAt: Number.isFinite(Date.parse(item.startedAt)) ? item.startedAt : null })))
      } catch { resolve(null) }
    })
  })
}

// Independent PID presence check: no StartTime access and no focus inference.
export function detectClientProcessExists(processId, { platform = process.platform, execFileImpl = execFile } = {}) {
  if (platform !== 'win32' || !Number.isInteger(processId) || processId <= 0) return Promise.resolve(null)
  const command = `try { $null = Get-Process -Id ${processId} -ErrorAction Stop; '{"exists":true}' } catch { if ($_.FullyQualifiedErrorId -like 'NoProcessFoundForGivenId,*') { '{"exists":false}' } else { exit 1 } }`
  return new Promise(resolve => {
    execFileImpl('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { windowsHide: true, timeout: 3000 }, (error, output) => {
      if (error) return resolve(null)
      try { const value = JSON.parse(String(output)); resolve(typeof value?.exists === 'boolean' ? value.exists : null) }
      catch { resolve(null) }
    })
  })
}
