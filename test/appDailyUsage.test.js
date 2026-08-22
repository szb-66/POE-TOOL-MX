import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
  beijingDate,
  DailyUsageDateStore,
  DailyUsageError,
  DailyUsageService,
  millisecondsUntilNextBeijingReport
} from '../electron/modules/dailyUsage/service.js'

const config = {
  envId: 'usage-env',
  region: 'ap-shanghai',
  dailyUsageTable: 'app_daily_usage_report',
  publishableKey: 'publishable'
}
const initialTime = Date.parse('2026-08-22T10:00:00.000Z')

const flush = () => new Promise(resolve => setImmediate(resolve))

function response(status, payload = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload }
}

function memoryStore(value = null) {
  return {
    value,
    reads: 0,
    writes: [],
    async read() { this.reads += 1; return this.value },
    async write(next) { this.value = next; this.writes.push(next) }
  }
}

function schedulerHarness() {
  const timers = []
  const cleared = []
  return {
    scheduler: {
      setTimeout(callback, delay) {
        const timer = { callback, delay, unrefCalled: false, unref() { this.unrefCalled = true } }
        timers.push(timer)
        return timer
      },
      clearTimeout(timer) { cleared.push(timer) }
    },
    timers,
    cleared
  }
}

function serviceOptions(overrides = {}) {
  return {
    config,
    auth: { getSession: async () => ({ accessToken: 'session-token' }), invalidate() {} },
    appVersion: '1.2.0',
    runtimeMode: 'packaged',
    platform: 'win32',
    arch: 'x64',
    dateStore: memoryStore(),
    now: () => initialTime,
    fetchImpl: async () => response(201),
    ...overrides
  }
}

test('北京时间日期与下一次 00:05 调度不依赖系统时区', () => {
  assert.equal(beijingDate(Date.parse('2026-08-21T16:00:00.000Z')), '2026-08-22')
  assert.equal(
    millisecondsUntilNextBeijingReport(Date.parse('2026-08-22T10:00:00.000Z')),
    6 * 60 * 60_000 + 5 * 60_000
  )
})

test('成功日期状态可跨启动读取并以原子替换方式更新', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-daily-usage-date-'))
  const store = new DailyUsageDateStore({ userDataPath: root })
  assert.equal(await store.read(), null)
  await store.write('2026-08-22')
  assert.equal(await new DailyUsageDateStore({ userDataPath: root }).read(), '2026-08-22')
  await store.write('2026-08-23')
  assert.equal(await store.read(), '2026-08-23')
})

test('开发版在认证、网络和计时器之前短路', async () => {
  let authCalls = 0
  let requests = 0
  const harness = schedulerHarness()
  const service = new DailyUsageService(serviceOptions({
    runtimeMode: 'development',
    auth: { async getSession() { authCalls += 1 }, invalidate() {} },
    fetchImpl: async () => { requests += 1; return response(201) },
    scheduler: harness.scheduler
  }))

  assert.equal(service.start(), false)
  assert.equal(await service.report(), false)
  assert.equal(authCalls, 0)
  assert.equal(requests, 0)
  assert.equal(harness.timers.length, 0)
})

test('正式版当天首次启动只上报一次并持久化北京时间日期', async () => {
  const requests = []
  const store = memoryStore()
  const harness = schedulerHarness()
  const service = new DailyUsageService(serviceOptions({
    dateStore: store,
    scheduler: harness.scheduler,
    fetchImpl: async (...args) => { requests.push(args); return response(201) }
  }))

  assert.equal(service.start(), true)
  assert.equal(service.start(), true)
  await flush()
  await flush()
  assert.equal(requests.length, 1)
  assert.equal(store.value, '2026-08-22')
  assert.deepEqual(store.writes, ['2026-08-22'])
  assert.equal(requests[0][0], 'https://usage-env.api.tcloudbasegateway.com/v1/rdb/rest/app_daily_usage_report')
  assert.deepEqual(JSON.parse(requests[0][1].body), {
    app_version: '1.2.0', platform: 'win32', arch: 'x64', runtime_mode: 'packaged'
  })
  assert.equal(requests[0][1].headers.Authorization, 'Bearer session-token')
  assert.equal(harness.timers.length, 1)
})

test('当天重复启动先读取成功日期且不认证不请求', async () => {
  let authCalls = 0
  let requests = 0
  const store = memoryStore('2026-08-22')
  const service = new DailyUsageService(serviceOptions({
    dateStore: store,
    auth: { async getSession() { authCalls += 1 }, invalidate() {} },
    fetchImpl: async () => { requests += 1; return response(201) }
  }))

  service.start()
  await flush()
  assert.equal(store.reads, 1)
  assert.equal(authCalls, 0)
  assert.equal(requests, 0)
})

