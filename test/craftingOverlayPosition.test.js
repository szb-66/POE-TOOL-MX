import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { getCraftingOverlayBounds } from '../electron/modules/window/craftingOverlayPosition.js'

function source(path) {
  return fs.readFileSync(new URL(path, import.meta.url), 'utf8')
}

const size = Object.freeze({ width: 300, height: 400 })
const displays = [
  {
    id: 1,
    primary: true,
    workArea: { x: 0, y: 0, width: 1920, height: 1040 }
  },
  {
    id: 2,
    primary: false,
    workArea: { x: -1280, y: -100, width: 1280, height: 1024 }
  }
]

test('制作悬浮窗恢复主屏和负坐标副屏内的有效位置并保持规范尺寸', () => {
  assert.deepEqual(getCraftingOverlayBounds({ x: 120, y: 80, width: 999, height: 999 }, displays, size), {
    x: 120,
    y: 80,
    ...size
  })
  assert.deepEqual(getCraftingOverlayBounds({ x: -1200, y: -80 }, displays, size), {
    x: -1200,
    y: -80,
    ...size
  })
})

test('制作悬浮窗忽略损坏位置并回退到主屏工作区右上角', () => {
  const expected = { x: 1600, y: 20, ...size }
  assert.deepEqual(getCraftingOverlayBounds(null, displays, size), expected)
  assert.deepEqual(getCraftingOverlayBounds({ x: 'invalid', y: 20 }, displays, size), expected)
  assert.deepEqual(getCraftingOverlayBounds({ x: 20, y: Number.NaN }, displays, size), expected)
})

test('制作悬浮窗在原显示器移除或保存位置不完整可见时回退', () => {
  const primaryOnly = [displays[0]]
  const expected = { x: 1600, y: 20, ...size }
  assert.deepEqual(getCraftingOverlayBounds({ x: -1200, y: -80 }, primaryOnly, size), expected)
  assert.deepEqual(getCraftingOverlayBounds({ x: 1800, y: 900 }, displays, size), expected)
})

test('制作悬浮窗缺少显示器信息时使用安全默认工作区', () => {
  assert.deepEqual(getCraftingOverlayBounds(undefined, [], size), {
    x: 1600,
    y: 20,
    ...size
  })
})

test('制作悬浮窗创建时恢复位置、移动后防抖保存并在关闭前刷新', () => {
  const manager = source('../electron/modules/window/manager.js')
  assert.match(manager, /getCraftingOverlayBounds\(\s*loadWindowState\(\)\.craftingOverlayBounds,\s*displays,\s*CRAFTING_OVERLAY_SIZE\s*\)/)
  assert.match(manager, /craftingWindow\.on\('move',[\s\S]*setTimeout\(savePosition, 250\)/)
  assert.match(manager, /craftingWindow\.on\('close', savePosition\)/)
  assert.match(manager, /saveWindowState\(\{ craftingOverlayBounds: \{ x, y \} \}\)/)
})

test('窗口状态保存继续合并已有字段且制作拖拽 IPC 契约保持不变', () => {
  const state = source('../electron/modules/window/state.js')
  const ipc = source('../electron/modules/ipc/window.js')
  assert.match(state, /const newState = \{ \.\.\.currentState, \.\.\.state \}/)
  assert.match(ipc, /ipcMain\.on\('crafting-overlay-move', \(event, point = \{\}\) => \{/)
  assert.match(ipc, /overlay\.webContents !== event\.sender/)
  assert.match(ipc, /window\.moveCraftingOverlayTo\(requested\)/)
})
