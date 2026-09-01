import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CONFIGURATION_ACTIONS,
  collectAllflameReceiverConfigurationIssues,
  collectBagConfigurationIssues,
  collectCombatConfigurationIssues,
  collectCraftingConfigurationIssues,
  collectJunfengConfigurationIssues,
  collectMapConfigurationIssues,
  collectPriceCheckConfigurationIssues,
  collectPuzzleConfigurationIssues,
  collectShopConfigurationIssues,
  collectStashPickupConfigurationIssues,
  createConfigurationCheck,
  createConfigurationIssue,
  suspectedCurrencyIssue
} from '../src/domains/configurationGuide/configurationIssues.js'

const point = { x: 100, y: 200 }
const region = { left: 10, top: 10, right: 110, bottom: 110 }
const grid = { startPos: point, slotSize: { w: 40, h: 40 } }
const templates = {
  stashTitle: 'stash.png', inventoryTitle: 'inventory.png', junfengRewardTitle: 'reward.png', allflameReceiverTitle: 'receiver.png',
  stashRegion: region, inventoryRegion: region, junfengRewardRegion: region, allflameReceiverRegion: region
}

function ids(result) { return result.issues.map(issue => issue.id) }

test('配置问题只保留白名单字段并去重，强制 suspect 覆盖同一问题', () => {
  const base = createConfigurationIssue({
    id: 'currency.wisdom', moduleId: 'items', actionId: 'start', kind: 'coordinate',
    title: '知识卷轴坐标', message: '缺失', editorId: 'currency.wisdom', password: 'secret'
  })
  assert.equal(Object.hasOwn(base, 'password'), false)
  const result = createConfigurationCheck([base], {
    forcedIssues: [suspectedCurrencyIssue('items', 'start', 'wisdom')]
  })
  assert.equal(result.issues.length, 1)
  assert.equal(result.issues[0].state, 'suspect')
  assert.deepEqual(result.errors, ['请重新抓取知识卷轴坐标后再重试'])
})

test('改造制作使用完整 preflight 清单而不是旧的部分坐标校验', () => {
  const result = collectCraftingConfigurationIssues({
    itemPosition: point,
    currencyPositions: {},
    stashTabSelection: { enabled: false },
    preset: {
      moduleTwo: {
        enabled: true, mode: 'alteration', enableAugmentation: true, enableRegal: true,
        affixGroups: [{ enabled: true, selectedAffixes: ['生命'] }]
      },
      moduleThree: { enabled: false },
      moduleEldritch: { enabled: false }
    }
  })
  assert.deepEqual(ids(result).filter(id => id.startsWith('currency.')), [
    'currency.wisdom', 'currency.transmutation', 'currency.scouring',
    'currency.alteration', 'currency.augmentation', 'currency.regal'
  ])
})

test('背包批量制作只要求本地扫描、类别和候选，不要求账号角色或赛季', () => {
  const base = {
    inventory: grid,
    currencyPositions: { wisdom: point, transmutation: point, scouring: point, alteration: point },
    stashTabSelection: { enabled: false },
    preset: {
      batchCrafting: { enabled: true, categoryIds: ['ring'] },
      moduleTwo: { enabled: true, mode: 'alteration', affixGroups: [{ enabled: true, selectedAffixes: ['生命'] }] },
      moduleThree: { enabled: false }, moduleEldritch: { enabled: false }
    }
  }
  assert.deepEqual(ids(collectCraftingConfigurationIssues(base)).slice(0, 1), ['preset.items.batch-scan'])
  const ready = collectCraftingConfigurationIssues({
    ...base,
    authenticated: false,
    league: '',
    batchSnapshot: { scanId: 'scan-1' },
    batchCandidateCount: 1
  })
  assert.equal(ready.ok, true)
  assert.doesNotMatch(ready.errors.join(' '), /账号|角色|赛季/)

  const missingCategory = collectCraftingConfigurationIssues({
    ...base,
    batchSnapshot: { scanId: 'scan-1' },
    preset: { ...base.preset, batchCrafting: { enabled: true, categoryIds: [] } }
  })
  const categoryIssue = missingCategory.issues.find(issue => issue.id === 'preset.items.batch-categories')
  assert.equal(categoryIssue.editorId, 'preset.items.batch-categories')
})

