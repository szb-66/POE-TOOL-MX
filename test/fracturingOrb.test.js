import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  applyManualCurrency, createManualSession, inspectManualCurrencies,
  redoManualAction, resetManualSession, undoManualAction
} from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset } from '../electron/modules/crafting/model.js'

const dataset = normalizeCraftingDataset(JSON.parse(await readFile(path.resolve('electron/assets/crafting-data/dataset.json'), 'utf8')))
const base = dataset.bases.find((entry) => entry.itemClass === 'Helmet' && entry.allowedVariants.includes('normal') && entry.allowedVariants.includes('fractured'))

function rareSession(seed = 100) {
  const session = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed })
  return applyManualCurrency(dataset, session, 'currency:alchemy').session
}

function allAffixes(session) {
  return [...session.state.prefixes, ...session.state.suffixes]
}

function fracturingEntry(session) {
  return inspectManualCurrencies(dataset, session).find((entry) => entry.id === 'currency:fracturing')
}

test('破溃宝珠固定随机选择一条词缀并只增加破裂标记', () => {
  const session = rareSession(201)
  const before = structuredClone(session.state)
  const first = applyManualCurrency(dataset, session, 'currency:fracturing')
  const repeated = applyManualCurrency(dataset, session, 'currency:fracturing')
  assert.deepEqual(first.session.state, repeated.session.state)
  assert.equal(allAffixes(first.session).filter((affix) => affix.fractured).length, 1)
  assert.equal(first.event.fracturedModifier.fractured, true)
  const afterWithoutFlag = structuredClone(first.session.state)
  const selected = [...afterWithoutFlag.prefixes, ...afterWithoutFlag.suffixes].find((affix) => affix.fractured)
  selected.fractured = false
  assert.deepEqual(afterWithoutFlag, before)
  assert.equal(first.session.variant.kind, 'fractured')
  assert.equal(first.session.variant.fracturedTierId, first.event.fracturedModifier.tierId)
})

test('破溃宝珠忽略位置锁且工艺元工艺同样参与等概率候选', () => {
  const session = rareSession(202)
  session.rngState = 1
  const first = session.state.prefixes[0]
  first.source = 'crafted'
  first.metaCraft = true
  first.modifierId = 'bench-meta:lock-prefixes'
  first.goalId = first.modifierId
  first.groupId = first.modifierId
  session.state.meta.prefixesLocked = true
  const result = applyManualCurrency(dataset, session, 'currency:fracturing')
  assert.equal(result.event.fracturedModifier.modifierId, 'bench-meta:lock-prefixes')
  assert.equal(result.event.fracturedModifier.source, 'crafted')
  assert.equal(result.event.fracturedModifier.metaCraft, true)
  assert.equal(result.session.state.meta.prefixesLocked, true)
})

test('破溃宝珠拒绝稀有度、数量、腐化、势力、综合、已有破裂和未揭露状态', () => {
  const normal = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 301 })
  assert.match(fracturingEntry(normal).unavailableReason, /稀有/)
  normal.state.rarity = 'rare'
  assert.match(fracturingEntry(normal).unavailableReason, /至少有 4 条/)

  const cases = [
    ['腐化', (session) => { session.state.corrupted = true }],
    ['势力', (session) => { session.state.influences = ['shaper']; session.variant = { kind: 'influenced', influences: ['shaper'], fracturedTierId: null, implicits: [] } }],
    ['综合', (session) => { session.variant = { kind: 'synthesized', influences: [], fracturedTierId: null, implicits: [] } }],
    ['破裂', (session) => { allAffixes(session)[0].fractured = true }],
    ['揭露', (session) => { allAffixes(session)[0].veiled = true; allAffixes(session)[0].source = 'veiled-pending' }]
  ]
  for (const [message, mutate] of cases) {
    const session = rareSession(302)
    mutate(session)
    const entry = fracturingEntry(session)
    assert.equal(entry.canApply, false)
    assert.match(entry.unavailableReason, new RegExp(message))
  }
})

test('Split 与古灵隐式在破裂后完整保留', () => {
  const session = rareSession(401)
  session.state.split = true
  session.variant = { kind: 'eldritch', influences: [], fracturedTierId: null, implicits: [] }
  session.state.eldritchImplicits.exarch = {
    source: 'exarch', familyId: 'test', tierId: 'test:t1', tier: 1, name: 'T1',
    text: '测试古灵隐式', rolledText: '测试古灵隐式', valueRanges: [], rolledValues: [], displayTags: [], weight: 100
  }
  assert.equal(fracturingEntry(session).canApply, true)
  const result = applyManualCurrency(dataset, session, 'currency:fracturing')
  assert.equal(result.session.state.split, true)
  assert.deepEqual(result.session.state.eldritchImplicits, session.state.eldritchImplicits)
})

test('破裂动作撤销、重做和重置同步恢复装备变体', () => {
  const session = rareSession(501)
  const result = applyManualCurrency(dataset, session, 'currency:fracturing')
  const undone = undoManualAction(dataset, result.session)
  assert.deepEqual(undone.session.state, session.state)
  assert.deepEqual(undone.session.variant, session.variant)
  const redone = redoManualAction(dataset, undone.session)
  assert.deepEqual(redone.session.state, result.session.state)
  assert.deepEqual(redone.session.variant, result.session.variant)
  const reset = resetManualSession(dataset, redone.session)
  assert.equal(reset.session.variant.kind, 'normal')
  assert.equal(allAffixes(reset.session).length, 0)
})
