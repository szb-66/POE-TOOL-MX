import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyManualEldritchCraft,
  createManualSession,
  listManualEldritchCrafts,
  redoManualAction,
  resetManualSession,
  undoManualAction
} from '../electron/modules/crafting/manualCrafting.js'

const makeModifier = (id, affixType, tags) => ({
  id: `mod:${id}`, goalId: `goal:${id}`, familyId: `family:${id}`, modifierProfileId: 'Gloves', groupId: id,
  name: id, affixType, source: 'natural', tags, displayTags: tags.map((tag) => ({ id: tag, label: tag })),
  spawnTags: ['gloves'], requiredTags: [], itemClasses: ['Gloves'], influences: [],
  tiers: [{ id: `tier:${id}`, tier: 1, name: 'T1', requiredLevel: 1, weight: 1000, text: `${id} (1—10)`, values: [{ min: 1, max: 10 }], displayTags: tags.map((tag) => ({ id: tag, label: tag })) }]
})
const makeEldritchFamily = (source, id) => ({
  id: `eldritch:${source}:${id}`, source, effectKey: `${id} #`, name: id, itemClasses: ['Gloves'], tags: [id], displayTags: [{ id, label: id }],
  tiers: Array.from({ length: 6 }, (_, index) => ({
    id: `eldritch:${source}:${id}:t${index + 1}`, tier: index + 1, name: `T${index + 1}`, requiredLevel: 1,
    text: `${id} (${index + 1}—${index + 2})`, values: [{ min: index + 1, max: index + 2 }], displayTags: [{ id, label: id }], weights: { Gloves: 1000 }
  }))
})
const dataset = {
  bases: [{ id: 'base:gloves', name: '测试手套', displayName: '测试手套', itemClass: 'Gloves', categoryPath: ['防具', '手套'], modifierProfileId: 'Gloves', requiredLevel: 1, requirements: { level: 1, strength: 0, dexterity: 0, intelligence: 0 }, qualityType: 'armour', socketLimit: 4, baseStats: [], implicitModifiers: [], tags: ['gloves'], maxAffixes: { prefix: 3, suffix: 3 }, allowedVariants: ['normal', 'fractured', 'influenced'] }],
  modifiers: [makeModifier('attack', 'prefix', ['attack']), makeModifier('life', 'prefix', ['life']), makeModifier('speed', 'suffix', ['speed']), makeModifier('cold', 'suffix', ['cold'])],
  modifierFamilies: [], crafts: [], eldritchImplicitFamilies: [makeEldritchFamily('exarch', 'fire'), makeEldritchFamily('eater', 'cold')]
}

function session(seed = 7) {
  return createManualSession(dataset, { baseId: 'base:gloves', itemLevel: 84, variant: { kind: 'normal' }, seed })
}

test('八种直接通货生成真实阶级、替换同侧并保留对侧', () => {
  let current = session()
  current.state.implicits = ['底材固定词缀']
  const first = applyManualEldritchCraft(dataset, current, 'eldritch:grand-eldritch-ember')
  assert.equal(first.session.state.eldritchImplicits.exarch.tier, 3)
  assert.deepEqual(first.session.state.implicits, [])
  const second = applyManualEldritchCraft(dataset, first.session, 'eldritch:exceptional-eldritch-ichor')
  assert.equal(second.session.state.eldritchImplicits.exarch.tier, 3)
  assert.equal(second.session.state.eldritchImplicits.eater.tier, 4)
  assert.equal(second.eldritch.dominance.source, 'eater')
  assert.deepEqual(undoManualAction(dataset, second.session).session.state, first.session.state)
  assert.deepEqual(redoManualAction(dataset, undoManualAction(dataset, second.session).session).session.state, second.session.state)
  assert.equal(resetManualSession(dataset, second.session).session.state.eldritchImplicits.exarch, null)
})

