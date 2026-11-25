/**
 * Declarative high-value auto-selection rules for PoE 1 price checking.
 *
 * All stat identifiers use language-independent canonical English refs or
 * namespace-stripped official trade core stat IDs (e.g. `stat_1004011302`),
 * so CN and International catalogs evaluate identically.
 */

export const CLUSTER_PASSIVE_COUNT_REF = 'Adds # Passive Skills'
export const CLUSTER_PASSIVE_COUNT_CORE_ID = 'stat_3086156145'
export const CLUSTER_NOTABLE_REF_PATTERN = /^1 Added Passive Skill is /
export const CLUSTER_NOTABLE_TEXT_PATTERN = /^(?:1 Added Passive Skill is |其中\s*1\s*个增加的天赋为|其中\s*1\s*個增加的天賦為)/

export const MAX_SCORED_AUTO_SELECTIONS = Object.freeze({
  rareEquipment: 4,
  jewel: 3,
  flask: 2,
  tincture: 2,
  unique: 4
})

/**
 * Rare bases whose intrinsic base value / unique implicit warrants keeping
 * `identity.nameEnabled = true` by default even for rare items.
 */
export const HIGH_VALUE_RARE_BASE_TYPES = new Set([
  // Belts
  'Stygian Vise', '冥河腰带', '冥河虎鉗',
  'Crystal Belt', '水晶腰带', '水晶腰帶',
  'Vanguard Belt', '先锋腰带', '先鋒腰帶',
  // Rings
  'Opal Ring', '蛋白石戒指',
  'Vermillion Ring', '朱砂之戒', '朱砂戒指',
  'Steel Ring', '合金戒指',
  'Cerulean Ring', '蔚蓝戒指', '蔚藍戒指',
  'Iolite Ring', '堇青石戒指',
  'Bone Ring', '灵骨戒指', '靈骨戒指',
  'Amethyst Ring', '紫晶戒指',
  'Cogwork Ring', '齿轮戒指', '齒輪戒指',
  'Geodesic Ring', '大地戒指',
  'Helical Ring', '螺旋戒指', '螺纹戒指',
  // Amulets
  'Blue Pearl Amulet', '蓝晶护身符', '藍晶護身符', '蓝晶项链',
  'Marble Amulet', '大理石护身符', '大理石護身符', '大理石项链',
  'Simplex Amulet', '单纯护身符', '單純護身符', '单纯项链',
  'Focused Amulet', '聚焦护身符', '聚焦護身符', '聚焦项链',
  'Astrolabe Amulet', '星盘护身符', '星盤護身符', '星盘项链',
  // Boots / Gloves / Helmets with special ritual or implicit bases
  'Two-Toned Boots', '异色鞋', '異色鞋',
  'Fugitive Boots', '逃亡之靴',
  'Spiked Gloves', '扣钉手套', '扣釘手套',
  'Fingerless Silk Gloves', '丝绸手套', '絲綢手套',
  'Gripped Gloves', '擒拿手套',
  'Bone Helmet', '唤骨头盔', '喚骨頭盔',
  'Blizzard Crown', '暴雪之冠',
  'Archdemon Crown', '大恶魔之冠', '大惡魔之冠',
  // Shields
  'Titanium Spirit Shield', '钛金灵盾', '鈦金靈盾'
])

const ONE_HAND_WEAPON_CATEGORIES = new Set([
  'weapon.one', 'weapon.onemelee', 'weapon.claw', 'weapon.dagger', 'weapon.runedagger',
  'weapon.oneaxe', 'weapon.onesword', 'weapon.rapier', 'weapon.onemace', 'weapon.sceptre', 'weapon.wand'
])
const TWO_HAND_WEAPON_CATEGORIES = new Set([
  'weapon.twomelee', 'weapon.bow', 'weapon.staff', 'weapon.warstaff',
  'weapon.twoaxe', 'weapon.twomace', 'weapon.twosword'
])

