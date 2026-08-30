import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CHART_SHAPES,
  chartShapeAliasesByPuzzleType,
  parseCopiedChartFragment
} from '../electron/modules/priceCheck/chartRegions.js'
import {
  finalizeInventoryAnalysisResult,
  resolveFragmentCopy
} from '../electron/modules/puzzle/fragmentRecognition.js'

const copied = (shape, colon = ':') => `物品类别${colon} 海图
稀 有 度: 稀有
金沙海床海图
--------
海图形状${colon} ${shape}
--------
物品等级: 83`

test('复制文本以共享别名表解析五种国服海图形状', () => {
  const expected = {
    endpoint: '端点',
    corner: '角落',
    straight: '直线',
    tee: '节点',
    cross: '交叉'
  }
  for (const [type, label] of Object.entries(expected)) {
    const result = parseCopiedChartFragment(copied(label))
    assert.deepEqual([result.isChart, result.type, result.shapeLabel], [true, type, label])
  }
  assert.deepEqual(Object.keys(chartShapeAliasesByPuzzleType()).sort(), Object.keys(expected).sort())
  assert.ok(CHART_SHAPES.every(shape => shape.aliases.length >= 1))
})

test('复制文本兼容全角冒号、NFKC 空白和交易别名', () => {
  const result = parseCopiedChartFragment(copied('  交 汇  ', '：'))
  assert.equal(result.isChart, true)
  assert.equal(result.type, 'tee')
  assert.equal(result.shapeLabel, '交 汇')
})

test('未知形状保持海图身份但不产生内部类型', () => {
  const result = parseCopiedChartFragment(copied('未来形状'))
  assert.deepEqual({ isChart: result.isChart, type: result.type, shapeLabel: result.shapeLabel }, {
    isChart: true,
    type: null,
    shapeLabel: '未来形状'
  })
})

test('非海图文本即使包含形状字段也不得定型', () => {
  const result = parseCopiedChartFragment(copied('端点').replace('物品类别: 海图', '物品类别: 地图碎片'))
  assert.equal(result.isChart, false)
  assert.equal(result.type, null)
})

const candidateSlot = (overrides = {}) => ({
  row: 0,
  column: 0,
  candidate: true,
  occupied: false,
  type: null,
  mask: 0,
  directionCandidates: {
    endpoint: { mask: 2, orientation: 90, confidence: 0.82, uncertain: false, calibrated: false },
    straight: { mask: 5, orientation: 0, confidence: 0.4, uncertain: false, calibrated: false },
    corner: { mask: 3, orientation: 0, confidence: 0.3, uncertain: true, calibrated: false },
    tee: { mask: 11, orientation: 0, confidence: 0.7, uncertain: false, calibrated: false },
    cross: { mask: 15, orientation: 0, confidence: 0.9, uncertain: false, calibrated: false }
  },
  emptyCalibration: { matched: false, similarity: 0 },
  ...overrides
})

test('复制类型强约束最终方向且保留同次词缀文本之外的证据', () => {
  const resolved = resolveFragmentCopy(candidateSlot(), copied('端点'))
  assert.deepEqual([
    resolved.occupied,
    resolved.type,
    resolved.typeSource,
    resolved.shapeLabel,
    resolved.mask,
    resolved.orientation,
    resolved.directionConfidence,
    resolved.uncertain
  ], [true, 'endpoint', 'copy', '端点', 2, 90, 0.82, false])
})

test('复制失败保持未知，只有无文本时空格素材才能抑制假阳性', () => {
  const evidence = candidateSlot({ emptyCalibration: { matched: true, similarity: 0.99 } })
  const empty = resolveFragmentCopy(evidence, '')
  assert.deepEqual([empty.candidate, empty.occupied, empty.typeSource, empty.uncertain], [false, false, 'calibration-empty', false])

  const unknownShape = resolveFragmentCopy(evidence, copied('未来形状'))
  assert.deepEqual([unknownShape.candidate, unknownShape.type, unknownShape.typeSource, unknownShape.uncertain], [true, null, 'copy-unknown', true])

  const nonChart = resolveFragmentCopy(evidence, '物品类别: 地图碎片\n海图形状: 端点')
  assert.deepEqual([nonChart.type, nonChart.typeSource, nonChart.uncertain], [null, 'copy-invalid', true])
})

test('未知类型与缺失方向不进入库存计数和求解输入', () => {
  const known = resolveFragmentCopy(candidateSlot(), copied('端点'))
  const missingDirection = resolveFragmentCopy(candidateSlot({ directionCandidates: {} }), copied('端点'))
  const result = finalizeInventoryAnalysisResult({ slots: [known, missingDirection, candidateSlot()] })
  assert.equal(result.occupiedCount, 1)
  assert.equal(result.candidateCount, 3)
  assert.equal(result.counts.endpoint, 1)
  assert.equal(missingDirection.uncertain, true)
})

test('双页服务只复制视觉候选并在词缀解析前应用复制定型', () => {
  const source = readFileSync(new URL('../electron/modules/puzzle/service.js', import.meta.url), 'utf8')
  const probe = source.match(/async probeFragmentMods\([\s\S]*?\n  \}/)?.[0] || ''
  assert.match(probe, /if \(!slot\.candidate\) continue/)
  assert.match(probe, /Object\.assign\(cell\.slot, resolveFragmentCopy\(cell\.slot, text\)\)/)
  assert.match(probe, /matchFragmentMods\(text\.split/)
  assert.match(probe, /if \(!cell\.slot\.type\) fragmentStats\.unknown/)
  assert.match(source, /candidateTotal[\s\S]*filter\(slot => slot\?\.candidate\)/)
  assert.match(source, /calibrationSamples\(\)[\s\S]*kind: sample\.kind[\s\S]*type: sample\.type/)
})
