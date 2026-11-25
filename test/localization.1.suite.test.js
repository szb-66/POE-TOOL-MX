import _m0_test from 'node:test'
import _m0_assert from 'node:assert/strict'
import { readFileSync as _m0_readFileSync } from 'node:fs'
import { parse as _m0_parse, compileScript as _m0_compileScript } from '@vue/compiler-sfc'
import * as _m0_Vue from 'vue'
import _m1_test from 'node:test'
import _m1_assert from 'node:assert/strict'
import { readFileSync as _m1_readFileSync } from 'node:fs'
import { PriceCheckService as _m1_PriceCheckService } from '../electron/modules/priceCheck/service.js'
import _m2_test from 'node:test'
import _m2_assert from 'node:assert/strict'
import _m2_fs from 'node:fs'
import _m2_os from 'node:os'
import _m2_path from 'node:path'
import { EventEmitter as _m2_EventEmitter } from 'node:events'
import { PassThrough as _m2_PassThrough, Writable as _m2_Writable } from 'node:stream'
import { generateKeyPairSync as _m2_generateKeyPairSync, createHash as _m2_createHash } from 'node:crypto'
import { buildRelease as _m2_buildRelease } from '../shared/localizationProtocol.js'
import { LocalizationDownloader as _m2_LocalizationDownloader, localizationBaseUrl as _m2_localizationBaseUrl } from '../electron/modules/localization/downloader.js'
import { LocalizationService as _m2_LocalizationService } from '../electron/modules/localization/service.js'
import { LocalizationHelperClient as _m2_LocalizationHelperClient } from '../electron/modules/localization/helperClient.js'
import { createInstalledLocalizationVerifier as _m2_createInstalledLocalizationVerifier, localizationInstallationRoot as _m2_localizationInstallationRoot } from '../electron/modules/localization/installedState.js'
import { inspectSteamGame as _m2_inspectSteamGame, parseValveKeyValues as _m2_parseValveKeyValues, assertSteamWritable as _m2_assertSteamWritable, probeGameProcesses as _m2_probeGameProcesses } from '../electron/modules/localization/steam.js'
import { serverChannelFailure as _m2_serverChannelFailure } from '../electron/modules/app/serverIpcPolicy.js'
import _m3_test from 'node:test'
import _m3_assert from 'node:assert/strict'
import { createHash as _m3_createHash } from 'node:crypto'
import { createLocalizationDictionary as _m3_createLocalizationDictionary, localizationStructureAliases as _m3_localizationStructureAliases } from '../electron/modules/localization/text.js'
import { LocalizationRuntime as _m3_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { matchMapRequirements as _m3_matchMapRequirements, matchAffixes as _m3_matchAffixes } from '../electron/modules/item/matcher.js'
import _m4_test from 'node:test'
import _m4_assert from 'node:assert/strict'
import _m4_fs from 'node:fs'
import _m4_os from 'node:os'
import _m4_path from 'node:path'
import { createHash as _m4_createHash, generateKeyPairSync as _m4_generateKeyPairSync } from 'node:crypto'
import { fileURLToPath as _m4_fileURLToPath, pathToFileURL as _m4_pathToFileURL } from 'node:url'
import { runInNewContext as _m4_runInNewContext } from 'node:vm'
import { verifyLocalizationRuntime as _m4_verifyLocalizationRuntime } from '../scripts/runtime/localizationDistribution.js'
import { marketRuntimeFixture as _m4_marketRuntimeFixture, successfulMarketRun as _m4_successfulMarketRun } from './fixtures/marketRuntime.js'
import _m5_test from 'node:test'
import _m5_assert from 'node:assert/strict'
import { readFileSync as _m5_readFileSync } from 'node:fs'
import { LocalizationRuntime as _m5_LocalizationRuntime } from '../electron/modules/localization/runtime.js'
import { createLocalizationDictionary as _m5_createLocalizationDictionary } from '../electron/modules/localization/text.js'
import _m6_test from 'node:test'
import _m6_assert from 'node:assert/strict'
import { EventEmitter as _m6_EventEmitter } from 'node:events'
import { readFileSync as _m6_readFileSync } from 'node:fs'
import { PassThrough as _m6_PassThrough, Writable as _m6_Writable } from 'node:stream'
import { LocalizationService as _m6_LocalizationService } from '../electron/modules/localization/service.js'
import { LocalizationHelperClient as _m6_LocalizationHelperClient } from '../electron/modules/localization/helperClient.js'
import { ServerModeController as _m6_ServerModeController } from '../electron/modules/app/serverMode.js'
import { createShutdownController as _m6_createShutdownController } from '../electron/modules/lifecycle/shutdown.js'
import { createApplicationRestartController as _m6_createApplicationRestartController } from '../electron/modules/lifecycle/restart.js'
import { ApplicationUpdateService as _m6_ApplicationUpdateService } from '../electron/modules/update/service.js'
import _m7_test from 'node:test'
import _m7_assert from 'node:assert/strict'
import _m7_fs from 'node:fs'
import _m7_os from 'node:os'
import _m7_path from 'node:path'
import { generateKeyPairSync as _m7_generateKeyPairSync } from 'node:crypto'
import { LocalizationService as _m7_LocalizationService } from '../electron/modules/localization/service.js'
import { LocalizationDownloader as _m7_LocalizationDownloader } from '../electron/modules/localization/downloader.js'
import { buildRelease as _m7_buildRelease } from '../shared/localizationProtocol.js'
import _m8_test from 'node:test'
import _m8_assert from 'node:assert/strict'
import { readFileSync as _m8_readFileSync } from 'node:fs'
import { createHash as _m8_createHash } from 'node:crypto'
import { createSupportGemResolver as _m8_createSupportGemResolver } from '../electron/modules/localization/supportGem.js'
import { soulMantleText as _m8_soulMantleText } from './fixtures/localizedPriceCheckReportedItems.js'
import _m9_test from 'node:test'
import _m9_assert from 'node:assert/strict'
import { readFileSync as _m9_readFileSync } from 'node:fs'
import _m9_vm from 'node:vm'
import { createRenderer as _m9_createRenderer, nextTick as _m9_nextTick } from 'vue'
import { useLocalizedCatalog as _m9_useLocalizedCatalog } from '../src/utils/localizedCatalog.js'
import { localizedResultState as _m9_localizedResultState } from '../src/domains/regex/localizedRegex.js'
import { generateVendorRegex as _m9_generateVendorRegex } from '../src/domains/regex/vendorRegex.js'
import { createDefaultVendorConfig as _m9_createDefaultVendorConfig } from '../src/domains/regex/vendorConfig.js'
import _m10_test from 'node:test'
import _m10_assert from 'node:assert/strict'
import { loadLocalizedCatalog as _m10_loadLocalizedCatalog, catalogSearchText as _m10_catalogSearchText, catalogDisplayText as _m10_catalogDisplayText } from '../src/utils/localizedCatalog.js'
import { applySkillCatalogSelection as _m10_applySkillCatalogSelection, searchSkillCatalog as _m10_searchSkillCatalog, updateSkillFreeText as _m10_updateSkillFreeText } from '../src/domains/story/skillCatalog.js'
import { createDefaultVendorConfig as _m10_createDefaultVendorConfig } from '../src/domains/regex/vendorConfig.js'
import { generateVendorRegex as _m10_generateVendorRegex } from '../src/domains/regex/vendorRegex.js'
import { createDefaultMapRegexConfig as _m10_createDefaultMapRegexConfig, generateMapRegex as _m10_generateMapRegex, mapRegexCatalog as _m10_mapRegexCatalog } from '../src/domains/regex/mapRegex.js'
import { beastRegexOptions as _m10_beastRegexOptions, generateBeastRegex as _m10_generateBeastRegex } from '../src/domains/regex/beastRegex.js'
import { localizedTemplateExpression as _m10_localizedTemplateExpression } from '../src/domains/regex/localizedRegex.js'
import _m11_test from 'node:test'
import _m11_assert from 'node:assert/strict'
import { readFileSync as _m11_readFileSync } from 'node:fs'
import { createHash as _m11_createHash } from 'node:crypto'
import { createLocalizationDictionary as _m11_createLocalizationDictionary } from '../electron/modules/localization/text.js'
import { localizedSearchExpression as _m11_localizedSearchExpression } from '../electron/modules/localization/searchExpression.js'
import { loadLocalizedCatalog as _m11_loadLocalizedCatalog } from '../src/utils/localizedCatalog.js'
import { createDefaultVendorConfig as _m11_createDefaultVendorConfig } from '../src/domains/regex/vendorConfig.js'
import { generateVendorRegex as _m11_generateVendorRegex } from '../src/domains/regex/vendorRegex.js'

// === Merged from gameLocalizationSettings.test.js ===
await (async () => {
  const test = _m0_test
  const assert = _m0_assert
  const readFileSync = _m0_readFileSync
  const parse = _m0_parse
  const compileScript = _m0_compileScript
  const Vue = _m0_Vue
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
})()

// === Merged from internationalVisceraGrades.test.js ===
await (async () => {
  const test = _m1_test
  const assert = _m1_assert
  const readFileSync = _m1_readFileSync
  const PriceCheckService = _m1_PriceCheckService
const load = relative => JSON.parse(readFileSync(new URL(relative, import.meta.url)))
const { aliasEntries, itemEntries, statEntries } = load('./fixtures/internationalVisceraPriceCheck.json')
const gradeEntries = load('./fixtures/internationalVisceraGradeEntries.json')
const international = { locale: 'en', items: itemEntries, stats: statEntries }
const cn = load('../electron/modules/priceCheck/catalog.json')

const itemText = {
  en: `Item Class: Viscera
{name}
--------
Head
--------
Item Level: 83
--------
{ Implicit Modifier }
20(20-30)% increased Chaos Damage
--------
Take this to the Wickerman in a town or hideout to attach it.`,
  cn: `物品类别: 内脏
{name}
--------
头部
--------
物品等级: 83
--------
{ 基底属性 }
混沌伤害提高 20(20-30)%
--------
将此物带到城镇或藏身处的柳条人处进行附着。`,
  tw: `物品種類: 臟器
{name}
--------
頭
--------
物品等級: 83
--------
{ 固定詞綴 }
增加 20(20-30)% 混沌傷害
--------
將此物帶給城鎮或藏身處中的柳條人以將其附上。`
}

function fixture(server, clipboard, entries = [...aliasEntries, ...gradeEntries]) {
  const searches = []
  const service = new PriceCheckService({
    catalog: server === 'cn' ? cn : international,
    localizationProvider: () => entries,
    captureClipboard: async () => clipboard,
    auth: { getStatus: () => ({ authenticated: true }) },
    client: { server: { id: server }, clearCache() {},
      async search(league, query) {
        searches.push(query)
        return { id: 'viscera-grade', total: 0, result: [] }
      }
    }
  })
  service.updateRuntime({ enabled: true, league: 'Covens' })
  return { service, searches }
}

test('高级和次级内脏保留简繁英复制名称，按本服官方底材和基底词缀查价', async () => {
  for (const [server, locale, names, baseType] of [
    ['international', 'cn', ['高级 恐喙鸟头颅', '次级 恐喙鸟头颅'], 'Severed Rhoa Head'],
    ['international', 'tw', ['高階 恐喙鳥之首', '低階 恐喙鳥之首'], 'Severed Rhoa Head'],
    ['international', 'en', ['Greater Severed Rhoa Head', 'Lesser Severed Rhoa Head'], 'Severed Rhoa Head'],
    ['cn', 'cn', ['高级 恐喙鸟头颅', '次级 恐喙鸟头颅'], '恐喙鸟头颅']
  ]) {
    for (const name of names) {
      const input = itemText[locale].replace('{name}', name)
      // English clipboard and the native Chinese server do not require an optional translation pack.
      const entries = locale === 'en' || server === 'cn' ? [] : undefined
      const { service, searches } = fixture(server, input, entries)
      const { model } = await service.captureAndCheck({ league: 'Covens', queryImmediately: true })
      assert.equal(model.presentation?.texts[model.item.name] ?? model.item.name, name)
      assert.equal(model.item.itemLevel, 83)
      assert.deepEqual(model.unknownStats, [])
      assert.equal(searches[0].query.type, baseType)
      assert.deepEqual(searches[0].query.filters.type_filters.filters, { category: { option: 'viscera' } })
      assert.deepEqual(JSON.parse(JSON.stringify(searches[0].query.stats[0].filters)), [
        { id: 'implicit.stat_736967255', value: { min: 20 }, disabled: false }
      ])
      await service.rerun({ model })
      assert.deepEqual(searches[1], searches[0])
    }
  }
})

test('拒绝未知内脏底材、非单层等级和无可信 ClientStrings 的本地化等级', async () => {
  for (const [locale, name, entries, error] of [
    ['en', 'Greater Unknown Head', [], 'INVALID_REQUEST'],
    ['en', 'Greater Lesser Severed Rhoa Head', [], 'INVALID_REQUEST'],
    ['cn', '高级 未知的头部', undefined, 'LOCALIZATION_UNRESOLVED'],
    ['cn', '高级 恐喙鸟头颅', [...aliasEntries, ...gradeEntries.map(entry => ({ ...entry, sourceHash: '0'.repeat(64) }))], 'LOCALIZATION_UNRESOLVED'],
    ['cn', '高级 恐喙鸟头颅', [...aliasEntries, ...gradeEntries.map(entry => ({ ...entry, cn: '高级 {1}' }))], 'LOCALIZATION_UNRESOLVED'],
    ['cn', '高级 恐喙鸟头颅', [...aliasEntries.map(entry => entry.cn === '恐喙鸟头颅' ? { ...entry, sourceHash: undefined } : entry), ...gradeEntries], 'LOCALIZATION_UNRESOLVED'],
    ['tw', '高階 恐喙鳥之首', [...aliasEntries, ...gradeEntries.map(entry => ({ ...entry, id: 'WrongClientString' }))], 'LOCALIZATION_UNRESOLVED']
  ]) {
    const input = itemText[locale].replace('{name}', name)
    const { service, searches } = fixture('international', input, entries)
    await assert.rejects(service.check({ text: input, league: 'Covens' }), { code: error })
    assert.deepEqual(searches, [])
  }
})

test('原版高级内脏的价格尾标不改变具体查询底材', async () => {
  const input = itemText.en.replace('{name}', 'Greater Severed Rhoa Head [1d]')
  const { service, searches } = fixture('international', input, [])
  await service.captureAndCheck({ league: 'Covens', queryImmediately: true })
  assert.equal(searches[0].query.type, 'Severed Rhoa Head')
})
})()

// === Merged from localizationClient.test.js ===
await (async () => {
  const test = _m2_test
  const assert = _m2_assert
  const fs = _m2_fs
  const os = _m2_os
  const path = _m2_path
  const EventEmitter = _m2_EventEmitter
  const PassThrough = _m2_PassThrough
  const Writable = _m2_Writable
  const generateKeyPairSync = _m2_generateKeyPairSync
  const createHash = _m2_createHash
  const buildRelease = _m2_buildRelease
  const LocalizationDownloader = _m2_LocalizationDownloader
  const localizationBaseUrl = _m2_localizationBaseUrl
  const LocalizationService = _m2_LocalizationService
  const LocalizationHelperClient = _m2_LocalizationHelperClient
  const createInstalledLocalizationVerifier = _m2_createInstalledLocalizationVerifier
  const localizationInstallationRoot = _m2_localizationInstallationRoot
  const inspectSteamGame = _m2_inspectSteamGame
  const parseValveKeyValues = _m2_parseValveKeyValues
  const assertSteamWritable = _m2_assertSteamWritable
  const probeGameProcesses = _m2_probeGameProcesses
  const serverChannelFailure = _m2_serverChannelFailure
function temporary(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-localization-test-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  return root
}
function keyPair() {
  return generateKeyPairSync('ed25519', { privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } })
}
const dataset = entries => ({ protocolVersion: 1, engineVersion: 1, gameVersion: '3.30.0b', entries })
const entry = (id, cn = '测试') => ({ table: 'data/clientstrings.datc64', id, field: 'Text', en: `Text ${id}`, tw: `繁體 ${id}`, cn })

test('汉化状态按 Steam 安装目录核实，旧版事务和当前安装的待恢复日志互不干扰', t => {
  const storageRoot = temporary(t)
  const makeInstallation = (name, indexText) => {
    const steamapps = path.join(storageRoot, name, 'steamapps')
    const gameDirectory = path.join(steamapps, 'common', 'Path of Exile')
    fs.mkdirSync(path.join(gameDirectory, 'Bundles2'), { recursive: true })
    fs.writeFileSync(path.join(gameDirectory, 'PathOfExileSteam.exe'), '')
    fs.writeFileSync(path.join(gameDirectory, 'Bundles2', '_.index.bin'), indexText)
    fs.writeFileSync(path.join(steamapps, 'appmanifest_238960.acf'), '"AppState" { "appid" "238960" "installdir" "Path of Exile" "buildid" "123" "StateFlags" "4" }')
    return gameDirectory
  }
  const first = makeInstallation('first-library', 'legacy-index')
  const second = makeInstallation('second-library', 'scoped-index')
  const writeRecord = (directory, indexText, releaseId) => fs.writeFileSync(path.join(directory, 'transaction-active.json'), JSON.stringify({
    version: 1, buildId: '123', outputHash: createHash('sha256').update(indexText).digest('hex'), releaseId
  }))
  fs.writeFileSync(path.join(storageRoot, 'transaction-installation.json'), JSON.stringify({ gameDirectory: first }))
  writeRecord(storageRoot, 'legacy-index', 'first-release')
  const secondRoot = localizationInstallationRoot(storageRoot, second)
  fs.mkdirSync(secondRoot, { recursive: true })
  writeRecord(secondRoot, 'scoped-index', 'second-release')
  const verify = createInstalledLocalizationVerifier()
  const firstInput = { storageRoot, gameDirectory: first, releaseId: 'first-release' }
  const secondInput = { storageRoot, gameDirectory: second, releaseId: 'second-release' }
  assert.equal(verify(firstInput).ready, true)
  assert.equal(verify(secondInput).ready, true)
  fs.writeFileSync(path.join(storageRoot, 'transaction.json'), '{}')
  assert.match(verify(firstInput).reason, /未完成/)
  assert.equal(verify(secondInput).ready, true)
  if (process.platform === 'win32') assert.equal(localizationInstallationRoot(storageRoot, second.toUpperCase()), secondRoot)
})

test('资源地址只接受HTTPS或显式本机测试HTTP，不允许凭据和路径', () => {
  assert.equal(localizationBaseUrl('http://127.0.0.1:44317'), 'http://127.0.0.1:44317')
  assert.throws(() => localizationBaseUrl('http://example.com'))
  assert.throws(() => localizationBaseUrl('http://127.0.0.1', false))
  assert.throws(() => localizationBaseUrl('https://example.com/unsafe'))
  assert.throws(() => localizationBaseUrl('https://name:password@example.com'))
})

test('签名清单分块增量下载，重复检查不下载，单条变化只传对应桶', async t => {
  const root = temporary(t)
  const keys = keyPair()
  const first = buildRelease(dataset([entry('a'), entry('b'), entry('c')]), keys.privateKey, { releaseId: 'first' })
  let release = first
  let objects = 0
  const downloader = new LocalizationDownloader({ storageRoot: root, publicKey: keys.publicKey, fetchImpl: async url => {
    if (url.endsWith('/stable.json')) return new Response(JSON.stringify(release.envelope), { headers: { etag: release.envelope.manifest.releaseId } })
    objects++
    return new Response(release.blobs.get(url.split('/').pop()))
  } })
  const update = await downloader.check()
  assert.ok(update.downloadBytes > 0)
  const downloaded = await downloader.download()
  assert.equal(downloaded.downloadedObjects, first.blobs.size)
  assert.equal(downloader.load('ready.json').entries.length, 3)
  assert.equal(downloader.load(), null, '下载候选不会提前改变游戏已应用词库')
  downloader.activate(first.envelope)
  assert.equal(downloader.load().manifest.releaseId, 'first')
  const initialRequests = objects
  assert.equal((await downloader.check()).downloadBytes, 0)
  assert.equal((await downloader.download()).downloadedBytes, 0)
  assert.equal(objects, initialRequests)
  release = buildRelease(dataset([entry('a', '新文本'), entry('b'), entry('c')]), keys.privateKey, { releaseId: 'second' })
  assert.equal((await downloader.check()).missingObjects, 1)
  assert.equal((await downloader.download()).downloadedObjects, 1)
  assert.equal(downloader.load().manifest.releaseId, 'first')
})

test('签名错误、缺块、损坏缓存或下载失败时保留旧资源且可重试', async t => {
  const root = temporary(t)
  const keys = keyPair()
  const first = buildRelease(dataset([entry('a')]), keys.privateKey, { releaseId: 'first' })
  let envelope = first.envelope
  let failDownload = false
  const downloader = new LocalizationDownloader({ storageRoot: root, publicKey: keys.publicKey, fetchImpl: async url => url.endsWith('/stable.json')
    ? new Response(JSON.stringify(envelope))
    : failDownload ? new Response('failed', { status: 503 }) : new Response(first.blobs.get(url.split('/').pop())) })
  await downloader.check(); await downloader.download(); downloader.activate(first.envelope)
  envelope = structuredClone(first.envelope); envelope.manifest.gameVersion = 'tampered'
  await assert.rejects(downloader.check(), /签名/)
  assert.equal(downloader.load().manifest.releaseId, 'first')
  envelope = first.envelope
  const descriptor = first.envelope.manifest.objects[0]
  fs.writeFileSync(downloader.objectPath(descriptor.sha256), 'corrupt')
  assert.equal((await downloader.check()).missingObjects, 1)
  failDownload = true
  await assert.rejects(downloader.download(), /HTTP 503/)
  failDownload = false
  await downloader.download()
  assert.equal(downloader.load().manifest.releaseId, 'first')
})

test('启动加载同版活动和候选词库复用解码，但仍核验每次读取的对象与签名', t => {
  const root = temporary(t)
  const keys = keyPair()
  const release = buildRelease(dataset([entry('a'), entry('b')]), keys.privateKey, { releaseId: 'shared' })
  fs.mkdirSync(path.join(root, 'objects'))
  for (const [hash, bytes] of release.blobs) fs.writeFileSync(path.join(root, 'objects', hash), bytes)
  for (const file of ['active.json', 'ready.json']) fs.writeFileSync(path.join(root, file), JSON.stringify(release.envelope))
  const downloader = new LocalizationDownloader({ storageRoot: root, publicKey: keys.publicKey })
  const service = new LocalizationService({ serverId: 'international', storageRoot: root, downloader,
    helper: { available: () => true }, verifyInstalled: () => ({ ready: true }) })
  assert.equal(service.activeCandidate.entries[0], service.ready.entries[0], '同一对象只解码一次')
  const cache = new Map()
  const active = downloader.load('active.json', cache)
  assert.equal(downloader.load('ready.json', cache).entries[0], active.entries[0])
  const descriptor = release.envelope.manifest.objects[0]
  const filename = downloader.objectPath(descriptor.sha256)
  const bytes = fs.readFileSync(filename)
  const corrupt = Buffer.from(bytes)
  corrupt[0] ^= 1
  fs.writeFileSync(filename, corrupt)
  assert.equal(downloader.load('ready.json', cache), null, '已解码对象也不能掩盖后续同大小文件损坏')
  fs.writeFileSync(filename, bytes)
  const tampered = structuredClone(release.envelope)
  tampered.manifest.gameVersion = 'tampered'
  fs.writeFileSync(path.join(root, 'ready.json'), JSON.stringify(tampered))
  assert.equal(downloader.load('ready.json', cache), null, '复用解码不会绕过清单签名')
})

test('Steam清单验证appid与目录；写入时游戏进程或更新不明确均拒绝', async t => {
  const root = temporary(t)
  const steamapps = path.join(root, 'steamapps')
  const game = path.join(steamapps, 'common', 'Path of Exile')
  fs.mkdirSync(path.join(game, 'Bundles2'), { recursive: true })
  fs.writeFileSync(path.join(game, 'Bundles2', '_.index.bin'), 'index')
  fs.writeFileSync(path.join(game, 'PathOfExileSteam.exe'), 'exe')
  const manifest = path.join(steamapps, 'appmanifest_238960.acf')
  const text = flags => `"AppState" { "appid" "238960" "installdir" "Path of Exile" "buildid" "1234" "StateFlags" "${flags}" }`
  fs.writeFileSync(manifest, text(4))
  assert.equal(inspectSteamGame(game).buildId, '1234')
  assert.equal(parseValveKeyValues('"path" "E:\\\\Games"').path, 'E:\\Games')
  await assert.rejects(assertSteamWritable(game, { platform: 'win32', processProbe: async () => null }), /无法确认/)
  await assert.rejects(assertSteamWritable(game, { platform: 'win32', processProbe: async () => [123] }), /退出/)
  fs.writeFileSync(manifest, text(6))
  await assert.rejects(assertSteamWritable(game, { platform: 'win32', processProbe: async () => [] }), /状态不明/)
  fs.writeFileSync(manifest, text(4))
  assert.equal((await assertSteamWritable(game, { platform: 'win32', processProbe: async () => [] })).buildId, '1234')
  fs.mkdirSync(path.join(steamapps, 'downloading', '238960'), { recursive: true })
  await assert.rejects(assertSteamWritable(game, { platform: 'win32', processProbe: async () => [] }), /暂存目录/)
  assert.equal(await probeGameProcesses({ execFileImpl: async () => ({ stdout: 'invalid' }) }), null)
})

test('游戏进程查询直接读取进程名和PID，不等待CIM；查询失败或结果异常保持未知', async () => {
  const probe = stdout => probeGameProcesses({ execFileImpl: async (executable, args, options) => {
    assert.equal(executable, 'powershell.exe')
    const command = args.at(-1)
    assert.match(command, /Get-Process -Name 'PathOfExile\*'/)
    assert.doesNotMatch(command, /Get-CimInstance/)
    assert.equal(options.windowsHide, true)
    return { stdout }
  } })
  assert.deepEqual(await probe('[]'), [])
  assert.deepEqual(await probe(JSON.stringify([{ Name: 'PathOfExileSteam.exe', ProcessId: 123 }, { Name: 'PathOfExile_x64.exe', ProcessId: 456 } ])), [123, 456])
  for (const stdout of ['invalid', '{}', 'null', '[{"Name":"other.exe","ProcessId":123}]', '[{"Name":"PathOfExileSteam.exe","ProcessId":"123"}]']) {
    assert.equal(await probe(stdout), null)
  }
  assert.equal(await probeGameProcesses({ execFileImpl: async () => { throw new Error('query failed') } }), null)
})

test('构造和查询状态不联网，不自动扫描；仅手动应用成功后切换查价词库', async t => {
  const root = temporary(t)
  let helperCalls = 0
  let activated = 0
  const bundle = { manifest: { releaseId: 'new' }, entries: [entry('a')], envelope: {} }
  const downloader = { load: file => file === 'ready.json' ? bundle : null, check: async () => ({ releaseId: 'new', missingObjects: 0 }), download: async () => ({ downloadedBytes: 0 }), activate: () => { activated++ } }
  const helper = { available: () => true, run: async operation => { helperCalls++; return operation === 'scan' ? { applied: false } : operation === 'restore' ? { applied: false, restored: true } : { applied: true, resourceVersion: 'new' } } }
  const service = new LocalizationService({ serverId: 'international', storageRoot: root, downloader, helper, discover: async () => [], inspect: () => ({ gameDirectory: root }), assertWritable: async () => ({ gameDirectory: root }), verifyInstalled: () => ({ ready: true }) })
  assert.equal(service.getStatus().busy, false)
  assert.equal(helperCalls, 0)
  assert.equal(service.getActiveEntries().length, 0)
  const applied = await service.apply({ gameDirectory: root })
  assert.equal(applied.busy, false)
  assert.equal(activated, 1)
  assert.equal(service.getActiveRevision(), 'new')
  await service.restore({ gameDirectory: root })
  assert.equal(service.getActiveEntries().length, 0)
})

test('扫描以原生事务结果恢复同代词库，未知版本或游戏还原后不继续使用旧映射', async t => {
  const root = temporary(t)
  const old = { manifest: { releaseId: 'old' }, entries: [entry('old')], envelope: {} }
  const next = { manifest: { releaseId: 'next' }, entries: [entry('next')], envelope: {} }
  let scan = { applied: true, resourceVersion: 'next' }
  const activations = []
  const service = new LocalizationService({ serverId: 'international', storageRoot: root,
    verifyInstalled: () => ({ ready: true }),
    downloader: { load: file => file === 'ready.json' ? next : old, activate: envelope => activations.push(envelope) },
    helper: { available: () => true, run: async () => scan }, discover: async () => [], inspect: () => ({ gameDirectory: root }) })
  assert.equal(service.getActiveRevision(), 'old')
  await service.scan({ gameDirectory: root })
  assert.equal(service.getActiveRevision(), 'next')
  assert.equal(service.getStatus().mappingState, 'active')
  assert.equal(activations.length, 1)
  scan = { applied: true, resourceVersion: 'unknown' }
  await service.scan({ gameDirectory: root })
  assert.equal(service.getActiveEntries().length, 0)
  assert.equal(service.getStatus().mappingState, 'unavailable')
  assert.match(service.getStatus().mappingWarning, /不匹配/)
  scan = { applied: false }
  await service.scan({ gameDirectory: root })
  assert.equal(service.getStatus().mappingState, 'none')
  assert.equal(service.getStatus().mappingWarning, '')
})

test('启动时和运行期间只读核对原生事务、Steam版本与索引；外部更新后旧中文映射不可用', t => {
  const root = temporary(t)
  const storageRoot = path.join(root, 'user-data', 'localization')
  const steamapps = path.join(root, 'steamapps')
  const game = path.join(steamapps, 'common', 'Path of Exile')
  fs.mkdirSync(path.join(game, 'Bundles2'), { recursive: true })
  fs.mkdirSync(storageRoot, { recursive: true })
  const index = path.join(game, 'Bundles2', '_.index.bin')
  const manifestFile = path.join(steamapps, 'appmanifest_238960.acf')
  const originalIndex = 'known-applied-index'
  fs.writeFileSync(index, originalIndex)
  fs.writeFileSync(path.join(game, 'PathOfExileSteam.exe'), 'exe')
  const manifest = buildId => `"AppState" { "appid" "238960" "installdir" "Path of Exile" "buildid" "${buildId}" "StateFlags" "4" }`
  fs.writeFileSync(manifestFile, manifest('1234'))
  const activeFile = path.join(storageRoot, 'transaction-active.json')
  const active = { version: 1, buildId: '1234', outputHash: createHash('sha256').update(originalIndex).digest('hex'), releaseId: 'known', generation: 'generation' }
  fs.writeFileSync(activeFile, JSON.stringify(active))
  fs.writeFileSync(path.join(storageRoot, 'settings.json'), JSON.stringify({ gameDirectory: game }))
  fs.writeFileSync(path.join(storageRoot, 'active.json'), 'untouched-signed-envelope-placeholder')
  const bundle = { manifest: { releaseId: 'known' }, entries: [entry('known')], envelope: {} }
  let helperCalls = 0
  const options = { serverId: 'international', storageRoot,
    downloader: { load: file => file === 'ready.json' ? null : bundle },
    helper: { available: () => true, run: () => { helperCalls++; throw new Error('Must not run helper automatically') } } }
  const service = new LocalizationService(options)
  assert.equal(service.getActiveRevision(), 'known')
  assert.equal(service.getStatus().mode, 'simplified', '旧事务记录缺少mode时兼容为简体')
  assert.equal(service.getActiveEntries().length, 1)
  assert.equal(helperCalls, 0)
  fs.writeFileSync(index, 'externally-updated-index')
  assert.equal(service.getActiveRevision(), '')
  assert.equal(service.getActiveEntries().length, 0)
  assert.match(service.getStatus().mappingWarning, /索引已改变/)
  assert.equal(fs.readFileSync(path.join(storageRoot, 'active.json'), 'utf8'), 'untouched-signed-envelope-placeholder', '自动核对只读，不删除或重写缓存')
  fs.writeFileSync(index, originalIndex)
  fs.writeFileSync(manifestFile, manifest('1235'))
  const restarted = new LocalizationService(options)
  assert.equal(restarted.getActiveRevision(), '')
  assert.match(restarted.getStatus().mappingWarning, /版本已改变/)
  fs.writeFileSync(manifestFile, manifest('1234'))
  fs.writeFileSync(path.join(storageRoot, 'transaction.json'), '{}')
  assert.equal(service.getActiveEntries().length, 0)
  assert.match(service.getStatus().mappingWarning, /未完成/)
  assert.equal(helperCalls, 0)
  assert.deepEqual(JSON.parse(fs.readFileSync(activeFile, 'utf8')), active)
  fs.unlinkSync(path.join(storageRoot, 'transaction.json'))
  fs.writeFileSync(activeFile, JSON.stringify({ ...active, mode: 'traditional' }))
  const cachedTraditional = new LocalizationService(options)
  assert.equal(cachedTraditional.getStatus().mode, 'traditional')
  assert.equal(cachedTraditional.getActiveRevision(), 'known', '同版缓存繁体映射在重启后仍可验证')
  fs.writeFileSync(activeFile, JSON.stringify({ ...active, mode: 'traditional', releaseId: 'native-tw' }))
  const localTraditional = new LocalizationService({ ...options, downloader: { load: () => null } })
  assert.equal(localTraditional.getStatus().mode, 'traditional', '无词库也能只读恢复繁体模式状态')
  assert.equal(localTraditional.getActiveRevision(), '')
  assert.equal(localTraditional.getStatus().mappingState, 'none')
  const mismatchedCache = new LocalizationService(options)
  assert.equal(mismatchedCache.getStatus().mode, 'traditional')
  assert.equal(mismatchedCache.getActiveRevision(), '', '本地繁体记录不能误激活其他版本缓存')
  for (const mode of [null, 'english']) {
    fs.writeFileSync(activeFile, JSON.stringify({ ...active, mode }))
    const invalidMode = new LocalizationService(options)
    assert.equal(invalidMode.getStatus().mode, null)
    assert.equal(invalidMode.getActiveRevision(), '', '异常模式记录不能激活词库')
  }
  fs.writeFileSync(activeFile, JSON.stringify({ ...active, mode: 'traditional', releaseId: 'native-tw' }))
  fs.writeFileSync(index, 'changed-after-traditional')
  assert.equal(localTraditional.getStatus().mode, null)
  assert.match(localTraditional.getStatus().mappingWarning, /索引已改变/)
  assert.equal(helperCalls, 0, '恢复模式仅做本地校验，不启动组件或联网')
})

test('客户端国服服务拒绝执行，独立国际服设置不读写另一服目录', async t => {
  const root = temporary(t)
  const cnRoot = path.join(root, 'localization')
  const internationalRoot = path.join(root, 'servers', 'international', 'localization')
  const downloader = { load: () => null }
  let calls = 0
  const helper = { available: () => true, run: async () => { calls++; return { baseline: { ready: false } } } }
  const cn = new LocalizationService({ serverId: 'cn', storageRoot: cnRoot, downloader, helper })
  await assert.rejects(cn.scan(), /仅适用于国际服/)
  await assert.rejects(cn.apply(), /仅适用于国际服/)
  assert.equal(calls, 0)
  assert.equal(fs.existsSync(cnRoot), false)
  const international = new LocalizationService({ serverId: 'international', storageRoot: internationalRoot, downloader, helper, discover: async () => [], inspect: value => ({ gameDirectory: value }) })
  await international.scan({ gameDirectory: 'chosen-steam' })
  assert.equal(calls, 1)
  assert.equal(fs.existsSync(path.join(cnRoot, 'settings.json')), false)
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(internationalRoot, 'settings.json'), 'utf8')), {
    gameDirectory: 'chosen-steam', legacyGameDirectory: '', preferredMode: null
  })
  assert.equal(cn.getStatus().gameDirectory, '')
})

