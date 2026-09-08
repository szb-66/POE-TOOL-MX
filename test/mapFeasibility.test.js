import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { analyzeMapFeasibility, expandDescription, normalizeConditions } from '../src/domains/map/mapFeasibility.js'
import { createFeasibilityRunner } from '../src/domains/map/mapFeasibilityRunner.js'
import { parseModsView, joinChartRows } from '../scripts/generateMapFeasibilityData.js'

function mod(id, side, stats = {}, groups = [id], lines = [id]) {
  return { id, side, groups, level: 1, lines, outcomes: [{ lines, stats }] }
}
const filler = () => [mod('p0', 'prefix'), mod('p1', 'prefix'), mod('p2', 'prefix'), mod('s0', 'suffix'), mod('s1', 'suffix'), mod('s2', 'suffix')]
function pool(mods, kind = 'atlas', id = 'base') { return { id, kind, mods, complete: true, counts: [4, 5, 6], maxLevel: 100, prefixLimit: 3, suffixLimit: 3 } }
function catalog(pools, complete = true) { return { pools, coverage: Object.fromEntries(['atlas', 'chart', 'heist'].map(k => [k, { complete }])) } }
function run(mods, match, extra = {}) { return analyzeMapFeasibility({ kind: 'atlas', profile: { match }, catalog: catalog([pool(mods)]), ...extra }) }
const need = (key, value) => ({ mandatoryStats: { [key]: { enabled: true, value } } })

