export const MIRAGE_RULESET = Object.freeze({ game: 'poe1', patch: '3.28', league: 'Mirage', locale: 'zh-CN' })

export const MIRAGE_EQUIPMENT_CURRENCIES = Object.freeze([
  {
    id: 'currency:refracting-fog', name: '折射之雾',
    effect: '替换一颗星团珠宝上的小型天赋技能附魔；现有显式词缀和天赋数量保持不变。',
    requirements: '一颗星团珠宝',
    unsupportedReason: '当前状态模型尚未保存星团珠宝的小型天赋附魔及其对应词缀池，不能准确替换'
  },
  {
    id: 'currency:volatile-vaal-orb', name: '无常瓦尔宝珠',
    effect: '不可预测地随机化传奇装备上的随机词缀数值并将其腐化，或者直接摧毁物品。',
    requirements: '一件未腐化的传奇装备',
    unsupportedReason: '当前模拟器不提供传奇装备底材和可缩放词缀模型，不能准确生成或摧毁目标'
  },
  {
    id: 'currency:coin-of-restoration', name: '复原之硬币（Coin of Restoration）',
    effect: '将一件阿法鲁德传奇物品恢复为其过去的马拉克斯形态。',
    requirements: '五组指定转换中的阿法鲁德传奇物品',
    unsupportedReason: '当前模拟器不提供阿法鲁德与马拉克斯传奇物品状态，不能执行指定传奇转换'
  },
  {
    id: 'currency:coin-of-desecration', name: '玷污之硬币（Coin of Desecration）',
    effect: '将一件马拉克斯传奇物品扭曲为阿法鲁德形态，同时腐化并添加一条腐化固定词缀。',
    requirements: '五组指定转换中的马拉克斯传奇物品',
    unsupportedReason: '当前模拟器不提供对应传奇物品及其腐化固定词缀结果，不能准确执行转换'
  }
])
