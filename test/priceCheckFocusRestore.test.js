import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PRICE_CHECK_OVERLAY_CLOSE_REASONS,
  PriceCheckOverlayFocusSession,
  shouldRestoreGameFocus
} from '../electron/modules/priceCheck/overlayFocus.js'
import {
  activateWindowsGameWindow,
  WINDOW_ACTIVATION_CODES
} from '../electron/modules/window/activation.js'

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
    callback(null, JSON.stringify({ title: '流放之路', processName: 'PathOfExile_x64.exe' }))
  }

  const result = await activateWindowsGameWindow({
    pythonPath: 'python.exe',
    titles: ['流放之路'],
    processNames: ['PathOfExile_x64.exe'],
    execFileImpl
  })
  assert.equal(result.success, true)
  assert.equal(result.code, WINDOW_ACTIVATION_CODES.GAME_ACTIVATED)
  assert.equal(invocation.pythonPath, 'python.exe')
  assert.equal(invocation.options.windowsHide, true)
  const script = invocation.args[1]
  assert.equal(invocation.args.at(-2), JSON.stringify(['流放之路']))
  assert.equal(invocation.args.at(-1), JSON.stringify(['PathOfExile_x64.exe']))
  assert.match(script, /process_names/)
  assert.match(script, /EnumWindows/)
  assert.match(script, /def identity\(hwnd\)/)
  assert.match(script, /SetForegroundWindow/)
  assert.match(script, /GetForegroundWindow\(\) != hwnd_value/)
})

test('Windows 游戏聚焦区分目标缺失、权限、系统拒绝和目标变化', async () => {
  const expectedCodes = new Map([
    [23, WINDOW_ACTIVATION_CODES.GAME_NOT_FOUND],
    [24, WINDOW_ACTIVATION_CODES.PRIVILEGE_MISMATCH],
    [25, WINDOW_ACTIVATION_CODES.FOCUS_REFUSED],
    [26, WINDOW_ACTIVATION_CODES.TARGET_CHANGED],
    ['EPERM', WINDOW_ACTIVATION_CODES.ACTIVATION_ERROR]
  ])
  for (const [exitCode, expected] of expectedCodes) {
    const execFileImpl = (_pythonPath, _args, _options, callback) => {
      const error = new Error('focus failed')
      error.code = exitCode
      callback(error)
    }
    const result = await activateWindowsGameWindow({ pythonPath: 'python.exe', execFileImpl })
    assert.deepEqual(result, { success: false, code: expected })
  }

  const throwingExec = () => { throw new Error('spawn failed') }
  assert.deepEqual(await activateWindowsGameWindow({ pythonPath: 'python.exe', execFileImpl: throwingExec }), {
    success: false,
    code: WINDOW_ACTIVATION_CODES.ACTIVATION_ERROR
  })
  assert.deepEqual(await activateWindowsGameWindow({ pythonPath: '' }), {
    success: false,
    code: WINDOW_ACTIVATION_CODES.PYTHON_UNAVAILABLE
  })
})
