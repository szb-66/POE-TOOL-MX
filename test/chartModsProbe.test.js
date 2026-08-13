import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('chart_mods_probe.py 纯逻辑静态检查', { timeout: 120000 }, (t) => {
  const pythonPath = path.join(projectRoot, '.runtime', 'python-runtime', 'python.exe')
  if (!existsSync(pythonPath)) return t.skip('尚未准备内置 Python 运行时')
  const check = spawnSync(pythonPath, [
    path.join(projectRoot, 'test', 'python', 'chart_mods_probe_checks.py'),
    path.join(projectRoot, 'src', 'assets', 'scripts', 'chart_mods_probe.py'),
    path.join(projectRoot, 'test', 'fixtures', 'puzzle', 'border-mod-hover-150.png'),
    path.join(projectRoot, 'test', 'fixtures', 'puzzle', 'border-mod-e0-sea-beast-150.png'),
    path.join(projectRoot, 'test', 'fixtures', 'puzzle', 'border-mod-e2-pack-size-150.png'),
    path.join(projectRoot, 'test', 'fixtures', 'puzzle', 'border-mod-w0-mod-value-150.png')
  ], {
    encoding: 'utf8', timeout: 110000,
    env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' }
  })
  assert.equal(check.status, 0, `${check.stdout}\n${check.stderr}`)
  const report = JSON.parse(check.stdout.trim().split(/\r?\n/).at(-1))
  assert.equal(report.ok, true)
})

test('chart_mods_probe.py 语法可解析且模式齐全', () => {
  const source = readFileSync(path.join(projectRoot, 'src/assets/scripts/chart_mods_probe.py'), 'utf8')
  assert.match(source, /def copy_fragment_texts/)
  assert.match(source, /def scan_border_texts/)
  assert.match(source, /mode == "copy"/)
  assert.match(source, /mode == "border"/)
  assert.match(source, /focus_game_window/)
  assert.match(source, /def target_text_roi/)
  assert.match(source, /TEXT_GLYPH_HEIGHT_LOGICAL/)
  assert.match(source, /glyph_h = max/)
  assert.match(source, /def ordered_texts/)
  assert.match(source, /def border_edge_texts/)
  assert.doesNotMatch(source, /frame_signature|advance_hover_stability|sample_target_frames/)
  assert.match(source, /RESULT /)
})
