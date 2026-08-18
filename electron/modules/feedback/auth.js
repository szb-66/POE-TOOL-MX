import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { feedbackBaseUrl } from './config.js'

export class FeedbackCloudError extends Error {
  constructor(code, message, status = 0) {
    super(message)
    this.name = 'FeedbackCloudError'
    this.code = code
    this.status = status
  }
}

async function responsePayload(response) {
  const text = await response.text()
  if (!text) return {}
  try { return JSON.parse(text) } catch { return { message: text.slice(0, 300) } }
}

export function safeCloudError(payload, status) {
  const code = String(payload?.code || payload?.error || payload?.error_code || `HTTP_${status}`)
  const messages = {
    STORAGE_PERMISSION_DENIED: '附件上传权限校验失败',
    STORAGE_BUCKET_NOT_FOUND: '反馈附件服务尚未就绪',
    STORAGE_PG_INVALID_JWT: '反馈身份已失效',
    UNAUTHORIZED: '反馈身份已失效'
  }
  return new FeedbackCloudError(code, messages[code] || '反馈服务请求失败，请稍后重试', status)
}

export class FeedbackAuthClient {
  constructor({ config, userDataPath, fetchImpl = globalThis.fetch, now = () => Date.now() }) {
    this.config = config
    this.userDataPath = userDataPath
    this.fetch = fetchImpl
    this.now = now
    this.session = null
    this.deviceIdPromise = null
  }

  async getDeviceId() {
    if (this.deviceIdPromise) return this.deviceIdPromise
    this.deviceIdPromise = (async () => {
      const directory = path.join(this.userDataPath, 'feedback')
      const filePath = path.join(directory, 'device-id')
      try {
        const existing = (await readFile(filePath, 'utf8')).trim()
        if (/^[0-9a-f-]{36}$/i.test(existing)) return existing
      } catch {}
      const value = randomUUID()
      await mkdir(directory, { recursive: true })
      await writeFile(filePath, `${value}\n`, { encoding: 'utf8', mode: 0o600 })
      return value
    })()
    return this.deviceIdPromise
  }

  invalidate() {
    this.session = null
  }

  async getSession({ force = false } = {}) {
    if (!force && this.session?.accessToken && this.session.expiresAt > this.now() + 60_000) return this.session
    if (!force && this.session?.refreshToken) {
      try { return await this.refresh(this.session.refreshToken) } catch { this.session = null }
    }
    return this.signInAnonymously()
  }

  async requestToken(endpoint, body) {
    const deviceId = await this.getDeviceId()
    const response = await this.fetch(`${feedbackBaseUrl(this.config)}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.publishableKey}`,
        'Content-Type': 'application/json',
        'x-device-id': deviceId
      },
      body: JSON.stringify(body)
    })
    const payload = await responsePayload(response)
    if (!response.ok || !payload.access_token || !payload.sub) throw safeCloudError(payload, response.status)
    this.session = {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token || null,
      uid: String(payload.sub),
      expiresAt: this.now() + Math.max(60, Number(payload.expires_in) || 7200) * 1000
    }
    return this.session
  }

  signInAnonymously() {
    return this.requestToken('/auth/v1/signin/anonymously', {})
  }

  refresh(refreshToken) {
    return this.requestToken('/auth/v1/token', {
      client_id: this.config.envId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  }
}
