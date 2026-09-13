import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { randomUUID } from 'node:crypto'
import { PobLauncherService, PROGRAMS } from '../electron/modules/pobLauncher/service.js'
import { commitFiles, recover, MANAGEMENT, writeJson, stat } from '../electron/modules/pobLauncher/files.js'
import { extractArchive, resolveRelease, download } from '../electron/modules/pobLauncher/download.js'

async function write(root, file, value = 'MZ-test') {
  const target = path.join(root, file)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, value)
  return target
}
async function fixture(t, options = {}) {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'pob-launcher-test-'))
  t.after(async () => { if (path.dirname(temp) === os.tmpdir() && path.basename(temp).startsWith('pob-launcher-test-')) await fs.rm(temp, { recursive: true, force: true }) })
  const root = path.join(temp, '中文 tool')
  await fs.mkdir(root)
  const calls = []
  const defaults = { userData: path.join(temp, 'config'), running: async () => false,
    resolve: async component => ({ component, version: `${component}-v1` }),
    fetchArchive: async release => { calls.push(release.component) },
    extract: async (archive, destination) => {
      const charm = path.basename(archive) === 'charm.zip'
      const sub = charm ? 'PoeCharm-hash/' : ''
      await write(destination, sub + (charm ? 'PoeCharm3.exe' : 'Path of Building.exe'))
      await write(destination, sub + 'Data/data.lua', 'new-data')
      await write(destination, sub + 'Builds/user.xml', 'shipped-example')
      await write(destination, sub + 'Settings.xml', 'default-settings')
    }, launch: async () => {} }
  const service = new PobLauncherService({ ...defaults, ...options })
  t.after(() => service.logPending)
  return { temp, root, service, calls, defaults }
}
test('默认空白、无效路径、取消选择、保存及清空均不删除文件', async t => {
  const { service, root, defaults } = await fixture(t)
  assert.equal((await service.getState()).state.directory, '')
  assert.equal((await service.setDirectory('relative')).success, false)
  assert.equal((await service.setDirectory(path.join(root, 'missing'))).success, false)
  assert.equal((await service.setDirectory(path.parse(root).root)).success, false)
  assert.equal((await service.pickDirectory(async () => null)).state.directory, '')
  for (const program of Object.values(PROGRAMS)) await write(root, program)
  assert.equal((await service.setDirectory(root)).state.charm.version, '')
  const next = new PobLauncherService(defaults)
  const state = (await next.getState()).state
  assert.equal(state.directory, root)
  assert.equal(state.pob.installed, true)
  await next.setDirectory('')
  assert.ok(await stat(path.join(root, PROGRAMS.charm)))
})

test('阶段进度使用真实字节，空文件可完成，校验及解压均可停止', async t => {
  const { temp } = await fixture(t)
  const archive = await write(temp, 'stages.zip', zipBuffer([{ name: 'large.bin', data: 'a'.repeat(200000) }, { name: 'empty', data: '' }]))
  const events = []
  await extractArchive(archive, path.join(temp, 'complete'), { onProgress: value => events.push(value) })
  for (const phase of ['verifying', 'extracting']) {
    const progress = events.filter(value => value.phase === phase)
    assert.equal(progress.at(-1).percent, 100)
    assert.equal(progress.at(-1).received, 200000)
    assert.ok(progress.slice(0, -1).every(value => value.percent !== 100))
    assert.ok(progress.some(value => value.received > 0 && value.percent < 100))
  }
  assert.equal((await fs.stat(path.join(temp, 'complete/empty'))).size, 0)
  for (const phase of ['verifying', 'extracting']) {
    const controller = new AbortController()
    const target = path.join(temp, phase)
    await assert.rejects(extractArchive(archive, target, { signal: controller.signal, onProgress: value => {
      if (value.phase === phase && value.received > 0) controller.abort()
    } }), { name: 'AbortError' })
    if (phase === 'verifying') assert.equal(await stat(target), null)
  }
})

