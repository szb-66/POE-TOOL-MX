#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Purpose: 背包自动入库脚本，包含模板匹配检测和自动入库功能
# Inputs: 模板图片路径、匹配区域、仓库配置等参数
# Outputs: 控制鼠标键盘完成入库操作，输出日志；支持实时检测界面状态
# Preconditions: 游戏窗口在前台；依赖包已安装；模板图片存在
# Edge cases: 模板匹配失败时自动重试；操作失败时跳过当前格子；支持中断
# Errors: 截图失败时重试；鼠标键盘操作失败时记录错误但继续执行
# 生成时间: {{GEN_DATE}}

# 立即输出启动信息（在任何导入之前）
print("=" * 60)
print("[启动] 背包自动入库脚本开始执行")
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
    import threading
    import argparse
    import traceback
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
    import cv2
    import mss
    import numpy as np
    print("[启动] OpenCV和mss模块导入成功")
except ImportError as e:
    print(f"[错误] OpenCV或mss模块导入失败: {e}")
    print("[提示] 请运行: pip install opencv-python mss numpy")
    sys.exit(1)

# Windows API鼠标控制（用于解决DPI缩放问题）
use_windows_api = False
dpi_scale = 1.0
try:
    if sys.platform == 'win32':
        import ctypes
        from ctypes import wintypes

        # Windows API函数
        user32 = ctypes.windll.user32
        kernel32 = ctypes.windll.kernel32

        class POINT(ctypes.Structure):
            _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]

        class MSLLHOOKSTRUCT(ctypes.Structure):
            _fields_ = [("pt", POINT),
                       ("mouseData", ctypes.c_ulong),
                       ("flags", ctypes.c_ulong),
                       ("time", ctypes.c_ulong),
                       ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong))]

        # 获取DPI缩放比例
        def get_dpi_scale():
            try:
                hdc = user32.GetDC(0)
                dpi_x = ctypes.c_int()
                dpi_y = ctypes.c_int()
                ctypes.windll.gdi32.GetDeviceCaps(hdc, 88, ctypes.byref(dpi_x))  # LOGPIXELSX
                ctypes.windll.gdi32.GetDeviceCaps(hdc, 90, ctypes.byref(dpi_y))  # LOGPIXELSY
                user32.ReleaseDC(0, hdc)

                scale_x = dpi_x.value / 96.0
                scale_y = dpi_y.value / 96.0
                return (scale_x + scale_y) / 2.0
            except:
                return 1.0

        dpi_scale = get_dpi_scale()
        use_windows_api = True
        print(f"[启动] Windows API鼠标控制已启用，DPI缩放: {dpi_scale}")
except ImportError:
    print("[警告] 无法导入ctypes模块，Windows API鼠标控制不可用")

print("[启动] 所有依赖包导入成功")
sys.stdout.flush()

# 全局变量
is_running = True
detection_thread = None
stash_thread = None

# 默认配置（会被命令行参数覆盖）
default_config = {
    'templates': {
        'stash_title': '',
        'stash_region': {
            'left': 0,
            'top': 0,
            'right': 1920,
            'bottom': 1080
        }
    },
    'match_threshold': 0.8,
    'button_position': {'x': 3600, 'y': 1000}
}

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

def signal_handler(signum, frame):
    """信号处理器"""
    global is_running
    print(f"[停止] 收到信号 {signum}")
    is_running = False

# 注册信号处理器
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# Windows API鼠标控制函数
def move_mouse_windows_api(x, y):
    """使用Windows API按物理屏幕像素移动鼠标"""
    try:
        user32.SetCursorPos(int(x), int(y))
        return True
    except Exception as e:
        print(f"[错误] Windows API鼠标移动失败: {e}")
        return False

