import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { inflateSync as _m0_inflateSync } from 'node:zlib'
import { load as _m0_load } from 'cheerio'
import { convertBuild as _m0_convertBuild } from '../electron/modules/pobExport/converter.js'
import { convertInWorker as _m0_convertInWorker } from '../electron/modules/pobExport/workerClient.js'
import { PobExportService as _m0_PobExportService } from '../electron/modules/pobExport/service.js'
import { requestPoeCnJson as _m0_requestPoeCnJson } from '../electron/modules/chaosRecipe/http.js'
import { buildFixture as _m0_buildFixture } from './fixtures/pobExport.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { readFileSync as _m1_readFileSync } from 'node:fs'
import { inflateSync as _m1_inflateSync, gunzipSync as _m1_gunzipSync } from 'node:zlib'
import { load as _m1_load } from 'cheerio'
import { convertBuild as _m1_convertBuild } from '../electron/modules/pobExport/converter.js'
import { resolveItemIdentity as _m1_resolveItemIdentity } from '../electron/modules/pobExport/integrity.js'
import { pobIdentities as _m1_pobIdentities } from '../electron/modules/pobExport/compatibility.js'
import { DATA as _m1_DATA } from 'cn-poe-utils/data/poe'
import { TranslatorFactory as _m1_TranslatorFactory } from 'cn-poe-utils/translator/zh2en'
import { buildFixture as _m1_buildFixture } from './fixtures/pobExport.js'
import { guardStatTemplates as _m1_guardStatTemplates } from '../electron/modules/pobExport/templateSafety.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { inflateSync as _m2_inflateSync } from 'node:zlib'
import { load as _m2_load } from 'cheerio'
import { DATA as _m2_POB_DATA } from 'cn-poe-utils/data/pob'
import _m2_snapshot from '../electron/assets/pob-export/international.json' with { type: 'json' }
import { internationalPobContext as _m2_internationalPobContext, resolveInternationalItemIdentity as _m2_resolveInternationalItemIdentity } from '../electron/modules/pobExport/internationalCompatibility.js'
import { convertBuild as _m2_convertBuild } from '../electron/modules/pobExport/converter.js'
import { checkTranslatedGem as _m2_checkTranslatedGem } from '../electron/modules/pobExport/integrity.js'
import { buildFixture as _m2_buildFixture } from './fixtures/pobExport.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { createExportController as _m3_createExportController, newExportState as _m3_newExportState } from '../src/domains/pobExport/exportState.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import _m4_fs from 'node:fs/promises'
import _m4_path from 'node:path'
import _m4_os from 'node:os'
import { randomUUID as _m4_randomUUID } from 'node:crypto'
import { PobLauncherService as _m4_PobLauncherService, PROGRAMS as _m4_PROGRAMS } from '../electron/modules/pobLauncher/service.js'
import { commitFiles as _m4_commitFiles, recover as _m4_recover, MANAGEMENT as _m4_MANAGEMENT, writeJson as _m4_writeJson, stat as _m4_stat } from '../electron/modules/pobLauncher/files.js'
import { extractArchive as _m4_extractArchive, resolveRelease as _m4_resolveRelease, download as _m4_download } from '../electron/modules/pobLauncher/download.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import _m5_fs from 'node:fs/promises'
import _m5_vm from 'node:vm'
import { EventEmitter as _m5_EventEmitter } from 'node:events'
import { errorMessage as _m5_errorMessage } from '../electron/modules/pobLauncher/errors.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { readFileSync as _m6_readFileSync } from 'node:fs'
import { parse as _m6_parse, compileScript as _m6_compileScript } from '@vue/compiler-sfc'
import * as _m6_Vue from 'vue'

// === Merged from pobExport.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const inflateSync = _m0_inflateSync
  const load = _m0_load
  const convertBuild = _m0_convertBuild
  const convertInWorker = _m0_convertInWorker
  const PobExportService = _m0_PobExportService
  const requestPoeCnJson = _m0_requestPoeCnJson
  const buildFixture = _m0_buildFixture
const decode = code => inflateSync(Buffer.from(code.replace(/-/g, '+').replace(/_/g, '/'), 'base64')).toString('utf8')

test('英文 API 保留原文且不产生假翻译警告，之后国服转换仍正常', () => {
  const fixture = buildFixture()
  fixture.language = 'en'
  const weapon = fixture.items.items[0]
  weapon.baseType = weapon.typeLine = 'Driftwood Wand'
  weapon.explicitMods = ['+10 to maximum Mana']
  const gemNames = ['Fireball', 'Added Lightning Damage Support', 'Ice Nova']
  for (const [index, gem] of weapon.socketedItems.entries()) {
    gem.baseType = gem.typeLine = gemNames[index]
    gem.properties = gem.properties.map(prop => ({ ...prop, name: prop.name === '等级' ? 'Level' : 'Quality' }))
  }
  fixture.passiveSkills.items[0].baseType = fixture.passiveSkills.items[0].typeLine = 'Cobalt Jewel'
  fixture.passiveSkills.items[0].explicitMods = ['+10 to maximum Mana']
  const result = convertBuild(fixture)
  assert.equal(result.warnings.length, 1)
  assert.match(result.warnings[0], /独立 PoB 2\.68\.1 数据/)
  const $ = load(decode(result.code), { xml: true })
  assert.match($('Item').first().text(), /Driftwood Wand/)
  assert.equal($('Gem').first().attr('nameSpec'), 'Fireball')
  assert.equal($('Gem').eq(1).attr('nameSpec'), 'Added Lightning Damage')
  assert.equal($('Skill').length, 2)
  assert.equal($('Spec').attr('treeVersion'), '3_30')
  const cnResult = convertBuild(buildFixture())
  assert.match(decode(cnResult.code), /Driftwood Wand/)
  assert.deepEqual(cnResult.warnings, [])
  weapon.socketedItems[0].baseType = weapon.socketedItems[0].typeLine = 'Arcane Link'
  assert.match(decode(convertBuild(fixture).code), /Arcane Link/)
  weapon.socketedItems[0].baseType = weapon.socketedItems[0].typeLine = 'Unreleased Fixture Skill'
  assert.throws(() => convertBuild(fixture), error => error.code === 'CONVERSION_FAILED' &&
    error.details.warnings.some(warning => warning.includes('独立 PoB 2.68.1')) &&
    error.details.warnings.some(warning => warning.includes('Unreleased Fixture Skill')))
})

test('国服翻译、装备、技能连线、等级品质、天赋与珠宝编码往返', () => {
  const fixture = buildFixture()
  const before = structuredClone(fixture)
  const result = convertBuild(fixture)
  assert.match(result.code, /^[A-Za-z0-9_-]+=*$/)
  const $ = load(decode(result.code), { xml: true })
  assert.equal($('Build').attr('level'), '90')
  assert.equal($('Build').attr('className'), 'Witch')
  assert.equal($('Build').attr('ascendClassName'), 'Occultist')
  assert.match($('Item').first().text(), /Driftwood Wand/)
  assert.match($('Item').first().text(), /\+10 to maximum Mana/)
  assert.equal($('Skill').length, 2)
  assert.equal($('Skill').first().find('Gem').length, 2)
  assert.equal($('Gem').first().attr('nameSpec'), 'Fireball')
  assert.equal($('Gem').first().attr('level'), '19')
  assert.equal($('Gem').first().attr('quality'), '20')
  assert.equal($('Spec').attr('nodes'), '11455,1734')
  assert.equal($('Spec').attr('treeVersion'), '3_30')
  assert.equal($('Spec').attr('masteryEffects'), '{11455,1}')
  assert.equal($('Sockets Socket').length, 1)
  assert.equal($('Item').length, 2)
  assert.equal($('Config Input').length, 0)
  assert.deepEqual(fixture, before)
})

test('复用 PoeCharm 新版技能和词缀模板，保留数值及辅助技能引用', () => {
  const fixture = buildFixture()
  Object.assign(fixture.items.items[0].socketedItems[0], { baseType: '莉西娅契约', typeLine: '莉西娅契约' })
  fixture.items.items[0].explicitMods = [
    '插上的技能石的魔力消耗总降 25%',
    '你头盔中镶嵌的技能由 20 级的能量偷取辅助',
    '击中时施加冰霜曝露，使冰霜抗性降低 -12%',
    '获得范围内所有未配置小天赋的全部加成'
  ]
  const result = convertBuild(fixture)
  const $ = load(decode(result.code), { xml: true })
  assert.equal($('Gem').first().attr('nameSpec'), 'Pact of Lycia')
  const item = $('Item').first().text()
  assert.match(item, /Socketed Gems have 25% less Mana Cost/)
  assert.match(item, /Supported by level 20 Energy Leech/)
  assert.match(item, /applying -12% to Cold Resistance/)
  assert.match(item, /Grants all bonuses of Unallocated Small Passive Skills in Radius/)
  assert.deepEqual(result.warnings, [])
})

