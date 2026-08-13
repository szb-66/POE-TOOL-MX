import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { electronApi } from '../src/api/electron.js'
import { usePuzzleStore } from '../src/stores/puzzle.js'

test('切换收益策略会持久化并触发方案重算', async () => {
  const originalLocalStorage = globalThis.localStorage
  let saved = null
  globalThis.localStorage = {
    getItem: () => null,
    setItem: (_key, value) => { saved = JSON.parse(value) }
  }
  try {
    setActivePinia(createPinia())
    const store = usePuzzleStore()
    store.setRewardStrategy('rare')
    await new Promise(resolve => setTimeout(resolve, 40))
    assert.equal(store.rewardStrategy, 'rare')
    assert.equal(saved.rewardStrategy, 'rare')
    assert.equal(store.result.strategy, 'rare')
    assert.equal(store.setRewardStrategy('invalid'), true)
    assert.equal(store.rewardStrategy, 'balanced')
  } finally {
    globalThis.localStorage = originalLocalStorage
  }
})

test('自动收益模式保持持久化并随词缀重选实际策略', async () => {
  const originalLocalStorage = globalThis.localStorage
  let saved = null
  globalThis.localStorage = {
    getItem: () => null,
    setItem: (_key, value) => { saved = JSON.parse(value) }
  }
  const batch = line => ({
    success: true,
    pages: [
      { page: 1, slots: Array.from({ length: 9 }, (_, index) => ({ row: Math.floor(index / 6), column: index % 6, occupied: true, type: 'cross', confidence: 1 })) },
      { page: 2, slots: [{ row: 0, column: 0, occupied: true, type: 'corner', confidence: 1 }] }
    ],
    fragmentMods: { '1:0:0': { status: 'matched', mod: { lines: [line] }, confidence: 1 } }
  })
  try {
    setActivePinia(createPinia())
    const store = usePuzzleStore()
    store.setRewardStrategy('auto')
    store.applyAnalysisBatch(batch('相邻区域包含 3 个额外奥术师的保险箱'))
    await new Promise(resolve => setTimeout(resolve, 900))
    assert.equal(store.rewardStrategy, 'auto')
    assert.equal(saved.rewardStrategy, 'auto')
    assert.equal(store.result.strategy, 'auto')
    assert.equal(store.result.effectiveStrategy, 'strongbox')

    store.applyAnalysisBatch(batch('所有航行区域中找到的亡者硫磺提高 25%'))
    await new Promise(resolve => setTimeout(resolve, 900))
    assert.equal(store.rewardStrategy, 'auto')
    assert.equal(store.result.effectiveStrategy, 'sulphur')
  } finally {
    globalThis.localStorage = originalLocalStorage
  }
})

test('边缘词缀识别成功后按新边缘收益重算', async () => {
  const original = electronApi.puzzle.probeBorderMods
  electronApi.puzzle.probeBorderMods = async () => ({
    success: true,
    borderMods: { N0: { status: 'matched', mod: { lines: ['相邻区域中找到的通货总增 100%'] } } }
  })
  try {
    setActivePinia(createPinia())
    const store = usePuzzleStore()
    store.applyAnalysisBatch({
      success: true,
      pages: [
        { page: 1, slots: Array.from({ length: 9 }, (_, index) => ({ row: Math.floor(index / 6), column: index % 6, occupied: true, type: 'cross', confidence: 1 })) },
        { page: 2, slots: [{ row: 0, column: 0, occupied: true, type: 'corner', confidence: 1 }] }
      ]
    })
    const response = await store.probeBorderMods()
    assert.equal(response.success, true)
    assert.equal(store.result.rewardDataAvailable, true)
    assert.ok(store.result.rewardScore > 0)
  } finally {
    electronApi.puzzle.probeBorderMods = original
  }
})

function chartInventory(borderMods) {
  return {
    success: true,
    pages: [
      {
        page: 1,
        slots: Array.from({ length: 9 }, (_, index) => ({
          row: Math.floor(index / 6), column: index % 6,
          occupied: true, type: 'cross', confidence: 1
        }))
      },
      { page: 2, slots: [{ row: 0, column: 0, occupied: true, type: 'corner', confidence: 1 }] }
    ],
    borderMods
  }
}

