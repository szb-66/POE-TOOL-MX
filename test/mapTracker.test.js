import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { classifyArea } from '../electron/modules/mapTracker/areaCatalog.js'
import { sanitizeMapTrackerPatch, sanitizeMapTrackerQuery } from '../electron/modules/ipc/mapTrackerValidation.js'
import { LootClickObserver } from '../electron/modules/mapTracker/lootClickObserver.js'
import { createMapRun, normalizeMapTrackerSettings } from '../electron/modules/mapTracker/model.js'

const source = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('地图目录优先使用中文名并安全分类未知地图', () => {
  assert.deepEqual(classifyArea('MapWorldsCemetery'), {
    version: 1, areaId: 'MapWorldsCemetery', areaName: '晨曦墓地', type: 'map', supported: true
  })
  assert.equal(classifyArea('MapWorldsSomeNewMap').areaName, 'Some New Map')
  assert.equal(classifyArea('MapWorldsSomeNewMap').type, 'map')
  assert.equal(classifyArea('UnrelatedArea').supported, false)
})

test('地图跟踪设置默认关闭且增强项独立归一化', () => {
  const settings = normalizeMapTrackerSettings({
    shortcuts: { refreshKills: 'F8' },
    enabled: true,
    enhancements: { kills: true },
    calibratedMechanics: ['迷雾'],
    league: '赛季 A',
    characterName: '角色',
    buildName: 'BD'
  })
  assert.equal(settings.enabled, true)
  assert.equal('kills' in settings.enhancements, false)
  assert.equal(settings.enhancements.loot, false)
  assert.equal('league' in settings, false)
  assert.equal('characterName' in settings, false)
  assert.equal('buildName' in settings, false)
  assert.equal('calibratedMechanics' in settings, false)
  assert.equal('mechanicCalibrations' in settings, false)
  assert.equal(settings.shortcuts, undefined)
})

test('地图记录固定字段且计数不为负数', () => {
  const run = createMapRun({ areaId: 'MapWorldsCemetery', instanceKey: 'MapWorldsCemetery:1', deaths: -2, league: '赛季 A' })
  assert.equal(run.deaths, 0)
  assert.equal(Object.hasOwn(run, 'experienceEfficiency'), false)
  assert.equal(Object.hasOwn(run, 'loot'), false)
  assert.equal('league' in run, false)
  assert.ok(run.id)
})

test('地图跟踪 IPC 查询限制分页、方向与文本长度', () => {
  const value = sanitizeMapTrackerQuery({ league: 'x'.repeat(200), page: -1, pageSize: 1000, direction: 'drop table', path: 'C:/secret' })
  assert.equal(value.league.length, 80)
  assert.equal(value.page, 1)
  assert.equal(value.pageSize, 100)
  assert.equal(value.direction, 'desc')
  assert.equal('path' in value, false)
})

test('地图跟踪设置 IPC 丢弃未知字段、废弃设置键和任意快捷键内容', () => {
  const value = sanitizeMapTrackerPatch({
    enabled: 1,
    buildName: 'a'.repeat(200),
    league: '赛季',
    characterName: '角色',
    enhancements: { kills: true, modifiers: true, mechanics: true, notes: true, arbitrary: true },
    shortcuts: { captureMap: 'Ctrl+Alt+Delete' },
    command: '/exit'
  })
  assert.equal(value.enabled, false)
  assert.equal('buildName' in value, false)
  assert.equal('league' in value, false)
  assert.equal('characterName' in value, false)
  assert.deepEqual(value.enhancements, {})
  assert.equal('shortcuts' in value, false)
  assert.equal('command' in value, false)
})

test('掉落点击观察器按事件 ID 只重放一次并可立即停止', async () => {
  const child = new EventEmitter()
  child.stdout = new EventEmitter()
  child.stdout.setEncoding = () => {}
  child.stdin = { values: [], write(value) { this.values.push(value) } }
  child.kill = () => { child.killed = true }
  const observer = new LootClickObserver({
    pythonPath: 'python',
    scriptPath: 'loot.py',
    spawnImpl: (_file, args, options) => {
      assert.deepEqual(args, ['loot.py'])
      assert.equal(options.shell, false)
      return child
    }
  })
  const stop = observer.start(async (event) => {
    await event.replay()
    await event.replay()
  })
  child.stdout.emit('data', '{"event":"ctrl-click","id":7}\n')
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(child.stdin.values.length, 1)
  assert.match(child.stdin.values[0], /"id":7/)
  stop()
  assert.equal(child.killed, true)
})

test('地图跟踪启用复用配置引导并在继续前重检 Client.txt', () => {
  const store = source('src/stores/mapTracker.js')
  assert.match(store, /runWithConfigurationGuide/)
  assert.match(store, /configurationGuideBypass/)
  assert.match(store, /await refreshClient\(\); if \(!clientCheck\(\)\.ok\)/)
  assert.match(store, /return setEnabled\(true, \{ configurationGuideBypass: true \}\)/)
})

test('模块移除暂停采集、隐藏浮窗并保留草稿', () => {
  const runtime = source('src/features/installFeatureRuntime.js')
  const adapter = runtime.slice(runtime.indexOf("'map-tracker':"), runtime.indexOf('bag:', runtime.indexOf("'map-tracker':")))
  assert.match(adapter, /setPaused\(true\)/)
  assert.match(adapter, /controlOverlay\('hide'\)/)
  assert.doesNotMatch(adapter, /discard|deleteRun/)
})

test('紧急停止暂停跟踪器且不再启动旧的鼠标掉落监听', () => {
  const emergency = source('electron/modules/ipc/emergencyStop.js')
  const main = source('electron/main.js')
  assert.match(emergency, /map-tracker.*地图跟踪增强采集/)
  assert.match(emergency, /mapTracker\?\.emergencyStop/)
  assert.doesNotMatch(main, /new LootCaptureController|new LootClickObserver/)
  assert.doesNotMatch(main, /MapTrackerHold|mapTrackerHold|map_tracker_hold/)
})
