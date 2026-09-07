import test from 'node:test'
import assert from 'node:assert/strict'
import { appendFile, mkdir, mkdtemp, rename, truncate, unlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { parseClientLogLine } from '../electron/modules/clientEvents/parser.js'
import { ClientLogTailer } from '../electron/modules/clientEvents/tailer.js'
import { ClientEventsService } from '../electron/modules/clientEvents/service.js'
import { ClientEventSettingsRepository, deriveClientLogPath } from '../electron/modules/clientEvents/settingsRepository.js'
import { detectRunningClientLogPath } from '../electron/modules/clientEvents/pathDetection.js'

test('Client 日志解析只返回区域、等级白名单字段', () => {
  assert.deepEqual(parseClientLogLine('2026/09/03 10:20:30 123 [INFO Client 1] Generating level 83 area "MapWorldsCemetery" with seed 1'), {
    type: 'area-entered', logTime: '2026/09/03 10:20:30', areaId: 'MapWorldsCemetery', loading: true, seed: '1', areaLevel: 83, mapTier: 16
  })
  assert.deepEqual(parseClientLogLine('2026/09/03 10:21:30 [INFO Client] Player has leveled up to level 91'), {
    type: 'character-level', logTime: '2026/09/03 10:21:30', level: 91
  })
  assert.equal(parseClientLogLine('secret raw line'), null)
})

test('事件订阅者只收到构造后的白名单事件', () => {
  const service = new ClientEventsService()
  const received = []
  const unsubscribe = service.onEvent((event) => received.push(event))
  service.push({ type: 'player-death', logTime: null })
  unsubscribe()
  service.push({ type: 'player-death', logTime: null })
  assert.equal(received.length, 1)
  assert.deepEqual(Object.keys(received[0]).sort(), ['logTime', 'receivedAt', 'sequence', 'type'])
})

test('tailer 从 EOF 起步并处理半字符、半行、截断和轮转', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-client-tail-'))
  const file = path.join(root, 'Client.txt')
  await writeFile(file, '历史内容\n', 'utf8')
  const lines = []
  const states = []
  const tailer = new ClientLogTailer({ filePath: file, onLine: (line) => lines.push(line), onState: (state) => states.push(state.state) })
  await tailer.start()
  const bytes = Buffer.from('新增中文\n半行', 'utf8')
  await appendFile(file, bytes.subarray(0, 5)); await tailer.poll()
  await appendFile(file, bytes.subarray(5)); await tailer.poll()
  assert.deepEqual(lines, ['新增中文'])
  await appendFile(file, '完成\r\n'); await tailer.poll()
  assert.equal(lines.at(-1), '半行完成')
  await truncate(file, 0); await appendFile(file, '截断后\n'); await tailer.poll()
  assert.equal(lines.at(-1), '截断后')
  await rename(file, path.join(root, 'Client.old.txt')); await writeFile(file, '轮转后\n'); await tailer.poll()
  assert.equal(lines.at(-1), '轮转后')
  assert.ok(states.includes('resyncing'))
  tailer.stop()
})

test('tailer 处理删除重建、BOM 和不可读取目标', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-client-recreate-'))
  const file = path.join(root, 'Client.txt')
  await writeFile(file, 'old\n')
  const lines = []
  const states = []
  const tailer = new ClientLogTailer({ filePath: file, onLine: (line) => lines.push(line), onState: (state) => states.push(state.state) })
  await tailer.start()
  await unlink(file); await tailer.poll()
  await writeFile(file, '\uFEFFrecreated\r\n'); await tailer.poll()
  assert.equal(lines.at(-1), 'recreated')
  assert.ok(states.includes('waiting'))
  tailer.stop()

  const directory = path.join(root, 'Client-directory')
  await mkdir(directory)
  const broken = new ClientLogTailer({ filePath: directory, onState: (state) => states.push(state.state) })
  await broken.start()
  assert.equal(states.at(-1), 'error')
  broken.stop()
})

test('事件服务最多保留 50 条且不包含原始日志行', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-client-service-'))
  const settings = new ClientEventSettingsRepository(path.join(root, 'settings.json'))
  class FakeTailer { constructor(options){this.options=options} async start(){} stop(){} }
  const service = new ClientEventsService({ settings, detectPath: async () => path.join(root, 'Client.txt'), selectFile: async () => '', Tailer: FakeTailer })
  await service.updateSettings({ enabled: true })
  for (let index = 0; index < 55; index++) service.push({ type: 'character-level', logTime: null, level: index })
  const snapshot = await service.getStatus()
  assert.equal(snapshot.events.length, 50)
  assert.equal(snapshot.events.at(-1).level, 54)
  assert.equal(JSON.stringify(snapshot).includes('rawLine'), false)
})

test('自动检测路径持久化并在重启后恢复监听', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-client-restart-'))
  const file = path.join(root, 'Client.txt')
  const settingsPath = path.join(root, 'settings.json')
  await writeFile(file, '', 'utf8')
  const starts = []
  class FakeTailer {
    constructor(options) { this.options = options }
    async start() { starts.push(this.options.filePath); this.options.onState({ state: 'started' }) }
    stop() { this.options.onState({ state: 'stopped' }) }
  }

  const firstRepository = new ClientEventSettingsRepository(settingsPath)
  const first = new ClientEventsService({ settings: firstRepository, detectPath: async () => file, Tailer: FakeTailer })
  await first.updateSettings({ enabled: true })
  assert.equal((await firstRepository.get()).logPath, file)
  await first.stop(false)

  const secondRepository = new ClientEventSettingsRepository(settingsPath)
  const second = new ClientEventsService({ settings: secondRepository, detectPath: async () => '', Tailer: FakeTailer })
  const restored = await second.initialize()
  assert.equal(restored.enabled, true)
  assert.equal(restored.logPath, file)
  assert.equal(restored.state, 'started')
  assert.deepEqual(restored.events, [])

  await second.updateSettings({ enabled: false })
  assert.equal((await second.getStatus()).state, 'stopped')
  const resumed = await second.updateSettings({ enabled: true })
  assert.equal(resumed.logPath, file)
  assert.equal(resumed.state, 'started')
  assert.deepEqual(starts, [file, file, file])
  await second.stop(false)
})

test('设置默认关闭且只接受 Client.txt 路径', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-client-settings-'))
  const repository = new ClientEventSettingsRepository(path.join(root, 'settings.json'))
  assert.equal((await repository.get()).enabled, false)
  assert.equal((await repository.save({ enabled: true, logPath: path.join(root, 'other.log') })).logPath, '')
  assert.equal(deriveClientLogPath('C:\\Games\\Path of Exile\\PathOfExile.exe'), 'C:\\Games\\Path of Exile\\logs\\Client.txt')
})

test('自动检测根据游戏进程路径推导 Client.txt', async () => {
  const execFileImpl = (_file, args, options, callback) => {
    assert.equal(options.windowsHide, true)
    assert.match(args.at(-1), /OutputEncoding.*UTF8Encoding/)
    callback(null, 'E:\\WeGameApps\\流放之路\\PathOfExile_x64.exe')
  }
  assert.equal(
    await detectRunningClientLogPath({ platform: 'win32', execFileImpl }),
    'E:\\WeGameApps\\流放之路\\logs\\Client.txt'
  )
})

test('自动检测失败或非 Windows 时返回空路径', async () => {
  const execFileImpl = (_file, _args, _options, callback) => callback(new Error('denied'), '')
  assert.equal(await detectRunningClientLogPath({ platform: 'win32', execFileImpl }), '')
  assert.equal(await detectRunningClientLogPath({ platform: 'linux', execFileImpl }), '')
})
