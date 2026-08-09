import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const view = readFileSync(new URL('../src/domains/tools/ToolsView.vue', import.meta.url), 'utf8')
const router = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
const loaders = readFileSync(new URL('../src/router/pageLoaders.js', import.meta.url), 'utf8')
const sidebar = readFileSync(new URL('../src/components/Layout/Sidebar.vue', import.meta.url), 'utf8')

test('工具站页面包含卡片、全字段编辑、删除和拖拽交互', () => {
  assert.match(view, /class="site-grid"/)
  assert.match(view, /class="site-image"/)
  assert.match(view, /v-model="form\.name"/)
  assert.match(view, /v-model="form\.url"/)
  assert.match(view, /v-model="form\.description"/)
  assert.match(view, /v-model="form\.imageUrl"/)
  assert.match(view, /draggable="true"/)
  assert.match(view, /finishDrag\(index\)/)
  assert.match(view, /ElMessageBox\.confirm/)
})

test('工具站图片失败会推进候选并最终显示文字占位', () => {
  assert.match(view, /toolSiteImageCandidates\(site\)/)
  assert.match(view, /@error="advanceImage\(site\)"/)
  assert.match(view, /v-else>\{\{ siteInitial\(site\) \}\}/)
})

test('工具站路由、预加载和侧栏导航已接线', () => {
  assert.match(router, /path: '\/tools'/)
  assert.match(router, /component: pageLoaders\['\/tools'\]/)
  assert.match(loaders, /'\/tools': \(\) => import\('\.\.\/domains\/tools\/ToolsView\.vue'\)/)
  assert.match(sidebar, /index="\/tools"/)
  assert.match(sidebar, /warmRoute\('\/tools'\)/)
  assert.match(sidebar, />工具站<\/span>/)
})
