import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { electronApi } from '../src/api/electron.js'
import { usePuzzleStore } from '../src/stores/puzzle.js'

function memoryStorage(initial = null) {
  let value = initial
  return {
    getItem: key => key === 'puzzleSettings' ? value : null,
    setItem: (key, next) => { if (key === 'puzzleSettings') value = next },
    snapshot: () => JSON.parse(value || '{}')
  }
}

function recognizedSlot(type = 'corner', orientation = 0) {
  return {
    row: 0, column: 0, occupied: true, type, orientation,
    confidence: 0.72, corrected: false, uncertain: true
  }
}

function metadata(left = 100) {
  return {
    displayId: '1', scaleFactor: 1,
    displayPhysicalBounds: { x: 0, y: 0, width: 1920, height: 1080 },
    selectedRegion: { left, top: 100, right: left + 600, bottom: 1000 },
    capturedAt: '2026-08-13T00:00:00.000Z'
  }
}

test('重建 store 后恢复全部识别数据并重新求解派生状态', async t => {
  const originalLocalStorage = globalThis.localStorage
  const storage = memoryStorage()
  globalThis.localStorage = storage
  t.after(() => { globalThis.localStorage = originalLocalStorage })

  setActivePinia(createPinia())
  const first = usePuzzleStore()
  assert.equal(first.applyAnalysis({
    success: true,
    page: 1,
    slots: [recognizedSlot('corner', 90)],
    warnings: [{ message: '请人工确认' }],
    gridConfidence: 0.43,
    fragmentMods: {
      '1:0:0': {
        status: 'matched', confidence: 0.91, rawText: '复制原文',
        mod: { tier: 68, affixType: 'prefix', tags: ['奖励'], lines: ['相邻区域包含 5 个额外保险箱'] }
      }
    },
    borderMods: {
      E0: { status: 'unknown', mod: null, confidence: 0.2, rawTexts: ['OCR 原文'] }
    }
  }), true)
  first.updateSlotOrientation(0, 0, 180)

  setActivePinia(createPinia())
  const restored = usePuzzleStore()
  const slot = restored.inventoryPages[1].slots[0]
  assert.equal(restored.inventoryPages[1].recognized, true)
  assert.equal(restored.inventoryPages[2].recognized, false)
  assert.equal(restored.inventoryPages[1].gridConfidence, 0.43)
  assert.deepEqual(restored.inventoryPages[1].warnings, [{ message: '请人工确认' }])
  assert.equal(slot.type, 'corner')
  assert.equal(slot.orientation, 180)
  assert.equal(slot.confidence, 1)
  assert.equal(slot.corrected, true)
  assert.equal(slot.uncertain, false)
  assert.equal(slot.mods.rawText, '复制原文')
  assert.equal(slot.mods.mod.affixType, 'prefix')
  assert.deepEqual(slot.mods.mod.lines, ['相邻区域包含 5 个额外保险箱'])
  assert.equal(restored.edgesRecognized, true)
  assert.equal(restored.edges.E0.status, 'unknown')
  assert.deepEqual(restored.edges.E0.rawTexts, ['OCR 原文'])
  assert.equal(Object.hasOwn(storage.snapshot(), 'result'), false)
  assert.equal(Object.hasOwn(storage.snapshot(), 'requiredExits'), false)
  assert.equal(Object.hasOwn(storage.snapshot(), 'execution'), false)

  await new Promise(resolve => setTimeout(resolve, 40))
  assert.equal(restored.result.error, 'INSUFFICIENT_FRAGMENTS')
})

test('失败、重复或不完整识别不会覆盖内存与持久化旧结果', t => {
  const originalLocalStorage = globalThis.localStorage
  const storage = memoryStorage()
  globalThis.localStorage = storage
  t.after(() => { globalThis.localStorage = originalLocalStorage })

  setActivePinia(createPinia())
  const store = usePuzzleStore()
  store.applyAnalysis({
    success: true, page: 1, slots: [recognizedSlot('corner')],
    borderMods: { N0: { status: 'matched', confidence: 1, rawTexts: ['旧结果'], mod: { lines: ['旧边缘词缀'] } } }
  })
  store.applyAnalysis({ success: true, page: 2, slots: [recognizedSlot('tee')] })
  const before = JSON.stringify(storage.snapshot())

  assert.equal(store.applyAnalysis({
    success: true, page: 2, slots: [recognizedSlot('corner')],
    borderMods: { N0: { status: 'matched', confidence: 1, rawTexts: ['新结果'], mod: { lines: ['不应覆盖'] } } }
  }), false)
  assert.equal(store.edges.N0.mod.lines[0], '旧边缘词缀')
  assert.equal(JSON.stringify(storage.snapshot()), before)

  assert.equal(store.applyAnalysisBatch({
    success: true,
    pages: [{ success: true, page: 1, slots: [recognizedSlot('cross')] }],
    borderMods: { N0: { status: 'matched', confidence: 1, mod: { lines: ['仍不应覆盖'] } } }
  }), false)
  assert.equal(store.inventoryPages[1].slots[0].type, 'corner')
  assert.equal(store.edges.N0.mod.lines[0], '旧边缘词缀')
  assert.equal(JSON.stringify(storage.snapshot()), before)

  assert.equal(store.applyAnalysisBatch({
    success: true,
    pages: [
      { success: true, page: 1, slots: [recognizedSlot('straight')] },
      { success: true, page: 2, slots: [recognizedSlot('endpoint')] }
    ]
  }), true)
  assert.equal(storage.snapshot().inventoryPages['1'].slots[0].type, 'straight')
  assert.equal(storage.snapshot().inventoryPages['2'].slots[0].type, 'endpoint')
})

