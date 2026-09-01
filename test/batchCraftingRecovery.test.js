import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  createBatchRecoveryStore,
  normalizeBatchRecoveryCheckpoint
} from '../electron/modules/crafting/batchRecovery.js'

function source(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

function target(id, x) {
  return {
    id,
    categoryId: 'jewel',
    baseType: `珠宝${id}`,
    displayName: `目标${id}`,
    x,
    y: 0,
    width: 1,
    height: 1,
    footprintSource: 'catalog',
    position: { x: 9999, y: 9999 },
    secret: 'discard-me'
  }
}

function checkpoint(overrides = {}) {
  return {
    batchId: 'batch-1',
    scanId: 'scan-1',
    snapshotFingerprint: 'fingerprint-1',
    usageSessionId: 'usage-1',
    targets: [target('a', 0), target('b', 1), target('c', 2)],
    completedIds: ['a'],
    currentItemId: 'b',
    recoverable: true,
    ...overrides
  }
}

test('批量恢复检查点只保留最小身份字段并验证完成集合', () => {
  const result = normalizeBatchRecoveryCheckpoint(checkpoint(), { requireRecoverable: true })
  assert.equal(result.valid, true)
  assert.deepEqual(result.value.targets[0], {
    id: 'a', categoryId: 'jewel', baseType: '珠宝a', displayName: '目标a',
    x: 0, y: 0, width: 1, height: 1, footprintSource: 'catalog'
  })
  assert.equal(Object.hasOwn(result.value.targets[0], 'position'), false)
  assert.equal(Object.hasOwn(result.value.targets[0], 'secret'), false)
  assert.equal(normalizeBatchRecoveryCheckpoint(checkpoint({ completedIds: ['missing'] })).valid, false)
  assert.equal(normalizeBatchRecoveryCheckpoint(checkpoint({ targets: [target('a', 0), target('a', 1)] })).valid, false)
  assert.equal(normalizeBatchRecoveryCheckpoint(checkpoint({ currentItemId: 'missing' })).valid, false)
})

test('批量恢复生命周期在异常时保留并按完成事件推进', () => {
  const store = createBatchRecoveryStore()
  const begun = store.begin(checkpoint({ completedIds: ['a'], recoverable: false }), 'usage-1')
  assert.equal(begun.valid, true)
  assert.equal(store.snapshot({ requireRecoverable: true }), null)

  store.applyEvent({ event: 'crafting-batch-item-started', batchId: 'batch-1', currentItem: { id: 'b' } })
  let stopped = store.markAbnormal({ reason: '读取失败', code: 'ITEM_READ_FAILED' })
  assert.equal(stopped.recoverable, true)
  assert.equal(stopped.currentItemId, 'b')
  assert.deepEqual(stopped.completedIds, ['a'])

  store.applyEvent({ event: 'crafting-batch-item-completed', batchId: 'batch-1', currentItem: { id: 'b' } })
  store.applyEvent({ event: 'crafting-batch-item-started', batchId: 'batch-1', currentItem: { id: 'c' } })
  stopped = store.markAbnormal({ reason: '再次失败' })
  assert.deepEqual(stopped.completedIds, ['a', 'b'])
  assert.equal(stopped.currentItemId, 'c')

  store.applyEvent({ event: 'crafting-batch-completed', batchId: 'batch-1' })
  assert.equal(store.snapshot(), null)

  store.begin(checkpoint({ completedIds: ['a'], recoverable: false }), 'usage-1')
  store.markAbnormal({ reason: '等待用户处理' })
  store.clear()
  assert.equal(store.snapshot(), null)
})

test('主进程在启动前建立检查点并按脚本终态推进或清除', () => {
  const ipc = source('../electron/modules/ipc/python.js')
  const windowIpc = source('../electron/modules/ipc/window.js')

  assert.match(ipc, /batchRecoveryStore\.begin\(config\.batchRecoveryContext, config\.usageSessionId\)/)
  assert.match(ipc, /scriptEvent\?\.event\?\.startsWith\('crafting-batch-'\)[\s\S]*batchRecoveryStore\.applyEvent\(scriptEvent\)/)
  assert.match(ipc, /termination === 'abnormal'[\s\S]*batchRecoveryStore\.markAbnormal/)
  assert.match(ipc, /scriptEvent\?\.event === 'crafting-manual-stopped'[\s\S]*batchRecoveryStore\.clear\(\)/)
  assert.match(ipc, /scriptEvent\?\.event === 'crafting-completed'[\s\S]*batchRecoveryStore\.clear\(\)/)
  assert.match(windowIpc, /crafting-batch-return-to-scan[\s\S]*batchRecoveryStore\.clear\(\)/)
  assert.match(ipc, /const stopScript = async \(\) =>[\s\S]*mode === 'items'[\s\S]*batchRecoveryStore\.clear\(\)/)
})

test('批量恢复 IPC 仅向主窗口和当前制作浮窗开放', () => {
  const ipc = source('../electron/modules/ipc/python.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')

  assert.match(ipc, /trustedBatchRecoverySender[\s\S]*event\.sender === mainWindow\.webContents[\s\S]*event\.sender === overlayWindow\.webContents/)
  assert.match(ipc, /crafting-batch-recovery-get[\s\S]*trustedBatchRecoverySender\(event\)/)
  assert.match(ipc, /crafting-batch-recovery-clear[\s\S]*trustedBatchRecoverySender\(event\)/)
  assert.match(preload, /getBatchCraftingRecovery[\s\S]*crafting-batch-recovery-get/)
  assert.match(preload, /clearBatchCraftingRecovery[\s\S]*crafting-batch-recovery-clear/)
  assert.match(api, /getRecovery:[\s\S]*getBatchCraftingRecovery/)
  assert.match(api, /clearRecovery:[\s\S]*clearBatchCraftingRecovery/)
})
