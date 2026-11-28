import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { spawnSync as _m0_spawnSync } from 'node:child_process'
import { parseItemInfo as _m0_parseItemInfo } from '../electron/modules/item/parser.js'
import { matchMapRequirements as _m0_matchMapRequirements } from '../electron/modules/item/matcher.js'
import { rareInvitation as _m0_rareInvitation, normalInvitation as _m0_normalInvitation } from './fixtures/breachstoneInvitations.js'
import { pythonPath as _m0_pythonPath } from './helpers/python.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { existsSync as _m1_existsSync, readFileSync as _m1_readFileSync } from 'node:fs'
import _m1_path from 'node:path'
import { spawnSync as _m1_spawnSync } from 'node:child_process'
import { fileURLToPath as _m1_fileURLToPath } from 'node:url'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { readFileSync as _m2_readFileSync } from 'node:fs'
import { spawnSync as _m2_spawnSync } from 'node:child_process'
import { createPinia as _m2_createPinia, setActivePinia as _m2_setActivePinia } from 'pinia'
import { parseItemInfo as _m2_parseItemInfo } from '../electron/modules/item/parser.js'
import { matchMapRequirements as _m2_matchMapRequirements } from '../electron/modules/item/matcher.js'
import { createDefaultHeistConfig as _m2_createDefaultHeistConfig, cleanMigratedHeistConfig as _m2_cleanMigratedHeistConfig, getActiveMapRollingConfig as _m2_getActiveMapRollingConfig, HEIST_BASE_STATS as _m2_HEIST_BASE_STATS } from '../src/utils/mapPresetMigration.js'
import { validateMapRecovery as _m2_validateMapRecovery } from '../src/utils/craftingRecovery.js'
import { usePresetStore as _m2_usePresetStore } from '../src/stores/preset.js'
import { pythonPath as _m2_pythonPath } from './helpers/python.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { readFileSync as _m3_readFileSync } from 'node:fs'
import { spawnSync as _m3_spawnSync } from 'node:child_process'
import { generateMapRollingScript as _m3_generateMapRollingScript } from '../src/utils/pythonScriptGenerator.js'
import { LocalizationRuntime as _m3_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { pythonPath as _m3_pythonPath } from './helpers/python.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { readFileSync as _m4_readFileSync } from 'node:fs'
import { spawnSync as _m4_spawnSync } from 'node:child_process'
import { createLocalizationDictionary as _m4_createLocalizationDictionary } from '../electron/modules/localization/text.js'
import { statVariantApplies as _m4_statVariantApplies } from '../electron/modules/localization/statVariants.js'
import { LocalizationRuntime as _m4_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { matchMapRequirements as _m4_matchMapRequirements } from '../electron/modules/item/matcher.js'
import { mapStatVariants as _m4_mapStatVariants } from './fixtures/internationalMapStatVariants.js'
import { pythonPath as _m4_pythonPath } from './helpers/python.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { readFileSync as _m5_readFileSync } from 'node:fs'
import { spawnSync as _m5_spawnSync } from 'node:child_process'
import { pythonPath as _m5_pythonPath } from './helpers/python.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { readFileSync as _m6_readFileSync } from 'node:fs'
import { spawnSync as _m6_spawnSync } from 'node:child_process'
import { pythonPath as _m6_pythonPath } from './helpers/python.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { readFileSync as _m7_readFileSync } from 'node:fs'
import { spawnSync as _m7_spawnSync } from 'node:child_process'
import { pythonPath as _m7_pythonPath } from './helpers/python.js'

// === Merged from breachstoneRolling.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const spawnSync = _m0_spawnSync
  const parseItemInfo = _m0_parseItemInfo
  const matchMapRequirements = _m0_matchMapRequirements
  const rareInvitation = _m0_rareInvitation
  const normalInvitation = _m0_normalInvitation
  const pythonPath = _m0_pythonPath
const rare = parseItemInfo(rareInvitation)
const normal = parseItemInfo(normalInvitation)
const template = readFileSync(new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url), 'utf8')
const block = (start, end) => template.slice(template.indexOf(start), template.indexOf(end, template.indexOf(start)))
const helpers = block('def rolling_target_label():', 'def fail_map_runtime(')
const runtime = block('def _explicit_affix_count(', 'if __name__ == "__main__":')
const config = { targetKind: 'atlas', method: 'alchemy', match: {}, autoStash: false, vaal: { enabled: false } }
function python(source) {
  const result = spawnSync(pythonPath, ['-'], {
    input: `import json\n${helpers}\n${runtime}\n${source}`,
    encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}
const literal = value => `json.loads(${JSON.stringify(JSON.stringify(value))})`

test('邀请样本解析等级、数量、名称及三前两后；排除说明和背景描述', () => {
  assert.equal(rare.name, '众星 鼓动')
  assert.equal(rare.baseName, '蠕动的邀请')
  assert.equal(normal.name, '咆哮的邀请')
  assert.ok(!normal.baseName.includes('-'))
  assert.equal(rare.level, 83)
  assert.equal(normal.level, 83)
  assert.equal(rare.itemQuantity, 68)
  assert.equal(rare.itemRarity, 41)
  assert.deepEqual(rare.detailedMods.map(mod => mod.type), ['prefix', 'prefix', 'prefix', 'suffix', 'suffix'])
  assert.deepEqual(rare.detailedMods[2].lines, ['+25% 怪物的混沌抗性', '+40% 怪物的元素抗性'])
  assert.equal(rare.explicitMods.length, 6)
  assert.deepEqual(normal.explicitMods, [])
})

test('类别、黑白名单及缺失属性在两端一致，邀请等级不显示T0', () => {
  const cases = [
    [rare, config, true], [normal, config, true],
    [{ ...rare, category: '任务物品' }, config, false],
    [{ ...rare, isQuestItem: true }, config, false],
    [rare, { ...config, targetKind: 'chart' }, false],
    [rare, { ...config, targetKind: 'heist' }, false],
    [rare, { ...config, match: { blacklist: ['脆弱'], whitelist: ['脆弱'] } }, false],
    [rare, { ...config, match: { blacklist: ['无限饥饿'], whitelist: ['脆弱'] } }, true],
    [rare, { ...config, match: { mandatoryStats: { quantity: { enabled: true, value: 68 }, rarity: { enabled: true, value: 41 } } } }, true],
    [rare, { ...config, match: { mandatoryStats: { packSize: { enabled: true, value: 1 } } } }, false]
  ]
  for (const [item, settings, expected] of cases) assert.equal(matchMapRequirements(item, settings).isMatch, expected)
  const result = python(`
cases = ${literal(cases)}
results = []
for item, map_config, expected in cases:
    results.append(item_matches_rolling_target(item) and check_map_requirements(item))
map_config = ${literal(config)}
print(json.dumps({"matches": results, "level": rolling_item_level_label(${literal(rare)})}))
`)
  assert.deepEqual(result.matches, cases.map(row => row[2]))
  assert.equal(result.level, '物品等级 83')
})

test('邀请复用点金、混沌、崇高及瓦尔流程；不可修改和传奇不消耗通货', () => {
  const result = python(`
import copy
normal = ${literal(normal)}
rare = ${literal(rare)}
is_running = True
fatal_error_reason = ""
def stash_item(x, y): events.append("stash")
def apply_currency_and_read(currency, x, y):
    global state
    events.append(currency)
    if currency in ("alchemy", "chaos"):
        state = copy.deepcopy(rare)
        state["itemQuantity"] = 100
    elif currency == "exalted":
        state["detailedMods"].append({"type": "suffix"})
    elif currency == "vaal":
        state["isCorrupted"] = True
    else:
        raise AssertionError(currency)
    return copy.deepcopy(state)
def run(item, method="alchemy", finish=False):
    global state, map_config, events
    events = []
    state = copy.deepcopy(item)
    map_config = ${literal(config)}
    map_config.update({"method": method, "exalted": {"enabled": finish}, "vaal": {"enabled": finish}})
    if method == "chaos":
        map_config["match"] = {"mandatoryStats": {"quantity": {"enabled": True, "value": 100}}}
    outcome = process_single_map(copy.deepcopy(state), 10, 20)
    return {"events": events, "outcome": outcome}
print(json.dumps({
    "normal": run(normal), "chaos": run(rare, "chaos"),
    "finish": run(rare, finish=True),
    "locked": run({**rare, "isUnmodifiable": True}),
    "unique": run({**rare, "rarity": "传奇"}),
    "quest": run({**normal, "category": "任务物品"})
}))
`)
  assert.deepEqual(result.normal.events, ['alchemy'])
  assert.deepEqual(result.chaos.events, ['chaos'])
  assert.deepEqual(result.finish.events, ['exalted', 'vaal'])
  for (const key of ['normal', 'chaos', 'finish']) assert.equal(result[key].outcome.qualified, true)
  for (const key of ['locked', 'unique', 'quest']) assert.deepEqual(result[key].events, [])
})
})()

// === Merged from chartModsProbe.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const existsSync = _m1_existsSync
  const readFileSync = _m1_readFileSync
  const path = _m1_path
  const spawnSync = _m1_spawnSync
  const fileURLToPath = _m1_fileURLToPath
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('chart_mods_probe.py 纯逻辑静态检查', { timeout: 120000 }, (t) => {
  const pythonPath = path.join(projectRoot, '.runtime', 'python-runtime', 'python.exe')
  if (!existsSync(pythonPath)) return t.skip('尚未准备内置 Python 运行时')
  const check = spawnSync(pythonPath, [
    path.join(projectRoot, 'test', 'python', 'chart_mods_probe_checks.py'),
    path.join(projectRoot, 'src', 'assets', 'scripts', 'chart_mods_probe.py'),
    path.join(projectRoot, 'test', 'fixtures', 'puzzle', 'border-mod-hover-150.png'),
    path.join(projectRoot, 'test', 'fixtures', 'puzzle', 'border-mod-e0-sea-beast-150.png'),
    path.join(projectRoot, 'test', 'fixtures', 'puzzle', 'border-mod-e2-pack-size-150.png'),
    path.join(projectRoot, 'test', 'fixtures', 'puzzle', 'border-mod-w0-mod-value-150.png')
  ], {
    encoding: 'utf8', timeout: 110000,
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(check.status, 0, `${check.stdout}\n${check.stderr}`)
  const report = JSON.parse(check.stdout.trim().split(/\r?\n/).at(-1))
  assert.equal(report.ok, true)
})

test('chart_mods_probe.py 语法可解析且模式齐全', () => {
  const source = readFileSync(path.join(projectRoot, 'src/assets/scripts/chart_mods_probe.py'), 'utf8')
  assert.match(source, /def copy_fragment_texts/)
  assert.match(source, /def scan_border_texts/)
  assert.match(source, /mode == "copy"/)
  assert.match(source, /mode == "border"/)
  assert.match(source, /is_game_foreground/)
  assert.doesNotMatch(source, /focus_game_window/)
  assert.match(source, /def target_text_roi/)
  assert.match(source, /TEXT_GLYPH_HEIGHT_LOGICAL/)
  assert.match(source, /glyph_h = max/)
  assert.match(source, /def ordered_texts/)
  assert.match(source, /def border_edge_texts/)
  assert.doesNotMatch(source, /frame_signature|advance_hover_stability|sample_target_frames/)
  assert.match(source, /RESULT /)
})
})()

// === Merged from heistRolling.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const readFileSync = _m2_readFileSync
  const spawnSync = _m2_spawnSync
  const createPinia = _m2_createPinia
  const setActivePinia = _m2_setActivePinia
  const parseItemInfo = _m2_parseItemInfo
  const matchMapRequirements = _m2_matchMapRequirements
  const createDefaultHeistConfig = _m2_createDefaultHeistConfig
  const cleanMigratedHeistConfig = _m2_cleanMigratedHeistConfig
  const getActiveMapRollingConfig = _m2_getActiveMapRollingConfig
  const HEIST_BASE_STATS = _m2_HEIST_BASE_STATS
  const validateMapRecovery = _m2_validateMapRecovery
  const usePresetStore = _m2_usePresetStore
  const pythonPath = _m2_pythonPath
// Synthetic clipboard fixtures; live client text should be checked separately.
const clipboard = (category = '契约', extra = '', stats = true) => `物品类别: ${category}
稀 有 度: 稀有
危险的目标
${category}：堡垒
--------
区域等级: 83
赏金目标：宝物
发现的侧厅: 1/3
需要 工程学 (等级 3)
${stats ? '物品数量: +40%\n物品稀有度: +20%\n警戒值降低: +12%\n封锁前时间: +15%\n最大存活援军数量: -5%' : ''}
--------
物品等级: 83
--------
怪物造成额外火焰伤害
${extra}`
const config = () => ({ ...createDefaultHeistConfig(), targetKind: 'heist' })
const enable = (c, key, value, group = 'mandatoryStats') => { c.match[group][key] = { enabled: true, value }; return c }

test('契约蓝图解析五项百分比，固定信息不进入词缀', () => {
  for (const category of ['契约', '蓝图']) {
    const item = parseItemInfo(clipboard(category))
    assert.equal(item.category, category)
    assert.equal(item.areaLevel, 83)
    assert.deepEqual(item.heistStats, { quantity: 40, rarity: 20, alertLevelReduction: 12, timeBeforeLockdown: 15, maximumAliveReinforcements: -5 })
    assert.equal(item.isQuestItem, false)
    assert.ok(item.explicitMods.includes('怪物造成额外火焰伤害'))
    assert.ok(item.explicitMods.every(mod => !/发现的|需要|赏金目标|封锁|警戒/.test(mod)))
  }
})

test('任务契约、未鉴定、不可改变及异常数值', () => {
  assert.equal(parseItemInfo(clipboard('契约', '客户: 奈尼特')).isQuestItem, true)
  assert.equal(parseItemInfo(clipboard().replace('稀 有 度: 稀有', '稀 有 度: 任务')).isQuestItem, true)
  assert.equal(parseItemInfo(clipboard('蓝图', '未鉴定')).isUnidentified, true)
  assert.equal(parseItemInfo(clipboard('蓝图', '不可改变')).isUnmodifiable, true)
  assert.equal(parseItemInfo(clipboard().replace('+12%', '+0%')).heistStats.alertLevelReduction, 0)
  assert.equal(parseItemInfo(clipboard().replace('+12%', '未知')).heistStats.alertLevelReduction, null)
  assert.equal(parseItemInfo(clipboard('蓝图', '', false)).heistStats.quantity, null)
})

test('五项固定大于等于，相等通过，未知指标拒绝', () => {
  const item = parseItemInfo(clipboard())
  for (const [key, value] of Object.entries(item.heistStats)) {
    const c = enable(config(), key, value)
    assert.equal(matchMapRequirements(item, c).isMatch, true, key)
    c.match.mandatoryStats[key].value += 1
    assert.equal(matchMapRequirements(item, c).isMatch, false, key)
    item.heistStats[key] = null
    assert.equal(matchMapRequirements(item, enable(config(), key, 0)).reason, 'unreadable-stat')
    item.heistStats[key] = value
  }
})

test('契约蓝图必选挑选和黑白名单保持独立语义', () => {
  const item = parseItemInfo(clipboard())
  const c = enable(enable(config(), 'quantity', 40), 'rarity', 20, 'optionalStats')
  assert.equal(matchMapRequirements(item, c).isMatch, true)
  c.match.selectedCount = 2
  assert.equal(matchMapRequirements(item, c).isMatch, false)
  c.match.selectedCount = 1
  c.match.whitelist = ['冰霜']
  assert.equal(matchMapRequirements(item, c).reason, 'whitelist')
  c.match.whitelist = ['火焰']
  assert.equal(matchMapRequirements(item, c).isMatch, true)
  c.match.blacklist = ['火焰']
  assert.equal(matchMapRequirements(item, c).reason, 'blacklist')
  const legacy = { targetKind: 'atlas', match: { whitelist: ['冰霜'] } }
  assert.equal(matchMapRequirements({ ...item, category: '地图' }, legacy).isMatch, true)
})

test('独立预设默认值、规范化和恢复隔离', () => {
  const c = config()
  assert.equal(Object.keys(c.match.mandatoryStats).length, 5)
  assert.ok(Object.values(c.match.mandatoryStats).every(s => !s.enabled && s.value === 0))
  const migrated = cleanMigratedHeistConfig({ ...c, vaal: { enabled: true }, exalted: { enabled: true } })
  assert.equal(migrated.vaal.enabled, false)
  assert.equal(migrated.exalted.enabled, false)
  assert.equal(getActiveMapRollingConfig(c).targetKind, 'heist')
  const checkpoint = { targetKind: 'heist', col: 0, row: 1, processedCount: 1, qualifiedCount: 1 }
  assert.equal(validateMapRecovery(checkpoint, { targetKind: 'heist', rows: 5, cols: 12 }).valid, true)
  assert.equal(validateMapRecovery(checkpoint, { targetKind: 'atlas', rows: 5, cols: 12 }).valid, false)
})

test('预设增删改及重启持久化不会修改地图海图', () => {
  const data = new Map()
  const previous = globalThis.localStorage
  globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)) }
  try {
    setActivePinia(createPinia())
    let store = usePresetStore()
    const maps = JSON.stringify([store.mapPresets, store.chartPresets])
    const preset = store.addHeistPreset('测试契约')
    store.setMapRollingKind('heist')
    store.currentHeistPreset.heist.match.mandatoryStats.quantity = { enabled: true, value: 50 }
    store.updateCurrentHeistPreset({ name: '重命名' })
    setActivePinia(createPinia())
    store = usePresetStore()
    assert.equal(store.mapRollingKind, 'heist')
    assert.equal(store.currentHeistPreset.name, '重命名')
    assert.equal(store.currentHeistPreset.heist.match.mandatoryStats.quantity.value, 50)
    assert.equal(JSON.stringify([store.mapPresets, store.chartPresets]), maps)
    assert.equal(store.deleteHeistPreset(preset.id), true)
    assert.equal(store.currentHeistPresetId, 'default')
    assert.equal(store.deleteHeistPreset('default'), false)
  } finally { globalThis.localStorage = previous }
})

