"""Refresh missing game-text mappings from a pinned PoeCharm data snapshot.

Uses the same zh/en template schema as cn-poe-utils; no conversion algorithm is copied.
Run with the bundled Python, optionally --charm-data pointing at Data/Translate/zh-rCN.
"""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import re
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
COMMIT = 'ac05b82ca47009780c1ebd6518108e876ccd44b5'
BASE = f'https://raw.githubusercontent.com/Chuanhsing/PoeCharm/{COMMIT}/Data/Translate/zh-rCN/'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--charm-data', type=Path)
    args = parser.parse_args()
    original = json.loads((ROOT / 'node_modules/cn-poe-utils/dist/data/poe/data.json').read_text(encoding='utf-8'))
    sources = []

    def read(name):
        data = (args.charm_data / name).read_bytes() if args.charm_data else urllib.request.urlopen(BASE + name, timeout=60).read()
        sources.append({'url': BASE + name, 'sha256': hashlib.sha256(data).hexdigest()})
        return list(csv.reader(io.StringIO(data.decode('utf-8-sig'))))

    def missing(rows, known):
        candidates = {}
        for row in rows:
            if len(row) != 2:
                continue
            en, zh = (cell.strip() for cell in row)
            if not en or not zh or zh in known or not re.search('[\u4e00-\u9fff]', zh):
                continue
            en_params, zh_params = re.findall(r'\{(\d+)\}', en), re.findall(r'\{(\d+)\}', zh)
            if any(re.search(r'[{}]', re.sub(r'\{\d+\}', '', value)) for value in [en, zh]):
                continue
            # Ambiguous repeated placeholder indices require reference metadata, not guessing.
            if sorted(en_params) != sorted(zh_params) or len(set(zh_params)) != len(zh_params):
                continue
            candidates.setdefault(zh, set()).add(en)
        return [{'zh': zh, 'en': next(iter(values))} for zh, values in candidates.items() if len(values) == 1]

    skills = missing(read('Gems_data.txt.csv') + read('Items_Gems.txt.csv'),
                     {s['zh'] for key in ['gemSkills', 'hybridSkills', 'transfiguredSkills'] for s in original[key]})
    stats = missing(read('statDescriptions.csv'), {s['zh'] for s in original['stats']})
    result = {'source': 'PoeCharm Chinese game-text mappings', 'commit': COMMIT, 'sources': sources, 'skills': skills, 'stats': stats}
    output = ROOT / 'electron/assets/pob-export/compatibility.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'skills': len(skills), 'stats': len(stats)}))


if __name__ == '__main__':
    main()
