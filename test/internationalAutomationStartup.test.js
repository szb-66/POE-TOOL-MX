import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { serverContext } from '../shared/serverMode.js'

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('真实模块启动链路不恢复国际服三类存取任务且不改持久开关，国服仍按保存配置恢复', async () => {
  for (const serverId of ['international', 'cn']) {
    const disk = new Map([['bag', JSON.stringify({ moduleEnabled: true, allflameReceiverEnabled: true })], ['stash', JSON.stringify({ enabled: true })], ['junfeng', JSON.stringify({ enabled: true })]])
    const persisted = [...disk]
    let writes = 0
    let starts = 0
    const runtime = []
    const bagStore = { ...JSON.parse(disk.get('bag')), saveSettings: () => { writes++; disk.set('bag', JSON.stringify(bagStore)) } }
    const api = { events: new Proxy({}, { get: () => () => () => {} }) }
    const bagText = source('src/utils/bagService.js')
    const bagStart = bagText.indexOf('export async function initBagAutomation(')
    const bagDeclaration = bagText.slice(bagStart, bagText.indexOf('\nexport function disposeBagAutomation', bagStart)).replace('export ', '')
    const initBagAutomation = new Function('useBagStore', 'electronApi', 'startBagDetection', `let initialized = false; let disposers = []; ${bagDeclaration}; return initBagAutomation`)(
      () => bagStore, api, async () => { starts++ })
    const stores = {}
    for (const [id, file, syncName, saveName] of [
      ['stash', 'src/stores/stashPickup.js', 'syncRuntime', 'save'],
      ['junfeng', 'src/stores/junfeng.js', 'sync', 'persist']
    ]) {
      const text = source(file)
      const start = text.indexOf('async function initializeRuntime(')
      const declaration = text.slice(start, text.indexOf('\n  return {', start))
      const settings = { value: JSON.parse(disk.get(id)) }
      stores[id] = { settings, listen: () => () => {}, initializeRuntime: new Function('settings', syncName, saveName, 'loadCorrections', 'loadTrainingStatus', 'loadTrainingSessions',
        `${declaration}; return initializeRuntime`)(settings, async () => { runtime.push([id, settings.value.enabled]) }, () => { writes++; disk.set(id, JSON.stringify(settings.value)) }, async () => {}, async () => {}, async () => {}) }
    }
    const scope = {
      currentServer: serverContext(serverId), electronApi: api, initBagAutomation,
      useBagStore: () => bagStore, useStashPickupStore: () => stores.stash, useJunfengStore: () => stores.junfeng,
      useFeatureModulesStore: () => ({ enabledFeatures: [{ id: 'bag' }], isEnabled: () => true }),
      registerFeatureRuntimeAdapter: () => () => {}, setFeatureShortcutSynchronizer() {}, reportFeatureStartupEvent() {},
      ...Object.fromEntries(['useBatchCraftingStore', 'useChaosRecipeStore', 'useCombatStore', 'usePriceCheckStore', 'usePuzzleStore', 'useScriptStore', 'useStoryStore', 'useFaustusStore', 'useMapTrackerStore'].map(name => [name, () => ({})]))
    }
    const installText = source('src/features/installFeatureRuntime.js').replace(/^import\s+[\s\S]*?\sfrom\s+['"][^'"]+['"]\r?\n/gm, '').replace('export function installFeatureRuntime', 'function installFeatureRuntime')
    vm.runInNewContext(`${installText}\nglobalThis.install = installFeatureRuntime`, scope)
    const warnings = await scope.install({ router: {} }).initialize()
    assert.equal(warnings.length, 0, serverId)
    const restored = serverId === 'cn'
    assert.equal(bagStore.moduleEnabled, restored)
    assert.equal(bagStore.allflameReceiverEnabled, restored)
    assert.equal(starts, Number(restored))
    assert.deepEqual(runtime, [['stash', restored], ['junfeng', restored]])
    assert.equal(writes, 0)
    assert.deepEqual([...disk], persisted)
  }
})

test('国际服启动监听背包状态但不恢复入库检测或写入持久配置', async () => {
  const text = source('src/utils/bagService.js')
  const start = text.indexOf('export async function initBagAutomation(')
  const declaration = text.slice(start, text.indexOf('\nexport function disposeBagAutomation', start)).replace('export ', '')
  let starts = 0, saves = 0
  const store = { moduleEnabled: true, allflameReceiverEnabled: true, saveSettings: () => saves++ }
  const api = { events: new Proxy({}, { get: () => () => () => {} }) }
  const init = new Function('useBagStore', 'electronApi', 'startBagDetection', `let initialized = false; let disposers = []; ${declaration}; return initBagAutomation`)(
    () => store, api, async () => { starts++ })
  await init({ restoreEnabled: false })
  assert.equal(store.moduleEnabled, false)
  assert.equal(store.allflameReceiverEnabled, false)
  assert.equal(starts, 0)
  assert.equal(saves, 0)
})

for (const [file, syncName, saveName] of [
  ['src/stores/stashPickup.js', 'syncRuntime', 'save'],
  ['src/stores/junfeng.js', 'sync', 'persist']
]) {
  test(`${file} 国际服首次初始化关闭运行态并保留磁盘启用配置`, async () => {
    const text = source(file)
    const start = text.indexOf('async function initializeRuntime(')
    const declaration = text.slice(start, text.indexOf('\n  return {', start))
    const settings = { value: { enabled: true } }
    let writes = 0, runtimeEnabled
    const init = new Function('settings', syncName, saveName, 'loadCorrections', 'loadTrainingStatus', 'loadTrainingSessions',
      `${declaration}; return initializeRuntime`)(settings, async () => { runtimeEnabled = settings.value.enabled }, () => writes++, async () => {}, async () => {}, async () => {})
    const result = await init({ restoreEnabled: false, preserveEnabledOnFailure: true })
    assert.equal(result.success, true)
    assert.equal(runtimeEnabled, false)
    assert.equal(writes, 0)
  })
}
