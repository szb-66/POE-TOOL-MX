import test from 'node:test'
import assert from 'node:assert/strict'
import { applyManualBenchCraft, applyManualCurrency, applyManualEssence, applyManualFossils, applyManualHarvestCraft, createManualSession, inspectManualCurrencies, listManualBeastcrafts, listManualBenchCrafts, listManualEssences, listManualFossils, listManualHarvestCrafts, previewManualCurrency, redoManualAction, resetManualSession, undoManualAction } from '../electron/modules/crafting/manualCrafting.js'
import { CURRENT_EQUIPMENT_CURRENCIES } from '../electron/modules/crafting/seasonalRules.js'

const seasonalBoundaryCurrencyIds = new Set(CURRENT_EQUIPMENT_CURRENCIES.map((entry) => entry.id))

const dataset = {
  bases: [{ id: 'base:wand', name: '测试法杖', displayName: '测试法杖', itemClass: 'Wand', categoryPath: ['单手武器', '法杖'], modifierProfileId: 'Wands', requiredLevel: 1, requirements: { level: 1, strength: 0, dexterity: 0, intelligence: 0 }, qualityType: 'weapon', socketLimit: 3, baseStats: [], implicitModifiers: [], tags: ['wand'], maxAffixes: { prefix: 3, suffix: 3 }, allowedVariants: ['normal'] }],
  modifiers: [
    { id: 'mod:spell', goalId: 'goal:spell', familyId: 'family:spell', modifierProfileId: 'Wands', groupId: 'spell', name: '术士的', affixType: 'prefix', source: 'natural', tags: ['caster'], displayTags: [{ id: 'caster', label: '法术' }], spawnTags: ['wand'], requiredTags: [], itemClasses: ['Wand'], influences: [], tiers: [
      { id: 'tier:spell-high', tier: 1, name: 'T1 术士的', requiredLevel: 80, weight: 100000, text: '法术伤害提高 (100—120)%', values: [{ min: 100, max: 120 }], displayTags: [{ id: 'caster', label: '法术' }] },
      { id: 'tier:spell', tier: 2, name: 'T2 术士的', requiredLevel: 1, weight: 1000, text: '法术伤害提高 (10—20)%', values: [{ min: 10, max: 20 }], displayTags: [{ id: 'caster', label: '法术' }] }
    ] },
    { id: 'mod:speed', goalId: 'goal:speed', familyId: 'family:speed', modifierProfileId: 'Wands', groupId: 'speed', name: '欢快之', affixType: 'suffix', source: 'natural', tags: ['speed'], displayTags: [{ id: 'speed', label: '速度' }], spawnTags: ['wand'], requiredTags: [], itemClasses: ['Wand'], influences: [], tiers: [{ id: 'tier:speed', tier: 1, name: 'T1 欢快之', requiredLevel: 1, weight: 1000, text: '施法速度提高 (5—10)%', values: [{ min: 5, max: 10 }], displayTags: [{ id: 'speed', label: '速度' }] }] },
    { id: 'mod:essence-woe', goalId: 'goal:essence-woe', familyId: 'family:essence-woe', modifierProfileId: 'Wands', groupId: 'essence-spell', name: '精华法术伤害', affixType: 'prefix', source: 'essence', tags: ['caster'], displayTags: [{ id: 'caster', label: '法术' }], spawnTags: ['wand'], requiredTags: [], itemClasses: ['Wand'], influences: [], tiers: [
      { id: 'tier:woe-low', tier: 1, name: 'T1 悲痛之低语精华', requiredLevel: 2, weight: 0, text: '法术伤害提高 (10—19)%', values: [{ min: 10, max: 19 }], displayTags: [{ id: 'caster', label: '法术' }], sourceItem: { id: 'Whispering_Essence_of_Woe', name: '悲痛之低语精华', tier: 1, minimumItemLevel: 1, randomModifierLevelCap: 35, canReforgeRare: false } },
      { id: 'tier:woe-high', tier: 2, name: 'T7 悲痛之破空精华', requiredLevel: 82, weight: 0, text: '法术伤害提高 (83—94)%', values: [{ min: 83, max: 94 }], displayTags: [{ id: 'caster', label: '法术' }], sourceItem: { id: 'Deafening_Essence_of_Woe', name: '悲痛之破空精华', tier: 7, minimumItemLevel: 65, randomModifierLevelCap: null, canReforgeRare: true } }
    ] },
    { id: 'mod:bench-life', goalId: 'goal:bench-life', familyId: 'family:bench-life', modifierProfileId: 'Wands', groupId: 'life', name: '最大生命', affixType: 'prefix', source: 'crafted', tags: ['life'], displayTags: [{ id: 'life', label: '生命' }], spawnTags: ['wand'], requiredTags: [], itemClasses: ['Wand'], influences: [], tiers: [], craftedOptions: [
      { id: 'crafted:life', optionId: 'crafted:life', craftId: 'craft:life', tier: 1, name: '工艺台', requiredLevel: 1, weight: 0, text: '+(20—30) 最大生命', values: [{ min: 20, max: 30 }], displayTags: [{ id: 'life', label: '生命' }], itemClasses: ['单手远程'], cost: [{ resourceId: 'currency:transmutation', resourceName: '蜕变石', amount: 2 }], unlock: '默认' },
      { id: 'crafted:life-high', optionId: 'crafted:life-high', craftId: 'craft:life-high', tier: 2, name: '工艺台', requiredLevel: 85, weight: 0, text: '+(50—60) 最大生命', values: [{ min: 50, max: 60 }], displayTags: [{ id: 'life', label: '生命' }], itemClasses: ['单手远程'], cost: [{ resourceId: 'currency:chaos', resourceName: '混沌石', amount: 2 }], unlock: '终局地图' }
    ] },
    { id: 'mod:bench-resist', goalId: 'goal:bench-resist', familyId: 'family:bench-resist', modifierProfileId: 'Wands', groupId: 'fire-resist', name: '火焰抗性', affixType: 'suffix', source: 'crafted', tags: ['fire'], displayTags: [{ id: 'fire', label: '火焰' }], spawnTags: ['wand'], requiredTags: [], itemClasses: ['Wand'], influences: [], tiers: [], craftedOptions: [
      { id: 'crafted:fire-resist', optionId: 'crafted:fire-resist', craftId: 'craft:fire-resist', tier: 1, name: '工艺台', requiredLevel: 1, weight: 0, text: '+(15—20)% 火焰抗性', values: [{ min: 15, max: 20 }], displayTags: [{ id: 'fire', label: '火焰' }], itemClasses: ['单手远程'], cost: [{ resourceId: 'currency:transmutation', resourceName: '蜕变石', amount: 1 }], unlock: '默认' }
    ] }
  ]
}

