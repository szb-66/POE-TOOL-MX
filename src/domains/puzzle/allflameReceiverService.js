import { ElMessage } from 'element-plus'
import { currentServer } from '@/utils/serverContext.js'
import { useFeatureModulesStore } from '@/stores/featureModules.js'
import { useBagStore } from '@/stores/bag.js'
import { useInterfaceDetectionStore } from '@/stores/interfaceDetection.js'
import { useSettingsStore } from '@/domains/settings/settingsStore.js'
import { runWithConfigurationGuide } from '@/domains/configurationGuide/configurationGuideStore.js'
import {
  collectAllflameReceiverConfigurationIssues,
  CONFIGURATION_ACTIONS,
  CONFIGURATION_MODULES
} from '@/domains/configurationGuide/configurationIssues.js'
import {
  ensureBagAutomationListeners,
  startBagDetection,
  suspendAllflameReceiverRuntime,
  updateBagRuntimeConfig
} from '@/utils/bagService.js'

export function isAllflameReceiverSupported() {
  return currentServer.id === 'cn' && currentServer.capabilities?.puzzle?.available !== false
}

export function isAllflameReceiverAvailable() {
  if (!isAllflameReceiverSupported()) return false
  try {
    return useFeatureModulesStore().isEnabled('puzzle')
  } catch {
    return true
  }
}

export function collectAllflameConfiguration(actionId = CONFIGURATION_ACTIONS.enable) {
  const interfaceStore = useInterfaceDetectionStore()
  const settingsStore = useSettingsStore()
  return collectAllflameReceiverConfigurationIssues({
    actionId,
    templates: interfaceStore.templates,
    inventory: settingsStore.inventory
  })
}

export async function setAllflameReceiverEnabled(enabled, { configurationGuideBypass = false } = {}) {
  const bagStore = useBagStore()
  if (enabled) {
    if (!isAllflameReceiverSupported()) {
      ElMessage.warning('当前服务器未适配永火接收舱一键入库')
      return false
    }
    if (!isAllflameReceiverAvailable()) {
      ElMessage.warning('过期赛季模块未添加，请先从侧边栏“更多”中添加后再启用')
      return false
    }
    if (!configurationGuideBypass) {
      const check = collectAllflameConfiguration(CONFIGURATION_ACTIONS.enable)
      if (!check.ok) {
        return runWithConfigurationGuide({
          moduleId: CONFIGURATION_MODULES.puzzle,
          actionId: CONFIGURATION_ACTIONS.enable,
          title: '完成永火接收舱一键入库配置',
          actionLabel: '启用',
          collect: () => collectAllflameConfiguration(CONFIGURATION_ACTIONS.enable),
          execute: () => setAllflameReceiverEnabled(true, { configurationGuideBypass: true })
        })
      }
    }
    ensureBagAutomationListeners()
    const result = await startBagDetection({ overrides: { allflameReceiverEnabled: true } })
    if (!result?.success) return false
    bagStore.setAllflameReceiverEnabled(true)
    ElMessage.success('永火接收舱一键入库已启用')
    return true
  }

  const result = await suspendAllflameReceiverRuntime({ persistDisable: true })
  if (!result?.success) return false
  ElMessage.success('永火接收舱一键入库已关闭')
  return true
}

export async function initAllflameReceiverAutomation({ restoreEnabled = true } = {}) {
  ensureBagAutomationListeners()
  const bagStore = useBagStore()
  if (!restoreEnabled || !isAllflameReceiverAvailable()) return { success: true }
  if (!bagStore.allflameReceiverEnabled) return { success: true }
  const result = await startBagDetection({
    silent: true,
    overrides: { allflameReceiverEnabled: true }
  })
  if (!result?.success) return { success: false, error: result?.error || '永火接收舱检测恢复失败' }
  return { success: true }
}

export async function suspendAllflameReceiver() {
  return suspendAllflameReceiverRuntime({ persistDisable: false })
}

export function syncAllflameReceiverRuntime(patch = {}) {
  return updateBagRuntimeConfig(patch)
}
