import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  createCoreCurrencyCrafts,
  extractModsViewPayload,
  inferCraftEffectKind,
  parsePoedbBases,
  parsePoedbCrafts,
  parsePoedbModifiers
} from '../electron/modules/crafting/poedbParser.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name) => readFileSync(path.join(dirname, 'fixtures', 'crafting', name), 'utf8')

test('解析底材、普通/势力词缀和阶级权重', () => {
  const bases = parsePoedbBases(fixture('items.html'), { category: '首饰与珠宝' })
  const modifiers = parsePoedbModifiers(fixture('modifiers.html'))
  assert.equal(bases[0].name, '珊瑚戒指')
  assert.equal(bases[1].allowedVariants.includes('influenced'), false)
  assert.deepEqual(bases[1].maxAffixes, { prefix: 2, suffix: 2 })
  assert.equal(modifiers[0].tiers[0].requiredLevel, 81)
  assert.equal(modifiers[0].tiers[0].values[0].max, 79)
  assert.deepEqual(modifiers[1].influences, ['shaper'])
})

test('解析工艺台、花园和核心通货语义', () => {
  const bench = parsePoedbCrafts(fixture('bench.html'), { provider: 'bench' })
  const harvest = parsePoedbCrafts(fixture('harvest.html'), { provider: 'harvest' })
  assert.equal(bench[1].effectKind, 'lock_prefixes')
  assert.equal(bench[0].cost[0].amount, 4)
  assert.equal(harvest[0].effectKind, 'reforge_tag')
  assert.equal(harvest[1].cost.length, 2)
  assert.equal(createCoreCurrencyCrafts().length, 10)
  assert.equal(inferCraftEffectKind('后缀无法被变更', 'bench'), 'lock_suffixes')
})

test('ModsView JSON 边界解析不执行脚本', () => {
  const html = '<script>new ModsView({"gen":{"1":"前缀"},"normal":[]}); alert("ignored")</script>'
  assert.deepEqual(extractModsViewPayload(html).normal, [])
  assert.throws(() => extractModsViewPayload('<script>new ModsView({"normal":[])</script>'), /未闭合|Unexpected/)
})
