import { createHash } from 'node:crypto'
import { NON_TAINTED_CATALYST_TYPES } from './catalystRules.js'
import { inferBaseDefencePercentile } from './equipmentPropertyRules.js'

export const CRAFTING_SCHEMA_VERSION = 8
export const AFFIX_TYPES = new Set(['prefix', 'suffix'])
export const BASE_VARIANTS = new Set(['normal', 'influenced', 'fractured', 'synthesized', 'eldritch'])
export const CRAFT_PROVIDERS = new Set(['currency', 'bench', 'harvest', 'fossil'])

function fail(path, message) {
  throw new TypeError(`${path}: ${message}`)
}

function object(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, '必须是对象')
  return value
}

function string(value, path, fallback) {
  const normalized = String(value ?? fallback ?? '').trim()
  if (!normalized) fail(path, '不能为空')
  return normalized
}

function number(value, path, { min = -Infinity, max = Infinity, fallback } = {}) {
  const normalized = value == null && fallback != null ? fallback : Number(value)
  if (!Number.isFinite(normalized) || normalized < min || normalized > max) {
    fail(path, `必须是 ${min} 到 ${max} 之间的有限数字`)
  }
  return normalized
}

function integer(value, path, options = {}) {
  const normalized = number(value, path, options)
  if (!Number.isInteger(normalized)) fail(path, '必须是整数')
  return normalized
}

function boolean(value, fallback = false) {
  return value == null ? fallback : Boolean(value)
}

function stringArray(value, path) {
  if (value == null) return []
  if (!Array.isArray(value)) fail(path, '必须是数组')
  return [...new Set(value.map((entry, index) => string(entry, `${path}[${index}]`)))]
}

function normalizeDisplayTags(value, path) {
  if (value == null) return []
  if (!Array.isArray(value)) fail(path, '必须是数组')
  const tags = value.map((entry, index) => {
    if (typeof entry === 'string') return { id: string(entry, `${path}[${index}]`), label: string(entry, `${path}[${index}]`) }
    const item = object(entry, `${path}[${index}]`)
    return { id: string(item.id, `${path}[${index}].id`), label: string(item.label, `${path}[${index}].label`, item.id) }
  })
  return [...new Map(tags.map((tag) => [tag.id, tag])).values()]
}

export function stableCraftingId(namespace, value) {
  const source = `${string(namespace, 'namespace')}:${string(value, 'value')}`
  return `${namespace}:${createHash('sha1').update(source).digest('hex').slice(0, 16)}`
}

export function normalizeDatasetManifest(input) {
  const value = object(input, 'manifest')
  const sources = Array.isArray(value.sources) ? value.sources.map((source, index) => {
    const item = object(source, `manifest.sources[${index}]`)
    return {
      id: string(item.id, `manifest.sources[${index}].id`),
      url: string(item.url, `manifest.sources[${index}].url`)
    }
  }) : []
  return {
    schemaVersion: integer(value.schemaVersion, 'manifest.schemaVersion', { min: 1 }),
    game: value.game === 'poe1' ? 'poe1' : fail('manifest.game', '仅支持 poe1'),
    locale: value.locale === 'zh-CN' ? 'zh-CN' : fail('manifest.locale', '仅支持 zh-CN'),
    league: string(value.league, 'manifest.league'),
    patch: string(value.patch, 'manifest.patch', 'unknown'),
    generatedAt: string(value.generatedAt, 'manifest.generatedAt'),
    checksum: string(value.checksum, 'manifest.checksum', 'development'),
    sources
  }
}

