import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const invalid = message => { throw new Error(`市集结构无法确认兼容，已停止翻译：${message}；请等待组件适配`) }
const check = (condition, message) => { if (!condition) invalid(message) }
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const rvaText = value => `0x${value.toString(16)}`
const abi = 'poe1-market-json16-msvc-string32-v1'
const methodNames = ['lookup', 'searchBuilder', 'stringCtor', 'stringDtor', 'itemsReader', 'statsReader', 'filtersReader']

export function uniquePatternOffset(bytes, pattern) {
  check(pattern.length > 0, '指令指纹不能为空')
  const found = bytes.indexOf(pattern)
  check(found >= 0, '指令指纹没有匹配')
  check(bytes.indexOf(pattern, found + 1) < 0, '指令指纹存在多个匹配')
  return found
}

function hexBytes(value) {
  check(typeof value === 'string' && value.length > 0 && value.length <= 524288 && /^(?:[a-f0-9]{2})+$/i.test(value), '指令指纹格式无效')
  return Buffer.from(value, 'hex')
}
function address(value) {
  check(typeof value === 'string' && /^0x[0-9a-f]{1,8}$/i.test(value), 'RVA 格式无效')
  return Number(value)
}

function parseImage(bytes) {
  check(Buffer.isBuffer(bytes) && bytes.length >= 256 && bytes.length <= 256 * 1024 * 1024, '可执行文件大小不受支持')
  const bounds = (offset, length) => check(Number.isSafeInteger(offset) && Number.isSafeInteger(length) && offset >= 0 && length >= 0 && offset <= bytes.length - length, 'PE 文件边界无效')
  const u16 = offset => { bounds(offset, 2); return bytes.readUInt16LE(offset) }
  const u32 = offset => { bounds(offset, 4); return bytes.readUInt32LE(offset) }
  check(u16(0) === 0x5a4d, '缺少DOS文件头')
  const pe = u32(0x3c); bounds(pe, 24)
  check(u32(pe) === 0x4550 && u16(pe + 4) === 0x8664, '不是Windows x64客户端')
  const count = u16(pe + 6), optionalSize = u16(pe + 20), optional = pe + 24
  check(count >= 1 && count <= 96 && optionalSize >= 160, 'PE节或数据目录不完整')
  bounds(optional, optionalSize + count * 40)
  check(u16(optional) === 0x20b && u32(optional + 108) >= 6, '不是完整PE32+映像')
  const timestamp = u32(pe + 8), size = u32(optional + 56), base = bytes.readBigUInt64LE(optional + 24)
  check(size > 0 && size <= 512 * 1024 * 1024 && base > 0n, 'PE映像范围无效')
  const sections = []
  for (let index = 0; index < count; index++) {
    const at = optional + optionalSize + index * 40
    const section = { name: bytes.subarray(at, at + 8).toString('ascii').replace(/\0.*$/, ''), rva: u32(at + 12), rawSize: u32(at + 16), raw: u32(at + 20), flags: u32(at + 36) }
    check(section.rva + section.rawSize <= size, 'PE节范围无效'); bounds(section.raw, section.rawSize)
    for (const prior of sections) {
      if (!section.rawSize || !prior.rawSize) continue
      check(section.rva + section.rawSize <= prior.rva || prior.rva + prior.rawSize <= section.rva, 'PE虚拟节重叠')
      check(section.raw + section.rawSize <= prior.raw || prior.raw + prior.rawSize <= section.raw, 'PE文件节重叠')
    }
    sections.push(section)
  }
  const texts = sections.filter(section => section.name === '.text')
  check(texts.length === 1 && (texts[0].flags & 0xe0000000) === 0x60000000, '缺少唯一只读可执行代码节')
  const text = texts[0], code = bytes.subarray(text.raw, text.raw + text.rawSize)
  const map = (rva, length, { executable = false, constant = false } = {}) => {
    check(Number.isSafeInteger(rva) && rva >= 0 && rva <= 0xffffffff && Number.isSafeInteger(length) && length >= 0, '资源地址无效')
    const matches = sections.filter(section => rva >= section.rva && rva + length <= section.rva + section.rawSize)
    check(matches.length === 1 && (matches[0].flags & 0x40000000) !== 0, '资源地址不在可读PE节内')
    const section = matches[0]
    check(!executable || (section.name === '.text' && (section.flags & 0x20000000) !== 0), '函数不在可执行代码节内')
    check(!constant || (section.flags & 0xa0000000) === 0, '字段键不在只读数据节内')
    return section.raw + rva - section.rva
  }
  const exceptionRva = u32(optional + 136), exceptionSize = u32(optional + 140)
  check(exceptionRva !== 0 && exceptionSize > 0 && exceptionSize <= 12000000 && exceptionSize % 12 === 0, '缺少可靠函数边界目录')
  const exceptions = map(exceptionRva, exceptionSize), functions = new Map()
  for (let offset = 0; offset < exceptionSize; offset += 12) {
    const start = u32(exceptions + offset), end = u32(exceptions + offset + 4)
    check(start < end && end <= size && !functions.has(start), '函数边界目录无效或重复')
    functions.set(start, { start, end })
  }
  const relocationRva = u32(optional + 152), relocationSize = u32(optional + 156)
  check(relocationSize <= 16 * 1024 * 1024 && (!relocationSize || relocationRva !== 0), '重定位目录无效')
  return { map, functions, text, code, timestamp, size, base, relocationRva, relocationSize, u16, u32 }
}

