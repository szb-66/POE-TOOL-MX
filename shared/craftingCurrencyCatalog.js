export const CRAFTING_CURRENCY_CATALOG = Object.freeze([
  { key: 'wisdom', name: '知识卷轴', tradeId: 'wisdom', iconFile: 'wisdom.png' },
  { key: 'transmutation', name: '蜕变石', tradeId: 'transmute', iconFile: 'transmutation.png' },
  { key: 'alteration', name: '改造石', tradeId: 'alt', iconFile: 'alteration.png' },
  { key: 'augmentation', name: '增幅石', tradeId: 'aug', iconFile: 'augmentation.png' },
  { key: 'regal', name: '富豪石', tradeId: 'regal', iconFile: 'regal.png' },
  { key: 'alchemy', name: '点金石', tradeId: 'alch', iconFile: 'alchemy.png' },
  { key: 'binding', name: '高阶点金石', tradeId: 'orb-of-binding', iconFile: 'binding.png' },
  { key: 'scouring', name: '重铸石', tradeId: 'scour', iconFile: 'scouring.png' },
  { key: 'chaos', name: '混沌石', tradeId: 'chaos', iconFile: 'chaos.png' },
  { key: 'exalted', name: '崇高石', tradeId: 'exalted', iconFile: 'exalted.png' },
  { key: 'jewellers', name: '工匠石', tradeId: 'jewellers', iconFile: 'jewellers.png' },
  { key: 'fusing', name: '链结石', tradeId: 'fusing', iconFile: 'fusing.png' },
  { key: 'chromic', name: '幻色石', tradeId: 'chrome', iconFile: 'chromic.png' },
  { key: 'vaal', name: '瓦尔宝珠', tradeId: 'vaal', iconFile: 'vaal.png' },
  { key: 'lesser-eldritch-ember', name: '次级古灵余烬', tradeId: 'lesser-eldritch-ember', iconFile: 'lesser-eldritch-ember.png' },
  { key: 'greater-eldritch-ember', name: '高级古灵余烬', tradeId: 'greater-eldritch-ember', iconFile: 'greater-eldritch-ember.png' },
  { key: 'grand-eldritch-ember', name: '上级古灵余烬', tradeId: 'grand-eldritch-ember', iconFile: 'grand-eldritch-ember.png' },
  { key: 'exceptional-eldritch-ember', name: '卓越古灵余烬', tradeId: 'exceptional-eldritch-ember', iconFile: 'exceptional-eldritch-ember.png' },
  { key: 'lesser-eldritch-ichor', name: '次级古灵溶液', tradeId: 'lesser-eldritch-ichor', iconFile: 'lesser-eldritch-ichor.png' },
  { key: 'greater-eldritch-ichor', name: '高级古灵溶液', tradeId: 'greater-eldritch-ichor', iconFile: 'greater-eldritch-ichor.png' },
  { key: 'grand-eldritch-ichor', name: '上级古灵溶液', tradeId: 'grand-eldritch-ichor', iconFile: 'grand-eldritch-ichor.png' },
  { key: 'exceptional-eldritch-ichor', name: '卓越古灵溶液', tradeId: 'exceptional-eldritch-ichor', iconFile: 'exceptional-eldritch-ichor.png' }
].map((entry, order) => Object.freeze({ ...entry, order })))

export const CRAFTING_CURRENCY_BY_KEY = new Map(
  CRAFTING_CURRENCY_CATALOG.map((entry) => [entry.key, entry])
)

export function normalizeCurrencyUsage(usage) {
  const input = usage && typeof usage === 'object' && !Array.isArray(usage) ? usage : {}
  return Object.fromEntries(CRAFTING_CURRENCY_CATALOG.flatMap(({ key }) => {
    const amount = input[key]
    return Number.isSafeInteger(amount) && amount > 0 ? [[key, amount]] : []
  }))
}
