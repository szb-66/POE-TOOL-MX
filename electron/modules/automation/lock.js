export class AutomationLock {
  constructor() {
    this.owner = ''
    this.listeners = new Set()
  }

  acquire(owner) {
    const normalized = String(owner || '')
    if (!normalized) return { success: false, owner: this.owner, error: '自动化所有者不能为空' }
    if (this.owner && this.owner !== normalized) {
      return { success: false, owner: this.owner, error: `另一项自动化正在运行：${this.owner}` }
    }
    this.owner = normalized
    this.publish()
    return { success: true, owner: this.owner }
  }

  release(owner) {
    if (!owner || this.owner === String(owner)) {
      this.owner = ''
      this.publish()
    }
    return { success: true, owner: this.owner }
  }

  getState() {
    return { locked: Boolean(this.owner), owner: this.owner }
  }

  subscribe(listener) {
    this.listeners.add(listener)
    listener(this.getState())
    return () => this.listeners.delete(listener)
  }

  publish() {
    const state = this.getState()
    for (const listener of this.listeners) listener(state)
  }
}
