import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  SETTINGS_TABS,
  resolveSettingsTab,
  settingsRoute,
  settingsRouteForHealth,
  settingsTabForHealth
} from '../src/router/settingsNavigation.js'

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('设置导航仅接受七个稳定 Tab 单值并为合法目标生成查询路由', () => {
  assert.deepEqual(SETTINGS_TABS, [
    'general', 'automation', 'detection', 'overlay', 'system', 'feedback', 'about'
  ])
  for (const tab of SETTINGS_TABS) {
    assert.equal(resolveSettingsTab(tab), tab)
    assert.deepEqual(settingsRoute(tab), { path: '/settings', query: { tab } })
  }
  for (const invalid of [undefined, null, '', 'unknown', ['general'], 1]) {
    assert.equal(resolveSettingsTab(invalid), null)
    assert.deepEqual(settingsRoute(invalid), { path: '/settings' })
  }
})

test('首页按首个非正常健康项定位设置分类', () => {
  assert.equal(settingsTabForHealth([
    { id: 'python', status: 'ready' },
    { id: 'shortcuts', status: 'attention' },
    { id: 'dpi', status: 'error' }
  ]), 'general')
  assert.equal(settingsTabForHealth([
    { id: 'python', status: 'error' },
    { id: 'shortcuts', status: 'attention' }
  ]), 'system')
  assert.equal(settingsTabForHealth([
    { id: 'shortcuts', status: 'ready' },
    { id: 'network', status: 'attention' }
  ]), 'system')
  assert.equal(settingsTabForHealth([{
    id: 'shortcuts',
    status: 'ready',
    reason: 'window-title-mismatch'
  }]), null)
  assert.deepEqual(settingsRouteForHealth([]), { path: '/settings' })
})

test('设置页同步合法查询目标、持久化选择并使用 replace 回写手动切换', () => {
  const view = source('src/domains/settings/SettingsView.vue')
  assert.match(view, /import \{ useRoute, useRouter \} from 'vue-router'/)
  assert.match(view, /import \{ SETTINGS_TABS, resolveSettingsTab \} from '@\/router\/settingsNavigation'/)
  assert.match(view, /watch\(\(\) => route\.query\.tab,[\s\S]*resolveSettingsTab\(tab\)[\s\S]*writePersistentTab/)
  assert.match(view, /router\.replace\(\{ path: route\.path, query: \{ \.\.\.route\.query, tab: nextTab \}, hash: route\.hash \}\)/)
  assert.match(view, /if \(!requestedTab \|\| requestedTab === activeTab\.value\) return/)
  assert.match(view, /settingsScrollbar\.value\?\.setScrollTop\(0\)/)
})

test('明确业务入口携带通用目标，普通设置入口不携带目标', () => {
  const shop = source('src/domains/shop/ChaosRecipePanel.vue')
  const priceCheck = source('src/domains/priceCheck/PriceCheckView.vue')
  const dashboard = source('src/domains/dashboard/useDashboard.js')
  const sidebar = source('src/components/Layout/Sidebar.vue')

  assert.equal((shop.match(/settingsRoute\('general'\)/g) || []).length, 2)
  assert.match(priceCheck, /\$router\.push\(settingsRoute\('general'\)\)/)
  assert.match(dashboard, /router\.push\(settingsRouteForHealth\(healthItems\.value\)\)/)
  assert.match(sidebar, /index="\/settings"/)
  assert.doesNotMatch(sidebar, /settingsRoute/)
  assert.doesNotMatch(sidebar, /index="\/help"/)
})
