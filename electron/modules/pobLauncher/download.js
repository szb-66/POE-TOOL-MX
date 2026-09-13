import fs from 'node:fs/promises'
import path from 'node:path'
import { createWriteStream } from 'node:fs'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { createHash } from 'node:crypto'
import { crc32 } from 'node:zlib'
import yauzl from 'yauzl'
import { load } from 'cheerio'
import { relativePath } from './files.js'

const GITHUB = 'https://github.com'
const POB_REPO = '/PathOfBuildingCommunity/PathOfBuilding'
const CHARM_FEED = `${GITHUB}/Chuanhsing/PoeCharm/commits/main.atom`
const headers = { 'User-Agent': 'PoE-CN-Helper-PobLauncher', Accept: 'text/html,application/atom+xml' }
async function metadata(url, signal) {
  const response = await fetch(url, { headers, signal: combinedSignal(signal, 30000) })
  if (!response.ok) throw new Error(response.status === 403 || response.status === 429
    ? 'GitHub 官方页面暂时限制访问，请稍后重试' : `官方版本查询失败（HTTP ${response.status}）`)
  const finalUrl = new URL(response.url)
  if (finalUrl.origin !== GITHUB || finalUrl.search || finalUrl.hash) throw new Error('官方版本页面跳转地址无效')
  return { url: finalUrl.href, text: await response.text() }
}
const combinedSignal = (signal, timeout) => signal ? AbortSignal.any([signal, AbortSignal.timeout(timeout)]) : AbortSignal.timeout(timeout)
export async function resolveRelease(component, { signal } = {}) {
  if (component === 'charm') {
    const data = await metadata(CHARM_FEED, signal)
    const $ = load(data.text, { xmlMode: true })
    const sha = $('feed > entry').first().children('id').text().match(/^tag:github\.com,2008:Grit::Commit\/([a-f0-9]{40})$/)?.[1]
    if (data.url !== CHARM_FEED || $('feed > id').text() !== 'tag:github.com,2008:/Chuanhsing/PoeCharm/commits/main' || !sha) {
      throw new Error('PoeCharm 官方提交订阅无效，无法确认最新版本')
    }
    return { version: sha, url: `https://codeload.github.com/Chuanhsing/PoeCharm/zip/${sha}` }
  }
  if (component !== 'pob') throw new Error('不支持的 PoB 组件')
  const latest = await metadata(`${GITHUB}${POB_REPO}/releases/latest`, signal)
  const version = new URL(latest.url).pathname.match(/^\/PathOfBuildingCommunity\/PathOfBuilding\/releases\/tag\/(v?\d+(?:\.\d+){1,3})$/)?.[1]
  if (!version) throw new Error('无法确认官方 PoB 最新稳定版本')
  const assetsUrl = `${GITHUB}${POB_REPO}/releases/expanded_assets/${version}`
  const assets = await metadata(assetsUrl, signal)
  if (assets.url !== assetsUrl) throw new Error('PoB 官方安装包列表跳转地址无效')
  const $ = load(assets.text)
  const prefix = `${POB_REPO}/releases/download/${version}/`
  const matches = $('a[href]').toArray().filter(link => {
    const href = $(link).attr('href')
    return href.startsWith(prefix) && /^PathOfBuildingCommunity-Portable(?:[-.][\d.]+)?\.zip$/i.test(href.slice(prefix.length))
  })
  if (matches.length !== 1) {
    throw new Error('未找到官方 PoB 稳定版 Portable 安装包')
  }
  const asset = $(matches[0])
  const digest = asset.closest('li').find('clipboard-copy[value^="sha256:"]').attr('value') || ''
  if (digest && !/^sha256:[a-f0-9]{64}$/.test(digest)) throw new Error('PoB 官方安装包校验信息无效')
  return { version, url: `${GITHUB}${asset.attr('href')}`, digest }
}

