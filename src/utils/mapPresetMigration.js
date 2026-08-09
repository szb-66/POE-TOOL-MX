export const MAP_BASE_STATS = {
  '物品数量': 'quantity',
  '物品稀有度': 'rarity',
  '怪物群大小': 'packSize',
  '更多地图': 'moreMaps',
  '更多圣甲虫': 'moreScarabs',
  '更多通货': 'moreCurrency'
}

export const CHART_BASE_STATS = {
  '物品数量': 'quantity',
  '物品稀有度': 'rarity',
  '怪物群大小': 'packSize',
  '亡者硫磺': 'deadmanSulphur'
}

const COMMON_MIGRATIONS = {
  quantity: ['quantity', 'quantityNormal', 'quantityT17'],
  rarity: ['rarity', 'rarityNormal', 'rarityT17'],
  packSize: ['packSize', 'packSizeNormal', 'packSizeT17']
}

const SPECIAL_KEYS = ['moreMaps', 'moreScarabs', 'moreCurrency']
const DEFAULT_GRID = { startX: 0, startY: 0, offsetX: 0, offsetY: 0, rows: 5, cols: 12 }

function normalizeStat(value) {
  return {
    enabled: Boolean(value?.enabled),
    value: Number.isFinite(Number(value?.value)) ? Number(value.value) : 0
  }
}

function migrateStats(stats = {}, keys = Object.values(MAP_BASE_STATS)) {
  const migrated = {}

  for (const [target, candidates] of Object.entries(COMMON_MIGRATIONS)) {
    if (!keys.includes(target)) continue
    const values = candidates.filter(key => stats[key]).map(key => normalizeStat(stats[key]))
    const enabledValues = values.filter(item => item.enabled)
    migrated[target] = {
      enabled: enabledValues.length > 0,
      value: enabledValues.length > 0
        ? Math.max(...enabledValues.map(item => item.value))
        : (values[0]?.value ?? 0)
    }
  }

  for (const key of SPECIAL_KEYS) {
    if (!keys.includes(key)) continue
    migrated[key] = normalizeStat(stats[key])
  }

  if (keys.includes('deadmanSulphur')) {
    migrated.deadmanSulphur = normalizeStat(stats.deadmanSulphur)
  }

  return migrated
}

function createRollingProfile(statKeys) {
  return {
    method: 'alchemy',
    vaal: { enabled: true, checkAfter: false },
    autoStash: true,
    match: {
      blacklist: [],
      whitelist: [],
      selectedCount: 1,
      mandatoryStats: migrateStats({}, statKeys),
      optionalStats: migrateStats({}, statKeys)
    }
  }
}

function migrateRollingProfile(rawProfile = {}, statKeys) {
  const defaults = createRollingProfile(statKeys)
  const match = rawProfile.match || {}
  return {
    ...defaults,
    ...rawProfile,
    vaal: { ...defaults.vaal, ...(rawProfile.vaal || {}) },
    match: {
      ...defaults.match,
      ...match,
      blacklist: Array.isArray(match.blacklist) ? match.blacklist : [],
      whitelist: Array.isArray(match.whitelist) ? match.whitelist : [],
      selectedCount: Math.max(1, Number(match.selectedCount) || 1),
      mandatoryStats: migrateStats(match.mandatoryStats, statKeys),
      optionalStats: migrateStats(match.optionalStats, statKeys)
    }
  }
}

export function createDefaultChartConfig() {
  return {
    ...createRollingProfile(Object.values(CHART_BASE_STATS)),
    grid: { ...DEFAULT_GRID }
  }
}

export function createDefaultMapConfig() {
  return {
    ...createRollingProfile(Object.values(MAP_BASE_STATS)),
    grid: { ...DEFAULT_GRID }
  }
}

export function migrateMapConfig(rawMap = {}) {
  const defaults = createDefaultMapConfig()
  const atlas = migrateRollingProfile(rawMap, Object.values(MAP_BASE_STATS))

  const migrated = {
    ...defaults,
    ...atlas,
    grid: { ...defaults.grid, ...(rawMap.grid || {}) },
    strategy: undefined,
    tiers: undefined
  }
  delete migrated.activeKind
  delete migrated.chart
  delete migrated.targetKind
  return migrated
}

export function migrateChartConfig(rawChart = {}, fallbackGrid = {}) {
  const defaults = createDefaultChartConfig()
  const chart = migrateRollingProfile(rawChart, Object.values(CHART_BASE_STATS))
  const migrated = {
    ...defaults,
    ...chart,
    grid: { ...defaults.grid, ...fallbackGrid, ...(rawChart.grid || {}) }
  }
  delete migrated.activeKind
  delete migrated.chart
  delete migrated.targetKind
  return migrated
}

export function cleanMigratedMapConfig(rawMap = {}) {
  const migrated = migrateMapConfig(rawMap)
  delete migrated.strategy
  delete migrated.tiers
  return migrated
}

export function cleanMigratedChartConfig(rawChart = {}, fallbackGrid = {}) {
  return migrateChartConfig(rawChart, fallbackGrid)
}

export function getActiveMapRollingConfig(rawMap = {}, rawChart = null, requestedKind = null) {
  if (rawMap.targetKind === 'chart' || rawMap.targetKind === 'atlas') return rawMap
  const targetKind = requestedKind || rawMap.activeKind
  if (targetKind === 'chart') {
    const chartSource = rawChart || rawMap.chart || {}
    return { ...cleanMigratedChartConfig(chartSource, rawMap.grid), targetKind: 'chart' }
  }
  return { ...cleanMigratedMapConfig(rawMap), targetKind: 'atlas' }
}
