import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { access, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeCraftingDataset } from './model.js'
import { craftedOptionMatchesBase, modifierMatchesBase, validateBaseVariant } from './variantRules.js'
import { MANUAL_SOURCE_GROUPS } from './manualCrafting.js'
import { getServer } from '../../../shared/serverMode.js'
import {
  canonicalAffixPattern,
  expandAffixPatternsForMatching,
  findEldritchPair,
  translateAffixPattern,
  translateEldritchTarget
} from './crossServerMap.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
export const DEFAULT_BUILTIN_ROOT = path.resolve(dirname, '../../assets/crafting-data')

const ITEM_CLASS_LABELS = {
  Claw: '爪', Dagger: '匕首', RuneDagger: '符文匕首', Wand: '法杖',
  OneHandSword: '单手剑', ThrustingOneHandSword: '细剑', OneHandAxe: '单手斧',
  OneHandMace: '单手锤', Sceptre: '短杖', Bow: '弓', Staff: '长杖', Warstaff: '战杖',
  TwoHandSword: '双手剑', TwoHandAxe: '双手斧', TwoHandMace: '双手锤',
  Quiver: '箭袋', Shield: '盾牌', Gloves: '手套', Boots: '鞋子', BodyArmour: '胸甲',
  Helmet: '头盔', Amulet: '项链', Ring: '戒指', Belt: '腰带', Jewel: '珠宝', AbyssJewel: '深渊珠宝',
  Flask: '药剂'
}

const PROFILE_LABELS = {
  Life_Flasks: '生命药剂 / 复合药剂',
  Mana_Flasks: '魔力药剂 / 复合药剂',
  Hybrid_Flasks: '复合药剂',
  Utility_Flasks: '功能药剂',
  Crimson_Jewel: '赤红珠宝',
  Viridian_Jewel: '翠绿珠宝',
  Cobalt_Jewel: '钴蓝珠宝',
  Prismatic_Jewel: '三相珠宝',
  Murderous_Eye_Jewel: '凶残之凝珠宝',
  Searching_Eye_Jewel: '锐利之凝珠宝',
  Hypnotic_Eye_Jewel: '安睡之凝珠宝',
  Ghastly_Eye_Jewel: '苍白之凝珠宝',
  Large_Cluster_Jewel: '大型星团珠宝',
  Medium_Cluster_Jewel: '中型星团珠宝',
  Small_Cluster_Jewel: '小型星团珠宝'
}

const AFFIX_SOURCE_LABELS = {
  natural: '基础',
  crafted: '工艺台',
  enchant: '附魔',
  clusterNotable: '星团核心',
  essence: '精华',
  delve: '地心探险',
  incursion: '穿越',
  veiled: '隐匿',
  shaper: '塑界者',
  elder: '裂界者',
  crusader: '圣战',
  redeemer: '救赎者',
  hunter: '狩猎者',
  warlord: '督军'
}

