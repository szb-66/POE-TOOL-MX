import { Worker } from 'node:worker_threads'
import { PobExportError } from './errors.js'

export function convertInWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./worker.js', import.meta.url), { workerData: data })
    const timer = setTimeout(() => finish(new PobExportError('CONVERSION_FAILED', '构筑转换超时，请重试')), 60000)
    let settled = false
    function finish(error, result) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      void worker.terminate()
      if (error) reject(error)
      else resolve(result)
    }
    worker.once('message', message => message.error
      ? finish(new PobExportError(message.error.code, message.error.message, message.error.details))
      : finish(null, message.result))
    worker.once('error', () => finish(new PobExportError('CONVERSION_FAILED', '构筑转换失败，请检查角色数据后重试')))
    worker.once('exit', () => { if (!settled) finish(new PobExportError('CONVERSION_FAILED', '构筑转换进程提前退出')) })
  })
}
