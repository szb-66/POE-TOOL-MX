/**
 * Electron API 封装层
 * 统一管理 IPC 调用，提供语义化接口
 */

import { writeTextToClipboard } from '../utils/clipboardWriter.js'

const isElectron = typeof window !== 'undefined' && !!window.electronAPI

// Vue/Pinia expose nested state as Proxy objects. Electron's context bridge
// cannot clone those values, so every crafting payload must cross the bridge
// as plain data instead of leaking renderer reactivity into IPC.
const craftingIpcPayload = (value) => {
  if (value === null || typeof value !== 'object') return value
  return JSON.parse(JSON.stringify(value))
}

const mockApi = {
  system: {
    detectGameDpi: () => Promise.resolve({ found: false, primaryScaleFactor: 1, error: '非 Electron 环境' }),
  },
  script: {
    executePython: () => Promise.reject(new Error('非 Electron 环境')),
    generateAndExecute: () => Promise.reject(new Error('非 Electron 环境')),
    stop: () => Promise.resolve({ success: true }),
    getStatus: () => Promise.resolve({ isRunning: false }),
    onStatusChanged: () => () => {},
    detectPythonPath: () => Promise.resolve(null),
  },
  file: {
    save: () => Promise.resolve(true),
    read: () => Promise.resolve(''),
    getPaths: () => Promise.resolve({}),
    watcher: {
      start: () => Promise.resolve(true),
      stop: () => Promise.resolve(true),
    }
  },
  clipboard: {
    writeText: (text) => writeTextToClipboard(text),
  },
  shortcut: {
    initFromSettings: () => Promise.resolve({ success: true, failed: [] }),
    register: () => Promise.resolve({ success: true }),
    unregister: () => Promise.resolve({ success: true }),
    beginCapture: () => Promise.resolve({ success: true }),
    endCapture: () => Promise.resolve({ success: true, failed: [] }),
    onTriggered: () => { },
    onInit: () => { },
  },
  window: {
    minimize: () => { },
    maximize: () => { },
    close: () => { },
    toggleAlwaysOnTop: () => Promise.resolve(false),
    isAlwaysOnTop: () => Promise.resolve(false),
    onMaximized: () => { },
    openDebugOverlay: () => Promise.resolve({ success: true }),
    closeDebugOverlay: () => Promise.resolve({ success: true }),
    updateDebugOverlay: () => Promise.resolve({ success: true }),
    setDevToolsVisible: (visible) => Promise.resolve({ visible: Boolean(visible) }),
    getDevToolsVisible: () => Promise.resolve({ visible: false }),
    onDevToolsVisibilityChanged: () => () => { },
    pickScreenCoordinate: () => Promise.resolve({ canceled: true }),
    getScreenPickerContext: () => Promise.resolve({ mode: 'point' }),
    submitScreenCoordinate: () => { },
    submitScreenRegion: () => { },
    cancelScreenCoordinatePicker: () => { },
  },
  events: {
    onPythonOutput: () => { },
    onUpdateOverlay: () => { },
    onUpdateOverlaySettings: () => { },
    onScriptStopped: () => { },
    onBagDetectionMatch: () => () => { },
    onBagStashProgress: () => () => { },
    onBagStashCompleted: () => () => { },
    onBagStashStopped: () => () => { },
    onBagDetectionStopped: () => () => { },
    onUpdateDebugOverlay: () => { },
  },
  selectFile: () => Promise.resolve({ canceled: true, filePaths: [] }),
  copyFileToProject: () => Promise.resolve({ success: false }),
  overlay: {
    updateSettings: () => Promise.resolve({ success: true }),
  },
  bag: {
    startDetection: () => Promise.reject(new Error('非 Electron 环境')),
    stopDetection: () => Promise.resolve({ success: true }),
    startStash: () => Promise.reject(new Error('非 Electron 环境')),
    stopStash: () => Promise.resolve({ success: true }),
    updateOperationDelay: () => Promise.resolve({ success: true }),
    updatePreferences: () => Promise.resolve({ success: true }),
    uploadTemplate: () => Promise.reject(new Error('非 Electron 环境')),
    captureTemplate: () => Promise.reject(new Error('非 Electron 环境')),
    getOverlayState: () => Promise.resolve(null),
    onOverlayState: () => () => {},
  },
  combat: {
    startPotion: () => Promise.reject(new Error('非 Electron 环境')),
    stopPotion: () => Promise.resolve({ success: true }),
    getPotionStatus: () => Promise.resolve({ running: false, processId: null }),
    samplePixel: () => Promise.reject(new Error('非 Electron 环境')),
    executePortal: () => Promise.reject(new Error('非 Electron 环境')),
    onStatus: () => () => {}
  },
  storyOverlay: {
    open: () => Promise.resolve({ success: true }),
    close: () => Promise.resolve({ success: true }),
    update: () => Promise.resolve({ success: true }),
    getState: () => Promise.resolve(null),
    resize: () => Promise.resolve({ success: true }),
    onState: () => () => {}
  },
  crafting: {
    getStatus: () => Promise.resolve({ source: 'builtin', manifest: null }),
    listCategories: () => Promise.resolve([]),
    searchBases: () => Promise.resolve({ items: [], total: 0 }),
    searchModifiers: () => Promise.resolve({ items: [], total: 0 }),
    searchModifierCatalog: () => Promise.resolve({ groups: [], sourceCoverage: {}, totalFamilies: 0 }),
    createManualSession: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    applyManualCurrency: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    listManualEssences: () => Promise.resolve({ items: [], unresolvedCount: 0 }),
    applyManualEssence: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    listManualBenchCrafts: () => Promise.resolve({ items: [], unresolvedCount: 0 }),
    applyManualBenchCraft: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    listManualFossils: () => Promise.resolve({ items: [], resonators: [], supportedCount: 0 }),
    applyManualFossils: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    listManualHarvestCrafts: () => Promise.resolve({ items: [], categories: [], total: 0, executableCount: 0 }),
    applyManualHarvestCraft: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    listManualEldritchCrafts: () => Promise.resolve({ items: [], total: 0, executableCount: 0, dominance: { source: null, affixType: null, label: '无支配' } }),
    applyManualEldritchCraft: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    listManualInfluenceCrafts: () => Promise.resolve({ items: [], total: 0, executableCount: 0, donor: null, influenceLabels: {} }),
    listAwakenerDonorCandidates: () => Promise.resolve({ bases: [], influences: [], candidates: [] }),
    configureAwakenerDonor: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    clearAwakenerDonor: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    applyManualInfluenceCraft: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    listManualVeiledCrafts: () => Promise.resolve({ items: [], total: 0, executableCount: 0, pending: null, options: [], canUnveil: false, unveilUnavailableReason: '' }),
    applyManualVeiledCraft: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    selectManualVeiledOption: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    listManualBeastcrafts: () => Promise.resolve({ items: [], total: 0, executableCount: 0, beastLevel: 83, pendingSplitResults: [], imprint: null, foreseeing: false }),
    applyManualBeastcraft: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    selectManualSplitResult: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    previewManualCurrency: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    undoManualAction: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    redoManualAction: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    resetManualSession: () => Promise.reject(new Error('仅 Electron 客户端支持手动做装')),
    updateData: () => Promise.reject(new Error('仅 Electron 客户端支持数据更新')),
    cancelUpdate: () => Promise.resolve({ success: true }),
    getPrices: () => Promise.resolve({ records: [], overrides: {}, health: 'unavailable' }),
    refreshPrices: () => Promise.reject(new Error('仅 Electron 客户端支持价格更新')),
    setPriceOverride: () => Promise.resolve({ success: true }),
    removePriceOverride: () => Promise.resolve({ success: true }),
    startPlan: () => Promise.reject(new Error('仅 Electron 客户端支持做装计算')),
    cancelPlan: () => Promise.resolve({ success: true }),
    onUpdateProgress: () => () => {},
    onPlanEvent: () => () => {}
  }
}

