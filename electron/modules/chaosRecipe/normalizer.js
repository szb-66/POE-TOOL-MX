/**
 * 国服仓库响应归一化。
 * ChaosRecipeEnhancer-inspired item-class discovery, reimplemented for the
 * Electron application and distributed under GPL-3.0-or-later.
 */

const SUPPORTED_TAB_TYPES = new Set([
  'normalstash',
  'premiumstash',
  'quadstash',
  'normal',
  'quad'
])

const CATEGORY_ALIASES = Object.freeze({
  helmet: 'helmet',
  helmets: 'helmet',
  helm: 'helmet',
  bodyarmour: 'bodyArmour',
  bodyarmours: 'bodyArmour',
  bodyarmor: 'bodyArmour',
  bodyarmors: 'bodyArmour',
  chest: 'bodyArmour',
  gloves: 'gloves',
  glove: 'gloves',
  boots: 'boots',
  boot: 'boots',
  belt: 'belt',
  belts: 'belt',
  amulet: 'amulet',
  amulets: 'amulet',
  ring: 'ring',
  rings: 'ring',
  onehandweapon: 'oneHandWeapon',
  onehandweapons: 'oneHandWeapon',
  shield: 'oneHandWeapon',
  shields: 'oneHandWeapon',
  twohandweapon: 'twoHandWeapon',
  twohandweapons: 'twoHandWeapon'
})

const ONE_HAND_MARKERS = [
  'onehand', 'claws', 'daggers', 'rune daggers', 'wands', 'sceptres',
  'shields', 'onehandswords', 'onehandaxes', 'onehandmaces', 'thrusting'
]
const TWO_HAND_MARKERS = [
  'twohand', 'bows', 'staves', 'warstaves', 'twohandswords',
  'twohandaxes', 'twohandmaces'
]

const cleanKey = (value) => String(value || '').replace(/[\s_.:/-]+/g, '').toLowerCase()
const finiteInteger = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.trunc(number) : fallback
}

function categoryCandidates(raw) {
  const values = [
    raw?.itemClass,
    raw?.category,
    raw?.extended?.category,
    ...(Array.isArray(raw?.extended?.subcategories) ? raw.extended.subcategories : [])
  ]
  return values.filter(Boolean)
}