export function normalizeBaseItem(input, index = 0) {
  const value = object(input, `bases[${index}]`)
  const maxAffixes = object(value.maxAffixes ?? { prefix: 3, suffix: 3 }, `bases[${index}].maxAffixes`)
  const tags = stringArray(value.tags, `bases[${index}].tags`)
  const sourceKey = String(value.sourceId || value.name || '').toLowerCase()
  const inferredTags = [
    ['large_cluster_jewel', 'expansion_jewel_large'], ['medium_cluster_jewel', 'expansion_jewel_medium'], ['small_cluster_jewel', 'expansion_jewel_small'],
    ['murderous_eye_jewel', 'abyss_jewel_melee'], ['searching_eye_jewel', 'abyss_jewel_ranged'],
    ['hypnotic_eye_jewel', 'abyss_jewel_caster'], ['ghastly_eye_jewel', 'abyss_jewel_summoner']
  ]
  inferredTags.forEach(([needle, tag]) => { if (sourceKey.includes(needle) && !tags.includes(tag)) tags.push(tag) })
  const requirements = object(value.requirements, `bases[${index}].requirements`)
  const requiredLevel = integer(requirements.level, `bases[${index}].requirements.level`, { min: 1, max: 100 })
  if (value.requiredLevel != null && Number(value.requiredLevel) !== requiredLevel) fail(`bases[${index}].requiredLevel`, '必须与 requirements.level 一致')
  const qualityType = string(value.qualityType, `bases[${index}].qualityType`)
  if (!['weapon', 'armour', 'none'].includes(qualityType)) fail(`bases[${index}].qualityType`, '必须是 weapon、armour 或 none')
  const normalizeRanges = (entries, path) => (Array.isArray(entries) ? entries : fail(path, '必须是数组')).map((range, rangeIndex) => {
    const item = object(range, `${path}[${rangeIndex}]`)
    const min = number(item.min, `${path}[${rangeIndex}].min`)
    const max = number(item.max, `${path}[${rangeIndex}].max`)
    if (max < min) fail(`${path}[${rangeIndex}]`, 'max 不能小于 min')
    return { min, max }
  })
  const normalizeBaseValues = (entries, path) => (Array.isArray(entries) ? entries : fail(path, '必须是数组')).map((entry, entryIndex) => {
    const item = object(entry, `${path}[${entryIndex}]`)
    return {
      id: string(item.id, `${path}[${entryIndex}].id`),
      label: string(item.label, `${path}[${entryIndex}].label`, item.text),
      kind: string(item.kind, `${path}[${entryIndex}].kind`, 'property'),
      text: string(item.text, `${path}[${entryIndex}].text`),
      values: normalizeRanges(item.values, `${path}[${entryIndex}].values`),
      displayTags: normalizeDisplayTags(item.displayTags, `${path}[${entryIndex}].displayTags`)
    }
  })
  return {
    id: string(value.id, `bases[${index}].id`),
    sourceId: string(value.sourceId, `bases[${index}].sourceId`, value.id),
    name: string(value.name, `bases[${index}].name`),
    displayName: string(value.displayName, `bases[${index}].displayName`, value.name),
    category: string(value.category, `bases[${index}].category`),
    categoryPath: stringArray(value.categoryPath ?? [value.category, value.itemClass], `bases[${index}].categoryPath`),
    itemClass: string(value.itemClass, `bases[${index}].itemClass`),
    modifierProfileId: string(value.modifierProfileId, `bases[${index}].modifierProfileId`, value.itemClass),
    imageId: string(value.imageId, `bases[${index}].imageId`, 'placeholder'),
    requiredLevel,
    requirements: {
      level: requiredLevel,
      strength: integer(requirements.strength ?? 0, `bases[${index}].requirements.strength`, { min: 0, max: 1000 }),
      dexterity: integer(requirements.dexterity ?? 0, `bases[${index}].requirements.dexterity`, { min: 0, max: 1000 }),
      intelligence: integer(requirements.intelligence ?? 0, `bases[${index}].requirements.intelligence`, { min: 0, max: 1000 })
    },
    qualityType,
    socketLimit: integer(value.socketLimit, `bases[${index}].socketLimit`, { min: 0, max: 6 }),
    baseStats: normalizeBaseValues(value.baseStats, `bases[${index}].baseStats`),
    implicitModifiers: normalizeBaseValues(value.implicitModifiers, `bases[${index}].implicitModifiers`),
    tags,
    maxAffixes: {
      prefix: integer(maxAffixes.prefix, `bases[${index}].maxAffixes.prefix`, { min: 0, max: 3 }),
      suffix: integer(maxAffixes.suffix, `bases[${index}].maxAffixes.suffix`, { min: 0, max: 3 })
    },
    allowedVariants: stringArray(value.allowedVariants ?? ['normal'], `bases[${index}].allowedVariants`).map((variant) => {
      if (!BASE_VARIANTS.has(variant)) fail(`bases[${index}].allowedVariants`, `未知状态 ${variant}`)
      return variant
    })
  }
}

export function normalizeModifierTier(input, path = 'tier') {
  const value = object(input, path)
  const tier = integer(value.tier, `${path}.tier`, { min: 1, max: 99 })
  const sourceItem = value.sourceItem == null ? null : object(value.sourceItem, `${path}.sourceItem`)
  return {
    id: string(value.id, `${path}.id`),
    tier,
    name: string(value.name, `${path}.name`, `T${tier}`),
    requiredLevel: integer(value.requiredLevel ?? 1, `${path}.requiredLevel`, { min: 1, max: 100 }),
    weight: number(value.weight, `${path}.weight`, { min: 0 }),
    text: string(value.text, `${path}.text`),
    displayTags: normalizeDisplayTags(value.displayTags ?? value.tags, `${path}.displayTags`),
    values: Array.isArray(value.values) ? value.values.map((range, index) => {
      const item = object(range, `${path}.values[${index}]`)
      return {
        min: number(item.min, `${path}.values[${index}].min`),
        max: number(item.max, `${path}.values[${index}].max`)
      }
    }) : [],
    ...(sourceItem ? { sourceItem: {
      id: string(sourceItem.id, `${path}.sourceItem.id`),
      name: string(sourceItem.name, `${path}.sourceItem.name`),
      tier: integer(sourceItem.tier, `${path}.sourceItem.tier`, { min: 1, max: 99 }),
      minimumItemLevel: integer(sourceItem.minimumItemLevel ?? 1, `${path}.sourceItem.minimumItemLevel`, { min: 1, max: 100 }),
      randomModifierLevelCap: sourceItem.randomModifierLevelCap == null ? null : integer(sourceItem.randomModifierLevelCap, `${path}.sourceItem.randomModifierLevelCap`, { min: 1, max: 100 }),
      canReforgeRare: Boolean(sourceItem.canReforgeRare)
    } } : {})
  }
}

