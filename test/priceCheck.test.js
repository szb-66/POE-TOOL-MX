import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  createOfficialTradeCatalog,
  loadTradeCatalog,
  matchCatalogStat,
  resolveCatalogStat,
  officialCurrencyLabels,
  tradeCatalogStatus,
  validateTradeCatalog
} from '../electron/modules/priceCheck/catalog.js'
import {
  buildOfficialTradeQuery,
  createPriceCheckModel,
  resolveUnidentifiedUnique,
  sanitizePriceCheckModel
} from '../electron/modules/priceCheck/query.js'
import { PoeCnTradeClient } from '../electron/modules/priceCheck/client.js'
import {
  buildPriceDistribution,
  PriceCheckService,
  summarizeListings
} from '../electron/modules/priceCheck/service.js'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import {
  generateTradeCatalog,
  mergeClipboardStatMatchers,
  parseNdjson
} from '../scripts/generateTradeCatalog.js'
import { captureFreshClipboardText, capturePoeItemText } from '../electron/modules/priceCheck/clipboardCapture.js'
import { SUPPORTED_FORMAT_EXAMPLES } from '../src/utils/supportedItemFormats.js'

const catalogPath = path.resolve('electron/modules/priceCheck/catalog.json')

test('当前官方通用语义与国服翻译目录加载版本、计数和陈旧状态', async () => {
  const { catalog, status } = await loadTradeCatalog(catalogPath, Date.parse('2026-08-11T00:00:00Z'))
  assert.equal(catalog.schemaVersion, 2)
  assert.equal(status.gameVersion, '3.29')
  assert.equal(status.stale, false)
  assert.equal(status.counts.stats, catalog.stats.length)
  assert.ok(status.counts.stats > 17000, `内置词缀目录不完整：${status.counts.stats}`)
  assert.ok(status.counts.items > 6000, `内置物品目录不完整：${status.counts.items}`)
  assert.ok(status.sources.includes('Path of Exile official /api/trade/data/stats'))
  assert.ok(status.sources.includes('腾讯国服官方 /api/trade/data/stats'))
  assert.ok(status.sources.some((source) => source.includes('Sidekick 当前 POE1 游戏描述')))
  assert.ok(catalog.stats.reduce((count, entry) => count + entry.matchers.length, 0) > 60_000, '内置目录缺少当前游戏剪贴板 matcher 桥接')
  assert.ok(Object.keys(catalog.currencyLabels || {}).length > 1_000, '内置目录缺少腾讯官方静态交易名称')
  assert.equal(catalog.currencyLabels.chrome, '幻色石')
  for (const type of ['crucible', 'delve', 'imbued', 'mercenary', 'sanctum', 'ultimatum']) {
    assert.ok(catalog.stats.some((entry) => entry.ids[type]), `内置目录缺少官方 ${type} 命名空间`)
  }
  assert.ok(catalog.stats.some((entry) => Object.values(entry.ids).flat().some((id) => id.includes('|'))), '内置目录缺少官方变体 stat ID')
})

test('内置目录每个词缀 ID 都能由真实 matcher 回放为查询候选', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  for (const entry of catalog.stats) {
    const text = entry.matchers[0].replaceAll('#', '17')
    for (const [type, rawIds] of Object.entries(entry.ids)) {
      const expectedIds = Array.isArray(rawIds) ? rawIds : [rawIds]
      const resolution = resolveCatalogStat(catalog, text, type)
      const candidateIds = new Set(resolution.candidates.map((candidate) => candidate.id))
      for (const id of expectedIds) {
        assert.ok(candidateIds.has(id), `${type} ${id} 无法由 matcher 回放：${entry.matchers[0]}`)
      }
    }
  }
})

test('内置官方物品目录每件记录都能形成身份查询', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  for (const entry of catalog.items) {
    const model = createPriceCheckModel({
      category: '',
      rarity: entry.unique ? '传奇' : '普通',
      name: entry.name,
      baseName: entry.baseType
    }, catalog, { initialSelection: 'none' })
    const body = buildOfficialTradeQuery(model)
    assert.equal(body.query.type, entry.baseType, entry.key)
    if (entry.unique) assert.equal(body.query.name, entry.name, entry.key)
  }
})

test('交易目录允许歧义 matcher 但拒绝重复类型 ID 和无效 stat ID', async () => {
  const raw = JSON.parse(await readFile(catalogPath, 'utf8'))
  const explicitStats = raw.stats.filter((entry) => entry.ids.explicit).slice(0, 2)
  explicitStats[1].matchers = [...explicitStats[0].matchers]
  assert.doesNotThrow(() => validateTradeCatalog(raw))
  explicitStats[1].ids.explicit = explicitStats[0].ids.explicit
  assert.throws(() => validateTradeCatalog(raw), /重复词缀类型 ID/)
  explicitStats[1].matchers = ['#% 火焰抗性']
  explicitStats[1].ids.explicit = 'bad'
  assert.throws(() => validateTradeCatalog(raw), /stat ID 无效/)
})

test('词缀 matcher 提取数字并选择词缀类型 ID', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const life = matchCatalogStat(catalog, '+83 最大生命', 'fractured')
  assert.equal(life.id, 'fractured.stat_3299347043')
  assert.deepEqual(life.values, [83])
  const fireResistance = matchCatalogStat(catalog, '+42% 火焰抗性', 'crafted')
  assert.equal(fireResistance.id, 'crafted.stat_3372524247')
  assert.deepEqual(fireResistance.values, [42])
})

test('稀有装备按 Awakened PoE Trade 的宽松默认生成腾讯官方查询 JSON', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const model = createPriceCheckModel({
    category: '胸甲',
    rarity: '稀有',
    name: '风暴之幕',
    baseName: '龙鳞胸甲',
    level: 84,
    quality: 20,
    links: 6,
    isCorrupted: false,
    modifiers: [{ type: 'prefix', name: '健壮的', text: '83 最大生命' }]
  }, catalog)
  assert.equal(model.stats[0].min, 66.4)
  const body = buildOfficialTradeQuery(model)
  assert.equal(body.query.type, '龙鳞胸甲')
  assert.equal(body.query.status.option, 'available')
  assert.equal(body.query.filters.type_filters.filters.rarity.option, 'nonunique')
  assert.equal(body.query.filters.misc_filters.filters.corrupted.option, 'false')
  assert.equal(body.query.filters.trade_filters, undefined)
  assert.equal(body.query.filters.misc_filters.filters.quality, undefined)
  assert.equal(body.query.filters.misc_filters.filters.ilvl, undefined)
  assert.deepEqual(body.query.stats[0].filters, [])
  assert.equal(model.stats[0].enabled, false)
})

test('国服查询保留可交易集合并使用正确的合并挂单过滤器', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const model = createPriceCheckModel({
    category: '胸甲',
    rarity: '稀有',
    name: '测试',
    baseName: '龙鳞胸甲'
  }, catalog)
  const body = buildOfficialTradeQuery(model, { status: 'available', collapseListings: true })
  assert.equal(body.query.status.option, 'available')
  assert.equal(body.query.collapse, undefined)
  assert.equal(body.query.filters.trade_filters.filters.collapse.option, 'true')
  assert.equal(buildOfficialTradeQuery(model, { status: 'instant' }).query.status.option, 'securable')
  assert.equal(buildOfficialTradeQuery(model, { status: 'any' }).query.status.option, 'any')
})

test('普通复制文本也会把显式词缀加入查价模型', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const item = parseItemInfo([
    '物品类别: 胸甲',
    '稀 有 度: 稀有',
    '胜利之幕',
    '星芒战铠',
    '--------',
    '物品等级: 86',
    '--------',
    '+96 最大生命',
    '+35% 火焰抗性'
  ].join('\n'))
  const model = createPriceCheckModel(item, catalog)
  assert.deepEqual(model.stats.map((stat) => stat.id), [
    'explicit.stat_3299347043',
    'explicit.stat_3372524247'
  ])
})

test('普通白弓不会把分隔线后的物品类别误解析成底材', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const item = parseItemInfo([
    '物品类别: 弓',
    '稀 有 度: 普通',
    '短弓',
    '--------',
    '弓',
    '物理伤害: 6-16',
    '攻击暴击率: 5.00%',
    '每秒攻击次数: 1.50',
    '--------',
    '需求:',
    '等级: 5',
    '敏捷: 26',
    '--------',
    '插槽: G-G-G-G-G-G',
    '--------',
    '物品等级: 50',
    '--------',
    '出售获得通货:非绑定'
  ].join('\n'))
  assert.equal(item.name, '短弓')
  assert.equal(item.baseName, '')
  const model = createPriceCheckModel(item, catalog)
  assert.equal(model.identity.type, '短弓')
  assert.equal(buildOfficialTradeQuery(model).query.type, '短弓')
})

