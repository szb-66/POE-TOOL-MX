import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  DEFAULT_GAME_WINDOW_TITLES,
  DEFAULT_GAME_WINDOW_PROCESS_NAMES,
  gameWindowTitlePriority,
  isGameWindowCandidate,
  isGameWindowProcessName,
  normalizeGameWindowProcessNames,
  normalizeGameWindowTitles,
  validateGameWindowProcessNames,
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

test('游戏客户端进程名使用不区分大小写的精确匹配并拒绝无效列表', () => {
  assert.deepEqual(validateGameWindowProcessNames(['PathOfExile.exe', '  PathOfExile_x64.exe  ']).processNames, ['PathOfExile.exe', 'PathOfExile_x64.exe'])
  assert.deepEqual(validateGameWindowProcessNames(['C:\\Games\\Path of Exile\\PathOfExile.exe']).processNames, ['PathOfExile.exe'])
  assert.equal(validateGameWindowProcessNames([]).valid, false)
  assert.equal(validateGameWindowProcessNames(['  ']).valid, false)
  assert.equal(validateGameWindowProcessNames(['pathofexile.exe', 'PathOfExile.exe']).valid, false)
  assert.deepEqual(normalizeGameWindowProcessNames(null), [...DEFAULT_GAME_WINDOW_PROCESS_NAMES])
  assert.ok(DEFAULT_GAME_WINDOW_PROCESS_NAMES.includes('PathOfExileEGS.exe'))
  assert.ok(DEFAULT_GAME_WINDOW_PROCESS_NAMES.includes('PathOfExile_x64EGS.exe'))
  assert.equal(isGameWindowProcessName('C:\\Games\\Path of Exile\\PathOfExile.exe'), true)
  assert.equal(isGameWindowProcessName('chrome.exe'), false)
})

test('窗口只有在标题与进程名同时匹配时才识别为游戏窗口', () => {
  assert.equal(isGameWindowCandidate('Path of Exile 编年史 - Google Chrome', 'chrome.exe'), false)
  assert.equal(isGameWindowCandidate('Season - PATH OF EXILE', 'PathOfExile.exe'), true)
  assert.equal(isGameWindowCandidate('普通窗口', 'PathOfExile.exe'), false)
  assert.equal(isGameWindowCandidate('流放之路', 'PathOfExile_x64.exe'), true)
})

test('主进程注册表原子更新固定共享文件并保留有序列表', t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'poe-window-titles-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const environment = {}
  const registry = new GameWindowTitleRegistry({ userDataPath: directory, environment })
  registry.initialize()
  assert.equal(environment[GAME_WINDOW_TITLES_ENV], path.join(directory, 'game-window-titles.json'))
  const result = registry.update(['第二客户端', '第一客户端'])
  assert.deepEqual(result.titles, ['第二客户端', '第一客户端'])
  assert.deepEqual(result.processNames, [...DEFAULT_GAME_WINDOW_PROCESS_NAMES])
  const saved = JSON.parse(readFileSync(environment[GAME_WINDOW_TITLES_ENV], 'utf8'))
  assert.deepEqual(saved, {
    version: 2,
    titles: ['第二客户端', '第一客户端'],
    processNames: [...DEFAULT_GAME_WINDOW_PROCESS_NAMES]
  })
})

test('旧版配置缺少进程名时自动补齐默认列表', t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'poe-window-titles-legacy-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const filePath = path.join(directory, 'game-window-titles.json')
  writeFileSync(filePath, JSON.stringify({ version: 1, titles: ['流放之路', 'Path of Exile'] }), 'utf8')
  const registry = new GameWindowTitleRegistry({ userDataPath: directory })
  registry.initialize()
  assert.deepEqual(registry.getTitles(), ['流放之路', 'Path of Exile'])
  assert.deepEqual(registry.getProcessNames(), [...DEFAULT_GAME_WINDOW_PROCESS_NAMES])
})

