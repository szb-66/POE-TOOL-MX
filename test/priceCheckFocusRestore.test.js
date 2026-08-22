import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PRICE_CHECK_OVERLAY_CLOSE_REASONS,
  PriceCheckOverlayFocusSession,
  shouldRestoreGameFocus
} from '../electron/modules/priceCheck/overlayFocus.js'
import { restoreWindowsGameFocus } from '../electron/modules/priceCheck/clipboardCapture.js'

test('查价浮窗仅在用户关闭或鼠标离开时允许归还游戏焦点', () => {
  const reasons = PRICE_CHECK_OVERLAY_CLOSE_REASONS
  assert.equal(shouldRestoreGameFocus(reasons.USER_DISMISS), true)
  assert.equal(shouldRestoreGameFocus(reasons.POINTER_LEAVE), true)
  assert.equal(shouldRestoreGameFocus(reasons.BLUR), false)
  assert.equal(shouldRestoreGameFocus(reasons.EXTERNAL_ACTION), false)
  assert.equal(shouldRestoreGameFocus(reasons.SYSTEM), false)
  assert.equal(shouldRestoreGameFocus('unknown'), false)
})

test('查价浮窗焦点会话抑制外部动作并保证每次显示最多恢复一次', () => {
  const reasons = PRICE_CHECK_OVERLAY_CLOSE_REASONS
  const session = new PriceCheckOverlayFocusSession()

  session.begin()
  assert.equal(session.consumeRestoreRequest(reasons.USER_DISMISS), true)
  assert.equal(session.consumeRestoreRequest(reasons.POINTER_LEAVE), false)

  session.begin()
  session.preserveForExternalAction()
  assert.equal(session.consumeRestoreRequest(reasons.POINTER_LEAVE), false)

  session.begin()
  assert.equal(session.consumeRestoreRequest(reasons.BLUR), false)
  assert.equal(session.consumeRestoreRequest(reasons.POINTER_LEAVE), true)
})

test('Windows 游戏聚焦仅在脚本成功验证目标前台后返回成功', async () => {
  let invocation = null
  const execFileImpl = (pythonPath, args, options, callback) => {
    invocation = { pythonPath, args, options }
    callback(null)
  }

  assert.equal(await restoreWindowsGameFocus('python.exe', { platform: 'win32', execFileImpl }), true)
  assert.equal(invocation.pythonPath, 'python.exe')
  assert.equal(invocation.options.windowsHide, true)
  const script = invocation.args[1]
  assert.match(script, /POE_GAME_WINDOW_TITLES_FILE/)
  assert.match(script, /process_names/)
  assert.match(script, /EnumWindows/)
  assert.match(script, /window_matches_game/)
  assert.match(script, /SetForegroundWindow/)
  assert.match(script, /GetForegroundWindow\(\) == hwnd/)
})

test('Windows 游戏聚焦把目标缺失、系统拒绝和执行异常统一为失败', async () => {
  for (const code of [23, 25, 'EPERM']) {
    const execFileImpl = (_pythonPath, _args, _options, callback) => {
      const error = new Error('focus failed')
      error.code = code
      callback(error)
    }
    assert.equal(await restoreWindowsGameFocus('python.exe', { platform: 'win32', execFileImpl }), false)
  }

  const throwingExec = () => { throw new Error('spawn failed') }
  assert.equal(await restoreWindowsGameFocus('python.exe', { platform: 'win32', execFileImpl: throwingExec }), false)
  assert.equal(await restoreWindowsGameFocus('', { platform: 'win32' }), false)
  assert.equal(await restoreWindowsGameFocus('python.exe', { platform: 'linux' }), false)
})