def click_mouse_windows_api(button='left'):
    """使用Windows API点击鼠标"""
    try:
        if button == 'left':
            user32.mouse_event(0x0002, 0, 0, 0, 0)  # MOUSEEVENTF_LEFTDOWN
            time.sleep(0.02)
            user32.mouse_event(0x0004, 0, 0, 0, 0)  # MOUSEEVENTF_LEFTUP
        elif button == 'right':
            user32.mouse_event(0x0008, 0, 0, 0, 0)  # MOUSEEVENTF_RIGHTDOWN
            time.sleep(0.02)
            user32.mouse_event(0x0010, 0, 0, 0, 0)  # MOUSEEVENTF_RIGHTUP
        return True
    except Exception as e:
        print(f"[错误] Windows API鼠标点击失败: {e}")
        return False

class MouseController:
    """鼠标控制器"""
    def __init__(self):
        self.controller = mouse.Controller()

    def move_mouse(self, x, y):
        """移动鼠标到指定位置"""
        try:
            if use_windows_api:
                return move_mouse_windows_api(x, y)
            else:
                self.controller.position = (int(x / dpi_scale), int(y / dpi_scale))
                time.sleep(0.05)  # 鼠标移动延迟
                return True
        except Exception as e:
            print(f"[错误] 鼠标移动失败: {e}")
            return False

    def click_mouse(self, button=Button.left):
        """点击鼠标"""
        try:
            if use_windows_api and button == Button.left:
                return click_mouse_windows_api('left')
            elif use_windows_api and button == Button.right:
                return click_mouse_windows_api('right')
            else:
                self.controller.press(button)
                time.sleep(0.02)  # 点击延迟
                self.controller.release(button)
                time.sleep(0.02)
                return True
        except Exception as e:
            print(f"[错误] 鼠标点击失败: {e}")
            return False

class KeyboardController:
    """键盘控制器"""
    def __init__(self):
        self.controller = keyboard.Controller()

    def press_key(self, key):
        """按下按键"""
        try:
            self.controller.press(key)
            time.sleep(0.02)
            return True
        except Exception as e:
            print(f"[错误] 按键按下失败: {e}")
            return False

    def release_key(self, key):
        """释放按键"""
        try:
            self.controller.release(key)
            time.sleep(0.02)
            return True
        except Exception as e:
            print(f"[错误] 按键释放失败: {e}")
            return False

