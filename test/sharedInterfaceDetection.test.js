import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { AutomationLock } from '../electron/modules/automation/lock.js'
import {
  CHAOS_CONTROL_DIP_SIZE,
  DEFAULT_CHAOS_CONTROL_OFFSET,
  clampControlPhysicalBounds,
  normalizeControlOffset,
  placeControlInDip
} from '../electron/modules/chaosRecipe/controlOverlayPosition.js'

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('自动入库与混沌取件共享互斥锁并只允许持有者释放', () => {
  const lock = new AutomationLock()
  assert.deepEqual(lock.acquire('自动入库'), { success: true, owner: '自动入库' })
  assert.equal(lock.acquire('混沌配方取件').success, false)
  lock.release('混沌配方取件')
  assert.equal(lock.getState().owner, '自动入库')
  lock.release('自动入库')
  assert.deepEqual(lock.getState(), { locked: false, owner: '' })
})

test('混沌控制浮窗使用相对游戏物理坐标并限制到客户区', () => {
  assert.deepEqual(normalizeControlOffset(), DEFAULT_CHAOS_CONTROL_OFFSET)
  const game = { left: -1920, top: 0, right: 0, bottom: 1080, width: 1920, height: 1080 }
  const bounds = clampControlPhysicalBounds(game, { x: 50, y: 1550 })
  assert.equal(bounds.left, -1870)
  assert.equal(bounds.top, 1004)
  assert.deepEqual(bounds.offset, { x: 50, y: 1004 })
})

test('混沌控制浮窗在高 DPI 下保持固定内容尺寸并返回物理偏移', () => {
  const game = { left: 0, top: 0, right: 2560, bottom: 1440, width: 2560, height: 1440 }
  const placement = placeControlInDip(game, { x: 50, y: 1550 }, {
    screenToDipPoint: ({ x, y }) => ({ x: x / 2, y: y / 2 }),
    dipToScreenPoint: ({ x, y }) => ({ x: x * 2, y: y * 2 })
  })
  assert.equal(placement.width, CHAOS_CONTROL_DIP_SIZE.width)
  assert.equal(placement.height, CHAOS_CONTROL_DIP_SIZE.height)
  assert.equal(placement.y, 720 - CHAOS_CONTROL_DIP_SIZE.height)
  assert.deepEqual(placement.offset, { x: 50, y: 1264 })
})

test('检测进程由公共协调器持有且两个功能只注册消费者', () => {
  const coordinator = source('../electron/modules/interfaceDetection/coordinator.js')
  const bagIpc = source('../electron/modules/ipc/bag.js')
  const chaosIpc = source('../electron/modules/ipc/chaosRecipe.js')
  assert.match(coordinator, /this\.consumers = new Set\(\)/)
  assert.match(coordinator, /registerConsumer\(consumer, config\)/)
  assert.match(coordinator, /this\.consumers\.size === 0/)
  assert.doesNotMatch(bagIpc, /let detectionProcess/)
  assert.match(bagIpc, /registerConsumer\('bag'/)
  assert.match(chaosIpc, /registerConsumer\('chaos-recipe'/)
})

test('混沌配方控制浮窗提供三项操作和动态停止继续', () => {
  const view = source('../src/domains/shop/ChaosRecipeControlOverlayView.vue')
  const manager = source('../electron/modules/chaosRecipe/controlOverlay.js')
  const panel = source('../src/domains/shop/ChaosRecipePanel.vue')
  assert.match(view, /刷新仓库/)
  assert.match(view, /预览高亮/)
  assert.match(manager, /actionLabel = '停止取件'/)
  assert.match(manager, /actionLabel = '继续取件'/)
  assert.match(manager, /missingCalibrationKeys/)
  assert.match(manager, /statusMessage/)
  assert.match(view, /state\.statusMessage/)
  assert.match(manager, /fullSetCount/)
  assert.match(manager, /完整套装 \$\{fullSetCount\}/)
  assert.match(view, /state\.refreshLabel/)
  assert.match(view, /state\.previewLabel/)
  assert.match(view, /@pointerdown\.stop\.prevent="runFromPointer\('action'/)
  assert.equal((view.match(/busy !== ''/g) || []).length, 3)
  assert.doesNotMatch(view, /\|\| busy"/)
  assert.match(view, /button:not\(:disabled\):hover/)
  assert.match(view, /button:not\(:disabled\):active/)
  assert.match(view, /button:disabled/)
  assert.doesNotMatch(manager, /needsNormal|needsQuad/)
  assert.match(panel, /是否开启/)
  assert.match(panel, /operationDelayMs/)
})

test('公共检测脚本上报游戏客户区并在几何变化时广播', () => {
  const script = source('../src/assets/scripts/bag_auto_stash_template.py')
  assert.match(script, /def get_game_client_bounds/)
  assert.match(script, /GetClientRect/)
  assert.match(script, /ClientToScreen/)
  assert.match(script, /game_bounds != last_game_bounds/)
  assert.match(script, /gameBounds=game_bounds/)
})
