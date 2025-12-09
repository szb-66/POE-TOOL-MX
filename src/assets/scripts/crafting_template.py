#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Purpose: 自动合成/制作流程脚本，驱动鼠标键盘按配置执行，输出中间日志。
# Inputs: 前端模板填充的坐标/延迟/策略配置，游戏窗口坐标；pynput、winsound 等依赖。
# Outputs: 控制鼠标键盘完成制作步骤，写入结果文件（如有），打印日志；可播放提示音。
# Preconditions: 前端已生成配置并传入模板；游戏窗口在预期位置；依赖已安装且具备权限。
# Edge cases: Windows API 不可用时回退到 pynput；依赖缺失会提前退出；部分 I/O/操作失败当前策略仅告警。
# 生成时间: {{GEN_DATE}}

# 立即输出启动信息（在任何导入之前）
print("=" * 60)
print("[启动] Python脚本开始执行")
print("=" * 60)

import sys
import io

# 设置标准输出为UTF-8编码，避免Windows GBK编码问题
# 强制所有平台使用UTF-8，确保一致性
try:
    if sys.version_info >= (3, 7):
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    elif sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
except Exception as e:
    # 如果设置失败，打印警告但不中断执行
    print(f"[警告] 设置UTF-8编码失败: {e}")

# 立即刷新输出
sys.stdout.flush()
sys.stderr.flush()

print("[启动] 正在导入依赖包...")

# 尝试导入必要的包
try:
    import time
    import json
    import os
    import signal
    print("[启动] 基础模块导入成功")
except ImportError as e:
    print(f"[错误] 基础模块导入失败: {e}")
    sys.exit(1)

try:
    from pynput import mouse, keyboard
    from pynput.mouse import Button
    from pynput.keyboard import Key
    print("[启动] pynput模块导入成功")
except ImportError as e:
    print(f"[错误] pynput模块导入失败: {e}")
    print("[提示] 请运行: pip install pynput")
    sys.exit(1)

try:
    import pyperclip
    print("[启动] pyperclip模块导入成功")
except ImportError as e:
    print(f"[错误] pyperclip模块导入失败: {e}")
    print("[提示] 请运行: pip install pyperclip")
    sys.exit(1)

# 导入winsound模块用于播放提示音（仅限Windows）
try:
    if sys.platform == 'win32':
        import winsound
        print("[启动] winsound模块导入成功")
except ImportError:
    print("[警告] 无法导入winsound模块，提示音功能将不可用")

print("[启动] 所有依赖包导入成功")
sys.stdout.flush()

# 全局变量
is_running = False

# 播放提示音函数
def play_success_sound():
    """播放制作完成提示音"""
    try:
        if sys.platform == 'win32' and 'winsound' in sys.modules:
            # 播放系统默认提示音
            winsound.MessageBeep(winsound.MB_OK)
            # 或者播放指定频率的声音（如果系统声音不可用）
            # winsound.Beep(1000, 200) # 1000Hz, 200ms
            print("[提示] 播放完成提示音")
    except Exception as e:
        print(f"[警告] 播放提示音失败: {e}")

# Windows API鼠标控制（用于解决DPI缩放问题）
use_windows_api = False
try:
    if sys.platform == 'win32':
        import ctypes
        from ctypes import wintypes
        
        # Windows API函数
        user32 = ctypes.windll.user32
        SetCursorPos = user32.SetCursorPos
        SetCursorPos.argtypes = [ctypes.c_int, ctypes.c_int]
        SetCursorPos.restype = wintypes.BOOL
        
        GetCursorPos = user32.GetCursorPos
        # 使用wintypes.POINT避免与pynput内部的POINT类冲突
        # 如果wintypes没有POINT，则创建自定义结构
        try:
            WinCursorPoint = wintypes.POINT
        except AttributeError:
            class WinCursorPoint(ctypes.Structure):
                _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]
        GetCursorPos.argtypes = [ctypes.POINTER(WinCursorPoint)]
        GetCursorPos.restype = wintypes.BOOL
        
        # 检测DPI缩放
        try:
            # 尝试设置进程DPI感知，这通常能解决坐标偏移问题
            try:
                shcore = ctypes.windll.shcore
                # PROCESS_PER_MONITOR_DPI_AWARE = 2
                shcore.SetProcessDpiAwareness(2)
                print("[DPI] 已设置 ProcessDpiAwareness = 2 (Per Monitor DPI Aware)")
            except Exception:
                try:
                    # 回退到旧版API
                    user32.SetProcessDPIAware()
                    print("[DPI] 已设置 SetProcessDPIAware (System DPI Aware)")
                except Exception:
                    print("[DPI] 无法设置进程DPI感知")

            # 获取DPI缩放比例 (仅作参考，或用于pynput修正)
            try:
                shcore = ctypes.windll.shcore
                GetDpiForSystem = shcore.GetDpiForSystem
                GetDpiForSystem.restype = ctypes.c_uint
                dpi = GetDpiForSystem()
                dpi_scale_factor = dpi / 96.0
                print(f"[DPI] 系统DPI: {dpi} (缩放: {dpi_scale_factor * 100:.0f}%)")
            except Exception:
                dpi_scale_factor = 1.0
                print("[DPI] 无法检测系统DPI，假设为100%")
            
            use_windows_api = True
            print("[Windows API] 已启用Windows API鼠标控制")
        except Exception as e:
            print(f"[警告] 无法初始化Windows API: {e}")
            print("[Windows API] 将使用pynput进行鼠标控制")
            use_windows_api = False
    else:
        print("[Windows API] 非Windows系统，使用pynput进行鼠标控制")
