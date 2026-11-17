import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { createHash } from 'node:crypto'
import { probeGameProcesses } from '../localization/steam.js'
import { writeJsonAtomic } from '../localization/downloader.js'
import { validateMarketCatalogSource, validateMarketStructureProfile } from '../../../shared/marketCompatibilityProfile.js'

const unavailable = message => Object.assign(new Error(message), { code: 'MARKET_UNAVAILABLE' })
const hashFile = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const fileIdentity = file => {
  const stat = fs.statSync(file, { bigint: true })
  if (!stat.isFile()) throw unavailable('市集组件或词库不是有效文件')
  return `${stat.dev}:${stat.ino}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}`
}

// The market host keeps stdin open for the whole game session. Resource-file
// transactions continue using the separate one-request LocalizationHelperClient.
export class MarketHostClient {
  constructor({ executable, spawnImpl = spawn, timeoutMs = 20000 } = {}) {
    Object.assign(this, { executable, spawnImpl, timeoutMs })
    this.child = null
    this.pending = null
    this.queue = Promise.resolve()
    this.failure = null
    this.closing = false
    this.closed = null
  }
  request(operation, input = {}) {
    const task = this.queue.catch(() => {}).then(() => this.perform(operation, input))
    this.queue = task
    return task
  }
  start() {
    if (this.child) return
    const child = this.spawnImpl(this.executable, ['--market-host'], { windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'] })
    this.child = child
    this.closed = new Promise(resolve => child.once('close', resolve))
    let buffer = ''
    const fail = error => {
      this.failure ||= error
      const pending = this.pending
      this.pending = null
      pending?.reject(this.failure)
      child.kill()
    }
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', chunk => {
      buffer += chunk
      if (Buffer.byteLength(buffer) > 2 * 1024 * 1024) return fail(unavailable('市集组件响应过大，已停止本次会话'))
      let newline
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline).trim()
        buffer = buffer.slice(newline + 1)
        if (!line) continue
        try {
          const message = JSON.parse(line)
          if (message.marketProtocolVersion !== 1 || message.type !== 'result' || typeof message.success !== 'boolean'
            || !message.data || typeof message.data !== 'object' || !this.pending) throw unavailable('市集组件协议不兼容，已停止本次会话')
          const pending = this.pending
          this.pending = null
          if (message.success) pending.resolve(message.data)
          else pending.reject(Object.assign(unavailable(message.error?.message || '市集组件操作失败'), { code: message.error?.code || 'MARKET_UNAVAILABLE' }))
        } catch (error) { fail(error); return }
      }
    })
    child.stderr.resume()
    child.stdin.on('error', () => fail(unavailable('市集组件输入通道中断，已停止本次会话')))
    child.on('error', () => fail(unavailable('无法启动市集翻译组件')))
    child.on('close', () => {
      this.failure ||= unavailable(buffer.trim() ? '市集组件响应不完整' : '市集翻译组件已退出')
      const pending = this.pending
      this.pending = null
      pending?.reject(this.failure)
    })
  }
  perform(operation, input) {
    if (this.failure) return Promise.reject(this.failure)
    if (this.closing && operation !== 'disable') return Promise.reject(unavailable('市集翻译正在停止'))
    return new Promise((resolve, reject) => {
      let timer
      const finish = callback => value => { clearTimeout(timer); callback(value) }
      try {
        this.start()
        this.pending = { resolve: finish(resolve), reject: finish(reject) }
        timer = setTimeout(() => {
          this.failure = unavailable('市集组件连接或操作超时，已停止本次会话')
          const pending = this.pending
          this.pending = null
          pending?.reject(this.failure)
          this.child?.kill()
        }, this.timeoutMs)
        timer.unref?.()
        this.child.stdin.write(`${JSON.stringify({ ...input, marketProtocolVersion: 1, operation })}\n`)
      } catch (error) {
        clearTimeout(timer)
        this.pending = null
        this.failure = unavailable('无法与市集翻译组件通信')
        this.child?.kill()
        reject(this.failure)
      }
    })
  }
  close() {
    if (this.closeTask) return this.closeTask
    this.closing = true
    this.closeTask = (async () => {
      if (!this.child) return
      if (!this.failure) { try { await this.request('disable') } catch { /* Pipe closure also restores passthrough. */ } }
      this.child.stdin.end()
      let timer
      await Promise.race([this.closed, new Promise(resolve => {
        timer = setTimeout(() => { this.child.kill(); resolve() }, 3000)
        timer.unref?.()
      })]).finally(() => clearTimeout(timer))
    })()
    return this.closeTask
  }
}

