import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

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
