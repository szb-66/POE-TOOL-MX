import { randomUUID } from 'node:crypto'
import {
  CRAFTING_CURRENCY_BY_KEY,
  normalizeCurrencyUsage
} from '../../../shared/craftingCurrencyCatalog.js'

const VALID_MODES = new Set(['items', 'map'])

export class CraftingCurrencyUsageLedger {
  constructor({ createId = randomUUID } = {}) {
    this.createId = createId
    this.active = null
  }

  begin({ mode, usageSessionId = null, continueCurrencyUsage = false } = {}) {
    if (!VALID_MODES.has(mode)) throw new Error('无法为未知制作模式建立通货账单')
    const canContinue = continueCurrencyUsage === true &&
      typeof usageSessionId === 'string' && usageSessionId.length > 0 &&
      this.active?.id === usageSessionId && this.active.mode === mode

    if (!canContinue) {
      const requestedId = typeof usageSessionId === 'string' && usageSessionId.length > 0
        ? usageSessionId
        : null
      this.active = {
        id: continueCurrencyUsage === true ? this.createId() : (requestedId || this.createId()),
        mode,
        totals: {}
      }
    }
    return this.snapshot()
  }

  record(event, { usageSessionId, mode } = {}) {
    if (!this.active || this.active.id !== usageSessionId || this.active.mode !== mode) return null
    if (event?.event !== 'crafting-currency-used' || event.mode !== mode) return null
    if (!CRAFTING_CURRENCY_BY_KEY.has(event.currency)) return null
    if (!Number.isSafeInteger(event.amount) || event.amount !== 1) return null

    this.active.totals[event.currency] = (this.active.totals[event.currency] || 0) + event.amount
    return this.snapshot()
  }

  snapshot() {
    if (!this.active) return { usageSessionId: null, currencyUsage: {} }
    return {
      usageSessionId: this.active.id,
      currencyUsage: normalizeCurrencyUsage(this.active.totals)
    }
  }
}
