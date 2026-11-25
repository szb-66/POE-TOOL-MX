import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { createHash as _m0_createHash } from 'node:crypto'
import { createLocalizationDictionary as _m0_createLocalizationDictionary } from '../electron/modules/localization/text.js'
import { PriceCheckService as _m0_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { leerCast as _m0_leerCast, foulbornGifts as _m0_foulbornGifts } from './fixtures/priceCheckFixedAndFoulbornItems.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { createHash as _m1_createHash } from 'node:crypto'
import { uniquePatternOffset as _m1_uniquePatternOffset, verifyMarketCompatibility as _m1_verifyMarketCompatibility } from '../scripts/verifyMarketCompatibility.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import _m2_fs from 'node:fs'
import _m2_os from 'node:os'
import _m2_path from 'node:path'
import { verifyMarketRuntime as _m2_verifyMarketRuntime } from '../scripts/runtime/marketDistribution.js'
import { marketRuntimeFixture as _m2_marketRuntimeFixture, successfulMarketRun as _m2_successfulMarketRun } from './fixtures/marketRuntime.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import _m3_fs from 'node:fs'
import _m3_os from 'node:os'
import _m3_path from 'node:path'
import { EventEmitter as _m3_EventEmitter } from 'node:events'
import { createHash as _m3_createHash } from 'node:crypto'
import { PassThrough as _m3_PassThrough, Writable as _m3_Writable } from 'node:stream'
import { MarketHostClient as _m3_MarketHostClient, MarketLocalizationService as _m3_MarketLocalizationService } from '../electron/modules/marketLocalization/service.js'
import { registerMarketLocalizationHandlers as _m3_registerMarketLocalizationHandlers } from '../electron/modules/marketLocalization/ipc.js'
import { serverChannelFailure as _m3_serverChannelFailure } from '../electron/modules/app/serverIpcPolicy.js'
import { marketStructureProof as _m3_marketStructureProof } from './fixtures/marketRuntime.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import _m4_fs from 'node:fs'
import { createHash as _m4_createHash } from 'node:crypto'
import { gunzipSync as _m4_gunzipSync } from 'node:zlib'
import { compatibleMarketTemplate as _m4_compatibleMarketTemplate, generateMarketLocalizationCatalog as _m4_generateMarketLocalizationCatalog, loadOfficialTradeItems as _m4_loadOfficialTradeItems, loadOfficialTradeStats as _m4_loadOfficialTradeStats, marketTemplate as _m4_marketTemplate, validateMarketCatalog as _m4_validateMarketCatalog } from '../scripts/generateMarketLocalizationCatalog.js'
import { fixedMarketRules as _m4_fixedMarketRules, pseudoMarketTranslations as _m4_pseudoMarketTranslations } from '../scripts/market-localization/fixedTranslations.js'
import { auditOfficialFilterCoverage as _m4_auditOfficialFilterCoverage, filterDisplayRows as _m4_filterDisplayRows, officialFilterSchema as _m4_officialFilterSchema, officialFilterSource as _m4_officialFilterSource } from '../scripts/market-localization/officialFilterTranslations.js'
import { auditMarketPseudoCoverage as _m4_auditMarketPseudoCoverage } from '../scripts/auditMarketPseudoCoverage.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import _m5_fs from 'node:fs'
import _m5_path from 'node:path'
import { MarketHostClient as _m5_MarketHostClient } from '../electron/modules/marketLocalization/service.js'

// === Merged from localizedUniqueMetadata.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const createHash = _m0_createHash
  const createLocalizationDictionary = _m0_createLocalizationDictionary
  const PriceCheckService = _m0_PriceCheckService
  const leerCast = _m0_leerCast
  const foulbornGifts = _m0_foulbornGifts
const entries = JSON.parse(readFileSync(new URL('./fixtures/price-check-fixed-foulborn-entries.json', import.meta.url)))
const catalog = JSON.parse(readFileSync(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url)))
function fixture(data = entries) {
  const searches = []
  const service = new PriceCheckService({ auth: { getStatus: () => ({ authenticated: true }) },
    client: { server: { id: 'international', label: '国际服' }, clearCache() {},
      search: async (league, query) => { searches.push(query); return { id: 'fixture', total: 0, result: [] } },
      fetch: async () => ({ result: [] }) }, catalog, manualInputOnly: true, localizationProvider: () => data })
  return { service, searches }
}

test('共鸣之面固定数值尾注仅作显示，完整五词缀和实际50伤害均进入国际服查询', async () => {
  const { service, searches } = fixture()
  const first = await service.check({ league: 'Covens', text: leerCast, options: { initialSelection: 'all' } })
  assert.equal(first.model.identity.name, 'Leer Cast')
  assert.equal(first.model.stats.length, 5)
  assert.deepEqual(first.model.unknownStats, [])
  const aura = first.model.stats.find(s => s.id === 'explicit.stat_637766438')
  assert.deepEqual(aura.values, [50])
  assert.deepEqual(first.model.stats.find(s => s.id === 'explicit.stat_2154246560').values, [-25])
  assert.equal(first.model.stats.find(s => s.id === 'explicit.stat_2154246560').displayText, '伤害降低 25%')
  assert.equal(aura.displayText, '你和 7.5 米范围内的友军伤害提高 50% — 数值不可调整')
  assert.equal(searches[0].query.stats[0].filters.length, 5)
  assert.equal(searches[0].query.stats[0].filters.find(s => s.id === 'explicit.stat_2154246560').value.min, -25)
  const plain = fixture()
  await plain.service.check({ league: 'Covens', text: leerCast.replace(' — 数值不可调整', ''), options: { initialSelection: 'all' } })
  assert.deepEqual(searches[0], plain.searches[0])
  const retry = await service.rerun({ model: first.model })
  assert.equal(retry.model.stats.find(s => s.id === aura.id).displayText, aura.displayText)
  assert.deepEqual(searches[1], searches[0])
})

test('秽生神赐使用普通传奇官方身份及独立秽生过滤，保留完整原文与七条词缀', async () => {
  const { service, searches } = fixture()
  const first = await service.check({ league: 'Covens', text: foulbornGifts, options: { initialSelection: 'all' } })
  assert.equal(first.model.identity.name, 'Gifts from Above')
  assert.equal(first.model.identity.type, 'Diamond Ring')
  assert.equal(first.model.presentation.texts[first.model.identity.displayName], '秽生神赐')
  assert.equal(first.model.stateFilters.mutated, 'true')
  assert.equal(first.model.stats.length, 7)
  assert.deepEqual(first.model.unknownStats, [])
  assert.equal(searches[0].query.filters.misc_filters.filters.mutated.option, 'true')
  assert.ok(first.model.stats.some(s => s.sourceSubtype === 'foulborn' && s.values[0] === 38))
  assert.ok(first.model.stats.some(s => s.displayText === '當你暴擊時觸發等級 10 的奉獻 — 数值不可调整'))
})

test('未知词缀或错误尾注不能借固定值标记绕过解析', () => {
  const resolver = createLocalizationDictionary(entries)
  for (const text of [leerCast.replace('你和 7.5 米范围内的友军伤害提高 50%', '未知效果提高 50%'),
    leerCast.replace('数值不可调整', '数值不可调正'), leerCast.replace('你和 7.5 米范围内的友军伤害提高 50%', '')]) {
    assert.throws(() => resolver.resolve(text), error => error.code === 'LOCALIZATION_UNRESOLVED')
  }
})

test('多行复合词缀的尾注不拆散参数或抹掉显示原文', () => {
  const en = '+{0} to maximum Life\n+{1} to maximum Mana'
  const resolver = createLocalizationDictionary([...entries, { kind: 'stat', table: 'fixture', id: 'compound', field: 'variant:0',
    en, cn: '+{0} 生命\n+{1} 魔力', sourceHash: createHash('sha256').update(en).digest('hex') }])
  const original = '+10 生命\n+20 魔力 — 数值不可调整'
  const resolved = resolver.resolve(`物品类别: 戒指\n稀有度: 稀有\n测试\n宝钻戒指\n--------\n物品等级: 80\n--------\n${original}`)
  assert.ok(resolved.text.endsWith('+10 to maximum Life\n+20 to maximum Mana'))
  assert.ok(resolved.lineMappings.some(pair => pair.original === original && pair.canonical === '+10 to maximum Life\n+20 to maximum Mana'))
})

test('简繁英文固定值尾注均保留原文显示，并形成相同的官方过滤条件', async () => {
  const body = '你和 7.5 米范围内的友军伤害提高 50% — 数值不可调整'
  const alternatives = [body,
    '你跟 7.5 公尺內的友方增加 50% 傷害 — 無法使用的值',
    'You and Allies within 7.5 metres gain 50% increased Damage — Unscalable Value']
  let expected
  for (const original of alternatives) {
    const { service, searches } = fixture()
    const { model } = await service.check({ league: 'Covens', text: leerCast.replace(body, original), options: { initialSelection: 'all' } })
    assert.equal(model.stats.find(s => s.id === 'explicit.stat_637766438').displayText, original)
    if (expected) assert.deepEqual(searches[0], expected)
    else expected = searches[0]
  }
})

test('秽生模板仅作用于传奇名称，未知名称、错底材或不可信模板均不能发查询', async () => {
  for (const [text, data] of [
    [foulbornGifts.replace('秽生神赐', '秽生未知传奇'), entries],
    [foulbornGifts.replace('宝钻戒指', '节庆之面'), entries],
    [foulbornGifts, entries.filter(e => e.id !== 'MutatedUniqueName')],
    [foulbornGifts, entries.map(e => e.id === 'MutatedUniqueName' ? { ...e, sourceHash: '0'.repeat(64) } : e)]
  ]) {
    const { service, searches } = fixture(data)
    await assert.rejects(service.check({ league: 'Covens', text }))
    assert.equal(searches.length, 0)
  }
})

test('英文普通复制文本仅凭可信官方身份保留秽生名称和状态，不依赖详细词缀头', async () => {
  const resolver = createLocalizationDictionary(entries)
  const text = resolver.resolve(foulbornGifts).text.replace('{ Foulborn Unique Modifier }', '{ Unique Modifier }')
  const { service, searches } = fixture()
  const { model } = await service.check({ league: 'Covens', text, options: { initialSelection: 'all' } })
  assert.equal(model.identity.name, 'Gifts from Above')
  assert.equal(model.identity.displayName, 'Foulborn Gifts from Above')
  assert.equal(model.stateFilters.mutated, 'true')
  assert.equal(searches[0].query.filters.misc_filters.filters.mutated.option, 'true')
})
})()

// === Merged from marketCompatibility.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const createHash = _m1_createHash
  const uniquePatternOffset = _m1_uniquePatternOffset
  const verifyMarketCompatibility = _m1_verifyMarketCompatibility
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const names = ['lookup', 'searchBuilder', 'stringCtor', 'stringDtor', 'itemsReader', 'statsReader', 'filtersReader']
const offsets = [0, 0x100, 0x200, 0x300, 0x500, 0x800, 0xb00]
const address = value => `0x${value.toString(16)}`

