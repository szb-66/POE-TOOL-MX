import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createSupportGemResolver } from '../electron/modules/localization/supportGem.js'
import { soulMantleText } from './fixtures/localizedPriceCheckReportedItems.js'

const entries = JSON.parse(readFileSync(new URL('./fixtures/localized-support-gem-entries.json', import.meta.url), 'utf8'))
const catalog = JSON.parse(readFileSync(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
const options = { catalog }
const english = 'Socketed Gems are Supported by Level 20 Spell Totem'
const reported = soulMantleText.split('\n').find(line => line.includes('寶石被等級'))

test('受信任辅助宝石模板识别实际零宽字符、混合注记与截图简体字形', () => {
  const resolver = createSupportGemResolver(entries)
  for (const text of [reported,
    '插槽中的寶石被等級 20 的 法術圖騰輔助 輔助',
    '插槽中的宝石被等级 20 的 法术图腾辅助 辅助',
    '插入的技能石被 20 级的法术图腾(辅)辅助']) assert.equal(resolver.resolve(text, options), english)
})

test('stat handler和ClientStrings均按各自参数编号解析支持名称', () => {
  for (const kind of ['stat', 'dat']) {
    const filtered = kind === 'stat' ? entries.filter(entry => entry.table !== 'clientstrings') : entries.filter(entry => entry.kind !== 'stat')
    const resolver = createSupportGemResolver(filtered)
    assert.equal(resolver.resolve(reported, options), english)
    assert.equal(resolver.resolve('插槽中的宝石被等级 20 的 未知辅助 辅助', options), null)
  }
})

test('未验证名称或模板、未知handler、无官方词缀与目录歧义均拒绝派生', () => {
  const invalid = entries.map(entry => ({ ...entry, sourceHash: '0'.repeat(64) }))
  assert.equal(createSupportGemResolver(invalid).resolve(reported, options), null)
  const invalidNames = entries.map(entry => ['grantedeffects', 'baseitemtypes'].includes(entry.table) ? { ...entry, sourceHash: '0'.repeat(64) } : entry)
  assert.equal(createSupportGemResolver(invalidNames).resolve(reported, options), null)
  const invalidStat = entries.filter(entry => entry.table !== 'clientstrings').map(entry => entry.kind === 'stat'
    ? { ...entry, stats: { ...entry.stats, variants: entry.stats.variants.map(variant => ({ ...variant, handlers: 'unknown 2 1' })) } } : entry)
  assert.equal(createSupportGemResolver(invalidStat).resolve(reported, options), null)
  const resolver = createSupportGemResolver(entries)
  for (const supplied of [{}, { stats: [] }, { stats: [
    { matchers: ['Socketed Gems are Supported by Level # Spell Totem'], ids: { explicit: 'explicit.one' } },
    { matchers: ['Socketed Gems are Supported by Level # Spell Totem'], ids: { explicit: 'explicit.two' } }
  ] }, { stats: [
    { matchers: ['Socketed Gems are Supported by Level # Spell Totem'], ids: { explicit: ['explicit.one', 'explicit.two'] } }
  ] }, { stats: [
    { matchers: ['Socketed Gems are Supported by Level # Spell Totem'], ids: { explicit: 'invalid id' } }
  ] }, { provider: 'poe-international', gameVersion: '3.30', unqueryableStats: [{ provider: 'poe-international', gameVersion: '3.30', id: 'explicit.indexable_support_15' }], stats: [
    { matchers: ['Socketed Gems are Supported by Level # Spell Totem'], ids: { explicit: 'explicit.indexable_support_15' } }
  ] }]) assert.equal(resolver.resolve(reported, { catalog: supplied }), null)
  assert.equal(resolver.resolve(reported), null)
  assert.equal(resolver.resolve(reported, { catalog, type: 'enchant' }), null)
})

test('相同可信译名对应不同辅助时不让目录替用户猜测', () => {
  const other = { ...entries.find(entry => entry.table === 'grantedeffects' && entry.field === 'SupportName'), id: 'SupportOther', en: 'Other Support' }
  other.sourceHash = createHash('sha256').update(other.en).digest('hex')
  assert.equal(createSupportGemResolver([...entries, other]).resolve(reported, options), null)
})
