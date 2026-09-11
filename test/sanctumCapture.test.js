import test from 'node:test'
import assert from 'node:assert/strict'
import { SanctumCapture, validateSanctumEnvironment } from '../electron/modules/sanctum/capture.js'
import { AutomationLock } from '../electron/modules/automation/lock.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'

const environment = { windowId: 'game', width: 1920, height: 1080, dpi: 96 }
const safety = () => ({ foreground: true, userTakeover: false, mapOpen: true, interfaceMatched: true, overlayExcluded: true, environment: { ...environment } })
const room = (id, detailFingerprint = 'one') => ({ id, revealed: true, detailFingerprint, column: id === 'a' ? 0 : 1 })
const frame = (timestamp, fingerprint = 'map', rooms = [room('a')], floorId = 'f') => ({ ...safety(), timestamp, fingerprint,
  floor: { identityConfirmed: true, runId: 'r', floorId, currentRoomId: 'a', rooms, edges: [] } })
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }

test('已确认进度跳过当前及过去列，初始或位置未知不跳过；同层重启按逻辑房间复用已读结果', async () => {
  const f = frame(0, 'map', [room('a'), room('b'), { ...room('c'), column: 2 }])
  f.floor.positionStatus = 'confirmed'
  f.floor.currentRoomId = 'b'
  const item = fixture([f])
  await item.capture.run(environment, () => {})
  assert.deepEqual(item.data.inputs, ['c'])
  await item.capture.run(environment, () => {})
  assert.deepEqual(item.data.inputs, ['c'])
  f.floor.positionStatus = 'unknown'
  await item.capture.run(environment, () => {})
  assert.deepEqual(item.data.inputs, ['c', 'a', 'b'])
  f.floor.runId = 'new-run'
  f.floor.positionStatus = 'initial'; f.floor.initialSelection = true
  await item.capture.run(environment, () => {})
  assert.deepEqual(item.data.inputs, ['c', 'a', 'b', 'a', 'b', 'c'])
})

test('停止再开始重读失败详情，不把失败缓存当作完成', async () => {
  const item = fixture([frame(0)])
  let calls = 0
  item.driver.hover = async () => { calls++; return { patch: { detailsStatus: calls === 1 ? 'failed' : 'matched' } } }
  await item.capture.run(environment, () => {})
  assert.equal(calls, 1)
  await item.capture.run(environment, () => {})
  assert.equal(calls, 2)
})

test('重启复用逻辑房间，不检查图片指纹；位置身份不同才重新读取', async () => {
  const f = frame(0)
  f.floor.rooms[0].resumeFingerprint = 'old-art'
  const item = fixture([f])
  await item.capture.run(environment, () => {})
  f.floor.rooms[0].resumeFingerprint = 'new-art'
  await item.capture.run(environment, () => {})
  f.floor.rooms[0].column = 3
  await item.capture.run(environment, () => {})
  assert.deepEqual(item.data.inputs, ['a','a'])
})
function fixture(frames) {
  let listener
  const data = { safety: safety(), inputs: [], disposed: false }
  const driver = {
    inspect: () => ({ mapFingerprint: data.current?.fingerprint, ...data.safety }),
    subscribeSafety(callback) { listener = callback; return () => { data.disposed = true; listener = null } },
    async *frames() { for (const value of frames) { data.current = value; yield value } },
    async hover(room, { guard }) { guard(); data.inputs.push(room.id); return { mapFingerprint: data.current.fingerprint,
      patch: { name: room.detailFingerprint, detailsStatus: 'matched', id: 'forged', column: 99 } } }
  }
  const lock = new AutomationLock()
  return { data, driver, lock, notify: value => { data.safety = value; listener?.(value) }, capture: new SanctumCapture({ driver, automationLock: lock }) }
}

test('隐藏房间的 OCR 不能建立历史知识，真正揭示后必须重新读取',async()=>{
  const f=frame(0),item=fixture([f]);f.floor.mapKey='map'
  Object.assign(f.floor.rooms[0],{revealed:false,revealStatus:'unknown'})
  let reads=0,latest
  item.driver.hover=async()=>{reads++;return {patch:{detailsStatus:'matched',rewards:[{currency:'神圣石',quantity:999,timing:'run'}],knowledge:{rewards:{status:'known',source:'observed'}}}}}
  await item.capture.run(environment,value=>{latest=value})
  assert.equal(latest.rooms[0].knowledge.rewards.status,'unrevealed')
  assert.equal(latest.rooms[0].knowledge.rewards.mapKey,undefined)
  f.floor.rooms[0].revealed=true
  await item.capture.run(environment,value=>{latest=value})
  assert.equal(reads,2)
  assert.equal(latest.rooms[0].knowledge.rewards.status,'known')
  assert.equal(latest.rooms[0].knowledge.rewards.mapKey,'map')
})

