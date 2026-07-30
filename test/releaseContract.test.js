import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('发布资产名称、版本标签与校验文件形成稳定契约', () => {
  const packageConfig = JSON.parse(source('../package.json'))
  assert.equal(packageConfig.build.artifactName, 'PoE-CN-Helper-${version}-win-${arch}-setup.${ext}')
  assert.equal(packageConfig.scripts['release:check'], 'node scripts/release/checkVersion.js')
  assert.equal(packageConfig.scripts['release:checksum'], 'node scripts/release/checksum.js')
  assert.equal(packageConfig.scripts['release:smoke'], 'node scripts/release/smokePackage.js')
  assert.match(source('../scripts/release/checkVersion.js'), /tag !== expectedTag/)
  assert.match(source('../scripts/release/checksum.js'), /SHA256SUMS\.txt/)
  assert.match(source('../scripts/release/smokePackage.js'), /runtime-ok/)
})

test('Windows CI 与标签发布固定 Action 提交并使用最小化权限', () => {
  const ci = source('../.github/workflows/windows-ci.yml')
  const release = source('../.github/workflows/release.yml')
  assert.match(ci, /permissions:\s*\n\s*contents: read/)
  assert.match(ci, /npm run runtime:prepare/)
  assert.match(ci, /npm run release:smoke/)
  assert.match(release, /tags:\s*\n\s*- "v\*"/)
  assert.match(release, /contents: write/)
  assert.match(release, /id-token: write/)
  assert.match(release, /attestations: write/)
  assert.match(release, /SHA256SUMS\.txt/)
  assert.match(release, /THIRD_PARTY_NOTICES\.md/)
  assert.match(release, /actions\/attest-build-provenance@[a-f0-9]{40}/)
  assert.doesNotMatch(`${ci}\n${release}`, /uses:\s+\S+@(v\d+|main|master)\s*$/m)
})
