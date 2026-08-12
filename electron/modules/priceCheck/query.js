import { isTradeStatId, resolveCatalogStat } from './catalog.js'
import { createAwakenedTradeRequest } from './awakenedTrade.js'
import {
  safeUniqueItemImageId,
  uniqueItemImageUrl
} from './uniqueItemSnapshot.js'

const NON_UNIQUE_RARITIES = new Set(['普通', '魔法', '稀有'])

const safeText = (value, max = 180) => String(value || '').trim().slice(0, max)
const tradeStatText = (value) => String(value || '')
  .replace(/\s*[—–]\s*数值不可调整\s*$/, '')
  .trim()

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

function numericMinimum(values, range = 'down20') {
  if (!values?.length) return undefined
  if (range === 'unlimited') return undefined
  const factor = range === 'original' ? 1 : range === 'down10' ? 0.9 : 0.8
  return Math.floor(Math.min(...values) * factor * 100) / 100
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
  ['mapTier', '地图阶级', 'map.tier']
])
const PROPERTY_IDS = new Set(PROPERTY_DEFINITIONS.map(([, , id]) => id))
const OPTION_VALUES = Object.freeze({
  status: new Set(['available', 'instant', 'any']),
  listed: new Set(['any', '1day', '3days', '1week', '2weeks', '1month', '2months']),
  currency: new Set(['any', 'chaos', 'divine', 'chaos_divine']),
  valueRange: new Set(['original', 'down10', 'down20', 'unlimited']),
  initialSelection: new Set(['auto', 'all', 'none'])
})
const safeNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(-1_000_000_000, Math.min(1_000_000_000, number)) : undefined
}

export function sanitizePriceCheckOptions(value = {}) {
  return {
    status: OPTION_VALUES.status.has(value.status) ? value.status : 'available',
    listed: OPTION_VALUES.listed.has(value.listed) ? value.listed : 'any',
    currency: OPTION_VALUES.currency.has(value.currency) ? value.currency : 'any',
    collapseListings: value.collapseListings === true,
    valueRange: OPTION_VALUES.valueRange.has(value.valueRange) ? value.valueRange : 'down20',
    initialSelection: OPTION_VALUES.initialSelection.has(value.initialSelection) ? value.initialSelection : 'auto',
    manualDcRate: Number.isFinite(Number(value.manualDcRate))
      ? Math.min(1_000_000, Math.max(0, Number(value.manualDcRate)))
      : 0
  }
}

