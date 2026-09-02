import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse } from '@vue/compiler-sfc'
import { availableFeatureCatalog } from '../src/features/featureCatalog.js'

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('正则、配方和旧商城兼容路由完整接入懒加载', () => {
  const router = source('src/router/index.js')
  const loaders = source('src/router/pageLoaders.js')
  assert.match(router, /path: '\/regex'[\s\S]*component: pageLoaders\['\/regex'\]/)
  assert.match(router, /path: '\/recipe'[\s\S]*component: pageLoaders\['\/recipe'\]/)
  assert.match(router, /path: '\/shop'[\s\S]*redirect: \{ path: '\/recipe', replace: true \}/)
  assert.match(loaders, /'\/regex': \(\) => import\('\.\.\/domains\/regex\/RegexView\.vue'\)/)
  assert.match(loaders, /'\/recipe': \(\) => import\('\.\.\/domains\/shop\/RecipeView\.vue'\)/)
})

test('侧栏使用线性图标并按正则、配方顺序预加载', () => {
  const sidebar = source('src/components/Layout/Sidebar.vue')
  const catalog = availableFeatureCatalog()
  assert.ok(catalog.findIndex(item => item.id === 'regex') < catalog.findIndex(item => item.id === 'recipe'))
  assert.equal(catalog.find(item => item.id === 'regex').icon, 'Operation')
  assert.equal(catalog.find(item => item.id === 'recipe').icon, 'ShoppingBag')
  assert.match(sidebar, /warmRoute\(feature\.route\)/)
})

test('正则页默认商城并提供地图标签、固定结果栏和 250 字符提示', () => {
  const view = source('src/domains/regex/RegexView.vue')
  const vendor = source('src/domains/regex/VendorRegexPanel.vue')
  const map = source('src/domains/regex/MapRegexPanel.vue')
  const result = source('src/domains/regex/RegexResultCard.vue')
  assert.match(view, /label="商城" name="vendor"/)
  assert.match(view, /label="地图" name="map"/)
  assert.match(view, /readPersistentTab\('regexActiveTab', TABS, 'vendor'\)/)
  assert.match(vendor, /position: sticky/)
  assert.doesNotMatch(vendor, /三连孔色|二连孔色|指定连接颜色|exactColors|threeLinks|twoLinks/)
  assert.match(map, /普通[\s\S]*T17/)
  assert.match(map, /includeAffixIds[\s\S]*excludeAffixIds/)
  assert.match(map, /批量购买价格筛选/)
  assert.match(map, /MAP_PRICE_CURRENCIES/)
  assert.match(map, /priceRange\.min[\s\S]*priceRange\.max/)
  assert.match(result, /result\.length \}\} \/ 250/)
})

test('新增页面组件均可被 Vue 编译器解析', () => {
  for (const path of [
    'src/domains/regex/RegexView.vue', 'src/domains/regex/VendorRegexPanel.vue',
    'src/domains/regex/MapRegexPanel.vue', 'src/domains/regex/RegexResultCard.vue',
    'src/domains/regex/RegexPresetSelector.vue', 'src/domains/shop/RecipeView.vue'
  ]) {
    assert.deepEqual(parse(source(path), { filename: path }).errors, [], path)
  }
})
