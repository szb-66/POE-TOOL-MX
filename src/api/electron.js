/**
 * Electron API 封装层
 * 统一管理 IPC 调用，提供语义化接口
 */

import { writeTextToClipboard } from '../utils/clipboardWriter.js'

const isElectron = typeof window !== 'undefined' && !!window.electronAPI

const mockApi = {
  script: {
    executePython: () => Promise.reject(new Error('非 Electron 环境')),
    generateAndExecute: () => Promise.reject(new Error('非 Electron 环境')),
    stop: () => Promise.resolve({ success: true }),
    getStatus: () => Promise.resolve({ isRunning: false }),
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
    uploadTemplate: () => Promise.reject(new Error('非 Electron 环境')),
    captureTemplate: () => Promise.reject(new Error('非 Electron 环境')),
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
  script: {
    executePython: (path, args) => window.electronAPI.executePython(path, args),
    generateAndExecute: (config) => window.electronAPI.generateAndExecuteScript(config),
    stop: () => window.electronAPI.stopScript(),
    getStatus: () => window.electronAPI.getScriptStatus(),
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
    uploadTemplate: (path, type) => window.electronAPI.uploadBagTemplate?.(path, type),
    captureTemplate: (type) => window.electronAPI.captureBagTemplate?.(type),
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
    open: (snapshot) => window.electronAPI.openStoryOverlay?.(snapshot),
    close: () => window.electronAPI.closeStoryOverlay?.(),
    update: (snapshot) => window.electronAPI.updateStoryOverlay?.(snapshot),
    getState: () => window.electronAPI.getStoryOverlayState?.(),
    resize: (height) => window.electronAPI.resizeStoryOverlay?.(height),
    onState: (callback) => window.electronAPI.onStoryOverlayState?.(callback) || (() => {})
  },

  crafting: {
    getStatus: () => window.electronAPI.getCraftingStatus?.(),
    listCategories: () => window.electronAPI.listCraftingCategories?.(),
    searchBases: (input) => window.electronAPI.searchCraftingBases?.(input),
    searchModifiers: (input) => window.electronAPI.searchCraftingModifiers?.(input),
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
