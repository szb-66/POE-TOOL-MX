"""Reproducible PoB mapping generation with a per-source coverage ledger."""
import argparse
from collections import defaultdict, Counter
import csv
import gzip
import hashlib
import html
import io
import json
from pathlib import Path
import re
import sys
import subprocess
import zlib
import urllib.request
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
COMMIT = 'ac05b82ca47009780c1ebd6518108e876ccd44b5'
BASE = f'https://raw.githubusercontent.com/Chuanhsing/PoeCharm/{COMMIT}/Data/Translate/zh-rCN/'
SOURCE_DIR = ROOT / 'scripts/data/pob-export'
OUTPUT = ROOT / 'electron/assets/pob-export/compatibility.json'
REPORT = SOURCE_DIR / 'coverage.json'
DETAILS = SOURCE_DIR / 'coverage-details.json.gz'
FILES = ['Items_Accessories.txt.csv', 'Items_Armour.txt.csv', 'Items_Flasks.txt.csv',
         'Items_Jewels.txt.csv', 'Items_Weapons.txt.csv', 'Uniques.txt.csv',
         'Gems_data.txt.csv', 'Items_Gems.txt.csv', 'passiveTree.csv', 'tree_dn.csv',
         'tree_sd.csv', 'statDescriptions.csv', 'Data.csv', 'Tatto.csv']
BASE_KEYS = ['amulets', 'belts', 'bodyArmours', 'boots', 'flasks', 'gloves', 'helmets',
             'jewels', 'quivers', 'rings', 'shields', 'tinctures', 'weapons']
TYPE_KEYS = {'Amulet': 'amulets', 'Belt': 'belts', 'Body Armour': 'bodyArmours',
             'Boots': 'boots', 'Flask': 'flasks', 'Gloves': 'gloves', 'Helmet': 'helmets',
             'Jewel': 'jewels', 'Abyss Jewel': 'jewels', 'Quiver': 'quivers', 'Ring': 'rings',
             'Shield': 'shields', 'Tincture': 'tinctures', 'Graft': 'jewels'}
WEAPON_TYPES = {'One Handed Axe', 'Two Handed Axe', 'Bow', 'Claw', 'Dagger', 'Rune Dagger',
                'Fishing Rod', 'One Handed Mace', 'Two Handed Mace', 'Sceptre', 'Staff',
                'Warstaff', 'One Handed Sword', 'Two Handed Sword', 'Thrusting One Handed Sword', 'Wand'}
CN_CATEGORIES = {'accessory', 'armour', 'weapon', 'flask', 'jewel', 'gem', 'tincture', 'graft'}
LOCAL_SOURCES = ['electron/assets/crafting-data/dataset.json',
                 'electron/modules/priceCheck/catalog.json', 'src/domains/story/skillCatalog.json']


