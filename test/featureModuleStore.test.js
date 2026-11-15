import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia } from 'pinia'
import { serverContext } from '../shared/serverMode.js'
import { currentServer } from '../src/utils/serverContext.js'
import { useFeatureModulesStore } from '../src/stores/featureModules.js'
import { enableFeatureModule, registerFeatureRuntimeAdapter, setFeatureShortcutSynchronizer } from '../src/features/featureRuntime.js'

test('国际服未适配模块仅出现在未适配列表，不能启用或恢复后台任务', async t => {
  const originalServer = { ...currentServer }
  Object.assign(currentServer, serverContext('international'))
  t.after(() => { Object.assign(currentServer, originalServer); setFeatureShortcutSynchronizer(null) })
  const store = useFeatureModulesStore(createPinia())
  assert.deepEqual(store.unsupportedFeatures.map(item => item.id), ['craft-planner', 'puzzle'])
  for (const id of ['craft-planner', 'puzzle']) {
    assert.equal(store.enabledFeatures.some(item => item.id === id), false)
    assert.equal(store.enabledNavigationFeatures.some(item => item.id === id), false)
    assert.equal(store.disabledFeatures.some(item => item.id === id), false)
    assert.equal(store.isEnabled(id), false)
    assert.equal(store.enable(id), false)
    store.disable(id)
    const disabledBefore = [...store.disabledFeatureIds]
    const calls = []
    const remove = registerFeatureRuntimeAdapter(id, { resume: () => calls.push('resume') })
    t.after(remove)
    setFeatureShortcutSynchronizer(() => calls.push('shortcuts'))
    assert.equal((await enableFeatureModule(id, { store })).success, false)
    assert.deepEqual(calls, [])
    assert.deepEqual(store.disabledFeatureIds, disabledBefore)
  }
  store.disable('items')
  assert.equal(store.disabledFeatures.some(item => item.id === 'items'), true)
  assert.equal((await enableFeatureModule('items', { store })).success, true)
  assert.equal(store.isEnabled('items'), true)
  assert.equal((await enableFeatureModule('items', { store })).success, true, '重复添加保持成功')

  Object.assign(currentServer, serverContext('cn'))
  const cnStore = useFeatureModulesStore(createPinia())
  assert.deepEqual(cnStore.unsupportedFeatures, [])
  for (const id of ['craft-planner', 'puzzle']) assert.equal(cnStore.isEnabled(id), true)
})
