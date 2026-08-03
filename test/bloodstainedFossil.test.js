import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { applyManualCurrency, applyManualFossils, createManualSession, listManualFossils, redoManualAction, resetManualSession, undoManualAction } from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { corruptedImplicitCandidates } from '../electron/modules/crafting/vaalRules.js'

const dataset = normalizeCraftingDataset(JSON.parse(await readFile('electron/assets/crafting-data/dataset.json', 'utf8')))
const wand = dataset.bases.find((base) => base.itemClass === 'Wand' && base.implicitModifiers.length > 0 && corruptedImplicitCandidates(dataset, base, 84).length > 0)
const jewel = dataset.bases.find((base) => /Jewel/.test(base.itemClass) && !corruptedImplicitCandidates(dataset, base, 84).length)
assert.ok(wand && jewel)

function rareSession(seed = 731) {
  const initial = createManualSession(dataset, { baseId: wand.id, itemLevel: 84, variant: { kind: 'normal' }, seed })
  return applyManualCurrency(dataset, initial, 'currency:alchemy').session
}

test('真实 3.29 快照启用溅血化石并公开候选与永久腐化后果', () => {
  const rare = rareSession()
  const bloodstained = listManualFossils(dataset, rare).items.find((entry) => entry.id === 'bloodstained')
  assert.equal(bloodstained.supported, true)
  assert.equal(bloodstained.selectable, true)
  assert.equal(bloodstained.canApply, true)
  assert.equal(bloodstained.candidateCount, corruptedImplicitCandidates(dataset, wand, 84).length)
  assert.match(bloodstained.consequences, /重铸显式词缀.*腐化固定词缀.*永久腐化/)
})

test('溅血化石先重铸显式再替换底材隐式并支持确定性历史', () => {
  const before = rareSession(912)
  const first = applyManualFossils(dataset, before, { sockets: 1, fossilIds: ['bloodstained'] })
  const repeated = applyManualFossils(dataset, rareSession(912), { sockets: 1, fossilIds: ['bloodstained'] })
  assert.deepEqual(first.session.state, repeated.session.state)
  assert.deepEqual(first.event.corruptedImplicit, repeated.event.corruptedImplicit)
  assert.equal(first.session.state.corrupted, true)
  assert.equal(first.session.state.corruptionOutcome, 'implicit')
  assert.ok(first.session.state.vaalImplicit)
  assert.equal(first.session.state.baseImplicits.length, 0)
  assert.equal(first.event.corruptionReplacedImplicit.source, 'base')
  assert.equal(first.event.corrupted, true)
  assert.deepEqual(first.event.costs.map((entry) => entry.resourceId), ['resonator:primitive', 'fossil:bloodstained'])

  const undone = undoManualAction(dataset, first.session)
  assert.deepEqual(undone.session.state, before.state)
  assert.deepEqual(redoManualAction(dataset, undone.session).session.state, first.session.state)
  assert.equal(resetManualSession(dataset, first.session).session.state.corrupted, false)
})

test('溅血与镶金组合只替换一个隐式并保留未命中项', () => {
  const result = applyManualFossils(dataset, rareSession(1307), { sockets: 2, fossilIds: ['bloodstained', 'gilded'] })
  const replacedSource = result.event.corruptionReplacedImplicit.source
  assert.ok(['base', 'gilded'].includes(replacedSource))
  assert.equal(result.session.state.vaalImplicit.familyId, result.event.corruptedImplicit.familyId)
  if (replacedSource === 'base') {
    assert.equal(result.session.state.baseImplicits.length, 0)
    assert.ok(result.session.state.implicits.includes('物品会被商贩高价购买'))
  } else {
    assert.equal(result.session.state.baseImplicits.length, 1)
    assert.equal(result.session.state.implicits.includes('物品会被商贩高价购买'), false)
  }
})

test('其他化石只改变显式池，不会过滤腐化固定词缀', () => {
  const elemental = corruptedImplicitCandidates(dataset, wand, 84)
    .find(({ tier }) => tier.displayTags.some((tag) => tag.id === 'elemental'))
  assert.ok(elemental, '当前瓦尔隐式池应包含元素标签候选')
  const focusedDataset = {
    ...dataset,
    corruptedImplicitFamilies: [{ ...structuredClone(elemental.family), tiers: [structuredClone(elemental.tier)] }]
  }
  let session = createManualSession(focusedDataset, { baseId: wand.id, itemLevel: 84, variant: { kind: 'normal' }, seed: 2 })
  session = applyManualCurrency(focusedDataset, session, 'currency:alchemy').session
  const result = applyManualFossils(focusedDataset, session, { sockets: 2, fossilIds: ['bloodstained', 'corroded'] })
  const explicitModifiers = [...result.session.state.prefixes, ...result.session.state.suffixes]
    .map((affix) => focusedDataset.modifiers.find((modifier) => modifier.id === affix.modifierId))
  assert.equal(explicitModifiers.some((modifier) => modifier?.tags.includes('elemental')), false)
  assert.ok(result.session.state.vaalImplicit.displayTags.some((tag) => tag.id === 'elemental'))
})

test('内置数据目录保存可执行溅血化石定义', () => {
  const craft = dataset.crafts.find((entry) => entry.id === 'craft:fossil:bloodstained')
  assert.equal(craft.params.supported, true)
  assert.equal(craft.params.special, 'bloodstained')
  assert.match(craft.params.description, /腐化固定词缀/)
})

test('溅血化石和共振器拒绝无腐化候选、镜像及已腐化状态', () => {
  const missingPoolDataset = { ...dataset, corruptedImplicitFamilies: [] }
  let missingPool = createManualSession(missingPoolDataset, { baseId: wand.id, itemLevel: 84, variant: { kind: 'normal' }, seed: 1 })
  missingPool = applyManualCurrency(missingPoolDataset, missingPool, 'currency:alchemy').session
  const missingBloodstained = listManualFossils(missingPoolDataset, missingPool).items.find((entry) => entry.id === 'bloodstained')
  assert.equal(missingBloodstained.selectable, false)
  assert.match(missingBloodstained.unavailableReason, /没有已验证的腐化固定词缀候选/)

  const jewelSession = createManualSession(dataset, { baseId: jewel.id, itemLevel: 84, variant: { kind: 'normal' }, seed: 1 })
  assert.match(listManualFossils(dataset, jewelSession).items.find((entry) => entry.id === 'bloodstained').unavailableReason, /不能用于该底材类别/)

  const mirrored = rareSession(2)
  mirrored.state.mirrored = true
  assert.match(listManualFossils(dataset, mirrored).items.find((entry) => entry.id === 'bloodstained').unavailableReason, /镜像/)
  assert.throws(() => applyManualFossils(dataset, mirrored, { sockets: 1, fossilIds: ['bloodstained'] }), /镜像/)

  const corrupted = rareSession(3)
  corrupted.state.corrupted = true
  assert.throws(() => applyManualFossils(dataset, corrupted, { sockets: 1, fossilIds: ['bloodstained'] }), /已腐化/)
})