test('国服和切服期间拒绝所有汉化IPC，不因共用设置页开放', () => {
  assert.equal(serverChannelFailure({ id: 'international' }, 'localization:status'), null)
  assert.equal(serverChannelFailure({ id: 'cn' }, 'localization:apply').code, 'SERVER_FEATURE_UNAVAILABLE')
  assert.equal(serverChannelFailure({ id: 'international' }, 'localization:restore', true).code, 'SERVER_SWITCHING')
})

test('原生组件使用固定命令与JSONL协议，拒绝不完整结果、重复结果和错误协议', async t => {
  const root = temporary(t)
  const executable = path.join(root, 'helper.exe')
  fs.writeFileSync(executable, '')
  let request
  let output = [{ protocolVersion: 1, type: 'progress', phase: 'scan', completed: 1, total: 2 }, { protocolVersion: 1, type: 'result', success: true, data: { gameVersion: '3.30' } }]
  const client = new LocalizationHelperClient({ executable, spawnImpl: (file, args, options) => {
    assert.equal(file, executable)
    assert.deepEqual(args, [])
    assert.equal(options.shell, false)
    const child = new EventEmitter()
    child.stdout = new PassThrough()
    child.stderr = new PassThrough()
    child.kill = () => {}
    child.stdin = new Writable({ write(chunk, _encoding, callback) { request = JSON.parse(chunk.toString()); callback() }, final(callback) {
      setImmediate(() => { for (const event of output) child.stdout.write(`${JSON.stringify(event)}\n`); child.emit('close', 0) })
      callback()
    } })
    return child
  } })
  const progress = []
  assert.equal((await client.run('scan', { gameDirectory: 'selected' }, event => progress.push(event))).gameVersion, '3.30')
  assert.equal(request.protocolVersion, 1)
  assert.equal(request.operation, 'scan')
  assert.equal(progress.length, 1)
  output = [{ protocolVersion: 2, type: 'result', success: true }]
  await assert.rejects(client.run('scan', {}), /协议版本/)
  output = [{ protocolVersion: 1, type: 'result', success: true }, { protocolVersion: 1, type: 'result', success: true }]
  await assert.rejects(client.run('scan', {}), /重复结果/)
  output = []
  await assert.rejects(client.run('scan', {}), /未返回完整结果/)
})
})()

