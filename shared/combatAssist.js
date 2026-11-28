import { classifyArea } from './mapTrackerAreaCatalog.js'

const DEFAULT_RESOURCE = {
  enabled: false,
  point: { x: 0, y: 0 },
  threshold: 60,
  keys: [],
  recoveryMode: 'duration',
  recoveryCooldownMs: 500,
  instantIntervalMs: 100
}

const COMBAT_OVERRIDE_AREA_IDS = new Set(['Menagerie'])
const SAFE_ZONE_AREA_IDS = new Set(['SanctumFoyer'])

export function createDefaultCombatAssist() {
  return {
    autoPauseInSafeZone: true,
    potion: {
      scanIntervalMs: 100,
      maxTriggersPerSecond: 5,
      protectionCooldownMs: 1000,
      health: {
        ...DEFAULT_RESOURCE,
        point: { x: 0, y: 0 },
        threshold: 60,
        keys: []
      },
      mana: {
        ...DEFAULT_RESOURCE,
        point: { x: 0, y: 0 },
        threshold: 80,
        keys: [],
        recoveryCooldownMs: 2000
      }
    },
    portal: {
      openKey: '',
      clickPoint: { x: 0, y: 0 },
      waitMs: 500
    },
    loop: {
      tickMs: 50,
      items: []
    }
  }
}

function positiveNumber(value, fallback, minimum = 1) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback
}

function isConfiguredPoint(point) {
  const x = Number(point?.x)
  const y = Number(point?.y)
  return Number.isFinite(x) && Number.isFinite(y) && (x !== 0 || y !== 0)
}

function normalizeResource(raw, defaults) {
  return {
    ...defaults,
    ...(raw || {}),
    enabled: raw?.enabled === undefined ? defaults.enabled : Boolean(raw.enabled),
    point: {
      x: Number.isFinite(Number(raw?.point?.x)) ? Number(raw.point.x) : defaults.point.x,
      y: Number.isFinite(Number(raw?.point?.y)) ? Number(raw.point.y) : defaults.point.y
    },
    threshold: Math.min(255, Math.max(0, Number(raw?.threshold ?? defaults.threshold))),
    keys: Array.isArray(raw?.keys)
      ? raw.keys.map(key => String(key).trim()).filter(Boolean)
      : defaults.keys,
    recoveryMode: raw?.recoveryMode === 'instant' ? 'instant' : 'duration',
    recoveryCooldownMs: positiveNumber(raw?.recoveryCooldownMs, defaults.recoveryCooldownMs),
    instantIntervalMs: positiveNumber(raw?.instantIntervalMs, defaults.instantIntervalMs)
  }
}

export function normalizeCombatAssist(raw = {}) {
  const defaults = createDefaultCombatAssist()
  return {
    autoPauseInSafeZone: raw?.autoPauseInSafeZone === undefined
      ? defaults.autoPauseInSafeZone
      : Boolean(raw.autoPauseInSafeZone),
    potion: {
      scanIntervalMs: positiveNumber(raw.potion?.scanIntervalMs, defaults.potion.scanIntervalMs, 10),
      maxTriggersPerSecond: positiveNumber(raw.potion?.maxTriggersPerSecond, defaults.potion.maxTriggersPerSecond),
      protectionCooldownMs: positiveNumber(raw.potion?.protectionCooldownMs, defaults.potion.protectionCooldownMs),
      health: normalizeResource(raw.potion?.health, defaults.potion.health),
      mana: normalizeResource(raw.potion?.mana, defaults.potion.mana)
    },
    portal: {
      openKey: String(raw.portal?.openKey || defaults.portal.openKey).trim(),
      clickPoint: {
        x: Number.isFinite(Number(raw.portal?.clickPoint?.x)) ? Number(raw.portal.clickPoint.x) : defaults.portal.clickPoint.x,
        y: Number.isFinite(Number(raw.portal?.clickPoint?.y)) ? Number(raw.portal.clickPoint.y) : defaults.portal.clickPoint.y
      },
      waitMs: positiveNumber(raw.portal?.waitMs, defaults.portal.waitMs, 0)
    },
    loop: {
      tickMs: positiveNumber(raw.loop?.tickMs, defaults.loop.tickMs, 10),
      items: Array.isArray(raw.loop?.items)
        ? raw.loop.items
          .map(item => ({
            id: String(item?.id || '').trim(),
            key: String(item?.key || '').trim(),
            intervalMs: positiveNumber(item?.intervalMs, 1000, 100),
            enabled: item?.enabled === undefined ? true : Boolean(item.enabled)
          }))
          .filter(item => Boolean(item.key))
        : []
    }
  }
}

export function migrateLegacyCombatAssist(raw) {
  const normalized = normalizeCombatAssist(raw)
  // 旧版本生命/魔力默认开启；升级到统一启停后，仅关闭从未配置过坐标与按键的默认开启项，避免阻塞仅使用循环按键的用户。
  if (raw && typeof raw === 'object' && !Object.hasOwn(raw, 'autoPauseInSafeZone')) {
    for (const key of ['health', 'mana']) {
      const resource = normalized.potion[key]
      if (resource.enabled && !isConfiguredPoint(resource.point) && resource.keys.length === 0) {
        resource.enabled = false
      }
    }
  }
  return normalized
}

