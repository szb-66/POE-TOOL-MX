import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { writeClipboardText as _m0_writeClipboardText } from '../electron/modules/clipboardWriter.js'
import { writeTextToClipboard as _m0_writeTextToClipboard } from '../src/utils/clipboardWriter.js'
import { generateVendorRegex as _m0_generateVendorRegex } from '../src/domains/regex/vendorRegex.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import _m1_fs from 'node:fs'
import { EventEmitter as _m1_EventEmitter } from 'node:events'
import { EmergencyStopCoordinator as _m1_EmergencyStopCoordinator } from '../electron/modules/automation/emergencyStop.js'
import { stopPythonProcess as _m1_stopPythonProcess } from '../electron/modules/python/process.js'
import { isEmergencyCancellation as _m1_isEmergencyCancellation } from '../src/utils/emergencyStopResult.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { readFileSync as _m2_readFileSync } from 'node:fs'
import { filterFeatureShortcuts as _m2_filterFeatureShortcuts, shortcutFeatureId as _m2_shortcutFeatureId } from '../src/features/featureCatalog.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { readFileSync as _m3_readFileSync } from 'node:fs'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { interpretCaptureEvent as _m4_interpretCaptureEvent, keyboardEventToAccelerator as _m4_keyboardEventToAccelerator, keyboardEventToActionKey as _m4_keyboardEventToActionKey } from '../src/utils/keyCapture.js'
import { validateShortcuts as _m4_validateShortcuts } from '../src/utils/shortcutValidator.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { readFileSync as _m5_readFileSync } from 'node:fs'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { dispatchReloadAction as _m6_dispatchReloadAction, getReloadAction as _m6_getReloadAction } from '../electron/modules/window/refreshShortcut.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { readFileSync as _m7_readFileSync } from 'node:fs'
import { AutomationLock as _m7_AutomationLock } from '../electron/modules/automation/lock.js'
import { CHAOS_CONTROL_DIP_SIZE as _m7_CHAOS_CONTROL_DIP_SIZE, CHAOS_CONTROL_MARGIN as _m7_CHAOS_CONTROL_MARGIN, clampControlPhysicalBounds as _m7_clampControlPhysicalBounds, normalizeControlDipSize as _m7_normalizeControlDipSize, normalizeControlOffset as _m7_normalizeControlOffset, placeControlInDip as _m7_placeControlInDip } from '../electron/modules/chaosRecipe/controlOverlayPosition.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import _m8_fs from 'node:fs'
import { DEFAULT_GLOBAL_SHORTCUTS as _m8_DEFAULT_GLOBAL_SHORTCUTS, dispatchShortcutAction as _m8_dispatchShortcutAction, mergeGlobalShortcutSettings as _m8_mergeGlobalShortcutSettings, normalizeGlobalShortcutSettings as _m8_normalizeGlobalShortcutSettings } from '../src/utils/shortcutConfig.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import _m9_assertLoose from 'node:assert'
import { readFileSync as _m9_readFileSync } from 'node:fs'
import { EventEmitter as _m9_EventEmitter } from 'node:events'
import _m9_vm from 'node:vm'
import { DIAGNOSTIC_OPERATIONS as _m9_DIAGNOSTIC_OPERATIONS, DIAGNOSTIC_REASON_CODES as _m9_DIAGNOSTIC_REASON_CODES } from '../electron/modules/system/diagnostics.js'
import { createEventLineParser as _m9_createEventLineParser } from '../electron/modules/system/foregroundWatcher.js'

// === Merged from clipboardWriter.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const writeClipboardText = _m0_writeClipboardText
  const writeTextToClipboard = _m0_writeTextToClipboard
  const generateVendorRegex = _m0_generateVendorRegex
test('Electron 剪贴板适配器只写入收到的非空文本', () => {
  const written = []
  assert.deepEqual(writeClipboardText('r-g-b', { writeText: value => written.push(value) }), { success: true })
  assert.deepEqual(written, ['r-g-b'])
  assert.throws(() => writeClipboardText('', { writeText() {} }), /非空文本/)
  assert.throws(() => writeClipboardText('x'), /不可用/)
})

test('前端优先使用 Electron，并支持浏览器成功与失败传播', async () => {
  const electronWritten = []
  const browserWritten = []
  await writeTextToClipboard('electron', {
    electronWrite: async value => electronWritten.push(value),
    browserClipboard: { writeText: async value => browserWritten.push(value) }
  })
  assert.deepEqual(electronWritten, ['electron'])
  assert.deepEqual(browserWritten, [])

  await writeTextToClipboard('browser', { browserClipboard: { writeText: async value => browserWritten.push(value) } })
  assert.deepEqual(browserWritten, ['browser'])
  await assert.rejects(() => writeTextToClipboard('x', { browserClipboard: { writeText: async () => { throw new Error('denied') } } }), /denied/)
  await assert.rejects(() => writeTextToClipboard('', {}), /没有可复制/)
})

test('改变 Vendor 选项只生成结果，不会调用剪贴板', () => {
  let writes = 0
  const result = generateVendorRegex({ movement: { mode: 'include', selectedIds: ['movement_10'] } })
  assert.ok(result.regex)
  assert.equal(writes, 0)
})
})()

// === Merged from emergencyStop.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const fs = _m1_fs
  const EventEmitter = _m1_EventEmitter
  const EmergencyStopCoordinator = _m1_EmergencyStopCoordinator
  const stopPythonProcess = _m1_stopPythonProcess
  const isEmergencyCancellation = _m1_isEmergencyCancellation
const source = relative => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8')

test('统一紧急停止并行调用全部停止项并汇总实际停止项', async () => {
  const calls = []
  let releaseFirst
  const firstPending = new Promise(resolve => { releaseFirst = resolve })
  const coordinator = new EmergencyStopCoordinator([
    {
      id: 'script', label: '制作/地图', stop: async reason => {
        calls.push(['script', reason])
        await firstPending
        return { success: true, stopped: true }
      }
    },
    {
      id: 'potion', label: '自动喝药', stop: reason => {
        calls.push(['potion', reason])
        return { success: true, stopped: true }
      }
    },
    {
      id: 'idle', label: '空闲任务', stop: reason => {
        calls.push(['idle', reason])
        return { success: true, stopped: false }
      }
    }
  ])

  const first = coordinator.stopAll('shortcut')
  const second = coordinator.stopAll('shortcut')
  assert.equal(first, second)
  await Promise.resolve()
  assert.deepEqual(calls, [
    ['script', 'shortcut'],
    ['potion', 'shortcut'],
    ['idle', 'shortcut']
  ])
  releaseFirst()

  assert.deepEqual(await first, {
    success: true,
    stopped: [
      { id: 'script', label: '制作/地图' },
      { id: 'potion', label: '自动喝药' }
    ],
    failed: []
  })
})

test('统一紧急停止在单项失败时继续停止其他任务', async () => {
  let completed = false
  const coordinator = new EmergencyStopCoordinator([
    { id: 'script', label: '制作/地图', stop: () => { throw new Error('终止失败') } },
    { id: 'potion', label: '自动喝药', stop: () => { completed = true; return { success: true, stopped: true } } },
    { id: 'loop', label: '主动循环', stop: () => ({ success: false, error: '进程仍在运行' }) }
  ])

  const result = await coordinator.stopAll()
  assert.equal(completed, true)
  assert.equal(result.success, false)
  assert.deepEqual(result.stopped, [{ id: 'potion', label: '自动喝药' }])
  assert.deepEqual(result.failed, [
    { id: 'script', label: '制作/地图', error: '终止失败' },
    { id: 'loop', label: '主动循环', error: '进程仍在运行' }
  ])
})

test('统一紧急停止会终止运行中的浮士德并计入停止结果', async () => {
  const calls = []
  const coordinator = new EmergencyStopCoordinator([
    {
      id: 'faustus',
      label: '浮士德分段改价',
      stop: reason => {
        calls.push(reason)
        return { success: true, stopped: true }
      }
    }
  ])

  const result = await coordinator.stopAll('shortcut')
  assert.deepEqual(calls, ['shortcut'])
  assert.deepEqual(result.stopped, [{ id: 'faustus', label: '浮士德分段改价' }])
  assert.deepEqual(result.failed, [])
})

test('end 快捷键接入全自动化停止并保留前台作用域配置', () => {
  const scriptService = source('src/utils/scriptService.js')
  const emergencyIpc = source('electron/modules/ipc/emergencyStop.js')
  const preload = source('electron/preload.cjs')
  const shortcutManager = source('electron/modules/shortcuts/manager.js')

  assert.match(scriptService, /end:\s*emergencyStopAll/)
  assert.doesNotMatch(scriptService, /end:\s*stopCrafting/)
  assert.doesNotMatch(scriptService, /chaosRecipeStart:|chaosRecipePause:|chaosRecipeStop:/)
  assert.match(emergencyIpc, /managerAction\('chaos-recipe', '混沌配方取件', chaosRecipe\?\.automation, \['running', 'paused'\]\)/)
  for (const id of ['script', 'batch-inventory-scan', 'bag-stash', 'stash-pickup', 'junfeng', 'faustus', 'chaos-recipe', 'potion', 'combat-loop', 'portal', 'puzzle']) {
    assert.match(emergencyIpc, new RegExp(`['"]${id}['"]`))
  }
  assert.match(preload, /emergencyStopAll:\s*\(\) => ipcRenderer\.invoke\('emergency-stop-all'\)/)
  assert.match(shortcutManager, /setScopeActive/)
})

