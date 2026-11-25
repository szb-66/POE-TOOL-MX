import { createHash } from 'node:crypto'
import { createLocalizationDictionary, localizationStructureAliases, visibleText } from './text.js'
import { parseItemInfo } from '../item/parser.js'
import { applyCraftingDisplay } from '../item/craftingDisplay.js'
import { DEFAULT_VISCERA_NAME_TEMPLATES, visceraNameTemplates } from './viscera.js'
import { itemNamePrefixTemplates } from './itemNamePrefixes.js'
import { DEFAULT_ITEM_NAME_PREFIX_TEMPLATES, stripItemNameBasePrefixes } from '../../../shared/itemNamePrefixes.js'
import { resolveCatalogStat } from '../priceCheck/catalog.js'

const validEntry = entry => entry?.en && (!entry.sourceHash || entry.sourceHash === createHash('sha256').update(entry.en).digest('hex'))
const stripRangeAnnotation = value => String(value || '').replace(/(-?\d+(?:\.\d+)?)[（(](-?\d+(?:\.\d+)?)\s*[-–—]\s*(-?\d+(?:\.\d+)?)[）)]/g, '$1')
const statTypeForModifier = modifier => {
  const kind = String(modifier?.type || modifier?.kind || '').toLowerCase()
  if (kind.includes('fractured')) return 'fractured'
  if (kind.includes('crafted')) return 'crafted'
  if (kind.includes('enchant')) return 'enchant'
  if (kind.includes('implicit')) return 'implicit'
  return 'explicit'
}

// Providers must come from LocalizationService: downloaded candidates are never runtime mappings.
export class LocalizationRuntime {
  constructor({ serverId = 'cn', entries = () => [], revision = () => '', baseNames = () => [], catalog = () => null } = {}) {
    Object.assign(this, { serverId, entriesProvider: entries, revisionProvider: revision, baseNames, catalogProvider: catalog })
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
        if (entry.kind !== 'dat' || entry.field !== 'Name' || /^\[DO NOT USE\]/i.test(entry.en) ||
            !/(?:^|[/\\])baseitemtypes(?:\.[a-z0-9]+)?$/i.test(entry.table)) continue
        const canonical = visibleText(entry.en)
        if (!canonical) continue
        const isEssence = essencePattern.test(canonical)
        if (isEssence) canonicalEssenceNames.add(canonical)
        // The same localized text can also name a category or an achievement.
        // Only base-item rows can establish an alias for a copied base name.
        for (const alias of [canonical, visibleText(entry.cn), visibleText(entry.tw)].filter(Boolean)) {
          if (!names.has(alias)) names.set(alias, new Set())
          names.get(alias).add(canonical)
          if (isEssence) essenceNames.add(alias)
        }
      }
      this.value = {
        serverId: this.serverId,
        revision,
        structureAliases: localizationStructureAliases(this.dictionary),
        nameAliases: Object.fromEntries([...names].filter(([, candidates]) => candidates.size === 1).map(([alias, candidates]) => [alias, [...candidates][0]])),
        visceraNameTemplates: this.serverId === 'international'
          ? [...DEFAULT_VISCERA_NAME_TEMPLATES.map(({ grade, en }) => ({ grade, en })), ...visceraNameTemplates(entries)]
          : DEFAULT_VISCERA_NAME_TEMPLATES,
        itemNamePrefixTemplates: this.serverId === 'international'
          ? itemNamePrefixTemplates(entries)
          : DEFAULT_ITEM_NAME_PREFIX_TEMPLATES,
        canonicalEssenceNames: [...canonicalEssenceNames],
        // 同一译名对应多个精华时不能作为身份依据，否则预检会放行错误精华。
        essenceNames: [...essenceNames].filter(alias => names.get(alias)?.size === 1)
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
    const activeCatalog = typeof this.catalogProvider === 'function' ? this.catalogProvider() : this.catalogProvider
    const resolveStatAmbiguity = activeCatalog
      ? (candidates, { type = 'explicit' } = {}) => {
          const supported = candidates.filter(candidate => resolveCatalogStat(activeCatalog, stripRangeAnnotation(candidate), type).candidates.length > 0)
          return supported.length === 1 ? supported[0] : null
        }
      : null
    const resolved = this.serverId === 'international'
      ? this.dictionary.resolve(originalText, activeCatalog ? { catalog: activeCatalog, resolveStatAmbiguity } : {})
      : { text: originalText }
    const canonicalText = resolved.text
    const item = parseItemInfo(canonicalText)
    if (!item) return item
    if (this.serverId === 'international' && ['异界地图', '地图'].includes(item.category) && item.baseName === '地图') {
      const lines = canonicalText.split(/\r?\n/)
      const header = lines.slice(0, Math.max(0, lines.findIndex(line => /^-{3,}$/.test(line.trim()))))
      const mapHeader = header.filter(line => line.trim() && !/[:：]/.test(line)).at(-1)?.trim()
      item.baseName = (mapHeader && (stripItemNameBasePrefixes(mapHeader, { isMap: true }) || mapHeader)) || item.baseName
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
      const aliasesForType = (text, type) => this.dictionary.aliasesFor(
        text,
        resolveStatAmbiguity ? { resolveStatAmbiguity: candidates => resolveStatAmbiguity(candidates, { type }) } : {}
      )
      for (const modifier of item.modifiers || []) {
        modifier.textAliases = aliasesForType(modifier.text, statTypeForModifier(modifier))
        const originalName = modifier.name
        try {
          modifier.name = this.dictionary.toEnglish(modifier.name)
        } catch (error) {
          // 名称不是效果身份；同名翻译保留原文，不能任取候选影响匹配。
          if (error.code !== 'LOCALIZATION_AMBIGUOUS') throw error
        }
        modifier.nameAliases = [...new Set([originalName, ...this.dictionary.aliasesFor(modifier.name)])]
      }
      for (const [list, type] of [[item.explicitMods, 'explicit'], [item.implicitMods, 'implicit'], [item.craftedMods, 'crafted']]) {
        for (const text of list || []) {
          item.modTextAliases[text] = aliasesForType(text, type)
        }
      }
    }
    return applyCraftingDisplay(item, { source: originalText, lineMappings: resolved.lineMappings, dictionary: this.dictionary })
  }
}