// === Merged from localizationDisplayText.test.js ===
await (async () => {
  const test = _m3_test
  const assert = _m3_assert
  const createHash = _m3_createHash
  const createLocalizationDictionary = _m3_createLocalizationDictionary
  const localizationStructureAliases = _m3_localizationStructureAliases
  const LocalizationRuntime = _m3_LocalizationRuntime
  const matchMapRequirements = _m3_matchMapRequirements
  const matchAffixes = _m3_matchAffixes
// Minimal verbatim entries from the signed 3.30.0b official-resource export.
const dat = (id, en, cn, tw) => ({ table: 'clientstrings', field: 'Text', kind: 'dat', id, en, cn, tw })
const stat = (id, en, cn, tw, table = 'stat_descriptions') => ({ table: `metadata/statdescriptions/${table}.csd`, field: 'variant:0', kind: 'stat', id, en, cn, tw })
const raw = [
  dat('ItemDisplayMapDropScalingBonus', '[AtlasDropScaling|Atlas Drops]', undefined, '[AtlasDropScaling|輿圖掉落物]'),
  dat('ItemDisplayHeistAlertLevelReduction', 'Alert Level Reduction', '警报等级衰减', '警戒等級減免'),
  dat('ItemDisplayHeistMaxReinforcements', 'Maximum Alive Reinforcements', '最大存活援军', '最大生存支援'),
  stat('item_found_rarity_+%', '{0:+d}% to [PlayerItemRarity|Item Rarity]', '[PlayerItemRarity|物品稀有度] {0:+d}%', '{0:+d}%[PlayerItemRarity|物品稀有度]'),
  stat('damage_taken_+%_from_blinded_enemies', '{0}% increased Damage taken from [Blind|Blinded] Enemies', '承受来自致盲敌人的伤害提高 {0}%', '增加承受來自致盲敵人的 {0}% 傷害'),
  stat('keystone_quiet_might', '3% more Spell Damage per Power Charge\\nGain Power Charges instead of Frenzy Charges', '每个暴击球使法术伤害总增 3%\\n获得暴击球来取代狂怒球', '每顆暴擊球 3% 更多法術傷害\\n獲得暴擊球而不是狂怒球', 'passive_skill_stat_descriptions'),
  stat('every_10_seconds_physical_damage_%_to_add_as_fire_for_3_seconds', 'Every 10 seconds, gain {0}% of Physical Damage\\nas Extra Fire Damage for 4 seconds', '每 10 秒，在 4 秒内获得等同于\\n物理伤害 {0}% 的额外火焰伤害', '每 10 秒，獲得 {0}% 物理傷害的額外火焰傷害 5 秒')
]
const entries = raw.map(entry => ({ ...entry, sourceHash: createHash('sha256').update(entry.en).digest('hex') }))
const base = 'Item Class: Maps\nRarity: Rare\nDoom Domain\nFortress Map\n--------\n'
const body = '\n--------\nItem Level: 84\n--------\n{ Prefix Modifier "Fixture" (Tier: 1) }\n'

test('GGG显示标记在原文hash验证之后移除，属性使用当前受管繁体标签', () => {
  const dictionary = createLocalizationDictionary(entries)
  assert.equal(dictionary.toEnglish('輿圖掉落物'), 'Atlas Drops')
  assert.deepEqual(dictionary.aliasesFor('Atlas Drops'), ['Atlas Drops', '輿圖掉落物'])
  assert.ok(dictionary.aliasesFor('Atlas Drops:').includes('輿圖掉落物:'))
  const structure = localizationStructureAliases(dictionary)
  assert.equal(structure['輿圖掉落物'], 'Atlas Drops')
  assert.equal(structure['警戒等級減免'], 'Alert Level Reduction')
  assert.equal(structure['最大生存支援'], 'Maximum Alive Reinforcements')
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'fixture' })
  const map = runtime.parseItem(base + '輿圖掉落物: +140%（增幅）' + body + '承受来自致盲敌人的伤害提高 20%', 'fixture')
  assert.equal(map.atlasDrops, 140)
  assert.equal(map.explicitMods[0], '20% increased Damage taken from Blinded Enemies')
  assert.equal(matchMapRequirements(map, { match: { blacklist: ['#% increased Damage taken from Blinded Enemies'] } }).reason, 'blacklist')
  const heist = runtime.parseItem(base.replace('Maps', 'Contracts') + '警戒等級減免: 20%\n最大生存支援: 30%' + body + 'Monsters deal 20% increased Damage', 'fixture')
  assert.equal(heist.heistStats.alertLevelReduction, 20)
  assert.equal(heist.heistStats.maximumAliveReinforcements, 30)
  const wrongHash = entries.map(entry => ({ ...entry, sourceHash: createHash('sha256').update(entry.en.replace(/\[[^|]+\|([^\]]+)\]/g, '$1')).digest('hex') }))
  assert.throws(() => createLocalizationDictionary(wrongHash).toEnglish('輿圖掉落物', { strict: true }), /未匹配/)
})