test('跨过北京时间零点后在 00:05 上报，休眠延迟执行仍补报当天', async () => {
  let now = Date.parse('2026-08-22T10:00:00.000Z')
  let requests = 0
  const harness = schedulerHarness()
  const service = new DailyUsageService(serviceOptions({
    now: () => now,
    dateStore: memoryStore('2026-08-22'),
    scheduler: harness.scheduler,
    fetchImpl: async () => { requests += 1; return response(201) }
  }))

  service.start()
  await flush()
  assert.equal(requests, 0)
  assert.equal(harness.timers[0].delay, 6 * 60 * 60_000 + 5 * 60_000)
  now = Date.parse('2026-08-22T18:00:00.000Z')
  harness.timers[0].callback()
  await flush()
  await flush()
  assert.equal(requests, 1)
  assert.equal(service.successfulDate, '2026-08-23')
})

test('失败当天只按 15 分钟、1 小时、6 小时重试三次', async () => {
  let requests = 0
  const harness = schedulerHarness()
  const service = new DailyUsageService(serviceOptions({
    scheduler: harness.scheduler,
    retryDelaysMs: [15 * 60_000, 60 * 60_000, 6 * 60 * 60_000],
    fetchImpl: async () => { requests += 1; return response(503, { code: 'DATABASE_BUSY' }) }
  }))

  service.start()
  await flush(); await flush()
  for (const expectedDelay of [15 * 60_000, 60 * 60_000, 6 * 60 * 60_000]) {
    const retry = harness.timers.find(timer => timer.delay === expectedDelay && !timer.fired)
    assert.ok(retry)
    retry.fired = true
    retry.callback()
    await flush(); await flush()
  }
  assert.equal(requests, 4)
  assert.equal(harness.timers.filter(timer => [15 * 60_000, 60 * 60_000, 6 * 60 * 60_000].includes(timer.delay)).length, 3)
})

test('北京时间跨日会清除前一天待执行重试并重置当天预算', async () => {
  let now = Date.parse('2026-08-22T15:55:00.000Z')
  const harness = schedulerHarness()
  const service = new DailyUsageService(serviceOptions({
    now: () => now,
    dateStore: memoryStore('2026-08-22'),
    scheduler: harness.scheduler,
    fetchImpl: async () => response(503)
  }))

  service.start()
  await flush()
  service.successfulDate = null
  await assert.rejects(service.report())
  service.scheduleRetry('2026-08-22')
  const oldRetry = harness.timers.find(timer => timer.delay === 15 * 60_000)
  const rollover = harness.timers.find(timer => timer.delay === 10 * 60_000)
  assert.ok(oldRetry)
  assert.ok(rollover)

  now = Date.parse('2026-08-22T16:05:00.000Z')
  rollover.callback()
  await flush(); await flush()
  assert.equal(harness.cleared.includes(oldRetry), true)
  const dailyRetries = harness.timers.filter(timer => timer !== oldRetry && timer.delay === 15 * 60_000)
  assert.equal(dailyRetries.length, 1)
})

test('401 在同一次尝试内重新认证且只重发一次', async () => {
  const sessionOptions = []
  let invalidated = 0
  let requests = 0
  const service = new DailyUsageService(serviceOptions({
    auth: {
      async getSession(options) { sessionOptions.push(options); return { accessToken: options?.force ? 'fresh' : 'old' } },
      invalidate() { invalidated += 1 }
    },
    fetchImpl: async () => (++requests === 1 ? response(401) : response(201))
  }))

  assert.equal(await service.report(), true)
  assert.equal(requests, 2)
  assert.equal(invalidated, 1)
  assert.deepEqual(sessionOptions, [undefined, { force: true }])
})

test('重叠请求合并，超时后释放进行中状态', async () => {
  let resolveFetch
  const service = new DailyUsageService(serviceOptions({
    fetchImpl: () => new Promise(resolve => { resolveFetch = resolve })
  }))
  const first = service.report()
  const second = service.report()
  assert.equal(first, second)
  await flush()
  resolveFetch(response(201))
  assert.equal(await first, true)

  let requests = 0
  const timeoutService = new DailyUsageService(serviceOptions({
    requestTimeoutMs: 5,
    fetchImpl: async () => { requests += 1; return new Promise(() => {}) }
  }))
  await assert.rejects(timeoutService.report(), error => error instanceof DailyUsageError && error.code === 'DAILY_USAGE_TIMEOUT')
  await assert.rejects(timeoutService.report(), error => error.code === 'DAILY_USAGE_TIMEOUT')
  assert.equal(requests, 2)
})

test('配置缺失不启动，退出清理跨日和重试计时器', async () => {
  const missingHarness = schedulerHarness()
  const missing = new DailyUsageService(serviceOptions({
    config: { ...config, dailyUsageTable: '' }, scheduler: missingHarness.scheduler
  }))
  assert.equal(missing.start(), false)
  assert.equal(missingHarness.timers.length, 0)

  const harness = schedulerHarness()
  const service = new DailyUsageService(serviceOptions({
    scheduler: harness.scheduler,
    fetchImpl: async () => response(500)
  }))
  service.start()
  await flush(); await flush()
  assert.equal(harness.timers.length, 2)
  service.stop()
  service.stop()
  assert.equal(harness.cleared.includes(harness.timers[0]), true)
  assert.equal(harness.cleared.includes(harness.timers[1]), true)
})
