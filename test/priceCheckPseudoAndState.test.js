import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { auditPseudoRules, loadTradeCatalog, validateTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { createPseudoStats } from '../electron/modules/priceCheck/pseudo.js'
import {
  buildOfficialTradeQuery,
  createPriceCheckModel,
  refreshPseudoStats,
  sanitizePriceCheckModel
} from '../electron/modules/priceCheck/query.js'
import {
  PRICE_CHECK_STATE_FILTERS,
  PRICE_CHECK_STAT_TYPES,
  createPriceCheckStateFilters,
  sanitizePriceCheckStateFilters
} from '../shared/priceCheckMetadata.js'

const catalogPath = path.resolve('electron/modules/priceCheck/catalog.json')
const bounds = (values) => {
  const value = Math.min(...values)
  return value < 0 ? { min: undefined, max: value } : { min: value, max: undefined }
}

test('状态白名单区分明确肯定、未鉴定否定和任意默认', () => {
  const facts = { identified: true, corrupted: false, mirrored: true, split: true }
  const created = createPriceCheckStateFilters(facts)
  assert.equal(created.identified, 'any')
  assert.equal(created.corrupted, 'any')
  assert.equal(created.mirrored, 'true')
  assert.equal(created.split, 'true')
  assert.equal(created.fractured, 'any')
  const sanitized = sanitizePriceCheckStateFilters({ ...created, corrupted: 'invalid', split: 'false', injected: 'true' }, facts)
  assert.equal(sanitized.corrupted, 'any')
  assert.equal(sanitized.split, 'false')
  assert.equal('injected' in sanitized, false)
  const unidentified = createPriceCheckStateFilters({ ...facts, identified: false })
  assert.equal(unidentified.identified, 'false')
  assert.equal(sanitizePriceCheckStateFilters({ identified: 'invalid' }, { identified: false }).identified, 'false')
})

test('秽生与已有状态事实解析为是且其余状态默认任意', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const item = parseItemInfo([
    '物品类别: 手套', '稀 有 度: 稀有', '测试手套', '术士手套', '--------',
    '物品等级: 86', '--------', '秽生物品', '忆境物品', '焚界者物品', '灭界者物品', '分裂之物', '已分裂', '已复制', '已腐化'
  ].join('\n'))
  const model = createPriceCheckModel(item, catalog, { initialSelection: 'none' })
  assert.equal(item.isMutated, true)
  assert.deepEqual(model.facts, {
    identified: true, corrupted: true, mirrored: true, fractured: true, split: true,
    mutated: true, synthesised: true, searing: true, tangled: true, crafted: false, veiled: false
  })
  assert.deepEqual(model.stateFilters, {
    identified: 'any', corrupted: 'true', mirrored: 'true', fractured: 'true', split: 'true',
    mutated: 'true', synthesised: 'true', searing: 'true', tangled: 'true', crafted: 'any', veiled: 'any'
  })
})

test('工艺和影匿词缀明确存在时初始化为是', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const model = createPriceCheckModel({
    category: '项链', rarity: '稀有', name: '测试', baseName: '瑚珀护身符',
    modifiers: [
      { type: 'crafted', text: '+10 最大生命' },
      { type: 'veiled', name: '艾尔雷恩的影匿', text: '影匿前缀' }
    ]
  }, catalog, { initialSelection: 'none' })
  assert.equal(model.facts.crafted, true)
  assert.equal(model.facts.veiled, true)
  assert.equal(model.stateFilters.crafted, 'true')
  assert.equal(model.stateFilters.veiled, 'true')
  assert.equal(model.stateFilters.identified, 'any')
})

test('复制文本明确包含未鉴定时已鉴定条件默认为否', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const item = parseItemInfo([
    '物品类别: 深渊珠宝', '稀 有 度: 稀有', '凶残之凝珠', '--------',
    '深渊', '--------', '物品等级: 85', '--------', '未鉴定'
  ].join('\n'))
  const model = createPriceCheckModel(item, catalog, { initialSelection: 'none' })
  assert.equal(model.facts.identified, false)
  assert.equal(model.stateFilters.identified, 'false')
  assert.equal(buildOfficialTradeQuery(model).query.filters.misc_filters.filters.identified.option, 'false')
})

