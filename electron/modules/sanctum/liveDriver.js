import { parseStatusTooltip } from './statusRecognition.js'
import { observationKey } from './runObservation.js'
import { SANCTUM_TIMEOUTS, sanctumError, isStepTimeout, isSafetyError, isForegroundLoss } from './errors.js'
import { emptyEffectGroups, mergeEffectGroups, completedEffectGroups, effectReadIssues, effectScanFinished } from '../../../shared/sanctumEffects.js'
import { reuseSanctumEffects, effectMapKey } from './effectLedger.js'
import { parseRunPanel } from './runObservation.js'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { SanctumNativeClient } from './nativeClient.js'
import { SanctumFramePipeline } from './framePipeline.js'
import { sanctumLogFloor, SanctumLogContext } from './logContext.js'
import { liveProfile, liveEnvironment, relicProfile, footprintUsable } from '../../../shared/sanctumLive.js'
import { parseSanctumRelic } from './relicParser.js'
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
  const result = { rawText:lines.join('\n'), recognition, nameCandidates:[], rewards:[], effects:[], afflictions:[], rewardEvidence:[] }
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
    status: field === 'rewards' && rewardGap ? 'failed' : !['layout','recoveryCost'].includes(field) && (result[field] !== undefined || result.detailsStatus === 'matched') ? 'known':'failed',source:'observed'
  }]))
  return result
}