test('区域变化只清空对应识别结果并立即持久化', async t => {
  const originalLocalStorage = globalThis.localStorage
  const originalPickInventory = electronApi.puzzle.pickInventoryRegion
  const originalPickAtlas = electronApi.puzzle.pickAtlasRegion
  const storage = memoryStorage()
  globalThis.localStorage = storage
  electronApi.puzzle.pickInventoryRegion = async () => metadata(200)
  electronApi.puzzle.pickAtlasRegion = async () => metadata(900)
  t.after(() => {
    globalThis.localStorage = originalLocalStorage
    electronApi.puzzle.pickInventoryRegion = originalPickInventory
    electronApi.puzzle.pickAtlasRegion = originalPickAtlas
  })

  setActivePinia(createPinia())
  const store = usePuzzleStore()
  store.applyAnalysis({
    success: true, page: 1, slots: [recognizedSlot()],
    borderMods: { W0: { status: 'matched', confidence: 1, mod: { lines: ['边缘结果'] } } }
  })

  await store.pickAtlasRegion()
  assert.equal(store.inventoryPages[1].recognized, true)
  assert.equal(store.edgesRecognized, false)
  assert.equal(storage.snapshot().inventoryPages['1'].recognized, true)
  assert.equal(storage.snapshot().edgesRecognized, false)

  store.applyAnalysis({
    success: true, page: 1, slots: [recognizedSlot()],
    borderMods: { W0: { status: 'matched', confidence: 1, mod: { lines: ['新边缘结果'] } } }
  })
  await store.pickInventoryRegion()
  assert.equal(store.inventoryPages[1].recognized, false)
  assert.equal(store.edgesRecognized, true)
  assert.equal(store.edges.W0.mod.lines[0], '新边缘结果')
  assert.equal(storage.snapshot().inventoryPages['1'].recognized, false)
  assert.equal(storage.snapshot().edges.W0.mod.lines[0], '新边缘结果')

  store.applyAnalysis({ success: true, page: 1, slots: [recognizedSlot('tee')] })
  await store.clearRegion('atlas')
  assert.equal(store.inventoryPages[1].recognized, true)
  assert.equal(store.edgesRecognized, false)
  assert.equal(storage.snapshot().inventoryPages['1'].slots[0].type, 'tee')
  assert.equal(storage.snapshot().edgesRecognized, false)
})

test('自动放入进度和结束状态不提前扣除持久化库存', t => {
  const originalLocalStorage = globalThis.localStorage
  const originalListener = electronApi.puzzle.onAutoPlacementUpdated
  const storage = memoryStorage()
  let publish = null
  globalThis.localStorage = storage
  electronApi.puzzle.onAutoPlacementUpdated = callback => {
    publish = callback
    return () => {}
  }
  t.after(() => {
    globalThis.localStorage = originalLocalStorage
    electronApi.puzzle.onAutoPlacementUpdated = originalListener
  })

  setActivePinia(createPinia())
  const store = usePuzzleStore()
  store.applyAnalysis({ success: true, page: 1, slots: [recognizedSlot('corner')] })
  store.applyAnalysis({ success: true, page: 2, slots: [recognizedSlot('tee')] })
  store.listenExecution()
  const before = JSON.stringify(storage.snapshot().inventoryPages)

  publish({ event: 'step-completed', status: 'running', completed: 1, source: { page: 1, row: 0, column: 0 } })
  publish({ event: 'completed', status: 'completed', completed: 9 })
  publish({ event: 'stopped', status: 'stopped', completed: 3 })
  publish({ event: 'error', status: 'error', completed: 3, error: { code: 'TEST_ERROR' } })

  assert.equal(store.inventoryPages[1].slots[0].occupied, true)
  assert.equal(store.counts.corner, 1)
  assert.equal(store.counts.tee, 1)
  assert.equal(JSON.stringify(storage.snapshot().inventoryPages), before)
})

