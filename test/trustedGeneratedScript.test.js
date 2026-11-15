import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import vm from 'node:vm'
import { EventEmitter } from 'node:events'
import { prepareTrustedScriptRequest } from '../electron/modules/python/trustedScript.js'
import { getServer } from '../shared/serverMode.js'
import { createBatchRecoveryStore } from '../electron/modules/crafting/batchRecovery.js'
import { CraftingCurrencyUsageLedger } from '../electron/modules/python/currencyUsageLedger.js'
import { resolveCraftingPython } from '../electron/modules/python/launcher.js'

const ipcUrl = new URL('../electron/modules/ipc/python.js', import.meta.url)
const filePathsFor = directory => ({ tempDir: directory, itemInfoFile: path.join(directory, 'item_info.txt'), itemInfoResultFile: path.join(directory, 'item_info_result.json') })
const mainWindow = () => ({ isDestroyed: () => false, webContents: { isDestroyed: () => false, send() {} } })
const request = (mode = 'items') => ({
  mode, craftingKind: mode === 'items' ? 'general' : undefined,
  preset: mode === 'items' ? { checkInitialItem: true, moduleTwo: { enabled: true, mode: 'alteration' } } : { map: { targetKind: 'atlas', method: 'alchemy' } },
  generationConfig: {
    globalShortcuts: { end: 'F12' }, currencyPositions: {}, itemPosition: { x: 10, y: 20 },
    inventory: { startPos: { x: 1, y: 2 }, slotSize: { w: 10, h: 10 } },
    stashTabSelection: { enabled: false }, serverId: 'cn', language: 'zh-CN'
  }
})

test('主进程重新生成内置脚本，覆盖伪造正文、路径、服务器、通信文件和预设', () => {
  const window = mainWindow()
  const files = filePathsFor(path.resolve(os.tmpdir(), 'trusted-generation-test-only'))
  for (const mode of ['items', 'map']) {
    const config = request(mode)
    Object.assign(config, { scriptContent: 'UNTRUSTED_SCRIPT_MUST_NOT_EXECUTE', scriptPath: path.join(os.tmpdir(), 'untrusted.py'), requiresStashTabOcr: true })
    Object.assign(config.generationConfig, { filePaths: { itemInfoFile: 'UNTRUSTED_COMMUNICATION_PATH' }, preset: { moduleTwo: { enabled: false } }, mapConfig: { method: 'UNTRUSTED_MAP_MODE' } })
    const trusted = prepareTrustedScriptRequest({ event: { sender: window.webContents }, config, mainWindow: window, filePaths: files, server: getServer('international') })
    assert.equal(trusted.scriptPath, path.join(files.tempDir, mode === 'items' ? 'crafting.py' : 'map_rolling.py'))
    assert.equal(trusted.generationConfig.serverId, 'international')
    assert.equal(trusted.generationConfig.language, 'en')
    assert.deepEqual(trusted.generationConfig.filePaths, files)
    assert.deepEqual(trusted.preset, { ...config.preset, localizationRevision: '' })
    assert.deepEqual(trusted.generationConfig.preset, { ...config.preset, localizationRevision: '' })
    assert.equal(trusted.requireStashTabOcr, false)
    assert.doesNotMatch(trusted.scriptContent, /UNTRUSTED_/)
    assert.match(trusted.scriptContent, /Scroll of Wisdom/)
    if (mode === 'map') assert.deepEqual(trusted.generationConfig.mapConfig, config.preset.map)
  }
})

test('中文生成继续使用国服通货规则，OCR依赖取自实际生成配置', () => {
  const window = mainWindow()
  const config = request()
  config.generationConfig.stashTabSelection.enabled = true
  config.requiresStashTabOcr = false
  const trusted = prepareTrustedScriptRequest({ event: { sender: window.webContents }, config, mainWindow: window, filePaths: filePathsFor(path.resolve(os.tmpdir(), 'trusted-cn-test-only')), server: getServer('cn') })
  assert.equal(trusted.generationConfig.language, 'zh-CN')
  assert.equal(trusted.requireStashTabOcr, true)
  assert.match(trusted.scriptContent, /改造石/)
})

