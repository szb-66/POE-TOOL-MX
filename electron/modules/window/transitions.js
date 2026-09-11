// Aura 的中心缩放不受 thickFrame 或 DWM 控制；仅在这次同步显隐期间禁用。
export function setWindowVisibilityImmediately(window, visible, commandLine) {
  const key = 'wm-window-animations-disabled'
  const temporary = commandLine && !commandLine.hasSwitch(key)
  if (temporary) commandLine.appendSwitch(key)
  try {
    if (visible) window.showInactive()
    else window.hide()
  } finally {
    if (temporary) commandLine.removeSwitch(key)
  }
}
