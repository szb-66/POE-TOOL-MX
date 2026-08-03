import test from 'node:test'
import assert from 'node:assert/strict'
import {
  addOverlayBackgroundHistory,
  OVERLAY_BACKGROUND_MODES,
  isSupportedOverlayBackground,
  normalizeOverlaySettings,
  overlayBackgroundMedia,
  resolveOverlayBackgroundDrop
} from '../shared/overlayBackground.js'

test('旧覆盖层背景设置会迁移为显式模式', () => {
  assert.equal(normalizeOverlaySettings({ backgroundPath: 'C:\\bg.webp' }).backgroundMode, OVERLAY_BACKGROUND_MODES.custom)
  assert.equal(normalizeOverlaySettings({ backgroundPath: '' }).backgroundMode, OVERLAY_BACKGROUND_MODES.default)
})

test('无背景和默认背景不保留无效的自定义路径', () => {
  assert.deepEqual(
    normalizeOverlaySettings({ backgroundMode: 'none', backgroundPath: 'C:\\old.png', blur: 2, maskOpacity: 0.3 }),
    { backgroundMode: 'none', backgroundPath: '', blur: 2, maskOpacity: 0.3 }
  )
  assert.equal(normalizeOverlaySettings({ backgroundMode: 'custom', backgroundPath: '' }).backgroundMode, 'default')
})

test('背景媒体决策区分默认、无背景、图片和视频', () => {
  assert.equal(overlayBackgroundMedia({ backgroundMode: 'default' }), 'default')
  assert.equal(overlayBackgroundMedia({ backgroundMode: 'none' }), 'none')
  assert.equal(overlayBackgroundMedia({ backgroundMode: 'custom', backgroundPath: 'D:\\bg.PNG' }), 'image')
  assert.equal(overlayBackgroundMedia({ backgroundMode: 'custom', backgroundPath: 'D:\\bg.webm' }), 'video')
})

test('背景格式白名单与文件选择器保持一致', () => {
  for (const extension of ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'ogg', 'mov']) {
    assert.equal(isSupportedOverlayBackground(`background.${extension}`), true)
  }
  assert.equal(isSupportedOverlayBackground('background.svg'), false)
  assert.equal(isSupportedOverlayBackground('background.png.exe'), false)
})

test('历史记录只添加自定义路径、去重置顶并限制六项', () => {
  const original = Array.from({ length: 6 }, (_, index) => ({ path: `${index}.png` }))
  assert.deepEqual(addOverlayBackgroundHistory(original, ''), original)
  assert.deepEqual(addOverlayBackgroundHistory(original, '2.png')[0], { path: '2.png' })
  const next = addOverlayBackgroundHistory(original, 'new.png')
  assert.equal(next.length, 6)
  assert.equal(next[0].path, 'new.png')
  assert.equal(next.some(item => item.path === '5.png'), false)
})

test('拖拽解析拒绝多文件和无本地路径', () => {
  assert.equal(resolveOverlayBackgroundDrop([], () => '').error.code, 'BACKGROUND_FILE_COUNT')
  assert.equal(resolveOverlayBackgroundDrop([{}, {}], () => '').error.code, 'BACKGROUND_FILE_COUNT')
  assert.equal(resolveOverlayBackgroundDrop([{}], () => '').error.code, 'BACKGROUND_PATH_REQUIRED')
  assert.deepEqual(resolveOverlayBackgroundDrop([{ name: 'bg.png' }], () => 'C:\\bg.png'), {
    success: true,
    sourcePath: 'C:\\bg.png'
  })
})
