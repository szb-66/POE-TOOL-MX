"""Shared client-relative title matcher for global detection and pre-input checks."""
import base64
from functools import lru_cache
import cv2
import numpy as np


@lru_cache(maxsize=32)
def decoded_title(raw):
    return cv2.imdecode(np.frombuffer(base64.b64decode(raw, validate=True), np.uint8), cv2.IMREAD_GRAYSCALE)


def title_region(entry, template):
    r = entry.get('region')
    env = entry.get('environment', {})
    if not isinstance(r, dict) or any(type(r.get(k)) is not int for k in ('x', 'y', 'width', 'height')):
        raise ValueError('标题框选区域无效，请重新框选')
    h, w = template.shape
    if (r['x'] < 0 or r['y'] < 0 or r['width'] != w or r['height'] != h
            or r['x'] + w > env.get('width', 0) or r['y'] + h > env.get('height', 0)):
        raise ValueError('标题框选区域无效，请重新框选')
    return r


def match_titles(image, templates, environment, threshold=.8, anchored=False, issues=None, origin=(0, 0), report_unmatched=False):
    result = {}
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if image.ndim == 3 else image
    for key, entry in templates.items():
        try:
            matched = match_title(gray, entry, environment, threshold, anchored, origin)
            if matched:
                result[key] = {'matched': True, 'templateId': key, **matched}
            elif report_unmatched and all(entry.get('environment', {}).get(f) == environment.get(f) for f in ('width', 'height', 'dpi')):
                # Explicit negative only for a valid template in a matching environment;
                # invalid or mismatched entries stay absent ("missing title must not clear").
                result[key] = {'matched': False}
        except (ValueError, TypeError, KeyError, AttributeError, cv2.error):
            if issues is not None:
                issues[key] = '标题模板或框选区域无效，请重新框选'
    return result


def match_title(gray, entry, environment, threshold, anchored, origin=(0, 0)):
    expected = entry.get('environment', {})
    if any(expected.get(field) != environment.get(field) for field in ('width', 'height', 'dpi')):
        return None
    raw = entry.get('png', '')
    if not isinstance(raw, str) or len(raw) > 1400000:
        raise ValueError('标题模板无效')
    template = decoded_title(raw)
    if template is None or min(template.shape) < 2 or float(np.std(template)) <= 4:
        raise ValueError('标题模板无效')
    h, w = template.shape
    if h > gray.shape[0] or w > gray.shape[1]:
        raise ValueError('标题模板超出画面')
    view, dx, dy = gray, origin[0], origin[1]
    if anchored:
        r = title_region(entry, template)
        dx, dy = max(origin[0], r['x']-8), max(origin[1], r['y']-8)
        view = gray[dy-origin[1]:min(gray.shape[0],r['y']+h+8-origin[1]),
                    dx-origin[0]:min(gray.shape[1],r['x']+w+8-origin[0])]
        if view.shape[0] < h or view.shape[1] < w:
            return None
    _, score, _, point = cv2.minMaxLoc(cv2.matchTemplate(view, template, cv2.TM_CCOEFF_NORMED))
    point = (point[0]+dx,point[1]+dy)
    if score >= threshold:
        return {'score': score, 'region': {'x': point[0], 'y': point[1], 'width': w, 'height': h}}
    return None
