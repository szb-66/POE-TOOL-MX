import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { mergeSanctumTextScan } from '../electron/modules/sanctum/relicScan.js'
import { AutomationLock } from '../electron/modules/automation/lock.js'
import { relicProfile } from '../shared/sanctumLive.js'
import { runPython } from './helpers/python.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'

const catalog = JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/catalog.json', import.meta.url)))
const png = fs.readFileSync(new URL('./fixtures/sanctum/map-entry-label.png', import.meta.url)).toString('base64')
const environment = { width: 800, height: 600, dpi: 96 }
const region = { x: 0, y: 0, width: 120, height: 80 }
const profile = relicProfile({ version: 1, environment, regionId: 'locker', columns: 3, rows: 2,
  mapRegion: region, anchorRegion: region, titleRegion: region, tooltipRegion: region, anchor: { png }, preview: { png } })
const rawText = '物品类别: 遗物\n稀有度: 魔法\n坚韧的 香炉遗物\n--------\n物品等级: 85\n--------\n增加 +22 最大坚毅'

function fixture({ mode, shutdown } = {}) {
  const lock = new AutomationLock(), commands = [], copied = []
  let hidden = false, inspections = 0
  const driver = new SanctumLiveDriver({ detection: detection(), catalog, wait: async () => {},
    withHidden: async action => { hidden = true; try { return await action() } finally { hidden = false } },
    makeClient: () => ({ shutdown: async () => { if (shutdown) await shutdown(lock); commands.push('closed') },
      async request(command, input) {
        commands.push(command)
        if (command === 'environment') return { environment, clientBounds: { x: 0, y: 0, ...environment } }
        assert.equal(lock.getState().locked, true)
        if (command === 'arm') return {}
        assert.equal(hidden, true)
        if (command === 'neutralGrid') return {}
        if (command === 'inspectGrid') {
          inspections++
          if (mode === 'final-lock' && inspections === 3) { lock.release(); lock.acquire('other') }
          return { fingerprint: mode === 'unstable' && inspections > 1 ? 'changed' : 'grid',
            clientBounds: { x: 0, y: 0, width: 800, height: 600 },
            cells: Array.from({ length: 6 }, (_, i) => ({ x: i % 3, y: Math.floor(i / 3), status: i % 3 === 2 ? 'empty' : 'unknown' })) }
        }
        if (command === 'copyCell') {
          copied.push([input.x, input.y])
          if (mode === 'copy-lock') { lock.release(); lock.acquire('other') }
          return { rawText, fingerprint: mode === 'copy-change' ? 'changed' : 'grid',
            footprint: mode === 'unknown' ? null : { x: input.x, y: 0, width: 1, height: 2 } }
        }
        throw new Error(command)
      } }) })
  return { driver, lock, commands, copied, scan: () => driver.scanRelics(profile, new AbortController().signal, lock) }
}

test('复制扫描按视觉占格跳过已覆盖格，相同文本保留两个实例并在重扫维持 ID', async () => {
  const f = fixture(), scan = await f.scan()
  assert.deepEqual(f.copied, [[0, 0], [1, 0]])
  const first = mergeSanctumTextScan([], scan, catalog)
  assert.equal(first.complete, true)
  assert.equal(first.inventory.length, 2)
  assert.notEqual(first.inventory[0].id, first.inventory[1].id)
  assert.deepEqual(mergeSanctumTextScan(first.inventory, await f.scan(), catalog).inventory.map(item => item.id), first.inventory.map(item => item.id))
  assert.equal(f.lock.getState().locked, false)
})

test('占格无法确认时保留旧物品为未知，不用复制文本推测位置或确认完整扫描', async () => {
  const first = mergeSanctumTextScan([], await fixture().scan(), catalog)
  const result = mergeSanctumTextScan(first.inventory, await fixture({ mode: 'unknown' }).scan(), catalog)
  assert.equal(result.complete, false)
  assert.deepEqual(result.inventory.map(item => item.id), first.inventory.map(item => item.id))
  assert.ok(result.inventory.every(item => item.status === 'unknown'))
})

test('扫描跳过锁定和忽略格，跨不可用格的物品保持未知', async () => {
  const f = fixture()
  const masked = { ...profile, cellStates: ['locked', 'usable', 'usable', 'usable', 'ignored', 'usable'] }
  const scan = await f.driver.scanRelics(masked, new AbortController().signal, f.lock)
  assert.ok(f.copied.every(([x, y]) => !(x === 0 && y === 0) && !(x === 1 && y === 1)))
  assert.equal(scan.observations.find(cell => cell.x === 1 && cell.y === 0).status, 'unknown')
  assert.equal(scan.observations.find(cell => cell.x === 0 && cell.y === 0).status, 'disabled')
  assert.equal(scan.observations.find(cell => cell.x === 1 && cell.y === 1).status, 'ignored')
  assert.equal(mergeSanctumTextScan([], scan, catalog).complete, false)
})

test('不稳定、复制期间变化及迟到失锁均撤销扫描，互斥冲突不产生输入', async () => {
  for (const mode of ['unstable', 'copy-change', 'copy-lock', 'final-lock']) {
    const f = fixture({ mode })
    await assert.rejects(f.scan(), /稳定|变化|失效/)
    assert.equal(f.commands.at(-1), 'closed')
    if (mode.endsWith('lock')) assert.equal(f.lock.getState().owner, 'other')
  }
  const f = fixture(); f.lock.acquire('other')
  await assert.rejects(f.scan(), /另一项/)
  assert.deepEqual(f.commands, ['environment', 'closed'])
  assert.equal(f.lock.getState().owner, 'other')
})

