#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""背包安全入库：双界面检测、剪贴板识别、黑名单与安全停止。"""

import argparse
import ctypes
from ctypes import wintypes
import io
import json
import math
import os
import signal
import sys
import time
import traceback
import unicodedata


def enable_per_monitor_dpi_awareness():
    if sys.platform != "win32":
        return False
    user32 = ctypes.windll.user32
    try:
        user32.SetProcessDpiAwarenessContext.argtypes = [ctypes.c_void_p]
        user32.SetProcessDpiAwarenessContext.restype = ctypes.c_bool
        if user32.SetProcessDpiAwarenessContext(ctypes.c_void_p(-4)):
            return True
    except Exception:
        pass
    try:
        return ctypes.windll.shcore.SetProcessDpiAwareness(2) == 0
    except Exception:
        try:
            return bool(user32.SetProcessDPIAware())
        except Exception:
            return False


enable_per_monitor_dpi_awareness()

try:
    if sys.version_info >= (3, 7):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    elif sys.platform == "win32":
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
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
_game_window_titles_cache = GAME_WINDOW_TITLES
_game_window_titles_mtime_ns = None
GAME_WINDOW_PROCESS_NAMES = ("PathOfExile.exe", "PathOfExile_x64.exe", "PathOfExileSteam.exe", "PathOfExile_x64Steam.exe", "PathOfExileEGS.exe", "PathOfExile_x64EGS.exe")
_game_window_process_names_cache = GAME_WINDOW_PROCESS_NAMES
_game_window_process_names_mtime_ns = None
VALID_BLACKLIST_FIELDS = ("name", "baseName", "category")
VALID_BLACKLIST_MATCH_MODES = ("contains", "exact")
OPERATION_DELAY_DEFAULT_MS = 80
OPERATION_DELAY_MIN_MS = 20
OPERATION_DELAY_MAX_MS = 500
COPY_ATTEMPTS = 1
MODIFIER_SETTLE_SECONDS = 0.05
KEY_HOLD_SECONDS = 0.02
BUTTON_HOLD_SECONDS = 0.02
RELEASE_SETTLE_SECONDS = 0.02
CLIPBOARD_RESPONSE_MIN_SECONDS = 0.25
EXTRA_INVENTORY_MAX_COLUMNS = 6


def apply_fixed_timing(config):
    global MODIFIER_SETTLE_SECONDS, KEY_HOLD_SECONDS, BUTTON_HOLD_SECONDS
    global RELEASE_SETTLE_SECONDS, CLIPBOARD_RESPONSE_MIN_SECONDS
    timing = config.get("fixed_timing", {}) if isinstance(config, dict) else {}
    MODIFIER_SETTLE_SECONDS = float(timing.get("modifier_settle_ms", 50)) / 1000.0
    KEY_HOLD_SECONDS = float(timing.get("key_hold_ms", 20)) / 1000.0
    BUTTON_HOLD_SECONDS = float(timing.get("button_hold_ms", 20)) / 1000.0
    RELEASE_SETTLE_SECONDS = float(timing.get("release_settle_ms", 20)) / 1000.0
    CLIPBOARD_RESPONSE_MIN_SECONDS = float(timing.get("clipboard_confirm_ms", 250)) / 1000.0


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
            process_names = tuple(str(value).strip().rsplit("\\", 1)[-1].rsplit("/", 1)[-1] for value in values) if isinstance(values, list) else ()
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
is_running = True
runtime_stop_reason = ""


def emit(event, **payload):
    print("EVENT " + json.dumps({"event": event, **payload}, ensure_ascii=False), flush=True)


def error_event(mode):
    return "detection-error" if mode == "detect" else "stash-error"


def normalize_operation_delay(value=None):
    try:
        delay = float(OPERATION_DELAY_DEFAULT_MS if value is None else value)
        if not math.isfinite(delay):
            delay = OPERATION_DELAY_DEFAULT_MS
    except (TypeError, ValueError):
        delay = OPERATION_DELAY_DEFAULT_MS
    return max(OPERATION_DELAY_MIN_MS, min(delay, OPERATION_DELAY_MAX_MS))


