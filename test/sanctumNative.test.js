import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { SanctumNativeClient } from '../electron/modules/sanctum/nativeClient.js'
import { runPython } from './helpers/python.js'

function fixture() {
  const children = []
  const client = new SanctumNativeClient({ resolveRuntime: async () => ({ path: 'python' }), launch: options => {
    const child = new EventEmitter()
    child.stdout = new EventEmitter(); child.stdout.setEncoding = () => {}
    child.stderr = new EventEmitter(); child.requests = []; child.options = options
    child.stdin = { write: (line, callback) => { child.requests.push(JSON.parse(line)); callback() }, destroy: () => {} }
    child.kill = () => { child.killed = true }
    child.reply = value => child.stdout.emit('data', `SANCTUM ${JSON.stringify(value)}\n`)
    children.push(child)
    return { process: child, started: Promise.resolve(child) }
  } })
  return { client, children }
}
const tick = () => new Promise(resolve => setImmediate(resolve))

test('房间详情结束后先移开并等待再匹配布局，初始预检不移动，停止或环境失效不继续', () => {
  const result = runPython(`
import sys,json,threading,copy,time
from unittest.mock import patch
import numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
base={'environment':{'windowId':'1','processId':123,'width':800,'height':600,'dpi':96},'clientBounds':{'x':10,'y':20,'width':800,'height':600}}
out={}
for case in ['initial','clear','cancel-before','cancel-wait','expired','changed-before','changed-wait']:
    s=NativeSession.__new__(NativeSession)
    s.expected=copy.deepcopy(base);s.input_lock=threading.RLock();s.cancelled=threading.Event()
    s.environment=lambda:copy.deepcopy(base)
    s.room_tooltip_pending=case!='initial'
    events=[]
    class Input:
        def SetCursorPos(self,x,y):
            assert (x,y)==(808,618)
            events.append('move');return True
    s.u=Input()
    def wait(duration):
        assert duration==.15
        events.append('wait')
        if case=='changed-wait':s.environment=lambda:{**base,'clientBounds':{**base['clientBounds'],'x':99}}
        return case=='cancel-wait'
    s.cancelled.wait=wait
    if case=='cancel-before':s.cancelled.set()
    if case=='expired':s.deadline_at=time.time()*1000-1
    if case=='changed-before':s.environment=lambda:{**base,'environment':{**base['environment'],'dpi':120}}
    def image():
        s.check();events.append('image');return np.zeros((600,800,3),np.uint8),copy.deepcopy(base)
    s.image=image
    region={'x':20,'y':30,'width':40,'height':20}
    def match(*args,**kwargs):
        events.append('match')
        if case=='initial':return {}
        assert events[:2]==['move','wait']
        return {'sanctum-map':True,'sanctum-map-hud':{'region':region}}
    with patch('sanctum_native.match_titles',side_effect=match):
        try:
            state=s.interface_state({'interfaceTitles':{'sanctum-map-hud':{'region':region}}})
            if case=='initial':assert state['mapOpen'] is False
            else:
                assert state['mapOpen'] is True and state['hudLayout']=='map'
                assert s.room_tooltip_pending is False
                assert s.surface_snapshot is not None
                s.interface_state({})
        except NativeError:
            assert case not in ['initial','clear']
        else:assert case in ['initial','clear']
    out[case]=events
print(json.dumps(out))
`)
  assert.deepEqual(result.initial, ['image','match'])
  assert.deepEqual(result.clear, ['move','wait','image','match','image','match'])
  for (const key of ['cancel-before','expired','changed-before']) assert.deepEqual(result[key], [])
  for (const key of ['cancel-wait','changed-wait']) assert.deepEqual(result[key], ['move','wait'])
})

