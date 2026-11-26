import path from 'node:path'
import { fileURLToPath } from 'node:url'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

export function resolveSlotHighlightWeightsPath({
  isPackaged = false,
  resourcesPath = process.resourcesPath || ''
} = {}) {
  return isPackaged
    ? path.join(resourcesPath, 'slot-highlight', 'weights.npz')
    : path.resolve(moduleDir, '../../../src/assets/models/slot-highlight/weights.npz')
}
