import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

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