function fixture() {
  const bytes = Buffer.alloc(0x2200)
  const pe = 0x80, optional = pe + 24, sections = optional + 0xf0
  bytes.writeUInt16LE(0x5a4d); bytes.writeUInt32LE(pe, 0x3c); bytes.writeUInt32LE(0x4550, pe)
  bytes.writeUInt16LE(0x8664, pe + 4); bytes.writeUInt16LE(4, pe + 6); bytes.writeUInt32LE(0x12345678, pe + 8)
  bytes.writeUInt16LE(0xf0, pe + 20); bytes.writeUInt16LE(0x20b, optional)
  bytes.writeBigUInt64LE(0x140000000n, optional + 24); bytes.writeUInt32LE(0x7000, optional + 56); bytes.writeUInt32LE(16, optional + 108)
  bytes.writeUInt32LE(0x5000, optional + 136); bytes.writeUInt32LE(7 * 12, optional + 140)
  bytes.writeUInt32LE(0x6000, optional + 152); bytes.writeUInt32LE(12, optional + 156)
  for (const [index, name, rva, raw, size, flags] of [
    [0, '.text', 0x1000, 0x400, 0x1600, 0x60000020], [1, '.rdata', 0x4000, 0x1a00, 0x200, 0x40000040],
    [2, '.pdata', 0x5000, 0x1c00, 0x200, 0x40000040], [3, '.reloc', 0x6000, 0x1e00, 0x200, 0x40000040]
  ]) {
    const at = sections + index * 40
    bytes.write(name, at, 'ascii'); bytes.writeUInt32LE(size, at + 8); bytes.writeUInt32LE(rva, at + 12)
    bytes.writeUInt32LE(size, at + 16); bytes.writeUInt32LE(raw, at + 20); bytes.writeUInt32LE(flags, at + 36)
  }
  bytes.fill(0xcc, 0x400, 0x1a00)
  const profile = { schemaVersion: 1, structureVersion: 1, game: 'poe1', abi: 'poe1-market-json16-msvc-string32-v1', validatedInGame: true,
    buildId: 'reference-build', image: { imageBase: '0x140000000', timeDateStamp: '0x12345678', sizeOfImage: '0x7000' }, sites: [] }
  for (const [index, name] of names.entries()) {
    const start = 0x400 + offsets[index], size = index < 4 ? 96 : 384
    bytes.fill(0x90 + index, start, start + size)
    for (let n = 0; n < 64; n++) bytes[start + n] = (index * 29 + n) % 251
    bytes.writeUInt32LE(0x1000 + offsets[index], 0x1c00 + index * 12)
    bytes.writeUInt32LE(0x1000 + offsets[index] + size, 0x1c04 + index * 12)
    bytes.writeUInt32LE(0x4100, 0x1c08 + index * 12)
    profile[name] = { rva: address(0x1000 + offsets[index]), prologue: bytes.subarray(start, start + 64).toString('hex'), bodySize: size }
  }
  const fields = [['label', 'type', 'text', 'name'], ['label', 'text', 'type', 'text'], ['title', 'text', 'text', 'placeholder']]
  let keyOffset = 0
  for (const [group, section] of ['items', 'stats', 'filters'].entries()) for (let index = 0; index < 4; index++) {
    const rva = 0x1000 + offsets[4 + group] + 80 + index * 64, callRva = rva + 10, returnRva = callRva + 5
    const context = Buffer.from('488d1500000000488bcbe800000000488bd00fb7480e0fb7c1', 'hex')
    context.writeInt32LE(0x4000 + keyOffset - rva - 7, 3); context.writeInt32LE(0x1000 - returnRva, 11)
    context.copy(bytes, rva - 0x1000 + 0x400)
    bytes.write(`${fields[group][index]}\0`, 0x1a00 + keyOffset, 'ascii'); keyOffset += fields[group][index].length + 1
    profile.sites.push({ section, field: fields[group][index], fieldKey: fields[group][index], contextRva: address(rva), callRva: address(callRva),
      returnRva: address(returnRva), contextBytes: context.toString('hex'), callBytes: context.subarray(10, 15).toString('hex') })
  }
  for (const [index, name] of names.entries()) {
    const body = bytes.subarray(0x400 + offsets[index], 0x400 + offsets[index] + profile[name].bodySize)
    profile[name].bodySha256 = hash(body); profile[name].bodyBytes = body.toString('hex')
  }
  bytes.writeUInt32LE(0x4000, 0x1e00); bytes.writeUInt32LE(12, 0x1e04); bytes.writeUInt16LE(0xa180, 0x1e08)
  profile.sha256 = hash(bytes)
  return { bytes, profile }
}

function moved(bytes, delta = 0x10000) {
  const result = Buffer.from(bytes), optional = 0x98, sections = optional + 0xf0
  const add = offset => result.writeUInt32LE(result.readUInt32LE(offset) + delta, offset)
  for (const offset of [optional + 56, optional + 136, optional + 152]) add(offset)
  for (let index = 0; index < 4; index++) add(sections + index * 40 + 12)
  for (let index = 0; index < 7; index++) for (const offset of [0, 4, 8]) add(0x1c00 + index * 12 + offset)
  add(0x1e00)
  return result
}

test('市集指令查找只接受唯一匹配，拒绝零匹配、多匹配和空指纹', () => {
  assert.equal(uniquePatternOffset(Buffer.from('abcde'), Buffer.from('bcd')), 1)
  assert.throws(() => uniquePatternOffset(Buffer.from('abcde'), Buffer.from('zzz')), /没有匹配/)
  assert.throws(() => uniquePatternOffset(Buffer.from('abcabc'), Buffer.from('abc')), /多个匹配/)
  assert.throws(() => uniquePatternOffset(Buffer.from('abc'), Buffer.alloc(0)), /不能为空/)
})

test('市集结构验证接受七个完整函数、十二调用点和独立只读字段键', () => {
  const { bytes, profile } = fixture(), result = verifyMarketCompatibility(bytes, profile)
  assert.equal(result.passed, true); assert.equal(result.executableSha256, hash(bytes))
  assert.equal(result.siteContexts, 12); assert.equal(result.checkedRelocations, 1)
  assert.deepEqual(Object.values(result.methods).map(method => method.matches), Array(7).fill(1))
})

test('小更新改变时间戳和无关数据仍按结构通过，不要求旧EXE哈希', () => {
  const { bytes, profile } = fixture()
  bytes.writeUInt32LE(0xabcdef01, 0x88); bytes[0x1b80] ^= 1
  const result = verifyMarketCompatibility(bytes, profile)
  assert.equal(result.passed, true); assert.notEqual(result.executableSha256, profile.sha256)
  assert.equal(result.resolvedProfile.image.timeDateStamp, '0xabcdef01')
  assert.equal(result.resolvedProfile.validatedInGame, false)
  assert.equal(result.resolvedProfile.referenceValidatedInGame, true)
  assert.equal(result.resolvedProfile.structurallyCompatible, true)
  assert.equal(profile.validatedInGame, true, '结构解析不得改写已验基准')
})

test('关键代码及字段一起移位时由唯一指纹和函数内偏移解析新RVA', () => {
  const { bytes, profile } = fixture(), result = verifyMarketCompatibility(moved(bytes), profile)
  assert.equal(result.methods.lookup.rva, '0x11000')
  assert.equal(result.resolvedProfile.sites[0].contextRva, '0x11550')
  assert.equal(result.resolvedProfile.image.sizeOfImage, '0x17000')
})

test('前导相同但完整函数尾部改变必须拒绝，包括各目录reader', () => {
  for (const [index, name] of names.entries()) {
    const { bytes, profile } = fixture(); bytes[0x400 + offsets[index] + profile[name].bodySize - 1] ^= 1
    assert.throws(() => verifyMarketCompatibility(bytes, profile), /完整.*改变/, name)
  }
})

test('市集结构验证拒绝指纹缺失及多匹配', () => {
  for (const duplicate of [false, true]) {
    const { bytes, profile } = fixture()
    if (duplicate) bytes.subarray(0x400, 0x440).copy(bytes, 0x1700)
    else bytes[0x400] ^= 1
    assert.throws(() => verifyMarketCompatibility(bytes, profile), duplicate ? /多个匹配/ : /没有匹配/)
  }
})

test('调用点不能因资料一致便接受错误CALL目标', () => {
  const { bytes, profile } = fixture(), site = profile.sites[0], at = 0x400 + 0x500 + 80
  bytes[at + 11] ^= 1; site.contextBytes = bytes.subarray(at, at + 25).toString('hex'); site.callBytes = bytes.subarray(at + 10, at + 15).toString('hex')
  profile.itemsReader.bodyBytes = bytes.subarray(0x900, 0x900 + 384).toString('hex'); profile.itemsReader.bodySha256 = hash(bytes.subarray(0x900, 0x900 + 384))
  assert.throws(() => verifyMarketCompatibility(bytes, profile), /调用点.*目录读取函数/)
})

test('字段键改变或移到可写数据节均拒绝', () => {
  for (const writable of [false, true]) {
    const { bytes, profile } = fixture()
    if (writable) bytes.writeUInt32LE(0xc0000040, 0x98 + 0xf0 + 40 + 36)
    else bytes[0x1a00] ^= 1
    assert.throws(() => verifyMarketCompatibility(bytes, profile), writable ? /只读/ : /字段键已改变/)
  }
})

test('关键代码节可写时即使正文完全匹配也拒绝', () => {
  const { bytes, profile } = fixture()
  bytes.writeUInt32LE(0xe0000020, 0x98 + 0xf0 + 36)
  assert.throws(() => verifyMarketCompatibility(bytes, profile), /只读可执行代码节/)
})

test('完整函数边界目录、截断PE与关键ASLR重定位必须拒绝', () => {
  const boundary = fixture(); boundary.bytes.writeUInt32LE(0x2000, 0x1c04)
  assert.throws(() => verifyMarketCompatibility(boundary.bytes, boundary.profile), /边界已改变/)
  const relocation = fixture(); relocation.bytes.writeUInt32LE(0x1000, 0x1e00); relocation.bytes.writeUInt16LE(0xa050, 0x1e08)
  assert.throws(() => verifyMarketCompatibility(relocation.bytes, relocation.profile), /ASLR/)
  const truncated = fixture(); assert.throws(() => verifyMarketCompatibility(truncated.bytes.subarray(0, 0x1c40), truncated.profile), /边界/)
})

test('未知ABI、未验基准和不完整调用点不进入结构复用', () => {
  for (const mutate of [profile => { profile.abi = 'unknown' }, profile => { profile.validatedInGame = false }, profile => { profile.sites.pop() }]) {
    const { bytes, profile } = fixture(); mutate(profile)
    assert.throws(() => verifyMarketCompatibility(bytes, profile))
  }
})
})()

// === Merged from marketDistribution.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const fs = _m2_fs
  const os = _m2_os
  const path = _m2_path
  const verifyMarketRuntime = _m2_verifyMarketRuntime
  const marketRuntimeFixture = _m2_marketRuntimeFixture
  const successfulMarketRun = _m2_successfulMarketRun