test('全局紧急停止 IPC 只接受主窗口调用', () => {
  const emergencyIpc = source('electron/modules/ipc/emergencyStop.js')
  const ipcIndex = source('electron/modules/ipc/index.js')

  assert.match(emergencyIpc, /event\.sender !== mainWindow\.webContents/)
  assert.match(emergencyIpc, /ipcMain\.handle\('emergency-stop-all', \(event\)/)
  assert.match(ipcIndex, /registerEmergencyStopHandlers\(\{[^}]*getMainWindow/s)
})

test('海图紧急停止同时覆盖识别、词缀探测与自动放入', () => {
  const puzzle = source('electron/modules/puzzle/service.js')
  assert.match(puzzle, /emergencyStop\(reason = 'shortcut'\)/)
  assert.match(puzzle, /terminate\(this\.child\)/)
  assert.match(puzzle, /terminate\(this\.modProbeChild\)/)
  assert.match(puzzle, /this\.stopAutoPlacement\(reason\)/)
  assert.match(puzzle, /code: canceled \? 'EMERGENCY_STOPPED'/)
})

test('制作进程仅在确认退出后才汇报停止成功', async () => {
  const child = Object.assign(new EventEmitter(), {
    pid: 123,
    exitCode: null,
    signalCode: null,
    kill: () => false
  })

  assert.equal(await stopPythonProcess(child, {
    killTree: async () => false,
    gracefulTimeoutMs: 0,
    forceTimeoutMs: 0
  }), false)

  child.kill = () => {
    child.signalCode = 'SIGTERM'
    child.emit('exit', null, 'SIGTERM')
    return true
  }
  assert.equal(await stopPythonProcess(child, {
    killTree: async () => false,
    gracefulTimeoutMs: 0,
    forceTimeoutMs: 0
  }), true)

  const pythonIpc = source('electron/modules/ipc/python.js')
  assert.doesNotMatch(pythonIpc, /currentScriptProcess\.killed \|\| currentScriptProcess\.exitCode/)
  assert.match(pythonIpc, /currentScriptProcess\.exitCode !== null \|\| currentScriptProcess\.signalCode !== null/)
})

test('海图取消代次在每个新输入阶段前门禁且迟到关闭不覆盖新进程', () => {
  const puzzle = source('electron/modules/puzzle/service.js')
  assert.match(puzzle, /for \(const \[pageIndex, currentPage\] of requestedPages\.entries\(\)\) \{\s*this\.assertCurrentGeneration\(stopGeneration, '海图识别已紧急停止'\)[\s\S]*?const result = await this\.runAnalyzer/)
  assert.match(puzzle, /this\.assertCurrentGeneration\(stopGeneration, '海图识别已紧急停止'\)\s*const mods = probeMods/)
  assert.match(puzzle, /if \(this\.modProbeChild === child\) this\.modProbeChild = null/)
  const stopBody = puzzle.match(/emergencyStop\(reason = 'shortcut'\) \{([\s\S]*?)\n  \}/)?.[1] || ''
  assert.doesNotMatch(stopBody, /this\.modProbeChild = null/)
  assert.doesNotMatch(stopBody, /release\(MOD_PROBE_OWNER\)/)
})

test('紧急取消只由统一停止入口汇总提示', () => {
  assert.equal(isEmergencyCancellation({ canceled: true }), true)
  assert.equal(isEmergencyCancellation({ error: { code: 'EMERGENCY_STOPPED' } }), true)
  assert.equal(isEmergencyCancellation({ error: { code: 'PUZZLE_ANALYSIS_FAILED' } }), false)

  const scriptService = source('src/utils/scriptService.js')
  const puzzleStore = source('src/stores/puzzle.js')
  const puzzleView = source('src/domains/puzzle/PuzzleView.vue')
  assert.match(scriptService, /if \(isEmergencyCancellation\(result\)\) return result/)
  assert.match(puzzleStore, /if \(isEmergencyCancellation\(response\)\) return response/)
  assert.match(puzzleView, /if \(isEmergencyCancellation\(response\)\) return/)
})
})()

// === Merged from featureShortcutFiltering.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const readFileSync = _m2_readFileSync
  const filterFeatureShortcuts = _m2_filterFeatureShortcuts
  const shortcutFeatureId = _m2_shortcutFeatureId
const shortcuts = {
  itemStart: 'F1', mapStart: 'F2', end: 'F3', portal: 'F4',
  storyPrevious: 'F5', storyNext: 'F6', priceCheck: 'F10'
}

test('停用模块的专属快捷键被过滤且紧急停止始终保留', () => {
  const disabled = new Set(['items', 'story', 'recipe', 'price-check'])
  const result = filterFeatureShortcuts(shortcuts, id => !disabled.has(id))
  assert.deepEqual(result, { mapStart: 'F2', end: 'F3', portal: 'F4' })
  assert.equal(shortcutFeatureId('storyNext'), 'story')
  assert.equal(shortcutFeatureId('chaosRecipeStart'), null)
  assert.equal(shortcutFeatureId('end'), null)
})

test('快捷键注册和触发分发均执行模块门禁', () => {
  const service = readFileSync(new URL('../src/utils/scriptService.js', import.meta.url), 'utf8')
  assert.match(service, /filterFeatureShortcuts\(shortcuts, id => featureStore\.isEnabled\(id\)\)/)
  assert.match(service, /shortcutFeatureId\(accelerator\)/)
  assert.match(service, /!useFeatureModulesStore\(\)\.isEnabled\(featureId\)/)
  assert.match(service, /end: emergencyStopAll/)
})

test('查价设置与直接执行入口在模块停用时拒绝启动', () => {
  const store = readFileSync(new URL('../src/stores/priceCheck.js', import.meta.url), 'utf8')
  assert.match(store, /enabled && !useFeatureModulesStore\(\)\.isEnabled\('price-check'\)/)
  assert.match(store, /async function checkHoveredItem[\s\S]*!useFeatureModulesStore\(\)\.isEnabled\('price-check'\)/)
})
})()

// === Merged from inputTiming.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const readFileSync = _m3_readFileSync
const scripts = {
  bag: new URL('../src/assets/scripts/bag_auto_stash_template.py', import.meta.url),
  stashPickup: new URL('../src/assets/scripts/stash_pickup_template.py', import.meta.url),
  chaosRecipe: new URL('../src/assets/scripts/chaos_recipe_pick_template.py', import.meta.url),
  mapRolling: new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url),
  crafting: new URL('../src/assets/scripts/crafting_template.py', import.meta.url)
}

const source = (key) => readFileSync(scripts[key], 'utf8')

test('五个自动化脚本定义一致的内部固定时序常量', () => {
  const placeholderKeys = ['mapRolling', 'crafting']
  const runtimeKeys = ['bag', 'chaosRecipe', 'stashPickup']
  for (const key of placeholderKeys) {
    const content = source(key)
    assert.match(content, /MODIFIER_SETTLE_SECONDS = float\({{MODIFIER_SETTLE_MS}}\) \/ 1000\.0/, `${key} 缺少组合键稳定占位符`)
    assert.match(content, /KEY_HOLD_SECONDS = float\({{KEY_HOLD_MS}}\) \/ 1000\.0/, `${key} 缺少按键保持占位符`)
    assert.match(content, /BUTTON_HOLD_SECONDS = float\({{BUTTON_HOLD_MS}}\) \/ 1000\.0/, `${key} 缺少鼠标保持占位符`)
    assert.match(content, /RELEASE_SETTLE_SECONDS = float\({{RELEASE_SETTLE_MS}}\) \/ 1000\.0/, `${key} 缺少释放稳定占位符`)
    assert.match(content, /CLIPBOARD_RESPONSE_MIN_SECONDS = float\({{CLIPBOARD_CONFIRM_MS}}\) \/ 1000\.0/, `${key} 缺少剪贴板确认占位符`)
    assert.match(content, /STASH_TAB_SETTLE_SECONDS = float\({{STASH_TAB_SETTLE_MS}}\) \/ 1000\.0/, `${key} 缺少选仓等待占位符`)
    assert.match(content, /STASH_SETTLE_SECONDS = float\({{STASH_SETTLE_MS}}\) \/ 1000\.0/, `${key} 缺少存仓等待占位符`)
  }
  for (const key of runtimeKeys) {
    const content = source(key)
    assert.match(content, /MODIFIER_SETTLE_SECONDS\s*=\s*0\.02/, `${key} 缺少组合键稳定默认值`)
    assert.match(content, /KEY_HOLD_SECONDS\s*=\s*0\.015/, `${key} 缺少按键保持默认值`)
    assert.match(content, /BUTTON_HOLD_SECONDS\s*=\s*0\.015/, `${key} 缺少鼠标保持默认值`)
    assert.match(content, /RELEASE_SETTLE_SECONDS\s*=\s*0\.01/, `${key} 缺少释放稳定默认值`)
    assert.match(content, /def apply_fixed_timing\(config\):/, `${key} 缺少固定时序应用函数`)
  }
  assert.match(source('bag'), /CLIPBOARD_RESPONSE_MIN_SECONDS\s*=\s*0\.01/)
  assert.match(source('chaosRecipe'), /CLIPBOARD_RESPONSE_MIN_SECONDS\s*=\s*0\.01/)
})

test('制作与地图脚本在固定等待后只检查一次剪贴板', () => {
  for (const key of ['mapRolling', 'crafting']) {
    const content = source(key)
    assert.match(content, /def wait_for_clipboard_change\(before_seq, before_text, timeout_seconds, allow_unchanged_text=False\):/)
    assert.match(content, /def clipboard_changed\(before_seq, before_text, allow_unchanged_text=False\):/)
    assert.match(content, /time\.sleep\(max\(0\.0, timeout_seconds\)\)/)
    assert.doesNotMatch(content, /TIMING_MODE|ADAPTIVE_TIMEOUT|CLIPBOARD_POLL_INTERVAL_SECONDS/)
  }
})

