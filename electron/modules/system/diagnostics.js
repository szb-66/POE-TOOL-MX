import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'

export const DIAGNOSTICS_SCHEMA_VERSION = 3
export const DIAGNOSTIC_CAPTURE_DURATION_MS = 15 * 60 * 1000

export const DIAGNOSTIC_AREAS = new Set([
  'system', 'shortcuts', 'items', 'bag', 'map', 'combat', 'story', 'shop',
  'priceCheck', 'crafting', 'stashPickup', 'puzzle', 'junfeng'
])
export const DIAGNOSTIC_OPERATIONS = new Set([
  'platform_check', 'user_data_check', 'administrator_check', 'display_check',
  'network_check', 'runtime_check', 'game_window_check', 'shortcut_registration',
  'shortcut_scope',
  'module_state', 'script_start', 'script_runtime', 'detection', 'automation',
  'authentication', 'refresh', 'query', 'data_load', 'data_update', 'analysis',
  'auto_placement', 'pickup', 'region_capture'
])
export const DIAGNOSTIC_REASON_CODES = new Set([
  'unknown_failure', 'unavailable', 'unsupported_platform', 'unsupported_arch',
  'directory_unwritable', 'runtime_unavailable', 'game_window_not_found',
  'permission_denied', 'invalid_configuration', 'shortcut_registration_failed',
  'shortcut_scope_paused', 'shortcut_scope_title_mismatch',
  'shortcut_scope_process_mismatch', 'shortcut_scope_no_foreground_window',
  'foreground_watcher_failed',
  'process_start_failed', 'process_exit', 'foreground_lost',
  'authentication_required', 'authentication_failed', 'network_unavailable',
  'request_failed', 'rate_limited', 'data_unavailable', 'catalog_degraded',
  'automation_failed', 'write_failed', 'event_store_corrupt', 'screen_capture_failed',
  'capture_source_not_found', 'picker_load_failed', 'ocr_failed',
  'template_match_failed', 'coordinate_failed', 'calibration_invalid',
  'network_timeout', 'response_parse_failed', 'data_invalid'
])

export const DIAGNOSTIC_SYMPTOMS = new Set([
  'cannot_start', 'wrong_result', 'stops_during_use', 'slow_or_stuck',
  'intermittent', 'crash_or_exit', 'other_unexpected'
])
export const DIAGNOSTIC_STAGE_CODES = new Set([
  'configuration', 'startup', 'runtime', 'capture', 'recognition', 'calibration',
  'authentication', 'network', 'parsing', 'automation', 'persistence', 'unknown'
])
export const DIAGNOSTIC_CAPTURE_STATUSES = new Set([
  'active', 'completed', 'canceled', 'timed_out', 'interrupted'
])

