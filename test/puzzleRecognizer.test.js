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

function analyze({ region, imagePath = screenshot, imageIsRegion = false, regionType = 'inventory', recognition } = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-recognizer-'))
  const configPath = path.join(directory, 'config.json')
  const config = {
    templatesPath,
    imagePath,
    imageIsRegion,
    regionType,
    requireGameForeground: false
  }
  if (recognition) config.recognition = recognition
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

function atlasTopologyFixture(directory) {
  const width = 600
  const height = 600
  const pixels = Buffer.alloc(width * height, 180)
  const fill = (left, top, right, bottom, value = 20) => {
    for (let y = top; y < bottom; y += 1) pixels.fill(value, y * width + left, y * width + right)
  }
  for (const edge of [199, 200, 399, 400]) {
    fill(edge, 0, edge + 1, height, 70)
    fill(0, edge, width, edge + 1, 70)
  }
  const drawRoute = (row, column, mask) => {
    const left = column * 200
    const top = row * 200
    const centerX = left + 100
    const centerY = top + 100
    fill(centerX - 4, centerY - 4, centerX + 5, centerY + 5)
    if (mask & 1) fill(centerX - 4, top + 10, centerX + 5, centerY + 1)
    if (mask & 2) fill(centerX, centerY - 4, left + 191, centerY + 5)
    if (mask & 4) fill(centerX - 4, centerY, centerX + 5, top + 191)
    if (mask & 8) fill(left + 10, centerY - 4, centerX + 1, centerY + 5)
  }
  drawRoute(0, 0, 15)
  drawRoute(0, 1, 1)
  drawRoute(0, 2, 10)
  drawRoute(1, 0, 6)
  drawRoute(1, 1, 7)
  // 模拟海图左下角的船只装饰，不能被误识别为碎片。
  fill(120, 525, 185, 570, 25)
  const imagePath = path.join(directory, 'atlas-topology.pgm')
  writeFileSync(imagePath, Buffer.concat([Buffer.from(`P5\n${width} ${height}\n255\n`), pixels]))
  return imagePath
}

function createDimmedScreenshot(directory) {
  const output = path.join(directory, 'dimmed.png')
  const code = [
    'import cv2, numpy as np',
    `src = cv2.imdecode(np.fromfile(${JSON.stringify(screenshot)}, np.uint8), cv2.IMREAD_COLOR)`,
    `dim = (src * 0.75).astype(np.uint8)`,
    `cv2.imencode('.png', dim)[1].tofile(${JSON.stringify(output)})`
  ].join(';')
  const result = spawnSync(python, ['-c', code], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } })
  assert.equal(result.status, 0, result.stderr)
  return output
}

function atlasBorderInterferenceFixture(directory) {
  const width = 600
  const height = 600
  const cellSize = 200
  const pixels = Buffer.alloc(width * height, 180)
  const fill = (left, top, right, bottom, value = 20) => {
    for (let y = top; y < bottom; y += 1) pixels.fill(value, y * width + left, y * width + right)
  }
  for (const edge of [199, 200, 399, 400]) {
    fill(edge, 0, edge + 1, height, 70)
    fill(0, edge, width, edge + 1, 70)
  }
  const drawRoute = (row, column, mask) => {
    const left = column * cellSize
    const top = row * cellSize
    const centerX = left + cellSize / 2
    const centerY = top + cellSize / 2
    fill(centerX - 4, centerY - 4, centerX + 5, centerY + 5)
    if (mask & 1) fill(centerX - 4, top + 10, centerX + 5, centerY + 1)
    if (mask & 2) fill(centerX, centerY - 4, left + 191, centerY + 5)
    if (mask & 4) fill(centerX - 4, centerY, centerX + 5, top + 191)
    if (mask & 8) fill(left + 10, centerY - 4, centerX + 1, centerY + 5)
  }
  const expectedMasks = [1, 10, 6, 15, 7, 8, 5, 12, 3]
  expectedMasks.forEach((mask, index) => drawRoute(Math.floor(index / 3), index % 3, mask))

  // 右下角的东向航线通过外框与角落装饰相连；装饰伸回中央方向探针时不能被当成南向航线。
  fill(588, 496, 596, 596)
  fill(496, 588, 596, 596)
  fill(496, 540, 505, 596)

  const imagePath = path.join(directory, 'atlas-border-interference.pgm')
  writeFileSync(imagePath, Buffer.concat([Buffer.from(`P5\n${width} ${height}\n255\n`), pixels]))
  return { imagePath, expectedMasks }
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
  assert.deepEqual(result.counts, { endpoint: 14, straight: 8, corner: 14, tee: 8, cross: 6 })
  assert.equal(result.slots.find(slot => slot.row === 1 && slot.column === 2).occupied, true)
  assert.equal(result.slots.find(slot => slot.row === 6 && slot.column === 3).occupied, false)
  assert.ok(Object.values(result.counts).every(count => count > 0))
  assert.deepEqual(new Set(result.slots.filter(slot => slot.type === 'straight').map(slot => slot.orientation)), new Set([0, 90]))
  assert.ok(result.slots.filter(slot => slot.occupied).every(slot => Number.isInteger(slot.mask) && slot.mask > 0 && slot.mask < 16))
  assert.ok(result.slots.filter(slot => slot.occupied).every(slot => [0, 90, 180, 270].includes(slot.orientation)))
})

