function finitePoint(point) {
  const screenX = Number(point?.screenX)
  const screenY = Number(point?.screenY)
  return Number.isFinite(screenX) && Number.isFinite(screenY)
    ? { screenX, screenY }
    : null
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
