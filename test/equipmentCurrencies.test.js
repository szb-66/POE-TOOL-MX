import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  applyManualBeastcraft, applyManualCurrency, createManualSession, listManualBeastcrafts,
  inspectManualCurrencies, previewManualCurrency, redoManualAction, resetManualSession, undoManualAction
} from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { isBaseDefenceEntry } from '../electron/modules/crafting/equipmentPropertyRules.js'

const dataset = normalizeCraftingDataset(JSON.parse(await readFile(path.resolve('electron/assets/crafting-data/dataset.json'), 'utf8')))

function findBase(predicate, message) {
  const base = dataset.bases.find(predicate)
  assert.ok(base, message)
  return base
}

function sessionFor(base, { itemLevel = 100, seed = 1 } = {}) {
  return createManualSession(dataset, { baseId: base.id, itemLevel: Math.max(base.requiredLevel, itemLevel), variant: { kind: 'normal' }, seed })
}

function currency(current, id) {
  return inspectManualCurrencies(dataset, current).find((entry) => entry.id === id)
}

test('磨刀石与护甲片遵守类型、随机品质增量、20% 上限和不可变门禁', () => {
  const weapon = findBase((base) => base.qualityType === 'weapon', '缺少武器底材')
  let current = sessionFor(weapon, { itemLevel: 100, seed: 10 })
  assert.match(currency(current, 'currency:armourers-scrap').unavailableReason, /护甲/)
  const first = applyManualCurrency(dataset, current, 'currency:blacksmith-whetstone')
  assert.ok(first.session.state.quality >= 1 && first.session.state.quality <= 20)
  assert.deepEqual(first.event.qualityChange, { before: 0, after: first.session.state.quality })
  current = first.session
  while (current.state.quality < 20) current = applyManualCurrency(dataset, current, 'currency:blacksmith-whetstone').session
  assert.equal(current.state.quality, 20)
  assert.match(currency(current, 'currency:blacksmith-whetstone').unavailableReason, /20%/)
  current.state.corrupted = true
  assert.match(currency(current, 'currency:blacksmith-whetstone').unavailableReason, /腐化/)
})

test('珠宝匠、幻色与链接石分别维护孔位不变量及各自不应改变的部分', () => {
  const body = findBase((base) => base.itemClass === 'BodyArmour' && base.socketLimit === 6, '缺少六孔胸甲')
  let current = sessionFor(body, { itemLevel: 100, seed: 20 })
  const jewelled = applyManualCurrency(dataset, current, 'currency:jewellers')
  assert.notEqual(jewelled.session.state.sockets.length, current.state.sockets.length)
  assert.ok(jewelled.session.state.sockets.length <= 6)
  assert.equal(new Set(jewelled.session.state.links.flat()).size, jewelled.session.state.sockets.length)

  current = jewelled.session
  const linksBefore = structuredClone(current.state.links)
  const idsBefore = current.state.sockets.map((socket) => socket.id)
  const chromatic = applyManualCurrency(dataset, current, 'currency:chromatic')
  assert.deepEqual(chromatic.session.state.links, linksBefore)
  assert.deepEqual(chromatic.session.state.sockets.map((socket) => socket.id), idsBefore)

  current = chromatic.session
  current.state.links = current.state.sockets.map((socket) => [socket.id])
  const colorsBefore = current.state.sockets.map((socket) => socket.color)
  const fused = applyManualCurrency(dataset, current, 'currency:fusing')
  assert.deepEqual(fused.session.state.sockets.map((socket) => socket.color), colorsBefore)
  assert.equal(new Set(fused.session.state.links.flat()).size, fused.session.state.sockets.length)
  assert.equal(currency(fused.session, 'currency:jewellers').probabilityModel, 'poe1-3.28-community-v1')
  assert.equal(currency(fused.session, 'currency:fusing').probabilityModel, 'poe1-3.28-community-v1')
})

test('祝福石重掷可变普通固有词缀且不改变种类', () => {
  const base = findBase((entry) => entry.implicitModifiers.some((implicit) => implicit.values.some((range) => range.max > range.min)), '缺少可变固有词缀底材')
  const current = sessionFor(base, { seed: 30 })
  const ids = current.state.baseImplicits.map((entry) => entry.id)
  const values = current.state.baseImplicits.map((entry) => entry.rolledValues)
  const result = applyManualCurrency(dataset, current, 'currency:blessed')
  assert.deepEqual(result.session.state.baseImplicits.map((entry) => entry.id), ids)
  assert.notDeepEqual(result.session.state.baseImplicits.map((entry) => entry.rolledValues), values)
  assert.ok(result.event.implicitChange)
})

