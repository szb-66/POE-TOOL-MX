import combatAssistTemplate from '@/assets/scripts/combat_assist_template.py?raw'
import { ElMessage } from 'element-plus'
import { electronApi } from '@/api/electron'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { useCombatStore } from '@/stores/combat'
import { validateCombatAssist } from './combatConfig.js'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from './diagnostics.js'

let statusListenerRegistered = false

export async function initCombatAssist() {
  const store = useCombatStore()
  if (!statusListenerRegistered) {
    electronApi.combat.onStatus(status => store.applyStatus(status))
    statusListenerRegistered = true
  }
  const status = await electronApi.combat.getPotionStatus()
  store.applyStatus({ ...status, event: status.running ? 'running' : 'stopped' })
}

export async function startPotionAssist() {
  const settings = useSettingsStore()
  const store = useCombatStore()
  const validation = validateCombatAssist(settings.combatAssist)
  if (!validation.isValid) {
    ElMessage.warning(validation.errors[0])
    return false
  }
  const result = await electronApi.combat.startPotion({
    scriptContent: combatAssistTemplate,
    config: JSON.parse(JSON.stringify(settings.combatAssist))
  })
  if (!result?.success) {
    ElMessage.error(result?.error || '启动自动喝药失败')
    void reportDiagnosticFailure('combat', 'script_start', result, 'process_start_failed')
    return false
  }
  store.applyStatus({ running: true, processId: result.processId, event: 'starting' })
  if (!result.alreadyRunning) ElMessage.success('自动喝药已启动')
  void reportDiagnosticRecovery('combat', 'script_start')
  return true
}

export async function stopPotionAssist() {
  const store = useCombatStore()
  const result = await electronApi.combat.stopPotion()
  if (!result?.success) {
    ElMessage.error(result?.error || '停止自动喝药失败')
    return false
  }
  store.applyStatus({ running: false, event: 'stopped' })
  if (!result.alreadyStopped) ElMessage.success('自动喝药已停止')
  return true
}

export async function sampleCombatPixel(point) {
  return electronApi.combat.samplePixel({
    scriptContent: combatAssistTemplate,
    point: { x: Number(point?.x) || 0, y: Number(point?.y) || 0 }
  })
}

export async function executePortalAssist() {
  const settings = useSettingsStore()
  const result = await electronApi.combat.executePortal({
    scriptContent: combatAssistTemplate,
    config: { portal: JSON.parse(JSON.stringify(settings.combatAssist.portal)) }
  })
  if (!result?.success) {
    ElMessage.error(result?.error || '一键回城执行失败')
    void reportDiagnosticFailure('combat', 'automation', result, 'automation_failed')
    return false
  }
  ElMessage.success('回城流程已执行')
  void reportDiagnosticRecovery('combat', 'automation')
  return true
}