test('魔法药剂从完整名称恢复官方底材后生成查询', () => {
  const item = parseItemInfo([
    '物品类别: 魔力药剂',
    '稀 有 度: 魔法',
    '预兆的自由之不朽魔力药剂',
    '--------',
    '5 秒内回复 2324 (augmented) 魔力',
    '每次使用会从 42 充能次数中消耗 8 次',
    '目前有 0 充能次数',
    '--------',
    '需求:',
    '等级: 60',
    '--------',
    '物品等级: 85',
    '--------',
    '{ 前缀属性 "预兆的" (等阶：1) — 魔力 }',
    '回复量提高 66%',
    '魔力回复会在效果结束时立即开始 — 数值不可调整',
    '{ 后缀属性 "自由之" (等阶：2) — 攻击, 施法 }',
    '缓速时使用可以在接下来 12(12-14) 秒免疫缓速',
    '瘫痪时使用可以在接下来 13(12-14) 秒免疫瘫痪',
    '--------',
    '点击右键以喝下药剂。只有装备于腰带上时才会充能。击败怪物时会回复充能次数。',
    '--------',
    '出售获得通货:非绑定'
  ].join('\n'))
  const catalog = {
    items: [
      { name: '魔力药剂', baseType: '魔力药剂', unique: false },
      { name: '不朽魔力药剂', baseType: '不朽魔力药剂', unique: false }
    ],
    stats: [
      {
        key: 'flask-recovery',
        label: '回复量提高',
        matchers: ['回复量提高 #%'],
        ids: { explicit: 'explicit.stat_700317374' }
      },
      {
        key: 'flask-instant-mana',
        label: '魔力回复会在效果结束时立即开始',
        matchers: ['魔力回复会在效果结束时立即开始'],
        ids: { explicit: 'explicit.stat_4204954479' }
      },
      {
        key: 'flask-hinder-immunity',
        label: '缓速免疫',
        matchers: ['缓速时使用可以在接下来 # 秒免疫缓速'],
        ids: { explicit: 'explicit.stat_4003593289' }
      },
      {
        key: 'flask-maim-immunity',
        label: '瘫痪免疫',
        matchers: ['瘫痪时使用可以在接下来 # 秒免疫瘫痪'],
        ids: { explicit: 'explicit.stat_4232582040' }
      }
    ]
  }

  assert.equal(item.name, '预兆的自由之不朽魔力药剂')
  assert.equal(item.baseName, '')
  const model = createPriceCheckModel(item, catalog, { initialSelection: 'none' })
  assert.equal(model.item.baseType, '不朽魔力药剂')
  assert.equal(model.identity.type, '不朽魔力药剂')
  assert.equal(buildOfficialTradeQuery(model).query.type, '不朽魔力药剂')
  assert.deepEqual(model.stats.map(({ id, values, enabled }) => ({ id, values, enabled })), [
    { id: 'explicit.stat_700317374', values: [66], enabled: false },
    { id: 'explicit.stat_4204954479', values: [], enabled: false },
    { id: 'explicit.stat_4003593289', values: [12], enabled: false },
    { id: 'explicit.stat_4232582040', values: [13], enabled: false }
  ])
  assert.deepEqual(model.unknownStats, [])
  assert.deepEqual(buildOfficialTradeQuery(model).query.stats[0].filters, [])

  model.stats[2].enabled = true
  const selectedFilters = buildOfficialTradeQuery(model).query.stats[0].filters
  assert.equal(selectedFilters.length, 1)
  assert.equal(selectedFilters[0].id, 'explicit.stat_4003593289')
  assert.equal(selectedFilters[0].value.min, 9.6)
})

test('目录底材补全选择最长后缀且无法匹配时保留原身份', () => {
  const catalog = {
    items: [
      { name: '魔力药剂', baseType: '魔力药剂', unique: false },
      { name: '不朽魔力药剂', baseType: '不朽魔力药剂', unique: false },
      { name: '同名传奇', baseType: '不朽魔力药剂', unique: true }
    ],
    stats: []
  }
  const matched = createPriceCheckModel({
    category: '魔力药剂',
    rarity: '魔法',
    name: '预兆的自由之不朽魔力药剂',
    baseName: ''
  }, catalog)
  const unmatched = createPriceCheckModel({
    category: '魔力药剂',
    rarity: '魔法',
    name: '未知实验药剂',
    baseName: ''
  }, catalog)

  assert.equal(matched.identity.type, '不朽魔力药剂')
  assert.equal(unmatched.identity.type, '未知实验药剂')
})

test('多行词缀优先使用完整复合 matcher，仅在失败时逐行回退', () => {
  const model = createPriceCheckModel({
    category: '测试装备',
    rarity: '稀有',
    name: '测试物品',
    baseName: '测试底材',
    modifiers: [{
      type: 'prefix',
      name: '复合词缀',
      tier: 3,
      lines: ['效果甲 10', '效果乙 20'],
      text: '效果甲 10\n效果乙 20'
    }]
  }, {
    items: [],
    stats: [
      {
        key: 'compound',
        label: '复合效果',
        matchers: ['效果甲 # 效果乙 #'],
        ids: { explicit: 'explicit.stat_100001' }
      },
      {
        key: 'single-a',
        label: '效果甲',
        matchers: ['效果甲 #'],
        ids: { explicit: 'explicit.stat_100002' }
      }
    ]
  }, { initialSelection: 'none' })

  assert.deepEqual(model.stats.map(({ id, values }) => ({ id, values })), [{
    id: 'explicit.stat_100001',
    values: [10, 20]
  }])
  assert.deepEqual(model.unknownStats, [])
})

test('宝石等级和品质转换为官方 misc filters', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const item = parseItemInfo([
    '物品类别: 技能宝石',
    '稀 有 度: 宝石',
    '火球',
    '--------',
    '等级: 20',
    '品质: +20%'
  ].join('\n'))
  const model = createPriceCheckModel(item, catalog)
  assert.equal(model.item.gemLevel, 20)
  const body = buildOfficialTradeQuery(model)
  assert.equal(body.query.filters.misc_filters.filters.gem_level.min, 20)
  assert.equal(body.query.filters.misc_filters.filters.quality.min, 20)
})

test('地图阶级使用 Awakened PoE Trade 的 map_filters 分组', () => {
  const body = buildOfficialTradeQuery({
    item: {
      category: '地图',
      rarity: '稀有',
      name: '测试地图',
      baseType: '赤红山地',
      mapTier: 16,
      corrupted: false
    },
    identity: { name: '', type: '赤红山地' },
    stats: []
  })
  assert.deepEqual(body.query.filters.map_filters.filters.map_tier, { min: 16, max: 16 })
  assert.equal(body.query.filters.misc_filters?.filters?.map_tier, undefined)
})

test('腾讯官方 stat 元数据构建完整运行时目录', async () => {
  const { catalog: bundled } = await loadTradeCatalog(catalogPath)
  const entries = Array.from({ length: 101 }, (_, index) => ({
    id: `explicit.stat_${100000 + index}`,
    text: index === 0 ? '攻击速度提高 #%' : `测试官方词缀 ${index} +#`,
    type: 'explicit'
  }))
  const { catalog, status } = createOfficialTradeCatalog(bundled, {
    result: [
      { id: 'explicit', entries },
      { id: 'pseudo', entries: [{ id: 'pseudo.lake_62572', text: '裂隙镜像 (难度 #)', type: 'pseudo' }] }
    ]
  }, Date.parse('2026-07-29T01:00:00Z'), {
    result: [{
      id: 'accessory',
      entries: [
        { name: '传奇甲', type: '星空珠宝', flags: { unique: true } },
        { name: '传奇乙', type: '星空珠宝', flags: { unique: true } },
        { name: '', type: '普通底材', flags: { unique: false } }
      ]
    }]
  })
  assert.equal(status.provider, 'official')
  assert.equal(status.degraded, false)
  assert.equal(status.coverage.silentDropped, 0)
  assert.equal(status.coverage.valid, 102)
  assert.ok(status.counts.stats >= 101)
  const match = matchCatalogStat(catalog, '攻击速度提高 17%', 'explicit')
  assert.equal(match.id, 'explicit.stat_100000')
  assert.deepEqual(match.values, [17])
  assert.equal(matchCatalogStat(catalog, '裂隙镜像 (难度 12)', 'pseudo').id, 'pseudo.lake_62572')
  assert.equal(catalog.itemCoverage, 'all')
  assert.deepEqual(catalog.items.map(({ name, baseType, unique }) => ({ name, baseType, unique })), [
    { name: '传奇甲', baseType: '星空珠宝', unique: true },
    { name: '传奇乙', baseType: '星空珠宝', unique: true },
    { name: '普通底材', baseType: '普通底材', unique: false }
  ])
})

test('官方目录保留同文案同类型的全部 stat ID 并暴露歧义候选', async () => {
  const { catalog: bundled } = await loadTradeCatalog(catalogPath)
  const entries = Array.from({ length: 101 }, (_, index) => ({
    id: `explicit.stat_${200000 + index}`,
    text: `测试唯一词缀 ${index} +#`,
    type: 'explicit'
  }))
  entries.push(
    { id: 'explicit.stat_900001', text: '# 测试歧义词缀', type: 'explicit' },
    { id: 'explicit.stat_900002', text: '# 测试歧义词缀', type: 'explicit' }
  )

  const { catalog } = createOfficialTradeCatalog(bundled, {
    result: [{ id: 'explicit', entries }]
  })
  const resolution = resolveCatalogStat(catalog, '12 测试歧义词缀', 'explicit')

  assert.deepEqual(resolution.candidates.map((candidate) => candidate.id), [
    'explicit.stat_900001',
    'explicit.stat_900002'
  ])
  assert.equal(resolution.match, null)
  assert.equal(matchCatalogStat(catalog, '12 测试歧义词缀', 'explicit'), null)
})

