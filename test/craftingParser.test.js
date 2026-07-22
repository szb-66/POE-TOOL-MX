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
  parseEssenceSource,
  parseBaseRequirements,
  parsePoedbBases,
  parsePoedbCrafts,
  parsePoedbCorruptedImplicits,
  parsePoedbEldritchImplicits,
  parsePoedbModifiers
} from '../electron/modules/crafting/poedbParser.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name) => readFileSync(path.join(dirname, 'fixtures', 'crafting', name), 'utf8')

test('解析底材、普通/势力词缀和阶级权重', () => {
  const bases = parsePoedbBases(fixture('items.html'), { category: '首饰与珠宝' })
  const modifiers = parsePoedbModifiers(fixture('modifiers.html'))
  assert.equal(bases[0].name, '珊瑚戒指')
  assert.equal(bases[0].implicitModifiers[0].values[0].max, 30)
  assert.equal(bases[1].allowedVariants.includes('influenced'), false)
  assert.deepEqual(bases[1].maxAffixes, { prefix: 2, suffix: 2 })
  assert.equal(modifiers[0].tiers[0].requiredLevel, 81)
  assert.equal(modifiers[0].tiers[0].values[0].max, 79)
  assert.deepEqual(modifiers[1].influences, ['shaper'])
})

test('瓦尔腐化隐式按效果、等级、装备类别和权重聚合', () => {
  const families = parsePoedbCorruptedImplicits(fixture('vaal.html'))
  assert.equal(families.length, 1)
  assert.deepEqual(families[0].itemClasses, ['Belt', 'Ring'])
  assert.equal(families[0].tiers.length, 2)
  assert.equal(families[0].tiers[0].requiredLevel, 75)
  assert.equal(families[0].tiers[0].weights.Ring, 500)
  assert.deepEqual(families[0].displayTags.map((tag) => tag.id), ['life'])
})

test('底材需求按标签解析并保留基础属性与固有词缀', () => {
  assert.deepEqual(parseBaseRequirements('需求 9 力量'), { level: 1, strength: 9, dexterity: 0, intelligence: 0 })
  assert.deepEqual(parseBaseRequirements('需求 等级 20, 30 力量, 30 智慧'), { level: 20, strength: 30, dexterity: 0, intelligence: 30 })
  const html = `<section class="card"><h5 class="card-header">头部 物品 /2</h5>
    <div class="col"><a class="whiteitem Helmet" href="Iron_Hat"><img src="helmet.webp"></a><a class="whiteitem Helmet" href="Iron_Hat">粗铁盔</a><div class="property">护甲: <span>9—13</span></div><div class="requirements">需求 <span>9</span> 力量</div></div>
    <div class="col"><a class="whiteitem Helmet" href="Hybrid_Helmet"><img src="hybrid.webp"></a><a class="whiteitem Helmet" href="Hybrid_Helmet">混合测试盔</a><div class="property">护甲: <span>40—50</span></div><div class="property">能量护盾: <span>12—16</span></div><div class="property">物理伤害: <span>6—12</span></div><div class="requirements">需求 等级 <span>20</span>, <span>30</span> 力量, <span>30</span> 智慧</div><div class="implicitMod">+(10—15)% 火焰抗性</div></div>
  </section>`
  const bases = parsePoedbBases(html, { category: '装备' })
  const iron = bases.find((entry) => entry.sourceId === 'Iron_Hat')
  const hybrid = bases.find((entry) => entry.sourceId === 'Hybrid_Helmet')
  assert.equal(iron.requiredLevel, 1)
  assert.deepEqual(iron.requirements, { level: 1, strength: 9, dexterity: 0, intelligence: 0 })
  assert.equal(iron.baseStats[0].values[0].max, 13)
  assert.deepEqual(hybrid.requirements, { level: 20, strength: 30, dexterity: 0, intelligence: 30 })
  assert.equal(hybrid.baseStats.length, 3)
  assert.deepEqual(hybrid.baseStats[2].values, [{ min: 6, max: 6 }, { min: 12, max: 12 }])
  assert.equal(hybrid.baseStats[2].text, '物理伤害: 6—12'.replace('6—12', '#—#'))
  assert.equal(hybrid.implicitModifiers[0].values[0].min, 10)
  assert.deepEqual(hybrid.implicitModifiers[0].displayTags.map((tag) => tag.id), ['resistance', 'elemental'])
  assert.equal(hybrid.qualityType, 'armour')
  assert.equal(hybrid.socketLimit, 4)
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
  assert.equal(inferCraftEffectKind('将物品上一个随机插槽颜色重铸为白色', 'harvest'), 'white_socket')
  assert.equal(inferCraftEffectKind('重铸一件稀有物品，其中包括一个生命词缀', 'harvest'), 'reforge_tag')
  assert.equal(inferCraftEffectKind('重铸一件稀有物品，大概率不会得到相同词缀类型', 'harvest'), 'reforge_less_likely')
})

