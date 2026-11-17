import { createHash } from 'node:crypto'
import { createLocalizationDictionary, localizationStructureAliases } from './text.js'
import { parseItemInfo } from '../item/parser.js'
import { applyCraftingDisplay } from '../item/craftingDisplay.js'

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
    const resolved = this.serverId === 'international' ? this.dictionary.resolve(originalText) : { text: originalText }
    const canonicalText = resolved.text
    const item = parseItemInfo(canonicalText)
    if (!item) return item
    if (this.serverId === 'international' && ['异界地图', '地图'].includes(item.category) && item.baseName === '地图') {
      const lines = canonicalText.split(/\r?\n/)
      const header = lines.slice(0, Math.max(0, lines.findIndex(line => /^-{3,}$/.test(line.trim()))))
      item.baseName = header.filter(line => line.trim() && !/[:：]/.test(line)).at(-1)?.trim() || item.baseName
    }
    if (this.serverId === 'international' && item.rarity === '魔法') {
      const lines = canonicalText.split(/\r?\n/)
      const separator = lines.findIndex(line => /^-{3,}$/.test(line.trim()))
      const names = lines.slice(0, separator).filter(line => line.trim() && !/[:：]/.test(line))
      // 独立底材行已由身份解析确认，不能再次把底材自身的词剥成词缀。
      item.baseName = resolved.magicBaseName || this.dictionary.resolveMagicBaseName(
        item.baseName || item.name, names.length > 1 ? [] : lines, this.baseNames())
    }
    item.originalText = originalText
    item.canonicalText = canonicalText
    item.modTextAliases = {}
    if (this.serverId === 'international') {
      for (const modifier of item.modifiers || []) {
        modifier.textAliases = this.dictionary.aliasesFor(modifier.text)
        const originalName = modifier.name
        try {
          modifier.name = this.dictionary.toEnglish(modifier.name)
        } catch (error) {
          // 名称不是效果身份；同名翻译保留原文，不能任取候选影响匹配。
          if (error.code !== 'LOCALIZATION_AMBIGUOUS') throw error
        }
        modifier.nameAliases = [...new Set([originalName, ...this.dictionary.aliasesFor(modifier.name)])]
      }
      for (const text of [...(item.explicitMods || []), ...(item.implicitMods || []), ...(item.craftedMods || [])]) {
        item.modTextAliases[text] = this.dictionary.aliasesFor(text)
      }
    }
    return applyCraftingDisplay(item, { source: originalText, lineMappings: resolved.lineMappings, dictionary: this.dictionary })
  }
}
