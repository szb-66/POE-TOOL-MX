import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
  loadRawSnapshot,
  readRawManifest,
  snapshotPatchRoot,
  synchronizeRawSnapshot
} from '../scripts/craftingRawSnapshot.js'

const sources = [
  { id: 'base:Helmets', page: 'Helmets', url: 'https://example.test/Helmets', category: 'base' },
  { id: 'modifier:Helmets_str', page: 'Helmets_str', url: 'https://example.test/Helmets_str', category: 'modifier' }
]

async function withTempRoot(operation) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crafting-raw-'))
  try {
    return await operation(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

const fixedNow = () => '2026-07-22T00:00:00.000Z'

test('离线重建只读取本地压缩快照且不调用网络', async () => withTempRoot(async (root) => {
  await synchronizeRawSnapshot({
    root, patch: '3.28', sources, mode: 'full', now: fixedNow,
    fetcher: async (url) => ({ text: `<html>${url}</html>`, status: 200 })
  })
  let networkCalls = 0
  const snapshot = await synchronizeRawSnapshot({
    root, patch: '3.28', sources, mode: 'offline',
    fetcher: async () => { networkCalls += 1; throw new Error('离线模式不得联网') }
  })
  assert.equal(networkCalls, 0)
  assert.equal(snapshot.texts.get('base:Helmets'), '<html>https://example.test/Helmets</html>')
  assert.equal(snapshot.manifest.sources[0].status, 200)
  assert.match(snapshot.manifest.sources[0].sha256, /^[a-f0-9]{64}$/)
  assert.equal(snapshot.manifest.sources[0].category, 'base')
}))

test('补缺模式只抓取 manifest 中缺失的来源页', async () => withTempRoot(async (root) => {
  await synchronizeRawSnapshot({
    root, patch: '3.28', sources: sources.slice(0, 1), mode: 'full', now: fixedNow,
    fetcher: async () => ({ text: 'existing', status: 200 })
  })
  const fetched = []
  const snapshot = await synchronizeRawSnapshot({
    root, patch: '3.28', sources, mode: 'missing', now: fixedNow,
    fetcher: async (url, source) => { fetched.push(source.id); return { text: `new:${url}`, status: 200 } }
  })
  assert.deepEqual(fetched, ['modifier:Helmets_str'])
  assert.equal(snapshot.texts.get('base:Helmets'), 'existing')
  assert.equal(snapshot.texts.get('modifier:Helmets_str'), 'new:https://example.test/Helmets_str')
}))

test('定向刷新仅替换指定来源并保留其他来源内容与哈希', async () => withTempRoot(async (root) => {
  await synchronizeRawSnapshot({
    root, patch: '3.28', sources, mode: 'full', now: fixedNow,
    fetcher: async (url, source) => ({ text: `old:${source.id}`, status: 200 })
  })
  const before = await readRawManifest(root, '3.28')
  const fetched = []
  const snapshot = await synchronizeRawSnapshot({
    root, patch: '3.28', sources, mode: 'refresh', refresh: ['Helmets_str'],
    now: () => '2026-07-23T00:00:00.000Z',
    fetcher: async (url, source) => { fetched.push(source.id); return { text: `refreshed:${source.id}`, status: 200 } }
  })
  const after = snapshot.manifest
  assert.deepEqual(fetched, ['modifier:Helmets_str'])
  assert.equal(after.sources[0].sha256, before.sources[0].sha256)
  assert.equal(after.sources[0].fetchedAt, before.sources[0].fetchedAt)
  assert.equal(snapshot.texts.get('base:Helmets'), 'old:base:Helmets')
  assert.equal(snapshot.texts.get('modifier:Helmets_str'), 'refreshed:modifier:Helmets_str')
}))

test('不同补丁使用独立目录且刷新新版本不改变旧版本', async () => withTempRoot(async (root) => {
  await synchronizeRawSnapshot({
    root, patch: '3.28', sources, mode: 'full', now: fixedNow,
    fetcher: async (url, source) => ({ text: `3.28:${source.id}`, status: 200 })
  })
  const oldManifestFile = path.join(snapshotPatchRoot(root, '3.28'), 'manifest.json')
  const oldManifestBytes = await readFile(oldManifestFile)
  await synchronizeRawSnapshot({
    root, patch: '3.29', sources, mode: 'full', now: fixedNow,
    fetcher: async (url, source) => ({ text: `3.29:${source.id}`, status: 200 })
  })
  assert.deepEqual(await readFile(oldManifestFile), oldManifestBytes)
  assert.equal((await loadRawSnapshot({ root, patch: '3.28', sources })).texts.get('base:Helmets'), '3.28:base:Helmets')
  assert.equal((await loadRawSnapshot({ root, patch: '3.29', sources })).texts.get('base:Helmets'), '3.29:base:Helmets')
}))
