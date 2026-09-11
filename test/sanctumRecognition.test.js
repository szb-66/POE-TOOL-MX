import test from 'node:test'
import assert from 'node:assert/strict'
import { runPython } from './helpers/python.js'

test('宝库实机推进图恢复首领，遮挡样本不补造房间', () => {
  const results = runPython(`
import sys,json
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import analyze_floor,load_image
print(json.dumps([analyze_floor(load_image('test/fixtures/sanctum/'+n+'.png')) for n in ['vault-entry','vault-progress']]))
`)
  const [entry, progress] = results
  // Manual count from the supplied screenshots, left to right and top to bottom.
  const counts = floor => Array.from({length: 8}, (_, col) => floor.rooms.filter(room => room.column === col).length)
  assert.deepEqual(counts(progress), [3, 3, 6, 5, 3, 3, 3, 1])
  assert.deepEqual(counts(entry), [3, 3, 5, 5, 3, 3, 3, 1])
  assert.equal(entry.status, 'partial')
  assert.equal(progress.status, 'partial')
  const edge = (floor, from, to) => floor.edges.find(item => item.from === from && item.to === to)
  assert.equal(edge(entry, '0:0', '1:0').availability, 'gold')
  assert.equal(edge(progress, '0:0', '1:0').availability, 'unavailable')
  assert.equal(edge(progress, '5:1', '6:0').availability, 'gold')
  assert.equal(edge(progress, '6:0', '7:0').status, 'matched')
  assert.ok(progress.rooms.every(room => room.detailsStatus === 'unknown'))
})

test('非地图界面不能生成楼层图', () => {
  const results = runPython(`
import sys,json,numpy as np
sys.path.insert(0,'src/assets/scripts')
from sanctum_recognition import analyze_floor,load_image
images=[np.zeros((800,1200,3),dtype=np.uint8),load_image('test/fixtures/sanctum/offering-choice.png'),load_image('test/fixtures/sanctum/relic-altar.png')]
print(json.dumps([analyze_floor(image) for image in images]))
`)
  for (const result of results) {
    assert.equal(result.status, 'unknown')
    assert.deepEqual(result.rooms, [])
  }
})