test('直接古灵通货拒绝非护甲、势力、腐化与空候选', () => {
  const influenced = session()
  influenced.state.influences = ['shaper']
  assert.match(listManualEldritchCrafts(dataset, influenced).items[0].unavailableReason, /势力/)
  const corrupted = session()
  corrupted.state.corrupted = true
  assert.match(listManualEldritchCrafts(dataset, corrupted).items[0].unavailableReason, /腐化/)
  const low = session()
  low.itemLevel = 0
  assert.match(listManualEldritchCrafts(dataset, low).items[0].unavailableReason, /没有可用/)
})

test('支配崇高和无效定向修改显式并遵守标签元工艺', () => {
  let current = applyManualEldritchCraft(dataset, session(19), 'eldritch:exceptional-eldritch-ember').session
  current.state.rarity = 'rare'
  current.state.meta.cannotRollAttack = true
  const exalted = applyManualEldritchCraft(dataset, current, 'eldritch:exalted')
  assert.equal(exalted.session.state.prefixes.length, 1)
  assert.equal(exalted.session.state.prefixes[0].modifierId, 'mod:life')
  exalted.session.state.prefixes.push({ ...exalted.session.state.prefixes[0], modifierId: 'mod:attack', goalId: 'goal:attack', tierId: 'tier:attack', groupId: 'attack', name: 'attack', displayTags: [{ id: 'attack', label: 'attack' }] })
  exalted.session.state.meta.cannotRollAttack = true
  const annulled = applyManualEldritchCraft(dataset, exalted.session, 'eldritch:annulment')
  assert.equal(annulled.event.removedModifier.modifierId, 'mod:life')
  assert.ok(annulled.session.state.prefixes.some((entry) => entry.modifierId === 'mod:attack'))
  const locked = structuredClone(exalted.session)
  locked.state.meta.prefixesLocked = true
  assert.match(listManualEldritchCrafts(dataset, locked).items.find((entry) => entry.id === 'eldritch:annulment').unavailableReason, /可移除/)
})

test('古灵混沌只重铸支配侧，冲突石处理 T1 删除与 T6 浪费升级', () => {
  let current = applyManualEldritchCraft(dataset, session(31), 'eldritch:exceptional-eldritch-ember').session
  current = applyManualEldritchCraft(dataset, current, 'eldritch:lesser-eldritch-ichor').session
  current.state.rarity = 'rare'
  current.state.prefixes = [{ goalId: 'old', modifierId: 'old', tierId: 'old', groupId: 'old', source: 'natural', affixType: 'prefix', name: 'old', tierName: 'T1', text: 'old', rolledText: 'old', valueRanges: [], rolledValues: [], displayTags: [], weight: 1, fractured: false, metaCraft: false }]
  current.state.suffixes = [{ goalId: 'keep', modifierId: 'keep', tierId: 'keep', groupId: 'keep', source: 'natural', affixType: 'suffix', name: 'keep', tierName: 'T1', text: 'keep', rolledText: 'keep', valueRanges: [], rolledValues: [], displayTags: [], weight: 1, fractured: false, metaCraft: false }]
  assert.equal(listManualEldritchCrafts(dataset, current).items.find((entry) => entry.id === 'eldritch:chaos').canApply, true)
  const chaos = applyManualEldritchCraft(dataset, current, 'eldritch:chaos')
  assert.equal(chaos.session.state.suffixes[0].modifierId, 'keep')
  assert.equal(chaos.session.state.prefixes.some((entry) => entry.modifierId === 'old'), false)

  const conflictInput = structuredClone(current)
  conflictInput.state.eldritchImplicits.exarch = { ...conflictInput.state.eldritchImplicits.exarch, tier: 6, tierId: 'eldritch:exarch:fire:t6' }
  conflictInput.state.eldritchImplicits.eater = { ...conflictInput.state.eldritchImplicits.eater, tier: 1, tierId: 'eldritch:eater:cold:t1' }
  conflictInput.rngState = 1
  const conflict = applyManualEldritchCraft(dataset, conflictInput, 'eldritch:conflict')
  assert.equal(conflict.session.state.eldritchImplicits.exarch.tier, 6)
  assert.equal(conflict.session.state.eldritchImplicits.eater, null)
  assert.equal(conflict.event.conflict.upgradeSource, 'exarch')
})
