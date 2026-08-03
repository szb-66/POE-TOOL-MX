export const PUZZLE_GRID_SIZE = Object.freeze({ columns: 6, rows: 10 })
export const ATLAS_GRID_SIZE = Object.freeze({ columns: 3, rows: 3 })
export const PUZZLE_REGION_TYPES = Object.freeze({ inventory: 'inventory', atlas: 'atlas' })

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

export function normalizePuzzleSettings(value = {}) {
  const inventoryRegionMetadata = normalizePuzzleRegionMetadata(
    value.inventoryRegionMetadata || value.regionMetadata
  )
  const atlasRegionMetadata = normalizePuzzleRegionMetadata(value.atlasRegionMetadata)
  return { inventoryRegionMetadata, atlasRegionMetadata }
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
