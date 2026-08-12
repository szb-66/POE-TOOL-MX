import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_STASH_TAB_NAMES,
  STASH_TAB_TYPES,
  createDefaultStashTabSelection,
  normalizeStashTabSelection,
  validateStashTabSelection
} from '../src/utils/stashTabSelection.js'
import { resolveCraftingPython } from '../electron/modules/python/launcher.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('仓库页配置为十一种官方类型且旧设置默认关闭', () => {
  const defaults = createDefaultStashTabSelection()
  assert.equal(STASH_TAB_TYPES.length, 11)
  assert.equal(defaults.enabled, false)
  assert.equal(defaults.hasScrollbar, false)
  assert.equal(defaults.rootRegion, null)
  assert.deepEqual(defaults.names, DEFAULT_STASH_TAB_NAMES)
  assert.equal(defaults.names.currency, '通货')
})

test('配置迁移保留有效名称与物理框选元数据并补齐缺省映射', () => {
  const migrated = normalizeStashTabSelection({
    enabled: true,
    hasScrollbar: true,
    names: { currency: ' 通货2 ', blight: '旧寄生菌草页' },
    rootRegion: {
      x: 61.4, y: 20.6, width: 188.9, height: 640.2,
      displayId: 7, scaleFactor: 1.5,
      displayPhysicalBounds: { x: 0, y: 0, width: 3840, height: 2160 },
      capturedAt: '2026-08-01T00:00:00.000Z'
    }
  })
  assert.equal(migrated.names.currency, '通货2')
  assert.equal(migrated.names.gems, '宝石')
  assert.equal('blight' in migrated.names, false)
  assert.deepEqual(migrated.rootRegion, {
    x: 61, y: 21, width: 189, height: 640,
    displayId: '7', scaleFactor: 1.5,
    displayPhysicalBounds: { x: 0, y: 0, width: 3840, height: 2160 },
    capturedAt: '2026-08-01T00:00:00.000Z'
  })
})

test('实际名称输入会在键入时回写受控值', () => {
  const source = readFileSync(
    path.join(projectRoot, 'src', 'domains', 'settings', 'StashTabSelectionSettings.vue'),
    'utf8'
  )
  const mappingInput = source.match(
    /<el-input\s+v-for="definition in STASH_TAB_TYPES"[\s\S]*?<\/el-input>/
  )?.[0]

  assert.ok(mappingInput, '缺少仓库实际名称映射输入框')
  assert.match(
    mappingInput,
    /@update:model-value="updateName\(definition\.key, \$event\)"/,
    '受控输入必须在 update:modelValue 时同步配置，否则键入内容会被旧值覆盖'
  )
})

test('功能开启时必须具有根目录区域，关闭时保持兼容', () => {
  assert.equal(validateStashTabSelection({ enabled: false }).valid, true)
  const enabled = validateStashTabSelection({ enabled: true })
  assert.equal(enabled.valid, false)
  assert.match(enabled.error, /框选/)
})

test('OCR 依赖只在仓库页自动选择开启时加入制作解释器探测', () => {
  const calls = []
  const python = { detectPythonPathWithModules(modules) { calls.push(modules); return 'python' } }
  resolveCraftingPython(python, false)
  resolveCraftingPython(python, true)
  assert.deepEqual(calls[0], ['pynput', 'pyperclip'])
  assert.deepEqual(calls[1], ['pynput', 'pyperclip', 'rapidocr', 'onnxruntime', 'cv2', 'mss', 'numpy'])
})

test('物品与地图模板均严格先选择仓库页再执行通货预检', () => {
  for (const filename of ['crafting_template.py', 'map_rolling_template.py']) {
    const source = readFileSync(path.join(projectRoot, 'src/assets/scripts', filename), 'utf8')
    const call = source.lastIndexOf('if not select_currency_stash_tab(')
    const preflight = source.lastIndexOf('if not preflight_required_currencies():')
    assert.ok(call > 0, `${filename} 缺少仓库页选择调用`)
    assert.ok(preflight > call, `${filename} 必须先选仓库页再预检`)
    assert.match(source, /stash-tab-selection-succeeded/)
    assert.match(source, /stash-tab-selection-failed/)
  }
})

