export const PUZZLE_GRID_SIZE = Object.freeze({ columns: 6, rows: 10 })

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

export function validatePuzzleRegionEnvironment(metadata, displays = []) {
  const normalized = normalizePuzzleRegionMetadata(metadata)
  if (!normalized) return { valid: false, code: 'REGION_REQUIRED', message: '请先框选完整的 6×10 碎片仓库区域' }
  const width = normalized.selectedRegion.right - normalized.selectedRegion.left
  const height = normalized.selectedRegion.bottom - normalized.selectedRegion.top
  if (width < PUZZLE_GRID_SIZE.columns * 20 || height < PUZZLE_GRID_SIZE.rows * 20) {
    return { valid: false, code: 'REGION_TOO_SMALL', message: '仓库区域过小，请完整框选 6×10 网格' }
  }
  const compatible = displays.filter(display => {
    const bounds = display.physicalBounds || display.displayPhysicalBounds || {}
    return contains(bounds, normalized.selectedRegion) &&
      (!normalized.displayPhysicalBounds.width || bounds.width === normalized.displayPhysicalBounds.width) &&
      (!normalized.displayPhysicalBounds.height || bounds.height === normalized.displayPhysicalBounds.height) &&
      Math.abs(finite(display.scaleFactor, 1) - normalized.scaleFactor) <= 0.05
  })
  if (displays.length && compatible.length !== 1) {
    return { valid: false, code: 'DISPLAY_ENVIRONMENT_CHANGED', message: '显示器分辨率、DPI 或布局已变化，请重新框选碎片仓库' }
  }
  return { valid: true, metadata: normalized, display: compatible[0] || null }
}

