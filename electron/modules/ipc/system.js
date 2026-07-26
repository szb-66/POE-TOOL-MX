import { ipcMain, screen } from 'electron'
import { detectGameDpi } from '../system/gameDpi.js'

export function registerSystemHandlers(python) {
  ipcMain.handle('system-detect-game-dpi', async () => {
    const primaryScaleFactor = Number(screen.getPrimaryDisplay()?.scaleFactor) || 1
    const result = await detectGameDpi({ pythonPath: python.detectPythonPath?.() })
    return { ...result, primaryScaleFactor }
  })
}
