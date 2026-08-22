import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const combatView = readFileSync(new URL('../src/domains/combat/CombatView.vue', import.meta.url), 'utf8')

function moduleSource(name, nextName) {
  const start = combatView.indexOf(`data-module="${name}"`)
  const end = nextName ? combatView.indexOf(`data-module="${nextName}"`, start) : combatView.indexOf('<script setup>', start)
  assert.ok(start >= 0, `缺少 ${name} 模块`)
  assert.ok(end > start, `${name} 模块边界无效`)
  return combatView.slice(start, end)
}

test('战斗辅助页面按固定顺序展示四个模块', () => {
  const modules = ['combat-settings', 'passive-potion', 'active-potion', 'portal']
  let previous = -1

  for (const name of modules) {
    const index = combatView.indexOf(`data-module="${name}"`)
    assert.ok(index > previous, `${name} 模块顺序错误`)
    previous = index
  }

  assert.equal((combatView.match(/data-module=/g) || []).length, 4)
  assert.equal((combatView.match(/class="module-header"/g) || []).length, 4)
})

test('四个模块标题均使用可聚焦问号承载说明', () => {
  const labels = [
    '查看战斗辅助配置说明',
    '查看被动喝药说明',
    '查看主动喝药说明',
    '查看一键回城说明'
  ]

  for (const label of labels) {
    assert.match(combatView, new RegExp(`tabindex="0" aria-label="${label}"`))
  }

  assert.doesNotMatch(combatView, /class="combat-header"/)
  assert.doesNotMatch(combatView, /class="loop-title"/)
})

test('配置与功能内容归属各自模块', () => {
  const settings = moduleSource('combat-settings', 'passive-potion')
  const passive = moduleSource('passive-potion', 'active-potion')
  const active = moduleSource('active-potion', 'portal')
  const portal = moduleSource('portal')

  assert.match(settings, /v-for="item in shortcutFields"/)
  assert.match(settings, /config\.potion\.scanIntervalMs/)
  assert.match(settings, /config\.potion\.maxTriggersPerSecond/)
  assert.match(settings, /config\.potion\.protectionCooldownMs/)
  assert.match(passive, /v-for="resource in resources"/)
  assert.match(active, /config\.loop\.items/)
  assert.match(portal, /config\.portal\.openKey/)
  assert.match(portal, />执行回城<\/el-button>/)
})

test('被动与主动喝药使用三态标签和单一条件启停按钮', () => {
  const passive = moduleSource('passive-potion', 'active-potion')
  const active = moduleSource('active-potion', 'portal')

  assert.match(passive, /combatStore\.running \? \(combatStore\.focused \? '已开始' : '已开始 · 等待游戏窗口'\) : '已停止'/)
  assert.match(passive, /<el-button v-if="combatStore\.running" type="danger" @click="stopPotionAssist">停止<\/el-button>\s*<el-button v-else type="primary" @click="startPotionAssist">开始<\/el-button>/)
  assert.match(active, /combatStore\.loopRunning \? \(combatStore\.loopFocused \? '已开始' : '已开始 · 等待游戏窗口'\) : '已停止'/)
  assert.match(active, /<el-button v-if="combatStore\.loopRunning" type="danger" @click="stopLoopAssist">停止<\/el-button>\s*<el-button v-else type="primary" @click="startLoopAssist">开始<\/el-button>/)
})

test('主动喝药添加按钮始终位于循环列表末尾并使用默认样式', () => {
  const active = moduleSource('active-potion', 'portal')
  const itemIndex = active.indexOf('v-for="(item, index) in config.loop.items"')
  const addIndex = active.indexOf('class="loop-add-row"')

  assert.ok(itemIndex >= 0 && addIndex > itemIndex)
  assert.match(active, /<div class="loop-list">/)
  assert.doesNotMatch(active, /<div v-(?:if|else)[^>]*class="loop-list"/)
  assert.match(active, /<div class="loop-add-row">\s*<el-button @click="addLoopItem">添加按键<\/el-button>/)
})
