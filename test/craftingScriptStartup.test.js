import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { resolveCraftingPython, startPythonProcess } from '../electron/modules/python/launcher.js'
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
