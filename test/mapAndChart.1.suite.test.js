import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { BORDER_EDGE_IDS as _m0_BORDER_EDGE_IDS, DEFAULT_EDGE_OFFSET_RATIO as _m0_DEFAULT_EDGE_OFFSET_RATIO, computeBorderEdgeTargets as _m0_computeBorderEdgeTargets } from '../src/utils/chartEdgeGeometry.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { BORDER_CHART_MODS as _m1_BORDER_CHART_MODS } from '../src/data/chartModsData.js'
import { parseCopiedChartFragment as _m1_parseCopiedChartFragment } from '../electron/modules/priceCheck/chartRegions.js'
import { UNVEILED_TEXT as _m1_UNVEILED_TEXT, catalogLineKey as _m1_catalogLineKey, matchBorderMods as _m1_matchBorderMods, matchFragmentMods as _m1_matchFragmentMods, normalizeChartModText as _m1_normalizeChartModText, textSimilarity as _m1_textSimilarity } from '../src/utils/chartModMatcher.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { fragmentModTooltipLines as _m2_fragmentModTooltipLines, formatBorderProbeFeedback as _m2_formatBorderProbeFeedback } from '../src/utils/chartModPresentation.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { BORDER_CHART_MODS as _m3_BORDER_CHART_MODS, FRAGMENT_CHART_MODS as _m3_FRAGMENT_CHART_MODS } from '../src/data/chartModsData.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { readFileSync as _m4_readFileSync } from 'node:fs'
import { parseItemInfo as _m4_parseItemInfo } from '../electron/modules/item/parser.js'
import { matchMapRequirements as _m4_matchMapRequirements } from '../electron/modules/item/matcher.js'
import { CHART_FORMAT_EXAMPLES as _m4_CHART_FORMAT_EXAMPLES } from '../src/utils/supportedItemFormats.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { readFileSync as _m5_readFileSync } from 'node:fs'
import { createHash as _m5_createHash } from 'node:crypto'
import { LocalizationRuntime as _m5_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { createLocalizationDictionary as _m5_createLocalizationDictionary } from '../electron/modules/localization/text.js'
import { matchMapRequirements as _m5_matchMapRequirements } from '../electron/modules/item/matcher.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { readFileSync as _m6_readFileSync } from 'node:fs'
import { analyzeMapFeasibility as _m6_analyzeMapFeasibility, expandDescription as _m6_expandDescription, normalizeConditions as _m6_normalizeConditions } from '../src/domains/map/mapFeasibility.js'
import { createFeasibilityRunner as _m6_createFeasibilityRunner } from '../src/domains/map/mapFeasibilityRunner.js'
import { parseModsView as _m6_parseModsView, joinChartRows as _m6_joinChartRows } from '../scripts/generateMapFeasibilityData.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { cleanMigratedChartConfig as _m7_cleanMigratedChartConfig, cleanMigratedMapConfig as _m7_cleanMigratedMapConfig, createDefaultChartConfig as _m7_createDefaultChartConfig, createDefaultMapConfig as _m7_createDefaultMapConfig, getActiveMapRollingConfig as _m7_getActiveMapRollingConfig } from '../src/utils/mapPresetMigration.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { expressionMatches as _m8_expressionMatches, hasMinimumHanFragment as _m8_hasMinimumHanFragment } from '../src/domains/regex/compactExpression.js'
import { createDefaultMapRegexConfig as _m8_createDefaultMapRegexConfig, generateMapPriceExpression as _m8_generateMapPriceExpression, generateMapRegex as _m8_generateMapRegex, MAP_COMPACT_EXPRESSIONS as _m8_MAP_COMPACT_EXPRESSIONS, MAP_REGEX_AFFIXES as _m8_MAP_REGEX_AFFIXES, MAP_REGEX_CORPUS as _m8_MAP_REGEX_CORPUS, numericAtLeastPattern as _m8_numericAtLeastPattern, numericRangePattern as _m8_numericRangePattern, validateMapPriceRange as _m8_validateMapPriceRange } from '../src/domains/regex/mapRegex.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { mkdtemp as _m9_mkdtemp, writeFile as _m9_writeFile, appendFile as _m9_appendFile, rename as _m9_rename, rm as _m9_rm } from 'node:fs/promises'
import _m9_path from 'node:path'
import _m9_os from 'node:os'
import { ClientEventsService as _m9_ClientEventsService } from '../electron/modules/clientEvents/service.js'
import { ClientEventSettingsRepository as _m9_ClientEventSettingsRepository } from '../electron/modules/clientEvents/settingsRepository.js'
import { MapTrackerService as _m9_MapTrackerService } from '../electron/modules/mapTracker/service.js'
import { MapTrackerRepository as _m9_MapTrackerRepository } from '../electron/modules/mapTracker/repository.js'
import { detectClientProcessSessions as _m9_detectClientProcessSessions } from '../electron/modules/clientEvents/processDetection.js'
import { parseClientLogLine as _m9_parseClientLogLine } from '../electron/modules/clientEvents/parser.js'
import { normalizeMapTrackerSettings as _m9_normalizeMapTrackerSettings, createMapRun as _m9_createMapRun } from '../electron/modules/mapTracker/model.js'
import _m10_test from 'node:test'
import _m10_assert from 'node:assert/strict'
import { buildDashboardSummary as _m10_buildDashboardSummary, mergeDashboardRuns as _m10_mergeDashboardRuns } from '../shared/mapTrackerDashboard.js'
import _m11_test from 'node:test'
import _m11_assert from 'node:assert/strict'
import { readFileSync as _m11_readFileSync } from 'node:fs'
import { parse as _m11_parse, compileScript as _m11_compileScript } from '@vue/compiler-sfc'
import * as _m11_Vue from 'vue'
import { mapLabel as _m11_mapLabel } from '../shared/mapTrackerLabels.js'
import { buildDashboardSummary as _m11_buildDashboardSummary } from '../shared/mapTrackerDashboard.js'
import _m12_test from 'node:test'
import _m12_assert from 'node:assert/strict'
import { readFileSync as _m12_readFileSync } from 'node:fs'
import { mapLabel as _m12_mapLabel } from '../shared/mapTrackerLabels.js'
import { parseClientLogLine as _m12_parseClientLogLine } from '../electron/modules/clientEvents/parser.js'
import _m13_test from 'node:test'
import _m13_assert from 'node:assert/strict'
import { mkdtemp as _m13_mkdtemp, mkdir as _m13_mkdir, writeFile as _m13_writeFile, readFile as _m13_readFile, rm as _m13_rm } from 'node:fs/promises'
import _m13_os from 'node:os'
import _m13_path from 'node:path'
import { classifyArea as _m13_classifyArea, normalizeMapName as _m13_normalizeMapName } from '../shared/mapTrackerAreaCatalog.js'
import { MapTrackerRepository as _m13_MapTrackerRepository } from '../electron/modules/mapTracker/repository.js'
import { buildDashboardSummary as _m13_buildDashboardSummary } from '../shared/mapTrackerDashboard.js'
import { mapLabel as _m13_mapLabel } from '../shared/mapTrackerLabels.js'

// === Merged from chartEdgeGeometry.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const BORDER_EDGE_IDS = _m0_BORDER_EDGE_IDS
  const DEFAULT_EDGE_OFFSET_RATIO = _m0_DEFAULT_EDGE_OFFSET_RATIO
  const computeBorderEdgeTargets = _m0_computeBorderEdgeTargets
const REGION = { left: 100, top: 200, right: 925, bottom: 1028 }
const CLOCKWISE_EDGE_IDS = [
  'N0', 'N1', 'N2',
  'E0', 'E1', 'E2',
  'S2', 'S1', 'S0',
  'W2', 'W1', 'W0'
]

test('从 N0 开始返回连续顺时针的 12 段外边缘', () => {
  const edges = computeBorderEdgeTargets(REGION)
  const ids = edges.map(edge => edge.id)
  assert.deepEqual(ids, CLOCKWISE_EDGE_IDS)
  assert.equal(edges.length, 12)
  assert.deepEqual([...new Set(ids)].sort(), [...BORDER_EDGE_IDS].sort())
})

test('南边从右向左且西边从下向上完成顺时针后半圈', () => {
  const edges = computeBorderEdgeTargets(REGION)
  const south = edges.filter(edge => edge.direction === 'south')
  const west = edges.filter(edge => edge.direction === 'west')

  assert.deepEqual(south.map(edge => edge.id), ['S2', 'S1', 'S0'])
  assert.ok(south[0].x > south[1].x && south[1].x > south[2].x)
  assert.deepEqual(west.map(edge => edge.id), ['W2', 'W1', 'W0'])
  assert.ok(west[0].y > west[1].y && west[1].y > west[2].y)
})

test('825×828 标定区域沿对应方向外移 6% 后仍为 50 像素', () => {
  const edges = computeBorderEdgeTargets(REGION)
  const north = edges.filter(edge => edge.direction === 'north')
  const south = edges.filter(edge => edge.direction === 'south')
  const west = edges.filter(edge => edge.direction === 'west')
  const east = edges.filter(edge => edge.direction === 'east')

  assert.equal(DEFAULT_EDGE_OFFSET_RATIO, 0.06)
  assert.deepEqual(north.map(edge => edge.y), [150, 150, 150])
  assert.deepEqual(south.map(edge => edge.y), [1078, 1078, 1078])
  assert.deepEqual(west.map(edge => edge.x), [50, 50, 50])
  assert.deepEqual(east.map(edge => edge.x), [975, 975, 975])
})

test('不同海图区尺寸按宽高的 6% 缩放热点', () => {
  const cases = [
    { width: 550, height: 552, offsetX: 33, offsetY: 33 },
    { width: 688, height: 690, offsetX: 41, offsetY: 41 },
    { width: 1100, height: 1104, offsetX: 66, offsetY: 66 }
  ]
  for (const entry of cases) {
    const region = { left: 200, top: 300, right: 200 + entry.width, bottom: 300 + entry.height }
    const edges = computeBorderEdgeTargets(region)
    assert.equal(edges.find(edge => edge.id === 'N0').y, region.top - entry.offsetY)
    assert.equal(edges.find(edge => edge.id === 'S0').y, region.bottom + entry.offsetY)
    assert.equal(edges.find(edge => edge.id === 'W0').x, region.left - entry.offsetX)
    assert.equal(edges.find(edge => edge.id === 'E0').x, region.right + entry.offsetX)
  }
})

test('非正方形区域分别按宽度和高度计算横纵偏移', () => {
  const region = { left: 100, top: 200, right: 1100, bottom: 700 }
  const edges = computeBorderEdgeTargets(region)
  assert.equal(edges.find(edge => edge.id === 'N0').y, 170)
  assert.equal(edges.find(edge => edge.id === 'S0').y, 730)
  assert.equal(edges.find(edge => edge.id === 'W0').x, 40)
  assert.equal(edges.find(edge => edge.id === 'E0').x, 1160)
})

test('超出包含负坐标的显示器边界时钳制到屏幕内', () => {
  const screenBounds = { x: -1000, y: 0, width: 1000, height: 800 }
  const region = { left: -990, top: 10, right: -90, bottom: 790 }
  const edges = computeBorderEdgeTargets(region, screenBounds)
  for (const edge of edges) {
    assert.ok(edge.x >= -1000 && edge.x < 0, `${edge.id} x 越界: ${edge.x}`)
    assert.ok(edge.y >= 0 && edge.y < 800, `${edge.id} y 越界: ${edge.y}`)
  }
  assert.equal(edges.find(edge => edge.id === 'N0').y, 0)
  assert.equal(edges.find(edge => edge.id === 'S0').y, 799)
  assert.equal(edges.find(edge => edge.id === 'W0').x, -1000)
  assert.equal(edges.find(edge => edge.id === 'E0').x, -36)
})

test('无效区域返回空数组', () => {
  assert.deepEqual(computeBorderEdgeTargets(null), [])
  assert.deepEqual(computeBorderEdgeTargets({ left: 10, top: 10, right: 10, bottom: 20 }), [])
})

test('自定义偏移比例生效', () => {
  const edges = computeBorderEdgeTargets(REGION, null, 0.1)
  assert.equal(edges.find(edge => edge.id === 'N0').y, 117)
  assert.equal(edges.find(edge => edge.id === 'W0').x, 17)
})
})()

