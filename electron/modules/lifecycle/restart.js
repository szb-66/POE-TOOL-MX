import { runStrictCleanup } from './strictCleanup.js'

export const DEVELOPMENT_RESTART_EXIT_CODE = 75

export function createApplicationRestartController({
  cleanup,
  clearCache,
  markCleanupComplete,
  restart,
  terminateAfterFailure,
  onError = () => {},
  timeoutMs = 8000
}) {
  let restartPromise = null

  const requestRestart = () => {
    if (restartPromise) return restartPromise

    restartPromise = (async () => {
      try {
        await runStrictCleanup(async () => {
          await cleanup()
          await clearCache()
        }, timeoutMs, '应用重启前清理')
        markCleanupComplete()
        await restart()
        return { success: true }
      } catch (error) {
        try {
          onError(error)
        } catch {
          // 诊断失败不得覆盖重启失败的根因。
        }
        try {
          await terminateAfterFailure(error)
        } catch {
          // 终止动作失败时仍返回原始错误，避免掩盖根因。
        }
        return { success: false, error }
      }
    })()

    return restartPromise
  }

  return {
    requestRestart,
    get restarting() {
      return restartPromise !== null
    },
    get done() {
      return restartPromise
    }
  }
}