test('未知词缀保留并提示，XML 特殊字符不会产生额外节点', () => {
  const fixture = buildFixture()
  fixture.items.items[0].explicitMods.push('未知词缀 <Injected/> & "测试"')
  const result = convertBuild(fixture)
  const xml = decode(result.code)
  const $ = load(xml, { xml: true })
  assert.equal($('Injected').length, 0)
  assert.match($('Item').first().text(), /未知词缀 <Injected\/> & "测试"/)
  assert.ok(result.warnings.some(w => w.includes('未知词缀')))
})

test('未知底材和缺失技能等级、天赋数据阻止成功', () => {
  const fixture = buildFixture()
  fixture.items.items[0].baseType = '不存在的底材'
  assert.throws(() => convertBuild(fixture), error => error.code === 'CONVERSION_FAILED' && error.details.warnings.length > 0)
  const noLevel = buildFixture()
  noLevel.items.items[0].socketedItems[0].properties = []
  assert.throws(() => convertBuild(noLevel), e => e.details.warnings.some(w => w.includes('技能等级')))
  assert.throws(() => convertBuild({ items: {}, passiveSkills: {} }), /数据不完整/)
})

test('转换 worker 可独立生成构筑', async () => {
  const result = await convertInWorker(buildFixture())
  assert.match(decode(result.code), /<PathOfBuilding>/)
})

test('官网新版 description 对象词缀与旧字符串等价，包括嵌套珠宝', () => {
  const legacy = buildFixture()
  const current = buildFixture()
  current.items.items[0].explicitMods = [{ description: '+10 最大魔力' }]
  current.passiveSkills.items[0].explicitMods = [{ description: '+10 最大魔力' }]
  assert.equal(convertBuild(current).code, convertBuild(legacy).code)
  current.items.items[0].explicitMods = [{ invalid: true }]
  assert.throws(() => convertBuild(current), e => e.details.warnings.some(w => w.includes('词缀数据格式')))
})

function setup({ request, convert } = {}) {
  let status = { authenticated: true, accountName: 'fixture-self' }
  let listener
  const auth = { getStatus: () => status, subscribe: cb => { listener = cb }, expire: async () => { status = { authenticated: false }; listener() } }
  const calls = []
  const fixture = buildFixture()
  const service = new PobExportService({ auth, session: {}, convert: convert || (async () => ({ code: 'fixture-code', warnings: [] })),
    request: request || (async (_session, url, options) => {
      calls.push({ url, options })
      if (url.endsWith('get-characters')) return [fixture.items.character]
      return url.endsWith('get-items') ? fixture.items : fixture.passiveSkills
    }) })
  return { service, calls, change: () => { status = { authenticated: true, accountName: 'fixture-next' }; listener() } }
}

test('本人身份取自主进程，公开账号编码为 POST 参数且每次重新取数', async () => {
  const { service, calls } = setup()
  const input = { source: 'self', forumId: 'ignored', character: '测试角色', league: '测试赛季' }
  await service.exportBuild(input)
  await service.exportBuild(input)
  assert.equal(calls.length, 6)
  assert.equal(new URLSearchParams(calls[0].options.body).get('accountName'), 'fixture-self')
  assert.equal(calls[0].options.method, 'POST')
  await service.listCharacters({ source: 'other', forumId: '测试#1234' })
  assert.equal(new URLSearchParams(calls[6].options.body).get('accountName'), '测试#1234')
  await assert.rejects(service.listCharacters({ source: 'other', forumId: '' }), { code: 'INVALID_REQUEST' })
  await assert.rejects(service.exportBuild({ ...input, character: '已删除' }), { code: 'CHARACTER_NOT_FOUND' })
})

test('空列表与常见官网错误映射，不泄漏原始请求信息', async () => {
  assert.deepEqual(await setup({ request: async () => [] }).service.listCharacters({ source: 'self' }), [])
  for (const [original, expected] of [
    [{ details: { status: 403 } }, 'PRIVATE_PROFILE'], [{ details: { status: 404 } }, 'CHARACTER_NOT_FOUND'],
    [{ code: 'RATE_LIMITED', details: { retryAfter: 5 } }, 'RATE_LIMITED'], [{ code: 'SESSION_EXPIRED' }, 'SESSION_EXPIRED'], [{}, 'NETWORK_ERROR']
  ]) {
    const { service } = setup({ request: async () => { throw { ...original, message: 'sensitive-fixture' } } })
    await assert.rejects(service.listCharacters({ source: 'self' }), error => error.code === expected && !error.message.includes('sensitive'))
  }
})

test('账号切换使网络和转换中的请求失效', async () => {
  let resolve
  const { service, change } = setup({ convert: () => new Promise(r => { resolve = r }) })
  const pending = service.exportBuild({ source: 'self', character: '测试角色', league: '测试赛季' })
  while (!resolve) await new Promise(r => setImmediate(r))
  change()
  resolve({ code: 'stale' })
  await assert.rejects(pending, { code: 'STALE_REQUEST' })
})

test('共享 HTTP 请求支持表单 POST 并保留 GET 默认行为', async () => {
  const requests = []
  const session = { fetch: async (_url, options) => { requests.push(options); return { ok: true, status: 200, text: async () => '[]' } } }
  await requestPoeCnJson(session, 'https://poe.game.qq.com/test')
  await requestPoeCnJson(session, 'https://poe.game.qq.com/test', { method: 'POST', body: 'realm=pc' })
  assert.equal(requests[0].method, 'GET')
  assert.equal(requests[1].body, 'realm=pc')
})
})()

// === Merged from pobExportCoverage.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const readFileSync = _m1_readFileSync
  const inflateSync = _m1_inflateSync
  const gunzipSync = _m1_gunzipSync
  const load = _m1_load
  const convertBuild = _m1_convertBuild
  const resolveItemIdentity = _m1_resolveItemIdentity
  const pobIdentities = _m1_pobIdentities
  const DATA = _m1_DATA
  const TranslatorFactory = _m1_TranslatorFactory
  const buildFixture = _m1_buildFixture
  const guardStatTemplates = _m1_guardStatTemplates
const basic = new TranslatorFactory().getBasicTranslator()
const xml = result => load(inflateSync(Buffer.from(result.code, 'base64url')).toString(), { xml: true })
const slots = { amulets: 'Amulet', belts: 'Belt', bodyArmours: 'BodyArmour', boots: 'Boots', flasks: 'Flask', gloves: 'Gloves', helmets: 'Helm', jewels: null, quivers: 'Offhand', rings: 'Ring', shields: 'Offhand', tinctures: 'Flask', weapons: 'Weapon' }

test('官网最大等级标记不阻止导出，外观描述不作为战斗词缀', () => {
  for (const value of ['20(最大)', '20（最大）', '20 (最大)', '20 (Max)', '20', '21(最高等级)', '4(最高等级)', '20（最高等级）']) {
    const f = buildFixture()
    f.items.items[0].socketedItems[0].properties[0].values[0][0] = value
    f.items.items[0].cosmeticMods = ['仅改变外观的描述']
    const result = convertBuild(f)
    const $ = xml(result)
    assert.equal($('Gem').first().attr('level'), String(parseInt(value)), value)
    assert.ok(!$('Item').first().text().includes('仅改变外观'))
    assert.deepEqual(result.warnings, [])
  }
  for (const value of ['', '20oops', '0', '(最大)', '20(21)', '20(最高等级)坏数据']) {
    const f = buildFixture()
    f.items.items[0].socketedItems[0].properties[0].values[0][0] = value
    assert.throws(() => convertBuild(f), e => e.details.warnings.some(w => w.includes('技能等级')))
  }
})

test('永恒珠宝换行变化保留种子、征服者和完整效果', () => {
  const guarded = guardStatTemplates(new TranslatorFactory().getBasicTranslator())
  const templates = DATA.stats.filter(x => x.zh.includes('\n') && /Passives in radius are Conquered/.test(x.en))
  assert.ok(templates.length >= 10)
  for (const template of templates) {
    const source = template.zh.replaceAll('{0}', '1573')
    const expected = template.en.replaceAll('{0}', '1573')
    for (const separator of [' ', '\n', '\r\n']) {
      const input = source.replace(/\s*\n\s*/g, separator)
      assert.equal(guarded.transMod(input), expected, input)
    }
  }
  const f = buildFixture()
  f.passiveSkills.items[0].explicitMods = ['以夏巴夸亚的名义用 1573 名祭品之血浸染\n范围内的天赋被瓦尔抑制']
  const result = convertBuild(f)
  assert.match(xml(result)('Item').last().text(), /Bathed in the blood of 1573 sacrificed in the name of Xibaqua\nPassives in radius are Conquered by the Vaal/)
  assert.deepEqual(result.warnings, [])
})

