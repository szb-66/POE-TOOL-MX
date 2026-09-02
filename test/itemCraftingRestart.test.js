import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { restartCraftingWithLatestConfig, retryAutomationWithLatestConfig } from '../src/utils/craftingRestart.js'
import { createItemCraftingRunPreset } from '../src/utils/itemPreset.js'

function source(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8')
}

test('物品制作完成浮窗提供重新开始按钮且地图完成态不受影响', () => {
  const view = source('../src/domains/overlay/OverlayView.vue')
  const content = source('../src/domains/overlay/components/OverlayContent.vue')

  assert.match(content, /defineEmits\(\[[^\]]*'confirm'[^\]]*'restart'[^\]]*'retry'[^\]]*'close'[^\]]*\]\)/)
  assert.match(content, /重新开始/)
  assert.match(content, /\$emit\('restart'\)/)
  assert.match(content, /:loading="isRestarting"/)
  assert.match(view, /@restart="handleRestart"/)
  assert.match(view, /restartCraftingWithLatestConfig\(\{ presetStore, settingsStore, startCrafting, craftingKind: stopCraftingKind\.value \}\)/)
  assert.match(view, /function restoreCompletedState\(snapshot, error\)[\s\S]*itemInfo\.value = snapshot\.itemInfo/)
  assert.match(view, /if \(!result\?\.success\)[\s\S]*restoreCompletedState\(completedSnapshot, result\?\.error\)/)

  const mapCompletion = content.match(/<!-- 地图制作流程停止后的确认按钮 -->([\s\S]*?)<!-- 制作停止后的关闭按钮 -->/)?.[1] || ''
  assert.doesNotMatch(mapCompletion, /重新开始|\$emit\('restart'\)/)
})

test('运行中的物品和地图制作隐藏关闭按钮，停止与等待状态仍保留关闭入口', () => {
  const content = source('../src/domains/overlay/components/OverlayContent.vue')

  assert.match(content, /v-if="isStopped && !isCompleted && !stopReason"/)
  assert.match(content, /v-if="isStopped && !isCompleted && !stopReason && !itemInfo\.affixMatch/)
  assert.match(content, /v-else class="overlay-placeholder"[\s\S]*v-if="!stopReason"/)
  assert.match(content, /defineEmits\(\[[^\]]*'confirm'[^\]]*'restart'[^\]]*'retry'[^\]]*'close'[^\]]*\]\)/)
  assert.match(content, /v-if="canRetry"[\s\S]*\$emit\('retry'\)/)
})

test('浮窗重新开始重载最新预设和设置，删除的组合不进入新任务', async () => {
  let activePreset = {
    moduleTwo: {
      affixGroups: [
        { id: 'group-1', name: '组合 1' },
        { id: 'group-4', name: '组合 4' }
      ]
    }
  }
  let activeSettings = { itemPosition: { x: 1, y: 1 } }
  const persistedPreset = {
    moduleTwo: { affixGroups: [{ id: 'group-1', name: '组合 1' }] }
  }
  const persistedSettings = { itemPosition: { x: 9, y: 9 } }
  const calls = []

  const result = await restartCraftingWithLatestConfig({
    presetStore: {
      loadPresets() {
        calls.push('preset')
        activePreset = structuredClone(persistedPreset)
      }
    },
    settingsStore: {
      loadSettings() {
        calls.push('settings')
        activeSettings = structuredClone(persistedSettings)
      }
    },
    startCrafting() {
      calls.push('start')
      return {
        success: true,
        preset: structuredClone(activePreset),
        settings: structuredClone(activeSettings)
      }
    }
  })

  assert.deepEqual(calls, ['preset', 'settings', 'start'])
  assert.deepEqual(result.preset.moduleTwo.affixGroups.map(group => group.name), ['组合 1'])
  assert.deepEqual(result.settings.itemPosition, { x: 9, y: 9 })
})

