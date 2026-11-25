import { createHash } from 'node:crypto'

const labels = {
  GreaterViscera: Object.freeze({ grade: 'greater', en: 'Greater {0}', cn: '高级 {0}' }),
  LesserViscera: Object.freeze({ grade: 'lesser', en: 'Lesser {0}', cn: '次级 {0}' })
}
export const DEFAULT_VISCERA_NAME_TEMPLATES = Object.freeze(Object.values(labels))

const compact = value => String(value ?? '').replace(/\s+/g, ' ').trim()
const validAlias = value => value !== '{0}' && /^[^{}]*\{0\}[^{}]*$/u.test(value)

// ClientStrings add a display grade to a base name. The current trade item catalog uses the base name.
export function visceraNameTemplates(entries) {
  const templates = []
  for (const [id, label] of Object.entries(labels)) {
    const hash = createHash('sha256').update(label.en).digest('hex')
    const matches = entries.filter(entry => entry?.id === id && entry.kind === 'dat' && entry.field === 'Text' &&
      /^clientstrings(?:\.datc?64)?$/i.test(entry.table) && entry.en === label.en && entry.sourceHash === hash)
    if (matches.length !== 1) continue
    const [entry] = matches
    const cn = compact(entry.cn)
    const tw = compact(entry.tw)
    templates.push({ grade: label.grade, en: entry.en,
      ...(validAlias(cn) ? { cn } : {}), ...(validAlias(tw) ? { tw } : {}) })
  }
  return templates
}

export function splitVisceraName(value, templates, locales = ['en', 'cn', 'tw']) {
  const name = compact(value)
  const matches = new Map()
  for (const template of templates) {
    for (const locale of locales) {
      if (!template[locale]) continue
      const [prefix, suffix] = template[locale].split('{0}')
      if (!name.startsWith(prefix) || !name.endsWith(suffix)) continue
      const baseName = name.slice(prefix.length, name.length - suffix.length).trim()
      if (baseName) matches.set(`${template.grade}\0${baseName}`, { baseName, grade: template.grade })
    }
  }
  return matches.size === 1 ? matches.values().next().value : null
}
