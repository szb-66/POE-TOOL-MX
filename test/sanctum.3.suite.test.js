import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import _m0_fs from 'node:fs'
import _m0_os from 'node:os'
import _m0_path from 'node:path'
import { createPinia as _m0_createPinia, setActivePinia as _m0_setActivePinia, storeToRefs as _m0_storeToRefs } from 'pinia'
import * as _m0_Vue from 'vue'
import { parse as _m0_parse, compileScript as _m0_compileScript } from '@vue/compiler-sfc'
import { useSanctumStore as _m0_useSanctumStore } from '../src/domains/sanctum/sanctumStore.js'
import { createSanctumStrategy as _m0_createSanctumStrategy, emptySanctumState as _m0_emptySanctumState, SANCTUM_PRESETS as _m0_SANCTUM_PRESETS } from '../shared/sanctum.js'
import { layoutLabels as _m0_layoutLabels } from '../shared/sanctumPresentation.js'
import { afflictionOptions as _m0_afflictionOptions, canAddStrategyWeight as _m0_canAddStrategyWeight } from '../src/domains/sanctum/strategyOptions.js'
import { SanctumService as _m0_SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumRepository as _m0_SanctumRepository } from '../electron/modules/sanctum/repository.js'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import _m1_fs from 'node:fs'
import { SanctumService as _m1_SanctumService } from '../electron/modules/sanctum/service.js'
import { SEASON_BASELINE as _m1_SEASON_BASELINE } from '../shared/seasonBaseline.js'
import { createSanctumStrategy as _m1_createSanctumStrategy, validateSanctumStrategy as _m1_validateSanctumStrategy } from '../shared/sanctum.js'
import { layoutLabels as _m1_layoutLabels } from '../shared/sanctumPresentation.js'
import { afflictionOptions as _m1_afflictionOptions, canAddStrategyWeight as _m1_canAddStrategyWeight } from '../src/domains/sanctum/strategyOptions.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import _m2_fs from 'node:fs'
import { SanctumLiveDriver as _m2_SanctumLiveDriver } from '../electron/modules/sanctum/liveDriver.js'
import { SanctumService as _m2_SanctumService } from '../electron/modules/sanctum/service.js'
import { EmergencyStopCoordinator as _m2_EmergencyStopCoordinator } from '../electron/modules/automation/emergencyStop.js'
import { dispatchShortcutAction as _m2_dispatchShortcutAction, normalizeGlobalShortcutSettings as _m2_normalizeGlobalShortcutSettings } from '../src/utils/shortcutConfig.js'
import { normalizePickerPresentation as _m2_normalizePickerPresentation } from '../electron/modules/window/coordinates.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { availableFeatureCatalog as _m3_availableFeatureCatalog, featureForRoute as _m3_featureForRoute } from '../src/features/featureCatalog.js'

// === Merged from sanctumStrategyAutosave.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const fs = _m0_fs
  const os = _m0_os
  const path = _m0_path
  const createPinia = _m0_createPinia
  const setActivePinia = _m0_setActivePinia
  const storeToRefs = _m0_storeToRefs
  const Vue = _m0_Vue
  const parse = _m0_parse
  const compileScript = _m0_compileScript
  const useSanctumStore = _m0_useSanctumStore
  const createSanctumStrategy = _m0_createSanctumStrategy
  const emptySanctumState = _m0_emptySanctumState
  const SANCTUM_PRESETS = _m0_SANCTUM_PRESETS
  const layoutLabels = _m0_layoutLabels
  const afflictionOptions = _m0_afflictionOptions
  const canAddStrategyWeight = _m0_canAddStrategyWeight
  const SanctumService = _m0_SanctumService
  const SanctumRepository = _m0_SanctumRepository