test('市集分发检查拒绝缺件、篡改、未实测版本与错误自检协议', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-market-dist-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  assert.throws(() => verifyMarketRuntime(root), /分发不完整/)
  const { runtime } = marketRuntimeFixture(root)
  assert.equal(verifyMarketRuntime(root, { run: successfulMarketRun }).ready, true)
  fs.writeFileSync(path.join(runtime, 'MarketLocalizationHook.dll'), 'tampered')
  assert.throws(() => verifyMarketRuntime(root, { run: successfulMarketRun }), /指纹不一致/)
  fs.writeFileSync(path.join(runtime, 'MarketLocalizationHook.dll'), '')
  assert.throws(() => verifyMarketRuntime(root, { run: () => ({ status: 1 }) }), /原生自检失败/)
  assert.throws(() => verifyMarketRuntime(root, { run: (file, args, options) => args[0] === '--market-host' ? { status: 0, stdout: '{}' } : successfulMarketRun(file, args, options) }), /控制进程自检失败/)
  assert.throws(() => verifyMarketRuntime(root, { run: (file, args, options) => {
    const result = successfulMarketRun(file, args, options)
    if (args[0] === '--market-host') { const message = JSON.parse(result.stdout); delete message.data.pipeSecurityCases; result.stdout = JSON.stringify(message) }
    return result
  } }), /控制进程自检失败/)
  assert.throws(() => verifyMarketRuntime(root, { run: (file, args, options) => {
    const result = successfulMarketRun(file, args, options)
    if (args[0] === '--market-host') { const message = JSON.parse(result.stdout); delete message.data.validatedRules; result.stdout = JSON.stringify(message) }
    return result
  } }), /控制进程自检失败/)
  const metadata = JSON.parse(fs.readFileSync(path.join(runtime, 'market-dependencies.json'), 'utf8'))
  assert.throws(() => verifyMarketRuntime(root, { run: (file, args, options) => {
    const result = successfulMarketRun(file, args, options)
    if (args[0] === '--market-host') { const message = JSON.parse(result.stdout); delete message.data.resumeCases; result.stdout = JSON.stringify(message) }
    return result
  } }), /控制进程自检失败/)
  assert.throws(() => verifyMarketRuntime(root, { run: (file, args, options) => {
    const result = successfulMarketRun(file, args, options)
    if (args[0] === '--market-host') { const message = JSON.parse(result.stdout); delete message.data.structureCases; result.stdout = JSON.stringify(message) }
    return result
  } }), /控制进程自检失败/)
  metadata.minhookCommit = 'unknown'
  fs.writeFileSync(path.join(runtime, 'market-dependencies.json'), JSON.stringify(metadata))
  assert.throws(() => verifyMarketRuntime(root, { run: successfulMarketRun }), /指纹不一致/)
})
})()

// === Merged from marketLocalization.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const fs = _m3_fs
  const os = _m3_os
  const path = _m3_path
  const EventEmitter = _m3_EventEmitter
  const createHash = _m3_createHash
  const PassThrough = _m3_PassThrough
  const Writable = _m3_Writable
  const MarketHostClient = _m3_MarketHostClient
  const MarketLocalizationService = _m3_MarketLocalizationService
  const registerMarketLocalizationHandlers = _m3_registerMarketLocalizationHandlers
  const serverChannelFailure = _m3_serverChannelFailure
  const marketStructureProof = _m3_marketStructureProof
const flush = () => new Promise(resolve => setImmediate(resolve))

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-market-manager-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const executable = path.join(root, 'LocalizationHelper.exe')
  const catalogPath = path.join(root, 'catalog.json')
  fs.writeFileSync(executable, 'fixture')
  fs.writeFileSync(path.join(root, 'MarketLocalizationHook.dll'), 'fixture')
  const profilePath = path.join(root, 'market-compatibility.json')
  fs.writeFileSync(profilePath, JSON.stringify({ schemaVersion: 1, game: 'poe1', buildId: '26694821', gameVersion: '3.30.0b', validatedInGame: true,
    sha256: '7f762cadbe0a7315091e105121010d2f35296db8046294e0bf49aacfff67db3c', ...marketStructureProof() }))
  fs.writeFileSync(path.join(root, 'market-dependencies.json'), JSON.stringify({ protocolVersion: 1,
    dllSha256: createHash('sha256').update('fixture').digest('hex'), profileSha256: createHash('sha256').update(fs.readFileSync(profilePath)).digest('hex') }))
  const catalog = { schemaVersion: 1, game: 'poe1', sourceLocale: 'fr', buildId: '26694821', gameVersion: '3.30.0b',
    executableSha256: '7f762cadbe0a7315091e105121010d2f35296db8046294e0bf49aacfff67db3c', localizationReleaseId: 'release-one',
    rules: [{ section: 'filters', field: 'title', id: 'type', cn: '类型筛选', tw: '類型篩選' }] }
  fs.writeFileSync(catalogPath, JSON.stringify(catalog))
  const managed = { mode: 'simplified', gameDirectory: root, resourceVersion: 'release-one', mappingState: 'active' }
  const timers = new Set()
  const calls = []
  let processes = []
  let probes = 0
  let snapshot = { state: 'active', pid: 42, mode: 'simplified' }
  let nativeError = null
  let translatedSession = false
  const host = {
    async request(operation, input) {
      calls.push([operation, input])
      if (operation === 'resume' && !translatedSession) throw Object.assign(new Error('当前游戏未加载可接续的市集翻译，请重启游戏'), { code: 'MARKET_RESUME_UNAVAILABLE' })
      if (nativeError) throw nativeError
      if (operation === 'enable') translatedSession = true
      return structuredClone(snapshot)
    },
    async close() { calls.push(['close']) }
  }
  const options = { executable, catalogPath, storageRoot: root, serverId: 'international', platform: 'win32',
    localization: { getStatus: () => ({ ...managed }) }, processProbe: async () => { probes++; return processes }, hostFactory: () => host,
    setTimeoutFn: callback => { const timer = { callback, unref() {} }; timers.add(timer); return timer }, clearTimeoutFn: timer => timers.delete(timer)
  }
  const service = new MarketLocalizationService(options)
  t.after(() => service.shutdown())
  return { service, calls, managed, catalog, catalogPath, timers, host, options, settingsPath: path.join(root, 'market-settings.json'),
    get probes() { return probes },
    set processes(value) { processes = value }, set snapshot(value) { snapshot = value }, set nativeError(value) { nativeError = value },
    async pulse() { const timer = [...timers][0]; assert.ok(timer, 'expected an armed polling timer'); timers.delete(timer); timer.callback(); await service.pollTask; await flush() }
  }
}

test('市集翻译默认关闭，首次开启后保存偏好并等待游戏', async t => {
  const f = fixture(t)
  assert.equal(f.service.getStatus().state, 'disabled')
  await f.service.initialize()
  assert.equal(f.service.getStatus().autoEnabled, false)
  assert.equal(f.probes, 0)
  assert.deepEqual(f.calls, [])
  const first = f.service.enable()
  assert.equal(f.service.enable(), first)
  const waiting = await first
  assert.equal(waiting.state, 'waiting')
  assert.equal(waiting.enabled, true)
  assert.equal(waiting.autoEnabled, true)
  assert.deepEqual(JSON.parse(fs.readFileSync(f.settingsPath, 'utf8')), { autoEnabled: true })
  assert.equal(f.probes, 1)
  await f.pulse()
  assert.deepEqual(f.calls, [])
  assert.equal(f.service.getStatus().state, 'waiting')
  f.processes = [42]
  await f.pulse()
  assert.equal(f.service.getStatus().state, 'active')
  assert.deepEqual(f.calls.map(call => call[0]), ['enable'])
  assert.equal(f.calls[0][1].mode, 'simplified')
  assert.equal(f.calls[0][1].rules[0].cn, '类型筛选')
  await f.service.enable()
  assert.equal(f.calls.length, 1)
})

test('游戏运行时开启开关仅探测恢复，未加载本组件则等待重启，词库失效不注入', async t => {
  const f = fixture(t)
  f.processes = [42]
  assert.equal((await f.service.enable()).restartRequired, true)
  await f.pulse()
  assert.deepEqual(f.calls.map(call => call[0]), ['resume', 'close'])
  await f.service.disable()
  f.processes = []
  fs.writeFileSync(f.catalogPath, JSON.stringify({ schemaVersion: 2, rules: [] }))
  await assert.rejects(f.service.enable(), /词库格式/)
  assert.equal(f.calls.some(call => call[0] === 'enable'), false)
})

test('市集目录必须包含正确游戏、来源语言、Build、补丁及可执行文件身份', async t => {
  for (const [field, wrong] of [['game', 'poe2'], ['sourceLocale', 'ko'], ['buildId', '26673342'],
    ['gameVersion', '3.29.3b'], ['executableSha256', 'f'.repeat(64)]]) {
    for (const missing of [false, true]) {
      const f = fixture(t)
      if (missing) delete f.catalog[field]
      else f.catalog[field] = wrong
      fs.writeFileSync(f.catalogPath, JSON.stringify(f.catalog))
      await assert.rejects(f.service.enable(), /词库与兼容基准来源不匹配/)
      assert.equal(f.service.getStatus().enabled, false)
      assert.equal(f.timers.size, 0)
      assert.deepEqual(f.calls, [])
    }
  }
})

test('市集目录保留来源版本格式校验，无效版本标识均不启用', async t => {
  for (const [release, expected] of [[null, /版本标识无效/],
    ['', /版本标识无效/], [42, /版本标识无效/]]) {
    const f = fixture(t)
    f.catalog.localizationReleaseId = release
    fs.writeFileSync(f.catalogPath, JSON.stringify(f.catalog))
    await assert.rejects(f.service.enable(), expected)
    assert.equal(f.service.getStatus().enabled, false)
    assert.deepEqual(f.calls, [])
  }
})

test('兼容词库不因当前受管发布版本变化而失效，动态规则必须保留精确原文', async t => {
  const f = fixture(t)
  f.catalog.rules.push({ section: 'stats', field: 'text', id: 'explicit.fixture', source: '+#% de dégâts', cn: '伤害提高 #%' })
  fs.writeFileSync(f.catalogPath, JSON.stringify(f.catalog))
  f.managed.resourceVersion = 'release-next-game'
  assert.equal((await f.service.enable()).state, 'waiting')
  f.processes = [42]; await f.pulse()
  assert.equal(f.service.getStatus().state, 'active')
  assert.deepEqual(f.calls[0][1].rules, f.catalog.rules)
})

test('旧动态目录没有精确原文时停止，不能仅凭稳定ID套用译文', async t => {
  for (const section of ['stats', 'items']) {
    const f = fixture(t)
    f.catalog.rules.push({ section, field: 'text', id: 'fixture', cn: '旧译文' })
    fs.writeFileSync(f.catalogPath, JSON.stringify(f.catalog))
    await assert.rejects(f.service.enable(), /动态词库缺少精确原文/)
    assert.deepEqual(f.calls, [])
    assert.equal(f.service.getStatus().enabled, false)
  }
})

test('固定分类标签可按独立白名单复用，动态标签不能冒充固定分类', async t => {
  const f = fixture(t)
  f.catalog.rules.push({ section: 'stats', field: 'label', id: 'pseudo', cn: '综合' }, { section: 'items', field: 'label', id: 'weapon', cn: '武器' })
  fs.writeFileSync(f.catalogPath, JSON.stringify(f.catalog))
  assert.equal((await f.service.enable()).state, 'waiting')
  await f.service.disable()
  for (const rule of [
    { section: 'stats', field: 'label', id: 'explicit.stat_fixture', cn: '新效果' },
    { section: 'stats', field: 'text', id: 'pseudo', cn: '并非分类标签' },
    { section: 'items', field: 'type', id: 'weapon', cn: '并非分类标签' }
  ]) {
    fs.writeFileSync(f.catalogPath, JSON.stringify({ ...f.catalog, rules: [rule] }))
    await assert.rejects(f.service.enable(), /动态词库缺少精确原文/)
  }
})

