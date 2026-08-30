import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { pythonPath } from './helpers/python.js'

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
