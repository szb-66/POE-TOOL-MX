import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { createServer as _m0_createServer } from 'node:http'
import { DailyUsageService as _m0_DailyUsageService } from '../electron/modules/dailyUsage/service.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { mkdtemp as _m1_mkdtemp, rm as _m1_rm, mkdir as _m1_mkdir, writeFile as _m1_writeFile } from 'node:fs/promises'
import _m1_os from 'node:os'
import _m1_path from 'node:path'
import { beijingDate as _m1_beijingDate, DailyUsageDateStore as _m1_DailyUsageDateStore, DailyUsageError as _m1_DailyUsageError, DailyUsageService as _m1_DailyUsageService, millisecondsUntilNextBeijingReport as _m1_millisecondsUntilNextBeijingReport } from '../electron/modules/dailyUsage/service.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import { readFileSync as _m2_readFileSync } from 'node:fs'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { readFileSync as _m3_readFileSync } from 'node:fs'
import { LoadingFeedbackCoordinator as _m3_LoadingFeedbackCoordinator } from '../electron/modules/loadingFeedback/coordinator.js'
import { loadingFeedbackBounds as _m3_loadingFeedbackBounds } from '../electron/modules/loadingFeedback/overlay.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import { createHash as _m4_createHash } from 'node:crypto'
import { readFileSync as _m4_readFileSync } from 'node:fs'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { mkdtemp as _m5_mkdtemp, readFile as _m5_readFile, rm as _m5_rm, writeFile as _m5_writeFile } from 'node:fs/promises'
import _m5_os from 'node:os'
import _m5_path from 'node:path'
import { FeedbackAuthClient as _m5_FeedbackAuthClient } from '../electron/modules/feedback/auth.js'
import { feedbackBaseUrl as _m5_feedbackBaseUrl, feedbackAttachmentUrl as _m5_feedbackAttachmentUrl, FEEDBACK_CONFIG as _m5_FEEDBACK_CONFIG } from '../electron/modules/feedback/config.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { createServer as _m6_createServer } from 'node:http'
import { randomUUID as _m6_randomUUID } from 'node:crypto'
import { mkdtemp as _m6_mkdtemp, rm as _m6_rm, writeFile as _m6_writeFile } from 'node:fs/promises'
import _m6_os from 'node:os'
import _m6_path from 'node:path'
import { FeedbackAuthClient as _m6_FeedbackAuthClient } from '../electron/modules/feedback/auth.js'
import { FeedbackCloudClient as _m6_FeedbackCloudClient } from '../electron/modules/feedback/cloudClient.js'
import { FeedbackService as _m6_FeedbackService } from '../electron/modules/feedback/service.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import { FeedbackCloudClient as _m7_FeedbackCloudClient } from '../electron/modules/feedback/cloudClient.js'
import { safeCloudError as _m7_safeCloudError } from '../electron/modules/feedback/auth.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { readFileSync as _m8_readFileSync, readdirSync as _m8_readdirSync } from 'node:fs'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { readFileSync as _m9_readFileSync } from 'node:fs'
import _m10_test from 'node:test'
import _m10_assert from 'node:assert/strict'
import { mkdtemp as _m10_mkdtemp, writeFile as _m10_writeFile, rm as _m10_rm } from 'node:fs/promises'
import _m10_os from 'node:os'
import _m10_path from 'node:path'
import { FeedbackService as _m10_FeedbackService } from '../electron/modules/feedback/service.js'
import _m11_test from 'node:test'
import _m11_assert from 'node:assert/strict'
import { submitFeedbackWithDiagnostics as _m11_submitFeedbackWithDiagnostics } from '../electron/modules/feedback/submission.js'
import _m12_test from 'node:test'
import _m12_assert from 'node:assert/strict'
import { readFileSync as _m12_readFileSync } from 'node:fs'
import { getRendererDiagnosticContext as _m12_getRendererDiagnosticContext, setRendererDiagnosticContext as _m12_setRendererDiagnosticContext } from '../src/utils/diagnosticContext.js'
import _m13_test from 'node:test'
import _m13_assert from 'node:assert/strict'
import { assemblePuzzleEvidenceAttachments as _m13_assemblePuzzleEvidenceAttachments } from '../electron/modules/feedback/evidenceAttachments.js'

// === Merged from appDailyUsage.integration.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const createServer = _m0_createServer
  const DailyUsageService = _m0_DailyUsageService
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
})()

// === Merged from appDailyUsage.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const mkdtemp = _m1_mkdtemp
  const rm = _m1_rm
  const mkdir = _m1_mkdir
  const writeFile = _m1_writeFile
  const os = _m1_os
  const path = _m1_path
  const beijingDate = _m1_beijingDate
  const DailyUsageDateStore = _m1_DailyUsageDateStore
  const DailyUsageError = _m1_DailyUsageError
  const DailyUsageService = _m1_DailyUsageService
  const millisecondsUntilNextBeijingReport = _m1_millisecondsUntilNextBeijingReport
const config = { baseUrl: 'https://feedback.example.test' }

const initialTime = Date.parse('2026-08-22T10:00:00.000Z')

const flush = () => new Promise(resolve => setImmediate(resolve))

test('旧云端当天成功标记不会跳过新服务首次上报', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-daily-usage-migration-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(path.join(root, 'feedback'))
  await writeFile(path.join(root, 'feedback', 'daily-usage-date'), '2026-11-11\n')
  const store = new DailyUsageDateStore({ userDataPath: root })
  assert.equal(await store.read(), null)
  await store.write('2026-11-11')
  assert.equal(await store.read(), '2026-11-11')
})

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

test('成功日期状态可跨启动读取并以原子替换方式更新', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-daily-usage-date-'))
  t.after(() => rm(root, { recursive: true, force: true }))
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
  assert.equal(requests[0][0], 'https://feedback.example.test/api/client/v1/usage')
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
    config: { ...config, baseUrl: '' }, scheduler: missingHarness.scheduler
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
})()

// === Merged from appDailyUsagePolicies.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const readFileSync = _m2_readFileSync
const migration = readFileSync(
  new URL('../cloudbase/migrations/20260822140000_replace_presence_with_daily_usage.sql', import.meta.url),
  'utf8'
)
const service = readFileSync(new URL('../electron/modules/dailyUsage/service.js', import.meta.url), 'utf8')
const main = readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8')
const preload = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')

