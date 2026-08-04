import { ElMessage } from 'element-plus'
import { useChaosRecipeStore } from '../stores/chaosRecipe.js'
import { useInterfaceDetectionStore } from '../stores/interfaceDetection.js'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from './diagnostics.js'

export async function startChaosRecipePicking() {
  const store = useChaosRecipeStore()
  const detectionStore = useInterfaceDetectionStore()

  if (!store.snapshot?.fullSetCount) {
    ElMessage.warning('请先在商城的混沌配方页刷新仓库并生成可取套装')
    return
  }
  if (!detectionStore.templates.stashTitle || !detectionStore.templates.inventoryTitle) {
    ElMessage.warning('请先在设置页配置仓库和背包标题模板')
    return
  }
  try {
    await store.startAutomation({
      templates: detectionStore.templates,
      matchThreshold: detectionStore.matchThreshold,
      operationDelayMs: store.settings.operationDelayMs
    })
    void reportDiagnosticRecovery('shop', 'automation')
  } catch (error) {
    ElMessage.error(error.message)
    void reportDiagnosticFailure('shop', 'automation', error, 'automation_failed')
  }
}

export async function toggleChaosRecipePicking() {
  const store = useChaosRecipeStore()
  try {
    if (store.automation.status === 'running') {
      await store.pauseAutomation()
    } else if (store.automation.status === 'paused') {
      await store.resumeAutomation()
    } else {
      ElMessage.warning('混沌配方取件当前未运行')
    }
  } catch (error) {
    ElMessage.error(error.message)
  }
}

export async function stopChaosRecipePicking() {
  const store = useChaosRecipeStore()
  try {
    await store.stopAutomation()
  } catch (error) {
    ElMessage.error(error.message)
  }
}
