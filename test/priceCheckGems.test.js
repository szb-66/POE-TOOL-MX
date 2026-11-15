import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { buildOfficialTradeQuery } from '../electron/modules/priceCheck/query.js'
import { createLocalizationTextResolver } from '../electron/modules/localization/text.js'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { minionSpeedSupport } from './fixtures/priceCheckSupportGem.js'

const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
const { entries } = JSON.parse(await readFile(new URL('./fixtures/price-check-gem-entries.json', import.meta.url), 'utf8'))
const gems = catalog.items.filter(({ category }) => category === 'gem')
const visible = (value) => value.replace(/\[([^\]|]+)\|([^\]]*)\]/g, '$2').replace(/\[([^\]]+)\]/g, '$1').replace(/<[^<>]+>\{([^{}]*)\}/g, '$1')

function localizedName(name, language) {
  if (language === 'en') return name
  const combo = name.match(/^(Vaal .+) \((.+)\)$/)
  if (combo) return `${localizedName(combo[1], language)} (${localizedName(combo[2], language)})`
  const rows = entries.filter((entry) => visible(entry.en) === name && entry[language])
  const preferred = rows.find(({ table }) => table === 'baseitemtypes') || rows.find(({ table }) => table === 'gemeffects') || rows[0]
  assert.ok(preferred, `${language}: signed game name missing for ${name}`)
  return visible(preferred[language])
}

function fixture() {
  const searches = []
  const service = new PriceCheckService({
    auth: { getStatus: () => ({ authenticated: true }) },
    client: { server: { id: 'international' }, clearCache() {},
      search: async (league, query) => { searches.push(query); return { id: 'gem-fixture', total: 0, result: [] } },
      fetch: async () => ({ result: [] }) },
    catalog, manualInputOnly: true, localizationProvider: () => entries
  })
  return { service, searches }
}

function gemText(entry, language) {
  const support = /Support$/.test(entry.baseType)
  const level = entry.baseType.startsWith('Awakened ') ? 5 : 6
  const category = language === 'en' ? `Item Class: ${support ? 'Support Gems' : 'Skill Gems'}`
    : language === 'tw' ? `物品種類: ${support ? '輔助寶石' : '技能寶石'}` : `物品类别: ${support ? '辅助宝石' : '技能宝石'}`
  const rarity = language === 'en' ? 'Rarity: Gem' : language === 'tw' ? '稀有度: 寶石' : '稀有度: 宝石'
  const properties = language === 'en' ? `Level: ${level}\nQuality: +20%\n--------\nRequirements:\nLevel: 35`
    : language === 'tw' ? `等級: ${level}\n品質: +20%\n--------\n需求:\n等級: 35` : `等级: ${level}\n品质: +20%\n--------\n需求:\n等级: 35`
  const corrupted = language === 'en' ? 'Corrupted' : language === 'tw' ? '已汙染' : '已腐化'
  return `${category}\n${rarity}\n${localizedName(entry.text || entry.baseType, language)}\n--------\n${properties}\n--------\n${corrupted}`
}

for (const language of ['cn', 'tw', 'en']) {
  test(`873条官方宝石身份经${language}游戏译名解析及官方请求保持精确`, () => {
    const { service } = fixture()
    const failures = []
    for (const entry of gems) {
      // The 49 Vaal/transfigured combinations use the catalogue's explicit
      // combined display format, assembled from two unchanged game name rows.
      // They are format coverage, not newly captured in-game clipboard samples.
      const name = entry.text || entry.baseType
      try {
        const model = service.parse(gemText(entry, language))
        for (const property of model.properties.filter(({ id }) => ['misc.gemLevel', 'misc.quality'].includes(id))) {
          property.enabled = true
          property.max = property.min
        }
        const query = buildOfficialTradeQuery(model).query
        assert.deepEqual(query.type, entry.discriminator ? { discriminator: entry.discriminator, option: entry.baseType } : entry.baseType)
        const level = entry.baseType.startsWith('Awakened ') ? 5 : 6
        assert.equal(model.item.gemLevel, level)
        assert.equal(model.item.quality, 20)
        assert.equal(model.facts.corrupted, true)
        assert.deepEqual(query.filters.misc_filters.filters.gem_level, { min: level, max: level })
        assert.deepEqual(query.filters.misc_filters.filters.quality, { min: 20, max: 20 })
        assert.equal(query.filters.misc_filters.filters.corrupted.option, 'true')
        assert.deepEqual(model.stats, [])
        assert.deepEqual(model.unknownStats, [])
        assert.equal(model.presentation.language, language)
        assert.equal(model.presentation.texts[name], localizedName(name, language))
      } catch (error) { failures.push(`${name}: ${error.message}`) }
    }
    assert.equal(gems.length, 873)
    assert.equal(failures.length, 0, `${failures.length} failures:\n${failures.slice(0, 15).join('\n')}`)
  })
}

