import test from 'node:test'
import assert from 'node:assert/strict'
import {
  WINDOW_ACTIVATION_CODES,
  WindowActivationService,
  selectTrustedGameWindow
} from '../electron/modules/window/activation.js'

const registry = {
  getTitles: () => ['流放之路', 'Path of Exile'],
  getProcessNames: () => ['PathOfExile_x64.exe']
}

test('游戏候选必须同时匹配标题和进程，浏览器标题碰撞会被排除', () => {
  const selected = selectTrustedGameWindow([
    { title: '流放之路 - Microsoft Edge', processName: 'msedge.exe', area: 999999, foreground: true },
    { title: 'Path of Exile', processName: 'PathOfExile_x64.exe', area: 100 }
  ], registry.getTitles(), registry.getProcessNames())

  assert.equal(selected.processName, 'PathOfExile_x64.exe')
  assert.equal(selected.title, 'Path of Exile')
})

test('游戏候选依次按标题、非最小化、当前前台和可见面积排序', () => {
  const candidates = [
    { title: 'Path of Exile', processName: 'PathOfExile_x64.exe', area: 900, foreground: true },
    { title: '流放之路 A', processName: 'PathOfExile_x64.exe', area: 9999, minimized: true, foreground: true },
    { title: '流放之路 B', processName: 'PathOfExile_x64.exe', area: 100, foreground: true },
    { title: '流放之路 C', processName: 'PathOfExile_x64.exe', area: 1000 }
  ]
  assert.equal(selectTrustedGameWindow(candidates, registry.getTitles(), registry.getProcessNames()).title, '流放之路 B')
})

test('游戏激活映射稳定结果码并限制目标摘要', async () => {
  const service = new WindowActivationService({
    gameWindowRegistry: registry,
    platform: 'win32',
    pythonPathProvider: () => 'python.exe',
    activateWindowsGame: async () => ({
      success: true,
      code: WINDOW_ACTIVATION_CODES.GAME_ACTIVATED,
      target: { title: '流放之路'.repeat(30), processName: 'C:\\Games\\PathOfExile_x64.exe', handle: '123' }
    })
  })
  const result = await service.activateGame({ source: 'unit-test' })
  assert.equal(result.success, true)
  assert.equal(result.code, WINDOW_ACTIVATION_CODES.GAME_ACTIVATED)
  assert.equal(result.target.processName, 'PathOfExile_x64.exe')
  assert.ok(result.target.title.length <= 80)
  assert.equal('handle' in result.target, false)
})

test('游戏激活覆盖目标缺失、权限不一致、目标变化和系统拒绝', async () => {
  for (const code of [
    WINDOW_ACTIVATION_CODES.GAME_NOT_FOUND,
    WINDOW_ACTIVATION_CODES.PRIVILEGE_MISMATCH,
    WINDOW_ACTIVATION_CODES.TARGET_CHANGED,
    WINDOW_ACTIVATION_CODES.FOCUS_REFUSED
  ]) {
    const service = new WindowActivationService({
      gameWindowRegistry: registry,
      platform: 'win32',
      pythonPathProvider: () => 'python.exe',
      activateWindowsGame: async () => ({ success: false, code })
    })
    assert.deepEqual(await service.activateGame({ source: 'unit-test' }), { success: false, code })
  }
})

test('非 Windows 跳过 Win32 游戏激活', async () => {
  let called = false
  const service = new WindowActivationService({
    gameWindowRegistry: registry,
    platform: 'linux',
    activateWindowsGame: async () => { called = true }
  })
  assert.deepEqual(await service.activateGame({ source: 'unit-test' }), {
    success: true,
    code: WINDOW_ACTIVATION_CODES.PLATFORM_SKIPPED
  })
  assert.equal(called, false)
})

test('助手恢复覆盖已销毁、原生成功和 Electron 回退补偿', async () => {
  const destroyed = new WindowActivationService({
    getMainWindow: () => ({ isDestroyed: () => true })
  })
  assert.deepEqual(await destroyed.activateMain({ source: 'unit-test' }), {
    success: false,
    code: WINDOW_ACTIVATION_CODES.MAIN_UNAVAILABLE
  })

  const window = { isDestroyed: () => false }
  const nativeSuccess = new WindowActivationService({
    getMainWindow: () => window,
    restoreMainWindow: async (_window, options) => {
      assert.equal(await options.nativeFocusFn(window), true)
      return true
    },
    restoreWindowsMain: async () => true
  })
  assert.equal((await nativeSuccess.activateMain({ source: 'unit-test' })).code, WINDOW_ACTIVATION_CODES.MAIN_ACTIVATED)

  let fallbackCalled = false
  const fallback = new WindowActivationService({
    getMainWindow: () => window,
    restoreMainWindow: async (_window, options) => {
      assert.equal(await options.nativeFocusFn(window), false)
      fallbackCalled = true
      return true
    },
    restoreWindowsMain: async () => false
  })
  assert.equal((await fallback.activateMain({ source: 'unit-test' })).success, true)
  assert.equal(fallbackCalled, true)
})