test('词缀参数拒绝空值，保留不同数值与正负号', () => {
  const guarded = guardStatTemplates(new TranslatorFactory().getBasicTranslator())
  const template = { zh: '测试 {0} 到 {1} 点伤害', en: 'Adds {0} to {1} Damage' }
  assert.equal(guarded.doTransMod(template, '测试 -17 到 +29 点伤害'), 'Adds -17 to +29 Damage')
  assert.equal(guarded.doTransMod(template, '测试  到 29 点伤害'), undefined)
  assert.equal(guarded.doTransMod(template, '测试 非数字 到 29 点伤害'), undefined)
})

test('弹幕辅助不会被误导入为弹幕主动技能', () => {
  const f = buildFixture()
  Object.assign(f.items.items[0].socketedItems[0], { baseType: '弹幕（辅）', typeLine: '弹幕（辅）' })
  assert.equal(xml(convertBuild(f))('Gem').first().attr('nameSpec'), 'Barrage Support')
})

test('国服全角（辅）技能名与客户端引用标记可识别', () => {
  const f = buildFixture()
  // Names from the reported S31 character. The CN client writes support gems
  // with full-width parentheses, while the fixed data mostly has half-width ones.
  const supports = ['召唤生物生命（辅）', '赋予（辅）', '增幅（辅）', '闪电穿透（辅）', '提高暴击几率（辅）', '提高暴击伤害（辅）', '施法回响（辅）', '法术图腾（辅）']
  f.items.items[0].sockets = supports.map((_, i) => ({ group: i, sColour: 'B' }))
  f.items.items[0].socketedItems = supports.map((baseType, i) => ({ baseType, typeLine: baseType, socket: i, properties: [{ name: '等级', values: [['20', 0]] }] }))
  // The client wraps referenced names in "[id|名称]" markup.
  f.items.items[0].enchantMods = ['配置 [block_notable_2934|稳若泰山]']
  f.items.items[0].explicitMods = [
    '镶嵌的宝石被 20 级 [SupportSpellTotem::20|法术图腾（辅）] 辅助',
    '生效期间，你受到的冻结持续时间缩短 64%',
    '增加的小天赋获得：15% increased Critical Strike Chance',
    '其中 1 个增加的天赋为[affliction_notable_precise_retaliation|睚眦必报]',
    '赞美 3926 名被 神主多米纳斯 转化的新信徒 范围内的天赋被 圣堂武僧 抑制'
  ]
  const result = convertBuild(f)
  const $ = xml(result)
  assert.deepEqual($('Gem').toArray().map(gem => $(gem).attr('nameSpec')),
    ['Minion Life', 'Empower', 'Enhance', 'Lightning Penetration', 'Increased Critical Strikes', 'Increased Critical Damage', 'Spell Echo', 'Spell Totem'])
  const item = $('Item').first().text()
  assert.match(item, /Allocates As The Mountain/)
  assert.match(item, /Socketed Gems are Supported by Level 20 Spell Totem/)
  assert.match(item, /64% reduced Freeze Duration on you during Effect/)
  assert.match(item, /Added Small Passive Skills grant: 15% increased Critical Strike Chance/)
  assert.match(item, /1 Added Passive Skill is Precise Retaliation/)
  assert.match(item, /Carved to glorify 3926 new faithful converted by High Templar Dominus\nPassives in radius are Conquered by the Templars/)
  assert.deepEqual(result.warnings, [])
})

test('截图中的腐母之叛、珠光项链、刺客印记输出真实英文身份', () => {
  const f = buildFixture()
  f.items.items.push({ id: 'fixture-amulet', frameType: 3, name: '腐母之叛', baseType: '珠光项链', typeLine: '珠光项链', ilvl: 85, inventoryId: 'Amulet', implicitMods: ['+10% 所有元素抗性'], explicitMods: ['+25 全属性'] })
  Object.assign(f.items.items[0].socketedItems[0], { baseType: '刺客印记', typeLine: '刺客印记' })
  const result = convertBuild(f)
  const $ = xml(result)
  assert.match($('Item').eq(1).text(), /Rotmother's Mutiny\nPearlescent Amulet/)
  assert.equal($('Gem').first().attr('nameSpec'), "Assassin's Mark")
  assert.equal($('Item').length, 3)
  assert.deepEqual(result.warnings, [])
})

test('全部国服角色物品目录都有映射或具体的上游限制与排除原因', () => {
  const report = JSON.parse(readFileSync(new URL('../scripts/data/pob-export/coverage.json', import.meta.url)))
  const details = JSON.parse(gunzipSync(readFileSync(new URL('../scripts/data/pob-export/coverage-details.json.gz', import.meta.url))))
  const entries = details.filter(x => x.category === 'cnItems')
  assert.ok(entries.length > 3300)
  assert.deepEqual(entries.filter(x => ['missing', 'conflict'].includes(x.status)), [])
  assert.deepEqual(entries.filter(x => x.status === 'unsupported').map(x => x.zh), ['赏金猎人饰品', '血肉嫁接'])
  assert.equal(report.categories.grafts.covered, 16)
  for (const [category, counts] of Object.entries(report.categories)) {
    assert.equal(counts.total, counts.covered + counts.added + counts.missing + counts.conflict + counts.unsupported, category)
  }
  assert.ok(report.sources.every(x => /^[a-f0-9]{64}$/.test(x.sha256)))
  assert.equal(report.details.entries, details.length)
})

test('旧赛季嫁接栏位与闪回传奇稀有度保留，未支持的血肉嫁接明确失败', () => {
  const f = buildFixture()
  f.items.items.push({ id: 'fixture-graft', frameType: 2, name: '随机名称', baseType: '风暴的艾许之嫁接', typeLine: '风暴的艾许之嫁接', ilvl: 85, inventoryId: 'BrequelGrafts', explicitMods: ['+20 最大生命'] })
  f.items.items.push({ id: 'fixture-relic', frameType: 9, name: '腐母之叛', baseType: '珠光项链', typeLine: '珠光项链', ilvl: 85, inventoryId: 'Amulet' })
  const $ = xml(convertBuild(f))
  assert.equal($('Slot[name="Graft 1"]').attr('itemId'), '2')
  assert.match($('Item').eq(1).text(), /Storming Eshgraft/)
  assert.match($('Item').eq(2).text(), /Rarity: RELIC\nRotmother's Mutiny/)
  f.items.items[1].baseType = '血肉嫁接'
  assert.throws(() => convertBuild(f), e => e.details.warnings.some(w => w.includes('血肉嫁接')))
})

test('天赋引用重名不能静默选取错误身份', () => {
  const f = buildFixture()
  f.items.items[0].enchantMods = ['配置 英勇']
  const result = convertBuild(f)
  assert.match(xml(result)('Item').first().text(), /配置 英勇/)
  assert.ok(result.warnings.some(w => w.includes('可能影响 PoB 计算')))
})

test('全量底材与传奇关联可解析，不把未知传奇降级为稀有装备', () => {
  let count = 0
  for (const [category, inventoryId] of Object.entries(slots)) {
    for (const base of DATA[category]) {
      for (const unique of base.uniques || []) {
        if (unique.matchMods) continue // Tested with concrete modifiers below.
        const result = resolveItemIdentity({ frameType: 3, baseType: base.zh, name: unique.zh, inventoryId }, basic)
        assert.equal(result.error, undefined, `${category}: ${unique.zh} / ${base.zh}`)
        assert.equal(result.name, unique.en)
        assert.equal(result.baseType, base.en.replace('Maelström Staff', 'Maelstrom Staff'))
        count++
      }
    }
  }
  assert.ok(count > 1400)
})

test('全部 PoB 宝石身份存在可用中文映射，变异技能归入正确类别', () => {
  const mapped = new Set()
  for (const key of ['gemSkills', 'hybridSkills', 'transfiguredSkills']) {
    for (const skill of DATA[key]) {
      const actual = basic.transSkill(skill.zh)
      if (actual) mapped.add(pobIdentities.gemNameMap[actual] ?? actual)
    }
  }
  assert.deepEqual(pobIdentities.gemNames.filter(name => !mapped.has(name)), [])
  assert.ok(DATA.transfiguredSkills.some(x => x.en === 'Absolution of Inspiring'))
  assert.ok(DATA.indexableSupports.some(x => x.en === 'Crystalfall'))
})

test('一次列全装备、传奇、技能、等级与珠宝的问题，不返回部分导入码', () => {
  const f = buildFixture()
  f.items.items[0].baseType = '未知武器底材'
  Object.assign(f.items.items[0].socketedItems[0], { baseType: '未知技能', typeLine: '未知技能', properties: [] })
  Object.assign(f.passiveSkills.items[0], { frameType: 3, name: '未知传奇珠宝' })
  assert.throws(() => convertBuild(f), error => {
    for (const label of ['未知武器底材', '未知技能', '技能等级', '未知传奇珠宝']) assert.ok(error.details.warnings.some(w => w.includes(label)), label)
    assert.equal(error.details.warnings.length, new Set(error.details.warnings).size)
    assert.equal(error.code, 'CONVERSION_FAILED')
    return true
  })
})

test('未知传奇不能伪装成 Item，随机稀有名称仍正常导出', () => {
  const f = buildFixture()
  Object.assign(f.items.items[0], { frameType: 3, name: '不存在的传奇' })
  assert.throws(() => convertBuild(f), e => e.details.warnings.some(w => w.includes('未识别传奇身份')))
  f.items.items[0].frameType = 2
  assert.match(xml(convertBuild(f))('Item').first().text(), /Rarity: RARE\nItem\nDriftwood Wand/)
  f.items.items[0].name = ''
  assert.match(xml(convertBuild(f))('Item').first().text(), /Rarity: RARE\nItem\nDriftwood Wand/)
})

test('同名圣杖按特征词缀消歧，缺少或冲突特征不能猜测', () => {
  for (const [mod, name] of [
    ['+5% 闪电抗性上限', 'Agnerod South'],
    ['Adds 14 to 123 Lightning Damage to Spells', 'Agnerod West'],
    ['100% increased Lightning Ailment Duration on Enemies', 'Agnerod East'],
    ['15% chance to Shock', 'Agnerod North']
  ]) {
    const result = resolveItemIdentity({ frameType: 3, name: '雷霆圣杖', baseType: '帝国长杖', inventoryId: 'Weapon', explicitMods: [mod] }, basic)
    assert.equal(result.name, name)
  }
  const ambiguous = { frameType: 3, name: '雷霆圣杖', baseType: '帝国长杖', inventoryId: 'Weapon' }
  assert.ok(resolveItemIdentity(ambiguous, basic).error)
  assert.ok(resolveItemIdentity({ ...ambiguous, explicitMods: ['+5% 闪电抗性上限', '15% chance to Shock'] }, basic).error)
})

test('嵌套深渊珠宝和旧词缀不丢失，不产生空技能组', () => {
  const f = buildFixture()
  const weapon = f.items.items[0]
  weapon.sockets.unshift({ group: 5, sColour: 'A' })
  weapon.socketedItems.forEach(g => g.socket++)
  weapon.socketedItems.unshift({ id: 'fixture-abyss', frameType: 2, name: '随机珠宝', baseType: '凶残之凝珠宝', typeLine: '凶残之凝珠宝', abyssJewel: true, socket: 0, ilvl: 80, utilityMods: [{ description: '+10 最大魔力' }], scourgeMods: ['+20 最大生命'] })
  weapon.scourgeMods = ['+30 最大生命']
  weapon.futureMods = ['未知未来词缀']
  const result = convertBuild(f)
  const $ = xml(result)
  assert.equal($('Item').length, 3)
  assert.equal($('Gem').length, 3)
  assert.ok($('Skill').toArray().every(group => $(group).find('Gem').length > 0))
  assert.match($('Item').eq(1).text(), /Murderous Eye Jewel/)
  assert.match($('Item').eq(1).text(), /\+10 to maximum Mana/)
  assert.match($('Item').eq(1).text(), /\+20 to maximum Life/)
  assert.match($('Item').first().text(), /未知未来词缀/)
  assert.match($('Item').first().text(), /Has 1 Abyssal Sockets/)
  assert.ok(result.warnings.some(w => w.includes('可能影响 PoB 计算')))
})

test('新版职业、专精和天赋覆盖完整，缺失星团节点不能静默成功', () => {
  const f = buildFixture()
  f.passiveSkills.ascendancy = 2
  f.passiveSkills.character = 0
  const $ = xml(convertBuild(f))
  assert.equal($('Build').attr('ascendClassName'), pobIdentities.classes[0].ascendancies[1].name)
  assert.equal($('Spec').attr('masteryEffects'), '{11455,1}')
  f.passiveSkills.hashes_ex = [12345]
  assert.throws(() => convertBuild(f), e => e.details.warnings.some(w => w.includes('天赋节点缺失')))
})
})()