test('迁移原地重命名在线记录并保留安装级主键数据', () => {
  assert.match(migration, /ALTER TABLE public\.app_presence RENAME TO app_daily_usage/)
  assert.match(migration, /RENAME COLUMN first_seen_at TO first_used_at/)
  assert.match(migration, /RENAME COLUMN last_seen_at TO last_used_at/)
  assert.doesNotMatch(migration, /DROP TABLE/)
  assert.match(migration, /Rollback \(emergency only/)
})

test('每日入口只允许匿名插入且基础表和汇总均不可匿名读取', () => {
  assert.match(migration, /CREATE VIEW public\.app_daily_usage_report/)
  assert.match(migration, /REVOKE ALL ON public\.app_daily_usage FROM anon/)
  assert.match(migration, /REVOKE ALL ON public\.app_daily_usage_report FROM anon/)
  assert.match(migration, /GRANT INSERT ON public\.app_daily_usage_report TO anon/)
  assert.match(migration, /REVOKE ALL ON public\.app_daily_usage_summary FROM anon/)
  assert.doesNotMatch(migration, /GRANT (SELECT|UPDATE|DELETE).*app_daily_usage_report TO anon/)
})

test('触发器拒绝开发版并强制认证 UID、服务端时间和 upsert', () => {
  assert.match(migration, /SECURITY DEFINER/)
  assert.match(migration, /SET search_path = pg_catalog/)
  assert.match(migration, /request_uid text := auth\.uid\(\)/)
  assert.match(migration, /request_uid = 'anon'/)
  assert.match(migration, /NEW\.runtime_mode <> 'packaged'/)
  assert.match(migration, /report_time timestamptz := statement_timestamp\(\)/)
  assert.match(migration, /ON CONFLICT \(installation_uid\) DO UPDATE SET/)
  assert.doesNotMatch(migration, /NEW\.(installation_uid|first_used_at|last_used_at|schema_version)/)
})

test('汇总仅统计北京时间当天正式版去重安装', () => {
  assert.match(migration, /CREATE VIEW public\.app_daily_usage_summary/)
  assert.match(migration, /AT TIME ZONE 'Asia\/Shanghai'/)
  assert.match(migration, /WHERE runtime_mode = 'packaged'/)
  assert.match(migration, /count\(\*\)::bigint AS usage_count/)
  assert.match(migration, /last_used_at >= date_trunc\('day', statement_timestamp\(\), 'Asia\/Shanghai'\)/)
  assert.match(migration, /last_used_at < date_trunc\('day', statement_timestamp\(\), 'Asia\/Shanghai'\) \+ interval '1 day'/)
  assert.doesNotMatch(migration, /\(last_used_at AT TIME ZONE/)
  assert.doesNotMatch(migration, /interval '3 minutes'/)
})

test('客户端请求不包含 UID 或时间且开发版由主进程和服务双重短路', () => {
  assert.match(service, /feedbackApiUrl\(this\.config, '\/usage'\)/)
  assert.match(service, /redirect: 'error'/)
  assert.match(service, /runtime_mode: 'packaged'/)
  assert.doesNotMatch(service, /installation_uid:/)
  assert.doesNotMatch(service, /first_used_at:/)
  assert.doesNotMatch(service, /last_used_at:/)
  assert.match(service, /this\.runtimeMode !== 'packaged'/)
  assert.match(main, /if \(app\.isPackaged\) \{[\s\S]*new DailyUsageService/)
})

test('每日服务只接入主进程生命周期且窗口创建不等待网络', () => {
  const startIndex = main.indexOf('dailyUsageService?.start()')
  const windowIndex = main.indexOf('createApplicationWindow()', startIndex)
  assert.ok(startIndex >= 0)
  assert.ok(windowIndex > startIndex)
  assert.doesNotMatch(main.slice(startIndex, windowIndex), /await\s+dailyUsageService/)
  assert.match(main, /\(\) => dailyUsageService\?\.stop\(\)/)
  assert.doesNotMatch(preload, /daily.?usage|presence|heartbeat/i)
})
})()

// === Merged from contextLoadingFeedback.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const readFileSync = _m3_readFileSync
  const LoadingFeedbackCoordinator = _m3_LoadingFeedbackCoordinator
  const loadingFeedbackBounds = _m3_loadingFeedbackBounds
const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

function fakeClock() {
  let now = 0
  let sequence = 0
  const timers = new Map()
  return {
    now: () => now,
    setTimer(callback, delay) {
      const id = ++sequence
      timers.set(id, { callback, due: now + delay })
      return id
    },
    clearTimer(id) {
      timers.delete(id)
    },
    advance(milliseconds) {
      const target = now + milliseconds
      while (true) {
        const next = [...timers.entries()]
          .filter(([, timer]) => timer.due <= target)
          .sort((left, right) => left[1].due - right[1].due || left[0] - right[0])[0]
        if (!next) break
        timers.delete(next[0])
        now = next[1].due
        next[1].callback()
      }
      now = target
    }
  }
}

function createCoordinator() {
  const clock = fakeClock()
  const app = []
  const game = []
  const coordinator = new LoadingFeedbackCoordinator({
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    publishApp: snapshot => app.push(structuredClone(snapshot)),
    publishGame: (snapshot, bounds) => game.push({ snapshot: structuredClone(snapshot), bounds })
  })
  return { clock, app, game, coordinator }
}

test('短操作不会闪烁，长操作延迟出现并满足最短展示时长', () => {
  const fast = createCoordinator()
  fast.coordinator.setForeground({ kind: 'app' })
  const fastToken = fast.coordinator.begin('crafting.initialize')
  fast.clock.advance(299)
  assert.equal(fast.coordinator.getSnapshot('app').visible, false)
  assert.equal(fast.coordinator.finish(fastToken), true)
  fast.clock.advance(1)
  assert.equal(fast.coordinator.getSnapshot('app').visible, false)

  const slow = createCoordinator()
  slow.coordinator.setForeground({ kind: 'app' })
  const slowToken = slow.coordinator.begin('crafting.initialize')
  slow.clock.advance(300)
  assert.equal(slow.coordinator.getSnapshot('app').visible, true)
  slow.coordinator.update(slowToken, { stage: 'bases', current: 2, total: 5 })
  assert.deepEqual(slow.coordinator.getSnapshot('app'), {
    visible: true,
    target: 'app',
    label: '正在加载底材数据',
    current: 2,
    total: 5,
    activeCount: 1
  })
  slow.coordinator.finish(slowToken)
  slow.clock.advance(399)
  assert.equal(slow.coordinator.getSnapshot('app').visible, true)
  slow.clock.advance(1)
  assert.equal(slow.coordinator.getSnapshot('app').visible, false)
  assert.equal(slow.coordinator.finish(slowToken), false)
})

test('已有业务反馈真实显示后可立即交接且不受最短展示时长阻塞', () => {
  const { clock, coordinator } = createCoordinator()
  coordinator.setForeground({ kind: 'game', gameBounds: { left: 0, top: 0, right: 1920, bottom: 1080 } })
  const token = coordinator.begin('faustus.start')
  clock.advance(300)
  assert.equal(coordinator.getSnapshot('game').visible, true)
  assert.equal(coordinator.handoff(token), true)
  assert.equal(coordinator.getSnapshot('game').visible, false)
})

test('反馈固定在业务声明的目标窗口，其他窗口聚焦时立即隐藏', () => {
  const { clock, coordinator } = createCoordinator()
  const bounds = { left: 100, top: 50, right: 1700, bottom: 950 }
  coordinator.setForeground({ kind: 'app' })
  coordinator.begin('stash-pickup.start')
  clock.advance(300)
  assert.equal(coordinator.getSnapshot('app').visible, false)
  assert.equal(coordinator.getSnapshot('game').visible, false)

  coordinator.setForeground({ kind: 'game', gameBounds: bounds })
  assert.equal(coordinator.getSnapshot('game').visible, true)
  coordinator.setForeground({ kind: 'other' })
  assert.equal(coordinator.getSnapshot('game').visible, false)
  coordinator.setForeground({ kind: 'game', gameBounds: bounds })
  assert.equal(coordinator.getSnapshot('game').visible, true)
})

test('并发操作只展示最新最高优先级任务并报告活动数量', () => {
  const { clock, coordinator } = createCoordinator()
  coordinator.setForeground({ kind: 'game', gameBounds: { left: 0, top: 0, right: 1920, bottom: 1080 } })
  coordinator.begin('stash-pickup.preview')
  const newest = coordinator.begin('stash-pickup.start')
  clock.advance(300)
  assert.equal(coordinator.getSnapshot('game').label, '正在准备仓库自动取件')
  assert.equal(coordinator.getSnapshot('game').activeCount, 2)
  coordinator.finish(newest)
  assert.equal(coordinator.getSnapshot('game').activeCount, 1)
})

test('renderer 只能登记白名单中的应用内操作，且只能结束自己的令牌', () => {
  const { coordinator } = createCoordinator()
  const token = coordinator.beginFromRenderer('crafting.initialize', 'renderer:1')
  assert.ok(token)
  assert.equal(coordinator.beginFromRenderer('stash-pickup.start', 'renderer:1'), null)
  assert.equal(coordinator.beginFromRenderer('unknown', 'renderer:1'), null)
  assert.equal(coordinator.finishOwned(token, 'renderer:2'), false)
  assert.equal(coordinator.finishOwned(token, 'renderer:1'), true)
})

test('游戏加载条按物理窗口边界转换 DPI 后置于顶部中央', () => {
  const screenApi = {
    screenToDipRect: (_window, rectangle) => ({
      x: rectangle.x / 2,
      y: rectangle.y / 2,
      width: rectangle.width / 2,
      height: rectangle.height / 2
    })
  }
  assert.deepEqual(loadingFeedbackBounds(
    { left: 100, top: 50, right: 1700, bottom: 950 },
    screenApi,
    'win32'
  ), { x: 220, y: 49, width: 460, height: 68 })
})

test('加载反馈契约保持受控、不可聚焦且不暴露敏感窗口信息', () => {
  const catalog = source('shared/loadingFeedback.js')
  const overlay = source('electron/modules/loadingFeedback/overlay.js')
  const preload = source('electron/preload.cjs')
  const component = source('src/components/common/ContextLoadingFeedback.vue')
  const watcher = source('src/assets/scripts/foreground_watcher.py')
  const main = source('electron/main.js')

  for (const operationId of [
    'crafting.initialize', 'stash-pickup.preview', 'stash-pickup.start',
    'junfeng.preview', 'junfeng.start', 'batch-inventory.scan',
    'faustus.start', 'puzzle.analysis', 'puzzle.border'
  ]) assert.match(catalog, new RegExp(operationId.replace('.', '\\.')))
  assert.match(overlay, /focusable: false/)
  assert.match(overlay, /setIgnoreMouseEvents\(true/)
  assert.match(overlay, /showInactive\(\)/)
  assert.match(component, /aria-live="polite"/)
  assert.match(component, /prefers-reduced-motion: reduce/)
  assert.match(preload, /beginLoadingFeedback/)
  const loadingBridge = preload.split(/\r?\n/).filter(line => line.includes('LoadingFeedback')).join('\n')
  assert.doesNotMatch(loadingBridge, /gameBounds|windowHandle|processName/)
  assert.match(watcher, /bounds=bounds/)
  assert.match(main, /main\.isFocused\(\)/)
})

test('游戏准备反馈在确认激活后才开始延迟计时', () => {
  const cases = [
    ['electron/modules/stashPickup/manager.js', "activateGame({ source: 'stash-pickup-preview' })", 'stash-pickup.preview'],
    ['electron/modules/stashPickup/manager.js', "activateGame({ source: 'stash-pickup-start' })", 'stash-pickup.start'],
    ['electron/modules/junfeng/manager.js', "activateGame({ source: 'junfeng-preview' })", 'junfeng.preview'],
    ['electron/modules/junfeng/manager.js', "activateGame({ source: 'junfeng-pickup-start' })", 'junfeng.start'],
    ['electron/modules/puzzle/service.js', "activateGame({ source: 'puzzle-border-probe' })", 'puzzle.border'],
    ['electron/modules/puzzle/service.js', "activateGame({ source: 'puzzle-analysis' })", 'puzzle.analysis'],
    ['electron/modules/ipc/bag.js', "activateGameWindow('batch-inventory-scan')", 'batch-inventory.scan']
  ]
  for (const [file, activationNeedle, operationId] of cases) {
    const content = source(file)
    const activationIndex = content.indexOf(activationNeedle)
    const feedbackIndex = content.indexOf(`'${operationId}'`)
    assert.ok(activationIndex >= 0, `${file} 缺少激活入口 ${activationNeedle}`)
    assert.ok(feedbackIndex > activationIndex, `${file} 的 ${operationId} 必须在游戏激活后登记`)
  }
})
})()

