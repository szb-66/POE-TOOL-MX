import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createLocalizationDictionary } from '../electron/modules/localization/text.js'
import { LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { matchAffixes, matchMapRequirements } from '../electron/modules/item/matcher.js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { pythonPath } from './helpers/python.js'
import { generatePythonScript, generateMapRollingScript } from '../src/utils/pythonScriptGenerator.js'
import { CraftingDataRepository } from '../electron/modules/crafting/dataRepository.js'
import { getServer } from '../shared/serverMode.js'
import { searchMapAffixSuggestions } from '../src/utils/mapAffixSuggestions.js'

const source = name => readFileSync(new URL(`../src/assets/scripts/${name}`, import.meta.url), 'utf8')
const block = (text, start, end) => text.slice(text.indexOf(start), text.indexOf(end, text.indexOf(start)))
function python(code) {
  const result = spawnSync(pythonPath, ['-'], { input: code, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', PYTHONDONTWRITEBYTECODE: '1' } })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

const entry = (en, cn, tw = cn, extra = {}) => ({ table: 'baseitemtypes', id: en, field: 'Name', kind: 'dat', en, cn, tw, sourceHash: createHash('sha256').update(en).digest('hex'), ...extra })
const entries = [
  entry('Coral Ring', '珊瑚戒指'), entry('Fortress Map', '堡垒地图', '堡壘地圖'),
  entry('{0:+d} to maximum Life', '{0:+d} 最大生命', '{0:+d} 最大生命', { kind: 'stat' }),
  entry('Monsters reflect {0}% of Physical Damage', '怪物反射 {0}% 物理伤害', '怪物反射 {0}% 物理傷害', { kind: 'stat' }),
  entry('Chaos Orb', '混沌石'), entry('Deafening Essence of Greed', '破空精华之贪婪', '破空精髓之貪婪'),
  entry('Healthy', '健壮的', '健壯的', { table: 'mods' })
]
const english = 'Item Class: Rings\nRarity: Rare\nDoom Circle\nCoral Ring\n--------\nItem Level: 84\n--------\n{ Prefix Modifier "Healthy" (Tier: 1) }\n+89 to maximum Life'
const chinese = '物品类别: 戒指\n稀有度: 稀有\n末日指环\n珊瑚戒指\n--------\n物品等级: 84\n--------\n{ 前缀词缀 "健壮的" (等阶: 1) }\n+89 最大生命'

test('制作入口以当前活动词库统一英文、简体、繁体和混合物品', () => {
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'r1' })
  for (const text of [english, chinese, chinese.replace('珊瑚戒指', '珊瑚戒指[1c]'), chinese.replace('物品类别', '物品種類').replace('物品等级', '物品等級').replace('前缀词缀', '前綴詞綴').replace('等阶', '等階'), english.replace('+89 to maximum Life', '+89 最大生命')]) {
    const item = runtime.parseItem(text, 'r1')
    assert.equal(item.baseName, 'Coral Ring')
    assert.equal(item.level, 84)
    assert.equal(item.originalText, text)
    assert.equal(matchAffixes(item, [{ requiredAffixes: [{ kind: 'catalog', effectPattern: '+# to maximum Life', minTier: 1 }], selectedAffixes: [] }]).isMatch, true)
    assert.equal(matchAffixes(item, [{ requiredAffixes: ['最大生命'], selectedAffixes: [] }]).isMatch, true)
    assert.equal(matchAffixes(item, [{ requiredAffixes: ['Healthy'], selectedAffixes: [] }]).isMatch, true)
  }
})

test('汉化反伤地图不能漏过英文黑名单，中文自由关键词也保持有效', () => {
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'r1' })
  for (const trad of [false, true]) {
    let text = '物品类别: 异界地图\n稀有度: 稀有\n灾厄之域\n堡垒地图\n--------\n地图阶级: 17\n异界掉落: +140%\n更多丝线: +80%\n--------\n物品等级: 84\n--------\n{ 前缀词缀 "反射" (等阶: 1) }\n怪物反射 18% 物理伤害'
    if (trad) text = text.replaceAll('物品类别', '物品種類').replaceAll('异界地图', '異界地圖').replaceAll('堡垒地图', '堡壘地圖').replaceAll('地图阶级', '地圖階級').replaceAll('异界掉落', '異界掉落').replaceAll('更多丝线', '更多絲線').replaceAll('物品等级', '物品等級').replaceAll('物理伤害', '物理傷害')
    const item = runtime.parseItem(text, 'r1')
    assert.equal(item.atlasDrops, 140)
    assert.equal(item.moreThreads, 80)
    for (const term of ['Monsters reflect #% of Physical Damage', '物理伤害', '物理傷害']) assert.equal(matchMapRequirements(item, { match: { blacklist: [term] } }).reason, 'blacklist')
  }
})

