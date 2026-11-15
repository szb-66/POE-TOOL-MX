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
    this.state = { supported: serverId === 'international', busy: false, closing: false, phase: '', mode: null, targetMode: null, gameDirectory: '', games: [], scan: null, update: null, progress: null, error: '', mappingState: 'none', mappingWarning: '' }
    try { this.state.gameDirectory = String(JSON.parse(fs.readFileSync(path.join(storageRoot, 'settings.json'), 'utf8')).gameDirectory || '') } catch { /* 首次使用不扫描、不联网 */ }
    this.refreshActiveValidation()
  }
  refreshActiveValidation() {
    if (this.serverId !== 'international') { this.active = null; return }
    const candidate = this.activeCandidate
    const verification = this.verifyInstalled({ storageRoot: this.storageRoot, gameDirectory: this.state.gameDirectory, releaseId: candidate?.manifest.releaseId, allowTraditional: true })
    if (!candidate && !this.state.mode && !verification.mode) return
    this.active = verification.ready && candidate && (!verification.resourceVersion || verification.resourceVersion === candidate.manifest.releaseId) ? candidate : null
    Object.assign(this.state, { mode: verification.ready ? verification.mode || this.state.mode || (candidate ? 'simplified' : null) : null,
      mappingState: verification.ready ? this.active ? 'active' : 'none' : 'unavailable', mappingWarning: verification.ready ? '' : verification.reason })
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
      finally { this.publish({ busy: false, phase: '', targetMode: null }) }
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
  helperInput(game, bundle = this.ready || this.active) {
    return {
      gameDirectory: game.gameDirectory, storageRoot: this.storageRoot, configPath: this.configPath,
      entries: bundle?.entries || [], manifest: bundle?.manifest || null
    }
  }
  clearActive() {
    this.active = null
    this.activeCandidate = null
    this.state.mode = null
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
    this.state.mode = scan.mode || 'simplified'
    const revision = scan.resourceVersion
    const bundle = [this.activeCandidate, this.ready].find(value => value && value.manifest.releaseId === revision) || this.downloader.loadRevision?.(revision)
    if (!bundle) {
      this.clearActive()
      if (scan.mode === 'traditional') Object.assign(this.state, { mode: 'traditional', mappingState: 'none', mappingWarning: '' })
      else Object.assign(this.state, { mappingState: 'unavailable', mappingWarning: '已应用汉化与本地可验证词库不匹配，中文手动查价暂不可用；请重新切简体' })
      return
    }
    this.downloader.activate(bundle.envelope)
    this.activeCandidate = bundle
    this.active = bundle
    Object.assign(this.state, { mappingState: 'active', mappingWarning: '' })
  }
  async scanGame(input, writable = false) {
    this.state.games = await this.discover()
    const directory = typeof input.gameDirectory === 'string' ? input.gameDirectory : this.state.gameDirectory
    if (!directory) {
      if (this.state.games.length !== 1) throw new Error(this.state.games.length ? '检测到多个 Steam 游戏目录，请先选择要汉化的目录' : '未检测到 Steam 游戏，请先选择游戏安装目录')
      input = { ...input, gameDirectory: this.state.games[0].gameDirectory }
    } else input = { ...input, gameDirectory: directory }
    let game = this.selectedGame(input)
    if (writable) game = await this.assertWritable(game.gameDirectory)
    const scan = await this.helper.run('scan', this.helperInput(game, null), this.progress)
    this.reconcileApplied(scan)
    this.publish({ scan })
    return game
  }
  async scan(input = {}) {
    return this.perform('scan', () => this.scanGame(input))
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
  async apply(input = {}) {
    const mode = input?.mode === undefined ? 'simplified' : input.mode
    if (!['simplified', 'traditional'].includes(mode)) throw new Error('请选择简体或繁体模式')
    return this.perform('scan', async () => {
      this.publish({ targetMode: mode })
      let game = await this.scanGame(input, true)
      if (this.state.scan?.recoveryNeeded) {
        this.publish({ phase: 'restore', progress: null })
        const restored = await this.helper.run('restore', this.helperInput(game, null), this.progress)
        if (restored?.applied !== false || restored.recoveryNeeded) throw new Error('上次汉化尚未恢复完成，未检查或下载新资源；请点击恢复原版后重试')
        this.reconcileApplied(restored)
        this.publish({ scan: restored })
      }
      const gameVersion = this.state.scan?.gameVersion
      let bundle = gameVersion && !['unknown', 'unverified'].includes(gameVersion) ? [this.ready, this.active].find(value => value && value.manifest.gameVersion === gameVersion) || null : null
      if (mode === 'simplified') {
        this.publish({ phase: 'check', progress: null })
        const update = await this.downloader.check()
        this.publish({ update })
        if (update.missingObjects > 0) this.publish({ phase: 'download', progress: null })
        // A fully cached release still needs signature/object checks and a ready.json commit.
        const download = await this.downloader.download(this.progress)
        this.ready = this.downloader.load('ready.json')
        if (!this.ready || this.ready.manifest.releaseId !== update.releaseId) throw new Error('下载的翻译资源校验失败，未应用汉化')
        bundle = this.ready
        this.publish({ download, update: { ...update, downloadBytes: 0, missingObjects: 0 } })
      }
      this.publish({ phase: 'apply', progress: null })
      // Steam or the game may have started while resources were downloading.
      game = await this.assertWritable(game.gameDirectory)
      const scan = await this.helper.run('apply', { ...this.helperInput(game, bundle), mode, ...(mode === 'traditional' ? { entries: [] } : {}) }, this.progress)
      if (scan?.applied !== true) throw new Error('汉化组件未确认应用完成，请重试切换游戏语言以确认状态')
      // The helper journal is authoritative after a crash between native commit and cache activation.
      if ((scan.mode || 'simplified') !== mode || (bundle && scan.resourceVersion !== bundle.manifest.releaseId)) {
        this.reconcileApplied(scan)
        this.publish({ scan })
        throw new Error('游戏已应用的语言模式或资源版本与本次请求不一致，请重试切换游戏语言以确认状态')
      }
      this.reconcileApplied(scan)
      return this.publish({ scan })
    })
  }
  async restore(input = {}) {
    return this.perform('restore', async () => {
      const game = await this.assertWritable(this.selectedGame(input).gameDirectory)
      const scan = await this.helper.run('restore', this.helperInput(game, null), this.progress)
      if (scan?.restored !== true && scan?.applied !== false) throw new Error('汉化组件未确认原版恢复完成，请重试恢复原版以确认状态')
      this.clearActive()
      Object.assign(this.state, { mappingState: 'none', mappingWarning: '' })
      return this.publish({ scan })
    })
  }
}