// === Merged from chartModMatcher.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const BORDER_CHART_MODS = _m1_BORDER_CHART_MODS
  const parseCopiedChartFragment = _m1_parseCopiedChartFragment
  const UNVEILED_TEXT = _m1_UNVEILED_TEXT
  const catalogLineKey = _m1_catalogLineKey
  const matchBorderMods = _m1_matchBorderMods
  const matchFragmentMods = _m1_matchFragmentMods
  const normalizeChartModText = _m1_normalizeChartModText
  const textSimilarity = _m1_textSimilarity
test('规范化:全角转半角、去空白、范围与数字占位', () => {
  assert.equal(normalizeChartModText('怪物生命总增 (46—60)%'), '怪物生命总增#%')
  assert.equal(normalizeChartModText('相邻区域中找到的物品数量提高 ５５%'), '相邻区域中找到的物品数量提高#%')
  assert.equal(normalizeChartModText('怪物可以发射 2 个额外投射物'), '怪物可以发射#个额外投射物')
})

test('规范化:当前掷值紧邻范围时折叠为单个范围占位', () => {
  for (const text of ['3(2-4)', '37 (26—40)%', '３（２－４）', '+37(26-40)%']) {
    assert.equal(normalizeChartModText(text), text.includes('%') ? '#%' : '#', text)
  }
  assert.equal(catalogLineKey('相邻区域包含 3(2-4) 个怪物'), '相邻区域包含#个怪物')
  assert.equal(normalizeChartModText('2 秒内出现 3 个怪物'), '#秒内出现#个怪物')
})

const rareChartWithRolledRanges = `物品类别: 海图
稀 有 度: 稀有
深水 跋涉
珊瑚密林海图
------
海底林地
区域等级: 83
物品数量: +110% (augmented)
怪物群大小: +18% (augmented)
亡者硫磺: +45% (augmented)
----------------------
需求:
等级: 66
------
物品等级: 83

{ 基底属性 }
相邻区域包含 3(2-4) 个额外被囚禁的怪物
-----------------------
海图形状：直线

{ 前缀属性 "抗性的" (等阶：1) — 元素, 混沌, 抗性 }
+37(26-40)% 怪物的混沌抗性
+26(26-40)% 怪物的元素抗性
{ 前缀属性 "装甲的" (等阶：1) — 物理 }
怪物的物理减伤提高 31(21-35)%
{ 前缀属性 "野蛮人的" (等阶：1) — 伤害 }
怪物伤害提高 33(26-35)%
此区域中找到的亡者硫磺提高 45%
{ 后缀属性 "巨人之" (等阶：1) }
怪物效果区域的扩大 58(46-60)%
--------------------
将此物品带给瓦莱丽，登上君临号，为该区域绘制海图。
出售获得通货:非绑定`

test('碎片匹配:完整稀有海图的实际值范围命中正确类型和词缀档位', () => {
  const parsed = parseCopiedChartFragment(rareChartWithRolledRanges)
  const result = matchFragmentMods(rareChartWithRolledRanges.split(/\r?\n/))
  assert.deepEqual([parsed.isChart, parsed.type, parsed.shapeLabel], [true, 'straight', '直线'])
  assert.equal(result.status, 'matched')
  assert.equal(result.mod.tier, 46)
  assert.deepEqual(result.mod.lines, ['相邻区域包含 (2—4) 个额外被囚禁的怪物'])
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
})()

// === Merged from chartModPresentation.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const fragmentModTooltipLines = _m2_fragmentModTooltipLines
  const formatBorderProbeFeedback = _m2_formatBorderProbeFeedback
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
})()

// === Merged from chartModsData.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const BORDER_CHART_MODS = _m3_BORDER_CHART_MODS
  const FRAGMENT_CHART_MODS = _m3_FRAGMENT_CHART_MODS
test('碎片词缀目录覆盖 poedb 全部 150 条', () => {
  assert.equal(FRAGMENT_CHART_MODS.length, 150)
})

test('边框词缀目录覆盖 poedb 全部 65 条', () => {
  assert.equal(BORDER_CHART_MODS.length, 65)
})

test('碎片词缀条目保留 poedb 来源标签且描述行非空', () => {
  const affixTypeCounts = {}
  for (const mod of FRAGMENT_CHART_MODS) {
    assert.ok(Number.isFinite(mod.tier), 'tier 必须是数字')
    assert.ok(['prefix', 'suffix', 'legendary', ''].includes(mod.affixType), `来源标签非法: ${mod.affixType}`)
    assert.ok(Array.isArray(mod.lines) && mod.lines.length > 0, '描述行不能为空')
    assert.ok(mod.lines.every(line => typeof line === 'string' && line.trim()), '描述行必须为非空字符串')
    assert.ok(Array.isArray(mod.tags), 'tags 必须是数组')
    affixTypeCounts[mod.affixType] = (affixTypeCounts[mod.affixType] || 0) + 1
  }
  assert.deepEqual(affixTypeCounts, { suffix: 32, prefix: 49, legendary: 1, '': 68 })
})

test('边框词缀条目字段完整,仅 poedb 原文的空描述条目无描述行', () => {
  const emptyOnes = BORDER_CHART_MODS.filter(mod => mod.lines.length === 0)
  // poedb 原文第 60 条边框词缀描述为空,如实转录;其余条目必须非空。
  assert.equal(emptyOnes.length, 1)
  for (const mod of BORDER_CHART_MODS) {
    assert.ok(Number.isFinite(mod.tier), 'tier 必须是数字')
    assert.ok(mod.lines.every(line => typeof line === 'string' && line.trim()), '描述行必须为非空字符串')
    assert.ok(Array.isArray(mod.tags), 'tags 必须是数组')
  }
})

test('目录描述行不包含英文内部标签行', () => {
  const all = [...FRAGMENT_CHART_MODS, ...BORDER_CHART_MODS]
  for (const mod of all) {
    for (const line of mod.lines) {
      assert.ok(!/^[a-z][a-z ]+\[?\d*\]?$/i.test(line.trim()) || /[\u4e00-\u9fff]/.test(line), `英文标签行未被剔除: ${line}`)
    }
  }
})

test('未测绘词缀条目存在且描述正确', () => {
  const unveiled = FRAGMENT_CHART_MODS.filter(mod => mod.lines.includes('航行词缀将在完成测绘后揭示'))
  assert.equal(unveiled.length, 1)
  assert.equal(unveiled[0].tier, 1)
  assert.equal(unveiled[0].affixType, 'legendary')
})
})()

// === Merged from chartRolling.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const readFileSync = _m4_readFileSync
  const parseItemInfo = _m4_parseItemInfo
  const matchMapRequirements = _m4_matchMapRequirements
  const CHART_FORMAT_EXAMPLES = _m4_CHART_FORMAT_EXAMPLES
const samples = Object.fromEntries(CHART_FORMAT_EXAMPLES.map(example => [example.id, example.text]))
const stat = (enabled, value) => ({ enabled, value })

test('JavaScript 航海海图匹配器隔离类别并匹配四项数值', () => {
  const chart = parseItemInfo(samples['chart-corrupted'])
  const config = {
    targetKind: 'chart',
    match: {
      blacklist: [], whitelist: [], selectedCount: 2,
      mandatoryStats: { deadmanSulphur: stat(true, 30) },
      optionalStats: { quantity: stat(true, 100), packSize: stat(true, 15) }
    }
  }
  assert.equal(matchMapRequirements(chart, config).isMatch, true)
  assert.equal(matchMapRequirements({ ...chart, category: '地图' }, config).reason, 'category')
  assert.equal(matchMapRequirements(chart, { ...config, targetKind: 'atlas' }).reason, 'category')
})

test('航海海图黑名单优先于白名单且基底始终需要满足', () => {
  const chart = parseItemInfo(samples['chart-identified'])
  const base = {
    targetKind: 'chart',
    match: {
      blacklist: ['中毒'], whitelist: ['闪电伤害'],
      mandatoryStats: { deadmanSulphur: stat(true, 30) }, optionalStats: {}
    }
  }
  assert.equal(matchMapRequirements(chart, base).reason, 'blacklist')
  assert.equal(matchMapRequirements(chart, {
    ...base,
    match: { ...base.match, blacklist: [], mandatoryStats: { deadmanSulphur: stat(true, 31) } }
  }).reason, 'mandatory')
})

