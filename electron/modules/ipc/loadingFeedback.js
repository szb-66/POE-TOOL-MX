/**
 * 文件职责：注册主窗口 renderer 的受控加载反馈 IPC。
 * 主要入口：registerLoadingFeedbackHandlers。
 * 关键依赖：Electron ipcMain、LoadingFeedbackCoordinator 与当前主窗口身份。
 * 边界：仅接受主窗口 sender，且 renderer 只能结束自己创建的令牌。
 */

import { ipcMain } from 'electron'

// Purpose: 为 renderer WebContents 生成稳定所有者标识；无效 sender 安全归为 0。
function ownerId(sender) {
  return `renderer:${Number(sender?.id) || 0}`
}

/**
 * Purpose: 注册 begin/finish/state 三个白名单 IPC 处理器。
 * Inputs: 已初始化的协调器和主窗口 getter。
 * Outputs: 注册 IPC 副作用；sender 销毁时清理其所有反馈。
 * Errors: 越权或未知操作返回受控失败结果，不上抛。
 */
export function registerLoadingFeedbackHandlers(coordinator, getMainWindow) {
  const ownedSenders = new WeakSet()
  const mainSender = event => {
    const window = getMainWindow?.()
    return Boolean(window && !window.isDestroyed?.() && event.sender === window.webContents)
  }

  ipcMain.handle('loading-feedback:begin', (event, operationId) => {
    if (!mainSender(event)) return { success: false, error: '仅助手主窗口可登记加载反馈' }
    const owner = ownerId(event.sender)
    if (!ownedSenders.has(event.sender)) {
      ownedSenders.add(event.sender)
      event.sender.once('destroyed', () => coordinator.finishOwner(owner))
    }
    const token = coordinator.beginFromRenderer(operationId, owner)
    return token ? { success: true, token } : { success: false, error: '未知或不可由页面登记的加载操作' }
  })

  ipcMain.handle('loading-feedback:finish', (event, token) => {
    if (!mainSender(event)) return { success: false }
    return { success: coordinator.finishOwned(token, ownerId(event.sender)) }
  })

  ipcMain.handle('loading-feedback:state', event => (
    mainSender(event) ? coordinator.getSnapshot('app') : { visible: false, target: 'app', label: '', current: 0, total: 0, activeCount: 0 }
  ))
}
