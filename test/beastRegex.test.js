import test from 'node:test'
import assert from 'node:assert/strict'
import { BEAST_REGEX_OPTIONS, cleanBeastRegexConfig, createDefaultBeastRegexConfig, generateBeastRegex } from '../src/domains/regex/beastRegex.js'

test('野兽空配置与价格独立生成', () => {
  assert.equal(generateBeastRegex(createDefaultBeastRegexConfig()).regex, '')
  assert.equal(generateBeastRegex({ priceRange: { min: 10, max: 19, currencies: ['ch'] } }).regex, '"~b/o 1\\d ch"')
  for (const priceRange of [{ min: 20, max: 10, currencies: ['ch'] }, { min: 1, max: null, currencies: ['ch'] }, { min: 1, max: 10, currencies: [] }]) {
    assert.equal(generateBeastRegex({ priceRange }).regex, '')
  }
})

test('每个野兽短表达式只命中全目录中的自身', () => {
  for (const item of BEAST_REGEX_OPTIONS) {
    const regex = new RegExp(item.expression)
    assert.ok(regex.test(item.name), item.name)
    for (const other of BEAST_REGEX_OPTIONS) {
      if (item.id !== other.id) assert.equal(regex.test(other.name), false, `${item.name}: ${other.name}`)
    }
  }
})

test('野兽包括排除互斥、去重，名称和价格使用独立条件', () => {
  const [a, b, c] = BEAST_REGEX_OPTIONS
  const config = cleanBeastRegexConfig({ includeIds: [a.id, a.id, b.id, c.id, 'unknown'], excludeIds: [c.id], priceRange: { min: 1, max: 9, currencies: ['ch', 'div'] } })
  assert.deepEqual(config.includeIds, [a.id, b.id])
  const result = generateBeastRegex(config)
  assert.equal(result.includeCount, 3)
  assert.equal(result.excludeCount, 1)
  assert.ok(result.regex.includes(`"${a.expression}|${b.expression}"`))
  assert.ok(result.regex.includes(`"!${c.expression}"`))
  assert.ok(result.regex.includes('(ch|div)'))
})

test('大量名称超长时保留完整正则并提示', () => {
  const result = generateBeastRegex({ includeIds: BEAST_REGEX_OPTIONS.map(item => item.id) })
  assert.ok(result.overLimit)
  assert.equal(result.length, result.regex.length)
  assert.equal(result.includeCount, BEAST_REGEX_OPTIONS.length)
  assert.ok(result.warnings.length)
})
