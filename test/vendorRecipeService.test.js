import test from 'node:test'
import assert from 'node:assert/strict'
import { ChaosRecipeService } from '../electron/modules/chaosRecipe/service.js'

const tab = {
  id: 'tab-1',
  index: 0,
  name: '商店配方',
  type: 'normal',
  columns: 12,
  supported: true,
  inFolder: false
}

const socketItem = {
  id: 'rgb-item',
  tabId: tab.id,
  tabIndex: 0,
  tabName: tab.name,
  tabType: 'normal',
  inFolder: false,
  x: 1,
  y: 2,
  width: 1,
  height: 1,
  itemLevel: 10,
  frameType: 0,
  rarity: 'normal',
  identified: true,
  itemClass: 'helmet',
  name: '',
  baseType: '测试头盔',
  typeLine: '测试头盔',
  sockets: ['R', 'G', 'B'].map((sColour) => ({ group: 0, attr: '', sColour })),
  influences: []
}

function service() {
  return new ChaosRecipeService({
    auth: { getStatus: () => ({ authenticated: true }) },
    stashClient: { clearCache() {} },
    overlay: { close() {} }
  })
}

test('统一服务创建预览计划不改变计数，实际消费物品后才重算结果', () => {
  const instance = service()
  const snapshot = instance.setSnapshot({
    league: '测试赛季',
    results: [{ tab, items: [socketItem], diagnostics: { sourceArrayLength: 1 } }],
    availableTabs: [tab],
    includeIdentified: false
  })
  assert.equal(snapshot.recipes.chromatic.candidateCount, 1)
  assert.equal(snapshot.items.length, 1)
  assert.equal(snapshot.fullSetCount, snapshot.recipes.chaos.fullSetCount)
  const snapshotBeforePreview = structuredClone(instance.snapshot)

  const plan = instance.createPlan({
    recipeId: 'chromatic',
    itemIds: ['rgb-item'],
    calibration: { root: { left: 0, top: 0, right: 1200, bottom: 1200 } }
  })
  assert.equal(plan.recipeId, 'chromatic')
  assert.equal(plan.itemCount, 1)
  assert.equal(plan.tabs[0].items[0].screen.clickX, 150)
  assert.deepEqual(instance.snapshot, snapshotBeforePreview)

  instance.consumeItem('rgb-item')
  assert.equal(instance.snapshot.items.length, 0)
  assert.equal(instance.snapshot.recipes.chromatic.candidateCount, 0)
})

test('刷新仓库先清除旧自动化断点，再请求接口并生成新快照', async () => {
  const order = []
  const instance = new ChaosRecipeService({
    auth: { getStatus: () => ({ authenticated: true }), registerCacheClearer() {} },
    automation: { reset: reason => order.push(`reset:${reason}`) },
    stashClient: {
      clearCache() {},
      async fetchTabs() {
        order.push('fetch')
        return [{ tab, items: [socketItem], diagnostics: { sourceArrayLength: 1 } }]
      },
      getTabsSnapshot: () => [tab]
    },
    overlay: { close() {} }
  })

  const snapshot = await instance.refresh({
    league: '测试赛季',
    selectedTabIds: [tab.id],
    includeIdentified: false
  })
  assert.deepEqual(order, ['reset:refresh', 'fetch'])
  assert.equal(snapshot.recipes.chromatic.candidateCount, 1)
})
