import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  applyManualBeastcraft, applyManualCurrency, createManualSession, listManualBeastcrafts,
  previewManualCurrency, redoManualAction, resetManualSession, undoManualAction
} from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset } from '../electron/modules/crafting/model.js'

const dataset = normalizeCraftingDataset(JSON.parse(await readFile(path.resolve('electron/assets/crafting-data/dataset.json'), 'utf8')))
const base = dataset.bases.find((entry) => entry.itemClass === 'Helmet' && entry.requiredLevel <= 20 && entry.allowedVariants.includes('normal'))

function session(seed = 1, variant = { kind: 'normal' }, itemLevel = 100) {
  return createManualSession(dataset, { baseId: base.id, itemLevel: Math.max(base.requiredLevel, itemLevel), variant, seed })
}

function rareSession(seed = 1) {
  return applyManualCurrency(dataset, session(seed), 'currency:alchemy').session
}

function affixes(state) { return [...state.prefixes, ...state.suffixes] }
function recipe(current, id, beastLevel = 83) { return listManualBeastcrafts(dataset, current, { beastLevel }).items.find((entry) => entry.id === id) }

test('野兽目录按当前状态计算 27 条配方的可执行性', () => {
  const catalog = listManualBeastcrafts(dataset, session(10))
  assert.equal(catalog.total, 27)
  assert.equal(catalog.ruleset.patch, '3.29')
  assert.equal(catalog.items.filter((entry) => !entry.supported).length, 5)
  assert.equal(catalog.items.some((entry) => ['split-two', 'split-three'].includes(entry.id)), false)
  assert.match(recipe(session(10), 'fracture-talisman-one').unavailableReason, /3\.29.*魔符/)
  assert.match(recipe(session(10), 'add-prefix-remove-suffix').unavailableReason, /稀有/)
  assert.match(recipe(session(10), 'add-shaper-mod').unavailableReason, /塑界者/)
})

test('加前删后使用兽级词缀池，后缀锁存在时只添加不删除', () => {
  const current = rareSession(20)
  current.state.prefixes = []
  current.state.suffixes = current.state.suffixes.slice(0, 1)
  current.state.meta.suffixesLocked = true
  const suffixBefore = structuredClone(current.state.suffixes)
  const result = applyManualBeastcraft(dataset, current, 'add-prefix-remove-suffix', { beastLevel: 100 })
  assert.equal(result.event.poolItemLevel, 100)
  assert.deepEqual(result.session.state.suffixes, suffixBefore)
  assert.equal(result.session.state.prefixes.length, 1)
  assert.equal(result.event.removedModifier, null)
})

test('无法骰出攻击限制新增池但不会保护已有攻击词缀免于删除', () => {
  const current = rareSession(25)
  const sample = affixes(current.state)[0]
  current.state.prefixes = []
  current.state.suffixes = [
    { ...structuredClone(sample), modifierId: 'test-attack', goalId: 'test-attack', tierId: 'test-attack-tier', groupId: 'test-attack-group', affixType: 'suffix', displayTags: [{ id: 'attack', label: '攻击' }] },
    { ...structuredClone(sample), modifierId: 'bench-meta:cannot-roll-attack', goalId: 'bench-meta:cannot-roll-attack', tierId: 'bench:cannot-roll-attack', groupId: 'bench-meta:cannot-roll-attack', affixType: 'suffix', source: 'crafted', metaCraft: true }
  ]
  current.state.meta.cannotRollAttack = true
  let result
  for (let rngState = 1; rngState < 100; rngState += 1) {
    current.rngState = rngState
    const candidate = applyManualBeastcraft(dataset, current, 'add-prefix-remove-suffix', { beastLevel: 100 })
    if (candidate.event.removedModifier?.modifierId === 'test-attack') { result = candidate; break }
  }
  assert.ok(result, '已有攻击词缀应进入随机删除池')
  const addedDefinition = dataset.modifiers.find((entry) => entry.id === result.event.addedModifier.modifierId)
  assert.equal(addedDefinition.tags.includes('attack') || addedDefinition.tags.includes('攻击'), false)
})

test('六势力配方只添加对应势力词缀', () => {
  const influencedBase = dataset.bases.find((entry) => entry.itemClass === 'Helmet' && entry.allowedVariants.includes('influenced'))
  const current = createManualSession(dataset, { baseId: influencedBase.id, itemLevel: 100, variant: { kind: 'influenced', influences: ['shaper'] }, seed: 30 })
  const result = applyManualBeastcraft(dataset, current, 'add-shaper-mod')
  assert.equal(affixes(result.session.state).length, 1)
  assert.equal(result.session.state.rarity, 'magic')
  assert.equal(affixes(result.session.state)[0].source, 'shaper')
  assert.match(recipe(result.session, 'add-elder-mod').unavailableReason, /裂界者/)
})

