"""海图词缀探测脚本。

两种模式:
- copy: 聚焦游戏后逐格移动鼠标并发送 Ctrl+C,读取剪贴板获取碎片词缀文本。
- border: 逐边移动鼠标到大图边缘外侧,等待浮窗出现后 OCR 鼠标上方区域。

仅通过 EVENT 行输出进度、RESULT JSON 行输出结构化结果。
"""

from __future__ import annotations

import argparse
import ctypes
from ctypes import wintypes
import json
import os
import sys
import time
import warnings
from pathlib import Path
from typing import Any

import cv2
import mss
import numpy as np

warnings.filterwarnings("ignore")


GAME_WINDOW_TITLES = ("流放之路", "Path of Exile")
GAME_WINDOW_PROCESS_NAMES = ("PathOfExile.exe", "PathOfExile_x64.exe", "PathOfExileSteam.exe", "PathOfExile_x64Steam.exe", "PathOfExileEGS.exe", "PathOfExile_x64EGS.exe")
DEFAULT_COPY_TIMEOUT_MS = 800
DEFAULT_SETTLE_MS = 250
DEFAULT_WAIT_TIMEOUT_MS = 1500
DEFAULT_OCR_MIN_CONFIDENCE = 0.5


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


def event(payload: dict[str, Any]) -> None:
    print("EVENT " + json.dumps(payload, ensure_ascii=False), flush=True)


def fail(code: str, message: str, **details: Any) -> dict[str, Any]:
    return {"success": False, "error": {"code": code, "message": message, **details}}


def load_json(path: str | Path) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


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


def window_title(hwnd: int) -> str:
    if not hwnd:
        return ""
    user32 = ctypes.windll.user32
    user32.GetWindowTextLengthW.argtypes = [wintypes.HWND]
    user32.GetWindowTextLengthW.restype = ctypes.c_int
    user32.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
    user32.GetWindowTextW.restype = ctypes.c_int
    length = user32.GetWindowTextLengthW(hwnd)
    buffer = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buffer, length + 1)
    return buffer.value.strip()


def window_matches_game(hwnd: int) -> bool:
    if not hwnd:
        return False
    title = window_title(hwnd)
    if not any(expected.casefold() in title.casefold() for expected in GAME_WINDOW_TITLES):
        return False
    return window_process_name(hwnd) in {name.casefold() for name in GAME_WINDOW_PROCESS_NAMES}


def is_game_foreground() -> bool:
    if os.name != "nt":
        return False
    return window_matches_game(ctypes.windll.user32.GetForegroundWindow())


def find_game_window() -> int:
    if os.name != "nt":
        return 0
    user32 = ctypes.windll.user32
    matches: list[tuple[int, int]] = []
    callback_type = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)

    def visit(hwnd: int, _lparam: int) -> bool:
        if not user32.IsWindowVisible(hwnd):
            return True
        if window_matches_game(hwnd):
            title = window_title(hwnd)
            priority = next((index for index, expected in enumerate(GAME_WINDOW_TITLES) if expected.casefold() in title.casefold()), len(GAME_WINDOW_TITLES))
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


def require_game_foreground() -> None:
    if not is_game_foreground():
        raise RuntimeError("游戏窗口未处于前台，未执行词缀探测操作")


def move_cursor(x: int, y: int) -> None:
    require_game_foreground()
    if not ctypes.windll.user32.SetCursorPos(int(x), int(y)):
        raise RuntimeError("鼠标移动失败")


def click_tab(point: dict[str, Any], settle_seconds: float = 0.25) -> None:
    if os.name != "nt":
        raise RuntimeError("仓库自动切页目前仅支持 Windows")
    x = int(point["x"])
    y = int(point["y"])
    user32 = ctypes.windll.user32
    require_game_foreground()
    user32.SetCursorPos(x, y)
    if not is_game_foreground():
        raise RuntimeError("移动到仓库页签后游戏失去前台，未执行点击")
    user32.mouse_event(0x0002, 0, 0, 0, 0)
    try:
        time.sleep(0.04)
    finally:
        user32.mouse_event(0x0004, 0, 0, 0, 0)
    if not user32.SetCursorPos(0, 0):
        raise RuntimeError("分页后无法将鼠标移出识别区域")
    time.sleep(max(0.16, float(settle_seconds)))


