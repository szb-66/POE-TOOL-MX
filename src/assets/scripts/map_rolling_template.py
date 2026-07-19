#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Purpose: 自动化批量洗图流程，驱动鼠标键盘、读取解析结果、按配置匹配并存仓。
# Inputs: 前端模板填充的配置项（延迟、坐标、match 条件、通货策略、快捷键）；外部解析结果文件 `item_info_result_file`。
# Outputs: 统计信息写入 `item_info_result_file`；控制鼠标键盘完成洗图、存仓；打印日志给调用方。
# Preconditions: 渲染端已生成配置并传入模板；前端监听 `item_info_result_file` 变化；游戏窗口与坐标配置正确。
# Edge cases: 剪贴板/Windows API 不可用时回退；快捷键注册失败仅告警；部分 I/O 失败当前策略为继续尝试或提前退出。
# 生成时间: {{GEN_DATE}}

print("=" * 60)
print("[启动] Python洗图脚本开始执行")
print("=" * 60)

import sys
import io


{{DPI_AWARENESS}}

try:
    if sys.version_info >= (3, 7):
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    elif sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
except Exception as e:
    print(f"[警告] 设置UTF-8编码失败: {e}")

sys.stdout.flush()
sys.stderr.flush()

print("[启动] 正在导入依赖包...")

try:
    import time
    import json
    import os
    import signal
    import re
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
    sys.exit(1)

try:
    import pyperclip
    print("[启动] pyperclip模块导入成功")
except ImportError as e:
    print(f"[错误] pyperclip模块导入失败: {e}")
    sys.exit(1)

try:
    if sys.platform == 'win32':
        import winsound
        print("[启动] winsound模块导入成功")
except ImportError:
    pass

print("[启动] 所有依赖包导入成功")
sys.stdout.flush()

# 全局变量
is_running = False

# 播放提示音函数
def play_success_sound():
    try:
        if sys.platform == 'win32' and 'winsound' in sys.modules:
            winsound.MessageBeep(winsound.MB_OK)
    except Exception:
        pass

# Windows API鼠标控制
use_windows_api = False
GetClipboardSequenceNumber = None
try:
    if sys.platform == 'win32':
        import ctypes
        from ctypes import wintypes
        user32 = ctypes.windll.user32
        SetCursorPos = user32.SetCursorPos
        SetCursorPos.argtypes = [ctypes.c_int, ctypes.c_int]
        SetCursorPos.restype = wintypes.BOOL
        GetCursorPos = user32.GetCursorPos
        try:
            WinCursorPoint = wintypes.POINT
        except AttributeError:
            class WinCursorPoint(ctypes.Structure):
                _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]
        GetCursorPos.argtypes = [ctypes.POINTER(WinCursorPoint)]
        GetCursorPos.restype = wintypes.BOOL
        
        # 获取剪切板序列号函数
        try:
            GetClipboardSequenceNumber = user32.GetClipboardSequenceNumber
            GetClipboardSequenceNumber.restype = ctypes.c_uint
            GetClipboardSequenceNumber.argtypes = []
            print("[Windows API] 已启用GetClipboardSequenceNumber")
        except Exception as e:
            print(f"[警告] 无法初始化GetClipboardSequenceNumber: {e}")
            GetClipboardSequenceNumber = None
        
        try:
            try:
                shcore = ctypes.windll.shcore
                GetDpiForSystem = shcore.GetDpiForSystem
                GetDpiForSystem.restype = ctypes.c_uint
                dpi = GetDpiForSystem()
                dpi_scale_factor = dpi / 96.0
            except Exception:
                dpi_scale_factor = 1.0
            
            use_windows_api = True
            print("[Windows API] 已启用Windows API鼠标控制")
        except Exception:
            use_windows_api = False
    else:
        print("[Windows API] 非Windows系统，使用pynput进行鼠标控制")
except Exception:
    use_windows_api = False

def signal_handler(signum, frame):
    global is_running
    print("\n[停止] 收到终止信号，正在停止脚本...")
    is_running = False
    sys.exit(0)

try:
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
except:
    pass

item_info_file = r"{{ITEM_INFO_FILE}}"
item_info_result_file = r"{{ITEM_INFO_RESULT_FILE}}"

# 延迟配置
mouse_move_delay = float({{DELAY_MOUSE_MOVE}})  # type: ignore
mouse_click_delay = float({{DELAY_MOUSE_CLICK}})  # type: ignore
key_press_delay = float({{DELAY_KEY_PRESS}})  # type: ignore
clipboard_read_delay = float({{DELAY_CLIPBOARD}})  # type: ignore
# 关键操作额外缓冲：确保通货成功挂到鼠标上，避免左键直接拾取地图
currency_right_click_delay = max(mouse_click_delay * 3, 0.08)
item_left_click_delay = max(mouse_click_delay * 2.5, 0.06)

# 坐标配置
currency_positions = {{CURRENCY_POSITIONS}}  # type: ignore
grid_config = {{GRID_CONFIG}} # {startX, startY, offsetX, offsetY, rows, cols}  # type: ignore
map_config = {{MAP_CONFIG}}   # {method, vaal, match}  # type: ignore

