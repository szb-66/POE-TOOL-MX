import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { EventEmitter } from 'node:events'
import { EmergencyStopCoordinator } from '../electron/modules/automation/emergencyStop.js'
import { stopPythonProcess } from '../electron/modules/python/process.js'
import { isEmergencyCancellation } from '../src/utils/emergencyStopResult.js'

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

test('end 快捷键接入全自动化停止并保留前台作用域配置', () => {
  const scriptService = source('src/utils/scriptService.js')
  const emergencyIpc = source('electron/modules/ipc/emergencyStop.js')
  const preload = source('electron/preload.cjs')
  const shortcutManager = source('electron/modules/shortcuts/manager.js')

  assert.match(scriptService, /end:\s*emergencyStopAll/)
  assert.doesNotMatch(scriptService, /end:\s*stopCrafting/)
  for (const id of ['script', 'bag-stash', 'stash-pickup', 'junfeng', 'chaos-recipe', 'potion', 'combat-loop', 'portal', 'puzzle']) {
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
  assert.match(puzzle, /for \(const currentPage of requestedPages\) \{\s*this\.assertCurrentGeneration\(stopGeneration, '海图识别已紧急停止'\)\s*const result = await this\.runAnalyzer/)
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
