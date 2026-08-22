const DEFAULT_WIDTH_MIN = 520
const DEFAULT_WIDTH_MAX = 640
const DEFAULT_HEIGHT_MIN = 520
const DEFAULT_HEIGHT_MAX = 760
export const PRICE_CHECK_OVERLAY_RESIZE_SAVE_DELAY_MS = 180

function positiveInteger(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  const normalized = Math.round(value)
  return normalized > 0 ? normalized : null
}

export function normalizePriceCheckOverlaySize(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const width = positiveInteger(value.width)
  const height = positiveInteger(value.height)
  return width && height ? { width, height } : null
}

export function getDefaultPriceCheckOverlaySize(workArea = {}) {
  const areaWidth = positiveInteger(workArea.width) || DEFAULT_WIDTH_MIN
  const areaHeight = positiveInteger(workArea.height) || DEFAULT_HEIGHT_MIN
  return {
    width: Math.min(DEFAULT_WIDTH_MAX, Math.max(DEFAULT_WIDTH_MIN, Math.floor(areaWidth * 0.32))),
    height: Math.min(DEFAULT_HEIGHT_MAX, Math.max(DEFAULT_HEIGHT_MIN, Math.floor(areaHeight * 0.76)))
  }
}

export function resolvePriceCheckOverlaySize(preferredSize, workArea = {}) {
  const desired = normalizePriceCheckOverlaySize(preferredSize) || getDefaultPriceCheckOverlaySize(workArea)
  const areaSize = normalizePriceCheckOverlaySize(workArea)
  if (!areaSize) return desired
  return {
    width: Math.min(desired.width, areaSize.width),
    height: Math.min(desired.height, areaSize.height)
  }
}

export class PriceCheckOverlaySizeController {
  constructor({
    load = () => null,
    save = () => {},
    schedule = (callback, delay) => setTimeout(callback, delay),
    cancel = (timer) => clearTimeout(timer),
    delay = PRICE_CHECK_OVERLAY_RESIZE_SAVE_DELAY_MS
  } = {}) {
    this.load = load
    this.save = save
    this.schedule = schedule
    this.cancel = cancel
    this.delay = delay
    this.pendingSize = null
    this.timer = null
  }

  resolve(workArea) {
    let preferredSize = null
    try { preferredSize = this.load() } catch {}
    return resolvePriceCheckOverlaySize(preferredSize, workArea)
  }

  queueUserResize(bounds) {
    const size = normalizePriceCheckOverlaySize(bounds)
    if (!size) return false
    this.pendingSize = size
    if (this.timer !== null) this.cancel(this.timer)
    this.timer = this.schedule(() => {
      this.timer = null
      this.commitPending()
    }, this.delay)
    return true
  }

  commitPending() {
    if (!this.pendingSize) return false
    const size = this.pendingSize
    this.pendingSize = null
    try { this.save(size) } catch {}
    return true
  }

  flush() {
    if (this.timer !== null) {
      this.cancel(this.timer)
      this.timer = null
    }
    return this.commitPending()
  }
}
