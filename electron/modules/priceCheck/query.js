import { isTradeStatId, resolveCatalogStat, resolveChartRegion } from './catalog.js'
import { CHART_SHAPES, resolveChartShape } from './chartRegions.js'
import { createAwakenedTradeRequest } from './awakenedTrade.js'
import { createPseudoStats } from './pseudo.js'
import {
  PRICE_CHECK_CLASSIC_INFLUENCES,
  PRICE_CHECK_STATE_FILTERS,
  createPriceCheckStateFilters,
  resolvePriceCheckCategory,
  sanitizePriceCheckStateFilters
} from '../../../shared/priceCheckMetadata.js'
import {
  matchesUniqueModifier,
  safeUniqueItemImageId,
  uniqueItemImageUrl
} from './uniqueItemSnapshot.js'

const NON_UNIQUE_RARITIES = new Set(['普通', '魔法', '稀有'])
const MERCENARY_WARRANT_DISCRIMINATOR = 'mercenary_warrant'
const IDENTITY_DISCRIMINATORS = new Set(['map', 'chart', MERCENARY_WARRANT_DISCRIMINATOR])
const CLASSIC_INFLUENCE_STAT_IDS = new Set(PRICE_CHECK_CLASSIC_INFLUENCES.map(({ statId }) => statId))
const catalogStatRefIndexes = new WeakMap()

const safeText = (value, max = 180) => String(value || '').trim().slice(0, max)
const tradeStatText = (value) => String(value || '')
  .replace(/\s*[—–]\s*数值不可调整\s*$/, '')
  .trim()

function discriminatorForCategory(officialCategory) {
  const category = officialCategory?.category
  return IDENTITY_DISCRIMINATORS.has(category) ? category : undefined
}

function resolveNonUniqueBaseType(item, catalog) {
  const fallback = safeText(item.baseName || item.name)
  if (item.baseName || item.rarity?.replace(/\s/g, '') === '传奇') return fallback

  const fullName = safeText(item.name)
  if (!fullName) return fallback
  const candidates = new Set()
  for (const entry of catalog?.items || []) {
    if (entry?.unique === true) continue
    const baseType = safeText(entry?.baseType || entry?.type)
    if (baseType && fullName.endsWith(baseType)) candidates.add(baseType)
  }
  if (!candidates.size) return fallback

  const longestLength = Math.max(...[...candidates].map((baseType) => baseType.length))
  const longest = [...candidates].filter((baseType) => baseType.length === longestLength)
  return longest.length === 1 ? longest[0] : fallback
}

function resolveMercenaryWarrantIdentity(item, catalog) {
  if (safeText(item?.category) !== '地图碎片' || safeText(item?.name) !== '佣兵凭证' || !item?.mercenary) return null
  const build = safeText(item.mercenary.build)
  const displayText = `佣兵凭证（${build}）`
  const matches = (catalog?.items || []).filter((entry) => (
    entry?.discriminator === MERCENARY_WARRANT_DISCRIMINATOR &&
    safeText(entry.text) === displayText &&
    safeText(entry.baseType || entry.type)
  ))
  if (matches.length !== 1) {
    throw new Error(matches.length
      ? `国服交易目录中的佣兵构建“${build || '未知'}”存在歧义`
      : `国服交易目录中没有佣兵构建“${build || '未知'}”`)
  }
  return {
    build,
    displayText,
    type: safeText(matches[0].baseType || matches[0].type)
  }
}

function createMercenarySkillGroups(item, catalog) {
  return (item?.mercenary?.skills || []).map((group, groupIndex) => {
    const skillText = safeText(group.name)
    const skillMatch = resolveCatalogStat(catalog, skillText, 'mercenary').match
    if (!skillMatch?.id?.startsWith('mercenary.skill_')) {
      throw new Error(`国服交易目录无法识别佣兵主动技能“${skillText || '未知'}”`)
    }
    const key = `mercenary-group:${groupIndex}:${skillMatch.id}`
    const supports = (group.supports || []).map((support, supportIndex) => {
      const name = safeText(support.name || support.text)
      const tier = Number.isInteger(Number(support.tier)) && Number(support.tier) > 0 ? Number(support.tier) : null
      const lookupText = tier ? `${name} （等阶 ${tier}）` : name
      const supportMatch = resolveCatalogStat(catalog, lookupText, 'mercenary').match
      if (!supportMatch?.id?.startsWith('mercenary.support_')) {
        throw new Error(`国服交易目录无法识别佣兵辅助技能“${safeText(support.text) || lookupText || '未知'}”`)
      }
      return {
        key: `${key}:support:${supportIndex}:${supportMatch.id}`,
        id: supportMatch.id,
        type: 'mercenary',
        text: safeText(support.text) || lookupText,
        name,
        tier,
        enabled: false
      }
    })
    return {
      key,
      enabled: false,
      skill: {
        key: `${key}:skill`,
        id: skillMatch.id,
        type: 'mercenary',
        text: skillText,
        name: skillText
      },
      supports
    }
  })
}

function resolveUniqueModifierSnapshot(item, catalog, baseType) {
  if (item?.isUnidentified || item?.rarity?.replace(/\s/g, '') !== '传奇') return null
  const name = safeText(item.name)
  const type = safeText(baseType)
  if (!name || !type) return null
  const snapshot = (catalog?.items || []).find((entry) => (
    entry?.unique === true &&
    entry?.uniqueSnapshotCovered === true &&
    safeText(entry.name) === name &&
    safeText(entry.baseType || entry.type) === type &&
    Array.isArray(entry.uniqueModifierMatchers)
  ))
  return snapshot ? { matchers: snapshot.uniqueModifierMatchers } : null
}