test('背包 Ctrl+C 与 Ctrl+点击均满足 Ctrl 先按下、最后释放', () => {
  const content = source('bag')
  const beginCtrl = content.slice(content.indexOf('def begin_ctrl(self):'), content.indexOf('def move(self, x, y):'))
  const sendCopy = content.slice(content.indexOf('def _send_copy(self, ctrl_held=False):'), content.indexOf('def _copy_item_text_once(self, ctrl_held=False):'))
  const clickWithCtrl = content.slice(content.indexOf('def click_with_ctrl(self):'), content.indexOf('def ctrl_click(self):'))
  const ctrlClick = content.slice(content.indexOf('def ctrl_click(self):'), content.indexOf('def transfer_item_once(controller):'))
  assert.match(beginCtrl, /self\.press_key\(Key\.ctrl\)/)
  assert.ok(sendCopy.indexOf('self.begin_ctrl()') < sendCopy.indexOf('self.press_key("c")'))
  assert.ok(sendCopy.indexOf('self.release_key("c")') < sendCopy.indexOf('self.release_key(Key.ctrl)'))
  assert.ok(clickWithCtrl.indexOf('self.begin_ctrl()') < clickWithCtrl.indexOf('self.press_button(Button.left)'))
  assert.ok(clickWithCtrl.indexOf('self.press_button(Button.left)') < clickWithCtrl.indexOf('self.release_button(Button.left)'))
  assert.ok(ctrlClick.indexOf('self.click_with_ctrl()') < ctrlClick.indexOf('self.release_key(Key.ctrl)'))
})

test('混沌配方取件 Ctrl+C 与 Ctrl+点击均满足 Ctrl 先按下、最后释放', () => {
  const content = source('chaosRecipe')
  const copyItem = content.slice(content.indexOf('def copy_item(self):'), content.indexOf('def ctrl_click(self):'))
  assert.ok(copyItem.indexOf('self.keyboard.press(Key.ctrl)') < copyItem.indexOf('self.keyboard.press("c")'))
  assert.ok(copyItem.indexOf('self.keyboard.release("c")') < copyItem.indexOf('self.keyboard.release(Key.ctrl)'))
  const ctrlClick = content.slice(content.indexOf('def ctrl_click(self):'), content.indexOf('def transfer_item('))
  assert.ok(ctrlClick.indexOf('self.keyboard.press(Key.ctrl)') < ctrlClick.indexOf('self.mouse.press(Button.left)'))
  assert.ok(ctrlClick.indexOf('self.mouse.release(Button.left)') < ctrlClick.indexOf('self.keyboard.release(Key.ctrl)'))
})

test('地图洗练 Ctrl+C 与存仓点击满足 Ctrl 先按下、最后释放', () => {
  const content = source('mapRolling')
  const sendCopy = content.slice(content.indexOf('def send_copy_command('), content.indexOf('def read_clipboard_to_file('))
  assert.ok(sendCopy.indexOf('keyboard_controller.press(Key.ctrl)') < sendCopy.indexOf("keyboard_controller.press('c')"))
  assert.ok(sendCopy.indexOf("keyboard_controller.release('c')") < sendCopy.indexOf('keyboard_controller.release(Key.ctrl)'))
  const stashItem = content.slice(content.indexOf('def stash_item(x, y):'), content.indexOf('def update_map_stats('))
  assert.ok(stashItem.indexOf('keyboard_controller.press(Key.ctrl)') < stashItem.indexOf('click_mouse("left")'))
  assert.ok(stashItem.indexOf('click_mouse("left")') < stashItem.indexOf('keyboard_controller.release(Key.ctrl)'))
})

test('制作脚本 Ctrl+C 满足 Ctrl 先按下、最后释放', () => {
  const content = source('crafting')
  const sendCopy = content.slice(content.indexOf('def send_copy_command('), content.indexOf('def read_clipboard_to_file('))
  assert.ok(sendCopy.indexOf('keyboard_controller.press(Key.ctrl)') < sendCopy.indexOf("keyboard_controller.press('c')"))
  assert.ok(sendCopy.indexOf("keyboard_controller.release('c')") < sendCopy.indexOf('keyboard_controller.release(Key.ctrl)'))
})
})()

// === Merged from keyCapture.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const interpretCaptureEvent = _m4_interpretCaptureEvent
  const keyboardEventToAccelerator = _m4_keyboardEventToAccelerator
  const keyboardEventToActionKey = _m4_keyboardEventToActionKey
  const validateShortcuts = _m4_validateShortcuts
function keyEvent(key, options = {}) {
  return { key, code: options.code || '', ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...options }
}

test('DOM 按键事件转换为规范化组合键和小键盘键', () => {
  assert.equal(keyboardEventToAccelerator(keyEvent('k', { ctrlKey: true, shiftKey: true })), 'Ctrl+Shift+K')
  assert.equal(keyboardEventToAccelerator(keyEvent('1'), new Set(['Alt'])), 'Alt+1')
  assert.equal(keyboardEventToAccelerator(keyEvent('4', { code: 'Numpad4' })), 'Numpad4')
  assert.equal(keyboardEventToAccelerator(keyEvent('PageDown')), 'PageDown')
  assert.equal(keyboardEventToAccelerator(keyEvent('Control', { ctrlKey: true })), null)
})

test('动作键拒绝修饰组合并使用运行时支持的名称', () => {
  assert.equal(keyboardEventToActionKey(keyEvent('w')), 'w')
  assert.equal(keyboardEventToActionKey(keyEvent('1', { code: 'Numpad1' })), 'Numpad1')
  assert.equal(keyboardEventToActionKey(keyEvent('w', { ctrlKey: true })), null)
  assert.equal(keyboardEventToActionKey(keyEvent('W', { shiftKey: true })), null)
})

test('捕获事件支持取消、清空和等待修饰键', () => {
  assert.equal(interpretCaptureEvent(keyEvent('Escape')).type, 'cancel')
  assert.equal(interpretCaptureEvent(keyEvent('Delete')).type, 'clear')
  assert.equal(interpretCaptureEvent(keyEvent('Shift', { shiftKey: true })).type, 'pending')
})

test('快捷键验证接受翻页键并拒绝别名冲突和保留键', () => {
  assert.equal(validateShortcuts({ previous: 'PageUp', next: 'PageDown' }).isValid, true)
  assert.equal(validateShortcuts({ a: 'Numpad4', b: 'num4' }).isValid, false)
  assert.equal(validateShortcuts({ debug: 'F12' }).isValid, false)
  assert.equal(validateShortcuts({ debug: 'Ctrl+Shift+I' }).isValid, false)
})

test('物品菜单和查价快捷键拒绝内部使用的 Ctrl+C', () => {
  for (const key of ['priceCheck']) {
    const result = validateShortcuts({ [key]: 'Ctrl+C', end: 'Alt+3' }, { requiredKeys: ['end'] })
    assert.equal(result.isValid, false)
    assert.match(result.error, /Ctrl\+C.*读取物品/)
  }
  assert.equal(validateShortcuts({ priceCheck: 'Ctrl+Alt+C', end: 'Alt+3' }, { requiredKeys: ['end'] }).isValid, true)
})

test('完整应用快捷键允许普通空值但拒绝空紧急停止', () => {
  assert.equal(validateShortcuts({ end: 'Alt+3', itemStart: '', mapStart: '  ' }, { requiredKeys: ['end'] }).isValid, true)
  assert.deepEqual(
    validateShortcuts({ end: ' ', itemStart: '' }, { requiredKeys: ['end'] }),
    { isValid: false, error: '全局紧急停止快捷键不能为空' }
  )
})
})()