const template = readFileSync(new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url), 'utf8')
const block = (start, end) => template.slice(template.indexOf(start), template.indexOf(end))
const source = [
  block('def rolling_target_label():', 'def fail_map_runtime('),
  block('def fill_rare_map_affixes(', 'def read_and_parse('),
  block('def check_map_base(', 'if __name__ == "__main__":')
].join('\n')
function runScenario(c, items, stop = false) {
  const script = `import json\n${source}\nmap_config = json.loads(${JSON.stringify(JSON.stringify(c))})\nitems = json.loads(${JSON.stringify(JSON.stringify(items))})\nis_running = ${stop ? 'False' : 'True'}\nfatal_error_reason = ''\nevents = []\ndef apply_currency_and_read(currency, x, y):\n    events.append(currency)\n    return items.pop(0) if items else {"error": "读取失败"}\ndef stash_item(x, y):\n    events.append('stash')\noutcome = process_single_map(items.pop(0), 10, 20)\nprint(json.dumps({"outcome": outcome, "events": events}, ensure_ascii=False))\n`
  const result = spawnSync(pythonPath, ['-'], { input: script, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

test('运行时点金／混沌重洗、鉴定、合格存仓和异常停止', () => {
  const good = parseItemInfo(clipboard())
  const bad = { ...good, heistStats: { ...good.heistStats, quantity: 1 } }
  const normal = { ...good, rarity: '普通', heistStats: {} }
  for (const method of ['alchemy', 'chaos']) {
    const c = { ...enable(config(), 'quantity', 40), method, autoStash: true }
    const result = runScenario(c, method === 'alchemy' ? [bad, normal, good] : [bad, good])
    assert.deepEqual(result.events, method === 'alchemy' ? ['scouring', 'alchemy', 'stash'] : ['chaos', 'stash'])
    assert.equal(result.outcome.qualified, true)
    const unreadable = runScenario(c, [{ ...good, heistStats: {} }])
    assert.equal(unreadable.outcome.code, 'HEIST_STATS_UNREADABLE')
    assert.deepEqual(unreadable.events, [])
    const failed = runScenario(c, [bad, { error: '读取失败' }])
    assert.equal(failed.outcome.status, 'failed')
    assert.equal(failed.events.length, 1)
  }
  const identified = runScenario(config(), [{ ...good, isUnidentified: true }, good])
  assert.deepEqual(identified.events, ['wisdom'])
  assert.equal(identified.outcome.qualified, true)
  for (const item of [{ ...good, isQuestItem: true }, { ...good, isLegendary: true }, { ...good, isUnmodifiable: true }]) {
    assert.deepEqual(runScenario(config(), [item]).events, [])
  }
  assert.deepEqual(runScenario(config(), [good], true).events, [])
  const wrongTarget = runScenario({ ...config(), method: 'chaos' }, [normal, { ...good, category: '地图' }])
  assert.equal(wrongTarget.outcome.code, 'MAP_TARGET_MISMATCH')
  assert.deepEqual(wrongTarget.events, ['alchemy'])
  assert.equal(runScenario(config(), [{ ...good, category: '蓝图' }]).outcome.qualified, true)
})

test('初始扫描跳过非目标，通货后读到非目标则停止', () => {
  const reader = block('def read_current_rolling_target(', 'def update_map_recovery_checkpoint(')
  const script = `import json\n${block('def rolling_target_label():', 'def completed_map_result(')}\n${reader}\nmap_config = {"targetKind": "heist"}\nis_running = True\ndef read_and_parse(*args, **kwargs): return "request"\ndef wait_for_parse_result(request): return {"category": "地图"}\ninitial = read_current_rolling_target(0, 0, attempts=1, empty_on_copy_failure=True)\nafter = read_current_rolling_target(0, 0, attempts=1)\nprint(json.dumps({"initial": initial, "after": after}))`
  const result = spawnSync(pythonPath, ['-c', script], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  const outcome = JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
  assert.equal(outcome.initial.skip, true)
  assert.ok(outcome.after.error)
})

test('契约蓝图 JavaScript 与 Python 条件结果一致', () => {
  const item = parseItemInfo(clipboard())
  const cases = [config(), enable(config(), 'quantity', 40), enable(config(), 'quantity', 41), enable(config(), 'timeBeforeLockdown', 15, 'optionalStats')]
  const white = config(); white.match.whitelist = ['冰霜']; cases.push(white)
  const conflict = enable(enable(config(), 'quantity', 30), 'quantity', 41, 'optionalStats'); cases.push(conflict)
  for (const c of cases) {
    const script = `import json\n${block('def check_map_base(', 'if __name__ == "__main__":')}\nmap_config = json.loads(${JSON.stringify(JSON.stringify(c))})\nitem = json.loads(${JSON.stringify(JSON.stringify(item))})\nprint(json.dumps(check_map_requirements(item)))`
    const result = spawnSync(pythonPath, ['-c', script], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
    assert.equal(result.status, 0, result.stderr)
    assert.equal(JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1)), matchMapRequirements(item, c).isMatch)
  }
})

test('混合背包从恢复格继续，跳过其他类别且只统计契约蓝图', () => {
  const script = `import json, types
${block('def rolling_item_level_label(', 'def completed_map_result(')}
${block('def start_map_rolling():', 'def process_single_map(')}
events = []
grid_config = {"rows": 5, "cols": 1, "emptySlotThreshold": 1}
map_config = {"targetKind": "heist"}
recovery_config = {"targetKind": "heist", "col": 0, "row": 1, "processedCount": 2, "qualifiedCount": 1}
fatal_error_reason = None
GetClipboardSequenceNumber = None
keyboard = types.SimpleNamespace(GlobalHotKeys=lambda _: types.SimpleNamespace(start=lambda: None))
time = types.SimpleNamespace(sleep=lambda _: None)
def is_game_foreground(): return True
def select_currency_stash_tab(_): return True
def preflight_required_currencies(): return True
def move_mouse(x, y): events.append(["move", x, y]); return True
def get_slot_position(col, row): return col, row
items = [{"skip": True, "category": "地图"}, {"category": "契约", "areaLevel": 83}, {"category": "蓝图", "areaLevel": 83}, {"empty": True}]
def read_current_rolling_target(*args, **kwargs): return items.pop(0)
def process_single_map(item, x, y): events.append(["process", item["category"]]); return {"qualified": True}
def count_affix_stats(item): return {}, {}
def update_map_stats(*args): events.append(["stats", *args])
def update_map_recovery_checkpoint(*args): events.append(["checkpoint", *args])
def release_all_keys(): pass
def play_success_sound(): pass
start_map_rolling()
print(json.dumps(events, ensure_ascii=False))`
  const result = spawnSync(pythonPath, ['-c', script], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  const events = JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
  assert.deepEqual(events.filter(e => e[0] === 'process'), [['process', '契约'], ['process', '蓝图']])
  assert.deepEqual(events.find(e => e[0] === 'move'), ['move', 0, 1])
  assert.deepEqual(events.filter(e => e[0] === 'stats').at(-1).slice(1, 3), [4, 3])
})

test('国服实物蓝图：52/31/20/20/20，四条词缀与固定说明隔离', () => {
  const text = readFileSync(new URL('./fixtures/heistBlueprintCn.txt', import.meta.url), 'utf8')
  for (const input of [text, text.replace(/^## /gm, '').replace(/^-{3,}$/gm, '--------')]) {
    const item = parseItemInfo(input)
    assert.equal(item.name, '暮色 经书')
    assert.equal(item.baseName, '蓝图：珍宝之地')
    assert.equal(item.areaLevel, 83)
    assert.equal(item.level, 85)
    assert.equal(item.isQuestItem, false)
    assert.deepEqual(item.heistStats, { quantity: 52, rarity: 31, alertLevelReduction: 20, timeBeforeLockdown: 20, maximumAliveReinforcements: 20 })
    assert.deepEqual(item.explicitMods, ['稀有怪物的数量增加22%', '怪物的技能附加 2 次连锁弹射', '怪物生命总增 40%', '区域内有腐化地面'])
    const c = config()
    for (const [key, value] of Object.entries(item.heistStats)) enable(c, key, value)
    assert.equal(matchMapRequirements(item, c).isMatch, true)
    assert.equal(runScenario(c, [item]).outcome.qualified, true)
    c.match.blacklist = ['连锁弹射']
    assert.equal(matchMapRequirements(item, c).reason, 'blacklist')
  }
  const metadataOnly = parseItemInfo(text.replace(/\{ 前缀属性[\s\S]*?--------/, '--------'))
  assert.deepEqual(metadataOnly.explicitMods, [])
})
})()

// === Merged from internationalMapCategoriesRuntime.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const readFileSync = _m3_readFileSync
  const spawnSync = _m3_spawnSync
  const generateMapRollingScript = _m3_generateMapRollingScript
  const LocalizationRuntime = _m3_LocalizationRuntime
  const pythonPath = _m3_pythonPath
const template=readFileSync(new URL('../src/assets/scripts/map_rolling_template.py',import.meta.url),'utf8')
const snapshot=()=>new LocalizationRuntime({serverId:'international'}).snapshot()
const categories=['Maps (Low)','Maps (Mid)','Maps (Top)','Maps (Uber)']
const item=(category,extra={})=>({category,mapTier:17,quality:20,rarity:'普通',good:false,explicitMods:[],...extra})

// Only compile production functions and data. Every input boundary is replaced
// in memory, so the generated module never creates an OS controller.
function replay(method,cases,localizationSnapshot=snapshot()) {
  const script=generateMapRollingScript({serverId:'international',localizationSnapshot,globalShortcuts:{end:'F12'},currencyPositions:{wisdom:{x:1,y:1},scouring:{x:2,y:2},alchemy:{x:3,y:3},chaos:{x:4,y:4}},filePaths:{},mapConfig:{targetKind:'atlas',method,autoStash:true,vaal:{enabled:false},exalted:{enabled:false},match:{mandatoryStats:{},optionalStats:{}}}},template)
  const code=`import ast,json,types
tree=ast.parse(${JSON.stringify(script)})
ns={'json':json}
for node in tree.body:
    if isinstance(node,ast.Assign) and any(isinstance(target,ast.Name) and target.id in ('localization_snapshot','map_config','currency_expected_names','CURRENCY_NAMES','currency_positions','required_currency_types') for target in node.targets):
        exec(compile(ast.Module(body=[node],type_ignores=[]),'generated.py','exec'),ns)
    if isinstance(node,ast.FunctionDef) and node.name in ('rolling_target_label','item_matches_rolling_target','rolling_item_level_label','completed_map_result','failed_map_result','_explicit_affix_count','fill_rare_map_affixes','process_single_map','read_current_rolling_target','copied_item_header','detected_item_name','normalized_copied_item_name','currency_identity_matches','currency_expected_label','preflight_required_currencies'):
        exec(compile(ast.Module(body=[node],type_ignores=[]),'generated.py','exec'),ns)
results=[]
for case in json.loads(${JSON.stringify(JSON.stringify(cases))}):
    events=[]
    state=dict(case['item'])
    def apply(currency,x,y):
        events.append(currency)
        if case.get('readError'): return {'error':'unconfirmed'}
        if currency=='wisdom': state['isUnidentified']=False
        elif currency=='scouring': state.update(rarity='普通',good=False)
        else: state.update(rarity='稀有',good=True)
        return dict(state)
    ns.update(is_running=True,fatal_error_reason='',apply_currency_and_read=apply,stash_item=lambda x,y:events.append('stash'),check_map_base=lambda value:value.get('good',False),check_map_mods=lambda value:value.get('good',False))
    outcome=ns['process_single_map'](dict(state),10,20)
    ns.update(read_and_parse=lambda *args,**kwargs:'request',wait_for_parse_result=lambda request:dict(state))
    batch=ns['read_current_rolling_target'](10,20,attempts=1)
    header=ns['copied_item_header']('物品種類: '+str(state['category'])+'\\n稀有度: 稀有\\nKnown Map\\n--------')
    results.append({'outcome':outcome,'events':events,'batchAccepted':not bool(batch.get('error')),'copiedName':ns['detected_item_name'](header)})
clipboard={'sequence':1,'currency':None,'failure':None}
def move(x,y):
    clipboard['currency']=next(currency for currency,position in ns['currency_positions'].items() if position=={'x':x,'y':y})
    return True
def copy(*args,**kwargs):
    clipboard['sequence']+=1
    name=ns['currency_expected_names'][clipboard['currency']]
    if isinstance(name,list): name=name[0]
    return '物品種類: 可堆疊通貨\\n稀有度: 通貨\\n'+name+'[1c]\\n--------'
def fail(currency,reason,actual='',failure_code='CONFIGURATION_MISSING'):
    clipboard['failure']=failure_code
    return False
ns.update(verified_currency_types=set(),GetClipboardSequenceNumber=lambda:clipboard['sequence'],move_mouse=move,pyperclip=types.SimpleNamespace(paste=lambda:''),send_copy_command=copy,fail_currency_preflight=fail)
preflight=ns['preflight_required_currencies']()
def wrong_copy(*args,**kwargs):
    clipboard['sequence']+=1
    return 'Item Class: Maps (Uber)\\nRarity: Normal\\nKnown Map\\n--------'
ns['send_copy_command']=wrong_copy
wrong_preflight=ns['preflight_required_currencies']()
print(json.dumps({'results':results,'requiredCurrencies':ns['required_currency_types'],'preflight':preflight,'wrongPreflight':wrong_preflight,'wrongCode':clipboard['failure']},ensure_ascii=False))`
  const result=spawnSync(pythonPath,['-'],{input:code,encoding:'utf8',env:{...process.env,PYTHONUTF8:'1',PYTHONIOENCODING:'utf-8',PYTHONDONTWRITEBYTECODE:'1'}})
  assert.equal(result.status,0,result.stderr)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

test('真实生成脚本四类地图按实际稀有度走统一点金/混沌策略，不因17阶跳过',()=>{
  for(const method of ['alchemy','chaos']) {
    const cases=categories.flatMap(category=>[
      {item:item(category)},
      {item:item(category,{rarity:'魔法'})},
      {item:item(category,{rarity:'稀有'})},
      {item:item(category,{rarity:'稀有',good:true})}
    ])
    const result=replay(method,cases)
    assert.equal(result.preflight,true)
    assert.equal(result.wrongPreflight,false)
    assert.equal(result.wrongCode,'CURRENCY_TYPE_MISMATCH')
    assert.deepEqual(result.requiredCurrencies,method==='alchemy'?['wisdom','scouring','alchemy']:['wisdom','scouring','alchemy','chaos'])
    result.results.forEach((value,index)=>{
      const expected= index%4===0?['alchemy','stash']:index%4===1?['scouring','alchemy','stash']:index%4===2?(method==='alchemy'?['scouring','alchemy','stash']:['chaos','stash']):['stash']
      assert.deepEqual(value.events,expected,`${method}/${cases[index].item.category}/${index%4}`)
      assert.equal(value.outcome.qualified,true)
      assert.equal(value.batchAccepted,true)
      assert.equal(value.copiedName,'Known Map')
    })
  }
})

test('四类中英文简繁snapshot别名用于批量识别，未知类别和安全状态仍阻止制作',()=>{
  const current=snapshot()
  const aliases=Object.entries(current.structureAliases).filter(([,canonical])=>canonical==='Maps').map(([alias])=>alias)
  assert.ok(categories.every(category=>aliases.includes(category)),'共享四类结构别名已注入生成快照')
  assert.ok(aliases.some(alias=>alias.includes('地图') && alias.includes('Low')))
  assert.ok(aliases.some(alias=>alias.includes('地圖') && alias.includes('Uber')))
  const normal=replay('alchemy',aliases.map(category=>({item:item(category)})),current)
  assert.ok(normal.results.every(value=>value.outcome.qualified && value.batchAccepted))
  const states=[{category:'Maps (Unknown)'},{category:'Body Armours'},{isQuestItem:true},{isLegendary:true},{isUnmodifiable:true},{isCorrupted:true},{isCorrupted:true,good:true}]
  const guarded=replay('alchemy',states.map(extra=>({item:item('Maps (Uber)',extra)})))
  guarded.results.forEach(value=>assert.deepEqual(value.events,value.outcome.qualified?['stash']:[]))
  assert.equal(guarded.results[0].outcome.code,'MAP_TARGET_MISMATCH')
  assert.equal(guarded.results[1].outcome.code,'MAP_TARGET_MISMATCH')
  const failed=replay('alchemy',[{item:item('Maps (Uber)'),readError:true}]).results[0]
  assert.equal(failed.outcome.code,'MAP_REREAD_FAILED')
  assert.deepEqual(failed.events,['alchemy'])
})

test('无汉化快照四类英文也可制作，统一类别不按地图阶级或品质分流',()=>{
  const cases=categories.flatMap(category=>[0,1,16,17,20].map(mapTier=>({item:item(category,{mapTier,quality:mapTier})})))
  const values=replay('alchemy',cases,{}).results
  assert.ok(values.every(value=>value.outcome.qualified && value.batchAccepted))
  values.forEach(value=>assert.deepEqual(value.events,['alchemy','stash']))
})
})()

// === Merged from internationalMapLocalizationVariants.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const readFileSync = _m4_readFileSync
  const spawnSync = _m4_spawnSync
  const createLocalizationDictionary = _m4_createLocalizationDictionary
  const statVariantApplies = _m4_statVariantApplies
  const LocalizationRuntime = _m4_LocalizationRuntime
  const matchMapRequirements = _m4_matchMapRequirements
  const mapStatVariants = _m4_mapStatVariants
  const pythonPath = _m4_pythonPath
const dictionary = createLocalizationDictionary(mapStatVariants)
const map = mod => `Item Class: Maps\nRarity: Rare\nDoom Domain\nFortress Map\n--------\nMap Tier: 17\nAtlas Drops: +140%\n--------\nItem Level: 84\n--------\n{ Prefix Modifier "Fixture" (Tier: 1) }\n${mod}`
const blacklist = term => ({ targetKind: 'atlas', match: { blacklist: [term] } })

test('真实地图同stat单复数按条件和variant顺序选择，不再把合法汉化词缀当歧义', () => {
  for (const number of [1, 2, 0, -2]) {
    const suffix = number === 1 ? '' : 's'
    for (const input of [`每个稀有怪物额外具有 ${number} 个词缀`, `每個稀有怪物有 ${number} 個額外詞綴`]) {
      assert.equal(dictionary.toEnglish(input, { strict: true }), `Rare Monsters each have ${number} additional Modifier${suffix}`)
    }
    assert.equal(dictionary.toEnglish(`怪物击中时施加 ${number} 缓速藤蔓`, { strict: true }), `Monsters inflict ${number} Grasping Vine${suffix} on Hit`)
  }
  // Input order cannot replace the game's recorded variant order.
  assert.equal(createLocalizationDictionary([...mapStatVariants].reverse()).toEnglish('每个稀有怪物额外具有 1 个词缀'), 'Rare Monsters each have 1 additional Modifier')
})

test('具体数量别名执行相同条件，抽象别名仅在相同可信单复数模板族内兼容', () => {
  assert.ok(dictionary.aliasesFor('Rare Monsters each have 1 additional Modifier').includes('每个稀有怪物额外具有 1 个词缀'))
  assert.ok(dictionary.aliasesFor('Rare Monsters each have 1 additional Modifier').includes('Rare Monsters each have # additional Modifiers'))
  assert.ok(dictionary.aliasesFor('Rare Monsters each have # additional Modifiers').includes('每个稀有怪物额外具有 # 个词缀'))
  assert.deepEqual(dictionary.aliasesFor('Rare Monsters each have 1 additional Modifiers'), ['Rare Monsters each have 1 additional Modifiers'])
  assert.deepEqual(dictionary.aliasesFor('Rare Monsters each have 2 additional Modifier'), ['Rare Monsters each have 2 additional Modifier'])
  assert.equal(dictionary.aliasesFor('20% increased Attack Speed').some(alias => alias.includes('reduced Attack Speed')), false)
})

test('反伤和数量1/2黑名单在真实JS解析及未修改Python alias循环中一致，固定数字不串', () => {
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => mapStatVariants, revision: () => 'fixture' })
  const items = [1, 2].map(number => runtime.parseItem(map(`每个稀有怪物额外具有 ${number} 个词缀`), 'fixture'))
  const reflection = runtime.parseItem(map('怪物会反射 18% 物理伤害'), 'fixture')
  for (const item of items) assert.equal(matchMapRequirements(item, blacklist('Rare Monsters each have # additional Modifiers')).reason, 'blacklist')
  assert.equal(matchMapRequirements(items[0], blacklist('Rare Monsters each have 2 additional Modifiers')).isMatch, true)
  assert.equal(matchMapRequirements(items[1], blacklist('Rare Monsters each have 1 additional Modifier')).isMatch, true)
  assert.equal(matchMapRequirements(items[0], blacklist('Rare Monsters each have 1 additional Modifier')).reason, 'blacklist')
  assert.equal(matchMapRequirements(reflection, blacklist('Monsters reflect #% of Physical Damage')).reason, 'blacklist')
  const template = readFileSync(new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url), 'utf8')
  const helpers = template.slice(template.indexOf('def map_term_matches('), template.indexOf('def check_map_requirements('))
  const script = `import json,sys\n${helpers}\nitems=json.load(sys.stdin)\nmap_config={'match':{'blacklist':['Rare Monsters each have # additional Modifiers'],'whitelist':[]}}\nresults=[check_map_mods(item) for item in items]\nmap_config['match']['blacklist']=['Rare Monsters each have 2 additional Modifiers']\nresults.append(check_map_mods(items[0]))\nprint(json.dumps(results))`
  const result = spawnSync(pythonPath, ['-c', script], { input: JSON.stringify(items), encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', PYTHONDONTWRITEBYTECODE: '1' } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout.trim()), [false, false, true])
})

test('正负数handler、区间、!0和详细范围严格约束已适用模板', () => {
  assert.equal(dictionary.toEnglish('攻击速度加快 20%'), '20% increased Attack Speed')
  assert.equal(dictionary.toEnglish('攻击速度减慢 20%'), '20% reduced Attack Speed')
  for (const input of ['攻击速度加快 0%', '攻击速度加快 -20%', '攻击速度减慢 0%', '攻击速度减慢 -20%']) {
    assert.throws(() => dictionary.toEnglish(input, { strict: true }), /未匹配/)
  }
  assert.equal(dictionary.toEnglish('攻击速度加快 90（80—99）%'), '90(80—99)% increased Attack Speed')
  assert.equal(dictionary.toEnglish('攻击速度加快 79（80—99）%'), '79(80—99)% increased Attack Speed')
  assert.throws(() => dictionary.toEnglish('攻击速度加快 0（80—99）%', { strict: true }), /未匹配/)
  const range = structuredClone(mapStatVariants[0])
  range.stats.variants = [{ condition: '2|5', handlers: '', placeholders: ['{0}'] }]
  for (const number of [2, 5]) assert.equal(statVariantApplies(range, new Map([['0', String(number)]])), true)
  for (const number of [-2, 0, 1, 6]) assert.equal(statVariantApplies(range, new Map([['0', String(number)]])), false)
  range.stats.variants[0].condition = '!0'
  assert.equal(statVariantApplies(range, new Map([['0', '0']])), false)
  assert.equal(statVariantApplies(range, new Map([['0', '-2']])), true)
})

test('不把不同stat、不同handler或未支持元数据的真实歧义伪装成单复数同义', () => {
  const different = structuredClone(mapStatVariants[1])
  different.id = 'different-source-stat'
  different.en = 'Other Monsters have {0} additional Modifiers'
  different.sourceHash = undefined
  assert.throws(() => createLocalizationDictionary([...mapStatVariants, different]).toEnglish('每个稀有怪物额外具有 2 个词缀'), error => error.code === 'LOCALIZATION_AMBIGUOUS')
  const unknown = structuredClone(mapStatVariants.slice(0, 2))
  for (const entry of unknown) entry.stats.variants.forEach(variant => { variant.handlers = 'unrecognised_handler 1' })
  assert.throws(() => createLocalizationDictionary(unknown).toEnglish('每个稀有怪物额外具有 2 个词缀'), error => error.code === 'LOCALIZATION_AMBIGUOUS')
})
})()

// === Merged from mapExaltedFinishing.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const readFileSync = _m5_readFileSync
  const spawnSync = _m5_spawnSync
  const pythonPath = _m5_pythonPath
const template = readFileSync(new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url), 'utf8')
const view = readFileSync(new URL('../src/domains/map/MapView.vue', import.meta.url), 'utf8')

