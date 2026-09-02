import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const view = readFileSync(new URL('../src/domains/settings/SettingsView.vue', import.meta.url), 'utf8')
const accountField = readFileSync(new URL('../src/components/configuration/AccountLeagueConfigurationField.vue', import.meta.url), 'utf8')
const inventoryGridField = readFileSync(new URL('../src/components/configuration/InventoryGridConfigurationField.vue', import.meta.url), 'utf8')

function containingPanel(marker) {
  const markerIndex = view.indexOf(marker)
  const panelStart = view.lastIndexOf('<div v-show="activeTab ===', markerIndex)
  return view.slice(panelStart, markerIndex)
}

test('设置页提供七个任务分类并在反馈分类隐藏全局重置入口', () => {
  const tabs = [...view.matchAll(/<el-tab-pane\b[^>]*\bname="([^"]+)"/g)].map(match => match[1])
  assert.deepEqual(tabs, [
    'general',
    'automation',
    'detection',
    'overlay',
    'system',
    'feedback',
    'about'
  ])
  assert.match(view, /<el-tab-pane label="通用" name="general" \/>/)
  assert.match(view, /feedback-tab-label[\s\S]{0,200}问题反馈/, '反馈 tab 使用 label 插槽携带未读红点')
  assert.ok(view.indexOf('重置所有设置') < view.indexOf('<el-tabs'))
  assert.match(view, /v-show="activeTab !== 'feedback'" class="action-buttons"/)
})

test('全局赛季选择与刷新按钮保持左右排列', () => {
  assert.match(view, /AccountLeagueConfigurationField/)
  assert.match(accountField, /<div class="account-league-field__league">[\s\S]*<el-select[\s\S]*刷新赛季[\s\S]*<\/div>/)
  assert.match(accountField, /\.account-league-field__league \{[\s\S]*display: flex;[\s\S]*gap: 12px;/)
  assert.match(accountField, /\.account-league-field__league :deep\(\.el-select\) \{[^}]*flex: 1;/)
})

test('现有设置区块按任务归入对应面板且使用 v-show 保持挂载', () => {
  for (const marker of ['国服账号', '快捷键设置']) {
    assert.match(containingPanel(marker), /activeTab === 'general'/)
  }
  for (const marker of ['背包设置', '通货坐标', '操作延迟']) {
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

test('历史背景仅在自定义背景模式且存在历史记录时显示', () => {
  const overlayStart = view.indexOf('<div v-show="activeTab === \'overlay\'"')
  const overlayEnd = view.indexOf('<div v-show="activeTab === \'feedback\'"', overlayStart)
  const overlayPanel = view.slice(overlayStart, overlayEnd)
  const historySection = overlayPanel.match(/<div\s+v-if="([^"]+)"\s+class="history-section"/)

  assert.equal(
    historySection?.[1],
    "overlaySettings.backgroundMode === 'custom' && backgroundHistory.length > 0"
  )
})

test('Tab 持久状态校验后恢复，切换时保存并滚动到顶部', () => {
  assert.match(view, /import \{ SETTINGS_TABS, resolveSettingsTab \} from '@\/router\/settingsNavigation'/)
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

test('自动操作与系统卡片统一保留单层底部间距', () => {
  assert.match(view, /\.settings-panel--automation :deep\(\.section-card \.el-form > \.el-form-item:last-child\),/)
  assert.match(view, /\.settings-panel--system :deep\(\.section-card \.el-form > \.el-form-item:last-child\),/)
  assert.match(view, /\.settings-panel--automation :deep\(\.section-card \.el-form > \.app-grid:last-child \.el-form-item\) \{\s*margin-bottom: 0;/)
  assert.match(view, /\.currency-position-item :deep\(\.el-form-item\) \{ margin-bottom: 0; \}/)
})

test('背包字段说明收进问号提示且设置页不再编辑物品位置', () => {
  assert.match(view, />\s*连续空格判空\s*<el-tooltip content="扫描连续达到该数量的空格后，认为后续没有内容"/)
  assert.doesNotMatch(view, /label="连续空格停止数量"/)
  assert.match(view, /aria-label="背包网格说明"/)
  assert.doesNotMatch(view, /aria-label="首格位置说明"/)
  assert.doesNotMatch(view, /aria-label="单格宽高说明"/)
  assert.match(view, /aria-label="连续空格判空说明"/)
  assert.doesNotMatch(view, /物品位置|itemPosition|handleItemPositionChange|updateItemPositionDraft/)
})

test('通用页集中展示全部七个受支持全局快捷键', () => {
  const fields = view.match(/const shortcutFields = Object\.freeze\(\[([\s\S]*?)\]\)/)?.[1] || ''
  const keys = [...fields.matchAll(/key: '([^']+)'/g)].map(match => match[1])
  assert.deepEqual(keys, [
    'itemStart',
    'mapStart',
    'end',
    'portal',
    'storyPrevious',
    'storyNext',
    'priceCheck'
  ])
  assert.match(view, /v-for="field in shortcutFields"/)
  assert.doesNotMatch(fields, /potionStart|potionStop|puzzleAnalyze|chaosRecipeStart|chaosRecipePause|chaosRecipeStop/)
})

test('自动操作等待仅保留固定时序并提供键盘可访问说明', () => {
  const operationStart = view.indexOf('<!-- 操作延迟 -->')
  const operationEnd = view.indexOf('<div v-show="activeTab === \'overlay\'"', operationStart)
  const operationSection = view.slice(operationStart, operationEnd)
  assert.match(operationSection, /v-model="operationDelayMs"/)
  assert.match(operationSection, />物理输入时序</)
  assert.match(operationSection, /v-model="fixedTiming\[field\.key\]"/)
  assert.doesNotMatch(operationSection, /adaptiveTiming|adaptiveTimeoutMs|自适应等待/)
  assert.match(operationSection, />固定结果等待</)
  assert.match(operationSection, /TIMING_FIELD_HELP\.operationDelayMs/)
  assert.match(operationSection, /:content="field\.help"/)
  assert.match(operationSection, /class="help-icon timing-help-trigger" tabindex="0"/)
  assert.doesNotMatch(operationSection, />自动检测</)
})

test('背包网格仅通过框选配置并以只读形式展示当前值', () => {
  assert.match(view, /InventoryGridConfigurationField/)
  assert.match(inventoryGridField, /框选背包网格/)
  assert.match(inventoryGridField, /尚未框选/)
  assert.doesNotMatch(view, /v-model="inventory\.startPos\.[xy]"/)
  assert.doesNotMatch(view, /v-model="inventory\.slotSize\.[wh]"/)
  assert.doesNotMatch(view, /handlePickCoordinate\('inventory'\)/)
})

test('通货坐标使用三等分布局并通过组件变量限制四位数输入框宽度', () => {
  assert.match(view, /class="currency-position-grid"/)
  assert.match(view, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(view, /\.currency-position-item \.coordinate-configuration-field\s*\{\s*--coordinate-number-input-width:\s*68px/)
  assert.match(view, /@media \(max-width:\s*1100px\)[\s\S]*?currency-position-grid\s*\{\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(view, /@media \(max-width:\s*760px\)[\s\S]*?currency-position-grid\s*\{\s*grid-template-columns:\s*1fr/)
  assert.doesNotMatch(view, /v-model="positions\[key\]\.[xy]"[\s\S]{0,120}style="width:\s*80px"/)
})