test('所有非任意状态使用国服官方 misc_filters 字段并保持已鉴定正向语义', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const model = createPriceCheckModel({ category: '手套', rarity: '稀有', name: '测试', baseName: '术士手套' }, catalog, { initialSelection: 'none' })
  const defaults = buildOfficialTradeQuery(model).query.filters.misc_filters?.filters || {}
  for (const { officialKey } of PRICE_CHECK_STATE_FILTERS) assert.equal(defaults[officialKey], undefined, officialKey)
  model.stateFilters = Object.fromEntries(PRICE_CHECK_STATE_FILTERS.map(({ key }) => [key, 'true']))
  model.stateFilters.mirrored = 'any'
  const filters = buildOfficialTradeQuery(model).query.filters.misc_filters.filters
  for (const { key, officialKey } of PRICE_CHECK_STATE_FILTERS) {
    if (key === 'mirrored') assert.equal(filters[officialKey], undefined)
    else assert.equal(filters[officialKey].option, 'true', officialKey)
  }
  model.stateFilters.identified = 'false'
  assert.equal(buildOfficialTradeQuery(model).query.filters.misc_filters.filters.identified.option, 'false')
})

test('旧布尔模型迁移为三态并由可信事实阻止渲染层篡改事实', () => {
  const legacy = sanitizePriceCheckModel({
    item: { corrupted: true, unidentified: true, fractured: false },
    flags: { mirrored: true, split: false },
    identity: { type: '术士手套' }
  })
  assert.equal(legacy.facts.identified, false)
  assert.equal(legacy.stateFilters.corrupted, 'true')
  assert.equal(legacy.stateFilters.mirrored, 'true')
  assert.equal(legacy.stateFilters.identified, 'false')
  assert.equal(legacy.stateFilters.fractured, 'any')
  assert.equal(legacy.stateFilters.split, 'any')

  const edited = sanitizePriceCheckModel({
    ...legacy,
    facts: { ...legacy.facts, corrupted: false },
    stateFilters: { ...legacy.stateFilters, corrupted: 'invalid', split: 'false' }
  }, null, { ...legacy.facts, corrupted: true })
  assert.equal(edited.facts.corrupted, true)
  assert.equal(edited.stateFilters.corrupted, 'true')
  assert.equal(edited.stateFilters.split, 'false')
})

test('固定综合规则目录无缺口且综合跨来源汇总倍率、替换和恢复偷取', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const audit = auditPseudoRules(catalog)
  assert.equal(audit.usable, 35)
  assert.deepEqual(audit.missingTargets, [])
  assert.deepEqual(audit.missingSources, [])

  let sequence = 0
  const raw = (ref, value, type = 'explicit') => ({
    key: `raw-${sequence++}`,
    id: `${type}.stat_${900000 + sequence}`,
    type,
    refs: [ref],
    values: [value],
    text: ref.replace('#', String(value)),
    sources: [{ ref, refs: [ref], type, values: [value] }],
    enabled: true
  })
  const rawStats = [
    raw('+#% to All Resistances', 10, 'implicit'),
    raw('+#% to Fire and Cold Resistances', 20, 'crafted'),
    raw('+#% to Fire Resistance', 5, 'explicit'),
    raw('+# to maximum Life', 100, 'fractured'),
    raw('+# to all Attributes', 10, 'explicit'),
    raw('#% increased maximum Energy Shield', 30),
    raw('#% increased Attack Speed', 12),
    raw('#% increased Cast Speed', 14),
    raw('#% increased Elemental Damage', 10),
    raw('#% increased Fire Damage', 20),
    raw('#% increased Burning Damage', 30),
    raw('#% increased Spell Damage', 15),
    raw('#% increased Fire Spell Damage', 25),
    raw('#% increased Global Critical Strike Chance', 40),
    raw('#% increased Spell Critical Strike Chance', 50),
    raw('Regenerate # Life per second', 8),
    raw('#% of Physical Attack Damage Leeched as Life', 1.2),
    raw('#% increased Mana Regeneration Rate', 35)
  ]
  const result = createPseudoStats(rawStats, catalog, { initialSelection: 'auto' }, bounds)
  const byId = new Map(result.stats.map((stat) => [stat.id, stat]))
  assert.equal(byId.get('pseudo.pseudo_total_elemental_resistance').values[0], 75)
  assert.equal(byId.get('pseudo.pseudo_total_fire_resistance').values[0], 35)
  assert.equal(byId.get('pseudo.pseudo_total_life').values[0], 105)
  assert.equal(byId.get('pseudo.pseudo_increased_energy_shield').values[0], 30)
  assert.equal(byId.get('pseudo.pseudo_total_attack_speed').values[0], 12)
  assert.equal(byId.get('pseudo.pseudo_total_cast_speed').values[0], 14)
  assert.equal(byId.get('pseudo.pseudo_increased_burning_damage').values[0], 60)
  assert.equal(byId.has('pseudo.pseudo_increased_fire_damage'), false)
  assert.equal(byId.get('pseudo.pseudo_increased_fire_spell_damage').values[0], 40)
  assert.equal(byId.has('pseudo.pseudo_increased_spell_damage'), false)
  assert.equal(byId.get('pseudo.pseudo_critical_strike_chance_for_spells').values[0], 90)
  assert.equal(byId.get('pseudo.pseudo_total_life_regen').values[0], 8)
  assert.equal(byId.get('pseudo.pseudo_physical_attack_damage_leeched_as_life').values[0], 1.2)
  assert.equal(byId.get('pseudo.pseudo_increased_mana_regen').values[0], 35)
  assert.equal(byId.get('pseudo.pseudo_total_life').min, 105)
  assert.equal(byId.get('pseudo.pseudo_total_life').max, undefined)
  assert.ok(byId.get('pseudo.pseudo_total_elemental_resistance').sources.some(({ type }) => type === 'crafted'))
})