// === Merged from pobExportInternational.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const inflateSync = _m2_inflateSync
  const load = _m2_load
  const POB_DATA = _m2_POB_DATA
  const snapshot = _m2_snapshot
  const internationalPobContext = _m2_internationalPobContext
  const resolveInternationalItemIdentity = _m2_resolveInternationalItemIdentity
  const convertBuild = _m2_convertBuild
  const checkTranslatedGem = _m2_checkTranslatedGem
  const buildFixture = _m2_buildFixture
const xml = result => load(inflateSync(Buffer.from(result.code.replace(/-/g, '+').replace(/_/g, '/'), 'base64')).toString('utf8'), { xml: true })
function englishFixture() {
  const fixture = buildFixture()
  fixture.language = 'en'
  const weapon = fixture.items.items[0]
  Object.assign(weapon, { baseType: 'Driftwood Wand', typeLine: 'Driftwood Wand', explicitMods: ['+10 to maximum Mana'] })
  for (const [index, gem] of weapon.socketedItems.entries()) {
    gem.baseType = gem.typeLine = ['Arcane Link', 'Added Lightning Damage Support', 'Fireball of Radiation'][index]
    gem.properties = gem.properties.map(prop => ({ ...prop, name: prop.name === '等级' ? 'Level' : 'Quality' }))
  }
  Object.assign(fixture.passiveSkills.items[0], { baseType: 'Cobalt Jewel', typeLine: 'Cobalt Jewel', explicitMods: ['+10 to maximum Mana'] })
  return fixture
}

test('国际服PoB使用固定官方3.30来源，普通和无情树独立于国服', () => {
  assert.equal(snapshot.server, 'international')
  assert.equal(snapshot.locale, 'en')
  assert.equal(snapshot.gameVersion, '3.30.0')
  assert.equal(snapshot.commit, 'a41fec6c20f822a658ae5df1273e8c69d5969bac')
  assert.ok(snapshot.sources.length > 40)
  for (const source of snapshot.sources) {
    assert.ok(source.url.startsWith(`https://raw.githubusercontent.com/PathOfBuildingCommunity/PathOfBuilding/${snapshot.commit}/src/`))
    assert.match(source.sha256, /^[a-f0-9]{64}$/)
  }
  const before = structuredClone(POB_DATA.tree)
  const fixture = englishFixture()
  assert.equal(xml(convertBuild(fixture))('Spec').attr('treeVersion'), '3_30')
  fixture.items.character.league = 'Ruthless Test League'
  assert.equal(xml(convertBuild(fixture))('Spec').attr('treeVersion'), '3_30_ruthless')
  assert.deepEqual(POB_DATA.tree, before)
  assert.equal(xml(convertBuild(buildFixture()))('Spec').attr('treeVersion'), '3_30')
})

test('独立快照所有技能和新增3.30技能有真实PoB身份，升华和珠宝插槽使用当前树', () => {
  const fixture = englishFixture()
  const context = internationalPobContext(fixture.items)
  for (const gem of snapshot.gems) {
    const baseType = gem.id.includes('/SupportGem') && !gem.en.endsWith(' Support') ? `${gem.en} Support` : gem.en
    const issues = []
    checkTranslatedGem({ baseType }, issues, context)
    assert.deepEqual(issues, [], baseType)
  }
  fixture.passiveSkills.character = 0
  fixture.passiveSkills.ascendancy = 3
  const $ = xml(convertBuild(fixture))
  assert.equal($('Build').attr('className'), 'Scion')
  assert.equal($('Build').attr('ascendClassName'), 'Luminary')
  assert.equal($('Gem').first().attr('nameSpec'), 'Arcane Link')
  assert.equal($('Gem').eq(2).attr('nameSpec'), 'Fireball of Radiation')
  assert.equal(Number($('Sockets Socket').first().attr('nodeId')), snapshot.jewelSlots[0])
})

test('国际服秽生传奇按原底材确认身份，导入码保留名称和官网秽生词缀标记', () => {
  const current = englishFixture()
  const jewel = current.passiveSkills.items[0]
  const name = 'Foulborn Intuitive Leap'
  const baseType = 'Viridian Jewel'
  const mod = 'Keystone Passive Skills in Radius can be Allocated without being connected to your tree\nPassage'
  const ordinaryMod = '+10 to maximum Mana'
  Object.assign(jewel, { name, baseType, typeLine: baseType, frameType: 3, mutated: true,
    explicitMods: [{ description: ordinaryMod }, { description: mod, flags: { mutated: true } }] })

  const legacy = structuredClone(current)
  Object.assign(legacy.passiveSkills.items[0], { explicitMods: [ordinaryMod], mutatedMods: [mod] })
  const itemText = fixture => xml(convertBuild(fixture))('Items Item').last().text()
  const result = itemText(current)
  assert.equal(result, itemText(legacy))
  assert.match(result, /\nFoulborn Intuitive Leap\nViridian Jewel\n/)
  assert.match(result, /\n\+10 to maximum Mana\n\{mutated\}Keystone Passive Skills in Radius can be Allocated without being connected to your tree\n\{mutated\}Passage\n/)

  jewel.baseType = 'Cobalt Jewel'
  assert.throws(() => convertBuild(current), error => error.details.warnings.some(w => w.includes(`${name} / Cobalt Jewel`)))
  jewel.baseType = baseType
  jewel.name = 'Foulborn Fake Unique'
  assert.throws(() => convertBuild(current), error => error.details.warnings.some(w => w.includes(jewel.name)))
})