test('可见词缀数值保留符号、详细范围和固定数值边界', () => {
  const dictionary = createLocalizationDictionary(entries)
  for (const [input, expected] of [
    ['物品稀有度 +25%', '+25% to Item Rarity'], ['+25%物品稀有度', '+25% to Item Rarity'],
    ['物品稀有度 -25%', '-25% to Item Rarity'], ['物品稀有度 +25(20—30)%', '+25(20—30)% to Item Rarity']
  ]) assert.equal(dictionary.toEnglish(input, { strict: true }), expected)
  assert.ok(dictionary.aliasesFor('+25% to Item Rarity').includes('+25%物品稀有度'))
  assert.equal(dictionary.toEnglish('每 10 秒，在 4 秒内获得等同于\n物理伤害 25% 的额外火焰伤害'), 'Every 10 seconds, gain 25% of Physical Damage\nas Extra Fire Damage for 4 seconds')
  assert.throws(() => dictionary.toEnglish('每 110 秒，在 4 秒内获得等同于\n物理伤害 25% 的额外火焰伤害', { strict: true }), /未匹配/)
})

test('多行词缀保持换行和参数身份，允许同一词缀中英混合且不拼接无关行', () => {
  const runtime = new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'fixture' })
  const expected = ['3% more Spell Damage per Power Charge', 'Gain Power Charges instead of Frenzy Charges']
  for (const text of ['每个暴击球使法术伤害总增 3%\n获得暴击球来取代狂怒球', '每顆暴擊球 3% 更多法術傷害\n獲得暴擊球而不是狂怒球', '每个暴击球使法术伤害总增 3%\nGain Power Charges instead of Frenzy Charges']) {
    const item = runtime.parseItem(base + body + text, 'fixture')
    assert.deepEqual(item.explicitMods, expected)
    assert.equal(matchAffixes(item, [{ requiredAffixes: [{ kind: 'catalog', effectPattern: '#% more Spell Damage per Power Charge\nGain Power Charges instead of Frenzy Charges' }], selectedAffixes: [] }]).isMatch, true)
  }
  assert.throws(() => runtime.parseItem(base + body + '每个暴击球使法术伤害总增 3%\n完全未知效果', 'fixture'), /未匹配/)
})

test('别名缓存不暴露内部数组，不同词库实例和大量自由查询互不污染', () => {
  const dictionary = createLocalizationDictionary(entries)
  const first = dictionary.aliasesFor('Atlas Drops')
  first.push('污染别名')
  first[0] = '错误原文'
  assert.deepEqual(dictionary.aliasesFor('Atlas Drops'), ['Atlas Drops', '輿圖掉落物'])
  assert.equal(dictionary.localize('Atlas Drops'), '輿圖掉落物')
  assert.deepEqual(createLocalizationDictionary([]).aliasesFor('Atlas Drops'), ['Atlas Drops'])
  for (let index = 0; index < 10001; index++) dictionary.aliasesFor(`User text ${index}`)
  assert.deepEqual(dictionary.aliasesFor('Atlas Drops'), ['Atlas Drops', '輿圖掉落物'])
})
})()

// === Merged from localizationDistribution.test.js ===
await (async () => {
  const test = _m4_test
  const assert = _m4_assert
  const fs = _m4_fs
  const os = _m4_os
  const path = _m4_path
  const createHash = _m4_createHash
  const generateKeyPairSync = _m4_generateKeyPairSync
  const fileURLToPath = _m4_fileURLToPath
  const pathToFileURL = _m4_pathToFileURL
  const runInNewContext = _m4_runInNewContext
  const verifyLocalizationRuntime = _m4_verifyLocalizationRuntime
  const marketRuntimeFixture = _m4_marketRuntimeFixture
  const successfulMarketRun = _m4_successfulMarketRun
test('开发入口位于electron目录时仍从仓库根目录定位组件与公钥，安装版使用资源目录', () => {
  const mainUrl = new URL('../electron/main.js', import.meta.url)
  const source = fs.readFileSync(mainUrl, 'utf8')
  const initialization = source.match(/localization = new LocalizationService\(\{[\s\S]*?\n  \}\)/)?.[0]
  assert.ok(initialization)
  const root = fileURLToPath(new URL('../', import.meta.url))
  for (const isPackaged of [false, true]) {
    const resourcesPath = path.join(root, 'dist-electron', 'win-unpacked', 'resources')
    const runtimeMainUrl = isPackaged ? pathToFileURL(path.join(resourcesPath, 'app.asar', 'electron', 'main.js')) : mainUrl
    const scope = {
      LocalizationService: class { constructor(options) { Object.assign(this, options) } },
      serverMode: { mode: 'international', dataPath: () => 'unused' },
      app: { isPackaged, getAppPath: () => isPackaged ? path.join(resourcesPath, 'app.asar') : path.join(root, 'electron'), getPath: () => 'unused' },
      process: { resourcesPath, env: {} }, path, fileURLToPath, URL, mainUrl: runtimeMainUrl.href
    }
    runInNewContext(initialization.replaceAll('import.meta.url', 'mainUrl'), scope)
    assert.equal(scope.localization.executable, path.join(isPackaged ? resourcesPath : path.join(root, '.runtime'), 'localization-helper', 'LocalizationHelper.exe'))
    assert.equal(scope.localization.publicKeyFile, fileURLToPath(new URL('./assets/localization-public-key.pem', runtimeMainUrl)))
  }
})

test('缺失汉化组件不能通过未来安装包分发检查', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-localization-dist-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  assert.throws(() => verifyLocalizationRuntime(root), /localization:build/)
})

test('分发校验要求自包含运行时、匹配schema、公钥和实际组件自检', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-localization-dist-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const helper = path.join(root, '.runtime', 'localization-helper')
  fs.mkdirSync(helper, { recursive: true })
  for (const name of ['LocalizationHelper.exe', 'LocalizationHelper.dll', 'oo2core.dll', 'LibBundle3-LICENSE.txt', 'coreclr.dll', 'hostfxr.dll', 'hostpolicy.dll', 'System.Private.CoreLib.dll']) fs.writeFileSync(path.join(helper, name), '')
  fs.writeFileSync(path.join(helper, 'schema.json'), '{}')
  fs.writeFileSync(path.join(helper, 'source-schema-cn.json'), '{}')
  const metadata = { protocolVersion: 1, engineVersion: 1, schemaSha256: createHash('sha256').update('{}').digest('hex'), sourceSchemaSha256: createHash('sha256').update('{}').digest('hex') }
  fs.writeFileSync(path.join(helper, 'dependencies.json'), JSON.stringify(metadata))
  fs.mkdirSync(path.join(root, 'electron', 'assets'), { recursive: true })
  const keys = generateKeyPairSync('ed25519', { publicKeyEncoding: { type: 'spki', format: 'pem' } })
  fs.writeFileSync(path.join(root, 'electron', 'assets', 'localization-public-key.pem'), keys.publicKey)
  marketRuntimeFixture(root)
  const success = (file, args, options) => {
    if (path.basename(file) === 'MarketLocalizationSelfTest.exe' || args[0] === '--market-host') return successfulMarketRun(file, args, options)
    assert.equal(JSON.parse(options.input).operation, 'self-test'); return { status: 0, stdout: JSON.stringify({ protocolVersion: 1, type: 'result', success: true, data: { passed: true } }) }
  }
  assert.equal(verifyLocalizationRuntime(root, { run: success }).ready, true)
  fs.writeFileSync(path.join(helper, 'source-schema-cn.json'), '{"tampered":true}')
  assert.throws(() => verifyLocalizationRuntime(root, { run: success }), /指纹不一致/)
  fs.writeFileSync(path.join(helper, 'source-schema-cn.json'), '{}')
  assert.throws(() => verifyLocalizationRuntime(root, { run: () => ({ status: 1 }) }), /自检失败/)
  metadata.schemaSha256 = '0'.repeat(64)
  fs.writeFileSync(path.join(helper, 'dependencies.json'), JSON.stringify(metadata))
  assert.throws(() => verifyLocalizationRuntime(root, { run: success }), /指纹不一致/)
})
})()