test('手动通货创建可复现的实际词缀并支持撤销重做重置', () => {
  const initial = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 42 })
  const first = applyManualCurrency(dataset, initial, 'currency:transmutation')
  const repeated = applyManualCurrency(dataset, createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 42 }), 'currency:transmutation')
  assert.deepEqual(first.session.state, repeated.session.state)
  assert.equal(first.session.state.rarity, 'magic')
  assert.ok([...first.session.state.prefixes, ...first.session.state.suffixes].every((entry) => entry.rolledValues.length && !entry.rolledText.includes('—')))
  const undone = undoManualAction(dataset, first.session)
  assert.equal(undone.session.state.rarity, 'normal')
  const redone = redoManualAction(dataset, undone.session)
  assert.deepEqual(redone.session.state, first.session.state)
  assert.equal(resetManualSession(dataset, redone.session).session.history.length, 0)
})

test('通货拒绝非法状态并提供同源原因', () => {
  const session = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' } })
  const chaos = inspectManualCurrencies(dataset, session).find((entry) => entry.id === 'currency:chaos')
  assert.equal(chaos.canApply, false)
  assert.equal(chaos.unavailableReason, '混沌石仅能重铸稀有物品')
  assert.throws(() => applyManualCurrency(dataset, session, 'currency:chaos'), /仅能重铸稀有物品/)
})

test('核心普通通货统一拒绝腐化和镜像物品', () => {
  for (const flag of ['corrupted', 'mirrored']) {
    const current = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 112 })
    current.state[flag] = true
    const actions = inspectManualCurrencies(dataset, current).filter((entry) =>
      !seasonalBoundaryCurrencyIds.has(entry.id) &&
      !entry.id.startsWith('currency:catalyst-') &&
      (flag !== 'corrupted' || !entry.id.startsWith('currency:tainted-')))
    for (const action of actions) {
      assert.equal(action.canApply, false, `${flag} 不应允许 ${action.id}`)
      assert.match(action.unavailableReason, flag === 'corrupted' ? /腐化/ : /镜像/)
    }
  }
})

