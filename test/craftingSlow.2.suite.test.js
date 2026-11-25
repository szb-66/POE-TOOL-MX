import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { spawnSync as _m0_spawnSync } from 'node:child_process'
import { pythonPath as _m0_pythonPath } from './helpers/python.js'
import { buildCraftingCurrencyPreflight as _m0_buildCraftingCurrencyPreflight, buildMapCurrencyPreflight as _m0_buildMapCurrencyPreflight } from '../src/utils/currencyPreflight.js'
import { parseScriptEventLine as _m0_parseScriptEventLine } from '../electron/modules/python/scriptEvents.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { readFileSync as _m1_readFileSync } from 'node:fs'
import _m1_path from 'node:path'
import { spawnSync as _m1_spawnSync } from 'node:child_process'
import { createServer as _m1_createServer } from 'vite'
import { pythonPath as _m1_pythonPath } from './helpers/python.js'
import { CraftingDataRepository as _m1_CraftingDataRepository } from '../electron/modules/crafting/dataRepository.js'
import { CraftingService as _m1_CraftingService } from '../electron/modules/crafting/service.js'
import { matchEldritchImplicits as _m1_matchEldritchImplicits } from '../electron/modules/item/matcher.js'
import { parseItemInfo as _m1_parseItemInfo } from '../electron/modules/item/parser.js'
import { eldritchCurrencyType as _m1_eldritchCurrencyType, normalizeEldritchModule as _m1_normalizeEldritchModule } from '../src/domains/items/eldritchConfig.js'
import { buildCraftingCurrencyPreflight as _m1_buildCraftingCurrencyPreflight } from '../src/utils/currencyPreflight.js'
import { validateCraftingConfig as _m1_validateCraftingConfig } from '../src/utils/validation.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { readFileSync as _m2_readFileSync, mkdtempSync as _m2_mkdtempSync, rmSync as _m2_rmSync } from 'node:fs'
import _m2_path from 'node:path'
import _m2_os from 'node:os'
import { EventEmitter as _m2_EventEmitter } from 'node:events'
import _m2_vm from 'node:vm'
import { spawnSync as _m2_spawnSync } from 'node:child_process'
import { LocalizationRuntime as _m2_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { parseItemInfo as _m2_parseItemInfo } from '../electron/modules/item/parser.js'
import * as _m2_matcher from '../electron/modules/item/matcher.js'
import { buildCraftingAffixPayload as _m2_buildCraftingAffixPayload } from '../electron/modules/item/craftingAffixPayload.js'
import { ItemFootprintRegistry as _m2_ItemFootprintRegistry, loadServerFootprintCatalog as _m2_loadServerFootprintCatalog } from '../electron/modules/items/footprintRegistry.js'
import { mapStatVariants as _m2_mapStatVariants } from './fixtures/internationalMapStatVariants.js'
import { ATLAS_MAP_BANDS as _m2_ATLAS_MAP_BANDS } from '../shared/mapItemClasses.js'
import { pythonPath as _m2_pythonPath } from './helpers/python.js'
import { FileWatcher as _m2_FileWatcher } from '../electron/modules/watcher/fileWatcher.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { readFileSync as _m3_readFileSync } from 'node:fs'
import { spawnSync as _m3_spawnSync } from 'node:child_process'
import { createServer as _m3_createServer } from 'vite'
import { pythonPath as _m3_pythonPath } from './helpers/python.js'
import { normalizeItemTextLanguage as _m3_normalizeItemTextLanguage } from '../shared/itemTextLanguage.js'
import { parseItemInfo as _m3_parseItemInfo } from '../electron/modules/item/parser.js'
import { parseItemInfo as _m3_parseFrontendItem } from '../src/utils/clipboard.js'
import { matchAffixes as _m3_matchAffixes, matchMapRequirements as _m3_matchMapRequirements, matchMapTerm as _m3_matchMapTerm } from '../electron/modules/item/matcher.js'
import { currencyExpectedNames as _m3_currencyExpectedNames, buildCraftingCurrencyPreflight as _m3_buildCraftingCurrencyPreflight } from '../src/utils/currencyPreflight.js'
import { generatePythonScript as _m3_generatePythonScript, generateMapRollingScript as _m3_generateMapRollingScript } from '../src/utils/pythonScriptGenerator.js'
import { cleanMigratedMapConfig as _m3_cleanMigratedMapConfig, INTERNATIONAL_MAP_BASE_STATS as _m3_INTERNATIONAL_MAP_BASE_STATS } from '../src/utils/mapPresetMigration.js'
import { analyzeMapFeasibility as _m3_analyzeMapFeasibility } from '../src/domains/map/mapFeasibility.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { readFileSync as _m4_readFileSync } from 'node:fs'
import { createHash as _m4_createHash } from 'node:crypto'
import { spawnSync as _m4_spawnSync } from 'node:child_process'
import { generatePythonScript as _m4_generatePythonScript } from '../src/utils/pythonScriptGenerator.js'
import { LocalizationRuntime as _m4_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { pythonPath as _m4_pythonPath } from './helpers/python.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { readFile as _m5_readFile } from 'node:fs/promises'
import { createSSRApp as _m5_createSSRApp } from 'vue'
import { renderToString as _m5_renderToString } from '@vue/server-renderer'
import { createPinia as _m5_createPinia, setActivePinia as _m5_setActivePinia } from 'pinia'
import { createServer as _m5_createServer } from 'vite'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { readFileSync as _m6_readFileSync } from 'node:fs'
import { spawnSync as _m6_spawnSync } from 'node:child_process'
import { createServer as _m6_createServer } from 'vite'
import { createPinia as _m6_createPinia, setActivePinia as _m6_setActivePinia } from 'pinia'
import { pythonPath as _m6_pythonPath } from './helpers/python.js'
import { usePresetStore as _m6_usePresetStore } from '../src/stores/preset.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { fileURLToPath as _m7_fileURLToPath } from 'node:url'
import { parseItemInfo as _m7_parseItemInfo } from '../electron/modules/item/parser.js'
import { parseItemInfo as _m7_parseFrontendItem } from '../src/utils/clipboard.js'
import { parseBagItemHeader as _m7_parseBagItemHeader } from '../src/utils/bagConfig.js'
import { normalizeItemTextLanguage as _m7_normalizeItemTextLanguage } from '../shared/itemTextLanguage.js'
import { runPython as _m7_runPython } from './helpers/python.js'

// === Merged from currencyPreflight.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const spawnSync = _m0_spawnSync
  const pythonPath = _m0_pythonPath
  const buildCraftingCurrencyPreflight = _m0_buildCraftingCurrencyPreflight
  const buildMapCurrencyPreflight = _m0_buildMapCurrencyPreflight
  const parseScriptEventLine = _m0_parseScriptEventLine
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
  const coreEnd = mode === 'items' ? 'def move_mouse(' : 'def get_slot_position('
  return block(template, 'CURRENCY_NAMES =', coreEnd)
}

function runPreflight(template, mode, scenario) {
  const currencyType = scenario === 'patched'
    ? 'scouring'
    : scenario === 'same-text'
      ? 'wisdom'
      : 'alteration'
  const expectedName = currencyType === 'scouring'
    ? '重铸石'
    : currencyType === 'wisdom'
      ? '知识卷轴'
      : '改造石'
  const copiedName = scenario === 'wrong' || scenario === 'header-only'
    ? '混沌石'
    : scenario === 'patched'
      ? `${expectedName}[0.4c]`
      : expectedName
  const itemClass = scenario === 'header-only'
    ? `可堆叠通货（${expectedName}）`
    : '可堆叠通货'
  const sequenceChange = scenario !== 'empty'
  const formalCall = mode === 'items'
    ? `apply_currency("${currencyType}")`
    : `apply_currency("${currencyType}", 30, 40)`
  const invoke = scenario === 'unverified'
    ? `result = ${formalCall}; clicks_before_formal = len([e for e in events if e[0] == "click"])`
    : `result = preflight_required_currencies()
clicks_before_formal = len([e for e in events if e[0] == "click"])
if result:
    ${formalCall}`

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
item_position = {"x": 30, "y": 40}
pyperclip = types.SimpleNamespace(paste=lambda: "物品类别: ${itemClass}\\n稀有度: 通货\\n${copiedName}\\n--------\\n堆叠数量: 20/20")
GetClipboardSequenceNumber = lambda: sequence[0]
def move_mouse(x, y): events.append(("move", x, y)); return True
def click_mouse(button):
    if button == "left": events.append(("click", button))
    return True
def record_currency_usage(_currency): pass
def right_click_currency(currency):
    if currency not in verified_currency_types:
        return fail_currency_preflight(currency, f"{expectedName}未经过本次启动预检，已在点击前停止")
    pos = currency_positions[currency]
    return move_mouse(int(pos["x"]), int(pos["y"])) and click_mouse("right")
def capture_clipboard_evidence():
    events.append(("copy", True))
    if not ${sequenceChange ? 'True' : 'False'}:
        return {"ok": False, "status": "no-clipboard-event", "sequenceChanged": False}
    sequence[0] += 1
    return {
        "ok": True,
        "status": "captured",
        "text": pyperclip.paste(),
        "sequenceChanged": True,
        "sameAsBefore": "${scenario}" == "same-text"
    }
def send_copy_command(*_args, **_kwargs):
    evidence = capture_clipboard_evidence()
    return evidence.get("text") if evidence.get("ok") and evidence.get("sequenceChanged") else False
def release_all_keys(): events.append(("release",))
def release_shift_if_held(): events.append(("release-shift",))
def play_error_sound(): events.append(("sound",))
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
  const lines = result.stdout.trim().split(/\r?\n/)
  return {
    ...JSON.parse(lines.at(-1)),
    scriptEvents: lines.map(parseScriptEventLine).filter(Boolean)
  }
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
    'wisdom', 'transmutation', 'scouring', 'alteration', 'augmentation', 'regal',
    'jewellers', 'fusing', 'chromic'
  ])

  assert.deepEqual(buildCraftingCurrencyPreflight({
    moduleTwo: {
      enabled: true,
      mode: 'chaos',
      enableExalted: true
    },
    moduleThree: { enabled: false }
  }), ['wisdom', 'alchemy', 'scouring', 'chaos', 'exalted'])

  assert.deepEqual(buildCraftingCurrencyPreflight({
    moduleTwo: { enabled: true, mode: 'alchemy' },
    moduleThree: { enabled: false }
  }), ['wisdom', 'scouring', 'alchemy'])
})

