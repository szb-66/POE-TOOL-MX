export const OPERATION_DELAY = Object.freeze({
  default: 80,
  min: 20,
  max: 500
})

export const ADAPTIVE_TIMING = Object.freeze({
  default: true,
  timeoutDefault: 1000,
  timeoutMin: 500,
  timeoutMax: 3000
})

const FIXED_TIMING_FIELDS = Object.freeze({
  modifierSettleMs: { default: 50, min: 10, max: 200 },
  keyHoldMs: { default: 20, min: 5, max: 100 },
  buttonHoldMs: { default: 20, min: 5, max: 100 },
  releaseSettleMs: { default: 20, min: 5, max: 100 },
  clipboardConfirmMs: { default: 250, min: 50, max: 1000 },
  stashTabSettleMs: { default: 250, min: 50, max: 1000 },
  stashSettleMs: { default: 200, min: 50, max: 1000 },
  patchVerifyMs: { default: 550, min: 100, max: 3000 }
})

const FIXED_TIMING_PYTHON_KEYS = Object.freeze({
  modifierSettleMs: 'modifier_settle_ms',
  keyHoldMs: 'key_hold_ms',
  buttonHoldMs: 'button_hold_ms',
  releaseSettleMs: 'release_settle_ms',
  clipboardConfirmMs: 'clipboard_confirm_ms',
  stashTabSettleMs: 'stash_tab_settle_ms',
  stashSettleMs: 'stash_settle_ms',
  patchVerifyMs: 'patch_verify_ms'
})

export const FIXED_TIMING = Object.freeze({
  fields: FIXED_TIMING_FIELDS,
  defaults: Object.freeze(
    Object.fromEntries(Object.entries(FIXED_TIMING_FIELDS).map(([key, rule]) => [key, rule.default]))
  )
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

export function normalizeAdaptiveTiming(value) {
  return value !== false
}

export function normalizeAdaptiveTimeoutMs(value) {
  const timeout = finiteNumber(value) ?? ADAPTIVE_TIMING.timeoutDefault
  return Math.max(ADAPTIVE_TIMING.timeoutMin, Math.min(ADAPTIVE_TIMING.timeoutMax, timeout))
}

export function normalizeFixedTiming(value = {}) {
  const result = { ...FIXED_TIMING.defaults }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result
  for (const [key, rule] of Object.entries(FIXED_TIMING_FIELDS)) {
    const raw = value[key]
    if (raw == null || typeof raw === 'boolean' || (typeof raw === 'string' && raw.trim() === '')) continue
    const number = Number(raw)
    if (Number.isFinite(number)) {
      result[key] = Math.max(rule.min, Math.min(rule.max, number))
    }
  }
  return result
}

// Python 自动化脚本的 fixed_timing 配置统一使用 snake_case 键名，
// 与 operation_delay_ms、adaptive_timeout_ms 等配置协议保持一致。
export function pythonFixedTiming(value = {}) {
  const normalized = normalizeFixedTiming(value)
  const result = {}
  for (const [key, pythonKey] of Object.entries(FIXED_TIMING_PYTHON_KEYS)) {
    result[pythonKey] = normalized[key]
  }
  return result
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
