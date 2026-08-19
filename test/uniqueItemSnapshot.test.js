import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  enrichOfficialItemsWithImages,
  parsePoedbUniqueItems,
  registerUniqueItemImageProtocol,
  matchesUniqueModifier,
  UniqueItemImageRepository,
  uniqueItemImageId,
  validateUniqueItemCatalog,
  validateUniqueItemRecords
} from '../electron/modules/priceCheck/uniqueItemSnapshot.js'
import {
  resolveUnidentifiedUnique,
  sanitizePriceCheckModel
} from '../electron/modules/priceCheck/query.js'
import { generateUniqueItemSnapshot } from '../scripts/generateUniqueItemSnapshot.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureRoot = path.join(dirname, 'fixtures', 'unique-items')

test('PoEDB 传奇页面解析中文名称、底材和稳定图片身份', async () => {
  const html = await readFile(path.join(fixtureRoot, 'unique-items.html'), 'utf8')
  const records = validateUniqueItemRecords(parsePoedbUniqueItems(html), { requireSentinels: false })
  assert.deepEqual(records.map(({ name, baseType }) => ({ name, baseType })), [
    { name: '测试传奇甲', baseType: '测试戒指' },
    { name: '测试传奇乙', baseType: '测试戒指' }
  ])
  assert.equal(records[0].imageId, uniqueItemImageId(records[0].imageUrl))
  assert.match(records[0].imageId, /^unique-[a-f0-9]{20}$/)
  assert.deepEqual(records[0].modifierMatchers, ['# 最大生命', '获得 1 级测试技能'])
  assert.equal(matchesUniqueModifier('+17 最大生命', records[0].modifierMatchers), true)
  assert.equal(matchesUniqueModifier('获得 1 级测试技能', records[0].modifierMatchers), true)
  assert.equal(matchesUniqueModifier('这是属性解释，不是独立属性', records[0].modifierMatchers), false)
})

test('传奇快照拒绝重复身份、缺图和缺少正式哨兵', () => {
  const valid = {
    name: '测试传奇',
    baseType: '测试戒指',
    modifierMatchers: [],
    imageUrl: 'https://cdn.poedb.tw/image/Art/Test.webp',
    imageId: uniqueItemImageId('https://cdn.poedb.tw/image/Art/Test.webp')
  }
  assert.throws(
    () => validateUniqueItemRecords([valid, { ...valid }], { requireSentinels: false }),
    /重复身份/
  )
  assert.throws(
    () => validateUniqueItemRecords([{ ...valid, imageUrl: '' }], { requireSentinels: false }),
    /缺少可信图片/
  )
  assert.throws(
    () => validateUniqueItemRecords([{ ...valid, modifierMatchers: null }], { requireSentinels: false }),
    /matcher 无效/
  )
  assert.throws(() => validateUniqueItemRecords([valid]), /缺少哨兵/)
  assert.throws(
    () => validateUniqueItemCatalog({ schemaVersion: 1, game: 'poe1', locale: 'zh-CN', patch: 'test' }, { requireSentinels: false }),
    /schema 不兼容/
  )
})

