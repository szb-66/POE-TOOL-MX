import { createHash } from 'node:crypto'
import { DEFAULT_ITEM_NAME_PREFIX_TEMPLATES, matchItemNameTemplate } from '../../../shared/itemNamePrefixes.js'

const compact = value => String(value ?? '').replace(/\s+/g, ' ').trim()
const validAlias = value => value !== '{0}' && /^[^{}]*\{0\}[^{}]*$/u.test(value)

// ClientStrings wrap normal or unidentified item base names with display prefixes
// such as "Superior {0}" and "Synthesised {0}". Only signed entries are trusted.
export function itemNamePrefixTemplates(entries = []) {
  const templates = []
  for (const label of DEFAULT_ITEM_NAME_PREFIX_TEMPLATES) {
    const hash = createHash('sha256').update(label.en).digest('hex')
    const matches = entries.filter(entry => entry?.id === label.id && entry.kind === 'dat' && entry.field === 'Text' &&
      /^clientstrings(?:\.datc?64)?$/i.test(entry.table) && entry.en === label.en && entry.sourceHash === hash)
    if (matches.length !== 1) continue
    const [entry] = matches
    const cn = compact(entry.cn)
    const tw = compact(entry.tw)
    templates.push({
      id: label.id,
      en: entry.en,
      ...(validAlias(cn) ? { cn } : {}),
      ...(validAlias(tw) ? { tw } : {})
    })
  }
  return templates
}

export function resolvePrefixedItemName(value, templates, resolveInner, { locales = ['cn', 'tw'], used = new Set() } = {}) {
  const name = compact(value)
  if (!name || !templates?.length) return null
  const results = new Set()
  for (const template of templates) {
    if (used.has(template.id)) continue
    const seenInner = new Set()
    for (const locale of locales) {
      const pattern = template[locale]
      if (!pattern) continue
      const inner = matchItemNameTemplate(name, pattern)
      if (!inner || seenInner.has(inner)) continue
      seenInner.add(inner)
      const direct = resolveInner(inner)
      if (direct) {
        results.add(template.en.replace('{0}', () => direct))
        continue
      }
      const nextUsed = new Set(used)
      nextUsed.add(template.id)
      const nested = resolvePrefixedItemName(inner, templates, resolveInner, { locales, used: nextUsed })
      if (nested) results.add(template.en.replace('{0}', () => nested))
    }
  }
  return results.size === 1 ? results.values().next().value : null
}