test('地图页面提供独立内部 Tab 且不新增侧栏入口', () => {
  const view = readFileSync(new URL('../src/domains/map/MapView.vue', import.meta.url), 'utf8')
  const catalog = readFileSync(new URL('../src/features/featureCatalog.js', import.meta.url), 'utf8')
  const dashboard = readFileSync(new URL('../src/domains/dashboard/useDashboard.js', import.meta.url), 'utf8')
  const presetStore = readFileSync(new URL('../src/stores/preset.js', import.meta.url), 'utf8')
  const scriptService = readFileSync(new URL('../src/utils/scriptService.js', import.meta.url), 'utf8')
  assert.match(view, /label="异界地图" name="atlas"/)
  assert.match(view, /label="航海海图" name="chart"/)
  assert.match(view, /MapRollingProfilePanel/)
  assert.match(view, /label="契约蓝图" name="heist"/)
  assert.match(view, /:type="activeKind === 'atlas' \? 'map' : activeKind"/)
  assert.equal((catalog.match(/label: '海图'/g) || []).length, 1)
  assert.match(dashboard, /航海海图/)
  assert.match(dashboard, /activeMapConfig/)
  assert.match(dashboard, /presetStore\.chartPresets/)
  assert.match(presetStore, /const chartPresets = ref/)
  assert.match(presetStore, /const currentChartPresetId = ref/)
  assert.match(presetStore, /const mapRollingKind = ref/)
  assert.match(scriptService, /presetStore\.mapRollingKind/)
  assert.match(scriptService, /presetStore\.currentChartPreset/)
})
})()

// === Merged from internationalHeistLocalization.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const readFileSync = _m5_readFileSync
  const createHash = _m5_createHash
  const LocalizationRuntime = _m5_LocalizationRuntime
  const createLocalizationDictionary = _m5_createLocalizationDictionary
  const matchMapRequirements = _m5_matchMapRequirements
// Actual, signature-verified ClientStrings copied into an offline fixture;
// these are never activated or fetched during the test.
const clientStrings=JSON.parse(readFileSync(new URL('./fixtures/heist-client-strings.json',import.meta.url)))
const entry=(id,en,cn,tw=cn,table='baseitemtypes',kind='dat')=>({id,en,cn,tw,table,kind,field:kind==='stat'?'variant:0':'Name',sourceHash:createHash('sha256').update(en).digest('hex')})
const target=entry('Metadata/Items/Heist/HeistFinalObjective29','Golden Matatl Idol',undefined,'黃金麥塔爾神像')
const modifier=entry('heist-life','Monsters have {0}% more Life','怪物生命总增 {0}%','怪物有 {0}% 更多生命','metadata/statdescriptions/map_stat_descriptions.txt','stat')
const entries=[...clientStrings,target,modifier]
const runtime=(source=entries,revision='active')=>new LocalizationRuntime({serverId:'international',entries:()=>source,revision:()=>revision})
const field=(id,locale)=>clientStrings.find(entry=>entry.id===id)[locale]
const render=(id,locale,values)=>field(id,locale).replace(/\{(\d+)\}/g,(_,parameter)=>values[Number(parameter)])
const text=(locale,kind='Contracts',{targetName=locale==='tw'?'黃金麥塔爾神像':'Golden Matatl Idol',job='Lockpicking',npc='"Karst, the Lockpick"'}={})=>{
  const language=locale==='en'?{itemClass:'Item Class',category:kind,rarity:'Rarity',rare:'Rare',quantity:'Item Quantity',itemRarity:'Item Rarity',level:'Item Level'}
    :locale==='cn'?{itemClass:'物品类别',category:kind==='Contracts'?'契约':'蓝图',rarity:'稀有度',rare:'稀有',quantity:'物品数量',itemRarity:'物品稀有度',level:'物品等级'}
      :{itemClass:'物品種類',category:kind==='Contracts'?'契約':'藍圖',rarity:'稀有度',rare:'稀有',quantity:'物品數量',itemRarity:'物品稀有度',level:'物品等級'}
  const metadata=[`${field('ItemDisplayHeistContractLevel',locale)}: 83`,render('ItemDisplayHeistContractObjectiveWithValue',locale,[targetName,'Moderate Value']),
    render('ItemDisplayHeistContractJob',locale,['5',job]),render('ItemDisplayHeistJobRequirement',locale,['3 (unmet)','Deception']),render('ItemDisplayHeistContractNPC',locale,[npc])]
  if(kind==='Blueprints')for(const id of ['ItemDisplayHeistBlueprintWings','ItemDisplayHeistBlueprintEscapeRooms','ItemDisplayHeistBlueprintRewardRooms'])metadata.push(`${field(id,locale)}: 4/4`)
  return [`${language.itemClass}: ${language.category}`,`${language.rarity}: ${language.rare}`,locale==='en'?'Doom Trail':locale==='cn'?'灾厄之途':'災厄之途',kind==='Contracts'?'Contract: Bunker':'Blueprint: Bunker','--------',...metadata,
    `${language.quantity}: +80%`,`${language.itemRarity}: +20%`,`${field('ItemDisplayHeistAlertLevelReduction',locale)}: +30%`,`${field('ItemDisplayHeistLockdownTimeIncrease',locale)}: +40%`,`${field('ItemDisplayHeistMaxReinforcements',locale)}: -25%`,
    '--------',`${language.level}: 83`,'--------','{ Prefix Modifier "Healthy" (Tier: 1) }',locale==='en'?'Monsters have 30% more Life':locale==='cn'?'怪物生命总增 30%':'怪物有 30% 更多生命',
    '--------',field(kind==='Contracts'?'ItemDescriptionHeistContract':'ItemDescriptionHeistBlueprint',locale)].join('\n')
}
const mapConfig={targetKind:'heist',match:{mandatoryStats:{quantity:{enabled:true,value:80},timeBeforeLockdown:{enabled:true,value:40}},whitelist:['Monsters have #% more Life'],blacklist:[]}}

test('完整契约/蓝图的实际英文简繁结构和English参数统一，不把目标/要求/揭露信息混入词缀',()=>{
  for(const kind of ['Contracts','Blueprints'])for(const locale of ['en','cn','tw']){
    const source=text(locale,kind),item=runtime().parseItem(source,'active')
    assert.equal(item.category,kind==='Contracts'?'契约':'蓝图',`${kind}/${locale}`)
    assert.equal(item.areaLevel,83)
    assert.deepEqual(item.heistStats,{quantity:80,rarity:20,alertLevelReduction:30,timeBeforeLockdown:40,maximumAliveReinforcements:-25})
    assert.deepEqual(item.explicitMods,['Monsters have 30% more Life'])
    assert.equal(item.modifiers[0].tier,1)
    assert.equal(item.isQuestItem,false)
    assert.equal(matchMapRequirements(item,mapConfig).isMatch,true)
    assert.equal(matchMapRequirements(item,{...mapConfig,match:{...mapConfig.match,blacklist:['more Life']}}).reason,'blacklist')
    assert.equal(item.originalText,source)
    assert.match(item.canonicalText,/Requires Deception \(Level 3 \(unmet\)\)/)
  }
})

test('NPC引号逗号与目标价值字符串保留，额外中文参数只在当前词库精确映射时通过',()=>{
  const known=[entry('fixture-job','Lockpicking','开锁','撬鎖','test-heist-names'),entry('fixture-npc','Karst, the Lockpick','卡斯特，解密者','卡司特，撬鎖者','test-heist-names'),entry('fixture-value','Moderate Value','中等价值','中等價值','test-heist-names')]
  for(const [locale,job,npc]of[['cn','开锁','"卡斯特，解密者"'],['tw','撬鎖','"卡司特，撬鎖者"']]){
    const source=text(locale,'Contracts',{job,npc}).replace('Moderate Value',locale==='cn'?'中等价值':'中等價值')
    const item=runtime([...entries,...known]).parseItem(source,'active')
    assert.match(item.canonicalText,/Requires "Karst, the Lockpick"/)
    assert.match(item.canonicalText,/Golden Matatl Idol \(Moderate Value\)/)
    assert.deepEqual(item.explicitMods,['Monsters have 30% more Life'])
    assert.throws(()=>runtime().parseItem(source,'active'),/未匹配/,'当前资源没有独立Job/NPC译名时不能猜译')
  }
})

test('活动ClientStrings标签进入snapshot，大小写Lockdown字段和实际简繁揭露名可用',()=>{
  const value=runtime().snapshot().structureAliases
  for(const [alias,canonical]of[['赏金目标','Heist Target'],['劫盜目標','Heist Target'],['发现的侧厅','Wings Revealed'],['已揭露側廂','Wings Revealed'],['揭露逃脫路線','Escape Routes Revealed'],['最大生存支援','Maximum Alive Reinforcements'],['Time Before Lockdown','Time before Lockdown']])assert.equal(value[alias],canonical,alias)
  const source=text('cn','Blueprints').replace('封锁前的时间','Time Before Lockdown')
  assert.equal(runtime().parseItem(source,'active').heistStats.timeBeforeLockdown,40)
})

test('legacy ## 仅移除已知结构字段前缀，不豁免未知中文身份或词缀',()=>{
  for(const locale of ['cn','tw']){
    const source=text(locale).replace(locale==='cn'?'物品等级: 83':'物品等級: 83',locale==='cn'?'## 物品等级: 83':'## 物品等級: 83')
    const item=runtime().parseItem(source,'active')
    assert.equal(item.level,83)
    assert.deepEqual(item.explicitMods,['Monsters have 30% more Life'])
    assert.equal(item.originalText,source)
    assert.throws(()=>runtime().parseItem(source+'\n## 未知关键状态: 未知状态','active'),/未匹配/)
    assert.throws(()=>runtime().parseItem(source+'\n## 未知危险词缀','active'),/未匹配/)
  }
})

