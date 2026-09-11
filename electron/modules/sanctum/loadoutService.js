import { Worker } from 'node:worker_threads'

export class SanctumLoadoutService {
  #active = null
  #workers = new Set()
  #closed = false

  cancel() {
    if (this.#active) Atomics.store(this.#active.cancel, 0, 1)
  }

  solve(input) {
    if (this.#closed) return Promise.reject(new Error('圣物求解服务已关闭'))
    this.cancel()
    const cancelBuffer = new SharedArrayBuffer(4)
    const worker = new Worker(new URL('./loadoutWorker.js', import.meta.url), { workerData: { input, cancelBuffer } })
    const active = { worker, cancel: new Int32Array(cancelBuffer) }
    this.#active = active
    this.#workers.add(worker)
    return new Promise((resolve, reject) => {
      let settled = false
      const finish = (error, result) => {
        if (settled) return
        settled = true
        if (this.#active === active) this.#active = null
        error ? reject(error) : resolve(result)
      }
      worker.once('message', message => finish(message.error ? new Error(message.error) : null, message.result))
      worker.once('error', error => finish(error))
      worker.once('exit', code => {
        this.#workers.delete(worker)
        if (!settled) finish(new Error(`圣物求解进程提前退出：${code}`))
      })
    })
  }

  async shutdown() {
    this.#closed = true
    this.cancel()
    await Promise.all([...this.#workers].map(worker => worker.terminate()))
  }
}
