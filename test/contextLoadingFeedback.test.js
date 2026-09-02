import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LoadingFeedbackCoordinator } from '../electron/modules/loadingFeedback/coordinator.js'
import { loadingFeedbackBounds } from '../electron/modules/loadingFeedback/overlay.js'

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

function fakeClock() {
  let now = 0
  let sequence = 0
  const timers = new Map()
  return {
    now: () => now,
    setTimer(callback, delay) {
      const id = ++sequence
      timers.set(id, { callback, due: now + delay })
      return id
    },
    clearTimer(id) {
      timers.delete(id)
    },
    advance(milliseconds) {
      const target = now + milliseconds
      while (true) {
        const next = [...timers.entries()]
          .filter(([, timer]) => timer.due <= target)
          .sort((left, right) => left[1].due - right[1].due || left[0] - right[0])[0]
        if (!next) break
        timers.delete(next[0])
        now = next[1].due
        next[1].callback()
      }
      now = target
    }
  }
}

function createCoordinator() {
  const clock = fakeClock()
  const app = []
  const game = []
  const coordinator = new LoadingFeedbackCoordinator({
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    publishApp: snapshot => app.push(structuredClone(snapshot)),
    publishGame: (snapshot, bounds) => game.push({ snapshot: structuredClone(snapshot), bounds })
  })
  return { clock, app, game, coordinator }
}

test('短操作不会闪烁，长操作延迟出现并满足最短展示时长', () => {
  const fast = createCoordinator()
  fast.coordinator.setForeground({ kind: 'app' })
  const fastToken = fast.coordinator.begin('crafting.initialize')
  fast.clock.advance(299)
  assert.equal(fast.coordinator.getSnapshot('app').visible, false)
  assert.equal(fast.coordinator.finish(fastToken), true)
  fast.clock.advance(1)
  assert.equal(fast.coordinator.getSnapshot('app').visible, false)

  const slow = createCoordinator()
  slow.coordinator.setForeground({ kind: 'app' })
  const slowToken = slow.coordinator.begin('crafting.initialize')
  slow.clock.advance(300)
  assert.equal(slow.coordinator.getSnapshot('app').visible, true)
  slow.coordinator.update(slowToken, { stage: 'bases', current: 2, total: 5 })
  assert.deepEqual(slow.coordinator.getSnapshot('app'), {
    visible: true,
    target: 'app',
    label: '正在加载底材数据',
    current: 2,
    total: 5,
    activeCount: 1
  })
  slow.coordinator.finish(slowToken)
  slow.clock.advance(399)
  assert.equal(slow.coordinator.getSnapshot('app').visible, true)
  slow.clock.advance(1)
  assert.equal(slow.coordinator.getSnapshot('app').visible, false)
  assert.equal(slow.coordinator.finish(slowToken), false)
})

test('已有业务反馈真实显示后可立即交接且不受最短展示时长阻塞', () => {
  const { clock, coordinator } = createCoordinator()
  coordinator.setForeground({ kind: 'game', gameBounds: { left: 0, top: 0, right: 1920, bottom: 1080 } })
  const token = coordinator.begin('faustus.start')
  clock.advance(300)
  assert.equal(coordinator.getSnapshot('game').visible, true)
  assert.equal(coordinator.handoff(token), true)
  assert.equal(coordinator.getSnapshot('game').visible, false)
})

test('反馈固定在业务声明的目标窗口，其他窗口聚焦时立即隐藏', () => {
  const { clock, coordinator } = createCoordinator()
  const bounds = { left: 100, top: 50, right: 1700, bottom: 950 }
  coordinator.setForeground({ kind: 'app' })
  coordinator.begin('stash-pickup.start')
  clock.advance(300)
  assert.equal(coordinator.getSnapshot('app').visible, false)
  assert.equal(coordinator.getSnapshot('game').visible, false)

  coordinator.setForeground({ kind: 'game', gameBounds: bounds })
  assert.equal(coordinator.getSnapshot('game').visible, true)
  coordinator.setForeground({ kind: 'other' })
  assert.equal(coordinator.getSnapshot('game').visible, false)
  coordinator.setForeground({ kind: 'game', gameBounds: bounds })
  assert.equal(coordinator.getSnapshot('game').visible, true)
})

