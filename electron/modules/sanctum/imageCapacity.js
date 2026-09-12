// Leases cover decoded crops until both text and icon analysis have finished.
export class SanctumImageCapacity {
  constructor({count = 8, bytes = 128 * 1024 * 1024} = {}) {
    this.limit = count; this.budget = bytes; this.count = 0; this.bytes = 0; this.waiters = new Set()
  }
  async acquire(bytes, signal) {
    if (!Number.isSafeInteger(bytes) || bytes < 1 || bytes > this.budget) throw new Error('冻结图片超过缓存容量')
    while (true) {
      signal.throwIfAborted()
      if (this.closed) throw new Error('图片识别通道已关闭')
      if (this.count < this.limit && this.bytes + bytes <= this.budget) {
        this.count++; this.bytes += bytes
        let released = false
        return () => {
          if (released) return
          released = true; this.count--; this.bytes -= bytes
          for (const wake of this.waiters) wake()
        }
      }
      await new Promise((resolve, reject) => {
        const finish = error => { this.waiters.delete(wake); signal.removeEventListener('abort', abort); error ? reject(error) : resolve() }
        const wake = () => finish(), abort = () => finish(signal.reason)
        this.waiters.add(wake); signal.addEventListener('abort', abort, {once:true})
        if (signal.aborted) abort()
      })
    }
  }
  close() { this.closed = true; for (const wake of this.waiters) wake() }
}
