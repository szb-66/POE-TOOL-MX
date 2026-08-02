import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import {
  clampRectangle,
  dipRectangleToPhysical,
  expandSearchRegion,
  getDisplayPhysicalBounds,
  hasUsefulPixelVariance,
  isRegionLargeEnough,
  normalizeRectangle,
  physicalRectangleToImageCrop
} from '../electron/modules/window/coordinates.js'
import { assertBagTemplateTarget, savePngAtomically } from '../electron/modules/bag/templateCapture.js'
import { normalizeBagSettings, validateTemplateCaptureEnvironment } from '../src/utils/bagConfig.js'

test('选区支持反向规范化、负坐标边界裁剪与最小 20×10 尺寸', () => {
  assert.deepEqual(normalizeRectangle({ x: 40, y: 30 }, { x: -20, y: 5 }), {
    left: -20, top: 5, right: 40, bottom: 30
  })
  assert.deepEqual(clampRectangle({ left: -600, top: -20, right: 100, bottom: 400 }, {
    x: -500, y: 0, width: 500, height: 300
  }), { left: -500, top: 0, right: 0, bottom: 300 })
  assert.equal(isRegionLargeEnough({ left: 0, top: 0, right: 20, bottom: 10 }), true)
  assert.equal(isRegionLargeEnough({ left: 0, top: 0, right: 19, bottom: 10 }), false)
})

test('混合 DPI 换算只使用选区窗口所在显示器并保留负物理坐标', () => {
  const converted = dipRectangleToPhysical(
    { x: -1280, y: 100 },
    { left: 10, top: 20, right: 110, bottom: 70 },
    (point) => ({ x: Math.round(point.x * 1.5), y: Math.round(point.y * 1.5) })
  )
  assert.deepEqual(converted, { left: -1905, top: 180, right: -1755, bottom: 255 })
  assert.deepEqual(getDisplayPhysicalBounds({
    bounds: { x: -1280, y: 0, width: 1280, height: 720 }, scaleFactor: 1.5
  }, 'win32', (point) => ({ x: Math.round(point.x * 1.5), y: Math.round(point.y * 1.5) })), {
    x: -1920, y: 0, width: 1920, height: 1080
  })
})

test('搜索区域四周扩展 12 物理像素并裁剪到显示器边界', () => {
  assert.deepEqual(expandSearchRegion(
    { left: -495, top: 10, right: -420, bottom: 40 },
    { x: -500, y: 0, width: 500, height: 300 }
  ), { left: -500, top: 0, right: -408, bottom: 52 })
})

test('截图 thumbnail 比例换算后仍指定物理选区为目标尺寸', () => {
  assert.deepEqual(physicalRectangleToImageCrop(
    { left: 100, top: 50, right: 300, bottom: 150 },
    { x: 0, y: 0, width: 1920, height: 1080 },
    { width: 960, height: 540 }
  ), { x: 50, y: 25, width: 100, height: 50, targetSize: { width: 200, height: 100 } })
})

test('空图与低信息像素会被拒绝', () => {
  assert.equal(hasUsefulPixelVariance(Buffer.alloc(0)), false)
  assert.equal(hasUsefulPixelVariance(Buffer.alloc(400, 60)), false)
  const varied = Buffer.alloc(400, 20)
  varied[200] = 100
  assert.equal(hasUsefulPixelVariance(varied), true)
})

