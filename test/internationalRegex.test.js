import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import data from '../src/data/internationalMapData.js'
import { mapRegexCatalog, createDefaultMapRegexConfig, cleanMapRegexConfig, generateMapRegex } from '../src/domains/regex/mapRegex.js'
import { beastRegexOptions, cleanBeastRegexConfig, generateBeastRegex } from '../src/domains/regex/beastRegex.js'
import { affixSuggestionsForKind, searchMapAffixSuggestions } from '../src/utils/mapAffixSuggestions.js'
import { parseInternationalMods, parseInternationalChart, buildInternationalSuggestions, parseCurrentBeasts, generateInternationalMapData } from '../scripts/generateInternationalMapData.js'

test('国际服地图词库记录独立3.30来源、统一地图/契约/海图且保持完整数字模板', () => {
  assert.equal(data.manifest.server, 'international')
  assert.equal(data.manifest.gameVersion, '3.30.0')
  assert.equal(data.manifest.language, 'en')
  assert.equal(data.manifest.sources.length, 8)
  for (const source of data.manifest.sources) {
    assert.match(source.url, /^https:\/\/poedb\.tw\/us\//)
    assert.match(source.sha256, /^[a-f0-9]{64}$/)
  }
  for (const kind of ['atlas', 'chart', 'heist']) {
    assert.equal(affixSuggestionsForKind(kind, 'en'), data[kind])
    for (const item of data[kind]) {
      const normalize = text => text.replace(/\(-([\d.]+)[—–-]-([\d.]+)\)/g, '-($1—$2)').replace(/\(?\d+(?:\.\d+)?(?:\s*[—–-]\s*\d+(?:\.\d+)?)?\)?/g, '#')
      assert.ok(item.variants.every(variant => normalize(variant) === item.pattern), `${kind}:${item.id}`)
      assert.equal(item.value, item.pattern)
      assert.equal(/\p{Script=Han}/u.test(item.example), false)
    }
  }
  assert.ok(data.atlas.every(item => JSON.stringify(item.regions) === '["atlas"]'))
  assert.equal(data.atlas.some(item => /Atlas Drops|more Threads found/i.test(item.value)), false, '每词缀的地图奖励贡献不是可洗条件')
  assert.ok(searchMapAffixSuggestions('heist', 'REINFORCEMENTS', 10, 'en').length)
  assert.equal(affixSuggestionsForKind('atlas', 'zh-CN').some(item => /\p{Script=Han}/u.test(item.value)), true)
})

test('四类地图合并不丢失当前131条稳定身份、完整数值及四页来源，离线重建一致', () => {
  const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
  assert.equal(data.atlas.length, 131)
  assert.equal(new Set(data.atlas.map(entry => entry.id)).size, 131)
  assert.equal(digest(data.atlas.map(({ regions, ...entry }) => entry)), '476e1bfcfebe054324f9cec7c68f6df64a7f9357957c6564f2319044226d1297')
  assert.deepEqual(data.manifest.sources.slice(0, 4), [
    ['Maps_low_tier', '4c6e802465c93eb0cadeffb89502d79c2c9eeb9741340697555da78b51409b04'],
    ['Maps_mid_tier', '80ce6b87f1286c425cc52137b14840b82092758e91b5bd0f430af5a12a9b47ee'],
    ['Maps_top_tier', 'f71a2da51cc0b00478e9fe7b7c0979cf1ac7a864abbff2572627dacf11b87e54'],
    ['Maps_uber_tier', '4e9c5926704e0bf174f554144305b392043ba25c181c1149efe1139f52feff67']
  ].map(([page, sha256]) => ({ url: `https://poedb.tw/us/${page}`, sha256 })))
  const rebuilt = buildInternationalSuggestions([{ region: 'atlas', mods: data.atlas.map(entry => ({ affixType: entry.affixType, lines: entry.variants, tags: entry.tags })) }], 'atlas')
  assert.deepEqual(rebuilt, data.atlas)
})

test('每个英文地图表达式只命中全目录自身全部档位和边界样本，大小写不影响', () => {
  const catalog = mapRegexCatalog('en')
  for (const [id, expression] of Object.entries(catalog.expressions)) {
    const regex = new RegExp(expression, 'iu')
    for (const candidate of catalog.corpus) for (const variant of candidate.variants) {
      assert.equal(regex.test(variant.toUpperCase()), candidate.id === id, `${id} 对 ${candidate.id}：${expression}`)
    }
  }
})

test('英文地图数值使用3.30属性并正确处理数字边界、多行、包括排除和价格', () => {
  const catalog = mapRegexCatalog('en')
  const config = createDefaultMapRegexConfig('en')
  assert.ok(config.stats.atlasDrops)
  assert.ok(config.stats.threads)
  assert.equal(config.stats.quantity, undefined)
  assert.equal(config.stats.scarabs, undefined)
  config.stats.atlasDrops = { enabled: true, value: 80 }
  const numeric = generateMapRegex(config, 'en').regex.slice(1, -1)
  const regex = new RegExp(numeric, 'i')
  for (const value of [0, 7, 79, 80, 81, 180, 999, 1080]) assert.equal(regex.test(`Atlas Drops: +${value}%`), value >= 80, String(value))
  assert.equal(regex.test('Atlas Drops:\n+80%'), false)
  assert.equal(regex.test('Atlas Drops: -80%'), false)
  assert.equal(regex.test('Item Quantity: +180%'), false)
  config.includeAffixIds = [catalog.affixes[0].id]
  config.excludeAffixIds = [catalog.affixes[1].id]
  config.rarity = { mode: 'include', selectedIds: ['rare'] }
  config.corrupted = { enabled: true, mode: 'exclude' }
  config.priceRange = { min: 10, max: 19, currencies: ['div', 'ch'] }
  const result = generateMapRegex(config, 'en')
  assert.equal(result.includeCount, 4)
  assert.equal(result.excludeCount, 2)
  assert.ok(result.regex.includes('~b/o 1\\d (div|ch)'))
  assert.equal(/\p{Script=Han}/u.test(result.regex), false)
  assert.deepEqual(cleanMapRegexConfig({ includeAffixIds: ['被怪物击中时中毒'] }, 'en').includeAffixIds, [])
})

test('英文野兽仅使用当前红兽/首领与官方可交易目录交集，短表达式不误匹配', () => {
  const options = beastRegexOptions('en')
  assert.equal(options.length, 51)
  assert.ok(options.some(item => item.name === 'Farrul, First of the Plains'))
  assert.ok(options.some(item => item.name === 'Black Mórrigan'))
  assert.equal(options.some(item => item.name === 'Cave Beast'), false)
  assert.equal(options.some(item => item.name === 'Farric Hound Alpha'), false)
  for (const item of options) {
    const regex = new RegExp(item.expression, 'iu')
    const copied = new RegExp(generateBeastRegex({ includeIds: [item.id] }, 'en').regex.slice(1, -1), 'iu')
    for (const other of options) {
      assert.equal(regex.test(other.name.toUpperCase()), item.id === other.id, `${item.name}/${other.name}`)
      assert.equal(copied.test(other.name.toUpperCase()), item.id === other.id, `复制后 ${item.name}/${other.name}`)
    }
  }
  const [a, b] = options
  const config = cleanBeastRegexConfig({ includeIds: [a.id, a.id, b.id, 'Cave Beast'], excludeIds: [b.id], priceRange: { min: 10, max: 19, currencies: ['div'] } }, 'en')
  assert.deepEqual(config.includeIds, [a.id])
  const result = generateBeastRegex(config, 'en')
  assert.equal(result.includeCount, 2)
  assert.equal(result.excludeCount, 1)
  assert.ok(result.regex.includes(`"!${b.expression}"`))
  assert.equal(generateBeastRegex({ includeIds: options.map(item => item.id) }, 'en').includeCount, options.length)
})

test('英文生成器校验词缀域、忽略不可洗记录和奖励贡献，不猜测来源', async () => {
  const html = 'new ModsView(' + JSON.stringify({ opt: { ModDomainsID: 5 }, normal: [
    { DropChance: 100, ModGenerationTypeID: '1', str: 'Monsters deal (10—20)% increased Damage<br>10% increased Atlas Drops in this Area<br>35% more Threads found in Area' },
    { DropChance: 0, ModGenerationTypeID: '2', str: 'Legacy effect' },
    { DropChance: 100, ModGenerationTypeID: '3', str: 'Implicit effect' }
  ] }) + ')'
  const mods = parseInternationalMods(html, 5)
  assert.equal(mods.length, 1)
  assert.deepEqual(mods[0].lines, ['Monsters deal (10—20)% increased Damage'])
  assert.throws(() => parseInternationalMods(html, 22), /词缀域/)
  assert.throws(() => parseInternationalMods('<html/>', 5), /ModsView/)
  const entries = buildInternationalSuggestions([{ mods, region: 'atlas' }], 'atlas')
  assert.ok(entries[0].variants.includes('Monsters deal 10% increased Damage'))
  assert.ok(entries[0].variants.includes('Monsters deal 20% increased Damage'))
  const chart = parseInternationalChart('<table><thead><tr><th>Level</th><th>Pre/Suf</th><th>Description</th></tr></thead><tbody><tr><td>1</td><td>Prefix</td><td>More Monsters<br>20% increased Rarity of Items found in adjacent Areas</td></tr><tr><td>1</td><td>Unique</td><td>Legacy implicit</td></tr></tbody></table>')
  assert.deepEqual(chart.map(row => row.lines), [['More Monsters']])
  assert.throws(() => parseCurrentBeasts('<div/>', { items: [] }), /覆盖不足/)
  await assert.rejects(generateInternationalMapData({ gameVersion: '3.29', catalog: {} }), /3.30/)
  await assert.rejects(generateInternationalMapData({ gameVersion: '3.30.0', catalog: { locale: 'zh-CN' } }), /国际服英文/)
})