export function weaponDpsThresholds(category) {
  if (TWO_HAND_WEAPON_CATEGORIES.has(category)) {
    return { pdps: 520, edps: 700 }
  }
  if (ONE_HAND_WEAPON_CATEGORIES.has(category)) {
    return { pdps: 320, edps: 400 }
  }
  return null
}

export const ARMOUR_DEFENCE_THRESHOLDS = Object.freeze({
  'armour.chest': Object.freeze({ armour: 1500, evasion: 1500, energyShield: 450 }),
  'armour.helmet': Object.freeze({ armour: 650, evasion: 650, energyShield: 220 }),
  'armour.gloves': Object.freeze({ armour: 550, evasion: 550, energyShield: 180 }),
  'armour.boots': Object.freeze({ armour: 550, evasion: 550, energyShield: 180 }),
  'armour.shield': Object.freeze({ armour: 1000, evasion: 1000, energyShield: 260 })
})

/**
 * Local stat core IDs absorbed when an aggregate weapon DPS or armour defence
 * property is selected, preventing double-constraining the same rolled values.
 */
export const LOCAL_PROPERTY_ABSORPTION = Object.freeze({
  'weapon.pdps': Object.freeze({
    label: '物理 DPS',
    coreIds: new Set([
      'stat_1940865751', // Adds # to # Physical Damage (Local)
      'stat_960081730',  // Adds # to # Physical Damage
      'stat_1509134228', // #% increased Physical Damage
      'stat_210067635'   // #% increased Attack Speed (Local)
    ]),
    refs: new Set([
      '#% increased Physical Damage'
    ])
  }),
  'weapon.edps': Object.freeze({
    label: '元素 DPS',
    coreIds: new Set([
      'stat_709508406',  // Adds # to # Fire Damage (Local)
      'stat_1037193709', // Adds # to # Cold Damage (Local)
      'stat_3336890334', // Adds # to # Lightning Damage (Local)
      'stat_321077055',  // Adds # to # Fire Damage
      'stat_2387423236', // Adds # to # Cold Damage
      'stat_1334060246', // Adds # to # Lightning Damage
      'stat_210067635'   // #% increased Attack Speed (Local)
    ]),
    refs: new Set()
  }),
  'armour.armour': Object.freeze({
    label: '护甲',
    coreIds: new Set([
      'stat_3484657501', // +# to Armour (Local)
      'stat_809229260',  // +# to Armour
      'stat_1062208444', // #% increased Armour (Local)
      'stat_2866361420', // #% increased Armour
      'stat_2451402625', // #% increased Armour and Evasion (Local)
      'stat_3321629045'  // #% increased Armour and Energy Shield (Local)
    ]),
    refs: new Set([
      '#% increased Armour and Evasion',
      '#% increased Armour and Energy Shield',
      '#% increased Armour, Evasion and Energy Shield'
    ])
  }),
  'armour.evasion': Object.freeze({
    label: '闪避',
    coreIds: new Set([
      'stat_53045048',   // +# to Evasion Rating (Local)
      'stat_2144192055', // +# to Evasion Rating
      'stat_124859000',  // #% increased Evasion Rating (Local)
      'stat_2106365538', // #% increased Evasion Rating
      'stat_2451402625', // #% increased Armour and Evasion (Local)
      'stat_1999113824'  // #% increased Evasion and Energy Shield (Local)
    ]),
    refs: new Set([
      '#% increased Armour and Evasion',
      '#% increased Evasion and Energy Shield',
      '#% increased Armour, Evasion and Energy Shield'
    ])
  }),
  'armour.energyShield': Object.freeze({
    label: '能量护盾',
    coreIds: new Set([
      'stat_4052037485', // +# to maximum Energy Shield (Local)
      'stat_3489782002', // +# to maximum Energy Shield
      'stat_4015621042', // #% increased Energy Shield (Local)
      'stat_1999113824', // #% increased Evasion and Energy Shield (Local)
      'stat_3321629045'  // #% increased Armour and Energy Shield (Local)
    ]),
    refs: new Set([
      '+# to maximum Energy Shield',
      '#% increased Energy Shield',
      '#% increased Armour and Energy Shield',
      '#% increased Evasion and Energy Shield',
      '#% increased Armour, Evasion and Energy Shield'
    ])
  })
})

