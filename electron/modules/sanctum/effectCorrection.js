import { parseStatusTooltip } from './statusRecognition.js'
import { matchRoomText } from './textRecognition.js'
import { mergeEffectGroups, effectReadIssues } from '../../../shared/sanctumEffects.js'
import { applyEffectMemory, effectSources, effectMemoryKey } from './effectMemory.js'

export function validateSourceCorrection(input,original,catalog,sources=effectSources(original)) {
  if (!input || !Array.isArray(input.sourceEdits) || input.sourceEdits.length > 160
    || !Array.isArray(input.addedEntryIds) || input.addedEntryIds.length > 100 || typeof input.remember !== 'boolean') throw new Error('来源修正格式无效')
  const validId=id=>catalog.entries.some(entry=>entry.id === id && ['boon','affliction'].includes(entry.kind))
  if (!input.addedEntryIds.every(validId)) throw new Error('新增词条不在恩赐或痛苦词库中')
  const seen=new Set(),processed=new Map()
  const sourceEdits=input.sourceEdits.map(edit=>{
    const source=sources.find(source=>source.id === edit?.sourceId)
    if (!source || seen.has(source.id) || !['replace','ignore','keep'].includes(edit.action)
      || edit.action === 'replace' && !validId(edit.entryId)) throw new Error('纠正来源或词条无效，请重新核对')
    seen.add(source.id)
    const key=effectMemoryKey(source.rawText),value=JSON.stringify([edit.action,edit.entryId || null])
    if (processed.has(key) && processed.get(key) !== value) throw new Error('同一原文存在不同处理，请选择一致的纠正方式')
    processed.set(key,value)
    return {sourceId:source.id,rawText:source.rawText,action:edit.action,...(edit.action === 'replace'?{entryId:edit.entryId}:{})}
  })
  return {sourceEdits,addedEntryIds:[...new Set(input.addedEntryIds)],remember:input.remember}
}

export function targetEffectEvidence(target,catalog) {
  const original=originalEffectGroup(target,catalog)
  return {...target,texts:original?.texts || target.texts,status:target.captureIssue ? 'partial':target.readStatus || (original?.status === 'failed'?'partial':'located'),
    memorySegments:original?.memorySegments,
    reason:target.captureIssue || (original?.status === 'failed' ? original.reason:null)}
}

export function refreshTargetMemory(target,catalog,memory) {
  if (!originalEffectGroup(target,catalog)) return
  const result=applyEffectMemory(targetEffectEvidence(target,catalog),catalog,memory)
  target.effectGroup ||= result.original
  target.rememberedGroup=result.group;target.memoryHits=result.hits;target.memoryRevision=memory.revision
}

export function originalEffectGroup(target, catalog) {
  if (target.effectGroup !== undefined) return target.effectGroup
  // Legacy targets did not save the OCR location status. Only an explicit
  // parsing failure with a crop can establish that capture itself succeeded.
  const located = target.stage === 'matched' || target.stage === 'failed' && target.region
    && /^(未匹配词条|词条存在歧义)/.test(target.reason || '')
  return parseStatusTooltip({...target,status:target.readStatus || (located ? 'located':'partial'),
    reason:located ? null : target.reason},catalog).effectGroup
}

export function catalogEffect(entry, catalog) {
  const match = matchRoomText(entry.name,{...catalog,entries:[entry]})
  const category = ['major','minor'].includes(entry.tier) ? entry.tier+(entry.kind === 'boon' ? 'Boon':'Affliction') : null
  return {...match,category,tier:entry.tier,manual:true,
    effects:match.calculationStatus === 'supported' ? match.effects.map(effect=>({...effect,category,manual:true}))
      : [{entryId:entry.id,name:entry.name,kind:entry.kind,tier:entry.tier,category,status:'unknown',manual:true,
        rawText:`已识别：${entry.name}；${match.supportReason || '计算暂不支持'}`} ]}
}

