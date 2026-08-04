import { ElMessage } from 'element-plus'
import { electronApi } from '@/api/electron'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from './diagnostics.js'
import { useBagStore } from '@/stores/bag'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { buildBagRuntimeConfig, validateBagRuntimeConfig } from './bagConfig.js'

let initialized = false
let disposers = []

function currentConfig(overrides = {}) {
  const bagStore = useBagStore()
  const settingsStore = useSettingsStore()
  const { inventory, operationDelayMs, ...bagOverrides } = overrides
  return buildBagRuntimeConfig({
    moduleEnabled: bagStore.moduleEnabled,
    immediateStash: bagStore.immediateStash,
    showStashButtonOnlyWhenReady: bagStore.showStashButtonOnlyWhenReady,
    templates: bagStore.templates,
    matchThreshold: bagStore.matchThreshold,
    blacklist: bagStore.blacklist,
    inventoryLayout: bagStore.inventoryLayout,
    ...bagOverrides
  }, {
    inventory: inventory || settingsStore.inventory,
    operationDelayMs: operationDelayMs ?? settingsStore.operationDelayMs
  })
}

let bagRuntimeQueue = Promise.resolve()

export function updateBagRuntimeConfig(patch = {}) {
  const bagStore = useBagStore()
  const commit = async () => {
    const candidate = currentConfig(patch)
    if (bagStore.moduleEnabled) {
      const error = validateBagRuntimeConfig(candidate)
      if (error) return { success: false, error }
      const result = await electronApi.bag.updateRuntimeConfig(candidate)
      if (!result?.success) return { success: false, error: result?.error || '背包运行配置同步失败' }
    }
    if ('blacklist' in patch) bagStore.setBlacklist(patch.blacklist)
    if ('inventoryLayout' in patch) bagStore.setInventoryLayout(patch.inventoryLayout)
    if ('immediateStash' in patch) bagStore.setImmediateStash(patch.immediateStash)
    if ('showStashButtonOnlyWhenReady' in patch) {
      bagStore.setShowStashButtonOnlyWhenReady(patch.showStashButtonOnlyWhenReady)
    }
    const settingsStore = useSettingsStore()
    if ('inventory' in patch) settingsStore.updateInventorySettings(patch.inventory)
    if ('operationDelayMs' in patch) settingsStore.updateOperationDelay(patch.operationDelayMs)
    return { success: true }
  }
  bagRuntimeQueue = bagRuntimeQueue.then(commit, commit)
  return bagRuntimeQueue
}

export async function updateBagPreferences(preferences = {}) {
  return updateBagRuntimeConfig(preferences)
}

export async function startBagDetection({ silent = false } = {}) {
  const bagStore = useBagStore()
  const config = currentConfig()
  const error = validateBagRuntimeConfig(config)
  if (error) {
    if (!silent) ElMessage.warning(error)
    return { success: false, error }
  }
  const result = await electronApi.bag.startDetection(config)
  if (result?.success) {
    bagStore.setDetectionStatus(true)
    bagStore.setStopReason('')
  }
  else if (!silent) ElMessage.error(`启动背包检测失败：${result?.error || '未知错误'}`)
  if (result?.success && result.warnings?.length && !silent) ElMessage.warning(result.warnings.join('；'))
  return result
}

export async function setBagModuleEnabled(enabled) {
  const bagStore = useBagStore()
  if (enabled) {
    const result = await startBagDetection()
    if (!result?.success) return false
    bagStore.setModuleEnabled(true)
    ElMessage.success('背包安全自动入库已启用')
    return true
  }
  await electronApi.bag.stopDetection()
  bagStore.setModuleEnabled(false)
  bagStore.resetStates()
  ElMessage.success('背包安全自动入库已关闭')
  return true
}

export async function startBagStash() {
  const bagStore = useBagStore()
  if (bagStore.isStashing) return { success: false, error: '入库正在进行中' }
  try {
    const result = await electronApi.bag.startStash()
    if (!result?.success) throw new Error(result?.error || '未知错误')
    bagStore.resetRunStats()
    bagStore.setStashingStatus(true)
    ElMessage.success('开始自动入库')
    void reportDiagnosticRecovery('bag', 'automation')
    return result
  } catch (error) {
    ElMessage.error(`启动入库失败：${error.message}`)
    void reportDiagnosticFailure('bag', 'automation', error, 'automation_failed')
    return { success: false, error: error.message }
  }
}

export async function stopBagStash() {
  const result = await electronApi.bag.stopStash()
  if (result?.success) useBagStore().setStashingStatus(false)
  return result
}

export async function initBagAutomation() {
  if (initialized) return
  initialized = true
  const bagStore = useBagStore()
  disposers = [
    electronApi.events.onBagDetectionMatch((data) => {
      bagStore.setMatchedStatus(Boolean(data.matched))
    }),
    electronApi.events.onBagDetectionStopped((data) => {
      bagStore.setDetectionStatus(false)
      bagStore.setMatchedStatus(false)
      if (data?.reason && data.reason !== 'process-ended') bagStore.setStopReason(data.reason)
    }),
    electronApi.events.onBagStashProgress((data) => {
      if (data.progress === 0) bagStore.resetRunStats()
      bagStore.setStashingStatus(true, data)
    }),
    electronApi.events.onBagStashCompleted((data) => {
      bagStore.setStashingStatus(false, data)
      bagStore.setStopReason('')
      ElMessage.success(`自动入库完成：入库 ${data.stashedSlots || 0} 格，黑名单保留 ${data.blacklistedSlots || 0} 格`)
    }),
    electronApi.events.onBagStashStopped((data) => {
      bagStore.setStashingStatus(false, data)
      bagStore.setStopReason(data?.reason || '未知原因')
      if (data?.reason && data.reason !== 'user-stopped' && data.reason !== 'process-ended') {
        ElMessage.warning(`入库已停止：${formatBagStopReason(data.reason)}`)
      }
    })
  ].filter(Boolean)

  if (bagStore.moduleEnabled) {
    try {
      await startBagDetection({ silent: true })
    } catch (error) {
      bagStore.setDetectionStatus(false)
      bagStore.setStopReason(error.message)
      void reportDiagnosticFailure('bag', 'detection', error, 'automation_failed')
    }
  }
}

export function disposeBagAutomation() {
  disposers.forEach((dispose) => dispose?.())
  disposers = []
  initialized = false
}

export function formatBagStopReason(reason) {
  const labels = {
    'game-not-foreground': '游戏窗口不在前台',
    'interface-lost': '仓库或背包界面已关闭',
    'user-stopped': '用户停止',
    'process-exited': '进程异常退出',
    'process-ended': '进程已结束'
  }
  return labels[reason] || String(reason || '未知原因')
}