test('目录 schema 拒绝重复 ref 和重复综合规则身份', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const duplicatedRef = structuredClone(catalog)
  const entry = duplicatedRef.stats.find((candidate) => candidate.refs?.length)
  entry.refs.push(entry.refs[0])
  assert.throws(() => validateTradeCatalog(duplicatedRef), /稳定 ref 重复/)

  const duplicatedRule = structuredClone(catalog)
  duplicatedRule.pseudoRules.push(structuredClone(duplicatedRule.pseudoRules[0]))
  assert.throws(() => validateTradeCatalog(duplicatedRule), /重复综合规则目标/)
})

test('综合项使用真实 pseudo ID 进入官方查询且默认不重复启用来源词缀', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const model = createPriceCheckModel({
    category: '胸甲', rarity: '稀有', name: '测试', baseName: '龙鳞胸甲',
    modifiers: [
      { type: 'fractured', text: '+96 最大生命' },
      { type: 'crafted', text: '+35% 火焰抗性' }
    ]
  }, catalog, { initialSelection: 'auto' })
  const body = buildOfficialTradeQuery(model)
  const ids = body.query.stats[0].filters.map(({ id }) => id)
  assert.ok(ids.includes('pseudo.pseudo_total_life'))
  assert.ok(ids.includes('pseudo.pseudo_total_elemental_resistance'))
  assert.ok(ids.every((id) => id.startsWith('pseudo.')))
  assert.equal(model.stats.find((stat) => stat.id.startsWith('fractured.')).enabled, false)
  assert.equal(model.stats.find((stat) => stat.id.startsWith('crafted.')).enabled, false)
})

test('手动消歧加入新来源后会沿统一链路重算综合项', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const model = createPriceCheckModel({ category: '胸甲', rarity: '稀有', name: '测试', baseName: '龙鳞胸甲' }, catalog, { initialSelection: 'auto' })
  model.stats.push({
    key: 'explicit:manual-life', id: 'explicit.stat_3299347043', type: 'explicit',
    text: '+100 最大生命', refs: ['+# to maximum Life'], values: [100], enabled: true,
    sources: [{ key: 'explicit:manual-life', type: 'explicit', ref: '+# to maximum Life', refs: ['+# to maximum Life'], values: [100] }]
  })
  refreshPseudoStats(model, catalog, { initialSelection: 'auto' })
  assert.ok(model.stats.some((stat) => stat.id === 'pseudo.pseudo_total_life' && stat.enabled))
  assert.equal(model.stats.find((stat) => stat.id === 'explicit.stat_3299347043').enabled, false)
})

test('综合目标缺失时安全省略，伪造的 namespace 不能通过模型清理', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const missing = structuredClone(catalog)
  missing.stats = missing.stats.filter((entry) => entry.ids?.pseudo !== 'pseudo.pseudo_total_life')
  const result = createPseudoStats([{ key: 'life', id: 'explicit.stat_1', type: 'explicit', refs: ['+# to maximum Life'], values: [100] }], missing, { initialSelection: 'auto' }, bounds)
  assert.equal(result.stats.some((stat) => stat.id === 'pseudo.pseudo_total_life'), false)

  const sanitized = sanitizePriceCheckModel({
    item: {}, identity: { type: '龙鳞胸甲' },
    stats: [
      { id: 'explicit.pseudo_total_life', type: 'pseudo', enabled: true },
      { id: 'pseudo.pseudo_total_life', type: 'pseudo', enabled: true }
    ]
  }, catalog)
  assert.deepEqual(sanitized.stats.map(({ id }) => id), ['pseudo.pseudo_total_life'])
})

test('全部官方 stat 类型都有稳定中文来源标签', () => {
  for (const type of ['pseudo', 'explicit', 'implicit', 'enchant', 'fractured', 'crafted', 'veiled', 'scourge', 'imbued', 'delve', 'sanctum', 'mercenary', 'crucible', 'ultimatum']) {
    assert.ok(PRICE_CHECK_STAT_TYPES[type]?.label, type)
    assert.ok(PRICE_CHECK_STAT_TYPES[type]?.token, type)
  }
})