test('预检沿用 1.2.2 剪贴板确认并允许序列号变化后的同文本', () => {
  for (const template of [craftingTemplate, mapTemplate]) {
    assert.match(template, /clipboard_text = send_copy_command\(/)
    assert.match(template, /allow_unchanged_text=True/)
    assert.match(template, /if sequence_after == sequence_before:/)
    assert.match(template, /header = copied_item_header\(clipboard_text\)/)
  }
})

test('地图完整清单包含知识卷轴和明确启用的崇高石与瓦尔宝珠', () => {
  assert.deepEqual(buildMapCurrencyPreflight({
    method: 'chaos',
    exalted: { enabled: true },
    vaal: { enabled: true }
  }), ['wisdom', 'scouring', 'alchemy', 'chaos', 'exalted', 'vaal'])
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

  test(`${label}预检接受序列号变化后的同文本复制`, () => {
    const result = runPreflight(template, mode, 'same-text')
    assert.equal(result.result, true)
    assert.deepEqual(result.verified, ['wisdom'])
    assert.deepEqual(result.events.find(event => event[0] === 'copy'), ['copy', true])
    assert.equal(result.clicks_before_formal, 0)
  })

  test(`${label}空位置或错误通货失败关闭且零点击`, () => {
    for (const scenario of ['empty', 'wrong', 'header-only']) {
      const result = runPreflight(template, mode, scenario)
      assert.equal(result.result, false)
      assert.equal(result.clicks_before_formal, 0)
      assert.equal(result.events.some(event => event[0] === 'click'), false)
      assert.equal(result.events.filter(event => event[0] === 'sound').length, 1)
      assert.ok(result.fatal)
      const event = result.scriptEvents.find(item => item.event === 'currency-preflight-failed')
      assert.equal(event.configurationIssueId, 'currency.alteration')
      assert.equal(event.failureCode, scenario === 'empty' ? 'CURRENCY_NOT_FOUND' : 'CURRENCY_TYPE_MISMATCH')
    }
  })

  test(`${label}未预检通货在移动和点击前停止`, () => {
    const result = runPreflight(template, mode, 'unverified')
    assert.equal(result.result, false)
    assert.equal(result.events.some(event => event[0] === 'move'), false)
    assert.equal(result.events.some(event => event[0] === 'click'), false)
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
})()

// === Merged from eldritchAutomation.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const readFileSync = _m1_readFileSync
  const path = _m1_path
  const spawnSync = _m1_spawnSync
  const createServer = _m1_createServer
  const pythonPath = _m1_pythonPath
  const CraftingDataRepository = _m1_CraftingDataRepository
  const CraftingService = _m1_CraftingService
  const matchEldritchImplicits = _m1_matchEldritchImplicits
  const parseItemInfo = _m1_parseItemInfo
  const eldritchCurrencyType = _m1_eldritchCurrencyType
  const normalizeEldritchModule = _m1_normalizeEldritchModule
  const buildCraftingCurrencyPreflight = _m1_buildCraftingCurrencyPreflight
  const validateCraftingConfig = _m1_validateCraftingConfig
const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')
const builtinRoot = path.resolve('electron/assets/crafting-data')

test('古灵配置规范化来源、T1–T4 和多目标去重', () => {
  const normalized = normalizeEldritchModule({
    enabled: true,
    source: 'eater',
    tier: 9,
    targets: [
      { familyId: 'eater:a', displayName: '目标 A', effectPattern: '效果提高 #%' },
      { familyId: 'eater:a', displayName: '重复 A', effectPattern: '效果提高 #%' },
      { familyId: '', effectPattern: '无效' }
    ]
  })
  assert.equal(normalized.enabled, true)
  assert.equal(normalized.source, 'eater')
  assert.ok(normalized.targets.every((target) => target.source === 'eater'))
  assert.equal(normalized.tier, 1)
  assert.equal(normalized.targets.length, 1)
  assert.equal(normalized.targets[0].displayName, '重复 A')
})

test('八种模式和等级映射到唯一直接古灵通货并加入预检', () => {
  const expected = {
    exarch: ['lesser-eldritch-ember', 'greater-eldritch-ember', 'grand-eldritch-ember', 'exceptional-eldritch-ember'],
    eater: ['lesser-eldritch-ichor', 'greater-eldritch-ichor', 'grand-eldritch-ichor', 'exceptional-eldritch-ichor']
  }
  for (const sourceName of ['exarch', 'eater']) {
    for (let tier = 1; tier <= 4; tier += 1) {
      const moduleEldritch = { enabled: true, source: sourceName, tier, targets: [] }
      assert.equal(eldritchCurrencyType(moduleEldritch), expected[sourceName][tier - 1])
      assert.deepEqual(buildCraftingCurrencyPreflight({ moduleEldritch }), [expected[sourceName][tier - 1]])
    }
  }
})

test('古灵启动校验要求目标、互斥模块和所选通货坐标', () => {
  const base = {
    itemPosition: { x: 100, y: 100 },
    currencyPositions: { 'grand-eldritch-ichor': { x: 20, y: 30 } },
    preset: {
      moduleTwo: { enabled: false },
      moduleThree: { enabled: false },
      moduleEldritch: {
        enabled: true,
        source: 'eater',
        tier: 3,
        targets: [{ familyId: 'eater:a', displayName: '目标', effectPattern: '效果 #%' }]
      }
    }
  }
  assert.equal(validateCraftingConfig(base).isValid, true)
  assert.doesNotMatch(validateCraftingConfig(base).errors.join('\n'), /知识卷轴/)
  assert.match(validateCraftingConfig({ ...base, currencyPositions: {} }).errors.join('\n'), /上级古灵溶液/)
  assert.match(validateCraftingConfig({
    ...base,
    preset: { ...base.preset, moduleTwo: { enabled: true }, moduleEldritch: { ...base.preset.moduleEldritch, targets: [] } }
  }).errors.join('\n'), /不能与显式词缀|至少需要选择一个目标/)
})

test('古灵 matcher 只检查隐式、忽略数值并按任一目标完成', () => {
  const targets = [
    { familyId: 'exarch:a', displayName: '攻击速度', effectPattern: '攻击速度加快 #%'},
    { familyId: 'exarch:b', displayName: '火焰抗性', effectPattern: '火焰抗性提高 #%'}
  ]
  const explicitOnly = {
    implicitMods: ['最大生命提高 7%'],
    explicitMods: ['攻击速度加快 12%'],
    modifiers: [{ type: 'prefix', text: '攻击速度加快 12%' }]
  }
  assert.equal(matchEldritchImplicits(explicitOnly, targets).isMatch, false)
  const matched = matchEldritchImplicits({
    ...explicitOnly,
    implicitMods: ['攻击速度加快 17%'],
    modifiers: [{ type: 'implicit', text: '攻击速度加快 17%' }]
  }, targets)
  assert.equal(matched.isMatch, true)
  assert.equal(matched.matchedTargetName, '攻击速度')
  assert.equal(matched.matchedText, '攻击速度加快 17%')
})

test('详细中文装备中的多行基底隐式按完整效果精确匹配', () => {
  const item = parseItemInfo(`物品类别: 头部
稀 有 度: 稀有
余烬之冠
梦魇战盔
--------
物品等级: 86
--------
{ 基底属性 — 攻击, 速度 }
攻击击中时有 17% 的几率获得猛攻
攻击速度加快 9%
--------
{ 后缀属性 "炽烈之" (等阶：2) — 攻击, 速度 }
攻击击中时有 17% 的几率获得猛攻
攻击速度加快 9%`)
  const target = {
    familyId: 'exarch:multiline',
    displayName: '猛攻与攻击速度',
    effectPattern: '攻击击中时有 #% 的几率获得猛攻\n攻击速度加快 #%'
  }
  const matched = matchEldritchImplicits(item, [target])
  assert.equal(item.category, '头部')
  assert.equal(matched.isMatch, true)
  assert.equal(matched.matchedTargetName, '猛攻与攻击速度')
  assert.equal(matched.matchedText, '攻击击中时有 17% 的几率获得猛攻\n攻击速度加快 9%')
})

test('天然基底隐式与古灵目标重叠时不误判，真实古灵副本仍可命中', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  await repository.initialize()
  const cases = [
    ['飞羽便鞋', '移动速度加快 10%', '移动速度加快 #%'],
    ['逃亡之靴', '+15% 混沌抗性', '+#% 混沌抗性'],
    ['星芒战铠', '+10% 所有元素抗性', '+#% 所有元素抗性'],
    ['黄金战甲', '+20% 所有元素抗性', '+#% 所有元素抗性']
  ]
  for (const [baseName, rolledText, effectPattern] of cases) {
    const base = repository.getDataset().bases.find((entry) => entry.name === baseName)
    const target = [{ familyId: `target:${baseName}`, source: 'exarch', displayName: '目标', effectPattern }]
    const naturalBaseImplicitTexts = CraftingService.prototype.naturalBaseImplicitTexts.call({ repository }, baseName)
    assert.deepEqual(naturalBaseImplicitTexts, base.implicitModifiers.map((implicit) => implicit.text))
    const options = { naturalBaseImplicitTexts }
    assert.equal(matchEldritchImplicits({ implicitMods: [rolledText] }, target, options).isMatch, false, baseName)
    assert.equal(matchEldritchImplicits({ implicitMods: [rolledText, rolledText] }, target, options).isMatch, true, baseName)
  }
})

test('真实古灵目录按来源和 T1–T4 正权重返回稳定目标', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  await repository.initialize()
  const exarch = repository.searchEldritchImplicitSuggestions({ source: 'exarch', tier: 3, query: '', limit: 100 })
  const eater = repository.searchEldritchImplicitSuggestions({ source: 'eater', tier: 3, query: '', limit: 100 })
  assert.ok(exarch.total > 0 && eater.total > 0)
  assert.ok(exarch.items.every((item) => item.source === 'exarch' && item.tier === 3 && item.familyId && item.effectPattern && item.applicableLabel))
  assert.ok(eater.items.every((item) => item.source === 'eater' && item.tier === 3))
  assert.equal(exarch.items.some((left) => eater.items.some((right) => left.familyId === right.familyId)), false)
})

test('界面、IPC、设置和脚本接入古灵自动制作与安全外链', () => {
  const items = source('../src/domains/items/ItemsView.vue')
  const moduleOne = source('../src/domains/items/components/ModuleOne.vue')
  const moduleEldritch = source('../src/domains/items/components/ModuleEldritch.vue')
  const environmentDefaults = source('../src/utils/environmentDefaults.js')
  const generator = source('../src/utils/pythonScriptGenerator.js')
  const template = source('../src/assets/scripts/crafting_template.py')
  const preload = source('../electron/preload.cjs')
  const rendererApi = source('../src/api/electron.js')
  const ipc = source('../electron/modules/ipc/crafting.js')
  const fileIpc = source('../electron/modules/ipc/file.js')

  assert.match(items, /ModuleEldritch/)
  assert.match(moduleEldritch, /multiple[\s\S]*remote[\s\S]*searchEldritchImplicitSuggestions/)
  assert.match(moduleOne, /:href="`https:\/\/poedb\.tw\/\$\{currentServer\.id === 'international' \? 'us' : 'cn'\}\/Modifiers`"/)
  assert.match(moduleOne, /target="_blank"/)
  assert.match(moduleOne, /rel="noopener noreferrer"/)
  for (const key of [
    'lesser-eldritch-ember', 'greater-eldritch-ember', 'grand-eldritch-ember', 'exceptional-eldritch-ember',
    'lesser-eldritch-ichor', 'greater-eldritch-ichor', 'grand-eldritch-ichor', 'exceptional-eldritch-ichor'
  ]) assert.match(environmentDefaults, new RegExp(key))
  assert.match(generator, /generateEldritchCraftingLogic/)
  assert.match(generator, /eldritchImplicitMatch/)
  assert.match(template, /ENABLE_ELDRITCH/)
  assert.match(template, /ELDRITCH_CRAFTING_FUNC/)
  assert.match(preload, /searchCraftingEldritchImplicitSuggestions/)
  assert.match(rendererApi, /searchEldritchImplicitSuggestions/)
  assert.match(ipc, /crafting-search-eldritch-implicit-suggestions/)
  assert.match(fileIpc, /getMainWindow/)
  assert.match(fileIpc, /mainWindow\.webContents\.send\('update-overlay'/)
  assert.match(fileIpc, /naturalBaseImplicitTexts/)
})

test('生成的古灵流程初始命中与非法底材零消耗，重骰命中只使用一次通货', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    const config = {
      globalShortcuts: { end: 'Alt+3' },
      currencyPositions: { 'grand-eldritch-ember': { x: 10, y: 20 } },
      operationDelayMs: 50,
      adaptiveTiming: true,
      fixedTiming: {},
      itemPosition: { x: 30, y: 40 },
      preset: {
        checkInitialItem: true,
        moduleTwo: { enabled: false },
        moduleThree: { enabled: false },
        moduleEldritch: {
          enabled: true,
          source: 'exarch',
          tier: 3,
          targets: [{ familyId: 'exarch:a', displayName: '目标', effectPattern: '攻击速度加快 #%'}]
        }
      },
      filePaths: { itemInfoFile: 'item.txt', itemInfoResultFile: 'result.json' },
      stashTabSelection: { enabled: false }
    }
    const script = generatePythonScript(config)
    assert.equal(script.includes('{{'), false)
    assert.match(script, /eldritch_enabled = True[\s\S]*prepare_item_for_crafting\(identify_unidentified=not eldritch_enabled\)/)
    const helperStart = script.indexOf('def fail_item_runtime(')
    const helperEnd = script.indexOf('def fail_item_preparation(', helperStart)
    const start = script.indexOf('def fail_eldritch_crafting(')
    const end = script.indexOf('def craft_sockets(', start)
    assert.ok(helperStart >= 0 && helperEnd > helperStart && start >= 0 && end > start)
    const helperBlock = script.slice(helperStart, helperEnd)
    const block = script.slice(start, end)
    const harness = `
import json, os, time
${helperBlock}
${block}
item_position = {"x": 1, "y": 2}
item_info_result_file = os.devnull
def move_mouse(x, y): return True
def read_clipboard_to_file(allow_unchanged_text=False, **_kwargs): return True
def release_all_keys(): pass
def play_error_sound(): pass

def run(results):
    global is_running, fatal_error_reason, result_queue, apply_count
    is_running = True
    fatal_error_reason = None
    result_queue = list(results)
    apply_count = 0
    def wait(_request_id=None): return result_queue.pop(0)
    def apply(currency):
        global apply_count
        apply_count += 1
        return currency == "grand-eldritch-ember"
    globals()["wait_for_parse_result"] = wait
    globals()["apply_currency"] = apply
    initial_result = result_queue.pop(0)
    success = craft_eldritch_implicits(initial_result)
    return {"success": bool(success), "applyCount": apply_count, "fatal": fatal_error_reason}

valid = {"category":"头部", "rarity":"稀有", "isLegendary":False, "isCorrupted":False, "influences":[]}
print(json.dumps({
  "initial": run([{**valid, "eldritchImplicitMatch":True, "matchedEldritchTargetName":"目标"}]),
  "invalid": run([{"category":"戒指", "isLegendary":False, "isCorrupted":False, "influences":[]}]),
  "rolled": run([{**valid, "eldritchImplicitMatch":False}, {**valid, "eldritchImplicitMatch":True, "matchedEldritchTargetName":"目标"}])
}, ensure_ascii=False))
`
    const executed = spawnSync(pythonPath, ['-c', harness], {
      encoding: 'utf8',
      env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
    })
    assert.equal(executed.status, 0, executed.stderr)
    const result = JSON.parse(executed.stdout.trim().split(/\r?\n/).at(-1))
    assert.deepEqual(result.initial, { success: true, applyCount: 0, fatal: null })
    assert.equal(result.invalid.success, false)
    assert.equal(result.invalid.applyCount, 0)
    assert.match(result.invalid.fatal, /只能用于头盔/)
    assert.deepEqual(result.rolled, { success: true, applyCount: 1, fatal: null })

    const unprotectedScript = generatePythonScript({
      ...config,
      preset: { ...config.preset, checkInitialItem: false }
    })
    const unprotectedStart = unprotectedScript.indexOf('def fail_eldritch_crafting(')
    const unprotectedEnd = unprotectedScript.indexOf('def craft_sockets(', unprotectedStart)
    const unprotected = spawnSync(pythonPath, ['-c', `
import json, os, time
${helperBlock}
${unprotectedScript.slice(unprotectedStart, unprotectedEnd)}
is_running = True
fatal_error_reason = None
item_info_result_file = os.devnull
apply_count = 0
def release_all_keys(): pass
def play_error_sound(): pass
def apply_currency(currency):
    global apply_count
    apply_count += 1
    return True
def read_clipboard_to_file(allow_unchanged_text=False, **_kwargs): return True
def wait_for_parse_result(_request_id=None):
    return {"category":"头部", "rarity":"稀有", "isLegendary":False, "isCorrupted":False, "influences":[], "eldritchImplicitMatch":True}
time.sleep = lambda _seconds: None
initial = {"category":"头部", "isLegendary":False, "isCorrupted":False, "influences":[], "eldritchImplicitMatch":True}
success = craft_eldritch_implicits(initial)
print(json.dumps({"success": bool(success), "applyCount": apply_count}, ensure_ascii=False))
`], {
      encoding: 'utf8',
      env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
    })
    assert.equal(unprotected.status, 0, unprotected.stderr)
    assert.deepEqual(JSON.parse(unprotected.stdout.trim().split(/\r?\n/).at(-1)), { success: true, applyCount: 1 })
  } finally {
    await server.close()
  }
})
})()

