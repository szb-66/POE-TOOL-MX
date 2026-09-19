import { createRequire } from 'node:module'
import { globSync, readFileSync, statSync } from 'node:fs'
import { copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { FileMatcher } = require('app-builder-lib/out/fileMatcher.js')
const checker = fileURLToPath(new URL('./checkScriptImports.py', import.meta.url))
const slash = value => value.replaceAll('\\', '/')

export function scriptDistribution(projectRoot, config, manifest) {
  const sources = globSync('src/assets/scripts/*.py', { cwd: projectRoot }).map(slash).sort()
  const listed = new Set(manifest.requiredScripts)
  const missing = sources.filter(source => !listed.has(source))
  if (missing.length) throw new Error(`运行时脚本清单漏登: ${missing.join(', ')}`)
  const files = new FileMatcher(projectRoot, '', value => value, config.build.files).createFilter()
  const unpack = new FileMatcher(projectRoot, '', value => value, config.build.asarUnpack).createFilter()
  const entries = []
  for (const source of sources) {
    const absolute = path.join(projectRoot, source)
    const info = statSync(absolute)
    if (files(absolute, info) && unpack(absolute, info)) {
      entries.push({ source, target: `app.asar.unpacked/${source}` })
    }
  }
  for (const resource of config.build.extraResources) {
    if (typeof resource !== 'object' || !resource.from.endsWith('.py')) continue
    entries.push({ source: resource.from, target: slash(resource.to) })
    if (!listed.has(resource.from)) throw new Error(`运行时脚本清单漏登: ${resource.from}`)
  }
  return { entries, modules: [...new Set(sources.map(source => path.basename(source, '.py')))] }
}

export function assertScriptDistribution(resourcesRoot, layout, pythonPath) {
  const result = spawnSync(pythonPath, ['-I', '-B', checker], {
    cwd: resourcesRoot,
    input: JSON.stringify({ resourcesRoot, targets: layout.entries.map(entry => entry.target), modules: layout.modules }),
    encoding: 'utf8', windowsHide: true, timeout: 30000
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`Python 业务脚本分发检查失败: ${(result.stdout || result.stderr).trim()}`)
  }
}

export async function withStagedScripts(projectRoot, layout, action) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'poe-script-distribution-'))
  try {
    for (const { source, target } of layout.entries) {
      const destination = path.resolve(root, target)
      if (!destination.startsWith(`${root}${path.sep}`)) throw new Error('脚本目标超出临时目录')
      await mkdir(path.dirname(destination), { recursive: true })
      await copyFile(path.join(projectRoot, source), destination)
    }
    return await action(root)
  } finally {
    // root is the absolute directory returned by mkdtemp, never a caller-supplied path.
    await rm(root, { recursive: true, force: true })
  }
}

export async function verifyStagedScripts(projectRoot, manifest, pythonPath) {
  const config = JSON.parse(readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
  const layout = scriptDistribution(projectRoot, config, manifest)
  await withStagedScripts(projectRoot, layout, root => assertScriptDistribution(root, layout, pythonPath))
}