class TemplateMatcher:
    """模板匹配器"""
    def __init__(self, config):
        self.config = config
        self.templates = {}
        self.load_templates()

    def load_templates(self):
        """加载模板图片"""
        try:
            stash_path = self.config['templates']['stash_title']
            # inventory_path = self.config['templates']['inventory_title']

            if os.path.exists(stash_path):
                self.templates['stash'] = cv2.imread(stash_path, cv2.IMREAD_COLOR)
                print(f"[模板] 仓库标题模板已加载: {stash_path}")
                print(f"[模板] 模板尺寸: {self.templates['stash'].shape}")
            else:
                print(f"[错误] 仓库标题模板不存在: {stash_path}")

        except Exception as e:
            print(f"[错误] 加载模板失败: {e}")

    def capture_screen_region(self, region):
        """截取指定区域的屏幕"""
        try:
            with mss.mss() as sct:
                # 计算区域尺寸
                width = region['right'] - region['left']
                height = region['bottom'] - region['top']
                
                print(f"[调试] 截图区域: left={region['left']}, top={region['top']}, width={width}, height={height}")

                monitor = {
                    "top": region['top'],
                    "left": region['left'],
                    "width": width,
                    "height": height
                }
                screenshot = sct.grab(monitor)
                
                if screenshot is None:
                    print("[错误] 截图失败: sct.grab 返回 None")
                    return None
                
                # 转换为OpenCV格式
                img = np.array(screenshot)
                img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
                
                print(f"[调试] 截图成功: 尺寸={img.shape}")
                return img
        except Exception as e:
            print(f"[错误] 截图失败: {e}")
            return None

    def match_template(self, image, template):
        """模板匹配"""
        try:
            # 检查输入图像和模板的尺寸
            if image is None or template is None:
                print("[错误] 图像或模板为空")
                return False, None, 0
            
            if image.size == 0 or template.size == 0:
                print("[错误] 图像或模板尺寸为0")
                return False, None, 0
            
            # 确保模板不大于图像
            if template.shape[0] > image.shape[0] or template.shape[1] > image.shape[1]:
                print(f"[错误] 模板尺寸 {template.shape} 大于图像尺寸 {image.shape}")
                return False, None, 0
            
            result = cv2.matchTemplate(image, template, cv2.TM_CCOEFF_NORMED)
            
            # 确保结果是二维数组
            if len(result.shape) != 2:
                print(f"[错误] matchTemplate 返回了 {len(result.shape)} 维数组，期望2维")
                return False, None, 0
            
            min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)

            threshold = self.config.get('match_threshold', 0.8)
            if max_val >= threshold:
                return True, max_loc, max_val
            return False, None, max_val
        except Exception as e:
            print(f"[错误] 模板匹配失败: {e}")
            print(traceback.format_exc())
            return False, None, 0

    def check_interface(self):
        """检查界面状态"""
        try:
            # 检查仓库标题
            stash_matched = False
            if 'stash' in self.templates and self.config['templates']['stash_region']:
                stash_region = self.config['templates']['stash_region']
                stash_screen = self.capture_screen_region(stash_region)
                if stash_screen is not None:
                    stash_result = self.match_template(stash_screen, self.templates['stash'])
                    raw_stash_matched, _, stash_val = stash_result
                    # 防御性转换，避免 NumPy 数组触发布尔歧义
                    if isinstance(raw_stash_matched, np.ndarray):
                        stash_matched = bool(np.any(raw_stash_matched))
                    else:
                        stash_matched = bool(raw_stash_matched)
                    print(f"[调试] 仓库匹配结果: {stash_result}, 类型: {type(stash_result)}")
                    # print(f"[调试] 仓库模板匹配值: {stash_val:.3f}")

            return bool(stash_matched)

        except Exception as e:
            print(f"[错误] 界面检测失败: {e}")
            print(traceback.format_exc())
            return False

class StashController:
    """自动入库控制器"""
    def __init__(self, config):
        self.config = config
        self.mouse = MouseController()
        self.keyboard = KeyboardController()

    def ctrl_click(self, x, y):
        """执行 Ctrl+左键 点击"""
        try:
            # 移动到位置
            if not self.mouse.move_mouse(x, y):
                return False

            # 按住 Ctrl
            if not self.keyboard.press_key(Key.ctrl):
                return False

            time.sleep(0.02)

            # 左键点击
            if not self.mouse.click_mouse(Button.left):
                self.keyboard.release_key(Key.ctrl)  # 确保释放按键
                return False

            time.sleep(0.02)

            # 松开 Ctrl
            if not self.keyboard.release_key(Key.ctrl):
                return False

            return True
        except Exception as e:
            print(f"[错误] Ctrl+左键操作失败: {e}")
            # 确保释放按键
            try:
                self.keyboard.release_key(Key.ctrl)
            except:
                pass
            return False

    def stash_items(self, inventory_config):
        """执行自动入库"""
        print("[开始] 自动入库流程")

        # 背包配置：12列 x 5行 = 60格，从设置页面获取
        cols = 12
        rows = 5
        total_slots = cols * rows

        start_x = inventory_config['startPos']['x']
        start_y = inventory_config['startPos']['y']
        slot_width = inventory_config['slotSize']['w']
        slot_height = inventory_config['slotSize']['h']

        completed_count = 0

        # 按列处理：从左到右，每列从上到下
        for col in range(cols):
            for row in range(rows):
                if not is_running:
                    print("[停止] 入库被用户中断")
                    return

                # 计算格子中心坐标
                x = start_x + col * slot_width + slot_width // 2
                y = start_y + row * slot_height + slot_height // 2

                slot_index = col * rows + row + 1

                print(f"[入库] 处理第 {slot_index}/{total_slots} 格: ({x}, {y})")

                # 执行 Ctrl+左键
                if not self.ctrl_click(x, y):
                    print(f"[错误] 第 {slot_index} 格入库失败，跳过")
                    continue

                completed_count += 1

                # 发送进度
                progress = int((completed_count / total_slots) * 100)
                print(f"PROGRESS:{progress}")

                # 短暂延迟，避免操作过快
                time.sleep(0.05)

        print("STASH_COMPLETED")
        print("[完成] 自动入库流程结束")
        play_success_sound()