// === Merged from internationalCraftingFileReplay.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const readFileSync = _m2_readFileSync
  const mkdtempSync = _m2_mkdtempSync
  const rmSync = _m2_rmSync
  const path = _m2_path
  const os = _m2_os
  const EventEmitter = _m2_EventEmitter
  const vm = _m2_vm
  const spawnSync = _m2_spawnSync
  const LocalizationRuntime = _m2_LocalizationRuntime
  const parseItemInfo = _m2_parseItemInfo
  const matcher = _m2_matcher
  const buildCraftingAffixPayload = _m2_buildCraftingAffixPayload
  const ItemFootprintRegistry = _m2_ItemFootprintRegistry
  const loadServerFootprintCatalog = _m2_loadServerFootprintCatalog
  const mapStatVariants = _m2_mapStatVariants
  const ATLAS_MAP_BANDS = _m2_ATLAS_MAP_BANDS
  const pythonPath = _m2_pythonPath
  const FileWatcher = _m2_FileWatcher
const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
const bases = JSON.parse(source('test/fixtures/crafting-localization-bases.json'))
function replayHarness(watcher = new EventEmitter()) {
  let revision = 'current-managed', result
  const registry = new ItemFootprintRegistry(loadServerFootprintCatalog({ serverId: 'international' }))
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => [...bases, ...mapStatVariants], revision: () => revision,
    baseNames: () => Object.keys(registry.snapshot().items).map(key => key.split('\u001f')[1]).filter(Boolean) })
  if (!watcher.getFilePaths) watcher.getFilePaths = () => ({ itemInfoResultFile: 'memory-result' })
  const handlers = new Map()
  const watcherSource = source('electron/modules/watcher/fileWatcher.js')
  const attach = vm.runInNewContext(watcherSource.slice(watcherSource.indexOf('export function attachParseRequestId'), watcherSource.indexOf('export class FileWatcher')).replace('export ', '') + '\nattachParseRequestId')
  const context = {
    ...matcher, parseItemInfo, buildCraftingAffixPayload, attachParseRequestId: attach,
    ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
    fs: { existsSync: () => false, writeFileSync: (_, content) => { result = JSON.parse(content) } },
    itemFootprintRegistry: registry
  }
  const handlerSource = source('electron/modules/ipc/file.js').replace(/^import .*$/gm, '').replace('export function registerFileHandlers', 'function registerFileHandlers')
  const register = vm.runInNewContext(handlerSource + '\nregisterFileHandlers', context)
  register(watcher, {}, {}, { getOverlayWindow: () => null, getMainWindow: () => null }, null, runtime)
  return {
    getPaths: () => handlers.get('get-file-paths')(),
    read(text, config) { result = undefined; watcher.emit('fileChanged', text, { ...config, localizationRevision: 'current-managed' }, 'replay-request'); return result },
    invalidate() { revision = 'new-managed' }
  }
}

test('真实 FileWatcher 经 IPC 获取路径与解析回写时保留实例，并跟随当前服务器目录', async t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'file-paths-ipc-'))
  const watcher = new FileWatcher(path.join(root, 'cn'))
  t.after(() => {
    watcher.stopFileWatcher()
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()))
    rmSync(root, { recursive: true, force: true })
  })
  const replay = replayHarness(watcher)
  for (const directory of [path.join(root, 'cn'), path.join(root, 'international')]) {
    watcher.configureDirectory(directory)
    assert.deepEqual(await replay.getPaths(), watcher.getFilePaths())
    const result = replay.read(mapText('Map', 'en', ['Rare Monsters each have 1 additional Modifier']),
      { map: { targetKind: 'atlas', match: {} } })
    assert.ok(result, '解析结果必须成功回写')
    assert.equal(result.error, undefined)
    assert.equal(result.requestId, 'replay-request')
  }
})
const mapText = (name, locale, mods, band = 'Low') => {
  const entry = bases.find(entry => entry.en === name)
  const base = entry[locale] || entry.tw || entry.en
  const header = locale === 'en' ? `Item Class: Maps (${band})\nRarity: Rare\nDoom Domain` : locale === 'cn' ? `物品类别: 异界地图(${band})\n稀有度: 稀有\n灾厄之域` : `物品種類: 異界地圖(${band})\n稀有度: 稀有\n災厄之域`
  const properties = locale === 'en' ? 'Item Tier: 5\nItem Level: 84' : locale === 'cn' ? '物品阶级: 5\n物品等级: 84' : '物品階級: 5\n物品等級: 84'
  return `${header}\n${base}\n--------\n${properties}\n--------\n${mods.map(mod => `{ Prefix Modifier "Fixture" (Tier: 1) }\n${mod}`).join('\n')}`
}