test('官方 local 标记生成游戏剪贴板别名且丢弃旧翻译控制符', async () => {
  const { catalog: bundled } = await loadTradeCatalog(catalogPath)
  const baseCatalog = structuredClone(bundled)
  baseCatalog.stats[0].matchers.push('<AT3>损坏的旧翻译}}')
  const entries = Array.from({ length: 101 }, (_, index) => ({
    id: `explicit.stat_${300000 + index}`,
    text: index === 0 ? '测试局部效果 #%' : `测试区域词缀 ${index} +#`,
    type: 'explicit'
  }))
  entries.push({ id: 'explicit.stat_300000', text: '测试局部效果 #% (区域)', type: 'explicit' })

  const { catalog } = createOfficialTradeCatalog(baseCatalog, {
    result: [{ id: 'explicit', entries }]
  })
  const local = catalog.stats.find((entry) => entry.ids.explicit === 'explicit.stat_300000')
  assert.equal(local.local, true)
  assert.ok(local.matchers.includes('测试局部效果 #% (区域)'))
  assert.ok(local.matchers.includes('测试局部效果 #%'))
  assert.equal(matchCatalogStat(catalog, '测试局部效果 17%', 'explicit').id, 'explicit.stat_300000')
  assert.ok(catalog.stats.every((entry) => entry.matchers.every((matcher) => !/<[A-Z]{2}\d+>|}}/.test(matcher))))
})

test('当前游戏描述目录只按现存官方 ID 补充简中剪贴板 matcher', () => {
  const catalog = {
    schemaVersion: 2,
    game: 'poe1',
    locale: 'zh-CN',
    gameVersion: '3.29',
    generatedAt: '2026-08-11T00:00:00.000Z',
    sources: [],
    items: [],
    stats: [{
      key: 'official-explicit-stat-123',
      label: '官方显示文案',
      matchers: ['+# 官方显示文案'],
      ids: { explicit: 'explicit.stat_123' },
      availability: 'both'
    }]
  }
  const result = mergeClipboardStatMatchers(catalog, [
    { text: '玩家 #% 全部最大抗性', tradeIds: ['explicit.stat_123'] },
    { text: '已移除词缀 #', tradeIds: ['explicit.stat_999'] },
    { text: '<AT3>损坏描述}}', tradeIds: ['explicit.stat_123'] }
  ], (text) => text.replace('全部最大抗性', '所有抗性上限'))

  assert.equal(result.audit.definitions, 3)
  assert.equal(result.audit.linked, 1)
  assert.equal(result.audit.aliasesAdded, 1)
  assert.equal(result.audit.missingOfficialIds, 1)
  assert.ok(result.catalog.stats[0].matchers.includes('玩家 #% 所有抗性上限'))
  assert.ok(!result.catalog.stats[0].matchers.some((matcher) => matcher.includes('<AT3>')))
  assert.ok(result.catalog.sources.some((source) => source.includes('Sidekick')))
})

test('词缀映射严格使用真实类型且不会回退到 explicit', () => {
  const catalog = {
    stats: [{
      key: 'explicit-only',
      label: '仅显式',
      matchers: ['# 测试类型'],
      ids: { explicit: 'explicit.stat_910001' }
    }]
  }

  assert.equal(matchCatalogStat(catalog, '8 测试类型', 'implicit'), null)
  assert.equal(resolveCatalogStat(catalog, '8 测试类型', 'implicit').reason, 'type-mismatch')
})

test('词缀映射使用物品类别消除同文案歧义并保留固定数字', () => {
  const catalog = {
    stats: [
      {
        key: 'weapon-gain',
        label: '武器充能',
        matchers: ['每 4 秒获得 # 充能'],
        ids: { explicit: 'explicit.stat_920001' },
        categories: ['单手剑']
      },
      {
        key: 'armour-gain',
        label: '护甲充能',
        matchers: ['每 4 秒获得 # 充能'],
        ids: { explicit: 'explicit.stat_920002' },
        categories: ['胸甲']
      }
    ]
  }

  const match = matchCatalogStat(catalog, '每 4 秒获得 12 充能', 'explicit', { category: '胸甲' })
  assert.equal(match.id, 'explicit.stat_920002')
  assert.deepEqual(match.values, [12])
})

test('同文案 local 与全局 stat 按底材属性自动选择而不要求用户判断', () => {
  const catalog = {
    stats: [
      {
        key: 'local-speed', label: '攻击速度（局部）', matchers: ['攻击速度加快 #%'],
        ids: { explicit: 'explicit.stat_920101' }, local: true
      },
      {
        key: 'global-speed', label: '攻击速度（全局）', matchers: ['攻击速度加快 #%'],
        ids: { explicit: 'explicit.stat_920102' }, local: false
      }
    ]
  }

  assert.equal(resolveCatalogStat(catalog, '攻击速度加快 12%', 'explicit', {
    category: '弓', localItem: true
  }).match.id, 'explicit.stat_920101')
  assert.equal(resolveCatalogStat(catalog, '攻击速度加快 12%', 'explicit', {
    category: '戒指', localItem: false
  }).match.id, 'explicit.stat_920102')
})

test('目录 resolver 使用词缀名称和标签确定候选', () => {
  const catalog = {
    stats: [
      {
        key: 'attack-resolver', label: '攻击候选', matchers: ['# 测试元数据'],
        ids: { explicit: 'explicit.stat_925001' }, resolver: { tagsAny: ['攻击'], modifierNames: ['进攻的'] }
      },
      {
        key: 'caster-resolver', label: '法术候选', matchers: ['# 测试元数据'],
        ids: { explicit: 'explicit.stat_925002' }, resolver: { tagsAny: ['法术'], modifierNames: ['施法的'] }
      }
    ]
  }
  const match = matchCatalogStat(catalog, '9 测试元数据', 'explicit', { name: '施法的', tags: ['法术'] })
  assert.equal(match.id, 'explicit.stat_925002')
})

test('同类型同 stat 的多条词缀聚合数值且保留来源', () => {
  const model = createPriceCheckModel({
    category: '胸甲',
    rarity: '稀有',
    name: '测试物品',
    baseName: '测试胸甲',
    modifiers: [
      { type: 'prefix', name: '来源甲', text: '10 测试聚合' },
      { type: 'prefix', name: '来源乙', text: '20 测试聚合' }
    ]
  }, {
    items: [],
    stats: [{
      key: 'aggregate',
      label: '测试聚合',
      matchers: ['# 测试聚合'],
      ids: { explicit: 'explicit.stat_930001' },
      merge: 'sum'
    }]
  }, { initialSelection: 'none' })

  assert.equal(model.stats.length, 1)
  assert.deepEqual(model.stats[0].values, [30])
  assert.deepEqual(model.stats[0].sources.map((source) => source.text), ['10 测试聚合', '20 测试聚合'])
})

test('max 合并规则取多条来源的最大值而不是相加', () => {
  const model = createPriceCheckModel({
    category: '胸甲', rarity: '稀有', name: '测试物品', baseName: '测试胸甲',
    modifiers: [
      { type: 'prefix', text: '10 测试最大值' },
      { type: 'prefix', text: '20 测试最大值' }
    ]
  }, {
    items: [],
    stats: [{ key: 'maximum', label: '测试最大值', matchers: ['# 测试最大值'], ids: { explicit: 'explicit.stat_935001' }, merge: 'max' }]
  }, { initialSelection: 'none' })
  assert.deepEqual(model.stats[0].values, [20])
})

test('无法自动消歧的国服词缀保留可选择候选', () => {
  const model = createPriceCheckModel({
    category: '珠宝',
    rarity: '稀有',
    name: '测试珠宝',
    baseName: '钴蓝珠宝',
    modifiers: [{ type: 'suffix', name: '歧义词缀', text: '15 测试候选' }]
  }, {
    items: [],
    stats: [
      { key: 'candidate-a', label: '候选甲', matchers: ['# 测试候选'], ids: { explicit: 'explicit.stat_940001' } },
      { key: 'candidate-b', label: '候选乙', matchers: ['# 测试候选'], ids: { explicit: 'explicit.stat_940002' } }
    ]
  }, { initialSelection: 'none' })

  assert.equal(model.stats.length, 0)
  assert.equal(model.unknownStats.length, 1)
  assert.deepEqual(model.unknownStats[0].candidates.map((candidate) => candidate.id), [
    'explicit.stat_940001',
    'explicit.stat_940002'
  ])
})

test('价格补丁尾标不会污染正式物品名称与传奇身份查询', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const fixtures = [
    ['活木之刃[5c]', '活木之刃', '艾兹麦巨剑'],
    ['深海魔甲[50C]', '深海魔甲', '金耀之铠'],
    ['寻宝者的心眼[1c]', '寻宝者的心眼', '黑曜护身符'],
    ['测试复合价签[1d50c]', '测试复合价签', '黑曜护身符'],
    ['正式名称[复制品]', '正式名称[复制品]', '黑曜护身符']
  ]
  for (const [copiedName, expectedName, baseType] of fixtures) {
    const item = parseItemInfo(`物品类别: 项链\n稀 有 度: 传奇\n${copiedName}\n${baseType}\n--------\n物品等级: 85`)
    assert.equal(item.name, expectedName)
    const query = buildOfficialTradeQuery(createPriceCheckModel(item, catalog)).query
    assert.equal(query.name, expectedName)
    assert.equal(query.type, baseType)
  }
})