def advance_empty_streak(current, copy_status):
    return current + 1 if copy_status == "empty" else 0


def signal_handler(_signum, _frame):
    global is_running
    is_running = False


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


def parse_item_header(text):
    lines = [line.strip() for line in str(text or "").splitlines() if line.strip()]
    category_index = next((i for i, line in enumerate(lines)
                           if line.startswith("物品类别:") or line.startswith("Item Class:")), -1)
    rarity_index = next((i for i, line in enumerate(lines)
                         if line.startswith("稀 有 度:") or line.startswith("稀有度:")
                         or line.startswith("Rarity:")), -1)
    if category_index < 0 or rarity_index < 0:
        return None
    category = lines[category_index].split(":", 1)[1].strip()
    header = []
    for line in lines[rarity_index + 1:]:
        if line == "--------":
            break
        if ":" not in line:
            header.append(line)
    if not category or not header:
        return None
    return {"category": category, "name": header[0], "baseName": header[1] if len(header) > 1 else ""}


def normalize_footprint_text(value):
    return " ".join(unicodedata.normalize("NFKC", str(value or "")).strip().casefold().split())


def footprint_key(category, name):
    normalized_name = normalize_footprint_text(name)
    if not normalized_name:
        return ""
    return "{}\x1f{}".format(normalize_footprint_text(category) or "*", normalized_name)


def valid_footprint(value):
    if not isinstance(value, dict):
        return None
    width, height = value.get("width"), value.get("height")
    if isinstance(width, bool) or isinstance(height, bool):
        return None
    if not isinstance(width, int) or not isinstance(height, int):
        return None
    return {"width": width, "height": height} if 1 <= width <= 12 and 1 <= height <= 12 else None


def resolve_item_footprint(item, catalog):
    if not isinstance(item, dict) or not isinstance(catalog, dict) or catalog.get("schemaVersion") != 1:
        return None
    items = catalog.get("items", {})
    categories = catalog.get("categories", {})
    if not isinstance(items, dict) or not isinstance(categories, dict):
        return None
    category = item.get("category", "")
    names = [item.get("baseName", ""), item.get("name", "")]
    for name in names:
        for key in (footprint_key(category, name), footprint_key("", name)):
            footprint = valid_footprint(items.get(key))
            if footprint:
                return footprint
    return valid_footprint(categories.get(normalize_footprint_text(category)))


def resolved_footprint_slots(target, footprint, phase, ambiguous_slots):
    if not footprint:
        return set()
    column, row = target["column"], target["row"]
    phase_slots = {(entry["column"], entry["row"]) for entry in phase}
    rectangle = {
        (column + column_offset, row + row_offset)
        for column_offset in range(footprint["width"])
        for row_offset in range(footprint["height"])
    }
    if not rectangle.issubset(phase_slots):
        return set()
    possible_predecessors = {
        (candidate_column, candidate_row)
        for candidate_column in range(column - footprint["width"] + 1, column + 1)
        for candidate_row in range(row - footprint["height"] + 1, row + 1)
        if candidate_column < column or (candidate_column == column and candidate_row < row)
    }
    if possible_predecessors.intersection(ambiguous_slots):
        return set()
    return rectangle


def normalize_blacklist(rules):
    normalized = []
    if not isinstance(rules, list):
        return normalized
    for rule in rules:
        field = str(rule.get("field", "")) if isinstance(rule, dict) else ""
        keyword = str(rule.get("keyword", "")).strip() if isinstance(rule, dict) else ""
        match_mode = str(rule.get("matchMode", "")) if isinstance(rule, dict) else ""
        enabled = rule.get("enabled") is not False if isinstance(rule, dict) else True
        if match_mode not in VALID_BLACKLIST_MATCH_MODES:
            match_mode = "contains"
        if field in VALID_BLACKLIST_FIELDS and keyword:
            normalized.append({
                "field": field,
                "keyword": keyword,
                "matchMode": match_mode,
                "enabled": enabled
            })
    return normalized


