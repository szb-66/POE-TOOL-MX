import { spawn, execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { summarizeStartupTrace } from './startupMetrics.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const execFileAsync = promisify(execFile)
const args = process.argv.slice(2)
const scenario = args.find(value => value.startsWith('--scenario='))?.split('=')[1] || 'process-restart'
const count = Number(args.find(value => value.startsWith('--runs='))?.split('=')[1] || (scenario === 'boot-first' ? 1 : 3))
const timeoutMs = 120000

async function runSession(runId, repeats = 1) {
  const startedAt = Date.now()
  const child = spawn(process.execPath, [
    path.join(root, 'scripts/dev.js'), '--diagnostic-exit-after-interactive',
    '--diagnostic-exit-on-unrecoverable', '--diagnostic-repeat=' + repeats
  ], {
    cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, POE_STARTUP_RUN_ID: runId, POE_STARTUP_STARTED_AT: String(startedAt) }
  })
  let output = ''
  const consume = chunk => {
    output = (output + String(chunk)).slice(-16000)
    process.stdout.write(chunk)
  }
  child.stdout.on('data', consume)
  child.stderr.on('data', consume)
  let timedOut = false
  let terminationError = null
  const exitCode = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      timedOut = true
      // Only this benchmark's own child tree; never search for or stop other instances.
      const stop = process.platform === 'win32'
        ? execFileAsync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true })
        : Promise.resolve(child.kill())
      void stop.catch(error => { terminationError = String(error.message) })
    }, timeoutMs * repeats)
    child.once('error', error => { clearTimeout(timer); reject(error) })
    child.once('close', code => { clearTimeout(timer); resolve(code) })
  })
  const runs = []
  for (let index = 1; index <= repeats; index += 1) {
    const id = index === 1 ? runId : runId + '-' + index
    const tracePath = path.join(os.tmpdir(), 'poe-startup-' + id + '.jsonl')
    let events = []
    try {
      const lines = (await readFile(tracePath, 'utf8')).trim().split(/\r?\n/)
      events = lines.flatMap(line => { try { return [JSON.parse(line)] } catch { return [] } })
    } catch { /* Missing trace is reported as an incomplete run. */ }
    runs.push({ ...summarizeStartupTrace(events), runId: id, tracePath })
  }
  return { exitCode, timedOut, terminationError, runs, output: exitCode === 0 && !timedOut ? undefined : output }
}

async function main() {
  if (!['boot-first', 'process-restart', 'electron-restart'].includes(scenario)) throw new Error('未知启动场景')
  if (!Number.isInteger(count) || count < 1 || count > 9 || (scenario === 'boot-first' && count !== 1)) {
    throw new Error('次数应为 1–9，boot-first 只能采集一次')
  }
  const report = {
    scenario,
    bootFirstVerified: false,
    note: scenario === 'boot-first' ? '用户标记的电脑重启后首次样本；脚本不会重启电脑，也不能证明系统文件缓存为空。' : '普通进程重启样本，不代表电脑重启后的首次启动。',
    sessions: []
  }
  const baseId = String(Date.now()) + '-' + process.pid
  const reportPath = path.join(os.tmpdir(), 'poe-startup-report-' + baseId + '.json')
  try {
    if (scenario === 'electron-restart') {
      const session = await runSession(baseId, count + 1)
      report.sessions.push(session)
      report.warmup = session.runs[0]
      report.runs = session.runs.slice(1)
    } else {
      for (let index = 1; index <= count; index += 1) {
        const session = await runSession(baseId + '-' + index)
        report.sessions.push(session)
        if (session.exitCode !== 0 || session.timedOut) break
      }
      report.runs = report.sessions.flatMap(session => session.runs)
    }
    report.passed = report.runs.length === count && report.sessions.every(session => session.exitCode === 0 && !session.timedOut) &&
      report.runs.every(run => run.complete && run.budget.window && run.budget.interactive)
    if (!report.passed) process.exitCode = 1
  } catch (error) {
    report.error = String(error.stack || error)
    process.exitCode = 1
  } finally {
    await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8')
    console.log(JSON.stringify({ reportPath, scenario, passed: report.passed, runs: report.runs }, null, 2))
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
