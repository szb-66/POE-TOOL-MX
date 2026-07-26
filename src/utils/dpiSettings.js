export const DPI_MODE_AUTO = 'auto'
export const DPI_MODE_MANUAL = 'manual'

export function normalizeDpiScale(value, fallback = null) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < 1 || number > 3) return fallback
  return Number(number.toFixed(4))
}

export function loadDpiSettings(data = {}) {
  const legacyScale = normalizeDpiScale(data.dpiScale, null)
  const hasNewSettings = data.dpiMode === DPI_MODE_AUTO || data.dpiMode === DPI_MODE_MANUAL
  return {
    mode: hasNewSettings ? data.dpiMode : DPI_MODE_AUTO,
    manualScale: normalizeDpiScale(data.manualDpiScale, legacyScale ?? 1),
    lastDetectedScale: normalizeDpiScale(data.lastDetectedDpiScale, hasNewSettings ? null : legacyScale)
  }
}

export function resolveEffectiveDpi({ mode, manualScale, detectedScale, lastDetectedScale, primaryScale } = {}) {
  if (mode === DPI_MODE_MANUAL) {
    return { scaleFactor: normalizeDpiScale(manualScale, 1), source: 'manual' }
  }
  const detected = normalizeDpiScale(detectedScale, null)
  if (detected != null) return { scaleFactor: detected, source: 'game' }
  const previous = normalizeDpiScale(lastDetectedScale, null)
  if (previous != null) return { scaleFactor: previous, source: 'history' }
  return { scaleFactor: normalizeDpiScale(primaryScale, 1), source: 'primary' }
}
