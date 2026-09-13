import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumRepository } from '../electron/modules/sanctum/repository.js'
import { SanctumCalibrationEditor } from '../electron/modules/sanctum/calibration.js'
import { useSanctumStore } from '../src/domains/sanctum/sanctumStore.js'
import { createSanctumStrategy } from '../shared/sanctum.js'

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }

test('首次和旧配置默认关闭，重启恢复偏好但不运行，模块移除不修改偏好', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-enabled-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const repository = new SanctumRepository(root)
  let service = new SanctumService({ repository, moduleEnabled: false })
  assert.equal(service.getState().configuredEnabled, false)
  service.setModuleEnabled(true)
  assert.equal(service.enabled, false)
  service.setEnabled(true)
  service.resetRun()
  assert.equal(repository.load().enabled, true)
  service.setModuleEnabled(false)
  assert.equal(service.enabled, false)
  assert.equal(repository.load().enabled, true)
  service.setModuleEnabled(true)
  assert.equal(service.enabled, true)
  assert.equal(service.state.running, false)
  await service.shutdown()
  service = new SanctumService({ repository, moduleEnabled: false })
  service.setModuleEnabled(true)
  assert.equal(service.enabled, true)
  assert.equal(service.state.running, false)
  service.setEnabled(false)
  assert.equal(repository.load().enabled, false)
  const data = JSON.parse(fs.readFileSync(repository.file, 'utf8'))
  delete data.enabled
  fs.writeFileSync(repository.file, JSON.stringify(data))
  assert.equal(repository.load().enabled, false)
  await service.shutdown()
})

test('保存失败：开启不生效，关闭先停止并丢弃迟到回放，保留配置和偏好状态', async t => {
  let fail = true
  const pending = deferred()
  const service = new SanctumService({ repository: { load: () => null, save() { if (fail) throw new Error('disk failure') } },
    replay: () => pending.promise })
  t.after(() => service.shutdown())
  assert.throws(() => service.setEnabled(true), /保存失败/)
  assert.equal(service.enabled, false)
  fail = false
  service.setEnabled(true)
  const strategy = structuredClone(service.state.strategy)
  const run = service.rescan('sample')
  fail = true
  assert.throws(() => service.setEnabled(false), /本次已关闭/)
  assert.equal(service.enabled, false)
  assert.equal(service.getState().configuredEnabled, false)
  assert.equal(service.state.running, false)
  pending.resolve({rooms:[],edges:[]})
  await run
  assert.equal(service.state.floor, null)
  assert.deepEqual(service.state.strategy, strategy)
  assert.throws(() => service.resetRun(), /未启用/)
  assert.throws(() => service.saveStrategy(createSanctumStrategy()), /未启用/)
  await assert.rejects(service.rescan('sample'), /未启用/)
  fail = false
  service.setEnabled(true)
  service.stop()
  assert.equal(service.getState().configuredEnabled, true)
})

test('关闭取消自己的框选，迟到截图不能写入；重新开启可再次框选', async t => {
  const service = new SanctumService({})
  t.after(() => service.shutdown())
  service.setEnabled(true)
  const pending = deferred()
  let canceled = 0
  const editor = new SanctumCalibrationEditor({ service, withHidden: fn => fn(), picker: () => pending.promise,
    detection: { getTitleConfig: () => ({ templates: {} }) },
    cancelPicker: () => { canceled++ } })
  service.calibrationEditor = editor
  const capture = editor.capture('mapRegion')
  service.setEnabled(false)
  assert.equal(canceled, 1)
  service.setEnabled(true)
  pending.resolve({ success: true })
  await capture
  assert.equal(service.state.liveCalibration, null)
  assert.equal(editor.picking, false)
  editor.picker = async () => ({ canceled: true })
  await editor.capture('mapRegion')
  assert.equal(canceled, 1)
})

test('页内开关防重复提交，失败刷新状态并保留错误，初始化及暂停不改偏好', async t => {
  setActivePinia(createPinia())
  const original = globalThis.window
  t.after(() => { globalThis.window = original })
  const pending = deferred(), calls = []
  let state = { enabled: false, configuredEnabled: false, running: false, solving: false }
  globalThis.window = { electronAPI: { onSanctumState: () => () => {}, sanctum: {
    async setModuleEnabled(value) { calls.push(['module', value]); return { success: true, data: state } },
    async samples() { return { success: true, data: [] } },
    async setEnabled(value) { calls.push(['preference', value]); return pending.promise },
    async getState() { return { success: true, data: state } }
  } } }
  const store = useSanctumStore()
  await store.initialize()
  assert.equal(store.readOnly, true)
  const toggle = store.setEnabled(true)
  assert.equal(store.toggling, true)
  await store.setEnabled(false)
  assert.deepEqual(calls, [['module', true], ['preference', true]])
  pending.resolve({ success: false, error: '保存失败' })
  await toggle
  assert.equal(store.error, '保存失败')
  assert.equal(store.toggling, false)
  assert.equal(store.state.enabled, false)
  state = { ...state, enabled: true, configuredEnabled: true }
  await store.initialize()
  await store.suspend()
  assert.deepEqual(calls.slice(-2), [['module', true], ['module', false]])
})

test('开关 IPC 拒绝时刷新真实状态并显示错误，刷新成功不能清除失败提示', async t => {
  setActivePinia(createPinia())
  const original = globalThis.window
  t.after(() => { globalThis.window = original })
  let refreshed = 0
  globalThis.window = { electronAPI: { sanctum: {
    async setEnabled() { throw new Error('开关通信中断') },
    async getState() { refreshed++; return { success: true, data: { enabled: false, configuredEnabled: false } } }
  } } }
  const store = useSanctumStore()
  await store.setEnabled(true)
  assert.equal(refreshed, 1)
  assert.equal(store.error, '开关通信中断')
  assert.equal(store.toggling, false)
  assert.equal(store.readOnly, true)
})
