export const STASH_GRID_CALIBRATION_KEYS = Object.freeze(['root', 'folder'])

export function normalizeStashGridRegion(value) {
  const region = value?.region || value
  const [left, top, right, bottom] = ['left', 'top', 'right', 'bottom'].map(key => Number(region?.[key]))
  if (![left, top, right, bottom].every(Number.isFinite) || right <= left || bottom <= top) return null
  return {
    left, top, right, bottom,
    displayId: String(value?.displayId || ''),
    scaleFactor: Number.isFinite(Number(value?.scaleFactor)) ? Number(value.scaleFactor) : 1,
    capturedAt: String(value?.capturedAt || '')
  }
}

export function normalizeStashGridCalibration(value = {}) {
  return {
    root: normalizeStashGridRegion(value.root) || normalizeStashGridRegion(value.normal) || normalizeStashGridRegion(value.quad),
    folder: normalizeStashGridRegion(value.folder) || normalizeStashGridRegion(value.folderNormal) || normalizeStashGridRegion(value.folderQuad)
  }
}

export function migrateStashGridCalibration(shared, legacy) {
  const current = normalizeStashGridCalibration(shared)
  const previous = normalizeStashGridCalibration(legacy)
  return { root: current.root || previous.root, folder: current.folder || previous.folder }
}

