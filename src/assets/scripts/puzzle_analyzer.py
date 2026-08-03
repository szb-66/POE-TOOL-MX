from __future__ import annotations

import argparse
import ctypes
import json
import math
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
TYPE_ORDER = ("endpoint", "straight", "corner", "tee", "cross")
MIN_COMPONENT_AREA = 24
CONFIDENCE_THRESHOLD = 0.72
MARGIN_THRESHOLD = 0.035
GAME_WINDOW_TITLES = ("流放之路", "Path of Exile")
_game_window_titles_cache = GAME_WINDOW_TITLES
_game_window_titles_mtime_ns = None


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
    title = foreground_game_title()
    return game_window_title_priority(title) >= 0


def find_game_window() -> int:
    if os.name != "nt":
        return 0
    user32 = ctypes.windll.user32
    matches: list[int] = []
    callback_type = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)

    def visit(hwnd: int, _lparam: int) -> bool:
        if not user32.IsWindowVisible(hwnd):
            return True
        length = user32.GetWindowTextLengthW(hwnd)
        if length <= 0:
            return True
        title = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(hwnd, title, length + 1)
        priority = game_window_title_priority(title.value)
        if priority >= 0:
            matches.append((priority, hwnd))
        return True

    user32.EnumWindows(callback_type(visit), 0)
    matches.sort(key=lambda entry: entry[0])
    return matches[0][1] if matches else 0


def focus_game_window(timeout_seconds: float = 2.0) -> tuple[bool, str]:
    if is_game_foreground():
        return True, ""
    if os.name != "nt":
        return False, "UNSUPPORTED_PLATFORM"
    user32 = ctypes.windll.user32
    kernel32 = ctypes.windll.kernel32
    hwnd = find_game_window()
    if not hwnd:
        return False, "GAME_WINDOW_NOT_FOUND"
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
    while time.monotonic() < deadline:
        if is_game_foreground():
            return True, ""
        time.sleep(0.05)
    return False, "GAME_FOCUS_FAILED"


def region_monitor(region: dict[str, Any]) -> dict[str, int]:
    left = int(round(float(region.get("left", region.get("x", 0)))))
    top = int(round(float(region.get("top", region.get("y", 0)))))
    right = int(round(float(region.get("right", left + region.get("width", 0)))))
    bottom = int(round(float(region.get("bottom", top + region.get("height", 0)))))
    width = right - left
    height = bottom - top
    if width < COLS * 20 or height < ROWS * 20:
        raise ValueError("仓库区域过小，请完整框选 6×10 网格")
    return {"left": left, "top": top, "width": width, "height": height}


def capture_region(region: dict[str, Any]) -> np.ndarray:
    monitor = region_monitor(region)
    with mss.mss() as capture:
        return np.asarray(capture.grab(monitor))[:, :, :3]


def cell_bounds(width: int, height: int, row: int, column: int) -> tuple[int, int, int, int]:
    left = round(column * width / COLS)
    right = round((column + 1) * width / COLS)
    top = round(row * height / ROWS)
    bottom = round((row + 1) * height / ROWS)
    return left, top, right, bottom


def largest_green_component(cell: np.ndarray) -> dict[str, Any] | None:
    height, width = cell.shape[:2]
    roi = cell[: max(1, round(height * 0.62)), round(width * 0.32): max(1, round(width * 0.96))]
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv, np.array([35, 70, 80]), np.array([100, 255, 255]))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    count, _labels, stats, centroids = cv2.connectedComponentsWithStats(mask)
    candidates = [index for index in range(1, count) if int(stats[index, cv2.CC_STAT_AREA]) >= MIN_COMPONENT_AREA]
    if not candidates:
        return None
    index = max(candidates, key=lambda value: int(stats[value, cv2.CC_STAT_AREA]))
    x, y, component_width, component_height, area = [int(value) for value in stats[index]]
    if area < max(MIN_COMPONENT_AREA, round(width * height * 0.012)):
        return None
    return {
        "x": x,
        "y": y,
        "width": component_width,
        "height": component_height,
        "area": area,
        "centroid": [float(value) for value in centroids[index]],
        "roiWidth": int(roi.shape[1]),
        "roiHeight": int(roi.shape[0]),
        "cellWidth": width,
        "cellHeight": height,
    }


def component_features(component: dict[str, Any]) -> list[float]:
    width = component["width"]
    height = component["height"]
    return [
        width / component["cellWidth"],
        height / component["cellHeight"],
        component["area"] / max(1, width * height),
    ]


def feature_distance(left: list[float], right: list[float], weights: list[float]) -> float:
    return math.sqrt(sum(weight * (a - b) ** 2 for a, b, weight in zip(left, right, weights)))


