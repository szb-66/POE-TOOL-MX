import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { createHash } from 'node:crypto'
import { PassThrough, Writable } from 'node:stream'
import { MarketHostClient, MarketLocalizationService } from '../electron/modules/marketLocalization/service.js'
import { registerMarketLocalizationHandlers } from '../electron/modules/marketLocalization/ipc.js'
import { serverChannelFailure } from '../electron/modules/app/serverIpcPolicy.js'
import { marketStructureProof } from './fixtures/marketRuntime.js'

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
