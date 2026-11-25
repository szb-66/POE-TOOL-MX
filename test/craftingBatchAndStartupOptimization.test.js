import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { pythonPath } from './helpers/python.js'
import { handlePipeParseRequest, PARSE_REQ_PREFIX, PARSE_RES_PREFIX } from '../electron/modules/python/parsePipe.js'
import { createOverlayDispatcher } from '../electron/modules/window/craftingOverlayLifecycle.js'
import { createBatchRecoveryStore } from '../electron/modules/crafting/batchRecovery.js'
import {
  buildAutoScanBatchConfiguration,
  evaluateBatchItemWarning,
  freezeBatchConfiguration
} from '../src/domains/items/batchCrafting.js'
import { collectCraftingConfigurationIssues } from '../src/domains/configurationGuide/configurationIssues.js'
import { generatePythonScript } from '../src/utils/pythonScriptGenerator.js'
import { retryAutomationWithLatestConfig } from '../src/utils/craftingRestart.js'
import { evaluateItemsStatus } from '../src/domains/dashboard/dashboardStatus.js'
import { normalizeItemTextLanguage } from '../shared/itemTextLanguage.js'

const craftingTemplate = readFileSync(new URL('../src/assets/scripts/crafting_template.py', import.meta.url), 'utf8')
const mapTemplate = readFileSync(new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url), 'utf8')

function block(source, start, end) {
  const from = source.indexOf(start)
  const to = end ? source.indexOf(end, from) : source.length
  assert.ok(from >= 0 && to > from, `无法截取代码块 ${start} .. ${end}`)
  return source.slice(from, to)
}

function runPython(source, env = {}) {
  const result = spawnSync(pythonPath, ['-c', source], {
    encoding: 'utf8',
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', ...env }
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

test('管道解析桥接支持即时解析并写回 PARSE_RES，畸形请求返回错误而不卡死', () => {
  const written = []
  const overlayEvents = []
  const sampleClipboard = [
    '物品类别: 戒指',
    '稀 有 度: 魔法',
    '海灵戒指',
    '--------',
    '物品等级: 84',
    '--------',
    '+20 最大魔力 (implicit)',
    '--------',
    '+60 最大生命'
  ].join('\n')

  const handled = handlePipeParseRequest({
    line: `${PARSE_REQ_PREFIX}${JSON.stringify({ clipboard: sampleClipboard, requestId: 7 })}`,
    config: { moduleTwo: { enabled: false }, moduleThree: { enabled: false } },
    writeResponse: payload => written.push(payload),
    onResult: result => overlayEvents.push(result)
  })
  assert.equal(handled, true)
  assert.equal(written.length, 1)
  assert.ok(written[0].startsWith(PARSE_RES_PREFIX))
  const parsed = JSON.parse(written[0].slice(PARSE_RES_PREFIX.length))
  assert.equal(parsed.requestId, 7)
  assert.equal(parsed.rarity, '魔法')
  assert.equal(parsed.level, 84)
  assert.equal(overlayEvents.length, 1)

  const malformed = []
  assert.equal(handlePipeParseRequest({
    line: `${PARSE_REQ_PREFIX}{broken`,
    writeResponse: payload => malformed.push(payload)
  }), true)
  assert.match(malformed[0], /格式无效/)
  assert.equal(handlePipeParseRequest({ line: 'EVENT {"event":"noop"}' }), false)
})

test('Python 模板通过 stdin/stdout 管道完成零磁盘往返解析', async () => {
  const pipeSetup = block(craftingTemplate, 'item_info_file = r"', '# 自动操作等待')
    .replace('{{ITEM_INFO_FILE}}', 'unused_in.json')
    .replace('{{ITEM_INFO_RESULT_FILE}}', 'unused_out.json')
  const readBlock = block(craftingTemplate, 'def read_clipboard_to_file(', 'def fail_item_runtime(')
  const script = `
import json, os, sys, time, types
${pipeSetup}
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
is_running = True
GetClipboardSequenceNumber = lambda: 1
pyperclip = types.SimpleNamespace(paste=lambda: "")
def send_copy_command(*_args, **_kwargs): return "ITEM_SAMPLE"
${readBlock}
req_id = read_clipboard_to_file()
res = wait_for_parse_result(req_id)
print("FINAL " + json.dumps({"reqId": req_id, "res": res}, ensure_ascii=False), flush=True)
`
  const child = spawn(pythonPath, ['-u', '-c', script], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', POE_PARSE_TRANSPORT: 'pipe' }
  })
  let finalLine = ''
  let stderr = ''
  child.stderr.on('data', chunk => { stderr += String(chunk) })
  let buf = ''
  child.stdout.on('data', chunk => {
    buf += String(chunk)
    const lines = buf.split(/\r?\n/)
    buf = lines.pop() || ''
    for (const line of lines) {
      if (line.startsWith(PARSE_REQ_PREFIX)) {
        const req = JSON.parse(line.slice(PARSE_REQ_PREFIX.length))
        child.stdin.write(`${PARSE_RES_PREFIX}${JSON.stringify({ requestId: req.requestId, rarity: '稀有', level: 86 })}\n`)
      } else if (line.startsWith('FINAL ')) {
        finalLine = line.slice(6)
      }
    }
  })
  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', resolve)
  })
  assert.equal(exitCode, 0, stderr)
  const payload = JSON.parse(finalLine)
  assert.equal(payload.reqId, 1)
  assert.equal(payload.res.rarity, '稀有')
  assert.equal(payload.res.level, 86)
})