export function validateEffectCorrection(input, original, catalog) {
  if (!input || !Array.isArray(input.entryIds) || input.entryIds.length > 100
    || !Array.isArray(input.resolutions) || input.resolutions.length > 80) throw new Error('效果修正格式无效')
  const validId = id => typeof id === 'string' && catalog.entries.some(entry=>entry.id === id && ['boon','affliction'].includes(entry.kind))
  if (!input.entryIds.every(validId)) throw new Error('修正词条不在恩赐或痛苦词库中')
  const unresolved = original.unresolved || original.effects.filter(e=>!e.entryId && e.reason).map((item,i)=>({...item,id:item.id || `legacy:${i}`}))
  const seen = new Set()
  const resolutions = input.resolutions.map(item => {
    if (!item || !unresolved.some(unknown=>unknown.id === item.id) || seen.has(item.id)
      || !['ignore','replace'].includes(item.action) || item.action === 'replace' && !validId(item.entryId)) throw new Error('未匹配文字的处理无效')
    seen.add(item.id)
    return {id:item.id,action:item.action,...(item.action === 'replace' ? {entryId:item.entryId}:{})}
  })
  return {entryIds:[...new Set(input.entryIds)],resolutions}
}

export function correctedEffectGroup(target, catalog) {
  const original = originalEffectGroup(target,catalog)
  if (!original) return original
  if (!target.correction) return target.rememberedGroup || original
  if (target.correction.sourceEdits) {
    const result=applyEffectMemory(targetEffectEvidence(target,catalog),catalog,{rules:target.memoryHits || []},target.correction.sourceEdits,target.correction.addedEntryIds)
    return {...result.group,manual:true}
  }
  const correction = validateEffectCorrection(target.correction,original,catalog)
  const entryIds = [...new Set([...correction.entryIds,...correction.resolutions.filter(r=>r.action === 'replace').map(r=>r.entryId)])]
  const entries = entryIds.map(id=>catalogEffect(catalog.entries.find(entry=>entry.id === id),catalog))
  const unresolved = (original.unresolved || original.effects.filter(e=>!e.entryId && e.reason).map((e,i)=>({...e,id:e.id || `legacy:${i}`})))
    .filter(item=>!correction.resolutions.some(r=>r.id === item.id))
  const captureReason = target.captureIssue || (target.readStatus && target.readStatus !== 'located' ? original.reason || '浮窗未完整定位'
    : original.status === 'failed' ? original.reason || '浮窗读取失败':null)
  const reason = [captureReason,...unresolved.map(item=>`${item.reason}：「${item.rawText}」`)].filter(Boolean).join('；') || null
  const complete = !reason
  return {...original,entries,unresolved,complete,reason,manual:true,status:complete?'read':captureReason?'failed':'unmatched',
    effects:[...entries.flatMap(entry=>entry.effects),...unresolved,...(captureReason ? [{status:'unknown',rawText:captureReason}]:[])]}
}

export function rebuildCorrectedScan(scan, catalog, memory) {
  if (memory) for (const target of scan.targets) {
    refreshTargetMemory(target,catalog,memory)
    const group=correctedEffectGroup(target,catalog)
    if (!group) continue
    const reward=scan.rewardGroups?.find(item=>item.targetId === target.targetId)
    target.entries=group.entries;target.classificationComplete=group.complete && group.entries.every(entry=>entry.category)
    target.reason=[group.reason,reward?.reason].filter(Boolean).join('；') || null
    if (['matched','failed'].includes(target.stage) && !target.captureIssue) target.stage=group.complete && (!reward || reward.complete)?'matched':'failed'
  }
  const groups = scan.targets.map(target=>correctedEffectGroup(target,catalog)).filter(Boolean)
  const additions = (scan.groups || []).flatMap(group=>(group.entries || []).filter(entry=>entry.source?.kind === 'room'))
  if (additions.length) groups.push({entries:additions,complete:true,effects:additions.flatMap(entry=>entry.effects)})
  const categorized = mergeEffectGroups(groups,true)
  const icons = scan.targets.filter(target=>/^effect:\d+$/.test(target.targetId))
  const classificationComplete = scan.coverageConfirmed === true && icons.every(target=>target.classificationComplete === true)
  const effectsComplete = classificationComplete && categorized.every(group=>group.complete)
  const complete = effectsComplete && (scan.rewardGroups || []).every(group=>group.complete)
    && !scan.targets.some(target=>target.stage.endsWith('failed') || target.stage === 'skipped')
  const result = {...scan,groups:categorized,classificationComplete,effectsComplete,complete}
  result.issues = effectReadIssues(result)
  const effects = categorized.flatMap(group=>group.effects)
  if (!effectsComplete) effects.push({status:'unknown',rawText:'当前效果采集不完整，无法确认的内容保留未知'})
  return {scan:result,effects}
}