test('兼容基准缺少任一完整函数指纹时停止，不用前导指纹替代完整结构', async t => {
  const f = fixture(t)
  const profilePath = path.join(path.dirname(f.catalogPath), 'market-compatibility.json')
  const metadataPath = path.join(path.dirname(f.catalogPath), 'market-dependencies.json')
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'))
  delete profile.filtersReader.bodySha256
  fs.writeFileSync(profilePath, JSON.stringify(profile))
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
  metadata.profileSha256 = createHash('sha256').update(fs.readFileSync(profilePath)).digest('hex')
  fs.writeFileSync(metadataPath, JSON.stringify(metadata))
  await assert.rejects(f.service.enable(), /兼容资料校验失败/)
  assert.deepEqual(f.calls, [])
})

test('native-tw繁体可使用同Build目录，不要求简体签名资源的release一致', async t => {
  for (const revision of ['', 'native-tw']) {
    const f = fixture(t)
    f.managed.mode = 'traditional'
    f.managed.resourceVersion = revision
    f.snapshot = { state: 'active', pid: 42, mode: 'traditional' }
    assert.equal((await f.service.enable()).state, 'waiting')
    f.processes = [42]
    await f.pulse()
    assert.equal(f.service.getStatus().state, 'active')
    assert.equal(f.calls[0][1].mode, 'traditional')
  }
})

test('停用幂等并说明游戏目录缓存需重启，取消等待不在后续启动游戏时注入', async t => {
  const f = fixture(t)
  await f.service.enable()
  await f.service.disable()
  assert.equal(f.timers.size, 0)
  f.processes = [42]
  await flush()
  assert.deepEqual(f.calls, [])
  f.processes = []
  await f.service.enable()
  f.processes = [42]
  await f.pulse()
  const stopped = await f.service.disable()
  assert.equal(stopped.restartRequired, true)
  assert.match(stopped.reason, /重启游戏/)
  await f.service.disable()
  assert.equal(f.calls.filter(call => call[0] === 'close').length, 1)
  assert.equal(f.timers.size, 0)
})

test('同词库版本简繁切换也停止旧会话，不在同一进程自动重配', async t => {
  const f = fixture(t)
  await f.service.enable(); f.processes = [42]; await f.pulse()
  f.managed.mode = 'traditional'
  await f.pulse()
  assert.equal(f.service.getStatus().state, 'error')
  assert.match(f.service.getStatus().reason, /模式、组件或词库已变化/)
  assert.deepEqual(f.calls.map(call => call[0]), ['enable', 'close'])
  assert.equal(f.timers.size, 1)
  await f.pulse()
  assert.equal(f.calls.filter(call => call[0] === 'enable').length, 1)
  f.processes = []; await f.pulse()
  f.processes = [43]; f.snapshot = { state: 'active', pid: 43, mode: 'traditional' }; await f.pulse()
  assert.equal(f.calls.at(-1)[1].mode, 'traditional')
})

test('目录文件被替换或组件哈希不符时停止旧会话，不能继续使用内存旧词库', async t => {
  const f = fixture(t)
  await f.service.enable(); f.processes = [42]; await f.pulse()
  fs.writeFileSync(f.catalogPath, JSON.stringify({ schemaVersion: 1, rules: [{ section: 'stats', field: 'text', id: 'new', cn: '新译文' }] }))
  await f.pulse()
  assert.equal(f.service.getStatus().state, 'error')
  assert.match(f.service.getStatus().reason, /词库已变化/)
  assert.equal(f.calls.filter(call => call[0] === 'enable').length, 1)
  f.processes = []
  fs.writeFileSync(path.join(path.dirname(f.catalogPath), 'MarketLocalizationHook.dll'), 'changed-component')
  await assert.rejects(f.service.enable(), /组件或兼容资料校验失败/)
  assert.equal(f.calls.filter(call => call[0] === 'enable').length, 1)
})

test('组件未确认请求的简繁模式和目标PID时不能显示已启用', async t => {
  const f = fixture(t)
  await f.service.enable(); f.processes = [42]
  f.snapshot = { state: 'active', mode: 'traditional', pid: 42 }
  await f.pulse()
  assert.equal(f.service.getStatus().state, 'error')
  assert.match(f.service.getStatus().reason, /未确认启用/)
  assert.deepEqual(f.calls.map(call => call[0]), ['enable', 'close'])
})

test('版本或冲突失败不重试同一PID，游戏重启后自动开始新会话', async t => {
  const f = fixture(t)
  await f.service.enable(); f.processes = [42]
  const nativeError = new Error('市集结构无法确认兼容：filtersReader 完整指纹不匹配，已停止翻译')
  f.nativeError = nativeError
  await f.pulse()
  assert.equal(f.service.getStatus().state, 'error')
  assert.equal(f.service.getStatus().reason, nativeError.message)
  assert.equal(f.service.getStatus().restartRequired, true)
  assert.equal(f.service.getStatus().autoEnabled, true)
  assert.equal(f.timers.size, 1)
  await f.pulse()
  assert.equal(f.calls.filter(call => call[0] === 'enable').length, 1)
  f.nativeError = null; f.processes = []
  await f.pulse(); f.processes = [43]; await f.pulse()
  f.snapshot = { state: 'disabled', reason: '游戏已退出' }
  await f.pulse()
  assert.equal(f.service.getStatus().enabled, true)
  assert.equal(f.service.getStatus().state, 'waiting')
  assert.equal(f.service.getStatus().restartRequired, false)
  assert.equal(f.timers.size, 1)
})

test('助手重启恢复开关，游戏连续两次启动均自动翻译，关闭才取消偏好', async t => {
  const f = fixture(t)
  await f.service.enable()
  await f.service.shutdown()
  assert.equal(JSON.parse(fs.readFileSync(f.settingsPath, 'utf8')).autoEnabled, true)
  const restored = new MarketLocalizationService(f.options)
  t.after(() => restored.shutdown())
  await restored.initialize()
  assert.equal(restored.getStatus().autoEnabled, true)
  async function pulse() {
    const timer = [...f.timers][0]; assert.ok(timer)
    f.timers.delete(timer); timer.callback(); await restored.pollTask; await flush()
  }
  f.processes = [42]; await pulse()
  assert.equal(restored.getStatus().state, 'active')
  f.snapshot = { state: 'disabled' }; f.processes = []; await pulse()
  assert.equal(restored.getStatus().state, 'waiting')
  f.processes = [43]; f.snapshot = { state: 'active', pid: 43, mode: 'simplified' }; await pulse()
  assert.equal(restored.getStatus().pid, 43)
  assert.equal(f.calls.filter(call => call[0] === 'enable').length, 2)
  await restored.disable()
  assert.equal(restored.getStatus().autoEnabled, false)
  assert.equal(JSON.parse(fs.readFileSync(f.settingsPath, 'utf8')).autoEnabled, false)
  assert.equal(f.timers.size, 0)
  const disabled = new MarketLocalizationService(f.options)
  t.after(() => disabled.shutdown())
  await disabled.initialize()
  assert.equal(disabled.getStatus().enabled, false)
  assert.equal(f.timers.size, 0)
})

test('助手窗口出现后直接启动游戏，慢启动检测不会把新游戏当作已有会话', async t => {
  const f = fixture(t)
  fs.writeFileSync(f.settingsPath, JSON.stringify({ autoEnabled: true }))
  let finishProbe
  const probeReady = new Promise(resolve => { finishProbe = resolve })
  const restored = new MarketLocalizationService({ ...f.options, processProbe: async () => {
    await probeReady
    return f.options.processProbe()
  } })
  t.after(() => restored.shutdown())
  const main = fs.readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8')
  const startup = main.slice(main.indexOf('async function startApplication()'))
  const initialization = startup.match(/(?:void|await) marketLocalization\.initialize\(\)/)
  assert.ok(initialization)
  assert.ok(initialization.index < startup.indexOf('createApplicationWindow()'))
  // Use the actual startup call site, with the window callback starting the game immediately.
  const start = new Function('marketLocalization', 'createApplicationWindow', `return (async () => { ${initialization[0]}; createApplicationWindow() })()`)
  const pending = start(restored, () => { f.processes = [42] })
  await flush()
  finishProbe()
  await pending
  await restored.enabling
  const timer = [...f.timers][0]
  assert.ok(timer)
  f.timers.delete(timer); timer.callback(); await restored.pollTask
  assert.equal(restored.getStatus().state, 'active', '未打开汉化页面也应自动连接新启动的游戏')
  assert.deepEqual(f.calls.map(call => call[0]), ['enable'])
})

test('助手在游戏已运行时恢复开关不会迟注入；后续新PID可自动启用', async t => {
  const f = fixture(t)
  fs.writeFileSync(f.settingsPath, JSON.stringify({ autoEnabled: true }))
  f.processes = [42]
  const restored = new MarketLocalizationService(f.options)
  t.after(() => restored.shutdown())
  await restored.initialize()
  assert.equal(restored.getStatus().restartRequired, true)
  const pulse = async () => { const timer = [...f.timers][0]; f.timers.delete(timer); timer.callback(); await restored.pollTask; await flush() }
  await pulse(); assert.deepEqual(f.calls.map(call => call[0]), ['resume', 'close'])
  f.processes = [43]; f.snapshot = { state: 'active', pid: 43, mode: 'simplified' }
  await pulse(); assert.equal(restored.getStatus().pid, 43)
})

test('恢复开启偏好后未完成汉化则等待，语言应用完成后自动恢复；国服不会启动监听', async t => {
  const f = fixture(t)
  fs.writeFileSync(f.settingsPath, JSON.stringify({ autoEnabled: true }))
  f.managed.mode = null
  const restored = new MarketLocalizationService(f.options)
  t.after(() => restored.shutdown())
  await restored.initialize()
  assert.equal(restored.getStatus().state, 'error')
  assert.equal(restored.getStatus().autoEnabled, true)
  f.managed.mode = 'traditional'
  const timer = [...f.timers][0]; f.timers.delete(timer); timer.callback(); await restored.pollTask
  assert.equal(restored.getStatus().state, 'waiting')
  assert.equal(restored.getStatus().mode, 'traditional')
  await restored.shutdown()
  const cn = new MarketLocalizationService({ ...f.options, serverId: 'cn' })
  t.after(() => cn.shutdown())
  const probes = f.probes
  await cn.initialize()
  assert.equal(f.probes, probes)
  assert.equal(cn.getStatus().autoEnabled, false)
})

test('启动时进程探测失败不会在恢复后迟注入已有游戏，保留具体错误', async t => {
  const f = fixture(t)
  fs.writeFileSync(f.settingsPath, JSON.stringify({ autoEnabled: true }))
  f.processes = null
  const restored = new MarketLocalizationService(f.options)
  t.after(() => restored.shutdown())
  await restored.initialize()
  assert.match(restored.getStatus().reason, /无法确认游戏进程/)
  f.processes = [42]
  const pulse = async () => { const timer = [...f.timers][0]; f.timers.delete(timer); timer.callback(); await restored.pollTask; await flush() }
  await pulse()
  assert.equal(f.calls.some(call => call[0] === 'enable'), false)
  f.processes = [43]; f.snapshot = { state: 'active', pid: 43, mode: 'simplified' }
  await pulse()
  assert.equal(restored.getStatus().pid, 43)
})

