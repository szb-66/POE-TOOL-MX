const more = (tags, multiplier = 10, all = []) => ({ mode: 'more', tags, all, multiplier })
const less = (tags, multiplier = 0.15, all = []) => ({ mode: 'less', tags, all, multiplier })
const blocked = (tags, all = []) => ({ mode: 'blocked', tags, all, multiplier: 0 })

export const FOSSIL_TAG_LABELS = {
  fire: '火焰', cold: '冰霜', lightning: '闪电', physical: '物理', chaos: '混沌', life: '生命',
  defences: '防御', elemental: '元素', caster: '施法', attack: '攻击', mana: '魔力', speed: '速度',
  minion: '召唤生物', aura: '光环', curse: '诅咒', drop: '掉落', critical: '暴击', attribute: '属性',
  gem: '宝石', ailment_physical_chaos: '物理或混沌异常状态', tagless: '非标签'
}

export const FOSSIL_DEFINITIONS = [
  { id: 'scorched', name: '炽炎化石', description: '更多火焰属性\n无冰霜属性', rules: [more(['fire']), blocked(['cold'])] },
  { id: 'frigid', name: '冰冽化石', description: '更多冰霜属性\n无火焰属性', rules: [more(['cold']), blocked(['fire'])] },
  { id: 'metallic', name: '金属化石', description: '更多闪电属性\n无物理属性', rules: [more(['lightning']), blocked(['physical'])] },
  { id: 'jagged', name: '锯齿化石', description: '更多物理属性\n无混沌属性', rules: [more(['physical']), blocked(['chaos'])] },
  { id: 'aberrant', name: '畸变化石', description: '更多混沌属性\n无闪电属性', rules: [more(['chaos']), blocked(['lightning'])] },
  { id: 'pristine', name: '原始化石', description: '更多生命词缀\n无防御词缀', rules: [more(['life']), blocked(['defences'])] },
  { id: 'dense', name: '致密化石', description: '更多防御词缀\n无生命词缀', rules: [more(['defences']), blocked(['life'])] },
  { id: 'corroded', name: '腐蚀化石', description: '更多物理异常状态或混沌异常状态词缀\n无元素词缀', rules: [more(['physical', 'chaos'], 10, ['ailment']), blocked(['elemental'])] },
  { id: 'prismatic', name: '五彩化石', description: '更多元素词缀\n无物理异常状态或混沌异常状态词缀', rules: [more(['elemental'], 6), blocked(['physical', 'chaos'], ['ailment'])] },
  { id: 'aetheric', name: '以太化石', description: '更多施法属性\n更少攻击属性', rules: [more(['caster']), less(['attack'])] },
  { id: 'serrated', name: '狼牙化石', description: '更多攻击属性\n更少施法属性', rules: [more(['attack']), less(['caster'])] },
  { id: 'lucent', name: '透光化石', description: '更多魔力属性\n无速度属性', rules: [more(['mana']), blocked(['speed'])] },
  { id: 'shuddering', name: '震颤化石', description: '更多速度属性\n无魔力属性', rules: [more(['speed']), blocked(['mana'])] },
  { id: 'bound', name: '绑缚化石', description: '更多召唤生物、光环或诅咒词缀', rules: [more(['minion', 'aura', 'curse'])] },
  { id: 'opulent', name: '丰裕化石', description: '更多掉落属性\n无非标签属性', rules: [more(['drop']), blocked(['tagless'])] },
  { id: 'deft', name: '机巧化石', description: '更多暴击词缀\n没有属性词缀', rules: [more(['critical']), blocked(['attribute'])] },
  { id: 'fundamental', name: '根基化石', description: '更多属性词缀\n没有暴击词缀', rules: [more(['attribute']), blocked(['critical'])] },
  { id: 'faceted', name: '棱面化石', description: '更多宝石词缀', rules: [more(['gem'])], special: 'faceted' },
  { id: 'bloodstained', name: '溅血化石', description: '重铸显式词缀\n获得一条腐化固定词缀并使物品腐化', rules: [], special: 'bloodstained' },
  { id: 'hollow', name: '镂空化石', description: '具有深渊插槽', rules: [], special: 'hollow' },
  { id: 'fractured', name: '分裂化石', description: '产生一个分裂副本\n不能用于势力、追忆、破裂、已分裂或附魔物品', rules: [], special: 'fractured' },
  { id: 'glyphic', name: '雕刻化石', description: '具有腐化的精华属性', rules: [], special: 'glyphic' },
  { id: 'tangled', name: '纠缠化石', description: '大幅增加一种随机词缀出现的几率\n并阻止另一种随机词缀出现\n插满共振器就会解开它们的效果', rules: [], special: 'tangled' },
  { id: 'sanctified', name: '圣洁化石', description: '数字属性值特别幸运\n高等级属性变得更普通', rules: [], special: 'sanctified' },
  { id: 'gilded', name: '镶金化石', description: '物品会被商贩高价购买', rules: [], special: 'gilded' }
].map((entry) => ({ supported: true, unsupportedReason: '', ...entry }))

