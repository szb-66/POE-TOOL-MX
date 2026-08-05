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


{{DPI_AWARENESS}}

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

error_sound_played = False

def play_error_sound():
    """预检失败时只播放一次系统警告音。"""
    global error_sound_played
    if error_sound_played:
        return
    error_sound_played = True
    try:
        if sys.platform == 'win32' and 'winsound' in sys.modules:
            winsound.MessageBeep(winsound.MB_ICONHAND)
    except Exception as e:
        print(f"[警告] 播放错误提示音失败: {e}")

# Windows API鼠标控制（用于解决DPI缩放问题）
use_windows_api = False
dpi_scale_factor = {{DPI_SCALE_FACTOR}}
GetClipboardSequenceNumber = None
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

        try:
            GetClipboardSequenceNumber = user32.GetClipboardSequenceNumber
            GetClipboardSequenceNumber.restype = ctypes.c_uint
            GetClipboardSequenceNumber.argtypes = []
            print("[Windows API] 已启用GetClipboardSequenceNumber")
        except Exception as e:
            print(f"[警告] 无法初始化GetClipboardSequenceNumber: {e}")
            GetClipboardSequenceNumber = None
        
        # Windows API 主路径使用物理像素；该倍率仅供 pynput 回退路径换算。
        try:
            print(f"[DPI] 当前有效缩放: {dpi_scale_factor * 100:.0f}%")
            
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

# 自动操作等待（生成脚本时已将毫秒转换为秒）
mouse_move_delay = {{DELAY_MOUSE_MOVE}}
clipboard_read_delay = {{DELAY_CLIPBOARD}}

# 固定时序（生成脚本时填充，自适应关闭时由用户配置覆盖）
MODIFIER_SETTLE_SECONDS = float({{MODIFIER_SETTLE_MS}}) / 1000.0
KEY_HOLD_SECONDS = float({{KEY_HOLD_MS}}) / 1000.0
BUTTON_HOLD_SECONDS = float({{BUTTON_HOLD_MS}}) / 1000.0
RELEASE_SETTLE_SECONDS = float({{RELEASE_SETTLE_MS}}) / 1000.0
CLIPBOARD_RESPONSE_MIN_SECONDS = float({{CLIPBOARD_CONFIRM_MS}}) / 1000.0
STASH_TAB_SETTLE_SECONDS = float({{STASH_TAB_SETTLE_MS}}) / 1000.0
STASH_SETTLE_SECONDS = float({{STASH_SETTLE_MS}}) / 1000.0

# 自适应等待模式（生成脚本时填充）
TIMING_MODE = "{{TIMING_MODE}}"

# 通货坐标（确保坐标值为整数）
currency_positions = {{CURRENCY_POSITIONS}}
required_currency_types = {{REQUIRED_CURRENCY_TYPES}}
verified_currency_types = set()
fatal_error_reason = None
foreground_failure_emitted = False
stash_tab_selection = json.loads({{STASH_TAB_SELECTION_JSON}})
stash_tab_selector_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stash_tab_selector.py")
GAME_WINDOW_TITLES = ("流放之路", "Path of Exile")
_game_window_titles_cache = GAME_WINDOW_TITLES
_game_window_titles_mtime_ns = None
GAME_WINDOW_PROCESS_NAMES = ("PathOfExile.exe", "PathOfExile_x64.exe", "PathOfExileSteam.exe", "PathOfExile_x64Steam.exe")
_game_window_process_names_cache = GAME_WINDOW_PROCESS_NAMES
_game_window_process_names_mtime_ns = None


def game_window_titles():
    global _game_window_titles_cache, _game_window_titles_mtime_ns
    config_path = os.environ.get("POE_GAME_WINDOW_TITLES_FILE", "")
    if not config_path:
        return GAME_WINDOW_TITLES
    try:
        mtime_ns = os.stat(config_path).st_mtime_ns
        if mtime_ns != _game_window_titles_mtime_ns:
            with open(config_path, "r", encoding="utf-8") as stream:
                payload = json.load(stream)
            values = payload.get("titles") if isinstance(payload, dict) else payload
            titles = tuple(str(value).strip() for value in values) if isinstance(values, list) else ()
            if not titles or any(not title for title in titles) or len({title.casefold() for title in titles}) != len(titles):
                raise ValueError("invalid game window titles")
            _game_window_titles_cache = titles
            _game_window_titles_mtime_ns = mtime_ns
        return _game_window_titles_cache
    except Exception:
        _game_window_titles_cache = GAME_WINDOW_TITLES
        _game_window_titles_mtime_ns = None
        return GAME_WINDOW_TITLES