test('国际服未知关键身份或天赋节点失败，保留未知词缀且失败后恢复国服运行上下文', () => {
  const before = structuredClone(POB_DATA.tree)
  const fixture = englishFixture()
  fixture.passiveSkills.hashes.push(99999999)
  assert.throws(() => convertBuild(fixture), error => error.details.warnings.some(w => w.includes('99999999')))
  assert.deepEqual(POB_DATA.tree, before)
  fixture.passiveSkills.hashes.pop()
  fixture.items.items[0].baseType = 'Unknown Current Wand'
  assert.throws(() => convertBuild(fixture), error => error.details.warnings.some(w => w.includes('Unknown Current Wand')))
  fixture.items.items[0].baseType = 'Driftwood Wand'
  fixture.items.items[0].explicitMods.push('Unrecognised future modifier <keep>')
  assert.match(xml(convertBuild(fixture))('Item').first().text(), /Unrecognised future modifier <keep>/)
  assert.deepEqual(POB_DATA.tree, before)
  assert.ok(resolveInternationalItemIdentity({ baseType: 'Driftwood Wand', name: 'Fake Unique', inventoryId: 'Weapon', frameType: 3 }).error)
  assert.ok(resolveInternationalItemIdentity({ baseType: 'Driftwood Wand', inventoryId: 'Helm', frameType: 0 }).error)
})
})()

// === Merged from pobExportState.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const createExportController = _m3_createExportController
  const newExportState = _m3_newExportState
const ok = data => ({ success: true, data })
const characters = [{ name: 'a', league: 'A' }, { name: 'b', league: 'B' }]
test('默认赛季、刷新清空、重复点击保护及导出结果', async () => {
  const state = newExportState()
  let calls = 0
  const control = createExportController(state, { source: 'self', preferredLeague: () => 'B', api: {
    listCharacters: async () => ok(characters), exportBuild: async () => { calls++; return ok({ code: 'abc' }) }
  } })
  await control.load()
  assert.equal(state.league, 'B')
  assert.equal(state.character, '')
  control.setCharacter('b')
  await Promise.all([control.exportBuild(), control.exportBuild()])
  assert.equal(calls, 1)
  assert.equal(state.result.code, 'abc')
  control.setLeague('A')
  assert.equal(state.result, null)
  assert.equal(state.character, '')
})
test('旧加载结果、旧导出错误和卸载后响应均被丢弃', async () => {
  const state = newExportState()
  let resolve
  const control = createExportController(state, { source: 'other', api: { listCharacters: () => new Promise(r => { resolve = r }) } })
  control.setForumId('first')
  const pending = control.load()
  control.setForumId('second')
  resolve(ok(characters))
  await pending
  assert.deepEqual(state.characters, [])
  const next = control.load()
  control.dispose()
  resolve(ok(characters))
  await next
  assert.equal(state.loaded, false)
  assert.equal(state.busy, '')
})
test('错误可以重试且选择变化丢弃导出结果', async () => {
  const state = newExportState()
  let finish
  let failure = true
  const control = createExportController(state, { source: 'self', api: {
    listCharacters: async () => failure ? { success: false, error: { message: '限流' } } : ok(characters),
    exportBuild: () => new Promise(r => { finish = r })
  } })
  await control.load()
  assert.equal(state.error, '限流')
  failure = false
  await control.load()
  assert.equal(state.error, '')
  control.setCharacter('a')
  const pending = control.exportBuild()
  control.setLeague('B')
  finish(ok({ code: 'stale' }))
  await pending
  assert.equal(state.result, null)
})
})()

// === Merged from pobLauncher.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const fs = _m4_fs
  const path = _m4_path
  const os = _m4_os
  const randomUUID = _m4_randomUUID
  const PobLauncherService = _m4_PobLauncherService
  const PROGRAMS = _m4_PROGRAMS
  const commitFiles = _m4_commitFiles
  const recover = _m4_recover
  const MANAGEMENT = _m4_MANAGEMENT
  const writeJson = _m4_writeJson
  const stat = _m4_stat
  const extractArchive = _m4_extractArchive
  const resolveRelease = _m4_resolveRelease
  const download = _m4_download
async function write(root, file, value = 'MZ-test') {
  const target = path.join(root, file)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, value)
  return target
}
async function fixture(t, options = {}) {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'pob-launcher-test-'))
  t.after(async () => { if (path.dirname(temp) === os.tmpdir() && path.basename(temp).startsWith('pob-launcher-test-')) await fs.rm(temp, { recursive: true, force: true }) })
  const root = path.join(temp, '中文 tool')
  await fs.mkdir(root)
  const calls = []
  const defaults = { userData: path.join(temp, 'config'), running: async () => false,
    resolve: async component => ({ component, version: `${component}-v1` }),
    fetchArchive: async release => { calls.push(release.component) },
    extract: async (archive, destination) => {
      const charm = path.basename(archive) === 'charm.zip'
      const sub = charm ? 'PoeCharm-hash/' : ''
      await write(destination, sub + (charm ? 'PoeCharm3.exe' : 'Path of Building.exe'))
      await write(destination, sub + 'Data/data.lua', 'new-data')
      await write(destination, sub + 'Builds/user.xml', 'shipped-example')
      await write(destination, sub + 'Settings.xml', 'default-settings')
    }, launch: async () => {} }
  const service = new PobLauncherService({ ...defaults, ...options })
  t.after(() => service.logPending)
  return { temp, root, service, calls, defaults }
}
test('默认空白、无效路径、取消选择、保存及清空均不删除文件', async t => {
  const { service, root, defaults } = await fixture(t)
  assert.equal((await service.getState()).state.directory, '')
  assert.equal((await service.setDirectory('relative')).success, false)
  assert.equal((await service.setDirectory(path.join(root, 'missing'))).success, false)
  assert.equal((await service.setDirectory(path.parse(root).root)).success, false)
  assert.equal((await service.pickDirectory(async () => null)).state.directory, '')
  for (const program of Object.values(PROGRAMS)) await write(root, program)
  assert.equal((await service.setDirectory(root)).state.charm.version, '')
  const next = new PobLauncherService(defaults)
  const state = (await next.getState()).state
  assert.equal(state.directory, root)
  assert.equal(state.pob.installed, true)
  await next.setDirectory('')
  assert.ok(await stat(path.join(root, PROGRAMS.charm)))
})

test('阶段进度使用真实字节，空文件可完成，校验及解压均可停止', async t => {
  const { temp } = await fixture(t)
  const archive = await write(temp, 'stages.zip', zipBuffer([{ name: 'large.bin', data: 'a'.repeat(200000) }, { name: 'empty', data: '' }]))
  const events = []
  await extractArchive(archive, path.join(temp, 'complete'), { onProgress: value => events.push(value) })
  for (const phase of ['verifying', 'extracting']) {
    const progress = events.filter(value => value.phase === phase)
    assert.equal(progress.at(-1).percent, 100)
    assert.equal(progress.at(-1).received, 200000)
    assert.ok(progress.slice(0, -1).every(value => value.percent !== 100))
    assert.ok(progress.some(value => value.received > 0 && value.percent < 100))
  }
  assert.equal((await fs.stat(path.join(temp, 'complete/empty'))).size, 0)
  for (const phase of ['verifying', 'extracting']) {
    const controller = new AbortController()
    const target = path.join(temp, phase)
    await assert.rejects(extractArchive(archive, target, { signal: controller.signal, onProgress: value => {
      if (value.phase === phase && value.received > 0) controller.abort()
    } }), { name: 'AbortError' })
    if (phase === 'verifying') assert.equal(await stat(target), null)
  }
})

test('停止版本查询和下载保留原安装，旧操作不能停止新任务', async t => {
  for (const method of ['resolve', 'fetchArchive']) {
    let entered
    const reached = new Promise(resolve => { entered = resolve })
    const blocker = (...args) => new Promise((resolve, reject) => {
      const { signal } = args.at(-1)
      entered()
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    })
    const { service, root } = await fixture(t, { [method]: blocker })
    for (const program of Object.values(PROGRAMS)) await write(root, program, 'old')
    await service.setDirectory(root)
    const operation = service.install('update')
    await reached
    const id = service.state.operationId
    assert.equal(service.stop('old-id').success, false)
    assert.equal(service.stop(id).success, true)
    assert.equal(service.state.busy, true)
    assert.equal(service.stop(id).success, true)
    assert.equal((await service.setDirectory('')).success, false)
    const result = await operation
    assert.equal(result.cancelled, true, result.error)
    assert.equal(result.state.busy, false)
    for (const program of Object.values(PROGRAMS)) assert.equal(await fs.readFile(path.join(root, program), 'utf8'), 'old')
    assert.equal(service.stop(id).success, false)
  }
})

