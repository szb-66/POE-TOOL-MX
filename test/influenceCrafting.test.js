import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { rolledAffix } from '../electron/modules/crafting/actionProviders.js'
import {
  applyManualInfluenceCraft, configureManualAwakenerDonor, createManualSession, createSeededRng,
  listManualAwakenerDonorCandidates, listManualInfluenceCrafts, redoManualAction, resetManualSession, undoManualAction
} from '../electron/modules/crafting/manualCrafting.js'
import { dominanceCandidates } from '../electron/modules/crafting/influenceRules.js'
import { normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { modifierMatchesBase } from '../electron/modules/crafting/variantRules.js'

const dataset = normalizeCraftingDataset(JSON.parse(await readFile(path.resolve('electron/assets/crafting-data/dataset.json'), 'utf8')))
const influences = ['shaper', 'elder', 'crusader', 'redeemer', 'hunter', 'warlord']
const helmet = dataset.bases.find((entry) => entry.itemClass === 'Helmet' && entry.allowedVariants.includes('normal'))

function matchingModifiers(influence) {
  const variant = { kind: 'influenced', influences: [influence] }
  return dataset.modifiers.filter((modifier) => modifier.influences.includes(influence) && modifierMatchesBase(modifier, helmet, variant))
}

function influencedSession(influence, seed = 1) {
  const session = createManualSession(dataset, { baseId: helmet.id, itemLevel: 100, variant: { kind: 'influenced', influences: [influence] }, seed })
  session.state.rarity = 'rare'
  return session
}

function addAffix(session, modifier, tier, seed = 10) {
  const affix = rolledAffix(modifier, tier, createSeededRng(seed), { source: modifier.influences[0] })
  session.state[modifier.affixType === 'prefix' ? 'prefixes' : 'suffixes'].push(affix)
  return affix
}

test('真实快照六势力内部标签均能匹配并执行势力崇高石', () => {
  for (const influence of influences) {
    const session = createManualSession(dataset, { baseId: helmet.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 20260722 })
    session.state.rarity = 'rare'
    const entry = listManualInfluenceCrafts(dataset, session).items.find((item) => item.influence === influence)
    assert.equal(entry.canApply, true, `${influence}: ${entry.unavailableReason}`)
    assert.ok(entry.candidateCount > 0, `${influence} 候选池为空`)
    const first = applyManualInfluenceCraft(dataset, session, entry.id)
    const repeated = applyManualInfluenceCraft(dataset, session, entry.id)
    assert.deepEqual(first.session.state, repeated.session.state)
    assert.deepEqual(first.session.state.influences, [influence])
    const added = [...first.session.state.prefixes, ...first.session.state.suffixes].find((affix) => affix.modifierId === first.event.addedInfluenceModifier.modifierId)
    assert.ok(dataset.modifiers.find((modifier) => modifier.id === added.modifierId).influences.includes(influence))
  }
})

test('势力崇高石拒绝非法状态并让元属性过滤候选', () => {
  const normal = createManualSession(dataset, { baseId: helmet.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 8 })
  assert.match(listManualInfluenceCrafts(dataset, normal).items[0].unavailableReason, /稀有/)
  normal.state.rarity = 'rare'
  normal.state.corrupted = true
  assert.match(listManualInfluenceCrafts(dataset, normal).items[0].unavailableReason, /腐化/)
  normal.state.corrupted = false
  normal.state.meta.cannotRollAttack = true
  const result = applyManualInfluenceCraft(dataset, normal, 'influence:shaper-exalted')
  const modifier = dataset.modifiers.find((entry) => entry.id === result.event.addedInfluenceModifier.modifierId)
  assert.equal(modifier.tags.includes('attack'), false)
})

test('统御宝珠移除一条势力词缀并升为尊崇 T1', () => {
  const session = influencedSession('shaper', 301)
  const candidates = matchingModifiers('shaper').filter((modifier) => modifier.tiers.some((tier) => tier.tier === 1 && tier.weight === 0) && modifier.tiers.some((tier) => tier.tier === 2 && tier.weight > 0))
  const first = candidates[0]
  const second = candidates.find((entry) => entry.groupId !== first.groupId)
  addAffix(session, first, first.tiers.find((tier) => tier.tier === 2), 1)
  addAffix(session, second, second.tiers.find((tier) => tier.tier === 2), 2)
  assert.equal(dominanceCandidates(dataset, session).length, 2)
  const result = applyManualInfluenceCraft(dataset, session, 'influence:orb-of-dominance')
  assert.equal([...result.session.state.prefixes, ...result.session.state.suffixes].length, 1)
  assert.equal(result.event.upgradedTo.weight, 0)
  assert.match(result.event.upgradedTo.tierName, /T1/)
  assert.ok(result.event.removedModifier)
})

test('统御宝珠重骰已有尊崇词缀并遵守前后缀保护', () => {
  const session = influencedSession('elder', 404)
  const elevated = matchingModifiers('elder').filter((modifier) => modifier.tiers.some((tier) => tier.tier === 1 && tier.weight === 0))
  const first = elevated[0]
  const second = elevated.find((entry) => entry.groupId !== first.groupId && entry.affixType === first.affixType)
  addAffix(session, first, first.tiers.find((tier) => tier.tier === 1), 3)
  addAffix(session, second, second.tiers.find((tier) => tier.tier === 1), 4)
  const result = applyManualInfluenceCraft(dataset, session, 'influence:orb-of-dominance')
  assert.equal(result.event.rerolledElevated, true)
  assert.match(result.event.upgradedTo.tierName, /T1/)

  const locked = structuredClone(session)
  locked.state.meta[first.affixType === 'prefix' ? 'prefixesLocked' : 'suffixesLocked'] = true
  const entry = listManualInfluenceCrafts(dataset, locked).items.find((item) => item.kind === 'dominance')
  assert.equal(entry.canApply, false)
  assert.match(entry.unavailableReason, /至少需要两条/)
})

test('觉醒者供体配置、合并、销毁及撤销重做保持完整双装备状态', () => {
  const receiver = influencedSession('shaper', 505)
  const receiverModifier = matchingModifiers('shaper').find((modifier) => modifier.tiers.some((tier) => tier.weight > 0))
  addAffix(receiver, receiverModifier, receiverModifier.tiers.find((tier) => tier.weight > 0), 5)
  receiver.state.meta.cannotRollAttack = true

  const options = listManualAwakenerDonorCandidates(dataset, receiver, { baseId: helmet.id, itemLevel: 100, influence: 'elder' })
  const selected = options.candidates.find((entry) => entry.weight > 0 && entry.modifierId !== receiverModifier.id)
  const configured = configureManualAwakenerDonor(dataset, receiver, {
    baseId: helmet.id, itemLevel: 100, influence: 'elder', modifierId: selected.modifierId, tierId: selected.tierId, seed: 606
  })
  assert.equal(configured.session.awakenerDonor.state.rarity, 'magic')
  assert.equal(listManualInfluenceCrafts(dataset, configured.session).items.find((item) => item.kind === 'awakener').canApply, true)

  const result = applyManualInfluenceCraft(dataset, configured.session, 'influence:awakeners-orb')
  assert.deepEqual(result.session.state.influences, ['shaper', 'elder'])
  assert.equal(result.session.state.rarity, 'rare')
  assert.equal(result.session.state.meta.cannotRollAttack, false)
  assert.equal(result.session.awakenerDonor, null)
  assert.equal(result.event.donorConsumed, true)
  assert.equal(result.event.inheritedModifiers.length, 2)
  assert.ok(result.event.inheritedModifiers.every(({ modifier }) => [...result.session.state.prefixes, ...result.session.state.suffixes].some((entry) => entry.modifierId === modifier.modifierId && entry.tierId === modifier.tierId)))

  const undone = undoManualAction(dataset, result.session)
  assert.deepEqual(undone.session.awakenerDonor, configured.session.awakenerDonor)
  assert.deepEqual(undone.session.state, configured.session.state)
  const redone = redoManualAction(dataset, undone.session)
  assert.equal(redone.session.awakenerDonor, null)
  assert.deepEqual(redone.session.state, result.session.state)
  assert.equal(resetManualSession(dataset, redone.session).session.awakenerDonor, null)
})

test('觉醒者之石在继承词缀 ModGroup 冲突时固定随机保留一条', () => {
  const shaper = matchingModifiers('shaper').find((modifier) => matchingModifiers('elder').some((entry) => entry.groupId === modifier.groupId))
  const elder = matchingModifiers('elder').find((modifier) => modifier.groupId === shaper.groupId)
  const receiver = influencedSession('shaper', 707)
  const donor = influencedSession('elder', 808)
  addAffix(receiver, shaper, shaper.tiers.find((tier) => tier.weight > 0) ?? shaper.tiers[0], 7)
  addAffix(donor, elder, elder.tiers.find((tier) => tier.weight > 0) ?? elder.tiers[0], 8)
  receiver.awakenerDonor = donor
  const first = applyManualInfluenceCraft(dataset, receiver, 'influence:awakeners-orb')
  const repeated = applyManualInfluenceCraft(dataset, receiver, 'influence:awakeners-orb')
  assert.deepEqual(first.session.state, repeated.session.state)
  assert.equal(first.event.inheritedModifiers.length, 1)
  assert.ok(first.event.discardedConflict)
})

test('觉醒者之石从双方多条势力词缀中按固定种子各选一条', () => {
  const receiver = influencedSession('shaper', 812)
  const donor = influencedSession('elder', 813)
  const shaperMods = matchingModifiers('shaper').filter((modifier) => modifier.tiers.some((tier) => tier.weight > 0))
  const elderMods = matchingModifiers('elder').filter((modifier) => modifier.tiers.some((tier) => tier.weight > 0))
  const shaperSecond = shaperMods.find((modifier) => modifier.groupId !== shaperMods[0].groupId)
  const elderSecond = elderMods.find((modifier) => modifier.groupId !== elderMods[0].groupId)
  for (const [index, modifier] of [shaperMods[0], shaperSecond].entries()) addAffix(receiver, modifier, modifier.tiers.find((tier) => tier.weight > 0), 20 + index)
  for (const [index, modifier] of [elderMods[0], elderSecond].entries()) addAffix(donor, modifier, modifier.tiers.find((tier) => tier.weight > 0), 30 + index)
  receiver.awakenerDonor = donor
  const first = applyManualInfluenceCraft(dataset, receiver, 'influence:awakeners-orb')
  const repeated = applyManualInfluenceCraft(dataset, receiver, 'influence:awakeners-orb')
  assert.deepEqual(first.event.inheritedModifiers, repeated.event.inheritedModifiers)
  assert.equal(first.event.inheritedModifiers.some((entry) => entry.influence === 'shaper'), true)
  assert.equal(first.event.inheritedModifiers.some((entry) => entry.influence === 'elder'), true)
})

test('觉醒者之石拒绝同势力、不同装备类型与缺少所属势力词缀', () => {
  const receiver = influencedSession('shaper', 909)
  const shaper = matchingModifiers('shaper').find((modifier) => modifier.tiers.some((tier) => tier.weight > 0))
  addAffix(receiver, shaper, shaper.tiers.find((tier) => tier.weight > 0), 9)
  receiver.awakenerDonor = influencedSession('shaper', 910)
  addAffix(receiver.awakenerDonor, shaper, shaper.tiers.find((tier) => tier.weight > 0), 10)
  let awakener = listManualInfluenceCrafts(dataset, receiver).items.find((item) => item.kind === 'awakener')
  assert.match(awakener.unavailableReason, /势力必须不同/)
  receiver.awakenerDonor = influencedSession('elder', 911)
  awakener = listManualInfluenceCrafts(dataset, receiver).items.find((item) => item.kind === 'awakener')
  assert.match(awakener.unavailableReason, /没有可继承/)
})