def game_window_title_priority(title):
    folded = str(title or "").casefold()
    return next((priority for priority, expected_title in enumerate(game_window_titles()) if expected_title.casefold() in folded), -1)


def game_window_process_names():
    global _game_window_process_names_cache, _game_window_process_names_mtime_ns
    config_path = os.environ.get("POE_GAME_WINDOW_TITLES_FILE", "")
    if not config_path:
        return GAME_WINDOW_PROCESS_NAMES
    try:
        mtime_ns = os.stat(config_path).st_mtime_ns
        if mtime_ns != _game_window_process_names_mtime_ns:
            with open(config_path, "r", encoding="utf-8") as stream:
                payload = json.load(stream)
            values = payload.get("processNames") if isinstance(payload, dict) else None
            process_names = tuple(str(value).strip() for value in values) if isinstance(values, list) else ()
            if not process_names or any(not name for name in process_names) or len({name.casefold() for name in process_names}) != len(process_names):
                raise ValueError("invalid game window process names")
            _game_window_process_names_cache = process_names
            _game_window_process_names_mtime_ns = mtime_ns
        return _game_window_process_names_cache
    except Exception:
        _game_window_process_names_cache = GAME_WINDOW_PROCESS_NAMES
        _game_window_process_names_mtime_ns = None
        return GAME_WINDOW_PROCESS_NAMES


def window_process_name(hwnd):
    if sys.platform != "win32" or not hwnd:
        return ""
    try:
        user32 = ctypes.windll.user32
        pid = wintypes.DWORD()
        user32.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
        user32.GetWindowThreadProcessId.restype = wintypes.DWORD
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        if not pid.value:
            return ""
        kernel32 = ctypes.windll.kernel32
        kernel32.OpenProcess.restype = wintypes.HANDLE
        handle = kernel32.OpenProcess(0x1000, False, pid.value)
        if not handle:
            return ""
        try:
            size = wintypes.DWORD(32768)
            buffer = ctypes.create_unicode_buffer(size.value)
            kernel32.QueryFullProcessImageNameW.argtypes = [
                wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)
            ]
            kernel32.QueryFullProcessImageNameW.restype = wintypes.BOOL
            if kernel32.QueryFullProcessImageNameW(handle, 0, buffer, ctypes.byref(size)):
                return buffer.value.rsplit("\\", 1)[-1].rsplit("/", 1)[-1].casefold()
        finally:
            kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
            kernel32.CloseHandle(handle)
    except Exception:
        return ""
    return ""


def window_matches_game(hwnd):
    if not hwnd:
        return False
    user32 = ctypes.windll.user32
    user32.GetWindowTextLengthW.argtypes = [wintypes.HWND]
    user32.GetWindowTextLengthW.restype = ctypes.c_int
    user32.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
    user32.GetWindowTextW.restype = ctypes.c_int
    length = user32.GetWindowTextLengthW(hwnd)
    buffer = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buffer, length + 1)
    title = buffer.value.strip()
    if game_window_title_priority(title) < 0:
        return False
    return window_process_name(hwnd) in {name.casefold() for name in game_window_process_names()}

# 物品位置坐标（确保坐标值为整数）
item_position = {{ITEM_POSITION}}

# 创建鼠标和键盘控制器
mouse_controller = mouse.Controller()
keyboard_controller = keyboard.Controller()

def is_game_foreground():
    if sys.platform != "win32":
        return False
    try:
        return window_matches_game(user32.GetForegroundWindow())
    except Exception:
        return False

def require_game_foreground():
    global is_running, fatal_error_reason, foreground_failure_emitted
    if is_game_foreground():
        return True
    is_running = False
    fatal_error_reason = "游戏窗口运行中失去前台，制作已安全停止"
    release_all_keys()
    if not foreground_failure_emitted:
        foreground_failure_emitted = True
        print("EVENT " + json.dumps({
            "event": "crafting-runtime-stopped", "mode": "items",
            "code": "GAME_NOT_FOREGROUND", "reason": fatal_error_reason
        }, ensure_ascii=False), flush=True)
        print(f"[停止] {fatal_error_reason}")
    return False

