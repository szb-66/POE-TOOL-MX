import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CATALYST_DEFINITIONS,
  NON_TAINTED_CATALYST_TYPES,
  applyCatalystQuality,
  catalysedValue,
  catalystMatchesEntry,
  displayedCatalystEntry,
  inferCatalystDisplayTags,
  rollTaintedCatalyst
} from '../electron/modules/crafting/catalystRules.js'

const entry = (affixType, ids, values = [79], text = '+(70—79) 最大生命') => ({
  affixType, displayTags: ids.map((id) => ({ id, label: id })), rolledValues: values, text
})

test('3.28 催化剂定义包含十二种非污秽类型且 ID 唯一', () => {
  assert.equal(CATALYST_DEFINITIONS.length, 12)
  assert.equal(NON_TAINTED_CATALYST_TYPES.length, 12)
  assert.equal(new Set(CATALYST_DEFINITIONS.map((item) => item.id)).size, 12)
  assert.ok(CATALYST_DEFINITIONS.some((item) => item.type === 'prefix' && item.name === '左旋催化剂'))
  assert.ok(CATALYST_DEFINITIONS.some((item) => item.type === 'suffix' && item.name === '右旋催化剂'))
})

test('催化标签要求伤害复合标签并区分前后缀', () => {
  assert.equal(catalystMatchesEntry('life-mana', entry('prefix', ['life'])), true)
  assert.equal(catalystMatchesEntry('physical-chaos-damage', entry('suffix', ['chaos', 'resistance'])), false)
  assert.equal(catalystMatchesEntry('physical-chaos-damage', entry('prefix', ['chaos', 'damage'])), true)
  assert.equal(catalystMatchesEntry('elemental-damage', entry('prefix', ['elemental', 'damage'])), true)
  assert.equal(catalystMatchesEntry('prefix', entry('prefix', [])), true)
  assert.equal(catalystMatchesEntry('prefix', entry('suffix', [])), false)
})

test('催化数值按幅度和原精度向下取整且不覆盖原掷值', () => {
  assert.equal(catalysedValue(79, 20), 94)
  assert.equal(catalysedValue(-7, 20), -8)
  assert.equal(catalysedValue(1.2, 20), 1.4)
  const original = entry('prefix', ['life'], [79])
  const displayed = displayedCatalystEntry(original, { type: 'life-mana', amount: 20 })
  assert.deepEqual(original.rolledValues, [79])
  assert.deepEqual(displayed.displayValues, [94])
  assert.match(displayed.displayText, /94/)
})

test('催化展示支持 Vue 响应式代理且不修改原词缀', () => {
  const original = entry('prefix', ['life'], [79])
  const reactiveEntry = new Proxy(original, {})
  const displayed = displayedCatalystEntry(reactiveEntry, { type: 'life-mana', amount: 20 })

  assert.deepEqual(displayed.displayValues, [94])
  assert.equal(displayed.catalystMatched, true)
  assert.deepEqual(original.rolledValues, [79])
})

test('同类型累加、换类型归零重加且污秽结果可复现', () => {
  assert.deepEqual(applyCatalystQuality({ type: 'life-mana', amount: 10 }, 'life-mana', 1, () => 0), { type: 'life-mana', amount: 20 })
  assert.deepEqual(applyCatalystQuality({ type: 'life-mana', amount: 20 }, 'attribute', 100, () => 0), { type: 'attribute', amount: 1 })
  assert.deepEqual(rollTaintedCatalyst(() => 0), { type: NON_TAINTED_CATALYST_TYPES[0], amount: 1 })
  assert.deepEqual(rollTaintedCatalyst(() => 0.999999), { type: NON_TAINTED_CATALYST_TYPES.at(-1), amount: 20 })
})

test('普通底材隐式转换为结构化催化标签', () => {
  assert.deepEqual(inferCatalystDisplayTags('+(20—30) 最大生命').map((tag) => tag.id), ['life'])
  assert.deepEqual(inferCatalystDisplayTags('+(20—30)% 混沌抗性').map((tag) => tag.id), ['chaos', 'resistance'])
  assert.deepEqual(inferCatalystDisplayTags('元素伤害提高 (15—25)%').map((tag) => tag.id), ['elemental', 'damage'])
  assert.equal(inferCatalystDisplayTags('(4—6)% 额外物理伤害减免').some((tag) => tag.id === 'damage'), false)
})
