import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isPoeCnAllowedUrl,
  requestPoeCnJson
} from '../electron/modules/chaosRecipe/http.js'
import { PoeCnAuthService } from '../electron/modules/chaosRecipe/auth.js'
import { PoeCnStashClient } from '../electron/modules/chaosRecipe/stashClient.js'

function fakeSession(fetchImpl) {
  const state = { cookies: [], cleared: 0, cacheCleared: 0 }
  return {
    state,
    fetch: fetchImpl,
    cookies: { set: async (cookie) => { state.cookies.push(cookie) } },
    clearStorageData: async () => { state.cleared += 1 },
    clearCache: async () => { state.cacheCleared += 1 }
  }
}

test('国服请求将登录页、401 和 429 转成结构化错误', async () => {
  await assert.rejects(
    requestPoeCnJson(fakeSession(async () => new Response('<title>流放之路</title>', { status: 200 })), 'https://poe.game.qq.com/api/profile'),
    { code: 'SESSION_EXPIRED' }
  )
  await assert.rejects(
    requestPoeCnJson(fakeSession(async () => new Response('{}', { status: 401 })), 'https://poe.game.qq.com/api/profile'),
    { code: 'SESSION_EXPIRED' }
  )
  await assert.rejects(
    requestPoeCnJson(fakeSession(async () => new Response('{}', {
      status: 429,
      headers: { 'retry-after': '17' }
    })), 'https://poe.game.qq.com/api/profile'),
    (error) => error.code === 'RATE_LIMITED' && error.details.retryAfter === 17
  )
})

test('国服仓库 GET 禁用 Chromium HTTP 缓存', async () => {
  let requestOptions
  const session = fakeSession(async (_url, options) => {
    requestOptions = options
    return new Response('{}', { status: 200 })
  })
  await requestPoeCnJson(session, 'https://poe.game.qq.com/api/profile')
  assert.equal(requestOptions.cache, 'no-store')
  assert.equal(requestOptions.headers['Cache-Control'], 'no-cache')
})

test('国服登录窗口 URL 仅允许 HTTPS 的腾讯登录相关域名', () => {
  assert.equal(isPoeCnAllowedUrl('https://poe.game.qq.com/login'), true)
  assert.equal(isPoeCnAllowedUrl('https://xui.ptlogin2.qq.com/cgi-bin/xlogin'), true)
  assert.equal(isPoeCnAllowedUrl('http://poe.game.qq.com/login'), false)
  assert.equal(isPoeCnAllowedUrl('https://qq.com.attacker.example/'), false)
})

test('手动 POESESSID 只写入独立 Session Cookie 并在验证失败后清除', async () => {
  const session = fakeSession(async () => new Response('{}', { status: 401 }))
  const auth = new PoeCnAuthService({ session, BrowserWindow: class {} })
  const secret = '0123456789abcdef0123456789abcdef'
  await assert.rejects(auth.setSessionToken(secret), { code: 'SESSION_EXPIRED' })
  assert.equal(session.state.cookies.length, 1)
  assert.equal(session.state.cookies[0].httpOnly, true)
  assert.equal(session.state.cookies[0].secure, true)
  assert.equal(JSON.stringify(auth.getStatus()).includes(secret), false)
  assert.equal(session.state.cleared, 1)
  assert.equal(session.state.cacheCleared, 1)
})

test('新版仓库不兼容时回退旧版并缓存 Provider', async () => {
  const calls = []
  const session = fakeSession(async (url) => {
    calls.push(String(url))
    if (String(url).includes('/api/stash/')) return new Response('{}', { status: 500 })
    return new Response(JSON.stringify({
      tabs: [{ n: '配方页', type: 'NormalStash', index: 2 }]
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  })
  const client = new PoeCnStashClient({
    session,
    getAuthStatus: () => ({ authenticated: true, accountName: '匿名账号' })
  })
  const first = await client.listTabs('测试赛季')
  const second = await client.listTabs('测试赛季')
  assert.equal(first[0].name, '配方页')
  assert.equal(second[0].supported, true)
  assert.equal(calls.filter((url) => url.includes('/api/stash/')).length, 1)
  assert.equal(calls.filter((url) => url.includes('get-stash-items')).length, 2)
})

test('客户端在 Retry-After 期间不继续请求', async () => {
  let calls = 0
  const session = fakeSession(async () => {
    calls += 1
    return new Response('{}', { status: 429, headers: { 'retry-after': '30' } })
  })
  const client = new PoeCnStashClient({
    session,
    getAuthStatus: () => ({ authenticated: true, accountName: '匿名账号' })
  })
  await assert.rejects(client.listLeagues(), { code: 'RATE_LIMITED' })
  await assert.rejects(client.listLeagues(), { code: 'RATE_LIMITED' })
  assert.equal(calls, 1)
})

test('新版仓库子页使用父页和子页双 ID 请求详情', async () => {
  const calls = []
  const session = fakeSession(async (url) => {
    calls.push(String(url))
    if (calls.length === 1) {
      return new Response(JSON.stringify({
        stashes: [{
          id: 'parent-id',
          name: '文件夹',
          type: 'Folder',
          children: [{ id: 'child-id', name: '2', type: 'NormalStash' }]
        }]
      }), { status: 200 })
    }
    return new Response(JSON.stringify({
      stash: {
        id: 'parent-id',
        children: [{ id: 'child-id', items: [] }]
      }
    }), { status: 200 })
  })
  const client = new PoeCnStashClient({
    session,
    getAuthStatus: () => ({ authenticated: true, accountName: '匿名账号' })
  })

  const tabs = await client.listTabs('S29先祖再临')
  const child = tabs.find((tab) => tab.id === 'child-id')
  await client.fetchTab('S29先祖再临', child)

  assert.equal(child.parent, 'parent-id')
  assert.match(calls[1], /\/api\/stash\/S29%E5%85%88%E7%A5%96%E5%86%8D%E4%B8%B4\/parent-id\/child-id$/)
})

test('新版详情少量且无装备时对照旧版并选择物品更多的响应', async () => {
  const calls = []
  const item = (id, category = '') => ({
    id,
    x: 0,
    y: 0,
    ilvl: 70,
    frameType: 2,
    identified: false,
    category
  })
  const session = fakeSession(async (url) => {
    calls.push(String(url))
    if (calls.length === 1) {
      return new Response(JSON.stringify({
        stashes: [{ id: 'tab-2', name: '2', type: 'NormalStash', index: 22 }]
      }), { status: 200 })
    }
    if (String(url).includes('/api/stash/')) {
      return new Response(JSON.stringify({
        stash: { items: [item('a'), item('b'), item('c')] }
      }), { status: 200 })
    }
    return new Response(JSON.stringify({
      items: [item('r1', 'Ring'), item('r2', 'Ring'), item('r3', 'Ring'), item('r4', 'Ring')]
    }), { status: 200 })
  })
  const client = new PoeCnStashClient({
    session,
    getAuthStatus: () => ({ authenticated: true, accountName: '匿名账号' })
  })
  const [tab] = await client.listTabs('S29先祖再临')
  const result = await client.fetchTab('S29先祖再临', tab)

  assert.equal(result.items.length, 4)
  assert.equal(result.diagnostics.provider, 'legacy-fallback')
  assert.deepEqual(result.diagnostics.comparedProviders, {
    modernItemCount: 3,
    legacyItemCount: 4
  })
  assert.equal(calls.filter((url) => url.includes('get-stash-items')).length, 1)
})
