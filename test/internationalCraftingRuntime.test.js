import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { pythonPath } from './helpers/python.js'
import { normalizeItemTextLanguage } from '../shared/itemTextLanguage.js'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { parseItemInfo as parseFrontendItem } from '../src/utils/clipboard.js'
import { matchAffixes, matchMapRequirements, matchMapTerm } from '../electron/modules/item/matcher.js'
import { currencyExpectedNames, buildCraftingCurrencyPreflight } from '../src/utils/currencyPreflight.js'
import { cleanMigratedMapConfig, INTERNATIONAL_MAP_BASE_STATS } from '../src/utils/mapPresetMigration.js'
import { analyzeMapFeasibility } from '../src/domains/map/mapFeasibility.js'

const source = name => readFileSync(new URL(`../src/assets/scripts/${name}`, import.meta.url), 'utf8')
const mapTemplate = source('map_rolling_template.py')
const craftingTemplate = source('crafting_template.py')
const block = (text, start, end) => text.slice(text.indexOf(start), text.indexOf(end, text.indexOf(start)))
function python(script) {
  const result = spawnSync(pythonPath, ['-'], { input: script, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr || String(result.error))
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

const equipment = `Item Class: Helmets
Rarity: Rare
Doom Crown
Royal Burgonet
--------
Armour: 312
--------
Requirements:
Level: 67
Str: 148
--------
Sockets: R-R-B
--------
Item Level: 86
--------
{ Prefix Modifier "Athlete's" (Tier: 1) — Life }
+120(110-120) to maximum Life
{ Suffix Modifier "of the Rainbow" (Tier: 2) — Elemental, Resistance }
+15% to all Elemental Resistances
{ Master Crafted Prefix Modifier "Unchanging" }
Suffixes Cannot Be Changed
--------
Shaper Item`

test('英文制作物品保留原文词缀并解析T级、工艺、势力及插槽', () => {
  const item = parseItemInfo(equipment)
  assert.equal(item.category, '头部')
  assert.equal(item.itemTextLanguage, 'en')
  assert.equal(item.baseName, 'Royal Burgonet')
  assert.equal(item.level, 86)
  assert.equal(item.links, 3)
  assert.equal(item.modifiers[0].tier, 1)
  assert.deepEqual(item.craftedMods, ['Suffixes Cannot Be Changed'])
  assert.deepEqual(item.influences, ['shaper'])
  assert.equal(matchAffixes(item, [{ enabled: true, requiredAffixes: [{ kind: 'catalog', effectPattern: '+# to maximum Life', minTier: 1 }], selectedAffixes: [] }]).isMatch, true)
  assert.equal(matchAffixes(item, [{ enabled: true, requiredAffixes: [{ kind: 'catalog', effectPattern: '+#% to all Elemental Resistances', minTier: 1 }], selectedAffixes: [] }]).isMatch, false)
  assert.equal(normalizeItemTextLanguage('普通中文物品'), '普通中文物品')
})

const mapText = `Item Class: Maps
Rarity: Rare
Doom Domain
Fortress Map
--------
Map Tier: 17
Atlas Drops: +140%
Item Rarity: +90%
Monster Pack Size: +40%
More Maps: +30%
More Threads: +80%
More Currency: +60%
--------
Item Level: 84
--------
{ Prefix Modifier "Reflecting" (Tier: 1) }
Monsters reflect 18% of Physical Damage
--------
Corrupted`

test('3.30地图独立识别Atlas Drops和Threads，JS与前端保持字段一致', () => {
  for (const parse of [parseItemInfo, parseFrontendItem]) {
    const item = parse(mapText)
    assert.equal(item.atlasDrops, 140)
    assert.equal(item.moreThreads, 80)
    assert.equal(item.moreScarabs, 0)
    assert.equal(item.itemQuantity, 0)
    assert.equal(item.isCorrupted, true)
  }
  const item = parseItemInfo(mapText)
  const config = { match: { mandatoryStats: { atlasDrops: { enabled: true, value: 140 }, moreThreads: { enabled: true, value: 80 } }, blacklist: ['Monsters cannot be Stunned'] } }
  assert.equal(matchMapRequirements(item, config).isMatch, true)
  config.match.mandatoryStats.moreThreads.value = 81
  assert.equal(matchMapRequirements(item, config).isMatch, false)
  config.match.mandatoryStats.moreThreads.value = 80
  config.match.blacklist = ['reflect']
  assert.equal(matchMapRequirements(item, config).reason, 'blacklist')
})

test('英文契约和蓝图的固定说明不进入可洗词缀', () => {
  for (const category of ['Contracts', 'Blueprints']) {
    const text = `Item Class: ${category}\nRarity: Rare\nDoom Job\nLaboratory\n--------\nArea Level: 83\nHeist Target: Moderate-value Target\nWings Revealed: 1/3\nEscape Routes Revealed: 0/6\nReward Rooms Revealed: 0/12\nItem Quantity: +52%\nItem Rarity: +31%\nAlert Level Reduction: 20%\nTime before Lockdown: 20%\nMaximum Alive Reinforcements: 20%\n--------\nItem Level: 83\n--------\n{ Prefix Modifier "Savage" (Tier: 1) }\nMonsters deal 20% increased Damage\n--------\nRequires Lockpicking (Level 5)\nTravel to the Rogue Harbour and talk to Adiyah to embark on this Heist.`
    const item = parseItemInfo(text)
    assert.equal(item.category, category === 'Contracts' ? '契约' : '蓝图')
    assert.deepEqual(item.heistStats, { quantity: 52, rarity: 31, alertLevelReduction: 20, timeBeforeLockdown: 20, maximumAliveReinforcements: 20 })
    assert.deepEqual(item.explicitMods, ['Monsters deal 20% increased Damage'])
  }
})

test('英文海图采用当前邻接奖励属性和真实Sulphur名称', () => {
  const text = `Item Class: Chart\nRarity: Rare\nDoom Course\nSandy Seabed Chart\n--------\nArea Level: 83\nRarity of Items found in adjacent Areas: +55%\nPack Size in adjacent Areas: +20%\nDead Man's Sulphur found in adjacent Areas: +35%\n--------\nVoyage Modifier will be revealed once Charted\n--------\nItem Level: 83\n--------\n{ Prefix Modifier "Wealthy" (Tier: 1) }\nMonsters deal 20% increased Damage`
  for (const parse of [parseItemInfo, parseFrontendItem]) {
    const item = parse(text)
    assert.equal(item.category, '海图')
    assert.equal(item.baseName, 'Sandy Seabed Chart')
    assert.equal(item.itemRarity, 55)
    assert.equal(item.monsterPackSize, 20)
    assert.equal(item.deadmanSulphur, 35)
    assert.equal(item.explicitMods.some(line => line.includes('Voyage Modifier')), false)
  }
})

test('新版地图预设字段保存而不将旧数量/圣甲虫阈值转成新版字段', () => {
  const migrated = cleanMigratedMapConfig({ match: { mandatoryStats: { moreScarabs: { enabled: true, value: 70 }, moreThreads: { enabled: true, value: 90 }, atlasDrops: { enabled: true, value: 120 } } } })
  assert.equal(migrated.match.mandatoryStats.moreThreads.value, 90)
  assert.equal(migrated.match.mandatoryStats.atlasDrops.value, 120)
  assert.equal(migrated.match.mandatoryStats.moreScarabs.value, 70)
  assert.equal(Object.values(INTERNATIONAL_MAP_BASE_STATS).includes('moreScarabs'), false)
  assert.equal(analyzeMapFeasibility({ serverId: 'international', kind: 'atlas', profile: migrated, catalog: { gameVersion: '3.29', pools: [] } }).status, 'unknown')
})

test('英文词缀数字模板保留作用对象与正负号，JS和Python匹配及统计一致', () => {
  const cases = [
    ['Monsters have 45% increased Area of Effect', 'Monsters have #% increased Area of Effect', true],
    ['Unique Boss has 45% increased Area of Effect', 'Monsters have #% increased Area of Effect', false],
    ['Monsters have +45(30—45)% to Fire Resistance', 'Monsters have +#% to Fire Resistance', true],
    ['Monsters have -45% to Fire Resistance', 'Monsters have +#% to Fire Resistance', false],
    ['Monsters deal 100 to 200 added Fire Damage', 'Monsters deal # to # added Fire Damage', true],
    ['Monsters deal 20% increased Damage', 'increased Damage', true]
  ]
  for (const [mod, term, expected] of cases) assert.equal(matchMapTerm(mod, term), expected)
  const helpers = block(mapTemplate, 'def map_term_matches(', 'def check_map_requirements(')
  const result = python(`import json\n${helpers}\ncases=json.loads(${JSON.stringify(JSON.stringify(cases))})\nmap_config={'match':{'blacklist':['Monsters have #% increased Area of Effect'],'whitelist':[]}}\nprint(json.dumps({'matches':[map_term_matches(mod,term) for mod,term,_ in cases], 'boss':check_map_mods({'explicitMods':['Unique Boss has 45% increased Area of Effect']}), 'monster':check_map_mods({'explicitMods':['Monsters have 45% increased Area of Effect']}), 'stats':count_affix_stats({'explicitMods':['Monsters have 45% increased Area of Effect']})}))`)
  assert.deepEqual(result.matches, cases.map(entry => entry[2]))
  assert.equal(result.boss, true)
  assert.equal(result.monster, false)
  assert.deepEqual(result.stats, [{ 'Monsters have #% increased Area of Effect': 1 }, {}])
})

test('两类制作脚本只接受目标服准确通货身份，保留名称附加标签兼容', () => {
  const names = currencyExpectedNames('international')
  assert.ok(buildCraftingCurrencyPreflight({ moduleTwo: { enabled: true } }).every(id => names[id]))
  for (const template of [craftingTemplate, mapTemplate]) {
    const helper = block(template, 'CURRENCY_NAMES =', 'def fail_currency_preflight(')
    const result = python(`import json\n${helper}\ncurrency_expected_names = json.loads(${JSON.stringify(JSON.stringify(names))})\nprint(json.dumps([currency_identity_matches('alteration', 'Orb of Alteration'), currency_identity_matches('scouring', 'Orb of Scouring[0.4c]'), currency_identity_matches('alteration', 'Chaos Orb'), currency_identity_matches('alteration', '改造石'), currency_identity_matches('alteration', 'Fake Orb of Alteration')]))`)
    assert.deepEqual(result, [true, true, false, false, false])
  }
})

test('英文制作与地图脚本可编译，精华预检接受英文精华并拒绝其他通货', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript, generateMapRollingScript } = await server.ssrLoadModule('/src/utils/python.js')
    for (const page of ['items/ItemsView.vue', 'items/components/ModuleOne.vue', 'items/components/ModuleBatch.vue', 'items/components/SpecializedCraftingPanel.vue', 'map/MapView.vue', 'map/components/MapFeasibilityNotice.vue']) {
      assert.ok(await server.transformRequest(`/src/domains/${page}`, { ssr: true }))
    }
    const base = { serverId: 'international', globalShortcuts: { end: 'F12' }, currencyPositions: {}, itemPosition: { x: 1, y: 2 }, actionPosition: { x: 3, y: 4 }, filePaths: {}, preset: { moduleTwo: { enabled: true, affixGroups: [] }, moduleThree: {}, moduleEldritch: {} } }
    const scripts = ['general', 'essence', 'harvest'].map(craftingKind => generatePythonScript({ ...base, craftingKind }))
    scripts.push(generateMapRollingScript({ ...base, inventory: {}, mapConfig: { method: 'alchemy', match: {} } }))
    const compiled = spawnSync(pythonPath, ['-c', 'import json,sys; [compile(s,"generated.py","exec") for s in json.load(sys.stdin)]'], { input: JSON.stringify(scripts), encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
    assert.equal(compiled.status, 0, compiled.stderr)
    assert.ok(scripts.every(s => !s.includes('{{') && s.includes('Orb of Alteration')))
    const essencePreflight = block(scripts[1], 'def preflight_specialized_action():', 'def craft_specialized(')
    const identity = block(craftingTemplate, 'def copied_item_header(', 'def currency_identity_matches(')
    const outcome = python(`import json\n${identity}\n${essencePreflight}\nlocalization_snapshot = {'canonicalEssenceNames':['Deafening Essence of Greed','Essence of Horror']}\naction_position = {'x':1,'y':2}\nsequence = 0\nname = ''\nGetClipboardSequenceNumber = lambda: sequence\nmove_mouse = lambda *_: True\npyperclip = type('Clipboard', (), {'paste': staticmethod(lambda: '')})\ndef send_copy_command(*args, **kwargs):\n    global sequence\n    sequence += 1\n    return 'Item Class: Stackable Currency\\nRarity: Currency\\n' + name + '\\n--------'\ndef fail_item_runtime(*_): return False\nresult = []\nfor name in ['Deafening Essence of Greed', 'Essence of Horror', 'Chaos Orb', 'Remnant of Corruption']:\n    result.append(preflight_specialized_action())\nprint(json.dumps(result))`)
    assert.deepEqual(outcome, [true, true, false, false])
  } finally {
    await server.close()
  }
})

test('国际服腐化九词地图通过，未腐化七词和腐化十词均不消耗通货', () => {
  const runtime = block(mapTemplate, 'def process_single_map(', 'def read_and_parse(')
  const result = python(`import json\n${runtime}\nis_running = True\nmap_config = {'serverId':'international','targetKind':'atlas','method':'alchemy','autoStash':False}\nitem_matches_rolling_target = lambda _: True\nrolling_target_label = lambda: '地图'\nrolling_item_level_label = lambda _: 'T16'\nfailed_map_result = lambda reason,code: {'failed':code}\ncompleted_map_result = lambda qualified=False: {'qualified':qualified}\ncheck_map_base = lambda _: True\ncheck_map_mods = lambda _: True\ndef apply_currency_and_read(*_): raise AssertionError('不应使用通货')\nresults = []\nfor count,corrupted in [(9,True),(7,False),(10,True)]:\n    item = {'category':'地图','rarity':'稀有','isCorrupted':corrupted,'detailedMods':[{'type':'prefix' if i%2 else 'suffix'} for i in range(count)]}\n    results.append(process_single_map(item,1,2))\nprint(json.dumps(results))`)
  assert.deepEqual(result, [{ qualified: true }, { failed: 'MAP_AFFIX_COUNT_INVALID' }, { failed: 'MAP_AFFIX_COUNT_INVALID' }])
})
