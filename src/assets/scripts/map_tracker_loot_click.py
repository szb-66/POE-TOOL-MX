import ctypes
import json
import os
import queue
import sys
import threading
from ctypes import wintypes

WH_MOUSE_LL, WM_LBUTTONDOWN, WM_LBUTTONUP, VK_CONTROL = 14, 0x0201, 0x0202, 0x11
PROCESS_NAMES = {"pathofexile.exe", "pathofexile_x64.exe", "pathofexilesteam.exe", "pathofexile_x64steam.exe", "pathofexileegs.exe", "pathofexile_x64egs.exe"}
user32, kernel32 = ctypes.windll.user32, ctypes.windll.kernel32
replays, pending, bypass = queue.Queue(), set(), False

class MSLLHOOKSTRUCT(ctypes.Structure):
    _fields_ = [("pt", wintypes.POINT), ("mouseData", wintypes.DWORD), ("flags", wintypes.DWORD), ("time", wintypes.DWORD), ("extra", ctypes.POINTER(ctypes.c_ulong))]

def foreground_game():
    pid = wintypes.DWORD(); user32.GetWindowThreadProcessId(user32.GetForegroundWindow(), ctypes.byref(pid)); process = kernel32.OpenProcess(0x1000, False, pid.value)
    if not process: return False
    try:
        size = wintypes.DWORD(32768); buffer = ctypes.create_unicode_buffer(size.value)
        return bool(kernel32.QueryFullProcessImageNameW(process, 0, buffer, ctypes.byref(size))) and os.path.basename(buffer.value).lower() in PROCESS_NAMES
    finally: kernel32.CloseHandle(process)

def read_commands():
    for line in sys.stdin:
        try:
            value = json.loads(line); event_id = int(value.get("id", -1))
            if value.get("action") == "replay" and event_id in pending: pending.remove(event_id); replays.put(event_id)
        except Exception: pass

def replay_worker():
    global bypass
    while True:
        replays.get(); bypass = True
        user32.mouse_event(0x0002, 0, 0, 0, 0); user32.mouse_event(0x0004, 0, 0, 0, 0)
        bypass = False

counter, suppress_up = 0, False
CALLBACK = ctypes.WINFUNCTYPE(ctypes.c_long, ctypes.c_int, wintypes.WPARAM, wintypes.LPARAM)
def hook(code, message, data):
    global counter, suppress_up
    info = ctypes.cast(data, ctypes.POINTER(MSLLHOOKSTRUCT)).contents
    if code >= 0 and not bypass and not (info.flags & 1):
        if message == WM_LBUTTONDOWN and user32.GetAsyncKeyState(VK_CONTROL) & 0x8000 and foreground_game():
            counter += 1; pending.add(counter); suppress_up = True; print(json.dumps({"event": "ctrl-click", "id": counter}), flush=True); return 1
        if message == WM_LBUTTONUP and suppress_up:
            suppress_up = False; return 1
    return user32.CallNextHookEx(None, code, message, data)

threading.Thread(target=read_commands, daemon=True).start(); threading.Thread(target=replay_worker, daemon=True).start()
callback = CALLBACK(hook); handle = user32.SetWindowsHookExW(WH_MOUSE_LL, callback, kernel32.GetModuleHandleW(None), 0)
if not handle: raise SystemExit(2)
message = wintypes.MSG()
while user32.GetMessageW(ctypes.byref(message), None, 0, 0) != 0:
    user32.TranslateMessage(ctypes.byref(message)); user32.DispatchMessageW(ctypes.byref(message))