def find_blacklist_match(item, rules):
    for rule in normalize_blacklist(rules):
        if not rule["enabled"]:
            continue
        value = str(item.get(rule["field"], "")).strip().casefold()
        keyword = rule["keyword"].casefold()
        matched = value == keyword if rule["matchMode"] == "exact" else keyword in value
        if value and matched:
            return rule
    return None


def advance_detection_state(ready, matched_count, missed_count, matched):
    changed = False
    if matched:
        matched_count += 1
        missed_count = 0
        if not ready and matched_count >= 3:
            ready = True
            changed = True
    else:
        missed_count += 1
        matched_count = 0
        if ready and missed_count >= 3:
            ready = False
            changed = True
    return ready, matched_count, missed_count, changed


def is_game_foreground():
    if sys.platform != "win32":
        return False
    user32 = ctypes.windll.user32
    return window_matches_game(user32.GetForegroundWindow())


def find_game_window():
    if sys.platform != "win32":
        return 0
    user32 = ctypes.windll.user32
    matches = []
    callback_type = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)

    @callback_type
    def visit(hwnd, _lparam):
        if not user32.IsWindowVisible(hwnd):
            return True
        length = user32.GetWindowTextLengthW(hwnd)
        if length <= 0:
            return True
        buffer = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(hwnd, buffer, length + 1)
        priority = game_window_title_priority(buffer.value)
        if priority >= 0 and window_matches_game(hwnd):
            matches.append((priority, hwnd))
        return True

    user32.EnumWindows(visit, 0)
    matches.sort(key=lambda entry: entry[0])
    return matches[0][1] if matches else 0


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
        if user32.IsIconic(hwnd):
            user32.ShowWindow(hwnd, 9)
        user32.BringWindowToTop(hwnd)
        user32.SetForegroundWindow(hwnd)
        user32.SetFocus(hwnd)
    finally:
        if attached_target:
            user32.AttachThreadInput(current_thread, target_thread, False)
        if attached_foreground:
            user32.AttachThreadInput(current_thread, foreground_thread, False)
    deadline = time.monotonic() + max(0.2, float(timeout_seconds))
    while is_running and time.monotonic() < deadline:
        if is_game_foreground():
            return True
        time.sleep(0.05)
    return False


def stop_for_foreground_loss(controller=None):
    global is_running, runtime_stop_reason
    is_running = False
    runtime_stop_reason = "game-not-foreground"
    if controller is not None:
        controller.release_all()
    return False


def get_game_client_bounds():
    if sys.platform != "win32":
        return None
    user32 = ctypes.windll.user32
    foreground = user32.GetForegroundWindow()
    candidates = []
    callback_type = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)

    @callback_type
    def visit(hwnd, _lparam):
        if not user32.IsWindowVisible(hwnd):
            return True
        length = user32.GetWindowTextLengthW(hwnd)
        if length <= 0:
            return True
        buffer = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(hwnd, buffer, length + 1)
        title = buffer.value
        priority = game_window_title_priority(title)
        if priority < 0 or not window_matches_game(hwnd):
            return True
        rect = wintypes.RECT()
        origin = wintypes.POINT(0, 0)
        if not user32.GetClientRect(hwnd, ctypes.byref(rect)):
            return True
        if not user32.ClientToScreen(hwnd, ctypes.byref(origin)):
            return True
        width = max(0, int(rect.right - rect.left))
        height = max(0, int(rect.bottom - rect.top))
        if width and height:
            candidates.append((priority, hwnd == foreground, width * height, {
                "left": int(origin.x),
                "top": int(origin.y),
                "right": int(origin.x + width),
                "bottom": int(origin.y + height),
                "width": width,
                "height": height
            }))
        return True

    user32.EnumWindows(visit, 0)
    if not candidates:
        return None
    candidates.sort(key=lambda entry: (entry[0], -int(entry[1]), -entry[2]))
    return candidates[0][3]


