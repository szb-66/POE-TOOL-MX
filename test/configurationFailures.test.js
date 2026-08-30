import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { configurationIssueFromFailure } from '../src/domains/configurationGuide/configurationFailures.js'
import { sanitizeOverlayGuideRequest } from '../shared/configurationGuideRequest.js'

test('通货缺失与类型不匹配映射到稳定的 suspect 配置项', () => {
  for (const failureCode of ['CONFIGURATION_MISSING', 'CURRENCY_NOT_FOUND', 'CURRENCY_TYPE_MISMATCH']) {
    const issue = configurationIssueFromFailure({
      moduleId: 'items',
      actionId: 'start',
      failureCode,
      configurationIssueId: 'currency.alteration',
      message: '请重新定位改造石'
    })
    assert.equal(issue.id, 'currency.alteration')
    assert.equal(issue.editorId, 'currency.alteration')
    assert.equal(issue.state, 'suspect')
  }
})

test('区域与模板的结构化错误可纠正，临时环境错误不会触发引导', () => {
  assert.equal(configurationIssueFromFailure({
    moduleId: 'puzzle',
    actionId: 'auto-place',
    failureCode: 'TARGET_MISMATCH'
  }).id, 'puzzle.atlas-region')
  assert.equal(configurationIssueFromFailure({
    moduleId: 'bag',
    actionId: 'start',
    failureCode: 'TEMPLATE_MATCH_FAILED',
    configurationIssueId: 'template.stash-title'
  }).id, 'template.stash-title')
  for (const failureCode of ['GAME_NOT_FOREGROUND', 'NETWORK_UNAVAILABLE', 'CLIPBOARD_UNAVAILABLE', 'SERVICE_BUSY', 'SOURCE_NOT_FOUND']) {
    assert.equal(configurationIssueFromFailure({ moduleId: 'puzzle', actionId: 'analyze', failureCode }), null)
  }
})

test('结构化失败问题必须属于当前模块与操作', () => {
  assert.equal(configurationIssueFromFailure({
    moduleId: 'bag',
    actionId: 'enable',
    failureCode: 'CURRENCY_NOT_FOUND',
    configurationIssueId: 'currency.alteration'
  }), null)
  assert.equal(configurationIssueFromFailure({
    moduleId: 'combat',
    actionId: 'portal',
    failureCode: 'DISPLAY_ENVIRONMENT_CHANGED',
    configurationIssueId: 'combat.potion.health.position'
  }), null)
  assert.equal(configurationIssueFromFailure({
    moduleId: 'story',
    actionId: 'start',
    failureCode: 'REGION_INVALID',
    configurationIssueId: 'puzzle.inventory-region'
  }), null)
})

test('账号、赛季与仓库校准的稳定错误码可直接定位配置', () => {
  assert.equal(configurationIssueFromFailure({ moduleId: 'price-check', actionId: 'capture', failureCode: 'UNAUTHENTICATED' })?.id, 'account.poe-cn')
  assert.equal(configurationIssueFromFailure({ moduleId: 'shop', actionId: 'start', failureCode: 'LEAGUE_REQUIRED' })?.id, 'account.league')
  assert.equal(configurationIssueFromFailure({ moduleId: 'shop', actionId: 'start', failureCode: 'CALIBRATION_REQUIRED' })?.id, 'stash-grid.any')
  assert.equal(configurationIssueFromFailure({ moduleId: 'shop', actionId: 'start', failureCode: 'UNSUPPORTED_TAB' })?.id, 'shop.stash-tabs')
})

test('浮窗 GuideRequest 仅接受白名单模块、动作和已知问题 ID，额外字段被移除', () => {
  assert.deepEqual(sanitizeOverlayGuideRequest({
    moduleId: 'items',
    actionId: 'start',
    focusIssueId: 'currency.chaos',
    coordinate: { x: 1, y: 2 },
    credential: 'secret',
    route: '/settings'
  }), {
    moduleId: 'items',
    actionId: 'start',
    focusIssueId: 'currency.chaos'
  })
  assert.equal(sanitizeOverlayGuideRequest({ moduleId: 'story', actionId: 'start', focusIssueId: 'currency.chaos' }), null)
  assert.equal(sanitizeOverlayGuideRequest({ moduleId: 'items', actionId: 'open-route', focusIssueId: 'currency.chaos' }), null)
  assert.equal(sanitizeOverlayGuideRequest({ moduleId: 'items', actionId: 'start', focusIssueId: 'currency.unknown' }), null)
})

test('主进程同时校验浮窗与主窗口发送方，不接受任意渲染进程调用', () => {
  const source = readFileSync(new URL('../electron/modules/ipc/configurationGuide.js', import.meta.url), 'utf8')
  assert.match(source, /overlay\.webContents !== event\.sender/)
  assert.match(source, /main\.webContents !== event\.sender/)
  assert.match(source, /sanitizeOverlayGuideRequest/)
  assert.doesNotMatch(source, /credential|coordinate|route/)
})
