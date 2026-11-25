import {
  ARMOUR_DEFENCE_THRESHOLDS,
  CLUSTER_NOTABLE_REF_PATTERN,
  CLUSTER_NOTABLE_TEXT_PATTERN,
  CLUSTER_PASSIVE_COUNT_CORE_ID,
  CLUSTER_PASSIVE_COUNT_REF,
  HIGH_VALUE_ELDRITCH_IMPLICIT_RULES,
  HIGH_VALUE_RARE_BASE_TYPES,
  HIGH_VALUE_STAT_RULES,
  LOCAL_PROPERTY_ABSORPTION,
  MAX_SCORED_AUTO_SELECTIONS,
  PSEUDO_AUTO_RULES,
  UNIQUE_VARIANT_RULES,
  weaponDpsThresholds
} from './autoSelectRules.js'
import { PRICE_CHECK_CLASSIC_INFLUENCES } from '../../../shared/priceCheckMetadata.js'
import { isLogbookStat } from './specialItems.js'

const CLASSIC_INFLUENCE_STAT_IDS = new Set(PRICE_CHECK_CLASSIC_INFLUENCES.map(({ statId }) => statId))
const MAP_REWARD_STAT_IDS = new Set([
  'pseudo.pseudo_map_more_map_drops',
  'pseudo.pseudo_map_more_scarab_drops',
  'pseudo.pseudo_map_more_currency_drops'
])
const RARE_EQUIPMENT_CATEGORY_PREFIXES = ['armour.', 'weapon.', 'accessory.']
const RARE_JEWEL_CATEGORIES = new Set(['jewel', 'jewel.abyss'])

export function coreStatId(id) {
  const text = String(id || '').trim()
  const dot = text.indexOf('.')
  const stripped = dot >= 0 ? text.slice(dot + 1) : text
  const pipe = stripped.indexOf('|')
  return pipe >= 0 ? stripped.slice(0, pipe) : stripped
}

function normalizeEnglishRefFromText(text) {
  const value = String(text || '').trim()
  if (!value || /[\u4e00-\u9fff]/.test(value)) return ''
  return value.replace(/-?\d+(?:\.\d+)?/g, '#').replace(/\s+/g, ' ').trim()
}

export function collectStatRefs(stat) {
  const refs = new Set()
  if (stat?.ref) refs.add(stat.ref)
  for (const ref of stat?.refs || []) if (ref) refs.add(ref)
  for (const source of stat?.sources || []) {
    if (source?.ref) refs.add(source.ref)
    for (const ref of source?.refs || []) if (ref) refs.add(ref)
  }
  const fallback = normalizeEnglishRefFromText(stat?.text)
  if (fallback) refs.add(fallback)
  return refs
}

function collectCoreIds(stat) {
  const ids = new Set()
  if (stat?.id) ids.add(coreStatId(stat.id))
  for (const variant of stat?.queryVariants || []) {
    if (variant?.id) ids.add(coreStatId(variant.id))
  }
  return ids
}

function primaryNumericValue(stat) {
  const finite = (stat?.values || []).filter(Number.isFinite)
  if (!finite.length) return null
  return finite.length === 1 ? finite[0] : finite.reduce((sum, v) => sum + v, 0) / finite.length
}

function categoryFamily(category) {
  const value = String(category || '')
  const dot = value.indexOf('.')
  return dot >= 0 ? value.slice(0, dot) : value
}

function matchesCategoryScope(rule, category) {
  const family = categoryFamily(category)
  if (rule.categories) {
    if (!rule.categories.has(category) && !rule.categories.has(family)) return false
  }
  if (rule.excludeCategories) {
    if (rule.excludeCategories.has(category) || rule.excludeCategories.has(family)) return false
  }
  return true
}

function thresholdForCategory(thresholds, category) {
  if (!thresholds) return null
  const family = categoryFamily(category)
  if (thresholds[category] != null) return thresholds[category]
  if (thresholds[family] != null) return thresholds[family]
  return thresholds.default ?? null
}

