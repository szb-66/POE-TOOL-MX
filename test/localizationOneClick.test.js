import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { generateKeyPairSync } from 'node:crypto'
import { LocalizationService } from '../electron/modules/localization/service.js'
import { LocalizationDownloader } from '../electron/modules/localization/downloader.js'
import { buildRelease } from '../shared/localizationProtocol.js'

function fixture(t, { fail = '', games, checkWait } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-oneclick-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const game = { gameDirectory: path.join(root, 'game'), gameVersion: '3.30.0b', buildId: '123' }
  const old = { manifest: { releaseId: 'old', gameVersion: game.gameVersion }, entries: [], envelope: { old: true } }
  const next = { manifest: { releaseId: 'next', gameVersion: game.gameVersion }, entries: [], envelope: { next: true } }
  const calls = []
  let ready = null
  function record(step) { calls.push(step); if (fail === step) throw new Error(`failure:${step}`) }
  const downloader = {
    load: file => file === 'ready.json' ? ready : old,
    async check() { record('check'); await checkWait; return { releaseId: 'next', gameVersion: game.gameVersion, missingObjects: 1, downloadBytes: 10 } },
    async download() { record('download'); ready = next; return { downloadedObjects: 1, downloadedBytes: 10, releaseId: 'next' } },
    activate(envelope) { if (envelope === next.envelope) record('activate') }
  }
  const helper = { available: () => true, async run(operation, input) {
    record(operation)
    assert.equal(input.gameDirectory, game.gameDirectory)
    assert.equal(Object.hasOwn(input, 'baselineConfirmed'), false)
    return operation === 'scan' ? { ...game, applied: true, resourceVersion: 'old' } : { ...game, applied: true, resourceVersion: 'next' }
  }, async waitForIdle() { calls.push('idle') } }
  const service = new LocalizationService({ serverId: 'international', storageRoot: root, downloader, helper,
    discover: async () => { record('discover'); return games ?? [game] },
    inspect: directory => { assert.equal(directory, game.gameDirectory); return game },
    assertWritable: async directory => { assert.equal(directory, game.gameDirectory); record('writable'); return game },
    verifyInstalled: () => ({ ready: true }) })
  return { root, game, service, calls }
}

test('一键汉化自动选择唯一安装，检测版本后检查、下载、应用；全过程保持忙碌', async t => {
  const { service, calls, game } = fixture(t)
  assert.deepEqual(calls, [], '初始化和查看页面不会扫描或联网')
  const states = []
  service.on('state', state => states.push(state))
  const result = await service.apply()
  assert.deepEqual(calls, ['discover', 'writable', 'scan', 'check', 'download', 'writable', 'apply', 'activate'])
  assert.equal(result.gameDirectory, game.gameDirectory)
  assert.equal(result.resourceVersion, 'next')
  assert.equal(result.scan.applied, true)
  assert.equal(result.busy, false)
  assert.ok(states.slice(0, -1).every(state => state.busy))
})

for (const fail of ['writable', 'scan', 'check', 'download', 'apply']) {
  test(`一键汉化在 ${fail} 失败后立即停止，保留已应用词库并允许重试`, async t => {
    const { service, calls } = fixture(t, { fail })
    await assert.rejects(service.apply(), new RegExp(`failure:${fail}`))
    assert.equal(calls.at(-1), fail)
    assert.equal(service.getStatus().busy, false)
    assert.equal(service.getActiveRevision(), 'old')
    assert.match(service.getStatus().error, new RegExp(`failure:${fail}`))
  })
}

test('检测到多个Steam安装且未选择时停止，不猜测目标游戏或联网', async t => {
  const { service, calls } = fixture(t, { games: [{ gameDirectory: 'first' }, { gameDirectory: 'second' }] })
  await assert.rejects(service.apply(), /选择.*目录|多个/)
  assert.deepEqual(calls, ['discover'])
})

