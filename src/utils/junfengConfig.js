export const JUNFENG_GRID = Object.freeze({ columns: 12, rows: 11 })
export const JUNFENG_LABELS = Object.freeze(['highlighted', 'dimmed', 'empty'])
export const JUNFENG_HIGHLIGHT_THRESHOLD = 0.995
export const JUNFENG_CALIBRATION_SIMILARITY = 0.97

function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function normalizeJunfengRegion(value) {
  const region = value?.region || value
  const left = finite(region?.left)
  const top = finite(region?.top)
  const right = finite(region?.right)
  const bottom = finite(region?.bottom)
  if (right <= left || bottom <= top) return null
  return {
    left, top, right, bottom,
    displayId: String(value?.displayId || ''),
    scaleFactor: Math.max(0.1, finite(value?.scaleFactor, 1)),
    displayPhysicalBounds: value?.displayPhysicalBounds ? { ...value.displayPhysicalBounds } : null,
    capturedAt: String(value?.capturedAt || '')
  }
}

export function normalizeJunfengSettings(value = {}) {
  return {
    enabled: Boolean(value.enabled),
    grid: { ...JUNFENG_GRID },
    gridRegion: normalizeJunfengRegion(value.gridRegion),
    highlightThreshold: JUNFENG_HIGHLIGHT_THRESHOLD,
    calibrationSimilarity: JUNFENG_CALIBRATION_SIMILARITY
  }
}

export function validateJunfengSettings(settings, templates = {}) {
  const config = normalizeJunfengSettings(settings)
  if (!templates.junfengRewardTitle) return '请先框选君锋镇奖励标题'
  if (!config.gridRegion) return '请先框选完整的 12×11 奖励区域'
  return ''
}
