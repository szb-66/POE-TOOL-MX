import { createConfigFileName } from '../../../../shared/configTransfer.js'
import {
  CONFIG_SECTION_DEFINITIONS,
  ConfigTransferError,
  createConfigBundle,
  parseConfigBundle,
  serializeConfigBundle
} from './core.js'
import {
  PRESET_SECTION_CONFIGS
} from './presets.js'
import {
  createSectionDescriptorRegistry
} from './descriptors.js'
import {
  createConfigImportRunner,
  createImportPreview
} from './transaction.js'

export const CONFIG_TRANSFER_STORAGE_KEYS = Object.freeze([
  'itemPresets', 'currentItemPresetId',
  'essencePresets', 'currentEssencePresetId',
  'harvestPresets', 'currentHarvestPresetId',
  'mapPresets', 'currentMapPresetId',
  'storyGuide:v1',
  'toolSiteDirectory'
])

export function createStorageStateController(storage = globalThis.localStorage) {
  return {
    snapshot() {
      return Object.fromEntries(CONFIG_TRANSFER_STORAGE_KEYS.map(key => {
        const value = storage?.getItem?.(key)
        return [key, { exists: value != null, value: value ?? '' }]
      }))
    },
    rollback(snapshot = {}) {
      for (const key of CONFIG_TRANSFER_STORAGE_KEYS) {
        const entry = snapshot[key]
        if (entry?.exists) storage?.setItem?.(key, entry.value)
        else storage?.removeItem?.(key)
      }
    }
  }
}

function presetStoreFor(context, sectionId) {
  return sectionId === 'preset.story' || sectionId === 'preset.storySkill'
    ? context.storyStore
    : context.presetStore
}

function presetCatalog(context, sectionId) {
  const config = PRESET_SECTION_CONFIGS[sectionId]
  const store = presetStoreFor(context, sectionId)
  const activeId = String(store[config.activeKey] || '')
  return (store[config.collectionKey] || []).map(preset => ({
    id: String(preset.id || ''),
    name: String(preset.name || ''),
    active: String(preset.id || '') === activeId
  }))
}

export function createConfigTransferService({ context, appVersion = '' }) {
  const descriptors = createSectionDescriptorRegistry(context)
  const runner = createConfigImportRunner({
    stateController: createStorageStateController(context.storage)
  })

  function exportCatalog() {
    return CONFIG_SECTION_DEFINITIONS.map(definition => ({
      ...definition,
      presets: definition.group === 'preset' ? presetCatalog(context, definition.id) : []
    }))
  }

  async function exportToFile(selection = {}) {
    const selectedSectionIds = Array.isArray(selection.selectedSectionIds)
      ? [...new Set(selection.selectedSectionIds)]
      : []
    if (!selectedSectionIds.length) throw new ConfigTransferError('NO_SECTIONS_SELECTED', '请至少选择一个配置区块')
    const sections = {}
    for (const sectionId of selectedSectionIds) {
      const descriptor = descriptors.get(sectionId)
      if (!descriptor) throw new ConfigTransferError('SECTION_DESCRIPTOR_MISSING', `配置区块暂不可导出：${sectionId}`, { sectionId })
      sections[sectionId] = {
        data: await descriptor.exportData(selection.bySection?.[sectionId] || {})
      }
    }
    const bundle = createConfigBundle({ appVersion, sections })
    const content = serializeConfigBundle(bundle)
    const result = await context.electronApi.configTransfer.save({
      content,
      suggestedName: createConfigFileName()
    })
    if (result?.success === false) {
      throw new ConfigTransferError(result.errorCode || 'CONFIG_SAVE_FAILED', result.error || '保存配置文件失败')
    }
    return { ...result, bundle, bytes: new TextEncoder().encode(content).byteLength }
  }

  async function openImportFile() {
    const result = await context.electronApi.configTransfer.open()
    if (result?.canceled) return { canceled: true }
    if (result?.success === false) {
      throw new ConfigTransferError(result.errorCode || 'CONFIG_OPEN_FAILED', result.error || '打开配置文件失败')
    }
    const parsed = parseConfigBundle(result.content)
    return {
      canceled: false,
      fileName: String(result.fileName || ''),
      parsed
    }
  }

  function importCatalog(opened) {
    const parsed = opened?.parsed
    if (!parsed) return []
    return parsed.sections.map(section => {
      const data = parsed.bundle.sections[section.id]?.data
      return {
        ...section,
        itemCount: Array.isArray(data?.items) ? data.items.length : 0,
        items: Array.isArray(data?.items)
          ? data.items.map(record => ({
              recordKey: String(record.recordKey || ''),
              name: String(record.name || ''),
              hasDeviceGrid: Boolean(record.deviceGrid)
            }))
          : []
      }
    })
  }

  function previewImport(opened, options = {}) {
    if (!opened?.parsed) throw new ConfigTransferError('PREVIEW_INPUT_INVALID', '请先选择配置文件')
    return createImportPreview({ parsed: opened.parsed, sectionOptions: options, descriptors })
  }

  const executeImport = (preview, options) => runner.execute(preview, options)

  return {
    descriptors,
    exportCatalog,
    exportToFile,
    openImportFile,
    importCatalog,
    previewImport,
    executeImport,
    get busy() { return runner.busy }
  }
}