test('停止版本查询和下载保留原安装，旧操作不能停止新任务', async t => {
  for (const method of ['resolve', 'fetchArchive']) {
    let entered
    const reached = new Promise(resolve => { entered = resolve })
    const blocker = (...args) => new Promise((resolve, reject) => {
      const { signal } = args.at(-1)
      entered()
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    })
    const { service, root } = await fixture(t, { [method]: blocker })
    for (const program of Object.values(PROGRAMS)) await write(root, program, 'old')
    await service.setDirectory(root)
    const operation = service.install('update')
    await reached
    const id = service.state.operationId
    assert.equal(service.stop('old-id').success, false)
    assert.equal(service.stop(id).success, true)
    assert.equal(service.state.busy, true)
    assert.equal(service.stop(id).success, true)
    assert.equal((await service.setDirectory('')).success, false)
    const result = await operation
    assert.equal(result.cancelled, true, result.error)
    assert.equal(result.state.busy, false)
    for (const program of Object.values(PROGRAMS)) assert.equal(await fs.readFile(path.join(root, program), 'utf8'), 'old')
    assert.equal(service.stop(id).success, false)
  }
})

test('替换期间停止回滚，提交完成后停止不撤销结果', async t => {
  const { service, root } = await fixture(t)
  for (const program of Object.values(PROGRAMS)) await write(root, program, 'old')
  await write(root, 'Builds/personal.xml', 'my-build')
  await service.setDirectory(root)
  service.beforeWrite = async (_entry, index) => { if (index === 1) service.stop(service.state.operationId) }
  const result = await service.install('update')
  assert.equal(result.cancelled, true, result.error)
  for (const program of Object.values(PROGRAMS)) assert.equal(await fs.readFile(path.join(root, program), 'utf8'), 'old')
  assert.equal(await fs.readFile(path.join(root, 'Builds/personal.xml'), 'utf8'), 'my-build')
  service.beforeWrite = undefined
  service.on('state', state => {
    if (state.busy && !state.cancellable && state.phase === 'installing') assert.equal(service.stop(state.operationId).success, false)
  })
  assert.equal((await service.install('update')).success, true)
})

test('状态观察者抛错不能中断操作，日志脱敏且忙碌状态释放', async t => {
  const { service, root } = await fixture(t)
  service.on('state', () => { throw new Error('Object has been destroyed') })
  assert.equal((await service.setDirectory(root)).success, true)
  assert.equal((await service.install()).success, true)
  await service.logPending
  const log = await fs.readFile(service.logFile, 'utf8')
  assert.match(log, /notification/)
  assert.ok(!log.includes(root))
  assert.equal(service.state.busy, false)
})

test('提交后清理失败仍成功，重新检测保留失败阶段供通信恢复', async t => {
  const { service, root } = await fixture(t)
  await service.setDirectory(root)
  const original = fs.rm
  const mocked = t.mock.method(fs, 'rm', async (file, options) => {
    if (path.dirname(file) === path.join(root, MANAGEMENT) && path.basename(file).startsWith('stage-')) {
      throw Object.assign(new Error('locked'), { code: 'EPERM' })
    }
    return original(file, options)
  })
  const result = await service.install()
  mocked.mock.restore()
  assert.equal(result.success, true, result.error)
  assert.match(result.state.warning, /暂存文件清理失败/)
  assert.equal(result.state.charm.installed, true)
  service.resolve = async () => { throw new Error('query failure') }
  const failed = await service.install('update')
  const detected = await service.getState()
  assert.equal(detected.error, failed.error)
  assert.equal(detected.state.operationId, failed.state.operationId)
  assert.equal(detected.state.busy, false)
})

test('备份后停止尚未替换目标，空归档阶段进度正常结束', async t => {
  const { temp, root } = await fixture(t)
  const source = await write(temp, 'new', 'new')
  await write(root, 'program', 'old')
  const controller = new AbortController()
  await assert.rejects(commitFiles(root, [{ relative: 'program', source }], {
    signal: controller.signal, beforeCommit: async () => controller.abort()
  }), { name: 'AbortError' })
  assert.equal(await fs.readFile(path.join(root, 'program'), 'utf8'), 'old')
  assert.equal(await stat(path.join(root, MANAGEMENT, 'journal.json')), null)
  const archive = await write(temp, 'empty.zip', zipBuffer([]))
  const events = []
  await extractArchive(archive, path.join(temp, 'empty-extracted'), { onProgress: p => events.push(p) })
  assert.deepEqual(events.filter(p => p.percent === 100).map(p => p.phase), ['verifying', 'extracting'])
})

