import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { generateServerTradeCatalog, writeServerTradeCatalog } from '../scripts/generateServerTradeCatalog.js'
import { loadTradeCatalog, loadInternationalTradeCatalog, resolveCatalogStat } from '../electron/modules/priceCheck/catalog.js'

const payloads = {
  stats: { result: [{ id: 'explicit', entries: Array.from({ length: 110 }, (_, index) => ({ id: `explicit.stat_${index}`, text: `Fixture stat ${index}: +# to Life` })) }] },
  items: { result: [{ id: 'accessory.ring', entries: Array.from({ length: 110 }, (_, index) => ({ type: `Fixture Base ${index}` })) }] },
  static: { result: [{ id: 'currency', entries: [{ id: 'chaos', text: 'Chaos Orb' }] }] }
}

test('国际服生成只请求本服，目录不继承国服文本，带版本、来源与哈希', async () => {
  const { catalog: baseCatalog } = await loadTradeCatalog()
  const requests = []
  const { catalog, status } = await generateServerTradeCatalog({ server: 'international', gameVersion: '3.29', baseCatalog,
    fetchImpl: async url => { requests.push(url); return new Response(JSON.stringify(payloads[url.split('/').at(-1)])) } })
  assert.equal(catalog.locale, 'en')
  assert.equal(catalog.provider, 'poe-international')
  assert.equal(catalog.gameVersion, '3.29')
  assert.equal(catalog.items.length, 110)
  assert.equal(catalog.stats.length, 110)
  assert.equal(status.counts.currencies, 1)
  assert.deepEqual(status.sources, catalog.sources)
  assert.ok(status.sources.every(url => url.startsWith('https://www.pathofexile.com/')))
  assert.deepEqual(catalog.unqueryableStats, [])
  assert.ok(requests.every(url => url.startsWith('https://www.pathofexile.com/')))
  assert.ok(catalog.manifest.sources.every(source => /^[a-f0-9]{64}$/.test(source.sha256)))
  assert.equal(resolveCatalogStat(catalog, 'Fixture stat 0: +79 to Life', 'explicit').match?.id, 'explicit.stat_0')
})

test('结构异常和 HTTP 拒绝使生成失败，不产生可发布候选', async () => {
  const { catalog: baseCatalog } = await loadTradeCatalog()
  for (const response of [() => new Response('{}'), () => new Response('blocked', { status: 403 })]) {
    await assert.rejects(generateServerTradeCatalog({ server: 'international', gameVersion: '3.29', baseCatalog, fetchImpl: async () => response() }))
  }
  await assert.rejects(generateServerTradeCatalog({ server: 'international', baseCatalog }), /补丁版本/)
})

test('写入前校验服务器目标和完整结构，失败不覆盖国服或现有活动目录', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-server-catalog-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const { catalog: baseCatalog } = await loadTradeCatalog()
  const { catalog } = await generateServerTradeCatalog({ server: 'international', gameVersion: '3.29', baseCatalog,
    fetchImpl: async url => new Response(JSON.stringify(payloads[url.split('/').at(-1)])) })
  const output = path.join(root, 'catalog.international.json')
  await writeServerTradeCatalog(output, catalog)
  const before = await readFile(output, 'utf8')
  await assert.rejects(writeServerTradeCatalog(path.join(root, 'catalog.json'), catalog), /避免覆盖国服/)
  await assert.rejects(writeServerTradeCatalog(output, { ...catalog, stats: null }))
  assert.equal(await readFile(output, 'utf8'), before)
})

test('国际服启动优先使用已验证缓存，错误清单回退本服快照，两者失效也不使用国服内容', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-international-startup-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const { catalog: baseCatalog } = await loadTradeCatalog()
  const { catalog } = await generateServerTradeCatalog({ server: 'international', gameVersion: 'live', baseCatalog,
    fetchImpl: async url => new Response(JSON.stringify(payloads[url.split('/').at(-1)])) })
  const cacheFile = path.join(root, 'cache.international.json')
  const bundledFile = path.join(root, 'bundled.international.json')
  await writeServerTradeCatalog(cacheFile, catalog)
  await writeServerTradeCatalog(bundledFile, catalog)
  let loaded = await loadInternationalTradeCatalog({ baseCatalog, cacheFile, bundledFile })
  assert.equal(loaded.status.provider, 'cached')
  assert.equal(loaded.status.degraded, false)
  assert.equal(loaded.status.warning, '')
  assert.equal(loaded.status.counts.stats, 110)
  const wrongServer = structuredClone(catalog)
  wrongServer.manifest.server = 'cn'
  await writeFile(cacheFile, JSON.stringify(wrongServer))
  loaded = await loadInternationalTradeCatalog({ baseCatalog, cacheFile, bundledFile })
  assert.equal(loaded.status.provider, 'bundled')
  assert.equal(loaded.catalog.provider, 'poe-international')
  await writeFile(bundledFile, '{}')
  loaded = await loadInternationalTradeCatalog({ baseCatalog, cacheFile, bundledFile })
  assert.equal(loaded.status.provider, 'unavailable')
  assert.equal(loaded.status.degraded, true)
  assert.equal(loaded.catalog.items.length, 0)
  assert.equal(loaded.catalog.stats.length, 0)
  assert.deepEqual(loaded.catalog.currencyLabels, {})
})
