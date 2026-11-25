import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

function defaultIsProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return true
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error?.code === 'EPERM'
  }
}

export function createDevServerReadySignal({
  runId = `${Date.now()}-${process.pid}`,
  tmpDir = os.tmpdir()
} = {}) {
  const safeId = String(runId).replace(/[^a-zA-Z0-9_-]/g, '') || `${Date.now()}-${process.pid}`
  const filePath = path.join(tmpDir, `poe-dev-ready-${safeId}.json`)

  function writeState(status, reason = 'none') {
    const tempPath = `${filePath}.${process.pid}.tmp`
    const payload = JSON.stringify({ status, reason, timestamp: Date.now() })
    try {
      fs.writeFileSync(tempPath, payload, 'utf8')
      fs.renameSync(tempPath, filePath)
    } catch {
      try { fs.writeFileSync(filePath, payload, 'utf8') } catch {}
      try { fs.unlinkSync(tempPath) } catch {}
    }
  }

  return {
    filePath,
    markReady() {
      writeState('ready')
    },
    markFailed(reason = 'startup_failed') {
      writeState('failed', String(reason || 'startup_failed'))
    },
    cleanup() {
      try { fs.unlinkSync(filePath) } catch {}
    }
  }
}

function readReadyState(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.status === 'string') return parsed
  } catch {
    // 文件尚未写入完成时继续等待。
  }
  return null
}

export async function waitForDevServerReady({
  env = process.env,
  pollIntervalMs = 25,
  timeoutMs = 180000,
  isProcessAlive = defaultIsProcessAlive,
  now = Date.now
} = {}) {
  const filePath = env?.POE_DEV_SERVER_READY_FILE
  if (!filePath) return { waited: false, status: 'skipped' }

  const parentPid = Number(env?.POE_DEV_PARENT_PID)
  const checkParent = Number.isInteger(parentPid) && parentPid > 0
  const startedAt = now()
  let waited = false

  while (true) {
    const state = readReadyState(filePath)
    if (state?.status === 'ready') return { waited, status: 'ready' }
    if (state?.status === 'failed') {
      const error = new Error(`开发服务器启动失败（${state.reason || 'startup_failed'}）`)
      error.code = 'DEV_SERVER_FAILED'
      throw error
    }
    if (checkParent && !isProcessAlive(parentPid)) {
      const error = new Error('开发启动器已退出，停止等待开发服务器')
      error.code = 'DEV_LAUNCHER_EXITED'
      throw error
    }
    if (now() - startedAt >= timeoutMs) {
      const error = new Error('等待 Vite 开发服务器就绪超时')
      error.code = 'DEV_SERVER_TIMEOUT'
      throw error
    }
    waited = true
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }
}
