import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizePuzzleRegionMetadata, validatePuzzleRegionEnvironment } from '../src/utils/puzzleConfig.js'

const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

const metadata = {
  displayId: 'old-id',
  scaleFactor: 1.5,
  displayPhysicalBounds: { x: -1920, y: 0, width: 1920, height: 1080 },
  selectedRegion: { left: -700, top: 100, right: -100, bottom: 1050 },
  capturedAt: '2026-08-03T00:00:00.000Z'
}

test('海图区域保留物理坐标，并在相同显示环境中跨 display id 恢复', () => {
  assert.deepEqual(normalizePuzzleRegionMetadata(metadata), metadata)
  const result = validatePuzzleRegionEnvironment(metadata, [{
    id: 'new-id',
    scaleFactor: 1.5,
    physicalBounds: { x: -1920, y: 0, width: 1920, height: 1080 }
  }])
  assert.equal(result.valid, true)
})

test('显示器分辨率、DPI、区域尺寸和区域越界变化均被明确拒绝', () => {
  const changedDpi = validatePuzzleRegionEnvironment(metadata, [{
    scaleFactor: 1.25,
    physicalBounds: { x: -1920, y: 0, width: 1920, height: 1080 }
  }])
  assert.equal(changedDpi.code, 'DISPLAY_ENVIRONMENT_CHANGED')

  const outOfBounds = validatePuzzleRegionEnvironment(metadata, [{
    scaleFactor: 1.5,
    physicalBounds: { x: 0, y: 0, width: 1920, height: 1080 }
  }])
  assert.equal(outOfBounds.code, 'DISPLAY_ENVIRONMENT_CHANGED')

  const tooSmall = validatePuzzleRegionEnvironment({
    ...metadata,
    selectedRegion: { left: 0, top: 0, right: 119, bottom: 199 }
  })
  assert.equal(tooSmall.code, 'REGION_TOO_SMALL')
})

