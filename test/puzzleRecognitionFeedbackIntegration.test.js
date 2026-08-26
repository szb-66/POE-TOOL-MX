import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('识别反馈窗口在主进程预热、注入服务并随服务退出销毁', () => {
  const main = source('../electron/main.js')
  const service = source('../electron/modules/puzzle/service.js')
  assert.match(main, /new RecognitionFeedbackOverlayManager\(\{ BrowserWindowClass: BrowserWindow, screenApi: screen \}\)/)
  assert.match(main, /recognitionFeedbackOverlay\.prime\(\)/)
  assert.match(main, /feedbackOverlay: recognitionFeedbackOverlay/)
  assert.match(service, /this\.feedbackOverlay\?\.close\?\.\(\)/)
  assert.match(service, /this\.overlay\?\.close\?\.\(\)[\s\S]*this\.feedbackOverlay\?\.close/)
})

test('碎片识别在基础校验后开始并发布逐页、准备和逐格进度', () => {
  const service = source('../electron/modules/puzzle/service.js')
  const analyze = service.slice(service.indexOf('async analyze('), service.indexOf('\n  cleanup()', service.indexOf('async analyze(')))
  const validationIndex = analyze.indexOf('validatePuzzleTabPoint')
  const runningIndex = analyze.indexOf('feedbackOverlay?.showRunning')
  const analyzerIndex = analyze.indexOf('await this.runAnalyzer')
  assert.ok(validationIndex >= 0 && validationIndex < runningIndex && runningIndex < analyzerIndex)
  assert.match(analyze, /stage: 'shape'[\s\S]*current: pageIndex \+ 1[\s\S]*total: requestedPages\.length/)
  assert.match(analyze, /occupiedTotal[\s\S]*stage: 'copy'[\s\S]*feedbackSessionId/)
  assert.match(service, /event\?\.event === 'cell-copied'[\s\S]*stage: 'copy'/)
  assert.match(service, /updateProgress\?\.\(feedbackSessionId,[\s\S]*current: progress\.index/)
})

test('边缘识别的独立与自动入口共用服务内 12 段单次结果吐司', () => {
  const service = source('../electron/modules/puzzle/service.js')
  const store = source('../src/stores/puzzle.js')
  const method = service.slice(service.indexOf('async probeBorderMods('), service.indexOf('\n  async analyze(', service.indexOf('async probeBorderMods(')))
  assert.match(method, /stage: 'border',[\s\S]*current: 0,[\s\S]*total: 12/)
  assert.equal((method.match(/showResult\?\./g) || []).length, 1)
  assert.match(method, /runBorderProbe\(normalizeAtlas, feedbackSessionId\)/)
  assert.match(store, /if \(autoProbeBorderMods\.value\)[\s\S]*await probeBorderMods\(\)/)
  assert.doesNotMatch(store, /showImmediateResult|showResult|recognitionFeedback/)
})

test('校验、锁、子进程失败和紧急停止均结束运行反馈', () => {
  const service = source('../electron/modules/puzzle/service.js')
  assert.match(service, /showFeedbackFailure\(\{ sessionId = null, displayBounds = null, error, canceled = false \}\)/)
  assert.match(service, /if \(!gate\.success\)[\s\S]*codedError\('AUTOMATION_LOCKED'[\s\S]*showFeedbackFailure/)
  assert.match(service, /copyError[\s\S]*canceled: probeGeneration !== this\.stopGeneration/)
  assert.match(service, /const canceled = stopGeneration !== this\.stopGeneration \|\| error\.code === 'EMERGENCY_STOPPED'/)
  assert.match(service, /this\.showFeedbackFailure\(\{ sessionId: feedbackSessionId, displayBounds, error, canceled \}\)/)
  assert.match(source('../electron/modules/puzzle/recognitionFeedback.js'), /status: 'stopped'[\s\S]*未完成结果未保存/)
})

test('反馈路由、预加载桥接和视图覆盖运行与四类结果状态', () => {
  const router = source('../src/router/index.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const view = source('../src/domains/puzzle/ChartRecognitionFeedbackView.vue')
  assert.match(router, /path: '\/chart-recognition-feedback'[\s\S]*noLayout: true/)
  assert.match(preload, /chart-recognition-feedback-updated/)
  assert.match(api, /onRecognitionFeedbackUpdated/)
  for (const status of ['success', 'partial', 'failure', 'stopped']) assert.match(view, new RegExp(`${status}:`))
  assert.match(view, /请勿移动鼠标/)
})
