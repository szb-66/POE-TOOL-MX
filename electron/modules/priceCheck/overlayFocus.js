export const PRICE_CHECK_OVERLAY_CLOSE_REASONS = Object.freeze({
  USER_DISMISS: 'user-dismiss',
  POINTER_LEAVE: 'pointer-leave',
  BLUR: 'blur',
  EXTERNAL_ACTION: 'external-action',
  SYSTEM: 'system'
})

const RESTORE_GAME_FOCUS_REASONS = new Set([
  PRICE_CHECK_OVERLAY_CLOSE_REASONS.USER_DISMISS,
  PRICE_CHECK_OVERLAY_CLOSE_REASONS.POINTER_LEAVE
])

export function shouldRestoreGameFocus(reason) {
  return RESTORE_GAME_FOCUS_REASONS.has(reason)
}

export class PriceCheckOverlayFocusSession {
  constructor() {
    this.begin()
  }

  begin() {
    this.externalAction = false
    this.restoreRequested = false
  }

  preserveForExternalAction() {
    this.externalAction = true
  }

  consumeRestoreRequest(reason) {
    if (this.externalAction || this.restoreRequested || !shouldRestoreGameFocus(reason)) return false
    this.restoreRequested = true
    return true
  }
}
