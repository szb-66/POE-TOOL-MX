import argparse
import base64
import ctypes
import json
import os
import sys
import time

import cv2
import mss
import numpy as np


INPUT_EVENT_DELAY_SECONDS = 0.02
TRANSFER_ATTEMPTS = 2
GAME_WINDOW_TITLES = ("流放之路", "Path of Exile")
_game_window_titles_cache = GAME_WINDOW_TITLES
_game_window_titles_mtime_ns = None


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


def emit_with(event, common, **updates):
    emit(event, **{**common, **updates})


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
    while time.monotonic() < deadline:
        if is_game_foreground():
            return True
        time.sleep(0.05)
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


def cell_bounds(image, columns, column, row, sample_ratio=1.0):
    x0 = int(round(column * image.shape[1] / columns))
    x1 = int(round((column + 1) * image.shape[1] / columns))
    y0 = int(round(row * image.shape[0] / columns))
    y1 = int(round((row + 1) * image.shape[0] / columns))
    ratio = min(1.0, max(0.1, float(sample_ratio)))
    mx = int(round((x1 - x0) * (1.0 - ratio) / 2.0))
    my = int(round((y1 - y0) * (1.0 - ratio) / 2.0))
    return x0 + mx, y0 + my, x1 - mx, y1 - my


def cell_score(image, columns, column, row, method, sample_ratio):
    x0, y0, x1, y1 = cell_bounds(image, columns, column, row, sample_ratio)
    patch = image[y0:y1, x0:x1]
    if patch.size == 0:
        return 0.0
    if method == "saturation":
        return float(np.mean(cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)[:, :, 1]))
    gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)
    return float(np.var(gray)) if method == "variance" else float(np.mean(gray))


def detect_candidates(image, columns, profile):
    method = profile.get("method", "variance")
    threshold = float(profile.get("thresholds", {}).get(method, 0))
    ratio = float(profile.get("sampleRatio", 0.6))
    candidates = []
    for column in range(columns):
        for row in range(columns):
            score = cell_score(image, columns, column, row, method, ratio)
            if score >= threshold:
                candidates.append({"column": column, "row": row, "score": round(score, 3)})
    return candidates


def annotated_preview(image, columns, candidates):
    output = image.copy()
    for candidate in candidates:
        c, r = candidate["column"], candidate["row"]
        x0, y0, x1, y1 = cell_bounds(image, columns, c, r, 1.0)
        cv2.rectangle(output, (x0 + 1, y0 + 1), (x1 - 2, y1 - 2), (0, 210, 255), 2)
    ok, encoded = cv2.imencode(".jpg", output, [cv2.IMWRITE_JPEG_QUALITY, 82])
    return base64.b64encode(encoded).decode("ascii") if ok else ""


def local_patch(image, columns, column, row, sample_ratio):
    x0, y0, x1, y1 = cell_bounds(image, columns, column, row, sample_ratio)
    return image[y0:y1, x0:x1].copy()


def patch_changed(before, after, threshold=8.0):
    if before.shape != after.shape or before.size == 0:
        return True
    return float(np.mean(np.abs(before.astype(np.float32) - after.astype(np.float32)))) >= threshold


def ctrl_click(mouse, keyboard, ctrl_key, left_button, foreground_check=None):
    check_foreground = foreground_check or is_game_foreground
    if not check_foreground():
        raise RuntimeError("game-not-foreground")
    keyboard.press(ctrl_key)
    time.sleep(INPUT_EVENT_DELAY_SECONDS)
    if not check_foreground():
        keyboard.release(ctrl_key)
        raise RuntimeError("game-not-foreground")
    mouse.click(left_button, 1)
    time.sleep(INPUT_EVENT_DELAY_SECONDS)
    keyboard.release(ctrl_key)


def wait_for_patch_change(before, rect, columns, candidate, ratio, grabber, delay):
    deadline = time.monotonic() + max(0.55, delay * 6)
    while time.monotonic() < deadline:
        time.sleep(min(0.05, delay))
        require_game_foreground()
        after_image = capture(rect, grabber)
        after = local_patch(after_image, columns, candidate["column"], candidate["row"], ratio)
        if patch_changed(before, after):
            return after_image
    return None


def changed_item_cells(before_image, after_image, columns, candidates, origin, threshold=4.0):
    changed = set()
    for candidate in candidates:
        key = (candidate["column"], candidate["row"])
        before = local_patch(before_image, columns, key[0], key[1], 1.0)
        after = local_patch(after_image, columns, key[0], key[1], 1.0)
        if patch_changed(before, after, threshold):
            changed.add(key)

    origin_key = (origin["column"], origin["row"])
    connected = set()
    pending = [origin_key] if origin_key in changed else []
    while pending:
        key = pending.pop()
        if key in connected:
            continue
        connected.add(key)
        column, row = key
        for neighbor in ((column - 1, row), (column + 1, row), (column, row - 1), (column, row + 1)):
            if neighbor in changed and neighbor not in connected:
                pending.append(neighbor)
    return connected or {origin_key}


