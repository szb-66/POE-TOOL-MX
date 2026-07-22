export const BEASTCRAFT_RULESET = Object.freeze({ game: 'poe1', patch: '3.28', locale: 'zh-CN' })

export const BEAST_INFLUENCE_RECIPES = Object.freeze([
  ['shaper', '塑界者', 'Fenumal Devourer'],
  ['elder', '裂界者', 'Saqawine Blood Viper'],
  ['crusader', '圣战', 'Farric Goliath'],
  ['redeemer', '救赎者', 'Fenumal Queen'],
  ['hunter', '狩猎者', 'Craicic Watcher'],
  ['warlord', '督军', 'Fenumal Scrabbler']
].map(([influence, label, beast]) => ({
  id: `add-${influence}-mod`, influence, label, beast, secondaryBeast: 'Craicic Maw',
  name: `添加一条${label}词缀`, category: 'influence', supported: true
})))

const ASPECTS = [
  ['cat', '猫之势', 'Farrul, First of the Plains'],
  ['avian', '鸟之势', 'Saqawal, First of the Sky'],
  ['crab', '蟹之势', 'Craiceann, First of the Deep'],
  ['spider', '蛛之势', 'Fenumus, First of the Night']
]

export const BEAST_ASPECT_RECIPES = Object.freeze(ASPECTS.flatMap(([aspect, label, beast]) => [20, 30].map((level) => ({
  id: `aspect-${aspect}-${level}`, aspect, label, level, beast,
  secondaryBeast: level === 30 ? 'The Black Mórrígan' : '',
  name: `添加 ${level} 级${label}`, category: 'aspect', supported: true,
  effect: `获得 ${level} 级的主动技能${label}`
}))))

const EXECUTABLE_RECIPES = [
  { id: 'add-prefix-remove-suffix', name: '添加前缀，移除随机后缀', category: 'affix', beast: 'Farric Wolf Alpha', supported: true },
  { id: 'add-suffix-remove-prefix', name: '添加后缀，移除随机前缀', category: 'affix', beast: 'Farric Lynx Alpha', supported: true },
  ...BEAST_INFLUENCE_RECIPES,
  { id: 'add-random-meta', name: '添加随机工艺元词缀', category: 'meta', beast: 'Wild Bristle Matron', supported: true },
  ...BEAST_ASPECT_RECIPES,
  { id: 'split-two', name: '分裂为两件，各获得一半词缀', category: 'split', beast: 'Fenumal Plagued Arachnid', supported: true },
  { id: 'split-three', name: '分裂为三件，每件两条词缀', category: 'split', beast: 'Fenumal Plagued Arachnid', secondaryBeast: 'The Black Mórrígan', supported: true },
  { id: 'create-imprint', name: '创建魔法物品拓印', category: 'state', beast: 'Craicic Chimeral', supported: true },
  { id: 'restore-imprint', name: '使用拓印恢复原物品', category: 'state', beast: 'Imprint', supported: true },
  { id: 'apply-hinekora-lock', name: '对魔法物品应用希内科拉之锁', category: 'state', beast: 'Craicic Chimeral', secondaryBeast: 'The Black Mórrígan', supported: true },
  { id: 'maximum-sockets', name: '改为最大插槽数', category: 'socket', beast: 'Craicic Shield Crab', secondaryBeast: 'The Black Mórrígan', supported: true, effect: '把物品改为当前底材和物品等级允许的最大插槽数' },
  { id: 'maximum-links', name: '改为最大连接数', category: 'socket', beast: 'Craicic Sand Spitter', secondaryBeast: 'The Black Mórrígan', supported: true, effect: '把物品现有的全部插槽连接起来' }
]

const UNSUPPORTED_RECIPES = [
  { id: 'reroll-synthesis-implicit', name: '重骰一条综合隐式', category: 'unsupported', beast: 'Vivid Vulture', unsupportedReason: '当前数据快照没有综合隐式结果池，无法准确重骰' },
  { id: 'transform-talisman', name: '将项链转化为护符', category: 'unsupported', beast: 'Farric Frost Hellion Alpha', unsupportedReason: '当前状态模型没有护符底材与护符隐式结果池' },
  { id: 'reroll-watchers-eye', name: '重骰守望之眼词缀', category: 'unsupported', beast: 'Wild Hellion Alpha', unsupportedReason: '当前模拟器不支持传奇珠宝及守望之眼专用词缀池' }
].map((entry) => ({ ...entry, supported: false }))

export const BEASTCRAFT_RECIPES = Object.freeze([...EXECUTABLE_RECIPES, ...UNSUPPORTED_RECIPES])

export function createAspectAffix(recipe) {
  if (!recipe || recipe.category !== 'aspect') throw new TypeError('需要有效的势技能配方')
  const id = `beast-aspect:${recipe.aspect}:${recipe.level}`
  return {
    goalId: id, modifierId: id, optionId: null, tierId: id,
    groupId: 'beast-aspect', source: 'beast', sourceItemId: recipe.id,
    sourceItemName: recipe.name, fractured: false, veiled: false,
    affixType: 'suffix', name: recipe.label, tierName: `等级 ${recipe.level}`,
    text: recipe.effect, rolledText: recipe.effect, valueRanges: [], rolledValues: [],
    displayTags: [{ id: 'aspect', label: '势技能' }], weight: 0, metaCraft: false
  }
}

export function beastRecipeView(recipe, unavailableReason = '') {
  return {
    ...recipe,
    ruleset: BEASTCRAFT_RULESET,
    requirements: recipe.supported ? '按当前装备状态与配方规则判定' : '当前版本仅提供规则说明',
    description: recipe.effect || recipe.name,
    consequences: recipe.category === 'split' ? '产生多件带 Split 属性的物品，必须选择一件继续制作' : recipe.unsupportedReason || recipe.effect || recipe.name,
    canApply: recipe.supported && !unavailableReason,
    unavailableReason: unavailableReason || recipe.unsupportedReason || ''
  }
}
