import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('浮士德作为独立一级页面接入路由、预加载和商人语义导航', () => {
  const router = source('src/router/index.js')
  const loaders = source('src/router/pageLoaders.js')
  const catalog = source('src/features/featureCatalog.js')
  assert.match(router, /path: '\/faustus',[\s\S]*?name: 'Faustus'/)
  assert.match(loaders, /'\/faustus': \(\) => import\('\.\.\/domains\/faustus\/FaustusView\.vue'\)/)
  assert.match(catalog, /id: 'faustus'[\s\S]*label: '浮士德'[\s\S]*route: '\/faustus'[\s\S]*icon: 'PriceTag'/)
})

test('浮士德页面提供完整配置、校准、开始和日志控制', () => {
  const view = source('src/domains/faustus/FaustusView.vue')
  assert.match(view, /faustus-page primary-page primary-page--column/)
  assert.match(view, /primary-page__scroll[\s\S]*primary-page__content/)
  for (const text of ['神圣石兑混沌石', '价格分段', '市集网格校准', '开始改价', '逐件结果日志']) {
    assert.match(view, new RegExp(text))
  }
  assert.match(view, /config-flow[\s\S]*?config-step__index">01[\s\S]*?config-step__index">02/)
  assert.match(view, /calibration-actions[\s\S]*?runAction\(store\.calibrateGrid\)/)
  assert.doesNotMatch(view, /价格窗口识别测试|store\.testPriceWindow|store\.recognition/)
  assert.match(view, /store\.running/)
  assert.match(view, /紧急停止请使用全局快捷键/)
  assert.match(view, /settingsStore\.globalShortcuts\.end/)
  assert.doesNotMatch(view, /runAction\(store\.stop\)/)
  assert.match(view, /混沌石/)
  assert.match(view, /神圣石/)
})

test('开始改价被禁用时在运行控制区直接显示具体原因', () => {
  const view = source('src/domains/faustus/FaustusView.vue')
  assert.match(view, /const startBlockedReason = computed/)
  assert.match(view, /请先修正价格配置/)
  assert.match(view, /请先选择市集网格区域/)
  assert.doesNotMatch(view, /价格窗口识别测试|!store\.recognition/)
  assert.match(view, /v-if="startBlockedReason" class="start-blocked-reason"/)
  assert.match(view, /:title="startBlockedReason"/)
})

test('浮士德价格分段使用线性抓手拖拽、键盘排序和明确的降价百分比语义', () => {
  const view = source('src/domains/faustus/FaustusView.vue')
  assert.match(view, /<el-icon><Rank \/><\/el-icon>/)
  assert.match(view, /:draggable="!store\.running"/)
  assert.match(view, /@dragstart="startBandDrag/)
  assert.match(view, /@dragenter\.prevent="store\.previewBandReorder/)
  assert.match(view, /@drop\.prevent="finishBandDrag"/)
  assert.match(view, /@dragend="cancelBandDrag"/)
  assert.match(view, /@keydown\.up\.prevent="store\.moveBand\(index, -1\)"/)
  assert.match(view, /@keydown\.down\.prevent="store\.moveBand\(index, 1\)"/)
  assert.match(view, /class="band-range-relation">≤ 旧价 &lt;<\/span>/)
  assert.match(view, /white-space: nowrap/)
  assert.match(view, /aria-label="降价百分比"/)
  assert.match(view, /#prepend>降价/)
  assert.match(view, /#append>%/)
  assert.match(view, /type="danger"[\s\S]*?store\.removeBand/)
  assert.doesNotMatch(view, />上移<|>下移</)
})

test('浮士德 store 持久化配置、保存独立校准并订阅结构化事件', () => {
  const store = source('src/domains/faustus/faustusStore.js')
  assert.match(store, /createFaustusConfigRepository/)
  assert.match(store, /createFaustusRunSnapshot/)
  assert.match(store, /gridCalibration/)
  assert.match(store, /electronApi\.faustus\.pickGridRegion/)
  assert.doesNotMatch(store, /testPriceWindow|PRICE_RECOGNITION_REQUIRED|recognition\.value/)
  assert.match(store, /electronApi\.faustus\.start/)
  assert.match(store, /electronApi\.faustus\.stop/)
  assert.match(store, /electronApi\.faustus\.onEvent/)
  assert.match(store, /function moveBand\(index, offset\) \{\s*if \(running\.value\) return false/)
})
