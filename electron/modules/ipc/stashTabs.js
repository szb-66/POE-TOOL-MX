import { ipcMain } from 'electron'
import { runStashTabSelector } from '../stashTabs/service.js'

export function registerStashTabHandlers(python, window, fileWatcher) {
  ipcMain.handle('stash-tabs-pick-root-region', async () => {
    try {
      const picked = await window.pickScreenRegion({
        purpose: 'stash-tabs-list',
        title: '框选仓库页列表区域',
        hint: '拖动框选展开后的仓库页列表完整范围，按 Esc 取消',
        minimumSize: { width: 60, height: 60 }
      })
      if (picked?.canceled) return { success: true, canceled: true }
      if (picked?.success === false) return { success: false, error: picked.error?.message || '框选仓库列表失败' }
      return {
        success: true,
        canceled: false,
        rootRegion: {
          ...picked.selectedRegion,
          displayId: picked.displayId,
          scaleFactor: picked.scaleFactor,
          displayPhysicalBounds: picked.displayPhysicalBounds,
          capturedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      return { success: false, error: error.message || String(error) }
    }
  })

  ipcMain.handle('stash-tabs-preview', async (_event, config = {}) => {
    try {
      if (!config.rootRegion) return { success: false, error: '请先框选根目录仓库列表区域' }
      return await runStashTabSelector({ python, fileWatcher, mode: 'preview', config })
    } catch (error) {
      return { success: false, error: error.message || String(error) }
    }
  })
}