# 创建控制器
mouse_controller = mouse.Controller()
keyboard_controller = keyboard.Controller()
current_currency_type = None
is_shift_held = False

def get_cursor_pos_windows_api():
    global use_windows_api
    try:
        if not use_windows_api: return None
        point = WinCursorPoint()
        if GetCursorPos(ctypes.byref(point)):
            return (point.x, point.y)
        return None
    except Exception:
        use_windows_api = False
        return None

def set_cursor_pos_windows_api(x, y):
    global use_windows_api
    try:
        if not use_windows_api: return False
        return bool(SetCursorPos(int(x), int(y)))
    except Exception:
        use_windows_api = False
        return False

def move_mouse(x, y):
    try:
        x, y = int(x), int(y)
        if use_windows_api:
            success = set_cursor_pos_windows_api(x, y)
            if not success:
                mouse_controller.position = (int(x / dpi_scale_factor), int(y / dpi_scale_factor))
        else:
            mouse_controller.position = (int(x / dpi_scale_factor), int(y / dpi_scale_factor))
        time.sleep(mouse_move_delay)
        return True
    except Exception:
        return False

def click_mouse(button="left"):
    if button == "left": mouse_controller.click(Button.left)
    elif button == "right": mouse_controller.click(Button.right)
    time.sleep(mouse_click_delay)

def release_all_keys():
    try:
        keyboard_controller.release(Key.shift)
        keyboard_controller.release(Key.ctrl)
        keyboard_controller.release(Key.alt)
    except:
        pass

def release_shift_if_held():
    global is_shift_held
    release_all_keys()
    is_shift_held = False
    time.sleep(0.05)

def right_click_currency(currency):
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
        "chromic": "幻色石",
        "vaal": "瓦尔宝珠",
        "wisdom": "知识卷轴"
    }
    
    if currency not in currency_positions:
        print(f"[错误] 未配置通货坐标: {currency}")
        return False
        
    pos = currency_positions[currency]
    if not move_mouse(int(pos['x']), int(pos['y'])):
        return False
        
    click_mouse("right")
    time.sleep(currency_right_click_delay)
    return True

def apply_currency(currency_type, target_x, target_y):
    try:
        release_shift_if_held()
        if not right_click_currency(currency_type): return False
        if not move_mouse(target_x, target_y): return False
        time.sleep(item_left_click_delay)
        click_mouse("left")
        time.sleep(item_left_click_delay)
        return True
    except Exception as e:
        print(f"[错误] 应用通货失败: {e}")
        release_shift_if_held()
        return False

def send_copy_command():
    try:
        # 使用 Ctrl+Alt+C 读取高级属性
        keyboard_controller.press(Key.ctrl)
        keyboard_controller.press(Key.alt)
        time.sleep(0.05) # 稍微增加按键间隔
        keyboard_controller.press('c')
        time.sleep(0.05)
        keyboard_controller.release('c')
        keyboard_controller.release(Key.alt)
        keyboard_controller.release(Key.ctrl)
        time.sleep(clipboard_read_delay / 1000.0)
        # 释放所有修饰键以防万一
        keyboard_controller.release(Key.ctrl)
        keyboard_controller.release(Key.alt)
        return True
    except:
        return False

def read_clipboard_to_file():
    try:
        if not send_copy_command(): return False
        clipboard_text = pyperclip.paste()
        if not clipboard_text or len(clipboard_text.strip()) == 0: return False
        
        # JSON escape
        clipboard_text = clipboard_text.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
        json_data = '{"clipboard": "' + clipboard_text + '"}'
        
        with open(item_info_file, 'w', encoding='utf-8') as f:
            f.write(json_data)
        return True
    except Exception:
        return False

