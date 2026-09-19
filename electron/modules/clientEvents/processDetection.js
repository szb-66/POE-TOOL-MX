import { execFile } from 'node:child_process'

export const PROCESS_PROBE_TIMEOUT_MS = 10000
const messages = {
  timeout: '游戏进程查询超时（10 秒），请稍后重新开始',
  spawn: '无法启动 PowerShell 查询游戏进程，请检查系统环境后重试',
  execution: '游戏进程查询命令执行失败，请稍后重新开始',
  parse: '游戏进程查询结果无法解析，请稍后重新开始',
  unknown: '游戏进程探测暂不可用，请稍后重新开始'
}
export class ProcessProbeError extends Error {
  constructor(code = 'unknown', { elapsedMs = 0, exitCode = null, signal = null } = {}) {
    super(messages[code] || messages.unknown)
    this.name = 'ProcessProbeError'
    this.code = code
    this.elapsedMs = elapsedMs
    this.exitCode = exitCode
    this.signal = signal
  }
}

function queryJson(command, execFileImpl, parse) {
  const started = performance.now()
  return new Promise((resolve, reject) => {
    const fail = (code, error) => reject(new ProcessProbeError(code, {
      elapsedMs: Math.round(performance.now() - started),
      exitCode: error?.code ?? null, signal: error?.signal ?? null
    }))
    try {
      execFileImpl('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command],
        { windowsHide: true, timeout: PROCESS_PROBE_TIMEOUT_MS }, (error, output) => {
          if (error) return fail(error.killed ? 'timeout' : typeof error.code === 'string' && error.syscall?.startsWith('spawn') ? 'spawn' : 'execution', error)
          try { resolve(parse(JSON.parse(String(output)))) }
          catch { fail('parse') }
        })
    } catch (error) { fail('spawn', error) }
  })
}

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
  return queryJson(command, execFileImpl, value => {
    const entries = Array.isArray(value) ? value : [value]
    if (entries.some(item => !Number.isInteger(item?.id) || item.id <= 0)) throw new Error('invalid sessions')
    return entries.map(item => ({ id: item.id, startedAt: Number.isFinite(Date.parse(item.startedAt)) ? item.startedAt : null }))
  })
}

// Independent PID presence check: no StartTime access and no focus inference.
export function detectClientProcessExists(processId, { platform = process.platform, execFileImpl = execFile } = {}) {
  if (platform !== 'win32' || !Number.isInteger(processId) || processId <= 0) return Promise.resolve(null)
  const command = `try { $null = Get-Process -Id ${processId} -ErrorAction Stop; '{"exists":true}' } catch { if ($_.FullyQualifiedErrorId -like 'NoProcessFoundForGivenId,*') { '{"exists":false}' } else { exit 1 } }`
  return queryJson(command, execFileImpl, value => {
    if (typeof value?.exists !== 'boolean') throw new Error('invalid presence')
    return value.exists
  })
}
