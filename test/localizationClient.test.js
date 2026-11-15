import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { PassThrough, Writable } from 'node:stream'
import { generateKeyPairSync, createHash } from 'node:crypto'
import { buildRelease } from '../shared/localizationProtocol.js'
import { LocalizationDownloader, localizationBaseUrl } from '../electron/modules/localization/downloader.js'
import { LocalizationService } from '../electron/modules/localization/service.js'
import { LocalizationHelperClient } from '../electron/modules/localization/helperClient.js'
import { inspectSteamGame, parseValveKeyValues, assertSteamWritable, probeGameProcesses } from '../electron/modules/localization/steam.js'
import { serverChannelFailure } from '../electron/modules/app/serverIpcPolicy.js'

function temporary(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-localization-test-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  return root
}
function keyPair() {
  return generateKeyPairSync('ed25519', { privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } })
}
const dataset = entries => ({ protocolVersion: 1, engineVersion: 1, gameVersion: '3.30.0b', entries })
const entry = (id, cn = '测试') => ({ table: 'data/clientstrings.datc64', id, field: 'Text', en: `Text ${id}`, tw: `繁體 ${id}`, cn })

test('资源地址只接受HTTPS或显式本机测试HTTP，不允许凭据和路径', () => {
  assert.equal(localizationBaseUrl('http://127.0.0.1:44317'), 'http://127.0.0.1:44317')
  assert.throws(() => localizationBaseUrl('http://example.com'))
  assert.throws(() => localizationBaseUrl('http://127.0.0.1', false))
  assert.throws(() => localizationBaseUrl('https://example.com/unsafe'))
  assert.throws(() => localizationBaseUrl('https://name:password@example.com'))
})

test('签名清单分块增量下载，重复检查不下载，单条变化只传对应桶', async t => {
  const root = temporary(t)
  const keys = keyPair()
  const first = buildRelease(dataset([entry('a'), entry('b'), entry('c')]), keys.privateKey, { releaseId: 'first' })
  let release = first
  let objects = 0
  const downloader = new LocalizationDownloader({ storageRoot: root, publicKey: keys.publicKey, fetchImpl: async url => {
    if (url.endsWith('/stable.json')) return new Response(JSON.stringify(release.envelope), { headers: { etag: release.envelope.manifest.releaseId } })
    objects++
    return new Response(release.blobs.get(url.split('/').pop()))
  } })
  const update = await downloader.check()
  assert.ok(update.downloadBytes > 0)
  const downloaded = await downloader.download()
  assert.equal(downloaded.downloadedObjects, first.blobs.size)
  assert.equal(downloader.load('ready.json').entries.length, 3)
  assert.equal(downloader.load(), null, '下载候选不会提前改变游戏已应用词库')
  downloader.activate(first.envelope)
  assert.equal(downloader.load().manifest.releaseId, 'first')
  const initialRequests = objects
  assert.equal((await downloader.check()).downloadBytes, 0)
  assert.equal((await downloader.download()).downloadedBytes, 0)
  assert.equal(objects, initialRequests)
  release = buildRelease(dataset([entry('a', '新文本'), entry('b'), entry('c')]), keys.privateKey, { releaseId: 'second' })
  assert.equal((await downloader.check()).missingObjects, 1)
  assert.equal((await downloader.download()).downloadedObjects, 1)
  assert.equal(downloader.load().manifest.releaseId, 'first')
})

test('签名错误、缺块、损坏缓存或下载失败时保留旧资源且可重试', async t => {
  const root = temporary(t)
  const keys = keyPair()
  const first = buildRelease(dataset([entry('a')]), keys.privateKey, { releaseId: 'first' })
  let envelope = first.envelope
  let failDownload = false
  const downloader = new LocalizationDownloader({ storageRoot: root, publicKey: keys.publicKey, fetchImpl: async url => url.endsWith('/stable.json')
    ? new Response(JSON.stringify(envelope))
    : failDownload ? new Response('failed', { status: 503 }) : new Response(first.blobs.get(url.split('/').pop())) })
  await downloader.check(); await downloader.download(); downloader.activate(first.envelope)
  envelope = structuredClone(first.envelope); envelope.manifest.gameVersion = 'tampered'
  await assert.rejects(downloader.check(), /签名/)
  assert.equal(downloader.load().manifest.releaseId, 'first')
  envelope = first.envelope
  const descriptor = first.envelope.manifest.objects[0]
  fs.writeFileSync(downloader.objectPath(descriptor.sha256), 'corrupt')
  assert.equal((await downloader.check()).missingObjects, 1)
  failDownload = true
  await assert.rejects(downloader.download(), /HTTP 503/)
  failDownload = false
  await downloader.download()
  assert.equal(downloader.load().manifest.releaseId, 'first')
})

