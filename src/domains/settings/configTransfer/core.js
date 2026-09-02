import {
  CONFIG_BUNDLE_KIND,
  CONFIG_BUNDLE_MAX_BYTES,
  CONFIG_BUNDLE_VERSION,
  CONFIG_SECTION_SCHEMA_VERSION
} from '../../../../shared/configTransfer.js'

export {
  CONFIG_BUNDLE_KIND,
  CONFIG_BUNDLE_MAX_BYTES,
  CONFIG_BUNDLE_VERSION,
  CONFIG_SECTION_SCHEMA_VERSION
}

export const CONFIG_SECTION_DEFINITIONS = Object.freeze([
  { id: 'preset.item', group: 'preset', label: '通用制作预设', itemized: true },
  { id: 'preset.essence', group: 'preset', label: '精华制作预设', itemized: true },
  { id: 'preset.harvest', group: 'preset', label: '花园工艺预设', itemized: true },
  { id: 'preset.map', group: 'preset', label: '地图预设', itemized: true, supportsDeviceGrid: true },
  { id: 'preset.story', group: 'preset', label: '剧情预设', itemized: true },
  { id: 'preset.storySkill', group: 'preset', label: '剧情技能预设', itemized: true },
  { id: 'settings.toolSites', group: 'tools', label: '工具站点' }
].map(definition => Object.freeze({ schemaVersion: CONFIG_SECTION_SCHEMA_VERSION, ...definition })))

export const CONFIG_SECTION_DEFINITION_MAP = Object.freeze(Object.fromEntries(
  CONFIG_SECTION_DEFINITIONS.map(definition => [definition.id, definition])
))

export const EMPTY_PRESET_GRID = Object.freeze({
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
  rows: 5,
  cols: 12
})

const SENSITIVE_KEY = /(?:authorization|cookie|session|token|password|secret|accountname|diagnostic|training|cache|logs?|backgroundpath|templatepath|filepath|(?:^|_)path$)/i
const UNSAFE_OBJECT_KEY = new Set(['__proto__', 'prototype', 'constructor'])
const SENSITIVE_QUERY_KEY = /(?:token|key|auth|authorization|session|cookie|password|secret|code)/i

export class ConfigTransferError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'ConfigTransferError'
    this.code = code
    this.details = details
  }
}

export function utf8ByteLength(value) {
  return new TextEncoder().encode(String(value ?? '')).byteLength
}

export function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function isAbsolutePathLike(value) {
  if (typeof value !== 'string') return false
  const text = value.trim()
  return /^[a-z]:[\\/]/i.test(text) || /^\\\\/.test(text) || /^file:/i.test(text) || /^\/(?!\/)/.test(text)
}

function sanitizedEntries(value, depth, options) {
  if (depth > options.maxDepth) {
    throw new ConfigTransferError('DATA_TOO_DEEP', '配置数据嵌套层级过深')
  }
  const result = {}
  for (const [key, entry] of Object.entries(value)) {
    if (UNSAFE_OBJECT_KEY.has(key) || SENSITIVE_KEY.test(key)) continue
    const sanitized = sanitizeTransferValue(entry, { ...options, depth: depth + 1 })
    if (sanitized !== undefined) result[key] = sanitized
  }
  return result
}

export function sanitizeTransferValue(value, options = {}) {
  const settings = {
    maxDepth: Number.isInteger(options.maxDepth) ? options.maxDepth : 40,
    depth: Number.isInteger(options.depth) ? options.depth : 0,
    stripAbsolutePaths: options.stripAbsolutePaths !== false
  }
  if (value == null || typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'string') {
    if (settings.stripAbsolutePaths && isAbsolutePathLike(value)) return undefined
    return value
  }
  if (Array.isArray(value)) {
    if (settings.depth > settings.maxDepth) throw new ConfigTransferError('DATA_TOO_DEEP', '配置数据嵌套层级过深')
    return value
      .map(entry => sanitizeTransferValue(entry, { ...settings, depth: settings.depth + 1 }))
      .filter(entry => entry !== undefined)
  }
  if (!isPlainObject(value)) return undefined
  return sanitizedEntries(value, settings.depth, settings)
}

export function cloneTransferValue(value) {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    throw new ConfigTransferError('DATA_NOT_SERIALIZABLE', '配置数据无法序列化')
  }
}

function normalizeSectionForExport(sectionId, section) {
  const definition = CONFIG_SECTION_DEFINITION_MAP[sectionId]
  if (!definition) throw new ConfigTransferError('UNKNOWN_SECTION', `不支持导出区块：${sectionId}`, { sectionId })
  const schemaVersion = Number(section?.schemaVersion ?? definition.schemaVersion)
  if (schemaVersion !== definition.schemaVersion) {
    throw new ConfigTransferError('SECTION_VERSION_UNSUPPORTED', `区块版本不受支持：${sectionId}`, { sectionId, schemaVersion })
  }
  return {
    schemaVersion,
    data: sanitizeTransferValue(cloneTransferValue(section?.data))
  }
}