const clone = value => JSON.parse(JSON.stringify(value))
const tick = () => new Promise(resolve => setImmediate(resolve))
function mountStrategy(store) {
  const source = fs.readFileSync(new URL('../src/domains/sanctum/SanctumStrategy.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const compiled = compileScript(descriptor, { id: 'strategy-test', inlineTemplate: true, genDefaultAs: 'component' }).content
    .replace(/import \{([^}]+)\} from ["']vue["'];?/g, (_, names) => `const {${names.replace(/\s+as\s+/g, ':')}} = Vue;`)
    .replace(/^import .*$/gm, '')
  const currencyManifest = JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/currency/manifest.json', import.meta.url)))
  const bindings = { Vue, storeToRefs, useSanctumActions: () => ({ store }), SANCTUM_PRESETS, createSanctumStrategy,
    layoutLabels, currencyManifest, afflictionOptions, canAddStrategyWeight }
  const component = new Function(...Object.keys(bindings), `${compiled}; return component`)(...Object.values(bindings))
  const node = (type, text = '') => ({ type, text, props: {}, children: [], parent: null })
  const renderer = Vue.createRenderer({
    createElement: type => node(type), createText: text => node('text', text), createComment: () => node('comment'),
    setText: (target, text) => { target.text = text }, setElementText: (target, text) => { target.text = text; target.children = [] },
    patchProp: (target, key, previous, value) => { target.props[key] = value },
    insert(target, parent, anchor) {
      if (target.parent) target.parent.children.splice(target.parent.children.indexOf(target), 1)
      target.parent = parent
      const index = anchor ? parent.children.indexOf(anchor) : -1
      parent.children.splice(index < 0 ? parent.children.length : index, 0, target)
    },
    remove(target) { if (target.parent) target.parent.children.splice(target.parent.children.indexOf(target), 1) },
    parentNode: target => target.parent, nextSibling: target => target.parent?.children[target.parent.children.indexOf(target) + 1]
  })
  const root = node('root'), app = renderer.createApp(component)
  for (const name of ['el-form', 'el-form-item', 'el-select', 'el-option', 'el-input-number', 'el-button']) {
    app.component(name, { setup: (_, { attrs, slots }) => () => Vue.h(name, attrs, slots.default?.()) })
  }
  app.mount(root)
  const flatten = target => [target, ...target.children.flatMap(flatten)]
  const text = target => target.text + target.children.map(text).join('')
  return { app, text: () => text(root), nodes: type => flatten(root).filter(n => n.type === type) }
}
function fixture(t) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const original = globalThis.window, requests = []
  let state = { ...emptySanctumState(), enabled: true }, listener
  globalThis.window = { electronAPI: {
    onSanctumState(callback) { listener = callback; return () => { listener = null } },
    sanctum: {
      async getState() { return { success: true, data: clone(state) } },
      async setModuleEnabled() { return { success: true, data: clone(state) } },
      saveStrategy(strategy) { return new Promise((resolve, reject) => requests.push({ strategy, resolve, reject })) }
    }
  } }
  const store = useSanctumStore()
  t.after(() => { store.$dispose(); globalThis.window = original })
  return { store, requests, pinia,
    publish(strategy = state.strategy, enabled = true) {
      state = { ...state, strategy: clone(strategy), enabled }
      listener?.(clone(state))
    },
    succeed(index, enabled = true) {
      state = { ...state, strategy: requests[index].strategy, enabled }
      listener?.(clone(state))
      requests[index].resolve({ success: true, data: clone(state) })
    } }
}

test('初始化和后台同步不保存，草稿不与服务状态共享引用', async t => {
  const f = fixture(t)
  await f.store.initialize()
  f.publish(createSanctumStrategy('quantity'))
  assert.equal(f.store.strategyDraft.preset, 'quantity')
  f.store.strategyDraft.layoutPreference.miniboss = 17
  assert.notEqual(f.store.state.strategy.layoutPreference.miniboss, 17)
  assert.equal(f.requests.length, 0)
  assert.equal(f.store.strategySaveStatus, 'idle')
})

test('保存串行合并最新编辑，后台旧推送和页签重新获取 store 不丢草稿', async t => {
  const f = fixture(t)
  await f.store.initialize()
  f.store.strategyDraft.layoutPreference.miniboss = 1
  const saving = f.store.saveStrategyDraft()
  f.store.strategyDraft.layoutPreference.miniboss = 2
  f.store.saveStrategyDraft()
  f.store.strategyDraft.layoutPreference.miniboss = 3
  f.store.saveStrategyDraft()
  f.publish(createSanctumStrategy('quantity'))
  assert.equal(useSanctumStore(f.pinia).strategyDraft.layoutPreference.miniboss, 3)
  assert.equal(f.requests.length, 1)
  assert.equal(f.requests[0].strategy.layoutPreference.miniboss, 1)
  f.succeed(0)
  await tick()
  assert.equal(f.store.strategyDraft.layoutPreference.miniboss, 3)
  assert.equal(f.store.strategySaveStatus, 'saving')
  assert.equal(f.requests.length, 2)
  assert.equal(f.requests[1].strategy.layoutPreference.miniboss, 3)
  f.succeed(1)
  assert.equal(await saving, true)
  assert.equal(f.store.strategySaveStatus, 'saved')
  assert.equal(f.store.state.strategy.layoutPreference.miniboss, 3)
  await tick()
  assert.equal(f.requests.length, 2)
})

for (const reject of [false, true]) {
  test(`保存${reject ? '通信异常' : '返回失败'}保留最新草稿和独立错误并允许重试`, async t => {
    const f = fixture(t)
    await f.store.initialize()
    f.store.strategyDraft.toleratedAfflictions = ['痛苦甲']
    const saving = f.store.saveStrategyDraft()
    f.store.strategyDraft.bannedAfflictions = ['痛苦乙']
    f.store.saveStrategyDraft()
    if (reject) f.requests[0].reject(new Error('磁盘不可写'))
    else f.requests[0].resolve({ success: false, error: '磁盘不可写' })
    assert.equal(await saving, false)
    assert.equal(f.store.strategySaveStatus, 'error')
    await f.store.refresh()
    assert.equal(f.store.strategySaveError, '磁盘不可写')
    assert.deepEqual(f.store.strategyDraft.bannedAfflictions, ['痛苦乙'])
    assert.equal(f.requests.length, 1)
    const retry = f.store.saveStrategyDraft()
    assert.deepEqual(f.requests[1].strategy.toleratedAfflictions, ['痛苦甲'])
    assert.deepEqual(f.requests[1].strategy.bannedAfflictions, ['痛苦乙'])
    f.succeed(1)
    assert.equal(await retry, true)
    assert.equal(f.store.strategySaveError, '')
  })
}

test('关闭时不提交，保存途中关闭保留队列草稿，重新启用后可重试', async t => {
  const f = fixture(t)
  await f.store.initialize()
  f.publish(undefined, false)
  assert.equal(await f.store.saveStrategyDraft(), false)
  assert.equal(f.requests.length, 0)
  f.publish(undefined, true)
  const saving = f.store.saveStrategyDraft()
  f.store.strategyDraft.layoutPreference.miniboss = 9
  f.store.saveStrategyDraft()
  f.succeed(0, false)
  assert.equal(await saving, false)
  assert.equal(f.requests.length, 1)
  assert.equal(f.store.strategySaveStatus, 'error')
  f.publish(undefined, true)
  assert.equal(f.store.strategyDraft.layoutPreference.miniboss, 9)
  const retry = f.store.saveStrategyDraft()
  f.succeed(1)
  assert.equal(await retry, true)
})

test('真实服务的 stop 推送不覆盖草稿，自动保存后重启从磁盘恢复策略', async t => {
  const f = fixture(t)
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-autosave-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const service = new SanctumService({ repository: new SanctumRepository(root) })
  service.setEnabled(true)
  globalThis.window.electronAPI.onSanctumState = callback => service.subscribe(callback)
  globalThis.window.electronAPI.sanctum.setModuleEnabled = async () => ({ success: true, data: service.getState() })
  globalThis.window.electronAPI.sanctum.saveStrategy = async value => ({ success: true, data: service.saveStrategy(value) })
  await f.store.initialize()
  f.store.strategyDraft = createSanctumStrategy('quantity')
  f.store.strategyDraft.layoutPreference.miniboss = 23
  f.store.strategyDraft.targetPriority['混沌石'] = 4
  f.store.strategyDraft.bannedAfflictions = ['历史痛苦']
  assert.equal(await f.store.saveStrategyDraft(), true)
  const expected = clone(f.store.strategyDraft)
  const restarted = new SanctumService({ repository: new SanctumRepository(root) })
  assert.deepEqual(restarted.getState().strategy, expected)
  f.store.disconnect()
  await service.shutdown()
  await restarted.shutdown()
})

test('实际策略组件的所有编辑入口自动保存，仅选择待添加项不提交', async t => {
  const f = fixture(t)
  await f.store.initialize()
  const view = mountStrategy(f.store)
  t.after(() => view.app.unmount())
  assert.equal(f.requests.length, 0)
  assert.doesNotMatch(view.text(), /保存策略/)
  async function settle() {
    const index = f.requests.length - 1
    f.succeed(index)
    await tick()
    assert.match(view.text(), /已保存/)
  }
  view.nodes('el-select')[0].props.onChange('quantity')
  await Vue.nextTick()
  assert.match(view.text(), /保存中/)
  assert.equal(f.requests[0].strategy.preset, 'quantity')
  await settle()
  const weight = view.nodes('el-input-number')[0]
  weight.props['onUpdate:modelValue'](42)
  weight.props.onChange(42)
  assert.equal(f.requests.length, 2)
  assert.ok(Object.values(f.requests[1].strategy.targetPriority).includes(42))
  await settle()
  const chooseReward = view.nodes('el-select').find(n => n.props.placeholder === '选择目标奖励')
  chooseReward.props['onUpdate:modelValue']('混沌石')
  await Vue.nextTick()
  assert.equal(f.requests.length, 2)
  view.nodes('el-button')[0].props.onClick()
  assert.equal(f.requests[2].strategy.targetPriority['混沌石'], 1)
  await settle()
  for (const [placeholder, group] of [['选择可容忍痛苦', 'toleratedAfflictions'], ['选择禁选痛苦', 'bannedAfflictions']]) {
    for (const value of [['历史痛苦'], []]) {
      const select = view.nodes('el-select').find(n => n.props.placeholder === placeholder)
      select.props['onUpdate:modelValue'](value)
      select.props.onChange(value)
      assert.deepEqual(f.requests.at(-1).strategy[group], value)
      await settle()
    }
  }
})

test('组件卸载重建保留未保存值，失败状态和重试按钮正确显示', async t => {
  const f = fixture(t)
  await f.store.initialize()
  let view = mountStrategy(f.store)
  t.after(() => view.app.unmount())
  view.nodes('el-select')[0].props.onChange('quantity')
  view.app.unmount()
  view = mountStrategy(f.store)
  assert.equal(view.nodes('el-select')[0].props['model-value'], 'quantity')
  assert.match(view.text(), /保存中/)
  f.requests[0].resolve({ success: false, error: '磁盘不可写' })
  await tick()
  assert.match(view.text(), /保存失败：磁盘不可写/)
  const retry = view.nodes('el-button').at(-1)
  retry.props.onClick()
  f.succeed(1)
  await tick()
  assert.match(view.text(), /已保存/)
})
})()

