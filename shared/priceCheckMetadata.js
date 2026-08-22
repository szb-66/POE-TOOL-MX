export const PRICE_CHECK_STATE_VALUES = Object.freeze(['any', 'true', 'false'])

export const PRICE_CHECK_CLASSIC_INFLUENCES = Object.freeze([
  {
    key: 'shaper',
    label: '有塑界者影响效果',
    statId: 'pseudo.pseudo_has_shaper_influence',
    aliases: Object.freeze(['塑界之器', '塑界者物品'])
  },
  {
    key: 'elder',
    label: '有裂界者影响效果',
    statId: 'pseudo.pseudo_has_elder_influence',
    aliases: Object.freeze(['裂界之器', '裂界者物品'])
  },
  {
    key: 'crusader',
    label: '有圣战者影响效果',
    statId: 'pseudo.pseudo_has_crusader_influence',
    aliases: Object.freeze(['圣战之器', '圣战者物品'])
  },
  {
    key: 'redeemer',
    label: '有救赎者影响效果',
    statId: 'pseudo.pseudo_has_redeemer_influence',
    aliases: Object.freeze(['救赎之器', '救赎者物品'])
  },
  {
    key: 'hunter',
    label: '有狩猎者影响效果',
    statId: 'pseudo.pseudo_has_hunter_influence',
    aliases: Object.freeze(['狩猎之器', '狩猎者物品'])
  },
  {
    key: 'warlord',
    label: '有督军影响效果',
    statId: 'pseudo.pseudo_has_warlord_influence',
    aliases: Object.freeze(['督军之器', '督军物品'])
  }
].map((definition) => Object.freeze(definition)))

const PRICE_CHECK_CATEGORY_ENTRIES = Object.freeze([
  [['单手武器'], 'weapon.one', '单手武器'],
  [['单手近战武器'], 'weapon.onemelee', '单手近战武器'],
  [['双手近战武器'], 'weapon.twomelee', '双手近战武器'],
  [['弓'], 'weapon.bow', '弓'],
  [['爪'], 'weapon.claw', '爪'],
  [['匕首'], 'weapon.dagger', '匕首'],
  [['符文匕首'], 'weapon.runedagger', '符文匕首'],
  [['单手斧'], 'weapon.oneaxe', '单手斧'],
  [['单手剑'], 'weapon.onesword', '单手剑'],
  [['细剑'], 'weapon.rapier', '细剑'],
  [['单手锤'], 'weapon.onemace', '单手锤'],
  [['权杖'], 'weapon.sceptre', '权杖'],
  [['长杖'], 'weapon.staff', '长杖'],
  [['战杖'], 'weapon.warstaff', '战杖'],
  [['双手斧'], 'weapon.twoaxe', '双手斧'],
  [['双手锤'], 'weapon.twomace', '双手锤'],
  [['双手剑'], 'weapon.twosword', '双手剑'],
  [['法杖'], 'weapon.wand', '法杖'],
  [['钓鱼竿', '鱼竿'], 'weapon.rod', '钓鱼竿'],
  [['胸甲'], 'armour.chest', '胸甲'],
  [['鞋子', '长靴'], 'armour.boots', '鞋子'],
  [['手套'], 'armour.gloves', '手套'],
  [['头盔', '头部'], 'armour.helmet', '头盔'],
  [['盾'], 'armour.shield', '盾'],
  [['箭袋'], 'armour.quiver', '箭袋'],
  [['项链', '护身符'], 'accessory.amulet', '项链'],
  [['腰带'], 'accessory.belt', '腰带'],
  [['戒指'], 'accessory.ring', '戒指'],
  [['饰品'], 'accessory', '饰品'],
  [['技能宝石'], 'gem.activegem', '技能宝石'],
  [['辅助宝石'], 'gem.supportgem', '辅助宝石'],
  [['觉醒辅助宝石'], 'gem.supportgemplus', '觉醒辅助宝石'],
  [['珠宝'], 'jewel', '珠宝'],
  [['深渊珠宝'], 'jewel.abyss', '深渊珠宝'],
  [['星团珠宝'], 'jewel.cluster', '星团珠宝'],
  [['药剂', '生命药剂', '魔力药剂', '复合药剂', '混合药剂', '功能药剂'], 'flask', '药剂'],
  [['地图', '异界地图'], 'map', '地图'],
  [['海图'], 'chart', '海图'],
  [['地图碎片'], 'map.fragment', '地图碎片'],
  [['裂隙石'], 'map.breachstone', '裂隙石'],
  [['邀请', '邀请函'], 'map.invitation', '邀请'],
  [['圣甲虫'], 'map.scarab', '圣甲虫'],
  [['命运卡'], 'card', '命运卡'],
  [['通货'], 'currency', '通货'],
  [['酊剂'], 'tincture', '酊剂']
])