test('扫描退出等待原生进程关闭之后才释放锁', async () => {
  let finish, reached
  const ready = new Promise(resolve => { reached = resolve })
  const f = fixture({ shutdown: async lock => {
    assert.equal(lock.getState().locked, true); reached()
    await new Promise(resolve => { finish = resolve })
  } })
  const task = f.scan(); await ready
  assert.equal(f.lock.getState().locked, true)
  finish(); await task
  assert.equal(f.lock.getState().locked, false)
})

test('位置高亮重新只读核对网格，变化后拒绝旧位置且不发送键鼠命令', async () => {
  for (const changed of [false, true]) {
    const commands = [], observations = []
    const current = { environment, clientBounds: { x: 0, y: 0, width: 800, height: 600 } }
    const driver = new SanctumLiveDriver({ detection: detection(), catalog, wait: async () => {}, withHidden: action => action(),
      makeClient: () => ({ shutdown: async () => {}, request: async command => {
        commands.push(command)
        assert.ok(['environment', 'inspectGrid'].includes(command))
        return { ...current, fingerprint: changed && observations.length ? 'changed' : 'grid' }
      } }) })
    const task = driver.watchRelic(profile, { fingerprint: 'grid', scanId: 'scan' }, new AbortController().signal, value => observations.push(value))
    if (changed) await assert.rejects(task, /重新扫描/)
    else await task
    assert.equal(observations.length, changed ? 1 : 15)
    assert.equal(observations[0].regions.locker.scanId, 'scan')
  }
})

test('扫描经服务更新库存后可重验高亮，禁用撤销迟到结果及运行状态', async () => {
  const f = fixture(), service = new SanctumService({ catalog })
  service.attachLiveDriver(f.driver, f.lock); service.setEnabled(true)
  service.state.relicCalibrations.locker = profile
  await service.scanRelics('locker')
  assert.equal(service.getState().inventory.length, 2)
  assert.equal(service.getState().running, false)
  assert.equal(service.liveController, null)
  let finish, observationCallback, seenSignal
  f.driver.watchRelic = async (_profile, _evidence, signal, onObservation) => {
    seenSignal = signal; observationCallback = onObservation
    await new Promise(resolve => { finish = resolve })
  }
  const task = service.highlightRelic(service.state.inventory[0].id)
  await new Promise(resolve => setImmediate(resolve))
  service.setEnabled(false)
  assert.equal(seenSignal.aborted, true)
  observationCallback({ foreground: true, interfaceMatched: true })
  assert.equal(service.getState().highlight, null)
  finish(); await task
  assert.equal(service.getState().observation, null)
  assert.equal(service.getState().running, false)
  await service.shutdown()
})

test('原生网格视觉证据区分占格、空格与歧义；复制组合完整释放且用户按键时零输入', () => {
  const result = runPython(`
import sys,json,numpy as np,cv2
sys.path.insert(0,'src/assets/scripts')
from sanctum_grid import inspect_grid,hover_footprint,png,cell_image,copy_keys
before=np.full((80,120,3),90,dtype=np.uint8)
after=before.copy(); cv2.rectangle(after,(0,0),(39,79),(200,200,200),2)
footprint=hover_footprint(before,after,0,0,3,2)
template=png(cell_image(before,0,0,3,2))
empty=inspect_grid(before,3,2,{'empty':template})
ambiguous=inspect_grid(before,3,2,{'empty':template,'locked':template})
class Sender:
    def __init__(self,partial): self.calls=[]; self.partial=partial
    def __call__(self,count,events,size):
        self.calls.append([(event.value.ki.wVk,event.value.ki.dwFlags) for event in events])
        return 2 if self.partial else count
class User:
    def __init__(self,held=False,partial=False): self.held=held; self.SendInput=Sender(partial)
    def GetAsyncKeyState(self,key): return 0x8000 if self.held else 0
calls=[]
for held,partial in [(False,False),(True,False),(False,True)]:
    user=User(held,partial)
    try: copy_keys(user)
    except ValueError: pass
    calls.append(user.SendInput.calls)
print(json.dumps({'footprint':footprint,'unchanged':hover_footprint(before,before,0,0,3,2),
  'empty':all(c['status']=='empty' for c in empty['cells']),
  'ambiguous':all(c['status']=='unknown' for c in ambiguous['cells']),'calls':calls}))
`)
  const chord = [[17, 0], [67, 0], [67, 2], [17, 2]]
  assert.deepEqual(result, { footprint: { x: 0, y: 0, width: 1, height: 2 }, unchanged: null,
    empty: true, ambiguous: true, calls: [[chord], [], [chord, [[67, 2], [17, 2]]]] })
})

function detection() {
  return { getTitleConfig: () => ({ templates: { 'sanctum-map': { png, environment }, 'sanctum-locker': { png, environment } }, threshold: .8 }),
    registerConsumer: async () => {}, unregisterConsumer: () => {}, subscribe: () => () => {},
    getState: () => ({ running: true, foreground: true, receivedAt: Date.now(), interfaces: { 'sanctum-map': { matched: true }, 'sanctum-locker': { matched: true } } }) }
}
