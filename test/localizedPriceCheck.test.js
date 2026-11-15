import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createLocalizationTextResolver } from '../electron/modules/priceCheck/localizationText.js'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { buildOfficialTradeQuery } from '../electron/modules/priceCheck/query.js'

const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
const entry = (id, en, tw, cn, extra = {}) => ({ kind: 'dat', table: 'BaseItemTypes', id, field: 'Name', en, tw, cn, sourceHash: createHash('sha256').update(en).digest('hex'), ...extra })
const entries = [
  entry('Metadata/Items/Rings/Ring3', 'Coral Ring', '珊瑚戒指', '珊瑚戒指'),
  entry('base_maximum_life', '+{0} to maximum Life', '+{0} 最大生命', '+{0} 最大生命', { kind: 'stat', table: 'metadata/statdescriptions/stat_descriptions.txt', field: 'variant:0' })
]
const chinese = '物品種類: 戒指\n稀有度: 稀有\n风暴之环\n珊瑚戒指\n--------\n物品等級: 80\n--------\n+89 最大生命'
const english = 'Item Class: Rings\nRarity: Rare\nStorm Circle\nCoral Ring\n--------\nItem Level: 80\n--------\n+89 to maximum Life'

function serviceFixture(extra = {}) {
  const searches = []
  const client = { server: { id: 'international', label: '国际服' }, clearCache() {},
    search: async (league, query) => { searches.push({ league, query }); return { id: 'fixture', total: 0, result: [] } },
    fetch: async () => ({ result: [] }) }
  const service = new PriceCheckService({ auth: { getStatus: () => ({ authenticated: true }) }, client, catalog,
    manualInputOnly: true, localizationProvider: () => entries, ...extra })
  return { service, client, searches }
}

test('简体繁体混合文本按稳定条目映射成国际服身份和交易词缀，保留数值', async () => {
  const { service, searches } = serviceFixture()
  const result = await service.check({ league: 'Covens', text: chinese, options: { initialSelection: 'all' } })
  assert.equal(result.model.identity.type, 'Coral Ring')
  assert.ok(result.model.stats.some(stat => stat.id === 'explicit.stat_3299347043' && stat.values[0] === 89))
  assert.equal(searches.length, 1)
  assert.equal(searches[0].league, 'Covens')
  assert.equal(searches[0].query.query.type, 'Coral Ring')
  assert.match(JSON.stringify(searches[0].query), /explicit.stat_3299347043/)
})

test('纯英文和英文头部混合中文词缀查询得到相同国际服标识', () => {
  const { service } = serviceFixture()
  const expected = service.parse(english, { initialSelection: 'all' })
  const mixed = service.parse(english.replace('+89 to maximum Life', '+89 最大生命'), { initialSelection: 'all' })
  assert.deepEqual(mixed.identity, expected.identity)
  assert.deepEqual(buildOfficialTradeQuery(mixed), buildOfficialTradeQuery(expected))
  assert.equal(mixed.stats[0].displayText, '+89 最大生命')
})

test('国际服手动查价不要求快捷开关，启用后英文和受管汉化均可通过捕获打开浮窗', async () => {
  let captured = 0
  let text = english
  const overlays = []
  const { service } = serviceFixture({ manualInputOnly: false, allowManualQueries: true,
    captureClipboard: async () => { captured++; return text },
    overlay: { create: snapshot => overlays.push(snapshot), update() {}, prepare() {} } })
  const manual = await service.check({ league: 'Covens', text: chinese })
  assert.equal(manual.model.identity.type, 'Coral Ring')
  await assert.rejects(service.captureAndCheck({ league: 'Covens' }), /尚未启用/)
  assert.equal(captured, 0)
  service.updateRuntime({ enabled: true, league: 'Covens' })
  const original = await service.captureAndCheck({ league: 'Covens' })
  text = chinese
  const localized = await service.captureAndCheck({ league: 'Covens' })
  assert.deepEqual(localized.model.identity, original.model.identity)
  assert.deepEqual(buildOfficialTradeQuery(localized.model), buildOfficialTradeQuery(original.model))
  assert.equal(localized.model.stats[0].displayText, '+89 最大生命')
  assert.equal(captured, 2)
  assert.ok(overlays.some(snapshot => snapshot.status === 'ready-to-query'))
})

test('魔法单行名称仅按稳定底材别名解析，详细繁体词缀头保留等阶和来源', () => {
  const { service } = serviceFixture()
  const magic = service.parse('物品種類: 戒指\n稀有度: 魔法\n健壮的珊瑚戒指\n--------\n物品等級: 80\n--------\n{ 前綴詞綴 "健壮的" (等階: 1) — 生命 }\n+89 最大生命')
  assert.equal(magic.identity.type, 'Coral Ring')
  assert.ok(magic.stats.some(stat => stat.id === 'explicit.stat_3299347043' && stat.tier === 1))
})

test('没有词库、源文哈希错误和名称歧义均阻止发起查询，不使用国服目录兜底', async () => {
  const alternatives = [[], entries.map(value => ({ ...value, sourceHash: '0'.repeat(64) })), [
    ...entries, entry('different-stable-id', 'Iron Ring', '珊瑚戒指', '珊瑚戒指')
  ]]
  for (const data of alternatives) {
    const { service, searches } = serviceFixture({ localizationProvider: () => data })
    await assert.rejects(service.check({ league: 'Covens', text: chinese }), error => /^LOCALIZATION_/.test(error.code))
    assert.equal(searches.length, 0)
  }
})