def dump(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + '\n'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def slug(value):
    # Exact PoEDB page identifier, not approximate name matching.
    return value.replace("'", '').replace('’', '').replace(' ', '_')


def canonical_base(en):
    return re.sub(r' \((?:Armour/Energy Shield|Armour/Evasion|Evasion/Energy Shield|Cold/Lightning|Fire/Cold|Fire/Lightning|Cold-To-Fire|Cold-To-Lightning|Fire-To-Cold|Fire-To-Lightning|Lightning-To-Cold|Lightning-To-Fire|Frenzy|Power|Endurance)\)$', '', en)


def gem_name(gem):
    return gem['en'] + ' Support' if '/SupportGem' in gem['id'] and not gem['en'].endswith(' Support') else gem['en']


def refresh(args):
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from pobDataSnapshot import snapshot
    if not args.pob_data:
        raise SystemExit('--refresh requires --pob-data pointing to PoB 2.67.2')
    sources, rows = [], {}
    for name in FILES:
        data = (args.charm_data / name).read_bytes() if args.charm_data else urllib.request.urlopen(BASE + name, timeout=60).read()
        rows[name] = list(csv.reader(io.StringIO(data.decode('utf-8-sig'))))
        sources.append({'url': BASE + name, 'sha256': sha(data)})
    pob = snapshot(args.pob_data)
    from concurrent.futures import ThreadPoolExecutor
    def verify(entry):
        url = f"https://raw.githubusercontent.com/PathOfBuildingCommunity/PathOfBuilding/{pob['commit']}/src/{entry['path']}"
        cache = ROOT / '.cache/pob-coverage/upstream' / pob['commit'] / entry['path']
        if cache.exists():
            data = cache.read_bytes()
        else:
            for attempt in range(3):
                try:
                    data = urllib.request.urlopen(url, timeout=30).read()
                    break
                except OSError:
                    if attempt == 2:
                        raise
            cache.parent.mkdir(parents=True, exist_ok=True)
            cache.write_bytes(data)
        local = (args.pob_data / entry['path']).read_bytes()
        if data.replace(b'\r\n', b'\n') != local.replace(b'\r\n', b'\n'):
            raise ValueError(f"PoB source does not match pinned revision: {entry['path']}")
        return {'url': url, 'sha256': sha(data), 'localSha256': entry['sha256']}
    sources.extend(ThreadPoolExecutor(6).map(verify, pob.pop('sources')))
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    (SOURCE_DIR / 'snapshot.json.gz').write_bytes(gzip.compress(dump({'sources': sources, 'charm': rows, 'pob': pob}).encode(), mtime=0))


def generate():
    snapshot = json.loads(gzip.decompress((SOURCE_DIR / 'snapshot.json.gz').read_bytes()))
    original_path = ROOT / 'node_modules/cn-poe-utils/dist/data/poe/data.json'
    original = json.loads(original_path.read_text(encoding='utf-8'))
    data = json.loads(dump(original))
    indices = {key: defaultdict(list) for key in data}
    for key, entries in data.items():
        for entry in entries:
            indices[key][entry['zh']].append(entry)
    sources = [*snapshot['sources'], {'path': 'cn-poe-utils@0.0.9/data/poe', 'sha256': sha(original_path.read_bytes())}]
    ledger = []

    def record(category, source, zh, en, status, reason=''):
        ledger.append({'category': category, 'source': source, 'zh': zh, 'en': en, 'status': status, **({'reason': reason} if reason else {})})

    def add(category, value, source, *, associated=False):
        zh, en = value.get('zh', ''), value.get('en', '')
        existing = indices[category][zh]
        if any(x['en'] == en for x in existing):
            record(category, source, zh, en, 'covered')
            return True
        if existing and not associated:
            record(category, source, zh, en, 'conflict', 'Existing Chinese identity maps to a different English identity')
            return False
        data[category].append(value)
        indices[category][zh].append(value)
        record(category, source, zh, en, 'added')
        return True

    aliases = defaultdict(set)
    for entries in original.values():
        for entry in entries:
            if 'en' in entry and 'zh' in entry:
                aliases[entry['en']].add(entry['zh'])
            for unique in entry.get('uniques', []):
                aliases[unique['en']].add(unique['zh'])
    for filename, rows in snapshot['charm'].items():
        if filename == 'statDescriptions.csv':
            continue
        for row in rows:
            if len(row) == 2 and all(row) and not any('{' in x for x in row):
                aliases[row[0].strip()].add(row[1].strip())
    local = {}
    for name in LOCAL_SOURCES:
        raw = (ROOT / name).read_bytes()
        sources.append({'path': name, 'sha256': sha(raw)})
        local[name] = json.loads(raw)
    pob = snapshot['pob']
    for entry in pob['bases']:
        entry['en'] = canonical_base(entry['en'])
    for entry in pob['uniques']:
        entry['en'] = entry['en'].strip()
        entry['base'] = canonical_base(entry['base'])
    bases = {x['en']: x['type'] for x in pob['bases']}
    slugs = defaultdict(set)
    for en in [*bases, *(x['en'] for x in pob['uniques']), *(gem_name(x) for x in pob['gems'])]:
        slugs[slug(en)].add(en)
    for row in snapshot['charm']['Uniques.txt.csv']:
        if len(row) == 2:
            slugs[slug(row[0].strip())].add(row[0].strip())
    for gem in pob['gems']:
        if '/SupportGem' in gem['id']:
            aliases[gem_name(gem)].update(aliases[gem['en']])
    for item in local[LOCAL_SOURCES[0]]['bases']:
        matches = slugs.get(unquote(item['sourceId']), set())
        if len(matches) == 1:
            aliases[next(iter(matches))].add(item['name'])
        else:
            record('baseSources', LOCAL_SOURCES[0], item['name'], item['sourceId'], 'unsupported', 'No unique PoB base identity for sourceId')
    for skill in local[LOCAL_SOURCES[2]]['skills']:
        matches = slugs.get(unquote(skill['sourcePath'].removeprefix('/cn/')), set())
        if len(matches) == 1:
            aliases[next(iter(matches))].add(skill['name'])
        else:
            record('skillSources', LOCAL_SOURCES[2], skill['name'], skill['sourcePath'], 'unsupported', 'No unique PoB gem identity for page identifier')
    unique_cn = []
    for p in sorted((ROOT / 'electron/assets/unique-items-raw/3.29/pages').glob('*.gz')):
        raw = p.read_bytes()
        sources.append({'path': p.relative_to(ROOT).as_posix(), 'sha256': sha(raw)})
        page = gzip.decompress(raw).decode('utf-8')
        for path, name, base in re.findall(r'href="/cn/([^"]+)"[^>]*><span class="uniqueName">(.*?)</span>\s*<span class="uniqueTypeLine">(.*?)</span>', page):
            matches = slugs.get(unquote(html.unescape(path)), set())
            if len(matches) == 1:
                en = next(iter(matches))
                zh, base = html.unescape(name), html.unescape(base)
                aliases[en].add(zh)
                unique_cn.append((en, zh, base))
            else:
                record('uniqueSources', 'poedb/Unique_item', html.unescape(name), path, 'unsupported', 'No unique PoB identity for page identifier')
    unique_bases = defaultdict(set)
    for unique in pob['uniques']:
        unique_bases[unique['en']].add(unique['base'])
    for en, zh, base in unique_cn:
        if len(unique_bases[en]) == 1 and not any(base in aliases[name] for name in bases):
            aliases[next(iter(unique_bases[en]))].add(base)
        elif not unique_bases[en]:
            candidates = {english for english in bases if base in aliases[english]}
            if len(candidates) == 1:
                english = next(iter(candidates))
                pob['uniques'].append({'en': en, 'base': english})
                unique_bases[en].add(english)
    overrides_path = SOURCE_DIR / 'overrides.json'
    overrides = json.loads(overrides_path.read_text(encoding='utf-8'))
    sources.append({'path': overrides_path.relative_to(ROOT).as_posix(), 'sha256': sha(overrides_path.read_bytes())})
    for entry in overrides['aliases']:
        aliases[entry['en']].add(entry['zh'])
    for entry in overrides.get('extraUniques', []):
        aliases[entry['en']].add(entry['zh'])
        pob['uniques'].append({'en': entry['en'], 'base': entry['base']})
    # CN official names can differ from PoEDB even for the same unique. When
    # both names agree and only one base exists, its official base is an exact association.
    unique_by_zh = defaultdict(set)
    for en in unique_bases:
        for zh in aliases[en]:
            unique_by_zh[zh].add(en)
    for item in local[LOCAL_SOURCES[1]]['items']:
        matches = unique_by_zh[item['name']]
        if item.get('unique') and len(matches) == 1:
            en = next(iter(matches))
            if len(unique_bases[en]) == 1 and not any(item['baseType'] in aliases[name] for name in bases):
                aliases[next(iter(unique_bases[en]))].add(item['baseType'])

    for en, kind in sorted(bases.items()):
        if en in {'Random One Hand Sword', 'Random Two Hand Sword', 'Energy Blade One Handed', 'Energy Blade Two Handed'}:
            record('bases', 'PoB Data/Bases/sword.lua', '', en, 'unsupported', 'PoB synthetic weapon for calculations, not an exported character item base')
            continue
        category = TYPE_KEYS.get(kind) or ('weapons' if kind in WEAPON_TYPES else None)
        if not category:
            record('bases', 'PoB', '', en, 'unsupported', f'Unsupported equipment type: {kind}')
            continue
        if not aliases[en]:
            record(category, 'PoB', '', en, 'missing', 'No verified Chinese name')
        for zh in sorted(aliases[en]):
            if re.search('[\u4e00-\u9fff]', zh):
                add(category, {'zh': zh, 'en': en, **({'itemType': kind} if kind == 'Graft' else {})}, 'PoB + Chinese sources', associated=True)
        if kind == 'Graft':
            record('grafts', 'PoB + Chinese sources', ' / '.join(sorted(aliases[en])), en, 'covered' if aliases[en] else 'missing', '' if aliases[en] else 'No verified Chinese name')
    for unique in pob['uniques']:
        en, base = unique['en'], unique['base']
        matching_bases = [x for k in BASE_KEYS for x in data[k] if x['en'] == base]
        if not aliases[en] or not matching_bases:
            record('uniques', 'PoB', '', en, 'missing', 'Missing Chinese unique name or associated base')
        for zh in sorted(aliases[en]):
            for b in matching_bases:
                uniques = b.setdefault('uniques', [])
                existing = [u for u in uniques if u['zh'] == zh]
                if any(u['en'] == en for u in existing):
                    status, reason = 'covered', ''
                elif existing:
                    status, reason = 'conflict', 'Unique name conflicts on the same base'
                else:
                    uniques.append({'zh': zh, 'en': en})
                    status, reason = 'added', ''
                record('uniques', base, zh, en, status, reason)
    # The official roster also preserves historic unique/base combinations absent
    # from the current PoB unique templates. Attach the name to that exact known
    # base, rather than incorrectly making the old base an alias of the new one.
    for item in local[LOCAL_SOURCES[1]]['items']:
        matches = unique_by_zh[item['name']]
        if item.get('unique') and len(matches) == 1:
            en = next(iter(matches))
            choices = [x for k in BASE_KEYS for x in data[k] if x['zh'] == item['baseType']]
            if any(u['zh'] == item['name'] for b in choices for u in b.get('uniques', [])):
                continue
            if len({b['en'] for b in choices}) > 1:
                choices = [b for b in choices if b['en'] in unique_bases[en]]
            for b in choices:
                if not any(u['zh'] == item['name'] for u in b.get('uniques', [])):
                    b.setdefault('uniques', []).append({'zh': item['name'], 'en': en})
                    record('uniques', item['key'], item['name'], en, 'added', 'Official CN legacy base association')
    for entry in overrides.get('contextualUniques', []):
        for b in [x for k in BASE_KEYS for x in data[k] if x['en'] == entry['base']]:
            for candidate in entry['candidates']:
                if not any(u['en'] == candidate['en'] for u in b.get('uniques', [])):
                    raise ValueError('Contextual unique candidate has no verified base association')
                b.setdefault('uniques', []).append({'zh': entry['zh'], **candidate})
                record('uniques', entry['source'], entry['zh'], candidate['en'], 'added', 'Identity requires distinguishing item modifiers')
    for gem in pob['gems']:
        en = gem_name(gem)
        category = 'transfiguredSkills' if re.search(r'Alt[XYZQW]', gem['effect']) else 'gemSkills'
        if not aliases[en]:
            record(category, 'PoB', '', en, 'missing', 'No verified Chinese gem name')
        for zh in sorted(aliases[en]):
            if not en.endswith(' Support') and re.search(r'[（(](?:辅|辅助)[）)]$', zh):
                record(category, 'PoB gem gameId', zh, en, 'unsupported', 'Support suffix belongs to a distinct support gem identity; active gem alias excluded')
                continue
            add(category, {'zh': zh, 'en': en}, 'PoB + Chinese sources')
            if en.endswith(' Support'):
                for alias in sorted({zh, re.sub(r'\s*[（(](?:辅|辅助)[）)]$', '', zh)}):
                    add('indexableSupports', {'zh': alias, 'en': en.removesuffix(' Support')}, 'PoB support reference')
    for row in snapshot['charm']['Gems_data.txt.csv']:
        if len(row) == 2 and all(row):
            en, zh = (s.strip() for s in row)
            if not any(x['zh'] == zh for k in ['gemSkills', 'hybridSkills', 'transfiguredSkills'] for x in data[k]):
                add('gemSkills', {'zh': zh, 'en': en}, 'Gems_data.txt.csv')
    for node in pob['nodes']:
        category = 'keystones' if node.get('keystone') else 'ascendant' if node.get('ascendancy') else 'anointed' if node.get('notable') else None
        if category:
            for zh in sorted(aliases[node.get('en', '')]):
                add(category, {'zh': zh, 'en': node['en']}, 'PoB passive tree')
    for category in ['attributes', 'properties', 'requirements', 'requirementSuffixes', 'strings', 'tattoos']:
        for entry in original[category]:
            for zh in sorted(aliases[entry['en']]):
                add(category, {**entry, 'zh': zh}, 'Chinese property/reference aliases')

    by_en = defaultdict(list)
    for stat in original['stats']:
        by_en[stat['en']].append(stat)
    candidates = defaultdict(dict)
    def candidate(zh, en, source, refs=None):
        params = [re.findall(r'\{(\d+)\}', s) for s in [zh, en]]
        reason = ''
        if any(re.search('[{}]', re.sub(r'\{\d+\}', '', s)) for s in [zh, en]):
            reason = 'Unsupported placeholder syntax'
        elif sorted(params[0]) != sorted(params[1]):
            reason = 'Placeholder correspondence is not bijective'
        elif len(params[0]) != len(set(params[0])):
            reason = 'Repeated indices need explicit reference disambiguation'
        elif re.search(r'\{\d+\}\{\d+\}', zh):
            reason = 'Adjacent placeholders lack a value separator'
        if reason:
            record('stats', source, zh, en, 'unsupported', reason)
            return
        value = {'zh': zh, 'en': en, **({'refs': refs} if refs else {})}
        candidates[zh][json.dumps(value, sort_keys=True)] = (value, source)
    for row in snapshot['charm']['statDescriptions.csv']:
        if len(row) != 2 or not all(row):
            record('stats', 'statDescriptions.csv', str(row), '', 'unsupported', 'Invalid source row')
            continue
        en, zh = (s.strip() for s in row)
        known_refs = [x.get('refs') for x in by_en[en] if x.get('refs')]
        candidate(zh, en, 'statDescriptions.csv', known_refs[0] if known_refs else None)
    def numbered(text):
        i = iter(range(text.count('#')))
        return re.sub('#', lambda _: '{' + str(next(i)) + '}', text)
    for stat in local[LOCAL_SOURCES[1]]['stats']:
        if 'pseudo' in stat.get('ids', {}):
            continue
        refs = stat.get('refs', [])
        if len(refs) != 1:
            record('tradeStats', stat['key'], stat['label'], ' | '.join(refs), 'unsupported', 'Trade stat has no unique English reference')
            continue
        en = refs[0]
        for zh in stat.get('matchers', []):
            if not re.search('[\u4e00-\u9fff]', zh):
                continue
            if zh in stat.get('negatedMatchers', []):
                record('tradeStats', stat['key'], zh, en, 'unsupported', 'Negated trade matcher needs signed-value conversion')
                continue
            candidate(numbered(zh), numbered(en), stat['key'])
    for entry in overrides['stats']:
        candidates[entry['zh']] = {json.dumps(entry, sort_keys=True): (entry, 'verified overrides')}
    for zh, entries in sorted(candidates.items()):
        distinct = {entry['en'] for entry, _ in entries.values()}
        if len(distinct) > 1:
            for entry, source in entries.values():
                record('stats', source, zh, entry['en'], 'conflict', 'Multiple English templates for the same Chinese template; baseline retained')
            continue
        entry, source = next(iter(entries.values()))
        known = next(iter(indices['stats'][zh]), None)
        if known:
            record('stats', source, zh, entry['en'], 'covered' if known['en'] == entry['en'] else 'conflict', '' if known['en'] == entry['en'] else 'Baseline template retained')
        else:
            add('stats', entry, source)
    for entry in overrides.get('properties', []):
        add('properties', entry, 'verified overrides')

    for item in local[LOCAL_SOURCES[1]]['items']:
        if item.get('category') not in CN_CATEGORIES:
            continue
        if item['baseType'] == '赏金猎人饰品':
            record('cnItems', item['key'], item['name'], '', 'unsupported', 'Non-combat Heist trinket intentionally excluded by PoB import')
            continue
        if item['baseType'] == '血肉嫁接':
            record('cnItems', item['key'], item['name'], 'Fleshgraft', 'unsupported', 'PoB 2.67.2 has no Fleshgraft base definition; export must reject this identity')
            continue
        if item['category'] == 'gem':
            match = [x for k in ['gemSkills', 'hybridSkills', 'transfiguredSkills'] for x in data[k] if x['zh'] == item['baseType']]
        else:
            match = [x for k in BASE_KEYS for x in data[k] if x['zh'] == item['baseType']]
            if item.get('unique'):
                match = [x for x in match if any(u['zh'] == item['name'] for u in x.get('uniques', []))]
        record('cnItems', item['key'], item['name'] + ' / ' + item['baseType'], '', 'covered' if match else 'missing', '' if match else 'CN roster identity is not mapped')
    additions = {}
    for key, entries in data.items():
        before = {json.dumps(x, sort_keys=True) for x in original[key]}
        additions[key] = [x for x in entries if json.dumps(x, sort_keys=True) not in before]
    verified = subprocess.run(['node', str(ROOT / 'scripts/verifyPobTemplates.js')],
                              input=json.dumps({'data': data, 'candidates': additions['stats']}),
                              capture_output=True, text=True, encoding='utf-8', check=True)
    failures = json.loads(verified.stdout)
    rejected = {(x['zh'], x['en']) for x in failures}
    additions['stats'] = [x for x in additions['stats'] if (x['zh'], x['en']) not in rejected]
    for row in ledger:
        if row['category'] == 'stats' and (row['zh'], row['en']) in rejected and row['status'] == 'added':
            row['status'] = 'conflict'
            row['reason'] = 'Runtime template result differs from source; candidate not installed'
    counts = {}
    for category in sorted({x['category'] for x in ledger}):
        count = Counter(x['status'] for x in ledger if x['category'] == category)
        counts[category] = {'total': sum(count.values()), **{k: count[k] for k in ['covered', 'added', 'missing', 'conflict', 'unsupported']}}
    report = {'schemaVersion': 1, 'gameVersion': '3.29', 'pobVersion': pob['version'], 'sources': sources, 'categories': counts, 'templateConflicts': failures, 'entries': ledger}
    passive_conflicts = {category: sorted({row['zh'] for row in ledger if row['category'] == category and row['status'] == 'conflict'})
                         for category in ['anointed', 'ascendant', 'keystones']}
    output = {'schemaVersion': 2, 'gameVersion': '3.29', 'commit': COMMIT, 'sources': sources,
              'data': additions, 'pob': {'version': pob['version'], 'classes': pob['classes'], 'jewelSlots': pob['jewelSlots'],
                                       'gemNames': sorted({x['en'] for x in pob['gems']}), 'gemNameMap': {gem_name(x): x['en'] for x in pob['gems']}, 'passiveConflicts': passive_conflicts}}
    return output, report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--charm-data', type=Path)
    parser.add_argument('--pob-data', type=Path)
    parser.add_argument('--refresh', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.refresh and args.check:
        parser.error('--check never refreshes or writes sources')
    if args.refresh:
        refresh(args)
    output, report = generate()
    payload = dump(report['entries']).encode('utf-8')
    details = gzip.compress(payload, mtime=0)
    if DETAILS.exists():
        existing = DETAILS.read_bytes()
        try:
            # Python/zlib versions can produce different gzip headers or streams.
            # Reuse identical content so both generation and checks retain its hash.
            if gzip.decompress(existing) == payload:
                details = existing
        except (OSError, EOFError, zlib.error):
            pass  # A corrupt file must fail --check or be regenerated below.
    report['details'] = {'path': DETAILS.name, 'sha256': sha(details), 'entries': len(report.pop('entries'))}
    if args.check:
        if not DETAILS.exists() or DETAILS.read_bytes() != details:
            raise SystemExit('Stale generated coverage details')
    else:
        DETAILS.write_bytes(details)
    for path, value in [(OUTPUT, output), (REPORT, report)]:
        expected = dump(value)
        if args.check:
            if not path.exists() or path.read_text(encoding='utf-8') != expected:
                raise SystemExit(f'Stale generated file: {path.relative_to(ROOT)}')
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(expected, encoding='utf-8')
    print(dump(report['categories']))

if __name__ == '__main__':
    main()
