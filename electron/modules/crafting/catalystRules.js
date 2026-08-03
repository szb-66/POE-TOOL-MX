import { qualityGainForItemLevel } from './equipmentPropertyRules.js'
import { SEASON_BASELINE } from '../../../shared/seasonBaseline.js'

export const CATALYST_MODEL_VERSION = `${SEASON_BASELINE.game}-${SEASON_BASELINE.patch}-v1`

export const CATALYST_DEFINITIONS = Object.freeze([
  ['abrasive', '研磨催化剂', 'attack', '攻击'],
  ['accelerating', '加速催化剂', 'speed', '速度'],
  ['fertile', '丰沃催化剂', 'life-mana', '生命与魔力'],
  ['imbued', '灌注催化剂', 'caster', '施法'],
  ['intrinsic', '内在催化剂', 'attribute', '属性'],
  ['noxious', '有害催化剂', 'physical-chaos-damage', '物理与混沌伤害'],
  ['prismatic', '棱光催化剂', 'resistance', '抗性'],
  ['tempering', '回火催化剂', 'defences', '防御'],
  ['turbulent', '猛烈催化剂', 'elemental-damage', '元素伤害'],
  ['unstable', '不稳定的催化剂', 'critical', '暴击'],
  ['sinistral', '左旋催化剂', 'prefix', '前缀'],
  ['dextral', '右旋催化剂', 'suffix', '后缀']
].map(([id, name, type, label]) => Object.freeze({
  id: `currency:catalyst-${id}`,
  resourceId: `currency:catalyst-${id}`,
  name,
  type,
  label
})))

export const NON_TAINTED_CATALYST_TYPES = Object.freeze(CATALYST_DEFINITIONS.map((entry) => entry.type))
export const CATALYST_LABELS = Object.freeze(Object.fromEntries(CATALYST_DEFINITIONS.map((entry) => [entry.type, entry.label])))
export const JEWELLERY_ITEM_CLASSES = Object.freeze(['Ring', 'Amulet', 'Belt'])

function tagIds(entry) {
  return new Set((entry?.displayTags ?? []).map((tag) => String(tag?.id ?? tag)))
}

export function catalystMatchesEntry(type, entry) {
  if (!type || !entry) return false
  if (type === 'prefix' || type === 'suffix') return entry.affixType === type
  const tags = tagIds(entry)
  if (type === 'attack' || type === 'speed' || type === 'caster' || type === 'attribute' || type === 'resistance' || type === 'defences' || type === 'critical') return tags.has(type)
  if (type === 'life-mana') return tags.has('life') || tags.has('mana')
  if (type === 'physical-chaos-damage') return tags.has('damage') && (tags.has('physical') || tags.has('chaos'))
  if (type === 'elemental-damage') return tags.has('damage') && tags.has('elemental')
  return false
}

function decimalPlaces(value) {
  const source = String(value)
  return source.includes('.') ? source.split('.')[1].length : 0
}

export function catalysedValue(value, amount) {
  const number = Number(value)
  if (!Number.isFinite(number)) return number
  const precision = 10 ** decimalPlaces(number)
  const magnitude = Math.floor(Math.abs(number) * (1 + Math.max(0, Number(amount) || 0) / 100) * precision + 1e-9) / precision
  return number < 0 ? -magnitude : magnitude
}

export function renderCatalysedText(text, values = []) {
  let index = 0
  return String(text || '').replace(/\([+-]?\d+(?:\.\d+)?\s*[—–-]\s*[+-]?\d+(?:\.\d+)?\)|[+-]?\d+(?:\.\d+)?\s*[—–-]\s*[+-]?\d+(?:\.\d+)?|#/g, () => String(values[index++] ?? '#'))
}

export function displayedCatalystEntry(entry, quality) {
  const matched = catalystMatchesEntry(quality?.type, entry)
  const displayValues = (entry?.rolledValues ?? []).map((value) => matched ? catalysedValue(value, quality?.amount) : value)
  return {
    ...entry,
    catalystMatched: matched,
    displayValues,
    displayText: renderCatalysedText(entry?.text, displayValues)
  }
}

export function applyCatalystQuality(current, type, itemLevel, rng = Math.random) {
  if (!NON_TAINTED_CATALYST_TYPES.includes(type)) throw new Error(`未知催化剂品质类型：${type}`)
  const amount = current?.type === type ? Math.max(0, Number(current.amount) || 0) : 0
  return { type, amount: Math.min(20, amount + qualityGainForItemLevel(itemLevel, rng)) }
}

export function rollTaintedCatalyst(rng = Math.random) {
  const type = NON_TAINTED_CATALYST_TYPES[Math.min(NON_TAINTED_CATALYST_TYPES.length - 1, Math.floor(rng() * NON_TAINTED_CATALYST_TYPES.length))]
  return { type, amount: 1 + Math.min(19, Math.floor(rng() * 20)) }
}

export function inferCatalystDisplayTags(text = '') {
  const source = String(text)
  const tags = new Set()
  if (/攻击/.test(source)) tags.add('attack')
  if (/速度/.test(source)) tags.add('speed')
  if (/生命/.test(source)) tags.add('life')
  if (/魔力/.test(source)) tags.add('mana')
  if (/施法|法术/.test(source)) tags.add('caster')
  if (/力量|敏捷|智慧|属性/.test(source)) tags.add('attribute')
  if (/物理/.test(source)) tags.add('physical')
  if (/混沌/.test(source)) tags.add('chaos')
  if (/抗性/.test(source)) tags.add('resistance')
  if (/防御|护甲|闪避|能量护盾/.test(source)) tags.add('defences')
  if (/火焰|冰霜|闪电|元素/.test(source)) tags.add('elemental')
  if (/伤害/.test(source) && !/伤害减免|受到.*伤害|伤害的.*视作/.test(source)) tags.add('damage')
  if (/暴击/.test(source)) tags.add('critical')
  const labels = { attack: '攻击', speed: '速度', life: '生命', mana: '魔力', caster: '施法', attribute: '属性', physical: '物理', chaos: '混沌', resistance: '抗性', defences: '防御', elemental: '元素', damage: '伤害', critical: '暴击' }
  return [...tags].map((id) => ({ id, label: labels[id] }))
}
