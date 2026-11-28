import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { createHash as _m0_createHash } from 'node:crypto'
import { createLocalizationDictionary as _m0_createLocalizationDictionary } from '../electron/modules/localization/text.js'
import { LocalizationRuntime as _m0_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { matchAffixes as _m0_matchAffixes, matchMapRequirements as _m0_matchMapRequirements } from '../electron/modules/item/matcher.js'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { fileURLToPath as _m0_fileURLToPath } from 'node:url'
import { spawnSync as _m0_spawnSync } from 'node:child_process'
import { pythonPath as _m0_pythonPath } from './helpers/python.js'
import { generatePythonScript as _m0_generatePythonScript, generateMapRollingScript as _m0_generateMapRollingScript } from '../src/utils/pythonScriptGenerator.js'
import { CraftingDataRepository as _m0_CraftingDataRepository } from '../electron/modules/crafting/dataRepository.js'
import { getServer as _m0_getServer } from '../shared/serverMode.js'
import { searchMapAffixSuggestions as _m0_searchMapAffixSuggestions } from '../src/utils/mapAffixSuggestions.js'
import { userRareMap as _m0_userRareMap } from './fixtures/priceCheckCategoryCorpus.js'
import { MAP_PRICE_CHECK_FIXTURES as _m0_MAP_PRICE_CHECK_FIXTURES } from './fixtures/mapChartItems.js'
import { test as _m1_test } from 'node:test'
import _m1_assert from 'node:assert/strict'
import _m1_fs from 'node:fs'
import _m1_path from 'node:path'
import { LocalizationHelperClient as _m1_LocalizationHelperClient } from '../electron/modules/localization/helperClient.js'

// === Merged from internationalLocalizationRuntime.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const createHash = _m0_createHash
  const createLocalizationDictionary = _m0_createLocalizationDictionary
  const LocalizationRuntime = _m0_LocalizationRuntime
  const matchAffixes = _m0_matchAffixes
  const matchMapRequirements = _m0_matchMapRequirements
  const readFileSync = _m0_readFileSync
  const fileURLToPath = _m0_fileURLToPath
  const spawnSync = _m0_spawnSync
  const pythonPath = _m0_pythonPath
  const generatePythonScript = _m0_generatePythonScript
  const generateMapRollingScript = _m0_generateMapRollingScript
  const CraftingDataRepository = _m0_CraftingDataRepository
  const getServer = _m0_getServer
  const searchMapAffixSuggestions = _m0_searchMapAffixSuggestions
  const userRareMap = _m0_userRareMap
  const MAP_PRICE_CHECK_FIXTURES = _m0_MAP_PRICE_CHECK_FIXTURES
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

test('国际服入库能读取带阶级的地图和带冒号的物品，现有黑名单仍按原文或规范名判定', () => {
  const runtime = new LocalizationRuntime({ serverId: 'international', revision: () => 'r1', entries: () => [
    entry('Contract: Prohibited Library', '契约：禁断书库', '契約書：禁忌館藏'),
    entry('Expedition Logbook', '先祖秘藏日志', '探險日誌'),
    entry('Expedition Logbooks', '先祖秘藏日志', '探險日誌', { table: 'itemclasses' }),
    entry('Censer Relic', '香炉圣物', '香爐聖物'),
    entry('[DO NOT USE] Censer Relic', '香炉圣物', '香爐聖物'),
    entry('Chaos Orb', '混沌石')
  ] })
  const file = fileURLToPath(new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url))
  const cases = [
    { text: userRareMap },
    { text: MAP_PRICE_CHECK_FIXTURES[0].text },
    { text: '物品種類: 地圖 (Uber)\n稀有度: 普通\n地圖（17階）\n--------\n物品等級: 84' },
    { text: '物品类别: 地图\n稀有度: 魔法\n菌潮 地图（13阶）\n--------' },
    { text: 'Item Class: Contracts\nRarity: Normal\nContract: Prohibited Library\n--------' },
    { text: '物品種類: 契約書\n稀有度: 普通\n契約書：禁忌館藏\n--------' },
    { text: '物品種類: 探險日誌\n稀有度: 普通\n探險日誌\n--------' },
    { text: '物品種類: 聖物\n稀有度: 普通\n香爐聖物\n--------' },
    { text: '物品类别: 可堆叠通货\n稀有度: 通货\n混沌石\n--------' },
    { text: userRareMap, rule: { field: 'baseName', keyword: '地图（15阶）', matchMode: 'exact' } },
    { text: userRareMap, rule: { field: 'category', keyword: 'Maps', matchMode: 'exact' } },
    { text: '物品类别: 地图碎片\n稀有度: 普通\n地图（15阶）\n--------' },
    { text: '物品类别: 戒指\n稀有度: 普通\n未知戒指\n--------' },
    { text: 'Item Class: Rings\nRarity: Rare\nItem Level: 84\n--------' },
    { text: 'Item Class: Rings\nRarity: Rare\n[1c]\n--------' }
  ]
  const input = JSON.stringify({ snapshot: runtime.snapshot(), cases })
  const result = python(`
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(file)})
bag = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bag)
bag.is_game_foreground = lambda: True
bag.time.sleep = lambda _: None
class Controller:
    def __init__(self, config): self.copied = False
    def move(self, x, y): return True
    def copy_item_text(self):
        if self.copied: return "empty", ""
        self.copied = True
        return "copied", case["text"]
    def ctrl_click(self): return True
    def release_all(self): pass
bag.InputController = Controller
data = json.loads(${JSON.stringify(input)})
results = []
for case in data["cases"]:
    events = {}
    bag.emit = lambda name, **payload: events.update({name: payload})
    bag.run_stash({"localizationSnapshot": data["snapshot"], "blacklist": [case["rule"]] if "rule" in case else []})
    item = events.get("stash-item-transferred", {}).get("item", {})
    stats = events["stash-completed"]
    results.append([item.get("baseName") or item.get("name"), stats["stashedSlots"], stats["blacklistedSlots"], stats["unreadableSlots"]])
print(json.dumps(results))
`)
  assert.deepEqual(result, [
    ['Map (Tier 15)', 1, 0, 0], ['Map (Tier 16)', 1, 0, 0], ['Map (Tier 17)', 1, 0, 0],
    ['Blighted Map (Tier 13)', 1, 0, 0],
    ['Contract: Prohibited Library', 1, 0, 0], ['Contract: Prohibited Library', 1, 0, 0],
    ['Expedition Logbook', 1, 0, 0], ['Censer Relic', 1, 0, 0], ['Chaos Orb', 1, 0, 0],
    [null, 0, 1, 0], [null, 0, 1, 0], [null, 0, 0, 1], [null, 0, 0, 1], [null, 0, 0, 1], [null, 0, 0, 1]
  ])
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

test('物品和地图联想支持中文搜索，保存并匹配用户看到的文本', async () => {
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
  assert.equal(maps[0].value, '稀有怪物具有反射 # 物理伤害的荆棘')
  assert.equal(maps[0].canonicalValue, canonical)
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
  assert.ok(bySource.items.some(item => item.sourceLabel.includes('精华')))
  assert.ok(bySource.items.every(item => item.sourceLabel.includes('精华') || item.displayName.includes('精华')))
  const byAlias = repository.searchAffixSuggestions({ query: '最大生命', limit: 100 })
  assert.ok(byAlias.total > 0)
  assert.ok(byAlias.items.every(item => item.effectPattern.includes('maximum Life')))
})
})()

// === Merged from localizationNative.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const fs = _m1_fs
  const path = _m1_path
  const LocalizationHelperClient = _m1_LocalizationHelperClient
const executable = path.resolve('.runtime/localization-helper/LocalizationHelper.exe')
test('built native helper verifies codec frames, DAT safety, automatic backups, external-change protection and repeated-apply language recovery', { skip: !fs.existsSync(executable) }, async () => {
  const helper = new LocalizationHelperClient({ executable, timeoutMs: 60000 })
  const result = await helper.run('self-test', {})
  assert.equal(result.passed, true)
  assert.equal(result.codecCases, 6)
  assert.ok(result.dataCases >= 21)
  assert.equal(result.transaction.passed, true)
  assert.ok(result.transaction.cases >= 19)
  assert.equal(result.transaction.installationCases, 5)
  assert.equal(result.transaction.recoveryCases, 3)
})
})()