test('只有有效当前词库可供运行，版本变化或未知词缀拒绝继续', () => {
  let revision = 'r1'
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => revision ? entries : [], revision: () => revision })
  assert.equal(runtime.snapshot().nameAliases['混沌石'], 'Chaos Orb')
  assert.ok(runtime.snapshot().essenceNames.includes('破空精髓之貪婪'))
  assert.throws(() => runtime.parseItem(chinese.replace('最大生命', '未知属性'), 'r1'), /未匹配/)
  revision = 'r2'
  assert.throws(() => runtime.parseItem(english, 'r1'), /汉化资源已更改/)
  revision = ''
  assert.throws(() => runtime.parseItem(chinese, ''), /未匹配/)
  assert.equal(runtime.parseItem(english, '').baseName, 'Coral Ring')
})

test('词典搜索别名保持数字参数并排除哈希错误和歧义身份', () => {
  const dictionary = createLocalizationDictionary(entries)
  assert.ok(dictionary.aliasesFor('+# to maximum Life').includes('# 最大生命'))
  assert.equal(dictionary.localize('+89 to maximum Life'), '+89 最大生命')
  assert.equal(dictionary.toEnglish('怪物反射 18% 物理傷害'), 'Monsters reflect 18% of Physical Damage')
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => [...entries, entry('Divine Orb', '混沌石'), entry('Bad Orb', '坏通货', '壞通貨', { sourceHash: '0'.repeat(64) })], revision: () => 'r1' })
  assert.equal(runtime.snapshot().nameAliases['混沌石'], undefined)
  assert.equal(runtime.snapshot().nameAliases['坏通货'], undefined)
})

test('可信汉化快照用于两类制作脚本的准确通货预检', () => {
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'r1' })
  const config = { serverId: 'international', localizationSnapshot: runtime.snapshot(), globalShortcuts: { end: 'F12' }, filePaths: {}, currencyPositions: {}, itemPosition: { x: 1, y: 2 }, actionPosition: { x: 3, y: 4 }, preset: { moduleTwo: {}, moduleThree: {}, moduleEldritch: {} }, mapConfig: { method: 'alchemy', match: {} }, inventory: {} }
  for (const [generate, template] of [[generatePythonScript, source('crafting_template.py')], [generateMapRollingScript, source('map_rolling_template.py')]]) {
    const script = generate(config, template)
    const assignment = script.match(/^currency_expected_names = (.+)$/m)[1].replace(/\s+#.*$/, '')
    const helpers = block(template, 'CURRENCY_NAMES =', 'def fail_currency_preflight(')
    const result = python(`import json\n${helpers}\ncurrency_expected_names = ${assignment}\nprint(json.dumps([currency_identity_matches('chaos', name) for name in ['Chaos Orb','混沌石','混沌石[0.4c]','神圣石','Fake Chaos Orb']]))`)
    assert.deepEqual(result, [true, true, true, false, false])
    assert.equal(python(`import json\ncompile(${JSON.stringify(script)}, 'generated.py', 'exec')\nprint('true')`), true)
  }
})

test('Python背包用可信简繁名称定位英文占位，原文黑名单与传奇判断保留', () => {
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'r1' })
  const file = fileURLToPath(new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url))
  const snapshot = JSON.stringify(runtime.snapshot())
  const result = python(`import importlib.util,json,sys\nsys.dont_write_bytecode=True\nspec=importlib.util.spec_from_file_location('bag',${JSON.stringify(file)})\nbag=importlib.util.module_from_spec(spec)\nspec.loader.exec_module(bag)\nbag.localization_snapshot=json.loads(${JSON.stringify(snapshot)})\ntext='物品種類: 戒指\\n稀有度: 傳奇\\n珊瑚戒指\\n珊瑚戒指\\n--------\\n物品等級: 84'\nitem=bag.parse_item_header(text)\nprint(json.dumps({'item':item,'blacklist':bool(bag.find_blacklist_match(item,[{'field':'baseName','keyword':'珊瑚戒指','matchMode':'exact'}])),'unknown':bag.parse_item_header(text.replace('珊瑚戒指','未知戒指'))}))`)
  assert.equal(result.item.baseName, 'Coral Ring')
  assert.equal(result.item.rarity, 'unique')
  assert.equal(result.item.itemLevel, 84)
  assert.equal(result.blacklist, true)
  assert.equal(result.unknown, null)
})

