import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { CraftingDataRepository } from '../electron/modules/crafting/dataRepository.js'
import { modifierCanSpawn, validateBaseVariant } from '../electron/modules/crafting/variantRules.js'

const builtinRoot = path.resolve('electron/assets/crafting-data')

test('内置快照可离线查询底材、分类和合法词缀', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  const status = await repository.initialize()
  assert.ok(status.counts.bases > 0)
  const categories = repository.listCategories()
  assert.ok(categories.length > 0)
  const claws = categories.find((category) => category.name === '单手武器')?.children.find((item) => item.itemClass === 'Claw')
  assert.equal(claws.name, '爪')
  assert.ok(claws.count > 0)
  const clawBases = repository.searchBases({ category: '单手武器', itemClass: 'Claw', pageSize: 100 })
  assert.ok(clawBases.items.some((base) => base.name === '拳钉'))
  assert.ok(clawBases.items.every((base) => base.category === '单手武器' && base.itemClass === 'Claw'))
  const bases = repository.searchBases({ query: '', pageSize: 1 })
  assert.equal(bases.items.length, 1)
  const modifiers = repository.searchModifiers({ baseId: bases.items[0].id, itemLevel: 100, variant: { kind: 'normal' } })
  assert.ok(Array.isArray(modifiers.items))
  assert.ok(status.counts.bases >= 900)
  assert.ok(status.counts.modifiers >= 1900)
  assert.equal(status.sources.length, new Set(status.sources.map((source) => source.id)).size)
})

test('护甲属性、深渊类型和星团尺寸使用隔离的词缀候选池', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  await repository.initialize()
  const dataset = repository.getDataset()
  const queryIds = (name) => {
    const base = dataset.bases.find((entry) => entry.name === name)
    assert.ok(base, `缺少底材 ${name}`)
    return new Set(dataset.modifiers.filter((modifier) => modifierCanSpawn(modifier, base, 100, { kind: 'normal' })).map((entry) => entry.id))
  }
  const iron = dataset.bases.find((entry) => entry.name === '粗铁盔')
  const leather = dataset.bases.find((entry) => entry.name === '皮帽')
  assert.ok(iron.tags.includes('str_armour'))
  assert.ok(leather.tags.includes('dex_armour'))
  assert.notDeepEqual(queryIds('粗铁盔'), queryIds('皮帽'))
  assert.notDeepEqual(queryIds('凶残之凝珠宝'), queryIds('锐利之凝珠宝'))
  assert.notDeepEqual(queryIds('大型星团珠宝'), queryIds('小型星团珠宝'))
})

test('活动指针越界或损坏时回退内置快照', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-repo-'))
  await writeFile(path.join(root, 'active.json'), JSON.stringify({ directory: '..\\outside' }))
  const repository = new CraftingDataRepository({ builtinRoot, userDataRoot: root })
  const status = await repository.initialize()
  assert.equal(status.source, 'builtin')
  assert.match(status.warning, /越界/)
})

test('特殊底材状态互斥并要求必要参数', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  await repository.initialize()
  const base = repository.getDataset().bases.find((entry) => entry.allowedVariants.includes('fractured'))
  assert.equal(validateBaseVariant(base, { kind: 'fractured' }).valid, false)
  assert.equal(validateBaseVariant(base, { kind: 'fractured', fracturedTierId: 'tier:test' }).valid, true)
  assert.equal(validateBaseVariant(base, { kind: 'normal', influences: ['shaper'] }).valid, false)
})
