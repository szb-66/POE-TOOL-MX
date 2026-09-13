import test from 'node:test'
import assert from 'node:assert/strict'
import { liveProfile } from '../shared/sanctumLive.js'
import { parseResourceRegions } from '../electron/modules/sanctum/runObservation.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumLogContext } from '../electron/modules/sanctum/logContext.js'
import { sanctumLogEvents } from './helpers/sanctumLog.js'
import { runPython } from './helpers/python.js'
import { acceptSanctumFloor } from '../electron/modules/sanctum/state.js'
import { emptySanctumState } from '../shared/sanctum.js'

const floor = { identityConfirmed:true, runId:'run', floorId:'floor:0', currentRoomId:'a' }
const read = (...texts) => ({status:'located',texts})

const coin = text => ({...read(text), ocrBlocks:[{text,region:{x:50,y:10,width:100,height:20}}],
  resourceEvidence:{coinRegion:{x:10,y:8,width:20,height:25}}})
const moduleRead = (resolve, inspiration, noInspiration=false) => ({...read(`坚毅 ${resolve}`, ...(inspiration===undefined?[]:[`启迪 ${inspiration}`])), resourceEvidence:{noInspiration}})

test('提供截图：地图双框与独立整栏在原始及半尺寸下读取真实数值', () => {
  const samples=runPython(`
import sys,json,cv2,base64
sys.path.insert(0,'src/assets/scripts')
from sanctum_ocr import read_frozen,create_sanctum_ocr_engine
from sanctum_resources import resource_evidence
engine=create_sanctum_ocr_engine();out=[]
for scale in [1,.5]:
 reads={}
 for key,name in [('coinsRegion','resource-map-coins.png'),('mapResourcesRegion','resource-map-hud.png'),('hudResourcesRegion','resource-standalone-hud.png')]:
  im=cv2.imread('test/fixtures/sanctum/'+name)
  im=cv2.resize(im,None,fx=scale,fy=scale)
  ok,png=cv2.imencode('.png',im);h,w=im.shape[:2]
  reads[key]=read_frozen({'png':base64.b64encode(png).decode(),'region':dict(x=0,y=0,width=w,height=h),'room':False,'includeIcons':False,'resources':True},engine)
  if key=='mapResourcesRegion':
   # An OCR miss on the second row must not prove zero inspiration.
   missing=[line for line in reads[key]['ocrLines'] if '坚毅' in line['text']]
   assert not resource_evidence(im,missing)['noInspiration']
 out.append(reads)
print(json.dumps(out))`)
  for (const reads of samples) {
    const map=parseResourceRegions({coinsRegion:reads.coinsRegion,mapResourcesRegion:reads.mapResourcesRegion},floor)
    assert.deepEqual([map.coins,map.resolve,map.maxResolve,map.inspiration],[270,418,418,70])
    const hud=parseResourceRegions({hudResourcesRegion:reads.hudResourcesRegion},floor)
    assert.deepEqual([hud.coins,hud.resolve,hud.maxResolve,hud.inspiration],[270,416,418,0])
  }
})

test('资源随有效快照提交，未知不沿用旧值，过期绑定不能影响路线', () => {
  const state=emptySanctumState()
  state.runObservation={...parseResourceRegions({mapResourcesRegion:moduleRead('30/300','12')},floor)}
  const current={...floor,rooms:[],edges:[],revision:1,runObservation:parseResourceRegions({},floor)}
  const accepted=acceptSanctumFloor(state,current)
  assert.equal(accepted.runObservation.resolve,null)
  assert.equal(accepted.runObservation.inspiration,null)
  current.runObservation={...state.runObservation,key:'other-position'}
  assert.equal(acceptSanctumFloor(state,current).runObservation,null)
})

test('双布局标签解析支持移动、金币后缀与经确认的零启迪', () => {
  const value=parseResourceRegions({coinsRegion:coin('275(+0)'),mapResourcesRegion:moduleRead('196 / 200','12')},floor)
  assert.deepEqual([value.coins,value.resolve,value.maxResolve,value.inspiration],[275,196,200,12])
  assert.equal(parseResourceRegions({coinsRegion:coin('1,234')},floor).coins,1234)
  assert.equal(parseResourceRegions({mapResourcesRegion:moduleRead('196/200',undefined,true)},floor).inspiration,0)
  const hud={...coin('270(+0)'),texts:['坚毅416/418','270(+0)']}
  assert.equal(parseResourceRegions({hudResourcesRegion:hud},floor).resolve,416)
  assert.equal(parseResourceRegions({hudResourcesRegion:hud},floor).coins,270)
})

test('缺失、失败、截断、冲突和非法数字保持未知，不恢复旧值', () => {
  for (const sample of [undefined,coin(''),coin('10 20'),coin('275其他内容'),coin('1,23'),coin('-1'),coin('1e3'),coin('1000000001'),{...coin('10'),status:'partial'},{...coin('10'),reason:'失败'}]) {
    const value=parseResourceRegions({coinsRegion:sample,mapResourcesRegion:moduleRead('201/200')},floor)
    assert.deepEqual([value.coins,value.resolve,value.maxResolve,value.inspiration],[null,null,null,null])
  }
  assert.equal(parseResourceRegions({mapResourcesRegion:moduleRead('196/200')},floor).inspiration,null)
  assert.equal(parseResourceRegions({mapResourcesRegion:moduleRead('196/200','?',true)},floor).inspiration,null)
  assert.equal(parseResourceRegions({mapResourcesRegion:read('坚毅196/200','坚毅190/200')},floor).resolve,null)
  assert.equal(parseResourceRegions({hudResourcesRegion:read('5','40','1000')},floor).coins,null)
})

