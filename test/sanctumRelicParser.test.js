import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { parseSanctumRelic, matchSanctumModifier } from '../electron/modules/sanctum/relicParser.js'
import { mergeSanctumTextScan } from '../electron/modules/sanctum/relicScan.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { solveSanctumLoadouts } from '../electron/modules/sanctum/loadout.js'
import { sanctumRelicWeight } from '../electron/modules/sanctum/relicScoring.js'
import { createSanctumStrategy, applySanctumEffects } from '../shared/sanctum.js'
import { applySanctumCatalogReviews, relicEntryDigest, parseSanctumRelicSources } from '../scripts/sanctum/relicCatalogParser.js'

const catalog = JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/catalog.json', import.meta.url), 'utf8'))
// Parser fixtures reproduce the source's published strings. They are not game
// captures and do not count as CN live clipboard/scanner acceptance evidence.
const text = (name = '坚韧的 香炉遗物', mods = '增加 +22 最大坚毅\n禁域地图上揭晓了 2 个额外的房间', more = '') =>
  `物品类别: 遗物\n稀有度: 魔法\n${name}\n--------\n物品等级: 85\n--------\n${mods}\n--------\n在每轮禁域开启时将此物品放置在遗物祭坛上\n${more}`
const uniqueText = id => {
  const item = catalog.entries.find(item => item.id === id), base = catalog.entries.find(base => base.id === item.baseId)
  return `物品类别: 圣物\n稀有度: 传奇\n${item.name}\n${base.name}\n--------\n物品等级: 85\n--------\n${item.descriptions.join('\n')}\n--------\n传说的风味文本`
}

test('七种底材固定朝向、词缀数值与高级复制范围解析', () => {
  assert.deepEqual(catalog.entries.filter(entry => entry.kind === 'base').map(entry => [entry.width, entry.height]),
    [[1, 2], [1, 3], [1, 4], [2, 1], [2, 2], [3, 1], [4, 1]])
  const item = parseSanctumRelic(text(), catalog)
  assert.equal(item.status, 'matched')
  assert.equal(item.width, 1); assert.equal(item.height, 2)
  assert.deepEqual(item.modifiers.map(mod => mod.value), [22, 2])
  const advanced = parseSanctumRelic(text(undefined, '{ 前缀属性 "坚韧的" (等级: 1) }\n增加 +22(21—25) 最大坚毅'), catalog)
  assert.equal(advanced.modifiers[0].value, 22)
  assert.equal(parseSanctumRelic(text().replace('香炉遗物', 'Censer Relic'), catalog).status, 'matched')
})

test('错误职业、未知底材、越界数值和歧义不能静默匹配', () => {
  assert.equal(parseSanctumRelic(text().replace('物品类别: 遗物', '物品类别: 法杖'), catalog).reason, 'NOT_SANCTUM_RELIC')
  assert.equal(parseSanctumRelic(text().replace('香炉遗物', '未知遗物'), catalog).status, 'unknown')
  assert.equal(matchSanctumModifier(catalog, 'base:SanctumRelic1x2', '增加 +999 最大坚毅').status, 'unknown')
  const ambiguous = structuredClone(catalog)
  ambiguous.entries.push({ ...ambiguous.entries.find(entry => entry.kind === 'modifier'), id: 'duplicate' })
  assert.equal(matchSanctumModifier(ambiguous, 'base:SanctumRelic1x2', '增加 +22 最大坚毅').reason, 'AMBIGUOUS_MODIFIER')
  const invalidated = structuredClone(catalog)
  invalidated.entries.find(entry => entry.id === 'base:SanctumRelic1x2').applicability = 'unverified'
  assert.equal(parseSanctumRelic(text(), invalidated).reason, 'BASE_UNCONFIRMED')
})

test('未知词缀保留缺口，风味文本不成为词缀，腐化基底和显式同类词缀可共存', () => {
  const unknown = parseSanctumRelic(text(undefined, '增加 +22 最大坚毅\n无法理解的词缀'), catalog)
  assert.equal(unknown.status, 'matched')
  assert.equal(unknown.scoringComplete, false)
  assert.ok(unknown.effects.some(effect => effect.rawText === '无法理解的词缀' && effect.status === 'unknown'))
  const item = parseSanctumRelic(text('圣歌遗物', '坚毅恢复提高 17%\n--------\n坚毅恢复提高 10% (implicit)', '已腐化'), catalog)
  assert.equal(item.status, 'matched')
  assert.deepEqual(item.modifiers.map(modifier => modifier.value), [17, 10])
  assert.deepEqual(item.modifiers.map(modifier => modifier.implicit), [false, true])
  assert.equal(parseSanctumRelic(text(undefined, '增加 +22 最大坚毅\n增加 +22 最大坚毅'), catalog).status, 'unknown')
})

