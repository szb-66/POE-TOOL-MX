import { ElMessage } from 'element-plus'
import { electronApi } from '@/api/electron'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { useCombatStore } from '@/stores/combat'
import { validateLoopAssist, validatePotionAssist } from './combatConfig.js'
import { reportDiagnosticFailure, reportDiagnosticRecovery } from './diagnostics.js'
import { runWithConfigurationGuide } from '@/domains/configurationGuide/configurationGuideStore.js'
import { canUseGameInput } from './serverContext.js'
import { serverStorage } from './serverStorage.js'
import {
  collectCombatConfigurationIssues,
  CONFIGURATION_ACTIONS,
  CONFIGURATION_MODULES
} from '@/domains/configurationGuide/configurationIssues.js'

const COMBAT_RUNTIME_STORAGE_KEY = 'combatAssistRuntime'
let removeStatusListener = null

function loadCombatRuntimeState() {
  try {
    const raw = JSON.parse(serverStorage.getItem(COMBAT_RUNTIME_STORAGE_KEY) || '{}')
    return {
      potionRunning: Boolean(raw?.potionRunning),
      loopRunning: Boolean(raw?.loopRunning)
    }
  } catch {
    return { potionRunning: false, loopRunning: false }
  }
}

function saveCombatRuntimeState(patch = {}) {
  try {
    const next = { ...loadCombatRuntimeState(), ...patch }
    serverStorage.setItem(COMBAT_RUNTIME_STORAGE_KEY, JSON.stringify({
      potionRunning: Boolean(next.potionRunning),
      loopRunning: Boolean(next.loopRunning)
    }))
  } catch (error) {
    console.error('保存战斗辅助运行状态失败:', error)
  }
}

function combatInputAllowed(silent = false) {
  if (canUseGameInput('combat')) return true
  if (!silent) ElMessage.warning('当前服务器暂未开放战斗辅助')
  return false
}

export async function initCombatAssist({ restoreEnabled = true } = {}) {
  const store = useCombatStore()
  if (!removeStatusListener) removeStatusListener = electronApi.combat.onStatus(status => store.applyStatus(status))
  const [potionStatus, loopStatus] = await Promise.all([
    electronApi.combat.getPotionStatus(),
    electronApi.combat.getLoopStatus()
  ])
  store.applyStatus({ ...potionStatus, event: potionStatus.running ? 'running' : 'stopped' })
  store.applyStatus({ ...loopStatus, origin: 'loop', event: loopStatus.running ? 'running' : 'stopped' })
  if (!restoreEnabled || !canUseGameInput('combat')) return
  const saved = loadCombatRuntimeState()
  if (saved.potionRunning && !potionStatus?.running) {
    await startPotionAssist({ configurationGuideBypass: true, silent: true })
  }
  if (saved.loopRunning && !loopStatus?.running) {
    await startLoopAssist({ configurationGuideBypass: true, silent: true })
  }
}

function collectCombatConfiguration(actionId) {
  return collectCombatConfigurationIssues({
    actionId,
    config: useSettingsStore().combatAssist
  })
}

export function disposeCombatAssist() {
  removeStatusListener?.()
  removeStatusListener = null
}

export async function startPotionAssist({ configurationGuideBypass = false, silent = false } = {}) {
  if (!combatInputAllowed(silent)) return false
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
    if (!silent) ElMessage.warning(validation.errors[0])
    return false
  }
  const result = await electronApi.combat.startPotion({
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
    if (!silent) ElMessage.error(result?.error || '启动自动喝药失败')
    void reportDiagnosticFailure('combat', 'script_start', result, 'process_start_failed')
    return false
  }
  store.applyStatus({ running: true, processId: result.processId, event: 'starting' })
  saveCombatRuntimeState({ potionRunning: true })
  if (!silent && !result.alreadyRunning) ElMessage.success('自动喝药已启动')
  void reportDiagnosticRecovery('combat', 'script_start')
  return true
}

export async function stopPotionAssist({ persist = true, silent = false } = {}) {
  const store = useCombatStore()
  const result = await electronApi.combat.stopPotion()
  if (!result?.success) {
    if (!silent) ElMessage.error(result?.error || '停止自动喝药失败')
    return false
  }
  store.applyStatus({ running: false, event: 'stopped' })
  if (persist) saveCombatRuntimeState({ potionRunning: false })
  if (!silent && !result.alreadyStopped) ElMessage.success('自动喝药已停止')
  return true
}

export async function startLoopAssist({ configurationGuideBypass = false, silent = false } = {}) {
  if (!combatInputAllowed(silent)) return false
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
    if (!silent) ElMessage.warning(validation.errors[0])
    return false
  }
  const result = await electronApi.combat.startLoop({
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
    if (!silent) ElMessage.error(result?.error || '启动主动循环失败')
    void reportDiagnosticFailure('combat', 'script_start', result, 'process_start_failed')
    return false
  }
  store.applyStatus({ running: true, origin: 'loop', processId: result.processId, event: 'starting' })
  saveCombatRuntimeState({ loopRunning: true })
  if (!silent && !result.alreadyRunning) ElMessage.success('主动循环已启动')
  void reportDiagnosticRecovery('combat', 'script_start')
  return true
}

export async function stopLoopAssist({ persist = true, silent = false } = {}) {
  const store = useCombatStore()
  const result = await electronApi.combat.stopLoop()
  if (!result?.success) {
    if (!silent) ElMessage.error(result?.error || '停止主动循环失败')
    return false
  }
  store.applyStatus({ running: false, origin: 'loop', event: 'stopped' })
  if (persist) saveCombatRuntimeState({ loopRunning: false })
  if (!silent && !result.alreadyStopped) ElMessage.success('主动循环已停止')
  return true
}

export async function sampleCombatPixel(point) {
  return electronApi.combat.samplePixel({
    point: { x: Number(point?.x) || 0, y: Number(point?.y) || 0 }
  })
}

export async function executePortalAssist({ configurationGuideBypass = false } = {}) {
  if (!combatInputAllowed()) return false
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