test('游戏保留中文缓存时重启助手自动接续原会话，恢复查询转换而不重新注入', async t => {
  const f = fixture(t)
  await f.service.enable(); f.processes = [42]; await f.pulse()
  await f.service.shutdown()
  const restored = new MarketLocalizationService(f.options)
  t.after(() => restored.shutdown())
  await restored.initialize()
  const timer = [...f.timers][0]; f.timers.delete(timer); timer.callback(); await restored.pollTask
  assert.equal(restored.getStatus().state, 'active')
  assert.equal(restored.getStatus().pid, 42)
  assert.equal(restored.getStatus().autoEnabled, true)
  assert.deepEqual(f.calls.map(call => call[0]), ['enable', 'close', 'resume'])
  assert.deepEqual(f.calls.at(-1)[1].rules, f.catalog.rules)
})

test('已有翻译会话若目录不同则明确失败，不对相同PID反复恢复或退回新注入', async t => {
  const f = fixture(t)
  await f.service.enable(); f.processes = [42]; await f.pulse(); await f.service.shutdown()
  f.nativeError = new Error('restart game before changing market language or dictionary')
  const restored = new MarketLocalizationService(f.options)
  t.after(() => restored.shutdown())
  await restored.initialize()
  const pulse = async () => { const timer = [...f.timers][0]; f.timers.delete(timer); timer.callback(); await restored.pollTask }
  await pulse(); await pulse()
  assert.equal(restored.getStatus().state, 'error')
  assert.match(restored.getStatus().reason, /restart game/)
  assert.equal(f.calls.filter(call => call[0] === 'resume').length, 1)
  assert.equal(f.calls.filter(call => call[0] === 'enable').length, 1)
})

test('退出与切服准备等待正在启用的组件回到透传，之后拒绝新启用', async t => {
  const f = fixture(t)
  let finish
  f.host.request = async operation => {
    f.calls.push([operation])
    return new Promise(resolve => { finish = resolve })
  }
  await f.service.enable(); f.processes = [42]
  const tick = f.pulse()
  await flush()
  const stopped = f.service.shutdown()
  assert.equal(f.service.shutdown(), stopped)
  assert.deepEqual(f.calls.map(call => call[0]), ['enable'])
  finish({ state: 'active', pid: 42 })
  await Promise.all([tick, stopped])
  assert.deepEqual(f.calls.map(call => call[0]), ['enable', 'close'])
  assert.equal(f.service.getStatus().closing, true)
  assert.throws(() => f.service.enable(), /停止或助手正在退出/)
})

function fakeChild(handle) {
  const child = new EventEmitter()
  child.stdout = new PassThrough(); child.stderr = new PassThrough()
  let closed = false
  const close = () => { if (!closed) { closed = true; child.emit('close', 0) } }
  child.stdin = new Writable({ write(chunk, _encoding, done) { handle(JSON.parse(String(chunk)), child); done() } })
  child.stdin.on('finish', close)
  child.kill = close
  return child
}
const reply = (child, data, extra = {}) => child.stdout.write(`${JSON.stringify({ marketProtocolVersion: 1, type: 'result', success: true, data, ...extra })}\n`)

test('持久host使用专用模式、串行JSONL，正常停用后关闭stdin；不输出stderr', async () => {
  const calls = []
  let spawnOptions
  const child = fakeChild((request, current) => {
    calls.push(request)
    queueMicrotask(() => reply(current, { state: request.operation === 'disable' ? 'disabled' : 'active', pid: 42 }))
  })
  const client = new MarketHostClient({ executable: 'trusted-helper', spawnImpl: (...args) => { spawnOptions = args; return child } })
  await Promise.all([client.request('enable', { mode: 'traditional' }), client.request('status')])
  assert.deepEqual(spawnOptions[1], ['--market-host'])
  assert.equal(spawnOptions[2].shell, false)
  assert.equal(spawnOptions[2].windowsHide, true)
  assert.deepEqual(calls.map(call => call.operation), ['enable', 'status'])
  assert.equal(calls[0].marketProtocolVersion, 1)
  assert.equal(calls[0].mode, 'traditional')
  await client.close(); await client.close()
  assert.deepEqual(calls.map(call => call.operation), ['enable', 'status', 'disable'])
  assert.equal(child.stdin.writableEnded, true)
})

test('host错误结果保留具体原因；无效协议或组件退出阻止后续请求重新启动', async () => {
  let spawns = 0
  const child = fakeChild((_request, current) => queueMicrotask(() => reply(current, { state: 'error' }, { success: false, error: { code: 'MARKET_UNAVAILABLE', message: '检测到其他市集翻译组件' } })))
  const client = new MarketHostClient({ executable: 'trusted', spawnImpl: () => { spawns++; return child } })
  await assert.rejects(client.request('enable'), /其他市集翻译/)
  child.emit('close', 1)
  await assert.rejects(client.request('status'), /组件已退出/)
  assert.equal(spawns, 1)
  await client.close()
  const invalid = fakeChild((_request, current) => queueMicrotask(() => reply(current, { state: 'active' }, { marketProtocolVersion: 2 })))
  const broken = new MarketHostClient({ executable: 'trusted', spawnImpl: () => invalid })
  await assert.rejects(broken.request('enable'), /协议不兼容/)
  await assert.rejects(broken.request('enable'), /协议不兼容/)
  await broken.close()
})

test('host不回应时超时关闭控制进程，后续请求不能静默重新注入', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const child = fakeChild(() => {})
  const client = new MarketHostClient({ executable: 'trusted', timeoutMs: 20, spawnImpl: () => child })
  const pending = client.request('enable')
  await flush()
  t.mock.timers.tick(21)
  await assert.rejects(pending, /超时/)
  await assert.rejects(client.request('enable'), /超时/)
  await client.close()
})

test('市集IPC只接受主窗口主frame，国际服门禁沿用localization前缀', async () => {
  const service = new EventEmitter()
  const calls = []
  Object.assign(service, { requireInternational() {}, getStatus: () => ({ state: 'disabled' }), enable: () => { calls.push('enable'); return { state: 'waiting' } }, disable: () => ({ state: 'disabled' }) })
  const mainFrame = {}
  const webContents = { mainFrame, send: (channel, state) => calls.push([channel, state]) }
  const owner = { webContents, isDestroyed: () => false }
  const handlers = new Map()
  registerMarketLocalizationHandlers(service, () => owner, { handle: (channel, callback) => handlers.set(channel, callback) })
  const enable = handlers.get('localization:market-enable')
  assert.equal((await enable({ sender: {}, senderFrame: mainFrame })).success, false)
  assert.equal((await enable({ sender: webContents, senderFrame: {} })).success, false)
  assert.deepEqual(calls, [])
  assert.equal((await enable({ sender: webContents, senderFrame: mainFrame })).success, true)
  service.emit('state', { state: 'waiting' })
  assert.equal(calls[0], 'enable')
  assert.equal(calls[1][0], 'localization:market-state-changed')
  assert.equal(serverChannelFailure({ id: 'international' }, 'localization:market-enable'), null)
  assert.equal(serverChannelFailure({ id: 'cn' }, 'localization:market-enable').code, 'SERVER_FEATURE_UNAVAILABLE')
  assert.equal(serverChannelFailure({ id: 'international' }, 'localization:market-enable', true).code, 'SERVER_SWITCHING')
})
})()

// === Merged from marketLocalizationCatalog.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const fs = _m4_fs
  const createHash = _m4_createHash
  const gunzipSync = _m4_gunzipSync
  const compatibleMarketTemplate = _m4_compatibleMarketTemplate
  const generateMarketLocalizationCatalog = _m4_generateMarketLocalizationCatalog
  const loadOfficialTradeItems = _m4_loadOfficialTradeItems
  const loadOfficialTradeStats = _m4_loadOfficialTradeStats
  const marketTemplate = _m4_marketTemplate
  const validateMarketCatalog = _m4_validateMarketCatalog
  const fixedMarketRules = _m4_fixedMarketRules
  const pseudoMarketTranslations = _m4_pseudoMarketTranslations
  const auditOfficialFilterCoverage = _m4_auditOfficialFilterCoverage
  const filterDisplayRows = _m4_filterDisplayRows
  const officialFilterSchema = _m4_officialFilterSchema
  const officialFilterSource = _m4_officialFilterSource
  const auditMarketPseudoCoverage = _m4_auditMarketPseudoCoverage
const hash = value => createHash('sha256').update(value).digest('hex')
const executableSha256 = '7f762cadbe0a7315091e105121010d2f35296db8046294e0bf49aacfff67db3c'
const entry = (value) => ({ kind: 'dat', ...value, sourceHash: hash(value.en) })
function fixture() {
  return {
    international: { items: [{ name: 'Iron Ring', baseType: 'Iron Ring', text: '', unique: false }], stats: [] },
    cnCatalog: { stats: [] },
    localization: { protocolVersion: 1, engineVersion: 1, gameVersion: '3.30.0b', entries: [entry({ table: 'baseitemtypes', id: 'Metadata/Items/Rings/Ring1', field: 'Name', en: 'Iron Ring', cn: '锻铁戒指', tw: '鍛鐵戒指' })] },
    officialStats: { schemaVersion: 1, game: 'poe1', locale: 'fr', buildId: '26694821', entries: [
      { en: '#% increased Damage', fr: '#% d’Augmentation des Dégâts' },
      { en: '+#% to Cold Resistance', fr: '+#% de Résistance au froid' },
      { en: '+#% total to Cold Resistance', fr: '+#% de Résistance au froid au total' }
    ] },
    officialNames: { schemaVersion: 1, locale: 'fr', gameVersion: '3.30.0b', buildId: '26694821', executableSha256, entries: [
      { table: 'baseitemtypes', id: 'Metadata/Items/Rings/Ring1', field: 'Name', en: 'Iron Ring', fr: 'Anneau en fer' }
    ] }
  }
}
const stat = (id, en) => ({ ids: { explicit: id }, matchers: [en] })
const tradeSnapshot = locale => JSON.parse(gunzipSync(fs.readFileSync(new URL(`../scripts/market-localization/official-trade-stats.${locale}.json.gz`, import.meta.url))))