test('当前花园表格保留未知行并解析资源名在前的多资源成本', () => {
  const html = `<table><thead><tr><th>描述</th><th>消耗</th></tr></thead><tbody>
    <tr><td><span>重铸</span>一件带随机词缀的稀有物品，其中包括一个<span>召唤生物</span>词缀</td><td><a class="item_currency" href="Primal_Crystallised_Lifeforce">原始蓝晶命能</a> x200<br><a class="item_currency" href="Crystallised_Rancour">憎恨结晶</a> x3</td></tr>
    <tr><td><span>重铸</span>一件带随机词缀的稀有物品，其中包括一个<span>掉落</span> 属性</td><td><a class="item_currency" href="Vivid_Crystallised_Lifeforce">活性黄晶命能</a> x200<br><a class="item_currency" href="Crystallised_Rancour">憎恨结晶</a> x1</td></tr>
    <tr><td>将一个提供冰霜抗性的词缀变为近似位阶，但提供火焰抗性的词缀</td><td><a class="item_currency" href="Wild_Crystallised_Lifeforce">狂野紫晶命能</a> x500</td></tr>
    <tr><td>未来新增且尚未识别的花园效果</td><td><a class="item_currency" href="Vivid_Crystallised_Lifeforce">活性黄晶命能</a> x123</td></tr>
  </tbody></table>`
  const crafts = parsePoedbCrafts(html, { provider: 'harvest' })
  assert.equal(crafts.length, 4)
  assert.equal(crafts[0].effectKind, 'reforge_tag')
  assert.equal(crafts[0].params.tag, 'minion')
  assert.deepEqual(crafts[0].cost.map(({ resourceName, amount }) => [resourceName, amount]), [['原始蓝晶命能', 200], ['憎恨结晶', 3]])
  assert.equal(crafts[1].params.tag, 'drop')
  assert.deepEqual(crafts[1].cost.map(({ resourceName, amount }) => [resourceName, amount]), [['活性黄晶命能', 200], ['憎恨结晶', 1]])
  assert.equal(crafts[2].effectKind, 'convert_resistance')
  assert.deepEqual(crafts[2].params, { fromTag: 'cold', toTag: 'fire', hover: '', unlock: '' })
  assert.equal(crafts[3].effectKind, 'unsupported')
  assert.equal(crafts[3].cost[0].amount, 123)
})

