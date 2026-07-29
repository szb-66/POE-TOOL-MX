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

const jsonResponse = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { 'content-type': 'application/json' }
})

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

test('仓库页列表始终使用旧接口且每次重新请求', async () => {
  const calls = []
  const session = fakeSession(async (url) => {
    calls.push(String(url))
    return jsonResponse({ tabs: [{ id: 'tab-2', n: '配方页', type: 'NormalStash', index: 2 }] })
  })
  const client = new PoeCnStashClient({
    session,
    getAuthStatus: () => ({ authenticated: true, accountName: '匿名账号' })
  })

  const first = await client.listTabs('测试赛季')
  const second = await client.listTabs('测试赛季')

  assert.equal(first[0].name, '配方页')
  assert.equal(second[0].supported, true)
  assert.equal(calls.filter((url) => url.includes('/api/stash/')).length, 0)
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

test('仓库页详情只使用旧接口并保留物品数据', async () => {
  const calls = []
  const item = (id) => ({
    id, x: 0, y: 0, ilvl: 70, frameType: 2, identified: false, category: 'Ring'
  })
  const session = fakeSession(async (url) => {
    calls.push(String(url))
    if (String(url).includes('tabs=1')) {
      return jsonResponse({ tabs: [{ id: 'tab-2', n: '2', type: 'NormalStash', index: 22 }] })
    }
    return jsonResponse({ items: [item('r1'), item('r2')] })
  })
  const client = new PoeCnStashClient({
    session,
    getAuthStatus: () => ({ authenticated: true, accountName: '匿名账号' })
  })

  const [tab] = await client.listTabs('S29先祖再临')
  const result = await client.fetchTab('S29先祖再临', tab)

  assert.equal(result.items.length, 2)
  assert.equal(result.diagnostics.provider, 'legacy')
  assert.equal(calls.filter((url) => url.includes('/api/stash/')).length, 0)
})

test('刷新仓库物品前重新加载列表并使用最新仓库页名称', async () => {
  let listCount = 0
  const item = { id: 'r1', x: 0, y: 0, ilvl: 70, frameType: 2, identified: false, category: 'Ring' }
  const session = fakeSession(async (url) => {
    if (String(url).includes('tabs=1')) {
      listCount += 1
      return jsonResponse({
        tabs: [{
          id: 'tab-2',
          n: listCount === 1 ? '很久以前的名称' : '当前名称',
          type: 'NormalStash',
          index: 22
        }]
      })
    }
    return jsonResponse({ items: [item] })
  })
  const client = new PoeCnStashClient({
    session,
    getAuthStatus: () => ({ authenticated: true, accountName: '匿名账号' })
  })

  await client.listTabs('S29先祖再临')
  const [result] = await client.fetchTabs('S29先祖再临', ['tab-2'])

  assert.equal(result.tab.name, '当前名称')
  assert.equal(listCount, 2)
})

test('清缓存会清除仓库页和账号归属', () => {
  const client = new PoeCnStashClient({
    session: fakeSession(async () => new Response('{}', { status: 200 })),
    getAuthStatus: () => ({ authenticated: true, accountName: '匿名账号' })
  })
  client.tabsByLeague.set('S29先祖再临', [])
  client.cacheAccountName = '匿名账号'

  client.clearCache()

  assert.equal(client.tabsByLeague.size, 0)
  assert.equal(client.cacheAccountName, '')
})

test('账号变化时不复用上一账号的仓库缓存', async () => {
  let accountName = '旧账号'
  let calls = 0
  const client = new PoeCnStashClient({
    session: fakeSession(async () => {
      calls += 1
      return jsonResponse({
        tabs: [{ id: 'tab-2', n: accountName, type: 'NormalStash', index: 2 }]
      })
    }),
    getAuthStatus: () => ({ authenticated: true, accountName })
  })

  await client.listTabs('S29先祖再临')
  accountName = '新账号'
  const tabs = await client.listTabs('S29先祖再临')

  assert.equal(tabs[0].name, '新账号')
  assert.equal(calls, 2)
})

test('共享认证登出会同步清除各功能缓存', async () => {
  const session = fakeSession(async () => jsonResponse({ profile: { name: '测试账号' } }))
  const auth = new PoeCnAuthService({ session, BrowserWindow: class {} })
  let clears = 0
  const unregister = auth.registerCacheClearer(() => { clears += 1 })
  auth.registerCacheClearer(() => { clears += 10 })

  await auth.validate()
  await auth.logout()
  assert.equal(clears, 11)

  unregister()
  await auth.logout()
  assert.equal(clears, 21)
})
