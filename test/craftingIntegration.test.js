import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { CraftingDataRepository, DEFAULT_BUILTIN_ROOT } from '../electron/modules/crafting/dataRepository.js'
import { CraftingDataUpdater } from '../electron/modules/crafting/updater.js'
import { CraftingTaskManager } from '../electron/modules/crafting/taskManager.js'
import { CraftingService } from '../electron/modules/crafting/service.js'
import { CRAFTING_SCHEMA_VERSION } from '../electron/modules/crafting/model.js'

const fixtureRoot = path.resolve('test/fixtures/crafting')

async function fixtureFetch(url) {
  if (url.includes('Crafting_Bench')) return new Response(await readFile(path.join(fixtureRoot, 'bench.html'), 'utf8'))
  if (url.includes('Horticrafting')) return new Response(await readFile(path.join(fixtureRoot, 'harvest.html'), 'utf8'))
  if (url.includes('Eldritch_implicit')) return new Response(await readFile(path.join(fixtureRoot, 'eldritch.html'), 'utf8'))
  if (url.includes('cdn.poedb.tw')) throw new Error('纯文字更新不应请求图片 CDN')
  const items = await readFile(path.join(fixtureRoot, 'items.html'), 'utf8')
  const modifiers = await readFile(path.join(fixtureRoot, 'modifiers.html'), 'utf8')
  return new Response(`${items}${modifiers}`)
}

test('手动更新只请求文字数据，并在核心页面失败时保留活动快照', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-update-'))
  const repository = new CraftingDataRepository({ builtinRoot: DEFAULT_BUILTIN_ROOT, userDataRoot: root })
  await repository.initialize()
  const updater = new CraftingDataUpdater({ repository, storageRoot: root, fetchImpl: fixtureFetch })
  const activated = await updater.update()
  assert.equal(activated.source, 'updated')
  assert.equal(activated.counts.bases, 2)
  const activeImages = await readdir(path.join(root, JSON.parse(await readFile(path.join(root, 'active.json'), 'utf8')).directory, 'images'))
  assert.deepEqual(activeImages, ['placeholder.svg'])
  assert.ok(repository.getDataset().bases.every((base) => base.imageId === 'placeholder'))
  assert.equal(repository.getDataset().crafts.filter((craft) => craft.provider === 'fossil').length, 29)
  assert.equal(repository.getDataset().crafts.filter((craft) => craft.provider === 'harvest').length, 2)
  assert.equal(repository.getDataset().crafts.find((craft) => craft.provider === 'harvest').params.tag, 'life')
  assert.equal(repository.getDataset().eldritchImplicitFamilies.length, 2)
  assert.ok(repository.getDataset().manifest.sources.some((source) => source.url === 'https://poedb.tw/cn/Fossil'))
  assert.ok(repository.getDataset().manifest.sources.some((source) => source.url === 'https://poedb.tw/cn/Horticrafting'))
  assert.ok(repository.getDataset().manifest.sources.some((source) => source.url === 'https://poedb.tw/cn/Eldritch_implicit'))
  const activeBefore = JSON.parse(await readFile(path.join(root, 'active.json'), 'utf8'))

  const failingUpdater = new CraftingDataUpdater({
    repository, storageRoot: root,
    fetchImpl: async (url, options) => url.endsWith('/Claws') ? new Response('bad', { status: 503 }) : fixtureFetch(url, options)
  })
  await assert.rejects(failingUpdater.update(), /Claws.*HTTP 503/)
  const activeAfter = JSON.parse(await readFile(path.join(root, 'active.json'), 'utf8'))
  assert.deepEqual(activeAfter, activeBefore)
  assert.equal((await readdir(root)).some((name) => name.startsWith('.staging-')), false)
  await rm(root, { recursive: true, force: true })
})

const workerDataset = {
  manifest: { schemaVersion: CRAFTING_SCHEMA_VERSION, game: 'poe1', locale: 'zh-CN', league: 'Test', patch: 'worker', generatedAt: '2026-07-21T00:00:00Z', checksum: 'test', sources: [] },
  bases: [{ id: 'base:ring', sourceId: 'Ring', name: '测试戒指', category: '首饰', itemClass: '戒指', modifierProfileId: 'Ring', imageId: 'placeholder', requiredLevel: 1, requirements: { level: 1, strength: 0, dexterity: 0, intelligence: 0 }, qualityType: 'none', socketLimit: 0, baseStats: [], implicitModifiers: [], tags: ['ring'], maxAffixes: { prefix: 3, suffix: 3 }, allowedVariants: ['normal'] }],
  modifierFamilies: [
    { id: 'family:life', modifierProfileId: 'Ring', groupId: 'life', name: '生命', affixType: 'prefix', source: 'natural', influences: [], entries: [{ id: 'mod:life', sourceId: 'Life', modifierProfileId: 'Ring', groupId: 'life', name: '生命', affixType: 'prefix', source: 'natural', tags: ['life'], spawnTags: ['ring'], influences: [], tiers: [{ id: 'mod:life:t1', tier: 1, name: 'T1', requiredLevel: 1, weight: 1, text: '+10 最大生命', values: [] }] }] },
    { id: 'family:mana', modifierProfileId: 'Ring', groupId: 'mana', name: '魔力', affixType: 'prefix', source: 'natural', influences: [], entries: [{ id: 'mod:mana', sourceId: 'Mana', modifierProfileId: 'Ring', groupId: 'mana', name: '魔力', affixType: 'prefix', source: 'natural', tags: ['mana'], spawnTags: ['ring'], influences: [], tiers: [{ id: 'mod:mana:t1', tier: 1, name: 'T1', requiredLevel: 1, weight: 9, text: '+10 最大魔力', values: [] }] }] }
  ],
  crafts: [], images: { placeholder: 'images/placeholder.svg' }
}