test('装备与地图脚本已在通货页时首通货命中直接 0ms 跳过 OCR 并免二次校验', () => {
  for (const [label, template, mode] of [
    ['items', craftingTemplate, 'items'],
    ['map', mapTemplate, 'map']
  ]) {
    const selectorBlock = block(template, 'def _quick_probe_currency_at_position(', 'CURRENCY_NAMES = {')
    const preflightBlock = block(template, 'def preflight_required_currencies(', label === 'items' ? 'def apply_currency(' : 'def is_game_foreground(')
    const result = runPython(`
import json, builtins
CURRENCY_NAMES = {"alteration": "改造石", "augmentation": "增幅石"}
currency_expected_names = {"alteration": ["改造石"], "augmentation": ["增幅石"]}
currency_positions = {"alteration": {"x": 100, "y": 100}, "augmentation": {"x": 200, "y": 100}}
required_currency_types = ["alteration", "augmentation"]
stash_tab_selection = {"enabled": True, "names": {"currency": "通货"}}
verified_currency_types = set()
is_running = True
fatal_error_reason = None
moves = []
events = []
seq = {"n": 10}
def print(msg="", **_kw):
    if str(msg).startswith("EVENT "): events.append(json.loads(msg[6:]))
def move_mouse(x, y): moves.append((x, y)); return True
def GetClipboardSequenceNumber(): return seq["n"]
class FakeClip:
    @staticmethod
    def paste(): return ""
pyperclip = FakeClip
def send_copy_command(*_a, **_kw):
    seq["n"] += 1
    return "物品类别: 通货\\n稀 有 度: 通货\\n改造石\\n--------" if moves[-1] == (100, 100) else "物品类别: 通货\\n稀 有 度: 通货\\n增幅石\\n--------"
def copied_item_header(text): return [l for l in text.splitlines() if l and set(l) != {"-"}]
def detected_item_name(lines): return lines[-1]
def currency_identity_matches(c, actual): return actual in currency_expected_names[c]
def currency_expected_label(c): return CURRENCY_NAMES[c]
def fail_currency_preflight(*args, **kwargs): raise AssertionError(f"unexpected failure: {args}")
def release_all_keys(): pass
def play_error_sound(): pass
${selectorBlock}
${preflightBlock}
ok_select = select_currency_stash_tab("${mode}")
ok_preflight = preflight_required_currencies()
builtins.print(json.dumps({"okSelect": ok_select, "okPreflight": ok_preflight, "moves": moves, "events": events}, ensure_ascii=False))
`)
    assert.equal(result.okSelect, true)
    assert.equal(result.okPreflight, true)
    assert.deepEqual(result.moves, [[100, 100], [200, 100]], `${label} 首通货命中后不应重复移动校验`)
    const selectEvent = result.events.find(e => e.event === 'stash-tab-selection-succeeded')
    assert.equal(selectEvent?.skippedOcr, true)
  }
})