test('原生效果扫描在完整空区域返回覆盖证据，遮挡和无效区域不能确认无效果', () => {
  const result = runPython(`
import sys,json
import numpy as np
from unittest.mock import patch
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
s=NativeSession.__new__(NativeSession)
s.check=lambda:None
s.surface=lambda value:None
s.capture_masks=[]
image=np.zeros((120,200,3),dtype=np.uint8)
current={'environment':{'width':200,'height':120}}
s.image=lambda:(image,current)
options={'hudLayout':'map','effectIconsRegion':{'x':10,'y':20,'width':100,'height':80}}
with patch('sanctum_native.match_titles',return_value={'sanctum-map-hud':True}):
    empty=s.inspect_effects(options)
    assert empty['coverageConfirmed'] is True and empty['icons']==[]
    with patch('sanctum_native.icon_candidates',return_value=[{'x':30,'y':25,'width':20,'height':20}]):
        visible=s.inspect_effects(options)
        assert visible['coverageConfirmed'] is True
        assert visible['icons'][0]['x']==40 and visible['icons'][0]['y']==45
    s.capture_masks=[(20,30,20,20)]
    with patch('sanctum_native.icon_candidates') as scan:
        blocked=s.inspect_effects(options)
        assert blocked['coverageConfirmed'] is False and blocked['reason'] and blocked['icons']==[]
        scan.assert_not_called()
    s.capture_masks=[(110,20,20,20)]
    assert s.inspect_effects(options)['coverageConfirmed'] is True
    for region in [None,{'x':190,'y':20,'width':100,'height':80}]:
        try:s.inspect_effects({**options,'effectIconsRegion':region})
        except NativeError:pass
        else:raise AssertionError('invalid region accepted')
with patch('sanctum_native.match_titles',return_value={}):
    try:s.inspect_effects(options)
    except NativeError:pass
    else:raise AssertionError('invalid title accepted')
    standalone={**options,'hudLayout':'standalone'}
    assert s.inspect_effects(standalone)['coverageConfirmed'] is True
    s.capture_masks=[(20,30,20,20)]
    assert s.inspect_effects(standalone)['coverageConfirmed'] is False
    s.capture_masks=[]
    for region in [None,{'x':190,'y':20,'width':100,'height':80}]:
        try:s.inspect_effects({**standalone,'effectIconsRegion':region})
        except NativeError:pass
        else:raise AssertionError('invalid standalone region accepted')
    with patch('sanctum_native.icon_candidates',side_effect=NativeError('scan failed')):
        try:s.inspect_effects(standalone)
        except NativeError:pass
        else:raise AssertionError('failed scan accepted')
with patch('sanctum_native.match_titles',return_value={'sanctum-map':True}):
    try:s.inspect_effects(standalone)
    except NativeError:pass
    else:raise AssertionError('open map accepted as standalone')
print(json.dumps({'empty':empty['coverageConfirmed'],'blocked':blocked['coverageConfirmed']}))
`)
  assert.deepEqual(result, { empty: true, blocked: false })
})

test('arm 忽略浮窗元数据，环境缺失或变化拒绝启动，运行变化仍停止', () => {
  const result = runPython(`
import sys,json,threading,copy
from unittest.mock import patch
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
base={'environment':{'windowId':'1','processId':123,'width':800,'height':600,'dpi':96},'clientBounds':{'x':10,'y':20,'width':800,'height':600}}
def fixture():
    session=NativeSession.__new__(NativeSession)
    session.expected=None; session.expected_cursor=None; session.watching=False
    session.cancelled=threading.Event(); session.input_lock=threading.RLock()
    session.environment=lambda:copy.deepcopy(base)
    session.cursor=lambda:(0,0)
    class NoInput:
        def __getattr__(self,name): raise AssertionError('unexpected native input: '+name)
    session.u=NoInput()
    return session
accepted=0; rejected=0; stopped=0
fields=[('environment',key) for key in base['environment']]+[('clientBounds',key) for key in base['clientBounds']]
with patch('sanctum_native.threading.Thread') as worker, patch('sanctum_native.emit') as emit:
    for windows in [[],[{'handle':'2','processId':456,'role':'control'}]]:
        session=fixture(); options={**copy.deepcopy(base),'captureWindows':windows}
        assert session.dispatch('arm',options)==base
        assert session.expected==base and session.capture_windows==windows
        assert session.capture_options==options
        session.check(); session.cancelled.set(); accepted+=1
    invalid=[]
    for group,key in fields:
        changed=copy.deepcopy(base)
        changed[group][key]='other' if key=='windowId' else changed[group][key]+1
        invalid.append(changed)
        missing=copy.deepcopy(base); del missing[group][key]; invalid.append(missing)
    for group in base:
        missing=copy.deepcopy(base); del missing[group]; invalid.append(missing)
    for expected in invalid:
        session=fixture(); worker.reset_mock()
        try: session.dispatch('arm',{**expected,'captureWindows':[]})
        except NativeError as error: assert str(error)=='校准环境已变化'
        else: raise AssertionError('invalid environment accepted')
        assert session.expected is None and not session.watching
        worker.assert_not_called(); rejected+=1
    for group,key in fields:
        session=fixture(); session.dispatch('arm',{**copy.deepcopy(base),'captureWindows':[]})
        changed=copy.deepcopy(base)
        changed[group][key]='other' if key=='windowId' else changed[group][key]+1
        session.environment=lambda:changed
        emit.reset_mock()
        worker.call_args.kwargs['target']()
        assert session.cancelled.is_set()
        assert emit.call_args.args[0]['event']=='unsafe'
        assert '已变化' in emit.call_args.args[0]['reason']
        stopped+=1
print(json.dumps({'accepted':accepted,'rejected':rejected,'stopped':stopped}))
`)
  assert.deepEqual(result, { accepted: 2, rejected: 20, stopped: 9 })
})

