export const SANCTUM_EFFECT_CATEGORIES = Object.freeze({
  majorBoon: { label: '主要恩赐', kind: 'boon', tier: 'major' },
  minorBoon: { label: '次要恩赐', kind: 'boon', tier: 'minor' },
  majorAffliction: { label: '主要痛苦', kind: 'affliction', tier: 'major' },
  minorAffliction: { label: '次要痛苦', kind: 'affliction', tier: 'minor' }
})

export function emptyEffectGroups(reason = '类别尚未确认') {
  return Object.entries(SANCTUM_EFFECT_CATEGORIES).map(([category, info]) => ({
    category, ...info, status: 'unconfirmed', complete: false, texts: [], effects: [], reason
  }))
}

export function mergeEffectGroups(groups, finished = false) {
  if (groups.some(group => Array.isArray(group.entries))) {
    const result = emptyEffectGroups().map(empty => {
      const items = groups.flatMap(group => (group.entries || []).filter(e => e.category === empty.category))
      if (!items.length) return finished ? {...empty,status:'absent',complete:true,reason:null} : empty
      const unique = [...new Map(items.map(item => [item.entryId,item])).values()]
      return {...empty,entries:unique,texts:unique.map(e=>e.name),effects:unique.flatMap(e=>e.effects.map(effect=>({...effect,category:empty.category,tier:empty.tier}))),
        complete:true,status:'read',reason:null}
    })
    const unresolved = groups.flatMap(g => [
      ...(g.entries || []).filter(e => !e.category).map(e => ({...g,category:null,label:e.name,entries:[e],texts:[e.name],effects:e.effects,complete:false,status:'unmatched',reason:'词库缺少级别资料'})),
      ...(!g.complete ? [{...g,category:null,label:'待核对内容',entries:[],
        texts:(g.unresolved || g.effects.filter(e=>!e.entryId && e.reason)).map(e=>e.rawText),
        effects:g.effects.filter(e=>!e.entryId)}] : [])])
    return result.concat(unresolved)
  }
  return emptyEffectGroups().map(empty => {
    const matches = groups.filter(group => group.category === empty.category)
    if (matches.length === 1) return matches[0]
    if (matches.length > 1) return { ...empty, status: 'failed', reason: '类别重复，无法确认完整内容' }
    return finished ? { ...empty, status: 'absent', complete: true, reason: null } : empty
  }).concat(groups.filter(group => !group.category))
}

export function completedEffectGroups(groups, finished = false) {
  return (groups?.length ? groups : emptyEffectGroups()).map(group =>
    finished && group.category && !(group.entries?.length || group.texts?.length || group.effects?.length)
      ? {...group,status:'absent',complete:true,reason:null} : group)
}

export const effectScanFinished = scan => scan?.finished ?? Boolean(scan?.complete || scan?.targets?.length || scan?.coverageConfirmed)

export function effectTargetLabel(target) {
  const name = target.entries?.map(e=>e.name).filter(Boolean).join('、')
  const index = target.iconIndex || /^effect:(\d+)$/.exec(target.targetId || '')?.[1]
  return name || (index ? `状态栏第 ${index} 个图标浮窗` : target.targetId === 'effect:restore' ? '圣所地图' : '状态栏')
}

export function effectReadReason(source) {
  if (source.reason === '未读到词缀文字') return '未识别到该浮窗的名称或描述，无法确定具体状态'
  if (source.reason === '部分文字未匹配或存在歧义' && source.texts?.length) return `${source.reason}：${source.texts.join('；')}`
  return source.reason || '读取失败'
}

export function effectReadIssues(scan, finished = true) {
  if (!scan) return [{stage:'scan',reason:'当前效果尚未采集',label:'状态栏'}]
  const issues = []
  const targets = scan.targets || []
  for (const target of scan.targets || []) if (target.stage?.endsWith('failed') || target.stage === 'skipped') {
    issues.push({targetId:target.targetId,evidenceId:target.evidenceId,stage:target.stage,label:effectTargetLabel(target),
      reason:effectReadReason(target)})
  }
  for (const group of [...(scan.groups || []), ...(scan.rewardGroups || [])]) if (!group.complete && (finished || group.status === 'failed')) {
    // Legacy snapshots stored the same failure twice without a group targetId.
    if (group.category) continue
    const target = targets.find(t => group.targetId ? t.targetId === group.targetId
      : group.reason && t.reason === group.reason || group.texts?.length && JSON.stringify(t.texts) === JSON.stringify(group.texts))
    const existing = target && issues.find(i=>i.targetId === target.targetId)
    const reason = effectReadReason(group)
    if (existing) {
      if (!existing.reason.includes(reason)) existing.reason += `；${reason}`
    } else issues.push({targetId:group.targetId || target?.targetId,evidenceId:group.evidenceId || target?.evidenceId,
      stage:'read',label:target ? effectTargetLabel(target) : group.targetId ? effectTargetLabel(group) : group.label || '状态栏浮窗',reason})
  }
  if (finished && scan.finished && !scan.coverageConfirmed && !issues.some(i=>i.stage === 'scan-failed'))
    issues.push({stage:'scan',label:'状态栏',reason:scan.reason || '效果图标区域未确认完整覆盖'})
  if (finished && !scan.complete && !issues.length) issues.push({stage:'scan',label:'状态栏',reason:scan.reason || '扫描覆盖或分类未完整确认'})
  const unique = new Map()
  for (const issue of issues) {
    const key = JSON.stringify([issue.targetId || issue.label,issue.stage])
    const previous = unique.get(key)
    if (!previous) unique.set(key,issue)
    else if (!previous.reason.includes(issue.reason)) previous.reason += `；${issue.reason}`
  }
  return [...unique.values()]
}

const issueStages = {'read':'读取','scan':'扫描','reward':'奖励读取','capture-failed':'截图','ocr-failed':'文字识别','postprocess-failed':'图片处理','scan-failed':'入口扫描','restore-failed':'恢复地图','skipped':'未执行',failed:'读取'}
export const effectIssueText = issue => `${issue.label || issue.category || issue.targetId || '状态栏'} · ${issueStages[issue.stage] || issue.stage}：${issue.reason}`

export function effectEvidenceTargets(floor) {
  const current=floor?.effectScan?.targets || []
  const retained=(floor?.previousEffectTargets || []).filter(old=>!current.some(target=>target.targetId===old.targetId))
    .map(old=>({...old,stage:'failed',reason:'本次尚未成功采集此浮窗',previousCapture:old.previousCapture || {
      result:old,binding:{runId:old.runId || floor.runId,floorId:old.floorId || floor.floorId,targetId:old.targetId,evidenceId:old.evidenceId}
    }}))
  return [...current,...retained]
}
