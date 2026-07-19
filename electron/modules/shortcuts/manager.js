/**
 * Purpose: 全局快捷键管理模块，负责注册、注销和管理全局快捷键
 * Inputs: accelerator (string) - 快捷键组合，callback (function) - 回调函数
 * Outputs: 注册/注销结果（boolean）
 * Preconditions: Electron app 已初始化
 * Edge cases: 快捷键已注册时先注销再注册；注册失败时返回 false
 * Errors: 注册失败返回 false，不抛出异常
 */

import { globalShortcut } from 'electron'
import { toElectronAccelerator } from '../../../src/utils/electronAccelerator.js'

// 注册的快捷键
const registeredShortcuts = new Map()

export function registerGlobalShortcut(accelerator, callback) {
  const normalized = toElectronAccelerator(accelerator)
  if (registeredShortcuts.has(normalized)) {
    globalShortcut.unregister(normalized)
  }
  try {
    const success = globalShortcut.register(normalized, callback)
    if (success) registeredShortcuts.set(normalized, callback)
    return success
  } catch {
    return false
  }
}

export function unregisterGlobalShortcut(accelerator) {
  const normalized = toElectronAccelerator(accelerator)
  globalShortcut.unregister(normalized)
  registeredShortcuts.delete(normalized)
  return true
}

export function unregisterAll() {
  registeredShortcuts.forEach((callback, accelerator) => {
    globalShortcut.unregister(accelerator)
  })
  registeredShortcuts.clear()
}

export function getRegisteredShortcuts() {
  return new Map(registeredShortcuts)
}

