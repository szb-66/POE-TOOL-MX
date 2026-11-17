import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { soulMantleText } from './fixtures/localizedPriceCheckReportedItems.js'

const bundled = JSON.parse(readFileSync(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)))
const entries = JSON.parse(readFileSync(new URL('./fixtures/price-check-reported-items-entries.json', import.meta.url)))
// The current local official catalog also exposes the full support name as an effect filter.
const effect = { key: 'official-explicit-explicit-effect-1858870975',
  label: 'Socketed Gems are Supported by Level 数值 Spell Totem Support',
  matchers: ['Socketed Gems are Supported by Level # Spell Totem Support'],
  ids: { explicit: 'explicit.effect_1858870975' }, availability: 'international' }
const current = { ...bundled, stats: [...bundled.stats, effect] }

function fixture(catalog = current, dictionary = entries) {
  const searches = []
  const service = new PriceCheckService({ catalog, localizationProvider: () => dictionary, manualInputOnly: true,
    auth: { getStatus: () => ({ authenticated: true }) },
    client: { server: { id: 'international' }, clearCache() {},
      async search(league, query) { searches.push(query); return { id: 'soul-mantle', total: 0, result: [] } },
      async fetch() { return { result: [] } } }
  })
  return { service, searches }
}

test('完整祖灵之约在当前和旧目录保留全部五条词缀并提交正确辅助等级', async () => {
  for (const [catalog, id] of [[current, 'explicit.effect_1858870975'], [bundled, 'explicit.indexable_support_15']]) {
    const { service, searches } = fixture(catalog)
    const { model } = await service.check({ text: soulMantleText, league: 'Covens', options: { initialSelection: 'all' } })
    assert.equal(model.identity.name, 'Soul Mantle')
    assert.equal(model.identity.type, 'Spidersilk Robe')
    assert.deepEqual(model.unknownStats, [])
    assert.equal(model.stats.length, 5)
    assert.deepEqual(model.stats.map(stat => stat.values), [[109], [27], [20], [20], []])
    const support = model.stats.find(stat => stat.id === id)
    assert.ok(support)
    assert.equal(support.displayText, soulMantleText.split('\n').find(line => line.includes('寶石被等級')))
    const filters = searches[0].query.stats.flatMap(group => group.filters)
    assert.equal(filters.find(filter => filter.id === id).value.min, 20)
    await service.rerun({ model })
    assert.deepEqual(JSON.parse(JSON.stringify(searches[1])), JSON.parse(JSON.stringify(searches[0])))
  }
})

test('截图简体辅助行和繁体原文生成相同查询，详细等级范围仍保留实际值', async () => {
  const queries = []
  for (const text of [soulMantleText, soulMantleText.replace('插槽中的寶石被等級 20 的 ​法術圖騰輔助 輔助', '插槽中的宝石被等级 20 的 法术图腾辅助 辅助')]) {
    const { service, searches } = fixture()
    await service.check({ text, league: 'Covens', options: { initialSelection: 'all' } })
    queries.push(searches[0])
  }
  assert.deepEqual(queries[1], queries[0])
  const { service } = fixture()
  const model = service.parse(soulMantleText.replace('等級 20 的', '等級 20(18-22) 的'))
  assert.deepEqual(model.stats.find(stat => stat.id === 'explicit.effect_1858870975')?.values, [20])
})

test('未知辅助名或不可信名称仍阻止查询，不能省略条件', async () => {
  for (const [text, dictionary] of [
    [soulMantleText.replace('法術圖騰輔助', '未知輔助'), entries],
    [soulMantleText, entries.map(entry => ['grantedeffects', 'baseitemtypes'].includes(entry.table) && entry.en === 'Spell Totem Support'
      ? { ...entry, sourceHash: '0'.repeat(64) } : entry)]
  ]) {
    const { service, searches } = fixture(current, dictionary)
    await assert.rejects(service.check({ text, league: 'Covens' }), error => error.code === 'LOCALIZATION_UNRESOLVED')
    assert.deepEqual(searches, [])
  }
})
