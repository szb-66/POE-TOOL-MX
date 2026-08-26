import test from 'node:test'
import assert from 'node:assert/strict'
import { PuzzleFailureEvidenceSession } from '../electron/modules/puzzle/failureEvidenceSession.js'

function evidence(page, status = 'complete') {
  return {
    schemaVersion: 1,
    evidenceId: '11111111-1111-4111-8111-111111111111',
    occurredAt: `2026-08-26T01:02:0${page}Z`,
    completeness: { status, reasons: status === 'complete' ? [] : ['IMAGE_ENCODING_FAILED'] },
    attempts: [{ attempt: 1, page }],
    files: [{ attempt: 1, page, kind: 'crop', fileName: `page-${page}-attempt-1-crop.png` }],
    omittedFiles: []
  }
}

function repository(overrides = {}) {
  const calls = { created: 0, committed: [], discarded: [] }
  return {
    calls,
    async createWorkspace() { calls.created += 1; return { evidenceId: '11111111-1111-4111-8111-111111111111', directory: 'internal-only' } },
    async commit(workspace, manifest) { calls.committed.push({ workspace, manifest }); return { success: true } },
    async discardWorkspace(workspace) { calls.discarded.push(workspace); return { success: true } },
    ...overrides
  }
}

test('海图服务消费并剥离内部证据且最终失败合并双页后提交', async () => {
  const store = repository()
  const session = new PuzzleFailureEvidenceSession(store)
  await session.start()
  const first = session.consume({ success: true, occupiedCount: 2, _failureEvidence: evidence(1) })
  const second = session.consume({ success: false, error: { code: 'EMPTY_GRID_UNCERTAIN' }, _failureEvidence: evidence(2, 'partial') })
  assert.deepEqual(first, { success: true, occupiedCount: 2 })
  assert.deepEqual(second, { success: false, error: { code: 'EMPTY_GRID_UNCERTAIN' } })
  assert.equal(JSON.stringify(first).includes('_failureEvidence'), false)
  await session.commitFailure()
  assert.equal(store.calls.committed.length, 1)
  assert.deepEqual(store.calls.committed[0].manifest.attempts.map(item => item.page), [1, 2])
  assert.equal(store.calls.committed[0].manifest.completeness.status, 'partial')
})

test('后续尝试恢复、离线成功和紧急停止只丢弃本次暂存且不提交失败证据', async () => {
  for (const result of [
    { success: true, occupiedCount: 3, _failureEvidence: evidence(1) },
    { success: false, canceled: true, error: { code: 'EMERGENCY_STOPPED' } }
  ]) {
    const store = repository()
    const session = new PuzzleFailureEvidenceSession(store)
    await session.start()
    const publicResult = session.consume(result)
    await session.discard()
    assert.equal(publicResult.error?.code || 'SUCCESS', result.error?.code || 'SUCCESS')
    assert.equal(store.calls.committed.length, 0)
    assert.equal(store.calls.discarded.length, 1)
  }
})

test('证据仓库故障只记录内部完整性状态且不改变原公开结果', async () => {
  const store = repository({ async commit() { throw Object.assign(new Error('private path'), { code: 'EACCES' }) } })
  const warnings = []
  const session = new PuzzleFailureEvidenceSession(store, { warn: (...items) => warnings.push(items) })
  await session.start()
  const publicResult = session.consume({ success: false, error: { code: 'EMPTY_GRID_UNCERTAIN', message: '原错误' }, _failureEvidence: evidence(1) })
  const committed = await session.commitFailure()
  assert.deepEqual(publicResult, { success: false, error: { code: 'EMPTY_GRID_UNCERTAIN', message: '原错误' } })
  assert.equal(committed.success, false)
  assert.equal(warnings.length, 1)
  assert.equal(JSON.stringify(committed).includes('private path'), false)
})