function matchesRule(rule, stat, refs, coreIds, category) {
  if (!matchesCategoryScope(rule, category)) return false
  let matchedIdentity = false
  if (rule.refs) {
    for (const ref of refs) {
      if (rule.refs.has(ref)) { matchedIdentity = true; break }
    }
  }
  if (!matchedIdentity && rule.coreIds) {
    for (const id of coreIds) {
      if (rule.coreIds.has(id)) { matchedIdentity = true; break }
    }
  }
  if (!matchedIdentity && rule.refPattern) {
    for (const ref of refs) {
      if (rule.refPattern.test(ref)) { matchedIdentity = true; break }
    }
  }
  if (!matchedIdentity) return false

  const value = primaryNumericValue(stat)
  if (rule.negativeMinAbs != null) {
    if (value == null || value >= 0 || Math.abs(value) < rule.negativeMinAbs) return false
  } else {
    const minValue = rule.minValueByCategory
      ? thresholdForCategory(rule.minValueByCategory, category)
      : rule.minValue
    if (minValue != null && (value == null || Math.abs(value) < minValue)) return false
  }
  if (rule.maxTier != null) {
    const tier = Number(stat.tier) || 0
    if (tier > 0 && tier > rule.maxTier) return false
  }
  return true
}

function isClusterJewelModel(model) {
  const baseType = String(model?.identity?.type || model?.item?.baseType || '')
  return /^(?:(?:大型|中型|小型)星团珠宝|(?:Large|Medium|Small) Cluster Jewel)$/.test(baseType)
}

function isClusterNotableStat(stat, refs) {
  if (stat?.type !== 'explicit' && stat?.type !== 'fractured') return false
  for (const ref of refs) {
    if (CLUSTER_NOTABLE_REF_PATTERN.test(ref)) return true
  }
  return CLUSTER_NOTABLE_TEXT_PATTERN.test(String(stat?.text || '').trim())
}

function isClusterPassiveCountStat(stat, refs, coreIds) {
  if (stat?.type !== 'enchant') return false
  if (coreIds.has(CLUSTER_PASSIVE_COUNT_CORE_ID)) return true
  return refs.has(CLUSTER_PASSIVE_COUNT_REF)
}

function isRareEquipmentCategory(category) {
  return RARE_EQUIPMENT_CATEGORY_PREFIXES.some((prefix) => String(category || '').startsWith(prefix))
}

function isHighValueRareBase(model) {
  const candidates = [model?.identity?.type, model?.item?.baseType].filter(Boolean)
  return candidates.some((name) => HIGH_VALUE_RARE_BASE_TYPES.has(String(name).trim()))
}

function shouldEnableIdentityName(model, isClusterJewel, mode) {
  const category = String(model?.identity?.category || '')
  if (!category) return true
  if (mode !== 'auto') return true
  const rarity = String(model?.item?.rarity || '').replace(/\s/g, '')
  if (rarity !== '稀有') return true
  if (isClusterJewel) return true
  if (!isRareEquipmentCategory(category) && !RARE_JEWEL_CATEGORIES.has(category)) return true
  if (isHighValueRareBase(model)) return true
  return false
}

function setAutoMeta(entry, enabled, reason) {
  entry.autoSelection = { enabled: Boolean(enabled), reason: String(reason || '') }
}

function isPropertyProtected(property, category) {
  if (property.id === 'misc.memoryLevel') return true
  if (category === 'map' && property.id === 'map.tier') return true
  if (category === 'chart' && ['map.areaLevel', 'map.sulphur', 'misc.itemLevel'].includes(property.id)) return true
  return false
}

function isHighValueFracturedStat(stat, refs, coreIds, category) {
  if (stat.type !== 'fractured') return false
  // Explicit high-value rules or strong T1/T2 fractured affixes (life/res/attr/speed/dmg)
  for (const rule of HIGH_VALUE_STAT_RULES) {
    if (matchesRule(rule, stat, refs, coreIds, category)) return true
  }
  if (Number(stat.tier) > 0 && Number(stat.tier) <= 2) return true
  // Fractured stats without tier metadata (e.g. jewels, special mods) are usually the core crafting base
  return !stat.tier
}

