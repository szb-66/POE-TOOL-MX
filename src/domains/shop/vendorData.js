/** 国服 PoE 1 商店正则生成器的离线选项快照。 */

import { SEASON_BASELINE } from '../../../shared/seasonBaseline.js'

export const VENDOR_DATA_META = Object.freeze({
  locale: 'zh-CN',
  gameVersion: `${SEASON_BASELINE.season} / POE1 ${SEASON_BASELINE.patch}`,
  updatedAt: SEASON_BASELINE.releasedAt,
  source: 'S30 国服客户端商店文本离线快照与开发版语料回归'
})

export const THREE_LINK_OPTIONS = Object.freeze([
  { id: 'rr_any', label: '红红任意', preview: 'RR*', expression: 'r-r-|r-.-r|-r-r' },
  { id: 'gg_any', label: '绿绿任意', preview: 'GG*', expression: 'g-g-|g-.-g|-g-g' },
  { id: 'bb_any', label: '蓝蓝任意', preview: 'BB*', expression: 'b-b-|b-.-b|-b-b' },
  { id: 'rrr', label: '三红', preview: 'RRR', expression: 'r-r-r' },
  { id: 'rrg', label: '两红一绿', preview: 'RRG', expression: 'r-r-g|r-g-r|g-r-r' },
  { id: 'rrb', label: '两红一蓝', preview: 'RRB', expression: 'r-r-b|r-b-r|b-r-r' },
  { id: 'ggg', label: '三绿', preview: 'GGG', expression: 'g-g-g' },
  { id: 'ggr', label: '两绿一红', preview: 'GGR', expression: 'g-g-r|g-r-g|r-g-g' },
  { id: 'ggb', label: '两绿一蓝', preview: 'GGB', expression: 'g-g-b|g-b-g|b-g-g' },
  { id: 'bbb', label: '三蓝', preview: 'BBB', expression: 'b-b-b' },
  { id: 'bbr', label: '两蓝一红', preview: 'BBR', expression: 'b-b-r|b-r-b|r-b-b' },
  { id: 'bbg', label: '两蓝一绿', preview: 'BBG', expression: 'b-b-g|b-g-b|g-b-b' },
  { id: 'rgb', label: '红绿蓝', preview: 'RGB', expression: 'r-g-b|r-b-g|g-r-b|g-b-r|b-r-g|b-g-r' },
  { id: 'r_any_any', label: '至少一红', preview: 'R**', expression: 'r-.-.|.-r-.|.-.-r' },
  { id: 'g_any_any', label: '至少一绿', preview: 'G**', expression: 'g-.-.|.-g-.|.-.-g' },
  { id: 'b_any_any', label: '至少一蓝', preview: 'B**', expression: 'b-.-.|.-b-.|.-.-b' }
])

export const TWO_LINK_OPTIONS = Object.freeze([
  { id: 'rr', label: '红红', preview: 'RR', expression: 'r-r' },
  { id: 'gg', label: '绿绿', preview: 'GG', expression: 'g-g' },
  { id: 'bb', label: '蓝蓝', preview: 'BB', expression: 'b-b' },
  { id: 'rb', label: '红蓝', preview: 'RB', expression: 'r-b|b-r' },
  { id: 'gr', label: '绿红', preview: 'GR', expression: 'g-r|r-g' },
  { id: 'bg', label: '蓝绿', preview: 'BG', expression: 'b-g|g-b' }
])

export const ANY_LINK_OPTIONS = Object.freeze([
  { id: 'any_colored_two', label: '任意双色相连', expression: 'r-g|g-r|r-b|b-r|g-b|b-g' },
  { id: 'any_colored_three', label: '任意三色相连', expression: 'r-g-b|r-b-g|g-r-b|g-b-r|b-r-g|b-g-r' },
  { id: 'any_three', label: '任意三连', expression: '-[rgbw]-' },
  { id: 'any_four', label: '任意四连', expression: '(-[rgbw]){3}' },
  { id: 'any_five', label: '任意五连', expression: '(-[rgbw]){4}' },
  { id: 'any_six', label: '任意六连', expression: '(-[rgbw]){5}' },
  { id: 'any_six_socket', label: '任意六孔', expression: '([rgbw][ -]){5}[rgbw]' }
])

export const MOVEMENT_OPTIONS = Object.freeze([
  { id: 'movement_10', label: '移动速度提高 10%', expression: '移动速度.*10%' },
  { id: 'movement_15', label: '移动速度提高 15%', expression: '移动速度.*15%' }
])

export const PLUS_GEM_OPTIONS = Object.freeze([
  { id: 'plus_any', label: '+1 任意法术技能石', expression: '所有法术.*技能石等级.*1' },
  { id: 'plus_lightning', label: '+1 闪电法术技能石', expression: '闪电法术.*技能石等级.*1' },
  { id: 'plus_fire', label: '+1 火焰法术技能石', expression: '火焰法术.*技能石等级.*1' },
  { id: 'plus_cold', label: '+1 冰霜法术技能石', expression: '冰霜法术.*技能石等级.*1' },
  { id: 'plus_physical', label: '+1 物理法术技能石', expression: '物理.*法术.*技能石等级.*1' },
  { id: 'plus_chaos', label: '+1 混沌法术技能石', expression: '混沌法术.*技能石等级.*1' }
])

export const DAMAGE_OPTIONS = Object.freeze([
  { id: 'physical_damage', label: '物理伤害提高', expression: '物理伤害提高' },
  { id: 'fire_dot', label: '火焰持续伤害加成', expression: '火焰持续伤害加成' },
  { id: 'cold_dot', label: '冰霜持续伤害加成', expression: '冰霜持续伤害加成' },
  { id: 'chaos_dot', label: '混沌持续伤害加成', expression: '混沌持续伤害加成' }
])

export const WEAPON_OPTIONS = Object.freeze([
  { id: 'axe', label: '斧', expression: '物品类别:.+斧' },
  { id: 'mace', label: '锤', expression: '物品类别:.+锤' },
  { id: 'sword', label: '剑', expression: '物品类别:.+剑' },
  { id: 'staff', label: '长杖', expression: '物品类别:.+长杖' },
  { id: 'sceptre', label: '权杖', expression: '物品类别:.+权杖' },
  { id: 'claw', label: '爪', expression: '物品类别:.+爪' },
  { id: 'bow', label: '弓', expression: '物品类别:.+弓' },
  { id: 'wand', label: '法杖', expression: '物品类别:.+法杖' },
  { id: 'dagger', label: '匕首', expression: '物品类别:.+匕首' },
  { id: 'shield', label: '盾牌', expression: '物品类别:.+盾牌' }
])

export const VENDOR_OPTION_GROUPS = Object.freeze({
  threeLinks: THREE_LINK_OPTIONS,
  twoLinks: TWO_LINK_OPTIONS,
  anyLinks: ANY_LINK_OPTIONS,
  movement: MOVEMENT_OPTIONS,
  plusGems: PLUS_GEM_OPTIONS,
  damage: DAMAGE_OPTIONS,
  weaponTypes: WEAPON_OPTIONS
})
