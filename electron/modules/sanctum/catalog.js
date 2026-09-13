import { SEASON_BASELINE } from '../../../shared/seasonBaseline.js'
import { extendedSanctumRule, SANCTUM_STATE_RULES } from '../../../shared/sanctumRules.js'

export const SANCTUM_RULE_TEXT = Object.freeze({
  '不能恢复坚毅': 'cannotRecover',
  '不能获得启迪': 'cannotGainInspiration',
  '不能获得恩赐': 'cannotGainBoons',
  '禁域地图上的房间变为未知': 'roomsHidden',
  '圣所地图上的奖励变为未知': 'rewardsHidden',
  '圣所地图上的痛苦变为未知': 'afflictionsHidden',
  '圣所地图上的房间类型变为未知': 'typesHidden',
  '你在禁域地图上看到的房间减少一个': 'visionReduced',
  '你在禁域地图上看到的房间增加一个': 'visionIncreased',
  '你不是每次都能进入你选择的房间': 'randomDestination',
  '你的圣物效果降低50%': 'relicEffectReduction',
  '你的圣物效果提高30%': 'relicEffectIncrease',
  '圣所地图现在完全显示了': 'fullMapRevealed',
  '你不能再获得更多恩赐': 'cannotGainBoons',
  '你不能再获得更多次要痛苦': 'minorAfflictionImmune',
  '你获得的下一个痛苦转换为一个随机次要恩赐': 'convertNextAffliction',
  '你获得的下一个恩赐转换为一个随机次要痛苦': 'convertNextBoon',
  '坚毅恢复降低50%': 'recoveryReduced',
  '陷阱对坚毅的影响无限': 'lethalTraps',
  '陷阱对坚毅的影响提高 200%': 'dangerousTraps',
  '怪物对坚毅的影响提高25%': 'dangerousMonsters',
  '怪物伤害总增 50%': 'dangerousMonsters',
})

function parseRule(rawText) {
  if (typeof rawText !== 'string') return null
  if (Object.hasOwn(SANCTUM_RULE_TEXT,rawText)) return {rule:SANCTUM_RULE_TEXT[rawText]}
  const text=rawText.replace(/\s/g,'')
  let match=/^失去坚毅使你的禁域结束（([1-3])个房间后移除）$/.exec(text)
  if(match) return {rule:'endsOnResolveLoss',remainingRooms:Number(match[1])}
  match=/^完成(?:(下)间|([1-9]\d*)间)房间后失去250坚毅$/.exec(text)
  if(match) return {rule:'resolveLossCountdown',remainingRooms:match[1]?1:Number(match[2]),value:250}
  if(text==='你不能再恢复坚毅（消灭下一楼层的首领后移除）') return {rule:'cannotRecover',expires:'floorBoss'}
  if(text==='完成一个房间后失去5%当前坚毅') return {rule:'completionResolveLossPercent',value:5}
  if(text==='下个房间内不会失去坚毅') return {rule:'preventResolveLoss',remainingRooms:1}
  if(text==='所有房间赋予一个随机次要痛苦。（完成房间后移除该效果赋予的痛苦）') return {rule:'randomAfflictionEachRoom'}
  return extendedSanctumRule(rawText)
}

export function sanctumRule(rawText) {
  const parsed=parseRule(rawText)
  if (!parsed) return null
  const metadata=SANCTUM_STATE_RULES[parsed.rule] || {}
  return {...metadata,...parsed,...(rawText === '怪物伤害总增 50%' ? {damageDomain:'life',value:50}:{}),
    ...(parsed.remainingRooms ? {expires:'rooms'}:{})}
}

export function isCurrentSanctumEntry(catalog, entry) {
  return catalog?.schemaVersion === 1 && catalog.game === 'poe1' && catalog.patch === SEASON_BASELINE.patch
    && entry?.applicability === 'current' && entry.reviewedPatch === catalog.patch
    && catalog.sources?.some(source => source.id === entry.sourceId && source.channel === 'official')
}

// Matching names is separate from accepting a rule as current. Never use fuzzy
// OCR matching or a download timestamp as proof of patch applicability.
export function resolveSanctumCatalogText(catalog, kind, rawText) {
  if (typeof rawText !== 'string' || rawText.length > 10000) throw new Error('圣所目录文本无效')
  const unknown = reason => ({ status: 'unknown', reason, rawText, rule: null })
  if (catalog?.schemaVersion !== 1 || catalog.game !== 'poe1' || catalog.patch !== SEASON_BASELINE.patch) return unknown('CATALOG_VERSION_MISMATCH')
  const text = rawText.normalize('NFC').trim()
  const candidates = (catalog.entries || []).filter(entry => entry.kind === kind &&
    [entry.name, ...(entry.aliases || [])].some(name => name.normalize('NFC').trim() === text))
  if (candidates.length !== 1) return { ...unknown(candidates.length ? 'AMBIGUOUS' : 'NOT_FOUND'), candidates: candidates.map(entry => entry.id) }
  const entry = candidates[0]
  if (!isCurrentSanctumEntry(catalog, entry)) return { ...unknown('UNVERIFIED_OR_HISTORICAL'), id: entry.id }
  const effects = (entry.descriptions || []).map(rawText => ({ rawText, entryId:entry.id, kind, ...sanctumRule(rawText),
    status: sanctumRule(rawText) ? 'matched' : 'unknown' }))
  return { status: 'matched', id: entry.id, name: entry.name, rawText, effects,
    scoringComplete: effects.every(effect => effect.status === 'matched'), sourceId: entry.sourceId }
}
