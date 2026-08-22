import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

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
  assert.match(service, /config\.dailyUsageTable/)
  assert.match(service, /Prefer: 'return=minimal'/)
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
