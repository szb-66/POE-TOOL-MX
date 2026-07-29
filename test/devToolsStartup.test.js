import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const managerSource = readFileSync(
  new URL('../electron/modules/window/manager.js', import.meta.url),
  'utf8'
)

test('开发环境启动不会无条件展开 DevTools', () => {
  const startupBranch = managerSource.match(
    /if \(process\.env\.NODE_ENV === 'development' && devServerUrl\) \{([\s\S]*?)\n  \} else \{/
  )

  assert.ok(startupBranch, '应保留开发服务器加载分支')
  assert.match(startupBranch[1], /mainWindow\.loadURL\(devServerUrl\)/)
  assert.doesNotMatch(startupBranch[1], /openDevTools/)
})

test('仍可通过显式调试模式操作打开 DevTools', () => {
  assert.match(
    managerSource,
    /export function setDevToolsVisible\(visible\)[\s\S]*?openDevTools\(\{ mode: 'right', activate: true \}\)/
  )
})
