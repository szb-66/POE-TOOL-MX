import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('设置与战绩独立展示，总开关仅在首页', () => {
  const settings = source('src/domains/mapTracker/MapTrackerSettingsDrawer.vue')
  const history = source('src/domains/mapTracker/MapTrackerDrawer.vue')
  for (const view of [settings, history]) {
    assert.doesNotMatch(view, /active-text="地图追踪"/)
    assert.doesNotMatch(view, /store.setEnabled/)
    assert.doesNotMatch(view, /刷新角色|刷新击杀|允许鼠标交互|结束并保存|丢弃当前局|追踪角色/)
  }
  assert.match(settings, /title="刷图设置"/); assert.doesNotMatch(settings, /el-table/)
  assert.doesNotMatch(history, /编辑名称|edit\(row\)|row\.loot|row\.character|row-style/)
  assert.match(history, /title="历史战绩"/); assert.doesNotMatch(history, /启用游戏内浮窗/)
  for (const entry of ['el-pagination', 'el-date-picker', 'exportCsv', 'remove(row)']) assert.ok(history.includes(entry))
})

test('浮窗只展示计时、地图和传送门且无交互模式', () => {
  const overlay = source('src/domains/mapTracker/MapTrackerOverlayView.vue')
  assert.match(overlay, /class="timer"/); assert.match(overlay, /class="map-name"/); assert.match(overlay, /传送门/)
  assert.doesNotMatch(overlay, /kills|deaths|mapTier|character|interactive|<button/)
  assert.match(overlay, /text-overflow:ellipsis/)
})

test('废弃接口及经验 provider 从端到端移除', () => {
  const ipc = source('electron/modules/ipc/mapTracker.js')
  assert.doesNotMatch(ipc, /map-tracker:(?:characters|select-character|capture-chat|finish|discard|command)/)
  const service = source('electron/modules/mapTracker/service.js')
  assert.doesNotMatch(service, /kills|whois|requestCommand|selectCharacter/)
  assert.doesNotMatch(service, /characterProvider|sampleExperience/)
  assert.doesNotMatch(source('src/domains/dashboard/useDashboard.js'), /refreshKills|refreshCharacter/)
})