test('批量快照模式按件即时核对：单件空位或低物等自动跳过并继续完成后续物品', () => {
  const batchBlock = block(craftingTemplate, 'BATCH_CATEGORY_NAMES = {', 'def craft_one_item(')
    .replaceAll('{{ENABLE_AFFIX}}', 'True')
    .replaceAll('{{ENABLE_SOCKET}}', 'False')
    .replaceAll('{{ENABLE_ELDRITCH}}', 'False')
    .replaceAll('{{STOP_SHORTCUT}}', 'F10')
    .replaceAll('{{PYNPUT_STOP_SHORTCUT}}', '<f10>')
  const result = runPython(`
import json, unicodedata, builtins, types
is_running = True
fatal_error_reason = None
crafting_kind = "general"
item_position = {"x": 100, "y": 100}
affix_item_level_requirements = [{"name": "T1生命", "level": 84}]
batch_config = {
    "enabled": True, "mode": "snapshot", "batchId": "b1",
    "targets": [
        {"id": "i1", "categoryId": "ring", "baseType": "海灵戒指", "displayName": "空位戒指", "x": 0, "y": 0, "width": 1, "height": 1, "position": {"x": 10, "y": 10}},
        {"id": "i2", "categoryId": "ring", "baseType": "海灵戒指", "displayName": "低物等戒指", "x": 1, "y": 0, "width": 1, "height": 1, "position": {"x": 20, "y": 10}},
        {"id": "i3", "categoryId": "ring", "baseType": "海灵戒指", "displayName": "达标戒指", "x": 2, "y": 0, "width": 1, "height": 1, "position": {"x": 30, "y": 10}},
    ]
}
batch_completed_ids = []
batch_skipped_ids = []
batch_skipped_items = []
batch_auto_scan_total = 0
batch_current_target = None
last_item_skip_info = None
verified_currency_types = set()
events = []
crafted = []
time = types.SimpleNamespace(sleep=lambda _s: None, strftime=lambda _f: "2026-01-01")
keyboard = types.SimpleNamespace(GlobalHotKeys=lambda _m: types.SimpleNamespace(start=lambda: None))
pyperclip = types.SimpleNamespace(copy=lambda _s: None)
def print(msg="", **_kw):
    if str(msg).startswith("EVENT "): events.append(json.loads(msg[6:]))
def is_game_foreground(): return True
def release_all_keys(): pass
def play_error_sound(): pass
def play_success_sound(): pass
def move_mouse(x, y): return True
def select_currency_stash_tab(_m): return True
def preflight_required_currencies(): return True
def fail_item_runtime(reason, code="ERR"): raise AssertionError(f"不应触发全局停止: {code} {reason}")
reads = {
    10: {"error": "未复制到物品"},
    20: {"category": "戒指", "baseName": "海灵戒指", "name": "低物等戒指", "level": 75, "footprint": {"width": 1, "height": 1}},
    30: {"category": "戒指", "baseName": "海灵戒指", "name": "达标戒指", "level": 86, "footprint": {"width": 1, "height": 1}}
}
def read_current_item(**_kw): return reads[item_position["x"]]
def craft_one_item(initial, *_a): crafted.append(initial["name"]); return True
${batchBlock}
ok = start_crafting()
builtins.print(json.dumps({"ok": ok, "crafted": crafted, "completed": batch_completed_ids, "skipped": batch_skipped_ids, "skippedItems": batch_skipped_items, "events": [e["event"] for e in events]}, ensure_ascii=False))
`)
  assert.equal(result.ok, true)
  assert.deepEqual(result.crafted, ['达标戒指'])
  assert.deepEqual(result.completed, ['i3'])
  assert.deepEqual(result.skipped, ['i1', 'i2'])
  assert.equal(result.skippedItems.length, 2)
  assert.ok(result.events.includes('crafting-startup-succeeded'))
  assert.ok(result.events.includes('crafting-batch-item-skipped'))
  assert.ok(result.events.includes('crafting-batch-completed'))
})

