import { VENDOR_GROUPS, VENDOR_GROUP_MAP } from './vendorData.js'

const validMode = value => value === 'exclude' ? 'exclude' : 'include'

export function createDefaultVendorConfig() {
  return Object.fromEntries(VENDOR_GROUPS.map(group => [group.id, { mode: 'include', selectedIds: [] }]))
}

export function cleanVendorConfig(value) {
  const source = value && typeof value === 'object' ? value : {}
  const result = createDefaultVendorConfig()
  for (const group of VENDOR_GROUPS) {
    const raw = source[group.id] && typeof source[group.id] === 'object' ? source[group.id] : {}
    const allowed = new Set(group.options.map(item => item.id))
    result[group.id] = {
      mode: validMode(raw.mode),
      selectedIds: Array.isArray(raw.selectedIds) ? [...new Set(raw.selectedIds.filter(id => allowed.has(id)))] : []
    }
  }
  return result
}

export function migrateLegacyVendorConfig(value) {
  const result = createDefaultVendorConfig()
  const source = value && typeof value === 'object' ? value : {}
  const append = (groupId, ids) => {
    const allowed = new Set(VENDOR_GROUP_MAP.get(groupId)?.options.map(item => item.id) || [])
    result[groupId].selectedIds.push(...(Array.isArray(ids) ? ids.filter(id => allowed.has(id)) : []))
    result[groupId].selectedIds = [...new Set(result[groupId].selectedIds)]
  }
  append('movement', source.movement)
  append('common', source.plusGems)
  append('damage', source.damage)
  for (const id of Array.isArray(source.weaponTypes) ? source.weaponTypes : []) {
    for (const groupId of ['oneHanded', 'twoHanded', 'offhand']) append(groupId, [id])
  }
  return result
}

export function createDefaultVendorPreset(id = 'default', name = '默认预设') {
  return { id, name, vendor: createDefaultVendorConfig() }
}

export function cleanVendorPresets(value) {
  if (!Array.isArray(value)) return [createDefaultVendorPreset()]
  const ids = new Set()
  const presets = value.map((raw, index) => ({
    id: typeof raw?.id === 'string' && raw.id ? raw.id : `vendor_regex_${index + 1}`,
    name: typeof raw?.name === 'string' && raw.name.trim() ? raw.name.trim() : `预设${index + 1}`,
    vendor: cleanVendorConfig(raw?.vendor)
  })).filter(preset => !ids.has(preset.id) && ids.add(preset.id))
  if (!presets.some(preset => preset.id === 'default')) presets.unshift(createDefaultVendorPreset())
  return presets.length ? presets : [createDefaultVendorPreset()]
}

export function migrateLegacyVendorPresets(value) {
  if (!Array.isArray(value)) return [createDefaultVendorPreset()]
  return cleanVendorPresets(value.map((raw, index) => ({
    id: raw?.id || `vendor_regex_${index + 1}`,
    name: raw?.name || `预设${index + 1}`,
    vendor: migrateLegacyVendorConfig(raw?.vendor)
  })))
}
