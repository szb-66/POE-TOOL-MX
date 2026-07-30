import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const packageConfig = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'))
const version = String(packageConfig.version || '')
const expectedTag = `v${version}`
const tag = process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME || ''

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`package.json 版本不是受支持的 semver: ${version}`)
}
if (tag && tag !== expectedTag) {
  throw new Error(`版本标签不一致: ${tag} != ${expectedTag}`)
}
if (process.env.GITHUB_REF_TYPE === 'tag' && !tag) {
  throw new Error('标签发布缺少 GITHUB_REF_NAME')
}

process.stdout.write(`${JSON.stringify({ version, expectedTag, tag: tag || null })}\n`)