function evaluateProperties(model, category, rarity, isClusterJewel, mode) {
  const absorbedByProperty = new Map() // coreId/ref -> propertyLabel
  const selectedWeaponDps = { any: false }
  const isCraftingBase = rarity === '普通' || rarity === '魔法'
  const isGem = category.startsWith('gem.')
  const isAwakenedGem = category === 'gem.supportgemplus'
  const weaponThresholds = rarity !== '传奇' ? weaponDpsThresholds(category) : null
  const armourThresholds = rarity !== '传奇' ? ARMOUR_DEFENCE_THRESHOLDS[category] || null : null

  // For weapons, pick the stronger of pDPS / eDPS if both cross threshold so we don't double-lock.
  let chosenWeaponDpsId = null
  if (mode === 'auto' && weaponThresholds) {
    const pdpsProp = (model.properties || []).find((p) => p.id === 'weapon.pdps')
    const edpsProp = (model.properties || []).find((p) => p.id === 'weapon.edps')
    const pdpsRatio = pdpsProp && pdpsProp.value >= weaponThresholds.pdps ? pdpsProp.value / weaponThresholds.pdps : 0
    const edpsRatio = edpsProp && edpsProp.value >= weaponThresholds.edps ? edpsProp.value / weaponThresholds.edps : 0
    if (pdpsRatio > 0 || edpsRatio > 0) {
      chosenWeaponDpsId = pdpsRatio >= edpsRatio ? 'weapon.pdps' : 'weapon.edps'
    }
  }

  // For armours, select defences that meet threshold (at most the highest 1-2 defences).
  const chosenArmourDefIds = new Set()
  if (mode === 'auto' && armourThresholds) {
    const candidates = [
      ['armour.energyShield', armourThresholds.energyShield],
      ['armour.armour', armourThresholds.armour],
      ['armour.evasion', armourThresholds.evasion]
    ].map(([id, threshold]) => {
      const prop = (model.properties || []).find((p) => p.id === id)
      return prop && prop.value >= threshold ? { id, ratio: prop.value / threshold } : null
    }).filter(Boolean).sort((a, b) => b.ratio - a.ratio)
    if (candidates.length) chosenArmourDefIds.add(candidates[0].id)
  }

  for (const property of model.properties || []) {
    if (isPropertyProtected(property, category)) {
      const reason = property.id === 'misc.memoryLevel'
        ? '回忆束丝核心属性'
        : (category === 'map' ? '地图核心阶级' : '海图默认核心属性')
      property.enabled = true
      setAutoMeta(property, true, reason)
      continue
    }

    if (category === 'logbook' && property.id === 'misc.itemLevel') {
      const enabled = mode !== 'none'
      property.enabled = enabled
      setAutoMeta(property, enabled, enabled ? '日志区域等级' : '当前策略为不自动勾选')
      continue
    }

    if (mode !== 'auto') {
      property.enabled = false
      setAutoMeta(property, false, mode === 'none' ? '当前策略为不自动勾选' : '属性默认不随全选勾选')
      continue
    }

    if (property.id === 'socket.links' && property.value >= 6) {
      property.enabled = true
      setAutoMeta(property, true, '六连核心结构属性')
      continue
    }

    if (isGem && property.id === 'misc.gemLevel') {
      const levelThreshold = isAwakenedGem ? 5 : 20
      if (property.value >= levelThreshold) {
        property.enabled = true
        setAutoMeta(property, true, isAwakenedGem ? '觉醒宝石高等级' : '高等级宝石')
        continue
      }
    }

    if (isGem && property.id === 'misc.quality' && property.value >= 20) {
      property.enabled = true
      setAutoMeta(property, true, '高品质宝石')
      continue
    }

    if (property.id === 'misc.itemLevel') {
      const hasClassicInfluence = (model.item?.influences || []).length > 0
      const isSynthesised = model.facts?.synthesised === true
      const isFractured = model.facts?.fractured === true
      if (isClusterJewel && property.value >= 84) {
        property.enabled = true
        setAutoMeta(property, true, '84+ 高物等星团珠宝')
        continue
      }
      if ((isCraftingBase || isSynthesised || (isFractured && isCraftingBase) || (hasClassicInfluence && isCraftingBase)) &&
          property.value >= 84 &&
          (isRareEquipmentCategory(category) || category === 'jewel' || category === 'jewel.abyss' || category === 'flask')) {
        property.enabled = true
        setAutoMeta(property, true, '84+ 高物等做装底材')
        continue
      }
    }

    if (chosenWeaponDpsId && property.id === chosenWeaponDpsId) {
      property.enabled = true
      selectedWeaponDps.any = true
      const absorption = LOCAL_PROPERTY_ABSORPTION[property.id]
      setAutoMeta(property, true, `高${absorption.label}武器核心属性`)
      for (const id of absorption.coreIds) absorbedByProperty.set(`id:${id}`, absorption.label)
      for (const ref of absorption.refs) absorbedByProperty.set(`ref:${ref}`, absorption.label)
      continue
    }

    if (chosenArmourDefIds.has(property.id)) {
      property.enabled = true
      const absorption = LOCAL_PROPERTY_ABSORPTION[property.id]
      setAutoMeta(property, true, `高${absorption.label}防具核心属性`)
      for (const id of absorption.coreIds) absorbedByProperty.set(`id:${id}`, absorption.label)
      for (const ref of absorption.refs) absorbedByProperty.set(`ref:${ref}`, absorption.label)
      continue
    }

    property.enabled = false
    setAutoMeta(property, false, '未达到自动预选阈值')
  }

  return { absorbedByProperty, selectedWeaponDps }
}

