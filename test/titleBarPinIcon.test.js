import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const titleBar = readFileSync(new URL('../src/components/Layout/TitleBar.vue', import.meta.url), 'utf8')

test('主窗口置顶按钮使用语义明确的图钉图标', () => {
  assert.match(titleBar, /class="pin-icon"/)
  assert.match(titleBar, /<path d="M8 3h8l-1 2v5l3 3v2H6v-2l3-3V5L8 3Z"/)
  assert.doesNotMatch(titleBar, /<Connection\s*\/>/)
  assert.doesNotMatch(titleBar, /\bConnection\b[^<]*from '@element-plus\/icons-vue'/)
})
