export const CHAOS_CONTROL_PHYSICAL_SIZE = Object.freeze({ width: 560, height: 76 })
export const CHAOS_CONTROL_DIP_SIZE = Object.freeze({ width: 560, height: 88 })
export const CHAOS_CONTROL_MARGIN = 50

function finite(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function normalizeControlDipSize(value, maximum = CHAOS_CONTROL_DIP_SIZE) {
  return {
    width: Math.max(1, Math.min(maximum.width, Math.ceil(finite(value?.width, maximum.width)))),
    height: Math.max(1, Math.min(maximum.height, Math.ceil(finite(value?.height, maximum.height))))
  }
}

export function normalizeControlOffset(value) {
  if (!value || typeof value !== 'object') return null
  if (value.x == null || value.y == null || typeof value.x === 'boolean' || typeof value.y === 'boolean') return null
  if ((typeof value.x === 'string' && !value.x.trim()) || (typeof value.y === 'string' && !value.y.trim())) return null
  const x = Number(value.x)
  const y = Number(value.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return {
    x: Math.round(x),
    y: Math.round(y)
  }
}

export function defaultControlOffset(gameBounds, size = CHAOS_CONTROL_PHYSICAL_SIZE, margin = CHAOS_CONTROL_MARGIN) {
  if (!gameBounds) return null
  const width = Math.max(1, Number(gameBounds.width) || Number(gameBounds.right) - Number(gameBounds.left))
  const height = Math.max(1, Number(gameBounds.height) || Number(gameBounds.bottom) - Number(gameBounds.top))
  return {
    x: Math.max(0, Math.min(margin, width - Math.min(size.width, width))),
    y: Math.max(0, height - Math.min(size.height, height) - margin)
  }
}

export function clampControlPhysicalBounds(gameBounds, offset, size = CHAOS_CONTROL_PHYSICAL_SIZE) {
  if (!gameBounds) return null
  const normalized = normalizeControlOffset(offset) || defaultControlOffset(gameBounds, size)
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
  const width = Math.min(size.width, Math.max(1, gameBottomRight.x - gameTopLeft.x))
  const height = Math.min(size.height, Math.max(1, gameBottomRight.y - gameTopLeft.y))
  const requested = normalized
    ? toDip({
        x: gameBounds.left + normalized.x,
        y: gameBounds.top + normalized.y
      })
    : {
        x: Math.min(gameBottomRight.x - width, gameTopLeft.x + CHAOS_CONTROL_MARGIN),
        y: Math.max(gameTopLeft.y, gameBottomRight.y - height - CHAOS_CONTROL_MARGIN)
      }
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
