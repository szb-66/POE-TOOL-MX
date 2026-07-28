import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateChaosRecipe,
  createPickingPlan,
  filterChaosCandidates,
  summarizeChaosItemPipeline
} from '../electron/modules/chaosRecipe/engine.js'

let serial = 0
const item = (itemClass, itemLevel = 80, extra = {}) => ({
  id: `item-${++serial}`,
  itemClass,
  itemLevel,
  frameType: 2,
  rarity: 'rare',
  identified: false,
  tabId: extra.tabId || 'tab-1',
  tabIndex: extra.tabIndex || 0,
  tabName: extra.tabName || '配方',
  tabType: extra.tabType || 'normal',
  x: extra.x || 0,
  y: extra.y || 0,
  width: 1,
  height: 1,
  baseType: `${itemClass}-${serial}`,
  ...extra
})

function fullSet({ weapon = 'twoHandWeapon', lowSlot = 'helmet', tabId = 'tab-1', tabIndex = 0 } = {}) {
  const values = [
    item('bodyArmour', lowSlot === 'bodyArmour' ? 70 : 80, { tabId, tabIndex }),
    item('helmet', lowSlot === 'helmet' ? 70 : 80, { tabId, tabIndex }),
    item('gloves', lowSlot === 'gloves' ? 70 : 80, { tabId, tabIndex }),
    item('boots', lowSlot === 'boots' ? 70 : 80, { tabId, tabIndex }),
    item('belt', lowSlot === 'belt' ? 70 : 80, { tabId, tabIndex }),
    item('amulet', lowSlot === 'amulet' ? 70 : 80, { tabId, tabIndex }),
    item('ring', lowSlot === 'ring' ? 70 : 80, { tabId, tabIndex }),
    item('ring', 80, { tabId, tabIndex })
  ]
  if (weapon === 'twoHandWeapon') values.push(item('twoHandWeapon', lowSlot === 'weapon' ? 70 : 80, { tabId, tabIndex }))
  else {
    values.push(item('oneHandWeapon', lowSlot === 'weapon' ? 70 : 80, { tabId, tabIndex }))
    values.push(item('oneHandWeapon', 80, { tabId, tabIndex }))
  }
  return values
}

test('默认排除已鉴定、非稀有和低等级装备', () => {
  const values = [
    item('helmet', 70),
    item('helmet', 70, { identified: true }),
    item('helmet', 70, { frameType: 1, rarity: 'magic' }),
    item('helmet', 59)
  ]
  assert.equal(filterChaosCandidates(values).length, 1)
  assert.equal(filterChaosCandidates(values, { includeIdentified: true }).length, 2)
})

test('诊断统计区分未读取、未识别和被鉴定规则排除', () => {
  const items = [
    item('ring', 68, { identified: true }),
    item(null, 70),
    item('helmet', 72)
  ]
  const summary = summarizeChaosItemPipeline(items, { includeIdentified: false })
  assert.deepEqual(summary, {
    receivedItemCount: 3,
    recognizedItemCount: 2,
    rareItemCount: 3,
    level60ItemCount: 3,
    rareLevel60EquipmentCount: 2,
    identifiedExcludedCount: 1,
    unrecognizedRareLevel60Count: 1,
    eligibleItemCount: 1
  })
})

test('一件双手武器或两件一手武器均可组成配方', () => {
  assert.equal(calculateChaosRecipe(fullSet()).fullSetCount, 1)
  assert.equal(calculateChaosRecipe(fullSet({ weapon: 'oneHandWeapon' })).fullSetCount, 1)
})

test('纯 75+ 完整套装不会误报为混沌配方', () => {
  const snapshot = calculateChaosRecipe(fullSet({ lowSlot: 'none' }))
  assert.equal(snapshot.fullSetCount, 0)
  assert.equal(snapshot.needsLowLevel, true)
  assert.equal(snapshot.missing.lowLevel, 1)
})

test('多套计算为每套保留至少一件 60-74 装备', () => {
  const snapshot = calculateChaosRecipe([
    ...fullSet({ lowSlot: 'helmet' }),
    ...fullSet({ lowSlot: 'ring', weapon: 'oneHandWeapon', tabId: 'tab-2', tabIndex: 1 })
  ])
  assert.equal(snapshot.fullSetCount, 2)
  assert.ok(snapshot.sets.every((set) => set.items.some((entry) => entry.itemLevel <= 74)))
  assert.equal(snapshot.rewardTotal, 4)
})

test('取件计划按仓库页分组并保留套装身份', () => {
  const snapshot = calculateChaosRecipe([
    ...fullSet({ lowSlot: 'helmet' }),
    ...fullSet({ lowSlot: 'ring', tabId: 'tab-2', tabIndex: 1 })
  ])
  const plan = createPickingPlan(snapshot, 2)
  assert.equal(plan.setCount, 2)
  assert.equal(plan.tabs.length, 2)
  assert.ok(plan.tabs.flatMap((tab) => tab.items).every((entry) => entry.setId))
})

test('取件计划保留仓库页的文件夹属性', () => {
  const snapshot = calculateChaosRecipe(fullSet({
    lowSlot: 'helmet',
    tabId: 'folder-tab'
  }).map((entry) => ({ ...entry, inFolder: true })))
  const plan = createPickingPlan(snapshot, 1)

  assert.equal(plan.tabs[0].inFolder, true)
  assert.ok(plan.tabs[0].items.every((entry) => entry.inFolder))
})
