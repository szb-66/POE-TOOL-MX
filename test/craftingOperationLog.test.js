import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  appendCraftingOperation,
  createCraftingOperationState,
  visibleCraftingOperations
} from '../src/domains/overlay/craftingOperationLog.js'

const operation = (index, mode = 'items', sessionId = 'session-1') => ({
  event: 'crafting-operation',
  mode,
  sessionId,
  timestamp: 1_700_000_000_000 + index,
  phase: 'input',
  action: `action-${index}`,
  outcome: index % 2 ? 'success' : 'started',
  code: '',
  summary: `步骤 ${index}`
})

test('制作和地图操作日志分别保留最近100条并拒绝旧会话迟到事件', () => {
  let state = createCraftingOperationState()
  state = appendCraftingOperation(state, { ...operation(0), phase: 'session', action: 'start' })
  for (let index = 1; index <= 105; index += 1) state = appendCraftingOperation(state, operation(index))
  assert.equal(visibleCraftingOperations(state, 'items').length, 100)
  assert.equal(visibleCraftingOperations(state, 'items')[0].action, 'action-6')

  state = appendCraftingOperation(state, { ...operation(200, 'map', 'map-session'), phase: 'session', action: 'start' })
  state = appendCraftingOperation(state, operation(201, 'map', 'map-session'))
  assert.equal(visibleCraftingOperations(state, 'map').length, 2)
  assert.equal(visibleCraftingOperations(state, 'items').length, 100)

  state = appendCraftingOperation(state, operation(999, 'items', 'old-session'))
  assert.equal(visibleCraftingOperations(state, 'items').at(-1).action, 'action-105')
})

test('操作日志只接受安全规范字段且界面提供底部日志模块', async () => {
  let state = createCraftingOperationState()
  state = appendCraftingOperation(state, {
    ...operation(1),
    phase: 'session',
    action: 'start',
    clipboard: '完整物品文本',
    path: 'C:/private/file',
    token: 'secret'
  })
  assert.deepEqual(Object.keys(visibleCraftingOperations(state, 'items')[0]).sort(), [
    'action', 'code', 'mode', 'outcome', 'phase', 'sessionId', 'summary', 'timestamp'
  ])

  const [view, content] = await Promise.all([
    readFile(new URL('../src/domains/overlay/OverlayView.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/domains/overlay/components/OverlayContent.vue', import.meta.url), 'utf8')
  ])
  assert.match(view, /visibleCraftingOperations/)
  assert.match(content, /操作日志/)
  assert.match(content, /operation-log/)
})

test('操作日志默认收起且按需展开，新会话和重置会恢复收起状态', async () => {
  const [view, content] = await Promise.all([
    readFile(new URL('../src/domains/overlay/OverlayView.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/domains/overlay/components/OverlayContent.vue', import.meta.url), 'utf8')
  ])
  assert.match(view, /const operationLogExpanded = ref\(false\)/)
  assert.match(view, /:operation-log-expanded="operationLogExpanded"/)
  assert.match(view, /@toggle-operation-log="operationLogExpanded = !operationLogExpanded"/)
  assert.match(view, /function resetOverlayState[\s\S]*operationLogExpanded\.value = false/)
  assert.match(view, /event\.phase === 'session'[\s\S]*operationLogExpanded\.value = false/)
  assert.match(content, /v-if="operationLogExpanded"[\s\S]*class="operation-log-list"/)
  assert.match(content, /operationLogExpanded \? '收起' : '展开'/)
  assert.match(content, /\.overlay-content \{[\s\S]*padding-bottom: 38px/)
  assert.match(content, /\.operation-log-expanded \.overlay-content \{[\s\S]*padding-bottom: 170px/)
})
