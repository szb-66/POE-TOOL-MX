/**
 * Electron API 封装层
 * 统一管理 IPC 调用，提供语义化接口
 */

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
  shortcut: {
    initFromSettings: () => Promise.resolve(true),
    register: () => Promise.resolve(true),
    unregister: () => Promise.resolve(true),
    onTriggered: () => {},
    onInit: () => {},
  },
  window: {
    minimize: () => {},
    maximize: () => {},
    close: () => {},
    toggleAlwaysOnTop: () => Promise.resolve(false),
    isAlwaysOnTop: () => Promise.resolve(false),
    onMaximized: () => {},
  },
  events: {
    onPythonOutput: () => {},
    onUpdateOverlay: () => {},
    onUpdateOverlaySettings: () => {},
    onScriptStopped: () => {},
  },
  selectFile: () => Promise.resolve({ canceled: true, filePaths: [] }),
  copyFileToProject: () => Promise.resolve({ success: false }),
  overlay: {
    updateSettings: () => Promise.resolve({ success: true }),
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
  
  shortcut: {
    initFromSettings: (shortcuts) => window.electronAPI.initShortcutsFromSettings(shortcuts),
    register: (accelerator, callback) => window.electronAPI.registerGlobalShortcut(accelerator, callback),
    unregister: (accelerator) => window.electronAPI.unregisterGlobalShortcut(accelerator),
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
    move: (x, y) => window.electronAPI.moveWindow(x, y)
  },
  setIgnoreMouseEvents: (ignore, options) => window.electronAPI.setIgnoreMouseEvents(ignore, options),

  events: {
    onPythonOutput: (callback) => window.electronAPI.onPythonScriptOutput(callback),
    onUpdateOverlay: (callback) => window.electronAPI.onUpdateOverlay(callback),
    onUpdateOverlaySettings: (callback) => window.electronAPI.onUpdateOverlaySettings(callback),
    onScriptStopped: (callback) => window.electronAPI.onScriptStopped(callback),
  },

  selectFile: () => window.electronAPI.selectFile(),
  copyFileToProject: (sourcePath) => window.electronAPI.copyFileToProject(sourcePath),

  overlay: {
    updateSettings: (settings) => window.electronAPI.updateOverlaySettings(settings),
  }
} : mockApi

