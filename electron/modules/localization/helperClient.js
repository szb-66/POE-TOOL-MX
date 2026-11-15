import fs from 'node:fs'
import { spawn } from 'node:child_process'

export class LocalizationHelperClient {
  constructor({ executable, spawnImpl = spawn, timeoutMs = 15 * 60 * 1000 } = {}) {
    this.executable = executable
    this.spawnImpl = spawnImpl
    this.timeoutMs = timeoutMs
    this.pending = new Set()
  }
  available() { return Boolean(this.executable && fs.existsSync(this.executable)) }
  async waitForIdle() { await Promise.all(this.pending) }
  async run(operation, input, onProgress = () => {}) {
    if (!this.available()) throw Object.assign(new Error('汉化资源读写组件尚未安装，请先完成组件构建与验证'), { code: 'LOCALIZATION_HELPER_UNAVAILABLE' })
    return new Promise((resolve, reject) => {
      const child = this.spawnImpl(this.executable, [], { windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'] })
      const closed = new Promise(resolve => child.once('close', resolve))
      this.pending.add(closed)
      void closed.then(() => this.pending.delete(closed))
      let buffer = ''
      let result = null
      let finished = false
      const finish = (error, data) => {
        if (finished) return
        finished = true
        clearTimeout(timer)
        if (error) reject(error); else resolve(data)
      }
      const timer = setTimeout(() => { child.kill(); finish(new Error('汉化资源处理超时，请重新扫描确认状态')) }, this.timeoutMs)
      const fail = error => { child.kill(); finish(error) }
      child.on('error', () => finish(new Error('无法启动汉化资源读写组件')))
      child.stdout.setEncoding('utf8')
      child.stdout.on('data', chunk => {
        buffer += chunk
        if (buffer.length > 8 * 1024 * 1024) return fail(new Error('汉化组件响应过大'))
        let newline
        while ((newline = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newline).trim()
          buffer = buffer.slice(newline + 1)
          if (!line) continue
          try {
            const event = JSON.parse(line)
            if (event.protocolVersion !== 1) throw new Error('汉化组件协议版本不兼容')
            if (event.type === 'progress') onProgress({ phase: String(event.phase || ''), completed: Number(event.completed) || 0, total: Number(event.total) || 0 })
            else if (event.type === 'result') { if (result) throw new Error('汉化组件返回重复结果'); result = event }
            else throw new Error('汉化组件返回未知消息')
          } catch (error) { return fail(error) }
        }
      })
      // stderr may contain native paths; never forward it into renderer diagnostics.
      child.stderr.resume()
      child.on('close', code => {
        if (buffer.trim()) return finish(new Error('汉化组件响应不完整'))
        if (!result) return finish(new Error('汉化组件未返回完整结果，请重新扫描确认状态'))
        if (code !== 0 || result.success !== true) return finish(Object.assign(new Error(result.error?.message || '汉化资源处理失败'), { code: result.error?.code || 'LOCALIZATION_HELPER_ERROR' }))
        finish(null, result.data)
      })
      child.stdin.on('error', () => fail(new Error('汉化组件输入通道中断')))
      child.stdin.end(`${JSON.stringify({ ...input, protocolVersion: 1, operation })}\n`)
    })
  }
}