test('清空目录后自动检测新安装，不沿用已经失效的保存路径', async t => {
  const { service, game } = fixture(t)
  service.state.gameDirectory = 'removed-steam-library'
  const result = await service.apply({ gameDirectory: '' })
  assert.equal(result.gameDirectory, game.gameDirectory)
  assert.equal(result.resourceVersion, 'next')
})

test('发现未完成事务时先恢复本地文件，资源服务离线也不会阻碍本地恢复', async t => {
  const { service, calls, game } = fixture(t, { fail: 'check' })
  service.helper.run = async operation => {
    calls.push(operation)
    return operation === 'scan' ? { ...game, applied: true, resourceVersion: 'old', recoveryNeeded: true } : { ...game, applied: false, restored: true, recoveryNeeded: false }
  }
  await assert.rejects(service.apply(), /failure:check/)
  assert.deepEqual(calls, ['discover', 'writable', 'scan', 'restore', 'check'])
  assert.equal(service.getActiveRevision(), '')
  assert.equal(service.getStatus().scan.applied, false)
})

test('下载期间玩家启动游戏时，写入前再次检查并停止，不应用新词库', async t => {
  const { service, calls } = fixture(t)
  const checkWritable = service.assertWritable
  let checks = 0
  service.assertWritable = async directory => {
    if (++checks === 2) throw new Error('请先退出游戏')
    return checkWritable(directory)
  }
  await assert.rejects(service.apply(), /退出游戏/)
  assert.equal(checks, 2)
  assert.equal(calls.includes('download'), true)
  assert.equal(calls.includes('apply'), false)
  assert.equal(service.getActiveRevision(), 'old')
  assert.equal(service.getStatus().busy, false)
})

test('资源检查期间重复点击被拒绝，退出等待整条一键流程完成', async t => {
  let releaseCheck
  const checkWait = new Promise(resolve => { releaseCheck = resolve })
  const { service, calls } = fixture(t, { checkWait })
  const pending = service.apply()
  while (!calls.includes('check')) await new Promise(resolve => setImmediate(resolve))
  await assert.rejects(service.apply(), /正在执行|等待/)
  let stopped = false
  const shutdown = service.shutdown().then(() => { stopped = true })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(stopped, false)
  await assert.rejects(service.apply(), /退出|重启/)
  releaseCheck()
  await Promise.all([pending, shutdown])
  assert.deepEqual(calls.slice(-3), ['apply', 'activate', 'idle'])
  assert.equal(service.getActiveRevision(), 'next')
})

test('真实签名缓存复用：再次一键汉化仍检查频道，但没有变化资源下载请求', async t => {
  const { root, game } = fixture(t)
  const keys = generateKeyPairSync('ed25519', { privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } })
  const release = buildRelease({ protocolVersion: 1, engineVersion: 1, gameVersion: game.gameVersion,
    entries: [{ table: 'data/clientstrings.datc64', id: 'name', field: 'Text', en: 'Name', tw: '名稱', cn: '名称' }] }, keys.privateKey, { releaseId: 'cached' })
  let channels = 0, objects = 0, applied = false
  const downloader = new LocalizationDownloader({ storageRoot: root, publicKey: keys.publicKey, fetchImpl: async url => {
    if (url.endsWith('/stable.json')) { channels++; return new Response(JSON.stringify(release.envelope)) }
    objects++
    return new Response(release.blobs.get(url.split('/').pop()))
  } })
  const service = new LocalizationService({ serverId: 'international', storageRoot: root, downloader,
    helper: { available: () => true, async run(operation) {
      if (operation === 'apply') applied = true
      return { ...game, applied, ...(applied ? { resourceVersion: 'cached' } : {}) }
    } }, discover: async () => [game], inspect: () => game, assertWritable: async () => game, verifyInstalled: () => ({ ready: true }) })
  await service.apply({ gameDirectory: game.gameDirectory })
  const firstObjects = objects
  assert.ok(firstObjects > 0)
  const second = await service.apply({ gameDirectory: game.gameDirectory })
  assert.equal(channels, 2)
  assert.equal(objects, firstObjects)
  assert.equal(second.download.downloadedBytes, 0)
  assert.equal(second.resourceVersion, 'cached')
})

