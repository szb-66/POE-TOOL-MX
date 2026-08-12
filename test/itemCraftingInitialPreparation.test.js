import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'
import { pythonPath } from './helpers/python.js'
import { usePresetStore } from '../src/stores/preset.js'

const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

function runPython(script) {
  const executed = spawnSync(pythonPath, ['-c', script], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(executed.status, 0, executed.stderr)
  return JSON.parse(executed.stdout.trim().split(/\r?\n/).at(-1))
}

test('物品制作界面公开默认保护开关，启动门禁先准备物品再报告成功', () => {
  const affixConfig = source('../src/domains/items/affixConfig.js')
  const moduleTwo = source('../src/domains/items/components/ModuleTwo.vue')
  const moduleOne = source('../src/domains/items/components/ModuleOne.vue')
  const itemsView = source('../src/domains/items/ItemsView.vue')
  const template = source('../src/assets/scripts/crafting_template.py')

  assert.doesNotMatch(affixConfig, /checkInitialAffixes:/)
  assert.doesNotMatch(moduleTwo, /checkInitialAffixes|首次识别达标即停止/)
  assert.doesNotMatch(itemsView, /initial-recognition-section|currentItemPreset\.checkInitialItem/)
  assert.match(moduleOne, /currentItemPreset\.checkInitialItem/)
  assert.match(moduleOne, /首次识别[\s\S]*checkInitialItem">开启</)
  assert.doesNotMatch(moduleOne, /达标即停止|统一控制词缀、古灵隐式和插槽制作/)

  const preflight = template.indexOf('if not preflight_required_currencies():')
  const preparation = template.indexOf('initial_item_result = prepare_item_for_crafting(identify_unidentified=not eldritch_enabled)', preflight)
  const startupSucceeded = template.indexOf('"event": "crafting-startup-succeeded"', preparation)
  const eldritch = template.indexOf('craft_eldritch_implicits(initial_item_result)', startupSucceeded)
  const affixes = template.indexOf('craft_affixes(initial_item_result)', startupSucceeded)
  const sockets = template.indexOf('craft_sockets(initial_item_result)', startupSucceeded)
  assert.ok(preflight >= 0 && preparation > preflight && startupSucceeded > preparation)
  assert.ok(eldritch > startupSucceeded && affixes > startupSucceeded && sockets > startupSucceeded)
})

test('页面级首次识别配置默认开启并迁移模块级临时关闭值', () => {
  const values = new Map([[
    'itemPresets',
    JSON.stringify([{
      id: 'legacy',
      name: '旧预设',
      moduleTwo: { enabled: true, mode: 'alteration', checkInitialAffixes: false, affixGroups: [] },
      moduleThree: { enabled: false }
    }])
  ], ['currentItemPresetId', 'legacy']])
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  }
  setActivePinia(createPinia())
  const store = usePresetStore()
  assert.equal(store.currentItemPreset.checkInitialItem, false)
  assert.equal(Object.hasOwn(store.currentItemPreset.moduleTwo, 'checkInitialAffixes'), false)

  store.updateCurrentItemPreset({ checkInitialItem: true })
  setActivePinia(createPinia())
  const restored = usePresetStore()
  assert.equal(restored.currentItemPreset.checkInitialItem, true)
})

test('制作前准备仅鉴定未鉴定物品一次，并对失败发出启动错误', () => {
  const template = source('../src/assets/scripts/crafting_template.py')
  const start = template.indexOf('def fail_item_preparation(')
  const end = template.indexOf('# 自动启动制作', start)
  assert.ok(start >= 0 && end > start)
  const block = template.slice(start, end)
  const result = runPython(`
import json, time
${block}
item_position = {"x": 1, "y": 2}
def release_all_keys(): pass
def play_error_sound(): pass
def move_mouse(x, y): return True

def run(results, read_results=None, apply_success=True, identify_unidentified=True):
    global is_running, fatal_error_reason, queue, reads, applied
    is_running = True
    fatal_error_reason = None
    queue = list(results)
    reads = list(read_results or [True] * max(1, len(queue)))
    applied = []
    def read(allow_unchanged_text=False): return reads.pop(0)
    def wait(): return queue.pop(0)
    def apply(currency): applied.append(currency); return apply_success
    globals()["read_clipboard_to_file"] = read
    globals()["wait_for_parse_result"] = wait
    globals()["apply_currency"] = apply
    prepared = prepare_item_for_crafting(identify_unidentified=identify_unidentified)
    return {"prepared": prepared, "applied": applied, "fatal": fatal_error_reason}

identified = {"rarity": "魔法", "isUnidentified": False}
unidentified = {"rarity": "稀有", "isUnidentified": True}
print(json.dumps({
  "identified": run([identified]),
  "unidentified": run([unidentified, identified]),
  "eldritchUnidentified": run([unidentified], identify_unidentified=False),
  "identifyFailed": run([unidentified], apply_success=False),
  "still": run([unidentified, unidentified]),
  "parseFailed": run([{"error": "无法解析"}]),
  "readFailed": run([identified], [False])
}, ensure_ascii=False))
`)

  assert.deepEqual(result.identified.applied, [])
  assert.equal(result.identified.prepared.isUnidentified, false)
  assert.deepEqual(result.unidentified.applied, ['wisdom'])
  assert.equal(result.unidentified.prepared.isUnidentified, false)
  assert.deepEqual(result.eldritchUnidentified.applied, [])
  assert.equal(result.eldritchUnidentified.prepared, null)
  assert.match(result.eldritchUnidentified.fatal, /未鉴定.*请先.*鉴定/)
  assert.equal(result.identifyFailed.prepared, null)
  assert.match(result.identifyFailed.fatal, /知识卷轴/)
  assert.deepEqual(result.still.applied, ['wisdom'])
  assert.equal(result.still.prepared, null)
  assert.match(result.still.fatal, /仍为未鉴定/)
  assert.equal(result.parseFailed.prepared, null)
  assert.match(result.parseFailed.fatal, /解析失败/)
  assert.equal(result.readFailed.prepared, null)
  assert.match(result.readFailed.fatal, /无法读取/)
})

test('页面级首次识别统一控制词缀和插槽模块', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    const generate = (checkInitialItem, moduleThree = { enabled: false }) => generatePythonScript({
      globalShortcuts: { end: 'Alt+3' },
      currencyPositions: { wisdom: { x: 1, y: 1 }, alteration: { x: 2, y: 2 }, transmutation: { x: 3, y: 3 }, scouring: { x: 4, y: 4 } },
      operationDelayMs: 50,
      adaptiveTiming: true,
      fixedTiming: {},
      itemPosition: { x: 30, y: 40 },
      preset: {
        checkInitialItem,
        moduleTwo: {
          enabled: true,
          mode: 'alteration',
          affixGroups: [{ id: 'goal', name: '目标', requiredAffixes: ['生命'], selectedAffixes: [], selectedCount: 1 }]
        },
        moduleThree,
        moduleEldritch: { enabled: false }
      },
      filePaths: { itemInfoFile: 'item.txt', itemInfoResultFile: 'result.json' },
      stashTabSelection: { enabled: false }
    })

    const runAffix = (generated) => {
      const start = generated.indexOf('def explicit_affix_count(')
      const end = generated.indexOf('def craft_eldritch_implicits(', start)
      assert.ok(start >= 0 && end > start)
      return runPython(`
import json, os, time
${generated.slice(start, end)}
is_running = True
item_info_result_file = os.devnull
applied = []
queue = [{"rarity":"魔法", "affixMatch":True, "matchedGroupName":"目标", "explicitMods":[]}]
def apply_currency(currency): applied.append(currency); return True
def read_clipboard_to_file(allow_unchanged_text=False): return True
def wait_for_parse_result(): return queue.pop(0)
time.sleep = lambda _seconds: None
initial = {"rarity":"魔法", "affixMatch":True, "matchedGroupName":"目标", "explicitMods":[]}
success = craft_affixes(initial)
print(json.dumps({"success": bool(success), "applied": applied}, ensure_ascii=False))
`)
    }

    const protectedScript = generate(true)
    const compiled = spawnSync(pythonPath, ['-c', 'import sys; compile(sys.stdin.read(), "crafting.py", "exec")'], {
      input: protectedScript,
      encoding: 'utf8',
      env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
    })
    assert.equal(compiled.status, 0, compiled.stderr)
    assert.deepEqual(runAffix(protectedScript), { success: true, applied: [] })
    assert.deepEqual(runAffix(generate(false)), { success: true, applied: ['alteration'] })

    const generateSockets = (checkInitialItem) => generatePythonScript({
      globalShortcuts: { end: 'Alt+3' },
      currencyPositions: { wisdom: { x: 1, y: 1 }, jewellers: { x: 2, y: 2 } },
      operationDelayMs: 50,
      adaptiveTiming: true,
      fixedTiming: {},
      itemPosition: { x: 30, y: 40 },
      preset: {
        checkInitialItem,
        moduleTwo: { enabled: false },
        moduleThree: {
          enabled: true,
          socket: { enabled: true, count: 6 },
          link: { enabled: false, count: 0 },
          color: { enabled: false, red: 0, green: 0, blue: 0 }
        },
        moduleEldritch: { enabled: false }
      },
      filePaths: { itemInfoFile: 'item.txt', itemInfoResultFile: 'result.json' },
      stashTabSelection: { enabled: false }
    })
    const runSockets = (generated) => {
      const start = generated.indexOf('def craft_sockets(')
      const end = generated.indexOf('# 辅助函数', start)
      assert.ok(start >= 0 && end > start)
      return runPython(`
import json, os, time
${generated.slice(start, end)}
is_running = True
item_info_result_file = os.devnull
currencies = []
def right_click_currency(currency): currencies.append(currency); return True
def left_click_item(): return True
def read_clipboard_to_file(allow_unchanged_text=False): return True
def wait_for_parse_result(): return {"socketsCount": 6}
time.sleep = lambda _seconds: None
success = craft_sockets({"socketMatch": True, "socketsCount": 6})
print(json.dumps({"success": bool(success), "currencies": currencies}, ensure_ascii=False))
`)
    }
    assert.deepEqual(runSockets(generateSockets(true)), { success: true, currencies: [] })
    assert.deepEqual(runSockets(generateSockets(false)), { success: true, currencies: ['jewellers'] })
  } finally {
    await server.close()
  }
})