test('免切回 auto-scan 模式按列边扫边做、跳过空槽与多格占格并汇总跳过项', () => {
  const batchBlock = block(craftingTemplate, 'BATCH_CATEGORY_NAMES = {', 'def craft_one_item(')
    .replaceAll('{{ENABLE_AFFIX}}', 'True')
    .replaceAll('{{ENABLE_SOCKET}}', 'False')
    .replaceAll('{{ENABLE_ELDRITCH}}', 'False')
    .replaceAll('{{STOP_SHORTCUT}}', 'F10')
    .replaceAll('{{PYNPUT_STOP_SHORTCUT}}', '<f10>')
  const result = runPython(`
import json, unicodedata, builtins, types
is_running = True
fatal_error_reason = None
crafting_kind = "general"
item_position = {"x": 0, "y": 0}
affix_item_level_requirements = [{"name": "T1", "level": 84}]
batch_config = {
    "enabled": True, "mode": "auto-scan", "batchId": "auto-1",
    "categoryIds": ["helmet", "ring"],
    "inventory": {"startPos": {"x": 100, "y": 100}, "slotSize": {"w": 50, "h": 50}}
}
batch_completed_ids = []
batch_skipped_ids = []
batch_skipped_items = []
batch_auto_scan_total = 0
batch_current_target = None
last_item_skip_info = None
verified_currency_types = set()
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
events = []
crafted = []
parsed_calls = []
time = types.SimpleNamespace(sleep=lambda _s: None, strftime=lambda _f: "2026-01-01")
keyboard = types.SimpleNamespace(GlobalHotKeys=lambda _m: types.SimpleNamespace(start=lambda: None))
pyperclip = types.SimpleNamespace(copy=lambda _s: None)
def print(msg="", **_kw):
    if str(msg).startswith("EVENT "): events.append(json.loads(msg[6:]))
def is_game_foreground(): return True
def release_all_keys(): pass
def play_error_sound(): pass
def play_success_sound(): pass
def move_mouse(x, y): return True
def select_currency_stash_tab(_m): return True
def preflight_required_currencies(): return True
def fail_item_runtime(reason, code="ERR"): raise AssertionError(f"不应全局停止: {code} {reason}")
# (0,0) 是 2x2 头盔（应跳过 (0,1)(1,0)(1,1)）；(2,0) 是低物等戒指；(2,1) 是非目标腰带
grid_texts = {
    (100, 100): "HELM_2X2",
    (200, 100): "LOW_RING",
    (200, 150): "BELT_OTHER"
}
grid_parsed = {
    "HELM_2X2": {"category": "头盔", "baseName": "皇家坚盔", "name": "皇家坚盔", "level": 85, "footprint": {"width": 2, "height": 2}},
    "LOW_RING": {"category": "戒指", "baseName": "海灵戒指", "name": "海灵戒指", "level": 70, "footprint": {"width": 1, "height": 1}},
    "BELT_OTHER": {"category": "腰带", "baseName": "重革腰带", "name": "重革腰带", "level": 86, "footprint": {"width": 2, "height": 1}}
}
last_text = {"v": ""}
def capture_clipboard_text(allow_unchanged_text=False):
    text = grid_texts.get((item_position["x"], item_position["y"]), "")
    return text or False
def _dispatch_clipboard_parse(text):
    parsed_calls.append(text)
    last_text["v"] = text
    return len(parsed_calls)
def wait_for_parse_result(_req_id=None): return grid_parsed[last_text["v"]]
def craft_one_item(initial, *_a): crafted.append(initial["name"]); return True
${batchBlock}
ok = start_crafting()
builtins.print(json.dumps({"ok": ok, "crafted": crafted, "parsedCalls": parsed_calls, "completed": batch_completed_ids, "skipped": batch_skipped_ids}, ensure_ascii=False))
`)
  assert.equal(result.ok, true)
  assert.deepEqual(result.crafted, ['皇家坚盔'])
  assert.deepEqual(result.parsedCalls, ['HELM_2X2', 'LOW_RING', 'BELT_OTHER'])
  assert.deepEqual(result.completed, ['auto:0:0'])
  assert.deepEqual(result.skipped, ['auto:2:0'])
})