// === Merged from sanctumStrategySelectors.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const fs = _m1_fs
  const SanctumService = _m1_SanctumService
  const SEASON_BASELINE = _m1_SEASON_BASELINE
  const createSanctumStrategy = _m1_createSanctumStrategy
  const validateSanctumStrategy = _m1_validateSanctumStrategy
  const layoutLabels = _m1_layoutLabels
  const afflictionOptions = _m1_afflictionOptions
  const canAddStrategyWeight = _m1_canAddStrategyWeight
test('痛苦摘要只提供当前赛季官方审核条目及中文描述', () => {
  const entry = { id: 'affliction:a', name: '痛苦甲', kind: 'affliction', descriptions: ['描述'],
    applicability: 'current', reviewedPatch: SEASON_BASELINE.patch, sourceId: 'official' }
  const catalog = { schemaVersion: 1, game: 'poe1', patch: SEASON_BASELINE.patch,
    sources: [{ id: 'official', channel: 'official' }], entries: [entry,
      { ...entry, id: 'old', reviewedPatch: 'old' }, { ...entry, id: 'unknown', applicability: 'unverified' },
      { ...entry, id: 'community', sourceId: 'community' }, { ...entry, id: 'boon', kind: 'boon' }] }
  const service = new SanctumService({ catalog })
  assert.deepEqual(service.getState().catalogSummary.afflictions, [{ id: entry.id, label: entry.name, descriptions: ['描述'] }])
  service.catalog = { ...catalog, patch: 'old' }
  assert.deepEqual(service.getState().catalogSummary.afflictions, [])
})

