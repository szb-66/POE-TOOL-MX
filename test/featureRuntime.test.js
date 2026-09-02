import test from 'node:test'
import assert from 'node:assert/strict'
import {
  disableFeatureModule,
  enableFeatureModule,
  isFeatureRuntimeBusy,
  registerFeatureRuntimeAdapter,
  setFeatureShortcutSynchronizer
} from '../src/features/featureRuntime.js'

function featureStore(initialDisabled = []) {
  const disabled = new Set(initialDisabled)
  return {
    isEnabled: id => !disabled.has(id),
    disable: id => { disabled.add(id); return true },
    enable: id => { disabled.delete(id); return true },
    moduleForRoute: path => path === '/items' ? { id: 'items' } : null
  }
}

test('协调器先停止运行时再提交停用并返回首页', async t => {
  const calls = []
  const remove = registerFeatureRuntimeAdapter('items', {
    isBusy: () => true,
    suspend: async () => { calls.push('suspend'); return { success: true } },
    resume: async () => { calls.push('resume'); return { success: true } }
  })
  t.after(() => { remove(); setFeatureShortcutSynchronizer(null) })
  setFeatureShortcutSynchronizer(async () => calls.push('shortcuts'))
  const store = featureStore()
  const router = { currentRoute: { value: { path: '/items' } }, push: async path => calls.push(`route:${path}`) }
  assert.equal(await isFeatureRuntimeBusy('items'), true)
  assert.deepEqual(await disableFeatureModule('items', { store, router }), { success: true })
  assert.equal(store.isEnabled('items'), false)
  assert.deepEqual(calls, ['suspend', 'shortcuts', 'route:/'])
})

test('停止失败不提交停用状态', async t => {
  let resumeCalls = 0
  const remove = registerFeatureRuntimeAdapter('map', {
    suspend: () => ({ success: false, error: '仍在运行' }),
    resume: () => { resumeCalls += 1; return { success: true } }
  })
  t.after(remove)
  const store = featureStore()
  const result = await disableFeatureModule('map', { store, router: { currentRoute: { value: { path: '/' } }, push: async () => {} } })
  assert.equal(result.success, false)
  assert.match(result.error, /仍在运行/)
  assert.equal(store.isEnabled('map'), true)
  assert.equal(resumeCalls, 1)
})

test('恢复异常保留入口并返回警告', async t => {
  const remove = registerFeatureRuntimeAdapter('story', { resume: () => { throw new Error('环境不可用') } })
  t.after(() => { remove(); setFeatureShortcutSynchronizer(null) })
  const store = featureStore(['story'])
  const result = await enableFeatureModule('story', { store })
  assert.equal(store.isEnabled('story'), true)
  assert.equal(result.success, true)
  assert.match(result.warnings[0], /环境不可用/)
})

test('停用提交后的快捷键同步失败会回滚状态并恢复运行时', async t => {
  const calls = []
  const remove = registerFeatureRuntimeAdapter('combat', {
    suspend: async () => { calls.push('suspend'); return { success: true } },
    resume: async () => { calls.push('resume'); return { success: true } }
  })
  t.after(() => { remove(); setFeatureShortcutSynchronizer(null) })
  setFeatureShortcutSynchronizer(async () => {
    calls.push('shortcuts')
    if (calls.filter(item => item === 'shortcuts').length === 1) throw new Error('注册失败')
  })
  const store = featureStore()
  const result = await disableFeatureModule('combat', {
    store,
    router: { currentRoute: { value: { path: '/' } }, push: async () => {} }
  })
  assert.equal(result.success, false)
  assert.match(result.error, /注册失败/)
  assert.equal(store.isEnabled('combat'), true)
  assert.deepEqual(calls, ['suspend', 'shortcuts', 'resume', 'shortcuts'])
})
