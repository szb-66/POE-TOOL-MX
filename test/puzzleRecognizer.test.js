import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const workspace = fileURLToPath(new URL('..', import.meta.url))
const python = path.join(workspace, '.runtime', 'python-runtime', 'python.exe')
const analyzer = path.join(workspace, 'src', 'assets', 'scripts', 'puzzle_analyzer.py')
const templatesPath = path.join(workspace, 'electron', 'assets', 'puzzle', 'templates.json')
const screenshot = path.join(workspace, 'test', 'fixtures', 'puzzle', 'inventory-region.png')
const emptyScreenshot = path.join(workspace, 'test', 'fixtures', 'puzzle', 'empty-region.png')

function analyze({ region, imagePath = screenshot, imageIsRegion = false } = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-recognizer-'))
  const configPath = path.join(directory, 'config.json')
  const config = {
    templatesPath,
    imagePath,
    imageIsRegion,
    requireGameForeground: false
  }
  if (region) config.region = region
  writeFileSync(configPath, JSON.stringify(config))
  try {
    const process = spawnSync(python, [analyzer, '--config', configPath], {
      encoding: 'utf8',
      env: { ...globalThis.process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
    })
    const line = process.stdout.split(/\r?\n/).find(value => value.startsWith('RESULT '))
    assert.ok(line, process.stderr || process.stdout)
    return JSON.parse(line.slice(7))
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

test('识别截图样本固定保存在仓库中', () => {
  assert.equal(existsSync(screenshot), true)
  assert.equal(existsSync(emptyScreenshot), true)
})

test('用户截图可识别五种线型、空格、锁标记和等级文本', { skip: !existsSync(python) }, () => {
  const result = analyze({ region: { left: 4, top: 4, right: 570, bottom: 954 } })
  assert.equal(result.success, true)
  assert.equal(result.slots.length, 60)
  assert.equal(result.occupiedCount, 50)
  assert.deepEqual(result.counts, { endpoint: 12, straight: 10, corner: 14, tee: 8, cross: 6 })
  assert.equal(result.slots.find(slot => slot.row === 1 && slot.column === 2).occupied, true)
  assert.equal(result.slots.find(slot => slot.row === 6 && slot.column === 3).occupied, false)
  assert.ok(Object.values(result.counts).every(count => count > 0))
  assert.deepEqual(new Set(result.slots.filter(slot => slot.type === 'straight').map(slot => slot.orientation)), new Set([0, 90]))
})

test('没有有效绿色符号时返回结构化错误', { skip: !existsSync(python) }, () => {
  const result = analyze({ imagePath: emptyScreenshot, imageIsRegion: true })
  assert.equal(result.success, false)
  assert.equal(result.error.code, 'NO_FRAGMENTS')
})

test('轻微框选偏差仍保留全部碎片并把模糊候选标为待确认', { skip: !existsSync(python) }, () => {
  const result = analyze({ imageIsRegion: true })
  assert.equal(result.success, true)
  assert.equal(result.occupiedCount, 50)
  assert.ok(result.slots.some(slot => slot.uncertain))
  assert.ok(result.warnings.length > 0)
})

test('识别模板包含五类多方向尺度基准', () => {
  const templates = JSON.parse(readFileSync(templatesPath, 'utf8'))
  assert.deepEqual(Object.keys(templates.types).sort(), ['corner', 'cross', 'endpoint', 'straight', 'tee'])
  for (const prototypes of Object.values(templates.types)) assert.ok(prototypes.length >= 2)
})

test('实时识别会自动查找、恢复并激活游戏，确认前台后才截图', () => {
  const source = readFileSync(analyzer, 'utf8')
  assert.match(source, /GAME_WINDOW_TITLES = \("流放之路", "Path of Exile"\)/)
  assert.match(source, /def find_game_window\(\)[\s\S]*user32\.EnumWindows/)
  assert.match(source, /user32\.IsIconic\(hwnd\)[\s\S]*user32\.ShowWindow\(hwnd, 9\)/)
  assert.match(source, /user32\.BringWindowToTop\(hwnd\)/)
  assert.match(source, /user32\.SetForegroundWindow\(hwnd\)/)
  const focus = source.indexOf('focused, focus_error = focus_game_window()')
  const capture = source.indexOf('image = capture_region(config["region"])')
  assert.ok(focus > 0 && capture > focus)
  assert.match(source, /GAME_WINDOW_NOT_FOUND/)
  assert.match(source, /GAME_FOCUS_FAILED/)
})
