import { getFixedOverlayDragBounds } from './overlayDrag.js'

const DEFAULT_WORK_AREA = Object.freeze({ x: 0, y: 0, width: 1920, height: 1080 })
const DEFAULT_MARGIN = 20

function normalizedSize(size) {
  return {
    width: Math.max(1, Math.round(Number(size?.width) || 1)),
    height: Math.max(1, Math.round(Number(size?.height) || 1))
  }
}

function containsBounds(workArea, bounds) {
  return bounds.x >= workArea.x &&
    bounds.y >= workArea.y &&
    bounds.x + bounds.width <= workArea.x + workArea.width &&
    bounds.y + bounds.height <= workArea.y + workArea.height
}

export function getCraftingOverlayBounds(savedBounds, displays, size) {
  const normalized = normalizedSize(size)
  const x = Number(savedBounds?.x)
  const y = Number(savedBounds?.y)
  const saved = {
    x: Math.round(x),
    y: Math.round(y),
    ...normalized
  }
  const availableDisplays = Array.isArray(displays) ? displays : []

  if (Number.isFinite(x) && Number.isFinite(y) &&
      availableDisplays.some((display) => containsBounds(display.workArea, saved))) {
    return saved
  }

  const primary = availableDisplays.find((display) => display.primary) || availableDisplays[0]
  const workArea = primary?.workArea || DEFAULT_WORK_AREA
  return getFixedOverlayDragBounds({
    x: workArea.x + workArea.width - normalized.width - DEFAULT_MARGIN,
    y: workArea.y + DEFAULT_MARGIN
  }, workArea, normalized)
}
