import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HEIST_AFFIX_CATALOG_META, HEIST_AFFIX_SUGGESTIONS } from '../src/data/heistAffixSuggestionsData.js'
import { affixSuggestionsForKind, searchMapAffixSuggestions } from '../src/utils/mapAffixSuggestions.js'
import { parseHeistAffixes, SOURCE_URLS } from '../scripts/generateHeistAffixSuggestions.js'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { matchMapRequirements } from '../electron/modules/item/matcher.js'
import { createDefaultHeistConfig } from '../src/utils/mapPresetMigration.js'

test('契约蓝图快照来源完整且每个候选可命中全部数值档位', () => {
  assert.deepEqual(HEIST_AFFIX_CATALOG_META.sourceUrls, SOURCE_URLS)
  assert.equal(HEIST_AFFIX_SUGGESTIONS.length, 98)
  assert.equal(new Set(HEIST_AFFIX_SUGGESTIONS.map(entry => entry.value)).size, 98)
  for (const entry of HEIST_AFFIX_SUGGESTIONS) {
    assert.doesNotMatch(entry.value, /\d|[<>]|heist |map /)
    assert.ok(['prefix', 'suffix'].includes(entry.affixType))
    assert.ok(entry.example.includes(entry.value))
    assert.ok(entry.variants.every(line => line.includes(entry.value)))
  }
  const chain = searchMapAffixSuggestions('heist', '连锁弹射')[0]
  assert.equal(chain.variants.length, 2)
  assert.ok(chain.variants.every(line => line.includes(chain.value)))
})

test('契约搜索隔离，支持示例和标签，空输入和限额保持一致', () => {
  assert.equal(affixSuggestionsForKind('heist'), HEIST_AFFIX_SUGGESTIONS)
  assert.ok(searchMapAffixSuggestions('heist', '巡逻队').length > 0)
  assert.deepEqual(searchMapAffixSuggestions('atlas', '巡逻队'), [])
  assert.deepEqual(searchMapAffixSuggestions('chart', '巡逻队'), [])
  assert.deepEqual(searchMapAffixSuggestions('heist', '贤主会干涉玩家'), [])
  assert.ok(searchMapAffixSuggestions('heist', '警报').length > 0)
  assert.ok(searchMapAffixSuggestions('heist', '异常状态').length > 0)
  assert.ok(searchMapAffixSuggestions('heist', '附加 1 次').length > 0)
  assert.deepEqual(searchMapAffixSuggestions('heist', '   '), [])
  assert.deepEqual(searchMapAffixSuggestions('heist', '不存在的关键词'), [])
  assert.equal(searchMapAffixSuggestions('heist', '怪物', 2).length, 2)
  assert.ok(searchMapAffixSuggestions('heist', '怪物').length <= 50)
})

test('快照解析拆分多行，剔除隐藏统计、零权重和非前后缀', () => {
  const mod = { DropChance: 1000, ModGenerationTypeID: '1', str: '怪物伤害提高 10%<br>怪物生命总增 20%<br><span class="secondary">map item drop quantity +% [10]</span>', mod_no: ['<span>伤害</span>'] }
  const html = `new ModsView(${JSON.stringify({ opt: { ModDomainsID: 22 }, normal: [mod, { ...mod, DropChance: 0 }, { ...mod, ModGenerationTypeID: '3' }] })})`
  assert.deepEqual(parseHeistAffixes(html), [{ affixType: 'prefix', lines: ['怪物伤害提高 10%', '怪物生命总增 20%'], tags: ['伤害'] }])
  assert.throws(() => parseHeistAffixes('<html></html>'), /ModsView/)
})

test('联想选择值在真实蓝图文本上触发白名单和黑名单', () => {
  const text = readFileSync(new URL('./fixtures/heistBlueprintCn.txt', import.meta.url), 'utf8')
  for (const category of ['契约', '蓝图']) {
    const item = parseItemInfo(text.replace('物品类别: 蓝图', `物品类别: ${category}`))
    for (const query of ['连锁弹射', '腐化地面', '怪物生命总增', '稀有怪物的数量']) {
      const suggestion = searchMapAffixSuggestions('heist', query)[0]
      assert.ok(suggestion, query)
      const config = { ...createDefaultHeistConfig(), targetKind: 'heist' }
      config.match.whitelist = [suggestion.value]
      assert.equal(matchMapRequirements(item, config).isMatch, true, query)
      config.match.blacklist = [suggestion.value]
      assert.equal(matchMapRequirements(item, config).reason, 'blacklist', query)
    }
  }
})