export function verifyMarketCompatibility(executable, profile) {
  check(profile?.schemaVersion === 1 && profile.structureVersion === 1 && profile.game === 'poe1' && profile.abi === abi && profile.validatedInGame === true, '缺少已验证的结构基准')
  const image = parseImage(executable), resolved = structuredClone(profile), methods = {}, ranges = []
  for (const name of methodNames) {
    const method = profile[name], prologue = hexBytes(method?.prologue), bodySize = method?.bodySize
    check(prologue.length >= 64 && prologue.length <= 128 && Number.isInteger(bodySize) && bodySize >= prologue.length && bodySize <= 262144 && /^[a-f0-9]{64}$/.test(method?.bodySha256 || ''), '完整函数指纹无效')
    const rva = uniquePatternOffset(image.code, prologue) + image.text.rva, runtime = image.functions.get(rva)
    check(runtime && runtime.end - runtime.start === bodySize, '关键函数边界已改变')
    const raw = image.map(rva, bodySize, { executable: true }), body = executable.subarray(raw, raw + bodySize)
    check(hash(body) === method.bodySha256, '关键函数完整内容已改变')
    check(!ranges.some(range => rva < range.end && rva + bodySize > range.start), '关键函数范围重叠')
    ranges.push({ start: rva, end: rva + bodySize })
    resolved[name].rva = rvaText(rva)
    methods[name] = { rva: rvaText(rva), bytes: prologue.length, bodySize, bodySha256: method.bodySha256, matches: 1 }
  }
  check(Array.isArray(profile.sites) && profile.sites.length === 12, '目录调用点基准不完整')
  const calls = new Set(), counts = new Map()
  for (const [index, site] of profile.sites.entries()) {
    check(['items', 'stats', 'filters'].includes(site.section) && ['label', 'type', 'text', 'name', 'title', 'placeholder'].includes(site.field), '调用点字段无效')
    check(site.fieldKey === site.field, '调用点缺少可靠字段键')
    const readerName = `${site.section}Reader`, reader = methods[readerName], oldReader = address(profile[readerName].rva)
    const oldContext = address(site.contextRva), oldCall = address(site.callRva), oldReturn = address(site.returnRva)
    const context = hexBytes(site.contextBytes), callBytes = hexBytes(site.callBytes)
    check(oldContext >= oldReader && oldCall >= oldContext && oldReturn === oldCall + 5 && oldReturn < oldContext + context.length && context.length >= 20 && context.length <= 128 && oldContext - oldReader + context.length <= reader.bodySize, '调用点相对函数边界无效')
    const contextRva = Number(reader.rva) + oldContext - oldReader, callRva = contextRva + oldCall - oldContext, returnRva = callRva + 5
    check(!calls.has(callRva) && uniquePatternOffset(image.code, context) + image.text.rva === contextRva, '调用点位置或唯一性已改变'); calls.add(callRva)
    const at = image.map(contextRva, context.length, { executable: true }), call = image.map(callRva, 5, { executable: true })
    check(callBytes.length === 5 && callBytes.equals(executable.subarray(call, call + 5)) && executable[call] === 0xe8 && returnRva + executable.readInt32LE(call + 1) === Number(methods.lookup.rva), '调用点不再指向目录读取函数')
    check(context[0] === 0x48 && context[1] === 0x8d && context[2] === 0x15, '字段键寻址方式已改变')
    const keyRva = contextRva + 7 + executable.readInt32LE(at + 3), expectedKey = Buffer.from(`${site.field}\0`, 'utf8')
    const key = image.map(keyRva, expectedKey.length, { constant: true })
    check(expectedKey.equals(executable.subarray(key, key + expectedKey.length)), '目录字段键已改变')
    ranges.push({ start: keyRva, end: keyRva + expectedKey.length })
    Object.assign(resolved.sites[index], { contextRva: rvaText(contextRva), callRva: rvaText(callRva), returnRva: rvaText(returnRva) })
    counts.set(site.section, (counts.get(site.section) || 0) + 1)
  }
  check(counts.size === 3 && [...counts.values()].every(count => count === 4), '目录调用分组不完整')
  let relocations = 0
  if (image.relocationSize) {
    const begin = image.map(image.relocationRva, image.relocationSize), end = begin + image.relocationSize
    for (let offset = begin; offset < end;) {
      check(offset <= end - 8, '重定位块被截断')
      const page = image.u32(offset), size = image.u32(offset + 4)
      check(size >= 8 && size % 2 === 0 && size <= end - offset, '重定位块大小无效')
      for (let at = offset + 8; at < offset + size; at += 2) {
        const entry = image.u16(at), type = entry >>> 12
        if (type === 0) continue
        check(type === 3 || type === 10, '重定位类型不受支持')
        const target = page + (entry & 0xfff), width = type === 10 ? 8 : 4
        check(target + width <= image.size, '重定位地址越界')
        check(!ranges.some(range => target < range.end && target + width > range.start), '关键函数或字段包含ASLR重定位')
        relocations++
      }
      offset += size
    }
  }
  const executableSha256 = hash(executable)
  Object.assign(resolved, { referenceBuildId: profile.buildId, referenceSha256: profile.sha256, sha256: executableSha256,
    referenceValidatedInGame: true, structurallyCompatible: true, validatedInGame: executableSha256 === profile.sha256,
    image: { imageBase: `0x${image.base.toString(16)}`, sizeOfImage: rvaText(image.size), timeDateStamp: rvaText(image.timestamp) }, checkedRelocations: relocations })
  return { passed: true, buildId: profile.buildId, executableSha256: resolved.sha256, referenceSha256: profile.sha256, structureVersion: 1, abi, methods,
    siteContexts: profile.sites.length, checkedRelocations: relocations, resolvedProfile: resolved }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    check(process.argv.length === 3, '用法：node scripts/verifyMarketCompatibility.js <游戏可执行文件路径>')
    const profile = JSON.parse(fs.readFileSync(new URL('../electron/native/market-localization/compatibility.json', import.meta.url), 'utf8'))
    const { resolvedProfile, ...summary } = verifyMarketCompatibility(fs.readFileSync(process.argv[2]), profile)
    console.log(JSON.stringify(summary, null, 2))
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
