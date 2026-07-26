export const OPERATION_DELAY = Object.freeze({
  default: 80,
  min: 20,
  max: 500
})

const finiteNumber = (value) => {
  if (value == null || typeof value === 'boolean' || (typeof value === 'string' && value.trim() === '')) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function normalizeOperationDelay(value) {
  const delay = finiteNumber(value) ?? OPERATION_DELAY.default
  return Math.max(OPERATION_DELAY.min, Math.min(OPERATION_DELAY.max, delay))
}

export function migrateOperationDelay(settings = {}, bagSettings = {}) {
  if (settings.operationDelayMs != null) return normalizeOperationDelay(settings.operationDelayMs)

  const bagDelay = finiteNumber(bagSettings.transferDelayMs)
  if (bagDelay != null) return normalizeOperationDelay(bagDelay)

  const legacy = settings.delays
  if (legacy && typeof legacy === 'object') {
    const effective = [
      (finiteNumber(legacy.mouseMove) ?? 100) * 0.05,
      (finiteNumber(legacy.action) ?? 50) * 0.2,
      (finiteNumber(legacy.clipboardRead) ?? 100) * 0.2
    ]
    return normalizeOperationDelay(Math.max(OPERATION_DELAY.default, ...effective))
  }

  return OPERATION_DELAY.default
}
