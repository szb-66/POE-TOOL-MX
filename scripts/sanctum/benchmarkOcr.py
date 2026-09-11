"""Same-engine, alternating full-panel/body benchmark on the original fixtures.

Run with the development Python runtime, after other CPU-heavy tests finish.
"""
import base64
import json
from pathlib import Path
import statistics
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'src/assets/scripts'))
from sanctum_ocr import create_sanctum_ocr_engine, read_frozen, read_room_ocr
from sanctum_recognition import load_image
from sanctum_rewards import recognize_currency_icons

started = time.perf_counter()
engine = create_sanctum_ocr_engine()
report = {'engineInitMs': round((time.perf_counter()-started)*1000, 2), 'samples': []}
for name in ['reward', 'purse', 'pact', 'fountain']:
    path = ROOT / ('test/fixtures/sanctum/ocr-'+name+'.png')
    image = load_image(str(path))
    options = {'png': base64.b64encode(path.read_bytes()).decode(), 'includeIcons': False,
               'region': {'x': 0, 'y': 0, 'width': image.shape[1], 'height': image.shape[0]}}
    timings = {'full': [], 'body': []}
    for repeat in range(3):
        for mode in (['full', 'body'] if repeat % 2 == 0 else ['body', 'full']):
            started = time.perf_counter()
            if mode == 'full':
                result = read_room_ocr(engine, image)
                ocr_ms = (time.perf_counter()-started)*1000
                icon_started = time.perf_counter()
                if any(word in line for line in result['texts'] for word in ['物品', '奖励', '获得', '领取']):
                    recognize_currency_icons(image)
                icon_ms = (time.perf_counter()-icon_started)*1000
            else:
                result = read_frozen(options, engine)
                ocr_ms = result['captureMetrics']['ocrMs']
                icon_started = time.perf_counter()
                if result['hasCurrencyOffer']:
                    read_frozen({**options, 'iconsOnly': True}, engine)
                icon_ms = (time.perf_counter()-icon_started)*1000
            timings[mode].append({'ocrMs': ocr_ms, 'iconsMs': icon_ms, 'totalMs': (time.perf_counter()-started)*1000})
    medians = {mode: {key: round(statistics.median(row[key] for row in rows), 2)
                      for key in ['ocrMs', 'iconsMs', 'totalMs']} for mode, rows in timings.items()}
    body = read_frozen(options, engine)
    report['samples'].append({'name': name, **medians, 'bodyRegion': body['bodyRegion'], 'texts': body['texts'],
                              'ocrReductionPercent': round(100*(1-medians['body']['ocrMs']/medians['full']['ocrMs']), 1)})
print(json.dumps(report, ensure_ascii=True, indent=2))
