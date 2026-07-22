import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { rolledAffix } from '../electron/modules/crafting/actionProviders.js'
import { eligibleModifierTiers } from '../electron/modules/crafting/craftState.js'
import { HARVEST_TAGS } from '../electron/modules/crafting/harvestRules.js'
import { applyManualCurrency, applyManualHarvestCraft, createManualSession, listManualHarvestCrafts } from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset } from '../electron/modules/crafting/model.js'

const dataset = normalizeCraftingDataset(JSON.parse(await readFile('electron/assets/crafting-data/dataset.json', 'utf8')))
const harvestCrafts = dataset.crafts.filter((craft) => craft.provider === 'harvest')

function naturalPool(base, variant = { kind: 'normal', influences: [], fracturedTierId: null, implicits: [] }) {
  return eligibleModifierTiers(dataset, base, 100, variant, { rarity: 'rare', prefixes: [], suffixes: [], influences: variant.influences, meta: {} }, { sources: ['natural'] })
}

test('内置快照保存当前 76 条花园配方、全部消耗与十六标签覆盖', () => {
  assert.equal(harvestCrafts.length, 76)
  assert.equal(harvestCrafts.filter((craft) => craft.effectKind === 'reforge_tag').length, 16)
  assert.equal(harvestCrafts.filter((craft) => craft.effectKind === 'convert_resistance' || craft.effectKind === 'convert_damage').length, 12)
  assert.equal(harvestCrafts.filter((craft) => craft.effectKind === 'remove_add_tag').length, 11)
  assert.equal(harvestCrafts.filter((craft) => craft.effectKind === 'quality_enchant').length, 14)
  assert.equal(harvestCrafts.some((craft) => !craft.cost.length), false)

  const coverage = new Map(HARVEST_TAGS.map(({ id }) => [id, 0]))
  for (const base of dataset.bases) {
    const tags = new Set(naturalPool(base).flatMap((entry) => entry.modifier.tags))
    for (const { id } of HARVEST_TAGS) if (tags.has(id)) coverage.set(id, coverage.get(id) + 1)
  }
  for (const [tag, count] of coverage) assert.ok(count > 0, `${tag} 标签在全部底材中没有候选`)

  const dropCraft = harvestCrafts.find((craft) => craft.name.includes('掉落'))
  assert.equal(dropCraft.params.tag, 'drop')
  assert.deepEqual(dropCraft.cost.map(({ resourceName, amount }) => [resourceName, amount]), [['活性黄晶命能', 200], ['憎恨结晶', 1]])
})

test('3.28 憎恨结晶的十一项装备工艺与有向参数完整且不重复', () => {
  const rancourCrafts = harvestCrafts.filter((craft) => craft.cost.some((cost) => cost.resourceName === '憎恨结晶'))
  const equipmentCrafts = rancourCrafts.filter((craft) => ['reforge_tag', 'convert_damage'].includes(craft.effectKind))
  assert.equal(rancourCrafts.length, 12)
  assert.equal(equipmentCrafts.length, 11)
  assert.equal(new Set(rancourCrafts.map((craft) => craft.id)).size, 12)
  assert.deepEqual(
    equipmentCrafts.filter((craft) => craft.effectKind === 'reforge_tag').map((craft) => craft.params.tag).sort(),
    ['attribute', 'drop', 'elemental', 'mana', 'minion']
  )
  assert.deepEqual(
    equipmentCrafts.filter((craft) => craft.effectKind === 'convert_damage').map((craft) => `${craft.params.fromTag}->${craft.params.toTag}`).sort(),
    ['cold->fire', 'cold->lightning', 'fire->cold', 'fire->lightning', 'lightning->cold', 'lightning->fire']
  )
  assert.ok(equipmentCrafts.every((craft) => craft.cost.length === 2 && craft.cost.some((cost) => cost.resourceId === 'resource:harvest:crystallised-rancour')))
  assert.equal(rancourCrafts.filter((craft) => craft.effectKind === 'gem_transform').length, 1)
})

test('掉落标签重铸保证掉落词缀而非普通属性词缀', () => {
  const base = dataset.bases.find((entry) => naturalPool(entry).some(({ modifier }) => modifier.tags.includes('drop')))
  assert.ok(base, '当前快照应至少有一种支持掉落标签的底材')
  const session = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 328 })
  session.state.rarity = 'rare'
  const craft = listManualHarvestCrafts(dataset, session).items.find((entry) => entry.effectKind === 'reforge_tag' && entry.params.tag === 'drop')
  assert.equal(craft.canApply, true)
  const result = applyManualHarvestCraft(dataset, session, craft.id)
  assert.ok([...result.session.state.prefixes, ...result.session.state.suffixes].some((affix) => dataset.modifiers.find((modifier) => modifier.id === affix.modifierId)?.tags.includes('drop')))
  assert.equal(result.event.guaranteedTag, 'drop')
})