test('过滤发生在悬停前，保留图结构与正确进度；后续帧不得追加本轮队列', async () => {
  const f = frame(0, 'map', ['a','b','c','d'].map((id,column) => ({ ...room(id), column, contentStatus:'present' })))
  Object.assign(f.floor, { positionStatus:'confirmed', currentRoomId:'a' })
  f.floor.rooms[1].contentStatus = 'empty'
  f.floor.edges = [{from:'a',to:'b',status:'matched',availability:'gold',traversal:'available'},
    {from:'b',to:'c',status:'matched',availability:'unavailable',traversal:'unavailable'}]
  const later = structuredClone(f)
  later.floor.rooms[1].contentStatus = 'present'
  Object.assign(later.floor.edges[1], { availability:'gold',traversal:'available' })
  const item = fixture([f,later]), outputs=[]
  await item.capture.run(environment, value => outputs.push(value))
  assert.deepEqual(item.data.inputs, ['d'])
  const maps = outputs.filter(value => value.captureProgress.stage === 'map')
  assert.deepEqual(maps.map(value => value.captureProgress.total), [1])
  assert.ok(outputs.every(value => value.rooms.length === 4 && value.edges.length === 2))
  assert.equal(maps[0].rooms[1].captureSkipReason, 'empty')
})

test('窗口和 DPI 缺失、尺寸非法时拒绝预检', () => {
  for (const patch of [{ dpi: null }, { dpi: NaN }, { width: -1 }, { height: 2.5 }, { windowId: '' }]) {
    assert.throws(() => validateSanctumEnvironment({ ...environment, ...patch }), /未确认/)
  }
  assert.deepEqual(validateSanctumEnvironment({ ...environment, extra: true }), environment)
})

test('等待原生悬停期间失锁立即取消，迟到结果不能发布或释放新所有者', async () => {
  const item = fixture([frame(0), frame(300)]), entered = deferred(), pending = deferred()
  let signal
  item.driver.hover = async (_room, options) => { signal = options.signal; entered.resolve(); return pending.promise }
  const floors = []
  const task = item.capture.run(environment, value => { if (value) floors.push(value) })
  const rejected = assert.rejects(task, /锁已失效/)
  await entered.promise
  item.lock.release(item.lock.getState().owner)
  assert.equal(signal.aborted, true)
  item.lock.acquire('other')
  pending.resolve({ mapFingerprint: 'map', patch: { name: 'late' } })
  await rejected
  assert.equal(floors.length, 2)
  assert.equal(floors[0].captureProgress.stage, 'map')
  assert.equal(floors[0].rooms[0].name, undefined)
  assert.equal(item.lock.getState().owner, 'other')
  assert.equal(item.lock.listeners.size, 0)
})

test('立即显示地图并悬停，相同内容不重复输入，后续地图变化不追加采集', async () => {
  const { capture, data, lock } = fixture([frame(0), frame(100), frame(300), frame(600),
    frame(700, 'changed', [room('a'), room('b')]), frame(1000, 'changed', [room('a'), room('b')]),
    frame(1100, 'changed-again', [room('a', 'two'), room('b')]), frame(1400, 'changed-again', [room('a', 'two'), room('b')])])
  const results = []
  await capture.run(environment, value => results.push(value))
  assert.deepEqual(data.inputs, ['a'])
  assert.equal(results.at(-1).rooms[0].name, 'one')
  assert.equal(results.at(-1).rooms[0].id, 'a')
  assert.equal(results.at(-1).rooms[0].column, 0)
  assert.equal(lock.getState().locked, false)
  assert.equal(data.disposed, true)
})

test('动画与时间戳不阻塞，未知楼层及跨层清除详情缓存', async () => {
  const unknown = frame(500); unknown.floor.identityConfirmed = false
  const { capture, data } = fixture([frame(0), frame(300), unknown, frame(600), frame(600), frame(700, 'moving'),
    frame(800, 'map', [room('a')], 'next'), frame(1100, 'map', [room('a')], 'next')])
  const results = []
  await capture.run(environment, value => results.push(value))
  assert.deepEqual(data.inputs, ['a'])
  assert.ok(results.every(value => value?.identityConfirmed === true))
  assert.equal(results.at(-1).floorId, 'f')
})

test('前台、接管、地图、锚点、截图排除和环境变化全部禁止输入', async () => {
  for (const patch of [{ foreground: false }, { userTakeover: true }, { userTakeover: undefined }, { mapOpen: false },
    { interfaceMatched: false }, { overlayExcluded: false }, { environment: { ...environment, dpi: 144 } },
    { environment: { ...environment, windowId: 'other' } }, { environment: { ...environment, width: 1280 } }]) {
    const { capture, data, lock } = fixture([frame(0), frame(300)])
    data.safety = { ...safety(), ...patch }
    await assert.rejects(capture.run(environment, () => {}))
    assert.deepEqual(data.inputs, [])
    assert.equal(lock.getState().locked, false)
  }
})

test('锁冲突不输入、不释放其他任务的锁；锁失效后不得继续悬停', async () => {
  const blocked = fixture([frame(0), frame(300)])
  blocked.lock.acquire('craft')
  await assert.rejects(blocked.capture.run(environment, () => {}), /另一项自动化/)
  assert.deepEqual(blocked.data.inputs, [])
  assert.equal(blocked.lock.getState().owner, 'craft')
  const lost = fixture([frame(0), frame(300)])
  lost.driver.hover = async (_room, { guard }) => {
    lost.lock.release(lost.lock.getState().owner)
    lost.lock.acquire('craft')
    guard()
  }
  await assert.rejects(lost.capture.run(environment, () => {}), /锁已失效/)
  assert.equal(lost.lock.getState().owner, 'craft')
})

