import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPagePreloader } from '../src/router/pageLoaders.js'
import { createRouteTransitionController } from '../src/router/transitionState.js'

function createScheduler() {
  let currentTime = 0
  let nextId = 1
  const timers = new Map()

  return {
    now: () => currentTime,
    setTimer(callback, delay) {
      const id = nextId++
      timers.set(id, { callback, at: currentTime + delay })
      return id
    },
    clearTimer(id) {
      timers.delete(id)
    },
    advance(milliseconds) {
      const target = currentTime + milliseconds
      while (true) {
        const next = [...timers.entries()]
          .filter(([, timer]) => timer.at <= target)
          .sort((left, right) => left[1].at - right[1].at)[0]
        if (!next) break
        const [id, timer] = next
        timers.delete(id)
        currentTime = timer.at
        timer.callback()
      }
      currentTime = target
    }
  }
}

function createController(scheduler) {
  return createRouteTransitionController({
    showDelayMs: 80,
    minimumVisibleMs: 160,
    now: scheduler.now,
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer
  })
}

test('快速完成的页面切换不会闪烁加载层', () => {
  const scheduler = createScheduler()
  const controller = createController(scheduler)
  const token = controller.start()

  scheduler.advance(79)
  controller.finish(token)
  scheduler.advance(200)

  assert.equal(controller.pending.value, false)
  assert.equal(controller.visible.value, false)
})

test('慢切换显示加载层并满足最短展示时间', () => {
  const scheduler = createScheduler()
  const controller = createController(scheduler)
  const token = controller.start()

  scheduler.advance(80)
  assert.equal(controller.visible.value, true)

  scheduler.advance(20)
  controller.finish(token)
  scheduler.advance(139)
  assert.equal(controller.visible.value, true)

  scheduler.advance(1)
  assert.equal(controller.visible.value, false)
})

test('旧导航不能结束最新导航的加载状态', () => {
  const scheduler = createScheduler()
  const controller = createController(scheduler)
  const firstToken = controller.start()

  scheduler.advance(80)
  const latestToken = controller.start()

  assert.equal(controller.finish(firstToken), false)
  assert.equal(controller.pending.value, true)
  assert.equal(controller.visible.value, true)

  controller.finish(latestToken)
  scheduler.advance(160)
  assert.equal(controller.visible.value, false)
})

test('页面预加载复用进行中的结果并允许失败后重试', async () => {
  let calls = 0
  const preload = createPagePreloader({
    '/items': async () => {
      calls += 1
      if (calls === 1) throw new Error('temporary failure')
    }
  })

  const first = preload('/items')
  assert.strictEqual(preload('/items'), first)
  assert.equal(await first, false)
  assert.equal(await preload('/items'), true)
  assert.equal(calls, 2)
  assert.equal(await preload('/missing'), false)
})

test('主内容区加载层、导航异常复位与侧栏预加载均已接线', () => {
  const routerSource = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
  const layoutSource = readFileSync(new URL('../src/components/Layout/MainLayout.vue', import.meta.url), 'utf8')
  const sidebarSource = readFileSync(new URL('../src/components/Layout/Sidebar.vue', import.meta.url), 'utf8')

  assert.match(routerSource, /router\.beforeEach/)
  assert.match(routerSource, /router\.afterEach/)
  assert.match(routerSource, /router\.onError/)
  assert.match(layoutSource, /<RouteLoadingOverlay\s*\/>/)
  assert.match(sidebarSource, /@pointerenter="warmRoute/)
  assert.match(sidebarSource, /@focusin="warmRoute/)
})