// === Merged from operationDelay.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const readFileSync = _m5_readFileSync
const source = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('设置页展示固定操作时序并移除自适应控件和旧延迟预设', () => {
  const view = source('../src/domains/settings/SettingsView.vue')
  assert.match(view, />\s*自动操作等待\s*</)
  assert.doesNotMatch(view, /OPERATION_DELAY\.(?:min|max)/)
  assert.match(view, /悬停稳定时间/)
  assert.match(view, /固定结果等待/)
  assert.doesNotMatch(view, /自适应等待|adaptiveTiming|adaptiveTimeoutMs/)
  assert.match(view, /TIMING_FIELD_HELP/)
  assert.match(view, /class="help-icon timing-help-trigger" tabindex="0"/)
  assert.doesNotMatch(view, /极速|均衡|稳妥|鼠标移动延迟|操作间隔|剪切板等待|delayPresets/)

  const bagView = source('../src/domains/bag/BagView.vue')
  assert.doesNotMatch(bagView, /逐格操作等待|transferDelayMs|入库失败 \{\{|failedSlots/)
})

test('设置持久化输出当前操作时序版本并同步下一轮背包运行配置', () => {
  const store = source('../src/domains/settings/settingsStore.js')
  assert.match(store, /operationDelayMs: operationDelayMs\.value/)
  assert.match(store, /operationTimingVersion: OPERATION_TIMING_VERSION/)
  assert.match(store, /data\.operationTimingVersion !== OPERATION_TIMING_VERSION/)
  assert.match(store, /fixedTiming: fixedTiming\.value/)
  assert.doesNotMatch(store, /adaptiveTiming|adaptiveTimeoutMs|normalizeAdaptive/)
  assert.match(store, /electronApi\.automationTiming\.update\(candidate\)/)
  assert.match(store, /function updateAutomationTiming\(patch = \{\}\)/)
  assert.doesNotMatch(store, /delays: delays\.value|updateDelays/)

  const bagStore = source('../src/stores/bag.js')
  assert.doesNotMatch(bagStore, /transferDelayMs|failedSlots/)
})

test('完整时序 IPC 统一更新消费者且旧背包接口复用同一更新函数', () => {
  const handler = source('../electron/modules/ipc/automationTiming.js')
  const bag = source('../electron/modules/ipc/bag.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  assert.match(handler, /automation-timing-update/)
  assert.match(handler, /normalizeAutomationTiming\(value\)/)
  for (const consumer of ['updateBagAutomationTiming\(timing\)', 'stashPickup\?\.setRuntime\(timing\)', 'junfeng\?\.setRuntime\(timing\)']) {
    assert.match(handler, new RegExp(consumer.replace(/[?.()]/g, '\\$&')))
  }
  assert.match(bag, /update-bag-operation-delay[\s\S]*updateBagAutomationTiming\(/)
  assert.match(preload, /updateAutomationTiming/)
  assert.match(api, /automationTiming:[\s\S]*update:/)
})

test('制作和地图脚本的悬停等待来自同一个真实值，点击与复制使用内部固定时序', () => {
  const generator = source('../src/utils/pythonScriptGenerator.js')
  assert.equal((generator.match(/normalizeAutomationTiming\(\{ operationDelayMs, fixedTiming \}\)/g) || []).length, 2)
  assert.equal((generator.match(/'\{\{DELAY_MOUSE_MOVE\}\}': operationDelaySeconds/g) || []).length, 2)
  assert.doesNotMatch(generator, /DELAY_CLIPBOARD|clipboard_read_delay/)
  for (const placeholder of ['MODIFIER_SETTLE_MS', 'KEY_HOLD_MS', 'BUTTON_HOLD_MS', 'RELEASE_SETTLE_MS', 'CLIPBOARD_CONFIRM_MS', 'STASH_TAB_SETTLE_MS', 'STASH_SETTLE_MS']) {
    assert.equal((generator.match(new RegExp(`'\\{\\{${placeholder}\\}\\}': String\\(normalizedFixedTiming\\.${camelCase(placeholder)}\\)`, 'g')) || []).length, 2, `${placeholder} 注入次数`)
  }
  assert.doesNotMatch(generator, /TIMING_MODE|ADAPTIVE_TIMEOUT|normalizedAdaptive/)
  assert.doesNotMatch(generator, /DELAY_MOUSE_CLICK/)
  assert.doesNotMatch(generator, /delays\.mouseMove|delays\.action|delays\.clipboardRead|DELAY_KEY_PRESS|\* 0\.05|\* 0\.2/)

  for (const template of [
    source('../src/assets/scripts/crafting_template.py'),
    source('../src/assets/scripts/map_rolling_template.py')
  ]) {
    assert.match(template, /time\.sleep\(mouse_move_delay\)/)
    assert.match(template, /MODIFIER_SETTLE_SECONDS = float\({{MODIFIER_SETTLE_MS}}\) \/ 1000\.0/)
    assert.match(template, /KEY_HOLD_SECONDS = float\({{KEY_HOLD_MS}}\) \/ 1000\.0/)
    assert.match(template, /BUTTON_HOLD_SECONDS = float\({{BUTTON_HOLD_MS}}\) \/ 1000\.0/)
    assert.match(template, /RELEASE_SETTLE_SECONDS = float\({{RELEASE_SETTLE_MS}}\) \/ 1000\.0/)
    assert.match(template, /CLIPBOARD_RESPONSE_MIN_SECONDS = float\({{CLIPBOARD_CONFIRM_MS}}\) \/ 1000\.0/)
    assert.match(template, /STASH_TAB_SETTLE_SECONDS = float\({{STASH_TAB_SETTLE_MS}}\) \/ 1000\.0/)
    assert.match(template, /STASH_SETTLE_SECONDS = float\({{STASH_SETTLE_MS}}\) \/ 1000\.0/)
    assert.match(template, /mouse_controller\.press\(Button\.(left|right)\)\s*time\.sleep\(BUTTON_HOLD_SECONDS\)\s*mouse_controller\.release\(Button\.(left|right)\)/)
    assert.match(template, /def wait_for_clipboard_change\(before_seq, before_text, timeout_seconds, allow_unchanged_text=False\):/)
    assert.match(template, /time\.sleep\(max\(0\.0, timeout_seconds\)\)[\s\S]*clipboard_changed\(before_seq, before_text, allow_unchanged_text\)/)
    assert.doesNotMatch(template, /TIMING_MODE|ADAPTIVE_TIMEOUT|timing_mode|adaptive_timeout/)
    assert.doesNotMatch(template, /key_press_delay|currency_right_click_delay|item_left_click_delay/)
  }
})

function camelCase(snake) {
  return snake.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}
})()

// === Merged from refreshShortcut.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const dispatchReloadAction = _m6_dispatchReloadAction
  const getReloadAction = _m6_getReloadAction
const keyDown = (key, extra = {}) => ({ type: 'keyDown', key, control: false, shift: false, meta: false, alt: false, ...extra })

test('Ctrl+R 触发普通刷新', () => {
  assert.equal(getReloadAction(keyDown('r', { control: true })), 'reload')
  assert.equal(getReloadAction(keyDown('R', { control: true })), 'reload')
})

test('Ctrl+Shift+R 触发强制刷新', () => {
  assert.equal(getReloadAction(keyDown('r', { control: true, shift: true })), 'force-reload')
})

test('F5 触发普通刷新', () => {
  assert.equal(getReloadAction(keyDown('F5')), 'reload')
  assert.equal(getReloadAction(keyDown('f5')), 'reload')
})

test('其他按键与抬起事件不触发刷新', () => {
  assert.equal(getReloadAction(keyDown('a', { control: true })), null)
  assert.equal(getReloadAction(keyDown('r')), null)
  assert.equal(getReloadAction({ type: 'keyUp', key: 'r', control: true, shift: false, meta: false, alt: false }), null)
})

test('强制刷新动作只请求一次应用重启且不直接重载渲染页面', () => {
  let restartRequests = 0
  let reloadCalls = 0

  assert.equal(dispatchReloadAction('force-reload', {
    requestForceRefresh: () => { restartRequests += 1 },
    reload: () => { reloadCalls += 1 }
  }), true)
  assert.equal(restartRequests, 1)
  assert.equal(reloadCalls, 0)
})

test('普通刷新动作只重载渲染页面', () => {
  let restartRequests = 0
  let reloadCalls = 0

  assert.equal(dispatchReloadAction('reload', {
    requestForceRefresh: () => { restartRequests += 1 },
    reload: () => { reloadCalls += 1 }
  }), true)
  assert.equal(restartRequests, 0)
  assert.equal(reloadCalls, 1)
  assert.equal(dispatchReloadAction(null, { requestForceRefresh() {}, reload() {} }), false)
})
})()

// === Merged from sharedInterfaceDetection.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const readFileSync = _m7_readFileSync
  const AutomationLock = _m7_AutomationLock
  const CHAOS_CONTROL_DIP_SIZE = _m7_CHAOS_CONTROL_DIP_SIZE
  const CHAOS_CONTROL_MARGIN = _m7_CHAOS_CONTROL_MARGIN
  const clampControlPhysicalBounds = _m7_clampControlPhysicalBounds
  const normalizeControlDipSize = _m7_normalizeControlDipSize
  const normalizeControlOffset = _m7_normalizeControlOffset
  const placeControlInDip = _m7_placeControlInDip
const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('自动入库与混沌取件共享互斥锁并只允许持有者释放', () => {
  const lock = new AutomationLock()
  assert.deepEqual(lock.acquire('自动入库'), { success: true, owner: '自动入库' })
  assert.equal(lock.acquire('混沌配方取件').success, false)
  lock.release('混沌配方取件')
  assert.equal(lock.getState().owner, '自动入库')
  lock.release('自动入库')
  assert.deepEqual(lock.getState(), { locked: false, owner: '' })
})

test('混沌控制浮窗使用相对游戏物理坐标并限制到客户区', () => {
  assert.equal(normalizeControlOffset(), null)
  assert.equal(normalizeControlOffset({ x: null, y: null }), null)
  const game = { left: -1920, top: 0, right: 0, bottom: 1080, width: 1920, height: 1080 }
  const initial = clampControlPhysicalBounds(game, null)
  assert.equal(initial.left, -1920 + CHAOS_CONTROL_MARGIN)
  assert.equal(initial.bottom, 1080 - CHAOS_CONTROL_MARGIN)

  const bounds = clampControlPhysicalBounds(game, { x: 50, y: 1550 })
  assert.equal(bounds.left, -1870)
  assert.equal(bounds.top, 1004)
  assert.deepEqual(bounds.offset, { x: 50, y: 1004 })
})

