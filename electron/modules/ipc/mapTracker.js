import { BrowserWindow, dialog, ipcMain, screen } from 'electron'
import { getFixedOverlayDragBounds } from '../window/overlayDrag.js'
import { MAP_TRACKER_OVERLAY_SIZE } from '../mapTracker/overlay.js'
import { mapTrackerIpcObject as object, mapTrackerIpcText as text, sanitizeMapTrackerPatch, sanitizeMapTrackerQuery } from './mapTrackerValidation.js'

const invoke = (handler) => async (_event, ...args) => {
  try { return { success: true, data: await handler(...args) } } catch (error) { return { success: false, error: { message: String(error?.message || '地图跟踪操作失败').slice(0, 240) } } }
}

export function registerMapTrackerHandlers(service, { getMainWindow = () => null, overlay = null } = {}) {
  service.onSnapshot((snapshot) => { for (const window of BrowserWindow.getAllWindows()) if (!window.isDestroyed()) window.webContents.send('map-tracker:snapshot', snapshot) })
  ipcMain.handle('map-tracker:status', invoke(() => service.snapshot()))
  ipcMain.handle('map-tracker:settings', invoke((patch) => service.updateSettings(sanitizeMapTrackerPatch(patch))))
  ipcMain.handle('map-tracker:query', invoke((filters) => service.query(sanitizeMapTrackerQuery(filters))))
  ipcMain.handle('map-tracker:edit', invoke((id, patch) => service.editRun(text(id, 80), object(patch))))
  ipcMain.handle('map-tracker:delete', invoke((id, confirmed) => { if (confirmed !== true) throw new Error('删除操作需要确认'); return service.deleteRun(text(id, 80)) }))
  ipcMain.handle('map-tracker:export', invoke(async (filters) => {
    const result = await dialog.showSaveDialog(getMainWindow(), { title: '导出地图记录', defaultPath: 'map-tracker.csv', filters: [{ name: 'CSV', extensions: ['csv'] }] })
    if (result.canceled || !result.filePath) return { canceled: true, count: 0 }
    return { canceled: false, ...await service.exportCsv(sanitizeMapTrackerQuery(filters), result.filePath) }
  }))
  ipcMain.handle('map-tracker:overlay', invoke((action) => { if (!['show', 'hide', 'reset'].includes(action)) throw new Error('浮窗动作无效'); return overlay?.control(action) || { available: false } }))
  ipcMain.on('map-tracker:overlay-move', (event, point = {}) => {
    const win = overlay?.getWindow?.()
    if (!win || win.webContents !== event.sender) return
    const session = overlay.dragSession
    if (point.phase === 'start') { if (session.begin(event.sender.id, point, win.getBounds())) overlay.setDragging(true); return }
    if (point.phase === 'end') {
      if (!session.end(event.sender.id)) return
      overlay.setDragging(false)
      const bounds = win.getBounds()
      service.updateSettings({ overlay: { ...service.snapshot().settings.overlay, x: bounds.x, y: bounds.y } }).catch(() => {})
      return
    }
    if (point.phase !== 'move') return
    const requested = session.move(event.sender.id, point)
    if (!requested) return
    const workArea = screen.getDisplayNearestPoint(requested).workArea
    win.setBounds(getFixedOverlayDragBounds(requested, workArea, MAP_TRACKER_OVERLAY_SIZE), false)
  })
}
