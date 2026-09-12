"""圣所原生通道：只接受主进程逐条请求，输出不含用户路径的结构化结果。"""
from __future__ import annotations

import base64
import ctypes
from ctypes import wintypes
import json
import sys
import threading
import time
from pathlib import Path

import cv2
import mss
import numpy as np

# The bundled Windows runtime uses an isolated _pth and does not implicitly
# add the script directory, unlike the development system Python.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from sanctum_tooltip import icon_candidates
from sanctum_frames import FramePool, open_mapping, frame_view
from interface_titles import match_titles, unique_title


class NativeError(Exception):
    def __init__(self, message, code='STEP_FAILED'):
        super().__init__(message)
        self.code = code


def emit(value):
    with OUTPUT_LOCK:
        print('SANCTUM ' + json.dumps(value, ensure_ascii=False), flush=True)


OUTPUT_LOCK = threading.Lock()


def crop(image, region):
    if not isinstance(region, dict) or any(type(region.get(key)) is not int for key in ('x', 'y', 'width', 'height')):
        raise NativeError('截图区域格式无效')
    x, y, w, h = (region[key] for key in ('x', 'y', 'width', 'height'))
    if x < 0 or y < 0 or w < 1 or h < 1 or x + w > image.shape[1] or y + h > image.shape[0]:
        raise NativeError('截图区域越界')
    return image[y:y+h, x:x+w]