export function normalizeModifierFamily(input, index = 0, root = 'modifiers') {
  const path = `${root}[${index}]`
  const value = object(input, path)
  const affixType = string(value.affixType, `${path}.affixType`)
  if (!AFFIX_TYPES.has(affixType)) fail(`${path}.affixType`, '必须是 prefix 或 suffix')
  const tiers = Array.isArray(value.tiers)
    ? value.tiers.map((tier, tierIndex) => normalizeModifierTier(tier, `${path}.tiers[${tierIndex}]`))
    : fail(`${path}.tiers`, '必须是数组')
  if (!tiers.length) fail(`${path}.tiers`, '至少需要一个阶级')
  const tierIds = new Set()
  tiers.forEach((tier) => {
    if (tierIds.has(tier.id)) fail(`${path}.tiers`, `重复 ID ${tier.id}`)
    tierIds.add(tier.id)
  })
  return {
    id: string(value.id, `${path}.id`),
    goalId: string(value.goalId, `${path}.goalId`, value.id),
    sourceId: string(value.sourceId, `${path}.sourceId`, value.id),
    effectKey: string(value.effectKey, `${path}.effectKey`, value.sourceId ?? value.id),
    modifierProfileId: string(value.modifierProfileId, `${path}.modifierProfileId`, value.itemClasses?.[0] ?? 'default'),
    groupId: string(value.groupId, `${path}.groupId`),
    name: string(value.name, `${path}.name`),
    affixType,
    source: string(value.source, `${path}.source`, 'natural'),
    tags: stringArray(value.tags, `${path}.tags`),
    displayTags: normalizeDisplayTags(value.displayTags ?? value.tags, `${path}.displayTags`),
    spawnTags: stringArray(value.spawnTags, `${path}.spawnTags`),
    requiredTags: stringArray(value.requiredTags, `${path}.requiredTags`),
    itemClasses: stringArray(value.itemClasses, `${path}.itemClasses`),
    influences: stringArray(value.influences, `${path}.influences`),
    tiers: tiers.sort((a, b) => a.tier - b.tier),
    craftedOptions: (Array.isArray(value.craftedOptions) ? value.craftedOptions : []).map((option, optionIndex) => {
      const optionPath = `${path}.craftedOptions[${optionIndex}]`
      const normalized = normalizeModifierTier(option, optionPath)
      return {
        ...normalized,
        optionId: string(option.optionId, `${optionPath}.optionId`, option.id),
        craftId: string(option.craftId, `${optionPath}.craftId`),
        itemClasses: stringArray(option.itemClasses, `${optionPath}.itemClasses`),
        cost: Array.isArray(option.cost) ? option.cost.map((entry, costIndex) => {
          const item = object(entry, `${optionPath}.cost[${costIndex}]`)
          return {
            resourceId: string(item.resourceId, `${optionPath}.cost[${costIndex}].resourceId`),
            resourceName: string(item.resourceName, `${optionPath}.cost[${costIndex}].resourceName`, item.resourceId),
            amount: number(item.amount, `${optionPath}.cost[${costIndex}].amount`, { min: 0 })
          }
        }) : [],
        unlock: String(option.unlock ?? '').trim()
      }
    })
  }
}

export function normalizeModifierFamilyGroup(input, index = 0) {
  const path = `modifierFamilies[${index}]`
  const value = object(input, path)
  const affixType = string(value.affixType, `${path}.affixType`)
  if (!AFFIX_TYPES.has(affixType)) fail(`${path}.affixType`, '必须是 prefix 或 suffix')
  const entries = (Array.isArray(value.entries) ? value.entries : fail(`${path}.entries`, '必须是数组'))
    .map((entry, entryIndex) => normalizeModifierFamily(entry, entryIndex, `${path}.entries`))
  if (!entries.length) fail(`${path}.entries`, '至少需要一个属性分支')
  if (entries.some((entry) => entry.groupId !== value.groupId || entry.affixType !== affixType || entry.modifierProfileId !== value.modifierProfileId)) {
    fail(`${path}.entries`, '内部分支必须与父项的配置、Mod Family 和前后缀一致')
  }
  return {
    id: string(value.id, `${path}.id`),
    modifierProfileId: string(value.modifierProfileId, `${path}.modifierProfileId`),
    groupId: string(value.groupId, `${path}.groupId`),
    name: string(value.name, `${path}.name`),
    affixType,
    source: string(value.source, `${path}.source`, 'natural'),
    influences: stringArray(value.influences, `${path}.influences`),
    entries
  }
}

