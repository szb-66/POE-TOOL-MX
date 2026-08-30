import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useConfigurationGuideStore } from '../src/domains/configurationGuide/configurationGuideStore.js'
import { createConfigurationCheck, createConfigurationIssue } from '../src/domains/configurationGuide/configurationIssues.js'

const missing = () => createConfigurationIssue({
  id: 'currency.wisdom', moduleId: 'items', actionId: 'start', kind: 'coordinate',
  title: '知识卷轴坐标', message: '未配置', editorId: 'currency.wisdom'
})

function setup() {
  setActivePinia(createPinia())
  return useConfigurationGuideStore()
}

test('没有配置问题时立即执行且不显示引导', async () => {
  const store = setup()
  let executions = 0
  const result = await store.open({
    moduleId: 'items', actionId: 'start',
    collect: () => createConfigurationCheck([]),
    execute: async () => { executions += 1; return { success: true } }
  })
  assert.equal(result.success, true)
  assert.equal(executions, 1)
  assert.equal(store.visible, false)
})

test('缺项先打开引导，补齐后显式继续只执行一次', async () => {
  const store = setup()
  let configured = false
  let executions = 0
  const opened = store.open({
    moduleId: 'items', actionId: 'start', actionLabel: '开始',
    collect: () => createConfigurationCheck(configured ? [] : [missing()]),
    execute: async () => { executions += 1; return { success: true } }
  })
  assert.equal(opened.configurationRequired, true)
  assert.equal(store.visible, true)
  assert.equal(executions, 0)
  configured = true
  store.refresh()
  assert.equal(store.remainingCount, 0)
  await Promise.all([store.continueAction(), store.continueAction()])
  assert.equal(executions, 1)
  assert.equal(store.visible, false)
})

test('关闭引导清除待执行动作且不会产生副作用', async () => {
  const store = setup()
  let executions = 0
  store.open({
    moduleId: 'items', actionId: 'start',
    collect: () => createConfigurationCheck([missing()]),
    execute: async () => { executions += 1 }
  })
  assert.equal(store.clear(), true)
  assert.deepEqual(await store.continueAction(), { success: false, ignored: true })
  assert.equal(executions, 0)
})

test('运行纠错的 suspect 项在明确保存前持续阻塞且完成后不自动执行', async () => {
  const store = setup()
  let completions = 0
  store.open({
    moduleId: 'items', actionId: 'start', returnToSource: true,
    collect: () => createConfigurationCheck([]),
    forcedIssues: [{ ...missing(), state: 'suspect' }],
    onComplete: () => { completions += 1 }
  })
  assert.equal(store.remainingCount, 1)
  store.markIssueConfigured('currency.wisdom')
  assert.equal(store.remainingCount, 0)
  await store.continueAction()
  assert.equal(completions, 1)
  assert.equal(store.visible, false)
})

test('取消来源于浮窗的引导会清除待执行动作并只恢复来源窗口', async () => {
  const store = setup()
  let executed = 0
  let canceled = 0
  store.open({
    moduleId: 'items',
    actionId: 'start',
    collect: () => createConfigurationCheck([missing()]),
    execute: () => { executed += 1 },
    onCancel: () => { canceled += 1 }
  })
  await store.cancel()
  assert.equal(store.visible, false)
  assert.equal(executed, 0)
  assert.equal(canceled, 1)
})
