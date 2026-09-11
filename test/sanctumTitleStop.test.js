import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { EmergencyStopCoordinator } from '../electron/modules/automation/emergencyStop.js'
import { dispatchShortcutAction, normalizeGlobalShortcutSettings } from '../src/utils/shortcutConfig.js'
import { normalizePickerPresentation } from '../electron/modules/window/coordinates.js'
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='

test('公共检测过期不参与原生请求校验，仍检查日志与取消', async () => {
  let requests = 0
  const driver = new SanctumLiveDriver({ withHidden: fn => fn(), detection: {
    getState: () => ({ receivedAt: 0 }), subscribe: () => assert.fail('不应订阅公共识别') } })
  driver.profile = {}
  driver.logContext = { assertCurrent() {} }
  driver.client = { async request() { requests++; return { environment: { processId: 123 } } } }
  await driver.sessionRequest('interfaceState', {}, new AbortController().signal)
  assert.equal(requests, 1)
  const controller = new AbortController(); controller.abort()
  await assert.rejects(driver.sessionRequest('interfaceState', {}, controller.signal))
  assert.equal(requests, 1)
})

test('公共标题配置只发送运行必需数据，截图预览不进入原生请求', () => {
  const driver = new SanctumLiveDriver({ detection: { getTitleConfig: () => ({ threshold: .91, templates: { 'sanctum-map': { png }, 'sanctum-altar': { png } } }) } })
  const value = driver.titleOptions({ captures: { mapRegion: { png } }, preview: { png }, environment: {} })
  assert.equal(value.captures, undefined)
  assert.equal(value.preview, undefined)
  assert.equal(value.matchThreshold, .91)
  assert.deepEqual(Object.keys(value.interfaceTitles), ['sanctum-map'])
})

test('全局快捷键分派到同一协调器，准备、悬停、复制和高亮停止后丢弃迟到结果', async () => {
  for (const phase of ['preparing', 'hover', 'copy', 'highlight']) {
    const service = new SanctumService({})
    service.setEnabled(true); service.liveDriver = { close: async () => {} }
    let release, signal
    const task = service.runLiveAction(value => { signal = value; return new Promise(resolve => { release = resolve }) }, () => { service.state.reason = '不应应用' })
    await new Promise(resolve => setImmediate(resolve))
    service.state.status = phase
    const coordinator = new EmergencyStopCoordinator([{ id: 'sanctum', label: '圣所', stop: () => service.emergencyStop() }])
    const config = normalizeGlobalShortcutSettings({ end: 'Ctrl+Shift+F12' })
    assert.equal(config.end, 'Ctrl+Shift+F12')
    await dispatchShortcutAction('end', { end: () => coordinator.stopAll('shortcut') })
    assert.equal(signal.aborted, true)
    release({}); await task
    assert.equal(service.state.running, false)
    assert.notEqual(service.state.reason, '不应应用')
    await service.shutdown()
  }
  const source = fs.readFileSync(new URL('../src/assets/scripts/sanctum_native.py', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /0x23|Key\.end|End/)
  const view = fs.readFileSync(new URL('../src/domains/sanctum/SanctumView.vue', import.meta.url), 'utf8')
  assert.match(view, /settings\.globalShortcuts\.end/)
  const ipc = fs.readFileSync(new URL('../electron/modules/ipc/sanctum.js', import.meta.url), 'utf8')
  assert.match(ipc, /emergencyStop\.stopAll\('sanctum-page'\)/)
})

test('动态选择器网格限制有效行列，不改变已有用途默认配置', () => {
  assert.deepEqual(normalizePickerPresentation({ purpose: 'bag-inventory' }), { grid: undefined, title: undefined, hint: undefined })
  assert.deepEqual(normalizePickerPresentation({ grid: { columns: 12, rows: 12 }, title: '圣物仓库', hint: '拉出完整网格' }), { grid: { columns: 12, rows: 12 }, title: '圣物仓库', hint: '拉出完整网格' })
  for (const columns of [0, 25, 1.5, '5', NaN]) assert.throws(() => normalizePickerPresentation({ grid: { columns, rows: 4 } }))
})
