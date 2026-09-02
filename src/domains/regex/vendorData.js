import { SEASON_BASELINE } from '../../../shared/seasonBaseline.js'
import { compileCompactExpressions } from './compactExpression.js'

export const VENDOR_DATA_META = Object.freeze({
  locale: 'zh-CN',
  gameVersion: `${SEASON_BASELINE.season} / POE1 ${SEASON_BASELINE.patch}`,
  updatedAt: SEASON_BASELINE.releasedAt,
  source: 'S30 国服客户端商店文本离线快照与开发版语料回归'
})

const sampleFromExpression = expression => expression.replaceAll('.*', '').replaceAll('^', '').replaceAll('$', '')
const option = (id, label, expression, meta = {}) => ({
  id,
  label,
  expression,
  source: meta.source || sampleFromExpression(expression),
  variants: meta.variants || [sampleFromExpression(expression)],
  matchIds: meta.matchIds || [],
  requiredPattern: meta.requiredPattern || ''
})
const group = (id, title, options) => ({ id, title, options })

const rawGroups = [
  group('rarity', '物品稀有度', [
    option('rare', '稀有', '稀有度: 稀有'), option('magic', '魔法', '稀有度: 魔法'), option('normal', '普通', '稀有度: 普通')
  ]),
  group('resistance', '元素抗性', [
    option('res_any', '任意抗性', '抗性', { matchIds: ['res_fire', 'res_cold', 'res_lightning', 'res_chaos'] }), option('res_fire', '火焰', '火焰抗性'), option('res_cold', '冰霜', '冰霜抗性'), option('res_lightning', '闪电', '闪电抗性'), option('res_chaos', '混沌', '混沌抗性')
  ]),
  group('damage', '伤害词缀', [
    option('physical_damage', '物理伤害', '物理伤害'), option('spell_damage', '法术伤害', '法术伤害'), option('elemental_damage', '任意元素伤害', '元素伤害'), option('cold_damage', '冰霜伤害', '冰霜伤害'), option('fire_damage', '火焰伤害', '火焰伤害'), option('lightning_damage', '闪电伤害', '闪电伤害'), option('chaos_damage', '混沌伤害', '混沌伤害'), option('fire_dot', '火焰持续伤害', '火焰持续伤害加成'), option('cold_dot', '冰霜持续伤害', '冰霜持续伤害加成'), option('chaos_dot', '混沌持续伤害', '混沌持续伤害加成')
  ]),
  group('common', '常用词缀', [
    option('plus_any', '+1 任意法术技能石', '所有法术.*技能石等级.*1', { requiredPattern: '1' }), option('plus_lightning', '+1 闪电法术技能石', '闪电法术.*技能石等级.*1', { requiredPattern: '1' }), option('plus_fire', '+1 火焰法术技能石', '火焰法术.*技能石等级.*1', { requiredPattern: '1' }), option('plus_cold', '+1 冰霜法术技能石', '冰霜法术.*技能石等级.*1', { requiredPattern: '1' }), option('plus_physical', '+1 物理法术技能石', '物理.*法术.*技能石等级.*1', { requiredPattern: '1' }), option('plus_chaos', '+1 混沌法术技能石', '混沌法术.*技能石等级.*1', { requiredPattern: '1' }), option('max_life', '最大生命', '最大生命'), option('max_mana', '最大魔力', '最大魔力'), option('item_rarity', '物品稀有度', '物品稀有度')
  ]),
  group('speed', '速度', [option('attack_speed', '攻击速度', '攻击速度'), option('cast_speed', '施法速度', '施法速度')]),
  group('movement', '移动速度', [
    option('movement_any', '任意速度', '移动速度', { matchIds: ['movement_30', 'movement_25', 'movement_20', 'movement_15', 'movement_10'] }), option('movement_30', '移动速度 30%', '移动速度.*30%', { requiredPattern: '30%' }), option('movement_25', '移动速度 25%', '移动速度.*25%', { requiredPattern: '25%' }), option('movement_20', '移动速度 20%', '移动速度.*20%', { requiredPattern: '20%' }), option('movement_15', '移动速度 15%', '移动速度.*15%', { requiredPattern: '15%' }), option('movement_10', '移动速度 10%', '移动速度.*10%', { requiredPattern: '10%' })
  ]),
  group('properties', '物品属性', [option('quality', '品质', '品质:'), option('sockets', '插槽', '插槽:')]),
  group('accessories', '配件', [option('amulet', '项链', '物品类别: 项链'), option('ring', '戒指', '物品类别: 戒指'), option('belt', '腰带', '物品类别: 腰带')]),
  group('oneHanded', '单手武器', [
    option('claw', '爪', '物品类别: 爪'), option('dagger', '匕首', '物品类别: 匕首'), option('wand', '法杖', '物品类别: 法杖'), option('sword', '单手剑', '物品类别: 单手剑'), option('axe', '单手斧', '物品类别: 单手斧'), option('mace', '单手锤', '物品类别: 单手锤'), option('sceptre', '权杖', '物品类别: 权杖')
  ]),
  group('twoHanded', '双手武器', [option('bow', '弓', '物品类别: 弓'), option('two_sword', '双手剑', '物品类别: 双手剑'), option('two_axe', '双手斧', '物品类别: 双手斧'), option('two_mace', '双手锤', '物品类别: 双手锤'), option('staff', '长杖', '物品类别: 长杖')]),
  group('offhand', '副手', [option('quiver', '箭袋', '物品类别: 箭袋'), option('shield', '盾牌', '物品类别: 盾')]),
  group('armour', '护甲', [option('helmet', '头部', '物品类别: 头部'), option('body', '胸甲', '物品类别: 胸甲'), option('boots', '鞋子', '物品类别: 鞋子'), option('gloves', '手套', '物品类别: 手套')])
]

const rawOptions = rawGroups.flatMap(entry => entry.options)
const compactExpressions = compileCompactExpressions(rawOptions.map(entry => ({
  ...entry,
  fallbackExpression: entry.expression
})))

export const VENDOR_REGEX_CORPUS = Object.freeze(rawOptions.map(entry => Object.freeze({
  id: entry.id,
  variants: Object.freeze([...entry.variants]),
  matchIds: Object.freeze([...entry.matchIds])
})))

export const VENDOR_GROUPS = Object.freeze(rawGroups.map(entry => Object.freeze({
  id: entry.id,
  title: entry.title,
  options: Object.freeze(entry.options.map(item => Object.freeze({
    id: item.id,
    label: item.label,
    expression: item.expression,
    compactExpression: compactExpressions.get(item.id),
    variants: Object.freeze([...item.variants]),
    matchIds: Object.freeze([...item.matchIds])
  })))
})))

export const VENDOR_GROUP_MAP = new Map(VENDOR_GROUPS.map(entry => [entry.id, entry]))
