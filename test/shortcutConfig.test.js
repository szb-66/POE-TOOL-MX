import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { DEFAULT_GLOBAL_SHORTCUTS, dispatchShortcutAction, mergeGlobalShortcutSettings } from '../src/utils/shortcutConfig.js'

test('全局快捷键默认包含背包与剧情导航', () => {
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.stashStart, 'Alt+4')
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.storyPrevious, 'PageUp')
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.storyNext, 'PageDown')
})

test('仅在统一字段缺失时迁移旧背包快捷键', () => {
  assert.equal(mergeGlobalShortcutSettings({}, { stashShortcut: 'F6' }).stashStart, 'F6')
  assert.equal(mergeGlobalShortcutSettings({ stashStart: 'F7' }, { stashShortcut: 'F6' }).stashStart, 'F7')
  assert.equal(mergeGlobalShortcutSettings({ unknown: 'F9' }, {}).unknown, undefined)
})

test('统一分发器对一次触发仅执行一个对应动作', () => {
  let calls = 0
  assert.equal(dispatchShortcutAction('storyNext', { storyNext: () => { calls += 1 } }), true)
  assert.equal(calls, 1)
  assert.equal(dispatchShortcutAction('missing', { storyNext: () => { calls += 1 } }), false)
  assert.equal(calls, 1)
})

test('主进程全量注册失败时保留并恢复上一份快捷键清单', () => {
  const source = fs.readFileSync(new URL('../electron/modules/ipc/shortcut.js', import.meta.url), 'utf8')
  assert.match(source, /previousShortcuts = new Map/)
  assert.match(source, /previousShortcuts\.forEach/)
  assert.match(source, /rolledBack: failed\.length > 0/)
})
