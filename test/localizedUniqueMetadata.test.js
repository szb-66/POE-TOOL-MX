import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createLocalizationDictionary } from '../electron/modules/localization/text.js'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { leerCast, foulbornGifts } from './fixtures/priceCheckFixedAndFoulbornItems.js'

const entries = JSON.parse(readFileSync(new URL('./fixtures/price-check-fixed-foulborn-entries.json', import.meta.url)))
const catalog = JSON.parse(readFileSync(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)))
function fixture(data = entries) {
  const searches = []
  const service = new PriceCheckService({ auth: { getStatus: () => ({ authenticated: true }) },
    client: { server: { id: 'international', label: '国际服' }, clearCache() {},
      search: async (league, query) => { searches.push(query); return { id: 'fixture', total: 0, result: [] } },
      fetch: async () => ({ result: [] }) }, catalog, manualInputOnly: true, localizationProvider: () => data })
  return { service, searches }
}

test('共鸣之面固定数值尾注仅作显示，完整五词缀和实际50伤害均进入国际服查询', async () => {
  const { service, searches } = fixture()
  const first = await service.check({ league: 'Covens', text: leerCast, options: { initialSelection: 'all' } })
  assert.equal(first.model.identity.name, 'Leer Cast')
  assert.equal(first.model.stats.length, 5)
  assert.deepEqual(first.model.unknownStats, [])
  const aura = first.model.stats.find(s => s.id === 'explicit.stat_637766438')
  assert.deepEqual(aura.values, [50])
  assert.deepEqual(first.model.stats.find(s => s.id === 'explicit.stat_2154246560').values, [-25])
  assert.equal(first.model.stats.find(s => s.id === 'explicit.stat_2154246560').displayText, '伤害降低 25%')
  assert.equal(aura.displayText, '你和 7.5 米范围内的友军伤害提高 50% — 数值不可调整')
  assert.equal(searches[0].query.stats[0].filters.length, 5)
  assert.equal(searches[0].query.stats[0].filters.find(s => s.id === 'explicit.stat_2154246560').value.min, -25)
  const plain = fixture()
  await plain.service.check({ league: 'Covens', text: leerCast.replace(' — 数值不可调整', ''), options: { initialSelection: 'all' } })
  assert.deepEqual(searches[0], plain.searches[0])
  const retry = await service.rerun({ model: first.model })
  assert.equal(retry.model.stats.find(s => s.id === aura.id).displayText, aura.displayText)
  assert.deepEqual(searches[1], searches[0])
})

test('秽生神赐使用普通传奇官方身份及独立秽生过滤，保留完整原文与七条词缀', async () => {
  const { service, searches } = fixture()
  const first = await service.check({ league: 'Covens', text: foulbornGifts, options: { initialSelection: 'all' } })
  assert.equal(first.model.identity.name, 'Gifts from Above')
  assert.equal(first.model.identity.type, 'Diamond Ring')
  assert.equal(first.model.presentation.texts[first.model.identity.displayName], '秽生神赐')
  assert.equal(first.model.stateFilters.mutated, 'true')
  assert.equal(first.model.stats.length, 7)
  assert.deepEqual(first.model.unknownStats, [])
  assert.equal(searches[0].query.filters.misc_filters.filters.mutated.option, 'true')
  assert.ok(first.model.stats.some(s => s.sourceSubtype === 'foulborn' && s.values[0] === 38))
  assert.ok(first.model.stats.some(s => s.displayText === '當你暴擊時觸發等級 10 的奉獻 — 数值不可调整'))
})

test('未知词缀或错误尾注不能借固定值标记绕过解析', () => {
  const resolver = createLocalizationDictionary(entries)
  for (const text of [leerCast.replace('你和 7.5 米范围内的友军伤害提高 50%', '未知效果提高 50%'),
    leerCast.replace('数值不可调整', '数值不可调正'), leerCast.replace('你和 7.5 米范围内的友军伤害提高 50%', '')]) {
    assert.throws(() => resolver.resolve(text), error => error.code === 'LOCALIZATION_UNRESOLVED')
  }
})

test('多行复合词缀的尾注不拆散参数或抹掉显示原文', () => {
  const en = '+{0} to maximum Life\n+{1} to maximum Mana'
  const resolver = createLocalizationDictionary([...entries, { kind: 'stat', table: 'fixture', id: 'compound', field: 'variant:0',
    en, cn: '+{0} 生命\n+{1} 魔力', sourceHash: createHash('sha256').update(en).digest('hex') }])
  const original = '+10 生命\n+20 魔力 — 数值不可调整'
  const resolved = resolver.resolve(`物品类别: 戒指\n稀有度: 稀有\n测试\n宝钻戒指\n--------\n物品等级: 80\n--------\n${original}`)
  assert.ok(resolved.text.endsWith('+10 to maximum Life\n+20 to maximum Mana'))
  assert.ok(resolved.lineMappings.some(pair => pair.original === original && pair.canonical === '+10 to maximum Life\n+20 to maximum Mana'))
})

test('简繁英文固定值尾注均保留原文显示，并形成相同的官方过滤条件', async () => {
  const body = '你和 7.5 米范围内的友军伤害提高 50% — 数值不可调整'
  const alternatives = [body,
    '你跟 7.5 公尺內的友方增加 50% 傷害 — 無法使用的值',
    'You and Allies within 7.5 metres gain 50% increased Damage — Unscalable Value']
  let expected
  for (const original of alternatives) {
    const { service, searches } = fixture()
    const { model } = await service.check({ league: 'Covens', text: leerCast.replace(body, original), options: { initialSelection: 'all' } })
    assert.equal(model.stats.find(s => s.id === 'explicit.stat_637766438').displayText, original)
    if (expected) assert.deepEqual(searches[0], expected)
    else expected = searches[0]
  }
})

test('秽生模板仅作用于传奇名称，未知名称、错底材或不可信模板均不能发查询', async () => {
  for (const [text, data] of [
    [foulbornGifts.replace('秽生神赐', '秽生未知传奇'), entries],
    [foulbornGifts.replace('宝钻戒指', '节庆之面'), entries],
    [foulbornGifts, entries.filter(e => e.id !== 'MutatedUniqueName')],
    [foulbornGifts, entries.map(e => e.id === 'MutatedUniqueName' ? { ...e, sourceHash: '0'.repeat(64) } : e)]
  ]) {
    const { service, searches } = fixture(data)
    await assert.rejects(service.check({ league: 'Covens', text }))
    assert.equal(searches.length, 0)
  }
})

test('英文普通复制文本仅凭可信官方身份保留秽生名称和状态，不依赖详细词缀头', async () => {
  const resolver = createLocalizationDictionary(entries)
  const text = resolver.resolve(foulbornGifts).text.replace('{ Foulborn Unique Modifier }', '{ Unique Modifier }')
  const { service, searches } = fixture()
  const { model } = await service.check({ league: 'Covens', text, options: { initialSelection: 'all' } })
  assert.equal(model.identity.name, 'Gifts from Above')
  assert.equal(model.identity.displayName, 'Foulborn Gifts from Above')
  assert.equal(model.stateFilters.mutated, 'true')
  assert.equal(searches[0].query.filters.misc_filters.filters.mutated.option, 'true')
})
