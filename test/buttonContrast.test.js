import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const variables = readFileSync(new URL('../src/styles/variables.less', import.meta.url), 'utf8')
const elementOverrides = readFileSync(new URL('../src/styles/element-override.less', import.meta.url), 'utf8')

function themeColor(name) {
  const themeStart = variables.indexOf('html.app-dark-theme')
  const match = variables.slice(themeStart).match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`))
  assert.ok(match, `缺少主题颜色 --${name}`)
  return match[1]
}

function rgb(hex) {
  return hex.match(/[0-9a-f]{2}/gi).map(value => Number.parseInt(value, 16))
}

function mix(foreground, ratio, background) {
  const fg = rgb(foreground)
  const bg = rgb(background)
  return fg.map((value, index) => Math.round(value * ratio + bg[index] * (1 - ratio)))
}

function luminance(color) {
  const channels = (Array.isArray(color) ? color : rgb(color)).map((value) => {
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

function expectWcagAa(label, foreground, background) {
  assert.ok(contrast(foreground, background) >= 4.5, `${label} 未达到 WCAG AA`)
}

test('深色按钮全部语义类型和交互状态达到 WCAG AA 文字对比度', () => {
  const accents = ['brand-color', 'success-color', 'warning-color', 'danger-color', 'info-color'].map(themeColor)
  const surfaces = ['app-bg', 'surface-1', 'surface-2', 'surface-hover'].map(themeColor)
  const onAccent = themeColor('brand-on-color')
  const textRegular = themeColor('text-regular')
  const textPrimary = themeColor('text-primary')
  const white = '#FFFFFF'
  const black = '#000000'

  expectWcagAa('默认按钮', textRegular, themeColor('surface-2'))
  expectWcagAa('默认按钮悬浮', textPrimary, themeColor('surface-hover'))

  for (const accent of accents) {
    expectWcagAa('实心按钮', onAccent, accent)
    expectWcagAa('实心按钮悬浮', onAccent, mix(accent, 0.84, white))
    expectWcagAa('实心按钮按下', onAccent, mix(accent, 0.94, black))
    expectWcagAa('边框按钮', mix(accent, 0.78, white), mix(accent, 0.13, themeColor('surface-1')))

    for (const surface of surfaces) {
      expectWcagAa('文字或链接按钮', mix(accent, 0.78, white), surface)
      expectWcagAa('文字或链接按钮悬浮', mix(accent, 0.72, white), mix(accent, 0.13, surface))
      expectWcagAa('文字或链接按钮按下', mix(accent, 0.72, white), mix(accent, 0.18, surface))
    }
  }

  assert.match(elementOverrides, /var\(--theme-button-accent\) 94%, black/)
  assert.match(elementOverrides, /var\(--theme-button-accent\) 78%, white/)
  assert.doesNotMatch(elementOverrides, /var\(--theme-button-accent\) (?:86|88)%, black/)
})

test('深色分段单选按钮使用高对比选中态文字', () => {
  expectWcagAa('分段单选按钮选中态', themeColor('brand-on-color'), themeColor('brand-color'))
  assert.match(elementOverrides, /--el-radio-button-checked-text-color:\s*var\(--brand-on-color\)/)
  assert.match(elementOverrides, /--el-radio-button-checked-bg-color:\s*var\(--brand-color\)/)
  assert.match(elementOverrides, /--el-radio-button-checked-border-color:\s*var\(--brand-color\)/)
})
