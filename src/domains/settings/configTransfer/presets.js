import { normalizeItemPreset } from '../../../utils/itemPreset.js'
import { normalizeSpecializedPreset } from '../../../utils/specializedCraftingPreset.js'
import { cleanMigratedMapConfig } from '../../../utils/mapPresetMigration.js'
import { createSkillPreset, createStoryPreset } from '../../../utils/storyGuide.js'
import {
  ConfigTransferError,
  createImportedPreset,
  createPresetTransferRecord,
  createTransferRecordKey
} from './core.js'
import { normalizeSectionData } from './sections.js'

export const PRESET_SECTION_CONFIGS = Object.freeze({
  'preset.item': Object.freeze({ collectionKey: 'itemPresets', activeKey: 'currentItemPresetId', dataKey: '' }),
  'preset.essence': Object.freeze({ collectionKey: 'essencePresets', activeKey: 'currentEssencePresetId', dataKey: '' }),
  'preset.harvest': Object.freeze({ collectionKey: 'harvestPresets', activeKey: 'currentHarvestPresetId', dataKey: '' }),
  'preset.map': Object.freeze({ collectionKey: 'mapPresets', activeKey: 'currentMapPresetId', dataKey: 'map' }),
  'preset.story': Object.freeze({ collectionKey: 'storyPresets', activeKey: 'currentStoryPresetId', dataKey: '' }),
  'preset.storySkill': Object.freeze({ collectionKey: 'skillPresets', activeKey: 'currentSkillPresetId', dataKey: '' })
})

function configFor(sectionId) {
  const config = PRESET_SECTION_CONFIGS[sectionId]
  if (!config) throw new ConfigTransferError('UNKNOWN_SECTION', `不支持预设区块：${sectionId}`, { sectionId })
  return config
}

export function createPresetSectionData(sectionId, presets, {
  selectedPresetIds = null,
  includeDeviceGrid = false,
  recordKeyFactory = createTransferRecordKey
} = {}) {
  const config = configFor(sectionId)
  const selected = selectedPresetIds == null
    ? null
    : selectedPresetIds instanceof Set ? selectedPresetIds : new Set(selectedPresetIds)
  const items = (Array.isArray(presets) ? presets : [])
    .filter(preset => selected == null || selected.has(preset?.id))
    .map(preset => createPresetTransferRecord(preset, {
      dataKey: config.dataKey,
      includeDeviceGrid,
      recordKeyFactory
    }))
  if (!items.length) {
    throw new ConfigTransferError('NO_PRESETS_SELECTED', '请至少选择一个预设', { sectionId })
  }
  return normalizeSectionData(sectionId, { items })
}

function importOptions(sectionId) {
  switch (sectionId) {
    case 'preset.item': return { normalizeData: normalizeItemPreset }
    case 'preset.essence': return { normalizeData: value => normalizeSpecializedPreset('essence', value) }
    case 'preset.harvest': return { normalizeData: value => normalizeSpecializedPreset('harvest', value) }
    case 'preset.map': return { normalizeData: cleanMigratedMapConfig }
    case 'preset.story': return { transformPreset: preset => createStoryPreset(preset.name, preset) }
    case 'preset.storySkill': return { transformPreset: preset => createSkillPreset(preset.name, preset) }
    default: return {}
  }
}

export function planPresetImport(sectionId, rawData, existingPresets = [], {
  selectedRecordKeys = null,
  acceptDeviceGrid = false,
  createId = () => createTransferRecordKey('preset')
} = {}) {
  const config = configFor(sectionId)
  const data = normalizeSectionData(sectionId, rawData)
  const selected = selectedRecordKeys == null
    ? null
    : selectedRecordKeys instanceof Set ? selectedRecordKeys : new Set(selectedRecordKeys)
  const records = data.items.filter(record => selected == null || selected.has(record.recordKey))
  const existingNames = new Set((Array.isArray(existingPresets) ? existingPresets : []).map(preset => preset?.name))
  const imported = records.map(record => createImportedPreset(record, {
    dataKey: config.dataKey,
    existingNames,
    acceptDeviceGrid,
    createId,
    ...importOptions(sectionId)
  }))
  return {
    sectionId,
    collectionKey: config.collectionKey,
    activeKey: config.activeKey,
    imported,
    names: imported.map(preset => preset.name),
    added: imported.length,
    skipped: data.items.length - records.length
  }
}

export function collectPresetIdentities(preset) {
  const identities = []
  const visit = value => {
    if (!value || typeof value !== 'object') return
    if (typeof value.id === 'string' && value.id) identities.push(value.id)
    if (Array.isArray(value)) value.forEach(visit)
    else Object.values(value).forEach(visit)
  }
  visit(preset)
  return identities
}
