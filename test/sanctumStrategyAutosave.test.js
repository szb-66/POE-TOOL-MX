import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createPinia, setActivePinia, storeToRefs } from 'pinia'
import * as Vue from 'vue'
import { parse, compileScript } from '@vue/compiler-sfc'
import { useSanctumStore } from '../src/domains/sanctum/sanctumStore.js'
import { createSanctumStrategy, emptySanctumState, SANCTUM_PRESETS } from '../shared/sanctum.js'
import { layoutLabels } from '../shared/sanctumPresentation.js'
import { afflictionOptions, canAddStrategyWeight } from '../src/domains/sanctum/strategyOptions.js'
import { SanctumService } from '../electron/modules/sanctum/service.js'
import { SanctumRepository } from '../electron/modules/sanctum/repository.js'

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
