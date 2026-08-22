import { PRICE_CHECK_STATE_FILTERS } from '../../../shared/priceCheckMetadata.js'

const PREVIEW_OPTIONS = {
  status: 'available',
  listed: 'any',
  currency: 'chaos_divine',
  collapseListings: false,
  initialSelection: 'auto',
  manualDcRate: 168
}

const PREVIEW_STATE = {
  status: 'ready-to-query',
  league: '当前赛季（预览）',
  dcRate: { value: 168, source: 'manual' },
  model: {
    item: {
      name: '意志交锋',
      baseType: '黄金之面',
      category: '头盔',
      rarity: '传奇',
      itemLevel: 86
    },
    identity: {
      name: '意志交锋',
      type: '黄金之面',
      category: 'armour.helmet',
      categoryLabel: '头盔',
      nameEnabled: true
    },
    facts: {
      identified: true,
      corrupted: false,
      mirrored: false,
      fractured: true,
      split: false,
      mutated: false,
      synthesised: false,
      searing: false,
      tangled: false,
      crafted: true,
      veiled: false
    },
    stateFilters: Object.fromEntries(PRICE_CHECK_STATE_FILTERS.map(({ key }) => [key, 'any'])),
    properties: [
      { id: 'armour', label: '护甲', enabled: true, min: 320 },
      { id: 'energyShield', label: '能量护盾', enabled: false, min: 65 }
    ],
    stats: [
      {
        key: 'explicit:preview-life',
        id: 'explicit.stat_preview_life',
        type: 'explicit',
        text: '+# 最大生命',
        tags: ['生命'],
        tier: 1,
        enabled: true,
        min: 82
      },
      {
        key: 'explicit:preview-resistance',
        id: 'explicit.stat_preview_resistance',
        type: 'explicit',
        text: '+#% 火焰抗性',
        tags: ['火焰', '抗性'],
        tier: 2,
        enabled: false,
        min: 38
      }
    ],
    unknownStats: [],
    information: [
      { id: 'preview-item-level', label: '物品等级', value: 86, suffix: '' }
    ]
  },
  result: null,
  catalog: {
    provider: 'official',
    gameVersion: '预览样例',
    counts: { stats: 2 },
    degraded: false,
    loading: false
  }
}

export function createPriceCheckPreview() {
  return {
    state: structuredClone(PREVIEW_STATE),
    options: structuredClone(PREVIEW_OPTIONS)
  }
}
