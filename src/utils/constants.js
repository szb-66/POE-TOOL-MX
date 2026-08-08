/**
 * Purpose: 常量定义文件，包含通货类型、制作模式、物品稀有度等常量
 * Inputs: 无
 * Outputs: 常量对象
 * Preconditions: 无
 * Edge cases: 无
 * Errors: 无
 */

// 通货类型
export const CURRENCY_TYPES = {
  ALTERATION: 'alteration',        // 改造石
  AUGMENTATION: 'augmentation',    // 增幅石
  REGAL: 'regal',                  // 富豪石
  CHAOS: 'chaos',                  // 混沌石
  EXALTED: 'exalted',              // 崇高石
  ALCHEMY: 'alchemy',              // 点金石
  SCOURING: 'scouring',            // 重铸石
  TRANSMUTATION: 'transmutation',  // 蜕变石
  JEWELLERS: 'jewellers',         // 工匠石
  FUSING: 'fusing',               // 链结石
  CHROMIC: 'chromic',             // 幻色石
  VAAL: 'vaal',                   // 瓦尔宝珠
  WISDOM: 'wisdom',               // 知识卷轴
  LESSER_ELDRITCH_EMBER: 'lesser-eldritch-ember',
  GREATER_ELDRITCH_EMBER: 'greater-eldritch-ember',
  GRAND_ELDRITCH_EMBER: 'grand-eldritch-ember',
  EXCEPTIONAL_ELDRITCH_EMBER: 'exceptional-eldritch-ember',
  LESSER_ELDRITCH_ICHOR: 'lesser-eldritch-ichor',
  GREATER_ELDRITCH_ICHOR: 'greater-eldritch-ichor',
  GRAND_ELDRITCH_ICHOR: 'grand-eldritch-ichor',
  EXCEPTIONAL_ELDRITCH_ICHOR: 'exceptional-eldritch-ichor'
}

// 通货中文名称映射
export const CURRENCY_NAMES = {
  [CURRENCY_TYPES.ALTERATION]: '改造石',
  [CURRENCY_TYPES.AUGMENTATION]: '增幅石',
  [CURRENCY_TYPES.REGAL]: '富豪石',
  [CURRENCY_TYPES.CHAOS]: '混沌石',
  [CURRENCY_TYPES.EXALTED]: '崇高石',
  [CURRENCY_TYPES.ALCHEMY]: '点金石',
  [CURRENCY_TYPES.SCOURING]: '重铸石',
  [CURRENCY_TYPES.TRANSMUTATION]: '蜕变石',
  [CURRENCY_TYPES.JEWELLERS]: '工匠石',
  [CURRENCY_TYPES.FUSING]: '链结石',
  [CURRENCY_TYPES.CHROMIC]: '幻色石',
  [CURRENCY_TYPES.VAAL]: '瓦尔宝珠',
  [CURRENCY_TYPES.WISDOM]: '知识卷轴',
  [CURRENCY_TYPES.LESSER_ELDRITCH_EMBER]: '次级古灵余烬',
  [CURRENCY_TYPES.GREATER_ELDRITCH_EMBER]: '高级古灵余烬',
  [CURRENCY_TYPES.GRAND_ELDRITCH_EMBER]: '上级古灵余烬',
  [CURRENCY_TYPES.EXCEPTIONAL_ELDRITCH_EMBER]: '卓越古灵余烬',
  [CURRENCY_TYPES.LESSER_ELDRITCH_ICHOR]: '次级古灵溶液',
  [CURRENCY_TYPES.GREATER_ELDRITCH_ICHOR]: '高级古灵溶液',
  [CURRENCY_TYPES.GRAND_ELDRITCH_ICHOR]: '上级古灵溶液',
  [CURRENCY_TYPES.EXCEPTIONAL_ELDRITCH_ICHOR]: '卓越古灵溶液'
}

// 制作模式
export const CRAFT_MODES = {
  ALTERATION: 'alteration',  // 改造石模式
  CHAOS: 'chaos',            // 混沌模式
  ALCHEMY: 'alchemy'         // 点金石模式
}

// 制作模式中文名称
export const CRAFT_MODE_NAMES = {
  [CRAFT_MODES.ALTERATION]: '改造石模式',
  [CURRENCY_TYPES.CHAOS]: '混沌模式',
  [CRAFT_MODES.ALCHEMY]: '点金石模式'
}

// 物品稀有度
export const ITEM_RARITY = {
  NORMAL: '普通',
  MAGIC: '魔法',
  RARE: '稀有',
  UNIQUE: '传奇'
}

// 插槽颜色
export const SOCKET_COLORS = {
  RED: 'R',
  GREEN: 'G',
  BLUE: 'B'
}
