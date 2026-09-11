export const SANCTUM_TIMEOUTS = Object.freeze({ prepare:20000, capture:20000, ocr:40000 })

export function sanctumError(code, message) {
  return Object.assign(new Error(message), {code})
}

export const isStepTimeout = error => error?.code === 'STEP_TIMEOUT'
export const isSafetyError = error => ['SAFETY_INTERRUPTED','CONTEXT_CHANGED'].includes(error?.code)
// Both the native window check and the service foreground event use this boundary.
export const isForegroundLoss = error => ['游戏不在前台', '游戏已失去前台'].includes(error?.message)