test('Steam清单验证appid与目录；写入时游戏进程或更新不明确均拒绝', async t => {
  const root = temporary(t)
  const steamapps = path.join(root, 'steamapps')
  const game = path.join(steamapps, 'common', 'Path of Exile')
  fs.mkdirSync(path.join(game, 'Bundles2'), { recursive: true })
  fs.writeFileSync(path.join(game, 'Bundles2', '_.index.bin'), 'index')
  fs.writeFileSync(path.join(game, 'PathOfExileSteam.exe'), 'exe')
  const manifest = path.join(steamapps, 'appmanifest_238960.acf')
  const text = flags => `"AppState" { "appid" "238960" "installdir" "Path of Exile" "buildid" "1234" "StateFlags" "${flags}" }`
  fs.writeFileSync(manifest, text(4))
  assert.equal(inspectSteamGame(game).buildId, '1234')
  assert.equal(parseValveKeyValues('"path" "E:\\\\Games"').path, 'E:\\Games')
  await assert.rejects(assertSteamWritable(game, { platform: 'win32', processProbe: async () => null }), /无法确认/)
  await assert.rejects(assertSteamWritable(game, { platform: 'win32', processProbe: async () => [123] }), /退出/)
  fs.writeFileSync(manifest, text(6))
  await assert.rejects(assertSteamWritable(game, { platform: 'win32', processProbe: async () => [] }), /状态不明/)
  fs.writeFileSync(manifest, text(4))
  assert.equal((await assertSteamWritable(game, { platform: 'win32', processProbe: async () => [] })).buildId, '1234')
  fs.mkdirSync(path.join(steamapps, 'downloading', '238960'), { recursive: true })
  await assert.rejects(assertSteamWritable(game, { platform: 'win32', processProbe: async () => [] }), /暂存目录/)
  assert.equal(await probeGameProcesses({ execFileImpl: async () => ({ stdout: 'invalid' }) }), null)
})

test('构造和查询状态不联网，不自动扫描；仅手动应用成功后切换查价词库', async t => {
  const root = temporary(t)
  let helperCalls = 0
  let activated = 0
  const bundle = { manifest: { releaseId: 'new' }, entries: [entry('a')], envelope: {} }
  const downloader = { load: file => file === 'ready.json' ? bundle : null, check: async () => ({ releaseId: 'new', missingObjects: 0 }), download: async () => ({ downloadedBytes: 0 }), activate: () => { activated++ } }
  const helper = { available: () => true, run: async operation => { helperCalls++; return operation === 'scan' ? { applied: false } : operation === 'restore' ? { applied: false, restored: true } : { applied: true, resourceVersion: 'new' } } }
  const service = new LocalizationService({ serverId: 'international', storageRoot: root, downloader, helper, discover: async () => [], inspect: () => ({ gameDirectory: root }), assertWritable: async () => ({ gameDirectory: root }), verifyInstalled: () => ({ ready: true }) })
  assert.equal(service.getStatus().busy, false)
  assert.equal(helperCalls, 0)
  assert.equal(service.getActiveEntries().length, 0)
  const applied = await service.apply({ gameDirectory: root })
  assert.equal(applied.busy, false)
  assert.equal(activated, 1)
  assert.equal(service.getActiveRevision(), 'new')
  await service.restore({ gameDirectory: root })
  assert.equal(service.getActiveEntries().length, 0)
})

test('扫描以原生事务结果恢复同代词库，未知版本或游戏还原后不继续使用旧映射', async t => {
  const root = temporary(t)
  const old = { manifest: { releaseId: 'old' }, entries: [entry('old')], envelope: {} }
  const next = { manifest: { releaseId: 'next' }, entries: [entry('next')], envelope: {} }
  let scan = { applied: true, resourceVersion: 'next' }
  const activations = []
  const service = new LocalizationService({ serverId: 'international', storageRoot: root,
    verifyInstalled: () => ({ ready: true }),
    downloader: { load: file => file === 'ready.json' ? next : old, activate: envelope => activations.push(envelope) },
    helper: { available: () => true, run: async () => scan }, discover: async () => [], inspect: () => ({ gameDirectory: root }) })
  assert.equal(service.getActiveRevision(), 'old')
  await service.scan({ gameDirectory: root })
  assert.equal(service.getActiveRevision(), 'next')
  assert.equal(service.getStatus().mappingState, 'active')
  assert.equal(activations.length, 1)
  scan = { applied: true, resourceVersion: 'unknown' }
  await service.scan({ gameDirectory: root })
  assert.equal(service.getActiveEntries().length, 0)
  assert.equal(service.getStatus().mappingState, 'unavailable')
  assert.match(service.getStatus().mappingWarning, /不匹配/)
  scan = { applied: false }
  await service.scan({ gameDirectory: root })
  assert.equal(service.getStatus().mappingState, 'none')
  assert.equal(service.getStatus().mappingWarning, '')
})

