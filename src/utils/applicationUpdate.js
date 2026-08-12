export const UPDATE_MODE_MANUAL = 'manual'
export const UPDATE_MODE_AUTOMATIC = 'automatic'
export const UPDATE_SOURCE_CNB = 'cnb'
export const UPDATE_SOURCE_GITHUB = 'github'

export function normalizeUpdateMode(mode) {
  return mode === UPDATE_MODE_AUTOMATIC ? UPDATE_MODE_AUTOMATIC : UPDATE_MODE_MANUAL
}

export function normalizeUpdateSource(source) {
  return source === UPDATE_SOURCE_GITHUB ? UPDATE_SOURCE_GITHUB : UPDATE_SOURCE_CNB
}
