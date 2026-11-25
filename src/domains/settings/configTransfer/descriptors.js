import { normalizeCombatAssist } from '../../../../shared/combatAssist.js'
import {
  createToolSiteId,
  readToolSites,
  saveToolSites
} from '../../tools/toolSites.js'
import {
  ConfigTransferError,
  cloneTransferValue,
  mergeToolSites
} from './core.js'
import { normalizeExportSectionData, normalizeSectionData } from './sections.js'
import {
  PRESET_SECTION_CONFIGS,
  createPresetSectionData,
  planPresetImport
} from './presets.js'

const clone = value => cloneTransferValue(value)

const REGEX_SECTION_IDS = new Set(['preset.vendorRegex', 'preset.mapRegex', 'preset.beastRegex'])

function storeForPresetSection(sectionId, context) {
  if (sectionId === 'preset.story' || sectionId === 'preset.storySkill') return context.storyStore
  if (REGEX_SECTION_IDS.has(sectionId)) return context.regexPresetStore
  return context.presetStore
}

function presetDescriptor(sectionId, context) {
  const config = PRESET_SECTION_CONFIGS[sectionId]
  const store = storeForPresetSection(sectionId, context)
  const collection = () => store?.[config.collectionKey] || []
  const persistStore = () => {
    if (store.savePresets) store.savePresets()
    else if (store.save) store.save({ sync: false })
  }
  return {
    id: sectionId,
    exportData(options = {}) {
      return createPresetSectionData(sectionId, collection(), {
        selectedPresetIds: options.selectedPresetIds,
        includeDeviceGrid: options.includeDeviceGrid === true
      })
    },
    planImport(rawData, options = {}) {
      const plan = planPresetImport(sectionId, rawData, collection(), {
        selectedRecordKeys: options.selectedRecordKeys,
        acceptDeviceGrid: options.acceptDeviceGrid === true
      })
      return {
        ...plan,
        options,
        candidate: plan.imported,
        summary: { added: plan.added, skipped: plan.skipped },
        warnings: options.acceptDeviceGrid && sectionId === 'preset.map'
          ? ['将接收来源文件中的地图网格坐标。']
          : []
      }
    },
    snapshot() {
      return {
        collection: clone(collection()),
        activeId: String(store[config.activeKey] || '')
      }
    },
    persist(plan) {
      store[config.collectionKey] = [...collection(), ...clone(plan.candidate)]
      persistStore()
    },
    rollback(snapshot) {
      store[config.collectionKey] = clone(snapshot.collection)
      store[config.activeKey] = snapshot.activeId
      persistStore()
    }
  }
}

function readCombatAssist(context) {
  if (context.settingsStore?.combatAssist) {
    return normalizeCombatAssist(context.settingsStore.combatAssist)
  }
  try {
    const raw = JSON.parse(context.storage?.getItem?.('settings') || '{}') || {}
    return normalizeCombatAssist(raw.combatAssist)
  } catch {
    return normalizeCombatAssist()
  }
}

async function writeCombatAssist(context, config) {
  const normalized = normalizeCombatAssist(config)
  if (context.settingsStore?.updateCombatAssist) {
    const result = await context.settingsStore.updateCombatAssist(normalized)
    if (result?.success === false) throw new Error(result.error || '战斗辅助配置保存失败')
    return
  }
  if (context.settingsStore) {
    context.settingsStore.combatAssist = normalized
    context.settingsStore.saveSettings?.()
    return
  }
  let current = {}
  try { current = JSON.parse(context.storage?.getItem?.('settings') || '{}') || {} } catch {}
  current.combatAssist = normalized
  context.storage.setItem('settings', JSON.stringify(current))
}

function ensureContext(context) {
  const missing = ['presetStore', 'storyStore', 'storage'].filter(key => !context?.[key])
  if (missing.length) {
    throw new ConfigTransferError('DESCRIPTOR_CONTEXT_INVALID', `配置传输上下文缺失：${missing.join(', ')}`)
  }
}

export function createSectionDescriptorRegistry(context) {
  ensureContext(context)
  const registry = new Map()
  for (const sectionId of Object.keys(PRESET_SECTION_CONFIGS)) {
    if (REGEX_SECTION_IDS.has(sectionId) && !context.regexPresetStore) continue
    registry.set(sectionId, presetDescriptor(sectionId, context))
  }

  registry.set('settings.combatAssist', {
    id: 'settings.combatAssist',
    exportData: () => normalizeExportSectionData('settings.combatAssist', { combatAssist: readCombatAssist(context) }),
    planImport(rawData) {
      const imported = normalizeSectionData('settings.combatAssist', rawData)
      return {
        candidate: imported.combatAssist,
        summary: { added: 1, skipped: 0, conflicts: 0 },
        warnings: ['将覆盖当前战斗辅助配置（含血球/蓝球/传送门坐标与按键）。']
      }
    },
    snapshot: () => ({ combatAssist: readCombatAssist(context) }),
    persist: plan => writeCombatAssist(context, plan.candidate),
    rollback: snapshot => writeCombatAssist(context, snapshot.combatAssist)
  })

  registry.set('settings.toolSites', {
    id: 'settings.toolSites',
    exportData: () => normalizeExportSectionData('settings.toolSites', { sites: readToolSites(context.storage) }),
    planImport(rawData) {
      const imported = normalizeSectionData('settings.toolSites', rawData)
      const merged = mergeToolSites(readToolSites(context.storage), imported.sites, context.createToolSiteId || createToolSiteId)
      return {
        candidate: merged.sites,
        summary: { added: merged.added, conflicts: merged.conflicts }
      }
    },
    snapshot: () => ({ sites: readToolSites(context.storage) }),
    persist: plan => {
      if (!saveToolSites(plan.candidate, context.storage)) throw new Error('工具站点保存失败')
    },
    rollback: snapshot => {
      if (!saveToolSites(snapshot.sites, context.storage)) throw new Error('工具站点恢复失败')
    }
  })

  return registry
}
