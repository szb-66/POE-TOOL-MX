import { feedbackBaseUrl } from './config.js'
import { safeCloudError } from './auth.js'

async function parsePayload(response) {
  const text = await response.text()
  if (!text) return {}
  try { return JSON.parse(text) } catch { return { message: text.slice(0, 300) } }
}

function encodedObjectKey(objectKey) {
  return String(objectKey).split('/').map(encodeURIComponent).join('/')
}

export class FeedbackCloudClient {
  constructor({ config, auth, fetchImpl = globalThis.fetch }) {
    this.config = config
    this.auth = auth
    this.fetch = fetchImpl
  }

  async authenticatedRequest(makeRequest) {
    let session = await this.auth.getSession()
    let response = await makeRequest(session)
    if (response.status === 401) {
      this.auth.invalidate()
      session = await this.auth.getSession({ force: true })
      response = await makeRequest(session)
    }
    return { response, session }
  }

  async uploadObject({ objectKey, body, mimeType }) {
    const path = encodedObjectKey(objectKey)
    const signed = await this.authenticatedRequest(session => this.fetch(
      `${feedbackBaseUrl(this.config)}/v1/storages/object/upload/sign/${encodeURIComponent(this.config.bucket)}/${path}`,
      { method: 'POST', headers: { Authorization: `Bearer ${session.accessToken}`, 'x-upsert': 'false' } }
    ))
    const signedPayload = await parsePayload(signed.response)
    if (!signed.response.ok) throw safeCloudError(signedPayload, signed.response.status)
    let uploadUrl = signedPayload.fullURL || signedPayload.fullUrl || signedPayload.url
    if (!uploadUrl) throw safeCloudError({ code: 'STORAGE_SIGN_INVALID' }, signed.response.status)
    if (!/^https?:\/\//i.test(uploadUrl)) uploadUrl = new URL(uploadUrl, feedbackBaseUrl(this.config)).toString()
    if (signedPayload.token && !new URL(uploadUrl).searchParams.has('token')) {
      const url = new URL(uploadUrl)
      url.searchParams.set('token', signedPayload.token)
      uploadUrl = url.toString()
    }
    const uploaded = await this.fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': mimeType, 'Content-Length': String(body.length) },
      body
    })
    const uploadPayload = await parsePayload(uploaded)
    if (!uploaded.ok) throw safeCloudError(uploadPayload, uploaded.status)
    return { objectKey, uid: signed.session.uid }
  }

  async deleteObject(objectKey) {
    const path = encodedObjectKey(objectKey)
    const { response } = await this.authenticatedRequest(session => this.fetch(
      `${feedbackBaseUrl(this.config)}/v1/storages/object/${encodeURIComponent(this.config.bucket)}/${path}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${session.accessToken}` } }
    ))
    if (!response.ok && response.status !== 404) throw safeCloudError(await parsePayload(response), response.status)
  }

  async createFeedback(document) {
    const { response } = await this.authenticatedRequest(session => this.fetch(
      `${feedbackBaseUrl(this.config)}/v1/rdb/rest/${encodeURIComponent(this.config.table)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(document)
      }
    ))
    if (!response.ok) throw safeCloudError(await parsePayload(response), response.status)
    return { id: document.id, feedbackId: document.feedback_id }
  }

  async tableRequest(table, query = '') {
    const { response } = await this.authenticatedRequest(session => this.fetch(
      `${feedbackBaseUrl(this.config)}/v1/rdb/rest/${encodeURIComponent(table)}${query}`,
      { headers: { Authorization: `Bearer ${session.accessToken}` } }
    ))
    const payload = await parsePayload(response)
    if (!response.ok) throw safeCloudError(payload, response.status)
    return Array.isArray(payload) ? payload : []
  }

  async listFeedback() {
    return this.tableRequest(this.config.table, '?select=id,feedback_id,category,title,description,attachments,created_at&order=created_at.desc')
  }

  async getFeedback(id) {
    const rows = await this.tableRequest(this.config.table, `?select=id,feedback_id,category,title,description,attachments,created_at&id=eq.${encodeURIComponent(id)}`)
    return rows[0] || null
  }

  async listMessages(feedbackId) {
    const suffix = feedbackId ? `&feedback_id=eq.${encodeURIComponent(feedbackId)}` : ''
    return this.tableRequest('app_feedback_messages', `?select=id,feedback_id,author_role,body,attachments,client_message_id,created_at,schema_version${suffix}&order=created_at.asc`)
  }

  async createMessage(document) {
    const { response } = await this.authenticatedRequest(session => this.fetch(
      `${feedbackBaseUrl(this.config)}/v1/rdb/rest/app_feedback_messages`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(document)
      }
    ))
    const payload = await parsePayload(response)
    if (!response.ok) {
      if (response.status === 409) {
        const existing = (await this.listMessages(document.feedback_id)).find(item => item.client_message_id === document.client_message_id)
        if (existing) return { ...existing, duplicate: true }
      }
      throw safeCloudError(payload, response.status)
    }
    return document
  }

  async signedDownloadUrls(objectKeys) {
    const paths = [...new Set((objectKeys || []).filter(Boolean))]
    if (!paths.length) return new Map()
    const { response } = await this.authenticatedRequest(session => this.fetch(
      `${feedbackBaseUrl(this.config)}/v1/storages/object/sign/${encodeURIComponent(this.config.bucket)}`,
      { method: 'POST', headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 300, paths }) }
    ))
    const payload = await parsePayload(response)
    if (!response.ok) throw safeCloudError(payload, response.status)
    const result = new Map()
    for (const item of Array.isArray(payload) ? payload : []) {
      const url = item.fullSignedURL || item.fullSignedUrl || item.signedURL || item.signedUrl
      if (item.path && url && !item.error) result.set(item.path, /^https?:\/\//i.test(url) ? url : new URL(url, feedbackBaseUrl(this.config)).toString())
    }
    return result
  }
}
