import { execFile, spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { promisify } from 'node:util'
import { mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { summarizeStartupRuns } from './startupMetrics.js'

const require = createRequire(import.meta.url)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const electronPath = require('electron')
const electronMainPath = path.join(root, 'electron/main.js')
const viteBinPath = path.join(root, 'node_modules/vite/bin/vite.js')
const devServerUrl = 'http://localhost:3000'
const eventPrefix = '@@POE_STARTUP@@'
const timeoutMs = 90000
const execFileAsync = promisify(execFile)

function isProcessAlive(processId) {
  try {
    process.kill(processId, 0)
    return true
  } catch {
    return false
  }
}

function stripAnsi(value) {
  return value.replace(/\x1B\[[0-9;]*m/g, '')
}

async function closeOldDevelopmentProcesses() {
  if (process.platform !== 'win32') return
  const escapedMainPath = electronMainPath.replaceAll("'", "''")
  const query = `@(Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'electron.exe' -and $_.CommandLine -like '*${escapedMainPath}*' } | Select-Object -ExpandProperty ProcessId) | ConvertTo-Json -Compress`
  const { stdout } = await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    query
  ], { windowsHide: true })
  const parsed = JSON.parse(stdout.trim() || '[]')
  const processIds = Array.isArray(parsed) ? parsed : [parsed]
  for (const processId of processIds.filter(Number.isInteger)) {
    try {
      await execFileAsync('taskkill.exe', ['/PID', String(processId), '/T', '/F'], { windowsHide: true })
    } catch (error) {
      if (isProcessAlive(processId)) throw error
    }
  }
  if (processIds.length) await new Promise(resolve => setTimeout(resolve, 500))
}

function elapsed(startedAt, timestamp) {
  return Math.max(0, Date.parse(timestamp) - startedAt)
}

async function runElectron(label, run, viteReadyMs) {
  const spawnedAt = Date.now()
  const events = []
  const child = spawn(electronPath, [
    electronMainPath,
    '--diagnostic-startup-json',
    '--diagnostic-exit-after-dashboard-ready'
  ], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      VITE_DEV_SERVER_URL: devServerUrl
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })

  const createConsumer = () => {
    let buffer = ''
    return chunk => {
      buffer += String(chunk)
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ''
      for (const line of lines) {
        const marker = line.indexOf(eventPrefix)
        if (marker < 0) continue
        try { events.push(JSON.parse(line.slice(marker + eventPrefix.length))) } catch {}
      }
    }
  }
  child.stdout.on('data', createConsumer())
  child.stderr.on('data', createConsumer())

  const electronLaunchMs = await new Promise((resolve, reject) => {
    const onError = error => reject(error)
    child.once('error', onError)
    child.once('spawn', () => {
      child.off('error', onError)
      resolve(Date.now() - spawnedAt)
    })
  })

  const exitCode = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`${label} ${run} 超过 ${timeoutMs / 1000} 秒`))
    }, timeoutMs)
    child.once('error', error => { clearTimeout(timer); reject(error) })
    child.once('close', code => { clearTimeout(timer); resolve(code ?? 0) })
  })
  if (exitCode !== 0) throw new Error(`${label} ${run} Electron 退出码 ${exitCode}`)

  const mounted = events.find(event => event.phase === 'renderer' && event.outcome === 'succeeded')
  const dashboard = events.find(event => event.phase === 'dashboard' && event.outcome === 'succeeded')
  if (!mounted || !dashboard) throw new Error(`${label} ${run} 缺少启动里程碑`)
  return {
    run,
    viteReadyMs,
    electronLaunchMs,
    shellMs: elapsed(spawnedAt, mounted.timestamp),
    dashboardMs: elapsed(spawnedAt, dashboard.timestamp),
    events
  }
}

async function stopDevelopmentServer(child) {
  if (child.exitCode !== null) return
  const closed = new Promise(resolve => child.once('close', resolve))
  child.kill()
  await Promise.race([
    closed,
    new Promise(resolve => setTimeout(resolve, 3000))
  ])
  if (child.exitCode === null) {
    try {
      await execFileAsync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true })
    } catch (error) {
      if (isProcessAlive(child.pid)) throw error
    }
  }
}

async function createDevelopmentServer() {
  const startedAt = Date.now()
  const output = []
  let spawnError = null
  const child = spawn(process.execPath, [
    viteBinPath,
    '--config', path.join(root, 'vite.config.js'),
    '--mode', 'development',
    '--host', 'localhost',
    '--port', '3000',
    '--strictPort'
  ], {
    cwd: root,
    env: { ...process.env, NODE_ENV: 'development' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  })
  child.stdout.on('data', chunk => output.push(String(chunk)))
  child.stderr.on('data', chunk => output.push(String(chunk)))
  child.once('error', error => { spawnError = error })

  const deadline = startedAt + 30000
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError
    if (child.exitCode !== null) throw new Error(`Vite 提前退出：${output.join('').trim()}`)
    try {
      if (!stripAnsi(output.join('')).includes('Local:')) throw new Error('Vite 尚未宣告就绪')
      const response = await fetch(devServerUrl, { signal: AbortSignal.timeout(500) })
      if (response.ok) {
        return {
          close: () => stopDevelopmentServer(child),
          viteReadyMs: Date.now() - startedAt
        }
      }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 25))
  }
  await stopDevelopmentServer(child)
  throw new Error(`Vite 在 30 秒内未就绪：${output.join('').trim()}`)
}

async function benchmarkCold() {
  const runs = []
  for (let run = 1; run <= 3; run += 1) {
    const server = await createDevelopmentServer()
    try { runs.push(await runElectron('cold', run, server.viteReadyMs)) } finally { await server.close() }
  }
  return summarizeStartupRuns(runs)
}

async function benchmarkWarm() {
  const server = await createDevelopmentServer()
  const runs = []
  try {
    for (let run = 1; run <= 3; run += 1) runs.push(await runElectron('warm', run, server.viteReadyMs))
  } finally {
    await server.close()
  }
  return summarizeStartupRuns(runs)
}

async function main() {
  await closeOldDevelopmentProcesses()
  const startedAt = new Date().toISOString()
  const cold = await benchmarkCold()
  const warm = await benchmarkWarm()
  const report = { startedAt, baselineMs: 40600, cold, warm }
  const directory = path.join(os.tmpdir(), 'poe-cn-helper-startup')
  await mkdir(directory, { recursive: true })
  const reportPath = path.join(directory, `startup-${startedAt.replace(/[:.]/g, '-')}.json`)
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify({ reportPath, cold: { ...cold, runs: undefined }, warm: { ...warm, runs: undefined } }, null, 2))
  if (!Object.values(cold.budget).every(Boolean)) process.exitCode = 1
}

main().catch(error => {
  console.error(error?.stack || error)
  process.exitCode = 1
})
