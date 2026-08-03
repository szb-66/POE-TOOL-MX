import {
  clearMutableAffixes,
  cloneCraftState,
  eligibleModifierTiers,
  mutableAffixes,
  removeAffix
} from './craftState.js'
import {
  SOCKET_MODEL_VERSION, createSockets, fullLinks, naturalSocketLimit, qualityGainForItemLevel,
  hasVariableBaseDefences, rerollBaseDefences, rerollEntriesDifferent, rollLinks, rollSocketCount, rollSocketColor
} from './equipmentPropertyRules.js'
import {
  CATALYST_DEFINITIONS, CATALYST_MODEL_VERSION, JEWELLERY_ITEM_CLASSES,
  applyCatalystQuality, rollTaintedCatalyst
} from './catalystRules.js'
import {
  VAAL_MODEL_VERSION, VAAL_OUTCOME_LABELS, corruptedImplicitCandidates, replaceImplicitWithVaal,
  rollCorruptedImplicit, rollVaalOutcome, whitenSockets
} from './vaalRules.js'
import {
  TAINTED_CURRENCIES, TAINTED_SOCKET_MODEL_VERSION, applyTaintedFusing, applyTaintedJewellers,
  rerollTaintedSocketColours, taintedCommonReason, taintedSocketReason
} from './taintedRules.js'
import { CURRENT_EQUIPMENT_CURRENCIES } from './seasonalRules.js'

export class CraftActionRegistry {
  constructor() { this.providers = new Map() }
  register(provider) {
    if (!provider?.id || typeof provider.apply !== 'function') throw new TypeError('Provider 必须包含 id 和 apply')
    if (this.providers.has(provider.id)) throw new Error(`Provider ${provider.id} 已注册`)
    this.providers.set(provider.id, provider)
    return this
  }
  get(id) { return this.providers.get(id) }
  list() { return [...this.providers.values()] }
  inspect(id, context) {
    const provider = this.get(id)
    if (!provider) throw new Error(`未知工艺 Provider：${id}`)
    const reason = provider.unavailableReason?.(context) || ''
    const available = !provider.canApply || provider.canApply(context)
    return { ...provider, canApply: available, unavailableReason: available ? '' : reason || `${provider.name || id} 不适用于当前状态`, apply: undefined }
  }
  apply(id, context) {
    const provider = this.get(id)
    if (!provider) throw new Error(`未知工艺 Provider：${id}`)
    if (provider.canApply && !provider.canApply(context)) throw new Error(provider.unavailableReason?.(context) || `${provider.name || id} 不适用于当前状态`)
    return provider.apply(context)
  }
}

export function pickWeighted(entries, rng = Math.random) {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.weight) || 0), 0)
  if (!(total > 0)) return null
  let target = rng() * total
  for (const entry of entries) {
    target -= Math.max(0, Number(entry.weight) || 0)
    if (target <= 0) return entry
  }
  return entries.at(-1)
}

export function bucketModifierFamilies(entries) {
  const families = new Map()
  entries.forEach((entry) => {
    const familyId = entry.modifier.familyId || `${entry.modifier.modifierProfileId}:${entry.modifier.affixType}:${entry.modifier.groupId}`
    const bucket = families.get(familyId) ?? { id: familyId, weight: 0, entries: [] }
    bucket.weight += Math.max(0, Number(entry.weight) || 0)
    bucket.entries.push(entry)
    families.set(familyId, bucket)
  })
  return [...families.values()]
}

function canAdd(state, base, affixType) {
  const key = affixType === 'prefix' ? 'prefixes' : 'suffixes'
  const limit = state.rarity === 'rare' ? base.maxAffixes[affixType] : 1
  return state[key].length < limit
}

export function rollTierValues(tier, rng = Math.random) {
  return (tier.values ?? []).map((range) => {
    const min = Number(range.min)
    const max = Number(range.max)
    if (!Number.isFinite(min) || !Number.isFinite(max)) return 0
    return min + Math.floor(rng() * (Math.max(min, max) - min + 1))
  })
}

