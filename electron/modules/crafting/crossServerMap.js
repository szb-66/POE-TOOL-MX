import fs from 'node:fs'

const MAP_URL = new URL('../../assets/crafting-cross-server-map.json', import.meta.url)
const PRICE_CHECK_CATALOG_URL = new URL('../priceCheck/catalog.json', import.meta.url)
const CLUSTER_NOTABLE_CN_PATTERN = /^其中\s*1\s*个增加的天赋为/
const CLUSTER_NOTABLE_EN_PATTERN = /^1 Added Passive Skill is /

let cachedIndex = null

function cleanEffectPattern(text = '') {
  return String(text || '')
    .replace(/\(?[+\-]?\d+(?:\.\d+)?\s*[—–-]\s*[+\-]?\d+(?:\.\d+)?\)?/g, '#')
    .replace(/[+\-]?\d+(?:\.\d+)?/g, '#')
    .replace(/#+/g, '#')
    .trim()
}

export function loadCraftingCrossServerMap() {
  if (cachedIndex) return cachedIndex
  let raw = { modifiers: { cnToEn: {}, enToCn: {} }, eldritch: [] }
  try {
    raw = JSON.parse(fs.readFileSync(MAP_URL, 'utf8'))
  } catch {
    // Fallback to empty map when asset is unavailable
  }
  const cnToEn = new Map(Object.entries(raw.modifiers?.cnToEn || {}))
  const enToCn = new Map(Object.entries(raw.modifiers?.enToCn || {}))
  try {
    const catalog = JSON.parse(fs.readFileSync(PRICE_CHECK_CATALOG_URL, 'utf8'))
    for (const stat of catalog.stats || []) {
      if (!stat?.ids?.explicit || typeof stat.label !== 'string' || !CLUSTER_NOTABLE_CN_PATTERN.test(stat.label)) continue
      const matchers = Array.isArray(stat.matchers) ? stat.matchers : []
      const en = (Array.isArray(stat.refs) && stat.refs.find(value => CLUSTER_NOTABLE_EN_PATTERN.test(String(value || ''))))
        || matchers.find(value => CLUSTER_NOTABLE_EN_PATTERN.test(String(value || '')))
      if (!en) continue
      const cnClean = cleanEffectPattern(stat.label)
      const enClean = cleanEffectPattern(en)
      if (cnClean && enClean) {
        if (!cnToEn.has(cnClean)) cnToEn.set(cnClean, en)
        if (!enToCn.has(enClean)) enToCn.set(enClean, stat.label)
      }
      if (!cnToEn.has(stat.label)) cnToEn.set(stat.label, en)
      if (!enToCn.has(en)) enToCn.set(en, stat.label)
    }
  } catch {
    // Fallback when priceCheck catalog is unavailable
  }

  const eldritchByCanonicalKey = new Map()
  const eldritchByCnFamilyId = new Map()
  const eldritchByEnFamilyId = new Map()
  const eldritchByCnPattern = new Map()
  const eldritchByEnPattern = new Map()

  for (const pair of raw.eldritch || []) {
    eldritchByCanonicalKey.set(pair.canonicalKey, pair)
    if (pair.cnFamilyId) eldritchByCnFamilyId.set(pair.cnFamilyId, pair)
    if (pair.enFamilyId) eldritchByEnFamilyId.set(pair.enFamilyId, pair)
    const cnPatKey = `${pair.source}\u0000${pair.cnPattern}`
    const enPatKey = `${pair.source}\u0000${pair.enPattern}`
    if (!eldritchByCnPattern.has(cnPatKey)) eldritchByCnPattern.set(cnPatKey, pair)
    if (!eldritchByEnPattern.has(enPatKey)) eldritchByEnPattern.set(enPatKey, pair)
    if (!eldritchByCnPattern.has(pair.cnPattern)) eldritchByCnPattern.set(pair.cnPattern, pair)
    if (!eldritchByEnPattern.has(pair.enPattern)) eldritchByEnPattern.set(pair.enPattern, pair)
  }

  cachedIndex = {
    cnToEn,
    enToCn,
    eldritchByCanonicalKey,
    eldritchByCnFamilyId,
    eldritchByEnFamilyId,
    eldritchByCnPattern,
    eldritchByEnPattern
  }
  return cachedIndex
}

export function canonicalAffixPattern(pattern) {
  const cleaned = cleanEffectPattern(pattern)
  if (!cleaned) return ''
  const map = loadCraftingCrossServerMap()
  if (map.enToCn.has(pattern)) return pattern
  if (map.enToCn.has(cleaned)) return cleaned
  if (map.cnToEn.has(cleaned)) return map.cnToEn.get(cleaned)
  return ''
}

export function translateAffixPattern(pattern, targetLanguage = 'zh-CN') {
  const cleaned = cleanEffectPattern(pattern)
  if (!cleaned) return pattern
  const map = loadCraftingCrossServerMap()
  if (targetLanguage === 'zh-CN') {
    if (map.cnToEn.has(pattern)) return pattern
    if (map.cnToEn.has(cleaned)) return cleaned
    if (map.enToCn.has(cleaned)) return map.enToCn.get(cleaned)
    return pattern
  }
  if (targetLanguage === 'en') {
    if (map.enToCn.has(pattern)) return pattern
    if (map.enToCn.has(cleaned)) return cleaned
    if (map.cnToEn.has(cleaned)) return map.cnToEn.get(cleaned)
    return pattern
  }
  return pattern
}

export function expandAffixPatternsForMatching(condition) {
  if (!condition || typeof condition !== 'object') return []
  const map = loadCraftingCrossServerMap()
  const rawPatterns = [condition.effectPattern, condition.canonicalPattern].filter(Boolean)
  const out = new Set()
  for (const raw of rawPatterns) {
    out.add(raw)
    const cleaned = cleanEffectPattern(raw)
    if (!cleaned) continue
    out.add(cleaned)
    if (map.cnToEn.has(cleaned)) out.add(map.cnToEn.get(cleaned))
    if (map.enToCn.has(cleaned)) out.add(map.enToCn.get(cleaned))
  }
  return [...out].filter(Boolean)
}

export function findEldritchPair(target) {
  if (!target || typeof target !== 'object') return null
  const map = loadCraftingCrossServerMap()
  if (target.canonicalKey && map.eldritchByCanonicalKey.has(target.canonicalKey)) {
    return map.eldritchByCanonicalKey.get(target.canonicalKey)
  }
  if (target.familyId) {
    if (map.eldritchByCnFamilyId.has(target.familyId)) return map.eldritchByCnFamilyId.get(target.familyId)
    if (map.eldritchByEnFamilyId.has(target.familyId)) return map.eldritchByEnFamilyId.get(target.familyId)
  }
  const source = target.source || ''
  for (const raw of [target.effectPattern, target.canonicalPattern].filter(Boolean)) {
    const cleaned = cleanEffectPattern(raw)
    if (!cleaned) continue
    if (source && map.eldritchByCnPattern.has(`${source}\u0000${cleaned}`)) return map.eldritchByCnPattern.get(`${source}\u0000${cleaned}`)
    if (source && map.eldritchByEnPattern.has(`${source}\u0000${cleaned}`)) return map.eldritchByEnPattern.get(`${source}\u0000${cleaned}`)
    if (map.eldritchByCnPattern.has(cleaned)) return map.eldritchByCnPattern.get(cleaned)
    if (map.eldritchByEnPattern.has(cleaned)) return map.eldritchByEnPattern.get(cleaned)
  }
  return null
}

export function translateEldritchTarget(target, targetLanguage = 'zh-CN', displayTextResolver = null) {
  const pair = findEldritchPair(target)
  if (!pair) return target
  if (targetLanguage === 'zh-CN') {
    const pattern = pair.cnPattern
    return {
      ...target,
      canonicalKey: pair.canonicalKey,
      familyId: pair.cnFamilyId,
      effectPattern: pattern,
      displayName: pattern
    }
  }
  if (targetLanguage === 'en') {
    const pattern = pair.enPattern
    const displayName = displayTextResolver ? displayTextResolver(pattern) : pattern
    return {
      ...target,
      canonicalKey: pair.canonicalKey,
      familyId: pair.enFamilyId,
      effectPattern: displayName || pattern,
      displayName: displayName || pattern
    }
  }
  return target
}

export function expandEldritchPatternsForMatching(target) {
  if (!target || typeof target !== 'object') return []
  const pair = findEldritchPair(target)
  const out = new Set([target.effectPattern, target.canonicalPattern].filter(Boolean))
  if (pair) {
    if (pair.cnPattern) out.add(pair.cnPattern)
    if (pair.enPattern) out.add(pair.enPattern)
  }
  return [...out].filter(Boolean)
}
