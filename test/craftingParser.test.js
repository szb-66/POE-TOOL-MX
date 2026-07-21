import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  createCoreCurrencyCrafts,
  extractModsViewPayload,
  familySummary,
  finalizePoedbBases,
  groupModifierFamilies,
  inferCraftEffectKind,
  mergeModifierGoals,
  modifierEffectKey,
  parsePoedbBases,
  parsePoedbCrafts,
  parsePoedbModifiers
} from '../electron/modules/crafting/poedbParser.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name) => readFileSync(path.join(dirname, 'fixtures', 'crafting', name), 'utf8')

test('解析底材、普通/势力词缀和阶级权重', () => {
  const bases = parsePoedbBases(fixture('items.html'), { category: '首饰与珠宝' })
  const modifiers = parsePoedbModifiers(fixture('modifiers.html'))
  assert.equal(bases[0].name, '珊瑚戒指')
  assert.equal(bases[1].allowedVariants.includes('influenced'), false)
  assert.deepEqual(bases[1].maxAffixes, { prefix: 2, suffix: 2 })
  assert.equal(modifiers[0].tiers[0].requiredLevel, 81)
  assert.equal(modifiers[0].tiers[0].values[0].max, 79)
  assert.deepEqual(modifiers[1].influences, ['shaper'])
})

test('底材过滤 Royale、隔离召集法杖配置并区分合法同名项', () => {
  const makeBase = (sourceId, name, requiredLevel) => ({ id: `base:${sourceId}`, sourceId, name, category: '单手武器', itemClass: 'Wand', requiredLevel, tags: ['wand'], maxAffixes: { prefix: 3, suffix: 3 }, allowedVariants: ['normal'] })
  const bases = finalizePoedbBases([
    makeBase('Driftwood_Wand', '朽木法杖', 1),
    makeBase('Royale_Driftwood_Wand', '朽木法杖', 1),
    makeBase('Convening_Wand', '召集法杖', 50),
    makeBase('Convoking_Wand', '召集法杖', 72)
  ], [{ page: 'Convoking_Wand', sourceIds: ['Convoking_Wand'], categoryPath: ['特殊', '召集法杖'] }])
  assert.equal(bases.some((base) => base.sourceId.startsWith('Royale_')), false)
  assert.equal(bases.filter((base) => base.name === '朽木法杖').length, 1)
  const special = bases.find((base) => base.sourceId === 'Convoking_Wand')
  assert.deepEqual(special.categoryPath, ['特殊', '召集法杖'])
  assert.equal(special.modifierProfileId, 'Convoking_Wand')
  assert.notEqual(special.displayName, bases.find((base) => base.sourceId === 'Convening_Wand').displayName)
})

test('共享 Mod Family 保持父项并在内部区分效果、等级与权重', () => {
  const raw = parsePoedbModifiers(fixture('shared-family.html'), { profileId: 'Wands' })
  const crafts = parsePoedbCrafts(fixture('bench-linked.html'), { provider: 'bench' })
  const goals = mergeModifierGoals(raw, crafts)
  assert.equal(goals.length, 4)
  const families = groupModifierFamilies(goals)
  assert.equal(families.length, 1)
  assert.equal(families[0].entries.length, 4)
  assert.equal(families[0].entries.reduce((sum, entry) => sum + entry.tiers.length, 0), 5)
  assert.equal(families[0].name, '法术 / 火焰 / 冰霜 / 闪电伤害提高')
  const totalAt = (level) => families[0].entries.flatMap((entry) => entry.tiers).filter((tier) => tier.requiredLevel <= level).reduce((sum, tier) => sum + tier.weight, 0)
  assert.equal(totalAt(80), 1500)
  assert.equal(totalAt(84), 1576)
  assert.deepEqual(new Set(goals.map((goal) => goal.groupId)), new Set(['WeaponCasterDamagePrefix']))
  const spell = goals.find((goal) => goal.name.includes('法术伤害'))
  assert.equal(spell.tiers.length, 2)
  assert.equal(spell.tiers[0].weight, 40)
  assert.deepEqual(spell.tiers[0].displayTags.map((tag) => tag.label), ['伤害', '施法'])
  assert.equal(spell.craftedOptions[0].cost[0].amount, 4)
  assert.equal(spell.craftedOptions[0].unlock, '测试区域')
  assert.equal(mergeModifierGoals(raw, []).find((goal) => goal.name.includes('法术伤害')).craftedOptions.length, 0)
  assert.equal(modifierEffectKey('法术伤害提高 <b>(10—20)</b>%'), '法术伤害提高 #%')
  assert.equal(familySummary([{ name: '该装备附加 # - # 基础火焰伤害' }]), '附加基础火焰伤害')
})

test('解析工艺台、花园和核心通货语义', () => {
  const bench = parsePoedbCrafts(fixture('bench.html'), { provider: 'bench' })
  const harvest = parsePoedbCrafts(fixture('harvest.html'), { provider: 'harvest' })
  assert.equal(bench[1].effectKind, 'lock_prefixes')
  assert.equal(bench[0].cost[0].amount, 4)
  assert.equal(harvest[0].effectKind, 'reforge_tag')
  assert.equal(harvest[1].cost.length, 2)
  assert.equal(createCoreCurrencyCrafts().length, 10)
  assert.equal(inferCraftEffectKind('后缀无法被变更', 'bench'), 'lock_suffixes')
})

test('ModsView JSON 边界解析不执行脚本', () => {
  const html = '<script>new ModsView({"gen":{"1":"前缀"},"normal":[]}); alert("ignored")</script>'
  assert.deepEqual(extractModsViewPayload(html).normal, [])
  assert.throws(() => extractModsViewPayload('<script>new ModsView({"normal":[])</script>'), /未闭合|Unexpected/)
})
