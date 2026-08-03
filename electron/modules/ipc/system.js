import { app, dialog, ipcMain, screen } from 'electron'
import { writeFile } from 'node:fs/promises'
import { detectGameDpi } from '../system/gameDpi.js'
import {
  createDiagnosticsSnapshot,
  detectAdministrator,
  diagnosticFileName,
  safeExportResult
} from '../system/diagnostics.js'
import { createStartupHealth } from '../system/health.js'

export function registerSystemHandlers(python, gameWindowTitles) {
  const displaySnapshot = () => screen.getAllDisplays().map((display) => ({
    id: display.id,
    primary: display.id === screen.getPrimaryDisplay()?.id,
    bounds: display.bounds,
    scaleFactor: display.scaleFactor,
    rotation: display.rotation
  }))
  const detectDpi = async () => {
    const primaryScaleFactor = Number(screen.getPrimaryDisplay()?.scaleFactor) || 1
    const result = await detectGameDpi({
      pythonPath: python.detectPythonPath?.(),
      gameWindowTitles: gameWindowTitles?.getTitles?.()
    })
    return { ...result, primaryScaleFactor }
  }
  const snapshot = async (modules = []) => createDiagnosticsSnapshot({
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    chromiumVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
    administrator: detectAdministrator(),
    displays: displaySnapshot(),
    runtime: python.resolvePythonRuntime?.(['cv2', 'mss', 'numpy', 'pynput', 'pyperclip'])
      || { ready: Boolean(python.detectPythonPath?.()), source: 'system' },
    gameDpi: await detectDpi(),
    modules
  })

  ipcMain.handle('system-detect-game-dpi', detectDpi)
  ipcMain.handle('system-update-game-window-titles', async (_event, titles) => {
    try {
      return { success: true, titles: gameWindowTitles.update(titles) }
    } catch (error) {
      return { success: false, error: error.message || String(error) }
    }
  })
  ipcMain.handle('system-get-startup-health', async () => {
    const runtime = python.resolvePythonRuntime?.(['cv2', 'mss', 'numpy', 'pynput', 'pyperclip'])
      || { ready: Boolean(python.detectPythonPath?.()), source: 'system' }
    return createStartupHealth({
      userDataPath: app.getPath('userData'),
      displays: displaySnapshot(),
      runtime,
      gameDpi: await detectDpi(),
      administrator: detectAdministrator()
    })
  })
  ipcMain.handle('system-get-diagnostics', (_event, modules) => snapshot(modules))
  ipcMain.handle('system-export-diagnostics', async (_event, modules) => {
    const result = await dialog.showSaveDialog({
      title: '导出脱敏诊断',
      defaultPath: diagnosticFileName(),
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return { success: false, canceled: true }
    await writeFile(result.filePath, `${JSON.stringify(await snapshot(modules), null, 2)}\n`, 'utf8')
    return safeExportResult(result.filePath)
  })
}
