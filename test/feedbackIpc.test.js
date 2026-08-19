import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const preload = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
const ipc = readFileSync(new URL('../electron/modules/ipc/feedback.js', import.meta.url), 'utf8')
const api = readFileSync(new URL('../src/api/electron.js', import.meta.url), 'utf8')
const component = readFileSync(new URL('../src/domains/settings/FeedbackSettings.vue', import.meta.url), 'utf8')

test('反馈IPC只暴露选择、提交和进度能力且不返回本地路径', () => {
  assert.match(preload, /feedback:pick-attachments/)
  assert.match(preload, /feedback:submit/)
  assert.match(preload, /feedback:progress/)
  assert.doesNotMatch(preload, /CloudBase.*(?:admin|management)|SecretKey|service_role/i)
  assert.match(ipc, /attachments = await feedback\.registerAttachments\(result\.filePaths\)/)
  assert.match(ipc, /assertMainWindowSender\(event, getMainWindow\)/)
  assert.match(ipc, /event\.sender !== mainWindow\.webContents/)
  assert.match(ipc, /feedback:pick-attachments[\s\S]*guarded\(/)
  assert.match(ipc, /feedback:submit[\s\S]*guarded\(/)
  assert.match(ipc, /submitFeedbackWithDiagnostics/)
  assert.match(api, /feedback:\s*\{[\s\S]*pickAttachments[\s\S]*submit[\s\S]*onProgress/)
})

test('反馈页面具备诊断默认关闭、失败保留和成功清空契约', () => {
  assert.match(component, /includeDiagnostics: false/)
  assert.match(component, /if \(!result\?\.success\)[\s\S]*submitError\.value/)
  assert.match(component, /successId\.value = result\.feedbackId[\s\S]*resetForm\(\)/)
  assert.match(component, /attachments\.value\.map\(item => item\.token\)/)
  assert.match(component, /grid-template-columns: minmax\(0, 2fr\) minmax\(280px, 1fr\)/)
})

test('反馈页面取消标题和内容最低字数提示与校验', () => {
  assert.doesNotMatch(component, /5–80|20–2000/)
  assert.match(component, /lengthOf\(form\.title\) > 80/)
  assert.match(component, /lengthOf\(form\.description\) > 2000/)
})