// === Merged from dailyUsageTrendMigration.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const createHash = _m4_createHash
  const readFileSync = _m4_readFileSync
const migration = readFileSync(
  new URL('../cloudbase/migrations/20260826160000_add_daily_usage_trend.sql', import.meta.url),
  'utf8'
).replace(/\r\n?/g, '\n')
const expectedSha256 = '20cd85bfd555d3802b4c37fb15585523225865e949c5ab89ec0e4cb4ac85ccbd'

test('每日趋势迁移副本使用固定 SHA-256', () => {
  assert.equal(createHash('sha256').update(migration).digest('hex'), expectedSha256)
})

test('每日汇总只保存日期、总数和更新时间并从迁移日开始', () => {
  const table = migration.match(/CREATE TABLE public\.app_daily_usage_totals \(([\s\S]*?)\);/)?.[1] || ''
  const seed = migration.match(/INSERT INTO public\.app_daily_usage_totals \(usage_date, usage_count, updated_at\)([\s\S]*?);/)?.[1] || ''
  assert.match(table, /usage_date date PRIMARY KEY/)
  assert.match(table, /usage_count bigint NOT NULL CHECK \(usage_count >= 0\)/)
  assert.match(table, /updated_at timestamptz NOT NULL/)
  assert.doesNotMatch(table, /installation_uid|app_version|platform|arch/)
  assert.match(seed, /count\(\*\)::bigint/)
  assert.match(seed, /AT TIME ZONE 'Asia\/Shanghai'/)
  assert.doesNotMatch(seed, /generate_series|first_used_at/)
})

test('匿名角色不能读取或直接写入汇总且服务角色只读', () => {
  assert.match(migration, /REVOKE ALL ON public\.app_daily_usage_totals FROM PUBLIC/)
  assert.match(migration, /REVOKE ALL ON public\.app_daily_usage_totals FROM anon/)
  assert.match(migration, /REVOKE ALL ON public\.app_daily_usage_totals FROM authenticated/)
  assert.match(migration, /GRANT SELECT ON public\.app_daily_usage_totals TO service_role/)
  assert.doesNotMatch(migration, /GRANT (INSERT|UPDATE|DELETE).*app_daily_usage_totals/)
  assert.match(migration, /REVOKE ALL ON public\.app_daily_usage_summary FROM anon/)
})

test('上报函数以数据库时间按安装和日期幂等递增', () => {
  assert.match(migration, /report_time timestamptz := statement_timestamp\(\)/)
  assert.match(migration, /report_day date := \(report_time AT TIME ZONE 'Asia\/Shanghai'\)::date/)
  assert.match(migration, /ON CONFLICT \(installation_uid\) DO NOTHING/)
  assert.match(migration, /last_used_at < day_start OR last_used_at >= day_end/)
  assert.match(migration, /RETURNING true INTO first_report_for_day/)
  assert.match(migration, /IF NOT COALESCE\(first_report_for_day, false\)/)
  assert.match(migration, /ON CONFLICT \(usage_date\) DO UPDATE SET[\s\S]*usage_count = public\.app_daily_usage_totals\.usage_count \+ 1/)
})

test('历史汇总视图只暴露正式版日期总量且不含安装或版本维度', () => {
  const view = migration.match(/CREATE VIEW public\.app_daily_usage_summary[\s\S]*?AS([\s\S]*?);/)?.[1] || ''
  assert.match(view, /usage_date/)
  assert.match(view, /'packaged'::text AS runtime_mode/)
  assert.match(view, /usage_count/)
  assert.match(view, /updated_at AS calculated_at/)
  assert.doesNotMatch(view, /installation_uid|app_version|platform|arch/)
})
})()

