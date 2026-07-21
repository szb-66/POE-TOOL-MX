import { randomUUID } from 'node:crypto'
import { Worker } from 'node:worker_threads'
import { fileURLToPath } from 'node:url'

const workerFile = fileURLToPath(new URL('./plannerWorker.js', import.meta.url))

export class CraftingTaskManager {
  constructor() { this.tasks = new Map() }

  start({ request, dataset, priceMap, priceTime, options = {}, onEvent }) {
    const taskId = randomUUID()
    const worker = new Worker(workerFile)
    const task = { worker, onEvent }
    this.tasks.set(taskId, task)
    worker.on('message', (message) => {
      if (message.taskId !== taskId || !this.tasks.has(taskId)) return
      onEvent?.(message)
      if (['complete', 'error', 'cancelled'].includes(message.type)) this.finish(taskId)
    })
    worker.on('error', (error) => {
      if (!this.tasks.has(taskId)) return
      onEvent?.({ type: 'error', taskId, error: error.message })
      this.finish(taskId)
    })
    worker.postMessage({ type: 'plan', taskId, request, dataset, priceMap, priceTime, options })
    return taskId
  }

  finish(taskId) {
    const task = this.tasks.get(taskId)
    if (!task) return false
    this.tasks.delete(taskId)
    task.worker.terminate().catch(() => {})
    return true
  }

  cancel(taskId) {
    const task = this.tasks.get(taskId)
    if (!task) return false
    task.worker.postMessage({ type: 'cancel', taskId })
    setTimeout(() => this.finish(taskId), 250)
    task.onEvent?.({ type: 'cancelled', taskId })
    return true
  }

  cleanup() {
    for (const taskId of [...this.tasks.keys()]) this.finish(taskId)
  }
}
