import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse } from '@vue/compiler-sfc'

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('侧边栏使用固定顶部、滚动功能区和固定底部', () => {
  const sidebar = source('src/components/Layout/Sidebar.vue')
  assert.match(sidebar, /sidebar-menu--top/)
  assert.match(sidebar, /sidebar-menu--features/)
  assert.match(sidebar, /v-for="feature in featureStore\.enabledNavigationFeatures"/)
  assert.match(sidebar, /sidebar-menu--footer/)
  assert.match(sidebar, />更多</)
  assert.match(sidebar, />设置</)
  assert.match(sidebar, /overflow-y: auto/)
})

test('更多功能面板提供分组、卡片导航和独立加减操作', () => {
  const dialog = source('src/components/Layout/MoreFeaturesDialog.vue')
  assert.match(dialog, />已添加功能</)
  assert.match(dialog, />未添加功能</)
  assert.match(dialog, /@click\.stop="removeFeature\(feature\)"/)
  assert.match(dialog, /@click\.stop="addFeature\(feature\)"/)
  assert.match(dialog, /@keydown\.enter\.prevent/)
  assert.match(dialog, /@media \(hover: none\)/)
  assert.match(dialog, /isFeatureRuntimeBusy\(feature\.id\)/)
  assert.match(dialog, /ElMessageBox\.confirm/)
  assert.equal(parse(dialog, { filename: 'MoreFeaturesDialog.vue' }).errors.length, 0)
})

test('路由和首页都阻止绕过停用模块', () => {
  const router = source('src/router/index.js')
  const dashboard = source('src/domains/dashboard/useDashboard.js')
  assert.match(router, /featureStore\.moduleForRoute\(to\.path\)/)
  assert.match(router, /!featureStore\.isEnabled\(feature\.id\)/)
  assert.match(dashboard, /featureDisabled: true/)
  assert.match(dashboard, /尚未添加，请从侧边栏“更多”中添加后使用/)
})

test('运行时适配器覆盖需要暂停的模块和海图完整停止协议', () => {
  const runtime = source('src/features/installFeatureRuntime.js')
  const ipc = source('electron/modules/ipc/puzzle.js')
  const preload = source('electron/preload.cjs')
  const api = source('src/api/electron.js')
  for (const id of ['items', 'map', 'bag', 'combat', 'story', 'recipe', 'price-check', 'faustus', 'puzzle', 'highlight-model-training']) {
    assert.match(runtime, new RegExp(`['\"]?${id}['\"]?\\s*:`))
  }
  assert.match(runtime, /electronApi\.puzzle\.stopAll\('module-disabled'\)/)
  assert.match(ipc, /puzzle-stop-all/)
  assert.match(preload, /stopPuzzleAll/)
  assert.match(api, /stopAll:/)
})
