import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { applyManualCurrency, createManualSession, createSeededRng, inspectManualCurrencies, redoManualAction, resetManualSession, undoManualAction } from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { rollVaalOutcome } from '../electron/modules/crafting/vaalRules.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const dataset = normalizeCraftingDataset(JSON.parse(readFileSync(path.join(dirname, '..', 'electron', 'assets', 'crafting-data', 'dataset.json'), 'utf8')))
const wand = dataset.bases.find((base) => base.itemClass === 'Wand' && base.requiredLevel <= 84)
const jewel = dataset.bases.find((base) => /Jewel/.test(base.itemClass))
assert.ok(wand && jewel)

function seedFor(outcome) {
  for (let index = 1; index < 10000; index += 1) {
    const seed = Math.imul(index, 0x9e3779b1) >>> 0
    if (rollVaalOutcome(createSeededRng(seed)) === outcome) return seed
  }
  throw new Error(`找不到 ${outcome} 种子`)
}

function sessionFor(outcome) {
  return createManualSession(dataset, { baseId: wand.id, itemLevel: 84, variant: { kind: 'normal' }, seed: seedFor(outcome) })
}

test('真实法杖快照可复现四种等权瓦尔结果', () => {
  for (const outcome of ['implicit', 'white-sockets', 'rare-reforge', 'no-change']) {
    const initial = sessionFor(outcome)
    const first = applyManualCurrency(dataset, initial, 'currency:vaal')
    const repeated = applyManualCurrency(dataset, sessionFor(outcome), 'currency:vaal')
    assert.equal(first.session.state.corrupted, true)
    assert.equal(first.session.state.corruptionOutcome, outcome)
    assert.deepEqual(first.session.state, repeated.session.state)
    assert.equal(first.event.corruptionOutcome, outcome)
    if (outcome === 'implicit') assert.ok(first.session.state.vaalImplicit)
    if (outcome === 'white-sockets') assert.ok(first.session.state.sockets.some((socket) => socket.color === 'W'))
    if (outcome === 'rare-reforge') {
      assert.equal(first.session.state.rarity, 'rare')
      assert.equal(first.session.state.prefixes.length, 3)
      assert.equal(first.session.state.suffixes.length, 3)
    }
  }
})

test('瓦尔宝珠拒绝腐化、镜像和珠宝并提供具体原因', () => {
  const corrupted = sessionFor('no-change')
  corrupted.state.corrupted = true
  assert.match(inspectManualCurrencies(dataset, corrupted).find((entry) => entry.id === 'currency:vaal').unavailableReason, /已经腐化/)
  const mirrored = sessionFor('no-change')
  mirrored.state.mirrored = true
  assert.match(inspectManualCurrencies(dataset, mirrored).find((entry) => entry.id === 'currency:vaal').unavailableReason, /镜像/)
  const jewelSession = createManualSession(dataset, { baseId: jewel.id, itemLevel: Math.max(84, jewel.requiredLevel), variant: { kind: 'normal' }, seed: 1 })
  assert.match(inspectManualCurrencies(dataset, jewelSession).find((entry) => entry.id === 'currency:vaal').unavailableReason, /珠宝具有专属腐化/)
})

test('瓦尔结果参与撤销、重做、重置与预见', () => {
  const initial = sessionFor('implicit')
  initial.foreseeing = true
  const preview = inspectManualCurrencies(dataset, initial).find((entry) => entry.id === 'currency:vaal').preview
  assert.equal(initial.state.corrupted, false)
  const applied = applyManualCurrency(dataset, initial, 'currency:vaal')
  assert.deepEqual(applied.session.state, preview.state)
  const undone = undoManualAction(dataset, applied.session)
  assert.equal(undone.session.state.corrupted, false)
  const redone = redoManualAction(dataset, undone.session)
  assert.deepEqual(redone.session.state, applied.session.state)
  assert.equal(resetManualSession(dataset, redone.session).session.state.corrupted, false)
})

test('瓦尔稀有重铸保留锁定前缀并补足六条显式', () => {
  let current = sessionFor('rare-reforge')
  current = applyManualCurrency(dataset, current, 'currency:alchemy').session
  const kept = structuredClone(current.state.prefixes)
  assert.ok(kept.length)
  current.state.meta.prefixesLocked = true
  current.rngState = seedFor('rare-reforge')
  const result = applyManualCurrency(dataset, current, 'currency:vaal').session.state
  assert.deepEqual(result.prefixes.slice(0, kept.length), kept)
  assert.equal(result.prefixes.length, 3)
  assert.equal(result.suffixes.length, 3)
})
