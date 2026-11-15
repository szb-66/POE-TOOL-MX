import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { uniquePatternOffset, verifyMarketCompatibility } from '../scripts/verifyMarketCompatibility.js'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')

function fixture() {
  const bytes = Buffer.alloc(0xb00)
  const pe = 0x80, optional = pe + 24, sections = optional + 0xf0
  bytes.writeUInt16LE(0x5a4d, 0)
  bytes.writeUInt32LE(pe, 0x3c)
  bytes.writeUInt32LE(0x4550, pe)
  bytes.writeUInt16LE(0x8664, pe + 4)
  bytes.writeUInt16LE(2, pe + 6)
  bytes.writeUInt32LE(0x12345678, pe + 8)
  bytes.writeUInt16LE(0xf0, pe + 20)
  bytes.writeUInt16LE(0x20b, optional)
  bytes.writeBigUInt64LE(0x140000000n, optional + 24)
  bytes.writeUInt32LE(0x3000, optional + 56)
  bytes.writeUInt32LE(16, optional + 108)
  bytes.writeUInt32LE(0x2000, optional + 152)
  bytes.writeUInt32LE(12, optional + 156)
  for (const [index, name, rva, raw, size] of [[0, '.text', 0x1000, 0x400, 0x600], [1, '.reloc', 0x2000, 0xa00, 0x100]]) {
    const section = sections + index * 40
    bytes.write(name, section, 'ascii')
    bytes.writeUInt32LE(size, section + 8)
    bytes.writeUInt32LE(rva, section + 12)
    bytes.writeUInt32LE(size, section + 16)
    bytes.writeUInt32LE(raw, section + 20)
  }
  bytes.fill(0xcc, 0x400, 0xa00)
  const profile = {
    schemaVersion: 1, game: 'poe1', buildId: 'fixture',
    image: { imageBase: '0x140000000', timeDateStamp: '0x12345678', sizeOfImage: '0x3000' },
    sites: []
  }
  for (const [index, name] of ['lookup', 'searchBuilder', 'stringCtor', 'stringDtor'].entries()) {
    const offset = 0x10 + index * 0x60
    const prologue = Buffer.alloc(64, 0xa1 + index)
    prologue.copy(bytes, 0x400 + offset)
    profile[name] = { rva: `0x${(0x1000 + offset).toString(16)}`, prologue: prologue.toString('hex') }
  }
  const context = Buffer.from('488d1511223344488bcbe800000000488bd00fb7480e0fb7c1', 'hex')
  const callRva = 0x118a, returnRva = callRva + 5
  context.writeInt32LE(0x1010 - returnRva, 11)
  context.copy(bytes, 0x580)
  profile.sites.push({ section: 'filters', field: 'title', contextRva: '0x1180', contextBytes: context.toString('hex'), callRva: '0x118a', returnRva: '0x118f' })
  bytes.writeUInt32LE(0x1000, 0xa00)
  bytes.writeUInt32LE(12, 0xa04)
  bytes.writeUInt16LE(0xa500, 0xa08)
  profile.sha256 = hash(bytes)
  return { bytes, profile }
}

test('市集指令查找只接受唯一匹配，拒绝零匹配、多匹配和空指纹', () => {
  assert.equal(uniquePatternOffset(Buffer.from('abcde'), Buffer.from('bcd')), 1)
  assert.throws(() => uniquePatternOffset(Buffer.from('abcde'), Buffer.from('zzz')), /没有匹配/)
  assert.throws(() => uniquePatternOffset(Buffer.from('abcabc'), Buffer.from('abc')), /多个匹配/)
  assert.throws(() => uniquePatternOffset(Buffer.from('abc'), Buffer.alloc(0)), /不能为空/)
})

test('市集兼容验证在检查指令前拒绝未知可执行文件，不需要真实游戏安装', () => {
  const { profile } = fixture()
  assert.throws(() => verifyMarketCompatibility(Buffer.from('not the supported game'), profile), /哈希不在当前支持范围.*未尝试重新定位/)
})

test('市集兼容验证接受精确身份、唯一函数、完整调用点及不覆盖指纹的重定位', () => {
  const { bytes, profile } = fixture()
  const result = verifyMarketCompatibility(bytes, profile)
  assert.equal(result.passed, true)
  assert.equal(result.executableSha256, profile.sha256)
  assert.equal(result.siteContexts, 1)
  assert.equal(result.checkedRelocations, 1)
  assert.deepEqual(Object.values(result.methods).map(method => method.matches), [1, 1, 1, 1])
})

test('市集兼容验证不把唯一指纹的新位置当成自动重定位依据', () => {
  const { bytes, profile } = fixture()
  profile.lookup.rva = '0x1011'
  assert.throws(() => verifyMarketCompatibility(bytes, profile), /唯一匹配位置发生变化.*未尝试重新定位/)
})

test('市集兼容验证拒绝已经失配或不再唯一的函数指纹', () => {
  for (const duplicate of [false, true]) {
    const { bytes, profile } = fixture()
    if (duplicate) Buffer.from(profile.lookup.prologue, 'hex').copy(bytes, 0x680)
    else bytes[0x410] = 0xff
    profile.sha256 = hash(bytes)
    assert.throws(() => verifyMarketCompatibility(bytes, profile), duplicate ? /多个匹配/ : /没有匹配/)
  }
})

test('市集调用点即使上下文匹配也必须指向已验证的查找函数', () => {
  const { bytes, profile } = fixture()
  bytes.writeInt32LE(0x1070 - 0x118f, 0x58b)
  profile.sites[0].contextBytes = bytes.subarray(0x580, 0x599).toString('hex')
  profile.sha256 = hash(bytes)
  assert.throws(() => verifyMarketCompatibility(bytes, profile), /调用点不再指向已验证的查找函数/)
})

test('市集指令指纹拒绝被 ASLR 基址重定位覆盖', () => {
  const { bytes, profile } = fixture()
  bytes.writeUInt16LE(0xa010, 0xa08)
  profile.sha256 = hash(bytes)
  assert.throws(() => verifyMarketCompatibility(bytes, profile), /指令指纹包含 ASLR 重定位/)
})
