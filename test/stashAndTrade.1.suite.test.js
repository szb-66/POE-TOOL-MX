import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { mkdtemp as _m0_mkdtemp, mkdir as _m0_mkdir, readFile as _m0_readFile, writeFile as _m0_writeFile, rm as _m0_rm } from 'node:fs/promises'
import _m0_os from 'node:os'
import _m0_path from 'node:path'
import { MapTrackerRepository as _m0_MapTrackerRepository } from '../electron/modules/mapTracker/repository.js'
import { MapTrackerService as _m0_MapTrackerService } from '../electron/modules/mapTracker/service.js'
import { createStashStatisticsBatch as _m0_createStashStatisticsBatch } from '../electron/modules/bag/stashStatistics.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { readFileSync as _m1_readFileSync } from 'node:fs'
import { createBagOverlaySnapshot as _m1_createBagOverlaySnapshot } from '../electron/modules/bag/overlayState.js'
import { BAG_OVERLAY_SIZE as _m1_BAG_OVERLAY_SIZE, getBagOverlayBounds as _m1_getBagOverlayBounds, getBagOverlayDragBounds as _m1_getBagOverlayDragBounds } from '../electron/modules/window/bagOverlay.js'
import { OverlayDragSession as _m1_OverlayDragSession } from '../electron/modules/window/overlayDrag.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { EventEmitter as _m2_EventEmitter } from 'node:events'
import { isPoeCnAllowedUrl as _m2_isPoeCnAllowedUrl, requestPoeCnJson as _m2_requestPoeCnJson } from '../electron/modules/chaosRecipe/http.js'
import { PoeCnAuthService as _m2_PoeCnAuthService } from '../electron/modules/chaosRecipe/auth.js'
import { PoeCnStashClient as _m2_PoeCnStashClient } from '../electron/modules/chaosRecipe/stashClient.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { readFileSync as _m3_readFileSync } from 'node:fs'
import { installExternalLinkPolicy as _m3_installExternalLinkPolicy } from '../electron/modules/window/externalLinks.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { enrichPlanCoordinates as _m4_enrichPlanCoordinates, itemGridBounds as _m4_itemGridBounds } from '../electron/modules/chaosRecipe/coordinates.js'
import { missingCalibrationKeys as _m4_missingCalibrationKeys, resolveStashGridLayout as _m4_resolveStashGridLayout } from '../electron/modules/chaosRecipe/layout.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { calculateVendorRecipes as _m5_calculateVendorRecipes, calculateChaosRecipe as _m5_calculateChaosRecipe, classifySocketRecipe as _m5_classifySocketRecipe, createPickingPlan as _m5_createPickingPlan, filterChaosCandidates as _m5_filterChaosCandidates, summarizeChaosItemPipeline as _m5_summarizeChaosItemPipeline } from '../electron/modules/chaosRecipe/engine.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { readFileSync as _m6_readFileSync } from 'node:fs'
import { normalizeChaosRecipeSettings as _m6_normalizeChaosRecipeSettings } from '../src/stores/chaosRecipe.js'
import { applyManualFolderState as _m6_applyManualFolderState } from '../electron/modules/chaosRecipe/service.js'
import { stashCalibrationKey as _m6_stashCalibrationKey } from '../electron/modules/chaosRecipe/layout.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { normalizeStashContents as _m7_normalizeStashContents, normalizeStashTabs as _m7_normalizeStashTabs, resolveRecipeItemClass as _m7_resolveRecipeItemClass } from '../electron/modules/chaosRecipe/normalizer.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { readFileSync as _m8_readFileSync } from 'node:fs'
import _m8_path from 'node:path'
import _m8_vm from 'node:vm'
import { normalizeGridRegion as _m8_normalizeGridRegion } from '../electron/modules/chaosRecipe/coordinates.js'
import { createLoadAwarePublisher as _m8_createLoadAwarePublisher } from '../electron/modules/window/loadAwarePublisher.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { createFaustusBandReorderTransaction as _m9_createFaustusBandReorderTransaction, moveFaustusBand as _m9_moveFaustusBand, reorderFaustusBands as _m9_reorderFaustusBands } from '../src/utils/faustusBandReorder.js'

// === Merged from autoStashStatistics.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const mkdtemp = _m0_mkdtemp
  const mkdir = _m0_mkdir
  const readFile = _m0_readFile
  const writeFile = _m0_writeFile
  const rm = _m0_rm
  const os = _m0_os
  const path = _m0_path
  const MapTrackerRepository = _m0_MapTrackerRepository
  const MapTrackerService = _m0_MapTrackerService
  const createStashStatisticsBatch = _m0_createStashStatisticsBatch
const initialTime = new Date(2026, 8, 30, 23, 59, 59).getTime()
async function setup(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'stash-statistics-'))
  let now = initialTime
  const repository = new MapTrackerRepository(root)
  const service = new MapTrackerService({ repository, now: () => now })
  await service.initialize()
  clearInterval(service.tickTimer); service.tickTimer = null
  t.after(async () => { await service.shutdown({ normal: false }); await rm(root, { recursive: true, force: true }) })
  await service.updateSettings({ enabled: true, enhancements: { loot: true } })
  return { root, repository, service, setNow: value => { now = value } }
}

test('无地图无角色统计所有自动入库，跨午夜及月份重启恢复', async t => {
  const { root, repository, service, setNow } = await setup(t)
  assert.equal(service.snapshot().activeRun, null)
  await service.recordStashedItem({ name: '混沌石', quantity: 20 }, 'batch:1')
  assert.equal(service.snapshot().summary.todayLoot, 20)
  const later = initialTime + 2000
  setNow(later)
  await service.recordStashedItem({ name: '混沌石', quantity: 20 }, 'batch:1')
  await service.recordStashedItem({ name: '混沌石', quantity: 3 }, 'batch:2')
  assert.equal(service.snapshot().summary.todayLoot, 3)
  assert.equal(service.snapshot().summary.windows[24].loot, 23)
  const restored = new MapTrackerService({ repository: new MapTrackerRepository(root), now: () => later })
  await restored.initialize()
  try {
    await restored.recordStashedItem({ name: '混沌石', quantity: 20 }, 'batch:1')
    assert.equal(restored.snapshot().summary.todayLoot, 3)
    assert.equal(restored.snapshot().summary.windows[24].loot, 23)
    assert.equal((await repository.all()).runs.length, 0)
  } finally { await restored.shutdown({ normal: false }) }
})

test('收到事件时冻结资格与数据，关闭开关不撤销已接收事件', async t => {
  const { service } = await setup(t)
  let release
  service.enqueue(() => new Promise(resolve => { release = resolve }))
  await new Promise(resolve => setImmediate(resolve))
  const item = { name: '混沌石', quantity: 5 }
  const accepted = service.recordStashedItem(item, 'accepted:1')
  item.quantity = 999
  service.settings.enabled = false
  assert.equal(await service.recordStashedItem(item, 'disabled:1'), false)
  service.settings.enabled = true; service.settings.paused = true
  assert.equal(await service.recordStashedItem(item, 'paused:1'), false)
  service.settings.paused = false; service.settings.enhancements.loot = false
  assert.equal(await service.recordStashedItem(item, 'off:1'), false)
  release(); await accepted
  assert.equal(service.snapshot().summary.todayLoot, 5)
})

test('并发和重复事件不重复计数，保存失败队列可恢复', async t => {
  const { service, repository } = await setup(t)
  const save = repository.saveStashEvent.bind(repository)
  repository.saveStashEvent = async () => { throw Object.assign(new Error('占用'), { code: 'EPERM' }) }
  await assert.rejects(service.recordStashedItem({ name: '石', quantity: 8 }, 'retry:1'), { code: 'EPERM' })
  assert.equal(service.snapshot().summary.todayLoot, 0)
  repository.saveStashEvent = save
  await Promise.all(Array.from({ length: 30 }, () => service.recordStashedItem({ name: '石', quantity: 8 }, 'retry:1')))
  assert.equal(service.snapshot().summary.todayLoot, 8)
  assert.equal((await repository.getStashEvents(initialTime)).events.length, 1)
})

test('旧字段清理保留其他原始数据，可重入且不触碰新事件', async t => {
  const { repository, service } = await setup(t)
  const shardPath = path.join(repository.root, 'runs', 'standard', '2026-09.json')
  await mkdir(path.dirname(shardPath), { recursive: true })
  const old = { id: 'old', startedAt: '2026-09-01T00:00:00Z', loot: [{ name: '旧物品', quantity: 99 }], unknownField: { retained: true } }
  await writeFile(repository.activePath, JSON.stringify({ schemaVersion: 1, run: old }))
  await writeFile(shardPath, JSON.stringify({ schemaVersion: 1, runs: [old], custom: 'keep' }))
  await service.recordStashedItem({ name: '新物品', quantity: 2 }, 'new:1')
  assert.deepEqual(await repository.clearLegacyLoot(), [])
  const cleaned = { ...old }; delete cleaned.loot
  assert.deepEqual(JSON.parse(await readFile(repository.activePath, 'utf8')).run, cleaned)
  assert.deepEqual(JSON.parse(await readFile(shardPath, 'utf8')), { schemaVersion: 1, runs: [cleaned], custom: 'keep' })
  assert.deepEqual(await repository.clearLegacyLoot(), [])
  assert.equal((await repository.getStashEvents(initialTime)).events.length, 1)
  await writeFile(shardPath, '{broken')
  assert.equal((await repository.clearLegacyLoot()).length, 1)
  assert.equal(await readFile(shardPath, 'utf8'), '{broken')
})

