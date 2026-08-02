export const CHAOS_ERROR_CODES = Object.freeze({
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  API_INCOMPATIBLE: 'API_INCOMPATIBLE',
  RATE_LIMITED: 'RATE_LIMITED',
  UNSUPPORTED_TAB: 'UNSUPPORTED_TAB',
  CALIBRATION_REQUIRED: 'CALIBRATION_REQUIRED',
  ITEM_MISMATCH: 'ITEM_MISMATCH',
  INVENTORY_FULL: 'INVENTORY_FULL',
  GAME_NOT_FOREGROUND: 'GAME_NOT_FOREGROUND',
  INTERFACE_LOST: 'INTERFACE_LOST',
  AUTOMATION_RUNNING: 'AUTOMATION_RUNNING',
  INVALID_REQUEST: 'INVALID_REQUEST',
  NETWORK_ERROR: 'NETWORK_ERROR'
})

export class ChaosRecipeError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'ChaosRecipeError'
    this.code = code
    this.details = details
  }

  toJSON() {
    return { code: this.code, message: this.message, details: this.details }
  }
}

export function serializeChaosError(error) {
  if (error instanceof ChaosRecipeError) return error.toJSON()
  return {
    code: CHAOS_ERROR_CODES.NETWORK_ERROR,
    message: error?.message || '国服混沌配方服务发生未知错误',
    details: {}
  }
}
