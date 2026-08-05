"""根目录仓库页 OCR 预览与安全选择器。仅通过 RESULT JSON 输出结构化结果。"""

from __future__ import annotations

import argparse
import ctypes
from ctypes import wintypes
import difflib
import json
import os
import sys
import time
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import mss
import numpy as np


MIN_CONFIDENCE = 0.72
MAX_SCROLL_STEPS = 30
SCROLL_NOTCHES = 6
SCROLL_DELAY_SECONDS = 0.22
GAME_WINDOW_TITLES = ("流放之路", "Path of Exile")
_game_window_titles_cache = GAME_WINDOW_TITLES
_game_window_titles_mtime_ns = None
GAME_WINDOW_PROCESS_NAMES = ("PathOfExile.exe", "PathOfExile_x64.exe", "PathOfExileSteam.exe", "PathOfExile_x64Steam.exe")
_game_window_process_names_cache = GAME_WINDOW_PROCESS_NAMES
_game_window_process_names_mtime_ns = None


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
            process_names = tuple(str(value).strip() for value in values) if isinstance(values, list) else ()
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


def normalize_text(value: Any) -> str:
    text = unicodedata.normalize("NFKC", str(value or ""))
    return "".join(text.split()).casefold()


def result(success: bool, **payload: Any) -> dict[str, Any]:
    return {"success": success, **payload}


def emit(payload: dict[str, Any]) -> None:
    print("RESULT " + json.dumps(payload, ensure_ascii=False), flush=True)


def fail(code: str, reason: str, **payload: Any) -> dict[str, Any]:
    return result(False, code=code, reason=reason, **payload)


def create_rapidocr_engine():
    # OmegaConf 2.0（唯一无需本地编译即可随 Python 3.13 分发的兼容版本）
    # 不接受 pathlib.Path；显式传字符串可避免 RapidOCR 默认路径赋值失败。
    import rapidocr
    from rapidocr import RapidOCR
    model_root = str(Path(rapidocr.__file__).resolve().parent / "models")
    return RapidOCR(params={"Global.model_root_dir": model_root})


def box_rect(box: Any) -> dict[str, int] | None:
    try:
        points = np.asarray(box, dtype=float).reshape(-1, 2)
        left, top = points.min(axis=0)
        right, bottom = points.max(axis=0)
        return {
            "x": int(round(left)), "y": int(round(top)),
            "width": max(1, int(round(right - left))),
            "height": max(1, int(round(bottom - top)))
        }
    except Exception:
        return None


def unpack_ocr_output(output: Any) -> tuple[list[Any], list[str], list[float]]:
    if output is None:
        return [], [], []
    boxes = getattr(output, "boxes", None)
    texts = getattr(output, "txts", None)
    if texts is None:
        texts = getattr(output, "texts", None)
    scores = getattr(output, "scores", None)
    if boxes is not None and texts is not None:
        score_values = [1] * len(texts) if scores is None else scores
        return list(boxes), [str(x) for x in texts], [float(x) for x in score_values]
    if isinstance(output, (list, tuple)) and len(output) >= 1:
        rows = output[0] if len(output) == 2 and isinstance(output[0], list) else output
        parsed = [row for row in rows if isinstance(row, (list, tuple)) and len(row) >= 3]
        return [row[0] for row in parsed], [str(row[1]) for row in parsed], [float(row[2]) for row in parsed]
    return [], [], []


def filter_ocr_rows(output: Any, image_width: int, image_height: int,
                    min_confidence: float = MIN_CONFIDENCE) -> list[dict[str, Any]]:
    boxes, texts, scores = unpack_ocr_output(output)
    rows = []
    icon_cutoff = max(24, round(image_width * 0.18))
    max_line_height = max(28, round(image_height * 0.12))
    for box, text, score in zip(boxes, texts, scores):
        rect = box_rect(box)
        normalized = normalize_text(text)
        if not rect or not normalized:
            continue
        # 用户框选包含左侧图标；只接受从文字列开始且符合单行尺寸的候选。
        if rect["x"] < icon_cutoff or rect["height"] > max_line_height:
            continue
        rows.append({
            "text": str(text).strip(), "normalizedText": normalized,
            "confidence": round(float(score), 4), "box": rect,
            "lowConfidence": float(score) < min_confidence
        })
    return sorted(rows, key=lambda row: (row["box"]["y"], row["box"]["x"]))


