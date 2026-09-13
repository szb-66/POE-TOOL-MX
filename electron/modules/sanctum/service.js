import { SANCTUM_TIMEOUTS } from './errors.js'
import { isCurrentSanctumEntry } from './catalog.js'
import { observationKey, validateRunResources } from './runObservation.js'
import { emptySanctumState, validateSanctumStrategy } from '../../../shared/sanctum.js'
import { acceptSanctumFloor, resetSanctumRun } from './state.js'
import { planSanctumFloor } from './planner.js'
import { SanctumCapture, incompleteSanctumCapture } from './capture.js'
import { bindSanctumCalibration } from '../../../shared/sanctumCalibration.js'
import { sanctumResultObservation, sanctumResultTitle, sanctumPenultimateRoom, sanctumResultEnvironmentMatches } from './resultObservation.js'
import { sanctumDisplay, sanctumPositionUnconfirmed } from '../../../shared/sanctumDisplay.js'
import { preservePreviousCapture } from './previousCapture.js'
import { effectEvidenceTargets } from '../../../shared/sanctumEffects.js'
import { originalEffectGroup, correctedEffectGroup, validateEffectCorrection, validateSourceCorrection, rebuildCorrectedScan } from './effectCorrection.js'
import { readEffectMemory, migrateEffectMemory, effectSources, effectMemoryKey, effectRuleStatus, rememberEffectRule, forgetEffectRule } from './effectMemory.js'

const object = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('圣所参数必须为对象')
  return value
}
const ids = value => {
  if (!Array.isArray(value) || value.length > 200 || value.some(id => typeof id !== 'string' || id.length > 100)) throw new Error('圣所标识列表无效')
  return [...new Set(value)]
}

function interruptRoomRead(room) {
  const stages = {...room.readStages}
  for (const [phase,status] of Object.entries(stages)) if (['capturing','queued','reading'].includes(status)) stages[phase] = 'failed'
  if (room.detailsStatus === 'reading') return {...room,detailsStatus:'failed',failureReason:'读取已中断',readStages:stages}
  if (room.readStages?.icons === 'queued') return {...room,readStages:stages,failureReason:'文字已识别；奖励图标读取已中断'}
  return room
}

export class SanctumService {
  constructor({ repository, moduleEnabled = true, replay = null, samples = () => [], catalog = { entries: [] }, captureDriver = null, automationLock = null }) {
    this.repository = repository
    this.state = repository?.load() || emptySanctumState()
    this.routeResult = this.state.persistedRoute || null
    this.overlayResult = this.state.persistedOverlay || null
    delete this.state.persistedRoute
    delete this.state.persistedOverlay
    this.replay = replay
    this.samples = samples
    this.catalog = catalog
    const memory=readEffectMemory(this.state.effectCorrectionMemory)
    this.state.effectCorrectionMemory=migrateEffectMemory(memory,[this.state.floor,this.routeResult?.floor,this.overlayResult?.floor],catalog,target=>originalEffectGroup(target,catalog))
    if (!memory.migrated) {
      try { this.repository?.saveEffectMemory?.(this.state.effectCorrectionMemory) }
      catch { this.state.saveError='纠正记忆迁移保存失败，请检查磁盘访问权限' }
    }
    this.listeners = new Set()
    this.moduleEnabled = moduleEnabled
    this.enabled = moduleEnabled && this.state.enabled === true
    this.generation = 0
    this.replayController = null
    this.capture = captureDriver && automationLock ? new SanctumCapture({ driver: captureDriver, automationLock }) : null
    this.captureTask = null
    this.foreground = false
    this.observation = null
    this.lastMapObservation = null
    this.liveDriver = null
    this.liveTask = null
    this.liveController = null
    this.liveEnvironment = null
  }

