import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { ATLAS_MAP_AFFIX_SUGGESTIONS } from '../src/data/mapAffixSuggestionsData.js'
import internationalMapData from '../src/data/internationalMapData.js'
import { cleanMapRegexConfig, createDefaultMapRegexConfig, filterMapRegexAffixes, generateMapRegex, mapRegexCatalog } from '../src/domains/regex/mapRegex.js'
import { useRegexPresetStore } from '../src/domains/regex/regexPresetStore.js'
import { moduleHelpTopicsById } from '../src/domains/help/helpContent.js'
import { MAP_FORMAT_EXAMPLES } from '../src/utils/supportedItemFormats.js'

for (const language of ['zh-CN', 'en']) {
  test(`${language} 旧分组迁移后全地图目录可见且条件、正则结果不变`, () => {
    const catalog = mapRegexCatalog(language)
    const expectedIds = language === 'en' ? internationalMapData.atlas.map(item => item.id) : ATLAS_MAP_AFFIX_SUGGESTIONS.map(item => item.value)
    assert.deepEqual(catalog.affixes.map(item => item.id), expectedIds)
    assert.ok(catalog.affixes.every(item => item.regions.length === 1 && item.regions[0] === 'atlas'))
    const baseline = createDefaultMapRegexConfig(language)
    baseline.includeAffixIds = [catalog.affixes[0].id]
    baseline.excludeAffixIds = [catalog.affixes.at(-1).id]
    baseline.stats.packSize = { enabled: true, value: 30 }
    baseline.priceRange = { min: 1, max: 10, currencies: ['div'] }
    const expectedResult = generateMapRegex(baseline, language)
    for (const region of ['normal', 't17', 'atlas', undefined]) {
      const legacy = { ...baseline, region }
      const migrated = cleanMapRegexConfig(legacy, language)
      assert.deepEqual(migrated, baseline)
      assert.deepEqual(generateMapRegex(migrated, language), expectedResult)
      assert.deepEqual(filterMapRegexAffixes(legacy, '', language).map(item => item.id), expectedIds)
    }
    const prefixOnly = filterMapRegexAffixes({ ...baseline, affixTypes: ['prefix'] }, '', language)
    assert.ok(prefixOnly.length > 0 && prefixOnly.length < expectedIds.length)
    assert.ok(prefixOnly.every(item => item.affixType === 'prefix' || item.affixType === 'mixed'))
  })
}

test('统一地图目录仍按活动汉化别名搜索，条件 ID 使用英文原值', () => {
  const config = { ...createDefaultMapRegexConfig('en'), region: 't17' }
  const item = mapRegexCatalog('en').affixes.at(-1)
  const aliases = new Map([[item.value, { aliases: ['测试受管完整汉化词缀', '測試受管完整漢化詞綴'] }]])
  for (const query of ['测试受管完整汉化词缀', '測試受管完整漢化詞綴', item.value.toUpperCase()]) {
    assert.deepEqual(filterMapRegexAffixes(config, query, 'en', aliases).map(entry => entry.id), [item.id])
  }
})

test('真实预设存储恢复旧分组并保留预设身份、当前选择和条件', t => {
  const previousStorage = globalThis.localStorage
  t.after(() => { globalThis.localStorage = previousStorage })
  const catalog = mapRegexCatalog('zh-CN')
  const presets = ['normal', 't17'].map((region, index) => ({
    id: `legacy-${region}`, name: `保留方案${index}`, mapRegex: {
      ...createDefaultMapRegexConfig('zh-CN'), region,
      includeAffixIds: [catalog.affixes[index].id], excludeAffixIds: [catalog.affixes.at(-1 - index).id]
    }
  }))
  const values = new Map([['mapRegexPresets', JSON.stringify(presets)], ['currentMapRegexPresetId', 'legacy-t17']])
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) }
  setActivePinia(createPinia())
  const store = useRegexPresetStore()
  assert.equal(store.currentMapRegexPresetId, 'legacy-t17')
  store.save()
  const saved = JSON.parse(values.get('mapRegexPresets'))
  for (const preset of presets) {
    assert.deepEqual(saved.find(item => item.id === preset.id), { ...preset, mapRegex: { ...preset.mapRegex, region: 'atlas' } })
  }
})

test('帮助和真实页面呈现一个异界地图入口，国服旧格式样例仍保留', () => {
  const panel = readFileSync(new URL('../src/domains/regex/MapRegexPanel.vue', import.meta.url), 'utf8')
  assert.match(panel, /filterMapRegexAffixes\(config\.value, query\.value, currentServer\.language, localization\.aliases\.value\)/)
  assert.doesNotMatch(panel, /config\.region|regions\.includes|value="t17"/)
  const help = JSON.stringify(moduleHelpTopicsById('map'))
  for (const band of ['Low', 'Mid', 'Top', 'Uber']) assert.ok(help.includes(band))
  assert.ok(help.includes('同一个异界地图预设'))
  assert.doesNotMatch(JSON.stringify(moduleHelpTopicsById('regex')), /普通或 T17|按普通、T17/)
  assert.deepEqual(MAP_FORMAT_EXAMPLES.slice(0, 2).map(item => [item.id, item.label]), [
    ['map-normal', '国服三字段地图样例'], ['map-t17', '国服六字段地图样例']
  ])
})
