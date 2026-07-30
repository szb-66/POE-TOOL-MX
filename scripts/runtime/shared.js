import { createHash } from 'node:crypto'
import { createReadStream, existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const manifestPath = path.join(projectRoot, 'scripts', 'runtime', 'manifest.json')
export const generatedRoot = path.join(projectRoot, '.runtime')
export const runtimeRoot = path.resolve(process.env.POE_RUNTIME_ROOT || path.join(generatedRoot, 'python-runtime'))
export const cacheRoot = path.join(generatedRoot, 'cache')

export async function loadManifest() {
  return JSON.parse(await readFile(manifestPath, 'utf8'))
}

export async function sha256(filePath) {
  const hash = createHash('sha256')
  await new Promise((resolve, reject) => {
    createReadStream(filePath)
      .on('data', (chunk) => hash.update(chunk))
      .on('error', reject)
      .on('end', resolve)
  })
  return hash.digest('hex')
}

export function assertInsideGeneratedRoot(targetPath) {
  const resolved = path.resolve(targetPath)
  const boundary = `${path.resolve(generatedRoot)}${path.sep}`
  if (!resolved.startsWith(boundary)) {
    throw new Error(`拒绝操作生成目录之外的路径: ${resolved}`)
  }
  return resolved
}

export function runtimeExecutable(root = runtimeRoot) {
  return path.join(root, 'python.exe')
}

export function assertProjectFiles(manifest) {
  const missing = [...manifest.requiredScripts, ...manifest.requiredProjectNotices]
    .filter((relativePath) => !existsSync(path.join(projectRoot, relativePath)))
  if (missing.length) throw new Error(`缺少发布所需文件: ${missing.join(', ')}`)
}
