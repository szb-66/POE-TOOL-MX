import test from 'node:test'
import assert from 'node:assert/strict'
import { runPython } from './helpers/python.js'
import { parseSanctumRoomTexts } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumCapture } from '../electron/modules/sanctum/capture.js'
import { AutomationLock } from '../electron/modules/automation/lock.js'

test('真实运行校准保留全部 30 房间，逐边核对金色、红色与已走链且无多余连线', () => {
  const result = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession
from sanctum_recognition import load_image
p=json.load(open('test/fixtures/sanctum/archives-live-profile.json',encoding='utf-8'))
out=[]
for name in ['archives-live-map','archives-calibration-map']:
 im=load_image('test/fixtures/sanctum/'+name+'.png');h,w=im.shape[:2]
 p['mapRegion']={'x':0,'y':0,'width':w,'height':h}
 p['calibration']['imageSize']=[w,h];p['calibration']['region']=[0,0,w,h]
 s=NativeSession.__new__(NativeSession);s.check=lambda:None;s.image=lambda:(im,{});s.match_title=lambda *a:True
 f=s.observe(p)['floor'];by={r['id']:str(r['column'])+':'+str(r['row']) for r in f['rooms']}
 out.append({'rooms':len(f['rooms']),'position':by[f['currentRoomId']], 'exits':[by[i] for i in f['exitRoomIds']],
 'edges':[[by[e['from']],by[e['to']],e['traversal']] for e in f['edges']]})
print(json.dumps(out))`)
  // Manually checked against the supplied map: each row lists actual destinations.
  const rows = [
    ['0:0','1:0r 1:1r 1:2v'],['1:0','2:0r'],['1:1','2:0r 2:1r'],['1:2','2:1v 2:2r'],
    ['2:0','3:0r 3:1r 3:2r'],['2:1','3:2g 3:3g'],['2:2','3:3r 3:4r 3:5r'],
    ['3:0','4:0r'],['3:1','4:0r'],['3:2','4:0g 4:1g'],['3:3','4:1g'],['3:4','4:1r 4:2r'],['3:5','4:2r 4:3r'],
    ['4:0','5:0g 5:1g 5:2g'],['4:1','5:2g 5:3g 5:4g'],['4:2','5:4r 5:5r'],['4:3','5:5r'],
    ['5:0','6:0g'],['5:1','6:0g 6:1g'],['5:2','6:1g 6:2g'],['5:3','6:2g 6:3g'],['5:4','6:3g 6:4g'],['5:5','6:4r 6:5r'],
    ...Array.from({length:6},(_,i)=>[`6:${i}`,`7:0${i===5?'r':'g'}`])]
  const expected = rows.flatMap(([from, targets]) => targets.split(' ').map(to => [from,to.slice(0,-1),{r:'unavailable',v:'visited',g:'available'}[to.at(-1)]]))
  for (const floor of result) {
    assert.equal(floor.rooms,30)
    assert.equal(floor.position,'2:1')
    assert.deepEqual(floor.exits,['7:0'])
    assert.deepEqual(floor.edges,expected)
  }
})

test('真实半透明弹框定位与 OCR 保留截图文字，名称不进入语义且图标奖励保留未知', () => {
  const result = runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import load_image
from sanctum_tooltip import locate_tooltip
from chart_mods_probe import create_rapidocr_engine,ordered_texts
im=load_image('test/fixtures/sanctum/archives-live-tooltip.png')
# Actual no-tooltip map crop, aligned by the unchanged lower-left map texture.
# Alignment offset was verified with 0.9999998 normalized correlation.
baseline=load_image('test/fixtures/sanctum/archives-live-map.png')
view=im[270:270+baseline.shape[0],917:917+baseline.shape[1]]
r=locate_tooltip(baseline,view,(1590-917,925-270))
a=r['region'];r['texts']=ordered_texts(create_rapidocr_engine(),view[a['y']:a['y']+a['height'],a['x']:a['x']+a['width']],.60)
r['region']={**a,'x':a['x']+917,'y':a['y']+270}
print(json.dumps(r))`)
  assert.equal(result.method,'decorated-title')
  assert.ok(result.region.x >= 1180 && result.region.x <= 1300)
  assert.ok(result.region.y >= 500 && result.region.y <= 525)
  assert.deepEqual(result.texts,['遗弃的图书馆、破旧的地窖、礼拜堂、地下室','完成后提供物品'])
  const parsed = parseSanctumRoomTexts(result.texts,{ entries:[] })
  assert.equal(parsed.nameCandidates.length,0)
  assert.equal(parsed.layout,undefined)
  assert.equal(parsed.type,'reward')
  assert.equal(parsed.detailsStatus,'partial')
  assert.deepEqual(parsed.rewards,[])
  assert.equal(parsed.rewardEvidence[0].status,'unknown')
})

