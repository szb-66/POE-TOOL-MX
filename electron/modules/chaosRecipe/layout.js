export const CHAOS_GRID_CALIBRATION_KEYS = Object.freeze([
  'root',
  'folder'
])

export const CHAOS_GRID_LAYOUT_LABELS = Object.freeze({
  root: '文件夹外仓库',
  folder: '文件夹内仓库'
})

export function isFolderStashTab(tab) {
  return Boolean(tab?.inFolder || tab?.parent || tab?.folder)
}

export function stashCalibrationKey(tab) {
  return isFolderStashTab(tab) ? 'folder' : 'root'
}

export function resolveStashGridLayout(tab, calibration = {}) {
  const calibrationKey = stashCalibrationKey(tab)
  const isQuad = (tab?.tabType || tab?.type) === 'quad' || Number(tab?.columns) === 24
  return {
    calibrationKey,
    columns: isQuad ? 24 : 12,
    region: calibration?.[calibrationKey] || null
  }
}

export function requiredCalibrationKeys(tabs = []) {
  return [...new Set((Array.isArray(tabs) ? tabs : []).map(stashCalibrationKey))]
}

export function missingCalibrationKeys(tabs = [], calibration = {}) {
  return requiredCalibrationKeys(tabs).filter((key) => !calibration?.[key])
}
