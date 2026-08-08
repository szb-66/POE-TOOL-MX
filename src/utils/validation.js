/**
 * Purpose: 配置数据验证工具，验证物品制作配置的有效性
 * Inputs: config (object) - 包含 itemPosition、currencyPositions 和 preset 等
 * Outputs: { isValid: boolean, errors: string[] } - 验证结果
 * Preconditions: config 必须包含必要的字段
 * Edge cases: 配置缺失时返回错误列表；坐标为 0 时视为未配置
 * Errors: 验证失败返回错误列表，不抛出异常
 */
import { hasEffectiveAffixGroups } from '../domains/items/affixConfig.js'
import { eldritchCurrencyType, hasEffectiveEldritchTargets, normalizeEldritchModule } from '../domains/items/eldritchConfig.js'
import { CURRENCY_NAMES } from './constants.js'

/**
 * Purpose: 验证制作配置
 * Inputs: config (object) - 包含 itemPosition、currencyPositions 和 preset 等
 * Outputs: { isValid: boolean, errors: string[] } - 验证结果
 */
export const validateCraftingConfig = (config) => {
  const errors = []
  
  // 1. 验证物品位置
  const { itemPosition } = config
  // 允许 x,y 为 0 的情况（可能未配置），但在脚本生成前应拦截
  // 如果 x=0, y=0，视为未配置
  if (!itemPosition || (itemPosition.x === 0 && itemPosition.y === 0)) {
    errors.push('物品位置未配置，请先在设置中抓取物品坐标')
  }
  
  // 2. 验证模块配置
  const { preset } = config
  if (!preset) {
    errors.push('未选择预设配置')
  } else {
    const wisdomPosition = config.currencyPositions?.wisdom
    if (!wisdomPosition || (wisdomPosition.x === 0 && wisdomPosition.y === 0)) {
      errors.push(`未配置 ${CURRENCY_NAMES.wisdom} (wisdom) 的坐标`)
    }

    // 检查是否有启用的模块
    const affixEnabled = preset.moduleTwo?.enabled
    const socketEnabled = preset.moduleThree?.enabled
    const eldritchEnabled = preset.moduleEldritch?.enabled
    
    if (!affixEnabled && !socketEnabled && !eldritchEnabled) {
      errors.push('请至少启用一个制作模块 (词缀、古灵隐式或插槽)')
    }

    if (eldritchEnabled && (affixEnabled || socketEnabled)) {
      errors.push('古灵隐式制作不能与显式词缀或插槽制作同时启用')
    }

    if (eldritchEnabled) {
      const eldritch = normalizeEldritchModule(preset.moduleEldritch)
      if (!hasEffectiveEldritchTargets(eldritch)) errors.push('古灵隐式制作至少需要选择一个目标词缀')
      const currency = eldritchCurrencyType(eldritch)
      const position = config.currencyPositions?.[currency]
      if (!position || (position.x === 0 && position.y === 0)) {
        errors.push(`未配置 ${CURRENCY_NAMES[currency] || currency} (${currency}) 的坐标`)
      }
    }
    
    // 验证词缀模块所需的通货坐标
    if (affixEnabled) {
      if (!hasEffectiveAffixGroups(preset.moduleTwo)) {
        errors.push('词缀制作至少需要配置一个有效的达标组合')
      }
      const mode = preset.moduleTwo.mode || 'alteration'
      const { currencyPositions } = config
      
      const checkCurrency = (name, label) => {
        if (!currencyPositions?.[name] || (currencyPositions[name].x === 0 && currencyPositions[name].y === 0)) {
          errors.push(`未配置 ${label} (${name}) 的坐标`)
        }
      }
      
      if (mode === 'alteration') {
        checkCurrency('alteration', '改造石')
        if (preset.moduleTwo.enableAugmentation) checkCurrency('augmentation', '增幅石')
        if (preset.moduleTwo.enableRegal) checkCurrency('regal', '富豪石')
      } else if (mode === 'chaos') {
        checkCurrency('chaos', '混沌石')
        if (preset.moduleTwo.enableExalted) checkCurrency('exalted', '崇高石')
      } else if (mode === 'alchemy') {
        checkCurrency('alchemy', '点金石')
        checkCurrency('scouring', '重铸石')
      }
    }
    
    // 验证插槽模块所需的通货坐标
    if (socketEnabled) {
      const { currencyPositions } = config
      const socketConfig = preset.moduleThree.socket
      const linkConfig = preset.moduleThree.link
      const colorConfig = preset.moduleThree.color
      
      const checkCurrency = (name, label) => {
        if (!currencyPositions?.[name] || (currencyPositions[name].x === 0 && currencyPositions[name].y === 0)) {
          errors.push(`未配置 ${label} (${name}) 的坐标`)
        }
      }
      
      if (socketConfig?.enabled) checkCurrency('jewellers', '工匠石')
      if (linkConfig?.enabled) checkCurrency('fusing', '链结石')
      if (colorConfig?.enabled) checkCurrency('chromic', '幻色石')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateMapRollingConfig = (config) => {
  const errors = []
  const { inventory, currencyPositions, mapConfig } = config

  if (!mapConfig) {
    errors.push('未找到地图配置')
    return { isValid: false, errors }
  }

  if (!inventory?.startPos || (inventory.startPos.x === 0 && inventory.startPos.y === 0)) {
    errors.push('背包首格坐标未配置，请先在设置中填写')
  }

  if (!inventory?.slotSize || inventory.slotSize.w <= 0 || inventory.slotSize.h <= 0) {
    errors.push('背包单格宽高未配置，请先在设置中填写')
  }

  const checkCurrency = (name, label) => {
    if (!currencyPositions?.[name] || (currencyPositions[name].x === 0 && currencyPositions[name].y === 0)) {
      errors.push(`未配置 ${label} (${name}) 的坐标`)
    }
  }

  const method = mapConfig.method || 'alchemy'
  if (method === 'alchemy') {
    checkCurrency('alchemy', '点金石')
    checkCurrency('scouring', '重铸石')
  } else if (method === 'chaos') {
    checkCurrency('alchemy', '点金石')
    checkCurrency('scouring', '重铸石')
    checkCurrency('chaos', '混沌石')
  } else {
    errors.push(`未知的地图制作方式: ${method}`)
  }

  if (mapConfig.vaal?.enabled) {
    checkCurrency('vaal', '瓦尔宝珠')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}



