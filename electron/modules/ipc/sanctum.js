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
    getEffectReview: binding => service.getEffectReview(binding),
    correctEffectTarget: (binding,value) => service.correctEffectTarget(binding,value),
    getEffectCorrectionRules: () => service.getEffectCorrectionRules(),
    updateEffectCorrectionRule: (binding,value) => service.updateEffectCorrectionRule(binding,value),
    deleteEffectCorrectionRule: binding => service.deleteEffectCorrectionRule(binding),
    startLive: () => service.startLive(),
    rescanEffects: () => service.rescanEffects(),
    correctRunResources: (binding,value) => service.correctRunResources(binding,value),
    readRunPanel: kind => service.readRunPanel(kind),
    getControlState: () => service.controlOverlay?.getState(),
    moveControlOverlay: () => {},
    captureCalibration: key => service.calibrationEditor.capture(key),
    getCalibrationCollection: () => service.calibrationEditor.collection.view(),
    captureCalibrationCollection: () => service.calibrationEditor.collection.capture(),
    confirmCalibrationCollection: value => service.calibrationEditor.collection.confirm(value),
    saveCalibrationCollection: value => service.calibrationEditor.collection.save(value),
    discardCalibrationCollection: value => service.calibrationEditor.collection.discard(value),
    cancelCalibrationCollection: () => { service.calibrationEditor.cancel(); return { canceled: true } },
    clearLiveCalibration: key => service.calibrationEditor.clear(key),
    selectPathColor: point => service.calibrationEditor.pathColor(point),
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
  }
  for (const [name, handler] of Object.entries(actions)) ipcMain.handle(`sanctum:${name}`, async (event, ...args) => {
    const window = getMainWindow()
    const control = service.controlOverlay?.owns(event.sender) && ['startLive', 'stop', 'getControlState', 'moveControlOverlay'].includes(name)
    if (!control && (!window || window.isDestroyed() || event.sender !== window.webContents)) return { success: false, error: '圣所操作只允许主窗口调用' }
    try {
      if (!['getState', 'getCalibrationCollection', 'cancelCalibrationCollection', 'getEffectEvidence', 'getRoomEvidence', 'getControlState', 'setEnabled', 'setModuleEnabled', 'samples', 'stop'].includes(name)) service.assertEnabled()
      return { success: true, data: name === 'moveControlOverlay' ? service.controlOverlay?.move(event.sender, args[0]) : await handler(...args) }
    }
    catch (error) { return { success: false, error: String(error.message || '圣所操作失败').slice(0, 240) } }
  })
  return () => { unsubscribe(); for (const name of Object.keys(actions)) ipcMain.removeHandler(`sanctum:${name}`) }
}
