/**
 * Purpose: 全局快捷键管理模块，负责注册、注销和管理全局快捷键；
 *          支持“仅在游戏窗口前台时生效”的作用域门禁。
 * Inputs: accelerator (string) - 快捷键组合，callback (function) - 回调函数
 * Outputs: 注册/注销结果（boolean）、作用域状态
 * Preconditions: Electron app 已初始化
 * Edge cases: 快捷键已注册时先注销再注册；作用域应用时隔离失败组合；门禁开启且游戏未在前台时不注册
 * Errors: 注册失败返回 false，不抛出异常
 */

import { globalShortcut } from 'electron'
import { toElectronAccelerator } from '../../../src/utils/electronAccelerator.js'

// 当前已实际注册的快捷键：normalized accelerator -> callback
const registeredShortcuts = new Map()
// 用户配置的意图快捷键：normalized accelerator -> { key, callback }
const intendedShortcuts = new Map()

// 门禁开关（默认开启）与游戏窗口前台状态（默认未在前台，首个报告前不注册）
let scopeEnabled = true
let scopeActive = false
let scopeAvailable = true
let scopeReason = ''
let scopeWindowTitle = ''
let scopeProcessName = ''
// 最近一次实际注册尝试的结果。失焦只注销活动快捷键，不清除用户尚未看到的冲突结论。
let lastScopeFailures = []
let lastScopePartialFailure = false

function normalizeAccelerator(accelerator) {
  try {
    const normalized = toElectronAccelerator(accelerator)
    return normalized ? String(normalized) : ''
  } catch {
    return ''
  }
}

function shouldRegister() {
  return !scopeEnabled || !scopeAvailable || scopeActive
}

function tryRegister(accelerator, callback) {
  try {
    if (registeredShortcuts.has(accelerator)) {
      globalShortcut.unregister(accelerator)
    }
    const success = globalShortcut.register(accelerator, callback)
    if (success) {
      registeredShortcuts.set(accelerator, callback)
    } else {
      registeredShortcuts.delete(accelerator)
    }
    return success
  } catch {
    registeredShortcuts.delete(accelerator)
    return false
  }
}

function unregisterActive(accelerator) {
  globalShortcut.unregister(accelerator)
  registeredShortcuts.delete(accelerator)
}

function updateScopeRegistrationResult(failed = []) {
  lastScopeFailures = [...failed]
  lastScopePartialFailure = lastScopeFailures.length > 0 && registeredShortcuts.size > 0
}

function applyScope() {
  const failed = []
  if (!shouldRegister()) {
    registeredShortcuts.forEach((_callback, accelerator) => {
      globalShortcut.unregister(accelerator)
    })
    registeredShortcuts.clear()
    return failed
  }

  for (const [accelerator, entry] of intendedShortcuts) {
    if (registeredShortcuts.has(accelerator)) continue
    if (!tryRegister(accelerator, entry.callback)) {
      failed.push(accelerator)
    }
  }
  updateScopeRegistrationResult(failed)
  return failed
}

/**
 * 注册单个配置快捷键（如查价快捷键开关），受作用域门禁约束。
 */
export function registerConfiguredShortcut(accelerator, key, callback) {
  const normalized = normalizeAccelerator(accelerator)
  if (!normalized) return { success: false, error: '无效快捷键' }
  intendedShortcuts.set(normalized, {
    key: String(key || ''),
    callback: typeof callback === 'function' ? callback : () => {}
  })
  if (!shouldRegister()) {
    return { success: true, deferred: true, accelerator: normalized }
  }
  const success = tryRegister(normalized, intendedShortcuts.get(normalized).callback)
  if (!success) intendedShortcuts.delete(normalized)
  return { success, deferred: false, accelerator: normalized }
}

/**
 * 注销单个配置快捷键（如关闭查价模块），同时移除意图。
 */
export function unregisterConfiguredShortcut(accelerator) {
  const normalized = normalizeAccelerator(accelerator)
  if (!normalized) return { success: true }
  intendedShortcuts.delete(normalized)
  if (registeredShortcuts.has(normalized)) {
    unregisterActive(normalized)
  }
  return { success: true }
}

/**
 * 用一组配置快捷键替换全部意图（设置页保存、应用启动初始化）。
 * 设置页保存默认保持事务回滚；应用启动可选择保留部分成功注册和全部注册意图。
 */