test('悬停中用户接管立即取消，迟到结果不发布且不自动恢复', async () => {
  const item = fixture([frame(0), frame(300), frame(600)])
  const entered = deferred(), pending = deferred(), results = []
  let signal
  item.driver.hover = async (_room, options) => { options.guard(); signal = options.signal; entered.resolve(); return pending.promise }
  const run = item.capture.run(environment, value => results.push(value))
  await entered.promise
  item.notify({ ...safety(), userTakeover: true })
  assert.equal(signal.aborted, true)
  assert.equal(item.lock.getState().locked, true)
  await assert.rejects(item.capture.run(environment, () => {}), /正在退出/)
  item.notify(safety())
  pending.resolve({ mapFingerprint: 'map', patch: { name: 'late' } })
  await assert.rejects(run, /接管/)
  assert.equal(results.length, 2)
  assert.equal(results[0].rooms[0].name, undefined)
  assert.equal(item.lock.getState().locked, false)
  assert.equal(item.capture.session, null)
})

test('每次物理输入重新预检，悬停期间地图改变时丢弃详情', async () => {
  const changed = fixture([frame(0), frame(300)])
  changed.driver.hover = async (_room, { guard }) => {
    changed.data.safety = { ...safety(), foreground: false }
    guard()
    assert.fail('不应产生输入')
  }
  const interrupted = []
  assert.equal(await changed.capture.run(environment, value => interrupted.push(value)), 'partial')
  assert.match(interrupted.at(-1).rooms[0].failureReason, /前台/)
  const moved = fixture([frame(0)])
  moved.driver.hover = async () => ({ targetChanged: true, patch: { name: 'wrong' } })
  const results = []
  await moved.capture.run(environment, value => results.push(value))
  assert.equal(results.at(-1).rooms[0].name, undefined)
  assert.equal(results.at(-1).rooms[0].detailsStatus, 'unknown')

})

test('服务 End、禁用和退出均取消采集；锁等待输入退出后释放，迟到结果无效', async () => {
  for (const action of ['emergencyStop', 'disable', 'shutdown']) {
    const item = fixture([frame(0), frame(300)])
    const entered = deferred(), pending = deferred()
    let signal
    item.driver.hover = async (_room, options) => { signal = options.signal; entered.resolve(); return pending.promise }
    const service = new SanctumService({ captureDriver: item.driver, automationLock: item.lock })
    service.setEnabled(true)
    const run = service.startCapture(environment)
    await entered.promise
    const cleanup = action === 'shutdown' ? service.shutdown() : action === 'disable' ? service.setEnabled(false) : service.emergencyStop()
    assert.equal(signal.aborted, true)
    assert.equal(service.getState().running, false)
    assert.equal(service.getState().recommendation, null)
    assert.equal(item.lock.getState().locked, true)
    pending.resolve({ mapFingerprint: 'map', patch: { name: 'late' } })
    await run; await cleanup
    assert.equal(service.getState().floor.identityConfirmed, false)
    assert.equal(item.lock.getState().locked, false)
    assert.equal(item.data.disposed, true)
    if (action !== 'shutdown') await service.shutdown()
  }
})

test('缺少实机驱动时服务不开放采集，离线回放不占用自动化锁', async () => {
  const lock = new AutomationLock()
  lock.acquire('craft')
  const service = new SanctumService({ automationLock: lock, replay: async () => frame(0).floor })
  service.setEnabled(true)
  assert.equal(service.getState().liveCaptureAvailable, false)
  await assert.rejects(service.startCapture(environment), /尚未启用/)
  await service.rescan('sample')
  assert.equal(lock.getState().owner, 'craft')
  await service.shutdown()
})

test('自然结束保留结果及可执行推荐，不停留采集中', async () => {
  const item = fixture([])
  const service = new SanctumService({ captureDriver: item.driver, automationLock: item.lock })
  service.setEnabled(true)
  item.driver.frames = async function *() {
    for (const value of [frame(0), frame(300), frame(400, 'new'), frame(700, 'new')]) {
      item.data.current = value
      yield value
      if (value.timestamp === 300) service.setMarks({ targets: ['a'], avoid: [] })
      if (value.timestamp === 400) {
        assert.ok(service.getState().recommendation)
        assert.equal(service.getState().floor.rooms[0].name, 'one')
      }
      if (value.timestamp === 700) assert.deepEqual(service.getState().marks.targets, ['a'])
    }
  }
  await service.startCapture(environment)
  assert.equal(service.getState().floor.identityConfirmed, true)
  assert.equal(service.getState().running, false)
  assert.equal(service.getState().status, 'ready')
  assert.ok(service.getState().recommendation)
  assert.deepEqual(item.data.inputs, ['a'])
  await service.shutdown()
})