test('卡兰德之镜保留原件并创建不推进随机状态的完整镜像副本', () => {
  let original = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 412 })
  original = applyManualCurrency(dataset, original, 'currency:alchemy').session
  original.state.split = true
  original.state.enchanted = true
  original.state.quality = 20
  original.variant = { kind: 'synthesized', influences: [], fracturedTierId: null, implicits: ['测试综合隐式'] }
  const sourceState = structuredClone(original.state)
  const sourceVariant = structuredClone(original.variant)
  const sourceId = original.activeItemId
  const rngBefore = original.rngState
  const mirror = inspectManualCurrencies(dataset, original).find((entry) => entry.id === 'currency:mirror-of-kalandra')
  assert.equal(mirror.canApply, true)
  assert.deepEqual(mirror.cost, [{ resourceId: 'currency:mirror-of-kalandra', resourceName: '卡兰德之镜', amount: 1 }])

  const result = applyManualCurrency(dataset, original, mirror.id)
  assert.equal(result.session.rngState, rngBefore)
  assert.equal(result.session.state.mirrored, true)
  assert.notEqual(result.session.activeItemId, sourceId)
  assert.deepEqual(result.event.sourceItem, { itemId: sourceId, baseId: original.baseId, itemLevel: 84, state: sourceState, variant: sourceVariant })
  assert.deepEqual(result.event.createdMirrorItem.state, result.session.state)
  assert.deepEqual({ ...result.session.state, mirrored: false }, sourceState)
  assert.deepEqual(result.event.createdMirrorItem.variant, sourceVariant)
  assert.match(result.event.summary, /原件未改变.*镜像副本/)
  assert.ok(result.currencies.every((entry) => !entry.canApply && /镜像/.test(entry.unavailableReason)))
  assert.ok(result.essences.items.every((entry) => !entry.canApply && /镜像/.test(entry.unavailableReason)))
  assert.ok(result.benchCrafts.items.every((entry) => !entry.canApply && /镜像/.test(entry.unavailableReason)))
  assert.throws(() => applyManualEssence(dataset, result.session, 'Deafening_Essence_of_Woe'), /镜像/)
})

test('卡兰德之镜支持预见、撤销重做与重置并拒绝腐化或二次复制', () => {
  const initial = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 413 })
  initial.foreseeing = true
  const beforePreview = structuredClone(initial)
  const preview = previewManualCurrency(dataset, initial, 'currency:mirror-of-kalandra')
  assert.deepEqual(initial, beforePreview)
  assert.equal(preview.state.mirrored, true)
  const copied = applyManualCurrency(dataset, initial, 'currency:mirror-of-kalandra')
  assert.deepEqual(copied.session.state, preview.state)
  assert.equal(copied.session.foreseeing, false)
  assert.equal(copied.session.rngState, initial.rngState)

  const undone = undoManualAction(dataset, copied.session)
  assert.equal(undone.session.state.mirrored, false)
  assert.equal(undone.session.activeItemId, initial.activeItemId)
  assert.equal(undone.session.foreseeing, true)
  const redone = redoManualAction(dataset, undone.session)
  assert.equal(redone.session.state.mirrored, true)
  assert.equal(redone.event.createdMirrorItem.state.mirrored, true)
  const reset = resetManualSession(dataset, redone.session)
  assert.equal(reset.session.state.mirrored, false)
  assert.equal(reset.session.activeItemId, initial.activeItemId)

  assert.match(inspectManualCurrencies(dataset, copied.session).find((entry) => entry.id === 'currency:mirror-of-kalandra').unavailableReason, /不能再次复制/)
  const corrupted = structuredClone(initial)
  corrupted.state.corrupted = true
  assert.match(inspectManualCurrencies(dataset, corrupted).find((entry) => entry.id === 'currency:mirror-of-kalandra').unavailableReason, /腐化/)
})

