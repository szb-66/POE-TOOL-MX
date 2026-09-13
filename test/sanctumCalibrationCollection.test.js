import test from 'node:test'
import assert from 'node:assert/strict'
import { SanctumCalibrationEditor } from '../electron/modules/sanctum/calibration.js'
import { SanctumCalibrationCollection } from '../electron/modules/sanctum/calibrationCollection.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { COLLECTION_KEYS } from '../shared/sanctumCalibrationCollection.js'
import { runPython } from './helpers/python.js'

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
const env = { width:1920,height:1080,dpi:96,windowId:'12',processId:13 }
const rect = { x:100,y:100,width:100,height:150 }
function fixture() {
  const service=new SanctumService({}); service.setEnabled(true)
  let environment={...env}, visible=true, failure=false, saveFailure=false, canceled=false
  const titles={}, requests=[], crops=[]
  const editor=new SanctumCalibrationEditor({service,
    detection:{getTitleConfig:()=>({templates:titles}),setTitle:async(key,value)=>{
      if(failure){failure=false;throw new Error('template failed')}
      if(value)titles[key]=value;else delete titles[key]
    }},
    nativeImage:{createFromBuffer:()=>({getSize:()=>({width:environment.width,height:environment.height}),crop:r=>{
      crops.push(r);return {toPNG:()=>Buffer.from(png,'base64'),toBitmap:()=>Buffer.from([20,150,230,255])}
    }})},
    withScreenshotHidden:async fn=>{visible=false;try{return await fn()}finally{visible=true}}
  })
  service.calibrationEditor=editor
  const persist=service.persist.bind(service)
  service.persist=()=>{if(saveFailure){saveFailure=false;throw new Error('disk failed')}return persist()}
  const collection=new SanctumCalibrationCollection(editor,{makeClient:()=>({
    request:async(command,_input,{signal})=>{
      requests.push(command);signal.throwIfAborted()
      if(command==='configure'){assert.equal(visible,true);return {configured:true}}
      if(command==='analyzeCalibrationFrame'){assert.equal(visible,true);if(canceled)editor.cancel();return {candidates:[{key:'mapRegion',region:rect}],message:'review'}}
      assert.equal(visible,false)
      return {environment,clientBounds:{x:-1920,y:0,width:environment.width,height:environment.height},png}
    },shutdown:async()=>{}
  })})
  editor.collection=collection
  return {collection,editor,service,titles,requests,crops,environment:value=>{environment={...environment,...value}},
    templateFail:()=>{failure=true},diskFail:()=>{saveFailure=true},cancel:()=>{canceled=true}}
}
async function collect(f,keys){
  const draft=await f.collection.capture()
  return f.collection.confirm({id:draft.id,frameId:draft.current.id,selections:keys.map(key=>({key,region:rect}))})
}
test('隐藏时只截图一次，恢复后分析，草稿不进入业务状态',async()=>{
  const f=fixture(),draft=await f.collection.capture()
  assert.deepEqual(f.requests,['configure','environment','captureCalibrationFrame','analyzeCalibrationFrame'])
  assert.equal(f.service.state.liveCalibration,null)
  assert.equal(draft.current.candidates[0].key,'mapRegion');assert.equal(f.editor.picking,false)
})
test('两张截图可逆序补齐十一项，部分保存后继续收集',async()=>{
  for(const groups of [[COLLECTION_KEYS.slice(8),COLLECTION_KEYS.slice(0,8)],[COLLECTION_KEYS.slice(0,8),COLLECTION_KEYS.slice(8)]]){
    const f=fixture();let draft=await collect(f,groups[0]);await f.collection.save({id:draft.id})
    draft=await collect(f,groups[1]);assert.equal(Object.keys(draft.items).length,11)
    await f.collection.save({id:draft.id});assert.equal(Object.keys(f.collection.view().items).length,11)
    assert.equal(Object.keys(f.titles).length,3);assert.ok(f.service.state.liveCalibration.calibration.pathHsv)
  }
})
test('重复默认保留，显式替换生效，旧截图与越界不能确认',async()=>{
  const f=fixture();await collect(f,['mapRegion'])
  let draft=await f.collection.capture(),input={id:draft.id,frameId:draft.current.id,selections:[{key:'mapRegion',region:{...rect,x:200}}]}
  assert.throws(()=>f.collection.confirm({...input,frameId:'old'}),/截图已更新/)
  assert.throws(()=>f.collection.confirm({...input,selections:[{key:'roomSize',region:{...rect,x:1920}}]}),/越界/)
  draft=f.collection.confirm(input);assert.equal(draft.items.mapRegion.region.x,100)
  draft=await f.collection.capture()
  draft=f.collection.confirm({...input,frameId:draft.current.id,selections:[{...input.selections[0],replace:true}]})
  assert.equal(draft.items.mapRegion.region.x,200)
})
test('窗口进程尺寸 DPI 隔离；取消保留确认项；丢弃不修改配置',async()=>{
  for(const changed of [{windowId:'99'},{processId:99},{width:2000},{dpi:144}]){
    const f=fixture(),before=await collect(f,['mapRegion']);f.environment(changed)
    await assert.rejects(f.collection.capture(),/不一致/);assert.deepEqual(f.collection.view().items,before.items)
  }
  const f=fixture();await collect(f,['mapRegion']);const draft=await f.collection.capture()
  assert.equal(f.collection.discard({id:draft.id}).items.mapRegion.region.x,100)
  f.cancel();await assert.rejects(f.collection.capture());assert.equal(f.editor.picking,false)
  assert.ok(f.collection.view().items.mapRegion);f.collection.discard({id:draft.id,all:true});assert.equal(f.service.state.liveCalibration,null)
})
test('模板或存储失败回滚并保留草稿可重试',async()=>{
  for(const fail of ['templateFail','diskFail']){
    const f=fixture();let draft=await collect(f,['sanctum-map','mapRegion']);await f.collection.save({id:draft.id})
    const old=structuredClone(f.service.state.liveCalibration),titles=structuredClone(f.titles)
    draft=await collect(f,['sanctum-map-entry','hudResourcesRegion']);f[fail]()
    await assert.rejects(f.collection.save({id:draft.id}));assert.deepEqual(f.service.state.liveCalibration,old);assert.deepEqual(f.titles,titles)
    assert.equal(f.collection.view().dirty,true);await f.collection.save({id:draft.id});assert.ok(f.titles['sanctum-map-entry'])
  }
})
test('运行中拒绝修改，外部校准变化不会被旧草稿覆盖',async()=>{
  const f=fixture(),draft=await collect(f,['mapRegion']);f.service.state.running=true
  await assert.rejects(f.collection.capture(),/运行中/);f.service.state.running=false
  f.titles['sanctum-map']={environment:env,png,region:rect}
  await assert.rejects(f.collection.save({id:draft.id}),/发生变化/)
})
test('先单独保存路径样本，后续补齐地图时仍保留颜色参数',async()=>{
  const f=fixture();let draft=await collect(f,['pathColor']);await f.collection.save({id:draft.id})
  assert.ok(f.collection.view().items.pathColor.pathHsv)
  draft=await collect(f,['mapRegion','roomSize']);await f.collection.save({id:draft.id})
  assert.ok(f.service.state.liveCalibration.calibration.pathHsv)
})
test('同环境部分保存不删除旧版仅有坐标的配置',async()=>{
  const f=fixture()
  f.service.state.liveCalibration={version:6,environment:{width:1920,height:1080,dpi:96},mapRegion:{...rect,width:800,height:600},captures:{},calibration:{roomSize:[50,80],pathHsv:[[12,95,42],[40,255,255]]}}
  const draft=await collect(f,['coinsRegion']);await f.collection.save({id:draft.id})
  assert.equal(f.service.state.liveCalibration.mapRegion.width,800)
  assert.deepEqual(f.service.state.liveCalibration.calibration.roomSize,[50,80])
})
test('原生整帧采集仅截图一次，环境变化拒绝返回',()=>{
  const result=runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
out=[]
for changed in (False,True):
    session=object.__new__(NativeSession)
    count=[0]
    before={'environment':{'width':100,'height':100,'dpi':96},'clientBounds':{'x':0,'y':0,'width':100,'height':100}}
    def check(): return before
    def image():
        count[0]+=1
        current={**before,'environment':{**before['environment'],'dpi':144}} if changed else before
        return np.zeros((100,100,3),dtype=np.uint8),current
    session.check=check;session.image=image
    try:
        frame=session.dispatch('captureCalibrationFrame',{})
        out.append({'count':count[0],'png':frame['png'].startswith('iVBOR')})
    except NativeError:out.append({'count':count[0],'rejected':True})
print(json.dumps(out))
`)
  assert.deepEqual(result,[{count:1,png:true},{count:1,rejected:true}])
})
test('原图与缩放客户区补齐元素，空图不产生候选',{timeout:180000},()=>{
  const results=runPython(`
import sys,json,cv2,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_calibration_collection import analyze_calibration
out=[]
for number in (1,2):
    image=cv2.imdecode(np.fromfile('src/assets/images/sanctum-calibration/example-%d.png'%number,dtype=np.uint8),1)
    if number==2: image=image[33:]
    for scale in (1,.5):
        frame=cv2.resize(image,None,fx=scale,fy=scale)
        out.append(analyze_calibration(frame)['candidates'])
out.append(analyze_calibration(np.zeros((600,1000,3),dtype=np.uint8),lambda image: ([],None))['candidates'])
print(json.dumps(out))
`,{timeout:170000})
  for(const index of [0,1]){
    assert.deepEqual([...new Set([...results[index],...results[index+2]].map(item=>item.key))].sort(),[...COLLECTION_KEYS].sort())
    assert.ok(results[index].every(item=>item.region.width>0&&item.region.height>0))
  }
  assert.deepEqual(results[4],[])
})
