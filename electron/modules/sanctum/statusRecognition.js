import { parseEffectTooltip, effectContextLine } from './effectRecognition.js'
import { normalizeRoomText } from './textRecognition.js'
import { applyEffectMemory } from './effectMemory.js'

const rewardPrefix = /^(完成禁域时|完成本轮时|完成本层时|楼层结束时|本层结束时|完成圣所时)获得/
const decoration = /^[xX×✕✖]$/

// Recognize reward context only to exclude it from boon/affliction parsing.
export function parseStatusTooltip(evidence, catalog, memory) {
  const texts = (evidence?.texts || []).filter(t => typeof t === 'string' && t.trim() && !decoration.test(t.trim())).slice(0, 80)
  const rewardTexts = [], effectTexts = []
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
  }
  const originalEffectGroup = effectTexts.some(text => !effectContextLine(text,catalog)) || !rewardTexts.length ? parseEffectTooltip({...evidence,texts:effectTexts},catalog) : null
  if (originalEffectGroup) originalEffectGroup.memorySegments=memorySegments
  const remembered = originalEffectGroup && memory?.rules?.length ? applyEffectMemory({...evidence,texts:effectTexts,memorySegments},catalog,memory):null
  const effectGroup = remembered?.group || originalEffectGroup
  return { effectGroup, originalEffectGroup, memoryHits:remembered?.hits || [], hasRewardContext:rewardTexts.length > 0,
    classificationComplete:!effectGroup || effectGroup.complete && effectGroup.entries.every(e => e.category) }
}