function block(start, end) {
  const from = template.indexOf(start)
  const to = template.indexOf(end, from)
  assert.ok(from >= 0 && to > from, `${start} -> ${end}`)
  return template.slice(from, to)
}

function runPython(source) {
  const result = spawnSync(pythonPath, ['-c', source], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

const affixCounter = `
def _explicit_affix_count(result):
    if not isinstance(result, dict) or result.get("affixFormatUnsupported"):
        return None
    detailed = result.get("detailedMods")
    if isinstance(detailed, list) and detailed:
        return sum(1 for modifier in detailed if isinstance(modifier, dict) and modifier.get("type") in ("prefix", "suffix"))
    explicit = result.get("explicitMods")
    if isinstance(explicit, list) and len(explicit) == 0:
        return 0
    return None
`

test('崇高石选项位于瓦尔宝珠左侧并复用现有图标', () => {
  const exalted = view.indexOf('v-model="activeProfile.exalted.enabled"')
  const vaal = view.indexOf('v-model="activeProfile.vaal.enabled"')
  const stash = view.indexOf('v-model="activeProfile.autoStash"')
  assert.ok(exalted >= 0 && exalted < vaal && vaal < stash)
  assert.match(view, /crafting-currency\/exalted\.png/)
})

test('六词缀门禁覆盖 4→5→6、5→6、已有六词缀和安全失败', () => {
  const helper = block('def fill_rare_map_affixes(', 'def process_single_map(')
  const result = runPython(`
import json
${affixCounter}
${helper}
is_running = True
map_config = {"exalted": {"enabled": True}}
events = []
state = [None]

def item(count):
    return {
        "category": "地图", "rarity": "稀有", "explicitMods": [f"词缀{i}" for i in range(count)],
        "detailedMods": [{"type": "prefix" if i % 2 == 0 else "suffix"} for i in range(count)]
    }

def apply_currency_and_read(currency, _x, _y):
    before = state[0]
    events.append([currency, _explicit_affix_count(before)])
    if globals().get("fail_next"):
        return {"error": "结果未确认", "code": "TRANSITION_UNCONFIRMED"}
    count = _explicit_affix_count(before)
    state[0] = {**before, "explicitMods": before["explicitMods"] + [f"词缀{count}"], "detailedMods": before["detailedMods"] + [{"type": "suffix"}]}
    return state[0]

def run(count):
    start = len(events)
    state[0] = item(count)
    outcome = fill_rare_map_affixes(state[0], 10, 20)
    return {"outcome": outcome, "events": events[start:]}

four = run(4)
five = run(5)
six = run(6)
missing = fill_rare_map_affixes({"rarity": "稀有", "explicitMods": ["无法归组"], "detailedMods": []}, 10, 20)
fail_next = True
failed = run(4)
print(json.dumps({"four": four, "five": five, "six": six, "missing": missing, "failed": failed}, ensure_ascii=False))
`)

  assert.deepEqual(result.four.events, [['exalted', 4], ['exalted', 5]])
  assert.equal(result.four.outcome.result.detailedMods.length, 6)
  assert.deepEqual(result.five.events, [['exalted', 5]])
  assert.deepEqual(result.six.events, [])
  assert.equal(result.missing.ok, false)
  assert.equal(result.missing.code, 'MAP_EXALTED_AFFIX_COUNT_UNAVAILABLE')
  assert.deepEqual(result.failed.events, [['exalted', 4]])
  assert.equal(result.failed.outcome.ok, false)
  assert.equal(result.failed.outcome.code, 'TRANSITION_UNCONFIRMED')
})

test('每颗崇高石后严格确认稀有度和显式词缀递增，异常时不再使用下一颗', () => {
  const helper = block('def fill_rare_map_affixes(', 'def process_single_map(')
  const result = runPython(`
import json
${affixCounter}
${helper}
is_running = True
map_config = {"exalted": {"enabled": True}}
events = []
mode = "normal"

def item(count, rarity="稀有", detailed=True):
    return {
        "rarity": rarity,
        "explicitMods": [f"词缀{i}" for i in range(count)],
        "detailedMods": ([{"type": "prefix" if i % 2 == 0 else "suffix"} for i in range(count)] if detailed else [])
    }

def apply_currency_and_read(currency, _x, _y):
    before = current_state[0]
    events.append([currency, _explicit_affix_count(before)])
    count = _explicit_affix_count(before)
    if mode == "unchanged": return before
    if mode == "rarity": return item(count + 1, "魔法")
    if mode == "missing": return {"rarity": "稀有", "explicitMods": ["无法归组"], "detailedMods": []}
    if mode == "overflow": return item(7)
    current_state[0] = item(count + 1)
    return current_state[0]

def run(case, start=4):
    global mode, events
    mode = case
    events = []
    current_state[0] = item(start)
    outcome = fill_rare_map_affixes(current_state[0], 10, 20)
    return {"outcome": outcome, "events": list(events)}

current_state = [None]
normal = run("normal")
unchanged = run("unchanged")
rarity = run("rarity")
missing = run("missing")
overflow = run("overflow")
invalid_start = run("normal", 7)
print(json.dumps({
    "normal": normal, "unchanged": unchanged, "rarity": rarity,
    "missing": missing, "overflow": overflow, "invalidStart": invalid_start
}, ensure_ascii=False))
`)

  assert.deepEqual(result.normal.events, [['exalted', 4], ['exalted', 5]])
  assert.equal(result.normal.outcome.ok, true)

  for (const [key, code] of [
    ['unchanged', 'MAP_EXALTED_AFFIX_COUNT_NOT_INCREASED'],
    ['rarity', 'MAP_EXALTED_RARITY_CHANGED'],
    ['missing', 'MAP_EXALTED_AFFIX_COUNT_UNAVAILABLE'],
    ['overflow', 'MAP_EXALTED_AFFIX_COUNT_INVALID']
  ]) {
    assert.deepEqual(result[key].events, [['exalted', 4]], key)
    assert.equal(result[key].outcome.ok, false, key)
    assert.equal(result[key].outcome.code, code, key)
  }

  assert.deepEqual(result.invalidStart.events, [])
  assert.equal(result.invalidStart.outcome.ok, false)
  assert.equal(result.invalidStart.outcome.code, 'MAP_EXALTED_AFFIX_COUNT_INVALID')
})

test('补满发生在条件判断和瓦尔之前，确认后才存仓', () => {
  const process = block('def fill_rare_map_affixes(', 'def check_map_base(')
  const result = runPython(`
import json
${affixCounter}
${process}
is_running = True
map_config = {"targetKind": "atlas", "method": "alchemy", "autoStash": True, "exalted": {"enabled": True}, "vaal": {"enabled": True}}
events = []

def item(count, **extra):
    return {
        "category": "地图", "rarity": "稀有", "quality": 0, "mapTier": 16,
        "isCorrupted": False, "isUnmodifiable": False, "isLegendary": False,
        "explicitMods": [f"词缀{i}" for i in range(count)],
        "detailedMods": [{"type": "prefix" if i % 2 == 0 else "suffix"} for i in range(count)],
        **extra
    }

state = [item(4)]

def item_matches_rolling_target(_item): return True
def rolling_target_label(): return "地图"
def rolling_item_level_label(_item): return "T16"
def completed_map_result(qualified=False): return {"status": "completed", "qualified": bool(qualified)}
def failed_map_result(reason, code="MAP_PROCESSING_FAILED"): return {"status": "failed", "reason": reason, "code": code}
def check_map_base(candidate): events.append(["base", _explicit_affix_count(candidate)]); return True
def check_map_mods(candidate): events.append(["mods", _explicit_affix_count(candidate)]); return True
def stash_item(_x, _y): events.append(["stash"]); return True
def apply_currency_and_read(currency, _x, _y):
    before = state[0]
    events.append(["currency", currency, _explicit_affix_count(before)])
    if currency == "vaal":
        state[0] = {**before, "isCorrupted": True}
        return state[0]
    count = _explicit_affix_count(before)
    state[0] = {**before, "explicitMods": before["explicitMods"] + [f"词缀{count}"], "detailedMods": before["detailedMods"] + [{"type": "suffix"}]}
    return state[0]

outcome = process_single_map(state[0], 10, 20)
print(json.dumps({"outcome": outcome, "events": events}, ensure_ascii=False))
`)

  const actions = result.events.filter(([kind]) => kind === 'currency')
  assert.deepEqual(actions.map(([, currency]) => currency), ['exalted', 'exalted', 'vaal'])
  const firstCheck = result.events.findIndex(([kind]) => kind === 'base' || kind === 'mods')
  assert.ok(firstCheck > result.events.findLastIndex(([kind, currency]) => kind === 'currency' && currency === 'exalted'))
  assert.equal(result.events.at(-1)[0], 'stash')
  assert.deepEqual(result.outcome, { status: 'completed', qualified: true })
})

test('点金与混沌重洗后的下一份稀有候选仍先补满再判断', () => {
  const process = block('def fill_rare_map_affixes(', 'def check_map_base(')
  const result = runPython(`
import json
${affixCounter}
${process}
is_running = True
events = []
state = [None]

def item(count, matched):
    return {
        "category": "海图", "rarity": "稀有", "quality": 0, "areaLevel": 83, "match": matched,
        "isCorrupted": False, "isUnmodifiable": False, "isLegendary": False,
        "explicitMods": [f"词缀{i}" for i in range(count)],
        "detailedMods": [{"type": "prefix" if i % 2 == 0 else "suffix"} for i in range(count)]
    }

def item_matches_rolling_target(_item): return True
def rolling_target_label(): return "航海海图"
def rolling_item_level_label(_item): return "区域等级 83"
def completed_map_result(qualified=False): return {"status": "completed", "qualified": bool(qualified)}
def failed_map_result(reason, code="MAP_PROCESSING_FAILED"): return {"status": "failed", "reason": reason, "code": code}
def check_map_base(candidate): events.append(["check", _explicit_affix_count(candidate), candidate.get("match")]); return candidate.get("match")
def check_map_mods(_candidate): return True
def stash_item(_x, _y): events.append(["stash"]); return True
def apply_currency_and_read(currency, _x, _y):
    before = state[0]
    events.append(["currency", currency, _explicit_affix_count(before)])
    if currency == "chaos": state[0] = item(5, True); return state[0]
    if currency == "scouring": state[0] = {**item(0, False), "rarity": "普通"}; return state[0]
    if currency == "alchemy": state[0] = item(4, True); return state[0]
    count = _explicit_affix_count(before)
    state[0] = {**before, "explicitMods": before["explicitMods"] + [f"词缀{count}"], "detailedMods": before["detailedMods"] + [{"type": "suffix"}]}
    return state[0]

def run(method, count):
    global map_config, events, is_running
    is_running = True
    events = []
    map_config = {"targetKind": "chart", "method": method, "autoStash": True, "exalted": {"enabled": True}, "vaal": {"enabled": False}}
    state[0] = item(count, False)
    outcome = process_single_map(state[0], 10, 20)
    return {"outcome": outcome, "events": list(events)}

chaos = run("chaos", 4)
alchemy = run("alchemy", 5)
print(json.dumps({"chaos": chaos, "alchemy": alchemy}, ensure_ascii=False))
`)

  assert.deepEqual(
    result.chaos.events.filter(([kind]) => kind === 'currency').map(([, currency, count]) => [currency, count]),
    [['exalted', 4], ['exalted', 5], ['chaos', 6], ['exalted', 5]]
  )
  assert.deepEqual(
    result.alchemy.events.filter(([kind]) => kind === 'currency').map(([, currency, count]) => [currency, count]),
    [['exalted', 5], ['scouring', 6], ['alchemy', 0], ['exalted', 4], ['exalted', 5]]
  )
  for (const run of [result.chaos, result.alchemy]) {
    assert.ok(run.events.filter(([kind]) => kind === 'check').every(([, count]) => count === 6))
    assert.equal(run.events.at(-1)[0], 'stash')
    assert.deepEqual(run.outcome, { status: 'completed', qualified: true })
  }
})
})()

