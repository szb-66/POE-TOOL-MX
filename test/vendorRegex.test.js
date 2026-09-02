import test from 'node:test'
import assert from 'node:assert/strict'
import { buildVendorTokens, generateVendorRegex, REGEX_LENGTH_LIMIT } from '../src/domains/regex/vendorRegex.js'
import { cleanVendorConfig, createDefaultVendorConfig, migrateLegacyVendorConfig } from '../src/domains/regex/vendorConfig.js'
import { VENDOR_GROUPS, VENDOR_REGEX_CORPUS } from '../src/domains/regex/vendorData.js'
import { expressionMatches, hasMinimumHanFragment } from '../src/domains/regex/compactExpression.js'

test('商城正则空配置返回统一结果结构', () => {
  assert.deepEqual(generateVendorRegex(createDefaultVendorConfig()), {
    regex: '', length: 0, overLimit: false, warnings: [], includeCount: 0, excludeCount: 0
  })
})

test('商城分类分别生成包括与排除片段并去除未知项', () => {
  const config = cleanVendorConfig({
    rarity: { mode: 'include', selectedIds: ['rare', 'unknown'] },
    resistance: { mode: 'exclude', selectedIds: ['res_fire'] },
    movement: { mode: 'include', selectedIds: ['movement_15'] }
  })
  const built = buildVendorTokens(config)
  assert.equal(built.includeCount, 2)
  assert.equal(built.excludeCount, 1)
  assert.ok(built.tokens.some(token => token.includes('稀有$')))
  assert.ok(built.tokens.some(token => token.includes('!焰抗')))
  assert.ok(built.tokens.some(token => token.includes('移动.*15%')))
})

test('全部商城紧凑表达式命中目标语料且不误命中其他选项', () => {
  for (const option of VENDOR_GROUPS.flatMap(group => group.options)) {
    const positiveIds = new Set([option.id, ...option.matchIds])
    assert.equal(hasMinimumHanFragment(option.compactExpression), true, `${option.id} 不得使用单字表达式`)
    for (const candidate of VENDOR_REGEX_CORPUS) {
      for (const variant of candidate.variants) {
        assert.equal(
          expressionMatches(option.compactExpression, variant),
          positiveIds.has(candidate.id),
          `${option.id} 对 ${candidate.id} 的匹配结果错误：${option.compactExpression}`
        )
      }
    }
  }
})

test('商城正则统一使用 250 字符阈值且超长不截断', () => {
  const config = createDefaultVendorConfig()
  config.damage.selectedIds = ['physical_damage', 'spell_damage', 'elemental_damage', 'cold_damage', 'fire_damage', 'lightning_damage', 'chaos_damage', 'fire_dot', 'cold_dot', 'chaos_dot']
  const result = generateVendorRegex(config)
  assert.equal(REGEX_LENGTH_LIMIT, 250)
  assert.equal(result.length, result.regex.length)
  assert.equal(result.overLimit, result.length > 250)
})

test('旧商城配置只迁移非孔色字段', () => {
  const migrated = migrateLegacyVendorConfig({
    threeLinks: ['rgb'], anyLinks: ['any_six'], exactColors: { enabled: true, red: 1 },
    movement: ['movement_15'], plusGems: ['plus_fire'], damage: ['physical_damage'], weaponTypes: ['wand']
  })
  assert.deepEqual(migrated.movement.selectedIds, ['movement_15'])
  assert.deepEqual(migrated.common.selectedIds, ['plus_fire'])
  assert.deepEqual(migrated.damage.selectedIds, ['physical_damage'])
  assert.deepEqual(migrated.oneHanded.selectedIds, ['wand'])
  assert.equal('threeLinks' in migrated, false)
  assert.equal('exactColors' in migrated, false)
})
