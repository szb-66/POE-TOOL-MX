import { SANCTUM_TIMEOUTS } from './errors.js'

// Raw images never enter Electron's JSON control channel. Slots stay leased
// until the independent postprocessor has finished reading their pixels.
export class SanctumFramePipeline {
  constructor({ client, onEvidence = () => {} }) {
    this.client = client
    this.onEvidence = onEvidence
    this.free = []
    this.waiters = new Set()
    this.tail = Promise.resolve()
    this.contexts = new Map()
    this.sequence = 0
  }
  async prepare(environment, signal) {
    this.pool = await this.client.request('prepareFrames', {width:environment.width,height:environment.height}, {signal,timeoutMs:SANCTUM_TIMEOUTS.prepare})
    this.free = Array.from({length:this.pool.count}, (_,i)=>i)
  }
  async acquire(signal) {
    const started = performance.now()
    while (true) {
      signal.throwIfAborted()
      if (this.failure) throw this.failure
      if (this.closed) throw new Error('图片处理通道已关闭')
      if (this.free.length) {
        const slot = this.free.pop()
        let released = false
        return {slot, capacityWaitMs:performance.now()-started, release:()=>{
          if (released) return
          released = true; this.free.push(slot)
          for (const wake of this.waiters) wake()
        }}
      }
      await new Promise((resolve,reject)=>{
        const finish = error => { this.waiters.delete(wake); signal.removeEventListener('abort',abort); error ? reject(error) : resolve() }
        const wake = () => finish(), abort = () => finish(signal.reason)
        this.waiters.add(wake); signal.addEventListener('abort',abort,{once:true})
        if (signal.aborted) abort()
      })
    }
  }
  invalidateBaseline() {
    if (this.baseline) { this.baseline.refs--; this.releaseBaseline(this.baseline); this.baseline = null }
  }
  releaseBaseline(value) { if (!value.refs) value.lease.release() }
  async freeze(client, command, input, context, signal) {
    if (!this.baseline) {
      const lease = await this.acquire(signal)
      try {
        const data = await client.request('freezeBaseline', {pool:this.pool,slot:lease.slot}, {signal})
        this.baseline = {lease, refs:1, version:data.baselineVersion}
      } catch (error) { lease.release(); throw error }
    }
    const baseline = this.baseline
    baseline.refs++
    let lease
    try {
      lease = await this.acquire(signal)
      const frameId = ++this.sequence
      const binding = {...context,frameId,baselineVersion:baseline.version}
      const data = await client.request(command, {...input, frozen:{pool:this.pool,slot:lease.slot,
        baselineSlot:baseline.lease.slot,baselineVersion:baseline.version,frameId},
        capacityWaitMs:lease.capacityWaitMs}, {signal})
      let released = false
      const release = () => { if (released) return; released=true; lease.release(); baseline.refs--; this.releaseBaseline(baseline) }
      return {data, binding, release}
    } catch (error) {
      lease?.release(); baseline.refs--; this.releaseBaseline(baseline); throw error
    }
  }
  process(frozen, signal, accept = value => value) {
    const queuedAt = performance.now()
    const work = this.tail.then(async()=>{
      signal.throwIfAborted()
      if (this.failure) throw this.failure
      const {data,binding} = frozen
      this.contexts.set(binding.frameId,binding)
      try {
        const identity = Object.fromEntries(['runId','floorId','roomId','sessionId','frameId','baselineVersion'].map(key=>[key,binding[key]]))
        const input = {...data.frozenFrame, binding:identity,
          captureMetrics:{...data.captureMetrics,postprocessQueueMs:performance.now()-queuedAt}}
        const value = await this.client.request('processFrame',input,{signal,timeoutMs:SANCTUM_TIMEOUTS.ocr})
        return await accept(value)
      } catch (error) {
        // A dead worker invalidates its shared mapping and every queued frame.
        if (!this.client.child && this.client.closed !== undefined) this.failure = error
        throw error
      } finally { this.contexts.delete(binding.frameId) }
    }).finally(()=>frozen.release())
    this.tail = work.catch(()=>{})
    return work
  }
  evidence(event) {
    const binding = this.contexts.get(event.frameId)
    if (!binding || binding.signal.aborted || event.targetId !== binding.roomId
      || event.captureSessionId !== binding.sessionId || event.baselineVersion !== binding.baselineVersion) return
    try { this.onEvidence(binding,event) } catch { binding.evidenceError = '截图证据无法保存' }
  }
  async close() {
    this.closed = true
    for (const wake of this.waiters) wake()
    this.invalidateBaseline()
    await this.client.shutdown()
    await this.tail
    this.contexts.clear()
  }
}
