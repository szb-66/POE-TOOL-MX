import { isStepTimeout, isSafetyError, isForegroundLoss, sanctumError } from './errors.js'
import { randomUUID } from 'node:crypto'
import { SanctumProgress } from './progress.js'
import { roomExclusions } from './roomEligibility.js'
import { redactDiagnosticText } from '../system/diagnostics.js'

const environmentKeys = ['windowId', 'width', 'height', 'dpi']
const detailIdentity = room => JSON.stringify([room.column, room.row])
export const incompleteSanctumCapture = floor => floor?.effectScan?.complete !== true
  || floor?.rooms?.some(room => !room.captureSkipReason && (room.detailsStatus !== 'matched'
    || Object.values(room.readStages || {}).some(stage => ['failed','timeout','skipped','queued','reading','capturing'].includes(stage)))) === true

export function validateSanctumEnvironment(value) {
  if (!value || typeof value.windowId !== 'string' || !value.windowId.trim()
    || value.windowId.length > 100 || !Number.isInteger(value.width) || value.width < 1 || value.width > 32768
    || !Number.isInteger(value.height) || value.height < 1 || value.height > 32768
    || !Number.isFinite(value.dpi) || value.dpi < 48 || value.dpi > 768) throw new Error('圣所窗口尺寸或 DPI 未确认')
  return Object.fromEntries(environmentKeys.map(key => [key, value[key]]))
}

function checkSafety(observation, expected) {
  if (observation?.nativeError) throw sanctumError(observation.nativeError.code || 'SAFETY_INTERRUPTED',observation.nativeError.reason)
  if (!observation || observation.foreground !== true) throw new Error('游戏已失去前台')
  if (observation.userTakeover !== false) throw new Error('用户已接管或鼠标状态未确认')
  if (observation.mapOpen !== true) throw new Error('圣所地图已关闭或未确认')
  if (observation.interfaceMatched !== true || observation.overlayExcluded !== true) throw new Error('公共标题或截图排除未验证')
  const environment = validateSanctumEnvironment(observation.environment)
  if (environmentKeys.some(key => environment[key] !== expected[key])) throw new Error('窗口或 DPI 已变化，请重新校准')
}

// The driver checks the lease around asynchronous boundaries; the native
// process rechecks the window at each input and honours cancellation.
export class SanctumCapture {
  constructor({ driver, automationLock }) {
    this.driver = driver
    this.lock = automationLock
    this.session = null
    this.collected = new Map()
    this.identity = null
  }

  stop() { this.session?.controller.abort() }
  stopInput(reason = '游戏已失去前台') { this.session?.stopInput(new Error(reason)) }
  updateDetail(id, patch, room) {
    if (room) this.collected.set(id, { position: detailIdentity(room), revealed:room.revealed, detail: structuredClone(patch) })
    else { const cached = this.collected.get(id); if (cached) cached.detail = structuredClone(patch) }
  }

