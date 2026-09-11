"""Offline developer replay; real OCR, fixture frames, no game input or live safety claims."""
import argparse
import importlib.util
import json
from pathlib import Path
import sys
import threading
import time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'src/assets/scripts'))
from sanctum_recognition import load_image
from chart_mods_probe import create_rapidocr_engine


def benchmark(source, runs):
    for name in ('sanctum_tooltip', 'sanctum_rewards'):
        sibling = source.parent / (name+'.py')
        if sibling.exists():
            module_spec = importlib.util.spec_from_file_location(name, sibling)
            module = importlib.util.module_from_spec(module_spec)
            sys.modules[name] = module
            module_spec.loader.exec_module(module)
            # Historical source copies still resolve the repository's assets.
            module.__file__ = str(ROOT / 'src/assets/scripts' / (name+'.py'))
    spec = importlib.util.spec_from_file_location('benchmark_native', source)
    native = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(native)
    native.emit = lambda *args: None
    native.save_tooltip_evidence = lambda *args: None
    base = load_image(str(ROOT / 'test/fixtures/sanctum/archives-live-map.png'))
    full = load_image(str(ROOT / 'test/fixtures/sanctum/archives-live-tooltip.png'))
    panel = full[270:270+base.shape[0], 917:917+base.shape[1]]
    target = {'id':'sample', 'x':648, 'y':620, 'width':50, 'height':70}
    engine = create_rapidocr_engine()
    results = []
    for index in range(runs):
        s = native.NativeSession.__new__(native.NativeSession)
        s.expected = {}; s.engine = engine; s.cancelled = threading.Event()
        moving = [False]
        counters = {'screenshots':0, 'ocrCalls':0, 'ocrMs':0, 'iconsMs':0, 'waitMs':0, 'locateMs':0}
        s.check = lambda: {'clientBounds':{'x':0, 'y':0}}
        s.require_mode = lambda *args: None
        s.progress = lambda *args, **kwargs: None
        s.neutral = lambda *args: moving.__setitem__(0, False)
        s.move_cursor = lambda *args: moving.__setitem__(0, True)
        s.observe = lambda *args, **kwargs: {'floor':{'rooms':[target]}}
        s.frozen_evidence = lambda *args: None
        def image():
            counters['screenshots'] += 1
            return (panel if moving[0] else base), {}
        s.image = image
        original_ocr = s.ocr
        def ocr(*args):
            started = time.perf_counter(); counters['ocrCalls'] += 1
            try: return original_ocr(*args)
            finally: counters['ocrMs'] += (time.perf_counter()-started)*1000
        s.ocr = ocr
        original_icons, original_locate = native.recognize_currency_icons, native.locate_tooltip
        def timed(fn, key):
            def run(*args, **kwargs):
                started = time.perf_counter()
                try: return fn(*args, **kwargs)
                finally: counters[key] += (time.perf_counter()-started)*1000
            return run
        native.recognize_currency_icons = timed(original_icons, 'iconsMs')
        native.locate_tooltip = timed(original_locate, 'locateMs')
        original_wait = s.cancelled.wait
        s.cancelled.wait = timed(original_wait, 'waitMs')
        started = time.perf_counter()
        evidence = s.read_tooltip({'roomId':'sample', 'targetRoom':target}, (673,655), 'map')
        counters['totalMs'] = (time.perf_counter()-started)*1000
        native.recognize_currency_icons, native.locate_tooltip = original_icons, original_locate
        results.append({'run':index+1, 'status':evidence['status'], 'textLines':len(evidence['texts']),
                        'region':evidence.get('region'), **{k:round(v,2) for k,v in counters.items()}})
    return results


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--native-source', type=Path, default=ROOT / 'src/assets/scripts/sanctum_native.py')
    parser.add_argument('--runs', type=int, default=3)
    args = parser.parse_args()
    if not 1 <= args.runs <= 10:
        parser.error('runs must be 1–10')
    print(json.dumps({'mode':'offline-real-ocr', 'runs':benchmark(args.native_source, args.runs)}, ensure_ascii=False))