test('完成海图且关闭自动识别时清空旧边缘词缀且不调用 OCR', async () => {
  const originalComplete = electronApi.puzzle.completeChart
  const originalProbe = electronApi.puzzle.probeBorderMods
  let probeCalls = 0
  electronApi.puzzle.completeChart = async () => ({ success: true })
  electronApi.puzzle.probeBorderMods = async () => {
    probeCalls += 1
    return { success: true, borderMods: {} }
  }
  try {
    setActivePinia(createPinia())
    const store = usePuzzleStore()
    store.setAutoProbeBorderMods(false)
    store.applyAnalysisBatch(chartInventory({
      N0: {
        status: 'matched',
        mod: { lines: ['旧海图边缘词缀'] },
        confidence: 1,
        rawTexts: ['旧海图 OCR 原文']
      }
    }))
    await new Promise(resolve => setTimeout(resolve, 40))

    const response = await store.completeCurrentChart()

    assert.equal(response.success, true)
    assert.equal(probeCalls, 0)
    assert.equal(store.edgesRecognized, false)
    assert.equal(store.edges.N0.status, 'unknown')
    assert.equal(store.edges.N0.mod, null)
    assert.deepEqual(store.edges.N0.rawTexts, [])
  } finally {
    electronApi.puzzle.completeChart = originalComplete
    electronApi.puzzle.probeBorderMods = originalProbe
  }
})

test('完成海图且开启自动识别时先清空旧词缀再应用新结果', async () => {
  const originalComplete = electronApi.puzzle.completeChart
  const originalProbe = electronApi.puzzle.probeBorderMods
  let clearedBeforeProbe = false
  electronApi.puzzle.completeChart = async () => ({ success: true })
  try {
    setActivePinia(createPinia())
    const store = usePuzzleStore()
    electronApi.puzzle.probeBorderMods = async () => {
      clearedBeforeProbe = !store.edgesRecognized
        && store.edges.N0.status === 'unknown'
        && store.edges.N0.mod === null
        && store.edges.N0.rawTexts.length === 0
      return {
        success: true,
        borderProbe: { attempted: 12, matched: 1, unknown: 11, skipped: false },
        borderMods: {
          N0: { status: 'matched', mod: { lines: ['新海图边缘词缀'] }, confidence: 1, rawTexts: ['新海图 OCR 原文'] }
        }
      }
    }
    store.setAutoProbeBorderMods(true)
    store.applyAnalysisBatch(chartInventory({
      N0: { status: 'matched', mod: { lines: ['旧海图边缘词缀'] }, confidence: 1, rawTexts: ['旧海图 OCR 原文'] }
    }))
    await new Promise(resolve => setTimeout(resolve, 40))

    const response = await store.completeCurrentChart()

    assert.equal(response.success, true)
    assert.equal(clearedBeforeProbe, true)
    assert.equal(store.edgesRecognized, true)
    assert.equal(store.edges.N0.mod.lines[0], '新海图边缘词缀')
    assert.deepEqual(store.edges.N0.rawTexts, ['新海图 OCR 原文'])
  } finally {
    electronApi.puzzle.completeChart = originalComplete
    electronApi.puzzle.probeBorderMods = originalProbe
  }
})

test('完成海图后的自动识别失败时保持边缘词缀清空', async () => {
  const originalComplete = electronApi.puzzle.completeChart
  const originalProbe = electronApi.puzzle.probeBorderMods
  electronApi.puzzle.completeChart = async () => ({ success: true })
  electronApi.puzzle.probeBorderMods = async () => ({
    success: false,
    borderProbe: { skipped: true, reason: 'OCR_FAILED' },
    error: { code: 'BORDER_PROBE_FAILED', message: '边缘词缀识别失败' }
  })
  try {
    setActivePinia(createPinia())
    const store = usePuzzleStore()
    store.applyAnalysisBatch(chartInventory({
      N0: { status: 'matched', mod: { lines: ['旧海图边缘词缀'] }, confidence: 1, rawTexts: ['旧海图 OCR 原文'] }
    }))
    await new Promise(resolve => setTimeout(resolve, 40))

    const response = await store.completeCurrentChart()

    assert.equal(response.success, true)
    assert.equal(response.borderProbe.skipped, true)
    assert.equal(store.edgesRecognized, false)
    assert.equal(store.edges.N0.mod, null)
    assert.deepEqual(store.edges.N0.rawTexts, [])
  } finally {
    electronApi.puzzle.completeChart = originalComplete
    electronApi.puzzle.probeBorderMods = originalProbe
  }
})

test('独立边缘识别期间拒绝完成当前海图并保留库存', async () => {
  const originalProbe = electronApi.puzzle.probeBorderMods
  let finishProbe
  electronApi.puzzle.probeBorderMods = () => new Promise(resolve => { finishProbe = resolve })
  try {
    setActivePinia(createPinia())
    const store = usePuzzleStore()
    store.applyAnalysisBatch(chartInventory())
    await new Promise(resolve => setTimeout(resolve, 40))
    const occupiedBefore = store.inventoryPages[1].slots.filter(slot => slot.occupied).length

    const probing = store.probeBorderMods()
    assert.equal(store.probingBorder, true)
    const response = await store.completeCurrentChart()

    assert.equal(response.success, false)
    assert.equal(store.inventoryPages[1].slots.filter(slot => slot.occupied).length, occupiedBefore)
    finishProbe({ success: false, error: { code: 'BORDER_PROBE_FAILED', message: '测试结束' } })
    await probing
  } finally {
    electronApi.puzzle.probeBorderMods = originalProbe
  }
})
