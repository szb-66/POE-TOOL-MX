import test from 'node:test'
import assert from 'node:assert/strict'
import { assemblePuzzleEvidenceAttachments } from '../electron/modules/feedback/evidenceAttachments.js'

function file({ page, attempt, kind, bytes }) {
  const extension = kind === 'crop' ? 'png' : 'jpg'
  return {
    attempt, page, kind, fileName: `page-${page}-attempt-${attempt}-${kind}.${extension}`,
    encoding: kind === 'crop' ? 'png' : 'jpeg', width: 600, height: 1000,
    bytes, sha256: 'a'.repeat(64), status: 'complete', body: Buffer.alloc(bytes)
  }
}

function evidence(files) {
  return {
    referenceId: '11111111-1111-4111-8111-111111111111',
    files,
    manifest: {
      schemaVersion: 1,
      evidenceId: '11111111-1111-4111-8111-111111111111',
      occurredAt: '2026-08-26T01:02:03Z',
      completeness: { status: 'complete', reasons: [] },
      attempts: files.map(item => ({ attempt: item.attempt, page: item.page })),
      files: files.map(({ body, ...metadata }) => metadata),
      omittedFiles: []
    }
  }
}

const diagnostics = {
  name: 'poe-cn-helper-diagnostics.json', safeName: 'poe-cn-helper-diagnostics.json', mimeType: 'application/json',
  size: 1024, body: Buffer.alloc(1024), diagnostic: true
}

test('系统证据不占手动附件名额且保留全部裁剪、最终完整窗口、清单和诊断', () => {
  const files = [
    file({ page: 1, attempt: 1, kind: 'crop', bytes: 1024 }),
    file({ page: 2, attempt: 1, kind: 'crop', bytes: 1024 }),
    file({ page: 1, attempt: 1, kind: 'window', bytes: 1024 }),
    file({ page: 2, attempt: 1, kind: 'window', bytes: 1024 })
  ]
  const items = assemblePuzzleEvidenceAttachments({ diagnostics, evidence: evidence(files), manualBytes: 5 * 1024 })
  assert.deepEqual(items.map(item => item.systemKind || 'diagnostics'), [
    'puzzle-evidence-crop', 'puzzle-evidence-crop', 'puzzle-evidence-window', 'puzzle-evidence-window',
    'puzzle-evidence-manifest', 'diagnostics'
  ])
  const manifest = JSON.parse(items.find(item => item.systemKind === 'puzzle-evidence-manifest').body)
  assert.equal(manifest.omittedFiles.length, 0)
  assert.equal(manifest.files.every(item => item.submissionStatus === 'included'), true)
})

test('超过 30MB 时确定性保留全部裁剪和最终完整窗口并在清单列出旧窗口', () => {
  const megabyte = 1024 * 1024
  const files = [
    file({ page: 1, attempt: 1, kind: 'crop', bytes: 2 * megabyte }),
    file({ page: 2, attempt: 1, kind: 'crop', bytes: 2 * megabyte }),
    file({ page: 1, attempt: 1, kind: 'window', bytes: 9 * megabyte }),
    file({ page: 2, attempt: 1, kind: 'window', bytes: 9 * megabyte })
  ]
  const items = assemblePuzzleEvidenceAttachments({ diagnostics, evidence: evidence(files), manualBytes: 8 * megabyte })
  const windows = items.filter(item => item.systemKind === 'puzzle-evidence-window')
  assert.deepEqual(windows.map(item => item.name), ['page-2-attempt-1-window.jpg'])
  assert.equal(items.filter(item => item.systemKind === 'puzzle-evidence-crop').length, 2)
  const manifest = JSON.parse(items.find(item => item.systemKind === 'puzzle-evidence-manifest').body)
  assert.deepEqual(manifest.omittedFiles.map(item => [item.fileName, item.reason]), [['page-1-attempt-1-window.jpg', 'CAPACITY_LIMIT']])
})

test('手动附件挤占全部裁剪和诊断所需容量时阻止不完整提交', () => {
  const files = [file({ page: 1, attempt: 1, kind: 'crop', bytes: 6 * 1024 * 1024 })]
  assert.throws(
    () => assemblePuzzleEvidenceAttachments({ diagnostics, evidence: evidence(files), manualBytes: 25 * 1024 * 1024 }),
    /全部识别裁剪图合计不能超过 30MB/
  )
})
