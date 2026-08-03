"""流放助手战斗辅助：自动喝药、像素采样和一键回城。"""

import argparse
import ctypes
import json
import os
import signal
import sys
import time


def enable_per_monitor_dpi_awareness():
    """让 Windows API 坐标始终按虚拟桌面的物理像素解释。"""
    if sys.platform != "win32":
        return False
    user32 = ctypes.windll.user32
    try:
        user32.SetProcessDpiAwarenessContext.argtypes = [ctypes.c_void_p]
        user32.SetProcessDpiAwarenessContext.restype = ctypes.c_bool
        if user32.SetProcessDpiAwarenessContext(ctypes.c_void_p(-4)):
            return True
    except Exception:
        pass
    try:
        return ctypes.windll.shcore.SetProcessDpiAwareness(2) == 0
    except Exception:
        try:
            return bool(user32.SetProcessDPIAware())
        except Exception:
            return False


enable_per_monitor_dpi_awareness()


GAME_WINDOW_TITLES = ("流放之路", "Path of Exile")
_game_window_titles_cache = GAME_WINDOW_TITLES
_game_window_titles_mtime_ns = None
running = True


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


def should_trigger(value, threshold, now_ms, last_trigger_ms, mode, recovery_ms, instant_ms):
    if value >= threshold:
        return False
    interval = instant_ms if mode == "instant" else recovery_ms
    return last_trigger_ms <= 0 or now_ms - last_trigger_ms >= max(1, interval)


class RateLimiter:
    def __init__(self, maximum, cooldown_ms):
        self.maximum = max(1, int(maximum))
        self.cooldown_ms = max(1, int(cooldown_ms))
        self.recent = []
        self.protected_until = 0

    def configure(self, maximum, cooldown_ms):
        self.maximum = max(1, int(maximum))
        self.cooldown_ms = max(1, int(cooldown_ms))

    def allow(self, now_ms):
        if now_ms < self.protected_until:
            return False, "protected"
        self.recent = [stamp for stamp in self.recent if now_ms - stamp < 1000]
        if len(self.recent) >= self.maximum:
            self.protected_until = now_ms + self.cooldown_ms
            self.recent = []
            return False, "limit"
        self.recent.append(now_ms)
        return True, "ok"


def is_game_foreground():
    if sys.platform != "win32":
        return False
    hwnd = ctypes.windll.user32.GetForegroundWindow()
    length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
    buffer = ctypes.create_unicode_buffer(length + 1)
    ctypes.windll.user32.GetWindowTextW(hwnd, buffer, length + 1)
    title = buffer.value
    return game_window_title_priority(title) >= 0


def read_pixel(point):
    if sys.platform != "win32":
        raise RuntimeError("像素采样仅支持 Windows")
    x, y = int(point.get("x", 0)), int(point.get("y", 0))
    user32 = ctypes.windll.user32
    gdi32 = ctypes.windll.gdi32
    gdi32.GetPixel.restype = ctypes.c_uint32
    device_context = user32.GetDC(0)
    if not device_context:
        raise RuntimeError("无法获取屏幕设备上下文")
    try:
        color = gdi32.GetPixel(device_context, x, y)
        if color == 0xFFFFFFFF:
            raise RuntimeError(f"无法读取屏幕坐标 ({x}, {y})")
        return {
            "r": color & 0xFF,
            "g": (color >> 8) & 0xFF,
            "b": (color >> 16) & 0xFF
        }
    finally:
        user32.ReleaseDC(0, device_context)


def key_to_virtual_code(name):
    value = str(name).strip()
    lower = value.lower()
    aliases = {
        "ctrl": 0x11, "control": 0x11, "alt": 0x12, "shift": 0x10,
        "enter": 0x0D, "return": 0x0D, "esc": 0x1B, "escape": 0x1B,
        "space": 0x20, "tab": 0x09, "up": 0x26, "down": 0x28,
        "left": 0x25, "right": 0x27
    }
    if lower in aliases:
        return aliases[lower]
    if lower.startswith("f") and lower[1:].isdigit():
        number = int(lower[1:])
        if 1 <= number <= 24:
            return 0x70 + number - 1
    if lower.startswith("numpad") and lower[6:].isdigit():
        number = int(lower[6:])
        if 0 <= number <= 9:
            return 0x60 + number
    if len(value) == 1:
        virtual_code = ctypes.windll.user32.VkKeyScanW(ord(value))
        if virtual_code != -1:
            return virtual_code & 0xFF
    raise ValueError(f"不支持的按键: {name}")


def send_sequence(keys, foreground_check=None, key_event_sender=None):
    check_foreground = foreground_check or is_game_foreground
    send_key_event = key_event_sender or ctypes.windll.user32.keybd_event
    sent_count = 0
    for name in keys:
        if not check_foreground():
            break
        virtual_code = key_to_virtual_code(name)
        send_key_event(virtual_code, 0, 0, 0)
        send_key_event(virtual_code, 0, 0x0002, 0)
        sent_count += 1
    return sent_count


