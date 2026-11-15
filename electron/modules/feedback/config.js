export const FEEDBACK_SERVICE_ID = 'aliyun-feedback-v1'

export const FEEDBACK_CONFIG = Object.freeze({
  baseUrl: process.env.FEEDBACK_API_BASE_URL || 'http://127.0.0.1:44317',
  allowLoopbackHttp: process.env.FEEDBACK_ALLOW_LOOPBACK_HTTP !== '0',
  serviceId: FEEDBACK_SERVICE_ID
})

export function feedbackBaseUrl(config = FEEDBACK_CONFIG) {
  const url = new URL(config.baseUrl)
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
      (url.protocol !== 'https:' && !(config.allowLoopbackHttp === true && url.protocol === 'http:' && loopback))) {
    throw new TypeError('反馈服务必须使用 HTTPS，HTTP 仅限显式允许的本机测试入口')
  }
  return url.origin
}

export function feedbackApiUrl(config, pathname = '') {
  return `${feedbackBaseUrl(config)}/api/client/v1${pathname}`
}

export function feedbackAttachmentUrl(config, value) {
  if (typeof value !== 'string' || !value) throw new TypeError('反馈附件地址无效')
  const base = feedbackBaseUrl(config)
  const url = new URL(value, base)
  if (url.origin !== base || url.username || url.password || url.hash) {
    throw new TypeError('反馈附件地址不属于当前服务')
  }
  return url.href
}

export function isFeedbackConfigured(config = FEEDBACK_CONFIG) {
  try { feedbackBaseUrl(config); return true } catch { return false }
}

export const isDailyUsageConfigured = isFeedbackConfigured
