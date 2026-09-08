import catalog from '../../data/mapFeasibilityData.json'
import { analyzeMapFeasibility } from './mapFeasibility.js'

self.onmessage = ({ data }) => {
  self.postMessage({ id: data.id, result: analyzeMapFeasibility({ ...data.input, catalog }) })
}