test('错误稳定ID/en/hash、结构标签歧义、未知目标/Job参数与候选失效都不静默省略',()=>{
  const wings=clientStrings.find(entry=>entry.id==='ItemDisplayHeistBlueprintWings')
  for(const wrong of [{...wings,id:'WrongItemDisplayId',cn:'伪侧厅'}, {...wings,sourceHash:'0'.repeat(64),cn:'伪侧厅'}, {...wings,en:'Other Wings',sourceHash:createHash('sha256').update('Other Wings').digest('hex'),cn:'伪侧厅'}]){
    const source=[...entries.filter(entry=>entry.id!==wings.id),wrong]
    assert.ok(!createLocalizationDictionary(source).aliasesFor('Wings Revealed').includes('伪侧厅'))
    assert.throws(()=>runtime(source).parseItem(text('cn','Blueprints').replace('发现的侧厅','伪侧厅'),'active'),/未匹配/)
  }
  const collision=entries.map(entry=>['ItemDisplayHeistBlueprintWings','ItemDisplayHeistBlueprintEscapeRooms'].includes(entry.id)?{...entry,cn:'重复结构标签'}:entry)
  assert.throws(()=>runtime(collision).parseItem(text('cn','Blueprints').replace('发现的侧厅','重复结构标签'),'active'),/多个候选/)
  assert.throws(()=>runtime().parseItem(text('cn','Contracts',{targetName:'未知目标'}),'active'),/未匹配/)
  assert.throws(()=>runtime().parseItem(text('cn','Contracts',{job:'未知职业'}),'active'),/未匹配/)
  assert.throws(()=>runtime([...entries,entry('target-conflict','Other Idol',undefined,'黃金麥塔爾神像')]).parseItem(text('tw'),'active'),/多个.*候选/)
  assert.throws(()=>runtime(entries,'').parseItem(text('tw'),''),/未匹配/)
})
})()

// === Merged from mapFeasibility.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const readFileSync = _m6_readFileSync
  const analyzeMapFeasibility = _m6_analyzeMapFeasibility
  const expandDescription = _m6_expandDescription
  const normalizeConditions = _m6_normalizeConditions
  const createFeasibilityRunner = _m6_createFeasibilityRunner
  const parseModsView = _m6_parseModsView
  const joinChartRows = _m6_joinChartRows
function mod(id, side, stats = {}, groups = [id], lines = [id]) {
  return { id, side, groups, level: 1, lines, outcomes: [{ lines, stats }] }
}
const filler = () => [mod('p0', 'prefix'), mod('p1', 'prefix'), mod('p2', 'prefix'), mod('s0', 'suffix'), mod('s1', 'suffix'), mod('s2', 'suffix')]
function pool(mods, kind = 'atlas', id = 'base') { return { id, kind, mods, complete: true, counts: [4, 5, 6], maxLevel: 100, prefixLimit: 3, suffixLimit: 3 } }
function catalog(pools, complete = true) { return { pools, coverage: Object.fromEntries(['atlas', 'chart', 'heist'].map(k => [k, { complete }])) } }
function run(mods, match, extra = {}) { return analyzeMapFeasibility({ kind: 'atlas', profile: { match }, catalog: catalog([pool(mods)]), ...extra }) }
const need = (key, value) => ({ mandatoryStats: { [key]: { enabled: true, value } } })

test('blacklist attribution requires a witness without blacklist', () => {
  const result = run([mod('唯一数量', 'prefix', { quantity: 30 }), ...filler()], { ...need('quantity', 30), blacklist: ['唯一数量'] })
  assert.equal(result.status, 'blacklist-impossible')
  assert.equal(result.upperBounds.quantity, 0)
})
test('originally impossible conditions are not blamed on blacklist', () => {
  assert.equal(run(filler(), { ...need('quantity', 999), blacklist: ['无关'] }).status, 'conditions-impossible')
})
test('mutually exclusive individual maxima cannot be combined', () => {
  const mods = [mod('q', 'prefix', { quantity: 30 }, ['exclusive']), mod('r', 'prefix', { rarity: 30 }, ['exclusive']), ...filler()]
  assert.equal(run(mods, need('quantity', 30)).status, 'possible')
  assert.equal(run(mods, need('rarity', 30)).status, 'possible')
  assert.equal(run(mods, { mandatoryStats: { quantity: { enabled: true, value: 30 }, rarity: { enabled: true, value: 30 } } }).status, 'conditions-impossible')
})
test('prefix capacity and compound modifiers', () => {
  const mods = ['quantity', 'rarity', 'packSize', 'moreMaps'].map(k => mod(k, 'prefix', { [k]: 1 }))
  const match = { mandatoryStats: Object.fromEntries(['quantity', 'rarity', 'packSize', 'moreMaps'].map(k => [k, { enabled: true, value: 1 }])) }
  assert.equal(run([...mods, ...filler()], match).status, 'conditions-impossible')
  assert.equal(run([mod('compound', 'prefix', { quantity: 1, rarity: 1, packSize: 1, moreMaps: 1 }), ...filler()], match).status, 'possible')
})
test('another pool may satisfy but pools cannot mix', () => {
  const pools = [pool([mod('q', 'prefix', { quantity: 10 }), ...filler()], 'atlas', 'low'), pool([mod('r', 'prefix', { rarity: 10 }), ...filler()], 'atlas', 'high')]
  const match = { mandatoryStats: { quantity: { enabled: true, value: 10 }, rarity: { enabled: true, value: 10 } } }
  assert.equal(run([], match, { catalog: catalog(pools) }).status, 'conditions-impossible')
  assert.equal(run([], need('rarity', 10), { catalog: catalog(pools) }).witness.poolId, 'high')
})
test('optional N and duplicate mandatory/optional match runtime', () => {
  const conditions = normalizeConditions('atlas', { mandatoryStats: { quantity: { enabled: true, value: 5 } }, optionalStats: { quantity: { enabled: true, value: 10 }, rarity: { enabled: true, value: 5 } }, selectedCount: 2 })
  assert.deepEqual(conditions.mandatory, [{ key: 'quantity', value: 10 }])
  assert.deepEqual(conditions.optional, [{ key: 'rarity', value: 5 }])
  assert.equal(run([mod('q', 'prefix', { quantity: 10, rarity: 5 }), ...filler()], { optionalStats: { quantity: { enabled: true, value: 10 }, rarity: { enabled: true, value: 5 } }, selectedCount: 2 }).status, 'possible')
})
test('whitelist is mandatory only in heist; blacklist always wins', () => {
  for (const kind of ['atlas', 'chart', 'heist']) {
    const result = analyzeMapFeasibility({ kind, profile: { match: { whitelist: ['absent'] } }, catalog: catalog([pool(filler(), kind)]) })
    assert.equal(result.status, kind === 'heist' ? 'conditions-impossible' : 'possible')
  }
  const data = catalog([pool([mod('needle', 'prefix'), ...filler()], 'heist')])
  assert.equal(analyzeMapFeasibility({ kind: 'heist', profile: { match: { blacklist: ['needle'], whitelist: ['needle'] } }, catalog: data }).status, 'blacklist-impossible')
})
test('blank whitelist and nonempty whitespace blacklist preserve runtime semantics', () => {
  assert.deepEqual(normalizeConditions('heist', { whitelist: [' ', ''], blacklist: [' ', ''] }).whitelist, [])
  assert.deepEqual(normalizeConditions('atlas', { blacklist: [' ', ''] }).blacklist, [' '])
})
test('numeric blacklist excludes only matching rolls', () => {
  const m = { id: 'range', side: 'prefix', groups: ['range'], level: 1, lines: ['伤害提高 (10—12)%'], stats: [{ id: 'map_item_drop_quantity_+%', min: 30, max: 30 }] }
  assert.equal(run([m, ...filler()], { ...need('quantity', 30), blacklist: ['提高 12%'] }).status, 'possible')
  assert.equal(run([m, ...filler()], { ...need('quantity', 30), blacklist: ['提高 10%', '提高 11%', '提高 12%'] }).status, 'blacklist-impossible')
})
test('explicit correlated outcomes cannot independently maximize stats', () => {
  const m = mod('correlated', 'prefix')
  m.outcomes = [{ lines: ['低'], stats: { quantity: 10, rarity: 1 } }, { lines: ['高'], stats: { quantity: 1, rarity: 10 } }]
  assert.equal(run([m, ...filler()], { mandatoryStats: { quantity: { enabled: true, value: 10 }, rarity: { enabled: true, value: 10 } } }).status, 'conditions-impossible')
})
test('unknown data, correlations and search exhaustion never prove impossibility', () => {
  assert.equal(run(filler(), need('quantity', 10), { catalog: catalog([pool(filler())], false) }).status, 'unknown')
  assert.equal(run(filler(), {}, { maxNodes: 0 }).status, 'unknown')
  assert.equal(run([], {}).status, 'unknown')
  assert.equal(run(filler(), need('quantity', NaN)).status, 'unknown')
  assert.equal(expandDescription(['伤害 (1—3)% 与速度 (4—5)%']), null)
  assert.deepEqual(expandDescription(['伤害 (-3—-1)%']), [['伤害 -3%'], ['伤害 -2%'], ['伤害 -1%']])
})
test('unknown pool does not erase a witness in another pool', () => {
  const data = catalog([{ ...pool([], 'atlas', 'unknown'), complete: false }, pool(filler())], false)
  assert.equal(run([], {}, { catalog: data }).status, 'possible')
})
test('exalted requires six and vaal cannot rescue pre-vaal failure', () => {
  const mods = filler().slice(0, 4)
  assert.equal(run(mods, {}).status, 'possible')
  assert.equal(run(mods, {}, { profile: { exalted: { enabled: true }, vaal: { enabled: true } } }).status, 'conditions-impossible')
})
test('level filtering and multiple mutual exclusion groups', () => {
  const m = { ...mod('high', 'prefix', { quantity: 10 }), level: 101 }
  assert.equal(run([m, ...filler()], need('quantity', 10)).status, 'conditions-impossible')
  assert.equal(run([mod('q', 'prefix', { quantity: 10 }, ['a', 'b']), mod('r', 'suffix', { rarity: 10 }, ['b']), ...filler()], { mandatoryStats: { quantity: { enabled: true, value: 10 }, rarity: { enabled: true, value: 10 } } }).status, 'conditions-impossible')
})
test('runner terminates obsolete tasks and discards late messages on changes/unmount', () => {
  const jobs = [], workers = [], results = []
  const runner = createFeasibilityRunner({ schedule: fn => { jobs.push(fn); return jobs.length }, cancel: () => {}, onPending: () => {}, onResult: x => results.push(x), createWorker: () => {
    const worker = { postMessage(data) { this.input = data }, terminate() { this.terminated = true } }
    workers.push(worker); return worker
  } })
  runner.update({ kind: 'atlas' }); jobs.shift()()
  runner.update({ kind: 'chart' }); jobs.shift()()
  assert.equal(workers[0].terminated, true)
  workers[0].onmessage({ data: { id: workers[0].input.id, result: 'old' } })
  workers[1].onmessage({ data: { id: workers[1].input.id, result: 'current' } })
  assert.deepEqual(results, ['current'])
  runner.update({ kind: 'heist' }); jobs.shift()(); runner.dispose()
  workers[2].onmessage({ data: { id: workers[2].input.id, result: 'disposed' } })
  assert.deepEqual(results, ['current'])
})
test('runner creation failure is a visible unknown result', () => {
  let job, result
  const runner = createFeasibilityRunner({ schedule: fn => { job = fn }, cancel: () => {}, onPending: () => {}, onResult: value => { result = value }, createWorker: () => { throw Error('unavailable') } })
  runner.update({}); job()
  assert.equal(result.status, 'unknown')
  runner.dispose()
})
test('source parser fails closed and chart identities must be unique', () => {
  assert.throws(() => parseModsView('none', 5))
  const rows = [{ level: 1, side: 'prefix', lines: ['Monsters have 1 Life'] }]
  assert.throws(() => joinChartRows(rows, rows, {}))
  const m = { domain: 'deepwater_chart', generation_type: 'prefix', required_level: 1, text: 'Monsters have 1 Life' }
  assert.throws(() => joinChartRows(rows, rows, { a: m, b: m }))
})
test('live snapshot has structured identities and positive witnesses for all tabs', () => {
  const data = JSON.parse(readFileSync(new URL('../src/data/mapFeasibilityData.json', import.meta.url)))
  assert.equal(data.pools.length, 7)
  assert.ok(data.pools.every(p => !p.baseStatVariants))
  assert.equal(data.coverage.atlas.quality, undefined)
  assert.equal(data.coverage.chart.bases.length, 4)
  assert.equal(data.coverage.chart.nonAffixes.length, 69)
  assert.equal(data.coverage.atlas.conditionalAffixes.length, 52)
  assert.ok(data.coverage.atlas.conditionalAffixes.every(m => m.spawnWeights.some(w => w.tag.startsWith('has_uber_map_'))))
  assert.equal(analyzeMapFeasibility({ kind: 'atlas', profile: { match: need('moreCurrency', 100) }, catalog: data }).status, 'possible')
  for (const p of data.pools) {
    assert.ok(p.mods.length > 40)
    assert.equal(new Set(p.mods.map(m => m.id)).size, p.mods.length)
    assert.ok(p.mods.every(m => m.groups.length && m.stats.length && m.lines.length))
  }
  for (const kind of ['atlas', 'chart', 'heist']) {
    assert.equal(analyzeMapFeasibility({ kind, profile: { match: need('quantity', 80) }, catalog: data }).status, 'possible')
    assert.equal(analyzeMapFeasibility({ kind, profile: { match: need('quantity', 100000) }, catalog: data }).status, kind === 'heist' ? 'conditions-impossible' : 'unknown')
  }
})