export async function download(release, destination, onProgress = () => {}, { signal } = {}) {
  signal = combinedSignal(signal, 15 * 60 * 1000)
  const response = await fetch(release.url, { signal, headers: { 'User-Agent': headers['User-Agent'] } })
  if (!response.ok || !response.body) throw new Error(`安装包下载失败（HTTP ${response.status}）`)
  const total = Number(response.headers.get('content-length')) || 0
  let received = 0
  const hash = createHash('sha256')
  const meter = new Transform({ transform(chunk, _encoding, callback) {
    received += chunk.length
    if (received > 2 * 1024 ** 3) return callback(new Error('安装包超过大小限制'))
    hash.update(chunk)
    onProgress({ received, total, unit: 'bytes', percent: total ? Math.min(99, Math.floor(received / total * 100)) : null })
    callback(null, chunk)
  } })
  await pipeline(Readable.fromWeb(response.body), meter, createWriteStream(destination, { flags: 'wx' }), { signal })
  if (release.digest && release.digest !== `sha256:${hash.digest('hex')}`) throw new Error('安装包校验失败')
  onProgress({ received, total: total || received, unit: 'bytes', percent: 100 })
}

// Keep one archive handle: validate every path before creating output, then CRC-check
// all contents before extraction. Streaming writes report only completed disk writes.
export async function extractArchive(file, destination, { signal, onProgress = () => {} } = {}) {
  signal?.throwIfAborted()
  const handle = await fs.open(file, 'r')
  let zip
  try {
    const reader = new NativeArchiveReader(handle)
    const { size } = await handle.stat()
    zip = await new Promise((resolve, reject) => yauzl.fromRandomAccessReader(reader, size,
      { lazyEntries: true, strictFileNames: true, autoClose: false }, (error, value) => error ? reject(error) : resolve(value)))
  } catch (error) { await handle.close(); throw error }
  let archiveError
  const rememberError = error => { archiveError = error }
  zip.on('error', rememberError)
  const check = () => { signal?.throwIfAborted(); if (archiveError) throw archiveError }
  try {
    onProgress({ phase: 'verifying', received: 0, total: 0, unit: 'bytes', percent: null })
    const entries = [], seen = new Set()
    let total = 0
    await new Promise((resolve, reject) => {
      const cleanup = () => { zip.off('entry', entry); zip.off('end', end); zip.off('error', fail); signal?.removeEventListener('abort', abort) }
      const fail = error => { cleanup(); reject(error) }
      const abort = () => fail(signal.reason)
      const end = () => { cleanup(); resolve() }
      const entry = value => {
        try {
          check()
          const name = relativePath(value.fileName.replace(/\/$/, ''))
          const mode = (value.externalFileAttributes >>> 16) & 0xf000
          if (mode && mode !== 0x8000 && mode !== 0x4000) throw new Error('安装包包含链接或特殊文件')
          if (seen.has(name.toLowerCase())) throw new Error('安装包包含重复路径')
          seen.add(name.toLowerCase())
          total += value.uncompressedSize
          if (entries.length >= 100000 || total > 4 * 1024 ** 3) throw new Error('安装包解压大小超过限制')
          entries.push(value)
          zip.readEntry()
        } catch (error) { fail(error) }
      }
      zip.on('entry', entry); zip.once('end', end); zip.once('error', fail)
      signal?.addEventListener('abort', abort, { once: true })
      if (signal?.aborted) abort(); else zip.readEntry()
    })
    for (const phase of ['verifying', 'extracting']) {
      let received = 0
      const report = (complete = false) => onProgress({ phase, received, total, unit: 'bytes',
        percent: complete ? 100 : total ? Math.min(99, Math.floor(received / total * 100)) : 0 })
      check(); report()
      if (phase === 'extracting') await fs.mkdir(destination, { recursive: true })
      for (const entry of entries) {
        check()
        const target = path.join(destination, entry.fileName)
        if (entry.fileName.endsWith('/')) {
          if (phase === 'extracting') await fs.mkdir(target, { recursive: true })
          continue
        }
        let output
        try {
          if (phase === 'extracting') {
            await fs.mkdir(path.dirname(target), { recursive: true })
            output = await fs.open(target, 'wx')
          }
          const input = await new Promise((resolve, reject) => zip.openReadStream(entry,
            (error, stream) => error ? reject(error) : resolve(stream)))
          let checksum = 0
          await consumeEntry(input, async chunk => {
            check()
            checksum = crc32(chunk, checksum)
            if (output) {
              let offset = 0
              while (offset < chunk.length) {
                check()
                const { bytesWritten } = await output.write(chunk, offset, chunk.length - offset)
                if (!bytesWritten) throw new Error('解压写入未完成')
                offset += bytesWritten; received += bytesWritten; report()
              }
            } else { received += chunk.length; report() }
          }, signal)
          if (checksum !== entry.crc32) throw new Error('安装包文件校验失败，请重新下载')
        } finally { await output?.close() }
      }
      check(); report(true)
    }
  } finally {
    try {
      await new Promise((resolve, reject) => {
        if (!zip.isOpen) return resolve()
        const cleanup = () => { zip.off('close', closed); zip.off('error', failed) }
        const closed = () => { cleanup(); resolve() }
        const failed = error => { cleanup(); reject(error) }
        zip.once('close', closed); zip.once('error', failed); zip.close()
      })
    } finally { zip.off('error', rememberError) }
  }
}