export function renderRolledText(text, values = []) {
  let index = 0
  return String(text || '').replace(/\([+-]?\d+(?:\.\d+)?\s*[—–-]\s*[+-]?\d+(?:\.\d+)?\)|#/g, () => String(values[index++] ?? '#'))
}

export function rolledAffix(modifier, tier, rng, extra = {}) {
  const rolledValues = rollTierValues(tier, rng)
  return {
    goalId: modifier.goalId,
    modifierId: modifier.id,
    optionId: extra.optionId ?? null,
    tierId: tier.id,
    groupId: modifier.groupId,
    source: extra.source ?? modifier.influences?.[0] ?? modifier.source ?? 'natural',
    sourceItemId: extra.sourceItemId ?? null,
    sourceItemName: extra.sourceItemName ?? '',
    fractured: Boolean(extra.fractured),
    veiled: Boolean(extra.veiled),
    affixType: modifier.affixType,
    name: modifier.name,
    tierName: tier.name,
    text: tier.text,
    rolledText: renderRolledText(tier.text, rolledValues),
    valueRanges: structuredClone(tier.values ?? []),
    rolledValues,
    displayTags: structuredClone(tier.displayTags ?? modifier.displayTags ?? []),
    weight: Number(tier.weight) || 0,
    metaCraft: Boolean(extra.metaCraft)
  }
}

export function craftedAffixes(state) {
  return [...state.prefixes, ...state.suffixes].filter((entry) => entry.source === 'crafted')
}

export function canAddCraftedAffix(state, base, affixType, groupId) {
  if (!canAdd(state, base, affixType)) return false
  if ([...state.prefixes, ...state.suffixes].some((entry) => entry.groupId === groupId)) return false
  const count = craftedAffixes(state).length
  return state.meta.multimod ? count < 3 : count === 0
}

export const BENCH_META_CRAFTS = [
  { id: 'lock-prefixes', name: '前缀无法被变更', flag: 'prefixesLocked', affixType: 'suffix', cost: 2, consequences: '后续尊重元工艺的重铸或移除会保留现有前缀；元工艺本身占用一条后缀' },
  { id: 'lock-suffixes', name: '后缀无法被变更', flag: 'suffixesLocked', affixType: 'prefix', cost: 2, consequences: '后续尊重元工艺的重铸或移除会保留现有后缀；元工艺本身占用一条前缀' },
  { id: 'cannot-roll-attack', name: '无法骰出攻击词缀', flag: 'cannotRollAttack', affixType: 'suffix', cost: 1, consequences: '后续尊重元工艺的新增或重铸不会生成带攻击标签的词缀' },
  { id: 'cannot-roll-caster', name: '无法骰出法术词缀', flag: 'cannotRollCaster', affixType: 'suffix', cost: 1, consequences: '后续尊重元工艺的新增或重铸不会生成带施法标签的词缀' },
  { id: 'multimod', name: '可以拥有最多 3 个工艺词缀', flag: 'multimod', affixType: 'suffix', cost: 2, consequences: '允许最多三条工艺词缀；本元工艺自身计入一条' }
]

export function rebuildMetaState(state) {
  state.meta = { prefixesLocked: false, suffixesLocked: false, cannotRollAttack: false, cannotRollCaster: false, multimod: false }
  for (const affix of craftedAffixes(state)) {
    const definition = BENCH_META_CRAFTS.find((entry) => affix.groupId === `bench-meta:${entry.id}` || affix.modifierId === `bench-meta:${entry.id}`)
    if (definition) state.meta[definition.flag] = true
  }
  return state
}

export function removeCraftedAffixes(state) {
  state.prefixes = state.prefixes.filter((entry) => entry.source !== 'crafted' || entry.fractured)
  state.suffixes = state.suffixes.filter((entry) => entry.source !== 'crafted' || entry.fractured)
  rebuildMetaState(state)
  if (state.rarity === 'magic' && state.prefixes.length + state.suffixes.length === 0) state.rarity = 'normal'
  return state
}

export function addRandomAffix(context, { tag = null, forcedType = null, sources = null, poolTransform = null } = {}) {
  const { state, dataset, base, request, rng } = context
  const types = ['prefix', 'suffix'].filter((type) => canAdd(state, base, type))
  if (!types.length) return false
  if (forcedType && !types.includes(forcedType)) return false
  const poolOptions = { source: 'natural', sources, tag, affixType: forcedType, poolTransform }
  let pool = context.resolveEligibleModifierTiers
    ? context.resolveEligibleModifierTiers(state, poolOptions)
    : eligibleModifierTiers(dataset, base, request.itemLevel, request.variant, state, poolOptions)
  pool = pool.filter((entry) => types.includes(entry.modifier.affixType))
  if (state.meta.cannotRollAttack) pool = pool.filter((entry) => !entry.modifier.tags.includes('attack') && !entry.modifier.tags.includes('攻击'))
  if (state.meta.cannotRollCaster) pool = pool.filter((entry) => !entry.modifier.tags.includes('caster') && !entry.modifier.tags.includes('法术'))
  const selectedFamily = pickWeighted(bucketModifierFamilies(pool), rng)
  const selected = selectedFamily ? pickWeighted(selectedFamily.entries, rng) : null
  if (!selected) return false
  const affixType = selected.modifier.affixType
  state[affixType === 'prefix' ? 'prefixes' : 'suffixes'].push(rolledAffix(selected.modifier, selected.tier, context.rollValueRng ?? (() => 0.5)))
  return true
}

function rollAffixCount(rarity, rng) {
  if (rarity === 'magic') return rng() < 0.5 ? 1 : 2
  const roll = rng()
  return roll < 0.4 ? 4 : roll < 0.75 ? 5 : 6
}

export function rollItem(context, rarity, { requiredTag = null, guaranteedAffix = null, guaranteedAffixes = null, sources = null, poolTransform = null, luckyValues = false } = {}) {
  const state = context.state
  clearMutableAffixes(state)
  state.rarity = rarity
  const targetCount = Math.min(rollAffixCount(rarity, context.rng), context.base.maxAffixes.prefix + context.base.maxAffixes.suffix)
  const forcedAffixes = guaranteedAffixes ?? (guaranteedAffix ? [guaranteedAffix] : [])
  const valueRng = luckyValues ? () => Math.max(context.rollValueRng(), context.rollValueRng()) : context.rollValueRng
  for (const forced of forcedAffixes) {
    const { modifier, tier, sourceItem } = forced
    const key = modifier.affixType === 'prefix' ? 'prefixes' : 'suffixes'
    if (!canAdd(state, context.base, modifier.affixType)) throw new Error('该底材没有容纳全部保证词缀的位置')
    if ([...state.prefixes, ...state.suffixes].some((entry) => entry.groupId === modifier.groupId)) throw new Error(`保证词缀发生 Mod Group 冲突：${modifier.groupId}`)
    state[key].push(rolledAffix(modifier, tier, valueRng ?? (() => 0.5), {
      source: forced.source ?? modifier.source ?? 'essence', sourceItemId: sourceItem?.id ?? null, sourceItemName: sourceItem?.name ?? '',
      veiled: forced.veiled
    }))
  }
  if (requiredTag && !addRandomAffix({ ...context, rollValueRng: valueRng }, { tag: requiredTag, sources, poolTransform })) {
    throw new Error(`当前状态没有可生成的 ${requiredTag} 保证词缀`)
  }
  let guard = 0
  while (state.prefixes.length + state.suffixes.length < targetCount && guard++ < 20) {
    if (!addRandomAffix({ ...context, rollValueRng: valueRng }, { sources, poolTransform })) break
  }
  rebuildMetaState(state)
  return state
}

function currencyProvider(id, name, description, requirements, consequences, destructive, canApply, unavailableReason, apply) {
  return {
    id: `currency:${id}`, name, category: 'currency', description, requirements, consequences, destructive,
    canApply: (context) => !immutableEquipmentReason(context.state) && canApply(context),
    unavailableReason: (context) => immutableEquipmentReason(context.state) || unavailableReason(context),
    apply
  }
}

export function fracturingOrbUnavailableReason({ state, request, base }) {
  const affixes = [...state.prefixes, ...state.suffixes]
  if (state.corrupted) return '已腐化物品不能使用破溃宝珠'
  if (state.rarity !== 'rare') return '破溃宝珠只能用于稀有物品'
  if (affixes.length < 4) return '破溃宝珠要求物品至少有 4 条显式词缀'
  if (affixes.some((affix) => affix.veiled || affix.source === 'veiled-pending')) return '请先揭露未揭露的加密词缀，再使用破溃宝珠'
  if (affixes.some((affix) => affix.fractured) || request.variant.kind === 'fractured') return '已有破裂词缀的物品不能再次使用破溃宝珠'
  if (state.influences.length || request.variant.kind === 'influenced') return '势力物品不能使用破溃宝珠'
  if (request.variant.kind === 'synthesized') return '综合物品不能使用破溃宝珠'
  if (!base.allowedVariants.includes('fractured')) return '该底材不支持破裂状态'
  return ''
}

function immutableEquipmentReason(state) {
  if (state.corrupted) return '已腐化物品不能使用该普通通货'
  if (state.mirrored) return '镜像物品不能被修改'
  return ''
}

function mirrorOfKalandraReason({ state, base }) {
  if (state.mirrored) return '镜像副本不能再次复制'
  if (state.corrupted) return '已腐化物品不能使用卡兰德之镜'
  if (!base) return '卡兰德之镜只能用于可装备的非传奇物品'
  if (state.rarity === 'unique') return '传奇物品不能使用卡兰德之镜'
  return ''
}

function qualityCurrencyReason({ state, base }, type) {
  const immutable = immutableEquipmentReason(state)
  if (immutable) return immutable
  if (base.qualityType !== type) return type === 'weapon' ? '磨刀石只能用于武器' : '护甲片只能用于护甲'
  if (state.quality >= 20) return '该物品已经达到普通品质上限 20%'
  return ''
}

function jewellersReason({ state, base, request }) {
  const immutable = immutableEquipmentReason(state)
  if (immutable) return immutable
  const maximum = naturalSocketLimit(base, request.itemLevel)
  if (!maximum) return '该底材不能拥有彩色插槽'
  if (state.sockets.length >= maximum) return `该物品已经拥有自然上限 ${maximum} 个插槽`
  return ''
}

function chromaticReason({ state }) {
  return immutableEquipmentReason(state) || (!state.sockets.length ? '当前物品没有可重铸的插槽' : '')
}

function fusingReason({ state }) {
  const immutable = immutableEquipmentReason(state)
  if (immutable) return immutable
  if (state.sockets.length < 2) return '链接石要求物品至少有 2 个插槽'
  if (state.links.length === 1 && state.links[0].length === state.sockets.length) return '当前物品的全部插槽已经连接'
  return ''
}

function blessedTargets(state) {
  return [...state.baseImplicits, ...['exarch', 'eater'].map((source) => state.eldritchImplicits[source]).filter(Boolean)]
}

function blessedReason({ state }) {
  const immutable = immutableEquipmentReason(state)
  if (immutable) return immutable
  return blessedTargets(state).some((entry) => entry.valueRanges?.some((range) => Number(range.max) > Number(range.min))) ? '' : '当前物品没有可重掷数值的固有词缀'
}

function sacredReason({ state, base }) {
  if (base.qualityType !== 'armour') return '圣玉只能用于护甲'
  if (!hasVariableBaseDefences(state.baseStats)) return '该护甲没有可重骰的基础防御范围'
  return ''
}

function bindingReason({ state }) {
  return immutableEquipmentReason(state) || (state.rarity !== 'normal' ? '束缚石只能用于普通物品' : '')
}

function catalystReason({ state, base }, type, tainted = false) {
  if (!JEWELLERY_ITEM_CLASSES.includes(base.itemClass)) return '催化剂只能用于戒指、项链或腰带'
  if (state.mirrored) return '镜像物品不能被修改'
  if (tainted) return state.corrupted ? '' : '污秽催化剂只能用于已腐化首饰'
  if (state.corrupted) return '常规催化剂不能用于已腐化首饰'
  if (state.catalystQuality.type === type && state.catalystQuality.amount >= 20) return `当前${type === 'prefix' ? '前缀' : type === 'suffix' ? '后缀' : '催化剂'}品质已达 20%`
  return ''
}

function catalystProviders() {
  const regular = CATALYST_DEFINITIONS.map((definition) => ({
    id: definition.id,
    name: definition.name,
    category: 'currency',
    description: `为首饰添加强化${definition.label}词缀的品质。`,
    requirements: '未腐化、未镜像的非传奇戒指、项链或腰带',
    consequences: '同类型按物品等级增加品质；不同类型替换原品质并从 0% 重新增加；最高 20%',
    destructive: false,
    cost: [{ resourceId: definition.resourceId, resourceName: definition.name, amount: 1 }],
    canApply: (context) => !catalystReason(context, definition.type),
    unavailableReason: (context) => catalystReason(context, definition.type),
    apply: ({ state, request, rng }) => {
      state.catalystQuality = applyCatalystQuality(state.catalystQuality, definition.type, request.itemLevel, rng)
      return state
    }
  }))
  return [...regular, {
    id: 'currency:catalyst-tainted',
    name: '污秽催化剂',
    category: 'currency',
    description: '为已腐化首饰应用随机品质类型和随机品质值。',
    requirements: '已腐化、未镜像的非传奇戒指、项链或腰带',
    consequences: '替换原品质，随机获得一种非污秽品质类型和 1–20% 品质',
    destructive: true,
    probabilityModel: CATALYST_MODEL_VERSION,
    cost: [{ resourceId: 'currency:catalyst-tainted', resourceName: '污秽催化剂', amount: 1 }],
    canApply: (context) => !catalystReason(context, null, true),
    unavailableReason: (context) => catalystReason(context, null, true),
    apply: ({ state, rng }) => { state.catalystQuality = rollTaintedCatalyst(rng); return state }
  }]
}

function vaalOrbReason({ state, base, dataset, request }) {
  if (state.mirrored) return '镜像物品不能被修改'
  if (state.corrupted) return '物品已经腐化，不能再次使用瓦尔宝珠'
  if (/Jewel/.test(base.itemClass)) return '珠宝具有专属腐化与传奇转换结果，当前尚未支持'
  if (!corruptedImplicitCandidates(dataset, base, request.itemLevel).length) return '当前装备类别没有已验证的瓦尔腐化隐式池'
  return ''
}

function taintedProviders() {
  return TAINTED_CURRENCIES.map((definition) => {
    const common = {
      ...definition, category: 'currency', description: definition.effect,
      requirements: definition.requirements ?? '已腐化、未镜像的适用装备',
      consequences: definition.consequences ?? definition.effect, destructive: true,
      cost: [{ resourceId: definition.id, resourceName: definition.name, amount: 1 }]
    }
    if (definition.supportLevel !== 'supported') return {
      ...common, canApply: () => false,
      unavailableReason: (context) => taintedCommonReason(context) || definition.unsupportedReason,
      apply: () => { throw new Error(definition.unsupportedReason) }
    }
    const kind = definition.id.endsWith('chromatic') ? 'chromatic' : definition.id.endsWith('jewellers') ? 'jewellers' : 'fusing'
    return {
      ...common, probabilityModel: TAINTED_SOCKET_MODEL_VERSION,
      canApply: (context) => !taintedSocketReason(context, kind),
      unavailableReason: (context) => taintedSocketReason(context, kind),
      apply: (context) => {
        if (kind === 'chromatic') return rerollTaintedSocketColours(context.state, context.rng)
        if (kind === 'jewellers') return applyTaintedJewellers(context.state, context.base, context.request.itemLevel, context.rng).state
        return applyTaintedFusing(context.state, context.rng).state
      }
    }
  })
}

function seasonalBoundaryProviders() {
  return CURRENT_EQUIPMENT_CURRENCIES.map((definition) => ({
    ...definition,
    category: 'currency',
    description: definition.effect,
    consequences: definition.effect,
    destructive: definition.id !== 'currency:refracting-fog',
    supportLevel: 'missing-item-model',
    cost: [{ resourceId: definition.id, resourceName: definition.name, amount: 1 }],
    canApply: () => false,
    unavailableReason: () => definition.unsupportedReason,
    apply: () => { throw new Error(definition.unsupportedReason) }
  }))
}

function applyVaalOrb(context) {
  const { state, base, dataset, request, rng } = context
  const outcome = rollVaalOutcome(rng)
  state.corruptionOutcome = outcome
  state.corruptionReplacedImplicit = null
  if (outcome === 'implicit') {
    const implicit = rollCorruptedImplicit(dataset, base, request.itemLevel, rng)
    if (implicit) state.corruptionReplacedImplicit = replaceImplicitWithVaal(state, implicit, rng)
  } else if (outcome === 'white-sockets') {
    whitenSockets(state, rng)
  } else if (outcome === 'rare-reforge') {
    clearMutableAffixes(state)
    state.rarity = 'rare'
    let guard = 0
    while (state.prefixes.length < base.maxAffixes.prefix && guard++ < 20 && addRandomAffix(context, { forcedType: 'prefix', sources: ['natural'] })) {}
    guard = 0
    while (state.suffixes.length < base.maxAffixes.suffix && guard++ < 20 && addRandomAffix(context, { forcedType: 'suffix', sources: ['natural'] })) {}
    rebuildMetaState(state)
    const maximum = naturalSocketLimit(base, request.itemLevel)
    if (maximum) {
      const jackpot = maximum === 6 && rng() < 1 / 36
      const count = jackpot ? 6 : rollSocketCount(maximum, state.quality, null, rng)
      state.sockets = createSockets(count, base.requirements, rng)
      state.links = jackpot ? fullLinks(state.sockets) : rollLinks(state.sockets, state.quality, rng)
    }
  }
  state.corrupted = true
  return state
}

export function createCurrencyProviders() {
  return [
    ...catalystProviders(),
    ...taintedProviders(),
    ...seasonalBoundaryProviders(),
    {
      id: 'currency:mirror-of-kalandra', name: '卡兰德之镜', category: 'currency',
      description: '创建当前装备的一件镜像副本，原件保持不变。',
      requirements: '未腐化、未镜像的可装备非传奇物品',
      consequences: '副本保留原件的全部属性、词缀数值、品质、孔色与连接，并且不能再被制作通货修改',
      destructive: false,
      cost: [{ resourceId: 'currency:mirror-of-kalandra', resourceName: '卡兰德之镜', amount: 1 }],
      canApply: (context) => !mirrorOfKalandraReason(context),
      unavailableReason: mirrorOfKalandraReason,
      apply: ({ state }) => { state.mirrored = true; return state }
    },
    {
      id: 'currency:vaal', name: '瓦尔宝珠', category: 'currency',
      description: '腐化装备并等权产生腐化隐式、白孔、六词缀稀有重铸或仅腐化结果。',
      requirements: '未腐化、未镜像且具有已验证腐化隐式池的非传奇、非珠宝装备',
      consequences: '装备永久腐化；大多数通货将不能再使用', destructive: true,
      probabilityModel: VAAL_MODEL_VERSION,
      cost: [{ resourceId: 'currency:vaal', resourceName: '瓦尔宝珠', amount: 1 }],
      canApply: (context) => !vaalOrbReason(context), unavailableReason: vaalOrbReason,
      apply: applyVaalOrb,
      outcomeLabels: VAAL_OUTCOME_LABELS
    },
    currencyProvider('blacksmith-whetstone', '磨刀石', '提高武器品质，单次提升量取决于物品等级。', '未腐化、未镜像且品质低于 20% 的武器', '品质提高会按每 1% 提供 1% more 基础物理伤害，并改善孔数和连接结果', false, (context) => !qualityCurrencyReason(context, 'weapon'), (context) => qualityCurrencyReason(context, 'weapon'), ({ state, request, rng }) => { state.quality = Math.min(20, state.quality + qualityGainForItemLevel(request.itemLevel, rng)); return state }),
    currencyProvider('armourers-scrap', '护甲片', '提高护甲品质，单次提升量取决于物品等级。', '未腐化、未镜像且品质低于 20% 的护甲', '品质提高会按每 1% 提供 1% more 基础防御，并改善孔数和连接结果', false, (context) => !qualityCurrencyReason(context, 'armour'), (context) => qualityCurrencyReason(context, 'armour'), ({ state, request, rng }) => { state.quality = Math.min(20, state.quality + qualityGainForItemLevel(request.itemLevel, rng)); return state }),
    {
      ...currencyProvider('jewellers', '珠宝匠石', '重铸装备的插槽数量。', '未腐化、未镜像、可打孔且尚未达到自然最大孔数', '生成与原数量不同的合法插槽，并同时重铸孔色和连接', true, (context) => !jewellersReason(context), jewellersReason, ({ state, base, request, rng }) => {
        const count = rollSocketCount(naturalSocketLimit(base, request.itemLevel), state.quality, state.sockets.length, rng)
        state.sockets = createSockets(count, base.requirements, rng)
        state.links = rollLinks(state.sockets, state.quality, rng)
        return state
      }),
      probabilityModel: SOCKET_MODEL_VERSION
    },
    currencyProvider('chromatic', '幻色石', '重铸物品现有插槽的颜色。', '未腐化、未镜像且至少有一个插槽', '孔数和连接保持不变；力量偏红、敏捷偏绿、智慧偏蓝', false, (context) => !chromaticReason(context), chromaticReason, ({ state, base, rng }) => { state.sockets = state.sockets.map((socket) => ({ ...socket, color: rollSocketColor(base.requirements, rng) })); return state }),
    {
      ...currencyProvider('fusing', '链接石', '重铸物品插槽之间的连接。', '未腐化、未镜像、至少两个插槽且尚未全部连接', '孔数和孔色保持不变，仅重铸连接关系', true, (context) => !fusingReason(context), fusingReason, ({ state, rng }) => { state.links = rollLinks(state.sockets, state.quality, rng); return state }),
      probabilityModel: SOCKET_MODEL_VERSION
    },
    currencyProvider('blessed', '祝福石', '重铸物品已建模固有词缀的可变数值。', '未腐化、未镜像且至少有一个可变普通或古灵固有词缀', '固有词缀种类不变，普通或古灵固有数值被重铸；未结构化的忆境隐式不会被伪造', false, (context) => !blessedReason(context), blessedReason, ({ state, rng }) => {
      const sources = ['exarch', 'eater'].filter((source) => state.eldritchImplicits[source])
      const combined = [...state.baseImplicits, ...sources.map((source) => state.eldritchImplicits[source])]
      const result = rerollEntriesDifferent(combined, rng).entries
      state.baseImplicits = result.slice(0, state.baseImplicits.length)
      sources.forEach((source, index) => { state.eldritchImplicits[source] = result[state.baseImplicits.length + index] })
      return state
    }),
    {
      ...currencyProvider('sacred', '圣玉', '重骰护甲的基础防御百分比。', '未腐化、未镜像且具有可变基础护甲、闪避值、能量护盾或结界的护甲', '整件护甲使用一个新的共享基础防御百分比；品质、孔位、隐式和显式词缀不变', false, (context) => !sacredReason(context), sacredReason, ({ state, rng }) => {
        const result = rerollBaseDefences(state.baseStats, rng)
        state.baseStats = result.entries
        state.baseDefencePercentile = result.percentile
        return state
      }),
      cost: [{ resourceId: 'currency:sacred', resourceName: '圣玉', amount: 1 }]
    },
    currencyProvider('binding', '束缚石', '将普通物品升级为稀有物品，并生成最多四个相连插槽。', '未腐化、未镜像的普通物品', '生成四至六条随机稀有词缀；插槽结果忽略物品等级但仍受底材类型上限限制', false, (context) => !bindingReason(context), bindingReason, (context) => {
      rollItem(context, 'rare')
      const count = Math.min(4, context.base.socketLimit)
      context.state.sockets = createSockets(count, context.base.requirements, context.rng)
      context.state.links = count ? fullLinks(context.state.sockets) : []
      return context.state
    }),
    currencyProvider('transmutation', '蜕变石', '将普通物品升级为魔法物品。', '仅普通、未腐化装备', '生成一至两条随机魔法词缀', false, ({ state }) => state.rarity === 'normal', () => '蜕变石仅能用于普通物品', (context) => rollItem(context, 'magic')),
    currencyProvider('alteration', '改造石', '重置魔法物品上的全部显式词缀。', '仅魔法、未腐化装备', '原有可变词缀被一至两条新词缀替换', true, ({ state }) => state.rarity === 'magic', () => '改造石仅能重铸魔法物品', (context) => rollItem(context, 'magic')),
    currencyProvider('augmentation', '增幅石', '为只有一条词缀的魔法物品增加一条随机词缀。', '魔法物品且仍有词缀位', '保留原词缀并增加一条合法词缀', false, ({ state, base }) => state.rarity === 'magic' && state.prefixes.length + state.suffixes.length < 2 && (canAdd(state, base, 'prefix') || canAdd(state, base, 'suffix')), ({ state }) => state.rarity !== 'magic' ? '增幅石仅能用于魔法物品' : '该魔法物品已经拥有两条词缀', (context) => { addRandomAffix(context); return context.state }),
    currencyProvider('regal', '富豪石', '将魔法物品升级为稀有物品并增加一条词缀。', '仅魔法、未腐化装备', '保留现有词缀，升级为稀有并增加一条合法词缀', false, ({ state }) => state.rarity === 'magic', () => '富豪石仅能用于魔法物品', (context) => { context.state.rarity = 'rare'; addRandomAffix(context); return context.state }),
    currencyProvider('alchemy', '点金石', '将普通物品升级为稀有物品。', '仅普通、未腐化装备', '生成四至六条随机稀有词缀', false, ({ state }) => state.rarity === 'normal', () => '点金石仅能用于普通物品', (context) => rollItem(context, 'rare')),
    currencyProvider('chaos', '混沌石', '用新的随机属性重铸一件稀有物品。', '仅稀有、未腐化装备', '现有可变显式词缀被四至六条新词缀替换', true, ({ state }) => state.rarity === 'rare', () => '混沌石仅能重铸稀有物品', (context) => rollItem(context, 'rare')),
    currencyProvider('scouring', '重铸石', '移除物品上的全部可变显式词缀。', '魔法或稀有、未腐化装备', '清空可变词缀并变为普通物品', true, ({ state }) => state.rarity !== 'normal', () => '普通物品没有可重铸的显式词缀', (context) => { clearMutableAffixes(context.state); context.state.rarity = context.state.prefixes.length + context.state.suffixes.length ? 'rare' : 'normal'; return context.state }),
    currencyProvider('exalted', '崇高石', '为稀有物品增加一条新的随机词缀。', '稀有物品且仍有词缀位', '保留现有词缀并增加一条合法词缀', false, ({ state, base }) => state.rarity === 'rare' && (canAdd(state, base, 'prefix') || canAdd(state, base, 'suffix')), ({ state }) => state.rarity !== 'rare' ? '崇高石仅能用于稀有物品' : '该稀有物品没有可添加的词缀位', (context) => { addRandomAffix(context); return context.state }),
    currencyProvider('annulment', '剥离石', '随机移除一条可变显式词缀。', '至少有一条可变显式词缀', '随机移除一条前缀或后缀', true, ({ state }) => mutableAffixes(state).length > 0, () => '当前物品没有可移除的显式词缀', (context) => { const pool = mutableAffixes(context.state); removeAffix(context.state, pool[Math.floor(context.rng() * pool.length)]); return context.state }),
    currencyProvider('divine', '神圣石', '重骰物品上随机显式词缀的数值。', '至少有一条带随机区间的显式词缀', '词缀种类和阶级不变，仅在原区间内重骰数值', false, ({ state }) => [...state.prefixes, ...state.suffixes].some((entry) => entry.valueRanges?.length), () => '当前物品没有可重骰数值的显式词缀', ({ state, rng }) => {
      ;[...state.prefixes, ...state.suffixes].forEach((entry) => {
        if (!entry.valueRanges?.length) return
        entry.rolledValues = rollTierValues({ values: entry.valueRanges }, rng)
        entry.rolledText = renderRolledText(entry.text, entry.rolledValues)
      })
      return state
    }),
    currencyProvider(
      'fracturing', '破溃宝珠',
      '随机破裂一件至少有 4 条词缀的稀有物品上的一条显式词缀。',
      '未腐化、非势力、非综合、尚未破裂的稀有物品，至少 4 条已揭露显式词缀',
      '全部显式词缀等概率参与；被选中的词缀永久锁定，原阶级、数值和来源不变',
      true,
      (context) => !fracturingOrbUnavailableReason(context),
      fracturingOrbUnavailableReason,
      ({ state, rng }) => {
        const candidates = [...state.prefixes, ...state.suffixes]
        const selected = candidates[Math.floor(rng() * candidates.length)]
        selected.fractured = true
        return state
      }
    )
  ]
}

function metaProvider(definition) {
  const { id, name, flag, affixType } = definition
  const groupId = `bench-meta:${id}`
  return {
    id: `bench:${id}`, name, category: 'bench', definition,
    canApply: ({ state, base }) => !state.corrupted && canAddCraftedAffix(state, base, affixType, groupId),
    apply: ({ state }) => {
      if (state.rarity === 'normal') state.rarity = 'magic'
      const key = affixType === 'prefix' ? 'prefixes' : 'suffixes'
      state[key].push({
        goalId: groupId, modifierId: groupId, optionId: `bench:${id}`, tierId: `bench:${id}`,
        groupId, source: 'crafted', sourceItemId: null, sourceItemName: '', fractured: false,
        affixType, name, tierName: '工艺台', text: name, rolledText: name,
        valueRanges: [], rolledValues: [], displayTags: [{ id: 'meta', label: '元工艺' }], weight: 0, metaCraft: true
      })
      state.meta[flag] = true
      return state
    }
  }
}

export function createBenchProviders() {
  return [
    ...BENCH_META_CRAFTS.map(metaProvider),
    {
      id: 'bench:add-crafted', name: '添加工艺词缀', category: 'bench',
      canApply: ({ state, base, modifier, option }) => !state.corrupted && Boolean(option) && canAddCraftedAffix(state, base, modifier.affixType, modifier.groupId),
      apply: ({ state, modifier, option, rng, rollValueRng }) => {
        if (state.rarity === 'normal') state.rarity = 'magic'
        state[modifier.affixType === 'prefix' ? 'prefixes' : 'suffixes'].push(rolledAffix(modifier, option, rollValueRng ?? rng ?? (() => 0.5), { optionId: option.optionId, source: 'crafted' }))
        return state
      }
    },
    {
      id: 'bench:remove-crafted', name: '移除工艺词缀', category: 'bench',
      canApply: ({ state }) => !state.corrupted && craftedAffixes(state).some((entry) => !entry.fractured),
      apply: ({ state }) => removeCraftedAffixes(state)
    },
    {
      id: 'bench:remove-enchantments', name: '移除附魔', category: 'bench',
      canApply: ({ state }) => !state.mirrored && Boolean(state.enchanted || state.qualityEffect),
      unavailableReason: ({ state }) => state.mirrored ? '镜像物品不能被修改' : '当前装备没有可移除的附魔',
      apply: ({ state }) => {
        state.enchanted = false
        state.qualityEffect = ''
        return state
      }
    }
  ]
}

export function createHarvestProviders() {
  return [
    {
      id: 'harvest:reforge-tag', name: '花园标签重铸', category: 'harvest',
      canApply: ({ state, tag }) => state.rarity === 'rare' && Boolean(tag),
      apply: (context) => rollItem(context, 'rare', { requiredTag: context.tag })
    }
  ]
}

export function createDefaultActionRegistry() {
  const registry = new CraftActionRegistry()
  ;[...createCurrencyProviders(), ...createBenchProviders(), ...createHarvestProviders()].forEach((provider) => registry.register(provider))
  return registry
}

export function applyAction(registry, id, context) {
  return registry.apply(id, { ...context, state: cloneCraftState(context.state), rng: context.rng ?? Math.random })
}
