import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { pythonPath } from './helpers/python.js'
import {
  buildCraftingCurrencyPreflight,
  buildMapCurrencyPreflight
} from '../src/utils/currencyPreflight.js'
import { parseScriptEventLine } from '../electron/modules/python/scriptEvents.js'

const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')
const craftingTemplate = source('../src/assets/scripts/crafting_template.py')
const mapTemplate = source('../src/assets/scripts/map_rolling_template.py')

function block(text, start, end) {
  const from = text.indexOf(start)
  const to = text.indexOf(end, from)
  assert.ok(from >= 0 && to > from, `找不到代码块: ${start} -> ${end}`)
  return text.slice(from, to)
}

function currencyRuntime(template, mode) {
  const coreEnd = mode === 'items' ? 'def apply_currency(' : 'def is_game_foreground('
  const rightEnd = mode === 'items' ? 'def left_click_item(' : 'def apply_currency('
  return [
    block(template, 'CURRENCY_NAMES =', coreEnd),
    block(template, 'def right_click_currency(', rightEnd)
  ].join('\n')
}

function runPreflight(template, mode, scenario) {
  const currencyType = scenario === 'patched' ? 'scouring' : 'alteration'
  const expectedName = currencyType === 'scouring' ? '重铸石' : '改造石'
  const copiedName = scenario === 'wrong' || scenario === 'header-only'
    ? '混沌石'
    : scenario === 'patched'
      ? `${expectedName}[0.4c]`
      : expectedName
  const itemClass = scenario === 'header-only'
    ? `可堆叠通货（${expectedName}）`
    : '可堆叠通货'
  const sequenceChange = scenario !== 'empty'
  const invoke = scenario === 'unverified'
    ? `result = right_click_currency("${currencyType}"); clicks_before_formal = len([e for e in events if e[0] == "click"])`
    : `result = preflight_required_currencies()
clicks_before_formal = len([e for e in events if e[0] == "click"])
if result:
    right_click_currency("${currencyType}")`

  const script = `
import json, types
${currencyRuntime(template, mode)}
events = []
sequence = [10]
is_running = True
fatal_error_reason = None
error_sound_played = False
required_currency_types = ["${currencyType}"]
verified_currency_types = set()
currency_positions = {"${currencyType}": {"x": 11, "y": 22}}
pyperclip = types.SimpleNamespace(paste=lambda: "物品类别: ${itemClass}\\n稀有度: 通货\\n${copiedName}\\n--------\\n堆叠数量: 20/20")
GetClipboardSequenceNumber = lambda: sequence[0]
def move_mouse(x, y): events.append(("move", x, y)); return True
def send_copy_command():
    events.append(("copy",))
    ${sequenceChange ? 'sequence[0] += 1' : 'pass'}
    return True
def release_all_keys(): events.append(("release",))
def play_error_sound(): events.append(("sound",))
def click_mouse(button): events.append(("click", button))
${invoke}
print(json.dumps({
  "result": bool(result),
  "events": events,
  "verified": sorted(verified_currency_types),
  "fatal": fatal_error_reason,
  "clicks_before_formal": clicks_before_formal
}, ensure_ascii=False))
`
  const result = spawnSync(pythonPath, ['-c', script], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

test('物品完整清单覆盖预处理、明确启用步骤并去重', () => {
  assert.deepEqual(buildCraftingCurrencyPreflight({
    moduleTwo: {
      enabled: true,
      mode: 'alteration',
      enableAugmentation: true,
      enableRegal: true
    },
    moduleThree: {
      enabled: true,
      socket: { enabled: true, count: 6 },
      link: { enabled: true, count: 6 },
      color: { enabled: true, red: 3, green: 2, blue: 1 }
    }
  }), [
    'transmutation', 'scouring', 'alteration', 'augmentation', 'regal',
    'jewellers', 'fusing', 'chromic'
  ])

  assert.deepEqual(buildCraftingCurrencyPreflight({
    moduleTwo: {
      enabled: true,
      mode: 'chaos',
      enableExalted: true
    },
    moduleThree: { enabled: false }
  }), ['alchemy', 'scouring', 'chaos', 'exalted'])

  assert.deepEqual(buildCraftingCurrencyPreflight({
    moduleTwo: { enabled: true, mode: 'alchemy' },
    moduleThree: { enabled: false }
  }), ['scouring', 'alchemy'])
})

test('地图完整清单包含知识卷轴和明确启用的瓦尔宝珠', () => {
  assert.deepEqual(buildMapCurrencyPreflight({
    method: 'chaos',
    vaal: { enabled: true }
  }), ['wisdom', 'scouring', 'alchemy', 'chaos', 'vaal'])
  assert.deepEqual(
    buildMapCurrencyPreflight({ method: 'alchemy' }),
    ['wisdom', 'scouring', 'alchemy']
  )
})

for (const [label, template, mode] of [
  ['物品制作', craftingTemplate, 'items'],
  ['地图制作', mapTemplate, 'map']
]) {
  test(`${label}预检成功前零点击，成功后正式入口可点击`, () => {
    const result = runPreflight(template, mode, 'success')
    assert.equal(result.result, true)
    assert.equal(result.clicks_before_formal, 0)
    assert.deepEqual(result.verified, ['alteration'])
    assert.equal(result.events.filter(event => event[0] === 'click').length, 1)
  })

  test(`${label}名称行包含正式名称时通过预检`, () => {
    const result = runPreflight(template, mode, 'patched')
    assert.equal(result.result, true)
    assert.equal(result.clicks_before_formal, 0)
    assert.deepEqual(result.verified, ['scouring'])
    assert.equal(result.events.filter(event => event[0] === 'click').length, 1)
  })

  test(`${label}空位置或错误通货失败关闭且零点击`, () => {
    for (const scenario of ['empty', 'wrong', 'header-only']) {
      const result = runPreflight(template, mode, scenario)
      assert.equal(result.result, false)
      assert.equal(result.clicks_before_formal, 0)
      assert.equal(result.events.some(event => event[0] === 'click'), false)
      assert.equal(result.events.filter(event => event[0] === 'sound').length, 1)
      assert.ok(result.fatal)
    }
  })

  test(`${label}未预检通货在移动和点击前停止`, () => {
    const result = runPreflight(template, mode, 'unverified')
    assert.equal(result.result, false)
    assert.equal(result.events.some(event => event[0] === 'move'), false)
    assert.equal(result.events.some(event => event[0] === 'click'), false)
    assert.match(result.fatal, /未经过本次启动预检/)
  })
}

test('主进程只接受合法的结构化脚本事件', () => {
  assert.deepEqual(parseScriptEventLine(
    'EVENT {"event":"currency-preflight-failed","reason":"需要改造石"}'
  ), {
    event: 'currency-preflight-failed',
    reason: '需要改造石'
  })
  assert.equal(parseScriptEventLine('普通日志'), null)
  assert.equal(parseScriptEventLine('EVENT {bad json}'), null)
})

test('主进程和浮窗接入同一失败原因并保持完成状态互斥', () => {
  const ipc = source('../electron/modules/ipc/python.js')
  assert.match(ipc, /currency-preflight-failed/)
  assert.match(ipc, /runtimeError = scriptEvent\.reason/)
  assert.match(ipc, /status: failed \? 'error' : 'stopped'/)

  const overlay = source('../src/domains/overlay/OverlayView.vue')
  const content = source('../src/domains/overlay/components/OverlayContent.vue')
  assert.match(overlay, /stash-tab-selection-failed/)
  assert.match(overlay, /stopReason\.value = event\.reason/)
  assert.match(overlay, /isCompleted\.value = false/)
  assert.match(content, /class="failure-reason"/)
  assert.match(content, /制作已停止/)
})
