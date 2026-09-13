// Keep the taskbar entry available while capturing, and use the same activation
// service as the existing screen picker instead of waiting for incidental focus.
export async function withCalibrationGameWindow({ getMainWindow, minimizeMainWindow, activation }, operation) {
  const main = getMainWindow()
  if (!main || main.isDestroyed()) throw new Error('主窗口不可用，无法开始截图')
  try {
    if (!await minimizeMainWindow()) throw new Error('无法最小化助手窗口，请重试')
    const result = await activation.activateGame({ source: 'sanctum-calibration' })
    if (!result?.success) throw new Error(activation.gameFailureMessage(result?.code))
    return await operation()
  } finally {
    if (!main.isDestroyed()) {
      if (main.isMinimized()) main.restore()
      main.show()
      await activation.activateMain({ source: 'sanctum-calibration-return' })
    }
  }
}
