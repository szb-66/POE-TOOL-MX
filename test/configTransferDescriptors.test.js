import test from 'node:test'
import assert from 'node:assert/strict'
import { createSectionDescriptorRegistry } from '../src/domains/settings/configTransfer/descriptors.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    dump: () => Object.fromEntries(values)
  }
}

function mockContext() {
  const storage = memoryStorage()
  const presetStore = {
    itemPresets: [{ id: 'item-current', name: '做装', checkInitialItem: true, moduleTwo: {}, moduleThree: {}, moduleEldritch: {} }],
    mapPresets: [{ id: 'map-current', name: '地图', map: { method: 'alchemy', grid: {} } }],
    currentItemPresetId: 'item-current',
    currentMapPresetId: 'map-current',
    savePresets() { storage.setItem('mapPresets', JSON.stringify(this.mapPresets)) }
  }
  const storyStore = {
    storyPresets: [{ id: 'story-current', name: '剧情', chapters: [] }],
    skillPresets: [{ id: 'skill-current', name: '技能', chapterSkills: [] }],
    currentStoryPresetId: 'story-current',
    currentSkillPresetId: 'skill-current',
    save() { storage.setItem('storyGuide:v1', JSON.stringify({ storyPresets: this.storyPresets, skillPresets: this.skillPresets })) }
  }
  return { storage, presetStore, storyStore, createToolSiteId: () => 'imported-site' }
}

test('descriptor registry exposes only the five supported transfer sections', () => {
  const registry = createSectionDescriptorRegistry(mockContext())
  assert.deepEqual([...registry.keys()], [
    'preset.item', 'preset.map', 'preset.story', 'preset.storySkill', 'settings.toolSites'
  ])
  for (const removed of ['preset.chart', 'preset.shop', 'settings.automation', 'device.shortcuts']) {
    assert.equal(registry.has(removed), false)
  }
})

test('map descriptor creates a non-current copy and restores the snapshot', () => {
  const context = mockContext()
  const descriptor = createSectionDescriptorRegistry(context).get('preset.map')
  const snapshot = descriptor.snapshot()
  const plan = descriptor.planImport({ items: [{
    recordKey: 'shared-map', name: '地图', data: { method: 'chaos' },
    deviceGrid: { startX: 10, startY: 20, offsetX: 30, offsetY: 31, rows: 5, cols: 12 }
  }] }, { acceptDeviceGrid: false })
  descriptor.persist(plan)
  assert.equal(context.presetStore.mapPresets.length, 2)
  assert.equal(context.presetStore.mapPresets[1].name, '地图（导入）')
  assert.equal(context.presetStore.currentMapPresetId, 'map-current')
  assert.equal(context.presetStore.mapPresets[1].map.grid.startX, 0)
  descriptor.rollback(snapshot)
  assert.equal(context.presetStore.mapPresets.length, 1)
  assert.equal(context.presetStore.currentMapPresetId, 'map-current')
})

test('tool sites keep local URL conflicts and persist only new sites', () => {
  const context = mockContext()
  context.storage.setItem('toolSiteDirectory', JSON.stringify({
    version: 1,
    sites: [{ id: 'local', name: 'Local', url: 'https://example.com/', description: '', imageUrl: '' }]
  }))
  const descriptor = createSectionDescriptorRegistry(context).get('settings.toolSites')
  const plan = descriptor.planImport({ sites: [
    { name: 'Shared', url: 'https://example.com' },
    { name: 'New', url: 'https://new.example/' }
  ] })
  assert.deepEqual(plan.summary, { added: 1, conflicts: 1 })
  descriptor.persist(plan)
  const stored = JSON.parse(context.storage.dump().toolSiteDirectory)
  assert.equal(stored.sites.length, 2)
  assert.equal(stored.sites[0].name, 'Local')
  assert.equal(stored.sites[1].id, 'imported-site')
})