def send_copy_key() -> None:
    require_game_foreground()
    user32 = ctypes.windll.user32
    user32.keybd_event(0x11, 0, 0, 0)
    user32.keybd_event(0x43, 0, 0, 0)
    time.sleep(0.02)
    user32.keybd_event(0x43, 0, 2, 0)
    user32.keybd_event(0x11, 0, 2, 0)


def screen_center() -> tuple[int, int]:
    with mss.mss() as capture:
        monitor = capture.monitors[0]
        return (monitor["left"] + monitor["width"] // 2, monitor["top"] + monitor["height"] // 2)


def park_cursor() -> None:
    center_x, center_y = screen_center()
    ctypes.windll.user32.SetCursorPos(center_x, center_y)


# ---------- copy 模式 ----------

def copy_fragment_texts(config: dict[str, Any]) -> dict[str, Any]:
    import pyperclip

    pages = config.get("pages") or []
    copy_timeout_ms = max(200, int(config.get("copyTimeoutMs", DEFAULT_COPY_TIMEOUT_MS)))
    settle_ms = max(50, int(config.get("settleMs", DEFAULT_SETTLE_MS)))
    sentinel = "__poe_chart_mod_probe_sentinel__"
    previous = ""
    try:
        previous = pyperclip.paste()
    except Exception:
        previous = ""
    texts: dict[str, str] = {}
    failed: list[str] = []
    try:
        focused, focus_error = focus_game_window()
        if not focused:
            messages = {
                "GAME_WINDOW_NOT_FOUND": "未找到流放之路游戏窗口，未执行碎片词缀复制",
                "GAME_FOCUS_FAILED": "无法自动将游戏窗口置于前台，未执行碎片词缀复制",
                "UNSUPPORTED_PLATFORM": "碎片词缀复制目前仅支持 Windows",
            }
            return fail(focus_error, messages.get(focus_error, "无法激活游戏窗口"))
        total = sum(len(page.get("cells") or []) for page in pages)
        done = 0
        for page in pages:
            tab_point = page.get("tabPoint")
            if tab_point:
                try:
                    click_tab(tab_point, 0.25)
                except (KeyError, TypeError, ValueError, RuntimeError) as error:
                    return fail("TAB_SWITCH_FAILED", str(error))
            for cell in page.get("cells") or []:
                key = str(cell.get("key") or "")
                done += 1
                # 处理前发布进度,index 表示正在处理第几个,与界面「正在读取第 n 个」对齐。
                event({"event": "cell-copied", "index": done, "total": total, "key": key})
                try:
                    move_cursor(int(cell["x"]), int(cell["y"]))
                    time.sleep(settle_ms / 1000.0)
                    pyperclip.copy(sentinel)
                    send_copy_key()
                    deadline = time.monotonic() + copy_timeout_ms / 1000.0
                    captured = ""
                    while time.monotonic() < deadline:
                        current = pyperclip.paste()
                        if current and current != sentinel:
                            captured = str(current)
                            break
                        time.sleep(0.025)
                    if captured:
                        texts[key] = captured
                    else:
                        failed.append(key)
                except Exception:
                    failed.append(key)
    finally:
        try:
            if pyperclip.paste() == sentinel:
                pyperclip.copy(previous)
        except Exception:
            pass
        try:
            park_cursor()
        except Exception:
            pass
    return {"success": True, "texts": texts, "failed": failed, "total": sum(len(page.get("cells") or []) for page in pages)}


# ---------- border 模式 ----------

def create_rapidocr_engine():
    import rapidocr
    from rapidocr import RapidOCR
    model_root = str(Path(rapidocr.__file__).resolve().parent / "models")
    return RapidOCR(params={"Global.model_root_dir": model_root})


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


def frame_signature(image: np.ndarray) -> bytes:
    gray = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY) if image.shape[2] == 4 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (32, 32), interpolation=cv2.INTER_AREA)
    return (resized > resized.mean()).astype(np.uint8).tobytes()


def same_frame(left: bytes | None, right: bytes | None) -> bool:
    return left is not None and right is not None and left == right