// === Merged from feedbackAuth.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const mkdtemp = _m5_mkdtemp
  const readFile = _m5_readFile
  const rm = _m5_rm
  const writeFile = _m5_writeFile
  const os = _m5_os
  const path = _m5_path
  const FeedbackAuthClient = _m5_FeedbackAuthClient
  const feedbackBaseUrl = _m5_feedbackBaseUrl
  const feedbackAttachmentUrl = _m5_feedbackAttachmentUrl
  const FEEDBACK_CONFIG = _m5_FEEDBACK_CONFIG
const config = { baseUrl: 'https://feedback.example.test' }
const identity = { uid: '11111111-1111-4111-8111-111111111111', accessToken: 'a'.repeat(43) }
const json = (value, status = 200) => new Response(JSON.stringify(value), { status })

async function temporaryRoot(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-auth-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  return root
}

test('新身份首次并发只注册一次，重启后使用保存的高熵凭据验证原身份', async t => {
  const root = await temporaryRoot(t)
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    return json(url.endsWith('/identity') ? identity : { uid: identity.uid })
  }
  const auth = new FeedbackAuthClient({ config, userDataPath: root, fetchImpl })
  const sessions = await Promise.all([auth.getSession(), auth.getSession(), auth.getSession()])
  assert.deepEqual(sessions, [identity, identity, identity])
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, config.baseUrl + '/api/client/v1/identity')
  assert.equal(calls[0].options.redirect, 'error')
  assert.deepEqual(JSON.parse(await readFile(auth.filePath, 'utf8')), identity)
  const restarted = new FeedbackAuthClient({ config, userDataPath: root, fetchImpl })
  assert.deepEqual(await restarted.getSession(), identity)
  assert.equal(calls[1].url, config.baseUrl + '/api/client/v1/session')
  assert.equal(calls[1].options.headers.Authorization, 'Bearer ' + identity.accessToken)
  assert.equal(calls[1].options.redirect, 'error')
})

test('401或损坏的本机凭据不会自动注册新身份，避免丢失已有会话', async t => {
  const root = await temporaryRoot(t)
  const initial = new FeedbackAuthClient({ config, userDataPath: root, fetchImpl: async () => json(identity) })
  await initial.getSession()
  const calls = []
  const invalidated = new FeedbackAuthClient({
    config, userDataPath: root, fetchImpl: async url => { calls.push(url); return json({ code: 'UNAUTHORIZED' }, 401) }
  })
  await assert.rejects(invalidated.getSession(), error => error.code === 'UNAUTHORIZED')
  assert.deepEqual(calls, [config.baseUrl + '/api/client/v1/session'])
  assert.deepEqual(JSON.parse(await readFile(initial.filePath, 'utf8')), identity)
  await writeFile(initial.filePath, '{"uid":"public-device-id"}')
  await assert.rejects(invalidated.getSession(), error => error.code === 'IDENTITY_INVALID')
  assert.equal(calls.length, 1)
})

test('服务地址隔离身份文件，拒绝不安全入口和其他来源的附件地址', async t => {
  const root = await temporaryRoot(t)
  const first = new FeedbackAuthClient({ config, userDataPath: root })
  const second = new FeedbackAuthClient({ config: { baseUrl: 'https://other.example.test' }, userDataPath: root })
  assert.notEqual(first.filePath, second.filePath)
  assert.equal(feedbackBaseUrl(FEEDBACK_CONFIG), 'http://127.0.0.1:44317')
  for (const baseUrl of ['http://feedback.example.test', 'https://user:password@example.test', 'https://example.test/path', 'https://example.test/?token=bad']) {
    assert.throws(() => feedbackBaseUrl({ baseUrl, allowLoopbackHttp: true }))
  }
  assert.throws(() => feedbackBaseUrl({ baseUrl: 'http://127.0.0.1:44317' }))
  assert.equal(feedbackAttachmentUrl(config, '/api/attachments/a'), config.baseUrl + '/api/attachments/a')
  assert.throws(() => feedbackAttachmentUrl(config, 'https://attacker.example/upload'))
})
})()

// === Merged from feedbackCloud.integration.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const createServer = _m6_createServer
  const randomUUID = _m6_randomUUID
  const mkdtemp = _m6_mkdtemp
  const rm = _m6_rm
  const writeFile = _m6_writeFile
  const os = _m6_os
  const path = _m6_path
  const FeedbackAuthClient = _m6_FeedbackAuthClient
  const FeedbackCloudClient = _m6_FeedbackCloudClient
  const FeedbackService = _m6_FeedbackService
test('本机 HTTP 契约联调：身份、原始附件、反馈和回复使用自建服务', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-http-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const uid = randomUUID()
  const token = 'z'.repeat(43)
  const feedback = []
  const messages = []
  const uploads = new Map()
  let origin
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, origin)
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    const bytes = Buffer.concat(chunks)
    const body = request.headers['content-type'] === 'application/json' ? JSON.parse(bytes.toString()) : null
    const send = (value, status = 200) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(value)) }
    const base = '/api/client/v1'
    if (url.pathname === base + '/identity') return send({ uid, accessToken: token })
    if (url.pathname === '/upload') {
      assert.equal(request.headers.authorization, undefined)
      uploads.set(url.searchParams.get('key'), bytes)
      return send({})
    }
    if (request.headers.authorization !== 'Bearer ' + token) return send({ code: 'UNAUTHORIZED' }, 401)
    if (url.pathname === base + '/session') return send({ uid })
    if (url.pathname === base + '/attachments/authorize') return send({ uploadUrl: origin + '/upload?key=' + encodeURIComponent(body.objectKey) })
    if (url.pathname === base + '/attachments/download-urls') return send(body.paths.map(objectKey => ({ path: objectKey, fullSignedURL: origin + '/download?key=' + encodeURIComponent(objectKey) })))
    if (url.pathname === base + '/feedback' && request.method === 'POST') { feedback.push({ ...body, created_at: new Date().toISOString() }); return send({ id: body.id, feedbackId: body.feedback_id }) }
    if (url.pathname === base + '/feedback') return send(feedback)
    if (url.pathname.startsWith(base + '/feedback/')) return send(feedback.find(row => row.id === url.pathname.split('/').at(-1)) || null)
    if (url.pathname === base + '/messages' && request.method === 'POST') {
      const row = { ...body, id: randomUUID(), created_at: new Date().toISOString() }
      messages.push(row)
      return send(row)
    }
    if (url.pathname === base + '/messages') return send(messages.filter(row => !url.searchParams.get('feedbackId') || row.feedback_id === url.searchParams.get('feedbackId')))
    return send({ code: 'NOT_FOUND' }, 404)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  origin = 'http://127.0.0.1:' + server.address().port
  t.after(() => new Promise(resolve => server.close(resolve)))
  const config = { baseUrl: origin, allowLoopbackHttp: true }
  const auth = new FeedbackAuthClient({ config, userDataPath: root })
  const cloud = new FeedbackCloudClient({ config, auth })
  const service = new FeedbackService({ config, auth, cloud, appVersion: 'test', locale: 'zh-CN' })
  const file = path.join(root, 'evidence.txt')
  await writeFile(file, 'private evidence')
  const selected = await service.registerAttachments([file])
  const result = await service.submit({ category: 'bug', title: '本机联调', description: '自建服务反馈上传', attachmentTokens: selected.map(value => value.token) })
  assert.equal(result.success, true, JSON.stringify(result))
  assert.equal(uploads.size, 1)
  assert.equal([...uploads.values()][0].toString(), 'private evidence')
  const reply = await service.reply({ feedbackId: result.id, clientMessageId: randomUUID(), body: '补充问题', attachmentTokens: [] })
  assert.equal(reply.success, true, JSON.stringify(reply))
  const conversation = await service.conversation(result.id)
  assert.equal(conversation.success, true)
  assert.equal(conversation.conversation.messages[0].body, '补充问题')
  assert.ok(conversation.conversation.feedback.attachments[0].downloadUrl.startsWith(origin))
})

