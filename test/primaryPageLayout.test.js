import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse } from '@vue/compiler-sfc'

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const primaryPages = [
  'src/domains/dashboard/DashboardRouteView.vue',
  'src/domains/dashboard/DashboardView.vue',
  'src/domains/items/ItemsView.vue',
  'src/domains/bag/BagView.vue',
  'src/domains/bag/HighlightModelTrainingView.vue',
  'src/domains/map/MapView.vue',
  'src/domains/combat/CombatView.vue',
  'src/domains/story/StoryView.vue',
  'src/domains/shop/ShopView.vue',
  'src/domains/crafting/CraftPlannerView.vue',
  'src/domains/priceCheck/PriceCheckView.vue',
  'src/domains/puzzle/PuzzleView.vue',
  'src/domains/tools/ToolsView.vue',
  'src/domains/settings/SettingsView.vue',
  'src/views/Help.vue'
]

test('所有主框架一级页面使用公共页面布局且内容边距统一为 20px', () => {
  for (const path of primaryPages) assert.match(source(path), /class="[^"]*primary-page/)

  const common = source('src/styles/common.less')
  assert.match(common, /\.primary-page\s*\{[\s\S]*?height: 100%;[\s\S]*?min-height: 0;/)
  assert.match(common, /\.primary-page__content\s*\{\s*padding: 20px;/)
  assert.match(source('src/domains/dashboard/DashboardRouteView.vue'), /dashboard-skeleton[^}]*padding: 20px;/)
  assert.match(source('src/components/Layout/MainLayout.vue'), /\.main-content\s*\{[\s\S]*?overflow: hidden;/)
})

test('只有存取、地图、商城和设置提供固定顶层分类 Tab', () => {
  const bag = source('src/domains/bag/BagView.vue')
  const common = source('src/styles/common.less')
  assert.match(bag, /storage-tabs[\s\S]*?display: flex;[\s\S]*?\.el-tabs__content\)[^}]*overflow-y: auto;/)
  assert.match(common, /\.primary-page__tabs\s*\{[^}]*border-bottom:\s*1px solid var\(--border-base\);/)
  assert.match(common, /\.primary-page__tabs \.el-tabs__nav-wrap::after\s*\{\s*display:\s*none;/)

  for (const path of [
    'src/domains/map/MapView.vue',
    'src/domains/shop/ShopView.vue',
    'src/domains/settings/SettingsView.vue'
  ]) {
    const view = source(path)
    assert.ok(view.indexOf('primary-page__tabs') < view.indexOf('primary-page__scroll'))
  }

  for (const path of primaryPages.filter(path => !/BagView|MapView|ShopView|SettingsView/.test(path))) {
    assert.doesNotMatch(source(path), /primary-page__tabs|storage-tabs|kind-tabs|shop-tabs|settings-tabs/)
  }
})

test('设置全局重置位于固定顶栏且保持在 Tab 组件之外', () => {
  const settings = source('src/domains/settings/SettingsView.vue')
  const barStart = settings.indexOf('<div class="primary-page__tabs settings-tab-bar">')
  const reset = settings.indexOf('重置所有设置', barStart)
  const tabs = settings.indexOf('<el-tabs', barStart)
  const barEnd = settings.indexOf('</div>', tabs)

  assert.ok(barStart >= 0 && reset > barStart && tabs > reset && barEnd > tabs)
  assert.match(settings, /ref="settingsScrollbar" class="primary-page__scroll"/)
  assert.match(settings, /settingsScrollbar\.value\?\.setScrollTop\(0\)/)
})

