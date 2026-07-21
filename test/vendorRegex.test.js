import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildVendorExpressions,
  exceedsVendorRegexLimit,
  finalizeVendorRegex,
  generateVendorRegex,
  optimizeVendorExpressions,
  VENDOR_REGEX_LIMIT
} from '../src/domains/shop/vendorRegex.js'
import { createDefaultVendorConfig } from '../src/domains/shop/vendorConfig.js'

test('Vendor 空配置返回稳定的空结果', () => {
  assert.deepEqual(generateVendorRegex(createDefaultVendorConfig()), {
    regex: '', length: 0, overLimit: false, warnings: []
  })
})

test('Vendor 各筛选分类都生成表达式并忽略未知选项', () => {
  const expressions = buildVendorExpressions({
    threeLinks: ['rgb', 'unknown'],
    twoLinks: ['rb'],
    anyLinks: ['any_four'],
    exactColors: { enabled: true, red: 1, green: 1, blue: 1 },
    movement: ['movement_10'],
    plusGems: ['plus_fire'],
    damage: ['physical_damage'],
    weaponTypes: ['wand']
  })
  assert.equal(expressions.length, 8)
  assert.ok(expressions.some(value => value.includes('r-g-b')))
  assert.ok(expressions.some(value => value.includes('移动速度')))
  assert.ok(expressions.some(value => value.includes('技能石等级')))
  assert.ok(expressions.some(value => value.includes('物品类别')))
})

test('任意三连覆盖具体三连，最终表达式去空去重并按需加引号', () => {
  const expressions = buildVendorExpressions({ anyLinks: ['any_three'], threeLinks: ['rgb'] })
  assert.deepEqual(optimizeVendorExpressions(expressions), ['-[rgbw]-'])
  assert.equal(finalizeVendorRegex(['r-r', '', 'r-r']), 'r-r')
  assert.equal(finalizeVendorRegex(['移动 速度', '"测试"']), '"移动 速度|测试"')
})

test('字符数边界以 50 为限，超长仅警告不清空结果', () => {
  assert.equal(exceedsVendorRegexLimit('x'.repeat(VENDOR_REGEX_LIMIT)), false)
  assert.equal(exceedsVendorRegexLimit('x'.repeat(VENDOR_REGEX_LIMIT + 1)), true)

  const result = generateVendorRegex({ threeLinks: ['rgb'], weaponTypes: ['wand'] })
  assert.equal(result.length, result.regex.length)
  assert.equal(result.overLimit, result.length > VENDOR_REGEX_LIMIT)
  if (result.overLimit) assert.ok(result.warnings.some(value => value.includes('50')))
})

test('重复选择被配置清理，冲突组合给出提示', () => {
  const result = generateVendorRegex({ plusGems: ['plus_any', 'plus_any'], weaponTypes: ['wand'] })
  assert.equal(result.regex.split('所有法术.*技能石等级').length - 1, 1)
  assert.ok(result.warnings.some(value => value.includes('全部法杖')))
})