test('奖励名称及六种玩法限制新增，并阻止重复和任意输入', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../electron/assets/sanctum/currency/manifest.json', import.meta.url)))
  const rewards = manifest.entries.map(entry => ({ id: entry.name }))
  const layouts = Object.keys(layoutLabels).map(id => ({ id }))
  const strategy = createSanctumStrategy()
  assert.equal(layouts.length, 6)
  assert.equal(canAddStrategyWeight(strategy, 'layoutPreference', 'boss', layouts), true)
  assert.equal(canAddStrategyWeight(strategy, 'layoutPreference', 'exit', layouts), false)
  assert.equal(canAddStrategyWeight(strategy, 'targetPriority', '混沌石', rewards), true)
  assert.equal(canAddStrategyWeight(strategy, 'targetPriority', '神圣石', rewards), false)
  for (const key of ['', '未知货币', '__proto__']) assert.equal(canAddStrategyWeight(strategy, 'targetPriority', key, rewards), false)
})

test('历史名称和未知痛苦原值往返，移除后不会成为可新增选项', () => {
  const catalog = [{ id: 'affliction:a', label: '痛苦甲', descriptions: ['描述'] }]
  const strategy = createSanctumStrategy()
  strategy.toleratedAfflictions = ['痛苦甲', '历史未知']
  strategy.bannedAfflictions = ['affliction:a']
  const options = afflictionOptions(catalog, strategy.toleratedAfflictions)
  assert.equal(options.find(option => option.id === 'affliction:a').disabled, true)
  assert.equal(options.find(option => option.id === '痛苦甲').label, '痛苦甲')
  assert.deepEqual(validateSanctumStrategy(strategy).toleratedAfflictions, ['痛苦甲', '历史未知'])
  strategy.toleratedAfflictions = []
  assert.deepEqual(afflictionOptions(catalog, []), [{ ...catalog[0], disabled: false }])
  assert.deepEqual(afflictionOptions(undefined, ['历史未知']).map(option => option.id), ['历史未知'])
  const service = new SanctumService({})
  service.setEnabled(true)
  service.saveStrategy(strategy)
  assert.deepEqual(service.getState().strategy.toleratedAfflictions, [])
  assert.deepEqual(service.getState().strategy.bannedAfflictions, ['affliction:a'])
})
})()

