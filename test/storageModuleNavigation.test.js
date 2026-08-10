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

  assert.match(view, /const activeTab = ref\('inbound'\)/)
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
  const stashStart = view.indexOf('<h3 class="section-title">仓库自动取件</h3>', pickupStart)
  const junfengStart = view.indexOf('<h3 class="section-title">君锋镇取出高亮</h3>', pickupStart)
  const sharedStart = view.indexOf('<h3 class="section-title">共享本机校准素材</h3>', pickupStart)
  const pickupEnd = view.indexOf('</el-tab-pane>', sharedStart)
  const shared = view.slice(sharedStart, pickupEnd)

  assert.ok(stashStart > pickupStart && junfengStart > stashStart && sharedStart > junfengStart && pickupEnd > sharedStart)
  assert.doesNotMatch(view, /<el-tab-pane label="共享本机校准素材"/)
  assert.match(shared, /junfengStore\.corrections\.length/)
  assert.match(shared, /rebuildJunfengCorrections/)
  assert.match(shared, /resetJunfengCorrections/)
  assert.match(shared, /junfengStore\.removeCorrection/)
})