def hover_monitor(target: dict[str, Any], hover_region: dict[str, Any]) -> dict[str, int]:
    x = int(target["x"])
    y = int(target["y"])
    width = max(120, int(hover_region.get("width", 480)))
    height = max(60, int(hover_region.get("height", 320)))
    offset_y = max(4, int(hover_region.get("offsetY", 24)))
    left = x - width // 2
    top = y - offset_y - height
    with mss.mss() as capture:
        monitor = capture.monitors[0]
        left = max(monitor["left"], left)
        top = max(monitor["top"], top)
        left = min(monitor["left"] + monitor["width"] - width, left)
        top = min(monitor["top"] + monitor["height"] - height, top)
    return {"left": left, "top": top, "width": width, "height": height}


def scan_border_texts(config: dict[str, Any]) -> dict[str, Any]:
    edges = config.get("edges") or []
    if not edges:
        return fail("EDGES_EMPTY", "边缘目标点列表为空")
    hover_region = config.get("hoverRegion") or {}
    settle_ms = max(100, int(config.get("settleMs", DEFAULT_SETTLE_MS)))
    wait_timeout_ms = max(200, int(config.get("waitTimeoutMs", DEFAULT_WAIT_TIMEOUT_MS)))
    min_confidence = float(config.get("ocrMinConfidence", DEFAULT_OCR_MIN_CONFIDENCE))
    focused, focus_error = focus_game_window()
    if not focused:
        messages = {
            "GAME_WINDOW_NOT_FOUND": "未找到流放之路游戏窗口，未执行边缘词缀识别",
            "GAME_FOCUS_FAILED": "无法自动将游戏窗口置于前台，未执行边缘词缀识别",
            "UNSUPPORTED_PLATFORM": "边缘词缀识别目前仅支持 Windows",
        }
        return fail(focus_error, messages.get(focus_error, "无法激活游戏窗口"))
    engine = create_rapidocr_engine()
    results: dict[str, Any] = {}
    with mss.mss() as capture:
        for index, edge in enumerate(edges):
            edge_id = str(edge.get("id") or index)
            # 处理前发布进度,index 表示正在处理第几个。
            event({"event": "edge-scanned", "index": index + 1, "total": len(edges), "id": edge_id})
            texts: list[str] = []
            try:
                move_cursor(int(edge["x"]), int(edge["y"]))
                time.sleep(settle_ms / 1000.0)
                monitor = hover_monitor(edge, hover_region)
                before = frame_signature(np.asarray(capture.grab(monitor))[:, :, :3])
                deadline = time.monotonic() + wait_timeout_ms / 1000.0
                while time.monotonic() < deadline:
                    time.sleep(0.1)
                    current_frame = frame_signature(np.asarray(capture.grab(monitor))[:, :, :3])
                    if not same_frame(before, current_frame):
                        break
                image = np.asarray(capture.grab(monitor))[:, :, :3]
                output = engine(cv2.cvtColor(image, cv2.COLOR_BGR2RGB) if image.shape[2] == 3 else image)
                _boxes, ocr_texts, scores = unpack_ocr_output(output)
                texts = [
                    str(text).strip() for text, score in zip(ocr_texts, scores)
                    if float(score) >= min_confidence and str(text).strip()
                ]
            except Exception:
                texts = []
            results[edge_id] = {"texts": texts}
    try:
        park_cursor()
    except Exception:
        pass
    return {"success": True, "edges": results, "total": len(edges)}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    args = parser.parse_args()
    try:
        config = load_json(args.config)
        mode = str(config.get("mode", "copy"))
        if mode == "copy":
            payload = copy_fragment_texts(config)
        elif mode == "border":
            payload = scan_border_texts(config)
        else:
            payload = fail("CONFIG_INVALID", f"未知模式：{mode}")
    except KeyError as error:
        payload = fail("CONFIG_INVALID", f"探测配置缺少字段：{error}")
    except Exception as error:
        payload = fail("PROBE_FAILED", f"词缀探测失败：{error}")
    emit(payload)
    return 0 if payload.get("success") else 2


if __name__ == "__main__":
    raise SystemExit(main())