test('替换期间停止回滚，提交完成后停止不撤销结果', async t => {
  const { service, root } = await fixture(t)
  for (const program of Object.values(PROGRAMS)) await write(root, program, 'old')
  await write(root, 'Builds/personal.xml', 'my-build')
  await service.setDirectory(root)
  service.beforeWrite = async (_entry, index) => { if (index === 1) service.stop(service.state.operationId) }
  const result = await service.install('update')
  assert.equal(result.cancelled, true, result.error)
  for (const program of Object.values(PROGRAMS)) assert.equal(await fs.readFile(path.join(root, program), 'utf8'), 'old')
  assert.equal(await fs.readFile(path.join(root, 'Builds/personal.xml'), 'utf8'), 'my-build')
  service.beforeWrite = undefined
  service.on('state', state => {
    if (state.busy && !state.cancellable && state.phase === 'installing') assert.equal(service.stop(state.operationId).success, false)
  })
  assert.equal((await service.install('update')).success, true)
})

test('状态观察者抛错不能中断操作，日志脱敏且忙碌状态释放', async t => {
  const { service, root } = await fixture(t)
  service.on('state', () => { throw new Error('Object has been destroyed') })
  assert.equal((await service.setDirectory(root)).success, true)
  assert.equal((await service.install()).success, true)
  await service.logPending
  const log = await fs.readFile(service.logFile, 'utf8')
  assert.match(log, /notification/)
  assert.ok(!log.includes(root))
  assert.equal(service.state.busy, false)
})

test('提交后清理失败仍成功，重新检测保留失败阶段供通信恢复', async t => {
  const { service, root } = await fixture(t)
  await service.setDirectory(root)
  const original = fs.rm
  const mocked = t.mock.method(fs, 'rm', async (file, options) => {
    if (path.dirname(file) === path.join(root, MANAGEMENT) && path.basename(file).startsWith('stage-')) {
      throw Object.assign(new Error('locked'), { code: 'EPERM' })
    }
    return original(file, options)
  })
  const result = await service.install()
  mocked.mock.restore()
  assert.equal(result.success, true, result.error)
  assert.match(result.state.warning, /暂存文件清理失败/)
  assert.equal(result.state.charm.installed, true)
  service.resolve = async () => { throw new Error('query failure') }
  const failed = await service.install('update')
  const detected = await service.getState()
  assert.equal(detected.error, failed.error)
  assert.equal(detected.state.operationId, failed.state.operationId)
  assert.equal(detected.state.busy, false)
})

test('备份后停止尚未替换目标，空归档阶段进度正常结束', async t => {
  const { temp, root } = await fixture(t)
  const source = await write(temp, 'new', 'new')
  await write(root, 'program', 'old')
  const controller = new AbortController()
  await assert.rejects(commitFiles(root, [{ relative: 'program', source }], {
    signal: controller.signal, beforeCommit: async () => controller.abort()
  }), { name: 'AbortError' })
  assert.equal(await fs.readFile(path.join(root, 'program'), 'utf8'), 'old')
  assert.equal(await stat(path.join(root, MANAGEMENT, 'journal.json')), null)
  const archive = await write(temp, 'empty.zip', zipBuffer([]))
  const events = []
  await extractArchive(archive, path.join(temp, 'empty-extracted'), { onProgress: p => events.push(p) })
  assert.deepEqual(events.filter(p => p.percent === 100).map(p => p.phase), ['verifying', 'extracting'])
})

test('下载未知总量、校验失败与停止均不会提前报告100%', async t => {
  const { temp } = await fixture(t)
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  globalThis.fetch = async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([1, 2, 3])); controller.close() } }))
  const progress = []
  await download({ url: 'https://example.invalid/test' }, path.join(temp, 'download'), value => progress.push(value))
  assert.equal(progress[0].percent, null)
  assert.equal(progress.at(-1).percent, 100)
  const invalid = []
  await assert.rejects(download({ url: 'https://example.invalid/test', digest: 'sha256:bad' }, path.join(temp, 'invalid'), value => invalid.push(value)))
  assert.ok(invalid.every(value => value.percent !== 100))
  const controller = new AbortController()
  await assert.rejects(download({ url: 'https://example.invalid/test' }, path.join(temp, 'stopped'), () => controller.abort(), { signal: controller.signal }), { name: 'AbortError' })
})
test('首次安装选择路径，安装两个组件，已安装不重复下载', async t => {
  const { service, root, calls } = await fixture(t)
  let selected = 0
  const result = await service.install('install', async () => { selected++; return root })
  assert.equal(result.success, true, result.error)
  assert.equal(selected, 1)
  assert.deepEqual(calls, ['charm', 'pob'])
  assert.equal(result.state.pob.version, 'pob-v1')
  assert.equal(await fs.readFile(path.join(root, 'Settings.xml'), 'utf8'), 'default-settings')
  assert.equal((await service.install()).success, true)
  assert.equal((await service.install('update')).state.message, '两个组件均已是最新版本')
  assert.equal(calls.length, 2)
})
test('部分安装仅补齐缺失组件，外部组件版本保持未知', async t => {
  const { service, root, calls } = await fixture(t)
  await write(root, PROGRAMS.charm, 'existing')
  await service.setDirectory(root)
  assert.equal((await service.install('update')).success, false)
  const result = await service.install()
  assert.equal(result.success, true, result.error)
  assert.deepEqual(calls, ['pob'])
  assert.equal(result.state.charm.version, '')
  assert.equal(await fs.readFile(path.join(root, PROGRAMS.charm), 'utf8'), 'existing')
})
test('外部安装更新备份原文件，保留 BD、设置和自定义文件', async t => {
  const { service, root } = await fixture(t)
  for (const program of Object.values(PROGRAMS)) await write(root, program, 'old-program')
  const preserved = ['Settings.conf', 'Settings.xml', 'custom.txt', 'PathOfBuildingCommunity-Portable/Builds/user.xml', 'PathOfBuildingCommunity-Portable/Settings.xml', 'PathOfBuildingCommunity-Portable/imgui.ini']
  for (const file of preserved) await write(root, file, 'personal')
  await service.setDirectory(root)
  const result = await service.install('update')
  assert.equal(result.success, true, result.error)
  for (const file of preserved) assert.equal(await fs.readFile(path.join(root, file), 'utf8'), 'personal')
  const backups = await fs.readdir(path.join(root, MANAGEMENT, 'backups'))
  assert.equal(backups.length, 1)
  assert.equal(await fs.readFile(path.join(root, MANAGEMENT, 'backups', backups[0], PROGRAMS.charm), 'utf8'), 'old-program')
})
test('替换失败回滚所有程序和版本，新文件撤销，失败后可重试', async t => {
  const { service, root } = await fixture(t, { beforeWrite: async (_entry, index) => { if (index === 2) throw new Error('注入替换失败') } })
  for (const program of Object.values(PROGRAMS)) await write(root, program, 'old-program')
  await service.setDirectory(root)
  const result = await service.install('update')
  assert.equal(result.success, false)
  for (const program of Object.values(PROGRAMS)) assert.equal(await fs.readFile(path.join(root, program), 'utf8'), 'old-program')
  assert.equal(await stat(path.join(root, 'Data/data.lua')), null)
  assert.equal(await stat(path.join(root, MANAGEMENT, 'versions.json')), null)
  service.beforeWrite = undefined
  assert.equal((await service.install('update')).success, true)
})
test('中断恢复可重复执行，已提交事务不回滚', async t => {
  const { service, root } = await fixture(t)
  const id = randomUUID()
  await write(root, PROGRAMS.charm, 'half-new')
  await write(root, `${MANAGEMENT}/backups/${id}/${PROGRAMS.charm}`, 'old')
  await write(root, 'new.dll', 'partial')
  const journal = { id, committed: false, entries: [{ relative: PROGRAMS.charm, existed: true }, { relative: 'new.dll', existed: false }] }
  await writeJson(path.join(root, MANAGEMENT, 'journal.json'), journal)
  assert.equal((await service.setDirectory(root)).success, true)
  assert.equal(await fs.readFile(path.join(root, PROGRAMS.charm), 'utf8'), 'old')
  assert.equal(await stat(path.join(root, 'new.dll')), null)
  assert.equal(await recover(root), false)
  await writeJson(path.join(root, MANAGEMENT, 'journal.json'), { ...journal, committed: true })
  await write(root, PROGRAMS.charm, 'committed')
  await recover(root)
  assert.equal(await fs.readFile(path.join(root, PROGRAMS.charm), 'utf8'), 'committed')
})
test('网络、结构及程序校验失败不会写入安装文件', async t => {
  for (const options of [
    { fetchArchive: async () => { throw new Error('fetch failed') } },
    { extract: async (_archive, destination) => { await write(destination, 'wrong.txt') } },
    { extract: async (_archive, destination) => { await write(destination, 'PoeCharm3.exe', 'not-exe') } }
  ]) {
    const { service, root } = await fixture(t, options)
    await service.setDirectory(root)
    assert.equal((await service.install()).success, false)
    assert.equal(await stat(path.join(root, PROGRAMS.charm)), null)
  }
})
test('运行中阻止更新，重复启动不产生进程，启动错误如实报告', async t => {
  let launches = 0
  const { service, root } = await fixture(t, { running: async () => true, launch: async () => { launches++ } })
  for (const program of Object.values(PROGRAMS)) await write(root, program)
  await service.setDirectory(root)
  assert.equal((await service.install('update')).success, false)
  await service.start()
  assert.equal(launches, 0)
  service.running = async () => false
  service.launch = async selected => { assert.equal(selected, root); throw new Error('启动被拒绝') }
  assert.equal((await service.start()).error, '启动被拒绝')
})
test('操作互斥锁在第一个异步点前生效，目录和选择器都被锁定', async t => {
  let release
  const { service, root } = await fixture(t, { resolve: () => new Promise(resolve => { release = resolve }) })
  await service.setDirectory(root)
  const installing = service.install()
  while (!release) await new Promise(resolve => setImmediate(resolve))
  assert.equal((await service.setDirectory('')).success, false)
  assert.equal((await service.start()).success, false)
  assert.equal((await service.install()).success, false)
  assert.equal((await service.pickDirectory(() => { throw new Error('must not open') })).success, false)
  service.resolve = async component => ({ component, version: 'v1' })
  release({ component: 'charm', version: 'v1' })
  assert.equal((await installing).success, true)
})

