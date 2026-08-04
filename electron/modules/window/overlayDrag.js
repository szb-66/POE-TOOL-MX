export const OVERLAY_DRAG_HIT_WIDTH = 72
export const OVERLAY_DRAG_HIT_HEIGHT = 24

function finitePoint(point) {
  const screenX = Number(point?.screenX)
  const screenY = Number(point?.screenY)
  return Number.isFinite(screenX) && Number.isFinite(screenY)
    ? { screenX, screenY }
    : null
}

export function isPointInCenteredOverlayDragHandle(point, bounds, topOffset = 0) {
  const left = bounds.x + (bounds.width - OVERLAY_DRAG_HIT_WIDTH) / 2
  const top = bounds.y + topOffset
  return point.x >= left && point.x < left + OVERLAY_DRAG_HIT_WIDTH &&
    point.y >= top && point.y < top + OVERLAY_DRAG_HIT_HEIGHT
}

export function getFixedOverlayDragBounds(point, workArea, size) {
  const width = Math.max(1, Math.round(Number(size?.width) || 1))
  const height = Math.max(1, Math.round(Number(size?.height) || 1))
  const minX = Math.round(workArea.x)
  const minY = Math.round(workArea.y)
  const maxX = Math.max(minX, Math.round(workArea.x + workArea.width - width))
  const maxY = Math.max(minY, Math.round(workArea.y + workArea.height - height))
  return {
    x: Math.max(minX, Math.min(maxX, Math.round(point.x))),
    y: Math.max(minY, Math.min(maxY, Math.round(point.y))),
    width,
    height
  }
}

export class OverlayDragPassthroughController {
  constructor({ getWindow, getCursorPoint, isPointInHandle, intervalMs = 32 }) {
    this.getWindow = getWindow
    this.getCursorPoint = getCursorPoint
    this.isPointInHandle = isPointInHandle
    this.intervalMs = intervalMs
    this.timer = null
    this.enabled = true
    this.dragging = false
    this.ignoring = null
  }

  sync() {
    const window = this.getWindow()
    if (!window || window.isDestroyed()) return
    const overHandle = this.enabled && !this.dragging &&
      this.isPointInHandle(this.getCursorPoint(), window.getBounds(), window)
    const ignore = this.enabled && !this.dragging && !overHandle
    if (ignore === this.ignoring) return
    this.ignoring = ignore
    window.setIgnoreMouseEvents(ignore, { forward: true })
  }

  start() {
    if (this.timer == null) {
      this.timer = setInterval(() => this.sync(), this.intervalMs)
      this.timer.unref?.()
    }
    this.sync()
  }

  stop() {
    if (this.timer != null) clearInterval(this.timer)
    this.timer = null
    this.dragging = false
    this.ignoring = null
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled)
    this.sync()
  }

  setDragging(dragging) {
    this.dragging = Boolean(dragging)
    this.sync()
  }
}

export class OverlayDragSession {
  constructor() {
    this.active = null
  }

  begin(senderId, pointer, windowBounds) {
    const start = finitePoint(pointer)
    const x = Number(windowBounds?.x)
    const y = Number(windowBounds?.y)
    if (!start || !Number.isFinite(x) || !Number.isFinite(y)) {
      this.active = null
      return false
    }
    this.active = {
      senderId,
      start,
      window: { x, y }
    }
    return true
  }

  move(senderId, pointer) {
    const current = finitePoint(pointer)
    if (!this.active || this.active.senderId !== senderId || !current) return null
    return {
      x: Math.round(this.active.window.x + current.screenX - this.active.start.screenX),
      y: Math.round(this.active.window.y + current.screenY - this.active.start.screenY)
    }
  }

  end(senderId) {
    if (!this.active || this.active.senderId !== senderId) return false
    this.active = null
    return true
  }
}
