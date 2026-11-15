import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

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