test('官方候选全集只由官方目录决定，本地快照补图或占位', () => {
  const imageId = uniqueItemImageId('https://cdn.poedb.tw/image/Art/Test.webp')
  const catalog = {
    patch: 'test',
    items: [{ name: '测试传奇甲', baseType: '测试戒指', modifierMatchers: ['# 最大生命'], imageId }]
  }
  const official = enrichOfficialItemsWithImages([
    { name: '测试传奇甲', baseType: '测试戒指', unique: true },
    { name: '新赛季传奇', baseType: '测试戒指', unique: true }
  ], catalog)
  assert.equal(official.length, 2)
  assert.equal(official[0].imageId, imageId)
  assert.equal(official[0].legacy, false)
  assert.equal(official[0].uniqueSnapshotCovered, true)
  assert.deepEqual(official[0].uniqueModifierMatchers, ['# 最大生命'])
  assert.equal(official[1].imageId, 'placeholder')
  assert.equal(official[1].legacy, true)
  assert.equal(official[1].uniqueSnapshotCovered, undefined)

  const fallback = enrichOfficialItemsWithImages([{ ...official[0], unique: true }], {
    patch: 'fallback',
    items: []
  })[0]
  assert.equal(fallback.uniqueSnapshotCovered, undefined)
  assert.equal(fallback.uniqueModifierMatchers, undefined)

  const resolved = resolveUnidentifiedUnique({
    item: { rarity: '传奇', unidentified: true, baseType: '测试戒指' },
    identity: { name: '', type: '测试戒指' }
  }, { items: official })
  assert.equal(resolved.identityResolution.candidates[0].imageUrl, `price-check-image://snapshot/${imageId}`)
  assert.equal(resolved.identityResolution.candidates[1].imageUrl, 'price-check-image://snapshot/placeholder')
})

test('官方通用地图底材按同名唯一阶级快照增强且拒绝歧义', () => {
  const exactImageId = uniqueItemImageId('https://cdn.poedb.tw/image/Art/Exact.webp')
  const mapImageId = uniqueItemImageId('https://cdn.poedb.tw/image/Art/Map.webp')
  const catalog = {
    patch: 'test',
    items: [
      { name: '精确地图', baseType: '地图', modifierMatchers: ['精确属性'], imageId: exactImageId },
      { name: '精确地图', baseType: '地图（1 阶）', modifierMatchers: ['阶级属性'], imageId: mapImageId },
      { name: '唯一地图', baseType: '地图（1 阶）', modifierMatchers: ['地图属性 #'], imageId: mapImageId },
      { name: '歧义地图', baseType: '地图（1 阶）', modifierMatchers: ['旧属性'], imageId: mapImageId },
      { name: '歧义地图', baseType: '地图（16 阶）', modifierMatchers: ['新属性'], imageId: exactImageId }
    ]
  }
  const official = enrichOfficialItemsWithImages([
    { name: '精确地图', baseType: '地图', discriminator: 'map', category: 'map', unique: true },
    { name: '唯一地图', baseType: '地图', discriminator: 'map', category: 'map', unique: true },
    { name: '歧义地图', baseType: '地图', discriminator: 'map', category: 'map', unique: true },
    { name: '唯一地图', baseType: '其他底材', category: 'map', unique: true }
  ], catalog)

  assert.deepEqual(official[0].uniqueModifierMatchers, ['精确属性'])
  assert.deepEqual(official[1].uniqueModifierMatchers, ['地图属性 #'])
  assert.equal(official[1].imageId, mapImageId)
  assert.equal(official[2].uniqueSnapshotCovered, undefined)
  assert.equal(official[3].uniqueSnapshotCovered, undefined)
})

test('模型清理忽略任意候选 URL并只按合法图片 ID重建', () => {
  const imageId = uniqueItemImageId('https://cdn.poedb.tw/image/Art/Test.webp')
  const model = sanitizePriceCheckModel({
    item: { category: '生命药剂', rarity: '传奇', unidentified: true },
    identity: { name: '', type: '测试戒指' },
    identityResolution: {
      required: true,
      candidates: [
        { key: 'a', name: '甲', baseType: '测试戒指', legacy: true, imageId, imageUrl: 'file:///C:/secret.txt' },
        { key: 'b', name: '乙', baseType: '测试戒指', legacy: false, imageId: '../../secret', imageUrl: 'https://attacker.example/x' }
      ]
    }
  })
  assert.equal(model.identityResolution.candidates[0].imageUrl, `price-check-image://snapshot/${imageId}`)
  assert.equal(model.identityResolution.candidates[0].legacy, true)
  assert.equal(model.identityResolution.candidates[1].imageId, 'placeholder')
  assert.equal(model.identityResolution.candidates[1].legacy, false)
  assert.equal(model.identity.category, 'flask')
  assert.equal(model.item.unidentified, true)
  assert.equal(model.facts.identified, false)
  assert.equal(JSON.stringify(model).includes('attacker.example'), false)
  assert.equal(JSON.stringify(model).includes('secret.txt'), false)
})

