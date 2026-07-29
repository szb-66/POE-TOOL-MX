import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  ITEM_FOOTPRINT_SCHEMA_VERSION,
  ItemFootprintRegistry,
  createFootprintKey,
  loadBundledFootprintCatalog,
  normalizeFootprintText
} from '../electron/modules/items/footprintRegistry.js'
import { normalizeStashItem } from '../electron/modules/chaosRecipe/normalizer.js'

test('占位身份统一中文英文空白与 Unicode 宽度', () => {
  assert.equal(normalizeFootprintText('  Body　Armour '), 'body armour')
  assert.equal(createFootprintKey('胸甲', ' 星芒战铠 '), `胸甲\u001f星芒战铠`)
  assert.equal(createFootprintKey('', 'Chaos Orb'), `*\u001fchaos orb`)
})

test('共享目录登记 API 尺寸、冻结快照并隔离后续变更', () => {
  const registry = new ItemFootprintRegistry({
    schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION,
    categories: [],
    items: []
  })
  assert.equal(registry.registerStashItem({
    itemClass: 'Body Armour', baseType: 'Astral Plate', w: 2, h: 3
  }), true)
  const frozen = registry.snapshot()
  assert.deepEqual(frozen.items[createFootprintKey('', 'Astral Plate')], {
    key: createFootprintKey('', 'Astral Plate'), width: 2, height: 3, source: 'stash-api'
  })
  registry.registerStashItem({ itemClass: 'Flask', baseType: 'Granite Flask', w: 1, h: 2 })
  assert.equal(frozen.items[createFootprintKey('', 'Granite Flask')], undefined)
})

test('同类别同基底尺寸冲突后不再输出该身份', () => {
  const registry = new ItemFootprintRegistry({
    schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION,
    categories: [],
    items: []
  })
  registry.register({ categories: ['Shield'], names: ['Test Shield'], width: 2, height: 2 })
  registry.register({ categories: ['Shield'], names: ['Test Shield'], width: 2, height: 3 })
  const snapshot = registry.snapshot()
  assert.equal(snapshot.items[createFootprintKey('Shield', 'Test Shield')], undefined)
  assert.equal(snapshot.items[createFootprintKey('', 'Test Shield')], undefined)
})

test('内置目录有效且缺失或版本错误时安全回退为空目录', () => {
  const bundled = loadBundledFootprintCatalog()
  assert.equal(bundled.schemaVersion, ITEM_FOOTPRINT_SCHEMA_VERSION)
  assert.ok(bundled.categories.length > 0)
  assert.deepEqual(loadBundledFootprintCatalog('不存在的目录.json'), {
    schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION, categories: [], items: []
  })
})

test('仓库归一化登记真实宽高且保留原有字段', () => {
  const item = normalizeStashItem({
    id: 'api-item', x: 1, y: 2, w: 2, h: 4, ilvl: 83,
    frameType: 2, baseType: '测试双手剑', typeLine: '测试双手剑',
    itemClass: 'Two Hand Sword', sockets: [], influences: { shaper: true }
  }, { id: 'tab', index: 0, name: '仓库', type: 'normal' })
  assert.equal(item.width, 2)
  assert.equal(item.height, 4)
  assert.deepEqual(item.influences, ['shaper'])
})

test('自动入库注入冻结目录并由安装包携带目录资源', () => {
  const ipc = readFileSync(new URL('../electron/modules/ipc/bag.js', import.meta.url), 'utf8')
  const packageConfig = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.match(ipc, /structuredClone\(latestConfig\)/)
  assert.match(ipc, /inventory\.itemFootprints = itemFootprintRegistry\.snapshot\(\)/)
  assert.ok(packageConfig.build.files.includes('electron/assets/item-footprints.json'))
})
