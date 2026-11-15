import { createHash } from 'node:crypto'

export function createUniqueNameResolver(entries) {
  const en = 'Foulborn {0}'
  const rows = entries.filter(entry => entry.kind === 'dat' && /^clientstrings(?:\.datc?64)?$/i.test(entry.table) &&
    entry.id === 'MutatedUniqueName' && entry.field === 'Text' && entry.en === en &&
    entry.sourceHash === createHash('sha256').update(en).digest('hex'))
  const patterns = [...new Set(rows.flatMap(entry => [entry.cn, entry.tw]).filter(Boolean))].flatMap(value => {
    const parts = value.split('{0}')
    if (parts.length !== 2 || !parts.join('').trim() || /[{}]/.test(parts.join(''))) return []
    return [{ prefix: parts[0], suffix: parts[1] }]
  })
  return (name, translate) => {
    const candidates = new Set()
    for (const { prefix, suffix } of patterns) {
      if (!name.startsWith(prefix) || !name.endsWith(suffix)) continue
      const base = name.slice(prefix.length, suffix ? -suffix.length : undefined).trim()
      if (!base) continue
      const translated = translate(base)
      if (translated !== base || entries.some(entry => entry.kind === 'dat' && /^words(?:\.datc?64)?$/i.test(entry.table) && entry.en === base)) {
        candidates.add(`Foulborn ${translated}`)
      }
    }
    return candidates.size === 1 ? candidates.values().next().value : null
  }
}