test('楼层启迪词缀按已识别规则处理，不进入未知效果或评分缺口', () => {
  const item = parseSanctumRelic(text('圣歌遗物', '每个楼层开始时获得 5 层启迪'), catalog)
  assert.equal(item.status, 'matched')
  assert.equal(item.scoringComplete, true)
  assert.equal(item.modifiers[0].rule, 'inspirationOnFloor')
  assert.equal(item.modifiers[0].scoreChannel, 'inspiration')
  const rules = applySanctumEffects(item.effects)
  assert.ok(!rules.unknown.includes(item.modifiers[0].rawText))
  assert.equal(rules.unknown.length, 0)
})

test('传奇禁止恢复与启迪规则独立解析，缺失或变化不冒充完整条目', () => {
  const item = parseSanctumRelic(uniqueText('unique:The_Gilded_Chalice'), catalog)
  assert.equal(item.status, 'matched')
  assert.ok(item.effects.some(effect => effect.rule === 'cannotRecover'))
  assert.ok(item.effects.some(effect => effect.rule === 'cannotGainInspiration'))
  assert.equal(item.scoringComplete, false)
  assert.equal(parseSanctumRelic(uniqueText('unique:The_Gilded_Chalice').replace('不能恢复坚毅', '已变化的限制'), catalog).status, 'unknown')
  assert.equal(parseSanctumRelic(uniqueText('unique:The_Original_Scripture'), catalog).minAreaLevel, 83)
})

test('扫描文本按位置保留独立实例，未知起点和部分失败不能删除旧库存', () => {
  const scan = { regionId: 'locker', width: 2, height: 2, observations: [0, 1].map(x => ({ x, y: 0, status: 'copied', originConfirmed: true, rawText: text() })) }
  const initial = mergeSanctumTextScan([], scan, catalog)
  assert.equal(initial.complete, true)
  assert.equal(initial.inventory.length, 2)
  assert.notEqual(initial.inventory[0].id, initial.inventory[1].id)
  const partial = mergeSanctumTextScan(initial.inventory, { ...scan, observations: [{ x: 0, y: 1, status: 'copied', originConfirmed: false, rawText: text() }] }, catalog)
  assert.equal(partial.complete, false)
  assert.equal(partial.inventory.length, 2)
  assert.equal(partial.inventory.find(item => item.x === 0).status, 'unknown')
  assert.equal(partial.inventory.find(item => item.x === 1).status, 'matched')
  assert.throws(() => mergeSanctumTextScan([], { ...scan, observations: [{ ...scan.observations[0], y: 1 }] }, catalog), /超出/)
})

test('完整祭坛扫描才确认装备和解锁格，局部扫描不沿用确认', async () => {
  const service = new SanctumService({ catalog })
  service.setEnabled(true)
  service.state.altar = { ...service.state.altar, width: 2, height: 2 }
  const scan = { regionId: 'altar', width: 2, height: 2, observations: [
    { x: 0, y: 0, status: 'copied', originConfirmed: true, rawText: text() },
    { x: 1, y: 0, status: 'locked' }, { x: 1, y: 1, status: 'empty' }
  ] }
  service.acceptRelicScan(scan)
  assert.equal(service.state.altar.confirmed, true)
  assert.deepEqual(service.state.altar.unlocked, [0, 2, 3])
  assert.equal(service.state.altar.items.length, 1)
  service.acceptRelicScan({ ...scan, observations: [{ x: 0, y: 0, status: 'unknown' }] })
  assert.equal(service.state.altar.confirmed, false)
  await service.shutdown()
})