test('关闭等待已收到的入库事件落盘且不接受新事件', async t => {
  const { service, repository } = await setup(t)
  const save = repository.saveStashEvent.bind(repository)
  let release
  repository.saveStashEvent = async event => {
    await new Promise(resolve => { release = resolve })
    return save(event)
  }
  const pending = service.recordStashedItem({ name: '石', quantity: 4 }, 'shutdown:1')
  await new Promise(resolve => setImmediate(resolve))
  let finished = false
  const shutdown = service.shutdown({ normal: false }).then(() => { finished = true })
  assert.equal(await service.recordStashedItem({ name: '石' }, 'shutdown:2'), false)
  assert.equal(finished, false)
  release(); await pending; await shutdown
  assert.equal((await repository.getStashEvents(initialTime)).events[0].quantity, 4)
})

test('批次立即采集，完成等待全部写入；失败报告而不拒绝或重复操作', async () => {
  let release; let calls = 0; let reported = 0
  const ids = []
  const batch = createStashStatisticsBatch((_item, id) => {
    ids.push(id); calls++
    if (calls === 1) return new Promise(resolve => { release = resolve })
    throw new Error('统计文件占用')
  }, () => { reported++ })
  batch.record({ name: '成功' }); batch.record({ name: '失败' })
  assert.equal(calls, 2)
  assert.notEqual(ids[0], ids[1])
  let finished = false
  const finish = batch.finish().then(result => { finished = true; return result })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(finished, false)
  release()
  assert.deepEqual(await finish, { statisticsError: '统计保存失败' })
  assert.equal(reported, 1)
  assert.equal(calls, 2)
})
})()

// === Merged from bagStashOverlay.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const readFileSync = _m1_readFileSync
  const createBagOverlaySnapshot = _m1_createBagOverlaySnapshot
  const BAG_OVERLAY_SIZE = _m1_BAG_OVERLAY_SIZE
  const getBagOverlayBounds = _m1_getBagOverlayBounds
  const getBagOverlayDragBounds = _m1_getBagOverlayDragBounds
  const OverlayDragSession = _m1_OverlayDragSession
const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('浮层仅在就绪或入库中显示，入库时禁用', () => {
  assert.deepEqual(createBagOverlaySnapshot({
    moduleEnabled: true,
    ready: false,
    foreground: false
  }), {
    visible: false,
    normalEnabled: true,
    allflameReceiverEnabled: false,
    stashReady: false,
    allflameReceiverReady: false,
    ready: false,
    foreground: false,
    stashing: false,
    disabled: true,
    disabledReason: '等待入库目标与背包同时打开',
    label: '自动入库'
  })

  const ready = createBagOverlaySnapshot({
    moduleEnabled: true,
    ready: true,
    foreground: true
  })
  assert.equal(ready.visible, true)
  assert.equal(ready.disabled, false)

  const stashing = createBagOverlaySnapshot({
    moduleEnabled: true,
    ready: true,
    foreground: true,
    stashing: true
  })
  assert.equal(stashing.visible, true)
  assert.equal(stashing.disabled, true)
  assert.equal(stashing.label, '入库中')
})

test('普通仓库与永火接收舱状态共用唯一浮层快照', () => {
  const receiver = createBagOverlaySnapshot({
    moduleEnabled: true,
    normalEnabled: false,
    allflameReceiverEnabled: true,
    stashReady: false,
    allflameReceiverReady: true,
    ready: true,
    foreground: true
  })
  assert.equal(receiver.visible, true)
  assert.equal(receiver.disabled, false)
  assert.equal(receiver.normalEnabled, false)
  assert.equal(receiver.allflameReceiverEnabled, true)
  assert.equal(receiver.allflameReceiverReady, true)
  assert.equal(receiver.label, '自动入库')
})

test('模块运行但条件不足时不提供常驻禁用按钮', () => {
  const waiting = createBagOverlaySnapshot({
    moduleEnabled: true,
    ready: true,
    foreground: false
  })
  assert.equal(waiting.visible, false)
  assert.equal(waiting.disabled, true)
  assert.equal(waiting.disabledReason, '游戏窗口不在前台')
  assert.equal(createBagOverlaySnapshot({ moduleEnabled: false }).visible, false)
})

test('浮层恢复有效位置，失效位置回退到主屏工作区', () => {
  const displays = [
    { primary: true, workArea: { x: 0, y: 0, width: 1920, height: 1080 } },
    { primary: false, workArea: { x: 1920, y: 0, width: 1280, height: 1024 } }
  ]
  assert.deepEqual(getBagOverlayBounds({ x: 2100, y: 100 }, displays), {
    x: 2100, y: 100, ...BAG_OVERLAY_SIZE
  })
  assert.deepEqual(getBagOverlayBounds({ x: 5000, y: 5000 }, displays), {
    x: 1708,
    y: 508,
    ...BAG_OVERLAY_SIZE
  })
})

test('浮窗拖动始终从主进程固定起点计算且不累积窗口尺寸', () => {
  const drag = new OverlayDragSession()
  drag.begin(7, { screenX: 100, screenY: 200 }, { x: 300, y: 400, width: 188, height: 64 })
  assert.deepEqual(drag.move(7, { screenX: 110, screenY: 220 }), { x: 310, y: 420 })
  assert.deepEqual(drag.move(7, { screenX: 120, screenY: 240 }), { x: 320, y: 440 })
  assert.equal(drag.move(8, { screenX: 130, screenY: 260 }), null)
  drag.end(7)
  assert.equal(drag.move(7, { screenX: 140, screenY: 280 }), null)
})

test('浮层水平、垂直及重复拖动始终恢复固定尺寸', () => {
  const workArea = { x: 0, y: 0, width: 1920, height: 1080 }
  const targets = [
    { x: 450, y: 400 },
    { x: 300, y: 620 },
    { x: 700, y: 800 },
    { x: 800, y: 900 }
  ]
  for (const target of targets) {
    assert.deepEqual(getBagOverlayDragBounds(target, workArea), {
      ...target,
      ...BAG_OVERLAY_SIZE
    })
  }
})

test('浮层拖到工作区边缘时夹取位置而不改变固定尺寸', () => {
  const workArea = { x: -1280, y: 0, width: 1280, height: 720 }
  assert.deepEqual(getBagOverlayDragBounds({ x: -2000, y: -100 }, workArea), {
    x: -1280, y: 0, ...BAG_OVERLAY_SIZE
  })
  assert.deepEqual(getBagOverlayDragBounds({ x: 100, y: 1000 }, workArea), {
    x: -188, y: 656, ...BAG_OVERLAY_SIZE
  })
  assert.deepEqual(getBagOverlayDragBounds(
    { x: 50, y: 50 },
    { x: 10, y: 20, width: 100, height: 40 }
  ), {
    x: 10, y: 20, ...BAG_OVERLAY_SIZE
  })
})

test('专用浮层保持不抢焦点、独立路由、拖动与统一 IPC 状态', () => {
  const manager = source('../electron/modules/window/manager.js')
  const router = source('../src/router/index.js')
  const view = source('../src/domains/bag/BagStashOverlayView.vue')
  const ipc = source('../electron/modules/ipc/bag.js')
  const shortcuts = source('../src/utils/scriptService.js')
  const bagPage = source('../src/domains/bag/BagView.vue')
  const moveHandler = ipc.slice(
    ipc.indexOf("ipcMain.on('bag-stash-overlay-move'"),
    ipc.indexOf("ipcMain.handle('stop-bag-stash'")
  )
  const movePhase = moveHandler.slice(moveHandler.indexOf("if (point.phase !== 'move')"))

  assert.match(manager, /let bagStashOverlayWindow = null/)
  assert.match(manager, /focusable: false/)
  assert.match(manager, /showInactive\(\)/)
  assert.match(manager, /bagStashOverlayBounds/)
  assert.match(manager, /export function getBagStashOverlayWindow\(\)/)
  assert.match(router, /path: '\/bag-stash-overlay'/)
  assert.match(view, /createOverlayDrag/)
  assert.match(view, /@pointerdown="drag\.pointerDown"/)
  assert.match(view, /@pointerdown\.stop\.prevent="startStashFromPointer"/)
  assert.match(view, /grid-template-columns: 28px 1fr/)
  assert.match(view, /-webkit-app-region: no-drag/)
  assert.match(view, /electronApi\.bag\.startStash\(\)/)
  assert.match(ipc, /createBagOverlaySnapshot/)
  assert.doesNotMatch(ipc, /update-bag-preferences|immediateStash|showStashButtonOnlyWhenReady/)
  assert.doesNotMatch(ipc, /startStashProcess\([^)]*'auto'/)
  assert.match(ipc, /bag-stash-overlay-move/)
  assert.match(ipc, /getBagStashOverlayWindow/)
  assert.match(movePhase, /overlay\.setBounds\(getBagOverlayDragBounds\(/)
  assert.doesNotMatch(movePhase, /overlay\.getBounds\(\)/)
  assert.doesNotMatch(movePhase, /overlay\.setPosition\(/)
  assert.match(ipc, /new OverlayDragSession\(\)/)
  assert.doesNotMatch(shortcuts, /stashStart:/)
  assert.doesNotMatch(bagPage, /手动补扫快捷键|>手动补扫</)
})
})()

// === Merged from chaosRecipeApi.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const EventEmitter = _m2_EventEmitter
  const isPoeCnAllowedUrl = _m2_isPoeCnAllowedUrl
  const requestPoeCnJson = _m2_requestPoeCnJson
  const PoeCnAuthService = _m2_PoeCnAuthService
  const PoeCnStashClient = _m2_PoeCnStashClient
function fakeSession(fetchImpl) {
  const state = { cookies: [], cleared: 0, cacheCleared: 0 }
  const cookies = new EventEmitter()
  cookies.set = async (cookie) => { state.cookies.push(cookie) }
  return {
    state,
    fetch: fetchImpl,
    cookies,
    clearStorageData: async () => { state.cleared += 1 },
    clearCache: async () => { state.cacheCleared += 1 }
  }
}

class FakeLoginWindow extends EventEmitter {
  static instances = []

  constructor(options) {
    super()
    this.options = options
    this.destroyed = false
    this.closeCalls = 0
    this.webContents = new EventEmitter()
    this.webContents.setWindowOpenHandler = (handler) => { this.windowOpenHandler = handler }
    FakeLoginWindow.instances.push(this)
  }

  removeMenu() {}
  show() {}
  focus() {}
  async loadURL(url) { this.url = url }
  isDestroyed() { return this.destroyed }
  close() {
    if (this.destroyed) return
    this.closeCalls += 1
    this.destroyed = true
    this.emit('closed')
  }
}

const flushTimers = () => new Promise((resolve) => setTimeout(resolve, 10))

const jsonResponse = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { 'content-type': 'application/json' }
})

