import { createDefaultAffixGroup, normalizeAffixGroup } from '../domains/items/affixConfig.js'

export const ITEM_CRAFTING_KINDS = Object.freeze(['general', 'essence', 'harvest'])

export function normalizeItemCraftingKind(value) {
  return ITEM_CRAFTING_KINDS.includes(value) ? value : 'general'
}

function point(value = {}) {
  return {
    x: Math.trunc(Number(value?.x) || 0),
    y: Math.trunc(Number(value?.y) || 0)
  }
}

export function normalizeSpecializedAffixGroups(groups) {
  const source = Array.isArray(groups) && groups.length ? groups : [createDefaultAffixGroup(0)]
  return source.map((group, index) => normalizeAffixGroup(group, index))
}

export function createDefaultSpecializedPreset(kind, id = 'default', name = '默认预设') {
  return normalizeSpecializedPreset(kind, { id, name, affixGroups: [createDefaultAffixGroup(0)] })
}

export function normalizeSpecializedPreset(kind, preset = {}) {
  const normalized = {
    id: String(preset.id || 'default'),
    name: String(preset.name || '默认预设'),
    affixGroups: normalizeSpecializedAffixGroups(preset.affixGroups)
  }
  if (kind === 'essence') normalized.essencePosition = point(preset.essencePosition)
  return normalized
}

export function specializedPresetToExecutionPreset(preset, checkInitialItem) {
  return {
    id: preset.id,
    name: preset.name,
    checkInitialItem: Boolean(checkInitialItem),
    moduleTwo: {
      enabled: true,
      mode: 'specialized',
      affixGroups: normalizeSpecializedAffixGroups(preset.affixGroups),
      enableAugmentation: false,
      enableRegal: false,
      enableExalted: false
    },
    moduleThree: { enabled: false },
    moduleEldritch: { enabled: false },
    batchCrafting: { enabled: false, categoryIds: [] }
  }
}

export function normalizeCraftingInitialChecks(value = {}, legacyGeneral = true) {
  return {
    general: typeof value.general === 'boolean' ? value.general : legacyGeneral !== false,
    essence: typeof value.essence === 'boolean' ? value.essence : true,
    harvest: typeof value.harvest === 'boolean' ? value.harvest : true
  }
}