test('Worker 按任务 ID 发布快速/精算结果并可清理', async () => {
  const manager = new CraftingTaskManager()
  const events = []
  const complete = new Promise((resolve, reject) => {
    manager.start({
      request: { baseId: 'base:ring', itemLevel: 84, variant: { kind: 'normal' }, targets: [{ goalId: 'mod:life', minTierId: 'mod:life:t1' }] },
      dataset: workerDataset,
      priceMap: { 'currency:transmutation': 0.1, 'currency:alteration': 0.2, 'currency:chaos': 1, 'currency:alchemy': 0.2, 'currency:scouring': 0.5, 'currency:exalted': 10 },
      priceTime: 'test', options: { quickSamples: 100, refineMinimum: 100, refineMaximum: 100 },
      onEvent: (message) => {
        events.push(message)
        if (message.type === 'complete') resolve()
        if (message.type === 'error') reject(new Error(message.error))
      }
    })
  })
  await complete
  assert.ok(events.some((entry) => entry.type === 'result' && entry.result.phase === 'quick'))
  assert.ok(events.some((entry) => entry.type === 'result' && entry.result.phase === 'refined'))
  assert.equal(manager.tasks.size, 0)
})

test('取消任务立即发布 cancelled 且丢弃后续 Worker 事件', async () => {
  const manager = new CraftingTaskManager()
  const events = []
  const taskId = manager.start({
    request: { baseId: 'base:ring', itemLevel: 84, variant: { kind: 'normal' }, targets: [{ goalId: 'mod:life', minTierId: 'mod:life:t1' }] },
    dataset: workerDataset, priceMap: {}, priceTime: 'test', options: { quickSamples: 500000 },
    onEvent: (message) => events.push(message)
  })
  assert.equal(manager.cancel(taskId), true)
  await new Promise((resolve) => setTimeout(resolve, 350))
  assert.deepEqual(events.map((entry) => entry.type), ['cancelled'])
  assert.equal(manager.tasks.size, 0)
})

test('CraftingService 跨层返回加密目录并完成通货与揭露状态序列化', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-veiled-service-'))
  const service = new CraftingService({ storageRoot: root, protocol: { handle() {} }, net: { fetch() {} }, fetchImpl: fixtureFetch })
  await service.initialize()
  const base = service.repository.getDataset().bases.find((entry) => entry.itemClass === 'Wand' && entry.allowedVariants.includes('normal'))
  let result = service.createManualSession({ baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 991 })
  result = service.applyManualCurrency(result.session, 'currency:alchemy')
  result = service.applyManualVeiledCraft(result.session, 'veiled:chaos')
  assert.equal(result.veiled.pending.affix.veiled, true)
  assert.equal(result.veiled.options.length, 3)
  const option = result.veiled.options[0]
  result = service.selectManualVeiledOption(result.session, option.modifierId, option.tierId)
  assert.equal(result.veiled.pending, null)
  assert.equal([...result.session.state.prefixes, ...result.session.state.suffixes].some((affix) => affix.source === 'veiled'), true)
  service.cleanup()
  await rm(root, { recursive: true, force: true })
})

test('CraftingService 跨层返回野兽目录并保持希内科拉预览一致', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-beast-service-'))
  const service = new CraftingService({ storageRoot: root, protocol: { handle() {} }, net: { fetch() {} }, fetchImpl: fixtureFetch })
  await service.initialize()
  const base = service.repository.getDataset().bases.find((entry) => entry.itemClass === 'Wand' && entry.allowedVariants.includes('normal'))
  let result = service.createManualSession({ baseId: base.id, itemLevel: 100, variant: { kind: 'normal' }, seed: 992 })
  assert.equal(result.beastcraft.total, 27)
  result = service.applyManualCurrency(result.session, 'currency:transmutation')
  result = service.applyManualBeastcraft(result.session, 'apply-hinekora-lock', { beastLevel: 83 })
  assert.equal(result.session.foreseeing, true)
  const preview = service.previewManualCurrency(result.session, 'currency:alteration')
  result = service.applyManualCurrency(result.session, 'currency:alteration')
  assert.deepEqual(result.session.state, preview.state)
  assert.equal(result.session.foreseeing, false)
  service.cleanup()
  await rm(root, { recursive: true, force: true })
})