function modeFixture(t, { cached = true, cacheVersion = '3.30.0b', failApply = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-localization-mode-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const game = { gameDirectory: path.join(root, 'game'), gameVersion: '3.30.0b', buildId: '123' }
  const bundle = { manifest: { releaseId: 'cached', gameVersion: cacheVersion }, entries: [{ table: 'baseitemtypes', id: 'wand', field: 'Name', en: 'Wand', tw: '法杖', cn: '法杖' }], envelope: {} }
  let installed = { ...game, applied: cached, resourceVersion: cached ? 'cached' : null, mode: cached ? 'simplified' : null }
  const calls = [], requests = []
  const service = new LocalizationService({ serverId: 'international', storageRoot: root,
    downloader: {
      load: () => cached ? bundle : null,
      check: async () => { calls.push('check'); return { releaseId: 'cached', missingObjects: 0, downloadBytes: 0 } },
      download: async () => { calls.push('download'); return { releaseId: 'cached', downloadedBytes: 0, downloadedObjects: 0 } },
      activate() {}
    },
    helper: { available: () => true, run: async (operation, input) => {
      calls.push(operation)
      if (operation === 'scan') return installed
      requests.push(input)
      if (failApply) throw new Error('mode apply failed')
      installed = { ...game, applied: true, resourceVersion: input.manifest?.releaseId || 'native-tw', mode: input.mode }
      return installed
    } },
    discover: async () => { calls.push('discover'); return [game] }, inspect: () => game,
    assertWritable: async () => { calls.push('writable'); return game },
    verifyInstalled: () => ({ ready: true, mode: installed.mode })
  })
  return { service, calls, requests }
}

test('切繁体只使用本地资源，不检查或下载服务器词库，保留同版已验证映射', async t => {
  const { service, calls, requests } = modeFixture(t)
  const result = await service.apply({ mode: 'traditional' })
  assert.deepEqual(calls, ['discover', 'writable', 'scan', 'writable', 'apply'])
  assert.equal(requests[0].mode, 'traditional')
  assert.deepEqual(requests[0].entries, [])
  assert.equal(requests[0].manifest.releaseId, 'cached')
  assert.equal(result.mode, 'traditional')
  assert.equal(result.busy, false)
  assert.equal(service.getActiveRevision(), 'cached')
})

for (const options of [{ cached: false }, { cacheVersion: '3.29.3b' }]) {
  test(`没有同版词库也能离线切繁体：${JSON.stringify(options)}`, async t => {
    const { service, calls, requests } = modeFixture(t, options)
    const result = await service.apply({ mode: 'traditional' })
    assert.equal(calls.includes('check'), false)
    assert.equal(calls.includes('download'), false)
    assert.deepEqual(requests[0].entries, [])
    assert.equal(requests[0].manifest, null)
    assert.equal(result.scan.resourceVersion, 'native-tw')
    assert.equal(result.mode, 'traditional')
    assert.equal(service.getActiveEntries().length, 0)
  })
}

test('切繁体失败时保留已应用的简体模式和映射', async t => {
  const { service, calls } = modeFixture(t, { failApply: true })
  await assert.rejects(service.apply({ mode: 'traditional' }), /mode apply failed/)
  assert.equal(calls.includes('check'), false)
  assert.equal(service.getStatus().mode, 'simplified')
  assert.equal(service.getActiveRevision(), 'cached')
  assert.equal(service.getStatus().busy, false)
})

test('非法汉化模式在扫描和联网之前拒绝', async t => {
  const { service, calls } = modeFixture(t)
  for (const mode of ['english', '', null, 42]) await assert.rejects(service.apply({ mode }), /模式|mode/i)
  assert.deepEqual(calls, [])
  assert.equal(service.getStatus().busy, false)
})

test('组件未确认繁体模式时不把切换误报为成功', async t => {
  const { service } = modeFixture(t)
  const nativeRun = service.helper.run
  service.helper.run = async (...args) => {
    const result = await nativeRun(...args)
    if (args[0] === 'apply') delete result.mode
    return result
  }
  await assert.rejects(service.apply({ mode: 'traditional' }), /语言模式/)
  assert.equal(service.getStatus().busy, false)
})

test('语言偏好跨重启和游戏更新保留，扫描不误报已应用，恢复成功后清除', async t => {
  const { service, game } = fixture(t)
  await service.apply({ mode: 'simplified' })
  assert.equal(service.getStatus().preferredMode, 'simplified')
  const options = { serverId: 'international', storageRoot: service.storageRoot, downloader: service.downloader,
    helper: { available: () => true, run: async operation => operation === 'restore' ? { applied: false, restored: true } : { ...game, buildId: '124', applied: false } },
    discover: async () => [game], inspect: () => game, assertWritable: async () => game, verifyInstalled: () => ({ ready: false, reason: 'Steam 游戏版本已改变' }) }
  const restarted = new LocalizationService(options)
  assert.equal(restarted.getStatus().preferredMode, 'simplified')
  assert.equal(restarted.getStatus().mode, null)
  await restarted.scan()
  assert.equal(restarted.getStatus().preferredMode, 'simplified')
  assert.equal(new LocalizationService(options).getStatus().preferredMode, 'simplified')
  await restarted.restore()
  assert.equal(restarted.getStatus().preferredMode, null)
  assert.equal(new LocalizationService(options).getStatus().preferredMode, null)
})

async function cachedCrossVersionFixture(t) {
  const { root, game } = fixture(t)
  const keys = generateKeyPairSync('ed25519', { privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } })
  const release = buildRelease({ protocolVersion: 1, engineVersion: 1, gameVersion: '3.29.3b',
    entries: [{ table: 'clientstrings', id: 'name', field: 'Text', en: 'Name', tw: '名稱', cn: '名称' }] }, keys.privateKey, { releaseId: 'previous-version' })
  let failure = null
  const downloader = new LocalizationDownloader({ storageRoot: root, publicKey: keys.publicKey, fetchImpl: async url => {
    if (failure) {
      if (failure instanceof Error) throw failure
      return failure(url)
    }
    return new Response(url.endsWith('/stable.json') ? JSON.stringify(release.envelope) : release.blobs.get(url.split('/').pop()))
  } })
  await downloader.check(); await downloader.download(); downloader.activate(release.envelope)
  const requests = []
  let applied = false
  let installedMode = null
  let installedRelease = null
  const service = new LocalizationService({ serverId: 'international', storageRoot: root, downloader,
    helper: { available: () => true, run: async (operation, input) => {
      if (operation === 'apply') { requests.push(input); applied = true; installedMode = input.mode; installedRelease = input.manifest.releaseId }
      return { ...game, applied, ...(applied ? { resourceVersion: installedRelease, mode: installedMode } : {}) }
    } }, discover: async () => [game], inspect: () => game, assertWritable: async () => game,
    verifyInstalled: () => ({ ready: applied, reason: 'Steam 游戏版本已改变' }) })
  return { service, downloader, root, release, keys, requests, fail: value => { failure = value } }
}