test('真实fileChanged业务回放将Low/Mid/Top/Uber四语地图结果原样交给Python黑名单与统计', () => {
  const replay = replayHarness(), results = []
  const blacklist = ['Rare Monsters each have # additional Modifiers', 'Monsters reflect #% of Physical Damage']
  for (const band of ATLAS_MAP_BANDS) for (const name of ['Map', 'Nightmare Map']) for (const locale of ['en', 'cn', 'tw', 'mixed']) for (const quantity of [1, 2]) {
    const language = locale === 'mixed' ? 'en' : locale
    const mods = (locale === 'en' ? [`Rare Monsters each have ${quantity} additional Modifier${quantity === 1 ? '' : 's'}`, 'Monsters reflect 18% of Physical Damage']
      : locale === 'tw' ? [`每個稀有怪物有 ${quantity} 個額外詞綴`, '怪物反射 18% 物理傷害']
        : [`每个稀有怪物额外具有 ${quantity} 个词缀`, '怪物会反射 18% 物理伤害'])
    const text = mapText(name, language, mods, band)
    const result = replay.read(text, { map: { targetKind: 'atlas', match: { blacklist } } })
    assert.equal(result.error, undefined, JSON.stringify(result))
    assert.equal(result.requestId, 'replay-request')
    assert.equal(result.originalText, text)
    assert.equal(result.displayName, locale === 'en' || locale === 'mixed' ? 'Doom Domain' : locale === 'cn' ? '灾厄之域' : '災厄之域')
    const base = bases.find(entry => entry.en === name)
    assert.equal(result.displayBaseName, language === 'en' ? name : base[language] || base.tw || base.en)
    assert.deepEqual(result.displayExplicitMods, mods)
    assert.equal(result.baseName, name)
    assert.equal(result.category, '异界地图')
    assert.equal(result.footprint.width, 1)
    assert.equal(result.footprint.height, 1)
    assert.equal(result.mapMatch, false)
    assert.equal(result.explicitMods.length, 2)
    assert.equal(result.itemTier, 5)
    results.push(result)
  }
  const template = source('src/assets/scripts/map_rolling_template.py')
  const helpers = template.slice(template.indexOf('def map_term_matches('), template.indexOf('def check_map_requirements('))
  const code = `import json,sys\n${helpers}\nmap_config={'match':{'blacklist':${JSON.stringify(blacklist)},'whitelist':[]}}\nprint(json.dumps([[check_map_mods(item),count_affix_stats(item)] for item in json.load(sys.stdin)]))`
  const python = spawnSync(pythonPath, ['-c', code], { input: JSON.stringify(results), encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', PYTHONDONTWRITEBYTECODE: '1' } })
  assert.equal(python.status, 0, python.stderr)
  for (const [passed, stats] of JSON.parse(python.stdout.trim().split(/\r?\n/).at(-1))) {
    assert.equal(passed, false)
    assert.deepEqual(stats, [Object.fromEntries(blacklist.map(term => [term, 1])), {}])
  }
})

test('魔法地图英文修饰名与汉化名称都保留规范底材，已知占位可用于批量', () => {
  const replay = replayHarness()
  const mod = 'Rare Monsters each have 1 additional Modifier'
  const english = mapText('Map', 'en', [mod]).replace('Rarity: Rare\nDoom Domain\nMap', 'Rarity: Magic\nSavage Map of Congealment')
  const translatedBase = bases.find(entry => entry.en === 'Map').tw
  const traditional = mapText('Map', 'tw', ['每個稀有怪物有 1 個額外詞綴']).replace(`稀有度: 稀有\n災厄之域\n${translatedBase}`, `稀有度: 魔法\n兇猛的${translatedBase}`)
  for (const text of [english, traditional]) {
    const result = replay.read(text, { map: { targetKind: 'atlas', match: {} } })
    assert.equal(result.error, undefined, JSON.stringify(result))
    assert.equal(result.baseName.toLowerCase(), 'map')
    assert.equal(result.footprint.width, 1)
    assert.equal(result.footprint.height, 1)
  }
  const legacy = mapText('Strand Map', 'en', [mod]).replace('Rarity: Rare\nDoom Domain\nStrand Map', 'Rarity: Magic\nSavage Strand Map of Congealment')
  const result = replay.read(legacy, { map: { targetKind: 'atlas', match: {} } })
  assert.equal(result.baseName, 'Strand Map')
  assert.equal(result.footprint, null, '可识别身份不代表已有可靠尺寸，不猜为通用Map')
})

test('真实fileChanged链路对未知词缀及运行中换词库返回错误，不输出可制作结果', () => {
  const replay = replayHarness(), config = { map: { targetKind: 'atlas', match: {} } }
  const text = mapText('Fortress Map', 'tw', ['怪物反射 18% 物理傷害'])
  assert.equal(replay.read(text, config).error, undefined)
  const unknown = replay.read(text.replace('物理傷害', '未知傷害'), config)
  assert.match(unknown.error, /未匹配/)
  assert.equal(unknown.errorCode, 'LOCALIZATION_UNRESOLVED')
  replay.invalidate()
  const result = replay.read(text, config)
  assert.match(result.error, /汉化资源已更改/)
  assert.equal(result.errorCode, 'LOCALIZATION_CHANGED')
  assert.equal(result.mapMatch, undefined)
  assert.equal(result.affixMatch, undefined)
})
})()

// === Merged from internationalCraftingRuntime.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const readFileSync = _m3_readFileSync
  const spawnSync = _m3_spawnSync
  const createServer = _m3_createServer
  const pythonPath = _m3_pythonPath
  const normalizeItemTextLanguage = _m3_normalizeItemTextLanguage
  const parseItemInfo = _m3_parseItemInfo
  const parseFrontendItem = _m3_parseFrontendItem
  const matchAffixes = _m3_matchAffixes
  const matchMapRequirements = _m3_matchMapRequirements
  const matchMapTerm = _m3_matchMapTerm
  const currencyExpectedNames = _m3_currencyExpectedNames
  const buildCraftingCurrencyPreflight = _m3_buildCraftingCurrencyPreflight
  const generatePythonScript = _m3_generatePythonScript
  const generateMapRollingScript = _m3_generateMapRollingScript
  const cleanMigratedMapConfig = _m3_cleanMigratedMapConfig
  const INTERNATIONAL_MAP_BASE_STATS = _m3_INTERNATIONAL_MAP_BASE_STATS
  const analyzeMapFeasibility = _m3_analyzeMapFeasibility
