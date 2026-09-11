"""Offline currency-art evidence. Icons never establish reward quantities."""
from functools import lru_cache
from pathlib import Path
import json

import cv2
import numpy as np


@lru_cache(maxsize=1)
def templates():
    root = Path(__file__).resolve().parents[3] / 'electron/assets/sanctum/currency'
    catalog = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
    result = []
    for entry in catalog['entries']:
        art = cv2.imdecode(np.frombuffer((root / entry['iconFile']).read_bytes(), np.uint8), cv2.IMREAD_UNCHANGED)
        if art is None or art.ndim != 3 or art.shape[2] != 4:
            continue
        points = cv2.findNonZero(np.uint8(art[:, :, 3] > 128))
        if points is None:
            continue
        x, y, w, h = cv2.boundingRect(points)
        result.append((entry['name'], art[y:y+h, x:x+w]))
    return result


def masked_correlation(gray, squared, template, mask):
    """Binary-mask NCC via three unmasked correlations (OpenCV's fast path).

    Same centred, masked metric as TM_CCOEFF_NORMED, with zero-variance
    patches rejected instead of producing NaN/Inf. No confidence relaxation.
    """
    count = float(np.sum(mask))
    centered = (template - np.sum(template*mask)/count)*mask
    energy = float(np.sum(centered*centered))
    sums = cv2.matchTemplate(gray, mask, cv2.TM_CCORR)
    squares = cv2.matchTemplate(squared, mask, cv2.TM_CCORR)
    numerator = cv2.matchTemplate(gray, centered, cv2.TM_CCORR)
    variance = np.maximum(squares-sums*sums/count, 0)
    denominator = np.sqrt(variance*energy)
    valid = (variance > np.maximum(1, squares*1e-6)) & (denominator > 1)
    return np.clip(np.divide(numerator, denominator, out=np.zeros_like(numerator), where=valid), -1, 1)


@lru_cache(maxsize=4096)
def scaled_template(name, size):
    art = next(art for label, art in templates() if label == name)
    w = max(8, round(size * art.shape[1] / art.shape[0]))
    scaled = cv2.resize(art, (w, size), interpolation=cv2.INTER_AREA)
    return w, np.float32(scaled[:,:,3] > 192), cv2.cvtColor(scaled[:,:,:3],cv2.COLOR_BGR2GRAY).astype(np.float32)


def recognize_currency_icons(panel):
    height, width = panel.shape[:2]
    gray = cv2.cvtColor(panel, cv2.COLOR_BGR2GRAY).astype(np.float32)
    squared = gray*gray
    # Small inline currency art, including unframed icons. Search only this
    # confirmed tooltip, never the map cards or the player's HUD.
    candidates = []
    for name, art in templates():
        # Keep native pixels: shrinking a wide tooltip destroys small currency
        # details. A one-pixel size difference can change NCC by more than .1.
        for size in range(16, min(81, height), 4):
            w = max(8, round(size * art.shape[1] / art.shape[0]))
            if w >= width:
                continue
            w, mask, template = scaled_template(name, size)
            if np.count_nonzero(mask) < 30:
                continue
            score = masked_correlation(gray, squared, template, mask)
            for _ in range(12):
                _, maximum, _, (x, y) = cv2.minMaxLoc(score)
                # Coarse peaks propose a location only, never an identity.
                if maximum < .72:
                    break
                left, top = max(0,x-6), max(0,y-6)
                right, bottom = min(width,x+w+8), min(height,y+size+8)
                local = gray[top:bottom,left:right]
                local_squared = squared[top:bottom,left:right]
                for fine_size in range(max(16,size-3), min(81,size+4,height)):
                    fw, fm, ft = scaled_template(name, fine_size)
                    if fw > local.shape[1] or fine_size > local.shape[0]:
                        continue
                    fine = masked_correlation(local, local_squared, ft, fm)
                    _, confidence, _, (fx,fy) = cv2.minMaxLoc(fine)
                    if confidence >= .94:
                        candidates.append({'currency': name, 'confidence': round(confidence, 4),
                                           'region': {'x':left+fx, 'y':top+fy, 'width':fw, 'height':fine_size}})
                score[max(0,y-size//2):y+size//2+1, max(0,x-w//2):x+w//2+1] = 0
    candidates.sort(key=lambda item: item['confidence'], reverse=True)
    found = []
    while candidates:
        best = candidates.pop(0)
        r = best['region']
        def overlaps(item):
            b = item['region']
            return abs(r['x']+r['width']/2-b['x']-b['width']/2) < max(r['width'],b['width'])*.5 and abs(r['y']+r['height']/2-b['y']-b['height']/2) < max(r['height'],b['height'])*.5
        group = [item for item in candidates if overlaps(item)]
        candidates = [item for item in candidates if not overlaps(item)]
        rival = max((item['confidence'] for item in group if item['currency'] != best['currency']), default=0)
        if best['confidence'] - rival >= .035:
            found.append(best)
    # Inline art has different heights; use row centres rather than top edges
    # so a taller icon does not move ahead of the preceding offer.
    rows = []
    for item in sorted(found, key=lambda item: item['region']['y'] + item['region']['height']/2):
        center = item['region']['y'] + item['region']['height']/2
        row = next((row for y, row in rows if abs(y-center) < 12), None)
        if row is None:
            row = []
            rows.append((center, row))
        row.append(item)
    return [item for _, row in rows for item in sorted(row, key=lambda item: item['region']['x'])][:20]
