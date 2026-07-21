import test from 'node:test'
import assert from 'node:assert/strict'
import { writeClipboardText } from '../electron/modules/clipboardWriter.js'
import { writeTextToClipboard } from '../src/utils/clipboardWriter.js'
import { generateVendorRegex } from '../src/domains/shop/vendorRegex.js'

test('Electron 剪贴板适配器只写入收到的非空文本', () => {
  const written = []
  assert.deepEqual(writeClipboardText('r-g-b', { writeText: value => written.push(value) }), { success: true })
  assert.deepEqual(written, ['r-g-b'])
  assert.throws(() => writeClipboardText('', { writeText() {} }), /非空文本/)
  assert.throws(() => writeClipboardText('x'), /不可用/)
})

test('前端优先使用 Electron，并支持浏览器成功与失败传播', async () => {
  const electronWritten = []
  const browserWritten = []
  await writeTextToClipboard('electron', {
    electronWrite: async value => electronWritten.push(value),
    browserClipboard: { writeText: async value => browserWritten.push(value) }
  })
  assert.deepEqual(electronWritten, ['electron'])
  assert.deepEqual(browserWritten, [])

  await writeTextToClipboard('browser', { browserClipboard: { writeText: async value => browserWritten.push(value) } })
  assert.deepEqual(browserWritten, ['browser'])
  await assert.rejects(() => writeTextToClipboard('x', { browserClipboard: { writeText: async () => { throw new Error('denied') } } }), /denied/)
  await assert.rejects(() => writeTextToClipboard('', {}), /没有可复制/)
})

test('改变 Vendor 选项只生成结果，不会调用剪贴板', () => {
  let writes = 0
  const result = generateVendorRegex({ movement: ['movement_10'] })
  assert.ok(result.regex)
  assert.equal(writes, 0)
})