test('3.28 元素伤害转换替换同侧近似词缀并支持撤销重做', async () => {
  const base = dataset.bases.find((entry) => entry.id === 'base:32db338832c23209')
  const source = naturalPool(base).find(({ modifier, tier }) => modifier.id === 'goal:657eb7d67e3773cb' && tier.id === 'tier:4e6430cba06b6b6c')
  assert.ok(base && source, '快照中的拳钉应保留火焰点伤转换哨兵')
  const session = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 328 })
  session.state.rarity = 'rare'
  const original = rolledAffix(source.modifier, source.tier, () => 0.5)
  session.state.prefixes.push(original)
  const craft = listManualHarvestCrafts(dataset, session).items.find((entry) => entry.effectKind === 'convert_damage' && entry.params.fromTag === 'fire' && entry.params.toTag === 'cold')
  assert.equal(craft.canApply, true)
  const converted = applyManualHarvestCraft(dataset, session, craft.id)
  assert.equal(converted.event.convertedFrom.modifierId, original.modifierId)
  assert.equal(converted.event.convertedTo.affixType, original.affixType)
  assert.ok(dataset.modifiers.find((modifier) => modifier.id === converted.event.convertedTo.modifierId)?.tags.includes('cold'))
  const { undoManualAction, redoManualAction } = await import('../electron/modules/crafting/manualCrafting.js')
  const undone = undoManualAction(dataset, converted.session)
  assert.deepEqual(undone.session.state, session.state)
  assert.deepEqual(redoManualAction(dataset, undone.session).session.state, converted.session.state)
})

test('真实快照完成保证标签、同类倾向和品质附魔流程', () => {
  const ring = dataset.bases.find((base) => base.itemClass === 'Ring' && naturalPool(base).some((entry) => entry.modifier.tags.includes('life')))
  let session = createManualSession(dataset, { baseId: ring.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 20260722 })
  session = applyManualCurrency(dataset, session, 'currency:alchemy').session
  const lifeCraft = harvestCrafts.find((craft) => craft.effectKind === 'reforge_tag' && craft.params.tag === 'life')
  session = applyManualHarvestCraft(dataset, session, lifeCraft.id).session
  assert.ok([...session.state.prefixes, ...session.state.suffixes].some((affix) => dataset.modifiers.find((modifier) => modifier.id === affix.modifierId)?.tags.includes('life')))
  const tendency = harvestCrafts.find((craft) => craft.effectKind === 'reforge_more_likely')
  const tended = applyManualHarvestCraft(dataset, session, tendency.id)
  assert.equal(tended.event.weightMultiplier, 10)

  const wand = dataset.bases.find((base) => base.itemClass === 'Wand' && naturalPool(base).length)
  const wandSession = createManualSession(dataset, { baseId: wand.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 42 })
  const enchant = listManualHarvestCrafts(dataset, wandSession).items.find((craft) => craft.effectKind === 'quality_enchant' && craft.canApply)
  const enchanted = applyManualHarvestCraft(dataset, wandSession, enchant.id)
  assert.equal(enchanted.session.state.qualityEffect, enchant.params.qualityEffect)
  assert.equal(enchanted.session.state.enchanted, true)
})

test('真实快照完成元素转换、移除添加及两种势力流程', () => {
  const base = dataset.bases.find((entry) => entry.itemClass === 'Ring' && naturalPool(entry).length)
  const pool = naturalPool(base)
  let conversionCase = null
  for (const candidate of pool) {
    const session = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 77 })
    session.state.rarity = 'rare'
    const affix = rolledAffix(candidate.modifier, candidate.tier, () => 0.5)
    session.state[affix.affixType === 'prefix' ? 'prefixes' : 'suffixes'].push(affix)
    const craft = listManualHarvestCrafts(dataset, session).items.find((entry) => ['convert_resistance', 'convert_damage'].includes(entry.effectKind) && entry.canApply)
    if (craft) { conversionCase = { session, craft }; break }
  }
  assert.ok(conversionCase, '真实戒指词缀池应存在可转换元素词缀')
  const converted = applyManualHarvestCraft(dataset, conversionCase.session, conversionCase.craft.id)
  assert.ok(converted.event.convertedFrom && converted.event.convertedTo)

  const augmentCraft = listManualHarvestCrafts(dataset, converted.session).items.find((craft) => craft.effectKind === 'remove_add_tag' && craft.canApply)
  assert.ok(augmentCraft, '转换后的真实装备应存在可执行的移除并添加工艺')
  const augmented = applyManualHarvestCraft(dataset, converted.session, augmentCraft.id)
  assert.ok(augmented.event.removedModifier && augmented.event.addedModifier)

  const shaperVariant = { kind: 'influenced', influences: ['shaper'], fracturedTierId: null, implicits: [] }
  const influencedBase = dataset.bases.find((entry) => entry.allowedVariants.includes('influenced') && eligibleModifierTiers(dataset, entry, 100, shaperVariant, { rarity: 'rare', prefixes: [], suffixes: [], influences: ['shaper'], meta: {} }, { sources: ['natural', 'shaper'] }).some((candidate) => candidate.modifier.influences.includes('shaper')))
  let influenced = createManualSession(dataset, { baseId: influencedBase.id, itemLevel: 100, variant: { kind: 'influenced', influences: ['shaper'] }, seed: 99 })
  influenced.state.rarity = 'rare'
  const influenceCraft = listManualHarvestCrafts(dataset, influenced).items.find((craft) => craft.effectKind === 'reforge_influence')
  assert.equal(influenceCraft.canApply, true)
  influenced = applyManualHarvestCraft(dataset, influenced, influenceCraft.id).session
  const randomize = listManualHarvestCrafts(dataset, influenced).items.find((craft) => craft.effectKind === 'randomize_influence')
  const randomized = applyManualHarvestCraft(dataset, influenced, randomize.id)
  assert.notDeepEqual(randomized.session.state.influences, ['shaper'])
  assert.deepEqual(randomized.session.variant.influences, randomized.session.state.influences)
})
