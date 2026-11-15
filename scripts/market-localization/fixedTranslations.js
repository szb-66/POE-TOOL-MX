// Project-authored UI translations. IDs are catalog identities, never translated option values.
import { createOfficialFilterRules } from './officialFilterTranslations.js'

const titles = {
  type_filters: ['类型筛选', '類型篩選'], weapon_filters: ['武器筛选', '武器篩選'],
  armour_filters: ['防具筛选', '防具篩選'], socket_filters: ['插槽筛选', '插槽篩選'],
  req_filters: ['需求', '需求'], map_filters: ['地图筛选', '地圖篩選'],
  heist_filters: ['夺宝奇兵筛选', '劫盜篩選'], sanctum_filters: ['圣所筛选', '禁忌聖域篩選'],
  ultimatum_filters: ['最后通牒筛选', '最後通牒篩選'], misc_filters: ['其他', '其他'],
  trade_filters: ['交易筛选', '交易篩選']
}
const texts = {
  available: ['即时购买和面对面交易', '即時購買和面對面交易'], securable: ['即时购买', '即時購買'],
  onlineleague: ['面对面交易（当前联盟在线）', '面對面交易（目前聯盟上線）'], online: ['面对面交易（在线）', '面對面交易（上線）'],
  any: ['全部', '全部'], true: ['是', '是'], false: ['否', '否'],
  category: ['物品类别', '物品種類'], rarity: ['物品稀有度', '物品稀有度'],
  weapon: ['武器（全部）', '武器（全部）'], 'weapon.one': ['单手武器', '單手武器'],
  'weapon.onemelee': ['单手近战武器', '單手近戰武器'], 'weapon.twomelee': ['双手近战武器', '雙手近戰武器'],
  'weapon.bow': ['弓', '弓'], 'weapon.claw': ['爪', '爪'], 'weapon.dagger': ['匕首（全部）', '匕首（全部）'],
  'weapon.basedagger': ['匕首', '匕首'], 'weapon.runedagger': ['符文匕首', '符文匕首'],
  'weapon.oneaxe': ['单手斧', '單手斧'], 'weapon.onemace': ['单手锤', '單手錘'], 'weapon.onesword': ['单手剑', '單手劍'],
  'weapon.basesword': ['单手剑', '單手劍'], 'weapon.rapier': ['细剑', '細劍'], 'weapon.basemace': ['单手锤', '單手錘'],
  'weapon.sceptre': ['权杖', '權杖'], 'weapon.staff': ['长杖（全部）', '長杖（全部）'],
  'weapon.warstaff': ['战杖', '戰杖'], 'weapon.basestaff': ['长杖', '長杖'],
  'weapon.twoaxe': ['双手斧', '雙手斧'], 'weapon.twomace': ['双手锤', '雙手錘'], 'weapon.twosword': ['双手剑', '雙手劍'],
  'weapon.wand': ['法杖', '法杖'], 'weapon.rod': ['钓竿', '釣竿'],
  armour: ['防具（全部）', '防具（全部）'], 'armour.chest': ['胸甲', '胸甲'], 'armour.boots': ['鞋子', '鞋子'],
  'armour.gloves': ['手套', '手套'], 'armour.helmet': ['头部', '頭部'], 'armour.shield': ['盾牌', '盾牌'], 'armour.quiver': ['箭袋', '箭袋'],
  accessory: ['饰品（全部）', '飾品（全部）'], 'accessory.amulet': ['护身符', '護身符'], 'accessory.ring': ['戒指', '戒指'], 'accessory.belt': ['腰带', '腰帶'],
  gem: ['宝石（全部）', '寶石（全部）'], 'gem.activegem': ['技能宝石', '技能寶石'], 'gem.supportgem': ['辅助宝石', '輔助寶石'],
  jewel: ['珠宝（全部）', '珠寶（全部）'], 'jewel.base': ['普通珠宝', '一般珠寶'], 'jewel.abyss': ['深渊珠宝', '深淵珠寶'], 'jewel.cluster': ['星团珠宝', '星團珠寶'],
  flask: ['药剂（全部）', '藥劑（全部）'], 'flask.life': ['生命药剂', '生命藥劑'], 'flask.mana': ['魔力药剂', '魔力藥劑'],
  'flask.hybrid': ['混合药剂', '複合藥劑'], 'flask.utility': ['功能药剂', '功能藥劑'],
  map: ['地图（全部）', '地圖（全部）'], 'map.fragment': ['地图碎片', '地圖碎片'], 'map.scarab': ['圣甲虫', '聖甲蟲'],
  currency: ['通货', '通貨'], card: ['命运卡', '命運卡'], beast: ['野兽', '野獸'],
  normal: ['普通', '普通'], magic: ['魔法', '魔法'], rare: ['稀有', '稀有'], unique: ['传奇', '傳奇'],
  nonunique: ['非传奇', '非傳奇'], uniquefoil: ['闪耀传奇', '閃耀傳奇'],
  account: ['卖家账号', '賣家帳號'], collapse: ['按账号合并结果', '依帳號合併結果'], indexed: ['上架时间', '刊登時間'],
  sale_type: ['出售类型', '出售類型'], price: ['价格', '價格'], gold: ['金币费用', '金幣費用'],
  buyout: ['已标价', '已標價'], priced: ['已标价', '已標價'], unpriced: ['未标价', '未標價'],
  str: ['力量', '力量'], dex: ['敏捷', '敏捷'], int: ['智慧', '智慧'], lvl: ['等级', '等級'], ilvl: ['物品等级', '物品等級'],
  pdps: ['每秒物理伤害', '每秒物理傷害'], edps: ['每秒元素伤害', '每秒元素傷害'], dps: ['每秒伤害', '每秒傷害'],
  aps: ['每秒攻击次数', '每秒攻擊次數'], crit: ['暴击率', '暴擊率'],
  ar: ['护甲', '護甲'], ev: ['闪避值', '閃避值'], es: ['能量护盾', '能量護盾'], ward: ['结界', '結界'], block: ['格挡率', '格擋率'],
  sockets: ['插槽数量', '插槽數量'], links: ['连接数量', '連線數量'],
  corrupted: ['已腐化', '已汙染'], mirrored: ['已复制', '已複製'], identified: ['已鉴定', '已鑑定'],
  quality: ['品质', '品質'], stack_size: ['堆叠数量', '堆疊數量'], map_tier: ['地图阶级', '地圖階級']
}
const groups = {
  pseudo: ['综合', '偽屬性'], explicit: ['外延', '隨機屬性'], implicit: ['基底', '固定屬性'],
  fractured: ['分裂的', '破裂'], crafted: ['工艺', '工藝'], enchant: ['附魔', '附魔'],
  veiled: ['影匿', '隱匿'], monster: ['怪物', '怪物'], crucible: ['古神熔炉', '熔火冥獄'],
  necropolis: ['死寂亡城', '魔影墓場'], scourge: ['异度天灾', '災魘']
}
const itemGroups = {
  weapon: ['武器', '武器'], armour: ['防具', '防具'], accessory: ['饰品', '飾品'], gem: ['宝石', '寶石'],
  jewel: ['珠宝', '珠寶'], flask: ['药剂', '藥劑'], map: ['地图', '地圖'], currency: ['通货', '通貨'], card: ['命运卡', '命運卡']
}
const rows = (section, field, values) => Object.entries(values).map(([id, [cn, tw]]) => ({ section, field, id, cn, tw }))
export const fixedMarketRules = [
  ...createOfficialFilterRules([...rows('filters', 'title', titles), ...rows('filters', 'text', texts)]),
  ...rows('stats', 'label', groups), ...rows('items', 'label', itemGroups),
  { section: 'filters', field: 'text', source: 'Coût en Or', cn: '金币费用', tw: '金幣費用' },
  { section: 'filters', field: 'text', source: 'Coût en or', cn: '金币费用', tw: '金幣費用' }
]

