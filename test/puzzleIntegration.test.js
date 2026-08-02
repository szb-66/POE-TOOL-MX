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

test('九宫格区域保留物理坐标，并在相同显示环境中跨 display id 恢复', () => {
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
  assert.doesNotMatch(source('../electron/modules/puzzle/service.js'), /delayMs|sleep\(wait\)/)
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

test('分析推送只负责页面通知，不重复应用 invoke 已返回的识别结果', () => {
  const store = source('../src/stores/puzzle.js')
  const listener = store.match(/function listen\(onUpdated\)\s*\{([\s\S]*?)\n  \}/)?.[1] || ''
  assert.match(listener, /onAnalysisUpdated/)
  assert.doesNotMatch(listener, /applyAnalysis/)
})

test('方案九宫格使用边框盒模型且为底部出口保留独立轨道', () => {
  const view = source('../src/domains/puzzle/PuzzleView.vue')
  assert.match(view, /\.solution-shell\s*\{[\s\S]*?grid-template-rows:\s*30px auto 30px;/)
  assert.match(view, /\.solution-cell\s*\{[\s\S]*?box-sizing:\s*border-box;/)
  assert.match(view, /\.bottom-exits\s*\{\s*grid-row:\s*3;/)
})

test('识别资源进入资源清单但测试不触发安装包构建', () => {
  const packageConfig = JSON.parse(source('../package.json'))
  assert.ok(packageConfig.build.extraResources.some(entry => entry.to === 'puzzle_analyzer.py'))
  assert.ok(packageConfig.build.extraResources.some(entry => entry.to === 'puzzle_templates.json'))
  assert.equal(packageConfig.scripts.test, 'node --test')
})
