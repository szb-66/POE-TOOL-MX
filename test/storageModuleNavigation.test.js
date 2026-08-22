import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('存取模块在关联入口使用统一名称并保留内部路由', () => {
  const sidebar = source('src/components/Layout/Sidebar.vue')
  const dashboard = source('src/domains/dashboard/dashboardStatus.js')
  const help = source('src/domains/help/helpContent.js')
  const settings = source('src/domains/settings/SettingsView.vue')
  const bagService = source('src/utils/bagService.js')

  assert.match(sidebar, /index="\/bag"[\s\S]*?<span>存取<\/span>/)
  assert.match(dashboard, /id: 'bag',[\s\S]*?title: '存取',[\s\S]*?route: '\/bag'/)
  assert.match(help, /id: 'bag', title: '存取'/)
  assert.match(settings, /前往“存取”页面进行配置/)
  assert.match(bagService, /背包安全入库已启用/)
  assert.doesNotMatch(bagService, /背包安全自动入库/)
})

test('存取页默认展示入库并按业务方向组织两个 Tab', () => {
  const view = source('src/domains/bag/BagView.vue')
  const inboundStart = view.indexOf('<el-tab-pane label="入库" name="inbound">')
  const pickupStart = view.indexOf('<el-tab-pane label="取件" name="pickup">')
  const tabsEnd = view.indexOf('</el-tabs>', pickupStart)
  const inbound = view.slice(inboundStart, pickupStart)
  const pickup = view.slice(pickupStart, tabsEnd)

  assert.match(view, /readPersistentTab\(STORAGE_TAB_STORAGE_KEY, STORAGE_TABS, 'inbound'\)/)
  assert.match(view, /writePersistentTab\(STORAGE_TAB_STORAGE_KEY, tab, STORAGE_TABS, 'inbound'\)/)
  assert.ok(inboundStart > 0 && pickupStart > inboundStart && tabsEnd > pickupStart)
  assert.match(inbound, /背包安全入库/)
  assert.match(inbound, /背包格子布局/)
  assert.match(inbound, /物品黑名单/)
  assert.doesNotMatch(inbound, /仓库自动取件|君锋镇取出高亮/)
  assert.match(pickup, /仓库自动取件/)
  assert.match(pickup, /君锋镇取出高亮/)
  assert.doesNotMatch(pickup, /背包格子布局|物品黑名单/)
})

test('共享本机校准素材在取件 Tab 内与两个取件模块同级并保留全部操作', () => {
  const view = source('src/domains/bag/BagView.vue')
  const pickupStart = view.indexOf('<el-tab-pane label="取件" name="pickup">')
  const stashStart = view.indexOf('仓库自动取件', pickupStart)
  const junfengStart = view.indexOf('君锋镇取出高亮', stashStart)
  const sharedStart = view.indexOf('共享本机校准素材', junfengStart)
  const pickupEnd = view.indexOf('</el-tab-pane>', sharedStart)
  const shared = view.slice(sharedStart, pickupEnd)

  assert.ok(stashStart > pickupStart && junfengStart > stashStart && sharedStart > junfengStart && pickupEnd > sharedStart)
  assert.doesNotMatch(view, /<el-tab-pane label="共享本机校准素材"/)
  assert.match(shared, /junfengStore\.corrections\.length/)
  assert.match(shared, /rebuildJunfengCorrections/)
  assert.match(shared, /resetJunfengCorrections/)
  assert.match(shared, /junfengStore\.removeCorrection/)
})

test('两段取件说明收纳到对应标题问号且不再占用整行提示', () => {
  const view = source('src/domains/bag/BagView.vue')
  const stashHelp = '默认使用当前高亮模型取件，自动识别普通仓库 12×12 和大型仓库 24×24：搜索框为空时全部物品都会高亮并取出；输入筛选后，只取出筛选结果；模糊格会跳过。请先运行检测预览。'
  const junfengHelp = '正式取件只截取一次奖励网格，不操作搜索框。低置信格会安全停止，不会自动点击。'
  assert.match(view, new RegExp(`仓库自动取件[\\s\\S]*?<el-tooltip content="${stashHelp}"`))
  assert.match(view, new RegExp(`君锋镇取出高亮[\\s\\S]*?<el-tooltip content="${junfengHelp}"`))
  assert.doesNotMatch(view, new RegExp(`<el-alert[\\s\\S]{0,120}title="${stashHelp}"`))
  assert.doesNotMatch(view, new RegExp(`<el-alert[\\s\\S]{0,120}title="${junfengHelp}"`))
})

test('共享素材标题同行展示数量与独立操作按钮，表格按十条分页且无内部滚动', () => {
  const view = source('src/domains/bag/BagView.vue')
  const sharedStart = view.indexOf('共享本机校准素材')
  const shared = view.slice(sharedStart, view.indexOf('</el-card>', sharedStart))
  assert.match(shared, /共享本机校准素材（\{\{ junfengStore\.corrections\.length \}\}）/)
  assert.match(shared, /<div class="calibration-actions">[\s\S]*重建特征[\s\S]*全部重置[\s\S]*<\/div>/)
  assert.doesNotMatch(shared, /<el-button-group>/)
  assert.match(view, /\.calibration-actions \{[^}]*display: flex;[^}]*gap: 8px;/)
  assert.match(shared, /:data="calibrationPage\.items"/)
  assert.doesNotMatch(shared, /max-height=/)
  assert.match(shared, /<el-pagination[\s\S]*:page-size="CALIBRATION_PAGE_SIZE"[\s\S]*:total="junfengStore\.corrections\.length"/)
  assert.match(view, /watch\(\(\) => junfengStore\.corrections\.length,[\s\S]*calibrationCurrentPage\.value = calibrationPage\.value\.page/)
})
