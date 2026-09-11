import { parentPort, workerData } from 'node:worker_threads'
import { solveSanctumLoadouts } from './loadout.js'

const stop = new Int32Array(workerData.cancelBuffer)
try {
  parentPort.postMessage({ result: solveSanctumLoadouts(workerData.input, { cancelled: () => Atomics.load(stop, 0) !== 0 }) })
} catch (error) {
  parentPort.postMessage({ error: error.message })
}