const MODULE_IDS = new Set([
  'items', 'bag', 'map', 'combat', 'story', 'shop', 'priceCheck', 'crafting',
  'stashPickup', 'puzzle', 'junfeng'
])
const MODULE_STATES = new Set(['running', 'ready', 'attention', 'error'])
const HEALTH_IDS = new Set([
  'platform', 'userData', 'administrator', 'displays', 'network', 'runtime', 'game',
  'python', 'shortcuts', 'dpi', 'diagnosticEvents'
])
const HEALTH_STATES = new Set(['ready', 'attention', 'error', 'pending'])
const EVENT_OUTCOMES = new Set(['failed', 'recovered'])
const EVENT_METADATA_KEYS = new Set([
  'count', 'durationMs', 'exitCode', 'httpStatus', 'activeCount',
  'displayCount', 'sourceCount', 'usableSourceCount', 'matchedDisplayCount'
])
const RUNTIME_SOURCES = new Set(['bundled', 'prepared', 'override', 'system', 'unavailable'])
const RUNTIME_MODULES = new Set(['cv2', 'mss', 'numpy', 'pynput', 'pyperclip'])
const SUGGESTED_CHECKS = Object.freeze({
  runtime_unavailable: 'check_runtime', process_start_failed: 'check_process_start',
  process_exit: 'check_process_exit', game_window_not_found: 'check_game_window',
  foreground_lost: 'check_foreground_window', screen_capture_failed: 'check_screen_capture',
  capture_source_not_found: 'check_capture_sources', picker_load_failed: 'check_picker_window',
  ocr_failed: 'check_ocr_inputs', template_match_failed: 'check_templates',
  coordinate_failed: 'check_coordinates', calibration_invalid: 'check_calibration',
  invalid_configuration: 'check_configuration', authentication_required: 'check_authentication',
  authentication_failed: 'check_authentication', network_unavailable: 'check_network',
  network_timeout: 'check_network_timeout', request_failed: 'check_request',
  rate_limited: 'check_rate_limit', response_parse_failed: 'check_response_format',
  data_unavailable: 'check_data_catalog', data_invalid: 'check_data_integrity',
  directory_unwritable: 'check_user_data_permissions', permission_denied: 'check_permissions',
  automation_failed: 'check_automation_stage', unknown_failure: 'collect_more_evidence'
})

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function redactDiagnosticText(value, homeDirectory = os.homedir()) {
  let text = String(value ?? '')
  if (homeDirectory) {
    const variants = new Set([
      String(homeDirectory),
      String(homeDirectory).replaceAll('\\', '/'),
      String(homeDirectory).replaceAll('/', '\\')
    ])
    for (const variant of variants) {
      if (variant) text = text.replace(new RegExp(escapeRegExp(variant), 'gi'), '%USERPROFILE%')
    }
  }

  return text
    .replace(/\b(?:authorization)\s*["']?\s*[:=]\s*["']?bearer\s+[^"'\r\n,;}&]+/gi, 'authorization=[redacted]')
    .replace(/\bbearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/\b(POESESSID|cookie|session[_-]?token|access[_-]?token|refresh[_-]?token|authorization)\s*["']?\s*[:=]\s*["']?[^"'\r\n,;}&]+/gi, '$1=[redacted]')
    .replace(/([?&](?:POESESSID|session[_-]?token|access[_-]?token|refresh[_-]?token)=)[^&#\s]+/gi, '$1[redacted]')
    .replace(/\b(account(?:Id|Name)?|user(?:Id|Name)?)\s*["']?\s*[:=]\s*["']?[^"'\r\n,;}&\s]+/gi, '$1=[redacted]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
    .replace(/(?<![\d.])(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}(?![\d.])/g, '[ip-address]')
    .replace(/(?<![A-F0-9:])(?:(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}|(?:[A-F0-9]{1,4}:){1,7}:|(?:[A-F0-9]{1,4}:){1,6}:[A-F0-9]{1,4}|(?:[A-F0-9]{1,4}:){1,5}(?::[A-F0-9]{1,4}){1,2}|(?:[A-F0-9]{1,4}:){1,4}(?::[A-F0-9]{1,4}){1,3}|(?:[A-F0-9]{1,4}:){1,3}(?::[A-F0-9]{1,4}){1,4}|(?:[A-F0-9]{1,4}:){1,2}(?::[A-F0-9]{1,4}){1,5}|[A-F0-9]{1,4}:(?:(?::[A-F0-9]{1,4}){1,6})|:(?:(?::[A-F0-9]{1,4}){1,7}|:))(?![A-F0-9:])/gi, '[ip-address]')
    .replace(/\\\\[^\\/\s]+[\\/][^\r\n,;]*/g, '[local-path]')
    .replace(/\b[A-Za-z]:[\\/](?:[^\r\n,;"']+)/g, '[local-path]')
}

export function sanitizeDiagnosticValue(value, homeDirectory = os.homedir()) {
  if (typeof value === 'string') return redactDiagnosticText(value, homeDirectory)
  if (Array.isArray(value)) return value.map(item => sanitizeDiagnosticValue(item, homeDirectory))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => (
      [key, sanitizeDiagnosticValue(item, homeDirectory)]
    )))
  }
  return value
}

export function detectAdministrator() {
  if (process.platform !== 'win32') return false
  try {
    const command = '[Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent() | ForEach-Object { $_.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator) }'
    return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
      encoding: 'utf8', windowsHide: true, timeout: 5000
    }).trim().toLowerCase() === 'true'
  } catch {
    return null
  }
}

function safeReasonCode(value) {
  return DIAGNOSTIC_REASON_CODES.has(value) ? value : null
}

export function sanitizeModuleStates(states = []) {
  const unique = new Map((Array.isArray(states) ? states : [])
    .filter(entry => MODULE_IDS.has(entry?.id) && MODULE_STATES.has(entry?.state))
    .map(entry => [entry.id, entry]))
  return [...unique.values()].map((entry) => ({
      id: entry.id,
      state: entry.state,
      ...(safeReasonCode(entry.reasonCode) ? { reasonCode: entry.reasonCode } : {})
    }))
}