def annotate_matches(rows: list[dict[str, Any]], names: dict[str, str]) -> list[dict[str, Any]]:
    normalized_names = {key: normalize_text(value) for key, value in names.items() if normalize_text(value)}
    for row in rows:
        matches = [key for key, value in normalized_names.items() if value == row["normalizedText"]]
        row["mappedTypes"] = matches
        row["matched"] = bool(matches) and not row["lowConfidence"]
        if not matches and normalized_names:
            closest = max(normalized_names.items(), key=lambda item: difflib.SequenceMatcher(
                None, row["normalizedText"], item[1]).ratio())
            ratio = difflib.SequenceMatcher(None, row["normalizedText"], closest[1]).ratio()
            row["similarType"] = closest[0] if ratio >= 0.6 else None
            row["similarity"] = round(ratio, 3) if ratio >= 0.6 else 0
    return rows


def exact_target_rows(rows: list[dict[str, Any]], target_name: str) -> list[dict[str, Any]]:
    target = normalize_text(target_name)
    return [row for row in rows
            if row["normalizedText"] == target and not row.get("lowConfidence", False)]


def stitch_rows(existing: list[str], current: list[str]) -> list[str]:
    if not existing:
        return list(current)
    max_overlap = min(len(existing), len(current))
    for size in range(max_overlap, 0, -1):
        if existing[-size:] == current[:size]:
            return existing + current[size:]
    return existing + current


def frame_signature(image: np.ndarray) -> bytes:
    gray = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY) if image.shape[2] == 4 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (32, 32), interpolation=cv2.INTER_AREA)
    return (resized > resized.mean()).astype(np.uint8).tobytes()


def same_frame(left: bytes | None, right: bytes | None) -> bool:
    return left is not None and right is not None and left == right


@dataclass
class CaptureRegion:
    x: int
    y: int
    width: int
    height: int

    @classmethod
    def from_config(cls, value: dict[str, Any]) -> "CaptureRegion":
        return cls(int(value["x"]), int(value["y"]), int(value["width"]), int(value["height"]))

    def monitor(self) -> dict[str, int]:
        return {"left": self.x, "top": self.y, "width": self.width, "height": self.height}


class SelectorSafetyError(RuntimeError):
    def __init__(self, payload: dict[str, Any]):
        super().__init__(str(payload.get("message") or payload.get("error") or "仓库页选择环境失效"))
        self.payload = payload