// === Merged from localizationFragmentContext.test.js ===
await (async () => {
  const test = _m5_test
  const assert = _m5_assert
  const readFileSync = _m5_readFileSync
  const LocalizationRuntime = _m5_LocalizationRuntime
  const createLocalizationDictionary = _m5_createLocalizationDictionary
const entries = JSON.parse(readFileSync(new URL('./fixtures/crafting-duration-fragments.json', import.meta.url)))
const runtime = () => new LocalizationRuntime({ serverId: 'international', entries: () => entries, revision: () => 'fixture' })
const item = (body, itemClass = 'Utility Flasks', base = 'Diamond Flask') => `Item Class: ${itemClass}\nRarity: Rare\nFixture Name\n${base}\n--------\nItem Level: 84\n--------\n{ Prefix Modifier "Fixture" (Tier: 1) }\n${body}`

test('药剂繁体持续时间不匹配地图多行词缀的孤立片段，保留真实范围', () => {
  for (const [word, english] of [['增加', 'increased'], ['減少', 'reduced']]) for (const number of ['10', '10(9-11)']) {
    const body = `${word} ${number}% 持續時間`
    const parsed = runtime().parseItem(item(body), 'fixture')
    assert.deepEqual(parsed.explicitMods, [`10% ${english} Duration`])
    assert.equal(parsed.modifiers[0].displayText, body)
  }
})

test('完整或中英混合的地图多行上下文仍能解析，未知上下文仍拒绝', () => {
  const entry = entries.find(entry => entry.id === 'map_ultimatum_survival_encounter_time_+%' && entry.field === 'variant:0')
  const en = entry.en.replaceAll('\\n', '\n').replaceAll('{0}', '10')
  const tw = entry.tw.replaceAll('\\n', '\n').replaceAll('{0}', '10')
  for (const body of [tw, [en.split('\n')[0], tw.split('\n')[1]].join('\n'), [tw.split('\n')[0], en.split('\n')[1]].join('\n')]) {
    const parsed = runtime().parseItem(item(body, 'Maps', 'Fortress Map'), 'fixture')
    assert.equal(parsed.modifiers[0].text, en)
  }
  assert.equal(createLocalizationDictionary(entries).toEnglish('增加 10% 持續時間'), '10% increased Duration')
  assert.throws(() => runtime().parseItem(item(`未知主语\n${tw.split('\n')[1]}`), 'fixture'), error => error.code === 'LOCALIZATION_UNRESOLVED')
})
})()

// === Merged from localizationLifecycle.test.js ===
await (async () => {
  const test = _m6_test
  const assert = _m6_assert
  const EventEmitter = _m6_EventEmitter
  const readFileSync = _m6_readFileSync
  const PassThrough = _m6_PassThrough
  const Writable = _m6_Writable
  const LocalizationService = _m6_LocalizationService
  const LocalizationHelperClient = _m6_LocalizationHelperClient
  const ServerModeController = _m6_ServerModeController
  const createShutdownController = _m6_createShutdownController
  const createApplicationRestartController = _m6_createApplicationRestartController
  const ApplicationUpdateService = _m6_ApplicationUpdateService
const deferred = () => {
  let resolve
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}
const flush = () => new Promise(resolve => setImmediate(resolve))

test('汉化退出等待原生操作及词库激活完成，并拒绝新操作', async () => {
  const native = deferred()
  const calls = []
  const bundle = { manifest: { releaseId: 'next' }, entries: [], envelope: {} }
  const service = new LocalizationService({
    serverId: 'international', storageRoot: 'unused-lifecycle-test',
    downloader: { load: file => file === 'ready.json' ? bundle : null, check: async () => ({ releaseId: 'next', missingObjects: 0 }), download: async () => ({ downloadedBytes: 0 }), activate() { calls.push('activate') } },
    helper: { available: () => true, run: operation => operation === 'scan' ? { applied: false } : native.promise, waitForIdle: async () => { calls.push('native-closed') } },
    discover: async () => [],
    inspect: () => ({ gameDirectory: 'unused' }), assertWritable: async () => ({ gameDirectory: 'unused' }),
    verifyInstalled: () => ({ ready: true })
  })
  // Replace only directory selection; apply, activation and shutdown remain real.
  service.selectedGame = () => ({ gameDirectory: 'unused' })
  service.saveSettings = () => {}
  const pending = service.apply({ gameDirectory: 'unused' })
  await flush()
  const shutdown = service.shutdown().then(() => calls.push('shutdown'))
  await flush()
  assert.deepEqual(calls, [])
  await assert.rejects(service.check(), /退出|关闭/)
  native.resolve({ applied: true, resourceVersion: 'next' })
  await Promise.all([pending, shutdown])
  assert.deepEqual(calls, ['activate', 'native-closed', 'shutdown'])
  assert.equal(service.getActiveRevision(), 'next')
})

test('汉化组件报告失败后仍等待子进程真正关闭，输入管道异常会终止该子进程', async () => {
  const child = new EventEmitter()
  child.stdout = new PassThrough()
  child.stderr = new PassThrough()
  child.stdin = new Writable({ write(_chunk, _encoding, done) { done() } })
  let kills = 0
  child.kill = () => { kills++ }
  const helper = new LocalizationHelperClient({ spawnImpl: () => child })
  helper.available = () => true
  const pending = helper.run('apply', {})
  child.stdin.emit('error', new Error('fixture pipe error'))
  await assert.rejects(pending, /输入通道/)
  assert.equal(kills, 1)
  let closed = false
  const idle = helper.waitForIdle().then(() => { closed = true })
  await flush()
  assert.equal(closed, false)
  child.emit('close', 1)
  await idle
  assert.equal(closed, true)
})

for (const kind of ['quit', 'restart', 'switch', 'install']) {
  test(`${kind} 在汉化准备结束之后才启动普通清理超时`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const native = deferred()
    const calls = []
    const prepareCleanup = () => { calls.push('wait-native'); return native.promise }
    const cleanup = async () => { calls.push('cleanup') }
    let pending
    if (kind === 'quit') {
      const app = { on() {}, quit() { calls.push('quit') } }
      pending = createShutdownController({ app, prepareCleanup, cleanup, timeoutMs: 1 }).requestShutdown()
    } else if (kind === 'restart') {
      pending = createApplicationRestartController({ prepareCleanup, cleanup, timeoutMs: 1,
        clearCache: async () => {}, markCleanupComplete() {}, restart() { calls.push('restart') },
        terminateAfterFailure() { calls.push('unexpected-terminate') }
      }).requestRestart()
    } else if (kind === 'switch') {
      const controller = new ServerModeController({
        userDataPath: '.',
        cleanup: async () => {},
        prepareCleanup,
        finalizeCleanup: async () => { await cleanup(); throw new Error('fixture stops before mode write') }
      })
      controller.mode = 'cn'
      pending = controller.switchTo('international')
    } else {
      const updater = new EventEmitter()
      updater.quitAndInstall = () => { calls.push('install') }
      const service = new ApplicationUpdateService({ updater, prepareCleanup, cleanup, cleanupTimeoutMs: 1,
        currentVersion: '1.0.0', isPackaged: true })
      service.downloadReady = true
      pending = service.restartAndInstall()
    }
    await flush()
    t.mock.timers.tick(20000)
    await flush()
    assert.deepEqual(calls, ['wait-native'])
    native.resolve()
    await pending
    assert.deepEqual(calls, ['wait-native', 'cleanup', ...({ quit: ['quit'], restart: ['restart'], switch: [], install: ['install'] }[kind])])
  })
}

test('主进程为退出、重启、切服和更新安装接入同一个汉化准备步骤', () => {
  const source = readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8')
  assert.match(source, /let localization = null/)
  assert.equal((source.match(/prepareCleanup: prepareLocalizationShutdown/g) || []).length, 4)
  assert.match(source, /await Promise\.all\(\[localization\?\.shutdown\(\), marketLocalization\?\.shutdown\(\)\]\)/)
})
})()

