import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { EventEmitter } from 'node:events'
import { runPython } from './helpers/python.js'
import { createEventLineParser, waitForDetectionStartup, describeDetectionExit } from '../electron/modules/bag/orchestrator.js'
import { createDetectionProcessDiagnostics } from '../electron/modules/interfaceDetection/processDiagnostics.js'

const read = file => fs.readFileSync(new URL(file, import.meta.url), 'utf8')

test('局部标题仅搜索框选附近，隔离坏图、坏区域并保留环境检查', () => {
  const result = runPython(`
import sys,json,base64,numpy as np,cv2
sys.path.insert(0,'src/assets/scripts')
from interface_titles import match_titles
env={'width':200,'height':100,'dpi':144}
t=np.random.default_rng(42).integers(0,255,(10,25),dtype=np.uint8)
raw=base64.b64encode(cv2.imencode('.png',t)[1]).decode()
entry={'png':raw,'environment':env,'region':{'x':70,'y':20,'width':25,'height':10}}
image=np.zeros((100,200),dtype=np.uint8); image[28:38,78:103]=t
shapes=[]; original=cv2.matchTemplate
def spy(view,*args):
 shapes.append(list(view.shape)); return original(view,*args)
cv2.matchTemplate=spy
issues={}
templates={'good':entry,'missing':{**entry,'region':None},'negative':{**entry,'region':{**entry['region'],'x':-1}},'size':{**entry,'region':{**entry['region'],'width':24}},'bad':{**entry,'png':'!!!!'},'outside':{**entry,'region':{**entry['region'],'x':199}}}
found=match_titles(image,templates,env,.95,anchored=True,issues=issues)
far=np.zeros_like(image); far[50:60,130:155]=t
absent=match_titles(far,{'good':entry},env,.95,anchored=True)
wrong=[match_titles(image,{'good':entry},{**env,k:v},.95,anchored=True) for k,v in [('dpi',96),('width',201),('height',101)]]
print(json.dumps({'found':found,'issues':issues,'shapes':shapes,'absent':absent,'wrong':wrong}))
`)
  assert.deepEqual(result.found.good.region, { x: 78, y: 28, width: 25, height: 10 })
  assert.deepEqual(Object.keys(result.found), ['good'])
  assert.equal(Object.keys(result.issues).length, 5)
  assert.ok(Object.values(result.issues).every(message => message.includes('重新框选')))
  assert.ok(result.shapes.every(([h, w]) => h === 26 && w === 41))
  assert.deepEqual(result.absent, {})
  assert.deepEqual(result.wrong, [{}, {}, {}])
})

