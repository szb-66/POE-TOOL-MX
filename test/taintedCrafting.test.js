import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  applyManualBenchCraft, applyManualCurrency, createManualSession, inspectManualCurrencies,
  listManualBenchCrafts, redoManualAction, resetManualSession, undoManualAction
} from '../electron/modules/crafting/manualCrafting.js'
import { normalizeCraftingDataset } from '../electron/modules/crafting/model.js'

const dataset = normalizeCraftingDataset(JSON.parse(await readFile(path.resolve('electron/assets/crafting-data/dataset.json'), 'utf8')))
const body = dataset.bases.find((base) => base.itemClass === 'BodyArmour' && base.socketLimit === 6 && base.requiredLevel <= 1)
assert.ok(body)

function session(seed = 71, itemLevel = 1) {
  const current = createManualSession(dataset, { baseId: body.id, itemLevel, variant: { kind: 'normal' }, seed })
  current.state.corrupted = true
  return current
}

test('腐化装备启用三种污秽孔位通货，未知概率项保留准确禁用原因', () => {
  const items = inspectManualCurrencies(dataset, session())
  for (const id of ['currency:tainted-chromatic', 'currency:tainted-jewellers']) assert.equal(items.find((entry) => entry.id === id).canApply, true)
  assert.equal(items.find((entry) => entry.id === 'currency:tainted-fusing').canApply, false)
  for (const id of ['currency:tainted-armourers-scrap', 'currency:tainted-exalted', 'currency:tainted-chaos', 'currency:tainted-divine-teardrop', 'currency:tainted-mythic']) {
    const item = items.find((entry) => entry.id === id)
    assert.equal(item.canApply, false)
    assert.match(item.unavailableReason, /暂不|无法准确/)
  }
  const uncorrupted = session(); uncorrupted.state.corrupted = false
  assert.match(inspectManualCurrencies(dataset, uncorrupted).find((entry) => entry.id === 'currency:tainted-chromatic').unavailableReason, /已腐化/)
})

test('污秽孔位动作写入成本和历史并支持撤销重做重置', () => {
  const initial = session(72, 100)
  const coloured = applyManualCurrency(dataset, initial, 'currency:tainted-chromatic')
  assert.deepEqual(coloured.event.costs, [{ resourceId: 'currency:tainted-chromatic', resourceName: '污秽幻色石', amount: 1 }])
  const socketed = applyManualCurrency(dataset, coloured.session, 'currency:tainted-jewellers')
  assert.notEqual(socketed.session.state.sockets.length, coloured.session.state.sockets.length)
  const undone = undoManualAction(dataset, socketed.session)
  assert.deepEqual(undone.session.state, coloured.session.state)
  assert.deepEqual(redoManualAction(dataset, undone.session).session.state, socketed.session.state)
  assert.deepEqual(resetManualSession(dataset, socketed.session).session.state, socketed.session.initialState)
})

test('腐化工艺台忽略物品等级设置六孔并以双成本设置六连', () => {
  let current = session(73, 1)
  const catalog = listManualBenchCrafts(dataset, current)
  const sixSockets = catalog.items.find((entry) => entry.id === 'corrupted-bench:sockets:6')
  assert.equal(sixSockets.canApply, true)
  assert.deepEqual(sixSockets.cost.map((entry) => entry.amount), [350, 350])
  const socketed = applyManualBenchCraft(dataset, current, sixSockets.id)
  assert.equal(socketed.session.state.sockets.length, 6)
  const sixLinks = socketed.benchCrafts.items.find((entry) => entry.id === 'corrupted-bench:links:6')
  assert.equal(sixLinks.canApply, true)
  assert.deepEqual(sixLinks.cost.map((entry) => entry.amount), [1500, 1500])
  const linked = applyManualBenchCraft(dataset, socketed.session, sixLinks.id)
  assert.equal(Math.max(...linked.session.state.links.map((group) => group.length)), 6)
  assert.deepEqual(linked.event.costs, sixLinks.cost)
  assert.deepEqual(undoManualAction(dataset, linked.session).session.state, socketed.session.state)
})

test('腐化定色保证配方颜色且不改变孔数和连接', () => {
  let current = applyManualBenchCraft(dataset, session(74, 1), 'corrupted-bench:sockets:6').session
  current = applyManualBenchCraft(dataset, current, 'corrupted-bench:links:6').session
  const links = structuredClone(current.state.links)
  const result = applyManualBenchCraft(dataset, current, 'corrupted-bench:colours:2b1r')
  assert.deepEqual(result.session.state.sockets.slice(0, 3).map((socket) => socket.color), ['B', 'B', 'R'])
  assert.equal(result.session.state.sockets.length, 6)
  assert.deepEqual(result.session.state.links, links)
})