test('国服请求将登录页、401 和 429 转成结构化错误', async () => {
  await assert.rejects(
    requestPoeCnJson(fakeSession(async () => new Response('<title>流放之路</title>', { status: 200 })), 'https://poe.game.qq.com/api/profile'),
    { code: 'SESSION_EXPIRED' }
  )
  await assert.rejects(
    requestPoeCnJson(fakeSession(async () => new Response('{}', { status: 401 })), 'https://poe.game.qq.com/api/profile'),
    { code: 'SESSION_EXPIRED' }
  )
  await assert.rejects(
    requestPoeCnJson(fakeSession(async () => new Response('{}', {
      status: 429,
      headers: { 'retry-after': '17' }
    })), 'https://poe.game.qq.com/api/profile'),
    (error) => error.code === 'RATE_LIMITED' && error.details.retryAfter === 17
  )
})

test('国服仓库 GET 禁用 Chromium HTTP 缓存', async () => {
  let requestOptions
  const session = fakeSession(async (_url, options) => {
    requestOptions = options
    return new Response('{}', { status: 200 })
  })
  await requestPoeCnJson(session, 'https://poe.game.qq.com/api/profile')
  assert.equal(requestOptions.cache, 'no-store')
  assert.equal(requestOptions.headers['Cache-Control'], 'no-cache')
})

test('国服登录窗口 URL 仅允许 HTTPS 的腾讯登录相关域名', () => {
  assert.equal(isPoeCnAllowedUrl('https://poe.game.qq.com/login'), true)
  assert.equal(isPoeCnAllowedUrl('https://xui.ptlogin2.qq.com/cgi-bin/xlogin'), true)
  assert.equal(isPoeCnAllowedUrl('http://poe.game.qq.com/login'), false)
  assert.equal(isPoeCnAllowedUrl('https://qq.com.attacker.example/'), false)
})

test('手动 POESESSID 只写入独立 Session Cookie 并在验证失败后清除', async () => {
  const session = fakeSession(async () => new Response('{}', { status: 401 }))
  const auth = new PoeCnAuthService({ session, BrowserWindow: class {} })
  const secret = '0123456789abcdef0123456789abcdef'
  await assert.rejects(auth.setSessionToken(secret), { code: 'SESSION_EXPIRED' })
  assert.equal(session.state.cookies.length, 1)
  assert.equal(session.state.cookies[0].httpOnly, true)
  assert.equal(session.state.cookies[0].secure, true)
  assert.equal(JSON.stringify(auth.getStatus()).includes(secret), false)
  assert.equal(session.state.cleared, 1)
  assert.equal(session.state.cacheCleared, 1)
})

test('网页登录写入有效 POESESSID 后自动验证、广播并只关闭一次', async () => {
  FakeLoginWindow.instances.length = 0
  let profileCalls = 0
  const session = fakeSession(async () => {
    profileCalls += 1
    return jsonResponse({ profile: { name: '自动登录账号' } })
  })
  const auth = new PoeCnAuthService({
    session,
    BrowserWindow: FakeLoginWindow,
    webLoginDebounceMs: 0
  })
  const statuses = []
  auth.subscribe((status) => statuses.push(status))

  await auth.openWebLogin()
  const window = FakeLoginWindow.instances[0]
  session.cookies.emit('changed', {}, {
    name: 'POESESSID',
    domain: '.poe.game.qq.com',
    value: 'secret-must-not-be-broadcast'
  }, 'explicit', false)
  session.cookies.emit('changed', {}, {
    name: 'POESESSID',
    domain: '.poe.game.qq.com'
  }, 'overwrite', false)
  await flushTimers()

  assert.equal(profileCalls, 1)
  assert.equal(window.closeCalls, 1)
  assert.equal(auth.getStatus().accountName, '自动登录账号')
  assert.equal(JSON.stringify(statuses).includes('secret-must-not-be-broadcast'), false)
  assert.equal(session.cookies.listenerCount('changed'), 0)
})

test('网页登录中间态验证失败时保留窗口，后续 Cookie 可重试成功', async () => {
  FakeLoginWindow.instances.length = 0
  let profileCalls = 0
  const session = fakeSession(async () => {
    profileCalls += 1
    return profileCalls === 1
      ? new Response('{}', { status: 401 })
      : jsonResponse({ profile: { name: '重试账号' } })
  })
  const auth = new PoeCnAuthService({
    session,
    BrowserWindow: FakeLoginWindow,
    webLoginDebounceMs: 0
  })

  await auth.openWebLogin()
  const window = FakeLoginWindow.instances[0]
  session.cookies.emit('changed', {}, {
    name: 'POESESSID',
    domain: 'poe.game.qq.com'
  }, 'explicit', false)
  await flushTimers()
  assert.equal(window.isDestroyed(), false)
  assert.equal(auth.getStatus().authenticated, false)
  assert.equal(session.cookies.listenerCount('changed'), 1)

  session.cookies.emit('changed', {}, {
    name: 'POESESSID',
    domain: 'poe.game.qq.com'
  }, 'overwrite', false)
  await flushTimers()
  assert.equal(profileCalls, 2)
  assert.equal(window.closeCalls, 1)
  assert.equal(auth.getStatus().accountName, '重试账号')
})

test('手动网页确认复用进行中的自动验证且关窗会清理监听', async () => {
  FakeLoginWindow.instances.length = 0
  let releaseProfile
  let profileCalls = 0
  const session = fakeSession(async () => {
    profileCalls += 1
    await new Promise((resolve) => { releaseProfile = resolve })
    return jsonResponse({ profile: { name: '并发账号' } })
  })
  const auth = new PoeCnAuthService({
    session,
    BrowserWindow: FakeLoginWindow,
    webLoginDebounceMs: 0
  })

  await auth.openWebLogin()
  const window = FakeLoginWindow.instances[0]
  session.cookies.emit('changed', {}, {
    name: 'POESESSID',
    domain: 'poe.game.qq.com'
  }, 'explicit', false)
  await flushTimers()
  const manual = auth.completeWebLogin()
  releaseProfile()
  await manual

  assert.equal(profileCalls, 1)
  assert.equal(window.closeCalls, 1)
  assert.equal(session.cookies.listenerCount('changed'), 0)
})

test('注销会取消进行中的网页登录验证，迟到响应不能恢复登录', async () => {
  FakeLoginWindow.instances.length = 0
  let releaseProfile
  const session = fakeSession(async () => {
    await new Promise((resolve) => { releaseProfile = resolve })
    return jsonResponse({ profile: { name: '迟到账号' } })
  })
  const auth = new PoeCnAuthService({
    session,
    BrowserWindow: FakeLoginWindow,
    webLoginDebounceMs: 0
  })

  await auth.openWebLogin()
  session.cookies.emit('changed', {}, {
    name: 'POESESSID',
    domain: 'poe.game.qq.com'
  }, 'explicit', false)
  await flushTimers()
  const logout = auth.logout()
  releaseProfile()
  await logout
  await flushTimers()

  assert.equal(auth.getStatus().authenticated, false)
  assert.equal(session.cookies.listenerCount('changed'), 0)
})