/**
 * Pseudo stat auto-selection thresholds by slot/category.
 * Only applies when the pseudo stat is not solely composed of crafted mods.
 */
export const PSEUDO_AUTO_RULES = Object.freeze([
  {
    ref: '+# total maximum Life',
    score: 78,
    reason: '高数值总最大生命',
    thresholds: {
      'armour.chest': 90,
      'armour.helmet': 70,
      'armour.gloves': 70,
      'armour.boots': 70,
      'armour.shield': 65,
      'armour.quiver': 65,
      'accessory.belt': 75,
      'accessory.ring': 55,
      'accessory.amulet': 55,
      'jewel.abyss': 30,
      default: 65
    },
    excludeCategories: new Set(['weapon', 'jewel', 'flask', 'tincture'])
  },
  {
    ref: '+#% total Elemental Resistance',
    score: 74,
    reason: '高数值总元素抗性',
    thresholds: {
      'armour.chest': 75,
      'armour.helmet': 75,
      'armour.gloves': 75,
      'armour.boots': 75,
      'armour.shield': 75,
      'accessory.belt': 70,
      'accessory.ring': 65,
      'accessory.amulet': 65,
      'jewel': 24,
      'jewel.abyss': 24,
      default: 70
    },
    excludeCategories: new Set(['weapon', 'flask', 'tincture'])
  },
  {
    ref: '+#% total to Chaos Resistance',
    score: 82,
    reason: '高数值总混沌抗性',
    thresholds: {
      'jewel': 11,
      'jewel.abyss': 11,
      default: 25
    },
    excludeCategories: new Set(['weapon', 'flask', 'tincture'])
  },
  {
    ref: '#% increased Movement Speed',
    score: 86,
    reason: '鞋子高移动速度',
    categories: new Set(['armour.boots']),
    thresholds: { default: 25 }
  },
  {
    ref: '+# total to all Attributes',
    score: 72,
    reason: '高总全属性',
    thresholds: { 'jewel': 10, 'jewel.abyss': 10, default: 25 },
    excludeCategories: new Set(['flask', 'tincture'])
  },
  {
    ref: '+# total to Strength',
    score: 68,
    reason: '高总力量',
    thresholds: { 'jewel': 16, 'jewel.abyss': 14, default: 45 },
    excludeCategories: new Set(['flask', 'tincture'])
  },
  {
    ref: '+# total to Dexterity',
    score: 68,
    reason: '高总敏捷',
    thresholds: { 'jewel': 16, 'jewel.abyss': 14, default: 45 },
    excludeCategories: new Set(['flask', 'tincture'])
  },
  {
    ref: '+# total to Intelligence',
    score: 68,
    reason: '高总智慧',
    thresholds: { 'jewel': 16, 'jewel.abyss': 14, default: 45 },
    excludeCategories: new Set(['flask', 'tincture'])
  },
  {
    ref: '+#% Global Critical Strike Multiplier',
    score: 86,
    reason: '高暴击伤害加成',
    thresholds: {
      'jewel': 12,
      'jewel.abyss': 10,
      'accessory.amulet': 25,
      'armour.quiver': 25,
      default: 28
    },
    excludeCategories: new Set(['flask', 'tincture'])
  },
  {
    ref: '+#% total Attack Speed',
    score: 83,
    reason: '高攻击速度',
    thresholds: {
      'armour.gloves': 12,
      'accessory.ring': 8,
      'accessory.amulet': 8,
      'armour.quiver': 10,
      'jewel': 5,
      'jewel.abyss': 4,
      default: 14
    },
    excludeCategories: new Set(['armour.chest', 'armour.helmet', 'armour.boots', 'flask', 'tincture']),
    skipWhenWeaponDpsSelected: true
  },
  {
    ref: '+#% total Cast Speed',
    score: 83,
    reason: '高施法速度',
    thresholds: {
      'accessory.ring': 12,
      'accessory.amulet': 12,
      'armour.shield': 12,
      'jewel': 4,
      'jewel.abyss': 4,
      default: 18
    },
    excludeCategories: new Set(['armour.chest', 'armour.boots', 'flask', 'tincture'])
  },
  {
    ref: '#% increased Elemental Damage with Attack Skills',
    score: 76,
    reason: '高攻击元素伤害',
    categories: new Set(['accessory.belt', 'accessory.ring', 'accessory.amulet', 'armour.quiver']),
    thresholds: { default: 30 }
  },
  {
    ref: '+# total maximum Energy Shield',
    score: 74,
    reason: '饰品/珠宝高最大能量护盾',
    categories: new Set(['accessory.belt', 'accessory.ring', 'accessory.amulet', 'jewel', 'jewel.abyss']),
    thresholds: {
      'jewel': 15,
      'jewel.abyss': 25,
      default: 35
    }
  },
  {
    ref: '#% total increased maximum Energy Shield',
    score: 87,
    reason: '高百分比最大能量护盾',
    categories: new Set(['accessory.ring', 'accessory.amulet', 'jewel']),
    thresholds: {
      'jewel': 6,
      default: 15
    }
  }
])

