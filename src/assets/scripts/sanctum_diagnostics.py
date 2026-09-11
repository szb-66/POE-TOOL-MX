"""Bounded local crops for replaying capture failures, without whole-screen data."""
from pathlib import Path
import json
import tempfile
import cv2


def save_tooltip_evidence(index, baseline, image, evidence, options):
    root = Path(tempfile.gettempdir()) / 'poe-sanctum-diagnostics'
    root.mkdir(parents=True, exist_ok=True)
    slot = f'tooltip-{index % 20:02d}'
    region = options.get('mapRegion') or evidence.get('region')
    if not region:
        return None
    x, y, w, h = (int(region[k]) for k in ('x', 'y', 'width', 'height'))
    if x < 0 or y < 0 or w < 1 or h < 1 or x+w > image.shape[1] or y+h > image.shape[0]:
        return None
    for name, frame in [('before', baseline), ('after', image)]:
        ok, png = cv2.imencode('.png', frame[y:y+h, x:x+w])
        if ok:
            (root / f'{slot}-{name}.png').write_bytes(png.tobytes())
    panel_path = root / f'{slot}-panel.png'
    panel_path.unlink(missing_ok=True)
    panel = evidence.get('region')
    if panel:
        px, py, pw, ph = (int(panel[k]) for k in ('x', 'y', 'width', 'height'))
        if px >= 0 and py >= 0 and pw > 0 and ph > 0 and px+pw <= image.shape[1] and py+ph <= image.shape[0]:
            ok, png = cv2.imencode('.png', image[py:py+ph, px:px+pw])
            if ok:
                panel_path.write_bytes(png.tobytes())
    record = {key: evidence.get(key) for key in ('status', 'reason', 'region', 'texts', 'readStages', 'currencyIcons', 'captureMetrics')}
    record['cropRegion'] = region
    (root / f'{slot}.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
    return slot
