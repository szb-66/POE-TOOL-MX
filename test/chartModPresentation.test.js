import test from 'node:test'
import assert from 'node:assert/strict'
import { fragmentModTooltipLines, formatBorderProbeFeedback } from '../src/utils/chartModPresentation.js'

test('碎片词缀浮层覆盖已匹配、未揭示、未知和缺失数据', () => {
  assert.deepEqual(fragmentModTooltipLines({
    status: 'matched',
    mod: { affixType: 'suffix', tier: 3, lines: ['第一行', '第二行'] }
  }), ['后缀词缀 · 等级 3', '第一行', '第二行'])
  assert.deepEqual(fragmentModTooltipLines({ status: 'unveiled' }), ['词缀：未揭示'])
  assert.deepEqual(fragmentModTooltipLines({ status: 'unknown', rawText: '复制原文\n第二行' }), [
    '词缀：未知', '复制原文', '第二行'
  ])
  assert.deepEqual(fragmentModTooltipLines(null), ['词缀：未知'])
})

test('部分边缘失败反馈保留精确边缘编号', () => {
  const feedback = formatBorderProbeFeedback({
    borderProbe: { attempted: 12, matched: 10, unknown: 2 },
    borderMods: {
      N0: { status: 'unknown' }, N1: { status: 'matched' },
      E2: { status: 'unknown' }
    }
  })
  assert.deepEqual(feedback, {
    partial: true,
    text: '边缘词缀已识别 10/12，未识别 N0、E2'
  })
})
