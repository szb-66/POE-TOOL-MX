import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { feedbackApiUrl, feedbackBaseUrl } from './config.js'

export class FeedbackCloudError extends Error {
  constructor(code, message, status = 0) {
    super(message)
    this.name = 'FeedbackCloudError'
    this.code = code
    this.status = status
  }
}

export async function responsePayload(response) {
  const text = await response.text()
  if (!text) return {}
  try { return JSON.parse(text) } catch { return {} }
}

export function safeCloudError(payload, status) {
  const code = String(payload?.code || `HTTP_${status}`)
  const messages = {
    UNAUTHORIZED: '反馈身份已失效，请检查本机身份文件；为保护原会话不会自动创建新身份',
    AUTH_REQUIRED: '反馈身份已失效，请检查本机身份文件；为保护原会话不会自动创建新身份',
    IDENTITY_INVALID: '本机反馈身份文件无效，请恢复原身份文件',
    FEEDBACK_RATE_LIMITED: '反馈提交过于频繁，请稍后重试'
  }
  return new FeedbackCloudError(code, messages[code] || '反馈服务请求失败，请稍后重试', status)
}

function validIdentity(value) {
  return typeof value?.uid === 'string' && /^[0-9a-f-]{36}$/i.test(value.uid) &&
    typeof value.accessToken === 'string' && /^[A-Za-z0-9_-]{43,128}$/.test(value.accessToken)
}

export class FeedbackAuthClient {
  constructor({ config, userDataPath, fetchImpl = globalThis.fetch }) {
    this.config = config
    this.fetch = fetchImpl
    const originHash = createHash('sha256').update(feedbackBaseUrl(config)).digest('hex').slice(0, 16)
    this.directory = path.join(userDataPath, 'feedback')
    this.filePath = path.join(this.directory, `identity-aliyun-v1-${originHash}.json`)
    this.session = null
    this.pending = null
  }

  invalidate() { this.session = null }

  getSession({ force = false } = {}) {
    if (!force && this.session) return Promise.resolve(this.session)
    if (this.pending) return this.pending
    this.pending = this.loadSession().finally(() => { this.pending = null })
    return this.pending
  }

  async loadSession() {
    let identity
    try {
      identity = JSON.parse(await readFile(this.filePath, 'utf8'))
      if (!validIdentity(identity)) throw safeCloudError({ code: 'IDENTITY_INVALID' }, 401)
    } catch (error) {
      if (error.code !== 'ENOENT') throw safeCloudError({ code: 'IDENTITY_INVALID' }, 401)
    }
    if (identity) {
      const response = await this.fetch(feedbackApiUrl(this.config, '/session'), {
        headers: { Authorization: `Bearer ${identity.accessToken}` }, redirect: 'error'
      })
      const payload = await responsePayload(response)
      if (!response.ok) throw safeCloudError(payload, response.status)
      if (payload.uid !== identity.uid) throw safeCloudError({ code: 'IDENTITY_INVALID' }, 401)
    } else {
      const response = await this.fetch(feedbackApiUrl(this.config, '/identity'), { method: 'POST', redirect: 'error' })
      const payload = await responsePayload(response)
      if (!response.ok) throw safeCloudError(payload, response.status)
      if (!validIdentity(payload)) throw safeCloudError({ code: 'IDENTITY_INVALID' }, 500)
      identity = { uid: payload.uid, accessToken: payload.accessToken }
      const temporary = `${this.filePath}.tmp-${process.pid}`
      try {
        await mkdir(this.directory, { recursive: true })
        await writeFile(temporary, `${JSON.stringify(identity)}\n`, { encoding: 'utf8', mode: 0o600 })
        await rename(temporary, this.filePath)
      } catch {
        try { await rm(temporary, { force: true }) } catch { /* 不回显本机身份路径或凭据。 */ }
        throw safeCloudError({ code: 'IDENTITY_INVALID' }, 500)
      }
    }
    this.session = Object.freeze(identity)
    return this.session
  }
}
