import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { filterFeatureShortcuts, shortcutFeatureId } from '../src/features/featureCatalog.js'

const shortcuts = {
  itemStart: 'F1', mapStart: 'F2', end: 'F3', portal: 'F4',
  storyPrevious: 'F5', storyNext: 'F6', priceCheck: 'F10'
}

test('停用模块的专属快捷键被过滤且紧急停止始终保留', () => {
  const disabled = new Set(['items', 'story', 'recipe', 'price-check'])
  const result = filterFeatureShortcuts(shortcuts, id => !disabled.has(id))
  assert.deepEqual(result, { mapStart: 'F2', end: 'F3', portal: 'F4' })
  assert.equal(shortcutFeatureId('storyNext'), 'story')
  assert.equal(shortcutFeatureId('chaosRecipeStart'), null)
  assert.equal(shortcutFeatureId('end'), null)
})

test('快捷键注册和触发分发均执行模块门禁', () => {
  const service = readFileSync(new URL('../src/utils/scriptService.js', import.meta.url), 'utf8')
  assert.match(service, /filterFeatureShortcuts\(shortcuts, id => featureStore\.isEnabled\(id\)\)/)
  assert.match(service, /shortcutFeatureId\(accelerator\)/)
  assert.match(service, /!useFeatureModulesStore\(\)\.isEnabled\(featureId\)/)
  assert.match(service, /end: emergencyStopAll/)
})

test('查价设置与直接执行入口在模块停用时拒绝启动', () => {
  const store = readFileSync(new URL('../src/stores/priceCheck.js', import.meta.url), 'utf8')
  assert.match(store, /enabled && !useFeatureModulesStore\(\)\.isEnabled\('price-check'\)/)
  assert.match(store, /async function checkHoveredItem[\s\S]*!useFeatureModulesStore\(\)\.isEnabled\('price-check'\)/)
})
