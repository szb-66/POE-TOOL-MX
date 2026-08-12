import ctypes
from ctypes import wintypes
import json
import os
import sys
import time

import cv2
import mss
import numpy as np


MODIFIER_SETTLE_SECONDS = 0.05
KEY_HOLD_SECONDS = 0.02
BUTTON_HOLD_SECONDS = 0.02
RELEASE_SETTLE_SECONDS = 0.02
PATCH_VERIFY_SECONDS = 0.55
FOCUS_ACTIVATION_MIN_SECONDS = 0.2
FOREGROUND_POLL_INTERVAL_SECONDS = 0.05
GAME_WINDOW_TITLES = ("流放之路", "Path of Exile")
_game_window_titles_cache = GAME_WINDOW_TITLES
_game_window_titles_mtime_ns = None
GAME_WINDOW_PROCESS_NAMES = ("PathOfExile.exe", "PathOfExile_x64.exe", "PathOfExileSteam.exe", "PathOfExile_x64Steam.exe", "PathOfExileEGS.exe", "PathOfExile_x64EGS.exe")
_game_window_process_names_cache = GAME_WINDOW_PROCESS_NAMES
_game_window_process_names_mtime_ns = None


def apply_fixed_timing(config):
    global MODIFIER_SETTLE_SECONDS, KEY_HOLD_SECONDS, BUTTON_HOLD_SECONDS
    global RELEASE_SETTLE_SECONDS, PATCH_VERIFY_SECONDS
    timing = config.get("fixed_timing", {}) if isinstance(config, dict) else {}
    MODIFIER_SETTLE_SECONDS = float(timing.get("modifier_settle_ms", 50)) / 1000.0
    KEY_HOLD_SECONDS = float(timing.get("key_hold_ms", 20)) / 1000.0
    BUTTON_HOLD_SECONDS = float(timing.get("button_hold_ms", 20)) / 1000.0
    RELEASE_SETTLE_SECONDS = float(timing.get("release_settle_ms", 20)) / 1000.0
    PATCH_VERIFY_SECONDS = float(timing.get("patch_verify_ms", 550)) / 1000.0


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
        if priority >= 0 and window_matches_game(hwnd):
            matches.append((priority, hwnd))
        return True

    user32.EnumWindows(callback_type(visit), 0)
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
    deadline = time.monotonic() + max(FOCUS_ACTIVATION_MIN_SECONDS, float(timeout_seconds))
    while time.monotonic() < deadline:
        if is_game_foreground():
            return True
        time.sleep(FOREGROUND_POLL_INTERVAL_SECONDS)
    return False


def require_game_foreground():
    if not is_game_foreground():
        raise RuntimeError("game-not-foreground")


def region_rect(value):
    if not value:
        return None
    left, top, right, bottom = (int(round(float(value.get(k, 0)))) for k in ("left", "top", "right", "bottom"))
    if right <= left or bottom <= top:
        return None
    return {"left": left, "top": top, "width": right - left, "height": bottom - top}


def capture(rect, grabber=None):
    source = grabber or mss.mss()
    image = np.asarray(source.grab(rect))
    return cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)


def grid_edge_projections(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gx = np.mean(np.abs(np.diff(gray.astype(np.float32), axis=1)), axis=0)
    gy = np.mean(np.abs(np.diff(gray.astype(np.float32), axis=0)), axis=1)
    return gx, gy


def grid_structure_projections(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY).astype(np.float32)
    gx = np.percentile(np.abs(np.diff(gray, axis=1)), 40, axis=0)
    gy = np.percentile(np.abs(np.diff(gray, axis=0)), 40, axis=1)
    return gx, gy


def axis_lag_correlation(projection, target_period, tolerance=0.1):
    centered = projection.astype(np.float64) - float(np.mean(projection))
    start = max(1, int(round(target_period * (1.0 - tolerance))))
    end = min(len(centered) - 1, int(round(target_period * (1.0 + tolerance))))
    best = -1.0
    for lag in range(start, end + 1):
        before, after = centered[:-lag], centered[lag:]
        denominator = float(np.linalg.norm(before) * np.linalg.norm(after))
        if denominator > 1e-6:
            best = max(best, float(np.dot(before, after) / denominator))
    return max(0.0, best)


def fine_grid_correlation(image):
    gx, gy = grid_structure_projections(image)
    horizontal = axis_lag_correlation(gx, image.shape[1] / 24.0)
    vertical = axis_lag_correlation(gy, image.shape[0] / 24.0)
    return min(horizontal, vertical)


def structure_alignment_confidence(image, columns):
    gx, gy = grid_structure_projections(image)
    axis_scores = []
    for projection, length in ((gx, image.shape[1]), (gy, image.shape[0])):
        radius = max(2, int(round((length / columns) * 0.06)))
        strengths = []
        for index in range(1, columns):
            position = int(round(index * length / columns))
            window = projection[max(0, position - radius):min(len(projection), position + radius + 1)]
            strengths.append(float(np.max(window)) if len(window) else 0.0)
        keep = max(1, int(len(strengths) * 0.8))
        baseline = max(1.0, float(np.median(projection)))
        axis_scores.append(float(np.mean(np.sort(strengths)[:keep])) / baseline)
    return float(np.sqrt(axis_scores[0] * axis_scores[1])) if len(axis_scores) == 2 else 0.0


def axis_periodicity_confidence(projection, length, columns):
    if len(projection) < columns * 2:
        return 0.0
    target_period = float(length) / columns
    positions = np.arange(len(projection), dtype=np.float32)
    best = 0.0
    for period in np.linspace(target_period * 0.94, target_period * 1.06, 25):
        bins = max(6, int(round(period)))
        phases = np.rint((np.mod(positions, period) / period) * (bins - 1)).astype(np.int32)
        totals = np.bincount(phases, weights=projection, minlength=bins)
        counts = np.bincount(phases, minlength=bins)
        folded = totals / np.maximum(counts, 1)
        radius = max(1, int(round(bins * 0.06)))
        wrapped = np.concatenate((folded[-radius:], folded, folded[:radius]))
        kernel = np.full(radius * 2 + 1, 1.0 / (radius * 2 + 1))
        smoothed = np.convolve(wrapped, kernel, mode="same")[radius:-radius]
        confidence = float(np.max(smoothed) / (np.median(smoothed) + 1e-6))
        best = max(best, confidence)
    return best


def grid_confidence(image, columns):
    gx, gy = grid_edge_projections(image)
    horizontal = axis_periodicity_confidence(gx, image.shape[1], columns)
    vertical = axis_periodicity_confidence(gy, image.shape[0], columns)
    return min(horizontal, vertical)


def detect_grid_layout(image):
    periodic = {columns: grid_confidence(image, columns) for columns in (12, 24)}
    columns = 24 if fine_grid_correlation(image) >= 0.2 else 12
    return columns, periodic[columns]


def choose_layout(calibration, grabber=None, minimum_confidence=1.15):
    choices = []
    for key in ("root", "folder"):
        rect = region_rect((calibration or {}).get(key))
        if not rect:
            continue
        image = capture(rect, grabber)
        columns, confidence = detect_grid_layout(image)
        alignment = structure_alignment_confidence(image, columns)
        selection_score = confidence * max(alignment, 0.25)
        choices.append((selection_score, confidence, key, columns, rect, image))
    if not choices:
        raise RuntimeError("calibration-missing")
    best = max(choices, key=lambda item: item[0])
    if best[1] < minimum_confidence:
        raise RuntimeError("layout-unrecognized")
    return {"confidence": best[1], "calibration": best[2], "columns": best[3], "rect": best[4], "image": best[5]}
