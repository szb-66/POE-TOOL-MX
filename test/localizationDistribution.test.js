import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createHash, generateKeyPairSync } from 'node:crypto'
import { verifyLocalizationRuntime } from '../scripts/runtime/localizationDistribution.js'

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
  const metadata = { protocolVersion: 1, engineVersion: 1, schemaSha256: createHash('sha256').update('{}').digest('hex') }
  fs.writeFileSync(path.join(helper, 'dependencies.json'), JSON.stringify(metadata))
  fs.mkdirSync(path.join(root, 'electron', 'assets'), { recursive: true })
  const keys = generateKeyPairSync('ed25519', { publicKeyEncoding: { type: 'spki', format: 'pem' } })
  fs.writeFileSync(path.join(root, 'electron', 'assets', 'localization-public-key.pem'), keys.publicKey)
  const success = (file, args, options) => { assert.equal(JSON.parse(options.input).operation, 'self-test'); return { status: 0, stdout: JSON.stringify({ protocolVersion: 1, type: 'result', success: true, data: { passed: true } }) } }
  assert.equal(verifyLocalizationRuntime(root, { run: success }).ready, true)
  assert.throws(() => verifyLocalizationRuntime(root, { run: () => ({ status: 1 }) }), /自检失败/)
  metadata.schemaSha256 = '0'.repeat(64)
  fs.writeFileSync(path.join(helper, 'dependencies.json'), JSON.stringify(metadata))
  assert.throws(() => verifyLocalizationRuntime(root, { run: success }), /指纹不一致/)
})
