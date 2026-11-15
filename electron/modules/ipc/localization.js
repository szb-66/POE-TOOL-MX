import { ipcMain, dialog } from 'electron'

export function registerLocalizationHandlers(service, getMainWindow) {
  const operations = { status: () => service.getStatus(), scan: value => service.scan(value), check: () => service.check(), download: () => service.download(), preview: value => service.preview(value), apply: value => service.apply(value), restore: value => service.restore(value) }
  for (const [name, operation] of Object.entries(operations)) {
    ipcMain.handle(`localization:${name}`, async (event, input) => {
      const owner = getMainWindow()
      if (!owner || owner.isDestroyed() || event.sender !== owner.webContents || event.senderFrame !== owner.webContents.mainFrame) return { success: false, error: { code: 'LOCALIZATION_OWNER_REQUIRED', message: '仅允许主窗口操作游戏汉化' } }
      try { service.requireInternational(); return { success: true, data: await operation(input) } }
      catch (error) { return { success: false, error: { code: error.code || 'LOCALIZATION_FAILED', message: error.message } } }
    })
  }
  ipcMain.handle('localization:pick-directory', async event => {
    const owner = getMainWindow()
    if (!owner || owner.isDestroyed() || event.sender !== owner.webContents || event.senderFrame !== owner.webContents.mainFrame) return { success: false, error: { message: '仅允许主窗口选择游戏目录' } }
    try {
      service.requireInternational()
      const result = await dialog.showOpenDialog(owner, { title: '选择 Steam 国际服游戏安装目录', properties: ['openDirectory'] })
      return { success: true, canceled: result.canceled, gameDirectory: result.filePaths[0] || '' }
    } catch (error) { return { success: false, error: { message: error.message } } }
  })
  service.on('state', state => {
    const owner = getMainWindow()
    try {
      if (owner && !owner.isDestroyed() && !owner.webContents.isDestroyed?.()) owner.webContents.send('localization:state-changed', state)
    } catch { /* 窗口销毁不能中断正在提交的原生文件事务 */ }
  })
}
