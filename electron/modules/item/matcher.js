/**
 * Purpose: 物品匹配模块，提供词缀、插槽、地图需求匹配功能
 * Inputs: itemInfo (object) - 物品信息，配置对象
 * Outputs: 匹配结果对象
 * Preconditions: itemInfo 必须包含必要的属性
 * Edge cases: itemInfo 为空时返回不匹配；配置缺失时使用默认值
 * Errors: 匹配失败返回不匹配结果，不抛出异常
 */

function cleanEffectText(value = '') {
  return String(value).split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n')
}

function effectPatternRegex(pattern) {
  const numeric = '[+\\-]?\\d+(?:\\.\\d+)?'
  const source = cleanEffectText(pattern).split('#')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join(numeric)
  return new RegExp(`^${source}$`, 'u')
}

function naturalImplicitPattern(text) {
  return cleanEffectText(text)
    .replace(/([+\-]?)\(?\d+(?:\.\d+)?\s*[-–—]\s*\d+(?:\.\d+)?\)?/g, '$1#')
    .replace(/([+\-]?)\d+(?:\.\d+)?/g, '$1#')
}

function conditionValue(condition) {
  if (typeof condition === 'string') return { kind: 'keyword', keyword: condition.trim(), minTier: null }
  if (!condition || typeof condition !== 'object') return null
  const effectPattern = String(condition.effectPattern || '').trim()
  const keyword = String(condition.keyword || condition.displayName || effectPattern).trim()
  if (!keyword && !effectPattern) return null
  const tier = Math.trunc(Number(condition.minTier))
  return {
    ...condition,
    kind: condition.kind === 'catalog' && effectPattern ? 'catalog' : 'keyword',
    keyword,
    effectPattern,
    minTier: tier > 0 ? tier : null
  }
}

function candidateModifiers(itemInfo) {
  const structured = Array.isArray(itemInfo.modifiers) && itemInfo.modifiers.length
    ? itemInfo.modifiers
    : (itemInfo.detailedMods ?? [])
  const candidates = structured.map((modifier) => ({
    name: String(modifier.name || ''),
    text: cleanEffectText(modifier.text || modifier.lines?.join('\n') || ''),
    tier: Math.trunc(Number(modifier.tier)) || 0
  }))
  const existingTexts = new Set(candidates.map((modifier) => modifier.text))
  for (const text of [...(itemInfo.implicitMods ?? []), ...(itemInfo.explicitMods ?? []), ...(itemInfo.craftedMods ?? [])]) {
    const normalized = cleanEffectText(text)
    if (normalized && !existingTexts.has(normalized)) {
      candidates.push({ name: '', text: normalized, tier: 0 })
      existingTexts.add(normalized)
    }
  }
  return candidates
}

function matchCondition(conditionInput, candidates) {
  const condition = conditionValue(conditionInput)
  if (!condition) return null
  const pattern = condition.kind === 'catalog' ? effectPatternRegex(condition.effectPattern) : null
  const candidate = candidates.find((modifier) => {
    const effectMatches = condition.kind === 'catalog'
      ? pattern.test(modifier.text)
      : modifier.name.includes(condition.keyword) || modifier.text.includes(condition.keyword)
    if (!effectMatches) return false
    return condition.minTier === null || (modifier.tier > 0 && modifier.tier <= condition.minTier)
  })
  return candidate ? { condition, candidate } : null
}

export function matchEldritchImplicits(itemInfo, targets = [], { naturalBaseImplicitTexts = [] } = {}) {
  const conditions = (Array.isArray(targets) ? targets : []).map(conditionValue).filter(Boolean)
  const structured = (itemInfo?.modifiers ?? [])
    .filter((modifier) => modifier.type === 'base' || modifier.type === 'implicit')
    .map((modifier) => cleanEffectText(modifier.text || modifier.lines?.join('\n') || ''))
  const candidates = (structured.length ? structured : (itemInfo?.implicitMods ?? []).map(cleanEffectText)).filter(Boolean)
  for (const naturalText of naturalBaseImplicitTexts) {
    const patternText = naturalImplicitPattern(naturalText)
    if (!patternText) continue
    const pattern = effectPatternRegex(patternText)
    const index = candidates.findIndex((candidate) => pattern.test(candidate))
    if (index >= 0) candidates.splice(index, 1)
  }
  for (const condition of conditions) {
    const pattern = condition.kind === 'catalog' || condition.effectPattern
      ? effectPatternRegex(condition.effectPattern)
      : null
    const matchedText = candidates.find((candidate) => pattern ? pattern.test(candidate) : candidate.includes(condition.keyword))
    if (matchedText) {
      return {
        isMatch: true,
        matchedTargetName: String(condition.displayName || condition.keyword || condition.effectPattern),
        matchedText
      }
    }
  }
  return { isMatch: false, matchedTargetName: '', matchedText: '' }
}

