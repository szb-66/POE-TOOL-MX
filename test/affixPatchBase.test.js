import test from 'node:test'
import assert from 'node:assert/strict'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { createPriceCheckModel, buildOfficialTradeQuery } from '../electron/modules/priceCheck/query.js'
import { affixPatchAmulet } from './fixtures/affixPatchBase.js'

const { catalog } = await loadTradeCatalog()

test('名称和底材宽松清理补丁标记，保留不成对及其他括号', () => {
  for (const [input, expected] of [
    ['聚焦项链[※※]', '聚焦项链'],
    ['[高价值]聚焦[123]项链[][45d 20c] ', '聚焦项链'],
    ['聚焦项链[提示: 已腐化]', '聚焦项链'],
    ['聚焦项链', '聚焦项链'],
    ['聚焦项链[未闭合', '聚焦项链[未闭合'],
    ['聚焦项链]', '聚焦项链]'],
    ['聚焦项链（※※）【高价值】', '聚焦项链（※※）【高价值】']
  ]) {
    const parsed = parseItemInfo(`物品类别: 项链\n稀有度: 稀有\n${input}\n${input}\n--------\n物品等级: 84`)
    assert.equal(parsed.name, expected, input)
    assert.equal(parsed.baseName, expected, input)
    assert.equal(parsed.isCorrupted, false)
  }
})

test('真实高价值项链保留词缀与等阶，并提交真实底材', () => {
  const parsed = parseItemInfo(affixPatchAmulet)
  assert.deepEqual(parsed, parseItemInfo(affixPatchAmulet.replace('[※※]', '')))
  assert.equal(parsed.level, 84)
  assert.equal(parsed.implicitMods.length, 4)
  assert.deepEqual(parsed.explicitMods, ['法术伤害提高 20%', '攻击附加 10 - 16 基础冰霜伤害', '+31% 全域暴击伤害加成'])
  assert.deepEqual(parsed.detailedMods.map(mod => mod.tier), [2, 5, 2])
  assert.deepEqual(parsed.detailedMods.flatMap(mod => mod.originalLines), [
    '法术伤害提高 20(18-22)%', '攻击附加 10(8-11) - 16(16-19) 基础冰霜伤害', '+31(30-34)% 全域暴击伤害加成'
  ])
  for (const [category, base] of [['项链', '聚焦项链'], ['戒指', '螺纹戒指']]) {
    const text = affixPatchAmulet.replace('物品类别: 项链', `物品类别: ${category}`).replace('聚焦项链', base)
    const model = createPriceCheckModel(parseItemInfo(text), catalog)
    assert.equal(model.identity.type, base)
    assert.equal(buildOfficialTradeQuery(model).query.type, base)
  }
  assert.ok(affixPatchAmulet.includes('聚焦项链[※※]'))
})

test('海图单行名称也清理补丁且不影响正文', () => {
  const parsed = parseItemInfo('物品类别: 海图\n稀有度: 稀有\n金沙海床海图[高价值]\n--------\n物品等级: 84')
  assert.equal(parsed.name, '金沙海床海图')
  assert.equal(parsed.baseName, '金沙海床海图')
})