test('下载未知总量、校验失败与停止均不会提前报告100%', async t => {
  const { temp } = await fixture(t)
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  globalThis.fetch = async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([1, 2, 3])); controller.close() } }))
  const progress = []
  await download({ url: 'https://example.invalid/test' }, path.join(temp, 'download'), value => progress.push(value))
  assert.equal(progress[0].percent, null)
  assert.equal(progress.at(-1).percent, 100)
  const invalid = []
  await assert.rejects(download({ url: 'https://example.invalid/test', digest: 'sha256:bad' }, path.join(temp, 'invalid'), value => invalid.push(value)))
  assert.ok(invalid.every(value => value.percent !== 100))
  const controller = new AbortController()
  await assert.rejects(download({ url: 'https://example.invalid/test' }, path.join(temp, 'stopped'), () => controller.abort(), { signal: controller.signal }), { name: 'AbortError' })
})
test('首次安装选择路径，安装两个组件，已安装不重复下载', async t => {
  const { service, root, calls } = await fixture(t)
  let selected = 0
  const result = await service.install('install', async () => { selected++; return root })
  assert.equal(result.success, true, result.error)
  assert.equal(selected, 1)
  assert.deepEqual(calls, ['charm', 'pob'])
  assert.equal(result.state.pob.version, 'pob-v1')
  assert.equal(await fs.readFile(path.join(root, 'Settings.xml'), 'utf8'), 'default-settings')
  assert.equal((await service.install()).success, true)
  assert.equal((await service.install('update')).state.message, '两个组件均已是最新版本')
  assert.equal(calls.length, 2)
})
test('部分安装仅补齐缺失组件，外部组件版本保持未知', async t => {
  const { service, root, calls } = await fixture(t)
  await write(root, PROGRAMS.charm, 'existing')
  await service.setDirectory(root)
  assert.equal((await service.install('update')).success, false)
  const result = await service.install()
  assert.equal(result.success, true, result.error)
  assert.deepEqual(calls, ['pob'])
  assert.equal(result.state.charm.version, '')
  assert.equal(await fs.readFile(path.join(root, PROGRAMS.charm), 'utf8'), 'existing')
})
test('外部安装更新备份原文件，保留 BD、设置和自定义文件', async t => {
  const { service, root } = await fixture(t)
  for (const program of Object.values(PROGRAMS)) await write(root, program, 'old-program')
  const preserved = ['Settings.conf', 'Settings.xml', 'custom.txt', 'PathOfBuildingCommunity-Portable/Builds/user.xml', 'PathOfBuildingCommunity-Portable/Settings.xml', 'PathOfBuildingCommunity-Portable/imgui.ini']
  for (const file of preserved) await write(root, file, 'personal')
  await service.setDirectory(root)
  const result = await service.install('update')
  assert.equal(result.success, true, result.error)
  for (const file of preserved) assert.equal(await fs.readFile(path.join(root, file), 'utf8'), 'personal')
  const backups = await fs.readdir(path.join(root, MANAGEMENT, 'backups'))
  assert.equal(backups.length, 1)
  assert.equal(await fs.readFile(path.join(root, MANAGEMENT, 'backups', backups[0], PROGRAMS.charm), 'utf8'), 'old-program')
})
test('替换失败回滚所有程序和版本，新文件撤销，失败后可重试', async t => {
  const { service, root } = await fixture(t, { beforeWrite: async (_entry, index) => { if (index === 2) throw new Error('注入替换失败') } })
  for (const program of Object.values(PROGRAMS)) await write(root, program, 'old-program')
  await service.setDirectory(root)
  const result = await service.install('update')
  assert.equal(result.success, false)
  for (const program of Object.values(PROGRAMS)) assert.equal(await fs.readFile(path.join(root, program), 'utf8'), 'old-program')
  assert.equal(await stat(path.join(root, 'Data/data.lua')), null)
  assert.equal(await stat(path.join(root, MANAGEMENT, 'versions.json')), null)
  service.beforeWrite = undefined
  assert.equal((await service.install('update')).success, true)
})
test('中断恢复可重复执行，已提交事务不回滚', async t => {
  const { service, root } = await fixture(t)
  const id = randomUUID()
  await write(root, PROGRAMS.charm, 'half-new')
  await write(root, `${MANAGEMENT}/backups/${id}/${PROGRAMS.charm}`, 'old')
  await write(root, 'new.dll', 'partial')
  const journal = { id, committed: false, entries: [{ relative: PROGRAMS.charm, existed: true }, { relative: 'new.dll', existed: false }] }
  await writeJson(path.join(root, MANAGEMENT, 'journal.json'), journal)
  assert.equal((await service.setDirectory(root)).success, true)
  assert.equal(await fs.readFile(path.join(root, PROGRAMS.charm), 'utf8'), 'old')
  assert.equal(await stat(path.join(root, 'new.dll')), null)
  assert.equal(await recover(root), false)
  await writeJson(path.join(root, MANAGEMENT, 'journal.json'), { ...journal, committed: true })
  await write(root, PROGRAMS.charm, 'committed')
  await recover(root)
  assert.equal(await fs.readFile(path.join(root, PROGRAMS.charm), 'utf8'), 'committed')
})
test('网络、结构及程序校验失败不会写入安装文件', async t => {
  for (const options of [
    { fetchArchive: async () => { throw new Error('fetch failed') } },
    { extract: async (_archive, destination) => { await write(destination, 'wrong.txt') } },
    { extract: async (_archive, destination) => { await write(destination, 'PoeCharm3.exe', 'not-exe') } }
  ]) {
    const { service, root } = await fixture(t, options)
    await service.setDirectory(root)
    assert.equal((await service.install()).success, false)
    assert.equal(await stat(path.join(root, PROGRAMS.charm)), null)
  }
})
test('运行中阻止更新，重复启动不产生进程，启动错误如实报告', async t => {
  let launches = 0
  const { service, root } = await fixture(t, { running: async () => true, launch: async () => { launches++ } })
  for (const program of Object.values(PROGRAMS)) await write(root, program)
  await service.setDirectory(root)
  assert.equal((await service.install('update')).success, false)
  await service.start()
  assert.equal(launches, 0)
  service.running = async () => false
  service.launch = async selected => { assert.equal(selected, root); throw new Error('启动被拒绝') }
  assert.equal((await service.start()).error, '启动被拒绝')
})
test('操作互斥锁在第一个异步点前生效，目录和选择器都被锁定', async t => {
  let release
  const { service, root } = await fixture(t, { resolve: () => new Promise(resolve => { release = resolve }) })
  await service.setDirectory(root)
  const installing = service.install()
  while (!release) await new Promise(resolve => setImmediate(resolve))
  assert.equal((await service.setDirectory('')).success, false)
  assert.equal((await service.start()).success, false)
  assert.equal((await service.install()).success, false)
  assert.equal((await service.pickDirectory(() => { throw new Error('must not open') })).success, false)
  service.resolve = async component => ({ component, version: 'v1' })
  release({ component: 'charm', version: 'v1' })
  assert.equal((await installing).success, true)
})

