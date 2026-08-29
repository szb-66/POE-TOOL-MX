export const EMPTY_SLOT_THRESHOLD = Object.freeze({
  min: 1,
  max: 60,
  default: 3
})

export const INVENTORY_LAYOUT = Object.freeze({
  nativeColumns: 12,
  rows: 5,
  minExtraColumns: 1,
  maxExtraColumns: 6,
  defaultExtraColumns: 6
})

export function normalizeEmptySlotThreshold(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return EMPTY_SLOT_THRESHOLD.default
  return Math.min(EMPTY_SLOT_THRESHOLD.max, Math.max(EMPTY_SLOT_THRESHOLD.min, Math.trunc(number)))
}

export function deriveInventoryGridFromRegion(region) {
  const left = Math.min(Number(region?.left), Number(region?.right))
  const top = Math.min(Number(region?.top), Number(region?.bottom))
  const right = Math.max(Number(region?.left), Number(region?.right))
  const bottom = Math.max(Number(region?.top), Number(region?.bottom))
  if (![left, top, right, bottom].every(Number.isFinite)) return null
  const slotSize = {
    w: Math.round((right - left) / INVENTORY_LAYOUT.nativeColumns),
    h: Math.round((bottom - top) / INVENTORY_LAYOUT.rows)
  }
  if (slotSize.w <= 0 || slotSize.h <= 0) return null
  return {
    startPos: {
      x: Math.round(left + slotSize.w / 2),
      y: Math.round(top + slotSize.h / 2)
    },
    slotSize
  }
}
