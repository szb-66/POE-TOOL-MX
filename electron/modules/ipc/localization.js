import { ipcMain, dialog } from 'electron'
import { localizedSearchExpression } from '../localization/searchExpression.js'

export function registerLocalizationHandlers(service, getMainWindow, runtime = null) {
  const operations = { status: () => service.getStatus(), scan: value => service.scan(value), check: () => service.check(), download: () => service.download(), apply: value => service.apply(value), restore: value => service.restore(value),
    catalog: input => {
      if (!Array.isArray(input?.texts) || input.texts.length > 2000 || input.texts.some(text => typeof text !== 'string' || text.length > 8192)) throw new Error('词库查询格式无效')
      const revision = runtime?.current().revision || ''
      const status = service.getStatus()
      if (status.mappingState === 'unavailable') throw Object.assign(new Error(status.mappingWarning || '当前汉化资源已失效，请先切简体再生成兼容正则'), { code: 'LOCALIZATION_UNAVAILABLE' })
      if (input.match != null && !['exact', 'contains'].includes(input.match)) throw new Error('词库匹配方式无效')
      return { revision, mappingState: status.mappingState || 'none', aliases: input.texts.map(text => ({ text, aliases: runtime?.dictionary.aliasesFor(text) || [text], displayText: runtime?.dictionary.localize(text) || text,
        ...(input.match === 'contains' ? { searchExpression: localizedSearchExpression(runtime?.dictionary, text) } : {}) })) }
    }
  }
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
