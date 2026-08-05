import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { DEFAULT_GLOBAL_SHORTCUTS, dispatchShortcutAction, mergeGlobalShortcutSettings } from '../src/utils/shortcutConfig.js'

test('全局快捷键不再包含背包补扫，但保留剧情导航', () => {
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.stashStart, undefined)
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.storyPrevious, 'PageUp')
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.storyNext, 'PageDown')
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.chaosRecipeStart, 'Alt+4')
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.chaosRecipePause, 'Alt+5')
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.chaosRecipeStop, 'Alt+6')
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.puzzleAnalyze, 'Alt+7')
  assert.equal(DEFAULT_GLOBAL_SHORTCUTS.priceCheck, 'Ctrl+D')
})

test('全局快捷键只接受当前格式字段', () => {
  assert.equal(mergeGlobalShortcutSettings({ stashShortcut: 'F6' }).stashStart, undefined)
  assert.equal(mergeGlobalShortcutSettings({ stashStart: 'F7' }).stashStart, undefined)
  assert.equal(mergeGlobalShortcutSettings({ unknown: 'F9' }).unknown, undefined)
})

test('统一分发器对一次触发仅执行一个对应动作', () => {
  let calls = 0
  assert.equal(dispatchShortcutAction('storyNext', { storyNext: () => { calls += 1 } }), true)
  assert.equal(calls, 1)
  assert.equal(dispatchShortcutAction('missing', { storyNext: () => { calls += 1 } }), false)
  assert.equal(calls, 1)
})

test('主进程全量注册失败时保留并恢复上一份快捷键清单', () => {
  const ipcSource = fs.readFileSync(new URL('../electron/modules/ipc/shortcut.js', import.meta.url), 'utf8')
  const managerSource = fs.readFileSync(new URL('../electron/modules/shortcuts/manager.js', import.meta.url), 'utf8')
  assert.match(ipcSource, /setConfiguredShortcuts\(entries\)/)
  assert.match(ipcSource, /rolledBack: result\.failed\.length > 0/)
  assert.match(managerSource, /previousIntended = new Map/)
  assert.match(managerSource, /previousRegistered\.forEach/)
})
