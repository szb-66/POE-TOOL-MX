#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""浮士德当前市集页安全分段改价。

仅接受 Electron 主进程写入的固定配置文件，通过 ``EVENT <json>`` 输出有限事件。
价格数值只从已聚焦输入框的剪贴板读取；OCR 不参与数字定价。
"""

import argparse
import ctypes
from ctypes import wintypes
from decimal import Decimal, InvalidOperation, ROUND_FLOOR
import hashlib
import io
import json
import os
from pathlib import Path
import re
import signal
import sys
import time
import unicodedata


CURRENCY_TEXT = {"混沌石": "chaos", "神圣石": "divine"}
CURRENCY_NAME = {value: key for key, value in CURRENCY_TEXT.items()}
DEFAULT_LANGUAGE = {
    "anchors": {"merchant": ["商人"], "shop": ["商店"],
                "priceTitle": ["设置物品价格"], "submit": ["上架物品"]},
    "currencies": {"chaos": ["混沌石"], "divine": ["神圣石"]},
    "itemBaseAliases": {},
}
MIN_OCR_SCORE = 0.85
EMPTY_SLOT_CONFIDENCE = 0.995
GRID_COLUMNS = 12
GRID_ROWS = 12
GAME_WINDOW_TITLES = ("流放之路", "Path of Exile")
_game_window_titles_cache = GAME_WINDOW_TITLES
_game_window_titles_mtime_ns = None
GAME_WINDOW_PROCESS_NAMES = (
    "PathOfExile.exe",
    "PathOfExile_x64.exe",
    "PathOfExileSteam.exe",
    "PathOfExile_x64Steam.exe",
    "PathOfExileEGS.exe",
    "PathOfExile_x64EGS.exe",
)
_game_window_process_names_cache = GAME_WINDOW_PROCESS_NAMES
_game_window_process_names_mtime_ns = None
OCCUPANCY_LABELS = ("highlighted", "dimmed", "empty")
STOP_REQUESTED = False


class ItemSkip(RuntimeError):
    def __init__(self, reason_code):
        super().__init__(reason_code)
        self.reason_code = str(reason_code)


class PageAbort(RuntimeError):
    def __init__(self, reason_code):
        super().__init__(reason_code)
        self.reason_code = str(reason_code)


def enable_per_monitor_dpi_awareness():
    if sys.platform != "win32":
        return False
    try:
        if ctypes.windll.user32.SetProcessDpiAwarenessContext(ctypes.c_void_p(-4)):
            return True
    except Exception:
        pass
    try:
        return ctypes.windll.shcore.SetProcessDpiAwareness(2) == 0
    except Exception:
        try:
            return bool(ctypes.windll.user32.SetProcessDPIAware())
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


def emit(event, **payload):
    print("EVENT " + json.dumps({"event": event, **payload}, ensure_ascii=False), flush=True)


def normalize_text(value):
    return "".join(unicodedata.normalize("NFKC", str(value or "")).split()).casefold()


def currency_text_map(language=None):
    result = {}
    for code, aliases in (language or DEFAULT_LANGUAGE)["currencies"].items():
        for alias in aliases:
            key = normalize_text(alias)
            if key in result and result[key] != code:
                raise PageAbort("currency_ocr_uncertain")
            result[key] = code
    return result


def _box_rect(box):
    points = [[float(point[0]), float(point[1])] for point in box]
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    return {"left": min(xs), "top": min(ys), "right": max(xs), "bottom": max(ys)}


def _box_center(box):
    rect = _box_rect(box)
    return ((rect["left"] + rect["right"]) / 2, (rect["top"] + rect["bottom"]) / 2)


_OCR_ENGINE = None
_OCCUPANCY_MODEL_CACHE = {}


def _ocr_engine():
    global _OCR_ENGINE
    if _OCR_ENGINE is None:
        import rapidocr
        from rapidocr import RapidOCR
        model_root = str(Path(rapidocr.__file__).resolve().parent / "models")
        _OCR_ENGINE = RapidOCR(params={
            "Global.model_root_dir": model_root,
            "Global.use_cls": False,
        })
    return _OCR_ENGINE


def _unpack_ocr(output, offset=(0, 0)):
    if output is None:
        return []
    boxes = getattr(output, "boxes", None)
    texts = getattr(output, "txts", getattr(output, "texts", None))
    scores = getattr(output, "scores", None)
    if boxes is None or texts is None:
        return []
    score_values = [1.0] * len(texts) if scores is None else scores
    ox, oy = offset
    candidates = []
    for box, text, score in zip(boxes, texts, score_values):
        shifted = [[float(point[0]) + ox, float(point[1]) + oy] for point in box]
        candidates.append({"text": normalize_text(text), "score": float(score), "box": shifted})
    return candidates


def ocr_image(image_or_path, offset=(0, 0)):
    return _unpack_ocr(_ocr_engine()(str(image_or_path) if isinstance(image_or_path, Path) else image_or_path), offset)


def _unique_exact(candidates, expected, reason_code, min_score=MIN_OCR_SCORE):
    expected = {normalize_text(value) for value in (expected if isinstance(expected, (list, tuple)) else [expected])}
    matches = [candidate for candidate in candidates
               if normalize_text(candidate.get("text")) in expected and float(candidate.get("score", 0)) >= min_score]
    if len(matches) != 1:
        raise ItemSkip(reason_code)
    return matches[0]


def select_unique_currency(candidates, min_score=MIN_OCR_SCORE, language=None):
    names = currency_text_map(language)
    matches = [candidate for candidate in candidates
               if normalize_text(candidate.get("text")) in names
               and float(candidate.get("score", 0)) >= min_score]
    if len(matches) != 1:
        raise ItemSkip("currency_ocr_uncertain")
    return names[normalize_text(matches[0]["text"])]


def find_dropdown_currencies(candidates, min_score=MIN_OCR_SCORE, language=None):
    names = currency_text_map(language)
    return sorted({names[normalize_text(candidate.get("text"))]
                   for candidate in candidates
                   if normalize_text(candidate.get("text")) in names
                   and float(candidate.get("score", 0)) >= min_score})


def validate_page_anchors(candidates, language=None):
    trusted = {normalize_text(candidate.get("text")) for candidate in candidates
               if float(candidate.get("score", 0)) >= 0.75}
    anchors = (language or DEFAULT_LANGUAGE)["anchors"]
    if not all(any(normalize_text(alias) in trusted for alias in anchors[key]) for key in ("merchant", "shop")):
        return False, "page_anchor_missing"
    return True, "page_ok"


def validate_grid_calibration(grid):
    try:
        left, top, right, bottom = (float(grid[key]) for key in ("left", "top", "right", "bottom"))
        scale = float(grid["scaleFactor"])
    except (KeyError, TypeError, ValueError):
        return False, "grid_invalid"
    width, height = right - left, bottom - top
    if width < 240 or height < 240 or scale <= 0:
        return False, "grid_invalid"
    if not 0.85 <= width / height <= 1.15:
        return False, "grid_aspect_invalid"
    return True, "grid_ok"


def select_market_candidate_cells(probabilities):
    candidates = []
    skipped_empty = 0
    for index, values in enumerate(probabilities):
        scores = [float(value) for value in values]
        column, row = index % GRID_COLUMNS, index // GRID_COLUMNS
        if scores[OCCUPANCY_LABELS.index("empty")] >= EMPTY_SLOT_CONFIDENCE:
            skipped_empty += 1
            continue
        nonempty_score = max(scores[0], scores[1])
        candidates.append((nonempty_score, column, row))
    candidates.sort(key=lambda value: (-value[0], value[2], value[1]))
    return [(column, row) for _score, column, row in candidates], skipped_empty


def load_occupancy_model(config):
    from slot_highlight_classifier import default_weights_path, load_classifier
    weights_path = str(config.get("weights_path") or config.get("model_path") or default_weights_path())
    if not weights_path or not os.path.isfile(weights_path):
        return None
    return load_classifier(weights_path)


def parse_positive_price(value):
    text = str(value or "").strip()
    if not re.fullmatch(r"[0-9]+", text):
        raise ItemSkip("price_clipboard_invalid")
    number = int(text, 10)
    if number <= 0:
        raise ItemSkip("price_clipboard_invalid")
    return number


def read_full_price(adapter):
    adapter.double_click_price()
    adapter.hotkey("ctrl", "a")
    adapter.hotkey("ctrl", "c")
    return parse_positive_price(adapter.read_clipboard())


def best_effort_item_name(copied_text):
    lines = [line.strip() for line in str(copied_text or "").splitlines() if line.strip()]
    separator_index = next((index for index, line in enumerate(lines) if line == "--------"), -1)
    header_lines = lines[:separator_index] if separator_index > 0 else lines
    names = [line for line in header_lines if ":" not in line]
    return (names[0] if names else "市集物品")[:60]


def identify_copied_item(copied_text):
    normalized = unicodedata.normalize("NFKC", str(copied_text or "")).strip()
    if not normalized:
        raise ItemSkip("item_clipboard_invalid")
    return {"itemName": best_effort_item_name(normalized)}


def parse_item_header(copied_text, aliases=None):
    lines = [line.strip() for line in str(copied_text or "").splitlines() if line.strip()]
    lines = [unicodedata.normalize("NFKC", line) for line in lines]
    category_index = next((index for index, line in enumerate(lines)
                           if re.match(r"^(?:物品类别|物品種類|物品种类|物品類別|Item Class):", line)), -1)
    rarity_index = next((index for index, line in enumerate(lines)
                         if re.match(r"^(?:稀\s*有\s*度|Rarity):", line)), -1)
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
    base_name = header[1] if len(header) > 1 else header[0]
    if aliases:
        normalize_base = lambda value: " ".join(unicodedata.normalize("NFKC", str(value or "")).casefold().split())
        normalized_aliases = {}
        for alias, english in aliases.items():
            key = normalize_base(alias)
            normalized_aliases.setdefault(key, set()).add(english)
        key = normalize_base(base_name)
        if key in normalized_aliases:
            values = normalized_aliases[key]
            base_name = next(iter(values)) if len(values) == 1 and None not in values else ""
        elif len(header) == 1:
            # A nested short base is not a second identity; disjoint bases remain ambiguous.
            def latin_word(character):
                return bool(character) and (character == "_" or character.isdecimal() or
                                           "LATIN" in unicodedata.name(character, ""))
            matches = []
            for alias, values in normalized_aliases.items():
                if not alias:
                    continue
                start = key.find(alias)
                while start >= 0:
                    end = start + len(alias)
                    before = key[start - 1] if start else ""
                    after = key[end] if end < len(key) else ""
                    if not ((latin_word(alias[0]) and latin_word(before)) or
                            (latin_word(alias[-1]) and latin_word(after))):
                        matches.append((start, end, values))
                    start = key.find(alias, start + 1)
            maximal = [match for match in matches if not any(
                other[0] <= match[0] and other[1] >= match[1] and other[1] - other[0] > match[1] - match[0]
                for other in matches)]
            candidates = {english for _, _, values in maximal for english in values}
            base_name = next(iter(candidates)) if len(candidates) == 1 and None not in candidates else ""
    return {
        "category": category,
        "name": header[0],
        "baseName": base_name,
    }


def normalize_footprint_text(value):
    return " ".join(unicodedata.normalize("NFKC", str(value or "")).strip().casefold().split())


def normalize_item_identity(value):
    normalized = unicodedata.normalize("NFKC", str(value or "")).replace("\r\n", "\n").replace("\r", "\n")
    return "\n".join(" ".join(line.split()) for line in normalized.splitlines()).strip()


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
    return {"width": width, "height": height} if 1 <= width <= GRID_COLUMNS and 1 <= height <= GRID_ROWS else None


def resolve_item_footprint(item, catalog):
    if not isinstance(item, dict) or not isinstance(catalog, dict) or catalog.get("schemaVersion") != 1:
        return None
    items = catalog.get("items", {})
    categories = catalog.get("categories", {})
    if not isinstance(items, dict) or not isinstance(categories, dict):
        return None
    category = item.get("category", "")
    for name in (item.get("baseName", ""), item.get("name", "")):
        for key in (footprint_key(category, name), footprint_key("", name)):
            footprint = valid_footprint(items.get(key))
            if footprint:
                return footprint
    return valid_footprint(categories.get(normalize_footprint_text(category)))


def candidate_footprint_rectangles(target, footprint, resolved_slots, excluded_slots=None):
    if not footprint:
        return []
    column, row = target
    width, height = footprint["width"], footprint["height"]
    blocked = set(resolved_slots or ())
    if excluded_slots:
        blocked.update(excluded_slots)
    rectangles = []
    for left in range(column - width + 1, column + 1):
        for top in range(row - height + 1, row + 1):
            rectangle = {
                (left + column_offset, top + row_offset)
                for column_offset in range(width)
                for row_offset in range(height)
            }
            if any(x < 0 or x >= GRID_COLUMNS or y < 0 or y >= GRID_ROWS for x, y in rectangle):
                continue
            if rectangle.intersection(blocked):
                continue
            rectangles.append(rectangle)
    return rectangles


def probe_item_identity(adapter, cell, probe_cache, text_cache=None):
    if cell in probe_cache:
        return probe_cache[cell]
    copied = adapter.copy_item_at(*cell)
    identity = normalize_item_identity(copied)
    if not identity:
        copied = adapter.copy_item_at(*cell)
        identity = normalize_item_identity(copied)
    probe_cache[cell] = identity
    if text_cache is not None and identity:
        text_cache[cell] = copied
    return identity


def resolve_probed_footprint_slots(
    adapter, target, footprint, resolved_slots, probe_cache, copied_text,
    text_cache=None, excluded_slots=None
):
    identity = normalize_item_identity(copied_text)
    if not identity:
        return set()
    probe_cache[target] = identity
    rectangles = candidate_footprint_rectangles(target, footprint, resolved_slots, excluded_slots)
    if not rectangles:
        return set()
    # 按行主序扫描时 target 通常为左上角，优先检验已缓存格以快速剪枝不匹配矩形。
    rectangles.sort(key=lambda rect: (
        min(cell[1] for cell in rect) != target[1] or min(cell[0] for cell in rect) != target[0],
        min(cell[1] for cell in rect),
        min(cell[0] for cell in rect),
    ))
    matches = []
    for rectangle in rectangles:
        ordered_cells = sorted(
            rectangle,
            key=lambda cell: (
                0 if (cell in probe_cache and probe_cache[cell] != identity) else 1,
                0 if cell in probe_cache else 1,
                cell[1],
                cell[0],
            ),
        )
        if all(probe_item_identity(adapter, cell, probe_cache, text_cache) == identity for cell in ordered_cells):
            matches.append(rectangle)
    return matches[0] if len(matches) == 1 else set()


def _decimal(value, reason_code):
    try:
        result = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ItemSkip(reason_code)
    if not result.is_finite():
        raise ItemSkip(reason_code)
    return result


def validate_pricing_config(config):
    ratio = _decimal(config.get("chaosPerDivine"), "invalid_ratio")
    if ratio <= 0:
        raise ItemSkip("invalid_ratio")
    bands = config.get("bands")
    if not isinstance(bands, list) or not bands:
        raise ItemSkip("invalid_bands")
    normalized = []
    for index, band in enumerate(bands):
        range_currency = band.get("rangeCurrency")
        output_currency = band.get("outputCurrency")
        if range_currency not in CURRENCY_NAME or output_currency not in CURRENCY_NAME:
            raise ItemSkip("invalid_currency")
        start = _decimal(band.get("start"), "invalid_band")
        end_value = band.get("end")
        end = None if end_value in (None, "") else _decimal(end_value, "invalid_band")
        discount = _decimal(band.get("discountPercent"), "invalid_discount")
        if start <= 0 or (end is not None and end <= start) or discount <= 0 or discount >= 100:
            raise ItemSkip("invalid_band")
        if end is None and index != len(bands) - 1:
            raise ItemSkip("invalid_band")
        factor = ratio if range_currency == "divine" else Decimal(1)
        normalized.append({
            "startChaos": start * factor,
            "endChaos": None if end is None else end * factor,
            "discount": discount,
            "outputCurrency": output_currency,
        })
    ordered = sorted(normalized, key=lambda band: band["startChaos"])
    for previous, current in zip(ordered, ordered[1:]):
        if previous["endChaos"] is None or previous["endChaos"] > current["startChaos"]:
            raise ItemSkip("overlapping_bands")
    return ratio, ordered


def build_price_plan(config, old_price, old_currency, parsed_config=None):
    if old_currency not in CURRENCY_NAME:
        raise ItemSkip("currency_unsupported")
    ratio, bands = parsed_config if parsed_config is not None else validate_pricing_config(config)
    old_price = parse_positive_price(str(old_price))
    old_chaos = Decimal(old_price) * (ratio if old_currency == "divine" else Decimal(1))
    band = next((entry for entry in bands
                 if old_chaos >= entry["startChaos"]
                 and (entry["endChaos"] is None or old_chaos < entry["endChaos"])), None)
    if band is None:
        raise ItemSkip("no_matching_band")
    discounted_chaos = old_chaos * (Decimal(100) - band["discount"]) / Decimal(100)
    divisor = ratio if band["outputCurrency"] == "divine" else Decimal(1)
    new_price = int((discounted_chaos / divisor).to_integral_value(rounding=ROUND_FLOOR))
    if new_price < 1:
        raise ItemSkip("result_below_one")
    new_chaos = Decimal(new_price) * divisor
    if new_chaos >= old_chaos:
        raise ItemSkip("not_lower")
    return {
        "oldPrice": old_price,
        "oldCurrency": old_currency,
        "newPrice": new_price,
        "newCurrency": band["outputCurrency"],
    }


def execute_price_transaction(adapter, plan):
    # read_full_price 已聚焦并全选；读取通货和计算计划不改变焦点。
    adapter.write_clipboard(str(plan["newPrice"]))
    adapter.hotkey("ctrl", "v")
    if plan["newCurrency"] != plan["oldCurrency"]:
        adapter.choose_currency(plan["newCurrency"])
    adapter.click_submit_once()
    return "repriced"


def safe_close_price_window(adapter):
    if not adapter.price_window_open():
        raise PageAbort("price_window_unknown")
    # 若单位下拉框仍展开，第一次 Escape 只会收起列表；在每次按键前后都重新
    # 确认价格窗口锚点，最多再执行一次确定性的取消，不点击推测坐标。
    for _attempt in range(2):
        adapter.press_escape()
        if not adapter.price_window_open():
            return True
    raise PageAbort("price_window_close_failed")


def game_window_titles():
    global _game_window_titles_cache, _game_window_titles_mtime_ns
    config_path = os.environ.get("POE_GAME_WINDOW_TITLES_FILE", "")
    if not config_path:
        return GAME_WINDOW_TITLES
    try:
        mtime_ns = os.stat(config_path).st_mtime_ns
        if mtime_ns != _game_window_titles_mtime_ns:
            payload = json.loads(Path(config_path).read_text(encoding="utf-8"))
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
    return next((priority for priority, expected in enumerate(game_window_titles())
                 if expected.casefold() in folded), -1)


def game_window_process_names():
    global _game_window_process_names_cache, _game_window_process_names_mtime_ns
    config_path = os.environ.get("POE_GAME_WINDOW_TITLES_FILE", "")
    if not config_path:
        return GAME_WINDOW_PROCESS_NAMES
    try:
        mtime_ns = os.stat(config_path).st_mtime_ns
        if mtime_ns != _game_window_process_names_mtime_ns:
            payload = json.loads(Path(config_path).read_text(encoding="utf-8"))
            values = payload.get("processNames") if isinstance(payload, dict) else None
            process_names = tuple(str(value).strip().rsplit("\\", 1)[-1].rsplit("/", 1)[-1]
                                  for value in values) if isinstance(values, list) else ()
            if (not process_names or any(not name for name in process_names)
                    or len({name.casefold() for name in process_names}) != len(process_names)):
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
    if game_window_title_priority(_window_title(hwnd)) < 0:
        return False
    allowed_processes = {name.casefold() for name in game_window_process_names()}
    return window_process_name(hwnd) in allowed_processes


def _window_title(hwnd):
    if sys.platform != "win32" or not hwnd:
        return ""
    try:
        user32 = ctypes.windll.user32
        length = user32.GetWindowTextLengthW(ctypes.c_void_p(hwnd))
        buffer = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(ctypes.c_void_p(hwnd), buffer, length + 1)
        return buffer.value
    except Exception:
        return ""


def is_game_foreground():
    if sys.platform != "win32":
        return False
    try:
        ctypes.windll.user32.GetForegroundWindow.restype = ctypes.c_void_p
        hwnd = ctypes.windll.user32.GetForegroundWindow()
        return window_matches_game(hwnd)
    except Exception:
        return False


def require_game_foreground():
    if STOP_REQUESTED:
        raise PageAbort("stopped")
    if not is_game_foreground():
        raise PageAbort("game_not_foreground")


def _grid_region(grid):
    return {
        "left": int(round(float(grid["left"]))),
        "top": int(round(float(grid["top"]))),
        "width": int(round(float(grid["right"]) - float(grid["left"]))),
        "height": int(round(float(grid["bottom"]) - float(grid["top"]))),
    }


class GameAdapter:
    def __init__(self, config=None, shared_screen=None):
        import cv2
        import mss
        import numpy as np
        import pyperclip
        from pynput import keyboard, mouse
        from pynput.keyboard import Key
        from pynput.mouse import Button
        self.cv2 = cv2
        self.mss = mss
        self.np = np
        self.pyperclip = pyperclip
        self.Key = Key
        self.Button = Button
        self.keyboard = keyboard.Controller()
        self.mouse = mouse.Controller()
        self._screen = shared_screen
        self._owns_screen = shared_screen is None
        self._monitor_cache = None
        self._monitor_grid_key = None
        self.config = {}
        self.grid = None
        self._price_context = None
        self._price_window_open_observation = None
        self._price_layout = None
        self._price_open_started = None
        self._last_submit_title_region = None
        self._last_submit_title_frame = None
        self._expect_clipboard_copy = False
        if config is not None:
            self.reset_run(config)

    def reset_run(self, config):
        """重置单轮运行状态；不跨轮保留价格、通货或窗口布局缓存。"""
        self.config = config
        self.grid = _grid_region(config["gridCalibration"])
        self._monitor_cache = None
        self._monitor_grid_key = None
        self._price_context = None
        self._price_window_open_observation = None
        self._price_layout = None
        self._price_open_started = None
        self._last_submit_title_region = None
        self._last_submit_title_frame = None
        self._expect_clipboard_copy = False

    def close(self):
        screen = getattr(self, "_screen", None)
        if screen is not None and getattr(self, "_owns_screen", True):
            try:
                screen.close()
            except Exception:
                pass
            self._screen = None

    def _mss_screen(self):
        screen = getattr(self, "_screen", None)
        if screen is None:
            screen = self.mss.mss()
            self._screen = screen
            self._owns_screen = True
        return screen

    def language(self):
        return getattr(self, "config", {}).get("runtime_language") or DEFAULT_LANGUAGE

    def anchor(self, key):
        return self.language()["anchors"][key]

    def currency_aliases(self, code):
        return self.language()["currencies"][code]

    def trace_timing(self, stage, started, **metrics):
        if os.environ.get("FAUSTUS_TIMING") == "1" and started is not None:
            print("FAUSTUS_TIMING " + json.dumps({
                "stage": stage, "ms": round((time.perf_counter() - started) * 1000, 2),
                **metrics,
            }), file=sys.stderr, flush=True)

    def sleep(self, seconds=0.05):
        time.sleep(seconds)

    def _monitor(self):
        grid_key = (self.grid["left"], self.grid["top"], self.grid["width"], self.grid["height"])
        if getattr(self, "_monitor_cache", None) is not None and getattr(self, "_monitor_grid_key", None) == grid_key:
            return dict(self._monitor_cache)
        center_x = self.grid["left"] + self.grid["width"] / 2
        center_y = self.grid["top"] + self.grid["height"] / 2
        screen = self._mss_screen()
        selected = None
        for monitor in screen.monitors[1:]:
            if (monitor["left"] <= center_x < monitor["left"] + monitor["width"]
                    and monitor["top"] <= center_y < monitor["top"] + monitor["height"]):
                selected = dict(monitor)
                break
        if selected is None:
            selected = dict(screen.monitors[1])
        self._monitor_cache = dict(selected)
        self._monitor_grid_key = grid_key
        return selected

    def capture(self, region):
        pixels = self.np.asarray(self._mss_screen().grab(region))
        return self.cv2.cvtColor(pixels, self.cv2.COLOR_BGRA2BGR)

    def _frame_diff(self, before, after):
        if before is None or after is None or getattr(before, "shape", None) != getattr(after, "shape", None):
            return float("inf")
        return float(self.np.mean(self.np.abs(after.astype(self.np.int16) - before.astype(self.np.int16))))

    def capture_ocr(self, region):
        started = time.perf_counter()
        try:
            return ocr_image(self.capture(region), (region["left"], region["top"]))
        finally:
            self.trace_timing("ocr", started, pixels=region["width"] * region["height"])

    def page_candidates(self):
        height = self.grid["height"]
        top_extension = max(int(height * 0.30), int(220 * float(self.config["gridCalibration"]["scaleFactor"])))
        region = {
            "left": self.grid["left"],
            "top": self.grid["top"] - top_extension,
            "width": self.grid["width"],
            "height": top_extension,
        }
        return self.capture_ocr(region)

    def validate_page(self):
        ok, reason = validate_page_anchors(self.page_candidates(), self.language())
        if not ok:
            raise PageAbort(reason)

    def validate_grid_structure(self):
        image = self.capture(self.grid)
        gray = self.cv2.cvtColor(image, self.cv2.COLOR_BGR2GRAY)
        grad_x = self.np.mean(self.np.abs(self.np.diff(gray.astype(float), axis=1)), axis=0)
        grad_y = self.np.mean(self.np.abs(self.np.diff(gray.astype(float), axis=0)), axis=1)

        def matched(projection, length, count):
            cell = length / count
            baseline = float(self.np.median(projection))
            spread = float(self.np.std(projection))
            threshold = baseline + max(0.5, spread * 0.20)
            hits = 0
            for index in range(1, count):
                center = int(round(index * cell))
                radius = max(2, int(cell * 0.10))
                if float(self.np.max(projection[max(0, center - radius):min(len(projection), center + radius + 1)])) >= threshold:
                    hits += 1
            return hits >= count - 4

        if not matched(grad_x, self.grid["width"], GRID_COLUMNS) or not matched(grad_y, self.grid["height"], GRID_ROWS):
            raise PageAbort("grid_structure_invalid")

    def candidate_cells(self):
        """使用纯 NumPy 格子分类器过滤空格，返回非空格子坐标。"""
        try:
            classifier = load_occupancy_model(self.config)
        except Exception as exc:
            raise PageAbort("occupancy_model_validation_failed") from exc
        if classifier is None:
            raise PageAbort("occupancy_model_validation_failed")
        try:
            image = self.capture(self.grid)
        except Exception as exc:
            raise PageAbort("occupancy_grid_capture_failed") from exc
        try:
            from slot_highlight_classifier import classify_empty_slots
            probabilities, _empty_slots = classify_empty_slots(
                image,
                GRID_COLUMNS,
                GRID_ROWS,
                classifier,
                empty_threshold=EMPTY_SLOT_CONFIDENCE,
                order="row-major",
            )
        except Exception as exc:
            raise PageAbort("occupancy_model_inference_failed") from exc
        cells, skipped_empty = select_market_candidate_cells(probabilities)
        emit("scan-plan", total=len(cells), skippedEmpty=skipped_empty, modelReady=True)
        return cells

    def _popup_region(self):
        monitor = self._monitor()
        return {
            "left": monitor["left"] + int(monitor["width"] * 0.18),
            "top": monitor["top"] + int(monitor["height"] * 0.18),
            "width": int(monitor["width"] * 0.64),
            "height": int(monitor["height"] * 0.66),
        }

    def _price_context_from_candidates(self, candidates):
        title = _unique_exact(candidates, self.anchor("priceTitle"), "price_window_anchor_missing", 0.75)
        currency_candidates = [candidate for candidate in candidates
                               if normalize_text(candidate.get("text")) in currency_text_map(self.language())]
        currency = select_unique_currency(currency_candidates, language=self.language())
        currency_text = self.currency_aliases(currency)
        currency_candidate = _unique_exact(currency_candidates, currency_text, "currency_ocr_uncertain")
        submit = _unique_exact(candidates, self.anchor("submit"), "submit_anchor_missing", 0.75)
        context = {
            "candidates": candidates,
            "title": title,
            "currency": currency_candidate,
            "currencyCode": currency,
            "submit": submit,
        }
        return context

    def _bounded_region(self, rect, horizontal_padding, vertical_padding, bottom=None):
        popup = self._popup_region()
        popup_right = popup["left"] + popup["width"]
        popup_bottom = popup["top"] + popup["height"]
        left = max(popup["left"], int(rect["left"] - horizontal_padding))
        top = max(popup["top"], int(rect["top"] - vertical_padding))
        right = min(popup_right, int(rect["right"] + horizontal_padding))
        region_bottom = popup_bottom if bottom is None else min(popup_bottom, int(bottom))
        if right <= left or region_bottom <= top:
            raise ItemSkip("currency_ocr_uncertain")
        return {"left": left, "top": top, "width": right - left, "height": region_bottom - top}

    def _title_region(self, context):
        rect = _box_rect(context["title"]["box"])
        height = max(1, rect["bottom"] - rect["top"])
        return self._bounded_region(rect, height * 1.75, height * 0.80, rect["bottom"] + height * 0.80)

    def _currency_region(self, context):
        rect = _box_rect(context["currency"]["box"])
        height = max(1, rect["bottom"] - rect["top"])
        return self._bounded_region(rect, height * 1.75, height * 0.80, rect["bottom"] + height * 0.80)

    def _local_context_region(self, layout):
        title_rect = _box_rect(layout["title"]["box"])
        currency_rect = _box_rect(layout["currency"]["box"])
        pad_h = max(1, title_rect["bottom"] - title_rect["top"], currency_rect["bottom"] - currency_rect["top"])
        union_rect = {
            "left": min(title_rect["left"], currency_rect["left"]),
            "top": min(title_rect["top"], currency_rect["top"]),
            "right": max(title_rect["right"], currency_rect["right"]),
            "bottom": max(title_rect["bottom"], currency_rect["bottom"]),
        }
        return self._bounded_region(union_rect, pad_h * 1.50, pad_h * 0.80, union_rect["bottom"] + pad_h * 0.80)

    def _currency_dropdown_region(self, context):
        rect = _box_rect(context["currency"]["box"])
        width = max(1, rect["right"] - rect["left"])
        height = max(1, rect["bottom"] - rect["top"])
        return self._bounded_region(rect, width * 0.75, height * 0.25)

    def _layout_anchor_matches(self, current, previous, currency=False):
        rect, old = _box_rect(current["box"]), _box_rect(previous["box"])
        height = max(1, old["bottom"] - old["top"])
        tolerance = max(2, height * 0.20)
        edges = ("left", "top", "bottom") if currency else ("left", "top", "right", "bottom")
        return all(abs(rect[edge] - old[edge]) <= tolerance for edge in edges)

    def _local_price_context(self, layout):
        region = self._local_context_region(layout)
        popup = self._popup_region()
        if region["width"] * region["height"] >= popup["width"] * popup["height"] * 0.35:
            raise ItemSkip("price_window_layout_changed")
        candidates = self.capture_ocr(region)
        title = _unique_exact(candidates, self.anchor("priceTitle"), "price_window_anchor_missing", 0.75)
        if not self._layout_anchor_matches(title, layout["title"]):
            raise ItemSkip("price_window_layout_changed")
        currency_candidates = [candidate for candidate in candidates
                               if normalize_text(candidate.get("text")) in currency_text_map(self.language())]
        currency = select_unique_currency(currency_candidates, language=self.language())
        candidate = _unique_exact(currency_candidates, self.currency_aliases(currency), "currency_ocr_uncertain")
        if not self._layout_anchor_matches(candidate, layout["currency"], currency=True):
            raise ItemSkip("price_window_layout_changed")
        return {"title": title, "currency": candidate, "currencyCode": currency,
                "submit": layout["submit"], "candidates": [title, candidate, layout["submit"]]}

    def price_context(self):
        if self._price_context is not None:
            return self._price_context
        started = time.perf_counter()
        popup = self._popup_region()
        context = None
        recognition_path = "local"
        layout = self._price_layout
        if layout is not None and layout["popup"] == popup:
            try:
                context = self._local_price_context(layout)
            except ItemSkip:
                self._price_layout = None
        if context is None:
            recognition_path = "full"
            self._price_layout = None
            candidates = self.capture_ocr(popup)
            context = self._price_context_from_candidates(candidates)
            # 独立拷贝几何，不把当前通货代码或物品状态带到下一件。
            self._price_layout = {key: {"box": [list(point) for point in context[key]["box"]]}
                                  for key in ("title", "currency", "submit")}
            self._price_layout["submit"].update(text=context["submit"]["text"], score=context["submit"]["score"])
            self._price_layout["popup"] = dict(popup)
        self._price_context = context
        self._price_window_open_observation = True
        self.trace_timing("price_context", started, recognition=recognition_path)
        return context

    def price_window_open(self):
        if self._price_window_open_observation is not None:
            return self._price_window_open_observation
        candidates = self.capture_ocr(self._popup_region())
        try:
            _unique_exact(candidates, self.anchor("priceTitle"), "price_window_anchor_missing", 0.75)
            is_open = True
        except ItemSkip:
            is_open = False
        self._price_window_open_observation = is_open
        if not is_open:
            self._price_context = None
        else:
            try:
                self._price_context = self._price_context_from_candidates(candidates)
            except ItemSkip:
                self._price_context = None
        return is_open

    def _input_point(self, context):
        rect = _box_rect(context["currency"]["box"])
        height = max(1, rect["bottom"] - rect["top"])
        return (int(round(rect["left"] - height * 2.35)), int(round((rect["top"] + rect["bottom"]) / 2)))

    def move(self, point):
        require_game_foreground()
        target = (int(round(point[0])), int(round(point[1])))
        if sys.platform == "win32":
            if not ctypes.windll.user32.SetCursorPos(target[0], target[1]):
                raise PageAbort("input_privilege_mismatch")
        else:
            self.mouse.position = target
        self.sleep(0.03)
        actual = self.mouse.position
        if abs(int(actual[0]) - target[0]) > 3 or abs(int(actual[1]) - target[1]) > 3:
            self.sleep(0.03)
            actual = self.mouse.position
            if abs(int(actual[0]) - target[0]) > 3 or abs(int(actual[1]) - target[1]) > 3:
                raise PageAbort("input_privilege_mismatch")

    def click(self, point, button=None, count=1):
        require_game_foreground()
        self.move(point)
        if button == self.Button.right:
            self._price_open_started = time.perf_counter()
        self.mouse.click(button or self.Button.left, count)
        self.sleep(0.04)

    def double_click_price(self):
        if hasattr(self, "pyperclip"):
            try:
                self.pyperclip.copy("")
            except Exception:
                pass
        self.click(self._input_point(self.price_context()), self.Button.left, 2)

    def hotkey(self, *keys):
        require_game_foreground()
        mapping = {"ctrl": self.Key.ctrl, "shift": self.Key.shift, "alt": self.Key.alt}
        resolved = [mapping.get(key, key) for key in keys]
        pressed = []
        try:
            for key in resolved:
                self.keyboard.press(key)
                pressed.append(key)
            self.sleep(0.02)
        finally:
            for key in reversed(pressed):
                try:
                    self.keyboard.release(key)
                except Exception:
                    pass
        if keys == ("ctrl", "c"):
            self._expect_clipboard_copy = True
            self.sleep(0.015)
        else:
            self.sleep(0.03)
        if keys == ("ctrl", "v"):
            self.trace_timing("right_click_to_price_written", self._price_open_started)

    def _wait_clipboard(self, timeout=0.14, interval=0.015):
        deadline = time.perf_counter() + timeout
        max_polls = max(1, int(timeout / interval) + 1)
        for _ in range(max_polls):
            require_game_foreground()
            value = str(self.pyperclip.paste() or "").strip()
            if value:
                return value
            if time.perf_counter() >= deadline:
                break
            self.sleep(interval)
        return str(self.pyperclip.paste() or "").strip()

    def read_clipboard(self):
        if getattr(self, "_expect_clipboard_copy", False):
            self._expect_clipboard_copy = False
            return self._wait_clipboard(timeout=0.14, interval=0.015)
        return str(self.pyperclip.paste() or "").strip()

    def write_clipboard(self, value):
        self.pyperclip.copy(str(value))
        self.sleep(0.015)

    def recognize_current_currency(self, force_refresh=False):
        context = self.price_context()
        if force_refresh or not context.get("currencyCode"):
            candidates = self.capture_ocr(self._currency_region(context))
            currency = select_unique_currency(candidates, language=self.language())
            currency_text = self.currency_aliases(currency)
            currency_candidate = _unique_exact(candidates, currency_text, "currency_ocr_uncertain")
            context = {**context, "currency": currency_candidate, "currencyCode": currency}
            self._price_context = context
            self._price_window_open_observation = True
        return context["currencyCode"]

    def choose_currency(self, currency):
        if currency not in CURRENCY_NAME:
            raise ItemSkip("currency_unsupported")
        context = self.price_context()
        selector_rect = _box_rect(context["currency"]["box"])
        self.click(_box_center(context["currency"]["box"]))
        candidates = self.capture_ocr(self._currency_dropdown_region(context))
        expected = {normalize_text(value) for value in self.currency_aliases(currency)}
        dropdown = []
        for candidate in candidates:
            if normalize_text(candidate.get("text")) not in expected or float(candidate.get("score", 0)) < MIN_OCR_SCORE:
                continue
            rect = _box_rect(candidate["box"])
            if rect["top"] > selector_rect["bottom"] and rect["left"] < selector_rect["right"] + (selector_rect["right"] - selector_rect["left"]):
                dropdown.append(candidate)
        if len(dropdown) != 1:
            raise ItemSkip("currency_option_uncertain")
        self.click(_box_center(dropdown[0]["box"]))
        context["currencyCode"] = None
        self._price_window_open_observation = True

    def click_submit_once(self):
        context = self.price_context()
        title_region = None
        title_frame = None
        try:
            title_region = self._title_region(context)
            if hasattr(self, "capture") and hasattr(self, "np") and hasattr(self, "cv2") and hasattr(self, "mss"):
                title_frame = self.capture(title_region)
        except Exception:
            title_frame = None
        self._last_submit_title_region = title_region
        self._last_submit_title_frame = title_frame
        self.click(_box_center(context["submit"]["box"]))
        self.sleep(0.05)
        self._price_context = None
        self._price_window_open_observation = None

    def press_escape(self):
        require_game_foreground()
        self.keyboard.press(self.Key.esc)
        self.keyboard.release(self.Key.esc)
        self.sleep(0.12)
        self._price_context = None
        self._price_window_open_observation = None
        self._last_submit_title_region = None
        self._last_submit_title_frame = None

    def grid_center(self, column, row):
        return (
            self.grid["left"] + (column + 0.5) * self.grid["width"] / GRID_COLUMNS,
            self.grid["top"] + (row + 0.5) * self.grid["height"] / GRID_ROWS,
        )

    def clear_grid_hover(self):
        """将鼠标移出市集网格，避免物品提示层干扰后续页面与网格复检。"""
        monitor = self._monitor()
        margin = max(8, int(round(min(
            self.grid["width"] / GRID_COLUMNS,
            self.grid["height"] / GRID_ROWS,
        ) * 0.35)))
        center_x = self.grid["left"] + self.grid["width"] / 2
        center_y = self.grid["top"] + self.grid["height"] / 2
        candidates = (
            (self.grid["left"] - margin, center_y),
            (self.grid["left"] + self.grid["width"] + margin, center_y),
            (center_x, self.grid["top"] - margin),
            (center_x, self.grid["top"] + self.grid["height"] + margin),
            (self.grid["left"] - margin, self.grid["top"] - margin),
            (self.grid["left"] + self.grid["width"] + margin, self.grid["top"] - margin),
            (self.grid["left"] - margin, self.grid["top"] + self.grid["height"] + margin),
            (self.grid["left"] + self.grid["width"] + margin,
             self.grid["top"] + self.grid["height"] + margin),
        )
        monitor_right = monitor["left"] + monitor["width"]
        monitor_bottom = monitor["top"] + monitor["height"]
        point = next((candidate for candidate in candidates
                      if monitor["left"] <= candidate[0] < monitor_right
                      and monitor["top"] <= candidate[1] < monitor_bottom), None)
        if point is None:
            raise PageAbort("grid_invalid")
        self.move(point)

    def copy_item_at(self, column, row):
        point = self.grid_center(column, row)
        self.move(point)
        try:
            self.pyperclip.copy("")
        except Exception as exc:
            raise PageAbort("item_clipboard_invalid") from exc
        require_game_foreground()
        try:
            self.keyboard.press(self.Key.ctrl)
            self.sleep(0.015)
            self.keyboard.press("c")
            self.sleep(0.015)
            self.keyboard.release("c")
            self.sleep(0.015)
            self.keyboard.release(self.Key.ctrl)
        finally:
            try:
                self.keyboard.release("c")
                self.keyboard.release(self.Key.ctrl)
            except Exception:
                pass
        return self._wait_clipboard(timeout=0.11, interval=0.015)

    def open_price_at(self, column, row):
        self._price_context = None
        self._price_window_open_observation = None
        before_title = None
        title_region = None
        layout = getattr(self, "_price_layout", None)
        can_capture = hasattr(self, "capture") and hasattr(self, "np") and hasattr(self, "cv2") and hasattr(self, "mss")
        if layout is not None and can_capture:
            try:
                title_region = self._title_region(layout)
                before_title = self.capture(title_region)
            except Exception:
                before_title = None
        self.click(self.grid_center(column, row), self.Button.right)
        if before_title is not None and title_region is not None:
            deadline = time.perf_counter() + 0.22
            for _ in range(9):
                self.sleep(0.025)
                try:
                    if self._frame_diff(before_title, self.capture(title_region)) >= 6.0:
                        self.sleep(0.015)
                        break
                except Exception:
                    break
                if time.perf_counter() >= deadline:
                    break
        else:
            self.sleep(0.11)
        self.price_context()

    def _title_present(self, candidates):
        try:
            _unique_exact(candidates, self.anchor("priceTitle"), "price_window_anchor_missing", 0.75)
            return True
        except ItemSkip:
            return False

    def submission_result(self):
        started = time.perf_counter()
        title_region = getattr(self, "_last_submit_title_region", None)
        before_frame = getattr(self, "_last_submit_title_frame", None)
        self._last_submit_title_region = None
        self._last_submit_title_frame = None
        can_capture = hasattr(self, "capture") and hasattr(self, "np") and hasattr(self, "cv2") and hasattr(self, "mss")

        if title_region is not None:
            if before_frame is not None and can_capture:
                deadline = started + 0.45
                last_ocr_at = -1.0
                for step in range(13):
                    elapsed = time.perf_counter() - started
                    diff = float("inf")
                    try:
                        diff = self._frame_diff(before_frame, self.capture(title_region))
                    except Exception:
                        pass
                    should_ocr = (diff >= 6.0) or (elapsed >= 0.12 and (last_ocr_at < 0 or elapsed - last_ocr_at >= 0.08)) or step == 12
                    if should_ocr:
                        last_ocr_at = elapsed
                        if not self._title_present(self.capture_ocr(title_region)):
                            self._price_window_open_observation = False
                            self._price_context = None
                            self.trace_timing("submission_ocr", started, path="fast_close")
                            self.trace_timing("open_to_submission_result", self._price_open_started, path="fast_close")
                            return "repriced"
                    if time.perf_counter() >= deadline:
                        break
                    self.sleep(0.035)
            else:
                if not self._title_present(self.capture_ocr(title_region)):
                    self._price_window_open_observation = False
                    self._price_context = None
                    self.trace_timing("submission_ocr", started, path="fast_close")
                    self.trace_timing("open_to_submission_result", self._price_open_started, path="fast_close")
                    return "repriced"

        candidates = self.capture_ocr(self._popup_region())
        self.trace_timing("submission_ocr", started, path="full_fallback")
        self.trace_timing("open_to_submission_result", self._price_open_started, path="full_fallback")
        warning_words = ("冷却", "频繁", "警告", "错误", "无法", "冷卻", "頻繁", "錯誤", "無法",
                         "cooldown", "toooften", "warning", "error", "cannot", "unable", "ratelimit")
        has_warning = any(any(word in normalize_text(candidate.get("text")) for word in warning_words)
                          and float(candidate.get("score", 0)) >= 0.70 for candidate in candidates)
        window_open = self._title_present(candidates)
        self._price_window_open_observation = window_open
        self._price_context = None
        if window_open:
            try:
                self._price_context = self._price_context_from_candidates(candidates)
            except ItemSkip:
                pass
        if has_warning:
            return "submit_warning"
        if window_open:
            return "submit_abnormal"
        return "repriced"

    def release_inputs(self):
        for key in (self.Key.ctrl, self.Key.ctrl_l, self.Key.ctrl_r,
                    self.Key.shift, self.Key.shift_l, self.Key.shift_r,
                    self.Key.alt, self.Key.alt_l, self.Key.alt_r):
            try:
                self.keyboard.release(key)
            except Exception:
                pass
        for button in (self.Button.left, self.Button.right, self.Button.middle):
            try:
                self.mouse.release(button)
            except Exception:
                pass


def perform_readonly_preflight(config, adapter):
    ok, reason = validate_grid_calibration(config.get("gridCalibration"))
    if not ok:
        raise PageAbort(reason)
    require_game_foreground()
    adapter.validate_page()
    adapter.validate_grid_structure()


def _item_event(item_name, grid, reason_code, plan=None, old_price=None, old_currency=""):
    plan = plan or {}
    emit(
        "item",
        itemName=item_name[:60],
        grid=grid,
        oldPrice=old_price,
        oldCurrency=old_currency if old_currency in CURRENCY_NAME else "",
        newPrice=plan.get("newPrice"),
        newCurrency=plan.get("newCurrency", "") if plan.get("newCurrency") in CURRENCY_NAME else "",
        reasonCode=reason_code,
    )


def trace_run_timing(stage, started, **metrics):
    if os.environ.get("FAUSTUS_TIMING") == "1" and started is not None:
        print("FAUSTUS_TIMING " + json.dumps({
            "stage": stage, "ms": round((time.perf_counter() - started) * 1000, 2),
            **metrics,
        }), file=sys.stderr, flush=True)


def run_repricing(config, adapter, preflight_done=False):
    parsed_config = validate_pricing_config(config)
    emit("stage", stage="scanning")
    scan_started = time.perf_counter()
    cells = (adapter.candidate_cells() if hasattr(adapter, "candidate_cells")
             else [(column, row) for row in range(GRID_ROWS) for column in range(GRID_COLUMNS)])
    cells = sorted(cells, key=lambda cell: (cell[1], cell[0]))
    trace_run_timing("occupancy_scan", scan_started)
    resolved_slots = set()
    attempted_slots = set()
    empty_slots = set()
    probe_cache = {}
    text_cache = {}
    previous_submit_started = None
    item_footprints = config.get("item_footprints", {})
    total = len(cells)
    processed = 0
    checked_items = 0
    initial_recheck_needed = not preflight_done
    for column, row in cells:
        candidate_key = (column, row)
        already_handled = candidate_key in resolved_slots or candidate_key in attempted_slots
        if not already_handled and (initial_recheck_needed or (checked_items > 0 and checked_items % GRID_COLUMNS == 0)):
            initial_recheck_needed = False
            emit("stage", stage="preflight")
            started = time.perf_counter()
            require_game_foreground()
            adapter.clear_grid_hover()
            adapter.validate_page()
            adapter.validate_grid_structure()
            trace_run_timing("page_recheck", started)
        require_game_foreground()
        processed += 1
        grid_label = f"{column + 1},{row + 1}"
        if already_handled:
            emit("progress", processed=processed, total=total)
            continue
        checked_items += 1
        emit("stage", stage="probing")
        probe_started = time.perf_counter()
        cached = candidate_key in text_cache
        copied = text_cache.get(candidate_key) or adapter.copy_item_at(column, row)
        if not copied:
            attempted_slots.add(candidate_key)
            empty_slots.add(candidate_key)
            probe_cache[candidate_key] = ""
            emit("progress", processed=processed, total=total)
            continue
        parsed_item = parse_item_header(copied, (config.get("runtime_language") or {}).get("itemBaseAliases"))
        item_name = best_effort_item_name(copied)
        footprint = resolve_item_footprint(parsed_item, item_footprints)
        if not footprint:
            attempted_slots.add(candidate_key)
            _item_event(item_name, grid_label, "item_footprint_unknown")
            emit("progress", processed=processed, total=total)
            continue
        footprint_slots = resolve_probed_footprint_slots(
            adapter, candidate_key, footprint, resolved_slots, probe_cache, copied,
            text_cache, excluded_slots=empty_slots)
        trace_run_timing("footprint_probe", probe_started, cached=cached)
        if not footprint_slots:
            attempted_slots.add(candidate_key)
            _item_event(item_name, grid_label, "item_footprint_ambiguous")
            emit("progress", processed=processed, total=total)
            continue
        resolved_slots.update(footprint_slots)
        old_price = None
        old_currency = ""
        plan = None
        window_opened = False
        try:
            emit("stage", stage="opening")
            open_started = time.perf_counter()
            adapter.open_price_at(column, row)
            trace_run_timing("open_price_window", open_started)
            trace_run_timing("submit_to_next_window", previous_submit_started)
            previous_submit_started = None
            window_opened = True
            emit("stage", stage="pricing")
            old_price = read_full_price(adapter)
            old_currency = adapter.recognize_current_currency()
            plan = build_price_plan(config, old_price, old_currency, parsed_config=parsed_config)
            execute_price_transaction(adapter, plan)
            emit("stage", stage="submitting")
            previous_submit_started = time.perf_counter()
            result = adapter.submission_result()
            trace_run_timing("submission_check", previous_submit_started)
            if result != "repriced":
                if adapter.price_window_open():
                    safe_close_price_window(adapter)
                _item_event(item_name, grid_label, result, plan, old_price, old_currency)
            else:
                _item_event(item_name, grid_label, "repriced", plan, old_price, old_currency)
        except ItemSkip as exc:
            if not window_opened:
                window_opened = adapter.price_window_open()
            if window_opened:
                safe_close_price_window(adapter)
            _item_event(item_name, grid_label, exc.reason_code, plan, old_price, old_currency)
        emit("progress", processed=processed, total=total)
    emit("completed", processed=processed, total=total)


def _signal_stop(_signum, _frame):
    global STOP_REQUESTED
    STOP_REQUESTED = True


def load_config(path):
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("invalid config")
    return payload


def _execute_single_run(mode, config_path, adapter=None):
    global STOP_REQUESTED
    STOP_REQUESTED = False
    created_adapter = adapter is None
    previous_clipboard = None
    try:
        config = load_config(config_path)
        emit("stage", stage="loading")
        started = time.perf_counter()
        if adapter is None:
            adapter = GameAdapter(config)
        else:
            adapter.reset_run(config)
        trace_run_timing("adapter_load", started)
        previous_clipboard = adapter.read_clipboard()
        emit("stage", stage="preflight")
        started = time.perf_counter()
        perform_readonly_preflight(config, adapter)
        trace_run_timing("initial_preflight", started)
        if mode == "preflight":
            emit("preflight-ok")
        else:
            run_repricing(config, adapter, preflight_done=True)
        return 0
    except PageAbort as exc:
        emit("aborted", reasonCode=exc.reason_code)
        return 2
    except ItemSkip as exc:
        emit("error", reasonCode=exc.reason_code)
        return 3
    except Exception:
        # 未分类异常可能携带本地路径或第三方库上下文；只输出稳定原因码。
        emit("error", reasonCode="script_error")
        return 1
    finally:
        if adapter is not None:
            adapter.release_inputs()
            if previous_clipboard is not None:
                try:
                    adapter.write_clipboard(previous_clipboard)
                except Exception:
                    pass
            if created_adapter:
                adapter.close()


def run_worker_loop(stdin_stream=None, adapter_factory=None):
    """常驻工作模式：预热识别组件并逐轮接受 stdin 指令，每轮清空单轮缓存。"""
    global STOP_REQUESTED
    stream = sys.stdin if stdin_stream is None else stdin_stream
    adapter = None
    try:
        started = time.perf_counter()
        adapter = adapter_factory() if adapter_factory is not None else GameAdapter(None)
        if adapter_factory is None:
            _ocr_engine()
        trace_run_timing("worker_warmup", started)
        emit("worker-ready")
        for raw_line in stream:
            if STOP_REQUESTED:
                break
            line = str(raw_line or "").strip()
            if not line:
                continue
            try:
                message = json.loads(line)
            except Exception:
                emit("error", reasonCode="script_error")
                break
            cmd = message.get("cmd") if isinstance(message, dict) else None
            if cmd == "shutdown":
                break
            if cmd != "run":
                emit("error", reasonCode="script_error")
                break
            config_path = str(message.get("configPath") or "")
            if not config_path:
                emit("error", reasonCode="script_error")
                break
            exit_code = _execute_single_run("run", config_path, adapter=adapter)
            if exit_code != 0:
                return exit_code
        return 0
    except Exception:
        emit("error", reasonCode="script_error")
        return 1
    finally:
        if adapter is not None:
            adapter.release_inputs()
            adapter.close()


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("preflight", "run", "worker"), required=True)
    parser.add_argument("--config", required=False)
    args = parser.parse_args(argv)
    signal.signal(signal.SIGTERM, _signal_stop)
    if hasattr(signal, "SIGBREAK"):
        signal.signal(signal.SIGBREAK, _signal_stop)
    if args.mode == "worker":
        return run_worker_loop()
    if not args.config:
        emit("error", reasonCode="script_error")
        return 1
    return _execute_single_run(args.mode, args.config)


if __name__ == "__main__":
    raise SystemExit(main())
