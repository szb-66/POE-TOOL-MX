#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""国服混沌配方取件：逐件验证前台、界面和剪贴板身份后 Ctrl+点击。"""

import argparse
import ctypes
import io
import json
import math
import os
import re
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
    import cv2
    import mss
    import numpy as np
    import pyperclip
    from pynput import keyboard, mouse
    from pynput.keyboard import Key
    from pynput.mouse import Button
    DEPENDENCY_ERROR = ""
except ImportError as exc:
    cv2 = mss = np = pyperclip = keyboard = mouse = Key = Button = None
    DEPENDENCY_ERROR = str(exc)

GAME_WINDOW_TITLES = ("流放之路", "Path of Exile")
RUNNING = True
CONTROLLER = None


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
    return any(title.casefold() in buffer.value.casefold() for title in GAME_WINDOW_TITLES)


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
        if any(title.casefold() in buffer.value.casefold() for title in GAME_WINDOW_TITLES):
            matches.append(hwnd)
        return True

    user32.EnumWindows(callback_type(visit), 0)
    return matches[0] if matches else 0


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


def clipboard_sequence():
    try:
        return int(ctypes.windll.user32.GetClipboardSequenceNumber())
    except Exception:
        return None


def load_gray(path):
    try:
        encoded = np.fromfile(path, dtype=np.uint8)
        return cv2.imdecode(encoded, cv2.IMREAD_GRAYSCALE) if encoded.size else None
    except Exception:
        return None


class InterfaceMatcher:
    def __init__(self, config):
        self.threshold = float(config.get("match_threshold", 0.8))
        raw = config.get("templates", {})
        self.regions = {
            "stash": raw.get("stashRegion") or raw.get("stash_region") or {},
            "inventory": raw.get("inventoryRegion") or raw.get("inventory_region") or {}
        }
        paths = {
            "stash": raw.get("stashTitle") or raw.get("stash_title") or "",
            "inventory": raw.get("inventoryTitle") or raw.get("inventory_title") or ""
        }
        self.templates = {key: load_gray(value) for key, value in paths.items() if value and os.path.exists(value)}

    @property
    def valid(self):
        return all(key in self.templates and self.templates[key] is not None for key in ("stash", "inventory"))

    def match_one(self, key):
        region = self.regions[key]
        width = int(region.get("right", 0)) - int(region.get("left", 0))
        height = int(region.get("bottom", 0)) - int(region.get("top", 0))
        if width <= 0 or height <= 0:
            return False
        with mss.mss() as screen:
            shot = screen.grab({
                "left": int(region.get("left", 0)),
                "top": int(region.get("top", 0)),
                "width": width,
                "height": height
            })
        image = cv2.cvtColor(np.array(shot), cv2.COLOR_BGRA2GRAY)
        template = self.templates[key]
        if template.shape[0] > image.shape[0] or template.shape[1] > image.shape[1]:
            return False
        score = float(cv2.minMaxLoc(cv2.matchTemplate(image, template, cv2.TM_CCOEFF_NORMED))[1])
        return score >= self.threshold

    def ready(self):
        return self.valid and self.match_one("stash") and self.match_one("inventory")


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
        if sys.platform == "win32":
            if not ctypes.windll.user32.SetCursorPos(int(x), int(y)):
                return False
        else:
            self.mouse.position = (int(x), int(y))
        time.sleep(self.delay)
        return True

    def copy_item(self):
        before_seq = clipboard_sequence()
        before_text = str(pyperclip.paste() or "")
        self.keyboard.press(Key.ctrl)
        self.keyboard.press("c")
        self.keyboard.release("c")
        self.keyboard.release(Key.ctrl)
        deadline = time.monotonic() + max(0.15, self.delay * 2)
        while RUNNING and time.monotonic() < deadline:
            current_seq = clipboard_sequence()
            text = str(pyperclip.paste() or "")
            changed = current_seq != before_seq if current_seq is not None and before_seq is not None else text != before_text
            if changed and text.strip():
                return text
            time.sleep(0.01)
        return ""

    def ctrl_click(self):
        self.keyboard.press(Key.ctrl)
        self.mouse.press(Button.left)
        self.mouse.release(Button.left)
        self.keyboard.release(Key.ctrl)
        time.sleep(self.delay)