def clipboard_sequence_number():
    if sys.platform != "win32":
        return None
    try:
        return int(ctypes.windll.user32.GetClipboardSequenceNumber())
    except Exception:
        return None


def load_grayscale_image(image_path):
    """Load an image without relying on OpenCV's Windows path handling."""
    try:
        encoded = np.fromfile(image_path, dtype=np.uint8)
        if not encoded.size:
            return None
        image = cv2.imdecode(encoded, cv2.IMREAD_GRAYSCALE)
        return image if image is not None and image.size else None
    except (OSError, ValueError, cv2.error):
        return None


class InterfaceMatcher:
    def __init__(self, config):
        self.config = config
        self.templates = {}
        self._load_templates()

    def _load_templates(self):
        definitions = {
            "stash": self.config.get("templates", {}).get("stash_title", ""),
            "inventory": self.config.get("templates", {}).get("inventory_title", ""),
            "reward": self.config.get("templates", {}).get("junfeng_reward_title", "")
        }
        for name, image_path in definitions.items():
            if image_path and os.path.exists(image_path):
                image = load_grayscale_image(image_path)
                if image is not None:
                    self.templates[name] = image

    @property
    def valid(self):
        return "inventory" in self.templates and ("stash" in self.templates or "reward" in self.templates)

    def _capture(self, region):
        width = int(region.get("right", 0)) - int(region.get("left", 0))
        height = int(region.get("bottom", 0)) - int(region.get("top", 0))
        if width <= 0 or height <= 0:
            return None
        with mss.MSS() as screen:
            shot = screen.grab({
                "left": int(region.get("left", 0)),
                "top": int(region.get("top", 0)),
                "width": width,
                "height": height
            })
        return cv2.cvtColor(np.array(shot), cv2.COLOR_BGRA2GRAY)

    def _match(self, name, region):
        image = self._capture(region)
        template = self.templates.get(name)
        if image is None or template is None or template.shape[0] > image.shape[0] or template.shape[1] > image.shape[1]:
            return False, 0.0
        result = cv2.matchTemplate(image, template, cv2.TM_CCOEFF_NORMED)
        score = float(cv2.minMaxLoc(result)[1])
        return score >= float(self.config.get("match_threshold", 0.8)), score

    def check_interface(self):
        templates = self.config.get("templates", {})
        stash_ok, stash_score = self._match("stash", templates.get("stash_region", {}))
        inventory_ok, inventory_score = self._match("inventory", templates.get("inventory_region", {}))
        reward_ok, reward_score = self._match("reward", templates.get("junfeng_reward_region", {}))
        return {
            "stashMatched": stash_ok and inventory_ok,
            "rewardMatched": reward_ok,
            "inventoryMatched": inventory_ok,
        }, {
            "stashScore": stash_score,
            "inventoryScore": inventory_score,
            "rewardScore": reward_score,
        }

    def check_ready(self, mode):
        templates = self.config.get("templates", {})
        inventory_ok, _inventory_score = self._match("inventory", templates.get("inventory_region", {}))
        if mode == "reward":
            expected_ok, _expected_score = self._match("reward", templates.get("junfeng_reward_region", {}))
        else:
            expected_ok, _expected_score = self._match("stash", templates.get("stash_region", {}))
        return expected_ok and inventory_ok


