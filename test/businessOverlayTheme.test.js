import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const themedOverlays = [
  'src/domains/overlay/components/OverlayContent.vue',
  'src/domains/priceCheck/PriceCheckOverlayView.vue',
  'src/domains/story/StoryOverlayView.vue',
  'src/domains/bag/BagStashOverlayView.vue',
  'src/domains/puzzle/PuzzleOverlayView.vue',
  'src/domains/shop/ChaosRecipeOverlayView.vue',
  'src/domains/shop/ChaosRecipeControlOverlayView.vue'
]

test('七类业务悬浮内容均使用共享主题或紧凑密度令牌', () => {
  for (const path of themedOverlays) {
    const view = source(path)
    assert.match(view, /var\(--(?:overlay|surface|brand|text|border|success|warning|danger)/, `${path} 未接入共享主题`)
  }
})

test('业务悬浮密度固定为 4/6/8px、11/12px 与 26/30px', () => {
  const variables = source('src/styles/variables.less')
  assert.match(variables, /--overlay-space-1:\s*4px;/)
  assert.match(variables, /--overlay-space-2:\s*6px;/)
  assert.match(variables, /--overlay-space-3:\s*8px;/)
  assert.match(variables, /--overlay-radius-sm:\s*4px;/)
  assert.match(variables, /--overlay-radius-md:\s*6px;/)
  assert.match(variables, /--overlay-font-size:\s*12px;/)
  assert.match(variables, /--overlay-font-size-small:\s*11px;/)
  assert.match(variables, /--overlay-control-height:\s*26px;/)
  assert.match(variables, /--overlay-control-height-large:\s*30px;/)
})

test('制作悬浮窗及设置页预览都保留紧凑内容内边距', () => {
  const variables = source('src/styles/variables.less')
  const settings = source('src/domains/settings/SettingsView.vue')
  const overlayContent = source('src/domains/overlay/components/OverlayContent.vue')

  assert.match(variables, /html\.business-overlay-theme,\s*\n\.business-overlay-theme\s*\{/)
  assert.match(settings, /class="preview-box business-overlay-theme"/)
  assert.match(settings, /class="price-check-preview-shell business-overlay-theme"/)
  assert.match(settings, /<PriceCheckOverlayView[\s\S]*preview-mode/)
  assert.match(overlayContent, /\.overlay-container\s*\{[^}]*padding:\s*var\(--overlay-space-3\)/s)
})

test('视觉改造保持固定窗口尺寸与可变尺寸策略', () => {
  const manager = source('electron/modules/window/manager.js')
  const bagOverlay = source('electron/modules/window/bagOverlay.js')
  const chaosPosition = source('electron/modules/chaosRecipe/controlOverlayPosition.js')
  const priceOverlay = source('electron/modules/priceCheck/overlay.js')

  assert.match(manager, /CRAFTING_OVERLAY_SIZE = Object\.freeze\(\{ width: 300, height: 400 \}\)/)
  assert.match(manager, /let storyOverlaySize = \{ width: 460, height: 220 \}/)
  assert.match(bagOverlay, /BAG_OVERLAY_SIZE = Object\.freeze\(\{ width: 188, height: 64 \}\)/)
  assert.match(chaosPosition, /CHAOS_CONTROL_DIP_SIZE = Object\.freeze\(\{ width: 560, height: 88 \}\)/)
  assert.match(priceOverlay, /resizable:\s*true/)
})

test('调试层和坐标选择器不使用业务悬浮主题令牌', () => {
  for (const path of [
    'src/domains/overlay/DebugOverlay.vue',
    'src/domains/settings/CoordinatePickerView.vue'
  ]) assert.doesNotMatch(source(path), /--overlay-(?:space|surface|border|control)/)
})
