import { spawn } from 'node:child_process'

export class LootClickObserver {
  constructor({ pythonPath, scriptPath, spawnImpl = spawn } = {}) { this.pythonPath = pythonPath; this.scriptPath = scriptPath; this.spawnImpl = spawnImpl; this.child = null; this.buffer = ''; this.handler = null }
  start(handler) {
    if (this.child) return () => this.stop()
    if (!this.pythonPath || !this.scriptPath) throw new Error('掉落监听运行时不可用')
    this.handler = handler; this.child = this.spawnImpl(this.pythonPath, [this.scriptPath], { shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] })
    this.child.stdout.setEncoding('utf8'); this.child.stdout.on('data', chunk => this.handle(chunk)); this.child.once('exit', () => { this.child = null })
    return () => this.stop()
  }
  handle(chunk) { this.buffer += String(chunk); const lines = this.buffer.split(/\r?\n/); this.buffer = lines.pop() || ''; for (const line of lines) { try { const event = JSON.parse(line); if (event.event !== 'ctrl-click' || !Number.isInteger(event.id)) continue; let replayed = false; void this.handler?.({ replay: async () => { if (replayed || !this.child) return; replayed = true; this.child.stdin.write(`${JSON.stringify({ action: 'replay', id: event.id })}\n`) } }) } catch {} } }
  stop() { this.child?.kill(); this.child = null; this.handler = null; this.buffer = '' }
}
