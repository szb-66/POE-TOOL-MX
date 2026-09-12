import { textSimilarity } from '../../../src/utils/chartModMatcher.js'
import { isCurrentSanctumEntry, sanctumRule } from './catalog.js'
import { isRoomProfileTitle } from '../../../shared/sanctumRoomProfiles.js'

const kinds = new Set(['room', 'reward', 'boon', 'affliction'])
export const normalizeRoomText = value => String(value).normalize('NFKC').replace(/[\s\p{P}]/gu, '').toLowerCase()
const compareId = (a, b) => a < b ? -1 : a > b ? 1 : 0
const preparedCatalogs = new WeakMap()

function prepareCatalog(catalog) {
  const entries = catalog?.entries || []
  // Catalogs can be corrected in place. Identity alone is not a version.
  const version = JSON.stringify(entries)
  const cached = catalog && preparedCatalogs.get(catalog)
  if (cached?.version === version) return cached.rows
  const rows = entries.filter(entry => kinds.has(entry.kind)).map(entry => ({entry,
    values: [entry.name, ...(entry.aliases || []), ...(entry.descriptions || [])]
      .filter(value => typeof value === 'string' && normalizeRoomText(value))
      .map(value => ({value, normalized: normalizeRoomText(value)}))}))
  if (catalog) preparedCatalogs.set(catalog, {version, rows})
  return rows
}

export function matchRoomText(rawText, catalog, prepared = prepareCatalog(catalog)) {
  const text = normalizeRoomText(rawText)
  if (!text) return null
  let best
  for (const {entry, values} of prepared) {
    for (const {value, normalized} of values) {
      // Edit distance cannot be smaller than the length difference.
      const upper = 1 - Math.abs(text.length-normalized.length) / Math.max(text.length, normalized.length)
      if (best && (upper < best.similarity || upper === best.similarity && compareId(entry.id, best.entry.id) >= 0)) continue
      const similarity = textSimilarity(text, normalized)
      if (!best || similarity > best.similarity || similarity === best.similarity && compareId(entry.id, best.entry.id) < 0) best = { entry, text: value, similarity }
    }
  }
  if (!best) return null
  const { entry, similarity } = best
  const verified = isCurrentSanctumEntry(catalog, entry)
  const numeric = value => value.normalize('NFKC').match(/\d+(?:[.,]\d+)?/g)?.join('|') || ''
  const numericCompatible = numeric(rawText) === numeric(best.text)
  const descriptions = entry.descriptions || []
  const supported = verified && numericCompatible && descriptions.length > 0
    && descriptions.every(value => sanctumRule(value))
  const source = catalog.sources?.find(value => value.id === entry.sourceId)
  return { rawText, entryId: entry.id, name: entry.name, kind: entry.kind, matchedText: best.text,
    descriptions, similarity, source: { id: entry.sourceId, label: '编年史词库快照', url: source?.url },
    versionStatus: verified ? 'verified' : 'unverified', calculationStatus: supported ? 'supported' : 'unsupported',
    numericCompatible, roomType: entry.roomType,
    evaluationMode: supported ? descriptions.some(text=>sanctumRule(text)?.mode === 'conditional') ? 'conditional':'numeric' : null,
    supportReason: !verified ? '词条版本尚未核验' : !numericCompatible ? '识别数值与词条不一致' : !supported ? '缺少规则实现' : null,
    effects: supported ? descriptions.map(rawText => ({ rawText, entryId:entry.id, name:entry.name, kind:entry.kind, tier:entry.tier, ...sanctumRule(rawText), status: 'matched' })) : [] }
}

export function recognizeRoomTexts(texts, catalog, blocks = []) {
  const lines = (Array.isArray(texts) ? texts : []).filter(t => typeof t === 'string' && t.trim()).slice(0, 80)
  const entries = (catalog?.entries || []).filter(e => e.kind !== 'room' || e.descriptions?.length)
  const prepared = prepareCatalog(catalog).filter(({entry}) => entry.kind !== 'room' || entry.descriptions?.length)
  const queries = new Map()
  const roomNames = new Set((catalog?.entries || []).filter(e => e.kind === 'room' && !e.descriptions?.length)
    .flatMap(e => [e.name, ...(e.aliases || [])]).map(normalizeRoomText))
  const title = text => isRoomProfileTitle(text) || roomNames.has(normalizeRoomText(text))
    || text.split('、').length > 1 && text.split('、').every(part => /^[\p{L}]{2,9}$/u.test(part.trim()))
  const classify = text => /^包含|^完成后(?:提供|获得)/.test(text) ? 'room'
    : /^在你进入时受到.+折磨$/.test(text) ? 'affliction' : null
  const matchLine = text => {
    if (queries.has(text)) return queries.get(text)
    const kind = classify(text)
    const lookup = text.replace(/^在你进入时受到(.+)折磨$/, '$1')
    const match = matchRoomText(lookup, catalog, prepared.filter(({entry}) => !kind || entry.kind === kind))
    const result = match ? { ...match, rawText:text, role:kind === 'room' ? 'content' : 'effect' } : null
    queries.set(text, result)
    return result
  }
  const matches = [], titles = []
  for (let i = 0; i < lines.length;) {
    if (title(lines[i])) { titles.push(lines[i]); i++; continue }
    let match = matchLine(lines[i]), count = 1
    // Join wrapped descriptions only when they improve on every constituent
    // match. Independent complete effects therefore remain separate entries.
    for (let n = 2; n <= Math.min(4, lines.length-i); n++) {
      if (title(lines[i+n-1]) || classify(lines[i+n-1])) break
      const previous = blocks[i+n-2]?.region, next = blocks[i+n-1]?.region
      if (previous && next && next.y - previous.y - previous.height > Math.max(previous.height, next.height)) break
      const joined = matchLine(lines.slice(i, i+n).join(''))
      const singles = lines.slice(i, i+n).map(line => matchLine(line)?.similarity || 0)
      if (joined && joined.similarity > Math.max(...singles) && (!match || joined.similarity > match.similarity)) { match = joined; count = n }
    }
    // Standalone punctuation/numbers are not effect prose. Numeric continuation
    // lines have already had a chance to join the preceding description above.
    if (count === 1 && !/[\p{L}]/u.test(lines[i])) match = null
    if (match) {
      const evidence = lines.slice(i,i+count).map((rawText,index) => ({rawText,lineStart:i+index}))
      const previous = matches.at(-1)
      const intro = previous && /^在你进入时受到.+折磨$/.test(previous.rawText)
      if (intro && previous.entryId === match.entryId && match.numericCompatible && previous.lineStart+previous.lineCount === i) {
        matches[matches.length-1] = { ...match, rawText:previous.rawText+'\n'+match.rawText,
          lineStart:previous.lineStart, lineCount:previous.lineCount+count, evidence:[...previous.evidence,...evidence] }
      } else matches.push({ ...match, lineStart: i, lineCount: count, evidence })
    }
    i += count
  }
  return { status: !lines.length ? 'empty' : !matches.length ? (entries.length ? 'empty':'no-catalog') : 'matched',
    reason: !lines.length ? '框内未识别到文字' : !matches.length ? (entries.length ? '框内没有可识别正文':'本地词库没有可匹配词条') : null,
    blocks, matches, titles }
}