export const CHAOTIC_RESONATORS = [
  ['primitive', '原始混乱共振器', 1], ['potent', '强能混乱共振器', 2],
  ['powerful', '巨能混乱共振器', 3], ['prime', '威能混乱共振器', 4]
].map(([id, name, sockets]) => ({ id, name, sockets, description: '用新的随机属性来重铸一个稀有物品' }))

function ruleMatches(modifier, rule) {
  const tags = new Set(modifier.tags ?? [])
  const hasAll = (rule.all ?? []).every((tag) => tags.has(tag))
  if (!hasAll) return false
  if (rule.tags?.includes('tagless')) return tags.size === 0
  return !(rule.tags?.length) || rule.tags.some((tag) => tags.has(tag))
}

export function fossilWeightMultiplier(modifier, tier, fossils, tangled = null) {
  const rules = fossils.flatMap((entry) => entry.rules ?? [])
  if (tangled?.blockedTag) rules.push(blocked([tangled.blockedTag]))
  if (rules.some((rule) => rule.mode === 'blocked' && ruleMatches(modifier, rule))) return 0
  let multiplier = 1
  for (const rule of rules) {
    if (rule.mode !== 'blocked' && ruleMatches(modifier, rule)) multiplier *= rule.multiplier
  }
  if (tangled?.moreTag && ruleMatches(modifier, more([tangled.moreTag]))) multiplier *= 10
  if (fossils.some((entry) => entry.special === 'sanctified')) multiplier *= 0.6 + Math.max(1, Number(tier.requiredLevel) || 1) / 100
  return multiplier
}

export function createFossilPoolTransform(fossils, tangled = null) {
  const hasFaceted = fossils.some((entry) => entry.special === 'faceted')
  return (pool) => pool.map((entry) => {
    if (entry.modifier.source === 'delve' && (!hasFaceted || !entry.modifier.tags.includes('gem'))) return { ...entry, weight: 0 }
    return { ...entry, weight: entry.weight * fossilWeightMultiplier(entry.modifier, entry.tier, fossils, tangled) }
  }).filter((entry) => entry.weight > 0)
}

export function fossilPoolStats(pool, fossil) {
  let moreCount = 0
  let lessCount = 0
  let blockedCount = 0
  for (const entry of pool) {
    for (const rule of fossil.rules ?? []) {
      if (!ruleMatches(entry.modifier, rule)) continue
      if (rule.mode === 'more') moreCount += 1
      else if (rule.mode === 'less') lessCount += 1
      else if (rule.mode === 'blocked') blockedCount += 1
    }
  }
  return { moreCount, lessCount, blockedCount }
}

export function createFossilCrafts() {
  return [
    ...FOSSIL_DEFINITIONS.map((definition) => ({
      id: `craft:fossil:${definition.id}`, provider: 'fossil', name: definition.name,
      effectKind: definition.special || 'fossil_weight', itemClasses: [],
      cost: [{ resourceId: `fossil:${definition.id}`, resourceName: definition.name, amount: 1 }],
      params: structuredClone(definition)
    })),
    ...CHAOTIC_RESONATORS.map((definition) => ({
      id: `craft:resonator:${definition.id}`, provider: 'fossil', name: definition.name,
      effectKind: 'chaotic_resonator', itemClasses: [],
      cost: [{ resourceId: `resonator:${definition.id}`, resourceName: definition.name, amount: 1 }],
      params: structuredClone(definition)
    }))
  ]
}
