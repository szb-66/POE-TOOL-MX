import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as Vue from 'vue'

function mountSettings(localization, marketLocalization) {
  const { descriptor } = parse(readFileSync(new URL('../src/domains/settings/GameLocalizationSettings.vue', import.meta.url), 'utf8'))
  const compiled = compileScript(descriptor, { id: 'localization-settings-test', inlineTemplate: true, genDefaultAs: 'component' }).content
    .replace(/import \{([^}]+)\} from ["']vue["'];?/g, (_, names) => `const {${names.replace(/\s+as\s+/g, ':')}} = Vue;`)
    .replace(/^import .*$/gm, '')
  const component = new Function('Vue', 'electronApi', 'window', `${compiled}; return component`)(Vue, { localization, marketLocalization }, { electronAPI: {} })
  const node = (type, text = '') => ({ type, text, props: {}, children: [], parent: null })
  const renderer = Vue.createRenderer({
    createElement: type => node(type), createText: text => node('text', text), createComment: () => node('comment'),
    setText: (target, text) => { target.text = text }, setElementText: (target, text) => { target.text = text; target.children = [] },
    patchProp: (target, key, _previous, value) => { target.props[key] = value },
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
  for (const name of ['el-card', 'el-form', 'el-form-item', 'el-input', 'el-select', 'el-option', 'el-button', 'el-alert', 'el-switch']) {
    app.component(name, { setup: (_, { attrs, slots }) => () => Vue.h(name === 'el-button' ? 'button' : 'div', attrs, name === 'el-alert' ? attrs.title : slots.default?.()) })
  }
  app.mount(root)
  const flatten = target => [target, ...target.children.flatMap(flatten)]
  const text = target => target.text + target.children.map(text).join('')
  return { app, root, text, buttons: () => flatten(root).filter(target => target.type === 'button').map(text), button: label => flatten(root).find(target => target.type === 'button' && text(target) === label), find: predicate => flatten(root).find(predicate) }
}

const flush = async () => { await new Promise(resolve => setImmediate(resolve)); await Vue.nextTick() }

test('切简体允许自动检测目录，单次提交完整任务并展示进度与完成结果，恢复仍可用', async t => {
  let emitState
  let finishApply
  const calls = []
  const initial = { helperAvailable: true, gameDirectory: '', busy: false }
  const applied = { ...initial, mode: 'simplified', gameDirectory: 'E:\\SteamLibrary\\Path of Exile', scan: { gameVersion: '3.30.0b', applied: true, counts: { simplified: 30, traditional: 2, english: 1 } } }
  const view = mountSettings({
    status: async () => ({ success: true, data: initial }),
    onState: callback => { emitState = callback; return () => {} },
    apply: input => { calls.push(['apply', input]); return new Promise(resolve => { finishApply = resolve }) },
    restore: async input => { calls.push(['restore', input]); return { success: true, data: { ...applied, mode: null, scan: { ...applied.scan, applied: false } } } }
  })
  t.after(() => view.app.unmount())
  await flush()
  assert.deepEqual(view.buttons(), ['选择目录', '切简体', '切繁体', '恢复原版'])
  assert.equal(view.button('切简体').props.disabled, false)
  assert.match(view.text(view.root), /等待检测/)
  assert.doesNotMatch(view.text(view.root), /一键汉化|预览匹配|检测并扫描|下载变化资源|完整性验证|已下载词库/)
  const request = view.button('切简体').props.onClick()
  await view.button('切简体').props.onClick()
  await view.button('切繁体').props.onClick()
  assert.deepEqual(calls, [['apply', { gameDirectory: '', mode: 'simplified' }]])
  emitState({ ...initial, busy: true, phase: 'download', progress: { completed: 2, total: 5 } })
  await Vue.nextTick()
  assert.equal(view.button('切简体').props.disabled, true)
  assert.equal(view.button('切简体').props.loading, true)
  assert.equal(view.button('切繁体').props.loading, false)
  assert.match(view.text(view.find(node => node.props.role === 'status')), /正在下载汉化资源.*2 \/ 5/)
  finishApply({ success: true, data: applied })
  await request; await Vue.nextTick()
  assert.match(view.text(view.root), /已切换简体，可以启动游戏/)
  assert.match(view.text(view.root), /30 \/ 2 \/ 1/)
  assert.equal(view.button('恢复原版').props.disabled, false)
  await view.button('恢复原版').props.onClick(); await Vue.nextTick()
  assert.deepEqual(calls[1], ['restore', { gameDirectory: applied.gameDirectory }])
  assert.match(view.text(view.root), /尚未切换/)
})

test('切繁体提交本地模式，单独展示忙碌状态且不展示零值覆盖统计', async t => {
  const calls = []
  let finishApply
  const view = mountSettings({
    status: async () => ({ success: true, data: { helperAvailable: true, mode: 'simplified', scan: { applied: true } } }),
    onState: () => () => {},
    apply: input => { calls.push(input); return new Promise(resolve => { finishApply = resolve }) }
  })
  t.after(() => view.app.unmount())
  await flush()
  const request = view.button('切繁体').props.onClick()
  await Vue.nextTick()
  assert.equal(view.button('切繁体').props.loading, true)
  assert.equal(view.button('切简体').props.loading, false)
  assert.equal(view.button('切简体').props.disabled, true)
  assert.deepEqual(calls, [{ gameDirectory: '', mode: 'traditional' }])
  finishApply({ success: true, data: { helperAvailable: true, mode: 'traditional', scan: { applied: true, mode: 'traditional', counts: { simplified: 0, traditional: 0, english: 0 } } } })
  await request; await Vue.nextTick()
  assert.match(view.text(view.root), /已切换繁体，可以启动游戏/)
  assert.match(view.text(view.root), /汉化状态已切换繁体/)
  assert.doesNotMatch(view.text(view.root), /简体 \/ 繁体 \/ 英文|0 \/ 0 \/ 0/)
})

test('语言切换失败显示具体原因并允许重试，卸载后解除状态订阅', async t => {
  let unsubscribed = false
  const view = mountSettings({
    status: async () => ({ success: true, data: { helperAvailable: true } }),
    onState: () => () => { unsubscribed = true },
    apply: async () => ({ success: false, error: { message: '请先退出游戏' } })
  })
  t.after(() => { if (!unsubscribed) view.app.unmount() })
  await flush()
  await view.button('切简体').props.onClick(); await Vue.nextTick()
  assert.match(view.text(view.root), /请先退出游戏/)
  assert.equal(view.button('切简体').props.disabled, false)
  assert.equal(view.button('切繁体').props.disabled, false)
  view.app.unmount()
  assert.equal(unsubscribed, true)
})

test('重开页面保留已验证汉化状态，外部修改使旧扫描失效且不显示成功', async t => {
  let emitState
  const active = { helperAvailable: true, resourceVersion: 'verified-release', mappingState: 'active' }
  const view = mountSettings({
    status: async () => ({ success: true, data: active }),
    onState: callback => { emitState = callback; return () => {} }
  })
  t.after(() => view.app.unmount())
  await flush()
  assert.match(view.text(view.root), /汉化状态已切换简体/)
  assert.doesNotMatch(view.text(view.root), /尚未切换|等待检测/)
  emitState({ ...active, mappingState: 'unavailable', scan: { applied: true }, mappingWarning: '游戏文件已更新' })
  await Vue.nextTick()
  assert.match(view.text(view.root), /需要重新切换语言/)
  assert.doesNotMatch(view.text(view.root), /已切换简体，可以启动游戏/)
  emitState({ helperAvailable: true, mode: 'traditional', mappingState: 'none' })
  await Vue.nextTick()
  assert.match(view.text(view.root), /汉化状态已切换繁体/)
})

test('跨版本保留选择单独展示，尚未重新应用不展示成功，缓存复用标明来源', async t => {
  let emitState
  const initial = { helperAvailable: true, preferredMode: 'simplified', mode: null, mappingState: 'none', scan: { gameVersion: '3.30.0b', applied: false } }
  const view = mountSettings({
    status: async () => ({ success: true, data: initial }),
    onState: callback => { emitState = callback; return () => {} }
  })
  t.after(() => view.app.unmount())
  await flush()
  assert.match(view.text(view.root), /语言选择简体（跨版本保留）/)
  assert.match(view.text(view.root), /已保留语言选择，等待重新应用/)
  assert.doesNotMatch(view.text(view.root), /已切换简体，可以启动游戏/)
  emitState({ ...initial, mode: 'simplified', sourceGameVersion: '3.29.3b', resourceWarning: '资源服务暂不可用，已复用本地 3.29.3b 词库', scan: { ...initial.scan, applied: true } })
  await Vue.nextTick()
  assert.match(view.text(view.root), /已切换简体，可以启动游戏/)
  assert.match(view.text(view.root), /词库来源版本3\.29\.3b/)
  assert.match(view.text(view.root), /资源服务暂不可用，已复用本地/)
})

test('市集翻译位于语言按钮下方，开关保持后台偏好且不展示常态说明', async t => {
  const calls = []
  let emitMarket
  let unsubscribeMarket = false
  const initial = { supported: true, helperAvailable: true, state: 'waiting', autoEnabled: true, enabled: true, busy: false, closing: false }
  const view = mountSettings({
    status: async () => ({ success: true, data: { helperAvailable: true, mode: 'simplified', mappingState: 'active' } }),
    onState: () => () => {}
  }, {
    status: async () => { calls.push('status'); return { success: true, data: initial } },
    onState: callback => { emitMarket = callback; return () => { unsubscribeMarket = true } },
    enable: async () => { calls.push('enable'); return { success: true, data: initial } },
    disable: async () => { calls.push('disable'); return { success: true, data: { ...initial, state: 'disabled', autoEnabled: false, enabled: false, restartRequired: true, reason: '重启游戏后恢复原文' } } }
  })
  t.after(() => { if (!unsubscribeMarket) view.app.unmount() })
  await flush()
  const toggle = () => view.find(node => node.props['aria-label'] === '市集翻译')
  assert.deepEqual(calls, ['status'])
  assert.deepEqual(view.buttons(), ['选择目录', '切简体', '切繁体', '恢复原版'])
  assert.equal(toggle().props['model-value'], true)
  assert.equal(toggle().props.disabled, false)
  const row = toggle().parent
  const siblings = row.parent.children
  assert.ok(siblings.indexOf(row) > siblings.indexOf(view.button('切简体').parent))
  assert.equal(view.text(row), '市集翻译')
  assert.doesNotMatch(view.text(view.root), /每次游戏会话|DLL|启用市集翻译|停止市集翻译|游戏内市集翻译|市集翻译：等待/)
  emitMarket({ ...initial, state: 'active', restartRequired: true })
  await Vue.nextTick()
  assert.equal(toggle().props['model-value'], true)
  assert.doesNotMatch(view.text(view.root), /重启游戏后/)
  await toggle().props.onChange(false); await Vue.nextTick()
  assert.equal(toggle().props['model-value'], false)
  assert.match(view.text(view.root), /重启游戏后恢复原文/)
  await toggle().props.onChange(true); await Vue.nextTick()
  assert.equal(toggle().props['model-value'], true)
  assert.doesNotMatch(view.text(view.root), /重启游戏后恢复原文/)
  assert.deepEqual(calls, ['status', 'disable', 'enable'])
  view.app.unmount()
  assert.equal(unsubscribeMarket, true)
})

test('市集开关等待提交时禁止重复操作，失败保持原偏好并显示原因', async t => {
  const calls = []
  let finishEnable
  const initial = { helperAvailable: true, state: 'disabled', autoEnabled: false, enabled: false, busy: false, closing: false }
  const view = mountSettings({
    status: async () => ({ success: true, data: { helperAvailable: true, mode: 'simplified' } }),
    onState: () => () => {}
  }, {
    status: async () => ({ success: true, data: initial }),
    onState: () => () => {},
    enable: () => { calls.push('enable'); return new Promise(resolve => { finishEnable = resolve }) }
  })
  t.after(() => view.app.unmount())
  await flush()
  const toggle = () => view.find(node => node.props['aria-label'] === '市集翻译')
  const request = toggle().props.onChange(true)
  await Vue.nextTick()
  assert.equal(toggle().props.disabled, true)
  assert.equal(toggle().props.loading, true)
  await toggle().props.onChange(true)
  assert.deepEqual(calls, ['enable'])
  finishEnable({ success: false, error: { message: '市集组件尚未安装' } })
  await request; await Vue.nextTick()
  assert.equal(toggle().props['model-value'], false)
  assert.equal(toggle().props.disabled, false)
  assert.match(view.text(view.root), /市集组件尚未安装/)
})
