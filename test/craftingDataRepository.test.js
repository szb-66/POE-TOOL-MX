import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
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
  const claws = categories.find((category) => category.name === '单手武器')?.children.find((item) => item.itemClass === 'Claws')
  assert.equal(claws.name, '爪')
  assert.ok(claws.count > 0)
  const clawBases = repository.searchBases({ category: '单手武器', itemClass: 'Claws', pageSize: 100 })
  assert.ok(clawBases.items.some((base) => base.name === '拳钉'))
  assert.ok(clawBases.items.every((base) => base.category === '单手武器' && base.itemClass === 'Claw'))
  const bases = repository.searchBases({ query: '', pageSize: 1 })
  assert.equal(bases.items.length, 1)
  const modifiers = repository.searchModifiers({ baseId: bases.items[0].id, itemLevel: 100, variant: { kind: 'normal' } })
  assert.ok(Array.isArray(modifiers.items))
  assert.ok(status.counts.bases >= 900)
  assert.ok(status.counts.modifiers > 0)
  assert.ok(status.counts.modifierEntries >= 1900)
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

test('手套展示六种中文属性分类，法杖共享词缀保留等级不足记录', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  await repository.initialize()
  assert.equal(repository.getDataset().modifierFamilies.some((family) => family.name === '该装备附加'), false)
  assert.ok(repository.getDataset().modifierFamilies.some((family) => family.name === '附加基础火焰伤害'))
  const armour = repository.listCategories().find((entry) => entry.name === '护甲')
  const gloves = armour?.children?.find((entry) => entry.name === '手套')
  assert.deepEqual(new Set(gloves.children.map((entry) => entry.name)), new Set(['力量', '敏捷', '智慧', '力量敏捷', '力量智慧', '敏捷智慧']))

  const wand = repository.getDataset().bases.find((entry) => entry.modifierProfileId === 'Wands')
  const result = repository.searchModifiers({ baseId: wand.id, itemLevel: 80, variant: { kind: 'normal' }, affixType: 'prefix', pageSize: 100 })
  const casterDamage = result.items.find((family) => family.groupId === 'WeaponCasterDamagePrefix' && family.entries.some((entry) => entry.name.includes('法术伤害')))
  assert.equal(casterDamage.entries.length, 4)
  assert.deepEqual(new Set(casterDamage.displayTags.map((tag) => tag.label)), new Set(['伤害', '元素', '施法', '火焰', '冰霜', '闪电']))
  assert.equal(casterDamage.subitemCount, 32)
  assert.ok(casterDamage.entries.flatMap((entry) => entry.tiers).some((tier) => tier.requiredLevel === 84 && tier.available === false))
  assert.equal(casterDamage.totalWeight, casterDamage.entries.flatMap((entry) => entry.tiers).filter((tier) => tier.available).reduce((sum, tier) => sum + tier.weight, 0))
})

test('活动指针越界或损坏时回退内置快照', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-repo-'))
  await writeFile(path.join(root, 'active.json'), JSON.stringify({ directory: '..\\outside' }))
  const repository = new CraftingDataRepository({ builtinRoot, userDataRoot: root })
  const status = await repository.initialize()
  assert.equal(status.source, 'builtin')
  assert.match(status.warning, /越界/)
})

test('schema v2 活动快照回退内置 v3 且保留旧目录', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-schema-v1-'))
  const legacyDir = path.join(root, 'version-old')
  await mkdir(legacyDir)
  const legacy = JSON.parse(await readFile(path.join(builtinRoot, 'dataset.json'), 'utf8'))
  legacy.manifest.schemaVersion = 2
  legacy.manifest.checksum = 'test'
  await writeFile(path.join(legacyDir, 'dataset.json'), JSON.stringify(legacy))
  await writeFile(path.join(root, 'active.json'), JSON.stringify({ directory: 'version-old' }))
  const repository = new CraftingDataRepository({ builtinRoot, userDataRoot: root })
  const status = await repository.initialize()
  assert.equal(status.source, 'builtin')
  assert.match(status.warning, /schema 2/)
  assert.equal(JSON.parse(await readFile(path.join(legacyDir, 'dataset.json'), 'utf8')).manifest.schemaVersion, 2)
})

test('特殊底材状态互斥并要求必要参数', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  await repository.initialize()
  const base = repository.getDataset().bases.find((entry) => entry.allowedVariants.includes('fractured'))
  assert.equal(validateBaseVariant(base, { kind: 'fractured' }).valid, false)
  assert.equal(validateBaseVariant(base, { kind: 'fractured', fracturedTierId: 'tier:test' }).valid, true)
  assert.equal(validateBaseVariant(base, { kind: 'normal', influences: ['shaper'] }).valid, false)
})
