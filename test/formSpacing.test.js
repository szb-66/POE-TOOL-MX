import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('模型训练素材选择与区域状态之间保持间距', () => {
  const training = source('src/domains/bag/HighlightModelTrainingView.vue')

  assert.match(training, /<el-form-item class="training-source-field" label="素材来源">/)
  assert.match(training, /\.training-source-field :deep\(\.el-form-item__content\) \{ column-gap: 10px; \}/)
})

test('设置页开关标签以及控件说明之间保持间距', () => {
  const settings = source('src/domains/settings/SettingsView.vue')

  assert.match(settings, /\.shortcut-scope-control \{[\s\S]*?display: flex;[\s\S]*?gap: 4px 10px;/)
  assert.match(settings, /\.shortcut-scope-control \{[\s\S]*?\.hint-text \{ flex-basis: 100%; \}/)
  assert.equal((settings.match(/<el-form-item class="spaced-field"/g) || []).length, 3)
  assert.match(settings, /\.spaced-field :deep\(\.el-form-item__content\) \{ column-gap: 10px; \}/)
})
