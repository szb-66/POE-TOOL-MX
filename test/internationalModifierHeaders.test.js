import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { matchAffixes, matchEldritchImplicits } from '../electron/modules/item/matcher.js'

// Verbatim stable fields and source hashes from the signed 3.30.0b export.
const field = (id, en, cn, tw, sourceHash, kind = 'dat') => ({ table: kind === 'stat' ? 'metadata/statdescriptions/stat_descriptions.csd' : 'clientstrings', field: kind === 'stat' ? 'variant:0' : 'Text', kind, id, en, cn, tw, sourceHash })
const entries = [
  field('ModDescriptionLinePrefix', 'Prefix Modifier "{0}"', '前缀属性 "{0}"', '前綴 "{0}"', '956b41feb2c3ddb7a243688f1bd144885a110cd39c9c2cb0ea7e40e62677e8df'),
  field('ModDescriptionLineSuffix', 'Suffix Modifier "{0}"', '后缀属性 "{0}"', '後綴 "{0}"', '2591fa206faf19220fe9bbc53a1703529e22ab60fb614607ababbd5bc98245d3'),
  field('ModDescriptionLineTier', ' (Tier: {0})', ' (等阶：{0})', '(階層：{0})', 'cd26635271592d76cebe08b275097349a7fcdd94d7ee89c77da2f4711efdc5e3'),
  field('ModDescriptionLineTierLevel', ' (Tier: {0}, Lvl: {1})', ' （位阶：{0}，等级：{1}）', ' (階級: {0}, 等級: {1})', '82976c7378ff4147307eec64bbb4e9fa12ec71f177f25d65918a0ff9fbeddba8'),
  field('ModDescriptionLineLevel', ' (Lvl: {0})', ' （等级：{0}）', ' (等級: {0})', '517fdb3e14dc691f6ac0d76d347c8a4a75850fbf96703af1c0ebd5d5821bbddc'),
  field('ModDescriptionLineCrafted', 'Master Crafted {0}', '大师级 {0}', '已大師工藝 {0}', '01ba9446dfac48e45db5e69d85492969a43aaa9ae56372bb7d62712b7599680f'),
  field('ModDescriptionLineFractured', 'Fractured {0}', '破碎的 {0}', '已破裂 {0}', '48553f09dafff3b8cb94958145572757314877712c7b52c818b1d8e0fbbeaf62'),
  field('ModDescriptionLineCleansingFireImplicit', 'Searing Exarch Implicit Modifier ({0})', '焚界者基底词缀（{0}）', '灼烙總督固定詞綴 ({0})', '2b0ebb2f3673bfab8cf757602dedbedb8c08fa7c9ab5b5dd9e92e6f086db304a'),
  field('ModDescriptionLineGreatTangleImplicit', 'Eater of Worlds Implicit Modifier ({0})', '灭界者基底词缀（{0}）', '吞噬天地固定詞綴 ({0})', 'e570d3c068ddc9f438a746c33644fc02c1790341a53bf229aee1a19e5ac1a57c'),
  field('EldritchCurrencyTier1', 'Lesser', '次级', '低階', '3bd2e8b6d8d3cf97edba247acb3c6f871ecaf11090f26e739321be118351a9f0'),
  field('EldritchCurrencyTier2', 'Greater', '高级', '高階', '600422f0c79947a6241d8a822c989bbb083e120af412f3c5f8708e48139d4a19'),
  field('EldritchCurrencyTier3', 'Grand', '顶级', '宏偉', '464e1d466885e60e4958a764324fb65e37937dfa006e43d9ba5c01967ab09e3b'),
  field('EldritchCurrencyTier4', 'Exceptional', '卓越', '卓越', 'd8d5a6a2f9edeaac2cbbca230d82367b8d8537a26d439ccb577f5c706a6ac565'),
  field('EldritchCurrencyTier5', 'Exquisite', '精美的', '精緻', 'c65ab0e104f6e60563aced680dcf93739d3a50a747763a09a80105f5279af466'),
  field('EldritchCurrencyTier6', 'Perfect', '完美的', '完美', 'b7b5d051e8cb163147fc8923644983c239c890cb55800bb6031ad2fc155a8a75'),
  field('base_maximum_life', '{0:+d} to maximum Life', '{0:+d} 最大生命', '{0:+d} 最大生命', '1ce6941d397159fd1a49856855968b0c309dbed4dc2dad2d98a598a501cfb067', 'stat')
]
const byId = new Map(entries.map(entry => [entry.id, entry]))
const render = (id, locale, values = []) => byId.get(id)[locale].replaceAll('\\"', '"').replace(/\{(\d+)(?::[^}]+)?\}/g, (_, index) => values[Number(index)])
const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'modifier-headers-3.30.0b' })
const parse = (header, body = '+120 最大生命') => runtime.parseItem(`Item Class: Helmets\nRarity: Rare\nDoom Crown\nRoyal Burgonet\n--------\nItem Level: 86\n--------\n{ ${header} }\n${body}`, 'modifier-headers-3.30.0b')
const target = { kind: 'catalog', effectPattern: '+# to maximum Life', minTier: 1 }
const matches = item => matchAffixes(item, [{ requiredAffixes: [target], selectedAffixes: [] }]).isMatch

