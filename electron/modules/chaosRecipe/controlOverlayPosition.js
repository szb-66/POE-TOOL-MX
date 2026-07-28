export const CHAOS_CONTROL_PHYSICAL_SIZE = Object.freeze({ width: 560, height: 76 })
export const CHAOS_CONTROL_DIP_SIZE = Object.freeze({ width: 560, height: 88 })
export const DEFAULT_CHAOS_CONTROL_OFFSET = Object.freeze({ x: 50, y: 1550 })

function finite(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function normalizeControlOffset(value) {
  return {
    x: Math.round(finite(value?.x, DEFAULT_CHAOS_CONTROL_OFFSET.x)),
    y: Math.round(finite(value?.y, DEFAULT_CHAOS_CONTROL_OFFSET.y))
  }
}

export function clampControlPhysicalBounds(gameBounds, offset, size = CHAOS_CONTROL_PHYSICAL_SIZE) {
  if (!gameBounds) return null
  const normalized = normalizeControlOffset(offset)
  const width = Math.min(size.width, Math.max(1, gameBounds.width || gameBounds.right - gameBounds.left))
  const height = Math.min(size.height, Math.max(1, gameBounds.height || gameBounds.bottom - gameBounds.top))
  const left = Math.max(gameBounds.left, Math.min(gameBounds.right - width, gameBounds.left + normalized.x))
  const top = Math.max(gameBounds.top, Math.min(gameBounds.bottom - height, gameBounds.top + normalized.y))
  return {
    left: Math.round(left),
    top: Math.round(top),
    right: Math.round(left + width),
    bottom: Math.round(top + height),
    width: Math.round(width),
    height: Math.round(height),
    offset: {
      x: Math.round(left - gameBounds.left),
      y: Math.round(top - gameBounds.top)
    }
  }
}

export function placeControlInDip(gameBounds, offset, coordinateApi, size = CHAOS_CONTROL_DIP_SIZE) {
  if (!gameBounds) return null
  const toDip = coordinateApi?.screenToDipPoint || ((point) => point)
  const toPhysical = coordinateApi?.dipToScreenPoint || ((point) => point)
  const normalized = normalizeControlOffset(offset)
  const gameTopLeft = toDip({ x: gameBounds.left, y: gameBounds.top })
  const gameBottomRight = toDip({ x: gameBounds.right, y: gameBounds.bottom })
  const requested = toDip({
    x: gameBounds.left + normalized.x,
    y: gameBounds.top + normalized.y
  })
  const width = Math.min(size.width, Math.max(1, gameBottomRight.x - gameTopLeft.x))
  const height = Math.min(size.height, Math.max(1, gameBottomRight.y - gameTopLeft.y))
  const x = Math.max(gameTopLeft.x, Math.min(gameBottomRight.x - width, requested.x))
  const y = Math.max(gameTopLeft.y, Math.min(gameBottomRight.y - height, requested.y))
  const physical = toPhysical({ x: Math.round(x), y: Math.round(y) })
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
    offset: {
      x: Math.round(physical.x - gameBounds.left),
      y: Math.round(physical.y - gameBounds.top)
    }
  }
}
