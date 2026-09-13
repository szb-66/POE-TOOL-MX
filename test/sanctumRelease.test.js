import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import vm from 'node:vm'
import { pathToFileURL } from 'node:url'
import { sanctumNativeScriptPath } from '../electron/modules/sanctum/nativeClient.js'
import { runPython } from './helpers/python.js'

test('正式路由保留圣所页面和浮窗，仅排除模型训练', () => {
  const source = fs.readFileSync('src/router/index.js', 'utf8')
  const definitions = source.slice(source.indexOf('const developmentRoutes'), source.indexOf('const router'))
  const context = vm.createContext({ pageLoaders: new Proxy({}, { get: () => () => {} }) })
  const routes = vm.runInContext(definitions.replaceAll('import.meta.env.DEV', 'false') + '\nroutes', context)
  for (const route of ['/sanctum', '/sanctum-overlay', '/sanctum-control-overlay']) {
    assert.ok(routes.some(item => item.path === route), route)
  }
  assert.equal(routes.some(item => item.path === '/highlight-model-training'), false)
  const loaderSource = fs.readFileSync('src/router/pageLoaders.js', 'utf8')
    .replace(/^import .*$/m, '').replace('export const pageLoaders', 'const pageLoaders')
    .split('export const preloadPage')[0].replaceAll('import.meta.env.DEV', 'false')
  const loaders = vm.runInNewContext(loaderSource + '\npageLoaders')
  assert.equal(typeof loaders['/sanctum'], 'function')
  assert.equal(loaders['/highlight-model-training'], undefined)
})

test('圣所解包资源可独立导入并读取奖励图标和校准示例', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sanctum-release-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const unpacked = path.join(root, 'app.asar.unpacked')
  const config = JSON.parse(fs.readFileSync('package.json', 'utf8')).build
  const files = fs.globSync(config.asarUnpack)
  assert.ok(files.some(file => file.endsWith('sanctum_native.py')))
  for (const file of files) {
    assert.ok(config.files.some(pattern => !pattern.startsWith('!') && path.matchesGlob(file, pattern)), file)
    const target = path.join(unpacked, file)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(file, target)
  }
  const moduleUrl = pathToFileURL(path.join(root, 'app.asar/electron/modules/sanctum/nativeClient.js'))
  const script = sanctumNativeScriptPath(moduleUrl)
  assert.equal(script, path.join(unpacked, 'src/assets/scripts/sanctum_native.py'))
  assert.ok(fs.existsSync(sanctumNativeScriptPath()))
  const result = runPython(`
import sys, json
sys.path.insert(0, ${JSON.stringify(path.dirname(script))})
import sanctum_native, sanctum_postprocess, sanctum_ocr, sanctum_resources
from sanctum_rewards import templates
from sanctum_calibration_collection import reference_image
print(json.dumps({'icons': len(templates()), 'examples': [reference_image(i).shape[1] for i in [1, 2]]}))
`, { cwd: root, windowsHide: true })
  assert.ok(result.icons > 0)
  assert.deepEqual(result.examples, [2048, 2048])
})