export function sanitizeHealthStates(states = []) {
  const unique = new Map((Array.isArray(states) ? states : [])
    .filter(entry => HEALTH_IDS.has(entry?.id) && HEALTH_STATES.has(entry?.status))
    .map(entry => [entry.id, entry]))
  return [...unique.values()].map(entry => ({
      id: entry.id,
      status: entry.status,
      ...(safeReasonCode(entry.reasonCode) ? { reasonCode: entry.reasonCode } : {})
    }))
}

export function sanitizeDiagnosticEvent(event = {}) {
  if (!DIAGNOSTIC_AREAS.has(event.area) || !DIAGNOSTIC_OPERATIONS.has(event.operation) ||
      !EVENT_OUTCOMES.has(event.outcome)) return null
  const reasonCode = event.outcome === 'recovered' ? null : safeReasonCode(event.reasonCode) || 'unknown_failure'
  const metadata = Object.fromEntries(Object.entries(event.metadata || {})
    .filter(([key, item]) => EVENT_METADATA_KEYS.has(key) && Number.isFinite(Number(item)))
    .map(([key, item]) => [key, Number(item)]))
  const timestamp = Number.isFinite(Date.parse(event.timestamp)) ? new Date(event.timestamp).toISOString() : null
  if (!timestamp) return null
  return {
    timestamp,
    sessionId: typeof event.sessionId === 'string' && /^[a-f0-9-]{36}$/i.test(event.sessionId) ? event.sessionId : 'unknown',
    appVersion: String(event.appVersion || 'unknown'),
    ...(typeof event.captureId === 'string' && /^[a-f0-9-]{36}$/i.test(event.captureId)
      ? { captureId: event.captureId }
      : {}),
    area: event.area,
    operation: event.operation,
    outcome: event.outcome,
    ...(reasonCode ? { reasonCode } : {}),
    ...(DIAGNOSTIC_STAGE_CODES.has(event.stageCode) ? { stageCode: event.stageCode } : {}),
    repeatCount: Math.max(1, Math.floor(Number(event.repeatCount) || 1)),
    ...(Object.keys(metadata).length ? { metadata } : {})
  }
}

export function sanitizeDiagnosticContext(context = {}) {
  if (context?.mode !== 'capture') return { mode: 'snapshot' }
  const startedAt = Number.isFinite(Date.parse(context.startedAt)) ? new Date(context.startedAt).toISOString() : null
  const endedAt = Number.isFinite(Date.parse(context.endedAt)) ? new Date(context.endedAt).toISOString() : null
  if (!/^[a-f0-9-]{36}$/i.test(String(context.captureId || '')) ||
      !DIAGNOSTIC_AREAS.has(context.area) || !DIAGNOSTIC_SYMPTOMS.has(context.symptom) ||
      !DIAGNOSTIC_CAPTURE_STATUSES.has(context.status) || !startedAt) return { mode: 'snapshot' }
  return {
    mode: 'capture', captureId: context.captureId, area: context.area, symptom: context.symptom,
    status: context.status, startedAt, ...(endedAt ? { endedAt } : {})
  }
}

function safeGpuList(value) {
  return (Array.isArray(value) ? value : value ? [value] : [])
    .map(item => ({
      model: item?.model || item?.Name ? String(item.model || item.Name) : null,
      driverVersion: item?.driverVersion || item?.DriverVersion
        ? String(item.driverVersion || item.DriverVersion)
        : null
    }))
    .filter(item => item.model || item.driverVersion)
}

export function collectDeviceInfo({
  platform = process.platform,
  release = os.release(),
  version = os.version(),
  cpus = os.cpus(),
  totalMemoryBytes = os.totalmem(),
  queryGpu = null
} = {}) {
  let gpus = []
  let gpuAvailable = platform !== 'win32'
  if (platform === 'win32') {
    try {
      const result = queryGpu ? queryGpu() : execFileSync('powershell.exe', [
        '-NoProfile', '-NonInteractive', '-Command',
        'Get-CimInstance Win32_VideoController | Select-Object Name,DriverVersion | ConvertTo-Json -Compress'
      ], { encoding: 'utf8', windowsHide: true, timeout: 5000 })
      const parsed = typeof result === 'string'
        ? JSON.parse(String(result).trim().replace(/^\uFEFF/, '') || '[]')
        : result
      gpus = safeGpuList(parsed)
      gpuAvailable = true
    } catch {
      gpuAvailable = false
    }
  }
  const cpuList = Array.isArray(cpus) ? cpus : []
  const build = String(release || '').split('.').at(-1) || null
  return {
    device: {
      windows: platform === 'win32' ? { name: String(version || 'Windows'), release: String(release), build } : null,
      cpu: cpuList.length ? { model: String(cpuList[0]?.model || 'unknown'), logicalCores: cpuList.length } : null,
      memory: Number.isFinite(Number(totalMemoryBytes)) ? { totalBytes: Math.max(0, Math.floor(Number(totalMemoryBytes))) } : null,
      gpus
    },
    availability: {
      windows: platform === 'win32', cpu: cpuList.length > 0,
      memory: Number.isFinite(Number(totalMemoryBytes)), gpu: gpuAvailable
    }
  }
}