// fd-slicer 1.x marks streams destroyed before push(null). Newer Electron/Node
// discards that EOF, leaving yauzl's inflater waiting forever. Keep yauzl's ZIP
// parser but use native file streams with a normal EOF/destroy lifecycle.
class NativeArchiveReader extends yauzl.RandomAccessReader {
  constructor(handle) { super(); this.handle = handle }
  createReadStream({ start, end }) {
    this.ref()
    const handle = this.handle
    let position = start
    const stream = new Readable({ read(size) {
      if (position === end) { this.push(null); return }
      const buffer = Buffer.alloc(Math.min(size, end - position))
      handle.read(buffer, 0, buffer.length, position).then(({ bytesRead }) => {
        if (this.destroyed) return
        if (!bytesRead) { this.destroy(new Error('安装包提前结束')); return }
        position += bytesRead
        this.push(buffer.subarray(0, bytesRead))
      }, error => this.destroy(error))
    } })
    let released = false
    const release = () => { if (!released) { released = true; this.unref() } }
    stream.once('end', release); stream.once('close', release); stream.once('error', release)
    return stream
  }
  read(buffer, offset, length, position, callback) {
    this.handle.read(buffer, offset, length, position).then(({ bytesRead }) => callback(null, bytesRead), callback)
  }
  close(callback) { this.handle.close().then(() => callback(), callback) }
}

// yauzl 2's inflater wrapper overrides destroy() without emitting close. Await
// end + completed writes explicitly, with backpressure and cancellation.
function consumeEntry(input, consume, signal) {
  return new Promise((resolve, reject) => {
    let pending = Promise.resolve(), settled = false
    const cleanup = () => {
      input.off('data', data); input.off('end', end); input.off('error', fail)
      signal?.removeEventListener('abort', abort)
    }
    const fail = error => {
      if (settled) return
      settled = true
      input.destroy()
      pending.catch(() => {}).then(() => { cleanup(); reject(error) })
    }
    const abort = () => fail(signal.reason)
    const end = () => {
      if (settled) return
      pending.then(() => { if (!settled) { settled = true; cleanup(); resolve() } }, fail)
    }
    const data = chunk => {
      input.pause()
      pending = consume(chunk)
      pending.then(() => { if (!settled) input.resume() }, fail)
    }
    input.on('error', fail); input.once('end', end)
    signal?.addEventListener('abort', abort, { once: true })
    if (signal?.aborted) abort(); else input.on('data', data)
  })
}
