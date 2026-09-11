import test from 'node:test'
import assert from 'node:assert/strict'
import { SanctumEvidenceStore } from '../electron/modules/sanctum/evidence.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumCapture } from '../electron/modules/sanctum/capture.js'
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='
const frame={png,width:1,height:1,region:{x:0,y:0,width:1,height:1}}
const context={runId:'run',floorId:'floor',roomId:'a',sessionId:'session'}

test('图片有界保存，目标与截图绑定，图片只按需读取且不暴露内部信号', () => {
  const store=new SanctumEvidenceStore({maxCount:2})
  const id=store.add({...context,signal:new AbortController().signal},frame)
  const binding={...context,evidenceId:id}
  assert.equal(store.image(binding).dataUrl,`data:image/png;base64,${png}`)
  assert.equal(store.image(binding).signal,undefined)
  assert.throws(()=>store.get({...binding,roomId:'b'}),/过期/)
  const next=store.add(context,frame)
  assert.throws(()=>store.get(binding),/过期/)
  store.add({...context,roomId:'b'},frame);store.add({...context,roomId:'c'},frame)
  assert.equal(store.records.size,3)
  assert.ok(store.image({...context,evidenceId:next}).dataUrl)
  store.clear();assert.equal(store.bytes,0)
  assert.throws(()=>store.add(context,{...frame,width:99}),/尺寸/)
})

function fixture() {
  const service=new SanctumService({})
  service.setEnabled(true)
  const evidence=new SanctumEvidenceStore(), id=evidence.add(context,frame), binding={...context,evidenceId:id}
  const patch={rawText:'新文字',detailsStatus:'matched',rewards:[],effects:[],afflictions:[],recognition:{evidenceId:id,region:frame.region,matches:[]}}
  service.liveDriver={evidence,close:async()=>{}}
  service.capture=new SanctumCapture({})
  service.state.floor={runId:'run',floorId:'floor',revision:1,identityConfirmed:false,rooms:[{id:'a',detailFingerprint:'a:0',name:'旧名称',recovery:50,recognition:{evidenceId:id,region:frame.region}}],edges:[]}
  return {service,patch,binding}
}

test('停止后只读截图，重扫和楼层变化拒绝旧引用，无改框接口',()=>{
  const {service,binding}=fixture()
  assert.ok(service.getRoomEvidence(binding).dataUrl)
  assert.equal(service.recognizeRoomRegion,undefined)
  assert.doesNotMatch(JSON.stringify(service.getState()),/data:image|iVBOR/)
  service.state.floor.rooms[0].recognition.evidenceId='new'
  assert.throws(()=>service.getRoomEvidence(binding),/过期/)
})
test('效果图片按楼层、目标和截图校验，只返回局部图且拒绝旧整屏证据',()=>{
  const {service}=fixture()
  const target={...context,roomId:'effect:1'}
  const crop={...frame,kind:'effect-crop',sourceRegion:{x:40,y:50,width:1,height:1},sourceWidth:100,sourceHeight:100}
  const evidenceId=service.liveDriver.evidence.add(target,crop)
  service.state.floor.effectScan={targets:[{targetId:'effect:1',evidenceId,stage:'failed'}]}
  const binding={runId:'run',floorId:'floor',targetId:'effect:1',evidenceId}
  const image=service.getEffectEvidence(binding)
  assert.ok(image.dataUrl);assert.deepEqual(image.region,frame.region);assert.equal(image.sourceRegion.x,40)
  assert.throws(()=>service.liveDriver.evidence.add(target,{...crop,sourceRegion:{x:40,y:50,width:2,height:1}}),/坐标/) 
  assert.throws(()=>service.getEffectEvidence({...binding,targetId:'effect:2'}),/过期/)
  const oldId=service.liveDriver.evidence.add(target,frame)
  service.state.floor.effectScan.targets[0].evidenceId=oldId
  assert.throws(()=>service.getEffectEvidence({...binding,evidenceId:oldId}),/独立/)
  service.state.floor.floorId='changed'
  assert.throws(()=>service.getEffectEvidence(binding),/过期/)
})
