import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createPinia, setActivePinia } from 'pinia'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { matchMapRequirements } from '../electron/modules/item/matcher.js'
import { createDefaultHeistConfig, cleanMigratedHeistConfig, getActiveMapRollingConfig, HEIST_BASE_STATS } from '../src/utils/mapPresetMigration.js'
import { validateMapRecovery } from '../src/utils/craftingRecovery.js'
import { usePresetStore } from '../src/stores/preset.js'
import { pythonPath } from './helpers/python.js'

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
  const result = spawnSync(pythonPath, ['-c', script], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
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
