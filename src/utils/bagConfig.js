import { normalizeOperationDelay } from './operationDelay.js'

export const BAG_BLACKLIST_FIELDS = Object.freeze(['name', 'baseName', 'category'])

export const BAG_BLACKLIST_FIELD_LABELS = Object.freeze({
  name: '物品名称',
  baseName: '基底名称',
  category: '物品类别'
})

const DEFAULT_REGION = Object.freeze({ left: 0, top: 0, right: 1920, bottom: 1080 })

function finiteNumber(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function normalizeBagBlacklist(rules = []) {
  if (!Array.isArray(rules)) return []
  return rules
    .map((rule) => ({
      field: String(rule?.field || ''),
      keyword: String(rule?.keyword || '').trim()
    }))
    .filter((rule) => BAG_BLACKLIST_FIELDS.includes(rule.field) && rule.keyword.length > 0)
}

export function createDefaultBagSettings() {
  return {
    moduleEnabled: false,
    templates: {
      stashTitle: '',
      inventoryTitle: '',
      stashRegion: { ...DEFAULT_REGION },
      inventoryRegion: { ...DEFAULT_REGION },
      stashCapture: null,
      inventoryCapture: null
    },
    matchThreshold: 0.8,
    blacklist: []
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
    templates: {
      stashTitle: String(raw.templates?.stashTitle || ''),
      inventoryTitle: String(raw.templates?.inventoryTitle || ''),
      stashRegion: normalizeRegion(raw.templates?.stashRegion),
      inventoryRegion: normalizeRegion(raw.templates?.inventoryRegion),
      stashCapture: normalizeCaptureMetadata(raw.templates?.stashCapture),
      inventoryCapture: normalizeCaptureMetadata(raw.templates?.inventoryCapture)
    },
    matchThreshold: Number.isFinite(threshold) ? Math.min(1, Math.max(0.1, threshold)) : defaults.matchThreshold,
    blacklist: normalizeBagBlacklist(raw.blacklist)
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
    const value = String(item[rule.field] || '').trim().toLocaleLowerCase()
    if (value && value.includes(rule.keyword.toLocaleLowerCase())) return rule
  }
  return null
}

export function buildBagRuntimeConfig(bagSettings, settings) {
  const bag = normalizeBagSettings(bagSettings)
  return {
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
      }
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

export function validateTemplateCaptureEnvironment(label, templatePath, region, metadata, displays = []) {
  if (!metadata) return templatePath ? { error: '', warning: `${label}使用手动上传模板，无法校验采集显示环境` } : { error: '', warning: '' }
  const display = displays.find((item) => String(item.id) === String(metadata.displayId))
  if (!display) return { error: `${label}的采集显示器已不存在，请重新框选`, warning: '' }
  const physicalSize = display.physicalSize || display.displayPhysicalSize
  if (Number(display.scaleFactor) !== Number(metadata.scaleFactor) ||
      Number(physicalSize?.width) !== Number(metadata.displayPhysicalSize.width) ||
      Number(physicalSize?.height) !== Number(metadata.displayPhysicalSize.height)) {
    return { error: `${label}的显示环境已变化，请重新框选`, warning: '' }
  }
  const regionWidth = Number(region?.right) - Number(region?.left)
  const regionHeight = Number(region?.bottom) - Number(region?.top)
  if (regionWidth < metadata.templateSize.width || regionHeight < metadata.templateSize.height) {
    return { error: `${label}的搜索区域小于模板尺寸，请重新框选或修正高级区域`, warning: '' }
  }
  return { error: '', warning: '' }
}
