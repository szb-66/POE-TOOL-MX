import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { PoeCnTradeClient } from '../electron/modules/priceCheck/client.js'
import { PriceCheckService } from '../electron/modules/priceCheck/service.js'
import { loadTradeCatalog } from '../electron/modules/priceCheck/catalog.js'

const longId = `H4sIAAAA${'query-opaque_'.repeat(30)}AQAA`
const json = value => ({ ok: true, status: 200, text: async () => JSON.stringify(value) })
const incompatible = error => error.code === 'API_INCOMPATIBLE'

test('查询编号在搜索、首批、翻页、分布和网页 URL 中保真', async () => {
  const { catalog, status } = await loadTradeCatalog(fileURLToPath(new URL('../electron/modules/priceCheck/catalog.json', import.meta.url)))
  for (const queryId of ['queryABC123', 'query-ABC123', 'query_ABC123', longId, 'a/b?c=d&x=+%#片段']) {
    const requests = [], opened = [], actions = []
    const ids = Array.from({ length: 25 }, (_, i) => `item${i}`)
    const client = new PoeCnTradeClient({ session: { fetch: async url => {
      requests.push(url)
      if (url.includes('/search/')) return json({ id: queryId, total: 25, result: ids })
      const batch = new URL(url).pathname.split('/').at(-1).split(',')
      return json({ result: batch.map(id => ({ id, item: { ilvl: 83 }, listing: { price: { amount: 1, currency: 'chaos' } } })) })
    } } })
    const service = new PriceCheckService({
      auth: { getStatus: () => ({ authenticated: true }), registerCacheClearer() {} },
      client, catalog, catalogStatus: status, distributionWait: async () => {},
      overlay: { create() {}, update() {}, preserveForExternalAction() { actions.push('preserve') }, close() { actions.push('close') } },
      shell: { openExternal: async url => { opened.push(url); actions.push('open') } }
    })
    service.updateRuntime({ enabled: true })
    await service.check({ league: 'S30赛季', text: '物品类别: 通货\n稀 有 度: 普通\n混沌石' })
    assert.equal(service.latest.result.listings.length, 10)
    await service.loadMore()
    assert.equal(service.latest.result.listings.length, 20)
    await service.loadDistribution()
    assert.equal(service.latest.result.distribution.fetched, 25)
    assert.equal(service.latest.result.distribution.complete, true)
    assert.equal(service.latest.result.queryId, queryId)
    assert.equal(requests.length, 4)
    for (const url of requests.slice(1)) {
      assert.equal(new URL(url).searchParams.get('query'), queryId)
      assert.equal(new URL(url).origin, 'https://poe.game.qq.com')
    }
    await service.openOfficial()
    assert.equal(opened[0], `https://poe.game.qq.com/trade/search/${encodeURIComponent('S30赛季')}/${encodeURIComponent(queryId)}`)
    assert.deepEqual(actions, ['preserve', 'open', 'close'])
  }
})

test('缺失或非法编号在搜索、fetch 和跳转中报错，不伪造空结果', async () => {
  for (const id of [undefined, null, '', '   ', 42, {}, '\uD800']) {
    let calls = 0
    const client = new PoeCnTradeClient({ session: { fetch: async () => { calls++; return json({ id, result: [] }) } } })
    await assert.rejects(client.search('S30', {}), incompatible)
    await assert.rejects(client.search('S30', {}), incompatible)
    assert.equal(calls, 2, '非法搜索响应不应缓存')
    await assert.rejects(client.fetch(id, ['abc']), incompatible)
    assert.equal(calls, 2, '非法编号不应发送挂单请求')
    await assert.rejects(PriceCheckService.prototype.openOfficial.call({ assertEnabled() {}, latest: { result: { queryId: id } } }), incompatible)
  }
})

test('非法结果结构或挂单 ID 显式报错，空数组不发送请求', async () => {
  for (const result of [null, undefined, true, 12, 'ids']) {
    const client = new PoeCnTradeClient({ session: { fetch: async () => json({ id: longId, result }) } })
    await assert.rejects(client.search('S30', {}), incompatible)
  }
  let calls = 0
  const client = new PoeCnTradeClient({ session: { fetch: async () => { calls++; return json({ result: {} }) } } })
  for (const ids of [null, 'abc', ['abc', 'bad-id'], [123]]) await assert.rejects(client.fetch(longId, ids), incompatible)
  assert.deepEqual(await client.fetch(longId, []), { result: [] })
  assert.equal(calls, 0)
  await assert.rejects(client.fetch(longId, ['abc']), incompatible)
})

test('真实零结果和对象结果兼容，打开浏览器失败不关闭浮窗', async () => {
  for (const result of [[], {}]) {
    const client = new PoeCnTradeClient({ session: { fetch: async () => json({ id: longId, total: 0, result }) } })
    assert.deepEqual((await client.search('S30', {})).result, result)
  }
  let closed = false
  await assert.rejects(PriceCheckService.prototype.openOfficial.call({
    assertEnabled() {}, latest: { league: 'S30', result: { queryId: longId } },
    shell: { openExternal: async () => { throw new Error('browser unavailable') } },
    closeOverlay() { closed = true }
  }), /browser unavailable/)
  assert.equal(closed, false)
})
