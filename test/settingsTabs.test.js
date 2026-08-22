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

test('全局赛季选择与刷新按钮保持左右排列', () => {
  assert.match(view, /<div class="account-league-row">[\s\S]*<el-select[\s\S]*刷新赛季[\s\S]*<\/div>/)
  assert.match(view, /\.account-league-row \{[\s\S]*display: flex;[\s\S]*gap: 12px;/)
  assert.match(view, /\.account-league-row[\s\S]*:deep\(\.el-select\) \{[\s\S]*flex: 1;/)
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

test('覆盖层设置在制作预览后提供独立查价弹窗预览和重置入口', () => {
  const overlayStart = view.indexOf('<div v-show="activeTab === \'overlay\'"')
  const overlayEnd = view.indexOf('<div v-show="activeTab === \'feedback\'"', overlayStart)
  const overlayPanel = view.slice(overlayStart, overlayEnd)
  const craftingPreviewIndex = overlayPanel.indexOf('class="preview-box business-overlay-theme"')
  const pricePreviewIndex = overlayPanel.indexOf('class="section-card price-check-preview-card"')

  assert.ok(craftingPreviewIndex >= 0)
  assert.ok(pricePreviewIndex > craftingPreviewIndex)
  assert.match(overlayPanel, /查价弹窗预览/)
  assert.match(overlayPanel, /不展示真实挂单结果，修改不会保存或影响真实查价器/)
  assert.match(overlayPanel, /class="price-check-preview-shell business-overlay-theme"/)
  assert.match(overlayPanel, /<PriceCheckOverlayView[\s\S]*:key="priceCheckPreviewKey"[\s\S]*preview-mode[\s\S]*:preview-state="priceCheckPreview\.state"[\s\S]*:preview-options="priceCheckPreview\.options"/)
  assert.match(overlayPanel, /@click="resetPriceCheckPreview">重置预览/)
  assert.match(view, /const priceCheckPreview = ref\(createPriceCheckPreview\(\)\)/)
  assert.match(view, /function resetPriceCheckPreview\(\) \{\s*priceCheckPreview\.value = createPriceCheckPreview\(\)\s*priceCheckPreviewKey\.value \+= 1\s*\}/)
  assert.match(view, /\.price-check-preview-card \{ width: 100%; \}/)
})

test('Tab 持久状态校验后恢复，切换时保存并滚动到顶部', () => {
  assert.match(view, /const SETTINGS_TABS = \['general', 'automation', 'detection', 'overlay', 'system', 'feedback'\]/)
  assert.match(view, /readPersistentTab\(SETTINGS_TAB_STORAGE_KEY, SETTINGS_TABS, 'general'\)/)
  assert.match(view, /writePersistentTab\(SETTINGS_TAB_STORAGE_KEY, tab, SETTINGS_TABS, 'general'\)/)
  assert.doesNotMatch(view, /sessionStorage/)
  assert.match(view, /settingsScrollbar\.value\?\.setScrollTop\(0\)/)
  assert.match(view, /<el-scrollbar ref="settingsScrollbar" class="primary-page__scroll">/)
})

test('设置内容使用全宽任务面板并保留反馈独立状态', () => {
  assert.match(view, /\.settings-content \{[\s\S]*width:\s*100%;/)
  assert.doesNotMatch(view, /\.settings-content \{[^}]*max-width/)
  assert.match(view, /class="[^"]*settings-panel settings-panel--general"/)
  assert.match(view, /class="[^"]*settings-panel settings-panel--feedback"/)
  assert.match(view, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(view, /@media \(max-width:\s*760px\)/)
})

test('通货坐标使用三等分布局并限制四位数输入框宽度', () => {
  assert.match(view, /class="currency-position-grid"/)
  assert.match(view, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(view, /\.coordinate-number-input\s*\{\s*width:\s*68px/)
  assert.match(view, /@media \(max-width:\s*1100px\)[\s\S]*?currency-position-grid\s*\{\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(view, /@media \(max-width:\s*760px\)[\s\S]*?currency-position-grid\s*\{\s*grid-template-columns:\s*1fr/)
  assert.doesNotMatch(view, /v-model="positions\[key\]\.[xy]"[\s\S]{0,120}style="width:\s*80px"/)
})
