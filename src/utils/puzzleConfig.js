export const PUZZLE_GRID_SIZE = Object.freeze({ columns: 6, rows: 10 })
export const ATLAS_GRID_SIZE = Object.freeze({ columns: 3, rows: 3 })
export const PUZZLE_REGION_TYPES = Object.freeze({ inventory: 'inventory', atlas: 'atlas' })
export const PUZZLE_RECOGNITION_STRENGTHS = Object.freeze(['sensitive', 'standard', 'strict'])
export const PUZZLE_INVENTORY_PAGES = Object.freeze([1, 2])
export const PUZZLE_REWARD_STRATEGIES = Object.freeze(['auto', 'balanced', 'strongbox', 'rare', 'magic', 'sulphur'])

function finite(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function normalizePuzzleRegionMetadata(value) {
  if (!value?.selectedRegion) return null
  const region = value.selectedRegion
  const selectedRegion = {
    left: Math.round(finite(region.left)),
    top: Math.round(finite(region.top)),
    right: Math.round(finite(region.right)),
    bottom: Math.round(finite(region.bottom))
  }
  if (selectedRegion.right <= selectedRegion.left || selectedRegion.bottom <= selectedRegion.top) return null
  const bounds = value.displayPhysicalBounds || {}
  return {
    displayId: String(value.displayId ?? ''),
    scaleFactor: Math.max(0.1, finite(value.scaleFactor, 1)),
    displayPhysicalBounds: {
      x: Math.round(finite(bounds.x ?? bounds.left)),
      y: Math.round(finite(bounds.y ?? bounds.top)),
      width: Math.round(finite(bounds.width)),
      height: Math.round(finite(bounds.height))
    },
    selectedRegion,
    capturedAt: String(value.capturedAt || '')
  }
}

function contains(bounds, region) {
  return region.left >= bounds.x && region.top >= bounds.y &&
    region.right <= bounds.x + bounds.width && region.bottom <= bounds.y + bounds.height
}

export function puzzleGridSize(type = PUZZLE_REGION_TYPES.inventory) {
  return type === PUZZLE_REGION_TYPES.atlas ? ATLAS_GRID_SIZE : PUZZLE_GRID_SIZE
}

export function normalizePuzzleRecognition(value = {}) {
  const strength = PUZZLE_RECOGNITION_STRENGTHS.includes(value?.strength) ? value.strength : 'standard'
  return { strength }
}

export function normalizePuzzleTabPoint(value) {
  const x = Number(value?.x)
  const y = Number(value?.y)
  return Number.isFinite(x) && Number.isFinite(y)
    ? { x: Math.round(x), y: Math.round(y) }
    : null
}

export function normalizePuzzleTabPoints(value = {}) {
  return {
    1: normalizePuzzleTabPoint(value?.[1] ?? value?.['1']),
    2: normalizePuzzleTabPoint(value?.[2] ?? value?.['2'])
  }
}

export function normalizePuzzleSettings(value = {}) {
  const inventoryRegionMetadata = normalizePuzzleRegionMetadata(
    value.inventoryRegionMetadata || value.regionMetadata
  )
  const atlasRegionMetadata = normalizePuzzleRegionMetadata(value.atlasRegionMetadata)
  return {
    inventoryRegionMetadata,
    atlasRegionMetadata,
    recognition: normalizePuzzleRecognition(value.recognition),
    inventoryTabPoints: normalizePuzzleTabPoints(value.inventoryTabPoints),
    autoProbeBorderMods: value.autoProbeBorderMods !== false,
    rewardStrategy: PUZZLE_REWARD_STRATEGIES.includes(value.rewardStrategy) ? value.rewardStrategy : 'balanced'
  }
}

export function validatePuzzleTabPoint(point, metadata, page, otherPoint = null) {
  const normalizedPoint = normalizePuzzleTabPoint(point)
  const normalizedMetadata = normalizePuzzleRegionMetadata(metadata)
  const normalizedPage = Number(page)
  if (!PUZZLE_INVENTORY_PAGES.includes(normalizedPage)) {
    return { valid: false, code: 'TAB_PAGE_INVALID', message: '仓库页码无效' }
  }
  if (!normalizedPoint) {
    return { valid: false, code: 'TAB_POINT_REQUIRED', message: `请先标定第 ${normalizedPage} 页页签坐标` }
  }
  if (!normalizedMetadata) {
    return { valid: false, code: 'REGION_REQUIRED', message: '请先框选完整的 6×10 碎片仓库区域' }
  }
  const region = normalizedMetadata.selectedRegion
  const cellHeight = (region.bottom - region.top) / PUZZLE_GRID_SIZE.rows
  const withinTabBand = normalizedPoint.x >= region.left && normalizedPoint.x <= region.right &&
    normalizedPoint.y >= region.top - cellHeight && normalizedPoint.y < region.top
  const bounds = normalizedMetadata.displayPhysicalBounds
  const withinDisplay = !bounds.width || !bounds.height || (
    normalizedPoint.x >= bounds.x && normalizedPoint.x < bounds.x + bounds.width &&
    normalizedPoint.y >= bounds.y && normalizedPoint.y < bounds.y + bounds.height
  )
  if (!withinTabBand || !withinDisplay) {
    return { valid: false, code: 'TAB_POINT_OUTSIDE_SAFE_BAND', message: `第 ${normalizedPage} 页取点必须位于仓库网格正上方的页签区域` }
  }
  const normalizedOther = normalizePuzzleTabPoint(otherPoint)
  if (normalizedOther && normalizedOther.x === normalizedPoint.x && normalizedOther.y === normalizedPoint.y) {
    return { valid: false, code: 'TAB_POINTS_DUPLICATE', message: '两个仓库页签不能使用同一个坐标' }
  }
  return { valid: true, point: normalizedPoint }
}

export function gridCellCenter(region, grid, row, column) {
  const size = puzzleGridSize(grid)
  const left = finite(region?.left)
  const top = finite(region?.top)
  const width = finite(region?.right) - left
  const height = finite(region?.bottom) - top
  return {
    x: Math.round(left + (Number(column) + 0.5) * width / size.columns),
    y: Math.round(top + (Number(row) + 0.5) * height / size.rows)
  }
}

export function normalizePuzzleOrientation(type, orientation = 0) {
  const normalized = ((Math.round(Number(orientation) / 90) * 90) % 360 + 360) % 360
  if (type === 'cross') return 0
  if (type === 'straight') return normalized % 180
  return normalized
}

export function counterClockwiseTurns(type, currentOrientation, targetOrientation) {
  const current = normalizePuzzleOrientation(type, currentOrientation)
  const target = normalizePuzzleOrientation(type, targetOrientation)
  const period = type === 'cross' ? 90 : type === 'straight' ? 180 : 360
  return ((current - target) % period + period) % period / 90
}

export function validatePuzzleRegionEnvironment(metadata, displays = [], type = PUZZLE_REGION_TYPES.inventory) {
  const normalized = normalizePuzzleRegionMetadata(metadata)
  const atlas = type === PUZZLE_REGION_TYPES.atlas
  const label = atlas ? '3×3 海图区' : '6×10 碎片仓库区域'
  if (!normalized) return { valid: false, code: 'REGION_REQUIRED', message: `请先框选完整的 ${label}` }
  const width = normalized.selectedRegion.right - normalized.selectedRegion.left
  const height = normalized.selectedRegion.bottom - normalized.selectedRegion.top
  const size = puzzleGridSize(type)
  if (width < size.columns * 20 || height < size.rows * 20) {
    return { valid: false, code: 'REGION_TOO_SMALL', message: `${atlas ? '海图' : '仓库'}区域过小，请完整框选 ${size.columns}×${size.rows} 网格` }
  }
  const compatible = displays.filter(display => {
    const bounds = display.physicalBounds || display.displayPhysicalBounds || {}
    return contains(bounds, normalized.selectedRegion) &&
      (!normalized.displayPhysicalBounds.width || bounds.width === normalized.displayPhysicalBounds.width) &&
      (!normalized.displayPhysicalBounds.height || bounds.height === normalized.displayPhysicalBounds.height) &&
      Math.abs(finite(display.scaleFactor, 1) - normalized.scaleFactor) <= 0.05
  })
  if (displays.length && compatible.length !== 1) {
    return { valid: false, code: 'DISPLAY_ENVIRONMENT_CHANGED', message: `显示器分辨率、DPI 或布局已变化，请重新框选${atlas ? '海图区' : '碎片仓库'}` }
  }
  return { valid: true, metadata: normalized, display: compatible[0] || null }
}