test('存取、模型训练、查价和帮助遵循无最大版心的全宽内容结构', () => {
  const bag = source('src/domains/bag/BagView.vue')
  assert.match(bag, /\.storage-tabs :deep\(\.el-tabs__header\)\s*\{[^}]*margin:\s*0;[^}]*padding:\s*0 20px;/)
  assert.match(bag, /\.storage-tabs :deep\(\.el-tab-pane\)\s*\{[^}]*width:\s*100%;[^}]*margin:\s*0;[^}]*padding:\s*20px;/)
  assert.doesNotMatch(bag, /\.storage-tabs :deep\(\.el-tab-pane\)\s*\{[^}]*max-width/)

  const training = source('src/domains/bag/HighlightModelTrainingView.vue')
  assert.match(training, /training-page primary-page primary-page--column[\s\S]*primary-page__scroll[\s\S]*training-content primary-page__content/)
  assert.doesNotMatch(training, /training-page primary-page primary-page__scroll/)
  assert.doesNotMatch(training, /\.training-content\s*\{[^}]*max-width/)
  assert.doesNotMatch(training, /\.training-content\s*\{[^}]*margin:/)

  const priceCheck = source('src/domains/priceCheck/PriceCheckView.vue')
  assert.match(priceCheck, /price-check-page primary-page primary-page--column[\s\S]*primary-page__scroll[\s\S]*price-check-content primary-page__content app-grid/)
  assert.doesNotMatch(priceCheck, /\.price-check-content\s*\{[^}]*max-width/)
  assert.doesNotMatch(priceCheck, /\.price-check-content\s*\{[^}]*margin:/)
  assert.match(priceCheck, /:xs="24" :md="16"[\s\S]*:xs="24" :md="8"/)

  const help = source('src/views/Help.vue')
  assert.match(help, /\.category-section,[^}]*width:\s*100%;/)
  assert.doesNotMatch(help, /\.category-section,[^}]*width:\s*min\(/)
})

test('仅开发版模型训练页保持可转换的完整栅格模板', () => {
  const training = source('src/domains/bag/HighlightModelTrainingView.vue')
  const { errors } = parse(training, { filename: 'HighlightModelTrainingView.vue' })
  assert.deepEqual(errors, [])
  assert.match(training, /<el-row class="training-content[^>]*>[\s\S]*<el-col :span="24">[\s\S]*<\/el-col>[\s\S]*<\/el-row>/)
})

test('无主布局浮层继续由路由元数据排除', () => {
  const router = source('src/router/index.js')
  const app = source('src/App.vue')
  assert.match(router, /meta:\s*\{[\s\S]*?noLayout:\s*true/)
  assert.match(app, /v-if="!route\.meta\.noLayout"/)
  assert.match(app, /<router-view v-else \/>/)
})

test('主布局和导航保持 76px、原顺序、预加载与非交互视觉分组', () => {
  const layout = source('src/components/Layout/MainLayout.vue')
  const sidebar = source('src/components/Layout/Sidebar.vue')
  const entries = [...sidebar.matchAll(/<el-menu-item[^>]*index="([^"]+)"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/g)]
    .map(match => [match[1], match[2]])

  assert.match(layout, /computed\(\(\) => '76px'\)/)
  assert.deepEqual(entries, [
    ['/', '首页'], ['/items', '制作'], ['/bag', '存取'],
    ['/highlight-model-training', '模型训练'], ['/map', '地图'], ['/combat', '战斗'],
    ['/story', '剧情'], ['/shop', '商城'], ['/craft-planner', '模拟'],
    ['/price-check', '查价'], ['/puzzle', '海图'], ['/tools', '工具站'],
    ['/settings', '设置'], ['/help', '帮助']
  ])
  assert.match(sidebar, /v-if="isModelTrainingEnabled"/)
  assert.match(sidebar, /const isModelTrainingEnabled = import\.meta\.env\.DEV/)
  assert.equal((sidebar.match(/class="nav-group-start"/g) || []).length, 3)
  assert.match(sidebar, /overflow-y:\s*auto/)
  assert.match(sidebar, /@pointerenter="warmRoute/)
  assert.match(sidebar, /@focusin="warmRoute/)
  assert.match(sidebar, /:focus-visible/)
})
