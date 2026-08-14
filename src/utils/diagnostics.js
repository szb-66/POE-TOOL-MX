import { electronApi } from '../api/electron.js'

export function classifyDiagnosticError(error, fallback = 'unknown_failure') {
  const code = String(error?.code || error?.errorCode || '').toUpperCase()
  const status = Number(error?.status || error?.details?.status || error?.httpStatus)
  if (code === 'CAPTURE_SOURCE_NOT_FOUND') return 'capture_source_not_found'
  if (code === 'PICKER_LOAD_FAILED') return 'picker_load_failed'
  if (status === 401 || status === 403 || /AUTH|SESSION|LOGIN/.test(code)) return 'authentication_failed'
  if (status === 429 || /RATE/.test(code)) return 'rate_limited'
  if (/OCR/.test(code)) return 'ocr_failed'
  if (/TEMPLATE|IMAGE_MATCH|MATCH_THRESHOLD/.test(code)) return 'template_match_failed'
  if (/COORDINATE|CLICK|POSITION/.test(code)) return 'coordinate_failed'
  if (/SCREEN|CAPTURE|PICKER/.test(code)) return 'screen_capture_failed'
  if (/CALIBRAT|REGION/.test(code)) return 'calibration_invalid'
  if (/CONFIG|VALIDATION/.test(code)) return 'invalid_configuration'
  if (/FOREGROUND|FOCUS/.test(code)) return 'foreground_lost'
  if (/RUNTIME|PYTHON/.test(code)) return 'runtime_unavailable'
  if (/SPAWN|PROCESS_START/.test(code)) return 'process_start_failed'
  if (/PROCESS_EXIT|EXIT_CODE/.test(code)) return 'process_exit'
  if (/NETWORK_TIMEOUT|REQUEST_TIMEOUT|HTTP_TIMEOUT|ETIMEDOUT/.test(code)) return 'network_timeout'
  if (/PARSE|JSON|RESPONSE_FORMAT/.test(code)) return 'response_parse_failed'
  if (/NETWORK|HTTP|REQUEST/.test(code) || status >= 400) return 'request_failed'
  if (/DATA_INVALID|CORRUPT/.test(code)) return 'data_invalid'
  if (/DATA|CATALOG/.test(code)) return 'data_unavailable'
  return fallback
}

export function classifyDiagnosticStage(error, operation = '') {
  const code = String(error?.code || error?.errorCode || '').toUpperCase()
  if (/CONFIG|VALIDATION/.test(code)) return 'configuration'
  if (/SCREEN|CAPTURE|PICKER/.test(code)) return 'capture'
  if (/OCR|TEMPLATE|IMAGE_MATCH|MATCH_THRESHOLD|DETECT/.test(code)) return 'recognition'
  if (/CALIBRAT|REGION|COORDINATE|CLICK|POSITION/.test(code)) return 'calibration'
  if (/AUTH|SESSION|LOGIN/.test(code) || operation === 'authentication') return 'authentication'
  if (/NETWORK|HTTP|REQUEST|TIMEOUT/.test(code) || ['query', 'refresh'].includes(operation)) return 'network'
  if (/PARSE|JSON|RESPONSE_FORMAT/.test(code)) return 'parsing'
  if (/DATA|CATALOG|WRITE|DIRECTORY/.test(code) || ['data_load', 'data_update'].includes(operation)) return 'persistence'
  if (/RUNTIME|PYTHON|PROCESS|SPAWN|EXIT/.test(code) || ['script_start', 'script_runtime'].includes(operation)) return 'runtime'
  if (operation === 'module_state') return 'configuration'
  if (['automation', 'auto_placement', 'pickup'].includes(operation)) return 'automation'
  return 'unknown'
}

export function reportDiagnosticEvent(event) {
  try {
    return Promise.resolve(electronApi.system.recordDiagnosticEvent(event)).catch(() => ({ recorded: false }))
  } catch {
    return Promise.resolve({ recorded: false })
  }
}

export function reportDiagnosticFailure(area, operation, error, fallback, metadata) {
  return reportDiagnosticEvent({
    area,
    operation,
    outcome: 'failed',
    reasonCode: classifyDiagnosticError(error, fallback),
    stageCode: classifyDiagnosticStage(error, operation),
    ...(metadata ? { metadata } : {})
  })
}

export function reportDiagnosticRecovery(area, operation) {
  return reportDiagnosticEvent({ area, operation, outcome: 'recovered' })
}