test('用户完整辅助宝石文本查询与重查保留等级6及原语言，不将技能描述作为装备词缀', async () => {
  const { service, searches } = fixture()
  const result = await service.check({ league: 'Covens', text: minionSpeedSupport, options: { initialSelection: 'all' } })
  assert.equal(result.model.identity.type, 'Minion Speed Support')
  assert.equal(result.model.item.gemLevel, 6)
  assert.equal(result.model.presentation.texts['Minion Speed Support'], '召唤生物速度(辅)')
  assert.equal(result.model.presentation.language, 'cn')
  assert.deepEqual(result.model.stats, [])
  assert.deepEqual(result.model.unknownStats, [])
  assert.equal(searches.length, 1)
  assert.equal(searches[0].query.type, 'Minion Speed Support')
  const level = result.model.properties.find(({ id }) => id === 'misc.gemLevel')
  assert.equal(level.min, 6)
  level.enabled = true
  await service.rerun({ model: result.model })
  assert.equal(searches.length, 2)
  assert.equal(searches[1].query.type, 'Minion Speed Support')
  assert.equal(searches[1].query.filters.misc_filters.filters.gem_level.min, 6)
})

test('宝石描述投影不会放宽普通装备未知中文词缀的阻断', () => {
  const { service } = fixture()
  for (const header of ['稀有度: 普通\nIron Ring', '稀有度: 稀有\n未知稀有名字\nIron Ring']) {
    assert.throws(() => service.parse(`物品类别: 戒指\n${header}\n--------\n未知装备伤害提高 127%`),
      (error) => error.code === 'LOCALIZATION_UNRESOLVED')
  }
})

test('等级1与腐化21级23品质辅助宝石保留交易数值和状态', () => {
  const { service } = fixture()
  for (const [level, quality, corrupted] of [[1, 0, false], [21, 23, true]]) {
    const text = minionSpeedSupport.replace('等级: 6', `等级: ${level}\n品质: +${quality}%`) + (corrupted ? '\n--------\n已腐化' : '')
    const model = service.parse(text)
    assert.equal(model.item.gemLevel, level)
    assert.equal(model.item.quality, quality)
    assert.equal(model.facts.corrupted, corrupted)
    for (const property of model.properties.filter(({ id }) => ['misc.gemLevel', 'misc.quality'].includes(id))) {
      property.enabled = true
      property.max = property.min
    }
    const query = buildOfficialTradeQuery(model).query
    assert.deepEqual(query.filters.misc_filters.filters.gem_level, { min: level, max: level })
    if (quality) assert.deepEqual(query.filters.misc_filters.filters.quality, { min: quality, max: quality })
  }
})

test('带井号标记的宝石状态和改造标志在描述投影后仍然保留', () => {
  const { service } = fixture()
  for (const state of ['## 已腐化', '## 已汙染', '## Corrupted']) {
    assert.equal(service.parse(`${minionSpeedSupport}\n--------\n${state}`).facts.corrupted, true, state)
  }
  const resolver = createLocalizationTextResolver(entries)
  for (const marker of ['## 改造', '## Transfigured']) {
    const resolved = resolver.resolve(`${minionSpeedSupport}\n--------\n${marker}`, { catalog })
    assert.equal(parseItemInfo(resolved.text).gemVariant, true, marker)
  }
})

test('瓦尔改造组合必须是目录中实际存在的完整组合，不能拼接两个已知宝石名误查', () => {
  const { service } = fixture()
  for (const language of ['cn', 'tw']) {
    const valid = gems.find(({ text }) => text === 'Vaal Arc (Arc of Oscillating)')
    const invalid = gemText(valid, language).replace(localizedName('Arc of Oscillating', language), localizedName('Absolution of Inspiring', language))
    assert.throws(() => service.parse(invalid), (error) => error.code === 'LOCALIZATION_UNRESOLVED')
  }
})
