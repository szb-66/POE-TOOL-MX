export const MAP_BASE_STATS = {
  '物品数量': 'quantity',
  '物品稀有度': 'rarity',
  '怪物群大小': 'packSize',
  '更多地图': 'moreMaps',
  '更多圣甲虫': 'moreScarabs',
  '更多通货': 'moreCurrency'
}

const COMMON_MIGRATIONS = {
  quantity: ['quantity', 'quantityNormal', 'quantityT17'],
  rarity: ['rarity', 'rarityNormal', 'rarityT17'],
  packSize: ['packSize', 'packSizeNormal', 'packSizeT17']
}

const SPECIAL_KEYS = ['moreMaps', 'moreScarabs', 'moreCurrency']

function normalizeStat(value) {
  return {
    enabled: Boolean(value?.enabled),
    value: Number.isFinite(Number(value?.value)) ? Number(value.value) : 0
  }
}

function migrateStats(stats = {}) {
  const migrated = {}

  for (const [target, candidates] of Object.entries(COMMON_MIGRATIONS)) {
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
    migrated[key] = normalizeStat(stats[key])
  }

  return migrated
}

export function createDefaultMapConfig() {
  return {
    method: 'alchemy',
    vaal: { enabled: true, checkAfter: false },
    autoStash: true,
    grid: { startX: 0, startY: 0, offsetX: 0, offsetY: 0, rows: 5, cols: 12 },
    match: {
      blacklist: [],
      whitelist: [],
      selectedCount: 1,
      mandatoryStats: migrateStats(),
      optionalStats: migrateStats()
    }
  }
}

export function migrateMapConfig(rawMap = {}) {
  const defaults = createDefaultMapConfig()
  const match = rawMap.match || {}

  return {
    ...defaults,
    ...rawMap,
    vaal: { ...defaults.vaal, ...(rawMap.vaal || {}) },
    grid: { ...defaults.grid, ...(rawMap.grid || {}) },
    match: {
      ...defaults.match,
      ...match,
      blacklist: Array.isArray(match.blacklist) ? match.blacklist : [],
      whitelist: Array.isArray(match.whitelist) ? match.whitelist : [],
      selectedCount: Math.max(1, Number(match.selectedCount) || 1),
      mandatoryStats: migrateStats(match.mandatoryStats),
      optionalStats: migrateStats(match.optionalStats)
    },
    strategy: undefined,
    tiers: undefined
  }
}

export function cleanMigratedMapConfig(rawMap = {}) {
  const migrated = migrateMapConfig(rawMap)
  delete migrated.strategy
  delete migrated.tiers
  return migrated
}
