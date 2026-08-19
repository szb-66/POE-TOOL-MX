import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import {
  buildOfficialTradeQuery,
  createPriceCheckModel,
  sanitizePriceCheckModel
} from '../electron/modules/priceCheck/query.js'

const catalogPath = path.resolve('electron/modules/priceCheck/catalog.json')

const LARGE_CLUSTER = `物品类别: 珠宝
稀 有 度: 稀有
日象赠礼
大型星团珠宝
--------
需求:
等级: 54
--------
物品等级: 83
--------
增加 11 个天赋技能 (enchant)
（增加的天赋技能不被视为在其它珠宝范围之内） (enchant)
（除非另有说明，所有增加的天赋技能均为小天赋） (enchant)
其中 2 个增加的天赋为珠宝槽 (enchant)
增加的小天赋获得：法杖攻击造成的击中和异常状态伤害提高 12% (enchant)
（小天赋指天赋树上所有非核心天赋、非专精天赋、非基石天赋，以及非珠宝插槽） (enchant)
--------
{ 前缀属性 "镶嵌的" (等阶：2) — 防御, 护甲 }
增加的小天赋还获得：+21(21-30) 护甲值
{ 前缀属性 "健康的" (等阶：2) — 生命 }
增加的小天赋还获得：+7(4-7) 最大生命
{ 后缀属性 "幼龙之" (等阶：3) — 元素, 火焰, 抗性 }
增加的小天赋还获得：+2(2-3)% 火焰抗性
--------
放入天赋树上配置好的大型珠宝槽。增加的天赋跟珠宝范围无关。可以右键点击从插槽中移除。
--------
出售获得通货:非绑定`

const MEDIUM_CLUSTER = `物品类别: 珠宝
稀 有 度: 魔法
中型星团珠宝
--------
物品等级: 72
--------
增加 6 个天赋技能 (enchant)
（增加的天赋技能不被视为在其它珠宝范围之内） (enchant)
（除非另有说明，所有增加的天赋技能均为小天赋） (enchant)
其中 1 个增加的天赋为珠宝槽 (enchant)
增加的小天赋获得：燃烧伤害提高 12% (enchant)
（小天赋指天赋树上所有非核心天赋、非专精天赋、非基石天赋，以及非珠宝插槽） (enchant)
--------
未鉴定
--------
放入天赋树上配置好的中型或大型珠宝槽。增加的天赋跟珠宝范围无关。可以右键点击从插槽中移除。
--------
出售获得通货:非绑定`

const SMALL_CLUSTER = `物品类别: 珠宝
稀 有 度: 魔法
小型星团珠宝
--------
物品等级: 84
--------
增加 3 个天赋技能 (enchant)
（增加的天赋技能不被视为在其它珠宝范围之内） (enchant)
（除非另有说明，所有增加的天赋技能均为小天赋） (enchant)
（小天赋指天赋树上所有非核心天赋、非专精天赋、非基石天赋，以及非珠宝插槽） (enchant)
--------
{ 前缀属性 "武艺精湛" (等阶：1) — 伤害, 攻击 }
其中 1 个增加的天赋为武艺精湛
--------
放入天赋树上配置好的小型、中型或大型珠宝槽。增加的天赋跟珠宝范围无关。可以右键点击从插槽中移除。`

const explanationPattern = /不被视为|除非另有说明|小天赋指|放入天赋树/

test('星团珠宝解析有效附魔并从共享物品模型排除说明文案', () => {
  const large = parseItemInfo(LARGE_CLUSTER)
  const medium = parseItemInfo(MEDIUM_CLUSTER)
  const small = parseItemInfo(SMALL_CLUSTER)

  assert.equal(large.baseName, '大型星团珠宝')
  assert.equal(medium.name, '中型星团珠宝')
  assert.equal(small.name, '小型星团珠宝')
  assert.equal(medium.isUnidentified, true)
  assert.deepEqual(large.modifiers.filter(({ type }) => type === 'enchant').map(({ text }) => text), [
    '增加 11 个天赋技能',
    '其中 2 个增加的天赋为珠宝槽',
    '增加的小天赋获得：法杖攻击造成的击中和异常状态伤害提高 12%'
  ])
  assert.equal(medium.modifiers.filter(({ type }) => type === 'enchant').length, 3)
  assert.deepEqual(small.modifiers.filter(({ type }) => type === 'enchant').map(({ text }) => text), [
    '增加 3 个天赋技能'
  ])
  assert.equal(large.modifiers.find(({ type }) => type === 'enchant').originalLines[0], '增加 11 个天赋技能')

  for (const item of [large, medium, small]) {
    const allText = [
      ...item.modifiers.flatMap(({ lines = [], originalLines = [] }) => [...lines, ...originalLines]),
      ...item.implicitMods,
      ...item.explicitMods,
      ...item.craftedMods
    ].join('\n')
    assert.doesNotMatch(allText, explanationPattern)
  }
  assert.deepEqual(large.modifiers.filter(({ type }) => ['prefix', 'suffix'].includes(type)).map(({ tier }) => tier), [2, 2, 3])
})

