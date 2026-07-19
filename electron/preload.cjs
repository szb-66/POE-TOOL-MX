const { contextBridge, ipcRenderer } = require('electron')

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  executePython: (scriptPath, args) => {
    return ipcRenderer.invoke('execute-python', scriptPath, args)
  },
  saveFile: (filePath, content) => {
    return ipcRenderer.invoke('save-file', filePath, content)
  },
  readFile: (filePath) => {
    return ipcRenderer.invoke('read-file', filePath)
  },
  stopScript: () => {
    return ipcRenderer.invoke('stop-script')
  },
  getScriptStatus: () => {
    return ipcRenderer.invoke('get-script-status')
  },
  detectPythonPath: () => {
    return ipcRenderer.invoke('detect-python-path')
  },
  startFileWatcher: (config) => {
    return ipcRenderer.invoke('start-file-watcher', config)
  },
  stopFileWatcher: () => {
    return ipcRenderer.invoke('stop-file-watcher')
  },
  getFilePaths: () => {
    return ipcRenderer.invoke('get-file-paths')
  },
  registerGlobalShortcut: (accelerator, callback) => {
    return ipcRenderer.invoke('register-global-shortcut', accelerator, callback)
  },
  unregisterGlobalShortcut: (accelerator) => {
    return ipcRenderer.invoke('unregister-global-shortcut', accelerator)
  },
  generateAndExecuteScript: (config) => {
    return ipcRenderer.invoke('generate-and-execute-script', config)
  },
  onShortcutTriggered: (callback) => {
    ipcRenderer.on('shortcut-triggered', (event, accelerator) => {
      callback(accelerator)
    })
  },
  initShortcutsFromSettings: (shortcuts) => {
    return ipcRenderer.invoke('init-shortcuts-from-settings', shortcuts)
  },
  onInitShortcuts: (callback) => {
    ipcRenderer.on('init-shortcuts', () => {
      callback()
    })
  },
  onPythonScriptOutput: (callback) => {
    ipcRenderer.on('python-script-output', (event, data) => {
      callback(data)
    })
  },
  onUpdateOverlay: (callback) => {
    ipcRenderer.on('update-overlay', (event, data) => {
      callback(data)
    })
  },
  onUpdateOverlaySettings: (callback) => {
    ipcRenderer.on('update-overlay-settings', (event, settings) => {
      callback(settings)
    })
  },
  onScriptStopped: (callback) => {
    ipcRenderer.on('script-stopped', (event, data) => {
      callback(data)
    })
  },
  selectFile: () => ipcRenderer.invoke('select-file'),
  copyFileToProject: (sourcePath) => ipcRenderer.invoke('copy-file-to-project', sourcePath),
  updateOverlaySettings: (settings) => ipcRenderer.invoke('update-overlay-settings', settings),
  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  closeOverlayWindow: () => ipcRenderer.invoke('close-overlay-window'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window-toggle-always-on-top'),
  isAlwaysOnTop: () => ipcRenderer.invoke('window-is-always-on-top'),
  setDevToolsVisible: (visible) => ipcRenderer.invoke('set-devtools-visible', visible),
  getDevToolsVisible: () => ipcRenderer.invoke('get-devtools-visible'),
  onDevToolsVisibilityChanged: (callback) => {
    const listener = (event, visible) => callback(visible)
    ipcRenderer.on('devtools-visibility-changed', listener)
    return () => ipcRenderer.removeListener('devtools-visibility-changed', listener)
  },
  pickScreenCoordinate: () => ipcRenderer.invoke('pick-screen-coordinate'),
  submitScreenCoordinate: (point) => ipcRenderer.send('coordinate-picker-select', point),
  cancelScreenCoordinatePicker: () => ipcRenderer.send('coordinate-picker-cancel'),
  setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),
  moveWindow: (x, y) => ipcRenderer.send('window-move', { x, y }),
  onWindowMaximized: (callback) => {
    ipcRenderer.on('window-maximized', (event, isMaximized) => {
      callback(isMaximized)
    })
  },
  // 调试覆盖层
  openDebugOverlay: () => ipcRenderer.invoke('open-debug-overlay'),
  closeDebugOverlay: () => ipcRenderer.invoke('close-debug-overlay'),
  updateDebugOverlay: (data) => ipcRenderer.invoke('update-debug-overlay', data),
  onUpdateDebugOverlay: (callback) => {
    ipcRenderer.on('update-debug-overlay', (event, data) => {
      callback(data)
    })
  },
  // 背包自动入库
  startBagDetection: (config) => ipcRenderer.invoke('start-bag-detection', config),
  stopBagDetection: () => ipcRenderer.invoke('stop-bag-detection'),
  startBagStash: (config) => ipcRenderer.invoke('start-bag-stash', config),
  stopBagStash: () => ipcRenderer.invoke('stop-bag-stash'),
  uploadBagTemplate: (path, type) => ipcRenderer.invoke('upload-bag-template', path, type),
  onBagDetectionMatch: (callback) => {
    ipcRenderer.on('bag-detection-match', (event, data) => {
      callback(data)
    })
  },
  onBagStashProgress: (callback) => {
    ipcRenderer.on('bag-stash-progress', (event, data) => {
      callback(data)
    })
  },
  onBagStashCompleted: (callback) => {
    ipcRenderer.on('bag-stash-completed', (event, data) => {
      callback(data)
    })
  },
  onBagStashStopped: (callback) => {
    ipcRenderer.on('bag-stash-stopped', (event, data) => {
      callback(data)
    })
  },
  onBagDetectionStopped: (callback) => {
    ipcRenderer.on('bag-detection-stopped', (event, data) => {
      callback(data)
    })
  }
})
