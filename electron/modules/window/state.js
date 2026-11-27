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

export const DEFAULT_MAIN_WINDOW_WIDTH = 1200
export const DEFAULT_MAIN_WINDOW_HEIGHT = 800
export const MIN_MAIN_WINDOW_WIDTH = 800
export const MIN_MAIN_WINDOW_HEIGHT = 600

export function normalizeMainWindowSize(state = {}) {
  const width = Number(state?.width)
  const height = Number(state?.height)
  return {
    width: Number.isFinite(width) && width >= MIN_MAIN_WINDOW_WIDTH ? Math.round(width) : DEFAULT_MAIN_WINDOW_WIDTH,
    height: Number.isFinite(height) && height >= MIN_MAIN_WINDOW_HEIGHT ? Math.round(height) : DEFAULT_MAIN_WINDOW_HEIGHT
  }
}

export function loadWindowState() {
  try {
    const windowStateFile = getWindowStateFile()
    if (fs.existsSync(windowStateFile)) {
      const state = JSON.parse(fs.readFileSync(windowStateFile, 'utf8'))
      // 校验数据结构并修复异常过小的历史窗口尺寸
      if (state && typeof state === 'object' && !Array.isArray(state)) {
        return {
          ...state,
          ...normalizeMainWindowSize(state)
        }
      }
    }
  } catch (error) {
    // 加载窗口状态失败
  }
  return {
    width: DEFAULT_MAIN_WINDOW_WIDTH,
    height: DEFAULT_MAIN_WINDOW_HEIGHT,
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

export function loadPriceCheckOverlaySize() {
  const state = loadWindowState()
  return state && typeof state === 'object' && !Array.isArray(state)
    ? state.priceCheckOverlaySize || null
    : null
}

export function savePriceCheckOverlaySize(size) {
  saveWindowState({
    priceCheckOverlaySize: {
      width: size?.width
    }
  })
}

