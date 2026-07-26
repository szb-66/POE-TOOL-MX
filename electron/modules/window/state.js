/**
 * Purpose: 窗口状态管理模块，负责保存和恢复窗口位置、大小等状态
 * Inputs: state (object) - 窗口状态对象
 * Outputs: 窗口状态对象
 * Preconditions: userData 目录可写
 * Edge cases: 文件不存在时返回默认值；数据无效时返回默认值
 * Errors: 文件操作失败时返回默认值，不抛出异常
 */

import { app } from 'electron'
import fs from 'fs'
import path from 'path'

const getWindowStateFile = () => path.join(app.getPath('userData'), 'window-state.json')

export function loadWindowState() {
  try {
    const windowStateFile = getWindowStateFile()
    if (fs.existsSync(windowStateFile)) {
      const state = JSON.parse(fs.readFileSync(windowStateFile, 'utf8'))
      // 简单的校验，防止无效数据
      if (typeof state === 'object') {
        return state
      }
    }
  } catch (error) {
    // 加载窗口状态失败
  }
  return {
    width: 1200,
    height: 800,
    isMaximized: false,
    isFullScreen: false,
    alwaysOnTop: false
  }
}

export function saveWindowState(state) {
  try {
    const windowStateFile = getWindowStateFile()
    const currentState = loadWindowState()
    const newState = { ...currentState, ...state }
    fs.writeFileSync(windowStateFile, JSON.stringify(newState), 'utf8')
  } catch (error) {
    // 保存窗口状态失败
  }
}

