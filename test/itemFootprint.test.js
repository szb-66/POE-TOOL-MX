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

test('无类别身份冲突不会清空无关类别兜底', () => {
  const registry = new ItemFootprintRegistry({
    schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION,
    categories: [{ aliases: ['Map', '地图'], width: 1, height: 1 }],
    items: []
  })
  registry.register({ names: ['冲突物品'], width: 1, height: 1 })
  registry.register({ names: ['冲突物品'], width: 2, height: 1 })
  const snapshot = registry.snapshot()
  assert.equal(snapshot.items[createFootprintKey('', '冲突物品')], undefined)
  assert.deepEqual(snapshot.categories[normalizeFootprintText('Map')], {
    key: normalizeFootprintText('Map'), width: 1, height: 1, source: 'bundled'
  })
})

test('内置目录有效且缺失或版本错误时安全回退为空目录', () => {
  const bundled = loadBundledFootprintCatalog()
  assert.equal(bundled.schemaVersion, ITEM_FOOTPRINT_SCHEMA_VERSION)
  assert.equal(bundled.gameVersion, '3.29')
  assert.ok(bundled.audit.craftingResolved > 0)
  assert.ok(bundled.categories.length > 0)
  assert.ok(bundled.items.length > 0)
  assert.deepEqual(loadBundledFootprintCatalog('不存在的目录.json'), {
    schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION, categories: [], items: []
  })
  assert.deepEqual(loadBundledFootprintCatalog(undefined, '3.28'), {
    schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION, categories: [], items: []
  })
})

test('内置目录精确区分混合尺寸基底且只保留安全类别兜底', () => {
  const registry = new ItemFootprintRegistry(loadBundledFootprintCatalog())
  const snapshot = registry.snapshot()
  const assertItem = (name, width, height) => {
    assert.deepEqual(snapshot.items[createFootprintKey('', name)], {
      key: createFootprintKey('', name), width, height, source: 'bundled'
    })
  }

  assertItem('短弓', 2, 3)
  assertItem('长弓', 2, 4)
  assertItem('朽木之干', 1, 4)
  assertItem('粗制长杖', 2, 4)
  assertItem('锈斑巨剑', 1, 4)
  assertItem('双手剑', 2, 4)
  assertItem('混沌石', 1, 1)
  assert.equal(snapshot.categories[normalizeFootprintText('弓')], undefined)
  assert.equal(snapshot.categories[normalizeFootprintText('长杖')], undefined)
  assert.equal(snapshot.categories[normalizeFootprintText('双手剑')], undefined)
  assert.deepEqual(snapshot.categories[normalizeFootprintText('鱼竿')], {
    key: normalizeFootprintText('鱼竿'), width: 1, height: 4, source: 'bundled'
  })
  assert.deepEqual(snapshot.categories[normalizeFootprintText('地图')], {
    key: normalizeFootprintText('地图'), width: 1, height: 1, source: 'bundled'
  })
  assert.deepEqual(snapshot.categories[normalizeFootprintText('技能宝石')], {
    key: normalizeFootprintText('技能宝石'), width: 1, height: 1, source: 'bundled'
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

test('仓库 API 同尺寸合并、异尺寸禁用内置物品身份', () => {
  const registry = new ItemFootprintRegistry({
    schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION,
    categories: [{ aliases: ['Currency', '通货'], width: 1, height: 1 }],
    items: [{ name: '测试通货', width: 1, height: 1 }]
  })
  assert.equal(registry.registerStashItem({ itemClass: 'Currency', baseType: '测试通货', w: 1, h: 1 }), true)
  assert.deepEqual(registry.snapshot().items[createFootprintKey('', '测试通货')], {
    key: createFootprintKey('', '测试通货'), width: 1, height: 1, source: 'stash-api'
  })
  assert.equal(registry.registerStashItem({ itemClass: 'Currency', baseType: '测试通货', w: 2, h: 1 }), true)
  const snapshot = registry.snapshot()
  assert.equal(snapshot.items[createFootprintKey('', '测试通货')], undefined)
  assert.equal(snapshot.items[createFootprintKey('Currency', '测试通货')], undefined)
  assert.equal(snapshot.categories[normalizeFootprintText('Currency')], undefined)
  assert.equal(snapshot.categories[normalizeFootprintText('通货')], undefined)
})

test('自动入库注入冻结目录并由安装包携带目录资源', () => {
  const ipc = readFileSync(new URL('../electron/modules/ipc/bag.js', import.meta.url), 'utf8')
  const packageConfig = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.match(ipc, /structuredClone\(latestConfig\)/)
  assert.match(ipc, /inventory\.itemFootprints = itemFootprintRegistry\.snapshot\(\)/)
  assert.ok(packageConfig.build.files.includes('electron/assets/item-footprints.json'))
})
