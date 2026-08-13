import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildItemFootprintCatalog,
  parseRepoeVersion,
  validateItemFootprintCatalog
} from '../scripts/generateItemFootprints.js'

const base = (name, itemClass, width, height, releaseState = 'released') => ({
  name,
  item_class: itemClass,
  inventory_width: width,
  inventory_height: height,
  release_state: releaseState
})

function fixture(overrides = {}) {
  return {
    gameVersion: '3.29',
    repoeVersion: '3.29.3.1.2',
    generatedAt: '2026-08-13T00:00:00.000Z',
    expectedCraftingBases: 3,
    sources: [{ id: 'fixture', version: '3.29', sha256: 'a'.repeat(64) }],
    craftingDataset: {
      manifest: { patch: '3.29' },
      bases: [
        { sourceId: 'Crude_Bow', itemClass: 'Bow', name: '粗制弓' },
        { sourceId: 'Long_Bow', itemClass: 'Bow', name: '长弓' },
        { sourceId: 'Maelstr%C3%B6m_Staff', itemClass: 'Staff', name: '朽木之干' }
      ]
    },
    repoeBaseItems: {
      'Metadata/Bow1': base('Crude Bow', 'Bow', 2, 3),
      'Metadata/Bow2': base('Long Bow', 'Bow', 2, 4),
      'Metadata/Staff1': base('Maelström Staff', 'Staff', 1, 4),
      'Metadata/Map1': base('Beach Map', 'Map', 1, 1),
      'Metadata/Map2': base('Dunes Map', 'Map', 1, 1),
      'Metadata/CurrencyA': base('Large Token', 'StackableCurrency', 1, 1),
      'Metadata/CurrencyB': base('Large Token Copy', 'StackableCurrency', 2, 2)
    },
    localizedBaseItems: {
      'Metadata/Bow1': base('粗製弓', 'Bow', 2, 3),
      'Metadata/Bow2': base('長弓', 'Bow', 2, 4),
      'Metadata/Staff1': base('朽木之幹', 'Staff', 1, 4),
      'Metadata/Map1': base('濱海地圖', 'Map', 1, 1),
      'Metadata/CurrencyA': base('歧義通貨', 'StackableCurrency', 1, 1),
      'Metadata/CurrencyB': base('歧義通貨', 'StackableCurrency', 2, 2)
    },
    localizedItemClasses: {
      Bow: { name: '弓', category: '弓', category_id: 'Bow' },
      Staff: { name: '長杖', category: '長杖', category_id: 'Staff' },
      Map: { name: '地圖', category: '地圖', category_id: 'Map' },
      StackableCurrency: { name: '通貨', category: '通貨', category_id: 'Currency' }
    },
    officialItemsPayload: {
      result: [{ entries: [
        { type: '粗制弓' }, { type: '长弓' }, { type: '朽木之干' },
        { type: '滨海地图' }, { type: '歧义通货' }
      ] }]
    },
    toSimplified: (value) => String(value || '')
      .replaceAll('製', '制').replaceAll('長', '长').replaceAll('幹', '干')
      .replaceAll('濱', '滨').replaceAll('圖', '图').replaceAll('義', '义'),
    ...overrides
  }
}

test('解析并校验 RePoE 3.29 版本', () => {
  assert.equal(parseRepoeVersion('<title>RePoE - PoE version 3.29.3.1.2</title>'), '3.29.3.1.2')
  assert.throws(() => parseRepoeVersion('<title>RePoE</title>'), /无法识别/)
})

test('生成器优先关联做装 ID，补充官方交集并剔除歧义尺寸', () => {
  const catalog = buildItemFootprintCatalog(fixture())
  assert.equal(catalog.audit.craftingResolved, 3)
  assert.ok(catalog.items.some((entry) => entry.name === '粗制弓' && entry.width === 2 && entry.height === 3))
  assert.ok(catalog.items.some((entry) => entry.name === '长弓' && entry.width === 2 && entry.height === 4))
  assert.ok(catalog.items.some((entry) => entry.name === '朽木之干' && entry.width === 1 && entry.height === 4))
  assert.ok(catalog.items.some((entry) => entry.name === '滨海地图' && entry.width === 1 && entry.height === 1))
  assert.equal(catalog.items.some((entry) => entry.name === '歧义通货'), false)
  const aliases = catalog.categories.flatMap((entry) => entry.aliases)
  assert.ok(aliases.includes('地图'))
  assert.equal(aliases.includes('弓'), false)
  assert.equal(aliases.includes('长杖'), true)
})

test('生成器拒绝版本错配、做装缺项和最终目录重复身份', () => {
  assert.throws(() => buildItemFootprintCatalog(fixture({ repoeVersion: '3.28.0.16' })), /RePoE 与目标游戏版本不一致/)
  assert.throws(() => buildItemFootprintCatalog(fixture({ expectedCraftingBases: 4 })), /做装基底数量异常/)
  const catalog = buildItemFootprintCatalog(fixture())
  catalog.items.push({ ...catalog.items[0] })
  assert.throws(() => validateItemFootprintCatalog(catalog, 3), /重复物品占位/)
})
