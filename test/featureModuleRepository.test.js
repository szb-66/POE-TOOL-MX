import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FEATURE_MODULE_STORAGE_KEY,
  availableFeatureCatalog,
  featureForRoute,
  filterFeatureShortcuts,
  shortcutFeatureId
} from '../src/features/featureCatalog.js'
import {
  normalizeFeatureModuleState,
  readFeatureModuleState,
  saveFeatureModuleState
} from '../src/features/featureModuleRepository.js'

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    dump: () => Object.fromEntries(values)
  }
}

test('功能目录保持正式顺序并只在开发版提供模型训练', () => {
  const production = availableFeatureCatalog()
  const development = availableFeatureCatalog({ development: true })
  assert.equal(production.some(item => item.id === 'highlight-model-training'), false)
  assert.equal(development.some(item => item.id === 'highlight-model-training'), true)
  assert.deepEqual(production.map(item => item.route), [
    '/items', '/bag', '/map', '/combat', '/story', '/regex', '/recipe',
    '/craft-planner', '/price-check', '/faustus', '/puzzle', '/tools'
  ])
  assert.equal(featureForRoute('/shop')?.id, 'recipe')
  assert.equal(shortcutFeatureId('storyNext'), 'story')
})

test('功能偏好默认全部启用且损坏记录安全回退', () => {
  assert.deepEqual(readFeatureModuleState(memoryStorage()), { version: 1, disabledFeatureIds: [] })
  assert.deepEqual(readFeatureModuleState(memoryStorage({ [FEATURE_MODULE_STORAGE_KEY]: '{bad' })), { version: 1, disabledFeatureIds: [] })
  assert.deepEqual(normalizeFeatureModuleState({ version: 9, disabledFeatureIds: ['items'] }), { version: 1, disabledFeatureIds: [] })
})

test('功能偏好去重、忽略未知项且未来功能默认启用', () => {
  const normalized = normalizeFeatureModuleState({
    version: 1,
    disabledFeatureIds: ['items', 'unknown-future', 'items', 42]
  })
  assert.deepEqual(normalized.disabledFeatureIds, ['items'])
  assert.equal(normalized.disabledFeatureIds.includes('tools'), false)
  const storage = memoryStorage()
  assert.equal(saveFeatureModuleState(normalized, storage), true)
  assert.deepEqual(JSON.parse(storage.dump()[FEATURE_MODULE_STORAGE_KEY]), normalized)
})

test('快捷键仅保留启用模块和全局紧急停止', () => {
  const shortcuts = { itemStart: 'F6', mapStart: 'F7', end: 'Alt+3', priceCheck: 'F8' }
  assert.deepEqual(filterFeatureShortcuts(shortcuts, id => id !== 'items' && id !== 'price-check'), {
    mapStart: 'F7',
    end: 'Alt+3'
  })
})