function createFindings({ context, health, modules, events }) {
  const selectedArea = context.mode === 'capture' ? context.area : null
  const groups = new Map()
  events.forEach((event, index) => {
    const key = `${event.area}:${event.operation}`
    if (event.outcome === 'recovered') {
      for (const group of groups.values()) {
        if (group.area === event.area && group.operation === event.operation && group.status === 'active') {
          group.status = 'recovered'
        }
      }
      return
    }
    const fullKey = `${key}:${event.reasonCode}:${event.stageCode || 'unknown'}`
    const existing = groups.get(fullKey)
    const occurrenceCount = Math.max(1, event.repeatCount || 1)
    groups.set(fullKey, existing ? {
      ...existing, lastSeen: event.timestamp, occurrenceCount: existing.occurrenceCount + occurrenceCount,
      evidence: [...existing.evidence, `recentEvents[${event.evidenceIndex ?? index}]`]
    } : {
      area: event.area, operation: event.operation, reasonCode: event.reasonCode,
      stageCode: event.stageCode || 'unknown', status: 'active', confidence: 'direct',
      firstSeen: event.timestamp, lastSeen: event.timestamp, occurrenceCount,
      evidence: [`recentEvents[${event.evidenceIndex ?? index}]`]
    })
  })
  const stateFindings = [
    ...modules.filter(item => ['attention', 'error'].includes(item.state)).map(item => ({
      area: item.id, operation: 'module_state', reasonCode: item.reasonCode || 'unknown_failure',
      stageCode: item.state === 'attention' ? 'configuration' : 'unknown', status: 'active',
      confidence: 'derived', occurrenceCount: 1, evidence: [`modules.${item.id}`]
    })),
    ...health.filter(item => ['attention', 'error'].includes(item.status)).map(item => ({
      area: item.id === 'shortcuts' ? 'shortcuts' : 'system', operation: 'module_state',
      reasonCode: item.reasonCode || 'unavailable', stageCode: 'configuration', status: 'active',
      confidence: 'derived', occurrenceCount: 1, evidence: [`health.${item.id}`]
    }))
  ]
  for (const item of stateFindings) {
    const duplicate = [...groups.values()].some(existing => existing.area === item.area && existing.reasonCode === item.reasonCode)
    if (!duplicate) groups.set(`state:${item.area}:${item.reasonCode}`, item)
  }
  return [...groups.values()]
    .map(item => ({ ...item, suggestedCheckCode: SUGGESTED_CHECKS[item.reasonCode] || 'collect_more_evidence' }))
    .sort((left, right) => {
      const rank = item => (item.area === selectedArea ? 8 : 0) + (item.status === 'active' ? 4 : 0) +
        (item.confidence === 'direct' ? 2 : 0) + Math.min(1, item.occurrenceCount / 10)
      return rank(right) - rank(left) || String(right.lastSeen || '').localeCompare(String(left.lastSeen || ''))
    })
}

function sanitizeRuntime(runtime = {}) {
  return {
    ready: Boolean(runtime.ready || runtime.found),
    source: RUNTIME_SOURCES.has(runtime.source) ? runtime.source : 'unavailable',
    version: runtime.version ? String(runtime.version) : null,
    modules: Array.isArray(runtime.modules)
      ? [...new Set(runtime.modules.map(String).filter(name => RUNTIME_MODULES.has(name)))].sort()
      : [],
    error: runtime.error ? redactDiagnosticText(runtime.error) : null
  }
}

function sanitizeGameDpi(dpi = {}) {
  return {
    found: Boolean(dpi.found),
    dpi: Number.isFinite(Number(dpi.dpi)) ? Number(dpi.dpi) : null,
    scaleFactor: Number.isFinite(Number(dpi.scaleFactor)) ? Number(dpi.scaleFactor) : null,
    primaryScaleFactor: Number.isFinite(Number(dpi.primaryScaleFactor)) ? Number(dpi.primaryScaleFactor) : null,
    error: dpi.error ? redactDiagnosticText(dpi.error) : null
  }
}

