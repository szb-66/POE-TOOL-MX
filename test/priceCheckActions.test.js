import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as Vue from 'vue'
import { createPriceCheckPreview } from '../src/domains/priceCheck/priceCheckPreview.js'
import { PRICE_CHECK_STATE_FILTERS, PRICE_CHECK_STAT_TYPES } from '../shared/priceCheckMetadata.js'

async function mountOverlay(openOfficial) {
  const source = readFileSync(new URL('../src/domains/priceCheck/PriceCheckOverlayView.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const compiled = compileScript(descriptor, { id: 'price-check-test', inlineTemplate: true, genDefaultAs: 'component' }).content
    .replace(/import \{([^}]+)\} from ["']vue["'];?/g, (_, names) => `const {${names.replace(/\s+as\s+/g, ':')}} = Vue;`)
    .replace(/^import .*$/gm, '')
  let update
  const snapshot = { status: 'ready', league: 'S30', model: createPriceCheckPreview().state.model, result: { queryId: 'q-1', total: 1, listings: [{ id: 'abc', amount: 1, currency: 'chaos' }] } }
  const api = { priceCheck: {
    openOfficial, onOverlayState: callback => { update = callback; return () => {} },
    onSettingsChanged: () => () => {}, getOverlayState: async () => ({ success: true, data: snapshot })
  } }
  const component = new Function('Vue', 'useSettingsStore', 'electronApi', 'ArrowDown', 'PRICE_CHECK_STATE_FILTERS', 'PRICE_CHECK_STAT_TYPES', `${compiled}; return component`)(Vue, () => ({ globalShortcuts: {} }), api, { render: () => null }, PRICE_CHECK_STATE_FILTERS, PRICE_CHECK_STAT_TYPES)
  const node = (type, text = '') => ({ type, text, props: {}, children: [], parent: null })
  const renderer = Vue.createRenderer({
    createElement: type => node(type), createText: text => node('text', text), createComment: text => node('comment', text),
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
  for (const name of ['el-select', 'el-option', 'el-switch', 'el-input-number', 'el-icon']) {
    app.component(name, { setup: (_, { attrs, slots }) => () => Vue.h('div', attrs, slots.default?.()) })
  }
  app.mount(root)
  await Vue.nextTick(); await Vue.nextTick()
  const flatten = target => [target, ...target.children.flatMap(flatten)]
  const text = target => target.text + target.children.map(text).join('')
  return { app, root, text, update, snapshot, button: () => flatten(root).find(n => n.type === 'button' && text(n) === '网页市集'), alerts: () => flatten(root).filter(n => n.props.role === 'alert') }
}

test('网页市集显示 IPC 失败和异常，保留结果并可重试，阻止重复点击', async t => {
  let complete, calls = 0
  const view = await mountOverlay(() => { calls++; return new Promise(resolve => { complete = resolve }) })
  t.after(() => view.app.unmount())
  const pending = view.button().props.onClick()
  await Vue.nextTick()
  assert.equal(view.button().props.disabled, true)
  await view.button().props.onClick()
  assert.equal(calls, 1)
  complete({ success: false, error: { message: '官方编号无效' } })
  await pending; await Vue.nextTick()
  assert.equal(view.text(view.alerts()[0]), '官方编号无效')
  assert.match(view.text(view.root), /共找到 1 个物品/)
  assert.equal(view.button().props.disabled, false)
  const retry = view.button().props.onClick()
  await Vue.nextTick()
  assert.equal(view.alerts().length, 0)
  complete({ success: true, data: { opened: true } })
  await retry; await Vue.nextTick()
  assert.equal(view.alerts().length, 0)
})

test('网页调用抛出异常也可见，新查询清除旧错误', async t => {
  const view = await mountOverlay(async () => { throw new Error('browser unavailable') })
  t.after(() => view.app.unmount())
  await view.button().props.onClick(); await Vue.nextTick()
  assert.equal(view.text(view.alerts()[0]), 'browser unavailable')
  assert.equal(view.button().props.disabled, false)
  assert.match(view.text(view.root), /共找到 1 个物品/)
  view.update({ ...view.snapshot, status: 'loading' }); await Vue.nextTick()
  assert.equal(view.alerts().length, 0)
})

