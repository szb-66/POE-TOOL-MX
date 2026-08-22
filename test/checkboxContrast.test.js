import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const variables = readFileSync(new URL('../src/styles/variables.less', import.meta.url), 'utf8')
const elementOverrides = readFileSync(new URL('../src/styles/element-override.less', import.meta.url), 'utf8')
const priceOverlay = readFileSync(new URL('../src/domains/priceCheck/PriceCheckOverlayView.vue', import.meta.url), 'utf8')

function themeColor(name) {
  const themeStart = variables.indexOf('html.app-dark-theme')
  const match = variables.slice(themeStart).match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`))
  assert.ok(match, `缺少主题颜色 --${name}`)
  return match[1]
}

function rgb(hex) {
  return hex.match(/[0-9a-f]{2}/gi).map(value => Number.parseInt(value, 16))
}

function luminance(hex) {
  const channels = rgb(hex).map((value) => {
    const channel = value / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(foreground, background) {
  const foregroundLuminance = luminance(foreground)
  const backgroundLuminance = luminance(background)
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
}

function expectNonTextContrast(label, foreground, background) {
  assert.ok(contrast(foreground, background) >= 3, `${label} 未达到 WCAG 1.4.11 的 3:1`)
}

test('复选框勾选标记、勾选底色与焦点环达到非文本对比度要求', () => {
  const checkedBackground = themeColor('checkbox-checked-bg')
  const checkmark = themeColor('checkbox-check-color')
  const focusRing = themeColor('checkbox-focus-ring')

  expectNonTextContrast('勾选标记', checkmark, checkedBackground)
  for (const surface of ['app-bg', 'surface-1', 'surface-2'].map(themeColor)) {
    expectNonTextContrast('勾选框', checkedBackground, surface)
    expectNonTextContrast('键盘焦点环', focusRing, surface)
  }
})

test('Element Plus 的勾选、半选和键盘焦点状态统一使用无障碍主题令牌', () => {
  assert.match(elementOverrides, /--el-checkbox-checked-bg-color:\s*var\(--checkbox-checked-bg\)/)
  assert.match(elementOverrides, /--el-checkbox-checked-icon-color:\s*var\(--checkbox-check-color\)/)
  assert.match(elementOverrides, /input:focus-visible\s*\+\s*\.el-checkbox__inner/)
  assert.match(elementOverrides, /outline:\s*2px solid var\(--checkbox-focus-ring\)/)
})

test('查价悬浮窗的原生复选框使用同一套勾选和焦点样式', () => {
  assert.match(priceOverlay, /\.check-label input\[type=['"]checkbox['"]\]\s*\{[^}]*appearance:\s*none/s)
  assert.match(priceOverlay, /\.check-label input\[type=['"]checkbox['"]\]:checked\s*\{[^}]*var\(--checkbox-checked-bg\)/s)
  assert.match(priceOverlay, /\.check-label input\[type=['"]checkbox['"]\]:checked::after\s*\{[^}]*var\(--checkbox-check-color\)/s)
  assert.match(priceOverlay, /\.check-label input\[type=['"]checkbox['"]\]:focus-visible\s*\{[^}]*var\(--checkbox-focus-ring\)/s)
})
