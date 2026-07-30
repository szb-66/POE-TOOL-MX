export const STASH_PICKUP_METHODS = Object.freeze(['variance', 'brightness', 'saturation'])

const DEFAULT_THRESHOLDS = Object.freeze({
  normal: { variance: 1500, brightness: 50, saturation: 50 },
  quad: { variance: 3000, brightness: 50, saturation: 50 }
})

function clamp(value, min, max, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback
}

export function defaultStashPickupProfile(layout) {
  return {
    method: 'variance',
    thresholds: { ...DEFAULT_THRESHOLDS[layout] },
    sampleRatio: 0.6
  }
}

export function normalizeStashPickupProfile(value, layout) {
  const defaults = defaultStashPickupProfile(layout)
  const method = STASH_PICKUP_METHODS.includes(value?.method) ? value.method : defaults.method
  return {
    method,
    thresholds: {
      variance: clamp(value?.thresholds?.variance ?? value?.varianceThreshold, 0, 65025, defaults.thresholds.variance),
      brightness: clamp(value?.thresholds?.brightness ?? value?.brightnessThreshold, 0, 255, 50),
      saturation: clamp(value?.thresholds?.saturation ?? value?.saturationThreshold, 0, 255, 50)
    },
    sampleRatio: clamp(value?.sampleRatio, 0.1, 1, 0.6)
  }
}

export function normalizeStashPickupSettings(value = {}) {
  return {
    enabled: Boolean(value.enabled),
    profiles: {
      normal: normalizeStashPickupProfile(value.profiles?.normal || value.normal, 'normal'),
      quad: normalizeStashPickupProfile(value.profiles?.quad || value.quad, 'quad')
    }
  }
}

