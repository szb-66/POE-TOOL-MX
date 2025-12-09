/**
 * Purpose: 全局快捷键管理模块，负责注册、注销和管理全局快捷键
 * Inputs: accelerator (string) - 快捷键组合，callback (function) - 回调函数
 * Outputs: 注册/注销结果（boolean）
 * Preconditions: Electron app 已初始化
 * Edge cases: 快捷键已注册时先注销再注册；注册失败时返回 false
 * Errors: 注册失败返回 false，不抛出异常
 */

import { globalShortcut } from 'electron'

// 注册的快捷键
const registeredShortcuts = new Map()

export function registerGlobalShortcut(accelerator, callback) {
  if (registeredShortcuts.has(accelerator)) {
    globalShortcut.unregister(accelerator)
  }
  
  const success = globalShortcut.register(accelerator, callback)
  if (success) {
    registeredShortcuts.set(accelerator, callback)
  }
  return success
}

export function unregisterGlobalShortcut(accelerator) {
  const success = globalShortcut.unregister(accelerator)
  if (success) {
    registeredShortcuts.delete(accelerator)
  }
  return success
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