test('启动时和运行期间只读核对原生事务、Steam版本与索引；外部更新后旧中文映射不可用', t => {
  const root = temporary(t)
  const storageRoot = path.join(root, 'user-data', 'localization')
  const steamapps = path.join(root, 'steamapps')
  const game = path.join(steamapps, 'common', 'Path of Exile')
  fs.mkdirSync(path.join(game, 'Bundles2'), { recursive: true })
  fs.mkdirSync(storageRoot, { recursive: true })
  const index = path.join(game, 'Bundles2', '_.index.bin')
  const manifestFile = path.join(steamapps, 'appmanifest_238960.acf')
  const originalIndex = 'known-applied-index'
  fs.writeFileSync(index, originalIndex)
  fs.writeFileSync(path.join(game, 'PathOfExileSteam.exe'), 'exe')
  const manifest = buildId => `"AppState" { "appid" "238960" "installdir" "Path of Exile" "buildid" "${buildId}" "StateFlags" "4" }`
  fs.writeFileSync(manifestFile, manifest('1234'))
  const activeFile = path.join(storageRoot, 'transaction-active.json')
  const active = { version: 1, buildId: '1234', outputHash: createHash('sha256').update(originalIndex).digest('hex'), releaseId: 'known', generation: 'generation' }
  fs.writeFileSync(activeFile, JSON.stringify(active))
  fs.writeFileSync(path.join(storageRoot, 'settings.json'), JSON.stringify({ gameDirectory: game }))
  fs.writeFileSync(path.join(storageRoot, 'active.json'), 'untouched-signed-envelope-placeholder')
  const bundle = { manifest: { releaseId: 'known' }, entries: [entry('known')], envelope: {} }
  let helperCalls = 0
  const options = { serverId: 'international', storageRoot,
    downloader: { load: file => file === 'ready.json' ? null : bundle },
    helper: { available: () => true, run: () => { helperCalls++; throw new Error('Must not run helper automatically') } } }
  const service = new LocalizationService(options)
  assert.equal(service.getActiveRevision(), 'known')
  assert.equal(service.getStatus().mode, 'simplified', '旧事务记录缺少mode时兼容为简体')
  assert.equal(service.getActiveEntries().length, 1)
  assert.equal(helperCalls, 0)
  fs.writeFileSync(index, 'externally-updated-index')
  assert.equal(service.getActiveRevision(), '')
  assert.equal(service.getActiveEntries().length, 0)
  assert.match(service.getStatus().mappingWarning, /索引已改变/)
  assert.equal(fs.readFileSync(path.join(storageRoot, 'active.json'), 'utf8'), 'untouched-signed-envelope-placeholder', '自动核对只读，不删除或重写缓存')
  fs.writeFileSync(index, originalIndex)
  fs.writeFileSync(manifestFile, manifest('1235'))
  const restarted = new LocalizationService(options)
  assert.equal(restarted.getActiveRevision(), '')
  assert.match(restarted.getStatus().mappingWarning, /版本已改变/)
  fs.writeFileSync(manifestFile, manifest('1234'))
  fs.writeFileSync(path.join(storageRoot, 'transaction.json'), '{}')
  assert.equal(service.getActiveEntries().length, 0)
  assert.match(service.getStatus().mappingWarning, /未完成/)
  assert.equal(helperCalls, 0)
  assert.deepEqual(JSON.parse(fs.readFileSync(activeFile, 'utf8')), active)
  fs.unlinkSync(path.join(storageRoot, 'transaction.json'))
  fs.writeFileSync(activeFile, JSON.stringify({ ...active, mode: 'traditional' }))
  const cachedTraditional = new LocalizationService(options)
  assert.equal(cachedTraditional.getStatus().mode, 'traditional')
  assert.equal(cachedTraditional.getActiveRevision(), 'known', '同版缓存繁体映射在重启后仍可验证')
  fs.writeFileSync(activeFile, JSON.stringify({ ...active, mode: 'traditional', releaseId: 'native-tw' }))
  const localTraditional = new LocalizationService({ ...options, downloader: { load: () => null } })
  assert.equal(localTraditional.getStatus().mode, 'traditional', '无词库也能只读恢复繁体模式状态')
  assert.equal(localTraditional.getActiveRevision(), '')
  assert.equal(localTraditional.getStatus().mappingState, 'none')
  const mismatchedCache = new LocalizationService(options)
  assert.equal(mismatchedCache.getStatus().mode, 'traditional')
  assert.equal(mismatchedCache.getActiveRevision(), '', '本地繁体记录不能误激活其他版本缓存')
  for (const mode of [null, 'english']) {
    fs.writeFileSync(activeFile, JSON.stringify({ ...active, mode }))
    const invalidMode = new LocalizationService(options)
    assert.equal(invalidMode.getStatus().mode, null)
    assert.equal(invalidMode.getActiveRevision(), '', '异常模式记录不能激活词库')
  }
  fs.writeFileSync(activeFile, JSON.stringify({ ...active, mode: 'traditional', releaseId: 'native-tw' }))
  fs.writeFileSync(index, 'changed-after-traditional')
  assert.equal(localTraditional.getStatus().mode, null)
  assert.match(localTraditional.getStatus().mappingWarning, /索引已改变/)
  assert.equal(helperCalls, 0, '恢复模式仅做本地校验，不启动组件或联网')
})

