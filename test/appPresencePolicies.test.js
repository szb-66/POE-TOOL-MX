import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const initialMigration = readFileSync(
  new URL('../cloudbase/migrations/20260819071716_add_app_presence.sql', import.meta.url),
  'utf8'
)
const correctionMigration = readFileSync(
  new URL('../cloudbase/migrations/20260819072620_replace_presence_rpc_with_rest_upsert.sql', import.meta.url),
  'utf8'
)
const finalMigration = readFileSync(
  new URL('../cloudbase/migrations/20260819074422_add_write_only_presence_heartbeat.sql', import.meta.url),
  'utf8'
)
const service = readFileSync(new URL('../electron/modules/presence/service.js', import.meta.url), 'utf8')
const main = readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8')
const preload = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8')

test('在线表只保存安装级当前状态且不记录心跳历史', () => {
  assert.match(initialMigration, /installation_uid text PRIMARY KEY/)
  assert.match(initialMigration, /first_seen_at timestamptz NOT NULL DEFAULT now\(\)/)
  assert.match(initialMigration, /last_seen_at timestamptz NOT NULL DEFAULT now\(\)/)
  assert.match(initialMigration, /WHERE last_seen_at >= now\(\) - interval '3 minutes'/)
  assert.doesNotMatch(initialMigration, /game_account|character|hardware|module_status/i)
})

test('历史纠正迁移记录已排除的基础表Upsert路径', () => {
  assert.match(correctionMigration, /DROP FUNCTION IF EXISTS public\.report_app_presence/)
  assert.match(correctionMigration, /GRANT INSERT, UPDATE ON public\.app_presence TO anon/)
})

test('最终迁移仅向匿名桌面身份开放心跳视图插入', () => {
  assert.match(finalMigration, /CREATE VIEW public\.app_presence_heartbeat/)
  assert.match(finalMigration, /REVOKE ALL ON public\.app_presence FROM anon/)
  assert.match(finalMigration, /REVOKE ALL ON public\.app_presence_heartbeat FROM anon/)
  assert.match(finalMigration, /GRANT INSERT ON public\.app_presence_heartbeat TO anon/)
  assert.doesNotMatch(finalMigration, /GRANT (SELECT|UPDATE|DELETE).*app_presence_heartbeat TO anon/)
  assert.match(finalMigration, /DROP POLICY IF EXISTS app_presence_insert_own/)
  assert.match(finalMigration, /DROP POLICY IF EXISTS app_presence_update_own/)
  assert.match(finalMigration, /DROP TRIGGER IF EXISTS app_presence_enforce_identity/)
})

test('安全触发器强制认证UID、服务端时间与最小字段', () => {
  assert.match(finalMigration, /SECURITY DEFINER/)
  assert.match(finalMigration, /SET search_path = pg_catalog/)
  assert.match(finalMigration, /request_uid text := auth\.uid\(\)/)
  assert.match(finalMigration, /request_uid = 'anon'/)
  assert.match(finalMigration, /statement_timestamp\(\)/)
  assert.match(finalMigration, /schema_version = 1/)
  assert.match(finalMigration, /INSTEAD OF INSERT ON public\.app_presence_heartbeat/)
  assert.match(finalMigration, /REVOKE ALL ON FUNCTION public\.submit_app_presence_heartbeat\(\) FROM anon/)
  assert.doesNotMatch(finalMigration, /NEW\.(installation_uid|first_seen_at|last_seen_at|schema_version)/)
})

test('客户端使用文档化只写视图INSERT且请求体不包含受保护字段', () => {
  assert.match(service, /\/v1\/rdb\/rest\/\$\{encodeURIComponent\(this\.config\.presenceTable\)\}/)
  assert.match(service, /Prefer: 'return=minimal'/)
  assert.doesNotMatch(service, /resolution=merge-duplicates/)
  assert.match(service, /app_version:/)
  assert.match(service, /runtime_mode:/)
  assert.doesNotMatch(service, /installation_uid:/)
  assert.doesNotMatch(service, /first_seen_at:/)
  assert.doesNotMatch(service, /last_seen_at:/)
})

test('心跳只接入主进程生命周期且窗口创建不等待网络', () => {
  const startIndex = main.indexOf('appPresenceService.start()')
  const windowIndex = main.indexOf('createApplicationWindow()', startIndex)
  assert.ok(startIndex >= 0)
  assert.ok(windowIndex > startIndex)
  assert.doesNotMatch(main.slice(startIndex, windowIndex), /await\s+appPresenceService/)
  assert.match(main, /\(\) => appPresenceService\?\.stop\(\)/)
  assert.doesNotMatch(preload, /presence|heartbeat/i)
})