function gemFixture() {
  const input = fixture()
  const bases = [
    { id: 'Metadata/Items/Gems/SkillGemAnimateWeapon', en: 'Animate Weapon', fr: "Animation d'Arme", cn: '幻化武器', tw: '幻化武器' },
    { id: 'Metadata/Items/Gems/SkillGemVaalAnimateWeapon', en: 'Vaal Animate Weapon', fr: "Animation d'arme vaal", cn: '瓦尔：幻化武器', tw: '瓦爾．幻化武器' }
  ]
  for (const row of bases) {
    input.officialNames.entries.push({ table: 'baseitemtypes', field: 'Name', id: row.id, en: row.en, fr: row.fr })
    input.localization.entries.push(entry({ table: 'baseitemtypes', field: 'Name', id: row.id, en: row.en, cn: row.cn, tw: row.tw }))
  }
  input.localization.entries.push(entry({ table: 'activeskills', field: 'DisplayedName', id: 'animate_weapon_alt_y', en: 'Animate Weapon of Ranged Arms', cn: '远程之幻化武器', tw: '幻化武器．遠程' }))
  const en = [
    { type: 'Animate Weapon', text: 'Animate Weapon of Ranged Arms', disc: 'alt_y' },
    { type: 'Vaal Animate Weapon', text: 'Vaal Animate Weapon (Animate Weapon of Ranged Arms)', disc: 'alt_y' }
  ]
  const fr = [
    { type: "Animation d'Arme", text: "Animation d'arme à distance", disc: 'alt_y' },
    { type: "Animation d'arme vaal", text: "Animation d'Arme vaal (Animation d'arme à distance)", disc: 'alt_y' }
  ]
  input.international.items = en.map(row => ({ name: row.type, baseType: row.type, text: row.text, discriminator: row.disc, category: 'gem', unique: false }))
  input.officialTradeItems = { en: { result: [{ id: 'gem', entries: en }] }, fr: { result: [{ id: 'gem', entries: fr }] } }
  return input
}

test('远程之幻化武器及瓦尔组合名称按官方完整text翻译，搜索仅反查term', () => {
  const catalog = generateMarketLocalizationCatalog(gemFixture())
  for (const [source, cn, tw] of [
    ["Animation d'arme à distance", '远程之幻化武器', '幻化武器．遠程'],
    ["Animation d'Arme vaal (Animation d'arme à distance)", '瓦尔：幻化武器 (远程之幻化武器)', '瓦爾．幻化武器 (幻化武器．遠程)']
  ]) {
    const rule = catalog.rules.find(rule => rule.field === 'text' && rule.source === source)
    assert.equal(rule?.cn, cn); assert.equal(rule?.tw, tw)
    assert.deepEqual(rule.reverse, ['term'])
    assert.ok(!catalog.rules.some(rule => rule.field === 'type' && rule.source === source))
  }
  const base = catalog.rules.find(rule => rule.field === 'type' && rule.source === "Animation d'Arme")
  assert.equal(base.cn, '幻化武器')
  assert.deepEqual(base.reverse, ['term', 'type'])
  assert.equal(catalog.report.itemsComplete, 2)
  assert.deepEqual(catalog.report.gemVariants, { officialTotal: 2, currentCatalogTotal: 2, total: 2, matched: 2, cn: 2, tw: 2, compound: 1, skipped: 0, reasons: {}, officialOnly: [] })
})

test('变异宝石缺法语、重复配对、英文变化、discriminator不符及译文歧义不猜测', () => {
  for (const mutate of [
    input => { input.officialTradeItems.fr.result[0].entries = [] },
    input => { input.officialTradeItems.fr.result[0].entries.push({ ...input.officialTradeItems.fr.result[0].entries[0] }) },
    input => { input.officialTradeItems.en.result[0].entries.push({ ...input.officialTradeItems.en.result[0].entries[0] }) },
    input => { input.officialTradeItems.en.result[0].entries[0].text = 'Changed English Gem' },
    input => { input.officialTradeItems.fr.result[0].entries[0].disc = 'alt_x' },
    input => { input.localization.entries.push(entry({ table: 'gemeffects', id: 'AnimateWeaponAltY', field: 'Name', en: 'Animate Weapon of Ranged Arms', cn: '其它译名', tw: '其它譯名' })) }
  ]) {
    const input = gemFixture(); mutate(input)
    const catalog = generateMarketLocalizationCatalog(input)
    assert.ok(!catalog.rules.some(rule => rule.field === 'text' && rule.source === "Animation d'arme à distance"))
    assert.equal(catalog.report.itemsComplete, catalog.report.gemVariants.matched)
  }
})

test('变异宝石只有基础类型译文时不能计为完整覆盖，官方英法快照可以离线核验来源哈希', async () => {
  const input = gemFixture()
  delete input.officialTradeItems
  assert.equal(generateMarketLocalizationCatalog(input).report.itemsComplete, 0)
  const snapshot = await loadOfficialTradeItems()
  assert.equal(snapshot.sources.fr.url, 'https://fr.pathofexile.com/api/trade/data/items')
  for (const locale of ['en', 'fr']) {
    const rows = snapshot[locale].result.find(group => group.id === 'gem').entries
    assert.equal(rows.length, 876)
    assert.equal(rows.filter(row => row.disc && row.text).length, 265)
  }
})

test('官方新变异可凭准确英法配对与受管名称生成，缺少简体时保留可靠繁体回退', () => {
  const input = gemFixture()
  input.international.items = []
  delete input.localization.entries.find(row => row.id === 'animate_weapon_alt_y').cn
  const catalog = generateMarketLocalizationCatalog(input)
  const rule = catalog.rules.find(row => row.field === 'text' && row.source === "Animation d'arme à distance")
  assert.equal(rule.cn, undefined)
  assert.equal(rule.tw, '幻化武器．遠程')
  assert.deepEqual(rule.reverse, ['term'])
  assert.equal(catalog.report.gemVariants.currentCatalogTotal, 0)
  assert.equal(catalog.report.gemVariants.officialOnly.length, 2)
  assert.equal(catalog.report.gemVariants.matched, 2)
})

test('官方英法交易目录补齐截图中的24个综合词缀，仍绑定精确法语原文', () => {
  const input = fixture()
  input.officialStats.entries = []
  input.officialTradeStats = { en: tradeSnapshot('en'), fr: tradeSnapshot('fr') }
  input.international.stats = Object.entries(pseudoMarketTranslations).map(([id, row]) => stat(id, row.en))
  input.localization.entries.push(entry({ kind: 'stat', table: 'metadata/statdescriptions/test.csd', id: 'movement_speed', field: 'variant:0',
    en: '{0}% increased Movement Speed', cn: '移动速度增加 {0}%', tw: '移動速度增加 {0}%', stats: { ids: ['movement_speed'], variants: [{ condition: '#', handlers: '', placeholders: ['{0}'] }] } }))
  const catalog = generateMarketLocalizationCatalog(input)
  const french = new Map(input.officialTradeStats.fr.result.flatMap(group => group.entries).map(row => [row.id, row.text]))
  assert.equal(input.international.stats.length, 24)
  for (const [id, translation] of Object.entries(pseudoMarketTranslations)) {
    const rule = catalog.rules.find(row => row.section === 'stats' && row.field === 'text' && row.id === id)
    assert.equal(rule?.source, french.get(id), id)
    assert.equal(rule?.cn, translation.cn, id)
    assert.equal(rule?.tw, translation.tw, id)
  }
})

test('官方英法快照原始字节符合来源URL、时间及哈希清单', async () => {
  const snapshot = await loadOfficialTradeStats()
  assert.equal(snapshot.sources.fr.url, 'https://fr.pathofexile.com/api/trade/data/stats')
  assert.equal(snapshot.en.result.find(group => group.id === 'pseudo').entries.length, 298)
  assert.equal(snapshot.fr.result.find(group => group.id === 'pseudo').entries.length, 298)
})

test('全部298个官方综合词缀及截图22项宝石等级均有准确FR来源和简体译文', async () => {
  const input = fixture()
  input.officialStats.entries = []
  input.officialTradeStats = await loadOfficialTradeStats()
  const pseudo = input.officialTradeStats.en.result.find(group => group.id === 'pseudo').entries
  input.international.stats = pseudo.map(row => stat(row.id, row.text))
  input.cnCatalog = JSON.parse(fs.readFileSync(new URL('../electron/modules/priceCheck/catalog.json', import.meta.url), 'utf8'))
  // These five range-damage rows are supplied by the managed CSD in production.
  // Preserve that independent source in the fixture; the legacy rows use English matchers, not refs.
  for (const row of pseudo.filter(row => /^pseudo\.pseudo_adds_(physical|lightning|cold|fire|chaos)_damage$/.test(row.id))) {
    const cn = input.cnCatalog.stats.find(stat => Object.values(stat.ids || {}).flat().includes(row.id) && stat.matchers.includes(row.text))
    input.localization.entries.push(entry({ kind: 'stat', table: 'metadata/statdescriptions/test.csd', id: row.id, field: 'variant:0', en: row.text,
      cn: cn.matchers[0], stats: { ids: [row.id], variants: [{ condition: '#', handlers: '', placeholders: [] }] } }))
  }
  const french = new Map(input.officialTradeStats.fr.result.find(group => group.id === 'pseudo').entries.map(row => [row.id, row.text]))
  const catalog = generateMarketLocalizationCatalog(input)
  const missing = pseudo.filter(row => !catalog.rules.some(rule => rule.section === 'stats' && rule.field === 'text'
    && rule.id === row.id && rule.source === french.get(row.id) && rule.cn)).map(row => row.id)
  assert.equal(pseudo.length, 298)
  assert.equal(pseudo.filter(row => row.id.startsWith('pseudo.pseudo_total_additional_') && row.id.endsWith('_gem_levels')).length, 22)
  assert.deepEqual(missing, [])
  const audit = auditMarketPseudoCoverage(catalog, input.officialTradeStats, input.international)
  assert.equal(audit.coverage.cn.covered, 298)
  assert.equal(audit.coverage.cn.missing, 0)
  assert.ok(audit.rows.every(row => row.cn === 'covered'))
})

test('交易ID相同但英文或参数漂移不能借用API或旧CSD译文', () => {
  for (const mutation of ['english', 'french', 'ambiguous']) {
    const input = fixture(), id = 'explicit.stat_1'
    input.international.stats = [stat(id, '#% increased Damage')]
    input.cnCatalog.stats = [{ ...stat(id, '伤害提高 #%'), refs: ['#% increased Damage'] }]
    input.officialTradeStats = {
      en: { result: [{ entries: [{ id, text: '#% increased Damage' }] }] },
      fr: { result: [{ entries: [{ id, text: '#% de Dégâts' }] }] }
    }
    if (mutation === 'english') input.officialTradeStats.en.result[0].entries[0].text = '#% more Damage'
    if (mutation === 'french') {
      input.officialStats.entries = []
      input.officialTradeStats.fr.result[0].entries[0].text = 'Dégâts augmentés de 4%'
    }
    if (mutation === 'ambiguous') input.officialTradeStats.en.result[0].entries.push({ id, text: '#% more Damage' })
    assert.ok(!generateMarketLocalizationCatalog(input).rules.some(rule => rule.id === id), mutation)
  }
})

test('官方X占位符仅允许已核实的准确ID和英法原文，不扩展到其它文案', () => {
  const id = 'pseudo.pseudo_total_mana', en = '+# total maximum Mana', fr = '+X au Mana maxi au total'
  for (const mutation of ['id', 'source']) {
    const input = fixture(), actualId = mutation === 'id' ? 'explicit.stat_1' : id
    input.officialStats.entries = []
    input.international.stats = [stat(actualId, en)]
    input.cnCatalog.stats = [{ ...stat(actualId, '+# 总最大魔力'), refs: [en] }]
    input.officialTradeStats = {
      en: { result: [{ entries: [{ id: actualId, text: en }] }] },
      fr: { result: [{ entries: [{ id: actualId, text: mutation === 'source' ? `${fr} changé` : fr }] }] }
    }
    assert.ok(!generateMarketLocalizationCatalog(input).rules.some(rule => rule.id === actualId), mutation)
  }
})

