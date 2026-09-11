import test from 'node:test'
import assert from 'node:assert/strict'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { captureButton } from '../shared/sanctumPresentation.js'

const tick = () => new Promise(resolve => setImmediate(resolve))
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }

for (const cancelRestart of [false, true]) test(`停止再启动等待完整退出，旧关闭不影响新会话；再次停止=${cancelRestart}`, async () => {
  const service = new SanctumService({})
  service.setEnabled(true)
  service.state.liveCalibration = {}
  const closing = deferred()
  let prepares = 0, closes = 0, capture
  service.liveDriver = {
    async prepare() { prepares++; return {} },
    async close() { closes++; if (closes === 1) await closing.promise }
  }
  service.capture = {
    run() { capture = deferred(); return capture.promise },
    stop() { capture?.resolve() }
  }
  const first = service.startLive()
  await tick()
  assert.equal(prepares, 1)
  service.stop()
  const second = service.startLive()
  const duplicate = service.startLive()
  await tick()
  assert.equal(prepares, 1)
  assert.equal(closes, 1)
  if (cancelRestart) service.stop()
  closing.resolve()
  await first
  await tick()
  assert.equal(prepares, cancelRestart ? 1 : 2)
  if (!cancelRestart) {
    assert.equal(service.state.running, true)
    assert.equal(closes, 1)
    service.stop()
  }
  const replies = await Promise.all([second, duplicate])
  for (const reply of replies) assert.equal(reply.captureDraining,false)
  assert.equal(service.startTask, null)
  assert.equal(service.restartTask, null)
  assert.equal(service.state.running, false)
})

for (const outcome of ['complete','partial','failed','stopped']) test(`后台${outcome}清理后响应不会覆盖完成推送，按钮无需前台刷新`,async()=>{
  const service=new SanctumService({})
  service.setEnabled(true);service.state.liveCalibration={}
  service.foreground=false
  const closing=deferred(),entered=deferred()
  let displayed,settled=false
  service.subscribe(state=>{displayed=state})
  service.liveDriver={prepare:async()=>({}),close:async()=>{entered.resolve();await closing.promise}}
  service.capture={stop(){},run:async(environment,onFloor)=>{
    onFloor({runId:'r',floorId:'f',revision:1,identityConfirmed:true,rooms:[],edges:[],effectScan:{complete:true},captureProgress:{stage:outcome}})
    if(outcome==='failed')throw new Error('识别失败')
    if(outcome==='stopped'){service.stop();return}
    return outcome
  }}
  const request=service.startLive().then(reply=>{settled=true;displayed=reply;return reply})
  await entered.promise
  assert.equal(settled,false)
  assert.equal(displayed.captureDraining,true)
  assert.equal(captureButton(displayed).disabled,true)
  closing.resolve()
  const reply=await request
  assert.equal(reply.captureDraining,false)
  assert.equal(reply.running,false)
  assert.equal(reply.foreground,false)
  assert.equal(captureButton(displayed).disabled,false)
  assert.equal(captureButton(displayed).label,{
    complete:'分析完成·再次采集',partial:'部分完成·再次采集',failed:'分析失败·重试',stopped:'已停止·再次采集'
  }[outcome])
  assert.deepEqual(reply,service.getState())
  await service.shutdown()
})