// === Merged from mapRollingForeground.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const readFileSync = _m6_readFileSync
  const spawnSync = _m6_spawnSync
  const pythonPath = _m6_pythonPath
const mapTemplate = readFileSync(
  new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url),
  'utf8'
)
const craftingTemplate = readFileSync(
  new URL('../src/assets/scripts/crafting_template.py', import.meta.url),
  'utf8'
)

function runRuntimeForegroundGate(template) {
  const start = template.indexOf('def require_game_foreground():')
  const end = template.indexOf('\ndef ', start + 5)
  const block = template.slice(start, end)
  const code = `
import json
${block}
events = []
released = []
focus = iter([True, False])
is_running = True
fatal_error_reason = None
foreground_failure_emitted = False
current_recovery_checkpoint = None
def is_game_foreground(): return next(focus)
def release_all_keys(): released.append(True)
print(json.dumps({"first": require_game_foreground(), "second": require_game_foreground(),
  "running": is_running, "reason": fatal_error_reason, "released": len(released)}))
`
  const result = spawnSync(pythonPath, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  const lines = result.stdout.trim().split(/\r?\n/)
  return { event: JSON.parse(lines[0].slice(6)), result: JSON.parse(lines.at(-1)) }
}

function runMapStart(foregroundResult) {
  const start = mapTemplate.indexOf('def start_map_rolling():')
  const end = mapTemplate.indexOf('def process_single_map(')
  const block = mapTemplate.slice(start, end)
  const code = `
import json, types
${block}
events = []
grid_config = {"startX": 0, "startY": 0, "offsetX": 1, "offsetY": 1, "rows": 1, "cols": 1, "emptySlotThreshold": 1}
map_config = {"targetKind": "atlas"}
recovery_config = {}
current_recovery_checkpoint = None
fatal_error_reason = None
GetClipboardSequenceNumber = None
keyboard = types.SimpleNamespace(GlobalHotKeys=lambda mapping: types.SimpleNamespace(start=lambda: None))
pyperclip = types.SimpleNamespace(paste=lambda: "")
time = types.SimpleNamespace(sleep=lambda value: None)
def is_game_foreground(): events.append("guard"); return ${foregroundResult ? 'True' : 'False'}
def select_currency_stash_tab(mode): events.append("stash"); return True
def preflight_required_currencies(): events.append("preflight"); return True
def move_mouse(x, y): events.append("move"); return True
def get_slot_position(col, row): return col, row
def read_clipboard_to_file(): events.append("copy"); return False
def wait_for_parse_result(): return {"error": "unexpected"}
def read_current_rolling_target(*args, **kwargs): events.append("copy"); return {"empty": True}
def process_single_map(result, x, y): return True
def count_affix_stats(result): return {}, {}
def update_map_stats(*args): pass
def update_map_recovery_checkpoint(*args): pass
def release_all_keys(): pass
def play_success_sound(): pass
start_map_rolling()
print(json.dumps(events))
`
  const result = spawnSync('python', ['-c', code], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(result.status, 0, result.stderr)
  return {
    events: JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1)),
    output: result.stdout
  }
}