test('真实歧义词缀默认跳过且只能通过当前主进程候选重新查询', async () => {
  const { catalog, status } = await loadTradeCatalog(catalogPath)
  const queries = []
  const service = new PriceCheckService({
    auth: { getStatus: () => ({ authenticated: true, accountName: 'me' }), registerCacheClearer: () => {} },
    client: {
      clearCache() {},
      search: async (_league, query) => {
        queries.push(structuredClone(query))
        return { id: `candidate-${queries.length}`, total: 0, result: [] }
      },
      fetch: async () => ({ result: [] })
    },
    catalog,
    catalogStatus: status
  })
  service.updateRuntime({ enabled: true })
  const first = await service.check({
    league: 'S30赛季',
    text: `物品类别: 项链
稀 有 度: 传奇
寻宝者的心眼[1c]
黑曜护身符
--------
物品等级: 73
--------
{ 传奇属性 }
免疫晕眩`
  })

  assert.equal(first.model.identity.name, '寻宝者的心眼')
  const unknown = first.model.unknownStats.find((entry) => entry.text === '免疫晕眩')
  assert.deepEqual(unknown.candidates.map((candidate) => candidate.id), [
    'explicit.stat_1694106311',
    'explicit.stat_4262448838'
  ])
  assert.deepEqual(queries[0].query.stats[0].filters, [])
  await assert.rejects(
    service.resolveStatCandidate(unknown.key, 'explicit.stat_999999999'),
    /词缀候选无效或已过期/
  )

  const selected = await service.resolveStatCandidate(unknown.key, 'explicit.stat_1694106311')
  assert.deepEqual(selected.model.unknownStats, [])
  assert.deepEqual(queries[1].query.stats[0].filters.map((filter) => filter.id), ['explicit.stat_1694106311'])
})

test('用户提供的药剂与三件传奇歧义文案均保留合法官方候选', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const fixtures = [
    {
      text: `物品类别: 魔力药剂
稀 有 度: 魔法
沸腾的圣语魔力药剂
--------
物品等级: 36
--------
{ 前缀属性 "沸腾的" (等阶：1) }
回复量降低 66%
立即回复`,
      name: '沸腾的圣语魔力药剂', identityName: '', type: '圣语魔力药剂', effect: '立即回复',
      ids: ['explicit.stat_1526933524', 'explicit.stat_2503377690']
    },
    {
      text: `物品类别: 双手剑
稀 有 度: 传奇
活木之刃[5c]
艾兹麦巨剑
--------
物品等级: 86
--------
{ 传奇属性 — 混沌, 异常状态 }
不会中毒`,
      name: '活木之刃', identityName: '活木之刃', type: '艾兹麦巨剑', effect: '不会中毒',
      ids: ['explicit.stat_3835551335', 'explicit.stat_4053951709']
    },
    {
      text: `物品类别: 胸甲
稀 有 度: 传奇
深海魔甲[50c]
金耀之铠
--------
物品等级: 85
--------
{ 传奇属性 — 物理, 攻击, 异常状态 }
免疫流血`,
      name: '深海魔甲', identityName: '深海魔甲', type: '金耀之铠', effect: '免疫流血',
      ids: ['explicit.stat_1618589784', 'explicit.stat_1901158930']
    },
    {
      text: `物品类别: 项链
稀 有 度: 传奇
寻宝者的心眼[1c]
黑曜护身符
--------
物品等级: 73
--------
{ 传奇属性 }
免疫晕眩`,
      name: '寻宝者的心眼', identityName: '寻宝者的心眼', type: '黑曜护身符', effect: '免疫晕眩',
      ids: ['explicit.stat_1694106311', 'explicit.stat_4262448838']
    }
  ]

  for (const fixture of fixtures) {
    const model = createPriceCheckModel(parseItemInfo(fixture.text), catalog, { initialSelection: 'auto' })
    assert.equal(model.item.name, fixture.name)
    assert.deepEqual(model.identity, { name: fixture.identityName, type: fixture.type })
    const unknown = model.unknownStats.find((entry) => entry.text === fixture.effect)
    assert.deepEqual(unknown?.candidates.map((candidate) => candidate.id), fixture.ids, fixture.effect)
    assert.ok(buildOfficialTradeQuery(model).query.type, fixture.name)
  }
})

test('未鉴定传奇按官方底材候选自动解析或要求手选', () => {
  const baseModel = {
    item: { rarity: '传奇', unidentified: true, baseType: '星空珠宝' },
    identity: { name: '', type: '星空珠宝' }
  }
  const one = resolveUnidentifiedUnique(structuredClone(baseModel), {
    items: [{ name: '传奇甲', baseType: '星空珠宝', unique: true }]
  })
  assert.equal(one.identity.name, '传奇甲')
  assert.equal(one.identityResolution.required, false)

  const many = resolveUnidentifiedUnique(structuredClone(baseModel), {
    items: [
      { name: '传奇甲', baseType: '星空珠宝', unique: true, legacy: true },
      { name: '传奇乙', baseType: '星空珠宝', unique: true, legacy: false }
    ]
  })
  assert.equal(many.identity.name, '')
  assert.equal(many.identityResolution.required, true)
  assert.deepEqual(
    many.identityResolution.candidates.map(({ name, legacy }) => ({ name, legacy })),
    [
      { name: '传奇乙', legacy: false },
      { name: '传奇甲', legacy: true }
    ]
  )
  assert.throws(() => buildOfficialTradeQuery(many), /请选择/)
})

test('快捷查价捕获新剪贴板文本，失败时恢复原剪贴板', async () => {
  let value = '用户原剪贴板'
  const clipboard = {
    readText: () => value,
    writeText: (next) => { value = next }
  }
  const captured = await captureFreshClipboardText({
    clipboard,
    releaseDelayMs: 0,
    pollMs: 1,
    sendCopy: async () => { value = '物品类别: 胸甲\n稀 有 度: 稀有\n新物品' }
  })
  assert.match(captured, /新物品/)

  value = '需要恢复'
  await assert.rejects(captureFreshClipboardText({
    clipboard,
    releaseDelayMs: 0,
    timeoutMs: 2,
    pollMs: 1,
    sendCopy: async () => {}
  }), /没有从游戏捕获到物品/)
  assert.equal(value, '需要恢复')
})

test('快捷查价发送一次 Ctrl+C 复制并捕获文本', async () => {
  let value = '原内容'
  let sends = 0
  const clipboard = {
    readText: () => value,
    writeText: (next) => { value = next }
  }
  const captured = await capturePoeItemText({
    clipboard,
    releaseDelayMs: 0,
    timeoutMs: 2,
    pollMs: 1,
    sendCopy: async () => {
      sends += 1
      value = '物品类别: 胸甲\n稀 有 度: 稀有\n复制物品'
    }
  })
  assert.equal(sends, 1)
  assert.match(captured, /复制物品/)
})

test('快捷查价前台预检失败时不修改剪贴板也不发送复制键', async () => {
  let value = '用户原剪贴板'
  let writes = 0
  let sends = 0
  const clipboard = {
    readText: () => value,
    writeText: (next) => { writes += 1; value = next }
  }
  await assert.rejects(capturePoeItemText({
    clipboard,
    assertForeground: async () => { throw new Error('游戏窗口当前不在前台') },
    sendCopy: async () => { sends += 1 }
  }), /游戏窗口当前不在前台/)
  assert.equal(value, '用户原剪贴板')
  assert.equal(writes, 0)
  assert.equal(sends, 0)
})

test('高级文本解析词缀 T 级、标签、武器属性和状态', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const item = parseItemInfo([
    '物品类别: 单手剑',
    '稀 有 度: 稀有',
    '烈焰之锋',
    '宝石之剑',
    '--------',
    '物理伤害: 20-40',
    '元素伤害: 10-20, 5-15',
    '攻击暴击率: 6.00%',
    '每秒攻击次数: 1.50',
    '物品等级: 86',
    '--------',
    '{ 前缀属性 "健壮的" (等阶：1) — 生命, 防御 }',
    '+96 最大生命',
    '--------',
    '已腐化',
    '已分裂'
  ].join('\n'))
  const model = createPriceCheckModel(item, catalog, { initialSelection: 'auto', valueRange: 'down20' })
  assert.equal(item.totalDps, 82.5)
  assert.equal(model.stats[0].tier, 1)
  assert.deepEqual(model.stats[0].tags, ['生命', '防御'])
  assert.equal(model.stats[0].enabled, true)
  assert.equal(model.flags.corrupted, true)
  assert.equal(model.flags.split, true)
  assert.ok(model.properties.some((property) => property.id === 'weapon.dps' && property.value === 82.5))
})

test('当前国服 Ctrl+C 详细文本自动把“破碎的 后缀属性”映射为 fractured', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const item = parseItemInfo([
    '物品类别: 弓',
    '稀 有 度: 魔法',
    '冒烟的劲风之游侠弓',
    '--------',
    '弓',
    '物理伤害: 56-117',
    '火焰，冰霜，闪电伤害: 28-48 (augmented)',
    '攻击暴击率: 6.00%',
    '每秒攻击次数: 1.30',
    '--------',
    '需求:',
    '等级: 65',
    '敏捷: 212 (unmet)',
    '--------',
    '插槽: W',
    '--------',
    '物品等级: 85',
    '--------',
    '{ 前缀属性 "冒烟的" (等阶：8) — 伤害, 元素, 火焰, 攻击 }',
    '该装备附加 28(23-31) - 48(47-54) 基础火焰伤害',
    '{ 破碎的 后缀属性 "劲风之" (等阶：1) — 速度 }',
    '投射物速度加快 46(42-46)%',
    '--------',
    '分裂之物',
    '--------',
    '出售获得通货:非绑定'
  ].join('\n'))

  assert.equal(item.modifiers.length, 2)
  assert.equal(item.modifiers[1].type, 'fractured')
  assert.equal(item.modifiers[1].affixType, 'suffix')
  assert.equal(item.modifiers[1].text, '投射物速度加快 46%')
  assert.equal(item.isFractured, true)
  assert.equal(item.physicalDps, 112.45)
  assert.equal(item.elementalDps, 49.4)
  assert.equal(item.totalDps, 161.85)

  const model = createPriceCheckModel(item, catalog, { initialSelection: 'auto' })
  assert.equal(model.identity.type, '游侠弓')
  assert.ok(model.stats.some((stat) => stat.id === 'explicit.stat_709508406'))
  const projectileSpeed = model.stats.find((stat) => stat.id === 'fractured.stat_3759663284')
  assert.ok(projectileSpeed)
  assert.equal(projectileSpeed.type, 'fractured')
  assert.equal(projectileSpeed.tier, 1)
  assert.equal(projectileSpeed.enabled, true)
  assert.ok(!model.stats.some((stat) => stat.id === 'explicit.stat_3759663284'))
  assert.deepEqual(model.unknownStats, [])
})

