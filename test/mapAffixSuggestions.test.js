import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ATLAS_MAP_AFFIX_CATALOG_META,
  ATLAS_MAP_AFFIX_SUGGESTIONS
} from '../src/data/mapAffixSuggestionsData.js'
import { FRAGMENT_CHART_MODS } from '../src/data/chartModsData.js'
import {
  CHART_AFFIX_SUGGESTIONS,
  affixSuggestionsForKind,
  buildChartAffixSuggestions,
  searchMapAffixSuggestions
} from '../src/utils/mapAffixSuggestions.js'

function assertCatalogContract(kind, catalog) {
  assert.ok(catalog.length > 0, `${kind} 候选不应为空`)
  assert.equal(new Set(catalog.map(entry => entry.value)).size, catalog.length, `${kind} value 应唯一`)
  for (const entry of catalog) {
    assert.ok(entry.value.trim(), `${kind} value 不应为空`)
    assert.doesNotMatch(entry.value, /\d/, `${kind} value 不应包含可变数值`)
    assert.ok(entry.example.includes(entry.value), `${kind} 示例应包含 value: ${entry.value}`)
    assert.ok(['prefix', 'suffix', 'mixed'].includes(entry.affixType), `${kind} 词缀类型无效`)
    assert.ok(Array.isArray(entry.tags), `${kind} tags 应为数组`)
    assert.ok(entry.variants.length > 0, `${kind} variants 不应为空`)
    assert.ok(entry.variants.every(variant => variant.includes(entry.value)), `${kind} value 应命中全部档位: ${entry.value}`)
  }
}

test('异界地图与航海海图候选满足稳定子串契约', () => {
  assert.deepEqual(ATLAS_MAP_AFFIX_CATALOG_META, {
    game: 'poe1',
    gameVersion: '3.29',
    locale: 'zh-CN',
    snapshotDate: '2026-09-01',
    source: 'POEDB 国服简体中文地图词缀快照',
    sourceUrl: 'https://poedb.tw/cn/Maps_uber_tier',
    sourceUrls: [
      'https://poedb.tw/cn/Maps_low_tier',
      'https://poedb.tw/cn/Maps_mid_tier',
      'https://poedb.tw/cn/Maps_top_tier',
      'https://poedb.tw/cn/Maps_uber_tier'
    ]
  })
  assert.equal(ATLAS_MAP_AFFIX_SUGGESTIONS.length, 122, '3.29 低、中、高阶及 Uber 地图快照应覆盖 122 个稳定语义行')
  assertCatalogContract('atlas', ATLAS_MAP_AFFIX_SUGGESTIONS)
  assertCatalogContract('chart', CHART_AFFIX_SUGGESTIONS)
  assert.equal(CHART_AFFIX_SUGGESTIONS.length, 45)
  assert.ok(CHART_AFFIX_SUGGESTIONS.every(entry => ['prefix', 'suffix'].includes(entry.affixType)))

  const physicalThorns = ATLAS_MAP_AFFIX_SUGGESTIONS.find(entry => entry.value === '稀有怪物带有物理荆棘')
  assert.deepEqual(physicalThorns?.variants, [
    '稀有怪物带有物理荆棘，反射 400 点物理伤害',
    '稀有怪物带有物理荆棘，反射 600 点物理伤害',
    '稀有怪物带有物理荆棘，反射 800 点物理伤害',
    '稀有怪物带有物理荆棘，反射 1500 点物理伤害'
  ])
  assert.ok(ATLAS_MAP_AFFIX_SUGGESTIONS.every(entry => (
    !/^(该区域物品掉落数量提高|该地图的物品稀有度提高|怪物群规模扩大|区域内找到的(?:地图|通货|圣甲虫)总增|map )/.test(entry.value)
  )))
})

test('Uber 地图专属词缀完整并入异界地图候选', () => {
  const uberOnlyValues = [
    '怪物的投射物击中地形时产生连锁', '怪物的暴击球上限', '怪物的狂怒球上限',
    '怪物的耐力球上限', '怪物被击中时获得一个耐力球', '怪物的所有击中伤害造成中毒状态',
    '怪物的中毒时间提高', '格挡攻击伤害', '玩家从偷取中获得的每秒最大生命、魔力和能量护盾总回复量降低',
    '每个稀有怪物额外具有', '随机神龛增益', '缓速藤蔓', '稀有怪物有无常之核',
    '额外随机元素伤害', '玩家会受到血痕锯刃魔的袭击', '玩家使用药剂时成为陨石的目标',
    '玩家的防御属性总降', '区域内有淹没法球', '所有怪物的伤害都可以点燃、冰冻和感电',
    '怪物击中时造成点燃、冻结和感电', '召唤生物的伤害穿透', '区域包含不稳定的恶魔触手',
    '区域内的稀有怪物被塑界者触碰', '地图首领伴随着一个虚空忆境首领',
    '怪物受到的减益效果消减速度加快', '区域内包含焚界者符文', '贤主会干涉玩家',
    '的几率分裂', '影响友军的玩家光环技能同样影响敌人', '区域内的稀有怪物死亡时暂时复活',
    '区域内包含迷宫陷阱', '玩家受到的药剂效果总降', '区域内有移动的印记地面，施加随机印记'
  ]
  const actualValues = new Set(ATLAS_MAP_AFFIX_SUGGESTIONS.map(entry => entry.value))
  assert.deepEqual(uberOnlyValues.filter(value => !actualValues.has(value)), [])

  assert.ok(searchMapAffixSuggestions('atlas', '无常之核').some(entry => entry.value === '稀有怪物有无常之核'))
  assert.ok(searchMapAffixSuggestions('atlas', '额外随机元素伤害').some(entry => entry.value === '额外随机元素伤害'))
  assert.equal(searchMapAffixSuggestions('chart', '无常之核').length, 0)
  assert.ok(ATLAS_MAP_AFFIX_SUGGESTIONS.every(entry => entry.variants.every(variant => (
    !/^区域内找到的(?:地图|通货|圣甲虫)总增/.test(variant)
  ))))
})