/**
 * Unique variant & key roll rules: selected automatically on unique items.
 */
export const UNIQUE_VARIANT_RULES = Object.freeze([
  {
    id: 'forbidden-jewel',
    refPattern: /^Allocates .+ if you have the matching modifier on Forbidden (?:Flesh|Flame)$/,
    reason: '禁断珠宝核心升华词缀'
  },
  {
    id: 'watchers-eye',
    refPattern: /while affected by (?:Anger|Clarity|Determination|Discipline|Grace|Haste|Hatred|Malevolence|Precision|Pride|Purity of (?:Elements|Fire|Ice|Lightning)|Vitality|Wrath|Zealotry)$/,
    reason: '守望之眼核心光环词缀'
  },
  {
    id: 'megalomaniac',
    refPattern: CLUSTER_NOTABLE_REF_PATTERN,
    reason: '先祖之声核心大天赋'
  },
  {
    id: 'grand-spectrum',
    refPattern: /per Grand Spectrum$/,
    reason: '巨光谱变体词缀'
  },
  {
    id: 'mageblood-flasks',
    refs: new Set(['Leftmost # Magic Utility Flask constantly applies its Flask Effect to you']),
    coreIds: new Set(['stat_2388347909']),
    reason: '法师之血核心生效药剂数'
  }
])

/**
 * High-value explicit / eldritch / special-category whitelist rules.
 * Evaluated against canonical English refs and official core stat IDs.
 */
