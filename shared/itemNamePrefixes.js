const compact = value => String(value ?? '').replace(/\s+/g, ' ').trim()

export const DEFAULT_ITEM_NAME_PREFIX_TEMPLATES = Object.freeze([
  Object.freeze({ id: 'QualityItem', en: 'Superior {0}', cn: '精良的 {0}', tw: '精良的 {0}' }),
  Object.freeze({ id: 'SynthesisedItem', en: 'Synthesised {0}', cn: '忆境 {0}', tw: '追憶之 {0}' }),
  Object.freeze({ id: 'FatedItem', en: 'Fated {0}', cn: '命定的 {0}', tw: '命運 {0}' })
])

export function matchItemNameTemplate(value, templateText) {
  if (typeof templateText !== 'string' || !templateText.includes('{0}')) return null
  const parts = templateText.split('{0}')
  if (parts.length !== 2 || !parts.join('').trim() || /[{}]/.test(parts.join(''))) return null
  const [prefix, suffix] = parts
  if (!value.startsWith(prefix) || !value.endsWith(suffix)) return null
  const inner = value.slice(prefix.length, suffix ? value.length - suffix.length : undefined).trim()
  return inner || null
}

/**
 * Strip display-only item name wrappers (e.g. "Superior {0}", "Synthesised {0}")
 * to recover the underlying base type for normal or unidentified single-line items.
 * Returns empty string when no prefix was stripped.
 */
export function stripItemNameBasePrefixes(value, { isMap = false, templates = DEFAULT_ITEM_NAME_PREFIX_TEMPLATES, locales = ['en', 'cn', 'tw'] } = {}) {
  const original = compact(value)
  if (!original) return ''
  let current = original
  const used = new Set()
  let changed = true
  while (changed) {
    changed = false
    for (const template of templates) {
      if (used.has(template.id)) continue
      for (const locale of locales) {
        const pattern = template[locale]
        if (!pattern) continue
        const inner = matchItemNameTemplate(current, pattern)
        if (!inner) continue
        // "Synthesised Map" is a distinct base item type, not a Synthesised-prefixed "Map".
        if (template.id === 'SynthesisedItem' && (isMap || /^Map$/i.test(inner))) continue
        used.add(template.id)
        current = inner
        changed = true
        break
      }
      if (changed) break
    }
  }
  return current !== original ? current : ''
}
