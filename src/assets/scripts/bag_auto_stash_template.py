#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""背包安全自动入库：双界面检测、剪贴板识别、黑名单与安全停止。"""

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
VALID_BLACKLIST_FIELDS = ("name", "baseName", "category")
OPERATION_DELAY_DEFAULT_MS = 80
OPERATION_DELAY_MIN_MS = 20
OPERATION_DELAY_MAX_MS = 500
COPY_ATTEMPTS = 2
INPUT_EVENT_DELAY_SECONDS = 0.01
EXTRA_INVENTORY_MAX_COLUMNS = 6
is_running = True


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


def normalize_blacklist(rules):
    normalized = []
    if not isinstance(rules, list):
        return normalized
    for rule in rules:
        field = str(rule.get("field", "")) if isinstance(rule, dict) else ""
        keyword = str(rule.get("keyword", "")).strip() if isinstance(rule, dict) else ""
        if field in VALID_BLACKLIST_FIELDS and keyword:
            normalized.append({"field": field, "keyword": keyword})
    return normalized


def find_blacklist_match(item, rules):
    for rule in normalize_blacklist(rules):
        value = str(item.get(rule["field"], "")).strip().casefold()
        if value and rule["keyword"].casefold() in value:
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
    hwnd = user32.GetForegroundWindow()
    length = user32.GetWindowTextLengthW(hwnd)
    buffer = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buffer, length + 1)
    return any(expected.casefold() in buffer.value.casefold() for expected in GAME_WINDOW_TITLES)


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
        if not any(expected.casefold() in title.casefold() for expected in GAME_WINDOW_TITLES):
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
            candidates.append((hwnd == foreground, width * height, {
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
    candidates.sort(key=lambda entry: (entry[0], entry[1]), reverse=True)
    return candidates[0][2]


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
            "inventory": self.config.get("templates", {}).get("inventory_title", "")
        }
        for name, image_path in definitions.items():
            if image_path and os.path.exists(image_path):
                image = load_grayscale_image(image_path)
                if image is not None:
                    self.templates[name] = image

    @property
    def valid(self):
        return "stash" in self.templates and "inventory" in self.templates

    def _capture(self, region):
        width = int(region.get("right", 0)) - int(region.get("left", 0))
        height = int(region.get("bottom", 0)) - int(region.get("top", 0))
        if width <= 0 or height <= 0:
            return None
        with mss.mss() as screen:
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
        return stash_ok and inventory_ok, {"stashScore": stash_score, "inventoryScore": inventory_score}


class InputController:
    def __init__(self, config):
        self.config = config
        self.mouse = mouse.Controller()
        self.keyboard = keyboard.Controller()
        operation_delay = normalize_operation_delay(config.get("operation_delay_ms")) / 1000.0
        self.mouse_move_delay = operation_delay
        self.action_delay = operation_delay
        self.clipboard_delay = operation_delay

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
        if sys.platform == "win32":
            if not ctypes.windll.user32.SetCursorPos(int(x), int(y)):
                return False
        else:
            self.mouse.position = (int(x), int(y))
        time.sleep(self.mouse_move_delay)
        return True

    def _send_copy(self):
        try:
            self.keyboard.press(Key.ctrl)
            time.sleep(INPUT_EVENT_DELAY_SECONDS)
            self.keyboard.press("c")
            time.sleep(INPUT_EVENT_DELAY_SECONDS)
            self.keyboard.release("c")
            self.keyboard.release(Key.ctrl)
            return True
        except Exception:
            self.release_all()
            return False

    def _copy_item_text_once(self):
        try:
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
        for _attempt in range(COPY_ATTEMPTS):
            status, text = self._copy_item_text_once()
            if status != "no-response":
                return status, text
        return "empty", ""

    def ctrl_click(self):
        try:
            self.keyboard.press(Key.ctrl)
            time.sleep(INPUT_EVENT_DELAY_SECONDS)
            self.mouse.press(Button.left)
            time.sleep(INPUT_EVENT_DELAY_SECONDS)
            self.mouse.release(Button.left)
            self.keyboard.release(Key.ctrl)
            time.sleep(self.action_delay)
            return True
        except Exception:
            self.release_all()
            return False


def empty_stats():
    return {
        "scannedSlots": 0,
        "stashedSlots": 0,
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
        emit("detection-error", reason="仓库或背包标题模板无法加载")
        return 2
    ready = False
    last_foreground = is_game_foreground()
    last_game_bounds = get_game_client_bounds()
    matched_count = 0
    missed_count = 0
    emit("detection-state", ready=False, foreground=last_foreground,
         gameBounds=last_game_bounds)
    while is_running:
        try:
            matched, scores = matcher.check_interface()
            foreground = is_game_foreground()
            game_bounds = get_game_client_bounds()
            ready, matched_count, missed_count, changed = advance_detection_state(
                ready, matched_count, missed_count, matched)
            if changed or foreground != last_foreground or game_bounds != last_game_bounds:
                emit("detection-state", ready=ready, foreground=foreground,
                     gameBounds=game_bounds, **scores)
            last_foreground = foreground
            last_game_bounds = game_bounds
            time.sleep(0.2)
        except Exception as exc:
            emit("detection-error", reason=str(exc))
            time.sleep(1)
    return 0


def abort(reason, stats):
    emit("stash-aborted", reason=reason, **stats)
    return 1


def run_stash(config):
    matcher = InterfaceMatcher(config)
    if not matcher.valid:
        emit("stash-error", reason="仓库或背包标题模板无法加载", **empty_stats())
        return 2
    controller = InputController(config)
    stats = empty_stats()
    inventory = config.get("inventory", {})
    start = inventory.get("startPos", {})
    slot = inventory.get("slotSize", {})
    start_x, start_y = int(start.get("x", 0)), int(start.get("y", 0))
    width, height = int(slot.get("w", 0)), int(slot.get("h", 0))
    rules = config.get("blacklist", [])
    scan_phases = build_scan_phases(inventory)
    total_slots = sum(1 for phase in scan_phases for target in phase if not target["excluded"])
    empty_slot_threshold = max(1, min(60, int(inventory.get("emptySlotThreshold", 3))))
    consecutive_empty_slots = 0
    try:
        for phase_index, phase in enumerate(scan_phases):
            if phase_index > 0:
                stats["unreadableSlots"] += consecutive_empty_slots
                consecutive_empty_slots = 0
            for target in phase:
                if target["excluded"]:
                    stats["unreadableSlots"] += consecutive_empty_slots
                    consecutive_empty_slots = 0
                    continue
                if not is_running:
                    return abort("user-stopped", stats)
                if not is_game_foreground():
                    return abort("game-not-foreground", stats)
                interface_ready, _scores = matcher.check_interface()
                if not interface_ready:
                    return abort("interface-lost", stats)
                column, row = target["column"], target["row"]
                x = start_x + column * width
                y = start_y + row * height
                copy_status = "unreadable"
                if not controller.move(x, y):
                    stats["unreadableSlots"] += 1
                else:
                    copy_status, text = controller.copy_item_text()
                    if copy_status == "empty":
                        pass
                    elif copy_status != "copied":
                        stats["unreadableSlots"] += 1
                    else:
                        item = parse_item_header(text)
                        if item is None:
                            stats["unreadableSlots"] += 1
                        elif find_blacklist_match(item, rules):
                            stats["blacklistedSlots"] += 1
                        elif controller.ctrl_click():
                            stats["stashedSlots"] += 1
                        else:
                            stats["unreadableSlots"] += 1
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
    parser = argparse.ArgumentParser(description="背包安全自动入库")
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