export function createConfigBundle({ appVersion = '', exportedAt = new Date().toISOString(), sections = {} } = {}) {
  if (!isPlainObject(sections) || Object.keys(sections).length === 0) {
    throw new ConfigTransferError('NO_SECTIONS_SELECTED', '请至少选择一个配置区块')
  }
  const timestamp = new Date(exportedAt)
  if (Number.isNaN(timestamp.getTime())) throw new ConfigTransferError('INVALID_EXPORTED_AT', '导出时间无效')
  const normalizedSections = Object.fromEntries(
    Object.entries(sections).map(([sectionId, section]) => [sectionId, normalizeSectionForExport(sectionId, section)])
  )
  const bundle = {
    kind: CONFIG_BUNDLE_KIND,
    formatVersion: CONFIG_BUNDLE_VERSION,
    appVersion: String(appVersion || ''),
    exportedAt: timestamp.toISOString(),
    sections: normalizedSections
  }
  serializeConfigBundle(bundle)
  return bundle
}

export function serializeConfigBundle(bundle) {
  let content = ''
  try {
    content = `${JSON.stringify(bundle, null, 2)}\n`
  } catch {
    throw new ConfigTransferError('DATA_NOT_SERIALIZABLE', '配置数据无法序列化')
  }
  const bytes = utf8ByteLength(content)
  if (bytes > CONFIG_BUNDLE_MAX_BYTES) {
    throw new ConfigTransferError('FILE_TOO_LARGE', '配置文件超过 5 MiB 限制', { bytes, maxBytes: CONFIG_BUNDLE_MAX_BYTES })
  }
  return content
}

function validateBundleEnvelope(bundle) {
  if (!isPlainObject(bundle)) throw new ConfigTransferError('INVALID_BUNDLE', '配置文件顶层结构无效')
  if (bundle.kind !== CONFIG_BUNDLE_KIND) throw new ConfigTransferError('INVALID_KIND', '不是流放助手配置文件')
  const formatVersion = Number(bundle.formatVersion)
  if (!Number.isInteger(formatVersion) || formatVersion < 1) {
    throw new ConfigTransferError('INVALID_FORMAT_VERSION', '配置文件格式版本无效')
  }
  if (formatVersion > CONFIG_BUNDLE_VERSION) {
    throw new ConfigTransferError('FUTURE_FORMAT_VERSION', '配置文件由更高版本的流放助手生成', { formatVersion })
  }
  if (formatVersion !== CONFIG_BUNDLE_VERSION) {
    throw new ConfigTransferError('FORMAT_VERSION_UNSUPPORTED', '不支持该配置文件格式版本', { formatVersion })
  }
  if (!isPlainObject(bundle.sections)) throw new ConfigTransferError('INVALID_SECTIONS', '配置区块结构无效')
}

function inspectSection(sectionId, section) {
  const definition = CONFIG_SECTION_DEFINITION_MAP[sectionId]
  if (!definition) return { id: sectionId, status: 'unsupported', selectable: false, reason: '未知区块' }
  if (!isPlainObject(section) || !Object.hasOwn(section, 'data')) {
    return { ...definition, status: 'invalid', selectable: false, reason: '区块结构无效' }
  }
  const schemaVersion = Number(section.schemaVersion)
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
    return { ...definition, status: 'invalid', selectable: false, reason: '区块版本无效' }
  }
  if (schemaVersion > definition.schemaVersion) {
    return { ...definition, schemaVersion, status: 'future', selectable: false, reason: '区块由更高版本生成' }
  }
  if (schemaVersion !== definition.schemaVersion) {
    return { ...definition, schemaVersion, status: 'unsupported', selectable: false, reason: '区块版本不受支持' }
  }
  return { ...definition, schemaVersion, status: 'compatible', selectable: true, reason: '' }
}

export function parseConfigBundle(content) {
  if (typeof content !== 'string') throw new ConfigTransferError('INVALID_CONTENT', '配置文件内容无效')
  const bytes = utf8ByteLength(content)
  if (bytes > CONFIG_BUNDLE_MAX_BYTES) {
    throw new ConfigTransferError('FILE_TOO_LARGE', '配置文件超过 5 MiB 限制', { bytes, maxBytes: CONFIG_BUNDLE_MAX_BYTES })
  }
  let bundle
  try {
    bundle = JSON.parse(content)
  } catch {
    throw new ConfigTransferError('INVALID_JSON', '配置文件不是有效的 JSON')
  }
  validateBundleEnvelope(bundle)
  const sections = Object.entries(bundle.sections).map(([sectionId, section]) => inspectSection(sectionId, section))
  return {
    bundle,
    bytes,
    sections,
    compatibleSectionIds: sections.filter(section => section.selectable).map(section => section.id),
    defaultSelectedSectionIds: sections.filter(section => section.selectable).map(section => section.id)
  }
}

