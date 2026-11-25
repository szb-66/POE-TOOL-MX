/**
 * Purpose: 物品匹配模块，提供词缀、插槽、地图需求匹配功能
 * Inputs: itemInfo (object) - 物品信息，配置对象
 * Outputs: 匹配结果对象
 * Preconditions: itemInfo 必须包含必要的属性
 * Edge cases: itemInfo 为空时返回不匹配；配置缺失时使用默认值
 * Errors: 匹配失败返回不匹配结果，不抛出异常
 */

import { expandMapAffixTermForMatching } from '../../../shared/crossServerMapAffix.js'
import { expandAffixPatternsForMatching, expandEldritchPatternsForMatching } from '../crafting/crossServerMap.js'

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

export function matchMapTerm(mod, term) {
  if (!term) return false
  if (!term.includes('#')) return mod.includes(term)
  const shape = value => cleanEffectText(value)
    .replace(/(\d+(?:\.\d+)?)\(\d+(?:\.\d+)?\s*[—–-]\s*\d+(?:\.\d+)?\)/g, '$1')
    .replace(/\(?\d+(?:\.\d+)?(?:\s*[—–-]\s*\d+(?:\.\d+)?)?\)?/g, '#')
  return shape(mod) === shape(term)
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
    aliases: [...(modifier.textAliases || []), ...(modifier.nameAliases || [])],
    tier: Math.trunc(Number(modifier.tier)) || 0
  }))
  const existingTexts = new Set(candidates.map((modifier) => modifier.text))
  for (const text of [...(itemInfo.implicitMods ?? []), ...(itemInfo.explicitMods ?? []), ...(itemInfo.craftedMods ?? [])]) {
    const normalized = cleanEffectText(text)
    if (normalized && !existingTexts.has(normalized)) {
      candidates.push({ name: '', text: normalized, aliases: [...(itemInfo.modTextAliases?.[text] ?? [])], tier: 0 })
      existingTexts.add(normalized)
    }
  }
  return candidates
}

