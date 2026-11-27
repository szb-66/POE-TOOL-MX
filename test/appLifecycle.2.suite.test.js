import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { mkdtemp as _m0_mkdtemp, writeFile as _m0_writeFile, rm as _m0_rm } from 'node:fs/promises'
import _m0_path from 'node:path'
import _m0_os from 'node:os'
import { ClientEventsService as _m0_ClientEventsService } from '../electron/modules/clientEvents/service.js'
import { ClientLogTailer as _m0_ClientLogTailer } from '../electron/modules/clientEvents/tailer.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { mkdtemp as _m1_mkdtemp, writeFile as _m1_writeFile, utimes as _m1_utimes, rm as _m1_rm, stat as _m1_stat } from 'node:fs/promises'
import _m1_os from 'node:os'
import _m1_path from 'node:path'
import { ClientLogTailer as _m1_ClientLogTailer } from '../electron/modules/clientEvents/tailer.js'
import { ClientEventsService as _m1_ClientEventsService } from '../electron/modules/clientEvents/service.js'
import { SanctumLogContext as _m1_SanctumLogContext } from '../electron/modules/sanctum/logContext.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import _m2_fs from 'node:fs'
import _m2_os from 'node:os'
import _m2_path from 'node:path'
import _m2_vm from 'node:vm'
import { EventEmitter as _m2_EventEmitter } from 'node:events'
import * as _m2_combatConfig from '../shared/combatAssist.js'
import { normalizeAutomationTiming as _m2_normalizeAutomationTiming, pythonAutomationTiming as _m2_pythonAutomationTiming } from '../src/utils/operationDelay.js'
import { serverContext as _m2_serverContext } from '../shared/serverMode.js'
import { installServerIpcPolicy as _m2_installServerIpcPolicy } from '../electron/modules/app/serverIpcPolicy.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { createSectionDescriptorRegistry as _m3_createSectionDescriptorRegistry } from '../src/domains/settings/configTransfer/descriptors.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { DEVELOPMENT_RESTART_EXIT_CODE as _m4_DEVELOPMENT_RESTART_EXIT_CODE } from '../electron/modules/lifecycle/restart.js'
import { runManagedElectronSession as _m4_runManagedElectronSession } from '../scripts/devProcess.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import _m5_fs from 'node:fs'
import { spawnSync as _m5_spawnSync } from 'node:child_process'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import _m6_fs from 'node:fs'
import _m6_os from 'node:os'
import _m6_path from 'node:path'
import { createDevServerReadySignal as _m6_createDevServerReadySignal, waitForDevServerReady as _m6_waitForDevServerReady } from '../shared/devServerReady.js'
import _m7_assert from 'node:assert/strict'
import { readFileSync as _m7_readFileSync } from 'node:fs'
import _m7_test from 'node:test'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import _m8_os from 'node:os'
import _m8_path from 'node:path'
import { createDevelopmentStartupTrace as _m8_createDevelopmentStartupTrace } from '../shared/developmentStartupTrace.js'
import { summarizeStartupTrace as _m8_summarizeStartupTrace } from '../scripts/startupMetrics.js'
import { configurePythonRuntime as _m8_configurePythonRuntime, resolvePythonRuntimeAsync as _m8_resolvePythonRuntimeAsync } from '../electron/modules/python/detector.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import _m9_fs from 'node:fs/promises'
import _m9_os from 'node:os'
import _m9_path from 'node:path'
import { DiagnosticEventStore as _m9_DiagnosticEventStore, DIAGNOSTIC_EVENT_LIMIT as _m9_DIAGNOSTIC_EVENT_LIMIT, DIAGNOSTIC_EVENT_RETENTION_MS as _m9_DIAGNOSTIC_EVENT_RETENTION_MS } from '../electron/modules/system/diagnosticEventStore.js'
import _m10_test from 'node:test'
import _m10_assert from 'node:assert/strict'
import { readFileSync as _m10_readFileSync } from 'node:fs'
import { collectDeviceInfo as _m10_collectDeviceInfo, createAdministratorDetector as _m10_createAdministratorDetector, createDiagnosticsSnapshot as _m10_createDiagnosticsSnapshot, diagnosticFileName as _m10_diagnosticFileName, redactDiagnosticText as _m10_redactDiagnosticText, sanitizeDiagnosticEvent as _m10_sanitizeDiagnosticEvent, sanitizeDiagnosticValue as _m10_sanitizeDiagnosticValue, sanitizeHealthStates as _m10_sanitizeHealthStates, sanitizeModuleStates as _m10_sanitizeModuleStates } from '../electron/modules/system/diagnostics.js'
import { exportDiagnosticsFile as _m10_exportDiagnosticsFile } from '../electron/modules/system/diagnosticExport.js'
import { classifyDiagnosticError as _m10_classifyDiagnosticError, classifyDiagnosticStage as _m10_classifyDiagnosticStage } from '../src/utils/diagnostics.js'
import _m11_test from 'node:test'
import _m11_assert from 'node:assert/strict'
import { EventEmitter as _m11_EventEmitter } from 'node:events'
import { mkdtempSync as _m11_mkdtempSync, readFileSync as _m11_readFileSync, rmSync as _m11_rmSync } from 'node:fs'
import _m11_os from 'node:os'
import _m11_path from 'node:path'
import { createExitDiagnostics as _m11_createExitDiagnostics } from '../electron/modules/system/exitDiagnostics.js'
import { createStartupLogger as _m11_createStartupLogger } from '../electron/modules/system/startupLog.js'
import { createShutdownController as _m11_createShutdownController } from '../electron/modules/lifecycle/shutdown.js'
import { createApplicationTrayController as _m11_createApplicationTrayController } from '../electron/modules/lifecycle/tray.js'
import { createApplicationRestartController as _m11_createApplicationRestartController } from '../electron/modules/lifecycle/restart.js'
import { createCrashGuard as _m11_createCrashGuard } from '../electron/modules/system/crashGuard.js'
import { ApplicationUpdateService as _m11_ApplicationUpdateService } from '../electron/modules/update/service.js'
import _m12_test from 'node:test'
import _m12_assert from 'node:assert/strict'
import { disableFeatureModule as _m12_disableFeatureModule, enableFeatureModule as _m12_enableFeatureModule, isFeatureRuntimeBusy as _m12_isFeatureRuntimeBusy, registerFeatureRuntimeAdapter as _m12_registerFeatureRuntimeAdapter, setFeatureShortcutSynchronizer as _m12_setFeatureShortcutSynchronizer } from '../src/features/featureRuntime.js'
import _m13_test from 'node:test'
import _m13_assert from 'node:assert/strict'
import { mkdtemp as _m13_mkdtemp, readFile as _m13_readFile, rm as _m13_rm } from 'node:fs/promises'
import _m13_os from 'node:os'
import _m13_path from 'node:path'
import { InstalledUpdateRepository as _m13_InstalledUpdateRepository } from '../electron/modules/update/installedUpdateRepository.js'

// === Merged from clientStartupLatency.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const mkdtemp = _m0_mkdtemp
  const writeFile = _m0_writeFile
  const rm = _m0_rm
  const path = _m0_path
  const os = _m0_os
  const ClientEventsService = _m0_ClientEventsService
  const ClientLogTailer = _m0_ClientLogTailer
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }
const session = [{ id: 42, startedAt: '2026-09-01T00:00:00' }]
async function fixture(t, processProvider) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-client-startup-'))
  const file = path.join(root, 'Client.txt')
  await writeFile(file, '2026/09/10 10:00:00 [INFO Client 42] Generating level 83 area "MapWorldsCemetery" with seed 1\n')
  let value = { enabled: true, logPath: file }
  const service = new ClientEventsService({
    settings: { get: async () => ({ ...value }), save: async patch => (value = { ...value, ...patch }) }, processProvider
  })
  t.after(async () => { await service.stop(); await rm(root, { recursive: true, force: true }) })
  return { service, file }
}

test('并发初始化复用同一任务，恢复与首次轮询只探测一次，后续轮询刷新', async t => {
  let calls = 0
  const { service } = await fixture(t, async () => { calls++; return session })
  const recovered = []
  service.onEvent(event => { if (event.recovered) recovered.push(event) })
  const first = service.initialize()
  assert.equal(service.initialize(), first)
  await first
  assert.equal(calls, 1)
  assert.equal(recovered.length, 1)
  assert.equal(recovered[0].type, 'area-entered')
  assert.deepEqual(service.snapshot().events, [])
  await service.pollProcess()
  assert.equal(calls, 2)
})