// Pseudo stats are trade aggregates, absent from game CSD. Keep reviewed English semantics beside both translations.
export const pseudoMarketTranslations = Object.fromEntries([
  ['total_cold_resistance', '+#% total to Cold Resistance', '+#% 总冰霜抗性', '+#% 總冰冷抗性'],
  ['total_fire_resistance', '+#% total to Fire Resistance', '+#% 总火焰抗性', '+#% 總火焰抗性'],
  ['total_lightning_resistance', '+#% total to Lightning Resistance', '+#% 总闪电抗性', '+#% 總閃電抗性'],
  ['total_elemental_resistance', '+#% total Elemental Resistance', '+#% 总元素抗性', '+#% 總元素抗性'],
  ['total_chaos_resistance', '+#% total to Chaos Resistance', '+#% 总混沌抗性', '+#% 總混沌抗性'],
  ['total_resistance', '+#% total Resistance', '+#% 总抗性', '+#% 總抗性'],
  ['count_resistances', '# total Resistances', '# 项抗性', '# 項抗性'],
  ['count_elemental_resistances', '# total Elemental Resistances', '# 项元素抗性', '# 項元素抗性'],
  ['total_all_elemental_resistances', '+#% total to all Elemental Resistances', '+#% 所有元素抗性总和', '+#% 全部元素抗性總和'],
  ['total_strength', '+# total to Strength', '+# 总力量', '+# 總力量'],
  ['total_dexterity', '+# total to Dexterity', '+# 总敏捷', '+# 總敏捷'],
  ['total_intelligence', '+# total to Intelligence', '+# 总智慧', '+# 總智慧'],
  ['total_all_attributes', '+# total to all Attributes', '+# 总全属性', '+# 總全能力'],
  ['total_life', '+# total maximum Life', '+# 总最大生命', '+# 總最大生命'],
  ['total_mana', '+# total maximum Mana', '+# 总最大魔力', '+# 總最大魔力'],
  ['total_energy_shield', '+# total maximum Energy Shield', '+# 总最大能量护盾', '+# 總最大能量護盾'],
  ['increased_energy_shield', '#% total increased maximum Energy Shield', '最大能量护盾总共提高 #%', '增加 #% 總最大能量護盾'],
  ['total_attack_speed', '+#% total Attack Speed', '+#% 总攻击速度', '+#% 總攻擊速度'],
  ['total_cast_speed', '+#% total Cast Speed', '+#% 总施法速度', '+#% 總施放速度'],
  ['increased_movement_speed', '#% increased Movement Speed', '移动速度提高 #%', '增加 #% 移動速度'],
  ['increased_physical_damage', '#% total increased Physical Damage', '物理伤害总共提高 #%', '增加 #% 總物理傷害'],
  ['global_critical_strike_chance', '+#% Global Critical Strike Chance', '+#% 全域暴击率', '+#% 全域暴擊率'],
  ['critical_strike_chance_for_spells', '+#% total Critical Strike Chance for Spells', '+#% 总法术暴击率', '+#% 總法術暴擊率'],
  ['global_critical_strike_multiplier', '+#% Global Critical Strike Multiplier', '+#% 全域暴击伤害加成', '+#% 全域暴擊加成']
].map(([id, en, cn, tw]) => [`pseudo.pseudo_${id}`, { en, cn, tw }]))
