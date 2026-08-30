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

function presetDescriptor(sectionId, context) {
  const config = PRESET_SECTION_CONFIGS[sectionId]
  const store = sectionId === 'preset.story' || sectionId === 'preset.storySkill'
    ? context.storyStore
    : context.presetStore
  const collection = () => store[config.collectionKey]
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
      if (store.savePresets) store.savePresets()
      else store.save({ sync: false })
    },
    rollback(snapshot) {
      store[config.collectionKey] = clone(snapshot.collection)
      store[config.activeKey] = snapshot.activeId
      if (store.savePresets) store.savePresets()
      else store.save({ sync: false })
    }
  }
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
    registry.set(sectionId, presetDescriptor(sectionId, context))
  }

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