test('停止后未完成的探测不能恢复状态或创建监听', async t => {
  const probe = deferred(); const entered = deferred()
  const { service } = await fixture(t, () => { entered.resolve(); return probe.promise })
  const recovered = []
  service.onEvent(event => { if (event.recovered) recovered.push(event) })
  const pending = service.initialize()
  await entered.promise
  await service.stop()
  probe.resolve(session)
  await pending
  assert.equal(service.snapshot().state, 'stopped')
  assert.equal(service.processTimer, null)
  assert.equal(service.tailer, null)
  assert.deepEqual(recovered, [])
})

test('初始化期间禁用不会被旧结果重新启用', async t => {
  const probe = deferred(); const entered = deferred()
  const { service } = await fixture(t, () => { entered.resolve(); return probe.promise })
  const pending = service.initialize()
  await entered.promise
  await service.updateSettings({ enabled: false })
  probe.resolve(session)
  await pending
  assert.equal(service.snapshot().enabled, false)
  assert.equal(service.snapshot().state, 'stopped')
  assert.equal(service.processTimer, null)
})

test('探测失败也不重复探测，PID 创建时间排除历史会话', async t => {
  let calls = 0
  const { service } = await fixture(t, async () => { calls++; throw new Error('probe failed') })
  await service.initialize()
  assert.equal(calls, 1)
  assert.equal(service.context, null)
  service.processProvider = async () => [{ id: 42, startedAt: '2026-09-11T00:00:00' }]
  await service.updateSettings({ enabled: true })
  assert.equal(service.context, null)
})

test('Tailer 在恢复回调中停止后不再创建轮询器', async t => {
  const { file } = await fixture(t, null)
  const entered = deferred(); const release = deferred(); const states = []
  const tailer = new ClientLogTailer({ filePath: file, onRecovery: () => { entered.resolve(); return release.promise }, onState: event => states.push(event.state) })
  t.after(() => tailer.stop())
  const pending = tailer.start()
  await entered.promise
  tailer.stop()
  release.resolve()
  await pending
  assert.equal(tailer.timer, null)
  assert.equal(states.at(-1), 'stopped')
})

test('尚未开始监听时并发 ensureStarted 复用任务，已启动实例不重复读取设置', async t => {
  let calls = 0
  const { service } = await fixture(t, async () => { calls++; return session })
  const first = service.ensureStarted()
  assert.equal(service.ensureStarted(), first)
  await first
  assert.equal(calls, 1)
  service.settings.get = () => { throw new Error('unexpected settings read') }
  await service.ensureStarted()
  assert.equal(calls, 1)
})

test('停止旧启动后重新启用，新代次不被旧探测覆盖', async t => {
  const oldProbe = deferred(); const entered = deferred(); let calls = 0
  const { service } = await fixture(t, () => { calls++; if (calls === 1) { entered.resolve(); return oldProbe.promise } return Promise.resolve(session) })
  const first = service.initialize()
  await entered.promise
  await service.stop()
  await service.updateSettings({ enabled: true })
  const activeTailer = service.tailer
  oldProbe.resolve([])
  await first
  assert.equal(service.tailer, activeTailer)
  assert.equal(service.snapshot().state, 'started')
  assert.ok(service.processTimer)
  assert.equal(service.context.processId, 42)
})

test('后续并发轮询合并同一探测，启动细分计时不持续记录周期轮询', async t => {
  const traceEvents = []
  const { service } = await fixture(t, async () => session)
  service.trace = { async measure(phase, operation) { traceEvents.push(phase); return operation() } }
  await service.initialize()
  const release = deferred(); let calls = 0
  service.processProvider = () => { calls++; return release.promise }
  const first = service.pollProcess(); const second = service.pollProcess()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(calls, 1)
  release.resolve(session)
  await Promise.all([first, second])
  assert.deepEqual(traceEvents.sort(), ['client-log-recovery', 'client-process-probe'])
})
})()

// === Merged from clientTimestamp.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const mkdtemp = _m1_mkdtemp
  const writeFile = _m1_writeFile
  const utimes = _m1_utimes
  const rm = _m1_rm
  const stat = _m1_stat
  const os = _m1_os
  const path = _m1_path
  const ClientLogTailer = _m1_ClientLogTailer
  const ClientEventsService = _m1_ClientEventsService
  const SanctumLogContext = _m1_SanctumLogContext
test('日志仅修改时间不撤销已绑定圣所，同大小改写仍撤销', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'client-timestamp-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const file = path.join(root, 'Client.txt')
  const body = area => `2026/09/11 02:00:07 1 x [DEBUG Client 123] Generating level 83 area "${area}" with seed 1\n2026/09/11 02:00:08 2 x [INFO Client 123] [LOADING SCREEN] (圣所宝库) Duration = 0.9 seconds\n`
  await writeFile(file, body('SanctumVaults'))
  const events = new ClientEventsService({ processProvider: async () => [{ id: 123, startedAt: '2026-09-10T00:00:00Z' }] })
  events.status.enabled = true
  const tailer = new ClientLogTailer({ filePath: file, intervalMs: 100000,
    onRecovery: entries => events.recover(entries), onState: state => events.setState(state) })
  t.after(() => tailer.stop())
  await tailer.start()
  let invalid = 0, failure
  const bound = new SanctumLogContext(events, 123, error => { invalid++; failure = error })
  t.after(() => bound.close())
  const info = await stat(file)
  await utimes(file, info.atime, new Date(info.mtimeMs + 5000))
  await tailer.poll()
  assert.equal(invalid, 0)
  assert.equal(bound.assertCurrent().floorNumber, 2)
  assert.equal(tailer.generation, 0)
  await writeFile(file, body('SanctumCellar'))
  await tailer.poll()
  assert.equal(invalid, 1)
  assert.match(failure.message, /重新同步/)
  assert.throws(() => bound.assertCurrent())
  assert.equal(tailer.generation, 1)
})
})()

// === Merged from combatTrustedScript.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const fs = _m2_fs
  const os = _m2_os
  const path = _m2_path
  const vm = _m2_vm
  const EventEmitter = _m2_EventEmitter
  const combatConfig = _m2_combatConfig
  const normalizeAutomationTiming = _m2_normalizeAutomationTiming
  const pythonAutomationTiming = _m2_pythonAutomationTiming
  const serverContext = _m2_serverContext
  const installServerIpcPolicy = _m2_installServerIpcPolicy
const moduleUrl = new URL('../electron/modules/ipc/combat.js', import.meta.url)
const templateUrl = new URL('../src/assets/scripts/combat_assist_template.py', import.meta.url)

