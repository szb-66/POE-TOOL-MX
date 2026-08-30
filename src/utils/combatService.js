import combatAssistTemplate from '@/assets/scripts/combat_assist_template.py?raw'
import { ElMessage } from 'element-plus'
import { electronApi } from '@/api/electron'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { useCombatStore } from '@/stores/combat'
import { validateLoopAssist, validatePotionAssist } from './combatConfig.js'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from './diagnostics.js'
import { runWithConfigurationGuide } from '@/domains/configurationGuide/configurationGuideStore.js'
import {
  collectCombatConfigurationIssues,
  CONFIGURATION_ACTIONS,
  CONFIGURATION_MODULES
} from '@/domains/configurationGuide/configurationIssues.js'

let statusListenerRegistered = false

export async function initCombatAssist() {
  const store = useCombatStore()
  if (!statusListenerRegistered) {
    electronApi.combat.onStatus(status => store.applyStatus(status))
    statusListenerRegistered = true
  }
  const [potionStatus, loopStatus] = await Promise.all([
    electronApi.combat.getPotionStatus(),
    electronApi.combat.getLoopStatus()
  ])
  store.applyStatus({ ...potionStatus, event: potionStatus.running ? 'running' : 'stopped' })
  store.applyStatus({ ...loopStatus, origin: 'loop', event: loopStatus.running ? 'running' : 'stopped' })
}

function collectCombatConfiguration(actionId) {
  return collectCombatConfigurationIssues({
    actionId,
    config: useSettingsStore().combatAssist
  })
}

export async function startPotionAssist({ configurationGuideBypass = false } = {}) {
  const settings = useSettingsStore()
  const store = useCombatStore()
  if (!configurationGuideBypass) {
    const check = collectCombatConfiguration(CONFIGURATION_ACTIONS.potion)
    if (!check.ok) {
      return runWithConfigurationGuide({
        moduleId: CONFIGURATION_MODULES.combat,
        actionId: CONFIGURATION_ACTIONS.potion,
        title: '完成自动喝药配置',
        actionLabel: '开始',
        collect: () => collectCombatConfiguration(CONFIGURATION_ACTIONS.potion),
        execute: () => startPotionAssist({ configurationGuideBypass: true })
      })
    }
  }
  const validation = validatePotionAssist(settings.combatAssist)
  if (!validation.isValid) {
    ElMessage.warning(validation.errors[0])
    return false
  }
  const result = await electronApi.combat.startPotion({
    scriptContent: combatAssistTemplate,
    config: JSON.parse(JSON.stringify(settings.combatAssist)),
      automationTiming: {
      operationDelayMs: settings.operationDelayMs,
      fixedTiming: settings.fixedTiming
    }
  })
  if (!result?.success) {
    store.applyStatus({
      running: false,
      event: 'error',
      error: result?.error || '启动自动喝药失败',
      failureCode: result?.failureCode || '',
      configurationIssueId: result?.configurationIssueId || ''
    })
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

export async function startLoopAssist({ configurationGuideBypass = false } = {}) {
  const settings = useSettingsStore()
  const store = useCombatStore()
  if (!configurationGuideBypass) {
    const check = collectCombatConfiguration(CONFIGURATION_ACTIONS.loop)
    if (!check.ok) {
      return runWithConfigurationGuide({
        moduleId: CONFIGURATION_MODULES.combat,
        actionId: CONFIGURATION_ACTIONS.loop,
        title: '完成主动循环配置',
        actionLabel: '开始',
        collect: () => collectCombatConfiguration(CONFIGURATION_ACTIONS.loop),
        execute: () => startLoopAssist({ configurationGuideBypass: true })
      })
    }
  }
  const validation = validateLoopAssist(settings.combatAssist)
  if (!validation.isValid) {
    ElMessage.warning(validation.errors[0])
    return false
  }
  const result = await electronApi.combat.startLoop({
    scriptContent: combatAssistTemplate,
    config: JSON.parse(JSON.stringify(settings.combatAssist)),
      automationTiming: {
      operationDelayMs: settings.operationDelayMs,
      fixedTiming: settings.fixedTiming
    }
  })
  if (!result?.success) {
    store.applyStatus({
      running: false,
      origin: 'loop',
      event: 'error',
      error: result?.error || '启动主动循环失败',
      failureCode: result?.failureCode || '',
      configurationIssueId: result?.configurationIssueId || ''
    })
    ElMessage.error(result?.error || '启动主动循环失败')
    void reportDiagnosticFailure('combat', 'script_start', result, 'process_start_failed')
    return false
  }
  store.applyStatus({ running: true, origin: 'loop', processId: result.processId, event: 'starting' })
  if (!result.alreadyRunning) ElMessage.success('主动循环已启动')
  void reportDiagnosticRecovery('combat', 'script_start')
  return true
}

export async function stopLoopAssist() {
  const store = useCombatStore()
  const result = await electronApi.combat.stopLoop()
  if (!result?.success) {
    ElMessage.error(result?.error || '停止主动循环失败')
    return false
  }
  store.applyStatus({ running: false, origin: 'loop', event: 'stopped' })
  if (!result.alreadyStopped) ElMessage.success('主动循环已停止')
  return true
}

export async function sampleCombatPixel(point) {
  return electronApi.combat.samplePixel({
    scriptContent: combatAssistTemplate,
    point: { x: Number(point?.x) || 0, y: Number(point?.y) || 0 }
  })
}

export async function executePortalAssist({ configurationGuideBypass = false } = {}) {
  const settings = useSettingsStore()
  const store = useCombatStore()
  if (!configurationGuideBypass) {
    const check = collectCombatConfiguration(CONFIGURATION_ACTIONS.portal)
    if (!check.ok) {
      return runWithConfigurationGuide({
        moduleId: CONFIGURATION_MODULES.combat,
        actionId: CONFIGURATION_ACTIONS.portal,
        title: '完成一键回城配置',
        actionLabel: '执行回城',
        collect: () => collectCombatConfiguration(CONFIGURATION_ACTIONS.portal),
        execute: () => executePortalAssist({ configurationGuideBypass: true })
      })
    }
  }
  const result = await electronApi.combat.executePortal({
    scriptContent: combatAssistTemplate,
    config: { portal: JSON.parse(JSON.stringify(settings.combatAssist.portal)) },
      automationTiming: {
      operationDelayMs: settings.operationDelayMs,
      fixedTiming: settings.fixedTiming
    }
  })
  if (!result?.success) {
    store.applyPortalFailure(result)
    ElMessage.error(result?.error || '一键回城执行失败')
    void reportDiagnosticFailure('combat', 'automation', result, 'automation_failed')
    return false
  }
  store.applyPortalFailure(null)
  ElMessage.success('回城流程已执行')
  void reportDiagnosticRecovery('combat', 'automation')
  return true
}