test('中断续跑保留完整锁定来源并只暴露未完成来源', async t => {
  const originalLocalStorage = globalThis.localStorage
  const originalConfiguration = electronApi.puzzle.getConfiguration
  const originalStart = electronApi.puzzle.startAutoPlacement
  const storage = memoryStorage()
  let payload = null
  globalThis.localStorage = storage
  electronApi.puzzle.getConfiguration = async () => ({
    states: {
      inventory: { configured: true, valid: true },
      atlas: { configured: true, valid: true }
    }
  })
  electronApi.puzzle.startAutoPlacement = async request => {
    payload = request
    return { success: true, status: 'validating' }
  }
  t.after(() => {
    globalThis.localStorage = originalLocalStorage
    electronApi.puzzle.getConfiguration = originalConfiguration
    electronApi.puzzle.startAutoPlacement = originalStart
  })

  setActivePinia(createPinia())
  const store = usePuzzleStore()
  store.inventoryRegionMetadata = metadata(100)
  store.atlasRegionMetadata = metadata(900)
  store.inventoryTabPoints = { 1: { x: 200, y: 50 }, 2: { x: 300, y: 50 } }
  store.applyAnalysis({
    success: true,
    page: 1,
    slots: Array.from({ length: 9 }, (_, index) => ({
      row: Math.floor(index / 6), column: index % 6,
      occupied: true, type: 'cross', orientation: 0, confidence: 1
    }))
  })
  store.result = {
    ...store.result,
    solutions: [{
      cells: Array.from({ length: 9 }, (_, index) => ({
        index, row: Math.floor(index / 3), column: index % 3,
        type: 'cross', mask: 15, orientation: 0
      })),
      sourceSlots: Array.from({ length: 9 }, (_, index) => ({
        page: 1, row: Math.floor(index / 6), column: index % 6,
        type: 'cross', cellIndex: index
      }))
    }]
  }
  store.execution = { status: 'stopped', completed: 3, currentIndex: 2 }
  await store.loadConfiguration()

  assert.deepEqual(store.remainingSourceSlots.map(source => source.cellIndex), [3, 4, 5, 6, 7, 8])
  const response = await store.startAutoPlacement()
  assert.equal(response.success, true)
  assert.equal(payload.resume, true)
  assert.equal(payload.sourceSlots.length, 9)
  assert.deepEqual(payload.sourceSlots.map(source => source.column), [0, 1, 2, 3, 4, 5, 0, 1, 2])
  assert.equal(store.counts.cross, 9)
})

test('完成海图立即持久化碎片扣除与边缘清空', async t => {
  const originalLocalStorage = globalThis.localStorage
  const originalComplete = electronApi.puzzle.completeChart
  const storage = memoryStorage()
  globalThis.localStorage = storage
  let completeCalls = 0
  electronApi.puzzle.completeChart = async () => {
    completeCalls += 1
    return { success: true }
  }
  t.after(() => {
    globalThis.localStorage = originalLocalStorage
    electronApi.puzzle.completeChart = originalComplete
  })

  setActivePinia(createPinia())
  const store = usePuzzleStore()
  store.setAutoProbeBorderMods(false)
  store.applyAnalysis({
    success: true,
    page: 1,
    slots: Array.from({ length: 9 }, (_, index) => ({
      row: Math.floor(index / 6), column: index % 6,
      occupied: true, type: 'cross', confidence: 1
    })),
    borderMods: { S0: { status: 'matched', confidence: 1, mod: { lines: ['旧边缘词缀'] } } }
  })
  store.result = {
    ...store.result,
    solutions: [{
      cells: Array.from({ length: 9 }, (_, index) => ({ index, type: 'cross' })),
      sourceSlots: Array.from({ length: 9 }, (_, index) => ({
        page: 1, row: Math.floor(index / 6), column: index % 6, type: 'cross'
      }))
    }]
  }

  const response = await store.completeCurrentChart()
  assert.equal(response.success, true)
  const saved = storage.snapshot()
  assert.equal(saved.inventoryPages['1'].slots.filter(slot => slot.occupied).length, 0)
  assert.equal(saved.edgesRecognized, false)
  assert.equal(saved.edges.S0.status, 'unknown')
  assert.equal(store.counts.cross, 0)
  assert.equal(completeCalls, 1)

  const repeated = await store.completeCurrentChart()
  assert.equal(repeated.success, false)
  assert.equal(repeated.error.code, 'NO_SOLUTION')
  assert.equal(completeCalls, 1)
})

