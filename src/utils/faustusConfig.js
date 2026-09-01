import { createDefaultFaustusConfig, normalizeFaustusConfig, validateFaustusConfig } from './faustusPricing.js'

export const FAUSTUS_CONFIG_STORAGE_KEY = 'faustusMarketRepricingConfig'

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const child of Object.values(value)) deepFreeze(child)
  return value
}

export function createFaustusConfigRepository(storage = globalThis.localStorage) {
  return {
    load() {
      try {
        const raw = storage?.getItem?.(FAUSTUS_CONFIG_STORAGE_KEY)
        return raw ? normalizeFaustusConfig(JSON.parse(raw)) : createDefaultFaustusConfig()
      } catch {
        return createDefaultFaustusConfig()
      }
    },
    save(value) {
      const normalized = normalizeFaustusConfig(value)
      storage?.setItem?.(FAUSTUS_CONFIG_STORAGE_KEY, JSON.stringify(normalized))
      return normalized
    }
  }
}

export function createFaustusRunSnapshot(value) {
  const validation = validateFaustusConfig(value)
  if (!validation.valid) {
    throw Object.assign(new Error('浮士德改价配置无效'), { code: 'INVALID_FAUSTUS_CONFIG', errors: validation.errors })
  }
  return deepFreeze(JSON.parse(JSON.stringify(validation.config)))
}
