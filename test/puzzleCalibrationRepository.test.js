import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  PuzzleCalibrationRepository,
  PUZZLE_CALIBRATION_FEATURE_LENGTH,
  PUZZLE_CALIBRATION_FEATURE_VERSION
} from '../electron/modules/puzzle/calibrationRepository.js'

const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
const vector = Array.from({ length: PUZZLE_CALIBRATION_FEATURE_LENGTH }, (_, index) => index / 128)

test('海图校准素材保存、同图覆盖、删除和重置', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'puzzle-calibration-'))
  try {
    const repository = new PuzzleCalibrationRepository(root)
    const first = repository.save({ tileDataUrl: png, labelMask: 1, featureVector: vector,
      featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION, page: 1, row: 2, column: 3 })
    const second = repository.save({ tileDataUrl: png, labelMask: 10, featureVector: vector,
      featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION, page: 2, row: 4, column: 5 })
    assert.equal(first.id, second.id)
    assert.equal(repository.list().length, 1)
    assert.equal(repository.list()[0].labelMask, 10)
    assert.match(repository.listWithImages()[0].tileDataUrl, /^data:image\/png;base64,/)
    assert.equal(repository.remove(first.id), true)
    assert.equal(repository.list().length, 0)
    repository.save({ tileDataUrl: png, labelMask: 0, featureVector: vector,
      featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION })
    repository.reset()
    assert.deepEqual(repository.list(), [])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('海图校准素材拒绝非法输入并忽略损坏、越界和路径逃逸记录', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'puzzle-calibration-invalid-'))
  try {
    const repository = new PuzzleCalibrationRepository(root)
    assert.throws(() => repository.save({ tileDataUrl: 'bad', labelMask: 1, featureVector: vector,
      featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION }), /PNG/)
    assert.throws(() => repository.save({ tileDataUrl: png, labelMask: 16, featureVector: vector,
      featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION }), /标签/)
    assert.throws(() => repository.save({ tileDataUrl: png, labelMask: 1, featureVector: [1],
      featureVersion: PUZZLE_CALIBRATION_FEATURE_VERSION }), /特征/)
    repository.ensure()
    writeFileSync(repository.indexPath, '{bad json', 'utf8')
    assert.deepEqual(repository.list(), [])
    writeFileSync(repository.indexPath, JSON.stringify({ samples: [
      { id: 'escape', labelMask: 1, featureVersion: 1, featureVector: vector, relativePath: '..\\outside.png' },
      { id: 'label', labelMask: 20, featureVersion: 1, featureVector: vector, relativePath: 'samples\\missing.png' },
      { id: 'vector', labelMask: 1, featureVersion: 1, featureVector: [1], relativePath: 'samples\\missing.png' }
    ] }), 'utf8')
    assert.deepEqual(repository.list(), [])
    assert.doesNotThrow(() => JSON.parse(readFileSync(repository.indexPath, 'utf8')))
    assert.equal(existsSync(path.join(root, 'outside.png')), false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
