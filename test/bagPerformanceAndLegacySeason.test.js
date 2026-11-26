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

test('启动速度优化：界面检测 store 不在启动时群发 IPC，君锋镇精简启动无训练或校准加载', () => {
  const detectionStore = source('src/stores/interfaceDetection.js')
  const junfengStore = source('src/stores/junfeng.js')
  const windowManager = source('electron/modules/window/manager.js')

  assert.doesNotMatch(detectionStore, /\n\s*save\(\)\s*\n\s*return \{/)
  assert.doesNotMatch(junfengStore, /loadCorrections|loadTrainingStatus|loadTrainingSessions/)
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

test('junfeng_highlight_pickup.py 零 cv2/ONNX 依赖、不生成逐格 tileDataUrl/embedding，且主进程零常驻 Worker', { skip: !existsSync(bundledPython) }, () => {
  const code = `
import importlib.util, json, sys
import numpy as np
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("pickup", ${JSON.stringify(pickupScriptPath)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class DummyClassifier:
    version = "slot-highlight-v1"
    def predict_proba(self, images):
        probs = np.zeros((len(images), 3), dtype=np.float32)
        probs[:, 0] = 0.999
        return probs

img = np.zeros((40, 40, 3), dtype=np.uint8)
cells, _, _ = module.classify(img, {"grid": {"columns": 2, "rows": 2}}, DummyClassifier())
print(json.dumps({
    "hasCv2": "cv2" in sys.modules,
    "hasOrt": "onnxruntime" in sys.modules,
    "hasTileDataUrl": "tileDataUrl" in cells[0],
    "hasEmbedding": "embedding" in cells[0],
    "hasBorderBoosted": "borderBoosted" in cells[0],
}))
`
  const result = spawnSync(bundledPython, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  const payload = JSON.parse(result.stdout.trim())
  assert.equal(payload.hasCv2, false)
  assert.equal(payload.hasOrt, false)
  assert.equal(payload.hasTileDataUrl, false)
  assert.equal(payload.hasEmbedding, false)
  assert.equal(payload.hasBorderBoosted, true)

  const stashManager = source('electron/modules/stashPickup/manager.js')
  const junfengManager = source('electron/modules/junfeng/manager.js')
  assert.doesNotMatch(stashManager, /highlightWorker|onnxruntime|cv2/)
  assert.doesNotMatch(junfengManager, /highlightWorker|ModelAvailability|onnxruntime|cv2/)
})