test('国际服可信生成只接收主进程汉化版本，保留海图预设但拒绝启动', () => {
  const window = mainWindow()
  const config = request('map')
  const files = filePathsFor(path.resolve(os.tmpdir(), 'trusted-localization-test-only'))
  config.preset.localizationRevision = 'renderer-version'
  config.generationConfig.localizationSnapshot = { revision: 'renderer-version', entries: [] }
  const snapshot = { revision: 'managed-version', entries: [] }
  const create = server => prepareTrustedScriptRequest({ event: { sender: window.webContents }, config, mainWindow: window, filePaths: files, server: getServer(server), localizationSnapshot: snapshot })
  const trusted = create('international')
  assert.equal(trusted.preset.localizationRevision, 'managed-version')
  assert.equal(trusted.generationConfig.localizationSnapshot, snapshot)
  assert.equal(config.preset.localizationRevision, 'renderer-version')
  assert.equal(create('cn').generationConfig.localizationSnapshot, null)
  for (const field of ['targetKind', 'activeKind']) {
    config.preset.map = { method: 'alchemy', [field]: 'chart' }
    const before = structuredClone(config)
    assert.throws(() => create('international'), /海图/)
    assert.deepEqual(config, before)
    assert.doesNotThrow(() => create('cn'))
  }
})

function handlerHarness(t, { active = false, pythonAvailable = true } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'trusted-script-ipc-'))
  t.after(() => {
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()))
    fs.rmSync(directory, { recursive: true, force: true })
  })
  const files = filePathsFor(directory)
  const window = mainWindow()
  const handlers = new Map()
  const effects = { kills: 0, clears: 0, watcherStops: 0, activations: 0, launches: [], watcherPresets: [] }
  let current = active ? { pid: 876, exitCode: null, signalCode: null, kill() { throw new Error('Existing task must not be killed') } } : null
  const sandbox = {
    fs, path, process, console, setTimeout: callback => queueMicrotask(callback),
    ipcMain: { handle: (name, callback) => handlers.set(name, callback) },
    prepareTrustedScriptRequest, CraftingCurrencyUsageLedger, resolveCraftingPython,
    batchRecoveryStore: createBatchRecoveryStore(),
    prepareCraftingOverlay: async () => {},
    waitForScriptStartup: async () => ({ event: 'crafting-startup-succeeded' }),
    parseScriptEventLine: () => null,
    createPythonProcess: options => {
      effects.launches.push({ ...options, script: fs.readFileSync(options.scriptPath, 'utf8') })
      const child = new EventEmitter()
      child.pid = 456
      child.stdout = new EventEmitter()
      child.stderr = new EventEmitter()
      return { process: child, started: Promise.resolve(child) }
    }
  }
  const source = fs.readFileSync(ipcUrl, 'utf8')
    .replace(/^import\s+[\s\S]*?\sfrom\s+['"][^'"]+['"]\r?\n/gm, '')
    .replace(/\bexport\s+(?=(?:async\s+)?function)/g, '')
  vm.runInNewContext(`${source}\nglobalThis.register = registerPythonHandlers`, sandbox)
  sandbox.register({
    detectPythonPath: () => 'compatible-python', detectPythonPathWithModules: () => pythonAvailable ? 'compatible-python' : null,
    killPythonProcessTree: async () => { effects.kills += 1; return true },
    getCurrentScriptProcess: () => current, getCurrentScriptMode: () => 'items',
    setCurrentScriptProcess: child => { current = child }, clearCurrentScriptProcess: () => { effects.clears += 1; current = null }
  }, { getMainWindow: () => window, getOverlayWindow: () => null, activateGameWindow: async () => { effects.activations += 1; return { success: true } } }, {
    getFilePaths: () => files,
    startFileWatcher: preset => effects.watcherPresets.push(preset),
    stopFileWatcher: () => { effects.watcherStops += 1 }
  }, { server: getServer('international') })
  return { directory, files, window, effects, handlers }
}

test('实际IPC拒绝外部发送者、raw-only、非法类型及生成失败，不干扰正在运行的任务', async t => {
  const harness = handlerHarness(t, { active: true })
  const valid = request()
  const invalid = [
    [{ sender: {} }, valid],
    [{ sender: harness.window.webContents }, { ...valid, mode: 'other' }],
    [{ sender: harness.window.webContents }, { mode: 'items', preset: {}, scriptContent: 'raw-only' }],
    [{ sender: harness.window.webContents }, { ...valid, generationConfig: { globalShortcuts: { end: 'F12";INJECTION' } } }],
    [{ sender: harness.window.webContents }, { ...valid, batchRecoveryContext: { invalid: true } }]
  ]
  for (const [event, config] of invalid) {
    const result = await harness.handlers.get('generate-and-execute-script')(event, config)
    assert.equal(result.success, false)
  }
  assert.equal(harness.effects.kills, 0)
  assert.equal(harness.effects.clears, 0)
  assert.equal(harness.effects.watcherStops, 0)
  assert.equal(harness.effects.activations, 0)
  assert.deepEqual(harness.effects.launches, [])
  assert.deepEqual(fs.readdirSync(harness.directory), [])
})

