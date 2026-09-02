import { createDefaultModuleTwo, normalizeModuleTwo } from '../domains/items/affixConfig.js'
import { createDefaultEldritchModule, normalizeEldritchModule } from '../domains/items/eldritchConfig.js'

export const BATCH_CRAFTING_CATEGORY_IDS = Object.freeze([
  'helmet', 'bodyArmour', 'gloves', 'boots', 'shield', 'oneHandWeapon', 'twoHandWeapon',
  'bow', 'quiver', 'ring', 'amulet', 'belt', 'jewel', 'flask'
])

const BATCH_CATEGORY_SET = new Set(BATCH_CRAFTING_CATEGORY_IDS)

export function createItemCraftingRunPreset(preset = {}, {
  forceInitialCheck = false,
  singleItemOnly = false
} = {}) {
  const effectivePreset = JSON.parse(JSON.stringify(preset))
  if (forceInitialCheck) effectivePreset.checkInitialItem = true
  if (singleItemOnly && effectivePreset.batchCrafting) {
    effectivePreset.batchCrafting.enabled = false
  }
  return effectivePreset
}

export function normalizeBatchCrafting(value = {}) {
  const categoryIds = [...new Set((Array.isArray(value?.categoryIds) ? value.categoryIds : [])
    .map((entry) => String(entry || ''))
    .filter((entry) => BATCH_CATEGORY_SET.has(entry)))]
  return { enabled: Boolean(value?.enabled), categoryIds }
}

export function createDefaultModuleThree() {
  return {
    enabled: false,
    socket: { enabled: false, count: 0 },
    link: { enabled: false, count: 0 },
    color: { enabled: false, red: 0, green: 0, blue: 0 }
  }
}

export function createDefaultItemPreset(id = 'default', name = '默认预设') {
  return normalizeItemPreset({
    id,
    name,
    batchCrafting: normalizeBatchCrafting(),
    moduleTwo: createDefaultModuleTwo(),
    moduleThree: createDefaultModuleThree(),
    moduleEldritch: createDefaultEldritchModule()
  })
}

export function normalizeItemPreset(preset = {}) {
  const moduleEldritch = normalizeEldritchModule(preset.moduleEldritch)
  const batchCrafting = normalizeBatchCrafting(preset.batchCrafting)
  const moduleTwo = normalizeModuleTwo(preset.moduleTwo)
  const defaults = createDefaultModuleThree()
  const sourceThree = preset.moduleThree || {}
  const moduleThree = {
    ...defaults,
    ...sourceThree,
    socket: { ...defaults.socket, ...(sourceThree.socket || {}) },
    link: { ...defaults.link, ...(sourceThree.link || {}) },
    color: { ...defaults.color, ...(sourceThree.color || {}) }
  }
  if (moduleEldritch.enabled) {
    moduleTwo.enabled = false
    moduleThree.enabled = false
  }
  const { checkInitialItem: _legacyCheckInitialItem, ...rest } = preset
  return { ...rest, batchCrafting, moduleTwo, moduleThree, moduleEldritch }
}
