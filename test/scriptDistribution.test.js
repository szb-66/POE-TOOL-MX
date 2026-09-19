import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { unlink, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { scriptDistribution, assertScriptDistribution, withStagedScripts } from '../scripts/runtime/scriptDistribution.js'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const config = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const manifest = JSON.parse(readFileSync(new URL('../scripts/runtime/manifest.json', import.meta.url), 'utf8'))
const python = path.join(projectRoot, '.runtime/python-runtime/python.exe')
const layout = scriptDistribution(projectRoot, config, manifest)

test('脚本清单覆盖所有源码脚本；新增分发脚本漏登必须失败', () => {
  const missing = { ...manifest, requiredScripts: manifest.requiredScripts.filter(p => !p.endsWith('/sanctum_ocr.py')) }
  assert.throws(() => scriptDistribution(projectRoot, config, missing), /清单漏登.*sanctum_ocr/)
  const additional = structuredClone(config)
  additional.build.extraResources.push({ from: 'scripts/new_worker.py', to: 'new_worker.py' })
  assert.throws(() => scriptDistribution(projectRoot, additional, manifest), /清单漏登.*new_worker/)
})

test('安装布局完整时隔离 Python 检查通过；删除任一目录依赖均会失败', async () => {
  await withStagedScripts(projectRoot, layout, async root => {
    assertScriptDistribution(root, layout, python)
    await unlink(path.join(root, 'interface_titles.py'))
    assert.throws(() => assertScriptDistribution(root, layout, python), /bag_auto_stash_template\.py:\d+: interface_titles -> interface_titles\.py missing/)
    // The intact unpacked copy must not hide the resources failure above.
    await unlink(path.join(root, 'app.asar.unpacked/src/assets/scripts/chart_mods_probe.py'))
    assert.throws(() => assertScriptDistribution(root, layout, python), /sanctum_ocr\.py:\d+: chart_mods_probe/)
  })
})

test('旧配置漏分发依赖也会失败，而不只是检测配置已声明但文件被删', async () => {
  const oldConfig = structuredClone(config)
  oldConfig.build.extraResources = oldConfig.build.extraResources.filter(r => r.to !== 'interface_titles.py')
  const oldLayout = scriptDistribution(projectRoot, oldConfig, manifest)
  await withStagedScripts(projectRoot, oldLayout, root => {
    assert.throws(() => assertScriptDistribution(root, oldLayout, python), /interface_titles -> interface_titles\.py missing/)
  })
})

test('AST 检查函数内 import 和 from 导入，不执行脚本', async () => {
  await withStagedScripts(projectRoot, layout, async root => {
    await writeFile(path.join(root, 'puzzle_auto_place.py'), 'raise RuntimeError("must not execute")\ndef lazy():\n    import sanctum_ocr\n    from sanctum_frames import FramePool\n')
    assert.throws(() => assertScriptDistribution(root, layout, python), /puzzle_auto_place\.py:3: sanctum_ocr/)
    assert.throws(() => assertScriptDistribution(root, layout, python), /puzzle_auto_place\.py:4: sanctum_frames/)
  })
})

test('安装布局真实延迟导入：合成图片驱动圣所与背包仓库检测共同上报匹配及未匹配', async () => {
  await withStagedScripts(projectRoot, layout, root => {
    const probe = fileURLToPath(new URL('./fixtures/packagedDetectionProbe.py', import.meta.url))
    const result = spawnSync(python, ['-I', '-B', probe], {
      cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000
    })
    assert.equal(result.status, 0, result.stderr || result.stdout)
    assert.equal(JSON.parse(result.stdout).matchedAndUnmatched, true)
  })
})