test('quality variants cannot provide a feasibility witness', () => {
  for (const kind of ['atlas', 'chart', 'heist']) {
    const p = { ...pool(filler(), kind), baseStatVariants: [{ id: 'old-quality', stats: { quantity: 10 } }] }
    const result = analyzeMapFeasibility({ kind, profile: { match: need('quantity', 10) }, catalog: catalog([p]) })
    assert.equal(result.status, 'conditions-impossible')
    assert.equal(result.upperBounds.quantity, 0)
  }
})

test('inert added tags permit witnesses; consumed tags remain unresolved', () => {
  const tagged = { ...mod('tagged', 'prefix', { quantity: 20 }), addsTags: ['dependency'] }
  assert.equal(run([tagged, ...filler()], need('quantity', 20)).status, 'possible')
  const dependent = { ...mod('dependent', 'suffix'), spawnWeights: [{ tag: 'dependency', weight: 1 }] }
  assert.equal(run([tagged, dependent, ...filler()], need('quantity', 20)).status, 'unknown')
})
})()

// === Merged from mapPresetMigration.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const cleanMigratedChartConfig = _m7_cleanMigratedChartConfig
  const cleanMigratedMapConfig = _m7_cleanMigratedMapConfig
  const createDefaultChartConfig = _m7_createDefaultChartConfig
  const createDefaultMapConfig = _m7_createDefaultMapConfig
  const getActiveMapRollingConfig = _m7_getActiveMapRollingConfig
test('地图公共基底迁移时取已启用配置中的更严格阈值并清理已废弃的3.29字段', () => {
  const map = cleanMigratedMapConfig({
    strategy: 'normal',
    tiers: { t17: true },
    match: {
      mandatoryStats: {
        quantityNormal: { enabled: true, value: 80 },
        quantityT17: { enabled: true, value: 120 },
        rarityNormal: { enabled: false, value: 70 },
        rarityT17: { enabled: true, value: 40 },
        packSizeNormal: { enabled: true, value: 25 },
        packSizeT17: { enabled: true, value: 45 }
      }
    }
  })

  assert.equal(map.match.mandatoryStats.quantity, undefined)
  assert.deepEqual(map.match.mandatoryStats.rarity, { enabled: true, value: 40 })
  assert.deepEqual(map.match.mandatoryStats.packSize, { enabled: true, value: 45 })
  assert.equal('tiers' in map, false)
  assert.equal('strategy' in map, false)
})

test('地图专用基底和单侧配置被保留且3.29圣甲虫字段自动清理', () => {
  const map = cleanMigratedMapConfig({
    match: {
      optionalStats: {
        packSizeNormal: { enabled: true, value: 25 },
        moreMaps: { enabled: true, value: 35 },
        moreThreads: { enabled: true, value: 60 },
        atlasDrops: { enabled: true, value: 90 },
        moreScarabs: { enabled: false, value: 70 }
      }
    }
  })

  assert.deepEqual(map.match.optionalStats.packSize, { enabled: true, value: 25 })
  assert.deepEqual(map.match.optionalStats.moreMaps, { enabled: true, value: 35 })
  assert.deepEqual(map.match.optionalStats.moreThreads, { enabled: true, value: 60 })
  assert.deepEqual(map.match.optionalStats.atlasDrops, { enabled: true, value: 90 })
  assert.equal(map.match.optionalStats.moreScarabs, undefined)
})

test('地图配置迁移可重复执行且默认包含3.30六项基底', () => {
  const initial = createDefaultMapConfig()
  const once = cleanMigratedMapConfig(initial)
  const twice = cleanMigratedMapConfig(once)

  assert.deepEqual(twice, once)
  assert.deepEqual(Object.keys(once.match.mandatoryStats), [
    'rarity', 'packSize', 'moreMaps', 'moreThreads', 'atlasDrops', 'moreCurrency'
  ])
  assert.deepEqual(once.exalted, { enabled: false })
})

test('地图与航海海图配置独立迁移且运行时按目标选择', () => {
  const once = cleanMigratedMapConfig({ method: 'chaos', match: { blacklist: ['反射'] } })
  const twice = cleanMigratedMapConfig(once)
  assert.deepEqual(twice, once)
  assert.equal(once.method, 'chaos')
  assert.deepEqual(once.match.blacklist, ['反射'])
  assert.equal('chart' in once, false)
  assert.equal('activeKind' in once, false)

  const chart = cleanMigratedChartConfig({ method: 'alchemy' }, once.grid)
  assert.deepEqual(Object.keys(chart.match.mandatoryStats), [
    'quantity', 'rarity', 'packSize', 'deadmanSulphur'
  ])
  chart.method = 'chaos'
  chart.exalted.enabled = true
  const active = getActiveMapRollingConfig(once, chart, 'chart')
  assert.equal(active.targetKind, 'chart')
  assert.equal(active.method, 'chaos')
  assert.equal(active.exalted.enabled, true)
  assert.equal(once.exalted.enabled, false)
  assert.equal(active.grid.rows, 5)
})

test('地图与海图默认关闭全部可选动作', () => {
  for (const config of [
    createDefaultMapConfig(),
    createDefaultChartConfig(),
    cleanMigratedMapConfig({}),
    cleanMigratedChartConfig({})
  ]) {
    assert.equal(config.exalted.enabled, false)
    assert.equal(config.vaal.enabled, false)
    assert.equal(config.autoStash, false)
  }
})

test('地图与海图迁移只补齐缺失的可选动作并保留显式开关', () => {
  const map = cleanMigratedMapConfig({
    exalted: { enabled: true },
    vaal: { enabled: true, checkAfter: true },
    autoStash: true
  })
  const chart = cleanMigratedChartConfig({
    exalted: { enabled: true },
    vaal: { enabled: true, checkAfter: true },
    autoStash: true
  })

  for (const config of [map, chart]) {
    assert.deepEqual(config.exalted, { enabled: true })
    assert.deepEqual(config.vaal, { enabled: true, checkAfter: true })
    assert.equal(config.autoStash, true)
  }

  const partiallySaved = cleanMigratedMapConfig({
    exalted: { enabled: true },
    vaal: { checkAfter: true }
  })
  assert.equal(partiallySaved.exalted.enabled, true)
  assert.equal(partiallySaved.vaal.enabled, false)
  assert.equal(partiallySaved.vaal.checkAfter, true)
  assert.equal(partiallySaved.autoStash, false)
})
})()

// === Merged from mapRegex.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const expressionMatches = _m8_expressionMatches
  const hasMinimumHanFragment = _m8_hasMinimumHanFragment
  const createDefaultMapRegexConfig = _m8_createDefaultMapRegexConfig
  const generateMapPriceExpression = _m8_generateMapPriceExpression
  const generateMapRegex = _m8_generateMapRegex
  const MAP_COMPACT_EXPRESSIONS = _m8_MAP_COMPACT_EXPRESSIONS
  const MAP_REGEX_AFFIXES = _m8_MAP_REGEX_AFFIXES
  const MAP_REGEX_CORPUS = _m8_MAP_REGEX_CORPUS
  const numericAtLeastPattern = _m8_numericAtLeastPattern
  const numericRangePattern = _m8_numericRangePattern
  const validateMapPriceRange = _m8_validateMapPriceRange
