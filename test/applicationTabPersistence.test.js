import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('设置、存取和商城 Tab 使用容错本机持久化并保留既有默认项', () => {
  const settings = source('src/domains/settings/SettingsView.vue')
  const bag = source('src/domains/bag/BagView.vue')
  const shop = source('src/domains/shop/ShopView.vue')

  for (const view of [settings, bag, shop]) {
    assert.match(view, /readPersistentTab/)
    assert.match(view, /writePersistentTab/)
  }
  assert.doesNotMatch(settings, /sessionStorage/)
  assert.match(settings, /readPersistentTab\(SETTINGS_TAB_STORAGE_KEY, SETTINGS_TABS, 'general'\)/)
  assert.match(bag, /readPersistentTab\(STORAGE_TAB_STORAGE_KEY, STORAGE_TABS, 'inbound'\)/)
  assert.match(shop, /readPersistentTab\('shopActiveTool', SHOP_TABS, 'chaos'\)/)
})

test('制作动作目录和动态词缀 Tab 使用稳定名称及相互隔离的持久化状态', () => {
  const view = source('src/domains/crafting/CraftPlannerView.vue')
  for (const name of ['currency', 'essence', 'bench', 'fossils', 'harvest', 'eldritch', 'veiled', 'influence', 'beast']) {
    assert.match(view, new RegExp(`name="${name}"`))
  }
  assert.match(view, /<el-tabs v-model="activeCraftTab">/)
  assert.match(view, /:model-value="catalogAffixTabs\[group\.id\] \|\| 'prefix'"/)
  assert.match(view, /:name="affixType"/)
  assert.match(view, /readPersistentTabMap/)
  assert.match(view, /writePersistentTabMap/)
})

test('地图 Tab 继续通过预设状态持久化并校验合法目标', () => {
  const view = source('src/domains/map/MapView.vue')
  const store = source('src/stores/preset.js')
  assert.match(view, /get: \(\) => presetStore\.mapRollingKind/)
  assert.match(view, /set: value => presetStore\.setMapRollingKind\(value\)/)
  assert.match(store, /localStorage\.setItem\('mapRollingKind', mapRollingKind\.value\)/)
  assert.match(store, /savedMapRollingKind === 'chart'/)
  assert.match(store, /: 'atlas'/)
})
