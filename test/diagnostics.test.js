import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  collectDeviceInfo,
  createDiagnosticsSnapshot,
  diagnosticFileName,
  redactDiagnosticText,
  sanitizeDiagnosticEvent,
  sanitizeDiagnosticValue,
  sanitizeHealthStates,
  sanitizeModuleStates
} from '../electron/modules/system/diagnostics.js'
import { exportDiagnosticsFile } from '../electron/modules/system/diagnosticExport.js'
import { classifyDiagnosticError, classifyDiagnosticStage } from '../src/utils/diagnostics.js'

test('schema v3 诊断快照只接受稳定白名单并保留显示环境', () => {
  const snapshot = createDiagnosticsSnapshot({
    diagnosticId: '11111111-1111-4111-8111-111111111111',
    appVersion: '1.0.0', electronVersion: '43.0.0', chromiumVersion: '150.0.0', nodeVersion: '24.17.0',
    packaged: true, uptimeSeconds: 12.9, platform: 'win32', release: '10.0.26100', arch: 'x64',
    administrator: true, generatedAt: '2026-07-31T00:00:00.000Z',
    displays: [
      { id: 1, primary: true, bounds: { x: 0, y: 0, width: 2560, height: 1440 }, scaleFactor: 1.5 },
      { id: 2, bounds: { x: -1920, y: -200, width: 1920, height: 1080 }, scaleFactor: 1.25, rotation: 0 }
    ],
    runtime: { ready: true, source: 'bundled', path: 'C:\\Users\\Alice\\App\\python.exe', version: '3.13.14', modules: ['numpy', 'cv2'] },
    gameDpi: { found: true, dpi: 144, scaleFactor: 1.5, windowTitle: '角色名称' },
    health: [{ id: 'shortcuts', status: 'error', reasonCode: 'shortcut_registration_failed', text: 'private' }, { id: 'private', status: 'error' }],
    modules: [{ id: 'items', state: 'error', reasonCode: 'process_exit', detail: 'private' }],
    recentEvents: [{
      timestamp: '2026-07-31T00:00:00.000Z', sessionId: '22222222-2222-4222-8222-222222222222',
      appVersion: '1.0.0', area: 'items', operation: 'script_runtime', outcome: 'failed',
      reasonCode: 'process_exit', repeatCount: 2, metadata: { exitCode: 1, secret: 42 }, message: 'private'
    }]
  })
  assert.equal(snapshot.schemaVersion, 3)
  assert.equal(snapshot.diagnosticId, '11111111-1111-4111-8111-111111111111')
  assert.equal(snapshot.application.packaged, true)
  assert.equal(snapshot.application.uptimeSeconds, 12)
  assert.equal(snapshot.displays[1].bounds.x, -1920)
  assert.deepEqual(snapshot.health, [{ id: 'shortcuts', status: 'error', reasonCode: 'shortcut_registration_failed' }])
  assert.deepEqual(snapshot.modules, [{ id: 'items', state: 'error', reasonCode: 'process_exit' }])
  assert.deepEqual(snapshot.recentEvents[0].metadata, { exitCode: 1 })
  const serialized = JSON.stringify(snapshot)
  assert.doesNotMatch(serialized, /Alice|python\.exe|角色名称|private|secret/)
})

test('设备信息只保留兼容性字段且探测失败安全降级', () => {
  const result = collectDeviceInfo({
    platform: 'win32', release: '10.0.26100', version: 'Windows 11 Pro',
    cpus: [{ model: 'Example CPU' }, { model: 'Example CPU' }], totalMemoryBytes: 16 * 1024 ** 3,
    queryGpu: () => [{ Name: 'Example GPU', DriverVersion: '32.0.1', PNPDeviceID: 'secret-device-guid' }]
  })
  const snapshot = createDiagnosticsSnapshot({
    device: result.device, deviceAvailability: result.availability,
    context: { mode: 'capture', captureId: '33333333-3333-4333-8333-333333333333', area: 'puzzle',
      symptom: 'wrong_result', status: 'completed', startedAt: '2026-08-14T00:00:00.000Z',
      endedAt: '2026-08-14T00:01:00.000Z' }
  })
  assert.deepEqual(snapshot.device.cpu, { model: 'Example CPU', logicalCores: 2 })
  assert.deepEqual(snapshot.device.gpus, [{ model: 'Example GPU', driverVersion: '32.0.1' }])
  assert.equal(snapshot.device.memory.totalBytes, 16 * 1024 ** 3)
  assert.equal(snapshot.context.symptom, 'wrong_result')
  assert.doesNotMatch(JSON.stringify(snapshot), /PNP|secret-device-guid|hostname|serial|mac/i)

  const failed = collectDeviceInfo({ platform: 'win32', cpus: [], totalMemoryBytes: Number.NaN,
    queryGpu: () => { throw new Error('C:\\Users\\Alice\\gpu') } })
  assert.equal(failed.availability.gpu, false)
  assert.deepEqual(failed.device.gpus, [])
})

