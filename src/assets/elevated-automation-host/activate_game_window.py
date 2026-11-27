#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""固定游戏窗口激活脚本：校验标题与进程白名单，并将可信游戏窗口切到前台。"""

import ctypes
import json
import os
import sys
import time
from ctypes import wintypes


def main():
    if sys.platform != "win32":
        return 0
    if len(sys.argv) < 3:
        return 1

    u = ctypes.windll.user32
    k = ctypes.windll.kernel32
    a = ctypes.windll.advapi32
    titles = tuple(str(v).strip() for v in json.loads(sys.argv[1]) if str(v).strip())
    process_names = tuple(os.path.basename(str(v).strip()).casefold() for v in json.loads(sys.argv[2]) if str(v).strip())

    u.GetForegroundWindow.restype = wintypes.HWND
    u.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
    u.GetWindowThreadProcessId.restype = wintypes.DWORD
    k.OpenProcess.restype = wintypes.HANDLE
    k.QueryFullProcessImageNameW.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)]
    k.QueryFullProcessImageNameW.restype = wintypes.BOOL
    k.CloseHandle.argtypes = [wintypes.HANDLE]

    def identity(hwnd):
        if not hwnd or not u.IsWindow(hwnd):
            return ("", "", 0)
        length = u.GetWindowTextLengthW(hwnd)
        title_buffer = ctypes.create_unicode_buffer(length + 1)
        u.GetWindowTextW(hwnd, title_buffer, length + 1)
        pid = wintypes.DWORD()
        u.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        process_name = ""
        handle = k.OpenProcess(0x1000, False, pid.value) if pid.value else None
        if handle:
            try:
                size = wintypes.DWORD(32768)
                process_buffer = ctypes.create_unicode_buffer(size.value)
                if k.QueryFullProcessImageNameW(handle, 0, process_buffer, ctypes.byref(size)):
                    process_name = os.path.basename(process_buffer.value)
            finally:
                k.CloseHandle(handle)
        return (title_buffer.value, process_name, pid.value)

    def title_priority(title):
        folded = title.casefold()
        for index, value in enumerate(titles):
            if value.casefold() in folded:
                return index
        return len(titles)

    token_elevation = 20

    def is_elevated(pid):
        process = k.OpenProcess(0x1000, False, pid)
        if not process:
            return None
        token = wintypes.HANDLE()
        try:
            if not a.OpenProcessToken(process, 0x0008, ctypes.byref(token)):
                # 普通权限进程访问高权限进程令牌会返回 ERROR_ACCESS_DENIED (5)
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
            k.CloseHandle(process)

    current_elevated = is_elevated(os.getpid())
    foreground = u.GetForegroundWindow()
    if foreground and u.IsWindowVisible(foreground) and not u.IsIconic(foreground):
        fg_title, fg_process, fg_pid = identity(foreground)
        if title_priority(fg_title) < len(titles) and fg_process.casefold() in process_names:
            if is_elevated(fg_pid) is True and current_elevated is False:
                return 24
            print(json.dumps({"title": fg_title, "processName": fg_process}, ensure_ascii=False))
            return 0

    candidates = []
    callback_type = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)

    def visit(hwnd, _lparam):
        if not u.IsWindowVisible(hwnd):
            return True
        title, process_name, pid = identity(hwnd)
        if title_priority(title) >= len(titles) or process_name.casefold() not in process_names:
            return True
        rect = wintypes.RECT()
        area = 0
        if u.GetWindowRect(hwnd, ctypes.byref(rect)):
            area = max(0, rect.right - rect.left) * max(0, rect.bottom - rect.top)
        candidates.append((title_priority(title), bool(u.IsIconic(hwnd)), hwnd != foreground, -area, int(hwnd), title, process_name, pid))
        return True

    u.EnumWindows(callback_type(visit), 0)
    if not candidates:
        return 23
    candidates.sort(key=lambda item: item[:5])
    _, _, _, _, hwnd_value, selected_title, selected_process, selected_pid = candidates[0]
    hwnd = wintypes.HWND(hwnd_value)
    if is_elevated(selected_pid) is True and current_elevated is False:
        return 24

    current_thread = k.GetCurrentThreadId()
    foreground_thread = u.GetWindowThreadProcessId(foreground, None) if foreground else 0
    target_thread = u.GetWindowThreadProcessId(hwnd, None)
    attached_foreground = bool(foreground_thread and foreground_thread != current_thread and u.AttachThreadInput(current_thread, foreground_thread, True))
    attached_target = bool(target_thread and target_thread != current_thread and target_thread != foreground_thread and u.AttachThreadInput(current_thread, target_thread, True))
    try:
        if u.IsIconic(hwnd):
            u.ShowWindow(hwnd, 9)
        u.BringWindowToTop(hwnd)
        u.SetForegroundWindow(hwnd)
        u.SetFocus(hwnd)
    finally:
        if attached_target:
            u.AttachThreadInput(current_thread, target_thread, False)
        if attached_foreground:
            u.AttachThreadInput(current_thread, foreground_thread, False)

    deadline = time.monotonic() + 2.0
    while time.monotonic() < deadline and u.GetForegroundWindow() != hwnd_value:
        time.sleep(0.05)
    if u.GetForegroundWindow() != hwnd_value:
        return 25
    actual_title, actual_process, _ = identity(hwnd)
    if title_priority(actual_title) >= len(titles) or actual_process.casefold() not in process_names:
        return 26
    print(json.dumps({"title": actual_title or selected_title, "processName": actual_process or selected_process}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
