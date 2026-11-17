import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { uniquePatternOffset, verifyMarketCompatibility } from '../scripts/verifyMarketCompatibility.js'

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
