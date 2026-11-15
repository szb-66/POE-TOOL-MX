import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildInternationalItemFootprints } from '../scripts/generateInternationalItemFootprints.js'
import { ItemFootprintRegistry, configureItemFootprintRegistry, loadServerFootprintCatalog, itemFootprintRegistry } from '../electron/modules/items/footprintRegistry.js'

const sources = [{ id: 'repo', sha256: 'a'.repeat(64) }, { id: 'official', sha256: 'b'.repeat(64) }]
const base = (name, width, height) => ({ name, inventory_width: width, inventory_height: height, release_state: 'released' })

test('国际服仅复用官方当前名称与真实旧尺寸的无歧义交集，新类型不猜', () => {
  const catalog = buildInternationalItemFootprints({ gameVersion: '3.30.0', repoeVersion: '3.29.3.6', sources,
    baseItems: { a: base('Known Item', 2, 3), b: base('Conflict', 1, 1), c: base('Conflict', 2, 1), d: base('Absent Item', 1, 1) },
    officialCatalog: { manifest: { server: 'international' }, locale: 'en', items: [
      { baseType: 'Known Item' }, { baseType: 'Conflict' }, { baseType: 'New Thread' }
    ] } })
  assert.equal(catalog.dimensionSourceVersion, '3.29.3.6')
  assert.equal(catalog.compatibilityMode, 'known-items-only')
  assert.deepEqual(catalog.items.map(item => item.name), ['Known Item'])
  assert.equal(catalog.audit.ambiguousNames, 1)
  assert.equal(catalog.audit.unknownNames, 2)
  assert.deepEqual(catalog.categories, [])
  const registry = new ItemFootprintRegistry(catalog)
  assert.equal(registry.resolve('Currency', 'New Thread'), null)
  assert.equal(registry.resolve('Currency', 'Absent Item'), null)
})

test('国际服拒绝错误服务器目录和伪造来源版本', () => {
  const options = { gameVersion: '3.30.0', repoeVersion: '3.29.3.6', sources, baseItems: {}, officialCatalog: { manifest: { server: 'cn' }, locale: 'zh-CN', items: [] } }
  assert.throws(() => buildInternationalItemFootprints(options), /独立国际服官方英文目录/)
  assert.throws(() => buildInternationalItemFootprints({ ...options, repoeVersion: '' }), /真实尺寸来源版本/)
  assert.throws(() => buildInternationalItemFootprints({ ...options, gameVersion: 'live' }), /3.30.0/)
})

test('本服 API 实际尺寸优先于兼容旧尺寸，两次API冲突仍安全拒绝', () => {
  const registry = new ItemFootprintRegistry({ schemaVersion: 1, compatibilityMode: 'known-items-only', categories: [], items: [{ name: 'Known Item', width: 1, height: 1 }] })
  registry.registerStashItem({ baseType: 'Known Item', w: 2, h: 3 })
  assert.deepEqual(registry.resolve('', 'Known Item'), { width: 2, height: 3, source: 'stash-api' })
  registry.registerStashItem({ baseType: 'Known Item', w: 2, h: 4 })
  assert.equal(registry.resolve('', 'Known Item'), null)
  registry.registerStashItem({ baseType: 'New Item', w: 2, h: 2 })
  assert.deepEqual(registry.resolve('', 'New Item'), { width: 2, height: 2, source: 'stash-api' })
})

test('按服初始化替换共享目录且错误版本不回退国服', t => {
  t.after(() => configureItemFootprintRegistry({ serverId: 'cn', gameVersion: '3.29' }))
  const international = loadServerFootprintCatalog({ serverId: 'international', gameVersion: '3.30.0' })
  assert.equal(international.gameVersion, '3.30.0')
  assert.equal(international.dimensionSourceVersion, '3.29.3.6')
  assert.ok(international.items.length > 3000)
  configureItemFootprintRegistry({ serverId: 'international', gameVersion: '3.30.0' })
  assert.equal(itemFootprintRegistry.snapshot().strictKnownItems, true)
  assert.deepEqual(itemFootprintRegistry.resolve('', 'Astral Plate'), { width: 2, height: 3, source: 'bundled' })
  assert.equal(itemFootprintRegistry.resolve('', '星芒战铠'), null)
  configureItemFootprintRegistry({ serverId: 'international', gameVersion: '3.31.0' })
  assert.equal(itemFootprintRegistry.resolve('', 'Astral Plate'), null)
  assert.throws(() => configureItemFootprintRegistry({ serverId: 'unknown' }), /无效/)
  const snapshot = JSON.parse(readFileSync(new URL('../electron/assets/item-footprints.international.json', import.meta.url)))
  assert.equal(snapshot.server, 'international')
  assert.equal(snapshot.categories.length, 0)
})