test('古灵隐式表按来源、效果和类别聚合六个阶级', () => {
  const rows = (label, tag, extra = '') => Array.from({ length: 6 }, (_, index) => {
    const tier = index + 1
    return `<tr><td>75</td><td><span class="implicitMod">${label} <span class="mod-value">${tier + 7}</span>%</span><span data-tag="${tag}">${tag}</span></td><td><i>no_tier_${7 - tier}_eldritch_implicit</i> 0<br><i>gloves</i> 1000<br>${extra}<i>default</i> 0</td></tr>`
  }).join('')
  const html = `<table data-eldritch-source="exarch"><tbody>${rows('攻击速度加快', 'speed')}</tbody></table>
    <table data-eldritch-source="eater"><tbody>${rows('法术伤害压制率', 'defences', '<i>amulet</i> 1000<br>')}</tbody></table>`
  const families = parsePoedbEldritchImplicits(html)
  assert.equal(families.length, 2)
  assert.deepEqual(families.map((family) => family.source).sort(), ['eater', 'exarch'])
  assert.ok(families.every((family) => family.tiers.length === 6))
  assert.deepEqual(families[0].tiers.map((tier) => tier.tier), [1, 2, 3, 4, 5, 6])
  assert.deepEqual(families[0].itemClasses, ['Gloves'])
  assert.equal(families[0].tiers[0].weights.Gloves, 1000)
  assert.equal(families[0].tiers[0].weights.Amulet, undefined)
})

test('古灵 T1 零权重行保留为冲突石可降阶结果', () => {
  const rows = Array.from({ length: 6 }, (_, index) => `<tr><td>75</td><td><span class="implicitMod">效果 ${index + 1}%</span></td><td><i>no_tier_${6 - index}_eldritch_implicit</i> 0<br><i>gloves</i> ${index ? 500 : 0}</td></tr>`).join('')
  const families = parsePoedbEldritchImplicits(`<table data-eldritch-source="exarch"><tbody>${rows}</tbody></table><table data-eldritch-source="eater"><tbody>${rows}</tbody></table>`)
  assert.equal(families.length, 2)
  assert.ok(families.every((family) => family.tiers.length === 6 && family.tiers[0].weights.Gloves === 0))
})

test('古灵 T6 的百分百命中文案与 T1–T5 几率文案归为同一家族', () => {
  const rows = [1, 2, 3, 4, 5].map((tier) => `<tr><td>75</td><td><span class="implicitMod">攻击击中时有 ${70 + tier * 5}% 的几率造成瘫痪</span></td><td><i>no_tier_${7 - tier}_eldritch_implicit</i> 0<br><i>gloves</i> 120</td></tr>`).join('')
  const perfect = '<tr><td>75</td><td><span class="implicitMod">攻击击中造成瘫痪</span></td><td><i>no_tier_1_eldritch_implicit</i> 0<br><i>gloves</i> 120</td></tr>'
  const html = `<table data-eldritch-source="exarch"><tbody>${rows}${perfect}</tbody></table><table data-eldritch-source="eater"><tbody>${rows}${perfect}</tbody></table>`
  const families = parsePoedbEldritchImplicits(html)
  assert.equal(families.length, 2)
  assert.ok(families.every((family) => family.tiers.length === 6 && family.tiers[5].text === '攻击击中造成瘫痪'))
})

test('古灵家族六阶全零权重时不进入可执行目录', () => {
  const rows = Array.from({ length: 6 }, (_, index) => `<tr><td>75</td><td><span class="implicitMod">无效效果 ${index + 1}%</span></td><td><i>no_tier_${6 - index}_eldritch_implicit</i> 0<br><i>gloves</i> 0</td></tr>`).join('')
  assert.deepEqual(parsePoedbEldritchImplicits(`<table data-eldritch-source="exarch"><tbody>${rows}</tbody></table><table data-eldritch-source="eater"><tbody>${rows}</tbody></table>`), [])
})

test('ModsView JSON 边界解析不执行脚本', () => {
  const html = '<script>new ModsView({"gen":{"1":"前缀"},"normal":[]}); alert("ignored")</script>'
  assert.deepEqual(extractModsViewPayload(html).normal, [])
  assert.throws(() => extractModsViewPayload('<script>new ModsView({"normal":[])</script>'), /未闭合|Unexpected/)
})

