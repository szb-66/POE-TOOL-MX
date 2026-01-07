/**
 * Purpose: 背包模块 IPC 处理器，负责模板匹配检测和自动入库功能
 * Inputs: python (object) - Python 管理模块，window (object) - 窗口管理模块，fileWatcher (object) - 文件监听模块
 * Outputs: 注册 IPC 处理器，无返回值
 * Preconditions: Python 环境已配置，窗口已创建
 * Edge cases: 模板图片不存在时返回错误；检测线程已运行时返回警告
 * Errors: 模板匹配失败时返回错误；入库操作失败时返回错误
 */

import { ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import { app } from 'electron'

let detectionProcess = null // 模板匹配检测进程
let stashProcess = null     // 自动入库进程

export function registerBagHandlers(python, window, fileWatcher) {
  const { detectPythonPath } = python
  const { getMainWindow, getBagOverlayWindow, showBagOverlayWindow, hideBagOverlayWindow, closeBagOverlayWindow, getAppDataPath } = window
  const { getFilePaths } = fileWatcher

  // IPC: 启动背包检测
  ipcMain.handle('start-bag-detection', async (event, config) => {
    try {
      console.log('[背包检测] 收到启动请求, config =', JSON.stringify(config))
      // 检查是否已有检测进程在运行
      if (detectionProcess) {
        return { success: false, error: '检测进程已在运行中' }
      }

      // 验证配置
      if (!config.templates.stashTitle || !config.templates.inventoryTitle) {
        console.log('[背包检测] 校验失败: 模板未配置')
        return { success: false, error: '请先配置模板图片' }
      }

      // 创建背包覆盖层窗口显示一键入库按钮
      const bagOverlayWindow = getBagOverlayWindow()

      // 准备 Python 脚本参数
      const pythonPath = detectPythonPath()
      if (!pythonPath) {
        return { success: false, error: '未找到Python可执行文件' }
      }

      const scriptPath = path.join(getFilePaths().tempDir, 'bag_detection.py')

      // 生成检测脚本（这里暂时使用简单的实现，后续会创建完整的模板）
      const scriptContent = generateDetectionScript(config)
      fs.writeFileSync(scriptPath, scriptContent, 'utf8')
      console.log('[背包检测] 脚本已生成:', scriptPath)

      // 启动检测进程
      detectionProcess = spawn(pythonPath, [scriptPath], {
        shell: true,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8'
        }
      })
      detectionProcess.stdout.setEncoding('utf8')
      detectionProcess.stderr.setEncoding('utf8')

      // 监听进程错误
      detectionProcess.on('error', (error) => {
        console.error('[背包检测] 进程启动错误:', error)
        detectionProcess = null
      })

      // 监听进程退出
      detectionProcess.on('close', (code) => {
        console.log('[背包检测] 进程退出，代码:', code)
        detectionProcess = null
      })

      // 监听标准错误输出
      detectionProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString('utf8')
        console.error('[背包检测] 错误输出:', errorOutput)
      })

      // 监听检测结果
      detectionProcess.stdout.on('data', (data) => {
        const output = data.toString('utf8')
        console.log('[背包检测] 输出:', output)

        // 解析检测结果
        if (output.includes('MATCH_SUCCESS')) {
          // 模板匹配成功，通知前端显示按钮
          const mainWindow = getMainWindow()
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('bag-detection-match', { matched: true })
          }

          // 显示背包覆盖层窗口
          showBagOverlayWindow(config.buttonPosition || { x: 3600, y: 1000 })
        } else if (output.includes('MATCH_FAILED')) {
          // 模板匹配失败，通知前端隐藏按钮
          const mainWindow = getMainWindow()
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('bag-detection-match', { matched: false })
          }
        }
      })

      return { success: true, processId: detectionProcess.pid }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // IPC: 停止背包检测
  ipcMain.handle('stop-bag-detection', async () => {
    try {
      if (detectionProcess) {
        // 强制终止检测进程
        detectionProcess.kill('SIGTERM')

        // 等待一段时间后强制终止
        setTimeout(() => {
          if (detectionProcess) {
            detectionProcess.kill('SIGKILL')
          }
        }, 2000)

        detectionProcess = null
      }

      // 停止入库进程（如果正在运行）
      if (stashProcess) {
        stashProcess.kill('SIGTERM')
        setTimeout(() => {
          if (stashProcess) {
            stashProcess.kill('SIGKILL')
          }
        }, 2000)
        stashProcess = null
      }

      // 隐藏背包覆盖层窗口
      hideBagOverlayWindow()

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // IPC: 启动自动入库
  ipcMain.handle('start-bag-stash', async (event, config) => {
    try {
      // 检查是否已有入库进程在运行
      if (stashProcess) {
        return { success: false, error: '入库进程已在运行中' }
      }

      const pythonPath = detectPythonPath()
      if (!pythonPath) {
        return { success: false, error: '未找到Python可执行文件' }
      }

      const scriptPath = path.join(getFilePaths().tempDir, 'bag_stash.py')

      // 生成入库脚本
      const scriptContent = generateStashScript(config)
      fs.writeFileSync(scriptPath, scriptContent, 'utf8')

      // 启动入库进程
      stashProcess = spawn(pythonPath, [scriptPath], {
        shell: true,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8'
        }
      })

      // 监听入库进度
      stashProcess.stdout.on('data', (data) => {
        const output = data.toString('utf8')
        console.log('[自动入库]', output)

        // 解析进度信息
        const progressMatch = output.match(/PROGRESS:(\d+)/)
        if (progressMatch) {
          const progress = parseInt(progressMatch[1])
          const mainWindow = getMainWindow()
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('bag-stash-progress', { progress })
          }
        }

        // 入库完成
        if (output.includes('STASH_COMPLETED')) {
          const mainWindow = getMainWindow()
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('bag-stash-completed')
          }
        }
      })

      stashProcess.stderr.on('data', (data) => {
        console.error('[自动入库错误]', data.toString('utf8'))
      })

      stashProcess.on('close', (code) => {
        console.log(`[自动入库进程退出] 代码: ${code}`)
        stashProcess = null

        // 通知前端入库已停止
        const mainWindow = getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('bag-stash-stopped', { code })
        }
      })

      return { success: true, processId: stashProcess.pid }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // IPC: 停止自动入库
  ipcMain.handle('stop-bag-stash', async () => {
    try {
      if (stashProcess) {
        stashProcess.kill('SIGTERM')
        setTimeout(() => {
          if (stashProcess) {
            stashProcess.kill('SIGKILL')
          }
        }, 2000)
        stashProcess = null
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // IPC: 上传模板图片
  ipcMain.handle('upload-bag-template', async (event, sourcePath, type) => {
    try {
      // 确保模板目录存在
      const userDataPath = app.getPath('userData')
      const templateDir = path.join(userDataPath, 'templates')
      if (!fs.existsSync(templateDir)) {
        fs.mkdirSync(templateDir, { recursive: true })
      }

      // 生成目标文件名
      const ext = path.extname(sourcePath)
      const fileName = type === 'stashTitle' ? `stash_title${ext}` : `inventory_title${ext}`
      const targetPath = path.join(templateDir, fileName)

      // 复制文件
      fs.copyFileSync(sourcePath, targetPath)

      return { success: true, path: targetPath }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
}

// 生成模板匹配检测脚本
function generateDetectionScript(config) {
  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 背包模板匹配检测脚本

import sys
import time
import threading
import signal
import os
import traceback

# 导入依赖
try:
    import cv2
    import mss
    import numpy as np
except ImportError as e:
    print(f"[错误] 缺少依赖包: {e}")
    sys.exit(1)

# 全局变量
is_running = True
templates = {}
match_region = ${JSON.stringify(config.matchRegion || { x: 0, y: 0, width: 1920, height: 1080 })}
match_threshold = ${config.matchThreshold || 0.8}

def signal_handler(signum, frame):
    global is_running
    print("[停止] 收到停止信号")
    is_running = False

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def load_templates():
    """加载模板图片"""
    global templates

    stash_path = r"${config.templates.stashTitle}"
    inventory_path = r"${config.templates.inventoryTitle}"

    try:
        if os.path.exists(stash_path):
            templates['stash'] = cv2.imread(stash_path, cv2.IMREAD_COLOR)
            print(f"[模板] 仓库标题模板已加载: {stash_path}")
            try:
                print(f"[模板] 仓库模板尺寸: {templates['stash'].shape}")
            except Exception:
                pass
        else:
            print(f"[错误] 仓库标题模板不存在: {stash_path}")

        if os.path.exists(inventory_path):
            templates['inventory'] = cv2.imread(inventory_path, cv2.IMREAD_COLOR)
            print(f"[模板] 背包道具标题模板已加载: {inventory_path}")
            try:
                print(f"[模板] 背包模板尺寸: {templates['inventory'].shape}")
            except Exception:
                pass
        else:
            print(f"[错误] 背包道具标题模板不存在: {inventory_path}")

    except Exception as e:
        print(f"[错误] 加载模板失败: {e}")
        print(traceback.format_exc())

def capture_screen():
    """截取指定区域的屏幕"""
    try:
        with mss.mss() as sct:
            monitor = {
                "top": match_region['y'],
                "left": match_region['x'],
                "width": match_region['width'],
                "height": match_region['height']
            }
            screenshot = sct.grab(monitor)
            # 转换为OpenCV格式
            img = np.array(screenshot)
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
            return img
    except Exception as e:
        print(f"[错误] 截图失败: {e}")
        print(traceback.format_exc())
        return None

def match_template(image, template):
    """模板匹配"""
    try:
        result = cv2.matchTemplate(image, template, cv2.TM_CCOEFF_NORMED)
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)

        matched = max_val >= match_threshold
        return bool(matched), max_loc, float(max_val)
    except Exception as e:
        print(f"[错误] 模板匹配失败: {e}")
        print(traceback.format_exc())
        return False, None, 0

def detection_loop():
    """检测循环"""
    print("[开始] 模板匹配检测")
    print(f"[配置] 匹配区域: {match_region}, 阈值: {match_threshold}")

    load_templates()

    # 模板存在性与有效性检查，避免 numpy 数组参与布尔运算
    stash_tpl = templates.get('stash')
    inv_tpl = templates.get('inventory')
    def is_valid_tpl(tpl):
        try:
            return tpl is not None and hasattr(tpl, 'size') and tpl.size > 0
        except Exception:
            return False

    if not is_valid_tpl(stash_tpl) or not is_valid_tpl(inv_tpl):
        print("[错误] 模板加载失败，无法开始检测")
        return

    last_match_result = False
    # 设为 None，确保首轮输出一次匹配结果
    last_match_result = None
    print("[调试] 模板校验通过，进入循环")
    loop_count = 0

    while is_running:
        try:
            # 截图
            screen = capture_screen()
            if screen is None:
                time.sleep(0.5)
                continue

            # 调试输出截图尺寸
            try:
                print(f"[调试] 截图尺寸: {screen.shape}")
            except Exception:
                pass

            # 匹配两个模板
            stash_matched, _, stash_score = match_template(screen, templates['stash'])
            inventory_matched, _, inv_score = match_template(screen, templates['inventory'])

            # 防御性转换，避免 numpy.bool_ 或数组引发布尔歧义
            if isinstance(stash_matched, np.ndarray):
                stash_matched = bool(np.any(stash_matched))
            else:
                stash_matched = bool(stash_matched)

            if isinstance(inventory_matched, np.ndarray):
                inventory_matched = bool(np.any(inventory_matched))
            else:
                inventory_matched = bool(inventory_matched)

            # 两个模板都匹配成功
            current_match_result = stash_matched and inventory_matched

            # 定期输出匹配分数（每 5 次循环一次），便于诊断
            loop_count += 1
            if loop_count % 5 == 1:
                try:
                    print(f"[调试] 匹配分数 stash={stash_score:.3f}, inv={inv_score:.3f}")
                except Exception:
                    pass

            # 状态发生变化时才输出
            if current_match_result != last_match_result:
                if current_match_result:
                    print("MATCH_SUCCESS")
                else:
                    print("MATCH_FAILED")
                last_match_result = current_match_result

            time.sleep(0.2)  # 检测间隔

        except Exception as e:
            print(f"[错误] 检测循环异常: {e}")
            print(traceback.format_exc())
            time.sleep(1)

    print("[结束] 模板匹配检测")

if __name__ == "__main__":
    try:
        detection_loop()
    except KeyboardInterrupt:
        print("[停止] 用户中断")
    except Exception as e:
        print(f"[错误] 脚本异常: {e}")
        print(traceback.format_exc())
    finally:
        is_running = False
`
}

// 生成自动入库脚本
function generateStashScript(config) {
  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 自动入库脚本

import sys
import time
import threading
import signal

# 导入依赖
try:
    from pynput import mouse, keyboard
    from pynput.keyboard import Key
except ImportError as e:
    print(f"[错误] 缺少依赖包: {e}")
    sys.exit(1)

# 全局变量
is_running = True
stash_config = ${JSON.stringify(config.stashConfig || {
  startPos: { x: 2658, y: 1199 },
  slotSize: { w: 100, h: 100 }
})}

def signal_handler(signum, frame):
    global is_running
    print("[停止] 收到停止信号")
    is_running = False

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

class StashController:
    def __init__(self):
        self.mouse_controller = mouse.Controller()
        self.keyboard_controller = keyboard.Controller()

    def move_mouse(self, x, y):
        """移动鼠标到指定位置"""
        try:
            self.mouse_controller.position = (x, y)
            time.sleep(0.05)  # 鼠标移动延迟
            return True
        except Exception as e:
            print(f"[错误] 鼠标移动失败: {e}")
            return False

    def click_mouse(self, button=mouse.Button.left):
        """点击鼠标"""
        try:
            self.mouse_controller.press(button)
            time.sleep(0.02)  # 点击延迟
            self.mouse_controller.release(button)
            time.sleep(0.02)
            return True
        except Exception as e:
            print(f"[错误] 鼠标点击失败: {e}")
            return False

    def press_key(self, key):
        """按下按键"""
        try:
            self.keyboard_controller.press(key)
            time.sleep(0.02)
            return True
        except Exception as e:
            print(f"[错误] 按键按下失败: {e}")
            return False

    def release_key(self, key):
        """释放按键"""
        try:
            self.keyboard_controller.release(key)
            time.sleep(0.02)
            return True
        except Exception as e:
            print(f"[错误] 按键释放失败: {e}")
            return False

    def ctrl_click(self, x, y):
        """执行 Ctrl+左键 点击"""
        try:
            # 移动到位置
            if not self.move_mouse(x, y):
                return False

            # 按住 Ctrl
            if not self.press_key(Key.ctrl):
                return False

            time.sleep(0.02)

            # 左键点击
            if not self.click_mouse(mouse.Button.left):
                self.release_key(Key.ctrl)  # 确保释放按键
                return False

            time.sleep(0.02)

            # 松开 Ctrl
            if not self.release_key(Key.ctrl):
                return False

            return True
        except Exception as e:
            print(f"[错误] Ctrl+左键操作失败: {e}")
            # 确保释放按键
            try:
                self.release_key(Key.ctrl)
            except:
                pass
            return False

def stash_items():
    """执行自动入库"""
    print("[开始] 自动入库流程")

    controller = StashController()

    # 仓库配置：12列 x 5行 = 60格
    cols = 12
    rows = 5
    total_slots = cols * rows

    start_x = stash_config['startPos']['x']
    start_y = stash_config['startPos']['y']
    slot_width = stash_config['slotSize']['w']
    slot_height = stash_config['slotSize']['h']

    completed_count = 0

    for row in range(rows):
        for col in range(cols):
            if not is_running:
                print("[停止] 入库被用户中断")
                return

            # 计算格子中心坐标
            x = start_x + col * slot_width + slot_width // 2
            y = start_y + row * slot_height + slot_height // 2

            slot_index = row * cols + col + 1

            print(f"[入库] 处理第 {slot_index}/{total_slots} 格: ({x}, {y})")

            # 执行 Ctrl+左键
            if not controller.ctrl_click(x, y):
                print(f"[错误] 第 {slot_index} 格入库失败")
                continue

            completed_count += 1

            # 发送进度
            progress = int((completed_count / total_slots) * 100)
            print(f"PROGRESS:{progress}")

            # 短暂延迟，避免操作过快
            time.sleep(0.05)

    print("STASH_COMPLETED")
    print("[完成] 自动入库流程结束")

if __name__ == "__main__":
    try:
        stash_items()
    except KeyboardInterrupt:
        print("[停止] 用户中断入库")
    except Exception as e:
        print(f"[错误] 入库脚本异常: {e}")
    finally:
        is_running = False
`
}