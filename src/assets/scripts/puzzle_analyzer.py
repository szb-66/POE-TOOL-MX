from __future__ import annotations

import argparse
import base64
import ctypes
from ctypes import wintypes
import hashlib
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

import cv2
import mss
import numpy as np


ROWS = 10
COLS = 6
ATLAS_ROWS = 3
ATLAS_COLS = 3
TYPE_ORDER = ("endpoint", "straight", "corner", "tee", "cross")
MASK_VARIANTS = {
    "endpoint": (1, 2, 4, 8),
    "straight": (5, 10),
    "corner": (3, 6, 12, 9),
    "tee": (11, 7, 14, 13),
    "cross": (15,),
}
MIN_COMPONENT_AREA = 24
STANDARD_RECOGNITION = {
    "greenLower": (35, 70, 80),
    "greenUpper": (100, 255, 255),
    "darkScale": 0.85,
}
CALIBRATION_FEATURE_VERSION = 2
CALIBRATION_FEATURE_LENGTH = 128
CALIBRATION_SIMILARITY = 0.965
LIVE_CAPTURE_ATTEMPTS = 3
LIVE_CAPTURE_RETRY_SECONDS = 0.25
RETRYABLE_CAPTURE_ERRORS = frozenset({"EMPTY_GRID_UNCERTAIN"})
GAME_WINDOW_TITLES = ("流放之路", "Path of Exile")
_game_window_titles_cache = GAME_WINDOW_TITLES
_game_window_titles_mtime_ns = None
GAME_WINDOW_PROCESS_NAMES = ("PathOfExile.exe", "PathOfExile_x64.exe", "PathOfExileSteam.exe", "PathOfExile_x64Steam.exe", "PathOfExileEGS.exe", "PathOfExile_x64EGS.exe")
_game_window_process_names_cache = GAME_WINDOW_PROCESS_NAMES
_game_window_process_names_mtime_ns = None


class EvidenceCaptureUnavailable(RuntimeError):
    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


def game_window_titles() -> tuple[str, ...]:
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


def game_window_title_priority(title: str) -> int:
    folded = str(title or "").casefold()
    return next((priority for priority, expected_title in enumerate(game_window_titles()) if expected_title.casefold() in folded), -1)


def game_window_process_names() -> tuple[str, ...]:
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


def window_process_name(hwnd: int) -> str:
    if os.name != "nt" or not hwnd:
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


def window_matches_game(hwnd: int) -> bool:
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


def enable_per_monitor_dpi_awareness() -> None:
    if os.name != "nt":
        return
    try:
        ctypes.windll.user32.SetProcessDpiAwarenessContext(ctypes.c_void_p(-4))
    except Exception:
        try:
            ctypes.windll.shcore.SetProcessDpiAwareness(2)
        except Exception:
            pass


enable_per_monitor_dpi_awareness()


def emit(payload: dict[str, Any]) -> None:
    print("RESULT " + json.dumps(payload, ensure_ascii=False), flush=True)


def fail(code: str, message: str, **details: Any) -> dict[str, Any]:
    return {"success": False, "error": {"code": code, "message": message, **details}}


def load_json(path: str | Path) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def load_image(path: str | Path) -> np.ndarray | None:
    encoded = np.fromfile(str(path), dtype=np.uint8)
    if encoded.size == 0:
        return None
    return cv2.imdecode(encoded, cv2.IMREAD_COLOR)


def foreground_game_title() -> str:
    if os.name != "nt":
        return ""
    user32 = ctypes.windll.user32
    hwnd = user32.GetForegroundWindow()
    length = user32.GetWindowTextLengthW(hwnd)
    title = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, title, length + 1)
    return title.value


def is_game_foreground() -> bool:
    return window_matches_game(ctypes.windll.user32.GetForegroundWindow())


def rectangle_edges(rectangle: dict[str, Any]) -> tuple[int, int, int, int]:
    left = int(round(float(rectangle.get("left", rectangle.get("x", 0)))))
    top = int(round(float(rectangle.get("top", rectangle.get("y", 0)))))
    right = int(round(float(rectangle.get("right", left + rectangle.get("width", 0)))))
    bottom = int(round(float(rectangle.get("bottom", top + rectangle.get("height", 0)))))
    return left, top, right, bottom


def rectangle_payload(left: int, top: int, right: int, bottom: int) -> dict[str, int]:
    return {"left": int(left), "top": int(top), "width": int(right - left), "height": int(bottom - top)}


def game_client_bounds(hwnd: int) -> dict[str, int]:
    if os.name != "nt" or not hwnd or not window_matches_game(hwnd):
        raise EvidenceCaptureUnavailable("WINDOW_BOUNDS_UNAVAILABLE")
    user32 = ctypes.windll.user32
    client = wintypes.RECT()
    origin = wintypes.POINT(0, 0)
    if not user32.GetClientRect(hwnd, ctypes.byref(client)) or not user32.ClientToScreen(hwnd, ctypes.byref(origin)):
        raise EvidenceCaptureUnavailable("WINDOW_BOUNDS_UNAVAILABLE")
    left, top = int(origin.x), int(origin.y)
    right, bottom = left + int(client.right - client.left), top + int(client.bottom - client.top)
    if right <= left or bottom <= top:
        raise EvidenceCaptureUnavailable("WINDOW_BOUNDS_INVALID")
    return rectangle_payload(left, top, right, bottom)