test('真实仓库逐格识别全部有效方向而不是只返回合法角度格式', { skip: !existsSync(python) }, () => {
  const result = analyze({ region: { left: 4, top: 4, right: 570, bottom: 954 } })
  assert.equal(result.success, true)
  const expected = new Map([
    // 端点：上、右、下、左。
    ['1,4', ['endpoint', 1]], ['9,4', ['endpoint', 2]],
    ['2,4', ['endpoint', 4]], ['6,6', ['endpoint', 8]],
    // 直线：竖直、水平。
    ['1,2', ['straight', 5]], ['2,2', ['straight', 10]],
    // 拐角：东北、东南、西南、西北。
    ['4,3', ['corner', 3]], ['1,5', ['corner', 6]],
    ['3,5', ['corner', 12]], ['2,5', ['corner', 9]],
    // 三岔：缺下、缺左、缺上、缺右。
    ['2,6', ['tee', 11]], ['3,3', ['tee', 7]],
    ['10,6', ['tee', 14]], ['8,1', ['tee', 13]],
    ['1,1', ['cross', 15]],
  ])
  for (const slot of result.slots) {
    const truth = expected.get(`${slot.row + 1},${slot.column + 1}`)
    if (truth) assert.deepEqual([slot.type, slot.mask], truth, `第 ${slot.row + 1} 行第 ${slot.column + 1} 列方向错误`)
  }
})