test('中文自由洗图条件的Python判断与统计使用别名且不重复计算词缀', () => {
  const helpers = block(source('map_rolling_template.py'), 'def map_term_matches(', 'def check_map_requirements(')
  const result = python(`import json\n${helpers}\nmap_config={'match':{'blacklist':['物理伤害'],'whitelist':[]}}\nitem={'explicitMods':['Monsters reflect 18% of Physical Damage'],'modTextAliases':{'Monsters reflect 18% of Physical Damage':['怪物反射 18% 物理伤害','怪物反射 18% 物理傷害']}}\nprint(json.dumps([check_map_mods(item),count_affix_stats(item)]))`)
  assert.deepEqual(result, [false, [{ '物理伤害': 1 }, {}]])
})

test('无汉化词库的英文魔法物品按已知底材识别，不受of后缀影响', () => {
  const runtime = new LocalizationRuntime({ serverId: 'international', baseNames: () => ['Royal Burgonet'] })
  const text = 'Item Class: Helmets\nRarity: Magic\nStout Royal Burgonet of the Rainbow\n--------\nItem Level: 84'
  assert.equal(runtime.parseItem(text, '').baseName, 'Royal Burgonet')
  const file = fileURLToPath(new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url))
  const result = python(`import importlib.util,json,sys\nsys.dont_write_bytecode=True\nspec=importlib.util.spec_from_file_location('bag',${JSON.stringify(file)})\nbag=importlib.util.module_from_spec(spec)\nspec.loader.exec_module(bag)\nbag.localization_snapshot={'serverId':'international','nameAliases':{},'structureAliases':{}}\ncatalog={'schemaVersion':1,'strictKnownItems':True,'items':{'*\\u001froyal burgonet':{'width':2,'height':2}},'categories':{}}\nitem=bag.parse_item_header(${JSON.stringify(text)})\nwrong=bag.parse_item_header(${JSON.stringify(text.replace('Burgonet', 'Burgonette'))})\nprint(json.dumps([bag.resolve_item_footprint(item,catalog),bag.resolve_catalog_base_type(item,catalog),bag.resolve_item_footprint(wrong,catalog)]))`)
  assert.deepEqual(result, [{ width: 2, height: 2 }, 'royal burgonet', null])
})

test('物品和地图联想支持中文搜索，保存的条件仍为英文规范模式', async () => {
  let currentEntries = entries
  let revision = 'r1'
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => currentEntries, revision: () => revision })
  const repository = new CraftingDataRepository({ server: getServer('international'), localizationRuntime: runtime })
  await repository.initialize()
  assert.equal(repository.searchBases({ query: '珊瑚戒指' }).items[0].name, 'Coral Ring')
  const suggestions = repository.searchAffixSuggestions({ query: '最大生命' })
  assert.ok(suggestions.items.length)
  assert.ok(suggestions.items.every(row => /maximum Life/.test(row.effectPattern)))
  assert.equal(repository.searchAffixSuggestions({ query: '最大生命' }).total, suggestions.total)
  currentEntries = entries.map(entry => ({ ...entry, cn: entry.cn?.replace('最大生命', '最大生命值更新'), tw: entry.tw?.replace('最大生命', '最大生命值更新') }))
  revision = 'r2'
  assert.ok(repository.searchAffixSuggestions({ query: '最大生命值更新' }).items.length)
  const canonical = 'Rare Monsters have Physical Thorns reflecting # Physical Damage'
  const catalog = new Map([[canonical, { displayText: '稀有怪物具有反射 # 物理伤害的荆棘', aliases: ['稀有怪物具有反射 # 物理傷害的荊棘'] }]])
  const maps = searchMapAffixSuggestions('atlas', '物理傷害', 50, 'en', catalog)
  assert.ok(maps.length)
  assert.equal(maps[0].value, canonical)
})

test('受管词库将中文来源标签识别为译名时，制作搜索仍保留原字段并追加可靠别名', async () => {
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => [...entries, entry('Essence', '精华', '精髓', { table: 'Tags' })], revision: () => 'source-labels-r1' })
  const repository = new CraftingDataRepository({ server: getServer('international'), localizationRuntime: runtime })
  await repository.initialize()
  repository.refreshLocalization()
  assert.deepEqual(runtime.dictionary.aliasesFor('精华'), [], '真实词典不会把中文译名当成英文规范文本返回')
  assert.match(repository.searchText('精华', 'Essence'), /精华/)
  assert.match(repository.searchText('精华', 'Essence'), /essence/)
  assert.match(repository.searchText('Coral Ring'), /珊瑚戒指/)
  const bySource = repository.searchAffixSuggestions({ query: '精华', limit: 100 })
  assert.ok(bySource.total > 0)
  assert.ok(bySource.items.every(item => item.sourceLabel.includes('精华')))
  const byAlias = repository.searchAffixSuggestions({ query: '最大生命', limit: 100 })
  assert.ok(byAlias.total > 0)
  assert.ok(byAlias.items.every(item => item.effectPattern.includes('maximum Life')))
})