class StashTabSelector:
    def __init__(self, config: dict[str, Any], ocr_engine: Any | None = None):
        self.config = config
        self.region = CaptureRegion.from_config(config["rootRegion"])
        self.names = config.get("names") or {}
        self.target_name = str(config.get("targetName") or self.names.get("currency") or "")
        self.min_confidence = float(config.get("minConfidence", MIN_CONFIDENCE))
        self._ocr = ocr_engine
        self._mouse = None

    def _engine(self):
        if self._ocr is None:
            self._ocr = create_rapidocr_engine()
        return self._ocr

    def capture(self) -> np.ndarray:
        self.require_environment()
        with mss.mss() as capture:
            return np.asarray(capture.grab(self.region.monitor()))

    def recognize(self, image: np.ndarray) -> list[dict[str, Any]]:
        output = self._engine()(cv2.cvtColor(image, cv2.COLOR_BGRA2BGR) if image.shape[2] == 4 else image)
        rows = annotate_matches(filter_ocr_rows(output, self.region.width, self.region.height, self.min_confidence), self.names)
        for row in rows:
            row["screenBox"] = {
                **row["box"],
                "x": self.region.x + row["box"]["x"],
                "y": self.region.y + row["box"]["y"]
            }
        return rows

    def _mouse_controller(self):
        if self._mouse is None:
            from pynput.mouse import Controller
            self._mouse = Controller()
        return self._mouse

    def _position_mouse(self) -> None:
        self.require_environment()
        self._mouse_controller().position = (
            self.region.x + self.region.width // 2,
            self.region.y + self.region.height // 2
        )

    def scroll(self, notches: int) -> None:
        self._position_mouse()
        self.require_environment()
        self._mouse_controller().scroll(0, notches)
        time.sleep(SCROLL_DELAY_SECONDS)

    def validate_environment(self) -> dict[str, Any]:
        if os.name != "nt":
            return fail("unsupported-platform", "仓库页自动选择目前仅支持 Windows")
        user32 = ctypes.windll.user32
        hwnd = user32.GetForegroundWindow()
        length = user32.GetWindowTextLengthW(hwnd)
        title = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(hwnd, title, length + 1)
        window_title = title.value
        if not window_matches_game(hwnd):
            return fail("game-not-foreground", "游戏不在前台，已停止仓库页选择", windowTitle=window_title)
        bounds = self.config.get("rootRegion", {}).get("displayPhysicalBounds")
        if bounds:
            with mss.mss() as capture:
                current = [m for m in capture.monitors[1:] if
                           self.region.x >= m["left"] and self.region.y >= m["top"] and
                           self.region.x + self.region.width <= m["left"] + m["width"] and
                           self.region.y + self.region.height <= m["top"] + m["height"]]
            expected_width = int(bounds.get("width", 0))
            expected_height = int(bounds.get("height", 0))
            expected_x = int(bounds.get("x", bounds.get("left", 0)))
            expected_y = int(bounds.get("y", bounds.get("top", 0)))
            if not current or (expected_width and expected_height and
                               (current[0]["width"] != expected_width or current[0]["height"] != expected_height or
                                current[0]["left"] != expected_x or current[0]["top"] != expected_y)):
                return fail("display-environment-changed", "显示器分辨率或仓库列表位置已变化，请重新框选")
        expected_scale = float(self.config.get("rootRegion", {}).get("scaleFactor") or 1)
        try:
            current_scale = float(user32.GetDpiForWindow(hwnd)) / 96.0
            if abs(current_scale - expected_scale) > 0.05:
                return fail("dpi-environment-changed", "游戏窗口 DPI 缩放已变化，请重新框选",
                            expectedScale=expected_scale, currentScale=round(current_scale, 3))
        except Exception:
            pass
        return result(True, windowTitle=window_title)

    def require_environment(self) -> None:
        environment = self.validate_environment()
        if not environment["success"]:
            raise SelectorSafetyError(environment)

    def preview(self) -> dict[str, Any]:
        try:
            rows = self.recognize(self.capture())
            target_rows = exact_target_rows(rows, self.target_name) if self.target_name else []
            return result(True, mode="preview", rows=rows, targetName=self.target_name,
                          targetMatchCount=len(target_rows), uniqueTargetMatch=len(target_rows) == 1)
        except SelectorSafetyError as error:
            return error.payload

    def scroll_to_top(self) -> dict[str, Any]:
        previous = None
        stable = 0
        for step in range(MAX_SCROLL_STEPS + 1):
            image = self.capture()
            signature = frame_signature(image)
            stable = stable + 1 if same_frame(previous, signature) else 0
            if stable >= 2:
                return result(True, steps=step)
            previous = signature
            if step < MAX_SCROLL_STEPS:
                self.scroll(SCROLL_NOTCHES)
        return fail("scroll-top-limit", "滚动到列表顶部超过 30 次，已停止")

    def scan_from_top(self) -> dict[str, Any]:
        sequence: list[str] = []
        pages: list[dict[str, Any]] = []
        previous = None
        stable = 0
        for step in range(MAX_SCROLL_STEPS + 1):
            image = self.capture()
            rows = self.recognize(image)
            visible = [row["normalizedText"] for row in rows if not row["lowConfidence"]]
            sequence = stitch_rows(sequence, visible)
            pages.append({"step": step, "rows": rows})
            signature = frame_signature(image)
            stable = stable + 1 if same_frame(previous, signature) else 0
            if stable >= 2:
                return result(True, sequence=sequence, pages=pages, bottomStep=step)
            previous = signature
            if step < MAX_SCROLL_STEPS:
                self.scroll(-SCROLL_NOTCHES)
        return fail("scroll-bottom-limit", "扫描仓库列表超过 30 次，已恢复到顶部", sequence=sequence, pages=pages)

    def restore_top(self) -> None:
        self.scroll_to_top()

    def select(self) -> dict[str, Any]:
        environment = self.validate_environment()
        if not environment["success"]:
            return environment
        if not normalize_text(self.target_name):
            return fail("target-name-empty", "通货仓库页名称为空")
        try:
            top = self.scroll_to_top() if self.config.get("hasScrollbar") else result(True, steps=0)
            if not top["success"]:
                return top
            if self.config.get("hasScrollbar"):
                scan = self.scan_from_top()
            else:
                rows = self.recognize(self.capture())
                scan = result(True,
                              sequence=[row["normalizedText"] for row in rows if not row["lowConfidence"]],
                              pages=[{"step": 0, "rows": rows}], bottomStep=0)
            if not scan["success"]:
                self.restore_top()
                return scan
            target = normalize_text(self.target_name)
            occurrences = [index for index, text in enumerate(scan["sequence"]) if text == target]
            if not occurrences:
                self.restore_top()
                return fail("target-not-found", "未找到通货仓库页；请确认已返回根目录且名称映射正确")
            if len(occurrences) != 1:
                self.restore_top()
                return fail("target-not-unique", "发现多个同名通货仓库页，为避免误点已停止", count=len(occurrences))
            page = next((page for page in scan["pages"] if exact_target_rows(page["rows"], self.target_name)), None)
            if page is None:
                self.restore_top()
                return fail("target-relocation-failed", "目标仓库页无法重新定位，已停止")
            if self.config.get("hasScrollbar"):
                restored = self.scroll_to_top()
                if not restored["success"]:
                    return restored
                for _ in range(page["step"]):
                    self.scroll(-SCROLL_NOTCHES)
            rows = self.recognize(self.capture())
            matches = exact_target_rows(rows, self.target_name)
            if len(matches) != 1:
                self.restore_top()
                return fail("target-recheck-failed", "点击前重新识别未得到唯一目标，已停止", count=len(matches))
            box = matches[0]["box"]
            point = {
                "x": self.region.x + box["x"] + box["width"] // 2,
                "y": self.region.y + box["y"] + box["height"] // 2
            }
            from pynput.mouse import Button
            mouse = self._mouse_controller()
            self.require_environment()
            mouse.position = (point["x"], point["y"])
            self.require_environment()
            mouse.click(Button.left, 1)
            return result(True, mode="select", targetName=self.target_name, point=point,
                          confidence=matches[0]["confidence"], scrollStep=page["step"])
        except KeyboardInterrupt:
            self.restore_top()
            return fail("cancelled", "仓库页选择已停止")
        except SelectorSafetyError as error:
            return error.payload
        except Exception as error:
            try:
                if self.config.get("hasScrollbar"):
                    self.restore_top()
            except Exception:
                pass
            return fail("selector-error", f"仓库页识别失败：{error}")


def load_config(path: str) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("preview", "select"), required=True)
    parser.add_argument("--config", required=True)
    args = parser.parse_args()
    try:
        selector = StashTabSelector(load_config(args.config))
        payload = selector.preview() if args.mode == "preview" else selector.select()
    except Exception as error:
        payload = fail("selector-startup-failed", f"仓库页识别器启动失败：{error}")
    emit(payload)
    return 0 if payload.get("success") else 2


if __name__ == "__main__":
    raise SystemExit(main())
