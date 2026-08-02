import { normalizeOperationDelay } from './operationDelay.js'
import { normalizeEmptySlotThreshold } from './inventorySettings.js'

export const BAG_BLACKLIST_FIELDS = Object.freeze(['name', 'baseName', 'category'])
export const BAG_BLACKLIST_MATCH_MODES = Object.freeze(['contains', 'exact'])

export const BAG_BLACKLIST_FIELD_LABELS = Object.freeze({
  name: '物品名称',
  baseName: '基底名称',
  category: '物品类别'
})

export const BAG_BLACKLIST_MATCH_MODE_LABELS = Object.freeze({
  contains: '模糊匹配',
  exact: '精确匹配'
})

const DEFAULT_REGION = Object.freeze({ left: 0, top: 0, right: 1920, bottom: 1080 })
export const INVENTORY_LAYOUT = Object.freeze({
  nativeColumns: 12,
  rows: 5,
  minExtraColumns: 1,
  maxExtraColumns: 6
})

function finiteNumber(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function normalizeBagBlacklist(rules = []) {
  if (!Array.isArray(rules)) return []
  return rules
    .map((rule) => ({
      field: String(rule?.field || ''),
      keyword: String(rule?.keyword || '').trim(),
      matchMode: BAG_BLACKLIST_MATCH_MODES.includes(rule?.matchMode) ? rule.matchMode : 'contains',
      enabled: rule?.enabled !== false
    }))
    .filter((rule) => BAG_BLACKLIST_FIELDS.includes(rule.field) && rule.keyword.length > 0)
}

export function normalizeInventoryLayout(layout = {}) {
  const rawColumns = Number(layout.extraColumns)
  const extraColumns = Number.isFinite(rawColumns)
    ? Math.min(INVENTORY_LAYOUT.maxExtraColumns, Math.max(INVENTORY_LAYOUT.minExtraColumns, Math.trunc(rawColumns)))
    : INVENTORY_LAYOUT.minExtraColumns
  const excludedSlots = []
  const seen = new Set()
  if (Array.isArray(layout.excludedSlots)) {
    for (const slot of layout.excludedSlots) {
      const column = Number(slot?.column)
      const row = Number(slot?.row)
      if (!Number.isInteger(column) || !Number.isInteger(row)) continue
      const validColumn = (column >= 0 && column < INVENTORY_LAYOUT.nativeColumns) ||
        (column <= -1 && column >= -INVENTORY_LAYOUT.maxExtraColumns)
      if (!validColumn || row < 0 || row >= INVENTORY_LAYOUT.rows) continue
      const key = `${column}:${row}`
      if (seen.has(key)) continue
      seen.add(key)
      excludedSlots.push({ column, row })
    }
  }
  return {
    extraEnabled: Boolean(layout.extraEnabled),
    extraColumns,
    excludedSlots
  }
}

export function createDefaultBagSettings() {
  return {
    moduleEnabled: false,
    immediateStash: true,
    showStashButtonOnlyWhenReady: true,
    templates: {
      stashTitle: '',
      inventoryTitle: '',
      stashRegion: { ...DEFAULT_REGION },
      inventoryRegion: { ...DEFAULT_REGION },
      stashCapture: null,
      inventoryCapture: null
    },
    matchThreshold: 0.8,
    blacklist: [],
    inventoryLayout: normalizeInventoryLayout()
  }
}

function normalizeRegion(region = {}) {
  return {
    left: finiteNumber(region.left, DEFAULT_REGION.left),
    top: finiteNumber(region.top, DEFAULT_REGION.top),
    right: finiteNumber(region.right, DEFAULT_REGION.right),
    bottom: finiteNumber(region.bottom, DEFAULT_REGION.bottom)
  }
}

function normalizeSize(size) {
  if (!size || typeof size !== 'object') return null
  const width = finiteNumber(size.width, 0)
  const height = finiteNumber(size.height, 0)
  return width > 0 && height > 0 ? { width, height } : null
}

export function normalizeCaptureMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return null
  const displayPhysicalSize = normalizeSize(metadata.displayPhysicalSize)
  const templateSize = normalizeSize(metadata.templateSize)
  const selectedRegion = metadata.selectedRegion ? normalizeRegion(metadata.selectedRegion) : null
  const scaleFactor = finiteNumber(metadata.scaleFactor, 0)
  if (!String(metadata.displayId ?? '') || !displayPhysicalSize || !templateSize || !selectedRegion || scaleFactor <= 0) return null
  return {
    displayId: String(metadata.displayId),
    scaleFactor,
    displayPhysicalSize,
    templateSize,
    selectedRegion,
    capturedAt: String(metadata.capturedAt || '')
  }
}

