import test from 'node:test'
import assert from 'node:assert/strict'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { createPriceCheckModel, buildOfficialTradeQuery } from '../electron/modules/priceCheck/query.js'
import { uniqueFlavorItem } from './fixtures/uniqueFlavorItem.js'

const { catalog } = await loadTradeCatalog()
const body = uniqueFlavorItem.slice(0, uniqueFlavorItem.indexOf('"那群'))
const realMods = [
  '+14 最大能量护盾',
  '你被感电的持续时间延长 100%',
  '感电会反射回自己身上 — 数值不可调整',
  '感电时移动速度加快 15%',
  '感电时伤害提高 60%',
  '40% 的闪电伤害转换为混沌伤害'
]

test('完整秽生传奇文本只解析六条真实属性，查价与去除描述的输入完全一致', () => {
  for (const text of [uniqueFlavorItem, uniqueFlavorItem.replaceAll('\n', '\r\n')]) {
    const item = parseItemInfo(text)
    assert.deepEqual(item.modifiers.map(m => m.text), realMods)
    assert.deepEqual(item.implicitMods, [realMods[0]])
    assert.deepEqual(item.explicitMods, [])
    assert.deepEqual(item.uniqueModifiers, [])
    assert.equal(item.level, 83)
    assert.equal(item.isMutated, true)
    const model = createPriceCheckModel(item, catalog)
    const clean = createPriceCheckModel(parseItemInfo(body), catalog)
    assert.deepEqual(model.stats, clean.stats)
    assert.deepEqual(model.unknownStats, clean.unknownStats)
    assert.deepEqual(buildOfficialTradeQuery(model), buildOfficialTradeQuery(clean))
    assert.ok(model.stats.some(s => s.type === 'pseudo' && s.min === 14))
  }
})

test('块外描述不依赖引号、数字或传奇目录，块内未知属性仍保留', () => {
  for (const description of ['没有引号的背景故事\n第二行故事\n- 叙述者', '历经 100 年\n伤害提高 60%\n第 15 位见证者']) {
    const text = body.replace('秽生马雷格罗的染血之环', '测试未收录传奇') + description
    const item = parseItemInfo(text)
    assert.deepEqual(item.modifiers.map(m => m.text), realMods)
    assert.deepEqual(item.explicitMods, [])
    const clean = createPriceCheckModel(parseItemInfo(text.slice(0, -description.length)), catalog)
    const model = createPriceCheckModel(item, catalog)
    assert.deepEqual(model.stats, clean.stats)
    assert.deepEqual(model.unknownStats, clean.unknownStats)
    const withUnknown = parseItemInfo(text + '\n--------\n{ 传奇属性 }\n测试未收录真实属性\n第二行真实属性\n--------\n后续故事')
    assert.deepEqual(withUnknown.modifiers.at(-1).lines, ['测试未收录真实属性', '第二行真实属性'])
    const unknownModel = createPriceCheckModel(withUnknown, catalog)
    for (const line of withUnknown.modifiers.at(-1).lines) {
      assert.ok(unknownModel.unknownStats.some(s => s.text === line))
    }
    assert.deepEqual(withUnknown.explicitMods, [])
  }
})

test('描述后的状态、新属性块和显式标记仍被解析', () => {
  const item = parseItemInfo(uniqueFlavorItem + `
--------
已腐化
已复制
已分裂
未鉴定
秽生
+10 最大生命 (implicit)
+11 最大生命 (crafted)
+12 最大生命 (fractured)
+13 最大生命 (enchant)
{ 传奇属性 — 伤害 }
新的无数值真实属性
另一行真实属性
--------
最后的背景描述`)
  for (const key of ['isCorrupted', 'isMirrored', 'isSplit', 'isUnidentified', 'isMutated', 'isFractured']) assert.equal(item[key], true, key)
  assert.ok(item.implicitMods.includes('+10 最大生命'))
  assert.deepEqual(item.craftedMods, ['+11 最大生命'])
  assert.ok(item.modifiers.some(m => m.type === 'fractured' && m.text === '+12 最大生命'))
  assert.ok(item.modifiers.some(m => m.type === 'enchant' && m.text === '+13 最大生命'))
  assert.deepEqual(item.modifiers.at(-1).lines, ['新的无数值真实属性', '另一行真实属性'])
  assert.deepEqual(item.explicitMods, [])
})

test('普通传奇复制及非传奇无标记属性维持既有解析', () => {
  const plain = `物品类别: 腰带
稀 有 度: 传奇
测试传奇
扣链腰带
--------
物品等级: 83
--------
+14 最大能量护盾 (implicit)
--------
感电会反射回自己身上
感电时伤害提高 60%`
  const item = parseItemInfo(plain)
  assert.deepEqual(item.explicitMods, ['感电会反射回自己身上', '感电时伤害提高 60%'])
  assert.equal(item.uniqueModifiers.length, 2)
  const rare = parseItemInfo(body.replace('传奇\n', '稀有\n') + '+20 最大生命')
  assert.deepEqual(rare.explicitMods, ['+20 最大生命'])
})