def run(config, preview=False):
    if not focus_game_window():
        raise RuntimeError("game-not-foreground")
    time.sleep(max(0.08, float(config.get("operationDelayMs", 80)) / 1000.0))
    with mss.mss() as grabber:
        require_game_foreground()
        layout = choose_layout(config.get("calibration", {}), grabber, float(config.get("layoutConfidence", 1.15)))
        profile = config.get("profiles", {}).get("normal" if layout["columns"] == 12 else "quad", {})
        candidates = detect_candidates(layout["image"], layout["columns"], profile)
        common = {
            "layout": layout["columns"],
            "calibration": layout["calibration"],
            "confidence": round(layout["confidence"], 3),
            "method": profile.get("method", "variance"),
            "candidateCells": len(candidates),
        }
        if preview:
            emit_with("preview", common, remainingCells=len(candidates), candidates=candidates,
                      imageDataUrl="data:image/jpeg;base64," + annotated_preview(layout["image"], layout["columns"], candidates))
            return 0
        if not candidates:
            emit_with("completed", common, remainingCells=0, pickedItems=0, reason="no-candidates")
            return 0

        from pynput.keyboard import Controller as KeyboardController, Key
        from pynput.mouse import Button, Controller as MouseController
        keyboard, mouse = KeyboardController(), MouseController()
        delay = max(0.02, float(config.get("operationDelayMs", 80)) / 1000.0)
        rect, columns = layout["rect"], layout["columns"]
        method = profile.get("method", "variance")
        threshold = float(profile.get("thresholds", {}).get(method, 0))
        ratio = float(profile.get("sampleRatio", 0.6))
        picked = 0
        cleared_cells = set()
        try:
            emit_with("started", common, remainingCells=len(candidates), pickedItems=0)
            for index, candidate in enumerate(candidates):
                candidate_key = (candidate["column"], candidate["row"])
                if candidate_key in cleared_cells:
                    emit_with("progress", common, currentIndex=index + 1,
                              remainingCells=len(candidates) - index - 1, pickedItems=picked,
                              skipped=True, cleared=True)
                    continue
                cell_w, cell_h = rect["width"] / columns, rect["height"] / columns
                require_game_foreground()
                mouse.position = (
                    int(round(rect["left"] + (candidate["column"] + 0.5) * cell_w)),
                    int(round(rect["top"] + (candidate["row"] + 0.5) * cell_h)),
                )
                time.sleep(delay)
                require_game_foreground()
                current = capture(rect, grabber)
                score = cell_score(current, columns, candidate["column"], candidate["row"], method, ratio)
                if score < threshold:
                    emit_with("progress", common, currentIndex=index + 1,
                              remainingCells=len(candidates) - index - 1, pickedItems=picked, skipped=True)
                    continue
                before = local_patch(current, columns, candidate["column"], candidate["row"], ratio)
                after_image = None
                for attempt in range(TRANSFER_ATTEMPTS):
                    require_game_foreground()
                    ctrl_click(mouse, keyboard, Key.ctrl, Button.left)
                    after_image = wait_for_patch_change(before, rect, columns, candidate, ratio, grabber, delay)
                    if after_image is not None:
                        break
                    if attempt + 1 < TRANSFER_ATTEMPTS:
                        time.sleep(max(0.08, delay))
                if after_image is None:
                    emit_with("aborted", common, currentIndex=index + 1,
                              remainingCells=len(candidates) - index, pickedItems=picked, reason="inventory-full")
                    return 2
                cleared_cells.update(changed_item_cells(current, after_image, columns, candidates, candidate))
                picked += 1
                emit_with("progress", common, currentIndex=index + 1,
                          remainingCells=len(candidates) - index - 1, pickedItems=picked, skipped=False)
                time.sleep(delay)
            emit_with("completed", common, remainingCells=0, pickedItems=picked, reason="completed")
            return 0
        finally:
            try:
                keyboard.release(Key.ctrl)
            except Exception:
                pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args()
    try:
        with open(args.config, "r", encoding="utf-8") as stream:
            config = json.load(stream)
        return run(config, args.preview)
    except Exception as error:
        emit("error", reason=str(error))
        return 1


if __name__ == "__main__":
    sys.exit(main())