def focus_game_window(timeout_seconds=2.0):
    if is_game_foreground():
        return True
    if sys.platform != "win32":
        return False
    matches = []
    callback_type = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)
    def visit(hwnd, _lparam):
        if not user32.IsWindowVisible(hwnd):
            return True
        length = user32.GetWindowTextLengthW(hwnd)
        buffer = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(hwnd, buffer, length + 1)
        priority = game_window_title_priority(buffer.value)
        if priority >= 0 and window_matches_game(hwnd):
            matches.append((priority, hwnd))
        return True
    try:
        user32.EnumWindows(callback_type(visit), 0)
        if not matches:
            return False
        matches.sort(key=lambda entry: entry[0])
        hwnd = matches[0][1]
        if user32.IsIconic(hwnd):
            user32.ShowWindow(hwnd, 9)
        user32.BringWindowToTop(hwnd)
        user32.SetForegroundWindow(hwnd)
        deadline = time.monotonic() + max(0.2, float(timeout_seconds))
        while time.monotonic() < deadline:
            if is_game_foreground():
                return True
            time.sleep(0.05)
    except Exception:
        return False
    return False

# 主函数
def start_crafting():
    # 开始制作
    global is_running, fatal_error_reason
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

    if not focus_game_window():
        fatal_error_reason = "无法激活游戏窗口，请确认《流放之路》已启动且窗口可见"
        is_running = False
        release_all_keys()
        print("EVENT " + json.dumps({
            "event": "crafting-startup-failed", "mode": "items", "reason": fatal_error_reason
        }, ensure_ascii=False), flush=True)
        print(f"[停止] {fatal_error_reason}")
        return False
    
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

    if not select_currency_stash_tab("items"):
        return False

    if not preflight_required_currencies():
        return False

    print("EVENT " + json.dumps({
        "event": "crafting-startup-succeeded", "mode": "items"
    }, ensure_ascii=False), flush=True)
    
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
    return True

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

def select_currency_stash_tab(mode):
    """在任何通货/物品点击前调用独立选择器，并转发统一结构化事件。"""
    global is_running, fatal_error_reason
    if not stash_tab_selection.get("enabled"):
        return True
    process = None
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"stash_tab_selector_{mode}.json")
    selector_output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"stash_tab_selector_{mode}.log")
    selector_timeout_seconds = 120.0 if stash_tab_selection.get("hasScrollbar") else 30.0
    try:
        import subprocess
        config = dict(stash_tab_selection)
        config["targetName"] = str((config.get("names") or {}).get("currency") or "")
        with open(config_path, "w", encoding="utf-8") as handle:
            json.dump(config, handle, ensure_ascii=False)
        timed_out = False
        with open(selector_output_path, "w+", encoding="utf-8", errors="replace") as selector_output:
            process = subprocess.Popen(
                [sys.executable, stash_tab_selector_path, "--mode", "select", "--config", config_path],
                stdout=selector_output, stderr=subprocess.STDOUT,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0)
            )
            deadline = time.monotonic() + selector_timeout_seconds
            while is_running and process.poll() is None:
                if time.monotonic() >= deadline:
                    timed_out = True
                    break
                time.sleep(0.05)
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=1)
                except Exception:
                    process.kill()
                    process.wait(timeout=1)
            selector_output.flush()
            selector_output.seek(0)
            selector_output_text = selector_output.read()
        if timed_out:
            response = {
                "success": False, "code": "selector-timeout",
                "reason": f"仓库页识别超过 {selector_timeout_seconds:.0f} 秒，已停止；请检查框选区域和滚动条设置"
            }
        else:
            line = next((line for line in reversed(selector_output_text.splitlines()) if line.startswith("RESULT ")), "")
            diagnostic = "\n".join(selector_output_text.splitlines()[-8:]).strip()
            response = json.loads(line[7:]) if line else {
                "success": False, "reason": diagnostic or "识别器没有返回结果"
            }
        if not is_running and not timed_out:
            release_all_keys()
            return False
    except Exception as error:
        response = {"success": False, "reason": f"仓库页识别器启动失败：{error}", "code": "selector-startup-failed"}
    if not response.get("success"):
        fatal_error_reason = response.get("reason") or "仓库页自动选择失败"
        is_running = False
        release_all_keys()
        print("EVENT " + json.dumps({
            "event": "stash-tab-selection-failed", "mode": mode,
            "code": response.get("code", "selection-failed"), "reason": fatal_error_reason
        }, ensure_ascii=False), flush=True)
        print(f"[停止] {fatal_error_reason}")
        play_error_sound()
        return False
    print("EVENT " + json.dumps({
        "event": "stash-tab-selection-succeeded", "mode": mode,
        "targetName": response.get("targetName"), "scrollStep": response.get("scrollStep", 0)
    }, ensure_ascii=False), flush=True)
    if TIMING_MODE == "adaptive":
        time.sleep(0.05)
    else:
        time.sleep(STASH_TAB_SETTLE_SECONDS)
    return True