test('游戏更新后服务不可达时重新验签本地跨版本词库，扫描不会丢失历史候选', async t => {
  const { service, downloader, root, requests, fail } = await cachedCrossVersionFixture(t)
  fs.unlinkSync(path.join(root, 'ready.json'))
  fail(new TypeError('fetch failed', { cause: Object.assign(new Error('connection refused'), { code: 'ECONNREFUSED' }) }))
  const result = await service.apply({ mode: 'simplified' })
  assert.equal(result.preferredMode, 'simplified')
  assert.equal(result.resourceVersion, 'previous-version')
  assert.equal(result.sourceGameVersion, '3.29.3b')
  assert.match(result.resourceWarning, /本地.*3\.29\.3b/)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].entries[0].cn, '名称')
  assert.equal(requests[0].manifest.gameVersion, '3.29.3b')
  assert.equal(downloader.load().manifest.releaseId, 'previous-version')
})

test('游戏更新后在线旧词库也可重新应用，不要求上传同版本资源', async t => {
  const { service, requests } = await cachedCrossVersionFixture(t)
  const result = await service.apply()
  assert.equal(result.resourceVersion, 'previous-version')
  assert.equal(requests.length, 1)
  assert.match(result.resourceWarning, /3\.29\.3b/)
})

test('更新对象下载中断时仅回退完整验签的本地词库，不激活半成品', async t => {
  const { service, keys, downloader, requests, fail } = await cachedCrossVersionFixture(t)
  const next = buildRelease({ protocolVersion: 1, engineVersion: 1, gameVersion: '3.30.0b',
    entries: [{ table: 'clientstrings', id: 'new-name', field: 'Text', en: 'New Name', cn: '新名称' }] }, keys.privateKey, { releaseId: 'next-version' })
  let objectRequests = 0
  fail(url => {
    if (url.endsWith('/stable.json')) return new Response(JSON.stringify(next.envelope))
    objectRequests++
    return new Response('unavailable', { status: 503 })
  })
  const result = await service.apply()
  assert.equal(result.resourceVersion, 'previous-version')
  assert.equal(objectRequests, 1)
  assert.equal(requests.length, 1)
  assert.match(result.resourceWarning, /本地/)
  assert.equal(downloader.loadRevision('next-version'), null)
})

