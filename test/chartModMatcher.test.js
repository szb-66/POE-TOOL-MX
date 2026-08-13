import test from 'node:test'
import assert from 'node:assert/strict'
import {
  UNVEILED_TEXT,
  matchBorderMods,
  matchFragmentMods,
  normalizeChartModText,
  textSimilarity
} from '../src/utils/chartModMatcher.js'

test('规范化:全角转半角、去空白、范围与数字占位', () => {
  assert.equal(normalizeChartModText('怪物生命总增 (46—60)%'), '怪物生命总增#%')
  assert.equal(normalizeChartModText('相邻区域中找到的物品数量提高 ５５%'), '相邻区域中找到的物品数量提高#%')
  assert.equal(normalizeChartModText('怪物可以发射 2 个额外投射物'), '怪物可以发射#个额外投射物')
})

test('碎片匹配:数值范围样例命中正确档位', () => {
  const result = matchFragmentMods([
    '怪物生命总增 51%',
    '相邻区域中找到的物品数量提高 55%'
  ])
  assert.equal(result.status, 'matched')
  assert.equal(result.mod.tier, 83)
  assert.equal(result.mod.affixType, 'prefix')
})

test('碎片匹配:低档位由固定奖励值区分', () => {
  const result = matchFragmentMods([
    '怪物生命总增 25%',
    '相邻区域中找到的物品数量提高 32%'
  ])
  assert.equal(result.status, 'matched')
  assert.equal(result.mod.tier, 68)
})

test('碎片匹配:未测绘文本标记未揭示', () => {
  const result = matchFragmentMods([
    '海图碎片',
    '--------',
    UNVEILED_TEXT
  ])
  assert.equal(result.status, 'unveiled')
})

test('碎片匹配:无关文本标记未知', () => {
  const result = matchFragmentMods(['这是一段与词缀无关的文字'])
  assert.equal(result.status, 'unknown')
})

test('碎片匹配:多行词缀组命中行数多的条目', () => {
  const result = matchFragmentMods([
    '怪物生命总增 15%',
    '怪物免疫晕眩',
    '相邻区域中找到的物品数量提高 25%'
  ])
  assert.equal(result.status, 'matched')
  assert.equal(result.mod.lines.includes('怪物免疫晕眩'), true)
})

test('碎片匹配:单行相邻区域词缀精确命中', () => {
  const result = matchFragmentMods(['相邻区域包含 5 个额外保险箱'])
  assert.equal(result.status, 'matched')
  assert.equal(result.mod.tier, 68)
})

test('边框匹配:精确文本命中', () => {
  const result = matchBorderMods(['相邻区域的怪物群规模提高 32%'])
  assert.equal(result.status, 'matched')
  assert.deepEqual(result.mod.lines, ['相邻区域的怪物群规模提高 32%'])
})

test('边框匹配:OCR 噪声下模糊匹配', () => {
  const result = matchBorderMods(['相邻区域的怪物群规模提高 32% '.replace('规模', '规摸')])
  assert.equal(result.status, 'matched')
  assert.equal(result.confidence > 0.8, true)
})

test('边框匹配:低相似度标记未知', () => {
  const result = matchBorderMods(['完全无关的文字内容'])
  assert.equal(result.status, 'unknown')
})

test('边框匹配:空输入标记未知', () => {
  assert.equal(matchBorderMods([]).status, 'unknown')
  assert.equal(matchBorderMods(null).status, 'unknown')
})

test('相似度工具:完全相同为 1,完全不同为 0', () => {
  assert.equal(textSimilarity('abc', 'abc'), 1)
  assert.equal(textSimilarity('abc', ''), 0)
  assert.ok(textSimilarity('相邻区域', '相邻区域') === 1)
})
