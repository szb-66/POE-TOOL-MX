import { getServer } from '../../../shared/serverMode.js'
import { CHAOS_ERROR_CODES, ChaosRecipeError } from './errors.js'
import { isPoeCnAllowedUrl, requestPoeCnJson } from './http.js'


function profileSummary(payload, mode) {
  const profile = payload?.profile || payload
  const accountName = String(
    profile?.name || profile?.accountName || profile?.account || profile?.uuid || ''
  ).trim()
  if (!accountName) {
    throw new ChaosRecipeError(CHAOS_ERROR_CODES.API_INCOMPATIBLE, '国服账号资料缺少可识别的账号名')
  }
  return { authenticated: true, mode, accountName }
}

export class PoeCnAuthService {
  constructor({ session, BrowserWindow, parentWindow = () => null, webLoginDebounceMs = 250, server = getServer() }) {
    this.server = server
    this.session = session
    this.BrowserWindow = BrowserWindow
    this.parentWindow = parentWindow
    this.webLoginDebounceMs = webLoginDebounceMs
    this.status = { authenticated: false, mode: null, accountName: '' }
    this.loginWindow = null
    this.loginCookieListener = null
    this.loginValidationTimer = null
    this.loginValidation = null
    this.webLoginGeneration = 0
    this.cacheClearers = new Set()
    this.statusListeners = new Set()
  }

  getStatus() {
    return { ...this.status }
  }

  setStatus(status) {
    this.status = {
      authenticated: Boolean(status?.authenticated),
      mode: status?.mode || null,
      accountName: String(status?.accountName || '')
    }
    const snapshot = this.getStatus()
    for (const listener of this.statusListeners) {
      try { listener(snapshot) } catch { /* account broadcasts must not block authentication */ }
    }
    return snapshot
  }

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {}
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  registerCacheClearer(clearer) {
    if (typeof clearer !== 'function') return () => {}
    this.cacheClearers.add(clearer)
    return () => this.cacheClearers.delete(clearer)
  }

  clearFeatureCaches() {
    for (const clearer of this.cacheClearers) {
      try { clearer() } catch { /* cache cleanup must not block logout */ }
    }
  }

  async validate(mode = this.status.mode || 'session') {
    const profile = await requestPoeCnJson(this.session, `${this.server.origin}/api/profile`)
    return this.setStatus(profileSummary(profile, mode))
  }

  async restore() {
    try {
      return await this.validate('session')
    } catch {
      return this.setStatus({ authenticated: false, mode: null, accountName: '' })
    }
  }

  async setSessionToken(token) {
    const value = String(token || '').trim()
    if (!/^[a-zA-Z0-9_-]{16,256}$/.test(value)) {
      throw new ChaosRecipeError(CHAOS_ERROR_CODES.INVALID_REQUEST, 'POESESSID 格式无效')
    }
    await this.session.cookies.set({
      url: this.server.origin,
      name: 'POESESSID',
      value,
      domain: new URL(this.server.origin).hostname,
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'lax'
    })
    try {
      return await this.validate('token')
    } catch (error) {
      await this.logout()
      throw error
    }
  }

  cleanupWebLoginWatcher() {
    if (this.loginValidationTimer) {
      clearTimeout(this.loginValidationTimer)
      this.loginValidationTimer = null
    }
    if (this.loginCookieListener) {
      this.session.cookies.removeListener?.('changed', this.loginCookieListener)
      this.loginCookieListener = null
    }
  }

  watchWebLoginCookies(window) {
    this.cleanupWebLoginWatcher()
    this.loginCookieListener = (_event, cookie, _cause, removed) => {
      const domain = String(cookie?.domain || '').replace(/^\./, '').toLowerCase()
      if (
        removed ||
        cookie?.name !== 'POESESSID' ||
        domain !== new URL(this.server.origin).hostname ||
        this.loginWindow !== window ||
        window.isDestroyed()
      ) return
      if (this.loginValidationTimer) clearTimeout(this.loginValidationTimer)
      this.loginValidationTimer = setTimeout(() => {
        this.loginValidationTimer = null
        void this.finishWebLogin().catch(() => {
          // 登录页面可能分多次写入 Cookie；只有资料验证成功才自动关闭窗口。
        })
      }, this.webLoginDebounceMs)
    }
    this.session.cookies.on?.('changed', this.loginCookieListener)
  }

  finishWebLogin() {
    const generation = this.webLoginGeneration
    if (this.loginValidation?.generation === generation) return this.loginValidation.promise
    const validation = { generation, promise: null }
    validation.promise = (async () => {
      const profile = await requestPoeCnJson(this.session, `${this.server.origin}/api/profile`)
      if (generation !== this.webLoginGeneration) throw new DOMException('网页登录验证已取消', 'AbortError')
      const result = this.setStatus(profileSummary(profile, 'web'))
      this.cleanupWebLoginWatcher()
      const window = this.loginWindow
      if (window && !window.isDestroyed()) window.close()
      return result
    })().finally(() => {
      if (this.loginValidation === validation) this.loginValidation = null
    })
    this.loginValidation = validation
    return validation.promise
  }

  async openWebLogin() {
    if (this.loginWindow && !this.loginWindow.isDestroyed()) {
      this.loginWindow.focus()
      return { opened: true, existing: true }
    }
    const window = new this.BrowserWindow({
      width: 1080,
      height: 760,
      parent: this.parentWindow() || undefined,
      modal: false,
      show: false,
      title: `登录${this.server.label}流放之路`,
      webPreferences: {
        session: this.session,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true
      }
    })
    this.loginWindow = window
    this.webLoginGeneration += 1
    this.watchWebLoginCookies(window)
    window.removeMenu?.()
    window.webContents.setWindowOpenHandler(({ url }) => (
      isPoeCnAllowedUrl(url, this.server) ? { action: 'allow' } : { action: 'deny' }
    ))
    window.webContents.on('will-navigate', (event, url) => {
      if (!isPoeCnAllowedUrl(url, this.server)) event.preventDefault()
    })
    window.once('ready-to-show', () => window.show())
    window.once('closed', () => {
      if (this.loginWindow === window) {
        this.webLoginGeneration += 1
        this.cleanupWebLoginWatcher()
        this.loginWindow = null
      }
    })
    try {
      await window.loadURL(`${this.server.origin}/login`)
    } catch (error) {
      if (!window.isDestroyed()) window.close()
      throw error
    }
    return { opened: true, existing: false }
  }

  async completeWebLogin() {
    if (this.loginValidationTimer) {
      clearTimeout(this.loginValidationTimer)
      this.loginValidationTimer = null
    }
    return this.finishWebLogin()
  }

  async logout() {
    this.webLoginGeneration += 1
    this.setStatus({ authenticated: false, mode: null, accountName: '' })
    this.clearFeatureCaches()
    this.cleanupWebLoginWatcher()
    if (this.loginWindow && !this.loginWindow.isDestroyed()) this.loginWindow.close()
    await this.session.clearStorageData({
      origin: this.server.origin,
      storages: ['cookies', 'localstorage', 'cachestorage', 'serviceworkers']
    })
    await this.session.clearCache()
    return this.getStatus()
  }

  async expire() {
    return this.logout()
  }
}

export { PoeCnAuthService as PoeAccountAuthService }