export function createDiagnosticsSnapshot({
  diagnosticId = randomUUID(),
  appVersion,
  electronVersion,
  chromiumVersion,
  nodeVersion,
  packaged = false,
  uptimeSeconds = process.uptime(),
  platform = process.platform,
  release = os.release(),
  arch = process.arch,
  administrator = null,
  displays = [],
  runtime = {},
  gameDpi = {},
  health = [],
  modules = [],
  recentEvents = [],
  context = { mode: 'snapshot' },
  device = {},
  deviceAvailability = {},
  generatedAt = new Date().toISOString()
} = {}) {
  const safeContext = sanitizeDiagnosticContext(context)
  const safeHealth = sanitizeHealthStates(health)
  const safeModules = sanitizeModuleStates(modules)
  const safeEvents = (Array.isArray(recentEvents) ? recentEvents : []).map(sanitizeDiagnosticEvent).filter(Boolean)
  const indexedEvents = safeEvents.map((event, evidenceIndex) => ({ ...event, evidenceIndex }))
  const findingEvents = safeContext.mode === 'capture'
    ? indexedEvents.filter(event => event.captureId === safeContext.captureId)
    : indexedEvents
  const snapshot = {
    schemaVersion: DIAGNOSTICS_SCHEMA_VERSION,
    diagnosticId: String(diagnosticId),
    generatedAt,
    application: {
      version: String(appVersion || 'unknown'),
      electron: String(electronVersion || 'unknown'),
      chromium: String(chromiumVersion || 'unknown'),
      node: String(nodeVersion || 'unknown'),
      packaged: Boolean(packaged),
      uptimeSeconds: Math.max(0, Math.floor(Number(uptimeSeconds) || 0))
    },
    system: {
      platform: String(platform), release: String(release), arch: String(arch),
      administrator: administrator === null ? null : Boolean(administrator)
    },
    device: {
      windows: device?.windows ? {
        name: String(device.windows.name || 'Windows'), release: String(device.windows.release || ''),
        build: device.windows.build == null ? null : String(device.windows.build)
      } : null,
      cpu: device?.cpu ? {
        model: String(device.cpu.model || 'unknown'),
        logicalCores: Math.max(0, Math.floor(Number(device.cpu.logicalCores) || 0))
      } : null,
      memory: device?.memory ? { totalBytes: Math.max(0, Math.floor(Number(device.memory.totalBytes) || 0)) } : null,
      gpus: safeGpuList(device?.gpus)
    },
    displays: (Array.isArray(displays) ? displays : []).map((display, index) => ({
      id: String(display?.id ?? index),
      primary: Boolean(display?.primary),
      bounds: {
        x: Number(display?.bounds?.x) || 0, y: Number(display?.bounds?.y) || 0,
        width: Number(display?.bounds?.width) || 0, height: Number(display?.bounds?.height) || 0
      },
      scaleFactor: Number(display?.scaleFactor) || 1,
      rotation: Number(display?.rotation) || 0
    })),
    runtime: sanitizeRuntime(runtime),
    game: sanitizeGameDpi(gameDpi),
    health: safeHealth,
    modules: safeModules,
    recentEvents: safeEvents,
    context: safeContext,
    findings: createFindings({ context: safeContext, health: safeHealth, modules: safeModules, events: findingEvents }),
    coverage: {
      schemaVersion: DIAGNOSTICS_SCHEMA_VERSION,
      areas: [...DIAGNOSTIC_AREAS],
      operations: [...DIAGNOSTIC_OPERATIONS],
      probes: {
        windows: Boolean(deviceAvailability.windows), cpu: Boolean(deviceAvailability.cpu),
        memory: Boolean(deviceAvailability.memory), gpu: Boolean(deviceAvailability.gpu),
        runtime: Boolean(runtime?.ready || runtime?.found), display: Array.isArray(displays) && displays.length > 0,
        gameWindow: Boolean(gameDpi?.found)
      }
    }
  }
  return sanitizeDiagnosticValue(snapshot)
}

export function diagnosticFileName(date = new Date()) {
  const value = date.toISOString().replace(/\.\d{3}Z$/, '').replaceAll(':', '').replace('T', '-')
  return `流放助手-诊断-${value}.json`
}

export function safeExportResult(filePath) {
  return { success: true, canceled: false, fileName: path.basename(filePath) }
}