export function createPriceCheckModel(item, catalog, options = {}) {
  if (!item?.rarity || (!item.name && !item.baseName)) throw new Error('剪贴板中没有可识别的国服物品')
  const rarity = item.rarity.replace(/\s/g, '')
  const category = safeText(item.category)
  const fixedIdentity = rarity === '传奇' ? item.name : ''
  const baseType = resolveNonUniqueBaseType(item, catalog)
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
    for (const effect of effects) {
      const match = effect.resolution.match
      if (!match) {
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
            categories: candidate.categories,
            values: candidate.values,
            min: numericMinimum(candidate.values, options.valueRange),
            max: undefined
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
        tier: Number(modifier.tier) || null,
        tags: Array.isArray(modifier.tags) ? modifier.tags.map((tag) => safeText(tag, 40)).filter(Boolean) : [],
        values: match.values,
        merge: match.merge,
        sources: [{ text: effect.text, name: modifier.name || '', values: match.values }],
        enabled: options.initialSelection === 'all' || (
          (options.initialSelection || 'auto') === 'auto' &&
          (modifier.type === 'fractured' || (
            ['prefix', 'suffix'].includes(modifier.type) &&
            Number(modifier.tier) > 0 &&
            Number(modifier.tier) <= 2
          ))
        ),
        min: numericMinimum(match.values, options.valueRange),
        max: undefined
      })
    }
  }
  const mergedStats = []
  const mergedByIdentity = new Map()
  for (const stat of stats) {
    const identity = `${stat.type}\u0000${stat.id}`
    const existing = mergedByIdentity.get(identity)
    if (!existing) {
      stat.key = `${stat.type}:${stat.id}`
      mergedByIdentity.set(identity, stat)
      mergedStats.push(stat)
      continue
    }
    existing.sources.push(...stat.sources)
    const mergeValue = existing.merge === 'max'
      ? (left, right) => Math.max(left ?? -Infinity, right ?? -Infinity)
      : (left, right) => (left || 0) + (right || 0)
    existing.values = Array.from(
      { length: Math.max(existing.values.length, stat.values.length) },
      (_, index) => mergeValue(existing.values[index], stat.values[index])
    )
    existing.min = numericMinimum(existing.values, options.valueRange)
    existing.enabled ||= stat.enabled
  }
  const properties = PROPERTY_DEFINITIONS.map(([field, label, id]) => {
    const value = Number(item[field]) || 0
    return value > 0
      ? { id, label, value, enabled: false, min: numericMinimum([value], options.valueRange), max: undefined }
      : null
  }).filter(Boolean)
  const model = {
    item: {
      category,
      rarity,
      name: safeText(item.name),
      baseType: safeText(baseType),
      itemLevel: Number(item.level) || 0,
      gemLevel: Number(item.gemLevel) || 0,
      quality: Number(item.quality) || 0,
      links: Number(item.links) || 0,
      mapTier: Number(item.mapTier) || 0,
      corrupted: Boolean(item.isCorrupted),
      unidentified: Boolean(item.isUnidentified),
      mirrored: Boolean(item.isMirrored),
      split: Boolean(item.isSplit),
      fractured: Boolean(item.isFractured)
    },
    identity: { name: fixedIdentity, type: baseType },
    flags: {
      corrupted: Boolean(item.isCorrupted),
      unidentified: Boolean(item.isUnidentified),
      mirrored: Boolean(item.isMirrored),
      split: Boolean(item.isSplit),
      fractured: Boolean(item.isFractured)
    },
    properties,
    stats: mergedStats,
    unknownStats
  }
  return resolveUnidentifiedUnique(model, catalog)
}

export function resolveUnidentifiedUnique(model, catalog) {
  if (model?.item?.rarity !== '传奇' || !model.item.unidentified) return model
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
    model.identity = { name: candidates[0].name, type: candidates[0].baseType }
    model.identityResolution = { required: false, baseType, candidates }
  } else {
    model.identity = { name: '', type: baseType }
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
  const isGem = category.includes('宝石')
  const isFlask = category.includes('药剂') || category.includes('酊剂')
  const filters = {
    trade: {
      offline: options.status === 'any',
      merchantOnly: options.status === 'instant',
      currency: options.currency && options.currency !== 'any' ? safeText(options.currency, 24) : undefined,
      listed: options.listed && options.listed !== 'any' ? safeText(options.listed, 24) : undefined,
      collapse: options.collapseListings === true
    },
    name: model.identity.name ? safeText(model.identity.name) : undefined,
    baseType: model.identity.type ? safeText(model.identity.type) : undefined,
    rarity: NON_UNIQUE_RARITIES.has(model.item.rarity) ? 'nonunique' : undefined,
    corrupted: model.item.corrupted ? true : false,
    unidentified: model.item.unidentified,
    mirrored: model.item.mirrored,
    split: model.item.split,
    fractured: model.item.fractured,
    gemLevel: isGem && model.item.gemLevel >= 20 ? model.item.gemLevel : undefined,
    quality: (
      (isGem && model.item.quality >= 16) ||
      (isFlask && model.item.quality > 20) ||
      (options.exact && model.item.quality > 20)
    ) ? model.item.quality : undefined,
    itemLevel: options.exact && model.item.itemLevel > 0 && !model.identity.name
      ? Math.min(model.item.itemLevel, 86)
      : undefined,
    linkedSockets: model.item.links > 0 ? model.item.links : undefined,
    mapTier: model.item.mapTier > 0 ? model.item.mapTier : undefined
  }
  for (const property of model.properties || []) {
    if (!property.enabled || !PROPERTY_IDS.has(property.id)) continue
    const [group, field] = property.id.split('.')
    filters[group] ||= {}
    filters[group][field] = {
      min: Number.isFinite(Number(property.min)) ? Number(property.min) : undefined,
      max: Number.isFinite(Number(property.max)) ? Number(property.max) : undefined
    }
  }
  return createAwakenedTradeRequest(filters, model.stats || [])
}

