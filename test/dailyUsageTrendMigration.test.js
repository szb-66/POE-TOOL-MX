import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

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