// === Merged from sanctumTitleStop.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const fs = _m2_fs
  const SanctumLiveDriver = _m2_SanctumLiveDriver
  const SanctumService = _m2_SanctumService
  const EmergencyStopCoordinator = _m2_EmergencyStopCoordinator
  const dispatchShortcutAction = _m2_dispatchShortcutAction
  const normalizeGlobalShortcutSettings = _m2_normalizeGlobalShortcutSettings
  const normalizePickerPresentation = _m2_normalizePickerPresentation
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII='

test('公共检测过期不参与原生请求校验，仍检查日志与取消', async () => {
  let requests = 0
  const driver = new SanctumLiveDriver({ withHidden: fn => fn(), detection: {
    getState: () => ({ receivedAt: 0 }), subscribe: () => assert.fail('不应订阅公共识别') } })
  driver.profile = {}
  driver.logContext = { assertCurrent() {} }
  driver.client = { async request() { requests++; return { environment: { processId: 123 } } } }
  await driver.sessionRequest('interfaceState', {}, new AbortController().signal)
  assert.equal(requests, 1)
  const controller = new AbortController(); controller.abort()
  await assert.rejects(driver.sessionRequest('interfaceState', {}, controller.signal))
  assert.equal(requests, 1)
})

test('公共标题配置只发送运行必需数据，截图预览不进入原生请求', () => {
  const driver = new SanctumLiveDriver({ detection: { getTitleConfig: () => ({ threshold: .91, templates: { 'sanctum-map': { png }, 'sanctum-altar': { png } } }) } })
  const value = driver.titleOptions({ captures: { mapRegion: { png } }, preview: { png }, environment: {} })
  assert.equal(value.captures, undefined)
  assert.equal(value.preview, undefined)
  assert.equal(value.matchThreshold, .91)
  assert.deepEqual(Object.keys(value.interfaceTitles), ['sanctum-map'])
})

