/**
 * Purpose: 准备制作浮窗并在页面就绪后发送本次制作的初始状态。
 * Inputs: windowManager/getOverlayWindow 提供窗口生命周期，currencyUsageSnapshot 为本次消耗快照。
 * Outputs: 返回已完成加载、收到初始状态且已显示的制作浮窗。
 * Preconditions: BrowserWindow 风格对象提供 webContents 与销毁状态查询。
 * Edge cases: 已销毁窗口会重新创建；加载失败、超时或加载期间关闭会拒绝。
 */

export async function prepareCraftingOverlay(windowManager, getOverlayWindow, currencyUsageSnapshot) {
  let overlayWindow = getOverlayWindow()
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    overlayWindow = windowManager.createOverlayWindow()
  }
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    throw new Error('无法创建制作浮层')
  }

  const contents = overlayWindow.webContents
  const loading = typeof contents.isLoadingMainFrame === 'function'
    ? contents.isLoadingMainFrame()
    : contents.isLoading()
  if (loading) {
    await new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer)
        contents.removeListener('did-finish-load', handleLoaded)
        contents.removeListener('did-fail-load', handleFailed)
        contents.removeListener('destroyed', handleDestroyed)
      }
      const finish = (error) => {
        cleanup()
        if (error) reject(error)
        else resolve()
      }
      const handleLoaded = () => finish()
      const handleFailed = (_event, _code, description, _url, isMainFrame) => {
        if (isMainFrame === false) return
        finish(new Error(`制作浮层加载失败: ${description || '未知错误'}`))
      }
      const handleDestroyed = () => finish(new Error('制作浮层在加载期间被关闭'))
      const timer = setTimeout(() => finish(new Error('制作浮层加载超时')), 15000)
      contents.once('did-finish-load', handleLoaded)
      contents.on('did-fail-load', handleFailed)
      contents.once('destroyed', handleDestroyed)
    })
  }

  if (overlayWindow.isDestroyed()) throw new Error('制作浮层已关闭')
  overlayWindow.webContents.send('update-overlay', { reset: true, ...currencyUsageSnapshot })
  if (overlayWindow.isDestroyed()) throw new Error('制作浮层已关闭')
  overlayWindow.showInactive()
  return overlayWindow
}