test('真实 HTTP 重定向不能把身份注册请求转发到其他入口', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-redirect-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  let redirectedRequests = 0
  const server = createServer((request, response) => {
    if (request.url === '/redirected') { redirectedRequests += 1; response.end('{}'); return }
    response.writeHead(307, { Location: '/redirected' }); response.end()
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const config = { baseUrl: 'http://127.0.0.1:' + server.address().port, allowLoopbackHttp: true }
  await assert.rejects(new FeedbackAuthClient({ config, userDataPath: root }).getSession())
  assert.equal(redirectedRequests, 0)
})
})()

// === Merged from feedbackCloudClient.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const FeedbackCloudClient = _m7_FeedbackCloudClient
  const safeCloudError = _m7_safeCloudError
const config = { baseUrl: 'https://feedback.example.test' }
const json = (value, status = 200) => new Response(JSON.stringify(value), { status })

test('401仅验证原持久身份并重试一次，不创建新匿名身份', async () => {
  const sessions = [{ accessToken: 'old', uid: 'uid' }, { accessToken: 'same-persisted-token', uid: 'uid' }]
  const auth = {
    invalidated: 0, calls: [],
    async getSession(options) { this.calls.push(options || {}); return sessions.shift() },
    invalidate() { this.invalidated += 1 }
  }
  let requests = 0
  const client = new FeedbackCloudClient({
    config, auth,
    fetchImpl: async (url, options) => {
      requests += 1
      assert.equal(url, config.baseUrl + '/api/client/v1/feedback')
      assert.equal(options.redirect, 'error')
      return json({}, requests === 1 ? 401 : 201)
    }
  })
  await client.createFeedback({ feedback_id: 'FB-1' })
  assert.equal(requests, 2)
  assert.equal(auth.invalidated, 1)
  assert.deepEqual(auth.calls, [{}, { force: true }])
})

test('授权上传使用原始字节且所有请求拒绝重定向', async () => {
  const calls = []
  const client = new FeedbackCloudClient({
    config, auth: { getSession: async () => ({ uid: 'uid', accessToken: 'private' }) },
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return calls.length === 1 ? json({ uploadUrl: '/api/files/upload?ticket=short-lived' }) : json({})
    }
  })
  const body = Buffer.from('evidence')
  assert.deepEqual(await client.uploadObject({ objectKey: 'uid/FB-1/file.txt', body, mimeType: 'text/plain' }), { objectKey: 'uid/FB-1/file.txt', uid: 'uid' })
  assert.deepEqual(JSON.parse(calls[0].options.body), { objectKey: 'uid/FB-1/file.txt', mimeType: 'text/plain', size: body.length })
  assert.equal(calls[1].options.body, body)
  assert.equal(calls[1].options.headers.Authorization, undefined)
  assert.ok(calls.every(call => call.options.redirect === 'error'))
})

test('拒绝把附件内容发送到第三方，并清理已授权但未提交的对象', async () => {
  const calls = []
  const client = new FeedbackCloudClient({
    config, auth: { getSession: async () => ({ uid: 'uid', accessToken: 'private' }) },
    fetchImpl: async (url, options) => {
      calls.push({ url, options })
      return json(options.method === 'DELETE' ? {} : { uploadUrl: 'https://attacker.example/upload' })
    }
  })
  await assert.rejects(client.uploadObject({ objectKey: 'uid/FB-1/file.txt', body: Buffer.from('secret'), mimeType: 'text/plain' }), /不属于当前服务/)
  assert.equal(calls.length, 2)
  assert.equal(calls[1].options.method, 'DELETE')
})

test('PUT失败会清理pending对象且保留原始上传错误', async () => {
  const calls = []
  const client = new FeedbackCloudClient({
    config, auth: { getSession: async () => ({ uid: 'uid', accessToken: 'private' }) },
    fetchImpl: async (url, options) => {
      calls.push(options.method)
      if (options.method === 'PUT') return json({ code: 'UPLOAD_FAILED' }, 500)
      if (options.method === 'DELETE') throw new Error('cleanup unavailable')
      return json({ uploadUrl: '/api/files/upload?ticket=short-lived' })
    }
  })
  await assert.rejects(client.uploadObject({ objectKey: 'uid/FB-1/file.txt', body: Buffer.from('secret'), mimeType: 'text/plain' }), error => error.code === 'UPLOAD_FAILED')
  assert.deepEqual(calls, ['POST', 'PUT', 'DELETE'])
})

test('下载地址只接受本服务且客户端消息返回服务端已保存的幂等结果', async () => {
  const row = { id: 'saved', client_message_id: 'message-1', created_at: '2026-11-11' }
  const client = new FeedbackCloudClient({
    config, auth: { getSession: async () => ({ uid: 'uid', accessToken: 'private' }) },
    fetchImpl: async url => url.endsWith('/messages')
      ? json(row)
      : json([{ path: 'uid/a', fullSignedURL: '/api/files/a?ticket=short-lived' }])
  })
  assert.deepEqual(await client.createMessage({ client_message_id: 'message-1' }), row)
  assert.equal((await client.signedDownloadUrls(['uid/a', 'uid/a'])).get('uid/a'), config.baseUrl + '/api/files/a?ticket=short-lived')
  client.fetch = async () => json([{ path: 'uid/a', fullSignedURL: 'https://other.example/a' }])
  await assert.rejects(client.signedDownloadUrls(['uid/a']), /不属于当前服务/)
})

test('错误翻译不透传服务端详情', () => {
  const error = safeCloudError({ code: 'DATABASE_42501', message: 'secret server detail /Users/A' }, 401)
  assert.equal(error.code, 'DATABASE_42501')
  assert.equal(error.status, 401)
  assert.doesNotMatch(error.message, /secret|Users/)
})
})()

// === Merged from feedbackCloudPolicies.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const readFileSync = _m8_readFileSync
  const readdirSync = _m8_readdirSync
const migrationsDirectory = new URL('../cloudbase/migrations/', import.meta.url)
const migrations = readdirSync(migrationsDirectory)
  .filter(name => name.endsWith('.sql'))
  .sort()
  .map(name => readFileSync(new URL(name, migrationsDirectory), 'utf8'))
  .join('\n')
const storagePolicies = readFileSync(new URL('../cloudbase/storage/feedback-policies.sql', import.meta.url), 'utf8')

test('反馈状态允许管理端推进但保持固定状态集合', () => {
  assert.match(migrations, /DROP CONSTRAINT app_feedback_status_check/)
  assert.match(migrations, /status IN \('new', 'in_progress', 'resolved', 'closed'\)/)
})