test('神圣石只重骰实际数值不改变词缀阶级', () => {
  let session = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 9 })
  session = applyManualCurrency(dataset, session, 'currency:transmutation').session
  const before = [...session.state.prefixes, ...session.state.suffixes].map(({ tierId, rolledValues, valueRanges }) => ({ tierId, rolledValues, valueRanges }))
  const after = applyManualCurrency(dataset, session, 'currency:divine').session
  const next = [...after.state.prefixes, ...after.state.suffixes].map(({ tierId, rolledValues }) => ({ tierId, rolledValues }))
  assert.deepEqual(next.map((entry) => entry.tierId), before.map((entry) => entry.tierId))
  assert.ok(next.every((entry, index) => entry.rolledValues.every((value, valueIndex) => value >= before[index].valueRanges[valueIndex].min && value <= before[index].valueRanges[valueIndex].max)))
})

test('精华保证词缀、限制低阶随机池并支持确定性历史', () => {
  const initial = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 17 })
  const catalog = listManualEssences(dataset, initial)
  assert.equal(catalog.items.length, 2)
  assert.equal(catalog.items.find((entry) => entry.id === 'Whispering_Essence_of_Woe').canReforgeRare, false)
  const first = applyManualEssence(dataset, initial, 'Whispering_Essence_of_Woe')
  const repeated = applyManualEssence(dataset, initial, 'Whispering_Essence_of_Woe')
  assert.deepEqual(first.session.state, repeated.session.state)
  assert.equal(first.session.state.rarity, 'rare')
  assert.equal(first.event.poolItemLevel, 35)
  assert.ok([...first.session.state.prefixes, ...first.session.state.suffixes].some((entry) => entry.sourceItemId === 'Whispering_Essence_of_Woe'))
  const naturalTierIds = [...first.session.state.prefixes, ...first.session.state.suffixes].filter((entry) => entry.source === 'natural').map((entry) => entry.tierId)
  assert.equal(naturalTierIds.includes('tier:spell-high'), false)
  assert.throws(() => applyManualEssence(dataset, first.session, 'Whispering_Essence_of_Woe'), /只能用于普通物品/)
  const reforged = applyManualEssence(dataset, first.session, 'Deafening_Essence_of_Woe')
  assert.ok([...reforged.session.state.prefixes, ...reforged.session.state.suffixes].some((entry) => entry.sourceItemId === 'Deafening_Essence_of_Woe'))
  assert.deepEqual(undoManualAction(dataset, reforged.session).session.state, first.session.state)
})

test('精华拒绝等级不足和任意元工艺状态', () => {
  const lowLevel = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 20, variant: { kind: 'normal' }, seed: 2 })
  assert.match(listManualEssences(dataset, lowLevel).items.find((entry) => entry.id === 'Deafening_Essence_of_Woe').unavailableReason, /至少为 65/)
  const meta = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 2 })
  meta.state.meta.cannotRollCaster = true
  assert.match(listManualEssences(dataset, meta).items[0].unavailableReason, /元工艺/)
})

test('魔法物品每侧最多一条词缀', () => {
  const initial = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 7 })
  const session = applyManualBenchCraft(dataset, initial, 'craft:life').session
  const augmented = applyManualCurrency(dataset, session, 'currency:augmentation').session.state
  assert.equal(augmented.prefixes.length, 1)
  assert.equal(augmented.suffixes.length, 1)
})

test('工艺台目录、普通升级、固定数值与唯一工艺替换', () => {
  const initial = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 31 })
  const catalog = listManualBenchCrafts(dataset, initial)
  assert.ok(catalog.items.some((entry) => entry.id === 'craft:life' && entry.canApply && entry.unlock === '默认'))
  assert.match(catalog.items.find((entry) => entry.id === 'craft:life-high').unavailableReason, /至少为 85/)
  const crafted = applyManualBenchCraft(dataset, initial, 'craft:life')
  assert.equal(crafted.session.state.rarity, 'magic')
  assert.match(crafted.session.state.prefixes[0].rolledText, /最大生命/)
  assert.deepEqual(crafted.session.state, applyManualBenchCraft(dataset, initial, 'craft:life').session.state)
  const replacement = crafted.benchCrafts.items.find((entry) => entry.id === 'craft:fire-resist')
  assert.equal(replacement.replacesExisting, true)
  assert.deepEqual(replacement.replacementCost, [{ resourceId: 'currency:scouring', resourceName: '重铸石', amount: 1 }])
  const replaced = applyManualBenchCraft(dataset, crafted.session, 'craft:fire-resist')
  assert.equal(replaced.session.state.prefixes.length, 0)
  assert.equal(replaced.session.state.suffixes[0].groupId, 'fire-resist')
  assert.equal(replaced.event.costs.some((entry) => entry.resourceName === '重铸石'), true)
})

