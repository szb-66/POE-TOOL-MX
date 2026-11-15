import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { priceCheckCategoryCorpus, priceCheckUsageCorpus } from './fixtures/priceCheckCategoryCorpus.js'

const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
const entries = JSON.parse(await readFile(new URL('./fixtures/price-check-category-entries.json', import.meta.url), 'utf8'))
const searches = []
const service = new PriceCheckService({
  catalog,
  manualInputOnly: true,
  localizationProvider: () => entries,
  auth: { getStatus: () => ({ authenticated: true }) },
  client: {
    server: { id: 'international', label: '国际服' },
    clearCache() {},
    search: async (league, query) => {
      searches.push({ league, query })
      return { id: 'category-corpus', total: 0, result: [] }
    },
    fetch: async () => ({ result: [] })
  }
})

for (const fixture of [...priceCheckCategoryCorpus, ...priceCheckUsageCorpus]) {
  test(`国际服分类语料 ${fixture.id} 保持官方物品身份`, async () => {
    searches.length = 0
    const result = await service.check({ league: 'Covens', text: fixture.text, options: { initialSelection: 'none' } })
    assert.equal(result.model.identity.type, fixture.expectedType)
    assert.equal(searches.length, 1, '应构建并发起一次官方查询')
    const type = searches[0].query.query.type
    assert.equal(typeof type === 'object' ? type.option : type, fixture.expectedType)
    assert.equal(typeof type === 'object' ? type.discriminator || '' : '', fixture.expectedDiscriminator)
  })
}

test('中文同名传奇通过真实底材区分戒指与项链', async () => {
  for (const [name, base, itemClass] of [['Timetwist', 'Moonstone Ring', 'Rings'], ['Warped Timepiece', 'Turquoise Amulet', 'Amulets']]) {
    const translatedName = entries.find(entry => entry.table === 'words' && entry.en === name && entry.cn)?.cn
    const translatedBase = entries.find(entry => entry.table === 'baseitemtypes' && entry.en === base && entry.cn)?.cn
    const translatedClass = entries.find(entry => entry.table === 'itemclasses' && entry.en === itemClass && entry.cn)?.cn
    assert.ok(translatedName && translatedBase && translatedClass)
    assert.equal(translatedName, '时空扭曲')
    searches.length = 0
    const result = await service.check({ league: 'Covens', text: `物品类别: ${translatedClass}\n稀有度: 传奇\n${translatedName}\n${translatedBase}\n--------\n物品等级: 80` })
    assert.equal(result.model.identity.name, name)
    assert.equal(result.model.identity.type, base)
    assert.equal(searches.length, 1)
    assert.equal(searches[0].query.query.name, name)
    assert.equal(searches[0].query.query.type, base)
  }
})