test('批量配置支持单件排除、免扫描直跑配置校验与跳过断点恢复', () => {
  const inventory = { startPos: { x: 100, y: 100 }, slotSize: { w: 50, h: 50 } }
  const preset = {
    batchCrafting: { enabled: true, categoryIds: ['ring'] },
    moduleTwo: {
      enabled: true,
      mode: 'alteration',
      affixGroups: [{
        id: 'g1',
        name: 'G1',
        enabled: true,
        requiredAffixes: [{
          id: 'c1',
          enabled: true,
          kind: 'keyword',
          keyword: '+生命',
          minTier: 1,
          tiers: [{ tier: 1, requiredLevel: 84 }]
        }],
        selectedAffixes: [],
        selectedCount: 0
      }]
    },
    moduleThree: { enabled: false },
    moduleEldritch: { enabled: false }
  }
  const currencyPositions = { alteration: { x: 10, y: 10 }, transmutation: { x: 20, y: 10 }, scouring: { x: 30, y: 10 }, wisdom: { x: 40, y: 10 } }

  // 无手动扫描快照不再阻断配置校验
  const checkAuto = collectCraftingConfigurationIssues({
    inventory,
    currencyPositions,
    preset,
    batchSnapshot: null,
    batchCandidateCount: 0
  })
  assert.equal(checkAuto.ok, true)

  const autoCfg = buildAutoScanBatchConfiguration({ categoryIds: ['ring'], preset, inventory })
  assert.equal(autoCfg.valid, true)
  assert.equal(autoCfg.config.mode, 'auto-scan')

  // 单件排除过滤
  const snapshot = {
    scanId: 'scan-1',
    items: [
      { id: 'r1', categoryId: 'ring', baseType: '海灵戒指', displayName: '戒指1', x: 0, y: 0, width: 1, height: 1, selectable: true, itemLevel: 85 },
      { id: 'r2', categoryId: 'ring', baseType: '海灵戒指', displayName: '戒指2', x: 1, y: 0, width: 1, height: 1, selectable: true, itemLevel: 70, isCorrupted: true }
    ]
  }
  const frozen = freezeBatchConfiguration({ snapshot, categoryIds: ['ring'], excludedItemIds: ['r2'], preset, inventory })
  assert.equal(frozen.valid, true)
  assert.deepEqual(frozen.config.targets.map(t => t.id), ['r1'])
  assert.match(evaluateBatchItemWarning(snapshot.items[1], preset), /腐化/)

  // 恢复检查点累计 skippedIds
  const store = createBatchRecoveryStore()
  const begun = store.begin({
    ...frozen.config,
    targets: [
      { ...frozen.config.targets[0], id: 'r1' },
      { ...frozen.config.targets[0], id: 'r2', x: 1 }
    ]
  }, 'usage-1')
  assert.equal(begun.valid, true)
  store.applyEvent({ event: 'crafting-batch-item-skipped', batchId: frozen.config.batchId, currentItem: { id: 'r1' } })
  const abnormal = store.markAbnormal({ reason: '失焦', code: 'GAME_NOT_FOREGROUND' })
  assert.equal(abnormal.recoverable, true)
  assert.deepEqual(abnormal.skippedIds, ['r1'])

  // 生成的脚本不包含词缀/插槽完成后的硬编码 time.sleep(2)
  const generated = generatePythonScript({
    globalShortcuts: { end: 'F10' },
    currencyPositions,
    itemPosition: { x: 100, y: 100 },
    preset,
    batchConfig: autoCfg.config,
    filePaths: { itemInfoFile: 'a.txt', itemInfoResultFile: 'b.json' }
  }, craftingTemplate)
  assert.doesNotMatch(generated, /词缀制作完成！"\)\n\s+time\.sleep\(2\)/)
})

test('createOverlayDispatcher 在浮窗就绪前缓冲消息并在加载完成后按序重放', async () => {
  const sent = []
  let shown = false
  const webContents = Object.assign(new EventEmitter(), {
    isLoadingMainFrame: () => true,
    isDestroyed: () => false,
    send: (channel, payload) => sent.push({ channel, payload })
  })
  const fakeWindow = {
    webContents,
    isDestroyed: () => false,
    showInactive: () => { shown = true }
  }
  const dispatcher = createOverlayDispatcher(
    { createOverlayWindow: () => fakeWindow },
    () => fakeWindow,
    { usageSessionId: 'u1', currencyUsage: {} }
  )

  dispatcher.send('update-overlay', { event: 'crafting-batch-item-started', seq: 1 })
  dispatcher.send('python-script-output', { type: 'stdout', data: 'early\n' })
  assert.equal(sent.length, 0)

  webContents.emit('did-finish-load')
  await dispatcher.readyPromise
  assert.equal(shown, true)
  assert.equal(sent.length, 3)
  assert.equal(sent[0].payload.reset, true)
  assert.equal(sent[1].payload.seq, 1)
  assert.equal(sent[2].channel, 'python-script-output')
})

test('自动扫包批量制作异常重试保留批量模式，单件异常重试仍隔离批量模式', async () => {
  const calls = []
  const stores = {
    presetStore: { loadPresets: () => calls.push('preset') },
    settingsStore: { loadSettings: () => calls.push('settings') }
  }
  await retryAutomationWithLatestConfig({
    mode: 'items',
    preserveBatchMode: true,
    usageSessionId: 'usage-auto-batch',
    ...stores,
    startCrafting: options => { calls.push(['auto-batch', options]); return { success: true } },
    startMapRolling: () => { throw new Error('不应执行洗图') }
  })
  await retryAutomationWithLatestConfig({
    mode: 'items',
    preserveBatchMode: false,
    usageSessionId: 'usage-single',
    ...stores,
    startCrafting: options => { calls.push(['single', options]); return { success: true } },
    startMapRolling: () => { throw new Error('不应执行洗图') }
  })
  assert.deepEqual(calls, [
    'preset', 'settings', ['auto-batch', { craftingKind: 'general', forceInitialCheck: true, usageSessionId: 'usage-auto-batch', continueCurrencyUsage: true, configurationGuideBypass: true }],
    'preset', 'settings', ['single', { craftingKind: 'general', forceInitialCheck: true, usageSessionId: 'usage-single', continueCurrencyUsage: true, configurationGuideBypass: true, singleItemOnly: true }]
  ])

  const overlay = readFileSync(new URL('../src/domains/overlay/OverlayView.vue', import.meta.url), 'utf8')
  const pythonIpc = readFileSync(new URL('../electron/modules/ipc/python.js', import.meta.url), 'utf8')
  assert.match(pythonIpc, /batchMode = mode === 'items' && trusted\.generationConfig\?\.batchConfig\?\.enabled/)
  assert.match(pythonIpc, /createOverlayDispatcher\(window, getOverlayWindow, \{ \.\.\.usageSnapshot, batchMode \}\)/)
  assert.match(overlay, /preserveBatchState: true/)
  assert.match(overlay, /preserveBatchMode: isAutoScanBatch\.value/)
})

test('自动扫包与语言归一支持暴击药剂（宝钻药剂）和星团珠宝，首页重启后支持免扫包直跑状态', () => {
  const normalizedCluster = normalizeItemTextLanguage('Item Class: Cluster Jewels\nRarity: Rare\nLarge Cluster Jewel\n--------')
  assert.match(normalizedCluster, /物品类别: 星团珠宝/)

  const categoryBlock = block(craftingTemplate, 'BATCH_CATEGORY_NAMES = {', 'def batch_target_identity_issue(')
  const resolved = runPython(`
import json, unicodedata, builtins
batch_config = {"enabled": True, "mode": "auto-scan"}
${categoryBlock}
builtins.print(json.dumps({
    "diamond": resolve_batch_category_id("暴击药剂"),
    "hybrid": resolve_batch_category_id("混合药剂"),
    "cluster": resolve_batch_category_id("星团珠宝"),
    "clusterEn": resolve_batch_category_id("Cluster Jewels")
}, ensure_ascii=False))
`)
  assert.deepEqual(resolved, { diamond: 'flask', hybrid: 'flask', cluster: 'jewel', clusterEn: 'jewel' })

  const dashboardAuto = evaluateItemsStatus({
    validation: { isValid: true, errors: [] },
    scriptRunning: false,
    batchEnabled: true,
    batchHasSnapshot: false,
    batchCount: 0
  })
  assert.equal(dashboardAuto.state, 'ready')
  assert.deepEqual(dashboardAuto.metrics, [{ label: '批量模式', value: '自动扫包' }])

  const dashboardRunning = evaluateItemsStatus({
    validation: { isValid: true, errors: [] },
    scriptRunning: true,
    scriptMode: 'items',
    batchEnabled: true,
    batchHasSnapshot: false,
    batchProgress: { mode: 'auto-scan', completed: 3, total: 0 }
  })
  assert.match(dashboardRunning.statusText, /自动扫包批量制作中 · 已完成 3 件/)

  const useDashboard = readFileSync(new URL('../src/domains/dashboard/useDashboard.js', import.meta.url), 'utf8')
  assert.doesNotMatch(useDashboard, /请先自行打开角色背包和通货页面，然后扫描背包/)
})

test('auto-scan 遇到非目标类别解析异常时自动跳过，目标类别或汉化变更仍立即停止', () => {
  const batchBlock = block(craftingTemplate, 'BATCH_CATEGORY_NAMES = {', 'def craft_one_item(')
    .replaceAll('{{ENABLE_AFFIX}}', 'True')
    .replaceAll('{{ENABLE_SOCKET}}', 'False')
    .replaceAll('{{ENABLE_ELDRITCH}}', 'False')
    .replaceAll('{{STOP_SHORTCUT}}', 'F10')
    .replaceAll('{{PYNPUT_STOP_SHORTCUT}}', '<f10>')

  const skipNonTarget = runPython(`
import json, unicodedata, builtins, types
is_running = True
fatal_error_reason = None
crafting_kind = "general"
item_position = {"x": 0, "y": 0}
affix_item_level_requirements = []
batch_config = {
    "enabled": True, "mode": "auto-scan", "batchId": "auto-non-target",
    "categoryIds": ["ring"],
    "inventory": {"startPos": {"x": 100, "y": 100}, "slotSize": {"w": 50, "h": 50}}
}
batch_completed_ids = []
batch_skipped_ids = []
batch_skipped_items = []
batch_auto_scan_total = 0
batch_current_target = None
last_item_skip_info = None
verified_currency_types = set()
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
crafted = []
fatal_calls = []
time = types.SimpleNamespace(sleep=lambda _s: None, strftime=lambda _f: "2026-01-01")
keyboard = types.SimpleNamespace(GlobalHotKeys=lambda _m: types.SimpleNamespace(start=lambda: None))
pyperclip = types.SimpleNamespace(copy=lambda _s: None)
def print(*_a, **_kw): pass
def is_game_foreground(): return True
def release_all_keys(): pass
def play_error_sound(): pass
def play_success_sound(): pass
def move_mouse(x, y): return True
def select_currency_stash_tab(_m): return True
def preflight_required_currencies(): return True
def fail_item_runtime(reason, code="ERR"):
    global is_running, fatal_error_reason
    fatal_calls.append({"reason": reason, "code": code})
    fatal_error_reason = reason
    is_running = False
    return False
grid_texts = {
    (150, 250): "物品类别: 可堆叠通货\\n稀 有 度: 通货\\n重铸石\\n--------\\n堆叠数量: 30 / 30",
    (150, 300): "物品类别: 地图碎片\\n稀 有 度: 普通\\n未知圣甲虫\\n--------\\n未匹配说明",
    (200, 100): "物品类别: 戒指\\n稀 有 度: 普通\\n海灵戒指\\n--------\\n物品等级: 85"
}
grid_parsed = {
    grid_texts[(150, 250)]: {"error": "有 2 行中文未匹配当前汉化资源", "errorCode": "LOCALIZATION_UNRESOLVED"},
    grid_texts[(150, 300)]: {"error": "有 1 行中文未匹配当前汉化资源", "errorCode": "LOCALIZATION_UNRESOLVED"},
    grid_texts[(200, 100)]: {"category": "戒指", "baseName": "海灵戒指", "name": "海灵戒指", "level": 85, "footprint": {"width": 1, "height": 1}}
}
last_text = {"v": ""}
def capture_clipboard_text(allow_unchanged_text=False):
    text = grid_texts.get((item_position["x"], item_position["y"]), "")
    return text or False
def _dispatch_clipboard_parse(text):
    last_text["v"] = text
    return 1
def wait_for_parse_result(_req_id=None): return grid_parsed[last_text["v"]]
def craft_one_item(initial, *_a): crafted.append(initial["name"]); return True
${batchBlock}
ok = start_crafting()
builtins.print(json.dumps({"ok": ok, "crafted": crafted, "fatalCalls": fatal_calls}, ensure_ascii=False))
`)
  assert.equal(skipNonTarget.ok, true)
  assert.deepEqual(skipNonTarget.crafted, ['海灵戒指'])
  assert.deepEqual(skipNonTarget.fatalCalls, [])

  const failOnTarget = runPython(`
import json, unicodedata, builtins, types
is_running = True
fatal_error_reason = None
crafting_kind = "general"
item_position = {"x": 0, "y": 0}
affix_item_level_requirements = []
batch_config = {
    "enabled": True, "mode": "auto-scan", "batchId": "auto-target-err",
    "categoryIds": ["ring"],
    "inventory": {"startPos": {"x": 100, "y": 100}, "slotSize": {"w": 50, "h": 50}}
}
batch_completed_ids = []
batch_skipped_ids = []
batch_skipped_items = []
batch_auto_scan_total = 0
batch_current_target = None
last_item_skip_info = None
verified_currency_types = set()
CLIPBOARD_TEXT_UNCHANGED = "__CLIPBOARD_TEXT_UNCHANGED__"
fatal_calls = []
time = types.SimpleNamespace(sleep=lambda _s: None, strftime=lambda _f: "2026-01-01")
keyboard = types.SimpleNamespace(GlobalHotKeys=lambda _m: types.SimpleNamespace(start=lambda: None))
pyperclip = types.SimpleNamespace(copy=lambda _s: None)
def print(*_a, **_kw): pass
def is_game_foreground(): return True
def release_all_keys(): pass
def play_error_sound(): pass
def play_success_sound(): pass
def move_mouse(x, y): return True
def select_currency_stash_tab(_m): return True
def preflight_required_currencies(): return True
def fail_item_runtime(reason, code="ERR"):
    global is_running, fatal_error_reason
    fatal_calls.append({"reason": reason, "code": code})
    fatal_error_reason = reason
    is_running = False
    return False
grid_texts = {
    (100, 100): "物品类别: 戒指\\n稀 有 度: 稀有\\n测试戒指\\n--------\\n未匹配词缀"
}
def capture_clipboard_text(allow_unchanged_text=False):
    text = grid_texts.get((item_position["x"], item_position["y"]), "")
    return text or False
def _dispatch_clipboard_parse(text): return 1
def wait_for_parse_result(_req_id=None): return {"error": "未匹配词缀", "errorCode": "LOCALIZATION_UNRESOLVED"}
def craft_one_item(initial, *_a): return True
${batchBlock}
ok = start_crafting()
builtins.print(json.dumps({"ok": ok, "fatalCalls": fatal_calls}, ensure_ascii=False))
`)
  assert.equal(failOnTarget.ok, false)
  assert.equal(failOnTarget.fatalCalls.length, 1)
  assert.equal(failOnTarget.fatalCalls[0].code, 'LOCALIZATION_UNRESOLVED')
})