test('五种元工艺占位、多大师上限、移除和历史联动', () => {
  const initial = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 44 })
  const lockSuffixes = applyManualBenchCraft(dataset, initial, 'bench:lock-suffixes')
  assert.equal(lockSuffixes.session.state.prefixes[0].metaCraft, true)
  assert.equal(lockSuffixes.session.state.meta.suffixesLocked, true)
  assert.deepEqual(redoManualAction(dataset, undoManualAction(dataset, lockSuffixes.session).session).session.state, lockSuffixes.session.state)
  initial.state.rarity = 'rare'
  let session = applyManualBenchCraft(dataset, initial, 'bench:multimod').session
  session = applyManualBenchCraft(dataset, session, 'craft:life').session
  session = applyManualBenchCraft(dataset, session, 'craft:fire-resist').session
  assert.equal([...session.state.prefixes, ...session.state.suffixes].filter((entry) => entry.source === 'crafted').length, 3)
  assert.match(listManualBenchCrafts(dataset, session).items.find((entry) => entry.id === 'bench:cannot-roll-attack').unavailableReason, /最多允许三条/)
  const removed = applyManualBenchCraft(dataset, session, 'bench:remove-crafted')
  assert.equal([...removed.session.state.prefixes, ...removed.session.state.suffixes].filter((entry) => entry.source === 'crafted').length, 0)
  assert.equal(Object.values(removed.session.state.meta).some(Boolean), false)
  assert.deepEqual(removed.event.costs, [{ resourceId: 'currency:scouring', resourceName: '重铸石', amount: 1 }])
})

test('化石目录、共振器校验、组合重铸和纠缠揭示可复现', () => {
  const initial = createManualSession(dataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 73 })
  assert.equal(listManualFossils(dataset, initial).items.length, 25)
  assert.equal(listManualFossils(dataset, initial).resonators.length, 4)
  assert.match(listManualFossils(dataset, initial).items[0].unavailableReason, /稀有物品/)
  // 此最小测试数据没有腐化固定词缀池，因此溅血化石仍按候选门禁安全禁用。
  assert.equal(listManualFossils(dataset, initial).items.find((entry) => entry.id === 'bloodstained').selectable, false)
  const rare = applyManualCurrency(dataset, initial, 'currency:alchemy').session
  assert.throws(() => applyManualFossils(dataset, rare, { sockets: 2, fossilIds: ['aetheric'] }), /恰好装入 2/)
  assert.throws(() => applyManualFossils(dataset, rare, { sockets: 2, fossilIds: ['aetheric', 'aetheric'] }), /重复化石/)
  const input = { sockets: 2, fossilIds: ['aetheric', 'tangled'] }
  const first = applyManualFossils(dataset, rare, input)
  const repeated = applyManualFossils(dataset, rare, input)
  assert.deepEqual(first.session.state, repeated.session.state)
  assert.deepEqual(first.event.tangled, repeated.event.tangled)
  assert.notEqual(first.event.tangled.moreTag, first.event.tangled.blockedTag)
  assert.equal(first.event.costs.length, 3)
  assert.deepEqual(undoManualAction(dataset, first.session).session.state, rare.state)
})