function zipBuffer(entries) {
  const locals = [], central = []
  let offset = 0
  for (const { name, data = 'MZ-test', mode = 0x8000 } of entries) {
    const filename = Buffer.from(name), content = Buffer.from(data)
    let crc = 0xffffffff
    for (const byte of content) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0) }
    crc = (crc ^ 0xffffffff) >>> 0
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(content.length, 18); local.writeUInt32LE(content.length, 22); local.writeUInt16LE(filename.length, 26)
    locals.push(local, filename, content)
    const header = Buffer.alloc(46)
    header.writeUInt32LE(0x02014b50); header.writeUInt16LE(0x0314, 4); header.writeUInt16LE(20, 6)
    header.writeUInt32LE(crc, 16); header.writeUInt32LE(content.length, 20); header.writeUInt32LE(content.length, 24)
    header.writeUInt16LE(filename.length, 28); header.writeUInt32LE((mode << 16) >>> 0, 38); header.writeUInt32LE(offset, 42)
    central.push(header, filename)
    offset += local.length + filename.length + content.length
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, directory, end])
}
test('真实 ZIP 安全解压，拒绝损坏、穿越、链接、Windows 别名和重复路径', async t => {
  const { temp } = await fixture(t)
  const archive = path.join(temp, 'good.zip')
  await fs.writeFile(archive, zipBuffer([{ name: 'wrapper/PoeCharm3.exe' }]))
  await extractArchive(archive, path.join(temp, 'good'))
  assert.equal(await fs.readFile(path.join(temp, 'good/wrapper/PoeCharm3.exe'), 'utf8'), 'MZ-test')
  const corrupt = zipBuffer([{ name: 'PoeCharm3.exe' }])
  corrupt[30 + Buffer.byteLength('PoeCharm3.exe') + 3] ^= 1
  const invalid = [Buffer.from('broken'), corrupt, ...[
    [{ name: '../outside.exe' }], [{ name: 'C:/evil.exe' }], [{ name: 'a/../../evil.exe' }],
    [{ name: 'link', mode: 0xa000 }], [{ name: 'CON.txt' }], [{ name: 'alias./evil' }],
    [{ name: 'a:stream' }], [{ name: 'a' }, { name: 'A' }]
  ].map(zipBuffer)]
  for (const [index, buffer] of invalid.entries()) {
    const file = path.join(temp, `bad-${index}.zip`), target = path.join(temp, `bad-${index}`)
    await fs.writeFile(file, buffer)
    await assert.rejects(extractArchive(file, target))
    assert.equal(await stat(target), null)
  }
})
test('目录联接不能用于更新写入或恢复', async t => {
  const { root, temp } = await fixture(t)
  const outside = path.join(temp, 'outside')
  await fs.mkdir(outside)
  await fs.symlink(outside, path.join(root, 'Data'), process.platform === 'win32' ? 'junction' : 'dir')
  const source = await write(temp, 'source', 'new')
  await assert.rejects(commitFiles(root, [{ relative: 'Data/test', source }]), /链接|联接/)
  assert.equal(await stat(path.join(outside, 'test')), null)
})
test('匿名 API 配额耗尽时仍通过官方订阅和发布页面查询，保留固定版本和校验值', async t => {
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  const requests = []
  globalThis.fetch = async url => {
    requests.push(url)
    if (url.includes('api.github.com')) return { ok: false, status: 403 }
    if (url.endsWith('.atom')) return { ok: true, url, text: async () => `<feed><id>tag:github.com,2008:/Chuanhsing/PoeCharm/commits/main</id><entry><id>tag:github.com,2008:Grit::Commit/${'a'.repeat(40)}</id></entry><entry><id>tag:github.com,2008:Grit::Commit/${'b'.repeat(40)}</id></entry></feed>` }
    if (url.endsWith('/latest')) return { ok: true, url: url.replace('/latest', '/tag/v2.67.2'), text: async () => '<h1>Release</h1>' }
    return { ok: true, url, text: async () => `<ul><li><a href="/PathOfBuildingCommunity/PathOfBuilding/releases/download/v2.67.2/PathOfBuildingCommunity-Portable.zip">Portable</a><clipboard-copy value="sha256:${'c'.repeat(64)}"></clipboard-copy></li><li><a href="/archive.zip">Source</a></li></ul>` }
  }
  assert.equal((await resolveRelease('charm')).url, `https://codeload.github.com/Chuanhsing/PoeCharm/zip/${'a'.repeat(40)}`)
  assert.deepEqual(await resolveRelease('pob'), { version: 'v2.67.2', url: 'https://github.com/PathOfBuildingCommunity/PathOfBuilding/releases/download/v2.67.2/PathOfBuildingCommunity-Portable.zip', digest: `sha256:${'c'.repeat(64)}` })
  assert.equal(requests.some(url => url.includes('api.github.com')), false)
  globalThis.fetch = async () => ({ ok: false, status: 403 })
  await assert.rejects(resolveRelease('pob'), /官方页面暂时限制访问/)
})
test('官方页面损坏、跨站跳转、预发布标签和非目标版本资产不能误报最新版本', async t => {
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  for (const [component, url, body] of [
    ['charm', 'https://github.com/Chuanhsing/PoeCharm/commits/main.atom', '<html>Login</html>'],
    ['pob', 'https://example.com/releases/tag/v1.0', ''],
    ['pob', 'https://github.com/PathOfBuildingCommunity/PathOfBuilding/releases/tag/v1.0-rc1', ''],
    ['pob', 'https://github.com/login', '']
  ]) {
    globalThis.fetch = async () => ({ ok: true, url, text: async () => body })
    await assert.rejects(resolveRelease(component))
  }
  for (const href of ['https://example.com/Portable.zip', '/PathOfBuildingCommunity/PathOfBuilding/releases/download/v1.1/PathOfBuildingCommunity-Portable.zip', '/PathOfBuildingCommunity/PathOfBuilding/releases/download/v1.0/setup.exe']) {
    globalThis.fetch = async url => ({ ok: true, url: url.replace('/latest', '/tag/v1.0'), text: async () => `<li><a href="${href}">Portable</a></li>` })
    await assert.rejects(resolveRelease('pob'), /未找到官方/)
  }
})
})()

// === Merged from pobLauncherIpc.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const fs = _m5_fs
  const vm = _m5_vm
  const EventEmitter = _m5_EventEmitter
  const errorMessage = _m5_errorMessage
