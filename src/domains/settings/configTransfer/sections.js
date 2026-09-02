import {
  ConfigTransferError,
  cloneTransferValue,
  isPlainObject,
  normalizePresetGrid,
  normalizeToolSiteUrl,
  sanitizeTransferValue
} from './core.js'

export const SECTION_FIELD_WHITELISTS = Object.freeze({
  'preset.item': Object.freeze(['items']),
  'preset.essence': Object.freeze(['items']),
  'preset.harvest': Object.freeze(['items']),
  'preset.map': Object.freeze(['items']),
  'preset.story': Object.freeze(['items']),
  'preset.storySkill': Object.freeze(['items']),
  'settings.toolSites': Object.freeze(['sites'])
})

const PRESET_SECTION_IDS = new Set([
  'preset.item', 'preset.essence', 'preset.harvest', 'preset.map', 'preset.story', 'preset.storySkill'
])

function clone(value) {
  return cloneTransferValue(value)
}

export function pickSectionFields(sectionId, value) {
  const fields = SECTION_FIELD_WHITELISTS[sectionId]
  if (!fields) throw new ConfigTransferError('UNKNOWN_SECTION', `不支持配置区块：${sectionId}`, { sectionId })
  const source = isPlainObject(value) ? value : {}
  return Object.fromEntries(fields.filter(field => Object.hasOwn(source, field)).map(field => [field, clone(source[field])]))
}

function normalizeText(value, maxLength = 200) {
  return String(value || '').trim().slice(0, maxLength)
}

function normalizePresetItems(sectionId, value) {
  if (!Array.isArray(value?.items)) {
    throw new ConfigTransferError('SECTION_DATA_INVALID', `预设区块结构无效：${sectionId}`, { sectionId })
  }
  if (value.items.length > 2000) {
    throw new ConfigTransferError('SECTION_ITEM_LIMIT', `预设数量过多：${sectionId}`, { sectionId })
  }
  return {
    items: value.items.map((record, index) => {
      if (!isPlainObject(record) || !isPlainObject(record.data)) {
        throw new ConfigTransferError('PRESET_INVALID', `第 ${index + 1} 个预设结构无效`, { sectionId, index })
      }
      const name = normalizeText(record.name)
      if (!name) throw new ConfigTransferError('PRESET_NAME_REQUIRED', `第 ${index + 1} 个预设名称为空`, { sectionId, index })
      const normalized = {
        recordKey: normalizeText(record.recordKey, 300) || `${sectionId}:${index}`,
        name,
        data: sanitizeTransferValue(record.data)
      }
      if (sectionId === 'preset.map' && record.deviceGrid) {
        normalized.deviceGrid = normalizePresetGrid(record.deviceGrid)
      }
      return normalized
    })
  }
}

function normalizeToolSites(value) {
  const sites = Array.isArray(value?.sites) ? value.sites : []
  return {
    sites: sites.slice(0, 1000).flatMap(site => {
      const name = normalizeText(site?.name, 100)
      const url = normalizeToolSiteUrl(site?.url)
      if (!name || !url) return []
      return [{
        name,
        url,
        description: normalizeText(site?.description, 500),
        imageUrl: normalizeToolSiteUrl(site?.imageUrl)
      }]
    })
  }
}

export function normalizeSectionData(sectionId, rawValue) {
  const value = pickSectionFields(sectionId, rawValue)
  if (PRESET_SECTION_IDS.has(sectionId)) return normalizePresetItems(sectionId, value)
  if (sectionId === 'settings.toolSites') return sanitizeTransferValue(normalizeToolSites(value))
  throw new ConfigTransferError('UNKNOWN_SECTION', `不支持配置区块：${sectionId}`, { sectionId })
}

export function normalizeExportSectionData(sectionId, rawValue) {
  return normalizeSectionData(sectionId, rawValue)
}