def wait_for_parse_result():
    max_wait = 100
    wait_count = 0
    
    if os.path.exists(item_info_result_file):
        try: os.remove(item_info_result_file)
        except: pass
        
    while is_running:
        if os.path.exists(item_info_result_file):
            try:
                with open(item_info_result_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                if not content:
                    time.sleep(0.02)
                    wait_count += 1
                    continue
                return json.loads(content)
            except Exception:
                time.sleep(0.02)
        
        time.sleep(0.02)
        wait_count += 1
        if wait_count > max_wait:
            return {"error": "等待超时"}
    return {"error": "循环已停止"}

def get_slot_position(col, row):
    # 列优先遍历
    # col: 0-11, row: 0-4
    # 计算实际像素坐标
    x = grid_config['startX'] + col * grid_config['offsetX']
    y = grid_config['startY'] + row * grid_config['offsetY']
    return int(x), int(y)

def stash_item(x, y):
    # Ctrl+Click 存仓
    try:
        if not move_mouse(x, y): return False
        keyboard_controller.press(Key.ctrl)
        time.sleep(0.05)
        click_mouse("left")
        time.sleep(0.05)
        keyboard_controller.release(Key.ctrl)
        time.sleep(0.2) # 等待存仓动作完成
        return True
    except:
        keyboard_controller.release(Key.ctrl)
        return False

def update_map_stats(processed_count, qualified_count, blacklist_stats, whitelist_stats):
    # 更新地图统计信息到结果文件，供前端实时显示
    try:
        current_result = {}
        if os.path.exists(item_info_result_file):
            try:
                with open(item_info_result_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    if content:
                        current_result = json.loads(content)
            except:
                pass  # 如果读取失败，使用空字典
        
        # 更新统计信息
        current_result['processed_count'] = processed_count
        current_result['qualified_count'] = qualified_count
        current_result['blacklist_stats'] = blacklist_stats.copy()  # 复制字典
        current_result['whitelist_stats'] = whitelist_stats.copy()  # 复制字典
        
        # 写入文件并立即刷新，确保文件监听器能够捕获到变化
        json_str = json.dumps(current_result)
        with open(item_info_result_file, 'w', encoding='utf-8') as f:
            f.write(json_str)
            f.flush()  # 立即刷新到磁盘
            os.fsync(f.fileno())  # 确保数据写入磁盘
        # 额外的小延迟，确保文件系统完全同步
        time.sleep(0.01)
    except Exception as e:
        # 静默失败，不影响主流程
        pass

def start_map_rolling():
    """Purpose: 主控循环，按网格遍历地图、读取解析结果、套用策略并更新统计。
    Inputs: grid_config 坐标与行列，map_config 洗图策略，GetClipboardSequenceNumber 等外部依赖。
    Outputs: 写入 item_info_file/item_info_result_file；日志输出；可选存仓动作。
    Preconditions: 游戏窗口前置且坐标正确；前端文件监听正常；pynput 可用。
    Edge cases: 剪贴板序列号不可用时回退到内容检查；快捷键注册失败仅告警；读取/解析超时会跳过当前格子。
    """
    global is_running
    is_running = True
    
    print(f"[启动] 开始执行地图洗练脚本")
    print(f"[配置] 网格配置: {grid_config}")
    print(f"[配置] 地图配置: {map_config}")
    
    # 注册快捷键
    try:
        def on_stop():
            global is_running
            print("\n[快捷键] 停止脚本")
            is_running = False
            release_all_keys()
            
        listener = keyboard.GlobalHotKeys({'{{PYNPUT_STOP_SHORTCUT}}': on_stop})
        listener.start()
        print(f"[快捷键] 停止快捷键已注册: {{PYNPUT_STOP_SHORTCUT}}")
    except Exception as e:
        print(f"[警告] 快捷键注册失败: {e}")

    print(f"[开始] 地图洗练流程")
    
    processed_count = 0
    qualified_count = 0
    blacklist_stats = {}  # 统计黑名单词缀拦截次数
    whitelist_stats = {}  # 统计白名单词缀通过次数
    current_col = 0
    current_row = 0
    
    # 从第一个格子开始，按列优先顺序处理
    while is_running and current_col < grid_config['cols']:
        # 计算当前格子坐标
        slot_x, slot_y = get_slot_position(current_col, current_row)
        print(f"[进度] 正在处理第 {current_col+1} 列, 第 {current_row+1} 行 (坐标: {slot_x}, {slot_y})")
        
        # 1. 移动鼠标到当前格子
        if not move_mouse(slot_x, slot_y):
            print("[错误] 鼠标移动失败，跳过")
            # 移动到下一个格子
            current_row += 1
            if current_row >= grid_config['rows']:
                current_row = 0
                current_col += 1
            continue
        time.sleep(0.1)
        
        # 2. 记录复制前的剪切板序列号
        clipboard_seq_before = None
        if GetClipboardSequenceNumber:
            try:
                clipboard_seq_before = GetClipboardSequenceNumber()
            except Exception as e:
                print(f"[警告] 获取剪切板序列号失败: {e}")
        
        # 3. 复制物品信息
        print(f"[操作] 复制物品信息 (Ctrl+Alt+C)")
        if not read_clipboard_to_file():
            print("[提示] 复制失败")
            # 移动到下一个格子
            current_row += 1
            if current_row >= grid_config['rows']:
                current_row = 0
                current_col += 1
            continue
        
        # 4. 检查剪切板序列号是否变化（判断是否复制到新内容）
        clipboard_seq_after = None
        if GetClipboardSequenceNumber:
            try:
                clipboard_seq_after = GetClipboardSequenceNumber()
            except Exception as e:
                print(f"[警告] 获取剪切板序列号失败: {e}")
        
        # 检查是否成功复制到新内容
        if GetClipboardSequenceNumber:
            # 如果GetClipboardSequenceNumber可用，必须成功获取到两个序列号
            if clipboard_seq_before is None or clipboard_seq_after is None:
                print(f"[停止] 无法获取剪切板序列号 (before: {clipboard_seq_before}, after: {clipboard_seq_after})，停止流程")
                is_running = False
                break
            # 如果序列号没有变化，说明没有复制到新内容，停止流程
            if clipboard_seq_after == clipboard_seq_before:
                print(f"[停止] 剪切板序列号未变化 ({clipboard_seq_before} -> {clipboard_seq_after})，说明没有复制到新内容，流程结束")
                is_running = False
                break
            else:
                print(f"[检测] 剪切板序列号已变化 ({clipboard_seq_before} -> {clipboard_seq_after})，检测到新内容")
        else:
            # 如果GetClipboardSequenceNumber不可用，回退到检查剪切板内容
            # 检查剪切板内容是否有效（不为空且可能包含地图信息）
            try:
                clipboard_text = pyperclip.paste()
                if not clipboard_text or len(clipboard_text.strip()) == 0:
                    print("[停止] 剪切板内容为空，说明没有复制到新内容，流程结束")
                    is_running = False
                    break
                # 如果剪切板有内容，继续执行（无法判断是否是地图，交给后续解析判断）
                print("[检测] 剪切板有内容，继续处理")
            except Exception as e:
                print(f"[停止] 无法读取剪切板内容: {e}，流程结束")
                is_running = False
                break
        
        # 5. 等待解析结果
        result = wait_for_parse_result()
        if result.get("error"):
            if result.get("isLegendary"):
                print("[提示] 检测到传奇地图，跳过")
            else:
                print(f"[提示] 解析失败: {result.get('error')}")
            
            # 移动到下一个格子
            current_row += 1
            if current_row >= grid_config['rows']:
                current_row = 0
                current_col += 1
            continue
        
        # 6. 检查是否是地图
        category = result.get("category", "") or result.get("itemClass", "")
        if category not in ["异界地图", "地图"]:
            print(f"[提示] 不是地图 (类别: {category})，跳过")
            # 移动到下一个格子
            current_row += 1
            if current_row >= grid_config['rows']:
                current_row = 0
                current_col += 1
            continue
        
        # 7. 处理该地图
        print(f"[处理] 开始处理地图: {result.get('name', '未知')} T{result.get('mapTier', 0)}")
        # 统计当前地图的黑白名单词缀
        map_blacklist_stats, map_whitelist_stats = count_affix_stats(result)
        # 合并到总统计中
        for affix, count in map_blacklist_stats.items():
            blacklist_stats[affix] = blacklist_stats.get(affix, 0) + count
        for affix, count in map_whitelist_stats.items():
            whitelist_stats[affix] = whitelist_stats.get(affix, 0) + count
        
        map_result = process_single_map(result, slot_x, slot_y)
        if map_result:
            processed_count += 1
            # 如果返回的是元组，第二个值表示是否满足条件
            if isinstance(map_result, tuple) and len(map_result) > 1 and map_result[1]:
                qualified_count += 1
            # 将处理数量、符合条件数量和词缀统计写入结果文件供前端显示
            # 立即更新统计信息，确保前端能够实时看到更新
            update_map_stats(processed_count, qualified_count, blacklist_stats, whitelist_stats)
            print(f"[完成] 地图处理完成，移动到下一个格子")
        
        # 8. 移动到下一个格子（列优先：先向下，到底部后移到下一列顶部）
        current_row += 1
        if current_row >= grid_config['rows']:
            current_row = 0
            current_col += 1
                
    print(f"[完成] 地图洗练结束，共处理 {processed_count} 张地图")
    play_success_sound()
    time.sleep(2)
    is_running = False

def process_single_map(initial_result, slot_x, slot_y):
    """Purpose: 针对单个格子的地图进行状态机式洗图/鉴定/腐化/存仓。
    Inputs: initial_result(解析结果 dict)、slot_x/slot_y(像素坐标)；使用全局 map_config、apply_currency、read_and_parse。
    Outputs: 返回 bool 或 (bool, bool) -> (是否完成, 是否满足条件)；可能触发鼠标键盘操作与文件写入。
    Preconditions: 鼠标可定位到 slot 坐标；通货坐标正确；map_config 配置完备。
    Edge cases: 传奇地图直接跳过；T17 点金模式禁止；最大迭代 max_iterations 防止死循环。
    """
    
    current_result = initial_result
    iteration = 0
    max_iterations = 200 # 防止死循环
    
    while is_running and iteration < max_iterations:
        iteration += 1
        
        # 基本信息提取
        is_corrupted = current_result.get("isCorrupted", False)
        is_unmodifiable = current_result.get("isUnmodifiable", False)
        rarity = current_result.get("rarity", "普通").replace(" ", "")
        tier = int(current_result.get("mapTier", 0))
        quality = int(current_result.get("quality", 0))
        is_legendary = current_result.get("isLegendary", False)
        
        print(f"  > [状态] T{tier} {rarity} 品质:{quality}% 腐化:{is_corrupted} 传奇:{is_legendary}")

        # 0. 传奇地图跳过
        if is_legendary:
            print("  > [跳过] 传奇地图")
            return True

        if is_unmodifiable:
            print("  > [跳过] 地图不可改变，无法使用通货")
            return True

        # 0.1 T17 + 点金模式 检查
        if tier == 17 and map_config['method'] == 'alchemy':
             print("  > [错误] T17地图不能使用点金模式")
             return True # 跳过

        # 0.2 检查是否已腐化且不满足要求 (无法修改)
        # 如果是瓦尔后检查阶段，这个逻辑会在后面处理
        if is_corrupted:
            # 检查基底和词缀是否满足（先检查基底，再检查词缀）
            auto_stash = map_config.get('autoStash', True)  # 默认启用
            if check_map_base(current_result) and check_map_mods(current_result):
                if auto_stash:
                    print("  > [成功] 已腐化但满足条件，存仓")
                    stash_item(slot_x, slot_y)
                else:
                    print("  > [成功] 已腐化且满足条件，但未启用自动存仓，跳过")
                return (True, True)  # 返回 (处理完成, 满足条件)
            else:
                print("  > [跳过] 已腐化且不满足条件")
                return (True, False)  # 返回 (处理完成, 不满足条件)

        method = map_config['method'] # alchemy or chaos
        
        # 打印当前地图状态（用于调试）
        print(f"  > [地图状态] Tier: {tier}, 稀有度: {rarity}, 品质: {quality}%, 腐化: {is_corrupted}, 方法: {method}")

        # 0.5 检查是否未鉴定，如果未鉴定则先鉴定
        is_unidentified = current_result.get("isUnidentified", False)
        if is_unidentified:
            print("  > [未鉴定] 检测到未鉴定地图，使用知识卷轴鉴定")
            if not apply_currency("wisdom", slot_x, slot_y): 
                print("  > [错误] 使用知识卷轴失败")
                return False
            # 重新读取和解析物品信息
            if not read_and_parse(slot_x, slot_y): 
                print("  > [错误] 鉴定后读取物品信息失败")
                return False
            current_result = wait_for_parse_result()
            if current_result.get("error"):
                print("  > [错误] 鉴定后解析物品信息失败")
                return False
            # 更新状态
            rarity = current_result.get("rarity", "普通").replace(" ", "")
            tier = int(current_result.get("mapTier", 0))
            quality = int(current_result.get("quality", 0))
            is_corrupted = current_result.get("isCorrupted", False)
            print(f"  > [鉴定完成] 鉴定后状态: T{tier} {rarity} 品质:{quality}% 腐化:{is_corrupted}")

        # 1. 预处理 (Scouring)
        # 点金模式：魔法或稀有 -> 重铸
        if method == 'alchemy':
            if rarity in ['魔法', '稀有']:
                 # 如果是稀有且满足条件，则无需重铸 (但在点金模式下，通常假设还没洗好，或者用户希望重新洗)
                 # 但为了防止误洗已经好的图，先检查一下？
                 # 用户指示："点金模式先对地图进行预处理... 混沌模式预处理要把地图预处理成稀有品质"
                 # 如果在点金模式下，遇到一个稀有图，可能是之前洗坏的，也可能是本来就有的。
                 # 如果满足条件，直接存仓？
                 # 逻辑：
                 #   如果当前状态满足条件 -> 瓦尔 -> 存仓
                 #   如果不满足 -> 重铸
                 # 注意：预处理阶段只检查是否满足，如果满足会跳过预处理，进入后续流程
                 if check_map_base(current_result) and check_map_mods(current_result):
                     pass # 这种情况会在后面 Step 6 处理
                 else:
                     print(f"  > [预处理] 状态{rarity}且不满足条件，使用重铸石")
                     if not apply_currency("scouring", slot_x, slot_y): return False
                     if not read_and_parse(slot_x, slot_y): return False
                     current_result = wait_for_parse_result()
                     if current_result.get("error"):
                         print("  > [错误] 读取物品信息失败")
                         return False
                     continue

        # 混沌模式：魔法 -> 重铸 (因为要变成稀有，魔法不能直接变稀有，除了用富豪，但这里逻辑是重铸再点金)
        if method == 'chaos':
             if rarity == '魔法':
                 print(f"  > [预处理] 魔法物品，使用重铸石")
                 if not apply_currency("scouring", slot_x, slot_y): return False
                 if not read_and_parse(slot_x, slot_y): return False
                 current_result = wait_for_parse_result()
                 continue
        
        # 更新状态
        rarity = current_result.get("rarity", "普通").replace(" ", "")
        quality = int(current_result.get("quality", 0))

        # 2. 制作/洗练 (Rolling)
        
        if method == 'alchemy':
            # 此时应该是普通品质 (或已满足条件的稀有，但已在上面check过，如果到这里说明不满足)
            # 如果是普通 -> 点金
            if rarity == '普通':
                print("  > [操作] 使用点金石")
                if not apply_currency("alchemy", slot_x, slot_y): return False
                if not read_and_parse(slot_x, slot_y): return False
                current_result = wait_for_parse_result()
                if current_result.get("error"):
                    print("  > [错误] 读取物品信息失败")
                    return False
                # 更新状态
                rarity = current_result.get("rarity", "普通").replace(" ", "")
                continue
            # 如果是稀有且不满足(理论上在Step 1会被重铸，除非是刚点金变成稀有的)
            # 如果刚点金变成稀有，下一次循环会检查基底和词缀。
            # 如果检查不满足，Step 1 会重铸。
        
        elif method == 'chaos':
            # 普通 -> 点金
            if rarity == '普通':
                print("  > [操作] 使用点金石")
                if not apply_currency("alchemy", slot_x, slot_y): return False
                if not read_and_parse(slot_x, slot_y): return False
                current_result = wait_for_parse_result()
                if current_result.get("error"):
                    print("  > [错误] 读取物品信息失败")
                    return False
                # 更新状态
                rarity = current_result.get("rarity", "普通").replace(" ", "")
                continue
            
            # 稀有 -> 混沌
            if rarity == '稀有':
                # 先检查基底，如果基底不满足，继续洗
                if not check_map_base(current_result):
                    print("  > [操作] 基底不满足，使用混沌石")
                    if not apply_currency("chaos", slot_x, slot_y): return False
                    if not read_and_parse(slot_x, slot_y): return False
                    current_result = wait_for_parse_result()
                    if current_result.get("error"):
                        print("  > [错误] 读取物品信息失败")
                        return False
                    continue
                # 如果基底满足，继续检查词缀（在下面Step 4处理）

        # 4. 检查基底是否满足（必须先检查基底）
        if not check_map_base(current_result):
            print("  > [检查] 地图基底不满足要求，继续洗练")
            # 根据模式继续洗
            if method == 'alchemy':
                # 点金模式：如果是稀有，重铸后继续；如果是普通，先点金
                if rarity == '稀有':
                    print("  > [操作] 基底不满足，使用重铸石")
                    if not apply_currency("scouring", slot_x, slot_y): return False
                    if not read_and_parse(slot_x, slot_y): return False
                    current_result = wait_for_parse_result()
                    if current_result.get("error"):
                        print("  > [错误] 读取物品信息失败")
                        return False
                    continue
                elif rarity == '普通':
                    # 普通品质，先点金变成稀有，然后下一次循环会检查基底
                    print("  > [操作] 基底不满足，使用点金石")
                    if not apply_currency("alchemy", slot_x, slot_y): return False
                    if not read_and_parse(slot_x, slot_y): return False
                    current_result = wait_for_parse_result()
                    if current_result.get("error"):
                        print("  > [错误] 读取物品信息失败")
                        return False
                    continue
            elif method == 'chaos':
                # 混沌模式：使用混沌石继续洗
                if rarity == '稀有':
                    print("  > [操作] 基底不满足，使用混沌石")
                    if not apply_currency("chaos", slot_x, slot_y): return False
                    if not read_and_parse(slot_x, slot_y): return False
                    current_result = wait_for_parse_result()
                    if current_result.get("error"):
                        print("  > [错误] 读取物品信息失败")
                        return False
                    continue
            continue

        # 5. 检查外延词缀是否满足（基底满足后才检查词缀）
        if not check_map_mods(current_result):
            print("  > [检查] 地图词缀不满足要求，继续洗练")
            # 根据模式继续洗
            if method == 'alchemy':
                # 点金模式：如果是稀有，重铸后继续；如果是普通，先点金
                if rarity == '稀有':
                    print("  > [操作] 词缀不满足，使用重铸石")
                    if not apply_currency("scouring", slot_x, slot_y): return False
                    if not read_and_parse(slot_x, slot_y): return False
                    current_result = wait_for_parse_result()
                    if current_result.get("error"):
                        print("  > [错误] 读取物品信息失败")
                        return False
                    continue
                elif rarity == '普通':
                    # 普通品质，先点金变成稀有，然后下一次循环会检查词缀
                    print("  > [操作] 词缀不满足，使用点金石")
                    if not apply_currency("alchemy", slot_x, slot_y): return False
                    if not read_and_parse(slot_x, slot_y): return False
                    current_result = wait_for_parse_result()
                    if current_result.get("error"):
                        print("  > [错误] 读取物品信息失败")
                        return False
                    continue
            elif method == 'chaos':
                # 混沌模式：使用混沌石继续洗
                if rarity == '稀有':
                    print("  > [操作] 词缀不满足，使用混沌石")
                    if not apply_currency("chaos", slot_x, slot_y): return False
                    if not read_and_parse(slot_x, slot_y): return False
                    current_result = wait_for_parse_result()
                    if current_result.get("error"):
                        print("  > [错误] 读取物品信息失败")
                        return False
                    continue
            continue

        # 6. 基底和词缀都满足，进行后续处理
        print("  > [满足] 地图基底和词缀都符合要求")
        
        # 检查是否启用自动存仓
        auto_stash = map_config.get('autoStash', True)  # 默认启用
        
        # 7. 瓦尔宝珠逻辑
        if map_config['vaal']['enabled']:
            print("  > [操作] 使用瓦尔宝珠")
            if not apply_currency("vaal", slot_x, slot_y): return False
            
            # 瓦尔后需要重新读取
            if not read_and_parse(slot_x, slot_y): return False
            current_result = wait_for_parse_result()
            if current_result.get("error"):
                print("  > [错误] 读取物品信息失败")
                return False
            
            # 瓦尔后检查是否符合条件（先检查基底，再检查词缀）
            vaal_base_ok = check_map_base(current_result)
            vaal_mods_ok = check_map_mods(current_result)
            
            if vaal_base_ok and vaal_mods_ok:
                print("  > [检查] 瓦尔后仍满足条件")
                if auto_stash:
                    print("  > [成功] 存仓")
                    stash_item(slot_x, slot_y)
                else:
                    print("  > [完成] 未启用自动存仓，不存仓")
                return (True, True)  # 返回 (处理完成, 满足条件)
            else:
                if not vaal_base_ok:
                    print("  > [检查] 瓦尔后基底不满足条件，跳过")
                else:
                    print("  > [检查] 瓦尔后词缀不满足条件，跳过")
                return (True, False)  # 返回 (处理完成, 不满足条件)
        else:
            # 不瓦尔，直接存仓（如果启用自动存仓）
            if auto_stash:
                print("  > [成功] 制作完成，存仓")
                stash_item(slot_x, slot_y)
            else:
                print("  > [成功] 制作完成，但未启用自动存仓，跳过")
            return (True, True)  # 返回 (处理完成, 满足条件)
            
    return (True, False)  # 返回 (处理完成, 不满足条件)

def read_and_parse(x, y):
    # 辅助函数：移动鼠标，复制，等待解析
    if not move_mouse(x, y): return False
    # time.sleep(0.05)
    return read_clipboard_to_file()

def check_map_base(item_data):
    """Purpose: 使用统一六项配置校验地图基底。
    Inputs: item_data(解析结果); 依赖 map_config.match 的 mandatoryStats/optionalStats。
    Outputs: bool -> 是否通过；同时打印调试信息。
    Edge cases: 缺失属性按零处理；必选与挑选冲突时取较大值且不重复计数。
    """
    match_config = map_config['match']
    valid_keys = ('quantity', 'rarity', 'packSize', 'moreMaps', 'moreScarabs', 'moreCurrency')
    mandatory = {
        key: dict(value) for key, value in match_config.get('mandatoryStats', {}).items()
        if key in valid_keys
    }
    optional = {
        key: dict(value) for key, value in match_config.get('optionalStats', {}).items()
        if key in valid_keys
    }
    
    # 解决冲突：如果必选和挑选有相同key，取最大值作为必选，并从挑选移除
    conflict_keys = set(mandatory.keys()) & set(optional.keys())
    for key in conflict_keys:
        if mandatory[key].get('enabled') and optional[key].get('enabled'):
            val_m = mandatory[key].get('value', 0)
            val_o = optional[key].get('value', 0)
            final_val = max(val_m, val_o)
            mandatory[key]['value'] = final_val
            # 禁用optional中的该项，避免重复计算
            optional[key]['enabled'] = False
            
    for key, config in mandatory.items():
        if not config.get('enabled'):
            continue
        target_val = config.get('value', 0)
        current_val = get_stat_value(item_data, key)
        print(f"  > [基底检查] {key}: 当前值={current_val}, 要求值={target_val}, enabled={config.get('enabled')}")
        if current_val < target_val:
            print(f"  > [基底检查] {key} 不满足要求")
            return False
                
    # 检查挑选基底
    selected_count = match_config.get('selectedCount', 1)
    match_count = 0
    
    active_options = [k for k, v in optional.items() if v.get('enabled')]
    
    if active_options:
        for key in active_options:
            config = optional[key]
            # 再次确认enabled状态（虽然active_options已经过滤了，但为了安全）
            if not config.get('enabled'):
                continue
            target_val = config.get('value', 0)
            current_val = get_stat_value(item_data, key)
            print(f"  > [基底检查] {key}: 当前值={current_val}, 要求值={target_val}, enabled={config.get('enabled')}")
            if current_val >= target_val:
                match_count += 1
                print(f"  > [基底检查] {key} 满足要求 (已匹配: {match_count}/{selected_count})")
        
        if match_count < selected_count:
            print(f"  > [基底检查] 挑选基底不满足要求 (已匹配: {match_count}/{selected_count})")
            return False
            
    return True

def check_map_mods(item_data):
    """Purpose: 基于黑白名单校验地图词缀。
    Inputs: item_data.explicitMods；map_config.match.blacklist / whitelist。
    Outputs: bool -> 是否通过；命中白名单时提前通过。
    Edge cases: 黑名单命中立即失败；白名单为空则默认通过；日志仅保留必要输出。
    """
    match_config = map_config['match']
    explicit_mods = item_data.get('explicitMods', [])
    
    # 1. 检查黑名单 (Blacklist)
    blacklist = match_config.get('blacklist', [])
    for mod in explicit_mods:
        for black_term in blacklist:
            if black_term and black_term in mod:
                # print(f"  > [匹配] 发现黑名单词缀: {mod}")
                return False
                
    # 2. 检查白名单 (Whitelist) - 优先级最高
    whitelist = match_config.get('whitelist', [])
    if whitelist:
        for mod in explicit_mods:
            for white_term in whitelist:
                if white_term and white_term in mod:
                    print(f"  > [匹配] 命中白名单词缀: {mod}")
                    return True
                    
    return True

def count_affix_stats(item_data):
    # 统计黑白名单词缀出现次数
    match_config = map_config['match']
    explicit_mods = item_data.get('explicitMods', [])
    
    blacklist_stats = {}
    whitelist_stats = {}
    
    # 统计黑名单词缀拦截次数
    blacklist = match_config.get('blacklist', [])
    for mod in explicit_mods:
        for black_term in blacklist:
            if black_term and black_term in mod:
                blacklist_stats[black_term] = blacklist_stats.get(black_term, 0) + 1
                break  # 每个词缀只统计一次
    
    # 统计白名单词缀通过次数
    whitelist = match_config.get('whitelist', [])
    if whitelist:
        for mod in explicit_mods:
            for white_term in whitelist:
                if white_term and white_term in mod:
                    whitelist_stats[white_term] = whitelist_stats.get(white_term, 0) + 1
                    break  # 每个词缀只统计一次
    
    return blacklist_stats, whitelist_stats

def check_map_requirements(item_data):
    # 检查地图是否满足配置要求
    # 先检查基底，再检查词缀
    if not check_map_base(item_data):
        return False
    if not check_map_mods(item_data):
        return False
    return True

def get_stat_value(item_data, key):
    # 从item_data中提取属性值
    # key映射: quantity -> itemQuantity, rarity -> itemRarity, packSize -> monsterPackSize
    val = 0
    # 尝试直接从顶层属性获取 (解析器可能已经解析好)
    if key in item_data and isinstance(item_data[key], (int, float)):
        return int(item_data[key])
        
    if key == 'quantity':
        val = int(item_data.get('itemQuantity', 0))
        # 兼容旧的解析字段名
        if val == 0: val = int(item_data.get('quantity', 0))
    elif key == 'rarity':
        val = int(item_data.get('itemRarity', 0))
        if val == 0: val = int(item_data.get('rarity_val', 0)) # rarity通常是字符串，但也可能解析了数值
    elif key == 'packSize':
        val = int(item_data.get('monsterPackSize', 0))
        if val == 0: val = int(item_data.get('packSize', 0))
    elif key == 'moreMaps':
        # 优先从顶层属性获取（解析器已解析）
        val = int(item_data.get('moreMaps', 0))
        print(f"  > [属性提取] moreMaps: 从item_data获取={val}")
        # 如果顶层没有，尝试从词缀中提取（备用方案）
        if val == 0:
            mods = item_data.get('implicitMods', []) + item_data.get('explicitMods', [])
            print(f"  > [属性提取] moreMaps: 尝试从词缀提取，词缀数量={len(mods)}")
            for mod in mods:
                if '地图' in mod and '掉落' in mod:
                    extracted = extract_number(mod)
                    val = max(val, extracted)
                    print(f"  > [属性提取] moreMaps: 从词缀'{mod}'提取={extracted}")
        print(f"  > [属性提取] moreMaps: 最终值={val}")
    elif key == 'moreScarabs':
        val = int(item_data.get('moreScarabs', 0))
        print(f"  > [属性提取] moreScarabs: 从item_data获取={val}")
        if val == 0:
            mods = item_data.get('implicitMods', []) + item_data.get('explicitMods', [])
            for mod in mods:
                if '圣甲虫' in mod:
                    extracted = extract_number(mod)
                    val = max(val, extracted)
                    if extracted > 0:
                        print(f"  > [属性提取] moreScarabs: 从词缀'{mod}'提取={extracted}")
        print(f"  > [属性提取] moreScarabs: 最终值={val}")
    elif key == 'moreCurrency':
        val = int(item_data.get('moreCurrency', 0))
        print(f"  > [属性提取] moreCurrency: 从item_data获取={val}")
        if val == 0:
            mods = item_data.get('implicitMods', []) + item_data.get('explicitMods', [])
            for mod in mods:
                if '通货' in mod:
                    extracted = extract_number(mod)
                    val = max(val, extracted)
                    if extracted > 0:
                        print(f"  > [属性提取] moreCurrency: 从词缀'{mod}'提取={extracted}")
        print(f"  > [属性提取] moreCurrency: 最终值={val}")
                
    return val

def extract_number(text):
    import re
    nums = re.findall(r'\d+', text)
    if nums:
        return int(nums[0])
    return 0

if __name__ == "__main__":
    try:
        sys.stdout.flush()
        sys.stderr.flush()
        print("[启动] 准备调用start_map_rolling()...")
        start_map_rolling()
        release_shift_if_held()
        print("[完成] 脚本执行结束")
    except KeyboardInterrupt:
        print("\n[停止] 用户中断")
        is_running = False
        release_shift_if_held()
        sys.exit(0)
    except Exception as e:
        print(f"\n[错误] 执行出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
