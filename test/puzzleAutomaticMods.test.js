import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { usePuzzleStore } from '../src/stores/puzzle.js'
import { electronApi } from '../src/api/electron.js'

const matched = { status: 'matched', mod: { lines: ['词缀'] }, confidence: 1 }
test('自动识别保留未知形状词缀，校准及重启不丢失', async t => {
  const originalStorage = globalThis.localStorage
  const originalSave = electronApi.puzzle.saveCalibration
  let data = null
  globalThis.localStorage = { getItem: () => data, setItem: (_, value) => { data = value } }
  electronApi.puzzle.saveCalibration = async () => []
  t.after(() => { globalThis.localStorage = originalStorage; electronApi.puzzle.saveCalibration = originalSave })
  setActivePinia(createPinia())
  const store = usePuzzleStore()
  store.applyAnalysis({ success: true, page: 1, slots: [{ row: 0, column: 0, candidate: true,
    uncertain: true, typeSource: 'copy-unknown', mods: matched,
    tileDataUrl: 'data:image/png;base64,test', calibrationFeature: Array(128).fill(0.1), featureVersion: 2 }] })
  await store.saveCalibrationItem('1:0:0', { type: 'tee', orientation: 270 })
  setActivePinia(createPinia())
  assert.equal(usePuzzleStore().inventoryPages[1].slots[0].mods.status, 'matched')
})

const source = readFileSync(new URL('../electron/modules/puzzle/service.js', import.meta.url), 'utf8')
const method = source.slice(source.indexOf('  async probeFragmentMods('), source.indexOf('  // 无锁的边缘 OCR'))
const createProbe = new Function('gridCellCenter', 'unknownFragmentMod', 'MOD_PROBE_OWNER',
  'finalizeInventoryAnalysisResult', 'resolveFragmentCopy', 'matchFragmentMods', `return ({${method}}).probeFragmentMods`)
const probe = createProbe(() => ({ x: 0, y: 0 }), () => ({ status: 'unknown' }), 'probe', () => {},
  (slot, text) => ({ ...slot, type: text.includes('shape') ? 'tee' : null }),
  lines => lines.join('').includes('mod') ? matched : { status: 'unknown' })

for (const retryFails of [false, true]) test(`自动阶段只重试未知词缀，保留首次形状；重试异常=${retryFails}`, async () => {
  const slots = [{ candidate: true, row: 0, column: 0 }, { candidate: true, row: 0, column: 1 }]
  let calls = 0
  const service = {
    stopGeneration: 0, emptyProbeStats: () => ({ matched: 0, unknown: 0, unveiled: 0 }),
    assertCurrentGeneration(value) { assert.equal(value, this.stopGeneration) },
    async runProbe(config) {
      calls++
      if (calls === 1) return { success: true, texts: { '1:0:0': 'shape', '1:0:1': 'mod' } }
      assert.deepEqual(config.pages[0].cells.map(cell => cell.key), ['1:0:0'])
      if (retryFails) throw new Error('复制失败')
      return { success: true, texts: { '1:0:0': 'mod' } }
    }
  }
  const response = await probe.call(service, { inventoryMetadata: { selectedRegion: {} },
    tabPoints: {}, analysisResults: [{ page: 1, slots }] })
  assert.equal(calls, 2)
  assert.equal(slots[0].type, 'tee')
  assert.equal(slots[1].type, null)
  assert.equal(response.fragmentMods['1:0:1'].status, 'matched')
  assert.equal(response.fragmentMods['1:0:0'].status, retryFails ? 'unknown' : 'matched')
  assert.equal(response.fragmentProbe.matched, retryFails ? 1 : 2)
})
