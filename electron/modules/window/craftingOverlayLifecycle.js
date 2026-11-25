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

/**
 * 并行准备制作浮窗：在浮窗 did-finish-load 完成前缓存早期 IPC 消息，
 * 就绪后按原序一次性刷入，避免首次创建浮窗阻塞 Python 进程启动。
 */
export function createOverlayDispatcher(windowManager, getOverlayWindow, currencyUsageSnapshot) {
  let ready = false
  let failed = false
  let overlayWindow = null
  const queue = []

  const flush = () => {
    if (!ready || failed) return
    const target = overlayWindow && !overlayWindow.isDestroyed() ? overlayWindow : getOverlayWindow?.()
    if (!target || target.isDestroyed() || target.webContents?.isDestroyed?.()) {
      queue.length = 0
      return
    }
    while (queue.length) {
      const [channel, payload] = queue.shift()
      target.webContents.send(channel, payload)
    }
  }

  let readyPromise
  try {
    readyPromise = Promise.resolve(prepareCraftingOverlay(windowManager, getOverlayWindow, currencyUsageSnapshot))
      .then((win) => {
        overlayWindow = win
        ready = true
        flush()
        return win
      })
      .catch((error) => {
        failed = true
        queue.length = 0
        throw error
      })
  } catch (error) {
    failed = true
    queue.length = 0
    readyPromise = Promise.reject(error)
  }

  // 避免调用方提前返回时触发未处理拒绝，由调用方在启动阶段显式 await。
  readyPromise.catch(() => {})

  return {
    readyPromise,
    send(channel, payload) {
      if (failed) return
      if (!ready) {
        queue.push([channel, payload])
        return
      }
      const target = overlayWindow && !overlayWindow.isDestroyed() ? overlayWindow : getOverlayWindow?.()
      if (target && !target.isDestroyed() && !target.webContents?.isDestroyed?.()) {
        target.webContents.send(channel, payload)
      }
    }
  }
}