test('传奇图片仓库和协议拒绝未知 ID、路径越界与错误主机', async () => {
  const repository = new UniqueItemImageRepository(fixtureRoot)
  repository.catalog = {
    images: {
      'unique-11111111111111111111': 'images/test-alpha.webp',
      'unique-22222222222222222222': '../outside.webp'
    }
  }
  assert.match(repository.imageInfo('unique-11111111111111111111').file, /test-alpha\.webp$/)
  assert.equal(repository.imageInfo('unique-22222222222222222222'), null)
  assert.equal(repository.imageInfo('../../secret'), null)

  let handler
  registerUniqueItemImageProtocol({
    protocol: { handle: (_scheme, value) => { handler = value } },
    net: { fetch: async (url) => new Response(url) },
    repository
  })
  assert.equal((await handler({ url: 'price-check-image://other/unique-11111111111111111111' })).status, 400)
  assert.equal((await handler({ url: 'price-check-image://snapshot/unknown' })).status, 404)
  assert.equal((await handler({ url: 'price-check-image://snapshot/unique-11111111111111111111' })).status, 200)
})

test('传奇快照生成器可使用固定网页和图片夹具稳定构建', async () => {
  const first = await generateUniqueItemSnapshot(['--fixture'])
  const second = await generateUniqueItemSnapshot(['--fixture'])
  assert.deepEqual(first, { records: 2, images: 2 })
  assert.deepEqual(second, first)
})

test('正式传奇目录可加载哨兵图片且主进程和浮层接入本地协议', async () => {
  const assetsRoot = path.join(dirname, '..', 'electron', 'assets', 'unique-items')
  const repository = new UniqueItemImageRepository(assetsRoot)
  const catalog = await repository.load()
  for (const name of ['猎首', '法师之血']) {
    const item = catalog.items.find((entry) => entry.name === name)
    assert.ok(item, `缺少 ${name}`)
    assert.ok(repository.imageInfo(item.imageId))
  }
  const [currentItem, legacyItem] = enrichOfficialItemsWithImages([
    { name: '阿兹里之权', baseType: '赤红珠宝', unique: true },
    { name: '脆弱的繁华', baseType: '赤红珠宝', unique: true }
  ], catalog)
  assert.equal(currentItem.legacy, false)
  assert.notEqual(currentItem.imageId, 'placeholder')
  assert.equal(legacyItem.legacy, true)
  assert.equal(legacyItem.imageId, 'placeholder')
  const [main, overlay, settings, indexHtml] = await Promise.all([
    readFile(path.join(dirname, '..', 'electron', 'main.js'), 'utf8'),
    readFile(path.join(dirname, '..', 'src', 'domains', 'priceCheck', 'PriceCheckOverlayView.vue'), 'utf8'),
    readFile(path.join(dirname, '..', 'src', 'domains', 'settings', 'SettingsView.vue'), 'utf8'),
    readFile(path.join(dirname, '..', 'index.html'), 'utf8')
  ])
  assert.match(main, /registerUniqueItemImageProtocol/)
  assert.ok(main.indexOf('await uniqueItemImages.load()') < main.indexOf('new PriceCheckService({'))
  assert.match(main, /tradeCatalogBundle\.catalog\.items = enrichOfficialItemsWithImages/)
  assert.match(main, /scheme: 'price-check-image'/)
  assert.match(indexHtml, /img-src[^;]*price-check-image:/)
  assert.match(overlay, /candidate\.imageUrl/)
  assert.match(overlay, /candidate\.legacy/)
  assert.match(overlay, />遗产</)
  assert.match(overlay, /width:\s*48px;\s*height:\s*48px;\s*object-fit:\s*contain/)
  assert.match(settings, /验证成功后窗口会自动关闭/)
  assert.match(settings, /我已完成登录/)
})
