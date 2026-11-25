import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { VAAL_OUTCOMES as _m0_VAAL_OUTCOMES, corruptedImplicitCandidates as _m0_corruptedImplicitCandidates, replaceImplicitWithVaal as _m0_replaceImplicitWithVaal, rollCorruptedImplicit as _m0_rollCorruptedImplicit, rollVaalOutcome as _m0_rollVaalOutcome, whitenSockets as _m0_whitenSockets } from '../electron/modules/crafting/vaalRules.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { readFile as _m1_readFile } from 'node:fs/promises'
import _m1_path from 'node:path'
import { rolledAffix as _m1_rolledAffix } from '../electron/modules/crafting/actionProviders.js'
import { applyManualCurrency as _m1_applyManualCurrency, applyManualVeiledCraft as _m1_applyManualVeiledCraft, createManualSession as _m1_createManualSession, createSeededRng as _m1_createSeededRng, listManualVeiledCrafts as _m1_listManualVeiledCrafts, redoManualAction as _m1_redoManualAction, selectManualVeiledOption as _m1_selectManualVeiledOption, undoManualAction as _m1_undoManualAction } from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftState as _m1_normalizeCraftState, normalizeCraftingDataset as _m1_normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { modifierMatchesBase as _m1_modifierMatchesBase } from '../electron/modules/crafting/variantRules.js'

// === Merged from vaalRules.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const VAAL_OUTCOMES = _m0_VAAL_OUTCOMES
  const corruptedImplicitCandidates = _m0_corruptedImplicitCandidates
  const replaceImplicitWithVaal = _m0_replaceImplicitWithVaal
  const rollCorruptedImplicit = _m0_rollCorruptedImplicit
  const rollVaalOutcome = _m0_rollVaalOutcome
  const whitenSockets = _m0_whitenSockets
test('四种瓦尔主结果使用等宽区间', () => {
  assert.deepEqual(VAAL_OUTCOMES.map((_, index) => rollVaalOutcome(() => (index + 0.1) / 4)), VAAL_OUTCOMES)
})

test('腐化隐式按类别、等级和权重过滤并掷值', () => {
  const dataset = { corruptedImplicitFamilies: [{
    id: 'family:life', name: '生命', itemClasses: ['Ring'], displayTags: [{ id: 'life', label: '生命' }],
    tiers: [
      { id: 'tier:high', tier: 1, requiredLevel: 80, text: '+(20—30) 最大生命', values: [{ min: 20, max: 30 }], weights: { Ring: 500 } },
      { id: 'tier:low', tier: 2, requiredLevel: 1, text: '+(10—15) 最大生命', values: [{ min: 10, max: 15 }], weights: { Ring: 1000 } }
    ]
  }] }
  assert.equal(corruptedImplicitCandidates(dataset, { itemClass: 'Ring' }, 79).length, 1)
  assert.equal(corruptedImplicitCandidates(dataset, { itemClass: 'Wand' }, 100).length, 0)
  const rolled = rollCorruptedImplicit(dataset, { itemClass: 'Ring' }, 79, () => 0.5)
  assert.equal(rolled.tierId, 'tier:low')
  assert.ok(rolled.rolledValues[0] >= 10 && rolled.rolledValues[0] <= 15)
})

test('腐化隐式只替换一个既有隐式槽', () => {
  const state = {
    baseImplicits: [{ id: 'base:a', rolledText: '基础 A' }],
    implicits: ['synth:a'],
    eldritchImplicits: { exarch: { tierId: 'exarch:a', rolledText: '焚界 A' }, eater: null },
    vaalImplicit: null
  }
  const replaced = replaceImplicitWithVaal(state, { familyId: 'vaal:a' }, () => 0)
  assert.deepEqual(replaced, { source: 'base', id: 'base:a', text: '基础 A' })
  assert.equal(state.baseImplicits.length, 0)
  assert.equal(state.eldritchImplicits.exarch.tierId, 'exarch:a')
  assert.equal(state.vaalImplicit.familyId, 'vaal:a')
  const synthesized = { baseImplicits: [], implicits: ['synth:a'], eldritchImplicits: { exarch: null, eater: null }, vaalImplicit: null }
  assert.equal(replaceImplicitWithVaal(synthesized, { familyId: 'vaal:b' }, () => 0).source, 'synthesized')
  assert.deepEqual(synthesized.implicits, [])
  const gilded = { baseImplicits: [], implicits: ['物品会被商贩高价购买'], eldritchImplicits: { exarch: null, eater: null }, vaalImplicit: null }
  assert.equal(replaceImplicitWithVaal(gilded, { familyId: 'vaal:c' }, () => 0).source, 'gilded')
  assert.deepEqual(gilded.implicits, [])
})