test('当前国服“大师级 前缀属性”自动映射为 crafted 并保留工艺等级', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const item = parseItemInfo([
    '物品类别: 腰带',
    '稀 有 度: 稀有',
    '活尸 无尽之弦',
    '皮革腰带',
    '--------',
    '需求:',
    '等级: 48',
    '--------',
    '物品等级: 48',
    '--------',
    '{ 基底属性 — 生命 }',
    '+26(25-40) 最大生命',
    '--------',
    '{ 前缀属性 "粗壮的" (等阶：6) — 生命 }',
    '+65(55-69) 最大生命',
    '{ 前缀属性 "辐射的" (等阶：8) — 防御, 能量护盾 }',
    '+17(16-19) 最大能量护盾',
    '{ 大师级 前缀属性 "升级的" (等级：3) — 魔力 }',
    '+47(45-54) 最大魔力',
    '{ 后缀属性 "企鹅之" (等阶：6) — 元素, 冰霜, 抗性 }',
    '+20(18-23)% 冰霜抗性',
    '{ 后缀属性 "狐狸之" — 属性 }',
    '+19(18-22) 敏捷'
  ].join('\n'))

  const crafted = item.modifiers.find((modifier) => modifier.name === '升级的')
  assert.equal(crafted.type, 'crafted')
  assert.equal(crafted.affixType, 'prefix')
  assert.equal(crafted.tier, 3)
  assert.equal(crafted.text, '+47 最大魔力')

  const model = createPriceCheckModel(item, catalog, { initialSelection: 'auto' })
  assert.equal(model.identity.type, '皮革腰带')
  assert.ok(model.stats.some((stat) => stat.id === 'implicit.stat_3299347043'))
  assert.ok(model.stats.some((stat) => stat.id === 'crafted.stat_1050105434' && stat.tier === 3))
  assert.ok(!model.stats.some((stat) => stat.id === 'explicit.stat_1050105434'))
  assert.deepEqual(model.unknownStats, [])
})

test('当前国服影匿词缀揭露前使用 veiled 名称 ID，揭露后恢复 explicit', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const common = [
    '物品类别: 项链',
    '稀 有 度: 稀有',
    '腐尸 颈环',
    '青玉护身符',
    '--------',
    '需求:',
    '等级: 60',
    '--------',
    '物品等级: 85',
    '--------',
    '{ 基底属性 — 属性 }',
    '+18(16-24) 敏捷与智慧',
    '--------'
  ]
  const before = parseItemInfo([
    ...common,
    '{ 前缀属性 "内奸的" (等阶：1) — 混沌, 宝石 }',
    '所有混沌主动技能石等级 +1',
    '{ 前缀属性 "蓝宝石的" (等阶：10) — 魔力 }',
    '+31(30-34) 最大魔力',
    '{ 后缀属性 "花豹之" (等阶：4) — 属性 }',
    '+33(33-37) 敏捷',
    '{ 前缀属性 "艾尔雷恩的影匿" }',
    '影匿前缀'
  ].join('\n'))
  const beforeVeiled = before.modifiers.find((modifier) => modifier.name === '艾尔雷恩的影匿')
  assert.equal(beforeVeiled.type, 'veiled')
  assert.equal(beforeVeiled.affixType, 'prefix')
  const beforeModel = createPriceCheckModel(before, catalog, { initialSelection: 'auto' })
  assert.ok(beforeModel.stats.some((stat) => stat.id === 'veiled.mod_5769' && stat.type === 'veiled'))
  assert.deepEqual(beforeModel.unknownStats, [])

  const after = parseItemInfo([
    ...common,
    '{ 前缀属性 "艾尔雷恩的" — 魔力 }',
    '非吟唱技能的总魔力消耗 -9(-10--9)',
    '{ 前缀属性 "内奸的" (等阶：1) — 混沌, 宝石 }',
    '所有混沌主动技能石等级 +1',
    '{ 前缀属性 "蓝宝石的" (等阶：10) — 魔力 }',
    '+31(30-34) 最大魔力',
    '{ 后缀属性 "花豹之" (等阶：4) — 属性 }',
    '+33(33-37) 敏捷'
  ].join('\n'))
  const revealed = after.modifiers.find((modifier) => modifier.name === '艾尔雷恩的')
  assert.equal(revealed.type, 'prefix')
  const afterModel = createPriceCheckModel(after, catalog, { initialSelection: 'auto' })
  assert.ok(afterModel.stats.some((stat) => stat.id === 'explicit.stat_677564538' && stat.type === 'explicit'))
  assert.ok(!afterModel.stats.some((stat) => stat.type === 'veiled'))
  assert.deepEqual(afterModel.unknownStats, [])
})

test('当前国服同一复合防御前缀的多行数值整体解析且每行均可查价', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const item = parseItemInfo([
    '物品类别: 胸甲',
    '稀 有 度: 魔法',
    '可调的食人之指挥者锁甲',
    '--------',
    '护甲: 560 (augmented)',
    '闪避值: 522 (augmented)',
    '--------',
    '需求:',
    '等级: 55',
    '力量: 73 (unmet)',
    '敏捷: 73 (unmet)',
    '--------',
    '插槽: W-W-W-W-W-W',
    '--------',
    '物品等级: 85',
    '--------',
    '{ 前缀属性 "可调的" (等阶：2) — 防御, 护甲, 闪避值 }',
    '+269(221-300) 护甲',
    '+231(221-300) 点闪避值',
    '{ 后缀属性 "食人之" (等阶：6) — 生命 }',
    '每秒再生 33.9(32.1-48) 生命',
    '--------',
    '出售获得通货:非绑定'
  ].join('\n'))

  const hybrid = item.modifiers.find((modifier) => modifier.name === '可调的')
  assert.equal(hybrid.type, 'prefix')
  assert.equal(hybrid.tier, 2)
  assert.deepEqual(hybrid.lines, ['+269 护甲', '+231 点闪避值'])
  const model = createPriceCheckModel(item, catalog, { initialSelection: 'auto' })
  assert.ok(model.stats.some((stat) => stat.id === 'explicit.stat_3484657501' && stat.values[0] === 269))
  assert.ok(model.stats.some((stat) => stat.id === 'explicit.stat_53045048' && stat.values[0] === 231))
  assert.ok(model.stats.some((stat) => stat.id === 'explicit.stat_3325883026' && stat.values[0] === 33.9))
  assert.deepEqual(model.unknownStats, [])
})

test('当前国服焚界灭界手套自动识别双隐式、虚化、破碎复合词缀和工艺边界', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const item = parseItemInfo(`物品类别: 手套
稀 有 度: 稀有
怒气 灵掌
术士手套
--------
品质: +20% (augmented)
能量护盾: 230 (augmented)
虚化: 28%
--------
需求:
等级: 70
敏捷: 68 (unmet)
智慧: 148 (unmet)
--------
插槽: G-B-B-W
--------
物品等级: 85
--------
{ 焚界者基底词缀（次级） }
击中时有 15% 的几率恐惧敌人 4 秒
（恐惧的敌人受到的法术伤害提高 10%）
{ 灭界者基底词缀（高级） }
击中时施加冰霜曝露，适配 -12% 的冰霜抗性
（冰霜曝露使冰霜抗性-10%，持续 4 秒）
--------
{ 前缀属性 "沸腾的" (等阶：1) — 防御, 能量护盾 }
+39(39-49) 最大能量护盾
{ 前缀属性 "纳迦的" (等阶：3) — 防御, 能量护盾 }
该装备的能量护盾提高 27(27-32)%
晕眩回复和格挡回复提高 12(12-13)%
{ 前缀属性 "无法征服的" (等阶：2) — 防御, 能量护盾 }
该装备的能量护盾提高 91(80-91)%
{ 破碎的 后缀属性 "普华特之" — 伤害, 元素, 冰霜, 抗性 }
+47(46-48)% 冰霜抗性
击中冰缓敌人的伤害提高 39(30-50)%
{ 后缀属性 "提耶须之" (等阶：1) — 元素, 火焰, 抗性 }
+46(46-48)% 火焰抗性
{ 大师级 后缀属性 "工艺之" (等级：3) — 元素, 火焰, 冰霜, 抗性 }
+17(17-20)% 火焰与冰霜抗性
焚界者物品
灭界者物品
--------
分裂之物`)

  assert.equal(item.baseName, '术士手套')
  assert.equal(item.baseDefencePercentile, 28)
  assert.deepEqual(item.influences, ['searing-exarch', 'eater-of-worlds'])
  assert.deepEqual(item.modifiers.slice(0, 2).map((modifier) => modifier.type), ['implicit', 'implicit'])
  assert.deepEqual(item.craftedMods, ['+17% 火焰与冰霜抗性'])
  const fractured = item.modifiers.find((modifier) => modifier.name === '普华特之')
  assert.equal(fractured.type, 'fractured')
  assert.deepEqual(fractured.lines, ['+47% 冰霜抗性', '击中冰缓敌人的伤害提高 39%'])

  const model = createPriceCheckModel(item, catalog, { initialSelection: 'auto' })
  for (const id of [
    'implicit.stat_763611529',
    'implicit.stat_3005701891',
    'fractured.stat_4220027924',
    'fractured.stat_2805714016',
    'crafted.stat_2915988346'
  ]) assert.ok(model.stats.some((stat) => stat.id === id), id)
  assert.ok(model.stats.filter((stat) => stat.type === 'fractured').every((stat) => stat.enabled), '破碎词缀缺少 T 级时也应默认参与查价')
  assert.ok(model.properties.some((property) => property.id === 'armour.baseDefencePercentile' && property.value === 28))
  assert.deepEqual(model.unknownStats, [])

  const virtualized = model.properties.find((property) => property.id === 'armour.baseDefencePercentile')
  virtualized.enabled = true
  const body = buildOfficialTradeQuery(model)
  assert.equal(body.query.filters.armour_filters.filters.base_defence_percentile.min, virtualized.min)
  assert.deepEqual(
    body.query.stats[0].filters
      .filter((filter) => filter.id.startsWith('fractured.'))
      .map((filter) => filter.id),
    ['fractured.stat_4220027924', 'fractured.stat_2805714016']
  )
})

