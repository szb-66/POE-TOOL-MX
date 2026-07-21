/**
 * Purpose: 创建、清理和补全商城 Vendor 预设配置
 * Inputs: 任意来源的候选配置对象
 * Outputs: 字段完整、值域安全的 Vendor 配置
 * Preconditions: vendorData 中的选项 ID 稳定
 * Edge cases: 未知 ID、重复 ID、非法数字会被过滤或归一化
 * Errors: 不抛出异常，非法输入回退默认配置
 */

import { VENDOR_OPTION_GROUPS } from './vendorData.js'

const allowedIds = Object.fromEntries(Object.entries(VENDOR_OPTION_GROUPS).map(([key, items]) => [
  key,
  new Set(items.map(item => item.id))
]))

export function createDefaultVendorConfig() {
  return {
    threeLinks: [],
    twoLinks: [],
    anyLinks: [],
    exactColors: { enabled: false, red: 0, green: 0, blue: 0 },
    movement: [],
    plusGems: [],
    damage: [],
    weaponTypes: []
  }
}

const cleanSelection = (value, allowed) => Array.isArray(value)
  ? [...new Set(value.filter(id => typeof id === 'string' && allowed.has(id)))]
  : []

const cleanSocketCount = value => {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.max(0, Math.min(6, Math.trunc(number)))
}

export function cleanVendorConfig(value) {
  const source = value && typeof value === 'object' ? value : {}
  const exact = source.exactColors && typeof source.exactColors === 'object' ? source.exactColors : {}

  return {
    threeLinks: cleanSelection(source.threeLinks, allowedIds.threeLinks),
    twoLinks: cleanSelection(source.twoLinks, allowedIds.twoLinks),
    anyLinks: cleanSelection(source.anyLinks, allowedIds.anyLinks),
    exactColors: {
      enabled: Boolean(exact.enabled),
      red: cleanSocketCount(exact.red),
      green: cleanSocketCount(exact.green),
      blue: cleanSocketCount(exact.blue)
    },
    movement: cleanSelection(source.movement, allowedIds.movement),
    plusGems: cleanSelection(source.plusGems, allowedIds.plusGems),
    damage: cleanSelection(source.damage, allowedIds.damage),
    weaponTypes: cleanSelection(source.weaponTypes, allowedIds.weaponTypes)
  }
}

export function createDefaultShopPreset(id = 'default', name = '默认预设') {
  return { id, name, vendor: createDefaultVendorConfig() }
}

export function cleanShopPreset(value, fallbackId = 'default', fallbackName = '默认预设') {
  const source = value && typeof value === 'object' ? value : {}
  return {
    id: typeof source.id === 'string' && source.id ? source.id : fallbackId,
    name: typeof source.name === 'string' && source.name.trim() ? source.name.trim() : fallbackName,
    vendor: cleanVendorConfig(source.vendor)
  }
}

export function cleanShopPresets(value) {
  if (!Array.isArray(value)) return [createDefaultShopPreset()]
  const unique = []
  const ids = new Set()
  value.forEach((preset, index) => {
    const cleaned = cleanShopPreset(preset, `shop_preset_${index + 1}`, `预设${index + 1}`)
    if (!ids.has(cleaned.id)) {
      ids.add(cleaned.id)
      unique.push(cleaned)
    }
  })
  const defaultIndex = unique.findIndex(preset => preset.id === 'default')
  if (defaultIndex === -1) unique.unshift(createDefaultShopPreset())
  return unique.length ? unique : [createDefaultShopPreset()]
}
