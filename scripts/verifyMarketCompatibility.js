import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const invalid = message => { throw new Error(`市集兼容性验证失败：${message}`) }

export function uniquePatternOffset(bytes, pattern) {
  if (!pattern.length) invalid('指令指纹不能为空')
  const found = bytes.indexOf(pattern)
  if (found < 0) invalid('指令指纹没有匹配')
  if (bytes.indexOf(pattern, found + 1) >= 0) invalid('指令指纹存在多个匹配')
  return found
}

function hexBytes(value) {
  if (typeof value !== 'string' || !/^(?:[a-f0-9]{2})+$/i.test(value)) invalid('指令指纹格式无效')
  return Buffer.from(value, 'hex')
}

function address(value) {
  if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value)) invalid('RVA 格式无效')
  const result = Number(value)
  if (!Number.isSafeInteger(result) || result > 0xffffffff) invalid('RVA 超出范围')
  return result
}

export function verifyMarketCompatibility(executable, profile) {
  if (!Buffer.isBuffer(executable) || profile?.schemaVersion !== 1 || profile.game !== 'poe1'
    || !/^[a-f0-9]{64}$/i.test(profile.sha256 || '')) invalid('输入或兼容资料格式无效')
  const hash = createHash('sha256').update(executable).digest('hex')
  if (hash !== profile.sha256.toLowerCase()) invalid('可执行文件哈希不在当前支持范围，未尝试重新定位')
  const requireRange = (offset, size) => {
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(size) || offset < 0 || size < 0
      || offset > executable.length - size) invalid('PE 文件边界无效')
  }
  requireRange(0, 64)
  if (executable.readUInt16LE(0) !== 0x5a4d) invalid('缺少 DOS 文件头')
  const pe = executable.readUInt32LE(0x3c)
  requireRange(pe, 24)
  if (executable.readUInt32LE(pe) !== 0x4550 || executable.readUInt16LE(pe + 4) !== 0x8664) invalid('不是 x64 PE 文件')
  const sectionCount = executable.readUInt16LE(pe + 6)
  const optionalSize = executable.readUInt16LE(pe + 20)
  if (sectionCount < 1 || sectionCount > 96 || optionalSize < 160) invalid('PE 结构大小无效')
  const optional = pe + 24
  requireRange(optional, optionalSize + sectionCount * 40)
  if (executable.readUInt16LE(optional) !== 0x20b) invalid('不是 PE32+ 文件')
  if (executable.readUInt32LE(pe + 8) !== address(profile.image.timeDateStamp)
    || executable.readUInt32LE(optional + 56) !== address(profile.image.sizeOfImage)
    || executable.readBigUInt64LE(optional + 24) !== BigInt(profile.image.imageBase)) invalid('PE 版本身份不匹配')
  const sections = []
  for (let index = 0; index < sectionCount; index++) {
    const offset = optional + optionalSize + index * 40
    const section = {
      name: executable.subarray(offset, offset + 8).toString('ascii').replace(/\0.*$/, ''),
      rva: executable.readUInt32LE(offset + 12),
      rawSize: executable.readUInt32LE(offset + 16),
      rawOffset: executable.readUInt32LE(offset + 20)
    }
    requireRange(section.rawOffset, section.rawSize)
    sections.push(section)
  }
  const text = sections.filter(section => section.name === '.text')
  if (text.length !== 1) invalid('找不到唯一的 .text 段')
  const code = executable.subarray(text[0].rawOffset, text[0].rawOffset + text[0].rawSize)
  const mapRva = (rva, length) => {
    const section = sections.find(section => rva >= section.rva && rva - section.rva <= section.rawSize - length)
    if (!section) invalid('RVA 不在文件资源范围内')
    return section.rawOffset + rva - section.rva
  }
  const protectedRanges = []
  const verifySignature = (rva, bytes, label) => {
    const found = uniquePatternOffset(code, bytes) + text[0].rva
    if (found !== rva) invalid(`${label} 唯一匹配位置发生变化，未尝试重新定位`)
    protectedRanges.push({ start: rva, end: rva + bytes.length, label })
  }
  const methods = {}
  for (const key of ['lookup', 'searchBuilder', 'stringCtor', 'stringDtor']) {
    const rva = address(profile[key]?.rva)
    const bytes = hexBytes(profile[key]?.prologue)
    if (bytes.length < 64 || bytes.length > 128) invalid(`${key} 指纹长度不在 64–128 字节范围内`)
    verifySignature(rva, bytes, key)
    methods[key] = { rva: profile[key].rva, bytes: bytes.length, matches: 1 }
  }
  if (!Array.isArray(profile.sites) || !profile.sites.length) invalid('没有市集字段调用点')
  for (const site of profile.sites) {
    const rva = address(site.contextRva)
    const context = hexBytes(site.contextBytes)
    const callRva = address(site.callRva)
    const returnRva = address(site.returnRva)
    if (callRva < rva || returnRva !== callRva + 5 || returnRva >= rva + context.length) invalid('字段调用点边界无效')
    verifySignature(rva, context, `${site.section}.${site.field}`)
    const call = mapRva(callRva, 5)
    if (executable[call] !== 0xe8 || returnRva + executable.readInt32LE(call + 1) !== address(profile.lookup.rva))
      invalid('字段调用点不再指向已验证的查找函数')
  }
  // Loader relocations would change otherwise matching bytes under ASLR.
  const relocationRva = executable.readUInt32LE(optional + 152)
  const relocationSize = executable.readUInt32LE(optional + 156)
  let relocations = 0
  if (relocationSize) {
    const relocationOffset = mapRva(relocationRva, relocationSize)
    const end = relocationOffset + relocationSize
    for (let offset = relocationOffset; offset < end;) {
      if (end - offset < 8) invalid('重定位块被截断')
      const page = executable.readUInt32LE(offset)
      const size = executable.readUInt32LE(offset + 4)
      if (size < 8 || size % 2 || size > end - offset) invalid('重定位块大小无效')
      for (let item = offset + 8; item < offset + size; item += 2) {
        const entry = executable.readUInt16LE(item)
        const type = entry >>> 12
        if (type === 0) continue
        if (type !== 10 && type !== 3) invalid('未支持的重定位类型')
        const target = page + (entry & 0xfff)
        const width = type === 10 ? 8 : 4
        if (protectedRanges.some(range => target < range.end && target + width > range.start)) invalid('指令指纹包含 ASLR 重定位')
        relocations++
      }
      offset += size
    }
  }
  return { passed: true, buildId: profile.buildId, executableSha256: hash, methods, siteContexts: profile.sites.length, checkedRelocations: relocations }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) invalid('用法：node scripts/verifyMarketCompatibility.js <游戏可执行文件路径>')
    const profile = JSON.parse(fs.readFileSync(new URL('../electron/native/market-localization/compatibility.json', import.meta.url), 'utf8'))
    console.log(JSON.stringify(verifyMarketCompatibility(fs.readFileSync(process.argv[2]), profile), null, 2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
