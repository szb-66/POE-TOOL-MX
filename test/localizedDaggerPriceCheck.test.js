import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createLocalizationTextResolver } from '../electron/modules/localization/text.js'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { localizedDagger } from './fixtures/priceCheckLocalizedDagger.js'

// Stable rows (including source hashes) from the installed 3.30.0b signed export.
const entries = JSON.parse(readFileSync(new URL('./fixtures/price-check-localized-dagger-entries.json', import.meta.url)))
const catalog = JSON.parse(readFileSync(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)))

test('真实传奇符文匕首的类别显示与米单位不再阻止国际服查价', async () => {
  const searches = []
  const service = new PriceCheckService({
    auth: { getStatus: () => ({ authenticated: true }) },
    client: {
      server: { id: 'international', label: '国际服' }, clearCache() {},
      search: async (league, query) => { searches.push({ league, query }); return { id: 'test', total: 0, result: [] } },
      fetch: async () => ({ result: [] })
    },
    catalog, manualInputOnly: true, localizationProvider: () => entries
  })
  const result = await service.check({ league: 'Covens', text: localizedDagger, options: { initialSelection: 'all' } })
  assert.equal(result.model.identity.name, 'The Consuming Dark')
  assert.equal(result.model.identity.type, 'Fiend Dagger')
  assert.equal(result.model.stats.length, 6)
  assert.equal(searches.length, 1)
  assert.equal(searches[0].query.query.name, 'The Consuming Dark')
  assert.equal(searches[0].query.query.type, 'Fiend Dagger')
  assert.equal(searches[0].query.query.stats[0].filters.length, 6)
})

test('结构字段的消歧不放宽底材或未知属性单位检查', () => {
  const resolver = createLocalizationTextResolver(entries)
  assert.throws(() => resolver.toEnglish('符文匕首'), error => error.code === 'LOCALIZATION_AMBIGUOUS')
  assert.throws(() => resolver.resolve(localizedDagger.replace('兽血短匕', '符文匕首')), error => error.code === 'LOCALIZATION_UNRESOLVED')
  assert.throws(() => resolver.resolve(localizedDagger.replace('1 米', '1 未知单位')), error => error.code === 'LOCALIZATION_UNRESOLVED')
  assert.throws(() => resolver.resolve(localizedDagger.replace('物品类别: 符文匕首\n', '').replace('符文匕首\n物理伤害', '未知类别\n物理伤害')), error => error.code === 'LOCALIZATION_UNRESOLVED')
})
