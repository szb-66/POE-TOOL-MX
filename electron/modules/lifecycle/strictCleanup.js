export class StrictCleanupTimeoutError extends Error {
  constructor(timeoutMs) {
    super(`更新安装前清理超过 ${timeoutMs}ms`)
    this.name = 'StrictCleanupTimeoutError'
    this.timeoutMs = timeoutMs
  }
}

export function runStrictCleanup(cleanup, timeoutMs = 8000) {
  let timeoutHandle
  const timeout = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new StrictCleanupTimeoutError(timeoutMs)), timeoutMs)
  })
  return Promise.race([
    Promise.resolve().then(cleanup),
    timeout
  ]).finally(() => clearTimeout(timeoutHandle))
}
