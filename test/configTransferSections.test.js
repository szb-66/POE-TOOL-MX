import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SECTION_FIELD_WHITELISTS,
  normalizeExportSectionData,
  normalizeSectionData
} from '../src/domains/settings/configTransfer/sections.js'
import {
  collectPresetIdentities,
  createPresetSectionData,
  planPresetImport
} from '../src/domains/settings/configTransfer/presets.js'
import { ConfigTransferError, EMPTY_PRESET_GRID } from '../src/domains/settings/configTransfer/core.js'

const supportedIds = [
  'preset.item', 'preset.map', 'preset.story', 'preset.storySkill', 'settings.toolSites'
]

test('section normalizers expose exactly five field allowlists and reject removed ids', () => {
  assert.deepEqual(Object.keys(SECTION_FIELD_WHITELISTS), supportedIds)
  for (const sectionId of ['preset.chart', 'preset.shop', 'settings.general', 'device.shortcuts']) {
    assert.throws(
      () => normalizeSectionData(sectionId, {}),
      error => error instanceof ConfigTransferError && error.code === 'UNKNOWN_SECTION'
    )
  }
})

test('tool sites keep only safe normalized fields', () => {
  const normalized = normalizeExportSectionData('settings.toolSites', {
    sites: [{
      id: 'source-id',
      name: '编年史',
      url: 'https://example.com/path/?token=secret&lang=zh',
      description: '说明',
      imageUrl: 'file:///private/icon.png',
      cookie: 'private'
    }],
    unrelated: true
  })
  assert.deepEqual(normalized, {
    sites: [{
      name: '编年史',
      url: 'https://example.com/path?lang=zh',
      description: '说明',
      imageUrl: ''
    }]
  })
})

test('story preset import allocates new top-level and nested identities without changing source', () => {
  const source = {
    id: 'default', name: '通关路线',
    chapters: [{ id: 'chapter-old', name: '第一章', steps: [{ id: 'step-old', text: '进城' }] }],
    currentChapterId: 'chapter-old', currentStepId: 'step-old', viewedChapterId: 'chapter-old'
  }
  const data = createPresetSectionData('preset.story', [source], { recordKeyFactory: () => 'story-record' })
  const plan = planPresetImport('preset.story', data, [{ id: 'local', name: '通关路线' }])
  assert.equal(plan.imported[0].name, '通关路线（导入）')
  const importedIds = collectPresetIdentities(plan.imported[0])
  assert.equal(importedIds.includes('default'), false)
  assert.equal(importedIds.includes('chapter-old'), false)
  assert.equal(importedIds.includes('step-old'), false)
  assert.equal(new Set(importedIds).size, importedIds.length)
  assert.equal(source.chapters[0].id, 'chapter-old')
})

test('skill preset import regenerates group and skill identities', () => {
  const source = {
    id: 'default', name: '升级技能',
    chapterSkills: [{ skillGroups: [{ id: 'group-old', name: '主技能', skills: [{ id: 'skill-old', name: '火球', color: 'red' }] }] }]
  }
  const data = createPresetSectionData('preset.storySkill', [source], { recordKeyFactory: () => 'skill-record' })
  const ids = collectPresetIdentities(planPresetImport('preset.storySkill', data, []).imported[0])
  assert.equal(ids.includes('group-old'), false)
  assert.equal(ids.includes('skill-old'), false)
})

test('map coordinates require export inclusion and import acceptance independently', () => {
  const source = [{
    id: 'map-one', name: '通用地图',
    map: { method: 'alchemy', grid: { startX: 10, startY: 20, offsetX: 30, offsetY: 31, rows: 5, cols: 12 } }
  }]
  const stripped = createPresetSectionData('preset.map', source, { recordKeyFactory: () => 'map-record' })
  assert.equal(Object.hasOwn(stripped.items[0], 'deviceGrid'), false)
  assert.deepEqual(planPresetImport('preset.map', stripped, []).imported[0].map.grid, EMPTY_PRESET_GRID)

  const included = createPresetSectionData('preset.map', source, { includeDeviceGrid: true, recordKeyFactory: () => 'map-record' })
  assert.deepEqual(planPresetImport('preset.map', included, [], { acceptDeviceGrid: false }).imported[0].map.grid, EMPTY_PRESET_GRID)
  assert.equal(planPresetImport('preset.map', included, [], { acceptDeviceGrid: true }).imported[0].map.grid.startX, 10)
})

test('repeated item preset import advances suffixes and never overwrites', () => {
  const data = createPresetSectionData('preset.item', [{
    id: 'one', name: '做装', checkInitialItem: true, moduleTwo: {}, moduleThree: {}, moduleEldritch: {}
  }], { recordKeyFactory: () => 'item-record' })
  const first = planPresetImport('preset.item', data, [{ id: 'local', name: '做装' }])
  const second = planPresetImport('preset.item', data, [{ id: 'local', name: '做装' }, first.imported[0]])
  assert.equal(first.imported[0].name, '做装（导入）')
  assert.equal(second.imported[0].name, '做装（导入 2）')
  assert.notEqual(first.imported[0].id, second.imported[0].id)
})
