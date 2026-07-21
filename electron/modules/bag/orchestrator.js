export class BagSessionController {
  constructor() {
    this.ready = false
    this.foreground = false
    this.locked = false
    this.stashing = false
  }

  setReady(ready, foreground = true) {
    this.ready = Boolean(ready)
    this.foreground = Boolean(foreground)
    if (!this.ready) {
      this.locked = false
      return false
    }
    if (!this.foreground) return false
    if (this.locked || this.stashing) return false
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

export function createEventLineParser(onEvent, onLog = () => {}) {
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
