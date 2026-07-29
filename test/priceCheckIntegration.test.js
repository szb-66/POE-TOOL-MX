import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

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
    'price-check-overlay-state',
    'price-check-overlay-close',
    'price-check-open-official'
  ]
  for (const channel of channels) {
    assert.match(ipc, new RegExp(channel))
    assert.match(preload, new RegExp(channel))
  }
  for (const method of ['getStatus', 'updateRuntime', 'capture', 'rerun', 'loadMore', 'getOverlayState', 'closeOverlay', 'openOfficial']) {
    assert.match(api, new RegExp(`${method}:`))
  }
  assert.doesNotMatch(ipc, /['"]price-check-(?:parse|run|list-leagues)['"]/)
})

test('主进程复用国服认证与 Session，并在退出时关闭查价覆盖层', async () => {
  const main = await source('electron/main.js')
  assert.match(main, /const priceCheckClient = new PoeCnTradeClient\(\{ session: poeCnSession \}\)[\s\S]*new PriceCheckService\(\{[\s\S]*auth: chaosAuth[\s\S]*client: priceCheckClient/)
  assert.equal((main.match(/session\.fromPartition\('persist:poe-cn-auth'\)/g) || []).length, 1)
  assert.match(main, /priceCheckService\?\.closeOverlay\(\)/)
})

test('查价覆盖层保持单实例、安全隔离并支持状态推送', async () => {
  const overlay = await source('electron/modules/priceCheck/overlay.js')
  assert.match(overlay, /if \(!this\.window \|\| this\.window\.isDestroyed\(\)\)/)
  assert.match(overlay, /nodeIntegration: false/)
  assert.match(overlay, /contextIsolation: true/)
  assert.match(overlay, /webSecurity: true/)
  assert.match(overlay, /webContents\.send\('price-check-overlay-state'/)
  assert.match(overlay, /this\.snapshot = null/)
  assert.match(overlay, /this\.window\.on\('blur'/)
  assert.match(overlay, /preserveForExternalAction/)
  assert.match(overlay, /Math\.min\(640,[\s\S]*Math\.min\(760,/)
})

test('查价浮层默认紧凑并折叠低频设置', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  assert.match(view, /settingsCollapsed = ref\(true\)/)
  assert.match(view, /\.topbar \{ height: 44px;/)
  assert.match(view, /\.filter-list \{ max-height: 255px; overflow-y: auto;/)
  assert.match(view, /\.listing \{ min-height: 36px;/)
})

test('查价属性与词缀使用单行整行选择且数值输入不误触发', async () => {
  const view = await source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  assert.match(view, /role="checkbox"[\s\S]*@click="toggleFilter\(property\)"/)
  assert.match(view, /role="checkbox"[\s\S]*@click="toggleFilter\(stat\)"/)
  assert.match(view, /class="number"[\s\S]*@click\.stop/)
  assert.match(view, /class="number"[\s\S]*@keydown\.stop/)
  assert.match(view, /\.filter-row \{[\s\S]*height: 32px;/)
  assert.doesNotMatch(view, /v-model="(?:property|stat)\.enabled" type="checkbox"/)
  assert.doesNotMatch(view, /content: "属性"/)
})

test('首页业务模块每行最多展示三个', async () => {
  const dashboard = await source('src/domains/dashboard/DashboardView.vue')
  assert.match(dashboard, /\.module-grid \{ display: grid; grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/)
  assert.match(dashboard, /@media \(max-width: 1100px\)[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/)
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