test('内容核对指纹或赛季变化后自动撤回支持状态', () => {
  const entry = { id: 'base:x', name: '测试', aliases: [], kind: 'base', width: 1, height: 2, descriptions: [], applicability: 'unverified' }
  const data = { patch: '3.29', entries: [entry] }
  const reviews = { patch: '3.29', entries: { 'base:x': { digest: relicEntryDigest(entry), evidence: ['test'], ruleSupport: 'footprint' } } }
  assert.equal(applySanctumCatalogReviews(data, reviews).entries[0].applicability, 'current')
  entry.width = 2
  assert.equal(applySanctumCatalogReviews(data, reviews).entries[0].applicability, 'unverified')
  entry.width = 1
  assert.equal(applySanctumCatalogReviews({ ...data, patch: '3.30' }, reviews).entries[0].applicability, 'unverified')
  const previouslyReviewed = applySanctumCatalogReviews(data, reviews)
  previouslyReviewed.entries[0].height = 4
  assert.equal(applySanctumCatalogReviews(previouslyReviewed, reviews).entries[0].applicability, 'unverified')
})

test('来源解析核对元数据与列表，跨底材聚合词缀而不丢失数值范围', () => {
  const bases = catalog.entries.filter(entry => entry.kind === 'base')
  const sources = { Relics: { fetchedAt: '2026-09-09', html: `<div id="遗物物品">${bases.map(base => `<div class="flex-grow-1"><a class="Relic" href="${base.sourceId}" data-hover="${base.id.slice(5)}">${base.name}</a></div>`).join('')}</div>
    <div id="遗物传奇"><div class="flex-grow-1"><a class="UniqueItem" href="/cn/Test"><span class="uniqueName">测试传奇</span><span class="uniqueTypeLine">香炉遗物</span></a><div class="explicitMod">不能恢复坚毅</div></div></div>` } }
  for (const base of bases) sources[base.sourceId] = { fetchedAt: '2026-09-09', html: `<table><tbody><tr><td>Type</td><td>Metadata/Items/Relics/${base.id.slice(5)}</td></tr><tr><td>BaseType</td><td>${base.name}</td></tr></tbody></table>
    <div id="圣物Mods"><table><tbody><tr><td>测试</td><td>1</td><td>前缀</td><td><span class="explicitMod">坚毅恢复提高 <span class="mod-value">(8—10)</span>%</span></td></tr></tbody></table></div>` }
  const result = parseSanctumRelicSources(sources)
  assert.equal(result.filter(entry => entry.kind === 'base').length, 7)
  const modifier = result.find(entry => entry.kind === 'modifier')
  assert.equal(modifier.baseIds.length, 7)
  assert.deepEqual(modifier.variants[0].ranges, [[8, 10]])
  assert.ok(result.every(entry => entry.applicability === 'unverified'))
  sources.Censer_Relic.html = sources.Censer_Relic.html.replace('SanctumRelic1x2', 'SanctumRelic2x1')
  assert.throws(() => parseSanctumRelicSources(sources), /不一致/)
})

test('传奇区域等级硬约束与恢复、启迪分项抑制', () => {
  const unique = { ...parseSanctumRelic(uniqueText('unique:The_Power_and_the_Promise'), catalog), id: 'unique', score: 0 }
  const normal = { id: 'normal', status: 'matched', width: 1, height: 1, score: 4, recoveryScore: 10, inspirationScore: 20 }
  const input = { width: 4, height: 1, unlocked: [0, 1, 2, 3], items: [unique, normal], selectedUniques: ['unique'], fixed: ['normal'] }
  assert.equal(solveSanctumLoadouts(input).status, 'blocked')
  assert.equal(solveSanctumLoadouts({ ...input, areaLevel: 79 }).status, 'blocked')
  const result = solveSanctumLoadouts({ ...input, areaLevel: 80 })
  assert.equal(result.candidates[0].score, 4)
  assert.equal(result.candidates[0].breakdown.recovery, 0)
  assert.equal(result.candidates[0].breakdown.inspiration, 0)
})

test('搭配默认继承三套策略的相对偏好，显式零权重不被覆盖', () => {
  const modifier = { id: 'q', name: '怪物掉落的遗物数量提高 #%', scoreChannel: 'preference' }
  assert.ok(sanctumRelicWeight(modifier, createSanctumStrategy('relic')) > sanctumRelicWeight(modifier, createSanctumStrategy('survival')))
  const strategy = createSanctumStrategy('relic')
  strategy.relicWeights.q = 0
  assert.equal(sanctumRelicWeight(modifier, strategy), 0)
  const recovery = { id: 'recover', name: '完成一个房间后恢复 # 坚毅', scoreChannel: 'recovery' }
  assert.ok(sanctumRelicWeight(recovery, createSanctumStrategy('survival')) > sanctumRelicWeight(recovery, createSanctumStrategy('currency')))
})
