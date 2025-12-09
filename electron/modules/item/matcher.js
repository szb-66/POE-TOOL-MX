/**
 * Purpose: 物品匹配模块，提供词缀、插槽、地图需求匹配功能
 * Inputs: itemInfo (object) - 物品信息，配置对象
 * Outputs: 匹配结果对象
 * Preconditions: itemInfo 必须包含必要的属性
 * Edge cases: itemInfo 为空时返回不匹配；配置缺失时使用默认值
 * Errors: 匹配失败返回不匹配结果，不抛出异常
 */

export function matchAffixes(itemInfo, requiredAffixes, selectedAffixes, selectedCount) {
  if (!itemInfo) return { isMatch: false, requiredAllMatched: false, matchedSelectedCount: 0, matchedModTexts: [] }

  const allMods = [
    ...itemInfo.implicitMods,
    ...itemInfo.explicitMods,
    ...itemInfo.craftedMods,
    ...(itemInfo.detailedMods ? itemInfo.detailedMods.map(m => m.name) : []) // 添加详细词缀名称
  ]

  const matchedModTexts = []

  // Helper to collect matched texts
  const collectMatches = (criteria) => {
    let count = 0
    criteria.forEach(crit => {
      let found = false
      
      // Check all sources
      const sources = [
        itemInfo.implicitMods,
        itemInfo.explicitMods,
        itemInfo.craftedMods
      ]
      
      sources.forEach(list => {
        list.forEach(mod => {
          if (mod.includes(crit)) {
            matchedModTexts.push(mod)
            found = true
          }
        })
      })

      if (itemInfo.detailedMods) {
        itemInfo.detailedMods.forEach(m => {
          if ((m.name && m.name.includes(crit)) || (m.text && m.text.includes(crit))) {
            if (m.text) matchedModTexts.push(m.text)
            if (m.name) matchedModTexts.push(m.name)
            found = true
          }
        })
      }

      if (found) count++
    })
    return count
  }

  let requiredAllMatched = true
  if (requiredAffixes && requiredAffixes.length > 0) {
    const required = requiredAffixes.filter(affix => affix && affix.trim())
    if (required.length > 0) {
      const matchedCount = collectMatches(required)
      if (matchedCount !== required.length) {
        requiredAllMatched = false
      }
    }
  }

  let matchedSelectedCount = 0
  let selectedMatch = true
  if (selectedAffixes && selectedAffixes.length > 0 && selectedCount > 0) {
    const selected = selectedAffixes.filter(affix => affix && affix.trim())
    if (selected.length > 0) {
      matchedSelectedCount = collectMatches(selected)
      if (matchedSelectedCount < selectedCount) {
        selectedMatch = false
      }
    }
  }

  return {
    isMatch: requiredAllMatched && selectedMatch,
    requiredAllMatched,
    matchedSelectedCount,
    matchedModTexts: [...new Set(matchedModTexts)] // De-duplicate
  }
}

export function matchSockets(itemInfo, socketConfig, linkConfig, colorConfig) {
  if (!itemInfo) return false

  if (socketConfig && socketConfig.enabled) {
    if (itemInfo.socketsCount < socketConfig.count) {
      return false
    }
  }

  if (linkConfig && linkConfig.enabled) {
    if (itemInfo.links < linkConfig.count) {
      return false
    }
  }

  if (colorConfig && colorConfig.enabled) {
    if (itemInfo.socketsColors.red < colorConfig.red ||
        itemInfo.socketsColors.green < colorConfig.green ||
        itemInfo.socketsColors.blue < colorConfig.blue) {
      return false
    }
  }

  return true
}

