import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import {
  assertProjectFiles,
  loadManifest,
  runtimeExecutable,
  runtimeRoot
} from './shared.js'

export function verifyRuntime(root, manifest) {
  assertProjectFiles(manifest)
  const executable = runtimeExecutable(root)
  const required = [
    executable,
    path.join(root, 'python313._pth'),
    path.join(root, 'python313.zip'),
    path.join(root, 'LICENSE.txt'),
    path.join(root, 'runtime-manifest.json'),
    path.join(root, 'runtime-build.json')
  ]
  const missing = required.filter((filePath) => !existsSync(filePath))
  if (missing.length) throw new Error(`内置运行时文件不完整: ${missing.map(path.basename).join(', ')}`)

  const modules = manifest.packages.map((entry) => entry.importName)
  const probe = [
    'import json, platform, struct, sys',
    ...modules.map((name) => `import ${name}`),
    `print(json.dumps({"version": platform.python_version(), "bits": struct.calcsize("P") * 8, "modules": ${JSON.stringify(modules)}}))`
  ].join('; ')
  const result = spawnSync(executable, ['-I', '-c', probe], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 30000
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`内置运行时探测失败: ${(result.stderr || result.stdout).trim()}`)
  const info = JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1))
  if (info.version !== manifest.python.version) {
    throw new Error(`Python 版本不匹配: ${info.version} != ${manifest.python.version}`)
  }
  if (info.bits !== 64) throw new Error(`Python 架构不是 x64: ${info.bits} bit`)
  return { ready: true, source: 'bundled', path: executable, ...info }
}

async function main() {
  const manifest = await loadManifest()
  const embeddedManifest = JSON.parse(await readFile(path.join(runtimeRoot, 'runtime-manifest.json'), 'utf8'))
  if (JSON.stringify(embeddedManifest) !== JSON.stringify(manifest)) {
    throw new Error('内置运行时清单与仓库清单不一致，请重新执行 runtime:prepare')
  }
  const result = verifyRuntime(runtimeRoot, manifest)
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`)
  process.exitCode = 1
})
