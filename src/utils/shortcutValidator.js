/**
 * Purpose: 快捷键验证工具，检查快捷键是否重复或冲突
 * Inputs: shortcuts (object) - 快捷键对象
 * Outputs: { isValid: boolean, error: string } - 验证结果
 * Preconditions: shortcuts 为功能名到 Electron accelerator 的映射
 * Edge cases: 空快捷键视为有效；重复时返回错误
 * Errors: 验证失败返回错误信息，不抛出异常
*/

import { toElectronAccelerator } from './electronAccelerator.js'

/**
 * Purpose: 验证快捷键是否重复
 * Inputs: shortcuts (object) - 快捷键对象
 * Outputs: { isValid: boolean, error: string } - 验证结果
 */
export function validateShortcuts(shortcuts) {
  const shortcutValues = Object.values(shortcuts).filter(value => typeof value === 'string' && value.trim())
  const normalizedValues = shortcutValues.map(value => toElectronAccelerator(value).toLowerCase())

  const acceleratorPattern = /^(?:(?:ctrl|control|alt|shift|commandorcontrol|cmdorctrl|meta)\+)*(?:[a-z0-9]|f(?:[1-9]|1[0-9]|2[0-4])|num(?:pad)?[0-9]|space|enter|return|esc|escape|tab|up|down|left|right|pageup|pagedown|home|end|insert)$/i
  const invalid = shortcutValues.find(value => !acceleratorPattern.test(value.trim()))
  if (invalid) {
    return {
      isValid: false,
      error: `快捷键格式无效：${invalid}`
    }
  }

  const reservedIndex = normalizedValues.findIndex(value => value === 'f12' || value === 'ctrl+shift+i' || value === 'control+shift+i' || value === 'commandorcontrol+shift+i')
  if (reservedIndex !== -1) {
    return {
      isValid: false,
      error: `快捷键 ${shortcutValues[reservedIndex]} 为应用保留快捷键`
    }
  }

  const uniqueShortcuts = new Set(normalizedValues)

  if (normalizedValues.length !== uniqueShortcuts.size) {
    return {
      isValid: false,
      error: '不同功能的快捷键不能重复，请修改'
    }
  }

  return { isValid: true }
}

/**
 * 检查快捷键是否与其他快捷键冲突
 * @param {string} shortcut - 要检查的快捷键
 * @param {Object} allShortcuts - 所有快捷键对象
 * @param {string} excludeKey - 排除的键（当前正在编辑的键）
 * @returns {boolean} - 是否冲突
 */
export function isShortcutConflict(shortcut, allShortcuts, excludeKey) {
  if (!shortcut || !shortcut.trim()) {
    return false
  }

  for (const [key, value] of Object.entries(allShortcuts)) {
    if (key !== excludeKey && typeof value === 'string' && toElectronAccelerator(value).toLowerCase() === toElectronAccelerator(shortcut).toLowerCase()) {
      return true
    }
  }

  return false
}