const normalizeValueMultiplier = (value) => value === -1 ? -1 : 1

function multiplierForMergedValues(values, fallback = 1) {
  const finite = (values || []).filter(Number.isFinite)
  if (!finite.length) return normalizeValueMultiplier(fallback)
  const value = Math.min(...finite)
  if (value < 0) return -1
  if (value > 0) return 1
  return normalizeValueMultiplier(fallback)
}

function originalValueBounds(values) {
  const finite = (values || []).filter(Number.isFinite)
  if (!finite.length) return { min: undefined, max: undefined }
  const boundary = Math.min(...finite.map(Math.abs))
  return multiplierForMergedValues(finite) === -1
    ? { min: undefined, max: boundary }
    : { min: boundary, max: undefined }
}

function tradeStatType(type) {
  if (type === 'prefix' || type === 'suffix' || type === 'unique') return 'explicit'
  if (type === 'base') return 'implicit'
  return type
}

const PROPERTY_DEFINITIONS = Object.freeze([
  ['totalDps', '总 DPS', 'weapon.dps'],
  ['physicalDps', '物理 DPS', 'weapon.pdps'],
  ['elementalDps', '元素 DPS', 'weapon.edps'],
  ['criticalStrikeChance', '暴击率', 'weapon.crit'],
  ['attacksPerSecond', '攻击速度', 'weapon.aps'],
  ['armour', '护甲', 'armour.armour'],
  ['evasion', '闪避', 'armour.evasion'],
  ['energyShield', '能量护盾', 'armour.energyShield'],
  ['baseDefencePercentile', '虚化', 'armour.baseDefencePercentile'],
  ['ward', '结界', 'armour.ward'],
  ['block', '格挡', 'armour.block'],
  ['level', '物品等级', 'misc.itemLevel'],
  ['quality', '品质', 'misc.quality'],
  ['links', '连接数', 'socket.links'],
  ['gemLevel', '宝石等级', 'misc.gemLevel'],
  ['mapTier', '地图阶级', 'map.tier'],
  ['itemQuantity', '物品数量', 'map.iiq'],
  ['itemRarity', '物品稀有度', 'map.iir'],
  ['monsterPackSize', '怪群', 'map.packSize'],
  ['areaLevel', '区域等级', 'map.areaLevel'],
  ['deadmanSulphur', '亡者硫磺', 'map.sulphur'],
  ['memoryLevel', '回忆束丝', 'misc.memoryLevel']
])
const PROPERTY_IDS = new Set([...PROPERTY_DEFINITIONS.map(([, , id]) => id), 'map.shape'])
const OPTION_VALUES = Object.freeze({
  status: new Set(['available', 'instant', 'any']),
  listed: new Set(['any', '1day', '3days', '1week', '2weeks', '1month', '2months']),
  currency: new Set(['any', 'chaos', 'divine', 'chaos_divine']),
  initialSelection: new Set(['auto', 'all', 'none'])
})
const safeNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(-1_000_000_000, Math.min(1_000_000_000, number)) : undefined
}
const safeDisplayBoundary = (value) => {
  if (value == null || value === '' || typeof value === 'boolean') return undefined
  const number = safeNumber(value)
  return number === undefined ? undefined : Math.abs(number)
}

export function sanitizePriceCheckOptions(value = {}) {
  return {
    status: OPTION_VALUES.status.has(value.status) ? value.status : 'available',
    listed: OPTION_VALUES.listed.has(value.listed) ? value.listed : 'any',
    currency: OPTION_VALUES.currency.has(value.currency) ? value.currency : 'any',
    collapseListings: value.collapseListings === true,
    initialSelection: OPTION_VALUES.initialSelection.has(value.initialSelection) ? value.initialSelection : 'auto',
    manualDcRate: Number.isFinite(Number(value.manualDcRate))
      ? Math.min(1_000_000, Math.max(0, Number(value.manualDcRate)))
      : 0
  }
}

export function mergeStatIntoList(stats, stat) {
  const existing = stats.find((entry) => `${entry.type}\u0000${entry.id}` === `${stat.type}\u0000${stat.id}`)
  if (!existing) {
    stats.push({ ...stat, key: `${stat.type}:${stat.id}`, valueMultiplier: normalizeValueMultiplier(stat.valueMultiplier) })
    return stats.at(-1)
  }
  existing.sources.push(...(stat.sources || []))
  existing.refs = [...new Set([...(existing.refs || []), ...(stat.refs || [])])]
  existing.ref = existing.refs.length === 1 ? existing.refs[0] : null
  const mergeValue = existing.merge === 'max'
    ? (left, right) => Math.max(left ?? -Infinity, right ?? -Infinity)
    : (left, right) => (left || 0) + (right || 0)
  existing.values = Array.from(
    { length: Math.max(existing.values.length, stat.values.length) },
    (_, index) => mergeValue(existing.values[index], stat.values[index])
  )
  const previousMultiplier = normalizeValueMultiplier(existing.valueMultiplier)
  const nextMultiplier = multiplierForMergedValues(existing.values, previousMultiplier)
  if (nextMultiplier !== previousMultiplier && normalizeValueMultiplier(stat.valueMultiplier) === nextMultiplier) {
    existing.label = stat.label
    existing.text = stat.text
    existing.tier = stat.tier
    existing.tags = stat.tags
  }
  existing.valueMultiplier = nextMultiplier
  Object.assign(existing, originalValueBounds(existing.values))
  existing.enabled ||= stat.enabled
  return existing
}

