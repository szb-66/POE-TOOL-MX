import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { gunzip } from 'node:zlib'
import { promisify } from 'node:util'
import path from 'node:path'
import { parsePoedbModifiers } from '../electron/modules/crafting/poedbParser.js'
import { CraftingDataRepository } from '../electron/modules/crafting/dataRepository.js'

const gunzipAsync = promisify(gunzip)
const snapshotRoot = path.resolve('electron/assets/crafting-raw/3.28')

async function rawPage(manifest, id) {
  const entry = manifest.sources.find((source) => source.id === id)
  assert.ok(entry, `缺少 ${id}`)
  assert.equal(entry.category, 'modifier')
  assert.equal(entry.status, 200)
  assert.match(entry.sha256, /^[a-f0-9]{64}$/)
  const html = (await gunzipAsync(await readFile(path.join(snapshotRoot, entry.file)))).toString('utf8')
  assert.equal(createHash('sha256').update(html).digest('hex'), entry.sha256)
  return html
}

test('3.28 原始快照包含四类药剂来源并能解析三类词缀载荷', async () => {
  const manifest = JSON.parse(await readFile(path.join(snapshotRoot, 'manifest.json'), 'utf8'))
  for (const profile of ['Life_Flasks', 'Mana_Flasks', 'Utility_Flasks']) {
    const html = await rawPage(manifest, `modifier:${profile}`)
    const modifiers = parsePoedbModifiers(html, { profileId: profile })
    assert.ok(modifiers.some((entry) => entry.affixType === 'prefix'))
    assert.ok(modifiers.some((entry) => entry.affixType === 'suffix'))
    assert.ok(modifiers.every((entry) => entry.source === 'natural'))
    assert.ok(modifiers.every((entry) => entry.tiers.every((tier) => tier.tier > 0 && tier.requiredLevel > 0 && tier.text)))
  }
  const hybrid = await rawPage(manifest, 'modifier:Hybrid_Flasks')
  assert.match(hybrid, /复合药剂\s*物品\s*\/\s*\d+/)
  assert.equal(parsePoedbModifiers(hybrid, { profileId: 'Hybrid_Flasks' }).length, 0)
})

test('全库联想返回药剂与珠宝且药剂不进入做装底材', async () => {
  const repository = new CraftingDataRepository()
  await repository.initialize()
  const flask = repository.searchAffixSuggestions({ query: '回复速度', limit: 100 }).items
  assert.ok(flask.some((entry) => /药剂/.test(entry.applicableLabel)))
  assert.ok(flask.some((entry) => entry.tiers.length > 1))
  const jewel = repository.searchAffixSuggestions({ query: '最大生命', limit: 100 }).items
  assert.ok(jewel.some((entry) => /赤红珠宝|翠绿珠宝|钴蓝珠宝|三相珠宝/.test(entry.applicableLabel)))
  assert.ok(jewel.some((entry) => /之凝珠宝/.test(entry.applicableLabel)))
  assert.ok(jewel.some((entry) => /星团珠宝/.test(entry.applicableLabel)))
  assert.equal(repository.getDataset().bases.some((base) => /Flask/.test(base.itemClass)), false)
})