test('全部24个X拼写例外均可追溯到官方快照中的精确ID及英法全文', async () => {
  const source = JSON.parse(fs.readFileSync(new URL('../scripts/market-localization/official-pseudo-parameter-spellings.json', import.meta.url), 'utf8'))
  const snapshot = await loadOfficialTradeStats()
  const byLocale = Object.fromEntries(['en', 'fr'].map(locale => [locale, new Map(snapshot[locale].result.flatMap(group => group.entries).map(row => [row.id, row.text]))]))
  assert.equal(source.entries.length, 24)
  assert.equal(new Set(source.entries.map(row => row.id)).size, 24)
  assert.equal(source.sourceEnglishSha256, snapshot.sources.en.sha256)
  assert.equal(source.sourceFrenchSha256, snapshot.sources.fr.sha256)
  for (const row of source.entries) {
    assert.equal(byLocale.en.get(row.id), row.en)
    assert.equal(byLocale.fr.get(row.id), row.fr)
    assert.equal(compatibleMarketTemplate(row.en, row.fr), false)
  }
})

test('官方法语名称按稳定表ID与英文原文对齐，简繁搜索保留不同反向字段', () => {
  const result = generateMarketLocalizationCatalog(fixture())
  const rule = result.rules.find(rule => rule.section === 'items' && rule.field === 'type' && rule.source === 'Anneau en fer')
  assert.equal(rule.cn, '锻铁戒指'); assert.equal(rule.tw, '鍛鐵戒指')
  assert.deepEqual(rule.reverse, ['term', 'type'])
  assert.ok(!rule.id, 'DAT identity must not be mistaken for the remote item object ID')
  assert.ok(!result.rules.some(rule => rule.section === 'items' && rule.field === 'name'))
  assert.equal(result.report.itemsComplete, 1)
})

test('英文漂移、未覆盖条目和法语身份歧义不猜测物品名称', () => {
  for (const mutate of [
    input => { input.officialNames.entries[0].en = 'Different Ring' },
    input => { input.international.items[0] = { name: 'Unknown', baseType: 'Unknown', unique: false } },
    input => { input.officialNames.entries.push({ ...input.officialNames.entries[0], fr: 'Different French Ring' }) }
  ]) {
    const input = fixture(); mutate(input)
    assert.ok(!generateMarketLocalizationCatalog(input).rules.some(rule => rule.section === 'items' && rule.source))
  }
})

test('传奇名称与底材分开映射，组合文字只在原始结构相符时生成', () => {
  const input = fixture()
  input.international.items = [{ name: 'Fixture Unique', baseType: 'Iron Ring', text: 'Fixture Unique Iron Ring', unique: true }]
  input.localization.entries.push(entry({ table: 'words', id: 'hash:00000001', field: 'Text2', en: 'Fixture Unique', cn: '示例传奇', tw: '範例傳奇' }))
  input.officialNames.entries.push({ table: 'words', id: 'hash:00000001', field: 'Text2', en: 'Fixture Unique', fr: 'Unique français' })
  const result = generateMarketLocalizationCatalog(input)
  assert.deepEqual(result.rules.find(rule => rule.source === 'Unique français').reverse, ['name', 'term'])
  assert.equal(result.rules.find(rule => rule.source === 'Unique français Anneau en fer').tw, '範例傳奇 鍛鐵戒指')
  assert.equal(result.report.itemsComplete, 1)
})

test('同ID旧国服词缀仍必须匹配当前英文语义及参数', () => {
  const input = fixture()
  input.international.stats = [stat('explicit.stat_1', '#% increased Damage'), stat('explicit.stat_2', '#% more Damage')]
  input.cnCatalog.stats = [
    { ...stat('explicit.stat_1', '伤害提高 #%'), refs: ['#% increased Damage'] },
    { ...stat('explicit.stat_2', '伤害提高 #%'), refs: ['#% increased Damage'] }
  ]
  const result = generateMarketLocalizationCatalog(input)
  assert.equal(result.rules.find(rule => rule.id === 'explicit.stat_1').cn, '伤害提高 #%')
  assert.ok(!result.rules.some(rule => rule.id === 'explicit.stat_2'))
  assert.equal(result.report.statsSkipped, 1)
})

test('动态词缀必须绑定可靠法语原文，缺失、英文漂移和参数变化均跳过', () => {
  for (const mutate of [
    input => { input.officialStats.entries = [] },
    input => { input.officialStats.entries[0].en = '#% more Damage' },
    input => { input.officialStats.entries[0].fr = 'Dégâts augmentés de 4%' }
  ]) {
    const input = fixture()
    input.international.stats = [stat('explicit.stat_1', '#% increased Damage')]
    input.cnCatalog.stats = [{ ...stat('explicit.stat_1', '伤害提高 #%'), refs: ['#% increased Damage'] }]
    mutate(input)
    const catalog = generateMarketLocalizationCatalog(input)
    assert.ok(!catalog.rules.some(rule => rule.id === 'explicit.stat_1'))
    assert.equal(catalog.report.statsSourceMissing, 1)
  }
})

test('词缀规则保留各可靠法语原文，译文不能脱离当前原文证据', () => {
  const input = fixture()
  input.international.stats = [stat('explicit.stat_1', '#% increased Damage')]
  input.cnCatalog.stats = [{ ...stat('explicit.stat_1', '伤害提高 #%'), refs: ['#% increased Damage'] }]
  input.officialStats.entries.push({ en: '#% increased Damage', fr: '#% d’Augmentation des Dégâts globaux' })
  const catalog = generateMarketLocalizationCatalog(input)
  const rules = catalog.rules.filter(rule => rule.id === 'explicit.stat_1' && rule.field === 'text')
  assert.deepEqual(new Set(rules.map(rule => rule.source)), new Set(input.officialStats.entries.filter(row => row.en === '#% increased Damage').map(row => row.fr)))
  assert.ok(rules.every(rule => rule.cn === '伤害提高 #%'))
  const { source, ...missing } = rules[0]
  assert.throws(() => validateMarketCatalog({ ...catalog, rules: [missing] }), /缺少已核实法语原文/)
})

test('同一交易ID的另一英文变体没有译文时不能借用已有变体译文', () => {
  const input = fixture()
  input.international.stats = [stat('explicit.stat_1', '#% increased Damage'), stat('explicit.stat_1', '#% more Damage')]
  input.cnCatalog.stats = [{ ...stat('explicit.stat_1', '伤害提高 #%'), refs: ['#% increased Damage'] }]
  input.officialStats.entries.push({ en: '#% more Damage', fr: '#% davantage de Dégâts' })
  const catalog = generateMarketLocalizationCatalog(input)
  assert.ok(catalog.rules.some(rule => rule.id === 'explicit.stat_1' && rule.source === '#% d’Augmentation des Dégâts'))
  assert.ok(!catalog.rules.some(rule => rule.id === 'explicit.stat_1' && rule.source === '#% davantage de Dégâts'))
})

test('受管词缀提供原始简繁模板，不能使用数值展示label或丢失百分号与常数', () => {
  const input = fixture()
  input.international.stats = [stat('explicit.stat_1', '+#% to Cold Resistance')]
  input.localization.entries.push(entry({ kind: 'stat', table: 'metadata/statdescriptions/test.csd', id: 'fixture_stat', field: 'variant:0', en: '{0:+d}% to Cold Resistance', cn: '冰霜抗性 {0:+d}%', tw: '{0:+d}% 冰冷抗性', stats: { ids: ['fixture_stat'], variants: [{ condition: '#', handlers: '', placeholders: ['{0:+d}'] }] } }))
  const result = generateMarketLocalizationCatalog(input)
  const rule = result.rules.find(rule => rule.id === 'explicit.stat_1')
  assert.equal(rule.cn, '冰霜抗性 +#%'); assert.equal(rule.tw, '+#% 冰冷抗性')
  assert.ok(!JSON.stringify(rule).includes('数值'))
  assert.equal(marketTemplate('{0:+d}% to Cold Resistance'), '+#% to Cold Resistance')
  assert.equal(compatibleMarketTemplate('#% for 4 seconds', '#% 持续 5 秒'), false)
  assert.equal(compatibleMarketTemplate('#%', '#'), false)
})

test('同ID多种英文词缀映射到不同译文时保留原文', () => {
  const input = fixture()
  input.international.stats = [stat('explicit.stat_1', '#% increased Damage'), stat('explicit.stat_1', '#% reduced Damage')]
  input.cnCatalog.stats = [
    { ...stat('explicit.stat_1', '伤害提高 #%'), refs: ['#% increased Damage'] },
    { ...stat('explicit.stat_1', '伤害降低 #%'), refs: ['#% reduced Damage'] }
  ]
  assert.ok(!generateMarketLocalizationCatalog(input).rules.some(rule => rule.id === 'explicit.stat_1'))
})

test('伪词缀独立校验聚合含义，语义变化时不套用旧翻译', () => {
  const input = fixture()
  input.international.stats = [stat('pseudo.pseudo_total_cold_resistance', '+#% total to Cold Resistance')]
  let result = generateMarketLocalizationCatalog(input)
  assert.equal(result.rules.find(rule => rule.id === 'pseudo.pseudo_total_cold_resistance').tw, '+#% 總冰冷抗性')
  input.international.stats[0].matchers = ['+#% maximum Cold Resistance']
  result = generateMarketLocalizationCatalog(input)
  assert.ok(!result.rules.some(rule => rule.id === 'pseudo.pseudo_total_cold_resistance'))
})

test('无效来源哈希、来源游戏版本和发布可执行文件指纹会拒绝生成', () => {
  for (const mutate of [
    input => { input.localization.entries[0].sourceHash = '0'.repeat(64) },
    input => { input.officialNames.gameVersion = 'other' },
    input => { input.officialNames.buildId = '26673341' },
    input => { input.officialNames.executableSha256 = 'c86e4b153a93e573e7d800dcdf01a79b3392a52f73e29ca48d2bd8297ad28031' },
    input => { input.officialNames.executableSha256 = '0'.repeat(64) }
  ]) {
    const input = fixture(); mutate(input)
    assert.throws(() => generateMarketLocalizationCatalog(input))
  }
})

test('固定栏目和布尔选项不改变查询身份，已观测类型目录全部有自有译文', () => {
  for (const id of ['type_filters', 'weapon_filters', 'trade_filters', 'true', 'false', 'weapon.basesword', 'weapon.rapier', 'weapon.basemace']) {
    const rule = fixedMarketRules.find(rule => rule.id === id)
    assert.ok(rule?.cn && rule?.tw, id)
  }
  assert.equal(fixedMarketRules.find(rule => rule.id === 'true').cn, '是')
  for (const source of ['Coût en Or', 'Coût en or']) {
    const gold = fixedMarketRules.find(rule => rule.section === 'filters' && rule.field === 'text' && rule.source === source)
    assert.equal(gold?.cn, '金币费用'); assert.equal(gold?.tw, '金幣費用')
    assert.ok(!gold.id, 'unknown remote gold field ID must not be guessed')
  }
  assert.ok(!fixedMarketRules.some(rule => rule.section === 'stats' && rule.field === 'type'))
})

