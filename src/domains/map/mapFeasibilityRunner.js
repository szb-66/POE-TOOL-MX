// Injectable worker/timer boundary also makes cancellation races testable.
export function createFeasibilityRunner({ createWorker, onResult, onPending, delay = 250, schedule = setTimeout, cancel = clearTimeout }) {
  let sequence = 0, timer, worker, disposed = false
  const stop = () => { cancel(timer); timer = undefined; worker?.terminate(); worker = undefined }
  return {
    update(input) {
      if (disposed) return
      const id = ++sequence
      stop()
      onPending()
      const snapshot = JSON.parse(JSON.stringify(input))
      timer = schedule(() => {
        if (disposed || id !== sequence) return
        const failed = () => {
          if (disposed || id !== sequence) return
          stop()
          onResult({ status: 'unknown', reasons: ['后台检查无法完成，请修改条件重试'] })
        }
        try {
          worker = createWorker()
          worker.onmessage = ({ data }) => {
            if (disposed || id !== sequence || data.id !== id) return
            stop()
            onResult(data.result)
          }
          worker.onerror = failed
          worker.onmessageerror = failed
          worker.postMessage({ id, input: snapshot })
        } catch { failed() }
      }, delay)
    },
    dispose() { disposed = true; sequence++; stop() }
  }
}
