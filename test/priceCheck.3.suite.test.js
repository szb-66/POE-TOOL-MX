import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFile as _m0_readFile } from 'node:fs/promises'
import { cursorInsideBounds as _m0_cursorInsideBounds, getPriceCheckOverlayBounds as _m0_getPriceCheckOverlayBounds, hasLeftPriceCheckIntent as _m0_hasLeftPriceCheckIntent } from '../electron/modules/priceCheck/overlayPosition.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { createHash as _m1_createHash } from 'node:crypto'
import { readFileSync as _m1_readFileSync } from 'node:fs'
import { LocalizationService as _m1_LocalizationService } from '../electron/modules/localization/service.js'
import { PriceCheckService as _m1_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import _m2_assert from 'node:assert/strict'
import { readFileSync as _m2_readFileSync } from 'node:fs'
import _m2_test from 'node:test'
import { createPriceCheckPreview as _m2_createPriceCheckPreview } from '../src/domains/priceCheck/priceCheckPreview.js'
import { clearSelectionForStats as _m2_clearSelectionForStats, formatPropertyTooltip as _m2_formatPropertyTooltip, formatStatTooltip as _m2_formatStatTooltip, restoreAutoSelectionForStats as _m2_restoreAutoSelectionForStats } from '../src/domains/priceCheck/priceCheckAutoSelectionUi.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { readFile as _m3_readFile } from 'node:fs/promises'
import _m3_path from 'node:path'
import { auditPseudoRules as _m3_auditPseudoRules, loadTradeCatalog as _m3_loadTradeCatalog, validateTradeCatalog as _m3_validateTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { parseItemInfo as _m3_parseItemInfo } from '../electron/modules/item/parser.js'
import { createPseudoStats as _m3_createPseudoStats } from '../electron/modules/priceCheck/pseudo.js'
import { buildOfficialTradeQuery as _m3_buildOfficialTradeQuery, createPriceCheckModel as _m3_createPriceCheckModel, refreshPseudoStats as _m3_refreshPseudoStats, sanitizePriceCheckModel as _m3_sanitizePriceCheckModel } from '../electron/modules/priceCheck/query.js'
import { PRICE_CHECK_STATE_FILTERS as _m3_PRICE_CHECK_STATE_FILTERS, PRICE_CHECK_STAT_TYPES as _m3_PRICE_CHECK_STAT_TYPES, createPriceCheckStateFilters as _m3_createPriceCheckStateFilters, sanitizePriceCheckStateFilters as _m3_sanitizePriceCheckStateFilters } from '../shared/priceCheckMetadata.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { fileURLToPath as _m4_fileURLToPath } from 'node:url'
import { PoeCnTradeClient as _m4_PoeCnTradeClient } from '../electron/modules/priceCheck/client.js'
import { PriceCheckService as _m4_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { loadTradeCatalog as _m4_loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { loadTradeCatalog as _m5_loadTradeCatalog, createOfficialTradeCatalog as _m5_createOfficialTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { parseItemInfo as _m5_parseItemInfo } from '../electron/modules/item/parser.js'
import { createPriceCheckModel as _m5_createPriceCheckModel, buildOfficialTradeQuery as _m5_buildOfficialTradeQuery, sanitizePriceCheckModel as _m5_sanitizePriceCheckModel, refreshPseudoStats as _m5_refreshPseudoStats } from '../electron/modules/priceCheck/query.js'
import * as _m5_samples from './fixtures/priceCheckRealItems.js'
import { PriceCheckService as _m5_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { EventEmitter as _m6_EventEmitter } from 'node:events'
import { readFileSync as _m6_readFileSync } from 'node:fs'
import { captureFreshClipboardText as _m6_captureFreshClipboardText, WindowsClipboardInputHelper as _m6_WindowsClipboardInputHelper } from '../electron/modules/priceCheck/clipboardCapture.js'
import { loadTradeCatalog as _m6_loadTradeCatalog, resolveCatalogStat as _m6_resolveCatalogStat, warmTradeCatalogIndexes as _m6_warmTradeCatalogIndexes } from '../electron/modules/priceCheck/catalog.js'
import { PriceCheckService as _m6_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { CHAOS_ERROR_CODES as _m6_CHAOS_ERROR_CODES } from '../electron/modules/chaosRecipe/errors.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { readFile as _m7_readFile } from 'node:fs/promises'
import { createHash as _m7_createHash } from 'node:crypto'
import { createLocalizationTextResolver as _m7_createLocalizationTextResolver } from '../electron/modules/localization/text.js'
import { PriceCheckService as _m7_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { userAshbarkTincture as _m7_userAshbarkTincture } from './fixtures/priceCheckTincture.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { readFile as _m8_readFile } from 'node:fs/promises'
import { PriceCheckService as _m8_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { userRareMap as _m8_userRareMap } from './fixtures/priceCheckCategoryCorpus.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { mkdtemp as _m9_mkdtemp, readFile as _m9_readFile, rm as _m9_rm, writeFile as _m9_writeFile } from 'node:fs/promises'
import _m9_path from 'node:path'
import _m9_os from 'node:os'
import { generateServerTradeCatalog as _m9_generateServerTradeCatalog, writeServerTradeCatalog as _m9_writeServerTradeCatalog } from '../scripts/generateServerTradeCatalog.js'
import { loadTradeCatalog as _m9_loadTradeCatalog, loadInternationalTradeCatalog as _m9_loadInternationalTradeCatalog, resolveCatalogStat as _m9_resolveCatalogStat } from '../electron/modules/priceCheck/catalog.js'

// === Merged from priceCheckIntegration.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFile = _m0_readFile
  const cursorInsideBounds = _m0_cursorInsideBounds
  const getPriceCheckOverlayBounds = _m0_getPriceCheckOverlayBounds
  const hasLeftPriceCheckIntent = _m0_hasLeftPriceCheckIntent
const source = (file) => readFile(file, 'utf8')

test('查价 IPC、preload 和渲染层 API 使用同一组具名通道', async () => {
  const [ipc, preload, api] = await Promise.all([
    source('electron/modules/ipc/priceCheck.js'),
    source('electron/preload.cjs'),
    source('src/api/electron.js')
  ])
  const channels = [
    'price-check-status',
    'price-check-runtime-update',
    'price-check-capture',
    'price-check-rerun',
    'price-check-load-more',
    'price-check-load-distribution',
    'price-check-resolve-identity',
    'price-check-resolve-stat-candidate',
    'price-check-settings-update',
    'price-check-catalog-retry',
    'price-check-settings-changed',
    'price-check-overlay-state',
    'price-check-overlay-close',
    'price-check-error-log',
    'price-check-error-log-delete',
    'price-check-open-official'
  ]
  for (const channel of channels) {
    assert.match(ipc, new RegExp(channel))
    assert.match(preload, new RegExp(channel))
  }
  for (const method of ['getStatus', 'updateRuntime', 'updateSettings', 'capture', 'rerun', 'retryCatalog', 'loadMore', 'loadDistribution', 'resolveIdentity', 'resolveStatCandidate', 'getOverlayState', 'closeOverlay', 'openOfficial', 'onSettingsChanged', 'getErrorLog', 'deleteErrorLogEntry']) {
    assert.match(api, new RegExp(`${method}:`))
  }
  assert.doesNotMatch(ipc, /['"]price-check-(?:parse|run|list-leagues)['"]/)
})

test('主进程复用国服认证与 Session，并在退出时销毁查价覆盖层', async () => {
  const main = await source('electron/main.js')
  assert.match(main, /const priceCheckClient = new PoeCnTradeClient\(\{ session: poeCnSession, server: serverMode.server \}\)[\s\S]*new PriceCheckService\(\{[\s\S]*auth: chaosAuth[\s\S]*client: priceCheckClient/)
  assert.equal((main.match(/session\.fromPartition\(serverMode.server.partition\)/g) || []).length, 1)
  assert.match(main, /priceCheckService\?\.destroyOverlay\(\)/)
  assert.match(main, /catalogRefresher:[\s\S]*createCnOfficialTradeCatalog\(/)
})

test('查价复制使用动态游戏窗口名称执行原子前台门禁', async () => {
  const [main, capture] = await Promise.all([
    source('electron/main.js'),
    source('electron/modules/priceCheck/clipboardCapture.js')
  ])
  assert.match(main, /assertForeground:\s*\(\) => assertWindowsGameForeground/)
  assert.match(capture, /POE_GAME_WINDOW_TITLES_FILE/)
  assert.match(capture, /GetForegroundWindow/)
  assert.match(capture, /GAME_NOT_FOREGROUND/)
  assert.match(capture, /TokenElevation/)
  assert.match(capture, /sys\.exit\(24\)/)
  assert.match(capture, /游戏以管理员权限运行，请批准管理员授权后再执行查价/)
  assert.ok(capture.indexOf('...gameForegroundGuardLines()') < capture.indexOf('u.keybd_event(0x11'))
})

test('查价覆盖层保持单实例、安全隔离并支持状态推送', async () => {
  const overlay = await source('electron/modules/priceCheck/overlay.js')
  assert.match(overlay, /if \(this\.window && !this\.window\.isDestroyed\(\)\) return false/)
  assert.match(overlay, /nodeIntegration: false/)
  assert.match(overlay, /contextIsolation: true/)
  assert.match(overlay, /webSecurity: true/)
  assert.match(overlay, /webContents\.send\('price-check-overlay-state'/)
  assert.match(overlay, /this\.snapshot = null/)
  assert.match(overlay, /window\.on\('blur'/)
  assert.match(overlay, /preserveForExternalAction/)
  assert.match(overlay, /this\.sizeController\.resolve\(area\)/)
  assert.match(overlay, /screen\.getCursorScreenPoint\(\)/)
  assert.match(overlay, /screen\.getDisplayNearestPoint\(cursor\)/)
})

test('查价浮窗按关闭原因选择性归还游戏焦点', async () => {
  const [main, ipc, service, overlay] = await Promise.all([
    source('electron/main.js'),
    source('electron/modules/ipc/priceCheck.js'),
    source('electron/modules/priceCheck/service.js'),
    source('electron/modules/priceCheck/overlay.js')
  ])
  assert.match(ipc, /price-check-overlay-close[\s\S]*USER_DISMISS/)
  assert.match(service, /closeOverlay\(reason = PRICE_CHECK_OVERLAY_CLOSE_REASONS\.SYSTEM\)[\s\S]*this\.overlay\?\.close\?\.\(reason\)/)
  assert.match(overlay, /CURSOR_LEAVE_DELAY_MS\) this\.close\(PRICE_CHECK_OVERLAY_CLOSE_REASONS\.POINTER_LEAVE\)/)
  assert.match(overlay, /window\.on\('blur'[\s\S]*this\.close\(PRICE_CHECK_OVERLAY_CLOSE_REASONS\.BLUR\)/)
  assert.match(overlay, /preserveForExternalAction\(\)[\s\S]*this\.focusSession\.preserveForExternalAction\(\)/)
  const closeBody = overlay.match(/close\(reason[\s\S]*?\n  \}/)?.[0] || ''
  assert.ok(closeBody.indexOf('this.presentation?.park()') < closeBody.indexOf('this.restoreGameFocus()'))
  assert.match(main, /restoreGameFocus:\s*async \(\) => \(await windowActivation\.activateGame/)
})

test('查价浮窗靠近鼠标定位、边缘翻转并支持负坐标显示器', () => {
  assert.deepEqual(
    getPriceCheckOverlayBounds({ x: 300, y: 200 }, { x: 0, y: 0, width: 1920, height: 1080 }, 600),
    { x: 318, y: 0, width: 600, height: 1080 }
  )
  assert.deepEqual(
    getPriceCheckOverlayBounds({ x: 1850, y: 1000 }, { x: 0, y: 0, width: 1920, height: 1080 }, 600),
    { x: 1232, y: 0, width: 600, height: 1080 }
  )
  assert.deepEqual(
    getPriceCheckOverlayBounds({ x: -100, y: 40 }, { x: -1280, y: 24, width: 1280, height: 1000 }, 520),
    { x: -638, y: 24, width: 520, height: 1000 }
  )
})

test('查价浮窗根据鼠标离开锚点或窗口判断关闭意图', () => {
  const anchor = { x: 100, y: 100 }
  const bounds = { x: 118, y: 118, width: 600, height: 700 }
  assert.equal(cursorInsideBounds({ x: 120, y: 120 }, bounds), true)
  assert.equal(hasLeftPriceCheckIntent({ x: 120, y: 120 }, anchor, bounds, false), false)
  assert.equal(hasLeftPriceCheckIntent({ x: 130, y: 100 }, anchor, bounds, false), false)
  assert.equal(hasLeftPriceCheckIntent({ x: 20, y: 100 }, anchor, bounds, false), true)
  assert.equal(hasLeftPriceCheckIntent({ x: 100, y: 100 }, anchor, bounds, true), true)
})

test('查价浮层满高单滚动并折叠低频设置', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  assert.match(view, /settingsCollapsed = ref\(true\)/)
  assert.match(view, /\.topbar \{ height: 38px;/)
  assert.match(view, /\.content \{ height: calc\(100vh - 38px\); overflow: auto;/)
  const filterListRule = view.match(/\.filter-list \{[^}]*\}/)?.[0] || ''
  const mercenaryRule = view.match(/\.mercenary-panel \{[^}]*\}/)?.[0] || ''
  assert.doesNotMatch(filterListRule, /max-height|overflow/)
  assert.doesNotMatch(mercenaryRule, /max-height|overflow/)
  assert.match(view, /\.listing \{ min-height: 36px;/)
})

test('查价浮窗操作按钮使用主次层级且悬浮状态保持对应配色', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  const actionRow = view.match(/<section\b[^>]*class="action-row"[^>]*>([\s\S]*?)<\/section>/)?.[1] || ''

  assert.match(actionRow, /<button class="primary"[^>]*>搜索<\/button>/)
  assert.equal((actionRow.match(/<button class="secondary"/g) || []).length, 2)
  assert.match(actionRow, /class="secondary"[^>]*>\{\{ filtersCollapsed/)
  assert.match(actionRow, /class="secondary"[^>]*>网页市集<\/button>/)
  assert.match(view, /\.action-row \.primary:hover:not\(:disabled\) \{[^}]*color: var\(--brand-on-color\);[^}]*background: color-mix\(in srgb, var\(--brand-color\) 84%, white\);/)
  assert.match(view, /\.action-row \.secondary:hover:not\(:disabled\) \{[^}]*color: var\(--text-primary\);[^}]*background: var\(--surface-hover\);[^}]*border-color: var\(--control-hover-border\);/)
  assert.match(view, /\.action-row button \{ min-height: 24px; padding: 2px var\(--overlay-space-2\); font-size: var\(--overlay-font-size-small\); \}/)
  assert.doesNotMatch(view, /\.search \{|\.market \{/)
})

test('查价属性与词缀使用单行整行选择且数值输入不误触发', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  assert.match(view, /role="checkbox"[\s\S]*@click="toggleFilter\(property\)"/)
  assert.match(view, /role="checkbox"[\s\S]*@click="toggleFilter\(stat\)"/)
  assert.match(view, /<el-input-number\b[^>]*:model-value="stat\.min"[^>]*placeholder="最小"/)
  assert.match(view, /<el-input-number\b[^>]*:model-value="stat\.max"[^>]*placeholder="最大"/)
  assert.match(view, /class="number"[\s\S]*@click\.stop/)
  assert.match(view, /class="number"[\s\S]*@keydown\.stop/)
  assert.match(view, /\.filter-row \{[\s\S]*height: 32px;/)
  assert.doesNotMatch(view, /v-model="(?:property|stat)\.enabled" type="checkbox"/)
  assert.doesNotMatch(view, /content: "属性"/)
})

test('查价浮窗提供当前物品状态三态控件与完整来源标签', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  const metadata = await source('shared/priceCheckMetadata.js')
  const statePanel = view.match(/<section class="panel state-filter-panel">([\s\S]*?)<div v-if="!stateFiltersCollapsed"/)?.[1] || ''
  assert.match(view, /stateFiltersCollapsed = ref\(false\)/)
  assert.match(view, /let activeDisplayGeneration = null/)
  assert.match(view, /if \(displayGeneration !== activeDisplayGeneration\) \{\s*activeDisplayGeneration = displayGeneration\s*stateFiltersCollapsed\.value = false\s*\}/)
  assert.match(statePanel, /<button[\s\S]*class="panel-heading"/)
  assert.match(statePanel, /:aria-expanded="!stateFiltersCollapsed"/)
  assert.match(statePanel, /aria-controls="price-check-state-filters"/)
  assert.match(statePanel, /@click="stateFiltersCollapsed = !stateFiltersCollapsed"/)
  assert.match(statePanel, /<ArrowDown \/>/)
  assert.doesNotMatch(statePanel, />\s*\{\{ stateFiltersCollapsed \? '展开' : '折叠' \}\}/)
  assert.match(view, /\.panel-heading \{[^}]*width: 100%;/)
  assert.match(view, /\.panel-heading:focus-visible/)
  assert.match(view, /\.panel-toggle-icon\.expanded \{ transform: rotate\(0deg\); \}/)
  assert.match(view, /\.state-filter-grid \{ display: grid; grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); gap: 5px; \}/)
  assert.match(view, /v-if="!stateFiltersCollapsed"[^>]*id="price-check-state-filters"/)
  assert.match(view, /v-model="state\.model\.stateFilters\[definition\.key\]"/)
  assert.match(view, /<el-option label="任意" value="any" \/>/)
  assert.match(view, /<el-option label="是" value="true" \/>/)
  assert.match(view, /<el-option label="否" value="false" \/>/)
  assert.match(view, /@keydown\.enter\.prevent="toggleFilter\(stat\)"/)
  assert.match(view, /stat-source-pseudo/)
  for (const label of ['综合', '外延', '基底', '附魔', '分裂', '工艺', '影匿', '异度天灾', '灌注', '地心', '禁域', '佣兵', '古神熔炉', '致命贪婪']) {
    assert.match(metadata, new RegExp(`label: '${label}'`), label)
  }
})

test('查价物品属性固定两列并保留整行选择和输入隔离', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  assert.match(view, /class="property-grid">[\s\S]*v-for="property in propertyRows"/)
  assert.match(view, /\.property-grid \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/)
  assert.match(view, /\.property-row \{[^}]*grid-template-columns: minmax\(0, 1fr\) 52px 52px;[^}]*background: var\(--surface-2\);[^}]*border-color: var\(--border-base\);/)
  assert.match(view, /class="filter-name" :title="propertyTooltip\(property\)"/)
  assert.match(view, /role="checkbox"[\s\S]*@click="toggleFilter\(property\)"/)
  assert.match(view, /:model-value="property\.min"[\s\S]*@update:model-value="setNumericField\(property, 'min', \$event\)"[\s\S]*@click\.stop @keydown\.stop/)
  assert.match(view, /:model-value="property\.max"[\s\S]*@update:model-value="setNumericField\(property, 'max', \$event\)"[\s\S]*@click\.stop @keydown\.stop/)
})

test('查价浮窗表单控件复用全局主题并保留数值空值语义', async () => {
  const [view, elementTheme] = await Promise.all([
    source('src/domains/priceCheck/PriceCheckOverlayView.vue'),
    source('src/styles/element-override.less')
  ])

  assert.doesNotMatch(view, /<select\b|<option\b/)
  assert.doesNotMatch(view, /<input[^>]*type="number"/)
  assert.match(view, /<el-select v-model="queryOptions\.status"[^>]*popper-class="price-check-select-popper business-overlay-theme"[^>]*@change="syncSetting\('status'\)"/)
  assert.match(view, /<el-select v-model="state\.model\.stateFilters\[definition\.key\]"[^>]*popper-class="price-check-select-popper business-overlay-theme"/)
  assert.match(view, /<el-select v-model="property\.value"[^>]*class="property-option"[^>]*@click\.stop @keydown\.stop/)
  assert.equal((view.match(/<el-input-number/g) || []).length, 5)
  assert.equal((view.match(/<el-input-number[^>]*size="small"/g) || []).length, 5)
  assert.equal((view.match(/:controls="false"/g) || []).length, 5)
  assert.match(view, /function setNumericField\(target, key, value\) \{\s*target\[key\] = value == null \? undefined : value\s*\}/)
  assert.match(view, /\.number :deep\(\.el-input\),\s*\.setting-number :deep\(\.el-input\) \{ height: 24px; \}/)
  assert.match(view, /\.number :deep\(\.el-input__wrapper\),\s*\.setting-number :deep\(\.el-input__wrapper\) \{ min-height: 22px; padding-top: 0; padding-bottom: 0; \}/)
  assert.doesNotMatch(view, /select:not\(:disabled\)|select:focus-visible/)
  assert.match(elementTheme, /html:is\(\.app-dark-theme, \.app-light-theme\)[\s\S]*\.el-select__wrapper[\s\S]*background: var\(--surface-2\)/)
  assert.match(elementTheme, /\.el-select-dropdown__item[\s\S]*&\.is-hovering[\s\S]*&\.is-selected/)
})

test('佣兵凭证浮窗按组显示技能并支持严格的父子选择交互', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  assert.match(view, /v-if="state\.model\.mercenarySkillGroups\?\.length"/)
  assert.match(view, /v-for="group in state\.model\.mercenarySkillGroups"/)
  assert.match(view, /\{\{ gameText\(group\.skill\.text\) \}\}/)
  assert.match(view, /v-for="support in group\.supports"/)
  assert.match(view, /\{\{ gameText\(support\.name\) \}\}[^]*gameText\('等阶'\)[^]*\{\{ support\.tier \}\}/)
  assert.match(view, /role="checkbox"[^]*:aria-checked="group\.enabled"[^]*@keydown\.enter\.prevent="toggleMercenaryGroup\(group\)"[^]*@keydown\.space\.prevent="toggleMercenaryGroup\(group\)"/)
  assert.match(view, /:aria-pressed="support\.enabled"[^]*@click="toggleMercenarySupport\(group, support\)"/)
  assert.match(view, /function toggleMercenarySupport\(group, support\)[^]*support\.enabled = !support\.enabled[^]*if \(support\.enabled\) group\.enabled = true/)
  assert.match(view, /function toggleMercenaryGroup\(group\) \{ group\.enabled = !group\.enabled \}/)
  assert.match(view, /\.mercenary-supports \{[^}]*flex-wrap: wrap/)
  const mercenaryRule = view.match(/\.mercenary-panel \{[^}]*\}/)?.[0] || ''
  assert.doesNotMatch(mercenaryRule, /max-height|overflow/)
  assert.match(view, /\.mercenary-support\.enabled/)
})

test('地图和海图浮窗展示区域身份、形状选项与仅供参考字段', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  const query = await source('electron/modules/priceCheck/query.js')
  assert.match(view, /identity\?\.displayName \|\| state\.model\.item\.name/)
  assert.match(view, /v-if="property\.options\?\.length"/)
  assert.match(view, /v-model="property\.value"/)
  assert.match(view, /v-if="state\.model\.information\?\.length"/)
  assert.match(view, /官方过滤目录没有对应字段，不会写入查询/)
  for (const label of ['地图阶级', '物品数量', '物品稀有度', '怪群', '区域等级', '亡者硫磺', '海图形状']) {
    assert.match(query, new RegExp(`'${label}'`), label)
  }
})

test('查价身份栏仅使用整行边框表达名称选择并保留大类安全约束', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  const identitySection = view.match(/<section v-if="state\.model" class="panel identity">([\s\S]*?)<\/section>/)?.[1] || ''
  assert.match(view, /toggleableIdentityName = computed\(\(\) => \{[\s\S]*identity\?\.name[\s\S]*item\?\.name/)
  assert.match(view, /if \(identity\?\.category === 'map' \|\| identity\?\.category === 'chart' \|\| identity\?\.displayName\) return ''/)
  assert.match(identitySection, /v-if="toggleableIdentityName"/)
  assert.match(identitySection, /<strong>\{\{ toggleableIdentityName \}\}<\/strong>/)
  assert.match(identitySection, /<button[\s\S]*type="button"[\s\S]*class="identity-name filter-row"/)
  assert.match(identitySection, /:aria-pressed="nameFilterEnabled"/)
  assert.match(identitySection, /:disabled="!canToggleName"/)
  assert.match(identitySection, /@click="setNameFilterEnabled\(!nameFilterEnabled\)"/)
  assert.match(identitySection, /@keydown\.enter\.prevent="setNameFilterEnabled\(!nameFilterEnabled\)"/)
  assert.match(identitySection, /@keydown\.space\.prevent="setNameFilterEnabled\(!nameFilterEnabled\)"/)
  assert.doesNotMatch(identitySection, /type="checkbox"|identity-name-checkbox/)
  assert.match(identitySection, /identity\?\.categoryLabel \|\| state\.model\.item\.category/)
  assert.match(identitySection, /state\.model\.item\.baseType[^]*state\.league/)
  assert.match(identitySection, /v-if="activeFlags\.length" class="identity-side"[^]*class="flags"/)
  assert.doesNotMatch(identitySection, /identity-hint|物品已读取|请确认条件/)
  assert.doesNotMatch(view, /<div v-else-if="state\.status === 'ready-to-query'" class="state-message">/)
  assert.doesNotMatch(view, /\.identity-hint\s*\{/)
  assert.match(view, /nameFilterEnabled = computed\([\s\S]*!identity\?\.category \|\| identity\.nameEnabled !== false/)
  assert.match(view, /canToggleName = computed\(\(\) => Boolean\([\s\S]*toggleableIdentityName\.value[\s\S]*identity\?\.category/)
  assert.match(view, /function setNameFilterEnabled\(enabled\)[\s\S]*!toggleableIdentityName\.value[\s\S]*!canToggleName\.value[\s\S]*identity\.nameEnabled = true[\s\S]*identity\.nameEnabled = enabled !== false/)
  assert.match(view, /electronApi\.priceCheck\.rerun\(\{[\s\S]*model: state\.value\.model/)
  assert.match(view, /\.identity-side \{[\s\S]*flex-wrap: wrap;/)
  assert.match(view, /\.identity-name\.disabled/)
  assert.match(view, /\.identity-name \{[^}]*appearance: none;/)
  assert.match(view, /\.identity-name \{[^}]*width: 100%;/)
  assert.doesNotMatch(view, /\.identity-name \{[^}]*width: fit-content;/)
  assert.match(view, /\.identity-name\.filter-row \{[^}]*background: transparent;[^}]*border: 1px solid transparent;/)
  assert.match(view, /\.identity-name\.filter-row\.enabled \{[^}]*background: color-mix\(in srgb, var\(--brand-color\) 14%, var\(--surface-1\)\);[^}]*border-color: var\(--brand-color\);/)
  assert.doesNotMatch(view, /\.identity-name\.filter-row\.enabled \{[^}]*box-shadow:/)
  assert.ok(view.indexOf('.identity-name.filter-row.enabled') > view.indexOf('button {'))
  assert.match(view, /\.filter-row:focus-visible/)
  assert.doesNotMatch(view, /\.identity-name-checkbox/)
})

test('查价加载、错误和限流反馈位于搜索按钮下方的结果区域', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  const actionIndex = view.indexOf('class="action-row"')
  const loadingIndex = view.indexOf('<div v-if="state.status === \'loading\'" class="state-message"')
  const errorIndex = view.indexOf('<div v-else-if="state.status === \'error\'" class="state-message error"')
  const rateLimitIndex = view.indexOf('<div v-if="rateLimitText" class="warning rate-limit-warning"')
  const resultIndex = view.indexOf('<section v-if="state.result" class="results">')

  assert.ok(actionIndex >= 0)
  assert.ok(actionIndex < loadingIndex)
  assert.ok(loadingIndex < errorIndex)
  assert.ok(errorIndex < rateLimitIndex)
  assert.ok(rateLimitIndex < resultIndex)
  assert.doesNotMatch(view.slice(0, actionIndex), /state\.status === 'loading'|state\.status === 'error'|rateLimitText/)
  assert.match(view, /class="state-message" aria-live="polite">正在查询官方挂单…/)
  assert.match(view, /class="state-message error" role="alert">\{\{ stateErrorText \}\}/)
  assert.match(view, /class="warning rate-limit-warning" role="alert">\{\{ rateLimitText \}\}/)
  assert.match(view, /stateErrorText[\s\S]*RATE_LIMITED/)
  assert.match(view, /rateLimitText = computed\(\(\) => formatRateLimit/)
})

test('查价设置跨页面双向同步并提供价格分布和候选选择', async () => {
  const [store, page, overlay] = await Promise.all([
    source('src/stores/priceCheck.js'),
    source('src/domains/priceCheck/PriceCheckView.vue'),
    source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  ])
  assert.match(page, />查询设置</)
  assert.match(page, /label="立即查价"[\s\S]*settings\.queryImmediately[\s\S]*changeSetting\('queryImmediately'/)
  assert.doesNotMatch(page, />默认查询设置</)
  assert.match(page, /重试官方目录[\s\S]*retryCatalog/)
  assert.match(store, /onSettingsChanged[\s\S]*normalizePriceCheckSettings[\s\S]*saveSettings\(\)/)
  assert.match(store, /async function retryCatalog\(\)[\s\S]*priceCheck\.retryCatalog/)
  assert.match(store, /key === 'queryImmediately'[\s\S]*saveSettings\(\)/)
  assert.match(store, /priceCheck\.capture\(\{[\s\S]*queryImmediately: settings\.value\.queryImmediately/)
  assert.match(overlay, /syncSetting\('status'\)/)
  assert.match(overlay, /syncSetting\('collapseListings'\)/)
  assert.match(overlay, /1D ≈ \$\{rate\}C/)
  assert.match(overlay, /showDistribution[\s\S]*loadDistribution/)
  assert.doesNotMatch(overlay, /物品已读取|点击“搜索”/)
  assert.match(overlay, /formatRateLimit[\s\S]*官方接口限制请求频率/)
  assert.match(overlay, /stateErrorText[\s\S]*RATE_LIMITED/)
  assert.match(overlay, /identity-required[\s\S]*resolveIdentity/)
  assert.match(overlay, /unknown\.candidates[\s\S]*selectStatCandidate/)
  assert.match(overlay, /\{\{ stat\.displayText \|\| gameText\(stat\.text\) \}\}/)
  assert.match(overlay, /:model-value="stat\.min"[^>]*:min="0"/)
  assert.match(overlay, /:model-value="stat\.max"[^>]*:min="0"/)
  assert.match(overlay, /resolveStatCandidate\(unknown\.key, candidate\.id\)/)
  assert.match(overlay, /未加入本次查询/)
  assert.match(overlay, /重试目录[\s\S]*retryCatalog/)
  assert.match(overlay, /\.filter-row:not\(\.unknown\):hover/)
  assert.match(overlay, /\.filter-row:focus-visible/)
  for (const sourceText of [store, page, overlay]) {
    assert.doesNotMatch(sourceText, /valueRange|down10|down20|unlimited/)
  }
  assert.doesNotMatch(page, /数值范围/)
  assert.doesNotMatch(overlay, /数值范围/)
})

test('等价官方词缀在浮窗中只显示一条可编辑逻辑条件', async () => {
  const overlay = await source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  const statRow = overlay.match(/v-for="stat in statRows"[\s\S]*?<\/div>/)?.[0] || ''
  assert.match(statRow, /:key="stat\.key"/)
  assert.match(statRow, /\{\{ stat\.displayText \|\| gameText\(stat\.text\) \}\}/)
  assert.match(statRow, /stat\.queryVariants\?\.length > 1[\s\S]*已合并多个官方同文案过滤项/)
  assert.equal((statRow.match(/toggleFilter\(stat\)/g) || []).length, 3)
  assert.equal((statRow.match(/setNumericField\(stat, '(?:min|max)'/g) || []).length, 2)
  assert.doesNotMatch(statRow, /queryVariants[^>]*v-for|candidate\.id|resolveStatCandidate/)
})

test('首页业务模块每行最多展示三个', async () => {
  const dashboard = await source('src/domains/dashboard/DashboardView.vue')
  assert.match(dashboard, /<el-row class="module-grid app-grid" :gutter="16">/)
  assert.match(dashboard, /<el-col v-for="module in group\.modules"[^>]*:xs="24" :sm="12" :md="8">/)
})

test('浮窗内部重新查询不改变浮窗位置，仅外部捕获才重新定位', async () => {
  const [overlay, service] = await Promise.all([
    source('electron/modules/priceCheck/overlay.js'),
    source('electron/modules/priceCheck/service.js')
  ])
  assert.match(overlay, /create\(snapshot, \{ reposition = true \} = \{\}\)/)
  assert.match(overlay, /if \(!created && reposition\) \{[\s\S]*setBounds/)
  assert.match(service, /async check\(\{ text, league, model, options = \{\}, reposition = true, execute = true, queryImmediately = true, source = 'capture' \}\)/)
  assert.match(service, /this\.createOverlay\(state, \{ reposition \}\)/)
  assert.match(service, /rerun[\s\S]*reposition: false/)
  assert.match(service, /resolveIdentity[\s\S]*reposition: false/)
})

test('查价浮窗启用后后台预热、普通关闭停放且禁用或退出时销毁', async () => {
  const [overlay, service, main] = await Promise.all([
    source('electron/modules/priceCheck/overlay.js'),
    source('electron/modules/priceCheck/service.js'),
    source('electron/main.js')
  ])
  assert.match(service, /if \(enabled\) \{[\s\S]*this\.overlay\?\.prepare\?\.\(\)/)
  assert.match(overlay, /prepare\(\)[\s\S]*ensureWindow/)
  assert.match(overlay, /close\(reason = PRICE_CHECK_OVERLAY_CLOSE_REASONS\.SYSTEM\)[\s\S]*this\.presentation\?\.park\(\)/)
  assert.doesNotMatch(overlay.match(/close\(reason[\s\S]*?\n  \}/)?.[0] || '', /\.hide\(\)|\.close\(\)|\.destroy\(\)/)
  assert.match(service, /destroyOverlay\(\)[\s\S]*this\.overlay\?\.destroy\?\.\(\)/)
  assert.match(service, /else \{[\s\S]*this\.clear\(\)[\s\S]*this\.destroyOverlay\(\)/)
  assert.match(main, /cleanupApplicationResources\(\)[\s\S]*priceCheckService\?\.destroyOverlay\(\)/)
})

test('查价浮窗首个状态完成渲染后才显示以避免空壳闪烁', async () => {
  const [overlay, ipc, preload, api, view] = await Promise.all([
    source('electron/modules/priceCheck/overlay.js'),
    source('electron/modules/ipc/priceCheck.js'),
    source('electron/preload.cjs'),
    source('src/api/electron.js'),
    source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  ])
  const createBody = overlay.match(/create\(snapshot,[\s\S]*?\n  \}/)?.[0] || ''

  assert.match(createBody, /this\.pendingShowCursor = display\.needsReveal \? \{ \.\.\.cursor \} : null[\s\S]*this\.publish\(\)/)
  assert.match(createBody, /if \(this\.loadingRendered && this\.pendingShowCursor\) this\.showPreparedWindow/)
  assert.match(overlay, /markRendered\(contents, generation\)[\s\S]*this\.window\.webContents !== contents[\s\S]*generation !== this\.displayGeneration[\s\S]*this\.showPreparedWindow/)
  assert.match(overlay, /contentRendered = false[\s\S]*setBackgroundThrottling\(false\)[\s\S]*this\.publish\(\)/)
  assert.match(overlay, /markRendered\(contents, generation\)[\s\S]*setBackgroundThrottling\(true\)/)
  assert.match(overlay, /webContents\.send\('price-check-overlay-state', snapshot, \{ generation \}\)/)
  assert.match(ipc, /ipcMain\.on\('price-check-overlay-rendered', \(event, generation\)[\s\S]*service\.markOverlayRendered\(event\.sender, generation\)/)
  assert.match(ipc, /price-check-overlay-state[\s\S]*presentation: service\.getOverlayPresentation\(\)/)
  assert.match(preload, /notifyPriceCheckOverlayRendered: \(generation\) => ipcRenderer\.send\('price-check-overlay-rendered', generation\)/)
  assert.match(preload, /const listener = \(_event, data, presentation\) => callback\(data, presentation\)/)
  assert.match(api, /rendered: \(generation\) => window\.electronAPI\.notifyPriceCheckOverlayRendered\?\.\(generation\)/)
  assert.match(view, /import \{[^}]*nextTick[^}]*\} from 'vue'/)
  assert.match(view, /applySnapshot\(snapshot, presentation = null\)[\s\S]*presentation\?\.generation[\s\S]*await nextTick\(\)[\s\S]*requestAnimationFrame[\s\S]*priceCheck\.rendered\(displayGeneration\)/)
  assert.match(view, /getOverlayState\(\)[\s\S]*applySnapshot\(response\.data, response\.presentation\)/)
  assert.match(view, /\.overlay-shell \{[^}]*animation: none;[^}]*transition: none;/)
})

test('查价浮窗预热后只恢复交互和聚焦，不再重复触发原生显示', async () => {
  const overlay = await source('electron/modules/priceCheck/overlay.js')
  const showBody = overlay.match(/showPreparedWindow\(cursor\) \{[\s\S]*?\n  \}/)?.[0] || ''
  const closeBody = overlay.match(/close\(reason[\s\S]*?\n  \}/)?.[0] || ''

  assert.match(overlay, /show: false,[\s\S]*opacity: 0,[\s\S]*focusable: false,/)
  assert.match(overlay, /window\.once\('ready-to-show'[\s\S]*this\.presentation\.prime\(\)[\s\S]*setTimeout\([\s\S]*this\.ready = true[\s\S]*NATIVE_PRIME_DELAY_MS/)
  assert.match(showBody, /this\.presentation\?\.reveal\(this\.displayGeneration, \{ focus: this\.contentRendered \}\)/)
  assert.doesNotMatch(showBody, /\.show\(\)|\.showInactive\(\)|\.hide\(\)|setOpacity/)
  assert.match(closeBody, /this\.presentation\?\.park\(\)/)
  assert.doesNotMatch(closeBody, /\.show\(\)|\.hide\(\)/)
})

test('查价浮窗保持显示并更换物品时开启新的焦点归还会话', async () => {
  const overlay = await source('electron/modules/priceCheck/overlay.js')
  const createBody = overlay.match(/create\(snapshot,[\s\S]*?\n  \}/)?.[0] || ''

  assert.match(createBody, /const display = this\.presentation\.beginDisplay\(\)[\s\S]*this\.focusSession\.begin\(\)[\s\S]*this\.displayGeneration = display\.generation/)
  assert.doesNotMatch(createBody, /if \(display\.needsReveal\) this\.focusSession\.begin\(\)/)
})

test('捕获 IPC 显式清理立即查价布尔值', async () => {
  const ipc = await source('electron/modules/ipc/priceCheck.js')
  assert.match(ipc, /queryImmediately: request\?\.queryImmediately === true/)
})

test('查价开关注册失败会回滚后端运行态', async () => {
  const store = await source('src/stores/priceCheck.js')
  assert.match(store, /await syncRuntime\(\{ enabled: true \}\)[\s\S]*shortcut\.register\(shortcut, 'priceCheck'\)/)
  assert.match(store, /if \(!registration\?\.success\)[\s\S]*updateRuntime\(\{ enabled: false \}\)[\s\S]*enabled = false/)
  assert.match(store, /shortcut\.unregister\(shortcut\)[\s\S]*syncRuntime\(\{ enabled: false \}\)/)
})

test('空查价快捷键保留模块启用状态且跳过注册', async () => {
  const [store, view] = await Promise.all([
    source('src/stores/priceCheck.js'),
    source('src/domains/priceCheck/PriceCheckView.vue')
  ])
  assert.doesNotMatch(store, /请先设置国服查价快捷键/)
  assert.match(store, /await syncRuntime\(\{ enabled: true \}\)[\s\S]*if \(shortcut\) \{[\s\S]*shortcut\.register\(shortcut, 'priceCheck'\)[\s\S]*settings\.value\.enabled = true/)
  assert.match(store, /if \(shortcut\) await electronApi\.shortcut\.unregister\(shortcut\)/)
  assert.match(view, /priceCheckShortcutText[\s\S]*'未设置'/)
})

test('真实查价浮窗从主进程快照读取最新快捷键', async () => {
  const [store, view] = await Promise.all([
    source('src/stores/priceCheck.js'),
    source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  ])
  assert.match(store, /shortcut:\s*appSettings\.globalShortcuts\.priceCheck[\s\S]*updateRuntime\(\{[\s\S]*\.\.\.requested/)
  assert.match(view, /props\.previewMode[\s\S]*appSettings\.globalShortcuts\.priceCheck[\s\S]*state\.value\?\.shortcut/)
})

test('统一国服账号通道替代商城与查价重复认证入口', async () => {
  const [accountIpc, preload, settings, accountField, shop, price] = await Promise.all([
    source('electron/modules/ipc/poeCnAccount.js'),
    source('electron/preload.cjs'),
    source('src/domains/settings/SettingsView.vue'),
    source('src/components/configuration/AccountLeagueConfigurationField.vue'),
    source('src/domains/shop/ChaosRecipePanel.vue'),
    source('src/domains/priceCheck/PriceCheckView.vue')
  ])
  for (const channel of ['status', 'restore', 'open-web', 'complete-web', 'token', 'logout', 'list-leagues', 'set-league']) {
    assert.match(accountIpc, new RegExp(`poe-cn-account-${channel}`))
    assert.match(preload, new RegExp(`poe-account-${channel}`))
  }
  assert.match(settings, /currentServer.label[\s\S]*AccountLeagueConfigurationField/)
  assert.match(accountField, /全局赛季/)
  assert.match(shop, /前往账号设置/)
  assert.match(price, /前往账号与快捷键设置/)
  assert.doesNotMatch(shop, /POESESSID|打开网页登录|退出国服账号/)
  assert.doesNotMatch(price, /POESESSID|打开网页登录|退出共享国服账号/)
})

test('查价快捷键字段默认未设置并进入设置页与统一动作派发', async () => {
  const [config, settings, service] = await Promise.all([
    source('src/utils/shortcutConfig.js'),
    source('src/domains/settings/SettingsView.vue'),
    source('src/utils/scriptService.js')
  ])
  assert.match(config, /priceCheck: ''/)
  assert.match(settings, /\{ key: 'priceCheck', label: `\$\{currentServer.label\}查价` \}/)
  assert.match(settings, /:model-value="shortcuts\[field\.key\]"[\s\S]*handleShortcutsChange\(field\.key, \$event\)/)
  assert.match(service, /priceCheck:\s*startPriceCheck/)
  assert.match(service, /checkHoveredItem\(\)/)
})

test('查价配置页移除手动文本入口并只保留快捷键说明', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckView.vue')
  assert.match(view, /快捷键未设置时不会触发物品捕获/)
  assert.match(view, /store\.setEnabled\(enabled\)/)
  assert.doesNotMatch(view, /type="textarea"|store\.(?:run|parse|checkClipboard)\(/)
})
})()

// === Merged from priceCheckLocalizationFallback.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const createHash = _m1_createHash
  const readFileSync = _m1_readFileSync
  const LocalizationService = _m1_LocalizationService
  const PriceCheckService = _m1_PriceCheckService
const catalog = JSON.parse(readFileSync(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
const hash = value => createHash('sha256').update(value).digest('hex')
const baseEntry = (en, cn) => ({ table: 'BaseItemTypes', id: en, field: 'Name', kind: 'dat', en, cn, tw: cn, sourceHash: hash(en) })
const statEntry = (en, cn) => ({ table: 'metadata/statdescriptions/stat_descriptions.csd', id: en, field: 'variant:0', kind: 'stat', en, cn, tw: cn, sourceHash: hash(en) })

const glovesText = `物品类别: 手套
稀 有 度: 稀有
魔暴 温存
秘术手套
--------
能量护盾: 45
--------
需求:
等级: 60
智慧: 95
--------
插槽: W-W-W-W 
--------
物品等级: 75
--------
{ 前缀属性 "运动员的" (等阶：1)— 生命 }
+120(115-129) 最大生命
{ 大师级 前缀属性 "升级的"— 傷害,召喚物 }
召唤生物的伤害提高 13(10-20)%
{ 后缀属性 "大学者之" (等阶：3)— 能力 }
+38(38-42) 智慧
{ 后缀属性 "瑞斯拉萨之" (等阶：2)— 生命 }
每秒再生 51.4(48.1-64) 生命
{ 后缀属性 "暴风雨之" (等阶：4)— 元素,閃電,抗性 }
+33(30-35)% 闪电抗性

`

const fallbackEntries = [
  baseEntry('Sorcerer Gloves', '秘术手套'),
  statEntry('+{0} to maximum Life', '+{0} 最大生命'),
  statEntry('Minions deal {0}% increased Damage', '召唤生物的伤害提高 {0}%'),
  statEntry('+{0} to Intelligence', '+{0} 智慧'),
  statEntry('Regenerate {0} Life per second', '每秒再生 {0} 生命'),
  statEntry('+{0}% to Lightning Resistance', '+{0}% 闪电抗性')
]

function localizationFixture({ active = null, activeCandidate = null, ready = null, history = null } = {}) {
  const service = Object.create(LocalizationService.prototype)
  Object.assign(service, {
    active,
    activeCandidate,
    ready,
    priceCheckHistoryBundle: undefined,
    refreshActiveValidation() {},
    downloader: { loadCachedHistory: () => history }
  })
  return service
}

test('当前映射停用后，查价翻译回退到上次应用、已下载或历史词库', () => {
  const active = { manifest: { releaseId: 'active-1' }, entries: [{ id: 'active' }] }
  const candidate = { manifest: { releaseId: 'candidate-1' }, entries: [{ id: 'candidate' }] }
  const ready = { manifest: { releaseId: 'ready-1' }, entries: [{ id: 'ready' }] }
  const history = { manifest: { releaseId: 'history-1' }, entries: [{ id: 'history' }] }

  const preferred = localizationFixture({ active, activeCandidate: candidate, ready, history })
  assert.deepEqual(preferred.getPriceCheckEntries().map(entry => entry.id), ['active'])
  assert.equal(preferred.getPriceCheckRevision(), 'active-1')

  const afterDisable = localizationFixture({ ready, history })
  assert.deepEqual(afterDisable.getPriceCheckEntries().map(entry => entry.id), ['ready'])
  assert.equal(afterDisable.getPriceCheckRevision(), 'ready-1')

  const verificationFailed = localizationFixture({ activeCandidate: candidate, ready })
  assert.deepEqual(verificationFailed.getPriceCheckEntries().map(entry => entry.id), ['candidate'])
  assert.equal(verificationFailed.getPriceCheckRevision(), 'candidate-1')

  const cacheOnly = localizationFixture({ history })
  assert.deepEqual(cacheOnly.getPriceCheckEntries().map(entry => entry.id), ['history'])
  assert.equal(cacheOnly.getPriceCheckRevision(), 'history-1')
})

test('中文映射停用但游戏仍显示旧汉化时，使用已下载词库完成国际服查价', async () => {
  const localizer = localizationFixture({
    ready: { manifest: { releaseId: 'ready-legacy' }, entries: fallbackEntries }
  })
  const entries = localizer.getPriceCheckEntries()
  assert.equal(entries.length, fallbackEntries.length)

  const searches = []
  const service = new PriceCheckService({
    catalog,
    manualInputOnly: true,
    auth: { getStatus: () => ({ authenticated: true }), registerCacheClearer() {} },
    client: {
      server: { id: 'international', label: '国际服' },
      search: async (league, query) => { searches.push({ league, query }); return { id: 'fixture', total: 0, result: [] } },
      fetch: async () => ({ result: [] }),
      clearCache() {}
    },
    localizationProvider: () => entries,
    localizationRevisionProvider: () => localizer.getPriceCheckRevision()
  })

  const result = await service.check({ league: 'Covens', text: glovesText, options: { initialSelection: 'all' } })
  assert.equal(result.model.identity.type, 'Sorcerer Gloves')
  assert.ok(result.model.stats.some(stat => stat.id === 'explicit.stat_3299347043' && stat.values[0] === 120))
  assert.equal(searches.length, 1)
  assert.match(JSON.stringify(searches[0].query), /explicit\.stat_3299347043/)
})

test('星团珠宝小天赋附魔存在多个国际服英文候选时，结合目录消歧而不是抛出歧义错误', () => {
  const hash = value => createHash('sha256').update(value).digest('hex')
  const clusterEntries = [
    baseEntry('Large Cluster Jewel', '大型星团珠宝'),
    {
      kind: 'dat',
      table: 'clientstrings',
      id: 'StatDescripotionTreeExpansionJewelGrantedSmallStat',
      field: 'Text',
      en: 'Added Small Passive Skills grant: {0}',
      cn: '增加的小天赋获得：{0}',
      tw: '附加的小天賦給予：{0}',
      sourceHash: hash('Added Small Passive Skills grant: {0}')
    },
    statEntry('Adds {0} Passive Skills', '增加 {0} 个天赋技能'),
    statEntry('{0} Added Passive Skills are Jewel Sockets', '其中 {0} 个增加的天赋为珠宝槽'),
    statEntry('Minions deal {0}% increased Damage', '召唤生物的伤害提高 {0}%'),
    {
      kind: 'stat',
      table: 'stat_descriptions',
      id: 'minion_damage_ambiguous_alt',
      field: 'variant:0',
      en: 'Minions have {0}% increased Damage',
      cn: '召唤生物的伤害提高 {0}%',
      tw: '召喚物伤害提高 {0}%'
    },
    statEntry('Added Small Passive Skills also grant: +{0} to Maximum Life', '增加的小天赋还获得：+{0} 最大生命'),
    statEntry('1 Added Passive Skill is Renewal', '其中 1 个增加的天赋为复兴'),
    statEntry('Added Small Passive Skills also grant: Minions have {0}% increased Attack and Cast Speed', '增加的小天赋还获得：召唤生物的攻击和施法速度加快 {0}%'),
    statEntry('Added Small Passive Skills also grant: +{0} to All Attributes', '增加的小天赋还获得：+{0} 所有属性')
  ]
  const clusterText = `物品类别: 珠宝
稀 有 度: 稀有
海怪光芒
大型星团珠宝
--------
需求:
等级: 54
--------
物品等级: 84
--------
增加 8 个天赋技能 (enchant)
其中 2 个增加的天赋为珠宝槽 (enchant)
增加的小天赋获得：召唤生物的伤害提高 10% (enchant)
--------
{ 前缀属性 "健壮的" (等阶：3)— 生命 }
增加的小天赋还获得：+3(2-3) 最大生命
{ 前缀属性 "显著的" (等阶：1)— 生命,傷害,召喚物 }
其中 1 个增加的天赋为复兴 — 数值不可调整
{ 后缀属性 "掠夺之" (等阶：3)— 攻擊,法術,速度,召喚物 }
增加的小天赋还获得：召唤生物的攻击和施法速度加快 1%
{ 后缀属性 "天空之" (等阶：2)— 能力 }
增加的小天赋还获得：+3 所有属性`

  const service = new PriceCheckService({
    catalog,
    manualInputOnly: true,
    auth: { getStatus: () => ({ authenticated: true }), registerCacheClearer() {} },
    client: {
      server: { id: 'international', label: '国际服' },
      search: async () => ({ id: 'fixture', total: 0, result: [] }),
      fetch: async () => ({ result: [] }),
      clearCache() {}
    },
    localizationProvider: () => clusterEntries,
    localizationRevisionProvider: () => 'cluster-enchant-ambiguity'
  })

  const model = service.parse(clusterText)
  assert.equal(model.identity.type, 'Large Cluster Jewel')
  assert.ok(model.stats.some(stat => stat.id === 'enchant.stat_3948993189|17'))
  assert.ok(model.stats.some(stat => stat.id === 'explicit.stat_3607300552'))
})

test('查价服务使用回退词库而不是仅活动映射', () => {
  const main = readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8')
  assert.match(main, /localizationProvider: \(\) => localization\.getPriceCheckEntries\(\)/)
  assert.match(main, /localizationRevisionProvider: \(\) => localization\.getPriceCheckRevision\(\)/)
})
})()

// === Merged from priceCheckPreview.test.js ===
await (async () => {
  const assert = _m2_assert
  const readFileSync = _m2_readFileSync
  const test = _m2_test
  const createPriceCheckPreview = _m2_createPriceCheckPreview
  const clearSelectionForStats = _m2_clearSelectionForStats
  const formatPropertyTooltip = _m2_formatPropertyTooltip
  const formatStatTooltip = _m2_formatStatTooltip
  const restoreAutoSelectionForStats = _m2_restoreAutoSelectionForStats
const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('查价预览样例固定覆盖名称、大类、属性、状态和词缀', () => {
  const preview = createPriceCheckPreview()

  assert.equal(preview.state.model.identity.name, '意志交锋')
  assert.equal(preview.state.model.identity.category, 'armour.helmet')
  assert.equal(preview.state.model.item.category, '头盔')
  assert.ok(preview.state.model.properties.length > 0)
  assert.ok(Object.hasOwn(preview.state.model.stateFilters, 'identified'))
  assert.ok(preview.state.model.stats.length > 0)
  assert.equal(preview.state.result, null)
})

test('查价预览每次创建深度独立状态和查询选项', () => {
  const first = createPriceCheckPreview()
  const second = createPriceCheckPreview()

  first.state.model.identity.nameEnabled = false
  first.state.model.properties[0].enabled = false
  first.state.model.stats[0].min = 1
  first.options.status = 'any'

  assert.equal(second.state.model.identity.nameEnabled, true)
  assert.equal(second.state.model.properties[0].enabled, true)
  assert.equal(second.state.model.stats[0].min, 82)
  assert.equal(second.options.status, 'available')
})

test('查价组件预览模式隔离生命周期与外部操作', () => {
  const view = source('src/domains/priceCheck/PriceCheckOverlayView.vue')

  assert.match(view, /const props = defineProps\([\s\S]*previewMode[\s\S]*previewState[\s\S]*previewOptions/)
  assert.match(view, /import \{[^}]*toRaw[^}]*\} from 'vue'/)
  assert.match(view, /function clonePreviewInput\(value\) \{\s*return value == null \? value : structuredClone\(toRaw\(value\)\)\s*\}/)
  assert.match(view, /const state = ref\(props\.previewMode \? clonePreviewInput\(props\.previewState\) : null\)/)
  assert.match(view, /props\.previewMode && props\.previewOptions \? clonePreviewInput\(props\.previewOptions\) : \{\}/)
  assert.match(view, /if \(props\.previewMode\) return[\s\S]*priceCheck\.updateSettings/)
  assert.match(view, /onMounted\(\(\) => \{\s*if \(props\.previewMode\) return/)
  assert.match(view, /function close\(\) \{\s*if \(props\.previewMode\) return/)
  assert.match(view, /function openOfficial\(\) \{\s*if \(props\.previewMode \|\| openingOfficial\.value\) return/)
  assert.match(view, /async function rerun\(\) \{\s*if \(props\.previewMode\) return/)
  assert.match(view, /async function loadMore\(\) \{\s*if \(props\.previewMode\) return/)
  assert.match(view, /async function retryCatalog\(\) \{\s*if \(props\.previewMode\) return/)
  assert.match(view, /async function resolveIdentity\(candidateKey\) \{\s*if \(props\.previewMode\) return/)
  assert.match(view, /async function selectStatCandidate\(unknown, candidate\) \{\s*if \(props\.previewMode\) return/)
  assert.match(view, /function copyWhisper\(text\) \{\s*if \(props\.previewMode\) return/)
})

test('查价预览保留本地交互并禁用搜索、网页市集和关闭', () => {
  const view = source('src/domains/priceCheck/PriceCheckOverlayView.vue')

  assert.match(view, /v-if="props\.previewMode" class="preview-badge">预览模式/)
  assert.match(view, /class="close-button"[\s\S]*:disabled="props\.previewMode"/)
  assert.match(view, /class="primary"[\s\S]*:disabled="props\.previewMode \|\| busy/)
  assert.match(view, /class="secondary"[\s\S]*:disabled="props\.previewMode \|\| state\.status !== 'ready' \|\| openingOfficial"/)
  assert.match(view, /\.overlay-shell\.preview \{[^}]*height: 640px;[^}]*min-height: 0;/)
  assert.match(view, /\.overlay-shell\.preview \.content \{ height: calc\(100% - 38px\);/)
  assert.match(view, /\.overlay-shell\.preview \.topbar \{[^}]*-webkit-app-region: no-drag;/)
  const filterListRule = view.match(/\.filter-list \{[^}]*\}/)?.[0] || ''
  const mercenaryRule = view.match(/\.mercenary-panel \{[^}]*\}/)?.[0] || ''
  assert.doesNotMatch(filterListRule, /max-height|overflow/)
  assert.doesNotMatch(mercenaryRule, /max-height|overflow/)
})

test('查价浮窗提供预选原因 tooltip 以及仅作用于当前物品的恢复自动与清空快捷操作', () => {
  const view = source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  assert.match(view, /@click="restoreAutoStats">恢复自动<\/button>/)
  assert.match(view, /@click="clearAllStats">清空<\/button>/)
  assert.match(view, /:title="propertyTooltip\(property\)"/)
  assert.match(view, /:title="statTooltip\(stat\)"/)

  const preview = createPriceCheckPreview()
  const [armour, es] = preview.state.model.properties
  assert.match(formatPropertyTooltip(armour), /护甲[\s\S]*自动预选：高护甲防具核心属性/)
  assert.match(formatPropertyTooltip(es), /能量护盾[\s\S]*未自动预选：未达到自动预选阈值/)

  const [life, fireRes] = preview.state.model.stats
  assert.match(formatStatTooltip(life), /自动预选：高数值总最大生命/)
  assert.match(formatStatTooltip(fireRes), /未自动预选：未达到该部位综合阈值/)

  clearSelectionForStats(preview.state.model.stats)
  assert.equal(life.enabled, false)
  assert.equal(fireRes.enabled, false)

  fireRes.enabled = true
  restoreAutoSelectionForStats(preview.state.model.stats)
  assert.equal(life.enabled, true)
  assert.equal(fireRes.enabled, false)
  assert.equal(preview.options.initialSelection, 'auto')
})
})()

// === Merged from priceCheckPseudoAndState.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const readFile = _m3_readFile
  const path = _m3_path
  const auditPseudoRules = _m3_auditPseudoRules
  const loadTradeCatalog = _m3_loadTradeCatalog
  const validateTradeCatalog = _m3_validateTradeCatalog
  const parseItemInfo = _m3_parseItemInfo
  const createPseudoStats = _m3_createPseudoStats
  const buildOfficialTradeQuery = _m3_buildOfficialTradeQuery
  const createPriceCheckModel = _m3_createPriceCheckModel
  const refreshPseudoStats = _m3_refreshPseudoStats
  const sanitizePriceCheckModel = _m3_sanitizePriceCheckModel
  const PRICE_CHECK_STATE_FILTERS = _m3_PRICE_CHECK_STATE_FILTERS
  const PRICE_CHECK_STAT_TYPES = _m3_PRICE_CHECK_STAT_TYPES
  const createPriceCheckStateFilters = _m3_createPriceCheckStateFilters
  const sanitizePriceCheckStateFilters = _m3_sanitizePriceCheckStateFilters
const catalogPath = path.resolve('electron/modules/priceCheck/catalog.json')
const bounds = (values) => {
  const value = Math.min(...values)
  return value < 0 ? { min: undefined, max: value } : { min: value, max: undefined }
}

test('状态白名单区分明确肯定、未鉴定否定和任意默认', () => {
  const facts = { identified: true, corrupted: false, mirrored: true, split: true }
  const created = createPriceCheckStateFilters(facts)
  assert.equal(created.identified, 'any')
  assert.equal(created.corrupted, 'any')
  assert.equal(created.mirrored, 'true')
  assert.equal(created.split, 'true')
  assert.equal(created.fractured, 'any')
  const sanitized = sanitizePriceCheckStateFilters({ ...created, corrupted: 'invalid', split: 'false', injected: 'true' }, facts)
  assert.equal(sanitized.corrupted, 'any')
  assert.equal(sanitized.split, 'false')
  assert.equal('injected' in sanitized, false)
  const unidentified = createPriceCheckStateFilters({ ...facts, identified: false })
  assert.equal(unidentified.identified, 'false')
  assert.equal(sanitizePriceCheckStateFilters({ identified: 'invalid' }, { identified: false }).identified, 'false')
})

test('秽生与已有状态事实解析为是且其余状态默认任意', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const item = parseItemInfo([
    '物品类别: 手套', '稀 有 度: 稀有', '测试手套', '术士手套', '--------',
    '物品等级: 86', '--------', '秽生物品', '忆境物品', '焚界者物品', '灭界者物品', '分裂之物', '已分裂', '已复制', '已腐化'
  ].join('\n'))
  const model = createPriceCheckModel(item, catalog, { initialSelection: 'none' })
  assert.equal(item.isMutated, true)
  assert.deepEqual(model.facts, {
    identified: true, corrupted: true, mirrored: true, fractured: true, split: true,
    mutated: true, synthesised: true, searing: true, tangled: true, crafted: false, veiled: false
  })
  assert.deepEqual(model.stateFilters, {
    identified: 'any', corrupted: 'any', mirrored: 'true', fractured: 'true', split: 'true',
    mutated: 'true', synthesised: 'true', searing: 'any', tangled: 'any', crafted: 'any', veiled: 'any'
  })
})

test('工艺和影匿词缀保留真实事实但状态过滤默认放宽为任意', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const model = createPriceCheckModel({
    category: '项链', rarity: '稀有', name: '测试', baseName: '瑚珀护身符',
    modifiers: [
      { type: 'crafted', text: '+10 最大生命' },
      { type: 'veiled', name: '艾尔雷恩的影匿', text: '影匿前缀' }
    ]
  }, catalog, { initialSelection: 'none' })
  assert.equal(model.facts.crafted, true)
  assert.equal(model.facts.veiled, true)
  assert.equal(model.stateFilters.crafted, 'any')
  assert.equal(model.stateFilters.veiled, 'any')
  assert.equal(model.stateFilters.identified, 'any')
})

test('复制文本明确包含未鉴定时已鉴定条件默认为否', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const item = parseItemInfo([
    '物品类别: 深渊珠宝', '稀 有 度: 稀有', '凶残之凝珠', '--------',
    '深渊', '--------', '物品等级: 85', '--------', '未鉴定'
  ].join('\n'))
  const model = createPriceCheckModel(item, catalog, { initialSelection: 'none' })
  assert.equal(model.facts.identified, false)
  assert.equal(model.stateFilters.identified, 'false')
  assert.equal(buildOfficialTradeQuery(model).query.filters.misc_filters.filters.identified.option, 'false')
})

test('所有非任意状态使用国服官方 misc_filters 字段并保持已鉴定正向语义', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const model = createPriceCheckModel({ category: '手套', rarity: '稀有', name: '测试', baseName: '术士手套' }, catalog, { initialSelection: 'none' })
  const defaults = buildOfficialTradeQuery(model).query.filters.misc_filters?.filters || {}
  for (const { officialKey } of PRICE_CHECK_STATE_FILTERS) assert.equal(defaults[officialKey], undefined, officialKey)
  model.stateFilters = Object.fromEntries(PRICE_CHECK_STATE_FILTERS.map(({ key }) => [key, 'true']))
  model.stateFilters.mirrored = 'any'
  const filters = buildOfficialTradeQuery(model).query.filters.misc_filters.filters
  for (const { key, officialKey } of PRICE_CHECK_STATE_FILTERS) {
    if (key === 'mirrored') assert.equal(filters[officialKey], undefined)
    else assert.equal(filters[officialKey].option, 'true', officialKey)
  }
  model.stateFilters.identified = 'false'
  assert.equal(buildOfficialTradeQuery(model).query.filters.misc_filters.filters.identified.option, 'false')
})

test('旧布尔模型迁移为三态并由可信事实阻止渲染层篡改事实', () => {
  const legacy = sanitizePriceCheckModel({
    item: { corrupted: true, unidentified: true, fractured: false },
    flags: { mirrored: true, split: false },
    identity: { type: '术士手套' }
  })
  assert.equal(legacy.facts.identified, false)
  assert.equal(legacy.stateFilters.corrupted, 'true')
  assert.equal(legacy.stateFilters.mirrored, 'true')
  assert.equal(legacy.stateFilters.identified, 'false')
  assert.equal(legacy.stateFilters.fractured, 'any')
  assert.equal(legacy.stateFilters.split, 'any')

  const edited = sanitizePriceCheckModel({
    ...legacy,
    facts: { ...legacy.facts, corrupted: false },
    stateFilters: { ...legacy.stateFilters, corrupted: 'invalid', split: 'false' }
  }, null, { ...legacy.facts, corrupted: true })
  assert.equal(edited.facts.corrupted, true)
  assert.equal(edited.stateFilters.corrupted, 'true')
  assert.equal(edited.stateFilters.split, 'false')
})

test('固定综合规则目录无缺口且综合跨来源汇总倍率、替换和恢复偷取', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const audit = auditPseudoRules(catalog)
  assert.equal(audit.usable, 35)
  assert.deepEqual(audit.missingTargets, [])
  assert.deepEqual(audit.missingSources, [])

  let sequence = 0
  const raw = (ref, value, type = 'explicit') => ({
    key: `raw-${sequence++}`,
    id: `${type}.stat_${900000 + sequence}`,
    type,
    refs: [ref],
    values: [value],
    text: ref.replace('#', String(value)),
    sources: [{ ref, refs: [ref], type, values: [value] }],
    enabled: true
  })
  const rawStats = [
    raw('+#% to All Resistances', 10, 'implicit'),
    raw('+#% to Fire and Cold Resistances', 20, 'crafted'),
    raw('+#% to Fire Resistance', 5, 'explicit'),
    raw('+# to maximum Life', 100, 'fractured'),
    raw('+# to all Attributes', 10, 'explicit'),
    raw('#% increased maximum Energy Shield', 30),
    raw('#% increased Attack Speed', 12),
    raw('#% increased Cast Speed', 14),
    raw('#% increased Elemental Damage', 10),
    raw('#% increased Fire Damage', 20),
    raw('#% increased Burning Damage', 30),
    raw('#% increased Spell Damage', 15),
    raw('#% increased Fire Spell Damage', 25),
    raw('#% increased Global Critical Strike Chance', 40),
    raw('#% increased Spell Critical Strike Chance', 50),
    raw('Regenerate # Life per second', 8),
    raw('#% of Physical Attack Damage Leeched as Life', 1.2),
    raw('#% increased Mana Regeneration Rate', 35)
  ]
  const result = createPseudoStats(rawStats, catalog, { initialSelection: 'auto' }, bounds)
  const byId = new Map(result.stats.map((stat) => [stat.id, stat]))
  assert.equal(byId.get('pseudo.pseudo_total_elemental_resistance').values[0], 75)
  assert.equal(byId.get('pseudo.pseudo_total_fire_resistance').values[0], 35)
  assert.equal(byId.get('pseudo.pseudo_total_life').values[0], 105)
  assert.equal(byId.get('pseudo.pseudo_increased_energy_shield').values[0], 30)
  assert.equal(byId.get('pseudo.pseudo_total_attack_speed').values[0], 12)
  assert.equal(byId.get('pseudo.pseudo_total_cast_speed').values[0], 14)
  assert.equal(byId.get('pseudo.pseudo_increased_burning_damage').values[0], 60)
  assert.equal(byId.has('pseudo.pseudo_increased_fire_damage'), false)
  assert.equal(byId.get('pseudo.pseudo_increased_fire_spell_damage').values[0], 40)
  assert.equal(byId.has('pseudo.pseudo_increased_spell_damage'), false)
  assert.equal(byId.get('pseudo.pseudo_critical_strike_chance_for_spells').values[0], 90)
  assert.equal(byId.get('pseudo.pseudo_total_life_regen').values[0], 8)
  assert.equal(byId.get('pseudo.pseudo_physical_attack_damage_leeched_as_life').values[0], 1.2)
  assert.equal(byId.get('pseudo.pseudo_increased_mana_regen').values[0], 35)
  assert.equal(byId.get('pseudo.pseudo_total_life').min, 105)
  assert.equal(byId.get('pseudo.pseudo_total_life').max, undefined)
  assert.ok(byId.get('pseudo.pseudo_total_elemental_resistance').sources.some(({ type }) => type === 'crafted'))
})

test('目录 schema 拒绝重复 ref 和重复综合规则身份', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const duplicatedRef = structuredClone(catalog)
  const entry = duplicatedRef.stats.find((candidate) => candidate.refs?.length)
  entry.refs.push(entry.refs[0])
  assert.throws(() => validateTradeCatalog(duplicatedRef), /稳定 ref 重复/)

  const duplicatedRule = structuredClone(catalog)
  duplicatedRule.pseudoRules.push(structuredClone(duplicatedRule.pseudoRules[0]))
  assert.throws(() => validateTradeCatalog(duplicatedRule), /重复综合规则目标/)
})

test('综合项达到阈值后使用真实 pseudo ID 进入官方查询并吸收普通来源，同时保护高价值分裂词缀', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const model = createPriceCheckModel({
    category: '胸甲', rarity: '稀有', name: '测试', baseName: '龙鳞胸甲',
    modifiers: [
      { type: 'prefix', tier: 1, text: '+96 最大生命' },
      { type: 'suffix', tier: 1, text: '+45% 火焰抗性' },
      { type: 'crafted', text: '+35% 冰霜抗性' }
    ]
  }, catalog, { initialSelection: 'auto' })
  const body = buildOfficialTradeQuery(model)
  const ids = body.query.stats[0].filters.map(({ id }) => id)
  assert.ok(ids.includes('pseudo.pseudo_total_life'))
  assert.ok(ids.includes('pseudo.pseudo_total_elemental_resistance'))
  assert.ok(ids.every((id) => id.startsWith('pseudo.')))
  assert.equal(model.stats.find((stat) => stat.id === 'explicit.stat_3299347043').enabled, false)
  assert.equal(model.stats.find((stat) => stat.id.startsWith('crafted.')).enabled, false)

  const fracturedModel = createPriceCheckModel({
    category: '胸甲', rarity: '稀有', name: '测试', baseName: '龙鳞胸甲',
    modifiers: [
      { type: 'fractured', tier: 1, text: '+96 最大生命' },
      { type: 'crafted', text: '+35% 火焰抗性' }
    ]
  }, catalog, { initialSelection: 'auto' })
  assert.equal(fracturedModel.stats.find((stat) => stat.id.startsWith('fractured.')).enabled, true)
  assert.equal(fracturedModel.stats.find((stat) => stat.id === 'pseudo.pseudo_total_life').enabled, false)
  assert.equal(fracturedModel.stats.find((stat) => stat.id === 'pseudo.pseudo_total_elemental_resistance').enabled, false)
})

test('手动消歧加入新来源后会沿统一链路重算综合项', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const model = createPriceCheckModel({ category: '胸甲', rarity: '稀有', name: '测试', baseName: '龙鳞胸甲' }, catalog, { initialSelection: 'auto' })
  model.stats.push({
    key: 'explicit:manual-life', id: 'explicit.stat_3299347043', type: 'explicit',
    text: '+100 最大生命', refs: ['+# to maximum Life'], values: [100], enabled: true,
    sources: [{ key: 'explicit:manual-life', type: 'explicit', ref: '+# to maximum Life', refs: ['+# to maximum Life'], values: [100] }]
  })
  refreshPseudoStats(model, catalog, { initialSelection: 'auto' })
  assert.ok(model.stats.some((stat) => stat.id === 'pseudo.pseudo_total_life' && stat.enabled))
  assert.equal(model.stats.find((stat) => stat.id === 'explicit.stat_3299347043').enabled, false)
})

test('综合目标缺失时安全省略，伪造的 namespace 不能通过模型清理', async () => {
  const { catalog } = await loadTradeCatalog(catalogPath)
  const missing = structuredClone(catalog)
  missing.stats = missing.stats.filter((entry) => entry.ids?.pseudo !== 'pseudo.pseudo_total_life')
  const result = createPseudoStats([{ key: 'life', id: 'explicit.stat_1', type: 'explicit', refs: ['+# to maximum Life'], values: [100] }], missing, { initialSelection: 'auto' }, bounds)
  assert.equal(result.stats.some((stat) => stat.id === 'pseudo.pseudo_total_life'), false)

  const sanitized = sanitizePriceCheckModel({
    item: {}, identity: { type: '龙鳞胸甲' },
    stats: [
      { id: 'explicit.pseudo_total_life', type: 'pseudo', enabled: true },
      { id: 'pseudo.pseudo_total_life', type: 'pseudo', enabled: true }
    ]
  }, catalog)
  assert.deepEqual(sanitized.stats.map(({ id }) => id), ['pseudo.pseudo_total_life'])
})

test('全部官方 stat 类型都有稳定中文来源标签', () => {
  for (const type of ['pseudo', 'explicit', 'implicit', 'enchant', 'fractured', 'crafted', 'veiled', 'scourge', 'imbued', 'delve', 'sanctum', 'mercenary', 'crucible', 'ultimatum']) {
    assert.ok(PRICE_CHECK_STAT_TYPES[type]?.label, type)
    assert.ok(PRICE_CHECK_STAT_TYPES[type]?.token, type)
  }
})
})()

// === Merged from priceCheckQueryId.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const fileURLToPath = _m4_fileURLToPath
  const PoeCnTradeClient = _m4_PoeCnTradeClient
  const PriceCheckService = _m4_PriceCheckService
  const loadTradeCatalog = _m4_loadTradeCatalog
const longId = `H4sIAAAA${'query-opaque_'.repeat(30)}AQAA`
const json = value => ({ ok: true, status: 200, text: async () => JSON.stringify(value) })
const incompatible = error => error.code === 'API_INCOMPATIBLE'
// Borrowed methods still run the real resource-revision guard, with explicit server context.
const officialContext = value => ({ client: { server: { id: 'cn' } }, syncLocalizationRevision: PriceCheckService.prototype.syncLocalizationRevision, ...value })

test('查询编号在搜索、首批、翻页、分布和网页 URL 中保真', async () => {
  const { catalog, status } = await loadTradeCatalog(fileURLToPath(new URL('../electron/modules/priceCheck/catalog.json', import.meta.url)))
  for (const queryId of ['queryABC123', 'query-ABC123', 'query_ABC123', longId, 'a/b?c=d&x=+%#片段']) {
    const requests = [], opened = [], actions = []
    const ids = Array.from({ length: 25 }, (_, i) => `item${i}`)
    const client = new PoeCnTradeClient({ session: { fetch: async url => {
      requests.push(url)
      if (url.includes('/search/')) return json({ id: queryId, total: 25, result: ids })
      const batch = new URL(url).pathname.split('/').at(-1).split(',')
      return json({ result: batch.map(id => ({ id, item: { ilvl: 83 }, listing: { price: { amount: 1, currency: 'chaos' } } })) })
    } } })
    const service = new PriceCheckService({
      auth: { getStatus: () => ({ authenticated: true }), registerCacheClearer() {} },
      client, catalog, catalogStatus: status, distributionWait: async () => {},
      overlay: { create() {}, update() {}, preserveForExternalAction() { actions.push('preserve') }, close() { actions.push('close') } },
      shell: { openExternal: async url => { opened.push(url); actions.push('open') } }
    })
    service.updateRuntime({ enabled: true })
    await service.check({ league: 'S30赛季', text: '物品类别: 通货\n稀 有 度: 普通\n混沌石' })
    assert.equal(service.latest.result.listings.length, 10)
    await service.loadMore()
    assert.equal(service.latest.result.listings.length, 20)
    await service.loadDistribution()
    assert.equal(service.latest.result.distribution.fetched, 25)
    assert.equal(service.latest.result.distribution.complete, true)
    assert.equal(service.latest.result.queryId, queryId)
    assert.equal(requests.length, 4)
    for (const url of requests.slice(1)) {
      assert.equal(new URL(url).searchParams.get('query'), queryId)
      assert.equal(new URL(url).origin, 'https://poe.game.qq.com')
    }
    await service.openOfficial()
    assert.equal(opened[0], `https://poe.game.qq.com/trade/search/${encodeURIComponent('S30赛季')}/${encodeURIComponent(queryId)}`)
    assert.deepEqual(actions, ['preserve', 'open', 'close'])
  }
})

test('缺失或非法编号在搜索、fetch 和跳转中报错，不伪造空结果', async () => {
  for (const id of [undefined, null, '', '   ', 42, {}, '\uD800']) {
    let calls = 0
    const client = new PoeCnTradeClient({ session: { fetch: async () => { calls++; return json({ id, result: [] }) } } })
    await assert.rejects(client.search('S30', {}), incompatible)
    await assert.rejects(client.search('S30', {}), incompatible)
    assert.equal(calls, 2, '非法搜索响应不应缓存')
    await assert.rejects(client.fetch(id, ['abc']), incompatible)
    assert.equal(calls, 2, '非法编号不应发送挂单请求')
    await assert.rejects(PriceCheckService.prototype.openOfficial.call(officialContext({ assertEnabled() {}, latest: { result: { queryId: id } } })), incompatible)
  }
})

test('非法结果结构或挂单 ID 显式报错，空数组不发送请求', async () => {
  for (const result of [null, undefined, true, 12, 'ids']) {
    const client = new PoeCnTradeClient({ session: { fetch: async () => json({ id: longId, result }) } })
    await assert.rejects(client.search('S30', {}), incompatible)
  }
  let calls = 0
  const client = new PoeCnTradeClient({ session: { fetch: async () => { calls++; return json({ result: {} }) } } })
  for (const ids of [null, 'abc', ['abc', 'bad-id'], [123]]) await assert.rejects(client.fetch(longId, ids), incompatible)
  assert.deepEqual(await client.fetch(longId, []), { result: [] })
  assert.equal(calls, 0)
  await assert.rejects(client.fetch(longId, ['abc']), incompatible)
})

test('真实零结果和对象结果兼容，打开浏览器失败不关闭浮窗', async () => {
  for (const result of [[], {}]) {
    const client = new PoeCnTradeClient({ session: { fetch: async () => json({ id: longId, total: 0, result }) } })
    assert.deepEqual((await client.search('S30', {})).result, result)
  }
  let closed = false
  await assert.rejects(PriceCheckService.prototype.openOfficial.call(officialContext({
    assertEnabled() {}, latest: { league: 'S30', result: { queryId: longId } },
    shell: { openExternal: async () => { throw new Error('browser unavailable') } },
    closeOverlay() { closed = true }
  })), /browser unavailable/)
  assert.equal(closed, false)
})
})()

// === Merged from priceCheckRealItems.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const loadTradeCatalog = _m5_loadTradeCatalog
  const createOfficialTradeCatalog = _m5_createOfficialTradeCatalog
  const parseItemInfo = _m5_parseItemInfo
  const createPriceCheckModel = _m5_createPriceCheckModel
  const buildOfficialTradeQuery = _m5_buildOfficialTradeQuery
  const sanitizePriceCheckModel = _m5_sanitizePriceCheckModel
  const refreshPseudoStats = _m5_refreshPseudoStats
  const samples = _m5_samples
  const PriceCheckService = _m5_PriceCheckService
const { catalog } = await loadTradeCatalog()
const model = (text, options = {}) => createPriceCheckModel(parseItemInfo(text), catalog, options)
const recheck = (submitted, trusted) => sanitizePriceCheckModel(submitted, catalog, trusted.facts, trusted.item.category, trusted)

test('真实宝石保留变体、等级 1，需求与描述不是词缀', () => {
  const m = model(samples.gem)
  assert.equal(m.item.gemLevel, 1)
  assert.deepEqual(m.unknownStats, [])
  assert.deepEqual(m.stats, [])
  m.properties.find(p => p.id === 'misc.gemLevel').enabled = true
  const q = buildOfficialTradeQuery(recheck(m, m)).query
  assert.deepEqual(q.type, { discriminator: 'alt_x', option: '爆裂箭雨' })
  assert.equal(q.filters.misc_filters.filters.gem_level.min, 1)
  const forged = structuredClone(m)
  forged.item.category = '头部'
  assert.equal(sanitizePriceCheckModel(forged, catalog).identity.discriminator, undefined)
  const normal = model(samples.gem.replace('特拉特斯之爆裂箭雨', '爆裂箭雨').replace('## 改造', ''))
  assert.equal(buildOfficialTradeQuery(normal).query.type, '爆裂箭雨')
  assert.throws(() => model(samples.gem.replace('特拉特斯之爆裂箭雨', '不存在之宝石')), /特殊物品/)
})

test('两种真实菌潮地图身份和区域经可信校验不丢失', () => {
  for (const [text, discriminator, option, tier] of [
    [samples.blighted, 'blighted', '53902', 13],
    [samples.uberBlighted, 'uberblighted', '11490', 16]
  ]) {
    const m = model(text)
    const submitted = structuredClone(m)
    submitted.identity.type = '伪造底材'
    submitted.identity.discriminator = 'chart'
    const q = buildOfficialTradeQuery(recheck(submitted, m)).query
    assert.deepEqual(q.type, { discriminator, option })
    assert.deepEqual(q.filters.map_filters.filters.map_tier, { min: tier, max: tier })
    assert.throws(() => model(text.replace(/地图区域: .+/, '地图区域: 未知区域')), /特殊物品/)
  }
})

test('日志平铺合并为 63，区域派系去重且保留来源，重算和重查稳定', () => {
  const parsed = parseItemInfo(samples.logbook)
  assert.equal(parsed.logbookRegions.length, 3)
  const m = model(samples.logbook)
  assert.deepEqual(m.unknownStats, [])
  assert.equal(m.stats.filter(s => s.type === 'implicit').length, 5)
  assert.equal(m.stats.filter(s => s.type === 'pseudo').length, 4)
  assert.ok(m.stats.every(s => s.enabled))
  const merged = m.stats.find(s => s.id === 'implicit.stat_1915989164')
  assert.equal(merged.min, 63)
  assert.match(merged.text, /63%/)
  assert.equal(merged.max, undefined)
  assert.equal(merged.sources.length, 2)
  assert.match(merged.sources[0].text, /森林废墟.*33\(10-40\)/)
  assert.match(merged.sources[1].text, /船骸礁岩.*30\(10-40\)/)
  assert.deepEqual(m.stats.filter(s => s.type === 'implicit').map(s => s.min).sort((a,b)=>a-b), [19,28,37,38,63])
  const property = m.properties.find(p => p.id === 'misc.itemLevel')
  assert.equal(property.enabled, true)
  assert.equal(property.min, 83)
  assert.equal(property.max, undefined)
  const area = m.stats.find(s => /area_scrublands$/.test(s.id))
  area.enabled = false
  refreshPseudoStats(m, catalog)
  const q = buildOfficialTradeQuery(recheck(m, m)).query
  assert.equal(q.stats.flatMap(g=>g.filters).length, 8)
  assert.ok(!q.stats.flatMap(g=>g.filters).some(s => s.id === area.id))
  const none = model(samples.logbook, { initialSelection: 'none' })
  assert.ok(none.stats.every(s => !s.enabled))
  assert.ok(none.properties.every(p => !p.enabled))
  assert.equal(buildOfficialTradeQuery(none).query.stats[0].filters.length, 0)
  const missing = model(samples.logbook.replace('灌木之地', '未知地区'))
  assert.ok(missing.unknownStats.some(s => s.text.includes('未知地区')))
})

test('赏金猎人三件装备映射正确且不误报说明', () => {
  for (const [text, type, category, count] of [
    [samples.tool, '基础易容工具', 'heistequipment.heisttool', 2],
    [samples.cloak, '破旧披风', 'heistequipment.heistutility', 4],
    [samples.brooch, '珐琅胸针', 'heistequipment.heistreward', 4]
  ]) {
    const m = model(text, { initialSelection: 'all' })
    assert.equal(m.identity.type, type)
    assert.equal(m.identity.category, category)
    assert.deepEqual(m.unknownStats, [])
    assert.equal(m.stats.filter(s => s.type !== 'pseudo').length, count)
    assert.equal(buildOfficialTradeQuery(m).query.type, type)
  }
})

test('赏金猎人费用减免提交负向上限，目录刷新及取消勾选保持正确', () => {
  const payload = { result: [{ id: 'explicit', entries: catalog.stats
    .filter(e => typeof e.ids.explicit === 'string')
    .map(e => ({ id: e.ids.explicit, type: 'explicit', text: e.matchers[0] })) }] }
  const refreshed = createOfficialTradeCatalog(catalog, payload).catalog
  for (const current of [catalog, refreshed]) {
    for (const [text, id, amount] of [
      [samples.tool, 'explicit.stat_2257592286', 7],
      [samples.brooch, 'explicit.stat_2257592286', 10],
      [samples.cloak, 'explicit.stat_2904116257', 9],
      [samples.tool.replace('招募费用减少', '赏金猎人招募费用降低'), 'explicit.stat_2257592286', 7]
    ]) {
      const m = createPriceCheckModel(parseItemInfo(text), current, { initialSelection: 'all' })
      const fee = m.stats.find(s => s.id === id)
      assert.equal(fee.valueMultiplier, -1)
      // Reproduce the screenshot: the reduction amount is entered as a minimum.
      fee.min = amount
      fee.max = undefined
      const filters = () => buildOfficialTradeQuery(sanitizePriceCheckModel(m, current, m.facts, m.item.category, m)).query.stats.flatMap(g => g.filters)
      assert.deepEqual(JSON.parse(JSON.stringify(filters().find(s => s.id === id).value)), { max: -amount })
      fee.enabled = false
      assert.ok(!filters().some(s => s.id === id))
    }
  }
})

test('赏金猎人速度、掉落和经验正负描述使用同一官方项的相反数值', () => {
  for (const [positive, negative, id] of [
    ['任务速度加快', '任务速度减慢', '2978905446'],
    ['夺宝冒险中掉落的物品稀有度提高', '夺宝冒险中掉落的物品稀有度降低', '2833896424'],
    ['夺宝冒险中掉落的物品数量提高', '夺宝冒险中掉落的物品数量降低', '3683643898'],
    ['任务经验获取率提高', '任务经验获取率降低', '3569230441']
  ]) {
    for (const [label, negativeDirection] of [[positive, false], [negative, true]]) {
      const text = `物品类别: 赏金猎人披风\n稀 有 度: 稀有\n符纹 道具\n破旧披风\n--------\n{ 后缀属性 }\n${label} 15%`
      const m = model(text, { initialSelection: 'all' })
      const stat = m.stats.find(s => s.id === `explicit.stat_${id}`)
      assert.ok(stat)
      stat.min = 15
      stat.max = undefined
      const q = buildOfficialTradeQuery(recheck(m, m)).query
      assert.equal(q.type, '破旧披风')
      assert.deepEqual(JSON.parse(JSON.stringify(q.stats[0].filters[0].value)), negativeDirection ? { max: -15 } : { min: 15 })
    }
  }
})

test('真实硫磺喷灯的任务速度和工程学速度是独立过滤项', () => {
  const m = model(samples.sulphurBlowtorch, { initialSelection: 'none' })
  assert.deepEqual(m.unknownStats, [])
  const speed = m.stats.find(s => s.id === 'explicit.stat_2978905446')
  assert.ok(speed)
  speed.enabled = true
  const q = buildOfficialTradeQuery(recheck(m, m)).query
  assert.equal(q.type, '硫磺喷灯')
  assert.deepEqual(JSON.parse(JSON.stringify(q.stats[0].filters)), [{ id: 'explicit.stat_2978905446', value: { min: 15 }, disabled: false }])
  assert.ok(m.stats.some(s => s.id === 'implicit.stat_3211817426' && s.min === 11))
  assert.ok(!m.stats.some(s => s.id === 'explicit.stat_3211817426'))
  speed.enabled = false
  assert.equal(buildOfficialTradeQuery(recheck(m, m)).query.stats[0].filters.length, 0)
})

test('退化传奇需明确同意后才按名称查询且可信限制无法删除', () => {
  const m = model(samples.vestigial)
  assert.equal(m.stats.length, 6)
  assert.deepEqual(m.unknownStats, [])
  assert.throws(() => buildOfficialTradeQuery(m), /退化版本/)
  const tampered = structuredClone(m)
  delete tampered.identityPrecision
  tampered.identity.type = '黄金之面'
  assert.throws(() => buildOfficialTradeQuery(recheck(tampered, m)), /退化版本/)
  m.identityPrecision.allowNameOnly = true
  const q = buildOfficialTradeQuery(recheck(m, m)).query
  assert.equal(q.name, '意志交锋')
  assert.equal(q.type, undefined)
  assert.equal(q.filters.misc_filters.filters.corrupted.option, 'true')
})

test('实际服务重查保留特殊身份、日志勾选与退化确认', async () => {
  const requests = []
  const states = []
  const service = new PriceCheckService({
    catalog,
    auth: { getStatus: () => ({ authenticated: true }), registerCacheClearer() {} },
    client: {
      clearCache() {},
      search: async (_league, body) => { requests.push(body); return { id: 'test', total: 0, result: [] } },
      fetch: async () => ({ result: [] })
    },
    overlay: { create: (state) => states.push(state), update: (state) => states.push(state) }
  })
  service.updateRuntime({ enabled: true })
  await service.check({ text: samples.vestigial, league: '测试赛季' })
  assert.equal(requests.length, 0)
  assert.equal(states.at(-1).status, 'ready-to-query')
  await service.rerun()
  assert.equal(requests.length, 0)
  const confirmed = structuredClone(service.latest.model)
  confirmed.identityPrecision.allowNameOnly = true
  await service.rerun({ model: confirmed })
  assert.equal(requests.length, 1)
  assert.equal(requests.at(-1).query.type, undefined)
  assert.equal(requests.at(-1).query.name, '意志交锋')
  for (const [text, expected] of [[samples.gem, 'alt_x'], [samples.blighted, 'blighted'], [samples.uberBlighted, 'uberblighted']]) {
    await service.check({ text, league: '测试赛季', execute: false })
    await service.rerun()
    assert.equal(requests.at(-1).query.type.discriminator, expected)
  }
  await service.check({ text: samples.logbook, league: '测试赛季', execute: false })
  const edited = structuredClone(service.latest.model)
  edited.stats.find(s => /area_scrublands$/.test(s.id)).enabled = false
  await service.rerun({ model: edited })
  assert.equal(requests.at(-1).query.stats.flatMap(g => g.filters).length, 8)
  assert.equal(service.latest.model.stats.find(s => s.id === 'implicit.stat_1915989164').sources.length, 2)
  service.updateRuntime({ enabled: false })
})
})()

// === Merged from priceCheckStartupSpeed.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const EventEmitter = _m6_EventEmitter
  const readFileSync = _m6_readFileSync
  const captureFreshClipboardText = _m6_captureFreshClipboardText
  const WindowsClipboardInputHelper = _m6_WindowsClipboardInputHelper
  const loadTradeCatalog = _m6_loadTradeCatalog
  const resolveCatalogStat = _m6_resolveCatalogStat
  const warmTradeCatalogIndexes = _m6_warmTradeCatalogIndexes
  const PriceCheckService = _m6_PriceCheckService
  const CHAOS_ERROR_CODES = _m6_CHAOS_ERROR_CODES
function fakeHelperProcess(onRequest) {
  const child = new EventEmitter()
  child.killed = false
  child.stdout = new EventEmitter()
  child.stdin = {
    destroyed: false,
    written: [],
    write(chunk) {
      this.written.push(String(chunk))
      for (const line of String(chunk).split(/\r?\n/).filter(Boolean)) {
        const req = JSON.parse(line)
        if (req.action === 'quit') return
        const reply = onRequest(req)
        queueMicrotask(() => child.stdout.emit('data', `${JSON.stringify({ id: req.id, ...reply })}\n`))
      }
    },
    end() { this.destroyed = true }
  }
  child.kill = () => { child.killed = true }
  return child
}

test('常驻复制助手复用同一子进程完成前台校验与复制，并映射退出码', async () => {
  let spawns = 0
  let mode = 'ok'
  const actions = []
  const helper = new WindowsClipboardInputHelper({
    platform: 'win32',
    spawnImpl: () => {
      spawns += 1
      return fakeHelperProcess((req) => {
        actions.push(req.action)
        if (mode === 'not-foreground') return { ok: false, code: 23 }
        if (mode === 'elevated') return { ok: false, code: 24 }
        return { ok: true, code: 0 }
      })
    }
  })

  assert.equal(helper.warm('python.exe'), true)
  await helper.request('python.exe', 'check')
  await helper.request('python.exe', 'copy')
  assert.equal(spawns, 1, '热态下重复检查与复制不应再次冷启动 Python 进程')
  assert.deepEqual(actions, ['check', 'copy'])

  mode = 'not-foreground'
  await assert.rejects(helper.request('python.exe', 'check'), { code: CHAOS_ERROR_CODES.GAME_NOT_FOREGROUND })
  mode = 'elevated'
  await assert.rejects(helper.request('python.exe', 'copy'), /管理员权限/)
  helper.dispose()
  assert.equal(helper.isRunningFor('python.exe'), false)
})

test('剪贴板捕获默认零延迟立即发送复制，并支持可选超时重试', async () => {
  let value = '原剪贴板'
  let sends = 0
  const clipboard = {
    readText: () => value,
    writeText: (next) => { value = next }
  }
  const captured = await captureFreshClipboardText({
    clipboard,
    pollMs: 2,
    timeoutMs: 300,
    retryCopyAfterMs: 10,
    sendCopy: async () => {
      sends += 1
      if (sends === 2) value = '物品类别: 通货\n稀 有 度: 普通\n混沌石'
    }
  })
  assert.equal(sends, 2)
  assert.match(captured, /混沌石/)
  assert.equal(value, '原剪贴板')
})

test('快捷键预捕获在未登录、未选赛季、已超时或关闭浮窗时安全跳过或丢弃', async () => {
  let captures = 0
  let now = 1000
  const authState = { authenticated: false }
  const service = new PriceCheckService({
    auth: { getStatus: () => authState },
    client: { clearCache() {} },
    now: () => now,
    captureClipboard: async () => {
      captures += 1
      return '物品类别: 通货\n稀 有 度: 普通\n混沌石\n--------'
    }
  })

  service.updateRuntime({ enabled: true, league: 'S30' })
  assert.equal(service.beginHotkeyCapture(), false, '未登录时不提前触发复制')
  assert.equal(captures, 0)

  authState.authenticated = true
  service.updateRuntime({ enabled: true, league: '' })
  assert.equal(service.beginHotkeyCapture(), false, '未选择赛季时不提前触发复制')
  assert.equal(captures, 0)

  service.updateRuntime({ enabled: true, league: 'S30' })
  assert.equal(service.beginHotkeyCapture(), true)
  assert.equal(captures, 1)

  now += 4000
  assert.equal(service.consumePendingHotkeyCapture(), null, '过期的预捕获结果不得被复用')

  assert.equal(service.beginHotkeyCapture(), true)
  assert.equal(captures, 2)
  service.closeOverlay()
  assert.equal(service.consumePendingHotkeyCapture(), null, '关闭浮窗应丢弃未消费的预捕获')
})

test('启用查价器时后台预热目录索引与复制助手，禁用时清理复制助手', async () => {
  const { catalog, status } = await loadTradeCatalog()
  let warmed = 0
  let disposed = 0
  const service = new PriceCheckService({
    auth: { getStatus: () => ({ authenticated: true }) },
    client: { clearCache() {} },
    catalog,
    catalogStatus: status,
    warmClipboardCapture: () => { warmed += 1 },
    disposeClipboardCapture: () => { disposed += 1 }
  })

  assert.equal(warmTradeCatalogIndexes(catalog), true)
  const startedAt = performance.now()
  resolveCatalogStat(catalog, '+96 最大生命', 'explicit')
  const elapsedMs = performance.now() - startedAt
  assert.ok(elapsedMs < 50, `预热后首次词缀解析应很快，实际 ${elapsedMs.toFixed(1)}ms`)

  service.updateRuntime({ enabled: true, league: 'S30' })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(warmed, 1)

  service.updateRuntime({ enabled: false })
  assert.equal(disposed, 1)
})

test('独立浮窗入口延迟加载主窗口外壳且非预览查价浮窗不初始化完整设置仓库', () => {
  const appVue = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
  const overlayView = readFileSync(new URL('../src/domains/priceCheck/PriceCheckOverlayView.vue', import.meta.url), 'utf8')
  const ipcIndex = readFileSync(new URL('../electron/modules/ipc/index.js', import.meta.url), 'utf8')

  assert.match(appVue, /const MainLayout = defineAsyncComponent\(\(\) => import\('\.\/components\/Layout\/MainLayout\.vue'\)\)/)
  assert.match(appVue, /const TitleBar = defineAsyncComponent\(\(\) => import\('\.\/components\/Layout\/TitleBar\.vue'\)\)/)
  assert.match(overlayView, /const appSettings = props\.previewMode \? useSettingsStore\(\) : null/)
  assert.doesNotMatch(overlayView, /查价器已启动，请稍候/)
  assert.match(ipcIndex, /if \(key === 'priceCheck'\) priceCheck\?\.beginHotkeyCapture\?\.\(\)/)
})
})()

// === Merged from priceCheckTinctures.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const readFile = _m7_readFile
  const createHash = _m7_createHash
  const createLocalizationTextResolver = _m7_createLocalizationTextResolver
  const PriceCheckService = _m7_PriceCheckService
  const userAshbarkTincture = _m7_userAshbarkTincture
const entries = JSON.parse(await readFile(new URL('./fixtures/price-check-tincture-entries.json', import.meta.url)))
const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)))
const structures = entries.filter(entry => entry.table === 'clientstrings' && /^ItemDisplayTincture/.test(entry.id))
const base = entries.find(entry => entry.table === 'baseitemtypes')
const itemClass = entries.find(entry => entry.table === 'itemclasses')

function fixture(dictionary = entries) {
  const searches = []
  const service = new PriceCheckService({ catalog, localizationProvider: () => dictionary, manualInputOnly: true,
    auth: { getStatus: () => ({ authenticated: true }) },
    client: { server: { id: 'international' }, clearCache() {},
      async search(league, query) { searches.push(query); return { id: 'tincture', total: 0, result: [] } },
      async fetch() { return { result: [] } } }
  })
  return { service, searches }
}

function structuralText(row, value, language) {
  const prefix = language === 'en' ? 'Item Class' : language === 'tw' ? '物品種類' : '物品类别'
  const rarity = language === 'en' ? 'Rarity: Normal' : '稀有度: 普通'
  const level = language === 'en' ? 'Item Level: 73' : language === 'tw' ? '物品等級: 73' : '物品等级: 73'
  return `${prefix}: ${itemClass[language]}\n${rarity}\n${base[language]}\n--------\n${row[language].replace('{0}', value)}\n--------\n${level}`
}

test('用户完整烬皮酊剂保留点燃几率、伤害和击败回复生命三个真实词缀', async () => {
  const { service, searches } = fixture()
  const { model } = await service.check({ text: userAshbarkTincture, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(model.identity.type, 'Ashbark Tincture')
  assert.equal(model.item.category, '酊剂')
  assert.deepEqual(model.unknownStats, [])
  assert.equal(model.stats.length, 3)
  assert.equal(searches[0].query.type, 'Ashbark Tincture')
  assert.equal(searches[0].query.filters.type_filters.filters.category.option, 'tincture')
  const filters = searches[0].query.stats.flatMap(group => group.filters)
  for (const [id, value] of [['implicit.stat_4206255461', 25], ['implicit.stat_3935936274', 86], ['explicit.stat_2507321875', 14]]) {
    const stat = model.stats.find(stat => stat.id === id)
    assert.ok(stat, id)
    assert.deepEqual(stat.values, [value])
    assert.equal(filters.find(filter => filter.id === id).value.min, value)
  }
  assert.match(model.stats.find(stat => stat.id === 'implicit.stat_3935936274').displayText, /86\(60-90\)%/)
  assert.match(model.stats.find(stat => stat.id === 'explicit.stat_2507321875').displayText, /14\(11-15\)/)
  await service.rerun({ model })
  assert.deepEqual(JSON.parse(JSON.stringify(searches[1])), JSON.parse(JSON.stringify(searches[0])))
})

test('酊剂四个真实结构模板在英简繁下保留秒数、单复数和增幅标记', async () => {
  assert.equal(structures.length, 4)
  assert.ok(entries.every(entry => entry.sourceHash === createHash('sha256').update(entry.en).digest('hex')))
  const resolver = createLocalizationTextResolver(entries)
  for (const row of structures) {
    const values = row.id.endsWith('1Second') ? ['1'] : ['0.60', '7', '2.20 (augmented)']
    for (const value of values) for (const language of ['en', 'cn', 'tw']) {
      const text = structuralText(row, value, language)
      assert.ok(resolver.resolve(text, { catalog }).text.includes(row.en.replace('{0}', value)), `${row.id}/${value}/${language}`)
      const { service, searches } = fixture()
      const { model } = await service.check({ text, league: 'Covens' })
      assert.equal(searches[0].query.type, 'Ashbark Tincture')
      assert.equal(searches[0].query.filters.type_filters.filters.category.option, 'tincture')
      assert.deepEqual(model.stats, [])
      assert.deepEqual(model.unknownStats, [])
    }
  }
})

test('签名游戏译名和词缀组成的英繁等价酊剂产生相同查询', async () => {
  const { service: originalService, searches: originalSearches } = fixture()
  await originalService.check({ text: userAshbarkTincture, league: 'Covens', options: { initialSelection: 'all' } })
  const suffix = entries.find(entry => entry.table === 'mods' && entry.en === 'of Success')
  const render = (id, value, language, kind = 'stat') => entries.find(entry => entry.kind === kind && entry.id === id && entry.field !== 'variant:1')[language].replace('{0}', value)
  // Equivalent formats assembled from unchanged signed game rows, not newly captured clipboard samples.
  for (const language of ['en', 'tw']) {
    const text = [
      `${language === 'en' ? 'Item Class' : '物品種類'}: ${itemClass[language]}`,
      language === 'en' ? 'Rarity: Magic' : '稀有度: 魔法',
      language === 'en' ? `${base.en} ${suffix.en}` : `${suffix.tw}${base.tw}`,
      '--------',
      render('ItemDisplayTinctureToxicityNSeconds', '0.60', language, 'dat'),
      render('ItemDisplayTinctureCooldownNSeconds', '7', language, 'dat'),
      '--------', language === 'en' ? 'Item Level: 73' : '物品等級: 73', '--------',
      '{ Implicit Modifier }',
      render('chance_to_ignite_%_with_tinctured_weapons', '25', language),
      render('ignite_damage_+%_with_tinctured_weapons', '86(60-90)', language),
      '--------', `{ Suffix Modifier "${suffix[language]}" (Tier: 4) }`,
      render('life_gained_on_killing_enemies_with_tinctured_weapons', '14(11-15)', language)
    ].join('\n')
    const { service, searches } = fixture()
    const { model } = await service.check({ text, league: 'Covens', options: { initialSelection: 'all' } })
    assert.equal(model.presentation.language, language)
    assert.deepEqual(JSON.parse(JSON.stringify(searches[0])), JSON.parse(JSON.stringify(originalSearches[0])))
  }
})

test('酊剂结构只适用于首属性段且不能绕过未知词缀或无效源模板', () => {
  const { service } = fixture()
  assert.throws(() => service.parse(userAshbarkTincture.replace('每击败一名敌人获得 14(11-15) 点生命', '每击败一名敌人获得 14(11-15) 点生命\n造成 99 未知酊剂效果')), /未匹配|已阻止/)
  assert.throws(() => service.parse(userAshbarkTincture.replace('近战武器每击败一名敌人获得 14(11-15) 点生命', '每 0.60 秒造成魔力燃烧')), /多个国际服候选|未匹配/)
  const row = structures.find(entry => entry.id === 'ItemDisplayTinctureToxicityNSeconds')
  assert.throws(() => service.parse(structuralText(row, '0.60', 'cn').replace('物品类别: 酊剂', '物品类别: 戒指')), /多个国际服候选|未匹配/)
  const badRows = entries.map(entry => /^ItemDisplayTinctureToxicity/.test(entry.id) ? { ...entry, sourceHash: '0'.repeat(64) } : entry)
  assert.throws(() => fixture(badRows).service.parse(userAshbarkTincture), /未匹配|已阻止/)
})
})()

// === Merged from priceCheckUserMap.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const readFile = _m8_readFile
  const PriceCheckService = _m8_PriceCheckService
  const userRareMap = _m8_userRareMap
const catalog = JSON.parse(await readFile(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
const entries = JSON.parse(await readFile(new URL('./fixtures/price-check-map-full-entries.json', import.meta.url), 'utf8'))

function parsingService() {
  return new PriceCheckService({ catalog, manualInputOnly: true, localizationProvider: () => entries,
    auth: { getStatus: () => ({ authenticated: true }) }, client: { server: { id: 'international' } } })
}

test('当前词缀类型仅有反向官方文案时正确转换负回复值', () => {
  const service = parsingService()
  const header = 'Item Class: Rings\nRarity: Normal\nCoral Ring\n--------\nItem Level: 80\n--------\n'
  for (const modifier of ['Lose 2% of Life on Kill (implicit)', '{ Implicit Modifier }\nLose 2% of Life on Kill']) {
    const model = service.parse(header + modifier)
    assert.deepEqual(model.unknownStats, [], modifier)
    const stat = model.stats.find(stat => stat.id === 'implicit.stat_2023107756')
    assert.ok(stat, modifier)
    assert.equal(stat.values[0], -2, modifier)
  }
  const explicit = service.parse(header + 'Lose 2% of Life on Kill')
  assert.deepEqual(explicit.unknownStats, [])
  assert.ok(explicit.stats.some(stat => stat.id === 'explicit.stat_751813227' && stat.values[0] === 2))
})

test('普通复制的附魔后缀仅决定当前行的官方词缀类型', () => {
  const model = parsingService().parse(`Item Class: Wands
Rarity: Normal
Driftwood Wand
--------
Item Level: 80
--------
元素伤害提高 15% (enchant)
--------
元素伤害提高 16%`)
  assert.deepEqual(model.unknownStats, [])
  assert.ok(model.stats.some(stat => stat.id === 'enchant.stat_692420067' && stat.values[0] === 15))
  assert.ok(model.stats.some(stat => stat.type === 'explicit' && stat.values[0] === 16))
})

test('固定说明与未知词缀位于同一段时不得整段省略', () => {
  const text = userRareMap.replace('只能被使用一次。\n--------', '只能被使用一次。\n+1 未知词缀\n--------')
  assert.throws(() => parsingService().parse(text), /未知词缀|未匹配当前汉化资源/)
})

test('稀有随机名称与真实词缀同名时保留随机名称并继续解析底材', () => {
  const model = parsingService().parse(userRareMap.replace('苍空轨迹', '怪物免疫晕眩'))
  assert.equal(model.identity.type, 'Map')
  assert.equal(model.identity.name, '')
  assert.deepEqual(model.unknownStats, [])
  assert.equal(model.stats.length, 7)
})

test('用户完整汉化地图保留15阶、腐化状态和全部七条词缀', async () => {
  const searches = []
  const service = new PriceCheckService({
    catalog,
    manualInputOnly: true,
    localizationProvider: () => entries,
    auth: { getStatus: () => ({ authenticated: true }) },
    client: {
      server: { id: 'international', label: '国际服' },
      clearCache() {},
      search: async (league, query) => {
        searches.push(query)
        return { id: 'user-map', total: 0, result: [] }
      },
      fetch: async () => ({ result: [] })
    }
  })
  const { model } = await service.check({ text: userRareMap, league: 'Covens', options: { initialSelection: 'all' } })
  assert.equal(searches.length, 1)
  const query = searches[0].query
  assert.deepEqual(query.type, { discriminator: 'map', option: 'Map' })
  assert.deepEqual(query.filters.map_filters.filters.map_tier, { min: 15, max: 15 })
  assert.equal(query.filters.misc_filters.filters.corrupted.option, 'true')
  assert.deepEqual(model.unknownStats, [])
  const expected = [
    ['implicit.stat_3737068014', -15],
    ['explicit.stat_1041951480', undefined],
    ['explicit.stat_1000591322', undefined],
    ['explicit.stat_365540634', 25],
    ['explicit.stat_1054098949', 40],
    ['explicit.stat_1910157106', undefined]
  ]
  const filters = query.stats.flatMap(group => group.filters)
  for (const [id, value] of expected) {
    const stat = model.stats.find(stat => stat.id === id)
    assert.ok(stat, `应保留 ${id}`)
    assert.ok(filters.some(filter => filter.id === id), `查询应包含 ${id}`)
    if (value !== undefined) assert.equal(stat.values[0], value, id)
  }
  const life = model.stats.find(stat => ['explicit.stat_95249895', 'explicit.stat_2710898947'].includes(stat.id))
  assert.ok(life, '应保留怪物生命总增')
  assert.equal(life.values[0], 29)
  assert.ok(filters.some(filter => filter.id === life.id))
})
})()

// === Merged from serverTradeCatalog.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const mkdtemp = _m9_mkdtemp
  const readFile = _m9_readFile
  const rm = _m9_rm
  const writeFile = _m9_writeFile
  const path = _m9_path
  const os = _m9_os
  const generateServerTradeCatalog = _m9_generateServerTradeCatalog
  const writeServerTradeCatalog = _m9_writeServerTradeCatalog
  const loadTradeCatalog = _m9_loadTradeCatalog
  const loadInternationalTradeCatalog = _m9_loadInternationalTradeCatalog
  const resolveCatalogStat = _m9_resolveCatalogStat
const payloads = {
  stats: { result: [{ id: 'explicit', entries: Array.from({ length: 110 }, (_, index) => ({ id: `explicit.stat_${index}`, text: `Fixture stat ${index}: +# to Life` })) }] },
  items: { result: [{ id: 'accessory.ring', entries: Array.from({ length: 110 }, (_, index) => ({ type: `Fixture Base ${index}` })) }] },
  static: { result: [{ id: 'currency', entries: [{ id: 'chaos', text: 'Chaos Orb' }] }] }
}

test('国际服生成只请求本服，目录不继承国服文本，带版本、来源与哈希', async () => {
  const { catalog: baseCatalog } = await loadTradeCatalog()
  const requests = []
  const { catalog, status } = await generateServerTradeCatalog({ server: 'international', gameVersion: '3.29', baseCatalog,
    fetchImpl: async url => { requests.push(url); return new Response(JSON.stringify(payloads[url.split('/').at(-1)])) } })
  assert.equal(catalog.locale, 'en')
  assert.equal(catalog.provider, 'poe-international')
  assert.equal(catalog.gameVersion, '3.29')
  assert.equal(catalog.items.length, 110)
  assert.equal(catalog.stats.length, 110)
  assert.equal(status.counts.currencies, 1)
  assert.deepEqual(status.sources, catalog.sources)
  assert.ok(status.sources.every(url => url.startsWith('https://www.pathofexile.com/')))
  assert.deepEqual(catalog.unqueryableStats, [])
  assert.ok(requests.every(url => url.startsWith('https://www.pathofexile.com/')))
  assert.ok(catalog.manifest.sources.every(source => /^[a-f0-9]{64}$/.test(source.sha256)))
  assert.equal(resolveCatalogStat(catalog, 'Fixture stat 0: +79 to Life', 'explicit').match?.id, 'explicit.stat_0')
})

test('结构异常和 HTTP 拒绝使生成失败，不产生可发布候选', async () => {
  const { catalog: baseCatalog } = await loadTradeCatalog()
  for (const response of [() => new Response('{}'), () => new Response('blocked', { status: 403 })]) {
    await assert.rejects(generateServerTradeCatalog({ server: 'international', gameVersion: '3.29', baseCatalog, fetchImpl: async () => response() }))
  }
  await assert.rejects(generateServerTradeCatalog({ server: 'international', baseCatalog }), /补丁版本/)
})

test('写入前校验服务器目标和完整结构，失败不覆盖国服或现有活动目录', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-server-catalog-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const { catalog: baseCatalog } = await loadTradeCatalog()
  const { catalog } = await generateServerTradeCatalog({ server: 'international', gameVersion: '3.29', baseCatalog,
    fetchImpl: async url => new Response(JSON.stringify(payloads[url.split('/').at(-1)])) })
  const output = path.join(root, 'catalog.international.json')
  await writeServerTradeCatalog(output, catalog)
  const before = await readFile(output, 'utf8')
  await assert.rejects(writeServerTradeCatalog(path.join(root, 'catalog.json'), catalog), /避免覆盖国服/)
  await assert.rejects(writeServerTradeCatalog(output, { ...catalog, stats: null }))
  assert.equal(await readFile(output, 'utf8'), before)
})

test('国际服启动优先使用已验证缓存，错误清单回退本服快照，两者失效也不使用国服内容', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-international-startup-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const { catalog: baseCatalog } = await loadTradeCatalog()
  const { catalog } = await generateServerTradeCatalog({ server: 'international', gameVersion: 'live', baseCatalog,
    fetchImpl: async url => new Response(JSON.stringify(payloads[url.split('/').at(-1)])) })
  const cacheFile = path.join(root, 'cache.international.json')
  const bundledFile = path.join(root, 'bundled.international.json')
  await writeServerTradeCatalog(cacheFile, catalog)
  await writeServerTradeCatalog(bundledFile, catalog)
  let loaded = await loadInternationalTradeCatalog({ baseCatalog, cacheFile, bundledFile })
  assert.equal(loaded.status.provider, 'cached')
  assert.equal(loaded.status.degraded, false)
  assert.equal(loaded.status.warning, '')
  assert.equal(loaded.status.counts.stats, 110)
  const wrongServer = structuredClone(catalog)
  wrongServer.manifest.server = 'cn'
  await writeFile(cacheFile, JSON.stringify(wrongServer))
  loaded = await loadInternationalTradeCatalog({ baseCatalog, cacheFile, bundledFile })
  assert.equal(loaded.status.provider, 'bundled')
  assert.equal(loaded.catalog.provider, 'poe-international')
  await writeFile(bundledFile, '{}')
  loaded = await loadInternationalTradeCatalog({ baseCatalog, cacheFile, bundledFile })
  assert.equal(loaded.status.provider, 'unavailable')
  assert.equal(loaded.status.degraded, true)
  assert.equal(loaded.catalog.items.length, 0)
  assert.equal(loaded.catalog.stats.length, 0)
  assert.deepEqual(loaded.catalog.currencyLabels, {})
})
})()
