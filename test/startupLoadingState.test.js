import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const managerSource = readFileSync(
  new URL('../electron/modules/window/manager.js', import.meta.url),
  'utf8'
)

test('主窗口启动加载块位于 #app 内且包含加载动画', () => {
  const appContainer = indexHtml.match(
    /<div id="app">([\s\S]*?)<\/div>\s*<script>/
  )

  assert.ok(appContainer, '#app 容器应存在且后接加载脚本')
  assert.match(appContainer[1], /id="app-loading"/)
  assert.match(appContainer[1], /loading-spinner/)
  assert.match(appContainer[1], /正在加载…/)
})

test('加载块样式与主窗口背景色一致，避免白屏', () => {
  assert.match(indexHtml, /#app-loading[\s\S]*?background:\s*var\(--app-bg, var\(--startup-bg\)\)/)
  assert.match(indexHtml, /loading-spinner[\s\S]*?border-top-color:\s*var\(--startup-brand\)/)
  assert.match(managerSource, /show: false/); assert.match(managerSource, /openingWindow\.once\('ready-to-show'/)
})

test('覆盖层路由不显示主窗口加载块', () => {
  assert.ok(indexHtml.includes("dataset.startupWindow === 'standalone'"))
  assert.match(indexHtml, /document\.getElementById\('app-loading'\)\?\.remove\(\)/)
})
