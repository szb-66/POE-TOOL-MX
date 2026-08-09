/**
 * Purpose: 根据制作预设生成启动时需要一次性验证的完整通货清单。
 * Inputs: 物品制作 preset 或地图 mapConfig。
 * Outputs: 有序、去重的通货 ID 数组。
 * Edge cases: 起始稀有度预处理和未鉴定地图等条件分支也必须纳入。
 */
import { eldritchCurrencyType } from '../domains/items/eldritchConfig.js'

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

export function buildCraftingCurrencyPreflight(preset = {}) {
  const affix = preset.moduleTwo || {}
  const eldritch = preset.moduleEldritch || {}
  const currencies = eldritch.enabled ? [] : ['wisdom']

  if (eldritch.enabled) currencies.push(eldritchCurrencyType(eldritch))

  if (affix.enabled) {
    const mode = affix.mode || 'alteration'
    if (mode === 'alteration') {
      currencies.push('transmutation', 'scouring', 'alteration')
      if (affix.enableAugmentation) currencies.push('augmentation')
      if (affix.enableRegal) currencies.push('regal')
    } else if (mode === 'chaos') {
      currencies.push('alchemy', 'scouring', 'chaos')
      if (affix.enableExalted) currencies.push('exalted')
    } else if (mode === 'alchemy') {
      currencies.push('scouring', 'alchemy')
    }
  }

  const sockets = preset.moduleThree || {}
  if (sockets.enabled) {
    if (sockets.socket?.enabled && Number(sockets.socket.count) > 0) currencies.push('jewellers')
    if (sockets.link?.enabled && Number(sockets.link.count) > 0) currencies.push('fusing')
    const color = sockets.color || {}
    if (
      color.enabled &&
      [color.red, color.green, color.blue].some(value => Number(value) > 0)
    ) {
      currencies.push('chromic')
    }
  }

  return unique(currencies)
}

export function buildMapCurrencyPreflight(mapConfig = {}) {
  const currencies = ['wisdom']
  const method = mapConfig.method || 'alchemy'

  if (method === 'alchemy') {
    currencies.push('scouring', 'alchemy')
  } else if (method === 'chaos') {
    currencies.push('scouring', 'alchemy', 'chaos')
  }

  if (mapConfig.vaal?.enabled) currencies.push('vaal')
  return unique(currencies)
}
