#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""国服商城配方取件：按计划坐标复制、Ctrl+点击并比较原位复制文本。"""

import argparse
import ctypes
import json
import math
import os
import signal
import sys
import time
import traceback


def enable_dpi_awareness():
    if sys.platform != "win32":
        return
    try:
        ctypes.windll.user32.SetProcessDpiAwarenessContext(ctypes.c_void_p(-4))
    except Exception:
        try:
            ctypes.windll.shcore.SetProcessDpiAwareness(2)
        except Exception:
            pass


enable_dpi_awareness()
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

try:
    import pyperclip
    from pynput import keyboard, mouse
    from pynput.keyboard import Key
    from pynput.mouse import Button
    DEPENDENCY_ERROR = ""
except ImportError as exc:
    pyperclip = keyboard = mouse = Key = Button = None
    DEPENDENCY_ERROR = str(exc)

GAME_WINDOW_TITLES = ("流放之路", "Path of Exile")
_game_window_titles_cache = GAME_WINDOW_TITLES
_game_window_titles_mtime_ns = None
TRANSFER_ATTEMPTS = 2
RUNNING = True
CONTROLLER = None


class GameNotForegroundError(RuntimeError):
    pass


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


def emit(event, **payload):
    print("EVENT " + json.dumps({"event": event, **payload}, ensure_ascii=False), flush=True)


def stop_handler(_signum, _frame):
    global RUNNING
    RUNNING = False
    if CONTROLLER:
        CONTROLLER.release_all()


signal.signal(signal.SIGINT, stop_handler)
signal.signal(signal.SIGTERM, stop_handler)


def is_game_foreground():
    if sys.platform != "win32":
        return False
    user32 = ctypes.windll.user32
    hwnd = user32.GetForegroundWindow()
    length = user32.GetWindowTextLengthW(hwnd)
    buffer = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buffer, length + 1)
    return game_window_title_priority(buffer.value) >= 0


def find_game_window():
    if sys.platform != "win32":
        return 0
    user32 = ctypes.windll.user32
    matches = []
    callback_type = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)

    def visit(hwnd, _lparam):
        if not user32.IsWindowVisible(hwnd):
            return True
        length = user32.GetWindowTextLengthW(hwnd)
        if length <= 0:
            return True
        buffer = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(hwnd, buffer, length + 1)
        priority = game_window_title_priority(buffer.value)
        if priority >= 0:
            matches.append((priority, hwnd))
        return True

    user32.EnumWindows(callback_type(visit), 0)
    matches.sort(key=lambda entry: entry[0])
    return matches[0][1] if matches else 0


def restore_game_window_if_minimized(user32, hwnd):
    if user32.IsIconic(hwnd):
        user32.ShowWindow(hwnd, 9)  # SW_RESTORE


def focus_game_window(timeout_seconds=2.0):
    if is_game_foreground():
        return True
    if sys.platform != "win32":
        return False
    user32 = ctypes.windll.user32
    kernel32 = ctypes.windll.kernel32
    hwnd = find_game_window()
    if not hwnd:
        return False
    foreground = user32.GetForegroundWindow()
    current_thread = kernel32.GetCurrentThreadId()
    foreground_thread = user32.GetWindowThreadProcessId(foreground, None) if foreground else 0
    target_thread = user32.GetWindowThreadProcessId(hwnd, None)
    attached_foreground = bool(
        foreground_thread and foreground_thread != current_thread and
        user32.AttachThreadInput(current_thread, foreground_thread, True)
    )
    attached_target = bool(
        target_thread and target_thread != current_thread and target_thread != foreground_thread and
        user32.AttachThreadInput(current_thread, target_thread, True)
    )
    try:
        restore_game_window_if_minimized(user32, hwnd)
        user32.BringWindowToTop(hwnd)
        user32.SetForegroundWindow(hwnd)
        user32.SetFocus(hwnd)
    finally:
        if attached_target:
            user32.AttachThreadInput(current_thread, target_thread, False)
        if attached_foreground:
            user32.AttachThreadInput(current_thread, foreground_thread, False)
    deadline = time.monotonic() + max(0.2, float(timeout_seconds))
    while RUNNING and time.monotonic() < deadline:
        if is_game_foreground():
            return True
        time.sleep(0.05)
    return False


