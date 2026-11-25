export const PSEUDO_RULE_VERSION = 'awakened-poe-trade-3.29.102'
export const PSEUDO_RULE_COMMIT = '91b5a05b14cda3a632a306b5f606ca1cced8b4a9'

// The pseudo rules themselves are provider-independent English references, but
// the overlay shows them next to the localized item text. Keep the display
// labels here so international Chinese/Traditional items do not fall back to
// English aggregate rows.
export const PSEUDO_RULE_DISPLAY_LABELS = Object.freeze({
  '+#% total Elemental Resistance': { cn: '+#% 总元素抗性', tw: '+#% 總元素抗性' },
  '+#% total to Fire Resistance': { cn: '+#% 总火焰抗性', tw: '+#% 總火焰抗性' },
  '+#% total to Cold Resistance': { cn: '+#% 总冰霜抗性', tw: '+#% 總冰冷抗性' },
  '+#% total to Lightning Resistance': { cn: '+#% 总闪电抗性', tw: '+#% 總閃電抗性' },
  '+#% total to Chaos Resistance': { cn: '+#% 总混沌抗性', tw: '+#% 總混沌抗性' },
  '+# total to all Attributes': { cn: '+# 总全属性', tw: '+# 總全能力' },
  '+# total to Strength': { cn: '+# 总力量', tw: '+# 總力量' },
  '+# total to Dexterity': { cn: '+# 总敏捷', tw: '+# 總敏捷' },
  '+# total to Intelligence': { cn: '+# 总智慧', tw: '+# 總智慧' },
  '+# total maximum Life': { cn: '+# 总最大生命', tw: '+# 總最大生命' },
  '+# total maximum Mana': { cn: '+# 总最大魔力', tw: '+# 總最大魔力' },
  '#% total increased maximum Energy Shield': { cn: '最大能量护盾总共提高 #%', tw: '增加 #% 總最大能量護盾' },
  '+# total maximum Energy Shield': { cn: '+# 总最大能量护盾', tw: '+# 總最大能量護盾' },
  '+#% total Attack Speed': { cn: '+#% 总攻击速度', tw: '+#% 總攻擊速度' },
  '+#% total Cast Speed': { cn: '+#% 总施法速度', tw: '+#% 總施放速度' },
  '#% increased Movement Speed': { cn: '移动速度提高 #%', tw: '增加 #% 移動速度' },
  '#% total increased Physical Damage': { cn: '物理伤害总共提高 #%', tw: '增加 #% 總物理傷害' },
  '+#% Global Critical Strike Chance': { cn: '+#% 全域暴击率', tw: '+#% 全域暴擊率' },
  '+#% total Critical Strike Chance for Spells': { cn: '+#% 总法术暴击率', tw: '+#% 總法術暴擊率' },
  '+#% Global Critical Strike Multiplier': { cn: '+#% 全域暴击伤害加成', tw: '+#% 全域暴擊加成' },
  '#% increased Elemental Damage': { cn: '元素伤害提高 #%', tw: '增加 #% 元素傷害' },
  '#% increased Lightning Damage': { cn: '闪电伤害提高 #%', tw: '增加 #% 閃電傷害' },
  '#% increased Cold Damage': { cn: '冰霜伤害提高 #%', tw: '增加 #% 冰冷傷害' },
  '#% increased Fire Damage': { cn: '火焰伤害提高 #%', tw: '增加 #% 火焰傷害' },
  '#% increased Spell Damage': { cn: '法术伤害提高 #%', tw: '增加 #% 法術傷害' },
  '#% increased Lightning Spell Damage': { cn: '#% 法术技能闪电伤害提高', tw: '#% 法術技能閃電傷害提高' },
  '#% increased Cold Spell Damage': { cn: '#% 法术技能冰霜伤害提高', tw: '#% 法術技能冰霜傷害提高' },
  '#% increased Fire Spell Damage': { cn: '#% 法术技能火焰伤害提高', tw: '#% 法術技能火焰傷害提高' },
  '#% increased Elemental Damage with Attack Skills': { cn: '攻击技能的元素伤害提高 #%', tw: '攻擊技能增加 #% 元素傷害' },
  '#% increased Burning Damage': { cn: '燃烧伤害提高 #%', tw: '增加 #% 燃燒傷害' },
  '# Life Regenerated per Second': { cn: '# 每秒生命回复', tw: '# 每秒生命回復' },
  '#% of Life Regenerated per Second': { cn: '#% 每秒生命回复', tw: '#% 每秒生命回復' },
  '#% of Physical Attack Damage Leeched as Life': { cn: '物理攻击伤害的 #% 会转化为生命偷取', tw: '#% 的物理攻擊傷害偷取生命' },
  '#% of Physical Attack Damage Leeched as Mana': { cn: '物理攻击伤害的 #% 转化为魔力偷取', tw: '#% 物理攻擊傷害偷取魔力' },
  '#% increased Mana Regeneration Rate': { cn: '魔力再生速度提高 #%', tw: '增加 #% 魔力恢復率' }
})