export function normalizeCraftDefinition(input, index = 0) {
  const path = `crafts[${index}]`
  const value = object(input, path)
  const provider = string(value.provider, `${path}.provider`)
  if (!CRAFT_PROVIDERS.has(provider)) fail(`${path}.provider`, `未知 Provider ${provider}`)
  return {
    id: string(value.id, `${path}.id`),
    provider,
    name: string(value.name, `${path}.name`),
    effectKind: string(value.effectKind, `${path}.effectKind`),
    itemClasses: stringArray(value.itemClasses, `${path}.itemClasses`),
    cost: Array.isArray(value.cost) ? value.cost.map((entry, costIndex) => {
      const item = object(entry, `${path}.cost[${costIndex}]`)
      return {
        resourceId: string(item.resourceId, `${path}.cost[${costIndex}].resourceId`),
        resourceName: string(item.resourceName, `${path}.cost[${costIndex}].resourceName`, item.resourceId),
        amount: number(item.amount, `${path}.cost[${costIndex}].amount`, { min: 0 })
      }
    }) : [],
    params: value.params && typeof value.params === 'object' ? structuredClone(value.params) : {}
  }
}

export function normalizeEldritchImplicitFamily(input, index = 0) {
  const path = `eldritchImplicitFamilies[${index}]`
  const value = object(input, path)
  const source = string(value.source, `${path}.source`)
  if (!['exarch', 'eater'].includes(source)) fail(`${path}.source`, '必须是 exarch 或 eater')
  const itemClasses = stringArray(value.itemClasses, `${path}.itemClasses`)
  const allowedClasses = new Set(['Helmet', 'Gloves', 'Boots', 'BodyArmour'])
  if (!itemClasses.length || itemClasses.some((entry) => !allowedClasses.has(entry))) fail(`${path}.itemClasses`, '必须包含受支持的护甲类别')
  const tiers = (Array.isArray(value.tiers) ? value.tiers : fail(`${path}.tiers`, '必须是数组')).map((tier, tierIndex) => {
    const tierPath = `${path}.tiers[${tierIndex}]`
    const item = object(tier, tierPath)
    const rank = integer(item.tier, `${tierPath}.tier`, { min: 1, max: 6 })
    const weights = {}
    for (const itemClass of itemClasses) {
      const weight = number(item.weights?.[itemClass] ?? 0, `${tierPath}.weights.${itemClass}`, { min: 0 })
      weights[itemClass] = weight
    }
    if (!Object.keys(weights).length) fail(`${tierPath}.weights`, '至少需要一个受支持的护甲类别')
    return {
      id: string(item.id, `${tierPath}.id`), tier: rank,
      name: string(item.name, `${tierPath}.name`, `T${rank}`),
      requiredLevel: integer(item.requiredLevel ?? 1, `${tierPath}.requiredLevel`, { min: 1, max: 100 }),
      text: string(item.text, `${tierPath}.text`),
      displayTags: normalizeDisplayTags(item.displayTags ?? value.displayTags ?? value.tags, `${tierPath}.displayTags`),
      values: Array.isArray(item.values) ? item.values.map((range, rangeIndex) => {
        const entry = object(range, `${tierPath}.values[${rangeIndex}]`)
        return { min: number(entry.min, `${tierPath}.values[${rangeIndex}].min`), max: number(entry.max, `${tierPath}.values[${rangeIndex}].max`) }
      }) : [],
      weights
    }
  }).sort((a, b) => a.tier - b.tier)
  if (!tiers.length || new Set(tiers.map((tier) => tier.tier)).size !== tiers.length) fail(`${path}.tiers`, '至少需要一个且阶级不能重复')
  if (tiers.length !== 6 || tiers.some((tier, index) => tier.tier !== index + 1)) fail(`${path}.tiers`, '必须包含连续的 T1–T6')
  if (!tiers.some((tier) => Object.values(tier.weights).some((weight) => weight > 0))) fail(`${path}.tiers`, '家族至少需要一个正权重候选')
  return {
    id: string(value.id, `${path}.id`), source,
    effectKey: string(value.effectKey, `${path}.effectKey`, value.id),
    name: string(value.name, `${path}.name`), itemClasses,
    tags: stringArray(value.tags, `${path}.tags`),
    displayTags: normalizeDisplayTags(value.displayTags ?? value.tags, `${path}.displayTags`),
    tiers
  }
}

