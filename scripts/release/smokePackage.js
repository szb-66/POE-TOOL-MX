import { existsSync, globSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { assertRuntimeDistribution, assertApplicationDependencies } from '../runtime/distribution.js'
import { assertScriptDistribution, scriptDistribution } from '../runtime/scriptDistribution.js'
import { assertWindowsExecutableAsInvoker } from './windowsExecutableManifest.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const unpackedRoot = path.join(projectRoot, 'dist-electron', 'win-unpacked')
const resourcesRoot = path.join(unpackedRoot, 'resources')
const runtimeRoot = path.join(resourcesRoot, 'python-runtime')
const config = JSON.parse(readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
const scriptManifest = JSON.parse(readFileSync(path.join(projectRoot, 'scripts/runtime/manifest.json'), 'utf8'))
assertScriptDistribution(resourcesRoot, scriptDistribution(projectRoot, config, scriptManifest), path.join(runtimeRoot, 'python.exe'))
await assertRuntimeDistribution(path.join(projectRoot, '.runtime/python-runtime'), runtimeRoot, config)
const require = createRequire(import.meta.url)
assertApplicationDependencies(require('@electron/asar').listPackage(path.join(resourcesRoot, 'app.asar')), config)
const required = [
  path.join(unpackedRoot, '流放助手.exe'),
  path.join(resourcesRoot, 'app.asar'),
  path.join(runtimeRoot, 'python.exe'),
  path.join(runtimeRoot, 'runtime-manifest.json'),
  path.join(resourcesRoot, 'bag_auto_stash_template.py'),
  path.join(resourcesRoot, 'chaos_recipe_pick_template.py'),
  path.join(resourcesRoot, 'stash_pickup_template.py'),
  path.join(resourcesRoot, 'combat_assist_template.py'),
  path.join(resourcesRoot, 'price_copy_helper.py'),
  path.join(resourcesRoot, 'elevated-automation-host', 'host.py'),
  path.join(resourcesRoot, 'elevated-automation-host', 'activate_game_window.py'),
  ...globSync([
    'src/assets/scripts/sanctum_*.py',
    'src/assets/scripts/interface_titles.py',
    'src/assets/scripts/foreground_watcher.py',
    'src/assets/scripts/chart_mods_probe.py',
    'src/assets/images/sanctum-calibration/**/*',
    'electron/assets/sanctum/currency/**/*'
  ], { cwd: projectRoot }).map(file => path.join(resourcesRoot, 'app.asar.unpacked', file))
]
const missing = required.filter((filePath) => !existsSync(filePath))
if (missing.length) throw new Error(`正式包结构不完整: ${missing.map((entry) => path.relative(unpackedRoot, entry)).join(', ')}`)
await assertWindowsExecutableAsInvoker(path.join(unpackedRoot, '流放助手.exe'))

const probe = spawnSync(path.join(runtimeRoot, 'python.exe'), [
  '-I',
  '-B',
  '-c',
  [...JSON.parse(readFileSync(path.join(runtimeRoot, 'runtime-manifest.json'), 'utf8')).packages
    .map(entry => `import ${entry.importName}`), 'print("runtime-ok")'].join('; ')
], { encoding: 'utf8', windowsHide: true, timeout: 30000 })
if (probe.error) throw probe.error
if (probe.status !== 0 || !probe.stdout.includes('runtime-ok')) {
  throw new Error(`正式包 Python 冒烟检查失败: ${(probe.stderr || probe.stdout).trim()}`)
}
process.stdout.write(`正式包结构与内置运行时检查通过: ${unpackedRoot}\n`)
