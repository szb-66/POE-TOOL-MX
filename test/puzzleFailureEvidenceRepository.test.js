import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { mkdtemp, mkdir, readdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
  PUZZLE_FAILURE_EVIDENCE_RETENTION_MS,
  PuzzleFailureEvidenceRepository,
  validatePuzzleFailureEvidenceManifest
} from '../electron/modules/puzzle/failureEvidenceRepository.js'

function completeFile({ body = Buffer.from('png'), attempt = 1, page = 1, kind = 'crop', fileName = 'page-1-attempt-1-crop.png' } = {}) {
  return {
    attempt, page, kind, fileName, encoding: kind === 'crop' ? 'png' : 'jpeg', width: 600, height: 1000,
    bytes: body.length, sha256: createHash('sha256').update(body).digest('hex'), status: 'complete'
  }
}

function manifest(evidenceId, overrides = {}) {
  return {
    schemaVersion: 1,
    evidenceId,
    occurredAt: new Date('2026-08-26T01:02:03Z').toISOString(),
    completeness: { status: 'partial', reasons: ['WINDOW_BOUNDS_UNAVAILABLE'] },
    attempts: [{
      attempt: 1, page: 1, capturedAt: '2026-08-26T01:02:03Z', stage: 'GRID_ANALYSIS',
      monitorBounds: { left: 0, top: 0, width: 2560, height: 1440 },
      windowBounds: { left: 100, top: 40, width: 1920, height: 1080 },
      configuredRegion: { left: 240, top: 100, width: 600, height: 1000 },
      actualCrop: { left: 140, top: 60, width: 600, height: 1000 },
      grid: { candidateVerticalLines: [100, 200], candidateHorizontalLines: [80, 160], spacing: { x: 100, y: 80 }, deviation: { mean: 1.2, max: 3 }, confidence: 0.42 },
      occupiedCount: 0, warnings: ['GRID_ALIGNMENT_LOW'], errorCode: 'EMPTY_GRID_UNCERTAIN'
    }],
    files: [completeFile(), { attempt: 1, page: 1, kind: 'window', encoding: 'jpeg', status: 'missing', omissionReason: 'WINDOW_BOUNDS_UNAVAILABLE' }],
    omittedFiles: [],
    ...overrides
  }
}

test('证据清单固定随机标识、相对文件名、逐次指标、图片元数据和省略原因', () => {
  const id = randomUUID()
  const value = validatePuzzleFailureEvidenceManifest(manifest(id))
  assert.equal(value.evidenceId, id)
  assert.equal(value.attempts[0].grid.candidateVerticalLines.length, 2)
  assert.equal(value.files[0].sha256.length, 64)
  assert.equal(value.files[1].omissionReason, 'WINDOW_BOUNDS_UNAVAILABLE')
  assert.throws(() => validatePuzzleFailureEvidenceManifest(manifest(id, { files: [{ ...completeFile(), fileName: '../secret.png' }] })), /文件元数据|图片元数据/)
  const sanitized = validatePuzzleFailureEvidenceManifest(manifest(id, { completeness: { status: 'partial', reasons: ['C:\\Users\\Private\\secret'] } }))
  assert.deepEqual(sanitized.completeness.reasons, [])
  assert.doesNotMatch(JSON.stringify(sanitized), /Private|C:\\\\Users/)
})

test('仓库原子提交、读取摘要和新证据替换不留下旧目录', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'puzzle-evidence-'))
  const repository = new PuzzleFailureEvidenceRepository({ root, now: () => Date.parse('2026-08-26T01:02:03Z') })
  const first = await repository.createWorkspace()
  await writeFile(path.join(first.directory, 'page-1-attempt-1-crop.png'), 'png')
  assert.equal((await repository.commit(first, manifest(first.evidenceId))).success, true)
  assert.equal((await repository.getSummary()).evidence.attemptCount, 1)
  const second = await repository.createWorkspace()
  await writeFile(path.join(second.directory, 'page-1-attempt-1-crop.png'), 'png')
  assert.equal((await repository.commit(second, manifest(second.evidenceId))).success, true)
  const entries = await readdir(root, { withFileTypes: true })
  assert.equal(entries.some(item => item.isDirectory() && item.name === first.evidenceId), false)
  assert.equal((await repository.getSummary()).evidence.referenceId, second.evidenceId)
})

test('反馈失败保留、成功或用户取消只清理对应证据且不暴露完整路径', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'puzzle-evidence-clear-'))
  const repository = new PuzzleFailureEvidenceRepository({ root, now: () => Date.parse('2026-08-26T01:02:03Z') })
  const workspace = await repository.createWorkspace()
  await writeFile(path.join(workspace.directory, 'page-1-attempt-1-crop.png'), 'png')
  await repository.commit(workspace, manifest(workspace.evidenceId))
  const summary = await repository.getSummary()
  assert.equal(JSON.stringify(summary).includes(root), false)
  assert.equal((await repository.getSummary()).evidence.referenceId, workspace.evidenceId)
  assert.equal((await repository.clear(randomUUID())).cleared, false)
  assert.equal((await repository.clear(workspace.evidenceId)).cleared, true)
  assert.equal((await repository.getSummary()).evidence, null)
})

test('七天过期和异常退出孤立暂存目录在访问时恢复清理', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'puzzle-evidence-expiry-'))
  let now = Date.parse('2026-08-26T01:02:03Z')
  const repository = new PuzzleFailureEvidenceRepository({ root, now: () => now })
  const workspace = await repository.createWorkspace()
  await writeFile(path.join(workspace.directory, 'page-1-attempt-1-crop.png'), 'png')
  await repository.commit(workspace, manifest(workspace.evidenceId))
  await mkdir(path.join(root, `.staging-${randomUUID()}`))
  now += PUZZLE_FAILURE_EVIDENCE_RETENTION_MS + 1
  assert.equal((await repository.getSummary()).evidence, null)
  assert.equal((await readdir(root)).some(name => name.startsWith('.staging-')), false)
})

test('读取摘要不会删除当前进程仍在写入的活动暂存目录', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'puzzle-evidence-active-'))
  const repository = new PuzzleFailureEvidenceRepository({ root })
  const active = await repository.createWorkspace()
  const orphanId = randomUUID()
  await mkdir(path.join(root, `.staging-${orphanId}`))
  await repository.getSummary()
  const entries = await readdir(root)
  assert.equal(entries.includes(`.staging-${active.evidenceId}`), true)
  assert.equal(entries.includes(`.staging-${orphanId}`), false)
  await repository.discardWorkspace(active)
})

test('不可写或损坏目录安全降级为内部完整性状态', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'puzzle-evidence-broken-'))
  const repository = new PuzzleFailureEvidenceRepository({ root, logger: { warn() {} } })
  const workspace = await repository.createWorkspace()
  const result = await repository.commit(workspace, manifest(workspace.evidenceId))
  assert.equal(result.success, false)
  assert.equal(repository.integrityStatus().status, 'unavailable')
  assert.equal(JSON.stringify(result).includes(root), false)
})
