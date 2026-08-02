export const STASH_TAB_TYPES = Object.freeze([
  { key: 'gems', label: '宝石仓库页', defaultName: '宝石' },
  { key: 'flasks', label: '药剂仓库页', defaultName: '药剂' },
  { key: 'delirium', label: '惊悸迷雾仓库页', defaultName: '惊悸迷雾' },
  { key: 'blightRavaged', label: '寄生菌潮仓库页', defaultName: '寄生菌潮' },
  { key: 'ultimatum', label: '致命贪婪仓库页', defaultName: '致命贪婪' },
  { key: 'delve', label: '地心探险仓库页', defaultName: '地心探险' },
  { key: 'unique', label: '传奇仓库页', defaultName: '传奇' },
  { key: 'fragments', label: '碎片仓库页', defaultName: '碎片' },
  { key: 'essences', label: '精华仓库页', defaultName: '精华' },
  { key: 'currency', label: '通货仓库页', defaultName: '通货' },
  { key: 'divination', label: '命运卡仓库页', defaultName: '命运卡' }
])

export const DEFAULT_STASH_TAB_NAMES = Object.freeze(Object.fromEntries(
  STASH_TAB_TYPES.map(({ key, defaultName }) => [key, defaultName])
))

export function normalizeStashTabRegion(region) {
  if (!region || typeof region !== 'object') return null
  const source = region.region || region.selectedRegion || region
  const x = Math.round(Number(source.x ?? source.left))
  const y = Math.round(Number(source.y ?? source.top))
  const width = Math.round(Number(source.width ?? (Number(source.right) - x)))
  const height = Math.round(Number(source.height ?? (Number(source.bottom) - y)))
  if (![x, y, width, height].every(Number.isFinite) || width < 20 || height < 20) return null
  return {
    x, y, width, height,
    displayId: region.displayId == null ? null : String(region.displayId),
    scaleFactor: Number.isFinite(Number(region.scaleFactor)) ? Number(region.scaleFactor) : 1,
    displayPhysicalBounds: region.displayPhysicalBounds && typeof region.displayPhysicalBounds === 'object'
      ? { ...region.displayPhysicalBounds }
      : null,
    capturedAt: String(region.capturedAt || '')
  }
}

export function createDefaultStashTabSelection() {
  return {
    enabled: false,
    rootRegion: null,
    hasScrollbar: false,
    names: { ...DEFAULT_STASH_TAB_NAMES }
  }
}

export function normalizeStashTabSelection(value) {
  const source = value && typeof value === 'object' ? value : {}
  const sourceNames = source.names && typeof source.names === 'object' ? source.names : {}
  const names = {}
  for (const definition of STASH_TAB_TYPES) {
    const candidate = sourceNames[definition.key]
    names[definition.key] = typeof candidate === 'string' && candidate.trim()
      ? candidate.trim()
      : definition.defaultName
  }
  return {
    enabled: Boolean(source.enabled),
    rootRegion: normalizeStashTabRegion(source.rootRegion),
    hasScrollbar: Boolean(source.hasScrollbar),
    names
  }
}

export function validateStashTabSelection(value) {
  const config = normalizeStashTabSelection(value)
  if (!config.enabled) return { valid: true, config }
  if (!config.rootRegion) return { valid: false, config, error: '请先框选根目录仓库列表区域' }
  if (!config.names.currency) return { valid: false, config, error: '请填写通货仓库页的实际名称' }
  return { valid: true, config }
}