function findPropertyAbsorption(stat, refs, coreIds, absorbedByProperty) {
  if (!absorbedByProperty.size) return ''
  for (const id of coreIds) {
    if (absorbedByProperty.has(`id:${id}`)) return absorbedByProperty.get(`id:${id}`)
  }
  for (const ref of refs) {
    if (absorbedByProperty.has(`ref:${ref}`)) return absorbedByProperty.get(`ref:${ref}`)
  }
  return ''
}

function selectionCapForModel(model, category, rarity, isClusterJewel) {
  if (rarity === '传奇') return MAX_SCORED_AUTO_SELECTIONS.unique
  if (category === 'flask') return MAX_SCORED_AUTO_SELECTIONS.flask
  if (category === 'tincture') return MAX_SCORED_AUTO_SELECTIONS.tincture
  if (category === 'jewel' || category === 'jewel.abyss') return isClusterJewel ? 4 : MAX_SCORED_AUTO_SELECTIONS.jewel
  return MAX_SCORED_AUTO_SELECTIONS.rareEquipment
}

function shouldEnableClassicInfluence(model, mode) {
  if (mode === 'all') return true
  if (mode === 'none') return true // Preserve explicit classic influence expectation in non-auto mode unless toggled
  const rarity = String(model?.item?.rarity || '').replace(/\s/g, '')
  const influences = model?.item?.influences || []
  if (influences.length >= 2) return true
  if (rarity === '普通' || rarity === '魔法') return true
  return Number(model?.item?.itemLevel || 0) >= 84
}

