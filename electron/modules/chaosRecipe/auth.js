import { CHAOS_ERROR_CODES, ChaosRecipeError } from './errors.js'
import { isPoeCnAllowedUrl, requestPoeCnJson } from './http.js'

const POE_CN_ORIGIN = 'https://poe.game.qq.com'
const PROFILE_URL = `${POE_CN_ORIGIN}/api/profile`
const LOGIN_URL = `${POE_CN_ORIGIN}/login`

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
  constructor({ session, BrowserWindow, parentWindow = () => null }) {
    this.session = session
    this.BrowserWindow = BrowserWindow
    this.parentWindow = parentWindow
    this.status = { authenticated: false, mode: null, accountName: '' }
    this.loginWindow = null
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
    const profile = await requestPoeCnJson(this.session, PROFILE_URL)
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
      url: POE_CN_ORIGIN,
      name: 'POESESSID',
      value,
      domain: 'poe.game.qq.com',
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
      title: '登录国服流放之路',
      webPreferences: {
        session: this.session,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true
      }
    })
    this.loginWindow = window
    window.removeMenu?.()
    window.webContents.setWindowOpenHandler(({ url }) => (
      isPoeCnAllowedUrl(url) ? { action: 'allow' } : { action: 'deny' }
    ))
    window.webContents.on('will-navigate', (event, url) => {
      if (!isPoeCnAllowedUrl(url)) event.preventDefault()
    })
    window.once('ready-to-show', () => window.show())
    window.once('closed', () => { if (this.loginWindow === window) this.loginWindow = null })
    await window.loadURL(LOGIN_URL)
    return { opened: true, existing: false }
  }

  async completeWebLogin() {
    const result = await this.validate('web')
    if (this.loginWindow && !this.loginWindow.isDestroyed()) this.loginWindow.close()
    return result
  }

  async logout() {
    this.setStatus({ authenticated: false, mode: null, accountName: '' })
    this.clearFeatureCaches()
    if (this.loginWindow && !this.loginWindow.isDestroyed()) this.loginWindow.close()
    await this.session.clearStorageData({
      origin: POE_CN_ORIGIN,
      storages: ['cookies', 'localstorage', 'cachestorage', 'serviceworkers']
    })
    await this.session.clearCache()
    return this.getStatus()
  }

  async expire() {
    return this.logout()
  }
}