// === Merged from localizationOneClick.test.js ===
await (async () => {
  const test = _m7_test
  const assert = _m7_assert
  const fs = _m7_fs
  const os = _m7_os
  const path = _m7_path
  const generateKeyPairSync = _m7_generateKeyPairSync
  const LocalizationService = _m7_LocalizationService
  const LocalizationDownloader = _m7_LocalizationDownloader
  const buildRelease = _m7_buildRelease
function fixture(t, { fail = '', games, checkWait } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-oneclick-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const game = { gameDirectory: path.join(root, 'game'), gameVersion: '3.30.0b', buildId: '123' }
  const old = { manifest: { releaseId: 'old', gameVersion: game.gameVersion }, entries: [], envelope: { old: true } }
  const next = { manifest: { releaseId: 'next', gameVersion: game.gameVersion }, entries: [], envelope: { next: true } }
  const calls = []
  let ready = null
  function record(step) { calls.push(step); if (fail === step) throw new Error(`failure:${step}`) }
  const downloader = {
    load: file => file === 'ready.json' ? ready : old,
    async check() { record('check'); await checkWait; return { releaseId: 'next', gameVersion: game.gameVersion, missingObjects: 1, downloadBytes: 10 } },
    async download() { record('download'); ready = next; return { downloadedObjects: 1, downloadedBytes: 10, releaseId: 'next' } },
    activate(envelope) { if (envelope === next.envelope) record('activate') }
  }
  const helper = { available: () => true, async run(operation, input) {
    record(operation)
    assert.equal(input.gameDirectory, game.gameDirectory)
    assert.equal(Object.hasOwn(input, 'baselineConfirmed'), false)
    return operation === 'scan' ? { ...game, applied: true, resourceVersion: 'old' } : { ...game, applied: true, resourceVersion: 'next' }
  }, async waitForIdle() { calls.push('idle') } }
  const service = new LocalizationService({ serverId: 'international', storageRoot: root, downloader, helper,
    discover: async () => { record('discover'); return games ?? [game] },
    inspect: directory => { assert.equal(directory, game.gameDirectory); return game },
    assertWritable: async directory => { assert.equal(directory, game.gameDirectory); record('writable'); return game },
    verifyInstalled: () => ({ ready: true }) })
  return { root, game, service, calls }
}

test('一键汉化自动选择唯一安装，检测版本后检查、下载、应用；全过程保持忙碌', async t => {
  const { service, calls, game } = fixture(t)
  assert.deepEqual(calls, [], '初始化和查看页面不会扫描或联网')
  const states = []
  service.on('state', state => states.push(state))
  const result = await service.apply()
  assert.deepEqual(calls, ['discover', 'writable', 'scan', 'check', 'download', 'writable', 'apply', 'activate'])
  assert.equal(result.gameDirectory, game.gameDirectory)
  assert.equal(result.resourceVersion, 'next')
  assert.equal(result.scan.applied, true)
  assert.equal(result.busy, false)
  assert.ok(states.slice(0, -1).every(state => state.busy))
})

test('已有汉化安装的旧事务路径线索在选择另一安装后仍可跨重启使用', async t => {
  const { root, game } = fixture(t)
  const legacyGameDirectory = path.join(root, 'old-steam-library', 'game')
  fs.writeFileSync(path.join(root, 'settings.json'), JSON.stringify({ gameDirectory: legacyGameDirectory }))
  const options = { serverId: 'international', storageRoot: root, downloader: { load: () => null },
    discover: async () => [game], inspect: () => game,
    helper: { available: () => true, run: async (_operation, input) => {
      assert.equal(input.gameDirectory, game.gameDirectory)
      assert.equal(input.legacyGameDirectory, legacyGameDirectory)
      throw new Error('scan interrupted')
    } },
    verifyInstalled: () => ({ ready: false })
  }
  await assert.rejects(new LocalizationService(options).scan({ gameDirectory: game.gameDirectory }), /scan interrupted/)
  const restarted = new LocalizationService(options)
  assert.equal(restarted.getStatus().gameDirectory, game.gameDirectory)
  await assert.rejects(restarted.scan(), /scan interrupted/)
})

for (const fail of ['writable', 'scan', 'check', 'download', 'apply']) {
  test(`一键汉化在 ${fail} 失败后立即停止，保留已应用词库并允许重试`, async t => {
    const { service, calls } = fixture(t, { fail })
    await assert.rejects(service.apply(), new RegExp(`failure:${fail}`))
    assert.equal(calls.at(-1), fail)
    assert.equal(service.getStatus().busy, false)
    assert.equal(service.getActiveRevision(), 'old')
    assert.match(service.getStatus().error, new RegExp(`failure:${fail}`))
  })
}

test('检测到多个Steam安装且未选择时停止，不猜测目标游戏或联网', async t => {
  const { service, calls } = fixture(t, { games: [{ gameDirectory: 'first' }, { gameDirectory: 'second' }] })
  await assert.rejects(service.apply(), /选择.*目录|多个/)
  assert.deepEqual(calls, ['discover'])
})

test('清空目录后自动检测新安装，不沿用已经失效的保存路径', async t => {
  const { service, game } = fixture(t)
  service.state.gameDirectory = 'removed-steam-library'
  const result = await service.apply({ gameDirectory: '' })
  assert.equal(result.gameDirectory, game.gameDirectory)
  assert.equal(result.resourceVersion, 'next')
})

test('发现未完成事务时先恢复本地文件，资源服务离线也不会阻碍本地恢复', async t => {
  const { service, calls, game } = fixture(t, { fail: 'check' })
  service.helper.run = async operation => {
    calls.push(operation)
    return operation === 'scan' ? { ...game, applied: true, resourceVersion: 'old', recoveryNeeded: true } : { ...game, applied: false, restored: true, recoveryNeeded: false }
  }
  await assert.rejects(service.apply(), /failure:check/)
  assert.deepEqual(calls, ['discover', 'writable', 'scan', 'restore', 'check'])
  assert.equal(service.getActiveRevision(), '')
  assert.equal(service.getStatus().scan.applied, false)
})

test('下载期间玩家启动游戏时，写入前再次检查并停止，不应用新词库', async t => {
  const { service, calls } = fixture(t)
  const checkWritable = service.assertWritable
  let checks = 0
  service.assertWritable = async directory => {
    if (++checks === 2) throw new Error('请先退出游戏')
    return checkWritable(directory)
  }
  await assert.rejects(service.apply(), /退出游戏/)
  assert.equal(checks, 2)
  assert.equal(calls.includes('download'), true)
  assert.equal(calls.includes('apply'), false)
  assert.equal(service.getActiveRevision(), 'old')
  assert.equal(service.getStatus().busy, false)
})

test('资源检查期间重复点击被拒绝，退出等待整条一键流程完成', async t => {
  let releaseCheck
  const checkWait = new Promise(resolve => { releaseCheck = resolve })
  const { service, calls } = fixture(t, { checkWait })
  const pending = service.apply()
  while (!calls.includes('check')) await new Promise(resolve => setImmediate(resolve))
  await assert.rejects(service.apply(), /正在执行|等待/)
  let stopped = false
  const shutdown = service.shutdown().then(() => { stopped = true })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(stopped, false)
  await assert.rejects(service.apply(), /退出|重启/)
  releaseCheck()
  await Promise.all([pending, shutdown])
  assert.deepEqual(calls.slice(-3), ['apply', 'activate', 'idle'])
  assert.equal(service.getActiveRevision(), 'next')
})

test('真实签名缓存复用：再次一键汉化仍检查频道，但没有变化资源下载请求', async t => {
  const { root, game } = fixture(t)
  const keys = generateKeyPairSync('ed25519', { privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } })
  const release = buildRelease({ protocolVersion: 1, engineVersion: 1, gameVersion: game.gameVersion,
    entries: [{ table: 'data/clientstrings.datc64', id: 'name', field: 'Text', en: 'Name', tw: '名稱', cn: '名称' }] }, keys.privateKey, { releaseId: 'cached' })
  let channels = 0, objects = 0, applied = false
  const downloader = new LocalizationDownloader({ storageRoot: root, publicKey: keys.publicKey, fetchImpl: async url => {
    if (url.endsWith('/stable.json')) { channels++; return new Response(JSON.stringify(release.envelope)) }
    objects++
    return new Response(release.blobs.get(url.split('/').pop()))
  } })
  const service = new LocalizationService({ serverId: 'international', storageRoot: root, downloader,
    helper: { available: () => true, async run(operation) {
      if (operation === 'apply') applied = true
      return { ...game, applied, ...(applied ? { resourceVersion: 'cached' } : {}) }
    } }, discover: async () => [game], inspect: () => game, assertWritable: async () => game, verifyInstalled: () => ({ ready: true }) })
  await service.apply({ gameDirectory: game.gameDirectory })
  const firstObjects = objects
  assert.ok(firstObjects > 0)
  const second = await service.apply({ gameDirectory: game.gameDirectory })
  assert.equal(channels, 2)
  assert.equal(objects, firstObjects)
  assert.equal(second.download.downloadedBytes, 0)
  assert.equal(second.resourceVersion, 'cached')
})

function modeFixture(t, { cached = true, cacheVersion = '3.30.0b', failApply = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-localization-mode-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const game = { gameDirectory: path.join(root, 'game'), gameVersion: '3.30.0b', buildId: '123' }
  const bundle = { manifest: { releaseId: 'cached', gameVersion: cacheVersion }, entries: [{ table: 'baseitemtypes', id: 'wand', field: 'Name', en: 'Wand', tw: '法杖', cn: '法杖' }], envelope: {} }
  let installed = { ...game, applied: cached, resourceVersion: cached ? 'cached' : null, mode: cached ? 'simplified' : null }
  const calls = [], requests = []
  const service = new LocalizationService({ serverId: 'international', storageRoot: root,
    downloader: {
      load: () => cached ? bundle : null,
      check: async () => { calls.push('check'); return { releaseId: 'cached', missingObjects: 0, downloadBytes: 0 } },
      download: async () => { calls.push('download'); return { releaseId: 'cached', downloadedBytes: 0, downloadedObjects: 0 } },
      activate() {}
    },
    helper: { available: () => true, run: async (operation, input) => {
      calls.push(operation)
      if (operation === 'scan') return installed
      requests.push(input)
      if (failApply) throw new Error('mode apply failed')
      installed = { ...game, applied: true, resourceVersion: input.manifest?.releaseId || 'native-tw', mode: input.mode }
      return installed
    } },
    discover: async () => { calls.push('discover'); return [game] }, inspect: () => game,
    assertWritable: async () => { calls.push('writable'); return game },
    verifyInstalled: () => ({ ready: true, mode: installed.mode })
  })
  return { service, calls, requests }
}

test('切繁体只使用本地资源，不检查或下载服务器词库，保留同版已验证映射', async t => {
  const { service, calls, requests } = modeFixture(t)
  const result = await service.apply({ mode: 'traditional' })
  assert.deepEqual(calls, ['discover', 'writable', 'scan', 'writable', 'apply'])
  assert.equal(requests[0].mode, 'traditional')
  assert.deepEqual(requests[0].entries, [])
  assert.equal(requests[0].manifest.releaseId, 'cached')
  assert.equal(result.mode, 'traditional')
  assert.equal(result.busy, false)
  assert.equal(service.getActiveRevision(), 'cached')
})

for (const options of [{ cached: false }, { cacheVersion: '3.29.3b' }]) {
  test(`没有同版词库也能离线切繁体：${JSON.stringify(options)}`, async t => {
    const { service, calls, requests } = modeFixture(t, options)
    const result = await service.apply({ mode: 'traditional' })
    assert.equal(calls.includes('check'), false)
    assert.equal(calls.includes('download'), false)
    assert.deepEqual(requests[0].entries, [])
    assert.equal(requests[0].manifest, null)
    assert.equal(result.scan.resourceVersion, 'native-tw')
    assert.equal(result.mode, 'traditional')
    assert.equal(service.getActiveEntries().length, 0)
  })
}

test('切繁体失败时保留已应用的简体模式和映射', async t => {
  const { service, calls } = modeFixture(t, { failApply: true })
  await assert.rejects(service.apply({ mode: 'traditional' }), /mode apply failed/)
  assert.equal(calls.includes('check'), false)
  assert.equal(service.getStatus().mode, 'simplified')
  assert.equal(service.getActiveRevision(), 'cached')
  assert.equal(service.getStatus().busy, false)
})

test('非法汉化模式在扫描和联网之前拒绝', async t => {
  const { service, calls } = modeFixture(t)
  for (const mode of ['english', '', null, 42]) await assert.rejects(service.apply({ mode }), /模式|mode/i)
  assert.deepEqual(calls, [])
  assert.equal(service.getStatus().busy, false)
})

test('组件未确认繁体模式时不把切换误报为成功', async t => {
  const { service } = modeFixture(t)
  const nativeRun = service.helper.run
  service.helper.run = async (...args) => {
    const result = await nativeRun(...args)
    if (args[0] === 'apply') delete result.mode
    return result
  }
  await assert.rejects(service.apply({ mode: 'traditional' }), /语言模式/)
  assert.equal(service.getStatus().busy, false)
})

test('语言偏好跨重启和游戏更新保留，扫描不误报已应用，恢复成功后清除', async t => {
  const { service, game } = fixture(t)
  await service.apply({ mode: 'simplified' })
  assert.equal(service.getStatus().preferredMode, 'simplified')
  const options = { serverId: 'international', storageRoot: service.storageRoot, downloader: service.downloader,
    helper: { available: () => true, run: async operation => operation === 'restore' ? { applied: false, restored: true } : { ...game, buildId: '124', applied: false } },
    discover: async () => [game], inspect: () => game, assertWritable: async () => game, verifyInstalled: () => ({ ready: false, reason: 'Steam 游戏版本已改变' }) }
  const restarted = new LocalizationService(options)
  assert.equal(restarted.getStatus().preferredMode, 'simplified')
  assert.equal(restarted.getStatus().mode, null)
  await restarted.scan()
  assert.equal(restarted.getStatus().preferredMode, 'simplified')
  assert.equal(new LocalizationService(options).getStatus().preferredMode, 'simplified')
  await restarted.restore()
  assert.equal(restarted.getStatus().preferredMode, null)
  assert.equal(new LocalizationService(options).getStatus().preferredMode, null)
})

async function cachedCrossVersionFixture(t) {
  const { root, game } = fixture(t)
  const keys = generateKeyPairSync('ed25519', { privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } })
  const release = buildRelease({ protocolVersion: 1, engineVersion: 1, gameVersion: '3.29.3b',
    entries: [{ table: 'clientstrings', id: 'name', field: 'Text', en: 'Name', tw: '名稱', cn: '名称' }] }, keys.privateKey, { releaseId: 'previous-version' })
  let failure = null
  const downloader = new LocalizationDownloader({ storageRoot: root, publicKey: keys.publicKey, fetchImpl: async url => {
    if (failure) {
      if (failure instanceof Error) throw failure
      return failure(url)
    }
    return new Response(url.endsWith('/stable.json') ? JSON.stringify(release.envelope) : release.blobs.get(url.split('/').pop()))
  } })
  await downloader.check(); await downloader.download(); downloader.activate(release.envelope)
  const requests = []
  let applied = false
  let installedMode = null
  let installedRelease = null
  const restart = () => new LocalizationService({ serverId: 'international', storageRoot: root, downloader,
    helper: { available: () => true, run: async (operation, input) => {
      if (operation === 'apply') { requests.push(input); applied = true; installedMode = input.mode; installedRelease = input.manifest.releaseId }
      return { ...game, applied, ...(applied ? { resourceVersion: installedRelease, mode: installedMode } : {}) }
    } }, discover: async () => [game], inspect: () => game, assertWritable: async () => game,
    verifyInstalled: () => ({ ready: applied, reason: 'Steam 游戏版本已改变' }) })
  return { service: restart(), restart, downloader, root, release, keys, requests, fail: value => { failure = value } }
}

test('游戏更新后服务不可达时重新验签本地跨版本词库，扫描不会丢失历史候选', async t => {
  const { service, downloader, root, requests, fail } = await cachedCrossVersionFixture(t)
  fs.unlinkSync(path.join(root, 'ready.json'))
  fail(new TypeError('fetch failed', { cause: Object.assign(new Error('connection refused'), { code: 'ECONNREFUSED' }) }))
  const result = await service.apply({ mode: 'simplified' })
  assert.equal(result.preferredMode, 'simplified')
  assert.equal(result.resourceVersion, 'previous-version')
  assert.equal(result.sourceGameVersion, '3.29.3b')
  assert.match(result.resourceWarning, /本地.*3\.29\.3b/)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].entries[0].cn, '名称')
  assert.equal(requests[0].manifest.gameVersion, '3.29.3b')
  assert.equal(downloader.load().manifest.releaseId, 'previous-version')
})

