import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import less from 'less'
import { themeController } from '../src/theme/useTheme.js'
import { syncMainWindowTheme, BUSINESS_OVERLAY_ROUTES } from '../src/theme/mainWindowTheme.js'
const { css } = await less.render(readFileSync(new URL('../src/styles/variables.less', import.meta.url), 'utf8'))
function tokens(selector) {
  const result = {}
  for (const block of css.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
    if (!block[1].split(',').map(s => s.trim()).includes(selector)) continue
    for (const [, key, value] of block[2].matchAll(/--([\w-]+):\s*([^;]+);/g)) result[key] = value.trim()
  }
  return result
}
const dark = tokens('html.app-dark-theme'), light = tokens('html.app-light-theme')
test('编译后的双主题令牌完整，预览独立保留深色', () => {
  const preview = tokens('.business-overlay-theme')
  for (const key of Object.keys(dark)) {
    assert.ok(light[key] || ['border-radius-sm','border-radius-md'].includes(key), `亮色缺少 ${key}`)
    assert.equal(preview[key], dark[key], `预览深色令牌 ${key}`)
  }
  assert.notEqual(light['app-bg'], dark['app-bg'])
  assert.equal(preview['overlay-control-height'], '26px')
})
function luminance(hex) {
  const [r,g,b]=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4)
  return .2126*r+.7152*g+.0722*b
}
test('亮色文字、品牌与复选框在所有表面达到对比度要求', () => {
  for(const fg of ['text-primary','text-regular','text-secondary','el-text-color-placeholder','brand-color']) {
    for(const bg of ['app-bg','surface-1','surface-2','surface-hover']) {
      const ratio=(luminance(light[bg])+.05)/(luminance(light[fg])+.05)
      assert.ok(ratio>=4.5, `${fg}/${bg}: ${ratio}`)
    }
  }
  assert.ok((luminance(light['brand-on-color'])+.05)/(luminance(light['brand-color'])+.05)>=4.5)
})
test('偏好变化同步主窗口，浮窗和选择窗口不受影响', () => {
  const previous = globalThis.document
  const classes = new Set()
  globalThis.document = { documentElement: { classList: { toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name) } } } }
  try {
    syncMainWindowTheme({path:'/',meta:{}})
    themeController.setPreference('light')
    assert.ok(classes.has('app-light-theme'))
    themeController.setPreference('dark')
    assert.ok(classes.has('app-dark-theme')); assert.ok(!classes.has('app-light-theme'))
    for(const path of BUSINESS_OVERLAY_ROUTES) {
      syncMainWindowTheme({path,meta:{noLayout:true}})
      themeController.setPreference('light')
      assert.ok(classes.has('app-dark-theme')); assert.ok(classes.has('business-overlay-theme'))
      assert.ok(!classes.has('main-window-theme'))
    }
    for(const path of ['/coordinate-picker','/debug-overlay']) {
      syncMainWindowTheme({path,meta:{noLayout:true}})
      themeController.toggle()
      assert.equal(classes.size,0)
    }
  } finally { globalThis.document = previous }
})