test('匿名反馈和存储在云端具备数量与频率边界', () => {
  assert.match(migrations, /feedback_submission_allowed/)
  assert.match(migrations, /created_at >= now\(\) - interval '1 hour'/)
  assert.match(migrations, /feedback_storage_upload_allowed/)
  assert.match(storagePolicies, /file_size_limit = 10 \* 1024 \* 1024/)
  assert.match(storagePolicies, /allowed_mime_types = ARRAY\[/)
  assert.match(storagePolicies, /feedback_storage_upload_allowed\(auth\.uid\(\), name\)/)
})

test('反馈表取消标题和内容最低字数约束但保留必填与上限', () => {
  assert.match(migrations, /DROP CONSTRAINT app_feedback_title_check/)
  assert.match(migrations, /CHECK \(btrim\(title\) <> '' AND char_length\(title\) <= 80\)/)
  assert.match(migrations, /CHECK \(btrim\(description\) <> '' AND char_length\(description\) <= 2000\)/)
})
})()

// === Merged from feedbackConversationMigration.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const readFileSync = _m9_readFileSync
const migration = readFileSync(new URL(
  '../cloudbase/migrations/20260826090000_add_feedback_conversations.sql',
  import.meta.url
), 'utf8')
const storagePathFix = readFileSync(new URL(
  '../cloudbase/migrations/20260826093000_fix_feedback_reply_storage_paths.sql',
  import.meta.url
), 'utf8')

test('反馈会话迁移以父反馈归属和列级授权限制匿名读取', () => {
  assert.match(migration, /CREATE TABLE public\.app_feedback_messages/)
  assert.match(migration, /NEW\.submitter_uid := owner_uid/)
  assert.match(migration, /GRANT SELECT \(id, feedback_id, category, title, description, attachments, created_at\)/)
  assert.match(migration, /CREATE POLICY app_feedback_select_own[\s\S]*submitter_uid = auth\.uid\(\)/)
  assert.match(migration, /CREATE POLICY app_feedback_messages_select_own[\s\S]*submitter_uid = auth\.uid\(\)/)
  assert.doesNotMatch(migration, /GRANT SELECT ON public\.app_feedback TO anon/)
})

test('匿名用户只能追加本人 user 消息并受频率与会话上限约束', () => {
  assert.match(migration, /author_role = 'user'/)
  assert.match(migration, /feedback\.submitter_uid = request_uid/)
  assert.match(migration, /created_at >= now\(\) - interval '1 hour'[\s\S]*< 20/)
  assert.match(migration, /message\.feedback_id = request_feedback_id[\s\S]*< 200/)
  assert.match(migration, /UNIQUE \(feedback_id, client_message_id\)/)
})

test('回复附件兼容原路径并保留消息与全局存储边界', () => {
  assert.match(migration, /split_part\(object_name, '\/', 3\) = 'messages'/)
  assert.match(migration, /split_part\(object_name, '\/', 4\).*\^\[0-9a-f\]/)
  assert.match(migration, /split_part\(object\.name, '\/', 4\) = split_part\(object_name, '\/', 4\)[\s\S]*< 5/)
  assert.match(migration, /object\.owner_id = request_uid[\s\S]*< 50/)
  assert.match(migration, /object\.bucket_id = 'feedback'[\s\S]*< 1000/)
  assert.match(migration, /jsonb_array_length\(value\) <= 5/)
  assert.match(migration, /sum\(\(item ->> 'size'\)::bigint\) <= 31457280/)
})

test('原反馈对象配额容纳双页三次识别证据、清单、诊断和五个手动附件', () => {
  for (const source of [migration, storagePathFix]) {
    assert.match(source, /split_part\(object\.name, '\/', 3\) <> 'messages'[\s\S]*< 19/)
  }
})
})()

// === Merged from feedbackConversationService.test.js ===
await (async () => {
  const test = _m10_test
  const assert = _m10_assert
  const mkdtemp = _m10_mkdtemp
  const writeFile = _m10_writeFile
  const rm = _m10_rm
  const os = _m10_os
  const path = _m10_path
  const FeedbackService = _m10_FeedbackService
const config = { baseUrl: 'https://feedback.example.test' }
const feedbackId = '11111111-1111-4111-8111-111111111111'
const clientMessageId = '22222222-2222-4222-8222-222222222222'

function service(cloud) {
  return new FeedbackService({ config, auth: { getSession: async () => ({ uid: 'uid-1', accessToken: 'secret-token' }) }, cloud, appVersion: 'test', logger: { warn() {} } })
}

test('列表计算三种回复提示且不返回管理状态和对象路径', async () => {
  const base = [
    { id: 'a', feedback_id: 'FB-A', category: 'bug', title: 'A', description: 'a', created_at: '2026-01-01', status: 'closed', attachments: [{ objectKey: 'secret/a' }] },
    { id: 'b', feedback_id: 'FB-B', category: 'bug', title: 'B', description: 'b', created_at: '2026-01-02', status: 'new', attachments: [] },
    { id: 'c', feedback_id: 'FB-C', category: 'bug', title: 'C', description: 'c', created_at: '2026-01-03', status: 'new', attachments: [] }
  ]
  const result = await service({
    listFeedback: async () => base,
    listMessages: async () => [
      { feedback_id: 'b', author_role: 'admin', created_at: '2026-01-04' },
      { feedback_id: 'c', author_role: 'admin', created_at: '2026-01-04' },
      { feedback_id: 'c', author_role: 'user', created_at: '2026-01-05' }
    ]
  }).listConversations()
  assert.equal(result.success, true)
  assert.deepEqual(result.items.map(item => item.replyState), ['followed_up', 'replied', 'waiting'])
  assert.deepEqual(result.items.map(item => item.id), ['c', 'b', 'a'])
  assert.equal(JSON.stringify(result).includes('status'), false)
  assert.equal(JSON.stringify(result).includes('secret/a'), false)
})

test('会话仅返回签名附件并保持原始问题和正序消息', async () => {
  const result = await service({
    getFeedback: async () => ({ id: feedbackId, feedback_id: 'FB-A', category: 'bug', title: '问题', description: '原始问题', created_at: '2026-01-01', attachments: [{ name: 'root.txt', objectKey: 'uid/root', size: 1 }] }),
    listMessages: async () => [{ id: 'm1', author_role: 'admin', body: '回复', client_message_id: clientMessageId, created_at: '2026-01-02', attachments: [{ name: 'reply.txt', objectKey: 'uid/reply', size: 2 }] }],
    signedDownloadUrls: async () => new Map([['uid/root', 'https://signed/root'], ['uid/reply', 'https://signed/reply']])
  }).conversation(feedbackId)
  assert.equal(result.success, true)
  assert.equal(result.conversation.feedback.body, '原始问题')
  assert.equal(result.conversation.messages[0].attachments[0].downloadUrl, 'https://signed/reply')
  assert.equal(JSON.stringify(result).includes('objectKey'), false)
})

test('用户回复按消息路径上传，写入失败逆序回滚并保留选择令牌', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-conversation-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const first = path.join(root, 'first.txt')
  const second = path.join(root, 'second.log')
  await writeFile(first, 'first')
  await writeFile(second, 'second')
  const uploaded = []
  const removed = []
  const instance = service({
    uploadObject: async value => { uploaded.push(value.objectKey) },
    createMessage: async () => { throw Object.assign(new Error('failed'), { code: 'SAVE_FAILED' }) },
    deleteObject: async value => { removed.push(value) }
  })
  const selected = await instance.registerAttachments([first, second])
  const result = await instance.reply({ feedbackId, clientMessageId, body: '继续追问', attachmentTokens: selected.map(item => item.token) })
  assert.equal(result.success, false)
  assert.equal(uploaded.length, 2)
  assert.ok(uploaded.every(key => key.includes(`/${feedbackId}/messages/${clientMessageId}/`)))
  assert.deepEqual(removed, [...uploaded].reverse())
  assert.ok(selected.every(item => instance.selections.has(item.token)))
})

test('幂等重复回复成功后只清理本次额外上传对象', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-idempotent-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const file = path.join(root, 'evidence.txt')
  await writeFile(file, 'evidence')
  const removed = []
  const instance = service({ uploadObject: async () => {}, createMessage: async () => ({ duplicate: true }), deleteObject: async key => { removed.push(key) } })
  const [selected] = await instance.registerAttachments([file])
  const result = await instance.reply({ feedbackId, clientMessageId, body: '重复提交', attachmentTokens: [selected.token] })
  assert.equal(result.success, true)
  assert.equal(removed.length, 1)
  assert.equal(instance.selections.has(selected.token), false)
})

