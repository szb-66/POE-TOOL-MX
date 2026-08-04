import { electronApi } from '../api/electron.js'

export function classifyDiagnosticError(error, fallback = 'unknown_failure') {
  const code = String(error?.code || error?.errorCode || '').toUpperCase()
  const status = Number(error?.status || error?.details?.status || error?.httpStatus)
  if (status === 401 || status === 403 || /AUTH|SESSION|LOGIN/.test(code)) return 'authentication_failed'
  if (status === 429 || /RATE/.test(code)) return 'rate_limited'
  if (/CONFIG|REGION|CALIBRAT|VALIDATION/.test(code)) return 'invalid_configuration'
  if (/FOREGROUND|FOCUS/.test(code)) return 'foreground_lost'
  if (/RUNTIME|PYTHON/.test(code)) return 'runtime_unavailable'
  if (/NETWORK|HTTP|REQUEST/.test(code) || status >= 400) return 'request_failed'
  if (/DATA|CATALOG/.test(code)) return 'data_unavailable'
  return fallback
}

export function reportDiagnosticEvent(event) {
  try {
    return Promise.resolve(electronApi.system.recordDiagnosticEvent(event)).catch(() => ({ recorded: false }))
  } catch {
    return Promise.resolve({ recorded: false })
  }
}

export function reportDiagnosticFailure(area, operation, error, fallback) {
  return reportDiagnosticEvent({
    area,
    operation,
    outcome: 'failed',
    reasonCode: classifyDiagnosticError(error, fallback)
  })
}

export function reportDiagnosticRecovery(area, operation) {
  return reportDiagnosticEvent({ area, operation, outcome: 'recovered' })
}
