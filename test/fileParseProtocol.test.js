import test from 'node:test'
import assert from 'node:assert/strict'
import {
  attachParseRequestId,
  decodeItemInfoRequest
} from '../electron/modules/watcher/fileWatcher.js'

test('共享解析协议读取装备、地图和海图请求标识', () => {
  assert.deepEqual(decodeItemInfoRequest('{"clipboard":"装备","requestId":7}'), {
    clipboard: '装备',
    requestId: 7
  })
  assert.deepEqual(decodeItemInfoRequest('{"clipboard":"地图"}'), {
    clipboard: '地图',
    requestId: null
  })
})

test('共享解析协议在成功和错误响应中回传请求标识', () => {
  assert.deepEqual(attachParseRequestId({ category: '海图' }, 8), {
    category: '海图',
    requestId: 8
  })
  assert.deepEqual(attachParseRequestId({ error: '无法解析' }, 9), {
    error: '无法解析',
    requestId: 9
  })
  assert.deepEqual(attachParseRequestId({ category: '装备' }, null), {
    category: '装备'
  })
})
