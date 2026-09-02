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

function analyze({ region, imagePath = screenshot, imageIsRegion = false, regionType = 'inventory', recognition, calibrationSamples, allowEmpty = false } = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-recognizer-'))
  const configPath = path.join(directory, 'config.json')
  const config = {
    templatesPath,
    imagePath,
    imageIsRegion,
    regionType,
    requireGameForeground: false
  }
  if (allowEmpty) config.allowEmpty = true
  if (recognition) config.recognition = recognition
  if (calibrationSamples) config.calibrationSamples = calibrationSamples
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

function probeAnalyzer(body) {
  const code = [
    'import importlib.util, json',
    `spec = importlib.util.spec_from_file_location("puzzle_analyzer_probe", ${JSON.stringify(analyzer)})`,
    'module = importlib.util.module_from_spec(spec)',
    'spec.loader.exec_module(module)',
    body
  ].join('\n')
  const process = spawnSync(python, ['-c', code], {
    encoding: 'utf8',
    env: { ...globalThis.process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(process.status, 0, process.stderr || process.stdout)
  const line = process.stdout.split(/\r?\n/).filter(Boolean).at(-1)
  assert.ok(line, process.stderr || process.stdout)
  return JSON.parse(line)
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

function createEmptyGridScreenshot(directory) {
  const width = 600
  const height = 1000
  const pixels = Buffer.alloc(width * height, 120)
  const fill = (left, top, right, bottom, value = 20) => {
    for (let y = top; y < bottom; y += 1) pixels.fill(value, y * width + left, y * width + right)
  }
  for (let column = 1; column < 6; column += 1) fill(column * 100 - 1, 0, column * 100 + 1, height)
  for (let row = 1; row < 10; row += 1) fill(0, row * 100 - 1, width, row * 100 + 1)
  const imagePath = path.join(directory, 'empty-grid.pgm')
  writeFileSync(imagePath, Buffer.concat([Buffer.from(`P5\n${width} ${height}\n255\n`), pixels]))
  return imagePath
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

test('用户截图只产出视觉候选、空格证据和五类方向候选', { skip: !existsSync(python) }, () => {
  const result = analyze({ region: { left: 4, top: 4, right: 570, bottom: 954 } })
  assert.equal(result.success, true)
  assert.equal(result.slots.length, 60)
  assert.equal(result.candidateCount, 50)
  assert.equal(result.occupiedCount, 0)
  assert.deepEqual(result.counts, { endpoint: 0, straight: 0, corner: 0, tee: 0, cross: 0 })
  assert.equal(result.slots.find(slot => slot.row === 1 && slot.column === 2).candidate, true)
  assert.equal(result.slots.find(slot => slot.row === 6 && slot.column === 3).candidate, false)
  const candidates = result.slots.filter(slot => slot.candidate)
  assert.ok(candidates.every(slot => slot.type === null && slot.occupied === false && slot.mask === 0))
  assert.ok(candidates.every(slot => Object.keys(slot.directionCandidates).length === 5))
  assert.ok(candidates.every(slot => Object.values(slot.directionCandidates).every(direction =>
    Number.isInteger(direction.mask) && direction.mask > 0 && direction.mask < 16 &&
    [0, 90, 180, 270].includes(direction.orientation))))
})

test('真实仓库按每种复制类型分别返回正确合法方向', { skip: !existsSync(python) }, () => {
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
    if (truth) {
      const [type, mask] = truth
      assert.equal(slot.directionCandidates[type].mask, mask, `第 ${slot.row + 1} 行第 ${slot.column + 1} 列方向错误`)
      assert.equal(slot.type, null)
    }
  }
})

test('外部确认类型只选择该类型的方向候选', { skip: !existsSync(python) }, () => {
  const result = analyze({
    imageIsRegion: true,
    recognition: { typeHints: { '0:3': 'endpoint', '0:1': 'straight' } }
  })
  const endpoint = result.slots.find(slot => slot.row === 0 && slot.column === 3)
  const straight = result.slots.find(slot => slot.row === 0 && slot.column === 1)
  assert.deepEqual([endpoint.occupied, endpoint.type, endpoint.mask, endpoint.typeSource], [true, 'endpoint', 1, 'hint'])
  assert.deepEqual([straight.occupied, straight.type, straight.mask, straight.typeSource], [true, 'straight', 5, 'hint'])
  assert.equal(result.slots.find(slot => slot.row === 0 && slot.column === 0).type, null)
})

test('低门槛绿色连通域进入疑似候选而不是扫描全部空格', { skip: !existsSync(python) }, () => {
  const result = probeAnalyzer([
    'cell = module.np.zeros((100, 100, 3), dtype=module.np.uint8)',
    'cell[8:13, 50:55] = (0, 255, 0)',
    'component = module.largest_green_component(cell, "inventory")',
    'empty = module.largest_green_component(module.np.zeros((100, 100, 3), dtype=module.np.uint8), "inventory")',
    'print(json.dumps({"state": component.get("candidateState") if component else None, "area": component.get("area") if component else 0, "empty": empty is None}))'
  ].join('\n'))
  assert.deepEqual(result, { state: 'suspect', area: 25, empty: true })
})

test('碎片候选与方向固定使用原颜色参数并移除图像类型分类门槛', () => {
  const source = readFileSync(analyzer, 'utf8')
  assert.match(source, /STANDARD_RECOGNITION\s*=\s*\{[\s\S]*"greenLower": \(35, 70, 80\)[\s\S]*"darkScale": 0\.85/)
  assert.match(source, /CALIBRATION_SIMILARITY\s*=\s*0\.965/)
  assert.doesNotMatch(source, /STRENGTH_PRESETS|"sensitive"|"strict"|confidenceThreshold|marginThreshold|def classify\(/)
})

test('分析主入口把本机校准素材传给 analyze_image', () => {
  const source = readFileSync(analyzer, 'utf8')
  assert.match(source, /config\.get\("calibrationSamples"\) or \[\]/)
})

test('实时仓库识别在截图前点击目标页签并等待稳定', () => {
  const source = readFileSync(analyzer, 'utf8')
  assert.match(source, /def click_inventory_tab\([\s\S]*SetCursorPos[\s\S]*mouse_event\(0x0002[\s\S]*mouse_event\(0x0004/)
  assert.match(source, /TAB_SWITCH_FAILED/)
  assert.match(source, /safe_hover_point\(config\["region"\], config\.get\("displayBounds"\)\)/)
  assert.doesNotMatch(source, /SetCursorPos\(0,\s*0\)/)
  const focusIndex = source.indexOf('if not is_game_foreground():')
  const clickIndex = source.indexOf('click_inventory_tab(tab_point')
  const captureIndex = source.indexOf('payload = capture_with_retries(config, templates, recognition)')
  assert.ok(focusIndex >= 0 && focusIndex < clickIndex && clickIndex < captureIndex)
  for (const candidate of [source, source.replace(/\r?\n/g, '\r\n')]) {
    const clickHelper = candidate.match(/def click_inventory_tab\([\s\S]*?\r?\n\r?\n/)?.[0] || ''
    assert.match(clickHelper, /mouse_event\(0x0004[\s\S]*SetCursorPos\(int\(hover_point\[0\]\), int\(hover_point\[1\]\)\)[\s\S]*time\.sleep/)
  }
  const main = source.match(/def main\(\)[\s\S]*?if __name__ == "__main__":/)?.[0] || ''
  assert.equal(main.match(/click_inventory_tab\(/g)?.length, 1)
})

test('安全悬停点留在当前显示器且避开识别区域和全局原点', { skip: !existsSync(python) }, () => {
  const result = probeAnalyzer([
    'single_region = {"left": 100, "top": 120, "right": 700, "bottom": 1120}',
    'single_bounds = {"x": 0, "y": 0, "width": 2560, "height": 1440}',
    'negative_region = {"left": -1850, "top": 100, "right": -1250, "bottom": 1100}',
    'negative_bounds = {"x": -1920, "y": 0, "width": 1920, "height": 1080}',
    'single = module.safe_hover_point(single_region, single_bounds)',
    'negative = module.safe_hover_point(negative_region, negative_bounds)',
    'blocked = ""',
    'try:',
    '    module.safe_hover_point({"left": 0, "top": 0, "right": 100, "bottom": 100}, {"x": 0, "y": 0, "width": 100, "height": 100})',
    'except ValueError as error:',
    '    blocked = str(error)',
    'print(json.dumps({"single": single, "negative": negative, "blocked": blocked}, ensure_ascii=False))'
  ].join('\n'))
  assert.notDeepEqual(result.single, [0, 0])
  assert.ok(result.single[0] >= 0 && result.single[0] <= 2560)
  assert.ok(result.single[1] >= 0 && result.single[1] <= 1440)
  assert.ok(result.single[0] < 100 || result.single[0] > 700 || result.single[1] < 120 || result.single[1] > 1120)
  assert.ok(result.negative[0] >= -1920 && result.negative[0] <= 0)
  assert.ok(result.negative[1] >= 0 && result.negative[1] <= 1080)
  assert.match(result.blocked, /找不到.*安全悬停点/)
})

test('切页识别只对低网格置信错误串行重读且最多三次', { skip: !existsSync(python) }, () => {
  const result = probeAnalyzer([
    'config = {"region": {"left": 0, "top": 0, "right": 600, "bottom": 1000}, "regionType": "inventory", "tabPoint": {"x": 10, "y": 10}}',
    'retryable = module.fail("EMPTY_GRID_UNCERTAIN", "retry")',
    'success = {"success": True, "occupiedCount": 5}',
    'captures = []',
    'sleeps = []',
    'def capture(region, region_type):',
    '    captures.append((region, region_type))',
    '    return len(captures)',
    'def recover(image, templates, region_type, recognition, calibration):',
    '    return retryable if image < 3 else success',
    'recovered = module.capture_with_retries(config, {}, {"allowEmpty": True}, capture, recover, sleeps.append)',
    'persistent_captures = []',
    'persistent_sleeps = []',
    'def persistent_capture(region, region_type):',
    '    persistent_captures.append(region_type)',
    '    return len(persistent_captures)',
    'persistent = module.capture_with_retries(config, {}, {"allowEmpty": True}, persistent_capture, lambda *args: retryable, persistent_sleeps.append)',
    'nonretry_captures = []',
    'def nonretry_capture(region, region_type):',
    '    nonretry_captures.append(region_type)',
    '    return 1',
    'nonretry = module.capture_with_retries(config, {}, {"allowEmpty": True}, nonretry_capture, lambda *args: module.fail("CAPTURE_EMPTY", "stop"), lambda delay: None)',
    'print(json.dumps({"recovered": recovered, "captures": len(captures), "sleeps": sleeps, "persistent": persistent, "persistentCaptures": len(persistent_captures), "persistentSleeps": persistent_sleeps, "nonretry": nonretry, "nonretryCaptures": len(nonretry_captures)}, ensure_ascii=False))'
  ].join('\n'))
  assert.equal(result.recovered.success, true)
  assert.equal(result.captures, 3)
  assert.deepEqual(result.sleeps, [0.25, 0.25])
  assert.equal(result.persistent.error.code, 'EMPTY_GRID_UNCERTAIN')
  assert.equal(result.persistentCaptures, 3)
  assert.deepEqual(result.persistentSleeps, [0.25, 0.25])
  assert.equal(result.nonretry.error.code, 'CAPTURE_EMPTY')
  assert.equal(result.nonretryCaptures, 1)
})

test('失败证据由同帧完整游戏窗口派生裁剪并记录逐次网格指标', { skip: !existsSync(python) }, () => {
  const result = probeAnalyzer([
    'import tempfile',
    'from pathlib import Path',
    'directory = tempfile.mkdtemp(prefix="puzzle-evidence-test-")',
    'config = {"region": {"left": 120, "top": 80, "right": 720, "bottom": 1080}, "displayBounds": {"x": 0, "y": 0, "width": 2560, "height": 1440}, "regionType": "inventory", "tabPoint": {"x": 10, "y": 10}, "page": 2, "evidenceId": "11111111-1111-4111-8111-111111111111", "evidenceDirectory": directory}',
    'frame_calls = []',
    'def frame_capture(_config):',
    '    frame_calls.append(1)',
    '    window = module.np.zeros((1200, 2000, 3), dtype=module.np.uint8)',
    '    crop = window[40:1040, 20:620]',
    '    return {"image": crop, "windowImage": window, "windowBounds": {"left": 100, "top": 40, "width": 2000, "height": 1200}, "monitorBounds": {"left": 0, "top": 0, "width": 2560, "height": 1440}, "actualCrop": {"left": 20, "top": 40, "width": 600, "height": 1000}}',
    'def analyzer(_image, *_args):',
    '    payload = module.fail("EMPTY_GRID_UNCERTAIN", "retry")',
    '    payload["_recognitionEvidenceMetrics"] = {"stage": "GRID_ANALYSIS", "grid": {"candidateVerticalLines": [100, 200], "candidateHorizontalLines": [80, 160], "spacing": {"x": 100, "y": 80}, "deviation": {"mean": 1, "max": 2}, "confidence": 0.4}, "occupiedCount": 0, "warningCodes": ["GRID_ALIGNMENT_LOW"]}',
    '    return payload',
    'payload = module.capture_with_retries(config, {}, {"allowEmpty": True}, analyzer=analyzer, sleeper=lambda _delay: None, frame_capture=frame_capture)',
    'evidence = payload["_failureEvidence"]',
    'headers = {item["kind"]: Path(directory, item["fileName"]).read_bytes()[:4].hex() for item in evidence["files"][:2]}',
    'print(json.dumps({"errorCode": payload["error"]["code"], "frameCalls": len(frame_calls), "attempts": evidence["attempts"], "files": evidence["files"], "headers": headers, "hasDirectory": "evidenceDirectory" in evidence}, ensure_ascii=False))'
  ].join('\n'))
  assert.equal(result.errorCode, 'EMPTY_GRID_UNCERTAIN')
  assert.equal(result.frameCalls, 3)
  assert.equal(result.attempts.length, 3)
  assert.deepEqual(result.attempts[0].actualCrop, { left: 20, top: 40, width: 600, height: 1000 })
  assert.equal(result.attempts[0].grid.confidence, 0.4)
  assert.equal(result.attempts[0].errorCode, 'EMPTY_GRID_UNCERTAIN')
  assert.equal(result.files.length, 6)
  assert.match(result.headers.window, /^ffd8ff/)
  assert.equal(result.headers.crop, '89504e47')
  assert.equal(result.hasDirectory, false)
})

test('窗口边界或图片编码不可用只降低证据完整性且不改变识别结果', { skip: !existsSync(python) }, () => {
  const result = probeAnalyzer([
    'import tempfile',
    'base = {"region": {"left": 0, "top": 0, "right": 600, "bottom": 1000}, "displayBounds": {"x": 0, "y": 0, "width": 1920, "height": 1080}, "regionType": "inventory", "tabPoint": {"x": 10, "y": 10}, "page": 1, "evidenceId": "11111111-1111-4111-8111-111111111111"}',
    'captures = []',
    'def capture(_region, _type):',
    '    captures.append(1)',
    '    return module.np.zeros((1000, 600, 3), dtype=module.np.uint8)',
    'def unavailable(_config): raise module.EvidenceCaptureUnavailable("WINDOW_BOUNDS_UNAVAILABLE")',
    'def failure(_image, *_args):',
    '    payload = module.fail("CAPTURE_EMPTY", "original")',
    '    payload["_recognitionEvidenceMetrics"] = {"stage": "CAPTURE", "grid": None, "occupiedCount": None, "warningCodes": []}',
    '    return payload',
    'first = module.capture_with_retries({**base, "evidenceDirectory": tempfile.mkdtemp()}, {}, {}, capture=capture, analyzer=failure, frame_capture=unavailable)',
    'def frame(_config):',
    '    image = module.np.zeros((1000, 600, 3), dtype=module.np.uint8)',
    '    return {"image": image, "windowImage": image, "windowBounds": {"left": 0, "top": 0, "width": 600, "height": 1000}, "monitorBounds": {"left": 0, "top": 0, "width": 1920, "height": 1080}, "actualCrop": {"left": 0, "top": 0, "width": 600, "height": 1000}}',
    'def broken_writer(*_args): raise RuntimeError("encoding")',
    'second = module.capture_with_retries({**base, "evidenceDirectory": tempfile.mkdtemp()}, {}, {}, capture=capture, analyzer=failure, frame_capture=frame, image_writer=broken_writer)',
    'print(json.dumps({"firstCode": first["error"]["code"], "firstReasons": first["_failureEvidence"]["completeness"]["reasons"], "firstStatuses": [item["status"] for item in first["_failureEvidence"]["files"]], "captures": len(captures), "secondCode": second["error"]["code"], "secondReasons": second["_failureEvidence"]["completeness"]["reasons"]}, ensure_ascii=False))'
  ].join('\n'))
  assert.equal(result.firstCode, 'CAPTURE_EMPTY')
  assert.deepEqual(result.firstReasons, ['WINDOW_BOUNDS_UNAVAILABLE'])
  assert.deepEqual(result.firstStatuses, ['missing', 'complete'])
  assert.equal(result.captures, 1)
  assert.equal(result.secondCode, 'CAPTURE_EMPTY')
  assert.deepEqual(result.secondReasons, ['IMAGE_ENCODING_FAILED'])
})

test('实时完整窗口截图严格绑定前台游戏客户区且不退化为桌面截图', () => {
  const source = readFileSync(analyzer, 'utf8').replace(/\r\n?/g, '\n')
  const capture = source.match(/def capture_game_window_frame\([\s\S]*?\n\n/)?.[0] || ''
  assert.match(capture, /GetForegroundWindow/)
  assert.match(capture, /window_matches_game/)
  assert.match(capture, /game_client_bounds/)
  assert.match(capture, /CROP_OUTSIDE_GAME_WINDOW/)
  assert.match(capture, /capture\.grab\(monitor\)/)
  assert.doesNotMatch(capture, /monitors\[0\]|capture_region/)
})

test('旧识别强度配置被静默忽略且仍能完成仓库识别', { skip: !existsSync(python) }, () => {
  const result = analyze({
    region: { left: 4, top: 4, right: 570, bottom: 954 },
    recognition: { strength: 'sensitive' }
  })
  assert.equal(result.success, true)
  assert.equal(result.candidateCount, 50)
  assert.equal(result.occupiedCount, 0)
})

test('固定基础识别可识别既有变暗样本', { skip: !existsSync(python) }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-dimmed-'))
  try {
    const dimmed = createDimmedScreenshot(directory)
    const result = analyze({ imagePath: dimmed, imageIsRegion: true })
    assert.equal(result.success, true)
    assert.equal(result.candidateCount, 50)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('方向识别使用绿色图标质心作为探针中心', () => {
  const source = readFileSync(analyzer, 'utf8')
  assert.match(source, /cellCentroid/)
  assert.match(source, /def inventory_route_topology\([\s\S]*component:/)
})

test('高相似 v2 素材只校正同类型方向，空格素材只返回无文本证据', { skip: !existsSync(python) }, () => {
  const baseline = analyze({ imageIsRegion: true })
  const target = baseline.slots.find(slot => slot.row === 0 && slot.column === 3)
  const calibrated = analyze({ imageIsRegion: true, calibrationSamples: [
    { kind: 'fragment', type: 'endpoint', labelMask: 4, featureVersion: target.featureVersion, featureVector: target.calibrationFeature },
    { kind: 'fragment', type: 'straight', labelMask: 10, featureVersion: target.featureVersion, featureVector: target.calibrationFeature },
    { kind: 'empty', type: null, labelMask: 0, featureVersion: target.featureVersion, featureVector: target.calibrationFeature }
  ] })
  const result = calibrated.slots.find(slot => slot.row === target.row && slot.column === target.column)
  assert.deepEqual([result.type, result.occupied], [null, false])
  assert.deepEqual([result.directionCandidates.endpoint.calibrated, result.directionCandidates.endpoint.mask], [true, 4])
  assert.deepEqual([result.directionCandidates.straight.calibrated, result.directionCandidates.straight.mask], [true, 10])
  assert.deepEqual(result.emptyCalibration, { matched: true, similarity: 1 })
})

test('低相似、跨类型和同类型冲突素材不改变基础方向候选', { skip: !existsSync(python) }, () => {
  const baseline = analyze({ imageIsRegion: true })
  const target = baseline.slots.find(slot => slot.row === 0 && slot.column === 3)
  const baseMask = target.directionCandidates.endpoint.mask
  const low = analyze({ imageIsRegion: true, calibrationSamples: [
    { kind: 'fragment', type: 'endpoint', labelMask: 2, featureVersion: 2, featureVector: Array(128).fill(0) }
  ] })
  assert.equal(low.slots.find(slot => slot.row === target.row && slot.column === target.column).directionCandidates.endpoint.calibrated, false)
  const conflict = analyze({ imageIsRegion: true, calibrationSamples: [
    { kind: 'fragment', type: 'endpoint', labelMask: 1, featureVersion: 2, featureVector: target.calibrationFeature },
    { kind: 'fragment', type: 'endpoint', labelMask: 2, featureVersion: 2, featureVector: target.calibrationFeature },
    { kind: 'fragment', type: 'straight', labelMask: 10, featureVersion: 2, featureVector: target.calibrationFeature }
  ] })
  const result = conflict.slots.find(slot => slot.row === target.row && slot.column === target.column)
  assert.equal(result.directionCandidates.endpoint.calibrated, false)
  assert.equal(result.directionCandidates.endpoint.mask, baseMask)
})

test('区域轻微偏移后方向掩码保持稳定', { skip: !existsSync(python) }, () => {
  const result = analyze({ region: { left: 8, top: 4, right: 574, bottom: 954 } })
  assert.equal(result.success, true)
  assert.equal(result.candidateCount, 50)
  const expected = new Map([
    ['1,4', 1], ['9,4', 2], ['2,4', 4], ['6,6', 8],
    ['1,2', 5], ['2,2', 10],
    ['4,3', 3], ['1,5', 6], ['3,5', 12], ['2,5', 9],
    ['2,6', 11], ['3,3', 7], ['10,6', 14], ['8,1', 13],
    ['1,1', 15]
  ])
  for (const slot of result.slots) {
    const truth = expected.get(`${slot.row + 1},${slot.column + 1}`)
    if (truth) {
      const type = truth === 15 ? 'cross' : ([1, 2, 4, 8].includes(truth) ? 'endpoint'
        : ([5, 10].includes(truth) ? 'straight' : ([3, 6, 12, 9].includes(truth) ? 'corner' : 'tee')))
      assert.equal(slot.directionCandidates[type].mask, truth, `第 ${slot.row + 1} 行第 ${slot.column + 1} 列方向错误`)
    }
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

test('没有可信网格和绿色符号时返回框选不确定错误', { skip: !existsSync(python) }, () => {
  const result = analyze({ imagePath: emptyScreenshot, imageIsRegion: true })
  assert.equal(result.success, false)
  assert.equal(result.error.code, 'EMPTY_GRID_UNCERTAIN')
})

test('有效空网格未允许空页时返回无碎片错误', { skip: !existsSync(python) }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-empty-grid-error-'))
  try {
    const result = analyze({ imagePath: createEmptyGridScreenshot(directory), imageIsRegion: true })
    assert.equal(result.success, false)
    assert.equal(result.error.code, 'NO_FRAGMENTS')
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('允许空页时有效空网格返回零碎片结果', { skip: !existsSync(python) }, () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'puzzle-empty-grid-'))
  try {
    const result = analyze({ imagePath: createEmptyGridScreenshot(directory), imageIsRegion: true, allowEmpty: true })
    assert.equal(result.success, true)
    assert.equal(result.occupiedCount, 0)
    assert.equal(result.slots.length, 60)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('图像初扫保留全部候选且在复制前不伪造类型', { skip: !existsSync(python) }, () => {
  const result = analyze({ imageIsRegion: true })
  assert.equal(result.success, true)
  assert.equal(result.candidateCount, 50)
  assert.ok(result.slots.filter(slot => slot.candidate).every(slot => slot.uncertain && slot.type === null))
  assert.equal(result.warnings.length, 0)
})

test('识别模板包含五类多方向尺度基准', () => {
  const templates = JSON.parse(readFileSync(templatesPath, 'utf8'))
  assert.deepEqual(Object.keys(templates.types).sort(), ['corner', 'cross', 'endpoint', 'straight', 'tee'])
  for (const prototypes of Object.values(templates.types)) assert.ok(prototypes.length >= 2)
})

test('实时识别只校验标题与进程双重前台身份，确认后才截图', () => {
  const source = readFileSync(analyzer, 'utf8')
  assert.match(source, /GAME_WINDOW_TITLES = \("流放之路", "Path of Exile"\)/)
  assert.doesNotMatch(source, /def (?:find_game_window|focus_game_window)|SetForegroundWindow/)
  assert.match(source, /def window_matches_game\([\s\S]*window_process_name/)
  const focus = source.indexOf('if not is_game_foreground():')
  const capture = source.indexOf('payload = capture_with_retries(config, templates, recognition)')
  assert.ok(focus > 0 && capture > focus)
  assert.match(source, /def capture_with_retries\([\s\S]*image = capture\(config\["region"\], region_type\)/)
  assert.match(source, /GAME_NOT_FOREGROUND/)
})