test('并发操作只展示最新最高优先级任务并报告活动数量', () => {
  const { clock, coordinator } = createCoordinator()
  coordinator.setForeground({ kind: 'game', gameBounds: { left: 0, top: 0, right: 1920, bottom: 1080 } })
  coordinator.begin('stash-pickup.preview')
  const newest = coordinator.begin('stash-pickup.start')
  clock.advance(300)
  assert.equal(coordinator.getSnapshot('game').label, '正在准备仓库自动取件')
  assert.equal(coordinator.getSnapshot('game').activeCount, 2)
  coordinator.finish(newest)
  assert.equal(coordinator.getSnapshot('game').activeCount, 1)
})

test('renderer 只能登记白名单中的应用内操作，且只能结束自己的令牌', () => {
  const { coordinator } = createCoordinator()
  const token = coordinator.beginFromRenderer('crafting.initialize', 'renderer:1')
  assert.ok(token)
  assert.equal(coordinator.beginFromRenderer('stash-pickup.start', 'renderer:1'), null)
  assert.equal(coordinator.beginFromRenderer('unknown', 'renderer:1'), null)
  assert.equal(coordinator.finishOwned(token, 'renderer:2'), false)
  assert.equal(coordinator.finishOwned(token, 'renderer:1'), true)
})

test('游戏加载条按物理窗口边界转换 DPI 后置于顶部中央', () => {
  const screenApi = {
    screenToDipRect: (_window, rectangle) => ({
      x: rectangle.x / 2,
      y: rectangle.y / 2,
      width: rectangle.width / 2,
      height: rectangle.height / 2
    })
  }
  assert.deepEqual(loadingFeedbackBounds(
    { left: 100, top: 50, right: 1700, bottom: 950 },
    screenApi,
    'win32'
  ), { x: 220, y: 49, width: 460, height: 68 })
})

test('加载反馈契约保持受控、不可聚焦且不暴露敏感窗口信息', () => {
  const catalog = source('shared/loadingFeedback.js')
  const overlay = source('electron/modules/loadingFeedback/overlay.js')
  const preload = source('electron/preload.cjs')
  const component = source('src/components/common/ContextLoadingFeedback.vue')
  const watcher = source('src/assets/scripts/foreground_watcher.py')
  const main = source('electron/main.js')

  for (const operationId of [
    'crafting.initialize', 'stash-pickup.preview', 'stash-pickup.start',
    'junfeng.preview', 'junfeng.start', 'batch-inventory.scan',
    'faustus.start', 'puzzle.analysis', 'puzzle.border'
  ]) assert.match(catalog, new RegExp(operationId.replace('.', '\\.')))
  assert.match(overlay, /focusable: false/)
  assert.match(overlay, /setIgnoreMouseEvents\(true/)
  assert.match(overlay, /showInactive\(\)/)
  assert.match(component, /aria-live="polite"/)
  assert.match(component, /prefers-reduced-motion: reduce/)
  assert.match(preload, /beginLoadingFeedback/)
  const loadingBridge = preload.split(/\r?\n/).filter(line => line.includes('LoadingFeedback')).join('\n')
  assert.doesNotMatch(loadingBridge, /gameBounds|windowHandle|processName/)
  assert.match(watcher, /bounds=bounds/)
  assert.match(main, /main\.isFocused\(\)/)
})

test('游戏准备反馈在确认激活后才开始延迟计时', () => {
  const cases = [
    ['electron/modules/stashPickup/manager.js', "activateGame({ source: 'stash-pickup-preview' })", 'stash-pickup.preview'],
    ['electron/modules/stashPickup/manager.js', "activateGame({ source: 'stash-pickup-start' })", 'stash-pickup.start'],
    ['electron/modules/junfeng/manager.js', "activateGame({ source: 'junfeng-preview' })", 'junfeng.preview'],
    ['electron/modules/junfeng/manager.js', "activateGame({ source: 'junfeng-pickup-start' })", 'junfeng.start'],
    ['electron/modules/puzzle/service.js', "activateGame({ source: 'puzzle-border-probe' })", 'puzzle.border'],
    ['electron/modules/puzzle/service.js', "activateGame({ source: 'puzzle-analysis' })", 'puzzle.analysis'],
    ['electron/modules/ipc/bag.js', "activateGameWindow('batch-inventory-scan')", 'batch-inventory.scan']
  ]
  for (const [file, activationNeedle, operationId] of cases) {
    const content = source(file)
    const activationIndex = content.indexOf(activationNeedle)
    const feedbackIndex = content.indexOf(`'${operationId}'`)
    assert.ok(activationIndex >= 0, `${file} 缺少激活入口 ${activationNeedle}`)
    assert.ok(feedbackIndex > activationIndex, `${file} 的 ${operationId} 必须在游戏激活后登记`)
  }
})