test('v1 至 v5 保留地图金币及无关配置，旧小框不拼接，新区域持久化', () => {
  const environment={width:1920,height:1080,dpi:96}, region={x:10,y:20,width:80,height:30}
  const capture={environment,region,png:'iVBORw0KGgoAAA='}
  for (const version of [1,2,3,4,5]) {
    const value=liveProfile({version,environment,mapRegion:region,effectIconsRegion:region,coinsRegion:region,
      resourcesRegion:{invalid:true},resolveRegion:{invalid:true},inspirationRegion:{invalid:true},rewardPanelRegion:{invalid:true},
      captures:{mapRegion:capture,coinsRegion:capture,resolveRegion:{invalid:true},resourcesRegion:{invalid:true}}})
    assert.equal(value.version,6)
    assert.deepEqual(value.mapRegion,region)
    assert.deepEqual(value.effectIconsRegion,region)
    assert.deepEqual(value.coinsRegion,region)
    assert.deepEqual(Object.keys(value.captures),['mapRegion','coinsRegion'])
    assert.equal(value.mapResourcesRegion,undefined)
    assert.equal(value.resolveRegion,undefined)
  }
  const value=liveProfile({version:6,environment,coinsRegion:region,mapResourcesRegion:region,hudResourcesRegion:region,
    captures:{coinsRegion:capture,mapResourcesRegion:capture,hudResourcesRegion:capture}})
  assert.deepEqual(liveProfile(JSON.parse(JSON.stringify(value))),value)
})

test('原生按布局从同一帧裁剪，独立布局无需锚点，缺项越界遮挡及未预检拒绝', () => {
  const result=runPython(`
import sys,json,base64,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
s=NativeSession.__new__(NativeSession);s.expected={}
frames=[]
im=np.arange(300*200*3,dtype=np.uint8).reshape((200,300,3))
def image():
 frames.append(1);return im,{'environment':{'width':300,'height':200}}
s.image=image
def layout(opts,snapshot=None):
 return {'mapOpen':True}
s.interface_state=layout
regions={'coinsRegion':dict(x=220,y=10,width=40,height=20),'mapResourcesRegion':dict(x=210,y=140,width=70,height=50)}
value=s.dispatch('readRunPanel',regions)
assert len(frames)==1
for key,r in regions.items():
 decoded=cv2.imdecode(np.frombuffer(base64.b64decode(value['regions'][key]['png']),np.uint8),cv2.IMREAD_COLOR)
 assert np.array_equal(decoded,im[r['y']:r['y']+r['height'],r['x']:r['x']+r['width']])
assert list(s.dispatch('readRunPanel',{'coinsRegion':regions['coinsRegion']})['regions'])==['coinsRegion']
s.interface_state=lambda opts,snapshot=None:{'mapOpen':False}
hud=dict(x=40,y=120,width=240,height=60)
value=s.dispatch('readRunPanel',{**regions,'hudResourcesRegion':hud})
assert value['resourceLayout']=='standalone'
assert list(value['regions'])==['hudResourcesRegion']
rejected=[]
for case in ['empty','bounds','mask','title','unarmed']:
 opts=regions.copy();s.capture_masks=[];s.expected={};s.interface_state=layout
 if case=='empty':opts={}
 if case=='bounds':opts['coinsRegion']=dict(x=299,y=10,width=40,height=20)
 if case=='mask':s.capture_masks=[(220,10,40,20)]
 if case=='title':s.interface_state=lambda opts,snapshot=None:{'mapOpen':False}
 if case=='unarmed':s.expected=None
 try:
  value=s.dispatch('readRunPanel',opts)
  if case in ('bounds','mask'):
   assert value['regions']['coinsRegion']['status']=='unknown'
   assert value['regions']['mapResourcesRegion']['status']=='located'
   rejected.append(case)
 except NativeError:rejected.append(case)
print(json.dumps(rejected))`)
  assert.deepEqual(result,['empty','bounds','mask','title','unarmed'])
})

test('资源驱动一次截图，单块 OCR 失败保持未知，切区和停止拒绝迟到结果', async t => {
  for (const mode of ['ok','ocr-failed','area-changed','stopped']) {
    const log=sanctumLogEvents(),controller=new AbortController(),calls=[]
    const environment={width:1000,height:800,dpi:96,processId:123}
    const region={x:10,y:20,width:80,height:30}
    const context=new SanctumLogContext(log.events,123,()=>{})
    const current={...floor,logContextKey:context.key};context.close()
    const driver=new SanctumLiveDriver({clientEvents:log.events,
      detection:{getTitleConfig:()=>({templates:{'sanctum-map':{}},threshold:.8})},
      makeClient:()=>({shutdown:async()=>{},abort(){},async request(command){
        calls.push(command)
        if(command==='environment'||command==='arm') return {environment}
        assert.equal(command,'readRunPanel')
        return {environment,regions:{coinsRegion:{...coin('275'),region},mapResourcesRegion:{...moduleRead('196/200'),region}}}
      }})})
    t.after(()=>driver.close())
    driver.recognizeCaptured=async value=>{
      if(value.texts[0]==='275') {
        if(mode==='ocr-failed') throw new Error('OCR 失败')
        if(mode==='area-changed') log.enter({seed:'changed'})
        if(mode==='stopped') controller.abort(new Error('停止'))
      }
      return value
    }
    const work=driver.readRunPanel({version:5,environment,coinsRegion:region,mapResourcesRegion:region},current,'resources',controller.signal)
    if(['area-changed','stopped'].includes(mode)) await assert.rejects(work)
    else {
      const value=await work
      assert.equal(value.coins,mode==='ok'?275:null)
      assert.equal(value.resolve,196)
      assert.equal(value.maxResolve,200)
      assert.equal(value.inspiration,null)
    }
    assert.equal(calls.filter(command=>command==='readRunPanel').length,1)
  }
})