test('混沌控制浮窗未拖动时动态定位且不会持久化初始位置', () => {
  const game = { left: 0, top: 0, right: 2560, bottom: 1440, width: 2560, height: 1440 }
  const placement = placeControlInDip(game, null, {
    screenToDipPoint: ({ x, y }) => ({ x: x / 2, y: y / 2 }),
    dipToScreenPoint: ({ x, y }) => ({ x: x * 2, y: y * 2 })
  })
  assert.equal(placement.x, CHAOS_CONTROL_MARGIN)
  assert.equal(placement.y, 720 - CHAOS_CONTROL_DIP_SIZE.height - CHAOS_CONTROL_MARGIN)

  const manager = source('../electron/modules/chaosRecipe/controlOverlay.js')
  assert.match(manager, /controlOverlayOffset:\s*null/)
  // 默认偏移不被同步改写的行为由 controlOverlayDrag.test.js 验证。

  const settings = source('../src/domains/settings/SettingsView.vue')
  const store = source('../src/stores/chaosRecipe.js')
  assert.match(settings, /resetApplicationSettings\(\{[\s\S]*resetControlOverlayOffset:\s*\(\) => chaosRecipeStore\.resetControlOverlayOffset\(\)/)
  assert.match(store, /settings\.value\.controlOverlayOffset = null[\s\S]*syncRuntime\(\{ controlOverlayOffset: null \}\)/)
})

test('混沌控制浮窗在高 DPI 下保持固定内容尺寸并返回物理偏移', () => {
  const game = { left: 0, top: 0, right: 2560, bottom: 1440, width: 2560, height: 1440 }
  const placement = placeControlInDip(game, { x: 50, y: 1550 }, {
    screenToDipPoint: ({ x, y }) => ({ x: x / 2, y: y / 2 }),
    dipToScreenPoint: ({ x, y }) => ({ x: x * 2, y: y * 2 })
  })
  assert.equal(placement.width, CHAOS_CONTROL_DIP_SIZE.width)
  assert.equal(placement.height, CHAOS_CONTROL_DIP_SIZE.height)
  assert.equal(placement.y, 720 - CHAOS_CONTROL_DIP_SIZE.height)
  assert.deepEqual(placement.offset, { x: 50, y: 1264 })
})

test('按钮组浮层按渲染内容调整外窗尺寸', () => {
  assert.deepEqual(normalizeControlDipSize({ width: 173.2, height: 76.1 }), { width: 174, height: 77 })
  assert.deepEqual(normalizeControlDipSize({ width: 0, height: 9999 }), {
    width: 1,
    height: CHAOS_CONTROL_DIP_SIZE.height
  })

  const view = source('../src/domains/shop/ChaosRecipeControlOverlayView.vue')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const ipc = source('../electron/modules/ipc/chaosRecipe.js')
  const manager = source('../electron/modules/chaosRecipe/controlOverlay.js')

  assert.match(view, /class="button-row"/)
  assert.match(view, /width:\s*max-content/)
  assert.match(view, /ResizeObserver/)
  assert.match(view, /resizeControl/)
  assert.match(preload, /chaos-recipe-control-resize/)
  assert.match(api, /resizeControl/)
  assert.match(ipc, /chaos-recipe-control-resize/)
  assert.match(manager, /resizeToContent/)
  assert.match(manager, /this\.contentSize/)
})

test('检测进程由公共协调器持有且两个功能只注册消费者', () => {
  const coordinator = source('../electron/modules/interfaceDetection/coordinator.js')
  const bagIpc = source('../electron/modules/ipc/bag.js')
  const chaosIpc = source('../electron/modules/ipc/chaosRecipe.js')
  assert.match(coordinator, /this\.consumers = new Set\(\)/)
  assert.match(coordinator, /registerConsumer\(consumer, config(?: =[^)]*)?\)/)
  assert.match(coordinator, /this\.consumers\.size === 0/)
  assert.doesNotMatch(bagIpc, /let detectionProcess/)
  assert.match(bagIpc, /registerConsumer\('bag'/)
  assert.match(chaosIpc, /registerConsumer\('chaos-recipe'/)
})

test('混沌配方控制浮窗提供配方切换、三项操作和动态停止继续', () => {
  const view = source('../src/domains/shop/ChaosRecipeControlOverlayView.vue')
  const manager = source('../electron/modules/chaosRecipe/controlOverlay.js')
  const panel = source('../src/domains/shop/ChaosRecipePanel.vue')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const ipc = source('../electron/modules/ipc/chaosRecipe.js')
  assert.match(view, /刷新仓库/)
  assert.match(view, /预览高亮/)
  assert.match(view, /state\.recipeOptions/)
  assert.match(view, /selectControlRecipe/)
  assert.match(manager, /focusable:\s*false/)
  assert.doesNotMatch(view, /<select/)
  assert.match(view, /toggleRecipeMenu/)
  assert.match(view, /@pointerdown\.stop\.prevent="selectControlRecipe\(option\.value, \$event\)"/)
  assert.match(view, /\.recipe-menu\s*\{[\s\S]*position:\s*fixed[\s\S]*grid-template-columns:\s*repeat\(7/)
  assert.match(preload, /chaos-recipe-control-select-recipe/)
  assert.match(api, /selectControlRecipe/)
  assert.match(ipc, /chaos-recipe-control-select-recipe/)
  assert.match(manager, /canSelectRecipe/)
  assert.match(manager, /recipeOptions/)
  assert.match(manager, /snapshot && !automationActive && !previewActive && !occupiedByOther/)
  assert.match(manager, /selectRecipe\(recipeId\)/)
  assert.match(manager, /if \(!state\.canSelectRecipe\) throw new Error/)
  assert.match(ipc, /chaos-recipe-control-recipe-selected/)
  assert.match(manager, /actionLabel = '取出配方'/)
  assert.match(manager, /actionLabel = '停止取件'/)
  assert.match(manager, /actionLabel = '继续取件'/)
  assert.match(manager, /missingCalibrationKeys/)
  assert.match(manager, /statusMessage/)
  assert.match(view, /state\.statusMessage/)
  assert.match(manager, /fullSetCount/)
  assert.match(manager, /activeRecipeId/)
  assert.match(manager, /recipeLabel/)
  assert.match(manager, /availableCount/)
  assert.match(view, /state\.refreshLabel/)
  assert.match(view, /state\.previewLabel/)
  assert.match(view, /state\.previewActive/)
  assert.match(manager, /previewActive/)
  assert.match(manager, /previewLabel = previewActive/)
  assert.match(manager, /!automationActive && !occupiedByOther && \(previewActive \|\| canStartPreview\)/)
  assert.match(manager, /occupiedByOther\s*\?\s*`\$\{lock\.owner\}正在运行`/)
  assert.match(manager, /自动取件期间由取件流程管理高亮/)
  const previewHandler = source('../electron/modules/ipc/chaosRecipe.js').slice(
    source('../electron/modules/ipc/chaosRecipe.js').indexOf("ipcMain.handle('chaos-recipe-control-preview'"),
    source('../electron/modules/ipc/chaosRecipe.js').indexOf("ipcMain.handle('chaos-recipe-control-action'")
  )
  assert.match(previewHandler, /getState\(\)\?\.status === 'preview'/)
  assert.match(previewHandler, /service\.overlay\.close\(\)/)
  assert.match(previewHandler, /closed: true/)
  assert.match(previewHandler, /control\?\.sync\(\)/)
  assert.match(view, /@pointerdown\.stop\.prevent="runFromPointer\('action'/)
  assert.equal((view.match(/busy !== ''/g) || []).length, 6)
  assert.doesNotMatch(view, /\|\| busy"/)
  assert.match(view, /button:not\(:disabled\):hover/)
  assert.match(view, /button:not\(:disabled\):active/)
  assert.match(view, /button:disabled/)
  assert.doesNotMatch(manager, /needsNormal|needsQuad/)
  assert.match(panel, /是否开启/)
  assert.doesNotMatch(panel, /v-model="settings\.operationDelayMs"/)
  assert.match(panel, /全局时序/)
})

test('控制浮窗失败原因在状态推送后保持可见', () => {
  const view = source('../src/domains/shop/ChaosRecipeControlOverlayView.vue')
  assert.match(view, /let pendingActionFailure = ''/)
  assert.match(view, /let pendingJunfengFailure = ''/)
  assert.match(view, /let pendingSelectionFailure = ''/)
  assert.match(view, /if \(kind === 'junfeng'\) pendingJunfengFailure = failure/)
  assert.match(view, /else pendingActionFailure = failure/)
  assert.match(view, /if \(!response\?\.success\) pendingSelectionFailure = response\?\.error\?\.message \|\| '切换配方失败'/)
  assert.match(view, /if \(pendingActionFailure\) \{/)
  assert.match(view, /if \(pendingJunfengFailure\) \{[\s\S]*state\.junfengReason = pendingJunfengFailure/)
  assert.match(view, /if \(pendingSelectionFailure\) \{/)
})

test('浮窗切换单件配方时基于最新快照重算勾选并同步选择集合', () => {
  const manager = source('../electron/modules/chaosRecipe/controlOverlay.js')
  assert.match(manager, /const selectedItemIds = SINGLE_RECIPE_IDS\.includes\(nextRecipeId\)/)
  assert.match(manager, /this\.service\?\.snapshot\?\.recipes\?\.\[nextRecipeId\]\?\.candidates \|\| \[\]\)\.map\(\(item\) => String\(item\.id\)\)/)
  assert.match(manager, /this\.runtime\.selectedItemIdsByRecipe = \{\s*\n\s*\.\.\.this\.runtime\.selectedItemIdsByRecipe,\s*\n\s*\[nextRecipeId\]: selectedItemIds\s*\n\s*\}/)
})

test('公共检测脚本上报游戏客户区并在几何变化时广播', () => {
  const script = source('../src/assets/scripts/bag_auto_stash_template.py')
  assert.match(script, /def get_game_client_bounds/)
  assert.match(script, /GetClientRect/)
  assert.match(script, /ClientToScreen/)
  assert.match(script, /game_bounds != last_game_bounds/)
  assert.match(script, /gameBounds=game_bounds/)
})
})()

// === Merged from shortcutConfig.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const fs = _m8_fs
  const DEFAULT_GLOBAL_SHORTCUTS = _m8_DEFAULT_GLOBAL_SHORTCUTS
  const dispatchShortcutAction = _m8_dispatchShortcutAction
  const mergeGlobalShortcutSettings = _m8_mergeGlobalShortcutSettings
  const normalizeGlobalShortcutSettings = _m8_normalizeGlobalShortcutSettings
test('全局快捷键仅保留紧急停止默认值', () => {
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.stashStart, undefined)
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.potionStart, undefined)
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.potionStop, undefined)
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.puzzleAnalyze, undefined)
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.chaosRecipeStart, undefined)
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.chaosRecipePause, undefined)
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.chaosRecipeStop, undefined)
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.mapTrackerOverlay, undefined)
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.end, 'Alt+3')
  for (const [key, value] of Object.entries(DEFAULT_GLOBAL_SHORTCUTS)) {
    if (key !== 'end') assert.equal(value, '', `${key} 不应提供内置快捷键`)
  }
})

