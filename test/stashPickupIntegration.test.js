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
