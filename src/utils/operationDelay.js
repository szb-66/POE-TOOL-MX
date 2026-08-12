export const OPERATION_DELAY = Object.freeze({
  default: 50
})

export const OPERATION_TIMING_VERSION = 2
const LEGACY_OPERATION_DELAY_DEFAULT = 80

export const ADAPTIVE_TIMING = Object.freeze({
  default: true,
  timeoutDefault: 1000
})

const FIXED_TIMING_FIELDS = Object.freeze({
  modifierSettleMs: { default: 50 },
  keyHoldMs: { default: 20 },
  buttonHoldMs: { default: 20 },
  releaseSettleMs: { default: 20 },
  clipboardConfirmMs: { default: 250 },
  stashTabSettleMs: { default: 250 },
  stashSettleMs: { default: 200 },
  patchVerifyMs: { default: 550 }
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
  return delay >= 0 ? delay : OPERATION_DELAY.default
}

export function normalizeAdaptiveTiming(value) {
  return value !== false
}

export function normalizeAdaptiveTimeoutMs(value) {
  const timeout = finiteNumber(value) ?? ADAPTIVE_TIMING.timeoutDefault
  return timeout >= 0 ? timeout : ADAPTIVE_TIMING.timeoutDefault
}

export function normalizeFixedTiming(value = {}) {
  const result = { ...FIXED_TIMING.defaults }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result
  for (const [key, rule] of Object.entries(FIXED_TIMING_FIELDS)) {
    const raw = value[key]
    if (raw == null || typeof raw === 'boolean' || (typeof raw === 'string' && raw.trim() === '')) continue
    const number = Number(raw)
    if (Number.isFinite(number) && number >= 0) result[key] = number
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

export function normalizeAutomationTiming(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return {
    operationDelayMs: normalizeOperationDelay(source.operationDelayMs),
    adaptiveTiming: normalizeAdaptiveTiming(source.adaptiveTiming),
    adaptiveTimeoutMs: normalizeAdaptiveTimeoutMs(source.adaptiveTimeoutMs),
    fixedTiming: normalizeFixedTiming(source.fixedTiming)
  }
}

export function pythonAutomationTiming(value = {}) {
  const timing = normalizeAutomationTiming(value)
  return {
    operation_delay_ms: timing.operationDelayMs,
    timing_mode: timing.adaptiveTiming ? 'adaptive' : 'fixed',
    adaptive_timeout_ms: timing.adaptiveTimeoutMs,
    fixed_timing: pythonFixedTiming(timing.fixedTiming)
  }
}

export function migrateOperationDelay(settings = {}, bagSettings = {}) {
  let delay
  if (settings.operationDelayMs != null) {
    delay = normalizeOperationDelay(settings.operationDelayMs)
  } else {
    const bagDelay = finiteNumber(bagSettings.transferDelayMs)
    if (bagDelay != null) {
      delay = normalizeOperationDelay(bagDelay)
    } else {
      const legacy = settings.delays
      if (legacy && typeof legacy === 'object') {
        const effective = [
          (finiteNumber(legacy.mouseMove) ?? 100) * 0.05,
          (finiteNumber(legacy.action) ?? 50) * 0.2,
          (finiteNumber(legacy.clipboardRead) ?? 100) * 0.2
        ]
        delay = normalizeOperationDelay(Math.max(LEGACY_OPERATION_DELAY_DEFAULT, ...effective))
      } else {
        delay = OPERATION_DELAY.default
      }
    }
  }

  return Number(settings.operationTimingVersion) !== OPERATION_TIMING_VERSION && delay === LEGACY_OPERATION_DELAY_DEFAULT
    ? OPERATION_DELAY.default
    : delay
}