test('全局快捷键只接受当前格式字段', () => {
  assert.equal(mergeGlobalShortcutSettings({ stashShortcut: 'F6' }).stashStart, undefined)
  assert.equal(mergeGlobalShortcutSettings({ stashStart: 'F7' }).stashStart, undefined)
  assert.equal(mergeGlobalShortcutSettings({ unknown: 'F9' }).unknown, undefined)
  const migrated = mergeGlobalShortcutSettings({
    potionStart: 'F7',
    potionStop: 'F8',
    puzzleAnalyze: 'Alt+7',
    chaosRecipeStart: 'Alt+4',
    chaosRecipePause: 'Alt+5',
    chaosRecipeStop: 'Alt+6'
  })
  for (const key of ['potionStart', 'potionStop', 'puzzleAnalyze', 'chaosRecipeStart', 'chaosRecipePause', 'chaosRecipeStop']) {
    assert.equal(migrated[key], undefined)
  }
})

test('普通快捷键保留空值且历史空紧急停止恢复默认值', () => {
  const merged = mergeGlobalShortcutSettings({ itemStart: '  ', mapStart: ' Alt+9 ', end: ' ' })
  assert.equal(merged.itemStart, '')
  assert.equal(merged.mapStart, 'Alt+9')
  assert.equal(merged.end, DEFAULT_GLOBAL_SHORTCUTS.end)
  assert.equal(normalizeGlobalShortcutSettings({ ...DEFAULT_GLOBAL_SHORTCUTS, portal: '  ' }).portal, '')
})

test('历史物品捕获快捷键使用 Ctrl+C 时迁移为空值', () => {
  const merged = mergeGlobalShortcutSettings({ end: 'Alt+3', itemContextMenu: 'Ctrl+C', mapTrackerKills: 'F8', priceCheck: 'Control+C' })
  assert.equal(merged.itemContextMenu, undefined)
  assert.equal(merged.mapTrackerKills, undefined)
  assert.equal(merged.priceCheck, '')
})

test('快捷键提交先注册规范化候选再持久化成功值', () => {
  const service = fs.readFileSync(new URL('../src/utils/scriptService.js', import.meta.url), 'utf8')
  const store = fs.readFileSync(new URL('../src/domains/settings/settingsStore.js', import.meta.url), 'utf8')
  const commit = service.match(/export async function commitGlobalShortcut[\s\S]*?\n\}/)?.[0] || ''
  assert.match(commit, /normalizeGlobalShortcutSettings/)
  assert.ok(commit.indexOf('await updateShortcuts(candidate)') < commit.indexOf('settingsStore.updateGlobalShortcuts'))
  assert.match(commit, /key === 'priceCheck' && useFeatureModulesStore\(\)\.isEnabled\('price-check'\)[\s\S]*usePriceCheckStore\(\)\.syncRuntime\(\{ shortcut: candidate\[key\] \}\)/)
  assert.match(commit, /catch \(error\)[\s\S]*settingsStore\.updateGlobalShortcuts\(\{ \[key\]: previous\[key\] \}\)[\s\S]*await updateShortcuts\(previous\)/)
  assert.match(service, /validateShortcuts\(shortcuts, \{ requiredKeys: \['end'\] \}\)/)
  assert.match(store, /function updateGlobalShortcuts[\s\S]*normalizeGlobalShortcutSettings[\s\S]*if \(!candidate\.end\) throw new Error\('全局紧急停止快捷键不能为空'\)/)
})

test('统一分发器对一次触发仅执行一个对应动作', () => {
  let calls = 0
  assert.equal(dispatchShortcutAction('storyNext', { storyNext: () => { calls += 1 } }), true)
  assert.equal(calls, 1)
  assert.equal(dispatchShortcutAction('missing', { storyNext: () => { calls += 1 } }), false)
  assert.equal(calls, 1)
})

test('主进程全量注册失败时保留并恢复上一份快捷键清单', () => {
  const ipcSource = fs.readFileSync(new URL('../electron/modules/ipc/shortcut.js', import.meta.url), 'utf8')
  const managerSource = fs.readFileSync(new URL('../electron/modules/shortcuts/manager.js', import.meta.url), 'utf8')
  assert.match(ipcSource, /const rollbackOnFailure = options\?\.rollbackOnFailure !== false/)
  assert.match(ipcSource, /setConfiguredShortcuts\(entries, \{ rollbackOnFailure \}\)/)
  assert.match(ipcSource, /rolledBack: result\.rolledBack/)
  assert.match(managerSource, /previousIntended = new Map/)
  assert.match(managerSource, /previousRegistered\.forEach/)
})
})()

// === Merged from shortcutScope.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const assertLoose = _m9_assertLoose
  const readFileSync = _m9_readFileSync
  const EventEmitter = _m9_EventEmitter
  const vm = _m9_vm
  const DIAGNOSTIC_OPERATIONS = _m9_DIAGNOSTIC_OPERATIONS
  const DIAGNOSTIC_REASON_CODES = _m9_DIAGNOSTIC_REASON_CODES
  const createEventLineParser = _m9_createEventLineParser
const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const flush = (ms = 5) => new Promise((resolve) => setTimeout(resolve, ms))

function createGlobalShortcutMock(failAccelerators = new Set()) {
  const registered = new Map()
  const calls = []
  return {
    registered,
    calls,
    register(accelerator, callback) {
      calls.push(['register', accelerator])
      if (failAccelerators.has(accelerator)) return false
      registered.set(accelerator, callback)
      return true
    },
    unregister(accelerator) {
      calls.push(['unregister', accelerator])
      registered.delete(accelerator)
    }
  }
}

function loadShortcutManager(globalShortcutMock) {
  const transformed = source('../electron/modules/shortcuts/manager.js')
    .replace("import { globalShortcut } from 'electron'\n", '')
    .replace("import { toElectronAccelerator } from '../../../src/utils/electronAccelerator.js'\n", '')
    .replaceAll('export function ', 'function ')
    .replaceAll('export const ', 'const ')
  const exports = [
    'setServerInputPolicy',
    'registerConfiguredShortcut',
    'unregisterConfiguredShortcut',
    'setConfiguredShortcuts',
    'setScopeEnabled',
    'setScopeActive',
    'setScopeAvailable',
    'getScopeState',
    'registerGlobalShortcut',
    'unregisterGlobalShortcut',
    'unregisterAll',
    'getRegisteredShortcuts',
    'getIntendedShortcuts'
  ].join(', ')
  const sandbox = {
    console,
    globalShortcut: globalShortcutMock,
    toElectronAccelerator: (value) => String(value || '').trim(),
    Map,
    Set,
    Object,
    Boolean,
    String,
    Array,
    JSON,
    Error,
    Number
  }
  vm.createContext(sandbox)
  vm.runInContext(`${transformed}\nglobalThis.__shortcutManager = { ${exports} }`, sandbox)
  return sandbox.__shortcutManager
}

test('门禁默认开启且游戏未前台时保存意图但不注册', () => {
  const mock = createGlobalShortcutMock()
  const manager = loadShortcutManager(mock)
  const result = manager.setConfiguredShortcuts([
    { key: 'portal', accelerator: 'B', callback: () => {} },
    { key: 'end', accelerator: 'Alt+3', callback: () => {} }
  ])
  assert.equal(result.success, true)
  assertLoose.deepEqual(result.deferred, ['B', 'Alt+3'])
  assert.equal(mock.registered.size, 0)
  assert.equal(manager.getScopeState().enabled, true)
  assert.equal(manager.getScopeState().available, true)
  assert.equal(manager.getScopeState().gameForeground, false)
})

test('游戏前台注册全部意图，失焦立即全部注销', () => {
  const mock = createGlobalShortcutMock()
  const manager = loadShortcutManager(mock)
  manager.setConfiguredShortcuts([
    { key: 'portal', accelerator: 'B', callback: () => {} },
    { key: 'end', accelerator: 'Alt+3', callback: () => {} }
  ])
  manager.setScopeActive(true)
  assert.deepEqual([...mock.registered.keys()].sort(), ['Alt+3', 'B'])
  assert.equal(manager.getScopeState().gameForeground, true)
  manager.setScopeActive(false)
  assert.equal(mock.registered.size, 0)
  assert.equal(manager.getScopeState().gameForeground, false)
})

