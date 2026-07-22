import test from 'node:test'
import assert from 'node:assert/strict'
import { BEAST_ASPECT_RECIPES, BEASTCRAFT_RECIPES, BEASTCRAFT_RULESET, BEAST_INFLUENCE_RECIPES, beastRecipeView, createAspectAffix } from '../electron/modules/crafting/beastcraftRules.js'

test('3.28 野兽装备目录包含固定数量的可执行与准确禁用配方', () => {
  assert.deepEqual(BEASTCRAFT_RULESET, { game: 'poe1', patch: '3.28', locale: 'zh-CN' })
  assert.equal(BEAST_INFLUENCE_RECIPES.length, 6)
  assert.equal(BEAST_ASPECT_RECIPES.length, 8)
  assert.equal(BEASTCRAFT_RECIPES.filter((entry) => entry.supported).length, 24)
  assert.equal(BEASTCRAFT_RECIPES.filter((entry) => !entry.supported).length, 3)
  assert.equal(new Set(BEASTCRAFT_RECIPES.map((entry) => entry.id)).size, BEASTCRAFT_RECIPES.length)
  assert.deepEqual(Object.fromEntries(BEAST_INFLUENCE_RECIPES.map((entry) => [entry.influence, entry.beast])), {
    shaper: 'Fenumal Devourer', elder: 'Saqawine Blood Viper', crusader: 'Farric Goliath',
    redeemer: 'Fenumal Queen', hunter: 'Craicic Watcher', warlord: 'Fenumal Scrabbler'
  })
  assert.ok(BEAST_INFLUENCE_RECIPES.every((entry) => entry.secondaryBeast === 'Craicic Maw'))
})

test('势技能定义覆盖猫鸟蟹蛛的 20 与 30 级且作为共享互斥后缀', () => {
  for (const label of ['猫之势', '鸟之势', '蟹之势', '蛛之势']) {
    const recipes = BEAST_ASPECT_RECIPES.filter((entry) => entry.label === label)
    assert.deepEqual(recipes.map((entry) => entry.level), [20, 30])
    for (const recipe of recipes) {
      assert.equal(recipe.effect, `获得 ${recipe.level} 级的主动技能${label}`)
      const affix = createAspectAffix(recipe)
      assert.equal(affix.affixType, 'suffix')
      assert.equal(affix.groupId, 'beast-aspect')
      assert.equal(affix.source, 'beast')
      assert.equal(affix.metaCraft, false)
    }
  }
})

test('数据不足配方始终禁用并暴露具体边界', () => {
  for (const recipe of BEASTCRAFT_RECIPES.filter((entry) => !entry.supported)) {
    const view = beastRecipeView(recipe)
    assert.equal(view.canApply, false)
    assert.ok(view.unavailableReason.length > 8)
  }
})