def detection_worker(matcher):
    """模板匹配检测工作线程"""
    print("[开始] 模板匹配检测")

    if not matcher.templates.get('stash'):
        print("[错误] 模板加载失败，无法开始检测")
        return

    last_match_result = False

    while is_running:
        try:
            # 检测界面
            current_match_result = matcher.check_interface()

            # 状态发生变化时才输出
            if current_match_result != last_match_result:
                if current_match_result:
                    print("MATCH_SUCCESS")
                else:
                    print("MATCH_FAILED")
                last_match_result = current_match_result

            time.sleep(0.2)  # 检测间隔

        except Exception as e:
            print(f"[错误] 检测线程异常: {e}")
            print(traceback.format_exc())
            time.sleep(1)

    print("[结束] 模板匹配检测")

def stash_worker(controller, inventory_config):
    """自动入库工作线程"""
    try:
        controller.stash_items(inventory_config)
    except Exception as e:
        print(f"[错误] 入库线程异常: {e}")

def main():
    """主函数"""
    global detection_thread, stash_thread

    # 解析命令行参数
    parser = argparse.ArgumentParser(description='背包自动入库脚本')
    parser.add_argument('--config', type=str, help='配置文件路径')
    parser.add_argument('--mode', choices=['detect', 'stash'], default='detect',
                       help='运行模式: detect(检测) 或 stash(入库)')

    args = parser.parse_args()

    # 加载配置
    config = default_config.copy()

    if args.config and os.path.exists(args.config):
        try:
            with open(args.config, 'r', encoding='utf-8') as f:
                file_config = json.load(f)
                # 深度合并配置
                def merge_config(target, source):
                    for key, value in source.items():
                        if isinstance(value, dict) and key in target and isinstance(target[key], dict):
                            merge_config(target[key], value)
                        else:
                            target[key] = value
                merge_config(config, file_config)
        except Exception as e:
            print(f"[警告] 加载配置文件失败: {e}")

    print(f"[配置] 运行模式: {args.mode}")
    print(f"[配置] 匹配阈值: {config.get('match_threshold', 0.8)}")
    if 'templates' in config:
        print(f"[配置] 模板配置已加载")

    if args.mode == 'detect':
        # 检测模式
        matcher = TemplateMatcher(config)
        detection_thread = threading.Thread(target=detection_worker, args=(matcher,))
        detection_thread.daemon = True
        detection_thread.start()

        # 等待线程结束
        try:
            while is_running and detection_thread.is_alive():
                time.sleep(0.1)
        except KeyboardInterrupt:
            print("[停止] 用户中断检测")

    elif args.mode == 'stash':
        # 入库模式
        controller = StashController(config)
        inventory_config = config.get('inventory', {
            'startPos': {'x': 2658, 'y': 1199},
            'slotSize': {'w': 100, 'h': 100}
        })
        stash_thread = threading.Thread(target=stash_worker, args=(controller, inventory_config))
        stash_thread.daemon = True
        stash_thread.start()

        # 等待线程结束
        try:
            while is_running and stash_thread.is_alive():
                time.sleep(0.1)
        except KeyboardInterrupt:
            print("[停止] 用户中断入库")

    print("[结束] 脚本执行完成")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("[停止] 用户中断")
    except Exception as e:
        print(f"[错误] 脚本异常: {e}")
        import traceback
        traceback.print_exc()
    finally:
        is_running = False
        print("[结束] 背包自动入库脚本退出")
