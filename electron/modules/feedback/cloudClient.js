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
  }
}