export const HIGH_VALUE_STAT_RULES = Object.freeze([
  // --- Top-tier universal / rare / build-defining mods ---
  {
    id: 'plus-all-skill-gems',
    refs: new Set([
      '+# to Level of all Skill Gems',
      '+# to Level of all Spell Skill Gems',
      '+# to Level of all Minion Skill Gems',
      '+# to Level of all Fire Skill Gems',
      '+# to Level of all Cold Skill Gems',
      '+# to Level of all Lightning Skill Gems',
      '+# to Level of all Chaos Skill Gems',
      '+# to Level of all Physical Skill Gems',
      '+# to Level of all Fire Spell Skill Gems',
      '+# to Level of all Cold Spell Skill Gems',
      '+# to Level of all Lightning Spell Skill Gems',
      '+# to Level of all Chaos Spell Skill Gems',
      '+# to Level of all Physical Spell Skill Gems'
    ]),
    score: 98,
    reason: '技能宝石等级词缀'
  },
  {
    id: 'plus-socketed-gems',
    refs: new Set([
      '+# to Level of Socketed Gems',
      '+# to Level of Socketed Support Gems',
      '+# to Level of Socketed Aura Gems',
      '+# to Level of Socketed AoE Gems',
      '+# to Level of Socketed Projectile Gems',
      '+# to Level of Socketed Curse Gems',
      '+# to Level of Socketed Vaal Gems',
      '+# to Level of Socketed Duration Gems',
      '+# to Level of Socketed Trap or Mine Gems',
      '+# to Level of Socketed Warcry Gems',
      '+# to Level of Socketed Melee Gems',
      '+# to Level of Socketed Minion Gems'
    ]),
    score: 94,
    reason: '插槽宝石等级词缀'
  },
  {
    id: 'additional-arrows',
    refs: new Set(['Bow Attacks fire # additional Arrows']),
    score: 98,
    reason: '弓攻击额外箭矢'
  },
  {
    id: 'additional-curse',
    refs: new Set(['You can apply # additional Curses']),
    score: 96,
    reason: '额外诅咒上限'
  },
  {
    id: 'max-charges',
    refs: new Set([
      '+# to Maximum Frenzy Charges',
      '+# to Maximum Power Charges',
      '+# to Maximum Endurance Charges'
    ]),
    score: 96,
    reason: '最大充能球上限'
  },
  {
    id: 'spell-suppression',
    refs: new Set(['+#% chance to Suppress Spell Damage']),
    minValue: 10,
    score: 92,
    reason: '高法术伤害压制率'
  },
  {
    id: 'reservation-efficiency',
    refs: new Set([
      '#% increased Mana Reservation Efficiency of Skills',
      '#% increased Reservation Efficiency of Skills'
    ]),
    score: 92,
    reason: '技能保留效能'
  },
  {
    id: 'aura-effect',
    refs: new Set(['#% increased effect of Non-Curse Auras from your Skills']),
    score: 90,
    reason: '非诅咒光环效果'
  },
  {
    id: 'tailwind-elusive-explode',
    coreIds: new Set([
      'stat_1085545682', // Tailwind on crit
      'stat_2896192589', // Elusive on crit
      'stat_1220361974', // Enemies you Kill Explode (Physical)
      'stat_3295179224', // Enemies you Kill have #% chance to Explode (Physical)
      'stat_1776945532', // Explode Chaos
      'stat_2360921519', // Explode Random Element
      'stat_1661253443', // Non-Vaal Strike Skills target # additional nearby Enemy
      'stat_1524679549',
      'stat_1884100040'
    ]),
    score: 95,
    reason: '高价值机制/势力词缀'
  },
  {
    id: 'cooldown-recovery',
    coreIds: new Set(['stat_1004011302', 'stat_239144']),
    minValue: 10,
    score: 88,
    reason: '冷却回复速度'
  },
  {
    id: 'non-channelling-mana-cost',
    refs: new Set(['Non-Channelling Skills have +# to Total Mana Cost']),
    score: 88,
    reason: '非引导技能魔力消耗'
  },
  {
    id: 'max-resistances',
    coreIds: new Set([
      'stat_3676141501', // max cold res
      'stat_4095671657', // max fire res
      'stat_1011760251', // max lightning res
      'stat_1301765461'  // max chaos res
    ]),
    score: 88,
    reason: '最大抗性上限'
  },
  {
    id: 'percent-attributes',
    coreIds: new Set([
      'stat_3143208761', // #% increased Attributes
      'stat_734614379',  // #% increased Strength
      'stat_4139681126', // #% increased Dexterity
      'stat_656461285'   // #% increased Intelligence
    ]),
    minValue: 6,
    score: 88,
    reason: '百分比属性词缀'
  },
  {
    id: 'base-crit-chance',
    coreIds: new Set([
      'stat_2572042788', // Attacks have +#% to Critical Strike Chance
      'stat_791835907'   // +#% to Spell Critical Strike Chance
    ]),
    score: 88,
    reason: '基础暴击率加成'
  },
  {
    id: 'dot-multiplier',
    refs: new Set([
      '+#% to Damage over Time Multiplier',
      '+#% to Fire Damage over Time Multiplier',
      '+#% to Cold Damage over Time Multiplier',
      '+#% to Chaos Damage over Time Multiplier',
      '+#% to Physical Damage over Time Multiplier'
    ]),
    minValueByCategory: { 'jewel': 4, 'jewel.abyss': 4, default: 16 },
    score: 86,
    reason: '高持续伤害加成'
  },
  {
    id: 'crit-multiplier-specialized',
    refPattern: /^\+#% to (?:Global |Melee |Melee Weapon |Spell |Elemental |Fire |Cold |Lightning |Bow |Two Handed Melee )?Critical Strike Multiplier/,
    minValueByCategory: { 'jewel': 10, 'jewel.abyss': 10, default: 25 },
    score: 84,
    reason: '高暴击伤害加成'
  },
  {
    id: 'corrupted-blood-immunity',
    refs: new Set(['Corrupted Blood cannot be inflicted on you']),
    score: 96,
    reason: '腐化之血免疫'
  },
  {
    id: 'reduced-extra-crit-damage',
    refs: new Set(['You take #% reduced Extra Damage from Critical Strikes']),
    minValue: 30,
    score: 88,
    reason: '降低承受暴击额外伤害'
  },
  {
    id: 'avoid-elemental-ailments',
    refs: new Set(['#% chance to Avoid Elemental Ailments']),
    minValue: 20,
    score: 84,
    reason: '避免元素异常状态'
  },
  {
    id: 'culling-strike',
    refs: new Set(['Culling Strike', 'Bow Attacks have Culling Strike']),
    score: 86,
    reason: '扑杀效果'
  },
  {
    id: 'percent-max-life',
    refs: new Set(['#% increased maximum Life']),
    minValueByCategory: { 'jewel': 5, default: 6 },
    score: 88,
    reason: '最大生命百分比'
  },
  {
    id: 'percent-max-es',
    refs: new Set(['#% increased maximum Energy Shield']),
    categories: new Set(['jewel', 'accessory.amulet', 'accessory.ring', 'armour.chest']),
    minValueByCategory: { 'jewel': 6, default: 12 },
    score: 86,
    reason: '最大能量护盾百分比'
  },

  // --- Jewel / Abyss Jewel dedicated rules ---
  {
    id: 'jewel-attack-cast-speed',
    refs: new Set([
      '#% increased Attack Speed',
      '#% increased Cast Speed',
      '#% increased Attack and Cast Speed',
      '#% increased Attack Speed while holding a Shield',
      '#% increased Attack Speed while Dual Wielding'
    ]),
    categories: new Set(['jewel', 'jewel.abyss']),
    minValue: 4,
    score: 82,
    reason: '珠宝高攻速/施速'
  },
  {
    id: 'abyss-avoid-ailment',
    refs: new Set([
      '#% chance to Avoid being Shocked',
      '#% chance to Avoid being Frozen',
      '#% chance to Avoid being Chilled',
      '#% chance to Avoid being Ignited',
      '#% chance to Avoid being Stunned',
      '#% chance to Avoid being Poisoned'
    ]),
    categories: new Set(['jewel.abyss', 'armour.boots']),
    minValue: 25,
    score: 82,
    reason: '高几率避免异常状态'
  },
  {
    id: 'abyss-flat-damage',
    refs: new Set([
      'Adds # to # Physical Damage to Attacks',
      'Adds # to # Fire Damage to Attacks',
      'Adds # to # Cold Damage to Attacks',
      'Adds # to # Lightning Damage to Attacks',
      'Adds # to # Fire Damage to Spells',
      'Adds # to # Cold Damage to Spells',
      'Adds # to # Lightning Damage to Spells'
    ]),
    categories: new Set(['jewel.abyss']),
    maxTier: 2,
    score: 80,
    reason: '深渊珠宝高阶点伤'
  },

  // --- Cluster jewel small passive effect (35% / 25% ilvl 84+) ---
  {
    id: 'cluster-small-effect',
    refs: new Set(['Added Small Passive Skills have #% increased Effect']),
    categories: new Set(['jewel', 'jewel.cluster']),
    minValue: 25,
    score: 94,
    reason: '星团高阶小天赋效果提高'
  },

  // --- Flask & Tincture dedicated rules ---
  {
    id: 'flask-crit-charge',
    coreIds: new Set(['stat_3738001379', 'stat_2858921304', 'stat_1546046884']),
    categories: new Set(['flask']),
    score: 92,
    reason: '药剂暴击获得充能'
  },
  {
    id: 'flask-hit-charge',
    refs: new Set(['Gain # Charge when you are Hit by an Enemy']),
    categories: new Set(['flask']),
    minValue: 2,
    score: 92,
    reason: '药剂受击获得充能'
  },
  {
    id: 'flask-increased-effect',
    refs: new Set(['Flasks applied to you have #% increased Effect']),
    coreIds: new Set(['stat_2448920197', 'stat_3529940209']),
    categories: new Set(['flask']),
    minValue: 20,
    score: 92,
    reason: '高药剂效果提高'
  },
  {
    id: 'flask-reduced-charges-used',
    refs: new Set(['#% increased Charges per use']),
    categories: new Set(['flask']),
    negativeMinAbs: 20,
    score: 86,
    reason: '药剂消耗充能大幅降低'
  },
  {
    id: 'flask-during-effect-core',
    refs: new Set([
      '#% increased Movement Speed during Effect',
      '#% increased Armour during Effect',
      '#% increased Evasion Rating during Effect',
      '#% increased Critical Strike Chance during Effect',
      '#% additional Elemental Resistances during Effect',
      '#% reduced Effect of Curses on you during Effect',
      '#% Chance to Avoid being Stunned during Effect',
      'Immunity to Bleeding and Corrupted Blood during Effect'
    ]),
    categories: new Set(['flask']),
    maxTier: 2,
    score: 86,
    reason: '药剂核心高阶后缀'
  },
  {
    id: 'tincture-core',
    refs: new Set([
      '#% reduced Mana Burn rate',
      '#% increased Attack Speed',
      '#% increased Critical Strike Chance',
      '#% increased Elemental Damage with Attack Skills',
      'Melee Weapon Damage Penetrates #% Elemental Resistances per Mana Burn, up to a maximum of 200%'
    ]),
    categories: new Set(['tincture']),
    maxTier: 2,
    score: 86,
    reason: '酊剂核心高阶词缀'
  }
])

