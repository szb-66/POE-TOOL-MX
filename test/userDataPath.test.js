import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { resolveUserDataPath } from '../electron/modules/storage/userDataPath.js'

const source = (filePath) => fs.readFileSync(new URL(filePath, import.meta.url), 'utf8')

test('开发版与正式版使用唯一的流放助手数据目录', () => {
  assert.equal(
    resolveUserDataPath('C:\\Users\\A\\AppData\\Roaming'),
    path.join('C:\\Users\\A\\AppData\\Roaming', '流放助手')
  )
  const main = source('../electron/main.js')
  assert.ok(main.indexOf("app.setPath('userData'") < main.indexOf('app.whenReady()'))
})

test('应用不再暴露旧数据迁移或导入入口', () => {
  const main = source('../electron/main.js')
  const preload = source('../electron/preload.cjs')
  const rendererMain = source('../src/main.js')
  for (const contents of [main, preload, rendererMain]) {
    assert.doesNotMatch(contents, /legacy|recovered|migration|旧版页面数据/i)
  }
})