def parse_item(text):
    lines = [line.strip() for line in str(text or "").splitlines() if line.strip()]
    rarity = ""
    item_level = None
    header = []
    rarity_index = -1
    sockets = ""
    for index, line in enumerate(lines):
        compact = line.replace(" ", "")
        if compact.startswith("稀有度:") or line.startswith("Rarity:"):
            rarity = line.split(":", 1)[1].strip()
            rarity_index = index
        if compact.startswith("物品等级:") or line.startswith("Item Level:"):
            try:
                item_level = int(line.split(":", 1)[1].strip())
            except ValueError:
                pass
        if compact.startswith("插槽:") or line.startswith("Sockets:"):
            value = line.split(":", 1)[1].upper()
            sockets = " ".join(re.findall(r"[RGBW](?:-[RGBW])*", value))
    if rarity_index >= 0:
        for line in lines[rarity_index + 1:]:
            if line == "--------":
                break
            if ":" not in line:
                header.append(line)
    return {"rarity": rarity, "itemLevel": item_level, "header": header, "socketSignature": sockets}


def matches(item, expected):
    verification_kind = str(expected.get("verificationKind", "set")).casefold()
    if verification_kind == "set":
        rarity = str(item.get("rarity", "")).replace(" ", "").casefold()
        if rarity not in ("稀有", "rare"):
            return False, "目标位置不是稀有物品"
        if item.get("itemLevel") != int(expected.get("itemLevel", -1)):
            return False, "物品等级与仓库快照不一致"
    expected_names = {
        str(expected.get("baseType", "")).strip().casefold(),
        str(expected.get("typeLine", "")).strip().casefold(),
        str(expected.get("name", "")).strip().casefold()
    }
    expected_names.discard("")
    actual_names = {value.casefold() for value in item.get("header", [])}
    if expected_names and not expected_names.intersection(actual_names):
        return False, "物品名称或基底与仓库快照不一致"
    if verification_kind == "socket":
        expected_sockets = str(expected.get("socketSignature", "")).strip().upper()
        if not expected_sockets or item.get("socketSignature") != expected_sockets:
            return False, "插槽结构与仓库快照不一致"
    return True, ""


def run(config):
    global CONTROLLER
    matcher = InterfaceMatcher(config)
    if not matcher.valid:
        emit("error", code="INTERFACE_LOST", reason="仓库或背包界面模板不可用")
        return 2
    CONTROLLER = InputController(config.get("operation_delay_ms", 80))
    try:
        if not focus_game_window():
            emit("aborted", code="GAME_NOT_FOREGROUND", reason="未找到或无法激活游戏窗口")
            return 1
        for index, expected in enumerate(config.get("items", [])):
            if not RUNNING:
                emit("aborted", code="USER_STOPPED", reason="用户停止")
                return 1
            if not is_game_foreground():
                emit("aborted", code="GAME_NOT_FOREGROUND", reason="游戏窗口不在前台")
                return 1
            if not matcher.ready():
                emit("aborted", code="INTERFACE_LOST", reason="仓库或背包界面已离开")
                return 1
            screen = expected.get("screen", {})
            if not CONTROLLER.move(screen.get("clickX", 0), screen.get("clickY", 0)):
                emit("aborted", code="ITEM_MISMATCH", reason="无法移动到目标物品")
                return 1
            text = CONTROLLER.copy_item()
            if not text:
                emit("aborted", code="ITEM_MISMATCH", reason="目标位置未返回物品文本")
                return 1
            valid, reason = matches(parse_item(text), expected)
            if not valid:
                emit("aborted", code="ITEM_MISMATCH", reason=reason, index=index)
                return 1
            CONTROLLER.ctrl_click()
            emit("item-picked", index=index, itemId=expected.get("id"), setId=expected.get("setId"))
        emit("completed")
        return 0
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
