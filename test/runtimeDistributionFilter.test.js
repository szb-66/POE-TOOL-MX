import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { copyRuntime, inventory, assertRuntimeDistribution, assertNoFrontendPackages, assertApplicationDependencies, frontendPackages } from '../scripts/runtime/distribution.js'

const config = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

test('分发副本排除测试和缓存，保留运行模块、元数据、许可证与模型，源文件不变', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-filter-'))
  const source = path.join(root, 'source')
  const destination = path.join(root, 'copy')
  const retained = ['python.exe', 'LICENSE.txt', 'python313.dll', 'Lib/site-packages/numpy/testing/__init__.py',
    'Lib/site-packages/numpy/_core/_multiarray_umath.pyd', 'Lib/site-packages/numpy.libs/blas.dll',
    'Lib/site-packages/numpy-2.5.1.dist-info/METADATA', 'Lib/site-packages/numpy-2.5.1.dist-info/licenses/LICENSE.txt',
    'Lib/site-packages/rapidocr/models/model.onnx', 'Lib/site-packages/rapidocr/config.yaml',
    'Lib/site-packages/certifi/cacert.pem', 'Lib/site-packages/another/tests/required.py']
  const excluded = ['__pycache__/file.pyc', 'orphan.pyc', 'orphan.pyo',
    'Lib/site-packages/numpy/_core/tests/test_math.py', 'Lib/site-packages/numpy/tests/test_import.py',
    'Lib/site-packages/shapely/tests/test_geometry.py', 'Lib/site-packages/colorama/tests/test_colour.py',
    'Lib/site-packages/certifi/tests/test_cert.py']
  try {
    for (const name of [...retained, ...excluded]) {
      await mkdir(path.dirname(path.join(source, name)), { recursive: true })
      await writeFile(path.join(source, name), 'fixture')
    }
    const before = await inventory(source)
    await copyRuntime(source, destination, config)
    assert.deepEqual((await inventory(destination)).map(file => file.path).sort(), retained.sort())
    assert.deepEqual(await inventory(source), before)
    await assertRuntimeDistribution(source, destination, config)
    await writeFile(path.join(destination, 'orphan.pyc'), 'bad')
    await assert.rejects(assertRuntimeDistribution(source, destination, config), /orphan.pyc/)
    await rm(path.join(destination, 'orphan.pyc'))
    await rm(path.join(destination, 'python313.dll'))
    await assert.rejects(assertRuntimeDistribution(source, destination, config), /python313.dll/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('生产闭包不含渲染端包，发布检查也拒绝嵌套与 scoped 依赖', async () => {
  const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'))
  assertNoFrontendPackages(Object.entries(lock.packages).filter(([name, info]) => name && !info.dev).map(([name]) => name))
  for (const name of frontendPackages) {
    assert.ok(config.devDependencies[name])
    assert.equal(config.dependencies[name], undefined)
    assert.throws(() => assertNoFrontendPackages([`/node_modules/parent/node_modules/${name}/package.json`]), /前端依赖/)
  }
  assertNoFrontendPackages(['/dist/assets/vue.js', '/node_modules/vue-like/package.json'])
  const runtimePaths = Object.keys(config.dependencies).map(name => `/node_modules/${name}/package.json`)
  assertApplicationDependencies(runtimePaths, config)
  assert.throws(() => assertApplicationDependencies(runtimePaths.filter(entry => !entry.includes('/yauzl/')), config), /缺少主进程依赖: yauzl/)
  for (const name of ['cheerio', 'cn-poe-utils', 'electron-updater', 'yauzl']) {
    assert.ok(config.dependencies[name])
    assert.ok(import.meta.resolve(name))
  }
})
