import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

export function verifyMarketRuntime(projectRoot, { run = spawnSync } = {}) {
  const root = path.join(projectRoot, '.runtime', 'localization-helper')
  const required = ['MarketLocalizationHook.dll', 'MarketLocalizationSelfTest.exe', 'market-compatibility.json', 'market-dependencies.json', 'MinHook-LICENSE.txt', 'nlohmann-json-LICENSE.txt']
  const missing = required.filter(name => !fs.existsSync(path.join(root, name)))
  if (missing.length) throw new Error(`市集翻译组件分发不完整：${missing.join(', ')}。请执行 npm run localization:build`)
  const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'market-dependencies.json'), 'utf8'))
  const profile = JSON.parse(fs.readFileSync(path.join(root, 'market-compatibility.json'), 'utf8'))
  const sourceProfile = path.join(projectRoot, 'electron', 'native', 'market-localization', 'compatibility.json')
  if (metadata.protocolVersion !== 1 || metadata.minhookCommit !== 'c3fcafdc10146beb5919319d0683e44e3c30d537' || metadata.jsonVersion !== '3.11.3'
      || metadata.dllSha256 !== hash(path.join(root, 'MarketLocalizationHook.dll'))
      || metadata.selfTestSha256 !== hash(path.join(root, 'MarketLocalizationSelfTest.exe'))
      || metadata.profileSha256 !== hash(path.join(root, 'market-compatibility.json'))
      || metadata.profileSha256 !== hash(sourceProfile)) throw new Error('市集翻译组件协议、依赖或指纹不一致')
  if (profile.schemaVersion !== 1 || profile.game !== 'poe1' || profile.validatedInGame !== true || !/^[a-f0-9]{64}$/.test(profile.sha256 || '')) throw new Error('市集翻译兼容资料尚未通过真实游戏验证')
  const native = run(path.join(root, 'MarketLocalizationSelfTest.exe'), [], { encoding: 'utf8', windowsHide: true, timeout: 30000 })
  if (native.error) throw native.error
  if (native.status !== 0 || !/market self-test: \d+ cases passed/.test(String(native.stdout))) throw new Error('市集翻译原生自检失败')
  const catalog = JSON.parse(fs.readFileSync(path.join(projectRoot, 'electron', 'assets', 'market-localization', 'catalog.json'), 'utf8'))
  if (catalog.schemaVersion !== 1 || catalog.game !== 'poe1' || catalog.sourceLocale !== 'fr'
      || catalog.buildId !== profile.buildId || catalog.gameVersion !== profile.gameVersion || catalog.executableSha256 !== profile.sha256
      || !Array.isArray(catalog.rules) || !catalog.rules.length) throw new Error('市集翻译目录缺失、版本不符或格式错误')
  const host = run(path.join(root, 'LocalizationHelper.exe'), ['--market-host'], { input: `${JSON.stringify({ marketProtocolVersion: 1, operation: 'self-test', rules: catalog.rules })}\n`, encoding: 'utf8', windowsHide: true, timeout: 30000 })
  if (host.error) throw host.error
  const terminal = String(host.stdout || '').split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line))
  if (host.status !== 0 || terminal.length !== 1 || terminal[0].marketProtocolVersion !== 1 || terminal[0].type !== 'result' || terminal[0].success !== true || terminal[0].data?.passed !== true || !(terminal[0].data?.pipeSecurityCases >= 4) || !(terminal[0].data?.resumeCases >= 4) || terminal[0].data?.validatedRules !== catalog.rules.length || terminal[0].data?.executableSha256 !== profile.sha256 || terminal[0].data?.buildId !== profile.buildId) throw new Error('市集翻译控制进程自检失败')
  return { ready: true, protocolVersion: 1, buildId: profile.buildId, executableSha256: profile.sha256, rules: catalog.rules.length }
}
