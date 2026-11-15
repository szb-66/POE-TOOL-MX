import fs from 'node:fs'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { LocalizationDownloader, writeJsonAtomic } from './downloader.js'
import { LocalizationHelperClient } from './helperClient.js'
import { assertSteamWritable, discoverSteamGames, inspectSteamGame } from './steam.js'
import { createInstalledLocalizationVerifier } from './installedState.js'

export class LocalizationService extends EventEmitter {
  constructor({ storageRoot, executable, configPath, serverId = 'cn', downloader, helper, discover = discoverSteamGames, inspect = inspectSteamGame, assertWritable = assertSteamWritable, verifyInstalled = createInstalledLocalizationVerifier(), ...options } = {}) {
    super()
    this.storageRoot = storageRoot
    this.serverId = serverId
    this.configPath = configPath
    this.downloader = downloader || new LocalizationDownloader({ storageRoot, ...options })
    this.helper = helper || new LocalizationHelperClient({ executable })
    this.discover = discover
    this.inspect = inspect
    this.assertWritable = assertWritable
    this.verifyInstalled = verifyInstalled
    this.activeCandidate = serverId === 'international' ? this.downloader.load() : null
    this.active = null
    this.ready = serverId === 'international' ? this.downloader.load('ready.json') : null
    this.pending = null
    this.state = { supported: serverId === 'international', busy: false, closing: false, phase: '', gameDirectory: '', games: [], scan: null, update: null, preview: null, progress: null, error: '', mappingState: 'none', mappingWarning: '' }
    try { this.state.gameDirectory = String(JSON.parse(fs.readFileSync(path.join(storageRoot, 'settings.json'), 'utf8')).gameDirectory || '') } catch { /* 首次使用不扫描、不联网 */ }
    this.refreshActiveValidation()
  }
  refreshActiveValidation() {
    if (this.serverId !== 'international') { this.active = null; return }
    if (!this.activeCandidate) return
    const verification = this.verifyInstalled({ storageRoot: this.storageRoot, gameDirectory: this.state.gameDirectory, releaseId: this.activeCandidate.manifest.releaseId })
    this.active = verification.ready ? this.activeCandidate : null
    Object.assign(this.state, { mappingState: verification.ready ? 'active' : 'unavailable', mappingWarning: verification.ready ? '' : verification.reason })
  }
  getActiveEntries() { this.refreshActiveValidation(); return this.active?.entries || [] }
  getActiveRevision() { this.refreshActiveValidation(); return this.active?.manifest.releaseId || '' }
  getStatus() {
    this.refreshActiveValidation()
    return structuredClone({ ...this.state, helperAvailable: this.helper.available(), resourceVersion: this.getActiveRevision(), readyVersion: this.ready?.manifest.releaseId || '', sourceGameVersion: this.ready?.manifest.gameVersion || this.active?.manifest.gameVersion || '', entryCount: this.active?.entries.length || 0 })
  }
  publish(patch = {}) { Object.assign(this.state, patch); const state = this.getStatus(); this.emit('state', state); return state }
  requireInternational() { if (this.serverId !== 'international') throw new Error('游戏汉化仅适用于国际服 Steam 客户端') }
  async perform(phase, action) {
    this.requireInternational()
    if (this.state.closing) throw new Error('助手正在退出或重启，暂不接受新的汉化操作')
    if (this.state.busy) throw new Error('已有汉化操作正在执行，请等待完成')
    this.state.busy = true
    const pending = Promise.resolve().then(async () => {
      try {
        this.publish({ phase, progress: null, error: '' })
        await action()
      } catch (error) { this.publish({ error: error.message }); throw error }
      finally { this.publish({ busy: false, phase: '' }) }
      return this.getStatus()
    })
    this.pending = pending
    try { return await pending }
    finally { if (this.pending === pending) this.pending = null }
  }
  async shutdown() {
    this.publish({ closing: true })
    // Finish native commit and signed-dictionary activation before closing its pipes.
    await this.pending?.catch(() => {})
    await this.helper.waitForIdle?.()
  }
  progress = value => this.publish({ progress: value })
  selectedGame(input) {
    const directory = String(input?.gameDirectory || this.state.gameDirectory || '')
    const game = this.inspect(directory)
    this.state.gameDirectory = game.gameDirectory
    writeJsonAtomic(path.join(this.storageRoot, 'settings.json'), { gameDirectory: game.gameDirectory })
    return game
  }
  helperInput(game, input = {}, bundle = this.ready || this.active) {
    return {
      gameDirectory: game.gameDirectory, storageRoot: this.storageRoot, configPath: this.configPath,
      entries: bundle?.entries || [], manifest: bundle?.manifest || null,
      baselineConfirmed: input.baselineConfirmed === true
    }
  }
  clearActive() {
    this.active = null
    this.activeCandidate = null
    const file = path.join(this.storageRoot, 'active.json')
    if (fs.existsSync(file)) fs.unlinkSync(file)
  }
  reconcileApplied(scan) {
    if (scan?.applied === false) {
      this.clearActive()
      Object.assign(this.state, { mappingState: 'none', mappingWarning: '' })
      return
    }
    if (scan?.applied !== true) return
    const revision = scan.resourceVersion
    const bundle = [this.activeCandidate, this.ready].find(value => value && value.manifest.releaseId === revision) || this.downloader.loadRevision?.(revision)
    if (!bundle) {
      this.clearActive()
      Object.assign(this.state, { mappingState: 'unavailable', mappingWarning: '已应用汉化与本地可验证词库不匹配，中文手动查价暂不可用；请下载匹配资源并重新应用' })
      return
    }
    this.downloader.activate(bundle.envelope)
    this.activeCandidate = bundle
    this.active = bundle
    Object.assign(this.state, { mappingState: 'active', mappingWarning: '' })
  }
  async scan(input = {}) {
    return this.perform('scan', async () => {
      this.state.games = await this.discover()
      if (!input.gameDirectory && !this.state.gameDirectory && this.state.games.length === 1) input = { ...input, gameDirectory: this.state.games[0].gameDirectory }
      const game = this.selectedGame(input)
      const scan = await this.helper.run('scan', this.helperInput(game, input), this.progress)
      this.reconcileApplied(scan)
      return this.publish({ scan, preview: null })
    })
  }
  async check() {
    return this.perform('check', async () => this.publish({ update: await this.downloader.check() }))
  }
  async download() {
    return this.perform('download', async () => {
      const result = await this.downloader.download(this.progress)
      this.ready = this.downloader.load('ready.json')
      if (!this.ready) throw new Error('下载的翻译资源校验失败，未更改活动资源')
      return this.publish({ download: result, update: { ...(this.state.update || {}), downloadBytes: 0, missingObjects: 0 } })
    })
  }
  async preview(input = {}) {
    return this.perform('preview', async () => {
      const game = this.selectedGame(input)
      return this.publish({ preview: await this.helper.run('preview', this.helperInput(game, input), this.progress) })
    })
  }
  async apply(input = {}) {
    return this.perform('apply', async () => {
      const game = await this.assertWritable(this.selectedGame(input).gameDirectory)
      const bundle = this.ready || this.active
      const scan = await this.helper.run('apply', this.helperInput(game, input, bundle), this.progress)
      if (scan?.applied !== true) throw new Error('汉化组件未确认应用完成，请重新扫描游戏状态')
      // The helper journal is authoritative after a crash between native commit and cache activation.
      if (bundle && scan.resourceVersion !== bundle.manifest.releaseId) {
        this.reconcileApplied(scan)
        this.publish({ scan, preview: null })
        throw new Error('游戏已应用的资源版本与候选词库不一致，请重新扫描确认状态')
      }
      this.reconcileApplied(scan)
      return this.publish({ scan, preview: null })
    })
  }
  async restore(input = {}) {
    return this.perform('restore', async () => {
      const game = await this.assertWritable(this.selectedGame(input).gameDirectory)
      const scan = await this.helper.run('restore', this.helperInput(game, input, this.active), this.progress)
      if (scan?.restored !== true && scan?.applied !== false) throw new Error('汉化组件未确认原版恢复完成，请重新扫描游戏状态')
      this.clearActive()
      Object.assign(this.state, { mappingState: 'none', mappingWarning: '' })
      return this.publish({ scan, preview: null })
    })
  }
}