test('IPC、preload、渲染 API、路由和主进程服务使用同一分析协议', () => {
  const ipc = source('../electron/modules/ipc/puzzle.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const main = source('../electron/main.js')
  const router = source('../src/router/index.js')
  const app = source('../src/App.vue')

  for (const channel of ['puzzle-pick-inventory-region', 'puzzle-analyze']) {
    assert.match(ipc, new RegExp(channel))
    assert.match(preload, new RegExp(channel))
  }
  assert.match(preload, /puzzle-analysis-updated/)
  assert.match(api, /pickInventoryRegion:/)
  assert.match(api, /onAnalysisUpdated:/)
  assert.match(main, /new PuzzleAnalysisService/)
  assert.match(source('../electron/modules/puzzle/service.js'), /if \(this\.busy\)[\s\S]*ANALYSIS_BUSY/)
  assert.match(source('../electron/modules/puzzle/service.js'), /async analyze[\s\S]*requireGameForeground: true/)
  assert.match(source('../src/utils/scriptService.js'), /puzzleAnalyze: startPuzzleAnalysis/)
  assert.match(router, /path: '\/puzzle'/)
  assert.match(app, /router\.push\('\/puzzle'\)/)
})

test('仓库编辑、出口硬约束、来源高亮和 100 个上限均由页面状态联动', () => {
  const store = source('../src/stores/puzzle.js')
  const view = source('../src/domains/puzzle/PuzzleView.vue')
  assert.match(store, /solutionLimit: 100/)
  assert.match(store, /assignSourceSlots/)
  assert.match(store, /function updateSlot/)
  assert.match(store, /requiredExits\.value = \[\]/)
  assert.match(view, /仅展示前 100 个/)
  assert.match(view, /currentSourceSlots/)
  assert.match(view, /toggleRequiredExit/)
  assert.doesNotMatch(view, /3 秒|delayMs/)
})

test('出口三态在状态层互斥、可统一清空并按识别模式重置或保留', () => {
  const store = source('../src/stores/puzzle.js')
  assert.match(store, /const forbiddenExits = ref\(\[\]\)/)
  assert.match(store, /solvePuzzle\(\{[\s\S]*forbiddenExits: forbiddenExits\.value/)
  assert.match(store, /function toggleRequiredExit[\s\S]*forbiddenExits\.value = forbiddenExits\.value\.filter/)
  assert.match(store, /function toggleForbiddenExit[\s\S]*requiredExits\.value = requiredExits\.value\.filter/)
  const clear = store.match(/function clearExitConstraints\(\) \{([\s\S]*?)\n  \}/)?.[1] || ''
  assert.match(clear, /requiredExits\.value = \[\]/)
  assert.match(clear, /forbiddenExits\.value = \[\]/)
  assert.equal((clear.match(/recompute\(\)/g) || []).length, 1)
  const apply = store.match(/function applyAnalysis\([\s\S]*?\n  \}/)?.[0] || ''
  assert.match(apply, /if \(!preserveSolution\)/)
  assert.match(apply, /if \(resetConstraints\)[\s\S]*requiredExits\.value = \[\][\s\S]*forbiddenExits\.value = \[\]/)
})

test('出口按钮支持左右键三态、常驻清空和明确无解提示', () => {
  const view = source('../src/domains/puzzle/PuzzleView.vue')
  assert.equal((view.match(/@contextmenu\.prevent="toggleForbiddenExit\(id\)"/g) || []).length, 4)
  assert.equal((view.match(/@click="toggleRequiredExit\(id\)"/g) || []).length, 4)
  assert.match(view, /forbidden: forbiddenExits\.value\.includes\(id\)/)
  assert.match(view, /class="exit-controls"[\s\S]*左键设为必选出口，右键设为禁止出口/)
  assert.match(view, /:disabled="executing \|\| !hasExitConstraints" @click="clearExitConstraints">清空出口状态/)
  assert.match(view, /请手动调整出口状态或点击“清空出口状态”/)
  assert.match(view, /\.exit-button\.forbidden[\s\S]*var\(--el-color-danger\)[\s\S]*text-decoration: line-through/)
})

test('两个框选入口分别位于对应配置卡而非页面顶部', () => {
  const view = source('../src/domains/puzzle/PuzzleView.vue')
  const headingActions = view.match(/<div class="heading-actions">([\s\S]*?)<\/div>/)?.[1] || ''
  assert.doesNotMatch(headingActions, /框选碎片仓库|框选海图区/)
  assert.match(view, /class="configuration-actions"[\s\S]*:disabled="executing" @click="pickRegion\(config\.type\)"/)
  assert.match(view, /type: 'inventory'[\s\S]*pickLabel: '框选碎片仓库'/)
  assert.match(view, /type: 'atlas'[\s\S]*pickLabel: '框选海图区'/)
})

test('低置信度碎片保留警告但仍参与海图求解与来源分配', () => {
  const store = source('../src/stores/puzzle.js')
  const view = source('../src/domains/puzzle/PuzzleView.vue')
  assert.match(store, /counts: counts\.value/)
  assert.match(store, /assignSourceSlots\(solution, slots\.value\)/)
  assert.doesNotMatch(store, /剩余来源碎片存在待确认项/)
  assert.match(view, /auto-blocked-reason/)
  assert.match(view, /\{\{ autoPlaceBlockedReason \}\}/)
})

test('用户开始新识别时清空旧方案、格子、错误和执行进度', () => {
  const store = source('../src/stores/puzzle.js')
  const service = source('../electron/modules/puzzle/service.js')
  const reset = store.match(/function resetAnalysisState\(\) \{([\s\S]*?)\n  \}/)?.[1] || ''
  assert.match(reset, /slots\.value = emptySlots\(\)/)
  assert.match(reset, /result\.value = emptyResult\(\)/)
  assert.match(reset, /execution\.value = \{ status: 'idle'/)
  assert.match(reset, /error\.value = null/)
  assert.match(store, /if \(!preserveSolution\) resetAnalysisState\(\)/)
  assert.match(service, /if \(resetExecution\)[\s\S]*event: 'reset'/)
})

test('分析推送只负责页面通知，不重复应用 invoke 已返回的识别结果', () => {
  const store = source('../src/stores/puzzle.js')
  const listener = store.match(/function listen\(onUpdated\)\s*\{([\s\S]*?)\n  \}/)?.[1] || ''
  assert.match(listener, /onAnalysisUpdated/)
  assert.doesNotMatch(listener, /applyAnalysis/)
})

test('方案海图使用边框盒模型且为底部出口保留独立轨道', () => {
  const view = source('../src/domains/puzzle/PuzzleView.vue')
  assert.match(view, /\.solution-shell\s*\{[\s\S]*?grid-template-rows:\s*30px auto 30px;/)
  assert.match(view, /\.solution-cell\s*\{[\s\S]*?box-sizing:\s*border-box;/)
  assert.match(view, /\.bottom-exits\s*\{\s*grid-row:\s*3;/)
})

test('双区域截图预览完整等比例缩放且网格只覆盖图片可见区域', () => {
  const view = source('../src/domains/puzzle/PuzzleView.vue')
  assert.match(view, /v-if="config\.preview"[\s\S]*?class="preview-stage"[\s\S]*?<img[\s\S]*?<i class="preview-grid" \/>[\s\S]*?<\/div>/)
  assert.match(view, /--preview-aspect/)
  assert.match(view, /\.preview-stage\s*\{[\s\S]*?aspect-ratio:\s*var\(--preview-aspect\);/)
  assert.match(view, /--preview-width/)
  assert.match(view, /\.preview-stage\s*\{[\s\S]*?width:\s*min\(100%,\s*var\(--preview-width\)\);/)
  assert.match(view, /\.preview-stage img\s*\{[\s\S]*?object-fit:\s*contain;/)
  assert.doesNotMatch(view, /\.preview-shell img/)
})

test('识别资源进入资源清单但测试不触发安装包构建', () => {
  const packageConfig = JSON.parse(source('../package.json'))
  assert.ok(packageConfig.build.extraResources.some(entry => entry.to === 'puzzle_analyzer.py'))
  assert.ok(packageConfig.build.extraResources.some(entry => entry.to === 'puzzle_templates.json'))
  assert.equal(packageConfig.scripts.test, 'node --test')
})