test('诊断分类区分识别、模板、坐标、网络、解析和数据故障', () => {
  assert.equal(classifyDiagnosticError({ code: 'OCR_EMPTY' }, 'automation_failed'), 'ocr_failed')
  assert.equal(classifyDiagnosticError({ code: 'TEMPLATE_NOT_FOUND' }, 'automation_failed'), 'template_match_failed')
  assert.equal(classifyDiagnosticError({ code: 'COORDINATE_INVALID' }, 'automation_failed'), 'coordinate_failed')
  assert.equal(classifyDiagnosticError({ code: 'REQUEST_TIMEOUT' }, 'request_failed'), 'network_timeout')
  assert.equal(classifyDiagnosticError({ code: 'RESPONSE_PARSE_FAILED' }, 'request_failed'), 'response_parse_failed')
  assert.equal(classifyDiagnosticError({ code: 'DATA_INVALID' }, 'data_unavailable'), 'data_invalid')
  assert.equal(classifyDiagnosticStage({ code: 'OCR_EMPTY' }, 'analysis'), 'recognition')
})

test('诊断结论只聚合当前会话并优先未恢复的直接证据', () => {
  const captureId = '33333333-3333-4333-8333-333333333333'
  const common = { sessionId: '22222222-2222-4222-8222-222222222222', appVersion: '1.0.4' }
  const snapshot = createDiagnosticsSnapshot({
    context: { mode: 'capture', captureId, area: 'puzzle', symptom: 'wrong_result', status: 'completed',
      startedAt: '2026-08-14T00:00:00.000Z', endedAt: '2026-08-14T00:01:00.000Z' },
    recentEvents: [
      { ...common, timestamp: '2026-08-13T00:00:00.000Z', area: 'puzzle', operation: 'analysis',
        outcome: 'failed', reasonCode: 'unknown_failure' },
      { ...common, captureId, timestamp: '2026-08-14T00:00:10.000Z', area: 'puzzle', operation: 'analysis',
        outcome: 'failed', reasonCode: 'ocr_failed', stageCode: 'recognition', repeatCount: 2 }
    ]
  })
  assert.equal(snapshot.findings.length, 1)
  assert.equal(snapshot.findings[0].reasonCode, 'ocr_failed')
  assert.equal(snapshot.findings[0].suggestedCheckCode, 'check_ocr_inputs')
  assert.deepEqual(snapshot.findings[0].evidence, ['recentEvents[1]'])
})

test('屏幕捕获诊断仅保留非敏感计数', () => {
  const event = sanitizeDiagnosticEvent({
    timestamp: '2026-08-14T00:00:00.000Z',
    sessionId: '11111111-1111-4111-8111-111111111111',
    appVersion: '1.0.4', area: 'puzzle', operation: 'region_capture', outcome: 'failed',
    reasonCode: 'capture_source_not_found',
    metadata: { displayCount: 1, sourceCount: 1, usableSourceCount: 0, matchedDisplayCount: 0, displayId: 2020828493 }
  })
  assert.equal(event.reasonCode, 'capture_source_not_found')
  assert.deepEqual(event.metadata, { displayCount: 1, sourceCount: 1, usableSourceCount: 0, matchedDisplayCount: 0 })
})