test('消息已落库但响应丢失时保留消息引用的附件并返回幂等成功', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-ambiguous-reply-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const file = path.join(root, 'evidence.txt')
  await writeFile(file, 'evidence')
  const uploaded = []
  const removed = []
  const instance = service({
    uploadObject: async value => { uploaded.push(value.objectKey) },
    createMessage: async () => { throw new TypeError('response lost') },
    listMessages: async () => [{
      client_message_id: clientMessageId,
      attachments: [{ objectKey: uploaded[0] }]
    }],
    deleteObject: async key => { removed.push(key) }
  })
  const [selected] = await instance.registerAttachments([file])
  const result = await instance.reply({ feedbackId, clientMessageId, body: '响应丢失', attachmentTokens: [selected.token] })
  assert.equal(result.success, true)
  assert.equal(result.duplicate, true)
  assert.deepEqual(removed, [])
  assert.equal(instance.selections.has(selected.token), false)
})

test('消息写入结果无法确认时不删除可能已被引用的附件', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-unknown-reply-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const file = path.join(root, 'evidence.txt')
  await writeFile(file, 'evidence')
  const removed = []
  const instance = service({
    uploadObject: async () => {},
    createMessage: async () => { throw new TypeError('response lost') },
    listMessages: async () => { throw new TypeError('still offline') },
    deleteObject: async key => { removed.push(key) }
  })
  const [selected] = await instance.registerAttachments([file])
  const result = await instance.reply({ feedbackId, clientMessageId, body: '无法确认', attachmentTokens: [selected.token] })
  assert.equal(result.success, false)
  assert.deepEqual(removed, [])
  assert.equal(instance.selections.has(selected.token), true)
})

test('无法确认的消息在重试前对账并清理确认未引用的旧上传', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-feedback-retry-reconcile-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const file = path.join(root, 'evidence.txt')
  await writeFile(file, 'evidence')
  const uploaded = []
  const removed = []
  let createCalls = 0
  let listCalls = 0
  const instance = service({
    uploadObject: async value => { uploaded.push(value.objectKey) },
    createMessage: async document => {
      createCalls += 1
      if (createCalls === 1) throw new TypeError('response lost')
      return document
    },
    listMessages: async () => {
      listCalls += 1
      if (listCalls === 1) throw new TypeError('still offline')
      return []
    },
    deleteObject: async key => { removed.push(key) }
  })
  const [selected] = await instance.registerAttachments([file])
  const input = { feedbackId, clientMessageId, body: '重试对账', attachmentTokens: [selected.token] }
  assert.equal((await instance.reply(input)).success, false)
  assert.equal((await instance.reply(input)).success, true)
  assert.equal(uploaded.length, 2)
  assert.deepEqual(removed, [uploaded[0]])
  assert.equal(instance.selections.has(selected.token), false)
})
})()

// === Merged from feedbackDiagnosticSubmission.test.js ===
await (async () => {
  const test = _m11_test
  const assert = _m11_assert
  const submitFeedbackWithDiagnostics = _m11_submitFeedbackWithDiagnostics
const captureId = 'abcdefab-cdef-4abc-8def-abcdefabcdef'

test('存在的会话用于构建快照且只在反馈成功后清理', async () => {
  const calls = []
  const result = await submitFeedbackWithDiagnostics({
    input: { includeDiagnostics: true, diagnosticCaptureId: captureId },
    feedback: {
      submit: async (_input, options) => {
        await options.buildDiagnostics(captureId)
        return { success: true, feedbackId: 'FB-1' }
      }
    },
    diagnostics: {
      resolveCapture: async value => ({ captureId: value, status: 'completed' }),
      cancelCapture: async input => { calls.push(['cancel', input]); return { success: true } }
    },
    buildDiagnostics: async payload => { calls.push(['build', payload]); return { schemaVersion: 3 } }
  })
  assert.equal(result.success, true)
  assert.deepEqual(calls, [
    ['build', { captureId }],
    ['cancel', { captureId }]
  ])
})

test('不存在的会话被拒绝且不会退化为普通快照', async () => {
  let built = false
  await assert.rejects(
    () => submitFeedbackWithDiagnostics({
      input: { includeDiagnostics: true, diagnosticCaptureId: captureId },
      feedback: { submit: async (_input, options) => options.buildDiagnostics(captureId) },
      diagnostics: { resolveCapture: async () => null },
      buildDiagnostics: async () => { built = true }
    }),
    error => error.code === 'FEEDBACK_DIAGNOSTIC_CAPTURE_NOT_FOUND'
  )
  assert.equal(built, false)
})

test('反馈失败保留诊断会话供重试', async () => {
  let canceled = false
  const result = await submitFeedbackWithDiagnostics({
    input: { includeDiagnostics: true, diagnosticCaptureId: captureId },
    feedback: { submit: async () => ({ success: false, errorCode: 'SAVE_FAILED' }) },
    diagnostics: { cancelCapture: async () => { canceled = true; return { success: true } } },
    buildDiagnostics: async () => ({ schemaVersion: 3 })
  })
  assert.equal(result.success, false)
  assert.equal(canceled, false)
})

test('反馈成功不因会话清理失败而丢失成功结果', async () => {
  const warnings = []
  const result = await submitFeedbackWithDiagnostics({
    input: { includeDiagnostics: true, diagnosticCaptureId: captureId },
    feedback: {
      submit: async (_input, options) => {
        await options.buildDiagnostics(captureId)
        return { success: true, feedbackId: 'FB-2' }
      }
    },
    diagnostics: {
      resolveCapture: async value => ({ captureId: value, status: 'completed' }),
      cancelCapture: async () => ({ success: false, errorCode: 'STORE_BUSY' })
    },
    buildDiagnostics: async () => ({ schemaVersion: 3 }),
    logger: { warn: (...args) => warnings.push(args) }
  })
  assert.equal(result.feedbackId, 'FB-2')
  assert.deepEqual(warnings[0][1], { reasonCode: 'STORE_BUSY' })
})

test('反馈成功后使用校验层规范化的会话标识清理', async () => {
  const upperCaptureId = captureId.toUpperCase()
  const cleaned = []
  const result = await submitFeedbackWithDiagnostics({
    input: { includeDiagnostics: true, diagnosticCaptureId: upperCaptureId },
    feedback: {
      submit: async (_input, options) => {
        await options.buildDiagnostics(captureId)
        return { success: true, feedbackId: 'FB-3' }
      }
    },
    diagnostics: {
      resolveCapture: async value => ({ captureId: value, status: 'completed' }),
      cancelCapture: async input => { cleaned.push(input); return { success: true } }
    },
    buildDiagnostics: async () => ({ schemaVersion: 3 })
  })

  assert.equal(result.success, true)
  assert.deepEqual(cleaned, [{ captureId }])
})
})()

