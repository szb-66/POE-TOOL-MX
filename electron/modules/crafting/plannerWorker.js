import { parentPort } from 'node:worker_threads'
import { normalizeCraftingDataset } from './model.js'
import { optimizeCrafting } from './optimizer.js'

const abortSignals = new Map()

parentPort.on('message', async (message) => {
  if (message.type === 'cancel') {
    const signal = abortSignals.get(message.taskId)
    if (signal) signal.aborted = true
    return
  }
  if (message.type !== 'plan') return
  const signal = { aborted: false }
  abortSignals.set(message.taskId, signal)
  try {
    const dataset = normalizeCraftingDataset(message.dataset)
    const result = await optimizeCrafting(message.request, dataset, message.priceMap, {
      ...message.options, signal, priceTime: message.priceTime,
      onProgress: (progress) => parentPort.postMessage({ type: 'progress', taskId: message.taskId, progress }),
      onResult: (resultEvent) => parentPort.postMessage({ type: 'result', taskId: message.taskId, result: resultEvent })
    })
    parentPort.postMessage({ type: 'complete', taskId: message.taskId, result })
  } catch (error) {
    parentPort.postMessage({ type: signal.aborted ? 'cancelled' : 'error', taskId: message.taskId, error: error.message })
  } finally {
    abortSignals.delete(message.taskId)
  }
})