test('市集分组采用核对后的游戏术语，避免直译伪词缀与显式词缀', () => {
  const expected = {
    pseudo: ['综合', '偽屬性'], explicit: ['外延', '隨機屬性'], implicit: ['基底', '固定屬性'],
    fractured: ['分裂的', '破裂'], crafted: ['工艺', '工藝'], veiled: ['影匿', '隱匿'],
    enchant: ['附魔', '附魔'], scourge: ['异度天灾', '災魘'], crucible: ['古神熔炉', '熔火冥獄'],
    necropolis: ['死寂亡城', '魔影墓場'], monster: ['怪物', '怪物']
  }
  for (const [id, values] of Object.entries(expected)) {
    const rule = fixedMarketRules.find(rule => rule.section === 'stats' && rule.field === 'label' && rule.id === id)
    assert.deepEqual([rule?.cn, rule?.tw], values, id)
    assert.doesNotMatch(`${rule.cn}\n${rule.tw}`, /伪词缀|偽詞綴|显式词缀|顯式詞綴|固性屬性/)
  }
})

test('完整官方筛选树的每个字段与内联选项均有映射，默认项按所属selector区分', () => {
  const audit = auditOfficialFilterCoverage(fixedMarketRules)
  assert.deepEqual(audit.missing, [])
  assert.equal(audit.groups, 12); assert.equal(audit.fields, 94)
  assert.equal(audit.titles, 11); assert.equal(audit.fieldTexts, 93); assert.equal(audit.placeholders, 1)
  assert.equal(audit.inlineSelectors, 36); assert.equal(audit.inlineOptions, 275); assert.equal(audit.defaultOptions, 35)
  assert.equal(audit.displayRows, 380); assert.equal(audit.tipsExcluded, 6)
  assert.equal(audit.dynamicKnownItem.length, 3)
  const defaultOf = scope => fixedMarketRules.find(rule => rule.section === 'filters' && rule.scope === scope && rule.defaultOption)
  assert.equal(defaultOf('category').cn, '任意')
  assert.equal(defaultOf('collapse').cn, '否')
  assert.equal(defaultOf('indexed').cn, '任意时间')
  assert.equal(defaultOf('sale_type').tw, '直購價或定價')
  assert.equal(defaultOf('price').tw, '與混沌石等值')
  assert.ok(!fixedMarketRules.some(rule => rule.section === 'filters' && !rule.scope && ['true', 'false', 'any', '0'].includes(rule.id)))
  assert.ok(!fixedMarketRules.some(rule => rule.section === 'filters' && rule.source === 'Tous'))
  for (const row of filterDisplayRows()) if (row.kind === 'option') assert.ok(fixedMarketRules.some(rule => rule.scope === row.scope &&
    (row.id === null ? rule.defaultOption === true : rule.id === row.id)), row.path)
})

test('职业、类别后半部及新字段使用真实schema身份和核对后的游戏术语', () => {
  const field = id => fixedMarketRules.find(rule => rule.section === 'filters' && !rule.scope && rule.field === 'text' && rule.id === id)
  const option = (scope, id) => fixedMarketRules.find(rule => rule.section === 'filters' && rule.scope === scope && rule.id === id)
  assert.equal(field('damage').cn, '伤害'); assert.equal(field('ward').cn, '结界')
  assert.equal(field('base_defence_percentile').cn, '基础防御百分位'); assert.equal(field('class').cn, '角色职业')
  assert.equal(field('intangibility').cn, '虚化'); assert.equal(field('stored_experience').cn, '储存经验')
  assert.equal(option('class', 'scion').cn, '贵族'); assert.equal(option('class', 'templar').tw, '聖堂武僧')
  assert.equal(option('class', 'shadow').cn, '暗影')
  const expected = {
    leaguestone: '赛季石', memoryline: '回忆', 'monster.redbeast': '红色野兽', 'monster.yellowbeast': '黄色野兽',
    'heistequipment.heisttool': '赏金猎人工具', 'heistequipment.heistutility': '赏金猎人披风', 'heistequipment.heistreward': '赏金猎人胸针',
    'heistmission.contract': '契约', 'heistmission.blueprint': '蓝图', logbook: '先祖秘藏日志', 'sanctum.relic': '遗物',
    tincture: '酊剂', corpse: '灵柩', idol: '雕像', graft: '移植物', wombgift: '孕育赠礼', enshrouded: '雾隐物品', chart: '海图', viscera: '脏器'
  }
  for (const [id, cn] of Object.entries(expected)) assert.equal(option('category', id)?.cn, cn, id)
  for (let id = 0; id <= 12; id++) assert.equal(typeof option('foil_variation', String(id))?.id, 'string')
  assert.equal(option('foil_variation', 'voidborn').cn, '虚空血脉（全部）')
  const rows = filterDisplayRows(officialFilterSchema)
  assert.ok(rows.some(row => row.scope === 'category' && row.id === 'enshrouded'))
  assert.ok(!rows.some(row => row.id === 'wrapped' || row.id === 'maritimecharts'), 'display nouns must not become invented query IDs')
  assert.equal(officialFilterSource.locale, 'zh-TW')
})

test('scoped默认规则必须限制为filter选项，不能变成全局空ID替换', () => {
  const catalog = generateMarketLocalizationCatalog(fixture())
  const good = catalog.rules.find(rule => rule.defaultOption)
  assert.ok(good.scope && !good.id)
  for (const invalid of [
    { ...good, scope: undefined }, { ...good, id: 'any' }, { ...good, defaultOption: false },
    { ...good, section: 'stats' }, { ...good, field: 'title' }
  ]) assert.throws(() => validateMarketCatalog({ ...catalog, rules: [invalid] }))
})

test('账号占位符仅按已观测原文匹配，scope严格遵循host的filters/text约束', () => {
  const catalog = generateMarketLocalizationCatalog(fixture())
  const placeholder = catalog.rules.find(rule => rule.section === 'filters' && rule.field === 'placeholder')
  assert.equal(placeholder.source, 'Tapez le nom du compte...')
  assert.equal(placeholder.cn, '输入账号名称...')
  assert.ok(!('scope' in placeholder))
  assert.ok(!('id' in placeholder))
  validateMarketCatalog({ ...catalog, rules: [placeholder] })
  assert.throws(() => validateMarketCatalog({ ...catalog, rules: [{ ...placeholder, scope: 'account' }] }), /市集选项范围无效/)
  assert.ok(catalog.rules.filter(rule => rule.scope).every(rule => rule.section === 'filters' && rule.field === 'text'))
})

test('发布目录符合原生大小限制、交易ID范围及法语搜索规则约束', () => {
  const catalog = JSON.parse(fs.readFileSync(new URL('../electron/assets/market-localization/catalog.json', import.meta.url), 'utf8'))
  validateMarketCatalog(catalog)
  const international = JSON.parse(fs.readFileSync(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
  const ids = new Set(international.stats.flatMap(stat => Object.values(stat.ids).flat()))
  for (const rule of catalog.rules) {
    if (rule.section === 'stats' && rule.field === 'text') assert.ok(ids.has(rule.id), rule.id)
    if (rule.reverse) { assert.equal(rule.section, 'items'); assert.ok(rule.source); assert.ok(!rule.id) }
    if (rule.section === 'stats') assert.notEqual(rule.field, 'type')
  }
  assert.ok(catalog.report.statsCn > 11000)
  assert.ok(catalog.report.statsTw > 8500)
  assert.ok(catalog.report.itemsComplete > 4500)
  const french = new Map(tradeSnapshot('fr').result.flatMap(group => group.entries).map(row => [row.id, row.text]))
  for (const [id, translation] of Object.entries(pseudoMarketTranslations)) {
    assert.ok(catalog.rules.some(rule => rule.id === id && rule.field === 'text' && rule.source === french.get(id)
      && rule.cn === translation.cn && rule.tw === translation.tw), id)
  }
  for (const [id, source] of french) if (id.startsWith('pseudo.')) {
    assert.ok(catalog.rules.some(rule => rule.id === id && rule.field === 'text' && rule.source === source && rule.cn), id)
  }
  for (const [source, cn] of [["Animation d'arme à distance", '远程之幻化武器'],
    ["Animation d'Arme vaal (Animation d'arme à distance)", '瓦尔：幻化武器 (远程之幻化武器)']]) {
    const rule = catalog.rules.find(row => row.section === 'items' && row.field === 'text' && row.source === source)
    assert.equal(rule?.cn, cn)
    assert.deepEqual(rule.reverse, ['term'])
    assert.ok(!catalog.rules.some(row => row.section === 'items' && row.field === 'type' && row.source === source))
  }
  assert.equal(catalog.report.gemVariants.currentCatalogTotal, 263)
  assert.equal(catalog.report.gemVariants.total, 265)
  assert.equal(catalog.report.gemVariants.matched, 265)
  assert.equal(catalog.report.gemVariants.skipped, 0)
  const frenchGems = JSON.parse(gunzipSync(fs.readFileSync(new URL('../scripts/market-localization/official-trade-items.fr.json.gz', import.meta.url)))).result.find(group => group.id === 'gem').entries
  const variants = frenchGems.filter(row => row.disc && row.text)
  assert.equal(variants.length, 265)
  for (const variant of variants) {
    const rule = catalog.rules.find(row => row.section === 'items' && row.field === 'text' && row.source === variant.text && (row.cn || row.tw))
    assert.ok(rule, variant.text)
    assert.deepEqual(rule.reverse, ['term'])
  }
})
})()

// === Merged from marketNative.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const fs = _m5_fs
  const path = _m5_path
  const MarketHostClient = _m5_MarketHostClient
const executable = path.resolve('.runtime/localization-helper/LocalizationHelper.exe')
test('已构建市集host验证跨提权的同用户管道权限、真实收发和首实例保护', { skip: process.platform !== 'win32' || !fs.existsSync(executable) }, async () => {
  const client = new MarketHostClient({ executable })
  try {
    const result = await client.request('self-test')
    assert.equal(result.passed, true)
    assert.equal(result.buildId, '26694821', '控制组件仍绑定旧 Steam Build')
    assert.equal(result.executableSha256, '7f762cadbe0a7315091e105121010d2f35296db8046294e0bf49aacfff67db3c')
    assert.ok(result.pipeSecurityCases >= 4, '缺少跨提权管道安全回归，请重新构建host')
    assert.ok(result.resumeCases >= 4, '缺少原会话恢复校验，请重新构建host')
    assert.ok(result.structureCases >= 14, '缺少完整结构兼容与失败关闭回归，请重新构建host')
  } finally { await client.close() }
})

test('已构建市集host用启用时相同校验器检查完整发布词库，拒绝带选项scope的占位符', { skip: process.platform !== 'win32' || !fs.existsSync(executable) }, async () => {
  const client = new MarketHostClient({ executable })
  const { rules } = JSON.parse(fs.readFileSync(path.resolve('electron/assets/market-localization/catalog.json'), 'utf8'))
  try {
    await assert.rejects(client.request('self-test', { rules: [{ section: 'filters', field: 'placeholder', scope: 'account', source: 'Tapez le nom du compte...', cn: '输入账号名称...' }] }), /选项范围规则无效/)
    const result = await client.request('self-test', { rules })
    assert.equal(result.validatedRules, rules.length, '控制组件未校验完整发布词库')
  } finally { await client.close() }
})
})()
