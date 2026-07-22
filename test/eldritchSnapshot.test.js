import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { applyManualCurrency, applyManualEldritchCraft, createManualSession, listManualEldritchCrafts } from '../electron/modules/crafting/manualCrafting.js'

const dataset = normalizeCraftingDataset(JSON.parse(await readFile(path.resolve('electron/assets/crafting-data/dataset.json'), 'utf8')))

test('内置快照包含两来源、四类护甲和完整六阶古灵家族', () => {
  const families = dataset.eldritchImplicitFamilies
  assert.equal(families.length, 669)
  assert.deepEqual(new Set(families.map((family) => family.source)), new Set(['exarch', 'eater']))
  assert.deepEqual(new Set(families.flatMap((family) => family.itemClasses)), new Set(['Helmet', 'Gloves', 'Boots', 'BodyArmour']))
  assert.ok(families.every((family) => family.tiers.length === 6 && family.tiers.every((tier, index) => tier.tier === index + 1)))
  assert.ok(families.some((family) => family.tiers[0].weights[family.itemClasses[0]] === 0 && family.tiers.some((tier) => tier.weights[family.itemClasses[0]] > 0)))
})

test('真实快照八种直接古灵通货在四类护甲均有候选', () => {
  for (const itemClass of ['Helmet', 'Gloves', 'Boots', 'BodyArmour']) {
    const base = dataset.bases.find((entry) => entry.itemClass === itemClass && entry.allowedVariants.includes('normal'))
    assert.ok(base, `缺少 ${itemClass} 底材`)
    const session = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 20260722 })
    const direct = listManualEldritchCrafts(dataset, session).items.filter((entry) => entry.kind === 'implicit')
    assert.equal(direct.length, 8)
    assert.ok(direct.every((entry) => entry.canApply && entry.candidateCount > 0), `${itemClass} 有直接通货空池`)
  }
})

test('真实手套快照执行直接隐式、三种支配通货与冲突石', () => {
  const base = dataset.bases.find((entry) => entry.itemClass === 'Gloves' && entry.allowedVariants.includes('normal'))
  let session = createManualSession(dataset, { baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 9917 })
  session = applyManualEldritchCraft(dataset, session, 'eldritch:exceptional-eldritch-ember').session
  session = applyManualEldritchCraft(dataset, session, 'eldritch:lesser-eldritch-ichor').session
  assert.equal(listManualEldritchCrafts(dataset, session).dominance.source, 'exarch')
  session = applyManualCurrency(dataset, session, 'currency:alchemy').session

  const annulled = applyManualEldritchCraft(dataset, session, 'eldritch:annulment')
  assert.equal(annulled.event.targetAffixType, 'prefix')
  const exalted = applyManualEldritchCraft(dataset, annulled.session, 'eldritch:exalted')
  assert.equal(exalted.event.targetAffixType, 'prefix')
  const chaos = applyManualEldritchCraft(dataset, exalted.session, 'eldritch:chaos')
  assert.equal(chaos.event.targetAffixType, 'prefix')
  assert.deepEqual(chaos.session.state.suffixes, exalted.session.state.suffixes)
  const conflict = applyManualEldritchCraft(dataset, chaos.session, 'eldritch:conflict')
  assert.ok(['exarch', 'eater'].includes(conflict.event.conflict.upgradeSource))
  assert.equal(conflict.event.conflict.basis, '社区实测估计')
})
