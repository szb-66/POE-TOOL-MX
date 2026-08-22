import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const primaryViews = [
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

test('全部主窗口一级页面使用 Element Plus 24 栅格承载页面区块', () => {
  for (const path of primaryViews) {
    const view = source(path)
    assert.match(view, /<el-row[^>]*class="[^"]*app-grid/, `${path} 缺少 app-grid`)
    assert.match(view, /<el-col[^>]*(?:span|xs|sm|md|lg)=/, `${path} 缺少响应式列`)
  }
})

test('公共栅格固定 16px 横纵 gutter 并保留标准响应式跨度', () => {
  const common = source('src/styles/common.less')
  const dashboard = source('src/domains/dashboard/DashboardView.vue')
  const story = source('src/domains/story/StoryView.vue')

  assert.match(common, /\.app-grid\s*\{\s*row-gap:\s*16px;/)
  assert.match(dashboard, /:gutter="16"/)
  assert.match(dashboard, /:xs="24"\s+:sm="12"\s+:md="8"/)
  assert.match(dashboard, /:xs="24"\s+:sm="12"\s+:md="6"/)
  assert.match(story, /:xs="24"\s+:lg="16"/)
  assert.match(story, /:xs="24"\s+:lg="8"/)
})

test('已迁移的页面级布局不再由局部 grid-template-columns 控制', () => {
  const migratedSelectors = [
    ['src/domains/dashboard/DashboardView.vue', 'module-grid'],
    ['src/domains/tools/ToolsView.vue', 'site-grid'],
    ['src/domains/combat/CombatView.vue', 'resource-grid'],
    ['src/domains/crafting/CraftPlannerView.vue', 'workbench'],
    ['src/domains/puzzle/PuzzleView.vue', 'workspace'],
    ['src/domains/shop/ShopView.vue', 'content-grid'],
    ['src/domains/story/StoryView.vue', 'story-workspace'],
    ['src/domains/settings/FeedbackSettings.vue', 'feedback-grid']
  ]

  for (const [path, selector] of migratedSelectors) {
    const view = source(path)
    assert.doesNotMatch(view, new RegExp(`\\.${selector}\\s*\\{[^}]*grid-template-columns`), `${selector} 仍有旧页面列定义`)
  }
})

test('海图页卡片在列内承载视觉样式并统一使用 16px 间距', () => {
  const puzzle = source('src/domains/puzzle/PuzzleView.vue')

  assert.match(puzzle, /<el-col[^>]*class="configuration-column"[^>]*>[\s\S]*?<article[^>]*class="configuration-card"/)
  assert.match(puzzle, /\.configuration-column\s*\{[^}]*display:\s*flex;/)
  assert.match(puzzle, /\.configuration-card\s*\{[^}]*box-sizing:\s*border-box;[^}]*width:\s*100%;/)
  assert.match(puzzle, /\.count-strip\s*\{[^}]*gap:\s*16px;/)
  assert.match(puzzle, /<el-row class="workspace app-grid" :gutter="16">[\s\S]*?<el-col :xs="24" :lg="12"><el-card/)
  assert.match(puzzle, /\.workspace\s*\{[^}]*align-items:\s*stretch;/)
  assert.match(puzzle, /\.workspace > \.el-col > \.el-card\s*\{[^}]*flex:\s*1;/)
})

test('帮助中心卡片在栅格列内承载视觉样式，避免 gutter 被卡片背景覆盖', () => {
  const help = source('src/views/Help.vue')

  assert.match(help, /<el-row class="quick-grid app-grid" :gutter="16">[\s\S]*?<el-col[^>]*>[\s\S]*?<article class="quick-card">/)
  assert.match(help, /<el-row class="module-grid app-grid" :gutter="16">[\s\S]*?<el-col[^>]*class="module-column"[^>]*>[\s\S]*?<article[\s\S]*?class="module-card"/)
  assert.match(help, /\.quick-card, \.module-card\s*\{[^}]*box-sizing:\s*border-box;[^}]*width:\s*100%;/)
})
