#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""固定查价复制助手：校验游戏前台与权限边界，并向游戏发送 Ctrl+C。"""

import ctypes
import json
import os
import sys
import time
from ctypes import wintypes


DEFAULT_TITLES = ("流放之路", "Path of Exile")
DEFAULT_PROCESS_NAMES = (
    "pathofexile.exe",
    "pathofexile_x64.exe",
    "pathofexilesteam.exe",
    "pathofexile_x64steam.exe",
    "pathofexileegs.exe",
    "pathofexile_x64egs.exe",
)


def main():
    if sys.platform != "win32":
        return 0
    mode = sys.argv[1] if len(sys.argv) > 1 else "resident"

    u = ctypes.windll.user32
    k = ctypes.windll.kernel32
    a = ctypes.WinDLL("advapi32", use_last_error=True)
    u.GetForegroundWindow.restype = wintypes.HWND
    u.GetWindowTextLengthW.argtypes = [wintypes.HWND]
    u.GetWindowTextLengthW.restype = ctypes.c_int
    u.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
    u.GetWindowTextW.restype = ctypes.c_int
    u.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
    u.GetWindowThreadProcessId.restype = wintypes.DWORD
    u.GetAsyncKeyState.argtypes = [ctypes.c_int]
    u.GetAsyncKeyState.restype = ctypes.c_short
    k.OpenProcess.restype = wintypes.HANDLE
    k.QueryFullProcessImageNameW.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)]
    k.QueryFullProcessImageNameW.restype = wintypes.BOOL
    k.CloseHandle.argtypes = [wintypes.HANDLE]

    cache_key = None
    cached_titles = DEFAULT_TITLES
    cached_process_names = DEFAULT_PROCESS_NAMES
    token_elevation = 20

    def load_targets():
        nonlocal cache_key, cached_titles, cached_process_names
        path_value = os.environ.get("POE_GAME_WINDOW_TITLES_FILE", "")
        if not path_value:
            return DEFAULT_TITLES, DEFAULT_PROCESS_NAMES
        try:
            mtime_ns = os.stat(path_value).st_mtime_ns
            key = (path_value, mtime_ns)
            if key != cache_key:
                with open(path_value, "r", encoding="utf-8") as stream:
                    data = json.load(stream)
                values = data.get("titles") if isinstance(data, dict) else data
                titles = tuple(str(v).strip() for v in values if str(v).strip()) if isinstance(values, list) else ()
                pvalues = data.get("processNames") if isinstance(data, dict) else None
                pnames = tuple(
                    str(v).strip().rsplit("\\", 1)[-1].rsplit("/", 1)[-1].casefold()
                    for v in pvalues
                    if str(v).strip()
                ) if isinstance(pvalues, list) else ()
                cached_titles = titles or DEFAULT_TITLES
                cached_process_names = pnames or DEFAULT_PROCESS_NAMES
                cache_key = key
            return cached_titles, cached_process_names
        except Exception:
            return DEFAULT_TITLES, DEFAULT_PROCESS_NAMES

    def is_elevated(process_id):
        if not process_id:
            return None
        hproc = k.OpenProcess(0x1000, False, process_id)
        if not hproc:
            return None
        token = wintypes.HANDLE()
        try:
            if not a.OpenProcessToken(hproc, 0x0008, ctypes.byref(token)):
                if ctypes.get_last_error() == 5:
                    return True
                return None
            elevated = wintypes.DWORD()
            needed = wintypes.DWORD()
            ok = a.GetTokenInformation(token, token_elevation, ctypes.byref(elevated), ctypes.sizeof(elevated), ctypes.byref(needed))
            return bool(elevated.value) if ok else None
        finally:
            if token:
                k.CloseHandle(token)
            k.CloseHandle(hproc)

    current_elevated = is_elevated(os.getpid())

    def check_foreground():
        hwnd = u.GetForegroundWindow()
        if not hwnd:
            return 23
        length = u.GetWindowTextLengthW(hwnd)
        buf = ctypes.create_unicode_buffer(length + 1)
        u.GetWindowTextW(hwnd, buf, length + 1)
        titles, process_names = load_targets()
        title_folded = buf.value.casefold()
        if not any(t.casefold() in title_folded for t in titles if t):
            return 23
        pid = wintypes.DWORD()
        u.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        proc_name = ""
        if pid.value:
            hproc = k.OpenProcess(0x1000, False, pid.value)
            if hproc:
                try:
                    size = wintypes.DWORD(32768)
                    proc_buf = ctypes.create_unicode_buffer(size.value)
                    if k.QueryFullProcessImageNameW(hproc, 0, proc_buf, ctypes.byref(size)):
                        proc_name = os.path.basename(proc_buf.value).casefold()
                finally:
                    k.CloseHandle(hproc)
        if proc_name not in process_names:
            return 23
        if is_elevated(pid.value) is True and current_elevated is False:
            return 24
        return 0

    def release_conflicting_modifiers():
        for vk in (0xA0, 0xA1, 0x10, 0xA4, 0xA5, 0x12, 0x5B, 0x5C):
            if u.GetAsyncKeyState(vk) & 0x8000:
                u.keybd_event(vk, 0, 2, 0)

    def send_copy():
        code = check_foreground()
        if code:
            return code
        release_conflicting_modifiers()
        u.keybd_event(0x11, 0, 0, 0)
        u.keybd_event(0x43, 0, 0, 0)
        time.sleep(0.01)
        u.keybd_event(0x43, 0, 2, 0)
        u.keybd_event(0x11, 0, 2, 0)
        return 0

    if mode == "check":
        return check_foreground()
    if mode == "copy":
        return send_copy()

    for raw in sys.stdin:
        raw = raw.strip()
        if not raw:
            continue
        try:
            payload = json.loads(raw)
        except Exception:
            continue
        req_id = payload.get("id")
        action = payload.get("action")
        if action == "quit":
            break
        code = check_foreground() if action == "check" else (send_copy() if action == "copy" else 1)
        print(json.dumps({"id": req_id, "ok": code == 0, "code": code}), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
