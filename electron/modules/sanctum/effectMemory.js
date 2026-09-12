import { randomUUID } from 'node:crypto'
import { parseEffectTooltip } from './effectRecognition.js'

// Restrict compatibility normalization to width forms; e.g. ① must not become 1.
export const effectMemoryKey = text => String(text).replace(/[\uFF01-\uFFEF]+/gu,value=>value.normalize('NFKC')).replace(/\s/gu,'')
export const emptyEffectMemory = () => ({revision:0,migrated:false,rules:[],history:[]})
export const EFFECT_MEMORY_HISTORY_LIMIT = 100
function recordHistory(memory,record) {
  memory.history = [...(memory.history || []).slice(-(EFFECT_MEMORY_HISTORY_LIMIT - 1)),record]
}
const snapshot = entry => ({id:entry.id,name:entry.name,kind:entry.kind,tier:entry.tier ?? null,descriptions:entry.descriptions || []})
const effectEntry = (id,catalog) => catalog.entries.find(entry=>entry.id === id && ['boon','affliction'].includes(entry.kind))

export function readEffectMemory(value) {
  const memory = emptyEffectMemory()
  if (!value || !Array.isArray(value.rules)) return memory
  memory.revision=Number.isSafeInteger(value.revision) && value.revision >= 0 ? value.revision:0
  memory.migrated=value.migrated === true
  memory.history=Array.isArray(value.history) ? structuredClone(value.history.slice(-EFFECT_MEMORY_HISTORY_LIMIT)):[]
  const keys=new Set(),ids=new Set()
  for (const rule of value.rules.slice(0,2000)) {
    if (!rule || typeof rule.id !== 'string' || typeof rule.rawText !== 'string' || rule.rawText.length > 10000
      || !effectMemoryKey(rule.rawText) || !['replace','ignore'].includes(rule.action)
      || !Number.isSafeInteger(rule.revision) || rule.revision < 1 || ids.has(rule.id) || keys.has(effectMemoryKey(rule.rawText))) continue
    keys.add(effectMemoryKey(rule.rawText));ids.add(rule.id)
    memory.rules.push({...structuredClone(rule),key:effectMemoryKey(rule.rawText)})
  }
  return memory
}

export function effectRuleStatus(rule,catalog) {
  if (rule.action === 'ignore') return {active:true,reason:null}
  const entry=effectEntry(rule.entryId,catalog)
  return entry && JSON.stringify(snapshot(entry)) === JSON.stringify(rule.entrySnapshot)
    ? {active:true,reason:null}:{active:false,reason:'词库条目已删除或名称、描述、级别变化，请重新选择并保存'}
}

export function rememberEffectRule(memory,rawText,action,entryId,catalog,time=Date.now(),source=null) {
  if (typeof rawText !== 'string' || rawText.length > 10000 || !effectMemoryKey(rawText) || !['replace','ignore'].includes(action)) throw new Error('纠正原文或处理方式无效')
  const entry=action === 'replace' ? effectEntry(entryId,catalog):null
  if (action === 'replace' && !entry) throw new Error('修正词条不在恩赐或痛苦词库中')
  const key=effectMemoryKey(rawText),previous=memory.rules.find(rule=>rule.key === key)
  if (previous?.action === action && (action === 'ignore'
    || previous.entryId === entry.id && JSON.stringify(previous.entrySnapshot) === JSON.stringify(snapshot(entry)))) return previous
  if (!previous && memory.rules.length >= 2000) throw new Error('已记住的纠正过多，请先删除不再需要的规则')
  const rule={id:previous?.id || randomUUID(),key,rawText,action,
    ...(entry ? {entryId:entry.id,entrySnapshot:snapshot(entry)}:{}),
    source:structuredClone(source || previous?.source || null),revision:(previous?.revision || 0)+1,updatedAt:time}
  memory.rules=memory.rules.filter(rule=>rule.key !== key).concat(rule);memory.revision++
  recordHistory(memory,{operation:'save',revision:memory.revision,rule:structuredClone(rule)})
  return rule
}

export function forgetEffectRule(memory,id) {
  const rule=memory.rules.find(rule=>rule.id === id)
  if (!rule) return
  memory.rules=memory.rules.filter(rule=>rule.id !== id);memory.revision++
  recordHistory(memory,{operation:'delete',revision:memory.revision,rule:structuredClone(rule),updatedAt:Date.now()})
}

export function effectSources(group,applied=[]) {
  if (!group) return []
  const sources=group.sources ? structuredClone(group.sources) : [...(group.entries || []).map(entry=>({id:`entry:${entry.entryId}`,rawText:entry.rawText,entryId:entry.entryId,name:entry.name})),
    ...(group.unresolved || (group.effects || []).filter(e=>!e.entryId && e.reason)).map((item,i)=>({id:item.id || `legacy:${i}`,rawText:item.rawText,reason:item.reason}))]
    .filter(source=>source.rawText)
  // A later OCR pass may split a remembered phrase into several unknown rows.
  // Keep its exact combined source editable without depending on those row IDs.
  for (const rule of applied) {
    const key=effectMemoryKey(rule.rawText)
    for (let start=0;start<sources.length;start++) {
      let joined=''
      for (let end=start;end<sources.length;end++) {
        joined+=effectMemoryKey(sources[end].rawText)
        if (joined === key && end > start) {
          sources.splice(start,end-start+1,{id:rule.sourceId || `memory:${rule.id}`,rawText:rule.rawText,reason:'原文经已记住的规则处理'})
          break
        }
        if (joined.length >= key.length) break
      }
    }
  }
  return sources
}

