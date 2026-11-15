import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { EventEmitter } from 'node:events'
import * as combatConfig from '../shared/combatAssist.js'
import { normalizeAutomationTiming, pythonAutomationTiming } from '../src/utils/operationDelay.js'
import { serverContext } from '../shared/serverMode.js'
import { installServerIpcPolicy } from '../electron/modules/app/serverIpcPolicy.js'

const moduleUrl = new URL('../electron/modules/ipc/combat.js', import.meta.url)
const templateUrl = new URL('../src/assets/scripts/combat_assist_template.py', import.meta.url)

function createHarness(t, controller) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'combat-trusted-script-'))
  t.after(() => {
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()))
    fs.rmSync(directory, { recursive: true, force: true })
  })
  const handlers = new Map()
  const launches = []
  const activations = []
  const trustedTemplate = fs.readFileSync(templateUrl, 'utf8')
  const sandbox = {
    fs, path, URL, structuredClone, process, console,
    ...combatConfig, normalizeAutomationTiming, pythonAutomationTiming,
    ipcMain: { handle: (name, callback) => handlers.set(name, callback) },
    spawn: (python, args) => {
      // This is the execution boundary: inspect what the actual IPC handler
      // would launch, without spawning Python or sending any game input.
      assert.equal(python, 'fake-python')
      assert.equal(fs.readFileSync(args[0], 'utf8'), trustedTemplate)
      const config = JSON.parse(fs.readFileSync(args[4], 'utf8'))
      launches.push({ args, config })
      const child = new EventEmitter()
      child.stdout = new EventEmitter()
      child.stderr = new EventEmitter()
      child.pid = launches.length
      child.exitCode = null
      queueMicrotask(() => {
        child.stdout.emit('data', Buffer.from('{"success":true,"color":255}\n'))
        child.exitCode = 0
        child.emit('close', 0)
      })
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
  sandbox.register({ detectPythonPath: () => 'fake-python' }, {
    activateGameWindow: async reason => { activations.push(reason); return { success: true } },
    getMainWindow: () => null
  }, { getFilePaths: () => ({ tempDir: directory }) })
  return { handlers, launches, activations, directory, trustedTemplate }
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
    if (server === 'international') {
      for (const channel of ['combat-start-potion', 'combat-start-loop', 'combat-execute-portal']) {
        const start = await harness.handlers.get(channel)({}, { config })
        assert.equal(start.success, false)
        assert.equal(start.error.code, 'SERVER_FEATURE_UNAVAILABLE')
      }
      assert.equal(harness.launches.length, 0)
    }
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
  assert.deepEqual(harness.launches[0].config, { point: { x: -20, y: 30 } })
  assert.equal(fs.existsSync(untrustedPath), false)
  assert.equal(fs.readFileSync(path.join(harness.directory, 'combat_assist.py'), 'utf8'), harness.trustedTemplate)
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
