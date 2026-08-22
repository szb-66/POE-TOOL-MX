import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { InstalledUpdateRepository } from '../electron/modules/update/installedUpdateRepository.js'

async function createRepository() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-installed-update-'))
  return { root, repository: new InstalledUpdateRepository({ userDataPath: root, now: () => 123 }) }
}

test('待展示升级记录原子写入并仅匹配目标版本', async t => {
  const { root, repository } = await createRepository()
  t.after(() => rm(root, { recursive: true, force: true }))
  await repository.save({ targetVersion: '1.2.3', releaseNotes: '  修复 A\n\n改进 B  ' })
  assert.deepEqual(await repository.loadForVersion('1.2.3'), {
    targetVersion: '1.2.3', releaseNotes: '修复 A\n\n改进 B'
  })
  assert.equal(await repository.loadForVersion('1.2.2'), null)
  const content = await readFile(repository.filePath, 'utf8')
  assert.match(content, /"targetVersion": "1\.2\.3"/)
})
test('记录校验拒绝非稳定版本和空内容', async t => {
  const { root, repository } = await createRepository()
  t.after(() => rm(root, { recursive: true, force: true }))
  await assert.rejects(repository.save({ targetVersion: '1.2.3-beta.1', releaseNotes: '内容' }), /版本无效/)
  await assert.rejects(repository.save({ targetVersion: '1.2.3', releaseNotes: '   ' }), /内容无效/)
})

test('原子替换失败时清理临时文件并保留原错误', async () => {
  const calls = []
  const fileSystem = {
    mkdir: async () => {},
    writeFile: async file => { calls.push(['write', file]) },
    rename: async () => { throw new Error('rename failed') },
    unlink: async file => { calls.push(['unlink', file]) },
    readFile: async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }) }
  }
  const repository = new InstalledUpdateRepository({ userDataPath: 'C:\\profile', fileSystem, now: () => 9 })
  await assert.rejects(repository.save({ targetVersion: '1.2.3', releaseNotes: '内容' }), /rename failed/)
  assert.equal(calls[0][0], 'write')
  assert.deepEqual(calls[1], ['unlink', calls[0][1]])
})

test('已读确认只删除与当前版本匹配的记录', async t => {
  const { root, repository } = await createRepository()
  t.after(() => rm(root, { recursive: true, force: true }))
  await repository.save({ targetVersion: '1.2.3', releaseNotes: '内容' })
  assert.equal(await repository.acknowledge('1.2.2'), false)
  assert.ok(await repository.read())
  assert.equal(await repository.acknowledge('1.2.3'), true)
  assert.equal(await repository.read(), null)
})