const source = name => readFileSync(new URL(`../src/assets/scripts/${name}`, import.meta.url), 'utf8')
const mapTemplate = source('map_rolling_template.py')
const craftingTemplate = source('crafting_template.py')
const block = (text, start, end) => text.slice(text.indexOf(start), text.indexOf(end, text.indexOf(start)))
function python(script) {
  const result = spawnSync(pythonPath, ['-'], { input: script, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr || String(result.error))
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

// 不注入 localizationSnapshot 的生成脚本：等同国际服汉化词库未激活时的运行环境。
const currencyScriptConfigs = [
  [generatePythonScript, craftingTemplate, { preset: { moduleTwo: { enabled: true, mode: 'alteration', affixGroups: [] }, moduleThree: {}, moduleEldritch: {} } }],
  [generateMapRollingScript, mapTemplate, { inventory: {}, mapConfig: { method: 'alchemy', match: {} } }]
]

function generatedScriptRuntime(generate, template, extra) {
  const script = generate({ serverId: 'international', globalShortcuts: { end: 'F12' }, currencyPositions: {}, itemPosition: { x: 1, y: 2 }, actionPosition: { x: 3, y: 4 }, filePaths: {}, ...extra }, template)
  return {
    helper: block(template, 'CURRENCY_NAMES =', 'def fail_currency_preflight('),
    expected: script.match(/^currency_expected_names = (.+)$/m)[1]
  }
}

const equipment = `Item Class: Helmets
Rarity: Rare
Doom Crown
Royal Burgonet
--------
Armour: 312
--------
Requirements:
Level: 67
Str: 148
--------
Sockets: R-R-B
--------
Item Level: 86
--------
{ Prefix Modifier "Athlete's" (Tier: 1) — Life }
+120(110-120) to maximum Life
{ Suffix Modifier "of the Rainbow" (Tier: 2) — Elemental, Resistance }
+15% to all Elemental Resistances
{ Master Crafted Prefix Modifier "Unchanging" }
Suffixes Cannot Be Changed
--------
Shaper Item`

test('英文制作物品保留原文词缀并解析T级、工艺、势力及插槽', () => {
  const item = parseItemInfo(equipment)
  assert.equal(item.category, '头部')
  assert.equal(item.itemTextLanguage, 'en')
  assert.equal(item.baseName, 'Royal Burgonet')
  assert.equal(item.level, 86)
  assert.equal(item.links, 3)
  assert.equal(item.modifiers[0].tier, 1)
  assert.deepEqual(item.craftedMods, ['Suffixes Cannot Be Changed'])
  assert.deepEqual(item.influences, ['shaper'])
  assert.equal(matchAffixes(item, [{ enabled: true, requiredAffixes: [{ kind: 'catalog', effectPattern: '+# to maximum Life', minTier: 1 }], selectedAffixes: [] }]).isMatch, true)
  assert.equal(matchAffixes(item, [{ enabled: true, requiredAffixes: [{ kind: 'catalog', effectPattern: '+#% to all Elemental Resistances', minTier: 1 }], selectedAffixes: [] }]).isMatch, false)
  assert.equal(normalizeItemTextLanguage('普通中文物品'), '普通中文物品')
})

const mapText = `Item Class: Maps
Rarity: Rare
Doom Domain
Fortress Map
--------
Map Tier: 17
Atlas Drops: +140%
Item Rarity: +90%
Monster Pack Size: +40%
More Maps: +30%
More Threads: +80%
More Currency: +60%
--------
Item Level: 84
--------
{ Prefix Modifier "Reflecting" (Tier: 1) }
Monsters reflect 18% of Physical Damage
--------
Corrupted`

test('3.30地图独立识别Atlas Drops和Threads，JS与前端保持字段一致', () => {
  for (const parse of [parseItemInfo, parseFrontendItem]) {
    const item = parse(mapText)
    assert.equal(item.atlasDrops, 140)
    assert.equal(item.moreThreads, 80)
    assert.equal(item.moreScarabs, 0)
    assert.equal(item.itemQuantity, 0)
    assert.equal(item.isCorrupted, true)
  }
  const item = parseItemInfo(mapText)
  const config = { match: { mandatoryStats: { atlasDrops: { enabled: true, value: 140 }, moreThreads: { enabled: true, value: 80 } }, blacklist: ['Monsters cannot be Stunned'] } }
  assert.equal(matchMapRequirements(item, config).isMatch, true)
  config.match.mandatoryStats.moreThreads.value = 81
  assert.equal(matchMapRequirements(item, config).isMatch, false)
  config.match.mandatoryStats.moreThreads.value = 80
  config.match.blacklist = ['reflect']
  assert.equal(matchMapRequirements(item, config).reason, 'blacklist')
})

test('英文契约和蓝图的固定说明不进入可洗词缀', () => {
  for (const category of ['Contracts', 'Blueprints']) {
    const text = `Item Class: ${category}\nRarity: Rare\nDoom Job\nLaboratory\n--------\nArea Level: 83\nHeist Target: Moderate-value Target\nWings Revealed: 1/3\nEscape Routes Revealed: 0/6\nReward Rooms Revealed: 0/12\nItem Quantity: +52%\nItem Rarity: +31%\nAlert Level Reduction: 20%\nTime before Lockdown: 20%\nMaximum Alive Reinforcements: 20%\n--------\nItem Level: 83\n--------\n{ Prefix Modifier "Savage" (Tier: 1) }\nMonsters deal 20% increased Damage\n--------\nRequires Lockpicking (Level 5)\nTravel to the Rogue Harbour and talk to Adiyah to embark on this Heist.`
    const item = parseItemInfo(text)
    assert.equal(item.category, category === 'Contracts' ? '契约' : '蓝图')
    assert.deepEqual(item.heistStats, { quantity: 52, rarity: 31, alertLevelReduction: 20, timeBeforeLockdown: 20, maximumAliveReinforcements: 20 })
    assert.deepEqual(item.explicitMods, ['Monsters deal 20% increased Damage'])
  }
})

test('英文海图采用当前邻接奖励属性和真实Sulphur名称', () => {
  const text = `Item Class: Chart\nRarity: Rare\nDoom Course\nSandy Seabed Chart\n--------\nArea Level: 83\nRarity of Items found in adjacent Areas: +55%\nPack Size in adjacent Areas: +20%\nDead Man's Sulphur found in adjacent Areas: +35%\n--------\nVoyage Modifier will be revealed once Charted\n--------\nItem Level: 83\n--------\n{ Prefix Modifier "Wealthy" (Tier: 1) }\nMonsters deal 20% increased Damage`
  for (const parse of [parseItemInfo, parseFrontendItem]) {
    const item = parse(text)
    assert.equal(item.category, '海图')
    assert.equal(item.baseName, 'Sandy Seabed Chart')
    assert.equal(item.itemRarity, 55)
    assert.equal(item.monsterPackSize, 20)
    assert.equal(item.deadmanSulphur, 35)
    assert.equal(item.explicitMods.some(line => line.includes('Voyage Modifier')), false)
  }
})

test('新版地图预设字段保存并清理旧数量/圣甲虫字段', () => {
  const migrated = cleanMigratedMapConfig({ match: { mandatoryStats: { moreScarabs: { enabled: true, value: 70 }, moreThreads: { enabled: true, value: 90 }, atlasDrops: { enabled: true, value: 120 } } } })
  assert.equal(migrated.match.mandatoryStats.moreThreads.value, 90)
  assert.equal(migrated.match.mandatoryStats.atlasDrops.value, 120)
  assert.equal(migrated.match.mandatoryStats.moreScarabs, undefined)
  assert.equal(Object.values(INTERNATIONAL_MAP_BASE_STATS).includes('moreScarabs'), false)
  assert.equal(analyzeMapFeasibility({ serverId: 'international', kind: 'atlas', profile: migrated, catalog: { gameVersion: '3.29', pools: [] } }).status, 'unknown')
})

test('英文词缀数字模板保留作用对象与正负号，JS和Python匹配及统计一致', () => {
  const cases = [
    ['Monsters have 45% increased Area of Effect', 'Monsters have #% increased Area of Effect', true],
    ['Unique Boss has 45% increased Area of Effect', 'Monsters have #% increased Area of Effect', false],
    ['Monsters have +45(30—45)% to Fire Resistance', 'Monsters have +#% to Fire Resistance', true],
    ['Monsters have -45% to Fire Resistance', 'Monsters have +#% to Fire Resistance', false],
    ['Monsters deal 100 to 200 added Fire Damage', 'Monsters deal # to # added Fire Damage', true],
    ['Monsters deal 20% increased Damage', 'increased Damage', true]
  ]
  for (const [mod, term, expected] of cases) assert.equal(matchMapTerm(mod, term), expected)
  const helpers = block(mapTemplate, 'def map_term_matches(', 'def check_map_requirements(')
  const result = python(`import json\n${helpers}\ncases=json.loads(${JSON.stringify(JSON.stringify(cases))})\nmap_config={'match':{'blacklist':['Monsters have #% increased Area of Effect'],'whitelist':[]}}\nprint(json.dumps({'matches':[map_term_matches(mod,term) for mod,term,_ in cases], 'boss':check_map_mods({'explicitMods':['Unique Boss has 45% increased Area of Effect']}), 'monster':check_map_mods({'explicitMods':['Monsters have 45% increased Area of Effect']}), 'stats':count_affix_stats({'explicitMods':['Monsters have 45% increased Area of Effect']})}))`)
  assert.deepEqual(result.matches, cases.map(entry => entry[2]))
  assert.equal(result.boss, true)
  assert.equal(result.monster, false)
  assert.deepEqual(result.stats, [{ 'Monsters have #% increased Area of Effect': 1 }, {}])
})

test('汉化词库未激活时两类制作脚本仍按内置中文名与英文名验证通货身份', () => {
  const names = currencyExpectedNames('international')
  assert.ok(buildCraftingCurrencyPreflight({ moduleTwo: { enabled: true } }).every(id => names[id]))
  for (const [generate, template, extra] of currencyScriptConfigs) {
    const { helper, expected } = generatedScriptRuntime(generate, template, extra)
    const result = python(`import json\n${helper}\ncurrency_expected_names = ${expected}\nprint(json.dumps([currency_identity_matches('alteration', name) for name in ['Orb of Alteration','改造石','Orb of Scouring','Chaos Orb','混沌石','改造石[1c]']], ensure_ascii=False))`)
    assert.deepEqual(result, [true, true, false, false, false, true])
    const label = python(`import json\n${helper}\ncurrency_expected_names = ${expected}\nprint(json.dumps(currency_expected_label('alteration'), ensure_ascii=False))`)
    assert.match(label, /改造石/)
    assert.match(label, /Orb of Alteration/)
  }
})

test('汉化词库未激活时中文复制文本可通过启动预检', () => {
  const chinese = '物品类别: 可堆叠通货\n稀有度: 通货\n知识卷轴\n--------\n堆叠数量: 6/40'
  for (const [generate, template, extra] of currencyScriptConfigs) {
    const { expected } = generatedScriptRuntime(generate, template, extra)
    const runtime = block(template, 'CURRENCY_NAMES =', template === craftingTemplate ? 'def move_mouse(' : 'def get_slot_position(')
    const result = python(`import json, types
${runtime}
currency_expected_names = ${expected}
is_running = True
fatal_error_reason = None
required_currency_types = ['wisdom']
verified_currency_types = set()
currency_positions = {'wisdom': {'x': 11, 'y': 22}}
sequence = [10]
events = []
def move_mouse(x, y): events.append(('move', x, y)); return True
def release_all_keys(): events.append(('release',))
def play_error_sound(): events.append(('sound',))
pyperclip = types.SimpleNamespace(paste=lambda: '')
def send_copy_command(*args, **kwargs):
    sequence[0] += 1
    return ${JSON.stringify(chinese)}
GetClipboardSequenceNumber = lambda: sequence[0]
ok = preflight_required_currencies()
print(json.dumps({'ok': ok, 'verified': sorted(verified_currency_types), 'sounds': [e for e in events if e[0] == 'sound']}))
`)
    assert.deepEqual(result, { ok: true, verified: ['wisdom'], sounds: [] })
  }
})

test('英文制作与地图脚本可编译，精华预检接受英文精华并拒绝其他通货', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript, generateMapRollingScript } = await server.ssrLoadModule('/src/utils/python.js')
    const base = { serverId: 'international', globalShortcuts: { end: 'F12' }, currencyPositions: {}, itemPosition: { x: 1, y: 2 }, actionPosition: { x: 3, y: 4 }, filePaths: {}, preset: { moduleTwo: { enabled: true, affixGroups: [] }, moduleThree: {}, moduleEldritch: {} } }
    const scripts = ['general', 'essence', 'harvest'].map(craftingKind => generatePythonScript({ ...base, craftingKind }))
    scripts.push(generateMapRollingScript({ ...base, inventory: {}, mapConfig: { method: 'alchemy', match: {} } }))
    const compiled = spawnSync(pythonPath, ['-c', 'import json,sys; [compile(s,"generated.py","exec") for s in json.load(sys.stdin)]'], { input: JSON.stringify(scripts), encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
    assert.equal(compiled.status, 0, compiled.stderr)
    assert.ok(scripts.every(s => !s.includes('{{') && s.includes('Orb of Alteration')))
    const essencePreflight = block(scripts[1], 'def preflight_specialized_action():', 'def craft_specialized(')
    const identity = block(craftingTemplate, 'def copied_item_header(', 'def currency_identity_matches(')
    const outcome = python(`import json\n${identity}\n${essencePreflight}\nlocalization_snapshot = {'canonicalEssenceNames':['Deafening Essence of Greed','Essence of Horror']}\naction_position = {'x':1,'y':2}\nsequence = 0\nname = ''\nGetClipboardSequenceNumber = lambda: sequence\nmove_mouse = lambda *_: True\npyperclip = type('Clipboard', (), {'paste': staticmethod(lambda: '')})\ndef send_copy_command(*args, **kwargs):\n    global sequence\n    sequence += 1\n    return 'Item Class: Stackable Currency\\nRarity: Currency\\n' + name + '\\n--------'\ndef fail_item_runtime(*_): return False\nresult = []\nfor name in ['Deafening Essence of Greed', 'Essence of Horror', 'Chaos Orb', 'Remnant of Corruption']:\n    result.append(preflight_specialized_action())\nprint(json.dumps(result))`)
    assert.deepEqual(outcome, [true, true, false, false])
  } finally {
    await server.close()
  }
})

test('国际服腐化九词地图通过，未腐化七词和腐化十词均不消耗通货', () => {
  const runtime = block(mapTemplate, 'def process_single_map(', 'def read_and_parse(')
  const result = python(`import json\n${runtime}\nis_running = True\nmap_config = {'serverId':'international','targetKind':'atlas','method':'alchemy','autoStash':False}\nitem_matches_rolling_target = lambda _: True\nrolling_target_label = lambda: '地图'\nrolling_item_level_label = lambda _: 'T16'\nfailed_map_result = lambda reason,code: {'failed':code}\ncompleted_map_result = lambda qualified=False: {'qualified':qualified}\ncheck_map_base = lambda _: True\ncheck_map_mods = lambda _: True\ndef apply_currency_and_read(*_): raise AssertionError('不应使用通货')\nresults = []\nfor count,corrupted in [(9,True),(7,False),(10,True)]:\n    item = {'category':'地图','rarity':'稀有','isCorrupted':corrupted,'detailedMods':[{'type':'prefix' if i%2 else 'suffix'} for i in range(count)]}\n    results.append(process_single_map(item,1,2))\nprint(json.dumps(results))`)
  assert.deepEqual(result, [{ qualified: true }, { failed: 'MAP_AFFIX_COUNT_INVALID' }, { failed: 'MAP_AFFIX_COUNT_INVALID' }])
})
})()

