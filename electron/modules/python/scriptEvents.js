/**
 * Purpose: 解析制作脚本通过标准输出发送的结构化事件。
 * Inputs: 单行标准输出文本。
 * Outputs: 事件对象或 null。
 */
export function parseScriptEventLine(line) {
  const text = String(line || '').trim()
  if (!text.startsWith('EVENT ')) return null
  try {
    const event = JSON.parse(text.slice(6))
    return event && typeof event.event === 'string' ? event : null
  } catch {
    return null
  }
}

const STARTUP_FAILURE_EVENTS = new Set([
  'crafting-startup-failed',
  'stash-tab-selection-failed',
  'currency-preflight-failed'
])

export function waitForScriptStartup(child, {
  timeoutMs = 180000,
  getFailureReason = () => ''
} = {}) {
  return new Promise((resolve, reject) => {
    let settled = false
    let lineBuffer = ''

    const cleanup = () => {
      clearTimeout(timer)
      child.stdout?.removeListener('data', handleStdout)
      child.removeListener('error', handleError)
      child.removeListener('close', handleClose)
    }
    const finish = (error, event = null) => {
      if (settled) return
      settled = true
      cleanup()
      if (error) reject(error)
      else resolve(event)
    }
    const handleStdout = (chunk) => {
      lineBuffer += String(chunk)
      const lines = lineBuffer.split(/\r?\n/)
      lineBuffer = lines.pop() || ''
      for (const line of lines) {
        const event = parseScriptEventLine(line)
        if (event?.event === 'crafting-startup-succeeded') {
          finish(null, event)
          return
        }
        if (STARTUP_FAILURE_EVENTS.has(event?.event)) {
          finish(new Error(event.reason || '制作脚本启动门禁失败'))
          return
        }
      }
    }
    const handleError = (error) => {
      finish(new Error(error?.message || '制作进程启动失败'))
    }
    const handleClose = (code) => {
      const reason = String(getFailureReason(code) || '').trim()
      finish(new Error(reason || `制作进程在启动完成前已退出（退出码 ${code ?? '未知'}）`))
    }
    const timer = setTimeout(() => {
      finish(new Error('制作脚本启动超时，仓库选择或通货预检未完成'))
    }, timeoutMs)

    child.stdout?.on('data', handleStdout)
    child.once('error', handleError)
    child.once('close', handleClose)
  })
}
