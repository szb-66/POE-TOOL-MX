import { parseStatusTooltip } from './statusRecognition.js'
import { recognizeRoomProfile } from '../../../shared/sanctumRoomProfiles.js'
import { observationKey } from './runObservation.js'
import { SANCTUM_TIMEOUTS, sanctumError, isStepTimeout, isSafetyError, isForegroundLoss } from './errors.js'
import { emptyEffectGroups, mergeEffectGroups } from '../../../shared/sanctumEffects.js'
import { decideSanctumEffects, effectMapKey, sanctumEffectScan } from './effectLedger.js'
import { parseResourceRegions } from './runObservation.js'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { SanctumNativeClient } from './nativeClient.js'
import { SanctumFramePipeline } from './framePipeline.js'
import { SanctumImageCapacity } from './imageCapacity.js'
import { sanctumLogFloor, SanctumLogContext } from './logContext.js'
import { liveProfile, liveEnvironment, RESOURCE_REGION_KEYS } from '../../../shared/sanctumLive.js'
import { resolveSanctumCatalogText, sanctumRule } from './catalog.js'
import { recognizeRoomTexts } from './textRecognition.js'
import { SanctumEvidenceStore } from './evidence.js'

function textBlocks(lines, catalog) {
  const compact = text => text.replace(/\s/g, '')
  const descriptions = new Set((catalog?.entries || []).flatMap(e => e.descriptions || []).map(compact))
  const blocks = []
  for (let i=0; i<lines.length; i++) {
    let block = lines[i]
    for (let count=Math.min(4,lines.length-i); count>1; count--) {
      const joined = lines.slice(i,i+count).join('')
      if (descriptions.has(compact(joined))) { block=joined; i+=count-1; break }
    }
    blocks.push(block)
  }
  return blocks
}

function effectEntry(catalog, kind, text) {
  const direct = resolveSanctumCatalogText(catalog,kind,text)
  if (direct.id) return direct
  const descriptions = (catalog?.entries || []).filter(e => e.kind === kind && e.descriptions?.some(d => d.replace(/\s/g,'') === text.replace(/\s/g,'')))
  return descriptions.length === 1 ? resolveSanctumCatalogText(catalog,kind,descriptions[0].name) : direct
}

export function parseSanctumCurrentEffects(texts, catalog, complete = false) {
  if (!Array.isArray(texts) || texts.length > 80 || texts.some(text => typeof text !== 'string' || text.length > 1000)) complete = false
  const effects = [], lines = Array.isArray(texts) ? [...new Set(texts.filter(text => typeof text === 'string' && text.length <= 1000))].slice(0, 80) : []
  for (const rawText of textBlocks(lines,catalog)) {
    const rule = sanctumRule(rawText.trim())
    if (rule) { effects.push({ rawText, ...rule, status: 'matched' }); continue }
    const matches = ['boon', 'affliction'].map(kind => effectEntry(catalog, kind, rawText)).filter(entry => entry.status === 'matched')
    if (matches.length === 1 && matches[0].effects.length) effects.push(...matches[0].effects)
    else effects.push({ rawText, status: 'unknown' })
  }
  // Visible text does not establish that every active icon or scrolled entry
  // was read. An empty OCR result never means the character has no effects.
  if (!complete) effects.push({ status: 'unknown', rawText: '当前效果未完整采集；未展开或遮挡内容尚未确认' })
  return [...new Map(effects.map(e => [JSON.stringify(e),e])).values()]
}

export { parseEffectTooltip as parseSanctumEffectGroup } from './effectRecognition.js'

export function parseSanctumRoomTexts(texts, catalog, currencyIcons = [], ocr = {}) {
  const lines = (Array.isArray(texts) ? texts : []).filter(t => typeof t === 'string' && t.trim() && t.length <= 1000).slice(0,80)
  const recognition = recognizeRoomTexts(lines, catalog, ocr.ocrLines)
  recognition.blocks = ocr.ocrBlocks || []
  const profile = recognizeRoomProfile([...(ocr.titleTexts || []), ...(recognition.titles || [])], ocr.floorId)
  const result = { rawText:[...(ocr.titleTexts || []), ...lines].join('\n'), recognition,
    ...profile, rewards:[], effects:[], afflictions:[], rewardEvidence:[] }
  recognition.titleRegion = ocr.titleRegion
  const roomTypes = new Set(), gaps = []
  let structuredCount = 0
  // Structured values and icon offers remain usable even if the text catalog is unavailable.
  const structuredLines = lines.filter(text => /^(恢复|立即获得|完成本层时获得|完成本轮时获得|完成后(?:提供物品|获得物品|提供奖励))/.test(text.trim())
    && !recognition.matches.some(match => match.rawText.includes(text)))
  for (const match of [...recognition.matches, ...structuredLines.map(rawText => ({rawText}))]) {
    const text = match.rawText.trim().normalize('NFKC')
    const recovery = /^恢复\s*(\d+)\s*(?:点)?坚毅$/.exec(text)
    const reward = /^(立即获得|完成本层时获得|完成本轮时获得)\s*(\d+)\s*[x×]?\s*(.+)$/.exec(text)
    if (recovery && Number(recovery[1]) <= 1e6) { result.recovery = Number(recovery[1]); structuredCount++; match.role='value'; continue }
    if (reward && Number(reward[2]) <= 1e6 && catalog?.entries?.some(e => e.kind === 'reward' && e.name === reward[3])) {
      result.rewards.push({groupId:'offer',currency:reward[3],quantity:Number(reward[2]),
        timing:{立即获得:'immediate',完成本层时获得:'floor',完成本轮时获得:'run'}[reward[1]]})
      match.role='value'; structuredCount++; continue
    }
    if (/^(恢复|立即获得|完成本层时获得|完成本轮时获得)/.test(text)) {
      gaps.push('数值或领取信息未完整识别'); result.effects.push({rawText:text,status:'unknown'}); match.role='value'; continue
    }
    if (/^完成后(?:提供物品|获得物品|提供奖励)$/.test(text)) {
      roomTypes.add('reward')
      structuredCount++
      result.rewardEvidence.push({rawText:text,status:'unknown',reason:'奖励图标尚未识别',field:'currency'})
    }
    if (match.kind === 'room') {
      if (match.roomType) roomTypes.add(match.roomType)
      result.name ||= match.name
      continue
    }
    if (['boon','affliction'].includes(match.kind)) {
      const trigger = match.kind === 'affliction' ? 'entry' : 'choice'
      const effects = match.calculationStatus === 'supported' ? match.effects
        : [{rawText:`已识别：${match.name}；计算暂不支持`,status:'unknown',entryId:match.entryId}]
      result.effects.push(...effects.map(e => ({...e,trigger})))
      if (match.kind === 'affliction') result.afflictions.push({id:match.entryId,name:match.name,tier:effects[0]?.tier,rawText:match.rawText,
        status:'matched',trigger,rule:effects.find(e=>e.rule)?.rule})
    }
  }
  if (roomTypes.size === 1) result.type = [...roomTypes][0]
  if (roomTypes.size > 1) gaps.push('房间类型文字冲突')
  const icons = (Array.isArray(currencyIcons) ? currencyIcons : []).filter(icon => typeof icon?.currency === 'string'
    && icon.currency.length <= 100 && Number.isFinite(icon.confidence) && icon.confidence >= .94).slice(0,20)
  const textRewards = result.rewards.map(reward => ({reward, line:ocr.ocrLines?.find(line => line.text?.includes(reward.currency))}))
  for (const [index, icon] of icons.entries()) {
    // Text amounts and nearby icons describe the same offer only with spatial
    // evidence. Currency identity alone must never erase duplicate options.
    const reward = {currency:icon.currency,quantity:null,timing:null,groupId:'offer',
      offerId:`icon:${index}`,region:icon.region || null,quantityStatus:'not-shown',timingStatus:'not-shown'}
    const textIndex = textRewards.findIndex(({reward:r,line}) => r.currency === icon.currency && line?.region && icon.region
      && Math.abs(line.region.y + line.region.height/2 - icon.region.y - icon.region.height/2) < Math.max(line.region.height,icon.region.height)
      && icon.region.x <= line.region.x + line.region.width && icon.region.x + icon.region.width >= line.region.x - icon.region.width*2)
    if (textIndex >= 0) { textRewards.splice(textIndex,1) }
    else result.rewards.push(reward)
    result.rewardEvidence.push({...icon,rawText:icon.currency,status:'matched',field:'currency'})
  }
  if (icons.length) result.rewardEvidence = result.rewardEvidence.filter(e => e.status !== 'unknown')
  result.effects = [...new Map(result.effects.map(e=>[JSON.stringify(e),e])).values()]
  result.afflictions = [...new Map(result.afflictions.map(e=>[e.id,e])).values()]
  const identified = recognition.matches.length > 0 || structuredCount > 0 || icons.length > 0
  const rewardGap = result.rewardEvidence.find(e => e.status !== 'matched')
  result.detailsStatus = !identified ? 'failed' : gaps.length || rewardGap ? 'partial' : 'matched'
  result.failureReason = gaps[0] || rewardGap?.reason || (!identified ? recognition.reason || '框内没有可识别正文' : null)
  result.readStages = {ocr:lines.length ? 'matched':'empty',parse:result.detailsStatus,...(icons.length ? {icons:'matched'} : {})}
  result.calculationStatus = result.effects.some(e=>e.status==='unknown') || gaps.length || rewardGap ? 'unsupported':'supported'
  result.knowledge = Object.fromEntries(['layout','type','rewards','afflictions','effects','recovery','recoveryCost'].map(field=>[field,{
    status: field === 'rewards' && rewardGap ? 'failed' : identified && !['layout','recoveryCost'].includes(field) && (result[field] !== undefined || result.detailsStatus === 'matched') ? 'known':'failed',source:'observed'
  }]))
  for (const field of ['layout','traps','layoutPreferenceKey','roomProfile']) result.knowledge[field] = {
    status: profile[field] !== undefined ? 'known' : 'failed', source:'observed'
  }
  return result
}