test('资源中的英文身份不存在于国际服目录时拒绝查询', async () => {
  const data = [entry('invented-base', 'Invented Ring', '不存在的戒指', '不存在的戒指')]
  const { service, searches } = serviceFixture({ localizationProvider: () => data })
  await assert.rejects(service.check({ league: 'Covens', text: '物品类别: 戒指\n稀有度: 普通\n不存在的戒指\n--------\n物品等级: 80' }), /未匹配国际服交易目录/)
  assert.equal(searches.length, 0)
})

test('未知中文、英文词缀或多个官方候选不被静默省略', async () => {
  for (const text of [chinese.replace('+89 最大生命', '+89 未知效果'), english.replace('+89 to maximum Life', 'Grants 89 entirely unknown power')]) {
    const { service, searches } = serviceFixture()
    await assert.rejects(service.check({ league: 'Covens', text }), /已阻止省略条件查询/)
    assert.equal(searches.length, 0)
  }
})

test('占位符按编号重排，字面符号不会被当成正则，重复参数冲突拒绝匹配', () => {
  const resolver = createLocalizationTextResolver([
    entry('reorder', 'Gain {0}% Damage and {1} Life', '獲得 {1} 生命及 {0}% 傷害', '获得 {1} 生命及 {0}% 伤害', { kind: 'stat' }),
    entry('literal', 'Gain {0} Life (Local)', '獲得 {0} 生命 (區域)', '获得 {0} 生命 (区域)', { kind: 'stat' }),
    entry('repeated', 'Gain {0} Life twice', '{0} 生命與 {0} 生命', '{0} 生命与 {0} 生命', { kind: 'stat' })
  ])
  assert.equal(resolver.resolve('獲得 40 生命及 12% 傷害').text, 'Gain 12% Damage and 40 Life')
  assert.equal(resolver.resolve('获得 25 生命 (区域)').text, 'Gain 25 Life (Local)')
  assert.throws(() => resolver.resolve('获得 25 生命 X区域Y'), /未匹配/)
  assert.throws(() => resolver.resolve('25 生命与 26 生命'), /未匹配/)
})

test('真实资源的带符号和双数值模板可匹配，数字索引不会忽略模板里的固定数字', () => {
  const resolver = createLocalizationTextResolver([
    entry('base_maximum_life', '{0:+d} to maximum Life', '{0:+d} 最大生命', '{0:+d} 最大生命', { kind: 'stat' }),
    entry('attack_added_physical', 'Adds {0} to {1} Physical Damage to Attacks', '攻擊附加 {0} 至 {1} 物理傷害', '攻击附加 {0} - {1} 基础物理伤害', { kind: 'stat' }),
    entry('fixed-time', 'Gain {0} Life after 10 seconds', '10 秒後獲得 {0} 生命', '10 秒后获得 {0} 生命', { kind: 'stat' })
  ])
  assert.equal(resolver.resolve('+89 最大生命').text, '+89 to maximum Life')
  assert.equal(resolver.resolve('-20 最大生命').text, '-20 to maximum Life')
  assert.equal(resolver.resolve('攻击附加 1 - 4 基础物理伤害').text, 'Adds 1 to 4 Physical Damage to Attacks')
  assert.equal(resolver.resolve('10 秒后获得 35 生命').text, 'Gain 35 Life after 10 seconds')
  assert.throws(() => resolver.resolve('15 秒后获得 35 生命'), /未匹配/)
})

test('资源激活后清理旧结果，并丢弃更新前查询的迟到响应', async () => {
  let revision = 'r1'
  const { service, client } = serviceFixture({ localizationRevisionProvider: () => revision })
  let completeSearch
  client.search = () => new Promise(resolve => { completeSearch = resolve })
  const pending = service.check({ league: 'Covens', text: english })
  revision = 'r2'
  completeSearch({ id: 'old', total: 0, result: [] })
  await assert.rejects(pending, error => error.name === 'AbortError')
  assert.equal(service.latest, null)
  assert.equal(service.getStatus().localizationRevision, 'r2')
})

test('词库失效或账号退出后迟到的网络错误不会恢复可重试模型', async () => {
  for (const change of ['revision', 'logout']) {
    let revision = 'r1'
    let authenticated = true
    const { service, client } = serviceFixture({ localizationRevisionProvider: () => revision,
      auth: { getStatus: () => ({ authenticated }) } })
    let rejectSearch
    client.search = () => new Promise((_resolve, reject) => { rejectSearch = reject })
    const pending = service.check({ league: 'Covens', text: english })
    if (change === 'revision') revision = 'r2'
    else authenticated = false
    rejectSearch(Object.assign(Error('迟到的断网错误'), { code: 'NETWORK_ERROR' }))
    await assert.rejects(pending, /断网/)
    assert.equal(service.latest, null, change)
  }
})

test('增量词库应用后分页迟到结果不进入旧查询', async () => {
  let revision = 'r1'
  const { service, client } = serviceFixture({ localizationRevisionProvider: () => revision })
  service.latest = { result: { queryId: 'old' }, rawEntries: [], remainingResultIds: ['a'] }
  let completeFetch
  client.fetch = () => new Promise(resolve => { completeFetch = resolve })
  const pending = service.loadMore()
  revision = 'r2'
  completeFetch({ result: [{ id: 'a' }] })
  await assert.rejects(pending, error => error.name === 'AbortError')
  assert.equal(service.latest, null)
})

test('国际服底材不兼容时不会重试删除底材条件，国服旧流程不受影响', async () => {
  const { service, client } = serviceFixture()
  let calls = 0
  client.search = async () => { calls++; const error = new Error('unknown item base type'); error.details = { status: 400, officialMessage: 'unknown item base type' }; throw error }
  const text = 'Item Class: Amulets\nRarity: Unique\nThe Anvil\nAmber Amulet\n--------\nItem Level: 80'
  await assert.rejects(service.check({ league: 'Covens', text }), /不认识物品底材/)
  assert.equal(calls, 1)
})