  async run(environment, onFloor, onObservation = () => {}, {rescan = null, onDiagnostics = () => {}} = {}) {
    if (this.session) throw new Error('上次采集正在退出，请稍后手动开始')
    if (!this.driver || !this.lock) throw new Error('实机采集器尚未启用')
    const expected = validateSanctumEnvironment(environment)
    const session = {controller:new AbortController(),inputController:new AbortController(),owner:`sanctum:${randomUUID()}`}
    this.session = session
    const {signal} = session.controller, captureSignal = AbortSignal.any([signal,session.inputController.signal])
    const startedAt = Date.now(), collected = this.collected, jobs = [], supplements = [], diagnostics = []
    const progress = new SanctumProgress()
    const failed = room => room.detailsStatus !== 'matched' || Object.values(room.readStages || {}).some(s=>['failed','timeout','skipped'].includes(s))
    let stopReason, finalOutcome, lastInputStage = 'rooms', phaseStartedAt = startedAt
    const diagnose = entry => {
      diagnostics.push({ ...entry, reason:entry.reason ? redactDiagnosticText(entry.reason).slice(0,240) : entry.reason, time: Date.now() })
      if (diagnostics.length > 80) diagnostics.shift()
      if (result) result.captureDiagnostics = structuredClone(diagnostics)
      onDiagnostics(structuredClone(diagnostics))
    }
    let draining = false, inputAvailable = true
    let unsubscribe, unsubscribeProgress, unsubscribeLease, safetyError, activeProgress, result, revision = 0, completed = 0
    for (const [id,cached] of collected) if (!['matched','partial'].includes(cached.detail?.detailsStatus)) collected.delete(id)
    const publish = (stage,current = completed,total = 0,extra = {}) => {
      if (signal.aborted || !result) return
      result.revision = ++revision
      if (['complete','partial','completing'].includes(stage)) progress.stage = stage
      result.captureProgress = progress.snapshot(extra)
      result.captureMetrics = {...result.captureMetrics,totalMs:Date.now()-startedAt}
      onFloor(structuredClone(result))
    }
    let captureEnd
    const finishCapture = () => {
      if (captureEnd) return captureEnd
      draining = true
      progress.finishCapture()
      unsubscribeLease?.(); unsubscribeLease = null
      captureEnd = Promise.resolve().then(async () => {
        try { await this.driver.endCapture?.() }
        finally { if (this.lock.getState().owner === session.owner) this.lock.release(session.owner) }
      })
      publish('recognizing')
      return captureEnd
    }
    session.stopInput = error => {
      if (session.inputController.signal.aborted) return
      session.inputController.abort(error)
      onObservation(null)
      void finishCapture().catch(failure => session.controller.abort(failure))
    }
    const interrupt = error => {
      if (isForegroundLoss(error)) session.stopInput(error)
      else { safetyError = error; session.controller.abort(error) }
    }
    const guard = () => {
      captureSignal.throwIfAborted()
      if (this.lock.getState().owner !== session.owner) throw sanctumError('SAFETY_INTERRUPTED','圣所自动化锁已失效')
      try { checkSafety(this.driver.inspect(),expected) }
      catch (error) { interrupt(error); throw error }
    }
    const keys = ['knowledge','layout','recoveryCost','name','nameCandidates','rewardEvidence','readStages','captureMetrics','failureReason',
      'tooltipRegion','diagnosticId','recognition','calculationStatus','type','recovery','relicScore','rewards','effects','afflictions','detailsStatus','rawText','confidence']
    const merge = (room,detail) => {
      for (const key of keys) delete room[key]
      for (const key of keys) if (detail?.[key] !== undefined) room[key] = structuredClone(detail[key])
    }
    try {
      unsubscribeProgress = this.driver.subscribeProgress?.(event => {
        if (event.diagnostic) {
          const entry = event.diagnostic
          lastInputStage = entry.stage
          if (entry.outcome === 'started') phaseStartedAt = Date.now()
          diagnose(entry)
          if (entry.outcome === 'failed' && !isForegroundLoss({message:entry.reason}) && !isForegroundLoss(captureSignal.reason)) stopReason ||= entry.reason
          if (!signal.aborted) publish('effects',completed,4,{step:entry.stage,reason:entry.outcome === 'failed' ? entry.reason : undefined})
          return
        }
        if (event.background) {
          if (signal.aborted || event.runId && event.runId !== result?.runId || event.floorId && event.floorId !== result?.floorId) return
          const room = result?.rooms.find(room=>room.id===event.targetId)
          if (room && event.evidenceId) room.recognition = {...room.recognition,evidenceId:event.evidenceId,region:event.region}
          publish(progress.stage); return
        }
        if (!signal.aborted && activeProgress && (!activeProgress.targetId || !event.targetId || event.targetId === activeProgress.targetId)) activeProgress.publish(event)
      })
      checkSafety(this.driver.inspect(),expected)
      unsubscribe = this.driver.subscribeSafety(observation => {
        if (observation?.logError) { interrupt(sanctumError('CONTEXT_CHANGED',observation.logError)); return }
        if (draining) return
        try { checkSafety(observation,expected); onObservation(observation) }
        catch (error) {
          onObservation(null); interrupt(error)
        }
      })
      for await (const frame of this.driver.frames({signal})) {
        signal.throwIfAborted(); checkSafety(frame,expected); onObservation(frame)
        const floor = frame.floor
        if (!floor?.identityConfirmed || !floor.runId || !floor.floorId) throw new Error('当前楼层身份尚未确认')
        const identity = JSON.stringify([floor.sanctumRunId || floor.runId,floor.floorId,floor.mapKey || null,floor.rerollId || null])
        if (floor.rerolled || identity !== this.identity) collected.clear()
        this.identity = identity
        result = structuredClone(floor); result.captureSessionId = session.owner
        if (rescan) {
          if (rescan.floor.runId !== floor.runId || rescan.floor.floorId !== floor.floorId || !floor.rooms.some(r=>r.id===rescan.id)) throw new Error('重扫目标楼层已变化')
          for (const room of rescan.floor.rooms) if (room.id !== rescan.id) collected.set(room.id,{position:detailIdentity(room),revealed:room.revealed,detail:room})
        }
        const exclusions = roomExclusions(result)
        for (const room of result.rooms) room.captureSkipReason = exclusions.get(room.id) || null
        const pending = result.rooms.filter(room => (!rescan || room.id === rescan.id) && !exclusions.has(room.id)
          && (rescan || collected.get(room.id)?.position !== detailIdentity(room) || room.revealed === true && collected.get(room.id)?.revealed !== true)
          && (room.revealed !== false || room.revealStatus === 'unknown')).sort((a,b)=>Number(b.revealed===true)-Number(a.revealed===true))
        for (const room of result.rooms) {
          const cached = collected.get(room.id)
          if (cached?.position === detailIdentity(room)) merge(room,cached.detail)
        }
        progress.capture.rooms.total = pending.length
        publish('map',0,pending.length)
        progress.rooms(pending.length)
        const acquire = () => {
          if (!this.lock.acquire(session.owner).success) throw new Error('另一项自动化正在运行，圣所采集已暂停')
          unsubscribeLease = this.lock.subscribe(state => {
            if (state.owner !== session.owner) { safetyError = new Error('圣所自动化锁已失效'); session.controller.abort(safetyError) }
          })
        }
        if (pending.length || this.driver.finalizeFloor) acquire()
        try {
          for (const room of pending) {
            if (!inputAvailable || captureSignal.aborted) {
              stopReason ||= captureSignal.reason?.message || '采集上下文恢复失败'
              merge(room,{detailsStatus:'failed',failureReason:`未执行：${stopReason}`,readStages:{capture:'skipped',ocr:'skipped'}})
              completed++; publish('rooms',completed,pending.length); continue
            }
            progress.queue(room.id)
            const roomStarted = Date.now()
            // A new observation replaces all old automatic facts, including absent fields.
            merge(room,{detailsStatus:'reading',readStages:{ocr:'capturing'}})
            activeProgress = {targetId:room.id,publish:event => {
              if (event.evidenceId) room.recognition = {evidenceId:event.evidenceId,...(Object.hasOwn(event,'region')?{region:event.region}:{})}
              publish('rooms',completed,pending.length,{...event,targetId:room.id,step:event.stage})
            }}
            publish('rooms',completed,pending.length,{targetId:room.id,step:'moving',attempt:1})
            let captured
            try {
              guard()
              captured = await (this.driver.captureRoom || this.driver.hover).call(this.driver,structuredClone(room),{
                signal:this.driver.captureRoom ? signal:captureSignal,captureSignal,guard,
                onReading:() => { if (!signal.aborted) { room.readStages={...room.readStages,ocr:'reading'}; publish(draining?'recognizing':'rooms',completed,pending.length,{targetId:room.id,step:'ocr'}) } }
              })
            } catch (error) {
              signal.throwIfAborted()
              if (isForegroundLoss(error) || session.inputController.signal.aborted) {
                session.stopInput(error)
                stopReason ||= captureSignal.reason?.message || error.message
                merge(room,{detailsStatus:'failed',failureReason:`未执行：${stopReason}`,readStages:{capture:'skipped',ocr:'skipped'}})
                progress.analyzed(room.id,true)
                completed++; publish('rooms',completed,pending.length)
                continue
              }
              if (isSafetyError(error)) { safetyError=error; session.controller.abort(error); throw error }
              stopReason ||= error.message
              merge(room,{detailsStatus:'failed',failureReason:isStepTimeout(error)?'截图超时':`截图失败：${error.message}`,
                readStages:{capture:isStepTimeout(error)?'timeout':'failed',ocr:'skipped'}})
              progress.captured('rooms'); progress.analyzed(room.id,true)
              completed++; publish('rooms',completed,pending.length)
              diagnose({stage:'rooms',targetId:room.id,outcome:'failed',code:error.code,reason:error.message,elapsedMs:Date.now()-roomStarted})
              inputAvailable = await this.driver.recoverCapture?.(error,{floor:result,mode:'map',signal:captureSignal}) ?? true
              continue
            } finally { activeProgress = null }
            progress.captured('rooms')
            const commit = (detail,supplement = false) => {
              signal.throwIfAborted()
              if (!detail) return
              if (detail.targetChanged) merge(room,{detailsStatus:'unknown',failureReason:'目标房间位置变化'})
              else {
                const patch = structuredClone(detail.patch || {detailsStatus:'unknown'})
                if (patch.knowledge) for (const fact of Object.values(patch.knowledge)) {
                  if (room.revealed === true) fact.mapKey = floor.mapKey
                  else { fact.status='unrevealed'; fact.source='unconfirmed'; delete fact.mapKey }
                }
                merge(room,patch)
                collected.set(room.id,{position:detailIdentity(room),revealed:room.revealed,detail:structuredClone(patch)})
              }
              if (!supplement) completed++
              publish(draining?'recognizing':'rooms',completed,pending.length)
            }
            if (captured?.recognition) {
              if (room.readStages?.ocr !== 'reading') room.readStages = {...room.readStages,ocr:'queued'}
              jobs.push(captured.recognition.then(detail=>{
                commit(detail)
                if (captured.needsSupplement && !captured.needsSupplement()) { progress.analyzed(room.id,failed(room)); publish(progress.stage) }
              }).catch(error => {
                if (isSafetyError(error)) { safetyError=error; session.controller.abort(error) }
                if (!signal.aborted) { merge(room,{detailsStatus:'failed',failureReason:'文字识别失败',readStages:{ocr:'failed'}}); completed++; publish('rooms',completed,pending.length) }
              }))
              if (!captured.supplement) jobs[jobs.length-1] = jobs.at(-1).finally(()=>{
                progress.analyzed(room.id,failed(room)); publish(progress.stage)
              })
              if (captured.supplement) supplements.push(async()=>{
                try { commit(await captured.supplement(),true) }
                catch (error) {
                  signal.throwIfAborted()
                  if (isSafetyError(error)) { safetyError=error; session.controller.abort(error); throw error }
                  room.readStages = {...room.readStages,icons:isStepTimeout(error)?'timeout':'failed'}
                  room.failureReason = isStepTimeout(error)?'文字已识别；奖励图标识别超时':'文字已识别；奖励图标识别失败'
                  this.updateDetail(room.id,room,room)
                  publish('recognizing',completed,pending.length)
                } finally { progress.analyzed(room.id,failed(room)); publish(progress.stage) }
              })
              publish('rooms',completed,pending.length,{targetId:room.id,step:'queued'})
            } else { commit(captured); progress.analyzed(room.id,failed(room)); publish(progress.stage) }
          }
          if (this.driver.finalizeFloor && inputAvailable && !captureSignal.aborted) {
            progress.effects()
            publish('effects')
            activeProgress = {publish:event => {
              if (event.effectScan) result.effectScan = structuredClone(event.effectScan)
              if (event.currentEffects) result.currentEffects = structuredClone(event.currentEffects)
              publish('effects',event.current??0,event.total??4,{...event,step:event.stage})
            }}
            const finalized = await this.driver.finalizeFloor(result,signal,{captureSignal,finishCapture,onTaskProgress:event=>{
              if (event.kind === 'targets') progress.effects(event.total)
              if (event.kind === 'queued') progress.queue(event.targetId)
              if (event.kind === 'captured') progress.captured('effects')
              if (event.kind === 'analyzed') progress.analyzed(event.targetId,event.failed)
              publish(progress.stage)
            }})
            // Room jobs mutate result while effect OCR runs. Never restore an earlier copy of rooms.
            for (const field of ['currentEffects','effectScan']) if (finalized?.[field]) result[field] = finalized[field]
            stopReason ||= result.effectScan?.targets?.find(target => target.stage === 'skipped')?.reason
          } else if (this.driver.finalizeFloor && result.effectScan?.complete !== true) {
            stopReason ||= captureSignal.reason?.message || '采集上下文恢复失败'
            result.effectScan = {...result.effectScan,complete:false,reason:`未执行：${stopReason}`}
          }
        } catch (error) {
          signal.throwIfAborted()
          if (isForegroundLoss(error) || isForegroundLoss(captureSignal.reason)) session.stopInput(captureSignal.reason || error)
          else if (isSafetyError(error)) { safetyError=error; session.controller.abort(error); throw error }
          stopReason ||= captureSignal.reason?.message || error.message
          result.effectScan = {...result.effectScan,complete:false,reason:stopReason}
          diagnose({stage:'effects',outcome:'failed',reason:stopReason,code:error.code})
        }
        if (!inputAvailable) result.effectScan = {...result.effectScan,complete:false}
        await finishCapture()
        await Promise.all(jobs)
        signal.throwIfAborted()
        for (const supplement of supplements) {
          try { await supplement() } catch (error) { signal.throwIfAborted(); if (isSafetyError(error)) { safetyError=error; session.controller.abort(error); throw error } }
          signal.throwIfAborted()
        }
        for (const room of result.rooms) if (room.detailsStatus === 'reading') merge(room,{...room,detailsStatus:'failed',failureReason:'未执行：房间读取未完成',readStages:{...room.readStages,ocr:'skipped'}})
        const incomplete = Boolean(stopReason) || result.rooms.some(r=>!r.captureSkipReason && failed(r)) || result.effectScan?.complete === false
        publish('completing')
        await this.driver.finishProcessing?.()
        signal.throwIfAborted()
        finalOutcome = incomplete ? 'partial':'complete'
        publish(finalOutcome,completed,pending.length,{reason:stopReason})
        return finalOutcome
      }
    } catch (error) {
      if (!signal.aborted) stopReason ||= error.message
      if (safetyError) throw safetyError
      if (!signal.aborted) throw error
    } finally {
      if (result) {
        const reason = safetyError?.message || stopReason || (signal.aborted ? '用户主动停止' : null)
        diagnose({stage:lastInputStage,outcome:safetyError || signal.aborted ? 'stopped' : finalOutcome || (reason ? 'partial':'complete'),reason,
          elapsedMs:Date.now()-phaseStartedAt})
      }
      session.controller.abort()
      await Promise.allSettled(jobs)
      unsubscribe?.(); unsubscribeProgress?.(); unsubscribeLease?.()
      await captureEnd?.catch(() => {})
      if (this.lock.getState().owner === session.owner) this.lock.release(session.owner)
      if (this.session === session) this.session = null
    }
  }
}