test('圣玉只重骰共享基础防御并公开准确门禁与历史', () => {
  const hybrid = findBase((base) => base.qualityType === 'armour' && base.baseStats.filter((entry) => isBaseDefenceEntry(entry) && entry.values.some((range) => range.max > range.min)).length >= 2, '缺少混合防御底材')
  const current = sessionFor(hybrid, { seed: 31 })
  assert.ok(Number.isInteger(current.state.baseDefencePercentile))
  const preserved = {
    quality: current.state.quality,
    sockets: structuredClone(current.state.sockets), links: structuredClone(current.state.links),
    baseImplicits: structuredClone(current.state.baseImplicits),
    prefixes: structuredClone(current.state.prefixes), suffixes: structuredClone(current.state.suffixes),
    nonDefences: structuredClone(current.state.baseStats.filter((entry) => !isBaseDefenceEntry(entry)))
  }
  const result = applyManualCurrency(dataset, current, 'currency:sacred')
  assert.equal(result.event.costs[0].resourceName, '圣玉')
  assert.equal(result.event.baseDefenceChange.percentileBefore, current.state.baseDefencePercentile)
  assert.equal(result.event.baseDefenceChange.percentileAfter, result.session.state.baseDefencePercentile)
  assert.deepEqual({
    quality: result.session.state.quality,
    sockets: result.session.state.sockets, links: result.session.state.links,
    baseImplicits: result.session.state.baseImplicits,
    prefixes: result.session.state.prefixes, suffixes: result.session.state.suffixes,
    nonDefences: result.session.state.baseStats.filter((entry) => !isBaseDefenceEntry(entry))
  }, preserved)

  const weapon = sessionFor(findBase((base) => base.qualityType === 'weapon', '缺少武器底材'))
  assert.match(currency(weapon, 'currency:sacred').unavailableReason, /只能用于护甲/)
  const fixed = structuredClone(current)
  fixed.state.baseStats.forEach((entry) => { if (isBaseDefenceEntry(entry)) entry.valueRanges = entry.valueRanges.map((range) => ({ min: range.min, max: range.min })) })
  fixed.state.baseDefencePercentile = null
  assert.match(currency(fixed, 'currency:sacred').unavailableReason, /没有可重骰/)
  const corrupted = structuredClone(current); corrupted.state.corrupted = true
  assert.match(currency(corrupted, 'currency:sacred').unavailableReason, /腐化/)
  const mirrored = structuredClone(current); mirrored.state.mirrored = true
  assert.match(currency(mirrored, 'currency:sacred').unavailableReason, /镜像/)
})

test('圣玉结果可复现并参与预见、撤销、重做和重置', () => {
  const base = findBase((entry) => entry.qualityType === 'armour' && entry.baseStats.some((stat) => isBaseDefenceEntry(stat) && stat.values.some((range) => range.max > range.min)), '缺少可变基础防御护甲')
  const first = sessionFor(base, { seed: 32 })
  const second = structuredClone(first)
  assert.deepEqual(applyManualCurrency(dataset, first, 'currency:sacred').session.state, applyManualCurrency(dataset, second, 'currency:sacred').session.state)

  let foreseen = applyManualCurrency(dataset, first, 'currency:transmutation').session
  foreseen = applyManualBeastcraft(dataset, foreseen, 'apply-hinekora-lock').session
  const beforePreview = structuredClone(foreseen)
  const preview = previewManualCurrency(dataset, foreseen, 'currency:sacred')
  assert.deepEqual(foreseen, beforePreview)
  const applied = applyManualCurrency(dataset, foreseen, 'currency:sacred')
  assert.deepEqual(applied.session.state, preview.state)
  const undone = undoManualAction(dataset, applied.session)
  assert.deepEqual(undone.session.state, foreseen.state)
  assert.deepEqual(redoManualAction(dataset, undone.session).session.state, applied.session.state)
  assert.deepEqual(resetManualSession(dataset, applied.session).session.state, applied.session.initialState)
})

test('束缚石升级普通物品并生成不超过类型上限的完整四连', () => {
  const body = findBase((base) => base.itemClass === 'BodyArmour' && base.requiredLevel === 1, '缺少一级胸甲')
  const current = sessionFor(body, { itemLevel: 1, seed: 40 })
  const result = applyManualCurrency(dataset, current, 'currency:binding')
  assert.equal(result.session.state.rarity, 'rare')
  assert.equal(result.session.state.sockets.length, 4)
  assert.deepEqual(result.session.state.links, [result.session.state.sockets.map((socket) => socket.id)])
  assert.ok(result.session.state.prefixes.length + result.session.state.suffixes.length >= 4)
})

test('黑莫里根最大孔/最大连接复用孔位规则，并随历史、重置和预见完整流转', () => {
  const body = findBase((base) => base.itemClass === 'BodyArmour' && base.socketLimit === 6, '缺少六孔胸甲')
  let current = sessionFor(body, { itemLevel: 35, seed: 50 })
  assert.equal(listManualBeastcrafts(dataset, current).items.find((entry) => entry.id === 'maximum-sockets').canApply, true)
  const socketed = applyManualBeastcraft(dataset, current, 'maximum-sockets')
  assert.equal(socketed.session.state.sockets.length, 5)
  const linked = applyManualBeastcraft(dataset, socketed.session, 'maximum-links')
  assert.deepEqual(linked.session.state.links, [linked.session.state.sockets.map((socket) => socket.id)])

  const undone = undoManualAction(dataset, linked.session)
  assert.notDeepEqual(undone.session.state.links, linked.session.state.links)
  assert.deepEqual(redoManualAction(dataset, undone.session).session.state, linked.session.state)
  assert.deepEqual(resetManualSession(dataset, linked.session).session.state, linked.session.initialState)

  current = applyManualCurrency(dataset, socketed.session, 'currency:transmutation').session
  current = applyManualBeastcraft(dataset, current, 'apply-hinekora-lock').session
  current.state.links = current.state.sockets.map((socket) => [socket.id])
  const before = structuredClone(current)
  const preview = previewManualCurrency(dataset, current, 'currency:fusing')
  assert.deepEqual(current, before)
  assert.deepEqual(applyManualCurrency(dataset, current, 'currency:fusing').session.state, preview.state)
})
