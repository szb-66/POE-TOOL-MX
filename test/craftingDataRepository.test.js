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
  assert.equal(status.patch, '3.29')
  assert.equal(status.league, 'Curse of the Allflame')
  assert.equal(status.stale, false)
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
  assert.ok(status.sources.some((source) => source.url === 'https://www.poewiki.net/wiki/Version_history'))
  const ironHat = repository.getDataset().bases.find((base) => base.name === '粗铁盔')
  assert.deepEqual(ironHat.requirements, { level: 1, strength: 9, dexterity: 0, intelligence: 0 })
  assert.equal(ironHat.qualityType, 'armour')
  assert.equal(ironHat.socketLimit, 4)
  assert.ok(ironHat.baseStats.some((entry) => entry.label === '护甲'))
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

test('不受支持的 schema 快照回退到内置当前版本且不改写来源', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-schema-unsupported-'))
  const unsupportedDir = path.join(root, 'version-unsupported')
  await mkdir(unsupportedDir)
  const unsupported = JSON.parse(await readFile(path.join(builtinRoot, 'dataset.json'), 'utf8'))
  unsupported.manifest.schemaVersion = 4
  unsupported.manifest.checksum = 'test'
  await writeFile(path.join(unsupportedDir, 'dataset.json'), JSON.stringify(unsupported))
  await writeFile(path.join(root, 'active.json'), JSON.stringify({ directory: 'version-unsupported' }))
  const repository = new CraftingDataRepository({ builtinRoot, userDataRoot: root })
  const status = await repository.initialize()
  assert.equal(status.source, 'builtin')
  assert.match(status.warning, /schema 4/)
  assert.equal(JSON.parse(await readFile(path.join(unsupportedDir, 'dataset.json'), 'utf8')).manifest.schemaVersion, 4)
})

test('特殊底材状态互斥并要求必要参数', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  await repository.initialize()
  const base = repository.getDataset().bases.find((entry) => entry.allowedVariants.includes('fractured'))
  assert.equal(validateBaseVariant(base, { kind: 'fractured' }).valid, false)
  assert.equal(validateBaseVariant(base, { kind: 'fractured', fracturedTierId: 'tier:test' }).valid, true)
  assert.equal(validateBaseVariant(base, { kind: 'normal', influences: ['shaper'] }).valid, false)
})

test('三级词缀目录固定返回十二种来源并审计缺失覆盖', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  await repository.initialize()
  const base = repository.getDataset().bases.find((entry) => entry.modifierProfileId === 'Wands')
  const result = repository.searchModifierCatalog({ baseId: base.id, itemLevel: 80 })
  assert.equal(result.groups.length, 12)
  assert.deepEqual(result.groups.map((entry) => entry.label), ['基础', '塑界者', '裂界者', '圣战', '救赎者', '狩猎者', '督军', '地心探险', '穿越', '隐匿', '工艺台', '精华'])
  const baseGroup = result.groups[0]
  assert.equal(baseGroup.covered, true)
  assert.ok([...baseGroup.prefix, ...baseGroup.suffix].every((family) => family.subitemCount >= family.availableCount && family.tiers.every((tier) => 'modifierName' in tier && 'sourceDomain' in tier)))
  const essenceGroup = result.groups.find((entry) => entry.id === 'essence')
  const essenceTiers = [...essenceGroup.prefix, ...essenceGroup.suffix].flatMap((family) => family.tiers)
  assert.ok(essenceTiers.some((tier) => tier.available && tier.sourceItem?.id === 'Deafening_Essence_of_Woe'))
  assert.ok(essenceTiers.every((tier) => !/[<>]/.test(tier.name) && tier.sourceItem?.name && !/[<>]/.test(tier.sourceItem.name)))
  assert.ok(essenceTiers.every((tier) => tier.tier === tier.sourceItem.tier && tier.name.startsWith(`T${tier.sourceItem.tier} `)))
  assert.ok(result.groups.slice(1, 7).every((entry) => entry.covered), '六种势力词缀都应在法杖目录中有覆盖')
  const missing = result.groups.find((entry) => !entry.covered)
  if (missing) assert.equal(missing.coverageMessage, '当前数据快照未覆盖此来源')
})

test('召集法杖保留全部技能石词缀并以全局池计算概率', async () => {
  const repository = new CraftingDataRepository({ builtinRoot })
  await repository.initialize()
  const base = repository.getDataset().bases.find((entry) => entry.modifierProfileId === 'Convoking_Wand')
  const catalog = repository.searchModifierCatalog({ baseId: base.id, itemLevel: 100 })
  const families = catalog.groups.flatMap((group) => [...group.prefix, ...group.suffix])
  const family = families.find((entry) => entry.name.includes('所有火焰法术主动技能石等级') && entry.sourceDomain === 'base')
  assert.ok(family)
  assert.equal(family.entries.length, 6)
  assert.ok(family.entries.some((entry) => entry.name.includes('召唤生物主动技能石等级')))
  assert.equal(family.globalTotalWeight, 100206)
  assert.equal(catalog.groups.find((entry) => entry.id === 'base').suffix[0].globalTotalWeight, 113342)
  assert.equal(family.probability, family.totalWeight / family.globalTotalWeight)
  assert.ok(family.tiers.every((tier) => tier.probability === tier.weight / family.globalTotalWeight))

  const searched = repository.searchModifierCatalog({ baseId: base.id, itemLevel: 60, query: '召唤生物主动技能石等级' })
  const searchedFamily = searched.groups.flatMap((group) => [...group.prefix, ...group.suffix])
    .find((entry) => entry.familyId === family.familyId && entry.sourceDomain === family.sourceDomain)
  assert.equal(searchedFamily.globalTotalWeight, family.globalTotalWeight, '搜索与物品等级不得改变 POEDB 页面全局分母')
  assert.equal(searchedFamily.totalWeight, family.totalWeight)
})