export class SanctumLiveDriver {
  constructor({ catalog, withHidden, captureWindows = () => [], makeClient = options => new SanctumNativeClient(options), wait = delay, detection = null, clientEvents = null, windowActivation = null, recognitionWorkers = 2, ocrThreads = 2 }) {
    Object.assign(this, { catalog, withHidden, makeClient, wait, detection, clientEvents, windowActivation })
    this.recognitionWorkers = recognitionWorkers; this.ocrThreads = ocrThreads
    this.listeners = new Set(); this.client = null; this.latest = null; this.profile = null
    this.captureWindows = captureWindows
    this.progressListeners = new Set()
    this.surfaceListeners = new Set()
    this.evidence = new SanctumEvidenceStore()
    this.captureContexts = new Map()
    // Observe transitions even between manual captures. A disconnected context
    // cannot establish continuity of a whole Sanctum run.
    this.runWatch = clientEvents?.onEvent(event => {
      if (!['area-entered','game-state','client-state'].includes(event.type)) return
      if (event.type === 'game-state' && event.state === 'loading' && event.reason === 'area-loading') return
      const context=event.type === 'area-entered' ? event : clientEvents.currentContext(), floor=sanctumLogFloor(context)
      if (!floor.floorId || context?.sessionKey !== this.runContext?.sessionKey || context?.processId !== this.runContext?.processId) this.runContinuity=false
    })
  }
  async dispose() { await this.close(); this.runWatch?.(); this.runWatch=null }
  async open() {
    let warm = this.warmWorkers
    this.warmWorkers = null
    clearTimeout(this.warmTimer)
    await this.close()
    if (warm && (warm.expiresAt <= performance.now() || warm.ocr?.child === null || warm.ocr?.closed || warm.icons?.child === null || warm.icons?.closed)) {
      await Promise.allSettled([warm.ocr?.shutdown(),warm.icons?.shutdown()]);warm=null
    }
    if (warm) { this.ocrClient = warm.ocr; this.iconClient = warm.icons }
    this.usedWarmWorkers = Boolean(warm)
    this.recognitionFailed = false
    this.ocrClosing = false
    this.imageCapacity = new SanctumImageCapacity()
    this.queuedImages = new SanctumImageCapacity({count:128,bytes:128 * 1024 * 1024})
    this.client = this.createCaptureClient()
  }
  createCaptureClient() {
    const client = this.makeClient({ captureWindows: this.captureWindows,
      onProgress: event => { if (this.client !== client) return; for (const listener of this.progressListeners) listener({ ...event,
        evidenceId: this.captureContexts.get(`${client.sessionId}:${event.targetId}`)?.evidenceId }) },
      onEvidence: event => {
        if (this.client !== client) return
        const context = this.captureContexts.get(`${event.sessionId}:${event.targetId}`)
        if (!context || context.signal.aborted || event.targetId !== context.roomId || event.sessionId !== context.sessionId) return
        try {
          context.evidenceId = this.evidence.add(context, event)
          for (const listener of this.progressListeners) listener({ stage: 'locating', targetId: context.roomId, region: event.region,
            evidenceId: context.evidenceId, reason: event.region ? undefined : '未找到识别区域' })
        } catch { for (const listener of this.progressListeners) listener({ stage: 'locating', targetId: context.roomId, reason: '截图证据无法保存' }) }
      },
      onSurface: event => { if (this.client !== client) return; for (const listener of this.surfaceListeners) listener(event.observation) },
      onSafety: event => {
        if (this.client !== client) return
        this.latest = { ...this.latest, nativeError: { code:event.code || 'SAFETY_INTERRUPTED', reason: event.reason || '采集环境失效' } }
        for (const listener of this.listeners) listener(this.latest)
      } })
    return client
  }
  async recoverCapture(error, {floor = this.latest?.floor, mode, signal, scanOptions, icons} = {}) {
    signal.throwIfAborted(); this.assertLog()
    if (isSafetyError(error)) throw error
    if (!isStepTimeout(error) && this.client?.child) return true
    const previous = this.client
    this.client = null; this.captureContexts.clear()
    this.framePipeline?.invalidateBaseline()
    await previous?.shutdown()
    signal.throwIfAborted(); this.assertLog()
    this.client = this.createCaptureClient()
    try {
      const current = await this.client.request('environment',{}, {signal})
      this.assertLog(current.environment?.processId)
      if (JSON.stringify(current) !== JSON.stringify(this.recoveryEnvironment)) throw sanctumError('CONTEXT_CHANGED','恢复采集时窗口或 DPI 已变化')
      await this.client.request('arm',current,{signal})
      const data = await this.client.request('resumeCapture',{...this.profile,...scanOptions,mode},{signal})
      signal.throwIfAborted(); this.assertLog(data.environment?.processId)
      if (mode === 'map') {
        const rooms = data.floor?.rooms
        if (!data.interfaceMatched || !rooms) throw sanctumError('STEP_FAILED','恢复采集时地图未确认')
        if (rooms.length !== floor.rooms.length || floor.rooms.some(room => {
          const next = rooms.find(candidate => candidate.id === room.id)
          return !next || ['column','row','x','y','width','height'].some(key => !Number.isFinite(next[key]) || !Number.isFinite(room[key]) || Math.abs(next[key]-room[key]) > (['column','row'].includes(key)?0:2))
        })) throw sanctumError('CONTEXT_CHANGED','恢复采集时房间位置已变化')
        this.latest = {...this.latest,...data,floor:this.latest.floor,overlayExcluded:true}
      } else if (mode === 'effects' && JSON.stringify(data.icons) !== JSON.stringify(icons)) {
        throw sanctumError('STEP_FAILED','恢复采集时效果图标位置已变化')
      }
      if (this.latest) delete this.latest.nativeError
      return true
    } catch (failure) {
      signal.throwIfAborted(); this.assertLog()
      if (isSafetyError(failure)) throw failure
      const client = this.client; this.client = null
      await client?.shutdown()
      for (const listener of this.progressListeners) listener({diagnostic:{stage:'recovering',outcome:'failed',reason:failure.message,code:failure.code}})
      return false
    }
  }
  async awaitGame(signal) {
    let error
    for (let attempt = 0; attempt < 30; attempt++) {
      signal.throwIfAborted()
      try { return await this.client.request('environment', {}, { signal }) }
      catch (failure) { if (failure.message !== '游戏不在前台') throw failure; error = failure }
      await this.wait(500, undefined, { signal })
    }
    throw error || new Error('等待游戏前台超时')
  }
  async inspectEnvironment(signal) {
    await this.open()
    try { return await this.awaitGame(signal) }
    finally { await this.close() }
  }
  titleOptions(profile) {
    const config = this.detection?.getTitleConfig()
    const kind = profile.regionId ? `sanctum-${profile.regionId}` : 'sanctum-map'
    const templates = Object.fromEntries(Object.entries(config?.templates || {}).filter(([key]) => key === kind || !profile.regionId && ['sanctum-map-hud', 'sanctum-map-entry'].includes(key)))
    if (!Object.keys(templates).length) throw new Error('请补充公共界面标题截图')
    const { captures, preview, ...runtime } = profile
    return { ...runtime, roomSample: captures?.roomSize?.png, interfaceKind: kind, interfaceTitles: templates, matchThreshold: config.threshold }
  }
  async prepare(profile, signal, lock, progress = () => {}) {
    this.deadlineAt = Date.now() + SANCTUM_TIMEOUTS.prepare
    const valid = liveProfile(profile)
    if (!valid.captures.mapRegion) throw new Error('请补充地图截图预览')
    for (const capture of Object.values(valid.captures)) if (JSON.stringify(capture.environment) !== JSON.stringify(valid.environment)) throw new Error('校准项窗口或 DPI 不一致，请重新框选')
    this.profile = this.titleOptions(valid)
    if (!this.profile.interfaceTitles['sanctum-map']) throw new Error('请补充圣所地图标题截图')
    for (const title of Object.values(this.profile.interfaceTitles)) {
      if (JSON.stringify(liveEnvironment(title.environment)) !== JSON.stringify(valid.environment)) throw new Error('公共标题与校准窗口或 DPI 不一致')
    }
    const stages = {}
    const measure = async (key, work) => { const start=performance.now();try { return await work() } finally { stages[key]=performance.now()-start } }
    await measure('openMs',()=>this.open())
    this.client.deadlineAt = this.deadlineAt
    const prepareStarted = performance.now()
    this.prepareOcr(signal)

    const owner = `sanctum-effects:${randomUUID()}`, lease = new AbortController()
    signal = AbortSignal.any([signal, lease.signal])
    let unsubscribe
    try {
      if (!this.clientEvents) throw new Error('游戏日志监听不可用，请在设置中配置 Client.txt')
      await measure('logStartMs',()=>this.clientEvents.ensureStarted())
      signal.throwIfAborted()
      progress('正在切回游戏并校验圣所区域')
      const activation = await measure('activationMs',()=>this.windowActivation?.activateGame({ source: 'sanctum-start' }))
      signal.throwIfAborted()
      if (!activation?.success) throw new Error(this.windowActivation?.gameFailureMessage(activation?.code) || '游戏窗口激活服务不可用')
      const current = await measure('environmentMs',()=>this.awaitGame(signal))
      this.recoveryEnvironment = structuredClone(current)
      signal.throwIfAborted()
      const framesReady = measure('framesInitMs',()=>this.prepareFrames(current.environment, signal))
      framesReady.catch(() => {})
      await measure('logContextMs',()=>this.clientEvents.ensureCurrentContext(current.environment.processId, signal))
      signal.throwIfAborted()
      this.logContext = new SanctumLogContext(this.clientEvents, current.environment.processId, error => {
        this.latest = { foreground: false, interfaceMatched: false, logError: error.message }
        this.client?.abort?.(error)
        for (const listener of this.listeners) listener(this.latest)
      })
      if (JSON.stringify(liveEnvironment(current.environment)) !== JSON.stringify(this.profile.environment)) throw new Error('窗口尺寸或 DPI 与校准不符')
      this.assertLog()
      signal.throwIfAborted()
      await this.client.configure?.(this.profile, signal)
      const initial = await measure('interfaceMs',()=>this.sessionRequest('interfaceState', {}, signal))
      if (!initial.mapOpen) throw new Error('未检测到圣所地图，请打开地图后重试')
      if (!lock?.acquire(owner).success) throw new Error('另一项自动化正在运行或自动化锁不可用')
      unsubscribe = lock.subscribe(state => { if (state.owner !== owner) { lease.abort(); this.client?.abort?.(new Error('自动化锁已失效')) } })
      signal.throwIfAborted()
      await this.client.request('arm', current, { signal })
      this.assertLog()
      // Reuse details only while the exact log context and calibration remain
      // unchanged. A new area event or process must establish a new run.
      const resumeKey = JSON.stringify([this.logContext.key, current, this.profile])
      if (resumeKey !== this.resumeKey) { this.runId = randomUUID(); this.evidence.clear() }
      const runContext=this.logContext.context, floorNumber=this.assertLog().floorNumber
      const sameSession=this.runContext?.sessionKey===runContext.sessionKey && this.runContext?.processId===runContext.processId
      const sameFloor=this.runFloorNumber===floorNumber
      const nextFloor=this.runFloorNumber+1===floorNumber && this.runContinuity===true
      if (!sameSession || !this.runContinuity || !sameFloor && !nextFloor) this.sanctumRunId=randomUUID()
      this.runContext={...runContext}; this.runFloorNumber=floorNumber; this.runContinuity=true
      this.resumeKey = resumeKey
      this.progress = progress
      this.correctionKey = null

      await measure('mapMs',()=>this.observe(signal))
      await framesReady
      this.latest.floor.captureMetrics = {...this.latest.floor.captureMetrics,nativePrepareMs:performance.now()-prepareStarted,warmWorkers:this.usedWarmWorkers,prepareStages:stages}
      return current.environment
    } catch (error) { await this.close(); throw error }
    finally { this.deadlineAt = null; if (this.client) this.client.deadlineAt = null; unsubscribe?.(); lock?.release(owner) }
  }
  async sessionRequest(command, options, signal) {
    this.assertLog()
    signal.throwIfAborted()
    const started = performance.now()
    const stage = command === 'toggleMap' ? options.targetMode === 'effects' ? 'closing-map' : 'opening-map'
      : command === 'readRunPanel' ? 'reading-resources' : command === 'inspectEffects' ? 'scanning-effects' : command === 'hoverEffect' ? 'capturing-effect' : 'checking-interface'
    const report = (outcome, reason) => {
      for (const listener of this.progressListeners) listener({ stage, diagnostic: { stage, outcome, reason,
        elapsedMs: Math.round(performance.now()-started), remainingMs: Math.max(0,SANCTUM_TIMEOUTS.capture-(performance.now()-started)) } })
    }
    report('started')
    try {
      if (command === 'inspectEffects') this.framePipeline?.invalidateBaseline()
      const data = await this.client.request(command, { ...this.profile, ...options }, { signal })
      signal.throwIfAborted(); this.assertLog(data.environment?.processId ?? null)
      report('complete')
      return data
    } catch (error) { report('failed', error.message); throw error }
  }
  async switchMode(mode, signal) {
    try { await this.sessionRequest('toggleMap', { targetMode: mode }, signal) }
    catch (error) {
      signal.throwIfAborted(); this.assertLog()
      if (isSafetyError(error)) throw error
      if (!await this.recoverCapture(error,{mode:'interface',signal})) throw error
      const state = await this.sessionRequest('interfaceState',{},signal)
      if (!(mode === 'map' ? state.mapOpen : !state.mapOpen && state.hudVisible)) throw error
    }
  }
  requestEffectRescan() { this.effectLedger = null; this.correctionKey = null }
  resetEffects() { this.sanctumRunId=null; this.runContext=null; this.runContinuity=false; this.effectLedger = null; this.correctionKey = null; this.resumeKey = null; this.evidence.clear() }
  effectScope() {
    const context = this.logContext.context
    return JSON.stringify([context.sessionKey, context.processId, context.areaId, context.seed, this.assertLog().floorId, this.profile.environment])
  }
  async finalizeFloor(floor, signal, options = {}) {
    const started = performance.now(), resourceJobs = [], resourceTimings = []
    let capturedAt, result, inputFinished
    const finishCapture = () => {
      if (!inputFinished) {
        capturedAt = performance.now()
        inputFinished = Promise.resolve().then(()=>options.finishCapture?.())
      }
      return inputFinished
    }
    const queueResources = async () => {
      const captured = await this.captureCurrentResources(floor, signal, options.captureSignal || signal)
      resourceJobs.push(captured.recognition)
      if (captured.timings) resourceTimings.push(captured.timings)
      captured.recognition.catch(() => {})
      return captured.interfaceState
    }
    try {
      result = await this.finalizeCapturedFloor({...floor}, signal, {...options,finishCapture,queueResources})
    } finally {
      try { await finishCapture() }
      finally { await Promise.allSettled(resourceJobs) }
    }
    const observations = await Promise.all(resourceJobs)
    return {...result,runObservation:observations.at(-1) ?? null,
      captureMetrics:{...result.captureMetrics,effectsCaptureMs:capturedAt-started,effectsTotalMs:performance.now()-started,resources:resourceTimings}}
  }
  async finalizeCapturedFloor(floor, signal, {captureSignal = signal, finishCapture = async () => {}, onTaskProgress = () => {}, queueResources} = {}) {
    signal.throwIfAborted(); this.assertLog()
    const resourceLayout = await queueResources()
    const context = this.logContext.context
    const scope = JSON.stringify([context.sessionKey, context.processId, context.areaId, context.seed, floor.floorId, this.profile.environment])
    const key = scope + effectMapKey(floor)
    const decision = decideSanctumEffects(this.effectLedger, floor, scope, this.catalog)
    const advanced = decision.snapshot
    if (advanced?.complete === true) {
      this.effectLedger = advanced
      this.effectLedger.floor = structuredClone(floor)
      this.correctionKey = key
      if (advanced.updateMode === 'append') this.progress?.('已按完成房间加入明确痛苦，无需重读状态栏')
      else if (advanced.updateMode === 'reuse') this.progress?.('已完成房间没有不确定效果变化，沿用当前状态')
    } else if (this.correctionKey !== key) {
      this.correctionKey = key
      this.effectLedger = { scope, floor: structuredClone(floor), effects: [{ status: 'unknown', rawText: '当前效果尚未完整确认' }], complete: false, groups: emptyEffectGroups(),scanReason:decision.reason }
      this.progress?.(`正在读取当前位置的实际效果：${decision.reason}`)
      const initial = resourceLayout || await this.sessionRequest('interfaceState', {}, captureSignal)
      const layout = initial.hudLayout
      const embedded = layout === 'map'
      const regionKey = embedded ? 'mapEffectIconsRegion' : 'effectIconsRegion'
      if ((embedded && !this.profile.interfaceTitles['sanctum-map-hud']) || !this.profile[regionKey]) {
        const reason = embedded ? '请补充地图内状态栏识别与效果图标校准' : '请补充独立状态栏效果图标校准'
        this.effectLedger.groups = emptyEffectGroups(reason)
        this.effectLedger.reason = reason
        return this.withEffects(floor)
      }
      const scanOptions = { hudLayout: embedded ? 'map' : 'standalone', effectIconsRegion: this.profile[regionKey] }
      const groups = [], jobs = [], targets = []
      let scan, processed = 0, inputAvailable = true, safetyInterrupted = false
      const reportEffect = (targetId, reason, code) => {
        if (reason) for (const listener of this.progressListeners) listener({diagnostic:{stage:'effects',targetId,outcome:'failed',reason,code}})
        for (const listener of this.progressListeners) listener({stage:'effects',targetId,current:processed,total:scan?.icons.length || 0,reason,
          effectScan:{complete:false,groups:mergeEffectGroups(groups),binding:observationKey(floor),targets:structuredClone(targets)},currentEffects:[...groups.flatMap(group=>group.effects),{status:'unknown',rawText:'效果尚未完整读取'}]})
      }
      try {
        if (!embedded && initial.mapOpen) { this.progress?.('正在关闭地图，读取独立状态栏'); await this.switchMode('effects', captureSignal) }
        if (!embedded) await queueResources()
        this.progress?.('正在确认状态栏和效果入口')
        scan = await this.sessionRequest('inspectEffects', scanOptions, captureSignal)
        onTaskProgress({kind:'targets',total:scan.icons.length})
        for (const [index, icon] of scan.icons.entries()) {
          this.progress?.(`正在截取效果 ${index+1}/${scan.icons.length}`)
          const targetId=`effect:${index+1}`
          const target={targetId,iconIndex:index+1,runId:floor.runId || this.runId,floorId:floor.floorId,stage:'capturing',texts:[],region:null}
          targets.push(target)
          let context={runId:target.runId,floorId:target.floorId,roomId:targetId,sessionId:this.client?.sessionId,signal}
          this.captureContexts.set(`${context.sessionId}:${context.roomId}`,context)
          if (!inputAvailable) { target.stage='skipped'; target.reason='未执行：采集上下文恢复失败'; processed++; onTaskProgress({kind:'captured',targetId}); reportEffect(targetId,target.reason); continue }
          onTaskProgress({kind:'queued',targetId})
          let captured, frozen, postprocessed = false
          try {
            frozen = await this.freezeTarget('hoverEffect',{...this.profile,...scanOptions,icon,effectTarget:targetId},context,captureSignal)
            captured = frozen.data; context = frozen.binding
            signal.throwIfAborted(); this.assertLog(captured.environment?.processId)
          }
          catch (error) {
            frozen?.release?.(); frozen = null
            signal.throwIfAborted(); this.assertLog()
            if (isForegroundLoss(error) || isForegroundLoss(captureSignal.reason) || isSafetyError(error)) throw error
            Object.assign(target,{evidenceId:context.evidenceId,stage:'capture-failed',reason:isStepTimeout(error)?'效果截图超时':error.message});
            processed++; onTaskProgress({kind:'captured',targetId}); onTaskProgress({kind:'analyzed',targetId,failed:true}); reportEffect(targetId,target.reason,error.code)
            inputAvailable = await this.recoverCapture(error,{floor,mode:'effects',signal:captureSignal,scanOptions,icons:scan.icons})
            continue
          }
          onTaskProgress({kind:'captured',targetId})
          Object.assign(target,{evidenceId:context.evidenceId,region:captured.region || null,stage:'queued'})
          const job = this.processTarget(frozen,signal).then(value=>{
            postprocessed = true
            Object.assign(target,{evidenceId:context.evidenceId,region:value.region || null})
            return this.recognizeCaptured(value,signal,false,{onReading:()=>{target.stage='reading';reportEffect(targetId)}})
          }).then(read => {
            signal.throwIfAborted(); this.assertLog()
            const {effectGroup,originalEffectGroup,memoryHits,hasRewardContext,classificationComplete}=parseStatusTooltip({...read,targetId,iconIndex:index+1,evidenceId:context.evidenceId},this.catalog,this.effectCorrectionMemory)
            if (effectGroup) groups.push(effectGroup)
            const complete = (!effectGroup || effectGroup.complete)
            Object.assign(target,{stage:complete && !context.evidenceError?'matched':'failed',classificationComplete,
              readStatus:read.status,effectGroup:originalEffectGroup ? structuredClone(originalEffectGroup):null,captureIssue:context.evidenceError || null,
              rememberedGroup:effectGroup ? structuredClone(effectGroup):null,memoryHits,memoryRevision:this.effectCorrectionMemory?.revision || 0,
              contentKind:hasRewardContext ? effectGroup ? 'mixed':'reward':'effect',
              texts:read.texts,entries:effectGroup?.entries || [],reason:[effectGroup?.reason].filter(Boolean).join('；') || null,region:read.region || null})
            if (context.evidenceError) { target.reason=context.evidenceError; target.classificationComplete=false }
            processed++; reportEffect(targetId)
          }).catch(error => {
            signal.throwIfAborted(); this.assertLog()
            if (isSafetyError(error)) throw error
            target.stage=postprocessed?'ocr-failed':'postprocess-failed'; target.reason=isStepTimeout(error)?postprocessed?'效果文字识别超时':'效果图片处理超时':error.message
            processed++; reportEffect(targetId,target.reason,error.code)
          })
          const tracked = job.finally(()=>onTaskProgress({kind:'analyzed',targetId,failed:target.stage !== 'matched'}))
          tracked.catch(() => {})
          jobs.push(tracked)
        }
      } catch (error) {
        safetyInterrupted = signal.aborted || captureSignal.aborted || isSafetyError(error)
        signal.throwIfAborted()
        const lostForeground = isForegroundLoss(error) || isForegroundLoss(captureSignal.reason)
        if (safetyInterrupted && !lostForeground) throw error
        safetyInterrupted ||= lostForeground
        this.assertLog()
        if (lostForeground && scan) {
          for (const [index] of scan.icons.entries()) {
            const targetId = `effect:${index+1}`
            let target = targets.find(item => item.targetId === targetId)
            if (target && target.stage !== 'capturing') continue
            if (!target) { target = {targetId,iconIndex:index+1,runId:floor.runId || this.runId,floorId:floor.floorId,texts:[]}; targets.push(target) }
            Object.assign(target,{stage:'skipped',reason:`未执行：${captureSignal.reason?.message || error.message}`})
            onTaskProgress({kind:'analyzed',targetId,failed:true})
          }
        } else {
          if (isStepTimeout(error)) inputAvailable = await this.recoverCapture(error,{floor,mode:'interface',signal:captureSignal})
          targets.push({targetId:'effect:scan',runId:floor.runId || this.runId,floorId:floor.floorId,stage:'scan-failed',reason:error.message,texts:[]})
          for (const listener of this.progressListeners) listener({diagnostic:{stage:'effects',outcome:'failed',reason:error.message,code:error.code}})
        }
      } finally {
        try {
          if (!embedded && initial.mapOpen && !safetyInterrupted && !signal.aborted && !captureSignal.aborted) {
            this.assertLog()
            this.progress?.('正在恢复圣所地图')
            const current=await this.sessionRequest('interfaceState',{},captureSignal)
            if (!current.mapOpen) {
              if (!current.hudVisible) throw sanctumError('STEP_FAILED','独立状态栏未确认，无法恢复地图')
              await this.switchMode('map',captureSignal)
            }
          }
        } catch (error) {
          signal.throwIfAborted()
          if (!isForegroundLoss(error) && !isForegroundLoss(captureSignal.reason)) {
            if (isSafetyError(error) || captureSignal.aborted) throw error
            targets.push({targetId:'effect:restore',runId:floor.runId || this.runId,floorId:floor.floorId,stage:'restore-failed',reason:error.message,texts:[]})
            for (const listener of this.progressListeners) listener({diagnostic:{stage:'effects',outcome:'failed',reason:error.message,code:error.code}})
          }
        } finally {
          this.captureContexts.clear()
          await finishCapture()
          await Promise.allSettled(jobs)
        }
      }
      signal.throwIfAborted()
      const iconTargets = targets.filter(target => /^effect:\d+$/.test(target.targetId))
      const classificationComplete = scan?.coverageConfirmed === true && iconTargets.length === scan.icons.length
        && iconTargets.every(target => target.classificationComplete === true)
      const categorized = mergeEffectGroups(groups, true)
      const effectsComplete = classificationComplete && categorized.every(group => group.complete)
      const complete = effectsComplete
        && !targets.some(target => target.stage.endsWith('failed') || target.stage === 'skipped')
      const effects = categorized.flatMap(group => group.effects)
      if (!effectsComplete) effects.push({ status: 'unknown', rawText: '当前效果采集不完整，无法确认的内容保留未知' })

      signal.throwIfAborted(); this.assertLog()
      this.effectLedger = { scope, floor: structuredClone(floor), effects, complete, finished:true,reason:scan?.reason,groups: categorized, targets,
        effectsComplete, classificationComplete, coverageConfirmed:scan?.coverageConfirmed === true, binding:observationKey(floor),scanReason:decision.reason }
      this.correctionKey = key
    }
    return this.withEffects(floor)
  }
  withEffects(floor) {
    this.currentEffects = structuredClone(this.effectLedger?.effects || [{ status: 'unknown', rawText: '当前效果尚未确认' }])
    this.effectScan = sanctumEffectScan(this.effectLedger)
    return { ...floor, currentEffects: structuredClone(this.currentEffects), effectScan: structuredClone(this.effectScan) }
  }
  assertLog(processId) {
    try {
      if (!this.logContext) throw new Error('圣所采集尚未绑定当前游戏日志')
      return this.logContext.assertCurrent(processId)
    } catch (error) { throw sanctumError('CONTEXT_CHANGED',error.message) }
  }
  async readRunPanel(profile, floor, kind, signal) {
    if (kind !== 'resources') throw new Error('未知实际资源读取类型')
    const valid = liveProfile(profile), titleKey = 'sanctum-map'
    const titles = this.detection?.getTitleConfig()
    if (!RESOURCE_REGION_KEYS.some(key => valid[key]) || !titles?.templates?.[titleKey]) throw new Error('请先框选资源区域并校准地图标题')
    await this.open()
    try {
      const initial = await this.awaitGame(signal)
      if (JSON.stringify(liveEnvironment(initial.environment)) !== JSON.stringify(valid.environment)) throw new Error('窗口或 DPI 与校准不符')
      this.logContext = new SanctumLogContext(this.clientEvents, initial.environment.processId, error => this.client?.abort?.(error))
      if (!floor.logContextKey || floor.logContextKey !== this.logContext.key) throw new Error('地图记录与当前游戏区域不一致，请先重新采集地图')
      this.profile = { ...valid, interfaceKind:titleKey, interfaceTitles:Object.fromEntries(Object.entries(titles.templates).filter(([key]) => key !== 'sanctum-hud')), matchThreshold:titles.threshold }
      await this.client.request('arm', initial, {signal})
      return await this.readCurrentResources(floor, signal)
    } finally { await this.close() }
  }
  async readCurrentResources(floor, signal, captureSignal = signal) {
    const captured = await this.captureCurrentResources(floor, signal, captureSignal)
    return captured.recognition
  }
  async captureCurrentResources(floor, signal, captureSignal = signal) {
    if (!floor?.identityConfirmed || !floor.currentRoomId && !floor.initialSelection) return {recognition:Promise.resolve(null)}
    const empty = parseResourceRegions({}, floor)
    if (!RESOURCE_REGION_KEYS.some(key => this.profile?.[key])) return {recognition:Promise.resolve(empty)}
    try {
      const started = performance.now()
      const captured = await this.sessionRequest('readRunPanel', {}, captureSignal)
      const timings = {captureMs:performance.now()-started,queueMs:0,ocrMs:0}
      const recognition = this.parseCapturedResources(captured, floor, signal, timings).finally(()=>{timings.totalMs=performance.now()-started})
      recognition.catch(() => {})
      return {recognition,interfaceState:captured.interfaceState,timings}
    } catch (error) {
      signal.throwIfAborted(); captureSignal.throwIfAborted(); this.assertLog()
      if (isSafetyError(error)) throw error
      return {recognition:Promise.resolve({...empty,reason:error.message})}
    }
  }
  async parseCapturedResources(captured, floor, signal, timings) {
    const empty = parseResourceRegions({}, floor)
    try {
      const reads = {}
      for (const key of RESOURCE_REGION_KEYS) {
        const value = captured.regions?.[key]
        if (!value) continue
        try {
          reads[key] = await this.recognizeCaptured(value, signal, false, {resources:true})
          if (timings) { timings.queueMs += reads[key].captureMetrics?.queueMs || 0;timings.ocrMs += reads[key].captureMetrics?.recognitionMs || 0 }
        }
        catch (error) {
          signal.throwIfAborted(); this.assertLog()
          if (isSafetyError(error)) throw error
          reads[key] = {texts:[],reason:error.message}
        }
      }
      this.assertLog(); signal.throwIfAborted()
      return {...parseResourceRegions(reads, floor), layout:captured.resourceLayout,
        rawText:RESOURCE_REGION_KEYS.filter(key=>reads[key]).map(key=>`${key}: ${(reads[key].texts || []).join(' / ')}`).join('\n')}
    } catch (error) {
      signal.throwIfAborted(); this.assertLog()
      if (isSafetyError(error)) throw error
      for (const listener of this.progressListeners) listener({diagnostic:{stage:'resources',outcome:'failed',reason:error.message}})
      return {...empty,reason:error.message}
    }
  }
  async observe(signal) {
    const identity = this.assertLog()
    signal.throwIfAborted()
    this.framePipeline?.invalidateBaseline()
    const data = await this.client.request('observe', this.profile, { signal })
    this.assertLog(data.environment?.processId ?? null)
    signal.throwIfAborted()
    const current = data.floor?.rooms?.find(r=>r.id===data.floor.currentRoomId)
    const previous = this.lastObservedPosition
    if (previous?.floorId === identity.floorId && Number.isFinite(current?.column) && current.column < previous.column) {
      // Backward progress can be a new book or an identity conflict. Neither
      // permits restoring the old run's effects or pending reward pool.
      this.sanctumRunId=randomUUID(); this.runId=randomUUID(); this.effectLedger=null
    }
    if (Number.isFinite(current?.column)) this.lastObservedPosition={floorId:identity.floorId,column:current.column}
    data.floor = { ...data.floor, ...identity, runId: this.runId, sanctumRunId:this.sanctumRunId || this.runId, logContextKey:this.logContext.key,
      identityConfirmed: true, captureMetrics: data.captureMetrics,
      currentEffects: structuredClone(this.currentEffects || [{ status: 'unknown', rawText: '当前效果尚未采集' }]), effectScan: structuredClone(this.effectScan) }
    data.floor.mapKey ||= JSON.stringify([data.floor.sanctumRunId, identity.floorId])
    const positionKey = JSON.stringify([data.floor.runId, data.floor.floorId, data.floor.mapKey ?? data.floor.rooms.map(r => r.id).sort()])
    if (this.positionOverride?.key !== positionKey) this.positionOverride = null
    if (this.positionOverride && data.floor.rooms.some(room => room.id === this.positionOverride.id)) {
      Object.assign(data.floor, { currentRoomId: this.positionOverride.id, positionSource: 'manual', positionStatus: 'confirmed', initialSelection: false })
    }
    const decision = decideSanctumEffects(this.effectLedger, data.floor, this.effectScope(), this.catalog)
    const cached = decision.snapshot
    data.floor.currentEffects = structuredClone(cached?.effects || [{ status: 'unknown', rawText: '当前位置实际效果尚未识别' }])
    data.floor.effectScan = sanctumEffectScan(cached)
    if (!cached) data.floor.effectScan.scanReason = decision.reason
    this.latest = { ...data, overlayExcluded: true }
    return this.latest
  }
  inspect() { return this.latest }
  subscribeSafety(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  subscribeProgress(listener) { this.progressListeners.add(listener); return () => this.progressListeners.delete(listener) }
  subscribeSurface(listener) { this.surfaceListeners.add(listener); return () => this.surfaceListeners.delete(listener) }
  async *frames({ signal }) {
    try {
      yield this.latest?.floor ? this.latest : await this.observe(signal)
    } finally { await this.close({keepWarm:true}) }
  }
  async prepareFrames(environment, signal) {
    let pipeline
    const client = this.makeClient({onEvidence:event=>pipeline.evidence(event)})
    pipeline = new SanctumFramePipeline({client,onEvidence:(context,event)=>{
      if (context.signal.aborted || this.framePipeline !== pipeline) return
      this.assertLog()
      context.evidenceId = this.evidence.add(context,event)
      for (const listener of this.progressListeners) listener({background:true,runId:context.runId,floorId:context.floorId,stage:'locating',targetId:context.roomId,
        evidenceId:context.evidenceId,region:event.region})
    }})
    this.framePipeline = pipeline
    await pipeline.prepare(environment,signal)
  }
  async freezeTarget(command, input, context, signal) {
    if (!this.framePipeline) {
      // Injected replay drivers can return an already frozen/encoded fixture.
      return {data:await this.client.request(command,input,{signal}),binding:context}
    }
    return this.framePipeline.freeze(this.client,command,input,context,signal)
  }
  async processTarget(frozen, signal) {
    const accept = async value => {
      if (!value.png) return value
      const started = performance.now()
      const releaseQueued = await (this.queuedImages ||= new SanctumImageCapacity({count:128,bytes:128 * 1024 * 1024}))
        .acquire(Buffer.byteLength(value.png, 'utf8'), signal)
      return {...value,releaseQueued,captureMetrics:{...value.captureMetrics,encodedCapacityWaitMs:performance.now()-started}}
    }
    if (!frozen.data.frozenFrame) {
      try { return await accept(frozen.data) } finally { frozen.release?.() }
    }
    return this.framePipeline.process(frozen,signal,accept)
  }
  prepareOcr(signal) {
    if (this.recognitionWorkers !== 1 && !this.iconClient) {
      this.iconClient = this.makeClient({})
      this.iconReady = this.iconClient.request('prepareIcons', {}, {signal,timeoutMs:SANCTUM_TIMEOUTS.prepare})
      this.iconReady.catch(()=>{})
    }
    if (this.ocrClient) return this.ocrReady || Promise.resolve()
    this.ocrClient = this.makeClient({})
    this.ocrReady = this.ocrClient.request('prepareOcr', {threads:this.ocrThreads}, {signal,timeoutMs:SANCTUM_TIMEOUTS.prepare})
    this.ocrReady.catch(() => {})
    return this.ocrReady
  }
  async endCapture() {
    const client = this.client
    this.client = null
    this.captureContexts.clear()
    await client?.shutdown()
    this.framePipeline?.invalidateBaseline()
  }
  async recognizeCaptured(data, signal, includeIcons = true, options = {}) {
    let read
    try { read = await this.recognizeQueued(data, signal, includeIcons, options);return read }
    finally {
      const needsEncodedSupplement = options.retainImage && read?.hasCurrencyOffer && !read.imageRef
      if (!needsEncodedSupplement) { data.releaseQueued?.(); if (data.releaseQueued) data.png = undefined }
    }
  }
  async recognizeQueued(data, signal, includeIcons = true, options = {}) {
    const queuedAt = performance.now()
    if ((!data.png && !data.imageRef) || !data.region) return data
    const iconsOnly = options.iconsOnly === true
    const separateIcons = iconsOnly && this.recognitionWorkers !== 1
    const lane = separateIcons ? 'iconTail' : 'ocrTail'
    const clientKey = separateIcons ? 'iconClient' : 'ocrClient'
    const releaseCapacity = options.retainImage
      ? await (this.imageCapacity ||= new SanctumImageCapacity()).acquire(data.region.width * data.region.height * 3, signal) : () => {}
    let retained = false, releaseRetained
    const work = (this[lane] || Promise.resolve()).then(async () => {
      signal.throwIfAborted(); this.assertLog()
      if (this.ocrClosing) throw new Error('识别进程正在退出')
      if (separateIcons) {
        if (!this.iconClient) {
          this.iconClient = this.makeClient({})
          await this.iconClient.request('prepareIcons', {}, {signal,timeoutMs:SANCTUM_TIMEOUTS.prepare})
        }
        if (this.iconReady) { const ready=this.iconReady;this.iconReady=null;await ready }
      } else {
        if (!this.ocrClient) this.prepareOcr(signal)
        if (this.ocrReady) { const ready = this.ocrReady; this.ocrReady = null; await ready }
      }
      signal.throwIfAborted()
      options.onReading?.()
      const {width,height} = data.region, started = performance.now()
      const owner = this[clientKey]
      const read = await owner.request('readFrozen', {...(data.imageRef ? {imageRef:data.imageRef} : {png:data.png}),
        binding:options.binding,retainImage:options.retainImage === true,region:{x:0,y:0,width,height},
        includeIcons,room:options.room ?? includeIcons,iconsOnly,resources:options.resources === true}, {signal,timeoutMs:SANCTUM_TIMEOUTS.ocr})
      let releaseImage
      if (read.imageRef) {
        retained = true
        let released = false
        releaseImage = releaseRetained = async () => {
          if (released) return
          released = true
          const release = (this.ocrTail || Promise.resolve()).then(async () => {
            if (owner === this.ocrClient && !owner.closed && owner.child !== null) await owner.request('releaseImage', read.imageRef, {signal,timeoutMs:SANCTUM_TIMEOUTS.ocr})
          }).finally(releaseCapacity)
          this.ocrTail = release.catch(() => {})
          await release
        }
      }
      signal.throwIfAborted(); this.assertLog()
      const offset = region => region ? {...region,x:region.x+data.region.x,y:region.y+data.region.y} : null
      return {...data,...read,releaseImage,png:undefined,region:data.region,status:data.status,
        bodyRegion:offset(read.bodyRegion),titleRegion:offset(read.titleRegion),
        resourceEvidence:read.resourceEvidence ? {...read.resourceEvidence,coinRegion:offset(read.resourceEvidence.coinRegion),resolvePanel:offset(read.resourceEvidence.resolvePanel)} : undefined,
        ocrBlocks:(read.ocrBlocks || []).map(b=>({...b,region:offset(b.region)})),
        ocrLines:(read.ocrLines || []).map(b=>({...b,region:offset(b.region)})),
        currencyIcons:(read.currencyIcons || []).map(b=>({...b,region:offset(b.region)})),
        captureMetrics:{...data.captureMetrics,...read.captureMetrics,queueMs:started-queuedAt,recognitionMs:performance.now()-started}}
    })
    const settled = work.catch(async error => {
      this.recognitionFailed = true
      releaseRetained?.().catch(()=>{})
      if (isStepTimeout(error) || this[clientKey]?.child === null) {
        const client = this[clientKey]; this[clientKey] = null; if (!iconsOnly) this.ocrReady = null
        await client?.shutdown()
      }
      throw error
    }).finally(() => { if (!retained) releaseCapacity() })
    this[lane] = settled.catch(() => {})
    return settled
  }
  async captureRoom(room, {signal, captureSignal = signal, guard, onReading}) {
    guard(); this.assertLog()
    let context = {runId:this.runId,floorId:this.assertLog().floorId,roomId:room.id,sessionId:this.client.sessionId,signal}
    this.captureContexts.set(`${context.sessionId}:${context.roomId}`,context)
    const frozen = await this.freezeTarget('hover', {...this.profile,roomId:room.id,targetRoom:room}, context, captureSignal)
    const data = frozen.data
    context = frozen.binding
    const processed = this.processTarget(frozen,signal)
    processed.catch(()=>{})
    signal.throwIfAborted(); this.assertLog(data.observation?.environment?.processId ?? null)
    if (!captureSignal.aborted) this.latest = {...this.latest,...data.observation,overlayExcluded:true}
    let textRead, textPatch, frozenData, supplementTask
    const binding = {runId:context.runId,floorId:context.floorId,roomId:context.roomId,sessionId:context.sessionId,frameId:context.frameId || randomUUID()}
    const parse = read => {
      const started = performance.now()
      const patch = parseSanctumRoomTexts(read.texts,this.catalog,read.currencyIcons,{...read,floorId:context.floorId})
      patch.recognition = {...patch.recognition,evidenceId:context.evidenceId,region:read.region || null,bodyRegion:read.bodyRegion}
      patch.tooltipRegion = read.bodyRegion || read.region
      patch.captureMetrics = {...read.captureMetrics,parseMs:performance.now()-started}
      patch.diagnosticId = read.diagnosticId
      patch.failureReason = read.reason || patch.failureReason
      if (read.status !== 'located') patch.detailsStatus = patch.rawText ? 'partial':'failed'
      if (context.evidenceError) { patch.detailsStatus='failed';patch.failureReason=context.evidenceError }
      if (read.hasCurrencyOffer) patch.readStages.icons = 'queued'
      return patch
    }
    const supplement = async () => {
      try {
        const icons = await this.recognizeCaptured({...frozenData,imageRef:textRead.imageRef},signal,false,{room:true,iconsOnly:true,binding})
        const patch = parse({...textRead,currencyIcons:icons.currencyIcons})
        patch.readStages.icons = icons.currencyIcons.length ? 'matched':'empty'
        patch.captureMetrics = {...patch.captureMetrics,iconsMs:icons.captureMetrics.iconsMs,iconQueueMs:icons.captureMetrics.queueMs,iconCalls:1}
        return {patch}
      } catch (error) {
        signal.throwIfAborted(); this.assertLog()
        return {patch:{...textPatch,readStages:{...textPatch.readStages,icons:isStepTimeout(error)?'timeout':'failed'},failureReason:isStepTimeout(error)?'文字已识别；奖励图标识别超时':'文字已识别；奖励图标识别失败'}}
      } finally {
        try { await textRead?.releaseImage?.() }
        finally { frozenData?.releaseQueued?.(); if (frozenData) frozenData.png = undefined }
      }
    }
    const recognition = processed.then(value=>{frozenData=value;return this.recognizeCaptured(value,signal,false,{room:true,onReading,retainImage:true,binding})}).then(read => {
      textRead = read; textPatch = parse(read)
      if (read.hasCurrencyOffer) { supplementTask = supplement(); supplementTask.catch(()=>{}) }
      else { read.releaseImage?.() }
      return {patch:textPatch}
    }).catch(error => {
      textRead?.releaseImage?.().catch(()=>{})
      frozenData?.releaseQueued?.(); if (frozenData) frozenData.png = undefined
      signal.throwIfAborted(); this.assertLog()
      const postFailed = Boolean(data.frozenFrame && !frozenData)
      textPatch = {detailsStatus:'failed',rawText:'',readStages:{...(postFailed ? {locate:isStepTimeout(error)?'timeout':'failed'} : {}),ocr:postFailed?'skipped':isStepTimeout(error)?'timeout':'failed',parse:'failed'},
        captureMetrics:frozenData?.captureMetrics || data.captureMetrics,
        failureReason:postFailed ? isStepTimeout(error)?'图片处理超时':'图片处理失败' : isStepTimeout(error)?'文字识别超时':'截图文字识别失败',
        recognition:{status:'failed',matches:[],evidenceId:context.evidenceId,region:frozenData?.region}}
      return {patch:textPatch}
    })
    return {recognition, needsSupplement:()=>textRead?.hasCurrencyOffer === true, supplement:async () => supplementTask || null}
  }
  async hover(room, options) {
    const captured = await this.captureRoom(room, options)
    const text = await captured.recognition
    return await captured.supplement?.() || text
  }
  async discardWarmWorkers() {
    clearTimeout(this.warmTimer)
    const warm = this.warmWorkers; this.warmWorkers = null
    await Promise.allSettled([warm?.ocr?.shutdown(),warm?.icons?.shutdown()])
  }
  async finishProcessing({keepWarm = false, signal} = {}) {
    this.ocrClosing = true
    this.imageCapacity?.close()
    this.queuedImages?.close()
    const frames=this.framePipeline; this.framePipeline=null; await frames?.close()
    if (keepWarm && !signal?.aborted && !this.recognitionFailed && this.ocrClient && !this.ocrClient.closed && this.ocrClient.child !== null) {
      await Promise.all([this.ocrTail,this.iconTail,this.ocrReady,this.iconReady])
      try {
        await this.ocrClient.request('resetImages', {}, {signal,timeoutMs:SANCTUM_TIMEOUTS.prepare})
        await this.discardWarmWorkers()
        signal?.throwIfAborted()
        this.warmWorkers = {ocr:this.ocrClient,icons:this.iconClient,expiresAt:performance.now()+60000}
        this.ocrClient=null;this.iconClient=null
        this.warmTimer=setTimeout(()=>{void this.discardWarmWorkers()},60000)
        this.warmTimer.unref?.()
      } catch { /* A failed reset cannot be reused. Close both workers below. */ }
    }
    const icons=this.iconClient;this.iconClient=null;await icons?.shutdown();await this.iconTail;this.iconTail=null;this.iconReady=null
    const ocr=this.ocrClient;this.ocrClient=null;await ocr?.shutdown();await this.ocrTail;this.ocrTail=null;this.ocrReady=null
  }
  async close({keepWarm = false} = {}) {
    if (!keepWarm) await this.discardWarmWorkers()
    await this.finishProcessing()
    this.captureContexts.clear();this.currentEffects=null;this.effectScan=null;this.logContext?.close();this.logContext=null
    const client=this.client;this.client=null;if(client)await client.shutdown()
  }
}
