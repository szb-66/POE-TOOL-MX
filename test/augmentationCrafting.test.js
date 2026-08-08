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
    def read():
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
      { initial: multilineSingle, queue: [{ error: '增幅后解析失败' }] }
    ])
    assert.deepEqual(enabledInitial, [
      { success: true, applied: ['augmentation'], reads: 1, remaining: 0 },
      { success: true, applied: ['augmentation'], reads: 1, remaining: 0 },
      { success: true, applied: [], reads: 0, remaining: 0 },
      { success: false, applied: ['augmentation'], reads: 1, remaining: 0 }
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
