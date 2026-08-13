import test from 'node:test'
import assert from 'node:assert/strict'
import { BORDER_CHART_MODS } from '../src/data/chartModsData.js'
import {
  UNVEILED_TEXT,
  catalogLineKey,
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

test('边框匹配:复合词缀要求全部目录行并用第二行消歧', () => {
  for (const reward of [120, 180]) {
    const result = matchBorderMods([
      '相邻区域中找到的物品数量按每条连接降低 50%',
      `相邻区域中找到的物品数量提高 ${reward}%`
    ])
    assert.equal(result.status, 'matched', String(reward))
    assert.deepEqual(result.mod.lines, [
      '相邻区域中找到的物品数量按每条连接降低 50%',
      `相邻区域中找到的物品数量提高 ${reward}%`
    ])
  }

  const sharedLine = matchBorderMods(['相邻区域中找到的物品数量按每条连接降低 50%'])
  assert.equal(sharedLine.status, 'unknown')
})

test('边框匹配:完整目录文本被仓库等级文字粘连时唯一包含命中', () => {
  const cases = [
    ['相邻区域包含8 个额外的海兽群：83', '相邻区域包含 8 个额外的海兽群'],
    ['相邻区域的怪物群规模提高 32%L:83', '相邻区域的怪物群规模提高 32%'],
    ['悬停于航海探险规划板的方格上可查看相关区域词缀相邻区域的词缀数值提高60%', '相邻区域的词缀数值提高 60%']
  ]

  for (const [ocrText, expectedLine] of cases) {
    const result = matchBorderMods([ocrText])
    assert.equal(result.status, 'matched', ocrText)
    assert.deepEqual(result.mod.lines, [expectedLine])
    assert.equal(result.confidence, 0.95)
  }
})

test('边框匹配:多条完整目录文本粘在同一行时不提前包含匹配', () => {
  const result = matchBorderMods([
    '相邻区域的怪物群规模提高32%相邻区域的词缀数值提高60%L:83'
  ])
  assert.notEqual(result.confidence, 0.95)
  assert.equal(result.status, 'unknown')
})

test('边框目录:65 条词缀的不同文本之间不存在规范化包含歧义', () => {
  assert.equal(BORDER_CHART_MODS.length, 65)
  const catalogLines = BORDER_CHART_MODS.flatMap((mod, modIndex) =>
    mod.lines.map(line => ({ modIndex, line, key: catalogLineKey(line) })))
  for (const left of catalogLines) {
    for (const right of catalogLines) {
      if (left.modIndex === right.modIndex) continue
      // 两条复合词缀共享“每条连接降低 50%”首行，完整相同不属于包含匹配的唯一候选。
      if (left.key === right.key) continue
      assert.equal(left.key.includes(right.key), false, `${left.line} 包含 ${right.line}`)
    }
  }
})

test('边框匹配:目标词缀被 OCR 拆为多段时按阅读顺序合并命中', () => {
  const cases = [
    { lines: ['相邻区域包含', '8个额外的海兽群'], expected: '相邻区域包含 8 个额外的海兽群' },
    { lines: ['相邻区域的词缀数值提高', '60%。'], expected: '相邻区域的词缀数值提高 60%' },
    { lines: ['相邻区域的怪物群规模提高', '32%'], expected: '相邻区域的怪物群规模提高 32%' },
    { lines: ['相邻区域的怪物至少为', '魔法'], expected: '相邻区域的怪物至少为魔法' }
  ]
  for (const { lines, expected } of cases) {
    const result = matchBorderMods(lines)
    assert.equal(result.status, 'matched', lines.join('|'))
    assert.deepEqual(result.mod.lines, [expected])
  }
})

test('边框匹配:相邻段拼接不跨越无关 UI 行且不提前命中多目录', () => {
  const unrelated = matchBorderMods(['悬停于航海探险规划板', '相邻区域的词缀数值提高', '60%'])
  assert.equal(unrelated.status, 'matched')
  assert.deepEqual(unrelated.mod.lines, ['相邻区域的词缀数值提高 60%'])

  const segmented = matchBorderMods(['相邻区域包含', '8个额外的海兽群', '悬停于航海探险规划板'])
  assert.equal(segmented.status, 'matched')
  assert.deepEqual(segmented.mod.lines, ['相邻区域包含 8 个额外的海兽群'])
})

test('边框匹配:截断、局部及无关 UI 文本不能绕过原阈值', () => {
  for (const text of [
    '相邻区域的怪物群规模',
    '相邻区域包含8个额外',
    '仓库L:83区域词缀',
    ['相邻区域包含', '8个'],
    ['相邻区域', '无关文字片段']
  ]) {
    const result = matchBorderMods(Array.isArray(text) ? text : [text])
    assert.equal(result.status, 'unknown', JSON.stringify(text))
    assert.notEqual(result.confidence, 0.95)
  }
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