test('超时可复用缓存，已收到但校验失败的新对象不能回退掩盖错误', async t => {
  const { service, keys, requests, fail } = await cachedCrossVersionFixture(t)
  fail(new DOMException('timed out', 'TimeoutError'))
  assert.equal((await service.apply()).resourceVersion, 'previous-version')
  const next = buildRelease({ protocolVersion: 1, engineVersion: 1, gameVersion: '3.30.0b',
    entries: [{ table: 'clientstrings', id: 'new-name', field: 'Text', en: 'New Name', cn: '新名称' }] }, keys.privateKey, { releaseId: 'next-version' })
  fail(url => new Response(url.endsWith('/stable.json') ? JSON.stringify(next.envelope) : 'corrupt'))
  await assert.rejects(service.apply(), /对象/)
  assert.equal(requests.length, 1)
})

for (const status of [401, 403]) {
  test(`资源 HTTP ${status} 不回退历史词库、不执行游戏写入`, async t => {
    const { service, requests, fail } = await cachedCrossVersionFixture(t)
    fail(() => new Response('denied', { status }))
    await assert.rejects(service.apply(), new RegExp(`HTTP ${status}`))
    assert.equal(requests.length, 0)
  })
}

test('服务临时失败可回退，签名错误和损坏本地对象均不能绕过校验', async t => {
  const { service, root, release, requests, fail } = await cachedCrossVersionFixture(t)
  fail(() => new Response('unavailable', { status: 503 }))
  const result = await service.apply()
  assert.equal(result.resourceVersion, 'previous-version')
  assert.equal(requests.length, 1)
  const tampered = structuredClone(release.envelope)
  tampered.manifest.gameVersion = 'tampered'
  fail(() => new Response(JSON.stringify(tampered)))
  await assert.rejects(service.apply(), /签名/)
  assert.equal(requests.length, 1)
  fs.writeFileSync(path.join(root, 'objects', release.envelope.manifest.objects[0].sha256), 'corrupt')
  fail(() => new Response('unavailable', { status: 503 }))
  await assert.rejects(service.apply(), /HTTP 503/)
  assert.equal(requests.length, 1)
})

test('同一词库版本简体与繁体可以往返切换，不跳过目标模式应用', async t => {
  const { service, calls, requests } = modeFixture(t)
  for (const mode of ['simplified', 'traditional', 'simplified']) {
    const result = await service.apply({ mode })
    assert.equal(result.mode, mode)
    assert.equal(result.scan.resourceVersion, 'cached')
  }
  assert.deepEqual(requests.map(request => request.mode), ['simplified', 'traditional', 'simplified'])
  assert.equal(calls.filter(call => call === 'check').length, 2)
  assert.equal(calls.filter(call => call === 'download').length, 2)
  assert.deepEqual(requests[1].entries, [])
})
