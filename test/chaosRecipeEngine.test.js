import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateVendorRecipes,
  calculateChaosRecipe,
  classifySocketRecipe,
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

test('机会、混沌和富豪套装按最低物等独立计算', () => {
  const chance = fullSet({ lowSlot: 'helmet' }).map((entry, index) => ({
    ...entry,
    itemLevel: index === 0 ? 59 : 80
  }))
  const chaos = fullSet({ lowSlot: 'helmet', tabId: 'chaos' })
  const regal = fullSet({ lowSlot: 'none', tabId: 'regal' })
  const recipes = calculateVendorRecipes([...chance, ...chaos, ...regal]).recipes

  assert.equal(recipes.chance.fullSetCount, 1)
  assert.equal(recipes.chaos.fullSetCount, 1)
  assert.equal(recipes.regal.fullSetCount, 2)
  assert.equal(recipes.chance.rewardTotal, 2)
})

test('插槽配方按六连、六孔、三色顺序唯一归类并保护套装', () => {
  const sockets = (groups, colours) => colours.map((sColour, index) => ({
    group: groups[index], sColour, attr: ''
  }))
  const linked = item('bodyArmour', 70, { sockets: sockets([0, 0, 0, 0, 0, 0], ['R', 'G', 'B', 'R', 'G', 'B']) })
  const sixSocket = item('helmet', 70, { sockets: sockets([0, 0, 0, 1, 1, 1], ['R', 'G', 'B', 'R', 'G', 'B']) })
  const chromatic = item('gloves', 70, { sockets: sockets([0, 0, 0], ['B', 'R', 'G']) })
  const recipes = calculateVendorRecipes([...fullSet(), linked, sixSocket, chromatic]).recipes

  assert.equal(classifySocketRecipe(linked), 'fusing')
  assert.equal(classifySocketRecipe(sixSocket), 'jeweller')
  assert.equal(classifySocketRecipe(chromatic), 'chromatic')
  assert.deepEqual([
    recipes.fusing.candidateCount,
    recipes.jeweller.candidateCount,
    recipes.chromatic.candidateCount
  ], [1, 1, 1])
  assert.ok(recipes.chaos.candidates.every((entry) => ![linked.id, sixSocket.id, chromatic.id].includes(entry.id)))
})

test('经典势力装备只参与共享势力崇高套装', () => {
  const shaperSet = fullSet({ lowSlot: 'none' }).map((entry) => ({
    ...entry,
    influences: ['shaper']
  }))
  const recipes = calculateVendorRecipes(shaperSet).recipes
  assert.equal(recipes.exalted.fullSetCount, 1)
  assert.equal(recipes.exalted.rewardTotal, 2)
  assert.equal(recipes.regal.fullSetCount, 0)
  assert.equal(recipes.chaos.fullSetCount, 0)
  assert.equal(new Set(recipes.exalted.sets.flatMap((set) => set.items.map((entry) => entry.id))).size, 9)
})

test('崇高套装支持六种经典势力且不会重复分配双势力物品', () => {
  const influences = ['shaper', 'elder', 'crusader', 'redeemer', 'hunter', 'warlord']
  const values = influences.flatMap((influence, index) =>
    fullSet({ lowSlot: 'none', tabId: influence, tabIndex: index }).map((entry) => ({
      ...entry,
      influences: [influence]
    }))
  )
  values[0].influences = ['shaper', 'elder']
  const exalted = calculateVendorRecipes(values).recipes.exalted
  const selectedIds = exalted.sets.flatMap((set) => set.items.map((entry) => entry.id))

  assert.equal(exalted.fullSetCount, 6)
  assert.equal(new Set(selectedIds).size, selectedIds.length)
  assert.deepEqual(new Set(exalted.sets.map((set) => set.influence)), new Set(influences))
})

test('允许已鉴定后混合完整套装奖励降为一个', () => {
  const values = fullSet().map((entry, index) => ({ ...entry, identified: index === 0 }))
  assert.equal(calculateVendorRecipes(values).recipes.chaos.fullSetCount, 0)
  const chaos = calculateVendorRecipes(values, { includeIdentified: true }).recipes.chaos
  assert.equal(chaos.fullSetCount, 1)
  assert.equal(chaos.rewardTotal, 1)
})

test('单件取件计划只包含选中的候选', () => {
  const sockets = ['R', 'G', 'B'].map((sColour) => ({ group: 0, sColour, attr: '' }))
  const first = item('helmet', 10, { sockets })
  const second = item('gloves', 10, { sockets, tabId: 'tab-2', tabIndex: 1 })
  const snapshot = calculateVendorRecipes([first, second])
  const plan = createPickingPlan(snapshot, { recipeId: 'chromatic', itemIds: [second.id] })

  assert.equal(plan.recipeId, 'chromatic')
  assert.equal(plan.selectedItemCount, 1)
  assert.equal(plan.tabs[0].items[0].id, second.id)
  assert.equal(plan.tabs[0].items[0].verificationKind, 'socket')
})