def classify(features: list[float], templates: dict[str, Any]) -> tuple[str, float, float]:
    weights = [float(value) for value in templates.get("featureWeights", [1, 1, 0.75])]
    scores = []
    for fragment_type in TYPE_ORDER:
        prototypes = templates.get("types", {}).get(fragment_type, [])
        distance = min((feature_distance(features, prototype, weights) for prototype in prototypes), default=1.0)
        scores.append((fragment_type, distance))
    scores.sort(key=lambda item: (item[1], TYPE_ORDER.index(item[0])))
    best_type, best_distance = scores[0]
    second_distance = scores[1][1]
    confidence = max(0.0, min(1.0, 1.0 - best_distance * 4.0))
    margin = max(0.0, second_distance - best_distance)
    return best_type, round(confidence, 4), round(margin, 4)


def infer_orientation(fragment_type: str, component: dict[str, Any]) -> int:
    width = component["width"]
    height = component["height"]
    if fragment_type == "cross":
        return 0
    if fragment_type == "straight":
        return 0 if height >= width else 90
    center_x, center_y = component["centroid"]
    roi_center_x = component["roiWidth"] / 2
    roi_center_y = component["roiHeight"] / 2
    if fragment_type == "endpoint":
        if height >= width:
            return 0 if center_y <= roi_center_y else 180
        return 270 if center_x <= roi_center_x else 90
    # Corner and tee orientation is advisory only; stock can rotate freely.
    if abs(center_x - roi_center_x) >= abs(center_y - roi_center_y):
        return 90 if center_x < roi_center_x else 270
    return 180 if center_y < roi_center_y else 0


def analyze_image(image: np.ndarray, templates: dict[str, Any]) -> dict[str, Any]:
    if image is None or image.size == 0:
        return fail("CAPTURE_EMPTY", "仓库截图为空")
    height, width = image.shape[:2]
    slots = []
    counts = {fragment_type: 0 for fragment_type in TYPE_ORDER}
    warnings = []
    for row in range(ROWS):
        for column in range(COLS):
            left, top, right, bottom = cell_bounds(width, height, row, column)
            component = largest_green_component(image[top:bottom, left:right])
            if component is None:
                slots.append({
                    "row": row, "column": column, "occupied": False, "type": None,
                    "orientation": 0, "confidence": 1.0, "margin": 1.0, "corrected": False,
                })
                continue
            features = component_features(component)
            fragment_type, confidence, margin = classify(features, templates)
            uncertain = confidence < CONFIDENCE_THRESHOLD or margin < MARGIN_THRESHOLD
            slot = {
                "row": row, "column": column, "occupied": True, "type": fragment_type,
                "orientation": infer_orientation(fragment_type, component),
                "confidence": confidence, "margin": margin, "uncertain": uncertain,
                "corrected": False, "features": [round(value, 4) for value in features],
            }
            slots.append(slot)
            counts[fragment_type] += 1
            if uncertain:
                warnings.append(f"第 {row + 1} 行第 {column + 1} 列识别置信度不足，请人工确认")
    occupied_count = sum(counts.values())
    if occupied_count == 0:
        return fail("NO_FRAGMENTS", "配置区域内未识别到绿色碎片，请重新框选完整仓库")
    return {
        "success": True,
        "slots": slots,
        "counts": counts,
        "warnings": warnings,
        "imageSize": {"width": width, "height": height},
        "occupiedCount": occupied_count,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    args = parser.parse_args()
    try:
        config = load_json(args.config)
        templates = load_json(config["templatesPath"])
        image_path = config.get("imagePath")
        if image_path:
            image = load_image(image_path)
            if config.get("imageIsRegion") is not True:
                monitor = region_monitor(config["region"])
                image = image[monitor["top"]:monitor["top"] + monitor["height"], monitor["left"]:monitor["left"] + monitor["width"]]
        else:
            if config.get("requireGameForeground", True):
                focused, focus_error = focus_game_window()
                if not focused:
                    messages = {
                        "GAME_WINDOW_NOT_FOUND": "未找到流放之路游戏窗口，未执行九宫格截图",
                        "GAME_FOCUS_FAILED": "无法自动将游戏窗口置于前台，未执行九宫格截图",
                        "UNSUPPORTED_PLATFORM": "九宫格识别目前仅支持 Windows",
                    }
                    emit(fail(focus_error, messages.get(focus_error, "无法激活游戏窗口")))
                    return 2
            image = capture_region(config["region"])
        payload = analyze_image(image, templates)
    except KeyError as error:
        payload = fail("CONFIG_INVALID", f"识别配置缺少字段：{error}")
    except Exception as error:
        payload = fail("ANALYSIS_FAILED", f"九宫格识别失败：{error}")
    emit(payload)
    return 0 if payload.get("success") else 2


if __name__ == "__main__":
    raise SystemExit(main())
