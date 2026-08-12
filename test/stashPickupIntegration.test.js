import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('仓库取件接入独立 IPC、preload、运行管理和自动化锁', () => {
  const main = source('electron/main.js')
  const ipc = source('electron/modules/ipc/stashPickup.js')
  const preload = source('electron/preload.cjs')
  const manager = source('electron/modules/stashPickup/manager.js')
  assert.match(main, /new StashPickupManager/)
  assert.match(ipc, /stash-pickup-runtime-update/)
  assert.match(ipc, /registerConsumer\('stash-pickup'/)
  assert.match(preload, /onStashPickupEvent/)
  assert.match(manager, /acquire\(OWNER\)/)
  assert.match(manager, /release\(OWNER\)/)
  assert.match(manager, /junfeng_highlight_pickup\.py/)
  assert.match(manager, /candidateItems/)
  assert.match(manager, /remainingItems/)
})

test('游戏控制按钮按商城配方与仓库取件独立启用状态显示', () => {
  const manager = source('electron/modules/chaosRecipe/controlOverlay.js')
  const view = source('src/domains/shop/ChaosRecipeControlOverlayView.vue')
  assert.match(manager, /recipeEnabled: this\.enabled/)
  assert.match(manager, /stashPickupEnabled/)
  assert.match(view, /v-if="state\.recipeEnabled"/)
  assert.match(view, /v-if="state\.stashPickupEnabled"/)
  assert.match(view, /electronApi\.stashPickup\.start/)
})

test('背包页说明仓库默认按搜索高亮取件且不再展示统计阈值控件', () => {
  const view = source('src/domains/bag/BagView.vue')
  assert.match(view, /普通仓库 12×12/)
  assert.match(view, /大型仓库 24×24/)
  assert.match(view, /搜索框为空时全部物品都会高亮并取出/)
  assert.doesNotMatch(view, /方差 variance/)
  assert.doesNotMatch(view, /亮度 brightness/)
  assert.doesNotMatch(view, /饱和度 saturation/)
  assert.match(view, /检测预览/)
  assert.match(view, /转移未确认/)
})

test('检测预览允许从主窗口触发并交由脚本自动激活游戏', () => {
  const manager = source('electron/modules/stashPickup/manager.js')
  const script = source('src/assets/scripts/stash_pickup_template.py')
  assert.match(manager, /preview\(\)\s*{\s*this\.ensureReady\(\{ requireForeground: false \}\)/)
  assert.match(script, /def focus_game_window\(/)
  assert.match(script, /if not focus_game_window\(\):[\s\S]*game-not-foreground/)
})

test('仓库与君锋镇共享本机校准池和统一网格预览交互', () => {
  const main = source('electron/main.js')
  const manager = source('electron/modules/stashPickup/manager.js')
  const ipc = source('electron/modules/ipc/junfeng.js')
  const preload = source('electron/preload.cjs')
  const api = source('src/api/electron.js')
  const view = source('src/domains/bag/BagView.vue')
  assert.match(main, /const highlightCalibration = new JunfengCalibrationRepository/)
  assert.match(main, /new StashPickupManager\([\s\S]*calibration: highlightCalibration/)
  assert.match(main, /new JunfengHighlightManager\([\s\S]*calibration: highlightCalibration/)
  assert.match(manager, /calibration_index: this\.calibration\?\.indexPath \|\| ''/)
  assert.match(ipc, /highlight-calibration-save/)
  assert.match(preload, /saveHighlightCalibration/)
  assert.match(api, /highlightCalibration:/)
  assert.equal((view.match(/<HighlightGridPreview/g) || []).length, 2)
  assert.match(view, /saveStashPreviewCorrections/)
  assert.match(view, /保存修改的校准素材/)
})

test('仓库按钮依赖公共标题检测，执行阶段不再匹配标题且失去前台仍立即停止', () => {
  const manager = source('electron/modules/stashPickup/manager.js')
  const overlay = source('electron/modules/chaosRecipe/controlOverlay.js')
  const subscription = manager.slice(
    manager.indexOf('this.disposeDetection = interfaceDetection?.subscribe'),
    manager.indexOf('  scriptPath()')
  )
  const script = source('src/assets/scripts/junfeng_highlight_pickup.py')

  assert.match(subscription, /!state\.foreground/)
  assert.doesNotMatch(subscription, /!state\.ready/)
  assert.doesNotMatch(manager, /transfer_confirmation/)
  assert.match(overlay, /canStashPickup[\s\S]*this\.detection\.ready/)
  const action = script.slice(script.indexOf('def run(config, preview=False):'))
  assert.doesNotMatch(action, /InterfaceMatcher|require_action_ready|check_interface/)
  assert.match(overlay, /stashPickupRunning \|\| \(this\.detection\.ready && !stashPickupOccupied\)/)
  assert.match(overlay, /this\.detection\.ready \|\| stashPickupRunning \|\| running \|\| paused/)
})

test('游戏浮窗显示仓库取件的真实停止原因', () => {
  const manager = source('electron/modules/chaosRecipe/controlOverlay.js')

  assert.match(manager, /game-not-foreground[\s\S]*游戏不在前台/)
  assert.match(manager, /interface-lost[\s\S]*仓库或背包界面/)
  assert.match(manager, /transfer-unconfirmed[\s\S]*无法确认物品已转移，已安全停止/)
  assert.match(manager, /inventory-full[\s\S]*背包空间不足/)
  assert.match(manager, /stashPickupStopMessage/)
})

test('普通仓库与君锋镇共用三轮点击后复制确认且入库保持单次转移', () => {
  const pickup = source('src/assets/scripts/junfeng_highlight_pickup.py')
  const bag = source('src/assets/scripts/bag_auto_stash_template.py')
  const action = pickup.slice(pickup.indexOf('def run(config, preview=False):'))

  assert.match(pickup, /transfer_pickup_item/)
  assert.match(action, /transferred, reason = transfer_pickup_item\(clipboard_controller\)/)
  assert.doesNotMatch(action, /transfer_item_once/)
  assert.match(bag, /def transfer_pickup_item\(controller\):[\s\S]*begin_ctrl\(\)[\s\S]*for _attempt in range\(3\):[\s\S]*copy_item_text\(ctrl_held=True\)[\s\S]*inventory-full/)
  assert.match(bag, /def run_stash\(config\):[\s\S]*transfer_item_once\(controller\)/)
})
