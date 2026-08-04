import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  CRAFTING_TOPICS,
  HELP_CATEGORIES,
  HELP_TOPICS,
  MODULE_TOPICS,
  findHelpTopic,
  searchHelpTopics,
  topicText
} from '../src/domains/help/helpContent.js'

test('帮助目录使用唯一稳定 ID 和有效分类', () => {
  const ids = HELP_TOPICS.map(topic => topic.id)
  const categoryIds = new Set(HELP_CATEGORIES.map(category => category.id))
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(HELP_CATEGORIES.length, 5)
  for (const topic of HELP_TOPICS) {
    assert.ok(categoryIds.has(topic.category), `${topic.id} 使用未知分类`)
    assert.ok(topic.title && topic.summary)
    assert.ok(topicText(topic).includes(topic.title))
  }
})

test('功能指南覆盖全部侧栏业务路由', () => {
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
})

test('全文搜索覆盖标题、关键词和正文且空查询恢复默认状态', () => {
  assert.deepEqual(searchHelpTopics(HELP_TOPICS, ''), [])
  assert.ok(searchHelpTopics(HELP_TOPICS, 'DPI').some(topic => topic.id === 'faq-dpi'))
  assert.ok(searchHelpTopics(HELP_TOPICS, 'Ctrl+D').some(topic => topic.id === 'module-price-check'))
  assert.deepEqual(searchHelpTopics(HELP_TOPICS, '卡兰德之镜').map(topic => topic.id), ['crafting-currency'])
  assert.ok(searchHelpTopics(HELP_TOPICS, '花园').some(topic => topic.id === 'crafting-harvest'))
})

test('做装参考保留完整专题和关键公开边界', () => {
  const content = CRAFTING_TOPICS.map(topicText).join('\n')
  assert.equal(CRAFTING_TOPICS.length, 14)
  for (const text of ['POE1 3.29', 'poecurrency.top OCR', '1/144', '13 种催化剂', 'poe1-3.29-community-v1', '全部 74 条', '社区实测估计', '供体被销毁', '三选一揭露', '希内科拉之锁']) {
    assert.match(content, new RegExp(text))
  }
})

test('帮助页实现 topic 深链接、只读路由导航和真实版本来源', async () => {
  const view = await readFile('src/views/Help.vue', 'utf8')
  assert.match(view, /route\.query\.topic/)
  assert.match(view, /findHelpTopic/)
  assert.match(view, /router\.replace\(\{ path: '\/help', query: \{ topic: topic\.id \} \}\)/)
  assert.match(view, /router\.push\(path\)/)
  assert.match(view, /packageConfig\.version/)
  assert.match(view, /target="_blank"/)
  assert.doesNotMatch(view, /startCrafting|startMapRolling|updateGlobalShortcuts/)
  assert.equal(findHelpTopic('missing-topic'), null)
})