test('地图正则空配置返回统一空结果', () => {
  assert.deepEqual(generateMapRegex(createDefaultMapRegexConfig()), {
    regex: '', length: 0, overLimit: false, warnings: [], includeCount: 0, excludeCount: 0
  })
})

test('地图数值精准与优化模式都覆盖边界', () => {
  const exact = numericAtLeastPattern(998, 'exact')
  const optimized = numericAtLeastPattern(80, 'optimized')
  assert.match(exact, /998\|999/)
  assert.ok(new RegExp(`^${optimized}$`).test('80'))
  assert.ok(new RegExp(`^${optimized}$`).test('999'))
  assert.equal(new RegExp(`^${optimized}$`).test('79'), false)
})

test('地图状态和词缀组合包括与排除结果', () => {
  const config = createDefaultMapRegexConfig()
  config.stats.atlasDrops = { enabled: true, value: 80 }
  config.rarity = { mode: 'include', selectedIds: ['rare'] }
  config.corrupted = { enabled: true, mode: 'exclude' }
  config.includeAffixIds = [MAP_REGEX_AFFIXES[0].id]
  config.excludeAffixIds = [MAP_REGEX_AFFIXES[1].id]
  const result = generateMapRegex(config)
  assert.match(result.regex, /异界|界掉|掉落/)
  assert.match(result.regex, /稀有\$/)
  assert.match(result.regex, /!已腐/)
  assert.equal(result.includeCount, 3)
  assert.equal(result.excludeCount, 2)
})

test('全部地图紧凑表达式命中自身全部变体且不误命中其他目录项', () => {
  for (const [id, expression] of Object.entries(MAP_COMPACT_EXPRESSIONS)) {
    assert.equal(hasMinimumHanFragment(expression), true, `${id} 不得使用单字表达式`)
    for (const candidate of MAP_REGEX_CORPUS) {
      for (const variant of candidate.variants) {
        assert.equal(
          expressionMatches(expression, variant),
          candidate.id === id,
          `${id} 对 ${candidate.id} 的匹配结果错误：${expression}`
        )
      }
    }
  }
})

test('参考词缀使用有几作为最短安全表达式', () => {
  const affix = MAP_REGEX_AFFIXES.find(item => item.value.includes('有几率偷取'))
  assert.equal(affix.compactExpression, '有几')
  const config = createDefaultMapRegexConfig()
  config.includeAffixIds = [affix.id]
  assert.equal(generateMapRegex(config).regex, '"有几"')
})

test('价格闭区间生成器准确覆盖边界并压缩连续数字', () => {
  const pattern = numericRangePattern(10, 25)
  const regex = new RegExp(`^(?:${pattern})$`)
  for (let value = 1; value <= 999; value += 1) {
    assert.equal(regex.test(String(value)), value >= 10 && value <= 25)
  }
  assert.match(pattern, /\[0-5\]/)
  assert.equal(numericRangePattern(0, 10), '')
  assert.equal(numericRangePattern(30, 10), '')
})

test('合法价格筛选生成单币种和多币种 b/o 条件', () => {
  assert.equal(generateMapPriceExpression({ min: 5, max: 5, currencies: ['ch'] }), '~b/o 5 ch')
  assert.match(generateMapPriceExpression({ min: 10, max: 25, currencies: ['div', 'ch'] }), /^~b\/o .+ \(div\|ch\)$/)
  const config = createDefaultMapRegexConfig()
  config.priceRange = { min: 10, max: 25, currencies: ['div', 'ch'] }
  const result = generateMapRegex(config)
  assert.match(result.regex, /~b\/o/)
  assert.equal(result.includeCount, 1)
})

test('不完整、越界、倒置或无币种的价格配置不进入正则', () => {
  const invalid = [
    { min: 1, max: null, currencies: ['ch'] },
    { min: 0, max: 10, currencies: ['ch'] },
    { min: 20, max: 10, currencies: ['ch'] },
    { min: 1, max: 10, currencies: [] }
  ]
  for (const priceRange of invalid) {
    assert.equal(validateMapPriceRange(priceRange).valid, false)
    assert.equal(generateMapPriceExpression(priceRange), '')
  }
})

test('地图词缀目录统一为异界地图且不再分普通与 T17', () => {
  assert.ok(MAP_REGEX_AFFIXES.length > 0)
  assert.ok(MAP_REGEX_AFFIXES.every(item => item.regions.length === 1 && item.regions[0] === 'atlas'))
})
})()

// === Merged from mapTrackerAutomation.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const mkdtemp = _m9_mkdtemp
  const writeFile = _m9_writeFile
  const appendFile = _m9_appendFile
  const rename = _m9_rename
  const rm = _m9_rm
  const path = _m9_path
  const os = _m9_os
  const ClientEventsService = _m9_ClientEventsService
  const ClientEventSettingsRepository = _m9_ClientEventSettingsRepository
  const MapTrackerService = _m9_MapTrackerService
  const MapTrackerRepository = _m9_MapTrackerRepository
  const detectClientProcessSessions = _m9_detectClientProcessSessions
  const parseClientLogLine = _m9_parseClientLogLine
  const normalizeMapTrackerSettings = _m9_normalizeMapTrackerSettings
  const createMapRun = _m9_createMapRun
const log = body => `2026/09/07 12:00:00 [INFO Client 123] ${body}\n`
const area = (seed = 1, id = 'MapWorldsCemetery') => log(`Generating level 83 area "${id}" with seed ${seed}`)
const ready = log(': You have entered Cemetery.')
async function setup(t, initial = area() + ready, ids = [123]) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tracker-auto-'))
  const file = path.join(root, 'Client.txt'); await writeFile(file, initial)
  const settings = new ClientEventSettingsRepository(path.join(root, 'client.json'))
  const client = new ClientEventsService({ settings, detectPath: async () => file, processProvider: async () => ids.map(id => ({ id, startedAt: "2026-09-07T00:00:00Z" })) })
  const repository = new MapTrackerRepository(root)
  let now = Date.parse('2026-09-07T12:00:00Z')
  const service = new MapTrackerService({ repository, clientEvents: client, now: () => now })
  await service.initialize()
  t.after(async () => { await client.stop(false); await service.shutdown({ normal: false }); await rm(root, { recursive: true, force: true }) })
  const flush = async () => { await service.workQueue; await Promise.allSettled([...service.inFlight]); await service.workQueue }
  const append = async text => { await appendFile(file, text); await client.tailer.poll(); await flush() }
  return { service, repository, client, root, file, append, flush, advance: ms => { now += ms } }
}

test('旧字段及经验开关静默移除，保留角色身份', () => {
  const settings = normalizeMapTrackerSettings({ overlay: { interactive: true }, enhancements: { kills: true, character: true }, chat: { inputReady: {} }, selectedCharacter: { name: '旧角色', level: 90 } })
  assert.equal(settings.overlay.interactive, undefined); assert.equal(settings.enhancements.kills, undefined)
  assert.equal(settings.chat, undefined); assert.equal(settings.enhancements.character, undefined)
  assert.equal(settings.selectedCharacter.name, '旧角色'); assert.equal(createMapRun({ kills: 500 }).kills, undefined)
})

test('系统消息边界拒绝聊天伪装和废弃查询结果，中英文死亡可解析', () => {
  for (const body of ['#玩家: You have died', '@玩家: Generating level 83 area "MapWorldsCemetery" with seed 1', ': 玩家: 你已死亡', '已击杀：123 个怪物', '名称:玩家，职业：元素使，等级：98，区：赛季，状态：城镇']) assert.equal(parseClientLogLine(log(body).trim()), null)
  for (const body of ['You have died', ': 你已死亡。', ': Player has been slain.']) assert.equal(parseClientLogLine(log(body).trim()).type, 'player-death')
  assert.equal(parseClientLogLine('Generating level 83 area "MapWorldsCemetery"'), null)
})

test('图内开启自动定位日志，只恢复当前状态，不回放死亡、不补计时间', async t => {
  const { service, client, flush } = await setup(t, area() + ready + log(': You have died'))
  await service.updateSettings({ enabled: true }); await flush()
  assert.equal(client.status.state, 'started')
  const run = service.snapshot().activeRun
  assert.ok(run); assert.equal(run.deaths, 0); assert.equal(run.portalsUsed, 1); assert.equal(run.activeDurationMs, 0)
  assert.ok(run.sessionKey); assert.equal(run.character, null)
})

test('手动恢复共享日志上下文不新增刷图记录、死亡或传送门次数', async t => {
  const { service, client, flush, append } = await setup(t)
  await service.updateSettings({ enabled: true }); await flush()
  await append(log(': You have died'))
  const before = service.snapshot().activeRun
  client.setGameState('disconnected', 'process-exit'); await flush()
  await client.ensureCurrentContext(123); await flush()
  const after = service.snapshot().activeRun
  assert.equal(after.id, before.id)
  assert.equal(after.deaths, before.deaths)
  assert.equal(after.portalsUsed, before.portalsUsed)
})

test('旧 PID 或缺少就绪状态不能冒充正在地图内', async t => {
  const { service, flush } = await setup(t, area() + ready, [456])
  await service.updateSettings({ enabled: true }); await flush()
  assert.equal(service.snapshot().activeRun, null)
  assert.equal(service.snapshot().gameState, 'unknown')
})

test('无输入计时、后台暂停、关闭保存和再开启同局续记', async t => {
  const { service, repository, client, advance, flush } = await setup(t)
  await service.updateSettings({ enabled: true }); await flush(); service.setForeground(true)
  const id = service.snapshot().activeRun.id
  advance(15000); await service.tick(); assert.equal(service.snapshot().activeRun.activeDurationMs, 15000)
  service.setForeground(false); advance(8000); await service.tick(); assert.equal(service.snapshot().activeRun.activeDurationMs, 15000)
  service.setForeground(true); advance(1000); await service.updateSettings({ enabled: false })
  assert.equal(service.snapshot().activeRun, null); assert.equal((await repository.query()).total, 1)
  assert.equal(client.status.enabled, true)
  advance(9000); await service.updateSettings({ enabled: true }); await flush()
  assert.equal(service.snapshot().activeRun.id, id)
  assert.equal(service.snapshot().activeRun.activeDurationMs, 16000)
  assert.equal(service.snapshot().activeRun.portalsUsed, 1)
})