CURRENCY_NAMES = {
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
    "chromic": "幻色石",
    "vaal": "瓦尔宝珠",
    "wisdom": "知识卷轴"
}

def copied_item_header(text):
    lines = []
    for raw_line in str(text or "").replace("\r\n", "\n").replace("\r", "\n").split("\n"):
        line = raw_line.strip()
        if len(line) >= 4 and set(line) == {"-"}:
            break
        if line:
            lines.append(line)
    return lines

def detected_item_name(header_lines):
    candidates = [
        line for line in header_lines
        if ":" not in line and "：" not in line
    ]
    return candidates[-1] if candidates else "未检测到物品"

def fail_currency_preflight(currency, reason, actual="未检测到物品"):
    global is_running, fatal_error_reason
    expected = CURRENCY_NAMES.get(currency, currency)
    pos = currency_positions.get(currency) or {}
    fatal_error_reason = reason
    is_running = False
    release_all_keys()
    payload = {
        "event": "currency-preflight-failed",
        "mode": "items",
        "currency": currency,
        "expected": expected,
        "actual": actual,
        "position": {"x": int(pos.get("x", 0)), "y": int(pos.get("y", 0))},
        "reason": reason
    }
    print("EVENT " + json.dumps(payload, ensure_ascii=False), flush=True)
    print(f"[停止] {reason}")
    play_error_sound()
    return False

def preflight_required_currencies():
    verified_currency_types.clear()
    print(f"[预检] 开始验证固定通货: {required_currency_types}")
    if required_currency_types and GetClipboardSequenceNumber is None:
        return fail_currency_preflight(
            required_currency_types[0],
            "无法读取剪贴板序列号，已停止制作以避免误操作"
        )

    for currency in required_currency_types:
        expected = CURRENCY_NAMES.get(currency, currency)
        pos = currency_positions.get(currency)
        if not pos or (int(pos.get("x", 0)) == 0 and int(pos.get("y", 0)) == 0):
            return fail_currency_preflight(
                currency,
                f"未配置{expected}坐标，无法完成启动预检"
            )
        if not move_mouse(int(pos["x"]), int(pos["y"])):
            return fail_currency_preflight(
                currency,
                f"无法移动到{expected}坐标，已停止制作"
            )

        try:
            sequence_before = GetClipboardSequenceNumber()
        except Exception:
            return fail_currency_preflight(
                currency,
                f"无法读取{expected}复制前的剪贴板序列号，已停止制作"
            )
        try:
            before_text = str(pyperclip.paste() or "")
        except Exception:
            before_text = ""
        if not send_copy_command(sequence_before, before_text):
            return fail_currency_preflight(currency, f"无法复制{expected}位置的物品信息")
        try:
            sequence_after = GetClipboardSequenceNumber()
        except Exception:
            return fail_currency_preflight(
                currency,
                f"无法读取{expected}复制后的剪贴板序列号，已停止制作"
            )
        if sequence_after == sequence_before:
            return fail_currency_preflight(
                currency,
                f"{expected}坐标下没有可复制物品，请确认已切换到正确仓库页"
            )

        header = copied_item_header(pyperclip.paste())
        actual = detected_item_name(header)
        if expected not in actual:
            return fail_currency_preflight(
                currency,
                f"通货位置错误：需要{expected}，实际检测到{actual}",
                actual
            )
        verified_currency_types.add(currency)
        print(f"[预检] {expected}验证通过")

    print("EVENT " + json.dumps({
        "event": "currency-preflight-succeeded",
        "mode": "items",
        "currencies": required_currency_types
    }, ensure_ascii=False), flush=True)
    print("[预检] 固定通货全部验证通过，开始正式制作")
    return True

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
        if not require_game_foreground():
            return False
        # 验证坐标类型和有效性
        # print(f"[调试] move_mouse 接收到的参数: x={x} (类型: {type(x)}), y={y} (类型: {type(y)})")
        
        # 确保坐标是整数
        x = int(x)
        y = int(y)
        # print(f"[调试] 转换后的坐标: x={x}, y={y}")
        
        if abs(x) > 10000 or abs(y) > 10000:
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
    if not require_game_foreground():
        return False
    if button == "left":
        mouse_controller.press(Button.left)
        time.sleep(BUTTON_HOLD_SECONDS)
        mouse_controller.release(Button.left)
    elif button == "right":
        mouse_controller.press(Button.right)
        time.sleep(BUTTON_HOLD_SECONDS)
        mouse_controller.release(Button.right)
    time.sleep(RELEASE_SETTLE_SECONDS)
    return True