except Exception as e:
    print(f"[警告] Windows API初始化失败: {e}")
    print("[Windows API] 将使用pynput进行鼠标控制")
    use_windows_api = False

# 信号处理函数，用于优雅退出
def signal_handler(signum, frame):
    global is_running
    print("\n[停止] 收到终止信号，正在停止脚本...")
    is_running = False
    sys.exit(0)

# 注册信号处理器（Windows 上可能不支持，但尝试注册）
try:
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
except:
    # Windows 上可能不支持某些信号
    pass

item_info_file = r"{{ITEM_INFO_FILE}}"
item_info_result_file = r"{{ITEM_INFO_RESULT_FILE}}"

# 延迟配置（毫秒转秒） - 极速模式
mouse_move_delay = {{DELAY_MOUSE_MOVE}}
mouse_click_delay = {{DELAY_MOUSE_CLICK}}
key_press_delay = {{DELAY_KEY_PRESS}}
clipboard_read_delay = {{DELAY_CLIPBOARD}}
currency_right_click_delay = 0.04
item_left_click_delay = 0.04

# 通货坐标（确保坐标值为整数）
currency_positions = {{CURRENCY_POSITIONS}}

# 物品位置坐标（确保坐标值为整数）
item_position = {{ITEM_POSITION}}

# 创建鼠标和键盘控制器
mouse_controller = mouse.Controller()
keyboard_controller = keyboard.Controller()

