import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const view = readFileSync(new URL('../src/domains/settings/SettingsView.vue', import.meta.url), 'utf8')

function containingPanel(marker) {
  const markerIndex = view.indexOf(marker)
  const panelStart = view.lastIndexOf('<div v-show="activeTab ===', markerIndex)
  return view.slice(panelStart, markerIndex)
}

test('设置页提供六个任务分类并在反馈分类隐藏全局重置入口', () => {
  const tabs = [...view.matchAll(/<el-tab-pane label="([^"]+)" name="([^"]+)" \/>/g)]
  assert.deepEqual(tabs.map(match => match.slice(1)), [
    ['通用', 'general'],
    ['自动操作', 'automation'],
    ['界面识别', 'detection'],
    ['覆盖层', 'overlay'],
    ['系统', 'system'],
    ['问题反馈', 'feedback']
  ])
  assert.ok(view.indexOf('重置所有设置') < view.indexOf('<el-tabs'))
  assert.match(view, /v-show="activeTab !== 'feedback'" class="action-buttons"/)
})

test('现有设置区块按任务归入对应面板且使用 v-show 保持挂载', () => {
  for (const marker of ['国服账号', '快捷键设置']) {
    assert.match(containingPanel(marker), /activeTab === 'general'/)
  }
  for (const marker of ['背包设置', '通货坐标', '物品位置', '操作延迟']) {
    assert.match(containingPanel(marker), /activeTab === 'automation'/)
  }
  for (const marker of ['<InterfaceDetectionSettings', '<StashTabSelectionSettings']) {
    assert.match(containingPanel(marker), /activeTab === 'detection'/)
  }
  assert.match(containingPanel('覆盖层设置'), /activeTab === 'overlay'/)
  for (const marker of ['系统设置', '应用更新']) {
    assert.match(containingPanel(marker), /activeTab === 'system'/)
  }
  assert.match(containingPanel('<FeedbackSettings'), /activeTab === 'feedback'/)
  assert.doesNotMatch(view, /<div v-if="activeTab ===/)
})

test('Tab 会话状态校验后恢复，切换时保存并滚动到顶部', () => {
  assert.match(view, /const SETTINGS_TABS = new Set\(\['general', 'automation', 'detection', 'overlay', 'system', 'feedback'\]\)/)
  assert.match(view, /sessionStorage\.getItem\(SETTINGS_TAB_STORAGE_KEY\)/)
  assert.match(view, /SETTINGS_TABS\.has\(storedSettingsTab\) \? storedSettingsTab : 'general'/)
  assert.match(view, /sessionStorage\.setItem\(SETTINGS_TAB_STORAGE_KEY, SETTINGS_TABS\.has\(tab\) \? tab : 'general'\)/)
  assert.match(view, /settingsScrollbar\.value\?\.setScrollTop\(0\)/)
  assert.match(view, /<el-scrollbar ref="settingsScrollbar" class="primary-page__scroll">/)
})
