import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  applyManualBeastcraft,
  applyManualCurrency,
  applyManualFossils,
  createManualSession,
  inspectManualCurrencies,
  previewManualCurrency,
  redoManualAction,
  resetManualSession,
  undoManualAction
} from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset } from '../electron/modules/crafting/model.js'
import { displayedCatalystEntry } from '../electron/modules/crafting/catalystRules.js'

const dataset = normalizeCraftingDataset(JSON.parse(await readFile(path.resolve('electron/assets/crafting-data/dataset.json'), 'utf8')))
const coralRing = dataset.bases.find((base) => base.name === '珊瑚戒指')
assert.ok(coralRing, '真实快照缺少珊瑚戒指')

function session(seed = 1) {
  return createManualSession(dataset, { baseId: coralRing.id, itemLevel: 100, variant: { kind: 'normal' }, seed })
}

function currency(current, id) {
  return inspectManualCurrencies(dataset, current).find((item) => item.id === id)
}

test('十三种催化剂进入目录并执行同类型累加与类型替换', () => {
  let current = session(10)
  const catalysts = inspectManualCurrencies(dataset, current).filter((item) => item.id.includes('catalyst-'))
  assert.equal(catalysts.length, 13)
  const fertile = applyManualCurrency(dataset, current, 'currency:catalyst-fertile')
  assert.deepEqual(fertile.event.catalystQualityChange.before, { type: null, amount: 0 })
  assert.equal(fertile.session.state.catalystQuality.type, 'life-mana')
  current = fertile.session
  const intrinsic = applyManualCurrency(dataset, current, 'currency:catalyst-intrinsic')
  assert.equal(intrinsic.session.state.catalystQuality.type, 'attribute')
  assert.equal(intrinsic.session.state.catalystQuality.amount, 1)
})

test('真实珊瑚戒指隐式受丰沃品质增强且原值不变', () => {
  const current = session(20)
  current.state.catalystQuality = { type: 'life-mana', amount: 20 }
  const implicit = current.state.baseImplicits[0]
  assert.ok(implicit.displayTags.some((tag) => tag.id === 'life'))
  const displayed = displayedCatalystEntry(implicit, current.state.catalystQuality)
  assert.equal(displayed.displayValues[0], Math.floor(implicit.rolledValues[0] * 1.2))
  assert.deepEqual(current.state.baseImplicits[0].rolledValues, implicit.rolledValues)
})

test('常规与污秽催化剂门禁准确区分腐化、镜像和首饰类型', () => {
  const current = session(30)
  assert.match(currency(current, 'currency:catalyst-tainted').unavailableReason, /已腐化/)
  current.state.corrupted = true
  assert.match(currency(current, 'currency:catalyst-fertile').unavailableReason, /已腐化/)
  assert.equal(currency(current, 'currency:catalyst-tainted').canApply, true)
  const tainted = applyManualCurrency(dataset, current, 'currency:catalyst-tainted')
  assert.ok(tainted.session.state.catalystQuality.amount >= 1 && tainted.session.state.catalystQuality.amount <= 20)
  tainted.session.state.mirrored = true
  assert.match(currency(tainted.session, 'currency:catalyst-tainted').unavailableReason, /镜像/)
})

test('催化品质参与历史、重置与希内科拉确定性预见', () => {
  let current = session(40)
  current = applyManualCurrency(dataset, current, 'currency:transmutation').session
  current = applyManualBeastcraft(dataset, current, 'apply-hinekora-lock').session
  const preview = previewManualCurrency(dataset, current, 'currency:catalyst-fertile')
  const applied = applyManualCurrency(dataset, current, 'currency:catalyst-fertile')
  assert.deepEqual(applied.session.state, preview.state)
  assert.deepEqual(redoManualAction(dataset, undoManualAction(dataset, applied.session).session).session.state, applied.session.state)
  assert.deepEqual(resetManualSession(dataset, applied.session).session.state.catalystQuality, { type: null, amount: 0 })
})

test('催化品质在 3.29 分裂化石破裂后保留并由拓印恢复', () => {
  let fracturedSource = session(45)
  fracturedSource = applyManualCurrency(dataset, fracturedSource, 'currency:alchemy').session
  fracturedSource = applyManualCurrency(dataset, fracturedSource, 'currency:catalyst-fertile').session
  const fractured = applyManualFossils(dataset, fracturedSource, { sockets: 1, fossilIds: ['fractured'] })
  assert.equal(fractured.session.state.catalystQuality.type, 'life-mana')
  assert.equal([...fractured.session.state.prefixes, ...fractured.session.state.suffixes].filter((entry) => entry.fractured).length, 1)

  let imprinted = session(46)
  imprinted = applyManualCurrency(dataset, imprinted, 'currency:transmutation').session
  imprinted = applyManualCurrency(dataset, imprinted, 'currency:catalyst-fertile').session
  imprinted = applyManualBeastcraft(dataset, imprinted, 'create-imprint').session
  const originalQuality = structuredClone(imprinted.state.catalystQuality)
  imprinted = applyManualCurrency(dataset, imprinted, 'currency:catalyst-intrinsic').session
  assert.notDeepEqual(imprinted.state.catalystQuality, originalQuality)
  const restored = applyManualBeastcraft(dataset, imprinted, 'restore-imprint')
  assert.deepEqual(restored.session.state.catalystQuality, originalQuality)
})

test('催化品质不改变相同种子下词缀生成且制作后不会被消耗', () => {
  const plain = session(50)
  const quality = session(50)
  quality.state.catalystQuality = { type: 'life-mana', amount: 20 }
  const plainRare = applyManualCurrency(dataset, plain, 'currency:alchemy').session
  const qualityRare = applyManualCurrency(dataset, quality, 'currency:alchemy').session
  assert.deepEqual(qualityRare.state.prefixes, plainRare.state.prefixes)
  assert.deepEqual(qualityRare.state.suffixes, plainRare.state.suffixes)
  assert.deepEqual(qualityRare.state.catalystQuality, { type: 'life-mana', amount: 20 })
})
