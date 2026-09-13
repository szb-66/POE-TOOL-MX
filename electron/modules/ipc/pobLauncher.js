import { ipcMain, dialog } from 'electron'
import { errorMessage } from '../pobLauncher/errors.js'

export function registerPobLauncherHandlers(service, getMainWindow) {
  const pick = async () => {
    const result = await dialog.showOpenDialog(getMainWindow(), { title: '选择 PoeCharm 安装目录', properties: ['openDirectory', 'createDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  }
  const operations = {
    state: () => service.getState(),
    directory: value => service.setDirectory(value),
    pick: () => service.pickDirectory(pick),
    install: () => service.install('install', pick),
    update: () => service.install('update'),
    start: () => service.start(),
    stop: operationId => service.stop(operationId)
  }
  for (const [name, operation] of Object.entries(operations)) {
    ipcMain.handle(`pob-launcher:${name}`, async (event, input) => {
      const owner = getMainWindow()
      if (!owner || owner.isDestroyed() || event.sender !== owner.webContents ||
        event.senderFrame !== owner.webContents.mainFrame) return { success: false, error: '只允许主窗口操作 PoB 启动助手' }
      try { return await operation(input) }
      catch (error) {
        service.report(error, 'ipc')
        return { success: false, error: `PoB 操作失败：${errorMessage(error)}`, state: service.snapshot() }
      }
    })
  }
  service.on('state', state => {
    const owner = getMainWindow()
    try {
      if (owner && !owner.isDestroyed() && !owner.webContents.isDestroyed?.()) owner.webContents.send('pob-launcher:state-changed', state)
    } catch (error) { service.report(error, 'notification') }
  })
}
