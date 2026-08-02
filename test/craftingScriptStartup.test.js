import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { resolveCraftingPython, startPythonProcess } from '../electron/modules/python/launcher.js'
import { waitForScriptStartup } from '../electron/modules/python/scriptEvents.js'
import { isSuccessfulScriptStart } from '../src/utils/scriptStartResult.js'
import { dispatchShortcutAction } from '../src/utils/shortcutConfig.js'

const fakeChild = (pid = 321) => {
  const child = new EventEmitter()
  child.pid = pid
  child.stdout = new EventEmitter()
  child.stderr = new EventEmitter()
  return child
}

test('制作启动只选择同时具备 pynput 和 pyperclip 的解释器', () => {
  const calls = []
  const pythonPath = resolveCraftingPython({
    detectPythonPathWithModules(modules) {
      calls.push(modules)
      return 'compatible-python'
    },
    detectPythonPath() {
      throw new Error('不应回退到未验证依赖的解释器')
    }
  })

  assert.equal(pythonPath, 'compatible-python')
  assert.deepEqual(calls, [['pynput', 'pyperclip']])
  assert.equal(resolveCraftingPython({
    detectPythonPathWithModules: () => null,
    detectPythonPath: () => 'incompatible-python'
  }), null)
})

test('开启仓库页识别时制作启动追加离线 OCR 依赖', () => {
  const calls = []
  resolveCraftingPython({
    detectPythonPathWithModules(modules) {
      calls.push(modules)
      return 'compatible-python'
    }
  }, true)
  assert.deepEqual(calls, [[
    'pynput', 'pyperclip', 'rapidocr', 'onnxruntime', 'cv2', 'mss', 'numpy'
  ]])
})

test('Python 子进程异步启动失败时启动 Promise 拒绝且不会假成功', async () => {
  const child = fakeChild(undefined)
  const started = startPythonProcess({
    pythonPath: 'python',
    scriptPath: 'crafting.py',
    spawnProcess: () => child
  })
  child.emit('error', new Error('spawn failed'))
  await assert.rejects(started, /spawn failed/)
})

test('Python 子进程确认 spawn 后返回真实进程并禁用 shell 转发', async () => {
  const child = fakeChild(456)
  let options
  const started = startPythonProcess({
    pythonPath: 'C:\\Program Files\\Python\\python.exe',
    scriptPath: 'C:\\Program Files\\流放助手\\crafting.py',
    spawnProcess(_command, _args, receivedOptions) {
      options = receivedOptions
      return child
    }
  })
  child.emit('spawn')
  assert.equal(await started, child)
  assert.equal(options.shell, false)
  assert.deepEqual(options.stdio, ['ignore', 'pipe', 'pipe'])
})

test('制作进程完成仓库选择和通货预检后才确认启动成功', async () => {
  const child = fakeChild(456)
  const startup = waitForScriptStartup(child, { timeoutMs: 100 })
  child.stdout.emit('data', 'EVENT {"event":"crafting-startup-succeeded","mode":"items"}\n')
  assert.deepEqual(await startup, {
    event: 'crafting-startup-succeeded',
    mode: 'items'
  })
})

test('制作进程在启动门禁前失败或退出时不得假报成功', async () => {
  const structured = fakeChild(456)
  const structuredStartup = waitForScriptStartup(structured, { timeoutMs: 100 })
  structured.stdout.emit('data', 'EVENT {"event":"stash-tab-selection-failed","reason":"没有找到通货页"}\n')
  await assert.rejects(structuredStartup, /没有找到通货页/)

  const exited = fakeChild(456)
  const exitedStartup = waitForScriptStartup(exited, { timeoutMs: 100 })
  exited.emit('close', 0)
  await assert.rejects(exitedStartup, /启动完成前已退出/)
})

test('IPC 在浮层就绪后启动进程，并等待脚本启动门禁成功', () => {
  const ipc = readFileSync(new URL('../electron/modules/ipc/python.js', import.meta.url), 'utf8')
  const overlayReady = ipc.indexOf('await prepareCraftingOverlay(')
  const processCreated = ipc.indexOf('const launch = createPythonProcess(')
  const startupWait = ipc.indexOf('waitForScriptStartup(', processCreated)
  const reportsRunning = ipc.indexOf("status: 'running'", processCreated)

  assert.ok(overlayReady > 0 && overlayReady < processCreated, '必须先让浮层完成加载，避免丢失启动错误')
  assert.ok(startupWait > processCreated && startupWait < reportsRunning, '必须先通过脚本启动门禁再报告运行中')

  for (const filename of ['crafting_template.py', 'map_rolling_template.py']) {
    const template = readFileSync(new URL(`../src/assets/scripts/${filename}`, import.meta.url), 'utf8')
    const preflight = template.indexOf('if not preflight_required_currencies():')
    const ready = template.indexOf('"crafting-startup-succeeded"', preflight)
    assert.ok(ready > preflight, `${filename} 必须在通货预检成功后报告启动就绪`)
  }
})

test('renderer 只有在成功结果包含有效进程标识时才进入运行态', () => {
  assert.equal(isSuccessfulScriptStart({ success: true, processId: 123 }), true)
  assert.equal(isSuccessfulScriptStart({ success: true }), false)
  assert.equal(isSuccessfulScriptStart({ success: true, processId: 0 }), false)
  assert.equal(isSuccessfulScriptStart({ success: false, processId: 123 }), false)
})

test('物品与地图快捷键分别只分发一次公共启动动作', () => {
  const calls = []
  const handlers = {
    itemStart: () => calls.push('item'),
    mapStart: () => calls.push('map')
  }
  assert.equal(dispatchShortcutAction('itemStart', handlers), true)
  assert.equal(dispatchShortcutAction('mapStart', handlers), true)
  assert.deepEqual(calls, ['item', 'map'])

  const service = readFileSync(new URL('../src/utils/scriptService.js', import.meta.url), 'utf8')
  assert.equal((service.match(/isSuccessfulScriptStart\(result\)/g) || []).length, 2)
})
