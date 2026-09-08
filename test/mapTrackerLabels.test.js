import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mapLabel } from '../shared/mapTrackerLabels.js'
import { parseClientLogLine } from '../electron/modules/clientEvents/parser.js'

test('最近事件与刷图界面共用区域名称转换', () => {
  assert.equal(mapLabel('MapWorldsCemetery'), '晨曦墓地')
  assert.equal(mapLabel('Cemetery'), '晨曦墓地')
  assert.equal(mapLabel('MapWorldsMuseum'), '古博物馆')
  assert.equal(mapLabel('墓地'), '墓地')
  assert.equal(mapLabel(''), '')
  const settings = readFileSync(new URL('../src/domains/settings/SettingsView.vue', import.meta.url), 'utf8')
  assert.ok(settings.includes('进入 ${mapLabel(event.areaId)}'))
})

test('剧情城镇卡鲁海滩显示中文且不推算地图阶级', () => {
  assert.equal(mapLabel('2_11_endgame_town'), '卡鲁海滩')
  assert.equal(mapLabel('2 11 endgame town'), '卡鲁海滩')
  const event = parseClientLogLine('2026/09/07 10:00:00 [INFO Client 1] Generating level 69 area "2_11_endgame_town" with seed 123')
  assert.equal(event.areaLevel, 69)
  assert.equal(event.mapTier, null)
})

test('扩展地图名称目录并保留异界地图阶级', () => {
  assert.equal(mapLabel('MapWorldsBeach'), '危岩海滩')
  assert.equal(mapLabel('MapWorldsCrimsonTemple'), '玫红神殿')
  assert.equal(parseClientLogLine('2026/09/07 10:00:00 [INFO Client 1] Generating level 69 area "MapWorldsBeach"').mapTier, 2)
})

test('功能区域和藏身处保留具体名称且不作为异界地图', () => {
  for (const name of ['KalguuranSettlersLeague', 'Kalguuran Settlers League']) {
    assert.equal(mapLabel(name), '君锋镇')
  }
  assert.equal(mapLabel('1_5_town'), '狱卒之塔')
  assert.equal(mapLabel('监守高塔'), '狱卒之塔')
  assert.equal(mapLabel('HeistHub'), '黄金港')
  assert.equal(mapLabel('HideoutLush'), '苍翠藏身处')
  assert.equal(mapLabel('Coastal Hideout'), '海岸藏身处')
  for (const id of ['KalguuranSettlersLeague', 'HeistHub', 'HideoutLush']) {
    assert.equal(parseClientLogLine(`2026/09/07 10:00:00 [INFO Client 1] Generating level 68 area "${id}"`).mapTier, null)
  }
})