test('游戏更新后在线旧词库也可重新应用，不要求上传同版本资源', async t => {
  const { service, requests } = await cachedCrossVersionFixture(t)
  const result = await service.apply()
  assert.equal(result.resourceVersion, 'previous-version')
  assert.equal(requests.length, 1)
  assert.match(result.resourceWarning, /3\.29\.3b/)
})

test('重启后当前缓存损坏且服务离线时，仍可应用磁盘中完整验签的历史词库', async t => {
  const { restart, downloader, root, keys, requests, fail } = await cachedCrossVersionFixture(t)
  const latest = buildRelease({ protocolVersion: 1, engineVersion: 1, gameVersion: '3.30.0b',
    entries: [{ table: 'clientstrings', id: 'new-name', field: 'Text', en: 'New Name', cn: '新名称' }] }, keys.privateKey,
    { releaseId: 'latest-version', createdAt: '2026-11-21T00:00:00Z' })
  fail(url => new Response(url.endsWith('/stable.json') ? JSON.stringify(latest.envelope) : latest.blobs.get(url.split('/').pop())))
  await downloader.check()
  await downloader.download()
  downloader.activate(latest.envelope)
  fs.writeFileSync(downloader.objectPath(latest.envelope.manifest.objects[0].sha256), 'corrupt')
  fail(() => new Response('unavailable', { status: 503 }))

  const service = restart()
  assert.equal(service.getStatus().readyVersion, '')
  const result = await service.apply()
  assert.equal(result.resourceVersion, 'previous-version')
  assert.match(result.resourceWarning, /本地.*3\.29\.3b/)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].manifest.releaseId, 'previous-version')
})

test('更新对象下载中断时仅回退完整验签的本地词库，不激活半成品', async t => {
  const { service, keys, downloader, requests, fail } = await cachedCrossVersionFixture(t)
  const next = buildRelease({ protocolVersion: 1, engineVersion: 1, gameVersion: '3.30.0b',
    entries: [{ table: 'clientstrings', id: 'new-name', field: 'Text', en: 'New Name', cn: '新名称' }] }, keys.privateKey, { releaseId: 'next-version' })
  let objectRequests = 0
  fail(url => {
    if (url.endsWith('/stable.json')) return new Response(JSON.stringify(next.envelope))
    objectRequests++
    return new Response('unavailable', { status: 503 })
  })
  const result = await service.apply()
  assert.equal(result.resourceVersion, 'previous-version')
  assert.equal(objectRequests, 1)
  assert.equal(requests.length, 1)
  assert.match(result.resourceWarning, /本地/)
  assert.equal(downloader.loadRevision('next-version'), null)
})

test('超时可复用缓存，已收到但校验失败的新对象不能回退掩盖错误', async t => {
  const { service, keys, requests, fail } = await cachedCrossVersionFixture(t)
  fail(new DOMException('timed out', 'TimeoutError'))
  assert.equal((await service.apply()).resourceVersion, 'previous-version')
  const next = buildRelease({ protocolVersion: 1, engineVersion: 1, gameVersion: '3.30.0b',
    entries: [{ table: 'clientstrings', id: 'new-name', field: 'Text', en: 'New Name', cn: '新名称' }] }, keys.privateKey, { releaseId: 'next-version' })
  fail(url => new Response(url.endsWith('/stable.json') ? JSON.stringify(next.envelope) : 'corrupt'))
  await assert.rejects(service.apply(), /对象/)
  assert.equal(requests.length, 1)
})

for (const status of [401, 403]) {
  test(`资源 HTTP ${status} 不回退历史词库、不执行游戏写入`, async t => {
    const { service, requests, fail } = await cachedCrossVersionFixture(t)
    fail(() => new Response('denied', { status }))
    await assert.rejects(service.apply(), new RegExp(`HTTP ${status}`))
    assert.equal(requests.length, 0)
  })
}

test('服务临时失败可回退，签名错误和损坏本地对象均不能绕过校验', async t => {
  const { service, root, release, requests, fail } = await cachedCrossVersionFixture(t)
  fail(() => new Response('unavailable', { status: 503 }))
  const result = await service.apply()
  assert.equal(result.resourceVersion, 'previous-version')
  assert.equal(requests.length, 1)
  const tampered = structuredClone(release.envelope)
  tampered.manifest.gameVersion = 'tampered'
  fail(() => new Response(JSON.stringify(tampered)))
  await assert.rejects(service.apply(), /签名/)
  assert.equal(requests.length, 1)
  fs.writeFileSync(path.join(root, 'objects', release.envelope.manifest.objects[0].sha256), 'corrupt')
  fail(() => new Response('unavailable', { status: 503 }))
  await assert.rejects(service.apply(), /HTTP 503/)
  assert.equal(requests.length, 1)
})

test('同一词库版本简体与繁体可以往返切换，不跳过目标模式应用', async t => {
  const { service, calls, requests } = modeFixture(t)
  for (const mode of ['simplified', 'traditional', 'simplified']) {
    const result = await service.apply({ mode })
    assert.equal(result.mode, mode)
    assert.equal(result.scan.resourceVersion, 'cached')
  }
  assert.deepEqual(requests.map(request => request.mode), ['simplified', 'traditional', 'simplified'])
  assert.equal(calls.filter(call => call === 'check').length, 2)
  assert.equal(calls.filter(call => call === 'download').length, 2)
  assert.deepEqual(requests[1].entries, [])
})
})()

// === Merged from localizationSupportGem.test.js ===
await (async () => {
  const test = _m8_test
  const assert = _m8_assert
  const readFileSync = _m8_readFileSync
  const createHash = _m8_createHash
  const createSupportGemResolver = _m8_createSupportGemResolver
  const soulMantleText = _m8_soulMantleText
const entries = JSON.parse(readFileSync(new URL('./fixtures/localized-support-gem-entries.json', import.meta.url), 'utf8'))
const catalog = JSON.parse(readFileSync(new URL('../electron/modules/priceCheck/catalog.international.json', import.meta.url), 'utf8'))
const options = { catalog }
const english = 'Socketed Gems are Supported by Level 20 Spell Totem Support'
const reported = soulMantleText.split('\n').find(line => line.includes('寶石被等級'))

test('受信任辅助宝石模板识别实际零宽字符、混合注记与截图简体字形', () => {
  const resolver = createSupportGemResolver(entries)
  for (const text of [reported,
    '插槽中的寶石被等級 20 的 法術圖騰輔助 輔助',
    '插槽中的宝石被等级 20 的 法术图腾辅助 辅助',
    '插入的技能石被 20 级的法术图腾(辅)辅助']) assert.equal(resolver.resolve(text, options), english)
})

test('stat handler和ClientStrings均按各自参数编号解析支持名称', () => {
  for (const kind of ['stat', 'dat']) {
    const filtered = kind === 'stat' ? entries.filter(entry => entry.table !== 'clientstrings') : entries.filter(entry => entry.kind !== 'stat')
    const resolver = createSupportGemResolver(filtered)
    assert.equal(resolver.resolve(reported, options), english)
    assert.equal(resolver.resolve('插槽中的宝石被等级 20 的 未知辅助 辅助', options), null)
  }
})

test('未验证名称或模板、未知handler、无官方词缀与目录歧义均拒绝派生', () => {
  const invalid = entries.map(entry => ({ ...entry, sourceHash: '0'.repeat(64) }))
  assert.equal(createSupportGemResolver(invalid).resolve(reported, options), null)
  const invalidNames = entries.map(entry => ['grantedeffects', 'baseitemtypes'].includes(entry.table) ? { ...entry, sourceHash: '0'.repeat(64) } : entry)
  assert.equal(createSupportGemResolver(invalidNames).resolve(reported, options), null)
  const invalidStat = entries.filter(entry => entry.table !== 'clientstrings').map(entry => entry.kind === 'stat'
    ? { ...entry, stats: { ...entry.stats, variants: entry.stats.variants.map(variant => ({ ...variant, handlers: 'unknown 2 1' })) } } : entry)
  assert.equal(createSupportGemResolver(invalidStat).resolve(reported, options), null)
  const resolver = createSupportGemResolver(entries)
  for (const supplied of [{}, { stats: [] }, { stats: [
    { matchers: ['Socketed Gems are Supported by Level # Spell Totem'], ids: { explicit: 'explicit.one' } },
    { matchers: ['Socketed Gems are Supported by Level # Spell Totem'], ids: { explicit: 'explicit.two' } }
  ] }, { stats: [
    { matchers: ['Socketed Gems are Supported by Level # Spell Totem'], ids: { explicit: ['explicit.one', 'explicit.two'] } }
  ] }, { stats: [
    { matchers: ['Socketed Gems are Supported by Level # Spell Totem'], ids: { explicit: 'invalid id' } }
  ] }, { provider: 'poe-international', gameVersion: '3.30', unqueryableStats: [{ provider: 'poe-international', gameVersion: '3.30', id: 'explicit.indexable_support_15' }], stats: [
    { matchers: ['Socketed Gems are Supported by Level # Spell Totem'], ids: { explicit: 'explicit.indexable_support_15' } }
  ] }]) assert.equal(resolver.resolve(reported, { catalog: supplied }), null)
  assert.equal(resolver.resolve(reported), null)
  assert.equal(resolver.resolve(reported, { catalog, type: 'enchant' }), null)
})

test('相同可信译名对应不同辅助时不让目录替用户猜测', () => {
  const other = { ...entries.find(entry => entry.table === 'grantedeffects' && entry.field === 'SupportName'), id: 'SupportOther', en: 'Other Support' }
  other.sourceHash = createHash('sha256').update(other.en).digest('hex')
  assert.equal(createSupportGemResolver([...entries, other]).resolve(reported, options), null)
})
})()

// === Merged from localizedCatalogLifecycle.test.js ===
await (async () => {
  const test = _m9_test
  const assert = _m9_assert
  const readFileSync = _m9_readFileSync
  const vm = _m9_vm
  const createRenderer = _m9_createRenderer
  const nextTick = _m9_nextTick
  const useLocalizedCatalog = _m9_useLocalizedCatalog
  const localizedResultState = _m9_localizedResultState
  const generateVendorRegex = _m9_generateVendorRegex
  const createDefaultVendorConfig = _m9_createDefaultVendorConfig
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
})()