# 主函数
def start_crafting():
    # 开始制作
    global is_running
    is_running = True
    
    # 注册停止快捷键监听
    try:
        # 停止快捷键回调
        def on_stop_hotkey():
            global is_running
            print("\n[快捷键] 监测到停止快捷键 ({{STOP_SHORTCUT}})")
            is_running = False
            # 强制释放所有键
            release_all_keys()
            
        # 启动监听 (后台线程)
        hotkey_listener = keyboard.GlobalHotKeys({
            '{{PYNPUT_STOP_SHORTCUT}}': on_stop_hotkey
        })
        hotkey_listener.start()
        print(f"[启动] 停止快捷键监听已启动: {{STOP_SHORTCUT}}")
    except Exception as e:
        print(f"[警告] 无法注册停止快捷键监听: {e}")

    # 立即输出启动信息，验证输出管道
    print("=" * 50)
    print("[启动] Python脚本已启动")
    # 简化启动信息
    # print(f"[启动] Python版本: {sys.version}")
    print(f"[启动] 当前时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    print("[开始] 制作流程")
    
    # 检查物品位置是否配置
    if item_position['x'] == 0 and item_position['y'] == 0:
        print("[错误] 物品位置未配置，请先在设置中配置物品位置坐标")
        is_running = False
        return
    
    # 验证坐标是否合理（应该在屏幕范围内）
    try:
        # 尝试获取当前鼠标位置来估算屏幕大小
        if use_windows_api:
            try:
                current_pos = get_cursor_pos_windows_api()
                if current_pos:
                    screen_width = current_pos[0] * 2  # 粗略估算
                    screen_height = current_pos[1] * 2
                else:
                    # 如果Windows API失败，尝试使用pynput
                    current_pos = mouse_controller.position
                    screen_width = current_pos[0] * 2
                    screen_height = current_pos[1] * 2
            except Exception:
                # 如果都失败，跳过屏幕大小检查
                current_pos = None
        else:
            current_pos = mouse_controller.position
            screen_width = current_pos[0] * 2  # 粗略估算
            screen_height = current_pos[1] * 2
    except Exception as e:
        print(f"[警告] 无法获取屏幕信息: {e}")
        current_pos = None
    
    if item_position['x'] > 5000 or item_position['y'] > 5000:
        print(f"[警告] 物品位置坐标异常: ({item_position['x']}, {item_position['y']})")
        print("[提示] 请检查坐标配置是否正确")
    
    # 检查是否有启用的模块
    affix_enabled = {{ENABLE_AFFIX}}
    socket_enabled = {{ENABLE_SOCKET}}
    
    print(f"[配置] 词缀匹配模块: {'启用' if affix_enabled else '禁用'}")
    print(f"[配置] 插槽制作模块: {'启用' if socket_enabled else '禁用'}")
    
    if not affix_enabled and not socket_enabled:
        print("[错误] 请至少启用一个制作模块")
        time.sleep(3)
        is_running = False
        return
    
    success = True
    
    # 词缀匹配
    if affix_enabled:
        success = craft_affixes()
        if not success:
            is_running = False
            return
    
    # 插槽制作（顺序执行）
    if socket_enabled:
        success = craft_sockets()
        if not success:
            is_running = False
            return
    
    print("[完成] 所有制作流程完成！")
    play_success_sound()
    time.sleep(2)
    is_running = False

{{AFFIX_CRAFTING_FUNC}}

{{SOCKET_CRAFTING_FUNC}}

# 辅助函数
def get_cursor_pos_windows_api():
    # 使用Windows API获取鼠标位置
    global use_windows_api
    try:
        if not use_windows_api:
            return None
        # 检查必要变量是否定义
        if 'WinCursorPoint' not in globals() or 'GetCursorPos' not in globals():
            return None
        
        point = WinCursorPoint()
        result = GetCursorPos(ctypes.byref(point))
        
        if result:
            return (point.x, point.y)
        
        return None
    except Exception as e:
        # 如果Windows API失败，禁用Windows API并回退到pynput
        print(f"[警告] Windows API获取鼠标位置失败: {e}")
        print("[Windows API] 将禁用Windows API，回退到pynput")
        use_windows_api = False
        return None

def set_cursor_pos_windows_api(x, y):
    # 使用Windows API设置鼠标位置
    global use_windows_api
    try:
        if not use_windows_api:
            return False
        # 检查必要变量是否定义
        if 'SetCursorPos' not in globals():
            return False
            
        result = SetCursorPos(int(x), int(y))
        return bool(result)
    except Exception as e:
        # 如果Windows API失败，禁用Windows API并回退到pynput
        print(f"[警告] Windows API设置鼠标位置失败: {e}")
        print("[Windows API] 将禁用Windows API，回退到pynput")
        use_windows_api = False
        return False

# 当前持有的通货类型
current_currency_type = None
# Shift键状态
is_shift_held = False

def release_all_keys():
    # 释放所有可能的修饰键
    try:
        keyboard_controller.release(Key.shift)
        keyboard_controller.release(Key.ctrl)
        keyboard_controller.release(Key.alt)
        keyboard_controller.release(Key.shift_l)
        keyboard_controller.release(Key.shift_r)
        keyboard_controller.release(Key.ctrl_l)
        keyboard_controller.release(Key.ctrl_r)
        keyboard_controller.release(Key.alt_l)
        keyboard_controller.release(Key.alt_r)
    except:
        pass

def release_shift_if_held():
    # 如果Shift被按下，则释放
    global is_shift_held
    release_all_keys()
    is_shift_held = False
    time.sleep(0.05)

def apply_currency(currency_type):
    # 应用通货到物品上（每次重新获取通货，不使用Shift）
    
    try:
        # 验证物品位置
        if item_position['x'] == 0 and item_position['y'] == 0:
            print("[错误] 物品位置未配置")
            return False
            
        # 0. 确保Shift松开 (防止之前残留)
        release_shift_if_held()
        
        # 1. 移动到通货位置并右键点击 (Pick)
        # print(f"[操作] 获取通货: {currency_type}")
        if not right_click_currency(currency_type):
            return False
            
        # 2. 移动到物品位置
        target_x = int(item_position['x'])
        target_y = int(item_position['y'])
        
        # 移动鼠标
        if not move_mouse(target_x, target_y):
            return False
        
        # 3. 左键点击应用 (Apply)
        # 不需要按下Shift
        click_mouse("left")
            
        # 点击后的延迟
        time.sleep(item_left_click_delay)
        return True
        
    except Exception as e:
        print(f"[错误] 应用通货失败: {e}")
        import traceback
        traceback.print_exc()
        release_shift_if_held() # 发生错误时释放
        return False

def move_mouse(x, y):
    # 移动鼠标
    try:
        # 验证坐标类型和有效性
        # print(f"[调试] move_mouse 接收到的参数: x={x} (类型: {type(x)}), y={y} (类型: {type(y)})")
        
        # 确保坐标是整数
        x = int(x)
        y = int(y)
        # print(f"[调试] 转换后的坐标: x={x}, y={y}")
        
        if x < 0 or y < 0:
            print(f"[错误] 无效的坐标: ({x}, {y})")
            return False
        
        if x > 10000 or y > 10000:
            print(f"[警告] 坐标值异常大: ({x}, {y})，可能配置错误")
        
        # 获取当前鼠标位置（使用Windows API或pynput）
        try:
            if use_windows_api:
                current_pos_win = get_cursor_pos_windows_api()
                current_pos_pynput = mouse_controller.position
                # print(f"[移动] 当前鼠标位置 (Windows API): {current_pos_win}")
                # print(f"[移动] 当前鼠标位置 (pynput): ({current_pos_pynput[0]}, {current_pos_pynput[1]})")
                current_pos = current_pos_win if current_pos_win else current_pos_pynput
            else:
                current_pos = mouse_controller.position
                # print(f"[移动] 当前鼠标位置: ({current_pos[0]}, {current_pos[1]})")
        except Exception as e:
            # print(f"[警告] 获取当前鼠标位置失败: {e}")
            # 如果获取位置失败，使用pynput
            try:
                current_pos = mouse_controller.position
                # print(f"[移动] 当前鼠标位置 (pynput): ({current_pos[0]}, {current_pos[1]})")
            except Exception:
                current_pos = (0, 0)
                # print(f"[警告] 无法获取鼠标位置，假设为(0,0)")
        
        # print(f"[移动] 目标坐标: ({x}, {y})")
        # if isinstance(current_pos, tuple) and len(current_pos) >= 2:
        #     print(f"[移动] 坐标差值: dx={x - current_pos[0]}, dy={y - current_pos[1]}")
        
        # 执行移动（优先使用Windows API）
        if use_windows_api:
            # print(f"[移动] 使用Windows API设置鼠标位置")
            success = set_cursor_pos_windows_api(x, y)
            if not success:
                # print(f"[警告] Windows API设置失败，尝试使用pynput (应用DPI修正: {dpi_scale_factor})")
                mouse_controller.position = (int(x / dpi_scale_factor), int(y / dpi_scale_factor))
        else:
            # print(f"[移动] 使用pynput设置鼠标位置 (应用DPI修正: {dpi_scale_factor})")
            mouse_controller.position = (int(x / dpi_scale_factor), int(y / dpi_scale_factor))
        
        time.sleep(mouse_move_delay)
        
        # 验证鼠标位置（使用Windows API和pynput对比）
        if use_windows_api:
            actual_pos_win = get_cursor_pos_windows_api()
            # actual_pos_pynput = mouse_controller.position
            # print(f"[移动] 移动后实际位置 (Windows API): {actual_pos_win}")
            # print(f"[移动] 移动后实际位置 (pynput): ({actual_pos_pynput[0]}, {actual_pos_pynput[1]})")
            
            # 使用Windows API的位置作为真实位置
            if actual_pos_win:
                actual_pos = actual_pos_win
                dx = abs(actual_pos[0] - x)
                dy = abs(actual_pos[1] - y)
                # print(f"[移动] 位置偏差 (Windows API): dx={dx}, dy={dy}")
                
                if dx > 5 or dy > 5:
                    # print(f"[警告] 鼠标位置不匹配！目标: ({x}, {y}), 实际: ({actual_pos[0]}, {actual_pos[1]})")
                    # 如果使用Windows API设置失败，偏差可能是DPI问题
                    # print(f"[调试] DPI缩放系数: {dpi_scale_factor}")
                    return False
            else:
                pass
                # 如果Windows API获取失败，忽略验证
        else:
            # pynput模式下，验证也需要考虑DPI
            actual_pos_raw = mouse_controller.position
            actual_pos = (int(actual_pos_raw[0] * dpi_scale_factor), int(actual_pos_raw[1] * dpi_scale_factor))
            dx = abs(actual_pos[0] - x)
            dy = abs(actual_pos[1] - y)
            # print(f"[移动] 移动后实际位置: ({actual_pos[0]}, {actual_pos[1]}) (原始: {actual_pos_raw})")
            # print(f"[移动] 位置偏差: dx={dx}, dy={dy}")
            
            if dx > 10 or dy > 10:
                # print(f"[警告] 鼠标位置不匹配！目标: ({x}, {y}), 实际: ({actual_pos[0]}, {actual_pos[1]})")
                # print(f"[警告] 偏差超过10像素，可能存在问题")
                return False
        
        # print(f"[移动] 鼠标移动成功，位置匹配")
        return True
    except Exception as e:
        print(f"[警告] 移动鼠标出错: {e}")
        return False

def click_mouse(button="left"):
    # 点击鼠标
    if button == "left":
        mouse_controller.click(Button.left)
    elif button == "right":
        mouse_controller.click(Button.right)
    time.sleep(mouse_click_delay)

def right_click_currency(currency):
    # 右键点击通货
    currency_names = {
        "alteration": "改造石",
        "augmentation": "增幅石",
        "regal": "富豪石",
        "chaos": "混沌石",
        "exalted": "崇高石",
        "alchemy": "点金石",
        "scouring": "重铸石",
        "transmutation": "蜕变石",
        "jewellers": "工匠石",
        "fusing": "链结石",
        "chromic": "幻色石"
    }
    
    currency_name = currency_names.get(currency, currency)
    
    if currency not in currency_positions:
        print(f"[错误] 未配置通货坐标: {currency}")
        return False
        
    pos = currency_positions[currency]
    
    # 详细输出坐标读取信息
    # print(f"[调试] 读取通货 {currency_name} ({currency}) 的坐标配置")
    # print(f"[调试] 坐标字典内容: {pos}")
    # print(f"[调试] 坐标类型检查 - x类型: {type(pos.get('x'))}, y类型: {type(pos.get('y'))}")
    # print(f"[调试] 坐标值 - x: {pos.get('x')}, y: {pos.get('y')}")
    
    # 验证坐标
    if pos['x'] == 0 and pos['y'] == 0:
        print(f"[错误] 通货 {currency_name} 的坐标未配置: ({pos['x']}, {pos['y']})")
        return False
    
    # 确保坐标是整数
    target_x = int(pos['x'])
    target_y = int(pos['y'])
    # print(f"[操作] 右键点击 {currency_name} 位置: ({target_x}, {target_y})")
    # print(f"[调试] 准备移动鼠标到坐标: x={target_x}, y={target_y}")
    
    if not move_mouse(target_x, target_y):
        print(f"[错误] 移动到 {currency_name} 失败")
        return False
        
    click_mouse("right")
    time.sleep(currency_right_click_delay)
    return True

def left_click_item():
    # 左键点击物品
    # 详细输出坐标读取信息
    # print(f"[调试] 读取物品位置坐标")
    # print(f"[调试] 坐标字典内容: {item_position}")
    # print(f"[调试] 坐标类型检查 - x类型: {type(item_position.get('x'))}, y类型: {type(item_position.get('y'))}")
    # print(f"[调试] 坐标值 - x: {item_position.get('x')}, y: {item_position.get('y')}")
    
    if item_position['x'] == 0 and item_position['y'] == 0:
        print("[错误] 物品位置未配置！")
        return False
    
    # 验证坐标
    if item_position['x'] < 0 or item_position['y'] < 0:
        print(f"[错误] 物品位置坐标无效: ({item_position['x']}, {item_position['y']})")
        return False
    
    # 确保坐标是整数
    target_x = int(item_position['x'])
    target_y = int(item_position['y'])
    # print(f"[操作] 左键点击物品位置: ({target_x}, {target_y})")
    # print(f"[调试] 准备移动鼠标到坐标: x={target_x}, y={target_y}")
    
    if not move_mouse(target_x, target_y):
        print("[错误] 移动到物品位置失败")
        return False
    time.sleep(item_left_click_delay)
    click_mouse("left")
    return True

def send_copy_command():
    # 发送 Alt+Ctrl+C 复制详细命令
    try:
        keyboard_controller.press(Key.ctrl)
        keyboard_controller.press(Key.alt)
        time.sleep(0.02)  # 短暂延迟确保修饰键按下
        keyboard_controller.press('c')
        time.sleep(0.02)  # 短暂延迟确保按键按下
        keyboard_controller.release('c')
        keyboard_controller.release(Key.alt)
        keyboard_controller.release(Key.ctrl)
        time.sleep(clipboard_read_delay / 1000.0)
        
        # 额外确保修饰键释放
        keyboard_controller.release(Key.ctrl)
        keyboard_controller.release(Key.alt)
        
        return True
    except Exception as e:
        print(f"[错误] 发送复制命令失败: {e}")
        # 发生错误时也要确保释放
        try:
            keyboard_controller.release(Key.ctrl)
            keyboard_controller.release(Key.alt)
        except:
            pass
        return False

def read_clipboard_to_file():
    # 读取剪切板并写入文件
    try:
        # 发送复制命令
        if not send_copy_command():
            return False
        
        # 读取剪切板文本
        clipboard_text = pyperclip.paste()
        
        if not clipboard_text or len(clipboard_text.strip()) == 0:
            print("[警告] 剪切板内容为空")
            return False
        
        # 转义JSON特殊字符
        clipboard_text = clipboard_text.replace('\\', '\\\\')
        clipboard_text = clipboard_text.replace('"', '\\"')
        clipboard_text = clipboard_text.replace('\n', '\\n')
        clipboard_text = clipboard_text.replace('\r', '\\r')
        clipboard_text = clipboard_text.replace('\t', '\\t')
        
        json_data = '{"clipboard": "' + clipboard_text + '"}'
        
        # 写入文件
        with open(item_info_file, 'w', encoding='utf-8') as f:
            f.write(json_data)
        return True
    except Exception as e:
        print(f"[错误] 读取剪切板失败: {e}")
        return False

def wait_for_parse_result():
    # 等待解析结果文件出现
    max_wait = 100  # 增加到10秒
    wait_count = 0
    
    # 先删除旧的结果文件（如果存在）
    if os.path.exists(item_info_result_file):
        try:
            os.remove(item_info_result_file)
        except:
            pass
    
    # 检查输入文件是否存在
    if not os.path.exists(item_info_file):
        print(f"[错误] 输入文件不存在: {item_info_file}")
        return {"error": "输入文件不存在"}
    
    while is_running:
        if os.path.exists(item_info_result_file):
            try:
                with open(item_info_result_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                
                if not content:
                    time.sleep(0.02)
                    wait_count += 1
                    if wait_count > max_wait:
                        return {"error": "结果文件为空"}
                    continue
                
                result = json.loads(content)
                
                # 检查是否有错误
                if result.get("error"):
                    print(f"[错误] 解析错误: {result.get('error')}")
                    return result
                
                return result
            except json.JSONDecodeError as e:
                print(f"[错误] JSON解析错误: {e}")
                time.sleep(0.02)
                wait_count += 1
                if wait_count > max_wait:
                    return {"error": f"JSON解析失败: {e}"}
                continue
            except Exception as e:
                print(f"[错误] 读取结果文件错误: {e}")
                time.sleep(0.02)
                wait_count += 1
                if wait_count > max_wait:
                    return {"error": f"读取结果失败: {e}"}
                continue
        
        # 每2秒输出一次等待信息
        if wait_count > 0 and wait_count % 20 == 0:
            print(f"[等待] 等待解析结果... ({wait_count * 0.1:.1f}秒)")
        
        time.sleep(0.02)
        wait_count += 1
        if wait_count > max_wait:
            print(f"[错误] 等待超时 ({max_wait * 0.1:.1f}秒)，未收到解析结果")
            print(f"[调试] 检查文件: {item_info_file} 和 {item_info_result_file}")
            return {"error": "等待超时，未收到解析结果"}
            
    return {"error": "循环已停止"}

# 自动启动制作
if __name__ == "__main__":
    try:
        # 立即刷新输出，确保启动信息显示
        sys.stdout.flush()
        sys.stderr.flush()
        
        print("[启动] 准备调用start_crafting()函数...")
        start_crafting()
        
        # 脚本结束时，确保释放所有按键
        release_shift_if_held()
        
        print("[完成] start_crafting()函数执行完成")
    except KeyboardInterrupt:
        print("\n[停止] 收到中断信号，正在退出...")
        is_running = False
        release_shift_if_held()
        sys.exit(0)
    except ImportError as e:
        print(f"\n[错误] 模块导入错误: {e}")
        print("[错误] 请检查是否安装了所有必要的依赖包")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    except Exception as e:
        print(f"\n[错误] 脚本执行出错: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

