import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { buildCraftingAffixPayload } from '../electron/modules/item/craftingAffixPayload.js'
import { matchAffixes } from '../electron/modules/item/matcher.js'
import { userLifeFlask, equivalentEnglishLifeFlask, equivalentTraditionalLifeFlask } from './fixtures/priceCheckFlask.js'

const read = file => readFileSync(new URL(`./fixtures/${file}`, import.meta.url), 'utf8')
// Signed current game rows plus the reported clipboard text, captured without running automation.
const entries = [...JSON.parse(read('price-check-flask-entries.json')), ...JSON.parse(read('crafting-diamond-flask-entries.json'))]
const runtime = () => new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'fixture' })

test('截图中的丰富的宝钻药剂不因词缀名称歧义停机，效果、阶级及中文显示保留', () => {
  const item = runtime().parseItem(read('crafting-diamond-flask.txt'), 'fixture')
  assert.equal(item.baseName, 'Diamond Flask')
  assert.equal(item.displayName, '丰富的僵固之宝钻药剂')
  assert.equal(item.displayBaseName, '宝钻药剂')
  assert.equal(item.modifiers[0].name, '丰富的')
  assert.equal(item.modifiers[0].text, '+23 to Maximum Charges')
  assert.equal(item.modifiers[0].displayText, '最大充能 +23(20-23)')
  assert.equal(item.modifiers[1].displayText, '生效期间，格挡及晕眩回复提高 54(51-56)%')
  assert.equal(item.modifiers[0].tier, 4)
  assert.equal(matchAffixes(item, [{ requiredAffixes: [{ kind: 'catalog', effectPattern: '+# to Maximum Charges', minTier: 4 }], selectedAffixes: [] }]).isMatch, true)
  assert.equal(matchAffixes(item, [{ requiredAffixes: ['of the Bounty'], selectedAffixes: [] }]).isMatch, false)
  const payload = buildCraftingAffixPayload(item)
  assert.equal(payload.displayName, item.displayName)
  assert.equal(payload.displayBaseName, item.displayBaseName)
  assert.deepEqual(payload.displayExplicitMods, ['最大充能 +23(20-23)', '生效期间，格挡及晕眩回复提高 54(51-56)%'])
})

test('英简繁药剂显示复制原文与完整范围，规范英文效果和多行阶级匹配一致', () => {
  for (const [source, name, base, effect] of [
    [userLifeFlask, '丰富的封闭之不朽生命药剂', '不朽生命药剂', '最大充能 +22(20-23)'],
    [equivalentTraditionalLifeFlask, '豐產的密封之不朽生命藥劑', '不朽生命藥劑', '+22(20-23) 最大充能'],
    [equivalentEnglishLifeFlask, 'Plentiful Divine Life Flask of Sealing', 'Divine Life Flask', '+22(20-23) to Maximum Charges']
  ]) {
    const item = runtime().parseItem(source, 'fixture')
    assert.equal(item.baseName, 'Divine Life Flask')
    assert.equal(item.displayName, name)
    assert.equal(item.displayBaseName, base)
    assert.equal(item.modifiers[0].displayText, effect)
    assert.equal(item.modifiers[1].displayText.split('\n').length, 2)
    assert.equal(item.modifiers[1].text.includes('(6-8)'), false)
    assert.equal(item.modifiers[1].displayText.includes('7(6-8)'), true)
    assert.equal(matchAffixes(item, [{ requiredAffixes: [{ kind: 'catalog', effectPattern: '+# to Maximum Charges' }], selectedAffixes: [] }]).isMatch, true)
  }
})

test('名称容错不放行未知效果、歧义效果和过期词库', () => {
  const text = read('crafting-diamond-flask.txt')
  assert.throws(() => runtime().parseItem(text.replace('最大充能', '未知充能'), 'fixture'), /未匹配/)
  assert.throws(() => runtime().parseItem(text, 'old-fixture'), /汉化资源已更改/)
  const ambiguous = new LocalizationRuntime({ serverId: 'international', revision: () => 'fixture', entries: () => [...entries,
    { kind: 'stat', table: 'fixture', id: 'ambiguous', field: 'variant:0', en: '{0:+d} to Other Charges', cn: '最大充能 {0:+d}' }]
  })
  assert.throws(() => ambiguous.parseItem(text, 'fixture'), error => error.code === 'LOCALIZATION_AMBIGUOUS')
})

test('真实九头蛇之宝钻药剂不把已知后缀内部的尸体名称当作底材', () => {
  const actualEntries = [...entries, ...JSON.parse(read('crafting-hydra-flask-entries.json'))]
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => actualEntries, revision: () => 'fixture' })
  const item = runtime.parseItem(read('crafting-hydra-flask.txt'), 'fixture')
  assert.equal(item.baseName, 'Diamond Flask')
  assert.equal(item.displayName, '九头蛇之宝钻药剂')
  assert.equal(item.displayBaseName, '宝钻药剂')
  assert.equal(item.modifiers[0].tier, 1)
  assert.equal(item.modifiers[0].lines.length, 3)
  assert.match(item.modifiers[0].displayText, /持续时间总降 38\(39-35\)%/)
  assert.match(item.modifiers[0].displayText, /药剂持续期间免疫点燃/)
})
