import { app, dialog, ipcMain, screen } from 'electron'
import { detectGameDpi } from '../system/gameDpi.js'
import {
  createDiagnosticsSnapshot,
  detectAdministrator,
  sanitizeHealthStates,
  sanitizeModuleStates
} from '../system/diagnostics.js'
import { createStartupHealth } from '../system/health.js'
import { exportDiagnosticsFile } from '../system/diagnosticExport.js'

const HEALTH_OPERATIONS = {
  platform: 'platform_check', userData: 'user_data_check', administrator: 'administrator_check',
  displays: 'display_check', network: 'network_check', runtime: 'runtime_check', game: 'game_window_check'
}

function healthReasonCode(item) {
  if (item.status === 'ready') return null
  if (item.id === 'platform') return item.arch && item.arch !== 'x64' ? 'unsupported_arch' : 'unsupported_platform'
  if (item.id === 'userData') return 'directory_unwritable'
  if (item.id === 'administrator') return 'permission_denied'
  if (item.id === 'network') return 'network_unavailable'
  if (item.id === 'runtime') return 'runtime_unavailable'
  if (item.id === 'game') return 'game_window_not_found'
  return 'unavailable'
}

export function registerSystemHandlers(python, gameWindowTitles, diagnosticEvents = null) {
  const displaySnapshot = () => screen.getAllDisplays().map(display => ({
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
      gameWindowTitles: gameWindowTitles?.getTitles?.(),
      gameWindowProcessNames: gameWindowTitles?.getProcessNames?.()
    })
    return { ...result, primaryScaleFactor }
  }
  const collectEnvironment = async () => {
    const displays = displaySnapshot()
    const administrator = detectAdministrator()
    const runtime = python.resolvePythonRuntime?.(['cv2', 'mss', 'numpy', 'pynput', 'pyperclip'])
      || { ready: Boolean(python.detectPythonPath?.()), source: 'system' }
    const gameDpi = await detectDpi()
    const health = await createStartupHealth({
      userDataPath: app.getPath('userData'), displays, runtime, gameDpi, administrator
    })
    return { displays, administrator, runtime, gameDpi, health }
  }
  const recordHealth = async (items = []) => {
    if (!diagnosticEvents) return
    await Promise.all(items.map(item => diagnosticEvents.record({
      area: 'system',
      operation: HEALTH_OPERATIONS[item.id],
      outcome: item.status === 'ready' ? 'recovered' : 'failed',
      reasonCode: healthReasonCode(item),
      metadata: item.id === 'network' ? { activeCount: item.activeCount } : undefined
    })))
  }
  const snapshot = async (payload = {}) => {
    const normalized = Array.isArray(payload) ? { modules: payload } : (payload || {})
    const environment = await collectEnvironment()
    await recordHealth(environment.health.items)
    const eventDocument = diagnosticEvents ? await diagnosticEvents.read() : { events: [], corrupt: false }
    return createDiagnosticsSnapshot({
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      chromiumVersion: process.versions.chrome,
      nodeVersion: process.versions.node,
      packaged: app.isPackaged,
      administrator: environment.administrator,
      displays: environment.displays,
      runtime: environment.runtime,
      gameDpi: environment.gameDpi,
      health: [
        ...environment.health.items.map(item => ({
          id: item.id, status: item.status, reasonCode: healthReasonCode(item)
        })),
        ...sanitizeHealthStates(normalized.rendererHealth),
        {
          id: 'diagnosticEvents',
          status: eventDocument.corrupt ? 'attention' : 'ready',
          ...(eventDocument.corrupt ? { reasonCode: 'event_store_corrupt' } : {})
        }
      ],
      modules: sanitizeModuleStates(normalized.modules),
      recentEvents: eventDocument.events
    })
  }

  ipcMain.handle('system-detect-game-dpi', detectDpi)
  ipcMain.handle('system-update-game-window-titles', async (_event, titles) => {
    try {
      const result = gameWindowTitles.update(titles)
      return { success: true, titles: result.titles, processNames: result.processNames }
    } catch (error) {
      return { success: false, error: error.message || String(error) }
    }
  })
  ipcMain.handle('system-update-game-window-process-names', async (_event, processNames) => {
    try {
      const result = gameWindowTitles.updateProcessNames(processNames)
      return { success: true, titles: result.titles, processNames: result.processNames }
    } catch (error) {
      return { success: false, error: error.message || String(error) }
    }
  })
  ipcMain.handle('system-get-startup-health', async () => {
    const environment = await collectEnvironment()
    await recordHealth(environment.health.items)
    return environment.health
  })
  ipcMain.handle('system-get-diagnostics', (_event, payload) => snapshot(payload))
  ipcMain.handle('system-record-diagnostic-event', async (_event, candidate) => (
    diagnosticEvents?.record(candidate) || { recorded: false, reason: 'store_unavailable' }
  ))
  ipcMain.handle('system-export-diagnostics', (_event, payload) => exportDiagnosticsFile({
    showSaveDialog: options => dialog.showSaveDialog(options),
    buildSnapshot: () => snapshot(payload)
  }))
}
