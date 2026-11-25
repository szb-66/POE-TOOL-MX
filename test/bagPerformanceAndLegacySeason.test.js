import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs, { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FEATURE_CATALOG, featureById } from '../src/features/featureCatalog.js'
import { serverChannelFailure } from '../electron/modules/app/serverIpcPolicy.js'
import { serverContext } from '../shared/serverMode.js'
import { HighlightPickupWorker } from '../electron/modules/junfeng/highlightWorker.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bagScriptPath = path.join(projectRoot, 'src/assets/scripts/bag_auto_stash_template.py')
const pickupScriptPath = path.join(projectRoot, 'src/assets/scripts/junfeng_highlight_pickup.py')
const bundledPython = path.join(projectRoot, '.runtime', 'python-runtime', 'python.exe')
const runtimePython = existsSync(bundledPython) ? bundledPython : 'python'

const source = rel => readFileSync(path.join(projectRoot, rel), 'utf8')

test('过期赛季统一收纳 S30 海图与 S30 永火接收舱并从存取与设置页剥离', () => {
  const puzzleFeature = featureById('puzzle')
  assert.equal(puzzleFeature.label, '过期赛季')
  assert.equal(puzzleFeature.route, '/puzzle')
  assert.equal(FEATURE_CATALOG.filter(item => item.id === 'puzzle').length, 1)

  const bagView = source('src/domains/bag/BagView.vue')
  const settingsView = source('src/domains/settings/InterfaceDetectionSettings.vue')
  const puzzleView = source('src/domains/puzzle/PuzzleView.vue')
  const allflameTab = source('src/domains/puzzle/AllflameReceiverTab.vue')
  const allflameService = source('src/domains/puzzle/allflameReceiverService.js')

  assert.doesNotMatch(bagView, /永火接收舱|allflameReceiverEnabled|allflameReceiverTitle/)
  assert.doesNotMatch(settingsView, /永火接收舱|allflameReceiverTitle|allflameReceiverRegion/)
  assert.match(puzzleView, /过期赛季/)
  assert.match(puzzleView, /S30 海图/)
  assert.match(puzzleView, /S30 永火接收舱/)
  assert.match(puzzleView, /AllflameReceiverTab/)
  assert.match(allflameTab, /TemplateCaptureConfigurationField[\s\S]*allflameReceiverTitle/)
  assert.match(allflameService, /isAllflameReceiverAvailable/)
  assert.match(allflameService, /suspendAllflameReceiverRuntime/)
})

test('国际服 IPC 门禁拒绝启用过期赛季永火接收舱但允许普通仓库入库', () => {
  const intl = serverContext('international')
  const cn = serverContext('cn')

  const blockedStart = serverChannelFailure(intl, 'start-bag-detection', false, [{ moduleEnabled: false, allflameReceiverEnabled: true }])
  assert.equal(blockedStart?.code, 'SERVER_FEATURE_UNAVAILABLE')

  const blockedUpdate = serverChannelFailure(intl, 'update-bag-runtime-config', false, [{ moduleEnabled: true, allflameReceiverEnabled: true }])
  assert.equal(blockedUpdate?.code, 'SERVER_FEATURE_UNAVAILABLE')

  assert.equal(serverChannelFailure(intl, 'start-bag-detection', false, [{ moduleEnabled: true, allflameReceiverEnabled: false }]), null)
  assert.equal(serverChannelFailure(cn, 'start-bag-detection', false, [{ moduleEnabled: false, allflameReceiverEnabled: true }]), null)
})

test('永火接收舱老配置一次性迁移将开关默认关闭并保留模板与后续手动开启', () => {
  const bagStoreSource = source('src/stores/bag.js')
  assert.match(bagStoreSource, /ALLFLAME_LEGACY_MIGRATION_KEY = 'allflameReceiverLegacyMigrated:v1'/)
  assert.match(bagStoreSource, /if \(!localStorage\.getItem\(ALLFLAME_LEGACY_MIGRATION_KEY\)\)/)
  assert.match(bagStoreSource, /allflameReceiverEnabled\.value = false/)
  assert.match(bagStoreSource, /localStorage\.setItem\(ALLFLAME_LEGACY_MIGRATION_KEY, '1'\)/)
})