test('地图问题包含背包网格、完整通货和已启用仓库选择', () => {
  const result = collectMapConfigurationIssues({
    mapConfig: { method: 'chaos', vaal: { enabled: true } },
    inventory: { startPos: { x: 0, y: 0 }, slotSize: { w: 0, h: 0 } },
    currencyPositions: {},
    stashTabSelection: { enabled: true, rootRegion: null }
  })
  assert.deepEqual(ids(result), [
    'inventory.grid', 'currency.wisdom', 'currency.scouring', 'currency.alchemy',
    'currency.chaos', 'currency.vaal', 'stash-tab.currency'
  ])
})

test('背包、仓库拾取与君锋按各自真实配置列出问题', () => {
  assert.deepEqual(ids(collectBagConfigurationIssues({ templates: {}, inventory: {} })), [
    'template.stash-title', 'template.inventory-title', 'inventory.grid'
  ])
  assert.deepEqual(ids(collectAllflameReceiverConfigurationIssues({ templates: {}, inventory: {} })), [
    'template.allflame-receiver-title', 'template.inventory-title', 'inventory.grid'
  ])
  assert.equal(collectAllflameReceiverConfigurationIssues({ templates, inventory: grid }).ok, true)
  assert.deepEqual(ids(collectStashPickupConfigurationIssues({ templates, calibration: {} })), ['stash-grid.any'])
  assert.deepEqual(ids(collectJunfengConfigurationIssues({ templates, gridRegion: null })), ['junfeng.grid'])
  assert.equal(collectBagConfigurationIssues({ templates, inventory: grid }).ok, true)
})

test('战斗 collector 按当前动作区分坐标、按键与选择项', () => {
  const config = {
    potion: {
      health: { enabled: true, point: { x: 0, y: 0 }, keys: [] },
      mana: { enabled: false, point, keys: ['2'] }
    },
    loop: { items: [] },
    portal: { openKey: '', clickPoint: { x: 0, y: 0 } }
  }
  assert.deepEqual(ids(collectCombatConfigurationIssues({ actionId: CONFIGURATION_ACTIONS.potion, config })), [
    'combat.potion.health.position', 'combat.potion.health.keys'
  ])
  assert.deepEqual(ids(collectCombatConfigurationIssues({ actionId: CONFIGURATION_ACTIONS.loop, config })), ['combat.loop.items'])
  assert.deepEqual(ids(collectCombatConfigurationIssues({ actionId: CONFIGURATION_ACTIONS.portal, config })), [
    'combat.portal.key', 'combat.portal.position'
  ])
})

test('商店要求账号赛季仓库页模板与选中页校准，查价不要求快捷键', () => {
  const shop = collectShopConfigurationIssues({ authenticated: false, league: '', selectedTabs: [], templates: {} })
  assert.deepEqual(ids(shop), [
    'account.poe-cn', 'account.league', 'template.stash-title',
    'template.inventory-title', 'shop.stash-tabs'
  ])
  const calibrated = collectShopConfigurationIssues({
    authenticated: true, league: 'S1', selectedTabs: [{ id: '1' }], missingCalibrations: ['folder'], templates
  })
  assert.deepEqual(ids(calibrated), ['stash-grid.folder'])
  assert.equal(collectPriceCheckConfigurationIssues({ authenticated: true, league: 'S1', shortcut: '' }).ok, true)
})

test('拼图只把当前动作需要的区域和页签当作配置问题', () => {
  const metadata = {
    displayId: '1', scaleFactor: 1,
    displayPhysicalBounds: { x: 0, y: 0, width: 1920, height: 1080 },
    selectedRegion: { left: 100, top: 200, right: 700, bottom: 1000 }
  }
  assert.deepEqual(ids(collectPuzzleConfigurationIssues({ actionId: CONFIGURATION_ACTIONS.analyze })), ['puzzle.inventory-region'])
  assert.deepEqual(ids(collectPuzzleConfigurationIssues({ actionId: CONFIGURATION_ACTIONS.border })), ['puzzle.atlas-region'])
  const auto = collectPuzzleConfigurationIssues({
    actionId: CONFIGURATION_ACTIONS.autoPlace,
    inventoryRegionMetadata: metadata,
    atlasRegionMetadata: { ...metadata, selectedRegion: { left: 800, top: 300, right: 1100, bottom: 600 } },
    sourcePages: [1, 2], inventoryTabPoints: {}
  })
  assert.deepEqual(ids(auto), ['puzzle.tab.1', 'puzzle.tab.2'])
})