test('兼容国际服旧复制行尾的 fractured 类型标记', () => {
  const item = parseItemInfo([
    '物品类别: 鞋子',
    '稀 有 度: 稀有',
    '测试长靴',
    '铁锻胫甲',
    '--------',
    '物品等级: 86',
    '--------',
    '10% increased Movement Speed (fractured)',
    '--------',
    'Fractured Item'
  ].join('\n'))

  assert.equal(item.modifiers[0].type, 'fractured')
  assert.equal(item.modifiers[0].text, '10% increased Movement Speed')
  assert.equal(item.isFractured, true)
})

test('国际服当前详细头 Fractured Suffix Modifier 的语义优先于后缀位置', () => {
  const item = parseItemInfo([
    '物品类别: 珠宝',
    '稀 有 度: 稀有',
    '测试珠宝',
    '苍白之凝珠宝',
    '--------',
    '物品等级: 86',
    '--------',
    '{ Fractured Suffix Modifier "of Delaying" (Tier: 2) — Caster, Minion }',
    'Minions have 4(3-5)% chance to Hinder Enemies on Hit with Spells',
    '--------',
    'Fractured Item'
  ].join('\n'))

  assert.equal(item.modifiers[0].type, 'fractured')
  assert.equal(item.modifiers[0].affixType, 'suffix')
  assert.equal(item.modifiers[0].tier, 2)
  assert.equal(item.isFractured, true)
})

test('当前官方特殊 stat 命名空间由详细复制头自动确定且不回退 explicit', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const fixtures = [
    ['灌注', 'imbued', '被等级 1 的元素集中辅助', 'imbued.pseudo_built_in_support|770262833'],
    ['异度天灾', 'scourge', '+17% 闪电抗性', 'scourge.stat_1671376347'],
    ['佣兵', 'mercenary', '电球', 'mercenary.skill_5893'],
    ['地心', 'delve', '物品会被商贩高价购买', 'delve.delve_better_sell_price'],
    ['致命贪婪', 'ultimatum', '屏息瘴气', 'ultimatum.umod_40225'],
    ['禁域', 'sanctum', '天灾先驱会掉落恐惧之平衡', 'sanctum.stat_85125881'],
    ['古神熔炉', 'crucible', '该装备附加 2 - 7 基础物理伤害 攻击速度减慢 6% （等阶 1）', 'crucible.mod_58320']
  ]

  for (const [header, type, text, id] of fixtures) {
    const item = parseItemInfo([
      '物品类别: 胸甲',
      '稀 有 度: 稀有',
      '测试物品',
      '指挥者锁甲',
      '--------',
      '物品等级: 85',
      '--------',
      `{ ${header} 前缀属性 "名称中含禁域但不应抢类型" }`,
      text
    ].join('\n'))
    assert.equal(item.modifiers[0].type, type, header)
    assert.equal(item.modifiers[0].affixType, 'prefix', header)
    const model = createPriceCheckModel(item, catalog, { initialSelection: 'none' })
    assert.ok(model.stats.some((stat) => stat.type === type && stat.id === id), header)
    assert.ok(!model.stats.some((stat) => stat.id === id && stat.type === 'explicit'), header)
    assert.deepEqual(model.unknownStats, [], header)
  }
})

test('当前国服代表语料全部形成有效官方查询且交易词缀只会自动映射或给出候选', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  for (const example of SUPPORTED_FORMAT_EXAMPLES) {
    const item = parseItemInfo(example.text)
    const model = createPriceCheckModel(item, catalog, { initialSelection: 'none' })
    const body = buildOfficialTradeQuery(model)
    assert.ok(body.query.name || body.query.type, `${example.id} 未形成物品身份查询`)
    for (const unknown of model.unknownStats) {
      assert.ok(unknown.candidates.length > 0, `${example.id} 仍有无法映射词缀：${unknown.text}`)
      assert.ok(unknown.candidates.every((candidate) => candidate.type === unknown.type), `${example.id} 候选类型错误：${unknown.text}`)
    }
  }
})

test('当前国服附魔与珠宝详细复制均使用官方同类型 stat', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const fixtures = [
    {
      text: `物品类别: 头盔
稀 有 度: 稀有
测试头盔
梦魇战盔
--------
物品等级: 85
--------
{ 附魔属性 }
龙卷射击可以额外发射 1 个附属投射物`,
      type: 'enchant',
      id: 'enchant.stat_1219778564'
    },
    {
      text: `物品类别: 珠宝
稀 有 度: 稀有
测试珠宝
赤红珠宝
--------
物品等级: 85
--------
{ 前缀属性 "健壮的" (等阶：1) — 生命 }
+35(32-35) 最大生命`,
      type: 'prefix',
      id: 'explicit.stat_3299347043'
    }
  ]
  for (const fixture of fixtures) {
    const item = parseItemInfo(fixture.text)
    assert.equal(item.modifiers[0].type, fixture.type)
    const model = createPriceCheckModel(item, catalog, { initialSelection: 'none' })
    assert.ok(model.stats.some((stat) => stat.id === fixture.id), fixture.id)
    assert.deepEqual(model.unknownStats, [])
    assert.ok(buildOfficialTradeQuery(model).query.type)
  }
})

test('普通复制词缀保持 T? 且自动策略不勾选', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const item = parseItemInfo('物品类别: 胸甲\n稀 有 度: 稀有\n测试\n龙鳞胸甲\n--------\n物品等级: 86\n--------\n+96 最大生命')
  const model = createPriceCheckModel(item, catalog, { initialSelection: 'auto' })
  assert.equal(model.stats[0].tier, null)
  assert.equal(model.stats[0].enabled, false)
})

test('查价模型清理属性白名单、词缀数量和数值范围', () => {
  const model = sanitizePriceCheckModel({
    item: {},
    identity: { type: '龙鳞胸甲' },
    properties: [
      { id: 'weapon.dps', enabled: true, min: 100 },
      { id: 'danger.prototype', enabled: true, min: 1 }
    ],
    stats: Array.from({ length: 40 }, (_, index) => ({
      id: `explicit.stat_${1000 + index}`,
      enabled: true,
      min: Number.MAX_VALUE
    }))
  })
  assert.deepEqual(model.properties.map((property) => property.id), ['weapon.dps'])
  assert.equal(model.stats.length, 24)
  assert.equal(model.stats[0].min, 1_000_000_000)
})

test('查价模型只保留当前目录中类型匹配的词缀与歧义候选', () => {
  const catalog = {
    stats: [{ key: 'safe', matchers: ['# 安全词缀'], ids: { explicit: 'explicit.stat_950001' } }]
  }
  const model = sanitizePriceCheckModel({
    item: {},
    identity: { type: '测试底材' },
    stats: [
      { id: 'explicit.stat_950001', type: 'explicit', enabled: true },
      { id: 'explicit.stat_950999', type: 'explicit', enabled: true }
    ],
    unknownStats: [{
      key: 'unknown', text: '12 安全词缀', type: 'explicit', reason: '歧义',
      candidates: [
        { id: 'explicit.stat_950001', type: 'explicit', label: '安全候选', values: [12] },
        { id: 'implicit.stat_950001', type: 'implicit', label: '错类型候选', values: [12] },
        { id: 'explicit.stat_950999', type: 'explicit', label: '目录外候选', values: [12] }
      ]
    }]
  }, catalog)

  assert.deepEqual(model.stats.map((stat) => stat.id), ['explicit.stat_950001'])
  assert.deepEqual(model.unknownStats[0].candidates.map((candidate) => candidate.id), ['explicit.stat_950001'])
})

test('无法映射的词缀不会猜测 stat ID', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const model = createPriceCheckModel({
    category: '戒指', rarity: '稀有', name: '测试', baseName: '紫晶戒指',
    modifiers: [{ type: 'suffix', text: '本赛季未知词缀 12' }]
  }, catalog)
  assert.equal(model.stats.length, 0)
  assert.equal(model.unknownStats.length, 1)
  assert.deepEqual(buildOfficialTradeQuery(model).query.stats[0].filters, [])
})

