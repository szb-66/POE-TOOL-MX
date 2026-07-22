import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ELDRITCH_CURRENCY_DEFINITIONS,
  conflictUpgradeChance,
  eldritchDominance,
  eldritchImplicitCandidates,
  replaceEldritchTier,
  rolledEldritchImplicit
} from '../electron/modules/crafting/eldritchRules.js'

const family = {
  id: 'eldritch:exarch:attack-speed:gloves', source: 'exarch', effectKey: 'attack speed #%', name: '攻击速度',
  itemClasses: ['Gloves'], tags: ['speed'], displayTags: [{ id: 'speed', label: '速度' }],
  tiers: Array.from({ length: 6 }, (_, index) => ({
    id: `eldritch:exarch:attack-speed:gloves:t${index + 1}`, tier: index + 1,
    name: `T${index + 1}`, requiredLevel: index + 1, text: `攻击速度加快 (${index + 5}—${index + 6})%`,
    values: [{ min: index + 5, max: index + 6 }], displayTags: [{ id: 'speed', label: '速度' }], weights: { Gloves: 1000 }
  }))
}
const dataset = { eldritchImplicitFamilies: [family] }
const base = { itemClass: 'Gloves' }

test('古灵通货定义和支配方映射完整', () => {
  assert.equal(ELDRITCH_CURRENCY_DEFINITIONS.length, 12)
  assert.equal(ELDRITCH_CURRENCY_DEFINITIONS.filter((entry) => entry.kind === 'implicit').length, 8)
  assert.deepEqual(eldritchDominance({ eldritchImplicits: { exarch: { tier: 1 }, eater: null } }), {
    source: 'exarch', affixType: 'prefix', label: '焚界者支配', exarchTier: 1, eaterTier: 0
  })
  assert.equal(eldritchDominance({ eldritchImplicits: { exarch: { tier: 4 }, eater: { tier: 4 } } }).source, null)
  assert.equal(eldritchDominance({ eldritchImplicits: { exarch: { tier: 2 }, eater: { tier: 3 } } }).affixType, 'suffix')
})

test('冲突石概率按阶级差计算并限制边界', () => {
  assert.equal(conflictUpgradeChance(4, 4), 0.5)
  assert.equal(conflictUpgradeChance(5, 3), 0.28)
  assert.equal(conflictUpgradeChance(3, 5), 0.72)
  assert.equal(conflictUpgradeChance(100, 1), 0.05)
  assert.equal(conflictUpgradeChance(1, 100), 0.95)
})

test('古灵候选按类别、物品等级和阶级过滤并可确定掷值', () => {
  assert.equal(eldritchImplicitCandidates(dataset, base, 3, 'exarch', 3).length, 1)
  assert.equal(eldritchImplicitCandidates(dataset, base, 2, 'exarch', 3).length, 0)
  assert.equal(eldritchImplicitCandidates(dataset, { itemClass: 'Helmet' }, 100, 'exarch', 3).length, 0)
  const rolled = rolledEldritchImplicit(family, family.tiers[2], base, () => 0)
  assert.equal(rolled.rolledValues[0], 7)
  assert.match(rolled.rolledText, /7/)
  assert.equal(replaceEldritchTier(dataset, rolled, 4, base, () => 0).tier, 4)
  assert.equal(replaceEldritchTier(dataset, rolled, 0, base, () => 0), null)
})