test('地图洗练启动时只校验游戏前台，再执行鼠标与复制操作', () => {
  const result = runMapStart(true)
  assert.deepEqual(result.events, ['guard', 'stash', 'preflight', 'move', 'copy'])
})

test('地图洗练不再自行枚举和激活窗口，只保留标题与进程双重前台门禁', () => {
  assert.match(mapTemplate, /GAME_WINDOW_TITLES = \("流放之路", "Path of Exile"\)/)
  assert.match(mapTemplate, /def window_matches_game\([\s\S]*window_process_name/)
  assert.doesNotMatch(mapTemplate, /def (?:find_game_window|focus_game_window)|SetForegroundWindow/)

  const start = mapTemplate.indexOf('def start_map_rolling():')
  const focus = mapTemplate.indexOf('if not is_game_foreground():', start)
  const scan = mapTemplate.indexOf('while is_running and current_col', start)
  assert.ok(start < focus && focus < scan)
})

test('地图洗练无法激活游戏时安全停止，不进入鼠标和剪贴板判空流程', () => {
  const result = runMapStart(false)
  assert.deepEqual(result.events, ['guard'])
  assert.match(result.output, /无法激活游戏窗口|不在前台/)
  assert.doesNotMatch(result.output, /连续空格候选/)
})

test('物品与地图制作运行中失焦时释放输入并发出统一停止事件', () => {
  for (const [mode, template] of [['items', craftingTemplate], ['map', mapTemplate]]) {
    const values = runRuntimeForegroundGate(template)
    assert.equal(values.result.first, true)
    assert.equal(values.result.second, false)
    assert.equal(values.result.running, false)
    assert.equal(values.result.released, 1)
    assert.equal(values.event.event, 'crafting-runtime-stopped')
    assert.equal(values.event.mode, mode)
    assert.equal(values.event.code, 'GAME_NOT_FOREGROUND')
    assert.match(values.result.reason, /失去前台/)
    assert.match(template, /def move_mouse\(x, y\):[\s\S]*?if not require_game_foreground\(\):/)
    assert.match(template, /def click_mouse\(button="left"\):[\s\S]*?if not require_game_foreground\(\):/)
    assert.match(template, /def send_copy_command\(before_seq=None, before_text=""(?:, result_timeout=None)?, allow_unchanged_text=False\):[\s\S]*?if not require_game_foreground\(\):/)
  }
})
})()

