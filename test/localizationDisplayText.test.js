import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createLocalizationDictionary, localizationStructureAliases } from '../electron/modules/localization/text.js'
import { LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { matchMapRequirements, matchAffixes } from '../electron/modules/item/matcher.js'

// Minimal verbatim entries from the signed 3.30.0b official-resource export.
const dat = (id, en, cn, tw) => ({ table: 'clientstrings', field: 'Text', kind: 'dat', id, en, cn, tw })
const stat = (id, en, cn, tw, table = 'stat_descriptions') => ({ table: `metadata/statdescriptions/${table}.csd`, field: 'variant:0', kind: 'stat', id, en, cn, tw })
const raw = [
  dat('ItemDisplayMapDropScalingBonus', '[AtlasDropScaling|Atlas Drops]', undefined, '[AtlasDropScaling|輿圖掉落物]'),
  dat('ItemDisplayHeistAlertLevelReduction', 'Alert Level Reduction', '警报等级衰减', '警戒等級減免'),
  dat('ItemDisplayHeistMaxReinforcements', 'Maximum Alive Reinforcements', '最大存活援军', '最大生存支援'),
  stat('item_found_rarity_+%', '{0:+d}% to [PlayerItemRarity|Item Rarity]', '[PlayerItemRarity|物品稀有度] {0:+d}%', '{0:+d}%[PlayerItemRarity|物品稀有度]'),
  stat('damage_taken_+%_from_blinded_enemies', '{0}% increased Damage taken from [Blind|Blinded] Enemies', '承受来自致盲敌人的伤害提高 {0}%', '增加承受來自致盲敵人的 {0}% 傷害'),
  stat('keystone_quiet_might', '3% more Spell Damage per Power Charge\\nGain Power Charges instead of Frenzy Charges', '每个暴击球使法术伤害总增 3%\\n获得暴击球来取代狂怒球', '每顆暴擊球 3% 更多法術傷害\\n獲得暴擊球而不是狂怒球', 'passive_skill_stat_descriptions'),
  stat('every_10_seconds_physical_damage_%_to_add_as_fire_for_3_seconds', 'Every 10 seconds, gain {0}% of Physical Damage\\nas Extra Fire Damage for 4 seconds', '每 10 秒，在 4 秒内获得等同于\\n物理伤害 {0}% 的额外火焰伤害', '每 10 秒，獲得 {0}% 物理傷害的額外火焰傷害 5 秒')
]
const entries = raw.map(entry => ({ ...entry, sourceHash: createHash('sha256').update(entry.en).digest('hex') }))
const base = 'Item Class: Maps\nRarity: Rare\nDoom Domain\nFortress Map\n--------\n'
const body = '\n--------\nItem Level: 84\n--------\n{ Prefix Modifier "Fixture" (Tier: 1) }\n'

test('GGG显示标记在原文hash验证之后移除，属性使用当前受管繁体标签', () => {
  const dictionary = createLocalizationDictionary(entries)
  assert.equal(dictionary.toEnglish('輿圖掉落物'), 'Atlas Drops')
  assert.deepEqual(dictionary.aliasesFor('Atlas Drops'), ['Atlas Drops', '輿圖掉落物'])
  assert.ok(dictionary.aliasesFor('Atlas Drops:').includes('輿圖掉落物:'))
  const structure = localizationStructureAliases(dictionary)
  assert.equal(structure['輿圖掉落物'], 'Atlas Drops')
  assert.equal(structure['警戒等級減免'], 'Alert Level Reduction')
  assert.equal(structure['最大生存支援'], 'Maximum Alive Reinforcements')
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'fixture' })
  const map = runtime.parseItem(base + '輿圖掉落物: +140%（增幅）' + body + '承受来自致盲敌人的伤害提高 20%', 'fixture')
  assert.equal(map.atlasDrops, 140)
  assert.equal(map.explicitMods[0], '20% increased Damage taken from Blinded Enemies')
  assert.equal(matchMapRequirements(map, { match: { blacklist: ['#% increased Damage taken from Blinded Enemies'] } }).reason, 'blacklist')
  const heist = runtime.parseItem(base.replace('Maps', 'Contracts') + '警戒等級減免: 20%\n最大生存支援: 30%' + body + 'Monsters deal 20% increased Damage', 'fixture')
  assert.equal(heist.heistStats.alertLevelReduction, 20)
  assert.equal(heist.heistStats.maximumAliveReinforcements, 30)
  const wrongHash = entries.map(entry => ({ ...entry, sourceHash: createHash('sha256').update(entry.en.replace(/\[[^|]+\|([^\]]+)\]/g, '$1')).digest('hex') }))
  assert.throws(() => createLocalizationDictionary(wrongHash).toEnglish('輿圖掉落物', { strict: true }), /未匹配/)
})

