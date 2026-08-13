import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEASON_BASELINE } from '../../../shared/seasonBaseline.js'

export const ITEM_FOOTPRINT_SCHEMA_VERSION = 1
const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const bundledCatalogPath = path.resolve(moduleDir, '../../assets/item-footprints.json')

export function normalizeFootprintText(value) {
  return String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('zh-CN')
}

export function createFootprintKey(category, name) {
  const normalizedName = normalizeFootprintText(name)
  if (!normalizedName) return ''
  return `${normalizeFootprintText(category) || '*'}\u001f${normalizedName}`
}

function validFootprint(width, height) {
  const w = Number(width)
  const h = Number(height)
  return Number.isInteger(w) && Number.isInteger(h) && w >= 1 && w <= 12 && h >= 1 && h <= 12
    ? { width: w, height: h }
    : null
}

export function loadBundledFootprintCatalog(catalogPath = bundledCatalogPath, gameVersion = SEASON_BASELINE.patch) {
  try {
    const parsed = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
    if (parsed?.schemaVersion !== ITEM_FOOTPRINT_SCHEMA_VERSION ||
        parsed?.gameVersion !== gameVersion ||
        !Array.isArray(parsed.categories) || !Array.isArray(parsed.items)) {
      throw new Error('invalid item footprint catalog')
    }
    return {
      schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION,
      gameVersion: String(parsed.gameVersion || ''),
      generatedAt: String(parsed.generatedAt || ''),
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      audit: parsed.audit && typeof parsed.audit === 'object' ? parsed.audit : {},
      categories: parsed.categories.filter((entry) =>
        Array.isArray(entry?.aliases) && entry.aliases.some(normalizeFootprintText) &&
        validFootprint(entry.width, entry.height)
      ),
      items: parsed.items.filter((entry) =>
        (entry?.name || entry?.baseName) && validFootprint(entry.width, entry.height)
      )
    }
  } catch {
    return { schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION, categories: [], items: [] }
  }
}

export class ItemFootprintRegistry {
  constructor(catalog = loadBundledFootprintCatalog()) {
    this.items = new Map()
    this.categories = new Map()
    this.categoryGroups = new Map()
    this.keysByName = new Map()
    this.conflicts = new Set()
    this.loadCatalog(catalog)
  }

  loadCatalog(catalog) {
    if (catalog?.schemaVersion !== ITEM_FOOTPRINT_SCHEMA_VERSION) return
    for (const entry of catalog.categories || []) {
      const footprint = validFootprint(entry.width, entry.height)
      if (!footprint) continue
      const group = new Set((entry.aliases || []).map(normalizeFootprintText).filter(Boolean))
      for (const key of group) {
        this.categories.set(key, { key, ...footprint, source: 'bundled' })
        this.categoryGroups.set(key, group)
      }
    }
    for (const entry of catalog.items || []) {
      this.register({
        categories: [entry.category],
        names: [entry.baseName || entry.name],
        width: entry.width,
        height: entry.height,
        source: 'bundled'
      })
    }
  }

  register({ categories = [], names = [], width, height, source = 'stash-api' } = {}) {
    const footprint = validFootprint(width, height)
    if (!footprint) return false
    const categoryList = [...new Set((Array.isArray(categories) ? categories : [categories])
      .map(normalizeFootprintText).filter(Boolean))]
    const nameList = [...new Set((Array.isArray(names) ? names : [names])
      .map(normalizeFootprintText).filter(Boolean))]
    if (!nameList.length) return false
    const keysForName = new Map(nameList.map((name) => [name, new Set([
      ...(this.keysByName.get(name) || []),
      createFootprintKey('', name),
      ...categoryList.map((category) => createFootprintKey(category, name))
    ].filter(Boolean))]))
    const keys = [...new Set([...keysForName.values()].flatMap((values) => [...values]))]
    const hasConflict = keys.some((key) => {
      const existing = this.items.get(key)
      return this.conflicts.has(key) || (existing && (existing.width !== footprint.width || existing.height !== footprint.height))
    })
    if (hasConflict) {
      for (const key of keys) {
        this.items.delete(key)
        this.conflicts.add(key)
      }
      for (const [name, values] of keysForName) this.keysByName.set(name, values)
      const groups = categoryList.map((category) => this.categoryGroups.get(category)).filter(Boolean)
      for (const group of groups) for (const alias of group) this.categories.delete(alias)
      return true
    }
    for (const key of keys) this.items.set(key, { key, ...footprint, source })
    for (const [name, values] of keysForName) this.keysByName.set(name, values)
    return true
  }

  registerStashItem(raw = {}) {
    return this.register({
      categories: [
        raw.itemClass,
        raw.category,
        raw.extended?.category,
        ...(Array.isArray(raw.extended?.subcategories) ? raw.extended.subcategories : [])
      ],
      names: [raw.baseType, raw.typeLine],
      width: raw.w ?? raw.width,
      height: raw.h ?? raw.height,
      source: 'stash-api'
    })
  }

  snapshot() {
    return {
      schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION,
      items: Object.fromEntries([...this.items].map(([key, value]) => [key, { ...value }])),
      categories: Object.fromEntries([...this.categories].map(([key, value]) => [key, { ...value }]))
    }
  }
}

export const itemFootprintRegistry = new ItemFootprintRegistry()
