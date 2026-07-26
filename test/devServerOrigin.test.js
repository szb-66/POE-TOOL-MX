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
