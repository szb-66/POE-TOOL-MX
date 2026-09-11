export const observationKey = floor => JSON.stringify([floor?.sanctumRunId || floor?.runId, floor?.floorId, floor?.mapKey || null, floor?.currentRoomId || (floor?.initialSelection ? '__entry__' : null)])

export function currentRunObservation(observation, floor) {
  return floor?.identityConfirmed && observation?.key === observationKey(floor) && observation.status === 'confirmed' ? observation : null
}

const statusObservation = floor => floor?.effectScan?.binding === observationKey(floor)
  && Array.isArray(floor.effectScan.rewardGroups) ? JSON.stringify(floor.effectScan.rewardGroups) : null

export function syncStatusRewards(ledger, floor) {
  const scan = floor?.effectScan, key = observationKey(floor), runId = floor?.sanctumRunId || floor?.runId
  if (!floor?.identityConfirmed || !runId || (!floor.currentRoomId && !floor.initialSelection)
    || scan?.binding !== key || !Array.isArray(scan.rewardGroups)) return ledger
  const observation = statusObservation(floor)
  if (ledger?.runId === runId && ledger.key === key && ledger.statusObservation === observation) return ledger
  // Only this automatic source is replaced. Other sources retain their original
  // position binding and can never make a newly observed partial ledger complete.
  const retained = ledger?.runId === runId ? ledger.items.filter(item => item.source !== 'status-bar')
    .map(item => ({...item,observationKey:item.observationKey || ledger.key})) : []
  const consumed = new Set(), items = []
  const usedIds = new Set(retained.map(item => item.id))
  const groups = [...scan.rewardGroups].sort((a,b) => a.targetId.localeCompare(b.targetId,undefined,{numeric:true}))
  for (const group of groups) for (const reward of group.rewards || []) {
    const duplicate = retained.findIndex((item,index) => !consumed.has(index) && item.observationKey === key
      && item.state === 'pending' && item.currency === reward.currency && item.quantity === reward.quantity && item.timing === reward.timing)
    if (duplicate >= 0) { consumed.add(duplicate); continue }
    const baseId = `status:${group.targetId}:${reward.row}`
    let id = baseId, suffix = 1
    while (usedIds.has(id)) id = `${baseId}:${suffix++}`
    usedIds.add(id)
    items.push({id,currency:reward.currency,quantity:reward.quantity,
      timing:reward.timing,state:'pending',eligible:false,groupId:null,source:'status-bar',observationKey:key,
      targetId:group.targetId,evidenceId:group.evidenceId})
  }
  return {runId,key,complete:false,source:'status-bar',statusObservation:observation,items:[...retained,...items]}
}

export function validateRunResources(input, floor, source = 'manual') {
  if (!floor?.identityConfirmed || !floor.currentRoomId && !floor.initialSelection) throw new Error('请先确认当前位置')
  const result = { key: observationKey(floor), status: 'confirmed', source }
  for (const key of ['resolve','maxResolve','inspiration','coins']) {
    const value = input?.[key]
    if (value !== null && value !== undefined && (!Number.isInteger(value) || value < 0 || value > 1e9)) throw new Error('实际资源数值无效')
    result[key] = value ?? null
  }
  if (result.resolve !== null && result.maxResolve !== null && result.resolve > result.maxResolve) throw new Error('坚毅不能超过最大坚毅')
  return result
}

export function validateRewardLedger(input, floor, source = 'manual') {
  if (!floor?.identityConfirmed) throw new Error('请先确认当前整轮身份')
  if (!Array.isArray(input?.items) || input.items.length > 200 || typeof input.complete !== 'boolean') throw new Error('奖励账本格式无效')
  const seen = new Set(), groups = new Set()
  const items = input.items.map(item => {
    if (!item || typeof item.id !== 'string' || !item.id || item.id.length > 160 || seen.has(item.id)) throw new Error('奖励项标识缺失或重复')
    seen.add(item.id)
    if (typeof item.currency !== 'string' || !item.currency || item.currency.length > 100 || !['candidate','pending','claimed'].includes(item.state)
      || !['immediate','floor','run','unknown'].includes(item.timing)) throw new Error('奖励项内容无效')
    if (item.quantity !== null && (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 1e9)) throw new Error('奖励数量无效；未知请留空')
    if (item.groupId != null && (typeof item.groupId !== 'string' || item.groupId.length > 160)) throw new Error('奖励组选项无效')
    if (item.groupId && item.state !== 'candidate') {
      if (groups.has(item.groupId)) throw new Error('同一奖励组选中了多项')
      groups.add(item.groupId)
    }
    return { id:item.id,currency:item.currency,quantity:item.quantity,timing:item.timing,state:item.state,groupId:item.groupId || null,
      eligible: item.eligible === true, source }
  })
  return { runId:floor.sanctumRunId || floor.runId, key:observationKey(floor), complete:input.complete, items, source,
    statusObservation:statusObservation(floor) }
}