def capture_game_window_frame(config: dict[str, Any]) -> dict[str, Any]:
    """一次只读截图同时派生完整游戏客户区和实际识别裁剪，绝不扩大到桌面。"""
    if os.name != "nt":
        raise EvidenceCaptureUnavailable("UNSUPPORTED_PLATFORM")
    user32 = ctypes.windll.user32
    hwnd = int(user32.GetForegroundWindow() or 0)
    if not hwnd or not window_matches_game(hwnd):
        raise EvidenceCaptureUnavailable("GAME_WINDOW_NOT_FOREGROUND")
    window_bounds = game_client_bounds(hwnd)
    window_left, window_top, window_right, window_bottom = rectangle_edges(window_bounds)
    region_left, region_top, region_right, region_bottom = rectangle_edges(config.get("region") or {})
    if region_left < window_left or region_top < window_top or region_right > window_right or region_bottom > window_bottom:
        raise EvidenceCaptureUnavailable("CROP_OUTSIDE_GAME_WINDOW")
    display_bounds = config.get("displayBounds")
    if not isinstance(display_bounds, dict):
        raise EvidenceCaptureUnavailable("MONITOR_BOUNDS_UNAVAILABLE")
    display_left, display_top, display_right, display_bottom = rectangle_edges(display_bounds)
    if display_right <= display_left or display_bottom <= display_top:
        raise EvidenceCaptureUnavailable("MONITOR_BOUNDS_INVALID")
    if region_left < display_left or region_top < display_top or region_right > display_right or region_bottom > display_bottom:
        raise EvidenceCaptureUnavailable("CROP_OUTSIDE_MONITOR")
    monitor = {"left": window_left, "top": window_top, "width": window_right - window_left, "height": window_bottom - window_top}
    with mss.mss() as capture:
        window_image = np.asarray(capture.grab(monitor))[:, :, :3]
    if window_image.size == 0:
        raise EvidenceCaptureUnavailable("WINDOW_CAPTURE_EMPTY")
    relative_left, relative_top = region_left - window_left, region_top - window_top
    relative_right, relative_bottom = region_right - window_left, region_bottom - window_top
    crop = window_image[relative_top:relative_bottom, relative_left:relative_right]
    if crop.size == 0 or crop.shape[1] != region_right - region_left or crop.shape[0] != region_bottom - region_top:
        raise EvidenceCaptureUnavailable("CROP_DERIVATION_FAILED")
    return {
        "image": crop,
        "windowImage": window_image,
        "windowBounds": window_bounds,
        "monitorBounds": rectangle_payload(display_left, display_top, display_right, display_bottom),
        "actualCrop": rectangle_payload(relative_left, relative_top, relative_right, relative_bottom),
    }


