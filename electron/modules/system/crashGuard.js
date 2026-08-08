/**
 * Purpose: 收集主进程、渲染进程和 Chromium 子进程启动故障，并执行至多一次安全模式恢复。
 * Inputs: Electron app、启动日志、进程对象、启动时刻与失败提示回调。
 * Outputs: 安装/卸载生命周期监听；记录稳定原因码；必要时以禁用 GPU 参数重启。
 * Preconditions: install() 应在 ready 前调用，observeWindow() 应在窗口创建后立即调用。
 * Edge cases: 安全模式、恢复窗口外及非白名单退出原因只记录不重启。
 */

const RECOVERABLE_RENDERER_REASONS = new Set(['crashed', 'abnormal-exit'])
const RECOVERABLE_CHILD_REASONS = new Set(['crashed', 'abnormal-exit'])
const QUIET_REASONS = new Set(['clean-exit'])
const SAFE_MODE_ARGUMENTS = Object.freeze(['--disable-gpu', '--startup-safe-mode'])

function normalizedReason(details) {
  return String(details?.reason || 'unknown').toLowerCase()
}

function reasonCode(source, details) {
  const reason = normalizedReason(details).replace(/[^a-z0-9]+/g, '_')
  return `${source}_${reason || 'unknown'}`
}

export function shouldRecoverStartupCrash({
  source,
  details = {},
  startedAt,
  now = Date.now(),
  graceMs = 30000,
  safeMode = false
} = {}) {
  if (safeMode || !Number.isFinite(startedAt) || now - startedAt > graceMs || now < startedAt) return false
  const reason = normalizedReason(details)
  if (source === 'renderer') return RECOVERABLE_RENDERER_REASONS.has(reason)
  if (source === 'child') {
    return String(details?.type || '').toLowerCase() === 'gpu' && RECOVERABLE_CHILD_REASONS.has(reason)
  }
  return false
}

export function buildSafeModeArgs(args = []) {
  const result = [...args]
  for (const argument of SAFE_MODE_ARGUMENTS) {
    if (!result.includes(argument)) result.push(argument)
  }
  return result
}