/**
 * Eldritch (Searing Exarch / Eater of Worlds) implicit whitelist.
 * Only high-value eldritch implicits are auto-selected so low-tier embers do
 * not pollute ordinary rare item searches.
 */
export const HIGH_VALUE_ELDRITCH_IMPLICIT_RULES = Object.freeze([
  {
    id: 'eldritch-strike-target',
    coreIds: new Set(['stat_1661253443', 'stat_1524679549', 'stat_1884100040']),
    score: 90,
    reason: '高价值双王基底（额外打击目标）'
  },
  {
    id: 'eldritch-max-res',
    coreIds: new Set(['stat_3676141501', 'stat_4095671657', 'stat_1011760251', 'stat_1301765461']),
    score: 88,
    reason: '高价值双王基底（最大抗性）'
  },
  {
    id: 'eldritch-aura-reservation',
    refs: new Set([
      '#% increased Mana Reservation Efficiency of Skills',
      '#% increased Reservation Efficiency of Skills',
      '#% increased effect of Non-Curse Auras from your Skills'
    ]),
    score: 88,
    reason: '高价值双王基底（保留/光环效果）'
  },
  {
    id: 'eldritch-suppress-ailment-cdr',
    refs: new Set([
      '+#% chance to Suppress Spell Damage',
      '#% chance to Avoid Elemental Ailments'
    ]),
    coreIds: new Set(['stat_1004011302', 'stat_239144']),
    score: 86,
    reason: '高价值双王基底'
  }
])
