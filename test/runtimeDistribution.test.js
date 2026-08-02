import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  configurePythonRuntime,
  detectPythonPath,
  detectPythonPathWithModules,
  resolvePythonRuntime
} from '../electron/modules/python/detector.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const generatedRoot = path.join(projectRoot, '.runtime')

test('开发环境优先使用已准备且满足模块要求的内置运行时', () => {
  configurePythonRuntime({ isPackaged: false, resourcesPath: '', env: {} })
  const runtime = resolvePythonRuntime(['cv2', 'mss', 'numpy', 'pynput', 'pyperclip', 'rapidocr', 'onnxruntime'])
  assert.equal(runtime.ready, true)
  assert.equal(runtime.source, 'prepared')
  assert.equal(runtime.version, '3.13.14')
  assert.match(runtime.path, /[\\/]流放助手[\\/]\.runtime[\\/]python-runtime[\\/]python\.exe$/)
  assert.equal(detectPythonPath(), runtime.path)
  assert.equal(detectPythonPathWithModules(['numpy']), runtime.path)
})

test('正式版只使用 resourcesPath 下的 bundled 运行时', () => {
  configurePythonRuntime({ isPackaged: true, resourcesPath: generatedRoot, env: { POE_PYTHON_RUNTIME: 'C:\\other\\python.exe' } })
  const runtime = resolvePythonRuntime(['sys', 'json'])
  assert.equal(runtime.ready, true)
  assert.equal(runtime.source, 'bundled')
  assert.equal(runtime.path, path.join(generatedRoot, 'python-runtime', 'python.exe'))
})

test('正式版内置运行时缺失时返回结构化错误且不回退系统 Python', async () => {
  const emptyRoot = await mkdtemp(path.join(os.tmpdir(), 'poe-runtime-missing-'))
  try {
    configurePythonRuntime({ isPackaged: true, resourcesPath: emptyRoot, env: { POE_PYTHON_RUNTIME: 'python' } })
    const runtime = resolvePythonRuntime(['sys'])
    assert.deepEqual({
      ready: runtime.ready,
      found: runtime.found,
      source: runtime.source,
      path: runtime.path
    }, {
      ready: false,
      found: false,
      source: 'bundled',
      path: null
    })
    assert.match(runtime.error, /内置 Python 运行时缺失或损坏/)
  } finally {
    await rm(emptyRoot, { recursive: true, force: true })
  }
})

test('打包配置固定携带 x64 运行时并由 beforePack 强制验证', async () => {
  const packageConfig = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'))
  assert.equal(packageConfig.devDependencies.electron, '43.0.0')
  assert.equal(packageConfig.devDependencies['electron-builder'], '26.15.3')
  assert.equal(packageConfig.build.beforePack, 'scripts/runtime/beforePack.cjs')
  assert.ok(packageConfig.build.extraResources.some((entry) => (
    entry.from === '.runtime/python-runtime' && entry.to === 'python-runtime'
  )))
  assert.ok(packageConfig.build.extraResources.some((entry) => (
    entry.from === 'src/assets/scripts/stash_tab_selector.py' && entry.to === 'stash_tab_selector.py'
  )))
  assert.deepEqual(packageConfig.build.win.target, [{ target: 'nsis', arch: ['x64'] }])
  assert.equal(packageConfig.build.win.requestedExecutionLevel, 'requireAdministrator')
})
