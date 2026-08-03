import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  DEFAULT_GAME_WINDOW_TITLES,
  gameWindowTitlePriority,
  normalizeGameWindowTitles,
  validateGameWindowTitles
} from '../shared/gameWindowTitles.js'
import {
  GAME_WINDOW_TITLES_ENV,
  GameWindowTitleRegistry
} from '../electron/modules/system/gameWindowTitles.js'

const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('窗口名称规范化保留顺序、去除空白并拒绝无效列表', () => {
  assert.deepEqual(validateGameWindowTitles(['  自定义客户端  ', 'Path of Exile']).titles, ['自定义客户端', 'Path of Exile'])
  assert.equal(validateGameWindowTitles([]).valid, false)
  assert.equal(validateGameWindowTitles(['  ']).valid, false)
  assert.equal(validateGameWindowTitles(['Game', 'game']).valid, false)
  assert.deepEqual(normalizeGameWindowTitles(null), [...DEFAULT_GAME_WINDOW_TITLES])
})

test('标题使用不区分大小写的包含匹配并返回最早优先级', () => {
  assert.equal(gameWindowTitlePriority('Season - PATH OF EXILE', ['自定义', 'Path of Exile']), 1)
  assert.equal(gameWindowTitlePriority('自定义 Path of Exile', ['自定义', 'Path of Exile']), 0)
  assert.equal(gameWindowTitlePriority('普通窗口', ['自定义']), -1)
})

test('主进程注册表原子更新固定共享文件并保留有序列表', t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'poe-window-titles-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const environment = {}
  const registry = new GameWindowTitleRegistry({ userDataPath: directory, environment })
  registry.initialize()
  assert.equal(environment[GAME_WINDOW_TITLES_ENV], path.join(directory, 'game-window-titles.json'))
  assert.deepEqual(registry.update(['第二客户端', '第一客户端']), ['第二客户端', '第一客户端'])
  const saved = JSON.parse(readFileSync(environment[GAME_WINDOW_TITLES_ENV], 'utf8'))
  assert.deepEqual(saved, { version: 1, titles: ['第二客户端', '第一客户端'] })
})

test('共享文件写入失败时不替换上一份内存配置', () => {
  const fileSystem = {
    writeFileSync() {},
    renameSync() { throw new Error('locked') },
    unlinkSync() {}
  }
  const registry = new GameWindowTitleRegistry({ userDataPath: 'C:\\runtime', fileSystem, environment: {} })
  assert.throws(() => registry.update(['新客户端']), /locked/)
  assert.deepEqual(registry.getTitles(), [...DEFAULT_GAME_WINDOW_TITLES])
})

test('设置持久化、启动同步和编辑器覆盖新增编辑删除与拖拽', () => {
  const store = source('../src/domains/settings/settingsStore.js')
  const app = source('../src/App.vue')
  const view = source('../src/domains/settings/SettingsView.vue')
  const editor = source('../src/domains/settings/GameWindowTitleSettings.vue')
  assert.match(store, /gameWindowTitles: gameWindowTitles\.value/)
  assert.match(store, /normalizeGameWindowTitles\(data\.gameWindowTitles\)/)
  assert.match(store, /gameWindowTitles\.value = \[\.\.\.DEFAULT_GAME_WINDOW_TITLES\]/)
  assert.ok(app.indexOf('await settingsStore.syncGameWindowTitles()') < app.indexOf('settingsStore.refreshDpiScale()'))
  assert.match(view, /<GameWindowTitleSettings/)
  assert.match(editor, /draggable="true"/)
  assert.match(editor, /dropTitle\(index\)/)
  assert.match(editor, /addTitle/)
  assert.match(editor, /removeTitle\(index\)/)
  assert.match(editor, /drafts\.value = previous/)
})

test('IPC 与全部 Python 窗口识别脚本接入同一热更新契约', () => {
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const systemIpc = source('../electron/modules/ipc/system.js')
  assert.match(preload, /system-update-game-window-titles/)
  assert.match(api, /updateGameWindowTitles/)
  assert.match(systemIpc, /gameWindowTitles\.update\(titles\)/)

  const scripts = [
    'crafting_template.py',
    'map_rolling_template.py',
    'combat_assist_template.py',
    'bag_auto_stash_template.py',
    'chaos_recipe_pick_template.py',
    'stash_pickup_template.py',
    'puzzle_analyzer.py',
    'stash_tab_selector.py'
  ].map(name => source(`../src/assets/scripts/${name}`))

  for (const script of scripts) {
    assert.match(script, /POE_GAME_WINDOW_TITLES_FILE/)
    assert.match(script, /st_mtime_ns/)
    assert.match(script, /def game_window_title_priority/)
    assert.match(script, /_game_window_titles_cache = GAME_WINDOW_TITLES/)
    assert.doesNotMatch(script, /any\([^\n]*GAME_WINDOW_TITLES/)
  }
  for (const script of scripts.slice(0, 7).filter(text => text.includes('def find_game_window') || text.includes('get_game_client_bounds'))) {
    assert.match(script, /priority = game_window_title_priority/)
    assert.match(script, /sort\(key=/)
  }
})