// === Merged from internationalEssencePreflight.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const readFileSync = _m4_readFileSync
  const createHash = _m4_createHash
  const spawnSync = _m4_spawnSync
  const generatePythonScript = _m4_generatePythonScript
  const LocalizationRuntime = _m4_LocalizationRuntime
  const pythonPath = _m4_pythonPath
const template=readFileSync(new URL('../src/assets/scripts/crafting_template.py',import.meta.url),'utf8')
const entry=(id,en,cn,tw=cn)=>({table:'baseitemtypes',field:'Name',kind:'dat',id,en,cn,tw,sourceHash:createHash('sha256').update(en).digest('hex')})
const english='Deafening Essence of Greed',simplified='破空精华之贪婪',traditional='破空精髓之貪婪'
const known=[english,'Essence of Horror']
const trustedEntries=[entry('Metadata/Items/Currency/EssenceGreed7',english,simplified,traditional),entry('Metadata/Items/Currency/CurrencyRerollRare','Chaos Orb','混沌石')]
const snapshot=(entries=trustedEntries)=>new LocalizationRuntime({serverId:'international',entries:()=>entries,revision:()=> 'signed-active',baseNames:()=>known}).snapshot()

// Execute the production-generated functions, with every clipboard/mouse
// boundary replaced in memory. Importing the generated module would create OS controllers.
function preflight(localizationSnapshot,names,{sequenceChanged=true}={}) {
  const script=generatePythonScript({serverId:'international',localizationSnapshot,craftingKind:'essence',globalShortcuts:{end:'F12'},currencyPositions:{},itemPosition:{x:1,y:2},actionPosition:{x:3,y:4},filePaths:{},preset:{moduleTwo:{enabled:true,affixGroups:[]},moduleThree:{},moduleEldritch:{}}},template)
  const code=`import ast,json,types
tree=ast.parse(${JSON.stringify(script)})
namespace={'json':json}
for node in tree.body:
    if isinstance(node,ast.Assign) and any(isinstance(target,ast.Name) and target.id in ('localization_snapshot','currency_expected_names','CURRENCY_NAMES') for target in node.targets):
        exec(compile(ast.Module(body=[node],type_ignores=[]),'generated.py','exec'),namespace)
    if isinstance(node,ast.FunctionDef) and node.name in ('copied_item_header','detected_item_name','normalized_copied_item_name','currency_identity_matches','preflight_specialized_action'):
        exec(compile(ast.Module(body=[node],type_ignores=[]),'generated.py','exec'),namespace)
results=[]
for name in json.loads(${JSON.stringify(JSON.stringify(names))}):
    state={'sequence':1,'error':None,'clicks':0}
    text='物品種類: 可堆疊通貨\\n稀有度: 通貨\\n'+name+'\\n--------\\n堆疊數量: 1/9'
    def copy(*args,**kwargs):
        if ${sequenceChanged?'True':'False'}: state['sequence']+=1
        return text
    def fail(reason,code): state['error']=code;return False
    namespace.update({'GetClipboardSequenceNumber':lambda:state['sequence'],'move_mouse':lambda *args:True,'action_position':{'x':1,'y':1},'pyperclip':types.SimpleNamespace(paste=lambda:''),'send_copy_command':copy,'fail_item_runtime':fail})
    passed=namespace['preflight_specialized_action']()
    results.append({'name':name,'passed':passed,'error':state['error']})
print(json.dumps(results,ensure_ascii=False))`
  const result=spawnSync(pythonPath,['-'],{input:code,encoding:'utf8',env:{...process.env,PYTHONUTF8:'1',PYTHONIOENCODING:'utf-8',PYTHONDONTWRITEBYTECODE:'1'}})
  assert.equal(result.status,0,result.stderr)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

test('真实生成脚本对已知英文与当前简繁精华同等去除合法名称尾注',()=>{
  const names=[english,simplified,traditional].flatMap(name=>[name,`${name}[1c]`,`${name}[0.4c]`,`${name}(★)`,`${name}[1c](★)`])
  assert.ok(preflight(snapshot(),names).every(result=>result.passed))
})

test('未知、错误通货与精华名称、歧义译名和破损尾注仍停止',()=>{
  const ambiguous=snapshot([...trustedEntries,entry('Metadata/Items/Currency/EssenceAnger7','Deafening Essence of Anger',simplified,traditional)])
  const names=['Chaos Orb[1c]','混沌石[1c]','Remnant of Corruption','Essence of DefinitelyNotAnEssence',`Fake ${english}[1c]`,'未知精华[1c]',`${english}[1c]Suffix`]
  for (const result of preflight(snapshot(),names)) {
    assert.equal(result.passed,false,result.name)
    assert.equal(result.error,'ESSENCE_TYPE_MISMATCH',result.name)
  }
  for (const result of preflight(ambiguous,[`${simplified}[1c]`,`${traditional}[1c]`])) assert.equal(result.passed,false,result.name)
})

test('无汉化时只接受已知规范英文精华，空目录和无新复制证据不放行',()=>{
  const trusted=new LocalizationRuntime({serverId:'international',baseNames:()=>known}).snapshot()
  assert.deepEqual(preflight(trusted,[`${english.toLowerCase()}[1c]`,'Essence of Horror(★)',`${traditional}[1c]`]).map(result=>result.passed),[true,true,false])
  assert.equal(preflight({...trusted,canonicalEssenceNames:[]},[english])[0].passed,false)
  const stale=preflight(trusted,[english],{sequenceChanged:false})[0]
  assert.equal(stale.passed,false);assert.equal(stale.error,'ESSENCE_NOT_FOUND')
})
})()

// === Merged from itemAffixUi.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const readFile = _m5_readFile
  const createSSRApp = _m5_createSSRApp
  const renderToString = _m5_renderToString
  const createPinia = _m5_createPinia
  const setActivePinia = _m5_setActivePinia
  const createServer = _m5_createServer
function readFunctionBody(source, functionName) {
  const match = source.match(new RegExp(`function ${functionName}\\([^)]*\\) \\{([\\s\\S]*?)\\n\\}`))
  assert.ok(match, `缺少函数 ${functionName}`)
  return match[1]
}

test('物品词缀界面提供多组合、全库联想、自由关键词和最低 T 编辑', async () => {
  const [moduleTwo, goalEditor, conditionRow, preload, api, fileIpc, runtime] = await Promise.all([
    readFile('src/domains/items/components/ModuleTwo.vue', 'utf8'),
    readFile('src/domains/items/components/AffixGoalEditor.vue', 'utf8'),
    readFile('src/domains/items/components/AffixConditionRow.vue', 'utf8'),
    readFile('electron/preload.cjs', 'utf8'),
    readFile('src/api/electron.js', 'utf8'),
    readFile('electron/modules/ipc/file.js', 'utf8'),
    readFile('src/utils/pythonScriptGenerator.js', 'utf8')
  ])

  const config = await readFile('src/domains/items/affixConfig.js', 'utf8')
  const view = `${moduleTwo}\n${goalEditor}\n${conditionRow}\n${config}`
  for (const text of [
    'form.affixGroups',
    '新增达标组合',
    'duplicateGroup',
    'removeGroup',
    'collapsedGroupIds',
    'toggleGroupCollapse',
    'isGroupCollapsed',
    'aria-label',
    'aria-expanded',
    'aria-controls',
    '必选词缀',
    '挑选词缀',
    'fetchSuggestions',
    'searchAffixSuggestions',
    'affix-suggestion-popper',
    'affix-tier-popper',
    'overflow-y: auto',
    'el-autocomplete-suggestion li:hover',
    'el-select-dropdown__item:hover',
    '不限 T',
    '最低 T',
    '最低物等'
  ]) assert.match(view, new RegExp(text))
  assert.match(goalEditor, /v-if="!isGroupCollapsed\(group\.id\)"/)
  assert.match(goalEditor, /<el-input[^>]*class="group-name"[\s\S]*?<el-tooltip[^>]*groupRequirement\(group\)\.hasEffectiveConditions[\s\S]*?<el-button[^>]*duplicateGroup\(groupIndex\)/)
  assert.match(goalEditor, /最低物等：至少 \$\{requirement\.level\}（含未知项）/)
  assert.match(goalEditor, /自定义关键词没有目录阶级数据，不参与物等计算和运行拦截/)
  const headerGroups = goalEditor.match(/<div class="group-title">([\s\S]*?)<\/div>\s*<div class="group-actions">([\s\S]*?)<\/div>\s*<\/header>/)
  assert.ok(headerGroups, '组合标题栏应包含左右两个操作区')
  assert.match(headerGroups[1], /duplicateGroup\(groupIndex\)/)
  assert.match(headerGroups[1], /removeGroup\(groupIndex\)/)
  assert.doesNotMatch(headerGroups[1], /toggleGroupCollapse/)
  assert.match(headerGroups[2], /toggleGroupCollapse\(group\.id\)/)
  assert.doesNotMatch(headerGroups[2], /duplicateGroup|removeGroup/)
  assert.match(goalEditor, /\.group-title :deep\(\.el-button \+ \.el-button\) \{\s*margin-left: 0;/)
  assert.match(goalEditor, /suggestion\.displayPattern \|\| suggestion\.effectPattern/)
  assert.match(preload, /searchCraftingAffixSuggestions/)
  assert.match(api, /searchAffixSuggestions/)
  assert.match(fileIpc, /matchedGroupName/)
  assert.match(fileIpc, /affixGroupResults/)
  assert.match(runtime, /命中组合/)
})

test('达标组合折叠保持为独立界面状态', async () => {
  const source = await readFile('src/domains/items/components/AffixGoalEditor.vue', 'utf8')
  const toggleBody = readFunctionBody(source, 'toggleGroupCollapse')
  const forgetBody = readFunctionBody(source, 'forgetGroupCollapse')
  const addBody = readFunctionBody(source, 'addGroup')
  const duplicateBody = readFunctionBody(source, 'duplicateGroup')
  const removeBody = readFunctionBody(source, 'removeGroup')

  assert.match(toggleBody, /new Set\(collapsedGroupIds\.value\)/)
  assert.doesNotMatch(toggleBody, /\bform\b|commit\(|updateCurrentItemPreset/)
  assert.doesNotMatch(forgetBody, /\bform\b|commit\(|updateCurrentItemPreset/)
  assert.doesNotMatch(addBody, /collapsedGroupIds|toggleGroupCollapse/)
  assert.doesNotMatch(duplicateBody, /collapsedGroupIds|toggleGroupCollapse/)
  assert.match(removeBody, /forgetGroupCollapse\(removedGroup\?\.id\)/)
  assert.match(removeBody, /commit\(\)/)
})

test('词缀 T 级选择器不在渲染函数外调用插槽', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
    ssr: { noExternal: ['element-plus'] }
  })
  try {
    const [{ default: ModuleTwo }, { usePresetStore }, { ID_INJECTION_KEY }, { ZINDEX_INJECTION_KEY }] = await Promise.all([
      server.ssrLoadModule('/src/domains/items/components/ModuleTwo.vue'),
      server.ssrLoadModule('/src/stores/preset.js'),
      server.ssrLoadModule('/node_modules/element-plus/es/hooks/use-id/index.mjs'),
      server.ssrLoadModule('/node_modules/element-plus/es/hooks/use-z-index/index.mjs')
    ])
    const pinia = createPinia()
    setActivePinia(pinia)
    const presetStore = usePresetStore()
    presetStore.currentItemPreset.moduleTwo.affixGroups[0].selectedAffixes.push({
      id: 'condition_slot_regression',
      kind: 'keyword',
      keyword: '生命',
      displayName: '生命',
      effectPattern: '',
      source: '',
      sourceLabel: '',
      profileId: '',
      applicableLabel: '',
      minTier: 1,
      tiers: [{ tier: 1, name: 'T1' }]
    })

    const warnings = []
    const app = createSSRApp(ModuleTwo)
    app.use(pinia)
    app.provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 })
    app.provide(ZINDEX_INJECTION_KEY, { current: 0 })
    app.config.warnHandler = (message) => warnings.push(message)

    const html = await renderToString(app)

    assert.equal(warnings.some((message) => message.includes('invoked outside of the render function')), false, warnings.join('\n'))
    assert.match(html, /aria-expanded="true"/)
    assert.match(html, /收起(?:<!--.*?-->)*<\/span>/)
    assert.match(html, /class="affix-columns"/)
    assert.match(html, /必选词缀/)
  } finally {
    await server.close()
  }
})
})()

