import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseItemInfo } from '../electron/modules/item/parser.js'
import { matchMapRequirements } from '../electron/modules/item/matcher.js'
import { CHART_FORMAT_GUIDANCE } from '../src/utils/supportedItemFormats.js'

const samples = Object.fromEntries(CHART_FORMAT_GUIDANCE.examples.map(example => [example.id, example.text]))
const stat = (enabled, value) => ({ enabled, value })

test('JavaScript 航海海图匹配器隔离类别并匹配四项数值', () => {
  const chart = parseItemInfo(samples['chart-corrupted'])
  const config = {
    targetKind: 'chart',
    match: {
      blacklist: [], whitelist: [], selectedCount: 2,
      mandatoryStats: { deadmanSulphur: stat(true, 30) },
      optionalStats: { quantity: stat(true, 100), packSize: stat(true, 15) }
    }
  }
  assert.equal(matchMapRequirements(chart, config).isMatch, true)
  assert.equal(matchMapRequirements({ ...chart, category: '地图' }, config).reason, 'category')
  assert.equal(matchMapRequirements(chart, { ...config, targetKind: 'atlas' }).reason, 'category')
})

test('航海海图黑名单优先于白名单且基底始终需要满足', () => {
  const chart = parseItemInfo(samples['chart-identified'])
  const base = {
    targetKind: 'chart',
    match: {
      blacklist: ['中毒'], whitelist: ['闪电伤害'],
      mandatoryStats: { deadmanSulphur: stat(true, 30) }, optionalStats: {}
    }
  }
  assert.equal(matchMapRequirements(chart, base).reason, 'blacklist')
  assert.equal(matchMapRequirements(chart, {
    ...base,
    match: { ...base.match, blacklist: [], mandatoryStats: { deadmanSulphur: stat(true, 31) } }
  }).reason, 'mandatory')
})

test('地图页面提供独立内部 Tab 且不新增侧栏入口', () => {
  const view = readFileSync(new URL('../src/domains/map/MapView.vue', import.meta.url), 'utf8')
  const sidebar = readFileSync(new URL('../src/components/Layout/Sidebar.vue', import.meta.url), 'utf8')
  const dashboard = readFileSync(new URL('../src/domains/dashboard/useDashboard.js', import.meta.url), 'utf8')
  const presetStore = readFileSync(new URL('../src/stores/preset.js', import.meta.url), 'utf8')
  const scriptService = readFileSync(new URL('../src/utils/scriptService.js', import.meta.url), 'utf8')
  assert.match(view, /label="异界地图" name="atlas"/)
  assert.match(view, /label="航海海图" name="chart"/)
  assert.match(view, /MapRollingProfilePanel/)
  assert.match(view, /:type="activeKind === 'chart' \? 'chart' : 'map'"/)
  assert.equal((sidebar.match(/<span>海图<\/span>/g) || []).length, 1)
  assert.match(dashboard, /航海海图/)
  assert.match(dashboard, /activeMapConfig/)
  assert.match(dashboard, /presetStore\.chartPresets/)
  assert.match(presetStore, /const chartPresets = ref/)
  assert.match(presetStore, /const currentChartPresetId = ref/)
  assert.match(presetStore, /const mapRollingKind = ref/)
  assert.match(scriptService, /presetStore\.mapRollingKind/)
  assert.match(scriptService, /presetStore\.currentChartPreset/)
})
