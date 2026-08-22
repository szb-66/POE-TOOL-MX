import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { sanitizeStartupReport } from '../electron/modules/system/startupEvent.js'

test('渲染端启动事件只接受固定枚举和长度受限文本', () => {
  assert.deepEqual(sanitizeStartupReport({ type: 'renderer-mounted' }), {
    phase: 'renderer', outcome: 'succeeded', reasonCode: 'none', message: ''
  })
  assert.deepEqual(sanitizeStartupReport({ type: 'renderer-error', message: 'boom' }), {
    phase: 'renderer', outcome: 'failed', reasonCode: 'renderer_error', message: 'boom'
  })
  assert.equal(sanitizeStartupReport({ type: 'unknown', message: 'boom' }), null)
  assert.equal(sanitizeStartupReport({ type: 'renderer-error', message: 'x'.repeat(1025) }), null)
  assert.equal(sanitizeStartupReport('renderer-mounted'), null)
  assert.deepEqual(sanitizeStartupReport({ type: 'dashboard-ready' }), {
    phase: 'dashboard', outcome: 'succeeded', reasonCode: 'none', message: ''
  })
  assert.deepEqual(sanitizeStartupReport({ type: 'renderer-runtime-failed', message: 'partial' }), {
    phase: 'renderer-runtime', outcome: 'failed', reasonCode: 'renderer_runtime_failed', message: 'partial'
  })
})

test('主进程在 ready 前启用本地 Crashpad 和崩溃保护', () => {
  const main = readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8')
  const readyIndex = main.indexOf('app.whenReady()')
  assert.ok(readyIndex > 0)
  assert.ok(main.indexOf("app.setPath('crashDumps'") < readyIndex)
  assert.ok(main.indexOf('crashReporter.start') < readyIndex)
  assert.ok(main.indexOf('crashGuard.install()') < readyIndex)
  assert.match(main, /--startup-safe-mode/)
  assert.match(main, /--diagnostic-fail-main/)
  assert.match(main, /--diagnostic-fail-load/)
  assert.match(main, /--diagnostic-crash-renderer/)
  assert.match(main, /--diagnostic-crash-main-native/)
  assert.match(main, /--diagnostic-exit-after-mounted/)
  assert.match(main, /--diagnostic-exit-after-dashboard-ready/)
  assert.match(main, /--diagnostic-exit-on-unrecoverable/)
})

test('开发启动器把显式诊断参数传给 Electron', () => {
  const launcher = readFileSync(new URL('../scripts/dev.js', import.meta.url), 'utf8')
  const processManager = readFileSync(new URL('../scripts/devProcess.js', import.meta.url), 'utf8')
  assert.match(launcher, /process\.argv\.slice\(2\)/)
  assert.match(launcher, /electronMainPath, \.\.\.diagnosticArguments/)
  assert.match(launcher, /runManagedElectronSession/)
  assert.match(processManager, /DEVELOPMENT_RESTART_EXIT_CODE/)
})

test('preload 与 Vue 启动入口完成受限启动握手', () => {
  const preload = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
  const renderer = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
  const ipc = readFileSync(new URL('../electron/modules/ipc/system.js', import.meta.url), 'utf8')
  assert.match(preload, /reportStartupEvent/)
  assert.match(preload, /startup-report/)
  assert.match(renderer, /renderer-mounted/)
  assert.match(renderer, /unhandledrejection/)
  assert.match(renderer, /renderer-bootstrap-failed/)
  assert.match(ipc, /sanitizeStartupReport/)
  assert.match(ipc, /report, _event\.sender/)
  assert.match(readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8'), /mainWindow\.webContents !== sender/)
  assert.match(readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8'), /crashGuard\.markStartupComplete\(\)/)
})

test('主窗口在开始加载前接入启动观察器，并保留开发故障注入边界', () => {
  const manager = readFileSync(new URL('../electron/modules/window/manager.js', import.meta.url), 'utf8')
  assert.match(manager, /beforeLoad\?\.\(mainWindow\)[\s\S]*?mainWindow\.load/)
  assert.match(manager, /diagnosticFailLoad/)
  assert.match(manager, /NODE_ENV === 'development'/)
})