def safe_hover_point(region: dict[str, Any], display_bounds: dict[str, Any] | None) -> tuple[int, int]:
    """选择同一显示器内且位于识别区域外的中性悬停点。"""
    if not isinstance(display_bounds, dict):
        raise ValueError("缺少显示器物理边界，无法选择安全悬停点")
    display_left, display_top, display_right, display_bottom = rectangle_edges(display_bounds)
    if display_right <= display_left or display_bottom <= display_top:
        raise ValueError("显示器物理边界无效，无法选择安全悬停点")
    region_left, region_top, region_right, region_bottom = rectangle_edges(region)
    width = display_right - display_left
    height = display_bottom - display_top
    padding = max(16, round(min(width, height) * 0.015))
    candidates = [
        (display_left + width // 2, display_top + height // 2),
        (display_left + width * 3 // 4, display_top + height // 2),
        (display_left + width // 2, display_top + height * 3 // 4),
        (display_left + width * 3 // 4, display_top + height * 3 // 4),
        (display_left + width // 4, display_top + height * 3 // 4),
        (display_left + width * 3 // 4, display_top + height // 4),
        (display_left + width // 4, display_top + height // 4),
    ]

    def inside_region(point: tuple[int, int]) -> bool:
        x, y = point
        return (
            region_left - padding <= x <= region_right + padding
            and region_top - padding <= y <= region_bottom + padding
        )

    for x, y in candidates:
        if not (display_left + padding <= x <= display_right - padding):
            continue
        if not (display_top + padding <= y <= display_bottom - padding):
            continue
        if not inside_region((x, y)):
            return x, y
    raise ValueError("当前显示器内找不到碎片区域外的安全悬停点")


def click_inventory_tab(point: dict[str, Any], hover_point: tuple[int, int], settle_seconds: float = 0.25) -> None:
    if os.name != "nt":
        raise RuntimeError("仓库自动切页目前仅支持 Windows")
    if not is_game_foreground():
        raise RuntimeError("游戏窗口未处于前台，未执行仓库页签点击")
    x = int(point["x"])
    y = int(point["y"])
    user32 = ctypes.windll.user32
    user32.SetCursorPos(x, y)
    if not is_game_foreground():
        raise RuntimeError("移动到仓库页签后游戏失去前台，未执行点击")
    user32.mouse_event(0x0002, 0, 0, 0, 0)
    try:
        time.sleep(0.04)
    finally:
        user32.mouse_event(0x0004, 0, 0, 0, 0)
    if not user32.SetCursorPos(int(hover_point[0]), int(hover_point[1])):
        raise RuntimeError("分页后无法将鼠标移出识别区域")
    time.sleep(max(0.16, float(settle_seconds)))


def region_monitor(region: dict[str, Any], columns: int = COLS, rows: int = ROWS) -> dict[str, int]:
    left = int(round(float(region.get("left", region.get("x", 0)))))
    top = int(round(float(region.get("top", region.get("y", 0)))))
    right = int(round(float(region.get("right", left + region.get("width", 0)))))
    bottom = int(round(float(region.get("bottom", top + region.get("height", 0)))))
    width = right - left
    height = bottom - top
    if width < columns * 20 or height < rows * 20:
        raise ValueError(f"区域过小，请完整框选 {columns}×{rows} 网格")
    return {"left": left, "top": top, "width": width, "height": height}


def png_data_url(image: np.ndarray) -> str:
    thumbnail = cv2.resize(image, (48, 48), interpolation=cv2.INTER_AREA)
    success, encoded = cv2.imencode(".png", thumbnail, [cv2.IMWRITE_PNG_COMPRESSION, 6])
    return "" if not success else "data:image/png;base64," + base64.b64encode(encoded).decode("ascii")


def calibration_feature(cell: np.ndarray) -> list[float]:
    height, width = cell.shape[:2]
    roi = cell[: max(1, round(height * 0.62)), round(width * 0.32): max(1, round(width * 0.96))]
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    green = cv2.inRange(hsv, np.array(STANDARD_RECOGNITION["greenLower"]), np.array(STANDARD_RECOGNITION["greenUpper"]))
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    green_small = cv2.resize(green, (8, 8), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    dark_small = 1.0 - cv2.resize(gray, (8, 8), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    vector = np.concatenate((green_small.reshape(-1), dark_small.reshape(-1)))
    norm = float(np.linalg.norm(vector))
    if norm > 0:
        vector /= norm
    return [round(float(value), 7) for value in vector]


def calibration_match(
    feature: list[float], samples: list[dict[str, Any]] | None,
    fragment_type: str | None = None, empty_only: bool = False,
) -> tuple[int, float] | None:
    if len(feature) != CALIBRATION_FEATURE_LENGTH or not samples:
        return None
    vector = np.asarray(feature, dtype=np.float32)
    votes: dict[int, float] = {}
    best_similarity = 0.0
    for sample in samples:
        values = sample.get("featureVector") if isinstance(sample, dict) else None
        label = sample.get("labelMask") if isinstance(sample, dict) else None
        kind = str(sample.get("kind") or "") if isinstance(sample, dict) else ""
        sample_type = str(sample.get("type") or "") if isinstance(sample, dict) else ""
        if sample.get("featureVersion") != CALIBRATION_FEATURE_VERSION or not isinstance(values, list) or len(values) != CALIBRATION_FEATURE_LENGTH:
            continue
        try:
            label = int(label)
            candidate = np.asarray(values, dtype=np.float32)
        except (TypeError, ValueError):
            continue
        if label < 0 or label > 15 or not np.isfinite(candidate).all():
            continue
        if empty_only:
            if kind != "empty" or label != 0:
                continue
        elif not fragment_type or kind != "fragment" or sample_type != fragment_type or label not in MASK_VARIANTS.get(fragment_type, ()):
            continue
        norm = float(np.linalg.norm(candidate))
        similarity = float(vector @ (candidate / norm)) if norm > 0 else 0.0
        if similarity < CALIBRATION_SIMILARITY:
            continue
        votes[label] = votes.get(label, 0.0) + similarity - CALIBRATION_SIMILARITY + 1e-4
        best_similarity = max(best_similarity, similarity)
    if not votes:
        return None
    ranked = sorted(votes.items(), key=lambda item: (-item[1], item[0]))
    if len(ranked) > 1 and ranked[0][1] < ranked[1][1] * 1.5:
        return None
    return ranked[0][0], round(best_similarity, 6)


def direction_candidate(
    cell: np.ndarray, component: dict[str, Any], fragment_type: str,
    feature: list[float], samples: list[dict[str, Any]] | None,
) -> dict[str, Any]:
    mask, confidence = inventory_route_topology(cell, fragment_type, component)
    match = calibration_match(feature, samples, fragment_type=fragment_type)
    calibrated = match is not None
    similarity = 0.0
    if match is not None:
        mask, similarity = match
        confidence = similarity
    return {
        "mask": int(mask),
        "orientation": orientation_for_mask(mask),
        "confidence": round(float(confidence), 4),
        "uncertain": float(confidence) < 0.35,
        "calibrated": calibrated,
        "calibrationSimilarity": round(float(similarity), 6),
    }


def grid_metrics(image: np.ndarray, columns: int = COLS, rows: int = ROWS) -> dict[str, Any]:
    """旁路记录网格候选线、间距、偏差与置信度，不参与既有判定阈值。"""
    height, width = image.shape[:2]
    if height < 20 or width < 20:
        return {
            "candidateVerticalLines": [], "candidateHorizontalLines": [],
            "spacing": {"x": None, "y": None}, "deviation": {"mean": None, "max": None}, "confidence": 0.5,
        }
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    dark = (gray < 55).astype(np.uint8)
    vertical_lines = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((max(3, height // 3), 1), np.uint8))
    horizontal_lines = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((1, max(3, width // 3)), np.uint8))
    vertical_sum = vertical_lines.sum(axis=0)
    horizontal_sum = horizontal_lines.sum(axis=1)
    max_deviation = max(2, round(min(width / columns, height / rows) * 0.15))
    vertical_min_strength = max(5, int(vertical_sum.max() * 0.15)) if vertical_sum.size else 5
    horizontal_min_strength = max(5, int(horizontal_sum.max() * 0.15)) if horizontal_sum.size else 5
    deviations: list[float] = []
    found = 0
    expected_count = (columns - 1) + (rows - 1)

    def candidate_positions(values: np.ndarray, minimum: int) -> list[int]:
        indexes = np.flatnonzero(values >= minimum).tolist()
        groups: list[list[int]] = []
        for index in indexes:
            if not groups or index > groups[-1][-1] + 1:
                groups.append([index])
            else:
                groups[-1].append(index)
        return [max(group, key=lambda index: float(values[index])) for group in groups]

    vertical_candidates = candidate_positions(vertical_sum, vertical_min_strength)
    horizontal_candidates = candidate_positions(horizontal_sum, horizontal_min_strength)

    def boundary_deviation(expected: int, values: np.ndarray, minimum: int) -> float:
        nonlocal found
        start = max(0, expected - max_deviation)
        end = min(len(values), expected + max_deviation + 1)
        window = values[start:end]
        if window.size == 0:
            return float(max_deviation)
        position = start + int(np.argmax(window))
        strength = float(window[position - start])
        if strength < minimum:
            return float(max_deviation)
        found += 1
        return float(abs(position - expected))

    for column in range(1, columns):
        deviations.append(boundary_deviation(round(column * width / columns), vertical_sum, vertical_min_strength))
    for row in range(1, rows):
        deviations.append(boundary_deviation(round(row * height / rows), horizontal_sum, horizontal_min_strength))
    if not deviations:
        return {
            "candidateVerticalLines": vertical_candidates, "candidateHorizontalLines": horizontal_candidates,
            "spacing": {"x": None, "y": None}, "deviation": {"mean": None, "max": None}, "confidence": 0.5,
        }
    cell_size = min(width / columns, height / rows)
    confidence = max(0.0, min(1.0, 1.0 - (sum(deviations) / len(deviations)) / (0.08 * cell_size)))
    if found < max(1, round(expected_count * 0.6)):
        confidence = min(confidence, 0.5)
    spacing_x = float(np.median(np.diff(vertical_candidates))) if len(vertical_candidates) > 1 else None
    spacing_y = float(np.median(np.diff(horizontal_candidates))) if len(horizontal_candidates) > 1 else None
    return {
        "candidateVerticalLines": vertical_candidates,
        "candidateHorizontalLines": horizontal_candidates,
        "spacing": {"x": None if spacing_x is None else round(spacing_x, 4), "y": None if spacing_y is None else round(spacing_y, 4)},
        "deviation": {"mean": round(sum(deviations) / len(deviations), 4), "max": round(max(deviations), 4)},
        "confidence": round(confidence, 4),
    }


def grid_confidence(image: np.ndarray, columns: int = COLS, rows: int = ROWS) -> float:
    return float(grid_metrics(image, columns, rows)["confidence"])


def capture_region(region: dict[str, Any], region_type: str = "inventory") -> np.ndarray:
    columns, rows = (ATLAS_COLS, ATLAS_ROWS) if region_type == "atlas" else (COLS, ROWS)
    monitor = region_monitor(region, columns, rows)
    with mss.mss() as capture:
        return np.asarray(capture.grab(monitor))[:, :, :3]


def cell_bounds(width: int, height: int, row: int, column: int, columns: int = COLS, rows: int = ROWS) -> tuple[int, int, int, int]:
    left = round(column * width / columns)
    right = round((column + 1) * width / columns)
    top = round(row * height / rows)
    bottom = round((row + 1) * height / rows)
    return left, top, right, bottom


def largest_green_component(cell: np.ndarray, region_type: str = "inventory") -> dict[str, Any] | None:
    height, width = cell.shape[:2]
    roi = cell if region_type == "atlas" else cell[: max(1, round(height * 0.62)), round(width * 0.32): max(1, round(width * 0.96))]
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    preset = STANDARD_RECOGNITION
    mask = cv2.inRange(hsv, np.array(preset["greenLower"]), np.array(preset["greenUpper"]))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    count, labels, stats, centroids = cv2.connectedComponentsWithStats(mask)
    candidates = [index for index in range(1, count) if int(stats[index, cv2.CC_STAT_AREA]) >= MIN_COMPONENT_AREA]
    if not candidates:
        return None
    index = max(candidates, key=lambda value: int(stats[value, cv2.CC_STAT_AREA]))
    x, y, component_width, component_height, area = [int(value) for value in stats[index]]
    strict_area = max(MIN_COMPONENT_AREA, round(width * height * 0.012))
    return {
        "x": x,
        "y": y,
        "width": component_width,
        "height": component_height,
        "area": area,
        "centroid": [float(value) for value in centroids[index]],
        "cellCentroid": [
            float(round(width * 0.32) + centroids[index][0]) if region_type != "atlas" else float(centroids[index][0]),
            float(centroids[index][1]),
        ],
        "roiWidth": int(roi.shape[1]),
        "roiHeight": int(roi.shape[0]),
        "cellWidth": width,
        "cellHeight": height,
        "candidateState": "clear" if area >= strict_area else "suspect",
    }


def component_features(component: dict[str, Any]) -> list[float]:
    width = component["width"]
    height = component["height"]
    return [
        width / component["cellWidth"],
        height / component["cellHeight"],
        component["area"] / max(1, width * height),
    ]


def type_degree(fragment_type: str) -> int:
    return {"endpoint": 1, "straight": 2, "corner": 2, "tee": 3, "cross": 4}.get(fragment_type, 0)


def type_for_mask(mask: int) -> str | None:
    degree = int(mask & 15).bit_count()
    if degree == 1:
        return "endpoint"
    if degree == 2:
        return "straight" if mask in (5, 10) else "corner"
    if degree == 3:
        return "tee"
    if degree == 4:
        return "cross"
    return None


def orientation_for_mask(mask: int) -> int:
    fragment_type = type_for_mask(mask)
    try:
        return MASK_VARIANTS.get(fragment_type, (mask,)).index(mask) * 90
    except ValueError:
        return 0


def inventory_route_topology(cell: np.ndarray, fragment_type: str, component: dict[str, Any] | None = None) -> tuple[int, float]:
    """从绿色图标内部的黑色航线识别屏幕绝对方向，避免把发光底纹当成线路。"""
    height, width = cell.shape[:2]
    cell_centroid = component.get("cellCentroid") if component else None
    if cell_centroid and cell_centroid[0] > 0 and cell_centroid[1] > 0:
        expected_x = int(round(float(cell_centroid[0])))
        expected_y = int(round(float(cell_centroid[1])))
    else:
        expected_x = round(width * 0.67)
        expected_y = round(height * 0.28)
    value = cv2.cvtColor(cell, cv2.COLOR_BGR2HSV)[:, :, 2]
    preset = STANDARD_RECOGNITION

    calibration_x = max(3, round(width * 0.18))
    calibration_y = max(3, round(height * 0.18))
    calibration = value[
        max(0, expected_y - calibration_y):min(height, expected_y + calibration_y + 1),
        max(0, expected_x - calibration_x):min(width, expected_x + calibration_x + 1),
    ]
    otsu_threshold = cv2.threshold(calibration, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[0]
    dark_threshold = max(70.0, min(120.0, float(otsu_threshold) * preset["darkScale"]))
    dark = value < dark_threshold

    radius_x = max(3, round(width * 0.15))
    radius_y = max(3, round(height * 0.15))
    band_x = max(1, round(width * 0.025))
    band_y = max(1, round(height * 0.025))
    search_radius = max(1, round(min(width, height) * 0.035))
    variants = MASK_VARIANTS.get(fragment_type, ())
    if not variants:
        return 0, 0.0
    best: tuple[float, int, float] | None = None

    for center_y in range(expected_y - search_radius, expected_y + search_radius + 1):
        for center_x in range(expected_x - search_radius, expected_x + search_radius + 1):
            scores = {
                1: float(dark[center_y - radius_y:center_y - 2, center_x - band_x:center_x + band_x + 1].mean()),
                2: float(dark[center_y - band_y:center_y + band_y + 1, center_x + 2:center_x + radius_x].mean()),
                4: float(dark[center_y + 2:center_y + radius_y, center_x - band_x:center_x + band_x + 1].mean()),
                8: float(dark[center_y - band_y:center_y + band_y + 1, center_x - radius_x:center_x - 2].mean()),
            }
            center_score = float(dark[
                center_y - band_y:center_y + band_y + 1,
                center_x - band_x:center_x + band_x + 1,
            ].mean())
            distance = abs(center_x - expected_x) + abs(center_y - expected_y)
            for direction_mask in variants:
                selected = [score for direction, score in scores.items() if direction_mask & direction]
                rejected = [score for direction, score in scores.items() if not direction_mask & direction]
                selected_min = min(selected, default=0.0)
                separation = selected_min - max(rejected, default=0.0)
                separation_confidence = max(0.0, min(1.0, separation + 0.5))
                strength_confidence = max(0.0, min(1.0, selected_min / 0.55))
                confidence = separation_confidence * strength_confidence
                rank = confidence + center_score * 0.5 - distance * 0.015
                candidate = (rank, direction_mask, confidence)
                if best is None or candidate[0] > best[0]:
                    best = candidate

    if best is None:
        return int(variants[0]), 0.0
    return best[1], round(best[2], 4)


def atlas_route_topology(cell: np.ndarray) -> tuple[int, float] | None:
    """识别海图格中以格子中心为起点的黑色航线，隔离格线、外框和角落装饰。"""
    height, width = cell.shape[:2]
    gray = cv2.cvtColor(cell, cv2.COLOR_BGR2GRAY)
    dark = cv2.inRange(gray, 0, 75)
    dark = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))

    # 航线会延伸到格子边缘，右下角航线因此可能经外框与角落装饰连成同一组件。
    # 形态学闭运算后清空外围保护带，只保留足以判断 N/E/S/W 的中央航线段。
    guard_x = max(8, round(width * 0.12))
    guard_y = max(8, round(height * 0.12))
    dark[:guard_y, :] = 0
    dark[-guard_y:, :] = 0
    dark[:, :guard_x] = 0
    dark[:, -guard_x:] = 0

    count, labels, stats, _centroids = cv2.connectedComponentsWithStats(dark)
    center_x, center_y = width // 2, height // 2
    center_half_x = max(8, round(width * 0.12))
    center_half_y = max(8, round(height * 0.12))
    band_x = max(5, round(width * 0.055))
    band_y = max(5, round(height * 0.055))

    def vertical_score(component: np.ndarray, start: int, end: int) -> float:
        segment = component[start:end, max(0, center_x - band_x):min(width, center_x + band_x + 1)]
        return float(np.count_nonzero(np.any(segment, axis=1)) / max(1, segment.shape[0]))

    def horizontal_score(component: np.ndarray, start: int, end: int) -> float:
        segment = component[max(0, center_y - band_y):min(height, center_y + band_y + 1), start:end]
        return float(np.count_nonzero(np.any(segment, axis=0)) / max(1, segment.shape[1]))

    best: tuple[float, int, float] | None = None
    for index in range(1, count):
        area = int(stats[index, cv2.CC_STAT_AREA])
        if area < max(40, round(width * height * 0.001)):
            continue
        component = labels == index
        center = component[
            max(0, center_y - center_half_y):min(height, center_y + center_half_y + 1),
            max(0, center_x - center_half_x):min(width, center_x + center_half_x + 1),
        ]
        if not np.any(center):
            continue
        scores = {
            1: vertical_score(component, guard_y, center_y + 1),
            2: horizontal_score(component, center_x, width - guard_x),
            4: vertical_score(component, center_y, height - guard_y),
            8: horizontal_score(component, guard_x, center_x + 1),
        }
        mask = sum(direction for direction, score in scores.items() if score >= 0.55)
        fragment_type = type_for_mask(mask)
        if not fragment_type:
            continue
        selected = [score for direction, score in scores.items() if mask & direction]
        rejected = [score for direction, score in scores.items() if not mask & direction]
        confidence = min(selected) - max(rejected, default=0.0) + 0.5
        confidence = max(0.0, min(1.0, confidence))
        rank = sum(selected) + confidence
        if best is None or rank > best[0]:
            best = (rank, mask, confidence)
    return None if best is None else (best[1], round(best[2], 4))


def analyze_image(image: np.ndarray, templates: dict[str, Any], region_type: str = "inventory", recognition: dict[str, Any] | None = None,
                  calibration_samples: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    if image is None or image.size == 0:
        payload = fail("CAPTURE_EMPTY", "仓库截图为空")
        payload["_recognitionEvidenceMetrics"] = {"stage": "CAPTURE", "grid": None, "occupiedCount": None, "warningCodes": []}
        return payload
    height, width = image.shape[:2]
    recognition = recognition if isinstance(recognition, dict) else {}
    slots = []
    counts = {fragment_type: 0 for fragment_type in TYPE_ORDER}
    candidate_count = 0
    warnings = []
    type_hints = recognition.get("typeHints") if isinstance(recognition.get("typeHints"), dict) else {}
    columns, rows = (ATLAS_COLS, ATLAS_ROWS) if region_type == "atlas" else (COLS, ROWS)
    for row in range(rows):
        for column in range(columns):
            left, top, right, bottom = cell_bounds(width, height, row, column, columns, rows)
            cell = image[top:bottom, left:right]
            atlas_topology = atlas_route_topology(cell) if region_type == "atlas" else None
            feature = calibration_feature(cell) if region_type == "inventory" else []
            component = None if region_type == "atlas" else largest_green_component(cell, region_type)
            if atlas_topology is not None:
                direction_mask, orientation_confidence = atlas_topology
                fragment_type = type_for_mask(direction_mask)
                confidence = orientation_confidence
                margin = orientation_confidence
                uncertain = orientation_confidence < 0.35
                slot = {
                    "row": row, "column": column, "occupied": True, "type": fragment_type,
                    "mask": direction_mask, "orientation": orientation_for_mask(direction_mask),
                    "orientationConfidence": orientation_confidence,
                    "confidence": confidence, "margin": margin, "uncertain": uncertain,
                    "corrected": False, "features": [],
                }
                slots.append(slot)
                counts[fragment_type] += 1
                if uncertain:
                    warnings.append(f"第 {row + 1} 行第 {column + 1} 列识别置信度不足，请人工确认")
                continue
            if component is None:
                slots.append({
                    "row": row, "column": column, "occupied": False, "type": None,
                    "mask": 0, "orientation": 0, "confidence": 1.0, "orientationConfidence": 1.0,
                    "directionConfidence": 1.0, "margin": 1.0, "uncertain": False,
                    "candidate": False, "candidateState": "empty", "typeSource": None, "shapeLabel": "",
                    "calibrated": False, "calibrationSimilarity": 0.0, "corrected": False,
                    "directionCandidates": {}, "emptyCalibration": {"matched": False, "similarity": 0.0},
                    "tileDataUrl": png_data_url(cell),
                    "calibrationFeature": feature, "featureVersion": CALIBRATION_FEATURE_VERSION,
                })
                continue
            features = component_features(component)
            candidate_count += 1
            direction_candidates = {
                fragment_type: direction_candidate(cell, component, fragment_type, feature, calibration_samples)
                for fragment_type in TYPE_ORDER
            }
            empty_match = calibration_match(feature, calibration_samples, empty_only=True)
            empty_calibration = {
                "matched": empty_match is not None,
                "similarity": 0.0 if empty_match is None else round(float(empty_match[1]), 6),
            }
            hint_type = str(type_hints.get(f"{row}:{column}") or "")
            selected = direction_candidates.get(hint_type)
            occupied = selected is not None
            direction_mask = int(selected.get("mask", 0)) if selected else 0
            direction_confidence = float(selected.get("confidence", 0.0)) if selected else 0.0
            uncertain = not occupied or bool(selected.get("uncertain"))
            slot = {
                "row": row, "column": column, "candidate": True,
                "candidateState": component.get("candidateState", "clear"),
                "occupied": occupied, "type": hint_type if occupied else None,
                "typeSource": "hint" if occupied else None, "shapeLabel": "",
                "mask": direction_mask, "orientation": orientation_for_mask(direction_mask) if direction_mask else 0,
                "orientationConfidence": direction_confidence, "directionConfidence": direction_confidence,
                "confidence": direction_confidence, "margin": 1.0, "uncertain": uncertain,
                "calibrated": bool(selected.get("calibrated")) if selected else False,
                "calibrationSimilarity": float(selected.get("calibrationSimilarity", 0.0)) if selected else 0.0,
                "corrected": False, "features": [round(value, 4) for value in features],
                "directionCandidates": direction_candidates, "emptyCalibration": empty_calibration,
                "tileDataUrl": png_data_url(cell), "calibrationFeature": feature,
                "featureVersion": CALIBRATION_FEATURE_VERSION,
            }
            slots.append(slot)
            if slot["occupied"]:
                counts[slot["type"]] += 1
            if occupied and slot["uncertain"]:
                warnings.append(f"第 {row + 1} 行第 {column + 1} 列识别置信度不足，请人工确认")
    metrics = grid_metrics(image, columns, rows) if region_type == "inventory" else {
        "candidateVerticalLines": [], "candidateHorizontalLines": [],
        "spacing": {"x": None, "y": None}, "deviation": {"mean": None, "max": None}, "confidence": 1.0,
    }
    grid_confidence_value = float(metrics["confidence"])
    occupied_count = sum(counts.values())
    visual_count = candidate_count if region_type != "atlas" else occupied_count
    if visual_count == 0 and region_type != "atlas" and grid_confidence_value < 0.5:
        payload = fail("EMPTY_GRID_UNCERTAIN", "未识别到碎片且网格对齐置信度过低，请重新框选完整仓库")
        payload["_recognitionEvidenceMetrics"] = {"stage": "GRID_ANALYSIS", "grid": metrics, "occupiedCount": 0, "warningCodes": ["GRID_ALIGNMENT_LOW"]}
        return payload
    if visual_count == 0 and region_type != "atlas" and not bool(recognition.get("allowEmpty")):
        payload = fail("NO_FRAGMENTS", "配置区域内未识别到绿色碎片")
        payload["_recognitionEvidenceMetrics"] = {"stage": "FRAGMENT_ANALYSIS", "grid": metrics, "occupiedCount": 0, "warningCodes": []}
        return payload
    grid_alignment = "high" if grid_confidence_value >= 0.8 else "medium" if grid_confidence_value >= 0.5 else "low"
    if grid_confidence_value < 0.5:
        warnings.append("框选网格与游戏网格偏差较大，请重新框选")
    payload = {
        "success": True,
        "slots": slots,
        "counts": counts,
        "warnings": warnings,
        "gridConfidence": grid_confidence_value,
        "gridAlignment": grid_alignment,
        "imageSize": {"width": width, "height": height},
        "occupiedCount": occupied_count,
        "candidateCount": candidate_count if region_type != "atlas" else occupied_count,
        "regionType": region_type,
    }
    payload["_recognitionEvidenceMetrics"] = {
        "stage": "COMPLETED", "grid": metrics, "occupiedCount": visual_count,
        "warningCodes": ["GRID_ALIGNMENT_LOW"] if grid_confidence_value < 0.5 else [],
    }
    return payload


def write_evidence_image(image: np.ndarray, target: Path, kind: str) -> dict[str, Any]:
    if kind == "window":
        success, encoded = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 92, cv2.IMWRITE_JPEG_OPTIMIZE, 1])
        encoding = "jpeg"
    else:
        success, encoded = cv2.imencode(".png", image, [cv2.IMWRITE_PNG_COMPRESSION, 3])
        encoding = "png"
    if not success:
        raise RuntimeError("IMAGE_ENCODING_FAILED")
    body = encoded.tobytes()
    target.write_bytes(body)
    return {
        "encoding": encoding, "width": int(image.shape[1]), "height": int(image.shape[0]),
        "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest(), "status": "complete",
    }


def missing_image(page: int, attempt: int, kind: str, reason: str) -> dict[str, Any]:
    return {
        "attempt": attempt, "page": page, "kind": kind,
        "encoding": "jpeg" if kind == "window" else "png", "status": "missing", "omissionReason": reason,
    }


def encode_attempt_images(
    directory: Path, page: int, attempt: int, window_image: np.ndarray | None, crop_image: np.ndarray | None,
    missing_window_reason: str | None = None, image_writer=write_evidence_image,
) -> tuple[list[dict[str, Any]], list[str]]:
    files: list[dict[str, Any]] = []
    reasons: list[str] = []
    for kind, image, suffix in (("window", window_image, "jpg"), ("crop", crop_image, "png")):
        if image is None or image.size == 0:
            reason = missing_window_reason if kind == "window" and missing_window_reason else "IMAGE_UNAVAILABLE"
            files.append(missing_image(page, attempt, kind, reason))
            reasons.append(reason)
            continue
        file_name = f"page-{page}-attempt-{attempt}-{kind}.{suffix}"
        try:
            metadata = image_writer(image, directory / file_name, kind)
            files.append({"attempt": attempt, "page": page, "kind": kind, "fileName": file_name, **metadata})
        except Exception:
            files.append(missing_image(page, attempt, kind, "IMAGE_ENCODING_FAILED"))
            reasons.append("IMAGE_ENCODING_FAILED")
    return files, reasons


def capture_with_retries(
    config: dict[str, Any],
    templates: dict[str, Any],
    recognition: dict[str, Any],
    capture=capture_region,
    analyzer=analyze_image,
    sleeper=time.sleep,
    frame_capture=None,
    image_writer=write_evidence_image,
) -> dict[str, Any]:
    """切页后只重复读取截图，不重复页签点击或其他输入动作。"""
    region_type = str(config.get("regionType", "inventory"))
    calibration_samples = config.get("calibrationSamples") or []
    attempts = LIVE_CAPTURE_ATTEMPTS if config.get("tabPoint") is not None and region_type == "inventory" else 1
    payload = fail("CAPTURE_EMPTY", "仓库截图为空")
    evidence_directory_value = config.get("evidenceDirectory")
    evidence_id = str(config.get("evidenceId") or "")
    evidence_directory = Path(evidence_directory_value) if evidence_directory_value and evidence_id else None
    evidence_attempts: list[dict[str, Any]] = []
    evidence_files: list[dict[str, Any]] = []
    completeness_reasons: list[str] = []
    occurred_at = None
    if evidence_directory is not None:
        evidence_directory.mkdir(parents=True, exist_ok=True)
    for attempt_index in range(attempts):
        attempt = attempt_index + 1
        captured_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        occurred_at = occurred_at or captured_at
        frame = None
        missing_window_reason = None
        if evidence_directory is not None:
            try:
                frame = (frame_capture or capture_game_window_frame)(config)
                image = frame["image"]
            except EvidenceCaptureUnavailable as error:
                missing_window_reason = error.reason
                completeness_reasons.append(error.reason)
                image = capture(config["region"], region_type)
            except Exception:
                missing_window_reason = "WINDOW_CAPTURE_FAILED"
                completeness_reasons.append(missing_window_reason)
                image = capture(config["region"], region_type)
        else:
            image = capture(config["region"], region_type)
        payload = analyzer(image, templates, region_type, recognition, calibration_samples)
        metrics = payload.pop("_recognitionEvidenceMetrics", None) or {}
        if evidence_directory is not None:
            page = max(1, int(config.get("page") or 1))
            configured_left, configured_top, configured_right, configured_bottom = rectangle_edges(config.get("region") or {})
            attempt_files, image_reasons = encode_attempt_images(
                evidence_directory, page, attempt,
                frame.get("windowImage") if isinstance(frame, dict) else None,
                image, missing_window_reason, image_writer,
            )
            evidence_files.extend(attempt_files)
            completeness_reasons.extend(image_reasons)
            error_code = str(payload.get("error", {}).get("code", "")) or None
            evidence_attempts.append({
                "attempt": attempt, "page": page, "capturedAt": captured_at,
                "stage": str(metrics.get("stage") or ("CAPTURE" if error_code == "CAPTURE_EMPTY" else "ANALYSIS")),
                "monitorBounds": frame.get("monitorBounds") if isinstance(frame, dict) else config.get("displayBounds"),
                "windowBounds": frame.get("windowBounds") if isinstance(frame, dict) else None,
                "configuredRegion": rectangle_payload(configured_left, configured_top, configured_right, configured_bottom),
                "actualCrop": frame.get("actualCrop") if isinstance(frame, dict) else None,
                "grid": metrics.get("grid"), "occupiedCount": metrics.get("occupiedCount"),
                "warnings": metrics.get("warningCodes") or [], "errorCode": error_code,
            })
        error_code = str(payload.get("error", {}).get("code", ""))
        if payload.get("success") or error_code not in RETRYABLE_CAPTURE_ERRORS:
            break
        if attempt < attempts:
            sleeper(LIVE_CAPTURE_RETRY_SECONDS)
    if evidence_directory is not None:
        reasons = sorted(set(reason for reason in completeness_reasons if reason))
        payload["_failureEvidence"] = {
            "schemaVersion": 1, "evidenceId": evidence_id, "occurredAt": occurred_at,
            "completeness": {"status": "partial" if reasons else "complete", "reasons": reasons},
            "attempts": evidence_attempts, "files": evidence_files, "omittedFiles": [],
        }
    return payload


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    args = parser.parse_args()
    try:
        config = load_json(args.config)
        templates = load_json(config["templatesPath"])
        recognition = dict(config.get("recognition") or {})
        recognition["allowEmpty"] = bool(config.get("allowEmpty", False))
        image_path = config.get("imagePath")
        if image_path:
            image = load_image(image_path)
            if config.get("imageIsRegion") is not True:
                region_type = str(config.get("regionType", "inventory"))
                columns, rows = (ATLAS_COLS, ATLAS_ROWS) if region_type == "atlas" else (COLS, ROWS)
                monitor = region_monitor(config["region"], columns, rows)
                image = image[monitor["top"]:monitor["top"] + monitor["height"], monitor["left"]:monitor["left"] + monitor["width"]]
            payload = analyze_image(
                image, templates, str(config.get("regionType", "inventory")), recognition,
                config.get("calibrationSamples") or [],
            )
        else:
            if config.get("requireGameForeground", True):
                if not is_game_foreground():
                    emit(fail("GAME_NOT_FOREGROUND", "流放之路游戏窗口不在前台，未执行海图截图"))
                    return 2
            tab_point = config.get("tabPoint")
            if tab_point is not None:
                try:
                    hover_point = safe_hover_point(config["region"], config.get("displayBounds"))
                    click_inventory_tab(tab_point, hover_point, config.get("tabSettleSeconds", 0.25))
                except (KeyError, TypeError, ValueError, RuntimeError) as error:
                    emit(fail("TAB_SWITCH_FAILED", str(error)))
                    return 2
            payload = capture_with_retries(config, templates, recognition)
    except KeyError as error:
        payload = fail("CONFIG_INVALID", f"识别配置缺少字段：{error}")
    except Exception as error:
        payload = fail("ANALYSIS_FAILED", f"海图识别失败：{error}")
    payload.pop("_recognitionEvidenceMetrics", None)
    emit(payload)
    return 0 if payload.get("success") else 2


if __name__ == "__main__":
    raise SystemExit(main())
