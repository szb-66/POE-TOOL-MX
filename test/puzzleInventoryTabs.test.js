import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { usePuzzleStore } from '../src/stores/puzzle.js'

const source = relativePath => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

const slot = (type, orientation = 0) => ({
  row: 0, column: 0, occupied: true, type, orientation,
  confidence: 0.9, uncertain: false, corrected: false
})

test('双页识别只替换目标页并聚合计数', async () => {
  setActivePinia(createPinia())
  const store = usePuzzleStore()
  assert.equal(store.applyAnalysis({ success: true, page: 1, slots: [slot('corner')], warnings: [], gridConfidence: 0.9 }), true)
  assert.equal(store.applyAnalysis({ success: true, page: 2, slots: [slot('tee', 90)], warnings: [], gridConfidence: 0.8 }), true)
  assert.equal(store.inventoryPages[1].recognized, true)
  assert.equal(store.inventoryPages[2].recognized, true)
  assert.equal(store.allSlots.length, 120)
  assert.equal(store.counts.corner, 1)
  assert.equal(store.counts.tee, 1)
  await store.clearInventoryPage(2)
  assert.equal(store.inventoryPages[1].recognized, true)
  assert.equal(store.inventoryPages[2].recognized, false)
  assert.equal(store.counts.corner, 1)
})

test('完全相同的第二页识别结果被拒绝且不覆盖原页', () => {
  setActivePinia(createPinia())
  const store = usePuzzleStore()
  const result = { success: true, slots: [slot('corner')], warnings: [], gridConfidence: 0.9 }
  assert.equal(store.applyAnalysis({ ...result, page: 1 }), true)
  assert.equal(store.applyAnalysis({ ...result, page: 2 }), false)
  assert.equal(store.error.code, 'DUPLICATE_INVENTORY_PAGE')
  assert.equal(store.inventoryPages[2].recognized, false)
})

test('双页批次仅在结果完整且可区分时原子替换', () => {
  setActivePinia(createPinia())
  const store = usePuzzleStore()
  store.applyAnalysis({ success: true, page: 1, slots: [slot('corner')], warnings: [], gridConfidence: 0.9 })
  store.applyAnalysis({ success: true, page: 2, slots: [slot('tee')], warnings: [], gridConfidence: 0.9 })
  assert.equal(store.applyAnalysisBatch({
    success: true,
    pages: [{ success: true, page: 1, slots: [slot('cross')], warnings: [], gridConfidence: 1 }]
  }), false)
  assert.equal(store.inventoryPages[1].slots[0].type, 'corner')
  assert.equal(store.inventoryPages[2].slots[0].type, 'tee')

  assert.equal(store.applyAnalysisBatch({
    success: true,
    pages: [
      { success: true, page: 1, slots: [slot('straight')], warnings: [], gridConfidence: 1 },
      { success: true, page: 2, slots: [slot('endpoint')], warnings: [], gridConfidence: 1 }
    ]
  }), true)
  assert.equal(store.inventoryPages[1].slots[0].type, 'straight')
  assert.equal(store.inventoryPages[2].slots[0].type, 'endpoint')
})

test('页面、IPC 与执行负载携带双页及页签协议', () => {
  const store = source('src/stores/puzzle.js')
  const view = source('src/domains/puzzle/PuzzleView.vue')
  const service = source('electron/modules/puzzle/service.js')
  assert.match(store, /inventoryPages = ref\(\{ 1: emptyInventoryPage\(1\), 2: emptyInventoryPage\(2\) \}\)/)
  assert.match(store, /async function analyze\(\{ preserveSolution = false, page = null \}/)
  assert.match(store, /inventoryTabPoints: inventoryTabPoints\.value/)
  assert.match(store, /applyAnalysisBatch/)
  assert.match(view, /第1页[\s\S]*第2页/)
  assert.match(view, /清空本页结果/)
  assert.match(view, /第 \{\{ page \}\} 页页签/)
  assert.ok(view.indexOf('<el-radio-group') > view.indexOf('class="inventory-card"'))
  assert.match(view, /<strong>碎片仓库<\/strong>[\s\S]*class="inventory-card-toolbar"[\s\S]*class="inventory-page-tabs"/)
  assert.doesNotMatch(view, /碎片仓库第 \{\{ selectedInventoryPage \}\} 页/)
  assert.match(view, /\.inventory-page-tabs \{[^}]*flex-direction: row;[^}]*flex-wrap: nowrap;/)
  assert.match(view, /analysisProgressText[\s\S]*'自动识别两页'/)
  assert.match(view, /正在读取碎片词缀[\s\S]*正在识别边缘词缀/)
  assert.match(service, /allowEmpty: true/)
  assert.match(service, /validatePuzzleTabPoint/)
  assert.match(service, /\[1, 2\][\s\S]*for \(const currentPage of requestedPages\)[\s\S]*tabPoint: tabPoints\[currentPage\]/)
})