export function hourAdvice(altar, ledger, floor) {
  const active = altar?.confirmed === true && altar.runId === (floor.sanctumRunId || floor.runId)
    && altar.items?.some(item => item.status === 'matched' && item.uniqueId === 'unique:The_Hour_of_Divinity') === true
  if (!active) return { active:false, reason:'神圣之刻未确认为本轮实际装备' }
  // At a new position an unobserved pickup/claim can have changed the pool.
  if (!ledger?.complete || ledger.runId !== (floor.sanctumRunId || floor.runId) || ledger.key !== observationKey(floor)) return {
    active:true, known:false, cannotGainBoons:true, reason:'奖励账本未完整确认；继续普通选路，暂停复制判断'
  }
  const eligible=ledger.items.filter(item=>item.state==='pending' && item.eligible && item.timing!=='immediate')
  return {active:true,known:true,cannotGainBoons:true,eligibleIds:eligible.map(i=>i.id),copyLimit:Math.min(2,eligible.length),dilution:eligible.length>2,
    reason:eligible.length>2?'符合条件的待领取奖励超过两项，有稀释高价值奖励复制机会的风险；新增奖励应按价值取舍':`当前有 ${eligible.length} 项符合条件的待领取奖励，最多复制 ${Math.min(2,eligible.length)} 个不同奖励项`}
}

// Strict label/value parsing. Missing fields stay null; no prior observation is
// merged into a supposedly complete screenshot. Reward rows require explicit
// state labels; a currency icon cannot establish a selected or claimed reward.
export function parseRunPanel(texts, floor, kind, catalog = {entries:[]}, icons = []) {
  const lines=Array.isArray(texts)?texts.filter(x=>typeof x==='string').slice(0,300):[]
  if (kind==='resources') {
    const input={}
    const seen=new Set(),conflicts=new Set()
    const record=(key,value)=>{if(seen.has(key)&&input[key]!==value)conflicts.add(key);seen.add(key);input[key]=value}
    const labels={坚毅:'resolve',最大坚毅:'maxResolve',启迪:'inspiration',耀金币:'coins'}
    for(const line of lines) {
      const pair=/^坚毅\s*[:：]?\s*(\d+)\s*\/\s*(\d+)$/.exec(line.trim())
      if (pair) {record('resolve',Number(pair[1]));record('maxResolve',Number(pair[2]));continue}
      const match=/^(最大坚毅|坚毅|启迪|耀金币)\s*[:：]?\s*(\d+)$/.exec(line.trim())
      if(match) record(labels[match[1]],Number(match[2]))
    }
    for(const key of conflicts) input[key]=null
    return validateRunResources(input,floor,'observed')
  }
  const items=[]
  for(const [index,line] of lines.entries()) {
    const match=/^(候选|已选未领|已领取)\s*[:：]\s*(.+?)\s*[x×]\s*(\d+)\s*[（(](立即|本层|本轮)[）)]$/.exec(line.trim())
    if(match) items.push({id:`observed:${index}`,currency:match[2],quantity:Number(match[3]),state:{候选:'candidate',已选未领:'pending',已领取:'claimed'}[match[1]],timing:{立即:'immediate',本层:'floor',本轮:'run'}[match[4]],eligible:false})
    else {
      const plain=/^(.+?)\s*[x×]\s*(\d+)$/.exec(line.trim())
      if(plain && catalog.entries.some(e=>e.kind==='reward' && e.name===plain[1].trim())) items.push({id:`observed:${index}`,currency:plain[1].trim(),quantity:Number(plain[2]),state:'candidate',timing:'unknown',eligible:false})
    }
  }
  for(const [index,icon] of icons.entries()) if(icon.confidence >= .94 && typeof icon.currency==='string' && !items.some(item=>item.currency===icon.currency)) items.push({id:`icon:${index}`,currency:icon.currency,quantity:null,state:'candidate',timing:'unknown',eligible:false})
  // Scrolled/clipped panels cannot establish ledger completeness or eligibility.
  return validateRewardLedger({items,complete:false},floor,'observed')
}
