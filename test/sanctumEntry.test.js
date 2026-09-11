import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { reuseSanctumEffects } from '../electron/modules/sanctum/effectLedger.js'
import { SanctumControlOverlay, sanctumControlState } from '../electron/modules/sanctum/controlOverlay.js'
import { SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { emptySanctumState } from '../shared/sanctum.js'
import { runPython } from './helpers/python.js'

const floor = currentRoomId => ({ floorId: 'floor:0', width: 800, height: 600, currentRoomId,
  rooms: ['a', 'b', 'c'].map((id, x) => ({ id, x, y: 0, width: 40, height: 60, type: 'reward', detailsStatus: 'matched',
    effects: id === 'b' ? [{ rule: 'cannotRecover', status: 'matched', category: 'minorAffliction' }] : [], afflictions: [] })),
  edges: [{ from: 'a', to: 'b', status: 'matched', traversal: ['b', 'c'].includes(currentRoomId) ? 'visited' : 'available' }, { from: 'b', to: 'c', status: 'matched', traversal: currentRoomId === 'c' ? 'visited' : 'available' }] })

test('位置快照不累加经过房间的效果；推荐不提交且变化要求重新读取', () => {
  const initial = { scope:'same', floor:floor('a'),effects:[],complete:true }
  assert.deepEqual(reuseSanctumEffects(initial,floor('a'),'same').effects,[])
  for (const id of ['b','c']) assert.equal(reuseSanctumEffects(initial,floor(id),'same'),null)
  assert.equal(reuseSanctumEffects(initial,floor('a'),'new'),null)
  assert.deepEqual(initial.effects,[])
})

test('未知效果、交易房间、分叉路径和缺少当前位置均要求状态校正', () => {
  for (const change of [f => { f.rooms[1].effects = [{ status: 'unknown' }] },
    f => { f.rooms[1].type = 'merchant' }, f => { f.rooms[1].detailsStatus = 'unknown' },
    f => { f.edges.push({ from: 'a', to: 'c', status: 'matched' }) }]) {
    const base = floor('a'); change(base)
    const target = structuredClone(base); target.currentRoomId = 'c'; target.edges.forEach(edge => { edge.traversal = 'visited' })
    assert.equal(reuseSanctumEffects({ scope: 'same', floor: base, effects: [], complete: true }, target, 'same'), null)
  }
  assert.equal(reuseSanctumEffects({ scope: 'same', floor: floor('a'), effects: [], complete: true }, floor(null), 'same'), null)
})

test('游戏内入口显隐与互斥、过期、运行状态独立计算', () => {
  const service = { enabled: true, liveCalibration: {} }
  const detection = { running: true, foreground: true, receivedAt: 1000, interfaces: { 'sanctum-map': { matched: true } } }
  assert.equal(sanctumControlState(service, detection, {}, 1000).disabled, false)
  assert.equal(sanctumControlState(service, detection, {}, 3000).visible, false)
  assert.equal(sanctumControlState(service, { ...detection, foreground: false }, {}, 1000).visible, false)
  assert.equal(sanctumControlState(service, detection, { locked: true }, 1000).disabled, true)
  assert.equal(sanctumControlState({ ...service, running: true }, detection, {}, 1000).label, '正在准备')
  assert.equal(sanctumControlState({ ...service, enabled: false }, detection, {}, 1000).visible, false)
})

test('圣所浮窗拖动独立持久化、重启恢复、截图隐藏及调用方限制', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-control-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const repository = new SanctumRepository(root)
  const state = emptySanctumState(); state.liveCalibration = null
  const bagFile = path.join(root, 'bag.json'); fs.writeFileSync(bagFile, '{"x":99,"y":88}')
  const service = { state, enabled: false, subscribe: () => () => {}, getState: () => ({ ...state, enabled: false }), persist: () => repository.save(state) }
  const detection = { subscribe: () => () => {}, getState: () => ({}), unregisterConsumer() {} }
  const display = { id: 1, workArea: { x: 0, y: 0, width: 1920, height: 1080 } }
  class Window {
    constructor(bounds) { this.bounds = bounds; this.webContents = { id: 7, on() {}, isLoadingMainFrame: () => false, send() {} } }
    isDestroyed() { return false }
    setAlwaysOnTop() {} setContentProtection() {} on() {} loadFile() {}
    getBounds() { return this.bounds }
    setBounds(value) { this.bounds = value }
    isVisible() { return !this.hidden }
    hide() { this.hidden = true } destroy() {}
  }
  const options = { service, detection, automationLock: { subscribe: () => () => {}, getState: () => ({}) }, BrowserWindowClass: Window,
    screenApi: { getAllDisplays: () => [display], getPrimaryDisplay: () => display, getDisplayNearestPoint: () => display } }
  const overlay = new SanctumControlOverlay(options); t.after(() => overlay.destroy())
  const window = overlay.ensureWindow(), original = window.getBounds(), sender = window.webContents
  assert.equal(overlay.move({ id: 99 }, { phase: 'start', screenX: 0, screenY: 0 }), false)
  overlay.move(sender, { phase: 'start', screenX: 100, screenY: 100 })
  overlay.move(sender, { phase: 'move', screenX: 0, screenY: 150 })
  overlay.move(sender, { phase: 'end', screenX: 0, screenY: 150 })
  assert.deepEqual(repository.load().controlOverlayBounds, { x: original.x - 100, y: original.y + 50 })
  assert.equal(fs.readFileSync(bagFile, 'utf8'), '{"x":99,"y":88}')
  await overlay.withHidden(async () => { assert.equal(window.hidden, true); assert.equal(overlay.hidden, 1) })
  const restored = new SanctumControlOverlay({ ...options, service: { ...service, state: repository.load() } }); t.after(() => restored.destroy())
  assert.equal(restored.ensureWindow().getBounds().x, original.x - 100)
})

test('原生两种状态栏只接受各自校准位置，地图与状态独立可见', () => {
  const result = runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
import sanctum_native as n
s=n.NativeSession.__new__(n.NativeSession)
s.image=lambda:(np.zeros((10,10,3),np.uint8),{'environment':{}})
options={'interfaceTitles':{'sanctum-map-hud':{'region':{'x':100,'y':200}},'sanctum-hud':{'region':{'x':500,'y':600}}}}
out=[]
for opened,x,y in [(True,100,200),(False,500,600),(True,500,600)]:
    key='sanctum-map-hud' if opened else 'sanctum-hud'
    n.match_titles=lambda *a,**kw: {**({'sanctum-map':{'matched':True}} if opened else {}),key:{'region':{'x':x,'y':y}}}
    state=s.interface_state(options);out.append([state['mapOpen'],state['hudVisible'],state['hudLayout']])
print(json.dumps(out))
`)
  assert.deepEqual(result, [[true, true, 'map'], [false, true, 'standalone'], [true, false, null]])
})