// === Merged from mapRuntimeTemplate.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const readFileSync = _m7_readFileSync
  const spawnSync = _m7_spawnSync
  const pythonPath = _m7_pythonPath
const template = readFileSync(new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url), 'utf8')

function functionBlock(start, end) {
  return template.slice(template.indexOf(start), template.indexOf(end))
}

const runtimeSource = [
  functionBlock('def check_map_base(item_data):', 'def check_map_mods(item_data):'),
  functionBlock('def get_stat_value(item_data, key):', 'if __name__ == "__main__":')
].join('\n')

function evaluate(config, item) {
  const script = `${runtimeSource}\nmap_config = ${JSON.stringify(config)}\nitem = ${JSON.stringify(item)}\nprint(check_map_base(item))\n`
    .replaceAll('true', 'True')
    .replaceAll('false', 'False')
    .replaceAll('null', 'None')
  const result = spawnSync(pythonPath, ['-c', script], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim().split(/\r?\n/).at(-1) === 'True'
}

const stat = (enabled, value) => ({ enabled, value })

test('地图运行时使用同一流程匹配完整六项基底', () => {
  const mandatoryStats = Object.fromEntries([
    ['quantity', 100], ['rarity', 50], ['packSize', 30],
    ['moreMaps', 20], ['moreScarabs', 40], ['moreCurrency', 10]
  ].map(([key, value]) => [key, stat(true, value)]))

  assert.equal(evaluate({ match: { mandatoryStats, optionalStats: {} } }, {
    itemQuantity: 110,
    itemRarity: 60,
    monsterPackSize: 35,
    moreMaps: 25,
    moreScarabs: 45,
    moreCurrency: 15
  }), true)
})

test('地图运行时将三字段地图缺失的更多属性按零处理', () => {
  assert.equal(evaluate({ match: {
    mandatoryStats: { moreMaps: stat(true, 1) },
    optionalStats: {}
  } }, { itemQuantity: 80, itemRarity: 40, monsterPackSize: 20 }), false)
})

test('同一地图基底在必选和挑选中冲突时使用更严格阈值且不重复计数', () => {
  const config = { match: {
    selectedCount: 1,
    mandatoryStats: { quantity: stat(true, 80) },
    optionalStats: { quantity: stat(true, 100) }
  } }

  assert.equal(evaluate(config, { itemQuantity: 90 }), false)
  assert.equal(evaluate(config, { itemQuantity: 100 }), true)
})

test('地图运行模板不再引用旧地图类型字段', () => {
  const checkBlock = functionBlock('def check_map_base(item_data):', 'def check_map_mods(item_data):')
  assert.equal(checkBlock.includes("map_config['tiers']"), false)
  assert.equal(checkBlock.includes('Normal'), false)
  assert.equal(checkBlock.includes('T17'), false)
})

test('航海海图运行时仅匹配四项奖励并支持亡者硫磺', () => {
  assert.equal(evaluate({ targetKind: 'chart', match: {
    mandatoryStats: { deadmanSulphur: stat(true, 30) },
    optionalStats: {
      quantity: stat(true, 100),
      packSize: stat(true, 15),
      moreMaps: stat(true, 999)
    },
    selectedCount: 2
  } }, {
    itemQuantity: 110,
    monsterPackSize: 16,
    deadmanSulphur: 30
  }), true)
})

test('地图运行模板按活动目标隔离物品类别并使用区域等级日志', () => {
  assert.match(template, /map_config\.get\("targetKind"\) == "chart"/)
  assert.match(template, /return category == "海图"/)
  assert.match(template, /不是当前目标/)
  assert.match(template, /区域等级/)
  assert.match(template, /apply_currency_and_read\("vaal"/)
  assert.match(template, /MAP_VAAL_READ_FAILED/)
})
})()
