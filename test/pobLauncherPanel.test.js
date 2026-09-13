import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as Vue from 'vue'

const snapshot = (values = {}) => ({ directory: 'installed', charm: { installed: true, version: '' },
  pob: { installed: true, version: '' }, supported: true, busy: false, revision: 1, ...values })
const flush = async () => { await new Promise(resolve => setImmediate(resolve)); await Vue.nextTick() }

test('真实卡片更新切换停止，其他操作禁用，阶段进度及过期快照处理', async t => {
  let receive, finish, stopped
  const api = { getState: async () => ({ success: true, state: snapshot() }), onState: listener => { receive = listener; return () => {} },
    update: () => new Promise(resolve => { finish = resolve }), stop: async id => {
      stopped = id
      return { success: true, state: snapshot({ busy: true, operation: 'update', operationId: 'one', revision: 4, stopping: true }) }
    } }
  const view = mountPanel(api); t.after(() => view.app.unmount()); await flush()
  const button = label => view.buttons().find(node => view.text(node) === label)
  assert.equal(button('安装').props.disabled, true)
  const updating = button('更新').props.onClick()
  receive(snapshot({ busy: true, cancellable: true, operation: 'update', operationId: 'one', revision: 3,
    message: 'PoeCharm · 解压', progress: { percent: 62, received: 62, total: 100, unit: 'bytes' } }))
  await flush()
  assert.equal(button('停止').props.disabled, false)
  for (const label of ['安装', '启动', '选择目录', '清空']) assert.equal(button(label).props.disabled, true)
  assert.match(view.text(view.root), /PoeCharm · 解压.*62 B \/ 100 B/)
  receive(snapshot({ revision: 2 }))
  await flush()
  assert.ok(button('停止'))
  await button('停止').props.onClick()
  await flush()
  assert.equal(stopped, 'one')
  assert.equal(button('正在停止…').props.disabled, true)
  finish({ success: false, cancelled: true, state: snapshot({ revision: 5, phase: 'cancelled', message: '已停止' }) })
  await updating; await flush()
  assert.equal(button('更新').props.disabled, false)
  assert.equal(button('安装').props.disabled, true)
})

test('IPC 拒绝后重新读状态，成功与业务错误不会变成连接失败', async t => {
  let current = snapshot()
  const api = { getState: async () => ({ success: !current.error, error: current.error, state: current }), onState: () => () => {},
    update: async () => { current = snapshot({ revision: current.revision + 1, operation: 'update', operationId: 'new', message: '更新完成' }); throw new Error('reply lost') } }
  const view = mountPanel(api); t.after(() => view.app.unmount()); await flush()
  const update = () => view.buttons().find(node => view.text(node) === '更新').props.onClick()
  await update(); await flush()
  assert.match(view.text(view.root), /更新完成/)
  assert.equal(view.find(node => node.props.type === 'error'), undefined)
  api.update = async () => { current = snapshot({ revision: current.revision + 1, phase: 'error', error: '解压失败：权限不足' }); throw new Error('reply lost') }
  await update(); await flush()
  assert.equal(view.find(node => node.props.type === 'error').props.title, '解压失败：权限不足')
  api.getState = async () => { throw new Error('disconnected') }
  await update(); await flush()
  assert.match(view.find(node => node.props.type === 'error').props.title, /通信失败/)
})
function mountPanel(api) {
  const source = readFileSync(new URL('../src/domains/pobExport/PobLauncherPanel.vue', import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const compiled = compileScript(descriptor, { id: 'dashboard-test', inlineTemplate: true, genDefaultAs: 'component' }).content
    .replace(/import \{([^}]+)\} from ["']vue["'];?/g, (_, names) => `const {${names.replace(/\s+as\s+/g, ':')}} = Vue;`)
    .replace(/^import .*$/gm, '')
  const component = new Function('Vue', 'electronApi', `${compiled}; return component`)(Vue, { pobLauncher: api })
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
  for (const name of ['el-alert', 'el-button', 'el-input', 'el-tag', 'el-progress']) {
    app.component(name, { setup: (_, { attrs, slots }) => () => Vue.h(name === 'el-button' ? 'button' : 'div', attrs, slots.default?.()) })
  }
  app.mount(root)
  const flatten = target => [target, ...target.children.flatMap(flatten)]
  const text = target => target.text + target.children.map(text).join('')
  return { app, root, text, find: predicate => flatten(root).find(predicate), buttons: () => flatten(root).filter(target => target.type === 'button') }
}