test('独立边缘识别成功后立即覆盖持久化结果', async t => {
  const originalLocalStorage = globalThis.localStorage
  const originalProbe = electronApi.puzzle.probeBorderMods
  const storage = memoryStorage()
  globalThis.localStorage = storage
  electronApi.puzzle.probeBorderMods = async () => ({
    success: true,
    borderMods: { E2: { status: 'matched', confidence: 0.88, rawTexts: ['新 OCR'], mod: { lines: ['新边缘词缀'] } } }
  })
  t.after(() => {
    globalThis.localStorage = originalLocalStorage
    electronApi.puzzle.probeBorderMods = originalProbe
  })

  setActivePinia(createPinia())
  const store = usePuzzleStore()
  const response = await store.probeBorderMods()
  assert.equal(response.success, true)
  const saved = storage.snapshot()
  assert.equal(saved.edgesRecognized, true)
  assert.equal(saved.edges.E2.mod.lines[0], '新边缘词缀')
  assert.deepEqual(saved.edges.E2.rawTexts, ['新 OCR'])
})

test('独立边缘识别失败时保留旧持久化结果', async t => {
  const originalLocalStorage = globalThis.localStorage
  const originalProbe = electronApi.puzzle.probeBorderMods
  const storage = memoryStorage()
  globalThis.localStorage = storage
  electronApi.puzzle.probeBorderMods = async () => ({
    success: false,
    error: { code: 'BORDER_PROBE_FAILED', message: '边缘识别失败' }
  })
  t.after(() => {
    globalThis.localStorage = originalLocalStorage
    electronApi.puzzle.probeBorderMods = originalProbe
  })

  setActivePinia(createPinia())
  const store = usePuzzleStore()
  store.applyAnalysis({
    success: true, page: 1, slots: [recognizedSlot()],
    borderMods: { E1: { status: 'matched', confidence: 1, rawTexts: ['旧 OCR'], mod: { lines: ['旧边缘词缀'] } } }
  })
  const before = JSON.stringify(storage.snapshot())

  const response = await store.probeBorderMods()

  assert.equal(response.success, false)
  assert.equal(store.edges.E1.mod.lines[0], '旧边缘词缀')
  assert.equal(JSON.stringify(storage.snapshot()), before)
})

test('空边缘识别结果覆盖为未识别状态而不是伪造已识别', async t => {
  const originalLocalStorage = globalThis.localStorage
  const originalProbe = electronApi.puzzle.probeBorderMods
  const storage = memoryStorage()
  globalThis.localStorage = storage
  electronApi.puzzle.probeBorderMods = async () => ({ success: true, borderMods: {} })
  t.after(() => {
    globalThis.localStorage = originalLocalStorage
    electronApi.puzzle.probeBorderMods = originalProbe
  })

  setActivePinia(createPinia())
  const store = usePuzzleStore()
  store.applyAnalysis({
    success: true, page: 1, slots: [recognizedSlot()],
    borderMods: { N0: { status: 'matched', confidence: 1, mod: { lines: ['旧边缘词缀'] } } }
  })
  await store.probeBorderMods()
  assert.equal(store.edgesRecognized, false)
  assert.equal(storage.snapshot().edgesRecognized, false)
  assert.equal(storage.snapshot().edges.N0.mod, null)
})

test('旧版、损坏及非法持久化数据安全回退为空识别状态', t => {
  const originalLocalStorage = globalThis.localStorage
  t.after(() => { globalThis.localStorage = originalLocalStorage })

  globalThis.localStorage = memoryStorage('{broken')
  setActivePinia(createPinia())
  const broken = usePuzzleStore()
  assert.equal(broken.inventoryPages[1].recognized, false)
  assert.equal(broken.edgesRecognized, false)

  globalThis.localStorage = memoryStorage(JSON.stringify({
    recognition: { strength: 'strict' },
    inventoryPages: { 1: { recognized: true, slots: 'invalid' } },
    edgesRecognized: true,
    edges: { N0: { status: 'matched', mod: { lines: 'invalid' }, rawTexts: [1, '可保留'] } }
  }))
  setActivePinia(createPinia())
  const invalid = usePuzzleStore()
  assert.equal(invalid.recognition.strength, 'strict')
  assert.equal(invalid.inventoryPages[1].recognized, false)
  assert.equal(invalid.edgesRecognized, false)
  assert.equal(invalid.edges.N0.status, 'unknown')
  assert.equal(invalid.edges.N0.mod, null)
  assert.deepEqual(invalid.edges.N0.rawTexts, ['可保留'])
})