export function applyAutoSelection(model, options = {}) {
  if (!model || typeof model !== 'object') return model
  const mode = ['auto', 'all', 'none'].includes(options.initialSelection)
    ? options.initialSelection
    : 'auto'
  const category = String(model.identity?.category || '')
  const rarity = String(model.item?.rarity || '').replace(/\s/g, '')
  const isClusterJewel = isClusterJewelModel(model)
  const isMapLike = category === 'map' || category === 'chart' || category === 'viscera'
  const isLogbook = category === 'logbook'

  // 1. Identity name / baseType default
  if (model.identity && !model.identityResolution?.required) {
    model.identity.nameEnabled = shouldEnableIdentityName(model, isClusterJewel, mode)
  }

  // 2. Properties & local absorption map
  const { absorbedByProperty, selectedWeaponDps } = evaluateProperties(
    model,
    category,
    rarity,
    isClusterJewel,
    mode
  )

  const stats = model.stats || []

  // Enforce exact bounds on cluster jewel passive count regardless of mode,
  // while keeping user edits untouched on rerun (applyAutoSelection only runs at creation).
  for (const stat of stats) {
    const refs = collectStatRefs(stat)
    const coreIds = collectCoreIds(stat)
    if (isClusterJewel && isClusterPassiveCountStat(stat, refs, coreIds)) {
      const value = primaryNumericValue(stat)
      if (Number.isFinite(value) && value > 0) {
        stat.min = Math.abs(value)
        stat.max = Math.abs(value)
      }
    }
  }

  // Handle 'none' mode cleanly
  if (mode === 'none') {
    for (const stat of stats) {
      if (CLASSIC_INFLUENCE_STAT_IDS.has(stat.id)) {
        stat.enabled = true
        setAutoMeta(stat, true, '经典势力条件')
        continue
      }
      stat.enabled = false
      setAutoMeta(stat, false, '当前策略为不自动勾选')
    }
    return model
  }

  // Handle 'all' mode cleanly
  if (mode === 'all') {
    for (const stat of stats) {
      if (MAP_REWARD_STAT_IDS.has(stat.id)) {
        stat.enabled = false
        setAutoMeta(stat, false, '地图额外奖励默认不勾选')
        continue
      }
      stat.enabled = true
      setAutoMeta(stat, true, '当前策略为勾选全部词缀')
    }
    return model
  }

  // 3. 'auto' mode full evaluation
  const rawStats = stats.filter((stat) => stat.type !== 'pseudo')
  const pseudoStats = stats.filter((stat) => stat.type === 'pseudo')

  // Identify protected raw keys (foulborn & high-value fractured) that pseudo must NOT swallow.
  const protectedRawKeys = new Set()
  const rawMetaByStat = new Map()
  for (const stat of rawStats) {
    const refs = collectStatRefs(stat)
    const coreIds = collectCoreIds(stat)
    rawMetaByStat.set(stat, { refs, coreIds })
    if (stat.sourceSubtype === 'foulborn') protectedRawKeys.add(stat.key)
    else if (isHighValueFracturedStat(stat, refs, coreIds, category)) protectedRawKeys.add(stat.key)
  }

  // Reset all stats first
  for (const stat of stats) {
    stat.enabled = false
    setAutoMeta(stat, false, '未命中高价值预选规则')
  }

  const mustKeep = []
  const scoredCandidates = []

  // 3a. Evaluate special pseudo stats (influence, logbook, map rewards) and regular pseudo stats
  const pseudoRuleByRef = new Map(PSEUDO_AUTO_RULES.map((rule) => [rule.ref, rule]))
  const absorbedByPseudoKeys = new Set()

  for (const stat of pseudoStats) {
    if (MAP_REWARD_STAT_IDS.has(stat.id)) {
      setAutoMeta(stat, false, '地图额外奖励默认不勾选')
      continue
    }
    if (isLogbookStat(stat)) {
      mustKeep.push({ stat, reason: '先祖秘藏日志区域/派系' })
      continue
    }
    if (CLASSIC_INFLUENCE_STAT_IDS.has(stat.id)) {
      if (shouldEnableClassicInfluence(model, mode)) {
        mustKeep.push({ stat, reason: '高价值势力底材/双势力' })
      } else {
        setAutoMeta(stat, false, '低物等单势力稀有装备默认放宽')
      }
      continue
    }

    // Standard aggregate pseudo stats: only evaluate on non-unique, non-map-like items
    if (rarity === '传奇' || isMapLike || isLogbook) {
      setAutoMeta(stat, false, '该品类不使用常规综合预选')
      continue
    }

    const refs = collectStatRefs(stat)
    const matchedRule = [...refs].map((ref) => pseudoRuleByRef.get(ref)).find(Boolean)
    if (!matchedRule) {
      setAutoMeta(stat, false, '非默认自动预选综合项')
      continue
    }
    if (!matchesCategoryScope(matchedRule, category)) {
      setAutoMeta(stat, false, '该部位不自动预选此综合项')
      continue
    }
    if (matchedRule.skipWhenWeaponDpsSelected && selectedWeaponDps.any) {
      setAutoMeta(stat, false, '已由武器 DPS 属性覆盖')
      continue
    }
    const sources = stat.sources || []
    if (sources.length && sources.every((source) => source.type === 'crafted')) {
      setAutoMeta(stat, false, '仅由工艺词缀构成，默认不预选')
      continue
    }
    if (sources.some((source) => protectedRawKeys.has(source.key))) {
      setAutoMeta(stat, false, '来源含高价值分裂或秽生词缀，保留原词缀')
      continue
    }

    const threshold = thresholdForCategory(matchedRule.thresholds, category)
    const value = primaryNumericValue(stat)
    if (threshold != null && (value == null || value < threshold)) {
      setAutoMeta(stat, false, `未达到该部位综合阈值（需 ≥ ${threshold}）`)
      continue
    }

    scoredCandidates.push({
      stat,
      score: matchedRule.score,
      reason: matchedRule.reason,
      isPseudo: true,
      sourceKeys: sources.map((source) => source.key).filter(Boolean)
    })
  }

  // 3b. Evaluate raw stats
  for (const stat of rawStats) {
    const { refs, coreIds } = rawMetaByStat.get(stat)

    if (stat.sourceSubtype === 'foulborn') {
      mustKeep.push({ stat, reason: '秽生专属词缀' })
      continue
    }

    if (isLogbook) {
      mustKeep.push({ stat, reason: '日志核心词缀' })
      continue
    }

    if (isMapLike) {
      if (stat.type === 'implicit') {
        mustKeep.push({ stat, reason: '地图/海图/内脏基底词缀' })
      } else {
        setAutoMeta(stat, false, '地图/海图普通词缀默认不勾选')
      }
      continue
    }

    if (isClusterJewel) {
      if (stat.type === 'enchant') {
        mustKeep.push({
          stat,
          reason: isClusterPassiveCountStat(stat, refs, coreIds) ? '星团核心附魔（精确天赋数）' : '星团核心附魔'
        })
        continue
      }
      if (isClusterNotableStat(stat, refs)) {
        mustKeep.push({ stat, reason: '星团核心大天赋' })
        continue
      }
    }

    // Crafted mods are never selected standalone (they still contribute to pseudo above)
    if (stat.type === 'crafted') {
      setAutoMeta(stat, false, '工艺词缀默认不单独预选')
      continue
    }

    // Synthesised implicit on non-unique or unique
    if (stat.type === 'implicit' && model.facts?.synthesised) {
      mustKeep.push({ stat, reason: '忆境高价值基底' })
      continue
    }

    // Corrupted implicit (especially double-corrupted uniques / corrupted jewels)
    if (stat.type === 'implicit' && stat.sourceSubtype === 'corrupted') {
      mustKeep.push({ stat, reason: '腐化基底词缀' })
      continue
    }

    // Eldritch implicit whitelist
    if (stat.type === 'implicit' && (stat.sourceSubtype === 'searing-exarch' || stat.sourceSubtype === 'eater-of-worlds')) {
      const eldritchRule = HIGH_VALUE_ELDRITCH_IMPLICIT_RULES.find((rule) => matchesRule(rule, stat, refs, coreIds, category))
      if (eldritchRule) {
        scoredCandidates.push({ stat, score: eldritchRule.score, reason: eldritchRule.reason })
      } else {
        setAutoMeta(stat, false, '普通双王基底默认不预选')
      }
      continue
    }

    // Unique item rules: variant mods + key rolls only (plus corrupted/foulborn handled above)
    if (rarity === '传奇') {
      const variantRule = UNIQUE_VARIANT_RULES.find((rule) => matchesRule(rule, stat, refs, coreIds, category))
      if (variantRule) {
        mustKeep.push({ stat, reason: variantRule.reason })
      } else if (stat.type === 'implicit' && model.facts?.corrupted) {
        // Fallback for normal copy (without advanced header) on corrupted uniques with high-value implicits
        const explicitRule = HIGH_VALUE_STAT_RULES.find((rule) => matchesRule(rule, stat, refs, coreIds, category))
        if (explicitRule) {
          mustKeep.push({ stat, reason: `腐化高价值基底（${explicitRule.reason}）` })
        } else {
          setAutoMeta(stat, false, '传奇常规词缀默认不预选')
        }
      } else {
        setAutoMeta(stat, false, '传奇常规词缀默认不预选')
      }
      continue
    }

    // High-value fractured mod: protected from pseudo absorption & always kept
    if (stat.type === 'fractured') {
      if (protectedRawKeys.has(stat.key)) {
        mustKeep.push({ stat, reason: '高价值分裂词缀' })
      } else {
        setAutoMeta(stat, false, '低阶分裂词缀默认不预选')
      }
      continue
    }

    // Check if already absorbed by an enabled aggregate property (pDPS / eDPS / Armour / Evasion / ES)
    const propertyLabel = findPropertyAbsorption(stat, refs, coreIds, absorbedByProperty)
    if (propertyLabel) {
      setAutoMeta(stat, false, `已被总${propertyLabel}属性覆盖`)
      continue
    }

    // Regular implicit on non-synthesised/non-corrupted/non-eldritch items: skip standalone unless high-value
    if (stat.type === 'implicit') {
      const implicitRule = HIGH_VALUE_STAT_RULES.find((rule) => (
        rule.id === 'corrupted-blood-immunity' ||
        rule.id === 'additional-curse' ||
        rule.id === 'max-charges' ||
        rule.id === 'reduced-extra-crit-damage'
      ) && matchesRule(rule, stat, refs, coreIds, category))
      if (implicitRule) {
        scoredCandidates.push({ stat, score: implicitRule.score, reason: implicitRule.reason })
      } else {
        setAutoMeta(stat, false, '常规底材基底默认不预选')
      }
      continue
    }

    // Evaluate explicit/veiled/delve/other whitelist rules
    const matchedRule = HIGH_VALUE_STAT_RULES.find((rule) => matchesRule(rule, stat, refs, coreIds, category))
    if (matchedRule) {
      const tierBonus = Number(stat.tier) === 1 ? 4 : (Number(stat.tier) === 2 ? 2 : 0)
      scoredCandidates.push({
        stat,
        score: matchedRule.score + tierBonus,
        reason: matchedRule.reason
      })
    } else {
      setAutoMeta(stat, false, Number(stat.tier) > 0 && Number(stat.tier) <= 2
        ? '未列入高价值白名单的普通 T1/T2 词缀'
        : '低价值或次级词缀')
    }
  }

  // 4. Enable all must-keep structural/variant/fractured/foulborn stats
  const selectedRawKeys = new Set()
  for (const { stat, reason } of mustKeep) {
    stat.enabled = true
    setAutoMeta(stat, true, reason)
    if (stat.type !== 'pseudo') selectedRawKeys.add(stat.key)
  }

  // 5. Sort scored candidates by score desc (stable original order tiebreaker) and apply cap
  const cap = selectionCapForModel(model, category, rarity, isClusterJewel)
  const sorted = scoredCandidates
    .map((candidate, index) => ({ ...candidate, index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)

  // Prevent bidirectional duplication between pseudo stats and their source raw stats
  const selected = []
  for (const candidate of sorted) {
    if (candidate.isPseudo && (candidate.sourceKeys || []).some((key) => selectedRawKeys.has(key))) {
      setAutoMeta(candidate.stat, false, '来源词缀已直接选中')
      continue
    }
    if (!candidate.isPseudo && absorbedByPseudoKeys.has(candidate.stat.key)) {
      setAutoMeta(candidate.stat, false, '已被综合词缀覆盖')
      continue
    }
    if (selected.length >= cap) {
      setAutoMeta(candidate.stat, false, `超过自动预选上限（最多 ${cap} 项）`)
      continue
    }
    candidate.stat.enabled = true
    setAutoMeta(candidate.stat, true, candidate.reason)
    selected.push(candidate)
    if (candidate.isPseudo) {
      for (const key of candidate.sourceKeys || []) absorbedByPseudoKeys.add(key)
    } else {
      selectedRawKeys.add(candidate.stat.key)
    }
  }

  // Mark any raw stats absorbed by enabled pseudo stats (even if they were not in scoredCandidates)
  for (const stat of rawStats) {
    if (!stat.enabled && absorbedByPseudoKeys.has(stat.key)) {
      setAutoMeta(stat, false, '已被综合词缀覆盖')
    }
  }

  return model
}

/**
 * Audit helper verifying every exact ref / coreId referenced by the declarative
 * rules exists in a given trade catalog.
 */
export function auditAutoSelectRules(catalog) {
  const catalogRefs = new Set()
  const catalogCoreIds = new Set()
  for (const entry of catalog?.stats || []) {
    for (const ref of entry.refs || []) catalogRefs.add(ref)
    for (const matcher of entry.matchers || []) catalogRefs.add(matcher)
    for (const raw of Object.values(entry.ids || {})) {
      for (const id of Array.isArray(raw) ? raw : [raw]) catalogCoreIds.add(coreStatId(id))
    }
  }

  const missingRefs = []
  const missingCoreIds = []
  const checkRule = (scope, rule) => {
    const refs = rule.refs ? [...rule.refs] : (rule.ref ? [rule.ref] : [])
    for (const ref of refs) {
      if (!catalogRefs.has(ref)) missingRefs.push({ scope, id: rule.id || ref, ref })
    }
    for (const id of rule.coreIds || []) {
      if (!catalogCoreIds.has(id)) missingCoreIds.push({ scope, id: rule.id || id, coreId: id })
    }
  }

  for (const rule of PSEUDO_AUTO_RULES) checkRule('pseudo', rule)
  for (const rule of HIGH_VALUE_STAT_RULES) checkRule('stat', rule)
  for (const rule of HIGH_VALUE_ELDRITCH_IMPLICIT_RULES) checkRule('eldritch', rule)
  for (const rule of UNIQUE_VARIANT_RULES) checkRule('unique', rule)
  for (const [propId, group] of Object.entries(LOCAL_PROPERTY_ABSORPTION)) {
    checkRule(`absorption:${propId}`, { id: propId, refs: group.refs, coreIds: group.coreIds })
  }

  return {
    missingRefs,
    missingCoreIds,
    valid: missingRefs.length === 0 && missingCoreIds.length === 0
  }
}