function catalogHasStat(catalog, id, type) {
  if (!catalog) return true
  return (catalog.stats || []).some((entry) => {
    const value = entry.ids?.[type]
    return (Array.isArray(value) ? value : [value]).includes(id)
  })
}

export function sanitizePriceCheckModel(value, catalog = null) {
  if (!value || typeof value !== 'object') throw new Error('查价请求无效')
  const stats = Array.isArray(value.stats) ? value.stats.slice(0, 24).map((stat) => ({
    key: safeText(stat.key, 120),
    id: safeText(stat.id, 80),
    label: safeText(stat.label),
    text: safeText(stat.text, 500),
    type: safeText(stat.type, 24),
    tier: Number.isInteger(Number(stat.tier)) && Number(stat.tier) > 0 ? Number(stat.tier) : null,
    tags: Array.isArray(stat.tags) ? stat.tags.slice(0, 12).map((tag) => safeText(tag, 40)).filter(Boolean) : [],
    enabled: Boolean(stat.enabled),
    min: safeNumber(stat.min),
    max: safeNumber(stat.max),
    sources: Array.isArray(stat.sources)
      ? stat.sources.slice(0, 12).map((source) => ({
          text: safeText(source.text, 500),
          name: safeText(source.name, 120),
          values: Array.isArray(source.values) ? source.values.slice(0, 8).map(safeNumber).filter(Number.isFinite) : []
        }))
      : []
  })).filter((stat) => isTradeStatId(stat.id, stat.type) && catalogHasStat(catalog, stat.id, stat.type)) : []
  const properties = Array.isArray(value.properties) ? value.properties.slice(0, 24).map((property) => ({
    id: safeText(property.id, 48),
    label: safeText(property.label, 80),
    value: safeNumber(property.value) || 0,
    enabled: Boolean(property.enabled),
    min: safeNumber(property.min),
    max: safeNumber(property.max)
  })).filter((property) => PROPERTY_IDS.has(property.id)) : []
  const flags = Object.fromEntries(
    ['corrupted', 'unidentified', 'mirrored', 'split', 'fractured']
      .map((key) => [key, Boolean(value.flags?.[key] ?? value.item?.[key])])
  )
  return {
    item: { ...(value.item || {}), ...flags },
    identity: { name: safeText(value.identity?.name), type: safeText(value.identity?.type) },
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
    properties,
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
        candidates: Array.isArray(unknown.candidates) ? unknown.candidates.slice(0, 20).map((candidate) => ({
          id: safeText(candidate.id, 80),
          label: safeText(candidate.label),
          matcher: safeText(candidate.matcher, 500),
          type: safeText(candidate.type, 24),
          categories: Array.isArray(candidate.categories) ? candidate.categories.slice(0, 20).map((entry) => safeText(entry, 80)).filter(Boolean) : [],
          values: Array.isArray(candidate.values) ? candidate.values.slice(0, 8).map(safeNumber).filter(Number.isFinite) : [],
          min: safeNumber(candidate.min),
          max: safeNumber(candidate.max)
        })).filter((candidate) => candidate.type === type && isTradeStatId(candidate.id, type) && catalogHasStat(catalog, candidate.id, type)) : []
      }
    }).filter((unknown) => unknown.text) : []
  }
}
