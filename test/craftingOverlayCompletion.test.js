import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { EventEmitter } from 'node:events'
import { computed, ref, watch, effectScope, nextTick } from 'vue'
import { parse } from '@vue/compiler-sfc'
import { createOverlayOutsideClickCloser } from '../electron/modules/window/overlayOutsideClickClose.js'
import * as operationLog from '../src/domains/overlay/craftingOperationLog.js'

const source = readFileSync(new URL('../src/domains/overlay/OverlayView.vue', import.meta.url), 'utf8')
const body = parse(source).descriptor.scriptSetup.content.replace(/^import[\s\S]*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
const eventLine = (event, data = {}) => `EVENT ${JSON.stringify({ event, mode: 'items', ...data })}\n`

async function harness(t) {
  const scope = effectScope()
  const handlers = {}
  const children = []
  let mounted
  let closed = false
  let checkpoint = null
  const win = { isDestroyed: () => closed, getBounds: () => ({ x: 100, y: 100, width: 100, height: 100 }) }
  const closer = createOverlayOutsideClickCloser({
    onClose: () => { closed = true; closer.disarm() },
    pythonPath: 'fake', scriptPath: 'fake', getCursorPoint: () => ({ x: 0, y: 0 }),
    spawnImpl: () => {
      const child = new EventEmitter()
      child.stdout = new EventEmitter()
      child.kill = () => {}
      children.push(child)
      return child
    }
  })
  const api = {
    window: { armOverlayOutsideClickClose: () => closer.arm(win), disarmOverlayOutsideClickClose: closer.disarm },
    batchCrafting: { getRecovery: async () => ({ success: true, checkpoint }) },
    events: {
      onUpdateOverlay: callback => { handlers.update = callback },
      onScriptStopped: callback => { handlers.stop = callback },
      onPythonOutput: callback => { handlers.output = callback }
    }
  }
  const state = scope.run(() => vm.runInNewContext(`${body}\n;({isCompleted,isStopped,batchProgress,canResumeBatch,handleBatchResume})`, {
    computed, ref, watch, onMounted: callback => { mounted = callback },
    electronApi: api, useSettingsStore: () => ({ overlaySettings: {} }), usePresetStore: () => ({}),
    normalizeCurrencyUsage: value => value, isCorrectableConfigurationFailure: () => false,
    ...operationLog,
    retryAutomationWithLatestConfig: async () => { handlers.update({ reset: true }); return { success: true } },
    startCrafting: () => {}, startMapRolling: () => {}
  }))
  t.after(() => { scope.stop(); closer.disarm() })
  await mounted()
  return {
    state, closer, handlers,
    setCheckpoint: value => { checkpoint = value },
    closed: () => closed,
    click: () => children.at(-1)?.stdout.emit('data', '{"event":"click"}\n'),
    output: async data => { handlers.output({ type: 'stdout', data }); await nextTick() }
  }
}

test('首件和阶段完成后点击下一件不关闭浮窗，整批完成后才关闭', async t => {
  const h = await harness(t)
  await h.output('[开始] 制作流程\n' + eventLine('crafting-batch-item-started', { total: 2, completed: 0, remaining: 2 }))
  for (const message of ['[完成] 词缀制作完成！', '[完成] 插槽制作完成！', '[完成] 首次识别已满足词缀目标，未执行制作']) {
    await h.output(message + '\n')
    h.click()
    assert.equal(h.state.isCompleted.value, false)
    assert.equal(h.closer.isArmed(), false)
    assert.equal(h.closed(), false)
  }
  await h.output(eventLine('crafting-batch-item-completed', { total: 2, completed: 1, remaining: 1 }) + eventLine('crafting-batch-item-started', { total: 2, completed: 1, remaining: 1, currentItem: { id: 'second' } }))
  h.click()
  assert.equal(h.state.batchProgress.value.currentItem.id, 'second')
  assert.equal(h.closed(), false)
  await h.output(eventLine('crafting-batch-completed', { total: 2, completed: 2, remaining: 0 }))
  assert.equal(h.state.isCompleted.value, true)
  assert.equal(h.closer.isArmed(), true)
  h.click()
  assert.equal(h.closed(), true)
})

test('开始与完成同块按顺序处理，分块事件保留到完整行后解析', async t => {
  const h = await harness(t)
  const complete = eventLine('crafting-completed')
  await h.output('[开始] 制作流程\n' + complete.slice(0, 15))
  assert.equal(h.closer.isArmed(), false)
  await h.output(complete.slice(15, -1))
  assert.equal(h.closer.isArmed(), false)
  await h.output('\n')
  assert.equal(h.closer.isArmed(), true)
  h.handlers.update({ reset: true })
  await nextTick()
  assert.equal(h.closer.isArmed(), false)
  await h.output('[开始] 制作流程\n[完成] 词缀制作完成！\n' + complete)
  assert.equal(h.closer.isArmed(), true)
})

for (const termination of ['abnormal', 'manual', 'completed']) {
  test(`停止结果 ${termination} 不受单件匹配属性或缺失 mapStats 干扰`, async t => {
    const h = await harness(t)
    h.handlers.update({ name: '首件', affixMatch: true, socketMatch: true, eldritchImplicitMatch: true })
    await h.output(eventLine('crafting-completed'))
    await h.handlers.stop({ mode: 'items', termination })
    await nextTick()
    assert.equal(h.state.isCompleted.value, termination === 'completed')
    assert.equal(h.state.isStopped.value, termination !== 'completed')
    assert.equal(h.closer.isArmed(), termination === 'completed')
  })
}

test('物品停止消息携带空地图统计时，单件达标也不能覆盖异常终止', async t => {
  const h = await harness(t)
  h.handlers.update({ name: '首件', affixMatch: true, socketMatch: true, eldritchImplicitMatch: true })
  await h.handlers.stop({ mode: 'items', termination: 'abnormal', mapStats: null })
  await nextTick()
  assert.equal(h.state.isCompleted.value, false)
  assert.equal(h.state.isStopped.value, true)
  assert.equal(h.closer.isArmed(), false)
})

test('异常批次保留续作入口，续作重置后下一件完成不布防', async t => {
  const h = await harness(t)
  h.setCheckpoint({ recoverable: true, targets: [{ id: 'second' }], completedIds: ['first'], currentItemId: 'second' })
  await h.handlers.stop({ mode: 'items', termination: 'abnormal', mapStats: null })
  await nextTick()
  assert.equal(h.state.canResumeBatch.value, true)
  await h.state.handleBatchResume()
  await h.output('[开始] 制作流程\n[完成] 词缀制作完成！\n')
  assert.equal(h.state.isStopped.value, false)
  assert.equal(h.closer.isArmed(), false)
})

test('地图单张完成继续运行，地图整体结束仍布防', async t => {
  const h = await harness(t)
  h.handlers.update({ category: '地图', mapStats: { processedCount: 1 } })
  await h.output('[完成] 地图处理完成，移动到下一个格子\n')
  assert.equal(h.closer.isArmed(), false)
  await h.output('[完成] 地图洗练结束，共处理 2 张\n')
  await h.handlers.stop({ mode: 'map', mapStats: { processedCount: 2 } })
  await nextTick()
  assert.equal(h.state.isCompleted.value, true)
  assert.equal(h.closer.isArmed(), true)
})
