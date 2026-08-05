import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'

export const DIAGNOSTICS_SCHEMA_VERSION = 2

export const DIAGNOSTIC_AREAS = new Set([
  'system', 'shortcuts', 'items', 'bag', 'map', 'combat', 'story', 'shop',
  'priceCheck', 'crafting', 'stashPickup', 'puzzle'
])
export const DIAGNOSTIC_OPERATIONS = new Set([
  'platform_check', 'user_data_check', 'administrator_check', 'display_check',
  'network_check', 'runtime_check', 'game_window_check', 'shortcut_registration',
  'shortcut_scope',
  'module_state', 'script_start', 'script_runtime', 'detection', 'automation',
  'authentication', 'refresh', 'query', 'data_load', 'data_update', 'analysis',
  'auto_placement', 'pickup'
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
  'automation_failed', 'write_failed', 'event_store_corrupt'
])

const MODULE_IDS = new Set(['items', 'bag', 'map', 'combat', 'story', 'shop', 'priceCheck', 'crafting'])
const MODULE_STATES = new Set(['running', 'ready', 'attention', 'error'])
const HEALTH_IDS = new Set([
  'platform', 'userData', 'administrator', 'displays', 'network', 'runtime', 'game',
  'python', 'shortcuts', 'dpi', 'diagnosticEvents'
])
const HEALTH_STATES = new Set(['ready', 'attention', 'error', 'pending'])
const EVENT_OUTCOMES = new Set(['failed', 'recovered'])
const EVENT_METADATA_KEYS = new Set(['count', 'durationMs', 'exitCode', 'httpStatus', 'activeCount'])
const RUNTIME_SOURCES = new Set(['bundled', 'prepared', 'override', 'system', 'unavailable'])
const RUNTIME_MODULES = new Set(['cv2', 'mss', 'numpy', 'pynput', 'pyperclip'])

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
    area: event.area,
    operation: event.operation,
    outcome: event.outcome,
    ...(reasonCode ? { reasonCode } : {}),
    repeatCount: Math.max(1, Math.floor(Number(event.repeatCount) || 1)),
    ...(Object.keys(metadata).length ? { metadata } : {})
  }
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
  generatedAt = new Date().toISOString()
} = {}) {
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
    health: sanitizeHealthStates(health),
    modules: sanitizeModuleStates(modules),
    recentEvents: (Array.isArray(recentEvents) ? recentEvents : []).map(sanitizeDiagnosticEvent).filter(Boolean)
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
