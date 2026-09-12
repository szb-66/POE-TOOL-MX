import test from 'node:test'
import assert from 'node:assert/strict'
import {runPython} from './helpers/python.js'

test('恢复地图仅点击唯一入口，客户区偏移生效；缺失、多匹配、失焦和取消禁止盲点', () => {
  const results=runPython(`
import sys,json,cv2,numpy as np,base64,types,threading
sys.path.insert(0,'src/assets/scripts')
from sanctum_native import NativeSession,NativeError
import sanctum_native as native
label=cv2.imread('test/fixtures/sanctum/map-entry-label.png');h,w=label.shape[:2]
_,png=cv2.imencode('.png',label)
env=dict(width=800,height=600,dpi=96)
template=dict(environment=env,region=dict(x=10,y=10,width=w,height=h),png=base64.b64encode(png).decode())
def run(mode):
 im=np.zeros((600,800,3),np.uint8)
 if mode!='absent':im[120:120+h,300:300+w]=label
 if mode=='multiple':im[350:350+h,60:60+w]=label
 s=NativeSession.__new__(NativeSession);s.expected={};s.input_lock=threading.RLock();s.cancelled=threading.Event()
 inputs=[];stopped=False
 current=dict(environment=env,clientBounds=dict(x=-800,y=40,width=800,height=600))
 def check():
  if mode in ('cancel','focus') or stopped:raise NativeError('stopped','SAFETY_INTERRUPTED')
  return current
 def mouse(*args):
  nonlocal stopped
  inputs.append(['mouse',args[0]])
  if mode=='during' and args[0]==2:stopped=True
 s.check=check;s.image=lambda:(im,current)
 s.u=types.SimpleNamespace(SetCursorPos=lambda x,y:(inputs.append(['move',x,y]) or True),
  GetAsyncKeyState=lambda _:int(mode=='held')*0x8000,mouse_event=mouse,keybd_event=lambda *args:inputs.append(['key']))
 native.match_titles=lambda *args,**kwargs: {'sanctum-map':True} if any(x==['mouse',4] for x in inputs) and mode!='timeout' else {}
 options=dict(targetMode='map',interfaceTitles={'sanctum-map-entry':template})
 if mode=='uncalibrated':options['interfaceTitles']={}
 if mode=='dpi':options['interfaceTitles']={'sanctum-map-entry':dict(template,environment=dict(env,dpi=144))}
 if mode=='mask':s.capture_masks=[(300,120,w,h)]
 try:s.toggle_map(options);failed=False
 except NativeError:failed=True
 return dict(mode=mode,inputs=inputs,failed=failed)
print(json.dumps([run(mode) for mode in ['ok','absent','multiple','cancel','focus','during','held','uncalibrated','dpi','mask','timeout']]))`)
  const ok=results[0]
  assert.equal(ok.failed,false)
  assert.deepEqual(ok.inputs,[['move',-401,188],['mouse',2],['mouse',4]])
  for (const value of results.slice(1)) {
    assert.equal(value.failed,true,value.mode)
    if (['during','timeout'].includes(value.mode)) assert.deepEqual(value.inputs,ok.inputs)
    else assert.deepEqual(value.inputs,[],value.mode)
  }
})
