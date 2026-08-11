import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isGameWindowTitle, selectGameWindowCandidate } from '../electron/modules/system/gameDpi.js'
import { loadDpiSettings, resolveEffectiveDpi } from '../src/utils/dpiSettings.js'

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('游戏 DPI 候选匹配中英文标题并优先配置顺序', () => {
  assert.equal(isGameWindowTitle('流放之路'), true)
  assert.equal(isGameWindowTitle('Path of Exile 2'), true)
  assert.equal(isGameWindowTitle('普通浏览器窗口'), false)
  const selected = selectGameWindowCandidate([
    { title: 'Path of Exile', processName: 'PathOfExile.exe', foreground: false, minimized: false, area: 4000, dpi: 144 },
    { title: '流放之路', processName: 'PathOfExile.exe', foreground: true, minimized: false, area: 1000, dpi: 120 }
  ])
  assert.equal(selected.title, '流放之路')
  assert.equal(selected.dpi, 120)
})

test('没有前台候选时选择最大非最小化游戏窗口', () => {
  const selected = selectGameWindowCandidate([
    { title: '流放之路', processName: 'PathOfExile_x64.exe', foreground: false, minimized: true, area: 9000, dpi: 192 },
    { title: 'Path of Exile', processName: 'PathOfExile.exe', foreground: false, minimized: false, area: 5000, dpi: 144 },
    { title: '流放之路 2', processName: 'PathOfExile_x64Steam.exe', foreground: false, minimized: false, area: 3000, dpi: 120 }
  ])
  assert.equal(selected.dpi, 120)
  assert.equal(selectGameWindowCandidate([{ title: '其他窗口', area: 9999 }]), null)
})

test('自定义名称优先级高于前台状态，同一名称内仍优先前台和面积', () => {
  const candidates = [
    { title: '低优先级客户端', processName: 'PathOfExile.exe', foreground: true, minimized: false, area: 9000, dpi: 192 },
    { title: '高优先级客户端 A', processName: 'PathOfExile.exe', foreground: false, minimized: false, area: 1000, dpi: 120 },
    { title: '高优先级客户端 B', processName: 'PathOfExile.exe', foreground: true, minimized: false, area: 500, dpi: 144 }
  ]
  assert.equal(selectGameWindowCandidate(candidates, ['高优先级', '低优先级']).dpi, 144)
  assert.equal(selectGameWindowCandidate(candidates, ['低优先级', '高优先级']).dpi, 192)
})

test('游戏最小化时仍可读取 DPI，同一名称下优先非最小化候选', () => {
  const minimized = { title: '流放之路', processName: 'PathOfExile.exe', foreground: false, minimized: true, area: 4000, dpi: 144 }
  assert.equal(selectGameWindowCandidate([minimized])?.dpi, 144)
  assert.equal(selectGameWindowCandidate([
    minimized,
    { title: '流放之路 - 可见', processName: 'PathOfExile.exe', foreground: false, minimized: false, area: 1000, dpi: 120 }
  ])?.dpi, 120)
})

test('浏览器等非游戏进程即使标题匹配也不作为 DPI 候选', () => {
  assert.equal(selectGameWindowCandidate([
    {
      title: 'Path of Exile 编年史 - Google Chrome',
      processName: 'chrome.exe',
      foreground: true,
      minimized: false,
      area: 9000,
      dpi: 144
    }
  ]), null)
  assert.equal(selectGameWindowCandidate([
    {
      title: 'Path of Exile 编年史 - Google Chrome',
      processName: 'chrome.exe',
      foreground: true,
      minimized: false,
      area: 9000,
      dpi: 144
    },
    { title: '流放之路', processName: 'PathOfExile.exe', foreground: false, minimized: false, area: 1000, dpi: 120 }
  ]).dpi, 120)
})

test('旧 DPI 设置迁移到自动模式并保留手动初值与历史回退', () => {
  assert.deepEqual(loadDpiSettings({ dpiScale: 1.5 }), {
    mode: 'auto',
    manualScale: 1.5,
    lastDetectedScale: 1.5
  })
  assert.deepEqual(loadDpiSettings({}), {
    mode: 'auto',
    manualScale: 1,
    lastDetectedScale: null
  })
})

test('有效 DPI 按手动、当前游戏、历史和主屏顺序解析', () => {
  assert.deepEqual(resolveEffectiveDpi({ mode: 'manual', manualScale: 1.75, detectedScale: 1.5 }), { scaleFactor: 1.75, source: 'manual' })
  assert.deepEqual(resolveEffectiveDpi({ mode: 'auto', detectedScale: 1.5, lastDetectedScale: 1.25, primaryScale: 1 }), { scaleFactor: 1.5, source: 'game' })
  assert.deepEqual(resolveEffectiveDpi({ mode: 'auto', lastDetectedScale: 1.25, primaryScale: 1 }), { scaleFactor: 1.25, source: 'history' })
  assert.deepEqual(resolveEffectiveDpi({ mode: 'auto', primaryScale: 1.5 }), { scaleFactor: 1.5, source: 'primary' })
})

test('启动与脚本运行前触发检测，脚本只在 pynput 回退路径使用注入倍率', () => {
  const runtime = source('../src/startup/mainRuntime.js')
  const service = source('../src/utils/scriptService.js')
  const generator = source('../src/utils/python.js')
  const crafting = source('../src/assets/scripts/crafting_template.py')
  const mapRolling = source('../src/assets/scripts/map_rolling_template.py')

  assert.match(runtime, /settingsStore\.refreshDpiScale\(\)/)
  assert.match(runtime, /window\.addEventListener\('focus', refreshGameWindowOnFocus\)/)
  assert.match(runtime, /window\.removeEventListener\('focus', refreshGameWindowOnFocus\)/)
  assert.equal((service.match(/await refreshDpiForAutomation\(settingsStore\)/g) || []).length, 2)
  assert.equal((generator.match(/'\{\{DPI_SCALE_FACTOR\}\}'/g) || []).length, 2)
  for (const template of [crafting, mapRolling]) {
    assert.match(template, /dpi_scale_factor = \{\{DPI_SCALE_FACTOR\}\}/)
    assert.doesNotMatch(template, /GetDpiForSystem/)
    assert.match(template, /SetCursorPos\(int\(x\), int\(y\)\)/)
    assert.match(template, /mouse_controller\.position = \(int\(x \/ dpi_scale_factor\), int\(y \/ dpi_scale_factor\)\)/)
  }
})
