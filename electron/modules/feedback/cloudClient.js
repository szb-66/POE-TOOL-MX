import { feedbackApiUrl, feedbackAttachmentUrl } from './config.js'
import { responsePayload, safeCloudError } from './auth.js'

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

  async request(pathname, { method = 'GET', body, allowNotFound = false } = {}) {
    const { response } = await this.authenticatedRequest(session => this.fetch(feedbackApiUrl(this.config, pathname), {
      method,
      redirect: 'error',
      headers: { Authorization: `Bearer ${session.accessToken}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    }))
    if (allowNotFound && response.status === 404) return null
    const payload = await responsePayload(response)
    if (!response.ok) throw safeCloudError(payload, response.status)
    return payload
  }

  async uploadObject({ objectKey, body, mimeType }) {
    const signed = await this.request('/attachments/authorize', { method: 'POST', body: { objectKey, mimeType, size: body.length } })
    try {
      const uploadUrl = feedbackAttachmentUrl(this.config, signed.uploadUrl)
      const uploaded = await this.fetch(uploadUrl, {
        method: 'PUT', redirect: 'error',
        headers: { 'Content-Type': mimeType, 'Content-Length': String(body.length) }, body
      })
      if (!uploaded.ok) throw safeCloudError(await responsePayload(uploaded), uploaded.status)
    } catch (error) {
      try { await this.deleteObject(objectKey) } catch { /* 过期清理任务会回收无法立即清理的未引用对象。 */ }
      throw error
    }
    return { objectKey, uid: (await this.auth.getSession()).uid }
  }

  deleteObject(objectKey) {
    return this.request(`/attachments?objectKey=${encodeURIComponent(objectKey)}`, { method: 'DELETE', allowNotFound: true })
  }

  createFeedback(document) { return this.request('/feedback', { method: 'POST', body: document }) }
  async listFeedback() {
    const value = await this.request('/feedback')
    return Array.isArray(value) ? value : []
  }
  getFeedback(id) { return this.request(`/feedback/${encodeURIComponent(id)}`, { allowNotFound: true }) }
  async listMessages(feedbackId) {
    const value = await this.request(`/messages${feedbackId ? `?feedbackId=${encodeURIComponent(feedbackId)}` : ''}`)
    return Array.isArray(value) ? value : []
  }
  createMessage(document) { return this.request('/messages', { method: 'POST', body: document }) }

  async signedDownloadUrls(objectKeys) {
    const paths = [...new Set((objectKeys || []).filter(Boolean))]
    if (!paths.length) return new Map()
    const payload = await this.request('/attachments/download-urls', { method: 'POST', body: { paths } })
    const result = new Map()
    for (const item of Array.isArray(payload) ? payload : []) {
      if (paths.includes(item.path) && item.fullSignedURL && !item.error) {
        result.set(item.path, feedbackAttachmentUrl(this.config, item.fullSignedURL))
      }
    }
    return result
  }
}
