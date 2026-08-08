/**
 * Purpose: 在 Electron 最早启动阶段同步写入可轮转、脱敏的 JSONL 诊断事件。
 * Inputs: userDataPath；可注入文件系统、时钟、用户目录和大小限制用于测试。
 * Outputs: <userData>/logs/startup.log 与至多一个 startup.prev.log。
 * Preconditions: 应在创建 BrowserWindow 前初始化。
 * Edge cases: 目录不可写、日志被占用或轮转失败时静默降级，不阻止应用启动。
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { redactDiagnosticText } from './diagnostics.js'

const DEFAULT_MAX_LOG_BYTES = 2 * 1024 * 1024
const DEFAULT_MAX_MESSAGE_LENGTH = 4096
const SAFE_TOKEN = /^[a-z0-9][a-z0-9._-]{0,63}$/i

function safeToken(value, fallback) {
  const token = String(value ?? '')
  return SAFE_TOKEN.test(token) ? token : fallback
}

function removePreviousLog(fileSystem, previousPath) {
  try {
    if (typeof fileSystem.rmSync === 'function') fileSystem.rmSync(previousPath, { force: true })
    else if (typeof fileSystem.unlinkSync === 'function') fileSystem.unlinkSync(previousPath)
  } catch {
    // 上一份日志不存在或无法删除时由后续轮转逻辑降级处理。
  }
}

export function createStartupLogger({
  userDataPath,
  fileSystem = fs,
  now = () => new Date(),
  homeDirectory = os.homedir(),
  maxBytes = DEFAULT_MAX_LOG_BYTES,
  maxMessageLength = DEFAULT_MAX_MESSAGE_LENGTH
} = {}) {
  const directory = path.join(String(userDataPath || ''), 'logs')
  const filePath = path.join(directory, 'startup.log')
  const previousPath = path.join(directory, 'startup.prev.log')

  function rotateIfNeeded() {
    let size = 0
    try {
      size = Number(fileSystem.statSync(filePath)?.size) || 0
    } catch {
      return
    }
    if (size < maxBytes) return

    removePreviousLog(fileSystem, previousPath)
    try {
      fileSystem.renameSync(filePath, previousPath)
    } catch {
      // 文件被安全软件短暂占用时仍需限制增长；无法轮转则清空当前文件。
      try {
        fileSystem.truncateSync?.(filePath, 0)
      } catch {
        // 写入阶段会返回 false，不能让日志故障阻止应用启动。
      }
    }
  }

  function sanitizeMessage(message, error) {
    const errorText = error?.stack || error?.message || (error == null ? '' : String(error))
    const combined = [message, errorText].filter(value => value != null && value !== '').join(' | ')
    return redactDiagnosticText(combined, homeDirectory)
      .replace(/\b(token|api[_-]?key)\s*["']?\s*[:=]\s*["']?[^"'\r\n,;}&\s]+/gi, '$1=[redacted]')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxMessageLength)
  }

  function record(candidate = {}) {
    try {
      fileSystem.mkdirSync(directory, { recursive: true })
      rotateIfNeeded()
      const suppliedTimestamp = candidate.timestamp
      const parsedTimestamp = suppliedTimestamp == null ? NaN : Date.parse(suppliedTimestamp)
      const timestamp = Number.isFinite(parsedTimestamp)
        ? new Date(parsedTimestamp).toISOString()
        : now().toISOString()
      const event = {
        timestamp,
        phase: safeToken(candidate.phase, 'unknown'),
        outcome: safeToken(candidate.outcome, 'info'),
        reasonCode: safeToken(candidate.reasonCode, 'none'),
        message: sanitizeMessage(candidate.message, candidate.error)
      }
      fileSystem.appendFileSync(filePath, `${JSON.stringify(event)}\n`, 'utf8')
      return true
    } catch {
      return false
    }
  }

  return {
    directory,
    filePath,
    previousPath,
    record,
    info: (phase, message) => record({ phase, outcome: 'info', message }),
    warn: (phase, message, error) => record({ phase, outcome: 'warning', message, error }),
    error: (phase, message, error) => record({ phase, outcome: 'failed', message, error })
  }
}