  getState() { return structuredClone({ ...this.state, configuredEnabled: this.state.enabled === true, enabled: this.enabled, liveCaptureAvailable: Boolean(this.capture),
    effectCorrectionMemory: {revision:this.state.effectCorrectionMemory.revision},
    savedRoute: !this.state.running && this.routeResult && (!this.state.floor?.identityConfirmed
      || !sanctumDisplay(this.state.floor, this.state.recommendation, this.state.marks).nextRoomId) ? this.routeResult : null,
    captureDraining: Boolean(!this.state.running && (this.startTask || this.liveTask || this.captureTask)),
    foreground: this.foreground, observation: this.observation,
    liveEnvironment: this.liveEnvironment, publicTitles: this.calibrationEditor?.detection.getTitleConfig(),
    catalogSummary: { patch: this.catalog.patch,
      total: this.catalog.entries.length, reviewed: this.catalog.entries.filter(entry => entry.applicability === 'current').length,
      afflictions: this.catalog.entries.filter(entry => entry.kind === 'affliction' && isCurrentSanctumEntry(this.catalog, entry))
        .map(entry => ({ id: entry.id, label: entry.name, descriptions: entry.descriptions || [] })) } }) }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  publish() { const state = this.getState(); for (const listener of this.listeners) listener(state); return state }
  writeSnapshot(state = this.state) {
    this.repository?.save(state, { routeResult: this.routeResult, overlayResult: this.overlayResult })
    this.state.saveWarning=this.repository?.evidence?.cleanupError || null
  }
  persist() {
    try { this.writeSnapshot(); delete this.state.saveError }
    catch (error) {
      this.state.saveError = '识别结果保存失败，请检查磁盘空间和文件访问权限；当前内存结果仍保留'
      this.publish()
      throw error
    }
    return this.publish()
  }
  saveCapture() {
    if (this.state.floor && !this.state.restoredFromSave && (this.state.running || this.state.savedAt == null)) this.state.savedAt = Date.now()
    try { this.writeSnapshot(); delete this.state.saveError }
    catch (error) { this.state.saveError = '识别结果保存失败，请检查磁盘空间和文件访问权限；当前内存结果仍保留' }
    return this.publish()
  }
  assertEnabled() { if (!this.enabled) throw new Error('圣所功能未启用') }
  recalculate() {
    if (this.state.floor?.identityConfirmed) this.state.savedAt = Date.now()
    this.state.recommendation = this.state.floor?.identityConfirmed
      ? planSanctumFloor(this.state.floor, this.state.strategy, this.state.marks, this.state.currentEffects, { runObservation:this.state.runObservation }) : null
    this.rememberRoute()
  }
  rememberRoute() {
    if (!this.state.floor?.identityConfirmed || this.state.floor.sampleId) return
    const display = sanctumDisplay(this.state.floor, this.state.recommendation, this.state.marks)
    const current = this.state.floor.rooms.find(room => room.id === this.state.floor.currentRoomId)
    if (this.state.floor.positionStatus === 'confirmed' && (current?.terminal || this.state.floor.exitRoomIds?.includes(current?.id))) {
      this.routeResult = null; this.overlayResult = null; return
    }
    if (!display.nextRoomId) return
    this.routeResult = structuredClone({ floor: this.state.floor, recommendation: this.state.recommendation, marks: this.state.marks,
      currentEffects: this.state.currentEffects, runObservation: this.state.runObservation, savedAt: Date.now(),
      reason: '上次识别路线，仅供历史参考', incomplete: incompleteSanctumCapture(this.state.floor) })
    if (this.captureEnvironment && (this.observation?.mapRegion || this.lastMapObservation)) this.retainOverlayResult(this.captureEnvironment)
  }
  markRouteInterrupted() {
    for (const result of [this.routeResult, this.overlayResult]) if (result) {
      result.incomplete = true
      result.reason = '状态识别不完整；已保留上次生成路线，仅供历史参考'
    }
  }
  setEnabled(value) {
    if (typeof value !== 'boolean') throw new Error('功能开关无效')
    // Disable before disk I/O: a failed save must never restart canceled work.
    if (!value) { this.state.enabled = false; this.disableRuntime() }
    try { this.writeSnapshot({ ...this.state, enabled: value }) }
    catch (error) {
      this.publish()
      throw new Error(`圣所开关保存失败${!value ? '，本次已关闭，重启前请重试保存' : ''}：${error.message}`)
    }
    this.state.enabled = value
    this.enabled = this.moduleEnabled && value
    return this.publish()
  }
  setModuleEnabled(value) {
    if (typeof value !== 'boolean') throw new Error('模块开关无效')
    this.moduleEnabled = value
    if (!value) this.disableRuntime()
    else this.enabled = this.state.enabled === true
    return this.publish()
  }
  disableRuntime() {
    this.enabled = false
    this.stop()
    this.calibrationEditor?.cancel()
  }
  stop(reason = '用户主动停止', {preserveWarm = false} = {}) {
    if (!preserveWarm) void this.liveDriver?.discardWarmWorkers?.()
    if (this.state.running) this.markRouteInterrupted()
    if (this.state.running && this.state.floor) {
      const entries = this.state.floor.captureDiagnostics || [], previous = entries.at(-1), now = Date.now()
      this.state.floor.captureDiagnostics = [...entries,{stage:previous?.stage || this.state.progress?.step || this.state.progress?.stage || 'rooms',
        outcome:'stopped',reason,time:now,elapsedMs:previous ? Math.max(0,now-previous.time) : 0,
        remainingMs:this.liveDriver?.deadlineAt ? Math.max(0,this.liveDriver.deadlineAt-now) : null}].slice(-80)
    }
    this.generation++
    this.positionOverride = null
    if (this.liveDriver) this.liveDriver.positionOverride = null
    if (this.state.progress) this.state.progress = { ...this.state.progress, stage: 'stopped', step: null }
    this.observation = null
    this.liveController?.abort()
    if (this.state.floor && (this.captureTask || this.state.status === 'capturing' || this.state.floor.identitySource === 'client-log')) {
      this.state.floor = { ...this.state.floor, captureStopped:true, identityConfirmed:false }
      this.state.floor.rooms = this.state.floor.rooms.map(interruptRoomRead)
      this.state.recommendation = null
    }
    this.replayController?.abort()
    this.replayController = null
    this.capture?.stop()
    this.state.running = false
    this.state.status = 'paused'
    this.state.reason = `${reason}；已停止，已保留识别结果；需手动重新开始`
    return this.saveCapture()
  }
  emergencyStop() {
    const stopped = this.state.running
    this.stop()
    return { success: true, stopped }
  }
  attachLiveDriver(driver, automationLock) {
    this.automationLock = automationLock
    this.liveSafetyUnsubscribe?.()
    this.liveDriver = driver
    driver.effectCorrectionMemory=structuredClone(this.state.effectCorrectionMemory)
    if (this.repository?.evidence) { driver.evidence?.clear(); driver.evidence = this.repository.evidence }
    this.liveSurfaceUnsubscribe?.()
    this.liveSurfaceUnsubscribe = driver.subscribeSurface?.(surface => {
      if (this.state.running && this.observation) this.updateObservation({ ...this.observation, ...surface })
    })
    this.liveSafetyUnsubscribe = driver.subscribeSafety?.(observation => {
      if (!observation?.logError || !(this.state.running || this.liveTask || this.captureTask)) return
      this.stop(observation.logError)
      this.state.reason = observation.logError + '；采集已停止，已保留路线供历史参考，需手动重新开始'
      this.publish()
    })
    this.capture = new SanctumCapture({ driver, automationLock })
  }
  async runLiveAction(action, onSuccess, preparingReason = '请在 15 秒内切回游戏并打开圣所界面；可使用全局紧急停止快捷键停止', preserveWarm = false) {
    this.assertEnabled()
    if (!this.liveDriver) throw new Error('实时采集不可用')
    if (this.calibrationEditor?.picking) throw new Error('请先完成或取消框选')
    if (this.liveTask || this.captureTask) throw new Error('上次采集尚未退出，请先停止并稍后开始')
    this.stop(undefined,{preserveWarm})
    const generation = this.generation, controller = new AbortController()
    this.liveController = controller
    this.state.running = true; this.state.status = 'preparing'
    this.state.progress = {stage:'preparing'}
    this.state.reason = preparingReason
    this.publish()
    const task = Promise.resolve().then(() => action(controller.signal))
    this.liveTask = task
    try {
      const value = await task
      if (generation === this.generation) onSuccess?.(value)
      return { value, generation }
    } catch (error) {
      if (generation === this.generation) { this.state.status = 'error'; this.state.reason = error.message }
      return { generation: -1 }
    } finally {
      if (this.liveTask === task) this.liveTask = null
      if (this.liveController === controller) this.liveController = null
      if (generation === this.generation) { this.state.running = false; this.publish() }
    }
  }
  async startLive() {
    // Include native shutdown in the lifetime of a run. A restart may be
    // requested during draining, but must not share a client with the old run.
    if (this.startTask) {
      if (this.state.running) throw new Error('圣所采集已经运行')
      if (this.restartTask) return this.restartTask
      const previous = this.startTask, generation = this.generation
      const restart = (async () => {
        await previous.catch(() => {})
        if (generation !== this.generation) return this.getState()
        return this.startLive()
      })()
      this.restartTask = restart
      try { await restart }
      finally { if (this.restartTask === restart) this.restartTask = null }
      return this.getState()
    }
    const task = this.performStartLive()
    this.startTask = task
    try { await task }
    finally { if (this.startTask === task) this.startTask = null; this.publish() }
    // The inner result was captured before shutdown. Returning it would overwrite
    // the final state event in the renderer with captureDraining still set.
    return this.getState()
  }
  async performStartLive() {
    if (!this.state.liveCalibration) throw new Error('请先完成实时校准')
    const started = performance.now()
    const previousSession = this.state.floor?.captureSessionId
    let preparedMs = null
    this.captureDeadlineExpired = false
    const timer = setTimeout(() => {
      this.captureDeadlineExpired = true
      this.liveController?.abort(new Error('本轮采集超时'))
      this.capture?.stop()
      this.liveDriver?.client?.abort(new Error('本轮采集超时'))
    }, SANCTUM_TIMEOUTS.prepare)
    try {
      const result = await this.runLiveAction(signal => this.liveDriver.prepare(this.state.liveCalibration, signal, this.automationLock, reason => {
        if (!signal.aborted) { this.state.reason = reason; this.publish() }
      }), undefined, '正在检查圣所配置，检查通过后自动切回游戏；可使用全局紧急停止快捷键停止', true)
      if (result.generation !== this.generation || this.captureDeadlineExpired) {
        if (this.captureDeadlineExpired) {
          this.state.progress = { ...this.state.progress, stage:'timeout', step:null }
          this.state.reason = '采集准备超时，已保留上次结果'
          this.saveCapture()
        }
        return this.getState()
      }
      clearTimeout(timer)
      preparedMs = performance.now() - started
      return await this.startCapture(result.value)
    } finally {
      clearTimeout(timer)
      const cleanup = performance.now()
      await this.liveDriver?.close({keepWarm:this.state.status === 'ready'})
      if (this.state.floor?.captureSessionId && this.state.floor.captureSessionId !== previousSession) {
        this.state.floor.captureMetrics = {...this.state.floor.captureMetrics,prepareMs:preparedMs,
          finalCleanupMs:performance.now()-cleanup,roundTripMs:performance.now()-started,
          clickToFirstMoveMs:preparedMs !== null && Number.isFinite(this.state.floor.captureMetrics?.firstMoveMs) ? preparedMs+this.state.floor.captureMetrics.firstMoveMs:null}
        this.saveCapture()
      }
    }
  }
  async startCapture(environment) {
    this.assertEnabled()
    if (!this.capture) throw new Error('实机采集器尚未启用')
    if (this.captureTask) throw new Error('上次采集正在退出，请稍后手动开始')
    this.stop()
    const generation = this.generation
    this.captureEnvironment = environment
    this.state.running = true
    this.state.status = 'capturing'
    this.state.progress = {stage:'map'}
    this.state.reason = '正在识别地图'
    this.state.captureEvents = []
    this.publish()
    const task = this.capture.run(environment, floor => {
      if (generation !== this.generation) return
      floor = preservePreviousCapture(this.applyPosition(floor), this.state.floor)
      this.state = acceptSanctumFloor(this.state, floor)
      this.state.restoredFromSave = false
      this.state.progress = floor?.captureProgress || null
      if (this.state.progress) this.state.captureEvents = [...(this.state.captureEvents || []), { ...this.state.progress, time:Date.now() }].slice(-200)
      this.recalculate()
      this.saveCapture()
    }, observation => {
      if (generation === this.generation) this.updateObservation(observation)
    }, { rescan: this.rescanRequest,
      onDiagnostics: entries => {
        if (generation !== this.generation || !this.state.floor) return
        this.state.floor.captureDiagnostics = entries
        this.saveCapture()
      } })
    this.captureTask = task
    let outcome, captureFailed = false
    try { outcome = await task }
    catch (error) {
      if (generation === this.generation) { captureFailed = true; this.state.reason = error.message }
    } finally {
      if (this.captureTask === task) this.captureTask = null
      if (generation === this.generation) {
        if (this.captureDeadlineExpired) { outcome = 'timeout'; this.state.progress = { ...this.state.progress, stage:'timeout', step:null } }
        const completed = ['complete', 'partial', 'timeout'].includes(outcome)
        this.state.running = false
        if (completed) {
          this.recalculate()
          this.state.decisions = [...(this.state.decisions || []), {
            recordedAt:new Date().toISOString(),runId:this.state.floor.sanctumRunId || this.state.floor.runId,
            floorId:this.state.floor.floorId,currentRoomId:this.state.floor.currentRoomId,
            floor:structuredClone(this.state.floor),currentEffects:structuredClone(this.state.currentEffects),
            resources:structuredClone(this.state.runObservation),
            strategy:structuredClone(this.state.strategy),recommendation:structuredClone(this.state.recommendation),
            observedNextRoomId:null,gameplayAccepted:false
          }].slice(-20)
          this.state.status = outcome === 'complete' ? 'ready' : 'partial'
          this.state.reason = outcome === 'timeout' ? `${this.state.progress?.reason || '采集超时'}，已保存部分结果` : outcome === 'partial' ? `部分完成，已保存结果${this.state.progress?.reason ? '：'+this.state.progress.reason : ''}` : '本轮识别结束，已保存结果'
          this.retainOverlayResult(environment)
        } else {
          this.markRouteInterrupted()
          this.observation = null
          if (this.state.floor) {
            this.state.floor = { ...this.state.floor, captureStopped: true, identityConfirmed: false }
            this.state.floor.rooms = this.state.floor.rooms.map(interruptRoomRead)
          }
          this.state.progress = { ...this.state.progress, stage: 'stopped', step: null }
          this.state.status = captureFailed ? 'error' : 'paused'
          this.state.recommendation = null
          this.state.reason += '；采集已停止，状态识别不完整，已保留结果与路线供历史参考'
        }
        this.saveCapture()
      }
    }
    return this.getState()
  }
  retainOverlayResult(environment, now = Date.now()) {
    const floor = this.state.floor
    if (!floor?.identityConfirmed || floor.sampleId) return
    const current = floor.positionStatus === 'confirmed' && floor.rooms.find(room => room.id === floor.currentRoomId)
    if (current && (current.terminal === true || floor.exitRoomIds?.includes(current.id))) {
      this.overlayResult = null
      return
    }
    // The saved markers intentionally survive map closing and room transitions.
    // Only a newly recognized route replaces them; they are not live position evidence.
    const display = sanctumDisplay(floor, this.state.recommendation, this.state.marks)
    if (!display.nextRoomId && (this.overlayResult || !display.rooms.some(room => room.current))) return
    // The live observation may have been reset by a live action; fall back to
    // the last map-bearing observation so manual corrections still refresh
    // the saved overlay. Environment checks still gate the restored display.
    const observation = this.observation?.mapRegion ? this.observation : this.lastMapObservation
    if (!observation?.mapRegion || !environment) return
    this.overlayResult = structuredClone({ floor, recommendation: this.state.recommendation, marks: this.state.marks,
      currentEffects: this.state.currentEffects, runObservation: this.state.runObservation,
      progress: { ...this.state.progress, stage: incompleteSanctumCapture(floor) ? 'partial' : 'complete' }, observation, environment,
      incomplete: incompleteSanctumCapture(floor),
      savedAt: now, clearOnMapClose: sanctumPenultimateRoom(floor, display.nextRoomId) })
  }
  getResultState(detection, now = Date.now()) {
    if (!this.enabled || this.state.running || !this.overlayResult) return null
    // 最近一次实时识别明确未确认位置时隐藏历史当前/下一房标记；快照保留，
    // 手动定位或后续识别确认位置后自然恢复。
    if (sanctumPositionUnconfirmed(this.state.floor)) return null
    const warning = detection?.gameBounds && !sanctumResultEnvironmentMatches(this.overlayResult.observation, detection, this.overlayResult.environment)
      ? '游戏窗口位置、尺寸或缩放已变化，已隐藏保存的悬浮标记；请再次采集更新' : ''
    if ((this.state.overlayRestoreWarning || '') !== warning) {
      this.state.overlayRestoreWarning = warning
      queueMicrotask(() => this.publish())
    }
    if (this.overlayResult.clearOnMapClose && detection?.receivedAt > this.overlayResult.savedAt
      && sanctumResultTitle(this.overlayResult.observation, detection, this.overlayResult.environment, now) === false) {
      this.overlayResult = null
      this.saveCapture()
      return null
    }
    const observation = sanctumResultObservation(this.overlayResult.observation, detection, this.overlayResult.environment, now)
    if (!observation) return null
    return { ...this.getState(), ...this.overlayResult, observation, foreground: true,
      reason: this.overlayResult.reason || (this.overlayResult.incomplete ? '状态识别不完整；上次识别路线，仅供历史参考' : '上次识别结果；再次采集可更新路线') }
  }
  resetRun() { this.assertEnabled(); this.stop(); this.lastMapObservation = null; this.routeResult = null; this.overlayResult = null; this.liveDriver?.resetEffects?.(); this.state = resetSanctumRun(this.state); const state=this.persist(); this.repository?.evidence?.clear(); return state }
  setForeground(value) {
    this.foreground = value === true
    if (!this.foreground && this.captureTask) this.capture?.stopInput('游戏已失去前台')
    return this.publish()
  }
  updateObservation(value) {
    this.observation = value ? structuredClone({ foreground: value.foreground, interfaceMatched: value.interfaceMatched,
      mapOpen: value.mapOpen, clientBounds: value.clientBounds, mapRegion: value.mapRegion,
      regions: value.regions, receivedAt: Date.now() }) : null
    // Result-overlay retention must survive observation resets from live
    // actions; remember the last map-bearing observation for that purpose.
    if (this.observation?.mapRegion) this.lastMapObservation = this.observation
    if (!value) this.state.recommendation = null
    else if (this.state.running && this.captureEnvironment) this.rememberRoute()
    return this.publish()
  }
  async rescanEffects() {
    this.assertEnabled()
    if (this.state.running || this.startTask || this.liveTask) throw new Error('请先停止并等待采集退出')
    this.liveDriver?.requestEffectRescan()
    return this.startLive()
  }
  correctRunResources(binding, input) {
    this.assertEnabled()
    if (binding !== observationKey(this.state.floor)) throw new Error('当前位置已变化，修正未应用')
    this.state.runObservation = validateRunResources(input,this.state.floor)
    this.recalculate(); return this.persist()
  }
  getEffectReview(binding) {
    object(binding)
    let selected
    for (const floor of [this.state.floor,this.routeResult?.floor].filter(Boolean)) {
      for (const target of effectEvidenceTargets(floor)) {
        const candidates = [{target,previous:false},...(target.previousCapture ? [{target:target.previousCapture.result,previous:true,binding:target.previousCapture.binding}]:[])]
        for (const candidate of candidates) {
          const value = candidate.binding || {...candidate.target,runId:candidate.target.runId || floor.runId,floorId:candidate.target.floorId || floor.floorId}
          if (['runId','floorId','targetId','evidenceId'].every(key=>(value[key] ?? null) === (binding[key] ?? null))) {
            selected ||= {...candidate,floor}
          }
        }
      }
    }
    if (!selected) return {editable:false,reason:'本次没有可核对的浮窗记录，请重读状态栏',binding,original:null,group:null,options:[]}
    const {target,floor,previous} = selected, scan = floor.effectScan
    const original = structuredClone(originalEffectGroup(target,this.catalog))
    if (original && !original.unresolved) original.unresolved = original.effects.filter(e=>!e.entryId && e.reason).map((e,i)=>({...e,id:e.id || `legacy:${i}`}))
    const current = floor === this.state.floor && !previous && !target.previousCapture && !this.state.restoredFromSave
      && floor.identityConfirmed && (scan.effectBinding || scan.binding) === observationKey(floor)
    const editable = Boolean(current && original && target.evidenceId && !this.state.running && !this.startTask && !this.liveTask && !this.captureTask && this.enabled)
    const sources=effectSources(original,[...(target.memoryHits || []),...(target.correction?.sourceEdits || [])]).map(source=>{
      const local=target.correction?.sourceEdits?.find(edit=>edit.sourceId === source.id)
      const hit=target.memoryHits?.find(rule=>rule.key === effectMemoryKey(source.rawText))
      const legacy=target.correction?.resolutions?.find(edit=>edit.id === source.id)
      const processing=local || hit || legacy
      return {...source,selection:processing ? processing.action === 'ignore'?'ignore':processing.action === 'keep'?'keep':processing.entryId : source.entryId || 'keep',ruleId:hit?.id,local:Boolean(local)}
    })
    return structuredClone({binding:{...binding,observationKey:observationKey(floor),correctionRevision:target.correction?.revision || 0,memoryRevision:this.state.effectCorrectionMemory.revision},
      editable,reason:editable ? null : !current ? '历史或位置已变化的结果仅供查看，请重新采集' : !original ? '此浮窗没有可纠正的效果词条' : '请等待采集结束并确认功能已开启；缺少证据时需重读',
      target,original,sources,group:correctedEffectGroup(target,this.catalog),previous,
      options:this.catalog.entries.filter(entry=>['boon','affliction'].includes(entry.kind)).map(entry=>({id:entry.id,name:entry.name,descriptions:entry.descriptions || [],tier:entry.tier,kind:entry.kind}))})
  }
  correctEffectTarget(binding, input) {
    this.assertEnabled(); object(binding)
    if (this.state.running || this.startTask || this.liveTask || this.captureTask) throw new Error('请先停止并等待采集退出')
    const review = this.getEffectReview(binding)
    if (!review.editable || binding.observationKey !== observationKey(this.state.floor)) throw new Error(review.reason || '当前位置已变化，修正未应用')
    if (binding.correctionRevision !== review.binding.correctionRevision) throw new Error('效果已被纠正，请重新打开核对窗口')
    if (input?.sourceEdits) return this.correctEffectSources(binding,input,review)
    const correction = validateEffectCorrection(input,review.original,this.catalog)
    const scan = structuredClone(this.state.floor.effectScan)
    const target = scan.targets.find(target=>target.targetId === binding.targetId && target.evidenceId === binding.evidenceId)
    target.effectGroup ||= review.original
    target.correction = {...correction,revision:review.binding.correctionRevision+1,updatedAt:Date.now()}
    const group = correctedEffectGroup(target,this.catalog)
    target.entries = group.entries
    target.classificationComplete = group.complete && group.entries.every(entry=>entry.category)
    target.reason = group.reason || null
    // A manual identity correction cannot repair capture, OCR or restore failures.
    if (['matched','failed'].includes(target.stage) && !target.captureIssue) target.stage = group.complete ? 'matched':'failed'
    const next = rebuildCorrectedScan(scan,this.catalog)
    this.applyCorrectedScan(next)
    this.recalculate()
    return this.persist()
  }
  applyCorrectedScan(next) {
    this.state.floor.effectScan = next.scan
    this.state.floor.currentEffects = structuredClone(next.effects)
    this.state.currentEffects = structuredClone(next.effects)
    if (this.liveDriver?.effectLedger) {
      this.liveDriver.effectLedger = {...this.liveDriver.effectLedger,...structuredClone(next.scan),effects:structuredClone(next.effects),floor:structuredClone(this.state.floor)}
      this.liveDriver.effectScan = structuredClone(next.scan)
      this.liveDriver.currentEffects = structuredClone(next.effects)
    }
  }
  correctEffectSources(binding,input,review) {
    if (binding.memoryRevision !== this.state.effectCorrectionMemory.revision) throw new Error('纠正规则已更新，请重新打开核对窗口')
    const correction=validateSourceCorrection(input,review.original,this.catalog,review.sources)
    const memory=structuredClone(this.state.effectCorrectionMemory),scan=structuredClone(this.state.floor.effectScan)
    const target=scan.targets.find(target=>target.targetId === binding.targetId && target.evidenceId === binding.evidenceId)
    const local=[]
    for (const edit of correction.sourceEdits) {
      if (correction.remember && edit.action !== 'keep') rememberEffectRule(memory,edit.rawText,edit.action,edit.entryId,this.catalog,Date.now(),
        {...review.binding,sourceId:edit.sourceId,texts:review.target.texts,region:review.target.region})
      else if (correction.remember) {
        const key=effectMemoryKey(edit.rawText)
        const rule=memory.rules.find(rule=>rule.key === key)
        if (rule) forgetEffectRule(memory,rule.id)
      }
      else local.push(edit)
    }
    target.effectGroup ||= review.original
    // The local record stores only this-capture overrides. Remembered actions
    // must not pin an old result after their rule is edited or deleted.
    target.correction={sourceEdits:local,addedEntryIds:correction.addedEntryIds,revision:review.binding.correctionRevision+1,updatedAt:Date.now()}
    target.correctionHistory=[...(target.correctionHistory || []),{...correction,revision:target.correction.revision,updatedAt:target.correction.updatedAt}]
    this.state.effectCorrectionMemory=memory
    if (this.liveDriver) this.liveDriver.effectCorrectionMemory=structuredClone(memory)
    this.applyCorrectedScan(rebuildCorrectedScan(scan,this.catalog,memory))
    this.recalculate();return this.persist()
  }
  getEffectCorrectionRules() {
    const memory=this.state.effectCorrectionMemory
    return structuredClone({revision:memory.revision,rules:memory.rules.map(rule=>({...rule,...effectRuleStatus(rule,this.catalog)})),
      options:this.catalog.entries.filter(entry=>['boon','affliction'].includes(entry.kind)).map(entry=>({id:entry.id,name:entry.name,descriptions:entry.descriptions || [],tier:entry.tier,kind:entry.kind}))})
  }
  editEffectCorrectionRule(binding,patch) {
    this.assertEnabled();object(binding)
    if (this.state.running || this.startTask || this.liveTask || this.captureTask) throw new Error('请等待采集结束后修改纠正规则')
    const memory=structuredClone(this.state.effectCorrectionMemory),rule=memory.rules.find(rule=>rule.id === binding.id)
    if (!rule || binding.revision !== rule.revision || binding.memoryRevision !== memory.revision) throw new Error('纠正规则已更新或删除，请刷新后再修改')
    if (patch === null) forgetEffectRule(memory,rule.id)
    else { object(patch);rememberEffectRule(memory,rule.rawText,patch.action,patch.entryId,this.catalog) }
    this.state.effectCorrectionMemory=memory
    if (this.liveDriver) this.liveDriver.effectCorrectionMemory=structuredClone(memory)
    const floor=this.state.floor,scan=floor?.effectScan
    if (!this.state.restoredFromSave && floor?.identityConfirmed && (scan?.effectBinding || scan?.binding) === observationKey(floor) && scan?.targets) {
      this.applyCorrectedScan(rebuildCorrectedScan(structuredClone(scan),this.catalog,memory))
      this.recalculate()
    }
    return this.persist()
  }
  updateEffectCorrectionRule(binding,patch) { return this.editEffectCorrectionRule(binding,patch) }
  deleteEffectCorrectionRule(binding) { return this.editEffectCorrectionRule(binding,null) }
  async readRunPanel(kind) {
    if (kind !== 'resources') throw new Error('未知实际状态面板')
    const floor = structuredClone(this.state.floor), key = observationKey(floor)
    if (!floor?.identityConfirmed) throw new Error('请先采集并确认当前位置')
    await this.runLiveAction(signal => this.liveDriver.readRunPanel(this.state.liveCalibration, floor, kind, signal), result => {
      if (key !== observationKey(this.state.floor)) throw new Error('当前位置已变化，读取结果未应用')
      // runLiveAction stops the capture; the native reader independently verifies
      // the same log context before and after the screenshot.
      this.state.floor.identityConfirmed = true
      this.state.runObservation = result
      this.recalculate(); this.persist()
    }, '请切回游戏并打开圣所地图；分别读取已校准的金币、坚毅和启迪数值')
    return this.getState()
  }
  saveStrategy(value) {
    this.assertEnabled()
    const strategy = validateSanctumStrategy(value)
    this.stop()
    this.state.strategy = strategy
    this.recalculate()
    return this.persist()
  }
  setMarks(value) {
    this.assertEnabled(); object(value)
    const marks = { targets: ids(value.targets), avoid: ids(value.avoid) }
    const known = new Set(this.state.floor?.rooms?.map(room => room.id) || [])
    if ([...marks.targets, ...marks.avoid].some(id => !known.has(id))) throw new Error('标记房间不存在')
    this.state.marks = marks
    this.recalculate()
    return this.publish()
  }
  positionKey(floor) { return JSON.stringify([floor?.runId, floor?.floorId, floor?.mapKey ?? floor?.rooms?.map(r => r.id).sort()]) }
  applyPosition(floor) {
    if (!floor) { this.positionOverride = null; return floor }
    if (this.positionOverride?.key !== this.positionKey(floor)) this.positionOverride = null
    const id = this.positionOverride?.id
    if (id && floor.rooms.some(room => room.id === id)) return { ...floor, currentRoomId: id, positionSource: 'manual', positionStatus: 'confirmed', initialSelection: false }
    return floor
  }
  async rescanRoom(value) {
    this.assertEnabled(); object(value)
    const floor = this.state.floor
    if (this.state.running || this.captureTask || this.startTask) throw new Error('请等待本轮结束后重扫')
    if (!floor || value.runId !== floor.runId || value.floorId !== floor.floorId || value.revision !== floor.revision) throw new Error('地图版本已变化')
    if (!floor.rooms.some(room => room.id === value.id)) throw new Error('目标房间不存在')
    this.rescanRequest = { id:value.id, floor:structuredClone(floor) }
    try { return await this.startLive() }
    finally { this.rescanRequest = null }
  }
  setCurrentRoom(value) {
    this.assertEnabled(); object(value)
    const floor = this.state.floor
    if (!floor?.identityConfirmed || value.runId !== floor.runId || value.floorId !== floor.floorId || value.revision !== floor.revision) throw new Error('地图版本已变化，请重新选择房间')
    if (value.id !== null && !floor.rooms.some(room => room.id === value.id)) throw new Error('目标房间不存在')
    this.positionOverride = value.id === null ? null : { key: this.positionKey(floor), id: value.id }
    if (this.liveDriver) this.liveDriver.positionOverride = this.positionOverride
    if (value.id === null) {
      this.state.floor = { ...floor, currentRoomId: null, positionSource: 'paths', positionStatus: 'unknown' }
    } else this.state.floor = this.applyPosition(floor)
    if (floor.currentRoomId !== this.state.floor.currentRoomId) {
      this.state.currentEffects = [{status:'unknown',rawText:'当前位置已修正，请重新读取实际效果'}]
      this.state.floor.currentEffects = this.state.currentEffects
      this.liveDriver?.requestEffectRescan()
    }
    this.recalculate()
    return this.publish()
  }
  correctRoom(id, patch) {
    this.assertEnabled(); object(patch)
    const room = this.state.floor?.rooms?.find(room => room.id === id)
    if (!room) throw new Error('修正房间不存在')
    const allowed = ['name', 'type', 'layout', 'recoveryCost', 'recovery', 'rewards']
    if (Object.keys(patch).some(key => !allowed.includes(key))) throw new Error('不支持的房间修正字段')
    for (const key of ['name', 'type', 'layout']) if (patch[key] !== undefined && (typeof patch[key] !== 'string' || patch[key].length > 160)) throw new Error('房间文字无效')
    for (const key of ['recovery', 'recoveryCost']) if (patch[key] !== undefined && patch[key] !== null && (!Number.isFinite(patch[key]) || patch[key] < 0 || patch[key] > 1e6)) throw new Error('房间数值无效')
    if (patch.rewards !== undefined && (!Array.isArray(patch.rewards) || patch.rewards.length > 20 || patch.rewards.some(reward =>
      !reward || typeof reward.currency !== 'string' || reward.currency.length > 100 || reward.quantity !== null && !Number.isFinite(reward.quantity)
      || reward.quantity < 0 || reward.quantity > 1e6 || !['immediate', 'floor', 'run', 'unknown', null].includes(reward.timing) || reward.groupId != null && (typeof reward.groupId !== 'string' || reward.groupId.length > 160)))) throw new Error('奖励格式无效')
    const changedProfile = ['name','layout'].some(field => patch[field] !== undefined && patch[field] !== room[field])
    if (changedProfile) {
      for (const field of ['layout','traps','layoutPreferenceKey','roomProfile']) {
        delete room[field]
        room.knowledge ||= {}
        room.knowledge[field] = { status:'failed', source:'manual' }
      }
      room.nameCandidates = []
    }
    Object.assign(room, structuredClone(patch), { detailsStatus: 'manual' })
    room.knowledge ||= {}
    for (const field of Object.keys(patch)) room.knowledge[field] = { status:'known', source:'manual' }
    if (changedProfile && patch.layout) {
      room.layoutPreferenceKey = patch.layout
      room.knowledge.layoutPreferenceKey = { status:'known', source:'manual' }
    }
    this.state.floor.revision = (this.state.floor.revision || 0) + 1
    this.recalculate()
    return this.publish()
  }
  evidenceRoom(binding) {
    object(binding)
    const floor = [this.state.floor,this.routeResult?.floor].find(floor=>floor?.runId===binding.runId && floor?.floorId===binding.floorId && floor.rooms?.some(room=>room.id===binding.roomId && room.recognition?.evidenceId===binding.evidenceId)) || this.state.floor
    if (!floor || binding.runId !== floor.runId || binding.floorId !== floor.floorId) throw new Error('截图所属楼层已变化')
    const room = floor.rooms.find(room => room.id === binding.roomId)
    if (!room || room.recognition?.evidenceId !== binding.evidenceId) throw new Error('截图已过期，请重新采集该房间')
    return room
  }
  getRoomEvidence(binding) {
    const source = [this.state.floor,this.routeResult?.floor].flatMap(floor=>floor?.effectScan?.groups || [])
      .flatMap(group=>group.entries || []).map(entry=>entry.source).find(source=>source?.kind === 'room'
        && binding?.evidenceId && ['runId','floorId','roomId','evidenceId'].every(key=>source[key] === binding[key]))
    if (source) return (this.repository?.evidence || this.liveDriver?.evidence).image(binding)
    const previous = [this.state.floor,this.routeResult?.floor].flatMap(floor=>floor?.rooms || []).find(room=>room.previousCapture?.binding.evidenceId === binding?.evidenceId)?.previousCapture
    if (previous && ['runId','floorId','roomId','evidenceId'].every(key=>previous.binding[key] === binding[key])) {
      return {...(this.repository?.evidence || this.liveDriver?.evidence).image(binding),previousCapture:true}
    }
    const room = this.evidenceRoom(binding)
    const image = (this.repository?.evidence || this.liveDriver?.evidence)?.image(binding)
    if (!image) throw new Error('本次截图已释放，请重新采集')
    return { ...image, region: image.kind === 'room-crop' ? image.region : room.recognition.region ?? image.region }
  }
  getEffectEvidence(binding) {
    const floors = [this.state.floor,this.routeResult?.floor].filter(Boolean)
    const evidence = this.repository?.evidence || this.liveDriver?.evidence
    if (!evidence) throw new Error('未保存截图；重新采集后可核对')
    const previous = floors.flatMap(floor=>effectEvidenceTargets(floor)).find(target=>target.previousCapture?.binding.evidenceId === binding?.evidenceId)?.previousCapture
    if (previous && ['runId','floorId','targetId','evidenceId'].every(key=>previous.binding[key] === binding[key])) {
      return {...evidence.image({...binding,roomId:binding.targetId}),previousCapture:true}
    }
    const found = floors.some(floor=>floor.effectScan?.targets?.some(target=>target.targetId === binding?.targetId
      && target.evidenceId === binding.evidenceId && (target.runId || floor.runId) === binding.runId && (target.floorId || floor.floorId) === binding.floorId))
    const memory=this.state.effectCorrectionMemory
    const remembered=[...(memory?.rules || []),...(memory?.history || []).map(change=>change.rule)]
      .some(rule=>rule?.source && ['runId','floorId','targetId','evidenceId'].every(key=>rule.source[key] === binding?.[key]))
    if ((!found && !remembered) || !binding.evidenceId) throw new Error('效果截图已过期，请重新采集')
    const image = evidence.image({...binding,roomId:binding.targetId})
    if (image.kind !== 'effect-crop') throw new Error('本次未保存独立效果浮窗，请重新采集')
    return image
  }
  async rescan(id) {
    this.assertEnabled()
    if (!this.replay) throw new Error('当前环境不提供离线回放')
    this.stop()
    this.state = acceptSanctumFloor(this.state, null)
    const generation = this.generation
    const controller = new AbortController()
    this.replayController = controller
    this.state.running = true
    this.state.status = 'replaying'
    this.state.reason = '正在回放样本；不会控制游戏鼠标'
    this.publish()
    try {
      const calibration = this.state.calibration[id]
        ? bindSanctumCalibration(this.state.calibration[id], this.samples().find(sample => sample.id === id)) : null
      const floor = await this.replay(id, { signal: controller.signal, calibration })
      if (generation !== this.generation) return this.getState()
      this.state = acceptSanctumFloor(this.state, { ...floor, sampleId: id, revision: 1, identityConfirmed: false })
      this.state.reason = '离线样本：轮次、当前房间与 DPI 未确认；不生成实际路线'
    } catch (error) {
      if (generation !== this.generation) return this.getState()
      this.state.status = 'error'; this.state.reason = error.message
    } finally {
      if (generation === this.generation) { this.state.running = false; this.replayController = null; this.publish() }
    }
    return this.getState()
  }
  calibrate(value) {
    this.assertEnabled()
    const calibration = bindSanctumCalibration(value, this.samples().find(sample => sample.id === value?.sampleId))
    this.stop()
    this.state.calibration[calibration.sampleId] = calibration
    this.state.reason = '样本校准已保存，请重新回放；DPI 和实机环境仍未确认'
    return this.persist()
  }
  clearCalibration(id) {
    this.assertEnabled()
    if (!this.samples().some(sample => sample.id === id)) throw new Error('未知圣所样本')
    this.stop()
    delete this.state.calibration[id]
    this.state.reason = '已恢复此样本的自动识别参数，请重新回放'
    return this.persist()
  }
  async shutdown() { this.stop(); await Promise.allSettled([this.startTask, this.restartTask, this.liveTask, this.captureTask]); await (this.liveDriver?.dispose?.() || this.liveDriver?.close()); this.liveDriver?.evidence?.clear(); this.liveSafetyUnsubscribe?.(); this.liveSafetyUnsubscribe = null; this.liveSurfaceUnsubscribe?.(); this.liveSurfaceUnsubscribe = null; this.listeners.clear() }
}
