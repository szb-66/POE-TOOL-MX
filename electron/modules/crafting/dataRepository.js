import { createHash } from 'node:crypto'
import { access, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeCraftingDataset } from './model.js'
import { craftedOptionMatchesBase, modifierMatchesBase, validateBaseVariant } from './variantRules.js'
import { MANUAL_SOURCE_GROUPS } from './manualCrafting.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
export const DEFAULT_BUILTIN_ROOT = path.resolve(dirname, '../../assets/crafting-data')

const ITEM_CLASS_LABELS = {
  Claw: '爪', Dagger: '匕首', RuneDagger: '符文匕首', Wand: '法杖',
  OneHandSword: '单手剑', ThrustingOneHandSword: '细剑', OneHandAxe: '单手斧',
  OneHandMace: '单手锤', Sceptre: '短杖', Bow: '弓', Staff: '长杖', Warstaff: '战杖',
  TwoHandSword: '双手剑', TwoHandAxe: '双手斧', TwoHandMace: '双手锤',
  Quiver: '箭袋', Shield: '盾牌', Gloves: '手套', Boots: '鞋子', BodyArmour: '胸甲',
  Helmet: '头盔', Amulet: '项链', Ring: '戒指', Belt: '腰带', Jewel: '珠宝', AbyssJewel: '深渊珠宝'
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
  constructor({ builtinRoot = DEFAULT_BUILTIN_ROOT, userDataRoot = null } = {}) {
    this.builtinRoot = path.resolve(builtinRoot)
    this.userDataRoot = userDataRoot ? path.resolve(userDataRoot) : null
    this.active = null
    this.lastError = null
  }

  async initialize() {
    if (this.userDataRoot) {
      try {
        const pointer = JSON.parse(await readFile(path.join(this.userDataRoot, 'active.json'), 'utf8'))
        const candidate = path.resolve(this.userDataRoot, pointer.directory)
        if (!candidate.startsWith(`${this.userDataRoot}${path.sep}`)) throw new Error('活动数据目录越界')
        this.active = await loadDatasetRoot(candidate)
        return this.getStatus()
      } catch (error) {
        this.lastError = error.code === 'ENOENT' ? null : error.message
      }
    }
    this.active = await loadDatasetRoot(this.builtinRoot)
    return this.getStatus()
  }

  ensureReady() {
    if (!this.active) throw new Error('做装数据尚未初始化')
    return this.active
  }

  getDataset() {
    return this.ensureReady().dataset
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
    const needle = String(query).trim().toLocaleLowerCase('zh-CN')
    const size = Math.max(1, Math.min(100, Number(pageSize) || 30))
    const currentPage = Math.max(1, Number(page) || 1)
    const filtered = this.getDataset().bases.filter((base) => {
      return (!category || base.categoryPath[0] === category) && (!itemClass || base.modifierProfileId === itemClass) && (!needle || `${base.name} ${base.displayName} ${base.sourceId}`.toLocaleLowerCase('zh-CN').includes(needle))
    }).sort((a, b) => a.requiredLevel - b.requiredLevel || a.name.localeCompare(b.name, 'zh-CN'))
    const offset = (currentPage - 1) * size
    return { items: filtered.slice(offset, offset + size).map((base) => ({ ...base, imageUrl: `crafting-image://snapshot/${encodeURIComponent(base.imageId)}` })), total: filtered.length, page: currentPage, pageSize: size }
  }

  searchModifiers({ baseId, itemLevel = 100, variant = { kind: 'normal' }, query = '', affixType = '', page = 1, pageSize = 50 } = {}) {
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
      const searchable = `${family.name} ${entries.flatMap((entry) => [entry.name, ...entry.tiers.map((tier) => tier.text), ...entry.displayTags.map((tag) => tag.label)]).join(' ')}`.toLocaleLowerCase('zh-CN')
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

  searchModifierCatalog({ baseId, itemLevel = 100, query = '' } = {}) {
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
    const loaded = await loadDatasetRoot(stagingRoot)
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