function legacyGroup(requiredAffixes, selectedAffixes, selectedCount) {
  return [{
    id: 'affix_group_1',
    name: '组合 1',
    requiredAffixes: requiredAffixes ?? [],
    selectedAffixes: selectedAffixes ?? [],
    selectedCount: selectedCount ?? 1
  }]
}

export function matchAffixes(itemInfo, affixGroupsOrRequired, selectedAffixes, selectedCount) {
  const empty = {
    isMatch: false,
    requiredAllMatched: false,
    matchedSelectedCount: 0,
    matchedModTexts: [],
    matchedGroupId: null,
    matchedGroupName: '',
    groupResults: []
  }
  if (!itemInfo) return empty
  const groups = Array.isArray(affixGroupsOrRequired)
    && affixGroupsOrRequired.some((entry) => entry && typeof entry === 'object' && ('requiredAffixes' in entry || 'selectedAffixes' in entry))
    ? affixGroupsOrRequired
    : legacyGroup(affixGroupsOrRequired, selectedAffixes, selectedCount)
  const candidates = candidateModifiers(itemInfo)
  const groupResults = groups
    .filter((group) => group.enabled !== false)
    .map((group, index) => {
    const required = (group.requiredAffixes ?? []).map(conditionValue).filter(Boolean)
    const selected = (group.selectedAffixes ?? []).map(conditionValue).filter(Boolean)
    if (!required.length && !selected.length) return null
    const requiredMatches = required.map((condition) => matchCondition(condition, candidates))
    const selectedMatches = selected.map((condition) => matchCondition(condition, candidates))
    const requiredAllMatched = requiredMatches.every(Boolean)
    const requiredSelectedCount = selected.length
      ? Math.max(1, Math.min(selected.length, Math.trunc(Number(group.selectedCount)) || 1))
      : 0
    const matchedSelectedCount = selectedMatches.filter(Boolean).length
    const matchedTexts = [...new Set([...requiredMatches, ...selectedMatches].filter(Boolean)
      .flatMap(({ candidate }) => [candidate.text, candidate.name]).filter(Boolean))]
    return {
      id: String(group.id || `affix_group_${index + 1}`),
      name: String(group.name || `组合 ${index + 1}`),
      isMatch: requiredAllMatched && matchedSelectedCount >= requiredSelectedCount,
      requiredAllMatched,
      matchedRequiredCount: requiredMatches.filter(Boolean).length,
      requiredCount: required.length,
      matchedSelectedCount,
      selectedCount: requiredSelectedCount,
      matchedModTexts: matchedTexts
    }
  }).filter(Boolean)
  if (!groupResults.length) return empty
  const matched = groupResults.find((group) => group.isMatch)
  const representative = matched ?? [...groupResults].sort((a, b) => {
    const aScore = a.matchedRequiredCount + a.matchedSelectedCount
    const bScore = b.matchedRequiredCount + b.matchedSelectedCount
    return bScore - aScore
  })[0]
  return {
    isMatch: Boolean(matched),
    requiredAllMatched: representative.requiredAllMatched,
    matchedSelectedCount: representative.matchedSelectedCount,
    matchedModTexts: representative.matchedModTexts,
    matchedGroupId: matched?.id ?? null,
    matchedGroupName: matched?.name ?? '',
    groupResults
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

  const targetKind = mapConfig.targetKind === 'chart' ? 'chart' : 'atlas'
  const categoryMatches = targetKind === 'chart'
    ? itemInfo.category === '海图'
    : ['异界地图', '地图'].includes(itemInfo.category)
  if (!categoryMatches) return { isMatch: false, reason: 'category' }

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

  // 白名单沿用既有“任一命中即通过词缀检查”语义；基底条件仍必须满足。
  const whitelist = matchConfig.whitelist || []
  const whitelistMatched = whitelist.some(term => term && explicitMods.some(mod => mod.includes(term)))

  const validKeys = targetKind === 'chart'
    ? ['quantity', 'rarity', 'packSize', 'deadmanSulphur']
    : ['quantity', 'rarity', 'packSize', 'moreMaps', 'moreScarabs', 'moreCurrency']
  const mandatory = Object.fromEntries(Object.entries(matchConfig.mandatoryStats || {}).filter(([key]) => validKeys.includes(key)))
  const optional = Object.fromEntries(Object.entries(matchConfig.optionalStats || {}).filter(([key]) => validKeys.includes(key)))

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
    if (!config?.enabled) continue
    const targetVal = config.value || 0
    const currentVal = getMapStatValue(itemInfo, key)
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
      const config = optional[key]
      if (!config?.enabled) continue
      const targetVal = config.value || 0
      const currentVal = getMapStatValue(itemInfo, key)
      if (currentVal >= targetVal) {
        matchCount++
      }
    }

    if (matchCount < selectedCount) {
      return { isMatch: false, reason: 'optional', matched: matchCount, required: selectedCount }
    }
  }

  return { isMatch: true, reason: whitelistMatched ? 'whitelist' : 'all' }
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
  } else if (key === 'deadmanSulphur') {
    val = itemInfo.deadmanSulphur || 0
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