test('镂空、雕刻、圣洁、镶金和 3.29 随机破裂结果进入装备状态', () => {
  const specialDataset = structuredClone(dataset)
  specialDataset.modifiers.push(
    { id: 'mod:hollow', goalId: 'goal:hollow', familyId: 'family:hollow', modifierProfileId: 'Wands', groupId: 'AbyssJewelSocket', name: '深渊插槽', affixType: 'suffix', source: 'delve', tags: [], displayTags: [], spawnTags: ['wand'], requiredTags: [], itemClasses: ['Wand'], influences: [], tiers: [{ id: 'tier:hollow', tier: 1, name: 'T1 地下之', requiredLevel: 1, weight: 100, text: '拥有 1 个深渊插槽', values: [{ min: 1, max: 1 }], displayTags: [] }] },
    { id: 'mod:glyphic', goalId: 'goal:glyphic', familyId: 'family:glyphic', modifierProfileId: 'Wands', groupId: 'GlyphicDamage', name: '腐化精华属性', affixType: 'prefix', source: 'essence', tags: ['fire'], displayTags: [{ id: 'fire', label: '火焰' }], spawnTags: ['wand'], requiredTags: [], itemClasses: ['Wand'], influences: [], tiers: [{ id: 'tier:glyphic', tier: 1, name: 'T8 浮夸精华', requiredLevel: 1, weight: 0, text: '击中施放 20 级火焰爆破', values: [], displayTags: [{ id: 'fire', label: '火焰' }], sourceItem: { id: 'Essence_of_Hysteria', name: '浮夸精华', tier: 8, minimumItemLevel: 1, randomModifierLevelCap: null, canReforgeRare: true } }] }
  )
  let rare = createManualSession(specialDataset, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 99 })
  rare = applyManualCurrency(specialDataset, rare, 'currency:alchemy').session
  const result = applyManualFossils(specialDataset, rare, { sockets: 4, fossilIds: ['hollow', 'glyphic', 'sanctified', 'gilded'] })
  const affixes = [...result.session.state.prefixes, ...result.session.state.suffixes]
  assert.ok(affixes.some((entry) => entry.groupId === 'AbyssJewelSocket'))
  assert.ok(affixes.some((entry) => entry.sourceItemId === 'Essence_of_Hysteria'))
  assert.ok(result.session.state.implicits.includes('物品会被商贩高价购买'))
  const split = applyManualFossils(specialDataset, result.session, { sockets: 1, fossilIds: ['fractured'] })
  assert.equal(split.session.state.split, false)
  assert.equal([...split.session.state.prefixes, ...split.session.state.suffixes].filter((entry) => entry.fractured).length, 1)
  assert.equal(split.event.createdItem, null)
  assert.ok(split.event.fracturedModifier)
  assert.equal(split.session.variant.kind, 'fractured')
  assert.throws(() => applyManualFossils(specialDataset, split.session, { sockets: 1, fossilIds: ['fractured'] }), /已有破裂|不能.*分裂化石/)
})

function harvestDataset() {
  const result = structuredClone(dataset)
  result.bases[0].allowedVariants.push('influenced')
  const modifier = (id, groupId, name, effectKey, affixType, tags, source = 'natural', influences = []) => ({
    id, goalId: `goal:${id}`, familyId: `family:${id}`, modifierProfileId: 'Wands', groupId, name, effectKey,
    affixType, source, tags, displayTags: tags.map((tag) => ({ id: tag, label: tag })), spawnTags: ['wand'], requiredTags: [], itemClasses: ['Wand'], influences,
    tiers: [{ id: `tier:${id}`, tier: 2, name: `T2 ${name}`, requiredLevel: 1, weight: 1000, text: effectKey.replace('#%', '(20—30)%').replace('#', '(20—30)'), values: [{ min: 20, max: 30 }], displayTags: tags.map((tag) => ({ id: tag, label: tag })) }]
  })
  result.modifiers.push(
    modifier('mod:natural-life', 'natural-life', '健壮的', '# 最大生命', 'prefix', ['life']),
    modifier('mod:fire-resistance', 'fire-resistance', '焰火之', '#% 火焰抗性', 'suffix', ['fire', 'resistance']),
    modifier('mod:cold-resistance', 'cold-resistance', '冰河之', '#% 冰霜抗性', 'suffix', ['cold', 'resistance']),
    modifier('mod:lightning-resistance', 'lightning-resistance', '雷霆之', '#% 闪电抗性', 'suffix', ['lightning', 'resistance']),
    modifier('mod:fire-damage', 'fire-damage', '灼热的', '火焰伤害提高 #%', 'prefix', ['fire', 'elemental', 'damage']),
    modifier('mod:cold-damage', 'cold-damage', '冰冷的', '冰霜伤害提高 #%', 'prefix', ['cold', 'elemental', 'damage']),
    modifier('mod:shaper-life', 'shaper-life', '塑界者的', '# 最大生命', 'prefix', ['life', 'influence_mod'], 'shaper', ['shaper'])
  )
  const cost = [{ resourceId: 'resource:harvest:wild', resourceName: '狂野紫晶命能', amount: 75 }]
  result.crafts = [
    { id: 'harvest:life', provider: 'harvest', name: '重铸一件带随机词缀的稀有物品，其中包括一个生命词缀', effectKind: 'reforge_tag', itemClasses: [], cost, params: { tag: 'life' } },
    { id: 'harvest:more', provider: 'harvest', name: '重铸一件稀有物品，大概率会得到相同词缀类型', effectKind: 'reforge_more_likely', itemClasses: [], cost, params: {} },
    { id: 'harvest:cold-to-fire-resistance', provider: 'harvest', name: '将冰霜抗性变为火焰抗性', effectKind: 'convert_resistance', itemClasses: [], cost, params: { fromTag: 'cold', toTag: 'fire' } },
    { id: 'harvest:remove-add-life', provider: 'harvest', name: '添加生命词缀并去掉另一个随机词缀', effectKind: 'remove_add_tag', itemClasses: [], cost, params: { tag: 'life' } },
    { id: 'harvest:reforge-influence', provider: 'harvest', name: '重铸势力稀有物品并包含势力词缀', effectKind: 'reforge_influence', itemClasses: [], cost, params: {} },
    { id: 'harvest:randomize-influence', provider: 'harvest', name: '随机化势力类型并重铸', effectKind: 'randomize_influence', itemClasses: [], cost, params: {} },
    { id: 'harvest:weapon-quality', provider: 'harvest', name: '附魔一件武器，品质改为增加元素伤害', effectKind: 'quality_enchant', itemClasses: [], cost, params: { itemScope: 'weapon', qualityEffect: '品质每 2% 使元素伤害提高 1%' } },
    { id: 'harvest:synth', provider: 'harvest', name: '合成一件物品', effectKind: 'synthesize_item', itemClasses: [], cost, params: {} }
  ]
  return result
}