export function normalizeBagSettings(raw = {}) {
  const defaults = createDefaultBagSettings()
  const threshold = Number(raw.matchThreshold)
  return {
    moduleEnabled: Boolean(raw.moduleEnabled),
    immediateStash: raw.immediateStash !== false,
    showStashButtonOnlyWhenReady: raw.showStashButtonOnlyWhenReady !== false,
    templates: {
      stashTitle: String(raw.templates?.stashTitle || ''),
      inventoryTitle: String(raw.templates?.inventoryTitle || ''),
      stashRegion: normalizeRegion(raw.templates?.stashRegion),
      inventoryRegion: normalizeRegion(raw.templates?.inventoryRegion),
      stashCapture: normalizeCaptureMetadata(raw.templates?.stashCapture),
      inventoryCapture: normalizeCaptureMetadata(raw.templates?.inventoryCapture)
    },
    matchThreshold: Number.isFinite(threshold) ? Math.min(1, Math.max(0.1, threshold)) : defaults.matchThreshold,
    blacklist: normalizeBagBlacklist(raw.blacklist),
    inventoryLayout: normalizeInventoryLayout(raw.inventoryLayout)
  }
}

export function parseBagItemHeader(clipboardText) {
  const lines = String(clipboardText || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const categoryLine = lines.findIndex((line) => /^(物品类别|Item Class):/.test(line))
  const rarityLine = lines.findIndex((line) => /^(稀\s*有\s*度|Rarity):/.test(line))
  if (categoryLine < 0 || rarityLine < 0) return null

  const category = lines[categoryLine].replace(/^(物品类别|Item Class):\s*/, '').trim()
  const header = []
  for (let index = rarityLine + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line === '--------') break
    if (!line.includes(':')) header.push(line)
  }
  if (!category || header.length === 0) return null

  return {
    category,
    name: header[0],
    baseName: header[1] || ''
  }
}

export function findBagBlacklistMatch(item, rules = []) {
  if (!item) return null
  for (const rule of normalizeBagBlacklist(rules)) {
    if (!rule.enabled) continue
    const value = String(item[rule.field] || '').trim().toLocaleLowerCase()
    const keyword = rule.keyword.toLocaleLowerCase()
    if (value && (rule.matchMode === 'exact' ? value === keyword : value.includes(keyword))) return rule
  }
  return null
}

export function buildBagRuntimeConfig(bagSettings, settings) {
  const bag = normalizeBagSettings(bagSettings)
  return {
    immediateStash: bag.immediateStash,
    showStashButtonOnlyWhenReady: bag.showStashButtonOnlyWhenReady,
    templates: bag.templates,
    matchThreshold: bag.matchThreshold,
    blacklist: bag.blacklist,
    operationDelayMs: normalizeOperationDelay(settings?.operationDelayMs),
    inventory: {
      startPos: {
        x: finiteNumber(settings?.inventory?.startPos?.x, 2658),
        y: finiteNumber(settings?.inventory?.startPos?.y, 1199)
      },
      slotSize: {
        w: finiteNumber(settings?.inventory?.slotSize?.w, 100),
        h: finiteNumber(settings?.inventory?.slotSize?.h, 100)
      },
      emptySlotThreshold: normalizeEmptySlotThreshold(settings?.inventory?.emptySlotThreshold),
      layout: bag.inventoryLayout
    }
  }
}