test('仓库页列表始终使用旧接口且每次重新请求', async () => {
  const calls = []
  const session = fakeSession(async (url) => {
    calls.push(String(url))
    return jsonResponse({ tabs: [{ id: 'tab-2', n: '配方页', type: 'NormalStash', index: 2 }] })
  })
  const client = new PoeCnStashClient({
    session,
    getAuthStatus: () => ({ authenticated: true, accountName: '匿名账号' })
  })

  const first = await client.listTabs('S30 永火之咒')
  const second = await client.listTabs('S30 永火之咒')

  assert.equal(first[0].name, '配方页')
  assert.equal(second[0].supported, true)
  assert.equal(calls.filter((url) => url.includes('/api/stash/')).length, 0)
  assert.equal(calls.filter((url) => url.includes('get-stash-items')).length, 2)
  assert.ok(calls.every((url) => new URL(url).searchParams.get('league') === 'S30 永火之咒'))
})

test('客户端在 Retry-After 期间不继续请求', async () => {
  let calls = 0
  const session = fakeSession(async () => {
    calls += 1
    return new Response('{}', { status: 429, headers: { 'retry-after': '30' } })
  })
  const client = new PoeCnStashClient({
    session,
    getAuthStatus: () => ({ authenticated: true, accountName: '匿名账号' })
  })
  await assert.rejects(client.listLeagues(), { code: 'RATE_LIMITED' })
  await assert.rejects(client.listLeagues(), { code: 'RATE_LIMITED' })
  assert.equal(calls, 1)
})

test('仓库页详情只使用旧接口并保留物品数据', async () => {
  const calls = []
  const item = (id) => ({
    id, x: 0, y: 0, ilvl: 70, frameType: 2, identified: false, category: 'Ring'
  })
  const session = fakeSession(async (url) => {
    calls.push(String(url))
    if (String(url).includes('tabs=1')) {
      return jsonResponse({ tabs: [{ id: 'tab-2', n: '2', type: 'NormalStash', index: 22 }] })
    }
    return jsonResponse({ items: [item('r1'), item('r2')] })
  })
  const client = new PoeCnStashClient({
    session,
    getAuthStatus: () => ({ authenticated: true, accountName: '匿名账号' })
  })

  const [tab] = await client.listTabs('S29先祖再临')
  const result = await client.fetchTab('S29先祖再临', tab)

  assert.equal(result.items.length, 2)
  assert.equal(result.diagnostics.provider, 'legacy')
  assert.equal(calls.filter((url) => url.includes('/api/stash/')).length, 0)
})

test('刷新仓库物品前重新加载列表并使用最新仓库页名称', async () => {
  let listCount = 0
  const item = { id: 'r1', x: 0, y: 0, ilvl: 70, frameType: 2, identified: false, category: 'Ring' }
  const session = fakeSession(async (url) => {
    if (String(url).includes('tabs=1')) {
      listCount += 1
      return jsonResponse({
        tabs: [{
          id: 'tab-2',
          n: listCount === 1 ? '很久以前的名称' : '当前名称',
          type: 'NormalStash',
          index: 22
        }]
      })
    }
    return jsonResponse({ items: [item] })
  })
  const client = new PoeCnStashClient({
    session,
    getAuthStatus: () => ({ authenticated: true, accountName: '匿名账号' })
  })

  await client.listTabs('S29先祖再临')
  const [result] = await client.fetchTabs('S29先祖再临', ['tab-2'])

  assert.equal(result.tab.name, '当前名称')
  assert.equal(listCount, 2)
})

test('清缓存会清除仓库页和账号归属', () => {
  const client = new PoeCnStashClient({
    session: fakeSession(async () => new Response('{}', { status: 200 })),
    getAuthStatus: () => ({ authenticated: true, accountName: '匿名账号' })
  })
  client.tabsByLeague.set('S29先祖再临', [])
  client.cacheAccountName = '匿名账号'

  client.clearCache()

  assert.equal(client.tabsByLeague.size, 0)
  assert.equal(client.cacheAccountName, '')
})

test('账号变化时不复用上一账号的仓库缓存', async () => {
  let accountName = '旧账号'
  let calls = 0
  const client = new PoeCnStashClient({
    session: fakeSession(async () => {
      calls += 1
      return jsonResponse({
        tabs: [{ id: 'tab-2', n: accountName, type: 'NormalStash', index: 2 }]
      })
    }),
    getAuthStatus: () => ({ authenticated: true, accountName })
  })

  await client.listTabs('S29先祖再临')
  accountName = '新账号'
  const tabs = await client.listTabs('S29先祖再临')

  assert.equal(tabs[0].name, '新账号')
  assert.equal(calls, 2)
})

test('共享认证登出会同步清除各功能缓存', async () => {
  const session = fakeSession(async () => jsonResponse({ profile: { name: '测试账号' } }))
  const auth = new PoeCnAuthService({ session, BrowserWindow: class {} })
  let clears = 0
  const unregister = auth.registerCacheClearer(() => { clears += 1 })
  auth.registerCacheClearer(() => { clears += 10 })

  await auth.validate()
  await auth.logout()
  assert.equal(clears, 11)

  unregister()
  await auth.logout()
  assert.equal(clears, 21)
})
})()

// === Merged from chaosRecipeAuthWindow.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const readFileSync = _m3_readFileSync
  const installExternalLinkPolicy = _m3_installExternalLinkPolicy
test('国服登录窗口不会继承主应用的系统浏览器外链拦截', () => {
  const main = readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8')
  assert.doesNotMatch(
    main,
    /app\.on\(['"]web-contents-created['"]/,
    '全局 WebContents 外链拦截会把国服登录窗导航转交给系统浏览器'
  )
  assert.match(
    main,
    /installExternalLinkPolicy\(mainWindow\.webContents/,
    '外链策略应只安装到主应用窗口'
  )
})

test('主窗口仍把网页链接交给系统浏览器且不拦截应用内地址', () => {
  let windowOpenHandler = null
  let navigateHandler = null
  const opened = []
  const contents = {
    getURL() { return 'http://localhost:3000/#/items' },
    setWindowOpenHandler(handler) { windowOpenHandler = handler },
    on(event, handler) {
      if (event === 'will-navigate') navigateHandler = handler
    }
  }
  installExternalLinkPolicy(contents, (url) => opened.push(url))

  assert.deepEqual(windowOpenHandler({ url: 'https://example.com/help' }), { action: 'deny' })
  assert.deepEqual(windowOpenHandler({ url: 'http://localhost:3000/#/shop' }), { action: 'deny' })
  assert.deepEqual(windowOpenHandler({ url: 'mailto:test@example.com' }), { action: 'deny' })

  const externalEvent = { prevented: false, preventDefault() { this.prevented = true } }
  navigateHandler(externalEvent, 'https://example.com/docs')
  assert.equal(externalEvent.prevented, true)

  for (const url of ['#/shop', 'http://localhost:3000/#/shop']) {
    const internalEvent = { prevented: false, preventDefault() { this.prevented = true } }
    navigateHandler(internalEvent, url)
    assert.equal(internalEvent.prevented, false)
  }

  const sameOriginExternalDocument = { prevented: false, preventDefault() { this.prevented = true } }
  navigateHandler(sameOriginExternalDocument, 'http://localhost:3000/docs#/shop')
  assert.equal(sameOriginExternalDocument.prevented, true)

  const blockedProtocolEvent = { prevented: false, preventDefault() { this.prevented = true } }
  navigateHandler(blockedProtocolEvent, 'mailto:test@example.com')
  assert.equal(blockedProtocolEvent.prevented, true)

  assert.deepEqual(opened, [
    'https://example.com/help',
    'https://example.com/docs',
    'http://localhost:3000/docs#/shop'
  ])
})
})()

// === Merged from chaosRecipeCoordinates.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const enrichPlanCoordinates = _m4_enrichPlanCoordinates
  const itemGridBounds = _m4_itemGridBounds
  const missingCalibrationKeys = _m4_missingCalibrationKeys
  const resolveStashGridLayout = _m4_resolveStashGridLayout
test('普通仓库按 12x12 换算物品范围和点击中心', () => {
  assert.deepEqual(
    itemGridBounds({ x: 2, y: 3, width: 2, height: 3 }, { left: -1200, top: 100, right: 0, bottom: 1300 }, 12),
    { x: -1000, y: 400, width: 200, height: 300, clickX: -900, clickY: 550 }
  )
})

test('大型仓库在共用区域内使用 24x24 网格', () => {
  const plan = enrichPlanCoordinates({
    tabs: [{
      tabType: 'quad',
      items: [{ x: 23, y: 23, width: 1, height: 1 }]
    }]
  }, { root: { left: 0, top: 0, right: 2400, bottom: 2400 } })
  assert.equal(plan.tabs[0].items[0].screen.clickX, 2350)
  assert.equal(plan.tabs[0].items[0].screen.clickY, 2350)
})

test('普通和大型仓库按目录层级共用两套区域并保持各自网格密度', () => {
  const calibration = {
    root: { left: 0, top: 0, right: 1200, bottom: 1200 },
    folder: { left: 200, top: 200, right: 1400, bottom: 1400 }
  }
  const layouts = [
    resolveStashGridLayout({ type: 'normal', inFolder: false }, calibration),
    resolveStashGridLayout({ type: 'quad', inFolder: false }, calibration),
    resolveStashGridLayout({ type: 'normal', inFolder: true }, calibration),
    resolveStashGridLayout({ type: 'quad', inFolder: true }, calibration)
  ]

  assert.deepEqual(layouts.map(({ calibrationKey, columns, region }) => [
    calibrationKey, columns, region.left
  ]), [
    ['root', 12, 0],
    ['root', 24, 0],
    ['folder', 12, 200],
    ['folder', 24, 200]
  ])
})

test('混合仓库计划缺少任一对应校准时拒绝坐标换算', () => {
  const tabs = [
    { tabType: 'normal', inFolder: false },
    { tabType: 'quad', inFolder: true }
  ]
  assert.deepEqual(missingCalibrationKeys(tabs, {
    root: { left: 0, top: 0, right: 1200, bottom: 1200 }
  }), ['folder'])

  assert.throws(() => enrichPlanCoordinates({
    tabs: [{
      ...tabs[1],
      items: [{ x: 0, y: 0, width: 1, height: 1 }]
    }]
  }, {
    root: { left: 0, top: 0, right: 1200, bottom: 1200 }
  }), { code: 'CALIBRATION_REQUIRED' })
})
})()

