import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createHash, generateKeyPairSync } from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { runInNewContext } from 'node:vm'
import { verifyLocalizationRuntime } from '../scripts/runtime/localizationDistribution.js'
import { marketRuntimeFixture, successfulMarketRun } from './fixtures/marketRuntime.js'

test('开发入口位于electron目录时仍从仓库根目录定位组件与公钥，安装版使用资源目录', () => {
  const mainUrl = new URL('../electron/main.js', import.meta.url)
  const source = fs.readFileSync(mainUrl, 'utf8')
  const initialization = source.match(/localization = new LocalizationService\(\{[\s\S]*?\n  \}\)/)?.[0]
  assert.ok(initialization)
  const root = fileURLToPath(new URL('../', import.meta.url))
  for (const isPackaged of [false, true]) {
    const resourcesPath = path.join(root, 'dist-electron', 'win-unpacked', 'resources')
    const runtimeMainUrl = isPackaged ? pathToFileURL(path.join(resourcesPath, 'app.asar', 'electron', 'main.js')) : mainUrl
    const scope = {
      LocalizationService: class { constructor(options) { Object.assign(this, options) } },
      serverMode: { mode: 'international', dataPath: () => 'unused' },
      app: { isPackaged, getAppPath: () => isPackaged ? path.join(resourcesPath, 'app.asar') : path.join(root, 'electron'), getPath: () => 'unused' },
      process: { resourcesPath, env: {} }, path, fileURLToPath, URL, mainUrl: runtimeMainUrl.href
    }
    runInNewContext(initialization.replaceAll('import.meta.url', 'mainUrl'), scope)
    assert.equal(scope.localization.executable, path.join(isPackaged ? resourcesPath : path.join(root, '.runtime'), 'localization-helper', 'LocalizationHelper.exe'))
    assert.equal(scope.localization.publicKeyFile, fileURLToPath(new URL('./assets/localization-public-key.pem', runtimeMainUrl)))
  }
})

test('缺失汉化组件不能通过未来安装包分发检查', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-localization-dist-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  assert.throws(() => verifyLocalizationRuntime(root), /localization:build/)
})

test('分发校验要求自包含运行时、匹配schema、公钥和实际组件自检', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'poe-localization-dist-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const helper = path.join(root, '.runtime', 'localization-helper')
  fs.mkdirSync(helper, { recursive: true })
  for (const name of ['LocalizationHelper.exe', 'LocalizationHelper.dll', 'oo2core.dll', 'LibBundle3-LICENSE.txt', 'coreclr.dll', 'hostfxr.dll', 'hostpolicy.dll', 'System.Private.CoreLib.dll']) fs.writeFileSync(path.join(helper, name), '')
  fs.writeFileSync(path.join(helper, 'schema.json'), '{}')
  fs.writeFileSync(path.join(helper, 'source-schema-cn.json'), '{}')
  const metadata = { protocolVersion: 1, engineVersion: 1, schemaSha256: createHash('sha256').update('{}').digest('hex'), sourceSchemaSha256: createHash('sha256').update('{}').digest('hex') }
  fs.writeFileSync(path.join(helper, 'dependencies.json'), JSON.stringify(metadata))
  fs.mkdirSync(path.join(root, 'electron', 'assets'), { recursive: true })
  const keys = generateKeyPairSync('ed25519', { publicKeyEncoding: { type: 'spki', format: 'pem' } })
  fs.writeFileSync(path.join(root, 'electron', 'assets', 'localization-public-key.pem'), keys.publicKey)
  marketRuntimeFixture(root)
  const success = (file, args, options) => {
    if (path.basename(file) === 'MarketLocalizationSelfTest.exe' || args[0] === '--market-host') return successfulMarketRun(file, args, options)
    assert.equal(JSON.parse(options.input).operation, 'self-test'); return { status: 0, stdout: JSON.stringify({ protocolVersion: 1, type: 'result', success: true, data: { passed: true } }) }
  }
  assert.equal(verifyLocalizationRuntime(root, { run: success }).ready, true)
  fs.writeFileSync(path.join(helper, 'source-schema-cn.json'), '{"tampered":true}')
  assert.throws(() => verifyLocalizationRuntime(root, { run: success }), /指纹不一致/)
  fs.writeFileSync(path.join(helper, 'source-schema-cn.json'), '{}')
  assert.throws(() => verifyLocalizationRuntime(root, { run: () => ({ status: 1 }) }), /自检失败/)
  metadata.schemaSha256 = '0'.repeat(64)
  fs.writeFileSync(path.join(helper, 'dependencies.json'), JSON.stringify(metadata))
  assert.throws(() => verifyLocalizationRuntime(root, { run: success }), /指纹不一致/)
})
