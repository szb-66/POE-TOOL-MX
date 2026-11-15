import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { createRenderer, nextTick } from 'vue'
import { useLocalizedCatalog } from '../src/utils/localizedCatalog.js'
import { localizedResultState } from '../src/domains/regex/localizedRegex.js'
import { generateVendorRegex } from '../src/domains/regex/vendorRegex.js'
import { createDefaultVendorConfig } from '../src/domains/regex/vendorConfig.js'

const renderer = createRenderer({
  createComment: () => ({}), createText: () => ({}), createElement: () => ({}),
  insert() {}, remove() {}, parentNode: () => null, nextSibling: () => null,
  setText() {}, setElementText() {}, patchProp() {}
})
const response = (revision = '', extra = {}) => ({ success: true, data: { revision, mappingState: revision ? 'active' : 'none', aliases: [{ text: 'maximum Life', aliases: ['最大生命'], searchExpression: { expression: '最大生命', mapped: true, complete: true } }], ...extra } })
const flush = async () => { await nextTick(); await Promise.resolve(); await nextTick() }
function mountedCatalog(api) {
  let state, notify
  const app = renderer.createApp({ setup() {
    state = useLocalizedCatalog(['maximum Life'], { serverId: 'international', api: { ...api, onState: callback => { notify = callback; return () => {} } } })
    return () => null
  } })
  app.mount({})
  const result = () => {
    const config = createDefaultVendorConfig()
    config.common.selectedIds = ['max_life']
    // Match the real VendorRegexPanel invocation, including the revision guard.
    return localizedResultState(generateVendorRegex(config, 'en', state.revision.value ? state.aliases.value : null), state)
  }
  return { state, notify: value => notify(value), result, unmount: () => app.unmount() }
}

test('词库catalog IPC首次读取就拒绝已失效的安装映射，none仍可返回英文目录', async () => {
  const handlers = new Map()
  const source = readFileSync(new URL('../electron/modules/ipc/localization.js', import.meta.url), 'utf8').replace(/^import .*$/gm, '').replace('export function registerLocalizationHandlers', 'function registerLocalizationHandlers')
  const register = vm.runInNewContext(`${source}\nregisterLocalizationHandlers`, {
    ipcMain: { handle: (name, callback) => handlers.set(name, callback) }, dialog: {},
    localizedSearchExpression: () => ({ expression: '', mapped: false, complete: true })
  })
  let mappingState = 'unavailable'
  const webContents = { mainFrame: {}, send() {} }
  const service = { requireInternational() {}, getStatus: () => ({ mappingState, mappingWarning: '游戏资源索引已改变' }), on() {} }
  const runtime = { current: () => ({ revision: '' }), dictionary: { aliasesFor: text => [text], localize: text => text } }
  register(service, () => ({ isDestroyed: () => false, webContents }), runtime)
  const event = { sender: webContents, senderFrame: webContents.mainFrame }
  const unavailable = await handlers.get('localization:catalog')(event, { texts: ['maximum Life'], match: 'contains' })
  assert.equal(unavailable.success, false)
  assert.equal(unavailable.error.code, 'LOCALIZATION_UNAVAILABLE')
  assert.match(unavailable.error.message, /索引已改变/)
  mappingState = 'none'
  const none = await handlers.get('localization:catalog')(event, { texts: ['maximum Life'], match: 'contains' })
  assert.equal(none.success, true)
  assert.equal(none.data.mappingState, 'none')
  assert.equal(none.data.revision, '')
})

test('真正hook首次加载失败明确阻断，未安装汉化的none状态继续生成英文', async t => {
  const unavailable = mountedCatalog({ catalog: async () => ({ success: false, error: { code: 'LOCALIZATION_UNAVAILABLE', message: '当前汉化资源已失效' } }) })
  t.after(unavailable.unmount)
  await flush()
  assert.equal(unavailable.result().regex, '')
  assert.match(unavailable.result().warnings.join(' '), /失效/)
  const initialState = mountedCatalog({ catalog: async () => response('', { mappingState: 'unavailable', mappingWarning: '安装映射无法核实' }) })
  t.after(initialState.unmount)
  await flush()
  assert.equal(initialState.result().regex, '')
  assert.match(initialState.result().warnings.join(' '), /无法核实/)
  const none = mountedCatalog({ catalog: async () => response('') })
  t.after(none.unmount)
  await flush()
  assert.equal(none.result().regex, '"maximum Life"')
  assert.deepEqual(none.result().warnings, [])
})

test('真正hook接到unavailable立即丢弃旧结果和迟到响应，恢复none或新活动资源后重载', async t => {
  let resolvePending, calls = 0, revision = 'r1'
  const fixture = mountedCatalog({ catalog: () => {
    calls++
    if (calls === 2) return new Promise(resolve => { resolvePending = resolve })
    return Promise.resolve(response(revision))
  } })
  t.after(fixture.unmount)
  await flush()
  assert.match(fixture.result().regex, /最大生命/)
  fixture.notify({ resourceVersion: 'r2', mappingState: 'active' })
  assert.equal(fixture.state.loading.value, true)
  fixture.notify({ resourceVersion: '', mappingState: 'unavailable', mappingWarning: '游戏资源索引已改变' })
  assert.equal(fixture.result().regex, '')
  assert.match(fixture.result().warnings.join(' '), /索引已改变/)
  assert.equal(fixture.state.aliases.value.size, 0)
  resolvePending(response('r2'))
  await flush()
  assert.equal(fixture.result().regex, '')
  assert.equal(fixture.state.revision.value, '')
  await fixture.state.reload()
  assert.equal(calls, 2)
  revision = ''
  fixture.notify({ resourceVersion: '', mappingState: 'none' })
  await flush()
  assert.equal(fixture.result().regex, '"maximum Life"')
  assert.equal(fixture.state.error.value, '')
  revision = 'r3'
  fixture.notify({ resourceVersion: 'r3', mappingState: 'active' })
  await flush()
  assert.equal(fixture.state.revision.value, 'r3')
  assert.match(fixture.result().regex, /最大生命/)
})