test('白孔保证一个非白孔并对其余插槽逐个判定', () => {
  const state = { sockets: ['R', 'G', 'B'].map((color, index) => ({ id: `socket:${index + 1}`, color })) }
  const rolls = [0.5, 0.05, 0.5]
  const changed = whitenSockets(state, () => rolls.shift())
  assert.deepEqual(changed, [1, 0])
  assert.deepEqual(state.sockets.map((socket) => socket.color), ['W', 'W', 'B'])
  assert.deepEqual(whitenSockets({ sockets: [] }, () => 0), [])
})
})()

// === Merged from veiledCrafting.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const readFile = _m1_readFile
  const path = _m1_path
  const rolledAffix = _m1_rolledAffix
  const applyManualCurrency = _m1_applyManualCurrency
  const applyManualVeiledCraft = _m1_applyManualVeiledCraft
  const createManualSession = _m1_createManualSession
  const createSeededRng = _m1_createSeededRng
  const listManualVeiledCrafts = _m1_listManualVeiledCrafts
  const redoManualAction = _m1_redoManualAction
  const selectManualVeiledOption = _m1_selectManualVeiledOption
  const undoManualAction = _m1_undoManualAction
  const normalizeCraftState = _m1_normalizeCraftState
  const normalizeCraftingDataset = _m1_normalizeCraftingDataset
  const modifierMatchesBase = _m1_modifierMatchesBase
const dataset = normalizeCraftingDataset(JSON.parse(await readFile(path.resolve('electron/assets/crafting-data/dataset.json'), 'utf8')))
const base = dataset.bases.find((entry) => entry.itemClass === 'Wand' && entry.allowedVariants.includes('normal'))

function rareSession(seed = 20260722) {
  const session = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed })
  return applyManualCurrency(dataset, session, 'currency:alchemy').session
}

function affixes(state) {
  return [...state.prefixes, ...state.suffixes]
}

test('真实快照提供完整普通加密池并区分前后缀', () => {
  const modifiers = dataset.modifiers.filter((modifier) => modifier.source === 'veiled')
  const prefixes = modifiers.filter((modifier) => modifier.affixType === 'prefix')
  const suffixes = modifiers.filter((modifier) => modifier.affixType === 'suffix')
  assert.ok(modifiers.length >= 1000)
  assert.ok(prefixes.length >= 400)
  assert.ok(suffixes.length >= 600)
  assert.equal(prefixes.length + suffixes.length, modifiers.length)
  assert.ok(new Set(modifiers.map((modifier) => modifier.name)).size >= 100)
  assert.ok(modifiers.every((modifier) => modifier.tiers.every((tier) => tier.weight > 0)))
})

test('旧词缀状态默认不是未揭露，占位词缀则持久化 veiled 标记', () => {
  const old = normalizeCraftState({ rarity: 'rare', prefixes: [{ modifierId: 'a', tierId: 'b', groupId: 'c', name: '旧词缀', tierName: 'T1', text: '旧效果' }] })
  assert.equal(old.prefixes[0].veiled, false)
  const result = applyManualVeiledCraft(dataset, rareSession(11), 'veiled:chaos')
  const pending = affixes(result.session.state).find((affix) => affix.veiled)
  assert.ok(pending)
  assert.equal(pending.source, 'veiled-pending')
  assert.match(pending.name, /未揭露的加密/)
  assert.equal(pending.rolledText, '尚未揭露')
})

test('加密崇高石确定性移除词缀并添加一个真实占位', () => {
  const session = rareSession(22)
  const beforeCount = affixes(session.state).length
  const first = applyManualVeiledCraft(dataset, session, 'veiled:exalted')
  const repeated = applyManualVeiledCraft(dataset, session, 'veiled:exalted')
  assert.deepEqual(first.session.state, repeated.session.state)
  assert.equal(affixes(first.session.state).length, beforeCount)
  assert.ok(first.event.removedModifier)
  assert.equal(affixes(first.session.state).filter((affix) => affix.veiled).length, 1)
  assert.equal(first.veiled.options.length, 3)
})

test('加密崇高石尊重位置锁，但攻击生成限制不保护移除', () => {
  const session = rareSession(33)
  session.state.meta.prefixesLocked = true
  const lockedIds = session.state.prefixes.map((affix) => affix.modifierId)
  const result = applyManualVeiledCraft(dataset, session, 'veiled:exalted')
  assert.ok(lockedIds.every((id) => result.session.state.prefixes.some((affix) => affix.modifierId === id)))

  const attackModifier = dataset.modifiers.find((modifier) => modifier.source === 'natural'
    && modifier.tags.includes('attack') && modifierMatchesBase(modifier, base, { kind: 'normal' })
    && modifier.tiers.some((tier) => tier.weight > 0 && tier.requiredLevel <= 100))
  const attackOnly = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 34 })
  attackOnly.state.rarity = 'rare'
  attackOnly.state.meta.cannotRollAttack = true
  const tier = attackModifier.tiers.find((entry) => entry.weight > 0 && entry.requiredLevel <= 100)
  attackOnly.state[attackModifier.affixType === 'prefix' ? 'prefixes' : 'suffixes'].push(rolledAffix(attackModifier, tier, createSeededRng(1)))
  const removed = applyManualVeiledCraft(dataset, attackOnly, 'veiled:exalted')
  assert.equal(removed.event.removedModifier.modifierId, attackModifier.id)
})

