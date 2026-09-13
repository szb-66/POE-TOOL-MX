import test from 'node:test'
import assert from 'node:assert/strict'
import { runPython } from './helpers/python.js'

test('覆盖明细忽略压缩差异，保留内容和哈希校验，重生成不改变一致文件', () => {
  const result = runPython(`
import contextlib, gzip, io, json, sys, tempfile
from pathlib import Path
sys.path.insert(0, 'scripts')
import generatePobCompatibilityData as g

with tempfile.TemporaryDirectory() as directory:
    g.ROOT = Path(directory)
    g.DETAILS = g.ROOT / 'details.json.gz'
    g.REPORT = g.ROOT / 'report.json'
    g.OUTPUT = g.ROOT / 'output.json'
    entries = [{'zh': '测试', 'en': 'test'}]
    g.generate = lambda: ({'data': []}, {'entries': entries.copy(), 'categories': {}})
    payload = g.dump(entries).encode('utf-8')
    # Different time, compression level and OS header, same uncompressed content.
    archived = bytearray(gzip.compress(payload, compresslevel=1, mtime=123))
    archived[9] = 10
    archived = bytes(archived)
    g.DETAILS.write_bytes(archived)
    report = {'categories': {}, 'details': {'path': g.DETAILS.name, 'sha256': g.sha(archived), 'entries': 1}}
    g.REPORT.write_text(g.dump(report), encoding='utf-8')
    g.OUTPUT.write_text(g.dump({'data': []}), encoding='utf-8')
    def run(check=True):
        sys.argv = ['generator'] + (['--check'] if check else [])
        with contextlib.redirect_stdout(io.StringIO()):
            g.main()
    def rejected():
        try:
            run()
        except SystemExit:
            return True
        return False
    before = {p: (p.read_bytes(), p.stat().st_mtime_ns) for p in g.ROOT.iterdir()}
    run()
    assert all((p.read_bytes(), p.stat().st_mtime_ns) == value for p, value in before.items())
    run(False)
    assert g.DETAILS.read_bytes() == archived
    assert json.loads(g.REPORT.read_text(encoding='utf-8')) == report
    entries.append({'zh': '新增', 'en': 'new'})
    assert rejected(), 'stale content accepted'
    entries.pop()
    for damaged in [archived[:-4], b'not gzip', archived[:-8] + bytes(8)]:
        g.DETAILS.write_bytes(damaged)
        assert rejected(), 'corrupt gzip accepted'
    g.DETAILS.write_bytes(archived)
    report['details']['sha256'] = 'incorrect'
    g.REPORT.write_text(g.dump(report), encoding='utf-8')
    assert rejected(), 'incorrect report hash accepted'
print(json.dumps({'ok': True}))
`)
  assert.equal(result.ok, true)
})