test('目录生成器可重复排序并拒绝损坏 NDJSON', () => {
  const stats = [
    { ref: 'Life', matchers: [{ string: '# 最大生命' }, { string: '+10 最大生命' }], trade: { ids: { explicit: ['explicit.stat_3299347043'] } } },
    { ref: 'Life alias', matchers: [{ string: '# 点生命' }], trade: { ids: { explicit: ['explicit.stat_3299347043'] } } }
  ]
  const items = [
    { name: '翠绿珠宝', refName: 'Viridian Jewel', namespace: 'ITEM' },
    { name: '赤红珠宝', refName: 'Crimson Jewel', namespace: 'ITEM' },
    { name: '战斗专注', refName: 'Combat Focus', namespace: 'UNIQUE', unique: { base: 'Viridian Jewel' } },
    { name: '战斗专注', refName: 'Combat Focus', namespace: 'UNIQUE', unique: { base: 'Crimson Jewel' } }
  ]
  const input = { items, stats, gameVersion: '3.28', generatedAt: '2026-07-29T00:00:00Z' }
  const catalog = generateTradeCatalog(input)
  assert.deepEqual(catalog, generateTradeCatalog(input))
  assert.deepEqual(catalog.stats[0].matchers, ['# 最大生命', '+10 最大生命', '# 点生命'])
  assert.deepEqual(catalog.items.filter((item) => item.unique).map((item) => item.baseType), ['赤红珠宝', '翠绿珠宝'])
  assert.throws(() => parseNdjson('{"ok":true}\n{broken}'), /第 2 行/)
})

function response(body, status = 200, contentType = 'application/json', extraHeaders = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers({ 'content-type': contentType, ...extraHeaders }),
    text: async () => typeof body === 'string' ? body : JSON.stringify(body)
  }
}

test('腾讯 Provider 缓存相同搜索并校验响应结构', async () => {
  let calls = 0
  const urls = []
  let clock = 10000
  const session = { fetch: async (url) => { calls += 1; urls.push(String(url)); return response({ id: 'query1', result: ['abc'], total: 1 }) } }
  const client = new PoeCnTradeClient({ session, now: () => clock })
  const first = await client.search('S30 永火之咒', { query: {} })
  const second = await client.search('S30 永火之咒', { query: {} })
  assert.equal(first.id, second.id)
  assert.equal(calls, 1)
  assert.match(urls[0], /S30%20%E6%B0%B8%E7%81%AB%E4%B9%8B%E5%92%92/)
  client.clearCache()
  clock = 20000
  session.fetch = async () => response({})
  await assert.rejects(client.search('测试赛季', { query: { changed: true } }), /缺少查询编号/)
})

test('腾讯 Provider 识别登录 HTML', async () => {
  const client = new PoeCnTradeClient({ session: { fetch: async () => response('<title>流放之路</title>', 200, 'text/html') }, now: () => 10000 })
  await assert.rejects(client.search('测试赛季', { query: {} }), (error) => error.code === 'SESSION_EXPIRED')
})

test('腾讯 Provider 在 HTTP 400 时保留官方错误原因', async () => {
  const client = new PoeCnTradeClient({
    session: { fetch: async () => response({ error: { message: 'Invalid status option' } }, 400) },
    now: () => 10000
  })
  await assert.rejects(
    client.search('测试赛季', { query: {} }),
    (error) => error.details?.status === 400 &&
      error.details?.officialMessage === 'Invalid status option' &&
      /Invalid status option/.test(error.message)
  )
})

test('腾讯 Fetch 按实测 750ms 安全间隔调度', async () => {
  let clock = 10_000
  const waits = []
  const client = new PoeCnTradeClient({
    session: { fetch: async () => response({ result: [] }) },
    now: () => clock,
    sleep: async (ms) => {
      waits.push(ms)
      clock += ms
    }
  })
  await client.fetch('query1', ['abc'])
  await client.fetch('query1', ['def'])
  assert.deepEqual(waits, [750])
})

test('腾讯 Fetch 根据账号和 IP 响应头自动提高安全间隔', async () => {
  let clock = 10_000
  const waits = []
  const client = new PoeCnTradeClient({
    session: {
      fetch: async () => response(
        { result: [] },
        200,
        'application/json',
        { 'x-rate-limit-account': '4:4:10', 'x-rate-limit-ip': '12:4:60' }
      )
    },
    now: () => clock,
    sleep: async (ms) => {
      waits.push(ms)
      clock += ms
    }
  })
  await client.fetch('query1', ['abc'])
  await client.fetch('query1', ['def'])
  assert.deepEqual(waits, [1050])
})

test('腾讯 Fetch 遇到 429 后按 Retry-After 冷却同组请求', async () => {
  let clock = 10_000
  let calls = 0
  const waits = []
  const client = new PoeCnTradeClient({
    session: {
      fetch: async () => {
        calls += 1
        return calls === 1
          ? response({ error: { message: 'Rate limit exceeded' } }, 429, 'application/json', { 'retry-after': '2' })
          : response({ result: [] })
      }
    },
    now: () => clock,
    sleep: async (ms) => {
      waits.push(ms)
      clock += ms
    }
  })
  await assert.rejects(client.fetch('query1', ['abc']), /2 秒后重试/)
  await client.fetch('query1', ['def'])
  assert.deepEqual(waits, [2000])
  assert.equal(calls, 2)
})

test('挂单汇总排除本人、无价格并按卖家去重', () => {
  const make = (id, account, amount, currency = 'chaos') => ({
    id,
    listing: { account: { name: account }, price: amount ? { amount, currency } : null }
  })
  const summary = summarizeListings([
    make('1', 'a', 1), make('2', 'a', 2), make('3', 'me', 0.5),
    make('4', 'b', 3), make('5', 'c', 5), make('6', 'none', null)
  ], 'me')
  assert.equal(summary.samples[0].count, 3)
  assert.equal(summary.samples[0].median, 3)
  assert.equal(summary.disclaimer, '挂单参考，不代表成交价')
})

test('腾讯静态交易目录为所有挂单币种提供国服名称', () => {
  const labels = officialCurrencyLabels({ result: [{ entries: [
    { id: 'chaos', text: '混沌石' },
    { id: 'chrome', text: '幻色石' },
    { id: '', text: '无效' }
  ] }] })
  assert.deepEqual(labels, { chaos: '混沌石', chrome: '幻色石' })
  const summary = summarizeListings([
    { id: '1', listing: { account: { name: 'seller' }, price: { amount: 1, currency: 'chrome' } } }
  ], '', labels)
  assert.equal(summary.listings[0].currency, 'chrome')
  assert.equal(summary.listings[0].currencyLabel, '幻色石')
})

test('价格分布使用 DC 比合并神圣石和混沌石价位并标出最高占比', () => {
  const make = (id, account, amount, currency) => ({
    id,
    listing: { account: { name: account }, price: { amount, currency } }
  })
  const distribution = buildPriceDistribution([
    make('1', 'a', 1, 'divine'),
    make('2', 'b', 1250, 'chaos'),
    make('3', 'c', 1250, 'chaos'),
    make('4', 'me', 1250, 'chaos'),
    make('5', 'c', 1300, 'chaos')
  ], 'me', { value: 1250 }, 100)
  assert.equal(distribution.usable, 3)
  assert.equal(distribution.converted, true)
  assert.deepEqual(distribution.groups.map((group) => ({
    amount: group.amount,
    count: group.count,
    chaosCount: group.chaosCount,
    divineCount: group.divineCount,
    highest: group.highest
  })), [{
    amount: 1250,
    count: 3,
    chaosCount: 2,
    divineCount: 1,
    highest: true
  }])
})

test('查价服务通过共享认证完成纵向查询', async () => {
  const { catalog, status } = await loadTradeCatalog(catalogPath)
  const auth = { getStatus: () => ({ authenticated: true, accountName: 'me' }), registerCacheClearer: () => {} }
  const client = {
    clearCache() {},
    search: async () => ({ id: 'q1', total: 1, result: ['id1'] }),
    fetch: async () => ({ result: [{ id: 'id1', listing: { account: { name: 'seller' }, price: { amount: 2, currency: 'chaos' } } }] })
  }
  const service = new PriceCheckService({ auth, client, catalog, catalogStatus: status })
  service.updateRuntime({ enabled: true })
  const result = await service.check({
    league: '测试赛季',
    text: '物品类别: 弓\n稀 有 度: 稀有\n测试之弦\n粗制弓\n--------\n物品等级: 80'
  })
  assert.equal(result.result.queryId, 'q1')
  assert.equal(result.result.listings[0].amount, 2)
})

test('传奇弓底材被国服拒绝时保留名称并去掉 type 重试一次', async () => {
  const { catalog, status } = await loadTradeCatalog(catalogPath)
  const auth = { getStatus: () => ({ authenticated: true, accountName: 'me' }), registerCacheClearer: () => {} }
  const queries = []
  const client = {
    clearCache() {},
    search: async (_league, query) => {
      queries.push(structuredClone(query))
      if (queries.length === 1) {
        const error = new Error('国服交易接口返回 HTTP 400：Unknown item base type')
        error.code = 'API_INCOMPATIBLE'
        error.details = { status: 400, officialMessage: 'Unknown item base type' }
        throw error
      }
      return { id: 'q-bow', total: 0, result: [] }
    },
    fetch: async () => ({ result: [] })
  }
  const service = new PriceCheckService({ auth, client, catalog, catalogStatus: status })
  service.updateRuntime({ enabled: true })
  const result = await service.check({
    league: '测试赛季',
    model: {
      item: { category: '弓', rarity: '传奇', name: '测试传奇弓', baseType: '错误底材' },
      identity: { name: '测试传奇弓', type: '错误底材' },
      properties: [],
      stats: []
    }
  })
  assert.equal(queries.length, 2)
  assert.equal(queries[0].query.type, '错误底材')
  assert.equal(queries[1].query.name, '测试传奇弓')
  assert.equal(queries[1].query.type, undefined)
  assert.equal(result.query.query.name, '测试传奇弓')
  assert.equal(result.query.query.type, undefined)
})