test('配置未修改仍重新加载并生成任务，失败结果原样返回且不触发旧快照旁路', async () => {
  let reloads = 0
  let starts = 0
  const unchanged = await restartCraftingWithLatestConfig({
    presetStore: { loadPresets: () => { reloads += 1 } },
    settingsStore: { loadSettings: () => { reloads += 1 } },
    startCrafting: () => { starts += 1; return { success: true } }
  })
  const invalid = await restartCraftingWithLatestConfig({
    presetStore: { loadPresets: () => { reloads += 1 } },
    settingsStore: { loadSettings: () => { reloads += 1 } },
    startCrafting: () => { starts += 1; return { success: false, error: '词缀制作至少需要配置一个有效的达标组合' } }
  })

  assert.equal(unchanged.success, true)
  assert.deepEqual(invalid, { success: false, error: '词缀制作至少需要配置一个有效的达标组合' })
  assert.equal(reloads, 4)
  assert.equal(starts, 2)
})

test('旧物品制作快照重启 IPC 已删除且浮窗仍阻止重复点击', () => {
  const ipc = source('../electron/modules/ipc/python.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const view = source('../src/domains/overlay/OverlayView.vue')
  const service = source('../src/utils/scriptService.js')

  assert.doesNotMatch(ipc, /lastSuccessfulItemConfig|restart-last-item-script/)
  assert.doesNotMatch(preload, /restartLastItemScript|restart-last-item-script/)
  assert.doesNotMatch(api, /restartLastItem|restartLastItemScript/)
  assert.match(view, /if \(isRestarting\.value\) return/)
  assert.match(view, /async function handleRetry\(\)[\s\S]*if \(isRestarting\.value \|\| !canRetry\.value\) return[\s\S]*isRestarting\.value = true[\s\S]*retryAutomationWithLatestConfig/)
  assert.match(view, /function restoreStoppedState\(snapshot, error\)[\s\S]*recoveryCheckpoint\.value = snapshot\.recovery[\s\S]*stopReason\.value = error/)
  assert.match(service, /return \{ success: false, error \}/)
  assert.match(service, /return \{ \.\.\.result, success: true \}/)
  assert.match(service, /createItemCraftingRunPreset\(currentPreset, \{ forceInitialCheck, singleItemOnly \}\)/)
  assert.match(ipc, /termination: 'manual'[\s\S]*termination,[\s\S]*errorCode: termination === 'abnormal'/)
})


test('异常恢复重载最新配置，装备只对本次强制首次判断，地图携带检查点', async () => {
  const calls = []
  const stores = {
    presetStore: { loadPresets: () => calls.push('preset') },
    settingsStore: { loadSettings: () => calls.push('settings') }
  }
  const itemResult = await retryAutomationWithLatestConfig({
    mode: 'items',
    usageSessionId: 'usage-items',
    ...stores,
    startCrafting: options => { calls.push(['items', options]); return { success: true } },
    startMapRolling: () => { throw new Error('地图启动不应执行') }
  })
  const recovery = { targetKind: 'chart', col: 1, row: 2, processedCount: 3, qualifiedCount: 2, blacklistStats: {}, whitelistStats: {} }
  const mapResult = await retryAutomationWithLatestConfig({
    mode: 'map',
    recovery,
    usageSessionId: 'usage-map',
    ...stores,
    startCrafting: () => { throw new Error('装备启动不应执行') },
    startMapRolling: options => { calls.push(['map', options]); return { success: true } }
  })
  const batchRecovery = { usageSessionId: 'usage-batch', targets: [{ id: 'target-2' }], completedIds: ['target-1'] }
  const batchResult = await retryAutomationWithLatestConfig({
    mode: 'items',
    batchRecovery,
    usageSessionId: 'ignored-usage',
    ...stores,
    startCrafting: options => { calls.push(['batch', options]); return { success: true } },
    startMapRolling: () => { throw new Error('地图启动不应执行') }
  })

  assert.equal(itemResult.success, true)
  assert.equal(mapResult.success, true)
  assert.equal(batchResult.success, true)
  assert.deepEqual(calls, [
    'preset', 'settings', ['items', { craftingKind: 'general', forceInitialCheck: true, usageSessionId: 'usage-items', continueCurrencyUsage: true, configurationGuideBypass: true, singleItemOnly: true }],
    'preset', 'settings', ['map', { recovery, usageSessionId: 'usage-map', continueCurrencyUsage: true, configurationGuideBypass: true }],
    'preset', 'settings', ['batch', { craftingKind: 'general', forceInitialCheck: true, usageSessionId: 'usage-batch', continueCurrencyUsage: true, configurationGuideBypass: true, batchRecovery }]
  ])
})

test('单件异常重试仅在本次运行副本中关闭最新预设的批量模式', () => {
  const preset = {
    checkInitialItem: false,
    batchCrafting: { enabled: true, categoryIds: ['jewel'] },
    moduleTwo: { enabled: true, groups: [{ id: 'latest-group' }] }
  }

  const effectivePreset = createItemCraftingRunPreset(preset, {
    forceInitialCheck: true,
    singleItemOnly: true
  })

  assert.equal(effectivePreset.checkInitialItem, true)
  assert.equal(effectivePreset.batchCrafting.enabled, false)
  assert.deepEqual(effectivePreset.batchCrafting.categoryIds, ['jewel'])
  assert.deepEqual(effectivePreset.moduleTwo.groups, [{ id: 'latest-group' }])
  assert.equal(preset.batchCrafting.enabled, true)
})

test('批量异常优先读取主进程检查点续作，同时保留主动重新扫描入口', () => {
  const overlay = source('../src/domains/overlay/OverlayView.vue')
  const content = source('../src/domains/overlay/components/OverlayContent.vue')
  const runtime = source('../src/features/installFeatureRuntime.js')
  const preload = source('../electron/preload.cjs')
  const api = source('../src/api/electron.js')
  const ipc = source('../electron/modules/ipc/window.js')
  const restart = source('../src/utils/craftingRestart.js')

  const retryBody = overlay.slice(overlay.indexOf('async function handleRetry'), overlay.indexOf('async function handleBatchResume'))
  assert.doesNotMatch(retryBody, /batchRecovery/)
  assert.match(content, /v-if="canResumeBatch"[^>]*\$emit\('resume-batch'\)[\s\S]*继续批量制作/)
  assert.match(content, /返回重新扫描/)
  assert.match(overlay, /const canRetry = computed\([\s\S]*!batchRecoveryCheckpoint\.value/)
  assert.match(overlay, /async function refreshBatchRecovery\(\)[\s\S]*batchCrafting\.getRecovery\(\)/)
  assert.match(overlay, /async function handleBatchResume\(\)[\s\S]*refreshBatchRecovery\(\)[\s\S]*retryAutomationWithLatestConfig\(\{[\s\S]*batchRecovery: checkpoint/)
  assert.match(overlay, /async function handleBatchRescan\(\)[\s\S]*batchCrafting\.returnToScan\(\)/)
  assert.match(runtime, /batchCrafting\.onScanRequested[\s\S]*router\.push\('\/items'\)/)
  assert.match(preload, /returnToBatchCraftingScan[\s\S]*crafting-batch-return-to-scan/)
  assert.match(api, /returnToScan:\s*\(\) => window\.electronAPI\.returnToBatchCraftingScan/)
  assert.match(restart, /batchRecovery \? \{[\s\S]*batchRecovery[\s\S]*singleItemOnly: true/)
  assert.match(preload, /getBatchCraftingRecovery[\s\S]*crafting-batch-recovery-get/)
  assert.match(api, /getRecovery:\s*\(\) => window\.electronAPI\.getBatchCraftingRecovery/)
  assert.match(ipc, /overlay\.webContents !== event\.sender/)
  assert.match(ipc, /mainWindow\.webContents\.send\('crafting-batch-scan-requested'/)
  assert.match(ipc, /ipcMain\.handle\('crafting-batch-return-to-scan'/)
})
