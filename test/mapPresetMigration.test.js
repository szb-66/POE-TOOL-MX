import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cleanMigratedChartConfig,
  cleanMigratedMapConfig,
  createDefaultMapConfig,
  getActiveMapRollingConfig
} from '../src/utils/mapPresetMigration.js'

test('地图公共基底迁移时取已启用配置中的更严格阈值', () => {
  const map = cleanMigratedMapConfig({
    strategy: 'normal',
    tiers: { t17: true },
    match: {
      mandatoryStats: {
        quantityNormal: { enabled: true, value: 80 },
        quantityT17: { enabled: true, value: 120 },
        rarityNormal: { enabled: false, value: 70 },
        rarityT17: { enabled: true, value: 40 }
      }
    }
  })

  assert.deepEqual(map.match.mandatoryStats.quantity, { enabled: true, value: 120 })
  assert.deepEqual(map.match.mandatoryStats.rarity, { enabled: true, value: 40 })
  assert.equal('tiers' in map, false)
  assert.equal('strategy' in map, false)
})

test('地图专用基底和单侧配置被保留', () => {
  const map = cleanMigratedMapConfig({
    match: {
      optionalStats: {
        packSizeNormal: { enabled: true, value: 25 },
        moreMaps: { enabled: true, value: 35 },
        moreScarabs: { enabled: false, value: 70 }
      }
    }
  })

  assert.deepEqual(map.match.optionalStats.packSize, { enabled: true, value: 25 })
  assert.deepEqual(map.match.optionalStats.moreMaps, { enabled: true, value: 35 })
  assert.deepEqual(map.match.optionalStats.moreScarabs, { enabled: false, value: 70 })
})

test('地图配置迁移可重复执行且默认包含六项基底', () => {
  const initial = createDefaultMapConfig()
  const once = cleanMigratedMapConfig(initial)
  const twice = cleanMigratedMapConfig(once)

  assert.deepEqual(twice, once)
  assert.deepEqual(Object.keys(once.match.mandatoryStats), [
    'quantity', 'rarity', 'packSize', 'moreMaps', 'moreScarabs', 'moreCurrency'
  ])
})

test('地图与航海海图配置独立迁移且运行时按目标选择', () => {
  const once = cleanMigratedMapConfig({ method: 'chaos', match: { blacklist: ['反射'] } })
  const twice = cleanMigratedMapConfig(once)
  assert.deepEqual(twice, once)
  assert.equal(once.method, 'chaos')
  assert.deepEqual(once.match.blacklist, ['反射'])
  assert.equal('chart' in once, false)
  assert.equal('activeKind' in once, false)

  const chart = cleanMigratedChartConfig({ method: 'alchemy' }, once.grid)
  assert.deepEqual(Object.keys(chart.match.mandatoryStats), [
    'quantity', 'rarity', 'packSize', 'deadmanSulphur'
  ])
  chart.method = 'chaos'
  const active = getActiveMapRollingConfig(once, chart, 'chart')
  assert.equal(active.targetKind, 'chart')
  assert.equal(active.method, 'chaos')
  assert.equal(active.grid.rows, 5)
})
