export class BagSessionController {
  constructor() {
    this.ready = false
    this.foreground = false
    this.locked = false
    this.stashing = false
  }

  setReady(ready, foreground = true, immediateStash = true) {
    this.ready = Boolean(ready)
    this.foreground = Boolean(foreground)
    if (!this.ready) {
      if (!this.stashing) this.locked = false
      return false
    }
    if (!this.foreground) return false
    if (this.locked || this.stashing) return false
    if (!immediateStash) return false
    this.locked = true
    return true
  }

  beginAutomatic() {
    if (!this.ready || !this.foreground || this.stashing) return { success: false, error: '界面未就绪、游戏不在前台或入库正在进行' }
    this.locked = true
    this.stashing = true
    return { success: true }
  }

  beginManual() {
    if (!this.ready) return { success: false, error: '仓库和背包尚未同时识别成功' }
    if (!this.foreground) return { success: false, error: '游戏窗口当前不在前台' }
    if (this.stashing) return { success: false, error: '入库正在进行中' }
    this.stashing = true
    return { success: true }
  }

  finishStash() {
    this.stashing = false
  }

  reset() {
    this.ready = false
    this.foreground = false
    this.locked = false
    this.stashing = false
  }
}

export const createEventLineParser = (onEvent, onLog = () => {}) => {
  let buffer = ''
  return (chunk) => {
    buffer += String(chunk)
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('EVENT ')) {
        if (line.trim()) onLog(line)
        continue
      }
      try {
        onEvent(JSON.parse(line.slice(6)))
      } catch {
        onLog(line)
      }
    }
  }
}

export const describeDetectionExit = ({ code, terminalReason = '', stderr = '', spawnError = '' } = {}) => {
  const detail = String(terminalReason || spawnError || stderr || '').trim()
  if (detail) return detail
  if (code === 0) return 'process-ended'
  return Number.isInteger(code) ? `检测进程异常退出（退出码 ${code}）` : '检测进程异常退出'
}

export const waitForDetectionStartup = (child, { timeoutMs = 5000, getFailureReason = () => '' } = {}) => {
  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      child.stdout?.removeListener('data', parseStartupEvent)
      child.removeListener('error', handleError)
      child.removeListener('close', handleClose)
      if (error) reject(error)
      else resolve()
    }
    const parser = createEventLineParser((event) => {
      if (event.event === 'detection-state') finish()
      else if (event.event === 'detection-error') finish(new Error(event.reason || '检测器启动失败'))
    })
    const parseStartupEvent = (chunk) => parser(chunk)
    const handleError = (error) => finish(new Error(error?.message || '检测进程启动失败'))
    const handleClose = (code) => finish(new Error(getFailureReason(code) || describeDetectionExit({ code })))
    const timer = setTimeout(() => finish(new Error('检测进程启动超时，未收到运行状态')), timeoutMs)

    child.stdout?.on('data', parseStartupEvent)
    child.once('error', handleError)
    child.once('close', handleClose)
  })
}
