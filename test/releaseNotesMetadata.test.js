import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { injectReleaseNotes, injectReleaseNotesText } from '../scripts/release/injectReleaseNotes.js'

const METADATA = `version: 1.0.6
files:
  - url: app.exe
    sha512: abc
releaseDate: '2026-08-22T00:00:00.000Z'
`

test('发布说明以 YAML 多行纯文本注入且可幂等替换', () => {
  const notes = '# 更新\n\n- 修复: A\n- 保留 # 和 "引号"'
  const first = injectReleaseNotesText(METADATA, notes, '1.0.6')
  assert.match(first, /releaseNotes: \|-\n  # 更新\n  \n  - 修复: A\n  - 保留 # 和 "引号"/)
  const second = injectReleaseNotesText(first, '新内容', '1.0.6')
  assert.equal((second.match(/^releaseNotes:/gm) || []).length, 1)
  assert.match(second, /releaseNotes: \|-\n  新内容/)
  assert.doesNotMatch(second, /保留 #/)
})
test('发布说明为空或元数据版本不匹配时拒绝', () => {
  assert.throws(() => injectReleaseNotesText(METADATA, '  \n', '1.0.6'), /发布说明为空/)
  assert.throws(() => injectReleaseNotesText(METADATA, '内容', '1.0.7'), /版本不匹配/)
})

test('发布说明文件缺失时不改写 latest.yml', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-release-notes-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const metadataPath = path.join(root, 'latest.yml')
  await writeFile(metadataPath, METADATA, 'utf8')
  await assert.rejects(injectReleaseNotes({ metadataPath, notesPath: path.join(root, 'missing.md'), expectedVersion: '1.0.6' }), /ENOENT/)
  assert.equal(await readFile(metadataPath, 'utf8'), METADATA)
})

test('文件注入成功后 latest.yml 包含非空说明', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-release-notes-success-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const metadataPath = path.join(root, 'latest.yml')
  const notesPath = path.join(root, 'v1.0.6.md')
  await writeFile(metadataPath, METADATA, 'utf8')
  await writeFile(notesPath, '修复启动问题\n', 'utf8')
  await injectReleaseNotes({ metadataPath, notesPath, expectedVersion: '1.0.6' })
  assert.match(await readFile(metadataPath, 'utf8'), /releaseNotes: \|-\n  修复启动问题/)
})
