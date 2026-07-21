import { createHash } from 'node:crypto'

export const CRAFTING_SCHEMA_VERSION = 3
export const AFFIX_TYPES = new Set(['prefix', 'suffix'])
export const BASE_VARIANTS = new Set(['normal', 'influenced', 'fractured', 'synthesized', 'eldritch'])
export const CRAFT_PROVIDERS = new Set(['currency', 'bench', 'harvest'])

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
    requiredLevel: integer(value.requiredLevel ?? 1, `bases[${index}].requiredLevel`, { min: 1, max: 100 }),
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
    }) : []
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
      fractured: boolean(item.fractured)
    }
  })
  return {
    rarity,
    prefixes: normalizeAffixes(value.prefixes, 'prefixes'),
    suffixes: normalizeAffixes(value.suffixes, 'suffixes'),
    influences: stringArray(value.influences, 'state.influences'),
    implicits: stringArray(value.implicits, 'state.implicits'),
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
    images: structuredClone(value.images ?? {})
  }
}
