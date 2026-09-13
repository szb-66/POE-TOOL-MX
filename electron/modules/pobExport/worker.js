import { parentPort, workerData } from 'node:worker_threads'
import { serializePobError } from './errors.js'
// Third-party converters can log raw input on failure. Keep it inside this worker.
console.log = console.error = () => {}
try {
  const { convertBuild } = await import('./converter.js')
  parentPort.postMessage({ result: convertBuild(workerData) })
} catch (error) {
  parentPort.postMessage({ error: serializePobError(error) })
}
