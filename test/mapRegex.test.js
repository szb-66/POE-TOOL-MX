import test from 'node:test'
import assert from 'node:assert/strict'
import { expressionMatches, hasMinimumHanFragment } from '../src/domains/regex/compactExpression.js'
import {
  createDefaultMapRegexConfig, generateMapPriceExpression, generateMapRegex, MAP_COMPACT_EXPRESSIONS,
  MAP_REGEX_AFFIXES, MAP_REGEX_CORPUS, numericAtLeastPattern, numericRangePattern, validateMapPriceRange
} from '../src/domains/regex/mapRegex.js'

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
  config.stats.quantity = { enabled: true, value: 80 }
  config.rarity = { mode: 'include', selectedIds: ['rare'] }
  config.corrupted = { enabled: true, mode: 'exclude' }
  config.includeAffixIds = [MAP_REGEX_AFFIXES[0].id]
  config.excludeAffixIds = [MAP_REGEX_AFFIXES[1].id]
  const result = generateMapRegex(config)
  assert.match(result.regex, /品数/)
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

test('地图词缀目录提供普通与 T17 离线分类', () => {
  assert.ok(MAP_REGEX_AFFIXES.some(item => item.regions.includes('normal')))
  assert.ok(MAP_REGEX_AFFIXES.some(item => item.regions.includes('t17')))
})