test('三种星团底材将已有附魔目录映射为默认启用的官方查询条件', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const cases = [
    {
      text: LARGE_CLUSTER,
      type: '大型星团珠宝',
      ids: ['enchant.stat_3086156145', 'enchant.stat_4079888060', 'enchant.stat_3948993189|5']
    },
    {
      text: MEDIUM_CLUSTER,
      type: '中型星团珠宝',
      ids: ['enchant.stat_3086156145', 'enchant.stat_4079888060', 'enchant.stat_3948993189|18']
    },
    {
      text: SMALL_CLUSTER,
      type: '小型星团珠宝',
      ids: ['enchant.stat_3086156145']
    }
  ]

  for (const fixture of cases) {
    const model = createPriceCheckModel(parseItemInfo(fixture.text), catalog, { initialSelection: 'auto' })
    const enchantStats = model.stats.filter(({ type }) => type === 'enchant')
    assert.equal(model.identity.type, fixture.type)
    assert.equal(model.identity.category, 'jewel')
    assert.deepEqual(enchantStats.map(({ id }) => id), fixture.ids)
    assert.ok(enchantStats.every(({ enabled }) => enabled))
    assert.equal(model.properties.find(({ id }) => id === 'misc.itemLevel').enabled, false)
    assert.doesNotMatch(model.unknownStats.map(({ text }) => text).join('\n'), explanationPattern)
    if (fixture.type === '小型星团珠宝') {
      const notable = model.stats.find(({ id }) => id === 'explicit.stat_1152182658')
      assert.equal(notable?.text, '其中 1 个增加的天赋为武艺精湛')
      assert.equal(notable?.enabled, true)
    }

    const query = buildOfficialTradeQuery(model).query
    assert.equal(query.type, fixture.type)
    assert.equal(query.filters.type_filters.filters.rarity.option, 'nonunique')
    assert.equal(query.filters.misc_filters?.filters.identified?.option, model.item.unidentified ? 'false' : undefined)
    const queryIds = query.stats[0].filters.map(({ id }) => id)
    assert.ok(fixture.ids.every((id) => queryIds.includes(id)))
    if (fixture.type === '大型星团珠宝') {
      assert.ok(queryIds.includes('explicit.stat_2554466725'))
      assert.ok(queryIds.includes('explicit.stat_3819827377'))
    }
  }
})

test('星团附魔可取消和编辑，普通珠宝附魔不改变自动初选语义', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const trusted = createPriceCheckModel(parseItemInfo(LARGE_CLUSTER), catalog, { initialSelection: 'auto' })
  const submitted = structuredClone(trusted)
  const passiveCount = submitted.stats.find(({ id }) => id === 'enchant.stat_3086156145')
  const jewelSockets = submitted.stats.find(({ id }) => id === 'enchant.stat_4079888060')
  passiveCount.min = 9
  passiveCount.max = 11
  jewelSockets.enabled = false

  const sanitized = sanitizePriceCheckModel(submitted, catalog, null, null, trusted)
  const filters = buildOfficialTradeQuery(sanitized).query.stats[0].filters
  assert.deepEqual(filters.find(({ id }) => id === passiveCount.id).value, {
    min: 9,
    max: 11,
    option: undefined
  })
  assert.equal(filters.some(({ id }) => id === jewelSockets.id), false)

  const normalJewel = createPriceCheckModel({
    category: '珠宝',
    rarity: '魔法',
    name: '钴蓝珠宝',
    modifiers: [{ type: 'enchant', text: '增加 11 个天赋技能' }]
  }, catalog, { initialSelection: 'auto' })
  assert.equal(normalJewel.identity.type, '钴蓝珠宝')
  assert.equal(normalJewel.stats.find(({ type }) => type === 'enchant').enabled, false)

  const clusterNone = createPriceCheckModel(parseItemInfo(MEDIUM_CLUSTER), catalog, { initialSelection: 'none' })
  assert.ok(clusterNone.stats.filter(({ type }) => type === 'enchant').every(({ enabled }) => !enabled))
  const normalAll = createPriceCheckModel({
    category: '珠宝',
    rarity: '魔法',
    name: '钴蓝珠宝',
    modifiers: [{ type: 'enchant', text: '增加 11 个天赋技能' }]
  }, catalog, { initialSelection: 'all' })
  assert.equal(normalAll.stats.find(({ type }) => type === 'enchant').enabled, true)
})