test('花园目录与保证标签、同类倾向和品质附魔使用确定性状态', () => {
  const current = harvestDataset()
  let session = createManualSession(current, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 321 })
  session = applyManualCurrency(current, session, 'currency:alchemy').session
  const catalog = listManualHarvestCrafts(current, session)
  assert.equal(catalog.total, 8)
  assert.equal(catalog.items.find((entry) => entry.id === 'harvest:life').canApply, true)
  assert.match(catalog.items.find((entry) => entry.id === 'harvest:synth').unavailableReason, /追忆固定词缀结果池/)
  const life = applyManualHarvestCraft(current, session, 'harvest:life')
  assert.ok([...life.session.state.prefixes, ...life.session.state.suffixes].some((entry) => current.modifiers.find((modifier) => modifier.id === entry.modifierId)?.tags.includes('life')))
  assert.deepEqual(life.session.state, applyManualHarvestCraft(current, session, 'harvest:life').session.state)
  const more = applyManualHarvestCraft(current, life.session, 'harvest:more')
  assert.equal(more.event.weightMultiplier, 10)
  const enchanted = applyManualHarvestCraft(current, more.session, 'harvest:weapon-quality')
  assert.equal(enchanted.session.state.qualityEffect, '品质每 2% 使元素伤害提高 1%')
  assert.equal(enchanted.session.state.enchanted, true)
  assert.deepEqual(undoManualAction(current, enchanted.session).session.state, more.session.state)
})

test('移除附魔固定消耗三枚重铸石并只清空腐化装备的附魔层', () => {
  const current = harvestDataset()
  let session = createManualSession(current, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 322 })
  const unavailable = listManualBenchCrafts(current, session).items.find((entry) => entry.id === 'bench:remove-enchantments')
  assert.equal(unavailable.canApply, false)
  assert.match(unavailable.unavailableReason, /没有可移除的附魔/)
  assert.deepEqual(unavailable.cost, [{ resourceId: 'currency:scouring', resourceName: '重铸石', amount: 3 }])
  assert.equal(unavailable.unlock, '默认解锁')

  session = applyManualCurrency(current, session, 'currency:alchemy').session
  session.state.quality = 20
  session = applyManualHarvestCraft(current, session, 'harvest:weapon-quality').session
  session.state.corrupted = true
  session.foreseeing = true
  const before = structuredClone(session.state)
  const action = listManualBenchCrafts(current, session).items.find((entry) => entry.id === 'bench:remove-enchantments')
  assert.equal(action.canApply, true)
  const removed = applyManualBenchCraft(current, session, action.id)
  assert.deepEqual(removed.session.state, { ...before, enchanted: false, qualityEffect: '' })
  assert.equal(removed.session.state.corrupted, true)
  assert.equal(removed.session.state.quality, 20)
  assert.equal(removed.session.foreseeing, false)
  assert.equal(removed.event.foreseeingConsumed, true)
  assert.equal(removed.event.removedEnchantment, before.qualityEffect)
  assert.deepEqual(removed.event.costs, [{ resourceId: 'currency:scouring', resourceName: '重铸石', amount: 3 }])

  const undone = undoManualAction(current, removed.session)
  assert.deepEqual(undone.session.state, before)
  assert.equal(undone.session.foreseeing, true)
  const redone = redoManualAction(current, undone.session)
  assert.equal(redone.session.state.enchanted, false)
  assert.equal(redone.event.removedEnchantment, before.qualityEffect)
  assert.equal(resetManualSession(current, redone.session).session.state.enchanted, false)
})