test('随机元工艺和八种势技能使用正常词缀位规则', () => {
  const meta = applyManualBeastcraft(dataset, session(40), 'add-random-meta')
  assert.equal(affixes(meta.session.state).length, 1)
  assert.equal(affixes(meta.session.state)[0].metaCraft, true)
  assert.ok(['prefixesLocked', 'suffixesLocked', 'cannotRollAttack', 'cannotRollCaster', 'multimod'].some((flag) => meta.session.state.meta[flag]))

  const aspect = applyManualBeastcraft(dataset, session(41), 'aspect-spider-30')
  assert.equal(aspect.session.state.rarity, 'magic')
  assert.equal(aspect.session.state.suffixes[0].source, 'beast')
  assert.equal(aspect.session.state.suffixes[0].rolledText, '获得 30 级的主动技能蛛之势')
  assert.match(recipe(aspect.session, 'aspect-cat-20').unavailableReason, /已经拥有势技能/)
})

test('3.29 旧二分三分不可调用且魔符破裂保持安全禁用', () => {
  const current = rareSession(50)
  assert.throws(() => applyManualBeastcraft(dataset, current, 'split-two'), /未知野兽工艺/)
  assert.throws(() => applyManualBeastcraft(dataset, current, 'split-three'), /未知野兽工艺/)
  assert.throws(() => applyManualBeastcraft(dataset, current, 'fracture-talisman-one'), /3\.29.*魔符/)
})

test('拓印绑定原物品并可一次性恢复魔法状态', () => {
  const magic = applyManualCurrency(dataset, session(70), 'currency:transmutation').session
  const imprinted = applyManualBeastcraft(dataset, magic, 'create-imprint').session
  const snapshot = structuredClone(imprinted.state)
  const changed = applyManualCurrency(dataset, imprinted, 'currency:alteration').session
  const restored = applyManualBeastcraft(dataset, changed, 'restore-imprint')
  assert.deepEqual(restored.session.state, snapshot)
  assert.equal(restored.session.imprint, null)
  assert.match(recipe(restored.session, 'restore-imprint').unavailableReason, /没有可用拓印/)
})

test('希内科拉预览不改状态且实际通货结果完全一致', () => {
  const magic = applyManualCurrency(dataset, session(80), 'currency:transmutation').session
  const locked = applyManualBeastcraft(dataset, magic, 'apply-hinekora-lock').session
  const before = structuredClone(locked)
  const preview = previewManualCurrency(dataset, locked, 'currency:alteration')
  assert.deepEqual(locked, before)
  const repeated = previewManualCurrency(dataset, locked, 'currency:alteration')
  assert.deepEqual(repeated, preview)
  const applied = applyManualCurrency(dataset, locked, 'currency:alteration')
  assert.deepEqual(applied.session.state, preview.state)
  assert.equal(applied.session.foreseeing, false)
})

test('非通货野兽动作会消费预见且撤销可恢复预见状态', () => {
  const magic = applyManualCurrency(dataset, session(85), 'currency:transmutation').session
  magic.state.suffixes = []
  magic.state.rarity = 'magic'
  const locked = applyManualBeastcraft(dataset, magic, 'apply-hinekora-lock').session
  const changed = applyManualBeastcraft(dataset, locked, 'aspect-cat-20')
  assert.equal(changed.session.foreseeing, false)
  assert.equal(changed.event.foreseeingConsumed, true)
  const undone = undoManualAction(dataset, changed.session)
  assert.equal(undone.session.foreseeing, true)
})

test('拓印与预见辅助状态参与撤销重做和重置', () => {
  let current = applyManualCurrency(dataset, session(90), 'currency:transmutation').session
  current = applyManualBeastcraft(dataset, current, 'apply-hinekora-lock').session
  const changed = applyManualCurrency(dataset, current, 'currency:alteration')
  const undone = undoManualAction(dataset, changed.session)
  assert.equal(undone.session.foreseeing, true)
  const redone = redoManualAction(dataset, undone.session)
  assert.equal(redone.session.foreseeing, false)
  const reset = resetManualSession(dataset, redone.session)
  assert.equal(reset.session.pendingSplitResults.length, 0)
  assert.equal(reset.session.imprint, null)
  assert.equal(reset.session.foreseeing, false)
})
