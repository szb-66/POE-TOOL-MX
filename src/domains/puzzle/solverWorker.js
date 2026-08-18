import { solvePuzzle } from './solver.js'

self.onmessage = ({ data }) => {
  const requestId = Number(data?.requestId)
  try {
    self.postMessage({ requestId, result: solvePuzzle(data?.input) })
  } catch (error) {
    self.postMessage({ requestId, error: error?.message || String(error) })
  }
}