export function refreshPseudoStats(model, catalog, options = {}) {
  const rawStats = (model.stats || []).filter((stat) => stat.type !== 'pseudo')
  const influenceStats = (model.stats || []).filter((stat) => CLASSIC_INFLUENCE_STAT_IDS.has(stat.id))
  const previous = new Map((model.stats || []).filter((stat) => stat.type === 'pseudo').map((stat) => [stat.id, stat]))
  const generated = createPseudoStats(rawStats, catalog, options, originalValueBounds)
  for (const stat of generated.stats) {
    const existing = previous.get(stat.id)
    if (!existing) continue
    stat.enabled = existing.enabled
    stat.min = existing.min
    stat.max = existing.max
  }
  const absorbedKeys = new Set(generated.stats
    .filter((stat) => stat.enabled)
    .flatMap((stat) => stat.sources.map(({ key }) => key)))
  for (const stat of rawStats) {
    if (absorbedKeys.has(stat.key)) stat.enabled = false
  }
  model.stats = [...generated.stats, ...influenceStats, ...rawStats]
  return model
}

export function createPriceCheckModel(item, catalog, options = {}) {
  if (!item?.rarity || (!item.name && !item.baseName)) throw new Error('剪贴板中没有可识别的国服物品')
  const rarity = item.rarity.replace(/\s/g, '')
  const category = safeText(item.category)
  const officialCategory = resolvePriceCheckCategory(category)
  const mercenaryWarrant = resolveMercenaryWarrantIdentity(item, catalog)
  const identityDiscriminator = mercenaryWarrant?.type
    ? MERCENARY_WARRANT_DISCRIMINATOR
    : discriminatorForCategory(officialCategory)
  const isMap = officialCategory?.category === 'map'
  const isChart = officialCategory?.category === 'chart'
  const chartRegion = isChart ? resolveChartRegion(catalog, item.areaName) : null
  if (isChart && !chartRegion) {
    throw new Error(`无法识别海图区域“${safeText(item.areaName) || '未知'}”，已阻止按物理底材误查`)
  }
  const fixedIdentity = rarity === '传奇' && (!isMap || !item.isUnidentified) ? item.name : ''
  const baseType = mercenaryWarrant?.type || (isChart
    ? chartRegion.type
    : (isMap ? '地图' : resolveNonUniqueBaseType(item, catalog)))
  const isClusterJewel = /^(?:大型|中型|小型)星团珠宝$/.test(baseType)
  const uniqueModifierSnapshot = resolveUniqueModifierSnapshot(item, catalog, baseType)
  const stats = []
  const unknownStats = []
  const modifiers = [...(item.modifiers || [])]
  const detailedLines = new Set(modifiers.flatMap((modifier) => modifier.lines || [modifier.text]).filter(Boolean))
  const addStandalone = (values, type) => {
    for (const text of values || []) {
      if (text && !detailedLines.has(text)) modifiers.push({ type, text })
    }
  }
  addStandalone(item.implicitMods, 'implicit')
  addStandalone(item.explicitMods, 'explicit')
  addStandalone(item.craftedMods, 'crafted')
  for (const modifier of modifiers) {
    const type = tradeStatType(modifier.type)
    const lines = Array.isArray(modifier.lines) ? modifier.lines.filter(Boolean) : []
    const text = modifier.text || lines.join('\n') || ''
    const context = {
      category,
      name: modifier.name,
      tags: modifier.tags,
      affixType: modifier.affixType || modifier.type,
      localItem: Boolean(
        Number(item.attacksPerSecond) || Number(item.armour) || Number(item.evasion) ||
        Number(item.energyShield) || Number(item.ward) || Number(item.block) ||
        /(?:弓|剑|斧|锤|权杖|法杖|匕首|爪|长杖|战杖|钓竿|胸甲|头盔|手套|鞋子|盾|药剂)/.test(category)
      )
    }
    // The official veiled namespace is keyed by the hidden modifier name
    // (for example “艾尔雷恩的影匿”), not by the placeholder line “影匿前缀”.
    const resolutionText = type === 'veiled' && modifier.name ? modifier.name : text
    const combinedResolution = resolveCatalogStat(catalog, tradeStatText(resolutionText), type, context)
    const effects = combinedResolution.match || combinedResolution.candidates.length
      ? [{ text, resolution: combinedResolution }]
      : (lines.length > 1 ? lines : [text]).map((effectText) => ({
          text: effectText,
          resolution: resolveCatalogStat(catalog, tradeStatText(effectText), type, context)
        }))
    const isUniquePropertyLine = modifier.type === 'unique' || (
      rarity === '传奇' && modifier.type === 'explicit'
    )
    for (const effect of effects) {
      const match = effect.resolution.match
      if (!match) {
        if (
          isUniquePropertyLine &&
          effect.resolution.reason === 'not-found' &&
          effect.resolution.candidates.length === 0 &&
          uniqueModifierSnapshot &&
          !matchesUniqueModifier(tradeStatText(effect.text), uniqueModifierSnapshot.matchers)
        ) continue
        if (effect.text) unknownStats.push({
          key: `${type}:${unknownStats.length}:${effect.text}`,
          text: effect.text,
          type,
          tier: Number(modifier.tier) || null,
          tags: Array.isArray(modifier.tags) ? modifier.tags.map((tag) => safeText(tag, 40)).filter(Boolean) : [],
          reason: ({
            ambiguous: '存在多个官方候选，请选择正确词缀',
            'type-mismatch': '官方目录只有其他词缀类型，已阻止错查',
            'not-found': '官方交易目录没有对应过滤项'
          })[effect.resolution.reason] || '当前交易目录无法唯一映射',
          candidates: effect.resolution.candidates.map((candidate) => ({
            id: candidate.id,
            label: candidate.label,
            matcher: candidate.matcher,
            type: candidate.type,
            refs: [...(candidate.refs || [])],
            ref: candidate.ref,
            categories: candidate.categories,
            values: candidate.values,
            valueMultiplier: candidate.valueMultiplier,
            merge: candidate.merge,
            ...originalValueBounds(candidate.values)
          }))
        })
        continue
      }
      stats.push({
        key: `${match.id}:${stats.length}`,
        id: match.id,
        label: modifier.name || match.label || effect.text,
        text: effect.text,
        type,
        refs: [...(match.refs || [])],
        ref: match.ref,
        tier: Number(modifier.tier) || null,
        tags: Array.isArray(modifier.tags) ? modifier.tags.map((tag) => safeText(tag, 40)).filter(Boolean) : [],
        values: match.values,
        valueMultiplier: match.valueMultiplier,
        merge: match.merge,
        sources: [{
          key: `${match.id}:${stats.length}`,
          id: match.id,
          type,
          text: effect.text,
          name: modifier.name || '',
          values: match.values,
          valueMultiplier: match.valueMultiplier,
          refs: [...(match.refs || [])],
          ref: match.ref
        }],
        enabled: options.initialSelection === 'all' || (
          (options.initialSelection || 'auto') === 'auto' &&
          ((isMap || isChart)
            ? ['base', 'implicit'].includes(modifier.type)
            : ((isClusterJewel && modifier.type === 'enchant') || modifier.type === 'fractured' || (
            ['prefix', 'suffix'].includes(modifier.type) &&
            Number(modifier.tier) > 0 &&
            Number(modifier.tier) <= 2
          )))
        ),
        ...originalValueBounds(match.values)
      })
    }
  }
  const mergedStats = []
  for (const stat of stats) mergeStatIntoList(mergedStats, stat)
  const categoryPropertyIds = isMap
    ? new Set(['map.tier', 'map.iiq', 'map.iir', 'map.packSize', 'misc.itemLevel'])
    : (isChart
        ? new Set(['map.iiq', 'map.iir', 'map.packSize', 'map.areaLevel', 'map.sulphur', 'misc.itemLevel'])
        : null)
  const defaultPropertyIds = isMap
    ? new Set(['map.tier'])
    : (isChart ? new Set(['map.areaLevel', 'map.sulphur', 'misc.itemLevel']) : new Set())
  const properties = PROPERTY_DEFINITIONS.map(([field, label, id]) => {
    if (categoryPropertyIds && !categoryPropertyIds.has(id)) return null
    if ((isMap || isChart) && id === 'misc.itemLevel') label = '物等'
    const rawValue = Number(item[field])
    const isMemoryLevel = id === 'misc.memoryLevel'
    const hasValue = isMemoryLevel
      ? item[field] != null && item[field] !== '' && Number.isFinite(rawValue) && rawValue >= 0
      : rawValue > 0
    const value = Number.isFinite(rawValue) ? rawValue : 0
    return hasValue
      ? {
          id,
          label,
          value,
          enabled: isMemoryLevel || defaultPropertyIds.has(id),
          min: value,
          max: defaultPropertyIds.has(id) ? value : undefined
        }
      : null
  }).filter(Boolean)
  if (isChart && item.chartShape) {
    const shape = resolveChartShape(item.chartShape)
    if (!shape) throw new Error(`无法识别海图形状“${safeText(item.chartShape)}”`)
    properties.push({
      id: 'map.shape',
      label: '海图形状',
      value: shape.id,
      displayValue: shape.label,
      options: CHART_SHAPES.map(({ id, label }) => ({ id, label })),
      enabled: false
    })
  }
  if (mercenaryWarrant && Number(item.mercenary.level) > 0) {
    const level = Number(item.mercenary.level)
    properties.push({
      id: 'misc.itemLevel',
      label: '佣兵等级',
      value: level,
      enabled: false,
      min: level,
      max: undefined
    })
  }
  const mercenarySkillGroups = mercenaryWarrant ? createMercenarySkillGroups(item, catalog) : []
  const facts = {
    identified: !item.isUnidentified,
    corrupted: Boolean(item.isCorrupted),
    mirrored: Boolean(item.isMirrored),
    fractured: Boolean(item.isFractured),
    split: Boolean(item.isSplit),
    mutated: Boolean(item.isMutated),
    synthesised: item.influences?.includes('synthesised') === true,
    searing: item.influences?.includes('searing-exarch') === true,
    tangled: item.influences?.includes('eater-of-worlds') === true,
    crafted: modifiers.some((modifier) => modifier.type === 'crafted'),
    veiled: modifiers.some((modifier) => modifier.type === 'veiled')
  }
  const model = {
    item: {
      category,
      rarity,
      name: safeText(item.name),
      baseType: safeText(mercenaryWarrant ? '佣兵凭证' : (isChart ? item.baseName : baseType)),
      mercenaryBuild: mercenaryWarrant?.build || '',
      itemLevel: Number(item.level) || 0,
      gemLevel: Number(item.gemLevel) || 0,
      quality: Number(item.quality) || 0,
      links: Number(item.links) || 0,
      mapTier: Number(item.mapTier) || 0,
      itemQuantity: Number(item.itemQuantity) || 0,
      itemRarity: Number(item.itemRarity) || 0,
      monsterPackSize: Number(item.monsterPackSize) || 0,
      areaLevel: Number(item.areaLevel) || 0,
      areaName: safeText(item.areaName),
      chartShape: safeText(item.chartShape),
      deadmanSulphur: Number(item.deadmanSulphur) || 0,
      memoryLevel: item.memoryLevel == null ? null : Math.max(0, Number(item.memoryLevel) || 0),
      influences: PRICE_CHECK_CLASSIC_INFLUENCES
        .filter(({ key }) => item.influences?.includes(key))
        .map(({ key }) => key),
      corrupted: Boolean(item.isCorrupted),
      unidentified: Boolean(item.isUnidentified),
      mirrored: Boolean(item.isMirrored),
      split: Boolean(item.isSplit),
      fractured: Boolean(item.isFractured)
    },
    identity: {
      name: fixedIdentity,
      type: baseType,
      ...(mercenaryWarrant
        ? { displayName: mercenaryWarrant.displayText }
        : (isChart ? { displayName: chartRegion.displayName } : {})),
      ...(identityDiscriminator ? { discriminator: identityDiscriminator } : {}),
      category: officialCategory?.category || '',
      categoryLabel: officialCategory?.categoryLabel || category,
      nameEnabled: true
    },
    flags: {
      corrupted: Boolean(item.isCorrupted),
      unidentified: Boolean(item.isUnidentified),
      mirrored: Boolean(item.isMirrored),
      split: Boolean(item.isSplit),
      fractured: Boolean(item.isFractured)
    },
    facts,
    stateFilters: createPriceCheckStateFilters(facts),
    properties,
    mercenarySkillGroups,
    stats: mergedStats,
    unknownStats
  }
  model.information = [
    ['moreMaps', '更多地图'],
    ['moreScarabs', '更多圣甲虫'],
    ['moreCurrency', '更多通货']
  ].map(([field, label]) => Number(item[field]) > 0
    ? { id: field, label, value: Number(item[field]), suffix: '%' }
    : null).filter(Boolean)
  refreshPseudoStats(model, catalog, options)
  model.stats.push(...createClassicInfluenceStats(item.influences, catalog))
  return resolveUnidentifiedUnique(model, catalog)
}