function decodeIconResourcePath(icon) {
  const parts = String(icon || '').split('/').filter(Boolean)
  for (const part of parts) {
    if (part.length < 12) continue
    try {
      const normalized = part.replace(/-/g, '+').replace(/_/g, '/')
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
      const decoded = Buffer.from(padded, 'base64').toString('utf8')
      const match = decoded.match(/2DItems\/[^"\\}\]]+/i)
      if (match) return match[0]
    } catch {
      // Other URL segments are expected to be non-base64.
    }
  }
  return ''
}

function iconCategoryHint(raw) {
  const resource = decodeIconResourcePath(raw?.icon)
  if (!resource) return '<无法解码图标>'
  const segments = resource.split('/').filter(Boolean)
  if (segments[0]?.toLowerCase() === '2ditems') segments.shift()
  if (segments.length <= 1) return segments[0] || '<未知目录>'
  return segments.slice(0, Math.min(2, segments.length - 1)).join('/')
}

export function resolveRecipeItemClass(raw) {
  for (const candidate of categoryCandidates(raw)) {
    const alias = CATEGORY_ALIASES[cleanKey(candidate)]
    if (alias) return alias
  }

  const resource = decodeIconResourcePath(raw?.icon)
  const lowered = resource.toLowerCase()
  if (/\/helmets?\//.test(lowered)) return 'helmet'
  if (/\/bodyarmou?rs?\//.test(lowered)) return 'bodyArmour'
  if (/\/gloves?\//.test(lowered)) return 'gloves'
  if (/\/boots?\//.test(lowered)) return 'boots'
  if (/\/belts?\//.test(lowered)) return 'belt'
  if (/\/amulets?\//.test(lowered)) return 'amulet'
  if (/\/rings?\//.test(lowered)) return 'ring'
  if (lowered.includes('/quivers/')) return null
  if (TWO_HAND_MARKERS.some((marker) => lowered.includes(`/${marker.toLowerCase()}`))) return 'twoHandWeapon'
  if (ONE_HAND_MARKERS.some((marker) => lowered.includes(`/${marker.toLowerCase()}`))) return 'oneHandWeapon'

  const text = cleanKey(`${raw?.typeLine || ''} ${raw?.baseType || ''}`)
  if (CATEGORY_ALIASES[text]) return CATEGORY_ALIASES[text]
  return null
}

export function normalizeStashTab(raw, fallbackIndex = 0) {
  const type = String(raw?.type || raw?.stashType || raw?.layout || '').trim()
  const normalizedType = cleanKey(type)
  const isQuad = normalizedType.includes('quad') || Number(raw?.columns) === 24
  const supported = SUPPORTED_TAB_TYPES.has(normalizedType) ||
    normalizedType.includes('normalstash') ||
    normalizedType.includes('premiumstash') ||
    normalizedType.includes('quadstash')
  const folder = raw?.folder ? String(raw.folder) : ''
  const parent = raw?.parent ? String(raw.parent) : ''
  return {
    id: String(raw?.id ?? raw?.stashId ?? raw?.index ?? fallbackIndex),
    index: finiteInteger(raw?.index ?? raw?.i, fallbackIndex),
    name: String(raw?.name || raw?.n || `仓库页 ${fallbackIndex + 1}`),
    type: isQuad ? 'quad' : 'normal',
    columns: isQuad ? 24 : 12,
    rows: isQuad ? 24 : 12,
    supported: Boolean(supported),
    folder,
    parent,
    inFolder: Boolean(raw?.inFolder || folder || parent)
  }
}

export function normalizeStashTabs(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.stashes)
      ? payload.stashes
      : Array.isArray(payload?.tabs)
        ? payload.tabs
        : []
  const flattened = []
  for (const raw of list) {
    flattened.push(raw)
    if (!Array.isArray(raw?.children)) continue
    for (const child of raw.children) {
      flattened.push({
        ...child,
        parent: child?.parent || raw?.id || raw?.stashId
      })
    }
  }
  const seen = new Set()
  return flattened
    .map((tab, index) => normalizeStashTab(tab, index))
    .filter((tab) => {
      if (seen.has(tab.id)) return false
      seen.add(tab.id)
      return true
    })
}

export function normalizeStashItem(raw, tab) {
  const itemClass = resolveRecipeItemClass(raw)
  return {
    id: String(raw?.id || `${tab.id}:${raw?.x ?? 0}:${raw?.y ?? 0}:${raw?.typeLine || raw?.baseType || ''}`),
    tabId: tab.id,
    tabIndex: tab.index,
    tabName: tab.name,
    tabType: tab.type,
    inFolder: Boolean(tab.inFolder),
    x: finiteInteger(raw?.x),
    y: finiteInteger(raw?.y),
    width: Math.max(1, finiteInteger(raw?.w ?? raw?.width, 1)),
    height: Math.max(1, finiteInteger(raw?.h ?? raw?.height, 1)),
    itemLevel: finiteInteger(raw?.ilvl ?? raw?.itemLevel, -1),
    frameType: finiteInteger(raw?.frameType, -1),
    rarity: finiteInteger(raw?.frameType, -1) === 2 ? 'rare' : String(raw?.rarity || '').toLowerCase(),
    identified: Boolean(raw?.identified),
    itemClass,
    name: String(raw?.name || ''),
    baseType: String(raw?.baseType || raw?.typeLine || ''),
    typeLine: String(raw?.typeLine || raw?.baseType || ''),
    icon: String(raw?.icon || '')
  }
}

function looksLikeStashItem(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const hasCoordinates = Number.isFinite(Number(value.x)) && Number.isFinite(Number(value.y))
  const hasItemIdentity = value.id != null || value.icon || value.typeLine || value.baseType
  const hasItemMetadata = value.ilvl != null || value.itemLevel != null ||
    value.frameType != null || value.identified != null
  return hasCoordinates && hasItemIdentity && hasItemMetadata
}

function matchingChild(stash, tab) {
  if (!Array.isArray(stash?.children)) return null
  return stash.children.find((child) => String(child?.id ?? child?.stashId ?? '') === String(tab?.id)) || null
}

function knownItemArrays(payload, tab) {
  const stashChild = matchingChild(payload?.stash, tab)
  const dataStashChild = matchingChild(payload?.data?.stash, tab)
  const candidates = [
    ['items', payload?.items],
    ['stash.items', payload?.stash?.items],
    ['stash.children.<selected>.items', stashChild?.items],
    ['contents.items', payload?.contents?.items],
    ['data.items', payload?.data?.items],
    ['data.stash.items', payload?.data?.stash?.items],
    ['data.stash.children.<selected>.items', dataStashChild?.items],
    ['data.stash.entries', payload?.data?.stash?.entries],
    ['<root>', Array.isArray(payload) ? payload : null]
  ]
  return candidates
    .filter(([, value]) => Array.isArray(value))
    .map(([path, value]) => {
      const objectEntries = value.filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
      const items = objectEntries.filter(looksLikeStashItem)
      return {
        path,
        items,
        sourceLength: value.length,
        confidence: items.length / Math.max(1, objectEntries.length)
      }
    })
}

export function normalizeStashContents(payload, tabInput) {
  const root = payload?.stash || payload?.contents || payload || {}
  const tab = normalizeStashTab(
    tabInput || root?.stash || root?.metadata || payload?.tab || {},
    finiteInteger(tabInput?.index)
  )
  const discovered = knownItemArrays(payload, tab)
    .sort((left, right) =>
      right.items.length - left.items.length ||
      right.confidence - left.confidence ||
      left.path.length - right.path.length
    )
  const selected = discovered[0] || { path: '', items: [], sourceLength: 0 }
  const items = selected.items.map((item) => normalizeStashItem(item, tab))
  const unrecognizedHints = {}
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]
    if (item.itemClass ||
        !(item.frameType === 2 || item.rarity === 'rare') ||
        item.itemLevel < 60) continue
    const hint = iconCategoryHint(selected.items[index])
    unrecognizedHints[hint] = (unrecognizedHints[hint] || 0) + 1
  }
  return {
    tab,
    items,
    diagnostics: {
      itemArrayPaths: discovered.map((entry) => entry.path),
      selectedItemArrayPath: selected.path,
      sourceArrayLength: selected.sourceLength,
      normalizedItemCount: items.length,
      recognizedItemCount: items.filter((item) => item.itemClass).length,
      unrecognizedRareLevel60Hints: unrecognizedHints,
      sampleFieldNames: selected.items[0] ? Object.keys(selected.items[0]).sort() : []
    }
  }
}