test('海图构建器合并数值档位并排除奖励行、传奇和未揭示说明', () => {
  const suggestions = buildChartAffixSuggestions([
    {
      affixType: 'prefix', tags: ['伤害'],
      lines: ['怪物伤害提高 10%', '相邻区域中找到的亡者硫磺提高 30%']
    },
    {
      affixType: 'prefix', tags: ['伤害'],
      lines: ['怪物伤害提高 30%', '相邻区域中找到的亡者硫磺提高 45%']
    },
    { affixType: 'legendary', tags: [], lines: ['传奇边框词缀'] },
    { affixType: '', tags: [], lines: ['空标签词缀'] },
    { affixType: 'unknown', tags: [], lines: ['未知标签词缀'] },
    { affixType: 'prefix', tags: [], lines: ['航行词缀将在完成测绘后揭示'] }
  ])

  assert.equal(suggestions.length, 1)
  assert.equal(suggestions[0].value, '怪物伤害提高')
  assert.deepEqual(suggestions[0].variants, ['怪物伤害提高 10%', '怪物伤害提高 30%'])
  assert.ok(CHART_AFFIX_SUGGESTIONS.every(entry => entry.affixType !== 'legendary'))
  assert.ok(CHART_AFFIX_SUGGESTIONS.every(entry => entry.value !== '航行词缀将在完成测绘后揭示'))
  assert.ok(CHART_AFFIX_SUGGESTIONS.every(entry => !entry.value.startsWith('相邻区域中找到的亡者硫磺提高')))
})

test('海图快照保留来源空标签，联想仅接受明确前后缀', () => {
  const legendaryIndex = FRAGMENT_CHART_MODS.findIndex(entry => entry.affixType === 'legendary')
  assert.equal(legendaryIndex, 81)
  assert.deepEqual(
    FRAGMENT_CHART_MODS.slice(0, legendaryIndex).reduce((counts, entry) => {
      counts[entry.affixType] = (counts[entry.affixType] || 0) + 1
      return counts
    }, {}),
    { suffix: 32, prefix: 49 }
  )
  assert.equal(FRAGMENT_CHART_MODS.slice(legendaryIndex + 1).length, 68)
  assert.ok(FRAGMENT_CHART_MODS.slice(legendaryIndex + 1).every(entry => entry.affixType === ''))

  const ambiguous = buildChartAffixSuggestions([
    { affixType: 'prefix', tags: [], lines: ['相同稳定词缀 10%'] },
    { affixType: 'suffix', tags: [], lines: ['相同稳定词缀 20%'] }
  ])
  assert.deepEqual(ambiguous, [], '跨前后缀的相同稳定文本不应生成 mixed 候选')
  assert.deepEqual(searchMapAffixSuggestions('chart', '额外被囚禁的怪物'), [])
  assert.deepEqual(searchMapAffixSuggestions('chart', '友善水母'), [])
})

test('联想搜索严格隔离地图与海图，支持关键词、示例和标签', () => {
  assert.equal(affixSuggestionsForKind('atlas'), ATLAS_MAP_AFFIX_SUGGESTIONS)
  assert.equal(affixSuggestionsForKind('chart'), CHART_AFFIX_SUGGESTIONS)
  assert.deepEqual(affixSuggestionsForKind('unknown'), [])

  assert.ok(searchMapAffixSuggestions('atlas', '物理荆棘').some(entry => entry.value === '稀有怪物带有物理荆棘'))
  assert.equal(searchMapAffixSuggestions('chart', '物理荆棘').length, 0)
  assert.ok(searchMapAffixSuggestions('chart', '80% 的几率避免元素异常状态').some(entry => entry.value.includes('避免元素异常状态')))
  assert.equal(searchMapAffixSuggestions('atlas', '80% 的几率避免元素异常状态').length, 0)
  assert.ok(searchMapAffixSuggestions('atlas', '稀有怪物').length > 0, '应可按标签搜索')
  assert.ok(searchMapAffixSuggestions('atlas', '转化为额外能量护盾').length > 0, '应可按示例文本搜索')
  assert.deepEqual(searchMapAffixSuggestions('atlas', '  '), [])
  assert.deepEqual(searchMapAffixSuggestions('unknown', '伤害'), [])
  assert.equal(searchMapAffixSuggestions('chart', '怪物', 2).length, 2)
})

test('地图黑白名单界面使用可自由编辑的分类自动完成', () => {
  const panel = readFileSync(new URL('../src/domains/map/components/MapRollingProfilePanel.vue', import.meta.url), 'utf8')
  const view = readFileSync(new URL('../src/domains/map/MapView.vue', import.meta.url), 'utf8')
  assert.equal((panel.match(/<el-autocomplete/g) || []).length, 2)
  assert.match(panel, /v-model="profile\.match\.blacklist\[index\]"/)
  assert.match(panel, /v-model="profile\.match\.whitelist\[index\]"/)
  assert.match(panel, /:fetch-suggestions="fetchSuggestions"/)
  assert.match(panel, /:trigger-on-focus="false"/)
  assert.match(panel, /searchMapAffixSuggestions\(props\.targetKind, query\)/)
  assert.match(panel, /map-affix-suggestion-popper/)
  assert.match(panel, /item\.value/)
  assert.match(panel, /item\.example/)
  assert.match(view, /:target-kind="activeKind"/)
})
