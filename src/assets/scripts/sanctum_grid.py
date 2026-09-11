"""圣物网格视觉证据与原子复制输入；不按相同文本猜测占格。"""
import base64
import ctypes
from ctypes import wintypes
import hashlib
import cv2
import numpy as np


def png(image):
    ok, encoded = cv2.imencode('.png', image)
    if not ok:
        raise ValueError('cannot encode calibration')
    return base64.b64encode(encoded).decode('ascii')


def decode(value):
    if not isinstance(value, str) or len(value) > 1400000:
        raise ValueError('invalid image')
    return cv2.imdecode(np.frombuffer(base64.b64decode(value, validate=True), dtype=np.uint8), cv2.IMREAD_COLOR)


def cell_image(image, x, y, columns, rows):
    w, h = image.shape[1] / columns, image.shape[0] / rows
    return image[round(y*h)+3:round((y+1)*h)-3, round(x*w)+3:round((x+1)*w)-3]


def inspect_grid(image, columns, rows, templates):
    if type(columns) is not int or type(rows) is not int or not 1 <= columns <= 24 or not 1 <= rows <= 24:
        raise ValueError('invalid grid')
    if image.shape[1] / columns < 16 or image.shape[0] / rows < 16:
        raise ValueError('grid cells too small')
    references = {key: decode(value) for key, value in templates.items() if key in ('empty', 'locked') and value}
    cells, signatures = [], []
    for y in range(rows):
        for x in range(columns):
            cell = cell_image(image, x, y, columns, rows)
            tiny = cv2.resize(cell, (16, 16), interpolation=cv2.INTER_AREA)
            signatures.append((tiny // 16).tobytes())
            matches = [key for key, reference in references.items() if reference is not None and
                       np.mean(cv2.absdiff(tiny, cv2.resize(reference, (16, 16), interpolation=cv2.INTER_AREA))) <= 2]
            cells.append({'x': x, 'y': y, 'status': matches[0] if len(matches) == 1 else 'unknown'})
    return {'cells': cells, 'fingerprint': hashlib.sha256(b''.join(signatures)).hexdigest()}


def hover_footprint(before, after, x, y, columns, rows):
    if before.shape != after.shape:
        return None
    w, h = before.shape[1] / columns, before.shape[0] / rows
    mask = (np.max(cv2.absdiff(before, after), axis=2) > 18).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    candidates = []
    for contour in contours:
        left, top, width, height = cv2.boundingRect(contour)
        edges = [left/w, top/h, (left+width)/w, (top+height)/h]
        if any(abs(edge-round(edge)) > .15 for edge in edges):
            continue
        x0, y0, x1, y1 = map(round, edges)
        if not (0 <= x0 <= x < x1 <= columns and 0 <= y0 <= y < y1 <= rows):
            continue
        if not 1 <= x1-x0 <= 4 or not 1 <= y1-y0 <= 4:
            continue
        candidates.append({'x': x0, 'y': y0, 'width': x1-x0, 'height': y1-y0})
    return candidates[0] if len(candidates) == 1 else None


class MouseInput(ctypes.Structure):
    _fields_ = [('dx', wintypes.LONG), ('dy', wintypes.LONG), ('mouseData', wintypes.DWORD),
                ('dwFlags', wintypes.DWORD), ('time', wintypes.DWORD), ('dwExtraInfo', ctypes.c_size_t)]


class KeyboardInput(ctypes.Structure):
    _fields_ = [('wVk', wintypes.WORD), ('wScan', wintypes.WORD), ('dwFlags', wintypes.DWORD),
                ('time', wintypes.DWORD), ('dwExtraInfo', ctypes.c_size_t)]


class HardwareInput(ctypes.Structure):
    _fields_ = [('uMsg', wintypes.DWORD), ('wParamL', wintypes.WORD), ('wParamH', wintypes.WORD)]


class InputUnion(ctypes.Union):
    _fields_ = [('mi', MouseInput), ('ki', KeyboardInput), ('hi', HardwareInput)]


class Input(ctypes.Structure):
    _fields_ = [('type', wintypes.DWORD), ('value', InputUnion)]


def copy_keys(user32):
    # Send the complete chord in one OS call, including both releases.
    if any(user32.GetAsyncKeyState(key) & 0x8000 for key in (0x10, 0x11, 0x12, 0x01, 0x02)):
        raise ValueError('user input active')
    events = (Input * 4)()
    for event, (key, flags) in zip(events, [(0x11, 0), (0x43, 0), (0x43, 2), (0x11, 2)]):
        event.type = 1
        event.value.ki = KeyboardInput(key, 0, flags, 0, 0)
    user32.SendInput.argtypes = [wintypes.UINT, ctypes.POINTER(Input), ctypes.c_int]
    user32.SendInput.restype = wintypes.UINT
    if user32.SendInput(4, events, ctypes.sizeof(Input)) != 4:
        releases = (Input * 2)(events[2], events[3])
        user32.SendInput(2, releases, ctypes.sizeof(Input))
        raise ValueError('copy input failed')