// === Merged from chaosRecipeEngine.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const calculateVendorRecipes = _m5_calculateVendorRecipes
  const calculateChaosRecipe = _m5_calculateChaosRecipe
  const classifySocketRecipe = _m5_classifySocketRecipe
  const createPickingPlan = _m5_createPickingPlan
  const filterChaosCandidates = _m5_filterChaosCandidates
  const summarizeChaosItemPipeline = _m5_summarizeChaosItemPipeline
let serial = 0
const item = (itemClass, itemLevel = 80, extra = {}) => ({
  id: `item-${++serial}`,
  itemClass,
  itemLevel,
  frameType: 2,
  rarity: 'rare',
  identified: false,
  tabId: extra.tabId || 'tab-1',
  tabIndex: extra.tabIndex || 0,
  tabName: extra.tabName || '配方',
  tabType: extra.tabType || 'normal',
  x: extra.x || 0,
  y: extra.y || 0,
  width: 1,
  height: 1,
  baseType: `${itemClass}-${serial}`,
  ...extra
})

function fullSet({ weapon = 'twoHandWeapon', lowSlot = 'helmet', tabId = 'tab-1', tabIndex = 0 } = {}) {
  const values = [
    item('bodyArmour', lowSlot === 'bodyArmour' ? 70 : 80, { tabId, tabIndex }),
    item('helmet', lowSlot === 'helmet' ? 70 : 80, { tabId, tabIndex }),
    item('gloves', lowSlot === 'gloves' ? 70 : 80, { tabId, tabIndex }),
    item('boots', lowSlot === 'boots' ? 70 : 80, { tabId, tabIndex }),
    item('belt', lowSlot === 'belt' ? 70 : 80, { tabId, tabIndex }),
    item('amulet', lowSlot === 'amulet' ? 70 : 80, { tabId, tabIndex }),
    item('ring', lowSlot === 'ring' ? 70 : 80, { tabId, tabIndex }),
    item('ring', 80, { tabId, tabIndex })
  ]
  if (weapon === 'twoHandWeapon') values.push(item('twoHandWeapon', lowSlot === 'weapon' ? 70 : 80, { tabId, tabIndex }))
  else {
    values.push(item('oneHandWeapon', lowSlot === 'weapon' ? 70 : 80, { tabId, tabIndex }))
    values.push(item('oneHandWeapon', 80, { tabId, tabIndex }))
  }
  return values
}

test('默认排除已鉴定、非稀有和低等级装备', () => {
  const values = [
    item('helmet', 70),
    item('helmet', 70, { identified: true }),
    item('helmet', 70, { frameType: 1, rarity: 'magic' }),
    item('helmet', 59)
  ]
  assert.equal(filterChaosCandidates(values).length, 1)
  assert.equal(filterChaosCandidates(values, { includeIdentified: true }).length, 2)
})

test('诊断统计区分未读取、未识别和被鉴定规则排除', () => {
  const items = [
    item('ring', 68, { identified: true }),
    item(null, 70),
    item('helmet', 72)
  ]
  const summary = summarizeChaosItemPipeline(items, { includeIdentified: false })
  assert.deepEqual(summary, {
    receivedItemCount: 3,
    recognizedItemCount: 2,
    rareItemCount: 3,
    level60ItemCount: 3,
    rareLevel60EquipmentCount: 2,
    identifiedExcludedCount: 1,
    unrecognizedRareLevel60Count: 1,
    eligibleItemCount: 1
  })
})

test('一件双手武器或两件一手武器均可组成配方', () => {
  assert.equal(calculateChaosRecipe(fullSet()).fullSetCount, 1)
  assert.equal(calculateChaosRecipe(fullSet({ weapon: 'oneHandWeapon' })).fullSetCount, 1)
})

test('纯 75+ 完整套装不会误报为混沌配方', () => {
  const snapshot = calculateChaosRecipe(fullSet({ lowSlot: 'none' }))
  assert.equal(snapshot.fullSetCount, 0)
  assert.equal(snapshot.needsLowLevel, true)
  assert.equal(snapshot.missing.lowLevel, 1)
})

test('多套计算为每套保留至少一件 60-74 装备', () => {
  const snapshot = calculateChaosRecipe([
    ...fullSet({ lowSlot: 'helmet' }),
    ...fullSet({ lowSlot: 'ring', weapon: 'oneHandWeapon', tabId: 'tab-2', tabIndex: 1 })
  ])
  assert.equal(snapshot.fullSetCount, 2)
  assert.ok(snapshot.sets.every((set) => set.items.some((entry) => entry.itemLevel <= 74)))
  assert.equal(snapshot.rewardTotal, 4)
})

test('取件计划按仓库页分组并保留套装身份', () => {
  const snapshot = calculateChaosRecipe([
    ...fullSet({ lowSlot: 'helmet' }),
    ...fullSet({ lowSlot: 'ring', tabId: 'tab-2', tabIndex: 1 })
  ])
  const plan = createPickingPlan(snapshot, 2)
  assert.equal(plan.setCount, 2)
  assert.equal(plan.tabs.length, 2)
  assert.ok(plan.tabs.flatMap((tab) => tab.items).every((entry) => entry.setId))
})

test('取件计划保留仓库页的文件夹属性', () => {
  const snapshot = calculateChaosRecipe(fullSet({
    lowSlot: 'helmet',
    tabId: 'folder-tab'
  }).map((entry) => ({ ...entry, inFolder: true })))
  const plan = createPickingPlan(snapshot, 1)

  assert.equal(plan.tabs[0].inFolder, true)
  assert.ok(plan.tabs[0].items.every((entry) => entry.inFolder))
})

test('机会、混沌和富豪套装按最低物等独立计算', () => {
  const chance = fullSet({ lowSlot: 'helmet' }).map((entry, index) => ({
    ...entry,
    itemLevel: index === 0 ? 59 : 80
  }))
  const chaos = fullSet({ lowSlot: 'helmet', tabId: 'chaos' })
  const regal = fullSet({ lowSlot: 'none', tabId: 'regal' })
  const recipes = calculateVendorRecipes([...chance, ...chaos, ...regal]).recipes

  assert.equal(recipes.chance.fullSetCount, 1)
  assert.equal(recipes.chaos.fullSetCount, 1)
  assert.equal(recipes.regal.fullSetCount, 2)
  assert.equal(recipes.chance.rewardTotal, 2)
})

test('插槽配方按六连、六孔、三色顺序唯一归类并保护套装', () => {
  const sockets = (groups, colours) => colours.map((sColour, index) => ({
    group: groups[index], sColour, attr: ''
  }))
  const linked = item('bodyArmour', 70, { sockets: sockets([0, 0, 0, 0, 0, 0], ['R', 'G', 'B', 'R', 'G', 'B']) })
  const sixSocket = item('helmet', 70, { sockets: sockets([0, 0, 0, 1, 1, 1], ['R', 'G', 'B', 'R', 'G', 'B']) })
  const chromatic = item('gloves', 70, { sockets: sockets([0, 0, 0], ['B', 'R', 'G']) })
  const recipes = calculateVendorRecipes([...fullSet(), linked, sixSocket, chromatic]).recipes

  assert.equal(classifySocketRecipe(linked), 'fusing')
  assert.equal(classifySocketRecipe(sixSocket), 'jeweller')
  assert.equal(classifySocketRecipe(chromatic), 'chromatic')
  assert.deepEqual([
    recipes.fusing.candidateCount,
    recipes.jeweller.candidateCount,
    recipes.chromatic.candidateCount
  ], [1, 1, 1])
  assert.ok(recipes.chaos.candidates.every((entry) => ![linked.id, sixSocket.id, chromatic.id].includes(entry.id)))
})

test('经典势力装备只参与共享势力崇高套装', () => {
  const shaperSet = fullSet({ lowSlot: 'none' }).map((entry) => ({
    ...entry,
    influences: ['shaper']
  }))
  const recipes = calculateVendorRecipes(shaperSet).recipes
  assert.equal(recipes.exalted.fullSetCount, 1)
  assert.equal(recipes.exalted.rewardTotal, 2)
  assert.equal(recipes.regal.fullSetCount, 0)
  assert.equal(recipes.chaos.fullSetCount, 0)
  assert.equal(new Set(recipes.exalted.sets.flatMap((set) => set.items.map((entry) => entry.id))).size, 9)
})