export function resolveUnidentifiedUnique(model, catalog) {
  if (model?.item?.rarity !== '传奇' || !model.item.unidentified) return model
  if (model.identity?.category === 'map') {
    model.identity = { ...model.identity, name: '', type: '地图', discriminator: 'map', nameEnabled: true }
    model.identityResolution = { required: false, baseType: '地图', candidates: [] }
    return model
  }
  const baseType = safeText(model.identity?.type || model.item.baseType)
  const candidates = []
  const seen = new Set()
  for (const entry of catalog?.items || []) {
    const entryBase = safeText(entry.baseType || entry.type)
    const name = safeText(entry.name)
    if (entry.unique !== true || entryBase !== baseType || !name) continue
    const key = `${name}\u0000${entryBase}`
    if (seen.has(key)) continue
    seen.add(key)
    const imageId = safeUniqueItemImageId(entry.imageId)
    candidates.push({
      key,
      name,
      baseType: entryBase,
      legacy: entry.legacy === true,
      imageId,
      imageUrl: uniqueItemImageUrl(imageId)
    })
  }
  candidates.sort((a, b) => Number(a.legacy) - Number(b.legacy) || a.name.localeCompare(b.name, 'zh-CN'))
  if (candidates.length === 1) {
    model.identity = {
      ...model.identity,
      name: candidates[0].name,
      type: candidates[0].baseType,
      nameEnabled: true
    }
    model.identityResolution = { required: false, baseType, candidates }
  } else {
    model.identity = { ...model.identity, name: '', type: baseType, nameEnabled: true }
    model.identityResolution = {
      required: true,
      baseType,
      candidates,
      message: candidates.length ? '请选择这件未鉴定传奇的实际名称' : '官方交易目录中没有找到该底材的传奇候选'
    }
  }
  return model
}

