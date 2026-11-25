"""Generate an independent English PoB 3.30 identity snapshot from a pinned official commit."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import sys
import subprocess
import urllib.error
import urllib.request
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pobDataSnapshot import snapshot

ROOT = Path(__file__).resolve().parents[1]
COMMIT = 'a41fec6c20f822a658ae5df1273e8c69d5969bac'
BASE = f'https://raw.githubusercontent.com/PathOfBuildingCommunity/PathOfBuilding/{COMMIT}/src/'
CACHE = ROOT / '.cache/pob-international' / COMMIT
OUTPUT = ROOT / 'electron/assets/pob-export/international.json'


def fetch(path, expected):
    file = CACHE / path
    if not file.exists():
        url = BASE + path if path != 'lua/dkjson.lua' else f'https://raw.githubusercontent.com/PathOfBuildingCommunity/PathOfBuilding/{COMMIT}/runtime/{path}'
        data = urllib.request.urlopen(url, timeout=60).read()
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(data)
    data = file.read_bytes()
    blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
    if blob != expected:
        raise ValueError(f'Cached source does not match pinned official Git blob: {path}')
    return file


def generate(lua_root, check=False):
    index = CACHE / 'source-tree.json'
    if not index.exists():
        request = urllib.request.Request(f'https://api.github.com/repos/PathOfBuildingCommunity/PathOfBuilding/git/trees/{COMMIT}?recursive=1', headers={'User-Agent': 'PoE-Helper-data-generator'})
        try:
            data = urllib.request.urlopen(request, timeout=60).read()
        except urllib.error.HTTPError as error:
            if error.code != 403:
                raise
            data = subprocess.run(['gh', 'api', f'repos/PathOfBuildingCommunity/PathOfBuilding/git/trees/{COMMIT}?recursive=1'], capture_output=True, check=True).stdout
        index.parent.mkdir(parents=True, exist_ok=True)
        index.write_bytes(data)
    tree = json.loads(index.read_text())
    if not tree.get('tree') or tree.get('truncated'):
        raise ValueError('Incomplete pinned source tree')
    entries = {entry['path']: entry['sha'] for entry in tree['tree'] if entry['type'] == 'blob'}
    paths = [entry['path'][4:] for entry in tree['tree']
             if entry['type'] == 'blob' and entry['path'].startswith(('src/Data/Bases/', 'src/Data/Uniques/')) and entry['path'].endswith('.lua')]
    paths += ['Data/Gems.lua', 'TreeData/3_30/tree.lua', 'TreeData/3_30_ruthless/tree.lua', 'lua/dkjson.lua']
    expected = {path: entries[('runtime/' if path == 'lua/dkjson.lua' else 'src/') + path] for path in paths}
    list(ThreadPoolExecutor(6).map(lambda path: fetch(path, expected[path]), paths))
    result = snapshot(CACHE, tree_version='3_30', commit=COMMIT, version='2.68.1', lua_root=lua_root)
    ruthless = snapshot(CACHE, tree_version='3_30_ruthless', commit=COMMIT, version='2.68.1', lua_root=lua_root)
    result['ruthless'] = {key: ruthless[key] for key in ['classes', 'jewelSlots', 'nodes']}
    sources = {entry['path']: entry for entry in result.pop('sources') + ruthless.pop('sources')}
    result.update(schemaVersion=1, server='international', locale='en', gameVersion='3.30.0', treeVersion='3_30',
                  sources=[{'url': BASE + path, 'sha256': entry['sha256']} for path, entry in sorted(sources.items())])
    if len(result['bases']) < 500 or len(result['gems']) < 500 or len(result['nodes']) < 2000 or len(result['classes']) != 7:
        raise ValueError('Incomplete international PoB source coverage')
    raw = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    if check:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding='utf-8') != raw:
            raise ValueError('International PoB snapshot is stale')
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(raw, encoding='utf-8')
    print(json.dumps({'output': str(OUTPUT), 'commit': COMMIT, 'sha256': hashlib.sha256(raw.encode()).hexdigest(),
                      'bases': len(result['bases']), 'uniques': len(result['uniques']), 'gems': len(result['gems']), 'nodes': len(result['nodes'])}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lua-root', required=True, type=Path, help='Existing PoB runtime directory containing lua51.dll; never modified')
    parser.add_argument('--check', action='store_true', help='Compare generated content without changing the bundled snapshot')
    args = parser.parse_args()
    generate(args.lua_root, args.check)