test('崇高套装支持六种经典势力且不会重复分配双势力物品', () => {
  const influences = ['shaper', 'elder', 'crusader', 'redeemer', 'hunter', 'warlord']
  const values = influences.flatMap((influence, index) =>
    fullSet({ lowSlot: 'none', tabId: influence, tabIndex: index }).map((entry) => ({
      ...entry,
      influences: [influence]
    }))
  )
  values[0].influences = ['shaper', 'elder']
  const exalted = calculateVendorRecipes(values).recipes.exalted
  const selectedIds = exalted.sets.flatMap((set) => set.items.map((entry) => entry.id))

  assert.equal(exalted.fullSetCount, 6)
  assert.equal(new Set(selectedIds).size, selectedIds.length)
  assert.deepEqual(new Set(exalted.sets.map((set) => set.influence)), new Set(influences))
})

test('允许已鉴定后混合完整套装奖励降为一个', () => {
  const values = fullSet().map((entry, index) => ({ ...entry, identified: index === 0 }))
  assert.equal(calculateVendorRecipes(values).recipes.chaos.fullSetCount, 0)
  const chaos = calculateVendorRecipes(values, { includeIdentified: true }).recipes.chaos
  assert.equal(chaos.fullSetCount, 1)
  assert.equal(chaos.rewardTotal, 1)
})

test('单件取件计划只包含选中的候选', () => {
  const sockets = ['R', 'G', 'B'].map((sColour) => ({ group: 0, sColour, attr: '' }))
  const first = item('helmet', 10, { sockets })
  const second = item('gloves', 10, { sockets, tabId: 'tab-2', tabIndex: 1 })
  const snapshot = calculateVendorRecipes([first, second])
  const plan = createPickingPlan(snapshot, { recipeId: 'chromatic', itemIds: [second.id] })

  assert.equal(plan.recipeId, 'chromatic')
  assert.equal(plan.selectedItemCount, 1)
  assert.equal(plan.tabs[0].items[0].id, second.id)
  assert.equal(plan.tabs[0].items[0].verificationKind, 'socket')
})
})()

// === Merged from chaosRecipeFolderCalibration.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const readFileSync = _m6_readFileSync
  const normalizeChaosRecipeSettings = _m6_normalizeChaosRecipeSettings
  const applyManualFolderState = _m6_applyManualFolderState
  const stashCalibrationKey = _m6_stashCalibrationKey
test('旧四键混沌配方校准迁移为文件夹内外两套区域', () => {
  const normal = {
    left: 10,
    top: 20,
    right: 1210,
    bottom: 1220,
    displayId: 'display-1',
    scaleFactor: 1.5,
    capturedAt: '2026-07-28T00:00:00.000Z'
  }
  const quad = { left: 30, top: 40, right: 2430, bottom: 2440 }
  const folderQuad = { left: 50, top: 60, right: 1250, bottom: 1260 }
  const settings = normalizeChaosRecipeSettings({ calibration: { normal, quad, folderQuad } })

  assert.deepEqual(settings.calibration.root, normal)
  assert.deepEqual(settings.calibration.folder, {
    ...folderQuad,
    displayId: '',
    scaleFactor: 1,
    capturedAt: ''
  })
  assert.deepEqual(Object.keys(settings.calibration), ['root', 'folder'])
  assert.equal(settings.activeRecipeId, 'chaos')
  assert.equal(normalizeChaosRecipeSettings({ activeRecipeId: 'fusing' }).activeRecipeId, 'fusing')
  assert.equal(normalizeChaosRecipeSettings({ activeRecipeId: 'unknown' }).activeRecipeId, 'chaos')
})

test('混沌配方忽略旧模块操作等待并只保留业务设置', () => {
  const settings = normalizeChaosRecipeSettings({ operationDelayMs: 120, operationTimingVersion: 2 })
  assert.equal('operationDelayMs' in settings, false)
  assert.equal('operationTimingVersion' in settings, false)
})

test('仓库文件夹归属按赛季和仓库页持久化，默认位于文件夹外', () => {
  const settings = normalizeChaosRecipeSettings({
    tabOverrides: {
      S29先祖再临: {
        'tab-1': { name: '当前临时页', inFolder: true, folderName: '配方文件夹' }
      },
      damaged: []
    }
  })

  assert.deepEqual(settings.tabFolderStates, {
    S29先祖再临: {
      'tab-1': true
    }
  })
  const apiMarkedFolder = { id: 'tab-2', name: '临时', inFolder: true, parent: 'folder-id' }
  assert.equal(applyManualFolderState(apiMarkedFolder).inFolder, false)
  assert.equal(stashCalibrationKey(applyManualFolderState(apiMarkedFolder)), 'root')
  assert.equal(stashCalibrationKey(applyManualFolderState(apiMarkedFolder, true)), 'folder')
})

test('混沌配方页面只提供文件夹内外两类校准和仓库标识', () => {
  const panel = readFileSync(
    new URL('../src/domains/shop/ChaosRecipePanel.vue', import.meta.url),
    'utf8'
  )
  const tabField = readFileSync(
    new URL('../src/components/configuration/ShopStashTabConfigurationField.vue', import.meta.url),
    'utf8'
  )
  const variables = readFileSync(
    new URL('../src/styles/variables.less', import.meta.url),
    'utf8'
  )

  for (const key of ['root', 'folder']) {
    assert.match(panel, new RegExp(`key: '${key}'`))
  }
  assert.doesNotMatch(panel, /key: '(?:normal|quad|folderNormal|folderQuad)'/)
  assert.match(panel, /普通与大型共用/)
  assert.match(panel, /ShopStashTabConfigurationField/)
  assert.match(tabField, /tab\.inFolder/)
  assert.match(tabField, />文件夹内</)
  assert.match(tabField, /勾选仓库名称前的复选框以启用该仓库页/)
  assert.match(tabField, /tab\.type === 'quad' \? '大型' : '普通'/)
  assert.match(panel, /missingCalibrationLabels/)
  assert.match(tabField, /旧接口无法判断仓库页是否在文件夹内/)
  assert.match(panel, /saveStashTabFolder/)
  assert.match(panel, /store\.updateTabFolderState/)
  assert.match(tabField, /class="shop-stash-tab-field__card"/)
  assert.match(tabField, /shop-stash-tab-field__card\.active/)
  assert.match(tabField, /shop-stash-tab-field__card:hover[^}]*background/)
  assert.doesNotMatch(tabField, /shop-stash-tab-field__card\.active\s*\{[^}]*background/)
  assert.doesNotMatch(tabField, /var\(--border-light\)/)
  assert.match(variables, /--border-lighter:/)
  assert.match(tabField, /emit\('update:selectedTabIds', next\)/)
  assert.doesNotMatch(panel, /tab-override-row/)
  assert.doesNotMatch(panel, /扫描当前游戏仓库页/)
  for (const text of ['商店配方状态', 'recipeCards', 'activeRecipeId', 'activeSelectedItemIds', '默认全选']) {
    assert.match(panel, new RegExp(text))
  }
})
})()

// === Merged from chaosRecipeNormalizer.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const normalizeStashContents = _m7_normalizeStashContents
  const normalizeStashTabs = _m7_normalizeStashTabs
  const resolveRecipeItemClass = _m7_resolveRecipeItemClass
function iconFor(path) {
  const encoded = Buffer.from(`[25,14,{"f":"2DItems/${path}","w":1,"h":1,"scale":1}]`)
    .toString('base64')
    .replace(/=+$/, '')
  return `https://poecdn.game.qq.com/gen/image/${encoded}/hash/item.png`
}

test('从国服 CDN 图标识别配方装备类别', () => {
  assert.equal(resolveRecipeItemClass({ icon: iconFor('Armours/Helmets/HelmetStr1') }), 'helmet')
  assert.equal(resolveRecipeItemClass({ icon: iconFor('Weapons/TwoHandWeapons/TwoHandSword1') }), 'twoHandWeapon')
  assert.equal(resolveRecipeItemClass({ icon: iconFor('Armours/Shields/ShieldStr1') }), 'oneHandWeapon')
  assert.equal(resolveRecipeItemClass({ icon: iconFor('Quivers/Quiver1') }), null)
})

test('归一化新版和旧版仓库标签并排除特殊仓库', () => {
  const modern = normalizeStashTabs({
    stashes: [
      { id: 'a', name: '普通', type: 'PremiumStash' },
      { id: 'b', name: '大型', type: 'QuadStash' },
      { id: 'c', name: '通货', type: 'CurrencyStash' }
    ]
  })
  assert.deepEqual(modern.map((tab) => [tab.type, tab.columns, tab.supported]), [
    ['normal', 12, true],
    ['quad', 24, true],
    ['normal', 12, false]
  ])
  assert.equal(normalizeStashTabs({ tabs: [{ n: '旧仓库', type: 'NormalStash', index: 3 }] })[0].name, '旧仓库')
  assert.equal(normalizeStashTabs({ tabs: [{ n: '旧仓库', type: 'NormalStash', i: 17 }] })[0].index, 17)
})

