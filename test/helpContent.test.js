import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  CRAFTING_TOPICS,
  FAQ_TOPICS,
  GENERAL_TOPICS,
  MODULE_TOPICS,
  moduleTopicById
} from '../src/domains/help/helpContent.js'

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const topicText = topic => [
  topic.title,
  topic.summary,
  ...(topic.blocks || []).map(block => Array.isArray(block.items) ? block.items.join(' ') : String(block.text || ''))
].join(' ')

test('帮助专题使用唯一稳定 ID 并保留标题摘要', () => {
  const topics = [...GENERAL_TOPICS, ...MODULE_TOPICS, ...FAQ_TOPICS, ...CRAFTING_TOPICS]
  const ids = topics.map(topic => topic.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const topic of topics) {
    assert.ok(topic.title && topic.summary)
    assert.ok(topicText(topic).includes(topic.title))
  }
})

test('模块指南覆盖全部侧栏业务路由', () => {
  assert.deepEqual(
    MODULE_TOPICS.map(topic => topic.route),
    ['/', '/items', '/bag', '/map', '/combat', '/story', '/shop', '/craft-planner', '/price-check', '/puzzle', '/settings']
  )
  for (const topic of MODULE_TOPICS) {
    assert.ok(topic.module.purpose)
    assert.ok(topic.module.prerequisite)
    assert.equal(topic.module.steps.length, 3)
    assert.ok(topic.module.risk)
  }
  assert.equal(MODULE_TOPICS.length, 11)
})

test('moduleTopicById 按 id 返回模块主题', () => {
  assert.equal(moduleTopicById('items')?.id, 'module-items')
  assert.equal(moduleTopicById('settings')?.route, '/settings')
  assert.equal(moduleTopicById('tools'), null)
})

test('做装参考保留完整专题和关键公开边界', () => {
  const content = CRAFTING_TOPICS.map(topicText).join('\n')
  assert.equal(CRAFTING_TOPICS.length, 14)
  for (const text of ['POE1 3.29', 'poecurrency.top OCR', '1/144', '13 种催化剂', 'poe1-3.29-community-v1', '全部 74 条', '社区实测估计', '供体被销毁', '三选一揭露', '希内科拉之锁']) {
    assert.match(content, new RegExp(text))
  }
})

test('常见问题与关于专题完整保留', () => {
  assert.equal(FAQ_TOPICS.length, 8)
  assert.equal(GENERAL_TOPICS.filter(topic => topic.category === 'about').length, 3)
  assert.ok(FAQ_TOPICS.every(topic => topic.blocks.length))
})

test('帮助内容就近分配到对应一级页面', () => {
  const expectations = [
    ['src/domains/dashboard/DashboardRouteView.vue', /helpTopics = \[moduleTopicById\('dashboard'\), quickStartTopic\]/],
    ['src/domains/items/ItemsView.vue', /helpTopics = \[moduleTopicById\('items'\)\]/],
    ['src/domains/bag/BagView.vue', /helpTopics = \[moduleTopicById\('bag'\)\]/],
    ['src/domains/map/MapView.vue', /helpTopics = \[moduleTopicById\('map'\)\]/],
    ['src/domains/combat/CombatView.vue', /helpTopics = \[moduleTopicById\('combat'\)\]/],
    ['src/domains/story/StoryView.vue', /helpTopics = \[moduleTopicById\('story'\)\]/],
    ['src/domains/shop/ShopView.vue', /helpTopics = \[moduleTopicById\('shop'\)\]/],
    ['src/domains/crafting/CraftPlannerView.vue', /helpTopics = \[moduleTopicById\('crafting'\), \.\.\.CRAFTING_TOPICS\]/],
    ['src/domains/priceCheck/PriceCheckView.vue', /helpTopics = \[moduleTopicById\('price-check'\), CRAFTING_PRICE_CHECK_TOPIC\]/],
    ['src/domains/puzzle/PuzzleView.vue', /helpTopics = \[moduleTopicById\('puzzle'\)\]/],
    ['src/domains/settings/SettingsView.vue', /helpTopics = \[moduleTopicById\('settings'\), \.\.\.FAQ_TOPICS\]/]
  ]
  for (const [path, pattern] of expectations) assert.match(source(path), pattern)
})

test('无帮助内容的页面不接入帮助抽屉', () => {
  assert.doesNotMatch(source('src/domains/tools/ToolsView.vue'), /PageHelpDrawer/)
  assert.doesNotMatch(source('src/domains/bag/HighlightModelTrainingView.vue'), /PageHelpDrawer/)
  for (const path of [
    'src/domains/overlay/OverlayView.vue',
    'src/domains/puzzle/PuzzleOverlayView.vue',
    'src/domains/priceCheck/PriceCheckOverlayView.vue',
    'src/domains/story/StoryOverlayView.vue'
  ]) assert.doesNotMatch(source(path), /PageHelpDrawer/)
})

test('帮助中心完全移除且无残留引用', () => {
  assert.equal(existsSync(new URL('../src/views/Help.vue', import.meta.url)), false)
  const router = source('src/router/index.js')
  const loaders = source('src/router/pageLoaders.js')
  const sidebar = source('src/components/Layout/Sidebar.vue')
  assert.doesNotMatch(router, /path: '\/help'/)
  assert.doesNotMatch(loaders, /'\/help'/)
  assert.doesNotMatch(sidebar, /\/help/)
  const content = source('src/domains/help/helpContent.js')
  for (const name of ['HELP_CATEGORIES', 'HELP_TOPICS', 'findHelpTopic', 'searchHelpTopics']) {
    assert.doesNotMatch(content, new RegExp(`export (const|function) ${name}`))
  }
})

test('抽屉默认展开唯一主题并保持只读导航', () => {
  const drawer = source('src/domains/help/PageHelpDrawer.vue')
  assert.match(drawer, /props\.topics\.length === 1 \? props\.topics\[0\]\.id : ''/)
  assert.match(drawer, /<el-drawer/)
  const list = source('src/domains/help/HelpTopicList.vue')
  assert.match(list, /v-if="block\.type === 'paragraph'/)
  assert.match(list, /v-else-if="block\.type === 'heading'/)
  assert.match(list, /v-else-if="block\.type === 'list'/)
  assert.match(list, /v-else-if="block\.type === 'callout'/)
  assert.doesNotMatch(list, /startCrafting|startMapRolling|commitGlobalShortcut|updateShortcuts/)
})

test('设置关于分类展示真实版本与项目链接', () => {
  const settings = source('src/domains/settings/SettingsView.vue')
  assert.match(settings, /<el-tab-pane label="关于" name="about" \/>/)
  assert.match(settings, /v-show="activeTab === 'about'"/)
  assert.match(settings, /packageConfig\.version/)
  assert.match(settings, /target="_blank" rel="noreferrer"/)
})