def right_click_currency(currency):
    # 右键点击通货
    currency_name = CURRENCY_NAMES.get(currency, currency)

    if currency not in verified_currency_types:
        return fail_currency_preflight(
            currency,
            f"{currency_name}未经过本次启动预检，已在点击前停止制作"
        )
    
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
    
    # 确保坐标是整数
    target_x = int(item_position['x'])
    target_y = int(item_position['y'])
    # print(f"[操作] 左键点击物品位置: ({target_x}, {target_y})")
    # print(f"[调试] 准备移动鼠标到坐标: x={target_x}, y={target_y}")
    
    if not move_mouse(target_x, target_y):
        print("[错误] 移动到物品位置失败")
        return False
    click_mouse("left")
    return True

def send_copy_command(before_seq=None, before_text=""):
    # 发送 Ctrl+C 复制详细命令；自适应模式下轮询直到剪贴板出现新内容或超时
    try:
        if not require_game_foreground():
            return False
        keyboard_controller.press(Key.ctrl)
        time.sleep(MODIFIER_SETTLE_SECONDS)
        if not require_game_foreground():
            return False
        keyboard_controller.press('c')
        time.sleep(KEY_HOLD_SECONDS)
        keyboard_controller.release('c')
        time.sleep(RELEASE_SETTLE_SECONDS)
        keyboard_controller.release(Key.ctrl)
        if TIMING_MODE == "adaptive":
            return wait_for_clipboard_change(before_seq, before_text, CLIPBOARD_RESPONSE_MIN_SECONDS)
        time.sleep(max(CLIPBOARD_RESPONSE_MIN_SECONDS, clipboard_read_delay / 1000.0))
        return True
    except Exception as e:
        print(f"[错误] 发送复制命令失败: {e}")
        # 发生错误时也要确保释放
        try:
            keyboard_controller.release(Key.ctrl)
        except:
            pass
        return False

def clipboard_changed(before_seq, before_text):
    if GetClipboardSequenceNumber is not None:
        try:
            if before_seq is not None and GetClipboardSequenceNumber() != before_seq:
                return True
        except Exception:
            pass
    current_text = str(pyperclip.paste() or "")
    return bool(current_text.strip()) and current_text != before_text


def wait_for_clipboard_change(before_seq, before_text, timeout_seconds):
    deadline = time.monotonic() + timeout_seconds
    while is_running and time.monotonic() < deadline:
        if clipboard_changed(before_seq, before_text):
            return True
        time.sleep(0.01)
    return False

def read_clipboard_to_file():
    # 读取剪切板并写入文件
    try:
        before_seq = None
        before_text = ""
        if GetClipboardSequenceNumber is not None:
            try:
                before_seq = GetClipboardSequenceNumber()
            except Exception:
                before_seq = None
        try:
            before_text = str(pyperclip.paste() or "")
        except Exception:
            before_text = ""
        # 发送复制命令
        if not send_copy_command(before_seq, before_text):
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
        
        if fatal_error_reason:
            sys.exit(2)
        print("[系统] start_crafting()函数执行结束")
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
