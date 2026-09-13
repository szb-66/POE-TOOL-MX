import { createRequire } from 'node:module'
import { readdir, stat, cp } from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { FileMatcher } = require('app-builder-lib/out/fileMatcher.js')
export const frontendPackages = ['vue', 'vue-router', 'pinia', 'element-plus', '@element-plus/icons-vue']

export function runtimeFilter(root, config) {
  const resource = config.build.extraResources.find(entry => entry.to === 'python-runtime')
  const matcher = new FileMatcher(path.resolve(root), '', value => value, resource.filter || ['**/*'])
  // builder-util's copyDir walker skips these names before applying FileMatcher.
  matcher.addPattern('!**/{.gitkeep,.DS_Store}{,/**/*}')
  return matcher.createFilter()
}

export async function inventory(root, filter = () => true) {
  const result = []
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name)
      const info = await stat(absolute)
      if (!filter(absolute, info)) continue
      if (entry.isDirectory()) await visit(absolute)
      else result.push({ path: path.relative(root, absolute).replaceAll('\\', '/'), bytes: info.size })
    }
  }
  await visit(root)
  return result.sort((a, b) => a.path.localeCompare(b.path))
}

export async function copyRuntime(source, destination, config) {
  const filter = runtimeFilter(source, config)
  await cp(source, destination, { recursive: true, filter: async file => filter(file, await stat(file)) })
}

export async function assertRuntimeDistribution(source, destination, config) {
  const expected = await inventory(source, runtimeFilter(source, config))
  const actual = await inventory(destination)
  const allowed = runtimeFilter(destination, config)
  const prohibited = actual.filter(entry => !allowed(path.join(destination, entry.path), { isDirectory: () => false }))
  const byPath = new Map(actual.map(entry => [entry.path, entry.bytes]))
  const missing = expected.filter(entry => byPath.get(entry.path) !== entry.bytes)
  if (prohibited.length || missing.length) {
    throw new Error(`Python 分发不完整或包含冗余: ${[...prohibited, ...missing].map(entry => entry.path).join(', ')}`)
  }
  return { expected, actual }
}

export function assertNoFrontendPackages(paths) {
  const forbidden = paths.filter(entry => frontendPackages.some(name =>
    `/${entry.replaceAll('\\', '/').replace(/^\//, '')}/`.includes(`/node_modules/${name}/`)))
  if (forbidden.length) throw new Error(`分发包含前端依赖: ${forbidden.join(', ')}`)
}

export function assertApplicationDependencies(paths, config) {
  assertNoFrontendPackages(paths)
  const files = new Set(paths.map(entry => entry.replaceAll('\\', '/').replace(/^\//, '')))
  const missing = Object.keys(config.dependencies).filter(name => !files.has(`node_modules/${name}/package.json`))
  if (missing.length) throw new Error(`分发缺少主进程依赖: ${missing.join(', ')}`)
}
