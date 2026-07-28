export const CHAOS_GRID_CALIBRATION_KEYS = Object.freeze([
  'normal',
  'quad',
  'folderNormal',
  'folderQuad'
])

export const CHAOS_GRID_LAYOUT_LABELS = Object.freeze({
  normal: '根目录普通仓库',
  quad: '根目录大型仓库',
  folderNormal: '文件夹普通仓库',
  folderQuad: '文件夹大型仓库'
})

export function isFolderStashTab(tab) {
  return Boolean(tab?.inFolder || tab?.parent || tab?.folder)
}

export function stashCalibrationKey(tab) {
  const isQuad = (tab?.tabType || tab?.type) === 'quad' || Number(tab?.columns) === 24
  if (isFolderStashTab(tab)) return isQuad ? 'folderQuad' : 'folderNormal'
  return isQuad ? 'quad' : 'normal'
}

export function resolveStashGridLayout(tab, calibration = {}) {
  const calibrationKey = stashCalibrationKey(tab)
  return {
    calibrationKey,
    columns: calibrationKey === 'quad' || calibrationKey === 'folderQuad' ? 24 : 12,
    region: calibration?.[calibrationKey] || null
  }
}

export function requiredCalibrationKeys(tabs = []) {
  return [...new Set((Array.isArray(tabs) ? tabs : []).map(stashCalibrationKey))]
}

export function missingCalibrationKeys(tabs = [], calibration = {}) {
  return requiredCalibrationKeys(tabs).filter((key) => !calibration?.[key])
}
