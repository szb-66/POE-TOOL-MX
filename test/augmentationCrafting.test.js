import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createServer } from 'vite'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { pythonPath } from './helpers/python.js'

function runPython(script) {
  const executed = spawnSync(pythonPath, ['-c', script], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(executed.status, 0, executed.stderr)
  return JSON.parse(executed.stdout.trim().split(/\r?\n/).at(-1))
}

function parsedMagicModifier(lines) {
  return parseItemInfo([
    '物品类别: 单手剑',
    '稀 有 度: 魔法',
    '测试之剑',
    '宝石之剑',
    '--------',
    '物品等级: 86',
    '--------',
    '{ 前缀属性 "复合测试" (等阶：1) — 攻击 }',
    ...lines
  ].join('\n'))
}

test('改造模式在首次解析失败时只重试读取一次，不重复使用通货', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    const generated = generatePythonScript({
      globalShortcuts: { end: 'Alt+3' },
      currencyPositions: {
        wisdom: { x: 1, y: 1 },
        alteration: { x: 2, y: 2 },
        augmentation: { x: 3, y: 3 },
        transmutation: { x: 4, y: 4 },
        scouring: { x: 5, y: 5 }
      },
      operationDelayMs: 50,
      adaptiveTiming: true,
      fixedTiming: {},
      itemPosition: { x: 30, y: 40 },
      preset: {
        checkInitialItem: false,
        moduleTwo: {
          enabled: true,
          mode: 'alteration',
          enableAugmentation: true,
          affixGroups: [{ id: 'goal', name: '目标', requiredAffixes: ['生命'], selectedAffixes: [], selectedCount: 1 }]
        },
        moduleThree: { enabled: false },
        moduleEldritch: { enabled: false }
      },
      filePaths: { itemInfoFile: 'item.txt', itemInfoResultFile: 'result.json' },
      stashTabSelection: { enabled: false }
    })

    const start = generated.indexOf('def explicit_affix_count(')
    const end = generated.indexOf('def craft_eldritch_implicits(', start)
    assert.ok(start >= 0 && end > start)
    assert.ok(generated.indexOf('def read_current_item(', start) > start)

    const runReadRetry = (scenarios) => runPython(`
import json, os, time
${generated.slice(start, end)}
item_info_result_file = os.devnull
time.sleep = lambda _seconds: None

def run(initial, queue):
    global is_running, fatal_error_reason
    is_running = True
    fatal_error_reason = None
    applied = []
    pending = list(queue)
    reads = 0
    stopped = []
    def apply(currency):
        applied.append(currency)
        return True
    def read(allow_unchanged_text=False):
        nonlocal reads
        reads += 1
        return True
    def wait():
        return pending.pop(0)
    def fail(reason, _code="ITEM_READ_FAILED"):
        global is_running, fatal_error_reason
        fatal_error_reason = reason
        is_running = False
        stopped.append(reason)
        return None
    globals()["apply_currency"] = apply
    globals()["read_clipboard_to_file"] = read
    globals()["wait_for_parse_result"] = wait
    globals()["fail_item_reading"] = fail
    success = craft_affixes(initial)
    return {"success": bool(success), "applied": applied, "reads": reads, "stopped": stopped}

scenarios = json.loads(${JSON.stringify(JSON.stringify(scenarios))})
print(json.dumps([run(entry["initial"], entry["queue"]) for entry in scenarios], ensure_ascii=False))
`)

    const plainSingle = {
      rarity: '魔法',
      affixMatch: false,
      matchedGroupName: '',
      modifiers: [],
      detailedMods: [],
      explicitMods: ['+80 最大生命']
    }
    const matched = {
      rarity: '魔法',
      affixMatch: true,
      matchedGroupName: '目标',
      modifiers: [],
      detailedMods: [],
      explicitMods: ['+80 最大生命']
    }

    const recovered = runReadRetry([{
      initial: plainSingle,
      queue: [
        { error: '等待超时' },
        { ...plainSingle },
        matched
      ]
    }])
    assert.deepEqual(recovered, [
      { success: true, applied: ['alteration', 'augmentation'], reads: 3, stopped: [] }
    ])

    const failed = runReadRetry([{
      initial: plainSingle,
      queue: [
        { error: '等待超时' },
        { error: '等待超时' }
      ]
    }])
    assert.deepEqual(failed, [
      { success: false, applied: ['alteration'], reads: 2, stopped: ['读取当前物品失败：等待超时'] }
    ])
  } finally {
    await server.close()
  }
})

