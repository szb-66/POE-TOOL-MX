import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CONFIG_BUNDLE_KIND,
  CONFIG_BUNDLE_MAX_BYTES,
  CONFIG_SECTION_DEFINITIONS,
  ConfigTransferError,
  EMPTY_PRESET_GRID,
  allocateImportedName,
  createConfigBundle,
  createImportedPreset,
  createPresetTransferRecord,
  mergeToolSites,
  normalizeToolSiteUrl,
  parseConfigBundle,
  sanitizeTransferValue,
  serializeConfigBundle,
  utf8ByteLength
} from '../src/domains/settings/configTransfer/core.js'

const supportedIds = [
  'preset.item',
  'preset.essence',
  'preset.harvest',
  'preset.map',
  'preset.story',
  'preset.storySkill',
  'settings.toolSites'
]

test('configuration transfer exposes exactly the six presets and tool sites', () => {
  assert.deepEqual(CONFIG_SECTION_DEFINITIONS.map(section => section.id), supportedIds)
})

test('builds and parses a versioned bundle with all compatible sections selected by default', () => {
  const bundle = createConfigBundle({
    appVersion: '1.2.2',
    exportedAt: '2026-08-30T10:00:00.000Z',
    sections: {
      'preset.item': { data: { items: [{ recordKey: 'one', name: '做装', data: {} }] } },
      'settings.toolSites': { data: { sites: [] } }
    }
  })
  assert.equal(bundle.kind, CONFIG_BUNDLE_KIND)
  assert.equal(bundle.formatVersion, 1)
  assert.equal(bundle.sections['preset.item'].schemaVersion, 1)

  const parsed = parseConfigBundle(serializeConfigBundle(bundle))
  assert.deepEqual(parsed.compatibleSectionIds, ['preset.item', 'settings.toolSites'])
  assert.deepEqual(parsed.defaultSelectedSectionIds, ['preset.item', 'settings.toolSites'])
})

test('rejects empty, malformed, future and oversized bundles with stable error codes', () => {
  assert.throws(
    () => createConfigBundle({ sections: {} }),
    error => error instanceof ConfigTransferError && error.code === 'NO_SECTIONS_SELECTED'
  )
  assert.throws(() => parseConfigBundle('{'), error => error.code === 'INVALID_JSON')
  assert.throws(
    () => parseConfigBundle(JSON.stringify({ kind: CONFIG_BUNDLE_KIND, formatVersion: 2, sections: {} })),
    error => error.code === 'FUTURE_FORMAT_VERSION'
  )
  const oversized = '中'.repeat(Math.ceil(CONFIG_BUNDLE_MAX_BYTES / utf8ByteLength('中')) + 1)
  assert.throws(() => parseConfigBundle(oversized), error => error.code === 'FILE_TOO_LARGE')
})

test('old removed sections become unsupported while known future schemas stay isolated', () => {
  const parsed = parseConfigBundle(JSON.stringify({
    kind: CONFIG_BUNDLE_KIND,
    formatVersion: 1,
    appVersion: '1.2.2',
    exportedAt: '2026-08-30T10:00:00.000Z',
    sections: {
      'preset.item': { schemaVersion: 1, data: { items: [] } },
      'preset.map': { schemaVersion: 9, data: { items: [] } },
      'preset.chart': { schemaVersion: 1, data: { items: [] } },
      'settings.automation': { schemaVersion: 1, data: {} }
    }
  }))
  assert.equal(parsed.sections.find(section => section.id === 'preset.item').status, 'compatible')
  assert.equal(parsed.sections.find(section => section.id === 'preset.map').status, 'future')
  assert.equal(parsed.sections.find(section => section.id === 'preset.chart').status, 'unsupported')
  assert.equal(parsed.sections.find(section => section.id === 'settings.automation').status, 'unsupported')
  assert.deepEqual(parsed.defaultSelectedSectionIds, ['preset.item'])
})

test('removes credentials, absolute paths and unsafe object keys from exported values', () => {
  const value = sanitizeTransferValue({
    league: 'S30',
    cookie: 'private',
    sessionToken: 'private',
    backgroundPath: 'C:\\Users\\Someone\\secret.png',
    nested: { safe: true, path: '\\\\server\\share\\template.png', list: ['keep', '/home/player/private', 4] }
  })
  assert.deepEqual(value, { league: 'S30', nested: { safe: true, list: ['keep', 4] } })
})

test('strips map coordinates by default and requires explicit acceptance on import', () => {
  const source = {
    id: 'default',
    name: '地图方案',
    map: {
      method: 'chaos',
      grid: { startX: 100, startY: 200, offsetX: 52, offsetY: 52, rows: 5, cols: 12 }
    }
  }
  const shared = createPresetTransferRecord(source, { dataKey: 'map', recordKeyFactory: () => 'record-1' })
  assert.equal(shared.data.method, 'chaos')
  assert.equal('grid' in shared.data, false)
  assert.equal('deviceGrid' in shared, false)

  const withGrid = createPresetTransferRecord(source, {
    dataKey: 'map',
    includeDeviceGrid: true,
    recordKeyFactory: () => 'record-2'
  })
  const names = new Set(['地图方案', '地图方案（导入）'])
  const safeCopy = createImportedPreset(withGrid, {
    dataKey: 'map', existingNames: names, createId: () => 'new-map'
  })
  assert.deepEqual(safeCopy.map.grid, EMPTY_PRESET_GRID)
  const acceptedCopy = createImportedPreset(withGrid, {
    dataKey: 'map', existingNames: names, acceptDeviceGrid: true, createId: () => 'new-map-2'
  })
  assert.equal(acceptedCopy.map.grid.startX, 100)
})

test('allocates deterministic import suffixes for repeated imports', () => {
  const names = new Set(['方案', '方案（导入）', '方案（导入 2）'])
  assert.equal(allocateImportedName('方案', names), '方案（导入 3）')
  assert.equal(allocateImportedName('方案', names), '方案（导入 4）')
})

test('merges tool sites by safe normalized URL and keeps local conflicts', () => {
  const local = [{ id: 'local', name: '本地', url: 'https://example.com/path/', description: 'local', imageUrl: '' }]
  const result = mergeToolSites(local, [
    { name: '重复', url: 'https://example.com/path', description: 'imported' },
    { name: '新增', url: 'https://new.example.com/a/?token=secret&lang=zh#part', imageUrl: 'file:///secret.png' }
  ], () => 'new-id')
  assert.equal(result.conflicts, 1)
  assert.equal(result.added, 1)
  assert.equal(result.sites[0].name, '本地')
  assert.equal(result.sites[1].id, 'new-id')
  assert.equal(result.sites[1].url, 'https://new.example.com/a?lang=zh')
  assert.equal(result.sites[1].imageUrl, '')
  assert.equal(normalizeToolSiteUrl('javascript:alert(1)'), '')
})
