import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { ModelAvailability, validateModelFiles } from '../electron/modules/junfeng/modelAvailability.js'

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'junfeng-model-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const paths = { model: path.join(root, 'model.onnx'), manifest: path.join(root, 'manifest.json') }
  const manifest = { schemaVersion: 1, architectureVersion: 1, classes: ['highlighted', 'dimmed', 'empty'],
    modelVersion: 'test', sha256: createHash('sha256').update('model').digest('hex') }
  await writeFile(paths.model, 'model')
  await writeFile(paths.manifest, JSON.stringify(manifest))
  return { paths, manifest }
}

test('模型异步校验保留缺失、损坏、契约和哈希错误', async t => {
  const { paths, manifest } = await fixture(t)
  assert.deepEqual(await validateModelFiles(paths), { ready: true, reason: '', modelVersion: 'test' })
  await writeFile(paths.model, 'changed')
  assert.match((await validateModelFiles(paths)).reason, /校验失败/)
  await rm(paths.model)
  assert.match((await validateModelFiles(paths)).reason, /文件不存在/)
  await writeFile(paths.manifest, JSON.stringify({ ...manifest, schemaVersion: 2 }))
  assert.match((await validateModelFiles(paths)).reason, /契约不兼容/)
  await writeFile(paths.manifest, '{')
  assert.match((await validateModelFiles(paths)).reason, /清单损坏/)
  await rm(paths.manifest)
  assert.match((await validateModelFiles(paths)).reason, /清单不存在/)
})

test('并发共用校验，刷新界面只读取缓存', async t => {
  const { paths } = await fixture(t)
  let calls = 0
  const cache = new ModelAvailability(paths, { validate: async () => {
    calls++
    return { ready: true, reason: '', modelVersion: 'test' }
  } })
  t.after(() => cache.dispose())
  cache.setEnabled(true)
  assert.equal(cache.getState().reason, '模型准备中')
  assert.equal(cache.refresh(), cache.refresh())
  await cache.refresh()
  for (let i = 0; i < 100; i++) assert.equal(cache.getState().ready, true)
  cache.setEnabled(true)
  assert.equal(calls, 1)
})

test('关闭功能后忽略旧结果，再启用会重新校验', async t => {
  const { paths } = await fixture(t)
  let finish
  let changes = 0
  const cache = new ModelAvailability(paths, { validate: () => new Promise(resolve => { finish = resolve }),
    onChange: () => changes++ })
  t.after(() => cache.dispose())
  cache.setEnabled(true)
  const old = cache.refresh()
  await Promise.resolve()
  cache.setEnabled(false)
  finish({ ready: true, reason: '' })
  await old
  assert.equal(cache.getState().ready, false)
  assert.equal(changes, 0)
  cache.setEnabled(true)
  const next = cache.refresh()
  await Promise.resolve()
  finish({ ready: true, reason: '' })
  await next
  assert.equal(cache.getState().ready, true)
  assert.equal(changes, 1)
})

test('校验途中失效不会发布旧结果，并自动补一次校验', async t => {
  const { paths } = await fixture(t)
  const finishes = []
  const cache = new ModelAvailability(paths, { validate: () => new Promise(resolve => finishes.push(resolve)) })
  t.after(() => cache.dispose())
  cache.setEnabled(true)
  const first = cache.refresh()
  await Promise.resolve()
  cache.invalidate()
  finishes[0]({ ready: true, reason: '', modelVersion: 'old' })
  await first
  assert.equal(cache.getState().ready, false)
  const second = cache.refresh()
  await Promise.resolve()
  finishes[1]({ ready: true, reason: '', modelVersion: 'new' })
  await second
  assert.equal(cache.getState().modelVersion, 'new')
})

test('文件变化自动清除缓存并重新校验，缺失文件恢复后可用', async t => {
  const { paths } = await fixture(t)
  const cache = new ModelAvailability(paths)
  t.after(() => cache.dispose())
  cache.setEnabled(true)
  await cache.refresh()
  async function waitFor(predicate) {
    const deadline = Date.now() + 5000
    while (!predicate()) {
      assert.ok(Date.now() < deadline, '等待文件监听更新超时')
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }
  await rm(paths.model)
  await waitFor(() => cache.getState().reason.includes('文件不存在'))
  await writeFile(paths.model, 'model')
  await waitFor(() => cache.getState().ready)
  await writeFile(paths.manifest, '{}')
  await waitFor(() => cache.getState().reason.includes('契约不兼容'))
})