// === Merged from itemCraftingInitialPreparation.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const readFileSync = _m6_readFileSync
  const spawnSync = _m6_spawnSync
  const createServer = _m6_createServer
  const createPinia = _m6_createPinia
  const setActivePinia = _m6_setActivePinia
  const pythonPath = _m6_pythonPath
  const usePresetStore = _m6_usePresetStore
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
  assert.match(moduleOne, /craftingInitialChecks\.general/)
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
  assert.equal(store.craftingInitialChecks.general, false)
  assert.equal(Object.hasOwn(store.currentItemPreset, 'checkInitialItem'), false)
  assert.equal(Object.hasOwn(store.currentItemPreset.moduleTwo, 'checkInitialAffixes'), false)

  store.updateCraftingInitialCheck('general', true)
  setActivePinia(createPinia())
  const restored = usePresetStore()
  assert.equal(restored.craftingInitialChecks.general, true)
  assert.equal(Object.hasOwn(restored.currentItemPreset, 'checkInitialItem'), false)
})

test('制作前准备仅鉴定未鉴定物品一次，并对失败发出启动错误', () => {
  const template = source('../src/assets/scripts/crafting_template.py')
  const start = template.indexOf('def fail_item_runtime(')
  const end = template.indexOf('# 自动启动制作', start)
  assert.ok(start >= 0 && end > start)
  const block = template.slice(start, end)
    .replaceAll('{{ENABLE_AFFIX}}', 'True')
    .replaceAll('{{ENABLE_ELDRITCH}}', 'False')
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
    def read(allow_unchanged_text=False, **_kwargs): return reads.pop(0)
    def wait(_request_id=None): return queue.pop(0)
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
  "retryRead": run([unidentified, identified], [True, False, True]),
  "identifyReadFailed": run([unidentified], [True, False, False, False]),
  "eldritchUnidentified": run([unidentified], identify_unidentified=False),
  "identifyFailed": run([unidentified], apply_success=False),
  "still": run([unidentified, unidentified]),
  "parseFailed": run([{"error": "无法解析"}, {"error": "无法解析"}, {"error": "无法解析"}]),
  "readFailed": run([identified], [False, False, False])
}, ensure_ascii=False))
`)

  assert.deepEqual(result.identified.applied, [])
  assert.equal(result.identified.prepared.isUnidentified, false)
  assert.deepEqual(result.unidentified.applied, ['wisdom'])
  assert.equal(result.unidentified.prepared.isUnidentified, false)
  assert.deepEqual(result.retryRead.applied, ['wisdom'])
  assert.equal(result.retryRead.prepared.isUnidentified, false)
  assert.deepEqual(result.identifyReadFailed.applied, ['wisdom'])
  assert.equal(result.identifyReadFailed.prepared, null)
  assert.match(result.identifyReadFailed.fatal, /鉴定后无法重新读取/)
  assert.deepEqual(result.eldritchUnidentified.applied, [])
  assert.equal(result.eldritchUnidentified.prepared, null)
  assert.match(result.eldritchUnidentified.fatal, /未鉴定.*请先.*鉴定/)
  assert.equal(result.identifyFailed.prepared, null)
  assert.match(result.identifyFailed.fatal, /知识卷轴/)
  assert.deepEqual(result.still.applied, ['wisdom'])
  assert.equal(result.still.prepared, null)
  assert.match(result.still.fatal, /仍为未鉴定/)
  assert.equal(result.parseFailed.prepared, null)
  assert.match(result.parseFailed.fatal, /无法解析/)
  assert.equal(result.readFailed.prepared, null)
  assert.match(result.readFailed.fatal, /无法读取/)
})

test('读取到未适配词缀补丁标记时停止制作，仅插槽配置放行', () => {
  const template = source('../src/assets/scripts/crafting_template.py')
  const start = template.indexOf('def fail_item_runtime(')
  const end = template.indexOf('def fail_item_preparation(', start)
  assert.ok(start >= 0 && end > start)
  const substitute = (affixEnabled, eldritchEnabled) => template.slice(start, end)
    .replaceAll('{{ENABLE_AFFIX}}', affixEnabled ? 'True' : 'False')
    .replaceAll('{{ENABLE_ELDRITCH}}', eldritchEnabled ? 'True' : 'False')

  const run = (generated, queueLiteral) => runPython(`
import json, time
${generated}
is_running = True
fatal_error_reason = None
def release_all_keys(): pass
def play_error_sound(): pass
def read_clipboard_to_file(allow_unchanged_text=False, **_kwargs): return True
def wait_for_parse_result(_request_id=None): return queue.pop(0)
queue = ${queueLiteral}
result = read_current_item()
print(json.dumps({"result": result, "fatal": fatal_error_reason}, ensure_ascii=False))
`)

  const guarded = run(substitute(true, false), '[{"rarity": "魔法", "affixFormatUnsupported": True}]')
  assert.match(guarded.fatal, /未适配的词缀补丁格式/)
  assert.deepEqual(guarded.result, { error: '检测到未适配的词缀补丁格式', errorCode: 'AFFIX_PATCH_UNSUPPORTED' })

  const eldritchGuarded = run(substitute(false, true), '[{"rarity": "稀有", "affixFormatUnsupported": True}]')
  assert.match(eldritchGuarded.fatal, /未适配的词缀补丁格式/)
  assert.deepEqual(eldritchGuarded.result, { error: '检测到未适配的词缀补丁格式', errorCode: 'AFFIX_PATCH_UNSUPPORTED' })

  const passthrough = run(substitute(false, false), '[{"rarity": "魔法", "affixFormatUnsupported": True, "socketsCount": 3}]')
  assert.equal(passthrough.fatal, null)
  assert.deepEqual(passthrough.result, { rarity: '魔法', affixFormatUnsupported: true, socketsCount: 3 })
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
      const helperStart = generated.indexOf('def fail_item_runtime(')
      const helperEnd = generated.indexOf('def fail_item_preparation(', helperStart)
      const start = generated.indexOf('def explicit_affix_count(')
      const end = generated.indexOf('def craft_eldritch_implicits(', start)
      assert.ok(helperStart >= 0 && helperEnd > helperStart && start >= 0 && end > start)
      return runPython(`
import json, os, time
${generated.slice(helperStart, helperEnd)}
${generated.slice(start, end)}
is_running = True
item_info_result_file = os.devnull
applied = []
queue = [{"rarity":"魔法", "affixMatch":True, "matchedGroupName":"目标", "explicitMods":[]}]
def apply_currency(currency): applied.append(currency); return True
def read_clipboard_to_file(allow_unchanged_text=False, **_kwargs): return True
def wait_for_parse_result(_request_id=None): return queue.pop(0)
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
      const helperStart = generated.indexOf('def fail_item_runtime(')
      const helperEnd = generated.indexOf('def fail_item_preparation(', helperStart)
      const start = generated.indexOf('def craft_sockets(')
      const end = generated.indexOf('# 辅助函数', start)
      assert.ok(helperStart >= 0 && helperEnd > helperStart && start >= 0 && end > start)
      return runPython(`
import json, os, time
${generated.slice(helperStart, helperEnd)}
${generated.slice(start, end)}
is_running = True
item_info_result_file = os.devnull
currencies = []
used = []
def right_click_currency(currency): currencies.append(currency); return True
def left_click_item(): return True
def record_currency_usage(currency): used.append(currency)
def read_clipboard_to_file(allow_unchanged_text=False, **_kwargs): return True
def wait_for_parse_result(_request_id=None): return {"socketsCount": 6}
time.sleep = lambda _seconds: None
success = craft_sockets({"socketMatch": True, "socketsCount": 6})
print(json.dumps({"success": bool(success), "currencies": currencies, "used": used}, ensure_ascii=False))
`)
    }
    assert.deepEqual(runSockets(generateSockets(true)), { success: true, currencies: [], used: [] })
    assert.deepEqual(runSockets(generateSockets(false)), { success: true, currencies: ['jewellers'], used: ['jewellers'] })
  } finally {
    await server.close()
  }
})

