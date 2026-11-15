import { createHash } from 'node:crypto'
import { createLocalizationDictionary, localizationStructureAliases } from './text.js'
import { parseItemInfo } from '../item/parser.js'

const validEntry = entry => entry?.en && (!entry.sourceHash || entry.sourceHash === createHash('sha256').update(entry.en).digest('hex'))

// Providers must come from LocalizationService: downloaded candidates are never runtime mappings.
export class LocalizationRuntime {
  constructor({ serverId = 'cn', entries = () => [], revision = () => '', baseNames = () => [] } = {}) {
    Object.assign(this, { serverId, entriesProvider: entries, revisionProvider: revision, baseNames })
    this.cachedRevision = null
  }

  current() {
    const revision = this.serverId === 'international' ? String(this.revisionProvider() || '') : ''
    if (this.cachedRevision !== revision) {
      const entries = this.serverId === 'international' && revision ? this.entriesProvider().filter(validEntry) : []
      this.dictionary = createLocalizationDictionary(entries)
      const names = new Map()
      const essenceNames = new Set()
      const essencePattern = /^(?:(?:Whispering|Muttering|Weeping|Wailing|Screaming|Shrieking|Deafening) )?Essence of .+$/i
      const canonicalEssenceNames = new Set(this.baseNames().filter(name => essencePattern.test(String(name))))
      for (const entry of entries) {
        if (entry.kind !== 'dat' || !/(?:^|[/\\])baseitemtypes(?:\.[a-z0-9]+)?$/i.test(`/${entry.table}`)) continue
        const canonical = this.dictionary.toEnglish(entry.en)
        if (essencePattern.test(canonical)) canonicalEssenceNames.add(canonical)
        for (const alias of this.dictionary.aliasesFor(entry.en)) {
          if (!names.has(alias)) names.set(alias, new Set())
          names.get(alias).add(canonical)
          if (/^(?:(?:Whispering|Muttering|Weeping|Wailing|Screaming|Shrieking|Deafening) )?Essence of .+$/.test(entry.en)) essenceNames.add(alias)
        }
      }
      this.value = {
        serverId: this.serverId,
        revision,
        structureAliases: localizationStructureAliases(this.dictionary),
        nameAliases: Object.fromEntries([...names].filter(([, candidates]) => candidates.size === 1).map(([alias, candidates]) => [alias, [...candidates][0]])),
        canonicalEssenceNames: [...canonicalEssenceNames],
        essenceNames: [...essenceNames]
      }
      this.cachedRevision = revision
    }
    return this.value
  }

  snapshot() { return structuredClone(this.current()) }

  assertRevision(revision) {
    const current = this.current()
    if (revision !== undefined && current.revision !== revision) {
      throw Object.assign(new Error('汉化资源已更改，请重新启动任务'), { code: 'LOCALIZATION_CHANGED' })
    }
  }

  parseItem(source, revision) {
    this.assertRevision(revision)
    const originalText = String(source || '')
    const canonicalText = this.serverId === 'international' ? this.dictionary.resolve(originalText).text : originalText
    const item = parseItemInfo(canonicalText)
    if (!item) return item
    if (this.serverId === 'international' && ['异界地图', '地图'].includes(item.category) && item.baseName === '地图') {
      const lines = canonicalText.split(/\r?\n/)
      const header = lines.slice(0, Math.max(0, lines.findIndex(line => /^-{3,}$/.test(line.trim()))))
      item.baseName = header.filter(line => line.trim() && !/[:：]/.test(line)).at(-1)?.trim() || item.baseName
    }
    if (this.serverId === 'international' && item.rarity === '魔法') {
      const name = String(item.baseName || item.name || '').toLowerCase()
      const candidates = new Map()
      for (const base of new Set([...this.baseNames(), ...Object.values(this.value.nameAliases)])) {
        const normalized = String(base).toLowerCase()
        if (!normalized) continue
        for (let start = name.indexOf(normalized); start >= 0; start = name.indexOf(normalized, start + 1)) {
          const end = start + normalized.length
          if (!/[\p{L}\p{N}]$/u.test(name.slice(0, start)) && !/^[\p{L}\p{N}]/u.test(name.slice(end))) {
            candidates.set(normalized, String(base))
            break
          }
        }
      }
      const longest = Math.max(0, ...[...candidates.keys()].map(value => value.length))
      const matches = [...candidates].filter(([value]) => value.length === longest)
      if (matches.length > 1) throw new Error('魔法物品底材存在多个候选，已停止制作')
      if (matches.length === 1) item.baseName = matches[0][1]
    }
    item.originalText = originalText
    item.canonicalText = canonicalText
    item.modTextAliases = {}
    if (this.serverId === 'international') {
      for (const modifier of item.modifiers || []) {
        modifier.textAliases = this.dictionary.aliasesFor(modifier.text)
        const originalName = modifier.name
        modifier.name = this.dictionary.toEnglish(modifier.name)
        modifier.nameAliases = [...new Set([originalName, ...this.dictionary.aliasesFor(modifier.name)])]
      }
      for (const text of [...(item.explicitMods || []), ...(item.implicitMods || []), ...(item.craftedMods || [])]) {
        item.modTextAliases[text] = this.dictionary.aliasesFor(text)
      }
    }
    return item
  }
}
