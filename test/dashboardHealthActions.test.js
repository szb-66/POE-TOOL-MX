import test from 'node:test'
import assert from 'node:assert/strict'
import { healthActionForItem } from '../src/domains/dashboard/healthActions.js'

test('可配置健康项映射到各自设置分类', () => {
  assert.deepEqual(healthActionForItem({ id: 'shortcuts', status: 'error' }), {
    type: 'settings', label: '配置快捷键', target: 'general'
  })
  assert.deepEqual(healthActionForItem({ id: 'dpi', status: 'attention' }), {
    type: 'settings', label: '调整 DPI', target: 'system'
  })
})

test('环境健康项映射到针对性排障主题', () => {
  const expected = {
    python: 'faq-runtime',
    displays: 'faq-dpi',
    userData: 'faq-config-location',
    platform: 'faq-system-environment',
    administrator: 'faq-system-environment',
    network: 'faq-system-environment'
  }
  for (const [id, target] of Object.entries(expected)) {
    assert.deepEqual(healthActionForItem({ id, status: 'error' }), {
      type: 'help', label: '查看排障', target
    })
  }
})

test('正常、检测中和未知健康项不生成操作', () => {
  assert.equal(healthActionForItem({ id: 'shortcuts', status: 'ready' }), null)
  assert.equal(healthActionForItem({ id: 'dpi', status: 'pending' }), null)
  assert.equal(healthActionForItem({ id: 'unknown', status: 'error' }), null)
  assert.equal(healthActionForItem(), null)
})

test('多个异常健康项分别保留自己的操作目标', () => {
  const actions = [
    { id: 'python', status: 'error' },
    { id: 'shortcuts', status: 'attention' },
    { id: 'dpi', status: 'error' }
  ].map(healthActionForItem)
  assert.deepEqual(actions.map(action => action?.target), ['faq-runtime', 'general', 'system'])
})
