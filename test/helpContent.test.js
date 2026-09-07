import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  CRAFTING_TOPICS,
  FAQ_TOPICS,
  GENERAL_TOPICS,
  MODULE_TOPICS,
  moduleHelpTopicsById,
  moduleTopicById
} from '../src/domains/help/helpContent.js'

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const topicText = topic => [
  topic.title,
  topic.summary,
  ...(topic.blocks || []).map(block => Array.isArray(block.items) ? block.items.join(' ') : String(block.text || ''))
].join(' ')

test('帮助专题使用唯一稳定 ID 并保留标题摘要', () => {
  const beginnerTopics = MODULE_TOPICS.flatMap(topic => moduleHelpTopicsById(topic.id.slice('module-'.length)).slice(1))
  const topics = [...GENERAL_TOPICS, ...MODULE_TOPICS, ...beginnerTopics, ...FAQ_TOPICS, ...CRAFTING_TOPICS]
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
    ['/', '/items', '/bag', '/map', '/combat', '/story', '/regex', '/recipe', '/craft-planner', '/price-check', '/puzzle', '/tools', '/settings']
  )
  for (const topic of MODULE_TOPICS) {
    assert.ok(topic.module.purpose)
    assert.ok(topic.module.prerequisite)
    assert.ok(topic.module.steps.length >= 3, `${topic.id} 应提供完整操作步骤`)
    assert.ok(topic.module.steps.every(step => typeof step === 'string' && step.trim()), `${topic.id} 步骤不能为空`)
    assert.ok(topic.module.risk)
  }
  assert.equal(MODULE_TOPICS.length, 13)
})

test('moduleTopicById 按 id 返回模块主题', () => {
  assert.equal(moduleTopicById('items')?.id, 'module-items')
  assert.equal(moduleTopicById('settings')?.route, '/settings')
  assert.equal(moduleTopicById('tools')?.route, '/tools')
  assert.equal(moduleTopicById('unknown'), null)
})

test('moduleHelpTopicsById 返回稳定有序的新手主题集合', () => {
  const requiredSections = ['首次使用前准备', '操作步骤', '如何判断成功', '停止与恢复', '常见问题', '安全边界', '术语']
  const expectedKeywords = {
    dashboard: ['需要关注', '模块卡片', '全局紧急停止'],
    items: ['物品预设', '词缀组合', '通货坐标'],
    bag: ['背包安全入库', '物品黑名单', '君锋镇取出高亮'],
    map: ['异界地图', '航海海图', '黑名单词缀', '符合条件存仓'],
    combat: ['检测间隔', '被动喝药', '主动喝药', '一键回城'],
    story: ['剧情预设', '技能预设', '剧情浮窗'],
    regex: ['商城正则', '地图正则', '复制正则'],
    recipe: ['商城配方', '仓库快照', '全局紧急停止'],
    crafting: ['分类', '底材', '制作历史', '撤销', '重做'],
    'price-check': ['国服账号', '全局赛季', '国服查价', '公开挂单'],
    puzzle: ['本机校准', '锁定', '相对收益', '自动放置'],
    tools: ['添加站点', '拖动排序', '图片地址', '永久移除'],
    settings: ['通用', '自动操作', '界面识别', '覆盖层', '系统', '问题反馈', '关于']
  }

  for (const [id, keywords] of Object.entries(expectedKeywords)) {
    const topics = moduleHelpTopicsById(id)
    assert.equal(topics[0], moduleTopicById(id))
    assert.ok(Object.isFrozen(topics))
    assert.ok(topics.length >= 3)
    assert.equal(topics[1].id, `module-${id}-first-use`)
    const content = topics.map(topicText).join('\n')
    for (const section of requiredSections) assert.match(content, new RegExp(section))
    for (const keyword of keywords) assert.match(content, new RegExp(keyword))
  }

  assert.deepEqual(moduleHelpTopicsById('unknown'), [])
})

test('做装参考保留完整专题和关键公开边界', () => {
  const content = CRAFTING_TOPICS.map(topicText).join('\n')
  assert.equal(CRAFTING_TOPICS.length, 14)
  for (const text of ['POE1 3.29', 'poecurrency.top OCR', '1/144', '13 种催化剂', 'poe1-3.29-community-v1', '全部 74 条', '社区实测估计', '供体被销毁', '三选一揭露', '希内科拉之锁']) {
    assert.match(content, new RegExp(text))
  }
})

