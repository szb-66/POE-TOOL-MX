import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const preload = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
const ipc = readFileSync(new URL('../electron/modules/ipc/feedback.js', import.meta.url), 'utf8')
const api = readFileSync(new URL('../src/api/electron.js', import.meta.url), 'utf8')
const component = readFileSync(new URL('../src/domains/settings/FeedbackSettings.vue', import.meta.url), 'utf8')
const inAppFeedbackSpec = readFileSync(new URL('../openspec/specs/in-app-feedback/spec.md', import.meta.url), 'utf8')
const conversationsSpec = readFileSync(new URL('../openspec/specs/feedback-conversations/spec.md', import.meta.url), 'utf8')

test('反馈IPC只暴露选择、提交和进度能力且不返回本地路径', () => {
  assert.match(preload, /feedback:pick-attachments/)
  assert.match(preload, /feedback:submit/)
  assert.match(preload, /feedback:puzzle-evidence-summary/)
  assert.match(preload, /feedback:puzzle-evidence-discard/)
  assert.match(preload, /feedback:progress/)
  assert.match(preload, /feedback:list/)
  assert.match(preload, /feedback:conversation/)
  assert.match(preload, /feedback:reply-pick-attachments/)
  assert.match(preload, /feedback:reply/)
  assert.doesNotMatch(preload, /CloudBase.*(?:admin|management)|SecretKey|service_role/i)
  assert.match(ipc, /attachments = await feedback\.registerAttachments\(result\.filePaths\)/)
  assert.match(ipc, /assertMainWindowSender\(event, getMainWindow\)/)
  assert.match(ipc, /event\.sender !== mainWindow\.webContents/)
  assert.match(ipc, /feedback:pick-attachments[\s\S]*guarded\(/)
  assert.match(ipc, /feedback:submit[\s\S]*guarded\(/)
  assert.match(ipc, /feedback:puzzle-evidence-summary[\s\S]*guarded\(/)
  assert.match(ipc, /feedback:puzzle-evidence-discard[\s\S]*guarded\(/)
  assert.match(ipc, /feedback:list[\s\S]*guarded\(/)
  assert.match(ipc, /feedback:conversation[\s\S]*guarded\(/)
  assert.match(ipc, /feedback:reply[\s\S]*guarded\(/)
  assert.match(ipc, /submitFeedbackWithDiagnostics/)
  assert.match(api, /feedback:\s*\{[\s\S]*pickAttachments[\s\S]*submit[\s\S]*onProgress/)
})

test('反馈页披露最近海图失败证据且未授权时不提交引用', () => {
  assert.match(component, /完整游戏客户端窗口、仓库画面、实际识别裁剪图和逐次网格指标/)
  assert.match(component, /puzzleEvidence\.attemptCount/)
  assert.match(component, /puzzleEvidence\.estimatedBytes/)
  assert.match(component, /puzzleFailureEvidenceId/)
  assert.match(component, /includeDiagnostics && puzzleEvidence\.value\?\.referenceId/)
  assert.match(component, /FEEDBACK_EVIDENCE_UNAVAILABLE[\s\S]*表单和其他附件已保留/)
  assert.match(component, /取消并删除本地证据/)
  assert.doesNotMatch(component, /puzzleEvidence\.(?:path|directory)|完整本地路径/)
})

test('反馈会话界面只有进入加载和手动刷新且支持连续回复', () => {
  assert.match(component, /提交反馈/)
  assert.match(component, /我的反馈/)
  assert.match(component, /等待回复/)
  assert.match(component, /已回复/)
  assert.match(component, /已追问，等待回复/)
  assert.match(component, /手动刷新/)
  assert.match(component, /@click="refreshConversations"/)
  assert.match(component, /refreshConversations[\s\S]*Promise\.all[\s\S]*loadConversations\(\)[\s\S]*loadConversation\(selectedFeedbackId\.value\)/)
  assert.match(component, /crypto\.randomUUID\(\)/)
  assert.match(component, /replyClientMessageId/)
  assert.doesNotMatch(component, /setInterval|setTimeout/)
  assert.doesNotMatch(component, /item\.status|处理状态/)
})

test('反馈主规范不再同时要求展示和禁止展示会话历史', () => {
  assert.match(conversationsSpec, /当前安装可查看自己的反馈历史/)
  assert.doesNotMatch(inAppFeedbackSpec, /首版仅提供提交入口|SHALL NOT 在应用内展示反馈历史/)
})

test('反馈页面具备诊断默认关闭、失败保留和成功清空契约', () => {
  assert.match(component, /includeDiagnostics: false/)
  assert.match(component, /if \(!result\?\.success\)[\s\S]*submitError\.value/)
  assert.match(component, /successId\.value = result\.feedbackId[\s\S]*resetForm\(\)/)
  assert.match(component, /attachments\.value\.map\(item => item\.token\)/)
  assert.match(component, /class="feedback-grid app-grid" :gutter="16"/)
  assert.match(component, /<el-col :xs="24" :md="16">/)
  assert.match(component, /<el-col :xs="24" :md="8" tag="aside"/)
})

test('反馈页面取消标题和内容最低字数提示与校验', () => {
  assert.doesNotMatch(component, /5–80|20–2000/)
  assert.match(component, /lengthOf\(form\.title\) > 80/)
  assert.match(component, /lengthOf\(form\.description\) > 2000/)
})