test('读取未变化时词缀循环继续下一轮且增幅补读沿用增幅前结果', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    const generated = generatePythonScript({
      globalShortcuts: { end: 'Alt+3' },
      currencyPositions: { alteration: { x: 2, y: 2 }, augmentation: { x: 5, y: 5 } },
      operationDelayMs: 50,
      adaptiveTiming: true,
      fixedTiming: {},
      itemPosition: { x: 30, y: 40 },
      preset: {
        checkInitialItem: true,
        moduleTwo: {
          enabled: true,
          mode: 'alteration',
          enableAugmentation: true,
          affixGroups: [{ id: 'goal', name: '目标', requiredAffixes: [], selectedAffixes: ['充能'], selectedCount: 1 }]
        },
        moduleThree: { enabled: false },
        moduleEldritch: { enabled: false }
      },
      filePaths: { itemInfoFile: 'item.txt', itemInfoResultFile: 'result.json' },
      stashTabSelection: { enabled: false }
    })

    const helperStart = generated.indexOf('def fail_item_runtime(')
    const helperEnd = generated.indexOf('def fail_item_preparation(', helperStart)
    const logicStart = generated.indexOf('def explicit_affix_count(')
    const finishStart = generated.indexOf('def finish_affix_match(', logicStart)
    const logicEnd = generated.indexOf('def craft_eldritch_implicits(', logicStart)
    assert.ok(helperStart >= 0 && helperEnd > helperStart && logicStart >= 0)
    assert.ok(finishStart > logicStart && logicEnd > finishStart)

    const twoAffix = '{"rarity":"魔法","affixMatch":false,"modifiers":[{"type":"prefix","name":"鞭笞的","tier":1,"text":"你被敌人击中时获得 3 次充能"},{"type":"suffix","name":"海豹之","tier":1,"text":"生效期间，有 53% 几率避免被冰缓"}]}'
    const oneAffix = '{"rarity":"魔法","affixMatch":false,"modifiers":[{"type":"suffix","name":"海豹之","tier":1,"text":"生效期间，有 53% 几率避免被冰缓"}]}'

    const runLoop = runPython(`
import json, time
${generated.slice(helperStart, helperEnd)}
${generated.slice(logicStart, logicEnd)}
is_running = True
fatal = []
def fail_item_runtime(reason, code="ITEM_READ_FAILED"):
    fatal.append(reason)
    globals()["is_running"] = False
    return False
def release_all_keys(): pass
def play_error_sound(): pass
applied = []
def apply_currency(currency): applied.append(currency); return True
reads = []
queue = ["unchanged", "unchanged", "last"]
def read_current_item():
    item = queue.pop(0)
    reads.append(item)
    if item == "last":
        globals()["is_running"] = False
    return {"unchanged": True}
time.sleep = lambda _seconds: None
initial = json.loads(r'''${twoAffix}''')
success = craft_affixes(initial)
print(json.dumps({"success": bool(success), "applied": applied, "fatal": fatal}, ensure_ascii=False))
`)
    assert.equal(runLoop.fatal.length, 0)
    assert.equal(runLoop.success, false)
    assert.deepEqual(runLoop.applied, ['alteration', 'alteration', 'alteration'])

    const runAugment = runPython(`
import json, time
${generated.slice(helperStart, helperEnd)}
${generated.slice(logicStart, finishStart)}
is_running = True
fatal = []
def fail_item_runtime(reason, code="ITEM_READ_FAILED"):
    fatal.append(reason)
    globals()["is_running"] = False
    return False, None
def release_all_keys(): pass
def play_error_sound(): pass
applied = []
def apply_currency(currency): applied.append(currency); return True
def read_current_item(): return {"unchanged": True}
time.sleep = lambda _seconds: None
ok, kept = augment_single_affix_if_needed(json.loads(r'''${oneAffix}'''))
refreshed = [ok, kept.get("affixMatch"), len(kept.get("modifiers", [])), list(applied), list(fatal)]
def read_current_item(): return json.loads(r'''${twoAffix}''')
ok2, refreshed_result = augment_single_affix_if_needed(json.loads(r'''${oneAffix}'''))
print(json.dumps({"kept": refreshed, "refreshed": [ok2, len(refreshed_result.get("modifiers", [])), list(applied)], "fatal": list(fatal)}, ensure_ascii=False))
`)
    assert.deepEqual(runAugment.kept, [true, false, 1, ['augmentation'], []])
    assert.deepEqual(runAugment.refreshed, [true, 2, ['augmentation', 'augmentation']])
  } finally {
    await server.close()
  }
})

test('破碎物品在所有重铸预处理入口点击前停止', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const { generatePythonScript } = await server.ssrLoadModule('/src/utils/python.js')
    const generate = (mode) => generatePythonScript({
      globalShortcuts: { end: 'Alt+3' },
      currencyPositions: {
        scouring: { x: 1, y: 1 },
        transmutation: { x: 2, y: 2 },
        alteration: { x: 3, y: 3 },
        alchemy: { x: 4, y: 4 }
      },
      operationDelayMs: 50,
      fixedTiming: {},
      itemPosition: { x: 30, y: 40 },
      preset: {
        checkInitialItem: true,
        moduleTwo: {
          enabled: true,
          mode,
          affixGroups: [{ id: 'goal', name: '目标', requiredAffixes: ['生命'], selectedAffixes: [], selectedCount: 1 }]
        },
        moduleThree: { enabled: false },
        moduleEldritch: { enabled: false }
      },
      filePaths: { itemInfoFile: 'item.txt', itemInfoResultFile: 'result.json' },
      stashTabSelection: { enabled: false }
    })

    const runAffix = (generated, initial, readResults = [], stopCurrency = '') => {
      const helperStart = generated.indexOf('def fail_item_runtime(')
      const helperEnd = generated.indexOf('def fail_item_preparation(', helperStart)
      const logicStart = generated.indexOf('def has_fractured_affix(')
      const logicEnd = generated.indexOf('def craft_eldritch_implicits(', logicStart)
      assert.ok(helperStart >= 0 && helperEnd > helperStart && logicStart >= 0 && logicEnd > logicStart)
      return runPython(`
import json, time
${generated.slice(helperStart, helperEnd)}
${generated.slice(logicStart, logicEnd)}
is_running = True
fatal = []
applied = []
queue = json.loads(r'''${JSON.stringify(readResults)}''')
def fail_item_runtime(reason, code="ITEM_READ_FAILED"):
    fatal.append({"reason": reason, "code": code})
    globals()["is_running"] = False
    return False
def apply_currency(currency):
    applied.append(currency)
    if currency == "${stopCurrency}":
        globals()["is_running"] = False
    return True
def read_current_item(*_args, **_kwargs):
    return queue.pop(0) if queue else {"unchanged": True}
time.sleep = lambda _seconds: None
success = craft_affixes(json.loads(r'''${JSON.stringify(initial)}'''))
print(json.dumps({"success": bool(success), "applied": applied, "fatal": fatal}, ensure_ascii=False))
`)
    }

    const expectedReason = '检测到破碎词缀，破碎物品无法通过重铸石预处理为普通物品，已停止制作'
    const expectedFailure = [{ reason: expectedReason, code: 'FRACTURED_ITEM_PREPARATION_UNSUPPORTED' }]

    const structured = runAffix(generate('alteration'), {
      rarity: '稀有', affixMatch: false,
      modifiers: [{ type: 'fractured', text: '+100 最大生命' }]
    })
    assert.equal(structured.success, false)
    assert.deepEqual(structured.applied, [])
    assert.deepEqual(structured.fatal, expectedFailure)

    const flagged = runAffix(generate('alteration'), {
      rarity: '稀有', affixMatch: false, isFractured: true, modifiers: []
    })
    assert.deepEqual(flagged.applied, [])
    assert.deepEqual(flagged.fatal, expectedFailure)

    const alchemyLoop = runAffix(generate('alchemy'), {
      rarity: '普通', affixMatch: false, modifiers: []
    }, [{
      rarity: '稀有', affixMatch: false,
      modifiers: [{ type: 'fractured', text: '+100 最大生命' }]
    }])
    assert.deepEqual(alchemyLoop.applied, ['alchemy'])
    assert.deepEqual(alchemyLoop.fatal, expectedFailure)

    const ordinary = runAffix(generate('alteration'), {
      rarity: '稀有', affixMatch: false, modifiers: [{ type: 'prefix', text: '+100 最大生命' }]
    }, [{ rarity: '魔法', affixMatch: false, modifiers: [] }], 'alteration')
    assert.deepEqual(ordinary.applied, ['scouring', 'alteration'])
    assert.deepEqual(ordinary.fatal, [])
  } finally {
    await server.close()
  }
})
})()

// === Merged from itemTier.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const fileURLToPath = _m7_fileURLToPath
  const parseItemInfo = _m7_parseItemInfo
  const parseFrontendItem = _m7_parseFrontendItem
  const parseBagItemHeader = _m7_parseBagItemHeader
  const normalizeItemTextLanguage = _m7_normalizeItemTextLanguage
  const runPython = _m7_runPython
const equipment = tierLine => `Item Class: Rings
Rarity: Rare
Storm Ring
Iron Ring
--------
Item Level:85
${tierLine}
--------
+60 to maximum Life
25% increased Rarity of Items found`

test('显式Item Tier作为独立可选数值，物品等级和真实词缀保持原值', () => {
  const text = equipment('Item Tier:5')
  assert.match(normalizeItemTextLanguage(text), /^物品阶级: 5$/m)
  for (const parse of [parseItemInfo, parseFrontendItem]) {
    const parsed = parse(text)
    assert.equal(parsed.itemTier, 5)
    assert.equal(parsed.level, 85)
    assert.deepEqual(parsed.explicitMods, ['+60 to maximum Life', '25% increased Rarity of Items found'])
    assert.equal(parse(normalizeItemTextLanguage(text)).itemTier, 5)
  }
  assert.equal(parseBagItemHeader(text).itemTier, 5)
  assert.equal(parseBagItemHeader(normalizeItemTextLanguage(text)).itemTier, 5)
})

test('词缀Tier与稀有度或名称后缀不推断为物品Item Tier', () => {
  const text = equipment('').replace('+60 to maximum Life', '{ Prefix Modifier "Athlete\'s" (Tier: 1) — Life }\n+60 to maximum Life')
  const detailed = parseItemInfo(text)
  assert.equal('itemTier' in detailed, false)
  assert.equal(detailed.modifiers[0].tier, 1)
  const withItemTier = parseItemInfo(text.replace('Item Level:85', 'Item Level:85\nItem Tier:5'))
  assert.equal(withItemTier.itemTier, 5)
  assert.equal(withItemTier.modifiers[0].tier, 1)
  for (const parse of [parseItemInfo, parseFrontendItem, parseBagItemHeader]) {
    assert.equal('itemTier' in parse(equipment('').replace('Storm Ring', 'Storm Ring of Tier 5')), false)
  }
  assert.equal('itemTier' in parseItemInfo('Item Class: Maps\nRarity: Rare\nStorm Map\nBeach Map\n--------\nMap Tier: 5\nItem Level:85'), false)
})

test('无效或未见格式的Item Tier不记录数值也不进入主解析器词缀', () => {
  for (const value of ['unknown', '0', '-1', '1.5', '9007199254740992', '5 (new format)']) {
    const text = equipment(`Item Tier:${value}`)
    for (const parse of [parseItemInfo, parseFrontendItem, parseBagItemHeader]) assert.equal('itemTier' in parse(text), false)
    assert.deepEqual(parseItemInfo(text).explicitMods, ['+60 to maximum Life', '25% increased Rarity of Items found'])
  }
})

test('背包Python仅解析相同显式结构行，未给出时不增加字段', () => {
  const script = fileURLToPath(new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url))
  const texts = [equipment('Item Tier:5'), normalizeItemTextLanguage(equipment('Item Tier:5')), equipment(''), equipment('{ Prefix Modifier "Tiered" (Tier: 2) }'), equipment('Item Tier:1.5')]
  const result = runPython(`
import ast, json, re
tree = ast.parse(open(${JSON.stringify(script)}, encoding="utf-8").read())
functions = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == "parse_item_header"]
scope = {"re": re}
exec(compile(ast.Module(body=functions, type_ignores=[]), "item-tier", "exec"), scope)
texts = json.loads(${JSON.stringify(JSON.stringify(texts))})
print(json.dumps([scope["parse_item_header"](text) for text in texts]))
`)
  assert.equal(result[0].itemTier, 5)
  assert.equal(result[1].itemTier, 5)
  assert.equal(result[0].itemLevel, 85)
  assert.ok(result.slice(2).every(item => !Object.hasOwn(item, 'itemTier')))
})
})()
