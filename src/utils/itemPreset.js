import { createDefaultModuleTwo, normalizeModuleTwo } from '../domains/items/affixConfig.js'
import { createDefaultEldritchModule, normalizeEldritchModule } from '../domains/items/eldritchConfig.js'

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
    checkInitialItem: true,
    moduleTwo: createDefaultModuleTwo(),
    moduleThree: createDefaultModuleThree(),
    moduleEldritch: createDefaultEldritchModule()
  })
}

export function normalizeItemPreset(preset = {}) {
  const checkInitialItem = typeof preset.checkInitialItem === 'boolean'
    ? preset.checkInitialItem
    : preset.moduleTwo?.checkInitialAffixes !== false
  const moduleEldritch = normalizeEldritchModule(preset.moduleEldritch)
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
  return { ...preset, checkInitialItem, moduleTwo, moduleThree, moduleEldritch }
}
