import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { parseItemInfo as _m0_parseItemInfo } from '../electron/modules/item/parser.js'
import { loadTradeCatalog as _m0_loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'
import { createPriceCheckModel as _m0_createPriceCheckModel, buildOfficialTradeQuery as _m0_buildOfficialTradeQuery } from '../electron/modules/priceCheck/query.js'
import { uniqueFlavorItem as _m0_uniqueFlavorItem } from './fixtures/uniqueFlavorItem.js'
import { parsePoedbUniqueItems as _m1_parsePoedbUniqueItems } from '../scripts/uniqueItemParser.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { readFile as _m1_readFile } from 'node:fs/promises'
import _m1_path from 'node:path'
import { fileURLToPath as _m1_fileURLToPath } from 'node:url'
import { enrichOfficialItemsWithImages as _m1_enrichOfficialItemsWithImages, enrichInternationalItemsWithImages as _m1_enrichInternationalItemsWithImages, registerUniqueItemImageProtocol as _m1_registerUniqueItemImageProtocol, matchesUniqueModifier as _m1_matchesUniqueModifier, UniqueItemImageRepository as _m1_UniqueItemImageRepository, uniqueItemImageId as _m1_uniqueItemImageId, validateUniqueItemCatalog as _m1_validateUniqueItemCatalog, validateUniqueItemRecords as _m1_validateUniqueItemRecords } from '../electron/modules/priceCheck/uniqueItemSnapshot.js'
import { resolveUnidentifiedUnique as _m1_resolveUnidentifiedUnique, sanitizePriceCheckModel as _m1_sanitizePriceCheckModel } from '../electron/modules/priceCheck/query.js'
import { generateUniqueItemSnapshot as _m1_generateUniqueItemSnapshot } from '../scripts/generateUniqueItemSnapshot.js'

// === Merged from uniqueFlavorParsing.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const parseItemInfo = _m0_parseItemInfo
  const loadTradeCatalog = _m0_loadTradeCatalog
  const createPriceCheckModel = _m0_createPriceCheckModel
  const buildOfficialTradeQuery = _m0_buildOfficialTradeQuery
  const uniqueFlavorItem = _m0_uniqueFlavorItem
const { catalog } = await loadTradeCatalog()
const body = uniqueFlavorItem.slice(0, uniqueFlavorItem.indexOf('"那群'))
const realMods = [
  '+14 最大能量护盾',
  '你被感电的持续时间延长 100%',
  '感电会反射回自己身上 — 数值不可调整',
  '感电时移动速度加快 15%',
  '感电时伤害提高 60%',
  '40% 的闪电伤害转换为混沌伤害'
]

test('完整秽生传奇文本只解析六条真实属性，查价与去除描述的输入完全一致', () => {
  for (const text of [uniqueFlavorItem, uniqueFlavorItem.replaceAll('\n', '\r\n')]) {
    const item = parseItemInfo(text)
    assert.deepEqual(item.modifiers.map(m => m.text), realMods)
    assert.deepEqual(item.implicitMods, [realMods[0]])
    assert.deepEqual(item.explicitMods, [])
    assert.deepEqual(item.uniqueModifiers, [])
    assert.equal(item.level, 83)
    assert.equal(item.isMutated, true)
    const model = createPriceCheckModel(item, catalog)
    const clean = createPriceCheckModel(parseItemInfo(body), catalog)
    assert.deepEqual(model.stats, clean.stats)
    assert.deepEqual(model.unknownStats, clean.unknownStats)
    assert.deepEqual(buildOfficialTradeQuery(model), buildOfficialTradeQuery(clean))
    assert.ok(model.stats.some(s => s.type === 'pseudo' && s.min === 14))
  }
})

test('块外描述不依赖引号、数字或传奇目录，块内未知属性仍保留', () => {
  for (const description of ['没有引号的背景故事\n第二行故事\n- 叙述者', '历经 100 年\n伤害提高 60%\n第 15 位见证者']) {
    const foulbornText = body.replace('秽生马雷格罗的染血之环', '测试未收录传奇') + description
    assert.deepEqual(parseItemInfo(foulbornText).modifiers.map(m => m.text), realMods)
    assert.throws(() => createPriceCheckModel(parseItemInfo(foulbornText), catalog), /无法识别秽生传奇/)
    // Uncatalogued ordinary uniques still exercise flavor parsing independently
    // of the stricter identity requirement for Foulborn variants.
    const text = foulbornText.replaceAll('秽生', '')
    const item = parseItemInfo(text)
    assert.deepEqual(item.modifiers.map(m => m.text), realMods)
    assert.deepEqual(item.explicitMods, [])
    const clean = createPriceCheckModel(parseItemInfo(text.slice(0, -description.length)), catalog)
    const model = createPriceCheckModel(item, catalog)
    assert.deepEqual(model.stats, clean.stats)
    assert.deepEqual(model.unknownStats, clean.unknownStats)
    const withUnknown = parseItemInfo(text + '\n--------\n{ 传奇属性 }\n测试未收录真实属性\n第二行真实属性\n--------\n后续故事')
    assert.deepEqual(withUnknown.modifiers.at(-1).lines, ['测试未收录真实属性', '第二行真实属性'])
    const unknownModel = createPriceCheckModel(withUnknown, catalog)
    for (const line of withUnknown.modifiers.at(-1).lines) {
      assert.ok(unknownModel.unknownStats.some(s => s.text === line))
    }
    assert.deepEqual(withUnknown.explicitMods, [])
  }
})

test('描述后的状态、新属性块和显式标记仍被解析', () => {
  const item = parseItemInfo(uniqueFlavorItem + `
--------
已腐化
已复制
已分裂
未鉴定
秽生
+10 最大生命 (implicit)
+11 最大生命 (crafted)
+12 最大生命 (fractured)
+13 最大生命 (enchant)
{ 传奇属性 — 伤害 }
新的无数值真实属性
另一行真实属性
--------
最后的背景描述`)
  for (const key of ['isCorrupted', 'isMirrored', 'isSplit', 'isUnidentified', 'isMutated', 'isFractured']) assert.equal(item[key], true, key)
  assert.ok(item.implicitMods.includes('+10 最大生命'))
  assert.deepEqual(item.craftedMods, ['+11 最大生命'])
  assert.ok(item.modifiers.some(m => m.type === 'fractured' && m.text === '+12 最大生命'))
  assert.ok(item.modifiers.some(m => m.type === 'enchant' && m.text === '+13 最大生命'))
  assert.deepEqual(item.modifiers.at(-1).lines, ['新的无数值真实属性', '另一行真实属性'])
  assert.deepEqual(item.explicitMods, [])
})

test('普通传奇复制及非传奇无标记属性维持既有解析', () => {
  const plain = `物品类别: 腰带
稀 有 度: 传奇
测试传奇
扣链腰带
--------
物品等级: 83
--------
+14 最大能量护盾 (implicit)
--------
感电会反射回自己身上
感电时伤害提高 60%`
  const item = parseItemInfo(plain)
  assert.deepEqual(item.explicitMods, ['感电会反射回自己身上', '感电时伤害提高 60%'])
  assert.equal(item.uniqueModifiers.length, 2)
  const rare = parseItemInfo(body.replace('传奇\n', '稀有\n') + '+20 最大生命')
  assert.deepEqual(rare.explicitMods, ['+20 最大生命'])
})
})()