// === Merged from feedbackDiagnosticsUi.test.js ===
await (async () => {
  const test = _m12_test
  const assert = _m12_assert
  const readFileSync = _m12_readFileSync
  const getRendererDiagnosticContext = _m12_getRendererDiagnosticContext
  const setRendererDiagnosticContext = _m12_setRendererDiagnosticContext
const dashboard = readFileSync(new URL('../src/domains/dashboard/DashboardView.vue', import.meta.url), 'utf8')
const feedback = readFileSync(new URL('../src/domains/settings/FeedbackSettings.vue', import.meta.url), 'utf8')
const controller = readFileSync(new URL('../src/composables/useDiagnostics.js', import.meta.url), 'utf8')

test('首页移除诊断入口且问题反馈页完整接管诊断操作', () => {
  assert.doesNotMatch(dashboard, /导出当前诊断|开始诊断会话|结束并导出|取消会话/)
  assert.match(dashboard, /刷新状态/)
  assert.match(feedback, /导出当前诊断/)
  assert.match(feedback, /开始诊断会话/)
  assert.match(feedback, /结束并导出/)
  assert.match(feedback, /取消会话/)
  assert.match(feedback, /prepareDiagnosticCaptureForFeedback/)
  assert.match(feedback, /diagnosticCaptureId: prepared\.captureId/)
})

test('诊断卡片按标题开关、说明和等宽双按钮分层', () => {
  assert.match(feedback, /class="diagnostic-heading-row">[\s\S]*?附带脱敏诊断[\s\S]*?<el-switch/)
  assert.match(feedback, /class="diagnostic-description">[\s\S]*?默认关闭，不会自动上传账号令牌、Cookie、个人路径或诊断事件中的敏感原值/)
  assert.match(feedback, /\.diagnostic-actions \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/)
  assert.match(feedback, /\.diagnostic-actions :deep\(\.el-button\) \{ width: 100%; margin-left: 0; \}/)
})

test('本地导出不清理会话且只有反馈成功清除前端会话', () => {
  const exportStart = controller.indexOf('async function exportDiagnostics')
  const exportEnd = controller.indexOf('async function finishAndExportDiagnosticCapture')
  const exportBlock = controller.slice(exportStart, exportEnd)
  assert.doesNotMatch(exportBlock, /cancelDiagnosticCapture|cancelCapture/)
  assert.match(feedback, /if \(!result\?\.success\)[\s\S]*return[\s\S]*clearSubmittedDiagnosticCapture\(prepared\.captureId\)/)
})

test('渲染器诊断上下文只保留结构化白名单字段并返回副本', () => {
  setRendererDiagnosticContext({
    modules: [{ id: 'items', state: 'attention', reasonCode: 'invalid_configuration', text: 'secret' }],
    rendererHealth: [{ id: 'dpi', status: 'ready', reasonCode: '', path: 'C:\\private' }]
  })
  const first = getRendererDiagnosticContext()
  assert.deepEqual(first, {
    modules: [{ id: 'items', state: 'attention', reasonCode: 'invalid_configuration' }],
    rendererHealth: [{ id: 'dpi', status: 'ready' }]
  })
  first.modules[0].state = 'error'
  assert.equal(getRendererDiagnosticContext().modules[0].state, 'attention')
})
})()

// === Merged from feedbackEvidenceAttachments.test.js ===
await (async () => {
  const test = _m13_test
  const assert = _m13_assert
  const assemblePuzzleEvidenceAttachments = _m13_assemblePuzzleEvidenceAttachments
function file({ page, attempt, kind, bytes }) {
  const extension = kind === 'crop' ? 'png' : 'jpg'
  return {
    attempt, page, kind, fileName: `page-${page}-attempt-${attempt}-${kind}.${extension}`,
    encoding: kind === 'crop' ? 'png' : 'jpeg', width: 600, height: 1000,
    bytes, sha256: 'a'.repeat(64), status: 'complete', body: Buffer.alloc(bytes)
  }
}

function evidence(files) {
  return {
    referenceId: '11111111-1111-4111-8111-111111111111',
    files,
    manifest: {
      schemaVersion: 1,
      evidenceId: '11111111-1111-4111-8111-111111111111',
      occurredAt: '2026-08-26T01:02:03Z',
      completeness: { status: 'complete', reasons: [] },
      attempts: files.map(item => ({ attempt: item.attempt, page: item.page })),
      files: files.map(({ body, ...metadata }) => metadata),
      omittedFiles: []
    }
  }
}

const diagnostics = {
  name: 'poe-cn-helper-diagnostics.json', safeName: 'poe-cn-helper-diagnostics.json', mimeType: 'application/json',
  size: 1024, body: Buffer.alloc(1024), diagnostic: true
}

test('系统证据不占手动附件名额且保留全部裁剪、最终完整窗口、清单和诊断', () => {
  const files = [
    file({ page: 1, attempt: 1, kind: 'crop', bytes: 1024 }),
    file({ page: 2, attempt: 1, kind: 'crop', bytes: 1024 }),
    file({ page: 1, attempt: 1, kind: 'window', bytes: 1024 }),
    file({ page: 2, attempt: 1, kind: 'window', bytes: 1024 })
  ]
  const items = assemblePuzzleEvidenceAttachments({ diagnostics, evidence: evidence(files), manualBytes: 5 * 1024 })
  assert.deepEqual(items.map(item => item.systemKind || 'diagnostics'), [
    'puzzle-evidence-crop', 'puzzle-evidence-crop', 'puzzle-evidence-window', 'puzzle-evidence-window',
    'puzzle-evidence-manifest', 'diagnostics'
  ])
  const manifest = JSON.parse(items.find(item => item.systemKind === 'puzzle-evidence-manifest').body)
  assert.equal(manifest.omittedFiles.length, 0)
  assert.equal(manifest.files.every(item => item.submissionStatus === 'included'), true)
})

test('超过 30MB 时确定性保留全部裁剪和最终完整窗口并在清单列出旧窗口', () => {
  const megabyte = 1024 * 1024
  const files = [
    file({ page: 1, attempt: 1, kind: 'crop', bytes: 2 * megabyte }),
    file({ page: 2, attempt: 1, kind: 'crop', bytes: 2 * megabyte }),
    file({ page: 1, attempt: 1, kind: 'window', bytes: 9 * megabyte }),
    file({ page: 2, attempt: 1, kind: 'window', bytes: 9 * megabyte })
  ]
  const items = assemblePuzzleEvidenceAttachments({ diagnostics, evidence: evidence(files), manualBytes: 8 * megabyte })
  const windows = items.filter(item => item.systemKind === 'puzzle-evidence-window')
  assert.deepEqual(windows.map(item => item.name), ['page-2-attempt-1-window.jpg'])
  assert.equal(items.filter(item => item.systemKind === 'puzzle-evidence-crop').length, 2)
  const manifest = JSON.parse(items.find(item => item.systemKind === 'puzzle-evidence-manifest').body)
  assert.deepEqual(manifest.omittedFiles.map(item => [item.fileName, item.reason]), [['page-1-attempt-1-window.jpg', 'CAPACITY_LIMIT']])
})

test('手动附件挤占全部裁剪和诊断所需容量时阻止不完整提交', () => {
  const files = [file({ page: 1, attempt: 1, kind: 'crop', bytes: 6 * 1024 * 1024 })]
  assert.throws(
    () => assemblePuzzleEvidenceAttachments({ diagnostics, evidence: evidence(files), manualBytes: 25 * 1024 * 1024 }),
    /全部识别裁剪图合计不能超过 30MB/
  )
})
})()