export class MarketLocalizationService extends EventEmitter {
  constructor({ executable, catalogPath, storageRoot, localization, serverId = 'cn', platform = process.platform,
    processProbe = probeGameProcesses, hostFactory = () => new MarketHostClient({ executable }),
    setTimeoutFn = setTimeout, clearTimeoutFn = clearTimeout, pollMs = 1000 } = {}) {
    super()
    Object.assign(this, { executable, catalogPath, storageRoot, localization, serverId, platform, processProbe, hostFactory, setTimeoutFn, clearTimeoutFn, pollMs })
    this.settingsPath = path.join(storageRoot, 'market-settings.json')
    let autoEnabled = false
    try {
      if (serverId === 'international' && platform === 'win32' && fs.statSync(this.settingsPath).size <= 4096)
        autoEnabled = JSON.parse(fs.readFileSync(this.settingsPath, 'utf8')).autoEnabled === true
    } catch { /* 首次使用默认关闭。 */ }
    this.state = { state: 'disabled', autoEnabled, enabled: false, busy: false, closing: false, mode: null, pid: null, reason: '', restartRequired: false }
    this.blockedPids = new Set()
    this.resumePids = new Set()
    this.generation = 0
    this.host = null
    this.timer = null
    this.pollTask = null
    this.stopping = null
    this.enabling = null
  }
  requireInternational() {
    if (this.serverId !== 'international' || this.platform !== 'win32') throw unavailable('市集翻译仅支持 Windows Steam 国际服')
  }
  getStatus() {
    return structuredClone({ ...this.state, supported: this.serverId === 'international' && this.platform === 'win32',
      helperAvailable: Boolean(this.executable && this.catalogPath && fs.existsSync(this.executable)
        && ['MarketLocalizationHook.dll', 'market-dependencies.json', 'market-compatibility.json'].every(name => fs.existsSync(path.join(path.dirname(this.executable), name))) && fs.existsSync(this.catalogPath)) })
  }
  publish(patch) {
    Object.assign(this.state, patch)
    const state = this.getStatus()
    this.emit('state', state)
    return state
  }
  managedState() {
    const state = this.localization.getStatus()
    if (state.busy || state.closing) throw unavailable('游戏汉化操作正在进行，请完成后再启用市集翻译')
    if (!['simplified', 'traditional'].includes(state.mode) || state.mappingState === 'unavailable'
      || !state.gameDirectory || !path.isAbsolute(state.gameDirectory)) throw unavailable('请先完成简体或繁体游戏汉化，再启用市集翻译')
    return { gameDirectory: state.gameDirectory, mode: state.mode, resourceVersion: state.resourceVersion || '' }
  }
  fileIdentities() {
    return [this.catalogPath, ...['MarketLocalizationHook.dll', 'market-dependencies.json', 'market-compatibility.json'].map(name => path.join(path.dirname(this.executable), name))]
      .map(file => fileIdentity(file)).join('|')
  }
  verifyRuntime() {
    try {
      const root = path.dirname(this.executable)
      const metadataPath = path.join(root, 'market-dependencies.json')
      const profilePath = path.join(root, 'market-compatibility.json')
      if (fs.statSync(metadataPath).size > 65536 || fs.statSync(profilePath).size > 256 * 1024) throw new Error('size')
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
      const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'))
      if (metadata.protocolVersion !== 1 || !/^[a-f0-9]{64}$/.test(metadata.dllSha256 || '') || !/^[a-f0-9]{64}$/.test(metadata.profileSha256 || '')
        || hashFile(path.join(root, 'MarketLocalizationHook.dll')) !== metadata.dllSha256 || hashFile(profilePath) !== metadata.profileSha256) throw new Error('identity')
      return validateMarketStructureProfile(profile)
    } catch { throw unavailable('市集组件或兼容资料校验失败，请重新构建或安装完整桌面版') }
  }
  initialize() {
    return this.state.autoEnabled ? this.enable({ persist: false }).catch(() => this.getStatus()) : Promise.resolve(this.getStatus())
  }
  prepareConfiguration() {
    const managed = this.managedState()
    if (!this.getStatus().helperAvailable) throw unavailable('市集翻译组件或词库尚未安装，请先完成组件构建')
    const identity = this.fileIdentities()
    if (this.rules && identity === this.identities && JSON.stringify(managed) === JSON.stringify(this.managed)) return
    if (this.host) throw unavailable('游戏汉化模式、组件或词库已变化，重启游戏后自动使用新设置')
    const profile = this.verifyRuntime()
    if (fs.statSync(this.catalogPath).size > 16 * 1024 * 1024) throw unavailable('市集翻译词库过大')
    let catalog
    try { catalog = JSON.parse(fs.readFileSync(this.catalogPath, 'utf8')) }
    catch { throw unavailable('市集翻译词库读取失败，请重新安装完整词库') }
    // Build and release identify the verified sources. The host verifies the running game's structure,
    // and the DLL requires each dynamic rule's exact source before displaying or reversing its text.
    try { validateMarketCatalogSource(catalog, profile) }
    catch (error) { throw unavailable(error.message) }
    if (identity !== this.fileIdentities()) throw unavailable('校验期间市集组件或词库发生变化，请重新启用')
    this.rules = catalog.rules
    this.identities = identity
    this.managed = managed
  }
  enable({ persist = true } = {}) {
    if (this.enabling) return this.enabling
    if (this.state.enabled) return Promise.resolve(this.getStatus())
    this.requireInternational()
    if (this.state.closing || this.stopping) throw unavailable('市集翻译正在停止或助手正在退出')
    const generation = ++this.generation
    this.baselinePending = true
    this.publish({ busy: true, reason: '' })
    this.enabling = (async () => {
      try {
        const processes = await this.processProbe()
        if (generation !== this.generation) return this.getStatus()
        if (!Array.isArray(processes)) throw unavailable('无法确认游戏进程状态，请重试')
        this.blockedPids = new Set(processes)
        this.resumePids = new Set(processes)
        this.baselinePending = false
        this.prepareConfiguration()
        if (persist) writeJsonAtomic(this.settingsPath, { autoEnabled: true })
        this.publish({ state: 'waiting', autoEnabled: true, enabled: true, busy: false, mode: this.managed.mode, pid: null,
          restartRequired: processes.length > 0, reason: processes.length ? '重启游戏后生效' : '' })
      } catch (error) {
        if (generation === this.generation) this.publish({ state: 'error', enabled: false, busy: false, reason: error.message })
        throw error
      }
      return this.getStatus()
    })().finally(() => { this.enabling = null; this.schedule(generation) })
    return this.enabling
  }
  schedule(generation) {
    if (!this.state.autoEnabled || this.state.closing || generation !== this.generation || this.timer) return
    this.timer = this.setTimeoutFn(() => {
      this.timer = null
      const task = this.tick(generation)
      this.pollTask = task
      void task.finally(() => { if (this.pollTask === task) this.pollTask = null })
    }, this.pollMs)
    this.timer?.unref?.()
  }
  async tick(generation) {
    let processes = []
    try {
      if (!this.state.autoEnabled || this.state.closing || generation !== this.generation) return
      if (!this.host) {
        processes = await this.processProbe()
        if (!this.state.autoEnabled || generation !== this.generation) return
        if (!Array.isArray(processes)) throw unavailable('无法确认游戏进程状态，市集翻译已停止')
        if (this.baselinePending) {
          this.blockedPids = new Set(processes); this.resumePids = new Set(processes); this.baselinePending = false
        }
        this.blockedPids = new Set(processes.filter(pid => this.blockedPids.has(pid)))
        this.resumePids = new Set(processes.filter(pid => this.resumePids.has(pid)))
      }
      this.prepareConfiguration()
      let snapshot
      if (!this.host) {
        const resuming = processes.length === 1 && this.resumePids.has(processes[0])
        if (!processes.length || (this.blockedPids.size && !resuming)) {
          if (processes.length && this.state.state === 'error') return
          this.publish({ state: 'waiting', enabled: true, busy: false, pid: null, mode: this.managed.mode,
            restartRequired: processes.length > 0, reason: processes.length ? '重启游戏后生效' : '' })
          return
        }
        if (resuming) this.resumePids.delete(processes[0])
        this.publish({ state: 'connecting', enabled: true, busy: true, restartRequired: true, reason: '' })
        this.host = this.hostFactory()
        snapshot = await this.host.request(resuming ? 'resume' : 'enable', { gameDirectory: this.managed.gameDirectory, storageRoot: this.storageRoot, mode: this.managed.mode, rules: this.rules })
        if (resuming && snapshot.pid !== processes[0]) throw unavailable('市集组件未确认原游戏会话，已停止恢复')
      } else snapshot = await this.host.request('status')
      if (!this.state.autoEnabled || generation !== this.generation) return
      if (snapshot.state === 'disabled') {
        await this.host.close(); this.host = null
        this.publish({ state: 'waiting', enabled: true, busy: false, pid: null, reason: '', restartRequired: false })
      } else if (snapshot.state === 'active' && snapshot.mode === this.managed.mode && Number.isInteger(snapshot.pid) && snapshot.pid > 0)
        this.publish({ state: 'active', busy: false, pid: snapshot.pid, reason: '', restartRequired: true })
      else throw unavailable(snapshot.reason || '市集组件未确认启用，已停止本次会话')
    } catch (error) {
      if (generation !== this.generation) return
      for (const pid of processes || []) this.blockedPids.add(pid)
      if (this.state.pid) this.blockedPids.add(this.state.pid)
      if (this.host) { await this.host.close(); this.host = null }
      this.rules = null
      this.publish({ state: error.code === 'MARKET_RESUME_UNAVAILABLE' ? 'waiting' : 'error',
        enabled: error.code === 'MARKET_RESUME_UNAVAILABLE', busy: false, pid: null, reason: error.message,
        ...(error.code === 'MARKET_RESUME_UNAVAILABLE' ? { restartRequired: true } : {}) })
    } finally { this.schedule(generation) }
  }
  disable({ persist = true } = {}) {
    if (this.stopping) return this.stopping
    if (persist) {
      writeJsonAtomic(this.settingsPath, { autoEnabled: false })
      this.state.autoEnabled = false
    }
    ++this.generation
    if (this.timer) this.clearTimeoutFn(this.timer)
    this.timer = null
    this.publish({ enabled: false, busy: true })
    this.stopping = (async () => {
      await this.enabling?.catch(() => {})
      await this.pollTask?.catch(() => {})
      if (this.host) { await this.host.close(); this.host = null }
      this.rules = null
      return this.publish({ state: 'disabled', enabled: false, busy: false, pid: null,
        reason: this.state.restartRequired ? '已停止翻译；已加载的中文目录会保留到本次游戏退出，重启游戏后恢复原文' : '' })
    })().finally(() => { this.stopping = null })
    return this.stopping
  }
  shutdown() {
    if (this.shutdownTask) return this.shutdownTask
    this.publish({ closing: true })
    this.shutdownTask = this.disable({ persist: false })
    return this.shutdownTask
  }
}
