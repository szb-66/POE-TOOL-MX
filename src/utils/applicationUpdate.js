export const UPDATE_MODE_MANUAL = 'manual'
export const UPDATE_MODE_AUTOMATIC = 'automatic'

export function normalizeUpdateMode(mode) {
  return mode === UPDATE_MODE_AUTOMATIC ? UPDATE_MODE_AUTOMATIC : UPDATE_MODE_MANUAL
}