test('加密通货拒绝腐化、非稀有、已有加密及无可移除状态', () => {
  const normal = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 44 })
  let catalog = listManualVeiledCrafts(dataset, normal)
  assert.match(catalog.items[0].unavailableReason, /稀有/)
  normal.state.rarity = 'rare'
  assert.match(listManualVeiledCrafts(dataset, normal).items[0].unavailableReason, /可移除/)
  normal.state.corrupted = true
  assert.ok(listManualVeiledCrafts(dataset, normal).items.every((item) => /腐化/.test(item.unavailableReason)))

  const pending = applyManualVeiledCraft(dataset, rareSession(45), 'veiled:chaos').session
  catalog = listManualVeiledCrafts(dataset, pending)
  assert.match(catalog.items.find((item) => item.kind === 'exalted').unavailableReason, /已有加密|未揭露/)
})

test('加密混沌石保留锁定侧，并让普通新词缀遵守操作开始时的攻击限制', () => {
  const session = rareSession(55)
  const protectedPrefixes = structuredClone(session.state.prefixes)
  session.state.meta.prefixesLocked = true
  session.state.meta.cannotRollAttack = true
  const result = applyManualVeiledCraft(dataset, session, 'veiled:chaos')
  assert.ok(protectedPrefixes.every((before) => result.session.state.prefixes.some((after) => after.modifierId === before.modifierId && after.tierId === before.tierId)))
  const ordinary = affixes(result.session.state).filter((affix) => !affix.veiled && !protectedPrefixes.some((entry) => entry.modifierId === affix.modifierId && entry.tierId === affix.tierId))
  assert.ok(ordinary.every((affix) => !dataset.modifiers.find((modifier) => modifier.id === affix.modifierId)?.tags.includes('attack')))
  assert.equal(affixes(result.session.state).filter((affix) => affix.veiled).length, 1)
})

test('揭露候选重复查询稳定、三项不同且忽略攻击生成限制', () => {
  const result = applyManualVeiledCraft(dataset, rareSession(66), 'veiled:chaos')
  result.session.state.meta.cannotRollAttack = true
  const first = listManualVeiledCrafts(dataset, result.session)
  const repeated = listManualVeiledCrafts(dataset, result.session)
  assert.deepEqual(first.options, repeated.options)
  assert.equal(first.options.length, 3)
  assert.equal(new Set(first.options.map((entry) => entry.modifierId)).size, 3)
  assert.equal(first.canUnveil, true)
  assert.ok(first.options.every((entry) => entry.tierName && entry.text && entry.requiredLevel > 0 && entry.weight > 0))
})

test('现有 ModGroup 会阻断揭露候选，伪造或过期选择被拒绝', () => {
  const result = applyManualVeiledCraft(dataset, rareSession(77), 'veiled:chaos')
  const blocked = result.veiled.options[0]
  const blocker = {
    goalId: 'crafted:blocker', modifierId: 'crafted:blocker', tierId: 'crafted:blocker',
    groupId: blocked.groupId, source: 'crafted', affixType: blocked.affixType === 'prefix' ? 'suffix' : 'prefix',
    name: '阻断工艺', tierName: '工艺', text: '阻断', rolledText: '阻断'
  }
  const key = blocker.affixType === 'prefix' ? 'prefixes' : 'suffixes'
  result.session.state[key].push(blocker)
  const afterBlock = listManualVeiledCrafts(dataset, result.session)
  assert.equal(afterBlock.options.some((entry) => entry.groupId === blocked.groupId), false)
  assert.throws(() => selectManualVeiledOption(dataset, result.session, blocked.modifierId, blocked.tierId), /不在当前三个/)
  assert.throws(() => selectManualVeiledOption(dataset, result.session, 'fake', 'fake'), /不在当前三个/)
})

test('选择揭露替换占位且撤销重做恢复完全相同结果', () => {
  const pending = applyManualVeiledCraft(dataset, rareSession(88), 'veiled:exalted')
  const option = pending.veiled.options[1]
  const result = selectManualVeiledOption(dataset, pending.session, option.modifierId, option.tierId)
  const revealed = result.event.selectedModifier
  assert.equal(affixes(result.session.state).some((affix) => affix.veiled), false)
  assert.equal(revealed.source, 'veiled')
  assert.equal(revealed.modifierId, option.modifierId)
  assert.equal(result.event.unveilOptions.length, 3)

  const undone = undoManualAction(dataset, result.session)
  assert.equal(affixes(undone.session.state).filter((affix) => affix.veiled).length, 1)
  const redone = redoManualAction(dataset, undone.session)
  assert.deepEqual(redone.session.state, result.session.state)
  assert.deepEqual(redone.session.rngState, result.session.rngState)
})
})()