test('进程名列表可独立更新并持久化，写入失败时保留上一份内存配置', t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'poe-window-process-names-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const registry = new GameWindowTitleRegistry({ userDataPath: directory })
  registry.initialize()
  const result = registry.updateProcessNames(['PathOfExile.exe', 'CustomClient.exe'])
  assert.deepEqual(result.processNames, ['PathOfExile.exe', 'CustomClient.exe'])
  const saved = JSON.parse(readFileSync(path.join(directory, 'game-window-titles.json'), 'utf8'))
  assert.deepEqual(saved.processNames, ['PathOfExile.exe', 'CustomClient.exe'])

  const fileSystem = {
    writeFileSync() {},
    renameSync() { throw new Error('locked') },
    unlinkSync() {}
  }
  const failing = new GameWindowTitleRegistry({ userDataPath: directory, fileSystem, environment: {} })
  failing.titles = ['流放之路']
  failing.processNames = ['PathOfExile.exe']
  assert.throws(() => failing.updateProcessNames(['PathOfExile_x64.exe']), /locked/)
  assert.deepEqual(failing.getProcessNames(), ['PathOfExile.exe'])
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
  const runtime = source('../src/startup/mainRuntime.js')
  const view = source('../src/domains/settings/SettingsView.vue')
  const editor = source('../src/domains/settings/GameWindowTitleSettings.vue')
  assert.match(store, /gameWindowTitles: gameWindowTitles\.value/)
  assert.match(store, /gameWindowProcessNames: gameWindowProcessNames\.value/)
  assert.match(store, /normalizeGameWindowTitles\(data\.gameWindowTitles\)/)
  assert.match(store, /normalizeGameWindowProcessNames\(data\.gameWindowProcessNames\)/)
  assert.match(store, /gameWindowTitles\.value = \[\.\.\.DEFAULT_GAME_WINDOW_TITLES\]/)
  assert.match(store, /gameWindowProcessNames\.value = \[\.\.\.DEFAULT_GAME_WINDOW_PROCESS_NAMES\]/)
  assert.match(store, /updateGameWindowProcessNames/)
  assert.match(store, /syncGameWindowProcessNames/)
  const startupDpiSync = runtime.indexOf("settleSubsystem('dpi'")
  assert.ok(runtime.indexOf('await settingsStore.syncGameWindowTitles()') < startupDpiSync)
  assert.ok(runtime.indexOf('await settingsStore.syncGameWindowProcessNames()') < startupDpiSync)
  assert.match(view, /<GameWindowTitleSettings/)
  assert.match(editor, /draggable="true"/)
  assert.match(editor, /processDrafts/)
  assert.match(editor, /addProcessName/)
  assert.match(editor, /removeProcessName/)
  assert.match(editor, /commitProcessNames/)
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
  assert.match(preload, /system-update-game-window-process-names/)
  assert.match(api, /updateGameWindowTitles/)
  assert.match(api, /updateGameWindowProcessNames/)
  assert.match(systemIpc, /gameWindowTitles\.update\(titles\)/)
  assert.match(systemIpc, /gameWindowTitles\.updateProcessNames\(processNames\)/)

  const scripts = [
    'crafting_template.py',
    'map_rolling_template.py',
    'combat_assist_template.py',
    'bag_auto_stash_template.py',
    'chaos_recipe_pick_template.py',
    'stash_pickup_template.py',
    'puzzle_analyzer.py',
    'stash_tab_selector.py',
    'foreground_watcher.py'
  ].map(name => source(`../src/assets/scripts/${name}`))

  for (const script of scripts) {
    assert.match(script, /POE_GAME_WINDOW_TITLES_FILE/)
    assert.match(script, /st_mtime_ns/)
    assert.match(script, /def game_window_title_priority/)
    assert.match(script, /def game_window_process_names/)
    assert.match(script, /def window_process_name/)
    assert.match(script, /def window_matches_game/)
    assert.match(script, /processNames/)
    assert.match(script, /_game_window_titles_cache = GAME_WINDOW_TITLES/)
    assert.doesNotMatch(script, /any\([^\n]*GAME_WINDOW_TITLES/)
  }
  for (const script of scripts.slice(0, 7).filter(text => text.includes('def find_game_window') || text.includes('get_game_client_bounds'))) {
    assert.match(script, /priority = game_window_title_priority/)
    assert.match(script, /sort\(key=/)
  }
})
