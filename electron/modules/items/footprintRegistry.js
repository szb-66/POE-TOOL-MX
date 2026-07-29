import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

export function loadBundledFootprintCatalog(catalogPath = bundledCatalogPath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
    if (parsed?.schemaVersion !== ITEM_FOOTPRINT_SCHEMA_VERSION ||
        !Array.isArray(parsed.categories) || !Array.isArray(parsed.items)) {
      throw new Error('invalid item footprint catalog')
    }
    return {
      schemaVersion: ITEM_FOOTPRINT_SCHEMA_VERSION,
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
    this.conflicts = new Set()
    this.loadCatalog(catalog)
  }

  loadCatalog(catalog) {
    if (catalog?.schemaVersion !== ITEM_FOOTPRINT_SCHEMA_VERSION) return
    for (const entry of catalog.categories || []) {
      const footprint = validFootprint(entry.width, entry.height)
      if (!footprint) continue
      for (const alias of entry.aliases || []) {
        const key = normalizeFootprintText(alias)
        if (key) this.categories.set(key, { key, ...footprint, source: 'bundled' })
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
    for (const name of nameList) {
      const keys = [createFootprintKey('', name), ...categoryList.map((category) => createFootprintKey(category, name))]
      for (const key of keys) {
        if (!key || this.conflicts.has(key)) continue
        const existing = this.items.get(key)
        if (existing && (existing.width !== footprint.width || existing.height !== footprint.height)) {
          this.items.delete(key)
          this.conflicts.add(key)
        } else {
          this.items.set(key, { key, ...footprint, source })
        }
      }
    }
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