test('归一化仓库物品保留配方和坐标字段', () => {
  const result = normalizeStashContents({
    items: [{
      id: 'item-1',
      x: 4,
      y: 5,
      w: 2,
      h: 3,
      ilvl: 71,
      frameType: 2,
      identified: false,
      typeLine: '测试胸甲',
      icon: iconFor('Armours/BodyArmours/BodyStr1')
    }]
  }, { id: 'tab-1', index: 2, name: '配方', type: 'NormalStash' })
  assert.deepEqual(result.items[0], {
    id: 'item-1',
    tabId: 'tab-1',
    tabIndex: 2,
    tabName: '配方',
    tabType: 'normal',
    inFolder: false,
    x: 4,
    y: 5,
    width: 2,
    height: 3,
    itemLevel: 71,
    frameType: 2,
    rarity: 'rare',
    identified: false,
    itemClass: 'bodyArmour',
    name: '',
    baseType: '测试胸甲',
    typeLine: '测试胸甲',
    icon: result.items[0].icon,
    sockets: [],
    influences: []
  })
})

test('归一化仓库物品保留插槽组和全部 truthy 势力键', () => {
  const result = normalizeStashContents({
    items: [{
      id: 'socketed-influenced',
      x: 0,
      y: 0,
      ilvl: 83,
      frameType: 2,
      typeLine: '测试胸甲',
      icon: iconFor('Armours/BodyArmours/BodyStr1'),
      sockets: [
        { group: 0, attr: 'S', sColour: 'R' },
        { group: 0, attr: 'D', sColour: 'G' },
        { group: 1, attr: 'I', sColour: 'B' },
        null,
        { group: 'bad', attr: 'S', sColour: 'R' }
      ],
      influences: { shaper: true, elder: false, crusader: 1, searing: true }
    }]
  }, { id: 'tab-1', index: 0, name: '配方页', type: 'NormalStash' })

  assert.deepEqual(result.items[0].sockets, [
    { group: 0, attr: 'S', sColour: 'R' },
    { group: 0, attr: 'D', sColour: 'G' },
    { group: 1, attr: 'I', sColour: 'B' }
  ])
  assert.deepEqual(result.items[0].influences, ['crusader', 'searing', 'shaper'])
})

test('国服详情响应中的嵌套物品数组仍可被识别', () => {
  const result = normalizeStashContents({
    data: {
      stash: {
        entries: [{
          id: 'nested-item',
          x: 1,
          y: 2,
          ilvl: 68,
          frameType: 2,
          typeLine: '测试头盔',
          icon: iconFor('Armours/Helmets/HelmetStr1')
        }]
      }
    }
  }, { id: 'tab-1', index: 0, name: '配方页', type: 'NormalStash' })

  assert.equal(result.items.length, 1)
  assert.equal(result.items[0].itemClass, 'helmet')
  assert.equal(result.diagnostics.normalizedItemCount, 1)
  assert.ok(result.diagnostics.itemArrayPaths.includes('data.stash.entries'))
})

test('未识别装备诊断只保留 CDN 分类目录', () => {
  const result = normalizeStashContents({
    items: [{
      id: 'unknown-item',
      x: 0,
      y: 0,
      ilvl: 70,
      frameType: 2,
      typeLine: '不进入诊断输出的物品名',
      icon: iconFor('Quivers/Quiver1')
    }]
  }, { id: 'tab-1', index: 0, name: '配方页', type: 'NormalStash' })

  assert.deepEqual(result.diagnostics.unrecognizedRareLevel60Hints, { Quivers: 1 })
  assert.equal(JSON.stringify(result.diagnostics).includes('不进入诊断输出的物品名'), false)
})

test('新版子仓库响应从父页包装的目标 children 中读取物品', () => {
  const result = normalizeStashContents({
    stash: {
      id: 'parent-id',
      children: [
        { id: 'other-id', items: [] },
        {
          id: 'child-id',
          items: [{
            id: 'child-item',
            x: 3,
            y: 4,
            ilvl: 69,
            frameType: 2,
            typeLine: '测试戒指',
            icon: iconFor('Accessories/Rings/Ring1')
          }]
        }
      ]
    }
  }, {
    id: 'child-id',
    parent: 'parent-id',
    index: 2,
    name: '2',
    type: 'NormalStash'
  })

  assert.equal(result.items.length, 1)
  assert.equal(result.items[0].itemClass, 'ring')
  assert.equal(result.tab.inFolder, true)
  assert.equal(result.items[0].inFolder, true)
  assert.equal(result.diagnostics.selectedItemArrayPath, 'stash.children.<selected>.items')
})

test('新版 parent 与旧版 folder 均归一化为文件夹仓库', () => {
  const tabs = normalizeStashTabs({
    tabs: [
      { id: 'root', type: 'NormalStash' },
      { id: 'modern-child', type: 'QuadStash', parent: 'folder-id' },
      { id: 'legacy-child', type: 'NormalStash', folder: '配方文件夹' }
    ]
  })

  assert.deepEqual(tabs.map((tab) => [tab.id, tab.inFolder]), [
    ['root', false],
    ['modern-child', true],
    ['legacy-child', true]
  ])
})
})()

// === Merged from chaosRecipeOverlay.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const readFileSync = _m8_readFileSync
  const path = _m8_path
  const vm = _m8_vm
  const normalizeGridRegion = _m8_normalizeGridRegion
  const createLoadAwarePublisher = _m8_createLoadAwarePublisher
const REGION = { left: 100, top: 100, right: 700, bottom: 700 }

class FakeWebContents {
  constructor() {
    this.crashed = false
    this.sent = []
    this.listeners = {}
  }

  isCrashed() { return this.crashed }
  isLoadingMainFrame() { return false }
  on(name, handler) { (this.listeners[name] ||= []).push(handler) }
  send(channel, state) { this.sent.push([channel, state]) }
  emit(name) { for (const handler of this.listeners[name] || []) handler() }
}

class FakeWindow {
  constructor(bounds) {
    this.bounds = bounds
    this.destroyed = false
    this.shown = 0
    this.closeCalled = false
    this.handlers = {}
    this.onceHandlers = {}
    this.webContents = new FakeWebContents()
    FakeWindow.created.push(this)
  }

  on(name, handler) { (this.handlers[name] ||= []).push(handler); return this }
  once(name, handler) { (this.onceHandlers[name] ||= []).push(handler); return this }
  emit(name) {
    for (const handler of this.handlers[name] || []) handler()
    for (const handler of this.onceHandlers[name] || []) handler()
    this.onceHandlers[name] = []
  }
  setBounds(bounds) { this.bounds = bounds }
  showInactive() { this.shown += 1 }
  setIgnoreMouseEvents() {}
  setAlwaysOnTop() {}
  loadURL() { return Promise.resolve() }
  loadFile() { return Promise.resolve() }
  close() { this.closeCalled = true }
  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.emit('closed')
  }
  isDestroyed() { return this.destroyed }
}
FakeWindow.created = []