test('ModsView 对象映射来源不会丢失势力与特殊词缀', () => {
  const record = (name, family) => ({
    Name: name, Level: '68', ModGenerationTypeID: '1', ModFamilyList: [family],
    DropChance: '100', str: '法术伤害提高 (10—20)%', spawn_no: ['wand'], mod_no: [], fossil_no: []
  })
  const payload = {
    opt: { ItemClassesCode: 'Wand', BaseItemName: 'Test Wand', tags: 'wand' },
    baseitem: { Code: 'Test_Wand' }, normal: [record('术士的', 'EssenceSpell')],
    shaper: { 1: record('塑界者的', 'ShaperSpell') },
    delve: { 2: record('地下的', 'DelveSpell') },
    incursion: { 3: record('神庙的', 'IncursionSpell') },
    veiled: { 4: record('天选的', 'VeiledSpell') },
    essence: { 5: record('精华的', 'EssenceSpell') }
  }
  const modifiers = parsePoedbModifiers(`<script>new ModsView(${JSON.stringify(payload)})</script>`, { profileId: 'Wands' })
  assert.deepEqual(new Set(modifiers.map((entry) => entry.source)), new Set(['natural', 'delve', 'incursion', 'veiled', 'essence']))
  assert.deepEqual(modifiers.find((entry) => entry.influences.length).influences, ['shaper'])
  assert.notEqual(modifiers.find((entry) => entry.source === 'essence').goalId, modifiers.find((entry) => entry.source === 'natural' && !entry.influences.length).goalId)
})

test('精华来源解析为纯文本名称和准确阶级规则', () => {
  const ordinary = parseEssenceSource('<a href="Deafening_Essence_of_Greed"><img src="Greed7.webp">贪婪之破空精华</a>')
  assert.deepEqual(ordinary, {
    id: 'Deafening_Essence_of_Greed', name: '贪婪之破空精华', tier: 7,
    minimumItemLevel: 65, randomModifierLevelCap: null, canReforgeRare: true
  })
  const low = parseEssenceSource('<a href="/cn/Whispering_Essence_of_Woe">悲痛之低语精华</a>')
  assert.equal(low.randomModifierLevelCap, 35)
  assert.equal(low.canReforgeRare, false)
  const special = parseEssenceSource('<a href="Essence_of_Desolation">哀恸精华</a>')
  assert.equal(special.tier, 8)
  assert.equal(special.canReforgeRare, true)
  assert.equal(parseEssenceSource('精华名称缺少资源链接'), null)
})

test('精华 ModsView 阶级不向名称泄漏 HTML', () => {
  const record = {
    Name: '<a href="Whispering_Essence_of_Woe"><img src="Woe1.webp">悲痛之低语精华</a>',
    Level: '2', ModGenerationTypeID: '1', ModFamilyList: ['CasterDamage'], DropChance: '0',
    str: '法术伤害提高 (10—19)%', spawn_no: ['wand'], mod_no: [], fossil_no: []
  }
  const payload = { opt: { ItemClassesCode: 'Wand', BaseItemName: 'Test Wand', tags: 'wand' }, baseitem: { Code: 'Test_Wand' }, essence: { 1: record } }
  const modifier = parsePoedbModifiers(`<script>new ModsView(${JSON.stringify(payload)})</script>`, { profileId: 'Wands' })[0]
  assert.equal(modifier.tiers[0].name, 'T1 悲痛之低语精华')
  assert.equal(modifier.tiers[0].sourceItem.id, 'Whispering_Essence_of_Woe')
  const mergedTier = mergeModifierGoals([modifier], [])[0].tiers[0]
  assert.equal(mergedTier.tier, 1)
  assert.equal(mergedTier.name, 'T1 悲痛之低语精华')
})

test('短杖底材最终化时补齐词缀池所需标签', () => {
  const [base] = finalizePoedbBases([{ id: 'base:sceptre', sourceId: 'Sceptre1', name: '测试短杖', category: '武器', itemClass: 'Sceptre', tags: ['default'], requiredLevel: 1 }])
  assert.equal(base.modifierProfileId, 'Sceptres')
  assert.ok(base.tags.includes('sceptre'))
})
