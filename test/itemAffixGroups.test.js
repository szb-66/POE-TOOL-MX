import test from 'node:test'
import assert from 'node:assert/strict'
import { matchAffixes } from '../electron/modules/item/matcher.js'
import {
  cloneAffixGroup,
  hasEffectiveAffixGroups,
  normalizeModuleTwo
} from '../src/domains/items/affixConfig.js'
import { validateCraftingConfig } from '../src/utils/validation.js'

const itemInfo = {
  implicitMods: [],
  explicitMods: ['+89 最大生命', '+35% 火焰抗性', '物理伤害提高 76%', '+183 命中值'],
  craftedMods: [],
  modifiers: [
    { type: 'prefix', name: '健壮的', tier: 2, text: '+89 最大生命', lines: ['+89 最大生命'] },
    { type: 'suffix', name: '焰火之', tier: 4, text: '+35% 火焰抗性', lines: ['+35% 火焰抗性'] },
    { type: 'prefix', name: '帝王的', tier: 1, text: '物理伤害提高 76%\n+183 命中值', lines: ['物理伤害提高 76%', '+183 命中值'] }
  ]
}

const catalog = (id, effectPattern, minTier = null) => ({
  id,
  kind: 'catalog',
  keyword: effectPattern,
  displayName: effectPattern,
  effectPattern,
  minTier
})

test('旧单组字符串配置迁移为组合并清理空条件', () => {
  const migrated = normalizeModuleTwo({
    enabled: true,
    mode: 'alteration',
    requiredAffixes: ['生命', ''],
    selectedAffixes: ['火焰', '冰霜'],
    selectedCount: 9
  })
  assert.equal(migrated.affixGroups.length, 1)
  assert.equal(migrated.affixGroups[0].name, '组合 1')
  assert.deepEqual(migrated.affixGroups[0].requiredAffixes.map((entry) => entry.keyword), ['生命'])
  assert.equal(migrated.affixGroups[0].selectedCount, 2)
  assert.equal(hasEffectiveAffixGroups(migrated), true)
  assert.equal(Object.hasOwn(migrated, 'checkInitialAffixes'), false)
})

test('最低 T 接受更好或相同阶级并拒绝更差阶级', () => {
  const group = (minTier) => [{
    id: 'life',
    name: '生命',
    requiredAffixes: [catalog('life', '+# 最大生命', minTier)],
    selectedAffixes: [],
    selectedCount: 1
  }]
  assert.equal(matchAffixes(itemInfo, group(3)).isMatch, true)
  assert.equal(matchAffixes(itemInfo, group(2)).isMatch, true)
  assert.equal(matchAffixes(itemInfo, group(1)).isMatch, false)
  assert.equal(matchAffixes(itemInfo, group(null)).isMatch, true)
  const missingTier = structuredClone(itemInfo)
  missingTier.modifiers[0].tier = null
  assert.equal(matchAffixes(missingTier, group(3)).isMatch, false)
})

test('多行目录效果必须由同一详细词缀完整匹配', () => {
  const valid = [{
    id: 'hybrid',
    name: '复合物理',
    requiredAffixes: [catalog('hybrid', '物理伤害提高 #%\n+# 命中值', 1)],
    selectedAffixes: [],
    selectedCount: 1
  }]
  assert.equal(matchAffixes(itemInfo, valid).isMatch, true)
  const split = structuredClone(itemInfo)
  split.modifiers = [
    { type: 'prefix', name: '物理', tier: 1, text: '物理伤害提高 76%' },
    { type: 'suffix', name: '命中', tier: 1, text: '+183 命中值' }
  ]
  assert.equal(matchAffixes(split, valid).isMatch, false)
})

test('组内必选与挑选按 AND/N-of-M，组间按 OR 并报告命中组', () => {
  const groups = [
    {
      id: 'cold-plan',
      name: '冰霜方案',
      requiredAffixes: ['冰霜伤害'],
      selectedAffixes: ['生命', '火焰抗性'],
      selectedCount: 2
    },
    {
      id: 'life-plan',
      name: '生命方案',
      requiredAffixes: ['最大生命'],
      selectedAffixes: ['火焰抗性', '冰霜抗性'],
      selectedCount: 1
    }
  ]
  const result = matchAffixes(itemInfo, groups)
  assert.equal(result.isMatch, true)
  assert.equal(result.matchedGroupId, 'life-plan')
  assert.equal(result.matchedGroupName, '生命方案')
  assert.equal(result.groupResults.length, 2)
  assert.ok(result.matchedModTexts.includes('+89 最大生命'))
})

test('空组合被忽略且不产生无条件成功', () => {
  const result = matchAffixes(itemInfo, [{ id: 'empty', name: '空', requiredAffixes: [], selectedAffixes: [], selectedCount: 1 }])
  assert.equal(result.isMatch, false)
  assert.deepEqual(result.groupResults, [])
})

test('复制组合生成新的稳定 ID，并允许跨组复用相同词缀', () => {
  const original = normalizeModuleTwo({
    affixGroups: [{
      id: 'original',
      name: '原方案',
      requiredAffixes: ['最大生命'],
      selectedAffixes: ['火焰抗性'],
      selectedCount: 1
    }]
  }).affixGroups[0]
  const copied = cloneAffixGroup(original, 1)
  assert.notEqual(copied.id, original.id)
  assert.notEqual(copied.requiredAffixes[0].id, original.requiredAffixes[0].id)
  assert.equal(copied.requiredAffixes[0].keyword, original.requiredAffixes[0].keyword)
  assert.equal(copied.name, '原方案 副本')
})

test('启用词缀模块但所有组合为空时启动校验拒绝运行', () => {
  const result = validateCraftingConfig({
    itemPosition: { x: 100, y: 100 },
    currencyPositions: { wisdom: { x: 2, y: 2 }, alteration: { x: 1, y: 1 } },
    preset: {
      moduleTwo: { enabled: true, mode: 'alteration', affixGroups: [] },
      moduleThree: { enabled: false }
    }
  })
  assert.equal(result.isValid, false)
  assert.ok(result.errors.includes('词缀制作至少需要配置一个有效的达标组合'))
})

test('所有物品制作启动配置都要求知识卷轴坐标', () => {
  const result = validateCraftingConfig({
    itemPosition: { x: 100, y: 100 },
    currencyPositions: { alteration: { x: 1, y: 1 } },
    preset: {
      moduleTwo: {
        enabled: true,
        mode: 'alteration',
        affixGroups: [{ id: 'life', name: '生命', requiredAffixes: ['最大生命'] }]
      },
      moduleThree: { enabled: false }
    }
  })
  assert.match(result.errors.join('\n'), /知识卷轴 \(wisdom\)/)
})