export function validateBagRuntimeConfig(config) {
  if (!config.templates.stashTitle || !config.templates.inventoryTitle) return '请先配置仓库和背包标题模板'
  const regions = [config.templates.stashRegion, config.templates.inventoryRegion]
  if (regions.some((region) => region.right <= region.left || region.bottom <= region.top)) return '模板匹配区域无效'
  const gridValues = [config.inventory.startPos.x, config.inventory.startPos.y, config.inventory.slotSize.w, config.inventory.slotSize.h]
  if (gridValues.some((value) => !Number.isFinite(value))) return '背包网格配置无效'
  if (config.inventory.slotSize.w <= 0 || config.inventory.slotSize.h <= 0) return '背包单格宽高无效'
  return ''
}


export function captureKeyForTemplate(type) {
  if (type === 'stashTitle') return 'stashCapture'
  if (type === 'inventoryTitle') return 'inventoryCapture'
  throw new Error('不支持的模板目标')
}

function displayPhysicalSize(display) {
  return display?.physicalSize || display?.displayPhysicalSize
}

function hasCompatibleDisplayParameters(display, metadata) {
  const physicalSize = displayPhysicalSize(display)
  return Number(display?.scaleFactor) === Number(metadata.scaleFactor) &&
    Number(physicalSize?.width) === Number(metadata.displayPhysicalSize.width) &&
    Number(physicalSize?.height) === Number(metadata.displayPhysicalSize.height)
}

function displayContainsRegion(display, region) {
  const bounds = display?.physicalBounds || display?.displayPhysicalBounds
  if (!bounds) return null
  const left = Number(bounds.left ?? bounds.x)
  const top = Number(bounds.top ?? bounds.y)
  const right = Number(bounds.right ?? (left + Number(bounds.width)))
  const bottom = Number(bounds.bottom ?? (top + Number(bounds.height)))
  const edges = [left, top, right, bottom, region?.left, region?.top, region?.right, region?.bottom].map(Number)
  if (!edges.every(Number.isFinite)) return null
  return Number(region.left) >= left && Number(region.top) >= top &&
    Number(region.right) <= right && Number(region.bottom) <= bottom
}

function resolveCaptureDisplay(metadata, displays) {
  const compatible = displays.filter((display) => hasCompatibleDisplayParameters(display, metadata))
  const exact = compatible.find((display) => String(display.id) === String(metadata.displayId))
  if (exact && displayContainsRegion(exact, metadata.selectedRegion) !== false) return exact

  const containing = compatible.filter((display) => displayContainsRegion(display, metadata.selectedRegion) === true)
  if (containing.length === 1) return containing[0]
  if (compatible.length === 1 && displayContainsRegion(compatible[0], metadata.selectedRegion) === null) return compatible[0]
  return null
}

export function validateTemplateCaptureEnvironment(label, templatePath, region, metadata, displays = []) {
  if (!metadata) return templatePath ? { error: '', warning: `${label}使用手动上传模板，无法校验采集显示环境` } : { error: '', warning: '' }
  const exactIdExists = displays.some((item) => String(item.id) === String(metadata.displayId))
  const display = resolveCaptureDisplay(metadata, displays)
  if (!display) return {
    error: exactIdExists
      ? `${label}的显示环境已变化，请重新框选`
      : `${label}的采集显示器已不存在，请重新框选`,
    warning: ''
  }
  const regionWidth = Number(region?.right) - Number(region?.left)
  const regionHeight = Number(region?.bottom) - Number(region?.top)
  if (regionWidth < metadata.templateSize.width || regionHeight < metadata.templateSize.height) {
    return { error: `${label}的搜索区域小于模板尺寸，请重新框选或修正高级区域`, warning: '' }
  }
  return { error: '', warning: '' }
}
