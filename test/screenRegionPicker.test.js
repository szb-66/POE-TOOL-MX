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

test('旧配置迁移采集元数据，环境变化、区域过小与 legacy warning 可区分', () => {
  const metadata = {
    displayId: '2', scaleFactor: 1.5,
    displayPhysicalSize: { width: 1920, height: 1080 },
    templateSize: { width: 120, height: 30 },
    selectedRegion: { left: -500, top: 20, right: -380, bottom: 50 },
    capturedAt: '2026-07-21T00:00:00.000Z'
  }
  const settings = normalizeBagSettings({ templates: { stashTitle: 's.png', stashMetadata: metadata } })
  assert.deepEqual(settings.templates.stashCapture, metadata)
  assert.match(validateTemplateCaptureEnvironment('仓库标题', 's.png', settings.templates.stashRegion, null, []).legacyWarning, /旧模板/)
  assert.match(validateTemplateCaptureEnvironment('仓库标题', 's.png', { left: 0, top: 0, right: 100, bottom: 20 }, metadata, [
    { id: '2', scaleFactor: 1.5, physicalSize: { width: 1920, height: 1080 } }
  ]).error, /小于模板尺寸/)
  assert.match(validateTemplateCaptureEnvironment('仓库标题', 's.png', { left: 0, top: 0, right: 200, bottom: 100 }, metadata, [
    { id: '2', scaleFactor: 1.25, physicalSize: { width: 1920, height: 1080 } }
  ]).error, /显示环境已变化/)
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
})

test('高级上传和手工区域修改都会清除对应采集元数据', () => {
  const store = readFileSync(new URL('../src/stores/bag.js', import.meta.url), 'utf8')
  assert.match(store, /function setTemplate\([\s\S]*clearCaptureMetadata\(type\)[\s\S]*saveSettings/)
  assert.match(store, /function setTemplateRegion\([\s\S]*clearCaptureMetadata\(type\)[\s\S]*saveSettings/)
})