function loadOverlayManager() {
  const logs = []
  const source = readFileSync(new URL('../electron/modules/chaosRecipe/overlay.js', import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace("import { BrowserWindow, screen } from 'electron'\n", '')
    .replace("import path from 'node:path'\n", '')
    .replace("import { fileURLToPath } from 'node:url'\n", '')
    .replace("import { normalizeGridRegion } from './coordinates.js'\n", '')
    .replace("import { createLoadAwarePublisher } from '../window/loadAwarePublisher.js'\n", '')
    .replace("const moduleDir = path.dirname(fileURLToPath(import.meta.url))", "const moduleDir = ''")
    .replace('export class ChaosRecipeOverlayManager', 'class ChaosRecipeOverlayManager')
  const sandbox = {
    console: { log: (...parts) => logs.push(parts.filter(Boolean).join(' ')) },
    BrowserWindow: FakeWindow,
    screen: {},
    path,
    fileURLToPath: () => '',
    normalizeGridRegion,
    createLoadAwarePublisher,
    structuredClone,
    JSON,
    Math,
    Number,
    Array,
    Object,
    Boolean,
    String,
    process: { platform: 'linux', env: {} }
  }
  vm.runInNewContext(`${source}\nglobalThis.OverlayManager = ChaosRecipeOverlayManager`, sandbox)
  return { OverlayManager: sandbox.OverlayManager, logs }
}

function previewSnapshot() {
  return {
    region: REGION,
    tabId: 1,
    tabName: '仓库页',
    columns: 12,
    items: [{ id: 'a' }],
    status: 'preview',
    recipeId: 'chaos',
    recipeLabel: '混沌石',
    message: '1 套'
  }
}

function parseLogs(logs) {
  return logs.map((line) => {
    assert.match(line, /^\[商城配方高亮\] /)
    return JSON.parse(line.slice('[商城配方高亮] '.length))
  })
}

test('窗口被外部销毁后不残留幽灵预览状态，可重新创建高亮', () => {
  FakeWindow.created = []
  const { OverlayManager, logs } = loadOverlayManager()
  const manager = new OverlayManager()

  assert.equal(manager.create(previewSnapshot()), true)
  const first = FakeWindow.created[0]
  first.emit('ready-to-show')
  assert.equal(first.shown, 1)
  assert.equal(manager.getState()?.status, 'preview')

  first.emit('closed')
  assert.equal(manager.getState(), null)

  assert.equal(manager.create(previewSnapshot()), true)
  const second = FakeWindow.created[1]
  assert.notEqual(second, first)
  assert.equal(manager.getState()?.status, 'preview')

  manager.close()
  assert.equal(second.closeCalled, true)
  const events = parseLogs(logs).map((entry) => entry.event)
  assert.ok(events.includes('show'))
  assert.ok(events.includes('close'))
})

test('渲染进程崩溃后复用前销毁重建并恢复状态发布', () => {
  FakeWindow.created = []
  const { OverlayManager, logs } = loadOverlayManager()
  const manager = new OverlayManager()

  assert.equal(manager.create(previewSnapshot()), true)
  const first = FakeWindow.created[0]
  first.webContents.crashed = true

  assert.equal(manager.create(previewSnapshot()), true)
  const second = FakeWindow.created[1]
  assert.notEqual(second, first)
  assert.equal(first.destroyed, true)
  assert.equal(manager.getState()?.status, 'preview')
  assert.ok(second.webContents.sent.some(([channel, state]) =>
    channel === 'chaos-recipe-overlay-state' && state.status === 'preview'))

  first.emit('closed')
  assert.equal(manager.getState()?.status, 'preview')

  assert.ok(parseLogs(logs).some((entry) => entry.event === 'renderer-crashed'))
})

test('旧窗口的 closed 回调不会误伤重建后的新窗口', () => {
  FakeWindow.created = []
  const { OverlayManager } = loadOverlayManager()
  const manager = new OverlayManager()

  assert.equal(manager.create(previewSnapshot()), true)
  const first = FakeWindow.created[0]
  first.webContents.crashed = true
  assert.equal(manager.create(previewSnapshot()), true)
  const second = FakeWindow.created[1]

  first.emit('closed')
  first.emit('closed')
  assert.equal(manager.getState()?.status, 'preview')

  second.emit('closed')
  assert.equal(manager.getState(), null)
})

test('校准区域非法时 create 静默拒绝且不创建窗口', () => {
  FakeWindow.created = []
  const { OverlayManager, logs } = loadOverlayManager()
  const manager = new OverlayManager()

  assert.equal(manager.create({ ...previewSnapshot(), region: { left: 10, top: 10, right: 5, bottom: 5 } }), false)
  assert.equal(manager.create({ ...previewSnapshot(), region: null }), false)
  assert.equal(FakeWindow.created.length, 0)
  assert.equal(manager.getState(), null)
  const entries = parseLogs(logs)
  assert.equal(entries.length, 2)
  for (const entry of entries) {
    assert.equal(entry.event, 'create-skipped')
    assert.equal(entry.reason, 'invalid-region')
  }
})

test('诊断日志只包含事件字段，不包含物品详情或路径信息', () => {
  FakeWindow.created = []
  const { OverlayManager, logs } = loadOverlayManager()
  const manager = new OverlayManager()
  manager.create(previewSnapshot())
  manager.close()
  for (const entry of parseLogs(logs)) {
    const text = JSON.stringify(entry)
    assert.doesNotMatch(text, /账号|token|session|poessid/i)
    assert.ok(['show', 'close', 'create-skipped', 'renderer-crashed'].includes(entry.event))
  }
})

test('预览 IPC 在 create 失败时抛出可定位的校准错误', () => {
  const source = readFileSync(new URL('../electron/modules/ipc/chaosRecipe.js', import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n')
  const handler = source.slice(source.indexOf("ipcMain.handle('chaos-recipe-control-preview'"), source.indexOf("ipcMain.handle('chaos-recipe-control-action'"))
  assert.match(handler, /const created = service\.overlay\.create\(/)
  assert.match(handler, /if \(!created\)/)
  assert.match(handler, /INVALID_REQUEST/)
  assert.match(handler, /无法定位仓库区域/)
})

function loadAutomationManager() {
  const source = readFileSync(new URL('../electron/modules/chaosRecipe/automation.js', import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n')
  const executable = source
    .slice(source.indexOf('function parseEvents'))
    .replace('export class ChaosRecipeAutomationManager', 'class ChaosRecipeAutomationManager') +
    '\nglobalThis.AutomationManager = ChaosRecipeAutomationManager'
  const sandbox = {
    console,
    setTimeout,
    structuredClone,
    app: { isPackaged: false, getAppPath: () => '' },
    spawn() { throw new Error('测试中禁止真实启动取件进程') },
    spawnOperationProcess({ pythonPath, scriptPath, args = [], fallbackSpawn }) { return fallbackSpawn(pythonPath, [scriptPath, ...args]) },
    fs: { existsSync: () => true, writeFileSync: () => {} },
    path,
    moduleDir: '',
    pythonAutomationTiming: () => ({}),
    CHAOS_ERROR_CODES: {
      AUTOMATION_RUNNING: 'AUTOMATION_RUNNING',
      INVENTORY_FULL: 'INVENTORY_FULL',
      GAME_NOT_FOREGROUND: 'GAME_NOT_FOREGROUND',
      ITEM_MISMATCH: 'ITEM_MISMATCH'
    },
    ChaosRecipeError: class extends Error {},
    resolveStashGridLayout: () => ({ region: { left: 0, top: 0, right: 120, bottom: 120 } }),
    process: { platform: 'linux', env: {} }
  }
  vm.runInNewContext(executable, sandbox)
  return sandbox.AutomationManager
}

test('取件启动阶段同步失败时关闭高亮浮窗并释放锁', async () => {
  const AutomationManager = loadAutomationManager()
  const closed = []
  const released = []
  const overlay = { create: () => true, close: () => closed.push('close') }
  const automationLock = {
    acquire: () => ({ success: true }),
    release: (owner) => released.push(owner)
  }
  const manager = new AutomationManager({
    python: { detectPythonPathWithModules: () => 'python' },
    fileWatcher: { getFilePaths: () => ({ tempDir: 'temp' }) },
    getMainWindow: () => null,
    overlay,
    automationLock,
    windowActivation: { activateGame: async () => ({ success: true }) }
  })
  const plan = {
    recipeId: 'chaos',
    recipeLabel: '混沌石',
    itemCount: 1,
    tabs: [{ tabId: 1, tabName: '仓库页', columns: 12, items: [{ id: 'a' }] }]
  }
  await assert.rejects(
    () => manager.start(plan, { calibration: { root: REGION } }),
    /禁止真实启动取件进程/
  )
  assert.equal(manager.status, 'stopped')
  assert.deepEqual(closed, ['close'])
  assert.deepEqual(released, ['混沌配方取件'])
})
})()

// === Merged from faustusBandReorder.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const createFaustusBandReorderTransaction = _m9_createFaustusBandReorderTransaction
  const moveFaustusBand = _m9_moveFaustusBand
  const reorderFaustusBands = _m9_reorderFaustusBands
const ids = bands => bands.map(band => band.id)
const initialBands = () => [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]

test('浮士德分段按稳定 ID 跨多行实时预览且无效目标不改变顺序', () => {
  assert.deepEqual(ids(reorderFaustusBands(initialBands(), 'a', 'd')), ['b', 'c', 'd', 'a'])
  assert.equal(reorderFaustusBands(initialBands(), 'missing', 'd'), null)
  assert.equal(reorderFaustusBands(initialBands(), 'a', 'a'), null)
})

test('浮士德分段拖拽只在提交时持久化一次', () => {
  let bands = initialBands()
  let commits = 0
  const transaction = createFaustusBandReorderTransaction({
    getBands: () => bands,
    preview: next => { bands = next },
    commit: next => { bands = next; commits += 1 },
    locked: () => false
  })
  assert.equal(transaction.begin('a'), true)
  assert.equal(transaction.preview('c'), true)
  assert.deepEqual(ids(bands), ['b', 'c', 'a', 'd'])
  assert.equal(commits, 0)
  assert.equal(transaction.commit(), true)
  assert.equal(transaction.commit(), false)
  assert.equal(commits, 1)
})

test('浮士德分段拖拽取消恢复快照且重复取消安全忽略', () => {
  let bands = initialBands()
  const transaction = createFaustusBandReorderTransaction({
    getBands: () => bands,
    preview: next => { bands = next },
    commit: () => assert.fail('取消不应持久化'),
    locked: () => false
  })
  transaction.begin('d')
  transaction.preview('a')
  assert.deepEqual(ids(bands), ['d', 'a', 'b', 'c'])
  assert.equal(transaction.cancel(), true)
  assert.deepEqual(ids(bands), ['a', 'b', 'c', 'd'])
  assert.equal(transaction.cancel(), false)
})

test('浮士德分段运行态禁止开始拖拽事务', () => {
  let running = true
  let bands = initialBands()
  const transaction = createFaustusBandReorderTransaction({
    getBands: () => bands,
    preview: next => { bands = next },
    commit: next => { bands = next },
    locked: () => running
  })
  assert.equal(transaction.begin('a'), false)
  running = false
  assert.equal(transaction.begin('a'), true)
})

test('浮士德分段键盘单步移动遵守边界', () => {
  assert.deepEqual(ids(moveFaustusBand(initialBands(), 1, -1)), ['b', 'a', 'c', 'd'])
  assert.deepEqual(ids(moveFaustusBand(initialBands(), 1, 1)), ['a', 'c', 'b', 'd'])
  assert.equal(moveFaustusBand(initialBands(), 0, -1), null)
  assert.equal(moveFaustusBand(initialBands(), 3, 1), null)
})
})()