test('国际服不注册游戏操作快捷键，切换中已捕获的回调被阻断并保留紧急停止', () => {
  const mock = createGlobalShortcutMock()
  const manager = loadShortcutManager(mock)
  let gameInputs = 0
  let stops = 0
  const entries = [
    { key: 'portal', accelerator: 'B', callback: () => { gameInputs++ } },
    { key: 'end', accelerator: 'Alt+3', callback: () => { stops++ } }
  ]
  manager.setScopeActive(true)
  manager.setConfiguredShortcuts(entries)
  const previousCallback = mock.registered.get('B')
  manager.setServerInputPolicy(() => false)
  previousCallback()
  assert.equal(gameInputs, 0)
  manager.setConfiguredShortcuts(entries)
  assert.deepEqual([...mock.registered.keys()], ['Alt+3'])
  mock.registered.get('Alt+3')()
  assert.equal(stops, 1)
})

test('游戏前台部分快捷键冲突时保留其余快捷键并在后续状态同步时重试', () => {
  const failSet = new Set(['Ctrl+D'])
  const mock = createGlobalShortcutMock(failSet)
  const manager = loadShortcutManager(mock)
  manager.setConfiguredShortcuts([
    { key: 'mapStart', accelerator: 'Alt+2', callback: () => {} },
    { key: 'end', accelerator: 'Alt+3', callback: () => {} },
    { key: 'priceCheck', accelerator: 'Ctrl+D', callback: () => {} }
  ])

  const firstForeground = manager.setScopeActive(true)
  assert.equal(firstForeground.success, false)
  assertLoose.deepEqual(firstForeground.failed, ['Ctrl+D'])
  assert.deepEqual([...mock.registered.keys()].sort(), ['Alt+2', 'Alt+3'])
  assert.deepEqual([...manager.getIntendedShortcuts().keys()].sort(), ['Alt+2', 'Alt+3', 'Ctrl+D'])
  assertLoose.deepEqual(manager.getScopeState().failed, ['Ctrl+D'])
  assert.equal(manager.getScopeState().partialFailure, true)

  const successfulRegistrationCalls = mock.calls.filter(([action, accelerator]) => (
    action === 'register' && accelerator !== 'Ctrl+D'
  )).length
  manager.setScopeActive(true)
  assert.equal(mock.calls.filter(([action, accelerator]) => (
    action === 'register' && accelerator !== 'Ctrl+D'
  )).length, successfulRegistrationCalls)

  manager.setScopeActive(false)
  assert.equal(mock.registered.size, 0)
  assertLoose.deepEqual(manager.getScopeState().failed, ['Ctrl+D'])
  assert.equal(manager.getScopeState().partialFailure, true)

  const secondForeground = manager.setScopeActive(true)
  assert.equal(secondForeground.success, false)
  assertLoose.deepEqual(secondForeground.failed, ['Ctrl+D'])

  failSet.clear()
  const recovered = manager.setScopeActive(true)
  assert.equal(recovered.success, true)
  assert.deepEqual([...mock.registered.keys()].sort(), ['Alt+2', 'Alt+3', 'Ctrl+D'])
  assertLoose.deepEqual(manager.getScopeState().failed, [])
  assert.equal(manager.getScopeState().partialFailure, false)

  manager.setScopeActive(false)
  assert.equal(mock.registered.size, 0)
  assertLoose.deepEqual(manager.getScopeState().failed, [])
})

test('应用启动恢复快捷键时允许部分成功并保留失败注册意图', () => {
  const mock = createGlobalShortcutMock(new Set(['Ctrl+D']))
  const manager = loadShortcutManager(mock)
  manager.setScopeActive(true)

  const result = manager.setConfiguredShortcuts([
    { key: 'mapStart', accelerator: 'Alt+2', callback: () => {} },
    { key: 'priceCheck', accelerator: 'Ctrl+D', callback: () => {} }
  ], { rollbackOnFailure: false })

  assert.equal(result.success, false)
  assertLoose.deepEqual(result.failed, ['Ctrl+D'])
  assert.deepEqual([...mock.registered.keys()], ['Alt+2'])
  assert.deepEqual([...manager.getIntendedShortcuts().keys()], ['Alt+2', 'Ctrl+D'])
})

test('前台状态携带窗口与进程不匹配的具体原因', () => {
  const mock = createGlobalShortcutMock()
  const manager = loadShortcutManager(mock)
  manager.setScopeActive(false, {
    reason: 'process-name-mismatch',
    title: 'Path of Exile 编年史 - Google Chrome',
    processName: 'chrome.exe'
  })
  assert.equal(manager.getScopeState().gameForeground, false)
  assert.equal(manager.getScopeState().reason, 'process-name-mismatch')
  assert.equal(manager.getScopeState().windowTitle, 'Path of Exile 编年史 - Google Chrome')
  assert.equal(manager.getScopeState().processName, 'chrome.exe')
  manager.setScopeActive(true, { reason: 'game-foreground', title: '流放之路', processName: 'PathOfExile.exe' })
  assert.equal(manager.getScopeState().reason, 'game-foreground')
  assert.equal(manager.getScopeState().windowTitle, '流放之路')
})

test('关闭门禁开关立即无条件注册，重新开启后恢复前台约束', () => {
  const mock = createGlobalShortcutMock()
  const manager = loadShortcutManager(mock)
  manager.setConfiguredShortcuts([
    { key: 'portal', accelerator: 'B', callback: () => {} },
    { key: 'end', accelerator: 'Alt+3', callback: () => {} }
  ])
  manager.setScopeEnabled(false)
  assert.equal(manager.getScopeState().enabled, false)
  assert.equal(mock.registered.size, 2)
  manager.setScopeEnabled(true)
  assert.equal(mock.registered.size, 0)
  manager.setScopeActive(true)
  assert.equal(mock.registered.size, 2)
})

test('单个快捷键在门禁下延迟注册，注销后不再复活', () => {
  const mock = createGlobalShortcutMock()
  const manager = loadShortcutManager(mock)
  const result = manager.registerConfiguredShortcut('Ctrl+D', 'priceCheck', () => {})
  assertLoose.deepEqual(result, { success: true, deferred: true, accelerator: 'Ctrl+D' })
  assert.equal(mock.registered.has('Ctrl+D'), false)
  manager.setScopeActive(true)
  assert.equal(mock.registered.has('Ctrl+D'), true)
  manager.unregisterConfiguredShortcut('Ctrl+D')
  assert.equal(mock.registered.has('Ctrl+D'), false)
  manager.setScopeActive(false)
  manager.setScopeActive(true)
  assert.equal(mock.registered.has('Ctrl+D'), false)
})

test('集合注册失败回滚到上一组成功注册集合', () => {
  const failSet = new Set()
  const mock = createGlobalShortcutMock(failSet)
  const manager = loadShortcutManager(mock)
  manager.setScopeActive(true)
  manager.setConfiguredShortcuts([
    { key: 'end', accelerator: 'Alt+3', callback: () => {} }
  ])
  failSet.add('B')
  const result = manager.setConfiguredShortcuts([
    { key: 'end', accelerator: 'Alt+3', callback: () => {} },
    { key: 'portal', accelerator: 'B', callback: () => {} }
  ])
  assert.equal(result.success, false)
  assertLoose.deepEqual(result.failed, ['B'])
  assert.deepEqual([...mock.registered.keys()], ['Alt+3'])
  assert.deepEqual([...manager.getIntendedShortcuts().keys()], ['Alt+3'])
})

test('空快捷键从新集合省略并注销原组合', () => {
  const mock = createGlobalShortcutMock()
  const manager = loadShortcutManager(mock)
  manager.setScopeActive(true)
  manager.setConfiguredShortcuts([
    { key: 'itemStart', accelerator: 'Alt+1', callback: () => {} },
    { key: 'end', accelerator: 'Alt+3', callback: () => {} }
  ])
  const result = manager.setConfiguredShortcuts([
    { key: 'itemStart', accelerator: '', callback: () => {} },
    { key: 'end', accelerator: 'Alt+3', callback: () => {} }
  ])
  assert.equal(result.success, true)
  assert.deepEqual([...mock.registered.keys()], ['Alt+3'])
  assert.deepEqual([...manager.getIntendedShortcuts().keys()], ['Alt+3'])
})

test('前台监视器不可用时回退为无条件注册', () => {
  const mock = createGlobalShortcutMock()
  const manager = loadShortcutManager(mock)
  manager.setConfiguredShortcuts([
    { key: 'portal', accelerator: 'B', callback: () => {} }
  ])
  manager.setScopeAvailable(false)
  assert.equal(manager.getScopeState().available, false)
  assert.equal(mock.registered.has('B'), true)
})

test('原始注册接口不受门禁约束（快捷键捕获挂起恢复使用）', () => {
  const mock = createGlobalShortcutMock()
  const manager = loadShortcutManager(mock)
  assert.equal(manager.registerGlobalShortcut('F9', () => {}), true)
  assert.equal(mock.registered.has('F9'), true)
  manager.unregisterGlobalShortcut('F9')
  assert.equal(mock.registered.has('F9'), false)
})

function fakeChild() {
  const child = new EventEmitter()
  child.stdout = new EventEmitter()
  child.stderr = new EventEmitter()
  child.pid = 40000 + Math.floor(Math.random() * 10000)
  return child
}

function loadForegroundWatcher(spawnImpl, killImpl = () => Promise.resolve(true)) {
  const transformed = source('../electron/modules/system/foregroundWatcher.js')
    .replace("import { spawn } from 'node:child_process'\n", '')
    .replace("import { killPythonProcessTree } from '../python/process.js'\n", '')
    .replace('export function createEventLineParser', 'function createEventLineParser')
    .replace('export function startForegroundWatcher', 'function startForegroundWatcher')
  const sandbox = {
    console,
    process,
    spawn: spawnImpl,
    killPythonProcessTree: killImpl,
    queueMicrotask,
    setTimeout,
    clearTimeout
  }
  vm.createContext(sandbox)
  vm.runInContext(`${transformed}\nglobalThis.__watcher = { createEventLineParser, startForegroundWatcher }`, sandbox)
  return sandbox.__watcher
}

