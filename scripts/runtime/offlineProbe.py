"""Probe a copied runtime without allowing model downloads or network access."""
import importlib
import json
from pathlib import Path
import sys


def deny_network(event, args):
    if event in ('socket.connect', 'socket.getaddrinfo', 'socket.sendto'):
        raise RuntimeError('network-disabled-for-runtime-probe')


sys.addaudithook(deny_network)
root = Path(sys.argv[1]).resolve()
manifest = json.loads((root / 'scripts/runtime/manifest.json').read_text(encoding='utf-8'))
for package in manifest['packages']:
    importlib.import_module(package['importName'])

import rapidocr
from rapidocr import RapidOCR

models = Path(rapidocr.__file__).parent / 'models'
engine = RapidOCR(params={'Global.model_root_dir': str(models)})
result = engine(str(root / 'test/fixtures/sanctum/ocr-fountain.png'))
texts = list(result.txts or [])
assert any('喷泉' in text for text in texts), texts
print(json.dumps({'modules': len(manifest['packages']), 'offline': True, 'texts': texts}, ensure_ascii=True))