function createHarness(t, controller = null, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'combat-trusted-script-'))
  t.after(() => {
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()))
    fs.rmSync(directory, { recursive: true, force: true })
  })
  const handlers = new Map()
  const launches = []
  const activations = []
  const killedPids = []
  const trustedTemplate = fs.readFileSync(templateUrl, 'utf8')
  const sandbox = {
    fs, path, URL, structuredClone, process, console,
    ...combatConfig, normalizeAutomationTiming, pythonAutomationTiming,
    ipcMain: { handle: (name, callback) => handlers.set(name, callback) },
    spawnOperationProcess: ({ pythonPath, scriptPath, args = [], fallbackSpawn }) => fallbackSpawn(pythonPath, [scriptPath, ...args]),
    stopPythonProcess: async (child, { killTree }) => killTree(child.pid),
    spawn: (python, args) => {
      // This is the execution boundary: inspect what the actual IPC handler
      // would launch, without spawning Python or sending any game input.
      assert.equal(python, 'fake-python')
      assert.equal(fs.readFileSync(args[0], 'utf8'), trustedTemplate)
      const config = JSON.parse(fs.readFileSync(args[4], 'utf8'))
      const child = new EventEmitter()
      child.stdout = new EventEmitter()
      child.stderr = new EventEmitter()
      child.pid = launches.length + 1
      child.exitCode = null
      child.killed = false
      launches.push({ args, config, child })
      if (!options.keepResidentAlive || args[2] === 'sample' || args[2] === 'portal') {
        queueMicrotask(() => {
          child.stdout.emit('data', Buffer.from('{"success":true,"color":255}\n'))
          child.exitCode = 0
          child.emit('close', 0)
        })
      }
      return child
    }
  }
  if (controller) {
    sandbox.ipcMain.on = () => {}
    installServerIpcPolicy(sandbox.ipcMain, controller)
  }
  // Evaluate the production handler with only Electron and process launching
  // replaced; filesystem writes, normalization and handler bodies remain real.
  const source = fs.readFileSync(moduleUrl, 'utf8')
    .replace(/^import\s+[\s\S]*?\sfrom\s+['"][^'"]+['"]\r?\n/gm, '')
    .replace(/\bexport\s+(?=(?:async\s+)?function)/g, '')
    .replaceAll('import.meta.url', JSON.stringify(moduleUrl.href))
  vm.runInNewContext(`${source}\nglobalThis.register = registerCombatHandlers`, sandbox)
  sandbox.register({
    detectPythonPath: () => 'fake-python',
    killPythonProcessTree: async pid => {
      killedPids.push(pid)
      const launch = launches.find(item => item.child.pid === pid)
      if (launch) {
        launch.child.killed = true
        launch.child.exitCode = 0
      }
      return true
    }
  }, {
    activateGameWindow: async reason => {
      activations.push(reason)
      return options.activateResult || { success: true }
    },
    describeGameActivationFailure: code => `激活失败:${code}`,
    getMainWindow: () => null
  }, { getFilePaths: () => ({ tempDir: directory }) })
  return { handlers, launches, activations, killedPids, directory, trustedTemplate }
}

function createSettingsHarness(harness) {
  const source = fs.readFileSync(new URL('../src/domains/settings/settingsStore.js', import.meta.url), 'utf8')
  const update = source.slice(source.indexOf('  function updateCombatAssist('), source.indexOf('  function updateStashTabSelection('))
  const scope = {
    normalizeCombatAssist: combatConfig.normalizeCombatAssist,
    combatAssist: { value: combatConfig.createDefaultCombatAssist() },
    combatConfigRevision: 0,
    combatCommitQueue: Promise.resolve(),
    saved: [],
    saveSettings() { scope.saved.push(structuredClone(scope.combatAssist.value)) },
    electronApi: { combat: {
      updatePotionConfig: config => Promise.resolve(harness.handlers.get('combat-update-potion-config')({}, config)),
      updateLoopConfig: config => Promise.resolve(harness.handlers.get('combat-update-loop-config')({}, config))
    } }
  }
  vm.runInNewContext(`${update}\nglobalThis.update = updateCombatAssist`, scope)
  return scope
}

test('国服和国际服录入战斗按键可保存配置，配置保存不会启动游戏操作', async t => {
  for (const server of ['cn', 'international']) {
    const harness = createHarness(t, { context: serverContext(server), switching: false })
    const settings = createSettingsHarness(harness)
    const config = combatConfig.createDefaultCombatAssist()
    config.potion.health.keys = ['1', '2']
    config.loop.items = [{ id: 'test-loop', key: '3', enabled: true, intervalMs: 1000 }]
    config.portal.openKey = 'T'
    const result = await settings.update(config)
    assert.equal(result.success, true, `${server}: ${result.error}`)
    assert.deepEqual(settings.saved[0], combatConfig.normalizeCombatAssist(config))
    for (const mode of ['potion', 'loop']) {
      const stored = JSON.parse(fs.readFileSync(path.join(harness.directory, `combat_${mode}_config.json`), 'utf8'))
      assert.deepEqual(stored.potion.health.keys, ['1', '2'])
      assert.equal(stored.loop.items[0].key, '3')
      assert.equal(stored.portal.openKey, 'T')
    }
    assert.equal(harness.launches.length, 0)
    assert.equal(harness.activations.length, 0)
    for (const channel of ['combat-start-potion', 'combat-start-loop', 'combat-execute-portal']) {
      const start = await harness.handlers.get(channel)({}, { config: combatConfig.createDefaultCombatAssist() })
      assert.equal(start.success, false)
      assert.equal(typeof start.error, 'string', `${server}: 应到达配置校验而非服务器门禁`)
    }
    assert.equal(harness.launches.length, 0)
    assert.equal(harness.activations.length, 0)
  }
})

test('配置同步失败显示结构化错误原文，并保留已保存的按键', async t => {
  const controller = { context: serverContext(), switching: true }
  const harness = createHarness(t, controller)
  const settings = createSettingsHarness(harness)
  const config = combatConfig.createDefaultCombatAssist()
  config.potion.health.keys = ['1']
  const result = await settings.update(config)
  assert.equal(result.success, false)
  assert.equal(result.error, '正在切换服务器，暂不接受新任务')
  assert.equal(settings.saved.length, 0)
  controller.switching = false
  harness.handlers.set('combat-update-loop-config', () => ({ success: false, error: { message: '循环配置写入失败' } }))
  const loopFailure = await settings.update(config)
  assert.equal(loopFailure.success, false)
  assert.equal(loopFailure.error, '循环配置写入失败')
  assert.equal(settings.saved.length, 0)
  const stored = JSON.parse(fs.readFileSync(path.join(harness.directory, 'combat_potion_config.json'), 'utf8'))
  assert.deepEqual(stored.potion.health.keys, settings.combatAssist.value.potion.health.keys)
})

test('采样及三种战斗操作忽略注入的Python正文和脚本路径，始终执行内置模板', async t => {
  const harness = createHarness(t)
  const config = combatConfig.createDefaultCombatAssist()
  config.potion.health.point = { x: 20, y: 30 }
  config.potion.health.keys = ['1']
  config.potion.mana.enabled = false
  config.loop.items = [{ enabled: true, key: '2', intervalMs: 1000 }]
  config.portal = { openKey: 'T', clickPoint: { x: 40, y: 50 }, waitMs: 500 }
  const untrustedPath = path.join(harness.directory, 'injected.py')
  const payload = {
    scriptContent: 'raise RuntimeError("INJECTED_SCRIPT_MUST_NEVER_RUN")',
    scriptPath: untrustedPath,
    point: { x: -20, y: 30, extra: 'not-a-point-field' },
    config,
    automationTiming: { operationDelayMs: 50 }
  }
  for (const channel of ['combat-sample-pixel', 'combat-start-potion', 'combat-start-loop', 'combat-execute-portal']) {
    const result = await harness.handlers.get(channel)({}, payload)
    assert.equal(result.success, true, `${channel}: ${result.error}`)
  }
  assert.deepEqual(harness.launches.map(launch => launch.args[2]), ['sample', 'potion', 'loop', 'portal'])
  assert.deepEqual(harness.activations, ['combat-sample-pixel', 'combat-portal'])
  assert.deepEqual(harness.launches[0].config, { point: { x: -20, y: 30 } })
  assert.equal(fs.existsSync(untrustedPath), false)
  assert.equal(fs.readFileSync(path.join(harness.directory, 'combat_assist.py'), 'utf8'), harness.trustedTemplate)
})

test('自动战斗被动喝药与主动循环开启和关闭不触发前台窗口激活', async t => {
  const harness = createHarness(t, null, {
    keepResidentAlive: true,
    activateResult: { success: false, code: 'focus-refused' }
  })
  const config = combatConfig.createDefaultCombatAssist()
  config.potion.health.point = { x: 20, y: 30 }
  config.potion.health.keys = ['1']
  config.potion.mana.enabled = false
  config.loop.items = [{ enabled: true, key: '2', intervalMs: 1000 }]
  const payload = { config, automationTiming: { operationDelayMs: 50 } }

  const potionStart = await harness.handlers.get('combat-start-potion')({}, payload)
  assert.equal(potionStart.success, true)
  const loopStart = await harness.handlers.get('combat-start-loop')({}, payload)
  assert.equal(loopStart.success, true)
  const potionStop = await harness.handlers.get('combat-stop-potion')({})
  assert.equal(potionStop.success, true)
  const loopStop = await harness.handlers.get('combat-stop-loop')({})
  assert.equal(loopStop.success, true)

  assert.deepEqual(harness.activations, [])
  assert.deepEqual(harness.launches.map(launch => launch.args[2]), ['potion', 'loop'])
  assert.deepEqual(harness.killedPids, [1, 2])
})