test('改造模式按结构化词缀数在判断前只增幅一次并重新解析', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    const generate = (enableAugmentation, checkInitialItem) => generatePythonScript({
      globalShortcuts: { end: 'Alt+3' },
      currencyPositions: {
        wisdom: { x: 1, y: 1 },
        alteration: { x: 2, y: 2 },
        augmentation: { x: 3, y: 3 },
        transmutation: { x: 4, y: 4 },
        scouring: { x: 5, y: 5 }
      },
      operationDelayMs: 50,
      adaptiveTiming: true,
      fixedTiming: {},
      itemPosition: { x: 30, y: 40 },
      preset: {
        checkInitialItem,
        moduleTwo: {
          enabled: true,
          mode: 'alteration',
          enableAugmentation,
          affixGroups: [{ id: 'goal', name: '目标', requiredAffixes: ['生命'], selectedAffixes: [], selectedCount: 1 }]
        },
        moduleThree: { enabled: false },
        moduleEldritch: { enabled: false }
      },
      filePaths: { itemInfoFile: 'item.txt', itemInfoResultFile: 'result.json' },
      stashTabSelection: { enabled: false }
    })

    const runAffixes = (generated, scenarios) => {
      const start = generated.indexOf('def explicit_affix_count(')
      const end = generated.indexOf('def craft_eldritch_implicits(', start)
      assert.ok(start >= 0 && end > start)
      return runPython(`
import json, os, time
${generated.slice(start, end)}
item_info_result_file = os.devnull
time.sleep = lambda _seconds: None

def run(initial, parsed_results):
    global is_running
    is_running = True
    applied = []
    queue = list(parsed_results)
    reads = 0
    def apply(currency):
        applied.append(currency)
        return True
    def read(allow_unchanged_text=False):
        nonlocal reads
        reads += 1
        return True
    def wait():
        return queue.pop(0)
    globals()["apply_currency"] = apply
    globals()["read_clipboard_to_file"] = read
    globals()["wait_for_parse_result"] = wait
    success = craft_affixes(initial)
    return {"success": bool(success), "applied": applied, "reads": reads, "remaining": len(queue)}

scenarios = json.loads(${JSON.stringify(JSON.stringify(scenarios))})
print(json.dumps([run(entry["initial"], entry["queue"]) for entry in scenarios], ensure_ascii=False))
`)
    }

    const multilineSingle = {
      ...parsedMagicModifier(['物理伤害提高 120%', '+25 最大生命']),
      affixMatch: true,
      matchedGroupName: '目标'
    }
    assert.equal(multilineSingle.modifiers.length, 1)
    assert.equal(multilineSingle.explicitMods.length, 2)
    const plainSingle = {
      rarity: '魔法',
      affixMatch: true,
      matchedGroupName: '目标',
      modifiers: [],
      detailedMods: [],
      explicitMods: ['+80 最大生命']
    }
    const doubleAffix = {
      rarity: '魔法',
      affixMatch: true,
      matchedGroupName: '目标',
      modifiers: [
        { type: 'prefix', lines: ['+80 最大生命'] },
        { type: 'suffix', lines: ['+35% 火焰抗性'] }
      ],
      detailedMods: [
        { type: 'prefix', lines: ['+80 最大生命'] },
        { type: 'suffix', lines: ['+35% 火焰抗性'] }
      ],
      explicitMods: ['+80 最大生命', '+35% 火焰抗性']
    }

    const enabledInitial = runAffixes(generate(true, true), [
      { initial: multilineSingle, queue: [doubleAffix] },
      { initial: plainSingle, queue: [doubleAffix] },
      { initial: doubleAffix, queue: [] },
      { initial: multilineSingle, queue: [{ error: '增幅后解析失败' }, { error: '增幅后解析失败' }] }
    ])
    assert.deepEqual(enabledInitial, [
      { success: true, applied: ['augmentation'], reads: 1, remaining: 0 },
      { success: true, applied: ['augmentation'], reads: 1, remaining: 0 },
      { success: true, applied: [], reads: 0, remaining: 0 },
      { success: false, applied: ['augmentation'], reads: 2, remaining: 0 }
    ])

    const loopSingle = { ...multilineSingle, affixMatch: true }
    assert.deepEqual(runAffixes(generate(true, false), [{
      initial: { ...multilineSingle, affixMatch: false },
      queue: [loopSingle, doubleAffix]
    }]), [
      { success: true, applied: ['alteration', 'augmentation'], reads: 2, remaining: 0 }
    ])

    assert.deepEqual(runAffixes(generate(false, true), [{ initial: multilineSingle, queue: [] }]), [
      { success: true, applied: [], reads: 0, remaining: 0 }
    ])
  } finally {
    await server.close()
  }
})
