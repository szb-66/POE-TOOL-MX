import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getRendererDiagnosticContext, setRendererDiagnosticContext } from '../src/utils/diagnosticContext.js'

const dashboard = readFileSync(new URL('../src/domains/dashboard/DashboardView.vue', import.meta.url), 'utf8')
const feedback = readFileSync(new URL('../src/domains/settings/FeedbackSettings.vue', import.meta.url), 'utf8')
const controller = readFileSync(new URL('../src/composables/useDiagnostics.js', import.meta.url), 'utf8')

test('首页移除诊断入口且问题反馈页完整接管诊断操作', () => {
  assert.doesNotMatch(dashboard, /导出当前诊断|开始诊断会话|结束并导出|取消会话/)
  assert.match(dashboard, /刷新状态/)
  assert.match(feedback, /导出当前诊断/)
  assert.match(feedback, /开始诊断会话/)
  assert.match(feedback, /结束并导出/)
  assert.match(feedback, /取消会话/)
  assert.match(feedback, /prepareDiagnosticCaptureForFeedback/)
  assert.match(feedback, /diagnosticCaptureId: prepared\.captureId/)
})

test('本地导出不清理会话且只有反馈成功清除前端会话', () => {
  const exportStart = controller.indexOf('async function exportDiagnostics')
  const exportEnd = controller.indexOf('async function finishAndExportDiagnosticCapture')
  const exportBlock = controller.slice(exportStart, exportEnd)
  assert.doesNotMatch(exportBlock, /cancelDiagnosticCapture|cancelCapture/)
  assert.match(feedback, /if \(!result\?\.success\)[\s\S]*return[\s\S]*clearSubmittedDiagnosticCapture\(prepared\.captureId\)/)
})

test('渲染器诊断上下文只保留结构化白名单字段并返回副本', () => {
  setRendererDiagnosticContext({
    modules: [{ id: 'items', state: 'attention', reasonCode: 'invalid_configuration', text: 'secret' }],
    rendererHealth: [{ id: 'dpi', status: 'ready', reasonCode: '', path: 'C:\\private' }]
  })
  const first = getRendererDiagnosticContext()
  assert.deepEqual(first, {
    modules: [{ id: 'items', state: 'attention', reasonCode: 'invalid_configuration' }],
    rendererHealth: [{ id: 'dpi', status: 'ready' }]
  })
  first.modules[0].state = 'error'
  assert.equal(getRendererDiagnosticContext().modules[0].state, 'attention')
})
