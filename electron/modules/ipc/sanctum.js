import { ipcMain } from 'electron'

export function registerSanctumHandlers(service, { getMainWindow, emergencyStop }) {
  const send = state => {
    const window = getMainWindow()
    if (window && !window.isDestroyed()) window.webContents.send('sanctum:state', state)
  }
  const unsubscribe = service.subscribe(send)
  const actions = {
    getState: () => service.getState(),
    getRoomEvidence: binding => service.getRoomEvidence(binding),
    getEffectEvidence: binding => service.getEffectEvidence(binding),
    startLive: () => service.startLive(),
    rescanEffects: () => service.rescanEffects(),
    correctRunResources: (binding,value) => service.correctRunResources(binding,value),
    correctRewardLedger: (binding,value) => service.correctRewardLedger(binding,value),
    readRunPanel: kind => service.readRunPanel(kind),
    getControlState: () => service.controlOverlay?.getState(),
    moveControlOverlay: () => {},
    captureCalibration: (key, dimensions) => service.calibrationEditor.capture(key, dimensions),
    clearLiveCalibration: key => service.calibrationEditor.clear(key),
    saveGridCells: (id, cells) => service.calibrationEditor.saveCells(id, cells),
    selectSampleCell: (id, kind, index) => service.calibrationEditor.sample(id, kind, index),
    selectPathColor: point => service.calibrationEditor.pathColor(point),
    scanRelics: id => service.scanRelics(id),
    setEnabled: value => service.setEnabled(value),
    setModuleEnabled: value => service.setModuleEnabled(value),
    samples: () => service.samples(),
    stop: async () => { await emergencyStop.stopAll('sanctum-page'); return service.getState() },
    rescan: id => service.rescan(id),
    resetRun: () => service.resetRun(),
    correctRoom: (id, patch) => service.correctRoom(id, patch),
    setMarks: value => service.setMarks(value),
    setCurrentRoom: value => service.setCurrentRoom(value),
    rescanRoom: value => service.rescanRoom(value),
    saveStrategy: value => service.saveStrategy(value),
    calibrate: value => service.calibrate(value),
    clearCalibration: id => service.clearCalibration(id),
    saveLoadoutPreferences: value => service.saveLoadoutPreferences(value),
    solveLoadout: () => service.solveLoadout(),
    cancelSolve: () => service.cancelSolve(),
    previewLoadout: index => service.previewLoadout(index),
    highlightRelic: id => service.highlightRelic(id)
  }
  for (const [name, handler] of Object.entries(actions)) ipcMain.handle(`sanctum:${name}`, async (event, ...args) => {
    const window = getMainWindow()
    const control = service.controlOverlay?.owns(event.sender) && ['startLive', 'stop', 'getControlState', 'moveControlOverlay'].includes(name)
    if (!control && (!window || window.isDestroyed() || event.sender !== window.webContents)) return { success: false, error: '圣所操作只允许主窗口调用' }
    try {
      if (!['getState', 'getEffectEvidence', 'getRoomEvidence', 'getControlState', 'setEnabled', 'setModuleEnabled', 'samples', 'stop', 'cancelSolve', 'previewLoadout'].includes(name)) service.assertEnabled()
      return { success: true, data: name === 'moveControlOverlay' ? service.controlOverlay?.move(event.sender, args[0]) : await handler(...args) }
    }
    catch (error) { return { success: false, error: String(error.message || '圣所操作失败').slice(0, 240) } }
  })
  return () => { unsubscribe(); for (const name of Object.keys(actions)) ipcMain.removeHandler(`sanctum:${name}`) }
}
