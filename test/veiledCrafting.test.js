import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { rolledAffix } from '../electron/modules/crafting/actionProviders.js'
import {
  applyManualCurrency, applyManualVeiledCraft, createManualSession, createSeededRng,
  listManualVeiledCrafts, redoManualAction, selectManualVeiledOption, undoManualAction
} from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftState, normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { modifierMatchesBase } from '../electron/modules/crafting/variantRules.js'

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
  assert.equal(modifiers.length, 1274)
  assert.equal(modifiers.filter((modifier) => modifier.affixType === 'prefix').length, 503)
  assert.equal(modifiers.filter((modifier) => modifier.affixType === 'suffix').length, 771)
  assert.equal(new Set(modifiers.map((modifier) => modifier.name)).size, 109)
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
