export const EMPTY_SLOT_THRESHOLD = Object.freeze({
  min: 1,
  max: 60,
  default: 3
})

export function normalizeEmptySlotThreshold(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return EMPTY_SLOT_THRESHOLD.default
  return Math.min(EMPTY_SLOT_THRESHOLD.max, Math.max(EMPTY_SLOT_THRESHOLD.min, Math.trunc(number)))
}
