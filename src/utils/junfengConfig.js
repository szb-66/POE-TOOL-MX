import { resolveCaptureDisplay } from './bagConfig.js'

export const JUNFENG_GRID = Object.freeze({ columns: 12, rows: 11 })
export const JUNFENG_LABELS = Object.freeze(['highlighted', 'dimmed', 'empty'])
export const JUNFENG_HIGHLIGHT_THRESHOLD = 0.995
export const JUNFENG_CALIBRATION_SIMILARITY = 0.97

function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function hasSamePhysicalBounds(display, saved) {
  const current = display?.physicalBounds || display?.displayPhysicalBounds
  if (!current) return false
  return Number(current.x ?? current.left) === Number(saved.x ?? saved.left) &&
    Number(current.y ?? current.top) === Number(saved.y ?? saved.top) &&
    Number(current.width) === Number(saved.width) &&
    Number(current.height) === Number(saved.height)
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

export function validateJunfengGridEnvironment(value, displays = []) {
  const region = normalizeJunfengRegion(value)
  if (!region) return { ready: false, reason: '请先框选完整的 12×11 奖励区域' }
  if (!region.displayId) return { ready: true, reason: '' }

  const savedBounds = region.displayPhysicalBounds
  const exact = displays.find(display => String(display.id) === region.displayId)
  if (!savedBounds) {
    if (!exact) return { ready: false, reason: '奖励网格所在显示器已变化，请重新框选' }
    if (Math.abs(Number(exact.scaleFactor) - region.scaleFactor) > 0.01) {
      return { ready: false, reason: '奖励网格所在显示器 DPI 已变化，请重新框选' }
    }
    return { ready: true, reason: '' }
  }

  const display = resolveCaptureDisplay({
    displayId: region.displayId,
    scaleFactor: region.scaleFactor,
    displayPhysicalSize: { width: savedBounds.width, height: savedBounds.height },
    selectedRegion: region
  }, displays.filter(display => hasSamePhysicalBounds(display, savedBounds)), 0.01)
  if (display) return { ready: true, reason: '' }
  if (!exact) return { ready: false, reason: '奖励网格所在显示器已变化，请重新框选' }
  if (Math.abs(Number(exact.scaleFactor) - region.scaleFactor) > 0.01) {
    return { ready: false, reason: '奖励网格所在显示器 DPI 已变化，请重新框选' }
  }
  return { ready: false, reason: '奖励网格所在显示器分辨率或位置已变化，请重新框选' }
}