test('3.29 魔符破裂保持禁用且镜像装备不能通过工艺台移除附魔', () => {
  const current = harvestDataset()
  let session = createManualSession(current, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 323 })
  session = applyManualCurrency(current, session, 'currency:alchemy').session
  session = applyManualHarvestCraft(current, session, 'harvest:weapon-quality').session
  assert.match(listManualBeastcrafts(current, session).items.find((entry) => entry.id === 'fracture-talisman-one').unavailableReason, /3\.29.*魔符/)
  session.state.mirrored = true
  const action = listManualBenchCrafts(current, session).items.find((entry) => entry.id === 'bench:remove-enchantments')
  assert.equal(action.canApply, false)
  assert.match(action.unavailableReason, /镜像/)
  assert.throws(() => applyManualBenchCraft(current, session, action.id), /镜像/)
})

test('花园元素转换与移除添加保持词缀侧并记录实际变化', () => {
  const current = harvestDataset()
  const session = createManualSession(current, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'normal' }, seed: 654 })
  session.state.rarity = 'rare'
  const cold = current.modifiers.find((entry) => entry.id === 'mod:cold-resistance')
  session.state.suffixes.push({ goalId: cold.goalId, modifierId: cold.id, tierId: cold.tiers[0].id, groupId: cold.groupId, source: 'natural', affixType: 'suffix', name: cold.name, tierName: cold.tiers[0].name, text: cold.tiers[0].text, rolledText: '+25% 冰霜抗性', valueRanges: cold.tiers[0].values, rolledValues: [25], displayTags: cold.displayTags, weight: 1000 })
  const converted = applyManualHarvestCraft(current, session, 'harvest:cold-to-fire-resistance')
  assert.equal(converted.session.state.suffixes.some((entry) => entry.modifierId === 'mod:fire-resistance'), true)
  assert.equal(converted.event.convertedFrom.modifierId, 'mod:cold-resistance')
  const augmented = applyManualHarvestCraft(current, converted.session, 'harvest:remove-add-life')
  assert.ok(augmented.event.removedModifier)
  assert.ok([...augmented.session.state.prefixes, ...augmented.session.state.suffixes].some((entry) => current.modifiers.find((modifier) => modifier.id === entry.modifierId)?.tags.includes('life')))
})

test('花园势力重铸保证势力词缀并在撤销重做时同步变体', () => {
  const current = harvestDataset()
  let session = createManualSession(current, { baseId: 'base:wand', itemLevel: 84, variant: { kind: 'influenced', influences: ['shaper'] }, seed: 987 })
  session.state.rarity = 'rare'
  const reforged = applyManualHarvestCraft(current, session, 'harvest:reforge-influence')
  assert.ok([...reforged.session.state.prefixes, ...reforged.session.state.suffixes].some((entry) => entry.source === 'shaper'))
  const randomized = applyManualHarvestCraft(current, reforged.session, 'harvest:randomize-influence')
  assert.notDeepEqual(randomized.session.variant.influences, ['shaper'])
  assert.deepEqual(randomized.session.variant.influences, randomized.session.state.influences)
  const undone = undoManualAction(current, randomized.session)
  assert.deepEqual(undone.session.variant.influences, ['shaper'])
  assert.deepEqual(redoManualAction(current, undone.session).session.variant.influences, randomized.session.variant.influences)
})