def click_point(point, foreground_check=None, cursor_setter=None, mouse_event_sender=None):
    check_foreground = foreground_check or is_game_foreground
    user32 = None if cursor_setter and mouse_event_sender else ctypes.windll.user32
    set_cursor = cursor_setter or user32.SetCursorPos
    send_mouse_event = mouse_event_sender or user32.mouse_event
    if not check_foreground():
        return False
    set_cursor(int(point.get("x", 0)), int(point.get("y", 0)))
    if not check_foreground():
        return False
    send_mouse_event(0x0002, 0, 0, 0, 0)
    send_mouse_event(0x0004, 0, 0, 0, 0)
    return True


def stop_running(_signum=None, _frame=None):
    global running
    running = False


class RuntimeConfig:
    def __init__(self, path, initial):
        self.path = path
        self.cached = initial
        self.mtime_ns = None
        if path:
            try:
                self.mtime_ns = os.stat(path).st_mtime_ns
            except OSError:
                pass

    def load(self):
        if not self.path:
            return self.cached
        try:
            mtime_ns = os.stat(self.path).st_mtime_ns
            if mtime_ns == self.mtime_ns:
                return self.cached
            candidate = load_config(self.path)
            if not isinstance(candidate, dict) or not isinstance(candidate.get("potion"), dict):
                raise ValueError("invalid combat runtime config")
            self.cached = candidate
            self.mtime_ns = mtime_ns
        except Exception:
            return self.cached
        return self.cached


def run_potion(config, config_path=None):
    global running
    running = True
    signal.signal(signal.SIGTERM, stop_running)
    signal.signal(signal.SIGINT, stop_running)

    runtime_config = RuntimeConfig(config_path, config)
    potion = runtime_config.load().get("potion", {})
    limiter = RateLimiter(
        potion.get("maxTriggersPerSecond", 5),
        potion.get("protectionCooldownMs", 1000)
    )
    last_trigger = {"health": 0, "mana": 0}
    last_focus = None
    emit("started")

    while running:
        config = runtime_config.load()
        potion = config.get("potion", {})
        scan_interval = max(10, int(potion.get("scanIntervalMs", 100)))
        limiter.configure(
            potion.get("maxTriggersPerSecond", 5),
            potion.get("protectionCooldownMs", 1000)
        )
        focused = is_game_foreground()
        if focused != last_focus:
            emit("focus", active=focused)
            last_focus = focused
        if not focused:
            time.sleep(scan_interval / 1000)
            continue

        now_ms = int(time.monotonic() * 1000)
        for name, component in (("health", "r"), ("mana", "b")):
            resource = potion.get(name, {})
            if not resource.get("enabled", False):
                continue
            color = read_pixel(resource.get("point", {}))
            value = color[component]
            if not should_trigger(
                value,
                int(resource.get("threshold", 0)),
                now_ms,
                last_trigger[name],
                resource.get("recoveryMode", "duration"),
                int(resource.get("recoveryCooldownMs", 500)),
                int(resource.get("instantIntervalMs", 100))
            ):
                continue

            allowed, reason = limiter.allow(now_ms)
            if not allowed:
                if reason == "limit":
                    emit("protected", until=limiter.protected_until)
                continue

            if not is_game_foreground():
                if last_focus is not False:
                    emit("focus", active=False)
                    last_focus = False
                break

            keys = resource.get("keys", [])
            sent_count = send_sequence(keys)
            if sent_count < len(keys) and last_focus is not False:
                emit("focus", active=False)
                last_focus = False
            if sent_count <= 0:
                break

            last_trigger[name] = now_ms
            emit("triggered", resource=name, value=value, color=color, keysSent=sent_count)
            if sent_count < len(keys):
                break

        time.sleep(scan_interval / 1000)

    emit("stopped")
    return 0


def run_sample(config):
    point = config.get("point", {})
    print(json.dumps({"success": True, "color": read_pixel(point)}, ensure_ascii=False), flush=True)


def run_portal(config):
    if not is_game_foreground():
        print(json.dumps({"success": False, "error": "游戏窗口当前不在前台"}, ensure_ascii=False), flush=True)
        return 2

    portal = config.get("portal", config)
    if send_sequence([portal.get("openKey", "Numpad1")]) != 1:
        print(json.dumps({"success": False, "error": "游戏窗口当前不在前台"}, ensure_ascii=False), flush=True)
        return 2
    time.sleep(max(0, int(portal.get("waitMs", 500))) / 1000)
    if not is_game_foreground():
        print(json.dumps({"success": False, "error": "游戏窗口当前不在前台"}, ensure_ascii=False), flush=True)
        return 2
    point = portal.get("clickPoint", {})
    if not click_point(point):
        print(json.dumps({"success": False, "error": "游戏窗口当前不在前台"}, ensure_ascii=False), flush=True)
        return 2
    print(json.dumps({"success": True}, ensure_ascii=False), flush=True)
    return 0


def load_config(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("potion", "sample", "portal"), required=True)
    parser.add_argument("--config", required=True)
    args = parser.parse_args()
    config = load_config(args.config)
    if args.mode == "potion":
        run_potion(config, args.config)
        return 0
    if args.mode == "sample":
        run_sample(config)
        return 0
    return run_portal(config)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"success": False, "error": str(error)}, ensure_ascii=False), flush=True)
        raise
