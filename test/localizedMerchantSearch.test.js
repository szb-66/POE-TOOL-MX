import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createLocalizationDictionary } from '../electron/modules/localization/text.js'
import { localizedSearchExpression } from '../electron/modules/localization/searchExpression.js'
import { loadLocalizedCatalog } from '../src/utils/localizedCatalog.js'
import { createDefaultVendorConfig } from '../src/domains/regex/vendorConfig.js'
import { generateVendorRegex } from '../src/domains/regex/vendorRegex.js'

const fixture = JSON.parse(readFileSync(new URL('./fixtures/localized-merchant-stats.json', import.meta.url)))
const dictionary = createLocalizationDictionary(fixture.entries)
const query = { max_life: 'maximum Life', res_fire: 'Fire Resistance', movement_30: '30% increased Movement Speed' }
const compile = result => new RegExp(result.regex.slice(1, -1), 'imu')
async function catalog(data = dictionary) {
  return (await loadLocalizedCatalog(Object.values(query), { match: 'contains', api: { catalog: async ({ texts }) => ({ success: true, data: {
    revision: 'verified-active-fixture', aliases: texts.map(text => ({ text, aliases: data.aliasesFor(text), searchExpression: localizedSearchExpression(data, text) }))
  } }) } })).aliases
}
function config(id) {
  const result = createDefaultVendorConfig()
  result[id === 'max_life' ? 'common' : id === 'res_fire' ? 'resistance' : 'movement'].selectedIds = [id]
  return result
}

test('真实受管条目压缩后常用生命、火抗、30移速及组合仍能生成完整250字符内正则', async () => {
  assert.ok(fixture.entries.length > 100)
  for (const entry of fixture.entries) assert.equal(createHash('sha256').update(entry.en).digest('hex'), entry.sourceHash)
  const aliases = await catalog()
  for (const id of Object.keys(query)) {
    const compiled = aliases.get(query[id]).searchExpression
    assert.equal(compiled.complete, true, id)
    assert.equal(compiled.mapped, true, id)
    const result = generateVendorRegex(config(id), 'en', aliases)
    assert.ok(result.regex && result.length <= 250, `${id}: ${JSON.stringify(result)}`)
  }
  const combined = config('max_life')
  combined.resistance.selectedIds = ['res_fire']
  combined.movement.selectedIds = ['movement_30']
  const result = generateVendorRegex(combined, 'en', aliases)
  assert.ok(result.regex && result.length <= 250, JSON.stringify(result))
})

test('简繁英文压缩保持物品属性身份，不把魔力、冰抗、施法速度或130/20移速放行', async () => {
  const aliases = await catalog()
  for (const [id, positives, negatives] of [
    ['max_life', ['+89 to maximum Life', '+89 最大生命', '+89 最大生命 (crafted)', '+89 最大生命（工藝）', '生命上限提高 10%'], ['+89 to maximum Mana', '+89 最大魔力', '魔力上限提高 10%', ...['en', 'cn', 'tw'].map(locale => fixture.entries.find(entry => entry.id === 'ReminderTextCullingStrike')[locale])]],
    ['res_fire', ['+35% to Fire Resistance', '+35% 火焰抗性'], ['+35% to Cold Resistance', '+35% 冰霜抗性', '+35% 冰冷抗性']],
    ['movement_30', ['30% increased Movement Speed', '移动速度加快 30%', '增加 30% 移動速度'], ['130% increased Movement Speed', '移动速度加快 130%', '增加 130% 移動速度', '增加 20% 移動速度', '施法速度加快 30%', '增加 30% 施放速度', '增加 30% 攻擊速度']]
  ]) {
    const regex = compile(generateVendorRegex(config(id), 'en', aliases))
    for (const text of positives) assert.equal(regex.test(text), true, `${id}: ${text}`)
    for (const text of negatives) assert.equal(regex.test(text), false, `${id}: ${text}`)
  }
})

test('可信词库实例隔离缓存，歧义同文不能产生部分正则；损坏哈希不能贡献翻译', async () => {
  const fire = fixture.entries.find(entry => entry.en === '{0:+d}% to Fire Resistance')
  assert.ok(fire)
  const ambiguous = createLocalizationDictionary([...fixture.entries, { ...fire, id: 'collision-cold', en: '{0:+d}% to Cold Resistance', sourceHash: undefined }])
  const result = generateVendorRegex(config('res_fire'), 'en', await catalog(ambiguous))
  assert.equal(result.regex, '')
  assert.match(result.warnings.join(' '), /完整映射/)
  const invalid = createLocalizationDictionary([{ ...fire, sourceHash: '0'.repeat(64) }])
  assert.equal(localizedSearchExpression(invalid, 'Fire Resistance').mapped, false)
  assert.equal(localizedSearchExpression(dictionary, 'Fire Resistance').complete, true)
})

test('压缩传输仍保留超长拒绝，不返回截断条件', async () => {
  const aliases = await catalog()
  aliases.get('maximum Life').searchExpression = { expression: '长'.repeat(300), complete: true, mapped: true }
  const result = generateVendorRegex(config('max_life'), 'en', aliases)
  assert.equal(result.regex, '')
  assert.equal(result.overLimit, true)
  assert.match(result.warnings.join(' '), /未截断/)
})

test('物品类别头按字段分解避免排列膨胀，原版英文不依赖汉化映射', () => {
  const data = createLocalizationDictionary([])
  const result = localizedSearchExpression(data, 'Item Class: Amulets')
  assert.equal(result.complete, true)
  assert.ok(result.expression.length < 250)
  const regex = new RegExp(result.expression, 'imu')
  for (const text of ['物品类别: 项链', '物品種類: 護身符', 'Item Class: 項鍊']) assert.equal(regex.test(text), true, text)
  assert.equal(regex.test('物品类别: 戒指'), false)
  assert.equal(generateVendorRegex(config('max_life'), 'en').regex, '"maximum Life"')
  const rarity = createDefaultVendorConfig()
  rarity.common.selectedIds = ['item_rarity']
  assert.equal(compile(generateVendorRegex(rarity, 'en')).test('+25% to Item Rarity'), true)
})
