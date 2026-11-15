import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createLocalizationTextResolver } from '../electron/modules/localization/text.js'
import { resolveCatalogStat } from '../electron/modules/priceCheck/catalog.js'

// Verbatim, hashed stat variants from signed release ee32f0cc-5f9e-49c3-9422-2c40d889d5bc.
const entries = JSON.parse(readFileSync(new URL('./fixtures/price-check-stat-plural-entries.json', import.meta.url)))
const catalog = JSON.parse(readFileSync(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)))
const cases = [
  ['local_flask_gain_X_charges_when_hit', 6, 'explicit', 'explicit.stat_1582728645'],
  ['gain_adrenaline_for_X_seconds_on_kill', 7, 'explicit', 'explicit.stat_4145689649'],
  ['herald_scorpion_number_of_additional_projectiles', 2, 'enchant', 'enchant.stat_155429578'],
  ['local_flask_ignite_proliferation_radius_during_effect', 2.5, 'explicit', 'explicit.stat_3052040294']
]
const rows = id => entries.filter(entry => entry.id === id)
const render = (text, number) => text.replace(/\{0\}/g, String(number))
const canonical = (dictionary, text, type = 'explicit', currentCatalog = catalog) => dictionary.resolve(
  type === 'explicit' ? text : `{ Enchant Modifier }\n${text}`,
  { normalizeStatSigns: true, catalog: currentCatalog }
).text.split('\n').at(-1)

test('同源单复数词缀桥接仅使用当前官方类型，保留真实数值与处理器单位', () => {
  const dictionary = createLocalizationTextResolver(entries)
  for (const [id, number, type, expectedId] of cases) {
    const [singular, plural] = ['variant:0', 'variant:1'].map(field => rows(id).find(entry => entry.field === field))
    const expected = render(singular.en, number)
    for (const language of ['en', 'cn', 'tw']) {
      const source = render(plural[language], number)
      const result = canonical(dictionary, source, type)
      assert.equal(result, expected, `${id}/${language}`)
      const match = resolveCatalogStat(catalog, result, type).match
      assert.equal(match?.id, expectedId, `${id}/${language}`)
      assert.deepEqual(match.values, [number], `${id}/${language}: 必须保留显示单位而非原始 handler 单位`)
      if (language === 'en') {
        const resolved = dictionary.resolve(type === 'explicit' ? source : `{ Enchant Modifier }\n${source}`, { normalizeStatSigns: true, catalog })
        assert.equal(resolved.lineMappings.at(-1).canonical, expected)
        assert.equal(resolved.lineMappings.at(-1).original, source)
      }
    }
  }
})

test('单数充能仍保留1，复数范围的原始6不被规范化为单数示例值1', () => {
  const dictionary = createLocalizationTextResolver(entries)
  for (const source of ['Gain 1 Charge when you are Hit by an Enemy', '你被敌人击中时获得 1 次充能']) {
    assert.equal(canonical(dictionary, source), 'Gain 1 Charge when you are Hit by an Enemy')
  }
  const text = canonical(dictionary, 'Gain 6(4-6) Charges when you are Hit by an Enemy')
  assert.equal(text, 'Gain 6(4-6) Charge when you are Hit by an Enemy')
})

test('已有当前类型官方matcher时保持复数原文，其他类型matcher不能用于桥接', () => {
  const dictionary = createLocalizationTextResolver(entries)
  const source = 'Gain 6 Charges when you are Hit by an Enemy'
  const currentCatalog = { ...catalog, stats: catalog.stats.map(stat => stat.ids?.explicit === 'explicit.stat_1582728645'
    ? { ...stat, matchers: [...stat.matchers, 'Gain # Charges when you are Hit by an Enemy'] } : stat) }
  assert.equal(canonical(dictionary, source, 'explicit', currentCatalog), source)
  assert.equal(canonical(dictionary, source, 'enchant'), source)
})

test('坏hash、缺失可信hash、不同stat、不同handler或不同参数不能借单复数桥接', () => {
  const charge = rows('local_flask_gain_X_charges_when_hit')
  const singular = charge.find(entry => entry.field === 'variant:0')
  const plural = charge.find(entry => entry.field === 'variant:1')
  const source = 'Gain 6 Charges when you are Hit by an Enemy'
  const changedParameter = { ...singular, en: singular.en.replace('{0}', '{1}') }
  changedParameter.sourceHash = createHash('sha256').update(changedParameter.en).digest('hex')
  const differentHandler = structuredClone(plural)
  differentHandler.stats.variants[1].handlers = 'reminderstring AnotherReminder'
  for (const invalidRows of [
    [singular, { ...plural, sourceHash: '0'.repeat(64) }],
    [{ ...singular, sourceHash: '0'.repeat(64) }, plural],
    charge.map(({ sourceHash, ...entry }) => entry),
    [singular, { ...plural, id: 'different_stat' }],
    [singular, differentHandler],
    [changedParameter, plural]
  ]) assert.equal(canonical(createLocalizationTextResolver(invalidRows), source), source)
})
