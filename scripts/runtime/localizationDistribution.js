import fs from 'node:fs'
import path from 'node:path'
import { createHash, createPublicKey } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { verifyMarketRuntime } from './marketDistribution.js'

export function verifyLocalizationRuntime(projectRoot, { run = spawnSync } = {}) {
  const root = path.join(projectRoot, '.runtime', 'localization-helper')
  const required = ['LocalizationHelper.exe', 'LocalizationHelper.dll', 'oo2core.dll', 'schema.json', 'source-schema-cn.json', 'dependencies.json', 'LibBundle3-LICENSE.txt', 'coreclr.dll', 'hostfxr.dll', 'hostpolicy.dll', 'System.Private.CoreLib.dll']
  const missing = required.filter(name => !fs.existsSync(path.join(root, name)))
  if (missing.length) throw new Error(`汉化组件分发不完整：${missing.join(', ')}。请先执行 npm run localization:build`)
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'dependencies.json'), 'utf8'))
  const schemaHash = createHash('sha256').update(fs.readFileSync(path.join(root, 'schema.json'))).digest('hex')
  const sourceSchemaHash = createHash('sha256').update(fs.readFileSync(path.join(root, 'source-schema-cn.json'))).digest('hex')
  if (metadata.protocolVersion !== 1 || metadata.engineVersion !== 1 || metadata.schemaSha256 !== schemaHash || metadata.sourceSchemaSha256 !== sourceSchemaHash) throw new Error('汉化组件协议或资源结构指纹不一致，请重新构建组件')
  const publicKey = createPublicKey(fs.readFileSync(path.join(projectRoot, 'electron', 'assets', 'localization-public-key.pem')))
  if (publicKey.asymmetricKeyType !== 'ed25519') throw new Error('翻译资源发布公钥必须为 Ed25519')
  const result = run(path.join(root, 'LocalizationHelper.exe'), [], { input: `${JSON.stringify({ protocolVersion: 1, operation: 'self-test' })}\n`, encoding: 'utf8', windowsHide: true, timeout: 120000 })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error('汉化组件自检失败，不能生成缺失或不可用组件的安装包')
  const messages = String(result.stdout || '').split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line))
  const terminal = messages.filter(message => message.type === 'result')
  if (terminal.length !== 1 || terminal[0].protocolVersion !== 1 || terminal[0].success !== true || terminal[0].data?.passed !== true) throw new Error('汉化组件未通过协议与资源读写自检')
  const market = verifyMarketRuntime(projectRoot, { run })
  return { ready: true, protocolVersion: 1, engineVersion: 1, schemaSha256: schemaHash, market }
}
