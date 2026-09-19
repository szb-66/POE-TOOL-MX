"""Finite detection with synthetic frames; no screen capture or game input."""
import base64
import importlib.util
import json
from pathlib import Path
import sys

import cv2
import numpy as np

root = Path.cwd()
spec = importlib.util.spec_from_file_location('bag_probe', root / 'bag_auto_stash_template.py')
bag = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bag)
assert not bag.DEPENDENCY_ERROR, bag.DEPENDENCY_ERROR
assert 'interface_titles' not in sys.modules  # Exercise the real delayed import.

template = np.random.default_rng(17).integers(0, 256, (10, 12), dtype=np.uint8)
frame = np.zeros((60, 80), np.uint8)
frame[20:30, 24:36] = template
encoded = cv2.imencode('.png', template)[1].tobytes()
(root / 'title.png').write_bytes(encoded)
bounds = {'left': 0, 'top': 0, 'width': 80, 'height': 60, 'dpi': 96}
region = {'left': 0, 'top': 0, 'right': 80, 'bottom': 60}
config = {
    'templates': {
        'stash_title': str(root / 'title.png'), 'inventory_title': str(root / 'title.png'),
        'stash_region': region, 'inventory_region': region,
    },
    'interface_titles': {'sanctum-map': {
        'png': base64.b64encode(encoded).decode(),
        'region': {'x': 24, 'y': 20, 'width': 12, 'height': 10},
        'environment': {'width': 80, 'height': 60, 'dpi': 96},
    }},
}

def capture(self, r):
    return frame[r.get('top', 0):r.get('bottom', 0), r.get('left', 0):r.get('right', 0)].copy()

bag.InterfaceMatcher._capture = capture
bag.is_game_foreground = lambda: True
bag.get_game_client_bounds = lambda: bounds
events = []
bag.emit = lambda event, **data: events.append({'event': event, **data})

def tick(_):
    tick.count += 1
    if tick.count == 3:
        frame[:] = 0
    if tick.count >= 6:
        bag.is_running = False

tick.count = 0
bag.time.sleep = tick
bag.run_detection(config)
assert not any(e['event'] == 'detection-error' for e in events), events
assert any(e.get('ready') and e.get('stashReady') and e.get('inventoryReady')
           and e.get('interfaces', {}).get('sanctum-map', {}).get('matched') for e in events), events
assert events[-1]['ready'] is False and events[-1]['inventoryReady'] is False
assert events[-1]['interfaces']['sanctum-map']['matched'] is False
assert Path(sys.modules['interface_titles'].__file__).parent == root
print(json.dumps({'matchedAndUnmatched': True, 'events': len(events)}))