test('事件行解析器支持跨 chunk 的 EVENT 行并忽略普通日志', () => {
  const events = []
  const parse = createEventLineParser((event) => events.push(event))
  parse('普通日志\nEVENT {"event":"foreground","game":true,"title":"流放之路"}\nEVENT {"ev')
  parse('ent":"foreground","game":false}\n')
  assert.deepEqual(events, [
    { event: 'foreground', game: true, title: '流放之路' },
    { event: 'foreground', game: false }
  ])
})

test('缺少 Python 或脚本路径时立即失败且不启动进程', async () => {
  const spawned = []
  const loader = loadForegroundWatcher((...args) => {
    spawned.push(args)
    throw new Error('不应启动子进程')
  })
  let failure = null
  const watcher = loader.startForegroundWatcher({
    pythonPath: '',
    scriptPath: '',
    onStateChange: () => {},
    onFailure: (error) => { failure = error }
  })
  await flush()
  assert.match(failure.message, /缺少 Python 路径或脚本路径/)
  assert.equal(watcher.getState().state, 'unavailable')
  assert.equal(spawned.length, 0)
})

test('监视器解析前台事件并驱动状态回调', async () => {
  const children = []
  const spawned = []
  const loader = loadForegroundWatcher((...args) => {
    spawned.push(args)
    const child = fakeChild()
    children.push(child)
    return child
  })
  const states = []
  const watcher = loader.startForegroundWatcher({
    pythonPath: 'python',
    scriptPath: 'foreground_watcher.py',
    onStateChange: (state) => states.push(state),
    onFailure: () => {}
  })
  assert.equal(watcher.getState().state, 'starting')
  assert.equal(spawned.length, 1)
  children[0].stdout.emit('data', 'EVENT {"event":"foreground","game":true,"title":"流放之路"}\n')
  assertLoose.deepEqual(states, [{ game: true, title: '流放之路', reason: '', processName: '' }])
  assert.equal(watcher.getState().state, 'ready')
  children[0].stdout.emit('data', 'EVENT {"event":"foreground","game":false,"title":"微信"}\n')
  assertLoose.deepEqual(states.at(-1), { game: false, title: '微信', reason: '', processName: '' })
  children[0].stdout.emit('data', 'EVENT {"event":"foreground","game":false,"title":"Path of Exile 编年史 - Google Chrome","reason":"process-name-mismatch","processName":"chrome.exe"}\n')
  assertLoose.deepEqual(states.at(-1), {
    game: false,
    title: 'Path of Exile 编年史 - Google Chrome',
    reason: 'process-name-mismatch',
    processName: 'chrome.exe'
  })
  watcher.stop()
})

test('监视器异常退出按退避重启，重试耗尽后失败回调', async () => {
  const children = []
  const spawned = []
  const loader = loadForegroundWatcher((...args) => {
    spawned.push(args)
    const child = fakeChild()
    children.push(child)
    return child
  })
  let failures = 0
  const watcher = loader.startForegroundWatcher({
    pythonPath: 'python',
    scriptPath: 'foreground_watcher.py',
    onStateChange: () => {},
    onFailure: () => { failures += 1 },
    maxRestarts: 1,
    restartDelayMs: 1
  })
  children[0].emit('close', 1)
  await flush(10)
  assert.equal(spawned.length, 2)
  children[1].emit('close', 1)
  await flush(10)
  assert.equal(failures, 1)
  assert.equal(watcher.getState().state, 'exited')
  watcher.stop()
})

test('停止后杀死进程树且不再重启', async () => {
  const children = []
  const killed = []
  const loader = loadForegroundWatcher((...args) => {
    const child = fakeChild()
    children.push(child)
    return child
  }, (pid) => {
    killed.push(pid)
    return Promise.resolve(true)
  })
  const watcher = loader.startForegroundWatcher({
    pythonPath: 'python',
    scriptPath: 'foreground_watcher.py',
    onStateChange: () => {},
    onFailure: () => {}
  })
  const pid = children[0].pid
  watcher.stop()
  assert.deepEqual(killed, [pid])
  children[0].emit('close', 0)
  await flush(10)
  assert.equal(children.length, 1)
})

test('IPC、preload 与渲染 API 暴露前台门禁协议', () => {
  const ipc = source('../electron/modules/ipc/shortcut.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const scriptService = source('../src/utils/scriptService.js')
  assert.match(ipc, /shortcut-set-scope-enabled/)
  assert.match(ipc, /shortcut-get-scope-state/)
  assert.match(ipc, /setConfiguredShortcuts\(entries, \{ rollbackOnFailure \}\)/)
  assert.match(ipc, /deferred: Boolean\(result\.deferred\)/)
  assert.match(preload, /setShortcutScopeEnabled/)
  assert.match(preload, /getShortcutScopeState/)
  assert.match(preload, /onShortcutScopeChanged/)
  assert.match(api, /setScopeEnabled/)
  assert.match(api, /getScopeState/)
  assert.match(api, /onScopeChanged/)
  assert.match(api, /initFromSettings: \(shortcuts, options\)/)
  assert.match(scriptService, /initFromSettings\(registeredShortcuts, \{[\s\S]*?rollbackOnFailure: false,[\s\S]*?\}\)/)
})

test('设置页、首页状态与设置存储展示前台门禁', () => {
  const settingsView = source('../src/domains/settings/SettingsView.vue')
  const dashboard = source('../src/domains/dashboard/useDashboard.js')
  const dashboardStatus = source('../src/domains/dashboard/dashboardStatus.js')
  const store = source('../src/domains/settings/settingsStore.js')
  assert.match(settingsView, /仅在游戏窗口前台时生效/)
  assert.match(settingsView, /handleShortcutScopeToggle/)
  assert.match(dashboard, /evaluateShortcutHealth/)
  assert.doesNotMatch(dashboard, /shortcutScopeReason/)
  assert.doesNotMatch(dashboard, /快捷键已暂停/)
  assert.match(dashboardStatus, /快捷键已就绪（切回游戏后生效）/)
  assert.match(dashboardStatus, /前台监视不可用/)
  assert.match(store, /shortcutScopeEnabled/)
  assert.match(store, /shortcutScopeReason/)
  assert.match(store, /applyShortcutScopeState/)
  assert.match(store, /updateShortcutHealth\(resolveShortcutScopeHealth\(state\)\)/)
  assert.match(store, /setShortcutScopeEnabled/)
})

test('启动同步先比较本地开关，重置与失败路径保持主从状态一致', () => {
  const scriptService = source('../src/utils/scriptService.js')
  const settingsStore = source('../src/domains/settings/settingsStore.js')
  const dashboard = source('../src/domains/dashboard/useDashboard.js')
  const main = source('../electron/main.js')
  assert.match(scriptService, /const storedEnabled = settingsStore\.shortcutScopeEnabled/)
  assert.ok(scriptService.indexOf('const storedEnabled') < scriptService.indexOf('applyShortcutScopeState(scopeState)'))
  assert.match(settingsStore, /const previous = shortcutScopeEnabled\.value/)
  assert.match(settingsStore, /setScopeEnabled\(true\)/)
  assert.match(dashboard, /if \(item\?\.status === 'ready'\) return null/)
  assert.match(dashboard, /item\.status === 'pending' \|\| item\.status === 'attention'/)
  assert.match(main, /createApplicationWindow\(\)[\s\S]*?setImmediate\(\(\) => \{[\s\S]*?startForegroundWatcher/)
  assert.doesNotMatch(main, /getScopeState\(\),\s*failed: result\.failed/)
})

test('诊断允许集合包含前台门禁事件与回退原因', () => {
  assert.ok(DIAGNOSTIC_OPERATIONS.has('shortcut_scope'))
  assert.ok(DIAGNOSTIC_REASON_CODES.has('foreground_watcher_failed'))
  assert.ok(DIAGNOSTIC_REASON_CODES.has('shortcut_scope_paused'))
  assert.ok(DIAGNOSTIC_REASON_CODES.has('shortcut_scope_title_mismatch'))
  assert.ok(DIAGNOSTIC_REASON_CODES.has('shortcut_scope_process_mismatch'))
  assert.ok(DIAGNOSTIC_REASON_CODES.has('shortcut_scope_no_foreground_window'))
})

test('打包资源与运行时清单包含前台监视脚本', () => {
  const packageConfig = JSON.parse(source('../package.json'))
  const manifest = JSON.parse(source('../scripts/runtime/manifest.json'))
  assert.ok(packageConfig.build.extraResources.some((entry) => (
    entry.from === 'src/assets/scripts/foreground_watcher.py' && entry.to === 'foreground_watcher.py'
  )))
  assert.ok(manifest.requiredScripts.includes('src/assets/scripts/foreground_watcher.py'))
  const main = source('../electron/main.js')
  assert.match(main, /startForegroundWatcher/)
  assert.match(main, /foregroundWatcher\?\.stop\(\)/)
  const watcherScript = source('../src/assets/scripts/foreground_watcher.py')
  assert.match(watcherScript, /foreground_state = \(game, reason, process_name, bounds\)/)
  assert.match(watcherScript, /if foreground_state != _last_foreground_state:/)
})
})()
