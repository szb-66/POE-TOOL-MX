const DEFAULT_RESOURCE = {
  enabled: true,
  point: { x: 0, y: 0 },
  threshold: 60,
  keys: [],
  recoveryMode: 'duration',
  recoveryCooldownMs: 500,
  instantIntervalMs: 100
}

export function createDefaultCombatAssist() {
  return {
    potion: {
      scanIntervalMs: 100,
      maxTriggersPerSecond: 5,
      protectionCooldownMs: 1000,
      health: {
        ...DEFAULT_RESOURCE,
        point: { x: 200, y: 1850 },
        threshold: 60,
        keys: ['1', '2', '3', '4', '5', 'w']
      },
      mana: {
        ...DEFAULT_RESOURCE,
        point: { x: 3622, y: 1944 },
        threshold: 80,
        keys: ['5'],
        recoveryCooldownMs: 2000
      }
    },
    portal: {
      openKey: 'Numpad1',
      clickPoint: { x: 1908, y: 890 },
      waitMs: 500
    }
  }
}

function positiveNumber(value, fallback, minimum = 1) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback
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
    }
  }
}

export function validateCombatAssist(config = {}) {
  const errors = []
  const resources = [
    ['health', '生命药剂'],
    ['mana', '魔力药剂']
  ]
  const enabledResources = resources.filter(([key]) => config.potion?.[key]?.enabled)

  if (!enabledResources.length) errors.push('请至少启用一项生命或魔力检测')

  for (const [key, label] of enabledResources) {
    const resource = config.potion[key]
    if (!resource.point || (Number(resource.point.x) === 0 && Number(resource.point.y) === 0)) {
      errors.push(`${label}检测坐标未配置`)
    }
    if (!Array.isArray(resource.keys) || resource.keys.length === 0) {
      errors.push(`${label}按键序列未配置`)
    }
  }

  return { isValid: errors.length === 0, errors }
}