export class SanctumLiveDriver {
  constructor({ catalog, withHidden, captureWindows = () => [], makeClient = options => new SanctumNativeClient(options), wait = delay, detection = null, clientEvents = null, windowActivation = null }) {
    Object.assign(this, { catalog, withHidden, makeClient, wait, detection, clientEvents, windowActivation })
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
    await this.close()
    this.ocrClosing = false
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
    const templates = Object.fromEntries(Object.entries(config?.templates || {}).filter(([key]) => key === kind || !profile.regionId && ['sanctum-hud', 'sanctum-map-hud'].includes(key)))
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
    await this.open()
    this.client.deadlineAt = this.deadlineAt

    const owner = `sanctum-effects:${randomUUID()}`, lease = new AbortController()
    signal = AbortSignal.any([signal, lease.signal])
    let unsubscribe
    try {
      if (!this.clientEvents) throw new Error('游戏日志监听不可用，请在设置中配置 Client.txt')
      await this.clientEvents.ensureStarted()
      signal.throwIfAborted()
      progress('正在切回游戏并校验圣所区域')
      const activation = await this.windowActivation?.activateGame({ source: 'sanctum-start' })
      signal.throwIfAborted()
      if (!activation?.success) throw new Error(this.windowActivation?.gameFailureMessage(activation?.code) || '游戏窗口激活服务不可用')
      const current = await this.awaitGame(signal)
      this.recoveryEnvironment = structuredClone(current)
      signal.throwIfAborted()
      await this.clientEvents.ensureCurrentContext(current.environment.processId, signal)
      signal.throwIfAborted()
      this.prepareOcr(signal)
      this.logContext = new SanctumLogContext(this.clientEvents, current.environment.processId, error => {
        this.latest = { foreground: false, interfaceMatched: false, logError: error.message }
        this.client?.abort?.(error)
        for (const listener of this.listeners) listener(this.latest)
      })
      if (JSON.stringify(liveEnvironment(current.environment)) !== JSON.stringify(this.profile.environment)) throw new Error('窗口尺寸或 DPI 与校准不符')
      this.assertLog()
      signal.throwIfAborted()
      const initial = await this.sessionRequest('interfaceState', {}, signal)
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

      await this.observe(signal)
      await this.prepareFrames(current.environment, signal)
      return current.environment
    } catch (error) { await this.close(); throw error }
    finally { this.deadlineAt = null; if (this.client) this.client.deadlineAt = null; unsubscribe?.(); lock?.release(owner) }
  }
  async sessionRequest(command, options, signal) {
    this.assertLog()
    signal.throwIfAborted()
    const started = performance.now()
    const stage = command === 'toggleMap' ? options.targetMode === 'effects' ? 'closing-map' : 'opening-map'
      : command === 'inspectEffects' ? 'scanning-effects' : command === 'hoverEffect' ? 'capturing-effect' : 'checking-interface'
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
  async finalizeFloor(floor, signal, {captureSignal = signal, finishCapture = async () => {}, onTaskProgress = () => {}} = {}) {
    signal.throwIfAborted(); this.assertLog()
    const context = this.logContext.context
    const scope = JSON.stringify([context.sessionKey, context.processId, context.areaId, context.seed, floor.floorId, this.profile.environment])
    const key = scope + effectMapKey(floor)
    const advanced = reuseSanctumEffects(this.effectLedger, floor, scope)
    if (advanced?.complete === true) {
      this.effectLedger = advanced
    } else if (this.correctionKey !== key) {
      this.correctionKey = key
      this.effectLedger = { scope, floor: structuredClone(floor), effects: [{ status: 'unknown', rawText: '当前效果尚未完整确认' }], complete: false, groups: emptyEffectGroups() }
      this.progress?.('正在读取当前位置的实际效果')
      const initial = await this.sessionRequest('interfaceState', {}, captureSignal)
      const layout = initial.hudLayout
      const embedded = layout === 'map'
      const regionKey = embedded ? 'mapEffectIconsRegion' : 'effectIconsRegion'
      const titleKey = embedded ? 'sanctum-map-hud' : 'sanctum-hud'
      if (!this.profile.interfaceTitles[titleKey] || !this.profile[regionKey]) {
        const reason = embedded ? '请补充地图内状态栏识别与效果图标校准' : '请补充独立状态栏识别与效果图标校准'
        this.effectLedger.groups = emptyEffectGroups(reason)
        this.effectLedger.reason = reason
        return this.withEffects(floor)
      }
      const scanOptions = { hudLayout: embedded ? 'map' : 'standalone', effectIconsRegion: this.profile[regionKey] }
      const groups = [], rewardGroups = [], jobs = [], targets = []
      let scan, processed = 0, inputAvailable = true, safetyInterrupted = false
      const reportEffect = (targetId, reason, code) => {
        if (reason) for (const listener of this.progressListeners) listener({diagnostic:{stage:'effects',targetId,outcome:'failed',reason,code}})
        for (const listener of this.progressListeners) listener({stage:'effects',targetId,current:processed,total:scan?.icons.length || 0,reason,
          effectScan:{complete:false,groups:mergeEffectGroups(groups),rewardGroups:structuredClone(rewardGroups),binding:observationKey(floor),targets:structuredClone(targets)},currentEffects:[...groups.flatMap(group=>group.effects),{status:'unknown',rawText:'效果尚未完整读取'}]})
      }
      try {
        if (!embedded && initial.mapOpen) { this.progress?.('正在关闭地图，读取独立状态栏'); await this.switchMode('effects', captureSignal) }
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
            const {effectGroup,rewardGroup,classificationComplete}=parseStatusTooltip({...read,targetId,iconIndex:index+1,evidenceId:context.evidenceId},this.catalog)
            if (effectGroup) groups.push(effectGroup)
            if (rewardGroup) rewardGroups.push({...rewardGroup,targetId,evidenceId:context.evidenceId})
            const complete = (!effectGroup || effectGroup.complete) && (!rewardGroup || rewardGroup.complete)
            Object.assign(target,{stage:complete && !context.evidenceError?'matched':'failed',classificationComplete,
              contentKind:rewardGroup ? effectGroup ? 'mixed':'reward':'effect',
              texts:read.texts,entries:effectGroup?.entries || [],reason:[effectGroup?.reason,rewardGroup?.reason].filter(Boolean).join('；') || null,region:read.region || null})
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
      const complete = effectsComplete && rewardGroups.every(group => group.complete)
        && !targets.some(target => target.stage.endsWith('failed') || target.stage === 'skipped')
      const effects = categorized.flatMap(group => group.effects)
      if (!effectsComplete) effects.push({ status: 'unknown', rawText: '当前效果采集不完整，无法确认的内容保留未知' })

      signal.throwIfAborted(); this.assertLog()
      this.effectLedger = { scope, floor: structuredClone(floor), effects, complete, finished:true,reason:scan?.reason,groups: categorized, targets,
        rewardGroups, effectsComplete, classificationComplete, coverageConfirmed:scan?.coverageConfirmed === true, binding:observationKey(floor) }
      this.correctionKey = key
    }
    return this.withEffects(floor)
  }
  withEffects(floor) {
    this.currentEffects = structuredClone(this.effectLedger?.effects || [{ status: 'unknown', rawText: '当前效果尚未确认' }])
    this.effectScan = { complete: this.effectLedger?.complete === true, finished:effectScanFinished(this.effectLedger),reason:this.effectLedger?.reason,
      groups: completedEffectGroups(this.effectLedger?.groups, effectScanFinished(this.effectLedger)), targets: this.effectLedger?.targets || [],
      rewardGroups:this.effectLedger?.rewardGroups || [], effectsComplete:this.effectLedger?.effectsComplete === true,
      classificationComplete:this.effectLedger?.classificationComplete === true, coverageConfirmed:this.effectLedger?.coverageConfirmed === true,
      binding:this.effectLedger?.binding }
    this.effectScan.issues = effectReadIssues(this.effectScan)
    return { ...floor, currentEffects: structuredClone(this.currentEffects), effectScan: structuredClone(this.effectScan) }
  }
  async scanRelics(value, signal, lock, progress = () => {}) {
    const profile = this.titleOptions(relicProfile(value)), owner = `sanctum-relics:${randomUUID()}`, scanId = randomUUID()
    if (!value.preview) throw new Error('请重新框选圣物网格以补充预览')
    const leaseController = new AbortController()
    signal = AbortSignal.any([signal, leaseController.signal])
    let unsubscribe
    await this.open()
    try {
      const current = await this.awaitGame(signal)
      if (JSON.stringify(liveEnvironment(current.environment)) !== JSON.stringify(profile.environment)) throw new Error('圣物校准尺寸或 DPI 失配')
      if (!lock.acquire(owner).success) throw new Error('另一项自动化正在运行')
      unsubscribe = lock.subscribe(state => {
        if (state.owner !== owner) leaseController.abort(new Error('圣物扫描锁已失效'))
      })
      const guard = () => {
        signal.throwIfAborted()
        if (lock.getState().owner !== owner) throw new Error('圣物扫描锁已失效')
      }
      await this.client.request('arm', current, { signal })
      guard()
      await this.withHidden(() => { guard(); return this.client.request('neutralGrid', profile, { signal }) })
      const inspect = () => this.withHidden(() => { guard(); return this.client.request('inspectGrid', profile, { signal }) })
      const first = await inspect()
      await this.wait(300, undefined, { signal })
      const stable = await inspect()
      guard()
      if (first.fingerprint !== stable.fingerprint) throw new Error('圣物网格尚未稳定，请重新扫描')
      const observations = [], covered = new Set()
      for (const cell of stable.cells) {
        guard()
        const index = cell.y * profile.columns + cell.x
        if (covered.has(index)) continue
        if (profile.cellStates[index] !== 'usable') observations.push({ x: cell.x, y: cell.y, status: profile.cellStates[index] === 'locked' ? 'disabled' : 'ignored' })
        else if (cell.status === 'empty' || cell.status === 'locked') observations.push({ x: cell.x, y: cell.y, status: cell.status })
        else {
          const copied = await this.withHidden(() => { guard(); return this.client.request('copyCell', { ...profile, x: cell.x, y: cell.y, expectedFingerprint: stable.fingerprint }, { signal }) })
          guard()
          if (copied.fingerprint !== stable.fingerprint) throw new Error('复制期间网格已变化，未应用结果')
          const parsed = parseSanctumRelic(copied.rawText || '', this.catalog), rect = copied.footprint
          if (parsed.status === 'matched' && rect?.x === cell.x && rect.y === cell.y && rect.width === parsed.width && rect.height === parsed.height
            && footprintUsable(profile, rect)) {
            observations.push({ x: cell.x, y: cell.y, status: 'copied', originConfirmed: true, rawText: copied.rawText })
            for (let y = rect.y; y < rect.y + rect.height; y++) for (let x = rect.x; x < rect.x + rect.width; x++) covered.add(y * profile.columns + x)
          } else observations.push({ x: cell.x, y: cell.y, status: 'unknown' })
        }
        covered.add(index)
        progress({ current: covered.size, total: profile.columns * profile.rows })
      }
      const final = await inspect()
      guard()
      if (final.fingerprint !== stable.fingerprint) throw new Error('扫描结束时网格已变化，未应用结果')
      return { regionId: profile.regionId, width: profile.columns, height: profile.rows, observations, scanId, scannedAt: new Date().toISOString(),
        observation: { foreground: true, interfaceMatched: true, mapOpen: false, clientBounds: final.clientBounds,
          regions: { [profile.regionId]: { ...profile.mapRegion, columns: profile.columns, rows: profile.rows, scanId, fingerprint: final.fingerprint } } } }
    } finally { await this.close(); unsubscribe?.(); lock.release(owner) }
  }
  assertLog(processId) {
    try {
      if (!this.logContext) throw new Error('圣所采集尚未绑定当前游戏日志')
      return this.logContext.assertCurrent(processId)
    } catch (error) { throw sanctumError('CONTEXT_CHANGED',error.message) }
  }
  async readRunPanel(profile, floor, kind, signal) {
    const valid = liveProfile(profile), regionKey = kind === 'resources' ? 'resourcesRegion' : 'rewardPanelRegion'
    const titleKey = kind === 'resources' ? 'sanctum-map' : 'sanctum-rewards'
    const titles = this.detection?.getTitleConfig()
    if (!valid[regionKey] || !titles?.templates?.[titleKey]) throw new Error('请先校准实际状态范围和对应标题')
    await this.open()
    try {
      const initial = await this.awaitGame(signal)
      if (JSON.stringify(liveEnvironment(initial.environment)) !== JSON.stringify(valid.environment)) throw new Error('窗口或 DPI 与校准不符')
      this.logContext = new SanctumLogContext(this.clientEvents, initial.environment.processId, error => this.client?.abort?.(error))
      if (!floor.logContextKey || floor.logContextKey !== this.logContext.key) throw new Error('地图记录与当前游戏区域不一致，请先重新采集地图')
      this.profile = { ...valid, panelRegion: valid[regionKey], interfaceKind:titleKey, interfaceTitles:titles.templates, matchThreshold:titles.threshold }
      await this.client.request('arm', initial, {signal})
      const captured = await this.sessionRequest('readRunPanel', {}, signal)
      const read = await this.recognizeCaptured(captured, signal, kind === 'rewards')
      this.assertLog(); signal.throwIfAborted()
      return { ...parseRunPanel(read.texts, floor, kind, this.catalog, read.currencyIcons || []), rawText:(read.texts || []).join('\n') }
    } finally { await this.close() }
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
    const cached = reuseSanctumEffects(this.effectLedger, data.floor, this.effectScope())
    data.floor.currentEffects = structuredClone(cached?.effects || [{ status: 'unknown', rawText: '当前位置实际效果尚未识别' }])
    data.floor.effectScan = { complete: cached?.complete === true, groups: cached?.groups || emptyEffectGroups() }
    this.latest = { ...data, overlayExcluded: true }
    return this.latest
  }
  async watchRelic(value, evidence, signal, onObservation) {
    const profile = this.titleOptions(relicProfile(value))
    await this.open()
    try {
      const initial = await this.awaitGame(signal)
      if (JSON.stringify(liveEnvironment(initial.environment)) !== JSON.stringify(profile.environment)) throw new Error('圣物校准尺寸或 DPI 失配')
      for (let frame = 0; frame < 15; frame++) {

        signal.throwIfAborted()
        const current = await this.withHidden(() => this.client.request('inspectGrid', profile, { signal }))
        signal.throwIfAborted()
        if (JSON.stringify(current.environment) !== JSON.stringify(initial.environment)
          || JSON.stringify(current.clientBounds) !== JSON.stringify(initial.clientBounds)
          || current.fingerprint !== evidence.fingerprint) throw new Error('圣物界面或位置已变化，请重新扫描')

        onObservation({ foreground: true, interfaceMatched: true, mapOpen: false, clientBounds: current.clientBounds,
          regions: { [profile.regionId]: { ...profile.mapRegion, columns: profile.columns, rows: profile.rows,
            scanId: evidence.scanId, fingerprint: evidence.fingerprint } } })
        await this.wait(350, undefined, { signal })
      }
    } finally { await this.close() }
  }
  inspect() { return this.latest }
  subscribeSafety(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  subscribeProgress(listener) { this.progressListeners.add(listener); return () => this.progressListeners.delete(listener) }
  subscribeSurface(listener) { this.surfaceListeners.add(listener); return () => this.surfaceListeners.delete(listener) }
  async *frames({ signal }) {
    try {
      yield this.latest?.floor ? this.latest : await this.observe(signal)
    } finally { await this.close() }
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
  processTarget(frozen, signal) {
    if (!frozen.data.frozenFrame) { frozen.release?.(); return Promise.resolve(frozen.data) }
    return this.framePipeline.process(frozen,signal)
  }
  prepareOcr(signal) {
    if (!this.ocrClient) this.ocrClient = this.makeClient({})
    this.ocrReady = this.ocrClient.request('prepareOcr', {}, {signal,timeoutMs:SANCTUM_TIMEOUTS.prepare})
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
  recognizeCaptured(data, signal, includeIcons = true, options = {}) {
    const queuedAt = performance.now()
    if (!data.png || !data.region) return Promise.resolve(data)
    const work = (this.ocrTail || Promise.resolve()).then(async () => {
      signal.throwIfAborted(); this.assertLog()
      if (this.ocrClosing) throw new Error('识别进程正在退出')
      if (!this.ocrClient) this.prepareOcr(signal)
      if (this.ocrReady) { const ready = this.ocrReady; this.ocrReady = null; await ready }
      signal.throwIfAborted()
      options.onReading?.()
      const {width,height} = data.region, started = performance.now()
      const read = await this.ocrClient.request('readFrozen', {png:data.png,region:{x:0,y:0,width,height},
        includeIcons,room:options.room ?? includeIcons,iconsOnly:options.iconsOnly === true}, {signal,timeoutMs:SANCTUM_TIMEOUTS.ocr})
      signal.throwIfAborted(); this.assertLog()
      const offset = region => region ? {...region,x:region.x+data.region.x,y:region.y+data.region.y} : null
      return {...data,...read,png:undefined,region:data.region,status:data.status,
        bodyRegion:offset(read.bodyRegion),
        ocrBlocks:(read.ocrBlocks || []).map(b=>({...b,region:offset(b.region)})),
        ocrLines:(read.ocrLines || []).map(b=>({...b,region:offset(b.region)})),
        currencyIcons:(read.currencyIcons || []).map(b=>({...b,region:offset(b.region)})),
        captureMetrics:{...data.captureMetrics,...read.captureMetrics,queueMs:started-queuedAt,recognitionMs:performance.now()-started}}
    })
    const settled = work.catch(async error => {
      if (isStepTimeout(error)) {
        const client = this.ocrClient; this.ocrClient = null; this.ocrReady = null
        await client?.shutdown()
      }
      throw error
    })
    this.ocrTail = settled.catch(() => {})
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
    let textRead, textPatch, frozenData
    const parse = read => {
      const started = performance.now()
      const patch = parseSanctumRoomTexts(read.texts,this.catalog,read.currencyIcons,read)
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
    const recognition = processed.then(value=>{frozenData=value;return this.recognizeCaptured(value,signal,false,{room:true,onReading})}).then(read => {
      textRead = read; textPatch = parse(read)
      return {patch:textPatch}
    }).catch(error => {
      signal.throwIfAborted(); this.assertLog()
      const postFailed = Boolean(data.frozenFrame && !frozenData)
      textPatch = {detailsStatus:'failed',rawText:'',readStages:{...(postFailed ? {locate:isStepTimeout(error)?'timeout':'failed'} : {}),ocr:postFailed?'skipped':isStepTimeout(error)?'timeout':'failed',parse:'failed'},
        captureMetrics:frozenData?.captureMetrics || data.captureMetrics,
        failureReason:postFailed ? isStepTimeout(error)?'图片处理超时':'图片处理失败' : isStepTimeout(error)?'文字识别超时':'截图文字识别失败',
        recognition:{status:'failed',matches:[],evidenceId:context.evidenceId,region:frozenData?.region}}
      return {patch:textPatch}
    })
    return {recognition, needsSupplement:()=>textRead?.hasCurrencyOffer === true, supplement:async () => {
      if (!textRead?.hasCurrencyOffer) return null
      try {
        const icons = await this.recognizeCaptured(frozenData,signal,false,{room:true,iconsOnly:true})
        const patch = parse({...textRead,currencyIcons:icons.currencyIcons})
        patch.readStages.icons = icons.currencyIcons.length ? 'matched':'empty'
        patch.captureMetrics = {...patch.captureMetrics,iconsMs:icons.captureMetrics.iconsMs,iconCalls:1}
        return {patch}
      } catch (error) {
        signal.throwIfAborted(); this.assertLog()
        return {patch:{...textPatch,readStages:{...textPatch.readStages,icons:isStepTimeout(error)?'timeout':'failed'},failureReason:isStepTimeout(error)?'文字已识别；奖励图标识别超时':'文字已识别；奖励图标识别失败'}}
      }
    }}
  }
  async hover(room, options) {
    const captured = await this.captureRoom(room, options)
    const text = await captured.recognition
    return await captured.supplement?.() || text
  }
  async finishProcessing() {
    const frames=this.framePipeline; this.framePipeline=null; await frames?.close()
    this.ocrClosing=true; const ocr=this.ocrClient; this.ocrClient=null; await ocr?.shutdown(); await this.ocrTail; this.ocrTail=null; this.ocrReady=null
  }
  async close() { await this.finishProcessing(); this.captureContexts.clear(); this.currentEffects = null; this.effectScan = null; this.logContext?.close(); this.logContext = null; const client = this.client; this.client = null; if (client) await client.shutdown() }
}