test('全局快捷键分派到同一协调器，准备、悬停、复制和高亮停止后丢弃迟到结果', async () => {
  for (const phase of ['preparing', 'hover', 'copy', 'highlight']) {
    const service = new SanctumService({})
    service.setEnabled(true); service.liveDriver = { close: async () => {} }
    let release, signal
    const task = service.runLiveAction(value => { signal = value; return new Promise(resolve => { release = resolve }) }, () => { service.state.reason = '不应应用' })
    await new Promise(resolve => setImmediate(resolve))
    service.state.status = phase
    const coordinator = new EmergencyStopCoordinator([{ id: 'sanctum', label: '圣所', stop: () => service.emergencyStop() }])
    const config = normalizeGlobalShortcutSettings({ end: 'Ctrl+Shift+F12' })
    assert.equal(config.end, 'Ctrl+Shift+F12')
    await dispatchShortcutAction('end', { end: () => coordinator.stopAll('shortcut') })
    assert.equal(signal.aborted, true)
    release({}); await task
    assert.equal(service.state.running, false)
    assert.notEqual(service.state.reason, '不应应用')
    await service.shutdown()
  }
  const source = fs.readFileSync(new URL('../src/assets/scripts/sanctum_native.py', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /0x23|Key\.end|End/)
  const view = fs.readFileSync(new URL('../src/domains/sanctum/SanctumView.vue', import.meta.url), 'utf8')
  assert.match(view, /settings\.globalShortcuts\.end/)
  const ipc = fs.readFileSync(new URL('../electron/modules/ipc/sanctum.js', import.meta.url), 'utf8')
  assert.match(ipc, /emergencyStop\.stopAll\('sanctum-page'\)/)
})

test('动态选择器网格限制有效行列，不改变已有用途默认配置', () => {
  assert.deepEqual(normalizePickerPresentation({ purpose: 'bag-inventory' }), { grid: undefined, title: undefined, hint: undefined })
  assert.deepEqual(normalizePickerPresentation({ grid: { columns: 12, rows: 12 }, title: '圣物仓库', hint: '拉出完整网格' }), { grid: { columns: 12, rows: 12 }, title: '圣物仓库', hint: '拉出完整网格' })
  for (const columns of [0, 25, 1.5, '5', NaN]) assert.throws(() => normalizePickerPresentation({ grid: { columns, rows: 4 } }))
})
})()

// === Merged from sanctumView.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const availableFeatureCatalog = _m3_availableFeatureCatalog
  const featureForRoute = _m3_featureForRoute
test('圣所模块已在正式功能目录与路由中注册', () => {
  assert.equal(availableFeatureCatalog().some((feature) => feature.id === 'sanctum'), true)
  assert.equal(featureForRoute('/sanctum', { development: true }).id, 'sanctum')
})
})()