test('坏圣所模板不阻断三次背包命中与周期心跳，关闭后无圣所截图', () => {
  const result = runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
import bag_auto_stash_template as b
env={'left':0,'top':0,'right':200,'bottom':100,'width':200,'height':100,'dpi':144}
b.is_game_foreground=lambda:True; b.get_game_client_bounds=lambda:env
original=b.InterfaceMatcher
class Matcher(original):
 def _load_templates(self): self.templates={'inventory':None,'stash':None}
 def _capture(self,region): return np.zeros((100,200),dtype=np.uint8)
 def check_interface(self): return {'stashMatched':True,'inventoryMatched':True,'rewardMatched':False,'allflameReceiverMatched':False},{}
b.InterfaceMatcher=Matcher
events=[]; sleeps=[]
b.emit=lambda event,**data:events.append({'event':event,**data})
def sleep(seconds):
 sleeps.append(seconds)
 if len(sleeps)==4: b.is_running=False
b.time.sleep=sleep; b.is_running=True
b.run_detection({'interface_titles':{'sanctum-map':{'png':'!!!!','environment':env}}})
m=Matcher({}); m._capture=lambda region: (_ for _ in ()).throw(AssertionError('unexpected capture'))
disabled=m.check_titles(env)
print(json.dumps({'events':events,'sleeps':sleeps,'disabled':disabled}))
`)
  assert.equal(result.events.length, 5)
  assert.deepEqual(result.events.map(e => e.ready), [false, false, false, true, true])
  assert.ok(result.events.slice(1).every(e => e.titleIssues['sanctum-map'].includes('重新框选')))
  assert.deepEqual(result.sleeps, [.2, .2, .2, .2])
  assert.deepEqual(result.disabled, {})
})

test('公共标题只截取局部物理区域，负坐标与边缘裁剪还原客户区位置', () => {
  const result = runPython(`
import sys,json,base64,numpy as np,cv2
sys.path.insert(0,'src/assets/scripts')
import bag_auto_stash_template as b
env={'width':200,'height':100,'dpi':144}
t=np.random.default_rng(12).integers(0,255,(10,25),dtype=np.uint8)
raw=base64.b64encode(cv2.imencode('.png',t)[1]).decode()
results=[]
for x,y in [(70,20),(0,0),(175,90)]:
 image=np.zeros((100,200),dtype=np.uint8); image[y:y+10,x:x+25]=t
 entry={'png':raw,'environment':env,'region':{'x':x,'y':y,'width':25,'height':10}}
 matcher=b.InterfaceMatcher({'interface_titles':{'sanctum-map':entry}}); captures=[]
 def capture(r):
  captures.append(r); return image[r['top']+50:r['bottom']+50,r['left']+300:r['right']+300]
 matcher._capture=capture
 found=matcher.check_titles({**env,'left':-300,'top':-50,'right':-100,'bottom':50})
 results.append({'found':found,'captures':captures})
print(json.dumps(results))
`)
  for (const [i, [x, y]] of [[70, 20], [0, 0], [175, 90]].entries()) {
    assert.deepEqual(result[i].found['sanctum-map'].region, { x, y, width: 25, height: 10 })
    assert.equal(result[i].captures.length, 1)
    const r = result[i].captures[0]
    assert.ok(r.right - r.left <= 41 && r.bottom - r.top <= 26)
    assert.ok(r.left >= -300 && r.top >= -50 && r.right <= -100 && r.bottom <= 50)
  }
})

function coordinatorFixture() {
  const source = read('../electron/modules/interfaceDetection/coordinator.js')
    .replace(/^import [\s\S]*? from ['"][^'"]+['"]\r?\n/gm, '')
    .replace('const moduleDir = path.dirname(fileURLToPath(import.meta.url))', "const moduleDir = '.'")
    .replace('export class InterfaceDetectionCoordinator', 'class InterfaceDetectionCoordinator')
  const children = [], writes = [], logs = []
  let alive = 0, maxAlive = 0, fail = false, autoStart = true
  class Registry {
    templates = { 'sanctum-map': { png: 'map' }, 'sanctum-altar': { png: 'altar' } }
    set(key, value) { if (value) this.templates[key] = value; else delete this.templates[key] }
  }
  const Coordinator = vm.runInNewContext(`${source}\nInterfaceDetectionCoordinator`, {
    app: { getPath: () => '.', getAppPath: () => '.', isPackaged: false }, path,
    fs: { existsSync: () => true, writeFileSync: (_file, value) => writes.push(JSON.parse(value)) },
    InterfaceTitleRegistry: Registry, createEventLineParser, waitForDetectionStartup, describeDetectionExit, createDetectionProcessDiagnostics,
    structuredClone, setTimeout, clearTimeout, process: { env: {} }, console: { log() {}, error() {} },
    spawn: () => {
      if (fail) { fail = false; throw new Error('injected spawn failure') }
      const child = new EventEmitter()
      child.stdout = Object.assign(new EventEmitter(), { setEncoding() {} })
      child.stderr = Object.assign(new EventEmitter(), { setEncoding() {} })
      child.exitCode = null; child.signalCode = null; child.killed = false
      child.kill = () => { child.killed = true; return true }
      child.close = () => { alive--; child.exitCode = 0; child.emit('close', 0) }
      child.report = patch => child.stdout.emit('data', 'EVENT ' + JSON.stringify({ event: 'detection-state', foreground: true, ready: true, ...patch }) + '\n')
      children.push(child); maxAlive = Math.max(maxAlive, ++alive)
      if (autoStart) setImmediate(() => child.report({}))
      return child
    }
  })
  const coordinator = new Coordinator({ python: { detectPythonPath: () => 'python' },
    fileWatcher: { getFilePaths: () => ({ tempDir: '.' }) }, logger: { record: event => logs.push(event) } })
  return { coordinator, children, writes, logs, maxAlive: () => maxAlive,
    failNext: () => { fail = true }, manualStart: () => { autoStart = false } }
}
const tick = () => new Promise(resolve => setImmediate(resolve))

test('按需只下发地图标题，注销即时清空，旧进程关闭后才重启', async () => {
  const f = coordinatorFixture(), c = f.coordinator
  await c.registerConsumer('bag', { templates: { inventory_title: 'inventory' } })
  assert.deepEqual(f.writes[0].interface_titles, {})
  const enable = c.registerConsumer('sanctum-control'); await tick()
  assert.equal(f.children.length, 1)
  assert.equal(f.children[0].killed, true)
  f.children[0].close(); await enable
  assert.deepEqual(Object.keys(f.writes[1].interface_titles), ['sanctum-map'])
  assert.equal(Object.keys(c.getTitleConfig().templates).length, 2)
  f.children[1].report({ interfaces: { 'sanctum-map': { matched: true } } })
  c.unregisterConsumer('sanctum-control')
  assert.deepEqual(Object.keys(c.getState().interfaces), [])
  f.children[1].report({ interfaces: { 'sanctum-map': { matched: true } } })
  assert.deepEqual(Object.keys(c.getState().interfaces), [])
  await tick(); f.children[1].close(); await c.lifecycle
  assert.deepEqual(f.writes[2].interface_titles, {})
  assert.equal(c.getState().running, true)
  assert.equal(f.maxAlive(), 1)
  c.cleanup(); f.children[2].close()
})

test('快速切换收敛最新需求，非公共模板更新不重启，启动失败后可恢复', async () => {
  const f = coordinatorFixture(), c = f.coordinator
  await c.registerConsumer('bag', {})
  const on = c.registerConsumer('sanctum-control')
  c.unregisterConsumer('sanctum-control')
  await on; await c.lifecycle
  assert.equal(f.children.length, 1)
  await c.setTitle('sanctum-altar', { png: 'updated' })
  assert.equal(f.children.length, 1)
  const update = c.updateConfig({ match_threshold: .91 }); await tick()
  f.failNext(); f.children[0].close()
  await assert.rejects(update, /injected spawn failure/)
  await c.updateConfig({ match_threshold: .92 })
  assert.equal(f.writes.at(-1).match_threshold, .92)
  assert.equal(f.maxAlive(), 1)
  c.cleanup(); f.children.at(-1).close()
})

test('地图模板更新串行重载，旧配置事件不能覆盖新配置，问题独立于背包失败状态', async () => {
  const f = coordinatorFixture(), c = f.coordinator
  await c.registerConsumer('sanctum-control')
  assert.match(c.getTitleConfig().issues['sanctum-map'], /重新框选/)
  const update = c.setTitle('sanctum-map', { png: 'new-map', region: { x: 5, y: 5, width: 20, height: 10 }, environment: { width: 200, height: 100 } })
  await tick()
  f.children[0].report({ interfaces: { 'sanctum-map': { matched: true } } })
  assert.equal(Object.keys(c.getState().interfaces).length, 0)
  f.children[0].close(); await update
  assert.equal(f.writes.at(-1).interface_titles['sanctum-map'].png, 'new-map')
  f.children[1].report({ titleIssues: { 'sanctum-map': '坏图，请重新框选' } })
  assert.equal(c.getState().ready, true)
  assert.equal(c.getState().reason, '')
  assert.match(c.getTitleConfig().issues['sanctum-map'], /重新框选/)
  assert.equal(f.maxAlive(), 1)
  c.cleanup(); f.children[1].close()
})

test('启动尚未就绪时停止，不复活旧状态，重新注册等待旧进程关闭', async () => {
  const f = coordinatorFixture(), c = f.coordinator
  f.manualStart()
  const first = c.registerConsumer('bag'); await tick()
  c.unregisterConsumer('bag')
  const second = c.registerConsumer('bag')
  f.children[0].report({}); await first; await tick()
  assert.equal(c.getState().running, false)
  assert.equal(f.children.length, 1)
  f.children[0].close(); await tick()
  f.children[1].report({}); await second
  assert.equal(f.maxAlive(), 1)
  c.cleanup(); f.children[1].close()
})

test('背包窗口重复同步无原生显隐，截图隐藏后可恢复', () => {
  const source = read('../electron/modules/window/manager.js').match(/export function updateBagStashOverlay\(snapshot\) \{[\s\S]*?\n\}/)[0].replace('export ', '')
  let visible = false, shows = 0, hides = 0, sends = 0
  const window = { webContents: { isLoadingMainFrame: () => false }, isVisible: () => visible,
    showInactive() { shows++; visible = true }, hide() { hides++; visible = false } }
  const sync = vm.runInNewContext(`${source}\nupdateBagStashOverlay`, {
    bagStashOverlaySnapshot: null, createBagStashOverlayWindow: () => window, publishBagStashOverlayState: () => sends++
  })
  for (let i = 0; i < 10; i++) sync({ visible: true })
  assert.equal(shows, 1); assert.equal(sends, 10)
  visible = false; sync({ visible: true }); assert.equal(shows, 2)
  for (let i = 0; i < 10; i++) sync({ visible: false })
  assert.equal(hides, 1)
})