test('真实日志同实例回城重返、附属往返与新 seed 的记录归属', async t => {
  const { service, repository, append, flush } = await setup(t)
  await service.updateSettings({ enabled: true }); await flush(); service.setForeground(true)
  const id = service.snapshot().activeRun.id
  await append(area(3, 'AbyssLeague') + ready + area() + ready)
  assert.equal(service.snapshot().activeRun.id, id); assert.equal(service.snapshot().activeRun.portalsUsed, 1)
  await append(area(2, 'Hideout') + ready)
  assert.equal((await repository.query()).total, 1)
  await append(area() + ready)
  assert.equal(service.snapshot().activeRun.id, id); assert.equal(service.snapshot().activeRun.portalsUsed, 2)
  await append(area(9) + ready)
  assert.notEqual(service.snapshot().activeRun.id, id)
  assert.equal((await repository.query()).total, 1)
})

test('半字符半行只发布一次，重复来源事件不重复死亡', async t => {
  const { service, client, append, flush } = await setup(t)
  await service.updateSettings({ enabled: true }); await flush()
  const bytes = Buffer.from(log(': 你已死亡'))
  const split = bytes.indexOf(Buffer.from('死')) + 1
  await append(bytes.subarray(0, split)); assert.equal(service.snapshot().activeRun.deaths, 0)
  await append(bytes.subarray(split)); assert.equal(service.snapshot().activeRun.deaths, 1)
  const event = client.events.findLast(event => event.type === 'player-death')
  await service.handleEvent(event); assert.equal(service.snapshot().activeRun.deaths, 1)
  assert.equal(JSON.stringify(event).includes('Client.txt'), false)
})

test('日志替换恢复状态而不重放旧死亡和传送门', async t => {
  const { service, client, root, file, append, flush } = await setup(t)
  await service.updateSettings({ enabled: true }); await flush()
  await append(log(': You have died'))
  const id = service.snapshot().activeRun.id
  await rename(file, path.join(root, 'Client.old.txt'))
  await writeFile(file, area() + ready + log(': You have died'))
  await client.tailer.poll(); await flush()
  assert.equal(service.snapshot().activeRun.id, id)
  assert.equal(service.snapshot().activeRun.deaths, 1)
  assert.equal(service.snapshot().activeRun.portalsUsed, 1)
})

test('加载暂停、断线自动结算且不会由普通连接消息恢复', async t => {
  const { service, repository, append, advance, flush } = await setup(t)
  await service.updateSettings({ enabled: true }); await flush(); service.setForeground(true)
  advance(1000); await append(log('Connecting to instance server at 127.0.0.1:1234'))
  advance(10000); await service.tick(); assert.equal(service.snapshot().activeRun.activeDurationMs, 1000)
  await append(log('Abnormal disconnect: disconnected'))
  assert.equal(service.snapshot().activeRun, null); assert.equal((await repository.query()).total, 1)
  await append(log('Connecting to server at 127.0.0.1:1234'))
  assert.equal(service.snapshot().gameState, 'disconnected')
})

test('共享日志准备幂等且无效路径自动回退检测', async t => {
  const { client } = await setup(t)
  await client.settings.save({ enabled: false, logPath: path.join(os.tmpdir(), 'missing-tracker-test-directory', 'Client.txt') })
  await client.ensureStarted(); const tailer = client.tailer
  await client.ensureStarted(); assert.equal(client.tailer, tailer)
})

test('进程会话检测隐藏启动窗口，创建时间未知仍保留 PID', async () => {
  const result = await detectClientProcessSessions({ platform: 'win32', execFileImpl: (_exe, _args, options, callback) => {
    assert.equal(options.windowsHide, true)
    callback(null, JSON.stringify([{ id: 123, startedAt: '2026-09-07T00:00:00Z' }, { id: 456, startedAt: 'invalid' }]))
  } })
  assert.deepEqual(result, [{ id: 123, startedAt: '2026-09-07T00:00:00Z' }, { id: 456, startedAt: null }])
})

test('同 PID 的新进程不能恢复创建之前的旧日志', async () => {
  const client = new ClientEventsService({ processProvider: async () => [{ id: 123, startedAt: '2026-09-08T00:00:00Z' }] })
  await client.recover([{ line: area().trim(), sourceId: 'source', fileId: 'file', offset: 0 }, { line: ready.trim(), sourceId: 'source', fileId: 'file', offset: 100 }])
  assert.equal(client.currentContext(), null)
})
})()

// === Merged from mapTrackerDashboard.test.js ===
await (async () => {
  const test = _m10_test
  const assert = _m10_assert
  const buildDashboardSummary = _m10_buildDashboardSummary
  const mergeDashboardRuns = _m10_mergeDashboardRuns
const HOUR = 3600000
const now = new Date(2026, 8, 7, 12).getTime()
const iso = value => new Date(value).toISOString()
const character = { accountName: 'a', league: 's', name: '角色' }
const run = (id, patch = {}) => ({ id, areaId: 'cemetery', areaName: '墓地', mapTier: 16, instanceKey: `cemetery:${id}`, character, startedAt: iso(now - HOUR), endedAt: iso(now - 1000), activeDurationMs: 60000, loot: [], ...patch })

test('入库按数量累加并按名称和基底分组，草稿保存不重复计数', () => {
  const loot = [{ name: '混沌石', quantity: 20, recordedAt: iso(now - 1000) }, { name: '混沌石', quantity: 10, recordedAt: iso(now) }, { name: '装备', baseType: '甲', quantity: 1, recordedAt: iso(now) }, { name: '装备', baseType: '乙', recordedAt: iso(now) }]
  const activeRun = run('a', { endedAt: null, loot })
  const active = buildDashboardSummary({ activeRun, stashEvents: loot, now })
  assert.equal(active.todayLoot, 32)
  assert.equal(active.todayCount, 0)
  assert.equal(active.windows[1].items[0].quantity, 30)
  assert.equal(active.windows[1].items.length, 3)
  const saved = buildDashboardSummary({ runs: [run('a', { loot })], activeRun, stashEvents: loot, now })
  assert.equal(saved.todayLoot, 32)
  assert.equal(saved.todayCount, 1)
  assert.equal(saved.windows[1].buckets.reduce((sum, entry) => sum + entry.loot, 0), 32)
})

test('时间窗口跨日，完成按结束时间归属，今日数字不受窗口影响', () => {
  const midnight = new Date(2026, 8, 7, 0, 30).getTime()
  const runs = [run('a', { startedAt: iso(midnight - 2 * HOUR), endedAt: iso(midnight - 1000) }), run('b', { endedAt: iso(midnight - HOUR) }), run('c', { endedAt: iso(midnight - 7 * HOUR) }), run('d', { endedAt: iso(midnight - 25 * HOUR) })]
  const summary = buildDashboardSummary({ runs, now: midnight })
  assert.equal(summary.todayCount, 1)
  assert.equal(summary.windows[1].count, 2)
  assert.equal(summary.windows[6].count, 2)
  assert.equal(summary.windows[24].count, 3)
  assert.deepEqual([24, 6, 1].map(hours => summary.windows[hours].buckets.length), [24, 24, 12])
  assert.equal(summary.windows[1].buckets[0].count, 1)
})

test('同实例合并有效用时，不合并未知实例、不同角色或不同阶级', () => {
  const runs = [run('a'), run('b', { instanceKey: 'cemetery:a', activeDurationMs: 120000 }), run('c'), run('d', { instanceKey: 'cemetery:unknown' }), run('e', { instanceKey: 'cemetery:unknown' }), run('f', { instanceKey: 'cemetery:a', character: { ...character, name: '另一角色' } }), run('g', { instanceKey: 'cemetery:a', mapTier: 17 })]
  assert.equal(mergeDashboardRuns(runs).length, 6)
  const summary = buildDashboardSummary({ runs, now })
  assert.equal(summary.todayCount, 6)
  assert.equal(summary.windows[1].durations[0].count, 5)
  assert.equal(summary.windows[1].durations[0].totalDurationMs, 420000)
  assert.equal(summary.windows[1].durations[0].averageDurationMs, 84000)
})

test('旧地图入库不计数，独立事件不受地图删除影响', () => {
  const events = [{ id: 'a:1', name: '石', quantity: 2, recordedAt: iso(now) }]
  const old = run('a', { loot: [{ name: '石', quantity: 99 }] })
  assert.equal(buildDashboardSummary({ runs: [old], now }).todayLoot, 0)
  assert.equal(buildDashboardSummary({ runs: [old], stashEvents: events, now }).todayLoot, 2)
  assert.equal(buildDashboardSummary({ stashEvents: events, now }).todayLoot, 2)
})
})()