export function buildOfficialTradeQuery(model, options = {}) {
  if (!model?.item || !model?.identity) throw new Error('查价模型无效')
  if (model.identityResolution?.required) throw new Error(model.identityResolution.message || '请先选择未鉴定传奇名称')
  const category = safeText(model.item.category)
  const officialCategory = resolvePriceCheckCategory(category)
  const nameEnabled = model.identity.nameEnabled !== false
  if (!nameEnabled && !officialCategory) throw new Error('物品大类无法识别，不能取消具体名称')
  const isGem = category.includes('宝石')
  const isFlask = category.includes('药剂') || category.includes('酊剂')
  const stateFilters = sanitizePriceCheckStateFilters(model.stateFilters, model.facts)
  const filters = {
    trade: {
      offline: options.status === 'any',
      merchantOnly: options.status === 'instant',
      currency: options.currency && options.currency !== 'any' ? safeText(options.currency, 24) : undefined,
      listed: options.listed && options.listed !== 'any' ? safeText(options.listed, 24) : undefined,
      collapse: options.collapseListings === true
    },
    name: nameEnabled && model.identity.name ? safeText(model.identity.name) : undefined,
    baseType: nameEnabled && model.identity.type ? safeText(model.identity.type) : undefined,
    discriminator: IDENTITY_DISCRIMINATORS.has(model.identity.discriminator)
      ? model.identity.discriminator
      : discriminatorForCategory(officialCategory),
    category: officialCategory?.category,
    rarity: model.item.rarity === '传奇' && IDENTITY_DISCRIMINATORS.has(officialCategory?.category)
      ? 'unique'
      : (NON_UNIQUE_RARITIES.has(model.item.rarity) ? 'nonunique' : undefined),
    stateFilters: Object.fromEntries(PRICE_CHECK_STATE_FILTERS.map(({ key, officialKey }) => [officialKey, stateFilters[key]])),
    gemLevel: isGem && model.item.gemLevel >= 20 ? model.item.gemLevel : undefined,
    quality: (
      (isGem && model.item.quality >= 16) ||
      (isFlask && model.item.quality > 20) ||
      (options.exact && model.item.quality > 20)
    ) ? model.item.quality : undefined,
    itemLevel: options.exact && model.item.itemLevel > 0 && !model.identity.name
      ? Math.min(model.item.itemLevel, 86)
      : undefined,
    linkedSockets: model.item.links > 0 ? model.item.links : undefined
  }
  for (const property of model.properties || []) {
    if (!property.enabled || !PROPERTY_IDS.has(property.id)) continue
    const [group, field] = property.id.split('.')
    filters[group] ||= {}
    if (property.id === 'misc.memoryLevel') {
      const min = Number(property.min)
      const max = Number(property.max)
      const safeMin = Number.isFinite(min) && min >= 0 ? min : undefined
      const safeMax = Number.isFinite(max) && max >= 0 && (safeMin === undefined || max >= safeMin) ? max : undefined
      filters[group][field] = { min: safeMin, max: safeMax }
      continue
    }
    filters[group][field] = property.id === 'map.shape'
      ? { option: safeText(property.value, 8) }
      : {
          min: Number.isFinite(Number(property.min)) ? Number(property.min) : undefined,
          max: Number.isFinite(Number(property.max)) ? Number(property.max) : undefined
        }
  }
  return createAwakenedTradeRequest(filters, model.stats || [], model.mercenarySkillGroups || [])
}