test('真实详细头保留原始源文hash，Tier不误读为物品需求等级', () => {
  for (const entry of entries) assert.equal(createHash('sha256').update(entry.en).digest('hex'), entry.sourceHash, entry.id)
  for (const locale of ['en', 'cn', 'tw']) for (const role of ['Prefix', 'Suffix']) for (const tier of [1, 2]) for (const detail of ['ModDescriptionLineTier', 'ModDescriptionLineTierLevel']) {
    const item = parse(render(`ModDescriptionLine${role}`, locale, ['Healthy']) + render(detail, locale, [tier, 80]))
    assert.equal(item.modifiers[0].tier, tier, `${locale}:${role}:${detail}`)
    assert.equal(item.modifiers[0].type, role.toLowerCase())
    assert.equal(matches(item), tier === 1)
    assert.deepEqual(item.explicitMods, ['+120 to maximum Life'])
  }
  for (const locale of ['en', 'cn', 'tw']) {
    const levelOnly = parse(render('ModDescriptionLinePrefix', locale, ['Healthy']) + render('ModDescriptionLineLevel', locale, [80]))
    assert.equal(levelOnly.modifiers[0].tier, 0)
    assert.equal(matches(levelOnly), false)
  }
})

test('EN/CN/TW及混合详细头保持工艺与破碎语义、位置和阶级，最终条件判断一致', () => {
  for (const locale of ['en', 'cn', 'tw']) for (const [wrapper, type] of [['ModDescriptionLineCrafted', 'crafted'], ['ModDescriptionLineFractured', 'fractured']]) for (const mixed of [false, true]) {
    const inner = render('ModDescriptionLinePrefix', mixed ? 'en' : locale, ['Healthy']) + render('ModDescriptionLineTierLevel', locale, [1, 80])
    const item = parse(render(wrapper, locale, [inner]), mixed ? '+120 to maximum Life' : '+120 最大生命')
    const modifier = item.modifiers[0]
    assert.equal(modifier.type, type, `${locale}:${type}:${mixed}`)
    assert.equal(modifier.affixType, 'prefix')
    assert.equal(modifier.tier, 1)
    assert.equal(matches(item), true)
    if (type === 'crafted') assert.deepEqual(item.craftedMods, ['+120 to maximum Life'])
    else assert.equal(item.isFractured, true)
  }
})

test('古灵两来源六级别的真实中文与繁体头转成同一规范隐式，不能退化为天然底材', () => {
  for (const locale of ['en', 'cn', 'tw']) for (const [id, source, canonical] of [
    ['ModDescriptionLineCleansingFireImplicit', 'searing-exarch', 'Searing Exarch'],
    ['ModDescriptionLineGreatTangleImplicit', 'eater-of-worlds', 'Eater of Worlds']
  ]) for (let tier = 1; tier <= 6; tier++) for (const mixed of [false, true]) {
    const grade = render(`EldritchCurrencyTier${tier}`, mixed ? 'en' : locale)
    const item = parse(render(id, locale, [grade]))
    assert.equal(item.modifiers[0].type, 'implicit', `${locale}:${id}:${tier}`)
    assert.equal(item.modifiers[0].sourceSubtype, source)
    assert.ok(item.canonicalText.includes(`${canonical} Implicit Modifier (${byId.get(`EldritchCurrencyTier${tier}`).en})`))
    assert.equal(matchEldritchImplicits(item, [{ effectPattern: '+# to maximum Life' }]).isMatch, true)
  }
})

test('结构归一不猜译引用词缀名与标签，未知来源、级别或冲突结构拒绝解析', () => {
  const name = '吞噬天地的完美階層: 99'
  const item = parse(render('ModDescriptionLinePrefix', 'tw', [name]) + render('ModDescriptionLineTier', 'tw', [1]) + ' — 生命, 灼烙總督')
  assert.equal(item.modifiers[0].name, name)
  assert.deepEqual(item.modifiers[0].tags, ['生命', '灼烙總督'])
  assert.equal(item.modifiers[0].tier, 1)
  assert.equal(item.modifiers[0].sourceSubtype, null)
  for (const header of [
    '未知来源 Prefix Modifier "Healthy" (Tier: 1)',
    'UnknownOrigin Prefix Modifier "Healthy" (Tier: 1)',
    '焚界者基底词缀（未知等级）',
    '灼烙總督固定詞綴 (UnknownGrade)',
    '吞噬天地固定詞綴 (Perfect) Searing Exarch Implicit Modifier',
    '前缀属性 "A" 后缀属性 "B" (等阶: 1)',
    '前綴 "Healthy" (階層: 1, Tier: 2)'
  ]) assert.throws(() => parse(header), error => error.code === 'LOCALIZATION_HEADER_UNRESOLVED', header)
})
