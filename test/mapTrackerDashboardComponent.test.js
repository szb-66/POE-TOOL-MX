import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as Vue from 'vue'
import { mapLabel } from '../shared/mapTrackerLabels.js'
import { buildDashboardSummary } from '../shared/mapTrackerDashboard.js'

function mountDashboard(store) {
  const source = readFileSync(new URL('../src/domains/mapTracker/MapTrackerDashboard.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const compiled = compileScript(descriptor, { id: 'dashboard-test', inlineTemplate: true, genDefaultAs: 'component' }).content
    .replace(/import \{([^}]+)\} from ["']vue["'];?/g, (_, names) => `const {${names.replace(/\s+as\s+/g, ':')}} = Vue;`)
    .replace(/^import .*$/gm, '')
  const component = new Function('Vue', 'useMapTrackerStore', 'electronApi', 'ElMessage', 'mapLabel', `${compiled}; return component`)(Vue, () => store, { mapTracker: { characterBridgeStatus: () => 'ready' } }, { error() {} }, mapLabel)
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
  const root = node('root'); const app = renderer.createApp(component)
  for (const name of ['el-alert', 'el-switch', 'el-button', 'el-table', 'el-table-column']) {
    app.component(name, { setup: (_, { attrs, slots }) => () => Vue.h('div', attrs, name === 'el-table-column' ? [] : slots.default?.()) })
  }
  app.mount(root)
  const flatten = target => [target, ...target.children.flatMap(flatten)]
  const text = target => target.text + target.children.map(text).join('')
  return { app, root, text, find: predicate => flatten(root).find(predicate), buttons: () => flatten(root).filter(target => target.type === 'button') }
}

test('实际 Vue 组件三指标和三时段切换，今日数字固定且跨指标保留时间选择', async (t) => {
  const now = new Date(2026, 8, 7, 12).getTime()
  const iso = value => new Date(value).toISOString()
  const runs = [1, 2].map(id => ({ id: String(id), areaName: '墓地', mapTier: 16, startedAt: iso(now - id * 3600000), endedAt: iso(now - id * 1800000), activeDurationMs: 60000 * id, loot: [{ name: '混沌石', quantity: id * 10, recordedAt: iso(now - id * 1800000) }] }))
  const store = Vue.reactive({ snapshot: { settings: {}, summary: { ...buildDashboardSummary({ runs, stashEvents: runs.flatMap(run => run.loot), now }) } }, enabled: true, activeRun: null })
  const view = mountDashboard(store); t.after(() => view.app.unmount())
  const button = label => view.buttons().find(target => view.text(target).startsWith(label))
  const click = async label => { button(label).props.onClick(); await Vue.nextTick() }
  const currentPanel = () => view.find(target => target.props.id === 'mapping-metric-content')
  assert.equal(button('今日经验'), undefined)
  assert.equal(button('今日完成').props['aria-pressed'], true)
  assert.equal(button('24 小时').props['aria-pressed'], true)
  const initialNumbers = ['今日完成', '今日入库', '平均用时'].map(label => view.text(button(label)))
  for (const hours of [6, 1, 24]) {
    await click(`${hours} 小时`)
    for (const [label, title] of [['今日入库', '入库物品记录'], ['平均用时', '各地图平均用时'], ['今日完成', '完成地图趋势']]) {
      await click(label)
      assert.equal(currentPanel().props['aria-label'], title)
      assert.equal(button(`${hours} 小时`).props['aria-pressed'], true)
      assert.deepEqual(['今日完成', '今日入库', '平均用时'].map(name => view.text(button(name))), initialNumbers)
    }
  }
  await click('今日入库')
  assert.equal(view.find(target => target.props['aria-label'] === '入库物品明细').props.data[0].quantity, 30)
  store.snapshot.summary = { ...buildDashboardSummary({ now }) }
  await Vue.nextTick()
  assert.match(view.text(currentPanel()), /所选时段暂无入库记录/)
})

test('关闭追踪收起统计并保留设置和历史入口，重开恢复统计', async t => {
  const store = Vue.reactive({ snapshot: { settings: {}, summary: {} }, enabled: true, busy: false, activeRun: null })
  const view = mountDashboard(store); t.after(() => view.app.unmount())
  assert.ok(view.find(target => target.props.id === 'mapping-metric-content'))
  store.enabled = false; await Vue.nextTick()
  assert.equal(view.find(target => target.props.id === 'mapping-metric-content'), undefined)
  assert.match(view.text(view.root), /刷图设置/); assert.match(view.text(view.root), /历史战绩/)
  store.enabled = true; await Vue.nextTick()
  assert.ok(view.find(target => target.props.id === 'mapping-metric-content'))
})
