import { localizedExpression } from './localizedRegex.js'

// 与现有条件共用稳定 ID；只替换实际复制到搜索框的客户端文本。
const english = Object.freeze({
  rare: 'Rarity: Rare', magic: 'Rarity: Magic', normal: 'Rarity: Normal',
  res_any: 'Resistance', res_fire: 'Fire Resistance', res_cold: 'Cold Resistance', res_lightning: 'Lightning Resistance', res_chaos: 'Chaos Resistance',
  physical_damage: 'Physical Damage', spell_damage: 'Spell Damage', elemental_damage: 'Elemental Damage',
  cold_damage: 'Cold Damage', fire_damage: 'Fire Damage', lightning_damage: 'Lightning Damage', chaos_damage: 'Chaos Damage',
  fire_dot: 'Fire Damage over Time Multiplier', cold_dot: 'Cold Damage over Time Multiplier', chaos_dot: 'Chaos Damage over Time Multiplier',
  plus_any: '\\+1 to Level of all Spell Skill Gems', plus_lightning: '\\+1 to Level of all Lightning Spell Skill Gems',
  plus_fire: '\\+1 to Level of all Fire Spell Skill Gems', plus_cold: '\\+1 to Level of all Cold Spell Skill Gems',
  plus_physical: '\\+1 to Level of all Physical Spell Skill Gems', plus_chaos: '\\+1 to Level of all Chaos Spell Skill Gems',
  max_life: 'maximum Life', max_mana: 'maximum Mana', item_rarity: 'Item Rarity',
  attack_speed: 'Attack Speed', cast_speed: 'Cast Speed', movement_any: 'Movement Speed',
  movement_30: '(^|[^0-9])30% increased Movement Speed', movement_25: '(^|[^0-9])25% increased Movement Speed',
  movement_20: '(^|[^0-9])20% increased Movement Speed', movement_15: '(^|[^0-9])15% increased Movement Speed', movement_10: '(^|[^0-9])10% increased Movement Speed',
  quality: 'Quality:', sockets: 'Sockets:', amulet: 'Item Class: Amulets', ring: 'Item Class: Rings', belt: 'Item Class: Belts',
  claw: 'Item Class: Claws', dagger: 'Item Class: Daggers', wand: 'Item Class: Wands', sword: 'Item Class: One Hand Swords',
  axe: 'Item Class: One Hand Axes', mace: 'Item Class: One Hand Maces', sceptre: 'Item Class: Sceptres',
  bow: 'Item Class: Bows', two_sword: 'Item Class: Two Hand Swords', two_axe: 'Item Class: Two Hand Axes', two_mace: 'Item Class: Two Hand Maces', staff: 'Item Class: Staves',
  quiver: 'Item Class: Quivers', shield: 'Item Class: Shields', helmet: 'Item Class: Helmets', body: 'Item Class: Body Armours', boots: 'Item Class: Boots', gloves: 'Item Class: Gloves'
})

export function localizeVendorGroups(groups, language = 'zh-CN', catalog = null) {
  if (language === 'zh-CN') return groups
  if (language !== 'en') throw new Error('不支持的客户端语言')
  return groups.map(group => ({ ...group, options: group.options.map(item => {
    if (!english[item.id]) throw new Error(`缺少英文商店条件：${item.id}`)
    const localizationText = english[item.id].replace('\\+', '+').replace('(^|[^0-9])', '')
    const localized = localizedExpression(english[item.id], [localizationText], catalog, { includeTemplates: true })
    return { ...item, localizationText, localizationMapped: localized.mapped, expression: localized.expression, compactExpression: localized.expression }
  }) }))
}
