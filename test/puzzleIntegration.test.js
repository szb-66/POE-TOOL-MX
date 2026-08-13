import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizePuzzleRegionMetadata, validatePuzzleRegionEnvironment } from '../src/utils/puzzleConfig.js'

const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

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
  const runtime = source('../src/startup/mainRuntime.js')

  for (const channel of ['puzzle-pick-inventory-region', 'puzzle-analyze', 'puzzle-clear-region']) {
    assert.match(ipc, new RegExp(channel))
    assert.match(preload, new RegExp(channel))
  }
  assert.match(preload, /puzzle-analysis-updated/)
  assert.match(api, /pickInventoryRegion:/)
  assert.match(api, /onAnalysisUpdated:/)
  assert.match(main, /new PuzzleAnalysisService/)
  assert.match(source('../electron/modules/puzzle/service.js'), /if \(this\.busy\)[\s\S]*ANALYSIS_BUSY/)
  assert.match(source('../electron/modules/puzzle/service.js'), /async analyze[\s\S]*requireGameForeground: true/)
  assert.match(source('../electron/modules/puzzle/service.js'), /requestedPages[\s\S]*\[1, 2\][\s\S]*pages: results/)
  assert.match(source('../src/utils/scriptService.js'), /puzzleAnalyze: startPuzzleAnalysis/)
  assert.match(router, /path: '\/puzzle'/)
  assert.match(runtime, /router\.push\('\/puzzle'\)/)
})

