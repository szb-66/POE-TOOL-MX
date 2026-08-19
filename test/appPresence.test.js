import test from 'node:test'
import assert from 'node:assert/strict'
import { AppPresenceError, AppPresenceService } from '../electron/modules/presence/service.js'

const config = {
  envId: 'presence-env',
  region: 'ap-shanghai',
  presenceTable: 'app_presence_heartbeat',
  publishableKey: 'publishable'
}

const tick = () => new Promise(resolve => setImmediate(resolve))

function response(status, payload = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  }
}

function schedulerHarness() {
  const intervals = []
  const cleared = []
  let unrefCount = 0
  return {
    scheduler: {
      setInterval(callback, delay) {
        const timer = { callback, delay, unref: () => { unrefCount += 1 } }
        intervals.push(timer)
        return timer
      },
      clearInterval(timer) { cleared.push(timer) }
    },
    intervals,
    cleared,
    get unrefCount() { return unrefCount }
  }
}

test('在线心跳立即上报并按60秒周期运行且停止时清理计时器', async () => {
  const requests = []
  const harness = schedulerHarness()
  const service = new AppPresenceService({
    config,
    auth: { getSession: async () => ({ accessToken: 'session-token' }), invalidate() {} },
    appVersion: '1.0.5',
    runtimeMode: 'development',
    platform: 'win32',
    arch: 'x64',
    fetchImpl: async (...args) => { requests.push(args); return response(201) },
    scheduler: harness.scheduler
  })

  assert.equal(service.start(), true)
  assert.equal(service.start(), true)
  await tick()
  assert.equal(requests.length, 1)
  assert.equal(harness.intervals.length, 1)
  assert.equal(harness.intervals[0].delay, 60_000)
  assert.equal(harness.unrefCount, 1)
  assert.equal(requests[0][0], 'https://presence-env.api.tcloudbasegateway.com/v1/rdb/rest/app_presence_heartbeat')
  assert.deepEqual(JSON.parse(requests[0][1].body), {
    app_version: '1.0.5',
    platform: 'win32',
    arch: 'x64',
    runtime_mode: 'development'
  })
  assert.equal(requests[0][1].headers.Authorization, 'Bearer session-token')
  assert.equal(requests[0][1].headers.Prefer, 'return=minimal')

  harness.intervals[0].callback()
  await tick()
  assert.equal(requests.length, 2)

  service.stop()
  service.stop()
  assert.deepEqual(harness.cleared, [harness.intervals[0]])
})

test('在线心跳合并重叠请求并映射正式版运行模式', async () => {
  let resolveFetch
  let requestCount = 0
  let requestBody
  const service = new AppPresenceService({
    config,
    auth: { getSession: async () => ({ accessToken: 'token' }), invalidate() {} },
    appVersion: '2.0.0',
    runtimeMode: 'packaged',
    platform: 'win32',
    arch: 'x64',
    fetchImpl: async (_url, options) => {
      requestCount += 1
      requestBody = JSON.parse(options.body)
      return new Promise(resolve => { resolveFetch = resolve })
    }
  })

  const first = service.report()
  const second = service.report()
  assert.equal(first, second)
  await tick()
  assert.equal(requestCount, 1)
  resolveFetch(response(201))
  assert.equal(await first, true)
  assert.deepEqual(requestBody, {
    app_version: '2.0.0',
    platform: 'win32',
    arch: 'x64',
    runtime_mode: 'packaged'
  })
})

test('在线心跳遇到401时重新认证并只重试一次', async () => {
  const sessionOptions = []
  let invalidated = 0
  let requests = 0
  const auth = {
    async getSession(options) {
      sessionOptions.push(options)
      return { accessToken: options?.force ? 'refreshed' : 'initial' }
    },
    invalidate() { invalidated += 1 }
  }
  const service = new AppPresenceService({
    config,
    auth,
    appVersion: '1.0.5',
    runtimeMode: 'development',
    fetchImpl: async () => {
      requests += 1
      return requests === 1 ? response(401, { code: 'UNAUTHORIZED' }) : response(201)
    }
  })

  assert.equal(await service.report(), true)
  assert.equal(requests, 2)
  assert.equal(invalidated, 1)
  assert.deepEqual(sessionOptions, [undefined, { force: true }])
})

test('在线心跳连续未授权时只发送两次请求', async () => {
  let requests = 0
  const service = new AppPresenceService({
    config,
    auth: {
      getSession: async () => ({ accessToken: 'token' }),
      invalidate() {}
    },
    appVersion: '1.0.5',
    runtimeMode: 'development',
    fetchImpl: async () => {
      requests += 1
      return response(401, { code: 'UNAUTHORIZED' })
    }
  })

  await assert.rejects(service.report(), error => {
    assert.equal(error instanceof AppPresenceError, true)
    assert.equal(error.status, 401)
    return true
  })
  assert.equal(requests, 2)
})

test('在线心跳错误不泄露服务端内容且定时调度吞并失败', async () => {
  const harness = schedulerHarness()
  const service = new AppPresenceService({
    config,
    auth: { getSession: async () => ({ accessToken: 'token' }), invalidate() {} },
    appVersion: '1.0.5',
    runtimeMode: 'development',
    fetchImpl: async () => response(500, { code: 'DATABASE_FAILED', message: 'secret detail' }),
    scheduler: harness.scheduler
  })

  await assert.rejects(service.report(), error => {
    assert.equal(error instanceof AppPresenceError, true)
    assert.equal(error.code, 'DATABASE_FAILED')
    assert.equal(error.status, 500)
    assert.doesNotMatch(error.message, /secret detail/)
    return true
  })

  assert.equal(service.start(), true)
  await tick()
  assert.equal(harness.intervals.length, 1)
  service.stop()
})

test('CloudBase在线配置缺失时不启动请求或计时器', async () => {
  const harness = schedulerHarness()
  let requests = 0
  const service = new AppPresenceService({
    config: { ...config, presenceTable: '' },
    auth: { getSession: async () => ({ accessToken: 'token' }), invalidate() {} },
    appVersion: '1.0.5',
    runtimeMode: 'development',
    fetchImpl: async () => { requests += 1; return response(201) },
    scheduler: harness.scheduler
  })

  assert.equal(service.start(), false)
  assert.equal(await service.report(), false)
  assert.equal(requests, 0)
  assert.equal(harness.intervals.length, 0)
})

test('在线心跳超时后释放进行中状态并允许下一周期重试', async () => {
  let requests = 0
  const service = new AppPresenceService({
    config,
    auth: { getSession: async () => ({ accessToken: 'token' }), invalidate() {} },
    appVersion: '1.0.5',
    runtimeMode: 'development',
    requestTimeoutMs: 10,
    fetchImpl: async () => {
      requests += 1
      return new Promise(() => {})
    }
  })

  await assert.rejects(service.report(), error => error?.code === 'PRESENCE_TIMEOUT')
  await assert.rejects(service.report(), error => error?.code === 'PRESENCE_TIMEOUT')
  assert.equal(requests, 2)
})