test('可见词缀数值保留符号、详细范围和固定数值边界', () => {
  const dictionary = createLocalizationDictionary(entries)
  for (const [input, expected] of [
    ['物品稀有度 +25%', '+25% to Item Rarity'], ['+25%物品稀有度', '+25% to Item Rarity'],
    ['物品稀有度 -25%', '-25% to Item Rarity'], ['物品稀有度 +25(20—30)%', '+25(20—30)% to Item Rarity']
  ]) assert.equal(dictionary.toEnglish(input, { strict: true }), expected)
  assert.ok(dictionary.aliasesFor('+25% to Item Rarity').includes('+25%物品稀有度'))
  assert.equal(dictionary.toEnglish('每 10 秒，在 4 秒内获得等同于\n物理伤害 25% 的额外火焰伤害'), 'Every 10 seconds, gain 25% of Physical Damage\nas Extra Fire Damage for 4 seconds')
  assert.throws(() => dictionary.toEnglish('每 110 秒，在 4 秒内获得等同于\n物理伤害 25% 的额外火焰伤害', { strict: true }), /未匹配/)
})

test('多行词缀保持换行和参数身份，允许同一词缀中英混合且不拼接无关行', () => {
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'fixture' })
  const expected = ['3% more Spell Damage per Power Charge', 'Gain Power Charges instead of Frenzy Charges']
  for (const text of ['每个暴击球使法术伤害总增 3%\n获得暴击球来取代狂怒球', '每顆暴擊球 3% 更多法術傷害\n獲得暴擊球而不是狂怒球', '每个暴击球使法术伤害总增 3%\nGain Power Charges instead of Frenzy Charges']) {
    const item = runtime.parseItem(base + body + text, 'fixture')
    assert.deepEqual(item.explicitMods, expected)
    assert.equal(matchAffixes(item, [{ requiredAffixes: [{ kind: 'catalog', effectPattern: '#% more Spell Damage per Power Charge\nGain Power Charges instead of Frenzy Charges' }], selectedAffixes: [] }]).isMatch, true)
  }
  assert.throws(() => runtime.parseItem(base + body + '每个暴击球使法术伤害总增 3%\n完全未知效果', 'fixture'), /未匹配/)
})

test('别名缓存不暴露内部数组，不同词库实例和大量自由查询互不污染', () => {
  const dictionary = createLocalizationDictionary(entries)
  const first = dictionary.aliasesFor('Atlas Drops')
  first.push('污染别名')
  first[0] = '错误原文'
  assert.deepEqual(dictionary.aliasesFor('Atlas Drops'), ['Atlas Drops', '輿圖掉落物'])
  assert.equal(dictionary.localize('Atlas Drops'), '輿圖掉落物')
  assert.deepEqual(createLocalizationDictionary([]).aliasesFor('Atlas Drops'), ['Atlas Drops'])
  for (let index = 0; index < 10001; index++) dictionary.aliasesFor(`User text ${index}`)
  assert.deepEqual(dictionary.aliasesFor('Atlas Drops'), ['Atlas Drops', '輿圖掉落物'])
})
