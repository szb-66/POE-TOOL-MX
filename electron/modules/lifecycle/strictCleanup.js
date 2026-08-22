export class StrictCleanupTimeoutError extends Error {
  constructor(timeoutMs, operation = '更新安装前清理') {
    super(`${operation}超过 ${timeoutMs}ms`)
    this.name = 'StrictCleanupTimeoutError'
    this.timeoutMs = timeoutMs
  }
}

export function runStrictCleanup(cleanup, timeoutMs = 8000, operation) {
  let timeoutHandle
  const timeout = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new StrictCleanupTimeoutError(timeoutMs, operation)), timeoutMs)
  })
  return Promise.race([
    Promise.resolve().then(cleanup),
    timeout
  ]).finally(() => clearTimeout(timeoutHandle))
}
