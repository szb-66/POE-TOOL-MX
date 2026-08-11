/**
 * Purpose: 校验渲染进程上报的启动事件，只生成主进程允许写入日志的固定字段。
 * Inputs: { type, message }。
 * Outputs: 受信任的 phase/outcome/reasonCode/message，非法载荷返回 null。
 */

const MAX_MESSAGE_LENGTH = 1024
const STARTUP_EVENT_TYPES = Object.freeze({
  'renderer-mounted': { phase: 'renderer', outcome: 'succeeded', reasonCode: 'none' },
  'renderer-error': { phase: 'renderer', outcome: 'failed', reasonCode: 'renderer_error' },
  'renderer-unhandled-rejection': { phase: 'renderer', outcome: 'failed', reasonCode: 'renderer_unhandled_rejection' },
  'renderer-bootstrap-failed': { phase: 'renderer', outcome: 'failed', reasonCode: 'renderer_bootstrap_failed' },
  'dashboard-ready': { phase: 'dashboard', outcome: 'succeeded', reasonCode: 'none' },
  'dashboard-load-failed': { phase: 'dashboard', outcome: 'failed', reasonCode: 'dashboard_load_failed' },
  'renderer-runtime-ready': { phase: 'renderer-runtime', outcome: 'succeeded', reasonCode: 'none' },
  'renderer-runtime-failed': { phase: 'renderer-runtime', outcome: 'failed', reasonCode: 'renderer_runtime_failed' }
})

export function sanitizeStartupReport(candidate) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null
  const template = STARTUP_EVENT_TYPES[candidate.type]
  if (!template) return null
  if (candidate.message != null && typeof candidate.message !== 'string') return null
  const message = candidate.message || ''
  if (message.length > MAX_MESSAGE_LENGTH) return null
  return { ...template, message }
}
