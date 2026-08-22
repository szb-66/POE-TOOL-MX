import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
const router = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
const variables = readFileSync(new URL('../src/styles/variables.less', import.meta.url), 'utf8')
const theme = readFileSync(new URL('../src/theme/mainWindowTheme.js', import.meta.url), 'utf8')
const elementOverrides = readFileSync(new URL('../src/styles/element-override.less', import.meta.url), 'utf8')
const commonStyles = readFileSync(new URL('../src/styles/common.less', import.meta.url), 'utf8')

function noLayoutRoutePaths(source) {
  const normalized = source.replace(/\r\n?/g, '\n')
  const routeStarts = [...normalized.matchAll(/\n  \{\n    path: '([^']+)'/g)]
  return routeStarts.flatMap((match, index) => {
    const end = routeStarts[index + 1]?.index ?? normalized.indexOf('\n]', match.index)
    return /noLayout:\s*true/.test(normalized.slice(match.index, end)) ? [match[1]] : []
  })
}

test('主布局首帧和路由变化挂载窗口主题类，卸载时清理', () => {
  assert.match(main, /syncMainWindowTheme\(router\.currentRoute\.value\)/)
  assert.match(app, /:class="appThemeClass"/)
  assert.match(app, /watch\(\(\) => route\.fullPath/)
  assert.match(theme, /root\.classList\.toggle\(SHARED_DARK_THEME_CLASS/)
  assert.match(theme, /MAIN_WINDOW_THEME_CLASS,[\s\S]*?BUSINESS_OVERLAY_THEME_CLASS/)
})

test('业务悬浮路由获得紧凑主题且调试和坐标选择器保持隔离', () => {
  const expectedRoutes = [
    '/puzzle-overlay', '/overlay', '/debug-overlay', '/story-overlay',
    '/bag-stash-overlay', '/chaos-recipe-overlay', '/chaos-recipe-control-overlay',
    '/coordinate-picker', '/price-check-overlay'
  ]
  assert.deepEqual(noLayoutRoutePaths(router), expectedRoutes)
  const crlfRouter = router.replace(/\r\n?/g, '\n').replace(/\n/g, '\r\n')
  assert.deepEqual(noLayoutRoutePaths(crlfRouter), expectedRoutes)
  for (const path of [
    '/puzzle-overlay', '/overlay', '/story-overlay', '/bag-stash-overlay',
    '/chaos-recipe-overlay', '/chaos-recipe-control-overlay', '/price-check-overlay'
  ]) assert.match(theme, new RegExp(`'${path.replaceAll('/', '\\/')}'`))
  assert.doesNotMatch(theme, /BUSINESS_OVERLAY_ROUTES[\s\S]*?'\/debug-overlay'/)
  assert.doesNotMatch(theme, /BUSINESS_OVERLAY_ROUTES[\s\S]*?'\/coordinate-picker'/)
  assert.match(app, /<router-view v-else \/>/)
})

test('共享深色变量与紧凑悬浮密度使用独立作用域', () => {
  assert.match(variables, /html\.app-dark-theme\s*\{/)
  assert.match(variables, /--app-bg:\s*#0E1013/)
  assert.match(variables, /--brand-color:\s*#C5A46D/)
  assert.match(variables, /--el-color-primary:\s*#C5A46D/)
  assert.match(variables, /html\.business-overlay-theme,\s*\n\.business-overlay-theme\s*\{[\s\S]*?--overlay-space-1:\s*4px;[\s\S]*?--overlay-control-height:\s*26px;/)
  assert.doesNotMatch(variables, /localStorage|sessionStorage|theme-setting|prefers-color-scheme/)
})

test('深色按钮沿用组件库类型并提供统一交互状态', () => {
  for (const type of ['primary', 'success', 'warning', 'danger', 'info']) {
    assert.match(elementOverrides, new RegExp(`&\\.el-button--${type}\\s*\\{\\s*--theme-button-accent:`))
  }
  assert.match(elementOverrides, /&:not\(\.is-disabled\):hover\s*\{[\s\S]*?background:\s*var\(--surface-hover\)/)
  assert.match(elementOverrides, /&:not\(\.is-text\):not\(\.is-link\):not\(\.is-plain\)\s*\{[\s\S]*?&:not\(\.is-disabled\):hover/)
  assert.match(elementOverrides, /&\.is-plain\s*\{[\s\S]*?&:not\(\.is-disabled\):hover/)
  assert.match(elementOverrides, /&\.is-text\s*\{[\s\S]*?&:not\(\.is-disabled\):hover/)
  assert.match(elementOverrides, /&\.is-link\s*\{[\s\S]*?&:not\(\.is-disabled\):hover/)
  assert.match(elementOverrides, /&:not\(\.is-disabled\):active\s*\{[\s\S]*?transform:\s*translateY\(1px\)/)
  assert.match(elementOverrides, /&\.is-disabled\s*\{\s*opacity:\s*\.48;\s*transform:\s*none/)
  assert.doesNotMatch(elementOverrides, /&\.el-button--danger\s*\{\s*border-color:/)
})

test('深色输入框聚焦时只由外层控件显示品牌色边框', () => {
  assert.match(elementOverrides, /\.el-input__wrapper\.is-focus,[\s\S]*?\.el-select__wrapper\.is-focused,[\s\S]*?\.el-textarea__inner:focus/)
  assert.match(elementOverrides, /box-shadow:\s*0 0 0 1px var\(--brand-color\) inset !important/)
  assert.match(commonStyles, /:focus-visible:not\(\.el-input__inner\):not\(\.el-select__input\):not\(\.el-cascader__search-input\):not\(\.el-textarea__inner\)/)
  assert.match(commonStyles, /\.el-input__inner:focus-visible,[\s\S]*?\.el-select__input:focus-visible,[\s\S]*?\.el-cascader__search-input:focus-visible,[\s\S]*?\.el-textarea__inner:focus-visible\s*\{\s*outline:\s*none/)
})

test('深色选择器选项提供鼠标与键盘悬浮状态', () => {
  assert.match(elementOverrides, /\.el-select-dropdown__item\s*\{[\s\S]*?&:not\(\.is-disabled\):hover,[\s\S]*?&\.is-hovering:not\(\.is-disabled\)/)
  assert.match(elementOverrides, /background:\s*var\(--surface-hover\);[\s\S]*?color:\s*var\(--text-primary\)/)
  assert.match(elementOverrides, /&\.is-selected\s*\{[\s\S]*?background:\s*color-mix\(in srgb, var\(--brand-color\) 14%, var\(--surface-2\)\)/)
})