test('启动助手 IPC 只允许主窗口主 frame，并固定分派安装更新', async () => {
  const source = (await fs.readFile(new URL('../electron/modules/ipc/pobLauncher.js', import.meta.url), 'utf8'))
    .replace(/^import .*$/gm, '').replace('export function', 'function')
  const handlers = new Map(), sends = [], calls = []
  const owner = { isDestroyed: () => false, webContents: { mainFrame: {}, send: (...args) => sends.push(args) } }
  const service = new EventEmitter()
  for (const method of ['getState', 'setDirectory', 'pickDirectory', 'install', 'start', 'stop']) {
    service[method] = async (...args) => { calls.push([method, ...args]); return { success: true } }
  }
  const context = { errorMessage, ipcMain: { handle: (channel, fn) => handlers.set(channel, fn) }, dialog: { showOpenDialog: async () => ({ canceled: true }) } }
  vm.runInNewContext(`${source}\nregisterPobLauncherHandlers`, context)(service, () => owner)
  const trusted = { sender: owner.webContents, senderFrame: owner.webContents.mainFrame }
  assert.equal(handlers.size, 7)
  assert.equal((await handlers.get('pob-launcher:install')({ sender: {} })).success, false)
  assert.equal((await handlers.get('pob-launcher:install')({ ...trusted, senderFrame: {} })).success, false)
  assert.equal(calls.length, 0)
  await handlers.get('pob-launcher:update')(trusted, { url: 'untrusted' })
  assert.deepEqual(calls[0], ['install', 'update'])
  await handlers.get('pob-launcher:install')(trusted)
  assert.equal(calls[1][1], 'install')
  assert.equal(await calls[1][2](), null)
  service.emit('state', { busy: true })
  assert.equal(sends[0][0], 'pob-launcher:state-changed')
  await handlers.get('pob-launcher:stop')(trusted, 'operation-1')
  assert.deepEqual(calls.at(-1), ['stop', 'operation-1'])
  const diagnostics = []
  service.report = (...args) => diagnostics.push(args)
  service.snapshot = () => ({ busy: false })
  owner.webContents.send = () => { throw new Error('Object has been destroyed') }
  assert.doesNotThrow(() => service.emit('state', { busy: true }))
  assert.equal(diagnostics[0][1], 'notification')
  service.start = async () => { throw new Error('injected IPC failure') }
  assert.equal((await handlers.get('pob-launcher:start')(trusted)).success, false)
  assert.equal(diagnostics.at(-1)[1], 'ipc')
})

test('preload 仅暴露固定频道，状态订阅解除后不再通知', async () => {
  const source = await fs.readFile(new URL('../electron/preload.cjs', import.meta.url), 'utf8')
  const renderer = new EventEmitter(), calls = []
  renderer.invoke = (...args) => { calls.push(args); return Promise.resolve({ success: true }) }
  let api
  vm.runInNewContext(source, { require: () => ({ ipcRenderer: renderer, contextBridge: { exposeInMainWorld: (_name, value) => { api = value } }, webUtils: {} }) })
  await api.getPobLauncherState()
  await api.setPobLauncherDirectory('')
  await api.pickPobLauncherDirectory()
  await api.installPobLauncher()
  await api.updatePobLauncher()
  await api.startPobLauncher()
  await api.stopPobLauncher('operation-1')
  assert.deepEqual(calls.map(call => call[0]), ['pob-launcher:state', 'pob-launcher:directory', 'pob-launcher:pick', 'pob-launcher:install', 'pob-launcher:update', 'pob-launcher:start', 'pob-launcher:stop'])
  assert.equal(calls.at(-1)[1], 'operation-1')
  let received = 0
  const off = api.onPobLauncherState(() => received++)
  renderer.emit('pob-launcher:state-changed', {}, {})
  off()
  renderer.emit('pob-launcher:state-changed', {}, {})
  assert.equal(received, 1)
})
})()

// === Merged from pobLauncherPanel.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const readFileSync = _m6_readFileSync
  const parse = _m6_parse
  const compileScript = _m6_compileScript
  const Vue = _m6_Vue
const snapshot = (values = {}) => ({ directory: 'installed', charm: { installed: true, version: '' },
  pob: { installed: true, version: '' }, supported: true, busy: false, revision: 1, ...values })
const flush = async () => { await new Promise(resolve => setImmediate(resolve)); await Vue.nextTick() }

test('真实卡片更新切换停止，其他操作禁用，阶段进度及过期快照处理', async t => {
  let receive, finish, stopped
  const api = { getState: async () => ({ success: true, state: snapshot() }), onState: listener => { receive = listener; return () => {} },
    update: () => new Promise(resolve => { finish = resolve }), stop: async id => {
      stopped = id
      return { success: true, state: snapshot({ busy: true, operation: 'update', operationId: 'one', revision: 4, stopping: true }) }
    } }
  const view = mountPanel(api); t.after(() => view.app.unmount()); await flush()
  const button = label => view.buttons().find(node => view.text(node) === label)
  assert.equal(button('安装').props.disabled, true)
  const updating = button('更新').props.onClick()
  receive(snapshot({ busy: true, cancellable: true, operation: 'update', operationId: 'one', revision: 3,
    message: 'PoeCharm · 解压', progress: { percent: 62, received: 62, total: 100, unit: 'bytes' } }))
  await flush()
  assert.equal(button('停止').props.disabled, false)
  for (const label of ['安装', '启动', '选择目录', '清空']) assert.equal(button(label).props.disabled, true)
  assert.match(view.text(view.root), /PoeCharm · 解压.*62 B \/ 100 B/)
  receive(snapshot({ revision: 2 }))
  await flush()
  assert.ok(button('停止'))
  await button('停止').props.onClick()
  await flush()
  assert.equal(stopped, 'one')
  assert.equal(button('正在停止…').props.disabled, true)
  finish({ success: false, cancelled: true, state: snapshot({ revision: 5, phase: 'cancelled', message: '已停止' }) })
  await updating; await flush()
  assert.equal(button('更新').props.disabled, false)
  assert.equal(button('安装').props.disabled, true)
})

test('IPC 拒绝后重新读状态，成功与业务错误不会变成连接失败', async t => {
  let current = snapshot()
  const api = { getState: async () => ({ success: !current.error, error: current.error, state: current }), onState: () => () => {},
    update: async () => { current = snapshot({ revision: current.revision + 1, operation: 'update', operationId: 'new', message: '更新完成' }); throw new Error('reply lost') } }
  const view = mountPanel(api); t.after(() => view.app.unmount()); await flush()
  const update = () => view.buttons().find(node => view.text(node) === '更新').props.onClick()
  await update(); await flush()
  assert.match(view.text(view.root), /更新完成/)
  assert.equal(view.find(node => node.props.type === 'error'), undefined)
  api.update = async () => { current = snapshot({ revision: current.revision + 1, phase: 'error', error: '解压失败：权限不足' }); throw new Error('reply lost') }
  await update(); await flush()
  assert.equal(view.find(node => node.props.type === 'error').props.title, '解压失败：权限不足')
  api.getState = async () => { throw new Error('disconnected') }
  await update(); await flush()
  assert.match(view.find(node => node.props.type === 'error').props.title, /通信失败/)
})
function mountPanel(api) {
  const source = readFileSync(new URL('../src/domains/pobExport/PobLauncherPanel.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const compiled = compileScript(descriptor, { id: 'dashboard-test', inlineTemplate: true, genDefaultAs: 'component' }).content
    .replace(/import \{([^}]+)\} from ["']vue["'];?/g, (_, names) => `const {${names.replace(/\s+as\s+/g, ':')}} = Vue;`)
    .replace(/^import .*$/gm, '')
  const component = new Function('Vue', 'electronApi', `${compiled}; return component`)(Vue, { pobLauncher: api })
  const node = (type, text = '') => ({ type, text, props: {}, children: [], parent: null })
  const renderer = Vue.createRenderer({
    createElement: type => node(type), createText: text => node('text', text), createComment: text => node('comment', text),
    setText: (target, text) => { target.text = text }, setElementText: (target, text) => { target.text = text; target.children = [] },
    patchProp: (target, key, previous, value) => { target.props[key] = value },
    insert(target, parent, anchor) {
      if (target.parent) target.parent.children.splice(target.parent.children.indexOf(target), 1)
      target.parent = parent
      const index = anchor ? parent.children.indexOf(anchor) : -1
      parent.children.splice(index < 0 ? parent.children.length : index, 0, target)
    },
    remove(target) { if (target.parent) target.parent.children.splice(target.parent.children.indexOf(target), 1) },
    parentNode: target => target.parent, nextSibling: target => target.parent?.children[target.parent.children.indexOf(target) + 1]
  })
  const root = node('root'); const app = renderer.createApp(component)
  for (const name of ['el-alert', 'el-button', 'el-input', 'el-tag', 'el-progress']) {
    app.component(name, { setup: (_, { attrs, slots }) => () => Vue.h(name === 'el-button' ? 'button' : 'div', attrs, slots.default?.()) })
  }
  app.mount(root)
  const flatten = target => [target, ...target.children.flatMap(flatten)]
  const text = target => target.text + target.children.map(text).join('')
  return { app, root, text, find: predicate => flatten(root).find(predicate), buttons: () => flatten(root).filter(target => target.type === 'button') }
}
})()