// === Merged from mapTrackerDashboardComponent.test.js ===
await (async () => {
  const test = _m11_test
  const assert = _m11_assert
  const readFileSync = _m11_readFileSync
  const parse = _m11_parse
  const compileScript = _m11_compileScript
  const Vue = _m11_Vue
  const mapLabel = _m11_mapLabel
  const buildDashboardSummary = _m11_buildDashboardSummary
function mountDashboard(store) {
  const source = readFileSync(new URL('../src/domains/mapTracker/MapTrackerDashboard.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const compiled = compileScript(descriptor, { id: 'dashboard-test', inlineTemplate: true, genDefaultAs: 'component' }).content
    .replace(/import \{([^}]+)\} from ["']vue["'];?/g, (_, names) => `const {${names.replace(/\s+as\s+/g, ':')}} = Vue;`)
    .replace(/^import .*$/gm, '')
  const component = new Function('Vue', 'useMapTrackerStore', 'electronApi', 'ElMessage', 'mapLabel', `${compiled}; return component`)(Vue, () => store, { mapTracker: { characterBridgeStatus: () => 'ready' } }, { error() {} }, mapLabel)
  const node = (type, text = '') => ({ type, text, props: {}, children: [], parent: null })
  const renderer = Vue.createRenderer({
    createElement: type => node(type), createText: text => node('text', text), createComment: text => node('comment', text),
    setText: (target, text) => { target.text = text }, setElementText: (target, text) => { target.text = text; target.children = [] },
    patchProp: (target, key, previous, value) => { target.props[key] = value },
    insert(target, parent, anchor) {
      if (target.parent) target.parent.children.splice(target.parent.children.indexOf(target), 1)
      target.parent = parent
      const index = anchor ? parent.children.indexOf(anchor) : -1
      parent.children.splice(index < 0 ? parent.children.length : index, 0, target)
    },
    remove(target) { if (target.parent) target.parent.children.splice(target.parent.children.indexOf(target), 1) },
    parentNode: target => target.parent, nextSibling: target => target.parent?.children[target.parent.children.indexOf(target) + 1]
  })
  const root = node('root'); const app = renderer.createApp(component)
  for (const name of ['el-alert', 'el-switch', 'el-button', 'el-table', 'el-table-column']) {
    app.component(name, { setup: (_, { attrs, slots }) => () => Vue.h('div', attrs, name === 'el-table-column' ? [] : slots.default?.()) })
  }
  app.mount(root)
  const flatten = target => [target, ...target.children.flatMap(flatten)]
  const text = target => target.text + target.children.map(text).join('')
  return { app, root, text, find: predicate => flatten(root).find(predicate), buttons: () => flatten(root).filter(target => target.type === 'button') }
}

test('实际 Vue 组件三指标和三时段切换，今日数字固定且跨指标保留时间选择', async (t) => {
  const now = new Date(2026, 8, 7, 12).getTime()
  const iso = value => new Date(value).toISOString()
  const runs = [1, 2].map(id => ({ id: String(id), areaName: '墓地', mapTier: 16, startedAt: iso(now - id * 3600000), endedAt: iso(now - id * 1800000), activeDurationMs: 60000 * id, loot: [{ name: '混沌石', quantity: id * 10, recordedAt: iso(now - id * 1800000) }] }))
  const store = Vue.reactive({ snapshot: { settings: {}, summary: { ...buildDashboardSummary({ runs, stashEvents: runs.flatMap(run => run.loot), now }) } }, enabled: true, activeRun: null })
  const view = mountDashboard(store); t.after(() => view.app.unmount())
  const button = label => view.buttons().find(target => view.text(target).startsWith(label))
  const click = async label => { button(label).props.onClick(); await Vue.nextTick() }
  const currentPanel = () => view.find(target => target.props.id === 'mapping-metric-content')
  assert.equal(button('今日经验'), undefined)
  assert.equal(button('今日完成').props['aria-pressed'], true)
  assert.equal(button('24 小时').props['aria-pressed'], true)
  const initialNumbers = ['今日完成', '今日入库', '平均用时'].map(label => view.text(button(label)))
  for (const hours of [6, 1, 24]) {
    await click(`${hours} 小时`)
    for (const [label, title] of [['今日入库', '入库物品记录'], ['平均用时', '各地图平均用时'], ['今日完成', '完成地图趋势']]) {
      await click(label)
      assert.equal(currentPanel().props['aria-label'], title)
      assert.equal(button(`${hours} 小时`).props['aria-pressed'], true)
      assert.deepEqual(['今日完成', '今日入库', '平均用时'].map(name => view.text(button(name))), initialNumbers)
    }
  }
  await click('今日入库')
  assert.equal(view.find(target => target.props['aria-label'] === '入库物品明细').props.data[0].quantity, 30)
  store.snapshot.summary = { ...buildDashboardSummary({ now }) }
  await Vue.nextTick()
  assert.match(view.text(currentPanel()), /所选时段暂无入库记录/)
})

test('关闭追踪收起统计并保留设置和历史入口，重开恢复统计', async t => {
  const store = Vue.reactive({ snapshot: { settings: {}, summary: {} }, enabled: true, busy: false, activeRun: null })
  const view = mountDashboard(store); t.after(() => view.app.unmount())
  assert.ok(view.find(target => target.props.id === 'mapping-metric-content'))
  store.enabled = false; await Vue.nextTick()
  assert.equal(view.find(target => target.props.id === 'mapping-metric-content'), undefined)
  assert.match(view.text(view.root), /刷图设置/); assert.match(view.text(view.root), /历史战绩/)
  store.enabled = true; await Vue.nextTick()
  assert.ok(view.find(target => target.props.id === 'mapping-metric-content'))
})
})()

// === Merged from mapTrackerLabels.test.js ===
await (async () => {
  const test = _m12_test
  const assert = _m12_assert
  const readFileSync = _m12_readFileSync
  const mapLabel = _m12_mapLabel
  const parseClientLogLine = _m12_parseClientLogLine
test('最近事件与刷图界面共用区域名称转换', () => {
  assert.equal(mapLabel('MapWorldsCemetery'), '晨曦墓地')
  assert.equal(mapLabel('Cemetery'), '晨曦墓地')
  assert.equal(mapLabel('MapWorldsMuseum'), '古博物馆')
  assert.equal(mapLabel('墓地'), '墓地')
  assert.equal(mapLabel(''), '')
  const settings = readFileSync(new URL('../src/domains/settings/SettingsView.vue', import.meta.url), 'utf8')
  assert.ok(settings.includes('进入 ${mapLabel(event.areaId)}'))
})

test('剧情城镇卡鲁海滩显示中文且不推算地图阶级', () => {
  assert.equal(mapLabel('2_11_endgame_town'), '卡鲁海滩')
  assert.equal(mapLabel('2 11 endgame town'), '卡鲁海滩')
  const event = parseClientLogLine('2026/09/07 10:00:00 [INFO Client 1] Generating level 69 area "2_11_endgame_town" with seed 123')
  assert.equal(event.areaLevel, 69)
  assert.equal(event.mapTier, null)
})

test('扩展地图名称目录并保留异界地图阶级', () => {
  assert.equal(mapLabel('MapWorldsBeach'), '危岩海滩')
  assert.equal(mapLabel('MapWorldsCrimsonTemple'), '玫红神殿')
  assert.equal(parseClientLogLine('2026/09/07 10:00:00 [INFO Client 1] Generating level 69 area "MapWorldsBeach"').mapTier, 2)
})

test('功能区域和藏身处保留具体名称且不作为异界地图', () => {
  for (const name of ['KalguuranSettlersLeague', 'Kalguuran Settlers League']) {
    assert.equal(mapLabel(name), '君锋镇')
  }
  assert.equal(mapLabel('1_5_town'), '狱卒之塔')
  assert.equal(mapLabel('监守高塔'), '狱卒之塔')
  assert.equal(mapLabel('HeistHub'), '黄金港')
  assert.equal(mapLabel('HideoutLush'), '苍翠藏身处')
  assert.equal(mapLabel('Coastal Hideout'), '海岸藏身处')
  for (const id of ['KalguuranSettlersLeague', 'HeistHub', 'HideoutLush']) {
    assert.equal(parseClientLogLine(`2026/09/07 10:00:00 [INFO Client 1] Generating level 68 area "${id}"`).mapTier, null)
  }
})
})()

// === Merged from mapTrackerNames.test.js ===
await (async () => {
  const test = _m13_test
  const assert = _m13_assert
  const mkdtemp = _m13_mkdtemp
  const mkdir = _m13_mkdir
  const writeFile = _m13_writeFile
  const readFile = _m13_readFile
  const rm = _m13_rm
  const os = _m13_os
  const path = _m13_path
  const classifyArea = _m13_classifyArea
  const normalizeMapName = _m13_normalizeMapName
  const MapTrackerRepository = _m13_MapTrackerRepository
  const buildDashboardSummary = _m13_buildDashboardSummary
  const mapLabel = _m13_mapLabel
test('编年史目录与旧名称转换避免地图混淆且重复转换稳定', () => {
  for (const [id, old, expected] of [
    ['Strand', '滨海山丘', '致命岩滩'], ['Atoll', '环礁', '滨海山丘'],
    ['Reef', '珊瑚遗迹', '危机海礁'], ['Museum', '博物馆', '古博物馆'],
    ['Desert', '荒漠', '贫瘠之地']
  ]) {
    assert.equal(classifyArea(`MapWorlds${id}`).areaName, expected)
    assert.equal(normalizeMapName(`MapWorlds${id}`, old), expected)
    assert.equal(normalizeMapName(`MapWorlds${id}`, expected), expected)
    assert.equal(mapLabel(expected), expected)
  }
  assert.equal(mapLabel('滨海山丘'), '滨海山丘')
  assert.equal(classifyArea('MapWorldsCrimsonTemple').areaName, '玫红神殿')
  assert.equal(normalizeMapName('MapWorldsUnknown', '未知自定义名称'), '未知自定义名称')
})

test('磁盘历史及活动记录在筛选统计导出前更新名称且不改写源文件', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'map-name-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const repository = new MapTrackerRepository(root)
  const records = ['Strand', 'Atoll'].map((id, index) => ({
    id: String(index), areaId: `MapWorlds${id}`, areaName: '滨海山丘',
    startedAt: '2026-09-08T01:00:00.000Z', endedAt: '2026-09-08T01:10:00.000Z', activeDurationMs: 600000
  }))
  const shard = repository.shardPath(records[0])
  await mkdir(path.dirname(shard), { recursive: true })
  const original = JSON.stringify({ schemaVersion: 1, runs: records })
  await writeFile(shard, original)
  await writeFile(repository.activePath, JSON.stringify({ run: records[0] }))
  assert.equal((await repository.getActiveRun()).areaName, '致命岩滩')
  assert.equal((await repository.query({ map: '致命岩滩' })).total, 1)
  assert.equal((await repository.query({ map: '滨海山丘' })).total, 1)
  const { runs } = await repository.all()
  const summary = buildDashboardSummary({ runs, now: Date.parse('2026-09-08T04:00:00.000Z') })
  assert.match(JSON.stringify(summary), /致命岩滩/)
  assert.match(JSON.stringify(summary), /滨海山丘/)
  const output = path.join(root, 'export.csv')
  await repository.exportCsv({}, output)
  assert.match(await readFile(output, 'utf8'), /致命岩滩/)
  assert.equal(await readFile(shard, 'utf8'), original)
})
})()