test('非法采样坐标在激活窗口、写脚本和启动进程前拒绝', async t => {
  const harness = createHarness(t)
  for (const point of [undefined, { x: 'bad', y: 1 }, { x: Infinity, y: 2 }]) {
    const result = await harness.handlers.get('combat-sample-pixel')({}, { point, scriptContent: 'injected' })
    assert.equal(result.success, false)
    assert.match(result.error, /坐标/)
  }
  assert.equal(harness.activations.length, 0)
  assert.equal(harness.launches.length, 0)
  assert.deepEqual(fs.readdirSync(harness.directory), [])
})

test('内置战斗模板随应用资源一起分发', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.ok(manifest.build.files.includes('src/assets/scripts/combat_assist_template.py'))
})
})()

// === Merged from configTransferDescriptors.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const createSectionDescriptorRegistry = _m3_createSectionDescriptorRegistry
function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    dump: () => Object.fromEntries(values)
  }
}

function mockContext() {
  const storage = memoryStorage()
  const presetStore = {
    itemPresets: [{ id: 'item-current', name: '做装', checkInitialItem: true, moduleTwo: {}, moduleThree: {}, moduleEldritch: {} }],
    essencePresets: [{ id: 'essence-current', name: '精华', affixGroups: [], essencePosition: { x: 10, y: 20 } }],
    harvestPresets: [{ id: 'harvest-current', name: '花园', affixGroups: [] }],
    mapPresets: [{ id: 'map-current', name: '地图', map: { method: 'alchemy', grid: {} } }],
    currentItemPresetId: 'item-current',
    currentEssencePresetId: 'essence-current',
    currentHarvestPresetId: 'harvest-current',
    currentMapPresetId: 'map-current',
    savePresets() { storage.setItem('mapPresets', JSON.stringify(this.mapPresets)) }
  }
  const storyStore = {
    storyPresets: [{ id: 'story-current', name: '剧情', chapters: [] }],
    skillPresets: [{ id: 'skill-current', name: '技能', chapterSkills: [] }],
    currentStoryPresetId: 'story-current',
    currentSkillPresetId: 'skill-current',
    save() { storage.setItem('storyGuide:v1', JSON.stringify({ storyPresets: this.storyPresets, skillPresets: this.skillPresets })) }
  }
  return { storage, presetStore, storyStore, createToolSiteId: () => 'imported-site' }
}

test('descriptor registry exposes all supported transfer sections', () => {
  const registry = createSectionDescriptorRegistry(mockContext())
  assert.deepEqual([...registry.keys()], [
    'preset.item', 'preset.essence', 'preset.harvest', 'preset.map', 'preset.heist', 'preset.story', 'preset.storySkill', 'settings.combatAssist', 'settings.toolSites'
  ])
  for (const removed of ['preset.chart', 'preset.shop', 'settings.automation', 'device.shortcuts']) {
    assert.equal(registry.has(removed), false)
  }
})

test('map descriptor creates a non-current copy and restores the snapshot', () => {
  const context = mockContext()
  const descriptor = createSectionDescriptorRegistry(context).get('preset.map')
  const snapshot = descriptor.snapshot()
  const plan = descriptor.planImport({ items: [{
    recordKey: 'shared-map', name: '地图', data: { method: 'chaos' },
    deviceGrid: { startX: 10, startY: 20, offsetX: 30, offsetY: 31, rows: 5, cols: 12 }
  }] }, { acceptDeviceGrid: false })
  descriptor.persist(plan)
  assert.equal(context.presetStore.mapPresets.length, 2)
  assert.equal(context.presetStore.mapPresets[1].name, '地图（导入）')
  assert.equal(context.presetStore.currentMapPresetId, 'map-current')
  assert.equal(context.presetStore.mapPresets[1].map.grid.startX, 0)
  descriptor.rollback(snapshot)
  assert.equal(context.presetStore.mapPresets.length, 1)
  assert.equal(context.presetStore.currentMapPresetId, 'map-current')
})

test('tool sites keep local URL conflicts and persist only new sites', () => {
  const context = mockContext()
  context.storage.setItem('toolSiteDirectory', JSON.stringify({
    version: 1,
    sites: [{ id: 'local', name: 'Local', url: 'https://example.com/', description: '', imageUrl: '' }]
  }))
  const descriptor = createSectionDescriptorRegistry(context).get('settings.toolSites')
  const plan = descriptor.planImport({ sites: [
    { name: 'Shared', url: 'https://example.com' },
    { name: 'New', url: 'https://new.example/' }
  ] })
  assert.deepEqual(plan.summary, { added: 1, conflicts: 1 })
  descriptor.persist(plan)
  const stored = JSON.parse(context.storage.dump().toolSiteDirectory)
  assert.equal(stored.sites.length, 2)
  assert.equal(stored.sites[0].name, 'Local')
  assert.equal(stored.sites[1].id, 'imported-site')
})
})()

// === Merged from devProcess.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const DEVELOPMENT_RESTART_EXIT_CODE = _m4_DEVELOPMENT_RESTART_EXIT_CODE
  const runManagedElectronSession = _m4_runManagedElectronSession
test('专用重启退出码会保留开发服务器并重新拉起 Electron', async () => {
  const exitCodes = [DEVELOPMENT_RESTART_EXIT_CODE, 0]
  let launches = 0
  let closeCalls = 0
  const result = await runManagedElectronSession({
    launchElectron: async () => {
      launches += 1
      assert.equal(closeCalls, 0)
      return exitCodes.shift()
    },
    closeServer: async () => { closeCalls += 1 }
  })

  assert.equal(result, 0)
  assert.equal(launches, 2)
  assert.equal(closeCalls, 1)
})

test('非重启退出码不会重新拉起并会关闭开发服务器', async () => {
  let launches = 0
  let closeCalls = 0
  const result = await runManagedElectronSession({
    launchElectron: async () => {
      launches += 1
      return 2
    },
    closeServer: async () => { closeCalls += 1 }
  })

  assert.equal(result, 2)
  assert.equal(launches, 1)
  assert.equal(closeCalls, 1)
})

test('重拉后的 Electron 正常退出时关闭开发服务器且不再启动第三个进程', async () => {
  const exitCodes = [DEVELOPMENT_RESTART_EXIT_CODE, 0]
  const observed = []
  const result = await runManagedElectronSession({
    launchElectron: async () => {
      const code = exitCodes.shift()
      observed.push(code)
      return code
    },
    closeServer: async () => { observed.push('server-closed') }
  })

  assert.equal(result, 0)
  assert.deepEqual(observed, [DEVELOPMENT_RESTART_EXIT_CODE, 0, 'server-closed'])
})

test('Electron 启动失败时仍关闭开发服务器并向调用方保留错误', async () => {
  const failure = new Error('spawn failed')
  let closeCalls = 0

  await assert.rejects(
    runManagedElectronSession({
      launchElectron: async () => { throw failure },
      closeServer: async () => { closeCalls += 1 }
    }),
    error => error === failure
  )
  assert.equal(closeCalls, 1)
})
})()

// === Merged from devServerOrigin.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const fs = _m5_fs
  const spawnSync = _m5_spawnSync
const source = (filePath) => fs.readFileSync(new URL(filePath, import.meta.url), 'utf8')

