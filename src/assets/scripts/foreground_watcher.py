#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""游戏前台监视器：轮询系统前台窗口标题，状态变化时输出结构化 EVENT 行。"""

import ctypes
import json
import os
import signal
import sys
import time
from ctypes import wintypes


GAME_WINDOW_TITLES = ("流放之路", "Path of Exile")
_game_window_titles_cache = GAME_WINDOW_TITLES
_game_window_titles_mtime_ns = None
POLL_INTERVAL_SECONDS = 0.25

is_running = True
_last_foreground = None


def configure_output():
    try:
        if sys.version_info >= (3, 7):
            sys.stdout.reconfigure(encoding="utf-8")
            sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


configure_output()


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
    return next(
        (priority for priority, expected_title in enumerate(game_window_titles()) if expected_title.casefold() in folded),
        -1,
    )


def foreground_game_state():
    if sys.platform != "win32":
        return False, ""
    user32 = ctypes.windll.user32
    user32.GetForegroundWindow.restype = wintypes.HWND
    hwnd = user32.GetForegroundWindow()
    if not hwnd:
        return False, ""
    user32.GetWindowTextLengthW.argtypes = [wintypes.HWND]
    user32.GetWindowTextLengthW.restype = ctypes.c_int
    user32.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
    user32.GetWindowTextW.restype = ctypes.c_int
    length = user32.GetWindowTextLengthW(hwnd)
    buffer = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buffer, length + 1)
    title = buffer.value.strip()
    return game_window_title_priority(title) >= 0, title


def emit(event, **payload):
    print("EVENT " + json.dumps({"event": event, **payload}, ensure_ascii=False), flush=True)


def signal_handler(_signum, _frame):
    global is_running
    is_running = False


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


def main():
    global _last_foreground
    game, title = foreground_game_state()
    _last_foreground = game
    emit("foreground", game=game, title=title)
    while is_running:
        time.sleep(POLL_INTERVAL_SECONDS)
        game, title = foreground_game_state()
        if game != _last_foreground:
            _last_foreground = game
            emit("foreground", game=game, title=title)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
