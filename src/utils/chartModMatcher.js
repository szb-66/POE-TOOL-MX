// 海图词缀文本匹配引擎。
// 剪贴板与 OCR 文本先规范化(全角转半角、去空白、数值范围与数字占位化),
// 再与词缀目录条目按行比对:碎片词缀按全部描述行打分确定唯一档位,
// 边框词缀按字符相似度模糊匹配。
import { BORDER_CHART_MODS, FRAGMENT_CHART_MODS } from '../data/chartModsData.js'

export const UNVEILED_TEXT = '航行词缀将在完成测绘后揭示'
export const BORDER_MATCH_THRESHOLD = 0.82

const FULLWIDTH_MAP = new Map([
  ['０', '0'], ['１', '1'], ['２', '2'], ['３', '3'], ['４', '4'],
  ['５', '5'], ['６', '6'], ['７', '7'], ['８', '8'], ['９', '9'],
  ['（', '('], ['）', ')'], ['－', '-'], ['—', '-'], ['–', '-'],
  ['％', '%'], ['＋', '+'], ['．', '.'], [',', ','], ['，', ',']
])

function toHalfWidth(text) {
  return String(text || '').replace(/[０-９（）－—–％＋．，,]/g, char => FULLWIDTH_MAP.get(char) ?? char)
}

// 规范化:全角转半角、去空白、数值范围与所有数字占位为 #,用于结构比对。
export function normalizeChartModText(text) {
  return toHalfWidth(text)
    .replace(/\s+/g, '')
    .replace(/\(\d+(?:\.\d+)?-\d+(?:\.\d+)?\)/g, '#')
    .replace(/[+-]?\d+(?:\.\d+)?/g, '#')
}

// 固定值规范化:数值范围占位,固定数字保留,用于目录条目分档比对。
export function catalogLineKey(text) {
  return toHalfWidth(text)
    .replace(/\s+/g, '')
    .replace(/\(\d+(?:\.\d+)?-\d+(?:\.\d+)?\)/g, '#')
}

const HAS_RANGE = /[（(]\d+[-—–]\d+[）)]/

// 归一化文本集合:每行规范化后,仅保留非空且长度足够的中文结构。
function normalizedLineSet(lines) {
  const values = new Set()
  for (const line of lines) {
    const normalized = normalizeChartModText(line)
    if (normalized) values.add(normalized)
  }
  return values
}

function fixedLineSet(lines) {
  const values = new Set()
  for (const line of lines) {
    const normalized = catalogLineKey(line)
    if (normalized) values.add(normalized)
  }
  return values
}

function modLineMatches(modLine, fullSet, fixedSet) {
  // 目录行含数值范围时按全占位结构比对,否则按固定数字精确比对。
  return HAS_RANGE.test(modLine)
    ? fullSet.has(normalizeChartModText(modLine))
    : fixedSet.has(catalogLineKey(modLine))
}

function levenshtein(left, right) {
  const shorter = left.length < right.length ? left : right
  const longer = left.length < right.length ? right : left
  if (!longer.length) return shorter.length
  let previous = Array.from({ length: shorter.length + 1 }, (_, index) => index)
  for (let row = 1; row <= longer.length; row++) {
    const current = [row]
    for (let column = 1; column <= shorter.length; column++) {
      const cost = longer[row - 1] === shorter[column - 1] ? 0 : 1
      current.push(Math.min(current[column - 1] + 1, previous[column] + 1, previous[column - 1] + cost))
    }
    previous = current
  }
  return previous[shorter.length]
}

export function textSimilarity(left, right) {
  if (!left && !right) return 1
  if (!left || !right) return 0
  const distance = levenshtein(left, right)
  return Math.max(0, 1 - distance / Math.max(left.length, right.length))
}

// 匹配碎片复制文本行,返回 { status: 'matched'|'unveiled'|'unknown', mod?, confidence }。
export function matchFragmentMods(lines) {
  const sourceLines = Array.isArray(lines) ? lines.filter(line => typeof line === 'string' && line.trim()) : []
  if (sourceLines.some(line => line.includes(UNVEILED_TEXT))) {
    return { status: 'unveiled', confidence: 1 }
  }
  if (!sourceLines.length) return { status: 'unknown', confidence: 0 }
  const fullSet = normalizedLineSet(sourceLines)
  const fixedSet = fixedLineSet(sourceLines)
  let best = null
  for (const mod of FRAGMENT_CHART_MODS) {
    if (!mod.lines.length) continue
    let matched = 0
    let fixedMatched = 0
    for (const modLine of mod.lines) {
      if (modLineMatches(modLine, fullSet, fixedSet)) {
        matched += 1
        if (!HAS_RANGE.test(modLine)) fixedMatched += 1
      }
    }
    if (matched === 0) continue
    const score = matched / mod.lines.length
    const better = !best
      || score > best.score
      || (score === best.score && matched > best.matched)
      || (score === best.score && matched === best.matched && fixedMatched > best.fixedMatched)
    if (better) {
      best = { mod, matched, fixedMatched, total: mod.lines.length, score }
    }
  }
  if (!best) return { status: 'unknown', confidence: 0 }
  return {
    status: 'matched',
    mod: best.mod,
    confidence: best.score,
    matchedLines: best.matched,
    totalLines: best.total
  }
}

// 匹配边框浮窗 OCR 文本行,返回 { status: 'matched'|'unknown', mod?, confidence }。
// 先按固定数字精确匹配,再按全占位结构匹配唯一候选,最后按字符相似度兜底。
export function matchBorderMods(lines) {
  const sourceLines = Array.isArray(lines) ? lines.filter(line => typeof line === 'string' && line.trim()) : []
  if (!sourceLines.length) return { status: 'unknown', confidence: 0 }
  const sourceFixed = fixedLineSet(sourceLines)
  const sourceFull = normalizedLineSet(sourceLines)
  if (!sourceFixed.size) return { status: 'unknown', confidence: 0 }

  for (const mod of BORDER_CHART_MODS) {
    if (mod.lines.some(line => sourceFixed.has(catalogLineKey(line)))) {
      return { status: 'matched', mod, confidence: 1 }
    }
  }
  const structural = BORDER_CHART_MODS.filter(mod =>
    mod.lines.length && mod.lines.some(line => sourceFull.has(normalizeChartModText(line))))
  if (structural.length === 1) {
    return { status: 'matched', mod: structural[0], confidence: 0.9 }
  }
  let best = null
  for (const mod of BORDER_CHART_MODS) {
    if (!mod.lines.length) continue
    for (const modLine of mod.lines) {
      const modKey = catalogLineKey(modLine)
      for (const sourceLine of sourceLines) {
        const similarity = textSimilarity(catalogLineKey(sourceLine), modKey)
        if (!best || similarity > best.confidence) {
          best = { mod, confidence: similarity }
        }
      }
    }
  }
  if (best && best.confidence >= BORDER_MATCH_THRESHOLD) {
    return { status: 'matched', mod: best.mod, confidence: best.confidence }
  }
  return { status: 'unknown', confidence: best?.confidence ?? 0 }
}