class InputController:
    def __init__(self, config):
        self.config = config
        self.mouse = mouse.Controller()
        self.keyboard = keyboard.Controller()
        operation_delay = normalize_operation_delay(config.get("operation_delay_ms")) / 1000.0
        self.mouse_move_delay = operation_delay
        self.clipboard_delay = max(CLIPBOARD_RESPONSE_MIN_SECONDS, operation_delay)
        self.release_settle = RELEASE_SETTLE_SECONDS

    def release_all(self):
        for key in (Key.ctrl, Key.alt, Key.shift):
            try:
                self.keyboard.release(key)
            except Exception:
                pass
        for button in (Button.left, Button.right):
            try:
                self.mouse.release(button)
            except Exception:
                pass

    def move(self, x, y):
        if not is_game_foreground():
            return stop_for_foreground_loss(self)
        if sys.platform == "win32":
            if not ctypes.windll.user32.SetCursorPos(int(x), int(y)):
                return False
        else:
            self.mouse.position = (int(x), int(y))
        time.sleep(self.mouse_move_delay)
        return True

    def _send_copy(self):
        try:
            if not is_game_foreground():
                return stop_for_foreground_loss(self)
            self.keyboard.press(Key.ctrl)
            time.sleep(MODIFIER_SETTLE_SECONDS)
            if not is_game_foreground():
                return stop_for_foreground_loss(self)
            self.keyboard.press("c")
            time.sleep(KEY_HOLD_SECONDS)
            self.keyboard.release("c")
            time.sleep(RELEASE_SETTLE_SECONDS)
            self.keyboard.release(Key.ctrl)
            return True
        except Exception:
            self.release_all()
            return False

    def _copy_item_text_once(self):
        try:
            if not is_game_foreground():
                stop_for_foreground_loss(self)
                return "unreadable", ""
            before_seq = clipboard_sequence_number()
            before_text = str(pyperclip.paste() or "")
            if not self._send_copy():
                return "unreadable", ""
            deadline = time.monotonic() + self.clipboard_delay
            while is_running and time.monotonic() < deadline:
                current_seq = clipboard_sequence_number()
                current_text = str(pyperclip.paste() or "")
                changed = current_seq != before_seq if before_seq is not None and current_seq is not None else current_text != before_text
                if changed:
                    return ("copied", current_text) if current_text.strip() else ("empty", "")
                time.sleep(0.01)
            return "no-response", ""
        except Exception:
            self.release_all()
            return "unreadable", ""

    def copy_item_text(self):
        """复制物品文本；剪贴板无响应一次即判空格，不重复确认以提升空格扫描速度。"""
        for _attempt in range(COPY_ATTEMPTS):
            status, text = self._copy_item_text_once()
            if status != "no-response":
                return status, text
        return "empty", ""

    def ctrl_click(self):
        try:
            if not is_game_foreground():
                return stop_for_foreground_loss(self)
            self.keyboard.press(Key.ctrl)
            time.sleep(MODIFIER_SETTLE_SECONDS)
            if not is_game_foreground():
                return stop_for_foreground_loss(self)
            self.mouse.press(Button.left)
            time.sleep(BUTTON_HOLD_SECONDS)
            self.mouse.release(Button.left)
            time.sleep(self.release_settle)
            self.keyboard.release(Key.ctrl)
            time.sleep(self.release_settle)
            return True
        except Exception:
            self.release_all()
            return False


def empty_stats():
    return {
        "scannedSlots": 0,
        "stashedSlots": 0,
        "skippedOccupiedSlots": 0,
        "blacklistedSlots": 0,
        "emptySlots": 0,
        "unreadableSlots": 0,
        "progress": 0
    }


def emit_progress(stats, total_slots=60):
    stats["progress"] = 100 if total_slots <= 0 else min(
        100, int(stats["scannedSlots"] * 100 / total_slots))
    emit("stash-progress", **stats)


def build_scan_phases(inventory):
    layout = inventory.get("layout", {}) if isinstance(inventory, dict) else {}
    extra_enabled = bool(layout.get("extraEnabled", False))
    try:
        extra_columns = max(1, min(
            EXTRA_INVENTORY_MAX_COLUMNS, int(layout.get("extraColumns", 1))))
    except (TypeError, ValueError):
        extra_columns = 1
    excluded = set()
    raw_excluded = layout.get("excludedSlots", [])
    if isinstance(raw_excluded, list):
        for slot in raw_excluded:
            if not isinstance(slot, dict):
                continue
            column, row = slot.get("column"), slot.get("row")
            if isinstance(column, int) and not isinstance(column, bool) and \
                    isinstance(row, int) and not isinstance(row, bool) and \
                    ((0 <= column < 12) or
                     (-EXTRA_INVENTORY_MAX_COLUMNS <= column <= -1)) and 0 <= row < 5:
                excluded.add((column, row))

    native = [{"column": column, "row": row, "excluded": (column, row) in excluded}
              for column in range(12) for row in range(5)]
    phases = [native]
    if extra_enabled:
        phases.append([
            {"column": column, "row": row, "excluded": (column, row) in excluded}
            for column in range(-extra_columns, 0) for row in range(5)
        ])
    return phases


