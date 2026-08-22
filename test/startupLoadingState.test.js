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
  assert.match(indexHtml, /#app-loading[\s\S]*?background:\s*#0E1013/)
  assert.match(indexHtml, /loading-spinner[\s\S]*?border-top-color:\s*#C5A46D/)
  assert.match(managerSource, /backgroundColor:\s*'#0E1013'/)
})

test('覆盖层路由不显示主窗口加载块', () => {
  assert.match(indexHtml, /location\.hash && location\.hash !== '#\/'/)
  assert.match(indexHtml, /document\.getElementById\('app-loading'\)\?\.remove\(\)/)
})
