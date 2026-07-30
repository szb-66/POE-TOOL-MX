import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const unpackedRoot = path.join(projectRoot, 'dist-electron', 'win-unpacked')
const resourcesRoot = path.join(unpackedRoot, 'resources')
const runtimeRoot = path.join(resourcesRoot, 'python-runtime')
const required = [
  path.join(unpackedRoot, '流放助手.exe'),
  path.join(resourcesRoot, 'app.asar'),
  path.join(runtimeRoot, 'python.exe'),
  path.join(runtimeRoot, 'runtime-manifest.json'),
  path.join(resourcesRoot, 'bag_auto_stash_template.py'),
  path.join(resourcesRoot, 'chaos_recipe_pick_template.py'),
  path.join(resourcesRoot, 'stash_pickup_template.py')
]
const missing = required.filter((filePath) => !existsSync(filePath))
if (missing.length) throw new Error(`正式包结构不完整: ${missing.map((entry) => path.relative(unpackedRoot, entry)).join(', ')}`)

const probe = spawnSync(path.join(runtimeRoot, 'python.exe'), [
  '-I',
  '-c',
  'import cv2, mss, numpy, pynput, pyperclip; print("runtime-ok")'
], { encoding: 'utf8', windowsHide: true, timeout: 30000 })
if (probe.error) throw probe.error
if (probe.status !== 0 || !probe.stdout.includes('runtime-ok')) {
  throw new Error(`正式包 Python 冒烟检查失败: ${(probe.stderr || probe.stdout).trim()}`)
}
process.stdout.write(`正式包结构与内置运行时检查通过: ${unpackedRoot}\n`)