test('清空已选区域贯通 IPC、preload、渲染 API、服务与页面', () => {
  const ipc = source('../electron/modules/ipc/puzzle.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const service = source('../electron/modules/puzzle/service.js')
  const store = source('../src/stores/puzzle.js')
  const view = source('../src/domains/puzzle/PuzzleView.vue')

  assert.match(ipc, /service\.clearRegion\(type\)/)
  assert.match(preload, /clearPuzzleRegion: \(type\) => ipcRenderer\.invoke\('puzzle-clear-region', type\)/)
  assert.match(api, /clearRegion: \(type\) => window\.electronAPI\.clearPuzzleRegion\?\.\(type\)/)
  assert.match(api, /clearRegion: \(\) => Promise\.resolve\(\{ success: true \}\)/)
  assert.match(service, /clearRegion\(type = 'inventory'\)[\s\S]*previewPath\(regionType\)[\s\S]*fs\.unlinkSync/)
  assert.match(service, /const previewFor = \(metadata, type\) =>[\s\S]*normalizePuzzleRegionMetadata\(metadata\) \? this\.readPreview\(type\) : ''/)
  assert.match(store, /let regionClearGeneration = 0/)
  assert.match(store, /function clearRegion\(type = 'inventory'\)[\s\S]*inventoryRegionMetadata\.value = null[\s\S]*regionClearGeneration \+= 1[\s\S]*resetAnalysisState\(\)/)
  assert.match(store, /if \(regionClearGeneration !== clearGeneration\)[\s\S]*REGION_CLEARED/)
  const clearBlock = store.match(/async function clearRegion[\s\S]*?\n  \}/)?.[0] || ''
  assert.doesNotMatch(clearBlock, /analyzing/)
  assert.match(store, /atlasRegionMetadata\.value = null/)
  assert.match(store, /previews\.value\[type\] = ''/)
  assert.match(store, /await loadConfiguration\(\)[\s\S]*previews\.value\[type\] = ''\n    return \{ success: true \}/)
  assert.match(view, /:disabled="executing \|\| analyzing \|\| !config\.metadata" :title="clearRegionTitle\(config\)" @click="clearRegion\(config\.type\)">清空已选/)
  assert.match(view, /function clearRegionTitle\(config\)[\s\S]*尚未框选区域/)
  assert.doesNotMatch(view, /typeof store\.clearRegion/)
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

test('碎片右键逆时针旋转且角度修正跳过完整重算', () => {
  const view = source('../src/domains/puzzle/PuzzleView.vue')
  assert.match(view, /store\.updateSlotOrientation\(slot\.row, slot\.column, slot\.orientation - step\)/)
  assert.match(view, /右键“逆时针旋转角度”/)
  const store = source('../src/stores/puzzle.js')
  const orientation = store.match(/function updateSlotOrientation\([\s\S]*?\n  \}/)?.[0] || ''
  assert.match(orientation, /refreshSourceAssignments\(\)/)
  assert.doesNotMatch(orientation, /recompute\(\)/)
  const typeUpdate = store.match(/function updateSlot\([\s\S]*?\n  \}/)?.[0] || ''
  assert.match(typeUpdate, /recompute\(\)/)
  assert.match(store, /function refreshSourceAssignments/)
})

test('待确认与已拼入海图来源格具有独立且可叠加样式', () => {
  const view = source('../src/domains/puzzle/PuzzleView.vue')
  assert.match(view, /class="uncertain-mark">\?<\/em>/)
  const uncertain = view.match(/\.inventory-slot\.uncertain\s*\{([^}]*)\}/)?.[1] || ''
  assert.match(uncertain, /border-style: dashed/)
  assert.match(uncertain, /background: #313131/)
  const selected = view.match(/\.inventory-slot\.selected\s*\{([^}]*)\}/)?.[1] || ''
  assert.match(selected, /border-width: 5px/)
  assert.match(selected, /border-color: var\(--el-color-primary\)/)
  assert.doesNotMatch(selected, /background|box-shadow/)
  assert.match(view, /\.inventory-slot\.selected\.uncertain\s*\{/)
  assert.match(view, /\.source-index\s*\{[\s\S]*color: var\(--el-color-primary\)/)
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

test('九宫格无解状态区分数量、类型组合和出口限制并提供醒目反馈', () => {
  const store = source('../src/stores/puzzle.js')
  const view = source('../src/domains/puzzle/PuzzleView.vue')

  assert.match(view, /v-if="solutionFeedback"[\s\S]*:title="solutionFeedback\.title"[\s\S]*:description="solutionFeedback\.description"[\s\S]*type="warning"[\s\S]*:closable="false"/)
  assert.match(view, /v-if="solutionFeedback" type="warning">无可用方案<\/el-tag>[\s\S]*v-else-if="result\.score !== null" type="success">外周出口/)

  assert.match(view, /result\.value\.error === 'INSUFFICIENT_FRAGMENTS'[\s\S]*9 - occupiedCount\.value[\s\S]*当前识别到 \$\{occupiedCount\.value\} 块，还差 \$\{missingCount\} 块/)
  assert.match(view, /result\.value\.error !== 'NO_SOLUTION'[\s\S]*hasExitConstraints\.value[\s\S]*现有碎片无法满足当前出口限制[\s\S]*清空出口状态/)
  assert.match(view, /kind: 'combination'[\s\S]*现有碎片类型组合无法拼成完整九宫格[\s\S]*补充其他类型/)
  assert.match(view, /count-card total[\s\S]*result\.error === 'INSUFFICIENT_FRAGMENTS'/)
  assert.match(view, /\.count-card\.total\.insufficient[\s\S]*var\(--el-color-warning\)/)

  assert.match(store, /result\.value\.error === 'INSUFFICIENT_FRAGMENTS'[\s\S]*可用碎片不足 9 块，还差 \$\{Math\.max\(0, 9 - occupiedCount\.value\)\} 块/)
  assert.match(store, /result\.value\.error === 'NO_SOLUTION' && hasExitConstraints\.value[\s\S]*当前碎片无法满足出口限制，请清空出口状态/)
  assert.match(store, /result\.value\.error === 'NO_SOLUTION'\) return '现有碎片类型组合无法拼成完整九宫格'/)

  assert.match(view, /response\?\.success && solutionFeedback\.value[\s\S]*ElMessage\.warning\(solutionFeedback\.value\.title\)[\s\S]*else if \(response\?\.success\) \{[\s\S]*词缀识别跳过[\s\S]*else ElMessage\.success\('海图碎片识别完成'\)/)
})

test('重算期间仅在最优方案卡片显示 loading，且不人为延长计算', () => {
  const store = source('../src/stores/puzzle.js')
  const view = source('../src/domains/puzzle/PuzzleView.vue')
  assert.match(view, /solutionIndex,\n\s*solving,\n\s*analyzing,/)
  assert.match(view, /const loadingVisible = computed\(\(\) => solving\.value\)/)
  assert.match(view, /class="solution-card" shadow="never"[\s\S]*v-if="loadingVisible" class="solution-loading-mask"[\s\S]*is-loading[\s\S]*正在计算最优方案…/)
  assert.match(view, /\.solution-card\s*\{\s*position:\s*relative;\s*\}/)
  assert.match(view, /\.solution-loading-mask\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?inset:\s*0;[\s\S]*?z-index:\s*2000;/)
  assert.doesNotMatch(view, /v-loading/)
  assert.doesNotMatch(view, /loadingVisible\.value = false/)
  assert.doesNotMatch(view, /puzzle-module|module-loading-mask/)
  assert.match(store, /function waitForNextPaint\(\)[\s\S]*requestAnimationFrame\(\(\) => requestAnimationFrame\(resolve\)\)[\s\S]*setTimeout\(resolve, 16\)/)
  assert.match(store, /async function recompute\(\)[\s\S]*solving\.value = true[\s\S]*await waitForNextPaint\(\)/)
  assert.match(store, /finally \{\n\s*solving\.value = false\n\s*\}/)
})

test('两个框选入口分别位于对应配置卡而非页面顶部', () => {
  const view = source('../src/domains/puzzle/PuzzleView.vue')
  const headingActions = view.match(/<div class="heading-actions">([\s\S]*?)<\/div>/)?.[1] || ''
  assert.doesNotMatch(headingActions, /框选碎片仓库|框选海图区/)
  assert.match(view, /class="configuration-actions"[\s\S]*:disabled="executing \|\| analyzing" @click="pickRegion\(config\.type\)"/)
  assert.match(view, /type: 'inventory'[\s\S]*pickLabel: '框选碎片仓库'/)
  assert.match(view, /type: 'atlas'[\s\S]*pickLabel: '框选海图区'/)
})

test('低置信度碎片保留警告但仍参与海图求解与来源分配', () => {
  const store = source('../src/stores/puzzle.js')
  const view = source('../src/domains/puzzle/PuzzleView.vue')
  assert.match(store, /counts: counts\.value/)
  assert.match(store, /assignSourceSlots\(solution, allSlots\.value\)/)
  assert.doesNotMatch(store, /剩余来源碎片存在待确认项/)
  assert.match(view, /auto-blocked-reason/)
  assert.match(view, /\{\{ autoPlaceBlockedReason \}\}/)
})

test('完成当前海图扣除来源碎片、清空出口限制并基于剩余碎片重算', () => {
  const store = source('../src/stores/puzzle.js')
  const view = source('../src/domains/puzzle/PuzzleView.vue')
  const ipc = source('../electron/modules/ipc/puzzle.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const service = source('../electron/modules/puzzle/service.js')

  const action = store.match(/async function completeCurrentChart\(\) \{([\s\S]*?)\n  \}/)?.[1] || ''
  assert.match(action, /currentSolution\.value\.sourceSlots/)
  assert.match(action, /emptySlots\(page\)\[index\]/)
  assert.match(action, /requiredExits\.value = \[\]/)
  assert.match(action, /forbiddenExits\.value = \[\]/)
  assert.match(action, /execution\.value = \{ status: 'idle'/)
  assert.match(action, /solutionIndex\.value = 0/)
  assert.match(action, /recompute\(\)/)
  assert.match(action, /completeChart\?\.\(\)/)
  assert.match(store, /completeCurrentChart,/)

  assert.match(view, /solution-pager[\s\S]*chart-complete-row[\s\S]*type="warning" :disabled="executing \|\| analyzing \|\| !currentSolution" @click="completeCurrentChart">当前海图已完成<\/el-button>/)
  const headingActions = view.match(/<div class="heading-actions">([\s\S]*?)<\/div>/)?.[1] || ''
  assert.doesNotMatch(headingActions, /completeCurrentChart/)
  const handler = view.match(/async function completeCurrentChart\(\) \{([\s\S]*?)\n\}/)?.[1] || ''
  assert.match(handler, /store\.completeCurrentChart\(\)/)
  assert.match(handler, /已扣除当前海图 9 块碎片，剩余 \$\{occupiedCount\.value\} 块已重新计算/)
  assert.match(handler, /response\.borderProbe/)
  assert.doesNotMatch(handler, /confirm/)

  assert.match(ipc, /puzzle-complete-chart/)
  assert.match(preload, /completePuzzleChart: \(\) => ipcRenderer\.invoke\('puzzle-complete-chart'\)/)
  assert.match(api, /completeChart: \(\) => window\.electronAPI\.completePuzzleChart\?\.\(\)/)
  assert.match(api, /completeChart: \(\) => Promise\.resolve\(\{ success: true \}\)/)
  assert.match(service, /resetExecution\(\) \{[\s\S]*status: 'idle'[\s\S]*publishExecution\(\{ event: 'reset' \}\)/)
})

test('独立边缘词缀识别通道贯通 IPC、preload、API 与服务', () => {
  const ipc = source('../electron/modules/ipc/puzzle.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const service = source('../electron/modules/puzzle/service.js')

  assert.match(ipc, /puzzle-probe-border-mods[\s\S]*service\.probeBorderMods\(payload \|\| \{\}\)/)
  assert.match(preload, /probePuzzleBorderMods: \(request\) => ipcRenderer\.invoke\('puzzle-probe-border-mods', request\)/)
  assert.match(api, /probeBorderMods: \(request\) => window\.electronAPI\.probePuzzleBorderMods\?\.\(craftingIpcPayload\(request\)\)/)
  assert.match(api, /probeBorderMods: \(\) => Promise\.resolve\(\{ success: false[\s\S]*ELECTRON_REQUIRED/)
  assert.match(service, /async probeBorderMods\(\{ atlasRegionMetadata \} = \{\}\)/)
  assert.match(service, /async runBorderProbe\(normalizeAtlas\)/)
  assert.match(service, /AUTO_PLACEMENT_BUSY/)
  const chartMods = service.match(/async probeChartMods\([\s\S]*?\n  \}/)?.[0] || ''
  assert.match(chartMods, /this\.runBorderProbe\(normalizeAtlas\)/)
  const runProbe = service.match(/runProbe\(config\) \{([\s\S]*?)\n  \}/)?.[1] || ''
  assert.match(runProbe, /if \(line\.startsWith\('RESULT '\)\)[\s\S]*resultLine = line/)
  assert.match(runProbe, /if \(!resultLine && buffer\.trim\(\)\) consumeLine\(buffer\.trim\(\)\)/)
  assert.match(runProbe, /OC_DISABLE_DOT_ACCESS_WARNING/)
  assert.match(runProbe, /slice\(-2000\)/)
})

test('海图区缺失或边缘识别失败时不丢弃已识别的碎片词缀', () => {
  const service = source('../electron/modules/puzzle/service.js')
  const chartMods = service.match(/async probeChartMods\([\s\S]*?\n  \}/)?.[0] || ''
  assert.match(chartMods, /!normalizeAtlas\?\.selectedRegion/)
  assert.match(chartMods, /borderProbe: this\.emptyProbeStats\(true, 'REGION_REQUIRED'\)/)
  assert.match(chartMods, /catch \(borderError\)[\s\S]*borderResult = \{ borderMods: \{\}, borderProbe: this\.emptyProbeStats\(true, String\(borderError\?\.message \|\| borderError\)\) \}/)
  assert.match(chartMods, /return \{ fragmentMods, \.\.\.borderResult, fragmentProbe: fragmentStats \}/)
  assert.match(chartMods, /catch \(copyError\)[\s\S]*fragmentStats\.reason = String\(copyError\?\.message \|\| copyError\)/)
  assert.doesNotMatch(chartMods, /catch \(error\) \{\s*fragmentStats\.skipped = true[\s\S]*fragmentMods: \{\}/)
})

test('完成后自动识别默认开启、持久化并接入完成流程', () => {
  const store = source('../src/stores/puzzle.js')
  const view = source('../src/domains/puzzle/PuzzleView.vue')
  const config = source('../src/utils/puzzleConfig.js')

  assert.match(config, /autoProbeBorderMods: value\.autoProbeBorderMods !== false/)
  assert.match(store, /const autoProbeBorderMods = ref\(loaded\.autoProbeBorderMods !== false\)/)
  assert.match(store, /autoProbeBorderMods: autoProbeBorderMods\.value/)
  const action = store.match(/async function completeCurrentChart\(\) \{([\s\S]*?)\n  \}/)?.[1] || ''
  assert.match(action, /if \(autoProbeBorderMods\.value\)[\s\S]*await probeBorderMods\(\)/)
  const probe = store.match(/async function probeBorderMods\(\) \{([\s\S]*?)\n  \}/)?.[1] || ''
  assert.match(probe, /probingBorder\.value = true/)
  assert.match(probe, /applyBorderMods\(response\.borderMods\)/)
  assert.match(probe, /probingBorder\.value = false/)
  assert.match(store, /function setAutoProbeBorderMods\(enabled\)[\s\S]*persistRegions\(\)/)
  assert.match(view, /:loading="probingBorder && !borderProbeProgressText"[\s\S]*handleProbeBorderMods[\s\S]*识别边缘词缀/)
  assert.match(view, /borderProbeProgressText = computed/)
  assert.match(view, /<el-checkbox :model-value="autoProbeBorderMods" @change="handleAutoProbeChange">完成后自动识别<\/el-checkbox>/)
  assert.match(view, /async function handleProbeBorderMods\(\)[\s\S]*store\.probeBorderMods\(\)/)
  assert.match(view, /function handleAutoProbeChange\(value\)[\s\S]*setAutoProbeBorderMods/)
})

test('手动把碎片格子改为空格时清除已识别词缀', () => {
  const store = source('../src/stores/puzzle.js')
  const action = store.match(/function updateSlot\([\s\S]*?\n  \}/)?.[0] || ''
  assert.match(action, /mods: occupied \? pageState\.slots\[index\]\.mods : null/)
})

test('碎片悬浮使用原生标题展示词缀与复制原文', () => {
  const view = source('../src/domains/puzzle/PuzzleView.vue')
  const store = source('../src/stores/puzzle.js')
  const service = source('../electron/modules/puzzle/service.js')
  assert.match(view, /slotModTitleLine\(slot\)/)
  assert.match(view, /词缀：未揭示/)
  assert.match(view, /词缀：未知/)
  assert.doesNotMatch(view, /el-tooltip placement="top"[\s\S]*slotModLines/)
  assert.match(store, /rawText: typeof value\.rawText === 'string'/)
  assert.match(service, /rawText: text \? text\.slice\(0, 600\) : ''/)
})

test('重新框选仓库时清空双页结果，单页识别只由服务重置执行进度', () => {  const store = source('../src/stores/puzzle.js')
  const service = source('../electron/modules/puzzle/service.js')
  const reset = store.match(/function resetAnalysisState\(\) \{([\s\S]*?)\n  \}/)?.[1] || ''
  assert.match(reset, /inventoryPages\.value = \{ 1: emptyInventoryPage\(1\), 2: emptyInventoryPage\(2\) \}/)
  assert.match(reset, /result\.value = emptyResult\(\)/)
  assert.match(reset, /execution\.value = \{ status: 'idle'/)
  assert.match(reset, /error\.value = null/)
  assert.match(store, /inventoryTabPoints\.value = normalizePuzzleTabPoints\(\)[\s\S]*resetAnalysisState\(\)/)
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