function zipBuffer(entries) {
  const locals = [], central = []
  let offset = 0
  for (const { name, data = 'MZ-test', mode = 0x8000 } of entries) {
    const filename = Buffer.from(name), content = Buffer.from(data)
    let crc = 0xffffffff
    for (const byte of content) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0) }
    crc = (crc ^ 0xffffffff) >>> 0
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(content.length, 18); local.writeUInt32LE(content.length, 22); local.writeUInt16LE(filename.length, 26)
    locals.push(local, filename, content)
    const header = Buffer.alloc(46)
    header.writeUInt32LE(0x02014b50); header.writeUInt16LE(0x0314, 4); header.writeUInt16LE(20, 6)
    header.writeUInt32LE(crc, 16); header.writeUInt32LE(content.length, 20); header.writeUInt32LE(content.length, 24)
    header.writeUInt16LE(filename.length, 28); header.writeUInt32LE((mode << 16) >>> 0, 38); header.writeUInt32LE(offset, 42)
    central.push(header, filename)
    offset += local.length + filename.length + content.length
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, directory, end])
}
test('真实 ZIP 安全解压，拒绝损坏、穿越、链接、Windows 别名和重复路径', async t => {
  const { temp } = await fixture(t)
  const archive = path.join(temp, 'good.zip')
  await fs.writeFile(archive, zipBuffer([{ name: 'wrapper/PoeCharm3.exe' }]))
  await extractArchive(archive, path.join(temp, 'good'))
  assert.equal(await fs.readFile(path.join(temp, 'good/wrapper/PoeCharm3.exe'), 'utf8'), 'MZ-test')
  const corrupt = zipBuffer([{ name: 'PoeCharm3.exe' }])
  corrupt[30 + Buffer.byteLength('PoeCharm3.exe') + 3] ^= 1
  const invalid = [Buffer.from('broken'), corrupt, ...[
    [{ name: '../outside.exe' }], [{ name: 'C:/evil.exe' }], [{ name: 'a/../../evil.exe' }],
    [{ name: 'link', mode: 0xa000 }], [{ name: 'CON.txt' }], [{ name: 'alias./evil' }],
    [{ name: 'a:stream' }], [{ name: 'a' }, { name: 'A' }]
  ].map(zipBuffer)]
  for (const [index, buffer] of invalid.entries()) {
    const file = path.join(temp, `bad-${index}.zip`), target = path.join(temp, `bad-${index}`)
    await fs.writeFile(file, buffer)
    await assert.rejects(extractArchive(file, target))
    assert.equal(await stat(target), null)
  }
})
test('目录联接不能用于更新写入或恢复', async t => {
  const { root, temp } = await fixture(t)
  const outside = path.join(temp, 'outside')
  await fs.mkdir(outside)
  await fs.symlink(outside, path.join(root, 'Data'), process.platform === 'win32' ? 'junction' : 'dir')
  const source = await write(temp, 'source', 'new')
  await assert.rejects(commitFiles(root, [{ relative: 'Data/test', source }]), /链接|联接/)
  assert.equal(await stat(path.join(outside, 'test')), null)
})
test('匿名 API 配额耗尽时仍通过官方订阅和发布页面查询，保留固定版本和校验值', async t => {
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  const requests = []
  globalThis.fetch = async url => {
    requests.push(url)
    if (url.includes('api.github.com')) return { ok: false, status: 403 }
    if (url.endsWith('.atom')) return { ok: true, url, text: async () => `<feed><id>tag:github.com,2008:/Chuanhsing/PoeCharm/commits/main</id><entry><id>tag:github.com,2008:Grit::Commit/${'a'.repeat(40)}</id></entry><entry><id>tag:github.com,2008:Grit::Commit/${'b'.repeat(40)}</id></entry></feed>` }
    if (url.endsWith('/latest')) return { ok: true, url: url.replace('/latest', '/tag/v2.67.2'), text: async () => '<h1>Release</h1>' }
    return { ok: true, url, text: async () => `<ul><li><a href="/PathOfBuildingCommunity/PathOfBuilding/releases/download/v2.67.2/PathOfBuildingCommunity-Portable.zip">Portable</a><clipboard-copy value="sha256:${'c'.repeat(64)}"></clipboard-copy></li><li><a href="/archive.zip">Source</a></li></ul>` }
  }
  assert.equal((await resolveRelease('charm')).url, `https://codeload.github.com/Chuanhsing/PoeCharm/zip/${'a'.repeat(40)}`)
  assert.deepEqual(await resolveRelease('pob'), { version: 'v2.67.2', url: 'https://github.com/PathOfBuildingCommunity/PathOfBuilding/releases/download/v2.67.2/PathOfBuildingCommunity-Portable.zip', digest: `sha256:${'c'.repeat(64)}` })
  assert.equal(requests.some(url => url.includes('api.github.com')), false)
  globalThis.fetch = async () => ({ ok: false, status: 403 })
  await assert.rejects(resolveRelease('pob'), /官方页面暂时限制访问/)
})
test('官方页面损坏、跨站跳转、预发布标签和非目标版本资产不能误报最新版本', async t => {
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  for (const [component, url, body] of [
    ['charm', 'https://github.com/Chuanhsing/PoeCharm/commits/main.atom', '<html>Login</html>'],
    ['pob', 'https://example.com/releases/tag/v1.0', ''],
    ['pob', 'https://github.com/PathOfBuildingCommunity/PathOfBuilding/releases/tag/v1.0-rc1', ''],
    ['pob', 'https://github.com/login', '']
  ]) {
    globalThis.fetch = async () => ({ ok: true, url, text: async () => body })
    await assert.rejects(resolveRelease(component))
  }
  for (const href of ['https://example.com/Portable.zip', '/PathOfBuildingCommunity/PathOfBuilding/releases/download/v1.1/PathOfBuildingCommunity-Portable.zip', '/PathOfBuildingCommunity/PathOfBuilding/releases/download/v1.0/setup.exe']) {
    globalThis.fetch = async url => ({ ok: true, url: url.replace('/latest', '/tag/v1.0'), text: async () => `<li><a href="${href}">Portable</a></li>` })
    await assert.rejects(resolveRelease('pob'), /未找到官方/)
  }
})
