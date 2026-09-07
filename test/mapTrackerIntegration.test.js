import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('地图跟踪启用复用配置引导并在继续前重检 Client.txt', () => {
  const store = source('src/stores/mapTracker.js')
  assert.match(store, /runWithConfigurationGuide/); assert.match(store, /configurationGuideBypass/)
  assert.match(store, /await refreshClient\(\); if \(!clientCheck\(\)\.ok\)/)
  assert.match(store, /return setEnabled\(true, \{ configurationGuideBypass: true \}\)/)
})

test('模块移除暂停采集、隐藏浮窗并保留草稿', () => {
  const runtime = source('src/features/installFeatureRuntime.js')
  const adapter = runtime.slice(runtime.indexOf("'map-tracker':"), runtime.indexOf("bag:", runtime.indexOf("'map-tracker':")))
  assert.match(adapter, /setPaused\(true\)/); assert.match(adapter, /controlOverlay\('hide'\)/); assert.doesNotMatch(adapter, /discard|deleteRun/)
})

test('紧急停止暂停跟踪器且不再启动旧的鼠标掉落监听', () => {
  const emergency = source('electron/modules/ipc/emergencyStop.js'); const main = source('electron/main.js')
  assert.match(emergency, /map-tracker.*地图跟踪增强采集/); assert.match(emergency, /mapTracker\?\.emergencyStop/)
  assert.doesNotMatch(main, /new LootCaptureController|new LootClickObserver/)
  assert.doesNotMatch(main, /MapTrackerHold|mapTrackerHold|map_tracker_hold/)
})
