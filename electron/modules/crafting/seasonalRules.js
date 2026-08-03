import { SEASON_BASELINE } from '../../../shared/seasonBaseline.js'

export const CURRENT_RULESET = SEASON_BASELINE

export const CURRENT_EQUIPMENT_CURRENCIES = Object.freeze([
  {
    id: 'currency:volatile-vaal-orb', name: '无常瓦尔宝珠',
    effect: '不可预测地随机化传奇装备上的随机词缀数值并将其腐化，或者直接摧毁物品。3.29 起也可作用于没有可超范围数值的物品。',
    requirements: '一件未腐化的传奇装备',
    unsupportedReason: '当前模拟器不提供传奇装备底材和可缩放词缀模型，不能准确生成或摧毁目标'
  },
  {
    id: 'currency:scrying-orb', name: '占卜球',
    effect: 'S30 新通货；与永火之咒赛季的海底航行及物品处理机制相关。',
    requirements: 'S30 对应的赛季对象',
    unsupportedReason: '当前装备状态模型不包含永火之咒赛季对象，不能准确执行该通货'
  },
  {
    id: 'currency:enshrouding-crystal', name: '雾隐水晶',
    effect: 'S30 的卡鲁、帝国、瓦尔、圣堂与马拉克斯水晶可雾隐对应来源的传奇装备。',
    requirements: '对应来源的传奇装备及永恒斗争之域转化流程',
    unsupportedReason: '当前模拟器不提供传奇装备、雾隐词缀和永恒斗争转化状态，不能准确执行'
  },
  {
    id: 'currency:allflame-ducat', name: '永火纪念币',
    effect: 'S30 海底探索获得的纪念币可按其类型扭曲或改造物品。',
    requirements: '与纪念币类型匹配的 S30 物品状态',
    unsupportedReason: '当前模拟器未建模 S30 纪念币类型及其结果池，不能用近似结果替代'
  }
])