// === Merged from uniqueItemSnapshot.test.js ===
await (async () => {
  const parsePoedbUniqueItems = _m1_parsePoedbUniqueItems
  const test = _m1_test
  const assert = _m1_assert
  const readFile = _m1_readFile
  const path = _m1_path
  const fileURLToPath = _m1_fileURLToPath
  const enrichOfficialItemsWithImages = _m1_enrichOfficialItemsWithImages
  const enrichInternationalItemsWithImages = _m1_enrichInternationalItemsWithImages
  const registerUniqueItemImageProtocol = _m1_registerUniqueItemImageProtocol
  const matchesUniqueModifier = _m1_matchesUniqueModifier
  const UniqueItemImageRepository = _m1_UniqueItemImageRepository
  const uniqueItemImageId = _m1_uniqueItemImageId
  const validateUniqueItemCatalog = _m1_validateUniqueItemCatalog
  const validateUniqueItemRecords = _m1_validateUniqueItemRecords
  const resolveUnidentifiedUnique = _m1_resolveUnidentifiedUnique
  const sanitizePriceCheckModel = _m1_sanitizePriceCheckModel
  const generateUniqueItemSnapshot = _m1_generateUniqueItemSnapshot
const dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureRoot = path.join(dirname, 'fixtures', 'unique-items')

test('PoEDB 传奇页面解析中文名称、底材和稳定图片身份', async () => {
  const html = await readFile(path.join(fixtureRoot, 'unique-items.html'), 'utf8')
  const records = validateUniqueItemRecords(parsePoedbUniqueItems(html), { requireSentinels: false })
  assert.deepEqual(records.map(({ name, baseType }) => ({ name, baseType })), [
    { name: '测试传奇甲', baseType: '测试戒指' },
    { name: '测试传奇乙', baseType: '测试戒指' }
  ])
  assert.deepEqual(records.map(record => record.englishSlug), ['Test_Alpha', 'Test_Beta'])
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

test('国际服图片只按唯一英文身份增强，冲突图片和无映射名称仍使用占位', () => {
  const first = uniqueItemImageId('https://cdn.poedb.tw/image/Art/First.webp')
  const second = uniqueItemImageId('https://cdn.poedb.tw/image/Art/Second.webp')
  const snapshot = { items: [
    { name: '名称甲', englishSlug: 'Shared_Name', imageId: first },
    { name: '名称乙', englishSlug: 'Shared_Name', imageId: second },
    { name: '当前名称', englishSlug: 'Current_Name', imageId: first },
    { name: '同图旧底材', englishSlug: 'Current_Name', imageId: first },
    { name: '阿兹里圣徽', englishSlug: 'Atziris_Foible', imageId: second }
  ] }
  const enhanced = enrichInternationalItemsWithImages([
    { name: 'Shared Name', baseType: 'Ring', unique: true },
    { name: 'Unknown Name', baseType: 'Ring', unique: true },
    { name: 'Current Name', baseType: 'Ring', unique: true, uniqueSnapshotCovered: true, uniqueModifierMatchers: ['中文属性'] },
    { name: "Atziri's Foible", baseType: 'Paua Amulet', unique: true }
  ], snapshot)
  assert.deepEqual(enhanced.map(item => item.imageId), ['placeholder', 'placeholder', first, second])
  assert.ok(enhanced.every(item => !item.uniqueSnapshotCovered && !item.uniqueModifierMatchers))
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
  const [main, overlay, settings, accountField, indexHtml] = await Promise.all([
    readFile(path.join(dirname, '..', 'electron', 'main.js'), 'utf8'),
    readFile(path.join(dirname, '..', 'src', 'domains', 'priceCheck', 'PriceCheckOverlayView.vue'), 'utf8'),
    readFile(path.join(dirname, '..', 'src', 'domains', 'settings', 'SettingsView.vue'), 'utf8'),
    readFile(path.join(dirname, '..', 'src', 'components', 'configuration', 'AccountLeagueConfigurationField.vue'), 'utf8'),
    readFile(path.join(dirname, '..', 'index.html'), 'utf8')
  ])
  assert.match(main, /registerUniqueItemImageProtocol/)
  assert.ok(main.indexOf('await uniqueItemImages.load()') < main.indexOf('new PriceCheckService({'))
  assert.match(main, /tradeCatalogBundle\.catalog\.items = enrichOfficialItemsWithImages/)
  assert.match(main, /scheme: 'price-check-image'/)
  assert.match(indexHtml, /img-src[^;]*price-check-image:/)
  assert.match(overlay, /candidate\.imageUrl/)
  assert.match(overlay, /candidate\.legacy/)
  assert.match(overlay, /gameText\('遗产'\)/)
  assert.match(overlay, /width:\s*48px;\s*height:\s*48px;\s*object-fit:\s*contain/)
  assert.match(settings, /AccountLeagueConfigurationField show-token/)
  assert.match(accountField, /验证成功后窗口会自动关闭/)
  assert.match(accountField, /我已完成登录/)
})
})()