export const electronApi = isElectron ? {
  system: {
    detectGameDpi: () => window.electronAPI.detectGameDpi?.(),
  },
  script: {
    executePython: (path, args) => window.electronAPI.executePython(path, args),
    generateAndExecute: (config) => window.electronAPI.generateAndExecuteScript(config),
    stop: () => window.electronAPI.stopScript(),
    getStatus: () => window.electronAPI.getScriptStatus(),
    onStatusChanged: (callback) => window.electronAPI.onScriptStatusChanged?.(callback) || (() => {}),
    detectPythonPath: () => window.electronAPI.detectPythonPath(),
  },

  file: {
    save: (path, content) => window.electronAPI.saveFile(path, content),
    read: (path) => window.electronAPI.readFile(path),
    getPaths: () => window.electronAPI.getFilePaths(),
    watcher: {
      start: (config) => window.electronAPI.startFileWatcher(config),
      stop: () => window.electronAPI.stopFileWatcher(),
    }
  },

  clipboard: {
    writeText: (text) => writeTextToClipboard(text, {
      electronWrite: window.electronAPI.writeClipboardText
    }),
  },

  shortcut: {
    initFromSettings: (shortcuts) => window.electronAPI.initShortcutsFromSettings(shortcuts),
    register: (accelerator, callback) => window.electronAPI.registerGlobalShortcut(accelerator, callback),
    unregister: (accelerator) => window.electronAPI.unregisterGlobalShortcut(accelerator),
    beginCapture: () => window.electronAPI.beginShortcutCapture?.(),
    endCapture: () => window.electronAPI.endShortcutCapture?.(),
    onTriggered: (callback) => window.electronAPI.onShortcutTriggered(callback),
    onInit: (callback) => window.electronAPI.onInitShortcuts(callback),
  },

  window: {
    minimize: () => window.electronAPI.minimizeWindow(),
    maximize: () => window.electronAPI.maximizeWindow(),
    close: () => window.electronAPI.closeWindow(),
    closeOverlay: () => window.electronAPI.closeOverlayWindow(),
    toggleAlwaysOnTop: () => window.electronAPI.toggleAlwaysOnTop(),
    isAlwaysOnTop: () => window.electronAPI.isAlwaysOnTop(),
    onMaximized: (callback) => window.electronAPI.onWindowMaximized(callback),
    move: (x, y) => window.electronAPI.moveWindow(x, y),
    openDebugOverlay: () => window.electronAPI.openDebugOverlay?.(),
    closeDebugOverlay: () => window.electronAPI.closeDebugOverlay?.(),
    updateDebugOverlay: (data) => window.electronAPI.updateDebugOverlay?.(data),
    setDevToolsVisible: (visible) => window.electronAPI.setDevToolsVisible?.(visible),
    getDevToolsVisible: () => window.electronAPI.getDevToolsVisible?.(),
    onDevToolsVisibilityChanged: (callback) => window.electronAPI.onDevToolsVisibilityChanged?.(callback),
    pickScreenCoordinate: () => window.electronAPI.pickScreenCoordinate?.(),
    getScreenPickerContext: () => window.electronAPI.getScreenPickerContext?.(),
    submitScreenCoordinate: (point) => window.electronAPI.submitScreenCoordinate?.(point),
    submitScreenRegion: (rectangle) => window.electronAPI.submitScreenRegion?.(rectangle),
    cancelScreenCoordinatePicker: () => window.electronAPI.cancelScreenCoordinatePicker?.()
  },
  setIgnoreMouseEvents: (ignore, options) => window.electronAPI.setIgnoreMouseEvents(ignore, options),

  events: {
    onPythonOutput: (callback) => window.electronAPI.onPythonScriptOutput(callback),
    onUpdateOverlay: (callback) => window.electronAPI.onUpdateOverlay(callback),
    onUpdateOverlaySettings: (callback) => window.electronAPI.onUpdateOverlaySettings(callback),
    onScriptStopped: (callback) => window.electronAPI.onScriptStopped(callback),
    onBagDetectionMatch: (callback) => window.electronAPI.onBagDetectionMatch?.(callback),
    onBagStashProgress: (callback) => window.electronAPI.onBagStashProgress?.(callback),
    onBagStashCompleted: (callback) => window.electronAPI.onBagStashCompleted?.(callback),
    onBagStashStopped: (callback) => window.electronAPI.onBagStashStopped?.(callback),
    onBagDetectionStopped: (callback) => window.electronAPI.onBagDetectionStopped?.(callback),
    onUpdateDebugOverlay: (callback) => window.electronAPI.onUpdateDebugOverlay?.(callback),
  },

  selectFile: () => window.electronAPI.selectFile(),
  copyFileToProject: (sourcePath) => window.electronAPI.copyFileToProject(sourcePath),

  overlay: {
    updateSettings: (settings) => window.electronAPI.updateOverlaySettings(settings),
  },

  bag: {
    startDetection: (config) => window.electronAPI.startBagDetection?.(config),
    stopDetection: () => window.electronAPI.stopBagDetection?.(),
    startStash: () => window.electronAPI.startBagStash?.(),
    stopStash: () => window.electronAPI.stopBagStash?.(),
    updateOperationDelay: (operationDelayMs) => window.electronAPI.updateBagOperationDelay?.(operationDelayMs),
    updatePreferences: (preferences) => window.electronAPI.updateBagPreferences?.(preferences),
    uploadTemplate: (path, type) => window.electronAPI.uploadBagTemplate?.(path, type),
    captureTemplate: (type) => window.electronAPI.captureBagTemplate?.(type),
    getOverlayState: () => window.electronAPI.getBagStashOverlayState?.(),
    onOverlayState: (callback) => window.electronAPI.onBagStashOverlayState?.(callback) || (() => {}),
  },

  combat: {
    startPotion: (payload) => window.electronAPI.startPotionAssist?.(payload),
    stopPotion: () => window.electronAPI.stopPotionAssist?.(),
    getPotionStatus: () => window.electronAPI.getPotionAssistStatus?.(),
    samplePixel: (payload) => window.electronAPI.sampleCombatPixel?.(payload),
    executePortal: (payload) => window.electronAPI.executePortalAssist?.(payload),
    onStatus: (callback) => window.electronAPI.onCombatStatus?.(callback) || (() => {})
  },

  storyOverlay: {
    open: (snapshot, width) => window.electronAPI.openStoryOverlay?.(snapshot, width),
    close: () => window.electronAPI.closeStoryOverlay?.(),
    update: (snapshot) => window.electronAPI.updateStoryOverlay?.(snapshot),
    getState: () => window.electronAPI.getStoryOverlayState?.(),
    resize: (size) => window.electronAPI.resizeStoryOverlay?.(size),
    onState: (callback) => window.electronAPI.onStoryOverlayState?.(callback) || (() => {})
  },

  crafting: {
    getStatus: () => window.electronAPI.getCraftingStatus?.(),
    listCategories: () => window.electronAPI.listCraftingCategories?.(),
    searchBases: (input) => window.electronAPI.searchCraftingBases?.(craftingIpcPayload(input)),
    searchModifiers: (input) => window.electronAPI.searchCraftingModifiers?.(craftingIpcPayload(input)),
    searchModifierCatalog: (input) => window.electronAPI.searchCraftingModifierCatalog?.(craftingIpcPayload(input)),
    createManualSession: (input) => window.electronAPI.createManualCraftingSession?.(craftingIpcPayload(input)),
    applyManualCurrency: (session, actionId) => window.electronAPI.applyManualCraftingCurrency?.(craftingIpcPayload(session), actionId),
    listManualEssences: (session) => window.electronAPI.listManualCraftingEssences?.(craftingIpcPayload(session)),
    applyManualEssence: (session, essenceId) => window.electronAPI.applyManualCraftingEssence?.(craftingIpcPayload(session), essenceId),
    listManualBenchCrafts: (session) => window.electronAPI.listManualCraftingBenchCrafts?.(craftingIpcPayload(session)),
    applyManualBenchCraft: (session, benchCraftId) => window.electronAPI.applyManualCraftingBenchCraft?.(craftingIpcPayload(session), benchCraftId),
    listManualFossils: (session) => window.electronAPI.listManualCraftingFossils?.(craftingIpcPayload(session)),
    applyManualFossils: (session, input) => window.electronAPI.applyManualCraftingFossils?.(craftingIpcPayload(session), craftingIpcPayload(input)),
    listManualHarvestCrafts: (session) => window.electronAPI.listManualCraftingHarvestCrafts?.(craftingIpcPayload(session)),
    applyManualHarvestCraft: (session, craftId) => window.electronAPI.applyManualCraftingHarvestCraft?.(craftingIpcPayload(session), craftId),
    listManualEldritchCrafts: (session) => window.electronAPI.listManualCraftingEldritchCrafts?.(craftingIpcPayload(session)),
    applyManualEldritchCraft: (session, actionId) => window.electronAPI.applyManualCraftingEldritchCraft?.(craftingIpcPayload(session), actionId),
    listManualInfluenceCrafts: (session) => window.electronAPI.listManualCraftingInfluenceCrafts?.(craftingIpcPayload(session)),
    listAwakenerDonorCandidates: (session, input) => window.electronAPI.listAwakenerDonorCandidates?.(craftingIpcPayload(session), craftingIpcPayload(input)),
    configureAwakenerDonor: (session, input) => window.electronAPI.configureAwakenerDonor?.(craftingIpcPayload(session), craftingIpcPayload(input)),
    clearAwakenerDonor: (session) => window.electronAPI.clearAwakenerDonor?.(craftingIpcPayload(session)),
    applyManualInfluenceCraft: (session, actionId) => window.electronAPI.applyManualCraftingInfluenceCraft?.(craftingIpcPayload(session), actionId),
    listManualVeiledCrafts: (session) => window.electronAPI.listManualCraftingVeiledCrafts?.(craftingIpcPayload(session)),
    applyManualVeiledCraft: (session, actionId) => window.electronAPI.applyManualCraftingVeiledCraft?.(craftingIpcPayload(session), actionId),
    selectManualVeiledOption: (session, modifierId, tierId) => window.electronAPI.selectManualCraftingVeiledOption?.(craftingIpcPayload(session), modifierId, tierId),
    listManualBeastcrafts: (session, input) => window.electronAPI.listManualCraftingBeastcrafts?.(craftingIpcPayload(session), craftingIpcPayload(input)),
    applyManualBeastcraft: (session, recipeId, input) => window.electronAPI.applyManualCraftingBeastcraft?.(craftingIpcPayload(session), recipeId, craftingIpcPayload(input)),
    selectManualSplitResult: (session, itemId) => window.electronAPI.selectManualCraftingSplitResult?.(craftingIpcPayload(session), itemId),
    previewManualCurrency: (session, actionId) => window.electronAPI.previewManualCraftingCurrency?.(craftingIpcPayload(session), actionId),
    undoManualAction: (session) => window.electronAPI.undoManualCraftingAction?.(craftingIpcPayload(session)),
    redoManualAction: (session) => window.electronAPI.redoManualCraftingAction?.(craftingIpcPayload(session)),
    resetManualSession: (session) => window.electronAPI.resetManualCraftingSession?.(craftingIpcPayload(session)),
    updateData: () => window.electronAPI.updateCraftingData?.(),
    cancelUpdate: () => window.electronAPI.cancelCraftingUpdate?.(),
    getPrices: () => window.electronAPI.getCraftingPrices?.(),
    refreshPrices: (force = false) => window.electronAPI.refreshCraftingPrices?.(force),
    setPriceOverride: (resourceId, value) => window.electronAPI.setCraftingPriceOverride?.(resourceId, value),
    removePriceOverride: (resourceId) => window.electronAPI.removeCraftingPriceOverride?.(resourceId),
    startPlan: (request, options) => window.electronAPI.startCraftingPlan?.(request, options),
    cancelPlan: (taskId) => window.electronAPI.cancelCraftingPlan?.(taskId),
    onUpdateProgress: (callback) => window.electronAPI.onCraftingUpdateProgress?.(callback) || (() => {}),
    onPlanEvent: (callback) => window.electronAPI.onCraftingPlanEvent?.(callback) || (() => {})
  }
} : mockApi