function readViteConfig(testContext) {
  const env = { ...process.env }
  if (testContext) env.NODE_TEST_CONTEXT = 'child-v8'
  else delete env.NODE_TEST_CONTEXT
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    const { default: config } = await import('./vite.config.js')
    console.log(JSON.stringify({ cacheDir: config.cacheDir, optimizeDeps: config.optimizeDeps }))
  `], { cwd: new URL('..', import.meta.url), env, encoding: 'utf8', windowsHide: true })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout)
}

test('并行 SSR 测试隔离 Vite 缓存并禁用客户端预构建，开发服务器保留预构建', () => {
  const development = readViteConfig(false)
  const firstTest = readViteConfig(true)
  const secondTest = readViteConfig(true)

  assert.equal(development.cacheDir, undefined)
  assert.equal(development.optimizeDeps.noDiscovery, false)
  assert.ok(development.optimizeDeps.include.includes('element-plus/es/components/*/style/css'))
  for (const config of [firstTest, secondTest]) {
    assert.match(config.cacheDir, /[\\/]node_modules[\\/]\.vite-test[\\/]\d+$/)
    assert.equal(config.optimizeDeps.noDiscovery, true)
    assert.deepEqual(config.optimizeDeps.include, [])
  }
  assert.notEqual(firstTest.cacheDir, secondTest.cacheDir)
})

test('开发服务器固定使用 3000 端口且不自动切换 LocalStorage origin', () => {
  const viteConfig = source('../vite.config.js')
  const launcher = source('../scripts/dev.js')

  assert.match(viteConfig, /port:\s*3000/)
  assert.match(viteConfig, /strictPort:\s*true/)
  assert.match(launcher, /DEV_SERVER_URL = `http:\/\/localhost:\$\{DEV_SERVER_PORT\}`/)
  assert.match(launcher, /VITE_DEV_SERVER_URL: DEV_SERVER_URL/)
  assert.doesNotMatch(launcher, /httpServer\.address\(\)/)
})

test('开发端口占用时给出不会切换数据 origin 的提示', () => {
  const launcher = source('../scripts/dev.js')

  assert.match(launcher, /error\?\.message === `Port \$\{DEV_SERVER_PORT\} is already in use`/)
  assert.match(launcher, /不会切换端口以免读取到另一份本地数据/)
  assert.match(launcher, /process\.exit\(1\)/)
})

test('开发服务器只预热首屏并忽略生成数据目录', () => {
  const viteConfig = source('../vite.config.js')

  assert.match(viteConfig, /warmup:\s*(?:isNodeTest\s*\?\s*undefined\s*:\s*)?\{[\s\S]*?DashboardRouteView\.vue/)
  assert.match(viteConfig, /isNodeTest\s*=\s*Boolean\(process\.env\.NODE_TEST_CONTEXT\)/)
  assert.match(viteConfig, /optimizeDeps:\s*\{[\s\S]*?'vue'[\s\S]*?'element-plus'/)
  assert.match(viteConfig, /watch:\s*\{[\s\S]*?crafting-raw[\s\S]*?unique-items-raw/)
  assert.doesNotMatch(viteConfig, /warmup:[\s\S]*?pageLoaders/)
  assert.doesNotMatch(viteConfig, /element-plus\/dist\/index\.css/)
})
})()

// === Merged from devServerReady.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const fs = _m6_fs
  const os = _m6_os
  const path = _m6_path
  const createDevServerReadySignal = _m6_createDevServerReadySignal
  const waitForDevServerReady = _m6_waitForDevServerReady
test('未配置开发服务器就绪信号路径时直接跳过等待', async () => {
  const result = await waitForDevServerReady({ env: {} })
  assert.deepEqual(result, { waited: false, status: 'skipped' })
})

test('开发服务器已就绪时立即返回且清理会删除信号文件', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-dev-ready-test-'))
  const signal = createDevServerReadySignal({ runId: 'ready-now', tmpDir })
  try {
    signal.markReady()
    const result = await waitForDevServerReady({
      env: { POE_DEV_SERVER_READY_FILE: signal.filePath, POE_DEV_PARENT_PID: String(process.pid) },
      pollIntervalMs: 5
    })
    assert.deepEqual(result, { waited: false, status: 'ready' })
    signal.cleanup()
    assert.equal(fs.existsSync(signal.filePath), false)
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})

test('开发服务器延迟就绪时会等待直到写入 ready 状态', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-dev-ready-test-'))
  const signal = createDevServerReadySignal({ runId: 'ready-later', tmpDir })
  try {
    setTimeout(() => signal.markReady(), 30)
    const result = await waitForDevServerReady({
      env: { POE_DEV_SERVER_READY_FILE: signal.filePath, POE_DEV_PARENT_PID: String(process.pid) },
      pollIntervalMs: 10,
      timeoutMs: 2000
    })
    assert.deepEqual(result, { waited: true, status: 'ready' })
  } finally {
    signal.cleanup()
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})

test('开发服务器启动失败或父进程已退出时快速失败而不挂起', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-dev-ready-test-'))
  const failedSignal = createDevServerReadySignal({ runId: 'failed', tmpDir })
  const orphanSignal = createDevServerReadySignal({ runId: 'orphan', tmpDir })
  try {
    failedSignal.markFailed('EADDRINUSE')
    await assert.rejects(
      waitForDevServerReady({
        env: { POE_DEV_SERVER_READY_FILE: failedSignal.filePath, POE_DEV_PARENT_PID: String(process.pid) },
        pollIntervalMs: 5
      }),
      error => error.code === 'DEV_SERVER_FAILED'
    )

    await assert.rejects(
      waitForDevServerReady({
        env: { POE_DEV_SERVER_READY_FILE: orphanSignal.filePath, POE_DEV_PARENT_PID: '999999' },
        pollIntervalMs: 5,
        isProcessAlive: () => false
      }),
      error => error.code === 'DEV_LAUNCHER_EXITED'
    )
  } finally {
    failedSignal.cleanup()
    orphanSignal.cleanup()
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})

test('主进程与 PoB 下载模块不顶层静态加载重型非首屏依赖', () => {
  const mainSource = fs.readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8')
  const pobDownloadSource = fs.readFileSync(new URL('../electron/modules/pobLauncher/download.js', import.meta.url), 'utf8')
  assert.doesNotMatch(mainSource, /^import\s+.*from\s+['"]electron-updater['"]/m)
  assert.doesNotMatch(mainSource, /^import\s+.*from\s+['"]\.\.\/scripts\/generateServerTradeCatalog\.js['"]/m)
  assert.doesNotMatch(pobDownloadSource, /^import\s+.*from\s+['"]cheerio['"]/m)
  assert.doesNotMatch(pobDownloadSource, /^import\s+.*from\s+['"]yauzl['"]/m)
})
})()

// === Merged from devToolsStartup.test.js ===
await (async () => {
  const assert = _m7_assert
  const readFileSync = _m7_readFileSync
  const test = _m7_test
const managerSource = readFileSync(
  new URL('../electron/modules/window/manager.js', import.meta.url),
  'utf8'
)

test('开发环境启动不会无条件展开 DevTools', () => {
  const startupBranch = managerSource.match(
    /if \(process\.env\.NODE_ENV === 'development' && devServerUrl\) \{([\s\S]*?)\n  \} else \{/
  )

  assert.ok(startupBranch, '应保留开发服务器加载分支')
  assert.match(startupBranch[1], /mainWindow\.loadURL\(devServerUrl\)/)
  assert.doesNotMatch(startupBranch[1], /openDevTools/)
})

test('仍可通过显式调试模式操作打开 DevTools', () => {
  assert.match(
    managerSource,
    /export function setDevToolsVisible\(visible\)[\s\S]*?openDevTools\(\{ mode: 'right', activate: true \}\)/
  )
})
})()

// === Merged from developmentStartupTrace.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const os = _m8_os
  const path = _m8_path
  const createDevelopmentStartupTrace = _m8_createDevelopmentStartupTrace
  const summarizeStartupTrace = _m8_summarizeStartupTrace
  const configurePythonRuntime = _m8_configurePythonRuntime
  const resolvePythonRuntimeAsync = _m8_resolvePythonRuntimeAsync
test('启动事件使用统一入口时间，保留失败并且日志故障不改变业务结果', async () => {
  const events = []
  const trace = createDevelopmentStartupTrace({
    env: { POE_STARTUP_RUN_ID: 'test-123', POE_STARTUP_STARTED_AT: '1000' },
    now: () => 1400,
    write: (_path, line) => events.push(JSON.parse(line))
  })
  const error = new Error('probe failed')
  await assert.rejects(trace.measure('probe', () => { throw error }), value => value === error)
  assert.deepEqual(events.map(event => [event.runId, event.elapsedMs, event.outcome]), [
    ['test-123', 400, 'started'], ['test-123', 400, 'failed']
  ])
  const broken = createDevelopmentStartupTrace({
    env: { POE_STARTUP_RUN_ID: 'test-123', POE_STARTUP_STARTED_AT: '1000' },
    write: () => { throw new Error('read only') }
  })
  assert.equal(await broken.measure('probe', () => 42), 42)
  assert.equal(createDevelopmentStartupTrace({ env: {} }).record('probe'), undefined)
})

test('组件挂载不是首页可操作，缺失就绪或超过完整启动预算不能通过', () => {
  const events = [
    { phase: 'window-visible', outcome: 'succeeded', elapsedMs: 9000 },
    { phase: 'dashboard', outcome: 'succeeded', elapsedMs: 11000 }
  ]
  assert.equal(summarizeStartupTrace(events).complete, false)
  events.push({ phase: 'interactive', outcome: 'succeeded', elapsedMs: 61000 })
  assert.deepEqual(summarizeStartupTrace(events).budget, { window: true, interactive: false })
  events[2].elapsedMs = 14000
  assert.deepEqual(summarizeStartupTrace(events).budget, { window: true, interactive: true })
})

test('Python 异步探测复用并发任务，缺失运行时返回不可用而不抛出或阻塞调用方', async () => {
  configurePythonRuntime({ isPackaged: true, resourcesPath: path.join(os.tmpdir(), `missing-poe-runtime-${process.pid}`) })
  try {
    const first = resolvePythonRuntimeAsync()
    const second = resolvePythonRuntimeAsync()
    assert.equal(first, second)
    const result = await first
    assert.equal(result.ready, false)
    assert.equal(result.path, null)
    assert.equal(await resolvePythonRuntimeAsync(), result)
  } finally {
    configurePythonRuntime({ isPackaged: false, resourcesPath: process.resourcesPath || '' })
  }
})
})()

// === Merged from diagnosticEventStore.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const fs = _m9_fs
  const os = _m9_os
  const path = _m9_path
  const DiagnosticEventStore = _m9_DiagnosticEventStore
  const DIAGNOSTIC_EVENT_LIMIT = _m9_DIAGNOSTIC_EVENT_LIMIT
  const DIAGNOSTIC_EVENT_RETENTION_MS = _m9_DIAGNOSTIC_EVENT_RETENTION_MS
async function temporaryStore(t, options = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'poe-diagnostics-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  return { root, store: new DiagnosticEventStore({ userDataPath: root, ...options }) }
}

test('事件存储仅接受白名单字段并记录失败后的恢复', async (t) => {
  let now = Date.parse('2026-08-01T00:00:00.000Z')
  const { store } = await temporaryStore(t, {
    appVersion: '1.0.0', sessionId: '11111111-1111-4111-8111-111111111111', now: () => now
  })
  await store.record({
    area: 'priceCheck', operation: 'query', outcome: 'failed', reasonCode: 'request_failed',
    message: 'POESESSID=secret', metadata: { httpStatus: 500, private: 1 }
  })
  now += 1000
  await store.record({ area: 'priceCheck', operation: 'query', outcome: 'recovered' })
  const result = await store.read()
  assert.equal(result.corrupt, false)
  assert.equal(result.events.length, 2)
  assert.deepEqual(result.events[0].metadata, { httpStatus: 500 })
  assert.doesNotMatch(JSON.stringify(result), /secret|private|message/)
  assert.equal(result.events[1].outcome, 'recovered')
  assert.equal('reasonCode' in result.events[1], false)
})

test('60 秒内相同事件合并并支持并发调用', async (t) => {
  let now = Date.parse('2026-08-01T00:00:00.000Z')
  const { store } = await temporaryStore(t, {
    appVersion: '1.0.0', sessionId: '11111111-1111-4111-8111-111111111111', now: () => now
  })
  await Promise.all(Array.from({ length: 10 }, () => store.record({
    area: 'items', operation: 'script_start', outcome: 'failed', reasonCode: 'process_start_failed'
  })))
  const result = await store.read()
  assert.equal(result.events.length, 1)
  assert.equal(result.events[0].repeatCount, 10)
})

test('事件按 7 天与 200 条裁剪', async (t) => {
  let now = Date.parse('2026-08-01T00:00:00.000Z')
  const { store } = await temporaryStore(t, {
    appVersion: '1.0.0', sessionId: '11111111-1111-4111-8111-111111111111', now: () => now
  })
  for (let index = 0; index < DIAGNOSTIC_EVENT_LIMIT + 5; index += 1) {
    await store.record({ area: 'items', operation: 'script_runtime', outcome: 'failed', reasonCode: 'process_exit' })
    now += 61_000
  }
  assert.equal((await store.read()).events.length, DIAGNOSTIC_EVENT_LIMIT)
  now += DIAGNOSTIC_EVENT_RETENTION_MS
  assert.equal((await store.read()).events.length, 0)
})

test('损坏文件安全降级并可由后续写入重建', async (t) => {
  const { root, store } = await temporaryStore(t, {
    appVersion: '1.0.0', sessionId: '11111111-1111-4111-8111-111111111111'
  })
  const directory = path.join(root, 'diagnostics')
  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(path.join(directory, 'events.json'), '{broken', 'utf8')
  assert.equal((await store.read()).corrupt, true)
  const recorded = await store.record({
    area: 'system', operation: 'runtime_check', outcome: 'failed', reasonCode: 'runtime_unavailable'
  })
  assert.equal(recorded.recorded, true)
  const rebuilt = await store.read()
  assert.equal(rebuilt.corrupt, false)
  assert.equal(rebuilt.events.length, 1)
})

test('兼容读取 v1 事件文件并在后续写入升级为 v2', async (t) => {
  const { root, store } = await temporaryStore(t, {
    appVersion: '1.0.4', sessionId: '11111111-1111-4111-8111-111111111111'
  })
  const directory = path.join(root, 'diagnostics')
  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(path.join(directory, 'events.json'), JSON.stringify({ schemaVersion: 1, events: [] }), 'utf8')
  assert.equal((await store.read()).corrupt, false)
  await store.record({ area: 'items', operation: 'script_start', outcome: 'failed', reasonCode: 'process_start_failed' })
  const upgraded = JSON.parse(await fs.readFile(path.join(directory, 'events.json'), 'utf8'))
  assert.equal(upgraded.schemaVersion, 2)
})

test('诊断会话关联事件、15 分钟超时且不关联后续事件', async (t) => {
  let now = Date.parse('2026-08-14T00:00:00.000Z')
  const { store } = await temporaryStore(t, {
    appVersion: '1.0.4', sessionId: '11111111-1111-4111-8111-111111111111', now: () => now
  })
  const started = await store.startCapture({ area: 'puzzle', symptom: 'wrong_result' })
  assert.equal(started.success, true)
  await store.record({ area: 'puzzle', operation: 'analysis', outcome: 'failed',
    reasonCode: 'ocr_failed', stageCode: 'recognition' })
  now += 15 * 60 * 1000 + 1
  await store.record({ area: 'puzzle', operation: 'analysis', outcome: 'failed', reasonCode: 'ocr_failed' })
  const result = await store.read()
  assert.equal(result.lastCapture.status, 'timed_out')
  assert.equal(result.events[0].captureId, started.capture.captureId)
  assert.equal('captureId' in result.events[1], false)
})

test('诊断会话不会与开始前一分钟内的同类故障合并', async (t) => {
  let now = Date.parse('2026-08-14T00:00:00.000Z')
  const { store } = await temporaryStore(t, {
    appVersion: '1.0.4', sessionId: '11111111-1111-4111-8111-111111111111', now: () => now
  })
  const failure = { area: 'puzzle', operation: 'analysis', outcome: 'failed', reasonCode: 'ocr_failed', stageCode: 'recognition' }
  await store.record(failure)
  now += 1000
  const started = await store.startCapture({ area: 'puzzle', symptom: 'wrong_result' })
  await store.record(failure)
  const events = (await store.read()).events
  assert.equal(events.length, 2)
  assert.equal('captureId' in events[0], false)
  assert.equal(events[1].captureId, started.capture.captureId)
})

test('应用重启后将活动诊断会话标记为中断并允许清除', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'poe-diagnostics-restart-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const first = new DiagnosticEventStore({ userDataPath: root, appVersion: '1.0.4',
    sessionId: '11111111-1111-4111-8111-111111111111' })
  const started = await first.startCapture({ area: 'bag', symptom: 'crash_or_exit' })
  const restarted = new DiagnosticEventStore({ userDataPath: root, appVersion: '1.0.4',
    sessionId: '22222222-2222-4222-8222-222222222222' })
  const status = await restarted.getCaptureStatus()
  assert.equal(status.lastCapture.status, 'interrupted')
  assert.equal((await restarted.cancelCapture({ captureId: started.capture.captureId })).success, true)
  assert.equal((await restarted.getCaptureStatus()).lastCapture, null)
})
})()

// === Merged from diagnostics.test.js ===
await (async () => {
  const test = _m10_test
  const assert = _m10_assert
  const readFileSync = _m10_readFileSync
  const collectDeviceInfo = _m10_collectDeviceInfo
  const createAdministratorDetector = _m10_createAdministratorDetector
  const createDiagnosticsSnapshot = _m10_createDiagnosticsSnapshot
  const diagnosticFileName = _m10_diagnosticFileName
  const redactDiagnosticText = _m10_redactDiagnosticText
  const sanitizeDiagnosticEvent = _m10_sanitizeDiagnosticEvent
  const sanitizeDiagnosticValue = _m10_sanitizeDiagnosticValue
  const sanitizeHealthStates = _m10_sanitizeHealthStates
  const sanitizeModuleStates = _m10_sanitizeModuleStates
  const exportDiagnosticsFile = _m10_exportDiagnosticsFile
  const classifyDiagnosticError = _m10_classifyDiagnosticError
  const classifyDiagnosticStage = _m10_classifyDiagnosticStage
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

test('管理员状态探测异步执行并在进程内复用同一任务', async () => {
  let calls = 0
  let release
  const detect = createAdministratorDetector({
    platform: 'win32',
    execFileAsyncFn: () => {
      calls += 1
      return new Promise(resolve => { release = resolve })
    }
  })
  const first = detect()
  const second = detect()
  assert.strictEqual(first, second)
  assert.equal(calls, 1)
  release({ stdout: 'True\r\n' })
  assert.equal(await first, true)
  assert.equal(await detect(), true)
  assert.equal(calls, 1)
})

test('诊断快照只暴露最近海图识别失败证据摘要和结构化完整性', () => {
  const snapshot = createDiagnosticsSnapshot({
    puzzleFailureEvidence: {
      success: true,
      evidence: {
        referenceId: '11111111-1111-4111-8111-111111111111',
        occurredAt: '2026-08-26T01:02:03Z',
        attemptCount: 3,
        estimatedBytes: 123456,
        completeness: 'partial',
        completenessReasons: ['IMAGE_ENCODING_FAILED', 'C:\\Users\\Private\\secret']
      },
      integrity: { status: 'partial', reasons: ['IMAGE_ENCODING_FAILED', 'POESESSID=secret'] }
    }
  })
  assert.deepEqual(snapshot.puzzleRecognitionFailureEvidence, {
    available: true,
    integrity: { status: 'partial', reasons: ['IMAGE_ENCODING_FAILED'] },
    referenceId: '11111111-1111-4111-8111-111111111111',
    occurredAt: '2026-08-26T01:02:03.000Z',
    attemptCount: 3,
    estimatedBytes: 123456,
    completeness: 'partial',
    completenessReasons: ['IMAGE_ENCODING_FAILED']
  })
  assert.doesNotMatch(JSON.stringify(snapshot), /Private|POESESSID|secret/)
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
})()

// === Merged from exitDiagnostics.test.js ===
await (async () => {
  const test = _m11_test
  const assert = _m11_assert
  const EventEmitter = _m11_EventEmitter
  const mkdtempSync = _m11_mkdtempSync
  const readFileSync = _m11_readFileSync
  const rmSync = _m11_rmSync
  const os = _m11_os
  const path = _m11_path
  const createExitDiagnostics = _m11_createExitDiagnostics
  const createStartupLogger = _m11_createStartupLogger
  const createShutdownController = _m11_createShutdownController
  const createApplicationTrayController = _m11_createApplicationTrayController
  const createApplicationRestartController = _m11_createApplicationRestartController
  const createCrashGuard = _m11_createCrashGuard
  const ApplicationUpdateService = _m11_ApplicationUpdateService
function fixture(log) {
  const events = [], app = new EventEmitter(), proc = new EventEmitter()
  app.quit = () => app.emit('before-quit', { preventDefault() {} })
  app.exit = code => { app.emit('quit', {}, code); proc.emit('exit', code) }
  const diagnostic = createExitDiagnostics({ app, processObject: proc, log: log || { record: e => events.push(e) } })
  return { app, proc, diagnostic, events }
}

test('退出来源跨清理后二次 quit、最终退出保持首因', async () => {
  const { app, proc, diagnostic, events } = fixture()
  const shutdown = createShutdownController({ app, cleanup: () => diagnostic.cleanup(async () => {}) })
  diagnostic.request('tray_exit')
  app.quit()
  await shutdown.done
  diagnostic.request('window_all_closed')
  app.emit('will-quit')
  app.emit('quit', {}, 0)
  proc.emit('exit', 0)
  assert.equal(diagnostic.firstSource, 'tray_exit')
  assert.equal(events.filter(e => e.phase === 'exit-before-quit').length, 2)
  assert.deepEqual(events.filter(e => e.phase === 'exit-cleanup').map(e => e.outcome), ['started', 'succeeded'])
  assert.match(events.at(-1).message, /firstSource=tray_exit.*code=0/)
  diagnostic.dispose()
  assert.equal(proc.listenerCount('exit'), 0)
})

test('未知退出和日志抛错不会改变清理结果', async () => {
  const f = fixture()
  f.app.quit()
  assert.equal(f.diagnostic.firstSource, 'unknown')
  const broken = fixture({ record() { throw new Error('disk unavailable') } })
  broken.diagnostic.request('application_restart')
  assert.equal(await broken.diagnostic.cleanup(async () => 42), 42)
  const failure = new Error('original cleanup failure')
  await assert.rejects(broken.diagnostic.cleanup(async () => { throw failure }), error => error === failure)
  assert.doesNotThrow(() => broken.app.exit(1))
})

test('窗口 IPC 候选、托盘隐藏和关闭选择不会污染首因', () => {
  const f = fixture()
  const window = { isDestroyed: () => false, hide() {} }
  const tray = createApplicationTrayController({
    app: f.app, exitDiagnostics: f.diagnostic, getMainWindow: () => window,
    createTray: () => ({ setToolTip() {}, setContextMenu() {}, on() {}, destroy() {} }),
    createMenu: x => x
  })
  const close = () => {
    const source = f.diagnostic.windowCloseSource(window)
    f.diagnostic.record('window-close-request', source)
    if (tray.handleMainWindowClose({ preventDefault() {} }, window)) return
    f.diagnostic.request(source)
    f.app.quit()
  }
  f.diagnostic.withWindowCloseSource(window, close)
  assert.equal(f.diagnostic.firstSource, '')
  assert.equal(f.events[0].reasonCode, 'window_close_ipc')
  tray.resolveCloseChoice({ behavior: 'tray' })
  assert.equal(f.diagnostic.firstSource, '')
  tray.configure({ behavior: 'tray', promptSuppressed: true })
  close()
  assert.equal(f.diagnostic.firstSource, '')
  tray.configure({ behavior: 'exit', promptSuppressed: true })
  f.diagnostic.withWindowCloseSource(window, close)
  assert.equal(f.diagnostic.firstSource, 'window_close_ipc')
})

test('关闭选择、托盘、原生关闭可分别归因', () => {
  for (const source of ['close_choice_exit', 'tray_exit', 'native_window_close']) {
    const f = fixture(), window = {}
    const tray = createApplicationTrayController({ app: f.app, exitDiagnostics: f.diagnostic })
    if (source === 'close_choice_exit') {
      tray.handleMainWindowClose({ preventDefault() {} }, window)
      tray.resolveCloseChoice({ behavior: 'exit' })
    } else if (source === 'tray_exit') tray.requestQuit()
    else f.diagnostic.request(f.diagnostic.windowCloseSource(window))
    assert.equal(f.diagnostic.firstSource, source)
  }
})

test('重启、更新安装和致命异常在退出前记录来源', async () => {
  const restart = fixture()
  const controller = createApplicationRestartController({
    exitDiagnostics: restart.diagnostic,
    cleanup: () => restart.diagnostic.cleanup(async () => {}), clearCache: async () => {},
    markCleanupComplete() {}, restart: () => restart.app.exit(75), terminateAfterFailure() {}
  })
  assert.equal((await controller.requestRestart()).success, true)
  assert.equal(restart.events[0].reasonCode, 'application_restart')
  const update = fixture(), updater = new EventEmitter()
  updater.setFeedURL = () => {}
  updater.quitAndInstall = () => update.app.exit(0)
  const service = new ApplicationUpdateService({
    updater, isPackaged: false, currentVersion: '1.0.0', exitDiagnostics: update.diagnostic,
    cleanup: () => update.diagnostic.cleanup(async () => {})
  })
  service.downloadReady = true
  assert.equal((await service.restartAndInstall()).success, true)
  assert.equal(update.events[0].reasonCode, 'update_install')
  service.dispose()
  const fatal = fixture()
  const guard = createCrashGuard({ app: fatal.app, processObject: fatal.proc, exitDiagnostics: fatal.diagnostic })
  guard.install()
  fatal.proc.emit('unhandledRejection', new Error('failure'))
  assert.equal(fatal.diagnostic.firstSource, 'unhandled_rejection')
  assert.match(fatal.events.at(-1).message, /code=1/)
  guard.dispose()
})

test('会话日志跨事件关联，独立启动使用不同会话并保留脱敏', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'poe-exit-log-'))
  try {
    const first = createStartupLogger({ userDataPath: directory })
    first.record({ phase: 'app-start' })
    first.record({ phase: 'exit-process', message: 'token=secret' })
    createStartupLogger({ userDataPath: directory }).record({ phase: 'app-start' })
    const events = readFileSync(first.filePath, 'utf8').trim().split('\n').map(JSON.parse)
    assert.equal(events[0].sessionId, events[1].sessionId)
    assert.notEqual(events[0].sessionId, events[2].sessionId)
    assert.equal(events[0].pid, process.pid)
    assert.doesNotMatch(events[1].message, /secret/)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
})()

// === Merged from featureRuntime.test.js ===
await (async () => {
  const test = _m12_test
  const assert = _m12_assert
  const disableFeatureModule = _m12_disableFeatureModule
  const enableFeatureModule = _m12_enableFeatureModule
  const isFeatureRuntimeBusy = _m12_isFeatureRuntimeBusy
  const registerFeatureRuntimeAdapter = _m12_registerFeatureRuntimeAdapter
  const setFeatureShortcutSynchronizer = _m12_setFeatureShortcutSynchronizer
function featureStore(initialDisabled = []) {
  const disabled = new Set(initialDisabled)
  return {
    isEnabled: id => !disabled.has(id),
    disable: id => { disabled.add(id); return true },
    enable: id => { disabled.delete(id); return true },
    moduleForRoute: path => path === '/items' ? { id: 'items' } : null
  }
}

test('协调器先停止运行时再提交停用并返回首页', async t => {
  const calls = []
  const remove = registerFeatureRuntimeAdapter('items', {
    isBusy: () => true,
    suspend: async () => { calls.push('suspend'); return { success: true } },
    resume: async () => { calls.push('resume'); return { success: true } }
  })
  t.after(() => { remove(); setFeatureShortcutSynchronizer(null) })
  setFeatureShortcutSynchronizer(async () => calls.push('shortcuts'))
  const store = featureStore()
  const router = { currentRoute: { value: { path: '/items' } }, push: async path => calls.push(`route:${path}`) }
  assert.equal(await isFeatureRuntimeBusy('items'), true)
  assert.deepEqual(await disableFeatureModule('items', { store, router }), { success: true })
  assert.equal(store.isEnabled('items'), false)
  assert.deepEqual(calls, ['suspend', 'shortcuts', 'route:/'])
})

test('停止失败不提交停用状态', async t => {
  let resumeCalls = 0
  const remove = registerFeatureRuntimeAdapter('map', {
    suspend: () => ({ success: false, error: '仍在运行' }),
    resume: () => { resumeCalls += 1; return { success: true } }
  })
  t.after(remove)
  const store = featureStore()
  const result = await disableFeatureModule('map', { store, router: { currentRoute: { value: { path: '/' } }, push: async () => {} } })
  assert.equal(result.success, false)
  assert.match(result.error, /仍在运行/)
  assert.equal(store.isEnabled('map'), true)
  assert.equal(resumeCalls, 1)
})

test('恢复异常保留入口并返回警告', async t => {
  const remove = registerFeatureRuntimeAdapter('story', { resume: () => { throw new Error('环境不可用') } })
  t.after(() => { remove(); setFeatureShortcutSynchronizer(null) })
  const store = featureStore(['story'])
  const result = await enableFeatureModule('story', { store })
  assert.equal(store.isEnabled('story'), true)
  assert.equal(result.success, true)
  assert.match(result.warnings[0], /环境不可用/)
})

test('停用提交后的快捷键同步失败会回滚状态并恢复运行时', async t => {
  const calls = []
  const remove = registerFeatureRuntimeAdapter('combat', {
    suspend: async () => { calls.push('suspend'); return { success: true } },
    resume: async () => { calls.push('resume'); return { success: true } }
  })
  t.after(() => { remove(); setFeatureShortcutSynchronizer(null) })
  setFeatureShortcutSynchronizer(async () => {
    calls.push('shortcuts')
    if (calls.filter(item => item === 'shortcuts').length === 1) throw new Error('注册失败')
  })
  const store = featureStore()
  const result = await disableFeatureModule('combat', {
    store,
    router: { currentRoute: { value: { path: '/' } }, push: async () => {} }
  })
  assert.equal(result.success, false)
  assert.match(result.error, /注册失败/)
  assert.equal(store.isEnabled('combat'), true)
  assert.deepEqual(calls, ['suspend', 'shortcuts', 'resume', 'shortcuts'])
})
})()

// === Merged from installedUpdateRepository.test.js ===
await (async () => {
  const test = _m13_test
  const assert = _m13_assert
  const mkdtemp = _m13_mkdtemp
  const readFile = _m13_readFile
  const rm = _m13_rm
  const os = _m13_os
  const path = _m13_path
  const InstalledUpdateRepository = _m13_InstalledUpdateRepository
async function createRepository() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-installed-update-'))
  return { root, repository: new InstalledUpdateRepository({ userDataPath: root, now: () => 123 }) }
}

test('待展示升级记录原子写入并仅匹配目标版本', async t => {
  const { root, repository } = await createRepository()
  t.after(() => rm(root, { recursive: true, force: true }))
  await repository.save({ targetVersion: '1.2.3', releaseNotes: '  修复 A\n\n改进 B  ' })
  assert.deepEqual(await repository.loadForVersion('1.2.3'), {
    targetVersion: '1.2.3', releaseNotes: '修复 A\n\n改进 B'
  })
  assert.equal(await repository.loadForVersion('1.2.2'), null)
  const content = await readFile(repository.filePath, 'utf8')
  assert.match(content, /"targetVersion": "1\.2\.3"/)
})
test('记录校验拒绝非稳定版本和空内容', async t => {
  const { root, repository } = await createRepository()
  t.after(() => rm(root, { recursive: true, force: true }))
  await assert.rejects(repository.save({ targetVersion: '1.2.3-beta.1', releaseNotes: '内容' }), /版本无效/)
  await assert.rejects(repository.save({ targetVersion: '1.2.3', releaseNotes: '   ' }), /内容无效/)
})

test('原子替换失败时清理临时文件并保留原错误', async () => {
  const calls = []
  const fileSystem = {
    mkdir: async () => {},
    writeFile: async file => { calls.push(['write', file]) },
    rename: async () => { throw new Error('rename failed') },
    unlink: async file => { calls.push(['unlink', file]) },
    readFile: async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }) }
  }
  const repository = new InstalledUpdateRepository({ userDataPath: 'C:\\profile', fileSystem, now: () => 9 })
  await assert.rejects(repository.save({ targetVersion: '1.2.3', releaseNotes: '内容' }), /rename failed/)
  assert.equal(calls[0][0], 'write')
  assert.deepEqual(calls[1], ['unlink', calls[0][1]])
})

test('已读确认只删除与当前版本匹配的记录', async t => {
  const { root, repository } = await createRepository()
  t.after(() => rm(root, { recursive: true, force: true }))
  await repository.save({ targetVersion: '1.2.3', releaseNotes: '内容' })
  assert.equal(await repository.acknowledge('1.2.2'), false)
  assert.ok(await repository.read())
  assert.equal(await repository.acknowledge('1.2.3'), true)
  assert.equal(await repository.read(), null)
})
})()
