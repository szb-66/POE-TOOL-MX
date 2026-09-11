// Only the capture coordinator advances phases. Background work updates its
// own target, so a late OCR/evidence event cannot move the button backwards.
export class SanctumProgress {
  constructor() {
    this.stage = 'map'
    this.capture = {rooms:{current:0,total:0},effects:{current:0,total:null},finished:false}
    this.targets = new Map()
  }
  rooms(total) { this.capture.rooms.total = total; this.stage = 'rooms' }
  effects(total = null) { if (this.capture.finished) return; this.stage = 'effects'; this.capture.effects.total = total }
  queue(id) { if (!this.capture.finished && !this.targets.has(id)) this.targets.set(id,{done:false,failed:false}) }
  captured(kind) { this.capture[kind].current++ }
  analyzed(id, failed = false) {
    const target = this.targets.get(id)
    if (target && !target.done) Object.assign(target,{done:true,failed})
  }
  finishCapture() { this.capture.finished = true; this.stage = 'recognizing' }
  snapshot(extra = {}) {
    const values = [...this.targets.values()]
    const analysis = {current:values.filter(v=>v.done).length,total:values.length,failed:values.filter(v=>v.failed).length}
    const count = this.capture.finished ? analysis : this.capture[this.stage] || {current:0,total:this.capture.rooms.total}
    return {...extra,stage:this.stage,current:count.current,total:count.total,
      capture:structuredClone(this.capture),analysis}
  }
}