test('客户端国服服务拒绝执行，独立国际服设置不读写另一服目录', async t => {
  const root = temporary(t)
  const cnRoot = path.join(root, 'localization')
  const internationalRoot = path.join(root, 'servers', 'international', 'localization')
  const downloader = { load: () => null }
  let calls = 0
  const helper = { available: () => true, run: async () => { calls++; return { baseline: { ready: false } } } }
  const cn = new LocalizationService({ serverId: 'cn', storageRoot: cnRoot, downloader, helper })
  await assert.rejects(cn.scan(), /仅适用于国际服/)
  await assert.rejects(cn.apply(), /仅适用于国际服/)
  assert.equal(calls, 0)
  assert.equal(fs.existsSync(cnRoot), false)
  const international = new LocalizationService({ serverId: 'international', storageRoot: internationalRoot, downloader, helper, discover: async () => [], inspect: value => ({ gameDirectory: value }) })
  await international.scan({ gameDirectory: 'chosen-steam' })
  assert.equal(calls, 1)
  assert.equal(fs.existsSync(path.join(cnRoot, 'settings.json')), false)
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(internationalRoot, 'settings.json'), 'utf8')), { gameDirectory: 'chosen-steam' })
  assert.equal(cn.getStatus().gameDirectory, '')
})

test('国服和切服期间拒绝所有汉化IPC，不因共用设置页开放', () => {
  assert.equal(serverChannelFailure({ id: 'international' }, 'localization:status'), null)
  assert.equal(serverChannelFailure({ id: 'cn' }, 'localization:apply').code, 'SERVER_FEATURE_UNAVAILABLE')
  assert.equal(serverChannelFailure({ id: 'international' }, 'localization:restore', true).code, 'SERVER_SWITCHING')
})

test('原生组件使用固定命令与JSONL协议，拒绝不完整结果、重复结果和错误协议', async t => {
  const root = temporary(t)
  const executable = path.join(root, 'helper.exe')
  fs.writeFileSync(executable, '')
  let request
  let output = [{ protocolVersion: 1, type: 'progress', phase: 'scan', completed: 1, total: 2 }, { protocolVersion: 1, type: 'result', success: true, data: { gameVersion: '3.30' } }]
  const client = new LocalizationHelperClient({ executable, spawnImpl: (file, args, options) => {
    assert.equal(file, executable)
    assert.deepEqual(args, [])
    assert.equal(options.shell, false)
    const child = new EventEmitter()
    child.stdout = new PassThrough()
    child.stderr = new PassThrough()
    child.kill = () => {}
    child.stdin = new Writable({ write(chunk, _encoding, callback) { request = JSON.parse(chunk.toString()); callback() }, final(callback) {
      setImmediate(() => { for (const event of output) child.stdout.write(`${JSON.stringify(event)}\n`); child.emit('close', 0) })
      callback()
    } })
    return child
  } })
  const progress = []
  assert.equal((await client.run('scan', { gameDirectory: 'selected' }, event => progress.push(event))).gameVersion, '3.30')
  assert.equal(request.protocolVersion, 1)
  assert.equal(request.operation, 'scan')
  assert.equal(progress.length, 1)
  output = [{ protocolVersion: 2, type: 'result', success: true }]
  await assert.rejects(client.run('scan', {}), /协议版本/)
  output = [{ protocolVersion: 1, type: 'result', success: true }, { protocolVersion: 1, type: 'result', success: true }]
  await assert.rejects(client.run('scan', {}), /重复结果/)
  output = []
  await assert.rejects(client.run('scan', {}), /未返回完整结果/)
})
