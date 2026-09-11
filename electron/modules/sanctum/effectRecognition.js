import { matchRoomText, normalizeRoomText } from './textRecognition.js'
import { SANCTUM_EFFECT_CATEGORIES } from '../../../shared/sanctumEffects.js'

export function parseEffectTooltip(evidence, catalog) {
  const texts = (Array.isArray(evidence?.texts) ? evidence.texts : []).filter(t => typeof t === 'string' && t.trim()).slice(0, 80)
  const entries = (catalog?.entries || []).filter(e => ['boon', 'affliction'].includes(e.kind))
  const rank = text => entries.map(entry => matchRoomText(text, {...catalog, entries:[entry]}))
    .filter(Boolean).sort((a,b) => b.similarity-a.similarity)
  const found = new Map(), unknown = []
  for (let i=0; i<texts.length;) {
    // The tooltip's close cross can be returned as a standalone Latin X.
    // Keep it in the raw evidence, but it is not an effect phrase.
    if (/^[xX×✕✖]$/.test(texts[i].trim())) { i++; continue }
    // Old captures can contain a heading, but headings never establish identity.
    if (Object.values(SANCTUM_EFFECT_CATEGORIES).some(c => c.label === texts[i].trim())) { i++; continue }
    let count=1, ranked=rank(texts[i])
    for (let n=2; n<=Math.min(4,texts.length-i); n++) {
      const joined=rank(texts.slice(i,i+n).join(''))
      if (joined[0]?.similarity > (ranked[0]?.similarity || 0)
        && texts.slice(i,i+n).every(t => (rank(t)[0]?.similarity || 0) < joined[0].similarity)) { ranked=joined; count=n }
    }
    const rawText=texts.slice(i,i+count).join('\n'), best=ranked[0]
    const exact=ranked.filter(m => normalizeRoomText(m.matchedText) === normalizeRoomText(rawText))
    // Names shared by countdown variants are resolved only by the adjacent
    // exact description, including its numbers. A name alone stays ambiguous.
    if (exact.length > 1 && count === 1) {
      let resolved=false
      for (let length=1;length<=Math.min(4,texts.length-i-1);length++) {
        const description=texts.slice(i+1,i+1+length).join('')
        const candidates=entries.filter(entry=>exact.some(m=>m.entryId===entry.id)
          && entry.descriptions?.some(text=>normalizeRoomText(text)===normalizeRoomText(description)))
        if(candidates.length===1) {
          // Let the ordinary description path produce the record, while the
          // raw OCR evidence still retains the heading for screenshot review.
          i++;resolved=true;break
        }
      }
      if(resolved) continue
    }
    // Preserve ambiguous variants and unrelated OCR instead of silently choosing an ID.
    const match=exact.length === 1 ? exact[0] : !exact.length && best?.similarity >= .7
      && (!ranked[1] || best.similarity-ranked[1].similarity >= .05) ? best : null
    if (!match) unknown.push({rawText,status:'unknown',reason:exact.length>1?'词条存在歧义':'未匹配词条'})
    else {
      const previous=found.get(match.entryId), entry=entries.find(e => e.id === match.entryId)
      const category=['major','minor'].includes(entry.tier) ? entry.tier+(entry.kind==='boon'?'Boon':'Affliction') : null
      const supported=match.calculationStatus==='supported' && previous?.numericCompatible !== false
      found.set(match.entryId,{...match,category,tier:entry.tier || null,
        calculationStatus:supported?'supported':'unsupported',
        numericCompatible:match.numericCompatible && previous?.numericCompatible !== false,
        rawText:previous ? previous.rawText+'\n'+rawText : rawText,
        effects:supported ? match.effects
          : [{entryId:entry.id,kind:entry.kind,name:entry.name,status:'unknown',rawText:`已识别：${entry.name}；计算暂不支持`}]})
    }
    i+=count
  }
  const items=[...found.values()]
  const categories=[...new Set(items.map(e=>e.category))]
  const category=categories.length===1 ? categories[0] : null
  const complete=evidence?.status==='located' && items.length>0 && !unknown.length
  const reason=evidence?.reason || (unknown.length ? unknown.map(item=>`${item.reason}：「${item.rawText}」`).join('；')
    : !items.length ? '未识别到该浮窗的名称或描述，无法确定具体状态'
      : evidence?.status !== 'located' ? `浮窗未完整定位；已识别文字：「${texts.join('；')}」` : null)
  const effects=[...items.flatMap(item=>item.effects.map(e=>({...e,category:item.category,tier:item.tier}))),...unknown]
  if (!complete) effects.push({status:'unknown',rawText:reason || '词缀范围未完整读取'})
  return {category,...SANCTUM_EFFECT_CATEGORIES[category],targetId:evidence?.targetId,evidenceId:evidence?.evidenceId,iconIndex:evidence?.iconIndex,texts,entries:items,effects,complete,reason,
    region:evidence?.region,status:evidence?.status!=='located' || !items.length && !unknown.length?'failed':unknown.length?'unmatched':'read'}
}