function matchCondition(conditionInput, candidates) {
  const condition = conditionValue(conditionInput)
  if (!condition) return null
  const patterns = condition.kind === 'catalog'
    ? expandAffixPatternsForMatching(condition).map(effectPatternRegex)
    : []
  const candidate = candidates.find((modifier) => {
    const texts = patterns.length ? [modifier.text, ...(modifier.aliases ?? [])] : []
    const effectMatches = condition.kind === 'catalog'
      ? texts.some((text) => patterns.some((pattern) => pattern.test(text)))
      : modifier.name.includes(condition.keyword) || modifier.text.includes(condition.keyword) || modifier.aliases?.some(value => value.includes(condition.keyword))
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
    const patterns = condition.kind === 'catalog' || condition.effectPattern || condition.canonicalKey || condition.familyId
      ? expandEldritchPatternsForMatching(condition).map(effectPatternRegex)
      : []
    const matchedText = candidates.find((candidate) => {
      const structured = (itemInfo.modifiers ?? []).find((modifier) => cleanEffectText(modifier.text || modifier.lines?.join('\n') || '') === candidate)
      const texts = [candidate, ...(itemInfo.modTextAliases?.[candidate] || []), ...(structured?.textAliases || [])]
      return patterns.length ? texts.some((text) => patterns.some((pattern) => pattern.test(text))) : texts.some((value) => value.includes(condition.keyword))
    })
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
    const required = (group.requiredAffixes ?? []).filter((condition) => condition?.enabled !== false).map((condition) => conditionValue(condition)).filter(Boolean)
    const selected = (group.selectedAffixes ?? []).filter((condition) => condition?.enabled !== false).map((condition) => conditionValue(condition)).filter(Boolean)
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

const FLASK_CATEGORIES = new Set([
  '生命药剂', '魔力药剂', '复合药剂', '功能药剂',
  'Life Flasks', 'Mana Flasks', 'Hybrid Flasks', 'Utility Flasks'
])
const EXPLICIT_MODIFIER_TYPES = new Set(['prefix', 'suffix', 'fractured', 'crafted'])

function isFlaskCategory(category = '') {
  const text = String(category || '').trim()
  return FLASK_CATEGORIES.has(text) || /药剂|Flask/i.test(text)
}

function modifierAffixSlot(modifier) {
  if (!modifier || typeof modifier !== 'object') return null
  if (modifier.affixType === 'prefix' || modifier.type === 'prefix') return 'prefix'
  if (modifier.affixType === 'suffix' || modifier.type === 'suffix') return 'suffix'
  return null
}

function explicitModifierInfo(itemInfo) {
  const modifiers = Array.isArray(itemInfo?.modifiers) ? itemInfo.modifiers : []
  const structured = modifiers.filter((modifier) => modifier && typeof modifier === 'object' && EXPLICIT_MODIFIER_TYPES.has(modifier.type))
  if (structured.length) return { count: structured.length, entries: structured }
  const detailedMods = Array.isArray(itemInfo?.detailedMods) ? itemInfo.detailedMods : []
  if (detailedMods.length) return { count: detailedMods.length, entries: detailedMods }
  const explicitMods = Array.isArray(itemInfo?.explicitMods) ? itemInfo.explicitMods : []
  if (explicitMods.length === 1) {
    return {
      count: 1,
      entries: [{ type: 'explicit', affixType: null, text: cleanEffectText(explicitMods[0]), tier: 0 }]
    }
  }
  return { count: null, entries: [] }
}

function explicitCandidateModifiers(itemInfo) {
  const { entries } = explicitModifierInfo(itemInfo)
  return entries.map((modifier) => {
    const text = cleanEffectText(modifier.text || modifier.lines?.join('\n') || '')
    return {
      name: String(modifier.name || ''),
      text,
      aliases: [...(modifier.textAliases || []), ...(modifier.nameAliases || []), ...(itemInfo?.modTextAliases?.[modifier.text] ?? [])],
      tier: Math.trunc(Number(modifier.tier)) || 0,
      slot: modifierAffixSlot(modifier)
    }
  })
}

function resolveConditionSlot(condition, resolveAffixType) {
  if (!condition || condition.kind !== 'catalog') return 'any'
  if (condition.affixType === 'prefix' || condition.affixType === 'suffix') return condition.affixType
  const resolved = typeof resolveAffixType === 'function' ? resolveAffixType(condition) : null
  return resolved === 'prefix' || resolved === 'suffix' ? resolved : 'any'
}

function isConditionBlockedByLowerTier(condition, conditionSlot, explicitCandidates) {
  if (!condition || condition.kind !== 'catalog' || condition.minTier === null) return false
  const patterns = expandAffixPatternsForMatching(condition).map(effectPatternRegex)
  if (!patterns.length) return false
  return explicitCandidates.some((modifier) => {
    if (!(modifier.tier > 0 && modifier.tier > condition.minTier)) return false
    if (conditionSlot !== 'any' && modifier.slot && modifier.slot !== conditionSlot) return false
    const texts = [modifier.text, ...(modifier.aliases ?? [])]
    return texts.some((text) => patterns.some((pattern) => pattern.test(text)))
  })
}

function conditionIdentityKey(condition) {
  if (!condition) return ''
  return condition.kind === 'catalog'
    ? `catalog:${cleanEffectText(condition.effectPattern).toLocaleLowerCase('zh-CN')}`
    : `keyword:${String(condition.keyword || '').trim().toLocaleLowerCase('zh-CN')}`
}

function slotFits(conditionSlot, rollSlot) {
  return conditionSlot === 'any' || rollSlot === 'any' || conditionSlot === rollSlot
}

export function evaluateAlterationPlan(itemInfo, affixGroupsOrRequired, options = {}) {
  const {
    selectedAffixes = [],
    selectedCount = 1,
    enableAugmentation = false,
    enableRegal = false,
    resolveAffixType = null,
    matchResult = null
  } = options
  const canUseRegalOnItem = !isFlaskCategory(itemInfo?.category)
  if (!itemInfo) {
    return {
      nextAction: 'none',
      shouldAugment: false,
      shouldRegal: false,
      canUseRegalOnItem,
      reason: 'no_item',
      skipAugmentReason: '',
      skipRegalReason: ''
    }
  }

  const effectiveMatch = matchResult ?? matchAffixes(itemInfo, affixGroupsOrRequired, selectedAffixes, selectedCount)
  if (effectiveMatch.isMatch) {
    return {
      nextAction: 'stop',
      shouldAugment: false,
      shouldRegal: false,
      canUseRegalOnItem,
      reason: 'already_matched',
      skipAugmentReason: '已满足达标条件，跳过增幅',
      skipRegalReason: '已满足达标条件，跳过富豪'
    }
  }

  const rarity = String(itemInfo.rarity || '').replace(/\s+/g, '')
  if (rarity !== '魔法') {
    return {
      nextAction: 'none',
      shouldAugment: false,
      shouldRegal: false,
      canUseRegalOnItem,
      reason: 'not_magic',
      skipAugmentReason: '',
      skipRegalReason: ''
    }
  }

  const explicitInfo = explicitModifierInfo(itemInfo)
  if (explicitInfo.count === null) {
    return {
      nextAction: 'unknown',
      shouldAugment: null,
      shouldRegal: false,
      canUseRegalOnItem,
      reason: 'affix_count_unknown',
      skipAugmentReason: '',
      skipRegalReason: ''
    }
  }

  const canAug = Boolean(enableAugmentation) && explicitInfo.count === 1
  const canRegal = Boolean(enableRegal) && canUseRegalOnItem && explicitInfo.count <= 2
  const existingSlot = explicitInfo.count === 1 ? modifierAffixSlot(explicitInfo.entries[0]) : null
  const openAugSlot = existingSlot === 'prefix' ? 'suffix' : (existingSlot === 'suffix' ? 'prefix' : 'any')

  const groups = Array.isArray(affixGroupsOrRequired)
    && affixGroupsOrRequired.some((entry) => entry && typeof entry === 'object' && ('requiredAffixes' in entry || 'selectedAffixes' in entry))
    ? affixGroupsOrRequired
    : legacyGroup(affixGroupsOrRequired, selectedAffixes, selectedCount)

  const candidates = candidateModifiers(itemInfo)
  const explicitCandidates = explicitCandidateModifiers(itemInfo)

  const groupPlans = groups
    .filter((group) => group && group.enabled !== false)
    .map((group) => {
      const required = (group.requiredAffixes ?? [])
        .filter((condition) => condition?.enabled !== false)
        .map((condition) => conditionValue(condition))
        .filter(Boolean)
      const selected = (group.selectedAffixes ?? [])
        .filter((condition) => condition?.enabled !== false)
        .map((condition) => conditionValue(condition))
        .filter(Boolean)
      if (!required.length && !selected.length) return null

      const evalCondition = (condition) => {
        const matched = Boolean(matchCondition(condition, candidates))
        const slot = resolveConditionSlot(condition, resolveAffixType)
        const blocked = !matched && isConditionBlockedByLowerTier(condition, slot, explicitCandidates)
        return { condition, matched, slot, blocked, key: conditionIdentityKey(condition) }
      }

      const reqStates = required.map(evalCondition)
      const selStates = selected.map(evalCondition)
      const unsatReq = reqStates.filter((entry) => !entry.matched)
      if (unsatReq.some((entry) => entry.blocked)) {
        return { augUseful: false, regalReachable: false, failReason: 'blocked' }
      }

      const requiredSelectedCount = selected.length
        ? Math.max(1, Math.min(selected.length, Math.trunc(Number(group.selectedCount)) || 1))
        : 0
      const matchedSelCount = selStates.filter((entry) => entry.matched).length
      const rawNeedSel = Math.max(0, requiredSelectedCount - matchedSelCount)

      const unsatReqKeys = new Set(unsatReq.map((entry) => entry.key).filter(Boolean))
      const unsatAvailSel = selStates.filter((entry) => !entry.matched && !entry.blocked)
      const overlappingSelCount = unsatAvailSel.filter((entry) => unsatReqKeys.has(entry.key)).length
      const availSel = unsatAvailSel.filter((entry) => !unsatReqKeys.has(entry.key))
      const needReq = unsatReq.length
      const needSel = Math.max(0, rawNeedSel - overlappingSelCount)

      if (availSel.length < needSel) {
        return { augUseful: false, regalReachable: false, failReason: 'blocked' }
      }

      const totalNeed = needReq + needSel
      const regalReachable = canRegal && totalNeed <= 1

      let augUseful = false
      let augFailReason = 'count'
      if (canAug) {
        const maxBudgetWithAug = 1 + (canRegal ? 1 : 0)
        if (totalNeed <= maxBudgetWithAug) {
          if (totalNeed === 1) {
            augUseful = needReq === 1
              ? slotFits(unsatReq[0].slot, openAugSlot)
              : availSel.some((entry) => slotFits(entry.slot, openAugSlot))
          } else if (totalNeed === 2) {
            if (needReq === 2) {
              augUseful = slotFits(unsatReq[0].slot, openAugSlot) || slotFits(unsatReq[1].slot, openAugSlot)
            } else if (needReq === 1 && needSel === 1) {
              augUseful = slotFits(unsatReq[0].slot, openAugSlot) || availSel.some((entry) => slotFits(entry.slot, openAugSlot))
            } else if (needReq === 0 && needSel === 2) {
              augUseful = availSel.length >= 2 && availSel.some((entry) => slotFits(entry.slot, openAugSlot))
            }
          }
          if (!augUseful) augFailReason = 'slot'
        }
      }

      return { augUseful, regalReachable, failReason: augFailReason }
    })
    .filter(Boolean)

  const shouldAugment = canAug && groupPlans.some((plan) => plan.augUseful)
  const shouldRegal = !shouldAugment && canRegal && groupPlans.some((plan) => plan.regalReachable)
  const nextAction = shouldAugment ? 'augment' : (shouldRegal ? 'regal' : 'reroll')

  let skipAugmentReason = ''
  if (canAug && !shouldAugment) {
    if (groupPlans.length && groupPlans.every((plan) => plan.failReason === 'blocked')) {
      skipAugmentReason = '目标词缀已被更低 T 级占用，增幅无法达标，跳过增幅'
    } else if (groupPlans.length && groupPlans.every((plan) => plan.failReason === 'slot')) {
      skipAugmentReason = shouldRegal
        ? '当前空槽位无法掷出所需前后缀，跳过增幅直接尝试富豪'
        : '当前空槽位无法掷出所需前后缀，跳过增幅'
    } else if (shouldRegal) {
      skipAugmentReason = '当前增幅无法推进达标组合，跳过增幅直接尝试富豪'
    } else {
      skipAugmentReason = '当前缺失词缀数超过后续可增词缀数，跳过增幅'
    }
  }

  let skipRegalReason = ''
  if (enableRegal && !shouldRegal && !shouldAugment) {
    if (!canUseRegalOnItem) {
      skipRegalReason = '药剂无法使用富豪石，跳过富豪'
    } else if (groupPlans.length && groupPlans.every((plan) => plan.failReason === 'blocked')) {
      skipRegalReason = '目标词缀已被更低 T 级占用，富豪无法达标，跳过富豪'
    } else {
      skipRegalReason = '当前缺失词缀数超过 1 条，富豪无法达标，跳过富豪'
    }
  }

  return {
    nextAction,
    shouldAugment,
    shouldRegal,
    canUseRegalOnItem,
    openAugSlot: explicitInfo.count === 1 ? openAugSlot : null,
    reason: nextAction,
    skipAugmentReason,
    skipRegalReason
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

  const targetKind = ['chart', 'heist'].includes(mapConfig.targetKind) ? mapConfig.targetKind : 'atlas'
  const categoryMatches = targetKind === 'heist' ? ['契约', '蓝图'].includes(itemInfo.category) && !itemInfo.isQuestItem : targetKind === 'chart'
    ? itemInfo.category === '海图'
    : ['异界地图', '地图', '裂隙之石'].includes(itemInfo.category) && !itemInfo.isQuestItem
  if (!categoryMatches) return { isMatch: false, reason: 'category' }

  const matchConfig = mapConfig.match || {}
  const explicitMods = itemInfo.explicitMods || []

  // 1. 检查黑名单 (Blacklist)
  const blacklist = matchConfig.blacklist || []
  for (const mod of explicitMods) {
    const modTexts = [mod, ...(itemInfo.modTextAliases?.[mod] || [])]
    for (const blackTerm of blacklist) {
      if (!blackTerm) continue
      const expandedTerms = expandMapAffixTermForMatching(blackTerm, targetKind)
      if (expandedTerms.some(term => modTexts.some(value => matchMapTerm(value, term)))) {
        return { isMatch: false, reason: 'blacklist' }
      }
    }
  }

  // 白名单沿用既有“任一命中即通过词缀检查”语义；基底条件仍必须满足。
  const whitelist = matchConfig.whitelist || []
  const whitelistMatched = whitelist.some(rawTerm => {
    if (!rawTerm) return false
    const expandedTerms = expandMapAffixTermForMatching(rawTerm, targetKind)
    return explicitMods.some(mod => {
      const modTexts = [mod, ...(itemInfo.modTextAliases?.[mod] || [])]
      return expandedTerms.some(term => modTexts.some(value => matchMapTerm(value, term)))
    })
  })

  if (targetKind === 'heist' && whitelist.some(term => term?.trim()) && !whitelistMatched) return { isMatch: false, reason: 'whitelist' }

  const validKeys = targetKind === 'heist'
    ? ['quantity', 'rarity', 'alertLevelReduction', 'timeBeforeLockdown', 'maximumAliveReinforcements']
    : targetKind === 'chart'
    ? ['quantity', 'rarity', 'packSize', 'deadmanSulphur']
    : ['quantity', 'rarity', 'packSize', 'atlasDrops', 'moreMaps', 'moreScarabs', 'moreThreads', 'moreCurrency']
  const mandatory = Object.fromEntries(Object.entries(matchConfig.mandatoryStats || {}).filter(([key]) => validKeys.includes(key)).map(([key, value]) => [key, { ...value }]))
  const optional = Object.fromEntries(Object.entries(matchConfig.optionalStats || {}).filter(([key]) => validKeys.includes(key)).map(([key, value]) => [key, { ...value }]))

  if (targetKind === 'heist') {
    for (const [key, condition] of [...Object.entries(mandatory), ...Object.entries(optional)]) {
      if (condition?.enabled && !Number.isFinite(itemInfo.heistStats?.[key])) return { isMatch: false, reason: 'unreadable-stat', failedStat: key }
    }
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
  if (itemInfo.heistStats && Number.isFinite(itemInfo.heistStats[key])) return itemInfo.heistStats[key]
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
    // 地图额外收益属性：更多地图
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
    // 地图额外收益属性：更多圣甲虫
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
  } else if (key === 'moreThreads') {
    val = itemInfo.moreThreads || 0
  } else if (key === 'atlasDrops') {
    val = itemInfo.atlasDrops || 0
  } else if (key === 'moreCurrency') {
    // 地图额外收益属性：更多通货
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