test('仓库页选择器在截图、滚动和点击前重复验证游戏前台', () => {
  const source = readFileSync(path.join(projectRoot, 'src/assets/scripts/stash_tab_selector.py'), 'utf8')
  assert.match(source, /def capture\(self\)[\s\S]*?self\.require_environment\(\)[\s\S]*?capture\.grab/)
  assert.match(source, /def scroll\(self, notches[\s\S]*?self\._position_mouse\(\)[\s\S]*?self\.require_environment\(\)[\s\S]*?\.scroll/)
  assert.match(source, /self\.require_environment\(\)\s*mouse\.position[\s\S]*?self\.require_environment\(\)\s*mouse\.press[\s\S]*?mouse\.release/)
})

test('制作模板持续排空 OCR 输出并对仓库选择设置硬超时', () => {
  for (const filename of ['crafting_template.py', 'map_rolling_template.py']) {
    const source = readFileSync(path.join(projectRoot, 'src/assets/scripts', filename), 'utf8')
    const start = source.indexOf('def select_currency_stash_tab(mode):')
    const end = source.indexOf('CURRENCY_NAMES =', start)
    const selectorCall = source.slice(start, end)

    assert.ok(start > 0 && end > start, `${filename} 缺少仓库选择器调用`)
    assert.doesNotMatch(
      selectorCall,
      /stdout=subprocess\.PIPE,\s*stderr=subprocess\.PIPE/,
      `${filename} 不得在轮询退出时让 OCR 日志堵塞匿名管道`
    )
    assert.match(selectorCall, /selector_output_path/, `${filename} 应将本次 OCR 输出持续写入诊断文件`)
    assert.match(selectorCall, /selector_timeout_seconds/, `${filename} 应为选择器设置硬超时`)
  }
})

function runSelectorParent(filename, childSource, timeoutOverride = null) {
  const source = readFileSync(path.join(projectRoot, 'src/assets/scripts', filename), 'utf8')
  const start = source.indexOf('def select_currency_stash_tab(mode):')
  const end = source.indexOf('CURRENCY_NAMES =', start)
  let selectorCall = source.slice(start, end)
  if (timeoutOverride !== null) {
    selectorCall = selectorCall.replace(
      /selector_timeout_seconds = .*$/m,
      `selector_timeout_seconds = ${timeoutOverride}`
    )
  }
  const code = `
import json, os, sys, tempfile, time
TIMING_MODE = "fixed"
STASH_TAB_SETTLE_SECONDS = 0.25
SELECTOR_PROCESS_POLL_INTERVAL_SECONDS = 0.05
${selectorCall}
is_running = True
fatal_error_reason = None
stash_tab_selection = {
    "enabled": True, "hasScrollbar": False,
    "names": {"currency": "通货"}
}
events = []
def release_all_keys(): events.append("release")
def play_error_sound(): events.append("sound")
with tempfile.TemporaryDirectory(prefix="stash-selector-parent-") as root:
    __file__ = os.path.join(root, "crafting.py")
    stash_tab_selector_path = os.path.join(root, "noisy_selector.py")
    with open(stash_tab_selector_path, "w", encoding="utf-8") as handle:
        handle.write(${JSON.stringify(childSource)})
    selected = select_currency_stash_tab("items")
    print(json.dumps({"selected": bool(selected), "fatal": fatal_error_reason, "events": events}, ensure_ascii=False))
`
  const pythonPath = path.join(projectRoot, '.runtime', 'python-runtime', 'python.exe')
  const result = spawnSync(existsSync(pythonPath) ? pythonPath : 'python', ['-c', code], {
    encoding: 'utf8', timeout: 6000,
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(result.status, 0, `${filename}: ${result.error || ''}\n${result.stderr}`)
  return JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
}

test('大量 OCR 初始化日志不会堵塞制作父进程', () => {
  const noisySuccess = `
import json, sys
sys.stderr.write("x" * 262144 + "\\n")
sys.stderr.flush()
print("RESULT " + json.dumps({"success": True, "targetName": "通货", "scrollStep": 0}, ensure_ascii=False), flush=True)
`
  for (const filename of ['crafting_template.py', 'map_rolling_template.py']) {
    const result = runSelectorParent(filename, noisySuccess)
    assert.equal(result.selected, true, filename)
    assert.equal(result.fatal, null, filename)
  }
})

test('OCR 子进程不返回时在硬超时后失败关闭', () => {
  const result = runSelectorParent('crafting_template.py', 'import time\ntime.sleep(5)\n', 0.2)
  assert.equal(result.selected, false)
  assert.match(result.fatal, /识别超过 0 秒/)
  assert.deepEqual(result.events, ['release', 'sound'])
})

test('仓库页配置注入后的两类 Python 模板保持可解析且关闭路径直接放行', () => {
  const pythonPath = path.join(projectRoot, '.runtime', 'python-runtime', 'python.exe')
  if (!existsSync(pythonPath)) return
  const common = {
    GEN_DATE: 'test', DPI_AWARENESS: '', ITEM_INFO_FILE: 'item.txt', ITEM_INFO_RESULT_FILE: 'result.json',
    DELAY_MOUSE_MOVE: '0.08', DELAY_CLIPBOARD: '80',
    TIMING_MODE: 'adaptive',
    MODIFIER_SETTLE_MS: '50', KEY_HOLD_MS: '20', BUTTON_HOLD_MS: '20', RELEASE_SETTLE_MS: '20',
    ADAPTIVE_TIMEOUT_MS: '1000',
    CLIPBOARD_CONFIRM_MS: '250', STASH_TAB_SETTLE_MS: '250', STASH_SETTLE_MS: '200',
    CURRENCY_POSITIONS: '{}', REQUIRED_CURRENCY_TYPES: '[]', DPI_SCALE_FACTOR: '1',
    STOP_SHORTCUT: 'Alt+3', PYNPUT_STOP_SHORTCUT: '<alt>+3',
    STASH_TAB_SELECTION_JSON: JSON.stringify(JSON.stringify({ enabled: false, names: { currency: '通货' } }))
  }
  const variants = [
    ['crafting_template.py', {
      ...common,
      ITEM_POSITION: "{'x': 1, 'y': 1}",
      ENABLE_AFFIX: 'False',
      ENABLE_ELDRITCH: 'False',
      ENABLE_SOCKET: 'False',
      AFFIX_CRAFTING_FUNC: 'def craft_affixes():\n    return True',
      ELDRITCH_CRAFTING_FUNC: 'def craft_eldritch_implicits():\n    return True',
      SOCKET_CRAFTING_FUNC: 'def craft_sockets():\n    return True'
    }],
    ['map_rolling_template.py', { ...common, GRID_CONFIG: "{'rows': 5, 'cols': 12, 'startX': 1, 'startY': 1, 'offsetX': 1, 'offsetY': 1}", MAP_CONFIG: '{}' }]
  ]
  for (const [filename, replacements] of variants) {
    let generated = readFileSync(path.join(projectRoot, 'src/assets/scripts', filename), 'utf8')
    for (const [key, value] of Object.entries(replacements)) generated = generated.split(`{{${key}}}`).join(value)
    assert.doesNotMatch(generated, /\{\{[A-Z0-9_]+\}\}/)
    assert.match(generated, /if not stash_tab_selection\.get\("enabled"\):\s+return True/)
    const parsed = spawnSync(pythonPath, ['-c', 'import ast,sys; ast.parse(sys.stdin.read())'], {
      input: generated, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' }
    })
    assert.equal(parsed.status, 0, `${filename}: ${parsed.stderr}`)
  }
})

test('独立选择器纯逻辑、滚动序列与真实截图 OCR', { timeout: 120000 }, (t) => {
  const pythonPath = path.join(projectRoot, '.runtime', 'python-runtime', 'python.exe')
  if (!existsSync(pythonPath)) return t.skip('尚未准备内置 Python 运行时')
  const check = spawnSync(pythonPath, [
    path.join(projectRoot, 'test', 'python', 'stash_tab_selector_checks.py'),
    path.join(projectRoot, 'src', 'assets', 'scripts', 'stash_tab_selector.py'),
    path.join(projectRoot, 'test', 'fixtures', 'stash-tabs', 'with-scrollbar.png'),
    path.join(projectRoot, 'test', 'fixtures', 'stash-tabs', 'without-scrollbar.png')
  ], {
    encoding: 'utf8', timeout: 110000,
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', OC_DISABLE_DOT_ACCESS_WARNING: '1' }
  })
  assert.equal(check.status, 0, `${check.stdout}\n${check.stderr}`)
  const report = JSON.parse(check.stdout.trim().split(/\r?\n/).at(-1))
  assert.equal(report.withScrollbar.currency, 1)
  assert.equal(report.withScrollbar.currency2, 1)
  assert.equal(report.withoutScrollbar.currency, 1)
  assert.equal(report.withoutScrollbar.currency2, 1)
  assert.equal(report.withScrollbar.currencyBoxes.length, 2)
  assert.equal(report.withoutScrollbar.currencyBoxes.length, 2)
  assert.equal(report.pureChecks, true)
})
