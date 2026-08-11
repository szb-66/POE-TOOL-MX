import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const source = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')
const projectRoot = fileURLToPath(new URL('..', import.meta.url))

function javascriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return javascriptFiles(entryPath)
    return entry.isFile() && /\.(?:c?js|mjs)$/.test(entry.name) ? [entryPath] : []
  })
}

function packagedByRule(relativePath, rules) {
  const normalized = relativePath.replaceAll('\\', '/')
  return rules.some(rule => {
    const normalizedRule = rule.replaceAll('\\', '/')
    if (normalizedRule.startsWith('!')) return false
    if (normalizedRule.endsWith('/**/*')) return normalized.startsWith(normalizedRule.slice(0, -4))
    return normalized === normalizedRule
  })
}

test('发布资产名称、版本标签与校验文件形成稳定契约', () => {
  const packageConfig = JSON.parse(source('../package.json'))
  assert.equal(packageConfig.build.artifactName, 'PoE-CN-Helper-${version}-win-${arch}-setup.${ext}')
  assert.deepEqual(packageConfig.build.win.publish, {
    provider: 'generic',
    url: 'https://cnb.cool/Auto-Tool-MX/POE-TOOL-MX/-/releases/latest/download'
  })
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
  assert.match(release, /actions\/checkout@[a-f0-9]{40}[\s\S]*?fetch-depth:\s*0/)
  assert.match(release, /contents: write/)
  assert.match(release, /id-token: write/)
  assert.match(release, /attestations: write/)
  assert.match(release, /SHA256SUMS\.txt/)
  assert.match(release, /latest\.yml/)
  assert.match(release, /\.blockmap/)
  assert.match(release, /latest\.yml version does not match package version/)
  assert.match(release, /THIRD_PARTY_NOTICES\.md/)
  assert.match(release, /actions\/attest-build-provenance@[a-f0-9]{40}/)
  assert.doesNotMatch(`${ci}\n${release}`, /uses:\s+\S+@(v\d+|main|master)\s*$/m)
})

test('GitHub 正式发布后才同步 CNB 标签且凭据不进入远程地址', () => {
  const release = source('../.github/workflows/release.yml')
  const credentialIndex = release.indexOf('- name: Check CNB mirror credentials')
  const publishIndex = release.indexOf('- name: Publish GitHub Release')
  const syncIndex = release.indexOf('- name: Sync release tag to CNB')
  const branchPushIndex = release.indexOf('HEAD:refs/heads/${{ github.event.repository.default_branch }}', syncIndex)
  const tagPushIndex = release.indexOf('refs/tags/${{ github.ref_name }}:refs/tags/${{ github.ref_name }}', syncIndex)

  assert.ok(credentialIndex >= 0 && publishIndex > credentialIndex && syncIndex > publishIndex)
  assert.ok(branchPushIndex > syncIndex && tagPushIndex > branchPushIndex)
  assert.match(release, /CNB_TOKEN:\s*\$\{\{ secrets\.CNB_TOKEN \}\}/)
  assert.match(release, /https:\/\/cnb\.cool\/Auto-Tool-MX\/POE-TOOL-MX/)
  assert.doesNotMatch(release, /https:\/\/cnb:[^@\s]+@cnb\.cool/)
})

test('CNB 标签流水线只镜像并验证完整发布资产', () => {
  const pipeline = source('../.cnb.yml')
  const requiredAssets = [
    'PoE-CN-Helper-${version}-win-x64-setup.exe',
    '"$installer.blockmap"',
    'latest.yml',
    'SHA256SUMS.txt',
    'THIRD_PARTY_NOTICES.md'
  ]
  for (const asset of requiredAssets) {
    const escapedAsset = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    assert.match(pipeline, new RegExp(escapedAsset))
  }

  const createIndex = pipeline.indexOf('name: Create CNB Release')
  const uploadIndex = pipeline.indexOf('name: Upload CNB Release assets')
  const latestIndex = pipeline.indexOf('name: Mark CNB Release as latest')
  assert.ok(createIndex >= 0 && uploadIndex > createIndex && latestIndex > uploadIndex)
  assert.match(pipeline, /sha256sum --check --strict SHA256SUMS\.txt/)
  assert.match(pipeline, /overlying:\s*true/)
  assert.match(pipeline, /latest:\s*true/)
  assert.doesNotMatch(pipeline, /electron-builder|npm run build|CNB_TOKEN/)
})

test('正式包包含 Electron 主进程引用的源码模块依赖闭包', () => {
  const packageConfig = JSON.parse(source('../package.json'))
  const srcRoot = path.join(projectRoot, 'src')
  const queue = javascriptFiles(path.join(projectRoot, 'electron'))
  const visited = new Set()
  const missing = new Set()

  while (queue.length) {
    const filePath = queue.pop()
    if (visited.has(filePath)) continue
    visited.add(filePath)
    const contents = readFileSync(filePath, 'utf8')
    const imports = contents.matchAll(/(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g)
    for (const [, specifier] of imports) {
      if (!specifier.startsWith('.')) continue
      const dependency = path.resolve(path.dirname(filePath), specifier)
      if (!existsSync(dependency)) continue
      if (dependency.startsWith(`${srcRoot}${path.sep}`)) {
        const relativePath = path.relative(projectRoot, dependency)
        if (!packagedByRule(relativePath, packageConfig.build.files)) missing.add(relativePath)
      }
      if (/\.(?:c?js|mjs)$/.test(dependency)) queue.push(dependency)
    }
  }

  assert.deepEqual([...missing].sort(), [])
})