test('blacklist attribution requires a witness without blacklist', () => {
  const result = run([mod('唯一数量', 'prefix', { quantity: 30 }), ...filler()], { ...need('quantity', 30), blacklist: ['唯一数量'] })
  assert.equal(result.status, 'blacklist-impossible')
  assert.equal(result.upperBounds.quantity, 0)
})
test('originally impossible conditions are not blamed on blacklist', () => {
  assert.equal(run(filler(), { ...need('quantity', 999), blacklist: ['无关'] }).status, 'conditions-impossible')
})
test('mutually exclusive individual maxima cannot be combined', () => {
  const mods = [mod('q', 'prefix', { quantity: 30 }, ['exclusive']), mod('r', 'prefix', { rarity: 30 }, ['exclusive']), ...filler()]
  assert.equal(run(mods, need('quantity', 30)).status, 'possible')
  assert.equal(run(mods, need('rarity', 30)).status, 'possible')
  assert.equal(run(mods, { mandatoryStats: { quantity: { enabled: true, value: 30 }, rarity: { enabled: true, value: 30 } } }).status, 'conditions-impossible')
})
test('prefix capacity and compound modifiers', () => {
  const mods = ['quantity', 'rarity', 'packSize', 'moreMaps'].map(k => mod(k, 'prefix', { [k]: 1 }))
  const match = { mandatoryStats: Object.fromEntries(['quantity', 'rarity', 'packSize', 'moreMaps'].map(k => [k, { enabled: true, value: 1 }])) }
  assert.equal(run([...mods, ...filler()], match).status, 'conditions-impossible')
  assert.equal(run([mod('compound', 'prefix', { quantity: 1, rarity: 1, packSize: 1, moreMaps: 1 }), ...filler()], match).status, 'possible')
})
test('another pool may satisfy but pools cannot mix', () => {
  const pools = [pool([mod('q', 'prefix', { quantity: 10 }), ...filler()], 'atlas', 'low'), pool([mod('r', 'prefix', { rarity: 10 }), ...filler()], 'atlas', 'high')]
  const match = { mandatoryStats: { quantity: { enabled: true, value: 10 }, rarity: { enabled: true, value: 10 } } }
  assert.equal(run([], match, { catalog: catalog(pools) }).status, 'conditions-impossible')
  assert.equal(run([], need('rarity', 10), { catalog: catalog(pools) }).witness.poolId, 'high')
})
test('optional N and duplicate mandatory/optional match runtime', () => {
  const conditions = normalizeConditions('atlas', { mandatoryStats: { quantity: { enabled: true, value: 5 } }, optionalStats: { quantity: { enabled: true, value: 10 }, rarity: { enabled: true, value: 5 } }, selectedCount: 2 })
  assert.deepEqual(conditions.mandatory, [{ key: 'quantity', value: 10 }])
  assert.deepEqual(conditions.optional, [{ key: 'rarity', value: 5 }])
  assert.equal(run([mod('q', 'prefix', { quantity: 10, rarity: 5 }), ...filler()], { optionalStats: { quantity: { enabled: true, value: 10 }, rarity: { enabled: true, value: 5 } }, selectedCount: 2 }).status, 'possible')
})
test('whitelist is mandatory only in heist; blacklist always wins', () => {
  for (const kind of ['atlas', 'chart', 'heist']) {
    const result = analyzeMapFeasibility({ kind, profile: { match: { whitelist: ['absent'] } }, catalog: catalog([pool(filler(), kind)]) })
    assert.equal(result.status, kind === 'heist' ? 'conditions-impossible' : 'possible')
  }
  const data = catalog([pool([mod('needle', 'prefix'), ...filler()], 'heist')])
  assert.equal(analyzeMapFeasibility({ kind: 'heist', profile: { match: { blacklist: ['needle'], whitelist: ['needle'] } }, catalog: data }).status, 'blacklist-impossible')
})
test('blank whitelist and nonempty whitespace blacklist preserve runtime semantics', () => {
  assert.deepEqual(normalizeConditions('heist', { whitelist: [' ', ''], blacklist: [' ', ''] }).whitelist, [])
  assert.deepEqual(normalizeConditions('atlas', { blacklist: [' ', ''] }).blacklist, [' '])
})
test('numeric blacklist excludes only matching rolls', () => {
  const m = { id: 'range', side: 'prefix', groups: ['range'], level: 1, lines: ['伤害提高 (10—12)%'], stats: [{ id: 'map_item_drop_quantity_+%', min: 30, max: 30 }] }
  assert.equal(run([m, ...filler()], { ...need('quantity', 30), blacklist: ['提高 12%'] }).status, 'possible')
  assert.equal(run([m, ...filler()], { ...need('quantity', 30), blacklist: ['提高 10%', '提高 11%', '提高 12%'] }).status, 'blacklist-impossible')
})
test('explicit correlated outcomes cannot independently maximize stats', () => {
  const m = mod('correlated', 'prefix')
  m.outcomes = [{ lines: ['低'], stats: { quantity: 10, rarity: 1 } }, { lines: ['高'], stats: { quantity: 1, rarity: 10 } }]
  assert.equal(run([m, ...filler()], { mandatoryStats: { quantity: { enabled: true, value: 10 }, rarity: { enabled: true, value: 10 } } }).status, 'conditions-impossible')
})
test('unknown data, correlations and search exhaustion never prove impossibility', () => {
  assert.equal(run(filler(), need('quantity', 10), { catalog: catalog([pool(filler())], false) }).status, 'unknown')
  assert.equal(run(filler(), {}, { maxNodes: 0 }).status, 'unknown')
  assert.equal(run([], {}).status, 'unknown')
  assert.equal(run(filler(), need('quantity', NaN)).status, 'unknown')
  assert.equal(expandDescription(['伤害 (1—3)% 与速度 (4—5)%']), null)
  assert.deepEqual(expandDescription(['伤害 (-3—-1)%']), [['伤害 -3%'], ['伤害 -2%'], ['伤害 -1%']])
})
test('unknown pool does not erase a witness in another pool', () => {
  const data = catalog([{ ...pool([], 'atlas', 'unknown'), complete: false }, pool(filler())], false)
  assert.equal(run([], {}, { catalog: data }).status, 'possible')
})
test('exalted requires six and vaal cannot rescue pre-vaal failure', () => {
  const mods = filler().slice(0, 4)
  assert.equal(run(mods, {}).status, 'possible')
  assert.equal(run(mods, {}, { profile: { exalted: { enabled: true }, vaal: { enabled: true } } }).status, 'conditions-impossible')
})
test('level filtering and multiple mutual exclusion groups', () => {
  const m = { ...mod('high', 'prefix', { quantity: 10 }), level: 101 }
  assert.equal(run([m, ...filler()], need('quantity', 10)).status, 'conditions-impossible')
  assert.equal(run([mod('q', 'prefix', { quantity: 10 }, ['a', 'b']), mod('r', 'suffix', { rarity: 10 }, ['b']), ...filler()], { mandatoryStats: { quantity: { enabled: true, value: 10 }, rarity: { enabled: true, value: 10 } } }).status, 'conditions-impossible')
})
test('runner terminates obsolete tasks and discards late messages on changes/unmount', () => {
  const jobs = [], workers = [], results = []
  const runner = createFeasibilityRunner({ schedule: fn => { jobs.push(fn); return jobs.length }, cancel: () => {}, onPending: () => {}, onResult: x => results.push(x), createWorker: () => {
    const worker = { postMessage(data) { this.input = data }, terminate() { this.terminated = true } }
    workers.push(worker); return worker
  } })
  runner.update({ kind: 'atlas' }); jobs.shift()()
  runner.update({ kind: 'chart' }); jobs.shift()()
  assert.equal(workers[0].terminated, true)
  workers[0].onmessage({ data: { id: workers[0].input.id, result: 'old' } })
  workers[1].onmessage({ data: { id: workers[1].input.id, result: 'current' } })
  assert.deepEqual(results, ['current'])
  runner.update({ kind: 'heist' }); jobs.shift()(); runner.dispose()
  workers[2].onmessage({ data: { id: workers[2].input.id, result: 'disposed' } })
  assert.deepEqual(results, ['current'])
})
test('runner creation failure is a visible unknown result', () => {
  let job, result
  const runner = createFeasibilityRunner({ schedule: fn => { job = fn }, cancel: () => {}, onPending: () => {}, onResult: value => { result = value }, createWorker: () => { throw Error('unavailable') } })
  runner.update({}); job()
  assert.equal(result.status, 'unknown')
  runner.dispose()
})
test('source parser fails closed and chart identities must be unique', () => {
  assert.throws(() => parseModsView('none', 5))
  const rows = [{ level: 1, side: 'prefix', lines: ['Monsters have 1 Life'] }]
  assert.throws(() => joinChartRows(rows, rows, {}))
  const m = { domain: 'deepwater_chart', generation_type: 'prefix', required_level: 1, text: 'Monsters have 1 Life' }
  assert.throws(() => joinChartRows(rows, rows, { a: m, b: m }))
})
test('live snapshot has structured identities and positive witnesses for all tabs', () => {
  const data = JSON.parse(readFileSync(new URL('../src/data/mapFeasibilityData.json', import.meta.url)))
  assert.equal(data.pools.length, 7)
  assert.ok(data.pools.every(p => !p.baseStatVariants))
  assert.equal(data.coverage.atlas.quality, undefined)
  assert.equal(data.coverage.chart.bases.length, 4)
  assert.equal(data.coverage.chart.nonAffixes.length, 69)
  assert.equal(data.coverage.atlas.conditionalAffixes.length, 52)
  assert.ok(data.coverage.atlas.conditionalAffixes.every(m => m.spawnWeights.some(w => w.tag.startsWith('has_uber_map_'))))
  assert.equal(analyzeMapFeasibility({ kind: 'atlas', profile: { match: need('moreCurrency', 100) }, catalog: data }).status, 'possible')
  for (const p of data.pools) {
    assert.ok(p.mods.length > 40)
    assert.equal(new Set(p.mods.map(m => m.id)).size, p.mods.length)
    assert.ok(p.mods.every(m => m.groups.length && m.stats.length && m.lines.length))
  }
  for (const kind of ['atlas', 'chart', 'heist']) {
    assert.equal(analyzeMapFeasibility({ kind, profile: { match: need('quantity', 80) }, catalog: data }).status, 'possible')
    assert.equal(analyzeMapFeasibility({ kind, profile: { match: need('quantity', 100000) }, catalog: data }).status, kind === 'heist' ? 'conditions-impossible' : 'unknown')
  }
})


test('quality variants cannot provide a feasibility witness', () => {
  for (const kind of ['atlas', 'chart', 'heist']) {
    const p = { ...pool(filler(), kind), baseStatVariants: [{ id: 'old-quality', stats: { quantity: 10 } }] }
    const result = analyzeMapFeasibility({ kind, profile: { match: need('quantity', 10) }, catalog: catalog([p]) })
    assert.equal(result.status, 'conditions-impossible')
    assert.equal(result.upperBounds.quantity, 0)
  }
})

test('inert added tags permit witnesses; consumed tags remain unresolved', () => {
  const tagged = { ...mod('tagged', 'prefix', { quantity: 20 }), addsTags: ['dependency'] }
  assert.equal(run([tagged, ...filler()], need('quantity', 20)).status, 'possible')
  const dependent = { ...mod('dependent', 'suffix'), spawnWeights: [{ tag: 'dependency', weight: 1 }] }
  assert.equal(run([tagged, dependent, ...filler()], need('quantity', 20)).status, 'unknown')
})