function catalogHasStat(catalog, id, type) {
  if (!catalog) return true
  return (catalog.stats || []).some((entry) => {
    const value = entry.ids?.[type]
    return (Array.isArray(value) ? value : [value]).includes(id)
  })
}

function catalogRefsForStat(catalog, id, type) {
  if (!catalog) return null
  let index = catalogStatRefIndexes.get(catalog)
  if (!index) {
    index = new Map()
    for (const entry of catalog.stats || []) {
      for (const [entryType, value] of Object.entries(entry.ids || {})) {
        for (const entryId of Array.isArray(value) ? value : [value]) {
          index.set(`${entryType}\u0000${entryId}`, [...(entry.refs || [])])
        }
      }
    }
    catalogStatRefIndexes.set(catalog, index)
  }
  return [...(index.get(`${type}\u0000${id}`) || [])]
}

function createClassicInfluenceStats(influences, catalog) {
  const values = new Set(Array.isArray(influences) ? influences : [])
  return PRICE_CHECK_CLASSIC_INFLUENCES
    .filter(({ key, statId }) => values.has(key) && catalogHasStat(catalog, statId, 'pseudo'))
    .map(({ key, label, statId }) => {
      const refs = catalogRefsForStat(catalog, statId, 'pseudo') || []
      return {
        key: `influence:${key}`,
        id: statId,
        label,
        text: label,
        type: 'pseudo',
        refs,
        ref: refs.length === 1 ? refs[0] : null,
        tier: null,
        tags: [],
        enabled: true,
        values: [],
        valueMultiplier: 1,
        sources: []
      }
    })
}

function sanitizeMercenarySkillGroups(value, catalog, trustedModel) {
  const submittedGroups = new Map((Array.isArray(value?.mercenarySkillGroups) ? value.mercenarySkillGroups : [])
    .slice(0, 32)
    .map((group) => [safeText(group?.key, 160), group]))
  if (trustedModel) {
    return (trustedModel.mercenarySkillGroups || []).map((trustedGroup) => {
      const submitted = submittedGroups.get(trustedGroup.key)
      const submittedSupports = new Map((Array.isArray(submitted?.supports) ? submitted.supports : [])
        .map((support) => [safeText(support?.key, 200), support]))
      return {
        ...structuredClone(trustedGroup),
        enabled: submitted?.enabled === true,
        supports: trustedGroup.supports.map((support) => ({
          ...structuredClone(support),
          enabled: submittedSupports.get(support.key)?.enabled === true
        }))
      }
    })
  }
  return [...submittedGroups.values()].map((group) => {
    const skill = group?.skill
    const skillId = safeText(skill?.id, 80)
    if (!skillId.startsWith('mercenary.skill_') || !catalogHasStat(catalog, skillId, 'mercenary')) return null
    return {
      key: safeText(group.key, 160),
      enabled: group.enabled === true,
      skill: {
        key: safeText(skill.key, 200),
        id: skillId,
        type: 'mercenary',
        text: safeText(skill.text, 160),
        name: safeText(skill.name, 120)
      },
      supports: (Array.isArray(group.supports) ? group.supports : []).slice(0, 32).map((support) => {
        const id = safeText(support?.id, 80)
        if (!id.startsWith('mercenary.support_') || !catalogHasStat(catalog, id, 'mercenary')) return null
        return {
          key: safeText(support.key, 200),
          id,
          type: 'mercenary',
          text: safeText(support.text, 160),
          name: safeText(support.name, 120),
          tier: Number.isInteger(Number(support.tier)) && Number(support.tier) > 0 ? Number(support.tier) : null,
          enabled: support.enabled === true
        }
      }).filter(Boolean)
    }
  }).filter(Boolean)
}