export function createCrashGuard({
  app,
  log = null,
  processObject = process,
  startedAt = Date.now(),
  now = () => Date.now(),
  graceMs = 30000,
  safeMode = false,
  onUnrecoverable = () => {},
  isShuttingDown = () => false
} = {}) {
  let installed = false
  let recoveryRequested = false
  let fatalExitRequested = false
  let startupComplete = false
  const observedWindows = new Map()

  function record(event) {
    try {
      log?.record?.(event)
    } catch {
      // 诊断自身不得导致第二次故障。
    }
  }

  function requestRecovery(source, details) {
    const recoverable = !recoveryRequested && shouldRecoverStartupCrash({
      source, details, startedAt, now: now(), graceMs, safeMode
    })
    if (!recoverable) return false
    recoveryRequested = true
    record({
      phase: 'startup-recovery',
      outcome: 'recovered',
      reasonCode: reasonCode(source, details),
      message: '启动早期进程崩溃，正在以禁用 GPU 的安全模式重启一次'
    })
    try {
      app?.relaunch?.({ args: buildSafeModeArgs(processObject.argv?.slice(1) || []) })
      app?.exit?.(0)
    } catch (error) {
      record({ phase: 'startup-recovery', outcome: 'failed', reasonCode: 'relaunch_failed', error })
      onUnrecoverable({ source, details, reasonCode: 'relaunch_failed' })
      return false
    }
    return true
  }

  function handleGone(source, details = {}) {
    const reason = normalizedReason(details)
    if (QUIET_REASONS.has(reason) || isShuttingDown()) return false
    record({
      phase: source === 'renderer' ? 'renderer-process' : 'chromium-child-process',
      outcome: 'failed',
      reasonCode: reasonCode(source, details),
      message: `reason=${reason} type=${details?.type || 'unknown'} exitCode=${details?.exitCode ?? 'unknown'}`
    })
    if (requestRecovery(source, details)) return true
    const startupCritical = source === 'renderer' || String(details?.type || '').toLowerCase() === 'gpu'
    if (startupCritical) onUnrecoverable({ source, details, reasonCode: reasonCode(source, details) })
    return false
  }

  function handleRendererGone(details) {
    return handleGone('renderer', details)
  }

  function handleChildProcessGone(_event, details) {
    return handleGone('child', details)
  }

  function requestFatalExit(reasonCodeValue, error) {
    if (fatalExitRequested) return
    fatalExitRequested = true
    record({ phase: 'main-process', outcome: 'failed', reasonCode: reasonCodeValue, error })
    try {
      app?.exit?.(1)
    } catch {
      processObject.exitCode = 1
    }
  }

  function handleUncaughtException(error) {
    requestFatalExit('uncaught_exception', error)
  }

  function handleUnhandledRejection(reason) {
    requestFatalExit('unhandled_rejection', reason instanceof Error ? reason : new Error(String(reason)))
  }

  function install() {
    if (installed) return dispose
    installed = true
    processObject.on?.('uncaughtException', handleUncaughtException)
    processObject.on?.('unhandledRejection', handleUnhandledRejection)
    app?.on?.('child-process-gone', handleChildProcessGone)
    return dispose
  }

  function observeWindow(window) {
    if (!window?.webContents || observedWindows.has(window)) return () => {}
    const contents = window.webContents
    const listeners = {
      didStartLoading: () => {
        if (!isShuttingDown()) record({ phase: 'page-load', outcome: 'started', reasonCode: 'none' })
      },
      didFinishLoad: () => {
        if (!isShuttingDown()) record({ phase: 'page-load', outcome: 'succeeded', reasonCode: 'none' })
      },
      didFailLoad: (_event, errorCode, errorDescription, validatedURL, isMainFrame = true) => {
        if (!isMainFrame || isShuttingDown()) return
        record({
          phase: 'page-load', outcome: 'failed', reasonCode: 'page_load_failed',
          message: `errorCode=${errorCode} description=${errorDescription} url=${validatedURL}`
        })
        if (Number(errorCode) === -3 || startupComplete) return
        onUnrecoverable({ source: 'page-load', details: { errorCode, errorDescription }, reasonCode: 'page_load_failed' })
      },
      preloadError: (_event, preloadPath, error) => {
        record({ phase: 'preload', outcome: 'failed', reasonCode: 'preload_error', message: preloadPath, error })
        onUnrecoverable({ source: 'preload', details: { error }, reasonCode: 'preload_error' })
      },
      rendererGone: (_event, details) => handleRendererGone(details)
    }
    contents.on('did-start-loading', listeners.didStartLoading)
    contents.on('did-finish-load', listeners.didFinishLoad)
    contents.on('did-fail-load', listeners.didFailLoad)
    contents.on('preload-error', listeners.preloadError)
    contents.on('render-process-gone', listeners.rendererGone)
    const disposeWindow = () => {
      contents.removeListener?.('did-start-loading', listeners.didStartLoading)
      contents.removeListener?.('did-finish-load', listeners.didFinishLoad)
      contents.removeListener?.('did-fail-load', listeners.didFailLoad)
      contents.removeListener?.('preload-error', listeners.preloadError)
      contents.removeListener?.('render-process-gone', listeners.rendererGone)
      observedWindows.delete(window)
    }
    observedWindows.set(window, disposeWindow)
    window.once?.('closed', disposeWindow)
    return disposeWindow
  }

  function dispose() {
    if (!installed) return
    installed = false
    processObject.removeListener?.('uncaughtException', handleUncaughtException)
    processObject.removeListener?.('unhandledRejection', handleUnhandledRejection)
    app?.removeListener?.('child-process-gone', handleChildProcessGone)
    for (const disposeWindow of observedWindows.values()) disposeWindow()
    observedWindows.clear()
  }

  return {
    install,
    dispose,
    observeWindow,
    handleRendererGone,
    handleChildProcessGone: details => handleGone('child', details),
    markStartupComplete() { startupComplete = true },
    get startupComplete() { return startupComplete },
    get recoveryRequested() { return recoveryRequested }
  }
}
