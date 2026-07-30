import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  createDiagnosticsSnapshot,
  diagnosticFileName,
  redactDiagnosticText,
  sanitizeModuleStates
} from '../electron/modules/system/diagnostics.js'

test('诊断快照只包含稳定环境字段并保留多屏负坐标与缩放', () => {
  const snapshot = createDiagnosticsSnapshot({
    appVersion: '1.0.0',
    electronVersion: '43.0.0',
    chromiumVersion: '150.0.0',
    nodeVersion: '24.17.0',
    platform: 'win32',
    release: '10.0.26100',
    arch: 'x64',
    administrator: true,
    generatedAt: '2026-07-31T00:00:00.000Z',
    displays: [
      { id: 1, primary: true, bounds: { x: 0, y: 0, width: 2560, height: 1440 }, scaleFactor: 1.5 },
      { id: 2, bounds: { x: -1920, y: -200, width: 1920, height: 1080 }, scaleFactor: 1.25, rotation: 0 }
    ],
    runtime: { ready: true, source: 'bundled', path: 'C:\\Users\\Alice\\App\\python.exe', version: '3.13.14', modules: ['numpy', 'cv2'] },
    gameDpi: { found: true, dpi: 144, scaleFactor: 1.5, windowTitle: '角色名称' },
    modules: [{ id: 'items', state: 'ready', detail: 'private' }]
  })
  assert.equal(snapshot.schemaVersion, 1)
  assert.equal(snapshot.displays[1].bounds.x, -1920)
  assert.equal(snapshot.displays[1].scaleFactor, 1.25)
  assert.deepEqual(snapshot.modules, [{ id: 'items', state: 'ready' }])
  const serialized = JSON.stringify(snapshot)
  assert.doesNotMatch(serialized, /Alice|python\.exe|角色名称|private/)
})

test('诊断文本遮蔽用户目录和凭据且部分失败不影响快照', () => {
  const redacted = redactDiagnosticText(
    'C:\\Users\\Alice\\AppData\\Roaming\\流放助手 POESESSID=secret cookie:abc',
    'C:\\Users\\Alice'
  )
  assert.doesNotMatch(redacted, /Alice|secret|abc/)
  assert.match(redacted, /%USERPROFILE%/)

  const snapshot = createDiagnosticsSnapshot({
    runtime: { ready: false, source: 'bundled', error: 'C:\\Users\\Alice\\python.exe POESESSID=secret' },
    gameDpi: { found: false, error: '未找到游戏窗口' }
  })
  assert.equal(snapshot.runtime.ready, false)
  assert.equal(snapshot.game.found, false)
  assert.doesNotMatch(JSON.stringify(snapshot), /secret/)
})

test('模块状态只接受公开白名单且诊断文件名稳定', () => {
  assert.deepEqual(sanitizeModuleStates([
    { id: 'bag', state: 'running' },
    { id: 'unknown', state: 'ready' },
    { id: 'items', state: 'private' }
  ]), [{ id: 'bag', state: 'running' }])
  assert.equal(diagnosticFileName(new Date('2026-07-31T08:09:10.000Z')), '流放助手-诊断-2026-07-31-080910.json')
})

test('诊断 IPC 只在用户确认保存后写文件并通过 preload 暴露', () => {
  const ipc = readFileSync(new URL('../electron/modules/ipc/system.js', import.meta.url), 'utf8')
  const preload = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
  const dashboard = readFileSync(new URL('../src/domains/dashboard/DashboardView.vue', import.meta.url), 'utf8')
  assert.match(ipc, /showSaveDialog/)
  assert.match(ipc, /result\.canceled \|\| !result\.filePath/)
  assert.match(ipc, /JSON\.stringify\(await snapshot\(modules\), null, 2\)/)
  assert.match(preload, /system-get-diagnostics/)
  assert.match(preload, /system-export-diagnostics/)
  assert.match(dashboard, /导出诊断/)
})
