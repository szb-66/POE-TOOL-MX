import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validateMapRecovery } from '../src/utils/craftingRecovery.js'

const source = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

const validCheckpoint = {
  targetKind: 'atlas',
  col: 2,
  row: 3,
  processedCount: 9,
  qualifiedCount: 6,
  blacklistStats: { 反射: 2 },
  whitelistStats: { 额外怪物: 1 }
}

test('地图和海图恢复检查点保留失败格及已提交统计', () => {
  assert.deepEqual(validateMapRecovery(null, { targetKind: 'atlas', rows: 5, cols: 12 }), {
    valid: true,
    value: null
  })
  assert.deepEqual(validateMapRecovery(validCheckpoint, { targetKind: 'atlas', rows: 5, cols: 12 }), {
    valid: true,
    value: validCheckpoint
  })
  assert.deepEqual(validateMapRecovery({
    ...validCheckpoint,
    targetKind: 'chart',
    blacklistStats: {},
    whitelistStats: {}
  }, { targetKind: 'chart', rows: 5, cols: 12 }).value.targetKind, 'chart')
})

test('恢复检查点目标不匹配、越界或统计无效时拒绝启动', () => {
  const invalidValues = [
    { ...validCheckpoint, targetKind: 'chart' },
    { ...validCheckpoint, col: 12 },
    { ...validCheckpoint, row: 5 },
    { ...validCheckpoint, processedCount: -1 },
    { ...validCheckpoint, qualifiedCount: 10 },
    { ...validCheckpoint, blacklistStats: { 反射: -1 } }
  ]
  for (const recovery of invalidValues) {
    const result = validateMapRecovery(recovery, { targetKind: 'atlas', rows: 5, cols: 12 })
    assert.equal(result.valid, false)
    assert.match(result.error, /恢复检查点无效/)
  }
})

test('地图启动在 DPI 刷新和脚本输入前校验恢复检查点并注入脚本', () => {
  const service = source('../src/utils/scriptService.js')
  const generator = source('../src/utils/python.js')
  const validation = service.indexOf('const recoveryValidation = validateMapRecovery(recovery')
  const dpiRefresh = service.indexOf('await refreshDpiForAutomation(settingsStore)', validation)
  const generation = service.indexOf('generateMapRollingScript({', validation)
  assert.ok(validation >= 0 && dpiRefresh > validation && generation > dpiRefresh)
  assert.match(service.slice(generation), /recovery: recoveryValidation\.value/)
  assert.match(generator, /'\{\{RECOVERY_CONFIG\}\}': jsonToPython\(JSON\.stringify\(recovery \|\| \{\}\)\)/)
})