test('稀有弓底材被国服拒绝时停止请求并显示具体底材', async () => {
  const { catalog, status } = await loadTradeCatalog(catalogPath)
  const auth = { getStatus: () => ({ authenticated: true, accountName: 'me' }), registerCacheClearer: () => {} }
  let calls = 0
  const client = {
    clearCache() {},
    search: async () => {
      calls += 1
      const error = new Error('国服交易接口返回 HTTP 400：Unknown item base type')
      error.code = 'API_INCOMPATIBLE'
      error.details = { status: 400, officialMessage: 'Unknown item base type' }
      throw error
    }
  }
  const service = new PriceCheckService({ auth, client, catalog, catalogStatus: status })
  service.updateRuntime({ enabled: true })
  await assert.rejects(service.check({
    league: '测试赛季',
    model: {
      item: { category: '弓', rarity: '稀有', name: '测试弓', baseType: '错误弓底材' },
      identity: { name: '', type: '错误弓底材' },
      properties: [],
      stats: []
    }
  }), (error) => error.code === 'INVALID_REQUEST' && /错误弓底材/.test(error.message))
  assert.equal(calls, 1)
})

test('DC 行情一小时内只刷新一次并在自动源失效时使用手动值', async () => {
  const { catalog, status } = await loadTradeCatalog(catalogPath)
  let calls = 0
  const service = new PriceCheckService({
    auth: { getStatus: () => ({ authenticated: true }), registerCacheClearer: () => {} },
    client: { clearCache() {} },
    catalog,
    catalogStatus: status,
    dcRateProvider: async () => {
      calls += 1
      return { valid: true, chaosValue: 1248, observedAt: '2026-07-30T01:00:00Z' }
    }
  })
  service.updateRuntime({ enabled: true, options: { manualDcRate: 1250 } })
  assert.equal(service.currentDcRate().value, 1250)
  assert.equal(service.currentDcRate().source, 'manual')
  await service.refreshDcRate()
  await service.refreshDcRate()
  assert.equal(calls, 1)
  assert.equal(service.currentDcRate().value, 1248)
  assert.equal(service.currentDcRate().source, 'poecurrency.top')
})

test('查价服务关闭时拒绝查询并清理浮层与缓存', async () => {
  const { catalog, status } = await loadTradeCatalog(catalogPath)
  let closed = 0
  let cacheCleared = 0
  const service = new PriceCheckService({
    auth: { getStatus: () => ({ authenticated: true }), registerCacheClearer: () => {} },
    client: { clearCache: () => { cacheCleared += 1 } },
    catalog,
    catalogStatus: status,
    overlay: { update() {}, close: () => { closed += 1 } }
  })
  await assert.rejects(service.check({ league: 'S29', text: '物品类别: 通货\n稀 有 度: 普通\n混沌石' }), /尚未启用/)
  service.updateRuntime({ enabled: false })
  assert.equal(closed, 1)
  assert.equal(cacheCleared, 1)
})

test('交易目录刷新验证成功后原子替换且合并并发请求', async () => {
  const { catalog, status } = await loadTradeCatalog(catalogPath)
  const replacement = structuredClone(catalog)
  replacement.generatedAt = '2026-08-11T12:00:00.000Z'
  let calls = 0
  let completeRefresh
  const refresh = new Promise((resolve) => { completeRefresh = resolve })
  const updates = []
  const service = new PriceCheckService({
    auth: { getStatus: () => ({ authenticated: true }), registerCacheClearer: () => {} },
    client: { clearCache() {} },
    catalog,
    catalogStatus: { ...status, degraded: true },
    catalogRefresher: async () => { calls += 1; return refresh },
    overlay: { update: (snapshot) => updates.push(structuredClone(snapshot)) }
  })
  const first = service.refreshCatalog()
  const second = service.refreshCatalog()
  assert.equal(service.catalog, catalog)
  assert.equal(service.catalogStatus.loading, true)
  completeRefresh({ catalog: replacement, status: { ...status, provider: 'official', degraded: false } })
  const [firstStatus, secondStatus] = await Promise.all([first, second])
  assert.equal(calls, 1)
  assert.equal(service.catalog, replacement)
  assert.equal(firstStatus.degraded, false)
  assert.deepEqual(firstStatus, secondStatus)
  assert.equal(updates.at(-1).catalog.loading, false)
})

test('交易目录刷新失败保留当前目录并暴露可重试降级原因', async () => {
  const { catalog, status } = await loadTradeCatalog(catalogPath)
  const service = new PriceCheckService({
    auth: { getStatus: () => ({ authenticated: true }), registerCacheClearer: () => {} },
    client: { clearCache() {} },
    catalog,
    catalogStatus: status,
    catalogRefresher: async () => { throw new Error('官方接口超时') },
    overlay: { update() {} }
  })
  await assert.rejects(service.refreshCatalog(), /官方接口超时/)
  assert.equal(service.catalog, catalog)
  assert.equal(service.catalogStatus.degraded, true)
  assert.equal(service.catalogStatus.loading, false)
  assert.match(service.catalogStatus.warning, /继续使用当前目录.*官方接口超时/)
})

test('查价分页只使用服务端保存的结果 ID 并限制为 50 条', async () => {
  const { catalog, status } = await loadTradeCatalog(catalogPath)
  const ids = Array.from({ length: 65 }, (_, index) => `id${index}`)
  const fetchBatches = []
  const service = new PriceCheckService({
    auth: { getStatus: () => ({ authenticated: true, accountName: 'me' }), registerCacheClearer: () => {} },
    client: {
      clearCache() {},
      search: async () => ({ id: 'queryPage', total: 65, result: ids }),
      fetch: async (_queryId, batch) => {
        fetchBatches.push([...batch])
        return {
          result: batch.map((id) => ({
            id,
            item: { ilvl: 86 },
            listing: {
              indexed: '2026-07-29T00:00:00Z',
              account: { name: `seller-${id}`, online: true },
              price: { amount: 1, currency: 'chaos', type: '~b/o' }
            }
          }))
        }
      }
    },
    catalog,
    catalogStatus: status
  })
  service.updateRuntime({ enabled: true })
  await service.check({ league: 'S29', text: '物品类别: 通货\n稀 有 度: 普通\n混沌石' })
  for (let index = 0; index < 5; index += 1) await service.loadMore()
  assert.deepEqual(fetchBatches.map((batch) => batch.length), [10, 10, 10, 10, 10])
  assert.equal(service.latest.result.listings.length, 50)
  assert.equal(service.latest.remainingResultIds.length, 15)
  await service.loadDistribution()
  assert.deepEqual(fetchBatches.map((batch) => batch.length), [10, 10, 10, 10, 10, 10, 5])
  assert.equal(service.latest.result.listings.length, 50)
  assert.equal(service.latest.result.distribution.fetched, 65)
  assert.equal(service.latest.result.distribution.complete, true)
  assert.equal(service.latest.remainingResultIds.length, 0)
})

test('连续查询时迟到的旧请求不能覆盖新物品', async () => {
  const { catalog, status } = await loadTradeCatalog(catalogPath)
  let resolveFirst
  let searches = 0
  const firstSearch = new Promise((resolve) => { resolveFirst = resolve })
  const overlayStates = []
  const service = new PriceCheckService({
    auth: { getStatus: () => ({ authenticated: true, accountName: 'me' }), registerCacheClearer: () => {} },
    client: {
      clearCache() {},
      search: async () => (++searches === 1 ? firstSearch : { id: 'new-query', total: 0, result: [] }),
      fetch: async () => ({ result: [] })
    },
    catalog,
    catalogStatus: status,
    overlay: {
      create: (state) => overlayStates.push(state),
      update: (state) => overlayStates.push(state)
    }
  })
  service.updateRuntime({ enabled: true })
  const itemText = (name) => `物品类别: 通货\n稀 有 度: 普通\n${name}\n--------`
  const oldRequest = service.check({ league: '测试赛季', text: itemText('旧物品') }).catch((error) => error)
  await Promise.resolve()
  const newest = await service.check({ league: '测试赛季', text: itemText('新物品') })
  resolveFirst({ id: 'old-query', total: 0, result: [] })
  const oldError = await oldRequest

  assert.equal(oldError.name, 'AbortError')
  assert.equal(newest.model.item.name, '新物品')
  assert.equal(service.latest.model.item.name, '新物品')
  assert.equal(overlayStates.at(-1).model.item.name, '新物品')
})

test('官方市集跳转使用搜索返回的 query ID', async () => {
  const { catalog, status } = await loadTradeCatalog(catalogPath)
  let openedUrl = ''
  const service = new PriceCheckService({
    auth: { getStatus: () => ({ authenticated: true, accountName: 'me' }), registerCacheClearer: () => {} },
    client: {
      clearCache() {},
      search: async () => ({ id: 'queryABC123', total: 0, result: [] }),
      fetch: async () => ({ result: [] })
    },
    catalog,
    catalogStatus: status,
    shell: { openExternal: async (url) => { openedUrl = url } }
  })
  service.updateRuntime({ enabled: true })
  await service.check({
    league: 'S29 测试赛季',
    text: '物品类别: 通货\n稀 有 度: 普通\n混沌石\n--------'
  })
  await service.openOfficial()
  assert.equal(openedUrl, 'https://poe.game.qq.com/trade/search/S29%20%E6%B5%8B%E8%AF%95%E8%B5%9B%E5%AD%A3/queryABC123')
  assert.doesNotMatch(openedUrl, /\?q=/)
})

test('陈旧状态按生成时间计算', async () => {
  const raw = JSON.parse(await readFile(catalogPath, 'utf8'))
  assert.equal(tradeCatalogStatus(raw, Date.parse('2027-07-29T00:00:00Z')).stale, true)
})
