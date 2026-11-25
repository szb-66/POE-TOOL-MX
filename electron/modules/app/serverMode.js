import fs from 'node:fs'
import path from 'node:path'
import { getServer, requireServerId, serverContext } from '../../../shared/serverMode.js'
import { runStrictCleanup, StrictCleanupTimeoutError } from '../lifecycle/strictCleanup.js'

const CLEANUP_TIMEOUT_MS = 15_000
const TEARDOWN_FAILED_MESSAGE = '资源关闭失败，服务器模式未更改。请退出并重新打开助手后再切换'

export class ServerModeController {
  constructor({ userDataPath, cleanup, prepareCleanup, finalizeCleanup, restart, verificationFeatures = [] }) {
    this.file = path.join(userDataPath, 'server-mode.json')
    this.root = userDataPath
    this.cleanup = cleanup
    this.prepareCleanup = prepareCleanup
    this.finalizeCleanup = finalizeCleanup
    this.restart = restart
    this.switchInProgress = false
    this.stopPending = false
    this.teardownState = 'idle'
    this.verificationFeatures = verificationFeatures
    this.mode = 'cn'
    try { this.mode = requireServerId(JSON.parse(fs.readFileSync(this.file, 'utf8')).server) } catch { /* 默认国服，绝不恢复其他来源 */ }
  }
  get server() { return getServer(this.mode) }
  get context() { return serverContext(this.mode, { verificationFeatures: this.verificationFeatures }) }
  get restartRequired() { return this.teardownState !== 'idle' }
  get switching() { return this.switchInProgress || this.stopPending || this.restartRequired }
  dataPath(...parts) { return path.join(this.root, ...(this.mode === 'cn' ? [] : ['servers', this.mode]), ...parts) }

  async stopTasks() {
    this.stopPending = true
    const stopping = Promise.resolve().then(this.cleanup).finally(() => { this.stopPending = false })
    await runStrictCleanup(() => stopping, CLEANUP_TIMEOUT_MS, '服务器切换前停止任务')
  }

  async teardown() {
    // These services cannot accept new work once shutdown begins.
    this.teardownState = 'pending'
    try {
      await this.prepareCleanup?.()
    } catch (error) {
      this.teardownState = 'failed'
      throw error
    }
    const finalizing = Promise.resolve().then(this.finalizeCleanup).then(
      () => { this.teardownState = 'complete' },
      error => { this.teardownState = 'failed'; throw error }
    )
    await runStrictCleanup(() => finalizing, CLEANUP_TIMEOUT_MS, '服务器切换前关闭资源')
  }

  async switchTo(id) {
    requireServerId(id)
    if (this.switchInProgress || this.stopPending || this.teardownState === 'pending') {
      return { success: false, error: '正在停止任务或关闭资源，请等待完成后重试' }
    }
    if (this.teardownState === 'restarting') return { success: false, error: '助手正在重启，请稍候' }
    if (this.teardownState === 'failed') return { success: false, error: TEARDOWN_FAILED_MESSAGE }
    if (id === this.mode && !this.restartRequired) return { success: true, unchanged: true }
    this.switchInProgress = true
    let written = false
    try {
      if (!this.restartRequired) {
        await this.stopTasks()
        await this.teardown()
      }
      fs.mkdirSync(this.root, { recursive: true })
      fs.writeFileSync(`${this.file}.next`, JSON.stringify({ server: id }))
      fs.renameSync(`${this.file}.next`, this.file)
      written = true
      await this.restart()
      this.teardownState = 'restarting'
      return { success: true, restarting: true }
    } catch (error) {
      if (written) {
        fs.writeFileSync(`${this.file}.next`, JSON.stringify({ server: this.mode }))
        fs.renameSync(`${this.file}.next`, this.file)
      }
      if (error instanceof StrictCleanupTimeoutError) {
        return { success: false, error: `${error.message}，服务器模式未更改。请等待完成后重试` }
      }
      if (this.teardownState === 'failed') return { success: false, error: TEARDOWN_FAILED_MESSAGE }
      if (this.teardownState === 'complete') {
        return { success: false, error: '保存模式或重启失败，服务器模式未更改。请再次切换，或退出并重新打开助手' }
      }
      return { success: false, error: '停止任务失败，服务器模式未更改。请停止当前任务后再切换' }
    } finally {
      this.switchInProgress = false
    }
  }
}
