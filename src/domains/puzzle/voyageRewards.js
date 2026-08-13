export const VOYAGE_REWARD_STRATEGIES = Object.freeze([
  { id: 'balanced', label: '综合收益', description: '兼顾通货、箱子、怪物密度与硫磺。' },
  { id: 'strongbox', label: '速刷保险箱', description: '优先奥术师、侦探与普通保险箱等即时奖励。' },
  { id: 'rare', label: '稀有怪收益', description: '优先稀有怪数量、附身、众神与精华组合。' },
  { id: 'magic', label: '魔法怪收益', description: '优先至少魔法、魔法怪数量与荒林鬼灵。' },
  { id: 'sulphur', label: '硫磺收益', description: '优先亡者硫磺，适合不灭之火工艺消耗。' }
])

export const VOYAGE_REWARD_MODE_OPTIONS = Object.freeze([
  { id: 'auto', label: '最高收益自动切换', description: '自动比较五种收益策略，并持续采用相对收益最高的一项。' },
  ...VOYAGE_REWARD_STRATEGIES
])

const STRATEGY_WEIGHTS = Object.freeze({
  balanced: { quantity: 5, rarity: 1, pack: 3, sulphur: 4, rare: 4, magic: 2, strongbox: 4, currency: 10, scarab: 6, divination: 6, special: 4, gold: 3 },
  strongbox: { quantity: 4, rarity: 1, pack: 2, sulphur: 3, rare: 2, magic: 1, strongbox: 10, currency: 5, scarab: 4, divination: 4, special: 6, gold: 3 },
  rare: { quantity: 5, rarity: 5, pack: 3, sulphur: 2, rare: 10, magic: 2, strongbox: 2, currency: 8, scarab: 6, divination: 4, special: 4, gold: 2 },
  magic: { quantity: 5, rarity: 4, pack: 4, sulphur: 2, rare: 2, magic: 10, strongbox: 2, currency: 4, scarab: 3, divination: 3, special: 6, gold: 2 },
  sulphur: { quantity: 2, rarity: 1, pack: 2, sulphur: 10, rare: 2, magic: 1, strongbox: 1, currency: 2, scarab: 1, divination: 1, special: 1, gold: 1 }
})

export function normalizeVoyageRewardStrategy(value) {
  return VOYAGE_REWARD_STRATEGIES.some(strategy => strategy.id === value) ? value : 'balanced'
}

export function normalizeVoyageRewardMode(value) {
  return value === 'auto' ? 'auto' : normalizeVoyageRewardStrategy(value)
}

function averageNumbers(line) {
  const ranges = [...line.matchAll(/[（(](-?\d+(?:\.\d+)?)[—–-](-?\d+(?:\.\d+)?)[）)]/g)]
  if (ranges.length) return ranges.reduce((sum, match) => sum + (Number(match[1]) + Number(match[2])) / 2, 0) / ranges.length
  const numbers = [...line.matchAll(/-?\d+(?:\.\d+)?/g)].map(match => Math.abs(Number(match[0])))
  return numbers.length ? numbers[0] : 1
}

function lineScope(line) {
  if (line.includes('所有航行区域')) return 'global'
  if (line.includes('相邻区域') || line.includes('相邻海图')) return 'adjacent'
  return 'self'
}

function lineCategory(line) {
  if (line.includes('词缀数值提高')) return null
  if (/奥术师的保险箱|侦探的保险箱|额外保险箱/.test(line)) return 'strongbox'
  if (/圣甲虫/.test(line)) return 'scarab'
  if (/命运卡组/.test(line)) return 'divination'
  if (/亡者硫磺|死者硫磺/.test(line)) return 'sulphur'
  if (/神圣石|崇高石|剥离石|混沌石|瓦尔宝珠|宝石匠的棱镜|幻色石|后悔石|祝福石|富豪石|远古石|通货/.test(line)) return 'currency'
  if (/物品数量/.test(line)) return 'quantity'
  if (/物品稀有度|找到物品的稀有度/.test(line)) return 'rarity'
  if (/怪物群规模|额外的海兽群|额外的章鱼群|额外的螃蟹群|额外的溺亡者群/.test(line)) return 'pack'
  if (/稀有怪物|被附身|众神词缀|精华囚禁/.test(line)) return 'rare'
  if (/魔法怪物|至少为魔法|荒林鬼灵/.test(line)) return 'magic'
  if (/金币/.test(line)) return 'gold'
  if (/被囚禁的怪物|瓶中信|奇特的鱼|罪魂牢笼|神圣的秘宝|木桶丛|巨型海星|黄金灯笼|宝藏锚|女神祭坛|海盗储物箱|盐水腐朽袭掠队|污秽蟹群|船长灾星|阿兹里之息|友善水母|噬魂者|不被消耗|不会减少|药剂有|无法掉落装备|辅助技能石|经验值|物品有 .*几率分裂|传奇戒指|传奇护身符|传奇腰带/.test(line)) return 'special'
  return null
}

function lineMagnitude(line, category, connections) {
  let value = averageNumbers(line)
  if (line.includes('荒林鬼灵')) value /= 1000
  else if (line.includes('%')) value /= 10
  if (category === 'currency') {
    if (line.includes('神圣石')) value *= 10
    else if (line.includes('崇高石') || line.includes('剥离石') || line.includes('远古石')) value *= 6
    else if (/富豪石|混沌石|瓦尔宝珠|宝石匠的棱镜/.test(line)) value *= 2
  }
  if (line.includes('奥术师的保险箱')) value *= 2.5
  else if (line.includes('侦探的保险箱')) value *= 1.5
  if (line.includes('每条连接')) value *= Math.max(0, Number(connections) || 0)
  if (line.includes('降低')) value *= -1
  return value
}

export function scoreVoyageMod(mod, strategy = 'balanced', { connections = 0 } = {}) {
  const weights = STRATEGY_WEIGHTS[normalizeVoyageRewardStrategy(strategy)]
  const result = { self: 0, adjacent: 0, global: 0, total: 0 }
  for (const line of Array.isArray(mod?.lines) ? mod.lines : []) {
    const category = lineCategory(line)
    if (!category) continue
    const scope = lineScope(line)
    result[scope] += (weights[category] || 0) * lineMagnitude(line, category, connections)
  }
  result.total = result.self + result.adjacent + result.global
  return result
}

export function voyageModEffect(mod) {
  let effect = 0
  for (const line of Array.isArray(mod?.lines) ? mod.lines : []) {
    if (line.includes('词缀数值提高')) effect += averageNumbers(line) / 100
  }
  return effect
}