test('最终诊断递归遮蔽凭据、账号、邮件、IP 和各种本地路径', () => {
  const value = sanitizeDiagnosticValue({
    bearer: 'authorization: Bearer very-secret-token',
    json: '{"session_token":"very secret token"}',
    query: 'https://example.invalid/?POESESSID=query-secret&x=1',
    local: 'C:/Users/Alice/AppData/Roaming/file.log',
    localCase: 'c:\\users\\ALICE\\secret.txt',
    unc: '\\\\server\\users\\Alice\\data.json',
    identity: 'accountId=123456789 alice@example.com',
    network: '192.0.2.25 2001:db8::1'
  }, 'C:\\Users\\Alice')
  const serialized = JSON.stringify(value)
  for (const secret of ['very-secret-token', 'very secret token', 'query-secret', 'Alice', 'ALICE',
    'server', '123456789', 'alice@example.com', '192.0.2.25', '2001:db8::1']) {
    assert.doesNotMatch(serialized, new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
  }
  assert.match(serialized, /redacted|local-path|ip-address|email/)
})

test('运行时部分失败不会影响快照且自由文本仍被脱敏', () => {
  const snapshot = createDiagnosticsSnapshot({
    runtime: { ready: false, source: 'bundled', error: 'C:\\Users\\Alice\\python.exe POESESSID=secret' },
    gameDpi: { found: false, error: '未找到游戏窗口' }
  })
  assert.equal(snapshot.runtime.ready, false)
  assert.equal(snapshot.game.found, false)
  assert.doesNotMatch(JSON.stringify(snapshot), /Alice|secret/)
})

test('模块和健康状态只接受公开白名单且诊断文件名稳定', () => {
  assert.deepEqual(sanitizeModuleStates([
    { id: 'bag', state: 'running', reasonCode: 'automation_failed' },
    { id: 'unknown', state: 'ready' },
    { id: 'items', state: 'private' }
  ]), [{ id: 'bag', state: 'running', reasonCode: 'automation_failed' }])
  assert.deepEqual(sanitizeHealthStates([
    { id: 'shortcuts', status: 'error', reasonCode: 'shortcut_registration_failed' },
    { id: 'shortcuts', status: 'private' }
  ]), [{ id: 'shortcuts', status: 'error', reasonCode: 'shortcut_registration_failed' }])
  assert.equal(diagnosticFileName(new Date('2026-07-31T08:09:10.000Z')), '流放助手-诊断-2026-07-31-080910.json')
})

test('导出取消时不探测不写入，成功时格式化 JSON', async () => {
  let built = 0
  let written = null
  const canceled = await exportDiagnosticsFile({
    showSaveDialog: async () => ({ canceled: true }),
    buildSnapshot: async () => { built += 1; return {} },
    writeText: async () => { throw new Error('不应写入') }
  })
  assert.deepEqual(canceled, { success: false, canceled: true })
  assert.equal(built, 0)

  const success = await exportDiagnosticsFile({
    showSaveDialog: async () => ({ canceled: false, filePath: 'C:\\safe\\diagnostic.json' }),
    buildSnapshot: async () => ({ schemaVersion: 2 }),
    writeText: async (...args) => { written = args }
  })
  assert.equal(success.fileName, 'diagnostic.json')
  assert.equal(written[1], '{\n  "schemaVersion": 2\n}\n')
})

test('导出写入失败返回稳定错误且不泄露目标路径', async () => {
  const result = await exportDiagnosticsFile({
    showSaveDialog: async () => ({ canceled: false, filePath: 'C:\\Users\\Alice\\secret\\diagnostic.json' }),
    buildSnapshot: async () => ({ schemaVersion: 2 }),
    writeText: async () => { throw new Error('C:\\Users\\Alice\\secret 不可写') }
  })
  assert.equal(result.errorCode, 'DIAGNOSTIC_EXPORT_WRITE_FAILED')
  assert.doesNotMatch(JSON.stringify(result), /Alice|secret/)
})

test('诊断 IPC、preload 与问题反馈页暴露 v3 载荷、会话和安全事件通道', () => {
  const ipc = readFileSync(new URL('../electron/modules/ipc/system.js', import.meta.url), 'utf8')
  const preload = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
  const dashboard = readFileSync(new URL('../src/domains/dashboard/useDashboard.js', import.meta.url), 'utf8')
  const controller = readFileSync(new URL('../src/composables/useDiagnostics.js', import.meta.url), 'utf8')
  assert.match(ipc, /system-record-diagnostic-event/)
  assert.match(ipc, /exportDiagnosticsFile/)
  assert.match(preload, /system-get-diagnostics/)
  assert.match(preload, /system-export-diagnostics/)
  assert.match(preload, /system-record-diagnostic-event/)
  assert.match(preload, /system-diagnostic-capture-start/)
  assert.match(preload, /system-diagnostic-capture-finish/)
  assert.match(dashboard, /rendererHealth/)
  assert.match(dashboard, /reasonCode/)
  assert.match(controller, /prepareDiagnosticCaptureForFeedback/)
  assert.match(controller, /getRendererDiagnosticContext/)
})