def run_detection(config):
    matcher = InterfaceMatcher(config)
    if not matcher.valid:
        emit("detection-error", reason="背包标题以及仓库或君锋镇奖励标题模板无法加载")
        return 2
    stash_ready = False
    reward_detected = False
    last_foreground = is_game_foreground()
    last_game_bounds = get_game_client_bounds()
    last_inventory_matched = False
    stash_matched_count = stash_missed_count = 0
    reward_matched_count = reward_missed_count = 0
    emit("detection-state", ready=False, stashReady=False, rewardDetected=False,
         junfengReady=False, foreground=last_foreground, gameBounds=last_game_bounds)
    while is_running:
        try:
            foreground = is_game_foreground()
            game_bounds = get_game_client_bounds()
            if not foreground:
                changed = stash_ready or reward_detected or foreground != last_foreground or game_bounds != last_game_bounds
                stash_ready = reward_detected = False
                stash_matched_count = stash_missed_count = 0
                reward_matched_count = reward_missed_count = 0
                last_inventory_matched = False
                if changed:
                    emit("detection-state", ready=False, stashReady=False, rewardDetected=False,
                         junfengReady=False, foreground=False, gameBounds=game_bounds)
                last_foreground = foreground
                last_game_bounds = game_bounds
                time.sleep(0.2)
                continue

            matches, scores = matcher.check_interface()
            if isinstance(matches, bool):
                matches = {"stashMatched": matches, "rewardMatched": False, "inventoryMatched": matches}
            stash_ready, stash_matched_count, stash_missed_count, stash_changed = advance_detection_state(
                stash_ready, stash_matched_count, stash_missed_count, matches["stashMatched"])
            reward_detected, reward_matched_count, reward_missed_count, reward_changed = advance_detection_state(
                reward_detected, reward_matched_count, reward_missed_count, matches["rewardMatched"])
            junfeng_ready = reward_detected and matches["inventoryMatched"]
            inventory_changed = matches["inventoryMatched"] != last_inventory_matched
            if stash_changed or reward_changed or inventory_changed or foreground != last_foreground or game_bounds != last_game_bounds:
                emit("detection-state", ready=stash_ready, stashReady=stash_ready,
                     rewardDetected=reward_detected, junfengReady=junfeng_ready,
                     foreground=foreground, gameBounds=game_bounds, **scores)
            last_foreground = foreground
            last_game_bounds = game_bounds
            last_inventory_matched = matches["inventoryMatched"]
            time.sleep(0.2)
        except Exception as exc:
            emit("detection-error", reason=str(exc))
            time.sleep(1)
    return 0


def abort(reason, stats):
    emit("stash-aborted", reason=reason, **stats)
    return 1


