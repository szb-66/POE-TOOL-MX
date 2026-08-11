import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = (filePath) => fs.readFileSync(new URL(filePath, import.meta.url), 'utf8')

test('开发服务器固定使用 3000 端口且不自动切换 LocalStorage origin', () => {
  const viteConfig = source('../vite.config.js')
  const launcher = source('../scripts/dev.js')

  assert.match(viteConfig, /port:\s*3000/)
  assert.match(viteConfig, /strictPort:\s*true/)
  assert.match(launcher, /DEV_SERVER_URL = `http:\/\/localhost:\$\{DEV_SERVER_PORT\}`/)
  assert.match(launcher, /VITE_DEV_SERVER_URL: DEV_SERVER_URL/)
  assert.doesNotMatch(launcher, /httpServer\.address\(\)/)
})

test('开发端口占用时给出不会切换数据 origin 的提示', () => {
  const launcher = source('../scripts/dev.js')

  assert.match(launcher, /error\?\.message === `Port \$\{DEV_SERVER_PORT\} is already in use`/)
  assert.match(launcher, /不会切换端口以免读取到另一份本地数据/)
  assert.match(launcher, /process\.exit\(1\)/)
})

test('开发服务器只预热首屏并忽略生成数据目录', () => {
  const viteConfig = source('../vite.config.js')

  assert.match(viteConfig, /warmup:\s*(?:isNodeTest\s*\?\s*undefined\s*:\s*)?\{[\s\S]*?DashboardRouteView\.vue/)
  assert.match(viteConfig, /isNodeTest\s*=\s*Boolean\(process\.env\.NODE_TEST_CONTEXT\)/)
  assert.match(viteConfig, /optimizeDeps:\s*\{[\s\S]*?'vue'[\s\S]*?'element-plus'/)
  assert.match(viteConfig, /watch:\s*\{[\s\S]*?crafting-raw[\s\S]*?unique-items-raw/)
  assert.doesNotMatch(viteConfig, /warmup:[\s\S]*?pageLoaders/)
  assert.doesNotMatch(viteConfig, /element-plus\/dist\/index\.css/)
})
