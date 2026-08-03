export const OVERLAY_BACKGROUND_MODES = Object.freeze({
  default: 'default',
  none: 'none',
  custom: 'custom'
})

export const OVERLAY_BACKGROUND_EXTENSIONS = Object.freeze([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'ogg', 'mov'
])

const VALID_MODES = new Set(Object.values(OVERLAY_BACKGROUND_MODES))
const SUPPORTED_EXTENSIONS = new Set(OVERLAY_BACKGROUND_EXTENSIONS)
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogg', 'mov'])

export function overlayBackgroundExtension(filePath = '') {
  const cleanPath = String(filePath).split(/[?#]/, 1)[0]
  const match = cleanPath.match(/\.([^.\\/]+)$/)
  return match ? match[1].toLowerCase() : ''
}

export function isSupportedOverlayBackground(filePath) {
  return SUPPORTED_EXTENSIONS.has(overlayBackgroundExtension(filePath))
}

export function isOverlayBackgroundVideo(filePath) {
  return VIDEO_EXTENSIONS.has(overlayBackgroundExtension(filePath))
}

export function normalizeOverlaySettings(value = {}) {
  const backgroundPath = typeof value?.backgroundPath === 'string' ? value.backgroundPath.trim() : ''
  let backgroundMode = VALID_MODES.has(value?.backgroundMode)
    ? value.backgroundMode
    : (backgroundPath ? OVERLAY_BACKGROUND_MODES.custom : OVERLAY_BACKGROUND_MODES.default)

  if (backgroundMode === OVERLAY_BACKGROUND_MODES.custom && !backgroundPath) {
    backgroundMode = OVERLAY_BACKGROUND_MODES.default
  }

  return {
    backgroundMode,
    backgroundPath: backgroundMode === OVERLAY_BACKGROUND_MODES.custom ? backgroundPath : '',
    blur: Number.isFinite(Number(value?.blur)) ? Number(value.blur) : 4,
    maskOpacity: Number.isFinite(Number(value?.maskOpacity)) ? Number(value.maskOpacity) : 0.5
  }
}

export function overlayBackgroundMedia(settings = {}) {
  const normalized = normalizeOverlaySettings(settings)
  if (normalized.backgroundMode === OVERLAY_BACKGROUND_MODES.none) return 'none'
  if (normalized.backgroundMode === OVERLAY_BACKGROUND_MODES.default) return 'default'
  return isOverlayBackgroundVideo(normalized.backgroundPath) ? 'video' : 'image'
}

export function addOverlayBackgroundHistory(history = [], filePath = '', limit = 6) {
  const path = String(filePath || '').trim()
  if (!path) return Array.isArray(history) ? [...history] : []
  const items = (Array.isArray(history) ? history : []).filter(item => item?.path !== path)
  return [{ path }, ...items].slice(0, Math.max(1, Number(limit) || 6))
}

export function resolveOverlayBackgroundDrop(files, getPathForFile) {
  const droppedFiles = Array.from(files || [])
  if (droppedFiles.length !== 1) {
    return { success: false, error: { code: 'BACKGROUND_FILE_COUNT', message: '请一次拖入一个图片或视频文件' } }
  }

  let sourcePath = ''
  try {
    sourcePath = typeof getPathForFile === 'function' ? getPathForFile(droppedFiles[0]) : ''
  } catch {
    sourcePath = ''
  }
  if (!sourcePath) {
    return { success: false, error: { code: 'BACKGROUND_PATH_REQUIRED', message: '无法读取拖入文件的本地路径' } }
  }
  return { success: true, sourcePath }
}