// === Merged from localizedFeatureCatalog.test.js ===
await (async () => {
  const test = _m10_test
  const assert = _m10_assert
  const loadLocalizedCatalog = _m10_loadLocalizedCatalog
  const catalogSearchText = _m10_catalogSearchText
  const catalogDisplayText = _m10_catalogDisplayText
  const applySkillCatalogSelection = _m10_applySkillCatalogSelection
  const searchSkillCatalog = _m10_searchSkillCatalog
  const updateSkillFreeText = _m10_updateSkillFreeText
  const createDefaultVendorConfig = _m10_createDefaultVendorConfig
  const generateVendorRegex = _m10_generateVendorRegex
  const createDefaultMapRegexConfig = _m10_createDefaultMapRegexConfig
  const generateMapRegex = _m10_generateMapRegex
  const mapRegexCatalog = _m10_mapRegexCatalog
  const beastRegexOptions = _m10_beastRegexOptions
  const generateBeastRegex = _m10_generateBeastRegex
  const localizedTemplateExpression = _m10_localizedTemplateExpression
const mapping = (text, aliases, extra = {}) => [text, { text, aliases, displayText: aliases[0] || text, ...extra }]
const expression = result => new RegExp(result.regex.slice(1, -1), 'imu')

test('汉化目录按2000项分批并保留完整模板；跨版本响应和失败不能混成活动词库', async () => {
  const requests = []
  const api = { catalog: async input => { requests.push(input); return { success: true, data: { revision: 'r1', aliases: input.texts.map(text => ({ text, aliases: [`汉化${text}`], displayText: `汉化${text}`, templates: [{ en: `${text} {0}`, aliases: [`汉化${text} {0}`] }] })) } } } }
  const texts = Array.from({ length: 2001 }, (_, index) => `Item ${index}`)
  const result = await loadLocalizedCatalog([...texts, texts[0]], { api, match: 'contains' })
  assert.deepEqual(requests.map(input => input.texts.length), [2000, 1])
  assert.ok(requests.every(input => input.match === 'contains'))
  assert.equal(result.aliases.size, 2001)
  assert.deepEqual(result.aliases.get('Item 0').templates, [{ en: 'Item 0 {0}', aliases: ['汉化Item 0 {0}'] }])
  assert.equal(catalogDisplayText('Item 0', result.aliases), '汉化Item 0')
  assert.match(catalogSearchText(['Item 0'], result.aliases), /汉化item 0/)
  let revision = 0
  await assert.rejects(loadLocalizedCatalog(texts, { api: { catalog: async () => ({ success: true, data: { revision: String(++revision), aliases: [] } }) } }), /已更新/)
  await assert.rejects(loadLocalizedCatalog(['Fireball'], { api: { catalog: async () => ({ success: false, error: { message: '资源失效' } }) } }), /资源失效/)
})

test('剧情技能简繁英文搜索指向同一国际服稳定ID，自定义文字仍保留', () => {
  const skills = [{ id: 'gem:fireball', name: 'Fireball', requiredLevel: 1, color: 'blue', kind: 'active' }]
  const aliases = new Map([mapping('Fireball', ['火球', '火球術'])])
  for (const query of ['FIREBALL', '火球', '火球術']) {
    const [selected] = searchSkillCatalog(skills, query, 30, aliases)
    assert.equal(selected.id, 'gem:fireball')
    assert.match(selected.value, /火球.*Fireball/)
    const skill = { id: 'user-skill', name: '' }
    applySkillCatalogSelection(skill, selected)
    assert.equal(skill.name, 'Fireball')
    assert.equal(skill.gemId, 'gem:fireball')
    updateSkillFreeText(skill, '我的火球方案')
    assert.equal(skill.name, '我的火球方案')
    assert.equal(skill.gemId, undefined)
  }
  assert.deepEqual(searchSkillCatalog(skills, '未知汉化', 30, aliases), [])
})

test('商店正则使用受管完整模板和数字实例，不丢失指定数值，也不串到不同效果', () => {
  const aliases = new Map([
    mapping('maximum Life', [], { templates: [{ en: '+{0} to maximum Life', aliases: ['+{0} 最大生命', '+{0} 最大生命值'] }] }),
    mapping('30% increased Movement Speed', ['移动速度提高 30%', '增加 30% 移動速度'])
  ])
  const config = createDefaultVendorConfig()
  config.common.selectedIds = ['max_life']
  const life = expression(generateVendorRegex(config, 'en', aliases))
  for (const text of ['+89 to maximum Life', '+89 最大生命', '+89 最大生命值']) assert.equal(life.test(text), true, text)
  assert.equal(life.test('+89 最大魔力'), false)
  config.common.selectedIds = []
  config.movement.selectedIds = ['movement_30']
  const movement = expression(generateVendorRegex(config, 'en', aliases))
  for (const text of ['30% increased Movement Speed', '移动速度提高 30%', '增加 30% 移動速度']) assert.equal(movement.test(text), true, text)
  for (const text of ['130% increased Movement Speed', '移动速度提高 20%', '增加 20% 移動速度']) assert.equal(movement.test(text), false, text)
})

test('地图中文数值属性保留阈值和数字边界，词缀模板支持简繁及英文', () => {
  const config = createDefaultMapRegexConfig('en')
  config.stats.atlasDrops = { enabled: true, value: 80 }
  const aliases = new Map([mapping('Atlas Drops:', ['异界掉落:', '異界掉落:'])])
  const numeric = expression(generateMapRegex(config, 'en', aliases))
  for (const label of ['Atlas Drops', '异界掉落', '異界掉落']) {
    assert.equal(numeric.test(`${label}: +80%`), true)
    assert.equal(numeric.test(`${label}: +79%`), false)
    assert.equal(numeric.test(`${label}: -80%`), false)
    assert.equal(numeric.test(`${label}:\n+80%`), false)
  }
  config.stats.atlasDrops.enabled = false
  const affix = mapRegexCatalog('en').affixes.find(item => /reflecting # Physical Damage/.test(item.value))
  config.includeAffixIds = [affix.id]
  aliases.set(...mapping(affix.value, ['稀有怪物拥有物理荆棘，反射 {0} 物理伤害', '稀有怪物擁有物理荊棘，反射 {0} 物理傷害']))
  const regex = expression(generateMapRegex(config, 'en', aliases))
  assert.equal(regex.test(affix.example), true)
  assert.equal(regex.test('稀有怪物拥有物理荆棘，反射 400 物理伤害'), true)
  assert.equal(regex.test('稀有怪物擁有物理荊棘，反射 600 物理傷害'), true)
  assert.equal(regex.test('稀有怪物擁有物理荊棘，反射 600 火焰傷害'), false)
})

test('野兽用当前国际服稳定ID与汉化名称，不误取相似名称；缺映射与超长不会截断复制', () => {
  const beast = beastRegexOptions('en')[0]
  const aliases = new Map([mapping(beast.name, ['测试红兽', '測試紅獸'])])
  const result = generateBeastRegex({ includeIds: [beast.id] }, 'en', aliases)
  for (const name of [beast.name, '测试红兽', '測試紅獸']) assert.equal(expression(result).test(name), true)
  assert.equal(expression(result).test('测试蓝兽'), false)
  const missing = generateBeastRegex({ includeIds: [beast.id] }, 'en', new Map())
  assert.equal(missing.regex, '')
  assert.match(missing.warnings.join(' '), /缺少.*完整映射/)
  aliases.set(...mapping(beast.name, ['长'.repeat(300)]))
  const tooLong = generateBeastRegex({ includeIds: [beast.id] }, 'en', aliases)
  assert.equal(tooLong.regex, '')
  assert.match(tooLong.warnings.join(' '), /未截断/)
  const literal = new RegExp(localizedTemplateExpression('获得 {0} 生命 (区域)'), 'u')
  assert.equal(literal.test('获得 25 生命 (区域)'), true)
  assert.equal(literal.test('获得 25 生命 X区域Y'), false)
})
})()

// === Merged from localizedMerchantSearch.test.js ===
await (async () => {
  const test = _m11_test
  const assert = _m11_assert
  const readFileSync = _m11_readFileSync
  const createHash = _m11_createHash
  const createLocalizationDictionary = _m11_createLocalizationDictionary
  const localizedSearchExpression = _m11_localizedSearchExpression
  const loadLocalizedCatalog = _m11_loadLocalizedCatalog
  const createDefaultVendorConfig = _m11_createDefaultVendorConfig
  const generateVendorRegex = _m11_generateVendorRegex
const fixture = JSON.parse(readFileSync(new URL('./fixtures/localized-merchant-stats.json', import.meta.url)))
const dictionary = createLocalizationDictionary(fixture.entries)
const query = { max_life: 'maximum Life', res_fire: 'Fire Resistance', movement_30: '30% increased Movement Speed' }
const compile = result => new RegExp(result.regex.slice(1, -1), 'imu')
async function catalog(data = dictionary) {
  return (await loadLocalizedCatalog(Object.values(query), { match: 'contains', api: { catalog: async ({ texts }) => ({ success: true, data: {
    revision: 'verified-active-fixture', aliases: texts.map(text => ({ text, aliases: data.aliasesFor(text), searchExpression: localizedSearchExpression(data, text) }))
  } }) } })).aliases
}
function config(id) {
  const result = createDefaultVendorConfig()
  result[id === 'max_life' ? 'common' : id === 'res_fire' ? 'resistance' : 'movement'].selectedIds = [id]
  return result
}

test('真实受管条目压缩后常用生命、火抗、30移速及组合仍能生成完整250字符内正则', async () => {
  assert.ok(fixture.entries.length > 100)
  for (const entry of fixture.entries) assert.equal(createHash('sha256').update(entry.en).digest('hex'), entry.sourceHash)
  const aliases = await catalog()
  for (const id of Object.keys(query)) {
    const compiled = aliases.get(query[id]).searchExpression
    assert.equal(compiled.complete, true, id)
    assert.equal(compiled.mapped, true, id)
    const result = generateVendorRegex(config(id), 'en', aliases)
    assert.ok(result.regex && result.length <= 250, `${id}: ${JSON.stringify(result)}`)
  }
  const combined = config('max_life')
  combined.resistance.selectedIds = ['res_fire']
  combined.movement.selectedIds = ['movement_30']
  const result = generateVendorRegex(combined, 'en', aliases)
  assert.ok(result.regex && result.length <= 250, JSON.stringify(result))
})

test('简繁英文压缩保持物品属性身份，不把魔力、冰抗、施法速度或130/20移速放行', async () => {
  const aliases = await catalog()
  for (const [id, positives, negatives] of [
    ['max_life', ['+89 to maximum Life', '+89 最大生命', '+89 最大生命 (crafted)', '+89 最大生命（工藝）', '生命上限提高 10%'], ['+89 to maximum Mana', '+89 最大魔力', '魔力上限提高 10%', ...['en', 'cn', 'tw'].map(locale => fixture.entries.find(entry => entry.id === 'ReminderTextCullingStrike')[locale])]],
    ['res_fire', ['+35% to Fire Resistance', '+35% 火焰抗性'], ['+35% to Cold Resistance', '+35% 冰霜抗性', '+35% 冰冷抗性']],
    ['movement_30', ['30% increased Movement Speed', '移动速度加快 30%', '增加 30% 移動速度'], ['130% increased Movement Speed', '移动速度加快 130%', '增加 130% 移動速度', '增加 20% 移動速度', '施法速度加快 30%', '增加 30% 施放速度', '增加 30% 攻擊速度']]
  ]) {
    const regex = compile(generateVendorRegex(config(id), 'en', aliases))
    for (const text of positives) assert.equal(regex.test(text), true, `${id}: ${text}`)
    for (const text of negatives) assert.equal(regex.test(text), false, `${id}: ${text}`)
  }
})

test('可信词库实例隔离缓存，歧义同文不能产生部分正则；损坏哈希不能贡献翻译', async () => {
  const fire = fixture.entries.find(entry => entry.en === '{0:+d}% to Fire Resistance')
  assert.ok(fire)
  const ambiguous = createLocalizationDictionary([...fixture.entries, { ...fire, id: 'collision-cold', en: '{0:+d}% to Cold Resistance', sourceHash: undefined }])
  const result = generateVendorRegex(config('res_fire'), 'en', await catalog(ambiguous))
  assert.equal(result.regex, '')
  assert.match(result.warnings.join(' '), /完整映射/)
  const invalid = createLocalizationDictionary([{ ...fire, sourceHash: '0'.repeat(64) }])
  assert.equal(localizedSearchExpression(invalid, 'Fire Resistance').mapped, false)
  assert.equal(localizedSearchExpression(dictionary, 'Fire Resistance').complete, true)
})

test('压缩传输仍保留超长拒绝，不返回截断条件', async () => {
  const aliases = await catalog()
  aliases.get('maximum Life').searchExpression = { expression: '长'.repeat(300), complete: true, mapped: true }
  const result = generateVendorRegex(config('max_life'), 'en', aliases)
  assert.equal(result.regex, '')
  assert.equal(result.overLimit, true)
  assert.match(result.warnings.join(' '), /未截断/)
})

test('物品类别头按字段分解避免排列膨胀，原版英文不依赖汉化映射', () => {
  const data = createLocalizationDictionary([])
  const result = localizedSearchExpression(data, 'Item Class: Amulets')
  assert.equal(result.complete, true)
  assert.ok(result.expression.length < 250)
  const regex = new RegExp(result.expression, 'imu')
  for (const text of ['物品类别: 项链', '物品種類: 護身符', 'Item Class: 項鍊']) assert.equal(regex.test(text), true, text)
  assert.equal(regex.test('物品类别: 戒指'), false)
  assert.equal(generateVendorRegex(config('max_life'), 'en').regex, '"maximum Life"')
  const rarity = createDefaultVendorConfig()
  rarity.common.selectedIds = ['item_rarity']
  assert.equal(compile(generateVendorRegex(rarity, 'en')).test('+25% to Item Rarity'), true)
})
})()