class NativeSession:
    def __init__(self):
        if sys.platform != 'win32':
            raise NativeError('圣所实时采集仅支持 Windows')
        self.u = ctypes.windll.user32
        try:
            self.u.SetProcessDpiAwarenessContext(ctypes.c_void_p(-4))
            self.u.GetThreadDpiAwarenessContext.restype = wintypes.HANDLE
            self.u.GetAwarenessFromDpiAwarenessContext.argtypes = [wintypes.HANDLE]
            if self.u.GetAwarenessFromDpiAwarenessContext(self.u.GetThreadDpiAwarenessContext()) != 2:
                raise NativeError('当前线程未启用每显示器 DPI 感知')
        except Exception:
            raise NativeError('无法启用每显示器 DPI 感知')
        # Shared title/process allowlist; no window focus is acquired here.
        from foreground_watcher import window_matches_game
        self.matches_game = window_matches_game
        self.u.GetForegroundWindow.restype = wintypes.HWND
        self.u.GetClientRect.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.RECT)]
        self.u.ClientToScreen.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.POINT)]
        self.u.GetDpiForWindow.argtypes = [wintypes.HWND]
        self.u.GetDpiForWindow.restype = wintypes.UINT
        self.u.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
        self.u.GetWindowThreadProcessId.restype = wintypes.DWORD
        self.expected = None
        self.cancelled = threading.Event()
        self.input_lock = threading.RLock()
        self.watching = False
        self.engine = None

    def environment(self):
        hwnd = self.u.GetForegroundWindow()
        if not self.matches_game(hwnd):
            raise NativeError('游戏不在前台', 'SAFETY_INTERRUPTED')
        rect, origin = wintypes.RECT(), wintypes.POINT(0, 0)
        if not self.u.GetClientRect(hwnd, ctypes.byref(rect)) or not self.u.ClientToScreen(hwnd, ctypes.byref(origin)):
            raise NativeError('无法确认游戏客户区', 'SAFETY_INTERRUPTED')
        dpi = self.u.GetDpiForWindow(hwnd)
        width, height = rect.right - rect.left, rect.bottom - rect.top
        if not 48 <= dpi <= 768 or not 1 <= width <= 32768 or not 1 <= height <= 32768:
            raise NativeError('窗口或 DPI 无效', 'SAFETY_INTERRUPTED')
        process_id = wintypes.DWORD()
        self.u.GetWindowThreadProcessId(hwnd, ctypes.byref(process_id))
        if not process_id.value:
            raise NativeError('前台游戏进程未确认', 'SAFETY_INTERRUPTED')
        return {'environment': {'windowId': str(hwnd), 'processId': process_id.value, 'width': width, 'height': height, 'dpi': dpi},
                'clientBounds': {'x': origin.x, 'y': origin.y, 'width': width, 'height': height}}

    def check(self):
        if getattr(self,'deadline_at',None) and time.time()*1000 >= self.deadline_at:
            raise NativeError('当前步骤超时', 'STEP_TIMEOUT')
        if self.cancelled.is_set():
            raise NativeError('采集已停止', 'SAFETY_INTERRUPTED')
        current = self.environment()
        if self.expected and current != self.expected:
            raise NativeError('窗口位置、尺寸或 DPI 已变化，请重新校准', 'SAFETY_INTERRUPTED')
        return current

    def arm(self, expected):
        if self.expected is not None:
            raise NativeError('此原生会话已经开始，请先结束旧会话')
        current = self.environment()
        # Request metadata (such as captureWindows) is not window environment.
        expected_environment = {key: expected.get(key) for key in ('environment', 'clientBounds')}
        if current != expected_environment:
            raise NativeError('校准环境已变化', 'SAFETY_INTERRUPTED')
        self.expected = current
        self.cancelled.clear()
        self.watching = True

        def watch():
            while self.watching and not self.cancelled.wait(.025):
                try:
                    with self.input_lock:
                        self.check()
                except NativeError as error:
                    self.cancelled.set()
                    emit({'event': 'unsafe', 'reason': str(error), 'code': error.code})
                    break
        threading.Thread(target=watch, daemon=True).start()
        return current

    def image(self):
        current = self.check()
        hidden, masks = [], []
        try:
            for value in getattr(self, 'capture_windows', []):
                hwnd = wintypes.HWND(int(value['handle']))
                affinity = wintypes.DWORD()
                if not self.u.IsWindow(hwnd):
                    continue
                owner = wintypes.DWORD()
                self.u.GetWindowThreadProcessId(hwnd, ctypes.byref(owner))
                if owner.value != value['processId']:
                    raise NativeError('浮窗句柄已失效，截图已取消')
                excluded = self.u.GetWindowDisplayAffinity(hwnd, ctypes.byref(affinity)) and affinity.value == 0x11
                if not excluded and value.get('role') == 'control' and self.u.IsWindowVisible(hwnd):
                    rect = wintypes.RECT()
                    if not self.u.GetWindowRect(hwnd,ctypes.byref(rect)):
                        raise NativeError('控制面板位置未确认')
                    w,h = rect.right-rect.left,rect.bottom-rect.top
                    b = current['clientBounds']
                    options = getattr(self,'capture_options',{})
                    forbidden = [options.get(k) for k in ('mapRegion','effectIconsRegion','mapEffectIconsRegion','coinsRegion','mapResourcesRegion','hudResourcesRegion')]
                    forbidden += [t.get('region') for t in options.get('interfaceTitles',{}).values()]
                    candidates = [(12,12),(12,b['height']-h-12),(b['width']-w-12,12),(b['width']-w-12,b['height']-h-12)]
                    place = next(((x,y) for x,y in candidates if x>=0 and y>=0 and x+w<=b['width'] and y+h<=b['height'] and not any(r and x<r['x']+r['width'] and x+w>r['x'] and y<r['y']+r['height'] and y+h>r['y'] for r in forbidden)),None)
                    if place is None:
                        raise NativeError('系统不支持截图排除，采集区域外没有控制面板空间')
                    x,y=place
                    if not self.u.SetWindowPos(hwnd,None,b['x']+x,b['y']+y,w,h,0x0014):
                        raise NativeError('无法将控制面板移出采集区域')
                    masks.append((x,y,w,h))
                    continue
                if not excluded and self.u.IsWindowVisible(hwnd):
                    self.u.ShowWindow(hwnd, 0)
                    hidden.append(hwnd)
            if hidden:
                ctypes.windll.dwmapi.DwmFlush()
                if any(self.u.IsWindowVisible(hwnd) for hwnd in hidden):
                    raise NativeError('截图无法排除浮窗')
            if not getattr(self, 'screen_capture', None):
                self.screen_capture = mss.mss()
            bounds = current['clientBounds']
            image = np.asarray(self.screen_capture.grab({'left': bounds['x'], 'top': bounds['y'], 'width': bounds['width'], 'height': bounds['height']}))[:, :, :3].copy()
            for x,y,w,h in masks:
                image[y:y+h,x:x+w] = 255
            self.capture_masks = masks
        finally:
            for hwnd in hidden:
                if not self.cancelled.is_set():
                    self.u.ShowWindow(hwnd, 4)
        self.check()
        return image, current

    def progress(self, stage, **data):
        emit({'event':'progress', **getattr(self, 'request_context', {}), 'stage':stage, **data})

    def surface(self, observation):
        if hasattr(self,'request_context'):
            emit({'event':'surface', **self.request_context, 'observation':observation})

    def write_frame(self, options, image):
        spec = options['pool']
        if getattr(self, 'frame_pool_name', None) != spec['name']:
            if getattr(self, 'frame_mapping', None):
                self.frame_mapping.close()
            self.frame_mapping = open_mapping(spec)
            self.frame_pool_name = spec['name']
        view = frame_view(self.frame_mapping, spec, options['slot'])
        if view.shape != image.shape:
            raise NativeError('冻结画面尺寸变化', 'CONTEXT_CHANGED')
        np.copyto(view, image)

    def freeze_baseline(self, options):
        self.check()
        baseline = getattr(self, 'tooltip_baseline', None)
        if baseline is None:
            raise NativeError('采集基线缺失')
        self.write_frame(options, baseline)
        self.baseline_version = getattr(self, 'baseline_version', 0)+1
        return {'baselineVersion': self.baseline_version}

    def observe(self, options, include_text=True, snapshot=None):
        started = time.perf_counter()
        snapshot = snapshot or getattr(self,'surface_snapshot',None)
        self.surface_snapshot = None
        self.check()
        image, current = snapshot if snapshot is not None else self.image()
        self.tooltip_baseline = image
        screenshot_ms = (time.perf_counter()-started)*1000
        stamp = time.perf_counter()
        title = self.match_title(image, options, current)
        title_ms = (time.perf_counter()-stamp)*1000
        self.surface({**current,'mapOpen':bool(title),'foreground':True,'interfaceMatched':bool(title)})
        region = options.get('mapRegion') or {'x': 0, 'y': 0, 'width': image.shape[1], 'height': image.shape[0]}
        view = crop(image, region)
        calibration = dict(options.get('calibration') or {})
        if options.get('roomSample') and not hasattr(self, 'room_colors'):
            sample = cv2.imdecode(np.frombuffer(base64.b64decode(options['roomSample']), dtype=np.uint8), cv2.IMREAD_COLOR)
            if sample is not None:
                pixels = (sample.reshape(-1, 3) // 16) * 16
                pixels = pixels[np.max(pixels, axis=1) < 96]
                colors, counts = np.unique(pixels, axis=0, return_counts=True)
                self.room_colors = colors[np.argsort(counts)[-10:]].tolist()
        if calibration and hasattr(self, 'room_colors'):
            calibration['roomColors'] = self.room_colors
        stamp = time.perf_counter()
        from sanctum_recognition import analyze_floor
        floor = analyze_floor(view, calibration or None)
        map_ms = (time.perf_counter()-stamp)*1000
        self.last_floor = floor
        return {**current, 'foreground': True, 'userTakeover': False, 'mapOpen': bool(floor.get('rooms')),
                'interfaceMatched': bool(title), 'mapRegion': region, 'floor': floor,
                'captureMetrics': {'screenshotMs':round(screenshot_ms,2), 'titleMs':round(title_ms,2), 'mapMs':round(map_ms,2), 'mapTotalMs':round((time.perf_counter()-started)*1000,2)}, 'timestamp': round(time.monotonic() * 1000)}

    def hover(self, options):
        self.check()
        room = options.get('targetRoom')
        if not room or not getattr(self, 'last_floor', None):
            raise NativeError('地图尚未采集')
        region = options['mapRegion']
        point = (round(region['x']+room['x']+room['width']/2), round(region['y']+room['y']+room['height']/2))
        evidence = self.read_tooltip(options, point, 'map')
        return {**evidence, 'observation': {**self.check(), 'foreground':True, 'userTakeover':False,
                'mapOpen':True, 'interfaceMatched':True}}

    def interface_state(self, options, snapshot=None):
        if getattr(self, 'room_tooltip_pending', False):
            # Layout/title checks need a clear map, not the last hovered panel.
            b = self.check()['clientBounds']
            self.move_cursor((b['x']+b['width']-2, b['y']+b['height']-2))
            if self.cancelled.wait(.15):
                raise NativeError('采集已停止', 'SAFETY_INTERRUPTED')
            self.check()
            self.room_tooltip_pending = False
            self.surface_snapshot = None
        image, current = snapshot or self.image()
        self.surface_snapshot = (image,current)
        matched = match_titles(image, options.get('interfaceTitles', {}), current['environment'], options.get('matchThreshold', .8), anchored=True)
        map_open = bool(matched.get('sanctum-map'))
        # Within the guarded Sanctum session, closing the map exposes the HUD.
        if not map_open:
            return {**current, 'mapOpen': False, 'hudVisible': True, 'hudLayout': 'standalone'}
        key = 'sanctum-map-hud'
        hit = matched.get(key)
        expected = options.get('interfaceTitles', {}).get(key, {}).get('region')
        # Matching the same decoration elsewhere does not identify its layout.
        visible = bool(hit and expected and all(abs(hit['region'][axis] - expected[axis]) <= 8 for axis in ('x', 'y')))
        layout = 'map' if visible else None
        return {**current, 'mapOpen': map_open, 'hudVisible': visible, 'hudLayout': layout}

    def move_cursor(self, point):
        self.surface_snapshot = None
        with self.input_lock:
            self.check()
            if not self.u.SetCursorPos(*point):
                raise NativeError('无法移动鼠标')

    def read_tooltip(self, options, point, mode, verified=None):
        if self.expected is None:
            raise NativeError('采集尚未预检')
        started = time.perf_counter()
        metrics = {'contentScreenshots':0, 'ocrCalls':0, 'iconCalls':0,
                   'capacityWaitMs': options.get('capacityWaitMs', 0)}
        frozen = options.get('frozen')
        if not frozen or frozen['baselineVersion'] != getattr(self, 'baseline_version', None):
            raise NativeError('冻结基线未确认')
        current = self.check()
        self.progress('moving')
        b = current['clientBounds']
        self.move_cursor((b['x']+point[0], b['y']+point[1]))
        moved = time.perf_counter()
        previous = getattr(self, 'last_move_at', None)
        if previous is not None:
            metrics['moveIntervalMs'] = (moved-previous)*1000
        self.last_move_at = moved
        self.room_tooltip_pending = True
        self.progress('waiting-tooltip', moveTimeMs=moved*1000)
        stamp = time.perf_counter()
        if self.cancelled.wait(.15):
            raise NativeError('采集已停止', 'SAFETY_INTERRUPTED')
        metrics['waitMs'] = (time.perf_counter()-stamp)*1000
        stamp = time.perf_counter()
        image, state = self.image()
        metrics['screenshotMs'] = (time.perf_counter()-stamp)*1000
        metrics['contentScreenshots'] = 1
        metrics['titleMs'] = 0
        stamp = time.perf_counter()
        self.write_frame(frozen, image)
        self.check()
        metrics['handoffMs'] = (time.perf_counter()-stamp)*1000
        metrics['totalMs'] = (time.perf_counter()-started)*1000
        self.progress('queued')
        return {'frozenFrame': {key: frozen[key] for key in ('slot', 'baselineSlot', 'baselineVersion', 'frameId')}
                | {'mode': mode, 'point': point, 'masks': getattr(self, 'capture_masks', []),
                   'mapRegion': options.get('mapRegion')},
                'captureMetrics': {key: round(value, 2) for key, value in metrics.items()}}

    def validate_surface(self, image, current, options, mode):
        matches = match_titles(image, options.get('interfaceTitles',{}), current['environment'], options.get('matchThreshold',.8), anchored=True)
        map_open = bool(matches.get('sanctum-map'))
        if mode == 'map':
            valid = map_open
        elif options.get('hudLayout') == 'map':
            valid = bool(matches.get('sanctum-map-hud'))
        else:
            valid = not map_open
        if not valid:
            raise NativeError('圣所界面已关闭或变化')
        self.surface({**current,'mapOpen':bool(matches.get('sanctum-map')),'foreground':True,'interfaceMatched':True})

    def toggle_map(self, options):
        if self.expected is None or options.get('targetMode') not in ('map', 'effects'):
            raise NativeError('界面切换尚未预检')
        target = options['targetMode']
        before = self.interface_state(options)
        if target == 'map':
            if before['mapOpen'] or not before['hudVisible']:
                raise NativeError('独立状态栏未确认，不能打开地图')
        elif not before['mapOpen']:
            raise NativeError('圣所地图未确认，不能关闭地图')
        entry = None
        if target == 'map':
            image, current = self.image()
            template = options.get('interfaceTitles', {}).get('sanctum-map-entry')
            if not template:
                raise NativeError('请先校准禁域地图入口', 'STEP_FAILED')
            try:
                entry = unique_title(image, template, current['environment'], options.get('matchThreshold', .8))
            except (ValueError, TypeError, KeyError, cv2.error) as error:
                raise NativeError(str(error), 'STEP_FAILED') from error
            for x,y,w,h in getattr(self, 'capture_masks', []):
                if entry['x'] < x+w and entry['x']+entry['width'] > x and entry['y'] < y+h and entry['y']+entry['height'] > y:
                    raise NativeError('禁域地图入口被浮窗遮挡', 'STEP_FAILED')
        with self.input_lock:
            current = self.check()
            if any(self.u.GetAsyncKeyState(key) & 0x8000 for key in (0x10, 0x11, 0x12, 0x56, 1, 2)):
                raise NativeError('用户正在按键，请松开后手动重新开始', 'SAFETY_INTERRUPTED')
            if entry is not None:
                b = current['clientBounds']
                if not self.u.SetCursorPos(b['x']+entry['x']+entry['width']//2, b['y']+entry['y']+entry['height']//2):
                    raise NativeError('无法移动鼠标到禁域地图入口')
                self.check()
                try:
                    self.u.mouse_event(0x0002, 0, 0, 0, 0)
                finally:
                    self.u.mouse_event(0x0004, 0, 0, 0, 0)
            else:
                try:
                    self.u.keybd_event(0x56, 0, 0, 0)
                finally:
                    self.u.keybd_event(0x56, 0, 2, 0)
        self.surface_snapshot = None
        # One input, bounded observation of the target surface. The shared
        # capture deadline can shorten this wait but is never extended by it.
        deadline = time.monotonic() + 1.5
        delay = .15
        while time.monotonic() < deadline:
            remaining = deadline - time.monotonic()
            if getattr(self, 'deadline_at', None):
                remaining = min(remaining, (self.deadline_at-time.time()*1000)/1000)
            self.check()
            if remaining <= 0:
                break
            if self.cancelled.wait(min(delay, remaining)):
                raise NativeError('采集已停止', 'SAFETY_INTERRUPTED')
            self.check()
            current = self.interface_state(options)
            if (current['mapOpen'] if target == 'map' else not current['mapOpen'] and current['hudVisible']):
                return current
            delay = .05
        raise NativeError('点击禁域地图后开启超时' if target == 'map' else 'V 关闭地图超时', 'STEP_FAILED')

    def inspect_effects(self, options):
        self.check()
        image, current = getattr(self,'surface_snapshot',None) or self.image()
        self.surface_snapshot = None
        self.validate_surface(image, current, options, 'effects')
        self.tooltip_baseline = image
        r = options.get('effectIconsRegion')
        panel = crop(image, r)
        for x, y, w, h in getattr(self, 'capture_masks', []):
            if r['x'] < x+w and r['x']+r['width'] > x and r['y'] < y+h and r['y']+r['height'] > y:
                return {**current, 'icons': [], 'coverageConfirmed': False,
                        'reason': '效果图标区域与截图排除区重叠'}
        icons = icon_candidates(panel)
        return {**current, 'coverageConfirmed': True,
                'icons': [{**icon, 'x':icon['x']+r['x'], 'y':icon['y']+r['y']} for icon in icons]}

    def hover_effect(self, options):
        icon = options['icon']
        return {**self.read_tooltip(options,(icon['x'],icon['y']),'effects'), **self.check()}

    def match_title(self, image, options, current):
        return match_titles(image, options.get('interfaceTitles', {}), current['environment'],
                            options.get('matchThreshold', .8), anchored=True).get(options.get('interfaceKind'))

    def dispatch(self, command, options):
        if command == 'configure':
            self.static_options = {k: v for k, v in options.items() if k not in ('deadlineAt', 'captureWindows')}
            return {'configured': True}
        options = {**getattr(self, 'static_options', {}), **options}
        self.capture_windows = options.get('captureWindows', [])
        self.capture_options = options
        self.deadline_at = options.get('deadlineAt')
        if command == 'freezeBaseline':
            return self.freeze_baseline(options)
        if command == 'resumeCapture':
            bounds = self.check()['clientBounds']
            self.move_cursor((bounds['x']+bounds['width']-2, bounds['y']+bounds['height']-2))
            if self.cancelled.wait(.15):
                raise NativeError('采集已停止', 'SAFETY_INTERRUPTED')
            self.check()
            self.surface_snapshot = None
            if options.get('mode') == 'map':
                return self.observe(options)
            if options.get('mode') == 'effects':
                return self.inspect_effects(options)
            return self.interface_state(options)
        if command == 'readRunPanel':
            if self.expected is None:
                raise NativeError('实际状态读取未预检')
            layout = self.interface_state(options) if getattr(self, 'room_tooltip_pending', False) else None
            image, current = getattr(self, 'surface_snapshot', None) or self.image()
            self.surface_snapshot = None
            layout = layout or self.interface_state(options, snapshot=(image, current))
            map_open = layout['mapOpen']
            regions = {}
            for key in (('coinsRegion', 'mapResourcesRegion') if map_open else ('hudResourcesRegion',)):
                r = options.get(key)
                if r is None:
                    continue
                try:
                    selected = crop(image, r)
                    for x,y,w,h in getattr(self, 'capture_masks', []):
                        if r['x'] < x+w and r['x']+r['width'] > x and r['y'] < y+h and r['y']+r['height'] > y:
                            raise NativeError('实际资源被浮窗遮挡')
                    ok, png = cv2.imencode('.png', selected)
                    if not ok:
                        raise NativeError('实际资源截图失败')
                    regions[key] = {'region':r, 'status':'located', 'png':base64.b64encode(png).decode('ascii')}
                except NativeError as error:
                    regions[key] = {'region':r, 'status':'unknown', 'reason':str(error), 'texts':[]}
            if not regions:
                raise NativeError('请先配置资源数值选区')
            self.surface_snapshot = (image, current)
            return {**current, 'regions':regions, 'interfaceState':layout, 'resourceLayout':'map' if map_open else 'standalone'}
        if command in ('interfaceState', 'toggleMap', 'inspectEffects', 'hoverEffect'):
            return {'interfaceState': self.interface_state, 'toggleMap': self.toggle_map, 'inspectEffects': self.inspect_effects, 'hoverEffect': self.hover_effect}[command](options)
        if command == 'neutralGrid':
            if self.expected is None:
                raise NativeError('圣物采集未预检')
            observed = self.inspect_grid(options)
            bounds = observed['clientBounds']
            with self.input_lock:
                self.check()
                point = (bounds['x']+bounds['width']-2, bounds['y']+bounds['height']-2)
                if not self.u.SetCursorPos(*point):
                    raise NativeError('无法离开圣物网格')
            if self.cancelled.wait(.15):
                raise NativeError('扫描已停止')
            return self.inspect_grid(options)
        if command == 'inspectGrid':
            return self.inspect_grid(options)
        if command == 'copyCell':
            return self.copy_cell(options)
        if command == 'environment':
            return self.environment()
        if command == 'arm':
            return self.arm(options)
        if command == 'observe':
            return self.observe(options)
        if command == 'hover':
            return self.hover(options)
        raise NativeError('不支持的圣所原生操作')

    def inspect_grid(self, options):
        from sanctum_grid import inspect_grid
        image, current = self.image()
        if not self.match_title(image, options, current):
            raise NativeError('圣物公共标题失配或已关闭')
        result = inspect_grid(crop(image, options['mapRegion']), options['columns'], options['rows'], options.get('templates', {}))
        return {**current, **result}

    def copy_cell(self, options):
        from sanctum_grid import inspect_grid, hover_footprint, copy_keys
        if self.expected is None:
            raise NativeError('圣物采集未预检')
        image, current = self.image()
        if not self.match_title(image, options, current):
            raise NativeError('圣物界面已关闭')
        region = options['mapRegion']
        grid = crop(image, region)
        result = inspect_grid(grid, options['columns'], options['rows'], options.get('templates', {}))
        if result['fingerprint'] != options['expectedFingerprint']:
            raise NativeError('圣物网格发生变化')
        x, y = options['x'], options['y']
        if type(x) is not int or type(y) is not int or not 0 <= x < options['columns'] or not 0 <= y < options['rows']:
            raise NativeError('圣物格子越界')
        if options.get('cellStates', [])[y * options['columns'] + x] != 'usable':
            raise NativeError('此格禁止扫描')
        bounds = current['clientBounds']
        point = (round(bounds['x']+region['x']+(x+.5)*region['width']/options['columns']),
                 round(bounds['y']+region['y']+(y+.5)*region['height']/options['rows']))
        with self.input_lock:
            self.check()
            if not self.u.SetCursorPos(*point):
                raise NativeError('无法悬停圣物')
        if self.cancelled.wait(.2):
            raise NativeError('扫描已停止')
        hovered, _ = self.image()
        if not self.match_title(hovered, options, current):
            raise NativeError('圣物界面已关闭')
        footprint = hover_footprint(grid, crop(hovered, region), x, y, options['columns'], options['rows'])
        sequence = self.u.GetClipboardSequenceNumber()
        if not sequence:
            raise NativeError('剪贴板不可用')
        with self.input_lock:
            self.check()
            copy_keys(self.u)
        raw = ''
        import pyperclip
        for _ in range(32):
            if self.cancelled.wait(.025):
                raise NativeError('扫描已停止')
            self.check()
            if self.u.GetClipboardSequenceNumber() != sequence:
                text = pyperclip.paste()
                if isinstance(text, str) and len(text) <= 20000:
                    raw = text
                break
        latest, _ = self.image()
        if not self.match_title(latest, options, current):
            raise NativeError('圣物界面已关闭')
        second = hover_footprint(grid, crop(latest, region), x, y, options['columns'], options['rows'])
        if second != footprint:
            footprint = None
        with self.input_lock:
            self.check()
            neutral = (bounds['x']+bounds['width']-2, bounds['y']+bounds['height']-2)
            if not self.u.SetCursorPos(*neutral):
                raise NativeError('无法结束圣物悬停')
        if self.cancelled.wait(.15):
            raise NativeError('扫描已停止')
        after = self.inspect_grid(options)
        if after['fingerprint'] != result['fingerprint']:
            raise NativeError('复制期间网格变化')
        return {'rawText': raw, 'footprint': footprint, 'fingerprint': after['fingerprint']}


def main():
    from sanctum_frozen_image import FrozenImages
    images = FrozenImages()
    session = None
    ocr_engine = None
    frame_pool = None
    for line in sys.stdin:
        request = {}
        try:
            if len(line) > 26 * 1024 * 1024:
                raise NativeError('圣所请求过大')
            request = json.loads(line)
            if request.get('command') == 'resetImages':
                images.close()
                emit({'id': request['id'], 'success': True, 'data': {'released': True}})
                continue
            if request.get('command') in ('prepareFrames', 'processFrame'):
                options = request.get('input', {})
                if request['command'] == 'prepareFrames':
                    from sanctum_postprocess import process_image
                    if frame_pool:
                        frame_pool.close()
                    frame_pool = FramePool(options['width'], options['height'])
                    result = frame_pool.spec
                else:
                    if frame_pool is None:
                        raise NativeError('图片处理缓冲未就绪')
                    binding = options['binding']
                    if binding['frameId'] != options['frameId'] or binding['baselineVersion'] != options['baselineVersion']:
                        raise NativeError('冻结画面身份失配')
                    context = dict(id=request['id'], sessionId=request.get('sessionId'),
                                   targetId=binding['roomId'], frameId=binding['frameId'],
                                   captureSessionId=binding['sessionId'], baselineVersion=binding['baselineVersion'])
                    from sanctum_postprocess import process_image
                    result = process_image(frame_pool.view(options['baselineSlot']), frame_pool.view(options['slot']), options,
                                           lambda frame: emit(dict(event='evidence', **context, **frame)))
                emit({'id': request['id'], 'success': True, 'data': result})
                continue
            if request.get('command') == 'releaseImage':
                images.release(request.get('input', {}))
                emit({'id': request['id'], 'success': True, 'data': {'released': True}})
                continue
            if request.get('command') in ('readFrozen', 'prepareOcr', 'prepareIcons'):
                from sanctum_ocr import read_frozen
                if request['command'] == 'prepareIcons':
                    cv2.setNumThreads(1)
                    emit({'id': request['id'], 'success': True, 'data': {'ready': True}})
                    continue
                if ocr_engine is None and not request.get('input', {}).get('iconsOnly'):
                    from sanctum_ocr import create_sanctum_ocr_engine
                    cv2.setNumThreads(1)
                    ocr_engine = create_sanctum_ocr_engine(request.get('input', {}).get('threads', 2))
                result = {'ready': True} if request['command'] == 'prepareOcr' else read_frozen(request.get('input', {}), ocr_engine, images)
                emit({'id': request['id'], 'success': True, 'data': result})
                continue
            if session is None:
                session = NativeSession()
            session.request_context = {'id':request['id'], 'sessionId':request.get('sessionId'),
                                       'targetId':request.get('input',{}).get('roomId') or request.get('input',{}).get('effectTarget')}
            try:
                result = session.dispatch(request['command'], request.get('input', {}))
            finally:
                session.deadline_at = None
            emit({'id': request['id'], 'success': True, 'data': result})
        except NativeError as error:
            emit({'id': request.get('id'), 'success': False, 'error': str(error), 'code': error.code})
        except Exception:
            emit({'id': request.get('id'), 'success': False, 'error': '圣所原生识别失败，请检查区域和运行环境'})
    images.close()
    if frame_pool:
        frame_pool.close()
    if session:
        session.watching = False
        if getattr(session, 'screen_capture', None):
            session.screen_capture.close()
        if getattr(session, 'frame_mapping', None):
            session.frame_mapping.close()


if __name__ == '__main__':
    main()
