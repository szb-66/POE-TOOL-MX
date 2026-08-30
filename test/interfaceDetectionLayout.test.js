import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const view = readFileSync(new URL('../src/domains/settings/InterfaceDetectionSettings.vue', import.meta.url), 'utf8')
const field = readFileSync(new URL('../src/components/configuration/TemplateCaptureConfigurationField.vue', import.meta.url), 'utf8')

test('界面检测模板左右等分且坐标输入不会撑出卡片', () => {
  assert.match(view, /\.template-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(view, /TemplateCaptureConfigurationField/)
  assert.match(field, /\.template-capture-field\s*\{[^}]*min-width:\s*0;[^}]*box-sizing:\s*border-box/)
  assert.match(field, /\.template-capture-field__region\s*\{[^}]*min-width:\s*0;[^}]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/)
  assert.match(field, /\.template-capture-field__region :deep\(\.el-input-number\)\s*\{\s*width:\s*100%;\s*min-width:\s*0/)
  assert.match(view, /@media \(max-width:\s*900px\)[\s\S]*?\.template-grid\s*\{\s*grid-template-columns:\s*1fr/)
})