test('部分文字不重扫，失败不整次重试，进度先于结果且停止后事件无效', async () => {
  const env={windowId:'game',width:1920,height:1080,dpi:96}
  const observation={foreground:true,userTakeover:false,mapOpen:true,interfaceMatched:true,overlayExcluded:true,environment:env}
  const frame={...observation,floor:{runId:'run',floorId:'floor',identityConfirmed:true,rooms:['a','b'].map(id=>({id,column:0,revealed:true,detailFingerprint:id})),edges:[]}}
  const calls=[], outputs=[]; let progress
  const driver={inspect:()=>observation,subscribeSafety:()=>()=>{},subscribeProgress:fn=>{progress=fn;return()=>{progress=null}},
    async *frames(){yield structuredClone(frame);yield structuredClone(frame)},
    async hover(room){calls.push(room.id);progress({stage:'ocr',targetId:room.id});return {patch:room.id==='a'?{detailsStatus:'partial',rawText:'未知词缀'}:{detailsStatus:'failed'}}}}
  const capture=new SanctumCapture({driver,automationLock:new AutomationLock()})
  await capture.run(env,value=>outputs.push(value))
  assert.deepEqual(calls,['a','b'])
  assert.ok(outputs.some(f=>f.captureProgress.step==='ocr' && f.rooms[0].detailsStatus==='reading'))
  assert.equal(outputs.at(-1).rooms[0].rawText,'未知词缀')
  assert.equal(progress,null)
})

test('截图降级只隐藏绘图层，控制面板移到采集区外且保持可见', () => {
  const result=runPython(`
import sys,json,threading,types,numpy as np
sys.path.insert(0,'src/assets/scripts')
import sanctum_native as n
out=[]
for role,affinity in [('control',17),('control',0),('graph',0)]:
 calls=[];visible=[True]
 class U:
  def IsWindow(self,h):return True
  def IsWindowVisible(self,h):return visible[0]
  def GetWindowThreadProcessId(self,h,p):p._obj.value=7;return 1
  def GetWindowDisplayAffinity(self,h,p):p._obj.value=affinity;return 1
  def ShowWindow(self,h,mode):visible[0]=bool(mode);calls.append('show' if mode else 'hide')
  def GetWindowRect(self,h,p):p._obj.left=0;p._obj.top=0;p._obj.right=60;p._obj.bottom=40;return 1
  def SetWindowPos(self,*a):calls.append('park');return 1
 class Capture:
  def __enter__(self):return self
  def __exit__(self,*a):pass
  def grab(self,b):calls.append('capture-visible' if visible[0] else 'capture-hidden');return np.zeros((400,600,4),np.uint8)
 n.mss.mss=Capture;n.ctypes.windll=types.SimpleNamespace(dwmapi=types.SimpleNamespace(DwmFlush=lambda:None))
 s=n.NativeSession.__new__(n.NativeSession);s.u=U();s.cancelled=threading.Event()
 s.check=lambda:{'clientBounds':{'x':0,'y':0,'width':600,'height':400}}
 s.capture_windows=[{'handle':'1','processId':7,'role':role}]
 s.capture_options={'mapRegion':{'x':120,'y':80,'width':400,'height':280}}
 im,_=s.image();out.append({'calls':calls,'visible':visible[0],'masked':bool(np.all(im[15,15]==255))})
print(json.dumps(out))`)
  assert.deepEqual(result,[
    {calls:['capture-visible'],visible:true,masked:false},
    {calls:['park','capture-visible'],visible:true,masked:true},
    {calls:['hide','capture-hidden','show'],visible:true,masked:false}])
})