def run_stash(config):
    global runtime_stop_reason
    runtime_stop_reason = ""
    stats = empty_stats()
    apply_fixed_timing(config)
    if not focus_game_window():
        return abort("game-not-foreground", stats)
    matcher = InterfaceMatcher(config)
    if not matcher.valid:
        emit("stash-error", reason="仓库或背包标题模板无法加载", **stats)
        return 2
    controller = InputController(config)
    inventory = config.get("inventory", {})
    start = inventory.get("startPos", {})
    slot = inventory.get("slotSize", {})
    start_x, start_y = int(start.get("x", 0)), int(start.get("y", 0))
    width, height = int(slot.get("w", 0)), int(slot.get("h", 0))
    rules = config.get("blacklist", [])
    item_footprints = inventory.get("itemFootprints", {})
    scan_phases = build_scan_phases(inventory)
    total_slots = sum(1 for phase in scan_phases for target in phase if not target["excluded"])
    empty_slot_threshold = max(1, min(60, int(inventory.get("emptySlotThreshold", 3))))
    consecutive_empty_slots = 0
    try:
        for phase_index, phase in enumerate(scan_phases):
            resolved_slots = set()
            ambiguous_slots = {
                (entry["column"], entry["row"]) for entry in phase if entry["excluded"]
            }
            if phase_index > 0:
                stats["unreadableSlots"] += consecutive_empty_slots
                consecutive_empty_slots = 0
            for target in phase:
                if target["excluded"]:
                    stats["unreadableSlots"] += consecutive_empty_slots
                    consecutive_empty_slots = 0
                    continue
                if not is_running:
                    return abort(runtime_stop_reason or "user-stopped", stats)
                if not is_game_foreground():
                    return abort("game-not-foreground", stats)
                interface_ready, _scores = matcher.check_interface()
                if not interface_ready:
                    return abort("interface-lost", stats)
                column, row = target["column"], target["row"]
                if (column, row) in resolved_slots:
                    stats["unreadableSlots"] += consecutive_empty_slots
                    consecutive_empty_slots = 0
                    stats["skippedOccupiedSlots"] += 1
                    stats["scannedSlots"] += 1
                    emit_progress(stats, total_slots)
                    continue
                x = start_x + column * width
                y = start_y + row * height
                copy_status = "unreadable"
                handled_item = None
                if not controller.move(x, y):
                    stats["unreadableSlots"] += 1
                    ambiguous_slots.add((column, row))
                else:
                    copy_status, text = controller.copy_item_text()
                    if copy_status == "empty":
                        pass
                    elif copy_status != "copied":
                        stats["unreadableSlots"] += 1
                        ambiguous_slots.add((column, row))
                    else:
                        item = parse_item_header(text)
                        if item is None:
                            stats["unreadableSlots"] += 1
                            ambiguous_slots.add((column, row))
                        elif find_blacklist_match(item, rules):
                            stats["blacklistedSlots"] += 1
                            handled_item = item
                        elif controller.ctrl_click():
                            stats["stashedSlots"] += 1
                            handled_item = item
                        else:
                            stats["unreadableSlots"] += 1
                            ambiguous_slots.add((column, row))
                if not is_running:
                    return abort(runtime_stop_reason or "user-stopped", stats)
                if handled_item:
                    footprint = resolve_item_footprint(handled_item, item_footprints)
                    resolved_slots.update(resolved_footprint_slots(
                        target, footprint, phase, ambiguous_slots))
                if copy_status == "empty":
                    consecutive_empty_slots = advance_empty_streak(consecutive_empty_slots, copy_status)
                else:
                    stats["unreadableSlots"] += consecutive_empty_slots
                    consecutive_empty_slots = 0
                stats["scannedSlots"] += 1
                if consecutive_empty_slots >= empty_slot_threshold:
                    stats["emptySlots"] += consecutive_empty_slots
                    emit_progress(stats, total_slots)
                    emit("stash-completed", reason="consecutive-empty-threshold", **stats)
                    return 0
                emit_progress(stats, total_slots)
        stats["emptySlots"] += consecutive_empty_slots
        stats["progress"] = 100
        emit("stash-completed", **stats)
        return 0
    except Exception as exc:
        emit("stash-error", reason=str(exc), **stats)
        print(traceback.format_exc(), file=sys.stderr, flush=True)
        return 2
    finally:
        controller.release_all()


def load_config(path):
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def main():
    parser = argparse.ArgumentParser(description="背包安全入库")
    parser.add_argument("--config", required=True)
    parser.add_argument("--mode", choices=("detect", "stash"), required=True)
    args = parser.parse_args()
    if DEPENDENCY_ERROR:
        emit(error_event(args.mode), reason=f"Python 依赖缺失: {DEPENDENCY_ERROR}")
        return 2
    try:
        config = load_config(args.config)
        return run_detection(config) if args.mode == "detect" else run_stash(config)
    except Exception as exc:
        emit(error_event(args.mode), reason=str(exc))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
