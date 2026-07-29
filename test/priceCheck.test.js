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
  sanitizePriceCheckModel
} from '../electron/modules/priceCheck/query.js'
import { PoeCnTradeClient } from '../electron/modules/priceCheck/client.js'
import { PriceCheckService, summarizeListings } from '../electron/modules/priceCheck/service.js'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { generateTradeCatalog, parseNdjson } from '../scripts/generateTradeCatalog.js'
import { captureFreshClipboardText, capturePoeItemText } from '../electron/modules/priceCheck/clipboardCapture.js'

const catalogPath = path.resolve('electron/modules/priceCheck/catalog.json')

test('国服交易目录加载版本、计数和陈旧状态', async () => {
  const { catalog, status } = await loadTradeCatalog(catalogPath, Date.parse('2026-07-30T00:00:00Z'))
  assert.equal(status.gameVersion, '3.28')
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
  }, Date.parse('2026-07-29T01:00:00Z'))
  assert.equal(status.provider, 'official')
  assert.equal(status.degraded, false)
  assert.ok(status.counts.stats >= 101)
  const match = matchCatalogStat(catalog, '攻击速度提高 17%', 'explicit')
  assert.equal(match.id, 'explicit.stat_100000')
  assert.deepEqual(match.values, [17])
  assert.equal(matchCatalogStat(catalog, '裂隙镜像 (难度 12)', 'pseudo').id, 'pseudo.lake_62572')
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

function response(body, status = 200, contentType = 'application/json') {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers({ 'content-type': contentType }),
    text: async () => typeof body === 'string' ? body : JSON.stringify(body)
  }
}

test('腾讯 Provider 缓存相同搜索并校验响应结构', async () => {
  let calls = 0
  let clock = 10000
  const session = { fetch: async () => { calls += 1; return response({ id: 'query1', result: ['abc'], total: 1 }) } }
  const client = new PoeCnTradeClient({ session, now: () => clock })
  const first = await client.search('测试赛季', { query: {} })
  const second = await client.search('测试赛季', { query: {} })
  assert.equal(first.id, second.id)
  assert.equal(calls, 1)
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
    text: '物品类别: 通货\n稀 有 度: 普通\n混沌石\n--------'
  })
  assert.equal(result.result.queryId, 'q1')
  assert.equal(result.result.listings[0].amount, 2)
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