def require_game_foreground():
    if not is_game_foreground():
        raise GameNotForegroundError("游戏窗口运行中失去前台")


class InputController:
    def __init__(self, delay_ms):
        try:
            delay = float(delay_ms)
        except (TypeError, ValueError):
            delay = 80
        if not math.isfinite(delay):
            delay = 80
        self.delay = max(0.02, min(0.5, delay / 1000))
        self.mouse = mouse.Controller()
        self.keyboard = keyboard.Controller()

    def release_all(self):
        for key in (Key.ctrl, Key.alt, Key.shift):
            try:
                self.keyboard.release(key)
            except Exception:
                pass
        try:
            self.mouse.release(Button.left)
        except Exception:
            pass

    def move(self, x, y):
        require_game_foreground()
        if sys.platform == "win32":
            if not ctypes.windll.user32.SetCursorPos(int(x), int(y)):
                return False
        else:
            self.mouse.position = (int(x), int(y))
        time.sleep(self.delay)
        return True

    def copy_item(self):
        require_game_foreground()
        try:
            pyperclip.copy("")
        except Exception:
            return ""
        require_game_foreground()
        self.keyboard.press(Key.ctrl)
        require_game_foreground()
        self.keyboard.press("c")
        self.keyboard.release("c")
        self.keyboard.release(Key.ctrl)
        deadline = time.monotonic() + max(0.25, self.delay * 4)
        while RUNNING and time.monotonic() < deadline:
            try:
                require_game_foreground()
                text = str(pyperclip.paste() or "").strip()
            except Exception:
                return ""
            if text:
                return text
            time.sleep(0.01)
        return ""

    def ctrl_click(self):
        require_game_foreground()
        self.keyboard.press(Key.ctrl)
        require_game_foreground()
        self.mouse.press(Button.left)
        self.mouse.release(Button.left)
        self.keyboard.release(Key.ctrl)
        time.sleep(self.delay)


def transfer_item(controller):
    before = controller.copy_item()
    if not before:
        return False, ("ITEM_MISMATCH", "目标位置没有可复制的物品")
    for _attempt in range(TRANSFER_ATTEMPTS):
        if not RUNNING:
            return False, ("USER_STOPPED", "用户停止")
        controller.ctrl_click()
        after = controller.copy_item()
        if after != before:
            return True, None
    return False, ("INVENTORY_FULL", "背包空间不足，请清空背包后继续")


def run(config):
    global CONTROLLER
    CONTROLLER = InputController(config.get("operation_delay_ms", 80))
    try:
        if not focus_game_window():
            emit("aborted", code="GAME_NOT_FOREGROUND", reason="未找到或无法激活游戏窗口")
            return 1
        for index, expected in enumerate(config.get("items", [])):
            if not RUNNING:
                emit("aborted", code="USER_STOPPED", reason="用户停止", index=index)
                return 1
            screen = expected.get("screen", {})
            if not CONTROLLER.move(screen.get("clickX", 0), screen.get("clickY", 0)):
                emit("aborted", code="ITEM_MISMATCH", reason="无法移动到目标物品", index=index)
                return 1
            transferred, error = transfer_item(CONTROLLER)
            if not transferred:
                emit("aborted", code=error[0], reason=error[1], index=index)
                return 2 if error[0] == "INVENTORY_FULL" else 1
            emit("item-picked", index=index, itemId=expected.get("id"), setId=expected.get("setId"))
        emit("completed")
        return 0
    except GameNotForegroundError as error:
        emit("aborted", code="GAME_NOT_FOREGROUND", reason=str(error))
        return 1
    finally:
        CONTROLLER.release_all()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    args = parser.parse_args()
    if DEPENDENCY_ERROR:
        emit("error", code="DEPENDENCY_MISSING", reason=f"Python 依赖缺失: {DEPENDENCY_ERROR}")
        return 2
    try:
        with open(args.config, "r", encoding="utf-8") as source:
            return run(json.load(source))
    except Exception as exc:
        emit("error", code="SCRIPT_ERROR", reason=str(exc))
        print(traceback.format_exc(), file=sys.stderr, flush=True)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