export const PRICE_CHECK_CATEGORIES = Object.freeze(Object.fromEntries(
  PRICE_CHECK_CATEGORY_ENTRIES.flatMap(([aliases, category, categoryLabel]) => (
    aliases.map((alias) => [alias, Object.freeze({ category, categoryLabel })])
  ))
))

export function resolvePriceCheckCategory(value) {
  const key = String(value || '').replace(/\s+/g, '').trim()
  const resolved = PRICE_CHECK_CATEGORIES[key]
  return resolved ? { ...resolved } : null
}

export const PRICE_CHECK_STATE_FILTERS = Object.freeze([
  { key: 'identified', officialKey: 'identified', label: '已鉴定' },
  { key: 'corrupted', officialKey: 'corrupted', label: '腐化' },
  { key: 'mirrored', officialKey: 'mirrored', label: '复制' },
  { key: 'fractured', officialKey: 'fractured_item', label: '分裂之物' },
  { key: 'split', officialKey: 'split', label: '分裂' },
  { key: 'mutated', officialKey: 'mutated', label: '秽生' },
  { key: 'synthesised', officialKey: 'synthesised_item', label: '忆境' },
  { key: 'searing', officialKey: 'searing_item', label: '焚界者' },
  { key: 'tangled', officialKey: 'tangled_item', label: '灭界者' },
  { key: 'crafted', officialKey: 'crafted', label: '工艺' },
  { key: 'veiled', officialKey: 'veiled', label: '影匿' }
])

export const PRICE_CHECK_STAT_TYPES = Object.freeze({
  pseudo: { label: '综合', token: 'pseudo' },
  explicit: { label: '外延', token: 'explicit' },
  implicit: { label: '基底', token: 'implicit' },
  enchant: { label: '附魔', token: 'enchant' },
  fractured: { label: '分裂', token: 'fractured' },
  crafted: { label: '工艺', token: 'crafted' },
  veiled: { label: '影匿', token: 'veiled' },
  scourge: { label: '异度天灾', token: 'scourge' },
  imbued: { label: '灌注', token: 'imbued' },
  delve: { label: '地心', token: 'delve' },
  sanctum: { label: '禁域', token: 'sanctum' },
  mercenary: { label: '佣兵', token: 'mercenary' },
  crucible: { label: '古神熔炉', token: 'crucible' },
  ultimatum: { label: '致命贪婪', token: 'ultimatum' }
})

export function createPriceCheckStateFilters(facts = {}) {
  return Object.fromEntries(PRICE_CHECK_STATE_FILTERS.map((definition) => [
    definition.key,
    definition.key === 'identified'
      ? (facts.identified === false ? 'false' : 'any')
      : (facts[definition.key] === true ? 'true' : 'any')
  ]))
}

export function sanitizePriceCheckStateFilters(value, fallbackFacts = {}) {
  const allowed = new Set(PRICE_CHECK_STATE_VALUES)
  const defaults = createPriceCheckStateFilters(fallbackFacts)
  return Object.fromEntries(PRICE_CHECK_STATE_FILTERS.map(({ key }) => [
    key,
    allowed.has(value?.[key]) ? value[key] : defaults[key]
  ]))
}
