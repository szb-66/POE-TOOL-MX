import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { CraftingDataRepository } from '../electron/modules/crafting/dataRepository.js'
import { getServer } from '../shared/serverMode.js'
import { generateInternationalCraftingData } from '../scripts/generateInternationalCraftingData.js'
import { parseBaseRequirements, parsePoedbBases, inferCraftEffectKind } from '../electron/modules/crafting/poedbParser.js'

test('国际服当前制作快照具有独立来源、英文底材词缀和完整古灵阶级', async () => {
  const repository = new CraftingDataRepository({ server: getServer('international') })
  const status = await repository.initialize()
  assert.equal(status.server, 'international')
  assert.equal(status.locale, 'en')
  assert.equal(status.patch, '3.30.0')
  assert.ok(status.sources.length >= 80)
  assert.ok(status.sources.every(source => source.url.startsWith('https://poedb.tw/us/') && /^[a-f0-9]{64}$/.test(source.sha256)))
  const dataset = repository.getDataset()
  const ironHat = dataset.bases.find(base => base.name === 'Iron Hat')
  assert.deepEqual(ironHat.requirements, { level: 1, strength: 9, dexterity: 0, intelligence: 0 })
  assert.ok(ironHat.tags.includes('str_armour'))
  assert.ok(dataset.bases.some(base => base.name === 'Divine Life Flask'))
  assert.ok(repository.searchAffixSuggestions({ query: 'maximum Life', limit: 5 }).total > 0)
  assert.ok(dataset.crafts.some(craft => craft.effectKind === 'lock_prefixes_partial'))
  const partialLock = dataset.crafts.find(craft => craft.effectKind === 'lock_prefixes_partial')
  assert.ok(partialLock.itemClasses.includes('单手近战'))
  assert.ok(partialLock.itemClasses.includes('戒指'))
  const fullArmourLock = dataset.crafts.find(craft => craft.effectKind === 'lock_prefixes' && craft.itemClasses.includes('护甲'))
  assert.deepEqual(fullArmourLock.cost.map(cost => [cost.resourceName, cost.amount]), [['Divine Orb', 4], ['Blessed Orb', 4]])
  assert.ok(dataset.crafts.some(craft => craft.effectKind === 'reforge_tag' && craft.params.tag === 'life'))
  assert.ok(dataset.crafts.some(craft => craft.effectKind === 'reforge_tag' && craft.params.tag === 'defences'))
  assert.ok(dataset.crafts.every(craft => !['reforge_tag', 'remove_add_tag'].includes(craft.effectKind) || craft.params.tag))
  assert.ok(dataset.crafts.some(craft => craft.effectKind === 'convert_resistance' && craft.params.fromTag === 'cold' && craft.params.toTag === 'fire'))
  assert.ok(dataset.crafts.some(craft => craft.effectKind === 'quality_enchant' && craft.params.itemScope === 'melee_weapon'))
  assert.ok(dataset.eldritchImplicitFamilies.every(family => family.tiers.length === 6))
})

test('国际服活动数据若指向中文快照必须回退本服内置，不能串服', async t => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'international-crafting-'))
  t.after(() => rm(temporary, { recursive: true, force: true }))
  await mkdir(path.join(temporary, 'wrong-server'))
  const chinese = await readFile('electron/assets/crafting-data/dataset.json', 'utf8')
  await writeFile(path.join(temporary, 'wrong-server/dataset.json'), chinese)
  await writeFile(path.join(temporary, 'active.json'), JSON.stringify({ directory: 'wrong-server' }))
  const repository = new CraftingDataRepository({ server: getServer('international'), userDataRoot: temporary })
  const status = await repository.initialize()
  assert.equal(status.source, 'builtin')
  assert.equal(status.server, 'international')
  assert.match(status.warning, /服务器或语言/)
})

test('英文来源解析保留需求、属性和部分锁工艺语义', () => {
  assert.deepEqual(parseBaseRequirements('Requires Level 68, 89 Str, 76 Dex, 12 Int'), { level: 68, strength: 89, dexterity: 76, intelligence: 12 })
  const html = '<div class="card"><div class="card-header">Body Armours Item / 1</div><div class="col"><a class="whiteitem BodyArmour" href="/us/Example"><img src="image.webp"></a><a class="whiteitem">Example</a><span class="requirements">Requires Level 68, 100 Str</span><span class="property">Armour: 1200</span></div></div>'
  const [base] = parsePoedbBases(html)
  assert.equal(base.sourceId, 'Example')
  assert.equal(base.requiredLevel, 68)
  assert.ok(base.tags.includes('str_armour'))
  assert.equal(inferCraftEffectKind('1 Prefix Modifiers cannot be changed', 'bench'), 'lock_prefixes_partial')
  assert.equal(inferCraftEffectKind('Prefix Modifiers cannot be changed', 'bench'), 'lock_prefixes')
})

test('生成器拒绝无版本或国服输出，验证失败前不写活动数据', async () => {
  await assert.rejects(generateInternationalCraftingData(), /显式指定/)
  await assert.rejects(generateInternationalCraftingData({ patch: '3.30.0', output: path.resolve('electron/assets/crafting-data') }), /禁止覆盖国服/)
})

test('英文来源刷新失败保留已有活动文件', async t => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'international-crafting-refresh-'))
  t.after(() => rm(temporary, { recursive: true, force: true }))
  const output = path.join(temporary, 'international')
  await mkdir(output)
  const active = path.join(output, 'dataset.json')
  await writeFile(active, 'existing-active-dataset')
  await assert.rejects(generateInternationalCraftingData({
    patch: '3.30.0', refresh: true, output, cacheRoot: path.join(temporary, 'cache'),
    fetchImpl: async () => new Response('unavailable', { status: 503 })
  }), /HTTP 503/)
  assert.equal(await readFile(active, 'utf8'), 'existing-active-dataset')
})
