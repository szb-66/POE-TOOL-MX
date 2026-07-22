import test from 'node:test'
import assert from 'node:assert/strict'
import {
  HARVEST_LESS_MULTIPLIER,
  HARVEST_MORE_MULTIPLIER,
  HARVEST_TAGS,
  createSameTypePoolTransform,
  harvestCraftCategory,
  harvestUnavailableExplanation,
  qualityEffectMatchesBase
} from '../electron/modules/crafting/harvestRules.js'

test('当前花园标签和分类规则完整', () => {
  assert.equal(HARVEST_TAGS.length, 16)
  assert.deepEqual(HARVEST_TAGS.map((entry) => entry.id), [
    'fire', 'cold', 'lightning', 'physical', 'life', 'defences', 'chaos', 'attack',
    'caster', 'speed', 'critical', 'minion', 'elemental', 'attribute', 'mana', 'drop'
  ])
  assert.equal(harvestCraftCategory('reforge_tag'), 'reforge')
  assert.equal(harvestCraftCategory('convert_damage'), 'conversion')
  assert.equal(harvestCraftCategory('quality_enchant'), 'enchant')
  assert.match(harvestUnavailableExplanation('synthesize_item'), /追忆固定词缀结果池/)
})

test('同类更多和更少只变换与原词缀相交的候选权重', () => {
  const pool = [
    { modifier: { tags: ['life', 'resource'] }, weight: 100 },
    { modifier: { tags: ['caster'] }, weight: 200 }
  ]
  const more = createSameTypePoolTransform(['life'], 'more')(pool)
  const less = createSameTypePoolTransform(['life'], 'less')(pool)
  assert.equal(HARVEST_MORE_MULTIPLIER, 10)
  assert.equal(HARVEST_LESS_MULTIPLIER, 0.1)
  assert.deepEqual(more.map((entry) => entry.weight), [1000, 200])
  assert.deepEqual(less.map((entry) => entry.weight), [10, 200])
})

test('品质效果严格按胸甲、近战武器和全部武器适用', () => {
  assert.equal(qualityEffectMatchesBase('body_armour', { itemClass: 'BodyArmour' }), true)
  assert.equal(qualityEffectMatchesBase('body_armour', { itemClass: 'Helmet' }), false)
  assert.equal(qualityEffectMatchesBase('melee_weapon', { itemClass: 'Bow' }), false)
  assert.equal(qualityEffectMatchesBase('melee_weapon', { itemClass: 'Sceptre' }), true)
  assert.equal(qualityEffectMatchesBase('weapon', { itemClass: 'Wand' }), true)
  assert.equal(qualityEffectMatchesBase('weapon', { itemClass: 'Shield' }), false)
})
