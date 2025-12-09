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
  setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),
  moveWindow: (x, y) => ipcRenderer.send('window-move', { x, y }),
  onWindowMaximized: (callback) => {
    ipcRenderer.on('window-maximized', (event, isMaximized) => {
      callback(isMaximized)
    })
  }
})