// Match complete OCR spans, never substrings or generated replacement text.
// Longest matching span wins. Local overrides shadow the same remembered key.
export function applyEffectMemory(evidence,catalog,memory,overrides=[],addedEntryIds=[]) {
  const original=parseEffectTooltip(evidence,catalog)
  const rules=new Map((memory?.rules || []).filter(rule=>effectRuleStatus(rule,catalog).active).map(rule=>[rule.key,rule]))
  for (const rule of overrides) rules.set(effectMemoryKey(rule.rawText),{...rule,key:effectMemoryKey(rule.rawText),local:true})
  if (!rules.size && !addedEntryIds.length) return {original,group:original,hits:[]}
  // A recognized name plus description is one source. Never match just its
  // heading when the adjacent description establishes a different numeric variant.
  const segments=evidence.memorySegments || [original.texts || []]
  const lines=segments.flatMap(segment=>[...effectSources(parseEffectTooltip({...evidence,texts:segment},catalog)),null]),output=[],hits=[]
  const sourceTexts=source=>source.texts || source.rawText.split('\n')
  for (let i=0;i<lines.length;) {
    if (lines[i] === null) {i++;continue}
    let match=null,key=''
    for (let end=i;end<lines.length;end++) {
      if (lines[end] === null) break
      key+=effectMemoryKey(lines[end].rawText)
      const rule=rules.get(key)
      if (rule) match={rule,end}
    }
    if (!match) { output.push(...sourceTexts(lines[i++]));continue }
    const {rule,end}=match,rawText=lines.slice(i,end+1).map(source=>source.rawText).join('\n')
    hits.push({...structuredClone(rule),rawText})
    if (rule.action === 'keep') output.push(...lines.slice(i,end+1).flatMap(sourceTexts))
    if (rule.action === 'replace') {
      const entry=effectEntry(rule.entryId,catalog)
      if (!entry) output.push(...lines.slice(i,end+1).flatMap(sourceTexts))
      else output.push(entry.name,...(entry.descriptions || []))
    }
    i=end+1
  }
  for (const id of addedEntryIds) {
    const entry=effectEntry(id,catalog)
    if (!entry) throw new Error('新增词条不在恩赐或痛苦词库中')
    output.push(entry.name,...(entry.descriptions || []))
  }
  if (!hits.length && !addedEntryIds.length) return {original,group:original,hits:[]}
  // Ignore actions can legitimately confirm that a tooltip has no effects;
  // they still cannot establish a successful capture or fix missing coverage.
  const parsed=parseEffectTooltip({...evidence,texts:output},catalog)
  const ignoredAll=!output.length && hits.length > 0 && evidence.status === 'located' && !evidence.reason
  const group={...parsed,texts:original.texts,memorySegments:evidence.memorySegments,
    ...(ignoredAll ? {entries:[],effects:[],unresolved:[],reason:null,complete:true,status:'read'}:{})}
  return {original,group,hits}
}

export function migrateEffectMemory(memory,floors,catalog,resolveOriginal=target=>target.effectGroup) {
  if (memory.migrated) return memory
  const candidates=[]
  for (const floor of floors.filter(Boolean)) {
    for (const target of [...(floor.effectScan?.targets || []),...(floor.previousEffectTargets || [])]) {
      for (const item of [target,target.previousCapture?.result].filter(Boolean)) {
        if (!item.correction || item.correction.sourceEdits) continue
        const group=resolveOriginal(item)
        if (!group) continue
        for (const resolution of item.correction.resolutions || []) {
          const source=effectSources(group).find(source=>source.id === resolution.id)
          if (source && ['replace','ignore'].includes(resolution.action)) candidates.push({...resolution,rawText:source.rawText,time:item.correction.updatedAt || 0,
            source:{runId:item.runId || floor.runId,floorId:item.floorId || floor.floorId,targetId:item.targetId,evidenceId:item.evidenceId,sourceId:source.id,texts:item.texts || group.texts,region:item.region}})
        }
      }
    }
  }
  const next=structuredClone(memory)
  for (const item of candidates.sort((a,b)=>a.time-b.time)) {
    if (item.action === 'replace' && !effectEntry(item.entryId,catalog)) continue
    const existing=next.rules.find(rule=>rule.key === effectMemoryKey(item.rawText))
    if (existing && existing.updatedAt >= item.time) continue
    rememberEffectRule(next,item.rawText,item.action,item.entryId,catalog,item.time,item.source)
  }
  next.migrated=true
  return next
}
