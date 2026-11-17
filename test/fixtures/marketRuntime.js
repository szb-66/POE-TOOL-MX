import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

export function marketStructureProof() {
  return { structureVersion: 1, abi: 'poe1-market-json16-msvc-string32-v1',
    ...Object.fromEntries(['lookup', 'searchBuilder', 'stringCtor', 'stringDtor', 'itemsReader', 'statsReader', 'filtersReader']
      .map((name, index) => [name, { rva: `0x${(0x1000 + index * 0x100).toString(16)}`, prologue: 'ab'.repeat(64), bodySize: 64, bodySha256: 'b'.repeat(64) }])) }
}
const profile = { schemaVersion: 1, game: 'poe1', gameVersion: '3.30.0b', validatedInGame: true, buildId: '26673341', sha256: 'a'.repeat(64), ...marketStructureProof() }
const hash = text => createHash('sha256').update(text).digest('hex')
export function marketRuntimeFixture(root) {
  const runtime = path.join(root, '.runtime', 'localization-helper')
  const source = path.join(root, 'electron', 'native', 'market-localization')
  const catalog = path.join(root, 'electron', 'assets', 'market-localization')
  for (const directory of [runtime, source, catalog]) fs.mkdirSync(directory, { recursive: true })
  for (const name of ['MarketLocalizationHook.dll', 'MarketLocalizationSelfTest.exe', 'MinHook-LICENSE.txt', 'nlohmann-json-LICENSE.txt']) fs.writeFileSync(path.join(runtime, name), '')
  const encoded = JSON.stringify(profile)
  fs.writeFileSync(path.join(runtime, 'market-compatibility.json'), encoded)
  fs.writeFileSync(path.join(source, 'compatibility.json'), encoded)
  fs.writeFileSync(path.join(catalog, 'catalog.json'), JSON.stringify({ schemaVersion: 1, game: 'poe1', sourceLocale: 'fr', gameVersion: profile.gameVersion, buildId: profile.buildId, executableSha256: profile.sha256, rules: [{ section: 'filters', field: 'title', id: 'type_filters', cn: '类型筛选' }] }))
  fs.writeFileSync(path.join(runtime, 'market-dependencies.json'), JSON.stringify({ protocolVersion: 1, minhookCommit: 'c3fcafdc10146beb5919319d0683e44e3c30d537', jsonVersion: '3.11.3', dllSha256: hash(''), selfTestSha256: hash(''), profileSha256: hash(encoded) }))
  return { runtime, source, catalog }
}
export function successfulMarketRun(file, args, options) {
  if (path.basename(file) === 'MarketLocalizationSelfTest.exe') return { status: 0, stdout: 'market self-test: 23 cases passed\n' }
  return { status: 0, stdout: JSON.stringify({ marketProtocolVersion: 1, type: 'result', success: true, data: { passed: true, pipeSecurityCases: 4, resumeCases: 4, structureCases: 1, validatedRules: JSON.parse(options.input).rules.length, buildId: profile.buildId, executableSha256: profile.sha256 } }) }
}
