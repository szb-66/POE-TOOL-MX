import { ElMessage } from 'element-plus'
import { electronApi } from '@/api/electron'
import { useSettingsStore } from '@/domains/settings/settingsStore'
import { useCombatStore } from '@/stores/combat'
import {
  hasEnabledLoopItem,
  hasEnabledPotionResource,
  validateCombatAssist,
  validateLoopAssist,
  validatePotionAssist
} from './combatConfig.js'
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
  const settings = useSettingsStore()
  if (!removeStatusListener) removeStatusListener = electronApi.combat.onStatus(status => store.applyStatus(status))
  const [potionStatus, loopStatus] = await Promise.all([
    electronApi.combat.getPotionStatus(),
    electronApi.combat.getLoopStatus()
  ])
  const areaGate = potionStatus?.areaGate || loopStatus?.areaGate
  store.applyStatus({ ...potionStatus, event: potionStatus.running ? 'running' : 'stopped', areaGate })
  store.applyStatus({ ...loopStatus, origin: 'loop', event: loopStatus.running ? 'running' : 'stopped', areaGate })
  if (settings?.combatAssist?.autoPauseInSafeZone === false) {
    const synced = await electronApi.combat.updatePotionConfig?.(JSON.parse(JSON.stringify(settings.combatAssist)))
    if (synced?.areaGate) store.applyStatus({ event: 'area-gate', areaGate: synced.areaGate })
  }
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
  store.applyStatus({ running: true, processId: result.processId, event: 'starting', areaGate: result.areaGate })
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
  store.applyStatus({ running: true, origin: 'loop', processId: result.processId, event: 'starting', areaGate: result.areaGate })
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

export async function startCombatAssist({ configurationGuideBypass = false, silent = false } = {}) {
  if (!combatInputAllowed(silent)) return false
  const settings = useSettingsStore()
  const store = useCombatStore()
  if (!configurationGuideBypass) {
    const check = collectCombatConfiguration(CONFIGURATION_ACTIONS.start)
    if (!check.ok) {
      return runWithConfigurationGuide({
        moduleId: CONFIGURATION_MODULES.combat,
        actionId: CONFIGURATION_ACTIONS.start,
        title: '完成战斗辅助配置',
        actionLabel: '开始',
        collect: () => collectCombatConfiguration(CONFIGURATION_ACTIONS.start),
        execute: () => startCombatAssist({ configurationGuideBypass: true })
      })
    }
  }
  const validation = validateCombatAssist(settings.combatAssist)
  if (!validation.isValid) {
    if (!silent) ElMessage.warning(validation.errors[0])
    return false
  }

  const needPotion = hasEnabledPotionResource(settings.combatAssist)
  const needLoop = hasEnabledLoopItem(settings.combatAssist)
  const hadPotionRunning = Boolean(store.running)

  if (needPotion) {
    const startedPotion = await startPotionAssist({ configurationGuideBypass: true, silent: true })
    if (!startedPotion) {
      if (!silent) ElMessage.error(store.lastError || '启动战斗辅助失败')
      return false
    }
  } else if (store.running) {
    await stopPotionAssist({ persist: false, silent: true })
  }

  if (needLoop) {
    const startedLoop = await startLoopAssist({ configurationGuideBypass: true, silent: true })
    if (!startedLoop) {
      if (needPotion && !hadPotionRunning) {
        await stopPotionAssist({ persist: false, silent: true })
      }
      if (!silent) ElMessage.error(store.loopLastError || '启动战斗辅助失败')
      return false
    }
  } else if (store.loopRunning) {
    await stopLoopAssist({ persist: false, silent: true })
  }

  saveCombatRuntimeState({ potionRunning: needPotion, loopRunning: needLoop })
  if (!silent) ElMessage.success('战斗辅助已启动')
  return true
}

export async function stopCombatAssist({ persist = true, silent = false } = {}) {
  const store = useCombatStore()
  const wasRunning = Boolean(store.running || store.loopRunning)
  const [potionStopped, loopStopped] = await Promise.all([
    stopPotionAssist({ persist, silent: true }),
    stopLoopAssist({ persist, silent: true })
  ])
  if (!potionStopped || !loopStopped) {
    if (!silent) ElMessage.error('停止战斗辅助失败')
    return false
  }
  if (persist) saveCombatRuntimeState({ potionRunning: false, loopRunning: false })
  if (!silent && wasRunning) ElMessage.success('战斗辅助已停止')
  return true
}

export async function syncRunningCombatAssist({ silent = false } = {}) {
  const store = useCombatStore()
  if (!store.running && !store.loopRunning) return { ok: true, stopped: false }
  const settings = useSettingsStore()
  const config = settings.combatAssist
  const needPotion = hasEnabledPotionResource(config)
  const needLoop = hasEnabledLoopItem(config)

  if (!needPotion && !needLoop) {
    await stopCombatAssist({ persist: true, silent: true })
    if (!silent) ElMessage.info('所有战斗辅助子项已关闭，战斗辅助已自动停止')
    return { ok: true, stopped: true }
  }

  if (needPotion && !store.running) {
    const started = await startPotionAssist({ configurationGuideBypass: true, silent: true })
    if (!started) {
      if (!silent) ElMessage.error(store.lastError || '启动被动喝药失败')
      return { ok: false, stopped: false }
    }
  } else if (!needPotion && store.running) {
    await stopPotionAssist({ persist: true, silent: true })
  }

  if (needLoop && !store.loopRunning) {
    const started = await startLoopAssist({ configurationGuideBypass: true, silent: true })
    if (!started) {
      if (!silent) ElMessage.error(store.loopLastError || '启动主动循环失败')
      return { ok: false, stopped: false }
    }
  } else if (!needLoop && store.loopRunning) {
    await stopLoopAssist({ persist: true, silent: true })
  }

  saveCombatRuntimeState({
    potionRunning: Boolean(needPotion && store.running),
    loopRunning: Boolean(needLoop && store.loopRunning)
  })
  return { ok: true, stopped: false }
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