test('常见问题与关于专题完整保留', () => {
  assert.equal(FAQ_TOPICS.length, 9)
  assert.equal(GENERAL_TOPICS.filter(topic => topic.category === 'about').length, 3)
  assert.ok(FAQ_TOPICS.every(topic => topic.blocks.length))
  const systemEnvironment = FAQ_TOPICS.find(topic => topic.id === 'faq-system-environment')
  assert.match(topicText(systemEnvironment), /Windows 10\/11 x64/)
  assert.match(topicText(systemEnvironment), /相同权限级别/)
  assert.match(topicText(systemEnvironment), /网络适配器/)
  const configLocation = FAQ_TOPICS.find(topic => topic.id === 'faq-config-location')
  assert.match(topicText(configLocation), /不可写/)
  assert.match(topicText(configLocation), /权限|安全软件|问题反馈/)
})

test('帮助内容就近分配到对应一级页面', () => {
  const expectations = [
    ['src/domains/dashboard/DashboardRouteView.vue', /helpTopics = \[\.\.\.moduleHelpTopicsById\('dashboard'\), quickStartTopic, \.\.\.healthHelpTopics\]/],
    ['src/domains/items/ItemsView.vue', /helpTopics = moduleHelpTopicsById\('items'\)/],
    ['src/domains/bag/BagView.vue', /helpTopics = moduleHelpTopicsById\('bag'\)/],
    ['src/domains/map/MapView.vue', /helpTopics = moduleHelpTopicsById\('map'\)/],
    ['src/domains/combat/CombatView.vue', /helpTopics = moduleHelpTopicsById\('combat'\)/],
    ['src/domains/story/StoryView.vue', /helpTopics = moduleHelpTopicsById\('story'\)/],
    ['src/domains/regex/RegexView.vue', /helpTopics = moduleHelpTopicsById\('regex'\)/],
    ['src/domains/shop/RecipeView.vue', /helpTopics = moduleHelpTopicsById\('recipe'\)/],
    ['src/domains/crafting/CraftPlannerView.vue', /helpTopics = \[\.\.\.moduleHelpTopicsById\('crafting'\), \.\.\.CRAFTING_TOPICS\]/],
    ['src/domains/priceCheck/PriceCheckView.vue', /helpTopics = \[\.\.\.moduleHelpTopicsById\('price-check'\), CRAFTING_PRICE_CHECK_TOPIC\]/],
    ['src/domains/puzzle/PuzzleView.vue', /helpTopics = moduleHelpTopicsById\('puzzle'\)/],
    ['src/domains/tools/ToolsView.vue', /helpTopics = moduleHelpTopicsById\('tools'\)/],
    ['src/domains/settings/SettingsView.vue', /helpTopics = \[\.\.\.moduleHelpTopicsById\('settings'\), \.\.\.FAQ_TOPICS\]/]
  ]
  for (const [path, pattern] of expectations) {
    assert.match(source(path), /<PageHelpDrawer[^>]*:topics="helpTopics"/)
    assert.match(source(path), pattern)
  }
})

test('开发页和独立浮窗不接入帮助抽屉', () => {
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

test('抽屉默认展开唯一主题并保持只读展示', () => {
  const drawer = source('src/domains/help/PageHelpDrawer.vue')
  assert.match(drawer, /props\.topics\.length === 1 \? props\.topics\[0\]\.id : ''/)
  assert.match(drawer, /<el-drawer/)
  assert.match(drawer, /defineExpose\(\{ open \}\)/)
  assert.match(drawer, /requestedTopicId\.value \|\|/)
  assert.match(drawer, /target \? \[target, \.\.\.props\.topics\.filter/)
  assert.match(drawer, /targetOpenVersion\.value \+= 1/)
  assert.doesNotMatch(drawer, /if \(requestedTopicId\.value\) targetOpenVersion\.value \+= 1/)
  const list = source('src/domains/help/HelpTopicList.vue')
  assert.match(list, /v-if="block\.type === 'paragraph'/)
  assert.match(list, /v-else-if="block\.type === 'heading'/)
  assert.match(list, /v-else-if="block\.type === 'list'/)
  assert.match(list, /v-else-if="block\.type === 'callout'/)
  assert.match(list, /watch\(\(\) => props\.defaultExpandedId/)
  assert.match(list, /expandedTopicIds\.value = topicId \? \[topicId\] : \[\]/)
  assert.doesNotMatch(list, /打开相关页面|useRouter|navigateTo|router\.push|topic\.route/)
  assert.doesNotMatch(list, /startCrafting|startMapRolling|commitGlobalShortcut|updateShortcuts/)
})

test('设置关于分类展示真实版本与项目链接', () => {
  const settings = source('src/domains/settings/SettingsView.vue')
  assert.match(settings, /<el-tab-pane label="关于" name="about" \/>/)
  assert.match(settings, /v-show="activeTab === 'about'"/)
  assert.match(settings, /packageConfig\.version/)
  assert.match(settings, /target="_blank" rel="noreferrer"/)
})
