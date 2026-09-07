export const WINDOW_CLOSE_BEHAVIOR_EXIT = 'exit'
export const WINDOW_CLOSE_BEHAVIOR_TRAY = 'tray'

export function normalizeWindowCloseBehavior(value) {
  return value === WINDOW_CLOSE_BEHAVIOR_TRAY
    ? WINDOW_CLOSE_BEHAVIOR_TRAY
    : WINDOW_CLOSE_BEHAVIOR_EXIT
}
