/** Observe exit intent without changing shutdown policy. All writes are best effort. */
export function createExitDiagnostics({ app, log, processObject = process } = {}) {
  let firstSource = ''
  const windowSources = new WeakMap()
  const listeners = []
  function record(phase, source = firstSource || 'unknown', outcome = 'info', message = '') {
    try { log?.record?.({ phase, outcome, reasonCode: source, message: `firstSource=${firstSource || 'unknown'} ${message}` }) } catch {}
  }
  function request(source = 'unknown') {
    if (!firstSource) firstSource = source
    record('exit-request', source)
  }
  function listen(target, name, handler) {
    target?.on?.(name, handler)
    listeners.push(() => target?.removeListener?.(name, handler))
  }
  // Install before shutdown handlers so unknown external quit requests are captured first.
  listen(app, 'before-quit', () => {
    if (!firstSource) request()
    record('exit-before-quit')
  })
  listen(app, 'will-quit', () => record('exit-will-quit'))
  listen(app, 'quit', (_event, code) => record('exit-quit', undefined, 'info', `code=${code}`))
  listen(processObject, 'exit', code => record('exit-process', undefined, 'info', `code=${code}`))
  return {
    request,
    record,
    get firstSource() { return firstSource },
    withWindowCloseSource(window, operation) {
      windowSources.set(window, 'window_close_ipc')
      try { return operation() } finally { windowSources.delete(window) }
    },
    windowCloseSource(window) { return windowSources.get(window) || 'native_window_close' },
    async cleanup(operation) {
      record('exit-cleanup', undefined, 'started')
      try {
        const result = await operation()
        record('exit-cleanup', undefined, 'succeeded')
        return result
      } catch (error) {
        record('exit-cleanup', undefined, 'failed')
        throw error
      }
    },
    dispose() { for (const remove of listeners.splice(0)) remove() }
  }
}