test('批量目标与检查点双向缺失均拒绝，null和undefined同为缺失且不停止旧任务', async t => {
  const harness = handlerHarness(t, { active: true })
  const batch = {
    enabled: true, batchId: 'batch-1', scanId: 'scan-1', snapshotFingerprint: 'snapshot-1', completedIds: [],
    targets: [{ id: 'item-1', categoryId: 'ring', baseType: 'Coral Ring', displayName: 'Coral Ring', x: 0, y: 0, width: 1, height: 1, position: { x: 10, y: 20 } }]
  }
  for (const missing of [undefined, null]) for (const missingSide of ['checkpoint', 'generation']) {
    const config = request()
    config.usageSessionId = 'usage-1'
    config.generationConfig.batchConfig = missingSide === 'generation' ? missing : batch
    config.batchRecoveryContext = missingSide === 'checkpoint' ? missing : batch
    const result = await harness.handlers.get('generate-and-execute-script')({ sender: harness.window.webContents }, config)
    assert.equal(result.success, false, missingSide)
    assert.match(result.error, /同时提供/)
  }
  const config = request()
  config.usageSessionId = 'usage-1'
  config.generationConfig.batchConfig = batch
  config.batchRecoveryContext = batch
  assert.doesNotThrow(() => prepareTrustedScriptRequest({ event: { sender: harness.window.webContents }, config, mainWindow: harness.window, filePaths: harness.files }))
  for (const kind of ['general', 'essence', 'harvest']) {
    const config = request()
    config.craftingKind = kind
    config.generationConfig.batchConfig = null
    config.batchRecoveryContext = undefined
    assert.doesNotThrow(() => prepareTrustedScriptRequest({ event: { sender: harness.window.webContents }, config, mainWindow: harness.window, filePaths: harness.files }))
  }
  assert.equal(harness.effects.kills, 0)
  assert.equal(harness.effects.clears, 0)
  assert.equal(harness.effects.watcherStops, 0)
  assert.deepEqual(harness.effects.launches, [])
  assert.deepEqual(fs.readdirSync(harness.directory), [])
})

test('实际IPC写入和启动的均为主进程内置生成脚本，文件监听与生成使用相同预设', async t => {
  const harness = handlerHarness(t)
  const config = request('map')
  config.scriptContent = 'UNTRUSTED_SCRIPT_MUST_NOT_EXECUTE'
  config.scriptPath = path.join(harness.directory, 'untrusted.py')
  config.generationConfig.mapConfig = { targetKind: 'heist', method: 'UNTRUSTED_MAP_MODE' }
  const result = await harness.handlers.get('generate-and-execute-script')({ sender: harness.window.webContents }, config)
  assert.equal(result.success, true, result.error)
  assert.equal(harness.effects.launches.length, 1)
  const launch = harness.effects.launches[0]
  assert.equal(launch.scriptPath, path.join(harness.directory, 'map_rolling.py'))
  assert.doesNotMatch(launch.script, /UNTRUSTED_/)
  assert.match(launch.script, /Scroll of Wisdom/)
  assert.deepEqual(harness.effects.watcherPresets, [{ ...config.preset, localizationRevision: '' }])
  assert.equal(fs.existsSync(config.scriptPath), false)
})

test('缺少新任务所需的Python依赖时保留已有制作进程和文件监听', async t => {
  const harness = handlerHarness(t, { active: true, pythonAvailable: false })
  const result = await harness.handlers.get('generate-and-execute-script')({ sender: harness.window.webContents }, request())
  assert.equal(result.success, false)
  assert.match(result.error, /Python/)
  assert.equal(harness.effects.kills, 0)
  assert.equal(harness.effects.clears, 0)
  assert.equal(harness.effects.watcherStops, 0)
  assert.deepEqual(harness.effects.launches, [])
})

test('生成脚本及直接依赖被列入应用资源', () => {
  const files = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).build.files
  for (const file of ['src/utils/pythonScriptGenerator.js', 'src/utils/currencyPreflight.js', 'src/domains/items/affixConfig.js', 'src/domains/items/eldritchConfig.js', 'src/assets/scripts/crafting_template.py', 'src/assets/scripts/map_rolling_template.py']) assert.ok(files.includes(file), file)
})
