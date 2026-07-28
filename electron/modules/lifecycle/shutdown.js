export class ShutdownTimeoutError extends Error {
  constructor(timeoutMs) {
    super(`应用清理超过 ${timeoutMs}ms，继续退出`)
    this.name = 'ShutdownTimeoutError'
    this.timeoutMs = timeoutMs
  }
}

function runWithTimeout(task, timeoutMs) {
  let timeoutHandle
  const timeout = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new ShutdownTimeoutError(timeoutMs)), timeoutMs)
  })

  return Promise.race([
    Promise.resolve().then(task),
    timeout
  ]).finally(() => clearTimeout(timeoutHandle))
}

export function createShutdownController({
  app,
  cleanup,
  timeoutMs = 8000,
  onError = (error) => console.error('[shutdown]', error)
}) {
  let state = 'idle'
  let shutdownPromise = null

  const reportError = (error) => {
    try {
      onError(error)
    } catch {
      // 日志处理失败不能阻止应用退出
    }
  }

  const requestShutdown = () => {
    if (shutdownPromise) return shutdownPromise

    state = 'cleaning'
    shutdownPromise = runWithTimeout(cleanup, timeoutMs)
      .catch(reportError)
      .finally(() => {
        state = 'ready'
        app.quit()
      })

    return shutdownPromise
  }

  const handleBeforeQuit = (event) => {
    if (state === 'ready') return
    event.preventDefault()
    void requestShutdown()
  }

  const handleMainWindowClose = () => {
    if (state === 'idle') app.quit()
  }

  app.on('before-quit', handleBeforeQuit)

  return {
    get state() {
      return state
    },
    get done() {
      return shutdownPromise
    },
    requestShutdown,
    handleMainWindowClose
  }
}
