import { parseEffectTooltip, effectContextLine } from './effectRecognition.js'
import { normalizeRoomText } from './textRecognition.js'
import { applyEffectMemory } from './effectMemory.js'
import { normalizeSanctumEvidence, isUnconfirmedSanctumReward } from './localization.js'

const rewardPrefix = /^(完成禁域时|完成本轮时|完成本层时|楼层结束时|本层结束时|完成圣所时)获得/
const decoration = /^[xX×✕✖]$/

// Recognize reward context only to exclude it from boon/affliction parsing.
export function parseStatusTooltip(evidence, catalog, memory) {
  evidence = normalizeSanctumEvidence(evidence, catalog)
  const texts = (evidence?.texts || []).filter(t => typeof t === 'string' && t.trim() && !decoration.test(t.trim())).slice(0, 80)
  const rewardTexts = [], effectTexts = [], unconfirmedRewards = []
  const memorySegments=[[]]
  for (let i = 0; i < texts.length; i++) {
    let text = texts[i].normalize('NFKC').replace(/\s/g, '')
    if (catalog?.server === 'international' && catalog.parseReward) {
      let found = null, unresolved = false, last = i
      for (let count=1;count<=Math.min(4,texts.length-i);count++) {
        const parsed = catalog.parseReward(texts.slice(i,i+count).join(' '))
        if (parsed?.status === 'matched') {found=parsed;last=i+count-1;break}
        if (parsed?.status === 'unknown') unresolved=true
      }
      if (found) {rewardTexts.push(texts.slice(i,last+1).join('\n'));memorySegments.push([]);i=last;continue}
      if (unresolved) {unconfirmedRewards.push(texts[i]);effectTexts.push(texts[i]);memorySegments.at(-1).push(texts[i]);continue}
    }
    if (isUnconfirmedSanctumReward(texts[i],catalog)) {unconfirmedRewards.push(texts[i]);effectTexts.push(texts[i]);memorySegments.at(-1).push(texts[i]);continue}
    if (catalog?.server === 'international' && !catalog.parseReward && /^(?:Receive|Gain|On(?:Floor|Sanctum)Completion)/i.test(text)) {
      let combined = text, last = i
      const englishReward = value => {
        const match = /^(?:Receive|Gain)\d+[xX×]?(.+?)(?:on|upon)(?:completing)?(?:the)?(?:Floor|Sanctum)(?:Completion)?$/i.exec(value)
          || /^On(?:Floor|Sanctum)Completion(?:Receive|Gain)?\d+[xX×]?(.+)$/i.exec(value)
        return match && catalog.entries.filter(entry => entry.kind === 'reward'
          && [entry.name,...(entry.aliases || [])].some(alias => normalizeRoomText(alias) === normalizeRoomText(match[1]))).length === 1
      }
      while (!englishReward(combined) && last + 1 < texts.length && last - i < 3) combined += texts[++last].normalize('NFKC').replace(/\s/g, '')
      if (englishReward(combined)) {
        rewardTexts.push(texts.slice(i,last+1).join('\n')); memorySegments.push([]); i=last; continue
      }
    }
    if (catalog?.server === 'international' || !rewardPrefix.test(text)) { effectTexts.push(texts[i]);memorySegments.at(-1).push(texts[i]); continue }
    memorySegments.push([])
    const raw = [texts[i]]
    // OCR can split one visual row into its promise, amount and currency.
    const row = /^(完成禁域时|完成本轮时|完成本层时|楼层结束时|本层结束时|完成圣所时)获得[:：]?(\d+)[xX×](.+)$/
    const currencyEntry = name => (catalog?.entries || []).filter(e => e.kind === 'reward'
      && [e.name, ...(e.aliases || [])].some(alias => normalizeRoomText(alias) === normalizeRoomText(name)))
    let match = row.exec(text)
    while ((!match || currencyEntry(match[3]).length !== 1) && raw.length < 4 && i+1 < texts.length) {
      const next = texts[i+1].normalize('NFKC').replace(/\s/g, '')
      if (!/^(?:\d+[xX×]?|[xX×])$/.test(next) && !currencyEntry(next).length) break
      raw.push(texts[++i]); text += next; match = row.exec(text)
    }
    rewardTexts.push(raw.join('\n'))
  }
  const originalEffectGroup = effectTexts.some(text => !effectContextLine(text,catalog)) || !rewardTexts.length ? parseEffectTooltip({...evidence,texts:effectTexts,
    ...(unconfirmedRewards.length ? {status:'partial',reason:'奖励文本未匹配当前受管模板或唯一通货'} : {})},catalog) : null
  if (originalEffectGroup) originalEffectGroup.memorySegments=memorySegments
  const remembered = originalEffectGroup && memory?.rules?.length ? applyEffectMemory({...evidence,texts:effectTexts,memorySegments},catalog,memory):null
  const effectGroup = remembered?.group || originalEffectGroup
  return { effectGroup, originalEffectGroup, memoryHits:remembered?.hits || [], hasRewardContext:rewardTexts.length > 0,
    classificationComplete:!effectGroup || effectGroup.complete && effectGroup.entries.every(e => e.category) }
}
