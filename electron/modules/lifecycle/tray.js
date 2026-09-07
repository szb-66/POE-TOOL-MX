import {
  WINDOW_CLOSE_BEHAVIOR_EXIT,
  WINDOW_CLOSE_BEHAVIOR_TRAY,
  normalizeWindowCloseBehavior
} from '../../../shared/windowCloseBehavior.js'

export function createApplicationTrayController({
  app,
  icon,
  createTray,
  createMenu,
  getMainWindow,
  activateMain = async () => {},
  requestCloseChoice = () => {},
  isQuitting = () => false
}) {
  let behavior = WINDOW_CLOSE_BEHAVIOR_EXIT
  let promptSuppressed = false
  let closeChoicePending = false
  let tray = null

  const showMainWindow = async () => {
    const window = getMainWindow()
    if (!window || window.isDestroyed()) return false
    if (window.isMinimized()) window.restore()
    if (!window.isVisible()) window.show()
    await activateMain()
    return true
  }

  const destroyTray = () => {
    if (!tray) return
    tray.destroy()
    tray = null
  }

  const requestQuit = () => app.quit()

  const ensureTray = () => {
    if (tray) return tray
    tray = createTray(icon)
    tray.setToolTip('流放助手')
    tray.setContextMenu(createMenu([
      { label: '显示主窗口', click: () => { void showMainWindow() } },
      { type: 'separator' },
      { label: '退出应用', click: requestQuit }
    ]))
    tray.on('click', () => { void showMainWindow() })
    return tray
  }

  const configure = (input = {}) => {
    const value = typeof input === 'string' ? input : input?.behavior
    behavior = normalizeWindowCloseBehavior(value)
    promptSuppressed = typeof input === 'string' ? true : input?.promptSuppressed === true
    if (behavior === WINDOW_CLOSE_BEHAVIOR_TRAY) ensureTray()
    else destroyTray()
    return { success: true, behavior, promptSuppressed }
  }

  const setBehavior = (value) => configure({ behavior: value, promptSuppressed: true })

  const handleMainWindowClose = (event, window) => {
    if (isQuitting()) return false
    if (!promptSuppressed) {
      event.preventDefault()
      closeChoicePending = true
      requestCloseChoice()
      return true
    }
    if (behavior !== WINDOW_CLOSE_BEHAVIOR_TRAY) return false
    event.preventDefault()
    window.hide()
    return true
  }

  const resolveCloseChoice = (input = {}) => {
    if (!closeChoicePending) return { success: false, error: '当前没有待处理的关闭选择' }
    closeChoicePending = false
    const selectedBehavior = normalizeWindowCloseBehavior(input.behavior)
    if (input.remember === true) {
      configure({ behavior: selectedBehavior, promptSuppressed: true })
    }
    if (selectedBehavior === WINDOW_CLOSE_BEHAVIOR_TRAY) {
      ensureTray()
      const window = getMainWindow()
      if (window && !window.isDestroyed()) window.hide()
    } else {
      requestQuit()
    }
    return { success: true, behavior: selectedBehavior, remembered: input.remember === true }
  }

  const cancelCloseChoice = () => {
    closeChoicePending = false
    return { success: true }
  }

  return {
    get behavior() {
      return behavior
    },
    get hasTray() {
      return Boolean(tray)
    },
    get promptSuppressed() {
      return promptSuppressed
    },
    configure,
    setBehavior,
    showMainWindow,
    handleMainWindowClose,
    resolveCloseChoice,
    cancelCloseChoice,
    requestQuit,
    dispose: destroyTray
  }
}