export function pseudoRuleDisplayLabel(target, language) {
  const labels = PSEUDO_RULE_DISPLAY_LABELS[target]
  if (!labels) return ''
  if (language === 'tw') return labels.tw || labels.cn || ''
  if (language === 'cn') return labels.cn || ''
  return ''
}

const resistances = [
  ['+#% to All Resistances', ['fire', 'cold', 'lightning'], true],
  ['+#% to all Elemental Resistances', ['fire', 'cold', 'lightning'], false],
  ['+#% to Fire Resistance', ['fire'], false],
  ['+#% to Cold Resistance', ['cold'], false],
  ['+#% to Lightning Resistance', ['lightning'], false],
  ['+#% to Fire and Lightning Resistances', ['fire', 'lightning'], false],
  ['+#% to Fire and Cold Resistances', ['fire', 'cold'], false],
  ['+#% to Cold and Lightning Resistances', ['cold', 'lightning'], false],
  ['+#% to Chaos Resistance', [], true],
  ['+#% to Fire and Chaos Resistances', ['fire'], true],
  ['+#% to Cold and Chaos Resistances', ['cold'], true],
  ['+#% to Lightning and Chaos Resistances', ['lightning'], true]
]

const attributes = [
  ['+# to all Attributes', ['str', 'dex', 'int']],
  ['+# to Strength', ['str']],
  ['+# to Dexterity', ['dex']],
  ['+# to Intelligence', ['int']],
  ['+# to Strength and Intelligence', ['str', 'int']],
  ['+# to Strength and Dexterity', ['str', 'dex']],
  ['+# to Dexterity and Intelligence', ['dex', 'int']]
]

const source = (ref, options = {}) => ({ ref, ...options })
const rule = (target, sources, options = {}) => ({ target, sources, ...options })