function effectPattern(text = '') {
  return String(text)
    .replace(/\(?[+\-]?\d+(?:\.\d+)?\s*[—–-]\s*[+\-]?\d+(?:\.\d+)?\)?/g, '#')
    .replace(/[+\-]?\d+(?:\.\d+)?/g, '#')
    .replace(/#+/g, '#')
    .trim()
}

function localizationFragments(value) {
  const lines = String(value ?? '').split(/\r?\n/)
  const fragments = []
  // 词库中的一个译文可能覆盖连续多行，并嵌在更长的词缀中。
  for (let start = 0; start < lines.length; start += 1) {
    for (let end = lines.length; end > start; end -= 1) {
      fragments.push({ start, end, text: lines.slice(start, end).join('\n') })
    }
  }
  return fragments
}

const AFFIX_ALIAS_PATTERN = /[\u3400-\u9fff]/u
const CLUSTER_NOTABLE_CN_PATTERN = /^其中\s*1\s*个增加的天赋为/
const CLUSTER_NOTABLE_EN_PATTERN = /^1 Added Passive Skill is /
const requireModule = createRequire(import.meta.url)
let affixLanguageAliasCache = null
let clusterNotableCatalogCache = null
let traditionalConverter = null

function affixAliasKey(value = '') {
  return String(value)
    .replace(/\(?[+\-]?\d+(?:\.\d+)?\s*[—–-]\s*[+\-]?\d+(?:\.\d+)?\)?/g, '#')
    .replace(/[+\-]?\d+(?:\.\d+)?/g, '#')
    .replace(/#+/g, '#')
    .replace(/\s+/g, '')
    .trim()
    .toLocaleLowerCase('zh-CN')
}

function simplifyChinese(value) {
  if (!AFFIX_ALIAS_PATTERN.test(value)) return value
  try {
    if (!traditionalConverter) traditionalConverter = requireModule('opencc-js').Converter({ from: 'tw', to: 'cn' })
    return traditionalConverter(String(value))
  } catch {
    return String(value)
  }
}

// 国际服的词缀目录是英文的。价格查询目录同时保存了同一效果的英文与简繁中文写法，
// 用它建立只读的搜索别名，词缀联想不再依赖当前是否成功应用了受管汉化。
function internationalAffixAliases() {
  if (affixLanguageAliasCache) return affixLanguageAliasCache
  const aliases = new Map()
  try {
    const catalog = JSON.parse(readFileSync(path.resolve(dirname, '../priceCheck/catalog.json'), 'utf8'))
    for (const stat of catalog.stats ?? []) {
      const texts = [stat.label, ...(Array.isArray(stat.matchers) ? stat.matchers : [])]
        .filter(value => typeof value === 'string' && value.trim())
      const localized = texts.filter(value => AFFIX_ALIAS_PATTERN.test(value))
      const canonical = texts.filter(value => !AFFIX_ALIAS_PATTERN.test(value))
      if (!localized.length || !canonical.length) continue
      for (const english of canonical) {
        const key = affixAliasKey(english)
        if (!key) continue
        const bucket = aliases.get(key) ?? new Set()
        localized.forEach(value => bucket.add(value.replace(/\s+/g, ' ').trim()))
        aliases.set(key, bucket)
      }
    }
  } catch {
    // 目录不可用时仍保留英文与当前汉化词库的搜索结果。
  }
  affixLanguageAliasCache = aliases
  return aliases
}

function clusterNotableCatalogEntries() {
  if (clusterNotableCatalogCache) return clusterNotableCatalogCache
  const entries = []
  const seen = new Set()
  let metadata = {}
  try {
    metadata = JSON.parse(readFileSync(path.resolve(dirname, '../../assets/cluster-notables.json'), 'utf8'))
  } catch {
    // 元数据不可用时退化为无等级与无前后缀限制。
  }
  try {
    const catalog = JSON.parse(readFileSync(path.resolve(dirname, '../priceCheck/catalog.json'), 'utf8'))
    for (const stat of catalog.stats ?? []) {
      const id = stat?.ids?.explicit
      const cn = typeof stat?.label === 'string' ? stat.label.replace(/\s+/g, ' ').trim() : ''
      if (!id || !CLUSTER_NOTABLE_CN_PATTERN.test(cn)) continue
      const matchers = (Array.isArray(stat.matchers) ? stat.matchers : [])
        .filter(value => typeof value === 'string' && value.trim())
        .map(value => value.replace(/\s+/g, ' ').trim())
      const refs = Array.isArray(stat.refs) ? stat.refs : []
      const en = (refs.find(value => CLUSTER_NOTABLE_EN_PATTERN.test(String(value || '')))
        || matchers.find(value => CLUSTER_NOTABLE_EN_PATTERN.test(value))
        || '').replace(/\s+/g, ' ').trim()
      if (!en || seen.has(en)) continue
      seen.add(en)
      const aliases = [...new Set([cn, en, ...matchers])]
      const meta = metadata[en] || {}
      const requiredLevel = Number.isInteger(meta.requiredLevel) && meta.requiredLevel > 0 ? meta.requiredLevel : null
      const affixType = meta.affixType === 'prefix' || meta.affixType === 'suffix' ? meta.affixType : ''
      entries.push({ id, cn, en, aliases, requiredLevel, affixType })
    }
  } catch {
    // 目录不可用时忽略星团核心天赋补充。
  }
  clusterNotableCatalogCache = entries
  return entries
}

function selectAffixSuggestions(rows, query, limit, { fallbackChinese = false } = {}) {
  const needle = String(query).trim().toLocaleLowerCase('zh-CN')
  const folded = value => value.replace(/的/g, '')
  const needles = [...new Set([needle, simplifyChinese(needle).toLocaleLowerCase('zh-CN'), folded(needle), folded(simplifyChinese(needle).toLocaleLowerCase('zh-CN'))])].filter(Boolean)
  const contains = values => !needle || needles.some(value => values.includes(value))
  const starts = values => Boolean(needle) && needles.some(value => values.startsWith(value))
  const displayName = row => fallbackChinese && row.fallbackDisplayName ? row.fallbackDisplayName : row.displayName
  const aliasRank = values => {
    if (!needle || !values) return Number.MAX_SAFE_INTEGER
    let best = Number.MAX_SAFE_INTEGER
    for (const value of needles) {
      const index = values.indexOf(value)
      if (index >= 0) best = Math.min(best, index)
    }
    return best === Number.MAX_SAFE_INTEGER ? best : 1 + best
  }
  const suggestions = rows.filter(row => contains(row.searchable) || contains(row.searchableFolded))
  for (const row of suggestions) {
    row.sortRank = starts(`${displayName(row)} ${row.effectPattern}`.toLocaleLowerCase('zh-CN')) ? 0 : aliasRank(row.aliasText)
  }
  suggestions.sort((a, b) => {
    return a.sortRank - b.sortRank || displayName(a).localeCompare(displayName(b), 'zh-CN') || a.applicableLabel.localeCompare(b.applicableLabel, 'zh-CN')
  })
  const size = Math.max(1, Math.min(100, Number(limit) || 50))
  const items = suggestions.slice(0, size).map(({ searchable, searchableFolded, aliasText, sortRank, fallbackDisplayName, ...row }) => {
    const localizedName = fallbackChinese && fallbackDisplayName ? fallbackDisplayName : row.displayName
    const displayPattern = fallbackChinese && fallbackDisplayName ? fallbackDisplayName : (row.displayPattern || '')
    return { ...row, displayName: localizedName, displayPattern }
  })
  return { items, total: suggestions.length }
}

async function exists(target) {
  try { await access(target); return true } catch { return false }
}

function verifyChecksum(raw) {
  if (!raw.manifest?.checksum || ['development', 'test'].includes(raw.manifest.checksum)) return true
  const input = JSON.stringify({ ...raw, manifest: { ...raw.manifest, checksum: '' } })
  return createHash('sha256').update(input).digest('hex') === raw.manifest.checksum
}

async function loadDatasetRoot(root) {
  const file = path.join(root, 'dataset.json')
  const raw = JSON.parse(await readFile(file, 'utf8'))
  if (!verifyChecksum(raw)) throw new Error('数据快照 checksum 不匹配')
  return { root, dataset: normalizeCraftingDataset(raw) }
}

export class CraftingDataRepository {
  constructor({ builtinRoot, userDataRoot = null, server = getServer(), localizationRuntime = null } = {}) {
    this.server = server
    this.localizationRuntime = localizationRuntime
    this.builtinRoot = path.resolve(builtinRoot || (server.id === 'international' ? `${DEFAULT_BUILTIN_ROOT}-international` : DEFAULT_BUILTIN_ROOT))
    this.userDataRoot = userDataRoot ? path.resolve(userDataRoot) : null
    this.active = null
    this.lastError = null
  }

  async load(root) {
    const loaded = await loadDatasetRoot(root)
    const manifest = loaded.dataset.manifest
    if (manifest.locale !== this.server.language || (manifest.server && manifest.server !== this.server.id)) throw new Error('制作数据服务器或语言不匹配')
    if (this.server.id === 'international' && (manifest.server !== 'international' || manifest.patch !== '3.30.0')) throw new Error('国际服制作数据缺少当前 3.30.0 基线')
    return loaded
  }

  async initialize() {
    if (this.userDataRoot) {
      try {
        const pointer = JSON.parse(await readFile(path.join(this.userDataRoot, 'active.json'), 'utf8'))
        const candidate = path.resolve(this.userDataRoot, pointer.directory)
        if (!candidate.startsWith(`${this.userDataRoot}${path.sep}`)) throw new Error('活动数据目录越界')
        this.active = await this.load(candidate)
        return this.getStatus()
      } catch (error) {
        this.lastError = error.code === 'ENOENT' ? null : error.message
      }
    }
    this.active = await this.load(this.builtinRoot)
    return this.getStatus()
  }

  ensureReady() {
    if (!this.active) throw new Error('做装数据尚未初始化')
    return this.active
  }

  getDataset() {
    return this.ensureReady().dataset
  }

  getDictionary() {
    return this.localizedDictionary || null
  }

  refreshLocalization() {
    if (this.server.id !== 'international' || !this.localizationRuntime) return null
    const localized = this.localizationRuntime.current()
    this.localizedDictionary = localized?.revision ? this.localizationRuntime.dictionary : null
  }

  searchText(...values) {
    const dictionary = this.getDictionary()
    if (!dictionary) return values.join(' ').toLocaleLowerCase('zh-CN')
    return values.flatMap(value => localizationFragments(value)
      .flatMap(({ text }) => [text, ...dictionary.aliasesFor(text)]))
      .join(' ').toLocaleLowerCase('zh-CN')
  }

  displayText(value) {
    const dictionary = this.getDictionary()
    if (!dictionary || !value) return value
    const result = []
    let nextLine = 0
    for (const { start, end, text } of localizationFragments(value)) {
      if (start !== nextLine) continue
      const translated = dictionary.localize(text) || text
      if (translated === text && end > start + 1) continue
      result.push(translated)
      nextLine = end
    }
    return result.join('\n')
  }

  affixAliasText(...values) {
    if (this.server.id !== 'international' || this.getDictionary()) return []
    const aliases = internationalAffixAliases()
    if (!aliases.size) return []
    const result = []
    for (const value of values) {
      const text = String(value ?? '')
      if (!text.trim()) continue
      const keys = text.includes('\n') ? [text, ...text.split(/\r?\n/)] : [text]
      for (const keyText of keys) {
        const bucket = aliases.get(affixAliasKey(keyText))
        if (bucket) result.push(...bucket)
      }
    }
    return [...new Set(result)]
  }

  affixAliasesForTexts(texts = []) {
    if (this.server.id !== 'international') return []
    const aliases = internationalAffixAliases()
    if (!aliases.size) return []
    return texts.map((text) => {
      const values = [...(aliases.get(affixAliasKey(String(text))) ?? [])]
      return {
        text: String(text),
        aliases: values,
        displayText: values.find((value) => value.includes('#')) || values[0] || String(text)
      }
    })
  }

  getStatus() {
    const { root, dataset } = this.ensureReady()
    return {
      ...dataset.manifest,
      source: root === this.builtinRoot ? 'builtin' : 'updated',
      stale: dataset.manifest.league === 'current' || dataset.manifest.league === 'Fixture',
      warning: this.lastError,
      counts: { bases: dataset.bases.length, modifiers: dataset.modifierFamilies.length, modifierEntries: dataset.modifiers.length, crafts: dataset.crafts.length, eldritchImplicitFamilies: dataset.eldritchImplicitFamilies.length }
    }
  }

  listCategories() {
    const roots = new Map()
    this.getDataset().bases.forEach((base) => {
      let level = roots
      base.categoryPath.forEach((segment, index) => {
        const isLeaf = index === base.categoryPath.length - 1
        const key = isLeaf ? `${segment}\u0000${base.modifierProfileId}` : segment
        const node = level.get(key) ?? { name: segment || ITEM_CLASS_LABELS[base.itemClass] || base.itemClass, count: 0, childrenMap: new Map() }
        node.count += 1
        if (isLeaf) node.itemClass = base.modifierProfileId
        level.set(key, node)
        level = node.childrenMap
      })
    })
    const serialize = (nodes) => [...nodes.values()].map((node) => ({
      name: node.name,
      count: node.count,
      ...(node.itemClass ? { itemClass: node.itemClass } : {}),
      ...(node.childrenMap.size ? { children: serialize(node.childrenMap) } : {})
    })).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    return serialize(roots)
  }

  searchBases({ query = '', category = '', itemClass = '', page = 1, pageSize = 30 } = {}) {
    this.refreshLocalization()
    const needle = String(query).trim().toLocaleLowerCase('zh-CN')
    const size = Math.max(1, Math.min(100, Number(pageSize) || 30))
    const currentPage = Math.max(1, Number(page) || 1)
    const filtered = this.getDataset().bases.filter((base) => {
      return (!category || base.categoryPath[0] === category) && (!itemClass || base.modifierProfileId === itemClass) && (!needle || this.searchText(base.name, base.displayName, base.sourceId).includes(needle))
    }).sort((a, b) => a.requiredLevel - b.requiredLevel || a.name.localeCompare(b.name, 'zh-CN'))
    const offset = (currentPage - 1) * size
    return { items: filtered.slice(offset, offset + size).map((base) => ({ ...base, displayName: this.displayText(base.name), canonicalName: base.name, imageUrl: `crafting-image://snapshot/${encodeURIComponent(base.imageId)}` })), total: filtered.length, page: currentPage, pageSize: size }
  }

  searchModifiers({ baseId, itemLevel = 100, variant = { kind: 'normal' }, query = '', affixType = '', page = 1, pageSize = 50 } = {}) {
    this.refreshLocalization()
    const base = this.getDataset().bases.find((entry) => entry.id === baseId)
    if (!base) throw new Error('底材不存在')
    const validity = validateBaseVariant(base, variant)
    if (!validity.valid) return { items: [], total: 0, errors: validity.errors }
    const needle = String(query).trim().toLocaleLowerCase('zh-CN')
    const filtered = this.getDataset().modifierFamilies.map((family) => {
      const entries = family.entries.filter((modifier) => ['natural', 'crafted', 'fractured'].includes(modifier.source) && modifierMatchesBase(modifier, base, variant)).map((modifier) => ({
        ...modifier,
        tiers: modifier.tiers.map((tier) => {
          const craftedClassAllowed = craftedOptionMatchesBase(tier, base)
          const available = tier.requiredLevel <= itemLevel && (tier.weight > 0 || (modifier.source === 'crafted' && craftedClassAllowed))
          return { ...tier, available, unavailableReason: available ? '' : tier.requiredLevel > itemLevel ? `需要物品等级 ${tier.requiredLevel}` : '不参与天然生成' }
        })
      }))
      const searchable = this.searchText(family.name, ...entries.flatMap((entry) => [entry.name, ...entry.tiers.map((tier) => tier.text), ...entry.displayTags.map((tag) => tag.label)]))
      const totalWeight = entries.flatMap((entry) => entry.tiers).filter((tier) => tier.available).reduce((sum, tier) => sum + tier.weight, 0)
      const hasAvailable = entries.some((entry) => entry.tiers.some((tier) => tier.available))
      const displayTags = [...new Map(entries.flatMap((entry) => [
        ...(entry.displayTags ?? []),
        ...entry.tiers.flatMap((tier) => tier.displayTags ?? [])
      ]).map((tag) => [tag.id, tag])).values()]
      return { ...family, entries, displayTags, subitemCount: entries.reduce((sum, entry) => sum + entry.tiers.length, 0), totalWeight, hasAvailable, searchable }
    }).filter((family) => family.entries.length && (!affixType || family.affixType === affixType) && (!needle || family.searchable.includes(needle)))
      .map(({ searchable, ...family }) => family)
    const size = Math.max(1, Math.min(100, Number(pageSize) || 50))
    const currentPage = Math.max(1, Number(page) || 1)
    const offset = (currentPage - 1) * size
    return { items: filtered.slice(offset, offset + size), total: filtered.length, page: currentPage, pageSize: size, errors: [] }
  }

  searchAffixSuggestions({ query = '', limit = 50 } = {}) {
    this.refreshLocalization()
    const dataset = this.getDataset()
    const dictionary = this.getDictionary()
    const fallbackChinese = this.server.id === 'international' && !dictionary && AFFIX_ALIAS_PATTERN.test(String(query))
    if (this.affixSuggestionsCache?.dataset === dataset && this.affixSuggestionsCache.dictionary === dictionary) {
      return selectAffixSuggestions(this.affixSuggestionsCache.rows, query, limit, { fallbackChinese })
    }
    const profileLabels = new Map()
    dataset.bases.forEach((base) => {
      const label = base.categoryPath?.join(' / ') || ITEM_CLASS_LABELS[base.itemClass] || base.itemClass
      if (!profileLabels.has(base.modifierProfileId)) profileLabels.set(base.modifierProfileId, label)
    })
    Object.entries(PROFILE_LABELS).forEach(([profile, label]) => profileLabels.set(profile, label))

    const rows = []
    const addRow = (modifier, tiers, source, suffix = '') => {
      if (!tiers.length) return
      const pattern = effectPattern(modifier.effectKey || modifier.name || tiers[0]?.text)
      if (!pattern) return
      const sourceDomain = modifier.influences?.[0] || source
      const applicableLabel = profileLabels.get(modifier.modifierProfileId)
        || modifier.itemClasses?.map((itemClass) => ITEM_CLASS_LABELS[itemClass] || itemClass).join(' / ')
        || modifier.modifierProfileId
      const normalizedTiers = [...new Map(tiers.map((tier) => [Number(tier.tier), {
        tier: Number(tier.tier),
        name: tier.name,
        requiredLevel: Number(tier.requiredLevel) || 1,
        text: tier.text
      }])).values()].filter((tier) => tier.tier > 0).sort((a, b) => a.tier - b.tier)
      const displayName = this.displayText(pattern)
      const patternAliases = this.affixAliasText(pattern)
      const fallbackDisplayName = patternAliases.find((alias) => alias.includes('#')) || patternAliases[0] || ''
      const aliasText = (patternAliases.length ? patternAliases : this.affixAliasText(...tiers.map((tier) => tier.text)))
        .join(' ').toLocaleLowerCase('zh-CN')
      const searchable = [
        ...[
          displayName, pattern, modifier.name,
          ...tiers.flatMap((tier) => [tier.name, String(tier.name || '').replace(/^T\d+\s*/, ''), tier.text]),
          ...(modifier.displayTags ?? []).map((tag) => tag.label),
          AFFIX_SOURCE_LABELS[sourceDomain] || sourceDomain, applicableLabel
        ].map(value => this.searchText(value)),
        aliasText
      ].join(' ')
      rows.push({
        searchable,
        searchableFolded: searchable.replace(/的/g, ''),
        aliasText,
        displayPattern: dictionary ? displayName : '',
        fallbackDisplayName,
        id: `${modifier.id}:${sourceDomain}${suffix}`,
        modifierId: modifier.id,
        displayName,
        effectPattern: pattern,
        canonicalPattern: canonicalAffixPattern(pattern),
        exampleText: this.displayText(tiers[0]?.text || pattern),
        canonicalDisplayName: pattern,
        affixType: modifier.affixType,
        source: sourceDomain,
        sourceLabel: AFFIX_SOURCE_LABELS[sourceDomain] || sourceDomain,
        profileId: modifier.modifierProfileId,
        applicableLabel,
        tiers: normalizedTiers
      })
    }

    dataset.modifiers.forEach((modifier) => {
      addRow(modifier, modifier.tiers ?? [], modifier.source)
      if (modifier.craftedOptions?.length) addRow(modifier, modifier.craftedOptions, 'crafted', ':crafted')
    })
    const hasClusterJewel = dataset.bases.some((base) => /Cluster_Jewel$/i.test(base.modifierProfileId || ''))
      || dataset.modifiers.some((modifier) => /Cluster_Jewel$/i.test(modifier.modifierProfileId || ''))
    if (hasClusterJewel) {
      const isInternational = this.server.id === 'international'
      for (const notable of clusterNotableCatalogEntries()) {
        const pattern = isInternational ? notable.en : notable.cn
        const localized = isInternational ? this.displayText(pattern) : notable.cn
        const displayName = isInternational && dictionary && !AFFIX_ALIAS_PATTERN.test(localized)
          ? notable.cn
          : localized
        const localizedAliases = notable.aliases.filter((alias) => AFFIX_ALIAS_PATTERN.test(alias))
        const patternAliases = isInternational && !dictionary ? localizedAliases : []
        const fallbackDisplayName = patternAliases.find((alias) => !alias.includes('【')) || patternAliases[0] || ''
        const aliasText = (isInternational ? localizedAliases : notable.aliases).join(' ').toLocaleLowerCase('zh-CN')
        const applicableLabel = '星团珠宝'
        const sourceLabel = AFFIX_SOURCE_LABELS.clusterNotable
        const searchable = [
          ...[displayName, pattern, notable.cn, notable.en, sourceLabel, applicableLabel].map((value) => this.searchText(value)),
          aliasText
        ].join(' ')
        const tiers = notable.requiredLevel
          ? [{ tier: 1, name: '核心天赋', requiredLevel: notable.requiredLevel, text: displayName }]
          : []
        rows.push({
          searchable,
          searchableFolded: searchable.replace(/的/g, ''),
          aliasText,
          displayPattern: dictionary ? displayName : '',
          fallbackDisplayName,
          id: `cluster-notable:${notable.id}`,
          modifierId: notable.id,
          displayName,
          effectPattern: pattern,
          canonicalPattern: notable.en,
          exampleText: displayName,
          canonicalDisplayName: pattern,
          affixType: notable.affixType,
          source: 'clusterNotable',
          sourceLabel,
          profileId: 'Cluster_Jewel',
          applicableLabel,
          tiers
        })
      }
    }
    const merged = new Map()
    rows.forEach((row) => {
      const tierSignature = row.tiers.map((tier) => `${tier.tier}:${tier.requiredLevel}:${effectPattern(tier.text)}`).join('|')
      const key = `${row.effectPattern}\u0000${row.affixType}\u0000${tierSignature}`
      const current = merged.get(key)
      if (!current) {
        merged.set(key, row)
        return
      }
      const labels = new Set(`${current.applicableLabel} / ${row.applicableLabel}`.split(' / ').filter(Boolean))
      current.applicableLabel = [...labels].join(' / ')
      current.sourceLabel = [...new Set(`${current.sourceLabel} / ${row.sourceLabel}`.split(' / ').filter(Boolean))].join(' / ')
      current.searchable += `\n${row.searchable}`
      current.searchableFolded += `\n${row.searchableFolded}`
      current.aliasText = `${current.aliasText} ${row.aliasText}`.trim()
      current.displayPattern ||= row.displayPattern
      current.fallbackDisplayName ||= row.fallbackDisplayName
    })
    this.affixSuggestionsCache = { dataset, dictionary, rows: [...merged.values()] }
    return selectAffixSuggestions(this.affixSuggestionsCache.rows, query, limit, { fallbackChinese })
  }

  resolveCatalogAffixType(condition) {
    if (!condition || typeof condition !== 'object') return null
    if (condition.affixType === 'prefix' || condition.affixType === 'suffix') return condition.affixType
    if (condition.kind !== 'catalog') return null
    try {
      this.refreshLocalization()
      const dataset = this.getDataset()
      const dictionary = this.getDictionary()
      if (this.catalogAffixTypeCache?.dataset !== dataset || this.catalogAffixTypeCache?.dictionary !== dictionary) {
        const index = new Map()
        const register = (rawPattern, affixType) => {
          const normalized = effectPattern(rawPattern)
          if (!normalized || (affixType !== 'prefix' && affixType !== 'suffix')) return
          let set = index.get(normalized)
          if (!set) {
            set = new Set()
            index.set(normalized, set)
          }
          set.add(affixType)
        }
        for (const modifier of dataset.modifiers ?? []) {
          const affixType = modifier?.affixType
          if (affixType !== 'prefix' && affixType !== 'suffix') continue
          const pattern = effectPattern(modifier.effectKey || modifier.name || modifier.tiers?.[0]?.text || '')
          if (!pattern) continue
          register(pattern, affixType)
          const canonical = canonicalAffixPattern(pattern)
          if (canonical) register(canonical, affixType)
          const displayed = this.displayText(pattern)
          if (displayed && displayed !== pattern) register(displayed, affixType)
        }
        for (const notable of clusterNotableCatalogEntries()) {
          if (!notable.affixType) continue
          register(notable.cn, notable.affixType)
          register(notable.en, notable.affixType)
        }
        this.catalogAffixTypeCache = { dataset, dictionary, index }
      }
      const types = new Set()
      for (const candidate of expandAffixPatternsForMatching(condition)) {
        const normalized = effectPattern(candidate)
        const found = this.catalogAffixTypeCache.index.get(normalized)
        if (found) found.forEach((entry) => types.add(entry))
      }
      return types.size === 1 ? [...types][0] : null
    } catch {
      return null
    }
  }

  searchEldritchImplicitSuggestions({ query = '', source = 'exarch', tier = 1, limit = 50 } = {}) {
    this.refreshLocalization()
    const dataset = this.getDataset()
    const selectedSource = source === 'eater' ? 'eater' : 'exarch'
    const selectedTier = Math.max(1, Math.min(4, Math.trunc(Number(tier)) || 1))
    const needle = String(query).trim().toLocaleLowerCase('zh-CN')
    const items = (dataset.eldritchImplicitFamilies ?? []).flatMap((family) => {
      if (family.source !== selectedSource) return []
      const tierEntry = family.tiers.find((entry) => entry.tier === selectedTier)
      if (!tierEntry) return []
      const itemClasses = family.itemClasses.filter((itemClass) => Number(tierEntry.weights?.[itemClass]) > 0)
      if (!itemClasses.length) return []
      const pattern = effectPattern(family.effectKey || tierEntry.text)
      const translatedName = this.displayText(pattern) || String(family.name || pattern.replaceAll('#', '')).replace(/\s+/g, ' ').trim()
      const fallbackName = this.getDictionary() ? '' : this.affixAliasText(pattern).find((alias) => alias.includes('#')) || ''
      const displayName = fallbackName || translatedName
      const displayPattern = this.getDictionary() ? translatedName : fallbackName
      const applicableLabel = itemClasses.map((itemClass) => ITEM_CLASS_LABELS[itemClass] || itemClass).join(' / ')
      const searchable = this.searchText(displayName, pattern, tierEntry.text, applicableLabel)
      const pair = findEldritchPair({ familyId: family.id, source: selectedSource, effectPattern: pattern })
      return needle && !searchable.includes(needle) ? [] : [{
        familyId: family.id,
        ...(pair ? { canonicalKey: pair.canonicalKey } : {}),
        displayName,
        displayPattern,
        effectPattern: pattern,
        exampleText: this.displayText(tierEntry.text),
        applicableLabel,
        source: selectedSource,
        tier: selectedTier
      }]
    })
    items.sort((a, b) => a.displayName.localeCompare(b.displayName, 'zh-CN') || a.applicableLabel.localeCompare(b.applicableLabel, 'zh-CN'))
    const size = Math.max(1, Math.min(100, Math.trunc(Number(limit)) || 50))
    return { items: items.slice(0, size), total: items.length }
  }

  resolveCrossServerConditions({ affixConditions = [], eldritchTargets = [] } = {}) {
    this.refreshLocalization()
    const targetLanguage = this.server.language
    const dictionary = this.getDictionary()
    const resolvedAffixConditions = (Array.isArray(affixConditions) ? affixConditions : []).map((condition) => {
      if (!condition || typeof condition !== 'object' || condition.kind !== 'catalog') return condition
      const sourcePattern = condition.canonicalPattern || condition.effectPattern || ''
      const canonical = canonicalAffixPattern(sourcePattern) || condition.canonicalPattern || ''
      const translatedPattern = translateAffixPattern(sourcePattern, targetLanguage)
      if (!translatedPattern) return condition
      let displayPattern = translatedPattern
      if (targetLanguage === 'en') {
        const existingPattern = String(condition.effectPattern || '').trim()
        const localizedByDictionary = dictionary ? this.displayText(translatedPattern) : ''
        if (localizedByDictionary && AFFIX_ALIAS_PATTERN.test(localizedByDictionary)) {
          displayPattern = localizedByDictionary
        } else if (AFFIX_ALIAS_PATTERN.test(existingPattern)) {
          displayPattern = existingPattern
        } else if (dictionary) {
          const fallbackZh = translateAffixPattern(translatedPattern, 'zh-CN')
          if (fallbackZh && AFFIX_ALIAS_PATTERN.test(fallbackZh)) displayPattern = fallbackZh
        }
      }
      const resolvedAffixType = condition.affixType === 'prefix' || condition.affixType === 'suffix'
        ? condition.affixType
        : this.resolveCatalogAffixType(condition)
      return {
        ...condition,
        ...(canonical ? { canonicalPattern: canonical } : {}),
        ...(resolvedAffixType ? { affixType: resolvedAffixType } : {}),
        effectPattern: displayPattern,
        keyword: displayPattern,
        displayName: displayPattern
      }
    })
    const resolvedEldritchTargets = (Array.isArray(eldritchTargets) ? eldritchTargets : []).map((target) => {
      if (!target || typeof target !== 'object') return target
      return translateEldritchTarget(
        target,
        targetLanguage,
        targetLanguage === 'en' && dictionary ? (pattern) => this.displayText(pattern) : null
      )
    })
    return { affixConditions: resolvedAffixConditions, eldritchTargets: resolvedEldritchTargets }
  }

  searchModifierCatalog({ baseId, itemLevel = 100, query = '' } = {}) {
    this.refreshLocalization()
    const dataset = this.getDataset()
    const base = dataset.bases.find((entry) => entry.id === baseId)
    if (!base) throw new Error('底材不存在')
    const needle = String(query).trim().toLocaleLowerCase('zh-CN')
    const influenceIds = new Set(MANUAL_SOURCE_GROUPS.slice(1, 7).map((entry) => entry.id))
    const sourceDomain = (modifier) => modifier.influences?.[0] || (modifier.source === 'natural' ? 'base' : modifier.source)
    const variantFor = (domain) => influenceIds.has(domain)
      ? { kind: 'influenced', influences: [domain], fracturedTierId: null, implicits: [] }
      : { kind: 'normal', influences: [], fracturedTierId: null, implicits: [] }
    const familyRows = []
    dataset.modifierFamilies.forEach((family) => {
      const byDomain = new Map()
      family.entries.forEach((modifier) => {
        const domain = sourceDomain(modifier)
        if (modifierMatchesBase(modifier, base, variantFor(domain))) {
          const tiers = modifier.tiers.map((tier) => {
            const essenceAvailable = domain === 'essence' && tier.sourceItem && itemLevel >= tier.sourceItem.minimumItemLevel
            const available = domain === 'essence' ? Boolean(essenceAvailable) : tier.requiredLevel <= itemLevel && tier.weight > 0
            const unavailableReason = available ? '' : domain === 'essence'
              ? !tier.sourceItem ? '精华来源无法识别' : `该精华要求装备物品等级至少为 ${tier.sourceItem.minimumItemLevel}`
              : tier.requiredLevel > itemLevel ? `需要物品等级 ${tier.requiredLevel}` : '不参与该来源的随机生成'
            return {
              ...tier, modifierId: modifier.id, goalId: modifier.goalId, modifierName: modifier.name,
              affixType: modifier.affixType, sourceDomain: domain, available, unavailableReason
            }
          })
          const entries = byDomain.get(domain) ?? []
          entries.push({ ...modifier, sourceDomain: domain, tiers })
          byDomain.set(domain, entries)
        }
        if (modifier.craftedOptions?.length) {
          const tiers = modifier.craftedOptions.map((tier) => {
            const available = tier.requiredLevel <= itemLevel && craftedOptionMatchesBase(tier, base)
            return {
              ...tier, modifierId: modifier.id, goalId: modifier.goalId, modifierName: modifier.name,
              affixType: modifier.affixType, sourceDomain: 'crafted', available,
              unavailableReason: available ? '' : tier.requiredLevel > itemLevel ? `需要物品等级 ${tier.requiredLevel}` : '该底材不能使用此工艺'
            }
          })
          const entries = byDomain.get('crafted') ?? []
          entries.push({ ...modifier, source: 'crafted', sourceDomain: 'crafted', tiers })
          byDomain.set('crafted', entries)
        }
      })
      byDomain.forEach((entries, domain) => {
        const searchable = `${family.name} ${entries.flatMap((entry) => [entry.name, ...entry.tiers.map((tier) => `${tier.name} ${tier.text}`)]).join(' ')}`.toLocaleLowerCase('zh-CN')
        const tiers = entries.flatMap((entry) => entry.tiers)
        const displayTags = [...new Map(entries.flatMap((entry) => [...(entry.displayTags ?? []), ...entry.tiers.flatMap((tier) => tier.displayTags ?? [])]).map((tag) => [tag.id, tag])).values()]
        familyRows.push({
          id: `${family.id}:${domain}`, familyId: family.id, name: family.name, groupId: family.groupId,
          affixType: family.affixType, sourceDomain: domain, entries, tiers, displayTags,
          subitemCount: tiers.length,
          availableCount: tiers.filter((tier) => tier.available).length,
          totalWeight: tiers.reduce((sum, tier) => sum + Number(tier.weight || 0), 0),
          searchable
        })
      })
    })
    const poolTotals = new Map()
    for (const family of familyRows) {
      const poolKey = `${family.sourceDomain}:${family.affixType}`
      poolTotals.set(poolKey, (poolTotals.get(poolKey) ?? 0) + family.totalWeight)
    }
    for (const family of familyRows) {
      const globalTotalWeight = poolTotals.get(`${family.sourceDomain}:${family.affixType}`) ?? 0
      family.globalTotalWeight = globalTotalWeight
      family.probability = globalTotalWeight > 0 ? family.totalWeight / globalTotalWeight : 0
      family.tiers = family.tiers.map((tier) => ({
        ...tier,
        probability: globalTotalWeight > 0 ? Number(tier.weight || 0) / globalTotalWeight : 0
      }))
      const tierById = new Map(family.tiers.map((tier) => [tier.id, tier]))
      family.entries = family.entries.map((entry) => ({
        ...entry,
        tiers: entry.tiers.map((tier) => tierById.get(tier.id) ?? tier)
      }))
    }
    const visibleFamilyRows = familyRows.filter((family) => !needle || family.searchable.includes(needle))
      .map(({ searchable, ...family }) => family)
    const groups = MANUAL_SOURCE_GROUPS.map((source) => {
      const families = visibleFamilyRows.filter((family) => family.sourceDomain === source.id)
      return {
        ...source,
        covered: families.length > 0,
        coverageMessage: families.length ? '' : '当前数据快照未覆盖此来源',
        prefix: families.filter((family) => family.affixType === 'prefix'),
        suffix: families.filter((family) => family.affixType === 'suffix')
      }
    })
    return { groups, sourceCoverage: Object.fromEntries(groups.map((group) => [group.id, group.covered])), totalFamilies: visibleFamilyRows.length }
  }

  resolveImage(imageId) {
    const { root, dataset } = this.ensureReady()
    const relative = dataset.images[imageId]
    if (!relative) return null
    const resolved = path.resolve(root, relative)
    return resolved.startsWith(`${root}${path.sep}`) ? resolved : null
  }

  async activateStaged(stagingRoot) {
    if (!this.userDataRoot) throw new Error('未配置用户数据目录')
    const loaded = await this.load(stagingRoot)
    await mkdir(this.userDataRoot, { recursive: true })
    const versionName = `version-${Date.now()}`
    const destination = path.join(this.userDataRoot, versionName)
    await rename(stagingRoot, destination)
    const previousDirectory = this.active?.root.startsWith(`${this.userDataRoot}${path.sep}`) ? path.basename(this.active.root) : null
    const pointer = { directory: versionName, previousDirectory, activatedAt: new Date().toISOString() }
    const temporaryPointer = path.join(this.userDataRoot, 'active.next.json')
    await writeFile(temporaryPointer, JSON.stringify(pointer, null, 2))
    await rename(temporaryPointer, path.join(this.userDataRoot, 'active.json'))
    this.active = { root: destination, dataset: loaded.dataset }
    this.lastError = null
    return this.getStatus()
  }

  async imageInfo(imageId) {
    const file = this.resolveImage(imageId)
    if (!file || !(await exists(file))) return null
    return { file, size: (await stat(file)).size }
  }
}
