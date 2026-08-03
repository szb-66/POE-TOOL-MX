import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  createOfficialTradeCatalog,
  loadTradeCatalog,
  matchCatalogStat,
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
import { generateTradeCatalog, parseNdjson } from '../scripts/generateTradeCatalog.js'
import { captureFreshClipboardText, capturePoeItemText } from '../electron/modules/priceCheck/clipboardCapture.js'

const catalogPath = path.resolve('electron/modules/priceCheck/catalog.json')

test('国服交易目录加载版本、计数和陈旧状态', async () => {
  const { catalog, status } = await loadTradeCatalog(catalogPath, Date.parse('2026-07-30T00:00:00Z'))
  assert.equal(status.gameVersion, '3.29')
  assert.equal(status.stale, false)
  assert.equal(status.counts.stats, catalog.stats.length)
})

test('交易目录拒绝重复 matcher 和无效 stat ID', async () => {
  const raw = JSON.parse(await readFile(catalogPath, 'utf8'))
  raw.stats[1].matchers = [...raw.stats[0].matchers]
  assert.throws(() => validateTradeCatalog(raw), /重复词缀 matcher/)
  raw.stats[1].matchers = ['#% 火焰抗性']
  raw.stats[1].ids.explicit = 'bad'
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

test('快捷查价优先高级复制并在捕获失败后回退普通复制', async () => {
  let value = '原内容'
  const attempts = []
  const clipboard = {
    readText: () => value,
    writeText: (next) => { value = next }
  }
  const captured = await capturePoeItemText({
    clipboard,
    releaseDelayMs: 0,
    timeoutMs: 2,
    pollMs: 1,
    sendCopy: async ({ advanced }) => {
      attempts.push(advanced)
      if (!advanced) value = '物品类别: 胸甲\n稀 有 度: 稀有\n回退物品'
    }
  })
  assert.deepEqual(attempts, [true, false])
  assert.match(captured, /回退物品/)
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
  const stats = [{ ref: 'Life', matchers: [{ string: '# 最大生命' }], trade: { ids: { explicit: ['explicit.stat_3299347043'] } } }]
  const input = { items: [{ name: '混沌石', refName: 'Chaos Orb', tradeTag: 'chaos' }], stats, gameVersion: '3.28', generatedAt: '2026-07-29T00:00:00Z' }
  assert.deepEqual(generateTradeCatalog(input), generateTradeCatalog(input))
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
