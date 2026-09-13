import test from 'node:test'
import assert from 'node:assert/strict'
import { inflateSync } from 'node:zlib'
import { load } from 'cheerio'
import { convertBuild } from '../electron/modules/pobExport/converter.js'
import { convertInWorker } from '../electron/modules/pobExport/workerClient.js'
import { PobExportService } from '../electron/modules/pobExport/service.js'
import { requestPoeCnJson } from '../electron/modules/chaosRecipe/http.js'
import { buildFixture } from './fixtures/pobExport.js'

const decode = code => inflateSync(Buffer.from(code.replace(/-/g, '+').replace(/_/g, '/'), 'base64')).toString('utf8')

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
  assert.equal($('Spec').attr('treeVersion'), '3_29')
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
