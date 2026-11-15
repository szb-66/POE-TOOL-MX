import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { DailyUsageService } from '../electron/modules/dailyUsage/service.js'

test('本机 HTTP 日活接口仅发送应用元数据并拒绝重定向', async t => {
  const requests = []
  const server = createServer(async (request, response) => {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    requests.push({ url: request.url, headers: request.headers, body: JSON.parse(Buffer.concat(chunks)) })
    response.writeHead(200, { 'Content-Type': 'application/json' }); response.end('{}')
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const service = new DailyUsageService({
    config: { baseUrl: 'http://127.0.0.1:' + server.address().port, allowLoopbackHttp: true },
    auth: { getSession: async () => ({ accessToken: 'private-token' }), invalidate() {} },
    runtimeMode: 'packaged', appVersion: 'test', dateStore: { async read() { return null }, async write() {} }
  })
  await Promise.all([service.report(), service.report()])
  assert.equal(requests.length, 1)
  assert.equal(requests[0].url, '/api/client/v1/usage')
  assert.equal(requests[0].headers.authorization, 'Bearer private-token')
  assert.deepEqual(Object.keys(requests[0].body).sort(), ['app_version', 'arch', 'platform', 'runtime_mode'])
})
