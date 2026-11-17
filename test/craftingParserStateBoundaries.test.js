import test from 'node:test'
import assert from 'node:assert/strict'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { matchAffixes, matchMapRequirements } from '../electron/modules/item/matcher.js'
import { LocalizationRuntime } from '../electron/modules/localization/runtime.js'

const item = (body, detailed = true) => `物品类别: 异界地图
稀 有 度: 稀有
灾厄之域
堡垒地图
--------
物品等级: 84
--------
${detailed ? '{ 后缀属性 "丰饶的" (等阶：1) }\n' : ''}${body}`

// Verbatim CN effects in the current signed game resources; these describe other items.
const effects = [
  '地图首领掉落的物品已腐化',
  '身上未装备已腐化的物品时，最大生命提高 20%',
  '未鉴定的地图中找到的物品数量提高 20%'
]

test('制作解析不把词缀句子中的已腐化或未鉴定误认为当前物品状态', () => {
  for (const body of effects) for (const detailed of [true, false]) {
    const parsed = parseItemInfo(item(body, detailed))
    assert.equal(parsed.isCorrupted, false, body)
    assert.equal(parsed.isUnidentified, false, body)
    assert.deepEqual(parsed.explicitMods, [body], body)
    assert.equal(parsed.affixFormatUnsupported, false, body)
    if (detailed) assert.equal(parsed.modifiers[0].tier, 1)
    assert.equal(matchAffixes(parsed, [{ requiredAffixes: [body], selectedAffixes: [] }]).isMatch, true)
    assert.equal(matchMapRequirements(parsed, { match: { blacklist: [body] } }).reason, 'blacklist')
  }
})

test('独立状态行仍更新真实状态，且不能被并入前一条详细词缀', () => {
  const states = [
    ['已腐化', 'isCorrupted'], ['未鉴定', 'isUnidentified'], ['已复制', 'isMirrored'], ['镜像复制', 'isMirrored'],
    ['已分裂', 'isSplit'], ['分裂物品', 'isSplit'], ['不可改变', 'isUnmodifiable']
  ]
  for (const [state, flag] of states) {
    const parsed = parseItemInfo(item(`+90 最大生命\n${state}`))
    assert.equal(parsed[flag], true, state)
    assert.equal(parsed.modifiers[0].text, '+90 最大生命', state)
    assert.deepEqual(parsed.explicitMods, ['+90 最大生命'], state)
  }
})

test('英文独立状态归一后仍被识别，引用 Corrupted 的英文效果不改变状态', () => {
  const english = state => `Item Class: Rings\nRarity: Rare\nDoom Circle\nCoral Ring\n--------\nItem Level: 84\n--------\n{ Prefix Modifier "Corrupted" (Tier: 1) }\n20% increased Maximum Life if no Equipped Items are Corrupted\n${state}`
  const parsed = parseItemInfo(english(''))
  assert.equal(parsed.isCorrupted, false)
  assert.equal(parsed.modifiers[0].name, 'Corrupted')
  assert.equal(parsed.modifiers[0].text, '20% increased Maximum Life if no Equipped Items are Corrupted')
  assert.equal(parseItemInfo(english('Corrupted')).isCorrupted, true)
  assert.equal(parseItemInfo(english('Unidentified')).isUnidentified, true)
  const runtime = new LocalizationRuntime({ serverId: 'international' })
  for (const marker of ['Corrupted', '已腐化', '已汙染', '已污染']) {
    assert.equal(runtime.parseItem(english(marker), '').isCorrupted, true, marker)
  }
  for (const marker of ['Unidentified', '未鉴定', '未鑑定']) {
    assert.equal(runtime.parseItem(english(marker), '').isUnidentified, true, marker)
  }
})

test('原生国服详细头分清词缀位阶与需求等级，名称和标签不能伪造阶级或来源', () => {
  const parse = header => parseItemInfo(item(`{ ${header} }\n+90 最大生命`, false))
  for (const tier of [1, 2]) for (const marker of ['等阶', '位阶', '等階', '位階', '階級', '階層', 'Tier']) {
    const parsed = parse(`前缀属性 "健壮的" （${marker}：${tier}，等级：80）`)
    assert.equal(parsed.modifiers[0].tier, tier, marker)
    const condition = { kind: 'catalog', effectPattern: '+# 最大生命', minTier: 1 }
    assert.equal(matchAffixes(parsed, [{ requiredAffixes: [condition], selectedAffixes: [] }]).isMatch, tier === 1)
  }
  for (const level of ['等级', '等級', 'Lvl']) {
    assert.equal(parse(`前缀属性 "健壮的" （${level}：80）`).modifiers[0].tier, 0, level)
    assert.equal(parse(`大师级 前缀属性 "升级的" （${level}：3）`).modifiers[0].tier, 3, level)
    assert.equal(parse(`大师级 前缀属性 "升级的" （等阶：1，${level}：80）`).modifiers[0].tier, 1, level)
  }
  const poisoned = parse('后缀属性 "Prefix Modifier 等阶: 99" (等阶: 1) — Searing Exarch, 等阶: 88')
  assert.equal(poisoned.modifiers[0].tier, 1)
  assert.equal(poisoned.modifiers[0].affixType, 'suffix')
  assert.equal(poisoned.modifiers[0].sourceSubtype, null)
})
