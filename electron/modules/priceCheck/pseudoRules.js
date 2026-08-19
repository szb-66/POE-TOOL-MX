export const PSEUDO_RULE_VERSION = 'awakened-poe-trade-3.29.102'
export const PSEUDO_RULE_COMMIT = '91b5a05b14cda3a632a306b5f606ca1cced8b4a9'

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
