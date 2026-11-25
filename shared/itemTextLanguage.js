import { canonicalAtlasMapClass } from './mapItemClasses.js'

const classes = Object.freeze({
  'Body Armours': '胸甲', Helmets: '头部', Gloves: '手套', Boots: '鞋子', Shields: '盾牌',
  Rings: '戒指', Amulets: '护身符', Belts: '腰带', Quivers: '箭袋',
  Claws: '爪', Daggers: '匕首', 'Rune Daggers': '符文匕首', Wands: '法杖',
  'One Hand Swords': '单手剑', 'Thrusting One Hand Swords': '细剑', 'One Hand Axes': '单手斧',
  'One Hand Maces': '单手锤', Sceptres: '权杖', Bows: '弓', Staves: '长杖', Warstaves: '战杖',
  'Two Hand Swords': '双手剑', 'Two Hand Axes': '双手斧', 'Two Hand Maces': '双手锤',
  'Fishing Rods': '钓竿', Maps: '异界地图', 'Map Fragments': '地图碎片',
  'Skill Gems': '技能宝石', 'Support Gems': '辅助宝石', 'Active Skill Gems': '技能宝石',
  'Stackable Currency': '通货', Currency: '通货', 'Divination Cards': '命运卡',
  'Life Flasks': '生命药剂', 'Mana Flasks': '魔力药剂', 'Hybrid Flasks': '复合药剂',
  'Utility Flasks': '功能药剂', 'Critical Utility Flasks': '暴击药剂', Tinctures: '酊剂', Jewels: '珠宝', 'Abyss Jewels': '深渊珠宝',
  Contracts: '契约', Blueprints: '蓝图', 'Heist Gear': '赏金猎人装备', 'Heist Tools': '赏金猎人工具',
  'Heist Cloaks': '赏金猎人披风', 'Heist Brooches': '赏金猎人胸针', Trinkets: '饰品',
  Charts: '海图', Chart: '海图', 'Expedition Logbooks': '探险日志',
  Breachstones: '裂隙之石', 'Quest Items': '任务物品', Viscera: '内脏'
})
const rarities = Object.freeze({ Normal: '普通', Magic: '魔法', Rare: '稀有', Unique: '传奇', Gem: '宝石', Currency: '通货', 'Divination Card': '命运卡', Quest: '任务' })
const labels = Object.freeze({
  Quality: '品质', 'Item Level': '物品等级', 'Item Tier': '物品阶级', 'Map Tier': '地图阶级', 'Area Level': '区域等级',
  'Monster Level': '怪物等级', 'Memory Strands': '回忆束丝', 'Talisman Tier': '魔符阶级',
  Limit: '限制', Radius: '范围', 'Corpse Level': '灵柩等级', 'Monster Category': '怪物类型',
  Sockets: '插槽', 'Item Quantity': '物品数量', 'Item Rarity': '物品稀有度', 'Monster Pack Size': '怪物群大小',
  Armour: '护甲', Evasion: '闪避值', 'Evasion Rating': '闪避值', 'Energy Shield': '能量护盾', Ward: '结界',
  'Physical Damage': '物理伤害', 'Elemental Damage': '元素伤害', 'Chaos Damage': '混沌伤害',
  'Critical Strike Chance': '攻击暴击率', 'Attacks per Second': '每秒攻击次数', 'Chance to Block': '格挡几率',
  'Block Chance': '格挡几率', 'Stack Size': '堆叠数量', Requirements: '需求', Level: '等级',
  Str: '力量', Dex: '敏捷', Int: '智慧', 'More Maps': '更多地图', 'More Scarabs': '更多圣甲虫',
  'More Threads': '更多丝线', 'More Currency': '更多通货', 'Atlas Drops': '异界掉落',
  "Dead Man's Sulphur": '亡者硫磺', "Dead Man's Sulphur found in adjacent Areas": '亡者硫磺',
  'Rarity of Items found in adjacent Areas': '物品稀有度', 'Pack Size in adjacent Areas': '怪物群大小',
  'Chart Shape': '海图形状', 'Map Region': '地图区域', 'Map Area': '地图区域',
  'Alert Level Reduction': '警报等级衰减', 'Time before Lockdown': '封锁前的时间',
  'Time Before Lockdown': '封锁前的时间', 'Maximum Alive Reinforcements': '最大存活援军',
  'Heist Target': '抢劫目标', 'Heist Targets': '抢劫目标', 'Client': '客户', 'Target Value': '目标价值',
  'Wings Revealed': '已揭露的侧厅', 'Escape Routes Revealed': '已揭露的逃生路线',
  'Reward Rooms Revealed': '已揭露的奖励房间', 'Weapon Range': '武器范围'
})
const states = Object.freeze({ Corrupted: '已腐化', 'Twice Corrupted': '二次腐化', Unidentified: '未鉴定', Mirrored: '已复制', Split: '已分裂',
  'Fractured Item': '分裂之物', 'Foil Unique': '烫金传奇', Imbued: '已灌注',
  'Synthesised Item': '忆境物品', 'Searing Exarch Item': '焚界者物品', 'Eater of Worlds Item': '灭界者物品',
  'Shaper Item': '塑界者物品', 'Elder Item': '裂界者物品', 'Crusader Item': '圣战者物品',
  'Redeemer Item': '救赎者物品', 'Hunter Item': '狩猎者物品', 'Warlord Item': '督军物品',
  Transfigured: '改造', Unmodifiable: '不可改变', 'Cannot be modified': '不可改变' })