test('识别强度预设包含三档且标准档保持默认', () => {
  const source = readFileSync(analyzer, 'utf8')
  assert.match(source, /STRENGTH_PRESETS\s*=\s*\{[\s\S]*"sensitive"[\s\S]*"standard"[\s\S]*"strict"/)
  assert.match(source, /"standard"\s*:\s*\{[\s\S]*"confidenceThreshold": 0\.72/)
  assert.match(source, /"sensitive"\s*:\s*\{[\s\S]*"confidenceThreshold": 0\.60/)
  assert.match(source, /"strict"\s*:\s*\{[\s\S]*"confidenceThreshold": 0\.82/)
})

test('分析主入口把识别强度配置传给 analyze_image', () => {
  const source = readFileSync(analyzer, 'utf8')
  assert.match(
    source,
    /analyze_image\(image, templates, str\(config\.get\("regionType", "inventory"\)\), config\.get\("recognition"\)\)/
  )
})

test('传入识别强度配置后仍能完成仓库识别', { skip: !existsSync(python) }, () => {
  const result = analyze({
    region: { left: 4, top: 4, right: 570, bottom: 954 },
    recognition: { strength: 'sensitive' }
  })
  assert.equal(result.success, true)
  assert.equal(result.occupiedCount, 50)
})

test('敏感档可识别变暗样本', { skip: !existsSync(python) }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-dimmed-'))
  try {
    const dimmed = createDimmedScreenshot(directory)
    const result = analyze({ imagePath: dimmed, imageIsRegion: true, recognition: { strength: 'sensitive' } })
    assert.equal(result.success, true)
    assert.equal(result.occupiedCount, 50)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('方向识别使用绿色图标质心作为探针中心', () => {
  const source = readFileSync(analyzer, 'utf8')
  assert.match(source, /cellCentroid/)
  assert.match(source, /def inventory_route_topology\([\s\S]*component:[\s\S]*strength:/)
})

test('区域轻微偏移后方向掩码保持稳定', { skip: !existsSync(python) }, () => {
  const result = analyze({ region: { left: 8, top: 4, right: 574, bottom: 954 } })
  assert.equal(result.success, true)
  assert.equal(result.occupiedCount, 50)
  const expected = new Map([
    ['1,4', 1], ['9,4', 2], ['2,4', 4], ['6,6', 8],
    ['1,2', 5], ['2,2', 10],
    ['4,3', 3], ['1,5', 6], ['3,5', 12], ['2,5', 9],
    ['2,6', 11], ['3,3', 7], ['10,6', 14], ['8,1', 13],
    ['1,1', 15]
  ])
  for (const slot of result.slots) {
    const truth = expected.get(`${slot.row + 1},${slot.column + 1}`)
    if (truth) assert.equal(slot.mask, truth, `第 ${slot.row + 1} 行第 ${slot.column + 1} 列方向错误`)
  }
})

test('网格置信度区分正常与偏移框选并给出低置信警告', { skip: !existsSync(python) }, () => {
  const aligned = analyze({ region: { left: 4, top: 4, right: 570, bottom: 954 } })
  const shifted = analyze({ region: { left: 8, top: 4, right: 574, bottom: 954 } })
  assert.equal(aligned.success, true)
  assert.equal(shifted.success, true)
  assert.ok(Number(aligned.gridConfidence) > Number(shifted.gridConfidence))
  assert.equal(shifted.gridAlignment, 'low')
  assert.ok(shifted.warnings.some(warning => /重新框选/.test(warning.message || warning)))
})

test('海图区使用 3×3 协议并允许空海图', { skip: !existsSync(python) }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-atlas-'))
  const configPath = path.join(directory, 'config.json')
  writeFileSync(configPath, JSON.stringify({
    templatesPath, imagePath: emptyScreenshot, imageIsRegion: true,
    regionType: 'atlas', requireGameForeground: false
  }))
  try {
    const process = spawnSync(python, [analyzer, '--config', configPath], {
      encoding: 'utf8', env: { ...globalThis.process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
    })
    const line = process.stdout.split(/\r?\n/).find(value => value.startsWith('RESULT '))
    assert.ok(line, process.stderr || process.stdout)
    const result = JSON.parse(line.slice(7))
    assert.equal(result.success, true)
    assert.equal(result.slots.length, 9)
    assert.equal(result.regionType, 'atlas')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('海图区识别黑色航线拓扑并忽略格线和船只装饰', { skip: !existsSync(python) }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-atlas-topology-'))
  try {
    const result = analyze({ imagePath: atlasTopologyFixture(directory), imageIsRegion: true, regionType: 'atlas' })
    assert.equal(result.success, true)
    assert.equal(result.occupiedCount, 5)
    assert.deepEqual(result.slots.slice(0, 5).map(slot => [slot.type, slot.mask]), [
      ['cross', 15], ['endpoint', 1], ['straight', 10], ['corner', 6], ['tee', 7]
    ])
    assert.equal(result.slots[6].occupied, false)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('海图区九格识别隔离右下角外框和角落装饰', { skip: !existsSync(python) }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-atlas-border-'))
  try {
    const { imagePath, expectedMasks } = atlasBorderInterferenceFixture(directory)
    const result = analyze({ imagePath, imageIsRegion: true, regionType: 'atlas' })
    assert.equal(result.success, true)
    assert.equal(result.occupiedCount, 9)
    assert.deepEqual(result.slots.map(slot => slot.mask), expectedMasks)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
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
  const capture = source.indexOf('image = capture_region(config["region"], str(config.get("regionType", "inventory")))')
  assert.ok(focus > 0 && capture > focus)
  assert.match(source, /GAME_WINDOW_NOT_FOUND/)
  assert.match(source, /GAME_FOCUS_FAILED/)
})
