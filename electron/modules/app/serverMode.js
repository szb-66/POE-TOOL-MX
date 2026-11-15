import fs from 'node:fs'
import path from 'node:path'
import { getServer, requireServerId, serverContext } from '../../../shared/serverMode.js'
import { runStrictCleanup } from '../lifecycle/strictCleanup.js'

export class ServerModeController {
  constructor({ userDataPath, cleanup, prepareCleanup, restart, verificationFeatures = [] }) {
    this.file = path.join(userDataPath, 'server-mode.json')
    this.root = userDataPath
    this.cleanup = cleanup
    this.prepareCleanup = prepareCleanup
    this.restart = restart
    this.switching = false
    this.verificationFeatures = verificationFeatures
    this.mode = 'cn'
    try { this.mode = requireServerId(JSON.parse(fs.readFileSync(this.file, 'utf8')).server) } catch { /* 默认国服，绝不恢复其他来源 */ }
  }
  get server() { return getServer(this.mode) }
  get context() { return serverContext(this.mode, { verificationFeatures: this.verificationFeatures }) }
  dataPath(...parts) { return path.join(this.root, ...(this.mode === 'cn' ? [] : ['servers', this.mode]), ...parts) }
  async switchTo(id) {
    requireServerId(id)
    if (this.switching) return { success: false, error: '正在切换服务器，请稍候' }
    if (id === this.mode) return { success: true, unchanged: true }
    this.switching = true
    let written = false
    try {
      if (this.prepareCleanup) await this.prepareCleanup()
      await runStrictCleanup(this.cleanup, 15000, '服务器切换前清理')
      fs.mkdirSync(this.root, { recursive: true })
      fs.writeFileSync(`${this.file}.next`, JSON.stringify({ server: id }))
      fs.renameSync(`${this.file}.next`, this.file)
      written = true
      await this.restart()
      return { success: true, restarting: true }
    } catch {
      if (written) {
        fs.writeFileSync(`${this.file}.next`, JSON.stringify({ server: this.mode }))
        fs.renameSync(`${this.file}.next`, this.file)
      }
      this.switching = false
      return { success: false, error: '停止任务或重启失败，服务器模式未更改；部分功能可能已停止，请重启助手后重试' }
    }
  }
}
