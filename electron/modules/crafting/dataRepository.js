import { createHash } from 'node:crypto'
import { access, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeCraftingDataset } from './model.js'
import { legalModifierTiers, modifierCanSpawn, validateBaseVariant } from './variantRules.js'

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
      counts: { bases: dataset.bases.length, modifiers: dataset.modifiers.length, crafts: dataset.crafts.length }
    }
  }

  listCategories() {
    const categories = new Map()
    this.getDataset().bases.forEach((base) => {
      if (!categories.has(base.category)) categories.set(base.category, new Map())
      const classes = categories.get(base.category)
      classes.set(base.itemClass, (classes.get(base.itemClass) ?? 0) + 1)
    })
    return [...categories].map(([name, classes]) => ({
      name,
      count: [...classes.values()].reduce((sum, count) => sum + count, 0),
      children: [...classes].map(([itemClass, count]) => ({ itemClass, name: ITEM_CLASS_LABELS[itemClass] || itemClass, count }))
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    })).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  }

  searchBases({ query = '', category = '', itemClass = '', page = 1, pageSize = 30 } = {}) {
    const needle = String(query).trim().toLocaleLowerCase('zh-CN')
    const size = Math.max(1, Math.min(100, Number(pageSize) || 30))
    const currentPage = Math.max(1, Number(page) || 1)
    const filtered = this.getDataset().bases.filter((base) => {
      return (!category || base.category === category) && (!itemClass || base.itemClass === itemClass) && (!needle || `${base.name} ${base.sourceId}`.toLocaleLowerCase('zh-CN').includes(needle))
    }).sort((a, b) => a.requiredLevel - b.requiredLevel || a.name.localeCompare(b.name, 'zh-CN'))
    const offset = (currentPage - 1) * size
    return { items: filtered.slice(offset, offset + size).map((base) => ({ ...base, imageUrl: `crafting-image://snapshot/${encodeURIComponent(base.imageId)}` })), total: filtered.length, page: currentPage, pageSize: size }
  }

  searchModifiers({ baseId, itemLevel = 100, variant = { kind: 'normal' }, query = '', sourcePolicy = 'either', affixType = '', page = 1, pageSize = 50 } = {}) {
    const base = this.getDataset().bases.find((entry) => entry.id === baseId)
    if (!base) throw new Error('底材不存在')
    const validity = validateBaseVariant(base, variant)
    if (!validity.valid) return { items: [], total: 0, errors: validity.errors }
    const needle = String(query).trim().toLocaleLowerCase('zh-CN')
    const allowedSources = sourcePolicy === 'either' ? new Set(['natural', 'crafted', 'fractured']) : new Set([sourcePolicy])
    const filtered = this.getDataset().modifiers.filter((modifier) => {
      return (!affixType || modifier.affixType === affixType) && allowedSources.has(modifier.source) && modifierCanSpawn(modifier, base, itemLevel, variant) && (!needle || `${modifier.name} ${modifier.tiers.map((tier) => tier.text).join(' ')}`.toLocaleLowerCase('zh-CN').includes(needle))
    }).map((modifier) => ({ ...modifier, tiers: legalModifierTiers(modifier, itemLevel) })).filter((modifier) => modifier.tiers.length)
    const size = Math.max(1, Math.min(100, Number(pageSize) || 50))
    const currentPage = Math.max(1, Number(page) || 1)
    const offset = (currentPage - 1) * size
    return { items: filtered.slice(offset, offset + size), total: filtered.length, page: currentPage, pageSize: size, errors: [] }
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