test('进度和界面事件不完成请求，过期请求及会话事件无效', async () => {
  const {client,children}=fixture(), progress=[], surfaces=[], evidence=[]
  client.onProgress=e=>progress.push(e)
  client.onSurface=e=>surfaces.push(e)
  client.onEvidence=e=>evidence.push(e)
  const request=client.request('hover',{roomId:'a'})
  await tick()
  const child=children[0], {id,sessionId}=child.requests[0]
  child.reply({event:'progress',id,sessionId:'old',stage:'ocr'})
  child.reply({event:'progress',id:id-1,sessionId,stage:'ocr'})
  child.reply({event:'progress',id,sessionId,stage:'ocr',targetId:'a'})
  child.reply({event:'surface',id,sessionId,observation:{mapOpen:true}})
  child.reply({event:'evidence',id,sessionId:'old',png:'old'})
  child.reply({event:'evidence',id,sessionId,png:'current'})
  assert.deepEqual(evidence.map(e=>e.png),['current'])
  assert.equal(progress.length,1);assert.equal(surfaces.length,1)
  assert.equal(client.pending.id,id)
  child.reply({id,success:true,data:{texts:['已读']}})
  assert.deepEqual(await request,{texts:['已读']})
  child.reply({event:'progress',id,sessionId,stage:'parsing'})
  assert.equal(progress.length,1)
  const stopped=client.shutdown();child.emit('close');await stopped
})

test('原生请求使用管道 JSON，响应按 ID 匹配且不泄漏标准错误', async () => {
  const { client, children } = fixture()
  const request = client.request('observe', { text: '`$(not-a-command)' })
  await tick()
  const child = children[0]
  assert.equal(child.options.stdin, 'pipe')
  assert.equal(child.requests[0].input.text, '`$(not-a-command)')
  child.stderr.emit('data', 'private diagnostics')
  child.reply({ id: -1, success: true, data: 'late' })
  await assert.rejects(client.request('observe'), /尚未结束/)
  child.reply({ id: child.requests[0].id, success: true, data: { rooms: [] } })
  assert.deepEqual(await request, { rooms: [] })
  const stopped = client.shutdown(); child.emit('close'); await stopped
})

test('取消等待进程退出再完成，旧响应不能串入新会话', async () => {
  const { client, children } = fixture(), controller = new AbortController()
  const request = client.request('hover', {}, { signal: controller.signal })
  let settled = false
  const rejected = assert.rejects(request, /已停止/).then(() => { settled = true })
  await tick()
  const old = children[0]
  controller.abort()
  await tick()
  assert.equal(old.killed, true)
  assert.equal(settled, false)
  const next = client.request('environment')
  await tick()
  assert.equal(children.length, 1)
  old.emit('close')
  await rejected; await tick()
  const current = children[1]
  old.reply({ id: current.requests[0].id, success: true, data: 'old process' })
  current.reply({ id: current.requests[0].id, success: true, data: 'current process' })
  assert.equal(await next, 'current process')
  const stopped = client.shutdown(); current.emit('close'); await stopped
})

test('接管事件和损坏响应均终止原生进程，且正常退出清理悬挂请求', async () => {
  for (const kind of ['unsafe', 'malformed', 'close']) {
    const { client, children } = fixture()
    const request = client.request('hover')
    const rejected = assert.rejects(request)
    await tick()
    const child = children[0]
    if (kind === 'unsafe') child.reply({ event: 'unsafe', reason: '用户接管' })
    if (kind === 'malformed') child.stdout.emit('data', 'SANCTUM {broken}\n')
    child.emit('close')
    await rejected
    await client.shutdown()
  }
})

test('原生裁剪拒绝越界', () => {
  const value = runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import crop,NativeError
try:crop(np.zeros((10,10,3),np.uint8),{'x':9,'y':0,'width':2,'height':3});print('false')
except NativeError:print('true')`)
  assert.equal(value,true)
})

test('实际隔离运行时可加载原生脚本；未知命令被拒绝且不产生输入', async () => {
  const client = new SanctumNativeClient()
  try { await assert.rejects(client.request('invalid-command'), /不支持的圣所原生操作|仅支持 Windows/) }
  finally { await client.shutdown() }
})

test('单轮原生悬停只使用固定队列目标，不执行地图指纹或二次观察', () => {
  const value = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
s=NativeSession.__new__(NativeSession)
s.check=lambda:{'environment':{},'clientBounds':{}}
s.last_floor={'rooms':[{'id':'a'}]}
s.read_tooltip=lambda options,point,mode:{'texts':['内容'],'point':point}
s.observe=lambda *a:(_ for _ in ()).throw(AssertionError('不能二次观察'))
print(json.dumps(s.hover({'targetRoom':{'id':'a','x':100,'y':100,'width':80,'height':120},'mapRegion':{'x':10,'y':20}})))`)
  assert.deepEqual(value.point,[150,180])
  assert.deepEqual(value.texts,['内容'])
})


test('期限耗尽会终止真实挂起子进程并等待退出', { timeout: 5000 }, async () => {
  let child, exited = false
  const client = new SanctumNativeClient({ resolveRuntime: async () => ({path:process.execPath}), launch: () => {
    child = spawn(process.execPath, ['-e', 'process.stdin.once("data", () => { while (true) {} })'], {windowsHide:true,stdio:['pipe','pipe','pipe']})
    child.once('close', () => { exited=true })
    return {process:child,started:Promise.resolve(child)}
  } })
  client.deadlineAt = Date.now()+250
  try {
    await assert.rejects(client.request('readFrozen'), /超时|timed out/)
    assert.ok(child.pid)
    assert.equal(exited,true)
    assert.equal(client.child,null)
    assert.equal(client.pending,null)
  } finally { await client.shutdown() }
})