export function sanitizePriceCheckModel(value, catalog = null, trustedFacts = null, trustedCategory = null, trustedModel = null) {
  if (!value || typeof value !== 'object') throw new Error('查价请求无效')
  let stats = Array.isArray(value.stats) ? value.stats.slice(0, 24).map((stat) => {
    const id = safeText(stat.id, 80)
    const type = safeText(stat.type, 24)
    const refs = catalogRefsForStat(catalog, id, type) ?? (
      Array.isArray(stat.refs) ? stat.refs.slice(0, 12).map((ref) => safeText(ref, 180)).filter(Boolean) : []
    )
    const values = Array.isArray(stat.values) ? stat.values.slice(0, 8).map(safeNumber).filter(Number.isFinite) : []
    const valueMultiplier = multiplierForMergedValues(values, stat.valueMultiplier)
    return {
      key: safeText(stat.key, 120),
      id,
      label: safeText(stat.label),
      text: safeText(stat.text, 500),
      type,
      refs,
      ref: refs.length === 1 ? refs[0] : null,
      tier: Number.isInteger(Number(stat.tier)) && Number(stat.tier) > 0 ? Number(stat.tier) : null,
      tags: Array.isArray(stat.tags) ? stat.tags.slice(0, 12).map((tag) => safeText(tag, 40)).filter(Boolean) : [],
      enabled: Boolean(stat.enabled),
      values,
      valueMultiplier,
      min: safeDisplayBoundary(stat.min),
      max: safeDisplayBoundary(stat.max),
      sources: Array.isArray(stat.sources)
        ? stat.sources.slice(0, 48).map((source) => {
            const sourceId = safeText(source.id, 80)
            const sourceType = safeText(source.type, 24)
            const sourceRefs = catalogRefsForStat(catalog, sourceId, sourceType) ?? (
              Array.isArray(source.refs) ? source.refs.slice(0, 12).map((ref) => safeText(ref, 180)).filter(Boolean) : []
            )
            return {
              key: safeText(source.key, 120),
              id: sourceId,
              type: sourceType,
              text: safeText(source.text, 500),
              name: safeText(source.name, 120),
              refs: sourceRefs,
              ref: sourceRefs.length === 1 ? sourceRefs[0] : null,
              value: safeNumber(source.value),
              multiplier: safeNumber(source.multiplier),
              valueMultiplier: normalizeValueMultiplier(source.valueMultiplier),
              values: Array.isArray(source.values) ? source.values.slice(0, 8).map(safeNumber).filter(Number.isFinite) : []
            }
          })
        : []
    }
  }).filter((stat) => isTradeStatId(stat.id, stat.type) && catalogHasStat(catalog, stat.id, stat.type)) : []
  if (trustedModel) {
    const submittedInfluences = new Map(stats
      .filter((stat) => CLASSIC_INFLUENCE_STAT_IDS.has(stat.id))
      .map((stat) => [stat.id, stat]))
    const trustedInfluences = (trustedModel.stats || [])
      .filter((stat) => CLASSIC_INFLUENCE_STAT_IDS.has(stat.id) && catalogHasStat(catalog, stat.id, 'pseudo'))
      .map((stat) => ({
        ...stat,
        refs: [...(stat.refs || [])],
        sources: (stat.sources || []).map((source) => ({ ...source, refs: [...(source.refs || [])] })),
        enabled: submittedInfluences.get(stat.id)?.enabled === true,
        values: [],
        min: undefined,
        max: undefined
      }))
    stats = [
      ...stats.filter((stat) => !CLASSIC_INFLUENCE_STAT_IDS.has(stat.id)),
      ...trustedInfluences
    ]
  }
  const trustedProperties = new Map((trustedModel?.properties || []).map((property) => [property.id, property]))
  const properties = Array.isArray(value.properties) ? value.properties.slice(0, 24).map((property) => {
    const id = safeText(property.id, 48)
    const trusted = trustedModel ? trustedProperties.get(id) : null
    if (trustedModel && !trusted) return null
    const source = trusted || property
    let min = safeNumber(property.min)
    let max = safeNumber(property.max)
    if (id === 'misc.memoryLevel') {
      if (min !== undefined && min < 0) min = undefined
      if (max !== undefined && (max < 0 || (min !== undefined && max < min))) max = undefined
    }
    if (id === 'misc.itemLevel' && safeText(source.label) === '佣兵等级') {
      if (min !== undefined && (!Number.isInteger(min) || min < 1 || min > 100)) min = undefined
      if (max !== undefined && (!Number.isInteger(max) || max < 1 || max > 100 || (min !== undefined && max < min))) max = undefined
    }
    return {
      id,
      label: safeText(source.label, 80),
      value: id === 'map.shape'
        ? (CHART_SHAPES.some(({ id: shapeId }) => shapeId === String(source.value)) ? String(source.value) : '')
        : (safeNumber(source.value) || 0),
      displayValue: safeText(source.displayValue, 40),
      options: id === 'map.shape' ? CHART_SHAPES.map(({ id, label }) => ({ id, label })) : undefined,
      enabled: Boolean(property.enabled),
      min,
      max
    }
  }).filter((property) => property && PROPERTY_IDS.has(property.id) && (property.id !== 'map.shape' || property.value)) : []
  const legacyFlags = Object.fromEntries(
    ['corrupted', 'unidentified', 'mirrored', 'split', 'fractured']
      .map((key) => [key, Boolean(value.flags?.[key] ?? value.item?.[key])])
  )
  const fallbackFacts = {
    identified: !legacyFlags.unidentified,
    corrupted: legacyFlags.corrupted,
    mirrored: legacyFlags.mirrored,
    fractured: legacyFlags.fractured,
    split: legacyFlags.split,
    mutated: false,
    synthesised: false,
    searing: false,
    tangled: false,
    crafted: false,
    veiled: false
  }
  const facts = Object.fromEntries(PRICE_CHECK_STATE_FILTERS.map(({ key }) => [
    key,
    Boolean(trustedFacts?.[key] ?? value.facts?.[key] ?? fallbackFacts[key])
  ]))
  const flags = { ...legacyFlags, ...facts, unidentified: !facts.identified }
  const sourceCategory = safeText(trustedCategory ?? value.item?.category)
  const officialCategory = resolvePriceCheckCategory(sourceCategory)
  const trustedDiscriminator = safeText(trustedModel?.identity?.discriminator, 40)
  const submittedDiscriminator = safeText(value.identity?.discriminator, 40)
  const discriminator = trustedDiscriminator === MERCENARY_WARRANT_DISCRIMINATOR
    ? trustedDiscriminator
    : (submittedDiscriminator === MERCENARY_WARRANT_DISCRIMINATOR && sourceCategory === '地图碎片'
        ? submittedDiscriminator
        : discriminatorForCategory(officialCategory))
  const name = safeText(trustedModel?.identity?.name ?? value.identity?.name)
  const nameEnabled = value.identity?.nameEnabled === false && officialCategory ? false : true
  const mercenarySkillGroups = sanitizeMercenarySkillGroups(value, catalog, trustedModel)
  return {
    item: { ...(value.item || {}), ...(trustedModel?.item || {}), category: sourceCategory, ...flags },
    identity: {
      name,
      type: safeText(trustedModel?.identity?.type ?? value.identity?.type),
      ...((trustedModel?.identity?.displayName ?? value.identity?.displayName)
        ? { displayName: safeText(trustedModel?.identity?.displayName ?? value.identity?.displayName) }
        : {}),
      ...(discriminator ? { discriminator } : {}),
      category: officialCategory?.category || '',
      categoryLabel: officialCategory?.categoryLabel || sourceCategory,
      nameEnabled
    },
    identityResolution: value.identityResolution && typeof value.identityResolution === 'object'
      ? {
          required: Boolean(value.identityResolution.required),
          baseType: safeText(value.identityResolution.baseType),
          message: safeText(value.identityResolution.message),
          candidates: Array.isArray(value.identityResolution.candidates)
            ? value.identityResolution.candidates.slice(0, 100).map((candidate) => ({
                key: safeText(candidate.key, 400),
                name: safeText(candidate.name),
                baseType: safeText(candidate.baseType),
                legacy: candidate.legacy === true,
                imageId: safeUniqueItemImageId(candidate.imageId),
                imageUrl: uniqueItemImageUrl(safeUniqueItemImageId(candidate.imageId))
              })).filter((candidate) => candidate.key && candidate.name && candidate.baseType)
            : []
        }
      : undefined,
    flags,
    facts,
    stateFilters: sanitizePriceCheckStateFilters(value.stateFilters, facts),
    properties,
    mercenarySkillGroups,
    information: Array.isArray(value.information) ? value.information.slice(0, 12).map((entry) => ({
      id: safeText(entry.id, 48),
      label: safeText(entry.label, 80),
      value: safeNumber(entry.value) || 0,
      suffix: safeText(entry.suffix, 8)
    })).filter((entry) => ['moreMaps', 'moreScarabs', 'moreCurrency'].includes(entry.id)) : [],
    stats,
    unknownStats: Array.isArray(value.unknownStats) ? value.unknownStats.slice(0, 24).map((unknown) => {
      const type = safeText(unknown.type, 24)
      return {
        key: safeText(unknown.key, 500),
        text: safeText(unknown.text, 500),
        type,
        tier: Number.isInteger(Number(unknown.tier)) && Number(unknown.tier) > 0 ? Number(unknown.tier) : null,
        tags: Array.isArray(unknown.tags) ? unknown.tags.slice(0, 12).map((tag) => safeText(tag, 40)).filter(Boolean) : [],
        reason: safeText(unknown.reason, 180),
        candidates: Array.isArray(unknown.candidates) ? unknown.candidates.slice(0, 20).map((candidate) => {
          const values = Array.isArray(candidate.values) ? candidate.values.slice(0, 8).map(safeNumber).filter(Number.isFinite) : []
          return {
            id: safeText(candidate.id, 80),
            label: safeText(candidate.label),
            matcher: safeText(candidate.matcher, 500),
            type: safeText(candidate.type, 24),
            refs: catalogRefsForStat(catalog, safeText(candidate.id, 80), safeText(candidate.type, 24)) ?? [],
            categories: Array.isArray(candidate.categories) ? candidate.categories.slice(0, 20).map((entry) => safeText(entry, 80)).filter(Boolean) : [],
            values,
            valueMultiplier: multiplierForMergedValues(values, candidate.valueMultiplier),
            merge: candidate.merge === 'max' || candidate.merge === 'sum' ? candidate.merge : undefined,
            min: safeDisplayBoundary(candidate.min),
            max: safeDisplayBoundary(candidate.max)
          }
        }).filter((candidate) => candidate.type === type && isTradeStatId(candidate.id, type) && catalogHasStat(catalog, candidate.id, type)) : []
      }
    }).filter((unknown) => unknown.text) : []
  }
}