test('模板保存只接受白名单目标，并在替换失败时恢复旧文件', () => {
  assert.equal(assertBagTemplateTarget('stashTitle'), 'stash_title.png')
  assert.throws(() => assertBagTemplateTarget('../../evil'), /不支持的模板目标/)
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bag-template-'))
  const target = path.join(directory, 'stash_title.png')
  fs.writeFileSync(target, 'old')
  let temporaryRenameFailed = false
  const failingFs = {
    ...fs,
    renameSync(source, destination) {
      if (source.endsWith('.tmp') && destination === target) {
        temporaryRenameFailed = true
        throw new Error('simulated replace failure')
      }
      return fs.renameSync(source, destination)
    }
  }
  try {
    assert.throws(() => savePngAtomically(directory, 'stashTitle', Buffer.from('new'), failingFs), /simulated/)
    assert.equal(temporaryRenameFailed, true)
    assert.equal(fs.readFileSync(target, 'utf8'), 'old')
    assert.equal(fs.readdirSync(directory).some((name) => name.endsWith('.tmp') || name.endsWith('.bak')), false)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

test('当前采集元数据可校验环境变化与区域尺寸，手动模板返回明确提示', () => {
  const metadata = {
    displayId: '2', scaleFactor: 1.5,
    displayPhysicalSize: { width: 1920, height: 1080 },
    templateSize: { width: 120, height: 30 },
    selectedRegion: { left: -500, top: 20, right: -380, bottom: 50 },
    capturedAt: '2026-07-21T00:00:00.000Z'
  }
  const settings = normalizeBagSettings({ templates: { stashTitle: 's.png', stashCapture: metadata } })
  assert.deepEqual(settings.templates.stashCapture, metadata)
  assert.match(validateTemplateCaptureEnvironment('仓库标题', 's.png', settings.templates.stashRegion, null, []).warning, /手动上传模板/)
  assert.match(validateTemplateCaptureEnvironment('仓库标题', 's.png', { left: 0, top: 0, right: 100, bottom: 20 }, metadata, [
    { id: '2', scaleFactor: 1.5, physicalSize: { width: 1920, height: 1080 } }
  ]).error, /小于模板尺寸/)
  assert.match(validateTemplateCaptureEnvironment('仓库标题', 's.png', { left: 0, top: 0, right: 200, bottom: 100 }, metadata, [
    { id: '2', scaleFactor: 1.25, physicalSize: { width: 1920, height: 1080 } }
  ]).error, /显示环境已变化/)
})

test('显示器 id 在重启后变化时通过物理环境与采集区域恢复匹配', () => {
  const metadata = {
    displayId: 'old-id', scaleFactor: 1.5,
    displayPhysicalSize: { width: 1920, height: 1080 },
    templateSize: { width: 120, height: 30 },
    selectedRegion: { left: -500, top: 20, right: -380, bottom: 50 },
    capturedAt: '2026-07-21T00:00:00.000Z'
  }
  const region = { left: -512, top: 8, right: -368, bottom: 62 }
  const displays = [{
    id: 'new-id', scaleFactor: 1.5,
    physicalSize: { width: 1920, height: 1080 },
    physicalBounds: { x: -1920, y: 0, width: 1920, height: 1080 }
  }]

  assert.deepEqual(validateTemplateCaptureEnvironment('仓库标题', 's.png', region, metadata, displays), {
    error: '', warning: ''
  })
})

test('显示器 id 交换后选择参数兼容且包含原采集区域的显示器', () => {
  const metadata = {
    displayId: '2', scaleFactor: 1.5,
    displayPhysicalSize: { width: 1920, height: 1080 },
    templateSize: { width: 120, height: 30 },
    selectedRegion: { left: -500, top: 20, right: -380, bottom: 50 },
    capturedAt: '2026-07-21T00:00:00.000Z'
  }
  const displays = [
    {
      id: '2', scaleFactor: 1.5,
      physicalSize: { width: 1920, height: 1080 },
      physicalBounds: { x: 0, y: 0, width: 1920, height: 1080 }
    },
    {
      id: '3', scaleFactor: 1.5,
      physicalSize: { width: 1920, height: 1080 },
      physicalBounds: { x: -1920, y: 0, width: 1920, height: 1080 }
    }
  ]

  assert.equal(validateTemplateCaptureEnvironment(
    '仓库标题', 's.png', { left: -512, top: 8, right: -368, bottom: 62 }, metadata, displays
  ).error, '')
})

test('多个兼容显示器无法由采集区域唯一确定时拒绝启动', () => {
  const metadata = {
    displayId: 'old-id', scaleFactor: 1,
    displayPhysicalSize: { width: 1920, height: 1080 },
    templateSize: { width: 120, height: 30 },
    selectedRegion: { left: 100, top: 20, right: 220, bottom: 50 },
    capturedAt: '2026-07-21T00:00:00.000Z'
  }
  const compatible = { scaleFactor: 1, physicalSize: { width: 1920, height: 1080 } }
  const result = validateTemplateCaptureEnvironment(
    '仓库标题', 's.png', { left: 88, top: 8, right: 232, bottom: 62 }, metadata,
    [{ id: '3', ...compatible }, { id: '4', ...compatible }]
  )

  assert.match(result.error, /采集显示器已不存在/)
})

test('point/region 共用互斥会话并对关闭、取消、加载失败统一单次结算', () => {
  const manager = readFileSync(new URL('../electron/modules/window/manager.js', import.meta.url), 'utf8')
  assert.match(manager, /let screenPickerSession = null/)
  assert.match(manager, /if \(!session \|\| session\.settled\) return/)
  assert.match(manager, /session\.mode !== 'point'/)
  assert.match(manager, /session\.mode !== 'region'/)
  assert.match(manager, /did-fail-load[\s\S]*settleScreenPicker/)
  assert.match(manager, /pickerWindow\.on\('closed'[\s\S]*settleScreenPicker/)
  assert.match(manager, /session\.screenshots\.clear\(\)/)
  assert.match(manager, /selectedSize\.width < minimumSize\.width/)
})

test('高级上传和手工区域修改都会清除对应采集元数据', () => {
  const store = readFileSync(new URL('../src/stores/interfaceDetection.js', import.meta.url), 'utf8')
  assert.match(store, /function setTemplate\([\s\S]*stashCapture[\s\S]*save\(\)/)
  assert.match(store, /function setTemplateRegion\([\s\S]*inventoryCapture[\s\S]*save\(\)/)
})
