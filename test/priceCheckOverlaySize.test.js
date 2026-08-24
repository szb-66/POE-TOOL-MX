import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  getDefaultPriceCheckOverlaySize,
  normalizePriceCheckOverlaySize,
  PriceCheckOverlaySizeController,
  resolvePriceCheckOverlaySize
} from '../electron/modules/priceCheck/overlaySize.js'

test('查价浮窗宽度偏好只接受有限正数并兼容旧宽高对象', () => {
  for (const value of [
    null,
    [],
    {},
    { width: 0 },
    { width: -1, height: 700 },
    { width: Infinity, height: 700 },
    { width: '600', height: 700 }
  ]) {
    assert.equal(normalizePriceCheckOverlaySize(value), null)
  }
  assert.deepEqual(normalizePriceCheckOverlaySize({ width: 600.4 }), { width: 600 })
  assert.deepEqual(
    normalizePriceCheckOverlaySize({ x: 20, y: 30, width: 600.4, height: 700.6 }),
    { width: 600 }
  )
})

test('查价浮窗使用默认或保存宽度并始终铺满当前工作区高度', () => {
  assert.deepEqual(
    getDefaultPriceCheckOverlaySize({ width: 1920, height: 1080 }),
    { width: 614, height: 1080 }
  )
  assert.deepEqual(
    resolvePriceCheckOverlaySize(null, { width: 400, height: 300 }),
    { width: 400, height: 300 }
  )
  assert.deepEqual(
    resolvePriceCheckOverlaySize({ width: 900, height: 800 }, { width: 700, height: 600 }),
    { width: 700, height: 600 }
  )
  assert.deepEqual(
    resolvePriceCheckOverlaySize({ width: 900, height: 800 }, { width: 1920, height: 1080 }),
    { width: 900, height: 1080 }
  )
})

test('用户连续横向缩放只保存最后宽度且关闭刷新待保存值', () => {
  const callbacks = new Map()
  const cancelled = []
  const saved = []
  let sequence = 0
  const controller = new PriceCheckOverlaySizeController({
    save: (size) => saved.push(size),
    schedule: (callback) => {
      const id = ++sequence
      callbacks.set(id, callback)
      return id
    },
    cancel: (id) => {
      cancelled.push(id)
      callbacks.delete(id)
    }
  })

  assert.equal(controller.queueUserResize({ x: 10, y: 20, width: 620, height: 1080 }), true)
  assert.equal(controller.queueUserResize({ x: 30, y: 40, width: 680, height: 1080 }), true)
  assert.deepEqual(cancelled, [1])
  assert.deepEqual(saved, [])

  assert.equal(controller.flush(), true)
  assert.deepEqual(cancelled, [1, 2])
  assert.deepEqual(saved, [{ width: 680 }])
  assert.equal(controller.flush(), false)
})

test('防抖结束持久化宽度并在不同显示器恢复各自满高布局', () => {
  let preferredSize = { width: 777, height: 666 }
  let scheduled = null
  const first = new PriceCheckOverlaySizeController({
    load: () => preferredSize,
    save: (size) => { preferredSize = size },
    schedule: (callback) => {
      scheduled = callback
      return 1
    },
    cancel: () => {}
  })

  assert.deepEqual(first.resolve({ width: 1920, height: 1080 }), { width: 777, height: 1080 })
  first.queueUserResize({ x: 99, y: 88, width: 820, height: 1080 })
  scheduled()
  assert.deepEqual(preferredSize, { width: 820 })

  const afterRestart = new PriceCheckOverlaySizeController({ load: () => preferredSize })
  assert.deepEqual(afterRestart.resolve({ width: 1920, height: 1080 }), { width: 820, height: 1080 })
  assert.deepEqual(afterRestart.resolve({ width: 640, height: 480 }), { width: 640, height: 480 })
  assert.deepEqual(preferredSize, { width: 820 })
})

test('无效或读取失败的宽度配置回退默认宽度和完整工作区高度', () => {
  const invalid = new PriceCheckOverlaySizeController({ load: () => ({ width: 0, height: 700 }) })
  const failed = new PriceCheckOverlaySizeController({ load: () => { throw new Error('broken state') } })
  const workArea = { width: 1600, height: 900 }
  assert.deepEqual(invalid.resolve(workArea), getDefaultPriceCheckOverlaySize(workArea))
  assert.deepEqual(failed.resolve(workArea), getDefaultPriceCheckOverlaySize(workArea))
})

test('查价浮窗锁定工作区高度且仅从用户缩放事件保存宽度', async () => {
  const [overlay, state] = await Promise.all([
    readFile('electron/modules/priceCheck/overlay.js', 'utf8'),
    readFile('electron/modules/window/state.js', 'utf8')
  ])

  assert.match(overlay, /minHeight: height,[\s\S]*maxHeight: height,[\s\S]*maxWidth: area\.width/)
  assert.match(overlay, /function lockPriceCheckOverlayHeight[\s\S]*setMinimumSize\(1, 1\)[\s\S]*setMaximumSize\(width, height\)[\s\S]*setMinimumSize\(1, height\)/)
  assert.match(overlay, /\.on\('will-resize',[\s\S]*sizeController\.queueUserResize\(newBounds\)/)
  assert.equal((overlay.match(/queueUserResize/g) || []).length, 1)
  assert.match(overlay, /lockPriceCheckOverlayHeight\(this\.window, area\)[\s\S]*this\.window\.setBounds\(getPriceCheckOverlayBounds\([\s\S]*cursor,[\s\S]*area,[\s\S]*width/)
  assert.equal((overlay.match(/sizeController\.flush\(\)/g) || []).length, 3)
  assert.match(overlay, /window\.on\('closed'[\s\S]*sizeController\.flush\(\)/)
  assert.match(overlay, /close\(reason[\s\S]*sizeController\.flush\(\)/)
  assert.match(overlay, /destroy\(\)[\s\S]*sizeController\.flush\(\)/)
  const persistedSize = state.match(/priceCheckOverlaySize:\s*\{[\s\S]*?\}/)?.[0] || ''
  assert.match(persistedSize, /width: size\?\.width/)
  assert.doesNotMatch(persistedSize, /\bheight:|\bx:|\by:/)
})