test('启动速度优化：界面检测 store 不在启动时群发 IPC，君锋镇不在启动时全量读图与训练会话', () => {
  const detectionStore = source('src/stores/interfaceDetection.js')
  const junfengStore = source('src/stores/junfeng.js')
  const bagView = source('src/domains/bag/BagView.vue')
  const trainingView = source('src/domains/bag/HighlightModelTrainingView.vue')
  const windowManager = source('electron/modules/window/manager.js')

  assert.doesNotMatch(detectionStore, /\n\s*save\(\)\s*\n\s*return \{/)
  const initBody = junfengStore.slice(junfengStore.indexOf('async function initializeRuntime('), junfengStore.indexOf('\n  return {', junfengStore.indexOf('async function initializeRuntime(')))
  assert.doesNotMatch(initBody, /loadCorrections|loadTrainingStatus|loadTrainingSessions/)
  assert.match(bagView, /ensureCorrectionsLoaded/)
  assert.match(trainingView, /onMounted\([\s\S]*loadTrainingStatus[\s\S]*loadTrainingSessions/)
  assert.match(windowManager, /if \(\(!bagStashOverlayWindow \|\| bagStashOverlayWindow\.isDestroyed\(\)\) && !snapshot\.visible\)/)
})

test('ChaosRecipeControlOverlay 在 visible=false 时懒创建窗口，首次 visible=true 才创建', () => {
  const controlOverlaySource = source('electron/modules/chaosRecipe/controlOverlay.js')
  assert.match(controlOverlaySource, /const existingWindow = this\.window && !this\.window\.isDestroyed\(\) \? this\.window : null/)
  assert.match(controlOverlaySource, /if \(!existingWindow && !state\.visible\) \{[\s\S]*?return state/)
  assert.match(controlOverlaySource, /const window = existingWindow \|\| this\.createWindow\(\)/)
})

test('bag_auto_stash_template.py 模块导入和 --mode stash 不加载 cv2/mss/numpy，且按 active_targets 裁剪截屏', { skip: !existsSync(runtimePython) && runtimePython !== 'python' }, () => {
  const code = `
import importlib.util, json, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("bag", ${JSON.stringify(bagScriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
loaded_on_import = [name for name in ("cv2", "mss", "numpy", "pynput") if name in sys.modules]

# 模拟 InterfaceMatcher 的 active_targets 裁剪与背包短路
captured_targets = []
matcher = object.__new__(module.InterfaceMatcher)
matcher.config = {
    "active_targets": ["inventory", "stash"],
    "templates": {
        "inventory_region": {"left": 0, "top": 0, "right": 10, "bottom": 10},
        "stash_region": {"left": 0, "top": 0, "right": 10, "bottom": 10},
        "junfeng_reward_region": {"left": 0, "top": 0, "right": 10, "bottom": 10},
        "allflame_receiver_region": {"left": 0, "top": 0, "right": 10, "bottom": 10},
    },
    "match_threshold": 0.8,
}
matcher._active_targets = {"inventory", "stash"}
matcher.templates = {"inventory": object(), "stash": object(), "reward": object(), "allflame_receiver": object()}
matcher._sct = None

inventory_open = [False]
def fake_match(name, region):
    if not matcher._is_target_active(name):
        return False, 0.0
    captured_targets.append(name)
    if name == "inventory":
        return inventory_open[0], 0.95 if inventory_open[0] else 0.1
    return True, 0.96

matcher._match = fake_match
closed_matches, _ = matcher.check_interface()
captured_when_closed = list(captured_targets)
captured_targets.clear()
inventory_open[0] = True
open_matches, _ = matcher.check_interface()
captured_when_open = list(captured_targets)

print(json.dumps({
    "loadedOnImport": loaded_on_import,
    "capturedWhenClosed": captured_when_closed,
    "capturedWhenOpen": captured_when_open,
    "closedStash": closed_matches["stashMatched"],
    "openStash": open_matches["stashMatched"],
    "openAllflame": open_matches["allflameReceiverMatched"],
}))
`
  const result = spawnSync(runtimePython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  const payload = JSON.parse(result.stdout.trim())
  assert.deepEqual(payload.loadedOnImport, [], '仅导入模块不应加载任何重型视觉或输入库')
  assert.deepEqual(payload.capturedWhenClosed, ['inventory'], '背包未开时应短路跳过 stash 截屏，且不检测未启用的 reward/allflame')
  assert.deepEqual(payload.capturedWhenOpen, ['inventory', 'stash'], '背包打开后仅匹配活跃目标 inventory 与 stash')
  assert.equal(payload.closedStash, false)
  assert.equal(payload.openStash, true)
  assert.equal(payload.openAllflame, false)
})

test('junfeng_highlight_pickup.py 非预览跳过 PNG 编码、复用缓存特征向量，且 --worker 支持常驻指令与优雅退出', { skip: !existsSync(bundledPython) }, () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'poe-highlight-opt-'))
  try {
    const sampleDir = path.join(tempDir, 'samples')
    fs.mkdirSync(sampleDir, { recursive: true })
    const samplePng = path.join(sampleDir, 's1.png')
    writeFileSync(samplePng, Buffer.from([137, 80, 78, 71])) // 非真实 PNG，仅用于验证命中特征向量缓存时不解码 PNG
    const indexPath = path.join(tempDir, 'index.json')
    writeFileSync(indexPath, JSON.stringify({
      schemaVersion: 1,
      samples: [{
        id: 's1', label: 'highlighted', column: 0, row: 0,
        modelVersion: 'v-test',
        relativePath: path.join('samples', 's1.png'),
        featureVector: Array.from({ length: 32 }, (_, i) => (i === 0 ? 1 : 0))
      }]
    }), 'utf8')

    const code = `
import importlib.util, json, sys
import numpy as np
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("pickup", ${JSON.stringify(pickupScriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class DummyModel:
    version = "v-test"
    infer_calls = 0
    def infer(self, images):
        self.infer_calls += 1
        n = len(images)
        probs = np.zeros((n, 3), dtype=np.float32)
        probs[:, 0] = 0.999
        emb = np.zeros((n, 32), dtype=np.float32)
        emb[:, 0] = 1.0
        return probs, emb

model = DummyModel()
cal = module.load_calibration({"calibration_index": ${JSON.stringify(indexPath)}, "calibration_root": ${JSON.stringify(tempDir)}}, model)
infer_after_cal = model.infer_calls

img = np.zeros((40, 40, 3), dtype=np.uint8)
cells_fast, _, _ = module.classify(img, {"grid": {"columns": 2, "rows": 2}}, model, cal, include_preview_assets=False)
cells_preview, _, _ = module.classify(img, {"grid": {"columns": 2, "rows": 2}}, model, cal, include_preview_assets=True)
print(json.dumps({
    "calCount": int(cal[0].shape[0]),
    "inferAfterCal": infer_after_cal,
    "fastHasTile": "tileDataUrl" in cells_fast[0],
    "fastHasEmbedding": "embedding" in cells_fast[0],
    "previewHasTile": "tileDataUrl" in cells_preview[0] and cells_preview[0]["tileDataUrl"].startswith("data:image/png;base64,"),
    "previewHasEmbedding": "embedding" in cells_preview[0] and len(cells_preview[0]["embedding"]) == 32,
}))
`
    const result = spawnSync(bundledPython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
    assert.equal(result.status, 0, result.stderr)
    const payload = JSON.parse(result.stdout.trim())
    assert.equal(payload.calCount, 1)
    assert.equal(payload.inferAfterCal, 0, '命中同版本 32 维 featureVector 缓存时不应解码 PNG 或调用 ONNX 推理')
    assert.equal(payload.fastHasTile, false, '非预览正式取件不应生成 tileDataUrl')
    assert.equal(payload.fastHasEmbedding, false, '非预览正式取件不应序列化 embedding')
    assert.equal(payload.previewHasTile, true)
    assert.equal(payload.previewHasEmbedding, true)

    // 验证 --worker 常驻协议：worker-ready -> ping -> shutdown
    const workerRun = spawnSync(
      bundledPython,
      [pickupScriptPath, '--worker'],
      {
        input: `${JSON.stringify({ cmd: 'ping', requestId: 'p1' })}\n${JSON.stringify({ cmd: 'shutdown', requestId: 's1' })}\n`,
        encoding: 'utf8',
        env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
      }
    )
    assert.equal(workerRun.status, 0, workerRun.stderr)
    const events = workerRun.stdout.trim().split(/\r?\n/).filter(l => l.startsWith('EVENT ')).map(l => JSON.parse(l.slice(6)))
    assert.equal(events[0].event, 'worker-ready')
    assert.equal(events[1].event, 'pong')
    assert.equal(events[1].requestId, 'p1')
    assert.equal(events[2].event, 'worker-shutdown')
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('HighlightPickupWorker 支持懒预热、连续复用、闲置自动回收与全消费者停用即时回收', async () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'poe-worker-mgr-'))
  const fakeScript = path.join(tempDir, 'fake_worker.cjs')
  writeFileSync(fakeScript, `
const readline = require('node:readline');
console.log('EVENT ' + JSON.stringify({ event: 'worker-ready', pid: process.pid }));
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', line => {
  const msg = JSON.parse(line);
  if (msg.cmd === 'shutdown') {
    console.log('EVENT ' + JSON.stringify({ event: 'worker-shutdown', requestId: msg.requestId }));
    process.exit(0);
  }
  if (msg.cmd === 'warmup') {
    console.log('EVENT ' + JSON.stringify({ event: 'warmup-done', requestId: msg.requestId, modelReady: true, modelVersion: 'v1' }));
    return;
  }
  if (msg.cmd === 'preview') {
    console.log('EVENT ' + JSON.stringify({ event: 'preview', requestId: msg.requestId, pid: process.pid, layout: 12, candidateCells: 2, cells: [] }));
  }
});
`, 'utf8')

  let detectionListener = null
  const fakeDetection = {
    subscribe: fn => { detectionListener = fn; return () => {} }
  }
  const worker = new HighlightPickupWorker({
    python: { resolvePythonRuntimeAsync: async () => ({ path: process.execPath }) },
    scriptPath: fakeScript,
    fileWatcher: { getFilePaths: () => ({ tempDir }) },
    interfaceDetection: fakeDetection,
    idleTimeoutMs: 1200,
    resolveWarmupConfig: () => ({ model_path: 'm.onnx', manifest_path: 'm.json' })
  })

  try {
    // 消费者未启用时，即便界面就绪也不会拉起 Worker
    detectionListener({ foreground: true, stashReady: true })
    await new Promise(r => setTimeout(r, 80))
    assert.equal(worker.isRunning(), false)

    // 启用仓库取件且界面就绪 -> 触发懒预热
    worker.setConsumerEnabled('stash-pickup', true)
    detectionListener({ foreground: true, stashReady: true })
    await new Promise(r => setTimeout(r, 250))
    assert.equal(worker.isRunning(), true)

    // 连续两次 preview 复用同一个 Worker 进程 PID
    const cfgPath = path.join(tempDir, 'req.json')
    writeFileSync(cfgPath, '{}', 'utf8')
    const first = await worker.preview(cfgPath)
    const second = await worker.preview(cfgPath)
    assert.equal(first.pid, second.pid, '连续操作应复用同一个常驻 Worker 进程')

    // 停用全部消费者 -> 立即回收
    worker.setConsumerEnabled('stash-pickup', false)
    await new Promise(r => setTimeout(r, 150))
    assert.equal(worker.isRunning(), false, '全部消费者关闭后应立即回收 Worker')

    // 再次启用并请求后，超过闲置时间自动回收
    worker.setConsumerEnabled('junfeng', true)
    await worker.preview(cfgPath)
    assert.equal(worker.isRunning(), true)
    await new Promise(r => setTimeout(r, 1500))
    assert.equal(worker.isRunning(), false, '超过闲置时间后应自动退出回收内存')
  } finally {
    worker.cleanup()
    rmSync(tempDir, { recursive: true, force: true })
  }
})