// 地图匹配函数（与Python脚本中的check_map_requirements逻辑一致）
export function matchMapRequirements(itemInfo, mapConfig) {
  if (!itemInfo || !mapConfig) {
    return { isMatch: false }
  }

  const matchConfig = mapConfig.match || {}
  const explicitMods = itemInfo.explicitMods || []

  // 1. 检查黑名单 (Blacklist)
  const blacklist = matchConfig.blacklist || []
  for (const mod of explicitMods) {
    for (const blackTerm of blacklist) {
      if (blackTerm && mod.includes(blackTerm)) {
        return { isMatch: false, reason: 'blacklist' }
      }
    }
  }

  // 2. 检查白名单 (Whitelist) - 优先级最高
  const whitelist = matchConfig.whitelist || []
  if (whitelist.length > 0) {
    for (const mod of explicitMods) {
      for (const whiteTerm of whitelist) {
        if (whiteTerm && mod.includes(whiteTerm)) {
          return { isMatch: true, reason: 'whitelist' }
        }
      }
    }
  }

  // 准备基底检查数据
  let mandatory = { ...(matchConfig.mandatoryStats || {}) }
  let optional = { ...(matchConfig.optionalStats || {}) }

  // 判断是否使用T17匹配条件：完全由用户选择的tab决定
  const isT17 = mapConfig.tiers?.t17 || false

  // 过滤掉没有后缀的旧key（quantity, rarity, packSize等），只保留带后缀的key
  // 这样可以避免旧配置干扰
  const isValidKey = (key) => {
    // 有效的key应该以T17或Normal结尾，或者是T17特有的属性
    if (key.endsWith('T17') || key.endsWith('Normal')) {
      return true
    }
    if (['moreMaps', 'moreScarabs', 'moreCurrency'].includes(key)) {
      return true
    }
    // 没有后缀的旧key（quantity, rarity, packSize）应该被忽略
    return false
  }

  // 过滤mandatory和optional，只保留有效的key
  mandatory = Object.fromEntries(
    Object.entries(mandatory).filter(([key]) => isValidKey(key))
  )
  optional = Object.fromEntries(
    Object.entries(optional).filter(([key]) => isValidKey(key))
  )

  // 判断key是否与当前地图类型相关
  const keyRelevantForType = (key) => {
    if (key.endsWith('T17')) {
      return isT17
    }
    if (key.endsWith('Normal')) {
      return !isT17
    }
    if (['moreMaps', 'moreScarabs', 'moreCurrency'].includes(key)) {
      return isT17
    }
    // 不应该到这里，因为已经过滤了无效key
    return false
  }

  // 获取base_key（去除后缀）
  const getBaseKey = (key) => {
    if (key.endsWith('T17')) {
      return key.replace('T17', '')
    }
    if (key.endsWith('Normal')) {
      return key.replace('Normal', '')
    }
    return key
  }

  // 解决冲突：如果必选和挑选有相同key，取最大值作为必选，并从挑选移除
  const conflictKeys = Object.keys(mandatory).filter(key => optional[key])
  for (const key of conflictKeys) {
    if (mandatory[key]?.enabled && optional[key]?.enabled) {
      const valM = mandatory[key].value || 0
      const valO = optional[key].value || 0
      const finalVal = Math.max(valM, valO)
      mandatory[key].value = finalVal
      optional[key].enabled = false
    }
  }

  // 3. 检查必选基底
  for (const [key, config] of Object.entries(mandatory)) {
    // 只检查enabled为True的配置
    if (!config?.enabled) {
      continue
    }
    // 检查key是否与当前地图类型相关
    if (!keyRelevantForType(key)) {
      continue
    }
    const targetVal = config.value || 0
    const baseKey = getBaseKey(key)
    const currentVal = getMapStatValue(itemInfo, baseKey)
    if (currentVal < targetVal) {
      return { isMatch: false, reason: 'mandatory', failedStat: key, current: currentVal, required: targetVal }
    }
  }

  // 4. 检查挑选基底
  const selectedCount = matchConfig.selectedCount || 1
  let matchCount = 0

  const activeOptions = Object.keys(optional).filter(k => optional[k]?.enabled)
  if (activeOptions.length > 0) {
    for (const key of activeOptions) {
      // 检查key是否与当前地图类型相关
      if (!keyRelevantForType(key)) {
        continue
      }
      const config = optional[key]
      // 再次确认enabled状态（虽然activeOptions已经过滤了，但为了安全）
      if (!config?.enabled) {
        continue
      }
      const targetVal = config.value || 0
      const baseKey = getBaseKey(key)
      const currentVal = getMapStatValue(itemInfo, baseKey)
      if (currentVal >= targetVal) {
        matchCount++
      }
    }

    if (matchCount < selectedCount) {
      return { isMatch: false, reason: 'optional', matched: matchCount, required: selectedCount }
    }
  }

  return { isMatch: true, reason: 'all' }
}

// 获取地图属性值
export function getMapStatValue(itemInfo, key) {
  let val = 0

  // 尝试直接从顶层属性获取
  if (key === 'quantity') {
    val = itemInfo.itemQuantity || 0
  } else if (key === 'rarity') {
    val = itemInfo.itemRarity || 0
  } else if (key === 'packSize') {
    val = itemInfo.monsterPackSize || 0
  } else if (key === 'moreMaps') {
    // T17属性：更多地图
    // 优先从顶层属性获取（解析器已解析）
    val = itemInfo.moreMaps || 0
    // 如果顶层没有，尝试从词缀中提取（备用方案）
    if (val === 0) {
      const mods = [...(itemInfo.implicitMods || []), ...(itemInfo.explicitMods || [])]
      for (const mod of mods) {
        if (mod.includes('地图') && mod.includes('掉落')) {
          const nums = mod.match(/\d+/)
          if (nums) val = Math.max(val, parseInt(nums[0]))
        }
      }
    }
  } else if (key === 'moreScarabs') {
    // T17属性：更多圣甲虫
    val = itemInfo.moreScarabs || 0
    if (val === 0) {
      const mods = [...(itemInfo.implicitMods || []), ...(itemInfo.explicitMods || [])]
      for (const mod of mods) {
        if (mod.includes('圣甲虫')) {
          const nums = mod.match(/\d+/)
          if (nums) val = Math.max(val, parseInt(nums[0]))
        }
      }
    }
  } else if (key === 'moreCurrency') {
    // T17属性：更多通货
    val = itemInfo.moreCurrency || 0
    if (val === 0) {
      const mods = [...(itemInfo.implicitMods || []), ...(itemInfo.explicitMods || [])]
      for (const mod of mods) {
        if (mod.includes('通货')) {
          const nums = mod.match(/\d+/)
          if (nums) val = Math.max(val, parseInt(nums[0]))
        }
      }
    }
  }

  return val
}