export function hasEnabledPotionResource(config = {}) {
  return Boolean(config?.potion?.health?.enabled || config?.potion?.mana?.enabled)
}

export function hasEnabledLoopItem(config = {}) {
  return (config?.loop?.items || []).some(item => Boolean(item?.enabled && String(item?.key || '').trim()))
}

export function isCombatSafeZoneArea(areaId) {
  const id = String(areaId || '').trim()
  if (!id) return false
  const compactId = id.replace(/\s+/g, '')
  if (COMBAT_OVERRIDE_AREA_IDS.has(id) || COMBAT_OVERRIDE_AREA_IDS.has(compactId)) return false
  if (SAFE_ZONE_AREA_IDS.has(id) || SAFE_ZONE_AREA_IDS.has(compactId)) return true
  const area = classifyArea(id)
  return area.type === 'town' || area.type === 'hideout'
}

export function createDefaultCombatAreaGate() {
  return {
    paused: false,
    reason: 'disabled',
    areaName: '',
    areaId: '',
    warning: ''
  }
}

export function evaluateCombatAreaGate({
  enabled = true,
  clientState = 'stopped',
  gameState = 'unknown',
  areaId = ''
} = {}) {
  if (!enabled) {
    return createDefaultCombatAreaGate()
  }
  if (!['started', 'resyncing'].includes(clientState)) {
    return {
      paused: false,
      reason: 'log-unavailable',
      areaName: '',
      areaId: '',
      warning: 'Client.txt 日志监听未就绪，安全区自动暂停暂未生效'
    }
  }
  if (gameState === 'disconnected') {
    return {
      paused: true,
      reason: 'disconnected',
      areaName: '',
      areaId: '',
      warning: ''
    }
  }
  if (gameState === 'loading') {
    const area = areaId ? classifyArea(areaId) : null
    return {
      paused: true,
      reason: 'loading',
      areaName: area?.areaName || '',
      areaId: area?.areaId || String(areaId || '').trim(),
      warning: ''
    }
  }
  if (gameState === 'in-game' && String(areaId || '').trim()) {
    const area = classifyArea(areaId)
    if (isCombatSafeZoneArea(area.areaId)) {
      return {
        paused: true,
        reason: 'safe-zone',
        areaName: area.areaName || '安全区',
        areaId: area.areaId,
        warning: ''
      }
    }
    return {
      paused: false,
      reason: 'combat-area',
      areaName: area.areaName || '',
      areaId: area.areaId,
      warning: ''
    }
  }
  return {
    paused: false,
    reason: 'area-unknown',
    areaName: '',
    areaId: '',
    warning: '尚未识别当前游戏区域，安全区自动暂停暂未生效'
  }
}

export function formatCombatAreaGateStatus(areaGate = {}) {
  if (!areaGate?.paused) return ''
  if (areaGate.reason === 'safe-zone') {
    return areaGate.areaName ? `安全区暂停（${areaGate.areaName}）` : '安全区暂停'
  }
  if (areaGate.reason === 'loading') return '过图加载中'
  if (areaGate.reason === 'disconnected') return '游戏已断开'
  return '已暂停'
}

export function validatePotionAssist(config = {}) {
  const errors = []
  const resources = [
    ['health', '生命药剂'],
    ['mana', '魔力药剂']
  ]
  const enabledResources = resources.filter(([key]) => config.potion?.[key]?.enabled)

  if (!enabledResources.length) errors.push('请至少启用一项生命或魔力检测')

  for (const [key, label] of enabledResources) {
    const resource = config.potion[key]
    if (!isConfiguredPoint(resource.point)) {
      errors.push(`${label}检测坐标未配置`)
    }
    if (!Array.isArray(resource.keys) || resource.keys.length === 0) {
      errors.push(`${label}按键序列未配置`)
    }
  }

  return { isValid: errors.length === 0, errors }
}

export function validateLoopAssist(config = {}) {
  const errors = []
  const enabledItems = (config.loop?.items || []).filter(item => item.enabled)
  if (!enabledItems.length) {
    errors.push('请至少添加一个启用的循环按键')
  } else if (enabledItems.some(item => !String(item.key || '').trim())) {
    errors.push('存在已启用但未设置按键的循环项')
  }
  return { isValid: errors.length === 0, errors }
}

export function validatePortalAssist(config = {}) {
  const errors = []
  if (!String(config.portal?.openKey || '').trim()) errors.push('回城按键未配置')
  if (!isConfiguredPoint(config.portal?.clickPoint)) errors.push('回城点击坐标未配置')
  return { isValid: errors.length === 0, errors }
}

export function validateCombatAssist(config = {}) {
  const errors = []
  const potionEnabled = hasEnabledPotionResource(config)
  const enabledLoopItems = (config.loop?.items || []).filter(item => item.enabled)
  const loopEnabled = enabledLoopItems.length > 0

  if (!potionEnabled && !loopEnabled) {
    errors.push('请至少开启一项生命/魔力药剂或循环按键')
    return { isValid: false, errors }
  }

  if (potionEnabled) {
    const potionValidation = validatePotionAssist(config)
    errors.push(...potionValidation.errors)
  }

  if (loopEnabled) {
    if (enabledLoopItems.some(item => !String(item.key || '').trim())) {
      errors.push('存在已启用但未设置按键的循环项')
    }
  }

  return { isValid: errors.length === 0, errors }
}