export function toConfigTransferError(error, fallbackCode = 'UNKNOWN') {
  if (error instanceof ConfigTransferError) return error
  return new ConfigTransferError(fallbackCode, error?.message || '配置操作失败')
}

export function createTransferRecordKey(prefix = 'record') {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return `${prefix}-${uuid}`
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function normalizePresetGrid(raw) {
  if (!isPlainObject(raw)) return { ...EMPTY_PRESET_GRID }
  const fields = ['startX', 'startY', 'offsetX', 'offsetY']
  const numbers = Object.fromEntries(fields.map(field => [field, Number(raw[field])]))
  const rows = Number(raw.rows)
  const cols = Number(raw.cols)
  const coordinatesValid = fields.every(field => Number.isFinite(numbers[field]) && Math.abs(numbers[field]) <= 100000)
  if (!coordinatesValid || !Number.isInteger(rows) || rows < 1 || rows > 20 || !Number.isInteger(cols) || cols < 1 || cols > 20) {
    return { ...EMPTY_PRESET_GRID }
  }
  return { ...numbers, rows, cols }
}

export function createPresetTransferRecord(preset, {
  dataKey = '',
  includeDeviceGrid = false,
  recordKeyFactory = createTransferRecordKey
} = {}) {
  if (!isPlainObject(preset)) throw new ConfigTransferError('PRESET_INVALID', '预设结构无效')
  const name = String(preset.name || '').trim()
  if (!name) throw new ConfigTransferError('PRESET_NAME_REQUIRED', '预设名称不能为空')
  let data
  if (dataKey) {
    data = cloneTransferValue(preset[dataKey] || {})
  } else {
    const { id: _id, name: _name, isDefault: _isDefault, default: _default, ...rest } = preset
    data = cloneTransferValue(rest)
  }
  let deviceGrid
  if (dataKey === 'map') {
    const sourceGrid = data.grid
    delete data.grid
    if (includeDeviceGrid) deviceGrid = normalizePresetGrid(sourceGrid)
  }
  const record = {
    recordKey: recordKeyFactory('preset'),
    name,
    data: sanitizeTransferValue(data)
  }
  if (deviceGrid) record.deviceGrid = deviceGrid
  return record
}

export function allocateImportedName(sourceName, existingNames) {
  const names = existingNames instanceof Set ? existingNames : new Set(existingNames || [])
  const base = String(sourceName || '').trim() || '导入预设'
  let candidate = `${base}（导入）`
  let suffix = 2
  while (names.has(candidate)) {
    candidate = `${base}（导入 ${suffix}）`
    suffix += 1
  }
  names.add(candidate)
  return candidate
}

export function createImportedPreset(record, {
  dataKey = '',
  existingNames = new Set(),
  acceptDeviceGrid = false,
  createId = () => createTransferRecordKey('preset'),
  normalizeData = value => value,
  transformPreset = value => value
} = {}) {
  if (!isPlainObject(record) || !isPlainObject(record.data)) {
    throw new ConfigTransferError('PRESET_INVALID', '导入预设结构无效')
  }
  const name = allocateImportedName(record.name, existingNames)
  const normalized = normalizeData(cloneTransferValue(record.data))
  if (!isPlainObject(normalized)) throw new ConfigTransferError('PRESET_INVALID', '导入预设配置无效')
  if (dataKey === 'map') {
    normalized.grid = acceptDeviceGrid && record.deviceGrid
      ? normalizePresetGrid(record.deviceGrid)
      : { ...EMPTY_PRESET_GRID }
  }
  const preset = dataKey
    ? { id: createId(), name, [dataKey]: normalized }
    : { id: createId(), name, ...normalized }
  return transformPreset(preset)
}

export function normalizeToolSiteUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  try {
    const url = new URL(value.trim())
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    url.username = ''
    url.password = ''
    url.hash = ''
    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_QUERY_KEY.test(key)) url.searchParams.delete(key)
    }
    url.searchParams.sort()
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '')
    return url.toString()
  } catch {
    return ''
  }
}

export function mergeToolSites(localSites = [], importedSites = [], idFactory = () => createTransferRecordKey('tool-site')) {
  const local = Array.isArray(localSites) ? cloneTransferValue(localSites) : []
  const imported = Array.isArray(importedSites) ? importedSites : []
  const urls = new Set(local.map(site => normalizeToolSiteUrl(site?.url)).filter(Boolean))
  const merged = [...local]
  let conflicts = 0
  let added = 0
  for (const source of imported) {
    if (!isPlainObject(source)) continue
    const url = normalizeToolSiteUrl(source.url)
    const name = String(source.name || '').trim()
    if (!url || !name) continue
    if (urls.has(url)) {
      conflicts += 1
      continue
    }
    urls.add(url)
    merged.push({
      id: idFactory(),
      name,
      url,
      description: String(source.description || '').trim(),
      imageUrl: normalizeToolSiteUrl(source.imageUrl)
    })
    added += 1
  }
  return { sites: merged, added, conflicts }
}