export const PSEUDO_RULES = Object.freeze([
  rule('+#% total Elemental Resistance', resistances.filter(([, elements]) => elements.length).map(([ref, elements]) => source(ref, { multiplier: elements.length })), { defaultEnabled: true }),
  rule('+#% total to Fire Resistance', resistances.filter(([, elements]) => elements.includes('fire')).map(([ref]) => source(ref)), { group: 'to_x_ele_res' }),
  rule('+#% total to Cold Resistance', resistances.filter(([, elements]) => elements.includes('cold')).map(([ref]) => source(ref)), { group: 'to_x_ele_res' }),
  rule('+#% total to Lightning Resistance', resistances.filter(([, elements]) => elements.includes('lightning')).map(([ref]) => source(ref)), { group: 'to_x_ele_res' }),
  rule('+#% total to Chaos Resistance', resistances.filter(([, , chaos]) => chaos).map(([ref]) => source(ref)), { defaultEnabled: true, disableWhenOnlyCrafted: true }),
  rule('+# total to all Attributes', [source('+# to all Attributes')], { group: 'to_all_attrs' }),
  rule('+# total to Strength', attributes.filter(([, values]) => values.includes('str')).map(([ref]) => source(ref)), { group: 'to_x_attr' }),
  rule('+# total to Dexterity', attributes.filter(([, values]) => values.includes('dex')).map(([ref]) => source(ref)), { group: 'to_x_attr' }),
  rule('+# total to Intelligence', attributes.filter(([, values]) => values.includes('int')).map(([ref]) => source(ref)), { group: 'to_x_attr' }),
  rule('+# total maximum Life', [source('+# to maximum Life', { required: true }), ...attributes.filter(([, values]) => values.includes('str')).map(([ref]) => source(ref, { multiplier: 0.5 }))], { defaultEnabled: true }),
  rule('+# total maximum Mana', [source('+# to maximum Mana', { required: true }), ...attributes.filter(([, values]) => values.includes('int')).map(([ref]) => source(ref, { multiplier: 0.5 }))]),
  rule('#% total increased maximum Energy Shield', [source('#% increased maximum Energy Shield')]),
  rule('+# total maximum Energy Shield', [source('+# to maximum Energy Shield')]),
  rule('+#% total Attack Speed', [source('#% increased Attack Speed')]),
  rule('+#% total Cast Speed', [source('#% increased Cast Speed')]),
  rule('#% increased Movement Speed', [source('#% increased Movement Speed')]),
  rule('#% total increased Physical Damage', [source('#% increased Global Physical Damage')]),
  rule('+#% Global Critical Strike Chance', [source('#% increased Global Critical Strike Chance')], { group: 'global_crit_chance' }),
  rule('+#% total Critical Strike Chance for Spells', [source('#% increased Spell Critical Strike Chance', { required: true }), source('#% increased Global Critical Strike Chance')], { replaces: 'global_crit_chance' }),
  rule('+#% Global Critical Strike Multiplier', [source('+#% to Global Critical Strike Multiplier')]),
  rule('#% increased Elemental Damage', [source('#% increased Elemental Damage')], { group: 'incr_ele_dmg' }),
  rule('#% increased Lightning Damage', [source('#% increased Lightning Damage', { required: true }), source('#% increased Elemental Damage')], { replaces: 'incr_ele_dmg' }),
  rule('#% increased Cold Damage', [source('#% increased Cold Damage', { required: true }), source('#% increased Elemental Damage')], { replaces: 'incr_ele_dmg' }),
  rule('#% increased Fire Damage', [source('#% increased Fire Damage', { required: true }), source('#% increased Elemental Damage')], { group: 'incr_fire_dmg', replaces: 'incr_ele_dmg' }),
  rule('#% increased Spell Damage', [source('#% increased Spell Damage')], { group: 'incr_spell_dmg' }),
  rule('#% increased Lightning Spell Damage', [source('#% increased Lightning Spell Damage', { required: true }), source('#% increased Spell Damage')], { replaces: 'incr_spell_dmg' }),
  rule('#% increased Cold Spell Damage', [source('#% increased Cold Spell Damage', { required: true }), source('#% increased Spell Damage')], { replaces: 'incr_spell_dmg' }),
  rule('#% increased Fire Spell Damage', [source('#% increased Fire Spell Damage', { required: true }), source('#% increased Spell Damage')], { replaces: 'incr_spell_dmg' }),
  rule('#% increased Elemental Damage with Attack Skills', [source('#% increased Elemental Damage with Attack Skills', { required: true }), source('#% increased Elemental Damage')], { replaces: 'incr_ele_dmg' }),
  rule('#% increased Burning Damage', [source('#% increased Burning Damage', { required: true }), source('#% increased Fire Damage'), source('#% increased Elemental Damage')], { replaces: 'incr_fire_dmg' }),
  rule('# Life Regenerated per Second', [source('Regenerate # Life per second')]),
  rule('#% of Life Regenerated per Second', [source('Regenerate #% of Life per second')]),
  rule('#% of Physical Attack Damage Leeched as Life', [source('#% of Physical Attack Damage Leeched as Life')]),
  rule('#% of Physical Attack Damage Leeched as Mana', [source('#% of Physical Attack Damage Leeched as Mana')]),
  rule('#% increased Mana Regeneration Rate', [source('#% increased Mana Regeneration Rate')])
])

export function createVersionedPseudoRules() {
  return {
    pseudoRuleVersion: PSEUDO_RULE_VERSION,
    pseudoRuleSource: {
      project: 'Awakened PoE Trade',
      commit: PSEUDO_RULE_COMMIT,
      file: 'renderer/src/web/price-check/filters/pseudo/index.ts'
    },
    pseudoRules: structuredClone(PSEUDO_RULES)
  }
}