export function normalizeCorruptedImplicitFamily(input, index = 0) {
  const path = `corruptedImplicitFamilies[${index}]`
  const value = object(input, path)
  const source = string(value.source, `${path}.source`, 'vaal')
  if (source !== 'vaal') fail(`${path}.source`, '必须是 vaal')
  const allowedClasses = new Set(['Amulet', 'Belt', 'BodyArmour', 'Boots', 'Bow', 'Claw', 'Dagger', 'Gloves', 'Helmet', 'OneHandAxe', 'OneHandMace', 'OneHandSword', 'Quiver', 'Ring', 'RuneDagger', 'Sceptre', 'Shield', 'Staff', 'ThrustingOneHandSword', 'TwoHandAxe', 'TwoHandMace', 'TwoHandSword', 'Wand', 'Warstaff'])
  const itemClasses = stringArray(value.itemClasses, `${path}.itemClasses`)
  if (!itemClasses.length || itemClasses.some((entry) => !allowedClasses.has(entry))) fail(`${path}.itemClasses`, '包含不受支持的腐化装备类别')
  const tiers = (Array.isArray(value.tiers) ? value.tiers : fail(`${path}.tiers`, '必须是数组')).map((tier, tierIndex) => {
    const tierPath = `${path}.tiers[${tierIndex}]`
    const item = object(tier, tierPath)
    const weights = {}
    for (const itemClass of itemClasses) weights[itemClass] = number(item.weights?.[itemClass] ?? 0, `${tierPath}.weights.${itemClass}`, { min: 0 })
    return {
      id: string(item.id, `${tierPath}.id`), tier: integer(item.tier, `${tierPath}.tier`, { min: 1 }),
      name: string(item.name, `${tierPath}.name`, `T${tierIndex + 1}`),
      requiredLevel: integer(item.requiredLevel ?? 1, `${tierPath}.requiredLevel`, { min: 1, max: 100 }),
      text: string(item.text, `${tierPath}.text`),
      displayTags: normalizeDisplayTags(item.displayTags ?? value.displayTags ?? value.tags, `${tierPath}.displayTags`),
      values: Array.isArray(item.values) ? item.values.map((range, rangeIndex) => {
        const entry = object(range, `${tierPath}.values[${rangeIndex}]`)
        return { min: number(entry.min, `${tierPath}.values[${rangeIndex}].min`), max: number(entry.max, `${tierPath}.values[${rangeIndex}].max`) }
      }) : [],
      weights
    }
  }).sort((a, b) => a.tier - b.tier)
  if (!tiers.length || new Set(tiers.map((tier) => tier.tier)).size !== tiers.length) fail(`${path}.tiers`, '至少需要一个且阶级不能重复')
  if (!tiers.some((tier) => Object.values(tier.weights).some((weight) => weight > 0))) fail(`${path}.tiers`, '家族至少需要一个正权重候选')
  return {
    id: string(value.id, `${path}.id`), source,
    effectKey: string(value.effectKey, `${path}.effectKey`, value.id),
    name: string(value.name, `${path}.name`), itemClasses,
    tags: stringArray(value.tags, `${path}.tags`),
    displayTags: normalizeDisplayTags(value.displayTags ?? value.tags, `${path}.displayTags`), tiers
  }
}

export function normalizePriceRecord(input, index = 0) {
  const path = `prices[${index}]`
  const value = object(input, path)
  const unit = string(value.currencyUnit ?? value.currency_unit, `${path}.currencyUnit`, 'c').toLowerCase()
  if (!['c', 'd', 'e'].includes(unit)) fail(`${path}.currencyUnit`, `未知计价单位 ${unit}`)
  return {
    resourceId: string(value.resourceId, `${path}.resourceId`),
    itemName: string(value.itemName ?? value.item_name, `${path}.itemName`),
    sellAverage: number(value.sellAverage ?? value.sell_avg, `${path}.sellAverage`, { min: 0 }),
    priceField: value.priceField === 'buy_avg' ? 'buy_avg' : 'sell_avg',
    currencyUnit: unit,
    observedAt: string(value.observedAt ?? value.latest_datetime, `${path}.observedAt`),
    error: boolean(value.error),
    errorInfo: String(value.errorInfo ?? value.error_info ?? '').trim()
  }
}

export function normalizeCraftRequest(input) {
  const value = object(input, 'request')
  const variant = object(value.variant ?? { kind: 'normal' }, 'request.variant')
  const kind = string(variant.kind, 'request.variant.kind', 'normal')
  if (!BASE_VARIANTS.has(kind)) fail('request.variant.kind', `未知状态 ${kind}`)
  if (!Array.isArray(value.targets) || !value.targets.length) fail('request.targets', '至少需要一个目标词缀')
  return {
    baseId: string(value.baseId, 'request.baseId'),
    itemLevel: integer(value.itemLevel, 'request.itemLevel', { min: 1, max: 100 }),
    variant: {
      kind,
      influences: stringArray(variant.influences, 'request.variant.influences'),
      fracturedTierId: variant.fracturedTierId ? string(variant.fracturedTierId, 'request.variant.fracturedTierId') : null,
      implicits: stringArray(variant.implicits, 'request.variant.implicits')
    },
    targets: value.targets.map((target, index) => {
      const item = object(target, `request.targets[${index}]`)
      return {
        goalId: string(item.goalId, `request.targets[${index}].goalId`),
        minTierId: string(item.minTierId, `request.targets[${index}].minTierId`)
      }
    })
  }
}

