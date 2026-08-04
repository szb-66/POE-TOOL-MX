import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { pythonPath } from './helpers/python.js'

const template = readFileSync(new URL('../src/assets/scripts/map_rolling_template.py', import.meta.url), 'utf8')

function functionBlock(start, end) {
  return template.slice(template.indexOf(start), template.indexOf(end))
}

const runtimeSource = [
  functionBlock('def check_map_base(item_data):', 'def check_map_mods(item_data):'),
  functionBlock('def get_stat_value(item_data, key):', 'if __name__ == "__main__":')
].join('\n')

function evaluate(config, item) {
  const script = `${runtimeSource}\nmap_config = ${JSON.stringify(config)}\nitem = ${JSON.stringify(item)}\nprint(check_map_base(item))\n`
    .replaceAll('true', 'True')
    .replaceAll('false', 'False')
    .replaceAll('null', 'None')
  const result = spawnSync(pythonPath, ['-c', script], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim().split(/\r?\n/).at(-1) === 'True'
}

const stat = (enabled, value) => ({ enabled, value })

test('地图运行时使用同一流程匹配完整六项基底', () => {
  const mandatoryStats = Object.fromEntries([
    ['quantity', 100], ['rarity', 50], ['packSize', 30],
    ['moreMaps', 20], ['moreScarabs', 40], ['moreCurrency', 10]
  ].map(([key, value]) => [key, stat(true, value)]))

  assert.equal(evaluate({ match: { mandatoryStats, optionalStats: {} } }, {
    itemQuantity: 110,
    itemRarity: 60,
    monsterPackSize: 35,
    moreMaps: 25,
    moreScarabs: 45,
    moreCurrency: 15
  }), true)
})

test('地图运行时将三字段地图缺失的更多属性按零处理', () => {
  assert.equal(evaluate({ match: {
    mandatoryStats: { moreMaps: stat(true, 1) },
    optionalStats: {}
  } }, { itemQuantity: 80, itemRarity: 40, monsterPackSize: 20 }), false)
})

test('同一地图基底在必选和挑选中冲突时使用更严格阈值且不重复计数', () => {
  const config = { match: {
    selectedCount: 1,
    mandatoryStats: { quantity: stat(true, 80) },
    optionalStats: { quantity: stat(true, 100) }
  } }

  assert.equal(evaluate(config, { itemQuantity: 90 }), false)
  assert.equal(evaluate(config, { itemQuantity: 100 }), true)
})

test('地图运行模板不再引用旧地图类型字段', () => {
  const checkBlock = functionBlock('def check_map_base(item_data):', 'def check_map_mods(item_data):')
  assert.equal(checkBlock.includes("map_config['tiers']"), false)
  assert.equal(checkBlock.includes('Normal'), false)
  assert.equal(checkBlock.includes('T17'), false)
})
