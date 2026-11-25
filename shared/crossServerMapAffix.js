import data from './crossServerMapAffixData.js'

const VARIABLE_NUMBER = /[+-]?\(?[+-]?\d+(?:\.\d+)?(?:\s*[—–-]\s*[+-]?\d+(?:\.\d+)?)?\)?%?/g

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function shapeText(value) {
  return normalizeText(value)
    .replace(/\(-([\d.]+)[—–-]-([\d.]+)\)/g, '-($1—$2)')
    .replace(VARIABLE_NUMBER, '#')
}

function isTemplateOrNumberless(text) {
  return text.includes('#') || !/\d/.test(text)
}

function buildKindIndex(rows) {
  const byId = new Map()
  const lookup = new Map()

  const registerExact = (text, id) => {
    const cleaned = normalizeText(text)
    if (!cleaned) return
    const exactKey = `exact:${cleaned.toLocaleLowerCase('zh-CN')}`
    if (!lookup.has(exactKey)) lookup.set(exactKey, id)
  }

  const registerTemplate = (text, id) => {
    const cleaned = normalizeText(text)
    if (!cleaned) return
    registerExact(cleaned, id)
    const shaped = shapeText(cleaned)
    if (shaped && shaped !== '#') {
      const shapeKey = `shape:${shaped.toLocaleLowerCase('zh-CN')}`
      if (!lookup.has(shapeKey)) lookup.set(shapeKey, id)
    }
  }

  for (const row of rows) {
    byId.set(row.id, row)
    registerExact(row.id, row.id)
    registerTemplate(row.cn, row.id)
    registerTemplate(row.en, row.id)
    registerTemplate(row.enPattern, row.id)
  }

  return { byId, lookup }
}

const INDEXES = Object.freeze({
  atlas: buildKindIndex(data.atlas),
  heist: buildKindIndex(data.heist)
})

export function findCanonicalMapAffixId(term, targetKind = 'atlas', localizedCatalog = null) {
  const index = INDEXES[targetKind]
  if (!index) return ''
  const cleaned = normalizeText(term)
  if (!cleaned) return ''
  // Concrete fixed-number terms (e.g. "Monsters fire 2 additional Projectiles") must NOT be widened to "#".
  if (!isTemplateOrNumberless(cleaned)) return ''
  const exactHit = index.lookup.get(`exact:${cleaned.toLocaleLowerCase('zh-CN')}`)
  if (exactHit) return exactHit
  const shapeHit = index.lookup.get(`shape:${shapeText(cleaned).toLocaleLowerCase('zh-CN')}`)
  if (shapeHit) return shapeHit

  if (localizedCatalog && localizedCatalog.size > 0) {
    const lower = cleaned.toLocaleLowerCase('zh-CN')
    const shaped = shapeText(cleaned).toLocaleLowerCase('zh-CN')
    for (const [enText, meta] of localizedCatalog.entries()) {
      const candidates = [meta?.displayText, ...(meta?.aliases || [])].filter(Boolean)
      if (candidates.some(text => normalizeText(text).toLocaleLowerCase('zh-CN') === lower || shapeText(text).toLocaleLowerCase('zh-CN') === shaped)) {
        const hit = index.lookup.get(`exact:${normalizeText(enText).toLocaleLowerCase('zh-CN')}`)
          || index.lookup.get(`shape:${shapeText(enText).toLocaleLowerCase('zh-CN')}`)
        if (hit) return hit
      }
    }
  }
  return ''
}

export function resolveMapAffixTermForLanguage(term, targetKind = 'atlas', targetLanguage = 'zh-CN', localizedCatalog = null) {
  const index = INDEXES[targetKind]
  if (!index || typeof term !== 'string') return term
  const canonicalId = findCanonicalMapAffixId(term, targetKind, localizedCatalog)
  if (!canonicalId) return term
  const row = index.byId.get(canonicalId)
  if (!row) return term
  if (targetLanguage === 'zh-CN') return row.cn || term
  if (targetLanguage === 'en') {
    const localized = localizedCatalog?.get?.(row.en) || localizedCatalog?.get?.(row.enPattern)
    return localized?.displayText || row.en || term
  }
  return term
}

export function translateMapAffixList(terms, targetKind = 'atlas', targetLanguage = 'zh-CN', localizedCatalog = null) {
  if (!Array.isArray(terms)) return []
  return terms.map(term => resolveMapAffixTermForLanguage(term, targetKind, targetLanguage, localizedCatalog))
}

export function expandMapAffixTermForMatching(term, targetKind = 'atlas') {
  const index = INDEXES[targetKind]
  if (!index || !term) return term ? [term] : []
  const canonicalId = findCanonicalMapAffixId(term, targetKind)
  if (!canonicalId) return [term]
  const row = index.byId.get(canonicalId)
  if (!row) return [term]
  return [...new Set([term, row.cn, row.enPattern, row.en].filter(Boolean))]
}