export function normalizeCraftState(input = {}) {
  const value = object(input, 'state')
  const rarity = string(value.rarity, 'state.rarity', 'normal')
  if (!['normal', 'magic', 'rare'].includes(rarity)) fail('state.rarity', `未知稀有度 ${rarity}`)
  const normalizeAffixes = (entries, type) => (Array.isArray(entries) ? entries : []).map((entry, index) => {
    const item = object(entry, `state.${type}[${index}]`)
    return {
      goalId: string(item.goalId ?? item.modifierId, `state.${type}[${index}].goalId`),
      modifierId: string(item.modifierId, `state.${type}[${index}].modifierId`),
      optionId: item.optionId ? string(item.optionId, `state.${type}[${index}].optionId`) : null,
      tierId: string(item.tierId, `state.${type}[${index}].tierId`),
      groupId: string(item.groupId, `state.${type}[${index}].groupId`),
      source: string(item.source, `state.${type}[${index}].source`, 'natural'),
      sourceItemId: item.sourceItemId ? string(item.sourceItemId, `state.${type}[${index}].sourceItemId`) : null,
      sourceItemName: item.sourceItemName ? string(item.sourceItemName, `state.${type}[${index}].sourceItemName`) : '',
      fractured: boolean(item.fractured),
      veiled: boolean(item.veiled),
      affixType: string(item.affixType, `state.${type}[${index}].affixType`, type === 'prefixes' ? 'prefix' : 'suffix'),
      name: string(item.name, `state.${type}[${index}].name`, ''),
      tierName: string(item.tierName, `state.${type}[${index}].tierName`, ''),
      text: string(item.text, `state.${type}[${index}].text`, ''),
      rolledText: string(item.rolledText, `state.${type}[${index}].rolledText`, item.text || ''),
      valueRanges: Array.isArray(item.valueRanges) ? item.valueRanges.map((range) => ({ min: Number(range.min), max: Number(range.max) })) : [],
      rolledValues: Array.isArray(item.rolledValues) ? item.rolledValues.map(Number) : [],
      displayTags: Array.isArray(item.displayTags) ? structuredClone(item.displayTags) : [],
      weight: Math.max(0, Number(item.weight) || 0),
      metaCraft: boolean(item.metaCraft)
    }
  })
  const normalizeEldritchInstance = (entry, source) => {
    if (entry == null) return null
    const path = `state.eldritchImplicits.${source}`
    const item = object(entry, path)
    const tier = integer(item.tier, `${path}.tier`, { min: 1, max: 6 })
    return {
      source, familyId: string(item.familyId, `${path}.familyId`), tierId: string(item.tierId, `${path}.tierId`), tier,
      name: string(item.name, `${path}.name`, `T${tier}`), text: string(item.text, `${path}.text`),
      rolledText: string(item.rolledText, `${path}.rolledText`, item.text),
      valueRanges: Array.isArray(item.valueRanges) ? item.valueRanges.map((range) => ({ min: Number(range.min), max: Number(range.max) })) : [],
      rolledValues: Array.isArray(item.rolledValues) ? item.rolledValues.map(Number) : [],
      displayTags: normalizeDisplayTags(item.displayTags, `${path}.displayTags`),
      weight: Math.max(0, Number(item.weight) || 0)
    }
  }
  const normalizeVaalImplicit = (entry) => {
    if (entry == null) return null
    const path = 'state.vaalImplicit'
    const item = object(entry, path)
    const tier = integer(item.tier, `${path}.tier`, { min: 1 })
    return {
      source: 'vaal', familyId: string(item.familyId, `${path}.familyId`), tierId: string(item.tierId, `${path}.tierId`), tier,
      name: string(item.name, `${path}.name`, `T${tier}`), text: string(item.text, `${path}.text`),
      rolledText: string(item.rolledText, `${path}.rolledText`, item.text),
      valueRanges: Array.isArray(item.valueRanges) ? item.valueRanges.map((range) => ({ min: Number(range.min), max: Number(range.max) })) : [],
      rolledValues: Array.isArray(item.rolledValues) ? item.rolledValues.map(Number) : [],
      displayTags: normalizeDisplayTags(item.displayTags, `${path}.displayTags`),
      weight: Math.max(0, Number(item.weight) || 0)
    }
  }
  const normalizeBaseInstances = (entries, key) => (Array.isArray(entries) ? entries : []).map((entry, index) => {
    const path = `state.${key}[${index}]`
    const item = object(entry, path)
    const valueRanges = Array.isArray(item.valueRanges) ? item.valueRanges.map((range, rangeIndex) => {
      const min = number(range.min, `${path}.valueRanges[${rangeIndex}].min`)
      const max = number(range.max, `${path}.valueRanges[${rangeIndex}].max`)
      if (max < min) fail(`${path}.valueRanges[${rangeIndex}]`, 'max 不能小于 min')
      return { min, max }
    }) : []
    const rolledValues = Array.isArray(item.rolledValues) ? item.rolledValues.map((entryValue, valueIndex) => number(entryValue, `${path}.rolledValues[${valueIndex}]`)) : []
    if (rolledValues.length !== valueRanges.length) fail(path, 'rolledValues 必须与 valueRanges 一一对应')
    return {
      id: string(item.id, `${path}.id`), label: string(item.label, `${path}.label`, item.text),
      kind: string(item.kind, `${path}.kind`, key === 'baseImplicits' ? 'implicit' : 'property'),
      text: string(item.text, `${path}.text`), valueRanges, rolledValues,
      displayTags: normalizeDisplayTags(item.displayTags, `${path}.displayTags`),
      rolledText: string(item.rolledText, `${path}.rolledText`, item.text)
    }
  })
  const baseStats = normalizeBaseInstances(value.baseStats, 'baseStats')
  const inferredBaseDefencePercentile = inferBaseDefencePercentile(baseStats)
  const sockets = (Array.isArray(value.sockets) ? value.sockets : []).map((entry, index) => {
    const path = `state.sockets[${index}]`
    const item = object(entry, path)
    const color = string(item.color, `${path}.color`)
    if (!['R', 'G', 'B', 'W'].includes(color)) fail(`${path}.color`, '必须是 R、G、B 或 W')
    return { id: string(item.id, `${path}.id`, `socket:${index + 1}`), color }
  })
  if (new Set(sockets.map((entry) => entry.id)).size !== sockets.length) fail('state.sockets', '插槽 ID 不能重复')
  const socketIndexes = new Map(sockets.map((entry, index) => [entry.id, index]))
  const usedSocketIds = new Set()
  const links = (Array.isArray(value.links) ? value.links : sockets.map((entry) => [entry.id])).map((group, groupIndex) => {
    if (!Array.isArray(group) || !group.length) fail(`state.links[${groupIndex}]`, '连接组不能为空')
    const ids = group.map((id, index) => string(id, `state.links[${groupIndex}][${index}]`))
    const indexes = ids.map((id) => socketIndexes.get(id))
    if (indexes.some((index) => index == null)) fail(`state.links[${groupIndex}]`, '连接组引用了不存在的插槽')
    if (ids.some((id) => usedSocketIds.has(id))) fail(`state.links[${groupIndex}]`, '同一插槽不能出现在多个连接组')
    const sorted = [...indexes].sort((a, b) => a - b)
    if (sorted.some((index, position) => position && index !== sorted[position - 1] + 1)) fail(`state.links[${groupIndex}]`, '连接组必须由连续插槽组成')
    ids.forEach((id) => usedSocketIds.add(id))
    return ids
  })
  if (usedSocketIds.size !== sockets.length) fail('state.links', '每个插槽必须属于一个连接组')
  return {
    rarity,
    corrupted: boolean(value.corrupted),
    mirrored: boolean(value.mirrored),
    enchanted: boolean(value.enchanted || String(value.qualityEffect ?? '').trim()),
    split: boolean(value.split),
    quality: integer(value.quality ?? 0, 'state.quality', { min: 0, max: 200 }),
    catalystQuality: (() => {
      const quality = value.catalystQuality && typeof value.catalystQuality === 'object' ? value.catalystQuality : {}
      const type = quality.type == null || quality.type === '' ? null : string(quality.type, 'state.catalystQuality.type')
      const amount = integer(quality.amount ?? 0, 'state.catalystQuality.amount', { min: 0, max: 20 })
      if (!type && amount) fail('state.catalystQuality', '没有类型时品质必须为 0')
      if (type && !NON_TAINTED_CATALYST_TYPES.includes(type)) fail('state.catalystQuality.type', `未知催化剂品质 ${type}`)
      return { type, amount }
    })(),
    baseDefencePercentile: value.baseDefencePercentile == null
      ? inferredBaseDefencePercentile
      : integer(value.baseDefencePercentile, 'state.baseDefencePercentile', { min: 0, max: 100 }),
    baseStats,
    baseImplicits: normalizeBaseInstances(value.baseImplicits, 'baseImplicits'),
    sockets,
    links,
    prefixes: normalizeAffixes(value.prefixes, 'prefixes'),
    suffixes: normalizeAffixes(value.suffixes, 'suffixes'),
    influences: stringArray(value.influences, 'state.influences'),
    implicits: stringArray(value.implicits, 'state.implicits'),
    eldritchImplicits: {
      exarch: normalizeEldritchInstance(value.eldritchImplicits?.exarch, 'exarch'),
      eater: normalizeEldritchInstance(value.eldritchImplicits?.eater, 'eater')
    },
    vaalImplicit: normalizeVaalImplicit(value.vaalImplicit),
    corruptionOutcome: value.corruptionOutcome == null || value.corruptionOutcome === '' ? null : (() => {
      const outcome = string(value.corruptionOutcome, 'state.corruptionOutcome')
      if (!['implicit', 'white-sockets', 'rare-reforge', 'no-change'].includes(outcome)) fail('state.corruptionOutcome', '未知瓦尔腐化结果')
      return outcome
    })(),
    corruptionReplacedImplicit: value.corruptionReplacedImplicit && typeof value.corruptionReplacedImplicit === 'object'
      ? {
          source: string(value.corruptionReplacedImplicit.source, 'state.corruptionReplacedImplicit.source'),
          id: string(value.corruptionReplacedImplicit.id, 'state.corruptionReplacedImplicit.id'),
          text: string(value.corruptionReplacedImplicit.text, 'state.corruptionReplacedImplicit.text')
        }
      : null,
    qualityEffect: String(value.qualityEffect ?? '').trim(),
    meta: {
      prefixesLocked: boolean(value.meta?.prefixesLocked),
      suffixesLocked: boolean(value.meta?.suffixesLocked),
      cannotRollAttack: boolean(value.meta?.cannotRollAttack),
      cannotRollCaster: boolean(value.meta?.cannotRollCaster),
      multimod: boolean(value.meta?.multimod)
    }
  }
}

