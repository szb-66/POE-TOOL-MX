import { FRAGMENT_CHART_MODS } from '../data/chartModsData.js'
import { ATLAS_MAP_AFFIX_SUGGESTIONS } from '../data/mapAffixSuggestionsData.js'
import { HEIST_AFFIX_SUGGESTIONS } from '../data/heistAffixSuggestionsData.js'

const CHART_REWARD_LINE = /^\u76f8\u90bb\u533a\u57df(?:\u4e2d\u627e\u5230\u7684(?:\u7269\u54c1\u6570\u91cf|\u7269\u54c1\u7a00\u6709\u5ea6|\u4ea1\u8005\u786b\u78fa)|\u7684\u602a\u7269\u7fa4\u89c4\u6a21)\u63d0\u9ad8/
const UNVEILED_TEXT = '\u822a\u884c\u8bcd\u7f00\u5c06\u5728\u5b8c\u6210\u6d4b\u7ed8\u540e\u63ed\u793a'
const VARIABLE_NUMBER = /[+-]?\(?[+-]?\d+(?:[\u2014-][+-]?\d+)?\)?%?/g
const EDGE_PUNCTUATION = /^[\s+()\uff08\uff09,%\u2014\-\uff0c\u3002:：]+|[\s+()\uff08\uff09,%\u2014\-\uff0c\u3002:：]+$/g

function shapeVariableNumbers(text) {
  return String(text || '').replace(VARIABLE_NUMBER, '#').replace(/\s+/g, ' ').trim()
}

function stableSegment(pattern) {
  return pattern
    .split('#')
    .map(part => part.replace(EDGE_PUNCTUATION, '').trim())
    .filter(part => part.length >= 4 && !/\d/.test(part))
    .sort((left, right) => right.length - left.length || left.localeCompare(right, 'zh-CN'))[0] || ''
}

function chartPrimaryLines(mod) {
  return (mod?.lines || []).filter(line => (
    line &&
    line !== UNVEILED_TEXT &&
    !CHART_REWARD_LINE.test(line)
  ))
}

/**
 * 从现有海图快照生成联想目录。数值档位先按文本结构分组，
 * 再仅选取实际文本中最长的共有连续非数值片段，不会拼接数字两侧的文本。
 */
export function buildChartAffixSuggestions(mods = FRAGMENT_CHART_MODS) {
  const groups = new Map()
  for (const mod of Array.isArray(mods) ? mods : []) {
    if (!['prefix', 'suffix'].includes(mod?.affixType)) continue
    for (const line of chartPrimaryLines(mod)) {
      const pattern = shapeVariableNumbers(line)
      const value = stableSegment(pattern)
      if (!value || !line.includes(value)) continue
      const groupKey = `${mod.affixType}\u0000${pattern}`
      const group = groups.get(groupKey) || {
        value,
        example: line,
        affixType: mod.affixType,
        tags: new Set(),
        variants: new Set()
      }
      for (const tag of mod.tags || []) if (tag) group.tags.add(tag)
      group.variants.add(line)
      groups.set(groupKey, group)
    }
  }

  const byValue = new Map()
  const ambiguousValues = new Set()
  for (const group of groups.values()) {
    if (![...group.variants].every(line => line.includes(group.value))) continue
    const candidate = {
      value: group.value,
      example: group.example,
      affixType: group.affixType,
      tags: [...group.tags].sort((a, b) => a.localeCompare(b, 'zh-CN')),
      variants: [...group.variants]
    }
    if (ambiguousValues.has(candidate.value)) continue
    const existing = byValue.get(candidate.value)
    if (!existing) {
      byValue.set(candidate.value, candidate)
      continue
    }
    // 同一稳定文本若跨前后缀出现，无法提供唯一且准确的类型标签，保守排除。
    if (existing.affixType !== candidate.affixType) {
      byValue.delete(candidate.value)
      ambiguousValues.add(candidate.value)
      continue
    }
    // 同一稳定片段出现在多个数值结构时合并，保证类型内 value 唯一。
    existing.tags = [...new Set([...existing.tags, ...candidate.tags])].sort((a, b) => a.localeCompare(b, 'zh-CN'))
    existing.variants = [...new Set([...existing.variants, ...candidate.variants])]
  }

  return [...byValue.values()].sort((left, right) => left.value.localeCompare(right.value, 'zh-CN'))
}

export const CHART_AFFIX_SUGGESTIONS = Object.freeze(
  buildChartAffixSuggestions().map(entry => Object.freeze({
    ...entry,
    tags: Object.freeze(entry.tags),
    variants: Object.freeze(entry.variants)
  }))
)

export function affixSuggestionsForKind(targetKind) {
  if (targetKind === 'atlas') return ATLAS_MAP_AFFIX_SUGGESTIONS
  if (targetKind === 'chart') return CHART_AFFIX_SUGGESTIONS
  if (targetKind === 'heist') return HEIST_AFFIX_SUGGESTIONS
  return []
}

export function searchMapAffixSuggestions(targetKind, query, limit = 50) {
  try {
    const keyword = String(query || '').trim().toLocaleLowerCase('zh-CN')
    if (!keyword) return []
    const safeLimit = Number.isFinite(Number(limit)) ? Math.max(0, Math.floor(Number(limit))) : 50
    return affixSuggestionsForKind(targetKind)
      .filter(entry => `${entry.value} ${entry.example} ${(entry.tags || []).join(' ')}`.toLocaleLowerCase('zh-CN').includes(keyword))
      .slice(0, safeLimit)
  } catch {
    return []
  }
}
