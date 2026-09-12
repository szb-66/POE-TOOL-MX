import { parseEffectTooltip, effectContextLine } from './effectRecognition.js'
import { normalizeRoomText } from './textRecognition.js'
import { applyEffectMemory } from './effectMemory.js'

const rewardPrefix = /^(完成禁域时|完成本轮时|完成本层时|楼层结束时|本层结束时|完成圣所时)获得/
const decoration = /^[xX×✕✖]$/

// Status-bar promises are selected rewards. Room offers use a different parser.
export function parseStatusTooltip(evidence, catalog, memory) {
  const texts = (evidence?.texts || []).filter(t => typeof t === 'string' && t.trim() && !decoration.test(t.trim())).slice(0, 80)
  const rewards = [], rewardTexts = [], unresolved = [], effectTexts = []
  const memorySegments=[[]]
  for (let i = 0; i < texts.length; i++) {
    let text = texts[i].normalize('NFKC').replace(/\s/g, '')
    if (!rewardPrefix.test(text)) { effectTexts.push(texts[i]);memorySegments.at(-1).push(texts[i]); continue }
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
    const currency = match && currencyEntry(match[3])
    if (match && currency.length === 1 && Number(match[2]) >= 1 && Number(match[2]) <= 1e9) {
      rewards.push({ currency:currency[0].name, quantity:Number(match[2]),
        timing:/本层|楼层/.test(match[1]) ? 'floor':'run', state:'pending', eligible:false,
        row:rewardTexts.length-1, rawText:raw.join('\n') })
    } else unresolved.push({rawText:raw.join('\n'),reason:'奖励数量或通货未完整识别'})
  }
  const originalEffectGroup = effectTexts.some(text => !effectContextLine(text,catalog)) || !rewardTexts.length ? parseEffectTooltip({...evidence,texts:effectTexts},catalog) : null
  if (originalEffectGroup) originalEffectGroup.memorySegments=memorySegments
  const remembered = originalEffectGroup && memory?.rules?.length ? applyEffectMemory({...evidence,texts:effectTexts,memorySegments},catalog,memory):null
  const effectGroup = remembered?.group || originalEffectGroup
  const rewardGroup = rewardTexts.length ? {label:'状态栏奖励',targetId:evidence?.targetId,evidenceId:evidence?.evidenceId,iconIndex:evidence?.iconIndex,texts:rewardTexts,rewards,unresolved,
    complete:evidence?.status === 'located' && !unresolved.length,
    status:evidence?.status !== 'located' ? 'failed' : unresolved.length ? 'unmatched':'read',
    reason:evidence?.reason || (unresolved.length ? unresolved.map(item=>`${item.reason}：「${item.rawText}」`).join('；'):null)} : null
  return { effectGroup, originalEffectGroup, memoryHits:remembered?.hits || [], rewardGroup,
    classificationComplete:!effectGroup || effectGroup.complete && effectGroup.entries.every(e => e.category) }
}
