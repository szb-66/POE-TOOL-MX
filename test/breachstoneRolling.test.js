import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { matchMapRequirements } from '../electron/modules/item/matcher.js'
import { rareInvitation, normalInvitation } from './fixtures/breachstoneInvitations.js'
import { pythonPath } from './helpers/python.js'

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
