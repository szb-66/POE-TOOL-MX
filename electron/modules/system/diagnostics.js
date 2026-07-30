import { execFileSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'

export const DIAGNOSTICS_SCHEMA_VERSION = 1
const MODULE_IDS = new Set(['items', 'bag', 'map', 'combat', 'story', 'shop', 'priceCheck', 'crafting'])
const MODULE_STATES = new Set(['running', 'ready', 'attention', 'error'])

export function redactDiagnosticText(value, homeDirectory = os.homedir()) {
  let text = String(value || '')
  if (homeDirectory) text = text.replaceAll(homeDirectory, '%USERPROFILE%')
  return text
    .replace(/\b(POESESSID|cookie|session[_-]?token|authorization)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
    .replace(/[A-Za-z]:\\(?:[^\\\s:*?"<>|]+\\)+[^\\\s:*?"<>|]*/g, '[local-path]')
}

export function detectAdministrator() {
  if (process.platform !== 'win32') return false
  try {
    const command = '[Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent() | ForEach-Object { $_.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator) }'
    return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 5000
    }).trim().toLowerCase() === 'true'
  } catch {
    return null
  }
}

export function sanitizeModuleStates(states = []) {
  return states
    .filter((entry) => MODULE_IDS.has(entry?.id) && MODULE_STATES.has(entry?.state))
    .map((entry) => ({ id: entry.id, state: entry.state }))
}

function sanitizeRuntime(runtime = {}) {
  return {
    ready: Boolean(runtime.ready || runtime.found),
    source: String(runtime.source || 'unavailable'),
    version: runtime.version ? String(runtime.version) : null,
    modules: Array.isArray(runtime.modules) ? runtime.modules.map(String).sort() : [],
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
  appVersion,
  electronVersion,
  chromiumVersion,
  nodeVersion,
  platform = process.platform,
  release = os.release(),
  arch = process.arch,
  administrator = null,
  displays = [],
  runtime = {},
  gameDpi = {},
  modules = [],
  generatedAt = new Date().toISOString()
} = {}) {
  return {
    schemaVersion: DIAGNOSTICS_SCHEMA_VERSION,
    generatedAt,
    application: {
      version: String(appVersion || 'unknown'),
      electron: String(electronVersion || 'unknown'),
      chromium: String(chromiumVersion || 'unknown'),
      node: String(nodeVersion || 'unknown')
    },
    system: {
      platform: String(platform),
      release: String(release),
      arch: String(arch),
      administrator: administrator === null ? null : Boolean(administrator)
    },
    displays: displays.map((display, index) => ({
      id: String(display?.id ?? index),
      primary: Boolean(display?.primary),
      bounds: {
        x: Number(display?.bounds?.x) || 0,
        y: Number(display?.bounds?.y) || 0,
        width: Number(display?.bounds?.width) || 0,
        height: Number(display?.bounds?.height) || 0
      },
      scaleFactor: Number(display?.scaleFactor) || 1,
      rotation: Number(display?.rotation) || 0
    })),
    runtime: sanitizeRuntime(runtime),
    game: sanitizeGameDpi(gameDpi),
    modules: sanitizeModuleStates(modules)
  }
}

export function diagnosticFileName(date = new Date()) {
  const value = date.toISOString().replace(/\.\d{3}Z$/, '').replaceAll(':', '').replace('T', '-')
  return `流放助手-诊断-${value}.json`
}

export function safeExportResult(filePath) {
  return { success: true, canceled: false, fileName: path.basename(filePath) }
}