const UNIDENTIFIED_STATE_RE = /^(?:未鉴定|未鑑定|Unidentified)$/i
const UNIDENTIFIED_TIER_RE = /^(?:未鉴定|未鑑定|Unidentified)\s*[（(]\s*(?:(?:Tier|阶级|階級|等阶|等階|位阶|位階|階層|T)\s*[:：]?\s*([1-9]\d{0,2})|([1-9]\d{0,2})\s*[阶階])\s*[）)]$/i
const FOIL_UNIQUE_VARIANT_RE = /^(?:Foil Unique|烫金传奇|貼模傳奇)\s*[（(].+[）)]$/u

const stripStateMarker = line => String(line || '').trim().replace(/^##\s+/, '')

export function parseUnidentifiedTier(line) {
  const match = UNIDENTIFIED_TIER_RE.exec(stripStateMarker(line))
  if (!match) return null
  const tier = Number(match[1] || match[2])
  return Number.isSafeInteger(tier) && tier > 0 ? tier : null
}

export function isUnidentifiedStateLine(line) {
  const text = stripStateMarker(line)
  return UNIDENTIFIED_STATE_RE.test(text) || parseUnidentifiedTier(text) !== null
}

// 只转换已知结构字段，保留名称和完整词缀原文，不做字形或机器翻译身份推断。
export function normalizeItemTextLanguage(text) {
  const source = String(text || '').split(/\r?\n/).map(line => {
    const field = line.match(/^(Item Class|物品类别|物品种类|物品種類|物品類別)\s*[:：]\s*(.*)$/)
    if (!field || !canonicalAtlasMapClass(field[2])) return line
    return field[1] === 'Item Class' ? 'Item Class: Maps' : '物品类别: 异界地图'
  }).join('\n')
  const hasVisceraClass = /^Item Class:[ \t]*Viscera[ \t]*$/m.test(source)
  if (!hasVisceraClass && (!/^Item Class:/m.test(source) || !/^Rarity:/m.test(source))) return source
  return source.split(/\r?\n/).map(line => {
    const value = line.trim()
    const marked = value.replace(/^##\s+/, '')
    const match = marked.match(/^([^:]+):\s*(.*)$/)
    if (match) {
      if (match[1] === 'Item Class') return `物品类别: ${classes[match[2]] || match[2]}`
      if (match[1] === 'Rarity') return `稀有度: ${rarities[match[2]] || match[2]}`
      if (labels[match[1]]) return `${labels[match[1]]}: ${match[2]}`
    }
    const unidentifiedTier = parseUnidentifiedTier(marked)
    if (unidentifiedTier) return `未鉴定 (${unidentifiedTier} 阶)`
    if (FOIL_UNIQUE_VARIANT_RE.test(marked)) return '烫金传奇'
    return states[marked] || line
  }).join('\n')
}
