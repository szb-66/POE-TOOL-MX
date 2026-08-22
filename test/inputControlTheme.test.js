import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const overrides = source('src/styles/element-override.less')
const variables = source('src/styles/variables.less')

test('深色主题为全部输入壳层提供统一的默认、悬浮和聚焦状态', () => {
  assert.match(variables, /--control-hover-border:\s*#[0-9A-Fa-f]{6};/)
  assert.match(overrides, /\.el-input__wrapper,\s*\.el-select__wrapper,\s*\.el-textarea__inner/)
  assert.match(overrides, /\.el-input:not\(\.is-disabled\) \.el-input__wrapper:not\(\.is-focus\):hover/)
  assert.match(overrides, /\.el-select__wrapper:not\(\.is-disabled\):not\(\.is-focused\):hover/)
  assert.match(overrides, /\.el-textarea:not\(\.is-disabled\) \.el-textarea__inner:not\(:focus\):hover/)
  assert.match(overrides, /background:\s*var\(--surface-hover\);[\s\S]*box-shadow:\s*0 0 0 1px var\(--control-hover-border\) inset;/)
})

test('业务页面不得清除输入框共享边框状态', () => {
  const mapProfile = source('src/domains/map/components/MapRollingProfilePanel.vue')
  assert.doesNotMatch(mapProfile, /\.el-input__wrapper\)[^}]*box-shadow:\s*none/)
})

test('级联选择器和远程选择器复用统一焦点与弹层选中状态', () => {
  const crafting = source('src/domains/crafting/CraftPlannerView.vue')

  assert.match(crafting, /<el-cascader[^>]*v-model="baseCategoryPath"/)
  assert.match(crafting, /<el-select[^>]*v-model="form\.baseId"[^>]*filterable remote/)
  assert.match(overrides, /\.el-cascader \.el-input\.is-focus \.el-input__wrapper/)
  assert.match(overrides, /\.el-cascader__dropdown,\s*\.el-cascader-panel\s*\{[\s\S]*--el-cascader-menu-fill:\s*var\(--surface-2\);/)
  assert.match(overrides, /\.el-cascader-node:not\(\.is-disabled\):hover,[\s\S]*\.el-cascader-node:not\(\.is-disabled\):focus/)
  assert.match(overrides, /\.el-cascader-node\.in-active-path,[\s\S]*\.el-cascader-node\.is-active,[\s\S]*\.el-cascader-node\.is-selectable\.in-checked-path/)
  assert.match(overrides, /&\.is-selected\s*\{\s*background:\s*color-mix\(in srgb, var\(--brand-color\) 14%, var\(--surface-2\)\);\s*color:\s*#D8BF92;/)
})

test('查价表单控件与快捷键录入遵循相同的悬浮和聚焦层级', () => {
  const priceOverlay = source('src/domains/priceCheck/PriceCheckOverlayView.vue')
  const keyCapture = source('src/components/common/KeyCaptureInput.vue')

  assert.match(priceOverlay, /<el-select[\s\S]*<el-input-number/)
  assert.doesNotMatch(priceOverlay, /<select\b|<input[^>]*type="number"/)
  assert.match(overrides, /\.el-select__wrapper:not\(\.is-disabled\):not\(\.is-focused\):hover/)
  assert.match(overrides, /\.el-select__wrapper\.is-focused[\s\S]*var\(--brand-color\)/)
  assert.match(keyCapture, /\.key-capture:not\(\.disabled\):hover\s*\{[^}]*var\(--surface-hover\)[^}]*var\(--control-hover-border\)/)
  assert.match(keyCapture, /\.key-capture:focus,[^\{]*\.key-capture\.capturing\s*\{[^}]*var\(--brand-color\)/)
})
