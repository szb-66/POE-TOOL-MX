import test from 'node:test'
import assert from 'node:assert/strict'
import { VENDOR_GROUPS } from '../src/domains/regex/vendorData.js'
import { localizeVendorGroups } from '../src/domains/regex/vendorLanguage.js'
import { buildVendorTokens, generateVendorRegex } from '../src/domains/regex/vendorRegex.js'
import { createDefaultVendorConfig } from '../src/domains/regex/vendorConfig.js'

test('英文商店条件完整覆盖现有 ID，保留中文界面标签且不改变原始国服目录', () => {
  const groups = localizeVendorGroups(VENDOR_GROUPS, 'en')
  assert.deepEqual(groups.flatMap(group => group.options.map(item => item.id)), VENDOR_GROUPS.flatMap(group => group.options.map(item => item.id)))
  assert.equal(groups[0].options[0].label, '稀有')
  assert.equal(groups[0].options[0].expression, 'Rarity: Rare')
  assert.equal(VENDOR_GROUPS[0].options[0].expression, '稀有度: 稀有')
  for (const option of groups.flatMap(group => group.options)) {
    assert.doesNotThrow(() => new RegExp(option.compactExpression, 'im'))
    assert.equal(/\p{Script=Han}/u.test(option.compactExpression), false)
  }
  assert.throws(() => localizeVendorGroups([{ options: [{ id: 'missing' }] }], 'en'), /缺少英文/)
})

test('英文 +1 与移动速度不会误匹配 +11 或 130%，组合条件保留包括排除语义', () => {
  const options = new Map(localizeVendorGroups(VENDOR_GROUPS, 'en').flatMap(group => group.options).map(item => [item.id, item]))
  const plus = new RegExp(options.get('plus_fire').expression, 'im')
  assert.equal(plus.test('+1 to Level of all Fire Spell Skill Gems'), true)
  assert.equal(plus.test('+11 to Level of all Fire Spell Skill Gems'), false)
  const movement = new RegExp(options.get('movement_30').expression, 'im')
  assert.equal(movement.test('30% increased Movement Speed'), true)
  assert.equal(movement.test('130% increased Movement Speed'), false)
  const config = createDefaultVendorConfig()
  config.rarity.selectedIds = ['rare']
  config.movement.selectedIds = ['movement_30']
  config.movement.mode = 'exclude'
  const result = buildVendorTokens(config, 'en')
  assert.equal(result.includeCount, 1)
  assert.equal(result.excludeCount, 1)
  assert.ok(result.tokens.some(token => token.startsWith('"!')))
  assert.equal(/\p{Script=Han}/u.test(generateVendorRegex(config, 'en').regex), false)
})