export function normalizeCraftPlan(input, index = 0) {
  const path = `plans[${index}]`
  const value = object(input, path)
  return {
    id: string(value.id, `${path}.id`),
    name: string(value.name, `${path}.name`),
    phase: ['quick', 'refined'].includes(value.phase) ? value.phase : fail(`${path}.phase`, '必须是 quick 或 refined'),
    expectedChaos: number(value.expectedChaos, `${path}.expectedChaos`, { min: 0 }),
    successProbability: number(value.successProbability, `${path}.successProbability`, { min: 0, max: 1 }),
    expectedAttempts: number(value.expectedAttempts, `${path}.expectedAttempts`, { min: 1 }),
    p50Chaos: number(value.p50Chaos, `${path}.p50Chaos`, { min: 0 }),
    p90Chaos: number(value.p90Chaos, `${path}.p90Chaos`, { min: 0 }),
    confidence95: object(value.confidence95, `${path}.confidence95`),
    resources: Array.isArray(value.resources) ? structuredClone(value.resources) : [],
    steps: Array.isArray(value.steps) ? structuredClone(value.steps) : [],
    datasetVersion: string(value.datasetVersion, `${path}.datasetVersion`),
    priceTime: string(value.priceTime, `${path}.priceTime`, 'unknown'),
    scopeNotice: string(value.scopeNotice, `${path}.scopeNotice`, '在当前支持的工艺与策略中最优')
  }
}

