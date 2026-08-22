import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  cursorInsideBounds,
  getPriceCheckOverlayBounds,
  hasLeftPriceCheckIntent
} from '../electron/modules/priceCheck/overlayPosition.js'

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
    'price-check-open-official'
  ]
  for (const channel of channels) {
    assert.match(ipc, new RegExp(channel))
    assert.match(preload, new RegExp(channel))
  }
  for (const method of ['getStatus', 'updateRuntime', 'updateSettings', 'capture', 'rerun', 'retryCatalog', 'loadMore', 'loadDistribution', 'resolveIdentity', 'resolveStatCandidate', 'getOverlayState', 'closeOverlay', 'openOfficial', 'onSettingsChanged']) {
    assert.match(api, new RegExp(`${method}:`))
  }
  assert.doesNotMatch(ipc, /['"]price-check-(?:parse|run|list-leagues)['"]/)
})

test('主进程复用国服认证与 Session，并在退出时销毁查价覆盖层', async () => {
  const main = await source('electron/main.js')
  assert.match(main, /const priceCheckClient = new PoeCnTradeClient\(\{ session: poeCnSession \}\)[\s\S]*new PriceCheckService\(\{[\s\S]*auth: chaosAuth[\s\S]*client: priceCheckClient/)
  assert.equal((main.match(/session\.fromPartition\('persist:poe-cn-auth'\)/g) || []).length, 1)
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
  assert.match(capture, /游戏以管理员权限运行，请同样以管理员权限运行流放助手/)
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
  assert.match(main, /restoreGameFocus:\s*\(\) => restoreWindowsGameFocus/)
})

test('查价浮窗靠近鼠标定位、边缘翻转并支持负坐标显示器', () => {
  assert.deepEqual(
    getPriceCheckOverlayBounds({ x: 300, y: 200 }, { x: 0, y: 0, width: 1920, height: 1080 }, 600, 700),
    { x: 318, y: 218, width: 600, height: 700 }
  )
  assert.deepEqual(
    getPriceCheckOverlayBounds({ x: 1850, y: 1000 }, { x: 0, y: 0, width: 1920, height: 1080 }, 600, 700),
    { x: 1232, y: 282, width: 600, height: 700 }
  )
  assert.deepEqual(
    getPriceCheckOverlayBounds({ x: -100, y: 40 }, { x: -1280, y: 0, width: 1280, height: 1024 }, 520, 760),
    { x: -638, y: 58, width: 520, height: 760 }
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

test('查价浮层默认紧凑并折叠低频设置', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  assert.match(view, /settingsCollapsed = ref\(true\)/)
  assert.match(view, /\.topbar \{ height: 38px;/)
  assert.match(view, /\.filter-list \{ max-height: 255px; overflow-y: auto;/)
  assert.match(view, /\.listing \{ min-height: 36px;/)
})

test('查价浮窗操作按钮使用主次层级且悬浮状态保持对应配色', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  const actionRow = view.match(/<section class="action-row">([\s\S]*?)<\/section>/)?.[1] || ''

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
  assert.match(view, /<el-input-number :model-value="stat\.min"[^>]*placeholder="最小"/)
  assert.match(view, /<el-input-number :model-value="stat\.max"[^>]*placeholder="最大"/)
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
  assert.match(view, /stateFiltersCollapsed = ref\(true\)/)
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
  assert.match(view, /class="property-grid">[\s\S]*v-for="property in state\.model\.properties"/)
  assert.match(view, /\.property-grid \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/)
  assert.match(view, /class="filter-name" :title="property\.label"/)
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
  assert.match(view, /<el-select v-model="queryOptions\.status"[^>]*popper-class="price-check-select-popper"[^>]*@change="syncSetting\('status'\)"/)
  assert.match(view, /<el-select v-model="state\.model\.stateFilters\[definition\.key\]"[^>]*popper-class="price-check-select-popper"/)
  assert.match(view, /<el-select v-model="property\.value"[^>]*class="property-option"[^>]*@click\.stop @keydown\.stop/)
  assert.equal((view.match(/<el-input-number/g) || []).length, 5)
  assert.equal((view.match(/<el-input-number[^>]*size="small"/g) || []).length, 5)
  assert.equal((view.match(/:controls="false"/g) || []).length, 5)
  assert.match(view, /function setNumericField\(target, key, value\) \{\s*target\[key\] = value == null \? undefined : value\s*\}/)
  assert.match(view, /\.number :deep\(\.el-input\),\s*\.setting-number :deep\(\.el-input\) \{ height: 24px; \}/)
  assert.match(view, /\.number :deep\(\.el-input__wrapper\),\s*\.setting-number :deep\(\.el-input__wrapper\) \{ min-height: 22px; padding-top: 0; padding-bottom: 0; \}/)
  assert.doesNotMatch(view, /select:not\(:disabled\)|select:focus-visible/)
  assert.match(elementTheme, /html\.app-dark-theme[\s\S]*\.el-select__wrapper[\s\S]*background: var\(--surface-2\)/)
  assert.match(elementTheme, /\.el-select-dropdown__item[\s\S]*&\.is-hovering[\s\S]*&\.is-selected/)
})

test('佣兵凭证浮窗按组显示技能并支持严格的父子选择交互', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  assert.match(view, /v-if="state\.model\.mercenarySkillGroups\?\.length"/)
  assert.match(view, /v-for="group in state\.model\.mercenarySkillGroups"/)
  assert.match(view, /\{\{ group\.skill\.text \}\}/)
  assert.match(view, /v-for="support in group\.supports"/)
  assert.match(view, /\{\{ support\.name \}\}[^]*等阶 \{\{ support\.tier \}\}/)
  assert.match(view, /role="checkbox"[^]*:aria-checked="group\.enabled"[^]*@keydown\.enter\.prevent="toggleMercenaryGroup\(group\)"[^]*@keydown\.space\.prevent="toggleMercenaryGroup\(group\)"/)
  assert.match(view, /:aria-pressed="support\.enabled"[^]*@click="toggleMercenarySupport\(group, support\)"/)
  assert.match(view, /function toggleMercenarySupport\(group, support\)[^]*support\.enabled = !support\.enabled[^]*if \(support\.enabled\) group\.enabled = true/)
  assert.match(view, /function toggleMercenaryGroup\(group\) \{ group\.enabled = !group\.enabled \}/)
  assert.match(view, /\.mercenary-supports \{[^}]*flex-wrap: wrap/)
  assert.match(view, /\.mercenary-panel \{[^}]*overflow-y: auto/)
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
  assert.match(view, /function setNameFilterEnabled\(enabled\)[\s\S]*!canToggleName\.value[\s\S]*identity\.nameEnabled = true[\s\S]*identity\.nameEnabled = enabled !== false/)
  assert.match(view, /electronApi\.priceCheck\.rerun\(\{[\s\S]*model: state\.value\.model/)
  assert.match(view, /\.identity-side \{[\s\S]*flex-wrap: wrap;/)
  assert.match(view, /\.identity-name\.disabled/)
  assert.match(view, /\.identity-name \{[^}]*appearance: none;[^}]*background: transparent;/)
  assert.match(view, /\.filter-row\.enabled \{[^}]*border-color: var\(--brand-color\);/)
  assert.match(view, /\.filter-row:focus-visible/)
  assert.doesNotMatch(view, /\.identity-name-checkbox/)
})

test('查价加载、错误和限流反馈位于搜索按钮下方的结果区域', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  const actionIndex = view.indexOf('<section class="action-row">')
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
  assert.match(overlay, /\{\{ stat\.text \}\}/)
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
  const statRow = overlay.match(/v-for="stat in state\.model\.stats"[\s\S]*?<\/div>/)?.[0] || ''
  assert.match(statRow, /:key="stat\.key"/)
  assert.match(statRow, /\{\{ stat\.text \}\}/)
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
  assert.match(service, /async check\(\{ text, league, model, options = \{\}, reposition = true, execute = true, queryImmediately = true \}\)/)
  assert.match(service, /this\.overlay\?\.create\?\.\(state, \{ reposition \}\)/)
  assert.match(service, /rerun[\s\S]*reposition: false/)
  assert.match(service, /resolveIdentity[\s\S]*reposition: false/)
})

test('查价浮窗启用后后台预热、普通关闭停放且禁用或退出时销毁', async () => {
  const [overlay, service, main] = await Promise.all([
    source('electron/modules/priceCheck/overlay.js'),
    source('electron/modules/priceCheck/service.js'),
    source('electron/main.js')
  ])
  assert.match(service, /if \(enabled\) this\.overlay\?\.prepare\?\.\(\)/)
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
  assert.doesNotMatch(createBody, /this\.showPreparedWindow/)
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
  assert.match(showBody, /this\.presentation\?\.reveal\(this\.displayGeneration\)/)
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

test('统一国服账号通道替代商城与查价重复认证入口', async () => {
  const [accountIpc, preload, settings, shop, price] = await Promise.all([
    source('electron/modules/ipc/poeCnAccount.js'),
    source('electron/preload.cjs'),
    source('src/domains/settings/SettingsView.vue'),
    source('src/domains/shop/ChaosRecipePanel.vue'),
    source('src/domains/priceCheck/PriceCheckView.vue')
  ])
  for (const channel of ['status', 'restore', 'open-web', 'complete-web', 'token', 'logout', 'list-leagues', 'set-league']) {
    assert.match(accountIpc, new RegExp(`poe-cn-account-${channel}`))
    assert.match(preload, new RegExp(`poe-cn-account-${channel}`))
  }
  assert.match(settings, /国服账号[\s\S]*全局赛季/)
  assert.match(shop, /前往账号设置/)
  assert.match(price, /前往账号与快捷键设置/)
  assert.doesNotMatch(shop, /POESESSID|打开网页登录|退出国服账号/)
  assert.doesNotMatch(price, /POESESSID|打开网页登录|退出共享国服账号/)
})

test('查价快捷键已进入默认配置、设置页与统一动作派发', async () => {
  const [config, settings, service] = await Promise.all([
    source('src/utils/shortcutConfig.js'),
    source('src/domains/settings/SettingsView.vue'),
    source('src/utils/scriptService.js')
  ])
  assert.match(config, /priceCheck: 'Ctrl\+D'/)
  assert.match(settings, /shortcuts\.priceCheck[\s\S]*handleShortcutsChange\('priceCheck'/)
  assert.match(service, /priceCheck:\s*startPriceCheck/)
  assert.match(service, /checkHoveredItem\(\)/)
})

test('查价配置页移除手动文本入口并只保留快捷键说明', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckView.vue')
  assert.match(view, /物品捕获只从游戏内快捷键进入/)
  assert.match(view, /store\.setEnabled\(enabled\)/)
  assert.doesNotMatch(view, /type="textarea"|store\.(?:run|parse|checkClipboard)\(/)
})