export function setConfiguredShortcuts(entries = [], { rollbackOnFailure = true } = {}) {
  const previousIntended = new Map(intendedShortcuts)
  const previousRegistered = new Map(registeredShortcuts)
  const previousFailures = [...lastScopeFailures]
  const previousPartialFailure = lastScopePartialFailure

  registeredShortcuts.forEach((_callback, accelerator) => {
    globalShortcut.unregister(accelerator)
  })
  registeredShortcuts.clear()
  intendedShortcuts.clear()

  const candidates = []
  for (const entry of entries) {
    if (!entry || !entry.accelerator) continue
    const normalized = normalizeAccelerator(entry.accelerator)
    if (!normalized || intendedShortcuts.has(normalized)) continue
    const callback = typeof entry.callback === 'function' ? entry.callback : () => {}
    intendedShortcuts.set(normalized, { key: String(entry.key || ''), callback })
    candidates.push({ normalized, callback })
  }

  const failed = []
  const registrationAttempted = shouldRegister()
  if (registrationAttempted) {
    for (const { normalized, callback } of candidates) {
      if (!tryRegister(normalized, callback)) failed.push(normalized)
    }
  }

  const rolledBack = failed.length > 0 && rollbackOnFailure
  if (rolledBack) {
    registeredShortcuts.forEach((_callback, accelerator) => {
      globalShortcut.unregister(accelerator)
    })
    registeredShortcuts.clear()
    intendedShortcuts.clear()
    previousIntended.forEach((entry, accelerator) => {
      intendedShortcuts.set(accelerator, entry)
    })
    previousRegistered.forEach((callback, accelerator) => {
      tryRegister(accelerator, callback)
    })
    lastScopeFailures = previousFailures
    lastScopePartialFailure = previousPartialFailure
  } else if (registrationAttempted) {
    updateScopeRegistrationResult(failed)
  } else {
    // 配置已被替换，旧组合的冲突结论不再适用；进入游戏后会验证新组合。
    updateScopeRegistrationResult([])
  }

  return {
    success: failed.length === 0,
    failed,
    rolledBack,
    deferred: shouldRegister() ? [] : [...intendedShortcuts.keys()]
  }
}

/**
 * 切换门禁开关；关闭时立即注册全部意图，开启时按当前前台状态应用。
 */
export function setScopeEnabled(enabled) {
  scopeEnabled = Boolean(enabled)
  const failed = applyScope()
  return { success: failed.length === 0, failed }
}

/**
 * 更新游戏窗口前台状态；变为前台时注册全部意图，失焦时全部注销。
 */
export function setScopeActive(active, details = {}) {
  scopeActive = Boolean(active)
  if (details && typeof details === 'object') {
    if (typeof details.reason === 'string') scopeReason = details.reason
    if (typeof details.title === 'string') scopeWindowTitle = details.title
    if (typeof details.processName === 'string') scopeProcessName = details.processName
  }
  const failed = applyScope()
  return { success: failed.length === 0, failed }
}

/**
 * 更新前台监视器可用性；监视器最终失败时回退为无条件注册（保持旧行为）。
 */
export function setScopeAvailable(available) {
  scopeAvailable = Boolean(available)
  const failed = applyScope()
  return { success: failed.length === 0, failed }
}

export function getScopeState() {
  return {
    enabled: scopeEnabled,
    available: scopeAvailable,
    gameForeground: scopeActive,
    reason: scopeReason,
    windowTitle: scopeWindowTitle,
    processName: scopeProcessName,
    registered: [...registeredShortcuts.keys()],
    intended: [...intendedShortcuts.keys()],
    failed: [...lastScopeFailures],
    partialFailure: lastScopePartialFailure
  }
}

export function registerGlobalShortcut(accelerator, callback) {
  const normalized = normalizeAccelerator(accelerator)
  if (!normalized) return false
  return tryRegister(normalized, callback)
}

export function unregisterGlobalShortcut(accelerator) {
  const normalized = normalizeAccelerator(accelerator)
  if (!normalized) return true
  unregisterActive(normalized)
  return true
}

export function unregisterAll() {
  registeredShortcuts.forEach((_callback, accelerator) => {
    globalShortcut.unregister(accelerator)
  })
  registeredShortcuts.clear()
  intendedShortcuts.clear()
  updateScopeRegistrationResult([])
}

export function getRegisteredShortcuts() {
  return new Map(registeredShortcuts)
}

export function getIntendedShortcuts() {
  return new Map(intendedShortcuts)
}