export function normalizeCraftingDataset(input) {
  const value = object(input, 'dataset')
  const manifest = normalizeDatasetManifest(value.manifest)
  if (manifest.schemaVersion !== CRAFTING_SCHEMA_VERSION) {
    fail('manifest.schemaVersion', `不支持的 schema ${manifest.schemaVersion}`)
  }
  const bases = (Array.isArray(value.bases) ? value.bases : fail('dataset.bases', '必须是数组')).map(normalizeBaseItem)
  const modifierFamilies = (Array.isArray(value.modifierFamilies) ? value.modifierFamilies : fail('dataset.modifierFamilies', '必须是数组')).map(normalizeModifierFamilyGroup)
  const modifiers = modifierFamilies.flatMap((family) => family.entries.map((entry) => ({ ...entry, familyId: family.id })))
  const crafts = (Array.isArray(value.crafts) ? value.crafts : fail('dataset.crafts', '必须是数组')).map(normalizeCraftDefinition)
  const eldritchImplicitFamilies = (Array.isArray(value.eldritchImplicitFamilies) ? value.eldritchImplicitFamilies : []).map(normalizeEldritchImplicitFamily)
  const corruptedImplicitFamilies = (Array.isArray(value.corruptedImplicitFamilies) ? value.corruptedImplicitFamilies : []).map(normalizeCorruptedImplicitFamily)
  const unique = (entries, path) => {
    const ids = new Set()
    entries.forEach((entry) => {
      if (ids.has(entry.id)) fail(path, `重复 ID ${entry.id}`)
      ids.add(entry.id)
    })
  }
  unique(bases, 'dataset.bases')
  unique(modifierFamilies, 'dataset.modifierFamilies')
  unique(modifiers, 'dataset.modifierFamilies.entries')
  unique(crafts, 'dataset.crafts')
  unique(eldritchImplicitFamilies, 'dataset.eldritchImplicitFamilies')
  unique(corruptedImplicitFamilies, 'dataset.corruptedImplicitFamilies')
  const goalIds = new Set(modifiers.map((modifier) => modifier.goalId))
  const craftIds = new Set(crafts.map((craft) => craft.id))
  modifiers.forEach((modifier) => modifier.craftedOptions.forEach((option) => {
    if (!craftIds.has(option.craftId)) fail(`modifier.${modifier.id}.craftedOptions.${option.optionId}.craftId`, '引用的工艺不存在')
    if (!option.cost.length) fail(`modifier.${modifier.id}.craftedOptions.${option.optionId}.cost`, '工艺成本不能为空')
  }))
  crafts.forEach((craft) => {
    if (craft.params?.goalId && !goalIds.has(craft.params.goalId)) fail(`craft.${craft.id}.params.goalId`, '引用的目标效果不存在')
  })
  const imageIds = new Set(Object.keys(value.images ?? {}))
  bases.forEach((base) => {
    if (!imageIds.has(base.imageId)) fail(`base.${base.id}.imageId`, `图片 ${base.imageId} 不存在`)
  })
  return {
    manifest,
    bases,
    modifierFamilies,
    modifiers,
    crafts,
    eldritchImplicitFamilies,
    corruptedImplicitFamilies,
    images: structuredClone(value.images ?? {})
  }
}
